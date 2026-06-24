// Spa CRM Service Worker v4 — HTML never cached, always fresh
const STATIC_CACHE = 'spa-crm-static-v4';
const STATIC_FILES = ['/manifest.json', '/icon.svg'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(STATIC_CACHE).then(c => c.addAll(STATIC_FILES).catch(() => {})));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== STATIC_CACHE).map(k => caches.delete(k))))
      .then(() => clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);

  // HTML (trang chính): LUÔN lấy từ network, không dùng cache
  const isHTML = req.headers.get('accept')?.includes('text/html')
    || url.pathname === '/'
    || url.pathname.endsWith('.html')
    || url.pathname.endsWith('.netlify.app');
  if (isHTML) {
    e.respondWith(fetch(req).catch(() => caches.match('/')));
    return;
  }

  // Static assets: cache-first
  e.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(STATIC_CACHE).then(c => c.put(req, clone));
        }
        return res;
      });
    }).catch(() => fetch(req))
  );
});
