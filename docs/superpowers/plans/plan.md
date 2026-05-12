# Change Coming Soon Button Link Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the About page "Coming Soon" button to link to the GitHub issues page.

**Architecture:** Single HTML update in the About page. No JavaScript or CSS changes are needed; only the anchor href changes.

**Tech Stack:** HTML, CSS

---

### Task 1: Update About Page Link

**Files:**
- Modify: `info/index.html`

- [x] **Step 1: Define the failing check**

```bash
grep -n 'href="https://github.com/lwschedule/lwschedule.github.io/issues"' info/index.html
```

- [x] **Step 2: Run the check to confirm it fails**

Run: `grep -n 'href="https://github.com/lwschedule/lwschedule.github.io/issues"' info/index.html`
Expected: no output and exit code 1 (link not present yet)

- [x] **Step 3: Update the Coming Soon button href**

```html
<a href="https://github.com/lwschedule/lwschedule.github.io/issues" target="_blank" style="display: flex; align-items: center; justify-content: center; gap: 10px; background: var(--primary) !important;   border-radius: 12px; padding: 15px; margin-bottom: 20px; color: white; text-decoration: none; font-size: 1.2em; font-weight: 700; box-shadow: var(--glow); text-align: center; transition: transform 0.3s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='none'">
  <span>Coming Soon</span>
  <img class="sf-symbol-icon" src="https://raw.githubusercontent.com/andrewtavis/sf-symbols-online/master/glyphs_white/arrow.up.right.png" alt="" aria-hidden="true">
</a>
```

- [x] **Step 4: Run the check to confirm it passes**

Run: `grep -n 'href="https://github.com/lwschedule/lwschedule.github.io/issues"' info/index.html`
Expected: one matching line showing the updated href

- [x] **Step 5: Commit**

```bash
git add info/index.html
git commit -m "chore: update coming soon link"
```
