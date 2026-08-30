#!/usr/bin/env node
// ── jyutping-check.js ───────────────────────────────────────────────────────
// Standing check for the layered jyutping lookup (DES-43).
//
// The app shows jyutping for whatever the speech recogniser returns, from two
// sources: the corpus-derived table (authoritative, 644 chars) and a vendored
// dictionary (fallback, ~27,500 chars). This asserts the things that must stay
// true about that arrangement, because all of them are silent when they break:
//
//   1. COVERAGE — every character in every corpus sentence and word resolves.
//      A miss here means a learner sees a character with no jyutping, which for
//      a non-Chinese-reading audience is no information at all.
//   2. LAYERING — the corpus wins wherever it has an entry. The two sources
//      disagree on 44 of 644 characters, almost all colloquial-vs-literary
//      (坐 co5/zo6, 嗎 maa3/maa1). If the layering ever inverted, the app would
//      print a literary reading beside a lesson teaching the colloquial one.
//   3. ALIGNMENT — getJyutpingList() returns exactly one pair per input
//      character. charsToJyutping() indexes its output positionally, so a
//      library update that changed this would silently shift every reading in
//      the "You said" line onto the wrong character.
//
// Run after any content change or any update to vendor/to-jyutping.js.
// Usage: node tools/jyutping-check.js

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const isHan = ch => /[\u4e00-\u9fff]/.test(ch);

const corpus = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/char-jyutping.json'), 'utf8'));
const lib = require(path.join(ROOT, 'vendor/to-jyutping.js'));

let failures = 0;
const fail = msg => { failures++; console.log('  FAIL ' + msg); };
const ok = msg => console.log('  ok   ' + msg);

// ── 1. Coverage ────────────────────────────────────────────────────────────
console.log('\n— coverage: every corpus character resolves from one source or the other —');
const unresolved = new Set();
let checked = 0;
for (const f of fs.readdirSync(path.join(ROOT, 'data/topics'))) {
  const t = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/topics', f), 'utf8'));
  for (const rk of Object.keys(t.rounds || {})) {
    const round = t.rounds[rk];
    const strings = []
      .concat((round.words || []).map(w => w.c))
      .concat((round.sentences || []).map(s => s.c));
    for (const str of strings) {
      const pairs = lib.getJyutpingList(str);
      [...str].forEach((ch, i) => {
        if (!isHan(ch)) return;
        checked++;
        const resolved = corpus[ch] || (pairs[i] && pairs[i][1]);
        if (!resolved) unresolved.add(ch);
      });
    }
  }
}
if (unresolved.size) fail(`${unresolved.size} character(s) resolve from neither source: ${[...unresolved].join('')}`);
else ok(`all ${checked} corpus characters resolve`);

// ── 2. Layering ────────────────────────────────────────────────────────────
console.log('\n— layering: the corpus is authoritative where it has an entry —');
let agree = 0;
const disagreements = [];
for (const [ch, entry] of Object.entries(corpus)) {
  const pairs = lib.getJyutpingList(ch);
  const libReading = pairs && pairs[0] && pairs[0][1];
  if (!libReading) continue;
  if (libReading === entry.j) agree++;
  else disagreements.push(`${ch} corpus=${entry.j} dict=${libReading}`);
}
ok(`${agree} agree, ${disagreements.length} disagree (disagreement is expected and fine — the corpus wins)`);
// A sharp assertion: these specific colloquial readings are ones the corpus
// teaches and the dictionary would override. If any vanishes from the corpus
// table, the app starts showing the literary form beside the lesson.
const mustBeCorpus = { '坐': 'co5', '嗎': 'maa3', '樓': 'lau2' };
for (const [ch, expected] of Object.entries(mustBeCorpus)) {
  if (!corpus[ch]) fail(`${ch} is missing from the corpus table — the dictionary's literary reading would now win`);
  else if (corpus[ch].j !== expected) fail(`${ch} corpus reading is ${corpus[ch].j}, expected the colloquial ${expected}`);
  else ok(`${ch} still resolves to the colloquial ${expected} from the corpus`);
}

