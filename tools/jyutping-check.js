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
//   4. ORDER — in authored text the character comes first and its jyutping
//      follows in brackets, never the reverse (section 8, v162).
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
  // The permitted callers. charJyutpingSyllables() was split out of
  // charsToJyutping() in v141 so the Translate speak-back could get the same
  // layered readings as a plain list; the dictionary reference moved with it.
  // Both are call-time only, which is what the deferred script requires — the
  // constraint is unchanged, only its address is.
  const ALLOWED = ['charJyutpingSyllables', 'charsToJyutping'];
  const spans = ALLOWED.map(name => {
    const fnStart = appTxt.indexOf('function ' + name);
    if (fnStart < 0) fail(`app.js no longer defines ${name}() — this check needs updating`);
    let depth = 0, fnEnd = appTxt.length;
    for (let k = appTxt.indexOf('{', fnStart); k < appTxt.length; k++) {
      if (appTxt[k] === '{') depth++;
      else if (appTxt[k] === '}') { depth--; if (!depth) { fnEnd = k; break; } }
    }
    return [fnStart, fnEnd];
  });
  const stray = [...appTxt.matchAll(/window\.ToJyutping/g)]
    .map(m => m.index)
    .filter(i => !spans.some(([a, b]) => i >= a && i <= b));
  if (stray.length) fail(`window.ToJyutping is referenced ${stray.length}x outside ${ALLOWED.join('() / ')}() — deferring the script would break that`);
  else ok('window.ToJyutping is only read inside charsToJyutping(), at call time');
}

// ── 6. Every "You said" line shows jyutping ────────────────────────────────
// The point of the dictionary is that a learner who does not read Chinese can
// read back what the recogniser heard. That only holds if EVERY surface showing
// heard text also shows jyutping. Three surfaces render it — the Learn speak
// sheet, the checkpoint sentence review, and Chat's conversation Speak mode —
// and Chat was missed for two releases after DES-41 landed, shipping bare
// characters. Asserted at source level because the three renderers are far
// apart in render.js and nothing else ties them together.
console.log('\n— every "You said" surface shows jyutping —');
{
  const renderSrc = fs.readFileSync(path.join(ROOT, 'render.js'), 'utf8');
  const lines = renderSrc.split('\n');
  let found = 0, bare = 0;
  lines.forEach((line, i) => {
    if (!line.includes('You said:')) return;
    found++;
    if (!line.includes('speak-heard-jp')) {
      bare++;
      fail(`render.js:${i + 1} renders "You said" without a speak-heard-jp sub-line`);
    }
  });
  if (!found) fail('no "You said" renderers found in render.js — has the markup moved?');
  else if (!bare) ok(`all ${found} "You said" renderers emit jyutping`);
}

