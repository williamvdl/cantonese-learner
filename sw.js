// ── Cantonese Learner — Service Worker ───────────────────────────────────────
// VERSION: bump this string every time you push a new index.html to GitHub.
// Change cantonese-v1 → cantonese-v2, etc. That's the only thing needed.
const CACHE_NAME = 'cantonese-v1';

// Files to pre-cache on first install.
// If you later add icon files or split data into /data/ folder, add them here.
const PRECACHE_ASSETS = [
  './index.html',
];

// ── Install ───────────────────────────────────────────────────────────────────
// Runs once when the service worker is first registered.
// Downloads and stores the listed files so they're available offline.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting()) // activate immediately, don't wait for old tabs to close
  );
});

// ── Activate ──────────────────────────────────────────────────────────────────
// Runs after install. Deletes any old caches from previous versions.
// This is what keeps storage tidy when you bump the version number above.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames =>
        Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME) // find caches that aren't the current version
            .map(name => caches.delete(name))     // delete them
        )
      )
      .then(() => self.clients.claim()) // take control of open pages immediately
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
// Intercepts every network request the app makes and decides what to return.
//
// Strategy:
//   HTML files  → Network-first: always try to get fresh content when online,
//                 fall back to cached copy when offline. This means your updates
//                 appear immediately on refresh, same as before — no version
//                 bump needed just to see HTML changes when you have signal.
//
//   Everything else → Cache-first: return cached copy instantly (fast), then
//                 update the cache from network in the background for next time.
//
self.addEventListener('fetch', event => {
  const request = event.request;

  // Only handle GET requests (not POST etc.)
  if (request.method !== 'GET') return;

  // Only handle requests to the same origin (your GitHub Pages domain)
  // Ignore requests to external APIs like the translation provider
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // HTML files — network-first
  if (request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then(networkResponse => {
          // Got a fresh response — save a copy to cache and return it
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, responseToCache));
          return networkResponse;
        })
        .catch(() =>
          // Network failed (offline) — return the cached copy
          caches.match(request).then(cached => cached || new Response('Offline', { status: 503 }))
        )
    );
    return;
  }

  // Everything else — cache-first
  event.respondWith(
    caches.match(request)
      .then(cached => {
        if (cached) {
          // Return cached version immediately
          // Also fetch a fresh copy in the background for next time
          fetch(request).then(networkResponse => {
            caches.open(CACHE_NAME).then(cache => cache.put(request, networkResponse));
          }).catch(() => {}); // silently ignore network errors for background refresh
          return cached;
        }
        // Not in cache — fetch from network and cache it
        return fetch(request).then(networkResponse => {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, responseToCache));
          return networkResponse;
        });
      })
  );
});
