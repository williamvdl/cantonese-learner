#!/usr/bin/env node
// ── speech-silence-harness.js ──────────────────────────────────────────────
// Standing check for cost guards 2 and 3 of the Azure speak path (DES-61):
// a silent clip is never sent, and only the speech in a clip is sent.
//
// WHY THIS EXISTS. Both guards rest on one function, analyseSpeech() in app.js,
// and on four constants calibrated from real recordings. Tune either the wrong
// way and the failure is silent in the worst direction: a real attempt is
// judged "silent", never sent, and the learner is told "I didn't catch
// anything" while having spoken perfectly well. That is a false reject with no
// recogniser to blame, so it gets a check of its own.
//
// INPUTS — real recordings, plus cases whose right answer is known by
// construction (PROBE_METHOD):
//   - the eleven native-speaker clips from the Pixel, read from the listening
//     probe's export in tools/runs/ (AGC off, as the app records). Every one
//     must be judged speech, and its trimmed span must keep all its speech.
//   - digital silence, quiet hiss, and a loud room with no speech: all silent.
//   - a real clip with two seconds of silence added either side: still speech,
//     and the trim must remove most of the added silence.
//   - a real clip under steady noise: still speech.
//
// The function is LIFTED from app.js, not copied, so a change there is what is
// tested. Usage: node tools/speech-silence-harness.js

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
const grab = name => {
  const i = src.indexOf('function ' + name + '(');
  if (i < 0) throw new Error('app.js no longer defines ' + name + '()');
  let d = 0;
  for (let k = src.indexOf('{', i); k < src.length; k++) {
    if (src[k] === '{') d++;
    else if (src[k] === '}') { d--; if (!d) return src.slice(i, k + 1); }
  }
};
const grabConst = name => { const m = src.match(new RegExp('const ' + name + ' = [^;]*;')); if (!m) throw new Error('app.js no longer defines ' + name); return m[0]; };
const env = { Math, Float32Array };
vm.createContext(env);
vm.runInContext([
  'SPEECH_RATE', 'SPEECH_FRAME', 'SPEECH_RMS_FLOOR', 'SPEECH_NOISE_MULT', 'SPEECH_MIN_VOICED_MS',
  'SPEECH_TRIM_PAD_BEFORE_MS', 'SPEECH_TRIM_PAD_AFTER_MS',
].map(grabConst).join('\n') + '\n' + grab('analyseSpeech') + '\nthis.analyseSpeech = analyseSpeech; this.RATE = SPEECH_RATE;', env);
const RATE = env.RATE;

let failures = 0;
const fail = m => { failures++; console.log('  FAIL ' + m); };
const ok = m => console.log('  ok   ' + m);

