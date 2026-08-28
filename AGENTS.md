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
- **`sw.js`** — service worker. Cache name must change on every deploy (update `CACHE_NAME` on each release).
- **`manifest.json`** — PWA manifest. Portrait orientation, standalone display.

## Pages

Multi-page app — each feature is a separate `index.html` in its own directory. Key paths:
- `/index.html` — home dashboard
- `/today/`, `/week/`, `/month/` — schedule views
- `/schedules/` — browse all schedule types (Normal, First Week, Labor Day)
- `/settings/` — preferences (lunch, classes, clubs, pack-up, phone caddy)
- `/holidays/`, `/quarters/`, `/events/` — academic calendar
- `/info/` — about page
- `/setup/` — first-run wizard
- `/app/` — install prompt
- `/info/` — hub page that links to the two subpages below
- `/info/about/` — credits (Created By / Inspired By)
- `/info/changelog/` — Coming Soon link + full version history changelog

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

### How version numbers work

Version numbers are date-based, like `v2026.8.27`:

- **First number** — the year (`2026`).
- **Second number** — the month, no zero-padding (`8`, not `08`).
- **Third number** — the day of the month (`27`).
- **Fourth number (optional)** — the release count for that day. The first release of a day is just `v2026.8.27`; the second is `v2026.8.27.2`, the third `.3`, and so on.

Where each format lives: the README badge, commit subjects, and the entries in `data/changelog.json` all store the machine format (`v2026.8.27.4`). Only the changelog page reformats for display — it shows `v2026.8.27 (4)` with the release count in parentheses (see the changelog display section below).

### How to bump the version

There is no auto-bump hook — do it manually before committing. On every release:

1. `README.md` — version badge
2. `sw.js` — `CACHE_NAME` (format: `lwschedule-<version without the v>`, e.g. `lwschedule-2026.8.27.4`)
3. `data/changelog.json` — prepend a new entry with the new version, a user-facing title, and today's date

To pick the new number: take today's date. If the newest changelog entry is already dated today, append or increment the release counter (newest is `v2026.8.27` → use `v2026.8.27.2`; newest is `v2026.8.27.2` → use `v2026.8.27.3`). Otherwise start fresh with just today's date, no counter.

Never reuse a version number, and never renumber or redate entries that are already released.

**The cache name must be unique for every single release — this has bitten us before.** On August 27, 2026 the cache name was date-only, so the third release of the day shipped with the same cache name as the first, and returning visitors kept getting served the stale earlier version no matter how many times the site deployed. The version-based format makes collisions impossible; do not regress to date-only names.

The changelog page (`/info/changelog/`) fetches `data/changelog.json` and renders it dynamically via JS.

### How the changelog page displays entries

Each entry shows only the version pill and the title — no per-entry release date (the date is already inside the date-based version number). Versions display as `v2026.8.27 (2)`: the release count goes in parentheses and only appears when it's greater than one. The `date` field in the JSON is still required — it groups entries under month headings — so keep writing it on every new entry.

**Purple is reserved for the latest release.** The newest entry gets the `changelog-row-anchored` treatment: purple gradient pill plus a purple-tinted row border and background. Every older pill is a neutral translucent chip (`rgba(255, 255, 255, 0.08)` with dimmed text). Don't use the purple pill styling anywhere else.

The stored version string is converted for display by `formatVersionDisplay()` in `info/changelog/index.html` — if the version format ever changes, update that function's regex. Keep `entry.version` in the JSON in machine format.

Heads-up: the changelog styles exist in TWO places — the `CHANGELOG` section at the bottom of `common.css` and a near-identical copy inline in `info/changelog/index.html`. Change both together or they will drift.

### Changelog data conventions

- The `date` field format is `August 27, 2026` — always use full month names. Old entries use abbreviations (`Jul 7, 2026`), and month headings come from comparing the raw date strings, so July currently splits into two headings (`July 2026` and `Jul 2026`). Normalizing old abbreviations to full names is safe — it only changes formatting, not the actual dates, so the no-redating rule isn't violated.
- Entries are ordered newest-first, and same-day entries must stay contiguous in the file.
- **Large release counters are real — don't "fix" them.** July 6, 2026 had 28 releases in one day (a big housekeeping sprint), and the changelog matches git commit-for-commit. If a counter looks absurd, verify against git before touching anything: `git log --date=format:'%Y-%m-%d' --format='%ad' | sort | uniq -c`
- A day's changelog count can trail its git commit count slightly — doc-only commits (AGENTS.md edits and the like) sometimes shipped without a changelog entry. That's expected.

