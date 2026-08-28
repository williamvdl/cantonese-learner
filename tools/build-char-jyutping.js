#!/usr/bin/env node
// ── build-char-jyutping.js ──────────────────────────────────────────────────
// Derives data/char-jyutping.json — a single-character → jyutping lookup —
// from the corpus that already exists (words' c/j and sentences' bd[] chunk
// c/j across every topic). This is NOT a general Cantonese dictionary: it is
// exactly as good, and exactly as limited, as the 585 words and 307
// sentences already authored. Run this after any content change that touches
// word or sentence jyutping — it is generated, not hand-typed, precisely so
// it cannot drift the way a hand-maintained lookup would (see STATUS.md,
// "Notes worth carrying forward").
//
// Used by charsToJyutping() in app.js to render the "You said" line in the
// sentence speak sheet (DES-38/40) without an API call. Two things this
// table is honest about, on purpose:
//   - COVERAGE: a character the corpus never taught has no reading here.
//     charsToJyutping() must show that plainly, not guess.
//   - POLYPHONY: a character can carry more than one reading across the
//     corpus (生 as saang1 in some words, sang1 in others). The majority
//     reading wins; `amb: true` marks it so the runtime can flag it rather
//     than present a guess as fact.
//
// Usage: node tools/build-char-jyutping.js [--check]
//   --check   exit 1 if data/char-jyutping.json is missing or stale
//             (regenerating would change it) — for a pre-deploy check.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TOPICS_DIR = path.join(ROOT, 'data', 'topics');
const OUT_PATH = path.join(ROOT, 'data', 'char-jyutping.json');

const isHan = ch => /[\u4e00-\u9fff]/.test(ch);

// Splits a Chinese string into its Han characters and a jyutping string into
// its space-separated syllables, and pairs them positionally. Returns null
// if the counts disagree (mixed English/punctuation content, or an authoring
// slip) — callers skip those pairs rather than mis-align them.
function alignPairs(c, j) {
  const chars = [...c].filter(isHan);
  const syls = j.trim().split(/\s+/).filter(s => /[a-z]/i.test(s));
  if (chars.length === 0 || chars.length !== syls.length) return null;
  return chars.map((ch, i) => [ch, syls[i].replace(/[^a-z0-9]/gi, '').toLowerCase()]);
}

function build() {
  const files = fs.readdirSync(TOPICS_DIR).filter(f => f.endsWith('.json'));
  const counts = {};   // char -> { reading: occurrences }
  let wordPairs = 0, wordSkipped = 0, bdPairs = 0, bdSkipped = 0;

  for (const f of files) {
    const topic = JSON.parse(fs.readFileSync(path.join(TOPICS_DIR, f), 'utf8'));
    for (const roundKey of Object.keys(topic.rounds || {})) {
      const round = topic.rounds[roundKey];
      (round.words || []).forEach(w => {
        const pairs = alignPairs(w.c, w.j);
        if (!pairs) { wordSkipped++; return; }
        wordPairs++;
        pairs.forEach(([ch, syl]) => {
          if (!syl) return;
          counts[ch] = counts[ch] || {};
          counts[ch][syl] = (counts[ch][syl] || 0) + 1;
        });
      });
      (round.sentences || []).forEach(s => {
        (s.bd || []).forEach(chunk => {
          const pairs = alignPairs(chunk.c, chunk.j);
          if (!pairs) { bdSkipped++; return; }
          bdPairs++;
          pairs.forEach(([ch, syl]) => {
            if (!syl) return;
            counts[ch] = counts[ch] || {};
            counts[ch][syl] = (counts[ch][syl] || 0) + 1;
          });
        });
      });
    }
  }

  const out = {};
  const chars = Object.keys(counts).sort();
  for (const ch of chars) {
    const readings = Object.entries(counts[ch]).sort((a, b) => b[1] - a[1]);
    const entry = { j: readings[0][0] };
    if (readings.length > 1) entry.amb = true;
    out[ch] = entry;
  }

  return { out, chars, wordPairs, wordSkipped, bdPairs, bdSkipped };
}

function main() {
  const checkOnly = process.argv.includes('--check');
  const { out, chars, wordPairs, wordSkipped, bdPairs, bdSkipped } = build();
  const json = JSON.stringify(out, Object.keys(out).sort(), 0);
  // Deterministic key order (already sorted going in) so a re-run with no
  // content changes produces a byte-identical file — required for --check
  // to mean anything.
  const serialized = JSON.stringify(out, null, 0);

  const ambiguous = chars.filter(ch => out[ch].amb).length;

  if (checkOnly) {
    if (!fs.existsSync(OUT_PATH)) {
      console.error('data/char-jyutping.json is missing — run: node tools/build-char-jyutping.js');
      process.exit(1);
    }
    const existing = fs.readFileSync(OUT_PATH, 'utf8');
    if (existing !== serialized) {
      console.error('data/char-jyutping.json is stale — run: node tools/build-char-jyutping.js');
      process.exit(1);
    }
    console.log('data/char-jyutping.json is up to date (' + chars.length + ' characters).');
    return;
  }

  fs.writeFileSync(OUT_PATH, serialized);
  console.log('wrote data/char-jyutping.json');
  console.log('  characters:        ' + chars.length);
  console.log('  ambiguous (2+ readings in corpus): ' + ambiguous);
  console.log('  word pairs aligned: ' + wordPairs + '  (skipped: ' + wordSkipped + ')');
  console.log('  bd-chunk pairs:     ' + bdPairs + '  (skipped: ' + bdSkipped + ')');
}

main();
