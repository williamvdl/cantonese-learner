#!/usr/bin/env node
// ── sentence-review-harness.js ─────────────────────────────────────────────
// Stage 2 of the checkpoint sentence review build (DES-44 / MOCK-28).
//
// Renders every screen and every state of the activity headlessly, against the
// real corpus, and asserts the things that would otherwise only be caught by
// tapping through fifteen checkpoints by hand:
//
//   1. Availability is cache-independent — the v122 trap. A cold start must
//      still offer the activity, or a checkpoint silently reports itself
//      complete.
//   2. Every screen renders without throwing, in both modes, in all four
//      statuses.
//   3. Listen mode withholds the target until it should not.
//   4. Produce mode states NO verdict on a mismatch (DES-44) — never "wrong",
//      never "correct", and it must not reach for the red panel.
//   5. Listen mode DOES mark a genuine mismatch, so the no-verdict rule has not
//      leaked across modes.
//   6. The escape hatch marks an item revealed rather than failed.
//   7. Every control the renderer emits has a handler selector in render.js.
//
// Usage: node tools/sentence-review-harness.js

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');

const appSrc = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
const renderSrc = fs.readFileSync(path.join(ROOT, 'render.js'), 'utf8');
const dataSrc = fs.readFileSync(path.join(ROOT, 'data.js'), 'utf8');
const all = dataSrc + '\n' + appSrc + '\n' + renderSrc;

const grab = (src, name) => {
  const i = src.indexOf('function ' + name + '(');
  if (i < 0) throw new Error('not found: ' + name);
  let d = 0;
  for (let k = src.indexOf('{', i); k < src.length; k++) {
    if (src[k] === '{') d++;
    else if (src[k] === '}') { d--; if (!d) return src.slice(i, k + 1); }
  }
};
const grabConst = re => { const m = all.match(re); if (!m) throw new Error('const: ' + re); return m[0]; };

const topicCache = {};
for (const f of fs.readdirSync(path.join(ROOT, 'data/topics'))) {
  topicCache[f.replace('.json', '')] = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/topics', f), 'utf8'));
}
const paths = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/learning_paths.json'), 'utf8')).paths;
const pathConvos = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/path_convos.json'), 'utf8')).convos || {};
const charJyutping = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/char-jyutping.json'), 'utf8'));

const env = { console, JSON, Math, Number, String, Set, Array, Object, isNaN, parseInt, parseFloat };
env.window = env; env.globalThis = env; env.self = env;
vm.createContext(env);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'vendor/to-jyutping.js'), 'utf8'), env);

env.store = {
  topicCache, paths, pathConvos, charJyutping,
  roundData(k, r) { const t = this.topicCache[k]; return t ? (t.rounds[String(r)] || null) : null; },
  pathConvo(k) { return this.pathConvos[k] || null; },
  isTopicLoaded(k) { return !!this.topicCache[k]; },
};
env.savePathProgress = () => {};
env._navReady = false;
env.pushNav = () => {};
env.render = () => {};
env.speakItem = () => {};
env.stopAudioFile = () => {};
env.stopListening = () => {};
env.finishListening = () => {};
env.startSpeechRecognition = () => {};

const pieces = [
  grabConst(/const ICON_PATHS[\s\S]*?\n};/),
  grab(all, 'icon'), grab(all, 'iconPlay'),
  grabConst(/const TONES[\s\S]*?\n};/),
  grab(all, 'colorJyutping'), grab(all, 'charsToJyutping'),
  grab(all, 'normalizeChinese'), grab(all, 'editDistance'),
  grabConst(/const SPEAK_FINAL_PARTICLES[\s\S]*?\]\);/),
  grab(all, 'fuzzyMatch'), grab(all, 'alignChars'), grab(all, 'renderSpeakBreakdown'),
  grabConst(/const CHECKPOINT_ACTIVITIES[^\n]*/),
  grabConst(/const SENT_REVIEW_MIN_CHARS[^\n]*/),
  grabConst(/const SENT_REVIEW_RUN[^\n]*/),
  grab(all, 'getPathStages'), grab(all, 'getStage'), grab(all, 'getStageCheckpoint'),
  grab(all, 'checkpointFlagKey'), grab(all, 'checkpointActivityDone'),
  grab(all, 'checkpointProgress'), grab(all, 'stageTopicRounds'),
  grab(all, 'getRoundSentences'), grab(all, 'getRoundWords'),
  grab(all, 'countHanChars'), grab(all, 'sentReviewCursorKey'),
  grab(all, 'getSentReviewCursor'), grab(all, 'setSentReviewCursor'),
  grab(all, 'getCheckpointSentenceGroups'), grab(all, 'sentReviewHash'),
  grab(all, 'sentReviewRng'), grab(all, 'sentReviewShuffle'),
  grab(all, 'sentReviewCycleOrder'), grab(all, 'takeSentReviewRun'),
  grab(all, 'advanceSentReviewCursor'), grab(all, 'newSentReviewSession'),
  grab(all, 'sentReviewModeAt'), grab(all, 'currentSentReviewItem'),
  grab(all, 'startSentReviewRun'), grab(all, 'gradeSentReviewAttempt'),
  grab(all, 'sentReviewNext'), grab(all, 'sentReviewTally'),
  grab(renderSrc, 'renderSentReviewPicker'),
  grab(renderSrc, 'renderSentReviewSummary'),
  grab(renderSrc, 'renderCheckpointSentences'),
  'globalThis.SENT_REVIEW_RUN = SENT_REVIEW_RUN;',
  'globalThis.CHECKPOINT_ACTIVITIES = CHECKPOINT_ACTIVITIES;',
];
vm.runInContext(pieces.join('\n\n'), env);

