#!/usr/bin/env node
/* eslint-disable no-console */
/*
 * tools/translate-probe-set.js — builds the target set for the Translate
 * false-reject probe. Run once; commit the JSON it writes.
 *
 *   GEMINI_KEY=<key> node tools/translate-probe-set.js
 *   GEMINI_KEY=<key> node tools/translate-probe-set.js --n=30   (default 30)
 *
 * WHY A GENERATOR AND NOT A HAND-TYPED LIST
 * -----------------------------------------
 * PROBE_METHOD.md says derive the test set, never hand-type it, because
 * hand-maintained derived data drifts. That guard is honoured here for the
 * TARGETS: every Cantonese string in the output comes back from a live Gemini
 * call, made with `buildPrompt()` and read with `parseAiResponse()` LIFTED
 * VERBATIM FROM app.js at run time (see grabFn below), so the probe measures
 * the exact text the shipped feature would produce. Nothing is transcribed by
 * hand and nothing can drift from the app's prompt without this script
 * breaking loudly.
 *
 * THE ENGLISH INPUTS ARE A DECLARED EXCEPTION, and the reason is not
 * convenience. PROBE_METHOD's rule exists so a probe does not measure content
 * the app never teaches. Here that inverts: the entire question is how the
 * matcher behaves on content the corpus does NOT contain, so a corpus-derived
 * input list would measure the wrong thing by construction. The inputs below
 * are therefore authored, but they are committed and scripted rather than
 * typed into a page, so a re-run reproduces the same set.
 *
 * LENGTH IS THE VARIABLE UNDER TEST, not a presentation detail. fuzzyMatch()
 * allows floor(len/4) edits and demands an exact match below four characters,
 * and that floor was sized against corpus sentences — which are long. Translate
 * emits short answers constantly. So the inputs are chosen to spread the
 * OUTPUT across three buckets, and the script reports the bucket fill rather
 * than assuming it: Gemini decides the length, not this file.
 *
 * NO sw.js BUMP. This is a build-time tool; nothing here is precached, linked
 * from the app, or shares its CSS.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT  = path.join(__dirname, 'translate-probe-set.json');

const arg = n => {
  const m = process.argv.find(a => a.startsWith('--' + n + '='));
  return m ? m.split('=')[1] : null;
};
const WANT = Number(arg('n') || 30);

const KEY = process.env.GEMINI_KEY;
if (!KEY) {
  console.error('GEMINI_KEY must be set.\n'
    + '  Windows:  setx GEMINI_KEY <key>   then open a NEW terminal\n'
    + '  macOS:    export GEMINI_KEY="<key>"');
  process.exit(1);
}

// ── Lift the app's own prompt and parser ────────────────────────────────────
// Same brace-matching extraction tools/sentence-review-harness.js uses. The
// point is that this script cannot quietly diverge from what Translate sends:
// if buildPrompt() is renamed or reshaped, this throws instead of silently
// measuring a stale prompt.
const appSrc = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
function grabFn(src, name) {
  const i = src.indexOf('function ' + name + '(');
  if (i < 0) throw new Error('app.js no longer defines ' + name + '() — probe set generator needs updating');
  let d = 0;
  for (let k = src.indexOf('{', i); k < src.length; k++) {
    if (src[k] === '{') d++;
    else if (src[k] === '}') { d--; if (!d) return src.slice(i, k + 1); }
  }
  throw new Error('unbalanced braces reading ' + name);
}
const { buildPrompt, parseAiResponse } = new Function(
  grabFn(appSrc, 'buildPrompt') + '\n' + grabFn(appSrc, 'parseAiResponse')
  + '\nreturn { buildPrompt, parseAiResponse };'
)();

// ── Inputs ──────────────────────────────────────────────────────────────────
// Authored, for the reason given in the header. Grouped by the output length
// they are EXPECTED to provoke — expected, not asserted. The bucket a target
// lands in is measured from Gemini's actual reply further down.
const INPUTS = [
  // aiming short (2–3 characters out)
  'thank you', 'excuse me', 'sorry', 'no problem', 'wait a moment',
  'how much', 'not yet', 'me too', 'over there', 'right now',
  // aiming medium (4–7)
  'I am hungry', 'where is the toilet', 'can you help me',
  'I do not understand', 'see you tomorrow', 'this one please',
  'is it far from here', 'I would like a coffee', 'what time is it',
  'my phone is broken',
  // aiming long (8+)
  'I want to book a table for two people tonight',
  'could you speak a little more slowly please',
  'I have been learning Cantonese for about six months',
  'my friend is arriving at the airport tomorrow morning',
  'do you know if this shop opens on Sunday',
  'the weather has been very hot this week',
  'I left my umbrella in the taxi yesterday',
  'she said she would call me back after lunch',
  'we should leave now or we will be late',
  'this restaurant is much better than the last one',
];

const bucketOf = n => (n <= 3 ? 'short' : n <= 7 ? 'medium' : 'long');
const hanCount = s => [...String(s)].filter(c => /[\u4e00-\u9fff]/.test(c)).length;

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function callGemini(prompt) {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/'
            + 'gemini-2.5-flash-lite:generateContent?key=' + encodeURIComponent(KEY);
  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.3, responseMimeType: 'application/json' },
  });
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body,
    });
    if (res.ok) {
      const j = await res.json();
      return j.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }
    if (attempt === 3 || ![429, 502, 503].includes(res.status)) {
      throw new Error('Gemini ' + res.status + ': ' + (await res.text()).slice(0, 160));
    }
    await sleep(1200 * attempt);
  }
}

(async () => {
  const items = [];
  const failures = [];
  for (const en of INPUTS.slice(0, WANT)) {
    process.stdout.write('  ' + en.padEnd(56, '.') + ' ');
    try {
      const obj = parseAiResponse(await callGemini(buildPrompt(en, 'en-yue')));
      const n = hanCount(obj.zh);
      items.push({
        id: 'tp-' + String(items.length + 1).padStart(2, '0'),
        en, zh: obj.zh, jpFromModel: obj.jp, hanCount: n, bucket: bucketOf(n),
      });
      console.log(obj.zh + '  (' + n + ', ' + bucketOf(n) + ')');
    } catch (e) {
      failures.push({ en, error: String(e.message || e) });
      console.log('FAILED — ' + e.message);
    }
    await sleep(400);   // stay well clear of the free-tier rate limit
  }

  const fill = { short: 0, medium: 0, long: 0 };
  items.forEach(i => fill[i.bucket]++);

  fs.writeFileSync(OUT, JSON.stringify({
    generated:  new Date().toISOString(),
    model:      'gemini-2.5-flash-lite',
    promptFrom: 'app.js buildPrompt() — lifted verbatim at generation time',
    fill, items, failures,
  }, null, 2) + '\n');

  console.log('\nWrote ' + path.relative(ROOT, OUT) + ' — ' + items.length + ' targets');
  console.log('Bucket fill: short ' + fill.short + ' · medium ' + fill.medium + ' · long ' + fill.long);
  if (failures.length) console.log(failures.length + ' input(s) failed — listed in the JSON, not silently dropped.');

  // The short bucket is where fuzzyMatch() is strictest and therefore where the
  // finding is most likely to live. Say so rather than letting a thin bucket
  // pass unnoticed into a headline number.
  if (fill.short < 6) {
    console.log('\nWARNING: short bucket has ' + fill.short + ' items (< 6). That is the bucket the\n'
      + 'probe exists to measure — a result from it will not separate 20% from 40%.\n'
      + 'Add more short inputs and re-run before treating the short number as a finding.');
  }
})();
