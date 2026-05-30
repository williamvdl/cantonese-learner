// ===================================================================
// app.js — state, logic, helpers
// Loaded SECOND (after data.js). Word Review storage, helpers, state, patterns,
// audio, translation, speech recognition.
// ===================================================================

// ── Word Review storage layer ─────────────────────────────────────────────────
// ALL persistent access for the Word Review bin goes through these functions.
// They now sit on top of the storage module (storage.getWordReview / setWordReview)
// rather than touching localStorage directly. Public functions below keep their
// signatures unchanged, so no caller needed updating.
//
// Stored payload shape (under STORAGE_KEYS.wordReview, versioned envelope):
//   { everUsed: bool, entries: [ {topicKey, round, wordC, missCount, correctCount, addedAt} ] }
// Entry identity = topicKey | round | wordC  (same word in two topics = two entries).
const REVIEW_GRADUATE_AT = 3;   // consecutive correct (in review) to clear a word

function _reviewEntryKey(topicKey, round, wordC) {
  return topicKey + '|' + round + '|' + wordC;
}

// Internal: read the bin payload. Sync under the hood (storage cache) but kept
// async so the public API and all callers stay unchanged.
async function _readReviewStore() {
  const data = storage.getWordReview() || { everUsed: false, entries: [] };
  return {
    everUsed: !!data.everUsed,
    entries: Array.isArray(data.entries) ? data.entries : [],
  };
}

// Internal: persist the bin payload via the storage module.
async function _writeReviewStore(data) {
  await storage.setWordReview(data);
}

// Return all bin entries (array).
async function getBin() {
  return (await _readReviewStore()).entries;
}

// Record a missed word. New word → new entry. Already-binned word → missCount++,
// correctCount reset to 0 (a fresh miss undoes review progress).
async function addMiss(topicKey, round, wordC) {
  const data = await _readReviewStore();
  data.everUsed = true;
  const key = _reviewEntryKey(topicKey, round, wordC);
  const existing = data.entries.find(e => _reviewEntryKey(e.topicKey, e.round, e.wordC) === key);
  if (existing) {
    existing.missCount += 1;
    existing.correctCount = 0;
  } else {
    data.entries.push({
      topicKey, round, wordC,
      missCount: 1,
      correctCount: 0,
      addedAt: Date.now(),
    });
  }
  await _writeReviewStore(data);
}

// Record a review-session result for one entry. Correct → correctCount++, and if
// it reaches REVIEW_GRADUATE_AT the entry is removed (graduated). Wrong → reset to 0.
// Returns { graduated: bool } so the caller can show feedback.
async function recordReviewResult(topicKey, round, wordC, wasCorrect) {
  const data = await _readReviewStore();
  const key = _reviewEntryKey(topicKey, round, wordC);
  const entry = data.entries.find(e => _reviewEntryKey(e.topicKey, e.round, e.wordC) === key);
  if (!entry) { return { graduated: false }; }
  let graduated = false;
  if (wasCorrect) {
    entry.correctCount += 1;
    if (entry.correctCount >= REVIEW_GRADUATE_AT) {
      data.entries = data.entries.filter(e => e !== entry);
      graduated = true;
    }
  } else {
    entry.correctCount = 0;
  }
  await _writeReviewStore(data);
  return { graduated };
}

// Remove an entry outright — used to silently drop words that can no longer be
// resolved (their topic/round/word no longer exists in the topic JSON).
async function dropBinEntry(topicKey, round, wordC) {
  const data = await _readReviewStore();
  const key = _reviewEntryKey(topicKey, round, wordC);
  data.entries = data.entries.filter(e => _reviewEntryKey(e.topicKey, e.round, e.wordC) !== key);
  await _writeReviewStore(data);
}

// Stats for the menu badge and empty-state logic.
// liveCount = words currently in the bin; everUsed = bin has been used at least once.
async function getReviewStats() {
  const data = await _readReviewStore();
  return { liveCount: data.entries.length, everUsed: data.everUsed };
}

// ── Round accessors — single point of truth for "what content is in topic+round" ──
// These assume the topic has been loaded; return safe defaults otherwise.
function getAvailableRounds(topic) {
  return store.availableRounds(topic);
}
function getRoundWords(topic, round) {
  return store.roundData(topic, round)?.words || [];
}
function getRoundSentences(topic, round) {
  return store.roundData(topic, round)?.sentences || [];
}
function getRoundConvo(topic, round) {
  return store.roundData(topic, round)?.convo || null;
}
// The conversation the chat UI should render: the checkpoint consolidation convo
// when the checkpoint Conversation activity is open, otherwise the current
// topic/round convo. Lets the existing chat renderer + handlers serve both
// unchanged — they call this instead of getRoundConvo directly.
function activeConvoSource() {
  if (state.checkpoint && state.checkpointAct === 'convo') {
    const cp = getStageCheckpoint(state.checkpoint.pathKey, state.checkpoint.stageId);
    if (cp && cp.convo) return store.pathConvo(cp.convo);
    return null;
  }
  return getRoundConvo(state.topic, state.currentRound);
}
function getRoundNote(topic, round) {
  return store.roundData(topic, round)?.note || null;
}
function getTopicsByCategory(categoryKey) {
  return store.topicsByCategory(categoryKey);
}

// ── Lesson shape helper ──
// Synthesises the legacy { label, icon, color, words, note } object that the
// existing render functions expect, drawn from the cached topic file.
// Falls back to index metadata if topic file isn't loaded yet.
function lessonShape(key) {
  const meta = store.topicMeta(key);
  if (!meta) return { label: '', icon: '', color: '#888', words: [], note: null };
  const r1 = store.roundData(key, 1) || {};
  return {
    label: meta.label,
    icon:  meta.icon,
    color: meta.color,
    words: r1.words || [],
    note:  r1.note  || null,
  };
}

const TONES = {
  "1":{"color":"#E74C3C","desc":"High level",  "ex":"詩 si1"},
  "2":{"color":"#E67E22","desc":"High rising", "ex":"史 si2"},
  "3":{"color":"#c8a200","desc":"Mid level",   "ex":"試 si3"},
  "4":{"color":"#27AE60","desc":"Low falling", "ex":"時 si4"},
  "5":{"color":"#2980B9","desc":"Low rising",  "ex":"市 si5"},
  "6":{"color":"#8E44AD","desc":"Low level",   "ex":"事 si6"},
};

// ── Patterns ──────────────────────────────────────────────────────────────────
// Pattern + drill content now lives in /data/patterns.json, loaded once on init
// by store.loadPatterns(). Access the array via store.patterns. The schema is
// documented in the Pattern Drill section below.
// ── Audio ─────────────────────────────────────────────────────────────────────
let _voices = null;

