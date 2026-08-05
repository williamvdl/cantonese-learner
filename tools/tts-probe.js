#!/usr/bin/env node
/*
 * tools/tts-probe.js — a listening probe for the syllabic-nasal defect.
 *
 * WHY THIS EXISTS
 * ---------------
 * The Chirp3-HD yue-HK voice (Preview since 2025-12-30) cannot produce a bare
 * syllabic nasal. Cantonese has two — m̩ and ŋ̍ — and both come back with a
 * vowel inserted: 唔 (m4) renders as "mo/muh/mon" and 五 (ng5) as "nong". The
 * inserted vowel VARIES with the surrounding syllables, which is what rules out
 * a dictionary error and identifies it as the acoustic model improvising a
 * nucleus it has no target for. Every other Cantonese-specific character —
 * 啲 (di1), 佢 (keoi5), 嘅 (ge3) — is fine, as is ng-plus-a-vowel (牛 ngau4).
 *
 * 207 of the app's 1,376 audio files contain an affected syllable (15%),
 * concentrated in sentences and conversations rather than the word list.
 *
 * Character substitution cannot fix this: there is no other common character
 * read as a bare m̩, and any substitute would fail the same way, because the
 * gap is in the phoneme inventory rather than the lexicon. So the only
 * remaining levers are a different voice family, or an SSML pronunciation
 * override — and both need to be judged by ear.
 *
 * WHAT IT DOES
 * ------------
 *   1. Asks the API which yue-HK voices exist RIGHT NOW (voices:list) rather
 *      than trusting the docs, which have contradicted themselves repeatedly
 *      on this exact question.
 *   2. Synthesises a fixed six-phrase test set through every one of them.
 *   3. For the SSML-capable families, repeats the two syllabic-nasal phrases
 *      with an IPA <phoneme> override, so a family that gets it wrong on plain
 *      text still gets a second chance.
 *   4. Writes an index.html that groups the results BY PHRASE, so each phrase
 *      is a row of players you can hear back to back. Comparing voices is the
 *      whole point; comparing them across folders is not a fair test.
 *
 * It writes ONLY into tools/tts-probe-out/ and touches nothing the app serves.
 * Nothing in /audio, /data or the app files is read or modified. Delete the
 * output folder when you are done — it is disposable and is not committed.
 *
 * USAGE
 *   node tools/tts-probe.js                 # every yue-HK voice, plain + SSML
 *   node tools/tts-probe.js --list          # just list the voices, no synthesis
 *   node tools/tts-probe.js --filter=Wavenet   # only voices matching a substring
 *   node tools/tts-probe.js --dry           # show the plan, spend nothing
 *
 * Auth is the same as generate-audio.js: `gcloud auth print-access-token`,
 * so if audio generation works, this works.
 *
 * COST: the full run is roughly 40 voices x 6 phrases of a few characters each —
 * comfortably inside the free monthly tier on every voice family. Chirp3-HD and
 * Gemini voices bill at a higher rate than Standard, but at this volume the
 * whole probe costs pennies at most.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const LANGUAGE_CODE = 'yue-HK';
const OUT_DIR = path.join(__dirname, 'tts-probe-out');

const args = process.argv.slice(2);
const arg = (name) => { const m = args.find(a => a.startsWith(`--${name}=`)); return m ? m.split('=').slice(1).join('=') : null; };
const LIST_ONLY = args.includes('--list');
const DRY = args.includes('--dry');
const FILTER = arg('filter');

// ── The test set ─────────────────────────────────────────────────────────────
// Six phrases, each chosen to isolate one variable. `ipa` is the pronunciation
// the override should force; phrases without one are not re-run under SSML.
//
// The control matters as much as the failures: if 牛 (ngau4) is also wrong on
// some voice, that voice is bad at Cantonese generally and its result on the
// other five tells you nothing about the syllabic-nasal question specifically.
const PHRASES = [
  {
    id: '1-m4-initial', c: '唔該', j: 'm4 goi1', e: 'thank you / excuse me',
    why: 'syllabic m̩, word-initial — the most common affected item in the app',
    ipa: 'm̩˨˩ kɔːi̯˥',
  },
  {
    id: '2-m4-medial', c: '差唔多', j: 'caa1 m4 do1', e: 'about the same',
    why: 'syllabic m̩ between two vowels — where the inserted vowel shifts',
    ipa: 'tsʰaː˥ m̩˨˩ tɔː˥',
  },
  {
    id: '3-ng5-alone', c: '五', j: 'ng5', e: 'five',
    why: 'syllabic ŋ̍, completely isolated — no neighbours to blame',
    ipa: 'ŋ̍˩˧',
  },
  {
    id: '4-ng5-initial', c: '午餐', j: 'ng5 caan1', e: 'lunch',
    why: 'syllabic ŋ̍ followed by a consonant',
    ipa: 'ŋ̍˩˧ tsʰaːn˥',
  },
  {
    id: '5-m4-sentence', c: '我唔識答呢題。', j: 'ngo5 m4 sik1 daap3 ni1 tai4.',
    e: "I don't know how to answer this question.",
    why: 'a full sentence — the register most of the 207 affected files are in',
    ipa: null,   // too long to be worth hand-writing IPA for; judged on plain text
  },
  {
    id: '6-control', c: '牛', j: 'ngau4', e: 'cow',
    why: 'CONTROL — ng plus a vowel, not a syllabic nasal. Should be correct everywhere.',
    ipa: null,
  },
];

// Families that accept SSML. Chirp3-HD's SSML support is documented
// inconsistently by Google — the voice-list page says it has none, the
// Chirp3-HD page lists a supported tag subset for synchronous requests — and
// <phoneme> appears on neither list. It is included anyway: two seconds of API
// time settles a question the documentation has not.
const SSML_FAMILIES = ['Standard', 'Wavenet', 'WaveNet', 'Neural2', 'Chirp3-HD'];

function log(m) { console.log(m); }

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

// Ask the API what exists, rather than hardcoding a list from the docs.
async function listVoices(token, project) {
  const res = await fetch(`https://texttospeech.googleapis.com/v1/voices?languageCode=${LANGUAGE_CODE}`, {
    headers: { 'Authorization': `Bearer ${token}`, 'x-goog-user-project': project },
  });
  if (!res.ok) throw new Error(`voices:list failed ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  return (data.voices || []).map(v => ({
    name: v.name,
    gender: v.ssmlGender || '?',
    family: familyOf(v.name),
  })).sort((a, b) => a.name.localeCompare(b.name));
}

// yue-HK-Chirp3-HD-Puck → 'Chirp3-HD';  yue-HK-Standard-A → 'Standard'
function familyOf(name) {
  const rest = name.replace(`${LANGUAGE_CODE}-`, '');
  const parts = rest.split('-');
  return parts.length > 1 ? parts.slice(0, -1).join('-') : rest;
}

// `body` is either { text } or { ssml } — the API takes one or the other.
async function synthesize(input, voiceName, token, project) {
  const res = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-goog-user-project': project,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input,
      voice: { languageCode: LANGUAGE_CODE, name: voiceName },
      audioConfig: { audioEncoding: 'MP3' },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status}: ${body.slice(0, 200).replace(/\s+/g, ' ')}`);
  }
  const data = await res.json();
  return Buffer.from(data.audioContent, 'base64');
}

function ssmlFor(phrase) {
  // The whole phrase is wrapped so the voice keeps natural prosody; only the
  // pronunciation is forced. `alphabet="ipa"` is the only alphabet with any
  // plausible Cantonese coverage — X-SAMPA is the fallback if this errors.
  return `<speak><phoneme alphabet="ipa" ph="${phrase.ipa}">${phrase.c}</phoneme></speak>`;
}

function writeIndex(results, voices) {
  // Grouped BY PHRASE rather than by voice: the judgement being made is
  // "which voice says this correctly", which is only answerable side by side.
  const byPhrase = PHRASES.map(p => ({
    phrase: p,
    rows: results.filter(r => r.phraseId === p.id),
  }));
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>yue-HK TTS probe — syllabic nasals</title>
<style>
  body { font: 15px/1.5 -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
         margin: 0; padding: 24px; background: #FAF7F2; color: #2B2622; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .sub { color: #6B625A; margin: 0 0 28px; font-size: 13px; }
  section { background: #fff; border: 1px solid #E6DED3; border-radius: 10px;
            padding: 18px 20px; margin-bottom: 20px; }
  h2 { font-size: 18px; margin: 0 0 2px; }
  .zh { font-size: 26px; }
  .jp { color: #C2410C; font-weight: 600; font-size: 14px; }
  .why { color: #6B625A; font-size: 13px; margin: 6px 0 14px; }
  table { border-collapse: collapse; width: 100%; }
  td { padding: 5px 10px 5px 0; border-bottom: 1px solid #F0EAE2; vertical-align: middle; }
  td.v { font-family: ui-monospace, Menlo, monospace; font-size: 12px; white-space: nowrap; }
  td.m { color: #6B625A; font-size: 12px; white-space: nowrap; }
  audio { height: 32px; width: 240px; }
  .err { color: #B42318; font-size: 12px; }
  .ssml td.v::after { content: ' + phoneme'; color: #C2410C; }
  .control { border-color: #C9DCC9; }
</style></head><body>
<h1>yue-HK TTS probe — syllabic nasals</h1>
<p class="sub">Generated ${new Date().toISOString().slice(0, 16).replace('T', ' ')} ·
${voices.length} voices · ${results.filter(r => !r.error).length} clips.
Listen down each column: the question is whether the <b>m</b> in 唔 and the
<b>ng</b> in 五 are bare nasals or have a vowel in them.</p>
${byPhrase.map(g => `
<section${g.phrase.id === '6-control' ? ' class="control"' : ''}>
  <h2><span class="zh">${esc(g.phrase.c)}</span> <span class="jp">${esc(g.phrase.j)}</span></h2>
  <div class="why">${esc(g.phrase.e)} — ${esc(g.phrase.why)}</div>
  <table>${g.rows.map(r => `
    <tr${r.mode === 'ssml' ? ' class="ssml"' : ''}>
      <td class="v">${esc(r.voice)}</td>
      <td class="m">${esc(r.family)} · ${esc(r.gender).toLowerCase()}</td>
      <td>${r.error ? `<span class="err">${esc(r.error)}</span>`
                    : `<audio controls preload="none" src="${esc(r.file)}"></audio>`}</td>
    </tr>`).join('')}
  </table>
</section>`).join('')}
</body></html>`;
  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), html);
}

(async function main() {
  const token = getAccessToken();
  const project = getProjectId();

  log(`\nyue-HK TTS probe · project ${project}`);
  const all = await listVoices(token, project);
  const voices = FILTER ? all.filter(v => v.name.includes(FILTER)) : all;

  const families = [...new Set(all.map(v => v.family))];
  log(`\n${all.length} yue-HK voices available, in ${families.length} families:`);
  families.forEach(f => {
    const names = all.filter(v => v.family === f).map(v => v.name.replace(`${LANGUAGE_CODE}-${f}-`, ''));
    log(`  ${f.padEnd(12)} ${names.length.toString().padStart(2)}  (${names.join(', ')})`);
  });
  if (LIST_ONLY) { log(''); return; }
  if (FILTER) log(`\nfilter "${FILTER}" → ${voices.length} of ${all.length} voices`);

  // Plain text for every phrase; SSML only for the phrases with an IPA target,
  // and only on families that might accept it.
  const jobs = [];
  for (const v of voices) {
    for (const p of PHRASES) {
      jobs.push({ voice: v.name, family: v.family, gender: v.gender, phraseId: p.id, mode: 'text',
                  input: { text: p.c },
                  file: `${p.id}__${v.name.replace(`${LANGUAGE_CODE}-`, '')}__text.mp3` });
    }
    if (SSML_FAMILIES.some(f => v.family.includes(f))) {
      for (const p of PHRASES.filter(x => x.ipa)) {
        jobs.push({ voice: v.name, family: v.family, gender: v.gender, phraseId: p.id, mode: 'ssml',
                    input: { ssml: ssmlFor(p) },
                    file: `${p.id}__${v.name.replace(`${LANGUAGE_CODE}-`, '')}__phoneme.mp3` });
      }
    }
  }

  log(`\n${jobs.length} clips to generate (${jobs.filter(j => j.mode === 'text').length} plain, ${jobs.filter(j => j.mode === 'ssml').length} with a phoneme override)`);
  if (DRY) { log('\n--dry: nothing generated, nothing spent.\n'); return; }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const results = [];
  let ok = 0, failed = 0;
  for (let i = 0; i < jobs.length; i++) {
    const j = jobs[i];
    process.stdout.write(`\r  ${i + 1}/${jobs.length}  ${j.file.padEnd(58).slice(0, 58)}`);
    try {
      const audio = await synthesize(j.input, j.voice, token, project);
      fs.writeFileSync(path.join(OUT_DIR, j.file), audio);
      results.push({ ...j, error: null });
      ok++;
    } catch (err) {
      // A failure is a RESULT, not a crash — "this family rejects <phoneme>"
      // is exactly one of the things the probe is here to find out.
      results.push({ ...j, error: err.message });
      failed++;
    }
    await new Promise(r => setTimeout(r, 60));   // gentle on the quota
  }
  process.stdout.write('\r' + ' '.repeat(78) + '\r');

  writeIndex(results, voices);

  log(`\n${ok} clips written, ${failed} rejected by the API.`);
  if (failed) {
    const byErr = {};
    results.filter(r => r.error).forEach(r => {
      const k = `${r.family} / ${r.mode}`;
      (byErr[k] = byErr[k] || []).push(r.error);
    });
    log('\nrejections (these are findings, not bugs in this script):');
    Object.entries(byErr).forEach(([k, v]) => log(`  ${k.padEnd(22)} ${v.length}x  ${v[0]}`));
  }
  log(`\nOpen this and listen down each section:\n  ${path.join(OUT_DIR, 'index.html')}\n`);
  log('What you are judging, in order:');
  log('  1. Does the CONTROL (牛 ngau4) sound right? If not, ignore that voice entirely.');
  log('  2. Is the m in 唔該 a bare nasal, or does it have a vowel in it?');
  log('  3. Same for the ng in 五.');
  log('  4. If a voice passes 2 and 3 — how does it sound next to Chirp3-HD on the sentence?');
  log('     That last one is the real decision: accuracy against naturalness.\n');
})().catch(err => {
  console.error('\n' + err.message + '\n');
  process.exit(1);
});
