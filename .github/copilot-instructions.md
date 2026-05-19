# GitHub Copilot Instructions — LW Schedule

## Project Overview
LW Schedule is a static, client-side PWA built with vanilla HTML, CSS, and JavaScript,
hosted on GitHub Pages. There is no build step, no bundler, and no npm. All files are
served as-is.

## Architecture

### Core Files
- `common.js` — Shared runtime: schedule logic, clock, lunch preferences, clubs, notifications,
  sidebar, page transitions. Loaded lazily by every page via `common-core.js`.
- `common-core.js` — Minimal bootstrap: exposes `window.loadCommon()` and visibility helpers.
- `common.css` — Global styles, CSS variables, responsive layout, sidebar, calendar.

### Data Files (`/data/`)
- `schedules.json` — All bell schedules (normal + special). Special schedules are nested
  inside `normal` by key (`leapDay`, `memorialDay`, `movingUp`, `lastWeek`).
- `holidays.json` — Holiday list with `date` (ISO string), `name`, `displayDate`.
- `clubs.json` — Club list with id, days, frequency, room, start/end times.
- `classes.json` — Master list of class names for the classes picker.
- `terms.json` — Quarter and semester date ranges.
- `events.json` — AP tests and other events.
- `ticker-messages.json` — Home screen ticker messages.

### Pages
Each page is a standalone `index.html` in its own folder (e.g. `/today/`, `/week/`, `/month/`).
Pages load `common-core.js` via a `<script>` tag, then call `await window.loadCommon()` before
using any shared functions.

### Service Worker (`sw.js`)
- Cache name format: `lwschedule-YYYY-MM-DD`
- To bust the cache, update `CACHE_NAME` at the top of `sw.js`. The `activate` handler
  automatically deletes all caches that don't match the current name.
- Never modify the cache-busting logic itself.

## Key Conventions

### User Data
All user preferences are stored in `localStorage` only. Never use sessionStorage, cookies,
or any server-side storage. Keys in use:
- `lunchPreferences` — `{Monday, Tuesday, Wednesday, Thursday, Friday}` each `'A'`, `'B'`, or `'All'`
- `selectedClasses` — JSON array of 6 strings (one per period slot, empty string if unset)
- `classesEnabled` — `'true'` or `'false'`
- `selectedClubs` — JSON array of club IDs
- `clubsEnabled` — `'true'` or `'false'`
- `pack-up-time` — integer (minutes before period end to notify)
- `notifications-enabled` — `'true'` or `'false'`
- `phone-caddy-enabled` — `'true'` or `'false'`
- `phone-caddy-times` — JSON object `{"1": "", ..., "6": ""}` (caddy spot per period)

### Schedule Logic
- Time is stored as **minutes since midnight** (e.g. 515 = 8:35 AM).
- `getSchedules(date)` returns the resolved schedule for a given date, already with the
  correct lunch variant (A or B) applied.
- `getScheduleKeyForDate(date)` returns `'normal'` or a special key based on `SCHEDULE_METADATA`.
- Special schedules are date-range-based and auto-detected — never require a manual switch.
- Monday/Tuesday/Thursday/Friday schedules have `A` and `B` lunch variants as sub-objects.
  Wednesday is always a flat array.

### Page Transitions
- Use `navigateWithTransition(url)` for all internal navigation. Never use
  `window.location.href` directly for internal links.
- Page entry/exit animations are CSS-driven via body classes managed in `common.js`.

### Sidebar
- Injected automatically by `injectGlobalSidebar()` in `common.js` on every page except
  `/setup` and `/app`.
- Never manually add sidebar HTML to a page.

### Notifications
- Always use `sendNotification(title, options)` from `common.js`. Never call
  `new Notification()` directly except inside that function.

### Icons
- Icons are SVG files under `/icons/src/` named after SF Symbols (e.g. `gear.svg`, `house.svg`).
- Use `renderSfSymbol(name)` to generate an `<img>` tag for a sidebar icon.
- Never use emoji as UI icons.

## Style Rules
- CSS variables: `--primary`, `--primary-light`, `--text-light`, `--bg-dark`, `--card-dark`,
  `--glow`, `--error`. Always use these — never hardcode colors except for semantic
  one-offs (e.g. holiday red `#cc0000`).
- Border radius: `12px` for cards, `8px` for smaller elements, `50%` for circles.
- All pages are mobile-first. Breakpoints: `600px`, `768px`, `1200px`.
- No frameworks, no Tailwind, no CSS-in-JS.

## What Not To Do
- Do not add a build step, bundler, or package.json.
- Do not import npm packages directly — vendor files go in `/vendor/` as pre-built ESM.
- Do not use `innerHTML` with unsanitized user input — always use `escapeHtml()` first.
- Do not add new `localStorage` keys without documenting them here.
- Do not change the structure of `schedules.json` without updating `getSchedules()`,
  `getScheduleKeyForDate()`, and `SCHEDULE_METADATA` in `common.js`.
- Do not touch `localStorage` from `sw.js` — the service worker has no access to it and
  user data must never be cleared on cache bust.

## Agent Behavior

### Never Stop Early
- You must complete the entire task before stopping. Do not pause and ask for confirmation
  mid-task unless you have reached a genuine decision point where two approaches have
  meaningfully different outcomes and the right choice cannot be inferred from context.
- If a task spans multiple files, complete all of them. Do not stop after the first file
  and wait to be told to continue.
- If you encounter something unexpected mid-task, state what you found, resolve it, and
  continue. Do not stop and ask whether to proceed.

### Always Self-Review
After completing any task, you must review every file you modified before declaring done.
Work through this checklist:

1. **Correctness** — Does the change do exactly what was asked? Re-read the original
   request and verify.
2. **Unintended changes** — Did you accidentally modify anything outside the scope of
   the task? Check diffs carefully.
3. **Broken references** — If you renamed, moved, or restructured something, confirm
   that every file that referenced the old name/path has been updated.
4. **Data file consistency** — If you changed `schedules.json`, verify that
   `SCHEDULE_METADATA`, `getScheduleKeyForDate()`, and `getSchedules()` in `common.js`
   are still consistent.
5. **localStorage keys** — If you added or changed a localStorage key, confirm it is
   documented in this file and that reads/writes are consistent across all pages that
   use it.
6. **CSS variables** — If you added styles, confirm you used CSS variables and not
   hardcoded colors or sizes.
7. **Escape hygiene** — If you added any `innerHTML` assignments, confirm the content
   was passed through `escapeHtml()` first.
8. **Navigation** — If you added any links or redirects, confirm they use
   `navigateWithTransition()` and not `window.location.href`.
9. **Service worker** — If you added or renamed any critical assets, check whether they
   should be added to the `urlsToCache` list in `sw.js`.

If you find a problem during review, fix it immediately and re-run the checklist for
the newly changed file. Do not report the problem and wait — fix it.

### Finishing
Only declare a task complete after the self-review checklist passes with no outstanding
issues. Your final message should briefly summarize what was changed and confirm the
review passed.