// Minimal runtime bootstrap for LW Schedule
// Exposes `window.loadModules(names)` to lazily load common-*.js modules.
(function () {
  if (window.__lws_common_core_initialized) return;
  window.__lws_common_core_initialized = true;

  // === DATA RESET CONTROL ===
  // Load reset.js early. DO NOT remove.
  function loadResetModule() {
    try {
      if (document.querySelector('script[src="/reset.js"]') || window.resetModule) return;
      const script = document.createElement('script');
      script.src = '/reset.js';
      script.async = false;
      document.head.appendChild(script);
    } catch (e) {
      console.error('[LW Schedule] Failed to load reset.js:', e);
    }
  }

  function loadScript(url) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${url}"]`);
      if (existing) {
        resolve();
        return;
      }
      const s = document.createElement('script');
      s.src = url;
      s.async = false;
      s.onload = resolve;
      s.onerror = () => reject(new Error(`Failed to load ${url}`));
      document.head.appendChild(s);
    });
  }

  // Module dependency order: each module may depend on the previous ones
  const MODULE_ORDER = [
    'navigation',
    'data',
    'schedule',
    'clubs',
    'notifications',
    'clock',
    'calendar'
  ];

  const MODULE_URLS = {
    navigation: '/common-navigation.js',
    data: '/common-data.js',
    schedule: '/common-schedule.js',
    clubs: '/common-clubs.js',
    notifications: '/common-notifications.js',
    clock: '/common-clock.js',
    calendar: '/common-calendar.js'
  };

  window.loadModules = async function(moduleNames) {
    const toLoad = MODULE_ORDER.filter(name => moduleNames.includes(name));
    for (const name of toLoad) {
      const url = MODULE_URLS[name];
      if (url) {
        await loadScript(url);
      }
    }
  };

  // Backward compatibility: loadCommon() loads all modules
  window.loadCommon = async function() {
    await window.loadModules(MODULE_ORDER);
  };
  window.ensureCommonLoaded = window.loadCommon;

  // Load reset module
  loadResetModule();

  // Visibility helpers
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

  // Service worker registration (was at end of common.js)
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((err) => {
        console.warn('Service Worker registration failed:', err);
      });
    });
  }
})();
