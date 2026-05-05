# Global Page Transition Direction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every page load slide-and-fade in from the left, and make every page exit slide-and-fade out to the right.

**Architecture:** Keep transition behavior centralized in shared runtime and shared CSS so all pages inherit animation behavior automatically. Add Playwright end-to-end tests first to lock expected visual-state classes and transform directions before changing runtime/CSS logic. Ensure shared bootstrap loads transition runtime for pages that include only `common-core.js`, so page-level scripts do not need duplicated transition wiring.

**Tech Stack:** HTML, CSS, vanilla JavaScript, Playwright, Node.js

---

## Scope Check

This spec is one subsystem (global page transition behavior). It does not need to be split into multiple plans.

## File Structure

- Create: `package.json` (test runner scripts + dev dependencies)
- Create: `playwright.config.js` (local static server + test config)
- Create: `.gitignore` (ignore local Node/test artifacts)
- Create: `tests/page-transitions.spec.js` (behavior tests for enter/exit direction)
- Modify: `common.css` (left-enter, right-exit transform rules)
- Modify: `common.js` (single exit direction class usage)
- Modify: `common-core.js` (auto-load `common.js` on all pages)

### Task 1: Add test harness for transition behavior

**Files:**
- Create: `package.json`
- Create: `playwright.config.js`
- Create: `.gitignore`

- [ ] **Step 1: Write the failing test scaffold file first**

```js
// tests/page-transitions.spec.js
const { test, expect } = require('@playwright/test');

test('placeholder transition test', async () => {
  expect(true).toBe(false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/page-transitions.spec.js --project=chromium --workers=1`
Expected: FAIL with `Expected: false` / `Received: true` mismatch from placeholder assertion.

- [ ] **Step 3: Add minimal test harness files**

```json
// package.json
{
  "name": "lwschedule.github.io",
  "private": true,
  "version": "0.0.0",
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug"
  },
  "devDependencies": {
    "@playwright/test": "^1.54.1",
    "http-server": "^14.1.1"
  }
}
```

```js
// playwright.config.js
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30_000,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry'
  },
  webServer: {
    command: 'npx http-server . -p 4173 -c-1 --silent',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 30_000
  }
});
```

```gitignore
# Node / tooling
node_modules/

# Playwright outputs
playwright-report/
test-results/
```

Then run: `npm install`

- [ ] **Step 4: Run test to verify harness works and test still fails**

Run: `npm run test:e2e -- tests/page-transitions.spec.js`
Expected: FAIL (placeholder assertion), with browser launched and test infrastructure healthy.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json playwright.config.js .gitignore tests/page-transitions.spec.js
git commit -m "test: bootstrap playwright for page transition behavior"
```

### Task 2: Define failing tests for left-enter and right-exit requirements

**Files:**
- Modify: `tests/page-transitions.spec.js`
- Test: `tests/page-transitions.spec.js`

- [ ] **Step 1: Replace placeholder with explicit failing behavior tests**

```js
const { test, expect } = require('@playwright/test');

function parseTranslateX(transform) {
  if (!transform || transform === 'none') return 0;
  const matrix3d = transform.match(/^matrix3d\((.+)\)$/);
  if (matrix3d) {
    const values = matrix3d[1].split(',').map((v) => Number(v.trim()));
    return values[12] || 0;
  }
  const matrix2d = transform.match(/^matrix\((.+)\)$/);
  if (matrix2d) {
    const values = matrix2d[1].split(',').map((v) => Number(v.trim()));
    return values[4] || 0;
  }
  return 0;
}

test('page loads animate from left before ready class', async ({ page }) => {
  await page.goto('/index.html');

  const state = await page.evaluate(() => {
    const target = document.querySelector('#digitalClock');
    document.body.classList.remove('page-transition-ready', 'page-transition-exit-forward', 'page-transition-exit-back');
    const style = window.getComputedStyle(target);
    return {
      opacity: style.opacity,
      transform: style.transform
    };
  });

  expect(Number(state.opacity)).toBeLessThan(1);
  expect(parseTranslateX(state.transform)).toBeLessThan(0);
});

