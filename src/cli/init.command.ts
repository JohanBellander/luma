import {Command} from 'commander';
import * as fs from 'fs';
import * as path from 'path';

const agentsContent = `# Agent Instructions

## Preflight: Before You Generate Scaffolds

**IMPORTANT**: Before generating any LUMA scaffold JSON, consult the **Scaffold Contract**.

### What is the Scaffold Contract?

The Scaffold Contract defines exact rules AI agents must follow when generating scaffold JSON files. It ensures all generated scaffolds:
- Have valid structure (\`schemaVersion\`, \`screen.id\`, \`screen.root\`)
- Use correct node types with required fields
- Follow spacing and layout conventions
- Pass \`luma ingest\` validation

### Accessing the Contract

**Option 1: Command-line**
\`\`\`bash
luma explain --topic scaffold-contract --json
\`\`\`

**Option 2: Reference file**
See \`AGENT-RULES-SCAFFOLD.md\` in the repository root.

### Key Contract Rules

- ✅ \`schemaVersion\` must be \`"1.0.0"\`
- ✅ All node IDs must be unique
- ✅ All spacing values (gap, padding) must be in \`settings.spacingScale\`
- ✅ Forms must have both \`fields[]\` and \`actions[]\` arrays (non-empty)
- ✅ Tables must have \`title\`, \`columns[]\`, and \`responsive.strategy\`
- ✅ Output pure JSON (no comments, no markdown wrappers)

### Generating Scaffolds with \`scaffold new\`

**RECOMMENDED**: Use \`luma scaffold new\` to generate valid scaffolds from built-in patterns.

\`\`\`bash
# Create a todo-list scaffold
luma scaffold new --pattern todo-list --out todo.json

# Create a login form
luma scaffold new --pattern login-form --out login.json --title "Sign In"

# Custom breakpoints
luma scaffold new --pattern dashboard-grid --out dashboard.json --breakpoints "375x667,1920x1080"

# Overwrite existing file
luma scaffold new --pattern form-basic --out form.json --force
\`\`\`

**Available patterns:**
- \`todo-list\` - Table + Add Button
- \`empty-screen\` - Minimal starting point
- \`form-basic\` - Simple form with 2 fields
- \`table-simple\` - Basic data table
- \`contact-form\` - Contact form with validation
- \`data-table-with-actions\` - Table with row actions
- \`modal-dialog\` - Dialog with actions
- \`login-form\` - Email + password login
- \`multi-step-form\` - Multi-page form flow
- \`dashboard-grid\` - Dashboard with cards

### When to Use Pattern Generation vs Manual Creation

**Use \`luma scaffold new\` (Pattern) when:**
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
1. Generate from pattern: \`luma scaffold new --pattern form-basic --out form.json\`
2. Customize the generated JSON for your needs
3. Validate iteratively with \`luma ingest form.json\`
4. Run full pipeline once structure is correct

---

## Complete Minimal Valid Scaffold Example

Before writing complex scaffolds, start with this minimal working example that passes all validation checks.

### Minimal Scaffold JSON

This example demonstrates:
- All required scaffold sections (\`schemaVersion\`, \`screen\`, \`settings\`)
- Correct component property names (\`text\` for Text/Button, not \`label\`)
- Valid spacing values (all in \`spacingScale\`)
- Proper touch targets (minSize for buttons)
- String format for breakpoints (\`"WxH"\`, not objects)

\`\`\`json
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
\`\`\`

### Key Elements Explained

**schemaVersion**: Must be \`"1.0.0"\` (string, not number)

**screen.root**: The root node (usually a Stack or Grid container)
- \`direction\`: \`"vertical"\` or \`"horizontal"\`
- \`gap\`: Space between children (must be in \`spacingScale\`)
- \`padding\`: Inner padding (must be in \`spacingScale\`)
- \`children\`: Array of child nodes

**Text components**: Use \`text\` property (not \`content\` or \`label\`)

**Button components**:
- Use \`text\` property (not \`label\`)
- Use \`roleHint\` property (not \`variant\` or \`role\`)
- Set \`minSize: {w: 44, h: 44}\` to meet touch target requirements

**settings.spacingScale**: All \`gap\` and \`padding\` values must exist in this array

**settings.breakpoints**: String array format \`"WxH"\` (e.g., \`"320x640"\`), not objects

### Testing the Example

**1. Validate structure:**
\`\`\`bash
luma ingest minimal-example.json
\`\`\`

**2. Check layout at different viewports:**
\`\`\`bash
luma layout minimal-example.json --viewports 320x640,768x1024
\`\`\`

**3. Verify keyboard navigation:**
\`\`\`bash
luma keyboard minimal-example.json
\`\`\`

**Expected Results:**
- Ingest: PASSED, 0 issues
- Layout: 0 issues (no overflow, valid spacing)
- Keyboard: 1 focusable node (action-button), correct tab sequence

**Note on Flow/Patterns:** Flow analysis requires specific patterns (\`Form.Basic\`, \`Table.Simple\`). This minimal example doesn't use those patterns, so flow analysis is not applicable.

---

## Component Schema Quick Reference

Before writing scaffold JSON, learn valid component properties to avoid trial-and-error.

### Discovery Commands

\`\`\`bash
luma explain --topic component-text --json
luma explain --topic component-button --json
luma explain --topic component-field --json
luma explain --topic component-form --json
luma explain --topic component-table --json
luma explain --topic component-stack --json
luma explain --topic component-grid --json
luma explain --topic component-box --json
\`\`\`

### Common Property Mistakes

| Component | Correct | Wrong | Why |
|-----------|---------|-------|-----|
| Text | \`text\` | \`content\`, \`label\` | Property name mismatch |
| Button | \`text\` | \`label\` | Property name mismatch |
| Button | \`roleHint\` | \`variant\`, \`role\` | Property name mismatch |
| Field | \`inputType\` | \`fieldType\`, \`type\` | Property name mismatch |
| Field | \`label\` (required) | Missing label | Must be non-empty string |
| Table | \`columns: ["Name", "Email"]\` | \`columns: [{key: "col1"}]\` | Must be string array, not objects |
| Table | \`title\` (required) | Missing title | Must be non-empty string |
| Form | \`fields: [...]\` | Empty array | Must have at least 1 field |
| Form | \`actions: [...]\` | Empty array | Must have at least 1 action |
| Form | \`states: ["default"]\` | Missing states | Must include at least "default" |

### Complete Component Schemas

#### 1. Stack (Container - Vertical/Horizontal)

**Required Properties:**
- \`id\` (string): Unique identifier
- \`type\` (string): Must be \`"Stack"\`
- \`direction\` (string): \`"vertical"\` or \`"horizontal"\`
- \`children\` (array): Array of child nodes

**Optional Properties:**
- \`gap\` (number): Space between children (default: 0)
- \`padding\` (number): Inner padding (default: 0)
- \`align\` (string): \`"start"\`, \`"center"\`, \`"end"\`, \`"stretch"\` (default: \`"start"\`)
- \`wrap\` (boolean): Allow wrapping (default: false)
- \`visible\` (boolean): Visibility (default: true)
- \`widthPolicy\` (string): \`"hug"\`, \`"fill"\`, \`"fixed"\` (default: \`"hug"\`)
- \`heightPolicy\` (string): \`"hug"\`, \`"fill"\`, \`"fixed"\` (default: \`"hug"\`)
- \`minSize\` (object): \`{w?: number, h?: number}\`
- \`maxSize\` (object): \`{w?: number, h?: number}\`
- \`at\` (object): Responsive overrides

**Example:**
\`\`\`json
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
\`\`\`

#### 2. Grid (Container - Grid Layout)

**Required Properties:**
- \`id\` (string): Unique identifier
- \`type\` (string): Must be \`"Grid"\`
- \`columns\` (number): Number of columns (positive integer)
- \`children\` (array): Array of child nodes

**Optional Properties:**
- \`gap\` (number): Space between cells (default: 0)
- \`minColWidth\` (number): Minimum column width (triggers column reduction)
- \`visible\` (boolean): Visibility (default: true)
- \`widthPolicy\` (string): \`"hug"\`, \`"fill"\`, \`"fixed"\` (default: \`"hug"\`)
- \`heightPolicy\` (string): \`"hug"\`, \`"fill"\`, \`"fixed"\` (default: \`"hug"\`)
- \`minSize\` (object): \`{w?: number, h?: number}\`
- \`maxSize\` (object): \`{w?: number, h?: number}\`
- \`at\` (object): Responsive overrides

**Example:**
\`\`\`json
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
\`\`\`

#### 3. Box (Container - Simple Wrapper)

**Required Properties:**
- \`id\` (string): Unique identifier
- \`type\` (string): Must be \`"Box"\`

**Optional Properties:**
- \`padding\` (number): Inner padding (default: 0)
- \`child\` (node): Single child node
- \`visible\` (boolean): Visibility (default: true)
- \`widthPolicy\` (string): \`"hug"\`, \`"fill"\`, \`"fixed"\` (default: \`"hug"\`)
- \`heightPolicy\` (string): \`"hug"\`, \`"fill"\`, \`"fixed"\` (default: \`"hug"\`)
- \`minSize\` (object): \`{w?: number, h?: number}\`
- \`maxSize\` (object): \`{w?: number, h?: number}\`
- \`at\` (object): Responsive overrides

**Example:**
\`\`\`json
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
\`\`\`

#### 4. Text (Display Text Content)

**Required Properties:**
- \`id\` (string): Unique identifier
- \`type\` (string): Must be \`"Text"\`
- \`text\` (string): Content to display

**Optional Properties:**
- \`fontSize\` (number): Font size in pixels (default: 16)
- \`maxLines\` (number): Maximum number of lines (enables truncation)
- \`intrinsicTextWidth\` (number): Hint for layout calculation
- \`visible\` (boolean): Visibility (default: true)
- \`widthPolicy\` (string): \`"hug"\`, \`"fill"\`, \`"fixed"\` (default: \`"hug"\`)
- \`heightPolicy\` (string): \`"hug"\`, \`"fill"\`, \`"fixed"\` (default: \`"hug"\`)
- \`minSize\` (object): \`{w?: number, h?: number}\`
- \`maxSize\` (object): \`{w?: number, h?: number}\`
- \`at\` (object): Responsive overrides

**Common Mistakes:**
- ❌ Using \`content\` instead of \`text\`
- ❌ Using \`label\` instead of \`text\`
- ❌ Using unsupported properties like \`fontWeight\`, \`color\`, \`align\`

**Example:**
\`\`\`json
{
  "id": "welcome-text",
  "type": "Text",
  "text": "Welcome to LUMA",
  "fontSize": 24
}
\`\`\`

#### 5. Button (Interactive Button)

**Required Properties:**
- \`id\` (string): Unique identifier
- \`type\` (string): Must be \`"Button"\`

**Optional Properties:**
- \`text\` (string): Button label
- \`roleHint\` (string): \`"primary"\`, \`"secondary"\`, \`"danger"\`, \`"link"\`
- \`focusable\` (boolean): Can receive focus (default: true)
- \`tabIndex\` (number): Tab order override
- \`visible\` (boolean): Visibility (default: true)
- \`widthPolicy\` (string): \`"hug"\`, \`"fill"\`, \`"fixed"\` (default: \`"hug"\`)
- \`heightPolicy\` (string): \`"hug"\`, \`"fill"\`, \`"fixed"\` (default: \`"hug"\`)
- \`minSize\` (object): \`{w?: number, h?: number}\`
- \`maxSize\` (object): \`{w?: number, h?: number}\`
- \`at\` (object): Responsive overrides

**Common Mistakes:**
- ❌ Using \`label\` instead of \`text\`
- ❌ Using \`variant\` instead of \`roleHint\`
- ❌ Using \`role\` instead of \`roleHint\`

**Example:**
\`\`\`json
{
  "id": "submit-btn",
  "type": "Button",
  "text": "Submit",
  "roleHint": "primary"
}
\`\`\`

#### 6. Field (Form Input Field)

**Required Properties:**
- \`id\` (string): Unique identifier
- \`type\` (string): Must be \`"Field"\`
- \`label\` (string): Field label (non-empty)

**Optional Properties:**
- \`inputType\` (string): \`"text"\`, \`"email"\`, \`"password"\`, \`"number"\`, \`"date"\`
- \`required\` (boolean): Field is required
- \`helpText\` (string): Help text below field
- \`errorText\` (string): Error message text
- \`focusable\` (boolean): Can receive focus (default: true)
- \`visible\` (boolean): Visibility (default: true)
- \`widthPolicy\` (string): \`"hug"\`, \`"fill"\`, \`"fixed"\` (default: \`"hug"\`)
- \`heightPolicy\` (string): \`"hug"\`, \`"fill"\`, \`"fixed"\` (default: \`"hug"\`)
- \`minSize\` (object): \`{w?: number, h?: number}\`
- \`maxSize\` (object): \`{w?: number, h?: number}\`
- \`at\` (object): Responsive overrides

**Common Mistakes:**
- ❌ Using \`fieldType\` instead of \`inputType\`
- ❌ Missing \`label\` (required and must be non-empty)
- ❌ Using empty string for \`label\`

**Example:**
\`\`\`json
{
  "id": "email-field",
  "type": "Field",
  "label": "Email Address",
  "inputType": "email",
  "required": true,
  "helpText": "We'll never share your email"
}
\`\`\`

#### 7. Form (Complete Form)

**Required Properties:**
- \`id\` (string): Unique identifier
- \`type\` (string): Must be \`"Form"\`
- \`fields\` (array): Array of Field nodes (min 1)
- \`actions\` (array): Array of Button nodes (min 1)
- \`states\` (array): Array of state names (must include \`"default"\`)

**Optional Properties:**
- \`title\` (string): Form title
- \`visible\` (boolean): Visibility (default: true)
- \`widthPolicy\` (string): \`"hug"\`, \`"fill"\`, \`"fixed"\` (default: \`"hug"\`)
- \`heightPolicy\` (string): \`"hug"\`, \`"fill"\`, \`"fixed"\` (default: \`"hug"\`)
- \`minSize\` (object): \`{w?: number, h?: number}\`
- \`maxSize\` (object): \`{w?: number, h?: number}\`
- \`at\` (object): Responsive overrides

**Common Mistakes:**
- ❌ Empty \`fields\` array (must have at least 1)
- ❌ Empty \`actions\` array (must have at least 1)
- ❌ Missing \`states\` or not including \`"default"\`

**Example:**
\`\`\`json
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
\`\`\`

#### 8. Table (Data Table)

**Required Properties:**
- \`id\` (string): Unique identifier
- \`type\` (string): Must be \`"Table"\`
- \`title\` (string): Table title (non-empty)
- \`columns\` (array): Array of column names as strings (min 1)
- \`responsive\` (object): \`{strategy: "wrap"|"scroll"|"cards", minColumnWidth?: number}\`

**Optional Properties:**
- \`rows\` (number): Number of rows (for layout calculation)
- \`states\` (array): Array of state names
- \`visible\` (boolean): Visibility (default: true)
- \`widthPolicy\` (string): \`"hug"\`, \`"fill"\`, \`"fixed"\` (default: \`"hug"\`)
- \`heightPolicy\` (string): \`"hug"\`, \`"fill"\`, \`"fixed"\` (default: \`"hug"\`)
- \`minSize\` (object): \`{w?: number, h?: number}\`
- \`maxSize\` (object): \`{w?: number, h?: number}\`
- \`at\` (object): Responsive overrides

**Common Mistakes:**
- ❌ Using objects for columns: \`[{key: "col1", header: "Name"}]\`
- ✅ Correct: Use strings: \`["Name", "Email", "Status"]\`
- ❌ Missing \`title\` (required and must be non-empty)
- ❌ Missing \`responsive.strategy\`

**Example:**
\`\`\`json
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
\`\`\`

### Base Node Properties (Common to All)

All node types inherit these optional properties:

- \`visible\` (boolean): Whether node is visible (default: true)
- \`widthPolicy\` (string): \`"hug"\`, \`"fill"\`, \`"fixed"\` (default: \`"hug"\`)
- \`heightPolicy\` (string): \`"hug"\`, \`"fill"\`, \`"fixed"\` (default: \`"hug"\`)
- \`minSize\` (object): \`{w?: number, h?: number}\` - Minimum dimensions
- \`maxSize\` (object): \`{w?: number, h?: number}\` - Maximum dimensions
- \`at\` (object): Responsive overrides (e.g., \`{">=768": {...}}\`)
- \`behaviors\` (object): Interactive behavior hints
  - \`disclosure\` (object): Progressive disclosure settings
    - \`collapsible\` (boolean): Whether content can be collapsed/expanded
    - \`defaultState\` (string): Initial state (\`"open"\` or \`"closed"\`)
    - \`controlsId\` (string): ID of the node being shown/hidden
- \`affordances\` (array): Array of strings indicating interaction hints (e.g., \`["expandable"]\`, \`["collapsible"]\`)

### Validation Tips

1. **Check property names carefully** - Most errors come from wrong property names
2. **String arrays not objects** - Table columns must be strings, not objects
3. **Required fields** - Field.label, Table.title, Form.fields/actions/states
4. **Non-empty requirements** - Some strings cannot be empty (label, title)
5. **Use exact enum values** - \`"primary"\` not \`"Primary"\`, \`"vertical"\` not \`"vert"\`

### Quick Validation Test

After writing scaffold JSON:
\`\`\`bash
luma ingest your-scaffold.json
\`\`\`

Check \`.ui/runs/<run-id>/ingest.json\` for detailed error messages with \`jsonPointer\` locations.

---

## Progressive Disclosure Pattern (v1.1)

Progressive Disclosure reduces cognitive overload by showing secondary/advanced content only when needed. This pattern is automatically detected when you use \`behaviors.disclosure\` hints in your scaffold.

### When to Use Progressive Disclosure

Use this pattern when:
- You have advanced/optional settings that would overwhelm novice users
- Secondary information can be hidden until explicitly requested
- Users have different expertise levels (show basics first, allow experts to expand)

**Examples:**
- "Advanced search options" in a search form
- "More details" section in a data table
- "Show/Hide filters" in a dashboard

### Approach A: Schema Hints with \`behaviors.disclosure\` (Recommended)

Add \`behaviors.disclosure\` to any collapsible container. The pattern validator **automatically activates** when it detects these hints.

**Example:**
\`\`\`json
{
  "id": "root-stack",
  "type": "Stack",
  "direction": "vertical",
  "gap": 16,
  "children": [
    {
      "id": "basic-fields",
      "type": "Stack",
      "direction": "vertical",
      "gap": 12,
      "children": [
        {"id": "name-field", "type": "Field", "label": "Name"},
        {"id": "email-field", "type": "Field", "label": "Email"}
      ]
    },
    {
      "id": "toggle-advanced",
      "type": "Button",
      "text": "Show Advanced Options",
      "roleHint": "secondary"
    },
    {
      "id": "advanced-section",
      "type": "Stack",
      "direction": "vertical",
      "gap": 12,
      "behaviors": {
        "disclosure": {
          "collapsible": true,
          "defaultState": "collapsed",
          "controlsId": "toggle-advanced"
        }
      },
      "children": [
        {"id": "phone-field", "type": "Field", "label": "Phone"},
        {"id": "company-field", "type": "Field", "label": "Company"}
      ]
    }
  ]
}
\`\`\`

**Schema Properties:**
- \`behaviors.disclosure.collapsible\` (boolean): Marks section as collapsible
- \`behaviors.disclosure.defaultState\` (string): \`"collapsed"\` or \`"expanded"\`
- \`behaviors.disclosure.controlsId\` (string): ID of the Button that toggles this section
- \`affordances\` (array): Optional UI hints like \`["chevron"]\` or \`["details"]\`

### Approach B: Manual Pattern Flag

If you don't use schema hints, explicitly request validation:

\`\`\`bash
luma flow scaffold.json --patterns progressive-disclosure
\`\`\`

However, this requires the validator to **infer** controls and sections from button text patterns (\`"Show"\`, \`"Hide"\`, \`"Expand"\`, \`"Advanced"\`, \`"More"\`). **Prefer Approach A** for explicit control.

### Pattern Rules (MUST and SHOULD)

**MUST Rules (Violations fail validation):**

1. **Collapsible container has an associated control** (\`disclosure-no-control\`)
   - Every collapsible section must have a visible Button referenced by \`controlsId\`
   - If \`controlsId\` is omitted, validator attempts proximity inference from button text

2. **Primary action is not hidden by default** (\`disclosure-hides-primary\`)
   - If a section with \`defaultState: "collapsed"\` contains a \`Button\` with \`roleHint: "primary"\`, either:
     - Move the primary button outside the collapsible section, OR
     - Set \`defaultState: "expanded"\`

3. **Label/summary present** (\`disclosure-missing-label\`)
   - Must have a labeling element: sibling Text, summary Text within section, or control Button text (≥ 2 characters)

**SHOULD Rules (Violations produce warnings):**

1. **Control placement proximity** (\`disclosure-control-far\`)
   - Control should be adjacent (preceding sibling or header within section)

2. **Consistent affordance** (\`disclosure-inconsistent-affordance\`)
   - Multiple collapsibles should use consistent affordances (e.g., all use \`["chevron"]\`)

3. **Collapsible sections follow primary content** (\`disclosure-early-section\`)
   - Show essential content first; collapsibles should appear after core fields/actions

### Testing Progressive Disclosure

When you include \`behaviors.disclosure\` hints, the pattern automatically activates during \`luma flow\`:

\`\`\`bash
# Run full pipeline (includes progressive-disclosure validation)
luma flow scaffold.json

# Check flow.json for pattern results
Get-Content .ui/runs/<run-id>/flow.json
\`\`\`

No need to manually specify \`--patterns progressive-disclosure\` when using schema hints.

---

## Design & Development Workflow (Follow Exactly)

### 1. Start with a UI Goal

Identify the screen you need to design. Examples:
- Data table with filtering
- Multi-step form
- Dashboard with widgets
- Login/authentication screen
- Settings panel

Do **not** write code yet — only define the UI structure as a **scaffold**.

---

### 2. Produce a Scaffold

**Option A: Generate from pattern (Recommended)**
\`\`\`bash
luma scaffold new --pattern <pattern-name> --out ui/screens/<screen>.mock.json
\`\`\`

**Option B: Write JSON manually**
Create a file in \`ui/screens/<screen>.mock.json\` using **Component Scaffold JSON** format (Stacks, Forms, Fields, Tables, Buttons, etc.).

Store scaffolds in a dedicated folder like:
- \`ui/screens/\`
- \`design/scaffolds/\`
- \`mockups/\`

**FUNCTIONAL COMPLETENESS CHECK:**

Before finalizing your scaffold, verify EVERY interactive element has a complete workflow:

- [ ] Every Button has a defined action target (Form, another screen, etc.)
- [ ] Every Form has defined fields and submission behavior
- [ ] No "dead-end" interactions (buttons that lead nowhere)

**Common Incomplete Patterns to Avoid:**
- ❌ Button without target: "Add Contact" button with no form definition
- ❌ Form without submission: Contact form with no save workflow
- ✅ Complete workflow: Button → opens Form → Form has fields and actions

**If ANY interactive element lacks a target or workflow → Add missing components to scaffold**

---

### 2a. Pattern Detection Checklist (Before Validation)

Before running LUMA validation, identify which patterns your scaffold contains. This ensures you test ALL relevant patterns, not just the obvious ones.

**Decision Tree:**

\`\`\`
Does your scaffold have a Form node?
  → YES: Include Form.Basic in --patterns

Does your scaffold have a Table node?
  → YES: Include Table.Simple in --patterns

Does your scaffold have show/hide/toggle/expand/collapse behavior?
  → YES: Add "behaviors": {"disclosure": true} to schema hints
        OR include Progressive.Disclosure in --patterns

Does your scaffold have Add/New/Create/Edit buttons?
  → LIKELY: You may have hidden forms/dialogs
        → Add "behaviors": {"disclosure": true} to schema hints
\`\`\`

**Pattern Detection Checklist:**

- [ ] I checked for Form nodes → Added \`Form.Basic\` to --patterns
- [ ] I checked for Table nodes → Added \`Table.Simple\` to --patterns
- [ ] I checked for show/hide/toggle UI → Added \`behaviors.disclosure\` hint
- [ ] I checked for Add/New/Create/Edit buttons → Considered \`behaviors.disclosure\` hint
- [ ] I reviewed all Button text for action words → Verified no missing disclosure patterns

**Common Pattern Indicators:**

| If You See... | Pattern to Test |
|---------------|-----------------|
| Form node with fields[] and actions[] | \`Form.Basic\` |
| Table node with columns[] | \`Table.Simple\` |
| "Show Details", "Expand", "Collapse" buttons | \`behaviors.disclosure\` hint |
| "Add", "New", "Create", "Edit" buttons | \`behaviors.disclosure\` hint (likely hidden form) |
| Modal/Dialog references in button text | \`behaviors.disclosure\` hint |
| Tabs, Accordions, Drawers | \`behaviors.disclosure\` hint |

⚠️ **Warning**: If you skip pattern detection, LUMA will only validate structure, NOT user experience patterns. You may miss critical UX violations.

---

### 3. Validate with LUMA

#### STEP 1: Identify Patterns (MANDATORY)

Before running validation, identify which patterns to test using the \`--patterns\` flag in the flow command.

**Examples:**
- Form with fields and actions → Test \`form\` pattern
- Table with columns → Test \`table\` pattern
- Show/hide or toggle buttons → Add \`behaviors.disclosure\` hint to scaffold

**Quick Pattern Detection:**
\`\`\`bash
# If your scaffold has a Form node
luma flow ui/screens/<screen>.mock.json --patterns form

# If your scaffold has a Table node
luma flow ui/screens/<screen>.mock.json --patterns table

# If you have both
luma flow ui/screens/<screen>.mock.json --patterns form,table
\`\`\`

**Auto-Activation Note:** If you add a \`behaviors.disclosure\` hint to any node in your scaffold, LUMA automatically activates \`Progressive.Disclosure\` pattern validation. You don't need to manually specify it in \`--patterns\`.

⚠️ **Warning**: Skipping pattern identification means LUMA only validates structure, NOT user experience patterns. You will miss critical UX violations.

---

#### STEP 2: Run Full Pipeline

Run all LUMA commands in sequence:

**IMPORTANT**: Chain commands so they write to the same run folder.

**Windows PowerShell:**
\`\`\`powershell
luma ingest ui/screens/<screen>.mock.json; \`
luma layout ui/screens/<screen>.mock.json --viewports 320x640,768x1024; \`
luma keyboard ui/screens/<screen>.mock.json; \`
luma flow ui/screens/<screen>.mock.json --patterns form,table
\`\`\`

**macOS/Linux:**
\`\`\`bash
luma ingest ui/screens/<screen>.mock.json && \\
luma layout ui/screens/<screen>.mock.json --viewports 320x640,768x1024 && \\
luma keyboard ui/screens/<screen>.mock.json && \\
luma flow ui/screens/<screen>.mock.json --patterns form,table
\`\`\`

**Why Chaining Matters:**
- Each command creates a new run folder with a timestamp
- Scoring requires all artifacts (ingest.json, layout.json, keyboard.json, flow.json) in the same folder
- Chaining ensures sequential execution in the same run

**Common Error:**
\`\`\`
Error: .ui/runs/20251029-070139-805/keyboard.json not found
\`\`\`
This means you ran commands separately. Re-run as a chained command.

---

#### STEP 3: Score the Run

After running the full pipeline, score the results:

\`\`\`bash
luma score .ui/runs/<run-id>
\`\`\`

**Pass Criteria:**
- No MUST pattern failures
- No critical flow errors
- Overall score ≥ **85/100**

If **any** MUST rule fails or **overall score < 85**:

→ **Revise the scaffold, not the code.**

---

### 4. Iterate Until Passing

Repeat the scaffold → analyze → adjust cycle until:

- No blocking layout issues (overflow, spacing violations)
- Keyboard flow is linear and all interactive elements reachable
- Patterns pass their MUST rules (especially Form.Basic & Table.Simple)
- Overall score ≥ **85**

This is the **design approval checkpoint**.

---

## Debugging Failed Validation

When LUMA commands fail, understanding the error output helps you fix issues quickly.

### If \`luma ingest\` Fails

**1. Check error details:**

On Windows PowerShell:
\`\`\`powershell
Get-Content .ui/runs/<run-id>/ingest.json
\`\`\`

On macOS/Linux:
\`\`\`bash
cat .ui/runs/<run-id>/ingest.json
\`\`\`

**2. Interpret \`jsonPointer\`:**

The \`jsonPointer\` field shows the exact location of the error in your scaffold JSON:

| jsonPointer | Meaning |
|-------------|---------|
| \`/screen/root/children/3\` | 4th child of root (0-indexed) |
| \`/screen/root/children/0/text\` | \`text\` property of first child |
| \`/screen/root/children/1/fields/2\` | 3rd field in form |
| \`/screen/settings/spacingScale\` | spacingScale array in settings |

**3. Common Error Types and Fixes:**

#### Invalid Union Errors

**Symptom:** \`Invalid discriminated union. Could not find discriminator property "X"\`

**Common Causes:**
- Wrong property name or type
- Text component: Using \`content\` or \`label\` instead of \`text\`
- Button component: Using \`label\` instead of \`text\`
- Button component: Using \`variant\` or \`role\` instead of \`roleHint\`
- Field component: Using \`fieldType\` or \`type\` instead of \`inputType\`

**Fix:** Use correct property names from component schema (see Component Schema Quick Reference above)

#### Required Property Missing

**Symptom:** \`Required property missing: "X"\`

**Common Causes and Fixes:**

| Component | Missing Property | Fix |
|-----------|-----------------|-----|
| Form | \`states\` | Add \`"states": ["default"]\` (must include "default") |
| Form | \`fields\` | Add at least 1 Field node in \`fields\` array |
| Form | \`actions\` | Add at least 1 Button node in \`actions\` array |
| Field | \`label\` | Add \`"label": "Your Label"\` (non-empty string) |
| Table | \`title\` | Add \`"title": "Your Title"\` (non-empty string) |
| Table | \`columns\` | Add string array like \`["Name", "Email"]\` |
| Table | \`responsive\` | Add \`"responsive": {"strategy": "scroll"}\` |

#### Invalid Type

**Symptom:** \`Expected X, received Y\`

**Common Causes:**

1. **Table columns as objects instead of strings:**
   - ❌ Wrong: \`"columns": [{"key": "col1", "header": "Name"}]\`
   - ✅ Correct: \`"columns": ["Name", "Email", "Status"]\`

2. **Spacing values not in spacingScale:**
   - ❌ Wrong: \`"gap": 15\` (if 15 not in spacingScale)
   - ✅ Correct: \`"gap": 16\` (use values from settings.spacingScale)

3. **Wrong enum value:**
   - ❌ Wrong: \`"direction": "vert"\` or \`"Direction": "vertical"\`
   - ✅ Correct: \`"direction": "vertical"\` (exact match, case-sensitive)

### If \`luma score\` is < 85

Score failures come from specific validation rules. Check individual artifact files to identify issues:

**Common Issues:**

| Issue | Artifact | Symptom | Fix |
|-------|----------|---------|-----|
| Spacing not in scale | \`ingest.json\` | Stack/Grid \`gap\` or \`padding\` value rejected | Use values from \`settings.spacingScale\` |
| Touch target too small | \`layout.json\` | Button/Field \`< 44x44px\` | Set \`minSize: {w: 44, h: 44}\` or increase padding |
| Wrong action order | \`flow.json\` | Form actions before fields | Move action buttons after fields in scaffold |
| Missing field label | \`flow.json\` | Field without label | Add \`"label"\` property (required, non-empty) |
| Tab order issues | \`keyboard.json\` | Unexpected tab sequence | Reorder nodes in scaffold JSON (tab follows document order) |

**Debugging Workflow:**

\`\`\`powershell
# 1. Check which artifact has issues
Get-Content .ui/runs/<run-id>/score.json

# 2. Examine specific artifact
Get-Content .ui/runs/<run-id>/ingest.json
Get-Content .ui/runs/<run-id>/layout.json
Get-Content .ui/runs/<run-id>/keyboard.json
Get-Content .ui/runs/<run-id>/flow.json

# 3. Fix issues in scaffold JSON

# 4. Re-run full pipeline (chained for same run folder)
luma ingest your-scaffold.json; \`
luma layout your-scaffold.json --viewports 320x640,768x1024; \`
luma keyboard your-scaffold.json; \`
luma flow your-scaffold.json --patterns form

# 5. Check new score
luma score .ui/runs/<new-run-id>
\`\`\`

### If \`luma keyboard\` Shows Wrong Tab Order

**Understanding Tab Order:**

Tab order **always follows document order** in the scaffold JSON. You cannot override this with \`tabIndex\` alone.

**Fix Wrong Tab Order:**

1. Identify the desired tab sequence
2. Reorder nodes in your scaffold JSON to match that sequence
3. Run \`luma keyboard\` again to verify

**Example:**

❌ Wrong Order (Submit button tabbed before Email field):
\`\`\`json
{
  "children": [
    {"id": "name-field", "type": "Field", "label": "Name"},
    {"id": "submit-btn", "type": "Button", "text": "Submit"},
    {"id": "email-field", "type": "Field", "label": "Email"}
  ]
}
\`\`\`

✅ Correct Order (All fields before buttons):
\`\`\`json
{
  "children": [
    {"id": "name-field", "type": "Field", "label": "Name"},
    {"id": "email-field", "type": "Field", "label": "Email"},
    {"id": "submit-btn", "type": "Button", "text": "Submit"}
  ]
}
\`\`\`

### Pattern Validation Failures

**Symptom:** Pattern not found or validation fails unexpectedly

**Common Cause:** Pattern names are **case-sensitive** and must match exactly.

**Correct Pattern Names:**
- \`Form.Basic\` (not \`form\`, \`form-basic\`, or \`FORM.BASIC\`)
- \`Table.Simple\` (not \`table\`, \`table-simple\`, or \`TABLE.SIMPLE\`)
- \`Form.MultiStep\` (not \`multi-step-form\`)

**Check Available Patterns:**
\`\`\`bash
luma patterns
\`\`\`

**Fix:** Use exact pattern name from \`luma patterns\` output.

---

### 4.5. PRE-IMPLEMENTATION CHECKPOINT

🛑 **MANDATORY REVIEW - Complete BEFORE writing ANY code:**

**Functional Completeness Audit:**
1. List EVERY component in your approved scaffold
2. For each interactive component (Button, Field), verify its action target exists
3. Check for workflow gaps or "dead-end" interactions

**Example Audit:**
\`\`\`
Component Inventory:
├── title (Text)
├── add-contact-btn (Button) → Target: ??? ❌ MISSING FORM
├── contact-table (Table)
└── [Need to add: contact-form]
\`\`\`

**Critical Questions:**
- Can I implement every button's action using ONLY scaffold components?
- Does every interactive element have a complete workflow?
- Are there any "obvious but missing" features?

**🚨 CHECKPOINT FAILURE = Scaffold is incomplete**

If you answer "no" to any question:
1. 🛑 DO NOT start implementation
2. 📝 Update scaffold with missing components
3. 🔄 Re-run LUMA validation (ingest → layout → keyboard → flow → score)
4. ✅ Only proceed when score ≥ 85 AND all workflows complete

**Red Flag Thoughts During This Review:**
- "I'll need to add a modal to make this button work" → ❌ STOP, update scaffold
- "Users will expect a form here" → ❌ STOP, update scaffold
- "This obviously needs..." → ❌ STOP, update scaffold

---

### 5. Implementation Phase - CRITICAL COMPLIANCE RULES

**🚨 SCAFFOLD FIDELITY REQUIREMENTS:**

Once the scaffold is approved (score ≥ 85), follow these **mandatory** rules:

**1. Component Mapping Rule**
- Every HTML/JSX element MUST map 1:1 to a scaffold component
- If scaffold has 5 components → implementation has exactly 5 components
- **NO additional UI elements** beyond the scaffold definition

**2. ID Preservation Rule**
- All scaffold component IDs MUST be preserved exactly in implementation
- Example: \`"id": "contact-form"\` → \`<form id="contact-form">\`
- No renaming, no omitting IDs

**3. Structure Immutability Rule**
- The component hierarchy cannot change during implementation
- If scaffold shows Stack > Text > Button > Form → code follows exactly
- No reordering, no nesting changes

**4. Feature Freeze Rule**
- NO additional functionality beyond scaffold definition
- If scaffold doesn't include a "delete" button → don't implement delete
- If scaffold has 3 form fields → implement exactly 3 fields

**❌ FORBIDDEN DURING IMPLEMENTATION:**
- Adding components not in scaffold (e.g., extra buttons, fields, tables)
- Adding form fields not defined in scaffold
- Changing component hierarchy or order
- Implementing features that didn't pass LUMA validation
- Using non-scaffold approaches when validation fails

**✅ ALLOWED DURING IMPLEMENTATION:**
- Styling (colors, fonts, spacing) per design system
- Accessibility attributes (aria-labels, roles, etc.)
- Event handlers for interactions defined by scaffold components
- CSS classes for styling (but not structural changes)

---

## ⚠️ Common Pitfalls to Avoid

**1. "Helpful Additions"**
- ❌ "Users probably want a cancel button, let me add that"
- ✅ "Scaffold doesn't include cancel, so I won't implement it"

**2. "Technical Workarounds"**
- ❌ "Table validation failed, I'll use an HTML table instead"
- ✅ "Table failed validation, I need to fix the scaffold first"

**3. "Obvious Missing Pieces" - MAJOR VIOLATION**
- ❌ "Obviously need a contact form for the Add Contact button"
- ❌ "Users will expect a modal when clicking this button"
- ❌ "The button is useless without a form, so I'll add one"
- ✅ "Button exists but form is missing → scaffold is incomplete → update scaffold first"

**4. "Scope Creep During Implementation"**
- ❌ Adding extra fields, buttons, or sections while coding
- ✅ Stop implementation, update scaffold, re-validate, then code

**🚨 RED FLAG PHRASES - Stop Immediately if You Think:**
- "Obviously need..."
- "Users will expect..."
- "This button should..."
- "To make this work, I'll add..."
- "For better UX, let me..."
- "I'll just quickly add..."

**When you catch yourself using these phrases → You are about to violate scaffold fidelity**

**Correct Response When You Catch a Red Flag:**
1. STOP implementation immediately
2. Identify what's missing in the scaffold
3. Update scaffold JSON with needed components
4. Re-run LUMA validation pipeline
5. Resume implementation only after approval (score ≥ 85)

**If You Want to Add Features:**
1. STOP implementation
2. Update the scaffold JSON with new components
3. Re-run full LUMA pipeline: \`ingest → layout → keyboard → flow → score\`
4. Get new approval (score ≥ 85)
5. THEN implement the expanded scaffold

**Never implement features that haven't passed LUMA validation.**

---

## Key Rules

| Do | Do Not |
|---|---|
| Design UI in scaffold form first | Jump straight to HTML/JSX |
| Run \`luma score\` before coding | Ignore failing pattern rules |
| Use \`luma scaffold new\` for quick starts | Write invalid JSON manually |
| **Implement ONLY what's in approved scaffold** | **Add features during implementation** |
| **Map scaffold components 1:1 to HTML** | **Add extra form fields, buttons, or sections** |
| **Preserve all scaffold component IDs** | **Rename or omit scaffold-defined IDs** |
| Iterate until layout/flow are correct | Hardcode layout fixes in CSS later |
| Keep scaffolds committed in VCS | Let scaffolds drift from implementation |

---

## Quick Reference

**Get help:**
\`\`\`
luma capabilities --json              # List all commands
luma explain --topic <topic> --json   # Detailed explanations
luma faq --json                       # Common questions
luma patterns --json                  # Available pattern validators
\`\`\`

**Common topics:**
- \`workflow\` - End-to-end process
- \`scaffold-contract\` - Valid scaffold rules
- \`golden-template\` - Reference example
- \`layout-solver\` - How layout works
- \`scoring\` - How scores are calculated

**Scaffold generation:**
\`\`\`
luma scaffold new --pattern todo-list --out <file>
luma scaffold new --pattern empty-screen --out <file>
\`\`\`

**Validation pipeline:**
\`\`\`
luma ingest <file>                           # Validate structure
luma layout <file> --viewports 320x640       # Check responsive layout
luma keyboard <file>                         # Analyze tab flow
luma flow <file> --patterns form,table       # Validate UX patterns
luma score <run-folder>                      # Get overall score
luma report <run-folder> --out report.html   # Generate visual report
\`\`\`

---

## Real-World Example: The Modal Form Violation

**What Happened:**
An agent created a CRM scaffold with:
- Title text
- "Add Contact" button
- Contact table

During implementation, the agent added a contact form modal to make the button functional, even though no form was in the scaffold.

**Why This Was Wrong:**
- ❌ Violated Component Mapping Rule (3 components → 4+ elements)
- ❌ Violated Feature Freeze Rule (modal not in scaffold)
- ❌ Added functionality that hadn't passed LUMA validation

**What Should Have Happened:**
1. **At Step 4.5 (Pre-Implementation Checkpoint)**: Agent should have noticed "Add Contact" button has no target form
2. **Correct Action**: STOP, update scaffold to include the contact form
3. **Re-validate**: Run LUMA pipeline on updated scaffold
4. **Then Implement**: Build the approved scaffold including the form

**Key Lesson:** Never add components during implementation to "make things work" - always ensure complete workflows are in the approved scaffold first.
`;

