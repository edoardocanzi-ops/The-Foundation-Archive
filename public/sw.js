const CACHE_NAME = 'foundation-archive-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/1000013824.png',
  '/1000013825.png',
  '/icona.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
