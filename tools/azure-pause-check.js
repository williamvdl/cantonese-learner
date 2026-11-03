#!/usr/bin/env node
/* azure-pause-check.js — the gate before the Azure listening probe.
 *
 * ── THE ONE QUESTION ────────────────────────────────────────────────────────
 * When a clip contains a mid-sentence pause, does Azure transcribe the WHOLE
 * clip, or does it stop at the first silence the way Chrome on Android does?
 *
 * BACKLOG § Features "NEXT UP — Listening cuts out at a pause" proposes
 * record-then-transcribe: hold the mic open with no endpointer, then post the
 * whole clip to Azure. That only helps if Azure does not apply an endpointer of
 * its own. Microsoft documents single-shot recognition as ending "by listening
 * for silence at the end" of a single utterance, and the short-audio REST page
 * does not say whether it behaves the same way. If it does, the phone probe as
 * briefed would fail for exactly the reason it was meant to fix, after a
 * recording front end had been built for it. This answers that first, on the
 * desktop, in about a minute (PROBE_METHOD: ask the cheapest question that
 * could kill the idea, and ask only that first).
 *
 * Three endpoints are asked, because the answer chooses between them:
 *   rest  Short-audio REST, the one the brief names, already proven reachable
 *         from a browser origin (STATUS § Notes, the Azure pronunciation work).
 *         …/speech/recognition/conversation/cognitiveservices/v1
 *   fast  Fast transcription, built to transcribe a whole file synchronously.
 *         zh-HK is in Microsoft's fast-transcription locale list. NOT yet proven
 *         from a browser, and Microsoft lists its limits for the paid S0 tier
 *         only, so it may be unavailable on a free resource. That is reported as
 *         UNAVAILABLE with the response body, never as a fail.
 *         …/speechtotext/transcriptions:transcribe?api-version=2024-11-15
 *   gemini gemini-3.5-transcribe, Google's transcription model, added on
 *         2026-11-03 as the backup candidate (BACKLOG § Features, "Evaluate
 *         gemini-3.5-transcribe"). Called through generateContent, the same
 *         endpoint the app's Translate screen already calls from the browser.
 *         Cantonese (yue-Hant-HK) is listed as Experimental, and the model is in
 *         preview. Three settings, each deliberate:
 *           - languageCodes yue-Hant-HK, not auto-detect, so a Mandarin guess
 *             cannot pass for a Cantonese result;
 *           - mode left at its default, VERBATIM. SMART mode may rewrite
 *             wording, which on a speaking check would tidy away the very
 *             error a learner made;
 *           - wordTimestamp on, for the same independent timing signal the
 *             Azure endpoints give.
 *         customVocabulary is deliberately NOT sent. Biasing toward the target
 *         is a real candidate for the phone probe, but here it could make the
 *         model "hear" clause 2 from the vocabulary rather than the audio, and
 *         contaminate the one thing this measures.
 *         …/v1beta/models/gemini-3.5-transcribe:generateContent
 *
 * Cost if the Gemini key's project has billing on: about 3 minutes of audio
 * at roughly US$0.005 a minute — about a cent. On the free tier, Google may use
 * submitted content to improve its products; every clip here is synthetic
 * Azure speech, so none of your own voice is sent.
 *
 * ── HOW THE INPUT IS BUILT — the right answer is known by construction ──────
 * Sentences are derived from the corpus, never hand-typed: every topic sentence
 * with exactly two clauses split at a full-width comma, each side holding at
 * least three Chinese characters, spread evenly by sid. Each clause is
 * synthesised separately by Azure TTS (WanLung, the narrator voice) as raw
 * 16kHz PCM, then joined here with a silence of EXACTLY the pause length:
 *
 *     300ms lead · clause 1 · PAUSE · clause 2 · 600ms tail
 *
 * Because the silence is inserted as samples rather than asked for in SSML, the
 * position of clause 2 is known to the millisecond. Clause 1 keeps its comma, so
 * it is voiced as a continuation rather than a finished sentence. Pause 0 is
 * the CONTROL: the same two clauses with nothing between them.
 *
 * The silence is digital zero, which is the clearest pause an endpointer will
 * ever see. That makes this the HARSH case: an endpoint that carries on through
 * digital silence will carry on through a room's noise floor. The reverse is not
 * guaranteed, so a PASS here is necessary for the phone probe, not sufficient.
 *
 * ── WHAT THIS DOES NOT TEST ─────────────────────────────────────────────────
 * Not accuracy, not the matcher, not a human voice, not the Pixel's mic, not
 * browser CORS. A synthetic voice is used on purpose: it removes every variable
 * except the one asked about. All of that is the phone probe's job, if this
 * passes. Because nothing here mirrors a shipped handler, nothing is lifted from
 * app.js — PROBE_METHOD's lift-the-handler rule has nothing to apply to.
 *
 * ── HOW EACH ATTEMPT IS SCORED ──────────────────────────────────────────────
 * Characters are COUNTED, not matched. Azure spells differently from Google
 * (homophones, digits for numerals), and matching would mix the question "did it
 * hear clause 2 at all" with "did it spell clause 2 our way". Dropping a clause
 * loses three or more characters, which a count sees plainly.
 *   heard  = Chinese characters (CJK + Extension A, so 㗎 (gaa3) counts) plus
 *            one per run of Latin letters or digits in the transcript.
 *   COVERED    heard >= clause1 + half of clause2 (rounded up)
 *   DROPPED    heard <= clause1 + 1
 *   PARTIAL    anything between. Read the raw transcript.
 *   NO-DECODE  no transcript at all — status not Success, or empty text.
 *              Counted apart from DROPPED: silence is not evidence either way.
 * Timing is a second, independent signal. Each endpoint reports where the
 * recognised speech ends; "reaches clause 2" means it ends past the start of
 * clause 2 plus 30% of clause 2's length. Where text and timing disagree the
 * attempt is flagged "!" and counted. A disagreement is a reason to read the raw
 * response, not to pick whichever signal suits.
 *
 * ── PASS BAR — written before any data exists ───────────────────────────────
 * Per endpoint:
 *   CHECK BROKEN  any control (pause 0) attempt not COVERED. The check itself is
 *                 wrong, so this is not a finding: stop and instrument.
 *   UNAVAILABLE   the endpoint refused the request (HTTP 400, 401, 403 or
 *                 404). Not a fail. Read the printed body: a tier, a region, a
 *                 model this key cannot use, or a request shape the service
 *                 rejected. A 429 that outlasts the retries is not a refusal —
 *                 it is counted as NO-DECODE, since no transcript came back.
 *   PASS          every attempt with a pause of 1000–5000ms is COVERED.
 *   FAIL          any attempt with a pause of 1000–5000ms is DROPPED.
 *   INCONCLUSIVE  anything else — a PARTIAL, a text/timing disagreement, or
 *                 more than a quarter of attempts NO-DECODE. Read the raw file.
 * Pauses above 5000ms are reported, never scored: they show headroom.
 *
 * Why 5000ms: to be worth building, the endpoint has to outlast Chrome. On the
 * Pixel, Chrome ended two un-stopped attempts by itself at 4,644ms and 4,935ms
 * of total attempt length (tools/fixtures/tail-probe-numbers-t1-s03.json), and
 * others report roughly 3–4 seconds of silence. A pause of 5000ms is longer
 * than any of those.
 *
 * Why "every", not a percentage: whether an endpoint segments on silence is a
 * property of the service, not a rate. One dropped clause at 2000ms means it
 * segments.
 *
 * Why this is NOT the inherited ≤10% false-reject bar. That bar
 * (tools/translate-reject-probe.html, from tools/asr-probe.html) answers "does
 * the matcher accept correct readings", and the phone probe still uses it,
 * unchanged. This asks a different class of question — does the service return
 * the whole clip — for which no earlier probe declared a bar. This is not a
 * second answer to the first question.
 *
 * ── WHAT EACH RESULT LEADS TO — also decided before the data ────────────────
 *   rest PASS             The brief stands. Build the phone probe against REST.
 *   rest FAIL, fast PASS  The brief changes endpoint. The next cheapest question
 *                         is whether fast transcription is reachable from a
 *                         browser origin (CORS) on this resource and tier.
 *   both FAIL             Record-then-transcribe is dead on Azure. Remaining:
 *                         the Speech SDK's continuous recognition with a
 *                         configurable segmentation silence, or the Continue
 *                         button fallback the brief already names.
 *   fast UNAVAILABLE      Read the body: tier or region. Not a fail. Expected
 *                         on a free (F0) Speech resource.
 *   Azure fails, gemini PASS
 *                         Gemini becomes the phone probe's back end. Browser
 *                         reach is already shown for this endpoint (Translate
 *                         calls it), and it would use the learner's own Gemini
 *                         key from Settings rather than ours.
 *   Azure and gemini both PASS
 *                         Azure stays first: the key, the free tier's hard cap
 *                         and zh-HK are all proven, while Gemini's Cantonese is
 *                         Experimental and the model is in preview. Gemini is
 *                         kept as the named fallback.
 *   gemini UNAVAILABLE    Read the body: model access, free tier, or request
 *                         shape. Not a fail.
 *
 * ── USAGE ───────────────────────────────────────────────────────────────────
 * Needs the same SPEECH_KEY and SPEECH_REGION environment variables as
 * generate-audio.js — always, because Azure TTS makes the clips. The gemini
 * arm also needs GEMINI_API_KEY, the same key the app's Settings holds; set it
 * the same way (Windows: setx GEMINI_API_KEY <key>, then a NEW terminal). If it
 * is not set, the gemini arm is skipped with a warning and the rest still runs.
 * Node 18 or later (built-in fetch, FormData, Blob). No npm.
 *
 *   node tools/azure-pause-check.js --dry          the sentences and plan; no API calls, no key
 *   node tools/azure-pause-check.js                run it
 *   node tools/azure-pause-check.js --only=rest    one endpoint (rest, fast or gemini)
 *   node tools/azure-pause-check.js --keep-audio   also write each WAV, to listen to
 *   node tools/azure-pause-check.js --sentences=4 --pauses=0,1000,2000,3000,5000,8000
 *
 * Calls run one at a time: the free tier allows one concurrent recognition.
 * Default run: 4 sentences × 6 pauses × 3 endpoints = 72 recognitions, about
 * 3 minutes of audio per endpoint against Azure's free 5 hours a month, plus
 * 8 short TTS calls. Rate limits are met with a back-off of up to about 75
 * seconds per call, so a free Gemini key may make the run slower, not fail it.
 *
 * Output: a summary on screen, and every raw response, round-trip time and the
 * construction timings in tools/fixtures/azure-pause-check-<date>.json. The raw
 * responses are what make a surprising result readable afterwards.
 *
 * Not a standing check: it asserts no invariant, and once answered it is dead.
 * Not precached, not linked from the app, no shared CSS — no sw.js bump.
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const CHECK_VERSION = 'azure-pause-check 2 · 2026-11-03';   // 2: gemini arm added

const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'data');
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));

// ── Arguments ────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const arg = name => {
  const hit = argv.find(a => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return null;
  return hit.includes('=') ? hit.slice(hit.indexOf('=') + 1) : true;
};
const DRY = !!arg('dry');
const KEEP_AUDIO = !!arg('keep-audio');
const N_SENTENCES = Number(arg('sentences')) || 4;
const PAUSES = String(arg('pauses') || '0,1000,2000,3000,5000,8000')
  .split(',').map(Number).filter(n => Number.isFinite(n) && n >= 0);
const ONLY = arg('only');
const ALL_ENDPOINTS = ['rest', 'fast', 'gemini'];
if (ONLY && !ALL_ENDPOINTS.includes(ONLY)) fail(`--only takes one of: ${ALL_ENDPOINTS.join(', ')}`);
let ENDPOINTS = ALL_ENDPOINTS.filter(e => !ONLY || ONLY === e);

const SCORED_MIN = 1000, SCORED_MAX = 5000;   // the pass bar's window
const VOICE = 'zh-HK-WanLungNeural';          // the narrator voice, generate-audio.js
const RATE = 16000;                           // samples per second, 16-bit mono
const LEAD_MS = 300, TAIL_MS = 600;
const FAST_API_VERSION = '2024-11-15';        // the GA version
const GEMINI_MODEL = 'gemini-3.5-transcribe';
const GEMINI_LANGUAGE = 'yue-Hant-HK';
// Refusals, as opposed to transient failures. A 429 is not here on purpose.
const REFUSED = new Set([400, 401, 403, 404]);

function fail(msg) { console.error('\n' + msg + '\n'); process.exit(1); }

// Lifted from generate-audio.js.
function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

// ── Counting ─────────────────────────────────────────────────────────────────
// Extension A (U+3400–U+4DBF) is in the class on purpose: 㗎 (gaa3) lives there,
// and leaving it out has already dropped sentences once (asr-testset.js).
const HAN = /[㐀-䶿一-鿿]/g;
const hanCount = s => (String(s || '').match(HAN) || []).length;
// One per run of Latin letters or digits, so "3" for 三 (saam1) still counts.
// A multi-digit run undercounts by a character or two, which the thresholds'
// margin absorbs: a dropped clause loses three or more.
const heardCount = s => hanCount(s) + (String(s || '').match(/[A-Za-z0-9]+/g) || []).length;

// ── Derive the sentences from the corpus ────────────────────────────────────
function deriveSentences(n) {
  const pool = [];
  const files = fs.readdirSync(path.join(DATA, 'topics')).filter(f => f.endsWith('.json')).sort();
  for (const f of files) {
    const t = read(path.join(DATA, 'topics', f));
    for (const round of Object.values(t.rounds || {})) {
      for (const s of (round.sentences || [])) {
        const parts = String(s.c).split('，');
        if (parts.length !== 2) continue;
        const [a, b] = parts;
        if (hanCount(a) < 3 || hanCount(b) < 3) continue;
        // The comma stays on clause 1 so it is voiced as a continuation.
        const jp = String(s.j || '').split(',');
        pool.push({
          sid: s.sid, c: s.c, j: s.j, e: s.e,
          clause1: a + '，', clause2: b,
          j1: (jp[0] || '').trim(), j2: (jp.slice(1).join(',') || '').trim(),
          han1: hanCount(a), han2: hanCount(b),
        });
      }
    }
  }
  pool.sort((x, y) => x.sid < y.sid ? -1 : x.sid > y.sid ? 1 : 0);
  if (!pool.length) fail('No two-clause sentences found — the corpus shape has changed.');
  // An even spread by sid, so the pick crosses topics rather than taking the
  // first four from one file.
  const k = Math.min(n, pool.length);
  const picks = [];
  for (let i = 0; i < k; i++) {
    const idx = k === 1 ? 0 : Math.round(i * (pool.length - 1) / (k - 1));
    picks.push(pool[idx]);
  }
  return { pool: pool.length, picks };
}

// ── Audio construction ──────────────────────────────────────────────────────
const msToBytes = ms => Math.round(ms * RATE / 1000) * 2;
const bytesToMs = b => (b / 2) * 1000 / RATE;

function wavFromPcm(pcm) {
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8);
  h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20);   // PCM
  h.writeUInt16LE(1, 22); h.writeUInt32LE(RATE, 24); h.writeUInt32LE(RATE * 2, 28);
  h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

// Returns the WAV plus where everything sits in it, in milliseconds.
function buildClip(pcm1, pcm2, pauseMs) {
  const parts = [Buffer.alloc(msToBytes(LEAD_MS)), pcm1, Buffer.alloc(msToBytes(pauseMs)), pcm2, Buffer.alloc(msToBytes(TAIL_MS))];
  const pcm = Buffer.concat(parts);
  const c1Start = LEAD_MS;
  const c1End = c1Start + bytesToMs(pcm1.length);
  const c2Start = c1End + pauseMs;
  const c2End = c2Start + bytesToMs(pcm2.length);
  return { wav: wavFromPcm(pcm), timing: { c1Start, c1End, c2Start, c2End, totalMs: bytesToMs(pcm.length) } };
}

// ── Azure calls ─────────────────────────────────────────────────────────────
// Free tiers rate-limit hard, and Gemini's 429 does not always carry a
// retry-after, so the fallback back-off is long: 5, 10, 15, 20, 25 seconds.
async function withRetry(fn, label) {
  for (let attempt = 1; ; attempt++) {
    const res = await fn();
    if (res.status !== 429 || attempt >= 6) return res;
    const wait = (Number(res.headers.get('retry-after')) || attempt * 5) * 1000;
    console.log(`  ${label}: 429, waiting ${wait}ms`);
    await new Promise(r => setTimeout(r, wait));
  }
}

async function synthPcm(text, creds) {
  // TTS call as generate-audio.js makes it, asking for headerless 16kHz PCM so
  // clauses and silence can be joined sample-exactly.
  const ssml = `<speak version='1.0' xml:lang='zh-HK'><voice name='${VOICE}'>${escapeXml(text)}</voice></speak>`;
  const res = await withRetry(() => fetch(`https://${creds.region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': creds.key,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'raw-16khz-16bit-mono-pcm',
      'User-Agent': 'cantonese-learner-azure-pause-check',
    },
    body: ssml,
  }), 'tts');
  if (!res.ok) fail(`Azure TTS ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const buf = Buffer.from(await res.arrayBuffer());
  // Judge the payload, not the status: a 200 with no audio is a failure.
  if (buf.length < msToBytes(200)) fail(`Azure TTS returned ${buf.length} bytes for "${text}" — too short to be speech.`);
  return buf;
}

// Each recogniser returns the same normalised shape, with the raw body kept.
async function recogniseRest(wav, creds) {
  // URL and headers as tools/align-check.html sends them, minus pronunciation
  // assessment. format=detailed gives NBest[0].Lexical, which is free of the
  // inverse text normalisation that turns numerals into digits.
  const url = `https://${creds.region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=zh-HK&format=detailed`;
  const t0 = Date.now();
  const res = await withRetry(() => fetch(url, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': creds.key,
      'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
      'Accept': 'application/json',
    },
    body: wav,
  }), 'rest');
  const rttMs = Date.now() - t0;
  const body = await res.text();
  let json = null; try { json = JSON.parse(body); } catch (e) { /* kept raw */ }
  if (!res.ok) return { http: res.status, rttMs, raw: json || body, unavailable: REFUSED.has(res.status) };
  const nb = json && Array.isArray(json.NBest) ? json.NBest[0] : null;
  const text = (nb && (nb.Lexical || nb.Display)) || (json && json.DisplayText) || '';
  const ok = json && json.RecognitionStatus === 'Success' && text;
  const endMs = json && Number.isFinite(json.Offset) && Number.isFinite(json.Duration)
    ? (json.Offset + json.Duration) / 10000 : null;   // 100ns ticks
  return { http: res.status, rttMs, raw: json || body, status: json && json.RecognitionStatus, text: ok ? text : '', endMs };
}

