// Minimal service worker for Handlelapp-PWA
// - Cache the app shell at install
// - Remove old caches at activate
// - Serve cached responses first (cache-first) for predictable offline behavior

const CACHE = 'handlelapp-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/images/check-list-shopping-icon.png'
];

// Install: cache essential files. If addAll fails the install will fail and
// the SW won't activate — this keeps behavior simple and predictable.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
});

// Activate: remove any old caches and take control of pages immediately.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => key === CACHE ? null : caches.delete(key))
    ))
  );
  if (self.clients && typeof self.clients.claim === 'function') {
    event.waitUntil(self.clients.claim());
  }
});

// Fetch: cache-first for navigations and assets. If not in cache, fall back to network.
self.addEventListener('fetch', event => {
  const req = event.request;

  if (req.mode === 'navigate' || (req.method === 'GET' && req.headers.get('accept')?.includes('text/html'))) {
    // Navigation requests: serve cached index.html if available, else network.
    event.respondWith(caches.match('/index.html').then(cached => cached || fetch(req)));
    return;
  }

  // For other requests (assets), try cache first, then network.
  event.respondWith(caches.match(req).then(resp => resp || fetch(req)));
});
