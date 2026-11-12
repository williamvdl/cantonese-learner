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
 *   node tools/content-report.js --worklist  what each lesson needs to meet the
 *                                            lesson rules (add --md to paste)
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

// ── Lesson rules ─────────────────────────────────────────────────────────────
// The countable authoring rules every lesson is held to, tier 1 and tier 2
// alike. Decided by William 2026-11-11. The canonical statement is
// docs/CONTENT.md §3, *Lesson rules*; the reasoning and the measurements behind
// each value are in docs/PROPOSAL-content-playbook.md §4.
//
//   SENTENCES   at least 8 for a lesson of up to 12 words, at least 10 for 13+.
//               A minimum, not a target: more is fine where the vocabulary
//               needs it. Above 12 (or 14 for 13+) the lesson is marked "long"
//               — a prompt to confirm the length is deliberate, never a fail.
//   WORD USE    up to 12 words: every word appears in a sentence.
//               13+ words: every word appears in a sentence or the conversation.
//   ON TOPIC    every sentence contains at least one of the lesson's words.
//               For a tier-2 round the topic's tier-1 words count too: putting
//               known words into longer sentences is what tier 2 is for
//               (CONTENT_SPEC_TIER2 §0), so such a sentence is on topic.
//   CONVO       up to 12 words: the conversation uses at least 50% of them.
//               13+ words: at least 40%, in a conversation of at least 8 lines.
//
// "Appears" is a substring test on the word's written form, one line at a
// time. Two things follow, and both are stated rather than hidden:
//   · A one-character word can match inside a longer, unrelated word, so a
//     pass on a one-character word is a ceiling, not a proof.
//   · A two-character verb-object word said with something between its halves
//     — 食咗飯 (sik6 zo2 faan6) for 食飯 (sik6 faan6) — is not a substring.
//     Those are classed SPLIT: listed for a reader, and counted as not yet
//     used, because resemblance is not use until someone has looked. Once
//     someone has, the use is declared in SPLIT_ACCEPTED below.
const WORD_PUNCT = '\\s。！？，、!?.,';
const trimPunct = s => s.replace(new RegExp(`^[${WORD_PUNCT}…]+|[${WORD_PUNCT}…]+$`, 'gu'), '');
const isHan = ch => /[㐀-鿿豈-﫿]/u.test(ch);
const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// 'used' | 'split' | 'unused' — for one word against one line of Chinese.
function wordUse(word, line) {
  const w = trimPunct(word || '');
  if (!w) return 'unused';
  if (w.includes('…')) {
    // A gapped pattern — 因為…所以 (jan1 wai6…so2 ji5): every part, in order.
    let from = 0;
    for (const part of w.split('…').map(trimPunct).filter(Boolean)) {
      const at = line.indexOf(part, from);
      if (at < 0) return 'unused';
      from = at + part.length;
    }
    return 'used';
  }
  if (line.includes(w)) return 'used';
  const ch = [...w];
  if (ch.length === 2 && ch.every(isHan)) {
    const split = new RegExp(`${escRe(ch[0])}[^${WORD_PUNCT}…]{1,2}${escRe(ch[1])}`, 'u');
    if (split.test(line)) return 'split';
  }
  return 'unused';
}
// Split uses a reader has confirmed are the word itself. Keyed on the lesson,
// the word and the exact line, so editing the line voids the acceptance and
// the use is read again. An entry whose line no longer exists fails --check.
const SPLIT_ACCEPTED = [
  // 排隊 (paai4 deoi2) "queue", split by 幾耐 (gei2 noi6) "how long". 2026-11-11.
  'attractions:1|排隊|要排幾耐隊？',
  // 睇戲 (tai2 hei3) "watch a film", split by 咩 (me1) "what". 2026-11-11.
  'hobbies:1|睇戲|你鍾意睇咩戲？'
];
const splitSeen = new Set();
const RANK = { used: 2, split: 1, unused: 0 };
// wordUse, with a confirmed split promoted to 'used'.
function useIn(id, word, line) {
  const u = wordUse(word, line);
  if (u !== 'split') return u;
  const k = `${id}|${trimPunct(word)}|${line}`;
  if (!SPLIT_ACCEPTED.includes(k)) return 'split';
  splitSeen.add(k);
  return 'used';
}
const bestUse = (id, word, lines) => lines.reduce((best, l) => {
  const u = useIn(id, word, l);
  return RANK[u] > RANK[best] ? u : best;
}, 'unused');