function loadVoices() {
  return new Promise(resolve => {
    const v = window.speechSynthesis.getVoices();
    if (v.length > 0) { _voices = v; resolve(v); return; }
    const handler = () => {
      _voices = window.speechSynthesis.getVoices();
      resolve(_voices);
      window.speechSynthesis.removeEventListener('voiceschanged', handler);
    };
    window.speechSynthesis.addEventListener('voiceschanged', handler);
    setTimeout(() => { _voices = window.speechSynthesis.getVoices(); resolve(_voices); }, 2500);
  });
}

function pickVoicePair(voices) {
  const zh = voices.filter(v => v.lang === 'zh-HK' || v.lang === 'zh-TW' || v.lang.startsWith('zh'));
  if (zh.length === 0) return { a: null, b: null };
  // Primary voice: prefer Cantonese (zh-HK), then any other zh.
  // Without this, systems that list zh-CN first (e.g. Chrome on Windows) would
  // play Mandarin audio even though a perfectly good zh-HK voice exists.
  const a = zh.find(v => v.lang === 'zh-HK')
          || zh.find(v => v.lang === 'zh-TW')
          || zh[0];
  // Secondary voice for the second speaker: prefer another zh-HK voice if
  // there's more than one, otherwise any other zh voice, otherwise reuse `a`.
  const sameLang = zh.filter(v => v.lang === a.lang && v !== a);
  const b = sameLang[0] || zh.find(v => v !== a) || null;
  return { a, b };
}

// Some pattern frames are written as two-speaker dialogues, e.g.
//   "A：你叫乜名？B：我叫William。"
// The on-screen text keeps the A:/B: labels (they make the exchange clear to
// read), but those letters must NOT be voiced — TTS would literally say "A… B…".
// Strip the speaker labels (both half-width "A:" and full-width "Ａ：") before
// speaking, leaving a brief pause where the label was so the two lines don't run
// together. Purely cosmetic for audio; the displayed text is untouched.
function sanitizeForSpeech(text) {
  if (!text) return text;
  return String(text)
    .replace(/[ABＡＢ]\s*[：:]\s*/g, ' ')   // drop "A:" / "B:" / full-width variants
    .replace(/\s{2,}/g, ' ')
    .trim();
}

async function speak(text, onEnd, voiceOverride, pitchOverride, langOverride) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const voices = _voices || await loadVoices();
  const utt = new SpeechSynthesisUtterance(sanitizeForSpeech(text));
  utt.lang = langOverride || 'zh-HK';
  const rates = { slow: 0.6, normal: 0.8, fast: 1.1 };
  utt.rate  = rates[state.speed] || 0.8;
  utt.pitch = pitchOverride !== undefined ? pitchOverride : 1.0;
  const { a } = pickVoicePair(voices);
  if (voiceOverride) utt.voice = voiceOverride;
  else if (a) utt.voice = a;
  if (onEnd) utt.onend = onEnd;
  window.speechSynthesis.speak(utt);
}

