// Standing check 7 (added v120). Enumerates every class declared in styles.css
// and reports any with no textual reference anywhere in the JS.
//
// This exists because two retirement passes driven by remembered names each
// missed roughly a third of their target — v117 retired the drawer but left
// .nav-subitem, --ink-drawer, .speed-row and .speed-label behind. A sweep does
// not rely on recall.
//
// Interpolated classes (e.g. `bubble--${correct?'correct':'wrong'}`) are matched
// by their fragments, so bubble--correct / bubble--wrong report as dead and are
// the known false positives. Anything else in the output is worth checking.
//
// Usage:  node tools/dead-css.js
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const js = ['render.js', 'app.js', 'data.js']
  .map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n');

const nc = css.replace(/\/\*[\s\S]*?\*\//g, '');
const declared = new Set();
for (const m of nc.matchAll(/([^{}]+)\{/g)) {
  if (m[1].trim().startsWith('@')) continue;
  for (const c of m[1].matchAll(/\.([A-Za-z][A-Za-z0-9_-]*)/g)) declared.add(c[1]);
}
const KNOWN = new Set(['bubble--correct', 'bubble--wrong']);
const dead = [...declared].sort().filter(c =>
  !new RegExp(`(?<![\\w-])${c.replace(/[-]/g, '\\-')}(?![\\w-])`).test(js));
const unexpected = dead.filter(c => !KNOWN.has(c));

console.log(`declared classes: ${declared.size}`);
console.log(`dead: ${dead.length} (${KNOWN.size} known interpolation artefacts)`);
if (unexpected.length) {
  console.log('\nUNEXPECTED — no emitter found:');
  unexpected.forEach(c => console.log('  .' + c));
  console.log('\nCheck grouped selectors: a dead name may share a rule with live ones.');
} else {
  console.log('\nno unexpected dead classes');
}
process.exit(unexpected.length ? 1 : 0);
