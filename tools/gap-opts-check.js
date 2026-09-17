#!/usr/bin/env node
/* gap-opts-check.js — reports every user conversation turn against the four
 * Fill-the-Gap distractor rules in CONTENT.md §3. Vanilla Node, no deps.
 *
 *   node tools/gap-opts-check.js              # summary + every violation
 *   node tools/gap-opts-check.js --summary    # counts only
 *   node tools/gap-opts-check.js --topic=drinks
 *
 * ── WHY THIS IS A REPORT AND NOT A STANDING CHECK ───────────────────────────
 * Rules 3 and 4 fail most of the authored corpus as it stands (91% of turns let
 * a learner pick the answer by length alone — the measurement is in CONTENT.md
 * §3 and the retrofit is in BACKLOG.md). A check that always fails is a check
 * nobody reads, which is the lesson standing check 3 already taught. So the
 * STRUCTURAL rules exit non-zero — those hold at 141/141 today and a break is a
 * real defect — and the QUALITY rules only report. Promote rules 3 and 4 to
 * exit-code status in the same commit as the retrofit, not before.
 *
 * ── CHECKPOINT CONVERSATIONS ARE OUT OF SCOPE, DELIBERATELY ─────────────────
 * Fill-the-Gap is never offered on a checkpoint conversation (DES-52), and
 * path_convos.json is reachable from nowhere else, so `opts` there is data the
 * app cannot read. They are counted and reported separately rather than judged:
 * authoring them would be work with no user-visible effect, and deleting the
 * five sets that exist would be churn with none either.
 */

const fs = require('fs');
const path = require('path');

const ROOT       = path.join(__dirname, '..');
const TOPICS_DIR = path.join(ROOT, 'data', 'topics');
const CONVOS     = path.join(ROOT, 'data', 'path_convos.json');

const arg = n => {
  const hit = process.argv.find(a => a.startsWith(`--${n}=`));
  return hit ? hit.split('=')[1] : null;
};
const flag       = n => process.argv.includes(`--${n}`);
const ONLY_TOPIC = arg('topic');
const SUMMARY    = flag('summary');

// House fallbacks — rule 4. Matched after stripping trailing punctuation, so
// 我唔知。and 我唔知 are one entry. Deliberately a short literal list rather
// than a heuristic: "contentless" is a judgement, and a guessed one would put
// real answers on the list.
const FALLBACKS = ['我唔知', '唔知', '唔該', '再見', '唔明', '我唔明'];

const stripPunct = s => s.replace(/[。！？，、!?.,\s]+$/u, '').trim();
const hanLen     = s => [...s].filter(ch => ch >= '\u3400' && ch <= '\u9fff').length;
const isFallback = s => FALLBACKS.includes(stripPunct(s));

// Every user turn in the topic files, with enough context to name it in output.
function collectTurns() {
  const turns = [];
  for (const file of fs.readdirSync(TOPICS_DIR).filter(f => f.endsWith('.json')).sort()) {
    const key = file.replace(/\.json$/, '');
    if (ONLY_TOPIC && key !== ONLY_TOPIC) continue;
    const data = JSON.parse(fs.readFileSync(path.join(TOPICS_DIR, file), 'utf8'));
    for (const [roundKey, round] of Object.entries(data.rounds || {})) {
      const convo = round.convo;
      if (!convo) continue;
      (convo.lines || []).forEach((line, i) => {
        if (line.u) turns.push({ where: `${key} r${roundKey} line ${i + 1}`, line });
      });
    }
  }
  return turns;
}

function checkpointSummary() {
  const data = JSON.parse(fs.readFileSync(CONVOS, 'utf8')).convos || {};
  let withOpts = 0, without = 0;
  for (const convo of Object.values(data)) {
    const user = (convo.lines || []).filter(l => l.u);
    if (user.some(l => Array.isArray(l.opts) && l.opts.length)) withOpts++;
    else if (user.length) without++;
  }
  return { withOpts, without };
}

const turns   = collectTurns();
const authored = turns.filter(t => Array.isArray(t.line.opts) && t.line.opts.length);
const missing  = turns.filter(t => !(Array.isArray(t.line.opts) && t.line.opts.length));

const structural = [];
const quality    = [];
const flagged    = new Set();   // turns, not violations — one turn can break two rules
const reuse      = new Map();

for (const { where, line } of authored) {
  const { opts, optsJ, c } = line;

  // ── Structural: these hold across the whole corpus today ──
  if (opts.length !== 3)                          structural.push(`${where}: ${opts.length} options, expected 3`);
  if (opts[0] !== c)                              structural.push(`${where}: opts[0] is not the line verbatim`);
  if (!Array.isArray(optsJ) || optsJ.length !== opts.length)
                                                  structural.push(`${where}: optsJ missing or not parallel to opts`);
  if (new Set(opts).size !== opts.length)         structural.push(`${where}: duplicate option`);

  const distractors = opts.slice(1);
  distractors.forEach(d => reuse.set(d, (reuse.get(d) || 0) + 1));

  // ── Quality: rules 3 and 4 ──
  const answerLen = hanLen(opts[0]);
  const lens      = distractors.map(hanLen);
  if (answerLen && !lens.some(l => l >= answerLen)) {
    quality.push(`${where}: rule 3 — answer is ${answerLen} characters, longest distractor ${Math.max(...lens)}`);
    flagged.add(where);
  }
  if (answerLen && lens.some(l => l < answerLen / 2)) {
    quality.push(`${where}: rule 3 — a distractor is under half the answer's length (${Math.min(...lens)} vs ${answerLen})`);
    flagged.add(where);
  }
  const fallbacks = distractors.filter(isFallback);
  if (fallbacks.length > 1) {
    quality.push(`${where}: rule 4 — both distractors are house fallbacks (${fallbacks.join(' / ')})`);
    flagged.add(where);
  }
}

const cp = checkpointSummary();
const pct = (n, d) => d ? `${Math.round((n / d) * 100)}%` : '—';

console.log('\nFill-the-Gap options — CONTENT.md §3\n');
console.log(`Topic user turns:        ${turns.length}`);
console.log(`  with opts authored:    ${authored.length}`);
console.log(`  without (activity hidden for that conversation): ${missing.length}`);
console.log(`Structural faults:       ${structural.length}`);
console.log(`Rule 3/4:                ${flagged.size} of ${authored.length} turns flagged (${pct(flagged.size, authored.length)}), ${quality.length} violations in total`);
console.log(`Checkpoint conversations: ${cp.withOpts} with opts, ${cp.without} without — not judged, Fill-the-Gap is suppressed there (DES-52)`);

if (!SUMMARY) {
  if (missing.length) {
    console.log('\n── No opts authored ──');
    missing.forEach(t => console.log(`  ${t.where}`));
  }
  if (structural.length) {
    console.log('\n── Structural faults (these fail the run) ──');
    structural.forEach(m => console.log(`  ${m}`));
  }
  if (quality.length) {
    console.log('\n── Rule 3 / rule 4 (reported, does not fail the run) ──');
    quality.forEach(m => console.log(`  ${m}`));
  }
  const repeated = [...reuse.entries()].filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1]);
  if (repeated.length) {
    console.log('\n── Distractors reused 3+ times ──');
    repeated.forEach(([s, n]) => console.log(`  ${String(n).padStart(3)}  ${s}`));
  }
}

if (structural.length) {
  console.log(`\nFAIL — ${structural.length} structural fault(s).\n`);
  process.exit(1);
}
console.log('\nStructural rules pass.\n');
