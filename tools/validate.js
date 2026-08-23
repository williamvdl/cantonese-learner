#!/usr/bin/env node
/* ---------------------------------------------------------------------------
 * validate.js — data integrity check for the Cantonese Learner data set.
 *
 * Vanilla Node, zero dependencies (ruthless boringness). Run from repo root:
 *     node tools/validate.js
 *
 * It is PHASE-AWARE so the same script stays green through the whole stable-IDs
 * migration:
 *   - STRUCTURAL + LINK checks always run (this is the baseline; green on v50).
 *   - ID checks run once ANY word carries an `id`. Rule: all-or-nothing — once
 *     a single word has an id, every word must.
 *   - WID checks run once ANY drill answer/distractor carries a `wid`. Same
 *     all-or-nothing rule.
 *
 * Exit code 0 = all green, 1 = at least one error (suitable for a pre-deploy gate).
 * ------------------------------------------------------------------------- */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TOPICS_DIR = path.join(ROOT, 'data', 'topics');
const PATTERNS = path.join(ROOT, 'data', 'patterns.json');

const ID_RE = /^[a-z][a-z0-9]*-\d{3,}$/;          // e.g. greetings-001
const idPrefix = id => id.slice(0, id.lastIndexOf('-'));
const idNum    = id => parseInt(id.slice(id.lastIndexOf('-') + 1), 10);

const errors = [];
const err = (cat, msg) => errors.push({ cat, msg });
const readJSON = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const isNonEmptyStr = v => typeof v === 'string' && v.trim().length > 0;

// ── Load ────────────────────────────────────────────────────────────────────
const topicFiles = fs.readdirSync(TOPICS_DIR).filter(f => f.endsWith('.json')).sort();
const topics = {};                 // key -> parsed topic file
for (const f of topicFiles) {
  const key = f.slice(0, -5);
  try { topics[key] = readJSON(path.join(TOPICS_DIR, f)); }
  catch (e) { err('parse', `topics/${f}: ${e.message}`); }
}
let patterns = { patterns: [] };
try { patterns = readJSON(PATTERNS); }
catch (e) { err('parse', `patterns.json: ${e.message}`); }

// Flatten every word occurrence once: { topicKey, round, w (the object) }
const allWords = [];
for (const [tk, t] of Object.entries(topics)) {
  if (!t || typeof t !== 'object') continue;
  for (const [rk, rv] of Object.entries(t.rounds || {})) {
    for (const w of (rv.words || [])) allWords.push({ tk, rk, w });
  }
}

// ── STRUCTURAL ────────────────────────────────────────────────────────────────
for (const [tk, t] of Object.entries(topics)) {
  if (!t || typeof t !== 'object') continue;
  if (!t.meta || !isNonEmptyStr(t.meta.label)) err('structural', `${tk}: missing meta.label`);
  if (!t.rounds || typeof t.rounds !== 'object') { err('structural', `${tk}: missing rounds`); continue; }
  for (const [rk, rv] of Object.entries(t.rounds)) {
    if (!Array.isArray(rv.words)) err('structural', `${tk} r${rk}: words is not an array`);
  }
}
for (const { tk, rk, w } of allWords) {
  for (const f of ['c', 'j', 'e']) {
    if (!isNonEmptyStr(w[f])) err('structural', `${tk} r${rk}: word missing "${f}" (${JSON.stringify(w)})`);
  }
}

// ── LINK (pre-id integrity): every drill answer/distractor resolves to a real
//    word in one of the drill's tagged topics. Matches on `c` until wids exist. ─
function wordsInTopicByC(tk, c) {
  const out = [];
  const t = topics[tk];
  if (!t) return out;
  for (const [rk, rv] of Object.entries(t.rounds || {})) {
    for (const w of (rv.words || [])) if (w.c === c) out.push({ rk, w });
  }
  return out;
}
patterns.patterns.forEach((pat, pi) => {
  (pat.drills || []).forEach((d, di) => {
    const where = `pattern[${pi}] "${pat.label}" drill[${di}]`;
    const tags = d.topics || [];
    if (!tags.length) err('link', `${where}: no topics[]`);
    for (const tk of tags) if (!topics[tk]) err('link', `${where}: tagged topic "${tk}" does not exist`);
    const items = [d.answer, ...(d.distractors || [])].filter(Boolean);
    for (const it of items) {
      const hits = tags.flatMap(tk => wordsInTopicByC(tk, it.c).map(h => ({ tk, ...h })));
      if (!hits.length) err('link', `${where}: "${it.c}" not found in tagged topic(s) ${JSON.stringify(tags)}`);
    }
  });
});

