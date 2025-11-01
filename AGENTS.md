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
\n+---\n+\n+## Pattern Detection Checklist (Pre-Validation)
Identify ALL applicable UX patterns before running `luma flow` so you don't miss validation gaps. Use auto-suggestions (`luma patterns --suggest`) plus manual review.

### Decision Prompts
```
Form node present?            → Include Form.Basic
Table node present?           → Include Table.Simple
Show/Hide/Expand/Collapse?    → Add behaviors.disclosure hint OR include Progressive.Disclosure
Add/New/Create/Edit button(s)?→ Likely hidden form/dialog (Progressive.Disclosure)
Next/Previous/Finish buttons? → Include Guided.Flow (multi-step flow)
"Step X of N" text / stepper? → Include Guided.Flow (hasProgress)
Actions row at bottom of steps? → Guided.Flow step container pattern
Primary action near/below fold? → Check Guided.Flow GF-SHOULD-4 visibility
```

### Checklist
- [ ] Form nodes → `Form.Basic`
- [ ] Table nodes → `Table.Simple`
- [ ] Disclosure behaviors (show/hide/toggle/expand/collapse) → `behaviors.disclosure` hint or `Progressive.Disclosure`
- [ ] Add/New/Create/Edit implies hidden flow → consider `Progressive.Disclosure`
- [ ] Multi-step indicators (Next/Previous/Finish or `behaviors.guidedFlow`) → `Guided.Flow`
- [ ] Progress indicator ("Step 1 of 4" text, stepper bar) → `Guided.Flow` (tests GF-SHOULD-1)
- [ ] Long vertical content may push primary action below fold → check `Guided.Flow` (GF-SHOULD-4) and layout spacing
- [ ] Single primary per step (avoid multiple `roleHint:"primary"`) → satisfies GF-MUST-4
- [ ] Back precedes Next/Finish in action order → GF-SHOULD-2
- [ ] Step titles/headings present → GF-SHOULD-3

### Common Indicators Table
| Indicator | Pattern |
|-----------|---------|
| Form with fields[] + actions[] | Form.Basic |
| Table with columns[] | Table.Simple |
| Buttons: Show, Expand, Collapse | Progressive.Disclosure |
| Buttons: Add, New, Create, Edit | Progressive.Disclosure |
| Tabs / Accordions / Drawers | Progressive.Disclosure |
| Buttons: Next, Previous, Finish | Guided.Flow |
| Text: "Step 2 of 5" | Guided.Flow |
| Visible progress bar / stepper | Guided.Flow |
| Multiple stacked steps with actions rows | Guided.Flow |
| Primary button far below initial viewport | Guided.Flow (GF-SHOULD-4) + layout refinement |

### Why Primary Action Visibility Matters (GF-SHOULD-4)
If users must scroll just to advance or finish, completion rates drop. Keep the forward action in view at smallest viewport to reduce friction and maintain momentum.

### Quick Command Examples
```powershell
# Ask for suggestions first
luma patterns --suggest ui/screens/onboarding.mock.json --json

# Then validate all detected patterns
luma flow ui/screens/onboarding.mock.json --patterns Form.Basic,Table.Simple,Guided.Flow
```

> Skipping this checklist risks partial validation (e.g., Form.Basic passes while Guided.Flow violations remain hidden).