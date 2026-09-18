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
// `store` and `window` are what charReading() reaches for (DES-57). The real
// corpus table is loaded so homophone folding is tested against the readings the
// app actually ships, not a stub; the dictionary is the same vendored file.
env.store = { charJyutping: JSON.parse(fs.readFileSync(path.join(ROOT, 'data/char-jyutping.json'), 'utf8')) };
env.window = { ToJyutping: require(path.join(ROOT, 'vendor/to-jyutping.js')) };
vm.createContext(env);
vm.runInContext([
  grabConst(/const ASR_DIGITS = \{[\s\S]*?\};/),
  grabConst(/const ASR_PLACES = \[[\s\S]*?\];/),
  grab('foldAsrNumerals'),
  grab('normalizeChinese'),
  // DES-57 same-sound equality. editDistance() below calls speakCharsEqual(),
  // so these must be in scope before it — the whole point of the change is that
  // the matcher and the grid share one equality test, and a harness that lifted
  // only one of them would be testing something the app does not run.
  grab('charJyutpingSyllables'),
  grab('charReading'),
  grab('isSameSound'),
  grabConst(/const speakCharsEqual = [\s\S]*?;/),
  grab('editDistance'),
  grabConst(/const SPEAK_FINAL_PARTICLES[\s\S]*?\]\);/),
  // Added v150. These have been called by fuzzyMatch() since v144 but were never
  // lifted here, so this harness threw on load and had been red — silently, since
  // nothing reads its exit code — for every release from v144 to v148. Recorded
  // in STATUS.md notes: a standing check that fails to LOAD reports nothing, and
  // looks the same from outside as one that was never run.
  grabConst(/const SPEAK_PARTICLE_VARIANTS[\s\S]*?\]\);/),
  grabConst(/const canonicalParticle = [\s\S]*?;/),
  grab('isForgivenParticleSwap'),
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

  // DES-48. The fold is VALUE-AWARE, and the table below is the whole
  // specification — every multi-character numeral run the corpus actually
  // contains is in it, derived by scanning data/topics/*.json rather than
  // recalled. A per-digit regression (10 → 一零 rather than 十) is what this
  // catches: it is invisible in normal use and shows up only as a correctly
  // spoken sentence being marked wrong, which is the failure DES-39 exists to
  // prevent. The 5+ digit row is not an edge case being tidied away — it is the
  // one place a value reading WOULD be a guess, so it must stay per-digit.
  const foldCases = [
    ['0', '零'], ['3', '三'], ['9', '九'],
    ['10', '十'], ['11', '十一'], ['12', '十二'], ['15', '十五'],
    ['20', '二十'], ['30', '三十'], ['35', '三十五'], ['38', '三十八'],
    ['40', '四十'], ['50', '五十'], ['99', '九十九'],
    ['100', '一百'], ['105', '一百零五'], ['110', '一百一十'],
    ['180', '一百八十'], ['200', '二百'], ['500', '五百'],
    ['1000', '一千'], ['1005', '一千零五'], ['1024', '一千零二十四'],
    ['98765', '九八七六五'],
  ];
  const foldBad = foldCases.filter(([inp, exp]) => env.foldAsrNumerals(inp) !== exp);
  if (foldBad.length) foldBad.forEach(([inp, exp]) => fail(`fold ${inp} → "${env.foldAsrNumerals(inp)}", expected ${exp}`));
  else ok(`value-aware fold correct on all ${foldCases.length} forms, incl. every multi-character run in the corpus`);

  // The reported defect, pinned by value: a correctly spoken sentence whose
  // transcript came back with digits must compare EQUAL to its target, not
  // merely within the DES-39 edit allowance. Under the old per-digit fold this
  // produced 我生日係三月一零號 and marked 十 (sap6) wrong with a red 零.
  if (env.normalizeChinese('我生日係3月10號') !== env.normalizeChinese('我生日係三月十號。'))
    fail('我生日係3月10號 does not normalise equal to its target — the v140 numeral defect is back');
  else ok('我生日係3月10號 normalises equal to 我生日係三月十號 (ngo5 saang1 jat6 hai6 saam1 jyut6 sap6 hou6)');

  // Targets are authored in characters, so the fold must never alter one.
  // If this ever fires, the fold has started rewriting content rather than
  // repairing transcripts.
  const targets = [...new Set(data.attempts.map(a => a.target))].concat(['我生日係三月十號', '一百八十蚊', '十一點']);
  const altered = targets.filter(t => env.foldAsrNumerals(t) !== t);
  if (altered.length) fail(`the fold altered authored target(s): ${altered.join(', ')}`);
  else ok('the fold is a no-op on every authored target — it only ever repairs the heard side');

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

