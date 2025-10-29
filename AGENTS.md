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

## Component Schema Quick Reference

Before writing scaffold JSON, learn valid component properties to avoid trial-and-error.

### Discovery Commands

```bash
luma explain --topic component-text --json
luma explain --topic component-button --json
luma explain --topic component-field --json
luma explain --topic component-form --json
luma explain --topic component-table --json
luma explain --topic component-stack --json
luma explain --topic component-grid --json
luma explain --topic component-box --json
```

### Common Property Mistakes

| Component | Correct | Wrong | Why |
|-----------|---------|-------|-----|
| Text | `text` | `content`, `label` | Property name mismatch |
| Button | `text` | `label` | Property name mismatch |
| Button | `roleHint` | `variant`, `role` | Property name mismatch |
| Field | `inputType` | `fieldType`, `type` | Property name mismatch |
| Field | `label` (required) | Missing label | Must be non-empty string |
| Table | `columns: ["Name", "Email"]` | `columns: [{key: "col1"}]` | Must be string array, not objects |
| Table | `title` (required) | Missing title | Must be non-empty string |
| Form | `fields: [...]` | Empty array | Must have at least 1 field |
| Form | `actions: [...]` | Empty array | Must have at least 1 action |
| Form | `states: ["default"]` | Missing states | Must include at least "default" |

### Complete Component Schemas

#### 1. Stack (Container - Vertical/Horizontal)

**Required Properties:**
- `id` (string): Unique identifier
- `type` (string): Must be `"Stack"`
- `direction` (string): `"vertical"` or `"horizontal"`
- `children` (array): Array of child nodes

**Optional Properties:**
- `gap` (number): Space between children (default: 0)
- `padding` (number): Inner padding (default: 0)
- `align` (string): `"start"`, `"center"`, `"end"`, `"stretch"` (default: `"start"`)
- `wrap` (boolean): Allow wrapping (default: false)
- `visible` (boolean): Visibility (default: true)
- `widthPolicy` (string): `"hug"`, `"fill"`, `"fixed"` (default: `"hug"`)
- `heightPolicy` (string): `"hug"`, `"fill"`, `"fixed"` (default: `"hug"`)
- `minSize` (object): `{w?: number, h?: number}`
- `maxSize` (object): `{w?: number, h?: number}`
- `at` (object): Responsive overrides

**Example:**
```json
{
  "id": "main-stack",
  "type": "Stack",
  "direction": "vertical",
  "gap": 16,
  "padding": 24,
  "align": "start",
  "children": [
    {
      "id": "title",
      "type": "Text",
      "text": "Welcome"
    }
  ]
}
```

#### 2. Grid (Container - Grid Layout)

**Required Properties:**
- `id` (string): Unique identifier
- `type` (string): Must be `"Grid"`
- `columns` (number): Number of columns (positive integer)
- `children` (array): Array of child nodes

**Optional Properties:**
- `gap` (number): Space between cells (default: 0)
- `minColWidth` (number): Minimum column width (triggers column reduction)
- `visible` (boolean): Visibility (default: true)
- `widthPolicy` (string): `"hug"`, `"fill"`, `"fixed"` (default: `"hug"`)
- `heightPolicy` (string): `"hug"`, `"fill"`, `"fixed"` (default: `"hug"`)
- `minSize` (object): `{w?: number, h?: number}`
- `maxSize` (object): `{w?: number, h?: number}`
- `at` (object): Responsive overrides

**Example:**
```json
{
  "id": "dashboard-grid",
  "type": "Grid",
  "columns": 3,
  "gap": 16,
  "minColWidth": 200,
  "children": [
    {
      "id": "card1",
      "type": "Box",
      "padding": 16,
      "child": {
        "id": "card1-text",
        "type": "Text",
        "text": "Card 1"
      }
    }
  ]
}
```

#### 3. Box (Container - Simple Wrapper)

**Required Properties:**
- `id` (string): Unique identifier
- `type` (string): Must be `"Box"`

