// Standing check (new, added post-v148). Two related but separate checks
// against styles.css, both about a property being set twice for declarations
// that can apply to the same element — the case standing check 1 (one rule at
// a time) is structurally blind to.
//
// CHECK A — same selector, declared twice across separate rule blocks.
// Same selector text always means same specificity, so this is CERTAIN: the
// later declaration always wins (source order), except when an earlier
// declaration carries `!important` and the later one doesn't — the CSS spec
// inverts the winner in that one case, and this script does too. No false
// positives are possible here; the earlier 41-selector count (v120, done by
// hand) is what this replaces with a script that can be re-run.
//
// CHECK B — different selectors, same property, no shared rule to blame.
// This is the harder half named in BACKLOG.md: two selectors that both touch
// the same element (they share at least one class/id/type in their RIGHTMOST
// compound — the part that actually matches the styled element, not an
// ancestor) but at unequal specificity. The higher-specificity one always
// wins regardless of file order — reordering the CSS cannot fix it, only
// removing or merging the duplicate can. This is exactly the DES-48 bug:
// `.bubble-row.right .bubble-play` (0,3,0) permanently outranked
// `.bubble-play.is-playing` (0,2,0) for `color`, no matter which came first.
//
// Check B is a HEURISTIC, not a certainty — unlike Check A. Two selectors
// sharing a rightmost class and a property is also how ordinary, intentional
// overrides look (a button styled generally, then deliberately restyled in
// one context). Every candidate needs a human look at render.js/app.js to
// see whether the two selectors' classes are ever actually combined on the
// same element — this script can't know that from the CSS alone. Confirmed
// intentional pairs go in KNOWN below so they stop being reported.
//
// Known simplifications (documented rather than silently wrong):
//  - `:not(...)` is counted as one pseudo-class toward specificity; its
//    argument's own specificity (per spec) is not computed. All five uses in
//    this file are single, simple arguments, so this doesn't misrank any of
//    them today — re-check this comment if a compound :not() is ever added.
//  - Comma-separated selector lists (`.a, .b { }`) are split and each side
//    checked independently. None exist in the file today.
//  - `@media` / `@supports` bodies are parsed as their own scope — a rule
//    inside a media query is only compared against other rules in that same
//    query, never against the unconditional top-level rule it may override
//    responsively on purpose. `@keyframes` bodies are skipped entirely (not
//    part of the element cascade this check is about).
//
// Usage:  node tools/dup-css.js
// Exit code: 1 if Check A finds anything (it should stay at zero once swept —
// this is the part that can be a hard gate). Check B never affects exit code;
// it can't reach zero and isn't meant to.

'use strict';
const fs = require('fs'), path = require('path');
const CSS_PATH = path.join(__dirname, '..', 'styles.css');
const src = fs.readFileSync(CSS_PATH, 'utf8');

// Pairs already reviewed and judged intentional — "selA||selB||property",
// selectors sorted alphabetically within the key so order doesn't matter.
// Empty until a real sweep populates it.
const KNOWN = new Set([
]);

// ── 1. Strip comments, keeping newlines so line numbers stay correct ───────
function stripComments(text) {
  let out = '', i = 0;
  while (i < text.length) {
    if (text[i] === '/' && text[i + 1] === '*') {
      let j = text.indexOf('*/', i + 2);
      j = j === -1 ? text.length : j + 2;
      for (let k = i; k < j; k++) out += text[k] === '\n' ? '\n' : ' ';
      i = j;
    } else {
      out += text[i++];
    }
  }
  return out;
}
const css = stripComments(src);

// Line number for a character offset, via a precomputed prefix count.
const lineStarts = [0];
for (let i = 0; i < css.length; i++) if (css[i] === '\n') lineStarts.push(i + 1);
function lineAt(offset) {
  let lo = 0, hi = lineStarts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (lineStarts[mid] <= offset) lo = mid; else hi = mid - 1;
  }
  return lo + 1;
}

// ── 2. Split top-level occurrences of a delimiter, respecting quotes/parens ─
// Used for: selector lists on ',', declarations on ';', property/value on
// first ':'. Quotes are always respected; paren-depth respected when asked.
function splitTopLevel(text, delims, respectParens) {
  const parts = [];
  let depth = 0, start = 0, i = 0;
  const n = text.length;
  while (i < n) {
    const ch = text[i];
    if (ch === '"' || ch === "'") {
      const q = ch; i++;
      while (i < n && text[i] !== q) { if (text[i] === '\\') i++; i++; }
      i++;
      continue;
    }
    if (respectParens && ch === '(') { depth++; i++; continue; }
    if (respectParens && ch === ')') { depth = Math.max(0, depth - 1); i++; continue; }
    if (depth === 0 && delims.includes(ch)) {
      parts.push(text.slice(start, i));
      start = i + 1;
      i++;
      continue;
    }
    i++;
  }
  parts.push(text.slice(start));
  return parts;
}