// Self-test: planted right and wrong forms, so a loosened matcher fails on its
// own fixtures instead of passing an empty scan (the pattern jyutping-check.js
// uses for the same reason).
[
  ['飯',        '我想食飯。',            'used'],
  ['幾錢？',    '呢個幾錢呀？',          'used'],    // trailing punctuation on the word
  ['我叫…',     '我叫阿明。',            'used'],    // open-ended pattern
  ['因為…所以', '因為落雨，所以唔去。',  'used'],    // gapped, in order
  ['因為…所以', '所以唔去，因為落雨。',  'unused'],  // gapped, wrong order
  ['食飯',      '我食咗飯喇。',          'split'],   // verb-object, split
  ['食飯',      '我食，飯好味。',        'unused'],  // punctuation between is not a split
  ['地鐵',      '我搭巴士去。',          'unused'],
  ['',          '我搭巴士去。',          'unused']
].forEach(([w, l, want]) => {
  const got = wordUse(w, l);
  if (got !== want) {
    console.error(`content-report self-test FAILED: wordUse('${w}', '${l}') = ${got}, expected ${want}`);
    process.exit(2);
  }
});

const lessonRules = tiers.map(t => {
  const r = topics[t.key].rounds[String(t.tier)];
  const words = r.words || [];
  const sents = (r.sentences || []).map(s => s.c);
  const lines = ((r.convo || {}).lines || []).map(l => l.c);
  const big = words.length >= 13;
  const minSents = big ? 10 : 8;
  const id = `${t.key}:${t.tier}`;
  // On-topic words: this round's, plus the topic's lower tiers.
  const topicWords = Object.keys(topics[t.key].rounds).filter(rk => +rk <= t.tier)
    .flatMap(rk => topics[t.key].rounds[rk].words || []);

  const inSents = words.map(w => bestUse(id, w.c, sents));
  const inConvo = words.map(w => bestUse(id, w.c, lines));
  // Up to 12 words a word must be in a sentence; 13+ the conversation counts too.
  const use = words.map((w, i) => big && RANK[inConvo[i]] > RANK[inSents[i]] ? inConvo[i] : inSents[i]);
  const unused = words.filter((w, i) => use[i] === 'unused');
  const split = words.filter((w, i) => use[i] === 'split');
  const offTopic = (r.sentences || []).filter(s => !topicWords.some(w => useIn(id, w.c, s.c) === 'used'));
  const convoUsed = inConvo.filter(u => u === 'used').length;
  const convoNeed = Math.ceil(words.length * (big ? 0.4 : 0.5));

  const fails = [];
  if (sents.length < minSents) fails.push('sentences');
  if (unused.length || split.length) fails.push('word use');
  if (offTopic.length) fails.push('on topic');
  if (convoUsed < convoNeed) fails.push('convo share');
  if (big && lines.length < 8) fails.push('convo length');

  return {
    id, key: t.key, label: t.label, tier: t.tier, big,
    words: words.length, sentences: sents.length, minSents,
    short: Math.max(0, minSents - sents.length),
    long: sents.length > (big ? 14 : 12),
    unused, split, offTopic, convoUsed, convoNeed, convoLines: lines.length, fails
  };
});

