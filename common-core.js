// Minimal runtime bootstrap for LW Schedule
// Exposes `window.loadCommon()` to lazily load /common.js and
// `window.appVisibility` helpers for visibility-based throttling.
(function () {
  if (window.__lws_common_core_initialized) return;
  window.__lws_common_core_initialized = true;

  // === DATA RESET CONTROL ===
  // Load reset.js early to control data reset behavior.
  // This must run before common.js to ensure reset logic is available.
  // DO NOT remove this - it prevents unintended data loss.
  function loadResetModule() {
    try {
      // Do not append more than once
      if (document.querySelector('script[src="/reset.js"]') || window.resetModule) return;
      const script = document.createElement('script');
      script.src = '/reset.js';
      script.async = false;
      document.head.appendChild(script);
    } catch (e) {
      console.error('[LW Schedule] Failed to load reset.js:', e);
    }
  }

  function loadCommon() {
    if (window.__lws_common_loaded) return Promise.resolve();
    if (window.__lws_common_loading_promise) return window.__lws_common_loading_promise;

    function clearStaleCommonScript(scriptNode) {
      if (scriptNode && scriptNode.parentNode) {
        scriptNode.parentNode.removeChild(scriptNode);
      }
    }

    window.__lws_common_loading_promise = new Promise((resolve, reject) => {
      try {
        const existing = document.querySelector('script[src="/common.js"]');
        if (existing) {
          if (window.__lws_common_loaded) {
            window.__lws_common_loaded = true;
            resolve();
            return;
          }

          existing.addEventListener('load', () => {
            window.__lws_common_loaded = true;
            resolve();
          });
          existing.addEventListener('error', (e) => {
            clearStaleCommonScript(existing);
            window.__lws_common_loading_promise = null;
            reject(e);
          });
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
          clearStaleCommonScript(s);
          window.__lws_common_loading_promise = null;
          reject(new Error('Failed to load /common.js'));
        };
        document.head.appendChild(s);
      } catch (err) {
        window.__lws_common_loading_promise = null;
        reject(err);
      }
    });

    return window.__lws_common_loading_promise;
  }

  window.loadCommon = loadCommon;
  window.ensureCommonLoaded = loadCommon;

  function autoLoadCommon() {
    loadCommon().catch((err) => {
      console.error('Failed to auto-load /common.js:', err);
    });
  }

  // Load reset module FIRST (before common.js), then load common.js
  loadResetModule();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoLoadCommon, { once: true });
  } else {
    autoLoadCommon();
  }

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
