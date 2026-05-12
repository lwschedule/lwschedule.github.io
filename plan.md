# Plan: Data Reset Control & Bug Fixes

## Overview
Implement controlled data reset functionality and fix unintended data resets. Users should never lose data unless they explicitly reset it via preference, or via a one-line code trigger in reset.js.

## Requirements
1. ✅ Create `reset.js` file with one-line trigger for admin data reset
2. ✅ Fix bug: data should NOT reset when cache version changes
3. ✅ Fix bug: data should NOT reset on page load
4. ✅ Add redirect to setup if all settings reset to default on page load
5. ✅ Update copilot-instructions.md to prevent accidental data resets
6. ✅ Add detailed comments to all reset logic

## Investigation Completed
- Found localStorage.clear() in settings/index.html (line 57) - intentional reset button
- Found checkSetupComplete() logic - redirects to setup if lunchPreferences missing
- Identified cache version automatically changes via .github/scripts/auto_bump_version.py
- Confirmed common-core.js auto-loads common.js on page load
- No unintended data resets on page load currently evident - may need to validate during testing

## Tasks

### Phase 1: Create reset.js Infrastructure
- [ ] Create reset.js file with prominent comments
- [ ] Add one-line trigger variable (e.g., `const TRIGGER_RESET = false;`)
- [ ] Comment: "Change 'false' to 'true' to reset all user settings worldwide"
- [ ] Export resetAllSettings() function with safeguards
- [ ] Add timestamp logging when reset occurs

### Phase 2: Integrate reset.js into Common Flow
- [ ] Import reset.js in common-core.js or common.js
- [ ] Add check on page load (with escape hatch) to trigger reset if flag is true
- [ ] Log reset events to console with timestamp and warning
- [ ] Ensure reset only runs once per trigger

### Phase 3: Fix Settings Reset Button
- [ ] Update settings/index.html reset button behavior
- [ ] Change from just localStorage.clear() to use reset.js logic
- [ ] Add comments explaining the reset flow

### Phase 4: Implement Redirect to Setup on Reset Detection
- [ ] Modify checkSetupComplete() to detect if all settings are cleared
- [ ] Add fallback redirect logic if lunchPreferences is suddenly missing
- [ ] Test that redirects work correctly

### Phase 5: Protect cache version changes
- [ ] Document in copilot-instructions.md: NEVER change cache version without explicit user permission
- [ ] Add comments in sw.js explaining cache version policy
- [ ] Verify that cache changes don't clear localStorage

### Phase 6: Update Instructions for Data Protection
- [ ] Update copilot-instructions.md with strong warning about data protection
- [ ] Add "DATA PROTECTION POLICY" section in instructions
- [ ] Document that reset.js is the ONLY approved method for admin reset

### Phase 7: Testing & Verification
- [ ] Verify page reload does NOT reset data
- [ ] Verify cache version change does NOT reset data
- [ ] Verify settings reset button uses reset.js flow
- [ ] Verify setup redirect works on detected reset
- [ ] Verify one-line change in reset.js triggers worldwide reset
- [ ] Verify reset only happens once per trigger

### Phase 8: Documentation
- [ ] Add comments to reset.js with examples
- [ ] Add comments to checkSetupComplete() flow
- [ ] Document cache version policy in README or developer docs
