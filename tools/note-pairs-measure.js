#!/usr/bin/env node
// tools/note-pairs-measure.js — DIAGNOSTIC, not a standing check.
//
// QUESTION. What would it take for sentence notes to meet the bar
// jyutping-check.js §10 already holds topic intro notes to — every Chinese term
// written as its characters, then its jyutping in brackets? And which of the
// rule's hits are real gaps a learner sees, and which are the rule misreading a
// correct form?
//
// THE RULE MEASURED is the shipped one: tools/note-pairs.js, the same module §10
// calls. Nothing here reimplements it. This tool only CLASSIFIES what it reports.
//
// THE BAR IS INHERITED, NOT INVENTED: §10 passes at zero unpaired terms, with no
// allowlist. Sentence notes join §10 only at zero.
//
// DECISION RULE — written before any data was read:
//   1. Every hit is classified as REAL (a learner sees a term without its
//      characters or without its reading) or METHOD (a correct form the rule
//      misreads). UNCLASSIFIED is counted on its own line and must be 0 before
//      any conclusion is drawn from the totals.
//   2. A METHOD class may be absorbed by widening note-pairs.js only if the
//      widened rule still flags every planted REAL fixture below, keeps all
//      topic intro notes passing, and removes only hits of that class — the REAL
//      count re-measured and unchanged.
//   3. REAL hits are fixed in the content. Then §10 widens its scope.
//
// WHICH ERROR IS WORSE. For a standing check, a false flag: a check that fails
// on correct text gets switched off or argued around, after which it catches
// nothing. So METHOD classes are absorbed before §10 widens, and a missed REAL
// gap is guarded by the planted fixtures rather than by loosening the bar.
//
// INPUTS KNOWN BY CONSTRUCTION: the self-test runs one planted note per class
// and must classify each correctly before the corpus is measured.
//
// patterns.json is dormant — nothing in the app loads it (CONTENT.md §4) — so
// its notes and structure lines are measured into a separate DORMANT bucket and
// never mixed into the learner-visible totals.
//
// Run: node tools/note-pairs-measure.js            summary by class
//      node tools/note-pairs-measure.js --list     every finding, with context
// Exit code is always 0: this measures, it does not gate. Probes and
// diagnostics need no sw.js bump — not precached, not linked from the app.

const fs = require('fs');
const path = require('path');
const { unpairedHits } = require('./note-pairs');

const ROOT = path.join(__dirname, '..');
const LIST = process.argv.includes('--list');
const H = '[\\u3400-\\u4dbf\\u4e00-\\u9fff]';
const JP = '[a-z]+[1-6](?:\\s+[a-z]+[1-6])*';
const syllables = s => s.trim().split(/\s+/).filter(Boolean).length;
const chars = s => [...s].filter(c => new RegExp(H).test(c)).length;

// ── Classes ──────────────────────────────────────────────────────────────────
// Each classifier sees one hit, the markup-free note, and every hit in that
// note, and either claims the hit (returning a class) or passes. A finding may
// absorb a partner hit — 條 tiu4 is one UNBRACKETED finding, not two hits —
// so the partner is not counted again.
const CLASSES = {
  // REAL — what the learner sees is short of the rule.
  UNBRACKETED:    { real: true,  what: 'characters and reading both present, but the reading is not in brackets — 條 tiu4' },
  NO_READING:     { real: true,  what: 'characters with no reading anywhere beside them — 開心 happy' },
  NO_CHARACTERS:  { real: true,  what: 'a reading with no characters beside it — not the ni1 in 呢個' },
  // Rule breaches since v166: CONTENT.md §3 asks for full-width punctuation and
  // an unspaced gap, and v166 normalised the one instance of each.
  ASCII_PUNCT:    { real: true,  what: 'a plain ? or ! between the characters and their bracket — 返工呀? (faan1 gung1 aa3)' },
  SPACED_GAP:     { real: true,  what: 'a pattern with a spaced gap — 同 … 一樣 (tung4 … jat1 joeng6)' },
  // METHOD — a correct form the rule misreads. Since v166 tools/note-pairs.js
  // accepts all three, so these classes should stay at zero; one that fires
  // means a new variant of the form the rule does not yet read.
  SHARED_BRACKET: { real: false, what: 'two terms joined by / or ， share one bracket, one reading each — 呢/嗰 (ni1/go2)' },
  DIGITS:         { real: false, what: 'digits with their reading — 999 (gau2 gau2 gau2)' },
  OPTIONAL_PART:  { real: false, what: 'an optional syllable in brackets on both sides — 定(係) (ding6 (hai6))' },
};

