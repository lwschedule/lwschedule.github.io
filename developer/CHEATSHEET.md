# Superpowers Cheat Sheet

## Using Superpowers

**Natural Language Interface (Recommended):** Simply describe what you want to do. Copilot infers the correct Superpowers pattern:
- "I want to add user authentication" → Planning workflow
- "Let's implement this with TDD" → Test-driven development
- "The tests are failing" → Systematic investigation
- "Continue with the implementation" → Loop of Autonomy (reads plan.md)

**Slash Commands (Explicit):** Use `/write-plan`, `/tdd`, `/investigate` etc. when you want explicit skill invocation.

**The descriptions below illustrate how Superpowers workflows operate naturally - Copilot understands these patterns from context.**

---

Quick reference guide for all 14 Superpowers skills with one-liners, detailed descriptions, and workflow diagrams.

---

## Table of Contents

### Skills by Category
- [🎯 Core Workflow](#-core-workflow) - `/brainstorm`, `/write-plan`, `/execute-plan`
- [🧪 Testing & Debugging](#-testing--debugging) - `/tdd`, `/investigate`, `/verify`
- [🌳 Git Workflows](#-git-workflows) - `/worktree`, `/finish-branch`
- [📝 Code Review](#-code-review) - `/review`, `/receive-review`
- [⚡ Advanced Development](#-advanced-development) - `/subagent-dev`, `/dispatch-agents`
- [🛠️ Meta](#️-meta) - `/write-skill`, `/superpowers`

### Reference Sections
- [Workflow Diagrams](#workflow-diagrams) - Visual guides for common development patterns
- [Skill Priority by Situation](#skill-priority-in-situations) - Which skills to use when
- [Decision Tree](#quick-decision-tree-which-skill-do-i-need) - Choose the right skill
- [Daily Workflows](#running-superpowers-daily) - Morning, development, debugging, shipping patterns

---

## The 14 Skills

### 🎯 Core Workflow

#### `/brainstorm` (brainstorming)
**One-liner:** Explore ideas through Socratic dialogue before starting creative work.

Activates when you need to design something new or explore alternatives. It asks questions to understand your intent, explores 2-3 different approaches with trade-offs, then presents the design in sections for validation. Use this BEFORE `/write-plan` when you're uncertain about architecture or need to explore design space.

**When to use:** Designing features, exploring architecture, starting new projects, uncertain about approach  
**Output:** Validated design document saved to git

---

#### `/write-plan` (writing-plans)
**One-liner:** Create comprehensive, bite-sized implementation plans with exact file paths and complete code.

Transforms validated designs into detailed task breakdowns (2-5 minutes each). Every task includes exact file paths, complete code snippets, verification commands, and expected outputs. Follows strict TDD methodology (RED-GREEN-REFACTOR per task). Save plans to `docs/plans/YYYY-MM-DD-<feature>.md`.

**When to use:** After design approval, before implementation, executing complex multi-step work  
**Output:** Detailed implementation plan with 10+ bite-sized tasks

---

#### `/execute-plan` (executing-plans)
**One-liner:** Execute implementation plans with batch processing and human review checkpoints.

Loads a written plan, reviews it critically, executes tasks in batches, then stops for architect review between batches. Runs 3-5 tasks, reports progress, waits for human validation, then continues.

**When to use:** Executing plans in separate sessions, need explicit checkpoints, architectural decisions required between batches  
**Output:** Completed tasks with progress reports between batches

---

### 🧪 Testing & Debugging

#### `/tdd` (test-driven-development)
**One-liner:** RED-GREEN-REFACTOR: write failing test, watch fail, write minimal code, watch pass, commit.

Enforces strict TDD discipline. NEVER write implementation code before tests. Watch tests fail (RED phase) with the right error. Write minimal code to pass (GREEN phase). Refactor while tests stay green (REFACTOR phase). Commit after each cycle.

**When to use:** Any feature implementation, any bugfix, refactoring, behavior changes  
**Anti-patterns:** Writing code first, skipping tests for "simple" changes, not watching tests fail

---

#### `/investigate` (systematic-debugging)
**One-liner:** 4-phase root cause analysis: isolate, hypothesize, test, verify.

When tests fail or bugs appear, follow the 4-phase systematic process:
1.  **Isolate**: reproduce reliably, narrow scope.
2.  **Hypothesize**: form evidence-based theories.
3.  **Test**: validate hypotheses with targeted tests.
4.  **Verify**: confirm fix works.

**When to use:** When tests fail, debugging issues, understanding failures  
**Output:** Root cause identified with evidence, fix implemented

---

#### `/verify` (verification-before-completion)
**One-liner:** Run verification commands and confirm evidence before claiming success.

Before committing or claiming work is done, you must run verification commands and check output. "Tests pass" requires showing test output. Prevents false positives and premature shipping.

**When to use:** Before any success claim, before commits, before PR creation, after claimed fixes  
**Anti-patterns:** Assuming tests pass without running them, "it should work", skipping verification

---

### 🌳 Git Workflows

#### `/worktree` (using-git-worktrees)
**One-liner:** Create isolated workspaces on new branches with clean test baseline.

Before starting feature work, create an isolated git worktree. Automatically detects good branch points, creates the worktree, verifies tests pass in isolation, then confirms clean baseline.

**When to use:** Starting new features, starting bug fixes, before executing implementation plans  
**Output:** Isolated git worktree with clean test baseline

---

#### `/finish-branch` (finishing-a-development-branch)
**One-liner:** Verify tests pass, present options (merge/PR/keep/discard), handle chosen workflow.

After all tasks complete on a branch, this guides the merge workflow. Verifies final tests pass. Presents options: merge to main, create PR, keep branch, or discard.

**When to use:** When all work on a branch is complete, all tests pass  
**Output:** Successful merge/PR or clean branch state

---

### 📝 Code Review

#### `/review` (requesting-code-review)
**One-liner:** Self-review against plan and code quality before human review.

Reviews your work against the original plan (spec compliance) and checks code quality issues by severity. Reports critical blockers vs warnings to catch issues before they cascade.

**When to use:** After each completed task, before pushing to main, before creating PRs  
**Output:** Pre-review checklist with issues by severity

---

#### `/receive-review` (receiving-code-review)
**One-liner:** Systematically respond to code review feedback with technical rigor.

When you receive feedback, use this skill to evaluate it technically, verify it's correct, and push back on unsound suggestions. Prevents performative agreement and ensures technically sound implementations.

**When to use:** After receiving code review feedback, before implementing changes  
**Output:** Evaluated feedback with technical rationale and implemented changes

---

### ⚡ Advanced Development

#### `/subagent-dev` (subagent-driven-development)
**One-liner:** Dispatch subagents per task with two-stage review (spec first, then code quality).

Execute plans via subagents dispatched per task in the current session. Each subagent gets a single task and undergoes two-stage review: spec compliance and code quality.

**When to use:** Executing implementation plans in current session, complex multi-task work  
**Output:** Completed tasks with review after each one

---

#### `/dispatch-agents` (dispatching-parallel-agents)
**One-liner:** Run concurrent subagent workflows on independent tasks without shared state.

When you have 2+ independent tasks, dispatch one agent per task in parallel. Each agent reports results independently, and the skill coordinates final aggregation.

**When to use:** Multiple independent tasks, parallel investigation, alternative explorations  
**Output:** Concurrent results from independent subagent workflows

---

### 🛠️ Meta

#### `/write-skill` (writing-skills)
**One-liner:** Apply TDD methodology to skill documentation.

Create or edit skills by testing with subagents WITHOUT the skill to identify failures (RED), writing the minimal skill (GREEN), and verifying compliance.

**When to use:** Creating new skills, editing existing skills  
**Output:** Battle-tested skill with documented pressure scenarios

---

#### `/superpowers` (using-superpowers)
**One-liner:** Learn how to find and use skills - your operating system orientation guide.

Introduction to the Superpowers framework. Explains finding relevant skills, when to invoke them, and the protocols that make the system work.

**When to use:** Understanding the system, learning protocols, when stuck or uncertain  
**Output:** Clear understanding of Superpowers operation

---

## Workflow Diagrams (Text Versions)

### Core Development Workflow: Feature from Start to Finish
1.  **Design Validation**: `/brainstorm` to explore ideas and architecture.
2.  **Planning**: `/write-plan` to create a detailed task breakdown.
3.  **Environment Setup**: `/worktree` to create an isolated branch and verify a clean baseline.
4.  **Implementation (Cycle)**: `/tdd` for Red-Green-Refactor development.
5.  **Quality Check**: `/review` for self-review against the plan.
6.  **Validation**: `/verify` to run final tests and provide evidence.
7.  **Shipping**: `/finish-branch` to merge or create a PR.

---

### Debugging & Troubleshooting Workflow
1.  **Isolation**: `/investigate` to reproduce the bug and narrow the scope.
2.  **Hypothesis & Testing**: Form theories and validate with targeted tests via `/investigate`.
3.  **Fix**: Apply `/tdd` to implement the solution and ensure the fix is tested.
4.  **Confirmation**: `/verify` to provide evidence that the bug is resolved.

---

### GitHub Issues Workflow (Feature + Defects)
1.  **Intake**: Review GitHub issues.
2.  **Analysis**: Use `/brainstorm` (for features) or `/investigate` (for bugs).
3.  **Execution**: Follow the Core Workflow (Plan → Worktree → TDD).
4.  **Completion**: `/verify` and `/finish-branch`.

---

### Parallel Development Workflow (Multiple Independent Tasks)
1.  **Identification**: Identify independent tasks that do not share state.
2.  **Parallel Execution**: `/dispatch-agents` to assign one subagent per task.
3.  **Individual Work**: Each agent runs its own `/investigate` or `/tdd` flow.
4.  **Aggregation**: Consolidate results and verify the total output.

---

### Code Review & Refinement Workflow
1.  **Feedback Arrival**: Receive code review comments.
2.  **Evaluation**: `/receive-review` to technically evaluate and verify suggestions.
3.  **Refinement**: `/tdd` to implement changes or refactor based on verified feedback.
4.  **Verification**: `/verify` the updated implementation.

---

### Skill Creation & Documentation Workflow
1.  **Baseline Testing (RED)**: Test subagents without the new skill to identify failures.
2.  **Skill Drafting (GREEN)**: Write the minimal skill documentation using `/write-skill`.
3.  **Validation**: Verify subagents now comply with the written skill.
4.  **Refinement**: Refactor skill documentation to close loopholes.

---

## Quick Decision Tree: Which Skill Do I Need?
* **Need to design?** → `/brainstorm`
* **Ready to implement?** → `/write-plan`
* **Ready to code?** → `/worktree` then `/tdd`
* **Something broke?** → `/investigate`
* **Finished a task?** → `/review` and `/verify`
* **Ready to merge?** → `/finish-branch`
* **Got feedback?** → `/receive-review`

---

## Skill Priority in Situations

| Situation | Priority Order | Why |
| :--- | :--- | :--- |
| **Starting new feature** | 1. `/brainstorm` → 2. `/write-plan` → 3. `/worktree` | Validate design before planning/coding |
| **Test failure** | 1. `/investigate` (isolate) → 2. `/tdd` (fix) → 3. `/verify` | Must understand before fixing |
| **Bug in production** | 1. `/investigate` → 2. `/tdd` → 3. `/receive-review` | Systematic > quick fix |
| **Multiple bugs** | 1. `/dispatch-agents` → each agent: `/investigate` → `/tdd` | Parallelize when independent |
| **Code review feedback** | 1. `/receive-review` (evaluate) → 2. `/tdd` (implement) → 3. `/verify` | Don't blindly implement |
| **Multiple tasks in plan** | 1. `/write-plan` → 2. `/subagent-dev` OR `/execute-plan` → 3. `/review` per task | Batch vs autonomous execution |
| **Feature ship** | 1. `/verify` → 2. `/finish-branch` → 3. `/dispatch-agents` (for issues) | Evidence before claiming done |

---

## One-Line Skill Usage Rules

- **Never skip skill check** - Always think "does ANY skill apply?" even if 1% likely
- **Process skills first** - Brainstorming/debugging determine HOW, implement skills guide execution
- **TDD is non-negotiable** - DELETE code written before tests. No exceptions.
- **Evidence always** - Never claim success without `/verify` output
- **Invoke before clarifying** - Skill check BEFORE asking questions
- **Skills evolve** - Read current version, don't rely on memory
- **Subagents per skill** - Each skill gets its own task/invocation

---

## Common Mistakes to Avoid

| ❌ Mistake | ✅ Correct Approach |
| :--- | :--- |
| "This is simple, skip `/tdd`" | All changes use `/tdd`. Period. |
| "I'll explore files first" | `/investigate` skill tells you HOW to explore |
| "Assume tests pass" | Run `/verify` and show output |
| "Implement feedback immediately" | Use `/receive-review` to evaluate first |
| "I'll plan later" | `/write-plan` BEFORE implementation |
| "One agent does everything" | `/dispatch-agents` per independent problem |
| "Skip `/brainstorm` on small features" | Design validation applies to all features |

---

## Running Superpowers Daily

### Morning: 🌅 Starting Work
1. Check GitHub issues → `/brainstorm` if uncertain
2. Approved work? → `/write-plan`
3. Ready to code? → `/worktree` then `/tdd`

### During Work: ⚙️ Development
Every task:
- Write test (`/tdd` RED)
- Verify test fails (`/tdd`)
- Implement code (`/tdd` GREEN)
- Self-review (`/review`)
- Verify evidence (`/verify`)

### When Stuck: 🔍 Debugging
1. `/investigate` - systematic root cause
2. `/tdd` - implement fix with test
3. `/verify` - confirm fix works

### Finishing: ✅ Shipping
1. All tests pass? → `/verify`
2. Ready to merge? → `/finish-branch`
3. Got feedback? → `/receive-review` then back to step 1

---

## Automated Verification (Copilot CLI Only)

**Available in:** Copilot CLI with `hooks/` plugin (not VS Code Copilot Chat)

Superpowers includes hooks that automatically enforce the Iron Law: "Never commit without running tests."

### How It Works

**sessionStart Hook:**
- Runs when you start `copilot` session
- Bootstraps/updates `~/.cache/superpowers`
- Shows "🦸 Superpowers Active" banner

**preToolUse Hook (Iron Law Guard):**
- Runs before `git commit` or `git push`
- Checks for verification marker: `/tmp/.superpowers-verified-{project_hash}`
- **Warns if:**
	- No marker (tests haven't been run)
	- Marker stale (>1 hour old)
- **Always allows commit** (educates, doesn't block)

---

## Setup Reminder

After installing Superpowers:
- **Verify installation**: `./scripts/verify-installation.sh`
- **Reload VS Code**: Command Palette > Developer: Reload Window
- **Check skills appear**: Open Copilot Chat, type `/` to see all 14 commands

All 14 skills now available in VS Code! 🚀