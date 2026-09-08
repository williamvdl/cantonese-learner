#!/usr/bin/env node
/* eslint-disable no-console */
/*
 * tools/translate-model-set.js — builds the blind comparison set for the Gemini
 * model trial. Run once; commit the JSON it writes.
 *
 *   GEMINI_KEY=<key> node tools/translate-model-set.js
 *
 * THE QUESTION, AND THE CHEAPEST VERSION OF IT
 * --------------------------------------------
 * Does a newer Gemini model produce more natural colloquial Cantonese than the
 * shipped `gemini-2.5-flash-lite`? PROBE_METHOD says ask the cheapest question
 * that could kill the idea first, so this script runs a PRE-FLIGHT before the
 * twelve real items: one throwaway input through all three models, checking only
 * that each returns something `parseAiResponse()` can read. A model whose output
 * the app cannot parse is disqualified before anyone judges its prose, and that
 * costs three calls to find out rather than thirty-six.
 *
 * THE THREE ARMS, and why these three
 * -----------------------------------
 *   A  gemini-2.5-flash-lite   the incumbent — control
 *   B  gemini-3.5-flash-lite   the like-for-like generational upgrade
 *   C  gemini-3.6-flash        a genuine tier up
 * Chosen to separate two questions that would otherwise be confounded: if B
 * beats A but C does not beat B, the generation did the work; if C beats both,
 * the tier did. Nothing in Google's model documentation is tuned for language
 * quality — every 3.x description is about coding and agents — so "newer is
 * better" is the hypothesis under test, not an assumption behind the design.
 *
 * TEST SET: DERIVED FROM THE CORPUS, WITH THE ANSWER KNOWN BY CONSTRUCTION
 * -----------------------------------------------------------------------
 * Twelve items, selected deterministically from the 307 corpus sentences that
 * carry both an English gloss and an authored Cantonese line. This satisfies two
 * checklist items at once and neither needed an exception argued for it:
 *
 *   - "Derive the test set from the corpus; never hand-type it." The English
 *     glosses ARE what a learner types into Translate, and they are already in
 *     the repo, so the set cannot drift.
 *   - "Include inputs whose right answer is known by construction." Each item
 *     carries the native-authored Cantonese as a reference. It is NOT a target
 *     to match — three natural phrasings of one English sentence are all
 *     correct — but it makes a MEANING error objectively checkable rather than
 *     a matter of taste, which is the one judgement that must not be taste.
 *
 * Twelve is inherited from the twelve-per-bank the ASR probe used, not picked
 * fresh. It also keeps the run inside free-tier daily caps, which are per model
 * and as low as 20/day on some 3.x Flash models: 12 calls per arm, 36 total.
 *
 * PARAMETERS DIFFER BY GENERATION AND THAT IS NOT COSMETIC
 * -------------------------------------------------------
 * `callGemini()` in app.js sends `temperature: 0.3`. Google deprecated
 * temperature, top_p and top_k in July 2026 and the 3.x migration guide says to
 * strip them. Sending a deprecated parameter to a 3.x model is exactly the kind
 * of difference that would show up as "the new model is worse" when it is really
 * "the new model was called wrongly", so the arms declare their own config and
 * the difference is recorded in the output rather than hidden.
 *
 * NO sw.js BUMP — build-time tool, not precached, not linked from the app.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT  = path.join(__dirname, 'translate-model-set.json');
const N    = 12;

const KEY = process.env.GEMINI_KEY;
if (!KEY) {
  console.error('GEMINI_KEY must be set.\n'
    + '  Windows PowerShell:  $env:GEMINI_KEY="<key>"; node tools/translate-model-set.js\n'
    + '  macOS:               GEMINI_KEY="<key>" node tools/translate-model-set.js');
  process.exit(1);
}

// ── Arms ────────────────────────────────────────────────────────────────────
const ARMS = [
  { id: 'A', model: 'gemini-2.5-flash-lite', note: 'incumbent (shipped)',
    generationConfig: { temperature: 0.3, responseMimeType: 'application/json' } },
  { id: 'B', model: 'gemini-3.5-flash-lite', note: 'generational upgrade, same tier',
    generationConfig: { responseMimeType: 'application/json' } },
  { id: 'C', model: 'gemini-3.6-flash',      note: 'tier upgrade',
    generationConfig: { responseMimeType: 'application/json' } },
];

// ── Lift the app's own prompt and parser ────────────────────────────────────
// Named here as PROBE_METHOD requires: the probe mirrors callGemini() /
// buildPrompt() / parseAiResponse() in app.js, and lifts the latter two verbatim
// rather than reimplementing them, so the trial measures the request the app
// actually sends. If either is renamed this throws instead of quietly measuring
// a prompt the app stopped using.
const appSrc = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
function grabFn(src, name) {
  const i = src.indexOf('function ' + name + '(');
  if (i < 0) throw new Error('app.js no longer defines ' + name + '() — this generator needs updating');
  let d = 0;
  for (let k = src.indexOf('{', i); k < src.length; k++) {
    if (src[k] === '{') d++;
    else if (src[k] === '}') { d--; if (!d) return src.slice(i, k + 1); }
  }
  throw new Error('unbalanced braces reading ' + name);
}
const { buildPrompt, parseAiResponse } = new Function(
  grabFn(appSrc, 'buildPrompt') + '\n' + grabFn(appSrc, 'parseAiResponse')
  + '\nreturn { buildPrompt, parseAiResponse };')();

const VERSION = (fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8')
  .match(/CACHE_VERSION\s*=\s*'([^']+)'/) || [, '(unknown)'])[1];

// ── Test set, derived ───────────────────────────────────────────────────────
function corpusSentences() {
  const dir = path.join(ROOT, 'data', 'topics');
  const out = [];
  for (const f of fs.readdirSync(dir).sort()) {
    const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const walk = o => {
      if (Array.isArray(o)) return o.forEach(walk);
      if (o && typeof o === 'object') {
        if (o.sentences) o.sentences.forEach(s => {
          if (s.c && s.e) out.push({ topic: f.replace(/\.json$/, ''), en: s.e.trim(), reference: s.c, refJp: s.j || '' });
        });
        Object.values(o).forEach(walk);
      }
    };
    walk(j);
  }
  return out;
}

// Deterministic, seeded, and spread across topics — a straight slice would take
// twelve sentences from whichever topic sorts first and measure one register.
function pickSet(all, n) {
  let seed = 20260905;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const byTopic = new Map();
  all.forEach(s => { if (!byTopic.has(s.topic)) byTopic.set(s.topic, []); byTopic.get(s.topic).push(s); });
  const topics = [...byTopic.keys()];
  const picked = [];
  let guard = 0;
  while (picked.length < n && guard++ < 5000) {
    const t = topics[Math.floor(rnd() * topics.length)];
    const pool = byTopic.get(t);
    const cand = pool[Math.floor(rnd() * pool.length)];
    if (!picked.some(p => p.en === cand.en)) picked.push(cand);
  }
  return picked;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const GAP_MS = 5000;   // 12/min — under every current free-tier per-model limit

function retryAfterMs(body) {
  const m = body.match(/"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/);
  return m ? Math.ceil(parseFloat(m[1]) * 1000) + 1000 : null;
}

async function call(arm, prompt) {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/'
            + arm.model + ':generateContent?key=' + encodeURIComponent(KEY);
  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: arm.generationConfig,
  });
  for (let attempt = 1; attempt <= 5; attempt++) {
    const t0 = Date.now();
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    const ms = Date.now() - t0;
    if (res.ok) {
      const j = await res.json();
      return { text: j.candidates?.[0]?.content?.parts?.[0]?.text || '', ms,
               usage: j.usageMetadata || null };
    }
    const text = await res.text();
    if (attempt === 5 || ![429, 502, 503].includes(res.status)) {
      throw new Error(arm.model + ' ' + res.status + ': ' + text.replace(/\s+/g, ' ').slice(0, 150));
    }
    const wait = (res.status === 429 && retryAfterMs(text)) || 20000 * attempt;
    process.stdout.write('[429 ' + arm.model + ', waiting ' + Math.round(wait / 1000) + 's] ');
    await sleep(wait);
  }
}

// ── Pre-flight: the cheapest thing that could kill the trial ────────────────
async function preflight() {
  console.log('Pre-flight — can each arm return parseable output at all?\n');
  const alive = [];
  for (const arm of ARMS) {
    process.stdout.write('  ' + (arm.id + ' ' + arm.model).padEnd(34, '.') + ' ');
    try {
      const r = await call(arm, buildPrompt('where is the station', 'en-yue'));
      const obj = parseAiResponse(r.text);
      if (!obj || !obj.zh) throw new Error('parsed but no zh field');
      console.log('ok — ' + obj.zh + '  (' + r.ms + 'ms)');
      alive.push(arm);
    } catch (e) {
      console.log('DISQUALIFIED — ' + e.message);
    }
    await sleep(GAP_MS);
  }
  return alive;
}

(async () => {
  const arms = await preflight();
  if (arms.length < 2) {
    console.error('\nFewer than two arms survived pre-flight. There is nothing to compare.');
    console.error('Stop here and report it rather than running the set.');
    process.exit(1);
  }
  if (arms.length < ARMS.length) {
    console.log('\nRunning with ' + arms.length + ' of ' + ARMS.length
      + ' arms. The disqualified one(s) are recorded in the JSON, not silently dropped.');
  }

  const set = pickSet(corpusSentences(), N);
  console.log('\n' + set.length + ' corpus-derived inputs across '
    + new Set(set.map(s => s.topic)).size + ' topics.\n');

  const items = [];
  const failures = [];
  let seed = 777;
  const rnd = () => (seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296;

  for (const s of set) {
    console.log('  ' + s.en);
    const outputs = {};
    for (const arm of arms) {
      process.stdout.write('      ' + arm.id + ' ' + arm.model.padEnd(24, ' '));
      try {
        const r = await call(arm, buildPrompt(s.en, 'en-yue'));
        const obj = parseAiResponse(r.text);
        outputs[arm.id] = { model: arm.model, zh: obj.zh, jp: obj.jp, en: obj.en, ms: r.ms, usage: r.usage };
        console.log(obj.zh + '   (' + r.ms + 'ms)');
      } catch (e) {
        failures.push({ en: s.en, arm: arm.id, error: String(e.message || e) });
        outputs[arm.id] = { model: arm.model, error: String(e.message || e) };
        console.log('FAILED — ' + e.message);
      }
      await sleep(GAP_MS);
    }
    // Presentation order is shuffled per item and stored, so the judging page is
    // blind AND the mapping survives for the export. Position bias is real; a
    // fixed order would let "always the middle one" pass as a preference.
    const order = arms.map(a => a.id).sort(() => rnd() - 0.5);
    items.push({
      id: 'tm-' + String(items.length + 1).padStart(2, '0'),
      topic: s.topic, en: s.en, reference: s.reference, refJp: s.refJp,
      outputs, order,
    });
  }

  fs.writeFileSync(OUT, JSON.stringify({
    generated: new Date().toISOString(),
    appVersion: VERSION,
    promptFrom: 'app.js buildPrompt() — lifted verbatim at generation time',
    arms: ARMS.map(a => ({ ...a, ranInTrial: arms.some(x => x.id === a.id) })),
    items, failures,
  }, null, 2) + '\n');

  // Latency is reported here rather than judged on the phone: it is a property
  // of the model, not of the phrasing, and the judge should not see it.
  console.log('\nWrote ' + path.relative(ROOT, OUT));
  for (const arm of arms) {
    const ms = items.map(i => i.outputs[arm.id]).filter(o => o && o.ms).map(o => o.ms).sort((a, b) => a - b);
    if (ms.length) {
      console.log('  ' + arm.id + ' ' + arm.model.padEnd(24)
        + 'median ' + ms[Math.floor(ms.length / 2)] + 'ms · slowest ' + ms[ms.length - 1] + 'ms');
    }
  }
  if (failures.length) console.log('\n' + failures.length + ' call(s) failed — recorded in the JSON.');
  console.log('\nNext: commit the JSON, then open tools/translate-model-judge.html.');
})();
