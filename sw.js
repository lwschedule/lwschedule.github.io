const CACHE_VERSION = '2026-05-12';
/**
 * === CACHE VERSION & DATA PROTECTION POLICY ===
 * 
 * CACHE_VERSION is automatically updated on each commit via auto_bump_version.py
 * It is set to the current date (YYYY-MM-DD format).
 * 
 * CRITICAL: Changing CACHE_VERSION does NOT affect localStorage.
 * User settings, preferences, and app state are stored in localStorage and are
 * completely independent from the service worker cache.
 * 
 * When CACHE_VERSION changes:
 * ✓ Service worker will update to new cache
 * ✓ Cached assets will be refreshed
 * ✗ User data in localStorage will NOT be affected
 * ✗ User data will NOT be reset
 * ✗ Setup will NOT be triggered again
 * 
 * If you need to reset ALL user data worldwide, use reset.js:
 * 1. Open /reset.js
 * 2. Change TRIGGER_RESET from 'false' to 'true'
 * 3. Commit and push
 * 4. All users will reset on next visit
 * 5. Change TRIGGER_RESET back to 'false' immediately
 * 
 * DO NOT EVER change cache version to reset user data - use reset.js instead.
 * 
 * DO NOT EVER change cache version to reset user data - use reset.js instead.
 */
