const VERSION = 'quran-feham-shell-v1';
const SHELL = [
  './', './index.html', './src/styles.css', './src/app.js', './src/core.js',
  './src/api.js', './src/data.js', './manifest.webmanifest', './icon.svg'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    event.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); return res;
    })));
    return;
  }
  // Quran API/audio remains network-first. The app separately caches JSON with source/version boundaries.
  if (url.hostname === 'api.alquran.cloud') {
    event.respondWith(fetch(req).catch(() => caches.match(req)));
  }
});
