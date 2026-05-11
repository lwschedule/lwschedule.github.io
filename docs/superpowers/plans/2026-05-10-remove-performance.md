# Remove performance.md Implementation Plan

> **For agentic workers:** REQUIRED SUB‑SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task‑by‑task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Delete the obsolete `PERFORMANCE.md` file from the repository and remove any references to it so the project builds and serves without broken links.

**Architecture:** The repository is a static site built from HTML, CSS, and JavaScript assets. Documentation files live at the repository root and are linked from various pages (e.g., navigation menus, footers). Removing a documentation file requires deleting the file and cleaning up any hyperlinks that point to it.

**Tech Stack:**
- Static HTML site
- No build tooling required for this change

---

### Task 1: Locate and Remove `PERFORMANCE.md`

**Files:**
- Delete: `PERFORMANCE.md`
- Modify (if needed): any HTML files that contain links to `PERFORMANCE.md` (e.g., `index.html`, `common.html`, navigation includes).

- [ ] **Step 1: Verify the file exists**

```bash
ls -l PERFORMANCE.md
```

*Expected output:* the file is listed.

- [ ] **Step 2: Search the codebase for links to `PERFORMANCE.md`**

```bash
grep -R "PERFORMANCE.md" -n .
```

*Expected output:* a list of file paths and line numbers where the file is referenced.

- [ ] **Step 3: Remove the `PERFORMANCE.md` file**

```bash
git rm PERFORMANCE.md
```

- [ ] **Step 4: Edit each file that referenced `PERFORMANCE.md` to delete or replace the link**

For each file reported by the grep in Step 2, open the file and remove the `<a href="PERFORMANCE.md">…</a>` element (or replace it with a suitable alternative, e.g., a link to the home page).

Example edit (in `index.html`):

```diff
@@ -45,7 +45,6 @@
-    <li><a href="PERFORMANCE.md">Performance</a></li>
```

- [ ] **Step 5: Run a quick build / serve check to ensure no broken links**

If the site is served locally (e.g., via `python -m http.server`), start the server and manually verify the navigation works without 404s for the removed page.

```bash
python -m http.server 8000 &
curl -I http://localhost:8000/PERFORMANCE.md
```

*Expected output:* `HTTP/1.1 404 Not Found` (which is acceptable because the file is intentionally removed) and no other 404s for navigation links.

- [ ] **Step 6: Commit the changes**

```bash
git add .
git commit -m "chore: remove obsolete PERFORMANCE.md and clean up links"
```

- [ ] **Step 7: Push the commit (if working on a branch)**

```bash
git push origin main
```

---

### Task 2: Verify Repository Health After Deletion

**Files:** No new files; just verification.

- [ ] **Step 1: Run the site’s CI (if any) or linting step**

If the repository defines a CI workflow (e.g., GitHub Actions), trigger it manually or let it run on push. Ensure it passes.

```bash
# Example: trigger GitHub Actions via the CLI (optional)
gh workflow run ci.yml
```

- [ ] **Step 2: Perform a final manual sanity check**

Open the site in a browser (`http://localhost:8000`) and navigate through all menus to confirm no dead links remain.

- [ ] **Step 3: Close the issue**

Add a comment to the GitHub issue confirming the removal and link cleanup, then close the issue.

```markdown
Removed `PERFORMANCE.md` and cleaned up all references. The site builds and all navigation links work correctly. Closing this issue.
```

- [ ] **Step 4: Commit the comment and close the issue via the GitHub UI or CLI**

```bash
gh issue comment 45 --body "Removed `PERFORMANCE.md` and cleaned up all references. The site builds and all navigation links work correctly. Closing this issue."
gh issue close 45
```

---

## Self‑Review Checklist

1. **Spec coverage** – All required actions (delete file, remove references, verify no broken links, commit, close issue) are covered.
2. **Placeholder scan** – No “TODO” or vague placeholders remain; every step includes concrete commands or code diffs.
3. **Type consistency** – Not applicable (no code types involved).

---

**Plan saved to `docs/superpowers/plans/2026-05-10-remove-performance.md`.**

Two execution options:

1. **Subagent‑Driven (recommended)** – I will dispatch a fresh subagent for each task, reviewing after each step.
2. **Inline Execution** – I will execute the tasks directly in this session using the `executing-plans` subskill.

Which approach would you like to use?