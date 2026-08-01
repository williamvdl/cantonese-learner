const fs = require('fs');
const src = fs.readFileSync('app.js', 'utf8');

// ── stubs ──
let history_ = [];
global.render = () => {};
global.refreshReviewBadge = async () => {};
global.getReviewStats = async () => ({});
global.pushNav = () => history_.push('PUSH:' + snap());
global.navReplace = () => { history_.pop(); history_.push('REPL:' + snap()); };
global.window = { scrollTo: () => {} };

function snap() {
  return [state.nav, state.homeView, state.pathView, state.fromPath, !!state.checkpoint].join('|');
}

// pull goToDestination out of app.js
const start = src.indexOf('function goToDestination');
const end = src.indexOf('\n// ── Checkpoint navigation', start);
eval(src.slice(start, end));

function fresh(over) {
  global.state = Object.assign({
    nav: 'dashboard', homeView: true, pathView: 'list', topic: null,
    fromPath: false, fromPathTier: null, checkpoint: null, checkpointAct: null,
    checkpointQuiz: null, wordReview: null, drawerOpen: false,
  }, over);
  history_ = [];
}

let fails = 0;
function check(label, cond, detail) {
  console.log((cond ? '  ok   ' : '  FAIL ') + label + (detail ? '  — ' + detail : ''));
  if (!cond) fails++;
}

console.log('\n═══ nameplate → Home (replace:false) ═══');

fresh({ nav: 'topics', homeView: false, topic: 'greetings', fromPath: true, fromPathTier: 2 });
let moved = goToDestination('dashboard');
check('from a path lesson: moves', moved === true);
check('  nav is dashboard', state.nav === 'dashboard');
check('  fromPath cleared', state.fromPath === false && state.fromPathTier === null);
check('  pushed, not replaced', history_.length === 1 && history_[0].startsWith('PUSH'), history_.join());

fresh({ nav: 'path', checkpoint: { pathKey: 'beginner', stageId: 2 }, checkpointAct: 'words' });
moved = goToDestination('dashboard');
check('from inside a checkpoint: moves', moved === true);
check('  checkpoint session cleared', state.checkpoint === null && state.checkpointAct === null);
check('  nav is dashboard', state.nav === 'dashboard');

fresh({ nav: 'dashboard' });
moved = goToDestination('dashboard');
check('already on Home: NO-OPS', moved === false);
check('  no history entry stacked', history_.length === 0, history_.join());

fresh({ nav: 'dashboard' });
goToDestination('dashboard'); goToDestination('dashboard'); goToDestination('dashboard');
check('three repeat taps on Home: still no entries', history_.length === 0, history_.join());

console.log('\n═══ tab bar → destination (always pushes) ═══');

fresh({ nav: 'topics', homeView: false, settingsOpen: false });
moved = goToDestination('review');
check('tab → Review: moves', moved === true);
check('  wordReview reset', state.wordReview === null);
check('  pushed, not replaced', history_.length === 1 && history_[0].startsWith('PUSH'), history_.join());

fresh({ nav: 'topics', homeView: true, settingsOpen: false });
moved = goToDestination('topics');
check('tab → Topics while already on Topics home: no-ops', moved === false);
check('  no history entry stacked', history_.length === 0, history_.join());

fresh({ nav: 'topics', homeView: false, topic: 'greetings', settingsOpen: false });
moved = goToDestination('topics');
check('tab → Topics from INSIDE a topic: moves', moved === true);
check('  homeView restored to true', state.homeView === true);

fresh({ nav: 'path', pathView: 'timeline', settingsOpen: false });
moved = goToDestination('path');
check('tab → Path from a timeline: moves', moved === true);
check('  pathView reset to list', state.pathView === 'list');

fresh({ nav: 'path', pathView: 'list', settingsOpen: false });
moved = goToDestination('path');
check('tab → Path while already on the path list: no-ops', moved === false);

console.log('\n═══ the alreadyThere guard must not over-fire ═══');

fresh({ nav: 'dashboard', checkpoint: { pathKey: 'beginner', stageId: 1 } });
moved = goToDestination('dashboard');
check('on dashboard but inside a checkpoint: MOVES (must not no-op)', moved === true);
check('  checkpoint cleared', state.checkpoint === null);

fresh({ nav: 'dashboard', fromPath: true, fromPathTier: 3 });
moved = goToDestination('dashboard');
check('on dashboard with fromPath set: MOVES (flag must clear)', moved === true);
check('  fromPath cleared', state.fromPath === false);

// ── appended v117: the settings sheet must not survive a destination change ──
console.log('\n═══ settings sheet ═══');
fresh({ nav: 'topics', settingsOpen: true });
moved = goToDestination('review');
check('sheet open + tab tap: sheet closes', state.settingsOpen === false);
check('  and the move happens', moved === true && state.nav === 'review');

fresh({ nav: 'dashboard', settingsOpen: true });
moved = goToDestination('dashboard');
check('sheet open on Home + Home tap: MOVES (must close the sheet)', moved === true);
check('  sheet closed', state.settingsOpen === false);

console.log(fails ? '\n' + fails + ' FAILURES' : '\nall settings scenarios pass');
process.exit(fails ? 1 : 0);
