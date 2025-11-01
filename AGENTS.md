## Issue Tracking with bd (beads)

**IMPORTANT**: This project uses **bd (beads)** for ALL issue tracking. Do NOT use markdown TODOs, task lists, or other tracking methods.

### Why bd?

- Dependency-aware: Track blockers and relationships between issues
- Git-friendly: Auto-syncs to JSONL for version control
- Agent-optimized: JSON output, ready work detection, discovered-from links
- Prevents duplicate tracking systems and confusion

### Quick Start

**Check for ready work:**
```bash
bd ready --json
```

**Create new issues:**
```bash
bd create "Issue title" -t bug|feature|task -p 0-4 --json
bd create "Issue title" -p 1 --deps discovered-from:bd-123 --json
```

**Claim and update:**
```bash
bd update bd-42 --status in_progress --json
bd update bd-42 --priority 1 --json
```

**Complete work:**
```bash
bd close bd-42 --reason "Completed" --json
```

### Issue Types

- `bug` - Something broken
- `feature` - New functionality
- `task` - Work item (tests, docs, refactoring)
- `epic` - Large feature with subtasks
- `chore` - Maintenance (dependencies, tooling)

### Priorities

- `0` - Critical (security, data loss, broken builds)
- `1` - High (major features, important bugs)
- `2` - Medium (default, nice-to-have)
- `3` - Low (polish, optimization)
- `4` - Backlog (future ideas)

### Workflow for AI Agents

1. **Check ready work**: `bd ready` shows unblocked issues
2. **Claim your task**: `bd update <id> --status in_progress`
3. **Work on it**: Implement, test, document
4. **Discover new work?** Create linked issue:
	 - `bd create "Found bug" -p 1 --deps discovered-from:<parent-id>`
5. **Complete**: `bd close <id> --reason "Done"`

### Auto-Sync

bd automatically syncs with git:
- Exports to `.beads/issues.jsonl` after changes (5s debounce)
- Imports from JSONL when newer (e.g., after `git pull`)
- No manual export/import needed!

### MCP Server (Recommended)

If using Claude or MCP-compatible clients, install the beads MCP server:

```bash
pip install beads-mcp
```

Add to MCP config (e.g., `~/.config/claude/config.json`):
```json
{
	"beads": {
		"command": "beads-mcp",
		"args": []

- ✅ Use bd for ALL task tracking
# Ask for suggestions first
luma patterns --suggest ui/screens/onboarding.mock.json --json

# Then validate all detected patterns
luma flow ui/screens/onboarding.mock.json --patterns Form.Basic,Table.Simple,Guided.Flow
```

> Skipping this checklist risks partial validation (e.g., Form.Basic passes while Guided.Flow violations remain hidden).

### Governance / Integrity Policy

🚫 **Never edit** `.beads/issues.jsonl` **directly; always use the `bd` CLI (or MCP server)**. Manual edits risk:
- Losing dependency edges (blocked / discovered-from)
- Producing hidden / orphaned issues not surfaced in `bd ready`
- Causing daemon overwrite races and silent data loss

To verify repository integrity run:
```powershell
pwsh scripts/validate-beads-integrity.ps1
```
Exit codes:
- `0` = clean
- `2` = manual edit or structural anomaly detected

Add this script to CI / pre-push if stricter enforcement is desired.