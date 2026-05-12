/**
 * LW Schedule - Data Reset Control Module
 * 
 * This module provides CONTROLLED access to reset all user data.
 * Data should NEVER be reset automatically under any circumstances.
 * 
 * === HOW TO TRIGGER A WORLDWIDE RESET ===
 * 1. Change TRIGGER_RESET from 'false' to 'true' on line 24
 * 2. Commit and push the change
 * 3. All users will reset their settings on next visit
 * 4. Change TRIGGER_RESET back to 'false' immediately after
 * 5. Commit and push again
 * 
 * IMPORTANT: This should only be used for critical bug fixes or data corruption recovery.
 * Always notify users before resetting their data.
 * 
 * === DATA PROTECTION POLICIES ===
 * ✗ NEVER reset data on cache version changes
 * ✗ NEVER reset data on page load
 * ✗ NEVER reset data on page refresh
 * ✗ NEVER reset data without explicit user intent or admin trigger
 * ✓ ONLY reset when: user clicks "Reset All Settings" button OR this trigger is activated
 */

(function() {
  if (window.__lws_reset_initialized) return;
  window.__lws_reset_initialized = true;

  // ============================================================================
  // === ADMIN RESET TRIGGER - CHANGE THIS TO TRIGGER WORLDWIDE DATA RESET ===
  // ============================================================================
  // To reset all user settings worldwide:
  // 1. Change 'false' to 'true' below
  // 2. Commit and push
  // 3. Change back to 'false' after users have updated
  // 
  // DO NOT LEAVE THIS SET TO 'true' - it will reset settings on every page load!
  // ============================================================================
  const TRIGGER_RESET = false;

  /**
   * Checks if a reset has already been performed for this trigger version.
   * This ensures resets only happen once, even if the page is reloaded.
   * 
   * @returns {boolean} True if reset has already been performed
   */
  function hasResetBeenPerformed() {
    try {
      const stored = sessionStorage.getItem('__lws_reset_performed_timestamp');
      return stored !== null;
    } catch (e) {
      return false;
    }
  }

  /**
   * Marks that a reset has been performed in this session.
   * Uses sessionStorage so it only applies to current session, not permanently.
   */
  function markResetAsPerformed() {
    try {
      sessionStorage.setItem('__lws_reset_performed_timestamp', Date.now().toString());
      sessionStorage.setItem('__lws_reset_performed_reason', 'admin-trigger');
    } catch (e) {
      // Fail silently if sessionStorage unavailable
    }
  }

  /**
   * Resets all user settings to defaults.
   * This is the canonical reset function - only called from two places:
   * 1. User clicks "Reset All Settings" button in settings page
   * 2. Admin trigger (TRIGGER_RESET = true) on page load
   * 
   * @param {string} reason - Why the reset is happening (for logging)
   * @returns {boolean} True if reset was successful
   */
  window.resetAllSettings = function(reason = 'user-requested') {
    try {
      console.warn(
        `[LW Schedule] RESETTING ALL USER DATA\n` +
        `  Time: ${new Date().toISOString()}\n` +
        `  Reason: ${reason}\n` +
        `  This is a destructive operation - all settings will be lost.`
      );

      // Clear all localStorage entries
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        keysToRemove.push(localStorage.key(i));
      }
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`  Cleared: ${key}`);
      });

      console.warn(`[LW Schedule] Reset complete. ${keysToRemove.length} items cleared.`);
      return true;
    } catch (e) {
      console.error('[LW Schedule] Failed to reset settings:', e);
      return false;
    }
  };

  /**
   * Checks if the trigger is active and performs reset if needed.
   * This is called during page load initialization.
   * 
   * The reset will only happen once per page load, and only if:
   * 1. TRIGGER_RESET is set to true
   * 2. Reset hasn't already been performed in this session
   */
  function checkAndPerformAdminReset() {
    if (!TRIGGER_RESET) {
      return; // Trigger not active
    }

    if (hasResetBeenPerformed()) {
      console.log('[LW Schedule] Admin reset already performed in this session.');
      return; // Already reset this session
    }

    console.warn(
      '[LW Schedule] ADMIN RESET TRIGGER ACTIVE\n' +
      'Performing reset of all user settings...'
    );

    window.resetAllSettings('admin-trigger');
    markResetAsPerformed();

    // Signal that reset occurred so pages can redirect to setup
    sessionStorage.setItem('__lws_should_redirect_to_setup', 'true');
  }

  /**
   * Initializes the reset module on page load.
   * Checks for admin trigger and performs reset if needed.
   */
  function initializeReset() {
    try {
      checkAndPerformAdminReset();
    } catch (e) {
      console.error('[LW Schedule] Reset initialization failed:', e);
    }
  }

  // Run reset check as soon as this script loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeReset, { once: true });
  } else {
    initializeReset();
  }

  // Export for external use
  window.resetModule = {
    resetAllSettings: window.resetAllSettings,
    getTriggerStatus: () => TRIGGER_RESET,
    shouldRedirectToSetup: () => {
      try {
        return sessionStorage.getItem('__lws_should_redirect_to_setup') === 'true';
      } catch (e) {
        return false;
      }
    }
  };
})();