// ── 7. Every "You said" line folds numerals before display ─────────────────
// DES-48. charsToJyutping() returns '' for anything outside the CJK range, so
// an Arabic digit gets no syllable slot AND no jp-unknown marker — it vanishes
// silently, which is worse than the gap DES-41's "?" was built to make visible.
// The recogniser writes spoken numbers as digits routinely, so any surface
// printing raw heard text hits this. The fold has to happen before BOTH the
// characters and the jyutping, and from foldAsrNumerals() specifically, so the
// heard line and the breakdown grid below it can never disagree about what a
// number was. Asserted at source level for the same reason as section 6: the
// three renderers are a thousand lines apart and only a check ties them
// together. Section 6 alone would pass on a renderer that folded neither.
console.log('\n— every "You said" surface folds recogniser numerals —');
{
  const renderSrc = fs.readFileSync(path.join(ROOT, 'render.js'), 'utf8');
  const lines = renderSrc.split('\n');
  let checked = 0, unfolded = 0;
  lines.forEach((line, i) => {
    if (!line.includes('You said:')) return;
    checked++;
    // The heard string must be interpolated from a folded local, not straight
    // from state (sp.heard / sr.heard / cv.speakHeard).
    if (/\$\{(sp\.heard|sr\.heard|cv\.speakHeard)\}/.test(line)) {
      unfolded++;
      fail(`render.js:${i + 1} prints raw heard text — digits will render with no jyutping (DES-48)`);
    }
  });
  const folds = (renderSrc.match(/foldAsrNumerals\(/g) || []).length;
  if (folds < checked) fail(`${checked} "You said" renderers but only ${folds} foldAsrNumerals() calls in render.js`);
  else if (!unfolded) ok(`all ${checked} "You said" renderers fold via foldAsrNumerals() before display`);

  const appSrc = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  if (!/function normalizeChinese[\s\S]{0,240}foldAsrNumerals\(/.test(appSrc))
    fail('normalizeChinese() no longer folds via foldAsrNumerals() — matching and display can now disagree about a number');
  else ok('matching and display fold through the same function, so they cannot drift');
}

// ── 8. Order: the character comes first, its jyutping follows ──────────────
// The house rule is 煮 (zyu2) — every character immediately followed by its
// jyutping in brackets. The checks above confirm a reading is PRESENT; none of
// them looked at ORDER, so 80 reversals across 15 topic intro notes passed
// unnoticed until v162: "<strong>zyu2</strong> (煮)", "<em>caau2 coi3</em>
// (炒菜, stir-fried vegetables)", and one comma form, "(<em>wok6</em>, 鑊)".
// The backlog counted 36, because a search for the bold form missed 43 italic
// ones and the comma — the signature to match is "jyutping, then a bracket or
// comma, then a character", whatever markup wraps the jyutping.
//
// One exclusion. A bracketed reading may itself be followed by characters —
// 食飯 (sik6 faan6, 食 eat + 飯 rice) — which has the reversed shape inside the
// bracket. Jyutping that opens a bracket straight after a character is that
// character's reading and is skipped.
//
// Scans every string in every data/ file, not just intro notes, so a reversal
// in a sentence note or a chat line fails too. The self-test runs first: if the
// pattern is ever loosened until it matches nothing, the check fails on its own
// fixtures instead of passing on an empty scan.
console.log('\n— order: character first, jyutping in brackets after it —');
{
  const HAN = '\\u3400-\\u4dbf\\u4e00-\\u9fff';
  const SYL = '[a-z]+[1-6]';
  const REVERSED = new RegExp(
    `(?:<(?:strong|em|b|i)>)?\\b${SYL}(?:[ -]${SYL})*(?:</(?:strong|em|b|i)>)?` +
    `\\s*(?:\\(|[,，]\\s*)[${HAN}]`, 'g');
  const OWN_READING = new RegExp(`[${HAN}](?:</(?:strong|em|b|i)>)?\\s*\\($`);
  const findReversals = str => [...str.matchAll(REVERSED)]
    .filter(m => !OWN_READING.test(str.slice(0, m.index)))
    .map(m => m[0]);

  const mustFlag = [
    '<strong>zyu2</strong> (煮) is general cooking',
    '<em>caau2 coi3</em> (炒菜, stir-fried vegetables)',
    'The wok (<em>wok6</em>, 鑊) is',
    'plain zyu2 (煮) with no markup',
  ];
  const mustPass = [
    '<strong>煮</strong> (zyu2) is general cooking',
    '炒菜 (caau2 coi3, stir-fried vegetables)',
    'The wok, 鑊 (wok6), is',
    '食飯 (sik6 faan6, 食 eat + 飯 rice)',
    '煮 (zyu2), 炒 (caau2) and 蒸 (zing1)',
  ];
  let selfOk = true;
  for (const s of mustFlag) if (!findReversals(s).length) { selfOk = false; fail(`self-test: did not flag the reversed form "${s}"`); }
  for (const s of mustPass) if (findReversals(s).length) { selfOk = false; fail(`self-test: flagged the correct form "${s}"`); }
  if (selfOk) ok(`self-test: all ${mustFlag.length} reversed forms flagged, all ${mustPass.length} correct forms passed`);

  const files = [];
  (function walk(dir) {
    for (const f of fs.readdirSync(dir)) {
      const p = path.join(dir, f);
      if (fs.statSync(p).isDirectory()) walk(p);
      else if (f.endsWith('.json')) files.push(p);
    }
  })(path.join(ROOT, 'data'));

  let strings = 0;
  const reversals = [];
  const visit = (v, at) => {
    if (typeof v === 'string') {
      if (!/[㐀-䶿一-鿿]/.test(v)) return;
      strings++;
      for (const r of findReversals(v)) reversals.push(`${at}: ${r}`);
    } else if (Array.isArray(v)) v.forEach((x, i) => visit(x, `${at}.${i}`));
    else if (v && typeof v === 'object') for (const k of Object.keys(v)) visit(v[k], `${at}.${k}`);
  };
  for (const f of files) visit(JSON.parse(fs.readFileSync(f, 'utf8')), path.relative(ROOT, f));

  if (reversals.length) {
    reversals.forEach(r => fail(`jyutping before its character — ${r}`));
    console.log('       (write the character first: 煮 (zyu2), not zyu2 (煮))');
  } else ok(`no jyutping-before-character in ${strings} strings across ${files.length} data files`);
}

// ── 9. A perfect attempt reads back exactly as the lesson does ─────────────
// DES-65, v163. The recogniser returns characters, never sounds, so the "You
// said" jyutping is derived from the characters. Derived one at a time, it got
// any word-dependent reading wrong — 哥哥 (go4 go1) as go1 go1 — and before
// v163 a perfectly said sentence contradicted its own lesson in 28 of 304
// sentences. heardJyutping() now gives every character said exactly as taught
// the lesson's own syllable.
//
// Runs the REAL functions, lifted from app.js by name, against every sentence
// and chat line whose jyutping splits one syllable per character. Then four
// pinned cases, so the fix cannot "pass" by copying the lesson onto characters
// the learner did not say: a wrong character, a homophone the matcher forgave,
// a swapped particle, and a target with a Latin name, which must fall back.
console.log('\n— a perfect attempt reads back exactly as the lesson does —');
{
  const vm = require('vm');
  const appSrc = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  const grab = name => {
    const i = appSrc.indexOf('function ' + name + '(');
    if (i < 0) throw new Error('app.js no longer defines ' + name + '() — this check needs updating');
    let d = 0;
    for (let k = appSrc.indexOf('{', i); k < appSrc.length; k++) {
      if (appSrc[k] === '{') d++;
      else if (appSrc[k] === '}') { d--; if (!d) return appSrc.slice(i, k + 1); }
    }
  };
  const grabConst = re => { const m = appSrc.match(re); if (!m) throw new Error('app.js const not found: ' + re); return m[0]; };
  const env = { console, Map, Set, Array, String, Object, parseInt };
  env.window = env;
  vm.createContext(env);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'vendor/to-jyutping.js'), 'utf8'), env);
  env.store = { charJyutping: corpus };
  vm.runInContext([
    grabConst(/const ASR_DIGITS = [\s\S]*?;/), grabConst(/const ASR_PLACES = [\s\S]*?;/),
    grabConst(/const IDENTITY_EQ = [^\n]*/),
    grabConst(/const SPEAK_PUNCT = [^\n]*/), grabConst(/const SPEAK_PUNCT_ALL [^\n]*/),
    grabConst(/const SPEAK_PUNCT_ONE [^\n]*/), grabConst(/const SPEAK_PUNCT_TAIL [^\n]*/),
    ...['speakTargetParts', 'charJyutpingSyllables', 'readingsFor', 'sameSoundAt', 'speakEqFor', 'foldAsrNumerals',
        'normalizeChinese', 'alignChars', 'heardReadingsFromTarget'].map(grab),
    'globalThis.readHeard = (h, c, j) => charJyutpingSyllables(h, heardReadingsFromTarget(h, c, j)).map(s => s.reading);',
    'globalThis.readPlain = h => charJyutpingSyllables(h).map(s => s.reading);',
  ].join('\n\n'), env);

  // The lesson's syllables, split independently of the app's speakTargetParts():
  // whitespace tokens, anything after the tone digit dropped. Using the app's own
  // parse here would grade the code with itself.
  // Case is kept: the lessons capitalise names (悉尼 Sat1 nei4), and the line
  // should read back as the lesson does, capital included.
  const syl = j => j.split(/\s+/).map(s => s.replace(/[^A-Za-z0-9]+$/, '')).filter(Boolean);
  const items = [];
  const addLines = (lines, where) => (lines || []).forEach((l, i) => l && l.c && l.j && items.push({ c: l.c, j: l.j, at: `${where}.${i}` }));
  for (const f of fs.readdirSync(path.join(ROOT, 'data/topics'))) {
    const t = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/topics', f), 'utf8'));
    for (const [rk, r] of Object.entries(t.rounds || {})) {
      addLines(r.sentences, `${f} r${rk} sentence`);
      if (r.convo) addLines(r.convo.lines, `${f} r${rk} chat`);
    }
  }
  const pc = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/path_convos.json'), 'utf8')).convos || {};
  for (const [k, cv] of Object.entries(pc)) addLines(cv.lines, `path_convos ${k}`);

  let compared = 0, skipped = 0, plainWrong = 0, wrong = 0;
  for (const it of items) {
    const want = syl(it.j);
    const plain = env.readPlain(it.c);
    if (plain.length !== want.length) { skipped++; continue; }   // a Latin name or uneven split: nothing to compare
    compared++;
    if (plain.some((r, i) => (r || '').toLowerCase() !== want[i].toLowerCase())) plainWrong++;   // readings, not capitals
    const got = env.readHeard(it.c, it.c, it.j);
    const diffs = got.map((r, i) => r !== want[i] ? `${[...it.c.replace(/[^㐀-䶿一-鿿]/g, '')][i]} ${r}≠${want[i]}` : null).filter(Boolean);
    if (diffs.length) { wrong++; fail(`${it.at} said perfectly reads back ${diffs.join(', ')} — ${it.c}`); }
  }
  if (!compared) fail('no corpus lines were compared — has the data shape changed?');
  else if (!wrong) ok(`all ${compared} sentences and chat lines, said perfectly, read back as their lessons (the old per-character reading got ${plainWrong} wrong, ignoring capitals; ${skipped} skipped, not one syllable per character)`);

  // Pinned cases. The target is 我有一個哥哥 (ngo5 jau5 jat1 go3 go4 go1).
  const T = ['我有一個哥哥。', 'ngo5 jau5 jat1 go3 go4 go1.'];
  const pin = (label, got, want) => {
    if (JSON.stringify(got) === JSON.stringify(want)) ok(label);
    else fail(`${label} — got ${got.join(' ')}, expected ${want.join(' ')}`);
  };
  pin('the reported case: 哥哥 reads go4 go1, not go1 go1', env.readHeard('我有一個哥哥。', ...T), syl(T[1]));
  // A wrong character keeps its own reading, and the matched 哥哥 around it still
  // takes the lesson's. If the identical-character test were dropped, 兩 would
  // read jat1. (So would 歌 and 啦 below: all three pins guard that one rule.)
  pin('a wrong character keeps its own reading: 兩 is loeng5, not the lesson\'s jat1',
      env.readHeard('我有兩個哥哥', ...T), ['ngo5', 'jau5', env.readPlain('兩')[0], 'go3', 'go4', 'go1']);
  // A homophone the matcher forgives (歌 and 哥 are both go1 on their own) is a
  // different character, so the lesson's go4 does not belong to it. If the
  // identical-character test were dropped, 歌 would read go4.
  pin('a forgiven homophone keeps its own reading: 歌 is go1, not the lesson\'s go4',
      env.readHeard('我有一個歌哥', ...T), ['ngo5', 'jau5', 'jat1', 'go3', env.readPlain('歌')[0], 'go1']);
  // A swapped final particle is forgiven, but it is not the particle taught.
  pin('a swapped particle keeps its own reading: 啦 is not read as the lesson\'s 呀 (aa3)',
      env.readHeard('你好啦', '你好呀', 'nei5 hou2 aa3'), ['nei5', 'hou2', env.readPlain('啦')[0]]);
  pin('a target with a Latin name falls back to the plain reading',
      env.readHeard('我叫William。', '我叫William。', 'ngo5 giu3 William.'), env.readPlain('我叫William。'));
}