async function recogniseFast(wav, creds) {
  const url = `https://${creds.region}.api.cognitive.microsoft.com/speechtotext/transcriptions:transcribe?api-version=${FAST_API_VERSION}`;
  const t0 = Date.now();
  const res = await withRetry(() => {
    const form = new FormData();
    form.append('audio', new Blob([wav], { type: 'audio/wav' }), 'clip.wav');
    form.append('definition', JSON.stringify({ locales: ['zh-HK'] }));
    return fetch(url, { method: 'POST', headers: { 'Ocp-Apim-Subscription-Key': creds.key, 'Accept': 'application/json' }, body: form });
  }, 'fast');
  const rttMs = Date.now() - t0;
  const body = await res.text();
  let json = null; try { json = JSON.parse(body); } catch (e) { /* kept raw */ }
  if (!res.ok) return { http: res.status, rttMs, raw: json || body, unavailable: REFUSED.has(res.status) };
  const combined = json && Array.isArray(json.combinedPhrases) ? json.combinedPhrases.map(p => p.text || '').join('') : '';
  const phrases = json && Array.isArray(json.phrases) ? json.phrases : [];
  const text = combined || phrases.map(p => p.text || '').join('');
  const ends = phrases.map(p => (p.offsetMilliseconds || 0) + (p.durationMilliseconds || 0)).filter(Number.isFinite);
  return { http: res.status, rttMs, raw: json || body, status: text ? 'Success' : 'Empty', text, endMs: ends.length ? Math.max(...ends) : null, phraseCount: phrases.length };
}

