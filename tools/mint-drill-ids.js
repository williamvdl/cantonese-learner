#!/usr/bin/env node
/* ---------------------------------------------------------------------------
 * mint-drill-ids.js — assign stable ids (`did`) to every drill in patterns.json.
 *
 * Vanilla Node, zero dependencies. Run from repo root:
 *     node tools/mint-drill-ids.js          # assign + write
 *     node tools/mint-drill-ids.js --dry     # report only
 *
 * Same guarantees as mint-ids.js:
 *   - APPEND-ONLY: never changes or reuses an existing did. Idempotent.
 *   - Persisted high-water mark `_didSeq` at the top of patterns.json; next id =
 *     _didSeq + 1, then the mark rises. A removed drill's number is never reused.
 *   - Format "drill-NNN" (3+ digit zero-pad), globally unique, minted in file order.
 *   - REFUSES TO WRITE if any invariant would break.
 *   - Adds `did` as the FIRST key of each drill; preserves 2-space indent +
 *     trailing newline (patterns.json convention).
 * ------------------------------------------------------------------------- */
'use strict';
const fs = require('fs');
const path = require('path');

const DRY = process.argv.includes('--dry');
const PATTERNS = path.resolve(__dirname, '..', 'data', 'patterns.json');
const DID_RE = /^drill-\d{3,}$/;
const pad = n => String(n).padStart(3, '0');

const data = JSON.parse(fs.readFileSync(PATTERNS, 'utf8'));
const fatal = [];
const seen = new Set();

// Seed counter from the persisted mark AND any existing dids (mark only rises).
let seq = typeof data._didSeq === 'number' ? data._didSeq : 0;
for (const pat of data.patterns) {
  for (const d of (pat.drills || [])) {
    if ('did' in d) {
      if (!DID_RE.test(d.did)) fatal.push(`existing did "${d.did}" is malformed`);
      seq = Math.max(seq, parseInt(d.did.slice(d.did.lastIndexOf('-') + 1), 10));
    }
  }
}
const oldSeq = data._didSeq;
const assigned = [];

data.patterns = data.patterns.map(pat => {
  if (!Array.isArray(pat.drills)) return pat;
  pat.drills = pat.drills.map(d => {
    let outId;
    if ('did' in d) {
      outId = d.did;                       // append-only: keep
    } else {
      outId = `drill-${pad(++seq)}`;
      assigned.push(outId);
      d = { did: outId, ...d };            // did first
    }
    if (seen.has(outId)) fatal.push(`duplicate did "${outId}"`);
    else seen.add(outId);
    return d;
  });
  return pat;
});

data._didSeq = seq;
if (typeof oldSeq === 'number' && seq < oldSeq) fatal.push(`_didSeq would regress ${oldSeq} -> ${seq}`);

if (fatal.length) {
  console.error('✗ REFUSING TO WRITE — invariant(s) violated:');
  fatal.forEach(m => console.error('   - ' + m));
  process.exit(1);
}

console.log(`mint-drill-ids ${DRY ? '(DRY RUN — no files written)' : ''}`);
console.log(`  drills: ${data.patterns.reduce((n, p) => n + (p.drills || []).length, 0)}   newly assigned: ${assigned.length}   _didSeq=${seq}`);
if (assigned.length) console.log(`  range: ${assigned[0]} … ${assigned[assigned.length - 1]}`);
else console.log('  nothing to assign — every drill already has a did (idempotent no-op).');

if (!DRY) {
  fs.writeFileSync(PATTERNS, JSON.stringify(data, null, 2) + '\n');   // trailing newline (repo convention)
  console.log('\n✓ wrote data/patterns.json');
} else {
  console.log('\n(dry run complete — re-run without --dry to write)');
}
