# Special Schedule Subpages and Lunch Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the old Pilot 3 / SBA special-schedule pages with Leap Day, Memorial Day, Moving Up, and Last Week pages, and make those new schedules use the shared Period 3 / Period 4 lunch-selection logic.

**Architecture:** Keep schedule definitions in `data/schedules.json`, route selection in `common.js`, and page shells in `schedules/*` plus the existing shared settings UI. The new special schedules should be date-driven, not hard-coded into individual pages, so the same lunch preference model works for normal weeks and all new special weeks.

**Tech Stack:** HTML, JSON, vanilla JavaScript, localStorage, browser validation

---

### Task 1: Add the new special schedule routes and data

**Files:**
- Modify: `data/schedules.json`
- Modify: `schedules/index.html`
- Create: `schedules/leap-day/index.html`
- Create: `schedules/memorial-day/index.html`
- Create: `schedules/moving-up/index.html`
- Create: `schedules/last-week/index.html`
- Delete: `schedules/pilot3/index.html`
- Delete: `schedules/sba/index.html`
- Delete: `setup/pilot3/index.html`
- Delete: `setup/sba/index.html`

- [ ] **Step 1: Add the four new schedule definitions to `data/schedules.json`**

Add the new top-level schedule keys using the exact date windows and period tables from the request:
- `leapDay` for May 18-22, 2026
- `memorialDay` for May 25-29, 2026
- `movingUp` for June 8-12, 2026
- `lastWeek` for June 15-19, 2026

Keep `normal` and `lunchPreferences` in place, and make sure each new schedule key uses the same array / A-B shape that the existing schedule renderer already understands.

- [ ] **Step 2: Create the four new schedule pages**

Create `schedules/leap-day/index.html`, `schedules/memorial-day/index.html`, `schedules/moving-up/index.html`, and `schedules/last-week/index.html` by copying the existing schedule-page shell pattern used by the current special-schedule pages.

Each page should be updated to:
- use the new schedule name in the title and heading
- show the new date range copy from the request
- read from the matching `schedulesData.<scheduleKey>` entry
- keep the existing `renderScheduleTable(daySchedule, null, true)` rendering path
- remove any Pilot 3 / SBA wording from the visible copy

- [ ] **Step 3: Update the schedules landing page links**

Replace the old buttons in `schedules/index.html` with links to the new pages:
```html
<a class="mainBtn" href="/schedules/leap-day">Leap Day</a>
<a class="mainBtn" href="/schedules/memorial-day">Memorial Day</a>
<a class="mainBtn" href="/schedules/moving-up">Moving Up</a>
<a class="mainBtn" href="/schedules/last-week">Last Week</a>
```
Remove the Pilot 3 and SBA buttons entirely.

- [ ] **Step 4: Remove the old special-schedule page files**

Delete `schedules/pilot3/index.html`, `schedules/sba/index.html`, `setup/pilot3/index.html`, and `setup/sba/index.html` so the old routes disappear from the repo instead of lingering as dead pages.

- [ ] **Step 5: Verify the route surface matches the new names**

Run:
```bash
grep -n 'pilot3\|sba\|leap-day\|memorial-day\|moving-up\|last-week' schedules/index.html data/schedules.json schedules/leap-day/index.html schedules/memorial-day/index.html schedules/moving-up/index.html schedules/last-week/index.html
```
Expected: the new route names appear, and the old Pilot 3 / SBA route names are gone from the live schedule route surface.

- [ ] **Step 6: Commit the route-and-data slice**

```bash
git add -A data/schedules.json schedules/index.html schedules/leap-day/index.html schedules/memorial-day/index.html schedules/moving-up/index.html schedules/last-week/index.html schedules/pilot3/index.html schedules/sba/index.html setup/pilot3/index.html setup/sba/index.html
git commit -m "feat: add new special schedule pages"
```

---

### Task 2: Generalize the shared lunch-selection logic for the new schedules