// Lessons that do not meet the lesson rules yet — the tier-1 retrofit's
// worklist, plus the tier-2 rounds it catches. Measured at v166, 2026-11-11.
//
// This is a ratchet, not an excuse list. --check FAILS for:
//   · any lesson NOT listed here that breaks a rule — so a new lesson, or one
//     already fixed, is held to the rules from the day it lands;
//   · any lesson listed here that now PASSES — delete its entry in the same
//     commit as the fix, and from then on it is held like any other.
// Listed lessons are reported under "retrofit pending" rather than hidden.
// The list only ever gets shorter. When it is empty, delete it.
const RETROFIT_PENDING = [
  'adjectives:1', 'animals:1', 'attractions:1', 'body:1', 'classifiers:1',
  'clothing:1', 'colors:1', 'comparisons:1', 'cooking:1', 'directions:1',
  'drinks:1', 'emergencies:1', 'family:1', 'feelings:1', 'feelings:2',
  'food:1', 'friends:1', 'fruitveg:1', 'greetings:1', 'greetings:2',
  'hobbies:1', 'home:1', 'hotels:1', 'location:1', 'meatseafood:1',
  'modals:1', 'money:1', 'numbers:1', 'numbers:2', 'particles:1',
  'phrases:1', 'pronouns:1', 'questions:1', 'restaurant:1', 'school:1',
  'shopping:1', 'sports:1', 'tech:1', 'tense:1', 'time:1',
  'transport:1', 'weather:1', 'work:1', 'yesno:1'
];
lessonRules.forEach(l => {
  const pending = RETROFIT_PENDING.includes(l.id);
  if (l.fails.length && !pending) problems.push(`lesson rules: ${l.id} fails ${l.fails.join(', ')}`);
  if (!l.fails.length && pending) problems.push(`lesson rules: ${l.id} now passes — remove it from RETROFIT_PENDING`);
});
RETROFIT_PENDING.forEach(id => {
  if (!lessonRules.some(l => l.id === id)) problems.push(`lesson rules: RETROFIT_PENDING names a lesson that does not exist: ${id}`);
});
SPLIT_ACCEPTED.forEach(k => {
  if (!splitSeen.has(k)) problems.push(`lesson rules: SPLIT_ACCEPTED entry matches no line any more — remove or re-read it: ${k}`);
});
const pendingRules = lessonRules.filter(l => l.fails.length && RETROFIT_PENDING.includes(l.id));

// ── Tier-1 shape ─────────────────────────────────────────────────────────────
// How simple tier 1 is, measured against the guide in docs/CONTENT_SPEC_TIER1.md
// §4 and §5. A GUIDE WITH EXCEPTIONS (William, 2026-11-11), so this is
// reported and never enforced: nothing here can fail --check.
//
//   SENTENCES   aim for up to 8 Chinese characters. 9–12 is an allowed
//               exception when the sentence carries two of the lesson's words;
//               9–12 without that is listed as "long, no second word". Over 12
//               is flagged for a rewrite or a split.
//   CHAT LINES  aim for up to 9; over 12 is flagged.
//   CONNECTIVES none in a sentence; in a chat, at most two lines — a chat with
//               more is listed.
//
// Length is counted in Chinese characters only — punctuation and Latin letters
// are not length a learner has to say in Cantonese. The tier-2 table's
// "Avg len" predates this and counts every character including punctuation, so
// the two figures are not comparable; neither is wrong for its own target.
const hanLen = s => [...s].filter(isHan).length;
const SHAPE = { sentAim: 8, sentMax: 12, lineAim: 9, lineMax: 12 };
// Lessons that break the tier-1 shape on purpose (CONTENT.md §3).
const SHAPE_EXEMPT = ['connectives'];
const shape = {
  lessons: 0, sents: 0, lines: 0,
  sentInAim: 0, sentTwoWords: [], sentNoCause: [], sentOver: [], sentConn: [],
  lineInAim: 0, lineOverAim: 0, lineOver: [], lineConn: 0, convoConnOver: []
};
tiers.filter(t => t.tier === 1 && !SHAPE_EXEMPT.includes(t.key)).forEach(t => {
  const r = topics[t.key].rounds['1'];
  const id = `${t.key}:1`;
  const words = r.words || [];
  shape.lessons++;
  (r.sentences || []).forEach(sn => {
    const n = hanLen(sn.c);
    const hit = { key: t.key, n, c: sn.c, j: sn.j };
    shape.sents++;
    if (CONNECTIVES.some(c => sn.c.includes(c))) shape.sentConn.push(hit);
    if (n <= SHAPE.sentAim) { shape.sentInAim++; return; }
    if (n > SHAPE.sentMax) { shape.sentOver.push(hit); return; }
    const lessonWords = words.filter(w => useIn(id, w.c, sn.c) === 'used').length;
    (lessonWords >= 2 ? shape.sentTwoWords : shape.sentNoCause).push(hit);
  });
  let conn = 0;
  ((r.convo || {}).lines || []).forEach(l => {
    const n = hanLen(l.c);
    shape.lines++;
    if (CONNECTIVES.some(c => l.c.includes(c))) { shape.lineConn++; conn++; }
    if (n <= SHAPE.lineAim) shape.lineInAim++;
    else if (n > SHAPE.lineMax) shape.lineOver.push({ key: t.key, n, c: l.c, j: l.j });
    else shape.lineOverAim++;
  });
  if (conn > 2) shape.convoConnOver.push({ key: t.key, conn });
});

