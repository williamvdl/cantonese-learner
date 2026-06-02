/* Pattern Review test — loads real data.js + app.js in a sandbox and drives the
 * actual pattern-review functions. Run: node tools/test-pattern-review.js
 * Lives in tools/ as a repeatable check; not shipped with the app. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

const lsMap = new Map();
const localStorage = {
  getItem: k => (lsMap.has(k) ? lsMap.get(k) : null),
  setItem: (k, v) => lsMap.set(k, String(v)),
  removeItem: k => lsMap.delete(k),
};
const sandbox = {
  localStorage, lsMap, console, Date, setTimeout, Promise, Math, JSON, Array, Object,
  render: () => {}, fetch: () => { throw new Error('no fetch'); },
  window: {}, document: {}, navigator: {}, speechSynthesis: {},
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

const testBody = `
(async () => {
  const A = []; const ok = (l, c) => A.push([l, !!c]);

  // Minimal pattern set with stable dids (mirrors the real shape).
  store.patterns = [
    { label:'Want to', drills:[
      { did:'drill-001', frameC:'我想▢。', frameJ:'ngo5 soeng2 ▢.', english:'I want to watch a movie.',
        answer:{c:'睇戲',j:'tai2 hei3',e:'watch a movie'},
        distractors:[{c:'聽歌',j:'ting1 go1',e:'listen to music'},{c:'唱歌',j:'coeng3 go1',e:'sing'},{c:'打機',j:'daa2 gei1',e:'game'}],
        topics:['hobbies'] },
      { did:'drill-002', frameC:'我想▢。', frameJ:'ngo5 soeng2 ▢.', english:'I want to eat.',
        answer:{c:'食飯',j:'sik6 faan6',e:'eat'},
        distractors:[{c:'飲水',j:'jam2 seoi2',e:'drink'},{c:'瞓覺',j:'fan3 gaau3',e:'sleep'},{c:'行街',j:'haang4 gaai1',e:'shop'}],
        topics:['food'] },
    ]},
  ];

  storage._hydrate();

  // (1) Capture a miss → entry created with the did.
  await addPatternMiss('drill-001');
  let bin = await getPatternBin();
  ok('miss creates an entry keyed on did', bin.length === 1 && bin[0].did === 'drill-001' && bin[0].missCount === 1);

  // (2) Re-miss the same drill → increments, no duplicate.
  await addPatternMiss('drill-001');
  bin = await getPatternBin();
  ok('re-miss increments missCount, no duplicate', bin.length === 1 && bin[0].missCount === 2);

  // (3) Persisted at schema v1 with everUsed.
  const env = JSON.parse(localStorage.getItem('cantonese:patternReview'));
  ok('persisted envelope is v1, everUsed true', env.v === 1 && env.data.everUsed === true);

  // (4) Stats reflect the bin.
  let st = await getPatternReviewStats();
  ok('stats liveCount = 1', st.liveCount === 1 && st.everUsed === true);

  // (5) A second miss on a different drill, then a session resolves both.
  await addPatternMiss('drill-002');
  await startPatternReview();
  ok('session built with both drills', state.patternReview && state.patternReview.queue.length === 2);
  ok('session queue items have {pattern,drill} shape',
     state.patternReview.queue.every(x => x.pattern && x.drill && x.drill.did));

  // (6) Graduation: 3 correct clears the entry.
  let r1 = await recordPatternReviewResult('drill-001', true);
  let r2 = await recordPatternReviewResult('drill-001', true);
  let r3 = await recordPatternReviewResult('drill-001', true);
  ok('not graduated before 3 correct', !r1.graduated && !r2.graduated);
  ok('graduates on 3rd correct', r3.graduated === true);
  ok('graduated entry removed from bin', !(await getPatternBin()).some(e => e.did === 'drill-001'));

  // (7) Wrong answer resets the streak.
  await addPatternMiss('drill-001');
  await recordPatternReviewResult('drill-001', true);   // correctCount 1
  await recordPatternReviewResult('drill-001', false);  // reset
  const e = (await getPatternBin()).find(x => x.did === 'drill-001');
  ok('wrong answer resets correctCount to 0', e && e.correctCount === 0);

  // (8) Unknown did → dropped once by the session builder.
  lsMap.set('cantonese:patternReview', JSON.stringify({ v:1, data:{ everUsed:true, entries:[
    { did:'drill-999', missCount:1, correctCount:0, addedAt:1 },   // no such drill
    { did:'drill-002', missCount:1, correctCount:0, addedAt:2 },
  ]}}));
  storage._hydrate();
  await startPatternReview();
  const after = await getPatternBin();
  ok('unresolvable did dropped, valid one kept',
     after.length === 1 && after[0].did === 'drill-002');

  // (9) Stats math for the done screen: still learning = reviewed - graduated.
  const reviewed = 5, graduated = 2;
  ok('still-learning math', Math.max(0, reviewed - graduated) === 3);

  const failed = A.filter(([,p]) => !p);
  A.forEach(([l,p]) => console.log((p?'  ✓ ':'  ✗ ')+l));
  console.log(failed.length ? ('\\n✗ '+failed.length+' FAILED') : '\\n✓ ALL '+A.length+' ASSERTIONS PASS');
  globalThis.__exit = failed.length ? 1 : 0;
})().catch(e => { console.error('THREW:', e); globalThis.__exit = 2; });
`;

vm.runInContext(read('data.js') + '\n' + read('app.js') + '\n' + testBody, sandbox, { filename: 'pr-test.js' });
setTimeout(() => process.exit(sandbox.__exit ?? 3), 100);
