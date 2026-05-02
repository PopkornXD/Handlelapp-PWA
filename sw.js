var cacheName = 'handlelapp v1';
var filesToCache = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  './style.css',
  './images/check-list-shopping-icon.png'
];


self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(cacheName).then(function(cache) {
      return cache.addAll(filesToCache);
    })
  );
});


self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(response) {
      return response || fetch(e.request);
    })
  );
});