// Speak as a specific conversation speaker — uses subtle pitch variation
async function speakAs(text, isUser, onEnd) {
  const voices = _voices || await loadVoices();
  const { a } = pickVoicePair(voices);
  const pitch = isUser ? 0.85 : 1.1;
  speak(text, onEnd, a, pitch, 'zh-HK');
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length-1; i>0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

function colorJyutping(text) {
  return text.split(' ').map(syl => {
    const tone = syl.match(/[1-6]/);
    const color = tone ? TONES[tone[0]].color : '#777';
    return `<span style="color:${color};font-weight:700">${syl}</span>`;
  }).join(' ');
}

// ── State ─────────────────────────────────────────────────────────────────────
let state = {
  speed: 'normal',
  nav: 'topics',
  drawerOpen: false,
  homeView: true,                 // true = show home screen, false = inside a topic
  selectedCategory: 'all',        // 'all' or a category key
  currentRound: 1,
  pathView: 'list',               // 'list' = paths list, 'timeline' = inside a path
  activePath: 'beginner',         // which path is being viewed
  pathProgress: {},               // { beginner: { greetings:true, ... }, ... } — loaded from localStorage
  fromPath: false,                // true when user entered a topic via the Learning Path
  fromPathTier: null,             // the tier of the path step they entered — preserved if they switch tier mid-study
  pathToast: null,
  headerDetailsOpen: false,             // ⓘ in header expands tone legend + speed settings
  voiceBannerDismissed: false,          // user has tapped × on the voice banner                // { text, kind } — transient completion overlay; cleared after timeout
  translate: {
    direction:   'en-yue',     // 'en-yue' | 'yue-en'
    inputText:   '',
    result:      null,
    loading:     false,
    error:       null,
    showApiKey:  false,
    listening:   false,
  },
  topic: 'greetings',
  mode:  'study',
  tab:   'words',          // 'words' | 'convo'
  flipped: {},
  speaking: null,
  sentenceBreakdownOpen: {},
  sentenceRevealed: {},
  patternRevealed: {},
  patternBreakdownOpen: {},
  voiceInfo: null,
  quiz: null,
  // Word Review session — null when not in a session. Shape set by startWordReview().
  wordReview: null,
  // Pattern Drill session — null when not in a session. Shape set by startPatternDrill().
  patternDrill: null,
  // Checkpoint (Stage 3) — null when no checkpoint hub is open.
  //   checkpoint:     { pathKey, stageId, cpId } | null  — which hub is open
  //   checkpointAct:  'words' | 'patterns' | 'convo' | null — which activity within it
  //   checkpointQuiz: the Words-activity quiz session (own shape) | null
  checkpoint: null,
  checkpointAct: null,
  checkpointQuiz: null,
  // Patterns page is a grouped reference library (Stage 4). These track which
  // groups / frames are expanded (all collapsed by default). Keyed by group name
  // and by `${groupIdx}-${frameIdx}`.
  patternGroupsOpen: {},
  patternFramesOpen: {},
  // Cached {liveCount, everUsed} for the menu badge — refreshed by refreshReviewBadge().
  reviewBadge: { liveCount: 0, everUsed: false },
  convo: {
    convMode: 'read',
    playingLine: null,
    gapAnswers: {},
    bubbleRevealed: {},
    breakdownOpen: {},
    speakStep: 0,
    speakStatus: 'idle',     // 'idle' | 'listening' | 'matched' | 'mismatch'
    speakHeard: '',
    speakAutoPlayed: false,
    speakRevealed: {},
  },
};

// ── Navigation history ────────────────────────────────────────────────────────
// Makes the phone/browser BACK button step back through in-app screens instead
// of exiting the whole app. The app is a single-page app, so the browser only
// knows about one page unless we tell it otherwise.
//
// How it works:
//  - NAV_FIELDS lists the state fields that together define "which screen".
//  - navSnapshot() captures those fields into a plain object.
//  - pushNav() is called AFTER a navigation handler has mutated state; it pushes
//    the new snapshot onto the browser history stack via history.pushState.
//  - the popstate listener (in render.js) fires when BACK is pressed; it reads
//    the snapshot the browser hands back and restores those fields, then renders.
//
// Design note: navigation handlers keep their existing mutation logic untouched.
// pushNav() only OBSERVES the resulting state and records it — it does not change
// how navigation works, only makes the browser aware of it. Low-risk by design.
const NAV_FIELDS = [
  'nav', 'drawerOpen', 'homeView', 'pathView', 'activePath',
  'topic', 'currentRound', 'fromPath', 'fromPathTier',
  'mode', 'tab', 'selectedCategory',
  'checkpoint', 'checkpointAct',
];

// Capture the current navigation-relevant state into a plain snapshot object.
function navSnapshot() {
  const snap = {};
  NAV_FIELDS.forEach(f => { snap[f] = state[f]; });
  return snap;
}

// Apply a snapshot back onto state (used by the popstate/back handler).
function applyNavSnapshot(snap) {
  if (!snap) return;
  NAV_FIELDS.forEach(f => {
    if (f in snap) state[f] = snap[f];
  });
}

// True once the initial history entry has been seeded by init().
let _navReady = false;

// Push the current screen onto the browser history stack. Call this AFTER a
// navigation handler has finished mutating state. Safe to call before init has
// seeded history (it simply no-ops until then).
function pushNav() {
  if (!_navReady) return;
  try {
    history.pushState(navSnapshot(), '');
  } catch (e) {
    // pushState can throw in rare sandboxed contexts — navigation still works,
    // only the back-button integration is unavailable.
  }
}

// Seed the very first history entry. Called once by init(). Uses replaceState so
// the app's starting screen IS the bottom of the history stack — pressing back
// from there exits the app, which is correct.
function initNavHistory() {
  try {
    history.replaceState(navSnapshot(), '');
  } catch (e) { /* see pushNav */ }
  _navReady = true;
}

// Replace the current history entry with the current screen, instead of pushing
// a new one. Used when navigating FROM the drawer: the drawer-open entry should
// be overwritten by the destination, so BACK doesn't reopen the drawer.
function navReplace() {
  if (!_navReady) return;
  try {
    history.replaceState(navSnapshot(), '');
  } catch (e) { /* see pushNav */ }
}

// Close the drawer. If the drawer-open pushed a history entry we step back
// through it (keeps the stack honest); otherwise just close directly.
function closeDrawer() {
  if (!state.drawerOpen) return;
  if (_navReady) {
    history.back();          // triggers popstate → restores pre-drawer snapshot
  } else {
    state.drawerOpen = false;
    render();
  }
}

function getQuizInitState(words) {
  // One question per word — no artificial cap. Shuffle so order varies each run.
  const queue = shuffle(words);
  return {
    queue,
    idx: 0,
    score: 0,
    selected: null,
    done: false,
    choices: buildChoices(queue[0], words),
    wrongAnswers: [],   // [{ word: <wordObj>, chosen: <chosen option obj> }]
    direction: loadQuizDirection(),   // 'zh-en' | 'en-zh' | 'listen-en'
  };
}

// Persistence for the user's preferred quiz direction — via the storage module.
function loadQuizDirection() {
  return storage.getQuizDirection() || 'zh-en';
}
function saveQuizDirection(dir) {
  storage.setQuizDirection(dir);
}

function buildChoices(answer, all) {
  const others = shuffle(all.filter(w => w.c !== answer.c)).slice(0, 3);
  return shuffle([...others, answer]);
}

// Move to the next quiz question, or mark done.
function advanceQuiz() {
  const q = state.quiz;
  if (!q) return;
  const next = q.idx + 1;
  if (next >= q.queue.length) {
    q.done = true;
  } else {
    q.idx = next;
    q.selected = null;
    q.choices = buildChoices(q.queue[next], getRoundWords(state.topic, state.currentRound));
  }
  render();
}

// ── Word Review session ───────────────────────────────────────────────────────
const REVIEW_SESSION_CAP = 20;   // max words per review session; oldest-missed first
                                 // BACKLOG: make this user-configurable in Settings

// Refresh the cached menu badge counts. Call after any bin mutation that the user
// should see reflected (e.g. finishing a quiz, finishing a review session).
async function refreshReviewBadge() {
  state.reviewBadge = await getReviewStats();
}

// Build and start a Word Review session. Pulls the bin, takes the oldest-missed
// REVIEW_SESSION_CAP words, loads their topics, rehydrates each word from its
// topic JSON, and silently drops any entry that can no longer be resolved.
async function startWordReview() {
  const bin = await getBin();
  // Oldest-missed first so long-standing misses surface before recent ones.
  const ordered = bin.slice().sort((a, b) => a.addedAt - b.addedAt);
  const picked = ordered.slice(0, REVIEW_SESSION_CAP);

  // Load every topic referenced by the picked entries (parallel, cached).
  const topicKeys = [...new Set(picked.map(e => e.topicKey))];
  try {
    await store.loadTopics(topicKeys);
  } catch (e) {
    // A topic failed to load — individual rehydration below will skip what it must.
  }

  // Rehydrate: pair each bin entry with its live word object from the topic JSON.
  // If the topic/round/word no longer exists, silently drop the entry from the bin.
  const items = [];
  for (const entry of picked) {
    const words = getRoundWords(entry.topicKey, entry.round);
    const word = words.find(w => w.c === entry.wordC);
    if (!word) {
      await dropBinEntry(entry.topicKey, entry.round, entry.wordC);
      continue;
    }
    items.push({ entry, word, pool: words });
  }

  if (!items.length) {
    // Everything we picked was unresolvable (or the bin was empty) — show the
    // appropriate empty state rather than an empty session.
    state.wordReview = null;
    await refreshReviewBadge();
    render();
    return;
  }

  const queue = shuffle(items);
  state.wordReview = {
    queue,
    idx: 0,
    selected: null,
    done: false,
    correctThisSession: 0,
    graduatedThisSession: 0,
    direction: loadQuizDirection(),               // shares the quiz's saved preference
    choices: buildReviewChoices(queue[0]),
  };
  // A review session is one "screen" for history. Pushing here means the phone
  // BACK button (and the on-screen Done button, which calls history.back) exits
  // the session back to the landing screen. The popstate handler clears
  // state.wordReview whenever it lands on the review screen via back.
  pushNav();
  render();
}

// Build the 4 choice options for a review item — 3 distractors drawn from the
// word's OWN topic round pool, plus the answer, shuffled. Mirrors buildChoices.
function buildReviewChoices(item) {
  const others = shuffle(item.pool.filter(w => w.c !== item.word.c)).slice(0, 3);
  return shuffle([...others, item.word]);
}

// Advance the review session to the next word, or mark it done.
function advanceWordReview() {
  const wr = state.wordReview;
  if (!wr) return;
  const next = wr.idx + 1;
  if (next >= wr.queue.length) {
    wr.done = true;
    refreshReviewBadge().then(render);
    return;
  }
  wr.idx = next;
  wr.selected = null;
  wr.choices = buildReviewChoices(wr.queue[next]);
  render();
}

// ── Pattern Drill session ─────────────────────────────────────────────────────
// A drill quizzes sentence patterns: a pattern frame with one slot blanked, the
// learner picks the vocab that fills it. Built on renderQuizCore, same as the
// quiz and Word Review.
//
// MULTI-DRILL MODEL: a pattern carries a `drills` array — one frame, but several
// topic-scoped fill-in instances, each with its own answer/distractors/topics.
// This keeps every drill's answer + distractors genuinely the tagged topic's own
// vocabulary while still letting one grammatical frame serve many topics.
// A pattern without a `drills` array (or an empty one) is reference-only.
//
// state.patternDrill shape (null when not in a drill):
//   { queue: [{pattern, drill},…], idx, selected (choice index|null), done,
//     score, topicKey, choices: [option,…] }
// Each queue entry pairs the parent pattern (for its label/structure) with the
// specific drill being asked. A drill option is a plain { c, j, e } word object;
// the answer object is drill.answer, the distractors are drill.distractors.

// Build the 4 shuffled choices for one drill: the answer + its 3 distractors.
function buildDrillChoices(drill) {
  return shuffle([drill.answer, ...drill.distractors]);
}

// Every drill tagged to a topic, as {pattern, drill} pairs. A pattern may
// contribute more than one drill if multiple of its drills tag the topic.
// Single source of truth for "what does this topic drill" — used by the
// Learn-tab patterns section and the topic-scoped drill.
function getTopicDrills(topicKey) {
  const out = [];
  for (const p of store.patterns) {
    if (!Array.isArray(p.drills)) continue;
    for (const dr of p.drills) {
      if (Array.isArray(dr.topics) && dr.topics.includes(topicKey)) {
        out.push({ pattern: p, drill: dr });
      }
    }
  }
  return out;
}

// Distinct patterns that have at least one drill tagged to the topic.
// Kept for callers that need patterns rather than drills (e.g. future stages).
function getTopicPatterns(topicKey) {
  return [...new Set(getTopicDrills(topicKey).map(x => x.pattern))];
}

// Start a pattern drill session.
//  - No argument        → drills every drillable pattern, one drill each (legacy / library).
//  - topicKey (string)  → drills only that topic's drills (the Learn-tab drill).
//  - { kind:'checkpoint', stage } → drills the stage's pooled drills, capped (Stage 3).
// The session records its scope so the drill view knows where "back" returns and
// the done screen knows what to offer.
function startPatternDrill(scope) {
  let drillable, scopeKind, topicKey = null, checkpointStage = null;

  if (scope && typeof scope === 'object' && scope.kind === 'checkpoint') {
    // Checkpoint scope: pooled drills across the stage's topics, capped.
    scopeKind = 'checkpoint';
    checkpointStage = scope.stage;
    const cp = checkpointStage.checkpoint || {};
    const cap = cp.drillCap || CHECKPOINT_DRILL_CAP_DEFAULT;
    drillable = shuffle(getCheckpointDrills(checkpointStage)).slice(0, cap);
  } else if (scope) {
    // Topic scope (string topicKey) — existing Learn-tab behaviour.
    scopeKind = 'topic';
    topicKey = scope;
    drillable = getTopicDrills(topicKey);
  } else {
    // Legacy / library scope — one drill per tier-1 drillable pattern.
    scopeKind = 'all';
    drillable = store.patterns.filter(p => p.tier === 1 && Array.isArray(p.drills) && p.drills.length)
        .map(p => ({ pattern: p, drill: p.drills[0] }));
  }

  if (!drillable.length) { state.patternDrill = null; render(); return; }
  const queue = scopeKind === 'checkpoint' ? drillable : shuffle(drillable);
  state.patternDrill = {
    queue,
    idx: 0,
    selected: null,
    done: false,
    score: 0,
    topicKey: topicKey,                 // null unless topic scope (keeps existing callers working)
    scopeKind: scopeKind,               // 'topic' | 'all' | 'checkpoint'
    checkpointStage: checkpointStage,   // the stage object when checkpoint-scoped
    missed: [],                         // {pattern,drill} pairs answered wrong — feeds diagnostic
    choices: buildDrillChoices(queue[0].drill),
  };
  // A drill session is one "screen" for the back button — entering it pushes a
  // history entry, so phone BACK (and the on-screen exit) leaves the session.
  pushNav();
  render();
}

// Advance the drill to the next pattern, or mark the session done.
function advancePatternDrill() {
  const pd = state.patternDrill;
  if (!pd) return;
  const next = pd.idx + 1;
  if (next >= pd.queue.length) {
    pd.done = true;
    render();
    return;
  }
  pd.idx = next;
  pd.selected = null;
  pd.choices = buildDrillChoices(pd.queue[next].drill);
  render();
}

function playAllConvo(lines, idx) {
  if (idx >= lines.length) { state.convo.playingLine = null; render(); return; }
  state.convo.playingLine = idx;
  render();
  const line = lines[idx];
  speakAs(line.c, line.u, () => setTimeout(() => playAllConvo(lines, idx + 1), 500));
}

// ── Translation (provider-abstracted) ─────────────────────────────────────────
// Configuration — change provider here to swap. Each provider implementation
// returns the same standardised shape: { zh, jp, en, bd, pattern? }
const TRANSLATION_PROVIDER = 'gemini';   // 'gemini' | 'claude' | 'openai'

function getApiKey() {
  return storage.getApiKey() || '';
}
function setApiKey(key) {
  storage.setApiKey(key);
}

// Path progress persistence — via the storage module.

// Composite lesson key: 'greetings-t1', 'greetings-t2' etc.
// Allows the same topic at multiple tiers within a single path.
function lessonKey(topicKey, tier) {
  return topicKey + '-t' + tier;
}

function loadPathProgress() {
  const p = storage.getPathProgress();
  return (p && typeof p === 'object') ? p : {};
}
function savePathProgress() {
  storage.setPathProgress(state.pathProgress);
}

// One-time migration: convert legacy progress keys (no tier suffix) to composite keys.
// Pre-refactor data was stored as pathProgress.beginner.greetings = true.
// Post-refactor it should be pathProgress.beginner['greetings-t1'] = true.
// Legacy entries are assumed to be tier 1 since that's all the previous build referenced.
function migratePathProgressIfNeeded() {
  let changed = false;
  Object.keys(state.pathProgress).forEach(pathKey => {
    const bucket = state.pathProgress[pathKey];
    if (!bucket || typeof bucket !== 'object') return;
    Object.keys(bucket).forEach(key => {
      // Composite keys end with -t<number>. Anything else is legacy.
      if (!/-t\d+$/.test(key)) {
        bucket[lessonKey(key, 1)] = bucket[key];
        delete bucket[key];
        changed = true;
      }
    });
  });
  if (changed) savePathProgress();
}

function isLessonComplete(pathKey, topicKey, tier) {
  const bucket = state.pathProgress[pathKey];
  return !!(bucket && bucket[lessonKey(topicKey, tier)]);
}
function toggleLessonComplete(pathKey, topicKey, tier) {
  if (!state.pathProgress[pathKey]) state.pathProgress[pathKey] = {};
  const k = lessonKey(topicKey, tier);
  if (state.pathProgress[pathKey][k]) {
    delete state.pathProgress[pathKey][k];
  } else {
    state.pathProgress[pathKey][k] = true;
  }
  savePathProgress();
}
function pathCompleteCount(pathKey) {
  const p = state.pathProgress[pathKey];
  if (!p) return 0;
  const path = store.paths.find(x => x.key === pathKey);
  if (!path) return 0;
  return path.lessons.filter(l => p[lessonKey(l.topic, l.round)]).length;
}
// Returns the first incomplete lesson as { topic, tier }, or null if all done.
function nextIncompleteLesson(pathKey) {
  const path = store.paths.find(x => x.key === pathKey);
  if (!path) return null;
  const p = state.pathProgress[pathKey] || {};
  const next = path.lessons.find(l => !p[lessonKey(l.topic, l.round)]);
  return next ? { topic: next.topic, tier: next.round } : null;
}

// Return { path, step, total, isLast, nextStep, nextTopic } for the current path-mode state,
// or null if the user isn't currently studying inside a path. `step` is 1-indexed.
function getPathContext() {
  if (!state.fromPath) return null;
  const path = (store.paths || []).find(p => p.key === state.activePath);
  if (!path) return null;
  const tier = state.fromPathTier || state.currentRound;
  const stepIdx = path.lessons.findIndex(l => l.topic === state.topic && l.round === tier);
  if (stepIdx < 0) return null;
  const total = path.lessons.length;
  const isLast = stepIdx === total - 1;
  const nextLesson = isLast ? null : path.lessons[stepIdx + 1];
  const nextTopicMeta = nextLesson ? store.topicMeta(nextLesson.topic) : null;
  return {
    path,
    step: stepIdx + 1,
    total,
    isLast,
    nextStep: nextLesson,                          // { topic, round } | null
    nextTopicLabel: nextTopicMeta ? nextTopicMeta.label : null,
    nextTopicIcon:  nextTopicMeta ? nextTopicMeta.icon  : null,
    isComplete: isLessonComplete(state.activePath, state.topic, tier),
  };
}

// ── Checkpoint module (Stage 3) ───────────────────────────────────────────────
// A "checkpoint" is the capstone of a stage (a named cluster of ~4 topics in a
// path). It opens a small hub of three independent activities — Words (recall),
// Patterns (apply), Conversation (produce) — none required.
//
// SCALABILITY: stages + checkpoints live entirely in learning_paths.json. Adding
// a checkpoint to another stage is a DATA edit — no code change. This module is
// the only code that knows the checkpoint storage shape, so a future upgrade from
// done-flags to a richer score/history store touches only here + a migration.
//
// STORAGE: completion is stored as done-flags under the existing pathProgress
// bucket, namespaced 'cp:<checkpointId>:<activity>' so they never collide with
// lessonKey() entries. The accessors below return/accept booleans today; the
// storage VALUE could later become an object ({done,score,missedIds,ts}) by
// bumping STORAGE_SCHEMA.pathProgress and adding a _migrate case — no call-site
// changes, because callers only ever ask "is this activity done?".

const CHECKPOINT_DRILL_CAP_DEFAULT = 15;
const CHECKPOINT_WORD_CAP_DEFAULT  = 25;
const CHECKPOINT_ACTIVITIES = ['words', 'patterns', 'convo'];

// All stages for a path (empty array if the path has none — renders as a flat list).
function getPathStages(pathKey) {
  const path = (store.paths || []).find(p => p.key === pathKey);
  return (path && Array.isArray(path.stages)) ? path.stages : [];
}
// Find a stage object by id within a path.
function getStage(pathKey, stageId) {
  return getPathStages(pathKey).find(s => s.id === stageId) || null;
}
// The checkpoint object for a stage, or null if the stage has none.
function getStageCheckpoint(pathKey, stageId) {
  const s = getStage(pathKey, stageId);
  return (s && s.checkpoint) ? s.checkpoint : null;
}

// Storage key for one checkpoint activity flag.
function checkpointFlagKey(cpId, activity) {
  return 'cp:' + cpId + ':' + activity;
}
function checkpointActivityDone(pathKey, cpId, activity) {
  const bucket = state.pathProgress[pathKey];
  return !!(bucket && bucket[checkpointFlagKey(cpId, activity)]);
}
function setCheckpointActivityDone(pathKey, cpId, activity, val) {
  if (!state.pathProgress[pathKey]) state.pathProgress[pathKey] = {};
  const k = checkpointFlagKey(cpId, activity);
  if (val) state.pathProgress[pathKey][k] = true;
  else delete state.pathProgress[pathKey][k];
  savePathProgress();
}
// Derived progress for a checkpoint: { done, total, complete, available }.
// `available` is the list of activities this checkpoint actually offers (a stage
// with no authored convo offers only words + patterns).
function checkpointProgress(pathKey, stageId) {
  const cp = getStageCheckpoint(pathKey, stageId);
  const stage = getStage(pathKey, stageId);
  if (!cp || !stage) return { done: 0, total: 0, complete: false, available: [] };
  const available = CHECKPOINT_ACTIVITIES.filter(a => {
    if (a === 'convo') return !!(cp.convo && store.pathConvo(cp.convo));
    if (a === 'words') return getCheckpointWords(stage).length > 0;
    if (a === 'patterns') return getCheckpointDrills(stage).length > 0;
    return false;
  });
  const done = available.filter(a => checkpointActivityDone(pathKey, cp.id, a)).length;
  return { done, total: available.length, complete: available.length > 0 && done === available.length, available };
}

// Build the checkpoint's drill queue: all drills across the stage's topics,
// deduped by drill identity, shuffled, capped. Reuses getTopicDrills so these are
// the exact same validated {pattern, drill} pairs the topic drill uses.
function getCheckpointDrills(stage) {
  const seen = new Set();
  const out = [];
  for (const topicKey of (stage.topics || [])) {
    for (const pair of getTopicDrills(topicKey)) {
      // Dedupe by parent label + frame + english — a drill tagged to two topics
      // in the same stage must not appear twice.
      const id = pair.pattern.label + '|' + pair.drill.frameC + '|' + pair.drill.english;
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(pair);
    }
  }
  return out;
}
function getCheckpointWords(stage) {
  // Words pool: vocab across ALL rounds of the stage's topics, deduped by Chinese
  // surface form. (All rounds, not just round 1 — the pattern drills draw on the
  // topic's full vocabulary, so the Words review should cover the same universe.)
  const seen = new Set();
  const out = [];
  for (const topicKey of (stage.topics || [])) {
    const t = store.topicCache[topicKey];
    const rounds = t ? Object.keys(t.rounds) : ['1'];
    for (const r of rounds) {
      const words = getRoundWords(topicKey, r) || [];
      for (const w of words) {
        if (seen.has(w.c)) continue;
        seen.add(w.c);
        out.push(w);
      }
    }
  }
  return out;
}

// ── Checkpoint navigation ─────────────────────────────────────────────────────
// Open a checkpoint hub. Records which checkpoint, clears any activity.
function openCheckpoint(pathKey, stageId) {
  const cp = getStageCheckpoint(pathKey, stageId);
  if (!cp) return;
  state.checkpoint = { pathKey, stageId, cpId: cp.id };
  state.checkpointAct = null;
  pushNav();
  render();
}
function closeCheckpoint() {
  // Route through history so the back stack stays consistent.
  history.back();
}

// ── Checkpoint Words activity (reuses the quiz session shape) ─────────────────
// Builds a quiz session over the capped, shuffled word pool. Mirrors the existing
// word quiz session shape so renderQuizCore can render it unchanged.
function startCheckpointWords() {
  const cpState = state.checkpoint;
  if (!cpState) return;
  const stage = getStage(cpState.pathKey, cpState.stageId);
  const cp = getStageCheckpoint(cpState.pathKey, cpState.stageId);
  const cap = (cp && cp.wordCap) || CHECKPOINT_WORD_CAP_DEFAULT;
  const pool = shuffle(getCheckpointWords(stage)).slice(0, cap);
  if (!pool.length) return;
  state.checkpointAct = 'words';
  state.checkpointQuiz = {
    pool,
    idx: 0,
    selected: null,
    done: false,
    score: 0,
    direction: storage.getQuizDirection() || 'zh-en',
    choices: buildCheckpointWordChoices(pool, 0),
    missed: [],   // word objects answered wrong — feeds the diagnostic
  };
  pushNav();
  render();
}
// 4 choices for a word quiz question: the answer + 3 distractors drawn from the pool.
function buildCheckpointWordChoices(pool, idx) {
  const answer = pool[idx];
  const others = shuffle(pool.filter((_, i) => i !== idx)).slice(0, 3);
  return shuffle([answer, ...others]);
}
function advanceCheckpointWords() {
  const q = state.checkpointQuiz;
  if (!q) return;
  const next = q.idx + 1;
  if (next >= q.pool.length) { q.done = true; render(); return; }
  q.idx = next;
  q.selected = null;
  q.choices = buildCheckpointWordChoices(q.pool, next);
  render();
}

// ── Checkpoint Patterns activity ──────────────────────────────────────────────
// Reuses the pattern-drill engine via a checkpoint scope. startPatternDrill (below,
// extended) builds the queue from getCheckpointDrills with the cap applied.

// ── Diagnostic (session-only, no persistence) ─────────────────────────────────
// Given a list of missed items (word objects or {pattern,drill} pairs) and the
// stage, find the topic that accounts for the most misses. Returns { topicKey,
// label, count } only when a topic has 2+ misses (a genuine signal), else null.
function checkpointDiagnostic(stage, missedTopicKeys) {
  if (!missedTopicKeys || !missedTopicKeys.length) return null;
  const counts = {};
  for (const tk of missedTopicKeys) counts[tk] = (counts[tk] || 0) + 1;
  let best = null;
  for (const tk of Object.keys(counts)) {
    if (!best || counts[tk] > counts[best]) best = tk;
  }
  if (!best || counts[best] < 2) return null;
  return { topicKey: best, label: (lessonShape(best) || {}).label || best, count: counts[best] };
}
// Which stage topic does a word belong to? (first stage topic whose round-1 vocab
// contains this Chinese surface form). Used to attribute word-quiz misses.
function wordTopicInStage(stage, word) {
  for (const tk of (stage.topics || [])) {
    const t = store.topicCache[tk];
    const rounds = t ? Object.keys(t.rounds) : ['1'];
    for (const r of rounds) {
      const words = getRoundWords(tk, r) || [];
      if (words.some(w => w.c === word.c)) return tk;
    }
  }
  return null;
}

function buildPrompt(text, direction) {
  const isToYue = direction === 'en-yue';
  const sourceLabel = isToYue ? 'English' : 'Cantonese (in characters or jyutping)';
  const targetLabel = isToYue ? 'Cantonese' : 'English';
  return `You are a Cantonese language learning assistant. Translate the following ${sourceLabel} text to ${targetLabel}.

Important rules:
- Use COLLOQUIAL Cantonese (HK style), not Mandarin/Standard Written Chinese
- Use Cantonese-specific characters where appropriate (e.g. 嘅, 咗, 嚟, 喺, 唔, 啲, 咁, 嗰)
- Use jyutping romanization (with tone numbers 1-6)
- Provide a word-by-word breakdown grouping characters into meaningful chunks

Input: "${text}"

Respond ONLY with valid JSON in this exact format (no markdown, no code fences, no commentary):
{
  "zh": "Cantonese characters here",
  "jp": "jyutping with tone numbers here",
  "en": "English meaning here",
  "bd": [
    {"c": "chunk in Chinese", "j": "chunk in jyutping", "e": "chunk meaning in English"}
  ]
}`;
}

function parseAiResponse(text) {
  // Strip code fences if present, find first { ... } block
  const cleaned = text.replace(/```json\s*|\s*```/g, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON found in response');
  const obj = JSON.parse(match[0]);
  if (!obj.zh || !obj.jp || !obj.en || !Array.isArray(obj.bd)) {
    throw new Error('Response missing required fields');
  }
  return obj;
}

// ── Provider implementations ──
async function callGemini(prompt, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${encodeURIComponent(apiKey)}`;
  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.3, responseMimeType: 'application/json' },
  });

  // Retry up to 3 times on transient errors (503, 502, 429-with-retry)
  const maxAttempts = 3;
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    if (res.ok) {
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Gemini returned empty response');
      return text;
    }
    const errText = await res.text();
    const isTransient = res.status === 503 || res.status === 502 || res.status === 504;
    lastErr = `Gemini error ${res.status}: ${errText.slice(0, 200)}`;
    if (!isTransient || attempt === maxAttempts) {
      throw new Error(lastErr);
    }
    // Exponential backoff: 1s, then 2s
    await new Promise(r => setTimeout(r, attempt * 1000));
  }
  throw new Error(lastErr);
}

async function callClaude(prompt, apiKey) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude error ${res.status}: ${errText.slice(0, 200)}`);
  }
  const data = await res.json();
  const text = data?.content?.[0]?.text;
  if (!text) throw new Error('Claude returned empty response');
  return text;
}