// ── ID checks (phase-aware) ──────────────────────────────────────────────────
const anyId = allWords.some(x => 'id' in x.w);
const idIndex = {};   // id -> { tk, rk, w }
if (anyId) {
  // all-or-nothing
  for (const { tk, rk, w } of allWords) {
    if (!('id' in w)) { err('id', `${tk} r${rk}: word "${w.c}" has no id (ids are all-or-nothing once introduced)`); continue; }
    if (!ID_RE.test(w.id)) err('id', `${tk} r${rk}: malformed id "${w.id}"`);
    if (idIndex[w.id]) err('id', `duplicate id "${w.id}" (in ${idIndex[w.id].tk} and ${tk})`);
    else idIndex[w.id] = { tk, rk, w };
  }
  // high-water mark per topic file: any id minted under this file's prefix must
  // be <= the file's _idSeq, and _idSeq must cover the max. Protects append-only.
  for (const [tk, t] of Object.entries(topics)) {
    const owned = allWords.filter(x => 'id' in x.w && idPrefix(x.w.id) === tk).map(x => idNum(x.w.id));
    if (!owned.length) continue;
    const maxN = Math.max(...owned);
    if (typeof t._idSeq !== 'number') {
      err('id', `${tk}: words carry "${tk}-NNN" ids but file has no _idSeq high-water mark`);
    } else if (t._idSeq < maxN) {
      err('id', `${tk}: _idSeq (${t._idSeq}) is below the highest id number in use (${maxN})`);
    }
  }
}

// ── WID checks (phase-aware) ──────────────────────────────────────────────────
const drillItems = [];
patterns.patterns.forEach((pat, pi) =>
  (pat.drills || []).forEach((d, di) => {
    [['answer', d.answer], ...((d.distractors || []).map((x, k) => [`distractor[${k}]`, x]))]
      .forEach(([slot, it]) => { if (it) drillItems.push({ pi, di, label: pat.label, tags: d.topics || [], slot, it }); });
  }));
const anyWid = drillItems.some(x => 'wid' in x.it);
if (anyWid) {
  if (!anyId) err('wid', `drills carry wid but words have no id — mint ids first (Phase 1)`);
  for (const { pi, di, label, tags, slot, it } of drillItems) {
    const where = `pattern[${pi}] "${label}" drill[${di}] ${slot}`;
    if (!('wid' in it)) { err('wid', `${where}: missing wid (wids are all-or-nothing once introduced)`); continue; }
    const ref = idIndex[it.wid];
    if (!ref) { err('wid', `${where}: wid "${it.wid}" does not resolve to any word`); continue; }
    if (!tags.includes(ref.tk)) err('wid', `${where}: wid "${it.wid}" lives in "${ref.tk}", not in tagged topic(s) ${JSON.stringify(tags)}`);
    // Identity anchors must match the referenced word exactly. NOTE: `e` is
    // deliberately NOT checked — a drill's English is authored to read inside its
    // sentence ("I like dogs"), which legitimately differs from the standalone
    // vocab headword ("Dog"). c + j pin identity; e is drill-owned display text.
    for (const f of ['c', 'j']) {
      if (it[f] !== ref.w[f]) err('wid', `${where}: ${f} "${it[f]}" != referenced word's ${f} "${ref.w[f]}" (wid ${it.wid})`);
    }
  }
}

// ── DID checks (phase-aware): once any drill has a `did`, all must; well-formed,
//    globally unique; _didSeq high-water mark covers the max in use. ───────────
const allDrills = [];
patterns.patterns.forEach((pat, pi) => (pat.drills || []).forEach((d, di) => allDrills.push({ pi, di, label: pat.label, d })));
const anyDid = allDrills.some(x => 'did' in x.d);
if (anyDid) {
  const didSeen = {};
  let maxN = 0;
  for (const { pi, di, label, d } of allDrills) {
    const where = `pattern[${pi}] "${label}" drill[${di}]`;
    if (!('did' in d)) { err('did', `${where}: no did (dids are all-or-nothing once introduced)`); continue; }
    if (!/^drill-\d{3,}$/.test(d.did)) err('did', `${where}: malformed did "${d.did}"`);
    if (didSeen[d.did]) err('did', `duplicate did "${d.did}"`);
    else didSeen[d.did] = true;
    const n = parseInt(d.did.slice(d.did.lastIndexOf('-') + 1), 10);
    if (n > maxN) maxN = n;
  }
  if (typeof patterns._didSeq !== 'number') err('did', `patterns.json: drills carry dids but file has no _didSeq high-water mark`);
  else if (patterns._didSeq < maxN) err('did', `patterns.json: _didSeq (${patterns._didSeq}) is below the highest did in use (${maxN})`);
}