// Gemini offsets arrive as duration strings, "0.400s". Anything else is null —
// a value that cannot be read is not a timing.
const secondsToMs = v => {
  const m = /^(-?\d+(?:\.\d+)?)s$/.exec(String(v == null ? '' : v).trim());
  return m ? Number(m[1]) * 1000 : null;
};

async function recogniseGemini(wav, geminiKey) {
  // generateContent, the endpoint app.js already calls for Translate. Audio is
  // sent inline: each clip is well under a megabyte, and the Files API upload
  // the docs show for long recordings would add a round trip the app would
  // never make. If the model refuses inline audio, that arrives as a 400 with
  // a body saying so — reported as UNAVAILABLE, not misread as a fail.
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
  const body = {
    contents: [{ parts: [{ inlineData: { mimeType: 'audio/wav', data: wav.toString('base64') } }] }],
    generationConfig: { audioTranscriptionConfig: { languageCodes: [GEMINI_LANGUAGE], wordTimestamp: true } },
  };
  const t0 = Date.now();
  const res = await withRetry(() => fetch(url, {
    method: 'POST',
    headers: { 'x-goog-api-key': geminiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }), 'gemini');
  const rttMs = Date.now() - t0;
  const text = await res.text();
  let json = null; try { json = JSON.parse(text); } catch (e) { /* kept raw */ }
  if (!res.ok) return { http: res.status, rttMs, raw: json || text, unavailable: REFUSED.has(res.status) };
  // Accept either place the transcript can sit: plain text parts, or the words
  // of an audioTranscription part. Which one this model fills alongside word
  // timestamps is not shown in Google's REST docs, so neither is assumed.
  const parts = (json && json.candidates && json.candidates[0] && json.candidates[0].content
    && json.candidates[0].content.parts) || [];
  const words = parts.flatMap(p => (p.audioTranscription && p.audioTranscription.words) || []);
  const plain = parts.map(p => p.text || '').join('');
  const transcript = plain || words.map(w => w.word || '').join('');
  const ends = words.map(w => secondsToMs(w.endOffset)).filter(Number.isFinite);
  const finish = json && json.candidates && json.candidates[0] && json.candidates[0].finishReason;
  return { http: res.status, rttMs, raw: json || text, status: transcript ? 'Success' : (finish || 'Empty'), text: transcript, endMs: ends.length ? Math.max(...ends) : null, phraseCount: words.length };
}

// ── Scoring ─────────────────────────────────────────────────────────────────
function classify(r, s, timing) {
  if (r.unavailable) return { verdict: 'UNAVAILABLE' };
  if (!r.text) return { verdict: 'NO-DECODE' };
  const heard = heardCount(r.text);
  let verdict;
  if (heard >= s.han1 + Math.ceil(s.han2 / 2)) verdict = 'COVERED';
  else if (heard <= s.han1 + 1) verdict = 'DROPPED';
  else verdict = 'PARTIAL';
  let reachesC2 = null;
  if (r.endMs != null) reachesC2 = r.endMs > timing.c2Start + 0.3 * (timing.c2End - timing.c2Start);
  const disagree = reachesC2 != null && ((verdict === 'COVERED' && !reachesC2) || (verdict === 'DROPPED' && reachesC2));
  return { verdict, heard, reachesC2, disagree };
}

function endpointVerdict(attempts) {
  if (attempts.some(a => a.verdict === 'UNAVAILABLE')) return 'UNAVAILABLE';
  const control = attempts.filter(a => a.pauseMs === 0);
  if (control.some(a => a.verdict !== 'COVERED')) return 'CHECK BROKEN';
  const scored = attempts.filter(a => a.pauseMs >= SCORED_MIN && a.pauseMs <= SCORED_MAX);
  if (!scored.length) return 'INCONCLUSIVE';
  if (scored.some(a => a.verdict === 'DROPPED')) return 'FAIL';
  const noDecode = attempts.filter(a => a.verdict === 'NO-DECODE').length;
  if (noDecode > attempts.length / 4) return 'INCONCLUSIVE';
  if (scored.some(a => a.disagree)) return 'INCONCLUSIVE';
  if (scored.every(a => a.verdict === 'COVERED')) return 'PASS';
  return 'INCONCLUSIVE';
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const { pool, picks } = deriveSentences(N_SENTENCES);
  console.log(`\n${CHECK_VERSION}`);
  console.log(`Two-clause sentences in the corpus: ${pool}. Using ${picks.length}, spread by sid:`);
  for (const s of picks) console.log(`  ${s.sid.padEnd(22)} ${s.clause1} | ${s.clause2}   (${s.j})  ${s.han1}+${s.han2} chars`);
  console.log(`Pauses (ms): ${PAUSES.join(', ')}  · 0 is the control · scored window ${SCORED_MIN}–${SCORED_MAX}ms`);
  console.log(`Endpoints: ${ENDPOINTS.join(', ')}  · ${picks.length * PAUSES.length * ENDPOINTS.length} recognitions`);
  if (!PAUSES.includes(0)) console.log('WARNING: no pause 0 — without the control a FAIL cannot be told apart from a broken check.');
  if (DRY) { console.log('\n--dry: no API calls made.\n'); return; }

  const key = process.env.SPEECH_KEY, region = process.env.SPEECH_REGION;
  if (!key || !region) fail('SPEECH_KEY and SPEECH_REGION must both be set — the same two generate-audio.js uses.\nNever put the key in a file inside this repo — the repo is public.');
  const creds = { key, region: region.toLowerCase() };
  const geminiKey = process.env.GEMINI_API_KEY || '';
  if (ENDPOINTS.includes('gemini') && !geminiKey) {
    console.log('\nWARNING: GEMINI_API_KEY is not set — skipping the gemini arm. Set it and open a new terminal to include it.');
    ENDPOINTS = ENDPOINTS.filter(e => e !== 'gemini');
    if (!ENDPOINTS.length) fail('Nothing left to run.');
  }

  const audioDir = KEEP_AUDIO ? fs.mkdtempSync(path.join(os.tmpdir(), 'azure-pause-check-')) : null;
  const run = {
    check: CHECK_VERSION, startedAt: new Date().toISOString(), region: creds.region, node: process.version,
    voice: VOICE, leadMs: LEAD_MS, tailMs: TAIL_MS, pauses: PAUSES, scoredWindowMs: [SCORED_MIN, SCORED_MAX],
    fastApiVersion: FAST_API_VERSION, geminiModel: GEMINI_MODEL, geminiLanguage: GEMINI_LANGUAGE, corpusPool: pool, sentences: picks, attempts: [], verdicts: {},
  };

  for (const s of picks) {
    process.stdout.write(`\nSynthesising ${s.sid}… `);
    const pcm1 = await synthPcm(s.clause1, creds);
    const pcm2 = await synthPcm(s.clause2, creds);
    console.log(`clause 1 ${Math.round(bytesToMs(pcm1.length))}ms, clause 2 ${Math.round(bytesToMs(pcm2.length))}ms`);
    for (const pauseMs of PAUSES) {
      const { wav, timing } = buildClip(pcm1, pcm2, pauseMs);
      if (audioDir) fs.writeFileSync(path.join(audioDir, `${s.sid}-p${pauseMs}.wav`), wav);
      for (const ep of ENDPOINTS) {
        let r;
        try {
          r = ep === 'rest' ? await recogniseRest(wav, creds)
            : ep === 'fast' ? await recogniseFast(wav, creds)
            : await recogniseGemini(wav, geminiKey);
        }
        catch (e) { r = { http: null, rttMs: null, raw: String(e), text: '', networkError: e.message }; }
        const c = classify(r, s, timing);
        const a = { endpoint: ep, sid: s.sid, pauseMs, timing, ...c, text: r.text, status: r.status, http: r.http, rttMs: r.rttMs, endMs: r.endMs, phraseCount: r.phraseCount, raw: r.raw, at: new Date().toISOString() };
        run.attempts.push(a);
        const t = a.reachesC2 == null ? '   ' : a.reachesC2 ? ' t✓' : ' t✗';
        console.log(`  ${ep.padEnd(6)} pause ${String(pauseMs).padStart(5)}ms  ${a.verdict.padEnd(11)}${a.disagree ? '!' : ' '}${t}  ${String(r.rttMs ?? '—').padStart(5)}ms  ${r.http ?? 'net'}  ${a.text || (r.status || '') }`);
      }
    }
  }

  console.log('\n── Verdicts, against the pass bar in this file’s header ──');
  for (const ep of ENDPOINTS) {
    const as = run.attempts.filter(a => a.endpoint === ep);
    const v = endpointVerdict(as);
    run.verdicts[ep] = v;
    const n = k => as.filter(a => a.verdict === k).length;
    const scored = as.filter(a => a.pauseMs >= SCORED_MIN && a.pauseMs <= SCORED_MAX);
    const rtts = as.map(a => a.rttMs).filter(Number.isFinite).sort((x, y) => x - y);
    const median = rtts.length ? rtts[Math.floor(rtts.length / 2)] : null;
    console.log(`  ${ep.padEnd(6)} ${v.padEnd(13)} covered ${n('COVERED')}, dropped ${n('DROPPED')}, partial ${n('PARTIAL')}, no-decode ${n('NO-DECODE')}, text/timing disagreements ${as.filter(a => a.disagree).length} · scored attempts ${scored.length} · median round trip ${median ?? '—'}ms`);
    if (v === 'UNAVAILABLE') {
      const u = as.find(a => a.verdict === 'UNAVAILABLE');
      console.log(`       HTTP ${u.http}: ${JSON.stringify(u.raw).slice(0, 300)}`);
    }
  }

  const outDir = path.join(__dirname, 'fixtures');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `azure-pause-check-${run.startedAt.slice(0, 10)}.json`);
  fs.writeFileSync(outFile, JSON.stringify(run, null, 2) + '\n');
  console.log(`\nRaw responses: ${path.relative(ROOT, outFile)}`);
  if (audioDir) console.log(`Audio: ${audioDir}`);
  console.log('');
}

if (require.main === module) main().catch(e => fail(e.stack || String(e)));
module.exports = { deriveSentences, buildClip, classify, endpointVerdict, heardCount, hanCount, secondsToMs, recogniseGemini };
