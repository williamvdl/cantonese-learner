#!/usr/bin/env node
// ── sentence-pool-harness.js ───────────────────────────────────────────────
// Stage 1 of the checkpoint sentence review build (DES-44 / DES-45).
//
// The sampler is pure logic with no UI, and every one of its failure modes is
// SILENT — a cursor or cycle-boundary bug does not throw, it surfaces weeks
// later as "why am I seeing this sentence again". So it is proved here, against
// the real corpus, before any of it is wired to a screen.
//
// Asserted:
//   1. Pool shape — every checkpoint stage yields a pool, no sentence below the
//      4-character floor gets in, no duplicate sids.
//   2. No repeats within a cycle — the core promise of the ring.
//   3. Boundary crossing — a run short of a cycle's end still returns exactly
//      RUN items and still no duplicates within itself.
//   4. Determinism — same (cpId, cycle) always yields the same order, which is
//      what lets one integer stand in for a list of what has been seen.
//   5. Round-robin spread — a run is not allowed to be lumpy in a
//      multi-topic stage.
//   6. Cursor persistence — survives a save/load round trip through the same
//      path as real progress, and is not clobbered by the legacy migration.
//   7. Full traversal — walking the whole pool visits every sentence exactly
//      once before any repeat.
//
// Usage: node tools/sentence-pool-harness.js

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

// ── Minimal environment: load the real app functions against real data ─────
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
const grabConst = re => {
  const m = src.match(re);
  if (!m) throw new Error('const not found: ' + re);
  return m[0];
};

const topicCache = {};
for (const f of fs.readdirSync(path.join(ROOT, 'data/topics'))) {
  topicCache[f.replace('.json', '')] = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/topics', f), 'utf8'));
}
const paths = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/learning_paths.json'), 'utf8')).paths;

// Stand-ins for the browser globals the sampler touches. savePathProgress is
// wired to a real object so the persistence assertion exercises the same code
// path the app does, not a mock that always agrees.
let savedBlob = null;
const env = {
  store: { topicCache, paths, roundData(k, r) { const t = this.topicCache[k]; return t ? (t.rounds[String(r)] || null) : null; } },
  state: { pathProgress: {} },
  savePathProgress() { savedBlob = JSON.stringify(env.state.pathProgress); },
  Number, Math, String, Set, JSON, console,
};
env.globalThis = env;

const vm = require('vm');
vm.createContext(env);
const code = [
  grabConst(/const SENT_REVIEW_MIN_CHARS[^\n]*/),
  grabConst(/const SENT_REVIEW_RUN[^\n]*/),
  grab('getRoundSentences'),
  grab('stageTopicRounds'),
  grab('countHanChars'),
  grab('sentReviewCursorKey'),
  grab('getSentReviewCursor'),
  grab('setSentReviewCursor'),
  grab('getCheckpointSentenceGroups'),
  grab('sentReviewHash'),
  grab('sentReviewRng'),
  grab('sentReviewShuffle'),
  grab('sentReviewCycleOrder'),
  grab('takeSentReviewRun'),
  grab('advanceSentReviewCursor'),
  // `const` declarations inside a vm script do NOT attach to the context
  // object, so these must be published explicitly or the harness reads them as
  // undefined — which silently turned the boundary test into a no-op the first
  // time this ran.
  'globalThis.SENT_REVIEW_RUN = SENT_REVIEW_RUN;',
  'globalThis.SENT_REVIEW_MIN_CHARS = SENT_REVIEW_MIN_CHARS;',
].join('\n\n');
vm.runInContext(code, env);

const RUN = env.SENT_REVIEW_RUN;
const MIN = env.SENT_REVIEW_MIN_CHARS;
if (!Number.isFinite(RUN) || !Number.isFinite(MIN)) {
  console.error('harness could not read SENT_REVIEW_RUN / SENT_REVIEW_MIN_CHARS from app.js — aborting rather than asserting against undefined');
  process.exit(1);
}

let failures = 0;
const fail = m => { failures++; console.log('  FAIL ' + m); };
const ok = m => console.log('  ok   ' + m);

// Every checkpoint stage, with its path key.
const stages = [];
for (const p of paths) for (const st of (p.stages || [])) {
  if (st.checkpoint) stages.push({ pathKey: p.key, stage: st, cpId: st.checkpoint.id });
}

const resetProgress = () => { env.state.pathProgress = {}; };