**Optional Properties:**
- `padding` (number): Inner padding (default: 0)
- `child` (node): Single child node
- `visible` (boolean): Visibility (default: true)
- `widthPolicy` (string): `"hug"`, `"fill"`, `"fixed"` (default: `"hug"`)
- `heightPolicy` (string): `"hug"`, `"fill"`, `"fixed"` (default: `"hug"`)
- `minSize` (object): `{w?: number, h?: number}`
- `maxSize` (object): `{w?: number, h?: number}`
- `at` (object): Responsive overrides

**Example:**
```json
{
  "id": "card-wrapper",
  "type": "Box",
  "padding": 24,
  "child": {
    "id": "card-title",
    "type": "Text",
    "text": "Card Title"
  }
}
```

#### 4. Text (Display Text Content)

**Required Properties:**
- `id` (string): Unique identifier
- `type` (string): Must be `"Text"`
- `text` (string): Content to display

**Optional Properties:**
- `fontSize` (number): Font size in pixels (default: 16)
- `maxLines` (number): Maximum number of lines (enables truncation)
- `intrinsicTextWidth` (number): Hint for layout calculation
- `visible` (boolean): Visibility (default: true)
- `widthPolicy` (string): `"hug"`, `"fill"`, `"fixed"` (default: `"hug"`)
- `heightPolicy` (string): `"hug"`, `"fill"`, `"fixed"` (default: `"hug"`)
- `minSize` (object): `{w?: number, h?: number}`
- `maxSize` (object): `{w?: number, h?: number}`
- `at` (object): Responsive overrides

**Common Mistakes:**
- ❌ Using `content` instead of `text`
- ❌ Using `label` instead of `text`
- ❌ Using unsupported properties like `fontWeight`, `color`, `align`

**Example:**
```json
{
  "id": "welcome-text",
  "type": "Text",
  "text": "Welcome to LUMA",
  "fontSize": 24
}
```

#### 5. Button (Interactive Button)

**Required Properties:**
- `id` (string): Unique identifier
- `type` (string): Must be `"Button"`

**Optional Properties:**
- `text` (string): Button label
- `roleHint` (string): `"primary"`, `"secondary"`, `"danger"`, `"link"`
- `focusable` (boolean): Can receive focus (default: true)
- `tabIndex` (number): Tab order override
- `visible` (boolean): Visibility (default: true)
- `widthPolicy` (string): `"hug"`, `"fill"`, `"fixed"` (default: `"hug"`)
- `heightPolicy` (string): `"hug"`, `"fill"`, `"fixed"` (default: `"hug"`)
- `minSize` (object): `{w?: number, h?: number}`
- `maxSize` (object): `{w?: number, h?: number}`
- `at` (object): Responsive overrides

**Common Mistakes:**
- ❌ Using `label` instead of `text`
- ❌ Using `variant` instead of `roleHint`
- ❌ Using `role` instead of `roleHint`

**Example:**
```json
{
  "id": "submit-btn",
  "type": "Button",
  "text": "Submit",
  "roleHint": "primary"
}
```

#### 6. Field (Form Input Field)

**Required Properties:**
- `id` (string): Unique identifier
- `type` (string): Must be `"Field"`
- `label` (string): Field label (non-empty)

**Optional Properties:**
- `inputType` (string): `"text"`, `"email"`, `"password"`, `"number"`, `"date"`
- `required` (boolean): Field is required
- `helpText` (string): Help text below field
- `errorText` (string): Error message text
- `focusable` (boolean): Can receive focus (default: true)
- `visible` (boolean): Visibility (default: true)
- `widthPolicy` (string): `"hug"`, `"fill"`, `"fixed"` (default: `"hug"`)
- `heightPolicy` (string): `"hug"`, `"fill"`, `"fixed"` (default: `"hug"`)
- `minSize` (object): `{w?: number, h?: number}`
- `maxSize` (object): `{w?: number, h?: number}`
- `at` (object): Responsive overrides

**Common Mistakes:**
- ❌ Using `fieldType` instead of `inputType`
- ❌ Missing `label` (required and must be non-empty)
- ❌ Using empty string for `label`

**Example:**
```json
{
  "id": "email-field",
  "type": "Field",
  "label": "Email Address",
  "inputType": "email",
  "required": true,
  "helpText": "We'll never share your email"
}
```

#### 7. Form (Complete Form)