// ── 6. Same-sound equality (DES-57) ────────────────────────────────────────
// Built from the two REPORTED attempts on 好，要粥同餃子。我好餓㗎！, not from
// invented pairs. Both were graded wrong before v150 on characters the learner
// never mispronounced.
console.log('\n— 6. same-sound equality forgives the recogniser, not the learner (DES-57) —');
{
  const target = '好，要粥同餃子。我好餓㗎！';

  // Forgiven: identical sound AND tone. The first three are what the recogniser
  // actually substituted on the two reported attempts.
  const sameSound = [
    ['粥', '竹', 'zuk1'], ['粥', '捉', 'zuk1'], ['同', '筒', 'tung4'],
    ['麵', '面', 'min6'], ['三', '衫', 'saam1'], ['九', '狗', 'gau2'],
  ];
  // NOT forgiven: a real difference in the syllable or the tone. 我 (ngo5) /
  // 餓 (ngo6) is the learner's actual slip on attempt 1 and must survive. The
  // rest are pairs an "any reading matches" rule would have wrongly folded —
  // each destroys a distinction the corpus teaches, so each is a standing guard
  // against this rule being loosened later.
  const different = [
    ['我', '餓', 'ngo5 vs ngo6 — the real tone slip on the reported attempt'],
    ['心', '新', 'sam1 vs san1'], ['係', '喺', 'hai6 vs hai2'],
    ['時', '士', 'si4 vs si2'],   ['花', '化', 'faa1 vs faa2'],
    ['好', '蠔', 'hou2 vs hou4'], ['開', '海', 'hoi1 vs hoi2'],
    ['食', '識', 'sik6 vs sik1'],
  ];

  let bad = 0;
  for (const [a, b, j] of sameSound) {
    if (!env.isSameSound(a, b)) { fail(`${a} / ${b} should fold — both ${j}`); bad++; }
  }
  if (!bad) ok(`${sameSound.length} homophone pairs fold, incl. 粥/竹/捉 (zuk1) and 同/筒 (tung4)`);

  bad = 0;
  for (const [a, b, why] of different) {
    if (env.isSameSound(a, b)) { fail(`${a} / ${b} must NOT fold — ${why}`); bad++; }
  }
  if (!bad) ok(`${different.length} near-pairs stay distinct, incl. 我 (ngo5) / 餓 (ngo6) — tone still counts`);

  // A character with no reading anywhere must never match. Guessing here would
  // turn a coverage gap into a silent pass, which is the one direction this
  // change must not fail in.
  if (env.isSameSound('粥', '\u{2A6A5}') || env.isSameSound('\u{2A6A5}', '粥'))
    fail('an unreadable character folded against a real one — coverage gaps must reject, not pass');
  else ok('a character with no reading from either source never folds');

  // End to end, on the two attempts exactly as reported.
  const a1 = '好要竹筒餃子我好我㗎';   // 3 substitutions before v150: 竹, 筒, 我
  const a2 = '好要捉同餃子我好餓㗎';   // 1 substitution before v150: 捉
  if (!env.fuzzyMatch(a2, target)) fail('reported attempt 2 still fails — only 捉 (zuk1) for 粥 (zuk1) differed');
  else ok('reported attempt 2 passes: 捉 (zuk1) folds to 粥 (zuk1), nothing else differed');

  if (!env.fuzzyMatch(a1, target)) fail('reported attempt 1 still fails — 竹/筒 fold, leaving one real slip inside budget');
  else ok('reported attempt 1 passes: 竹 (zuk1) and 筒 (tung4) fold, 我 (ngo5) for 餓 (ngo6) is the single flagged slip');

  // Mutation test: the RULE must be doing the work above, not the edit budget
  // absorbing everything regardless. Three genuine differences in a ten-
  // character target exceed the allowance of 2 and must still fail.
  //
  // The first draft of this mutation used 吖 (aa1) in the final slot and passed,
  // correctly: 吖 (aa1) and 㗎 (gaa3) are BOTH taught sentence-final particles,
  // so that swap is free under fuzzyMatch() rule 1 and was never going to cost
  // an edit. Kept as a note because it is an easy mistake to repeat — a mutation
  // that lands on another forgiveness rule tests nothing. These three do not:
  // 腰 (jiu1) for 要 (jiu3) and 姐 (ze4) for 子 (zi2) differ in tone and in
  // syllable respectively, and neither is a particle.
  if (env.fuzzyMatch('好腰竹筒餃姐我好我㗎', target))
    fail('three real differences still passed — the budget is absorbing genuine errors');
  else ok('three real differences still fail — folding frees the budget, it does not remove it');
}

console.log('');
if (failures) { console.log(`${failures} FAILURE(S)`); process.exit(1); }
console.log('asr-replay-harness: all assertions pass');
