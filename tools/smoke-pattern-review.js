/* jsdom smoke test — boots the REAL app (index.html + data/app/render.js) in a
 * DOM, then exercises the new Review hub + Pattern Review without throwing.
 * Run: node tools/smoke-pattern-review.js  (needs jsdom on NODE_PATH)
 * Dev-only; not shipped. */
'use strict';
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const ROOT = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

const results = [];
const ok = (l, c) => results.push([l, !!c]);
let thrown = null;

// Capture in-page errors.
const vc = new VirtualConsole();
vc.on('jsdomError', e => { thrown = e.detail || e; });

const html = read('index.html')
  .replace(/<script\s+src=["']\.\/(data|app|render)\.js["']>\s*<\/script>/g, '');
const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  virtualConsole: vc,
  url: 'https://williamvdl.github.io/cantonese/',
});
const { window } = dom;

// Stub things jsdom lacks.
window.scrollTo = () => {};
window.speechSynthesis = { getVoices: () => [], cancel(){}, speak(){}, addEventListener(){} };
window.SpeechSynthesisUtterance = function(){};
// fetch local data files from disk.
window.fetch = async (url) => {
  const rel = String(url).replace(/^.*\/(data\/)/, '$1').replace(/^\.\//, '');
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) return { ok:false, status:404, json: async()=>({}), text: async()=>'' };
  const txt = fs.readFileSync(p, 'utf8');
  return { ok:true, status:200, json: async()=>JSON.parse(txt), text: async()=>txt };
};

// Inject the three app scripts as ONE script element so their top-level const/
// function declarations share a single lexical scope (separate <script> elements
// in jsdom's outside-only mode don't share top-level consts the way browsers do).
// Append the export shim in the same scope.
const combined = window.document.createElement('script');
combined.textContent =
  read('data.js') + '\n' + read('app.js') + '\n' + read('render.js') +
  `\nwindow.__app = { store, state, render, addPatternMiss, refreshReviewBadge, startPatternReview };`;
window.document.body.appendChild(combined);

// init() is async (fetches + renders). Poll until first paint, then drive.
(async () => {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  // wait for patterns to load + first real render
  for (let i = 0; i < 50; i++) {
    if (window.__app.store && Array.isArray(window.__app.store.patterns) && window.__app.store.patterns.length) break;
    await wait(20);
  }
  await wait(50);
  const doc = window.document;
  const state = window.__app.state;

  ok('app booted, patterns loaded', window.__app.store.patterns.length > 0);
  ok('no error during boot', !thrown);

  // Seed a pattern-review bin using a real did, then refresh badge + open hub.
  const firstDid = window.__app.store.patterns.flatMap(p => p.drills||[]).find(d=>d.did)?.did;
  ok('found a real did to seed', !!firstDid);
  await window.__app.addPatternMiss(firstDid);
  await window.__app.refreshReviewBadge();

  // Navigate to the Review hub.
  state.nav = 'review'; state.reviewView = 'hub'; state.drawerOpen = false;
  window.__app.render();
  ok('hub renders both cards', doc.querySelectorAll('[data-review-go]').length === 2);
  ok('pattern card shows the seeded count',
     /1/.test(doc.querySelector('.review-hub-card.patterns .rh-count b')?.textContent || ''));
  ok('no error rendering hub', !thrown);

  // Into Pattern Review landing.
  state.reviewView = 'patterns'; window.__app.render();
  ok('pattern review landing shows start button', !!doc.getElementById('pattern-review-start'));

  // Start a session and render the active drill card.
  await window.__app.startPatternReview();
  ok('session active', state.patternReview && !state.patternReview.done);
  ok('drill choices rendered', doc.querySelectorAll('[data-drill-choice]').length === 4);
  ok('no error in session render', !thrown);

  // Answer correctly → should advance/score without throwing.
  const pr = state.patternReview;
  const answerIdx = pr.choices.findIndex(c => c === pr.queue[pr.idx].drill.answer);
  doc.querySelectorAll('[data-drill-choice]')[answerIdx].click();
  await wait(30);
  ok('answer registered (selected set)', pr.selected === answerIdx);
  ok('reviewed tally incremented', pr.reviewedThisSession === 1);
  ok('no error after answering', !thrown);

  // Word Review still renders (regression on shared done helper path).
  state.reviewView = 'words'; state.wordReview = null; window.__app.render();
  ok('word review landing still renders', !!doc.querySelector('.review-landing, .review-empty'));
  ok('no error rendering word review', !thrown);

  if (thrown) console.log('\nFIRST ERROR:', (thrown.message || thrown));
  const failed = results.filter(([,p]) => !p);
  results.forEach(([l,p]) => console.log((p?'  ✓ ':'  ✗ ')+l));
  console.log(failed.length ? ('\n✗ '+failed.length+' FAILED') : '\n✓ ALL '+results.length+' CHECKS PASS');
  process.exit(failed.length || thrown ? 1 : 0);
})().catch(e => { console.error('HARNESS THREW:', e); process.exit(2); });