**Required Properties:**
- `id` (string): Unique identifier
- `type` (string): Must be `"Form"`
- `fields` (array): Array of Field nodes (min 1)
- `actions` (array): Array of Button nodes (min 1)
- `states` (array): Array of state names (must include `"default"`)

**Optional Properties:**
- `title` (string): Form title
- `visible` (boolean): Visibility (default: true)
- `widthPolicy` (string): `"hug"`, `"fill"`, `"fixed"` (default: `"hug"`)
- `heightPolicy` (string): `"hug"`, `"fill"`, `"fixed"` (default: `"hug"`)
- `minSize` (object): `{w?: number, h?: number}`
- `maxSize` (object): `{w?: number, h?: number}`
- `at` (object): Responsive overrides

**Common Mistakes:**
- ❌ Empty `fields` array (must have at least 1)
- ❌ Empty `actions` array (must have at least 1)
- ❌ Missing `states` or not including `"default"`

**Example:**
```json
{
  "id": "contact-form",
  "type": "Form",
  "title": "Contact Us",
  "fields": [
    {
      "id": "name-field",
      "type": "Field",
      "label": "Name",
      "required": true
    },
    {
      "id": "email-field",
      "type": "Field",
      "label": "Email",
      "inputType": "email",
      "required": true
    }
  ],
  "actions": [
    {
      "id": "submit-btn",
      "type": "Button",
      "text": "Submit",
      "roleHint": "primary"
    },
    {
      "id": "cancel-btn",
      "type": "Button",
      "text": "Cancel",
      "roleHint": "secondary"
    }
  ],
  "states": ["default", "submitting", "error"]
}
```

#### 8. Table (Data Table)

**Required Properties:**
- `id` (string): Unique identifier
- `type` (string): Must be `"Table"`
- `title` (string): Table title (non-empty)
- `columns` (array): Array of column names as strings (min 1)
- `responsive` (object): `{strategy: "wrap"|"scroll"|"cards", minColumnWidth?: number}`

**Optional Properties:**
- `rows` (number): Number of rows (for layout calculation)
- `states` (array): Array of state names
- `visible` (boolean): Visibility (default: true)
- `widthPolicy` (string): `"hug"`, `"fill"`, `"fixed"` (default: `"hug"`)
- `heightPolicy` (string): `"hug"`, `"fill"`, `"fixed"` (default: `"hug"`)
- `minSize` (object): `{w?: number, h?: number}`
- `maxSize` (object): `{w?: number, h?: number}`
- `at` (object): Responsive overrides

**Common Mistakes:**
- ❌ Using objects for columns: `[{key: "col1", header: "Name"}]`
- ✅ Correct: Use strings: `["Name", "Email", "Status"]`
- ❌ Missing `title` (required and must be non-empty)
- ❌ Missing `responsive.strategy`

**Example:**
```json
{
  "id": "users-table",
  "type": "Table",
  "title": "User List",
  "columns": ["Name", "Email", "Role", "Status"],
  "rows": 10,
  "responsive": {
    "strategy": "scroll",
    "minColumnWidth": 120
  },
  "states": ["default", "loading"]
}
```

### Base Node Properties (Common to All)

All node types inherit these optional properties:

- `visible` (boolean): Whether node is visible (default: true)
- `widthPolicy` (string): `"hug"`, `"fill"`, `"fixed"` (default: `"hug"`)
- `heightPolicy` (string): `"hug"`, `"fill"`, `"fixed"` (default: `"hug"`)
- `minSize` (object): `{w?: number, h?: number}` - Minimum dimensions
- `maxSize` (object): `{w?: number, h?: number}` - Maximum dimensions
- `at` (object): Responsive overrides (e.g., `{">=768": {...}}`)

### Validation Tips

1. **Check property names carefully** - Most errors come from wrong property names
2. **String arrays not objects** - Table columns must be strings, not objects
3. **Required fields** - Field.label, Table.title, Form.fields/actions/states
4. **Non-empty requirements** - Some strings cannot be empty (label, title)
5. **Use exact enum values** - `"primary"` not `"Primary"`, `"vertical"` not `"vert"`

### Quick Validation Test

After writing scaffold JSON:
```bash
luma ingest your-scaffold.json
```

Check `.ui/runs/<run-id>/ingest.json` for detailed error messages with `jsonPointer` locations.

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