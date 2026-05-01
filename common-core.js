// Minimal runtime bootstrap for LW Schedule
// Exposes `window.loadCommon()` to lazily load /common.js and
// `window.appVisibility` helpers for visibility-based throttling.
(function () {
  if (window.__lws_common_core_initialized) return;
  window.__lws_common_core_initialized = true;

  const DEFAULT_BACKGROUND_IMAGES = [
    'big sur.png',
    'monterey.png',
    'sequoia.png',
    'sonoma.png',
    'tahoe.png',
    'ventura.png'
  ];

  if (!Array.isArray(window.__lws_background_images) || window.__lws_background_images.length === 0) {
    window.__lws_background_images = DEFAULT_BACKGROUND_IMAGES.slice();
  }

  function getRandomBackground() {
    const pool = window.__lws_background_images;
    if (!Array.isArray(pool) || pool.length === 0) return null;
    const index = Math.floor(Math.random() * pool.length);
    return pool[index];
  }

  function setPageBackground(imageName) {
    if (!document.body || typeof imageName !== 'string' || !imageName) return '';
    const encodedName = encodeURIComponent(imageName);
    const imageUrl = `/images/${encodedName}`;
    document.body.style.setProperty('--page-background', `url("${imageUrl}")`);
    window.__lws_background_image = imageName;
    window.__lws_background_initialized = true;
    return imageUrl;
  }

  function initializeBackground(force = false) {
    if (!force && window.__lws_background_initialized) return window.__lws_background_image || null;
    const imageName = getRandomBackground();
    if (!imageName) return null;
    setPageBackground(imageName);
    return imageName;
  }

  if (typeof window.getRandomBackground !== 'function') {
    window.getRandomBackground = getRandomBackground;
  }

  if (typeof window.setPageBackground !== 'function') {
    window.setPageBackground = setPageBackground;
  }

  if (typeof window.initializeBackground !== 'function') {
    window.initializeBackground = initializeBackground;
  }

  function runBackgroundInit() {
    if (typeof window.initializeBackground === 'function') {
      window.initializeBackground();
    }
  }

  if (document.body) {
    runBackgroundInit();
  } else {
    document.addEventListener('DOMContentLoaded', runBackgroundInit, { once: true });
  }

  function loadCommon() {
    if (window.__lws_common_loaded) return Promise.resolve();
    if (window.__lws_common_loading_promise) return window.__lws_common_loading_promise;

    window.__lws_common_loading_promise = new Promise((resolve, reject) => {
      try {
        const existing = document.querySelector('script[src="/common.js"]');
        if (existing) {
          existing.addEventListener('load', () => {
            window.__lws_common_loaded = true;
            resolve();
          });
          existing.addEventListener('error', (e) => reject(e));
          return;
        }

        const s = document.createElement('script');
        s.src = '/common.js';
        s.async = false;
        s.onload = function () {
          window.__lws_common_loaded = true;
          resolve();
        };
        s.onerror = function (e) {
          reject(new Error('Failed to load /common.js'));
        };
        document.head.appendChild(s);
      } catch (err) {
        reject(err);
      }
    });

    return window.__lws_common_loading_promise;
  }

  window.loadCommon = loadCommon;
  window.ensureCommonLoaded = loadCommon;

  // Visibility helpers: dispatch custom events and allow simple callbacks
  const visibilityHandlers = { visible: [], hidden: [] };

  function handleVisibilityChange() {
    if (document.hidden) {
      try { document.dispatchEvent(new Event('app:visibilityhidden')); } catch (e) {}
      visibilityHandlers.hidden.forEach(cb => { try { cb(); } catch (e) {} });
    } else {
      try { document.dispatchEvent(new Event('app:visibilityvisible')); } catch (e) {}
      visibilityHandlers.visible.forEach(cb => { try { cb(); } catch (e) {} });
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange, false);

  window.appVisibility = {
    onHidden(fn) { if (typeof fn === 'function') visibilityHandlers.hidden.push(fn); },
    onVisible(fn) { if (typeof fn === 'function') visibilityHandlers.visible.push(fn); }
  };

})();
