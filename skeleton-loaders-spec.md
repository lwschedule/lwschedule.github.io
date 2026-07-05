# Skeleton Loaders — Specification

**Version:** 3.6.0
**Date:** July 5, 2026
**Author:** Sanchit P.

---

## 1. Overview

A hybrid loading system for all pages:

1. **Static skeleton placeholders** — gray blocks (tables, cards, text lines) showing content structure in each page's HTML. Auto-replaced when JS populates containers via `innerHTML`. No animation on the skeletons themselves.
2. **"Original Thinking" rose trail SVG loader** — a mathematical particle animation centered as a page overlay. Animates via `requestAnimationFrame` with rotating rose curve particles.
3. **Shared `/loader.js`** — single JS file loaded by every page, cached by the service worker, self-executing IIFE that injects the overlay and exposes `window.hideLoader()`.

Both the rose trail and skeleton placeholders appear on every navigation. Each page calls `window.hideLoader()` once at the end of its inline script. The overlay fades out, skeletons are already replaced by real content.

---

## 2. Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Loader animation | "Original Thinking" rose trail (math-curve-loader) | User-provided; mathematical particle animation with rotating rose curve |
| Skeleton style | Static gray blocks (no shimmer) | Avoids render-thread contention with JS particles; visual focus on the rose trail |
| Loader JS | Shared `/loader.js` in `<head>` | Single file cached by SW; IIFE starts before DOM parse completes |
| Appearance timing | Immediate (no delay) | Loader always visible during navigation — consistent UX |
| Hide mechanism | `window.hideLoader()` called once per page | Simple, explicit. Each page controls when to hide based on its async work |
| Fallback timeout | None | Static site hosted on GitHub Pages; data files are local JSON. If hideLoader() isn't called, something is broken — the loader should stay |
| Hide trigger | Per page, at end of inline script | Different pages have different async phases; each page knows when it's done |
| Colors | Site palette: overlay #000000, stroke #e8e8e8, white particles | Integrated with existing dark theme |
| z-index | 1000 (matches sidebar) | On desktop, loader sits beside sidebar covering content area. On mobile (sidebar hidden), covers everything |
| Page transitions | New page only | Loader only visible on the incoming page; exit transition uses existing CSS animation |
| Accessibility | No reduced-motion handling | User preference |
| Layout shift prevention | Exact skeleton dimension matching | Skeleton heights/widths must mirror real rendered content; browser-use verification |
| Race condition | Queued hide call | If hideLoader() fires before loader.js init, the call is queued and executed after overlay is injected |
| Testing | browser-use agent | Chrome DevTools with Slow 3G throttling |
| Version bump | 3.6.0 (minor, z reset to 0) | Feature release |
| Commit strategy | Single commit | Atomic, all files at once |

---

## 3. Pages Being Deleted

As part of this change, the following pages are removed:

| File | Reason |
|---|---|
| `app/index.html` | Unused install page; setup wizard handles onboarding |
| `settings/index.html` | Redirects to /profile; settings are managed in profile |
| `settings/clubs/index.html` | Redirects to /profile; club settings are in profile |
| `settings/classes/index.html` | Redirects to /profile; class settings are in profile |
| `settings/lunch/index.html` | Redirects to /profile; lunch settings are in profile |
| `settings/packup/index.html` | Redirects to /profile; packup settings are in profile |
| `settings/phonecaddy/index.html` | Redirects to /profile; phone caddy settings are in profile |

### Code cleanup for deletions

**`common.js` line 1794:**
```js
// BEFORE:
if (window.location.pathname.startsWith('/setup') || window.location.pathname.startsWith('/app')) return;
// AFTER:
if (window.location.pathname.startsWith('/setup')) return;
```

**`setup/index.html` line 620:**
```js
// REMOVE this line:
localStorage.setItem('app-visited', 'true');
```

**Sidebar links:** Verified — the `navLinks` array in `common.js:1796` does not reference `/settings` or `/app`. No sidebar link changes needed.