// ── SID checks (phase-aware): once any sentence has a `sid`, all must; well-formed,
//    globally unique; per-topic _sidSeq covers the max. ────────────────────────
const allSentences = [];
for (const [tk, t] of Object.entries(topics)) {
  for (const [rk, rv] of Object.entries(t.rounds || {}))
    for (const s of (rv.sentences || [])) allSentences.push({ tk, rk, s, t });
}
const anySid = allSentences.some(x => 'sid' in x.s);
if (anySid) {
  const sidSeen = {};
  const maxByTopic = {};
  for (const { tk, rk, s } of allSentences) {
    if (!('sid' in s)) { err('sid', `${tk} r${rk}: sentence "${s.c}" has no sid (all-or-nothing)`); continue; }
    if (!/^[a-z][a-z0-9]*-t\d+-s\d{2,}$/.test(s.sid)) err('sid', `${tk} r${rk}: malformed sid "${s.sid}"`);
    if (sidSeen[s.sid]) err('sid', `duplicate sid "${s.sid}"`);
    else sidSeen[s.sid] = true;
    const n = parseInt(s.sid.slice(s.sid.lastIndexOf('-') + 1).replace(/\D/g, ''), 10);
    maxByTopic[tk] = Math.max(maxByTopic[tk] || 0, n);
  }
  for (const [tk, maxN] of Object.entries(maxByTopic)) {
    const t = topics[tk];
    if (typeof t._sidSeq !== 'number') err('sid', `${tk}: sentences have sids but no _sidSeq high-water mark`);
    else if (t._sidSeq < maxN) err('sid', `${tk}: _sidSeq (${t._sidSeq}) below highest sid number in use (${maxN})`);
  }
}

// ── AGREEMENT: app.js SPEAK_FINAL_PARTICLES vs data/topics/particles.json ─────
// fuzzyMatch() treats a differing sentence-final particle as free, and needs the
// particle set at runtime — but app.js cannot read a topic file at load time, so
// the set is a literal there. A hand-copied list drifts silently against the data
// it mirrors, which is the root cause of several past defects, so the agreement is
// asserted here instead of trusted.
{
  const APP = path.join(ROOT, 'app.js');
  try {
    const src = fs.readFileSync(APP, 'utf8');
    const m = src.match(/const SPEAK_FINAL_PARTICLES = new Set\(\[([^\]]*)\]\)/);
    if (!m) err('agreement', 'app.js: SPEAK_FINAL_PARTICLES not found — fuzzyMatch\'s free-particle rule may have been removed without updating this check');
    else {
      const inApp = new Set((m[1].match(/'([^']+)'/g) || []).map(x => x.slice(1, -1)));
      const pj = topics['particles'];
      if (!pj) err('agreement', 'data/topics/particles.json missing — cannot verify SPEAK_FINAL_PARTICLES');
      else {
        const inData = new Set(
          Object.values(pj.rounds || {}).flatMap(r => (r.words || []).map(w => w.c)));
        for (const c of inData)
          if (!inApp.has(c)) err('agreement', `particle ${c} is in particles.json but missing from app.js SPEAK_FINAL_PARTICLES`);
        for (const c of inApp)
          if (!inData.has(c)) err('agreement', `particle ${c} is in app.js SPEAK_FINAL_PARTICLES but not in particles.json`);
      }
    }
  } catch (e) { err('agreement', `could not read app.js: ${e.message}`); }
}

// ── Report ────────────────────────────────────────────────────────────────────
const phase = anyWid ? 'Phase 2+ (ids + wids present)' : anyId ? 'Phase 1 (ids present, no wids)' : 'baseline (no ids)';
console.log(`Cantonese data validator — ${phase}`);
console.log(`  topics: ${Object.keys(topics).length}  words: ${allWords.length}  drills: ${patterns.patterns.reduce((n, p) => n + (p.drills || []).length, 0)}  drill-items: ${drillItems.length}`);
if (anyId) console.log(`  ids assigned: ${allWords.filter(x => 'id' in x.w).length}/${allWords.length}`);
if (anyWid) console.log(`  wids assigned: ${drillItems.filter(x => 'wid' in x.it).length}/${drillItems.length}`);
if (anyDid) console.log(`  dids assigned: ${allDrills.filter(x => 'did' in x.d).length}/${allDrills.length}`);
if (anySid) console.log(`  sids assigned: ${allSentences.filter(x => 'sid' in x.s).length}/${allSentences.length}`);

if (!errors.length) { console.log('\n✓ ALL CHECKS PASS'); process.exit(0); }
const byCat = {};
for (const e of errors) (byCat[e.cat] = byCat[e.cat] || []).push(e.msg);
console.log(`\n✗ ${errors.length} ERROR(S):`);
for (const [cat, msgs] of Object.entries(byCat)) {
  console.log(`\n  [${cat}] ${msgs.length}`);
  msgs.slice(0, 40).forEach(m => console.log(`    - ${m}`));
  if (msgs.length > 40) console.log(`    … +${msgs.length - 40} more`);
}
process.exit(1);
