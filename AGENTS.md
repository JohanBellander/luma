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

### When to Use Pattern Generation vs Manual Creation

**Use `luma scaffold new` (Pattern) when:**
- Starting a new project
- Learning LUMA component schemas
- Building common UI patterns (forms, tables, lists)
- Need a valid starting point

**Write JSON manually when:**
- You understand component schemas well
- Building custom/unique layouts
- Combining multiple patterns
- Need fine-grained control over every property

**Recommended Workflow:**
1. Generate from pattern: `luma scaffold new --pattern form-basic --out form.json`
2. Customize the generated JSON for your needs
3. Validate iteratively with `luma ingest form.json`
4. Run full pipeline once structure is correct

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

## Complete Minimal Valid Scaffold Example

Before writing complex scaffolds, start with this minimal working example that passes all validation checks.

### Minimal Scaffold JSON

This example demonstrates:
- All required scaffold sections (`schemaVersion`, `screen`, `settings`)
- Correct component property names (`text` for Text/Button, not `label`)
- Valid spacing values (all in `spacingScale`)
- Proper touch targets (minSize for buttons)
- String format for breakpoints (`"WxH"`, not objects)

```json
{
  "schemaVersion": "1.0.0",
  "screen": {
    "id": "minimal-example",
    "title": "Minimal Example",
    "root": {
      "id": "root-stack",
      "type": "Stack",
      "direction": "vertical",
      "gap": 16,
      "padding": 24,
      "children": [
        {
          "id": "welcome-text",
          "type": "Text",
          "text": "Welcome to LUMA"
        },
        {
          "id": "description-text",
          "type": "Text",
          "text": "This is a minimal valid scaffold example"
        },
        {
          "id": "action-button",
          "type": "Button",
          "text": "Get Started",
          "roleHint": "primary",
          "minSize": {
            "w": 44,
            "h": 44
          }
        }
      ]
    }
  },
  "settings": {
    "spacingScale": [4, 8, 12, 16, 24, 32, 48],
    "minTouchTarget": {
      "w": 44,
      "h": 44
    },
    "breakpoints": ["320x640", "768x1024", "1280x800"]
  }
}
```

### Key Elements Explained

**schemaVersion**: Must be `"1.0.0"` (string, not number)

**screen.root**: The root node (usually a Stack or Grid container)
- `direction`: `"vertical"` or `"horizontal"`
- `gap`: Space between children (must be in `spacingScale`)
- `padding`: Inner padding (must be in `spacingScale`)
- `children`: Array of child nodes

**Text components**: Use `text` property (not `content` or `label`)

**Button components**:
- Use `text` property (not `label`)
- Use `roleHint` property (not `variant` or `role`)
- Set `minSize: {w: 44, h: 44}` to meet touch target requirements

**settings.spacingScale**: All `gap` and `padding` values must exist in this array

**settings.breakpoints**: String array format `"WxH"` (e.g., `"320x640"`), not objects

### Testing the Example

**1. Validate structure:**
```bash
luma ingest minimal-example.json
```

**2. Check layout at different viewports:**
```bash
luma layout minimal-example.json --viewports 320x640,768x1024
```

**3. Verify keyboard navigation:**
```bash
luma keyboard minimal-example.json
```

**Expected Results:**
- Ingest: PASSED, 0 issues
- Layout: 0 issues (no overflow, valid spacing)
- Keyboard: 1 focusable node (action-button), correct tab sequence

**Note on Flow/Patterns:** Flow analysis requires specific patterns (`Form.Basic`, `Table.Simple`). This minimal example doesn't use those patterns, so flow analysis is not applicable.

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

## Debugging Failed Validation

When LUMA commands fail, understanding the error output helps you fix issues quickly.

### If `luma ingest` Fails

**1. Check error details:**

On Windows PowerShell:
```powershell
Get-Content .ui/runs/<run-id>/ingest.json
```

On macOS/Linux:
```bash
cat .ui/runs/<run-id>/ingest.json
```

**2. Interpret `jsonPointer`:**

The `jsonPointer` field shows the exact location of the error in your scaffold JSON:

| jsonPointer | Meaning |
|-------------|---------|
| `/screen/root/children/3` | 4th child of root (0-indexed) |
| `/screen/root/children/0/text` | `text` property of first child |
| `/screen/root/children/1/fields/2` | 3rd field in form |
| `/screen/settings/spacingScale` | spacingScale array in settings |

**3. Common Error Types and Fixes:**

#### Invalid Union Errors

**Symptom:** `Invalid discriminated union. Could not find discriminator property "X"`

**Common Causes:**
- Wrong property name or type
- Text component: Using `content` or `label` instead of `text`
- Button component: Using `label` instead of `text`
- Button component: Using `variant` or `role` instead of `roleHint`
- Field component: Using `fieldType` or `type` instead of `inputType`