const RUN = env.SENT_REVIEW_RUN;
if (!Number.isFinite(RUN)) { console.error('could not read SENT_REVIEW_RUN — aborting'); process.exit(1); }

let failures = 0;
const fail = m => { failures++; console.log('  FAIL ' + m); };
const ok = m => console.log('  ok   ' + m);

const stages = [];
for (const p of paths) for (const st of (p.stages || [])) if (st.checkpoint) stages.push({ pathKey: p.key, stage: st, cpId: st.checkpoint.id });

const setup = (pathKey, stage) => {
  env.state = {
    pathProgress: {},
    checkpoint: { pathKey, stageId: stage.id, cpId: stage.checkpoint.id },
    checkpointAct: 'sentences',
    sentReview: null, sentReviewMode: null,
  };
};

// ── 1. Availability is cache-independent (the v122 trap) ───────────────────
console.log('\n— 1. availability does not depend on the topic cache —');
{
  const warm = env.store.topicCache;
  let coldBad = 0;
  env.store.topicCache = {};                     // simulate a cold start
  for (const { pathKey, stage } of stages) {
    env.state = { pathProgress: {} };
    const prog = env.checkpointProgress(pathKey, stage.id);
    if (!prog.available.includes('sentences')) { fail(`${stage.id}: 'sentences' unavailable on a cold cache`); coldBad++; }
    if (prog.complete) { fail(`${stage.id}: reports complete on a cold cache`); coldBad++; }
  }
  env.store.topicCache = warm;
  if (!coldBad) ok(`all ${stages.length} stages still offer the activity with an empty topic cache`);
}

// ── 2. Every screen and state renders ──────────────────────────────────────
console.log('\n— 2. every screen renders in every state —');
{
  let bad = 0, rendered = 0;
  for (const { pathKey, stage } of stages) {
    setup(pathKey, stage);
    try {
      const picker = env.renderCheckpointSentences();
      rendered++;
      if (!picker.includes('data-sr-mode="listen"')) { fail(`${stage.id}: picker missing listen option`); bad++; }
      if (!picker.includes('data-sr-mode="produce"')) { fail(`${stage.id}: picker missing produce option`); bad++; }
      if (!picker.includes('data-sr-mode="mix"')) { fail(`${stage.id}: picker missing mix option`); bad++; }
    } catch (e) { fail(`${stage.id}: picker threw — ${e.message}`); bad++; continue; }

    for (const mode of ['listen', 'produce', 'mix']) {
      setup(pathKey, stage);
      env.startSentReviewRun(mode);
      const sr = env.state.sentReview;
      if (!sr || sr.items.length !== RUN) { fail(`${stage.id}/${mode}: run has ${sr ? sr.items.length : 0} items, expected ${RUN}`); bad++; continue; }
      for (const status of ['idle', 'listening', 'matched', 'mismatch']) {
        sr.status = status;
        sr.heard = (status === 'matched') ? sr.items[0].c : (status === 'mismatch' ? '我聽日返工喇' : '');
        if (status === 'matched' || status === 'mismatch') env.gradeSentReviewAttempt(sr.heard);
        try { const h = env.renderCheckpointSentences(); rendered++; if (!h || h.length < 100) { fail(`${stage.id}/${mode}/${status}: suspiciously short output`); bad++; } }
        catch (e) { fail(`${stage.id}/${mode}/${status} threw — ${e.message}`); bad++; }
      }
      // summary
      sr.finished = true;
      try { const h = env.renderCheckpointSentences(); rendered++; if (!h.includes('data-cp-act-done="sentences"')) { fail(`${stage.id}/${mode}: summary missing the done button`); bad++; } }
      catch (e) { fail(`${stage.id}/${mode}: summary threw — ${e.message}`); bad++; }
    }
  }
  if (!bad) ok(`${rendered} renders across ${stages.length} stages, no throws`);
}

