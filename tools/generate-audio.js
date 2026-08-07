#!/usr/bin/env node
/* generate-audio.js — batch-generates Cantonese speech audio (MP3) for every
 * word, sentence, and conversation line — including BOTH the per-topic Chat
 * tab conversations (the `convo` field inside each topic round) AND the
 * checkpoint capstone conversations (data/path_convos.json). Vanilla Node,
 * zero npm deps — uses Node's built-in fetch().
 *
 * ── PROVIDERS ───────────────────────────────────────────────────────────────
 * Two backends. Azure is the default and is what the shipped audio is made with.
 *
 *   azure  (DEFAULT)  Microsoft Azure AI Speech, zh-HK Neural voices.
 *                     Auth: SPEECH_KEY + SPEECH_REGION environment variables.
 *   google            Google Cloud TTS, yue-HK Chirp3-HD voices.
 *                     Auth: the gcloud CLI (`gcloud init` once).
 *
 * WHY THE MIGRATION HAPPENED (v122 investigation — keep this, it cost a day):
 * Google's Chirp3-HD yue-HK voice cannot produce a bare SYLLABIC NASAL. Cantonese
 * has two — m̩ and ŋ̍ — and both came back with a vowel inserted: 唔 (m4) rendered
 * as "mo/muh/mon" and 五 (ng5) as "nong". The inserted vowel VARIED with the
 * surrounding syllables, which is what identified it as the acoustic model
 * improvising a nucleus rather than a dictionary error. 207 of the 1,376 audio
 * files contain an affected syllable (15%), concentrated in sentences and
 * conversations rather than the word list. Every other Cantonese-specific
 * character — 啲 (di1), 佢 (keoi5), 嘅 (ge3) — was fine, as was ng-plus-a-vowel
 * (牛 ngau4), so this was one precise phoneme-class gap, not weak coverage.
 *
 * Character substitution could not fix it: no other common character is read as
 * a bare m̩, and any substitute would have failed identically, because the gap
 * was in the phoneme inventory rather than the lexicon. yue-HK offers only two
 * families on Google (Chirp3-HD, Preview; and Standard, GA) — no WaveNet, no
 * Neural2. Azure's zh-HK Neural voices say both nasals correctly AND are close
 * to Chirp3-HD in naturalness, so the migration cost nothing in quality and
 * additionally retired a Preview dependency.
 *
 * The google backend is RETAINED deliberately: it is how every audio file before
 * v122 was made, and it is the A/B reference if a future provider question comes
 * up. It is NOT a fallback — for this corpus it produces known-defective audio.
 *
 * ── INCREMENTAL ─────────────────────────────────────────────────────────────
 * Skips any output file that already exists, so re-running only fills gaps from
 * newly added content. Edited existing text won't auto-detect as stale — delete
 * the specific file, or use --force, to regenerate it.
 *
 * ── VOICES ──────────────────────────────────────────────────────────────────
 * Words/sentences use one narrator voice (--voice). ALL conversation lines —
 * both topic Chat tabs and checkpoint conversations — use TWO voices, picked
 * automatically per line based on who's speaking: the "You" role (the learner's
 * own lines) always gets --voice-you, and the other character (Vendor / Friend /
 * Doctor / whoever it is that scene) always gets --voice-other. So every
 * conversation sounds like two distinct people with no per-scene configuration.
 *
 * Azure zh-HK has exactly three voices, confirmed against the live voices/list
 * endpoint: zh-HK-WanLungNeural (male), zh-HK-HiuMaanNeural (female),
 * zh-HK-HiuGaaiNeural (female). The defaults below mirror the Google casting
 * they replaced: one male narrator who is also the other speaker, and a female
 * voice for You.
 *
 * ── USAGE ───────────────────────────────────────────────────────────────────
 *   node tools/generate-audio.js                     # everything missing
 *   node tools/generate-audio.js --dry               # what would generate; no API calls, no auth
 *   node tools/generate-audio.js --topic=greetings   # one topic's words/sentences/chat
 *   node tools/generate-audio.js --convo=beginner-s1 # one checkpoint conversation
 *   node tools/generate-audio.js --force             # regenerate EVERYTHING
 *   node tools/generate-audio.js --force=greetings   # regenerate one topic/convo's existing files too
 *   node tools/generate-audio.js --out=../audio-sample   # write elsewhere — audition without touching audio/
 *   node tools/generate-audio.js --provider=google   # the old backend
 *   node tools/generate-audio.js --delay=3000        # ms between calls; raise if you hit 429s
 *   node tools/generate-audio.js --format=audio-24khz-96kbitrate-mono-mp3   # Azure output format
 *
 * ── RATE LIMITS ─────────────────────────────────────────────────────────────
 * Azure's Free (F0) tier is rate-limited well below Standard (S0), so a full
 * 1,376-file run on F0 can take a while. 429 responses are retried automatically
 * with exponential backoff, honouring Retry-After when Azure sends it, so a long
 * run completes unattended — it is just slow. If you see repeated backoff lines,
 * either raise --delay or move the resource to S0.
 *
 * ── OUTPUT LAYOUT ───────────────────────────────────────────────────────────
 *   audio/words/{wordId}.mp3                    e.g. audio/words/greetings-001.mp3
 *   audio/sentences/{sid}.mp3                   e.g. audio/sentences/greetings-t1-s01.mp3
 *   audio/convos/topic-{topicKey}-r{round}-line{NN}.mp3
 *   audio/convos/{convoKey}-line{NN}.mp3        e.g. audio/convos/beginner-s1-line01.mp3
 *
 * NOTE: conversation lines' `opts` (alternate multiple-choice answers in
 * Fill-the-Gap mode) are NOT included — only the canonical `c` line per turn.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO_ROOT = path.join(__dirname, '..');
const TOPICS_DIR = path.join(REPO_ROOT, 'data', 'topics');
const CONVOS_FILE = path.join(REPO_ROOT, 'data', 'path_convos.json');
const DEFAULT_OUT = path.join(REPO_ROOT, 'audio');

const args = process.argv.slice(2);
const arg = (name) => { const m = args.find(a => a.startsWith(`--${name}=`)); return m ? m.split('=').slice(1).join('=') : null; };
const DRY = args.includes('--dry');
const FORCE_ALL = args.includes('--force');
const FORCE_SCOPE = arg('force');
const ONLY_TOPIC = arg('topic');
const ONLY_CONVO = arg('convo');
const PROVIDER = (arg('provider') || 'azure').toLowerCase();
const DELAY_MS = Number(arg('delay') || 100);

// --out redirects everything, so a sample run can be auditioned without
// overwriting a single shipped file. The three subfolders are created beneath it.
const OUT_ROOT = arg('out') ? path.resolve(arg('out')) : DEFAULT_OUT;
const OUT_WORDS = path.join(OUT_ROOT, 'words');
const OUT_SENTENCES = path.join(OUT_ROOT, 'sentences');
const OUT_CONVOS = path.join(OUT_ROOT, 'convos');

function log(msg) { console.log(msg); }
function fail(msg) { console.error('\n' + msg + '\n'); process.exit(1); }

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

// ── Providers ────────────────────────────────────────────────────────────────
// Each provider exposes: defaults{}, init() -> creds, synth(text, voice, creds)
// -> Buffer. Everything else in this file is provider-agnostic.

const PROVIDERS = {
  azure: {
    label: 'Azure AI Speech (zh-HK Neural)',
    defaults: {
      voice:      'zh-HK-WanLungNeural',   // words + sentences narrator
      voiceYou:   'zh-HK-HiuGaaiNeural',   // the learner's own lines
      voiceOther: 'zh-HK-WanLungNeural',   // Vendor / Friend / whoever
    },
    // Chosen to sit close to what Google's default MP3 output produced (~8kB for
    // a short item) so the corpus does not balloon — audio is runtime-cached by
    // the service worker, so size is a real cost on device. 24kHz is ample for
    // speech. Override with --format if a listening test disagrees.
    format: arg('format') || 'audio-24khz-48kbitrate-mono-mp3',
    init() {
      const key = process.env.SPEECH_KEY;
      const region = process.env.SPEECH_REGION;
      if (!key || !region) {
        fail('SPEECH_KEY and SPEECH_REGION must both be set.\n'
           + '  Windows:  setx SPEECH_KEY <key>   then open a NEW terminal\n'
           + '  macOS:    export SPEECH_KEY="<key>"\n\n'
           + 'Never put the key in a file inside this repo — the repo is public.');
      }
      return { key, region };
    },
    async synth(text, voice, creds) {
      // Azure's REST endpoint accepts SSML only, never plain text, so the
      // Chinese has to be XML-escaped. No <break> is emitted: in the app every
      // line is its own file played on demand, so pauses come from the taps.
      const ssml = `<speak version='1.0' xml:lang='zh-HK'>`
                 + `<voice name='${voice}'>${escapeXml(text)}</voice></speak>`;
      const res = await fetch(`https://${creds.region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': creds.key,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': PROVIDERS.azure.format,
          'User-Agent': 'cantonese-learner-generate-audio',
        },
        body: ssml,
      });
      if (!res.ok) {
        const err = new Error(`Azure TTS ${res.status}: ${(await res.text()).slice(0, 200).replace(/\s+/g, ' ')}`);
        err.status = res.status;
        err.retryAfter = Number(res.headers.get('retry-after')) || null;
        throw err;
      }
      // Azure returns raw audio bytes, not base64 inside JSON the way Google does.
      return Buffer.from(await res.arrayBuffer());
    },
  },

  google: {
    label: 'Google Cloud TTS (yue-HK Chirp3-HD) — PRE-v122, see the header note',
    defaults: {
      voice:      'yue-HK-Chirp3-HD-Puck',
      voiceYou:   'yue-HK-Chirp3-HD-Kore',
      voiceOther: 'yue-HK-Chirp3-HD-Puck',
    },
    init() {
      let token, project;
      try {
        token = execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim();
      } catch (e) { fail('Could not get an access token from gcloud. Run `gcloud init` first.'); }
      try {
        project = execSync('gcloud config get-value project', { encoding: 'utf8' }).trim();
        if (!project || project === '(unset)') throw new Error('unset');
      } catch (e) { fail('Could not read the active gcloud project. Run `gcloud init` first.'); }
      return { token, project };
    },
    async synth(text, voice, creds) {
      const res = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${creds.token}`,
          'x-goog-user-project': creds.project,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: { text },
          voice: { languageCode: 'yue-HK', name: voice },
          audioConfig: { audioEncoding: 'MP3' },
        }),
      });
      if (!res.ok) {
        const err = new Error(`Google TTS ${res.status}: ${(await res.text()).slice(0, 200).replace(/\s+/g, ' ')}`);
        err.status = res.status;
        throw err;
      }
      const data = await res.json();
      return Buffer.from(data.audioContent, 'base64');
    },
  },
};

const provider = PROVIDERS[PROVIDER];
if (!provider) fail(`Unknown --provider=${PROVIDER}. Options: ${Object.keys(PROVIDERS).join(', ')}`);

const VOICE_NAME  = arg('voice')       || provider.defaults.voice;
const VOICE_YOU   = arg('voice-you')   || provider.defaults.voiceYou;
const VOICE_OTHER = arg('voice-other') || provider.defaults.voiceOther;

// Retries only what is worth retrying: rate limits and transient server errors.
// A 401 or a 400 will not fix itself, so those fail immediately and loudly.
async function synthWithRetry(text, voice, creds, label) {
  const MAX = 5;
  for (let attempt = 1; ; attempt++) {
    try {
      return await provider.synth(text, voice, creds);
    } catch (err) {
      const retryable = err.status === 429 || (err.status >= 500 && err.status < 600);
      if (!retryable || attempt >= MAX) throw err;
      const wait = err.retryAfter ? err.retryAfter * 1000 : Math.min(2 ** attempt * 1000, 30000);
      log(`      ${err.status} on ${label} — waiting ${Math.round(wait / 1000)}s (attempt ${attempt}/${MAX - 1})`);
      await new Promise(r => setTimeout(r, wait));
    }
  }
}

// Walks every topic file (all rounds, including each round's Chat-tab convo)
// + path_convos.json and builds the full list of jobs. No network, no auth.
function collectJobs() {
  const jobs = [];

  if (!ONLY_CONVO) {
    const topicFiles = fs.readdirSync(TOPICS_DIR).filter(f => f.endsWith('.json')).sort();
    for (const file of topicFiles) {
      const topicKey = file.replace(/\.json$/, '');
      if (ONLY_TOPIC && topicKey !== ONLY_TOPIC) continue;
      const data = JSON.parse(fs.readFileSync(path.join(TOPICS_DIR, file), 'utf8'));
      for (const [roundKey, round] of Object.entries(data.rounds || {})) {
        for (const w of (round.words || [])) {
          jobs.push({ outPath: path.join(OUT_WORDS, `${w.id}.mp3`), text: w.c, voice: VOICE_NAME, label: `word ${w.id} (${w.c})` });
        }
        for (const s of (round.sentences || [])) {
          jobs.push({ outPath: path.join(OUT_SENTENCES, `${s.sid}.mp3`), text: s.c, voice: VOICE_NAME, label: `sentence ${s.sid}` });
        }
        // Topic Chat tab conversation — separate data source from the
        // checkpoint conversations below, but same two-voice-by-role logic.
        if (round.convo) {
          const [otherName] = round.convo.speakers || ['Other', 'You'];
          (round.convo.lines || []).forEach((line, i) => {
            const n = String(i + 1).padStart(2, '0');
            const voice = line.u ? VOICE_YOU : VOICE_OTHER;
            const speakerLabel = line.u ? 'You' : otherName;
            jobs.push({ outPath: path.join(OUT_CONVOS, `topic-${topicKey}-r${roundKey}-line${n}.mp3`), text: line.c, voice, label: `${topicKey} chat r${roundKey} line ${n} (${speakerLabel})` });
          });
        }
      }
    }
  }

  // Checkpoint conversations are keyed by checkpoint/path, not topic — skip
  // entirely when testing a single --topic, since there's no meaningful overlap
  // (that content lives in the topic-scoped Chat convos above instead).
  if (!ONLY_TOPIC) {
    const convoData = JSON.parse(fs.readFileSync(CONVOS_FILE, 'utf8'));
    for (const [convoKey, convo] of Object.entries(convoData.convos || {})) {
      if (ONLY_CONVO && convoKey !== ONLY_CONVO) continue;
      const [otherName] = convo.speakers || ['Other', 'You'];
      (convo.lines || []).forEach((line, i) => {
        const n = String(i + 1).padStart(2, '0');
        const voice = line.u ? VOICE_YOU : VOICE_OTHER;
        const speakerLabel = line.u ? 'You' : otherName;
        jobs.push({ outPath: path.join(OUT_CONVOS, `${convoKey}-line${n}.mp3`), text: line.c, voice, label: `${convoKey} line ${n} (${speakerLabel})` });
      });
    }
  }

  return jobs;
}

function needsGeneration(job) {
  if (FORCE_ALL) return true;
  if (FORCE_SCOPE && job.outPath.includes(FORCE_SCOPE)) return true;
  return !fs.existsSync(job.outPath);
}

async function main() {
  const jobs = collectJobs();
  const pending = jobs.filter(needsGeneration);

  log(`\nProvider: ${provider.label}`);
  if (PROVIDER === 'azure') log(`Format:   ${provider.format}`);
  if (OUT_ROOT !== DEFAULT_OUT) log(`Output:   ${OUT_ROOT}   (--out set — audio/ is untouched)`);
  log(`${jobs.length} total items (${pending.length} to generate, ${jobs.length - pending.length} already exist).`);
  log(`Words/sentences voice: ${VOICE_NAME}`);
  log(`Conversation voices: You=${VOICE_YOU}  Other=${VOICE_OTHER}\n`);

  if (DRY) {
    pending.forEach(j => log(`  would generate: ${j.label}  [${j.voice}]`));
    log(`\n--dry: nothing generated, nothing spent.`);
    return;
  }
  if (pending.length === 0) { log('Nothing to do.'); return; }

  const creds = provider.init();
  [OUT_WORDS, OUT_SENTENCES, OUT_CONVOS].forEach(dir => fs.mkdirSync(dir, { recursive: true }));

  let done = 0, failed = 0;
  const started = Date.now();
  for (const job of pending) {
    try {
      const audio = await synthWithRetry(job.text, job.voice, creds, job.label);
      // A response too small to be audio is an error page saved under an .mp3
      // name. Catch it here rather than discovering it as silence in the app.
      if (audio.length < 500) throw new Error(`suspiciously small response (${audio.length} bytes) — not audio`);
      fs.writeFileSync(job.outPath, audio);
      done++;
      log(`[${done + failed}/${pending.length}] \u2713 ${job.label}`);
    } catch (err) {
      failed++;
      log(`[${done + failed}/${pending.length}] \u2717 ${job.label}: ${err.message}`);
    }
    await new Promise(r => setTimeout(r, DELAY_MS));
  }

  const mins = ((Date.now() - started) / 60000).toFixed(1);
  log(`\nDone in ${mins} min. ${done} generated, ${failed} failed, ${jobs.length - pending.length} already existed.`);
  if (failed > 0) {
    log('Re-run the same command to retry only the failures — existing files are skipped.');
    process.exitCode = 1;
  }
}

main();
