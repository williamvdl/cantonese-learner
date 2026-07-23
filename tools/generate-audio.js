#!/usr/bin/env node
/* generate-audio.js — batch-generates Cantonese speech audio (MP3) for every
 * word, sentence, and conversation line — including BOTH the per-topic Chat
 * tab conversations (the `convo` field inside each topic round) AND the
 * checkpoint capstone conversations (data/path_convos.json) — using Google
 * Cloud Text-to-Speech's Chirp3-HD yue-HK voice. Vanilla Node, zero npm deps
 * — uses Node's built-in fetch() and authenticates via the gcloud CLI's
 * access token, so you must have already run (once):
 *     gcloud init
 *
 * INCREMENTAL: skips any output file that already exists, so re-running only
 * fills gaps from newly added content. Edited existing text won't auto-detect
 * as stale — delete the specific file (or use --force) to regenerate it.
 *
 * Words/sentences use one narrator voice (--voice). ALL conversation lines —
 * both topic Chat tabs and checkpoint conversations — use TWO voices, picked
 * automatically per line based on who's speaking: the "You" role (the
 * learner's own lines) always gets --voice-you, and the other character
 * (Vendor/Friend/Doctor/etc., whoever it is that scene) always gets
 * --voice-other — so every conversation in the app consistently sounds like
 * two distinct people, without needing per-scene configuration.
 *
 * Usage:
 *   node tools/generate-audio.js                    # everything missing
 *   node tools/generate-audio.js --topic=greetings   # one topic's words/sentences/chat (testing)
 *   node tools/generate-audio.js --convo=beginner-s1 # just one checkpoint conversation (testing)
 *   node tools/generate-audio.js --dry               # list what would generate, no API calls, no auth needed
 *   node tools/generate-audio.js --force              # regenerate EVERYTHING
 *   node tools/generate-audio.js --force=greetings    # regenerate just one topic/convo's existing files too
 *   node tools/generate-audio.js --voice=yue-HK-Chirp3-HD-Kore                           # words/sentences narrator voice (default: Puck)
 *   node tools/generate-audio.js --voice-you=... --voice-other=...                       # override convo voices
 *
 * Other well-regarded Chirp3-HD voices worth A/B testing (female: Aoede, Kore,
 * Leda, Zephyr — male: Charon, Fenrir, Orus, Puck). Full list of 30 at:
 * https://cloud.google.com/text-to-speech/docs/chirp3-hd
 *
 * Output layout:
 *   audio/words/{wordId}.mp3                    e.g. audio/words/greetings-001.mp3
 *   audio/sentences/{sid}.mp3                   e.g. audio/sentences/greetings-t1-s01.mp3
 *   audio/convos/topic-{topicKey}-r{round}-line{NN}.mp3   e.g. audio/convos/topic-greetings-r1-line01.mp3
 *   audio/convos/{convoKey}-line{NN}.mp3        e.g. audio/convos/beginner-s1-line01.mp3
 *
 * NOTE: conversation lines' `opts` (alternate multiple-choice answers in Fill-
 * the-Gap mode) are NOT included yet — only the canonical `c` line per turn.
 * Extend collectJobs() if the app wiring step turns out to need those too.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO_ROOT = path.join(__dirname, '..');
const TOPICS_DIR = path.join(REPO_ROOT, 'data', 'topics');
const CONVOS_FILE = path.join(REPO_ROOT, 'data', 'path_convos.json');
const OUT_WORDS = path.join(REPO_ROOT, 'audio', 'words');
const OUT_SENTENCES = path.join(REPO_ROOT, 'audio', 'sentences');
const OUT_CONVOS = path.join(REPO_ROOT, 'audio', 'convos');

const LANGUAGE_CODE = 'yue-HK';

const args = process.argv.slice(2);
const arg = (name) => { const m = args.find(a => a.startsWith(`--${name}=`)); return m ? m.split('=').slice(1).join('=') : null; };
const DRY = args.includes('--dry');
const FORCE_ALL = args.includes('--force');
const FORCE_SCOPE = arg('force');
const ONLY_TOPIC = arg('topic');
const ONLY_CONVO = arg('convo');
const VOICE_NAME = arg('voice') || 'yue-HK-Chirp3-HD-Puck';
const VOICE_YOU = arg('voice-you') || 'yue-HK-Chirp3-HD-Kore';
const VOICE_OTHER = arg('voice-other') || 'yue-HK-Chirp3-HD-Puck';

function log(msg) { console.log(msg); }

function getAccessToken() {
  try {
    return execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim();
  } catch (err) {
    console.error('\nCould not get an access token from gcloud. Make sure you have run:');
    console.error('  gcloud init\n');
    process.exit(1);
  }
}

function getProjectId() {
  try {
    const id = execSync('gcloud config get-value project', { encoding: 'utf8' }).trim();
    if (!id || id === '(unset)') throw new Error('no project set');
    return id;
  } catch (err) {
    console.error('\nCould not read the active gcloud project. Run `gcloud init` first.\n');
    process.exit(1);
  }
}

async function synthesize(text, voice, accessToken, projectId) {
  const res = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'x-goog-user-project': projectId,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: LANGUAGE_CODE, name: voice },
      audioConfig: { audioEncoding: 'MP3' },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`TTS API error ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  return Buffer.from(data.audioContent, 'base64');
}

// Walks every topic file (all rounds, including each round's Chat-tab convo)
// + path_convos.json and builds the full list of { outPath, text, voice,
// label } jobs. No network access, no auth needed.
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
  // entirely when testing a single --topic, since there's no meaningful
  // overlap (that content lives in topic-scoped Chat convos above instead).
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

  log(`${jobs.length} total items (${pending.length} to generate, ${jobs.length - pending.length} already exist).`);
  log(`Words/sentences voice: ${VOICE_NAME}`);
  log(`Conversation voices: You=${VOICE_YOU}  Other=${VOICE_OTHER}\n`);

  if (DRY) {
    pending.forEach(j => log(`  would generate: ${j.label}  [${j.voice}]`));
    return;
  }
  if (pending.length === 0) {
    log('Nothing to do.');
    return;
  }

  const accessToken = getAccessToken();
  const projectId = getProjectId();

  [OUT_WORDS, OUT_SENTENCES, OUT_CONVOS].forEach(dir => fs.mkdirSync(dir, { recursive: true }));

  let done = 0, failed = 0;
  for (const job of pending) {
    try {
      const audio = await synthesize(job.text, job.voice, accessToken, projectId);
      fs.writeFileSync(job.outPath, audio);
      done++;
      log(`[${done + failed}/${pending.length}] \u2713 ${job.label}`);
    } catch (err) {
      failed++;
      log(`[${done + failed}/${pending.length}] \u2717 ${job.label}: ${err.message}`);
    }
    await new Promise(r => setTimeout(r, 100)); // stay comfortably under rate limits
  }

  log(`\nDone. ${done} generated, ${failed} failed, ${jobs.length - pending.length} already existed.`);
  if (failed > 0) process.exitCode = 1;
}

main();