// ── Output ───────────────────────────────────────────────────────────────────
const pct = (n, d) => d ? Math.round((n / d) * 100) + '%' : '—';

const expected = problems.filter(p => EXPECTED.includes(p));
const real = problems.filter(p => !EXPECTED.includes(p));

// --worklist: what each lesson still needs to meet the lesson rules, the
// lessons with the most unused words first. Add --md for a pasteable document.
if (process.argv.includes('--worklist')) {
  const todo = lessonRules.filter(l => l.fails.length)
    .sort((a, b) => (b.unused.length + b.split.length) - (a.unused.length + a.split.length) || b.short - a.short);
  const cj = w => `${trimPunct(w.c)} (${w.j})`;
  const H = (s) => console.log(MD ? `\n### ${s}\n` : `\n── ${s}`);
  console.log(`${todo.length} of ${lessonRules.length} lessons do not meet the lesson rules. ` +
    `Sentences short: ${todo.reduce((n, l) => n + l.short, 0)}. ` +
    `Words not yet used: ${todo.reduce((n, l) => n + l.unused.length + l.split.length, 0)}.`);
  todo.forEach(l => {
    H(`${l.label}${l.tier > 1 ? ' — tier ' + l.tier : ''} (${l.id}) · ${l.words} words`);
    const out = [];
    out.push(`Sentences: ${l.sentences} of ${l.minSents} minimum` + (l.short ? ` — **${l.short} short**` : ''));
    if (l.unused.length) out.push(`Words not used in ${l.big ? 'a sentence or the conversation' : 'a sentence'} (${l.unused.length}): ${l.unused.map(cj).join(', ')}`);
    if (l.split.length) out.push(`Possibly used split — read and decide (${l.split.length}): ${l.split.map(cj).join(', ')}`);
    if (l.offTopic.length) out.push(`Sentences with none of the lesson's words (${l.offTopic.length}): ${l.offTopic.map(s => `${s.c} (${s.j})`).join(' ')}`);
    out.push(`Conversation: ${l.convoUsed} of the ${l.convoNeed} words needed` + (l.convoUsed < l.convoNeed ? ` — **${l.convoNeed - l.convoUsed} short**` : '') +
      `, ${l.convoLines} lines` + (l.big && l.convoLines < 8 ? ' — **needs 8**' : ''));
    out.forEach(s => console.log((MD ? '- ' : '   ') + (MD ? s : s.replace(/\*\*/g, ''))));
  });
  process.exit(0);
}

