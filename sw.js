// Et vilkårlig navn for service workeren
var cacheName = 'handlelapp v1';

// Alle filer/paths som apper trenger
var filesToCache = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  './style.css',
  './images/check-list-shopping-icon.png'
];

// Lagrer alle filene når service workeren installeres
self.addEventListener('install', function(e) { // 'install' kjøres når service workeren først lastes ned
  e.waitUntil(
    caches.open(cacheName).then(function(cache) {
      return cache.addAll(filesToCache);
    })
  );
});

// Sender den lagrede dataen tilbake når det trengs, ellers hvis det ikke er lagret, sender dataen fra nettet
self.addEventListener('fetch', function(e) { // 'fetch' kjøres hver gang siden prøver å hente sider eller data på sider
  e.respondWith(
    caches.match(e.request).then(function(response) {
      return response || fetch(e.request);
    })
  );
});