---

## 4. Pages Receiving the Loader (14 Pages)

| # | Page | Async work | Skeleton type |
|---|---|---|---|
| 1 | `index.html` | initApp + initClockMorphs + fetch events + fetch ticker | Upcoming tile skeletons, timer skeleton, ticker skeleton |
| 2 | `today/index.html` | initApp + updateTodaySchedule | 4-col schedule table skeleton |
| 3 | `week/index.html` | initApp + updateWeekSchedule | 2-col week table skeleton |
| 4 | `week/day/index.html` | initApp + renderScheduleTable | 4-col schedule table skeleton |
| 5 | `month/index.html` | initApp + renderCalendar | 7xN calendar grid skeleton |
| 6 | `holidays/index.html` | initApp + updateHolidayTable + countdown | Countdown skeleton + table rows |
| 7 | `quarters/index.html` | initApp + number-flow + renderTermCards | Skeleton term cards |
| 8 | `events/index.html` | initApp + fetch events + renderEvents | Skeleton event cards |
| 9 | `schedules/normal/index.html` | initApp + render 5 daily tables | 5 skeleton table sections |
| 10 | `profile/index.html` | loadCommon + create managers + initProfilePage (fetches events/clubs/classes) | Skeleton event chips, class slots, club slots |
| 11 | `setup/index.html` | loadCommon + create managers + init (fetches classes/clubs) | Skeleton class slots, club slots |
| 12 | `schedules/index.html` | loadCommon only (sidebar injection) | No skeleton shapes — loader overlay only |
| 13 | `info/index.html` | loadCommon only | No skeleton shapes — loader overlay only |
| 14 | `map/index.html` | loadCommon only | No skeleton shapes — loader overlay only |

**`404.html` is excluded** — the error page stays minimal (no loader, no hideLoader).

Pages 12-14 are static. They only wait for `common.js` to load and inject the sidebar. They get the loader overlay but no content-specific skeleton placeholders.

---

## 5. New File: `/loader.js`

A shared IIFE in the project root. Loaded by all 15 pages in `<head>` before `common-core.js`.

### 5.1 Behavior

- **Self-executing** — runs immediately when `<script src="/loader.js">` is parsed
- **Injects overlay** — creates `<div id="globalLoader">` on `document.documentElement`
- **SVG rose trail** — contains the "Original Thinking" particle animation adapted for dark theme
- **Starts RAF loop** — `requestAnimationFrame` with particle system, rotation, and detail-scale pulse
- **Exposes `window.hideLoader()`** — fades out overlay (CSS transition 300ms), cancels RAF, removes DOM nodes
- **Idempotent** — calling `hideLoader()` multiple times is safe
- **No timeout** — stays visible until explicitly hidden
- **Race-condition safe** — if `hideLoader()` is called before the overlay finishes initializing, the call is queued via a flag (`window.__hideLoaderQueued = true`). After the overlay DOM is injected, if the flag is set, `hideLoader()` executes immediately. This handles the case where a fast page calls hideLoader() during the loader's synchronous script execution.
- **Graceful fallback** — if `loader.js` fails to load (network error, 404), the page still works. The inline scripts guard with `if (typeof window.hideLoader === 'function') window.hideLoader();` to avoid a `TypeError`. The skeletons are still replaced by real content; only the rose trail overlay is skipped.
- **Stripped to essentials** — the math-curve-loader demo wrapper (`.demo`, `.meta`, `.formula`, `.back-link` HTML) is removed. Only the SVG viewport (`<svg>`), trail path (`<path>`), particle circles, and the `requestAnimationFrame` animation loop are kept.

### 5.2 Configuration

