# LUMA Quickstart Guide

This guide walks you through analyzing a UI scaffold with LUMA from start to finish.

## Prerequisites

- Node.js 18+ installed
- LUMA installed (see [README.md](./README.md#installation))

## Step 0: Generate a Scaffold (Recommended - v1.1)

**New in v1.1:** Instead of writing JSON manually, generate a valid scaffold from a pattern:

```bash
# Generate a todo-list scaffold
luma scaffold new --pattern todo-list --out my-todo.json

# Generate a login form
luma scaffold new --pattern login-form --out login.json --title "Sign In"

# Generate an empty scaffold to start from scratch
luma scaffold new --pattern empty-screen --out blank.json
```

**Available patterns:** `todo-list`, `empty-screen`, `form-basic`, `table-simple`, `contact-form`, `data-table-with-actions`, `modal-dialog`, `login-form`, `multi-step-form`, `dashboard-grid`

**Scaffold Contract:** Before creating scaffolds manually, review the contract:
```bash
luma explain --topic scaffold-contract
```

This ensures your scaffold follows all validation rules. You can also view the golden template:
```bash
luma explain --topic golden-template
```

## Step 0a: Agent Onboarding (Optional)

If you're an AI agent integrating LUMA into a project, run:

```bash
luma init
```

This displays instructions for adding LUMA workflow documentation to AGENTS.md and CLAUDE.md files.

## Step 1: Prepare Your Scaffold

**Option A: Use scaffold generation (recommended)**
```bash
luma scaffold new --pattern login-form --out my-form.json
```

**Option B: Create manually**

Create a simple form scaffold in `my-form.json`:

```json
{
  "schemaVersion": "1.0.0",
  "screen": {
    "id": "login-screen",
    "title": "Login",
    "root": {
      "id": "root-stack",
      "type": "Stack",
      "direction": "vertical",
      "gap": 16,
      "padding": 24,
      "children": [
        { "id": "login-title", "type": "Text", "text": "Sign In" },
        {
          "id": "login-form",
          "type": "Form",
          "title": "Account Access",
          "fields": [
            { "id": "email-field", "type": "Field", "label": "Email", "inputType": "email", "required": true },
            { "id": "password-field", "type": "Field", "label": "Password", "inputType": "password", "required": true }
          ],
          "actions": [
            { "id": "submit-btn", "type": "Button", "text": "Login", "roleHint": "primary", "minSize": { "w": 44, "h": 44 } },
            { "id": "cancel-btn", "type": "Button", "text": "Cancel", "roleHint": "secondary", "minSize": { "w": 44, "h": 44 } }
          ],
          "states": ["default", "submitting", "error"]
        }
      ]
    }
  },
  "settings": {
    "spacingScale": [4, 8, 12, 16, 24, 32, 48],
    "minTouchTarget": { "w": 44, "h": 44 },
    "breakpoints": ["320x640", "768x1024", "1280x800"]
  }
}
```

## Step 2: Validate the Scaffold

```bash
luma ingest my-form.json
```

**What it does:** Validates the JSON structure, checks for required fields, and normalizes the data.

**Expected output:**
```
✓ Scaffold validated successfully
→ Run folder: .ui/runs/20251027-203000-123
```

Check `.ui/runs/<timestamp>/ingest.json` for detailed results.

### Enhanced Error Messages (v1.1)

If validation fails, LUMA now shows **one critical error at a time** with actionable guidance:

```bash
luma ingest broken.json

# Example error output:
# ✗ Validation failed
# 
# Error at /screen/root/children/0
# Expected: "text" property (required for Text nodes)
# Found: "content" property
# 
# Suggested fix:
# {
#   "type": "Text",
#   "text": "Your content here"  ← Use "text" instead of "content"
# }
```

**Tip:** To see all errors at once, use `--all-issues`:
```bash
luma ingest broken.json --all-issues
```

## Step 3: Compute Layout

```bash
luma layout my-form.json --viewports 320x640,1024x768
```

**What it does:** Simulates how the UI would layout at different screen sizes.

**Expected output:**
```
✓ Layout computed for 320x640
✓ Layout computed for 1024x768
→ Run folder: .ui/runs/20251027-203001-456
```

Check the layout files:
- `.ui/runs/<timestamp>/layout_320x640.json`
- `.ui/runs/<timestamp>/layout_1024x768.json`

## Step 4: Analyze Keyboard Flow

```bash
luma keyboard my-form.json
```

**What it does:** Determines tab order and checks for unreachable interactive elements.

**Expected output:**
```
✓ Keyboard analysis complete
✓ Tab sequence: email-field → password-field → submit-button
→ Run folder: .ui/runs/20251027-203002-789
```

Check `.ui/runs/<timestamp>/keyboard.json` for the full tab sequence.

## Step 5: Validate UX Patterns

```bash
luma flow my-form.json --patterns Form.Basic
```

**What it does:** Checks compliance with UX patterns (labels, actions, disclosure, guided flow, etc.).

### Implicit Pattern Identification (v1.1 LUMA-75)

If you omit the `--patterns` flag, LUMA will automatically select high-confidence patterns based on scaffold heuristics (e.g., detects a `Form` node and activates `Form.Basic`, detects collapsible disclosure behaviors and activates `Progressive.Disclosure`).

```bash
# Auto-selects patterns (e.g., Form.Basic) based on scaffold contents
luma flow my-form.json

# Suppress auto-selection (validate zero patterns unless explicitly provided)
luma flow my-form.json --no-auto
```

To see why patterns were auto-selected, use JSON output:
```bash
luma flow my-form.json --json | jq '.autoSelected'
```

Provide explicit patterns to override implicit selection:
```bash
luma flow my-form.json --patterns Form.Basic,Table.Simple
```

**Expected output (explicit):**
```
✓ Pattern validation complete
✓ Form.Basic: PASS (0 MUST failures, 0 SHOULD warnings)
→ Run folder: .ui/runs/<timestamp>
```

**Expected output (implicit auto-selection):**
```
✓ Pattern validation complete
✓ Auto-selected patterns: Form.Basic
→ Run folder: .ui/runs/<timestamp>
```

Check `.ui/runs/<timestamp>/flow.json` for detailed pattern results.

## Step 6: Calculate Overall Score

```bash
luma score .ui/runs/<latest-timestamp>
```

Replace `<latest-timestamp>` with the most recent run folder from the previous steps.

**What it does:** Aggregates results across all categories and determines pass/fail.

**Expected output:**
```
✓ Scoring complete
  Overall score: 95.5/100
  Status: PASS

  Category scores:
  - Pattern Fidelity: 100.0 (45%)
  - Flow & Reachability: 100.0 (25%)
  - Hierarchy & Grouping: 95.0 (20%)
  - Responsive Behavior: 80.0 (10%)

→ Results: .ui/runs/<timestamp>/score.json
```

## Step 7: Generate HTML Report

```bash
luma report .ui/runs/<timestamp>
```

**What it does:** Creates a visual HTML report summarizing all analysis results.

**Expected output:**
```
Report generated: .ui/runs/<timestamp>/report.html
```

Open the HTML file in your browser to see:
- Overall pass/fail status
- Category scores with weights
- All issues grouped by severity
- Per-viewport results

## (Important) Chaining Commands Into One Run Folder

Each command creates a NEW timestamped run folder. To ensure `score` sees all artifacts (ingest, layout, keyboard, flow), chain the commands so they execute sequentially in a single folder.

Windows PowerShell:
```powershell
luma ingest my-form.json; \
luma layout my-form.json --viewports 320x640,768x1024; \
luma keyboard my-form.json; \
luma flow my-form.json --patterns Form.Basic
```

macOS/Linux:
```bash
luma ingest my-form.json && \
luma layout my-form.json --viewports 320x640,768x1024 && \
luma keyboard my-form.json && \
luma flow my-form.json --patterns Form.Basic
```

Then score that run:
```bash
luma score .ui/runs/<run-id>
```

If you see errors like `keyboard.json not found` or `flow.json not found`, you likely ran commands separately. Re-run using chaining.
- Overall pass/fail status
- Category scores with weights
- All issues grouped by severity
- Per-viewport results

## Understanding the Results

### Pass Criteria

Your scaffold passes if:
1. No MUST pattern failures
2. No critical flow errors (unreachable nodes)
3. Overall score ≥ 85/100

### Common Issues

**MUST Failures (Pattern Fidelity)**
- `field-has-label`: Form fields missing required labels
- `actions-exist`: No submit/cancel actions in form
- `header-exists`: Table missing header row

**Flow Errors (Reachability)**
- `unreachable-node`: Interactive element not in tab sequence
- `disabled-in-sequence`: Disabled element incorrectly in tab order

**Layout Issues (Responsive)**
- `overflow-x`: Content wider than viewport
- `primary-below-fold`: Primary action not visible without scrolling

## Introspection Commands

Explore LUMA's capabilities:

```bash
# List all commands and exit codes
luma capabilities

# Show available patterns
luma patterns --list

# See Form.Basic MUST/SHOULD rules
luma patterns --show Form.Basic

# Explain the scaffold contract (v1.1)
luma explain --topic scaffold-contract

# View the golden template (v1.1)
luma explain --topic golden-template

# Explain scoring system
luma explain --topic scoring

# Get help with common questions
luma faq
```

## Working with Scaffold Patterns (v1.1)

Generate scaffolds quickly from built-in patterns:

```bash
# Generate a contact form
luma scaffold new --pattern contact-form --out contact.json

# Generate with custom title
luma scaffold new --pattern dashboard-grid --out dash.json --title "Analytics Dashboard"

# Generate with custom breakpoints
luma scaffold new --pattern table-simple --out table.json --breakpoints "375x667,1920x1080"

# Overwrite existing file
luma scaffold new --pattern form-basic --out form.json --force
```

All generated scaffolds pass `luma ingest` validation automatically.

## Custom Scoring Weights

Create `weights.json` to customize category importance:

```json
{
  "patternFidelity": 0.50,
  "flowReachability": 0.30,
  "hierarchyGrouping": 0.15,
  "responsiveBehavior": 0.05
}
```

Then run:
```bash
luma score .ui/runs/<timestamp> --weights weights.json
```

## Examples

Try the included example scaffolds:

```bash
# Valid form (should pass)
luma ingest examples/happy-form.json
# ... continue with layout, keyboard, flow, score

# Form with MUST violations (should fail)
luma flow examples/pattern-failures.json --patterns Form.Basic

# Form with keyboard issues
luma keyboard examples/keyboard-issues.json

# Table with responsive problems
luma layout examples/overflow-table.json --viewports 320x640
```

## Next Steps

- Read the [full specification](./SPECIFICATION.md)
- Explore [pattern definitions](./SPECIFICATION.md#7-ux-pattern-library)
- Learn about [scoring formulas](./SPECIFICATION.md#8-scoring--thresholds)
- Understand [exit codes](./SPECIFICATION.md#10-exit-codes)
- Review [AGENTS.md](./AGENTS.md) if you're an AI agent integrating LUMA.

## Troubleshooting

**"Invalid schema version"**
- Ensure `schemaVersion` is `"1.0.0"` in your scaffold

**"Cannot find run folder"**
- Check `.ui/runs/` directory for recent timestamps
- Each command creates a new run folder

**"Flow artifact not found"**
- Run `luma flow` before `luma score`
- Ensure you're using the correct run folder path
- If artifacts are missing, you may have run commands in separate folders; chain commands into one run folder (see Chaining section).

**"MUST pattern failures detected"**
- Run `luma patterns --show <pattern>` to see requirements
- Check `flow.json` for specific failure details

## Getting Help

```bash
luma --help              # General help
luma ingest --help       # Command-specific help
luma faq                 # Frequently asked questions
luma explain --topic     # Topic-based explanations
```

For more information, see the [README](./README.md) or the [specification](./SPECIFICATION.md).
