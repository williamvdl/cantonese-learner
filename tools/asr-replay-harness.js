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
  grab('readingsFor'),
  grab('sameSoundAt'),
  grabConst(/const IDENTITY_EQ = [\s\S]*?;/),
  grab('speakEqFor'),
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
// EVERY CASE HERE IS A WHOLE SENTENCE, and that is not stylistic. The v150
// version of this section tested isolated character pairs, which is the SAME
// mistake the v150 code made — a character's reading depends on the word it sits
// in, so a test built from bare characters agrees with a bug built from bare
// characters and reports green. It did: 蕃茄 (faan1 ke2) for 番茄 (faan1 ke2)
// shipped broken with this section passing. A test written from the same wrong
// assumption as the code can only ever confirm it.
console.log('\n— 6. same-sound equality forgives the recogniser, not the learner (DES-57) —');
{
  // [target, heard, shouldPass, note]. Targets are real corpus sentences; heard
  // strings are real recogniser output where reported, and otherwise a single
  // deliberate substitution into one.
  const cases = [
    ['好，要粥同餃子。我好餓㗎！', '好要捉同餃子我好餓㗎',  true,
     'reported: 捉 (zuk1) for 粥 (zuk1), nothing else differed'],
    ['好，要粥同餃子。我好餓㗎！', '好要竹筒餃子我好我㗎',  true,
     'reported: 竹 (zuk1) and 筒 (tung4) fold; 我 (ngo5) for 餓 (ngo6) is one real slip, inside budget'],
    ['好，要粥同餃子。我好餓㗎！', '好要祝同餃子我好餓㗎',  true,
     'device QA: 祝 (zuk1), a third substitute the build never saw'],
    ['我想買啲薯仔同番茄。',       '我想買啲薯仔同蕃茄',    true,
     'reported v150 REGRESSION: 蕃 reads faan1 in 蕃茄 but faan4 alone — the whole-string fix'],
    ['好，要粥同餃子。我好餓㗎！', '好腰竹筒餃姐我好我㗎',  false,
     'three real differences (腰 jiu1, 姐 ze4, 我 ngo5) exceed the allowance of 2'],

    // ── Below the four-character floor (v152) ──────────────────────────────
    // Eleven corpus conversation lines are this short. A fold must still be
    // free here; a real edit must still be fatal. The v151 code returned false
    // before either could be decided.
    ['唔該晒！',   '唔該曬',   true,
     'reported v151: 曬 and 晒 are both saai3 — a fold is not an edit, so the allowance of 0 must not block it'],
    // The cost of the single-reading rule, asserted rather than left implicit.
    // 哂 IS used colloquially for saai3, but the dictionary's PRIMARY reading is
    // can2 and saai3 is its secondary — so under DES-57 it does not fold and
    // this is a false reject. Accepted deliberately: the "any reading matches"
    // alternative was measured and folded 心 (sam1) into 新 (san1) and 係 (hai6)
    // into 喺 (hai2), which is far worse. Asserted as FAILING so that if the
    // rule is ever loosened, this line is the first place it shows up.
    ['唔該晒！',   '唔該哂',   false,
     'KNOWN LIMIT: 哂 reads can2 primary (saai3 secondary), so it does not fold — the price of one-reading-each'],
    ['多謝你！',   '多謝妳',   true,
     '妳 and 你 are both nei5'],
    ['好彩！',     '好菜',     false,
     '菜 (coi3) is not 彩 (coi2) — a real tone difference at three characters must still fail'],
    ['多謝你！',   '多謝佢',   false,
     '佢 (keoi5) for 你 (nei5) is a different word, and the allowance of 0 must still reject it'],
  ];

  for (const [target, heard, shouldPass, note] of cases) {
    const got = env.fuzzyMatch(heard, target);
    if (got !== shouldPass) fail(`${heard} vs ${target} → ${got}, expected ${shouldPass} — ${note}`);
    else ok(`${shouldPass ? 'passes' : 'fails'}: ${note}`);
  }

  // Tone must survive. Asserted on the EQ DIRECTLY, at the position that
  // differs, rather than through a fuzzyMatch() verdict — the first draft of
  // this block went through fuzzyMatch() on four-character targets and reported
  // green because the allowance of 1 was absorbing the substitution, so it was
  // measuring the budget and calling it the rule. Where a pass could come from
  // either, the test proves nothing.
  const mustNotFold = [
    ['我好餓喇',       '我好我喇',       2, '餓 (ngo6) vs 我 (ngo5) — the reported learner slip'],
    ['我好開心喇',     '我好開新喇',     3, '心 (sam1) vs 新 (san1)'],
    ['我係學生喇',     '我喺學生喇',     1, '係 (hai6) vs 喺 (hai2)'],
    ['我想食嘢喇',     '我想識嘢喇',     2, '食 (sik6) vs 識 (sik1)'],
    ['佢好好人喇',     '佢好蠔人喇',     2, '好 (hou2) vs 蠔 (hou4)'],
  ];
  for (const [target, heard, pos, why] of mustNotFold) {
    // An off-by-one in `pos` compares a character with itself and the assertion
    // becomes vacuous — it happened while writing this. Fail loudly instead.
    if (heard[pos] === target[pos]) { fail(`test bug: position ${pos} is identical in both strings — ${why}`); continue; }
    const eqf = env.speakEqFor(heard, target);
    if (eqf(pos, pos, heard[pos], target[pos]))
      fail(`${heard[pos]} folded into ${target[pos]} in context — ${why} must stay distinct`);
    else ok(`stays distinct in context: ${why}`);
  }

  // And the positive control on the same mechanism: the reported substitutions
  // DO fold at their position, in their sentence.
  const mustFold = [
    ['我想買啲薯仔同番茄', '我想買啲薯仔同蕃茄', 7, '蕃 → 番, both faan1 in 蕃茄/番茄'],
    ['好要粥同餃子我好餓㗎', '好要捉同餃子我好餓㗎', 2, '捉 → 粥, both zuk1'],
    ['好要粥同餃子我好餓㗎', '好要祝同餃子我好餓㗎', 2, '祝 → 粥, both zuk1'],
    ['好要粥同餃子我好餓㗎', '好要粥筒餃子我好餓㗎', 3, '筒 → 同, both tung4'],
  ];
  for (const [target, heard, pos, why] of mustFold) {
    if (heard[pos] === target[pos]) { fail(`test bug: position ${pos} is identical in both strings — ${why}`); continue; }
    const eqf = env.speakEqFor(heard, target);
    if (!eqf(pos, pos, heard[pos], target[pos]))
      fail(`${heard[pos]} did not fold into ${target[pos]} in context — ${why}`);
    else ok(`folds in context: ${why}`);
  }

  // The context dependency itself, asserted directly rather than only through a
  // verdict. If these two ever agree, readings are being resolved per character
  // again and the v150 regression is back.
  const inWord = env.readingsFor('蕃茄')[0];
  const alone  = env.readingsFor('蕃')[0];
  if (inWord !== 'faan1') fail(`蕃 in 蕃茄 read as ${inWord}, expected faan1`);
  else if (inWord === alone) fail('蕃 reads the same alone as in 蕃茄 — the context dependency this guards has gone');
  else ok(`context is honoured: 蕃 reads ${inWord} in 蕃茄 but ${alone} alone`);

  // A character with no reading anywhere must never fold. Guessing would turn a
  // coverage gap into a silent pass, the one direction this must not fail in.
  const eq = env.speakEqFor('\u{2A6A5}', '粥');
  if (eq(0, 0, '\u{2A6A5}', '粥'))
    fail('an unreadable character folded against a real one — coverage gaps must reject, not pass');
  else ok('a character with no reading from either source never folds');

  // The grid and the matcher must agree on the reported regression, since the
  // screenshot showed them disagreeing: the heard line printed faan1 while the
  // grid marked the character wrong.
  const bd = env.renderSpeakBreakdown
    ? env.renderSpeakBreakdown('我想買啲薯仔同蕃茄', '我想買啲薯仔同番茄。', 'ngo5 soeng2 maai5 di1 syu4 zai2 tung4 faan1 ke2.', 'close')
    : null;
  if (!bd) ok('(breakdown not lifted into this harness — covered by sentence-review-harness)');
  else if (bd.hasDiff) fail('the grid still marks 蕃 wrong while the matcher passes it — panel and matcher disagree');
  else ok('the grid marks every character correct on the reported case, matching the matcher');
}

console.log('');
if (failures) { console.log(`${failures} FAILURE(S)`); process.exit(1); }
console.log('asr-replay-harness: all assertions pass');