// ── 2b. Typo detector ──────────────────────────────────────────────────────
// The 44 corpus/dictionary disagreements are almost all legitimate: 32 differ
// only in tone (the colloquial raised tone, 變調) and 11 are recognised
// literary/colloquial doublets (聽 ting1/teng1, 請 cing2/ceng2). But a
// disagreement where the RIME AND TONE MATCH and only the INITIAL differs is
// not a Cantonese variation pattern — it is a typing slip. That signature is
// exactly how 知 was found glossed as ji1 instead of zi1 in two files, a real
// content bug that had been sitting in the corpus and silently winning over
// the correct dictionary reading once layering was introduced.
console.log('\n— typo detector: same rime and tone, different initial —');
const suspicious = [];
const splitSyl = s => {
  const m = String(s).match(/^([a-z]+?)([aeiou][a-z]*)([1-6])$/);
  return m ? { ini: m[1], rime: m[2], tone: m[3] } : null;
};
for (const [ch, entry] of Object.entries(corpus)) {
  const pairs = lib.getJyutpingList(ch);
  const d = pairs && pairs[0] && pairs[0][1];
  if (!d || d === entry.j) continue;
  const a = splitSyl(entry.j), b = splitSyl(d);
  if (a && b && a.ini !== b.ini && a.rime === b.rime && a.tone === b.tone) {
    suspicious.push(`${ch} corpus=${entry.j} dict=${d}`);
  }
}
if (suspicious.length) {
  suspicious.forEach(x => fail(`likely corpus typo — ${x}`));
  console.log('       (if the corpus reading is genuinely correct, add the character to ALLOWED_INITIAL_DIFFS below)');
} else {
  ok('no same-rime-same-tone initial mismatches');
}

// ── 3. Alignment ────────────────────────────────────────────────────────────
console.log('\n— alignment: one pair per input character —');
const alignTests = ['唔該，再見！', '你好！我叫William。', '我食咗飯，仲飲咗茶', '夠', ''];
let aligned = true;
for (const t of alignTests) {
  const pairs = lib.getJyutpingList(t);
  if (pairs.length !== [...t].length) {
    aligned = false;
    fail(`"${t}" — ${[...t].length} characters but ${pairs.length} pairs; positional indexing in charsToJyutping() would be wrong`);
  }
}
if (aligned) ok(`all ${alignTests.length} alignment cases return one pair per character`);

// ── 4. The gap that motivated this ─────────────────────────────────────────
console.log('\n— the v129 probe gaps now resolve —');
for (const ch of ['夠', '中', '腰']) {
  const pairs = lib.getJyutpingList(ch);
  const r = corpus[ch] ? corpus[ch].j : (pairs[0] && pairs[0][1]);
  if (!r) fail(`${ch} still has no reading`);
  else ok(`${ch} → ${r}`);
}

// ── 5. Load strategy ───────────────────────────────────────────────────────
// The dictionary is ~274KB gzipped. As a plain blocking <script> it sat in
// front of app.js and cost a full download of first-paint delay on the first
// visit. It is deferred instead, which is only safe because window.ToJyutping
// is read at CALL time inside charsToJyutping() and never at parse time.
// Asserted here because the failure is invisible: removing `defer` breaks
// nothing functionally, it just quietly makes every first load slower.
console.log('\n— load strategy —');
{
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const tag = (html.match(/<script[^>]*to-jyutping\.js[^>]*>/) || [])[0];
  if (!tag) fail('index.html does not load vendor/to-jyutping.js');
  else if (!/\bdefer\b|\basync\b/.test(tag)) fail('the dictionary script is render-blocking — add defer (see the comment in index.html)');
  else ok('dictionary script is deferred, so it does not block first paint');

  // The only permitted parse-time reference is none at all. Comments are
  // stripped first — this file's own explanatory comment names the global, and
  // an earlier version of this check flagged that as a violation.
  const appTxt = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[ \t]*\/\/.*$/gm, '');
  const fnStart = appTxt.indexOf('function charsToJyutping');
  let depth = 0, fnEnd = appTxt.length;
  for (let k = appTxt.indexOf('{', fnStart); k < appTxt.length; k++) {
    if (appTxt[k] === '{') depth++;
    else if (appTxt[k] === '}') { depth--; if (!depth) { fnEnd = k; break; } }
  }
  const stray = [...appTxt.matchAll(/window\.ToJyutping/g)]
    .map(m => m.index)
    .filter(i => i < fnStart || i > fnEnd);
  if (stray.length) fail(`window.ToJyutping is referenced ${stray.length}x outside charsToJyutping() — deferring the script would break that`);
  else ok('window.ToJyutping is only read inside charsToJyutping(), at call time');
}

console.log('');
if (failures) { console.log(`${failures} FAILURE(S)`); process.exit(1); }
console.log('jyutping-check: all assertions pass');