// ── 1. Pool shape ──────────────────────────────────────────────────────────
console.log('\n— 1. pool shape —');
let minPool = Infinity, maxPool = 0, shapeBad = 0;
for (const { pathKey, stage, cpId } of stages) {
  const groups = env.getCheckpointSentenceGroups(pathKey, stage);
  const flat = groups.flat();
  const size = flat.length;
  minPool = Math.min(minPool, size); maxPool = Math.max(maxPool, size);
  if (size < RUN) { fail(`${cpId}: pool ${size} < run length ${RUN} — a run could not fill`); shapeBad++; }
  const short = flat.filter(s => env.countHanChars(s.c) < MIN);
  if (short.length) { fail(`${cpId}: ${short.length} sentence(s) under ${MIN} chars leaked into the pool`); shapeBad++; }
  const sids = flat.map(s => s.sid);
  if (new Set(sids).size !== sids.length) { fail(`${cpId}: duplicate sids in pool`); shapeBad++; }
}
if (!shapeBad) ok(`${stages.length} stages, pools ${minPool}–${maxPool}, all ≥ run length, all ≥${MIN} chars, no duplicates`);

// ── 2. No repeats within a cycle ───────────────────────────────────────────
console.log('\n— 2. no repeats within a single cycle —');
let cycleBad = 0;
for (const { pathKey, stage, cpId } of stages) {
  const groups = env.getCheckpointSentenceGroups(pathKey, stage);
  const poolSize = groups.flat().length;
  for (const cycle of [0, 1, 7]) {
    const order = env.sentReviewCycleOrder(groups, cpId, cycle);
    if (order.length !== poolSize) { fail(`${cpId} cycle ${cycle}: ordering has ${order.length}, pool is ${poolSize}`); cycleBad++; continue; }
    const sids = order.map(s => s.sid);
    if (new Set(sids).size !== poolSize) { fail(`${cpId} cycle ${cycle}: a cycle ordering repeats a sentence`); cycleBad++; }
  }
}
if (!cycleBad) ok('every cycle ordering is a permutation of the whole pool');

// ── 3. Boundary crossing ───────────────────────────────────────────────────
console.log('\n— 3. runs that cross a cycle boundary —');
let boundaryTested = 0, boundaryBad = 0;
for (const { pathKey, stage, cpId } of stages) {
  resetProgress();
  const groups = env.getCheckpointSentenceGroups(pathKey, stage);
  const poolSize = groups.flat().length;
  // Park the cursor so the next run must straddle the boundary.
  const start = poolSize - Math.floor(RUN / 2);
  env.setSentReviewCursor(pathKey, cpId, start);
  const res = env.takeSentReviewRun(pathKey, stage, cpId, RUN);
  boundaryTested++;
  if (res.items.length !== RUN) { fail(`${cpId}: boundary run returned ${res.items.length}, expected ${RUN}`); boundaryBad++; }
  if (res.items.some(x => !x)) { fail(`${cpId}: boundary run contains a hole`); boundaryBad++; }
  const sids = res.items.map(s => s.sid);
  if (new Set(sids).size !== sids.length) { fail(`${cpId}: boundary run repeats a sentence within itself`); boundaryBad++; }
  if (!res.wraps) { fail(`${cpId}: expected wraps=true for a straddling run`); boundaryBad++; }
}
if (!boundaryBad) ok(`${boundaryTested} straddling runs each returned exactly ${RUN} distinct sentences`);

// ── 4. Determinism ─────────────────────────────────────────────────────────
console.log('\n— 4. determinism —');
let detBad = 0;
for (const { pathKey, stage, cpId } of stages.slice(0, 5)) {
  const groups = env.getCheckpointSentenceGroups(pathKey, stage);
  const a = env.sentReviewCycleOrder(groups, cpId, 3).map(s => s.sid).join(',');
  const b = env.sentReviewCycleOrder(groups, cpId, 3).map(s => s.sid).join(',');
  if (a !== b) { fail(`${cpId}: cycle 3 ordering is not stable across calls`); detBad++; }
  const other = env.sentReviewCycleOrder(groups, cpId, 4).map(s => s.sid).join(',');
  if (a === other && groups.flat().length > 2) { fail(`${cpId}: cycles 3 and 4 produced an identical order`); detBad++; }
}
if (!detBad) ok('orderings are stable per cycle and differ between cycles');

// ── 5. Round-robin spread ──────────────────────────────────────────────────
console.log('\n— 5. a run spans the stage rather than clustering —');
let spreadBad = 0, spreadTested = 0;
for (const { pathKey, stage, cpId } of stages) {
  const groups = env.getCheckpointSentenceGroups(pathKey, stage);
  if (groups.length < 3) continue;   // spread is only meaningful with several topics
  const topicOf = new Map();
  groups.forEach((g, gi) => g.forEach(s => topicOf.set(s.sid, gi)));
  resetProgress();
  const res = env.takeSentReviewRun(pathKey, stage, cpId, RUN);
  const counts = {};
  res.items.forEach(s => { const t = topicOf.get(s.sid); counts[t] = (counts[t] || 0) + 1; });
  const distinct = Object.keys(counts).length;
  const worst = Math.max(...Object.values(counts));
  spreadTested++;
  // With round-robin, a run of RUN over G topics must touch min(G, RUN) topics
  // and cannot take more than ceil(RUN/G)+1 from any single one.
  const expectTopics = Math.min(groups.length, RUN);
  if (distinct < expectTopics) { fail(`${cpId}: run touched ${distinct} topics, expected ${expectTopics}`); spreadBad++; }
  const cap = Math.ceil(RUN / groups.length) + 1;
  if (worst > cap) { fail(`${cpId}: run took ${worst} from one topic (cap ${cap}) — clustering`); spreadBad++; }
}
if (!spreadBad) ok(`${spreadTested} multi-topic stages: every run spanned its topics without clustering`);

