#!/usr/bin/env node
/* generate-audio.js — batch-generates Cantonese speech audio (MP3) for every
 * word, sentence, and conversation line, using Google Cloud Text-to-Speech's
 * Chirp3-HD yue-HK voice. Vanilla Node, zero npm deps — uses Node's built-in
 * fetch() and authenticates via the gcloud CLI's access token, so you must
 * have already run (once):
 *     gcloud init
 *     gcloud auth application-default login
 *
 * INCREMENTAL: skips any output file that already exists, so re-running only
 * fills gaps from newly added content. Edited existing text won't auto-detect
 * as stale — delete the specific file (or use --force) to regenerate it.
 *
 * Usage:
 *   node tools/generate-audio.js                    # everything missing
 *   node tools/generate-audio.js --topic=greetings   # just one topic (testing)
 *   node tools/generate-audio.js --dry               # list what would generate, no API calls, no auth needed
 *   node tools/generate-audio.js --force              # regenerate EVERYTHING
 *   node tools/generate-audio.js --force=greetings    # regenerate just one topic's existing files too
 *   node tools/generate-audio.js --voice=yue-HK-Chirp3-HD-Puck   # try a different voice
 *
 * Other well-regarded Chirp3-HD voices worth A/B testing (female: Aoede, Kore,
 * Leda, Zephyr — male: Charon, Fenrir, Orus, Puck). Full list of 30 at:
 * https://cloud.google.com/text-to-speech/docs/chirp3-hd
 *
 * Output layout:
 *   audio/words/{wordId}.mp3         e.g. audio/words/greetings-001.mp3
 *   audio/sentences/{sid}.mp3        e.g. audio/sentences/greetings-t1-s01.mp3
 *   audio/convos/{convoKey}-line{NN}.mp3   e.g. audio/convos/beginner-s1-line01.mp3
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
const FORCE_TOPIC = arg('force');
const ONLY_TOPIC = arg('topic');
const VOICE_NAME = arg('voice') || 'yue-HK-Chirp3-HD-Kore';

function log(msg) { console.log(msg); }

function getAccessToken() {
  try {
    return execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim();
  } catch (err) {
    console.error('\nCould not get an access token from gcloud. Make sure you have run:');
    console.error('  gcloud init');
    console.error('  gcloud auth application-default login\n');
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

async function synthesize(text, accessToken, projectId) {
  const res = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'x-goog-user-project': projectId,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: LANGUAGE_CODE, name: VOICE_NAME },
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

// Walks every topic file (all rounds) + path_convos.json and builds the full
// list of { outPath, text, label } jobs. No network access, no auth needed.
function collectJobs() {
  const jobs = [];

  const topicFiles = fs.readdirSync(TOPICS_DIR).filter(f => f.endsWith('.json')).sort();
  for (const file of topicFiles) {
    const topicKey = file.replace(/\.json$/, '');
    if (ONLY_TOPIC && topicKey !== ONLY_TOPIC) continue;
    const data = JSON.parse(fs.readFileSync(path.join(TOPICS_DIR, file), 'utf8'));
    for (const round of Object.values(data.rounds || {})) {
      for (const w of (round.words || [])) {
        jobs.push({ outPath: path.join(OUT_WORDS, `${w.id}.mp3`), text: w.c, label: `word ${w.id} (${w.c})` });
      }
      for (const s of (round.sentences || [])) {
        jobs.push({ outPath: path.join(OUT_SENTENCES, `${s.sid}.mp3`), text: s.c, label: `sentence ${s.sid}` });
      }
    }
  }

  // Conversations are keyed by checkpoint/path, not topic — skip entirely
  // when testing a single topic, since there's no meaningful overlap.
  if (!ONLY_TOPIC) {
    const convoData = JSON.parse(fs.readFileSync(CONVOS_FILE, 'utf8'));
    for (const [convoKey, convo] of Object.entries(convoData.convos || {})) {
      (convo.lines || []).forEach((line, i) => {
        const n = String(i + 1).padStart(2, '0');
        jobs.push({ outPath: path.join(OUT_CONVOS, `${convoKey}-line${n}.mp3`), text: line.c, label: `${convoKey} line ${n}` });
      });
    }
  }

  return jobs;
}

function needsGeneration(job) {
  if (FORCE_ALL) return true;
  if (FORCE_TOPIC && job.outPath.includes(FORCE_TOPIC)) return true;
  return !fs.existsSync(job.outPath);
}

async function main() {
  const jobs = collectJobs();
  const pending = jobs.filter(needsGeneration);

  log(`${jobs.length} total items (${pending.length} to generate, ${jobs.length - pending.length} already exist).`);
  log(`Voice: ${VOICE_NAME}\n`);

  if (DRY) {
    pending.forEach(j => log(`  would generate: ${j.label}`));
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
      const audio = await synthesize(job.text, accessToken, projectId);
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
