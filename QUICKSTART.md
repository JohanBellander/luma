# LUMA Quickstart Guide

This guide walks you through analyzing a UI scaffold with LUMA from start to finish.

## Prerequisites

- Node.js 18+ installed
- LUMA installed (see [README.md](./README.md#installation))

## Step 0: Agent Onboarding (Optional)

If you're an AI agent integrating LUMA into a project, run:

```bash
luma init
```

This displays instructions for adding LUMA workflow documentation to AGENTS.md and CLAUDE.md files.

## Step 1: Prepare Your Scaffold

Create a simple form scaffold in `my-form.json`:

```json
{
  "schemaVersion": "1.0",
  "screen": {
    "id": "login-form",
    "type": "stack",
    "direction": "vertical",
    "spacing": 16,
    "children": [
      {
        "id": "email-field",
        "type": "field",
        "label": "Email",
        "placeholder": "Enter your email",
        "required": true
      },
      {
        "id": "password-field",
        "type": "field",
        "label": "Password",
        "placeholder": "Enter password",
        "required": true
      },
      {
        "id": "submit-button",
        "type": "action",
        "actionType": "primary",
        "label": "Login",
        "width": 120,
        "height": 44
      }
    ]
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
luma flow my-form.json --patterns form
```

**What it does:** Checks compliance with GOV.UK Form.Basic pattern (fields have labels, actions exist, etc.).

**Expected output:**
```
✓ Pattern validation complete
✓ Form.Basic: PASS (0 MUST failures, 0 SHOULD warnings)
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
luma patterns --show form

# Explain scoring system
luma explain --topic scoring

# Get help with common questions
luma faq
```

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
luma flow examples/pattern-failures.json --patterns form

# Form with keyboard issues
luma keyboard examples/keyboard-issues.json

# Table with responsive problems
luma layout examples/overflow-table.json --viewports 320x640
```

## Next Steps

- Read the [full specification](./LUMA-SPEC.md)
- Explore [pattern definitions](./LUMA-SPEC.md#7-ux-pattern-library)
- Learn about [scoring formulas](./LUMA-SPEC.md#8-scoring--thresholds)
- Understand [exit codes](./LUMA-SPEC.md#10-exit-codes)

## Troubleshooting

**"Invalid schema version"**
- Ensure `schemaVersion` is `"1.0"` in your scaffold

**"Cannot find run folder"**
- Check `.ui/runs/` directory for recent timestamps
- Each command creates a new run folder

**"Flow artifact not found"**
- Run `luma flow` before `luma score`
- Ensure you're using the correct run folder path

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

For more information, see the [README](./README.md) or [specification](./LUMA-SPEC.md).
