// ===================================================================
// data.js — icons, data store, storage module
// Loaded FIRST. Defines: ICON_PATHS, icon(), iconPlay(), store, storage.
// ===================================================================

// Single brand accent used for all topic/lesson UI colouring. Category colours
// are intentionally dropped (see topicMeta). Keep this in sync with CSS --brand.
const BRAND_ACCENT = '#C2410C';


// ── Icon System ──────────────────────────────────────────────────────────────
// Inline SVG icons (Lucide, MIT licensed) for app chrome — play, back, info, etc.
// Inlined rather than loaded from a CDN so the app stays fully offline-capable.
// Topic/category emoji are intentionally kept as emoji (they're content, not chrome).
// Each entry is the inner markup of a 24x24 0 0 viewBox stroke icon.
const ICON_PATHS = {
  play:    '<polygon points="6 3 20 12 6 21 6 3"/>',
  pause:   '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
  volume:  '<path d="M11 4.7a.7.7 0 0 0-1.2-.5L6 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h3l3.8 3.8a.7.7 0 0 0 1.2-.5z"/><path d="M16 9a5 5 0 0 1 0 6"/><path d="M19.4 6a9 9 0 0 1 0 12"/>',
  arrowLeft:  '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  arrowRight: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  info:    '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  close:   '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  check:   '<path d="M20 6 9 17l-5-5"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  stop:    '<rect x="5" y="5" width="14" height="14" rx="2"/>',
  mic:     '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>',
  bookOpen:'<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
  messageCircle:'<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z"/>',
  brain:   '<path d="M12 5a3 3 0 1 0-5.997.142M12 5a3 3 0 1 1 5.997.142M12 5v13a3 3 0 0 0 5.997.142M12 18a3 3 0 0 1-5.997.142M6.003 5.142A4 4 0 0 0 4 9a4 4 0 0 0 .064 4M18 5.142A4 4 0 0 1 20 9a4 4 0 0 1-.064 4"/>',
  // Quiz tab icon — graduation cap reads clearly at small sizes (the brain icon was too intricate)
  quiz:    '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
  // ── Tab bar + settings (v117). Transcribed from mockup 13, which drew all six.
  // The drawer used emoji for the five destinations; emoji are content, not
  // chrome (see the note above), and at 19px they render inconsistently across
  // platforms and cannot take currentColor — so an active tab could not turn
  // brand. These are stroke paths for that reason, not for tidiness.
  home:      '<path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V20h13V9.5"/>',
  path:      '<path d="M4 19c4-1 4-7 8-7s4-6 8-7"/><circle cx="4" cy="19" r="1.6"/><circle cx="20" cy="5" r="1.6"/>',
  topics:    '<path d="M4 5.5A2 2 0 0 1 6 4h5v16H6a2 2 0 0 1-2-1.5z"/><path d="M20 5.5A2 2 0 0 0 18 4h-5v16h5a2 2 0 0 0 2-1.5z"/>',
  review:    '<path d="M4 7h6l2 2h8v10H4z"/>',
  translate: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.5 2.7 2.5 15.3 0 18"/><path d="M12 3c-2.5 2.7-2.5 15.3 0 18"/>',
  // Settings cog. Drawn at a lighter weight than the Lucide original: at 17px in
  // the header corner the full-detail version turns to mush.
  cog:       '<circle cx="12" cy="12" r="3.2"/><path d="M19.1 14.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5v.2a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3h.1a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8v.1a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
};
// Render an icon as an inline SVG string. size in px, optional className.
function icon(name, size, cls) {
  size = size || 18;
  const path = ICON_PATHS[name];
  if (!path) return '';
  return `<svg class="icon${cls ? ' ' + cls : ''}" width="${size}" height="${size}" viewBox="0 0 24 24" `
       + `fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" `
       + `stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}
// The play icon is solid-filled rather than stroked — looks better small
function iconPlay(size, cls) {
  size = size || 18;
  return `<svg class="icon${cls ? ' ' + cls : ''}" width="${size}" height="${size}" viewBox="0 0 24 24" `
       + `fill="currentColor" stroke="none" aria-hidden="true">${ICON_PATHS.play}</svg>`;
}

// ── Data Store ──────────────────────────────────────────────────────────────
// All content lives in /data/ as JSON. The store loads reference data on init
// and lazy-loads per-topic JSON on demand, caching in memory.
const store = {
  index:           null,   // [ {key, label, icon, color, rounds} ]
  categoryList:    null,   // [ {key, label, icon} ]
  topicCategories: null,   // { greetings: 'everyday', ... }
  paths:           null,   // [ {key, label, ..., lessons, stages?} ]
  pathConvos:      {},      // { 'beginner-s1': {title, speakers, lines} } — checkpoint consolidation convos.
                            // Defaults to {} so a checkpoint with no authored convo simply finds nothing.
  topicCache:      {},     // { greetings: {meta, rounds}, ... }

  // Index lookups — synchronous after init
  indexEntry(key) { return (this.index || []).find(t => t.key === key); },
  availableRounds(key) {
    const e = this.indexEntry(key);
    return e ? e.rounds.slice() : [1];
  },
  topicsByCategory(catKey) {
    if (!this.topicCategories) return [];
    return Object.keys(this.topicCategories).filter(t => this.topicCategories[t] === catKey);
  },

  // Topic metadata — colour comes from category (not the topic's own color),
  // for visual cohesion across topics in the same category.
  topicMeta(key) {
    const cached = this.topicCache[key];
    const baseLabel = cached ? cached.meta.label : (this.indexEntry(key)?.label || '');
    const baseIcon  = cached ? cached.meta.icon  : (this.indexEntry(key)?.icon  || '');
    // Visual identity: category/topic accent colours are dropped in favour of a
    // single coherent brand accent. The per-category colours still exist in the
    // data (categories.json / topics_index.json) but are no longer surfaced as
    // UI accents. Jyutping tone colours are a SEPARATE system and unaffected.
    const color = BRAND_ACCENT;
    return { label: baseLabel, icon: baseIcon, color };
  },

  // Topic content — must be loaded first; returns null otherwise
  isTopicLoaded(key) { return !!this.topicCache[key]; },
  roundData(key, round) {
    const t = this.topicCache[key];
    return t ? (t.rounds[String(round)] || null) : null;
  },

  // Reference-data loaders (called once on init)
  async loadIndex() {
    const r = await fetch('./data/topics_index.json');
    this.index = (await r.json()).topics;
  },
  async loadCategories() {
    const r = await fetch('./data/categories.json');
    const j = await r.json();
    this.categoryList = j.list;
    this.topicCategories = j.topic_map;
  },
  async loadPaths() {
    const r = await fetch('./data/learning_paths.json');
    this.paths = (await r.json()).paths;
  },
  async loadPathConvos() {
    // Checkpoint consolidation conversations. Optional file — if it's absent or
    // fails to load, checkpoints simply render without a conversation activity.
    try {
      const r = await fetch('./data/path_convos.json');
      if (r.ok) this.pathConvos = (await r.json()).convos || {};
    } catch (e) { this.pathConvos = {}; }
  },
  pathConvo(key) { return this.pathConvos[key] || null; },

  // Topic loader (cached) — returns the cached topic object
  async loadTopic(key) {
    if (this.topicCache[key]) return this.topicCache[key];
    const r = await fetch('./data/topics/' + key + '.json');
    if (!r.ok) throw new Error('Topic ' + key + ' failed to load: ' + r.status);
    const j = await r.json();
    this.topicCache[key] = j;
    return j;
  },

  // Convenience: load several topics in parallel. Resilient — a single failed
  // topic (e.g. a not-yet-deployed file) must not reject the whole batch and
  // leave callers (like the path timeline) stuck on a loading screen. Returns
  // the list of keys that failed so callers/devs can see what's missing.
  async loadTopics(keys) {
    const need = keys.filter(k => !this.topicCache[k]);
    const results = await Promise.allSettled(need.map(k => this.loadTopic(k)));
    const failed = need.filter((_, i) => results[i].status === 'rejected');
    if (failed.length) console.warn('[loadTopics] failed to load:', failed);
    return failed;
  },
};

// ── Storage module ────────────────────────────────────────────────────────────
// THE single owner of every localStorage access in the app. Nothing else
// touches localStorage directly. Two design rules make this future-proof:
//
//  1. READ-ONCE / WRITE-THROUGH. On init() the module hydrates every stored
//     area into an in-memory cache (storage._cache). After that, reads are
//     SYNCHRONOUS (served from cache — instant, no await, callers unchanged)
//     and writes are ASYNC (update cache, then persist). This is how a
//     server-backed app works: hold state in memory, sync writes to the
//     backend. So swapping localStorage for a server later means rewriting
//     only _persist() and _hydrate() — every accessor and caller stays put.
//
//  2. VERSIONED ENVELOPES. Every blob is stored as { v: <schemaVersion>, data: <payload> }.
//     _readRaw() runs the envelope through _migrate() before returning the
//     payload, so a future data-shape change just bumps the version and adds
//     a migration step — existing users' saved data upgrades automatically.
//
// Key registry — every storage key defined once, consistent naming.
const STORAGE_KEYS = {
  wordReview:    'cantonese:wordReview',
  quizDirection: 'cantonese:quizDirection',
  apiKey:        'cantonese:apiKey',
  pathProgress:  'cantonese:pathProgress',
};

// Current schema version per area. Bump when the stored shape of an area changes,
// and add a matching case in _migrate(). All start at 1.
const STORAGE_SCHEMA = {
  wordReview:    2,
  quizDirection: 1,
  apiKey:        1,
  pathProgress:  1,
};

// Legacy keys from before the storage module existed. _hydrate() does a one-time
// migration: if a new key is absent but its legacy key has data, the legacy value
// is adopted. Ensures existing users keep their path progress, API key, etc.
const STORAGE_LEGACY_KEYS = {
  wordReview:    'cantonese-word-review-v1',
  quizDirection: 'cantonese.quizDirection',
  apiKey:        'cantonese_api_key',
  pathProgress:  'cantonese_path_progress',
};

const storage = {
  // In-memory cache, hydrated once by init(). area → payload.
  _cache: {},

  // --- Core: the ONLY two functions that touch localStorage. ---
  // Swapping to a server backend = rewriting just these two (plus _hydrate).

  // Read a raw versioned envelope from localStorage, run migrations, return payload.
  // Returns fallback if absent, malformed, or unparseable (defensive — never throws).
  _readRaw(area, fallback) {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS[area]);
      if (raw == null) return fallback;
      const env = JSON.parse(raw);
      // Envelope shape { v, data }. If it's missing (shouldn't happen for data we
      // wrote), treat the whole blob as un-versioned legacy payload.
      if (env && typeof env === 'object' && 'v' in env && 'data' in env) {
        return this._migrate(area, env.v, env.data);
      }
      return this._migrate(area, 0, env);
    } catch (e) {
      return fallback;
    }
  },

  // Persist a payload to localStorage wrapped in a current-version envelope.
  _persist(area, payload) {
    try {
      const env = { v: STORAGE_SCHEMA[area], data: payload };
      localStorage.setItem(STORAGE_KEYS[area], JSON.stringify(env));
    } catch (e) {
      // localStorage full/unavailable — fail silently; in-memory cache still works.
    }
  },

  // --- Migration ---
  // Upgrade a payload from its stored version to the current schema version.
  // Today every area is at v1 with no prior shape, so every case is a pass-through.
  // When a shape changes: bump STORAGE_SCHEMA[area], add `if (fromV < N) { ... }`.
  _migrate(area, fromV, data) {
    // Word Review v1 → v2: entries gain a stable `wid` (word id) as their durable
    // identity, replacing the fragile topicKey|round|wordC string match. This step
    // is deliberately CONTENT-FREE — it only ensures the `wid` key exists (null),
    // because topic JSON isn't loaded yet at hydrate time. The actual wordC → wid
    // resolution is done lazily by the Word Review builder (which loads the topics
    // it needs), so this layer stays server-swap-clean.
    if (area === 'wordReview' && fromV < 2) {
      if (data && Array.isArray(data.entries)) {
        data = { ...data, entries: data.entries.map(e => ('wid' in e ? e : { wid: null, ...e })) };
      }
    }
    return data;
  },

  // --- Hydration ---
  // Called once by init(). Loads every area into _cache. Performs one-time
  // legacy-key migration: new key absent + legacy key present → adopt legacy value
  // and re-persist under the new key/envelope (so legacy keys are read at most once).
  _hydrate() {
    const defaults = {
      wordReview:    { everUsed: false, entries: [] },
      quizDirection: 'zh-en',
      apiKey:        '',
      pathProgress:  {},
    };
    Object.keys(STORAGE_KEYS).forEach(area => {
      const newKeyPresent = localStorage.getItem(STORAGE_KEYS[area]) != null;
      if (newKeyPresent) {
        this._cache[area] = this._readRaw(area, defaults[area]);
        return;
      }
      // New key absent — check for legacy data to migrate.
      const legacyKey = STORAGE_LEGACY_KEYS[area];
      const legacyRaw = legacyKey ? localStorage.getItem(legacyKey) : null;
      if (legacyRaw != null) {
        let payload = defaults[area];
        try {
          // Legacy quizDirection/apiKey were stored as bare strings, not JSON objects.
          payload = (area === 'quizDirection' || area === 'apiKey')
            ? legacyRaw
            : JSON.parse(legacyRaw);
        } catch (e) {
          payload = defaults[area];
        }
        this._cache[area] = payload;
        this._persist(area, payload);   // adopt under the new versioned key
      } else {
        this._cache[area] = defaults[area];
      }
    });
  },

  // --- Public accessors: SYNC reads (from cache), ASYNC writes (cache + persist) ---

  // Word Review bin: { everUsed, entries }
  getWordReview()        { return this._cache.wordReview; },
  async setWordReview(v) { this._cache.wordReview = v; this._persist('wordReview', v); },

  // Quiz direction: string
  getQuizDirection()        { return this._cache.quizDirection; },
  async setQuizDirection(v) { this._cache.quizDirection = v; this._persist('quizDirection', v); },

  // API key: string
  getApiKey()        { return this._cache.apiKey; },
  async setApiKey(v) { this._cache.apiKey = v; this._persist('apiKey', v); },
  async clearApiKey() { this._cache.apiKey = ''; this._persist('apiKey', ''); },

  // Path progress: { pathKey: { lessonKey: true } }
  getPathProgress()        { return this._cache.pathProgress; },
  async setPathProgress(v) { this._cache.pathProgress = v; this._persist('pathProgress', v); },
};

