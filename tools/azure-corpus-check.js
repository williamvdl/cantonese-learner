#!/usr/bin/env node
/* azure-corpus-check.js — does the app's matcher accept Azure's transcription
 * of CORRECT Cantonese, across the whole corpus?
 *
 * ── WHY THIS EXISTS ─────────────────────────────────────────────────────────
 * The listening cut-off work (IN_PROGRESS.md) moves speak feedback from Chrome's
 * recogniser to Azure. tools/azure-pause-check.js showed Azure does not stop at
 * a pause. What remains is whether the app's matcher — tuned for two years on
 * GOOGLE's spellings — accepts AZURE's. The phone probe (tools/listen-probe.html)
 * asks that with a human voice, but a learner cannot reliably judge whether
 * their own reading was correct, so their rejects cannot be read as Azure's
 * fault. William raised exactly that on 2026-11-03.
 *
 * This takes the speaker out. Every corpus sentence is voiced by Azure TTS, so
 * every reading is CORRECT BY CONSTRUCTION, and every reject is a disagreement
 * between Azure's spelling and the matcher — which is the risk being measured.
 * It also covers all 307 sentences in two voices, where a phone session covers
 * 32, so systematic spelling divergences surface with counts attached.
 *
 * ── WHAT IT CANNOT TELL YOU ─────────────────────────────────────────────────
 * Azure listening to Azure's own voice is the friendliest case there is: clean
 * audio, no mic, no accent, and a vendor hearing its own idea of Cantonese. A
 * PASS here is necessary, not sufficient — the native-speaker run on the phone
 * probe is the check against real voices. A FAIL here is strong evidence,
 * because it fails on audio with nothing wrong in it.
 *
 * Chrome cannot be run the same way: Web Speech only listens to a live mic and
 * cannot be fed a file. So this is not a head-to-head with Chrome. It is held
 * to the bar Chrome's recogniser was held to when it was probed.
 *
 * ── HOW EACH CLIP IS MADE ───────────────────────────────────────────────────
 * One TTS call per sentence per voice, as 16 kHz raw PCM wrapped in a WAV
 * header (the gate's wavFromPcm). Sentences with a full-width comma get an SSML
 * <break> of --pause milliseconds (default 2000) after every comma, so the
 * paused case the feature exists for is in every multi-clause sentence. The
 * gate already showed both endpoints transcribe straight through 8-second
 * silences; this is not re-testing that, only keeping the condition present.
 *
 * Voices: WanLung (the narrator, male) and HiuGaai (female), the two the app
 * already uses. Two voices, so that one voice's quirks cannot pass for the
 * engine's.
 *
 * Synthesised audio is CACHED on disk (outside the repo, in the OS temp
 * folder), so a rerun or a resumed run never pays for TTS twice.
 *
 * ── HOW EACH CLIP IS GRADED ─────────────────────────────────────────────────
 * Through resolveHeard(text, [], target), lifted from app.js by brace-matched
 * extraction with the dependency list tools/asr-replay-harness.js carries (a
 * standing check, so known to be current). Exactly the call the app makes at
 * the end of a recognition.
 *   rest  grades DisplayText — the same field tools/listen-probe.html grades.
 *         Lexical (no punctuation, no digit folding) is graded too and
 *         reported alongside, unbarred, in case the build should use it.
 *   fast  grades the combinedPhrases text, its only full-text field.
 * The calls are the gate's own recogniseRest() and recogniseFast(), imported,
 * so the two scripts cannot drift in how they talk to Azure.
 *
 * ── PASS BAR — inherited, declared before any data exists ──────────────────
 * The bar tools/asr-probe.html set and every speak probe since has reused:
 *     false rejects <= 10% of valid attempts
 * applied per endpoint to two numbers, both of which must hold, in the same
 * shape as tools/listen-probe.html:
 *     OVERALL   all sentences, both voices
 *     PAUSED    sentences with at least one comma
 * Valid = a transcript came back. No-decodes, refusals and errors are counted
 * separately and excluded. Results are also broken down by voice, reported
 * and not barred.
 *
 * It may conclude PASS or FAIL per endpoint. It may NOT conclude "loosen the
 * matcher until it passes" — the matcher is shared with four live surfaces.
 * What a FAIL produces instead is the SUBSTITUTION TABLE below: which target
 * characters Azure systematically writes as something else, with counts. That
 * is the evidence a separate decision about a rule change would need.
 *
 * ── SUBSTITUTION TABLE ──────────────────────────────────────────────────────
 * For every graded attempt, alignChars() (lifted, with the same same-sound
 * equality the matcher uses) marks each target character match / wrong /
 * missing. Every 'wrong' is tallied as target -> heard, with readings, across
 * the run — including inside ACCEPTED attempts, because a divergence the
 * matcher happened to forgive this time is still a divergence.
 *
 * ── USAGE ───────────────────────────────────────────────────────────────────
 * SPEECH_KEY and SPEECH_REGION, as generate-audio.js. Node 18 or later. No npm.
 *
 *   node tools/azure-corpus-check.js --dry          what would run; no calls, no key
 *   node tools/azure-corpus-check.js --limit=6      a smoke test: 6 sentences spread across the corpus
 *   node tools/azure-corpus-check.js                the full run (resumes if interrupted)
 *   node tools/azure-corpus-check.js --only=fast    one endpoint
 *   node tools/azure-corpus-check.js --voices=WanLung --pause=3000
 *
 * Full run: 307 sentences x 2 voices = 614 clips, x 2 endpoints = 1,228
 * recognitions, one at a time (the free tier allows one at a time). Roughly an
 * hour of audio against the free tier's 5 hours a month, and about 14,000 TTS
 * characters against its 500,000. Expect 30-60 minutes unattended: the free
 * tier rate-limits TTS, and the shared back-off waits it out.
 *
 * RESUMABLE. Results are written to tools/runs/azure-corpus-check-<date>[-<only>].json
 * after every sentence. Rerunning the same command the same day skips what is
 * already done. --fresh ignores the file and starts again.
 *
 * Output goes to tools/runs/, never tools/fixtures/: asr-replay-harness.js reads
 * every .json in fixtures as a Web Speech trace and crashes on anything else
 * (STATUS § Notes, 2026-11-03).
 *
 * Not a standing check: it asserts no invariant, and it is dead once answered.
 * No sw.js bump — not precached, not linked from the app.
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const gate = require('./azure-pause-check.js');

const CHECK_VERSION = 'azure-corpus-check 1 · 2026-11-03';
const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'data');
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const BAR_PCT = 10;

// ── Arguments ────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const arg = name => {
  const hit = argv.find(a => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return null;
  return hit.includes('=') ? hit.slice(hit.indexOf('=') + 1) : true;
};
const DRY = !!arg('dry');
const FRESH = !!arg('fresh');
const LIMIT = Number(arg('limit')) || 0;
const PAUSE_MS = arg('pause') != null ? Math.max(0, Number(arg('pause')) || 0) : 2000;
const VOICE_IDS = { WanLung: 'zh-HK-WanLungNeural', HiuGaai: 'zh-HK-HiuGaaiNeural', HiuMaan: 'zh-HK-HiuMaanNeural' };
const VOICES = String(arg('voices') || 'WanLung,HiuGaai').split(',').map(s => s.trim()).filter(Boolean);
for (const v of VOICES) if (!VOICE_IDS[v]) fail(`Unknown voice ${v}. Use: ${Object.keys(VOICE_IDS).join(', ')}`);
const ONLY = arg('only');
if (ONLY && !['rest', 'fast'].includes(ONLY)) fail('--only takes rest or fast');
const ENDPOINTS = ['rest', 'fast'].filter(e => !ONLY || e === ONLY);
const CACHE_DIR = arg('cache') || path.join(os.tmpdir(), 'jyut-azure-corpus-cache');

function fail(msg) { console.error('\n' + msg + '\n'); process.exit(1); }

// ── Lift the matcher out of app.js ───────────────────────────────────────────
// The list tools/asr-replay-harness.js carries, plus alignChars() for the
// substitution table. A rename in app.js fails loudly here.
function liftMatcher() {
  const src = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  const grab = name => {
    const i = src.indexOf('function ' + name + '(');
    if (i < 0) fail('app.js no longer defines ' + name + '()');
    let d = 0;
    for (let k = src.indexOf('{', i); k < src.length; k++) {
      if (src[k] === '{') d++;
      else if (src[k] === '}') { d--; if (!d) return src.slice(i, k + 1); }
    }
    fail('unbalanced braces reading ' + name);
  };
  const grabConst = (re, label) => { const m = src.match(re); if (!m) fail('app.js no longer defines ' + label); return m[0]; };
  const env = {
    console,
    store: { charJyutping: read(path.join(DATA, 'char-jyutping.json')) },
    window: { ToJyutping: require(path.join(ROOT, 'vendor/to-jyutping.js')) },
  };
  vm.createContext(env);
  vm.runInContext([
    grabConst(/const ASR_DIGITS = \{[\s\S]*?\};/, 'ASR_DIGITS'),
    grabConst(/const ASR_PLACES = \[[\s\S]*?\];/, 'ASR_PLACES'),
    grab('foldAsrNumerals'), grab('normalizeChinese'),
    grab('charJyutpingSyllables'), grab('readingsFor'), grab('sameSoundAt'),
    grabConst(/const IDENTITY_EQ = [\s\S]*?;/, 'IDENTITY_EQ'),
    grab('speakEqFor'), grab('editDistance'),
    grabConst(/const SPEAK_FINAL_PARTICLES[\s\S]*?\]\);/, 'SPEAK_FINAL_PARTICLES'),
    grabConst(/const SPEAK_PARTICLE_VARIANTS[\s\S]*?\]\);/, 'SPEAK_PARTICLE_VARIANTS'),
    grabConst(/const canonicalParticle = [\s\S]*?;/, 'canonicalParticle'),
    grab('isForgivenParticleSwap'), grab('fuzzyMatch'), grab('resolveHeard'), grab('alignChars'),
  ].join('\n\n'), env);
  return env;
}

// ── Corpus ───────────────────────────────────────────────────────────────────
function loadSentences() {
  const out = [];
  for (const f of fs.readdirSync(path.join(DATA, 'topics')).filter(f => f.endsWith('.json')).sort()) {
    const t = read(path.join(DATA, 'topics', f));
    for (const round of Object.values(t.rounds || {})) {
      for (const s of (round.sentences || [])) out.push({ sid: s.sid, c: s.c, j: s.j, commas: (String(s.c).match(/，/g) || []).length });
    }
  }
  out.sort((a, b) => a.sid < b.sid ? -1 : a.sid > b.sid ? 1 : 0);
  return out;
}

function spread(list, n) {
  const k = Math.min(n, list.length), out = [];
  for (let i = 0; i < k; i++) out.push(list[k === 1 ? 0 : Math.round(i * (list.length - 1) / (k - 1))]);
  return out;
}

// ── Audio ────────────────────────────────────────────────────────────────────
function ssmlFor(text, voiceId) {
  // A break after every full-width comma; the comma itself is kept so the
  // clause before it is voiced as a continuation, as in the gate.
  const body = String(text).split('，').map(gate.escapeXml).join(`，<break time="${PAUSE_MS}ms"/>`);
  return `<speak version='1.0' xml:lang='zh-HK'><voice name='${voiceId}'>${body}</voice></speak>`;
}

async function synthWav(s, voice, creds) {
  const file = path.join(CACHE_DIR, `${s.sid}.${voice}.p${PAUSE_MS}.wav`);
  if (fs.existsSync(file)) return { wav: fs.readFileSync(file), cached: true };
  const res = await gate.withRetry(() => fetch(`https://${creds.region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': creds.key,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'raw-16khz-16bit-mono-pcm',
      'User-Agent': 'cantonese-learner-azure-corpus-check',
    },
    body: ssmlFor(s.c, VOICE_IDS[voice]),
  }), 'tts');
  if (!res.ok) throw new Error(`Azure TTS ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const pcm = Buffer.from(await res.arrayBuffer());
  // Payload, never status: a 200 carrying no audio is a failure.
  if (pcm.length < gate.msToBytes(300)) throw new Error(`Azure TTS returned ${pcm.length} bytes for ${s.sid} — too short to be speech`);
  const wav = gate.wavFromPcm(pcm);
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(file, wav);
  return { wav, cached: false };
}

// ── Grading ──────────────────────────────────────────────────────────────────
function grade(M, text, target) {
  if (!text || !text.trim()) return { outcome: 'no-decode' };
  const g = M.resolveHeard(text, [], target);
  // The substitution table reads the same normalised strings and the same
  // same-sound test the matcher uses, so a fold never shows up as a substitution.
  const h = M.normalizeChinese(text), t = M.normalizeChinese(target);
  const marks = M.alignChars(h, t, M.speakEqFor(h, t));
  const subs = [], missing = [];
  marks.forEach((m, j) => {
    if (m && m.status === 'wrong') subs.push([t[j], m.heardChar]);
    else if (m && m.status === 'missing') missing.push(t[j]);
  });
  return { outcome: g.matched ? 'accepted' : 'rejected', subs, missing };
}

function textsFrom(ep, r) {
  if (ep === 'fast') return { primary: r.text || '' };
  const raw = r.raw && typeof r.raw === 'object' ? r.raw : {};
  const ok = raw.RecognitionStatus === 'Success';
  const nb = Array.isArray(raw.NBest) ? raw.NBest[0] : null;
  return { primary: ok ? (raw.DisplayText || '') : '', lexical: ok && nb ? (nb.Lexical || '') : '' };
}

// ── Summary ──────────────────────────────────────────────────────────────────
function rate(list) {
  const rej = list.filter(a => a.outcome === 'rejected').length;
  return { n: list.length, rej, pct: list.length ? +(rej / list.length * 100).toFixed(1) : null };
}

function summarise(attempts) {
  const out = {};
  for (const ep of ENDPOINTS) {
    const all = attempts.filter(a => a.endpoint === ep);
    const valid = all.filter(a => a.outcome === 'accepted' || a.outcome === 'rejected');
    const count = k => all.filter(a => a.outcome === k).length;
    const overall = rate(valid), paused = rate(valid.filter(a => a.commas > 0));
    const s = {
      overall, paused, single: rate(valid.filter(a => a.commas === 0)),
      byVoice: Object.fromEntries(VOICES.map(v => [v, rate(valid.filter(a => a.voice === v))])),
      noDecode: count('no-decode'), refused: count('refused'), error: count('error'),
      passes: overall.pct !== null && paused.pct !== null && overall.pct <= BAR_PCT && paused.pct <= BAR_PCT,
    };
    if (ep === 'rest') {
      const lex = all.filter(a => a.lexicalOutcome === 'accepted' || a.lexicalOutcome === 'rejected')
        .map(a => ({ outcome: a.lexicalOutcome }));
      s.lexicalUnbarred = rate(lex);
    }
    const rt = all.map(a => a.rttMs).filter(Number.isFinite).sort((x, y) => x - y);
    s.medianRttMs = rt.length ? rt[Math.floor(rt.length / 2)] : null;
    out[ep] = s;
  }
  return out;
}

function substitutionTable(M, attempts) {
  const tally = new Map();
  for (const a of attempts) for (const [t, h] of (a.subs || [])) {
    const k = t + '→' + h;
    const e = tally.get(k) || { target: t, heard: h, count: 0, endpoints: new Set(), inRejected: 0 };
    e.count++; e.endpoints.add(a.endpoint); if (a.outcome === 'rejected') e.inRejected++;
    tally.set(k, e);
  }
  const reading = ch => { const r = M.charJyutpingSyllables(ch)[0]; return r && r.reading ? r.reading : '?'; };
  return [...tally.values()].sort((x, y) => y.count - x.count)
    .map(e => ({ target: e.target, targetJ: reading(e.target), heard: e.heard, heardJ: reading(e.heard),
                 count: e.count, inRejected: e.inRejected, endpoints: [...e.endpoints].sort() }));
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const M = liftMatcher();
  const corpus = loadSentences();
  const sentences = LIMIT ? spread(corpus, LIMIT) : corpus;
  const nComma = sentences.filter(s => s.commas > 0).length;

  console.log(`\n${CHECK_VERSION}`);
  console.log(`Sentences: ${sentences.length} of ${corpus.length}${LIMIT ? ' (--limit, spread by sid)' : ''} · ${nComma} with a comma, paused ${PAUSE_MS}ms at each`);
  console.log(`Voices: ${VOICES.join(', ')} · endpoints: ${ENDPOINTS.join(', ')} · ${sentences.length * VOICES.length * ENDPOINTS.length} recognitions`);
  console.log(`Audio cache: ${CACHE_DIR}`);
  console.log(`Bar: per endpoint, false rejects <= ${BAR_PCT}% of valid attempts, overall AND on sentences with a comma.`);
  if (DRY) { console.log('\n--dry: no API calls made.\n'); return; }

  const key = process.env.SPEECH_KEY, region = process.env.SPEECH_REGION;
  if (!key || !region) fail('SPEECH_KEY and SPEECH_REGION must both be set — the same two generate-audio.js uses.');
  const creds = { key, region: region.toLowerCase() };

  const outDir = path.join(__dirname, 'runs');
  fs.mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const outFile = path.join(outDir, `azure-corpus-check-${stamp}${ONLY ? '-' + ONLY : ''}${LIMIT ? '-limit' + LIMIT : ''}.json`);
  const config = { voices: VOICES, pauseMs: PAUSE_MS, endpoints: ENDPOINTS, limit: LIMIT || null };

  let run = null;
  if (!FRESH && fs.existsSync(outFile)) {
    try {
      const prev = read(outFile);
      if (JSON.stringify(prev.config) === JSON.stringify(config)) { run = prev; console.log(`Resuming ${path.relative(ROOT, outFile)} — ${prev.attempts.length} recognitions already done.`); }
      else console.log('An earlier run today used different settings; starting fresh (it will be overwritten).');
    } catch (e) { console.log('Earlier results file unreadable; starting fresh.'); }
  }
  if (!run) run = { check: CHECK_VERSION, startedAt: new Date().toISOString(), region: creds.region, node: process.version, config, attempts: [] };
  run.check = CHECK_VERSION;
  const done = new Set(run.attempts.map(a => `${a.sid}|${a.voice}|${a.endpoint}`));
  const save = () => {
    run.updatedAt = new Date().toISOString();
    run.summary = summarise(run.attempts);
    run.substitutions = substitutionTable(M, run.attempts);
    fs.writeFileSync(outFile, JSON.stringify(run, null, 1) + '\n');
  };

  const total = sentences.length * VOICES.length;
  let n = 0;
  for (const s of sentences) {
    for (const voice of VOICES) {
      n++;
      const todo = ENDPOINTS.filter(ep => !done.has(`${s.sid}|${voice}|${ep}`));
      if (!todo.length) continue;
      let wav;
      try { ({ wav } = await synthWav(s, voice, creds)); }
      catch (e) { fail(`Stopped at ${s.sid} (${voice}): ${e.message}\nRerun the same command to resume.`); }
      const line = [];
      for (const ep of todo) {
        let r;
        try { r = ep === 'rest' ? await gate.recogniseRest(wav, creds) : await gate.recogniseFast(wav, creds); }
        catch (e) { r = { http: null, rttMs: null, raw: String(e), error: e.message }; }
        const a = { sid: s.sid, voice, endpoint: ep, commas: s.commas, target: s.c, http: r.http, rttMs: r.rttMs, at: new Date().toISOString() };
        if (r.unavailable) { a.outcome = 'refused'; a.raw = r.raw; }
        else if (r.error || (r.http && r.http >= 400)) { a.outcome = 'error'; a.raw = r.raw; }
        else {
          const tx = textsFrom(ep, r);
          a.text = tx.primary;
          Object.assign(a, grade(M, tx.primary, s.c));
          if (ep === 'rest') { a.lexical = tx.lexical; a.lexicalOutcome = grade(M, tx.lexical, s.c).outcome; }
          // Raw responses are kept where they need reading — anything not
          // accepted — and dropped from accepted ones to keep the file small.
          if (a.outcome !== 'accepted') a.raw = r.raw;
        }
        run.attempts.push(a);
        done.add(`${s.sid}|${voice}|${ep}`);
        line.push(`${ep} ${a.outcome}${a.outcome === 'rejected' ? ' «' + a.text + '»' : ''}`);
        if (a.outcome === 'refused') { save(); fail(`${ep} refused the request (HTTP ${a.http}): ${JSON.stringify(a.raw).slice(0, 300)}\nFix the key or region, or rerun with --only=${ep === 'rest' ? 'fast' : 'rest'}.`); }
      }
      save();
      console.log(`  ${String(n).padStart(4)}/${total} ${s.sid.padEnd(22)} ${voice.padEnd(8)} ${line.join(' · ')}`);
    }
  }

  save();
  const sum = run.summary;
  console.log('\n── Verdicts, against the inherited bar (false rejects <= 10%, overall AND paused) ──');
  for (const ep of ENDPOINTS) {
    const x = sum[ep];
    const f = r => r.pct === null ? '—' : `${r.rej}/${r.n} (${r.pct}%)`;
    console.log(`  ${ep.padEnd(4)} ${x.passes ? 'PASS' : 'FAIL'}   overall ${f(x.overall)} · paused ${f(x.paused)} · single ${f(x.single)} · no-decode ${x.noDecode} · error ${x.error} · median round trip ${x.medianRttMs ?? '—'}ms`);
    console.log(`       by voice: ${VOICES.map(v => `${v} ${f(x.byVoice[v])}`).join(' · ')}${x.lexicalUnbarred ? ` · Lexical field (unbarred) ${f(x.lexicalUnbarred)}` : ''}`);
  }
  const subs = run.substitutions.slice(0, 15);
  if (subs.length) {
    console.log('\n── Most frequent substitutions (target → what Azure wrote), all attempts ──');
    for (const e of subs) console.log(`  ${e.target} (${e.targetJ}) → ${e.heard} (${e.heardJ})  ×${e.count}  · in rejected ${e.inRejected} · ${e.endpoints.join('+')}`);
  }
  console.log(`\nResults: ${path.relative(ROOT, outFile)}\n`);
}

if (require.main === module) main().catch(e => fail(e.stack || String(e)));
module.exports = { ssmlFor, grade, summarise, spread, loadSentences, liftMatcher };