Never commit without a version bump.

**Commit message format:** each commit subject starts with the new version number and a colon, then a short headline — e.g. `v2026.8.27.2: Add Homecoming Week schedule`. Use the body for 1-3 plain-language bullets describing what changed and why. Keep the headline under about 60 characters.

After every commit, always push to remote (`git push`).

## Release tooling

`.github/scripts/auto_bump_version.py` automates the release checklist, but **nothing wires it up — there is no git hook anymore**, so it only runs if you run it deliberately:

```bash
python3 .github/scripts/auto_bump_version.py
```

What it does, in order: bumps the README version, rewrites `CACHE_NAME` in `sw.js` from the new version, prepends a new entry to `data/changelog.json`, stages those three files, and **amends the most recent commit** — folding the files in and version-prefixing the subject.

Because it amends, run it immediately after committing and NEVER after pushing. It takes the changelog title from the last commit's subject (after stripping the version prefix), stamps the entry with today's date, and guards against re-entrancy with the `LWS_AMEND_IN_PROGRESS` environment variable.

## Changelog Writing

**Write changelog titles for end users, not developers.** The audience is high school students — they don't know (or care) about unicode escapes, CSS selectors, function names, regex patterns, or file paths.

**Good titles** (describes the user-visible change):
- "Fixed garbled characters in What's New page title"
- "Made profile follower count text white instead of purple"
- "Added Homecoming Week schedule"

**Bad titles** (code-centric jargon):
- "Fix broken unicode escapes in What's New page title and changelog"
- "Make .followingLabel text on profile white instead of purple"
- "Add KANG NEWS and LEAP label support to getScheduleSummaryLabel"

If the commit only touches internal files (docs, scripts, tooling) or has no user-visible effect, use "Internal Changes" as the title.

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

## Testing & Verification

No test suite, no Node toolchain. Verification is manual:

- **Static server:** `python3 -m http.server 8000` from the repo root, then open `http://localhost:8000`. The service worker only activates on HTTPS or localhost.
- **Data files:** validate JSON after editing — `python3 -c "import json; json.load(open('data/changelog.json'))"`.
- **Release script:** syntax-check after editing — `python3 -m py_compile .github/scripts/auto_bump_version.py` (then delete the `__pycache__` it creates — it's gitignored, but keep the tree clean).
- **Never run the release script casually** — it amends the last commit (see Release tooling).

### Verifying pages when background servers won't stay up

In the agent environment, background processes are killed as soon as a terminal command finishes (`setsid` is unavailable on the macOS host), so a server started in one command is dead by the next. To check page rendering anyway:

1. Write a temporary standalone HTML (e.g. `_check.html`) that inlines the exact render code being changed plus a realistic sample of the real data.
2. Open it with the Preview tab's `htmlPath` mode (no server needed).
3. Assert with `preview_evaluate` on computed styles and DOM counts — screenshots may fail to composite; DOM checks are more reliable anyway.
4. **Delete the temp file before committing.** Nothing named `_*.html`, `*check*`, or `*preview*` should ever reach a commit.

### Pre-flight checklist before every commit

- [ ] Version bumped in all three places (README, changelog entry, `CACHE_NAME`)
- [ ] `git status --short` shows ONLY the files you meant to change — no temp files, no `__pycache__`, no `.DS_Store`
- [ ] `data/changelog.json` still parses and the new entry is first
- [ ] Commit subject = `v<version>: <user-facing headline>`; body has 1-3 plain bullets
- [ ] Push after committing (`git push`)
- [ ] `.freebuff/` stays untracked — it's local tool state, never commit or delete it

## Gotchas

- No Node.js toolchain — don't look for `package.json` or `node_modules`
- Wednesday schedule is a plain array (no A/B lunch), unlike other weekdays
- The `model-un` club has day-specific time overrides (`friStartHour`, etc.) — not all clubs use the same time fields
- `common.js` uses global variables, not modules — all functions are on `window`
- Dark theme is default; no light mode toggle exists
- `.freebuff/` and `.mimocode/` are local tool state (`.mimocode/` holds agent plans and vendored dependencies — one plan file is tracked, the rest is ignored). Leave them alone: never commit new files from them, never delete them
- If a deploy looks stale in your browser, suspect the service worker cache — hard-refresh (Cmd+Shift+R) to bypass it
