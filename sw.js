const CACHE_NAME = 'lwschedule-v1.9.2';
const urlsToCache = [
  '/',
  '/index.html',
  '/images/logo.png',
  '/today/index.html',
  '/week/index.html',
  '/month/index.html',
  '/holidays/index.html',
  '/schedules/index.html',
  '/quarters/index.html',
  '/info/index.html',
  '/settings/index.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