function classify(note) {
  const text = note.replace(/<[^>]+>/g, '');
  const hits = unpairedHits(note);
  const findings = [];
  const taken = new Set();
  const after = h => text.slice(h.index + h.text.length);
  const before = h => text.slice(0, h.index);
  const take = (cls, ...hs) => { hs.forEach(h => taken.add(h)); findings.push({ cls, hits: hs }); };
  // A METHOD form whose bracket the rule did not blank leaves that bracket's
  // reading behind as a hit of its own. It belongs to the same finding.
  const withBracket = (h) => {
    const open = text.indexOf('(', h.index + h.text.length);
    let depth = 0, close = -1;
    for (let k = open; k >= 0 && k < text.length; k++) {
      if (text[k] === '(') depth++;
      else if (text[k] === ')' && --depth === 0) { close = k; break; }
    }
    return [h, ...hits.filter(x => x !== h && x.kind === 'jp' && x.index > open && x.index < close)];
  };

  hits.forEach((h, i) => {
    if (taken.has(h)) return;
    const next = hits[i + 1];
    const a = after(h), b = before(h);

    if (h.kind === 'han') {
      // METHOD: 返工呀? (faan1 …)
      if (new RegExp(`^[?!]\\s*\\(${JP}`).test(a)) return take('ASCII_PUNCT', ...withBracket(h));
      // METHOD: 同 … 一樣 (tung4 … jat1 joeng6)
      if (new RegExp(`^\\s+…\\s+${H}+\\s*\\(${JP}\\s+…`).test(a)) return take('SPACED_GAP', h);
      // METHOD: 呢/嗰 (ni1/go2) or 對唔住，改日啦 (deoi3 m4 zyu6, goi2 jat6 laa1) —
      // the bracket must give one reading per term, each the right length.
      const shared = a.match(new RegExp(`^([/，,]\\s*${H}+)+\\s*\\(([^)]*)\\)`));
      if (shared) {
        const terms = [h.text, ...shared[0].slice(0, shared[0].indexOf('(')).split(/[/，,]/).map(s => s.trim()).filter(Boolean)];
        const readings = shared[2].split(/[/，,]/).map(s => s.trim()).filter(s => new RegExp(`^${JP}`).test(s));
        if (readings.length >= terms.length && terms.every((t, k) => chars(t) === syllables(readings[k].match(new RegExp(`^${JP}`))[0])))
          return take('SHARED_BRACKET', h);
      }
      // REAL: 條 tiu4 — the next hit is its reading, right after it, the right
      // length. Also 爸爸 is baa4 baa1 and 我想… ngo5 soeng2: the same gap with
      // "is" or an ellipsis between, one term, not two.
      if (next && next.kind === 'jp' && /^…?\s+(?:is\s+)?$/.test(text.slice(h.index + h.text.length, next.index))
          && syllables(next.text) === chars(h.text)) return take('UNBRACKETED', h, next);
      return take('NO_READING', h);
    }

    // jp hits
    // 定(係) (ding6 (hai6)): both readings belong to the one finding.
    if (new RegExp(`${H}\\(${H}\\)\\s*\\($`).test(b)) {
      const inner = next && next.kind === 'jp' && new RegExp(`^\\s*\\($`).test(text.slice(h.index + h.text.length, next.index)) ? [next] : [];
      return take('OPTIONAL_PART', h, ...inner);
    }
    // 999 (gau2 gau2 gau2) — a real number, not the tone digit ending "ding6 (".
    if (/(^|[^a-z0-9])\d+\s*\($/.test(b)) return take('DIGITS', h);
    // REAL: 爸爸 is baa4 baa1 — a reading glossing characters a few words back.
    return take('NO_CHARACTERS', h);
  });
  return findings;
}

module.exports = { classify, CLASSES };
if (require.main !== module) return;

// ── Self-test: one planted note per class, known by construction ────────────
const FIXTURES = [
  ['Same 條 tiu4 as before.', ['UNBRACKETED']],
  ['doubled words: 爸爸 is baa4 baa1, the second', ['UNBRACKETED']],
  ['開心 happy, 傷心 (soeng1 sam1) sad.', ['NO_READING']],
  ['this 呢 (ne1) is not ni1 here.', ['NO_CHARACTERS']],
  // The three accepted forms: since v166 the rule itself reads them, so they
  // produce no hit at all.
  ['pairs with 呢/嗰 (ni1/go2) "this/that"', []],
  ['對唔住，改日啦 (deoi3 m4 zyu6, goi2 jat6 laa1) postpones', []],
  ['greetings — 返工呀? (faan1 gung1 aa3) "off to work?"', ['ASCII_PUNCT']],
  ['同 … 一樣 (tung4 … jat1 joeng6) "same as"', ['SPACED_GAP']],
  ['the number is 999 (gau2 gau2 gau2), not 911', []],
  ['use 定(係) (ding6 (hai6)) instead', []],
  // A shared bracket with too few readings, or a reading cut short, is NOT
  // accepted: the earlier term is still a character with no reading.
  ['pairs with 呢/嗰 (ni1) "this/that"', ['NO_READING']],
  ['對唔住，改日啦 (deoi3 m4, goi2 jat6 laa1) postpones', ['NO_READING']],
];
let selfFail = 0;
for (const [note, want] of FIXTURES) {
  const got = classify(note).map(f => f.cls);
  if (JSON.stringify(got) !== JSON.stringify(want)) { selfFail++; console.log(`SELF-TEST FAIL  "${note}"  got ${got.join(',') || 'nothing'}, expected ${want.join(',')}`); }
}
if (selfFail) { console.log(`\n${selfFail} self-test failure(s) — the classifier is wrong; no measurement taken.`); process.exit(0); }
console.log(`self-test: all ${FIXTURES.length} planted notes classified correctly\n`);

// ── Measure ──────────────────────────────────────────────────────────────────
const buckets = { visible: [], dormant: [] };
let sentenceNotes = 0, notesWithFindings = 0;
for (const f of fs.readdirSync(path.join(ROOT, 'data/topics')).sort()) {
  const t = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/topics', f), 'utf8'));
  for (const [rk, r] of Object.entries(t.rounds || {})) {
    (r.sentences || []).forEach((s, i) => {
      if (!s.note) return;
      sentenceNotes++;
      const fs_ = classify(s.note);
      if (fs_.length) notesWithFindings++;
      fs_.forEach(x => buckets.visible.push({ ...x, at: `${f.replace('.json', '')} r${rk} ${s.sid || 's' + i}`, note: s.note }));
    });
  }
}
const pats = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/patterns.json'), 'utf8')).patterns || [];
pats.forEach((p, i) => ['structure', 'note'].forEach(k => p[k] &&
  classify(p[k]).forEach(x => buckets.dormant.push({ ...x, at: `patterns ${i} ${k}`, note: p[k] }))));

const report = (label, list) => {
  const by = {};
  list.forEach(x => (by[x.cls] = by[x.cls] || []).push(x));
  const real = list.filter(x => CLASSES[x.cls].real).length;
  // There is no UNCLASSIFIED line, because there cannot be one: NO_READING and
  // NO_CHARACTERS take whatever no other class claims. That makes them REAL only
  // once a person has read them. All were read on 2026-11-06 (v165) and every
  // one was a real gap; if either count moves, read the new ones before
  // trusting the total.
  console.log(`${label}: ${list.length} findings — ${real} REAL, ${list.length - real} METHOD`);
  for (const [cls, meta] of Object.entries(CLASSES)) {
    const n = (by[cls] || []).length;
    if (n) console.log(`  ${meta.real ? 'REAL  ' : 'METHOD'} ${cls.padEnd(15)} ${String(n).padStart(3)}   ${meta.what}`);
  }
  if (LIST) for (const [cls, xs] of Object.entries(by)) {
    console.log(`\n  ── ${cls} ──`);
    for (const x of xs) {
      const plain = x.note.replace(/<[^>]+>/g, '');
      const h = x.hits[0], end = x.hits[x.hits.length - 1];
      const ctx = plain.slice(Math.max(0, h.index - 30), h.index) + '⟦' + plain.slice(h.index, end.index + end.text.length) + '⟧'
        + plain.slice(end.index + end.text.length, end.index + end.text.length + 25);
      console.log(`  ${x.at.padEnd(26)} …${ctx}…`);
    }
  }
  console.log('');
};
console.log(`Sentence notes measured: ${sentenceNotes}; with at least one finding: ${notesWithFindings}\n`);
console.log('NO_READING and NO_CHARACTERS are what is left after every other class. They were');
console.log('read by hand at v165 and all were real; re-read any new ones before trusting a total.\n');
report('LEARNER-VISIBLE (sentence notes)', buckets.visible);
report('DORMANT (patterns.json — not loaded by the app)', buckets.dormant);
