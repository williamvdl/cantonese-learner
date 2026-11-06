// tools/note-pairs.js — the character-and-reading pairing rule, in one place.
//
// The house rule: every Chinese term is written as its characters, then its
// jyutping in brackets — 有冇散紙？ (jau5 mou5 saan3 zi2?). Never jyutping alone,
// never characters alone.
//
// Shared by two callers, so they cannot drift apart:
//   - tools/jyutping-check.js §10, the standing check, which ASSERTS the rule;
//   - tools/note-pairs-measure.js, the diagnostic that MEASURES it over notes
//     the check does not yet cover.
// A widening of the rule is made here, once, and both see it.
//
// Method (v165): blank out every "characters (reading…)" pair — a bracket
// straight after a run of characters, which may carry a gloss and further
// characters inside it, and may span a gap as in 同…一樣 (tung4…jat1 joeng6).
// Whatever is left must contain neither a character nor a jyutping syllable.
// Pairs are blanked with spaces rather than deleted, so every hit keeps its
// position in the text and a caller can show its context.

const H = '\\u3400-\\u4dbf\\u4e00-\\u9fff';
const PAIR = new RegExp(`[${H}][${H}…]*[？！]?\\s*\\([^)]*\\)`, 'g');
const HAN_RUN = new RegExp(`[${H}]+`, 'g');
const JP_RUN = /\b[a-z]+[1-6](?:\s+[a-z]+[1-6])*\b/g;


// Three compact forms CONTENT.md §3 accepts, each giving every character its
// reading in one place. Added at v166, after tools/note-pairs-measure.js found
// them in sentence notes — 4 shared brackets, 1 number, 1 optional syllable —
// and each widening was checked against the measurement's decision rule: every
// planted REAL fixture still flagged, intro notes still passing, the REAL count
// unchanged.
const JP = '[a-z]+[1-6](?:\\s+[a-z]+[1-6])*';
// 定(係) (ding6 (hai6)) — an optional syllable marked on both sides.
const OPTIONAL = new RegExp(`[${H}]+\\([${H}]+\\)\\s*\\(${JP}\\s*\\(${JP}\\)\\)`, 'g');
// 999 (gau2 gau2 gau2) — digits with their reading.
const DIGITS = new RegExp(`(?<![\\w])\\d+\\s*\\(${JP}\\)`, 'g');
// 呢/嗰 (ni1/go2), 對唔住，改日啦 (deoi3 m4 zyu6, goi2 jat6 laa1) — alternatives
// sharing one bracket. Accepted only when the bracket gives one reading per
// term, in order, each the right number of syllables; otherwise left for PAIR,
// which pairs the last term and leaves the earlier ones flagged.
const SHARED = new RegExp(`[${H}]+(?:\\s*[/，,]\\s*[${H}]+)+\\s*\\(([^)]*)\\)`, 'g');
const sharedOk = (m, inside) => {
  const terms = m.slice(0, m.lastIndexOf('(')).split(/[/，,]/).map(t => t.trim()).filter(Boolean);
  const readings = inside.split(/[/，,]/).map(t => t.trim()).filter(t => new RegExp(`^${JP}$`).test(t));
  return readings.length === terms.length
    && terms.every((t, i) => [...t].length === readings[i].split(/\s+/).length);
};

// The note with markup removed and every valid pair blanked out.
function residue(note) {
  const blank = m => ' '.repeat(m.length);
  return String(note || '')
    .replace(/<[^>]+>/g, '')
    .replace(OPTIONAL, blank)
    .replace(DIGITS, blank)
    .replace(SHARED, (m, inside) => sharedOk(m, inside) ? blank(m) : m)
    .replace(PAIR, blank);
}

// Every unpaired term: { kind: 'han' | 'jp', text, index } where index is the
// position in the markup-free note.
function unpairedHits(note) {
  const rest = residue(note);
  return [
    ...[...rest.matchAll(HAN_RUN)].map(m => ({ kind: 'han', text: m[0], index: m.index })),
    ...[...rest.matchAll(JP_RUN)].map(m => ({ kind: 'jp', text: m[0], index: m.index })),
  ].sort((a, b) => a.index - b.index);
}

// The messages jyutping-check.js §10 prints.
function unpaired(note) {
  return unpairedHits(note).map(h => h.kind === 'han'
    ? `character with no reading: ${h.text}`
    : `reading with no character: ${h.text}`);
}

module.exports = { unpaired, unpairedHits, residue, PAIR };
