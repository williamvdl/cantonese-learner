#!/usr/bin/env node
/**
 * asr-testset.js — derives the ASR probe's test set from the corpus.
 *
 * WHY THIS EXISTS
 * The question the ASR probe has to answer is not "does speech recognition
 * work" — Speak mode already works 80-90% of the time. It is narrower:
 *
 *     when the learner says the WRONG TONE, does the recogniser return a
 *     different character, or does it snap to the target anyway?
 *
 * If it snaps, there is no signal to show and the feature cannot exist. So the
 * probe must include deliberate mispronunciation, and every prompt needs a
 * *named* wrong tone to say — not "say it wrong somehow". That is what this
 * script derives.
 *
 * It is a build-time tool, not a runtime dependency, and it is not a standing
 * check — it asserts no invariant. It writes a JSON file the probe page loads.
 *
 *   node tools/asr-testset.js                 human-readable summary
 *   node tools/asr-testset.js --write         also write tools/asr-testset.json
 *   node tools/asr-testset.js --write --pool  include every candidate, not just the session
 *   node tools/asr-testset.js --skipped       list entries dropped on alignment
 *   node tools/asr-testset.js --full          print every candidate, not a sample
 *   node tools/asr-testset.js --single=12 --multi=12 --sentence=8   session sizes
 *
 * WHY DERIVED RATHER THAN HAND-PICKED
 * Two reasons, both recorded in STATUS.md as things that have already gone
 * wrong here. Hand-typed derived data drifts silently against the corpus it
 * describes. And a test set of classic textbook pairs would measure the
 * recogniser against words the app does not teach, so a promising result would
 * need re-validating against real content before it could become a feature.
 *
 * WHAT COUNTS AS A USABLE WRONG TONE
 * A wrong-tone read is only informative if the thing said is a *real Cantonese
 * syllable*, because the premise under test is that a wrong tone lands on a
 * different real word. Saying a tone that is not a word at all tests something
 * else — how the recogniser handles nonsense — which is not the question.
 *
 * The syllable inventory is therefore built from the corpus itself: every
 * (base, tone) pair attested anywhere in the 585 words or the 307 sentence
 * breakdowns, together with the characters seen carrying it. 327 bases are
 * attested, 139 of them in two or more tones. This under-counts real Cantonese
 * — a syllable the corpus happens not to use is treated as unattested — which
 * is the safe direction to be wrong in: it discards usable items, it never
 * invents one.
 *
 * Note the inventory is deliberately not deduplicated by "correct" reading.
 * 士 appears as both si6 and si2, the latter from 巴士 (baa1 si2) and
 * 的士 (dik1 si2), where the loanword reading genuinely is si2. Both are real;
 * flattening them would be wrong.
 *
 * TWO GRADES OF ITEM, AND WHY THE DISTINCTION IS WORTH KEEPING
 *   pair     — the whole word differs from another corpus word by tone alone.
 *              A wrong-tone read lands on a word the app itself teaches, so a
 *              hit here converts straight into a feature.
 *   attested — the swapped syllable exists in the target tone with a real
 *              character somewhere in the corpus, but the resulting whole word
 *              is not itself a corpus entry.
 * Only 26 minimal-pair groups exist across the whole corpus (22 of them single
 * syllable), so a probe restricted to grade `pair` would be too small to
 * conclude anything from and would test single syllables almost exclusively.
 * Both grades are emitted, tagged, so the results can be read separately —
 * if the two grades disagree, that disagreement is itself the finding.
 *
 * WHICH WRONG TONE TO ASK FOR
 * This is the one piece of linguistic knowledge in the file rather than
 * corpus-derived fact, so it is stated as a constant and explained. Cantonese
 * tone confusions are not uniformly distributed: the contour/level pairs that
 * share a register are the ones learners actually merge. CONTRAST_RANK ranks a
 * swap by how much a learner is likely to make it, so the probe spends its
 * items on realistic errors rather than on 1-vs-4, which nobody confuses and
 * which would flatter the result.
 *
 * WHAT THIS SCRIPT DOES NOT DO
 * No pitch, F0 or audio analysis of any kind — that path is closed (DES-37).
 * This is the recognition path only.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'data');
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));

const WRITE = process.argv.includes('--write');
const FULL = process.argv.includes('--full');
const SKIPPED = process.argv.includes('--skipped');
const argN = (flag, dflt) => {
  const a = process.argv.find(s => s.startsWith(`--${flag}=`));
  return a ? parseInt(a.split('=')[1], 10) : dflt;
};
const N_SINGLE = argN('single', 12);
const N_MULTI = argN('multi', 12);
const N_SENTENCE = argN('sentence', 8);

// Tone-confusion ranking. Lower is more confusable, so preferred for a probe
// item. Derived from the standard description of the Cantonese six-tone system
// rather than from the corpus: 2/5 (high rise vs low rise) and 3/6 (mid level
// vs low level) are the same contour in different registers and are the two
// classic learner merges; 4/6 differ mainly in whether the low tone falls;
// 1/3 is a register distinction on a level tone. 1/4 and 1/6 are far apart and
// are ranked last precisely so they are chosen only when nothing better exists.
const CONTRAST_RANK = {
  '2-5': 0, '5-2': 0,
  '3-6': 1, '6-3': 1,
  '4-6': 2, '6-4': 2,
  '1-3': 3, '3-1': 3,
  '2-3': 4, '3-2': 4,
  '5-6': 4, '6-5': 4,
  '1-2': 5, '2-1': 5,
  '4-5': 5, '5-4': 5,
  '1-6': 6, '6-1': 6,
  '3-5': 6, '5-3': 6,
  '2-4': 7, '4-2': 7,
  '3-4': 7, '4-3': 7,
  '1-5': 8, '5-1': 8,
  '1-4': 9, '4-1': 9
};
const rank = (a, b) => CONTRAST_RANK[`${a}-${b}`] ?? 9;

// Extension A (U+3400–U+4DBF) matters here and is easy to omit: 㗎 (gaa3), one
// of the commonest Cantonese sentence-final particles, is U+35CA and sits
// outside the CJK Unified Ideographs block that a character test usually stops
// at. Omitting it silently dropped ten sentences from the inventory.
const HAN = /[\u3400-\u4dbf\u4e00-\u9fff]/;
const syllables = j => String(j || '')
  .toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
const chars = c => [...String(c || '')].filter(ch => HAN.test(ch));
const baseOf = s => s.replace(/[0-9]/g, '');
const toneOf = s => (s.match(/[1-6]/) || [])[0] || null;

// ── Load the corpus ──────────────────────────────────────────────────────────
const topicFiles = fs.readdirSync(path.join(DATA, 'topics'))
  .filter(f => f.endsWith('.json')).sort();

const words = [];      // every word, every tier
const sentences = [];  // every sentence, every tier
const inventory = {};  // base -> tone -> Set(characters attested)

const skipped = [];

function attest(c, j, where) {
  const parts = syllables(j), cs = chars(c);
  // Only learn from entries where syllables and characters line up 1:1.
  // A mismatch means punctuation, a loanword or an authoring slip; guessing the
  // alignment would poison the inventory, which everything else rests on.
  // Skips are collected rather than dropped — --skipped prints them, because a
  // count with no way to see what it counted is the shape of figure that goes
  // stale unnoticed, and some of these may be genuine authoring defects.
  if (!parts.length || parts.length !== cs.length) {
    skipped.push({ where, c, j, syllables: parts.length, chars: cs.length });
    return false;
  }
  parts.forEach((p, i) => {
    const t = toneOf(p); if (!t) return;
    const b = baseOf(p);
    inventory[b] = inventory[b] || {};
    (inventory[b][t] = inventory[b][t] || new Set()).add(cs[i]);
  });
  return true;
}

let aligned = 0, unaligned = 0;
for (const f of topicFiles) {
  const key = f.replace('.json', '');
  const t = read(path.join(DATA, 'topics', f));
  const label = t.meta?.label || key;
  for (const [tier, round] of Object.entries(t.rounds || {})) {
    for (const w of (round.words || [])) {
      words.push({ ...w, topic: key, topicLabel: label, tier: +tier });
      (attest(w.c, w.j, w.id) ? aligned++ : unaligned++);
    }
    for (const s of (round.sentences || [])) {
      sentences.push({ ...s, topic: key, topicLabel: label, tier: +tier });
      for (const b of (s.bd || [])) (attest(b.c, b.j, s.sid) ? aligned++ : unaligned++);
    }
  }
}

const attestedChars = (base, tone) => [...(inventory[base]?.[tone] || [])];
const isAttested = (base, tone) => !!inventory[base]?.[tone]?.size;

// ── Corpus minimal pairs: whole words differing by tone alone ────────────────
// Key on the toneless syllable string, then group by tone pattern. Two entries
// under one key with different tone patterns are a minimal pair by definition.
const byShape = {};
for (const w of words) {
  const parts = syllables(w.j);
  if (!parts.length || !parts.every(toneOf)) continue;
  const key = parts.map(baseOf).join(' ');
  (byShape[key] = byShape[key] || []).push({ w, parts });
}

const pairPartners = new Map(); // word id -> [{word, differsAt, theirTone}]
let pairGroups = 0;
for (const [, entries] of Object.entries(byShape)) {
  const patterns = new Set(entries.map(e => e.parts.map(toneOf).join('')));
  if (patterns.size < 2) continue;
  pairGroups++;
  for (const a of entries) for (const b of entries) {
    if (a.w.id === b.w.id) continue;
    const diff = a.parts.map((p, i) => toneOf(p) !== toneOf(b.parts[i]) ? i : -1)
      .filter(i => i >= 0);
    // Only single-syllable differences are usable as a prompt — "say the second
    // syllable in tone 4 instead" is an instruction; "say two syllables
    // differently at once" is not something a learner can execute cleanly.
    if (diff.length !== 1) continue;
    const i = diff[0];
    const list = pairPartners.get(a.w.id) || [];
    list.push({ word: b.w, at: i, tone: toneOf(b.parts[i]) });
    pairPartners.set(a.w.id, list);
  }
}

// ── Build a swap for one word ────────────────────────────────────────────────
// Returns the best available wrong-tone instruction, or null if the word has
// no syllable that exists in any other tone anywhere in the corpus.
function buildSwap(w) {
  const parts = syllables(w.j);
  if (!parts.length || !parts.every(toneOf)) return null;
  // (character list is read via chars() at point of use)
  const candidates = [];

  // Grade `pair` first: a real corpus word sits on the other side of the swap.
  for (const p of (pairPartners.get(w.id) || [])) {
    candidates.push({
      grade: 'pair',
      at: p.at,
      fromTone: toneOf(parts[p.at]),
      toTone: p.tone,
      landsOn: { c: p.word.c, j: p.word.j, e: p.word.e, id: p.word.id },
      rank: rank(toneOf(parts[p.at]), p.tone)
    });
  }

  // Grade `attested`: the swapped syllable is real, the whole word is not.
  parts.forEach((p, i) => {
    const b = baseOf(p), from = toneOf(p);
    for (const to of ['1', '2', '3', '4', '5', '6']) {
      if (to === from || !isAttested(b, to)) continue;
      if (candidates.some(c => c.grade === 'pair' && c.at === i && c.toTone === to)) continue;
      candidates.push({
        grade: 'attested',
        at: i,
        fromTone: from,
        toTone: to,
        landsOn: { syllable: b + to, chars: attestedChars(b, to) },
        rank: rank(from, to)
      });
    }
  });

  if (!candidates.length) return null;
  // Prefer a real word over a real syllable, then the most confusable contrast.
  candidates.sort((a, b) =>
    (a.grade === b.grade ? 0 : a.grade === 'pair' ? -1 : 1) || a.rank - b.rank);
  const best = candidates[0];
  const said = parts.slice();
  said[best.at] = baseOf(said[best.at]) + best.toTone;

  return {
    grade: best.grade,
    at: best.at,
    syllable: chars(w.c)[best.at] || null,
    fromTone: best.fromTone,
    toTone: best.toTone,
    targetJyutping: parts.join(' '),
    wrongJyutping: said.join(' '),
    landsOn: best.landsOn,
    contrastRank: best.rank,
    alternatives: candidates.length
  };
}

// ── Candidate pools ──────────────────────────────────────────────────────────
const single = [], multi = [];
for (const w of words) {
  const parts = syllables(w.j);
  const swap = buildSwap(w);
  if (!swap) continue;
  const item = {
    kind: parts.length === 1 ? 'single' : 'multi',
    id: w.id, c: w.c, j: w.j, e: w.e,
    topic: w.topic, topicLabel: w.topicLabel, tier: w.tier,
    syllables: parts.length,
    swap
  };
  (parts.length === 1 ? single : multi).push(item);
}

// Sentence-final particles are excluded as swap targets, and the set is taken
// from the `particles` topic rather than hand-listed. 喇 (laa3) and 啦 (laa1)
// are a genuine tone minimal pair, which is exactly why they are a bad probe
// item: a recogniser that returns the other one has not necessarily heard a
// tone error, because particles are acoustically reduced, highly variable in
// running speech, and the language model has little to disambiguate them with.
// A hit there would be indistinguishable from noise, and a miss would be
// unfairly counted against the feature.
const PARTICLES = new Set(
  Object.values(read(path.join(DATA, 'topics', 'particles.json')).rounds || {})
    .flatMap(r => (r.words || []).map(w => w.c))
);

const sentenceItems = [];
for (const s of sentences) {
  const bd = (s.bd || []).filter(b =>
    syllables(b.j).length === 1 && toneOf(syllables(b.j)[0]) && !PARTICLES.has(b.c));
  if (bd.length < 2) continue;
  const opts = [];
  for (const b of bd) {
    const p = syllables(b.j)[0], base = baseOf(p), from = toneOf(p);
    for (const to of ['1', '2', '3', '4', '5', '6']) {
      if (to === from || !isAttested(base, to)) continue;
      opts.push({ b, base, from, to, rank: rank(from, to) });
    }
  }
  if (!opts.length) continue;
  opts.sort((a, b) => a.rank - b.rank);
  const o = opts[0];
  sentenceItems.push({
    kind: 'sentence',
    id: s.sid, c: s.c, j: s.j, e: s.e,
    topic: s.topic, topicLabel: s.topicLabel, tier: s.tier,
    syllables: (s.bd || []).length,
    swap: {
      grade: 'attested',
      syllable: o.b.c,
      fromTone: o.from,
      toTone: o.to,
      targetJyutping: o.b.j,
      wrongJyutping: o.base + o.to,
      landsOn: { syllable: o.base + o.to, chars: attestedChars(o.base, o.to) },
      contrastRank: o.rank,
      alternatives: opts.length
    }
  });
}

// ── Session selection ────────────────────────────────────────────────────────
// A probe nobody finishes answers nothing, so the emitted session is small
// enough to actually run: each item is spoken twice (correct, then the named
// wrong tone), so 32 items is 64 recordings.
//
// Selection is deterministic — no randomness — so a re-run produces the same
// session and two runs are comparable. It spreads across tone contrasts rather
// than taking the top of the sorted list, because the top of the list is all
// one contrast and a result drawn from it would generalise to nothing.
function spread(pool, n) {
  const sorted = pool.slice().sort((a, b) =>
    (a.swap.grade === b.swap.grade ? 0 : a.swap.grade === 'pair' ? -1 : 1) ||
    a.swap.contrastRank - b.swap.contrastRank ||
    a.id.localeCompare(b.id));
  const byContrast = new Map();
  for (const it of sorted) {
    const k = `${it.swap.fromTone}-${it.swap.toTone}`;
    (byContrast.get(k) || byContrast.set(k, []).get(k)).push(it);
  }
  const keys = [...byContrast.keys()];
  const out = [], seenTopic = new Map(), seenPair = new Set();
  let guard = 0;
  while (out.length < n && guard++ < n * 40) {
    let added = false;
    for (const k of keys) {
      if (out.length >= n) break;
      const bucket = byContrast.get(k);
      // Prefer variety of topic too, so the session is not four words from one
      // lesson — but never at the cost of returning fewer items than asked for.
      let i = bucket.findIndex(it => (seenTopic.get(it.topic) || 0) < 2);
      if (i < 0) i = 0;
      const it = bucket.splice(i, 1)[0];
      if (!it) continue;
      // Take one direction of a minimal pair, not both. 耳 (ji5) -> 椅 (ji2)
      // and 椅 (ji2) -> 耳 (ji5) are two items measuring one contrast on one
      // pair of words, and at twelve items breadth is worth more than the
      // asymmetry between them. The other direction stays in the pool.
      const pk = it.swap.landsOn.id ? [it.id, it.swap.landsOn.id].sort().join('|') : null;
      if (pk && seenPair.has(pk)) continue;
      if (pk) seenPair.add(pk);
      seenTopic.set(it.topic, (seenTopic.get(it.topic) || 0) + 1);
      out.push(it); added = true;
    }
    if (!added) break;
  }
  return out.slice(0, n);
}

const session = {
  single: spread(single, N_SINGLE),
  multi: spread(multi, N_MULTI),
  sentence: spread(sentenceItems, N_SENTENCE)
};

// ── Report ───────────────────────────────────────────────────────────────────
const pct = (a, b) => b ? `${(100 * a / b).toFixed(1)}%` : '—';
const tally = pool => {
  const t = { pair: 0, attested: 0 };
  pool.forEach(i => t[i.swap.grade]++);
  return t;
};

const L = [];
L.push('ASR probe test set — derived from the corpus');
L.push('='.repeat(60));
L.push('');
L.push(`Corpus            ${words.length} words, ${sentences.length} sentences`);
L.push(`Alignment         ${aligned} entries usable, ${unaligned} skipped (${pct(unaligned, aligned + unaligned)}) — syllables did not match characters 1:1`);
L.push(`Syllable inventory ${Object.keys(inventory).length} bases attested, ` +
  `${Object.values(inventory).filter(v => Object.keys(v).length > 1).length} in two or more tones`);
L.push(`Minimal-pair groups ${pairGroups} across the whole corpus`);
L.push('');
L.push('Candidate pool (every word with at least one usable wrong tone)');
for (const [name, pool] of [['single-syllable', single], ['multi-syllable', multi], ['sentence', sentenceItems]]) {
  const t = tally(pool);
  L.push(`  ${name.padEnd(16)} ${String(pool.length).padStart(4)}   pair ${String(t.pair).padStart(3)}   attested ${String(t.attested).padStart(4)}`);
}
L.push('');
L.push(`Session (deterministic; ${N_SINGLE} + ${N_MULTI} + ${N_SENTENCE} items = ` +
  `${(N_SINGLE + N_MULTI + N_SENTENCE) * 2} recordings)`);
L.push('');
const row = it => {
  const s = it.swap;
  const lands = s.landsOn.c
    ? `${s.landsOn.c} (${s.landsOn.j}) ${s.landsOn.e}`
    : `${s.landsOn.chars.slice(0, 3).join('')} (${s.landsOn.syllable})`;
  return `  ${(it.c + ' ').padEnd(14)} ${it.j.padEnd(22)} say ${s.syllable || '?'} ` +
    `as ${s.wrongJyutping.split(' ')[it.kind === 'sentence' ? 0 : s.at] || s.wrongJyutping}`.padEnd(26) +
    ` -> ${lands}  [${s.grade}]`;
};
for (const [name, pool] of [['SINGLE SYLLABLE', session.single], ['MULTI SYLLABLE', session.multi], ['SENTENCE', session.sentence]]) {
  L.push(` ${name}`);
  (FULL ? (name === 'SINGLE SYLLABLE' ? single : name === 'MULTI SYLLABLE' ? multi : sentenceItems) : pool)
    .forEach(it => L.push(row(it)));
  L.push('');
}
const contrasts = {};
[...session.single, ...session.multi, ...session.sentence]
  .forEach(i => { const k = `${i.swap.fromTone}→${i.swap.toTone}`; contrasts[k] = (contrasts[k] || 0) + 1; });
L.push(`Contrast spread   ${Object.entries(contrasts).sort().map(([k, v]) => `${k}:${v}`).join('  ')}`);
L.push('');
if (SKIPPED) {
  L.push(`Skipped on alignment (${skipped.length}) — syllable count != character count`);
  skipped.forEach(s => L.push(`  ${String(s.where).padEnd(16)} ${(s.c + '').padEnd(12)} ${s.j}   (${s.chars} chars, ${s.syllables} syllables)`));
  L.push('');
}
console.log(L.join('\n'));

if (WRITE) {
  // Character -> attested jyutping readings. The probe needs this to answer one
  // question at analysis time: does the decoded character differ from the target
  // by TONE ALONE, or is it an unrelated character? That distinction is the
  // difference between feedback the learner can act on ("you said the right
  // syllable in the wrong tone") and noise, and it cannot be recomputed in the
  // browser without the corpus.
  const readings = {};
  for (const [base, tones] of Object.entries(inventory))
    for (const [tone, cs] of Object.entries(tones))
      for (const c of cs) (readings[c] = readings[c] || new Set()).add(base + tone);

  // Lexicon for displaying what the recogniser returned. Web Speech gives back
  // characters and nothing else — no jyutping, no tone — so the probe can only
  // show a reading by looking the characters up. Whole-word entries win over
  // per-character ones because a multi-syllable word carries the reading that
  // actually applies (and any tone sandhi already baked in), where stitching
  // single characters together does not.
  const lexicon = {};
  // Match the browser's normalizeChinese() so lookups line up with what the
  // probe will actually search for.
  const normalise = t => String(t || '').replace(/[\s，。！？、,!?.\-]/g, '');
  const addLex = (c, j, e) => {
    if (!c || !j) return;
    const cur = lexicon[c];
    if (!cur) { lexicon[c] = { j: [j], e: e ? [e] : [] }; return; }
    if (!cur.j.includes(j)) cur.j.push(j);
    if (e && !cur.e.includes(e)) cur.e.push(e);
  };
  for (const f of topicFiles) {
    const t = read(path.join(DATA, 'topics', f));
    for (const round of Object.values(t.rounds || {})) {
      for (const w of (round.words || [])) addLex(w.c, w.j, w.e);
      for (const s of (round.sentences || [])) {
        // Whole sentences go in too, so a decode that matches one shows its own
        // English rather than a chain of per-word glosses.
        addLex(normalise(s.c), s.j, s.e);
        for (const b of (s.bd || [])) addLex(b.c, b.j, b.e);
      }
    }
  }

  const out = {
    generated: new Date().toISOString().slice(0, 10),
    note: 'Generated by tools/asr-testset.js — do not hand-edit. Re-run the script.',
    corpus: { words: words.length, sentences: sentences.length, pairGroups },
    session,
    readings: Object.fromEntries(Object.entries(readings).map(([c, s]) => [c, [...s]])),
    lexicon
  };
  // The full candidate pool is 600+ items and is only wanted when widening a
  // later run. Off by default so the file stays small enough to load on a phone.
  if (process.argv.includes('--pool')) out.pool = { single, multi, sentence: sentenceItems };

  const p = path.join(__dirname, 'asr-testset.json');
  fs.writeFileSync(p, JSON.stringify(out, null, 2));
  console.log(`Written ${path.relative(ROOT, p)} — ` +
    `${(fs.statSync(p).size / 1024).toFixed(0)} KB` +
    (out.pool ? ' (includes full pool)' : ' (session only; --pool to include all candidates)'));
}