// ── 10. Intro notes: every character has its reading, every reading its character ──
// v165. Section 8 checks ORDER; it cannot see a reading written with no
// character at all — Money's "you'll be asked jau5 mou5 saan3 zi2?" — or a
// character written with no reading — Home's "the formal 家". Until v165, 28
// such terms sat in 13 topic intro notes: 25 jyutping-only, 3 characters left
// bare. A learner reading characters got nothing to read for the first kind.
//
// Method: remove every "characters (reading…)" pair — a bracket straight after
// a run of characters, which may carry a gloss and even more characters inside
// it, and may span a gap as in 同…一樣 (tung4…jat1 joeng6). Whatever is left
// must contain neither a character nor a jyutping syllable.
//
// Intro notes (rounds.N.note) only. Sentence notes are not yet held to this:
// they have their own gaps, logged in BACKLOG, and widening the scope here would
// fail the check on day one rather than guard what v165 fixed.
console.log('\n— intro notes: every character has its reading, every reading its character —');
{
  const H = '\\u3400-\\u4dbf\\u4e00-\\u9fff';
  const PAIR = new RegExp(`[${H}][${H}…]*[？！]?\\s*\\([^)]*\\)`, 'g');
  const unpaired = note => {
    const rest = note.replace(/<[^>]+>/g, '').replace(PAIR, '');
    return [
      ...(rest.match(new RegExp(`[${H}]+`, 'g')) || []).map(s => `character with no reading: ${s}`),
      ...(rest.match(/\b[a-z]+[1-6](?:\s+[a-z]+[1-6])*\b/g) || []).map(s => `reading with no character: ${s}`),
    ];
  };

  const mustFlag = [
    "you'll be asked <em>jau5 mou5 saan3 zi2?</em> when paying",
    'add <strong>maa3</strong> to the end',
    'than the formal 家. To talk',
    'Add 啲 (di1) for a bit more (高啲 gou1 di1 = taller)',
  ];
  const mustPass = [
    "you'll be asked 有冇散紙？ (jau5 mou5 saan3 zi2?) when paying",
    'add <strong>嗎</strong> (maa3) to the end',
    '好 (hou2, very) and 食飯 (sik6 faan6, 食 eat + 飯 rice)',
    'And 同…一樣 (tung4…jat1 joeng6) means the same as',
  ];
  let selfOk = true;
  for (const s of mustFlag) if (!unpaired(s).length) { selfOk = false; fail(`self-test: missed the unpaired term in "${s}"`); }
  for (const s of mustPass) if (unpaired(s).length) { selfOk = false; fail(`self-test: flagged the correct form "${s}" — ${unpaired(s).join('; ')}`); }
  if (selfOk) ok(`self-test: all ${mustFlag.length} unpaired forms flagged, all ${mustPass.length} correct forms passed`);

  let notes = 0;
  const gaps = [];
  for (const f of fs.readdirSync(path.join(ROOT, 'data/topics')).sort()) {
    const t = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/topics', f), 'utf8'));
    for (const [rk, r] of Object.entries(t.rounds || {})) {
      if (!r.note) continue;
      notes++;
      for (const g of unpaired(r.note)) gaps.push(`${f} round ${rk} intro note — ${g}`);
    }
  }
  if (gaps.length) {
    gaps.forEach(g => fail(g));
    console.log('       (write the character and its reading together: 有冇散紙？ (jau5 mou5 saan3 zi2?))');
  } else ok(`every character and every reading is paired in all ${notes} topic intro notes`);
}

console.log('');
if (failures) { console.log(`${failures} FAILURE(S)`); process.exit(1); }
console.log('jyutping-check: all assertions pass');
