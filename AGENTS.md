# Agent Instructions

## Preflight: Before You Generate Scaffolds

**IMPORTANT**: Before generating any LUMA scaffold JSON, consult the **Scaffold Contract**.

### What is the Scaffold Contract?

The Scaffold Contract defines exact rules AI agents must follow when generating scaffold JSON files. It ensures all generated scaffolds:
- Have valid structure (`schemaVersion`, `screen.id`, `screen.root`)
- Use correct node types with required fields
- Follow spacing and layout conventions
- Pass `luma ingest` validation

### Accessing the Contract

**Option 1: Command-line**
```bash
luma explain --topic scaffold-contract --json
```

**Option 2: Reference file**
See `AGENT-RULES-SCAFFOLD.md` in the repository root.

### Key Contract Rules

- ✅ `schemaVersion` must be `"1.0.0"`
- ✅ All node IDs must be unique
- ✅ All spacing values (gap, padding) must be in `settings.spacingScale`
- ✅ Forms must have both `fields[]` and `actions[]` arrays (non-empty)
- ✅ Tables must have `title`, `columns[]`, and `responsive.strategy`
- ✅ Output pure JSON (no comments, no markdown wrappers)

### Generating Scaffolds with `scaffold new`

**RECOMMENDED**: Use `luma scaffold new` to generate valid scaffolds from built-in patterns.

```bash
# Create a todo-list scaffold
luma scaffold new --pattern todo-list --out todo.json

# Create a login form
luma scaffold new --pattern login-form --out login.json --title "Sign In"

# Custom breakpoints
luma scaffold new --pattern dashboard-grid --out dashboard.json --breakpoints "375x667,1920x1080"

# Overwrite existing file
luma scaffold new --pattern form-basic --out form.json --force
```

**Available patterns:**
- `todo-list` - Table + Add Button
- `empty-screen` - Minimal starting point
- `form-basic` - Simple form with 2 fields
- `table-simple` - Basic data table
- `contact-form` - Contact form with validation
- `data-table-with-actions` - Table with row actions
- `modal-dialog` - Dialog with actions
- `login-form` - Email + password login
- `multi-step-form` - Multi-page form flow
- `dashboard-grid` - Dashboard with cards

### Workflow Example

```bash
# 1. Generate scaffold from pattern
luma scaffold new --pattern contact-form --out contact.json

# 2. Validate structure
luma ingest contact.json

# 3. Test layout at different viewports
luma layout contact.json --viewports 320x640,768x1024

# 4. Check keyboard navigation
luma keyboard contact.json

# 5. Validate form pattern compliance
luma flow contact.json --patterns form

# 6. Get overall score
luma score contact.json
```

### Running Complete Pipeline (Same Run Folder)

**IMPORTANT**: Chain commands so they write to the same run folder.

Each LUMA command creates a new timestamped run folder. When commands are run separately, scoring fails because artifacts are scattered across different folders. To ensure all artifacts are in the same run folder, chain commands together.

**Windows PowerShell:**
```powershell
luma ingest contact.json; `
luma layout contact.json --viewports 320x640,768x1024; `
luma keyboard contact.json; `
luma flow contact.json --patterns form
```

**macOS/Linux:**
```bash
luma ingest contact.json && \
luma layout contact.json --viewports 320x640,768x1024 && \
luma keyboard contact.json && \
luma flow contact.json --patterns form
```

Then score the run:
```bash
luma score .ui/runs/<run-id>
```

**Why This Matters:**
- Each command creates a new run folder with a timestamp
- Scoring requires all artifacts (ingest.json, layout.json, keyboard.json, etc.) in the same folder
- Chaining ensures sequential execution in the same run

**Common Error:**
```
Error: .ui/runs/20251029-070139-805/keyboard.json not found
```
This means you ran commands separately. Re-run as a chained command.

---

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
  }
}
```

Then use `mcp__beads__*` functions instead of CLI commands.

### Important Rules

- ✅ Use bd for ALL task tracking
- ✅ Always use `--json` flag for programmatic use
- ✅ Link discovered work with `discovered-from` dependencies
- ✅ Check `bd ready` before asking "what should I work on?"
- ❌ Do NOT create markdown TODO lists
- ❌ Do NOT use external issue trackers
- ❌ Do NOT duplicate tracking systems

For more details, see README.md and QUICKSTART.md.