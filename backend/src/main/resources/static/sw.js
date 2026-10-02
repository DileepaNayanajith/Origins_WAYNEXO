// WAYNEXO service worker: keeps the app shell available offline (drivers lose signal on the road).
const CACHE = 'waynexo-shell-v1'
self.addEventListener('install', (e) => { self.skipWaiting() })
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))
self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET' || new URL(req.url).pathname.startsWith('/api/')) return
  e.respondWith(
    fetch(req).then((res) => {
      const copy = res.clone()
      caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {})
      return res
    }).catch(() => caches.match(req).then((r) => r || caches.match('/')))
  )
})
