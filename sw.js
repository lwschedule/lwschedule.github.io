const CACHE_NAME = 'lwschedule-v4.0.2';
const urlsToCache = [
  '/',
  '/index.html',
  '/data/ticker-messages.json',
  '/data/events.json',
  '/data/classes.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/today/index.html',
  '/week/index.html',
  '/month/index.html',
  '/events/index.html',
  '/holidays/index.html',
  '/schedules/index.html',
  '/quarters/index.html',
  '/info/index.html',
  '/settings/index.html',
  '/settings/classes/index.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
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
  self.clients.claim();
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      for (let client of windowClients) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
