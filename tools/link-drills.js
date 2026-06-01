#!/usr/bin/env node
/* ---------------------------------------------------------------------------
 * link-drills.js — Phase 2: add a `wid` reference to every drill answer and
 * distractor in patterns.json, pointing at the canonical word id minted in
 * Phase 1. The existing c/j/e stay as a display cache (the validator keeps them
 * honest). Run AFTER mint-ids.js, from repo root:
 *     node tools/link-drills.js          # link + write
 *     node tools/link-drills.js --dry    # report only
 *
 * Resolution: a drill carries topics[]. Each answer/distractor is matched by its
 * `c` against the vocab of those tagged topics. Verified against the data to be
 * unambiguous (every item resolves to exactly one word). The tool REFUSES TO
 * WRITE if anything fails to resolve or resolves ambiguously.
 *
 * Idempotent: an item that already has a wid is left untouched.
 * patterns.json formatting preserved: 2-space indent + trailing newline.
 * ------------------------------------------------------------------------- */
'use strict';
const fs = require('fs');
const path = require('path');

const DRY = process.argv.includes('--dry');
const ROOT = path.resolve(__dirname, '..');
const TOPICS_DIR = path.join(ROOT, 'data', 'topics');
const PATTERNS = path.join(ROOT, 'data', 'patterns.json');

// Build (topicKey -> Map(c -> [ {id,c,j,e}, ... ])) from minted vocab.
const vocab = {};
for (const f of fs.readdirSync(TOPICS_DIR).filter(f => f.endsWith('.json'))) {
  const tk = f.slice(0, -5);
  const t = JSON.parse(fs.readFileSync(path.join(TOPICS_DIR, f), 'utf8'));
  const m = (vocab[tk] = new Map());
  for (const rv of Object.values(t.rounds || {}))
    for (const w of (rv.words || [])) {
      if (!('id' in w)) { console.error(`✗ ${tk} has unminted words — run mint-ids.js first`); process.exit(1); }
      if (!m.has(w.c)) m.set(w.c, []);
      m.get(w.c).push(w);
    }
}

const data = JSON.parse(fs.readFileSync(PATTERNS, 'utf8'));
const fatal = [];
let linked = 0, already = 0;

data.patterns.forEach((pat, pi) => {
  (pat.drills || []).forEach((d, di) => {
    const where = `pattern[${pi}] "${pat.label}" drill[${di}]`;
    const tags = d.topics || [];
    const relink = (slot, it) => {
      if (!it) return it;
      if ('wid' in it) { already++; return it; }
      const hits = [];
      for (const tk of tags) for (const w of (vocab[tk]?.get(it.c) || [])) hits.push(w);
      const uniqueIds = [...new Set(hits.map(w => w.id))];
      if (uniqueIds.length === 0) { fatal.push(`${where} ${slot}: "${it.c}" resolves to no word in ${JSON.stringify(tags)}`); return it; }
      if (uniqueIds.length > 1) { fatal.push(`${where} ${slot}: "${it.c}" is ambiguous → ${uniqueIds.join(', ')}`); return it; }
      linked++;
      return { wid: uniqueIds[0], ...it };     // wid first, then c,j,e
    };
    d.answer = relink('answer', d.answer);
    if (Array.isArray(d.distractors)) d.distractors = d.distractors.map((x, k) => relink(`distractor[${k}]`, x));
  });
});

if (fatal.length) {
  console.error('✗ REFUSING TO WRITE — unresolved/ambiguous references:');
  fatal.forEach(m => console.error('   - ' + m));
  process.exit(1);
}

console.log(`link-drills ${DRY ? '(DRY RUN — no files written)' : ''}`);
console.log(`  wids newly linked this run: ${linked}   already linked: ${already}`);
if (linked === 0) console.log('  nothing to link — every drill item already has a wid (idempotent no-op).');

if (!DRY) {
  fs.writeFileSync(PATTERNS, JSON.stringify(data, null, 2) + '\n');   // trailing newline matches repo
  console.log('\n✓ wrote data/patterns.json');
} else {
  console.log('\n(dry run complete — re-run without --dry to write)');
}
