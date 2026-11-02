// TimeSnap service worker — network-first, scope /timesnap-app/
const CACHE = 'timesnap-v4';
const SCOPE = '/timesnap-app/';
const PRECACHE = [SCOPE, SCOPE + 'index.html', SCOPE + 'manifest.webmanifest', SCOPE + 'icons/icon-192.png', SCOPE + 'icons/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

function neverCache(url) {
  if (url.origin !== self.location.origin) return true; // worker domain, Gemini, CoinGecko, fonts, any auth — never cached
  if (url.pathname.includes('/api/')) return true;
  if (/generativelanguage\.googleapis\.com|workers\.dev|\/auth|oauth|login|token/i.test(url.href)) return true;
  return !url.pathname.startsWith(SCOPE);
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (neverCache(url)) return; // pass straight to network
  e.respondWith((async () => {
    try {
      const res = await fetch(req);
      if (res.ok && res.type === 'basic') {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    } catch (err) {
      const cached = await caches.match(req, { ignoreSearch: req.mode === 'navigate' });
      if (cached) return cached;
      if (req.mode === 'navigate') {
        const shell = await caches.match(SCOPE + 'index.html') || await caches.match(SCOPE);
        if (shell) return shell;
      }
      throw err;
    }
  })());
});
