<!-- SUPERPOWERS-START -->
# SUPERPOWERS PROTOCOL
You are an autonomous coding agent operating on a strict "Loop of Autonomy."

## CORE DIRECTIVE: The Loop
For every request, you must execute the following cycle:
1. **PERCEIVE**: Read `plan.md`. Do not act without checking the plan. The plan may be in docs/superpowers/plans/
2. **ACT**: Execute the next unchecked step in the plan.
3. **UPDATE**: Check off the step in `plan.md` when verified.
4. **LOOP**: If the task is large, do not stop. Continue to the next step.

## YOUR SKILLS (Slash Commands)
VS Code reserved commands are replaced with these Superpowers equivalents:

- **Use `/write-plan`** (instead of /plan) to interview me and build `plan.md`.
- **Use `/investigate`** (instead of /fix) when tests fail to run a systematic analysis.
- **Use `/tdd`** to write code. NEVER write code without a failing test.

## RULES
- If `plan.md` does not exist, your ONLY valid action is to ask to run `/write-plan`.
- Do not guess. If stuck, write a theory in `scratchpad.md`.
 - Do not create, switch, or push Git branches unless explicitly instructed to do so.
 - On every commit, run `.github/scripts/auto_bump_version.py` (or enable `.githooks/pre-commit` by setting `git config core.hooksPath .githooks`). This script increments the patch (`z`) in `README.md`'s `vX.Y.Z` and updates the Release Date to the current date. It also updates `sw.js`'s cache name to the current date (YYYY-MM-DD). Do NOT change version numbers inside `sw.js` beyond the cache name change.

## AVAILABLE SKILLS

All skill definitions are available at `./.superpowers/skills/` (workspace-resident).
This path keeps all Superpowers content within your workspace, preventing permission prompts.
<!-- SUPERPOWERS-END -->

<!-- DATA-PROTECTION-START -->
# DATA PROTECTION POLICY

## CRITICAL: User Data Must Never Be Reset Accidentally

This application stores critical user settings in localStorage. These settings include:
- Lunch preferences
- Class schedules
- Club selections
- Pack-up reminders
- Phone Caddy reminders

### ✗ FORBIDDEN - Never do these things:
- ✗ Call `localStorage.clear()` or `localStorage.removeItem()` anywhere in code except in `/reset.js`
- ✗ Reset user data on page load
- ✗ Reset user data when cache version changes
- ✗ Reset user data on page refresh or navigation
- ✗ Change `CACHE_VERSION` in `sw.js` to reset data (cache changes NEVER affect localStorage)
- ✗ Create new localStorage-clearing code without explicit user permission

### ✓ ALLOWED - Only use these methods:
- ✓ User clicks "Reset All Settings" button → calls `window.resetAllSettings('user-button-click')`
- ✓ Admin sets `TRIGGER_RESET = true` in `/reset.js` → automatic reset on next page load (ONE time per session)
- ✓ Code that reads localStorage is fine - just never write destructive code

## How to Reset User Data (Admin Only)

If you need to reset ALL user data worldwide (e.g., critical bug fix or data corruption):

1. Open `/reset.js`
2. Find line 38: `const TRIGGER_RESET = false;`
3. Change `false` to `true`
4. Commit and push: `git add . && git commit -m "Trigger world reset" && git push origin main`
5. All users will reset their settings on their next page visit
6. **IMMEDIATELY** change `TRIGGER_RESET` back to `false`
7. Commit and push again: `git add . && git commit -m "Complete world reset" && git push origin main`

**ALERT USERS BEFORE RESETTING THEIR DATA**

## Cache Version & Data Separation

- `CACHE_VERSION` in `sw.js` is automatically updated on each commit
- Cache and localStorage are INDEPENDENT
- Changing cache version does NOT reset localStorage
- localStorage NEVER changes unless explicitly cleared via reset.js

## Redirect to Setup on Reset

When data is reset:
1. `reset.js` clears all localStorage entries
2. `reset.js` sets `__lws_should_redirect_to_setup` in sessionStorage
3. Next time `checkSetupComplete()` is called, it detects this flag
4. User is redirected to `/setup` to reconfigure
5. Flag is cleared after redirect (sessionStorage, not persistent)

<!-- DATA-PROTECTION-END -->
