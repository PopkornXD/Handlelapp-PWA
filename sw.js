const CACHE = 'handlelapp-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/images/check-list-shopping-icon.png'
];

self.addEventListener('install', event => {
  console.log('[sw] install')
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', event => {
  console.log('[sw] activate')
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => key === CACHE ? null : caches.delete(key))
    ))
  );

  if (self.clients && typeof self.clients.claim === 'function') {
    event.waitUntil(self.clients.claim());
  }
});

self.addEventListener('fetch', event => {
  const req = event.request;

  if (req.mode === 'navigate' || (req.method === 'GET' && req.headers.get('accept')?.includes('text/html'))) {
    console.log('[sw] navigation request', req.url)
    event.respondWith(
      fetch(req)
        .then(networkResponse => {
          caches.open(CACHE).then(cache => {
            try {
              cache.put('/index.html', networkResponse.clone());
            } catch (e) { }
          });
          return networkResponse;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  console.log('[sw] fetch', req.url)
  event.respondWith(
    caches.match(req).then(resp => resp || fetch(req))
  );
});