**Files:**
- Modify: `common.js`
- Modify: `settings/lunch/index.html`
- Test: browser-open the new special schedule pages and the lunch preferences page

- [ ] **Step 1: Add shared metadata for the new special schedules in `common.js`**

Create a small schedule metadata table in `common.js` that records, for each new schedule key:
- the date window it applies to
- the lunch basis for that schedule (`Period 3` or `Period 4`)
- the schedule key used by `schedulesData`

Use that metadata in `getScheduleKeyForDate(date)` instead of returning `normal` for every date.

- [ ] **Step 2: Route date lookups through the new schedule keys**

Update `getSchedules(date)` so it reads `schedulesData[scheduleKey]` for the active date range, then applies `getLunchForScheduleDay(scheduleKey, today, baseSchedule[today], baseSchedule)` for any day that has an A/B lunch choice.

This keeps calendar rendering, today view, and next-period calculations on one shared code path for normal weeks and the new special weeks.

- [ ] **Step 3: Make the lunch preference helper respect the special schedule key**

Add a schedule-key-to-storage-key mapping in `common.js` so `getLunchPreferencesForScheduleKey(scheduleKey)` can load the correct preference object for each special schedule. Use explicit keys such as `leapDayLunchPreferences`, `memorialDayLunchPreferences`, `movingUpLunchPreferences`, and `lastWeekLunchPreferences`, then fall back to the shared default lunch preferences only when nothing has been saved yet.

- [ ] **Step 4: Keep the lunch settings UI aligned with the shared Period 3 / Period 4 model**

Keep the existing labels in `settings/lunch/index.html` aligned with the shared model:
- Period 3 applies to Monday/Friday style special schedules
- Period 4 applies to Tuesday/Thursday style special schedules

If the copy needs a small clarification for the new schedule set, update only the wording; do not introduce a separate lunch-settings flow.

- [ ] **Step 5: Verify the shared lunch path with grep and a browser check**

Run:
```bash
grep -n 'getScheduleKeyForDate\|getSchedules\|getLunchPreferencesForScheduleKey\|getLunchForScheduleDay' common.js
```
Expected: the schedule-key lookup and lunch-selection helpers are wired to the new metadata table.

Then open one page from each new schedule window in the browser and confirm the visible schedule uses the correct lunch choice for that schedule's Period 3 / Period 4 basis.

- [ ] **Step 6: Commit the lunch-selection slice**

```bash
git add common.js settings/lunch/index.html
git commit -m "fix: generalize lunch selection for special schedules"
```

---

### Task 3: Remove stale Pilot 3 / SBA references and validate the old routes are gone

**Files:**
- Modify: `data/ticker-messages.json`
- Test: browser-open the old routes and the new routes

- [ ] **Step 1: Replace stale Pilot 3 / SBA copy in shared messaging**

Update the ticker message that currently says special weeks are auto-detected for Pilot 3 and SBA so it names the new special schedule set or uses generic special-schedule wording.

The goal is to remove visible text that still points users at the deleted routes.

- [ ] **Step 2: Run a repo-wide stale-route search**

Run:
```bash
grep -R -n 'pilot3\|sba' /workspaces/lwschedule.github.io --exclude-dir=.git --exclude-dir=node_modules
```
Expected: only intentional historical data remains, and there are no live links, page titles, or navigation entries still pointing to the deleted special-schedule pages.

- [ ] **Step 3: Confirm the deleted routes no longer resolve**

Open these URLs in the browser:
- `/schedules/pilot3`
- `/schedules/sba`
- `/setup/pilot3`
- `/setup/sba`

Expected: the old pages are gone and the app falls back to the 404 behavior, while the new `/schedules/leap-day`, `/schedules/memorial-day`, `/schedules/moving-up`, and `/schedules/last-week` routes load normally.

- [ ] **Step 4: Commit the cleanup slice**

```bash
git add data/ticker-messages.json
git commit -m "chore: remove old special schedule references"
```