| Parameter | Value | Notes |
|---|---|---|
| Particle count | 140 | |
| Trail span | 0.38 | |
| Loop duration | 4600ms | Full cycle |
| Rotation duration | 28000ms | Slow continuous rotation |
| Pulse duration | 4200ms | Detail scale breathing |
| Stroke width | 5.5 | |
| Base radius | 7 | |
| Detail amplitude | 3 | |
| Petal count | 7 | |
| Curve scale | 3.9 | |
| Overlay z-index | 1000 | Matches sidebar level |
| Fade-out duration | 300ms | CSS transition on `.hidden` class |

### 5.3 Color Adaptation

| Element | Color |
|---|---|
| Overlay background | `#000000` (matches `--bg-dark`) |
| SVG trail path | `#e8e8e8` (matches `--text-light`) with `opacity: 0.1` |
| SVG particles | `#e8e8e8` (matches `--text-light`) |
| SVG particle opacity range | `0.04` to `0.96` (tail fade) |

---

## 6. CSS Changes (`common.css`)

### 6.1 Add loader overlay styles

```css
/* ===== GLOBAL LOADER OVERLAY ===== */
#globalLoader {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: #000000;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 300ms ease;
  opacity: 1;
}

#globalLoader.hidden {
  opacity: 0;
  pointer-events: none;
}

#globalLoader svg {
  width: min(72vmin, 420px);
  height: min(72vmin, 420px);
  overflow: visible;
}
```

### 6.2 Add static skeleton classes (no shimmer)

```css
/* ===== STATIC SKELETON PLACEHOLDERS ===== */
.skeleton {
  position: relative;
  overflow: hidden;
  background-color: #1a1a1a;
  border-color: transparent !important;
  color: transparent !important;
  pointer-events: none;
  border-radius: 6px;
}

.skeleton * { visibility: hidden !important; }

.skeleton-text  { height: 1em;  width: 100%; border-radius: 4px; margin-bottom: 4px; }
.skeleton-text.short  { width: 40%; }
.skeleton-text.medium { width: 70%; }
.skeleton-title  { height: 1.6em; width: 50%; margin-bottom: 8px; border-radius: 6px; }

.skeleton-table     { width: 100%; border-radius: 12px; }
.skeleton-table-row { height: 48px; border-bottom: 1px solid #303030; }
.skeleton-card      { height: 80px; border-radius: 12px; margin-bottom: 15px; }
.skeleton-block     { border-radius: 12px; }
```

**Note:** No `@keyframes shimmer` and no `.skeleton::before` pseudo-element. Skeletons are static gray blocks.

---

## 7. Page-by-Page Changes

### Common additions for ALL 14 pages:

1. **`<head>`**: Add `<script src="/loader.js"></script>` before `<script src="/common-core.js"></script>`
2. **Inline script**: Add as the last line:
   ```js
   if (typeof window.hideLoader === 'function') window.hideLoader();
   ```
   The `typeof` guard prevents a `TypeError` if `loader.js` fails to load (network error, 404).
3. **Skeleton dimensions must match real content** — verify no layout shift when skeletons are replaced

### 7.1 `index.html` — Homepage

**Skeleton placeholders:**
- `#timer`: Add `<div class="skeleton skeleton-text medium" style="height:18px;margin:0"></div>`
- `#upcomingTile2Title`: Replace `"Loading..."` with `<div class="skeleton skeleton-text medium" style="height:16px"></div>`
- `#upcomingTile2Sub`: Add `<div class="skeleton skeleton-text short" style="height:14px"></div>`
- `#upcomingTile3Title`: Replace `"Loading..."` with `<div class="skeleton skeleton-text medium" style="height:16px"></div>`
- `#upcomingTile3Sub`: Add `<div class="skeleton skeleton-text short" style="height:14px"></div>`
- `#homeTickerTrack`: Add `<div class="skeleton skeleton-text" style="height:20px;width:60%"></div>`

**`hideLoader()` placement:** End of the main inline IIFE, after ticker fetch and `setInterval(updateClock, 1000)`.

---

### 7.2 `today/index.html` — Today's Schedule

**Skeleton in `#todayContent`:** 4-column skeleton table (7 rows):