// ── 3. Parse the whole file into a tree of {prelude, content, startOffset,
//       contentOffset} blocks via brace matching (quote-aware). ────────────
function parseBlocks(text) {
  const blocks = [];
  const stack = [];
  let preludeStart = 0;
  let i = 0;
  const n = text.length;
  while (i < n) {
    const ch = text[i];
    if (ch === '"' || ch === "'") {
      const q = ch; i++;
      while (i < n && text[i] !== q) { if (text[i] === '\\') i++; i++; }
      i++;
      continue;
    }
    if (ch === '{') {
      const prelude = text.slice(preludeStart, i);
      stack.push({ prelude, contentStart: i + 1, preludeOffset: preludeStart });
      i++;
      preludeStart = i;
      continue;
    }
    if (ch === '}') {
      const open = stack.pop();
      if (open) {
        const content = text.slice(open.contentStart, i);
        blocks.push({
          prelude: open.prelude,
          preludeOffset: open.preludeOffset,
          content,
          contentOffset: open.contentStart,
          depth: stack.length, // depth AFTER popping = nesting level this block sits at
          parent: stack.length ? stack[stack.length - 1] : null,
        });
      }
      i++;
      preludeStart = i;
      continue;
    }
    i++;
  }
  return blocks;
}
const allBlocks = parseBlocks(css);

// `.parent` needs to be a stable reference — parseBlocks stores the
// actual stack object, which IS the same object referenced by `open`, but
// blocks are recorded AFTER popping, so `.parent` points at the still-open
// stack frame object for the parent, not at the parent's own finished block
// record. Resolve parent stack-frames to their finished block record by
// matching on preludeOffset (unique per block).
const byPreludeOffset = new Map(allBlocks.map(b => [b.preludeOffset, b]));
for (const b of allBlocks) {
  b.parentBlock = b.parent ? byPreludeOffset.get(b.parent.preludeOffset) || null : null;
}
const topLevel = allBlocks.filter(b => b.parentBlock === null && b.depth === 0);
function childrenOf(block) {
  return allBlocks.filter(b => b.parentBlock === block);
}

// ── 4. Walk the tree, collecting "rules" (selector list + declarations) in
//       their scope. Skips @keyframes; recurses into @media/@supports. ─────
const AT_SCOPE_RE = /^@(media|supports)\b/i;
const AT_SKIP_RE = /^@(-\w+-)?keyframes\b/i;

const rules = []; // { selector, scope, declarations: [{prop, value, important, line}] }

function collectDeclarations(content, contentOffset) {
  const decls = [];
  const parts = splitTopLevel(content, [';'], true);
  let cursor = 0;
  for (const raw of parts) {
    const partOffset = contentOffset + cursor;
    cursor += raw.length + 1; // +1 for the ';' consumed by splitTopLevel
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const kv = splitTopLevel(trimmed, [':'], true);
    if (kv.length < 2) continue; // malformed / stray text, ignore
    const prop = kv[0].trim().toLowerCase();
    let value = kv.slice(1).join(':').trim();
    let important = false;
    if (/!\s*important\s*$/i.test(value)) {
      important = true;
      value = value.replace(/!\s*important\s*$/i, '').trim();
    }
    if (!prop) continue;
    const leadingWs = raw.length - raw.replace(/^\s+/, '').length;
    decls.push({ prop, value, important, line: lineAt(partOffset + leadingWs) });
  }
  return decls;
}

function walk(block, scope) {
  const prelude = block.prelude.trim();
  if (AT_SKIP_RE.test(prelude)) return; // @keyframes — not part of the element cascade
  if (AT_SCOPE_RE.test(prelude)) {
    const childScope = scope ? `${scope} ${prelude.replace(/\s+/g, ' ')}` : prelude.replace(/\s+/g, ' ');
    for (const child of childrenOf(block)) walk(child, childScope);
    return;
  }
  if (prelude.startsWith('@')) {
    // Unhandled at-rule type (none currently in the file) — treat the whole
    // prelude as a single selector-like key rather than silently dropping it.
    const decls = collectDeclarations(block.content, block.contentOffset);
    if (decls.length) rules.push({ selector: prelude.replace(/\s+/g, ' '), scope: scope || '', declarations: decls });
    return;
  }
  if (childrenOf(block).length) return; // has nested blocks we don't expect for a plain rule — skip defensively
  const selectors = splitTopLevel(prelude, [','], true).map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const decls = collectDeclarations(block.content, block.contentOffset);
  if (!decls.length) return;
  for (const sel of selectors) rules.push({ selector: sel, scope: scope || '', declarations: decls });
}
for (const b of topLevel) walk(b, '');

