// ===================================================================
// app.js — state, logic, helpers
// Loaded SECOND (after data.js). Word Review storage, helpers, state,
// audio, translation, speech recognition.
// ===================================================================

// ── Word Review storage layer ─────────────────────────────────────────────────
// ALL persistent access for the Word Review bin goes through these functions.
// They now sit on top of the storage module (storage.getWordReview / setWordReview)
// rather than touching localStorage directly. Public functions below keep their
// signatures unchanged, so no caller needed updating.
//
// Stored payload shape (under STORAGE_KEYS.wordReview, versioned envelope, v2):
//   { everUsed: bool, entries: [ {wid, topicKey, round, wordC, missCount, correctCount, addedAt} ] }
// Entry identity = `wid` (the stable word id), which survives text edits and the
// eventual cloud move. topicKey/round are kept for display grouping; wordC is kept
// as a display fallback and as the resolution hint used to heal pre-v2 entries that
// don't yet carry a wid. A word missed in two topics = two entries (different wids).
const REVIEW_GRADUATE_AT = 3;   // consecutive correct (in review) to clear a word

// Does this stored entry refer to the same word as the given identity? Prefers the
// stable wid on both sides; falls back to topicKey|round|wordC for legacy entries
// that predate wid (or that haven't been healed yet).
function _entryMatches(e, wid, topicKey, round, wordC) {
  if (wid && e.wid) return e.wid === wid;
  return e.topicKey === topicKey && e.round === round && e.wordC === wordC;
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

// Record a missed word. New word → new entry (storing its stable wid). Already-binned
// word → missCount++, correctCount reset to 0 (a fresh miss undoes review progress).
// `wid` is the word's stable id (word.id), passed by the caller which already holds
// the word object. A re-missed pre-v2 entry gets its wid healed here.
async function addMiss(wid, topicKey, round, wordC) {
  const data = await _readReviewStore();
  data.everUsed = true;
  const existing = data.entries.find(e => _entryMatches(e, wid, topicKey, round, wordC));
  if (existing) {
    if (wid && !existing.wid) existing.wid = wid;   // heal legacy entry on re-miss
    existing.missCount += 1;
    existing.correctCount = 0;
  } else {
    data.entries.push({
      wid: wid || null,
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
async function recordReviewResult(wid, topicKey, round, wordC, wasCorrect) {
  const data = await _readReviewStore();
  const entry = data.entries.find(e => _entryMatches(e, wid, topicKey, round, wordC));
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
// resolved (their word id / topic / round no longer exists in the topic JSON).
async function dropBinEntry(wid, topicKey, round, wordC) {
  const data = await _readReviewStore();
  data.entries = data.entries.filter(e => !_entryMatches(e, wid, topicKey, round, wordC));
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

// Normalise a voice's lang tag for comparison. Browsers report BCP-47 tags in
// two different shapes: standard hyphenated ("zh-HK") on desktop Chrome/Safari,
// and ICU-style underscored + script-suffixed ("zh_HK_#Hant", "zh_CN_#Hans") on
// Android. Lower-cased hyphen form, script suffix dropped: "zh_HK_#Hant" → "zh-hk".
function normLang(lang) {
  return String(lang || '')
    .replace(/_#.*$/, '')   // drop "_#Hant" / "_#Hans" script suffix
    .replace(/_/g, '-')      // underscores → hyphens
    .toLowerCase();
}
// Is this voice Cantonese? Cantonese TTS is reported as zh-HK (and occasionally
// zh-yue). zh-TW is Taiwanese Mandarin (not Cantonese) but is a much closer
// pronunciation match than zh-CN, so it stays a fallback in pickVoicePair, not
// here. This predicate is strictly "is it Cantonese".
function isCantoneseVoice(v) {
  const l = normLang(v.lang);
  return l === 'zh-hk' || l.startsWith('zh-yue');
}
function isChineseVoice(v) {
  return normLang(v.lang).startsWith('zh');
}

function pickVoicePair(voices) {
  const zh = voices.filter(isChineseVoice);
  if (zh.length === 0) return { a: null, b: null };
  // Primary voice: prefer Cantonese (zh-HK), then Taiwanese Mandarin (zh-TW,
  // closer than mainland), then any other zh. Uses normLang so Android's
  // "zh_HK_#Hant" is recognised as Cantonese, not lumped in with Mandarin.
  const a = zh.find(isCantoneseVoice)
          || zh.find(v => normLang(v.lang) === 'zh-tw')
          || zh[0];
  // Secondary voice for the second speaker: prefer another voice of the same
  // lang if there's more than one, otherwise any other zh voice, otherwise `a`.
  const sameLang = zh.filter(v => normLang(v.lang) === normLang(a.lang) && v !== a);
  const b = sameLang[0] || zh.find(v => v !== a) || null;
  return { a, b };
}

// Some spoken text is written as a two-speaker dialogue, e.g.
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

// Web Speech API — as of the pre-generated audio pipeline (below), this is
// ONLY still used by the Translate tab's "Listen" button. Every other speech
// need in the app (words, sentences, both kinds of conversation) now plays a
// pre-generated file instead — Translate can't use that, because it speaks
// whatever the AI just translated, which has no stable id and can't be
// pre-generated ahead of time. This is deliberately narrow scope, not
// leftover code from before the audio pipeline existed.
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

// ── Pre-generated audio playback ────────────────────────────────────────────
// Catalogued content (words, sentences, topic Chat conversations, checkpoint
// conversations) plays from the Chirp3-HD files tools/generate-audio.js
// produces, instead of the browser's synthetic voice. Deliberately NO
// fallback to speak() here — if a file is missing (new content added but the
// generator hasn't been re-run yet), the play button shows a toast instead of
// silently substituting a lower-quality voice, so the gap stays visible.
//
// NAMING CONTRACT with tools/generate-audio.js — if either side's naming
// scheme changes, the other must be updated to match:
//   audio/words/{wordId}.mp3
//   audio/sentences/{sid}.mp3
//   audio/convos/topic-{topicKey}-r{round}-line{NN}.mp3
//   audio/convos/{convoKey}-line{NN}.mp3

function showToast(text, kind) {
  state.toast = { text, kind };
  render();
  setTimeout(() => {
    if (state.toast && state.toast.text === text) { state.toast = null; render(); }
  }, 2200);
}

let _currentAudio = null;

// Stops whatever pre-generated audio is currently playing, if any. Mirrors
// the old speak()'s internal speechSynthesis.cancel() — without this, rapid
// clicks (or an auto-play firing while a previous clip is still finishing)
// would overlap two clips instead of the new one replacing the old.
function stopAudioFile() {
  if (_currentAudio) { _currentAudio.pause(); _currentAudio = null; }
}

const AUDIO_RATES = { slow: 0.75, normal: 1.0, fast: 1.3 };

function playAudioFile(url, onEnd) {
  stopAudioFile();
  const audio = new Audio(url);
  audio.playbackRate = AUDIO_RATES[state.speed] || 1.0;
  _currentAudio = audio;
  let settled = false;
  const fail = () => {
    if (settled) return;
    settled = true;
    if (_currentAudio === audio) _currentAudio = null;
    showToast('Audio not generated for this yet', 'audio-missing');
    if (onEnd) onEnd();
  };
  audio.addEventListener('ended', () => {
    if (settled) return;
    settled = true;
    if (_currentAudio === audio) _currentAudio = null;
    if (onEnd) onEnd();
  });
  audio.addEventListener('error', fail);
  audio.play().catch(fail);
}

// kind: 'word' | 'sentence'
function speakItem(kind, id, onEnd) {
  if (!id) { if (onEnd) onEnd(); return; }
  const dir = kind === 'word' ? 'words' : 'sentences';
  playAudioFile(`./audio/${dir}/${id}.mp3`, onEnd);
}

// Plays conversation line `lineIndex` (0-based) from whichever conversation
// is currently active. Reuses the exact same checkpoint-vs-topic check as
// activeConvoSource() so the two can never disagree about which source is
// live — if that check ever changes, update it in both places.
function speakConvoLine(lineIndex, onEnd) {
  const n = String(lineIndex + 1).padStart(2, '0');
  if (state.checkpoint && state.checkpointAct === 'convo') {
    const cp = getStageCheckpoint(state.checkpoint.pathKey, state.checkpoint.stageId);
    if (!cp || !cp.convo) { if (onEnd) onEnd(); return; }
    playAudioFile(`./audio/convos/${cp.convo}-line${n}.mp3`, onEnd);
  } else {
    playAudioFile(`./audio/convos/topic-${state.topic}-r${state.currentRound}-line${n}.mp3`, onEnd);
  }
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

// Renders a jyutping line for arbitrary heard text (the "You said" line in
// the sentence speak sheet, DES-38/40) — a per-character lookup against
// store.charJyutping, derived from the corpus itself by
// tools/build-char-jyutping.js. This is NOT a general converter: it only
// knows what the 585 words and 307 sentences already teach. Two things it
// shows plainly rather than guessing past:
//   - a character the corpus never taught renders as a boxed "?", not a
//     blank and not an invented reading
//   - a character with more than one reading in the corpus (`amb: true`)
//     still shows its majority reading, but marked — the recogniser's
//     output plus a lookup is not confident enough to present as fact
// Colours by tone digit the same way colorJyutping() does. Punctuation and
// Latin characters (names, "William") pass through with no syllable slot —
// they were never going to have a reading.
function charsToJyutping(text) {
  const map = store.charJyutping || {};
  return [...text].map(ch => {
    if (!/[\u4e00-\u9fff]/.test(ch)) return '';
    const entry = map[ch];
    if (!entry) return `<span class="jp-unknown" title="Not in the taught vocabulary">?</span>`;
    const tone = entry.j.match(/[1-6]/);
    const color = tone ? TONES[tone[0]].color : '#777';
    if (entry.amb) {
      return `<span class="jp-ambiguous" style="color:${color};font-weight:700" title="${ch} has more than one reading in the corpus — showing the most common">${entry.j}</span>`;
    }
    return `<span style="color:${color};font-weight:700">${entry.j}</span>`;
  }).filter(Boolean).join(' ');
}

// ── State ─────────────────────────────────────────────────────────────────────
let state = {
  speed: 'normal',
  nav: 'dashboard',               // app opens on the new Dashboard homepage
  settingsOpen: false,           // the settings sheet (header cog), v117
  // Renamed from `homeView` at v119. The old name predated the Dashboard: when
  // Topics WAS the home screen, "home view" meant its landing list. Since the
  // Dashboard became Home the name pointed at the wrong screen — this flag has
  // never had anything to do with Home.
  topicsView: true,               // true = the Topics landing list, false = inside a topic
  selectedCategory: 'all',        // 'all' or a category key
  currentRound: 1,
  pathView: 'list',               // 'list' = paths list, 'timeline' = inside a path
  activePath: 'beginner',         // which path is being viewed
  pathProgress: {},               // { beginner: { greetings:true, ... }, ... } — loaded from localStorage
  fromPath: false,                // true when user entered a topic via the Learning Path
  fromPathTier: null,             // the tier of the path step they entered — preserved if they switch tier mid-study
  toast: null,                    // { text, kind } — transient overlay message; cleared after timeout.
                                   // kind: 'step' | 'final' (path completion) | 'audio-missing'
  headerDetailsOpen: false,             // ⓘ in header expands tone legend + speed settings
  // The sentence "Say it back" sheet (DES-38/40) — speak feedback on a single
  // sentence, opened from a sentence card in Learn. `sentSpeakOpen` is the
  // NAV_FIELDS-tracked flag (same shape as settingsOpen, so phone BACK closes
  // it); `sentSpeak` itself is NOT nav-tracked, same as `convo` — it's reset
  // fresh every time the sheet opens rather than restored across history.
  sentSpeakOpen: false,
  sentSpeak: { idx: null, status: 'idle', heard: '' },   // status: 'idle' | 'listening' | 'matched' | 'mismatch'
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
  sentenceNoteClosed: {},
  quiz: null,
  // Word Review session — null when not in a session. Shape set by startWordReview().
  wordReview: null,
  // Checkpoint (Stage 3) — null when no checkpoint hub is open.
  //   checkpoint:     { pathKey, stageId, cpId } | null  — which hub is open
  //   checkpointAct:  'words' | 'convo' | null — which activity within it
  //   checkpointQuiz: the Words-activity quiz session (own shape) | null
  checkpoint: null,
  checkpointAct: null,
  checkpointQuiz: null,
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
  'nav', 'settingsOpen', 'sentSpeakOpen', 'topicsView', 'pathView', 'activePath',
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
//
// Snapshots outlive deploys. history.state persists across a refresh and across
// a new version being installed, so entries written by an EARLIER build of the
// app arrive here after an update — and they carry that build's field names.
// `f in snap` skips anything absent, which fails silently rather than loudly:
// the field simply keeps whatever value the current screen left it with.
//
// v119 renamed homeView → topicsView, so a snapshot written by v118 or earlier
// has the old key. Left unmigrated the bug is specific and confusing: back out
// of a topic into a pre-deploy entry and `nav` restores to 'topics' while
// `topicsView` stays false, so the app shows the topic you just left and BACK
// appears not to work. Map the old key forward before applying.
//
// Keep this until pre-v119 history is unreachable in practice — a browser can
// hold an entry for as long as its tab lives.
function migrateNavSnapshot(snap) {
  if (!snap) return snap;
  if (!('topicsView' in snap) && ('homeView' in snap)) {
    snap.topicsView = snap.homeView;
  }
  return snap;
}

function applyNavSnapshot(snap) {
  if (!snap) return;
  migrateNavSnapshot(snap);
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

// Close the settings sheet. If opening pushed a history entry we step back
// through it (keeps the stack honest, and means phone BACK and the ✕ do exactly
// the same thing); otherwise just close directly.
function closeSettings() {
  if (!state.settingsOpen) return;
  if (_navReady) {
    history.back();          // triggers popstate → restores the pre-sheet snapshot
  } else {
    state.settingsOpen = false;
    render();
  }
}

// Close the sentence "Say it back" sheet (DES-38/40). Same shape as
// closeSettings() — opening pushed a history entry, so closing steps back
// through it rather than setting state directly, keeping phone BACK and the
// ✕ in agreement. Also aborts any live recognition so leaving mid-listen
// doesn't leave the mic running against a screen that's gone.
function closeSentSpeak() {
  if (!state.sentSpeakOpen) return;
  stopListening();
  stopAudioFile();
  state.speaking = null;
  if (_navReady) {
    history.back();
  } else {
    state.sentSpeakOpen = false;
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
  // Resolve by the stable wid when present; fall back to wordC for pre-v2 entries
  // and heal them (backfill wid) so the match is stable from then on. If the word
  // can no longer be found at all, silently drop the entry from the bin.
  const items = [];
  let healed = false;
  for (const entry of picked) {
    const words = getRoundWords(entry.topicKey, entry.round);
    let word = entry.wid ? words.find(w => w.id === entry.wid) : null;
    if (!word) word = words.find(w => w.c === entry.wordC);   // legacy / fallback match
    if (!word) {
      await dropBinEntry(entry.wid, entry.topicKey, entry.round, entry.wordC);
      continue;
    }
    if (!entry.wid && word.id) { entry.wid = word.id; healed = true; }   // backfill stable id
    items.push({ entry, word, pool: words });
  }
  // Persist any healed wids once (entry objects above are the live cached objects).
  if (healed) await _writeReviewStore(await _readReviewStore());

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
    reviewedThisSession: 0,
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

function playAllConvo(lines, idx) {
  if (idx >= lines.length) { state.convo.playingLine = null; render(); return; }
  state.convo.playingLine = idx;
  render();
  speakConvoLine(idx, () => setTimeout(() => playAllConvo(lines, idx + 1), 500));
}

// ── Translation (provider-abstracted) ─────────────────────────────────────────
// Configuration — change provider here to swap. Each provider implementation
// returns the same standardised shape: { zh, jp, en, bd }
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
      // Checkpoint flags ('cp:<id>:<activity>') are NOT lesson keys — leave them
      // alone. Without this guard the legacy-key rule below mistakes them for
      // pre-refactor lessons, renames them to 'cp:...:<activity>-t1' and deletes
      // the original, silently wiping checkpoint completion on every refresh.
      if (key.startsWith('cp:')) return;
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
// The ordered path sequence: lessons interleaved with the checkpoints that sit
// at the end of each stage, in the order the learner walks them. Each item is
// tagged so callers can tell lessons and checkpoints apart:
//   { kind:'lesson', topic, tier }
//   { kind:'checkpoint', stageId, cpId, stageName }
// A stage's checkpoint is only included if it actually offers activities
// (checkpointProgress(...).total > 0) — a zero-activity checkpoint renders no
// node, so it must not appear in the sequence either. Paths without stages fall
// back to a lessons-only sequence (unchanged behaviour). This is the single
// source of "what comes next" — both the path map highlight and the in-lesson
// "Next step" CTA derive from it, so they can never disagree about the checkpoint.
function buildPathSequence(pathKey) {
  const path = (store.paths || []).find(x => x.key === pathKey);
  if (!path) return [];
  const stages = getPathStages(pathKey);
  if (!stages.length) {
    return path.lessons.map(l => ({ kind: 'lesson', topic: l.topic, tier: l.round }));
  }
  const seq = [];
  stages.forEach(stage => {
    (stage.topics || []).forEach(topicKey => {
      const l = path.lessons.find(x => x.topic === topicKey);
      if (l) seq.push({ kind: 'lesson', topic: l.topic, tier: l.round });
    });
    if (stage.checkpoint && checkpointProgress(pathKey, stage.id).total > 0) {
      seq.push({ kind: 'checkpoint', stageId: stage.id, cpId: stage.checkpoint.id, stageName: stage.name });
    }
  });
  return seq;
}

// Is a sequence item already complete?
function isSeqItemComplete(pathKey, item) {
  return item.kind === 'checkpoint'
    ? checkpointProgress(pathKey, item.stageId).complete
    : isLessonComplete(pathKey, item.topic, item.tier);
}

// The earliest incomplete item in the path — the global "do this next" marker
// the path map highlights. Returns a tagged item (lesson or checkpoint) or null
// when everything is done.
function nextPathPosition(pathKey) {
  return buildPathSequence(pathKey).find(it => !isSeqItemComplete(pathKey, it)) || null;
}

// ── Dashboard "next up" resolution ────────────────────────────────────────────
// Walks Beginner first, then Intermediate, then Advanced — the same order the
// path list displays them in — and returns the first incomplete item found
// across all of them, tagged with which path it belongs to. Returns null only
// when every path that exists is fully complete (or no paths are loaded yet).
// Reuses nextPathPosition() so this can never disagree with what the path
// timeline itself highlights as "Next up".
const DASHBOARD_PATH_ORDER = ['beginner', 'intermediate', 'advanced'];
function dashboardNextUp() {
  for (const pathKey of DASHBOARD_PATH_ORDER) {
    const path = (store.paths || []).find(p => p.key === pathKey);
    if (!path || path.comingSoon) continue;
    const item = nextPathPosition(pathKey);
    if (item) return { pathKey, path, item };
  }
  return null; // every available path is fully complete
}

// ── Tier ladder (DES-28, v121) ────────────────────────────────────────────────
// Which path owns a given tier of a given topic. Nothing asked this before v121:
// path lookups all ran topic-first from a known path, never tier-first from a
// known topic. Measured across all 52 path lessons at build time, EVERY (topic,
// tier) pair belongs to exactly one path and no topic appears twice in one path
// — so a single find() is correct rather than merely convenient. If that ever
// stops holding the ladder's premise is broken, not just this function, so it
// returns the first match and the condition is recorded in DESIGN_DECISIONS.
function pathOwningTier(topicKey, tier) {
  for (const p of (store.paths || [])) {
    if ((p.lessons || []).some(l => l.topic === topicKey && (l.round || 1) === tier)) return p;
  }
  return null;
}

// The rungs above and below where the learner is standing. Returns the ADJACENT
// tiers only — the ladder is climbed one step at a time (DES-28), so tier 3 is
// not offered from tier 1 even though it exists. `total` is the full height, so
// the state text can say "Tier 2 of 3" and make the numbered rungs unambiguous.
//
// Deliberately returns a LIST shape rather than {up, down}: the path route
// renders one cross-reference row per neighbour, and a list means adding a tier
// never changes the caller. Ordered down-then-up so both routes read low-to-high.
function getTierLadder(topicKey, tier) {
  const rounds = getAvailableRounds(topicKey);
  const idx = rounds.indexOf(tier);
  const total = rounds.length;
  if (idx < 0 || total <= 1) return { total, rungs: [] };

  const entry = store.indexEntry(topicKey);
  const rung = (t, dir) => {
    const owner = pathOwningTier(topicKey, t);
    return {
      tier: t,
      dir,                                        // 'down' | 'up'
      words: entry?.wordCounts?.[String(t)] ?? null,
      pathKey:   owner ? owner.key   : null,
      pathLabel: owner ? owner.label : null,
    };
  };
  const rungs = [];
  if (idx > 0)         rungs.push(rung(rounds[idx - 1], 'down'));
  if (idx < total - 1) rungs.push(rung(rounds[idx + 1], 'up'));
  return { total, rungs };
}

// Move to another tier of the topic already open. This is the ONLY route a tier
// change takes as of v121.
//
// The destination CONTEXT follows the origin context, and this is the whole of
// the function's difficulty:
//
//   In a path  — a tier change is also a path change, because the destination
//     tier belongs to a different path from the one being left. state.activePath
//     must follow the DESTINATION, or the chrome and the completion write
//     disagree (DES-30, the v121 defect).
//
//   Standalone — a tier change is NOT a path change. Browsing a topic from
//     Topics and stepping up a rung stays standalone (DES-28: outside a path the
//     ladder is a control, and it must still be one after it is used).
//
// v121 through v127 applied the first rule to both routes: any tier owned by any
// path entered as a path lesson, so the standalone ladder was a one-way door
// into the Intermediate path — path chrome, a Mark Complete button, and no rung
// back down, because renderTierLine() correctly degrades to a statement inside a
// path. It was live for all ten two-tier topics from v121; it only became
// reachable on `modals` and `comparisons` at v127, which is when it was found.
function goToTier(topicKey, tier) {
  if (state.fromPath) {
    const owner = pathOwningTier(topicKey, tier);
    if (owner) {
      // Enter as a genuine lesson of whichever path owns this tier. This single
      // line is what stops the chrome and the completion write disagreeing.
      // openPathLesson() pushes, scrolls and renders, so nothing further here.
      state.activePath = owner.key;
      openPathLesson(topicKey, tier);
      return;
    }
    // Inside a path, but no path owns the destination (a tier authored ahead of
    // its path). It cannot be a path lesson, so drop to the standalone shape
    // rather than leaving stale path chrome on screen.
  }
  // Standalone — stay standalone. state.activePath is left as it is: it is inert
  // while fromPath is false, and the standalone topic-open handlers rely on the
  // same thing rather than clearing it.
  state.topic        = topicKey;
  state.currentRound = tier;
  state.fromPath     = false;
  state.fromPathTier = null;
  resetLessonViewState();
  pushNav();
  window.scrollTo(0, 0);
  render();
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
  const total = path.lessons.length;                 // step counter stays lessons-only (Step N / 16)

  // What follows THIS lesson in path order — the next sequence item, which may be
  // this stage's checkpoint rather than another lesson. Derived from the shared
  // sequence so the CTA can never skip the checkpoint the map shows.
  const seq = buildPathSequence(state.activePath);
  const seqIdx = seq.findIndex(it => it.kind === 'lesson' && it.topic === state.topic && it.tier === tier);
  const nextItem = (seqIdx >= 0 && seqIdx < seq.length - 1) ? seq[seqIdx + 1] : null;
  const isLast = !nextItem;                           // true path-end: nothing (lesson or checkpoint) left

  // Label/icon for the CTA. A checkpoint reuses the map's exact label
  // ("Checkpoint · <stage>") and the ◆ diamond; a lesson uses its topic meta.
  let nextTopicLabel = null, nextTopicIcon = null;
  if (nextItem && nextItem.kind === 'checkpoint') {
    nextTopicLabel = 'Checkpoint · ' + nextItem.stageName;
    nextTopicIcon  = '◆';
  } else if (nextItem) {
    const m = store.topicMeta(nextItem.topic);
    nextTopicLabel = m ? m.label : null;
    nextTopicIcon  = m ? m.icon  : null;
  }
  // ── Stage framing. "Step 8 of 41" is technically true and motivationally
  // awful; the contextual row and the stepper both work in stage terms instead
  // (§3.4). `step`/`total` below stay whole-path because other callers read
  // them — the stage figures are additive, on `stage`.
  const stage = getStageForTopic(state.activePath, state.topic);
  const stageInfo = stage
    ? buildStageInfo(state.activePath, path, stage, state.topic)
    : null;

  return {
    path,
    stage: stageInfo,                              // null for a topic in no stage
    step: stepIdx + 1,
    total,
    isLast,
    nextStep: nextItem,                            // { kind:'lesson', topic, tier } | { kind:'checkpoint', stageId, cpId, stageName } | null
    nextTopicLabel,
    nextTopicIcon,
    isComplete: isLessonComplete(state.activePath, state.topic, tier),
  };
}

// ── Checkpoint module (Stage 3) ───────────────────────────────────────────────
// A "checkpoint" is the capstone of a stage (a named cluster of ~4 topics in a
// path). It opens a small hub of two independent activities — Words (recall),
// Conversation (produce) — none required.
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

const CHECKPOINT_WORD_CAP_DEFAULT  = 25;
const CHECKPOINT_ACTIVITIES = ['words', 'convo'];

// All stages for a path (empty array if the path has none — renders as a flat list).
function getPathStages(pathKey) {
  const path = (store.paths || []).find(p => p.key === pathKey);
  return (path && Array.isArray(path.stages)) ? path.stages : [];
}
// Stage framing shared by the topic screen and the checkpoint hub. `currentTopic`
// is null on the hub, where no topic is current — the checkpoint is.
// "Step 8 of 41" is technically true and motivationally awful; everything here
// works in stage terms instead (§3.4).
function buildStageInfo(pathKey, path, stage, currentTopic) {
  const siblings = (stage.topics || []).map(topicKey => {
    const entry = (path.lessons || []).find(x => x.topic === topicKey);
    const sibTier = entry ? entry.round : 1;
    const meta = store.topicMeta(topicKey);
    return {
      topic: topicKey,
      tier: sibTier,
      label: meta ? meta.label : topicKey,
      complete: isLessonComplete(pathKey, topicKey, sibTier),
      isCurrent: topicKey === currentTopic,
    };
  });
  const idx = siblings.findIndex(t => t.isCurrent);
  return {
    id: stage.id,
    name: stage.name,
    topics: siblings,
    step: idx >= 0 ? idx + 1 : siblings.length, // position WITHIN the stage
    total: siblings.length,
    done: siblings.filter(t => t.complete).length,
    checkpoint: stage.checkpoint ? checkpointProgress(pathKey, stage.id) : null,
  };
}

// Stage context for the checkpoint hub. The hub is the last member of its stage,
// so it earns the same contextual row and stepper as any topic in that stage —
// which is also the only lateral navigation it has.
function getCheckpointStageContext() {
  const cp = state.checkpoint;
  if (!cp) return null;
  const path = (store.paths || []).find(p => p.key === cp.pathKey);
  const stage = getStage(cp.pathKey, cp.stageId);
  if (!path || !stage) return null;
  return { path, stage: buildStageInfo(cp.pathKey, path, stage, null) };
}

// Which stage of a path contains a topic, or null. Stage membership is by topic
// key, and a path lists each topic at most once, so there is no tier ambiguity.
// Returns null for a topic that sits in path.lessons but in no stage — the
// Intermediate path's `numbers` is exactly that, so this is a real case and the
// callers degrade rather than treat it as an error.
function getStageForTopic(pathKey, topicKey) {
  return getPathStages(pathKey).find(s => (s.topics || []).includes(topicKey)) || null;
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
// with no authored convo offers only words).
function checkpointProgress(pathKey, stageId) {
  const cp = getStageCheckpoint(pathKey, stageId);
  const stage = getStage(pathKey, stageId);
  if (!cp || !stage) return { done: 0, total: 0, complete: false, available: [] };
  // Availability must be answerable from the REFERENCE data alone — paths and
  // path_convos, both loaded by init() before the first paint. It must never
  // depend on the topic cache, which is lazy-loaded per topic and is empty on a
  // cold start.
  //
  // v122 fix. `words` used to test `getCheckpointWords(...).length > 0`, which
  // walks getRoundWords() and so reads store.topicCache synchronously. On a cold
  // start that is always 0, so the Words activity vanished, and for a checkpoint
  // with the Conversation already done the sum became 1 of 1 → `complete: true`.
  // buildPathSequence() then dropped the checkpoint entirely and the dashboard's
  // "Next up" jumped to the lesson AFTER it. Tapping HOME afterwards looked like
  // a fix; it was just the topic cache having warmed in between.
  //
  // A stage's Words activity is offerable exactly when the stage has topics, and
  // that is knowable from learning_paths.json. Verified against the data: all 15
  // checkpoint stages have topics and every one yields words (16–60 each), so
  // this is equivalent to the old test whenever the cache is warm — and correct
  // when it is not. The word POOL is still built by getCheckpointWords(); the
  // render() guard above renderCheckpointHub loads the stage's topics before the
  // hub paints, so the pool is never built against an empty cache.
  const available = CHECKPOINT_ACTIVITIES.filter(a => {
    if (a === 'convo') return !!(cp.convo && store.pathConvo(cp.convo));
    if (a === 'words') return (stage.topics || []).length > 0;
    return false;
  });
  const done = available.filter(a => checkpointActivityDone(pathKey, cp.id, a)).length;
  return { done, total: available.length, complete: available.length > 0 && done === available.length, available };
}

// The round(s) a topic is taught at in this path — read from path.lessons, which
// records the round each lesson presents (round 1 on Beginner, round 2 for tier-2
// Intermediate chapters). Falls back to round 1 if no explicit lesson entry.
function stageTopicRounds(pathKey, topicKey) {
  const path = (store.paths || []).find(p => p.key === pathKey);
  const rounds = (path?.lessons || []).filter(l => l.topic === topicKey).map(l => l.round);
  return rounds.length ? rounds : [1];
}
function getCheckpointWords(pathKey, stage) {
  // Words pool: the vocab this stage actually teaches — each topic at the round it
  // is presented at in THIS path (round 1 on Beginner, round 2 for tier-2
  // Intermediate chapters, or a mix), deduped by Chinese surface form. Reads the
  // round from path.lessons rather than assuming round 1, so a tier-2 checkpoint
  // reviews its tier-2 vocab. NOTE: still distinct from DRILL validation, which
  // checks answers against a topic's full (all-rounds) vocab.
  const seen = new Set();
  const out = [];
  for (const topicKey of (stage.topics || [])) {
    for (const round of stageTopicRounds(pathKey, topicKey)) {
      for (const w of (getRoundWords(topicKey, round) || [])) {
        if (seen.has(w.c)) continue;
        seen.add(w.c);
        out.push(w);
      }
    }
  }
  return out;
}

// ── Path lesson navigation ────────────────────────────────────────────────────
// Open a topic as a path lesson, resetting the per-lesson view state. Shared by
// the timeline's step cards and the stage stepper's sibling taps, so the two can
// never drift in what they reset. Pushes a nav entry: BACK steps back through
// the lessons you opened, the same as any other lesson transition.
// The transient view state that must not survive a lesson change. Extracted at
// v121 so openPathLesson() and the no-path branch of goToTier() cannot drift in
// what they clear — the same reason openPathLesson() itself was extracted.
function resetLessonViewState() {
  state.mode         = 'study';
  state.tab          = 'words';
  state.flipped      = {};
  state.speaking     = null;
  state.sentenceBreakdownOpen = {};
  state.sentenceRevealed = {};
  state.sentenceNoteClosed = {};
  state.convo        = { convMode:'read', playingLine:null, gapAnswers:{}, bubbleRevealed:{}, breakdownOpen:{}, speakStep:0, speakStatus:'idle', speakHeard:'', speakAutoPlayed:false, speakRevealed:{} };
}

function openPathLesson(topicKey, tier) {
  state.topic        = topicKey;
  state.currentRound = tier;
  state.nav          = 'topics';
  state.topicsView   = false;
  state.fromPath     = true;
  state.fromPathTier = tier;
  resetLessonViewState();
  pushNav();
  window.scrollTo(0, 0);
  render();
}

// ── Top-level destination navigation ──────────────────────────────────────────
// Go to one of the five top-level destinations, resetting the state that must
// not survive the move. Shared by the tab bar and the header nameplate, so the
// two can never drift in what they reset — the same reason openPathLesson()
// above was extracted from its three call sites.
//
// Always pushes. It took a `replace` option at v116, because its caller then was
// the drawer, whose open state was its own history entry that the destination
// had to overwrite. The tab bar has no such entry — a tab tap is a plain forward
// move — so at v117 the option had exactly zero call sites and was removed
// rather than left as a parameter nobody passes.
//
// Returns false when already on the destination with nothing to reset, so
// callers can no-op instead of stacking identical history entries (which makes
// BACK look broken: it appears to do nothing until the duplicates are consumed).
function goToDestination(target) {
  // Leaving must exit any open checkpoint session first. render() checks
  // state.checkpoint BEFORE state.nav, so without this the chosen destination
  // never shows — the checkpoint hub just redraws.
  const inCheckpoint = !!state.checkpoint;
  const alreadyThere =
    state.nav === target && !inCheckpoint && !state.fromPath && !state.settingsOpen && !state.sentSpeakOpen &&
    (target !== 'topics' || state.topicsView) &&
    (target !== 'path'   || state.pathView === 'list');
  if (alreadyThere) return false;

  state.checkpoint = null;
  state.checkpointAct = null;
  state.checkpointQuiz = null;
  // Topics always returns to its home view, the Learning Path to the path list.
  if (target === 'topics') state.topicsView = true;
  if (target === 'path') state.pathView = 'list';
  // Entering Review always shows Words directly (no session, always fresh).
  if (target === 'review') {
    state.wordReview = null;
    refreshReviewBadge().then(render);
  }
  state.nav = target;
  state.fromPath = false;          // any top-level navigation clears the path-return flag
  state.fromPathTier = null;
  state.settingsOpen = false;      // the sheet never survives a destination change
  if (state.sentSpeakOpen) { stopListening(); stopAudioFile(); state.speaking = null; state.sentSpeakOpen = false; }
  pushNav();
  return true;
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
  const pool = shuffle(getCheckpointWords(cpState.pathKey, stage)).slice(0, cap);
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

// ── Diagnostic (session-only, no persistence) ─────────────────────────────────
// Given the missed words' stage topics, find the topic that accounts for the
// most misses. Returns { topicKey, label, count } only when a topic has 2+
// misses (a genuine signal), else null.
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
// Which stage topic does a word belong to? (first stage topic whose taught-round
// vocab contains this Chinese surface form). Used to attribute word-quiz misses.
function wordTopicInStage(pathKey, stage, word) {
  // Matches the taught-round word pool (see getCheckpointWords).
  for (const tk of (stage.topics || [])) {
    for (const round of stageTopicRounds(pathKey, tk)) {
      if ((getRoundWords(tk, round) || []).some(w => w.c === word.c)) return tk;
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

// Sentence-final particles, for the free-particle rule in fuzzyMatch() below.
// Kept in sync with data/topics/particles.json by a check in tools/validate.js —
// if that file gains or loses a particle, the validator fails until this matches.
// Hand-maintained derived data drifts silently, so the drift is made loud rather
// than trusted not to happen.
const SPEAK_FINAL_PARTICLES = new Set(['喇', '啦', '呀', '嗎', '喎', '囉', '㗎', '咋', '咩', '吖']);

function fuzzyMatch(heard, target) {
  // Leniency, sized from measured recogniser behaviour rather than picked.
  //
  // This was previously an exact match, and that produced a ~25% false-reject
  // rate on sentences in the ASR probe: 我食咗飯，仲飲咗茶 (ngo5 sik6 zo2 faan6,
  // zung6 jam2 zo2 caa4) came back with 中 (zung1) for 仲 (zung6), and
  // 我部電話太舊喇 (ngo5 bou6 din6 waa2 taai3 gau6 laa3) came back with 夠 (gau3)
  // for 舊 (gau6) — correct speech marked wrong, which is the failure mode that
  // matters most here. A false reject costs trust; a missed error costs nothing
  // the app was catching anyway.
  //
  // Two rules, each earning its place against the probe's captured cases:
  let h = normalizeChinese(heard);
  let t = normalizeChinese(target);
  if (!h || !t) return false;
  if (h === t) return true;

  // 1) A DIFFERING SENTENCE-FINAL PARTICLE IS FREE. 喇 (laa3) and 啦 (laa1) are a
  //    real tone minimal pair, but particles are acoustically reduced and highly
  //    variable in running speech, so a swap between them is not evidence the
  //    learner said anything wrong. tools/asr-testset.js excludes them as probe
  //    targets for the same reason. Only the final character, only when both
  //    sides are particles.
  const hLast = h[h.length - 1], tLast = t[t.length - 1];
  if (hLast !== tLast && SPEAK_FINAL_PARTICLES.has(hLast) && SPEAK_FINAL_PARTICLES.has(tLast)) {
    h = h.slice(0, -1);
    t = t.slice(0, -1);
    if (h === t) return true;
  }

  // 2) ONE EDIT PER FOUR TARGET CHARACTERS, and below four characters, exact.
  //    Scaling matters: a single substitution in an eight-character sentence is
  //    almost always a recogniser homophone, whereas a single substitution in a
  //    two-character word IS the word (媽媽 maa1 maa1 heard as 嫲嫲 maa4 maa4 is
  //    a different word, not a glitch). The short-string floor is what keeps
  //    vocabulary-length targets strict while sentences get room.
  const allowance = Math.floor(t.length / 4);
  if (!allowance) return false;
  return editDistance(h, t) <= allowance;
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
// Returns { html: '', hasDiff: false } when char↔syllable alignment can't be
// cleanly established (e.g. a foreign word like 'William' embedded in
// Chinese), so the caller can fall back.
//
// `variant` controls how a non-matching syllable is coloured:
//   'bad'   (default) — var(--feedback-bad). A genuine rejected mismatch.
//   'close' — var(--brand)/var(--brand-text-dark), already documented as
//             neutral, not error (styles.css). For a forgiven near-miss
//             (DES-39 accepts it, but DES-41 stops presenting the differing
//             syllable as an error inside a "you got it right" panel — the
//             same colour communicated a tone verdict DES-38 rules out).
// `hasDiff` tells the caller whether ANY syllable failed to match, so it can
// choose the "Close" wrapper/copy without a second, duplicate alignment pass
// — an exact match has hasDiff:false and looks identical to before this
// parameter existed, regardless of which variant was requested.
function renderSpeakBreakdown(heard, targetC, targetJ, variant) {
  variant = variant || 'bad';
  const badColor  = variant === 'close' ? 'var(--brand-text-dark)' : 'var(--feedback-bad)';
  const markColor = variant === 'close' ? 'var(--brand)'           : 'var(--feedback-bad)';

  const punct = /[\s，。！？、,!?.\-]/;
  const charArr = Array.from(targetC).filter(c => !punct.test(c));
  // Split by whitespace, then strip any trailing punctuation that came with the syllable
  const jpArr   = (targetJ || '').split(/\s+/)
    .map(s => s.replace(/[，。！？、,!?.\-]+$/, ''))
    .filter(Boolean);
  if (!charArr.length || charArr.length !== jpArr.length) return { html: '', hasDiff: false };   // alignment-impossible — caller handles fallback

  const heardClean = normalizeChinese(heard);
  const marks = alignChars(heardClean, charArr.join(''));
  const hasDiff = marks.some(m => !m || m.status !== 'match');

  const cols = charArr.map((c, idx) => {
    const m = marks[idx] || { status: 'missing' };
    const bad = m.status !== 'match';
    const tone = jpArr[idx].match(/[1-6]/);
    const toneColor = tone ? TONES[tone[0]].color : 'var(--muted-dark)';
    const charColor = bad ? badColor : 'var(--ink)';
    const jpColor   = bad ? badColor : toneColor;
    const mark = m.status === 'match'   ? '✓'
               : m.status === 'wrong'   ? m.heardChar
               : '·';   // missing
    const markStyle = m.status === 'match' ? 'color:var(--feedback-good-text);font-weight:600;'
                    : m.status === 'wrong' ? `color:${markColor};font-weight:600;font-size:14px;`
                    : 'color:var(--muted-dark);font-weight:600;';
    return `<div class="bd-col">
      <div class="bd-char" style="color:${charColor}">${c}</div>
      <div class="bd-status" style="${markStyle}">${mark}</div>
      <div class="bd-jp" style="color:${jpColor};font-weight:700">${jpArr[idx]}</div>
    </div>`;
  }).join('');

  return { html: `<div class="speak-breakdown">${cols}</div>`, hasDiff };
}

// Shared speech-recognition core for both conversation Speak mode and the
// sentence "Say it back" sheet (DES-38/40). Do NOT duplicate this — the
// Android quirk-handling below (cumulative finals, dedup) took five failed
// probe builds to get right (see docs/PROBE_METHOD.md and the ASR notes in
// STATUS.md); a second hand-written copy is exactly how that gets lost again.
// getTarget()/getStatus()/applyPatch() let each caller supply its own state
// location without this function knowing which one it is. getTarget() is
// called at onend, not at start, matching the original conversation
// behaviour — it reads whichever line/sentence is current at the moment
// recognition actually ends, not the one at the moment it began.
function startSpeechRecognition(getTarget, getStatus, applyPatch, onMatch) {
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
    applyPatch({ heard: (finalTranscript + interimTranscript).trim() || '…' });
  };
  rec.onerror = (e) => {
    if (e.error === 'no-speech' || e.error === 'aborted') return;  // user-initiated stop
    applyPatch({ status: 'mismatch', heard: '(error: ' + e.error + ')' });
  };
  rec.onend = () => {
    // Recognition session ended — if the caller is still in 'listening' mode, evaluate result
    if (getStatus() === 'listening') {
      const heard = finalTranscript.trim();
      if (!heard) {
        applyPatch({ status: 'idle', heard: '' });
      } else {
        const target = getTarget();
        const matched = fuzzyMatch(heard, target);
        applyPatch({ status: matched ? 'matched' : 'mismatch', heard });
        if (matched && onMatch) onMatch();
      }
    }
  };

  applyPatch({ status: 'listening', heard: '' });
  try { rec.start(); } catch(e) {
    applyPatch({ status: 'idle' });
  }
  _recognition = rec;
}

// Conversation Speak mode — patches state.convo.speakStatus/speakHeard and
// renders after every patch, same as before the recognition core was shared.
function applyConvoSpeakPatch(patch) {
  if ('status' in patch) state.convo.speakStatus = patch.status;
  if ('heard'  in patch) state.convo.speakHeard  = patch.heard;
  render();
}
function startListening() {
  startSpeechRecognition(
    () => activeConvoSource().lines[state.convo.speakStep].c,
    () => state.convo.speakStatus,
    applyConvoSpeakPatch,
    () => speakConvoLine(state.convo.speakStep)
  );
}

// Sentence "Say it back" sheet — patches state.sentSpeak.status/heard. No
// onMatch callback: unlike a conversation line, a standalone sentence has no
// next line to auto-advance into.
function applySentSpeakPatch(patch) {
  if ('status' in patch) state.sentSpeak.status = patch.status;
  if ('heard'  in patch) state.sentSpeak.heard  = patch.heard;
  render();
}
function startSentSpeakListening(target) {
  startSpeechRecognition(() => target, () => state.sentSpeak.status, applySentSpeakPatch, null);
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