```html
<table class="scheduleTable skeleton-table">
  <thead><tr>
    <th><div class="skeleton skeleton-text" style="margin:0;height:14px"></div></th>
    <th><div class="skeleton skeleton-text" style="margin:0;height:14px"></div></th>
    <th><div class="skeleton skeleton-text" style="margin:0;height:14px"></div></th>
    <th><div class="skeleton skeleton-text" style="margin:0;height:14px"></div></th>
  </tr></thead>
  <tbody>
    <tr class="skeleton-table-row"><td><div class="skeleton skeleton-text medium"></div></td><td></td><td></td><td></td></tr>
    <!-- 6 more rows with varying widths -->
  </tbody>
</table>
```

**`hideLoader()`:** End of IIFE after `updateTodaySchedule()` and `setInterval()`.

---

### 7.3 `week/index.html` — Week Overview

**Skeleton in `#weekContent`:** 2-column, 5-row skeleton table (Mon-Fri).

**`hideLoader()`:** End of IIFE after `updateWeekSchedule()`.

---

### 7.4 `week/day/index.html` — Day Schedule

**Skeleton in `#dayContent`:** Same 4-column skeleton table as Today (7.2).

**`hideLoader()`:** End of IIFE after `scheduleEl.innerHTML = html`.

---

### 7.5 `month/index.html` — Calendar

**Skeleton in `#calendarGrid`:** 7 header cells + 35 day cells (`.calendar-day skeleton`).

**`hideLoader()`:** End of IIFE after `renderCalendar()` and event listeners.

---

### 7.6 `holidays/index.html` — Holidays

**Countdown:** Add `skeleton` class to `.countdown-value` spans.
**Table:** 5 skeleton rows in `#holidayTableBody`.

**`hideLoader()`:** End of IIFE after `initHolidayCountdownMorphs()` and `initApp()`.

---

### 7.7 `quarters/index.html` — Quarters/Semesters

**Skeleton:** 3 `.skeleton-card` divs each in `#quartersList` and `#semestersList`.

**`hideLoader()`:** End of IIFE after `renderTermCards()`, `initTermMorphs()`, `setInterval()`.

---

### 7.8 `events/index.html` — Events

**Skeleton:** 3 `.skeleton-card` divs (72px height) in `#eventsList`.

**`hideLoader()`:** End of IIFE after `loadEventsPage()`.

---

### 7.9 `schedules/normal/index.html` — Normal Schedule

**Skeleton:** 5 weekday sections in `#normalScheduleContent`, each with skeleton heading + skeleton table.

**`hideLoader()`:** End of IIFE after `content.innerHTML = html`.

---

### 7.10 `profile/index.html` — Profile

**Skeleton async sections only:**
- `#followedChips`: 2 skeleton chips
- `#eventsFollowContent`: skeleton event rows
- `#selectedClassesList`: 6 skeleton slot rows (arrow + card + arrow layout)
- `#selectedClubsList`: 2-3 skeleton club rows

**Not skeletonized:** Profile info, lunch, phone caddy, packup sections (sync localStorage).

**`hideLoader()`:** End of `DOMContentLoaded` handler after `await initProfilePage()`.

---

### 7.11 `setup/index.html` — Setup

**Skeleton async sections only:**
- `#setupSelectedClassesList`: 6 skeleton slot rows
- `#setupSelectedClubsList`: 2-3 skeleton club rows

**Not skeletonized:** Profile, lunch, packup, phone caddy sections (sync localStorage).

**Also remove:** `localStorage.setItem('app-visited', 'true');` line (line 620).

**`hideLoader()`:** End of IIFE after `init()`.

---

### 7.12 `schedules/index.html` — All Schedules

**Skeleton:** None. Loader overlay only.
**`hideLoader()`:** End of IIFE after `checkSetupComplete()`.

---

### 7.13 `info/index.html` — About

**Skeleton:** None. Loader overlay only.
**`hideLoader()`:** End of IIFE after `checkSetupComplete()`.

---

