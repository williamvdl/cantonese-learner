#!/usr/bin/env node
/**
 * content-report.js — derives the content inventory in docs/CONTENT.md.
 *
 * WHY THIS EXISTS
 * A corpus inventory typed into a markdown file is stale the moment a word is
 * authored, and a stale count is worse than no count because it reads as
 * authoritative. This script is the source; CONTENT.md's "What exists today"
 * tables are its output, pasted in and dated. Re-run it and re-paste rather
 * than editing the tables by hand.
 *
 *   node tools/content-report.js            human-readable tables
 *   node tools/content-report.js --md       markdown tables, ready to paste
 *   node tools/content-report.js --check    exit 1 if a structural invariant fails
 *
 * The --check mode is the standing-check half. It asserts the invariants the
 * content model rests on, in the spirit of tier-harness.js: a fact the docs
 * depend on gets a check, not a comment.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'data');
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));

const MD = process.argv.includes('--md');
const CHECK = process.argv.includes('--check');

// The connective set taught in the connectives lesson (CONTENT_SPEC_TIER2 §7).
// Used to measure the "half the sentences carry a connective or two-clause
// structure" target. It is a substring test, so it under-reports two-clause
// sentences built without one of these — treat the figure as a floor.
const CONNECTIVES = [
  '因為', '所以', '如果', '雖然', '但係', '不過', '而且', '仲', '然後', '跟住',
  '之後', '之前', '或者', '不如', '同埋', '反而', '結果', '即係', '為咗', '除咗'
];

// Documented, expected findings. A check that always reports the same benign
// hits trains you to skim its output — the lesson STATUS.md records about
// standing check 3. Each entry states why it is expected and what removes it;
// delete the entry when that happens, and the check starts failing again.
// Reported under "expected" rather than hidden, so nothing goes silent.
const EXPECTED = [
  // Cleared when I-2 Sentence Grammar is built and staged (CONTENT.md §5.1).
  'orphan lesson: intermediate lists numbers r2 in lessons[] but no stage contains it',
  'stage numbering gap: intermediate jumps s1 -> s3'
];

// ── Load ─────────────────────────────────────────────────────────────────────
const index = read(path.join(DATA, 'topics_index.json')).topics;
const cats = read(path.join(DATA, 'categories.json'));
const paths = read(path.join(DATA, 'learning_paths.json')).paths;
const convos = read(path.join(DATA, 'path_convos.json')).convos;

const topicFiles = fs.readdirSync(path.join(DATA, 'topics'))
  .filter(f => f.endsWith('.json')).sort();

const topics = {};
topicFiles.forEach(f => {
  topics[f.replace(/\.json$/, '')] = read(path.join(DATA, 'topics', f));
});

// ── Per-topic-tier rollup ────────────────────────────────────────────────────
const tiers = [];
Object.entries(topics).forEach(([key, t]) => {
  Object.keys(t.rounds).sort((a, b) => +a - +b).forEach(rk => {
    const r = t.rounds[rk];
    const sents = r.sentences || [];
    const convo = r.convo || null;
    tiers.push({
      key,
      label: t.meta.label,
      tier: +rk,
      words: (r.words || []).length,
      sentences: sents.length,
      notes: sents.filter(s => s.note).length,
      breakdowns: sents.filter(s => s.bd).length,
      tierNote: !!r.note,
      convoLines: convo ? (convo.lines || []).length : 0,
      convoTitle: convo ? (convo.title || '') : null
    });
  });
});

const sum = (f) => tiers.reduce((n, t) => n + f(t), 0);

const totals = {
  topics: Object.keys(topics).length,
  topicTiers: tiers.length,
  words: sum(t => t.words),
  sentences: sum(t => t.sentences),
  notes: sum(t => t.notes),
  breakdowns: sum(t => t.breakdowns),
  topicConvos: tiers.filter(t => t.convoLines > 0).length,
  topicConvoLines: sum(t => t.convoLines),
  cpConvos: Object.keys(convos).length,
  cpConvoLines: Object.values(convos).reduce((n, c) => n + (c.lines || []).length, 0)
};

// ── Path rollup ──────────────────────────────────────────────────────────────
const pathRows = paths.map(p => {
  const stages = p.stages || [];
  const stageTopics = new Set();
  stages.forEach(s => (s.topics || []).forEach(k => stageTopics.add(k)));
  return {
    key: p.key,
    label: p.label,
    lessons: (p.lessons || []).length,
    stages: stages.length,
    checkpoints: stages.filter(s => s.checkpoint).length,
    cpConvos: stages.filter(s => s.checkpoint && convos[s.checkpoint.convo]).length,
    comingSoon: !!p.comingSoon,
    stageTopics
  };
});

// ── Invariants ───────────────────────────────────────────────────────────────
const problems = [];

// 1. Every lesson in a path's `lessons` array belongs to one of its stages.
//    An orphan lesson renders in the timeline with no stage context.
paths.forEach(p => {
  const inStages = new Set();
  (p.stages || []).forEach(s => (s.topics || []).forEach(k => inStages.add(k)));
  (p.lessons || []).forEach(l => {
    if (!inStages.has(l.topic)) {
      problems.push(`orphan lesson: ${p.key} lists ${l.topic} r${l.round} in lessons[] but no stage contains it`);
    }
  });
});

// 2. Every (topic, tier) pair belongs to at most one path. The tier ladder's
//    cross-reference names a path; two owners makes it name the wrong one.
//    This duplicates tier-harness.js deliberately — same invariant, and a
//    content author is more likely to run this script than that one.
const owner = {};
paths.forEach(p => (p.lessons || []).forEach(l => {
  const k = `${l.topic}:${l.round}`;
  if (owner[k] && owner[k] !== p.key) problems.push(`tier owned twice: ${k} in both ${owner[k]} and ${p.key}`);
  owner[k] = p.key;
}));

// 3. Every lesson's (topic, tier) actually exists in the topic file.
paths.forEach(p => (p.lessons || []).forEach(l => {
  const t = topics[l.topic];
  if (!t) problems.push(`missing topic file: ${p.key} references ${l.topic}`);
  else if (!t.rounds[String(l.round)]) problems.push(`missing tier: ${p.key} references ${l.topic} r${l.round}`);
}));

// 4. Every checkpoint that names a convo has one, and carries an id.
paths.forEach(p => (p.stages || []).forEach(s => {
  const cp = s.checkpoint;
  if (!cp) { problems.push(`stage without checkpoint: ${s.id}`); return; }
  if (!cp.id) problems.push(`checkpoint without id: ${s.id}`);
  if (cp.convo && !convos[cp.convo]) problems.push(`checkpoint names a missing convo: ${s.id} -> ${cp.convo}`);
}));

// 5. Stage numbering is contiguous. A gap is either a reserved slot or an
//    accident, and the two look identical in the data.
paths.forEach(p => {
  const nums = (p.stages || []).map(s => {
    const m = /-s(\d+)$/.exec(s.id);
    return m ? +m[1] : null;
  }).filter(n => n !== null).sort((a, b) => a - b);
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] !== nums[i - 1] + 1) problems.push(`stage numbering gap: ${p.key} jumps s${nums[i - 1]} -> s${nums[i]}`);
  }
});

// 6. Every topic is mapped to a category, and every mapping points at a topic.
Object.keys(topics).forEach(k => {
  if (!cats.topic_map[k]) problems.push(`topic not mapped to a category: ${k}`);
});
Object.keys(cats.topic_map).forEach(k => {
  if (!topics[k]) problems.push(`category map references a missing topic: ${k}`);
});

// 7. topics_index.json's wordCounts match the topic files it summarises.
index.forEach(e => {
  const t = topics[e.key];
  if (!t) { problems.push(`index references a missing topic: ${e.key}`); return; }
  Object.entries(e.wordCounts || {}).forEach(([rk, n]) => {
    const actual = (t.rounds[rk]?.words || []).length;
    if (actual !== n) problems.push(`index drift: ${e.key} r${rk} says ${n} words, file has ${actual}`);
  });
  const fileTiers = Object.keys(t.rounds).map(Number).sort();
  const idxTiers = (e.rounds || []).slice().sort();
  if (fileTiers.join(',') !== idxTiers.join(',')) {
    problems.push(`index drift: ${e.key} lists tiers [${idxTiers}], file has [${fileTiers}]`);
  }
});

// 8. Every topic file is in sw.js's TOPIC_KEYS precache list. A topic missing
//    from it still works online — the runtime handler caches it on first
//    visit — so the omission is invisible on a connected device and only shows
//    as a broken lesson offline from a fresh install. This is the one content
//    invariant that lives in a code file rather than a data file, which is
//    exactly why it gets missed when a topic is authored.
try {
  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  const block = /TOPIC_KEYS\s*=\s*\[([\s\S]*?)\]/.exec(sw);
  if (!block) problems.push('sw.js: TOPIC_KEYS list not found — precache check could not run');
  else {
    const listed = new Set((block[1].match(/'([a-z0-9_-]+)'/g) || []).map(s => s.slice(1, -1)));
    Object.keys(topics).forEach(k => {
      if (!listed.has(k)) problems.push(`sw.js precache missing: ${k} — the lesson will not work offline from a fresh install`);
    });
    listed.forEach(k => {
      if (!topics[k]) problems.push(`sw.js precache references a missing topic file: ${k}`);
    });
  }
} catch (e) { problems.push(`sw.js could not be read: ${e.message}`); }

// ── Output ───────────────────────────────────────────────────────────────────
const pct = (n, d) => d ? Math.round((n / d) * 100) + '%' : '—';

const expected = problems.filter(p => EXPECTED.includes(p));
const real = problems.filter(p => !EXPECTED.includes(p));

if (CHECK) {
  expected.forEach(p => console.log('  · expected: ' + p));
  if (real.length) {
    console.log(`content-report --check: ${real.length} issue(s)`);
    real.forEach(p => console.log('  ✗ ' + p));
    process.exit(1);
  }
  console.log('content-report --check: all content invariants pass');
  process.exit(0);
}

const row = (cells) => MD ? '| ' + cells.join(' | ') + ' |' : cells.join('  ');
const sep = (n) => MD ? '|' + Array(n).fill('---').join('|') + '|' : '';

console.log(MD ? '### Corpus totals\n' : '\n=== CORPUS TOTALS ===');
console.log(row(['Measure', 'Count']));
console.log(sep(2));
[
  ['Topics', totals.topics],
  ['Topic-tiers (a topic at one tier = one lesson)', totals.topicTiers],
  ['Words', totals.words],
  ['Sentences', totals.sentences],
  ['Sentences with a teaching note', `${totals.notes} (${pct(totals.notes, totals.sentences)})`],
  ['Sentences with a word breakdown', `${totals.breakdowns} (${pct(totals.breakdowns, totals.sentences)})`],
  ['Topic conversations', totals.topicConvos],
  ['Topic conversation lines', totals.topicConvoLines],
  ['Checkpoint conversations', totals.cpConvos],
  ['Checkpoint conversation lines', totals.cpConvoLines]
].forEach(r => console.log(row(r.map(String))));

console.log(MD ? '\n### Paths\n' : '\n=== PATHS ===');
console.log(row(['Path', 'Stages', 'Lessons', 'Checkpoints', 'Checkpoint convos']));
console.log(sep(5));
pathRows.forEach(p => console.log(row([
  p.label + (p.comingSoon ? ' (shell only)' : ''),
  String(p.stages), String(p.lessons), String(p.checkpoints), String(p.cpConvos)
])));

console.log(MD ? '\n### Topic-tiers\n' : '\n=== TOPIC-TIERS ===');
console.log(row(['Topic', 'Label', 'Tier', 'Words', 'Sents', 'Notes', 'Convo lines']));
console.log(sep(7));
tiers.forEach(t => console.log(row([
  t.key, t.label, String(t.tier), String(t.words), String(t.sentences),
  `${t.notes}/${t.sentences}`, String(t.convoLines)
])));

// Tier-2 spec compliance (docs/CONTENT_SPEC_TIER2.md). Reported, not enforced —
// a round that misses a target is content debt, not a data defect, and only a
// human can say whether a 7th sentence would earn its place.
console.log(MD ? '\n### Tier-2 spec compliance\n' : '\n=== TIER-2 SPEC COMPLIANCE ===');
console.log(row(['Topic', 'Words 8–12', 'Sents 7–8', 'Connective ≥50%', 'Avg len 8–16', 'Convo 8–10', 'Notes', 'Verdict']));
console.log(sep(8));
const t2 = tiers.filter(t => t.tier === 2);
t2.forEach(t => {
  const src = topics[t.key].rounds['2'];
  const ss = src.sentences || [];
  const conn = ss.filter(s => CONNECTIVES.some(c => s.c.includes(c))).length;
  const avg = ss.length ? ss.reduce((n, s) => n + s.c.length, 0) / ss.length : 0;
  const ok = [
    t.words >= 8 && t.words <= 12,
    t.sentences >= 7 && t.sentences <= 8,
    ss.length ? conn / ss.length >= 0.5 : false,
    avg >= 8 && avg <= 16,
    t.convoLines >= 8 && t.convoLines <= 10,
    t.notes > 0
  ];
  const mark = b => b ? '✓' : '✗';
  console.log(row([
    t.key,
    `${t.words} ${mark(ok[0])}`,
    `${t.sentences} ${mark(ok[1])}`,
    `${Math.round(100 * conn / (ss.length || 1))}% ${mark(ok[2])}`,
    `${avg.toFixed(1)} ${mark(ok[3])}`,
    `${t.convoLines} ${mark(ok[4])}`,
    `${t.notes}/${t.sentences} ${mark(ok[5])}`,
    // One miss is usually the connective floor under-reporting a two-clause
    // sentence built without a listed word; two or more is a real pre-spec round.
    ok.every(Boolean) ? 'spec v2' : (ok.filter(b => !b).length === 1 ? 'review' : 'PRE-SPEC')
  ]));
});

// Fill-the-Gap coverage. A user turn without `opts` cannot be a gap line, and
// render.js hides the whole activity for a conversation with none. Not a
// defect — the guard is deliberate — but it is a silently missing activity,
// which is worth a number rather than a memory.
const noOpts = [];
tiers.forEach(t => {
  const cv = topics[t.key].rounds[String(t.tier)].convo;
  if (!cv) return;
  const u = (cv.lines || []).filter(l => l.u);
  if (u.length && !u.some(l => Array.isArray(l.opts) && l.opts.length)) noOpts.push(`${t.key} tier ${t.tier}`);
});
const cpNoOpts = Object.entries(convos).filter(([, c]) => {
  const u = (c.lines || []).filter(l => l.u);
  return u.length && !u.some(l => Array.isArray(l.opts) && l.opts.length);
}).map(([k]) => k);
console.log(MD ? '\n### Fill-the-Gap coverage\n' : '\n=== FILL-THE-GAP COVERAGE ===');
console.log(row(['Conversation set', 'With opts', 'Without opts']));
console.log(sep(3));
console.log(row(['Topic conversations', String(tiers.length - noOpts.length), String(noOpts.length)]));
console.log(row(['Checkpoint conversations', String(totals.cpConvos - cpNoOpts.length), String(cpNoOpts.length)]));
if (noOpts.length) console.log((MD ? '\n' : '') + 'Topic, no opts: ' + noOpts.join(', '));
if (cpNoOpts.length) console.log('Checkpoint, no opts: ' + cpNoOpts.join(', '));

const gaps = tiers.filter(t => t.notes < t.sentences)
  .sort((a, b) => (a.notes / a.sentences) - (b.notes / b.sentences));
console.log(MD ? '\n### Note-coverage gaps\n' : '\n=== NOTE-COVERAGE GAPS ===');
console.log(row(['Topic', 'Tier', 'Notes', 'Coverage']));
console.log(sep(4));
gaps.forEach(t => console.log(row([t.key, String(t.tier), `${t.notes}/${t.sentences}`, pct(t.notes, t.sentences)])));

console.log("\n" + (real.length
  ? `Invariants: ${real.length} issue(s)\n` + real.map(p => '  ✗ ' + p).join('\n')
    + (expected.length ? '\n' + expected.map(p => '  · expected: ' + p).join('\n') : '')
  : 'Invariants: all pass'));