async function callOpenAI(prompt, apiKey) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${errText.slice(0, 200)}`);
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('OpenAI returned empty response');
  return text;
}

// Single entry point — rest of app calls only this
async function translateText(text, direction = 'en-yue') {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('Missing API key');
  const prompt = buildPrompt(text, direction);
  let raw;
  switch (TRANSLATION_PROVIDER) {
    case 'gemini': raw = await callGemini(prompt, apiKey); break;
    case 'claude': raw = await callClaude(prompt, apiKey); break;
    case 'openai': raw = await callOpenAI(prompt, apiKey); break;
    default: throw new Error('Unknown provider: ' + TRANSLATION_PROVIDER);
  }
  return parseAiResponse(raw);
}

// ── Speech recognition ───────────────────────────────────────────────────────
let _recognition = null;

function normalizeChinese(text) {
  // Strip whitespace and Chinese punctuation for comparison
  return (text || '').replace(/[\s，。！？、,!?.\-]/g, '');
}

// Edit-distance (Levenshtein) between two strings. Order-sensitive.
function editDistance(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  // Use a rolling row of size b.length+1
  let prev = new Array(b.length + 1);
  let curr = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1,       // insertion
        prev[j]   + 1,         // deletion
        prev[j - 1] + cost     // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

// Collapse consecutive duplicate substrings of length >= minLen. Defends against
// speech-recognition glitches where the recogniser emits "星期六得星期六得…" instead of
// "星期六得…" for a single utterance. minLen=4 is safe against legitimate Cantonese
// reduplications (好好, 慢慢, 馬馬虎虎 etc. are all 1–2 char base patterns).
function deduplicateRepeats(s, minLen) {
  minLen = minLen || 4;
  let changed = true;
  // Cap iterations defensively in case of pathological input
  for (let safety = 0; changed && safety < 20; safety++) {
    changed = false;
    for (let len = Math.floor(s.length / 2); len >= minLen; len--) {
      for (let i = 0; i + 2 * len <= s.length; i++) {
        if (s.substring(i, i + len) === s.substring(i + len, i + 2 * len)) {
          s = s.substring(0, i + len) + s.substring(i + 2 * len);
          changed = true;
          break;
        }
      }
      if (changed) break;
    }
  }
  return s;
}

function fuzzyMatch(heard, target) {
  // Strict: exact character match after normalization. Any difference → mismatch,
  // which surfaces the per-character breakdown so the user can self-judge whether
  // a recogniser homophone glitch is really an error or not.
  const h = normalizeChinese(heard);
  const t = normalizeChinese(target);
  if (!h || !t) return false;
  return h === t;
}

// Align heard text against target text and return per-target-char status:
//   { status: 'match' }                            — target[j] was said correctly
//   { status: 'wrong', heardChar: '<char>' }       — target[j] was said as a different char
//   { status: 'missing' }                          — target[j] was skipped/not heard
//
// Standard Needleman-Wunsch / Levenshtein DP, then backtrack the optimal path.
// Both inputs should be normalized (punctuation/whitespace stripped) before calling.
function alignChars(heard, target) {
  const m = heard.length, n = target.length;
  if (!n) return [];
  // DP matrix: dp[i][j] = min edits to turn heard[0..i] into target[0..j]
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = heard[i - 1] === target[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,         // deletion from heard
        dp[i][j - 1] + 1,         // insertion (= target char missing)
        dp[i - 1][j - 1] + cost   // substitution or match
      );
    }
  }
  // Backtrack from (m,n) to (0,0) — prefer diagonal moves on ties (more intuitive alignment)
  const marks = new Array(n);
  let i = m, j = n;
  while (i > 0 && j > 0) {
    const same = heard[i - 1] === target[j - 1];
    const diag = dp[i - 1][j - 1] + (same ? 0 : 1);
    if (dp[i][j] === diag) {
      marks[j - 1] = same ? { status: 'match' } : { status: 'wrong', heardChar: heard[i - 1] };
      i--; j--;
    } else if (dp[i][j] === dp[i][j - 1] + 1) {
      marks[j - 1] = { status: 'missing' };
      j--;
    } else {
      // up: extra heard char — no corresponding target slot
      i--;
    }
  }
  while (j > 0) { marks[j - 1] = { status: 'missing' }; j--; }
  return marks;
}

// Build the visual per-syllable breakdown grid for the Speak mismatch panel.
// Returns '' when char↔syllable alignment can't be cleanly established (e.g. a
// foreign word like 'William' embedded in Chinese), so the caller can fall back.
function renderSpeakBreakdown(heard, targetC, targetJ) {
  const punct = /[\s，。！？、,!?.\-]/;
  const charArr = Array.from(targetC).filter(c => !punct.test(c));
  // Split by whitespace, then strip any trailing punctuation that came with the syllable
  const jpArr   = (targetJ || '').split(/\s+/)
    .map(s => s.replace(/[，。！？、,!?.\-]+$/, ''))
    .filter(Boolean);
  if (!charArr.length || charArr.length !== jpArr.length) return '';   // alignment-impossible — caller handles fallback

  const heardClean = normalizeChinese(heard);
  const marks = alignChars(heardClean, charArr.join(''));

  const cols = charArr.map((c, idx) => {
    const m = marks[idx] || { status: 'missing' };
    const bad = m.status !== 'match';
    const tone = jpArr[idx].match(/[1-6]/);
    const toneColor = tone ? TONES[tone[0]].color : '#777';
    const charColor = bad ? '#8B3A4E' : '#2A2422';
    const jpColor   = bad ? '#8B3A4E' : toneColor;
    const mark = m.status === 'match'   ? '✓'
               : m.status === 'wrong'   ? m.heardChar
               : '·';   // missing
    const markStyle = m.status === 'match' ? 'color:#27AE60;font-weight:700;'
                    : m.status === 'wrong' ? 'color:#8B3A4E;font-weight:700;font-size:14px;'
                    : 'color:#E74C3C;font-weight:700;';
    return `<div class="bd-col">
      <div class="bd-char" style="color:${charColor}">${c}</div>
      <div class="bd-status" style="${markStyle}">${mark}</div>
      <div class="bd-jp" style="color:${jpColor};font-weight:700">${jpArr[idx]}</div>
    </div>`;
  }).join('');

  return `<div class="speak-breakdown">${cols}</div>`;
}

function startListening() {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) return;
  if (_recognition) { try { _recognition.abort(); } catch(e){} }

  const rec = new SpeechRec();
  rec.lang = 'yue-Hant-HK';
  rec.continuous = true;        // keep listening until user stops
  rec.interimResults = true;    // capture words as they're heard
  rec.maxAlternatives = 3;

  let finalTranscript = '';
  let interimTranscript = '';

  rec.onresult = (e) => {
    interimTranscript = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const transcript = e.results[i][0].transcript;
      if (e.results[i].isFinal) {
        // Three rules to defend against recogniser quirks:
        //  1) Skip exact duplicate — recogniser emitted the same segment twice
        //  2) Replace on cumulative-and-extending — segment is full transcript so far
        //  3) Otherwise treat as a true delta and append
        if (finalTranscript && transcript === finalTranscript) {
          // rule 1 — skip
        } else if (finalTranscript && transcript.length > finalTranscript.length && transcript.startsWith(finalTranscript)) {
          finalTranscript = transcript;  // rule 2
        } else {
          finalTranscript += transcript; // rule 3
        }
        // Post-pass: collapse any consecutive-duplicate substring of length >= 4.
        // Safety net for delivery patterns that slip past rules 1–3.
        finalTranscript = deduplicateRepeats(finalTranscript);
      } else {
        interimTranscript += transcript;
      }
    }
    state.convo.speakHeard = (finalTranscript + interimTranscript).trim() || '…';
    render();
  };
  rec.onerror = (e) => {
    if (e.error === 'no-speech' || e.error === 'aborted') return;  // user-initiated stop
    state.convo.speakStatus = 'mismatch';
    state.convo.speakHeard = '(error: ' + e.error + ')';
    render();
  };
  rec.onend = () => {
    // Recognition session ended — if user is still in 'listening' mode, evaluate result
    if (state.convo.speakStatus === 'listening') {
      const heard = finalTranscript.trim();
      if (!heard) {
        state.convo.speakStatus = 'idle';
        state.convo.speakHeard  = '';
      } else {
        const target = getRoundConvo(state.topic, state.currentRound).lines[state.convo.speakStep].c;
        const matched = fuzzyMatch(heard, target);
        state.convo.speakHeard  = heard;
        state.convo.speakStatus = matched ? 'matched' : 'mismatch';
        if (matched) speak(target);
      }
      render();
    }
  };

  state.convo.speakStatus = 'listening';
  state.convo.speakHeard = '';
  render();
  try { rec.start(); } catch(e) {
    state.convo.speakStatus = 'idle';
    render();
  }
  _recognition = rec;
}

function stopListening() {
  if (_recognition) { try { _recognition.abort(); } catch(e){} _recognition = null; }
}

// User pressed stop — gracefully end so onend fires and processes result
function finishListening() {
  if (_recognition) { try { _recognition.stop(); } catch(e){} }
}

// ── Translate speech input ───────────────────────────────────────────────────
let _translateRec = null;

function startTranslateListening() {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) {
    state.translate.error = 'Speech recognition not supported on this browser';
    render();
    return;
  }
  if (_translateRec) { try { _translateRec.abort(); } catch(e){} }

  const isToYue = state.translate.direction === 'en-yue';
  const rec = new SpeechRec();
  // For en-yue mode: input is English. For yue-en mode: input is Cantonese.
  rec.lang = isToYue ? 'en-US' : 'yue-Hant-HK';
  rec.continuous = true;
  rec.interimResults = true;
  rec.maxAlternatives = 1;

  let finalTranscript = '';

  rec.onresult = (e) => {
    // Process results from e.resultIndex onwards with a persistent finalTranscript.
    // Some Android Chrome builds deliver each final result as the CUMULATIVE transcript
    // rather than a delta — detect that and replace, so we don't end up with
    // "II haveI have green pants" style triplication.
    let interimText = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const seg = e.results[i][0].transcript;
      if (e.results[i].isFinal) {
        if (finalTranscript && seg === finalTranscript) {
          // rule 1 — skip exact duplicate
        } else if (finalTranscript && seg.length > finalTranscript.length && seg.startsWith(finalTranscript)) {
          finalTranscript = seg;
        } else {
          finalTranscript += seg;
        }
        finalTranscript = deduplicateRepeats(finalTranscript);
      } else {
        interimText += seg;
      }
    }
    state.translate.inputText = (finalTranscript + interimText).trim();
    // Update textarea directly without full re-render to avoid focus loss
    const ta = document.getElementById('translate-input');
    if (ta) ta.value = state.translate.inputText;
  };
  rec.onerror = (e) => {
    if (e.error === 'no-speech' || e.error === 'aborted') return;
    state.translate.error = 'Speech error: ' + e.error;
    state.translate.listening = false;
    render();
  };
  rec.onend = () => {
    if (state.translate.listening) {
      state.translate.listening = false;
      state.translate.inputText = finalTranscript.trim() || state.translate.inputText;
      render();
    }
  };

  state.translate.listening = true;
  state.translate.error = null;
  render();
  try { rec.start(); } catch(e) {
    state.translate.listening = false;
    state.translate.error = 'Could not start microphone';
    render();
  }
  _translateRec = rec;
}

function stopTranslateListening() {
  if (_translateRec) { try { _translateRec.stop(); } catch(e){} }
}

