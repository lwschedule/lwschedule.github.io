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

  // Deferrable modules that can be loaded after the page is interactive
  const DEFERRABLE_MODULES = new Set(['clubs', 'notifications', 'calendar']);

  window.loadModules = async function(moduleNames, options = {}) {
    const defer = options.defer || false;
    const toLoad = MODULE_ORDER.filter(name => moduleNames.includes(name));
    const nonDeferredModules = [];
    const deferredModules = [];
    
    // Separate deferrable and non-deferrable modules
    toLoad.forEach(name => {
      if (defer && DEFERRABLE_MODULES.has(name)) {
        deferredModules.push(name);
      } else {
        nonDeferredModules.push(name);
      }
    });
    
    // Load non-deferred modules sequentially as before
    for (const name of nonDeferredModules) {
      const url = MODULE_URLS[name];
      if (url) {
        await loadScript(url);
      }
    }
    
    // Load deferred modules in the background using requestIdleCallback
    if (deferredModules.length > 0) {
      const loadDeferredModule = (name) => {
        return new Promise((resolve) => {
          const url = MODULE_URLS[name];
          if (url) {
            loadScript(url).then(resolve).catch(resolve);
          } else {
            resolve();
          }
        });
      };
      
      deferredModules.forEach(name => {
        if (window.requestIdleCallback) {
          window.requestIdleCallback(() => {
            loadDeferredModule(name);
          }, { timeout: 2000 });
        } else {
          // Fallback to setTimeout if requestIdleCallback is not available
          setTimeout(() => {
            loadDeferredModule(name);
          }, 0);
        }
      });
    }
    
    // Return a promise that resolves once all non-deferred modules are done
    return Promise.resolve();
  };

  // Convenience function for deferred loading
  window.loadModulesDeferred = function(moduleNames) {
    return window.loadModules(moduleNames, { defer: true });
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