// Deterministic noise, so a run is repeatable.
let seed = 12345;
const rand = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const gauss = () => { let u = 0, v = 0; while (!u) u = rand(); v = rand(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const noise = (n, rms) => { const a = new Float32Array(n); for (let i = 0; i < n; i++) a[i] = gauss() * rms; return a; };
const concat = (...parts) => { const n = parts.reduce((s, p) => s + p.length, 0); const o = new Float32Array(n); let k = 0; for (const p of parts) { o.set(p, k); k += p.length; } return o; };

// ── Real recordings ────────────────────────────────────────────────────────
console.log('\n— 1. every real native-speaker clip is speech, and the trim keeps it all —');
const runsDir = path.join(ROOT, 'tools/runs');
const exportFile = fs.existsSync(runsDir) && fs.readdirSync(runsDir).find(f => /^listen-probe-native-.*\.json$/.test(f));
const clips = [];
if (!exportFile) {
  fail('no native listening-probe export in tools/runs/ — the real-recording half of this check cannot run');
} else {
  const run = JSON.parse(fs.readFileSync(path.join(runsDir, exportFile), 'utf8'));
  for (const a of run.attempts) {
    if (!a.audioWavBase64) continue;
    const buf = Buffer.from(a.audioWavBase64, 'base64');
    if (buf.readUInt32LE(24) !== RATE) { fail(`${a.id}: recorded at ${buf.readUInt32LE(24)} Hz, expected ${RATE}`); continue; }
    const n = (buf.length - 44) >> 1, pcm = new Float32Array(n);
    for (let i = 0; i < n; i++) pcm[i] = buf.readInt16LE(44 + i * 2) / 32768;
    clips.push({ id: a.sid + ' #' + a.item, pcm });
  }
  let bad = 0;
  for (const c of clips) {
    const r = env.analyseSpeech(c.pcm);
    if (!r.voicedMs) { fail(`${c.id}: judged SILENT — a real attempt would never be sent`); bad++; continue; }
    if (!(r.end > r.start)) { fail(`${c.id}: empty trimmed span`); bad++; }
  }
  if (clips.length < 11) fail(`only ${clips.length} clips with audio in ${exportFile}; expected 11`);
  if (!bad && clips.length) ok(`${clips.length} of ${clips.length} real clips judged speech (${exportFile})`);
}

// ── Constructed silence ────────────────────────────────────────────────────
console.log('\n— 2. a clip with no speech in it is never sent —');
for (const [label, pcm] of [
  ['3 s of digital silence', new Float32Array(RATE * 3)],
  ['5 s of quiet hiss (RMS 0.002)', noise(RATE * 5, 0.002)],
  ['5 s of a loud room, no speech (RMS 0.02)', noise(RATE * 5, 0.02)],
  ['30 s of quiet room — a forgotten Stop', noise(RATE * 30, 0.001)],
  // Pins the ABSOLUTE floor. In a near-silent room the adaptive threshold
  // (3x the noise floor) is tiny, so without SPEECH_RMS_FLOOR a soft knock
  // would pass for speech and the clip would be sent.
  ['near-silent room with one soft knock (RMS 0.004, 0.4 s)', concat(noise(RATE * 2, 0.0004), noise(RATE * 0.4, 0.004), noise(RATE * 2, 0.0004))],
]) {
  const r = env.analyseSpeech(pcm);
  if (r.voicedMs) fail(`${label}: judged speech (${r.voicedMs} ms) — it would be sent and billed`);
  else ok(`${label}: silent, not sent`);
}

// ── Trim and robustness on real speech ─────────────────────────────────────
console.log('\n— 3. the trim removes padding, and real speech survives noise —');
if (clips.length) {
  const c = clips[0];
  const pad = new Float32Array(RATE * 2);
  const padded = concat(pad, c.pcm, pad);
  // The same speech, padded, must trim to the same span shifted by the pad.
  // (Not "start inside the pad": real clips begin with their own silence too.)
  const r0 = env.analyseSpeech(c.pcm);
  const r = env.analyseSpeech(padded);
  const shift = pad.length, tol = Math.round(RATE * 0.1);
  const afterPad = Math.round(vm.runInContext('SPEECH_TRIM_PAD_AFTER_MS', env) * RATE / 1000);
  const kept = (r.end - r.start) / RATE, sentIn = padded.length / RATE;
  if (!r.voicedMs) fail('padded clip judged silent');
  // The unpadded clip's end can be clamped by the clip itself, where the padded
  // copy has room for the full after-margin — so the end may run up to that
  // margin further, never short of where the unpadded speech ended.
  else if (Math.abs(r.start - (r0.start + shift)) > tol || r.end < r0.end + shift - tol || r.end > r0.end + shift + afterPad + tol)
    fail(`padded clip: trimmed to ${(r.start / RATE).toFixed(2)}–${(r.end / RATE).toFixed(2)} s, expected to start at ${((r0.start + shift) / RATE).toFixed(2)} s and end by ${((r0.end + shift + afterPad) / RATE).toFixed(2)} s`);
  else ok(`4 s of added silence trimmed away: ${sentIn.toFixed(2)} s in, ${kept.toFixed(2)} s sent, same span as the unpadded clip`);

  let bad = 0;
  for (const cl of clips) {
    const n = noise(cl.pcm.length, 0.004);
    const mixed = cl.pcm.map((v, i) => v + n[i]);
    if (!env.analyseSpeech(mixed).voicedMs) { fail(`${cl.id}: judged silent under steady noise (RMS 0.004)`); bad++; }
  }
  if (!bad) ok(`all ${clips.length} real clips still judged speech under steady noise`);
}

console.log('');
if (failures) { console.log(`${failures} FAILURE(S)`); process.exit(1); }
console.log('speech-silence-harness: all assertions pass');
