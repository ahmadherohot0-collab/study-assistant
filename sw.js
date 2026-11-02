const CACHE_NAME = 'study-assistant-v8';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './app.js',
  './db.js',
  './ai.js',
  './features.js',
  './manifest.json',
  './icon.png',
  './icon.ico'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Stale-while-revalidate: answer from cache instantly, refresh the cache in the background.
// CDN scripts/fonts (Tailwind, Lucide, Marked, DOMPurify, Cairo) are cached after the first online visit,
// so the whole app also opens offline.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith('http')) return;
  // Never cache Gemini API calls
  if (req.url.includes('generativelanguage.googleapis.com')) return;

  e.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req).then((res) => {
        if (res && (res.ok || res.type === 'opaque')) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return res;
      }).catch(() => {
        if (cached) return cached;
        if (req.mode === 'navigate') return caches.match('./index.html');
        return Response.error();
      });

      if (cached) {
        e.waitUntil(network.catch(() => {}));
        return cached;
      }
      return network;
    })
  );
});
