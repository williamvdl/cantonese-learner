// tools/tier-harness.js — standing check for the tier ladder (DES-28/29, v121).
//
// Why this exists: the ladder rests on a premise about the DATA, not the code —
// that every (topic, tier) pair belongs to exactly one path, and that no topic
// appears twice in one path. That held across all 52 path lessons when the
// ladder was designed, and pathOwningTier()'s single find() is only correct
// while it keeps holding. Authoring a topic into two paths would not break any
// other check; it would quietly make the cross-reference name the wrong path.
// So this harness asserts the premise as well as the rendering.
//
// It also simulates a three-tier topic, because none exists yet and the middle
// rung is the state the design was chosen for. Run: node tools/tier-harness.js
//
// The functions under test are lifted verbatim from app.js / render.js by name
// rather than copied, so this cannot drift from what ships.

const ROOT = __dirname + '/../';
const fs = require('fs');
const J = p => JSON.parse(fs.readFileSync(p, 'utf8'));

const idx   = J(ROOT + 'data/topics_index.json').topics;
const paths = J(ROOT + 'data/learning_paths.json').paths;

const store = {
  paths,
  indexEntry: k => idx.find(t => t.key === k) || null,
  availableRounds: k => (idx.find(t => t.key === k)?.rounds || [1]).slice(),
};
const state = { topic: 'greetings', currentRound: 1, fromPath: false };
const getAvailableRounds = t => store.availableRounds(t);
const getRoundWords = (t, r) => new Array(store.indexEntry(t)?.wordCounts?.[String(r)] ?? 0);
const icon = () => '<svg/>';

// ── the functions under test, lifted verbatim from the delivered files ──
const src = fs.readFileSync(ROOT + 'app.js', 'utf8') + '\n' + fs.readFileSync(ROOT + 'render.js', 'utf8');
const grab = name => {
  const i = src.indexOf(`function ${name}(`);
  if (i < 0) throw new Error('not found: ' + name);
  let d = 0, j = src.indexOf('{', i);
  for (let k = j; k < src.length; k++) {
    if (src[k] === '{') d++;
    else if (src[k] === '}') { d--; if (!d) return src.slice(i, k + 1); }
  }
};
// goToTier() is lifted too. Until v128 this harness checked only what the ladder
// DRAWS, never what its button DOES — and the v127 defect lived entirely in the
// second. A control that renders correctly and navigates wrongly is invisible to
// a rendering check, so the stubs below record the resulting state instead.
let navPushes = 0;
const resetLessonViewState = () => {};
const pushNav = () => { navPushes++; };
const render  = () => {};
const window  = { scrollTo: () => {} };
const openPathLesson = (topicKey, tier) => {
  state.topic = topicKey; state.currentRound = tier;
  state.nav = 'topics'; state.topicsView = false;
  state.fromPath = true; state.fromPathTier = tier;
  pushNav();
};
eval(['pathOwningTier','getTierLadder','renderTierLine','renderTierXref','goToTier'].map(grab).join('\n'));

let fail = 0;
const ok = (c, m) => { if (!c) { console.log('  FAIL ' + m); fail++; } };

console.log('— pathOwningTier across every (topic, tier) pair —');
let unowned = [], multi = [];
for (const t of idx) for (const r of t.rounds) {
  const owners = paths.filter(p => p.lessons.some(l => l.topic === t.key && (l.round || 1) === r));
  if (!owners.length) unowned.push(`${t.key}/T${r}`);
  if (owners.length > 1) multi.push(`${t.key}/T${r}`);
}
console.log('  unowned:', unowned.length, '| owned by >1 path:', multi.length);
ok(!unowned.length && !multi.length, 'the single-find() premise holds');

console.log('— ladder shape per topic —');
const shapes = {};
for (const t of idx) for (const r of t.rounds) {
  state.topic = t.key; state.currentRound = r;
  const L = getTierLadder(t.key, r);
  const key = `${L.total} tiers, at T${r}: ${L.rungs.map(x => x.dir + '->' + x.tier).join('+') || 'none'}`;
  shapes[key] = (shapes[key] || 0) + 1;
  ok(L.rungs.length <= 2, `${t.key} T${r} has <=2 rungs`);
  ok(L.rungs.every(x => x.pathLabel), `${t.key} T${r} rungs all name a path`);
}
Object.entries(shapes).forEach(([k, n]) => console.log(`  ${n}x  ${k}`));

console.log('— rendered output —');
const cases = [
  ['pronouns', 1, false, 'single tier, standalone'],
  ['greetings', 1, false, 'T1 of 2, standalone'],
  ['greetings', 2, false, 'T2 of 2, standalone'],
  ['greetings', 1, true,  'T1 of 2, in a path'],
  ['greetings', 2, true,  'T2 of 2, in a path'],
];
for (const [t, r, fp, label] of cases) {
  state.topic = t; state.currentRound = r; state.fromPath = fp;
  const line = renderTierLine().replace(/\s+/g, ' ').trim();
  const xref = renderTierXref().replace(/\s+/g, ' ').trim();
  console.log(`  ${label}`);
  console.log(`    line: ${line.replace(/<[^>]+>/g, '|').replace(/\|+/g, ' ').trim()}`);
  console.log(`    xref: ${xref ? xref.replace(/<[^>]+>/g, '|').replace(/\|+/g, ' ').trim() : '(none)'}`);
  ok(!(fp && line.includes('data-tier')), `${label}: no inline rungs inside a path`);
  ok(!(!fp && xref), `${label}: no foot xref outside a path`);
  ok(!(!fp && r === 1 && t === 'greetings' && !line.includes('data-tier="2"')), `${label}: offers T2`);
}