test('all exits animate to the right', async ({ page }) => {
  await page.goto('/index.html');

  const state = await page.evaluate(() => {
    const target = document.querySelector('#digitalClock');
    document.body.classList.remove('page-transition-ready', 'page-transition-exit-forward', 'page-transition-exit-back');
    document.body.classList.add('page-transition-exit-forward');
    const style = window.getComputedStyle(target);
    return {
      opacity: style.opacity,
      transform: style.transform
    };
  });

  expect(Number(state.opacity)).toBeLessThan(1);
  expect(parseTranslateX(state.transform)).toBeGreaterThan(0);
});

test('404 page also initializes transition runtime', async ({ page }) => {
  await page.goto('/404.html');

  const hasReadyClass = await page.evaluate(async () => {
    await new Promise((resolve) => requestAnimationFrame(() => resolve()));
    return document.body.classList.contains('page-transition-ready');
  });

  expect(hasReadyClass).toBe(true);
});
```

- [ ] **Step 2: Run test to verify it fails on current implementation**

Run: `npm run test:e2e -- tests/page-transitions.spec.js --workers=1`
Expected: FAIL at least on:
- Enter-direction check (`translateX` currently positive)
- 404 runtime check (no `loadCommon()` call yet)

- [ ] **Step 3: Tighten assertion messages for debugging clarity**

```js
expect(
  parseTranslateX(state.transform),
  'Expected initial enter transform to be leftward (negative X)'
).toBeLessThan(0);

expect(
  parseTranslateX(state.transform),
  'Expected exit transform to move rightward (positive X)'
).toBeGreaterThan(0);
```

- [ ] **Step 4: Re-run tests to keep them red and informative**

Run: `npm run test:e2e -- tests/page-transitions.spec.js --workers=1`
Expected: FAIL with explicit assertion messages that describe required direction behavior.

- [ ] **Step 5: Commit**

```bash
git add tests/page-transitions.spec.js
git commit -m "test: define failing specs for left-enter and right-exit transitions"
```

### Task 3: Implement shared transition logic changes

**Files:**
- Modify: `common.css`
- Modify: `common.js`
- Modify: `common-core.js`
- Test: `tests/page-transitions.spec.js`

- [ ] **Step 1: Implement CSS direction changes with minimal edits**

```css
/* common.css */
body > *:not(script):not(style):not(link):not(meta):not(title):not(#globalSidebar):not(#sidebarMobileToggle) {
  opacity: 0;
  transform: translateX(calc(var(--page-transition-distance) * -1));
  transition:
    transform var(--page-transition-duration) var(--page-transition-ease),
    opacity var(--page-transition-duration) ease;
  will-change: transform, opacity;
}