if (CHECK) {
  expected.forEach(p => console.log('  · expected: ' + p));
  if (pendingRules.length) console.log(`  · retrofit pending: ${pendingRules.length} of ${lessonRules.length} lessons do not meet the lesson rules yet (--worklist lists them)`);
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
console.log(row(['Topic', 'Words 8–12', 'Sents ≥8', 'Connective ≥50%', 'Avg len 8–16', 'Convo 8–10', 'Notes', 'Verdict']));
console.log(sep(8));
const t2 = tiers.filter(t => t.tier === 2);
t2.forEach(t => {
  const src = topics[t.key].rounds['2'];
  const ss = src.sentences || [];
  const conn = ss.filter(s => CONNECTIVES.some(c => s.c.includes(c))).length;
  const avg = ss.length ? ss.reduce((n, s) => n + s.c.length, 0) / ss.length : 0;
  const ok = [
    t.words >= 8 && t.words <= 12,
    // The lesson-rules minimum (8 or more since 2026-11-11, was 7–8) — read
    // from lessonRules so the two tables cannot disagree about it.
    lessonRules.find(l => l.id === `${t.key}:2`).short === 0,
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

// Lesson rules — one row per lesson. ✗ marks a rule the lesson does not meet;
// --worklist says exactly what is missing.
console.log(MD ? '\n### Lesson rules\n' : '\n=== LESSON RULES ===');
console.log(row(['Topic', 'Tier', 'Words', 'Sentences (min)', 'Words unused', 'Off-topic sents', 'Convo words (need)', 'Convo lines', 'Verdict']));
console.log(sep(9));
{
  const mark = b => b ? '✓' : '✗';
  lessonRules.forEach(l => console.log(row([
    l.key, String(l.tier), String(l.words),
    `${l.sentences} (${l.minSents}) ${mark(!l.short)}`,
    `${l.unused.length + l.split.length} ${mark(!(l.unused.length + l.split.length))}`,
    `${l.offTopic.length} ${mark(!l.offTopic.length)}`,
    `${l.convoUsed} (${l.convoNeed}) ${mark(l.convoUsed >= l.convoNeed)}`,
    l.big ? `${l.convoLines} (8) ${mark(l.convoLines >= 8)}` : String(l.convoLines),
    (l.fails.length ? 'retrofit' : 'meets rules') + (l.long ? ' · long' : '')
  ])));
  const meets = lessonRules.filter(l => !l.fails.length).length;
  console.log((MD ? '\n' : '') + `${meets} of ${lessonRules.length} lessons meet every rule. ` +
    `Sentences short: ${lessonRules.reduce((n, l) => n + l.short, 0)}. ` +
    `Words not yet used: ${lessonRules.reduce((n, l) => n + l.unused.length + l.split.length, 0)} ` +
    `(of which possibly split: ${lessonRules.reduce((n, l) => n + l.split.length, 0)}).`);
}

// Tier-1 shape — the simplicity guide. Reported only; see the block that
// computes `shape` for what each row means.
console.log(MD ? '\n### Tier-1 shape\n' : '\n=== TIER-1 SHAPE ===');
console.log(row(['Measure', 'Count']));
console.log(sep(2));
[
  ['Tier-1 lessons measured (connectives exempt)', shape.lessons],
  [`Sentences of up to ${SHAPE.sentAim} characters`, `${shape.sentInAim} of ${shape.sents} (${pct(shape.sentInAim, shape.sents)})`],
  [`Sentences of ${SHAPE.sentAim + 1}–${SHAPE.sentMax}, carrying two lesson words (allowed)`, shape.sentTwoWords.length],
  [`Sentences of ${SHAPE.sentAim + 1}–${SHAPE.sentMax}, no second lesson word (listed)`, shape.sentNoCause.length],
  [`Sentences over ${SHAPE.sentMax} (flagged)`, shape.sentOver.length],
  ['Sentences carrying a listed connective', shape.sentConn.length],
  [`Chat lines of up to ${SHAPE.lineAim} characters`, `${shape.lineInAim} of ${shape.lines} (${pct(shape.lineInAim, shape.lines)})`],
  [`Chat lines of ${SHAPE.lineAim + 1}–${SHAPE.lineMax}`, shape.lineOverAim],
  [`Chat lines over ${SHAPE.lineMax} (flagged)`, shape.lineOver.length],
  ['Chat lines carrying a listed connective', shape.lineConn],
  ['Chats with a connective in more than two lines (listed)', shape.convoConnOver.length]
].forEach(r => console.log(row(r.map(String))));
{
  const list = (title, hits) => {
    if (!hits.length) return;
    console.log((MD ? '\n' : '') + title);
    hits.forEach(h => console.log(`${MD ? '- ' : '   '}${h.key} · ${h.n} · ${h.c} (${h.j})`));
  };
  list('Sentences over the flag line:', shape.sentOver);
  list('Sentences over the aim with no second lesson word:', shape.sentNoCause);
  list('Sentences carrying a connective:', shape.sentConn);
  list('Chat lines over the flag line:', shape.lineOver);
  if (shape.convoConnOver.length) {
    console.log((MD ? '\n' : '') + 'Chats with a connective in more than two lines:');
    shape.convoConnOver.forEach(h => console.log(`${MD ? '- ' : '   '}${h.key} · ${h.conn} lines`));
  }
}

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