// ── 3. Listen mode withholds the target ────────────────────────────────────
console.log('\n— 3. listen mode hides the sentence until after the attempt —');
{
  const { pathKey, stage } = stages[0];
  setup(pathKey, stage);
  env.startSentReviewRun('listen');
  const sr = env.state.sentReview;
  const target = sr.items[0].c;
  const before = env.renderCheckpointSentences();
  if (before.includes(target)) fail('target text visible before the attempt');
  else if (!before.includes('sr-hidden')) fail('missing the withheld-text placeholder');
  else ok('target withheld, placeholder shown');
  sr.status = 'matched'; sr.heard = target; env.gradeSentReviewAttempt(target);
  const after = env.renderCheckpointSentences();
  if (!after.includes(target)) fail('target still hidden after the attempt');
  else ok('target revealed after the attempt');
}

// ── 4. Produce mode states NO verdict (DES-44) ─────────────────────────────
console.log('\n— 4. produce mismatch asserts nothing about correctness —');
{
  const { pathKey, stage } = stages[0];
  setup(pathKey, stage);
  env.startSentReviewRun('produce');
  const sr = env.state.sentReview;
  sr.status = 'mismatch'; sr.heard = '我聽日返工喇';
  env.gradeSentReviewAttempt(sr.heard);
  if (sr.results[0] !== 'close') fail(`produce mismatch recorded as '${sr.results[0]}', expected 'close'`);
  const h = env.renderCheckpointSentences();
  if (h.includes("didn't quite match")) fail('produce mismatch used the wrong-answer copy');
  if (h.includes('speak-result-bad')) fail('produce mismatch reached for the red panel');
  if (h.includes('You said it correctly')) fail('produce mismatch claimed correctness');
  if (!h.includes("Here's the sentence we had")) fail('produce mismatch missing the no-verdict framing');
  if (!h.includes('speak-result-close')) fail('produce mismatch not using the neutral panel');
  if (!failures) ok('no verdict either way; neutral panel; target and note shown');
  else console.log('       (see failures above)');
}

// ── 5. Listen mode still marks a genuine mismatch ──────────────────────────
console.log('\n— 5. the no-verdict rule has not leaked into listen mode —');
{
  const { pathKey, stage } = stages[0];
  setup(pathKey, stage);
  env.startSentReviewRun('listen');
  const sr = env.state.sentReview;
  sr.status = 'mismatch'; sr.heard = '我聽日返工喇';
  env.gradeSentReviewAttempt(sr.heard);
  if (sr.results[0] !== 'mismatch') fail(`listen mismatch recorded as '${sr.results[0]}', expected 'mismatch'`);
  else {
    const h = env.renderCheckpointSentences();
    if (!h.includes("didn't quite match")) fail('listen mismatch is not telling the learner it did not match');
    else ok('listen mismatch is still graded as a mismatch');
  }
}

// ── 6. Escape hatch marks revealed, not failed ─────────────────────────────
console.log('\n— 6. the escape hatch marks an item revealed —');
{
  const { pathKey, stage } = stages[0];
  setup(pathKey, stage);
  env.startSentReviewRun('produce');
  const sr = env.state.sentReview;
  sr.revealed = true; sr.results[0] = 'revealed';
  const h = env.renderCheckpointSentences();
  if (!h.includes(sr.items[0].c)) fail('revealing did not show the sentence');
  else if (h.includes('speak-result-bad')) fail('revealing rendered as a failure');
  else ok('revealed item shows the sentence and is not marked wrong');
  env.sentReviewNext();
  const t = env.sentReviewTally();
  if (t.revealed !== 1) fail(`tally counted ${t.revealed} revealed, expected 1`);
  else ok('tally records it as revealed rather than a miss');
}

// ── 7. Every emitted control has a handler ─────────────────────────────────
console.log('\n— 7. every control the renderer emits is wired —');
{
  const { pathKey, stage } = stages[0];
  const emitted = new Set();
  for (const mode of ['listen', 'produce']) {
    setup(pathKey, stage);
    emitted.add('data-sr-mode');
    env.startSentReviewRun(mode);
    const sr = env.state.sentReview;
    for (const status of ['idle', 'listening', 'matched', 'mismatch']) {
      sr.status = status;
      sr.heard = status === 'matched' ? sr.items[0].c : (status === 'mismatch' ? '我聽日返工喇' : '');
      if (status === 'matched' || status === 'mismatch') env.gradeSentReviewAttempt(sr.heard);
      const h = env.renderCheckpointSentences();
      for (const m of h.matchAll(/data-sr-[a-z]+/g)) emitted.add(m[0]);
    }
    sr.finished = true;
    for (const m of env.renderCheckpointSentences().matchAll(/data-sr-[a-z]+/g)) emitted.add(m[0]);
  }
  let unwired = 0;
  for (const attr of emitted) {
    if (!renderSrc.includes(`[${attr}]`)) { fail(`${attr} is emitted but has no querySelector in render.js`); unwired++; }
  }
  if (!unwired) ok(`all ${emitted.size} emitted controls have handlers: ${[...emitted].sort().join(', ')}`);
}

console.log('');
if (failures) { console.log(`${failures} FAILURE(S)`); process.exit(1); }
console.log('sentence-review-harness: all assertions pass');