**Fix:** Use correct property names from component schema (see Component Schema Quick Reference above)

#### Required Property Missing

**Symptom:** `Required property missing: "X"`

**Common Causes and Fixes:**

| Component | Missing Property | Fix |
|-----------|-----------------|-----|
| Form | `states` | Add `"states": ["default"]` (must include "default") |
| Form | `fields` | Add at least 1 Field node in `fields` array |
| Form | `actions` | Add at least 1 Button node in `actions` array |
| Field | `label` | Add `"label": "Your Label"` (non-empty string) |
| Table | `title` | Add `"title": "Your Title"` (non-empty string) |
| Table | `columns` | Add string array like `["Name", "Email"]` |
| Table | `responsive` | Add `"responsive": {"strategy": "scroll"}` |

#### Invalid Type

**Symptom:** `Expected X, received Y`

**Common Causes:**

1. **Table columns as objects instead of strings:**
   - ❌ Wrong: `"columns": [{"key": "col1", "header": "Name"}]`
   - ✅ Correct: `"columns": ["Name", "Email", "Status"]`

2. **Spacing values not in spacingScale:**
   - ❌ Wrong: `"gap": 15` (if 15 not in spacingScale)
   - ✅ Correct: `"gap": 16` (use values from settings.spacingScale)

3. **Wrong enum value:**
   - ❌ Wrong: `"direction": "vert"` or `"Direction": "vertical"`
   - ✅ Correct: `"direction": "vertical"` (exact match, case-sensitive)

### If `luma score` is < 85

Score failures come from specific validation rules. Check individual artifact files to identify issues:

**Common Issues:**

| Issue | Artifact | Symptom | Fix |
|-------|----------|---------|-----|
| Spacing not in scale | `ingest.json` | Stack/Grid `gap` or `padding` value rejected | Use values from `settings.spacingScale` |
| Touch target too small | `layout.json` | Button/Field `< 44x44px` | Set `minSize: {w: 44, h: 44}` or increase padding |
| Wrong action order | `flow.json` | Form actions before fields | Move action buttons after fields in scaffold |
| Missing field label | `flow.json` | Field without label | Add `"label"` property (required, non-empty) |
| Tab order issues | `keyboard.json` | Unexpected tab sequence | Reorder nodes in scaffold JSON (tab follows document order) |

**Debugging Workflow:**

```powershell
# 1. Check which artifact has issues
Get-Content .ui/runs/<run-id>/score.json

# 2. Examine specific artifact
Get-Content .ui/runs/<run-id>/ingest.json
Get-Content .ui/runs/<run-id>/layout.json
Get-Content .ui/runs/<run-id>/keyboard.json
Get-Content .ui/runs/<run-id>/flow.json

# 3. Fix issues in scaffold JSON

# 4. Re-run full pipeline (chained for same run folder)
luma ingest your-scaffold.json; `
luma layout your-scaffold.json --viewports 320x640,768x1024; `
luma keyboard your-scaffold.json; `
luma flow your-scaffold.json --patterns form

# 5. Check new score
luma score .ui/runs/<new-run-id>
```

### If `luma keyboard` Shows Wrong Tab Order

**Understanding Tab Order:**

Tab order **always follows document order** in the scaffold JSON. You cannot override this with `tabIndex` alone.

**Fix Wrong Tab Order:**

1. Identify the desired tab sequence
2. Reorder nodes in your scaffold JSON to match that sequence
3. Run `luma keyboard` again to verify

**Example:**

❌ Wrong Order (Submit button tabbed before Email field):
```json
{
  "children": [
    {"id": "name-field", "type": "Field", "label": "Name"},
    {"id": "submit-btn", "type": "Button", "text": "Submit"},
    {"id": "email-field", "type": "Field", "label": "Email"}
  ]
}
```

✅ Correct Order (All fields before buttons):
```json
{
  "children": [
    {"id": "name-field", "type": "Field", "label": "Name"},
    {"id": "email-field", "type": "Field", "label": "Email"},
    {"id": "submit-btn", "type": "Button", "text": "Submit"}
  ]
}
```

### Pattern Validation Failures

**Symptom:** Pattern not found or validation fails unexpectedly

**Common Cause:** Pattern names are **case-sensitive** and must match exactly.

**Correct Pattern Names:**
- `Form.Basic` (not `form`, `form-basic`, or `FORM.BASIC`)
- `Table.Simple` (not `table`, `table-simple`, or `TABLE.SIMPLE`)
- `Form.MultiStep` (not `multi-step-form`)

**Check Available Patterns:**
```bash
luma patterns
```

**Fix:** Use exact pattern name from `luma patterns` output.

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