I'm using the writing-plans skill to create the implementation plan.

# Fix TextMorph animation for iOS Safari Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the TextMorph animation in `vendor/torph.js` so morphs animate correctly on iOS Safari.

**Architecture:** Small, targeted fixes: (1) make the forced reflow robust across browsers, (2) reference `requestAnimationFrame` via `globalThis` to avoid environment lookup differences, (3) add `-webkit-` prefixed animation rules/keyframes in CSS for older iOS Safari.

**Tech Stack:** Vanilla JS (ES module in `vendor/torph.js`), CSS (`common.css`), static site assets.

---

### Task 1: Plan file (this file)

**Files:**
- Create: `docs/superpowers/plans/2026-05-11-fix-textmorph-ios-safari.md`

- [x] **Step 1: Save this plan** (done)


### Task 2: Update `vendor/torph.js` to use `globalThis.requestAnimationFrame` and robust reflow

**Files:**
- Modify: `vendor/torph.js`

- [ ] **Step 1: Replace the reflow line and RAF lookup**

Apply the following changes (complete code snippet for the `update` method):

```js
update(nextValue) {
  const nextText = String(nextValue == null ? '' : nextValue);

  this.value = nextText;

  if (!this.element) return;

  if (this._frame) {
    if (typeof globalThis.cancelAnimationFrame === 'function') {
      globalThis.cancelAnimationFrame(this._frame);
    } else {
      clearTimeout(this._frame);
    }
    this._frame = null;
  }

  this.element.textContent = nextText;
  this.element.classList.remove('torph--animate');
  // Force a layout/reflow in a way that is reliable across browsers
  // including iOS Safari. Reading getBoundingClientRect() is less
  // likely to be optimized away than the void-offsetWidth trick.
  if (this.element && typeof this.element.getBoundingClientRect === 'function') {
    this.element.getBoundingClientRect();
  }
  if (this._timer) {
    clearTimeout(this._timer);
    this._timer = null;
  }

  const requestFrame = typeof globalThis.requestAnimationFrame === 'function'
    ? globalThis.requestAnimationFrame.bind(globalThis)
    : (callback) => setTimeout(callback, 16);

  this._frame = requestFrame(() => {
    this._frame = null;
    if (this.element) this.element.classList.add('torph--animate');
    this._timer = setTimeout(() => {
      if (this.element) this.element.classList.remove('torph--animate');
      this._timer = null;
    }, 240);
  });
}
```

**Why:** `globalThis.requestAnimationFrame` avoids environment lookup issues (for example when `requestAnimationFrame` isn't present on the lexical global). `getBoundingClientRect()` is a reliable way to force reflow that is less likely to be optimized out by some engines.

**Commands:**

```bash
# Show the file diff (from repo root)
git add vendor/torph.js
git diff --staged -- vendor/torph.js
```

- [ ] **Step 2: Run a lint/format step if available**

Run project's formatting/lint tasks if used (optional). No tests are present for this file.


### Task 3: Add -webkit prefixed animation rules to `common.css`

**Files:**
- Modify: `common.css`

- [ ] **Step 1: Add -webkit-animation on the selector and -webkit-keyframes**

Replace the existing `.torph--animate` animation rule with both `-webkit-animation` and `animation`, and add a `@-webkit-keyframes` block.

Example replacement (exact snippet to add):

```css
.time-value .time-value-morph.torph--animate,
.countdown-value .countdown-value-morph.torph--animate,
.counter-morph.torph--animate,
.term-countdown-value-morph.torph--animate,
#timer .timer-value-morph.torph--animate {
  -webkit-animation: torph-pop 240ms cubic-bezier(0.19, 1, 0.22, 1);
  animation: torph-pop 240ms cubic-bezier(0.19, 1, 0.22, 1);
}

@-webkit-keyframes torph-pop {
  0% {
    opacity: 0.45;
    -webkit-transform: translateY(0.12em) scale(0.985);
            transform: translateY(0.12em) scale(0.985);
  }

  100% {
    opacity: 1;
    -webkit-transform: translateY(0) scale(1);
            transform: translateY(0) scale(1);
  }
}
```

**Why:** Older iOS Safari versions need `-webkit-` prefixes for animation/keyframes; adding them improves compatibility without changing behaviour in modern browsers.

**Commands:**

```bash
git add common.css
git diff --staged -- common.css
```


### Task 4: Verification & manual iOS Safari checklist

**Files:** none (manual verification)

- [ ] **Step 1: Start a local static server**

```bash
# From repo root (examples):
python3 -m http.server 8000
# or
npm install -g http-server && http-server -c-1
```

Open `http://localhost:8000/` and navigate to a page that uses the morphing UI (e.g., the homepage or timer widget).

- [ ] **Step 2: Verify in desktop browsers first**

- Confirm morphing animates in Chrome/Firefox/Safari on macOS.
- Use devtools to watch class toggles on the morph element.

- [ ] **Step 3: Verify on iOS Safari**

Options:
- Use a physical iPhone and connect to the same network; open the site in Mobile Safari.
- Use macOS Safari's Develop > [device] > Inspect to remotely debug Mobile Safari.

What to check:
- The element receives `torph--animate` class after the change.
- The CSS `animation-name` applied (check computed styles includes `torph-pop` or `-webkit-torph-pop`).
- No JS console errors related to `requestAnimationFrame` or `getBoundingClientRect`.

If the animation still doesn't run:
- Add temporary console logs in `vendor/torph.js` near where the class is added:

```js
console.log('TextMorph: scheduling add animate class', !!this.element);
```

Reload on device and observe console via remote inspector.


### Task 5: Commit and PR

**Files:**
- Modify: `vendor/torph.js`
- Modify: `common.css`
- Create: `docs/superpowers/plans/2026-05-11-fix-textmorph-ios-safari.md` (this file)

- [ ] **Step 1: Commit changes**

```bash
git checkout -b fix/textmorph-ios-safari-26
git add vendor/torph.js common.css docs/superpowers/plans/2026-05-11-fix-textmorph-ios-safari.md
git commit -m "fix: TextMorph animation compatibility for iOS Safari (fixes #26)"
```

- [ ] **Step 2: Push and open a PR**

```bash
git push -u origin fix/textmorph-ios-safari-26
# Open a Pull Request on GitHub referencing issue #26 and summarizing changes.
```


## Self-Review

1. Spec coverage: This plan touches all plausible causes listed in the issue: `requestAnimationFrame` lookup, forced reflow technique, and CSS animation compatibility. If further investigation shows a platform-specific quirk, add a follow-up task.

2. Placeholder scan: No placeholders. All code snippets are concrete replacements.

3. Type consistency: JS snippets use existing `TextMorph` method signatures.

---

Plan complete and saved to `docs/superpowers/plans/2026-05-11-fix-textmorph-ios-safari.md`. Two execution options:

1. Subagent-Driven (recommended) — dispatch a subagent per task for fast iterations.
2. Inline Execution — I can implement remaining manual verification steps here and prepare the PR.

Which approach do you prefer?