const APP_SHELL_CACHE_NAME = `lwschedule-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE_NAME = `lwschedule-runtime-${CACHE_VERSION}`;
const RUNTIME_CACHED_AT_HEADER = 'x-sw-cached-at';
const MAX_RUNTIME_CACHE_ENTRIES = 100;
const MAX_RUNTIME_CACHE_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const DATA_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const RUNTIME_CACHE_MAINTENANCE_INTERVAL_MS = 24 * 60 * 60 * 1000;
// Minimal app-shell to keep install fast; runtime assets are capped separately.
const urlsToCache = [
  '/',
  '/index.html',
  '/today',
  '/week',
  '/common-core.js',
  '/common.css',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

let runtimeCacheEntryCount = null;
let lastRuntimeCachePruneAt = 0;

function shouldCacheRuntimeResponse(request, response) {
  return request.method === 'GET' && response && response.ok && (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.url.includes('/data/')
  );
}

function isRuntimeCacheableRequest(request) {
  return request.method === 'GET' && (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.url.includes('/data/')
  );
}

function isExpiredRuntimeResponse(response) {
  const cachedAt = Number(response.headers.get(RUNTIME_CACHED_AT_HEADER));
  return !Number.isFinite(cachedAt) || Date.now() - cachedAt > MAX_RUNTIME_CACHE_AGE_MS;
}

async function getAnyCachedResponse(request) {
  const cache = await caches.open(RUNTIME_CACHE_NAME);
  const response = await cache.match(request);
  return response; // Return whatever is cached (fresh or stale) or null
}

async function getFreshRuntimeResponse(request) {
  const cache = await caches.open(RUNTIME_CACHE_NAME);
  const response = await cache.match(request);
  if (!response) return null;

  if (isExpiredRuntimeResponse(response)) {
    await cache.delete(request);
    if (runtimeCacheEntryCount !== null) {
      runtimeCacheEntryCount = Math.max(0, runtimeCacheEntryCount - 1);
    }
    return null;
  }

  return response;
}

async function ensureRuntimeCacheEntryCount() {
  if (runtimeCacheEntryCount !== null) {
    return runtimeCacheEntryCount;
  }

  const cache = await caches.open(RUNTIME_CACHE_NAME);
  runtimeCacheEntryCount = (await cache.keys()).length;
  return runtimeCacheEntryCount;
}

async function cacheRuntimeResponse(request, response) {
  const cache = await caches.open(RUNTIME_CACHE_NAME);
  const existingResponse = await cache.match(request);
  const clonedResponse = response.clone();
  const headers = new Headers(clonedResponse.headers);
  headers.set(RUNTIME_CACHED_AT_HEADER, Date.now().toString());
  headers.set('Cache-Control', 'stale-while-revalidate=86400'); // 24h stale
  const stampedResponse = new Response(clonedResponse.body, {
    status: clonedResponse.status,
    statusText: clonedResponse.statusText,
    headers
  });

  await cache.put(request, stampedResponse);

  if (existingResponse) {
    return;
  }

  const entryCount = await ensureRuntimeCacheEntryCount();
  runtimeCacheEntryCount = entryCount + 1;

  if (runtimeCacheEntryCount > MAX_RUNTIME_CACHE_ENTRIES || Date.now() - lastRuntimeCachePruneAt > RUNTIME_CACHE_MAINTENANCE_INTERVAL_MS) {
    const deletedCount = await pruneRuntimeCache();
    runtimeCacheEntryCount = Math.max(0, runtimeCacheEntryCount - deletedCount);
    lastRuntimeCachePruneAt = Date.now();
  }
}

async function pruneRuntimeCache() {
  const cache = await caches.open(RUNTIME_CACHE_NAME);
  const requests = await cache.keys();
  const now = Date.now();
  const entries = [];
  let deletedCount = 0;

  for (const request of requests) {
    const response = await cache.match(request);
    if (!response) continue;

    const cachedAt = Number(response.headers.get(RUNTIME_CACHED_AT_HEADER));
    const isExpired = !Number.isFinite(cachedAt) || now - cachedAt > MAX_RUNTIME_CACHE_AGE_MS;
    if (isExpired) {
      await cache.delete(request);
      deletedCount += 1;
      continue;
    }

    entries.push({ request, cachedAt });
  }

  if (entries.length > MAX_RUNTIME_CACHE_ENTRIES) {
    entries.sort((left, right) => left.cachedAt - right.cachedAt);
    for (const { request } of entries.slice(0, entries.length - MAX_RUNTIME_CACHE_ENTRIES)) {
      await cache.delete(request);
      deletedCount += 1;
    }
  }

  return deletedCount;
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    (async () => {
      // Special handling for /data/ requests with stale-while-revalidate
      if (event.request.url.includes('/data/')) {
        // Try to get any cached response (fresh or stale)
        const cachedResponse = await getAnyCachedResponse(event.request);
        if (cachedResponse) {
          // Return cached response immediately
          // Fetch from network in background to update cache
          event.waitUntil(
            fetch(event.request)
              .then((networkResponse) => {
                if (shouldCacheRuntimeResponse(event.request, networkResponse)) {
                  return cacheRuntimeResponse(event.request, networkResponse);
                }
              })
              .catch(() => {
                // Network fetch failed, but we already returned cached response
                // so we don't need to do anything here
              })
          );
          return cachedResponse;
        } else {
          // No cached response, fetch from network
          try {
            const networkResponse = await fetch(event.request);
            if (shouldCacheRuntimeResponse(event.request, networkResponse)) {
              event.waitUntil(cacheRuntimeResponse(event.request, networkResponse).catch(() => {}));
            }
            return networkResponse;
          } catch (error) {
            // Network failed and no cache available
            return undefined;
          }
        }
      }

      // For all other requests, keep existing behavior
      const runtimeResponse = isRuntimeCacheableRequest(event.request) ? await getFreshRuntimeResponse(event.request) : null;
      if (runtimeResponse) return runtimeResponse;

      const shellResponse = await caches.match(event.request);
      if (shellResponse) return shellResponse;

      try {
        const networkResponse = await fetch(event.request);
        if (shouldCacheRuntimeResponse(event.request, networkResponse)) {
          event.waitUntil(cacheRuntimeResponse(event.request, networkResponse).catch(() => {}));
        }
        return networkResponse;
      } catch (error) {
        // Fallback to index.html for navigation requests when offline
        if (event.request.mode === 'navigate' || (event.request.headers && event.request.headers.get && event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html'))) {
          return caches.match('/index.html');
        }
        return undefined;
      }
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== APP_SHELL_CACHE_NAME && cacheName !== RUNTIME_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      ).then(async () => {
        runtimeCacheEntryCount = await ensureRuntimeCacheEntryCount();
        const deletedCount = await pruneRuntimeCache();
        runtimeCacheEntryCount = Math.max(0, runtimeCacheEntryCount - deletedCount);
        lastRuntimeCachePruneAt = Date.now();
      });
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