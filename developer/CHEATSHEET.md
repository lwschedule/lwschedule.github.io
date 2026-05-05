# Superpowers Cheat Sheet, Condensed (Commands-Only Workflows)

## How to use
Natural language works. Copilot maps intent to skills.  
- Add auth → plan flow  
- Use TDD → `/tdd`  
- Tests failing → `/investigate`  
- Continue work → reads plan  

Use slash commands for explicit control.

---

## 14 Skills

### Core
`/brainstorm`  
Explore design. Compare approaches. Output validated design.

`/write-plan`  
Create task plan. 2 to 5 min tasks. Include paths, code, tests.

`/execute-plan`  
Run plan in batches with review checkpoints.

---

### Testing and Debugging
`/tdd`  
Test first. Fail. Implement. Pass. Refactor.

`/investigate`  
Isolate. Hypothesize. Test. Verify.

`/verify`  
Run commands. Show output.

---

### Git
`/worktree`  
Create isolated workspace.

`/finish-branch`  
Verify and merge or PR.

---

### Code Review
`/review`  
Check plan and quality.

`/receive-review`  
Evaluate feedback before changes.

---

### Advanced
`/subagent-dev`  
One agent per task.

`/dispatch-agents`  
Parallel agents.

---

### Meta
`/write-skill`  
Create or refine skills.

`/superpowers`  
Learn system.

---

## Full Workflows

### Feature Development
`/brainstorm` → `/write-plan` → `/execute-plan` or `/subagent-dev` → `/review` → `/receive-review` → `/verify`

---

### Debugging
`/investigate` → `/tdd` → `/verify`

---

### GitHub Issues
`/brainstorm` or `/investigate` → `/write-plan` → `/execute-plan` → `/review` → `/receive-review` →  `/verify`

---

### Parallel Work
`/dispatch-agents` → `/investigate` or `/tdd` → `/verify`

---

### Code Review Loop
`/receive-review` → `/tdd` → `/verify`

---

### Skill Creation
`/write-skill` → `/verify`

---

## Decision guide
- Design → `/brainstorm`  
- Plan → `/write-plan`  
- Code → `/worktree` + `/tdd`  
- Bug → `/investigate`  
- Done → `/review` + `/verify`  
- Merge → `/finish-branch`  
- Feedback → `/receive-review`  

---


## Rules
- Always check for a skill  
- Use process skills first  
- TDD always  
- Show evidence with `/verify`  
- Invoke before questions  
- Use latest version  
- One skill per task  

---

## Common mistakes
- Skipping `/tdd`  
- Skipping `/investigate`  
- Assuming tests pass  
- Blindly applying feedback  
- Skipping `/write-plan`  
- Not using `/dispatch-agents`  
- Skipping `/brainstorm`  

---

## Daily loop

Start  
`/brainstorm` → `/write-plan` → `/worktree` → `/tdd`  

During  
`/tdd` → `/review` → `/verify`  

Stuck  
`/investigate` → `/tdd` → `/verify`  

Finish  
`/verify` → `/finish-branch` → `/receive-review`  

---

## CLI hooks
Warn before commit or push if tests not run or stale.