export const initCommand = new Command('init')
  .description('Initialize LUMA in the current project by creating/updating AGENTS.md')
  .action(() => {
    const cwd = process.cwd();
    const agentsPath = path.join(cwd, 'AGENTS.md');
    
    let existingContent = '';
    let fileExists = false;
    
    // Check if AGENTS.md exists
    try {
      if (fs.existsSync(agentsPath)) {
        existingContent = fs.readFileSync(agentsPath, 'utf-8');
        fileExists = true;
      }
    } catch (error) {
      // File doesn't exist or can't be read
    }
    
    // Check if LUMA section already exists
    if (existingContent.includes('## Preflight: Before You Generate Scaffolds') || 
        existingContent.includes('This project uses **LUMA (Layout & UX Mockup Analyzer)**')) {
      console.log('\x1b[33m⚠ LUMA section already exists in AGENTS.md\x1b[0m');
      console.log('No changes made. To update, manually edit AGENTS.md.');
      return;
    }
    
    // Add LUMA section to AGENTS.md
    let newContent: string;
    if (fileExists && existingContent.trim()) {
      // Append to existing file
      newContent = existingContent.trimEnd() + '\n\n' + agentsContent + '\n';
      console.log('\x1b[32m✓ Added LUMA section to existing AGENTS.md\x1b[0m');
    } else {
      // Create new file - agentsContent already has the header
      newContent = agentsContent + '\n';
      console.log('\x1b[32m✓ Created AGENTS.md with LUMA section\x1b[0m');
    }
    
    try {
      fs.writeFileSync(agentsPath, newContent, 'utf-8');
    } catch (error) {
      console.error('\x1b[31m✗ Failed to write AGENTS.md:\x1b[0m', error);
      process.exit(1);
    }
    
    console.log('\n\x1b[1mNext steps:\x1b[0m');
    console.log('  • Review AGENTS.md to ensure the content is properly integrated');
    console.log('  • Create examples/ folder with sample scaffolds');
    console.log('  • Run \`luma --help\` to see available commands\n');
  });
