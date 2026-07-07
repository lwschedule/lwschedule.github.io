# LW Schedule — Agent Guide

## Communication Style

The user has a tech background but **no coding experience**. When responding or explaining:
- Use natural, plain language. Avoid code-centric jargon when a plain-English equivalent exists.
- Don't over-simplify or be condescending — speak to a tech-literate adult.
- When showing code, briefly explain *what it does in plain words*, not just transcribe the lines.
- Define jargon the first time it appears (don't assume the user knows terms like "service worker", "byte-compare", "lifecycle", `localStorage`, "scope", "controller", "cache name", etc.).
- Keep step-by-step explanations short; trust the user to follow general concepts.
- When in doubt, mirror the user's own words back to them rather than inventing new technical terms.

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
- `/schedules/` — browse all schedule types (Normal, First Week, Labor Day)
- `/settings/` — preferences (lunch, classes, clubs, pack-up, phone caddy)
- `/holidays/`, `/quarters/`, `/events/` — academic calendar
- `/info/` — about page (version badge updated by pre-commit hook)
- `/setup/` — first-run wizard
- `/app/` — install prompt
- `/info/` — hub page that links to the two subpages below
- `/info/about/` — credits (Created By / Inspired By)
- `/info/whats-new/` — version badge + Coming Soon link + full version history changelog

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

Current range handlers: Thanksgiving Break, Winter Break, Mid-Winter Break, Spring Break, Summer Break.

## Versioning

**CRITICAL: Every commit MUST bump the version. Do not skip this under any circumstances unless the user explicitly instructs otherwise.**

### Version format: `x.y.z.a`

- **x** — major (rarely bumped; big milestones)
- **y** — minor (user-visible feature sets, UI redesigns)
- **z** — patch (individual changes within a minor release)
- **a** — micro (internal-only changes, docs, tooling, bug fixes between patches)

The agent decides whether to bump `z` or `a` on each commit:
- Bump **a** for small/internal changes (docs, tooling, minor tweaks).
- Bump **z** (and reset `a` to 0, or drop the `.a` suffix entirely) for user-visible features, UI changes, or notable fixes.
- The first commit of a new minor version can drop `.z.a` and just use `x.y` (e.g. `v3.7`).

**Note:** The pre-commit hook (`auto_bump_version.py`) only handles the `z` (patch) component — it increments `x.y.z` → `x.y.(z+1)`. The `.a` micro suffix is managed manually by the agent in commit messages and does not affect the hook's auto-bump logic.

The pre-commit hook (`.githooks/pre-commit`) auto-bumps three files:

1. `README.md` — version badge + release date
2. `sw.js` — `CACHE_NAME` (format: `lwschedule-YYYY-MM-DD`)
3. `whats-new/index.html` — version badge + release date

**Enable locally:** `git config core.hooksPath .githooks`

If the hook is not enabled, manually update all three files before committing. Never commit without a version bump.

**Commit message format:** each commit subject starts with the new version number and a colon, then a short headline — e.g. `v3.7.1: Add Homecoming Week schedule`. Use the body for 1-3 plain-language bullets describing what changed and why. Keep the headline under about 60 characters.

After every commit, always push to remote (`git push`).

## User Preferences

All stored in `localStorage`. Key keys: `lunchPreferences`, `selectedClasses`, `selectedClubs`, `profile`, `classesEnabled`, `packupReminder`, `phoneCaddy`. No backend — everything is client-side.

## Special Schedules

`SCHEDULE_METADATA` array in `common.js` defines date-range overrides (e.g., "first week", "finals schedule"). Each entry has `scheduleKey`, `dateStart`, `dateEnd`, and an optional `label`. The key maps to a nested object inside `schedulesData.normal`.

### Adding a New Special Schedule

Follow these steps to add a special schedule (e.g., finals, early release, first week):

#### 1. Add schedule data to `data/schedules.json`

Add a new key under the top-level object (sibling of `normal`) with the schedule name. Structure must match the normal schedule format:

```json
"my-schedule": {
  "Monday": {
    "A": [{"name": "Period 1", "start": 515, "end": 570}, ...],
    "B": [{"name": "Period 1", "start": 515, "end": 570}, ...]
  },
  "Tuesday": { ... },
  "Wednesday": [{"name": "Period 1", "start": 515, "end": 552}, ...],
  "Thursday": { ... },
  "Friday": { ... }
}
```

- Times are **minutes since midnight** (e.g., `8:35 AM` = `515`)
- Mon/Tue/Thu/Fri must have `"A"` and `"B"` lunch variants
- Wednesday can be a plain array (no lunch variants) or `{"A": [...], "B": [...]}`

#### 2. Register in `SCHEDULE_METADATA` in `common.js`

Add an entry to the `SCHEDULE_METADATA` array:

```js
{
  scheduleKey: 'my-schedule',    // must match the JSON key
  dateStart: new Date(2026, 7, 31),  // inclusive, month is 0-indexed
  dateEnd: new Date(2026, 8, 4),     // inclusive
  label: 'My Schedule'           // optional display label
}
```

This single entry automatically enables **all** of the following:

- **Daily/Weekly/Monthly views** — `getScheduleKeyForDate()` matches dates against metadata, then `getSchedules()` serves the correct data
- **Auto lunch application** — `getLunchForScheduleDay()` applies the user's lunch preferences from `localStorage`. Falls back to global prefs unless a `storageKey` is set on the metadata entry
- **Pack-up & phone caddy notifications** — use `getSchedules()` so they automatically use the special schedule's period times
- **Calendar highlighting** — `createDayCell()` adds `special-schedule` CSS class when `getScheduleKeyForDate()` returns a non-`'normal'` key
- **Class title display** — `getDisplayPeriodName()` maps "Period N" names to user's saved class titles

#### 3. Add to All Schedules browser page

1. Add a link in `schedules/index.html`:
   ```html
   <div class="settingsRow">
     <a class="mainBtn" href="/schedules/my-schedule">My Schedule</a>
   </div>
   ```
   Use a short name for the button label (e.g., "Normal", "First Week", "Labor Day") — not "Normal Schedule".
2. Create `schedules/my-schedule/index.html` — copy the pattern from `schedules/normal/index.html`, changing the data source to `schedulesData.normal['my-schedule']` and updating the title/subtitle.
3. If the schedule key was renamed (e.g., `labor-day-week` → `labor-day`), update the key in `data/schedules.json`, the `scheduleKey` in `SCHEDULE_METADATA`, and the element ID and JS in the schedule page.

#### 4. (If multi-day) Update holiday ranges

If the schedule spans dates that overlap with holidays or breaks, you may also need to update `getHolidayForDate()` in `common.js` to add a hardcoded date range check.

#### Checklist

- [ ] Schedule data added to `data/schedules.json` with correct A/B lunch variants
- [ ] All times converted to minutes-since-midnight
- [ ] `SCHEDULE_METADATA` entry added in `common.js` with correct date range
- [ ] Link added to `schedules/index.html`
- [ ] Schedule page created at `schedules/<key>/index.html`
- [ ] Lunch auto-application works (global prefs or custom `storageKey`)

## Testing Locally

No test suite. Open `index.html` in a browser or use any static server (`python3 -m http.server`, `npx serve`). The service worker requires HTTPS or localhost.

## Gotchas

- No Node.js toolchain — don't look for `package.json` or `node_modules`
- Wednesday schedule is a plain array (no A/B lunch), unlike other weekdays
- The `model-un` club has day-specific time overrides (`friStartHour`, etc.) — not all clubs use the same time fields
- `common.js` uses global variables, not modules — all functions are on `window`
- Dark theme is default; no light mode toggle exists
