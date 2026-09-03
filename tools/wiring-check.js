#!/usr/bin/env node
/* tools/wiring-check.js — standing check for control wiring.
 *
 * ── WHY THIS EXISTS ─────────────────────────────────────────────────────────
 * The app renders by setting `app.innerHTML` and then re-running attachEvents()
 * against a brand-new DOM. attachEvents() therefore has to be the union of every
 * screen's wiring, and every lookup has to tolerate its element not being on
 * screen — which is why 52 of them are written `if (el) el.addEventListener(…)`.
 *
 * That guard is load-bearing and correct. It is also why a broken control is
 * SILENT. Rename an id in the markup and forget the handler, or delete a
 * control and leave its handler behind, and nothing complains: no exception, no
 * console warning, no failing check. The button simply does nothing.
 *
 * This is the same defect shape STATUS.md already records from the tier
 * harness, which passed for several versions while a live navigation bug
 * existed because it asserted what a rung DREW rather than what happened when
 * it was PRESSED. Rendering and wiring are two halves of an agreement, and
 * nothing was checking that they agreed.
 *
 * ── WHAT IT ASSERTS ─────────────────────────────────────────────────────────
 * Both directions of that agreement, which are different bugs:
 *
 *   1. NO STRANDED HANDLER — every id/attribute the code binds to is actually
 *      emitted by some render function. A stranded handler is dead code at
 *      best; at worst it is the surviving half of a removed feature, still
 *      writing to state.
 *
 *   2. NO UNWIRED CONTROL — every id/attribute emitted on a control is either
 *      bound, read as a data carrier, or explicitly declared inert below.
 *      An unwired control is a button the user can press that does nothing.
 *
 * ── WHY STATIC ANALYSIS RATHER THAN A DOM ───────────────────────────────────
 * A headless-DOM harness would prove more, but it would have to drive every
 * screen into every state to see every control — which is the screen smoke
 * harness on the backlog, a much bigger build. This check needs no DOM, no
 * dependencies and no fixtures, and it catches the specific failure that the
 * `if (el)` guard hides. The two are complements, not substitutes.
 *
 * It is deliberately written to work BEFORE and AFTER the planned event
 * delegation refactor. Today it reads `querySelectorAll('[data-x]')` and
 * `getElementById('x')` call sites. Afterwards those become entries in a
 * dispatch table, and only readWiring() below changes — the assertions, the
 * declarations and the reporting all stay put. That is the point: this exists
 * so the refactor can be verified rather than trusted.
 *
 * Run: node tools/wiring-check.js      Exit 0 = pass, 1 = fail.
 *
 * Standing check 10. Runs with the other nine before and after any change.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// Comments are stripped before anything is scanned. The comments in this
// codebase are unusually detailed and several of them DISCUSS attribute names
// in prose — `renderQuizCore`'s opts documentation names `data-quiz-dir`, and
// the note above the checkpoint back button names `data-cp-act-back`. Scanning
// them produced a phantom `data-attribute` control on the first run, from the
// words "data-attribute name for direction buttons". Only whole-line `//` and
// block comments are removed, so a `//` inside a string or URL is untouched.
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map(l => (/^\s*\/\//.test(l) ? '' : l))
    .join('\n');
}

const RENDER = stripComments(fs.readFileSync(path.join(ROOT, 'render.js'), 'utf8'));
const APP    = stripComments(fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8'));
const INDEX  = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

// ── DECLARATIONS ────────────────────────────────────────────────────────────
// Everything the check must be told rather than can derive. Each entry needs a
// reason. An allow-list without reasons becomes a place to silence failures,
// which is worse than no check at all — so if you add a line here, say why.

// Emitted ids that are NOT controls: layout containers, scroll anchors and
// measurement targets. These render but are never meant to be bound.
const INERT_IDS = {
  'app':              'root container, owned by index.html and written by render()',
  'settings-sheet':   'sheet container — its cog, close button and scrim are bound separately',
  'sent-speak-sheet': 'sheet container — same shape as settings-sheet',
  'tabbar':           'nav container — the individual tabs carry data-nav and are bound through it',
};

// Attribute names that carry DATA rather than mark a control. They are read via
// element.dataset once the element has been found some other way, so they are
// correctly never selected on. Derived automatically from .dataset reads, but
// listed here when the distinction is not otherwise visible.
const CARRIER_NOTE = 'read via element.dataset, not selected on';

// ── NESTED CONTROLS ─────────────────────────────────────────────────────────
// A control inside another control. A tap on the inner one passes outward
// through the outer one too, so without a rule BOTH react to one tap.
//
// DES-47 — INNERMOST TAPPED CONTROL WINS, ONE ACTION PER TAP.
//
// Every pair below is declared with the control that should respond. The check
// fails on any nested pair that is NOT declared here, which is the point: a new
// control placed inside an existing one is a decision, and it should not be
// possible to make it by accident.
//
// Before v139 this was not a rule but a habit, applied two incompatible ways —
// eight inner controls called e.stopPropagation(), four outer ones instead
// checked e.target.closest(…) and bailed. The two overlapped unevenly:
// data-sent-reveal's guard listed three siblings and omitted data-sent-speak,
// which was covered only because that control happened to pick the other
// convention. Measured against the real markup, only FOUR of those twelve
// defences guarded actual nesting; the other eight defended against nesting
// that does not exist, having been written from what the markup looked like
// rather than from what it was.
const NESTED_CONTROLS = {
  'data-card > data-speak':              'data-speak — play the word, do not flip the card',
  'data-path-lesson > data-path-toggle': 'data-path-toggle — mark complete, do not open the lesson',
  'data-reveal > data-breakdown':        'data-breakdown — open the breakdown, do not reveal the English',
  'data-reveal > data-bubble':           'data-bubble — play the line, do not reveal the English',
};

// ── EXTRACTION ──────────────────────────────────────────────────────────────

// Map identifier → string literals assigned to it, so `id="${listenId}"` and
// `${dirAttr}="…"` can be resolved back to the literal the call site passed.
// Covers both object-property form (`listenId: 'quiz-listen'`) and plain
// assignment (`const backAttr = 'data-up'`). An identifier may legitimately
// hold several different literals across call sites — renderQuizCore() is
// shared by the topic quiz, Word Review and the checkpoint words activity —
// so the value is a Set, not a string.
function literalMap(src) {
  const map = {};
  const add = (k, v) => { (map[k] = map[k] || new Set()).add(v); };
  for (const m of src.matchAll(/([A-Za-z_$][\w$]*)\s*:\s*'([^']+)'/g)) add(m[1], m[2]);
  for (const m of src.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*'([^']+)'/g)) add(m[1], m[2]);
  // Template-literal assignment where the whole value is a data- attribute with
  // an interpolated value: `const dataAttr = \`data-path-open="${p.key}"\``.
  for (const m of src.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*`(data-[a-z0-9-]+)/g)) add(m[1], m[2]);
  for (const m of src.matchAll(/([A-Za-z_$][\w$]*)\s*:\s*`(data-[a-z0-9-]+)/g)) add(m[1], m[2]);
  return map;
}

// Resolve an interpolated expression to the literals it can hold.
// `o.againId` and `againId` both resolve through the trailing identifier.
function resolve(map, expr) {
  const tail = expr.trim().split('.').pop().trim();
  return map[tail] ? [...map[tail]] : [];
}

// What the render functions EMIT.
function readMarkup(src) {
  const map = literalMap(src);
  const ids = new Set();
  const attrs = new Set();
  const unresolved = [];

  // id="literal"
  for (const m of src.matchAll(/\sid="([^"${]+)"/g)) ids.add(m[1]);

  // id="${expr}" and id="prefix-${expr}"
  for (const m of src.matchAll(/\sid="([^"]*\$\{([^}]+)\}[^"]*)"/g)) {
    const [, whole, expr] = m;
    if (whole.startsWith('${') && whole.endsWith('}')) {
      const hits = resolve(map, expr);
      if (hits.length) hits.forEach(h => ids.add(h));
      else unresolved.push(`id="${whole}"`);
    } else {
      // A literal prefix with an interpolated suffix — a generated family of
      // ids (e.g. cat-anchor-${cat.key}). Not bindable by literal name and not
      // expected to be; recorded so the count is honest.
      unresolved.push(`id="${whole}" (generated family)`);
    }
  }

  // data-x="…" and valueless data-x. The trailing (?=[\s>=]) is what catches
  // the valueless form — `data-cp-act-back` closing straight into `>` — which
  // an `=`-anchored pattern silently misses.
  for (const m of src.matchAll(/\s(data-[a-z0-9-]+)(?=[\s>=])/g)) attrs.add(m[1]);

  // A whole attribute built as a template literal and injected as one unit:
  //   const dataAttr = locked ? '' : `data-path-open="${p.key}"`;
  // Matched on the backtick rather than on the assignment, because the
  // assignment shape varies — plain const, object property, ternary branch —
  // and anchoring on `=` missed the ternary form on the first run.
  for (const m of src.matchAll(/`(data-[a-z0-9-]+)=/g)) attrs.add(m[1]);

  // ${attrVar}="…" — attribute NAME supplied by the caller (renderQuizCore
  // and renderContextRow both do this so their markup can be shared without
  // sharing handlers).
  for (const m of src.matchAll(/\$\{([A-Za-z_$][\w$.]*)\}\s*=/g)) {
    const hits = resolve(map, m[1]).filter(h => h.startsWith('data-'));
    if (hits.length) hits.forEach(h => attrs.add(h));
    else unresolved.push(`\${${m[1]}}=`);
  }
  // ${attrVar} standing alone inside a tag, holding a whole attribute.
  for (const m of src.matchAll(/<[a-z]+[^>]*\$\{([A-Za-z_$][\w$.]*)\}[^>]*>/g)) {
    resolve(map, m[1]).filter(h => h.startsWith('data-')).forEach(h => attrs.add(h));
  }

  return { ids, attrs, unresolved };
}

// What the code BINDS TO.
//
// v139: this reads the DISPATCH TABLES. Before delegation it scanned
// getElementById / querySelectorAll call sites, and this is the only function
// that had to change — the assertions, the declarations and the reporting were
// written to survive the refactor and did. That was the point of building this
// file before the refactor rather than after.
//
// A table key is either '#some-id' or a bare 'data-attribute' name, so the two
// forms are separated the same way the dispatcher separates them.
function readWiring(sources) {
  const ids = new Set();
  const attrs = new Set();
  const opaque = [];

  const src = sources.join('\n');
  for (const tableName of ['CLICK_ACTIONS', 'INPUT_ACTIONS', 'CHANGE_ACTIONS']) {
    const at = src.indexOf(`const ${tableName} = {`);
    if (at < 0) { opaque.push(`${tableName} not found — dispatch table renamed?`); continue; }
    // Read to the closing brace at column 0. The tables are top-level object
    // literals, so this is unambiguous without parsing.
    const end = src.indexOf('\n};', at);
    const body = src.slice(at, end < 0 ? src.length : end);
    for (const m of body.matchAll(/^\s{2}'([^']+)'\s*:/gm)) {
      const key = m[1];
      if (key[0] === '#') ids.add(key.slice(1));
      else if (key.startsWith('data-')) attrs.add(key);
      else opaque.push(`unrecognised dispatch key '${key}' in ${tableName}`);
    }
  }

  // Elements still fetched by hand rather than dispatched to — reading a field's
  // value inside a handler, for instance. Legitimate, but each one is a control
  // the table does not describe, so they are counted rather than ignored.
  for (const s of sources) {
    for (const m of s.matchAll(/getElementById\('([^']+)'\)/g)) ids.add(m[1]);
    for (const m of s.matchAll(/getElementById\(([^)]*)\)/g)) {
      if (!/^'[^']+'$/.test(m[1].trim())) opaque.push(`getElementById(${m[1].trim()})`);
    }
    for (const m of s.matchAll(/querySelector(?:All)?\('[^']*\[(data-[a-z0-9-]+)/g)) attrs.add(m[1]);
    for (const m of s.matchAll(/querySelector(?:All)?\(([^)]*)\)/g)) {
      if (!/^'/.test(m[1].trim())) opaque.push(`querySelector(${m[1].trim()})`);
    }
  }

  return { ids, attrs, opaque };
}

// Attributes read as data carriers via element.dataset.camelCase.
function readCarriers(sources) {
  const out = new Set();
  for (const src of sources) {
    for (const m of src.matchAll(/\.dataset\.([A-Za-z0-9_$]+)/g)) {
      out.add('data-' + m[1].replace(/[A-Z]/g, c => '-' + c.toLowerCase()));
    }
  }
  return out;
}

// ── NESTING DETECTION ───────────────────────────────────────────────────────
// Finds which controls actually sit inside which, structurally, rather than by
// proximity in the source. Proximity was tried first and was useless: it
// reported 22 candidate pairs, almost all of them siblings a few lines apart.
//
// Two things make a static scan workable here. Markup is assembled from
// template literals, and fragments assigned to a local (`const chips = \`…\``)
// are inlined before the walk, so a control inside an interpolated fragment is
// still seen. And the scan is scoped PER TOP-LEVEL FUNCTION — without that,
// `englishEl` in renderSentences and `englishEl` in the Chat speak card merge
// into one fragment and invent a pair that does not exist. That false positive
// is why the scoping is not optional.
//
// What it cannot see: markup composed by calling another render function
// (`${renderFoo()}`). Nesting across such a boundary is invisible, so this is a
// floor on the true count, not a ceiling — which is the honest direction for a
// check to be wrong in, but worth knowing.
function findEndBacktick(s, i) {
  for (let k = i + 1; k < s.length; k++) {
    if (s[k] === '\\') { k++; continue; }
    if (s[k] === '`') return k;
    if (s[k] === '$' && s[k + 1] === '{') {
      let depth = 1; k += 2;
      while (k < s.length && depth) {
        if (s[k] === '{') depth++;
        else if (s[k] === '}') depth--;
        else if (s[k] === '`') k = findEndBacktick(s, k);
        k++;
      }
      k--;
    }
  }
  return -1;
}

const VOID_TAGS = /^(br|img|input|hr|meta|link|path|circle|rect|line|polyline|polygon|use|stop)$/;

function findNesting(src) {
  const found = new Map();   // "outer > inner" → function it was found in
  const marks = [...src.matchAll(/^function\s+([A-Za-z0-9_$]+)/gm)].map(m => [m.index, m[1]]);
  const regions = marks.map((m, i) => ({
    name: m[1],
    text: src.slice(m[0], i + 1 < marks.length ? marks[i + 1][0] : src.length),
  }));

  for (const region of regions) {
    const s = region.text;
    const frag = {};
    for (const m of s.matchAll(/(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*/g)) {
      const start = m.index + m[0].length;
      const semi = s.indexOf(';\n', start);
      const seg = s.slice(start, semi < 0 ? start + 3000 : semi);
      if (!seg.includes('`')) continue;
      const bits = [];
      let k = 0;
      while (true) {
        const b = seg.indexOf('`', k); if (b < 0) break;
        const e = findEndBacktick(seg, b); if (e < 0) break;
        bits.push(seg.slice(b + 1, e)); k = e + 1;
      }
      if (bits.length) frag[m[1]] = (frag[m[1]] || '') + bits.join('\n');
    }
    const inline = (t, d) => d > 6 ? t : t.replace(
      /\$\{\s*([A-Za-z_$][\w$]*)\s*\}/g,
      (all, n) => frag[n] !== undefined ? inline(frag[n], d + 1) : all
    );

    let i = 0;
    while (true) {
      const b = s.indexOf('`', i); if (b < 0) break;
      const e = findEndBacktick(s, b); if (e < 0) break;
      const html = inline(s.slice(b + 1, e), 0);
      i = e + 1;
      if (!/<[a-z]/.test(html)) continue;

      const stack = [];
      const tagRe = /<(\/?)([a-z]+)([^>]*?)(\/?)>/g;
      let m;
      while ((m = tagRe.exec(html))) {
        const [, closing, tag, attrs, selfClose] = m;
        if (closing) {
          for (let k = stack.length - 1; k >= 0; k--) {
            if (stack[k].tag === tag) { stack.length = k; break; }
          }
          continue;
        }
        const ctrl = (attrs.match(/\s(data-[a-z0-9-]+)/) || [])[1] || null;
        if (ctrl) {
          const ancestors = stack.filter(x => x.ctrl);
          if (ancestors.length) {
            found.set(`${ancestors[ancestors.length - 1].ctrl} > ${ctrl}`, region.name);
          }
        }
        if (!selfClose && !VOID_TAGS.test(tag)) stack.push({ tag, ctrl });
      }
    }
  }
  return found;
}

