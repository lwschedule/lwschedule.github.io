// Updated cache name to reflect the new release date (v3.5) – May 31, 2026
const CACHE_NAME = 'lwschedule-2026-06-27-5';
// Minimal app-shell to keep install fast; other assets cached at runtime
const urlsToCache = [
  '/',
  '/index.html',
  '/common-core.js',
  '/common.css',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
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
    caches.match(event.request).then((response) => {
      if (response) return response;

      return fetch(event.request).then((networkResponse) => {
        // Runtime cache for GET requests: scripts, styles, images, and data
        try {
          const req = event.request;
          if (req.method === 'GET' && (req.destination === 'script' || req.destination === 'style' || req.destination === 'image' || req.url.includes('/data/'))) {
            caches.open(CACHE_NAME).then((cache) => {
              try { cache.put(req, networkResponse.clone()); } catch (e) {}
            });
          }
        } catch (e) {}
        return networkResponse;
      }).catch(() => {
        // Fallback to index.html for navigation requests when offline
        if (event.request.mode === 'navigate' || (event.request.headers && event.request.headers.get && event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html'))) {
          return caches.match('/index.html');
        }
        return undefined;
      });
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