// three-tier simulation — no such topic exists yet, so fabricate one
console.log('— simulated 3-tier topic (T2 of 3, standalone) —');
idx.push({ key: '__sim', label: 'Sim', rounds: [1,2,3], wordCounts: {'1':10,'2':10,'3':12} });
paths.push({ key:'advanced', label:'Advanced', lessons:[{topic:'__sim',round:3}] });
paths.find(p=>p.key==='beginner').lessons.push({topic:'__sim',round:1});
paths.find(p=>p.key==='intermediate').lessons.push({topic:'__sim',round:2});
state.topic='__sim'; state.currentRound=2; state.fromPath=false;
const l3 = renderTierLine();
console.log('   line:', l3.replace(/\s+/g,' ').replace(/<[^>]+>/g,'|').replace(/\|+/g,' ').trim());
ok(l3.includes('of 3'), '3-tier: state says "of 3"');
ok((l3.match(/data-tier/g)||[]).length === 2, '3-tier: two rungs');
// Bare numbers means the ladder portion must not repeat the word "Tier" — the
// state text already carries it, which is the only reason shortening is safe.
const ladderHtml = l3.slice(l3.indexOf('<span class="ladder">'));
ok(!/Tier/.test(ladderHtml), '3-tier: rungs are bare numbers, not "Tier N"');
ok(/>\s*1\s*<\/button>/.test(ladderHtml.replace(/<svg\/>/g,'')), '3-tier: down rung is 1');
ok(/>\s*3\s*</.test(ladderHtml.replace(/<svg\/>/g,'')), '3-tier: up rung is 3');
state.fromPath = true;
const x3 = renderTierXref();
console.log('   xref rows:', (x3.match(/class="xref"/g)||[]).length);
ok((x3.match(/class="xref"/g)||[]).length === 2, '3-tier: two xref rows in a path');
ok(x3.includes('Beginner') && x3.includes('Advanced'), '3-tier: xref names both paths');

// And the two-tier case must NOT shorten — there is no "of N" to read against.
state.topic='greetings'; state.currentRound=1; state.fromPath=false;
const l2 = renderTierLine();
ok(/Tier 2/.test(l2.slice(l2.indexOf('<span class="ladder">'))), '2-tier: single rung stays named');

// ── What the rung DOES, not just what it draws (v128) ────────────────────────
// The destination context must follow the ORIGIN context. Both directions of
// both routes, on real data.
console.log('— goToTier preserves the origin context —');

const go = (topic, from, to, inPath, activePath) => {
  Object.assign(state, {
    topic, currentRound: from, fromPath: inPath,
    fromPathTier: inPath ? from : null,
    activePath: activePath || null,
  });
  goToTier(topic, to);
  return { round: state.currentRound, fromPath: state.fromPath, activePath: state.activePath };
};

// Standalone: browsing modals from Topics and stepping up a rung must NOT enter
// the Intermediate path. This is the v127 defect, and it was live for all ten
// two-tier topics from v121.
let r = go('modals', 1, 2, false);
ok(r.round === 2, 'standalone up: lands on tier 2');
ok(r.fromPath === false, 'standalone up: stays standalone (does not enter Intermediate)');
ok(!state.fromPathTier, 'standalone up: fromPathTier stays clear');
// The rung back down must therefore still be drawn — the whole point of staying
// standalone is that the control survives being used.
ok(/data-tier="1"/.test(renderTierLine()), 'standalone up: the rung back down is still offered');

r = go('modals', 2, 1, false);
ok(r.round === 1 && r.fromPath === false, 'standalone down: stays standalone');

// In a path: a tier change IS a path change, and activePath follows the
// DESTINATION. This is DES-30 and must not regress.
r = go('modals', 1, 2, true, 'beginner');
ok(r.fromPath === true, 'in-path up: stays in a path');
ok(r.activePath === 'intermediate', 'in-path up: activePath follows the destination (DES-30)');
ok(state.fromPathTier === 2, 'in-path up: fromPathTier matches the tier entered');

r = go('modals', 2, 1, true, 'intermediate');
ok(r.fromPath === true && r.activePath === 'beginner', 'in-path down: activePath follows the destination');

// Every two-tier topic, both routes — the defect was uniform, so the check is too.
const twoTier = idx.filter(t => t.rounds.length > 1 && t.key !== '__sim');
let leaked = twoTier.filter(t => go(t.key, t.rounds[0], t.rounds[1], false).fromPath);
console.log('  two-tier topics leaking into a path from standalone:', leaked.length, '/', twoTier.length);
ok(!leaked.length, 'no two-tier topic leaks into a path from the standalone ladder');

console.log(fail ? `\n${fail} FAILURES` : '\nall tier assertions pass');
process.exit(fail ? 1 : 0);
