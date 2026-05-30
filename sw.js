// ── Cantonese Learner — Service Worker ──────────────────────────────────────
// Cache-first strategy with stale-while-revalidate. Caches the app shell and
// all data files on install, so the app works fully offline.
//
// IMPORTANT — increment CACHE_VERSION on every deploy. The browser only picks
// up a new service worker when this string changes. If you forget to bump it,
// users will keep serving the old index.html from cache.

const CACHE_VERSION = 'cantonese-teahouse-v42';

// App shell — fetched at install time.
// NOTE: when adding a new .js or .css file to the app, add it here too,
// otherwise it won't be cached for offline use.
const SHELL_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './data.js',
  './app.js',
  './render.js',
  './manifest.json',
  './data/topics_index.json',
  './data/categories.json',
  './data/learning_paths.json',
  './data/patterns.json',
  './data/path_convos.json',
];

// Topic JSONs — pre-cached so every topic works offline from first install
const TOPIC_KEYS = [
  'animals','attractions','body','colors','cooking','directions','emergencies',
  'family','feelings','food','friends','greetings','hobbies','home','hotels',
  'money','numbers','particles','phrases','questions','restaurant','school',
  'shopping','sports','tech','tense','time','transport','weather','work','yesno',
];
const TOPIC_ASSETS = TOPIC_KEYS.map(k => `./data/topics/${k}.json`);

const PRECACHE = [...SHELL_ASSETS, ...TOPIC_ASSETS];

// ── Install — cache the shell + all data ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// ── Activate — clean up old caches ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ── Fetch — cache-first with background refresh (stale-while-revalidate) ──
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
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
