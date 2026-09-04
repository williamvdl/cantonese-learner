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

// PACING. gemini-2.5-flash-lite on the free tier allows 15 requests per minute
// (and 1,000 per day, which is not the binding limit here). The first version
// of this script slept 400ms between calls — 150 RPM, ten times over — and
// burned ten inputs on 429s before anyone could intervene. 5s gives 12 RPM,
// comfortably under, and costs under three minutes for the whole set. Do not
// tighten this to save time: the quota is per PROJECT, so a run that trips the
// limit also breaks the Translate feature in the app for the same window.
const GAP_MS = 5000;

// A 429 body carries a RetryInfo with the server's own wait. Honour it when
// present rather than guessing — guessing is what turned one 429 into ten.
function retryAfterMs(bodyText) {
  const m = bodyText.match(/"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/);
  return m ? Math.ceil(parseFloat(m[1]) * 1000) + 1000 : null;
}

async function callGemini(prompt) {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/'
            + 'gemini-2.5-flash-lite:generateContent?key=' + encodeURIComponent(KEY);
  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.3, responseMimeType: 'application/json' },
  });
  const MAX = 5;
  for (let attempt = 1; attempt <= MAX; attempt++) {
    const res = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body,
    });
    if (res.ok) {
      const j = await res.json();
      return j.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }
    const text = await res.text();
    if (attempt === MAX || ![429, 502, 503].includes(res.status)) {
      throw new Error('Gemini ' + res.status + ': ' + text.replace(/\s+/g, ' ').slice(0, 140));
    }
    const wait = (res.status === 429 && retryAfterMs(text)) || 20000 * attempt;
    process.stdout.write('[429, waiting ' + Math.round(wait / 1000) + 's] ');
    await sleep(wait);
  }
}

(async () => {
  // RESUMABLE. If a previous run wrote some of the set, keep those targets and
  // fetch only what is missing. A rate-limit failure part-way through must not
  // cost the inputs that already succeeded — re-translating them would also
  // change them, since the model is not deterministic, and a set that shifts
  // under a re-run is not a fixture.
  let items = [];
  if (fs.existsSync(OUT)) {
    try {
      items = (JSON.parse(fs.readFileSync(OUT, 'utf8')).items || []).filter(i => i && i.zh);
      if (items.length) console.log('Resuming — ' + items.length + ' target(s) already in '
        + path.basename(OUT) + ', fetching only the rest.\n');
    } catch (e) { console.log('Existing ' + path.basename(OUT) + ' unreadable, starting fresh.\n'); }
  }
  const have = new Set(items.map(i => i.en));

  const failures = [];
  const todo = INPUTS.slice(0, WANT).filter(en => !have.has(en));
  if (!todo.length) console.log('Nothing missing — set is already complete.\n');

  for (const en of todo) {
    process.stdout.write('  ' + en.padEnd(56, '.') + ' ');
    try {
      const obj = parseAiResponse(await callGemini(buildPrompt(en, 'en-yue')));
      const n = hanCount(obj.zh);
      items.push({ en, zh: obj.zh, jpFromModel: obj.jp, hanCount: n, bucket: bucketOf(n) });
      console.log(obj.zh + '  (' + n + ', ' + bucketOf(n) + ')');
    } catch (e) {
      failures.push({ en, error: String(e.message || e) });
      console.log('FAILED — ' + e.message);
    }
    await sleep(GAP_MS);
  }

  // Order by the authored input list so the set is stable across resumes, then
  // number. IDs are assigned last precisely because a resume changes arrival
  // order — an id that moved between runs would make two exports incomparable.
  items.sort((a, b) => INPUTS.indexOf(a.en) - INPUTS.indexOf(b.en));
  items.forEach((it, i) => { it.id = 'tp-' + String(i + 1).padStart(2, '0'); });

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
