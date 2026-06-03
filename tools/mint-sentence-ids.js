#!/usr/bin/env node
/* mint-sentence-ids.js — assign stable ids (`sid`) to every example sentence in
 * every topic/tier. Vanilla Node, zero deps. Run from repo root:
 *     node tools/mint-sentence-ids.js [--dry]
 * Same guarantees as the word/drill minters: APPEND-ONLY, idempotent, per-topic
 * `_sidSeq` high-water mark, refuses to write on any violation. Format
 * "<topic>-t<tier>-sNN" (2+ digit pad). `sid` inserted as the FIRST key of each
 * sentence. Preserves 2-space indent + NO trailing newline (topic-file convention).
 * Chat-convo lines are intentionally NOT given ids (positional, not referenced). */
'use strict';
const fs = require('fs');
const path = require('path');

const DRY = process.argv.includes('--dry');
const DIR = path.resolve(__dirname, '..', 'data', 'topics');
const SID_RE = /^[a-z][a-z0-9]*-t\d+-s\d{2,}$/;
const pad = n => String(n).padStart(2, '0');

const files = fs.readdirSync(DIR).filter(f => f.endsWith('.json')).sort();
const fatal = [];
const planned = [];
let totalAssigned = 0;

for (const f of files) {
  const key = f.slice(0, -5);
  const abs = path.join(DIR, f);
  const json = JSON.parse(fs.readFileSync(abs, 'utf8'));

  let seq = typeof json._sidSeq === 'number' ? json._sidSeq : 0;
  for (const rv of Object.values(json.rounds || {})) {
    for (const s of (rv.sentences || [])) {
      if ('sid' in s) {
        if (!SID_RE.test(s.sid)) fatal.push(`${key}: malformed sid "${s.sid}"`);
        seq = Math.max(seq, parseInt(s.sid.slice(s.sid.lastIndexOf('-') + 1).replace(/\D/g, ''), 10));
      }
    }
  }
  const oldSeq = json._sidSeq;
  let assigned = 0;
  const roundKeys = Object.keys(json.rounds || {}).sort((a, b) => Number(a) - Number(b));
  for (const rk of roundKeys) {
    const rv = json.rounds[rk];
    if (!Array.isArray(rv.sentences)) continue;
    rv.sentences = rv.sentences.map(s => {
      if ('sid' in s) return s;
      const sid = `${key}-t${rk}-s${pad(++seq)}`;
      assigned++; totalAssigned++;
      return { sid, ...s };   // sid first
    });
  }
  json._sidSeq = seq;
  if (typeof oldSeq === 'number' && seq < oldSeq) fatal.push(`${key}: _sidSeq would regress ${oldSeq} -> ${seq}`);
  planned.push({ abs, key, assigned, seq, json });
}

if (fatal.length) {
  console.error('✗ REFUSING TO WRITE:'); fatal.forEach(m => console.error('   - ' + m)); process.exit(1);
}

console.log(`mint-sentence-ids ${DRY ? '(DRY RUN)' : ''}  newly assigned: ${totalAssigned}`);
for (const p of planned) if (p.assigned) console.log(`  ${p.key}: +${p.assigned}  _sidSeq=${p.seq}`);
if (!totalAssigned) console.log('  nothing to assign — every sentence already has a sid (idempotent no-op).');

if (!DRY) {
  for (const p of planned) fs.writeFileSync(p.abs, JSON.stringify(p.json, null, 2));  // 2-space indent, no trailing newline
  console.log(`\n✓ wrote ${planned.length} files`);
}
