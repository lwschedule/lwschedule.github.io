const CACHE_NAME = 'lwschedule-v2.10.2';
const urlsToCache = [
  '/',
  '/index.html',
  '/404.html',
  '/manifest.json',
  '/common.css',
  '/common.js',
  '/images/logo.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/app/index.html',
  '/today/index.html',
  '/week/index.html',
  '/month/index.html',
  '/holidays/index.html',
  '/schedules/index.html',
  '/quarters/index.html',
  '/info/index.html',
  '/settings/index.html',
  '/data/schedules.json',
  '/data/holidays.json',
  '/data/terms.json',
  '/data/clubs.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(event.request);
      const networkResponsePromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(() => null);

      if (cachedResponse) {
        // Return fast from cache while updating in background.
        networkResponsePromise.catch(() => null);
        return cachedResponse;
      }

      return networkResponsePromise;
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
  self.clients.claim();
});
