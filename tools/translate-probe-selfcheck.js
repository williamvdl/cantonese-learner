#!/usr/bin/env node
/* eslint-disable no-console */
/*
 * tools/translate-probe-selfcheck.js — drives translate-reject-probe.html
 * through a full item lifecycle with a stubbed recogniser and asserts the page
 * is still OPERABLE afterwards.
 *
 * WHY THIS EXISTS RATHER THAN A ONE-LINE FIX
 * -------------------------------------------
 * This is the second consecutive fault in the probe tooling — first the
 * generator paced ten times over the Gemini rate limit, then the mic button
 * died after the first Keep. PROBE_METHOD.md's stop rule says the second fault
 * is the point to stop fixing forward and instrument, because at that point
 * the faults are evidence about the process, not a queue of bugs.
 *
 * And the specific shape here is one the project has already paid for once.
 * The tier harness passed for several versions while a live navigation bug sat
 * in the app, because it asserted what a rung DREW rather than what happened
 * when it was PRESSED. Eyeballing this page renders exactly the same illusion:
 * after Keep it looks completely correct — right target, right jyutping, button
 * enabled and reading "Start speaking" — and does nothing at all when tapped.
 * Rendering is not behaviour. So this check presses things.
 *
 * WHAT IT ASSERTS, after every disposition (keep / discard / skip):
 *   - the mic button is enabled
 *   - the mic button has a handler attached
 *   - pressing it actually starts a recognition session
 *
 * Run:  node tools/translate-probe-selfcheck.js
 * No sw.js bump — tooling only, not part of the app shell.
 */

const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PAGE = path.join(__dirname, 'translate-reject-probe.html');

// ── Minimal DOM, only what the page touches ────────────────────────────────
function makeEl(id) {
  return {
    id, textContent: '', innerHTML: '', className: '',
    style: {}, onclick: null, disabled: false,
  };
}
const els = {};
const ids = ['stamp', 'boot', 'run', 'pos', 'bucket', 'en', 'target', 'tjp', 'mic',
             'resultCard', 'heard', 'hjp', 'verdict', 'bd', 'keep', 'discard',
             'skip', 'tally', 'tallyTable', 'export', 'out'];
ids.forEach(i => { els[i] = makeEl(i); });

const document = {
  getElementById: id => els[id] || (els[id] = makeEl(id)),
  // stripSpans() uses this to turn coloured jyutping markup into plain text.
  createElement: () => ({
    _h: '',
    set innerHTML(v) { this._h = v; },
    get innerHTML() { return this._h; },
    get textContent() { return this._h.replace(/<[^>]+>/g, ''); },
  }),
};

// ── Stub recogniser: one final segment, then end ───────────────────────────
let sessionsStarted = 0;
class StubRecognition {
  constructor() { this.onresult = null; this.onerror = null; this.onend = null; }
  start() {
    sessionsStarted++;
    setTimeout(() => {
      this.onresult && this.onresult({
        resultIndex: 0,
        results: [Object.assign([{ transcript: StubRecognition.heard }], { isFinal: true })],
      });
      this.onend && this.onend();
    }, 0);
  }
  stop()  { this.onend && this.onend(); }
  abort() {}
}
StubRecognition.heard = '';

// ── Files, served from disk instead of the network ─────────────────────────
const files = {
  '../app.js':                    () => fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8'),
  '../sw.js':                     () => fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8'),
  '../data/char-jyutping.json':   () => fs.readFileSync(path.join(ROOT, 'data/char-jyutping.json'), 'utf8'),
  './translate-probe-set.json':   () => {
    const p = path.join(__dirname, 'translate-probe-set.json');
    // The real set is optional — a fixed stand-in keeps this check runnable on
    // a clean clone, and the check is about the button, not the targets.
    if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8');
    return JSON.stringify({ items: [
      { id: 'tp-01', en: 'thank you',   zh: '唔該',   hanCount: 2, bucket: 'short' },
      { id: 'tp-02', en: 'me too',      zh: '我都係', hanCount: 3, bucket: 'short' },
      { id: 'tp-03', en: 'I am hungry', zh: '我好肚餓', hanCount: 4, bucket: 'medium' },
    ] });
  },
};
async function fetchStub(url) {
  const key = String(url).split('?')[0];
  if (!files[key]) throw new Error('unexpected fetch: ' + key);
  const body = files[key]();
  return { text: async () => body, json: async () => JSON.parse(body) };
}

// ── Boot the page's own script, unmodified ─────────────────────────────────
const html = fs.readFileSync(PAGE, 'utf8');
const m = html.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/);
if (!m) { console.error('FAIL: could not find the probe page script block'); process.exit(1); }

const win = {
  SpeechRecognition: StubRecognition,
  webkitSpeechRecognition: StubRecognition,
  ToJyutping: require(path.join(ROOT, 'vendor/to-jyutping.js')),
};

const sandbox = { document, window: win, fetch: fetchStub, console,
                  setTimeout, clearTimeout, Function, JSON, Date, Array, Object,
                  String, Number, Math, Set, Map, RegExp, Error, Promise, parseFloat, parseInt };
sandbox.globalThis = sandbox;
// The page reads window.SpeechRecognition off the global inside the lifted
// startSpeechRecognition(); mirror the stub onto the sandbox root too.
Object.assign(sandbox, { SpeechRecognition: StubRecognition, webkitSpeechRecognition: StubRecognition });

const tick = () => new Promise(r => setTimeout(r, 5));

(async () => {
  new Function(...Object.keys(sandbox), m[1])(...Object.values(sandbox));
  await tick(); await tick();   // let boot()'s awaited fetches settle

  const fails = [];
  const check = (cond, msg) => { if (!cond) fails.push(msg); };

  check(els.boot.style.display === 'none', 'page never finished booting');

  const dispositions = ['keep', 'discard', 'skip'];
  for (let n = 0; n < dispositions.length; n++) {
    const how = dispositions[n];

    // Speak the target correctly, so a Keep is a realistic disposition.
    StubRecognition.heard = els.target.textContent;

    const before = sessionsStarted;
    check(typeof els.mic.onclick === 'function',
      'item ' + (n + 1) + ': mic button had NO handler before pressing (' + how + ' path)');
    check(els.mic.disabled === false,
      'item ' + (n + 1) + ': mic button was disabled before pressing');
    if (typeof els.mic.onclick === 'function') els.mic.onclick();
    await tick(); await tick();
    check(sessionsStarted > before,
      'item ' + (n + 1) + ': pressing the mic button started no recognition session');

    // Advance via the disposition under test.
    els[how].onclick();
    await tick();
  }

  if (fails.length) {
    console.error('FAIL — translate-reject-probe.html\n');
    fails.forEach(f => console.error('  · ' + f));
    console.error('\n' + fails.length + ' assertion(s) failed. The page may still LOOK correct;'
      + '\nthat is the point of pressing rather than reading.');
    process.exit(1);
  }
  console.log('PASS — mic button stayed operable across keep, discard and skip ('
    + sessionsStarted + ' sessions started)');
})();
