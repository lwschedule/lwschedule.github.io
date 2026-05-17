# OpenCode Agents

## Available Agents

### General
- **Purpose**: Multi-purpose agent for research, planning, and execution.
- **Usage**: Default agent for most tasks.

### Explore
- **Purpose**: Fast exploration of codebases (file search, pattern matching).
- **Usage**: Codebase navigation, finding files, or searching for patterns.

### Custom Agents
Define new agents in `.opencode/agent/<name>.md` or via `opencode.json`.

## Planning and Execution Workflow
Before making changes, create a **step-by-step plan**. Break complex tasks into numbered phases. For each phase:
1. **State the goal**: Clearly define what this phase aims to achieve.
2. **List assumptions**: Document any assumptions about the codebase, tools, or environment.
3. **Identify risks or unknowns**: Highlight potential pitfalls or areas needing clarification.
4. **Propose the best implementation**: Outline the chosen approach and justify it.
5. **Verify against the original request**: Ensure alignment with the user's requirements.

After implementing each phase:
- Review the code for correctness.
- Check for regressions.
- Look for simpler solutions.
- Revise if needed.

### Best Practices
- Maintain an **internal scratchpad** to track progress and updates.
- Update your plan when new information emerges.
- Do not stop at the first solution. Evaluate at least **two approaches** for non-trivial tasks.
- Prefer **reversible changes** to minimize risk.
- Summarize **final reasoning** and any remaining uncertainties.

## Agent Configuration
Agents can be configured in `opencode.json`:

```json
{
  "agent": {
    "my-agent": {
      "model": "anthropic/claude-sonnet-4-6",
      "mode": "subagent",
      "description": "Custom task executor.",
      "permission": {
        "edit": "deny"
      }
    }
  }
}
```

## Permissions
- **Plan Mode**: `edit: deny *` (readonly).
- **Build Mode**: Default permissions apply.

## MCP Servers
Configure MCP servers in `opencode.json` (e.g., `sequential-thinking`). Ensure dependencies (`npx`, Node.js) are installed before enabling.