const markup   = readMarkup(RENDER);
const wiring   = readWiring([RENDER, APP]);
const carriers = readCarriers([RENDER, APP]);

// index.html owns #app; treat anything it declares as emitted.
for (const m of INDEX.matchAll(/\sid="([^"]+)"/g)) markup.ids.add(m[1]);

const fails = [];
const warns = [];

function fail(rule, detail) { fails.push(`${rule}: ${detail}`); }

// ── Assertion 1 — no stranded handler ──
// Bound to something no render function emits.
for (const id of [...wiring.ids].sort()) {
  if (!markup.ids.has(id)) {
    fail('STRANDED HANDLER', `getElementById('${id}') — no render function emits id="${id}"`);
  }
}
for (const a of [...wiring.attrs].sort()) {
  if (!markup.attrs.has(a)) {
    fail('STRANDED HANDLER', `querySelectorAll('[${a}]') — no render function emits ${a}`);
  }
}

// ── Assertion 2 — no unwired control ──
// Emitted but nothing binds it, and it is not a declared carrier or inert.
for (const id of [...markup.ids].sort()) {
  if (wiring.ids.has(id)) continue;
  if (INERT_IDS[id]) continue;
  fail('UNWIRED CONTROL', `id="${id}" is rendered but nothing looks it up`);
}
for (const a of [...markup.attrs].sort()) {
  if (wiring.attrs.has(a)) continue;
  if (carriers.has(a)) continue;
  fail('UNWIRED CONTROL', `${a} is rendered but nothing selects it`);
}

