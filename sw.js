// Robust service worker for Handlelapp-PWA
// - Caches core app shell and an offline fallback page
// - Tolerant install: if some assets fail to cache, we still try to cache critical assets
// - Cache-first serving for app shell and assets (predictable offline behavior)
// - Supports skipWaiting via postMessage from the page for controlled updates

const CACHE = 'handlelapp-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/images/check-list-shopping-icon.png',
  '/offline.html'
];

// Helper: cache a list of assets but tolerate failures for individual requests.
async function cacheAssetsSafe(cache, assets) {
  for (const url of assets) {
    try {
      const res = await fetch(url, {cache: 'no-store'})
      if (res && res.ok) await cache.put(url, res.clone())
    } catch (e) {
      // ignore individual failures
    }
  }
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE)
    try {
      // try bulk addAll first (faster), fall back to safe per-resource caching on failure
      await cache.addAll(ASSETS)
    } catch (err) {
      await cacheAssetsSafe(cache, ASSETS)
    }
  })())
  // activate immediately after install (optional: remove if you want waiting)
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.map(k => k === CACHE ? null : caches.delete(k)))
    if (self.clients && typeof self.clients.claim === 'function') await self.clients.claim()
  })())
})

// Support a message to trigger skipWaiting from the page
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting()
  }
})

// Fetch handler: cache-first for navigation and assets, fallback to offline.html
self.addEventListener('fetch', event => {
  const req = event.request
  if (req.method !== 'GET') return

  // Navigation (HTML) requests
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE)
      const cached = await cache.match('/index.html')
      if (cached) return cached
      try {
        const net = await fetch(req)
        if (net && net.ok) await cache.put('/index.html', net.clone())
        return net
      } catch (e) {
        const fallback = await cache.match('/offline.html')
        return fallback || new Response('Offline', {status: 503, headers: {'Content-Type': 'text/plain'}})
      }
    })())
    return
  }

  // Other assets: cache-first
  event.respondWith(caches.match(req).then(resp => resp || fetch(req)))
})
