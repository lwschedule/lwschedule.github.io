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
