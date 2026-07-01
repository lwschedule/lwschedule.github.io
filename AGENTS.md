# LW Schedule — Agent Guide

## What This Is

Static PWA for a high school schedule viewer. No build step, no bundler, no `package.json`. Raw HTML/CSS/JS served directly via GitHub Pages.

## Architecture

- **`common.js`** (~1974 lines) — all application logic. Loaded lazily by `common-core.js`.
- **`common-core.js`** — bootstrap loader. Every page includes this; it auto-loads `common.js`.
- **`common.css`** — single stylesheet for the entire app.
- **`data/*.json`** — static data: schedules, holidays, terms, clubs, events, classes, ticker messages.
- **`sw.js`** — service worker. Cache name must change on every deploy (pre-commit hook handles this).
- **`manifest.json`** — PWA manifest. Portrait orientation, standalone display.

## Pages

Multi-page app — each feature is a separate `index.html` in its own directory. Key paths:
- `/index.html` — home dashboard
- `/today/`, `/week/`, `/month/` — schedule views
- `/schedules/` — browse all schedule types
- `/settings/` — preferences (lunch, classes, clubs, pack-up, phone caddy)
- `/holidays/`, `/quarters/`, `/events/` — academic calendar
- `/info/` — about page (version badge updated by pre-commit hook)
- `/setup/` — first-run wizard
- `/app/` — install prompt

## Data Files

All in `data/`:

| File | Structure |
|---|---|
| `schedules.json` | Period times in minutes-since-midnight. Mon/Fri have A/B lunch variants. Wed is simple array. |
| `holidays.json` | Array of `{name, date, displayDate, isWeekend}`. Multi-day breaks need hardcoded ranges in `common.js` `getHolidayForDate()`. |
| `terms.json` | `{quarters: [...], semesters: [...]}` with `start`/`end` date strings. |
| `clubs.json` | `{clubs: [{id, name, room, days, frequency, startHour, ...}]}`. Supports weekly/biweekly/every-other/alternating/monthly/last-of-month. |
| `classes.json` | Flat array of class name strings. |
| `events.json` | `{standardizedTests: [], apTests: []}`. |
| `ticker-messages.json` | `{messages: [{text, url?}]}`. |

## Schedule Times Format

Period times are **minutes since midnight**. Example: `8:35 AM` = `8*60+35` = `515`. The `start` and `end` fields use this format. Lunch variants are keyed as `"A"` and `"B"` on Mon/Tue/Thu/Fri; Wednesday has a single `"Lunch"` entry.

## Holiday Range Handling

`getHolidayForDate()` in `common.js:487` has hardcoded date ranges for multi-day breaks. When adding/updating multi-day holidays, you must update both `holidays.json` AND the corresponding range check in this function. Single-day holidays just need the JSON entry.

Current range handlers: Thanksgiving Break, Winter Break, Mid-Winter Break, Spring Break, School Closure Make-up Day, Summer Break.

## Versioning

Every commit must bump the patch version (x.y.**z**). The pre-commit hook (`.githooks/pre-commit`) auto-bumps three files:

1. `README.md` — version badge + release date
2. `sw.js` — `CACHE_NAME` (format: `lwschedule-YYYY-MM-DD`)
3. `info/index.html` — version badge + release date

**Enable locally:** `git config core.hooksPath .githooks`

If the hook is not enabled, manually update all three files before committing. Never commit without a version bump.

After every commit, always push to remote (`git push`).

## User Preferences

All stored in `localStorage`. Key keys: `lunchPreferences`, `selectedClasses`, `selectedClubs`, `profile`, `classesEnabled`, `packupReminder`, `phoneCaddy`. No backend — everything is client-side.

## Special Schedules

`SCHEDULE_METADATA` array in `common.js:11` defines date-range overrides (e.g., "early release week", "finals schedule"). Each entry has `scheduleKey`, `dateStart`, `dateEnd`. The key maps to a nested object inside `schedulesData.normal`. Currently empty — add entries here for special schedule periods.

## Testing Locally

No test suite. Open `index.html` in a browser or use any static server (`python3 -m http.server`, `npx serve`). The service worker requires HTTPS or localhost.

## Gotchas

- No Node.js toolchain — don't look for `package.json` or `node_modules`
- Wednesday schedule is a plain array (no A/B lunch), unlike other weekdays
- The `model-un` club has day-specific time overrides (`friStartHour`, etc.) — not all clubs use the same time fields
- `common.js` uses global variables, not modules — all functions are on `window`
- Dark theme is default; no light mode toggle exists
