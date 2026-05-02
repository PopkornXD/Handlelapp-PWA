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
  console.log('[sw] install start')
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE)
    try {
      // try bulk addAll first (faster), fall back to safe per-resource caching on failure
      await cache.addAll(ASSETS)
      console.log('[sw] cache.addAll succeeded')
    } catch (err) {
      console.warn('[sw] cache.addAll failed, falling back to safe caching', err)
      try {
        await cacheAssetsSafe(cache, ASSETS)
        console.log('[sw] cacheAssetsSafe completed')
      } catch (e) {
        console.error('[sw] cacheAssetsSafe error', e)
      }
    }
  })())
  // activate immediately after install (optional: remove if you want waiting)
  try { self.skipWaiting(); console.log('[sw] skipWaiting called') } catch (e) {}
})

self.addEventListener('activate', event => {
  console.log('[sw] activate start')
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys()
      await Promise.all(keys.map(k => k === CACHE ? null : caches.delete(k)))
      if (self.clients && typeof self.clients.claim === 'function') await self.clients.claim()
      console.log('[sw] activate completed')
    } catch (e) {
      console.error('[sw] activate error', e)
    }
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
      try {
        const cached = await cache.match('/index.html')
        if (cached) {
          // serve cached shell
          return cached
        }
        // else try network
        const net = await fetch(req)
        if (net && net.ok) {
          try { await cache.put('/index.html', net.clone()) } catch (e) { console.warn('[sw] put index.html failed', e) }
        }
        return net
      } catch (e) {
        console.warn('[sw] fetch navigation failed, serving offline fallback', e)
        const fallback = await cache.match('/offline.html')
        return fallback || new Response('Offline', {status: 503, headers: {'Content-Type': 'text/plain'}})
      }
    })())
    return
  }

  // Other assets: cache-first with logging
  event.respondWith((async () => {
    try {
      const cached = await caches.match(req)
      if (cached) return cached
      const net = await fetch(req)
      return net
    } catch (e) {
      console.warn('[sw] fetch failed for', req.url, e)
      throw e
    }
  })())
})