### 7.14 `map/index.html` — Map

**Skeleton:** None. Loader overlay only.
**`hideLoader()`:** End of IIFE after `checkSetupComplete()`.

---

### 7.15 `404.html` — 404 Page (Excluded)

No changes. The 404 page remains minimal with no loader, no hideLoader, no skeleton. It's an error page that should stay fast and lightweight.

---

## 8. Implementation Order

1. **Delete pages** — remove `app/index.html`, `settings/index.html`, and all 5 `settings/*/index.html` files
2. **Cleanup references** — update `common.js:1794`, remove `app-visited` line from `setup/index.html`
3. **`/loader.js`** — create the shared loader script with dark-themed SVG rose trail
4. **`common.css`** — add `#globalLoader` styles + static skeleton classes
5. **All 14 HTML pages** — add `<script src="/loader.js">`, skeleton placeholders (where applicable), `hideLoader()` call
6. **Version bump** — README.md, sw.js, info/index.html → 3.6.0
7. **Commit** — single atomic commit

---

## 9. Testing Plan

Use the `browser-use` agent with Chrome DevTools on a local server:

1. Start server: `python3 -m http.server 8080`
2. Navigate to each page with Slow 3G throttle
3. Verify rose trail SVG overlay is visible during load
4. Verify static skeleton shapes visible underneath (pages 1-11)
5. Verify overlay fades out after content loads
6. Verify skeletons replaced with real content
7. Verify no layout shift
8. Verify `requestAnimationFrame` cancelled after hide
9. Verify deleted pages return 404 (expected)
10. Check console for errors

---

## 10. Versioning

New version: **3.6.0** (minor bump, `z` reset to 0)

Pre-commit hook auto-bumps: `README.md`, `sw.js` (`CACHE_NAME`), `info/index.html`.

---

## 11. Files Summary

### New files (1)
| File | Description |
|---|---|
| `loader.js` | Shared SVG rose trail loader IIFE |

### Modified files (4)
| File | Change |
|---|---|
| `common.css` | Add loader overlay + static skeleton styles |
| `common.js` | Remove `/app` from sidebar skip check (line 1794) |
| `setup/index.html` | Remove `app-visited` setItem, add loader/skeletons/hideLoader |
| `profile/index.html` | Add loader/skeleton events+classes+clubs, add hideLoader |

### Skeleton + loader added (10)
| File | Change |
|---|---|
| `index.html` | Loader + skeleton tiles/timer/ticker + hideLoader |
| `today/index.html` | Loader + 4-col skeleton table + hideLoader |
| `week/index.html` | Loader + 2-col skeleton table + hideLoader |
| `week/day/index.html` | Loader + 4-col skeleton table + hideLoader |
| `month/index.html` | Loader + skeleton calendar grid + hideLoader |
| `holidays/index.html` | Loader + skeleton countdown/table + hideLoader |
| `quarters/index.html` | Loader + skeleton term cards + hideLoader |
| `events/index.html` | Loader + skeleton event cards + hideLoader |
| `schedules/normal/index.html` | Loader + 5 skeleton table sections + hideLoader |
| `schedules/index.html` | Loader + hideLoader (no skeletons) |

### Loader only added (1)
| File | Change |
|---|---|
| `map/index.html` | Loader + hideLoader |

### Deleted files (7)
| File |
|---|
| `app/index.html` |
| `settings/index.html` |
| `settings/clubs/index.html` |
| `settings/classes/index.html` |
| `settings/lunch/index.html` |
| `settings/packup/index.html` |
| `settings/phonecaddy/index.html` |

### Version bump (3)
| File | Change |
|---|---|
| `README.md` | 3.6.0 |
| `sw.js` | CACHE_NAME bump |
| `info/index.html` | Loader + hideLoader + version 3.6.0 |

### Not changed (1)
| File | Reason |
|---|---|
| `404.html` | Error page stays minimal |

**Total: 1 new + 18 modified + 7 deleted = 26 file operations**
