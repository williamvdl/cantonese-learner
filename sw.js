// ── Jyut (Tea House Cantonese Learner) — Service Worker ─────────────────────────
// Cache-first strategy with stale-while-revalidate. Caches the app shell and
// all data files on install, so the app works fully offline.
//
// IMPORTANT — increment CACHE_VERSION on every deploy. The browser only picks
// up a new service worker when this string changes. If you forget to bump it,
// users will keep serving the old index.html from cache.

const CACHE_VERSION = 'cantonese-teahouse-v168';

// Pre-generated audio lives in its OWN cache, which activate deliberately keeps
// (v161). Until then audio shared CACHE_VERSION, so every deploy wiped it — and
// in practice it was never stored at all, because <audio> asks for clips with a
// Range header and GitHub Pages answers 206, which the old fetch handler (200
// only) skipped. Net effect: no clip was ever available offline.
//
// Bump AUDIO_CACHE only when existing clips are regenerated under the same
// file names (tools/generate-audio.js re-run over old content) — that is the
// one way a learner would otherwise keep hearing the old recording. Adding new
// clips needs no bump: they are fetched the first time they're played.
const AUDIO_CACHE = 'cantonese-audio-v3';

// App shell — fetched at install time.
// NOTE: when adding a new .js or .css file to the app, add it here too,
// otherwise it won't be cached for offline use.
const SHELL_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './vendor/to-jyutping.js',
  './data.js',
  './app.js',
  './render.js',
  './manifest.json',
  './data/topics_index.json',
  './data/categories.json',
  './data/learning_paths.json',
  './data/path_convos.json',
  './data/char-jyutping.json',
];

// Topic JSONs — pre-cached so every topic works offline from first install
const TOPIC_KEYS = [
  // 42 keys — must match the file count in /data/topics exactly. `connectives`
  // and `pronouns` were missing until v122, so neither was available offline;
  // `pronouns` is Beginner lesson one. Cross-check this list against the
  // directory after adding any topic — nothing else enforces it.
  'adjectives', 'animals', 'attractions', 'body', 'classifiers', 'clothing', 'colors',
  'comparisons', 'connectives', 'cooking', 'directions', 'drinks', 'emergencies',
  'family', 'feelings', 'food', 'friends', 'fruitveg', 'greetings', 'hobbies',
  'home', 'hotels', 'location', 'meatseafood', 'modals', 'money', 'numbers',
  'particles', 'phrases', 'pronouns', 'questions', 'restaurant', 'school',
  'shopping', 'sports', 'tech', 'tense', 'time', 'transport', 'weather',
  'work', 'yesno',
];
const TOPIC_ASSETS = TOPIC_KEYS.map(k => `./data/topics/${k}.json`);

const PRECACHE = [...SHELL_ASSETS, ...TOPIC_ASSETS];

// ── Install — cache the shell + all data ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      // Resilient precache: cache each asset individually so a single missing
      // or renamed file can't fail the whole install (which would block the SW
      // from ever updating). addAll() is atomic and would reject on one 404.
      .then(cache => Promise.allSettled(PRECACHE.map(u => cache.add(u))))
      .then(() => self.skipWaiting())
  );
});

// ── Activate — clean up old caches ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_VERSION && k !== AUDIO_CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ── Fetch — cache-first with background refresh (stale-while-revalidate) ──
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (new URL(event.request.url).pathname.includes('/audio/')) {
    event.respondWith(audioResponse(event.request));
    return;
  }
  event.respondWith(
    caches.match(event.request).then(cached => {
      const networkFetch = fetch(event.request).then(resp => {
        // Only cache successful, basic-origin responses
        if (resp && resp.status === 200 && resp.type === 'basic') {
          const copy = resp.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(event.request, copy));
        }
        return resp;
      }).catch(() => cached);  // offline → fall back to cache
      return cached || networkFetch;
    })
  );
});

// ── Audio — cache-first, whole file, sliced locally for Range requests ──
// The clip is always fetched and stored WHOLE (a plain request, no Range), so
// the cache holds one complete 200 per file however the browser asked for it.
// A Range request is then answered from that copy with a proper 206 — the
// shape media elements expect. No background refresh: a clip's content only
// changes when it is regenerated, and AUDIO_CACHE above covers that.
// A 404 is passed through uncached, so a clip generated later is picked up.
async function audioResponse(request) {
  const url = request.url.split('#')[0];
  const cache = await caches.open(AUDIO_CACHE);
  let full = await cache.match(url);
  if (!full) {
    let resp;
    try { resp = await fetch(url); }
    catch (e) { return Response.error(); }   // offline and never played
    if (!(resp.status === 200 && resp.type === 'basic')) return resp;
    await cache.put(url, resp.clone());
    full = resp;
  }
  const range = request.headers.get('range');
  if (!range) return full;
  const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  const blob = await full.blob();
  const size = blob.size;
  let start = m && m[1] !== '' ? +m[1] : null;
  let end = m && m[2] !== '' ? +m[2] : null;
  if (start === null && end !== null) { start = Math.max(0, size - end); end = size - 1; }   // suffix: last N bytes
  if (start === null) start = 0;
  if (end === null || end >= size) end = size - 1;
  if (!m || start > end || start >= size) {
    return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
  }
  return new Response(blob.slice(start, end + 1), {
    status: 206,
    headers: {
      'Content-Type': full.headers.get('Content-Type') || 'audio/mpeg',
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Content-Length': String(end - start + 1),
      'Accept-Ranges': 'bytes',
    },
  });
}