// ── 5. CHECK A — same (scope, selector) declaring the same property twice ──
const byKey = new Map(); // "scope||selector" -> [{prop, value, important, line}]
for (const r of rules) {
  const key = `${r.scope}||${r.selector}`;
  if (!byKey.has(key)) byKey.set(key, []);
  byKey.get(key).push(...r.declarations.map(d => ({ ...d, selector: r.selector, scope: r.scope })));
}
const checkA = [];
for (const [key, decls] of byKey) {
  const byProp = new Map();
  for (const d of decls) {
    if (!byProp.has(d.prop)) byProp.set(d.prop, []);
    byProp.get(d.prop).push(d);
  }
  for (const [prop, occurrences] of byProp) {
    if (occurrences.length < 2) continue;
    occurrences.sort((a, b) => a.line - b.line);
    const important = occurrences.filter(o => o.important);
    const winner = important.length ? important[important.length - 1] : occurrences[occurrences.length - 1];
    checkA.push({ selector: occurrences[0].selector, scope: occurrences[0].scope, prop, occurrences, winner });
  }
}
checkA.sort((a, b) => a.occurrences[0].line - b.occurrences[0].line);

// ── 6. CHECK B — different selectors, same property, shared rightmost class,
//       unequal-or-equal specificity. Heuristic — see header comment. ──────
function specificity(sel) {
  // Strip :not(...) argument contents (counted as a single pseudo-class).
  const s = sel.replace(/:not\([^)]*\)/gi, ':not()');
  let a = 0, b = 0, c = 0;
  const re = /(#[\w-]+)|(::[\w-]+)|(:[\w-]+)|(\.[\w-]+)|(\[[^\]]*\])|([A-Za-z][\w-]*)/g;
  let m;
  while ((m = re.exec(s))) {
    if (m[1]) a++;
    else if (m[2]) c++;
    else if (m[3]) b++;
    else if (m[4]) b++;
    else if (m[5]) b++;
    else if (m[6]) c++;
  }
  return [a, b, c];
}
function cmpSpec(x, y) {
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i];
  return 0;
}
function rightmostCompound(sel) {
  // Split on combinators (space, >, +, ~) at top level, take the last piece.
  const parts = splitTopLevel(sel, [' ', '>', '+', '~'], true).map(p => p.trim()).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : sel;
}
// "Sharing" detector for Check B: class/id tokens only. A bare element type
// (svg, i, button, span…) is excluded on purpose — trialling this against
// the real file showed pairs like `.segs > i` / `.track > i` and `.mk svg` /
// `.node svg` matching on the tag alone despite being different components
// that will never style the same element. Classes and ids are what a
// component actually scopes its markup by; tag names are reused everywhere
// and carry no such signal.
function tokensOf(compound) {
  const s = compound.replace(/:not\([^)]*\)/gi, '');
  const out = new Set();
  for (const m of s.matchAll(/[.#]([\w-]+)/g)) out.add(m[0][0] + m[1]);
  return out;
}
// Fuller tokenizer (adds pseudo-classes/elements) used only for the
// compound-refinement tier check below — deliberately more inclusive than
// tokensOf, which is scoped to "do these touch the same element at all".
function allTokensOf(compound) {
  const s = compound.replace(/:not\([^)]*\)/gi, ':not()');
  const out = new Set();
  for (const m of s.matchAll(/(::?[\w-]+)|(\.[\w-]+)|(#[\w-]+)/g)) out.add(m[0]);
  const typeMatch = s.match(/^[A-Za-z][\w-]*/);
  if (typeMatch) out.add(typeMatch[0].toLowerCase());
  return out;
}
function hasCombinator(sel) {
  return splitTopLevel(sel, [' ', '>', '+', '~'], true).map(p => p.trim()).filter(Boolean).length > 1;
}
function isProperSubset(a, b) {
  if (a.size >= b.size) return false;
  for (const t of a) if (!b.has(t)) return false;
  return true;
}

// One entry per (scope, selector, property) — first occurrence's line/value
// used for reporting; if a selector sets a property more than once, Check A
// already covers that, so Check B only needs one representative per group.
const bEntries = [];
const seen = new Set();
for (const [key, decls] of byKey) {
  const bySelProp = new Map();
  for (const d of decls) {
    const k = d.prop;
    if (!bySelProp.has(k)) bySelProp.set(k, d); // first occurrence is enough here
  }
  for (const [prop, d] of bySelProp) {
    const dedupeKey = `${d.scope}||${d.selector}||${prop}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    bEntries.push({
      selector: d.selector, scope: d.scope, prop, value: d.value, line: d.line,
      spec: specificity(d.selector), subject: rightmostCompound(d.selector),
    });
  }
}
const byPropScope = new Map();
for (const e of bEntries) {
  const k = `${e.scope}||${e.prop}`;
  if (!byPropScope.has(k)) byPropScope.set(k, []);
  byPropScope.get(k).push(e);
}
const checkB = [];
const reportedPairs = new Set();
for (const [, entries] of byPropScope) {
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const x = entries[i], y = entries[j];
      if (x.selector === y.selector) continue; // same selector — Check A's job
      const tx = tokensOf(x.subject), ty = tokensOf(y.subject);
      let shares = false;
      for (const t of tx) if (ty.has(t)) { shares = true; break; }
      if (!shares) continue;
      const pairKeySorted = [x.selector, y.selector].sort();
      const knownKey = `${pairKeySorted[0]}||${pairKeySorted[1]}||${x.prop}`;
      if (KNOWN.has(knownKey)) continue;
      const dedupe = knownKey;
      if (reportedPairs.has(dedupe)) continue;
      reportedPairs.add(dedupe);
      const cmp = cmpSpec(x.spec, y.spec);
      let higher, lower, orderIndependent;
      if (cmp === 0) {
        orderIndependent = false;
        [higher, lower] = x.line < y.line ? [y, x] : [x, y]; // later source line wins
      } else {
        orderIndependent = true;
        [higher, lower] = cmp > 0 ? [x, y] : [y, x];
      }
      // Tier: a "compound refinement" is two plain, context-free selectors
      // where the lower is a proper subset of the higher (.node--cp vs
      // .node--cp.node--done) — the common, ordinarily-intentional pattern
      // of a more specific state override. Anything involving ancestor
      // context (a combinator on either side, the DES-48 shape) or two
      // modifiers that don't subsume each other stays in the structural tier.
      const refinement = !hasCombinator(x.selector) && !hasCombinator(y.selector) &&
        isProperSubset(allTokensOf(lower.selector), allTokensOf(higher.selector));
      checkB.push({ scope: x.scope, prop: x.prop, higher, lower, orderIndependent, key: knownKey, tier: refinement ? 'refinement' : 'structural' });
    }
  }
}
checkB.sort((p, q) => p.higher.line - q.higher.line);

// ── 7. Report ────────────────────────────────────────────────────────────
console.log(`rules parsed: ${rules.length}  (from ${topLevel.length} top-level blocks)`);
console.log('\n=== Check A — same selector, same property, declared twice ===');
console.log(`${checkA.length} found${checkA.length ? '' : ' — clean'}`);
for (const c of checkA) {
  const scopeLabel = c.scope ? `  [scope: ${c.scope}]` : '';
  console.log(`\n  ${c.selector}  ·  ${c.prop}${scopeLabel}`);
  for (const o of c.occurrences) {
    const tag = o === c.winner ? 'WINS' : 'dead';
    const imp = o.important ? ' !important' : '';
    console.log(`    line ${o.line}: ${o.value}${imp}   [${tag}]`);
  }
}

const structural = checkB.filter(c => c.tier === 'structural');
const refinement = checkB.filter(c => c.tier === 'refinement');

function printB(c) {
  const scopeLabel = c.scope ? `  [scope: ${c.scope}]` : '';
  const note = c.orderIndependent
    ? 'always wins regardless of file order (higher specificity)'
    : 'wins by file order only (equal specificity — reordering would flip this)';
  console.log(`\n  ${c.prop}${scopeLabel}`);
  console.log(`    line ${c.higher.line}: ${c.higher.selector}  (${c.higher.spec.join(',')})  ${c.higher.value}   [${note}]`);
  console.log(`    line ${c.lower.line}: ${c.lower.selector}  (${c.lower.spec.join(',')})  ${c.lower.value}   [shadowed if selectors ever apply to the same element]`);
  console.log(`    if intentional, add to KNOWN: "${c.key}"`);
}

console.log('\n=== Check B (structural) — ancestor context or non-subsuming modifiers ===');
console.log(`${structural.length} candidates — this is the DES-48 shape; review these first`);
for (const c of structural) printB(c);

console.log('\n=== Check B (refinement) — one selector is a plain superset of the other ===');
console.log(`${refinement.length} candidates — usually an intentional "more specific state" override`);
console.log('(e.g. .node--cp.node--done deliberately overriding .node--cp — printed for completeness, lower priority)');
for (const c of refinement) printB(c);

console.log(`\nCheck A: ${checkA.length}  |  Check B structural: ${structural.length}  |  Check B refinement: ${refinement.length}  (both B tiers informational, neither gates)`);
process.exit(checkA.length ? 1 : 0);
