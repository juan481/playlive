const CACHE_NAME = 'playlive-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/admin.html',
  '/styles.css',
  '/script.js',
  '/icon.png',
  'https://player.live-video.net/1.20.0/amazon-ivs-player.min.js',
  'https://web-broadcast.live-video.net/1.6.0/amazon-ivs-broadcast.min.js'
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