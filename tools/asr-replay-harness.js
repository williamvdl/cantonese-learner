#!/usr/bin/env node
// ── asr-replay-harness.js ──────────────────────────────────────────────────
// Replays REAL recorded recogniser traces through the app's own accumulation
// and matching logic.
//
// Every other harness here builds its inputs. This one does not: the fixtures
// in tools/fixtures/ are actual Chrome-on-Android output, captured by
// tools/tail-probe.html, including the exact event timings and the empty final
// segments Android emits. That makes it the only check that can catch a
// regression in how real recogniser behaviour is handled, as opposed to how we
// imagine it behaves — and the gap between those two is what six probe builds
// went into closing.
//
// Asserted:
//   1. The accumulation rules still produce what they produced when the
//      fixture was recorded (a change here is a change to Speak everywhere).
//   2. resolveHeard() recovers the revision case — a later segment replacing an
//      earlier one, which plain appending destroys.
//   3. Arabic-digit folding works on the attempt that actually produced one.
//   4. The pass rate does not silently regress.
//
// Usage: node tools/asr-replay-harness.js

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');

const src = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
const grab = name => {
  const i = src.indexOf('function ' + name + '(');
  if (i < 0) throw new Error('not found in app.js: ' + name);
  let d = 0;
  for (let k = src.indexOf('{', i); k < src.length; k++) {
    if (src[k] === '{') d++;
    else if (src[k] === '}') { d--; if (!d) return src.slice(i, k + 1); }
  }
};
const grabConst = re => { const m = src.match(re); if (!m) throw new Error('const not found'); return m[0]; };

const env = { console };
vm.createContext(env);
vm.runInContext([
  grabConst(/const ASR_DIGITS = \{[\s\S]*?\};/),
  grab('normalizeChinese'),
  grab('editDistance'),
  grabConst(/const SPEAK_FINAL_PARTICLES[\s\S]*?\]\);/),
  grab('fuzzyMatch'),
  grab('deduplicateRepeats'),
  grab('resolveHeard'),
].join('\n\n'), env);

// Mirrors the accumulation in startSpeechRecognition().onresult exactly. Kept
// in step by assertion 1 below rather than by hoping — if the rules in app.js
// change, the recorded expectations stop matching and this goes red.
function accumulate(trace) {
  let finalTranscript = '';
  const segments = [];
  for (const t of trace) {
    if (t.error || !t.final) continue;
    const transcript = t.text;
    if (finalTranscript && transcript === finalTranscript) { /* rule 1 */ }
    else if (finalTranscript && transcript.length > finalTranscript.length && transcript.startsWith(finalTranscript)) finalTranscript = transcript;
    else finalTranscript += transcript;
    finalTranscript = env.deduplicateRepeats(finalTranscript);
    if (transcript && transcript.trim()) segments.push(transcript.trim());
  }
  return { accumulated: finalTranscript.trim(), segments };
}

let failures = 0;
const fail = m => { failures++; console.log('  FAIL ' + m); };
const ok = m => console.log('  ok   ' + m);

const files = fs.readdirSync(path.join(ROOT, 'tools/fixtures')).filter(f => f.endsWith('.json'));
if (!files.length) { console.error('no fixtures found in tools/fixtures/'); process.exit(1); }

for (const file of files) {
  const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/fixtures', file), 'utf8'));
  console.log('\n═══ ' + file + ' — ' + data.attempts.length + ' recorded attempts ═══');

  let accOnly = 0, withSegments = 0;
  const rows = [];
  for (const a of data.attempts) {
    const { accumulated, segments } = accumulate(a.trace);
    const accMatch = env.fuzzyMatch(accumulated, a.target);
    const r = env.resolveHeard(accumulated, segments, a.target);
    if (accMatch) accOnly++;
    if (r.matched) withSegments++;
    rows.push({ accumulated, segments, accMatch, r, target: a.target });
  }

  console.log('\n— 1. accumulation is unchanged —');
  // Two attempts are load-bearing and pinned by value: #11 is the revision case
  // (the whole reason resolveHeard exists) and #10 is the Arabic-digit case.
  const a11 = rows[10], a10 = rows[9];
  if (!a11) fail('fixture has no attempt #11');
  else if (a11.accumulated !== '一家二係一加二係三')
    fail(`attempt #11 accumulated to "${a11.accumulated}", expected "一家二係一加二係三" — the accumulation rules changed`);
  else ok('attempt #11 still accumulates to the appended form the rules produce');

  console.log('\n— 2. resolveHeard recovers the revision —');
  if (!a11) fail('no attempt #11');
  else if (a11.accMatch) fail('attempt #11 matched on accumulation alone — fixture no longer exercises the revision case');
  else if (!a11.r.matched) fail('attempt #11 not recovered by the segment fallback — the revision fix is not working');
  else if (a11.r.heard !== '一加二係三') fail(`attempt #11 recovered but shows "${a11.r.heard}", expected the matching segment 一加二係三`);
  else ok('attempt #11: accumulation fails, segment fallback recovers 一加二係三 (jat1 gaa1 ji6 hai6 saam1)');

  console.log('\n— 3. Arabic digits fold to Chinese numerals —');
  if (env.normalizeChinese('一家衣鞋3') !== '一家衣鞋三')
    fail('digit folding is not applied by normalizeChinese');
  else ok('3 folds to 三 (saam1) for comparison');
  if (!a10) fail('fixture has no attempt #10');
  else if (!/3|三/.test(a10.accumulated)) fail('attempt #10 no longer contains the digit — fixture changed');
  else ok('attempt #10 (一家衣鞋3) is present and exercises the fold');

  console.log('\n— 4. pass rate has not regressed —');
  console.log('     accumulation only:      ' + accOnly + ' / ' + data.attempts.length);
  console.log('     with segment fallback:  ' + withSegments + ' / ' + data.attempts.length);
  if (withSegments < accOnly) fail('the segment fallback made things WORSE — it must only ever accept, never reject');
  else if (withSegments < 3) fail(`expected at least 3 passes with the fallback, got ${withSegments}`);
  else ok('segment fallback is a strict improvement and holds at ' + withSegments);

  // The honest headline: even fixed, most attempts fail, because the dominant
  // cause is a real tone difference on 二 (ji6) heard as ji1, not a code bug.
  console.log('\n— 5. the limit of what code can fix —');
  const stillFailing = rows.filter(r => !r.r.matched).length;
  ok(stillFailing + ' of ' + data.attempts.length + ' attempts still fail, and should: 二 (ji6) was heard as ji1 in most of them');
}

console.log('');
if (failures) { console.log(`${failures} FAILURE(S)`); process.exit(1); }
console.log('asr-replay-harness: all assertions pass');