// ── 6. Cursor persistence ──────────────────────────────────────────────────
console.log('\n— 6. cursor persistence and migration safety —');
resetProgress();
const probe = stages[0];
env.setSentReviewCursor(probe.pathKey, probe.cpId, 24);
if (savedBlob === null) fail('setSentReviewCursor did not persist');
const reloaded = JSON.parse(savedBlob);
env.state.pathProgress = reloaded;
if (env.getSentReviewCursor(probe.pathKey, probe.cpId) !== 24) fail('cursor did not survive a save/load round trip');
else ok('cursor survives a save/load round trip');

const key = env.sentReviewCursorKey(probe.cpId);
if (!key.startsWith('cp:')) fail(`cursor key "${key}" lacks the cp: prefix that migration returns early on`);
else ok(`cursor key "${key}" is inside the cp: namespace the legacy migration skips`);

// The done flag and the cursor must be different keys — this is what lets a
// learner mark the activity reviewed and still come back to unseen sentences.
const flagKey = 'cp:' + probe.cpId + ':sentences';
if (flagKey === key) fail('done flag and cursor share a key — completing would reset progress through the pool');
else ok('done flag and cursor are separate keys');

// A fresh checkpoint reads 0, and a garbage value does not propagate.
resetProgress();
if (env.getSentReviewCursor(probe.pathKey, probe.cpId) !== 0) fail('fresh checkpoint did not start at 0');
env.state.pathProgress[probe.pathKey] = { [key]: 'nonsense' };
if (env.getSentReviewCursor(probe.pathKey, probe.cpId) !== 0) fail('non-numeric cursor was not coerced to 0');
else ok('fresh and corrupt cursors both read 0');

// ── 7. Full traversal ──────────────────────────────────────────────────────
console.log('\n— 7. a full pass visits every sentence before repeating —');
let travBad = 0;
for (const { pathKey, stage, cpId } of stages) {
  resetProgress();
  const poolSize = env.getCheckpointSentenceGroups(pathKey, stage).flat().length;
  const seen = [];
  let guard = 0;
  while (seen.length < poolSize && guard++ < 100) {
    const res = env.takeSentReviewRun(pathKey, stage, cpId, RUN);
    res.items.forEach(s => seen.push(s.sid));
    env.advanceSentReviewCursor(pathKey, cpId, res.consumed);
  }
  const firstPass = seen.slice(0, poolSize);
  if (new Set(firstPass).size !== poolSize) {
    fail(`${cpId}: first ${poolSize} draws repeated before covering the pool`);
    travBad++;
  }
}
if (!travBad) ok(`all ${stages.length} stages: the first full pass covers the pool with no repeat`);

// ── 7b. Long-run regression: the within-run duplicate bug ─────────────────
// Walks many consecutive runs on every stage and asserts no run ever contains
// the same sentence twice. This is the specific defect the harness caught on 10
// of 15 stages before any UI existed: a straddling run took the tail of one
// cycle and the head of the next, and the next cycle being an independent
// permutation meant those could overlap. Kept as a standing assertion so the
// dedupe in takeSentReviewRun() cannot be removed without this going red.
console.log('\n— 7b. no run ever repeats a sentence within itself —');
let dupBad = 0, runsChecked = 0;
for (const { pathKey, stage, cpId } of stages) {
  resetProgress();
  for (let r = 0; r < 12; r++) {
    const res = env.takeSentReviewRun(pathKey, stage, cpId, RUN);
    runsChecked++;
    const sids = res.items.map(s => s.sid);
    if (new Set(sids).size !== sids.length) {
      fail(`${cpId} run ${r + 1}: repeats a sentence within the run`);
      dupBad++;
    }
    if (sids.length !== RUN) {
      fail(`${cpId} run ${r + 1}: returned ${sids.length}, expected ${RUN}`);
      dupBad++;
    }
    if (res.consumed < res.items.length) {
      fail(`${cpId} run ${r + 1}: consumed ${res.consumed} < ${res.items.length} items — cursor would re-serve`);
      dupBad++;
    }
    env.advanceSentReviewCursor(pathKey, cpId, res.consumed);
  }
}
if (!dupBad) ok(`${runsChecked} consecutive runs across ${stages.length} stages, all ${RUN} distinct`);

// ── Report ─────────────────────────────────────────────────────────────────
console.log('');
if (failures) { console.log(`${failures} FAILURE(S)`); process.exit(1); }
console.log('sentence-pool-harness: all assertions pass');
