const CACHE = 'handlelapp-v1';
const ASSETS = [
  'index.html',
  'style.css',
  'app.js',
  'manifest.json',
  'images/check-list-shopping-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => key === CACHE ? null : caches.delete(key))
    ))
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;

  if (req.mode === 'navigate' || (req.method === 'GET' && req.headers.get('accept')?.includes('text/html'))) {
    event.respondWith(
      caches.match('index.html').then(resp => resp || fetch(req))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(resp => resp || fetch(req))
  );
});
