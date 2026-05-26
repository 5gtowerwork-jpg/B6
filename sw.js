const CACHE_NAME = 'biriyani6-v2';

// Core assets - MUST exist for SW to install
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// Optional assets - won't fail install if missing
const OPTIONAL_ASSETS = [
  './icon-192.png',
  './icon-512.png'
];

// Install — cache core assets first, then try optional ones
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      // Cache core assets (will throw if any fail)
      await cache.addAll(CORE_ASSETS);
      // Cache optional assets individually (ignore failures)
      for (const asset of OPTIONAL_ASSETS) {
        try {
          await cache.add(asset);
        } catch (_) {}
      }
      return self.skipWaiting();
    })
  );
});

// Activate — remove old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch — cache-first, fallback to network, then offline page
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          }
          return response;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});