// ── Assertion 3 — every nested control pair is a declared decision (DES-47) ──
const nesting = findNesting(RENDER);
for (const [pair, fn] of [...nesting.entries()].sort()) {
  if (!NESTED_CONTROLS[pair]) {
    fail('UNDECLARED NESTING',
      `${pair} in ${fn}() — a control inside another control. One tap reaches ` +
      `both unless a rule says otherwise. Declare the winner in NESTED_CONTROLS ` +
      `(DES-47: innermost wins), or restructure the markup so they are siblings`);
  }
}

// ── Assertion 4 — the retired conventions stay retired (DES-47) ──
// Before v139, nested controls were handled by the inner one calling
// e.stopPropagation() or the outer one checking e.target.closest('[data-…]').
// Delegation makes both unnecessary: closest() stops at the innermost
// registered control, so nothing further out is ever reached. Either pattern
// reappearing means someone has hit a nesting problem and solved it locally
// instead of declaring it, which is how the two conventions diverged the first
// time. Comments are stripped before this runs, so discussing them is fine.
{
  const stops = (RENDER.match(/stopPropagation/g) || []).length;
  if (stops) {
    fail('RETIRED CONVENTION',
      `${stops} stopPropagation call(s) in render.js — under DES-47 the innermost ` +
      `control wins and nothing further out is reached, so this is either ` +
      `unnecessary or is papering over an undeclared nesting`);
  }
  const guards = (RENDER.match(/target\.closest\('\[data-/g) || []).length;
  if (guards) {
    fail('RETIRED CONVENTION',
      `${guards} e.target.closest('[data-…]') guard(s) in render.js — a parent ` +
      `checking what was tapped. Declare the pair in NESTED_CONTROLS instead; ` +
      `the dispatcher already resolves it`);
  }
}

// ── Hygiene: declarations that no longer describe anything ──
// An allow-list entry for an id that is no longer rendered is stale, and stale
// entries are how an allow-list turns into a place failures go to die.
for (const id of Object.keys(INERT_IDS)) {
  if (!markup.ids.has(id)) warns.push(`INERT_IDS lists '${id}' but nothing renders it — remove the entry`);
}
for (const pair of Object.keys(NESTED_CONTROLS)) {
  if (!nesting.has(pair)) warns.push(`NESTED_CONTROLS declares '${pair}' but the markup no longer nests them — remove the entry`);
}

// ── Report ──
console.log('\nWiring check — rendered controls vs. bound handlers\n');
console.log(`  emitted    ids ${String(markup.ids.size).padStart(3)}   data-attrs ${String(markup.attrs.size).padStart(3)}`);
console.log(`  bound      ids ${String(wiring.ids.size).padStart(3)}   data-attrs ${String(wiring.attrs.size).padStart(3)}`);
console.log(`  carriers   (${CARRIER_NOTE})    ${carriers.size}`);
console.log(`  declared inert ids ${Object.keys(INERT_IDS).length}`);
console.log(`  nested control pairs ${nesting.size}, all declared (DES-47: innermost wins)`);

if (markup.unresolved.length || wiring.opaque.length) {
  const n = new Set([...markup.unresolved, ...wiring.opaque]).size;
  console.log(`\n  not statically resolvable (${n}) — reported, not failed:`);
  [...new Set(markup.unresolved)].forEach(u => console.log(`    · emitted  ${u}`));
  [...new Set(wiring.opaque)].forEach(u => console.log(`    · lookup   ${u}`));
  console.log('    (each of these is a gap in what this check can prove — keep the list short)');
}

if (warns.length) {
  console.log('\n  warnings:');
  warns.forEach(w => console.log(`    ! ${w}`));
}

if (fails.length) {
  console.log(`\n✗ ${fails.length} PROBLEM${fails.length === 1 ? '' : 'S'}\n`);
  fails.forEach(f => console.log(`  ${f}`));
  console.log('');
  process.exit(1);
}

console.log('\n✓ every rendered control is bound, every handler binds something rendered\n');
