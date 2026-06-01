#!/usr/bin/env node
/* ---------------------------------------------------------------------------
 * mint-ids.js — assign stable per-occurrence ids to topic vocab.
 *
 * Vanilla Node, zero dependencies. Run from repo root:
 *     node tools/mint-ids.js          # assign + write
 *     node tools/mint-ids.js --dry    # report only, write nothing
 *
 * GUARANTEES (the whole point of this tool):
 *   - APPEND-ONLY: never changes or reuses an existing id. A word that already
 *     has an id is left exactly as-is, so re-running is idempotent (a no-op once
 *     everything is minted).
 *   - Per-topic counter with a persisted high-water mark `_idSeq` at the top of
 *     each topic file. Next id = _idSeq + 1, then _idSeq is bumped. Because the
 *     mark only ever rises, deleting a word can never cause its number to be
 *     reused by a future word.
 *   - id format: "<topicKey>-NNN" (3+ digit zero-pad), e.g. greetings-001. The
 *     prefix is the BIRTH topic; if a word later moves topics it keeps this id.
 *   - REFUSES TO WRITE if any safety invariant would break (collision, malformed
 *     id, or an existing id changing) — computes everything in memory, verifies,
 *     then writes all files or none.
 *
 * Formatting is matched to the repo: 2-space indent, key order id,c,j,e, and NO
 * trailing newline, so minting produces clean diffs.
 * ------------------------------------------------------------------------- */
'use strict';
const fs = require('fs');
const path = require('path');

const DRY = process.argv.includes('--dry');
const ROOT = path.resolve(__dirname, '..');
const TOPICS_DIR = path.join(ROOT, 'data', 'topics');
const ID_RE = /^[a-z][a-z0-9]*-\d{3,}$/;
const pad = n => String(n).padStart(3, '0');

const files = fs.readdirSync(TOPICS_DIR).filter(f => f.endsWith('.json')).sort();
const planned = [];   // { file, key, json (mutated copy), assigned: [{c,id}], newSeq, oldSeq }
const globalIds = new Map();   // id -> "tk r? c"  (collision detector across everything)
const fatal = [];

for (const f of files) {
  const key = f.slice(0, -5);
  const abs = path.join(TOPICS_DIR, f);
  const json = JSON.parse(fs.readFileSync(abs, 'utf8'));

  // Seed the counter from the persisted mark AND any ids already present, so the
  // mark can only ever move up.
  let seq = typeof json._idSeq === 'number' ? json._idSeq : 0;
  for (const rv of Object.values(json.rounds || {})) {
    for (const w of (rv.words || [])) {
      if ('id' in w) {
        if (!ID_RE.test(w.id)) fatal.push(`${key}: existing id "${w.id}" is malformed`);
        const owned = w.id.slice(0, w.id.lastIndexOf('-')) === key;
        if (owned) seq = Math.max(seq, parseInt(w.id.slice(w.id.lastIndexOf('-') + 1), 10));
      }
    }
  }
  const oldSeq = json._idSeq;
  const assigned = [];

  // Assign in walk order: round "1" then "2" (numeric), file order within.
  const roundKeys = Object.keys(json.rounds || {}).sort((a, b) => Number(a) - Number(b));
  for (const rk of roundKeys) {
    const rv = json.rounds[rk];
    rv.words = (rv.words || []).map(w => {
      let outId;
      if ('id' in w) {
        outId = w.id;                     // append-only: keep untouched
      } else {
        outId = `${key}-${pad(++seq)}`;
        assigned.push({ c: w.c, id: outId });
        w = { id: outId, ...w };          // id first, then c,j,e
      }
      // global collision check
      if (globalIds.has(outId)) fatal.push(`duplicate id "${outId}" (${globalIds.get(outId)} & ${key} ${w.c})`);
      else globalIds.set(outId, `${key} r${rk} ${w.c}`);
      return w;
    });
  }

  json._idSeq = seq;                       // persisted high-water mark (>= old)
  if (typeof oldSeq === 'number' && seq < oldSeq) fatal.push(`${key}: _idSeq would regress ${oldSeq} -> ${seq}`);
  planned.push({ file: f, abs, key, json, assigned, newSeq: seq, oldSeq });
}

// ── Verify before writing ──────────────────────────────────────────────────
if (fatal.length) {
  console.error('✗ REFUSING TO WRITE — safety invariant(s) violated:');
  fatal.forEach(m => console.error('   - ' + m));
  process.exit(1);
}

// ── Report ────────────────────────────────────────────────────────────────
const totalAssigned = planned.reduce((n, p) => n + p.assigned.length, 0);
console.log(`mint-ids ${DRY ? '(DRY RUN — no files written)' : ''}`);
console.log(`  topic files: ${planned.length}   ids newly assigned this run: ${totalAssigned}`);
for (const p of planned) {
  if (p.assigned.length) {
    console.log(`  ${p.key}: +${p.assigned.length}  (${p.assigned[0].id} … ${p.assigned[p.assigned.length - 1].id})  _idSeq=${p.newSeq}`);
  }
}
if (totalAssigned === 0) console.log('  nothing to assign — every word already has an id (idempotent no-op).');

// ── Write (2-space indent, id,c,j,e order preserved, no trailing newline) ────
if (!DRY) {
  for (const p of planned) {
    fs.writeFileSync(p.abs, JSON.stringify(p.json, null, 2));   // no trailing \n, matches repo
  }
  console.log(`\n✓ wrote ${planned.length} files`);
} else {
  console.log('\n(dry run complete — re-run without --dry to write)');
}