body.page-transition-exit-forward > *:not(script):not(style):not(link):not(meta):not(title):not(#globalSidebar):not(#sidebarMobileToggle),
body.page-transition-exit-back > *:not(script):not(style):not(link):not(meta):not(title):not(#globalSidebar):not(#sidebarMobileToggle) {
  opacity: 0;
  transform: translateX(var(--page-transition-distance));
  pointer-events: none;
}
```

- [ ] **Step 2: Simplify JS to use a single exit direction for navigation**

```js
// common.js
function clearPageTransitionClasses() {
  if (!document.body) return;
  document.body.classList.remove(PAGE_TRANSITION_EXIT_FORWARD_CLASS, PAGE_TRANSITION_EXIT_BACK_CLASS);
}

function navigateWithTransition(targetUrl, options = {}) {
  const url = getInternalUrl(targetUrl);
  if (!url || !isInternalPageUrl(url)) {
    window.location.href = targetUrl;
    return;
  }

  if (url.pathname === window.location.pathname && url.search === window.location.search && !url.hash) {
    return;
  }

  if (window.__pageNavigationPending) return;
  window.__pageNavigationPending = true;

  const replace = options.replace === true;

  if (document.body) {
    document.body.classList.remove(PAGE_TRANSITION_READY_CLASS, PAGE_TRANSITION_EXIT_BACK_CLASS, PAGE_TRANSITION_EXIT_FORWARD_CLASS);
    document.body.classList.add(PAGE_TRANSITION_EXIT_FORWARD_CLASS);
  }

  setTimeout(() => {
    if (replace) {
      window.location.replace(url.href);
    } else {
      window.location.href = url.href;
    }
  }, PAGE_TRANSITION_DURATION_MS);
}

function handlePageTransitionClick(event) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

  const anchor = event.target.closest ? event.target.closest('a[href]') : null;
  if (!anchor) return;
  if (anchor.target && anchor.target !== '_self') return;
  if (anchor.hasAttribute('download')) return;
  if (anchor.dataset.transition === 'skip') return;

  const href = anchor.getAttribute('href');
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return;

  const url = getInternalUrl(href);
  if (!isInternalPageUrl(url)) return;
  if (url.pathname === window.location.pathname && url.search === window.location.search && !url.hash) return;

  event.preventDefault();
  navigateWithTransition(url.href);
}
```

- [ ] **Step 3: Ensure every page that includes common-core auto-loads common runtime**

```js
// common-core.js
(function () {
  if (window.__lws_common_core_initialized) return;
  window.__lws_common_core_initialized = true;

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
        s.onerror = function () {
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

  function autoLoadCommonRuntime() {
    try {
      loadCommon().catch((err) => {
        console.error('Failed to auto-load /common.js from common-core bootstrap', err);
      });
    } catch (err) {
      console.error('Error while auto-loading /common.js from common-core bootstrap', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoLoadCommonRuntime, { once: true });
  } else {
    autoLoadCommonRuntime();
  }

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
```

- [ ] **Step 4: Run tests to verify all transition specs pass**

Run: `npm run test:e2e -- tests/page-transitions.spec.js --workers=1`
Expected: PASS for all three tests.

- [ ] **Step 5: Commit**

```bash
git add common.css common.js common-core.js
git commit -m "feat: make page enter/exit transitions directional and global"
```

### Task 4: Verify coverage across representative pages and prevent regressions

**Files:**
- Modify: `tests/page-transitions.spec.js`
- Test: `tests/page-transitions.spec.js`

- [ ] **Step 1: Add multi-page smoke test asserting transition class readiness**

```js
test('shared transition runtime initializes on representative pages', async ({ page }) => {
  const pages = ['/index.html', '/today/index.html', '/settings/index.html', '/week/index.html', '/404.html'];

  for (const path of pages) {
    await page.goto(path);
    const ready = await page.evaluate(async () => {
      await new Promise((resolve) => requestAnimationFrame(() => resolve()));
      return document.body.classList.contains('page-transition-ready');
    });
    expect(ready, `Expected page-transition-ready on ${path}`).toBe(true);
  }
});
```

- [ ] **Step 2: Run tests to verify smoke test behavior on current implementation**

Run: `npm run test:e2e -- tests/page-transitions.spec.js --workers=1`
Expected: PASS when shared bootstrap coverage is complete; FAIL with an explicit page path in the assertion message if any page is missing runtime initialization.

- [ ] **Step 3: Run a static HTML audit to confirm every page includes common-core bootstrap**

Run: `find . -name '*.html' | wc -l && grep -R --line-number "common-core.js" --include='*.html' . | wc -l`
Expected: Matching counts (each HTML page includes `common-core.js`).

- [ ] **Step 4: Run full transition suite and confirm green**

Run: `npm run test:e2e -- tests/page-transitions.spec.js --workers=1`
Expected: PASS with all direction and initialization checks green.

- [ ] **Step 5: Commit**

```bash
git add tests/page-transitions.spec.js
git commit -m "test: add transition coverage checks across representative pages"
```

## Final Validation

- [ ] Run: `npm run test:e2e -- --workers=1`
Expected: PASS.
- [ ] Run: `git log --oneline -n 4`
Expected: Four new commits matching tasks in this plan.
- [ ] Run: `git status`
Expected: `nothing to commit, working tree clean`.
