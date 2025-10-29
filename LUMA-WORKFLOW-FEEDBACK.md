# LUMA Workflow Feedback & Improvement Suggestions

**Date:** October 29, 2025  
**Context:** Building CRMFive using AGENTS.md workflow  
**Result:** Successfully completed with 100/100 LUMA score

---

## 🟢 What Worked Well

### 1. Clear Workflow Steps
The numbered phases (0-5) were easy to follow and created a logical progression from design to implementation.

### 2. Pre-Implementation Checkpoint (Step 4.5)
This caught the exact "modal form violation" scenario and made me consciously verify completeness before writing any code. Excellent safety mechanism.

### 3. Scaffold Fidelity Rules
Crystal clear what's allowed/forbidden during implementation. The four rules (Component Mapping, ID Preservation, Structure Immutability, Feature Freeze) are unambiguous.

### 4. Real-World Example
The "Modal Form Violation" story at the end was extremely helpful. It showed exactly what NOT to do and why.

---

## 🟡 Issues Encountered

### Issue 1: Component Schema Documentation Gap

**Problem:** The scaffold contract explained high-level rules, but I didn't know the exact properties for each component type.

**What Happened:**
- Used `content` instead of `text` for Text component ❌
- Used `label` instead of `text` for Button ❌
- Used `variant` instead of `roleHint` for Button ❌
- Added `inputType`, `required`, `placeholder` to Field (don't exist) ❌
- Used object array for Table columns instead of string array ❌
- Added `fontWeight` to Text (not supported) ❌

**Solution I Found:**  
Had to run `luma explain --topic component-text`, `component-button`, etc. individually for each component type to discover the correct schema.

**Suggested Fix for AGENTS.md:**

Add a new section after Step 0:

```markdown
### 0.5. Learn Component Schemas (Before Creating Scaffold)

Before writing scaffold JSON, understand valid component properties:

**Quick Reference Commands:**
```bash
luma explain --topic component-text --json
luma explain --topic component-button --json
luma explain --topic component-field --json
luma explain --topic component-form --json
luma explain --topic component-table --json
luma explain --topic component-stack --json
```

**Critical Property Names (Common Mistakes):**

| Component | ✅ Correct | ❌ Wrong |
|-----------|-----------|----------|
| Text | `text` | `content`, `label` |
| Text | `fontSize` | `fontWeight`, `fontStyle` |
| Button | `text` | `label` |
| Button | `roleHint` | `variant`, `type` |
| Table | `columns: ["Name", "Email"]` | `columns: [{id, header}]` |
| Field | `label` only | `inputType`, `required`, `placeholder` |

**Field Component (Minimal Schema):**
```json
{
  "id": "my-field",
  "type": "Field",
  "label": "Field Label"
}
```
- ✅ Optional: `helpText`, `errorText`
- ❌ NO: `inputType`, `required`, `placeholder`, `value`, `onChange`

**Form Component (Required Properties):**
```json
{
  "id": "my-form",
  "type": "Form",
  "states": ["default"],
  "fields": [...],
  "actions": [...]
}
```
- `states` must include "default"
- `fields` must be Field components (not simple objects)
- `actions` must be Button components
```

---

### Issue 2: Pipeline Execution Confusion

**Problem:** Each LUMA command creates a new run folder, so I couldn't score the complete pipeline initially.

**What Happened:**
- `luma ingest` created `.ui/runs/20251029-070049-383/`
- `luma layout` created `.ui/runs/20251029-070139-805/`
- `luma keyboard` created `.ui/runs/20251029-070228-914/`
- `luma score` failed because artifacts were scattered across folders

**Solution I Found:**  
Chained commands with semicolons in PowerShell so they all write to the same run folder.

**Suggested Fix for AGENTS.md:**

Replace Step 3 with:

```markdown
### 3. Validate with LUMA

**IMPORTANT:** Run commands in sequence to populate the same run folder.

**Windows PowerShell:**
```powershell
luma ingest ui\screens\<screen>.mock.json; `
luma layout ui\screens\<screen>.mock.json; `
luma keyboard ui\screens\<screen>.mock.json; `
luma flow ui\screens\<screen>.mock.json --patterns Form.Basic; `
luma flow ui\screens\<screen>.mock.json --patterns Table.Simple
```

**macOS/Linux (bash/zsh):**
```bash
luma ingest ui/screens/<screen>.mock.json && \
luma layout ui/screens/<screen>.mock.json && \
luma keyboard ui/screens/<screen>.mock.json && \
luma flow ui/screens/<screen>.mock.json --patterns Form.Basic && \
luma flow ui/screens/<screen>.mock.json --patterns Table.Simple
```

**Then get the score:**
```bash
# The run folder path is shown in the first command's output
luma score .ui/runs/<run-id>
```

**Note:** If commands create separate folders, you'll get "keyboard.json not found" errors when scoring.
```

---

### Issue 3: Pattern Names Unclear

**Problem:** Documentation examples showed `--patterns form,table` but actual pattern names are case-sensitive and different.

**What Happened:**
- Tried: `luma flow --patterns form,table` → Error: "Unknown pattern: form" ❌
- Had to run `luma patterns --list` to discover correct names

**Suggested Fix for AGENTS.md:**

Add to Step 3:

```markdown
**Pattern Names (Case-Sensitive):**

Use exact names from `luma patterns --list`:
- ✅ `Form.Basic` (not "form" or "form.basic")
- ✅ `Table.Simple` (not "table" or "table.simple")

**Correct Usage:**
```bash
# Run patterns separately (comma-separated doesn't work)
luma flow ui/screens/crm.mock.json --patterns Form.Basic
luma flow ui/screens/crm.mock.json --patterns Table.Simple
```

**Available Patterns:**
- `Form.Basic` - GOV.UK Design System form pattern
- `Table.Simple` - IBM Carbon Design System table pattern
```

---

### Issue 4: Field Component Mystery

**Problem:** The Form component spec mentioned Field components but there was no clear documentation about Field properties.

**What Happened:**
- Assumed Field would have properties like HTML inputs: `inputType`, `required`, `placeholder`
- All attempts with these properties failed validation
- Eventually discovered Field only needs: `id`, `type: "Field"`, `label`

**Suggested Fix for AGENTS.md:**

Add a Field component example:

```markdown
**Field Component Schema:**

Fields are intentionally simple at the scaffold level:

```json
{
  "id": "email-field",
  "type": "Field",
  "label": "Email Address"
}
```

**Valid Properties:**
- `id` (required)
- `type: "Field"` (required)
- `label` (required)
- `helpText` (optional) - guidance text below field
- `errorText` (optional) - error message (requires "error" in Form.states)

**NOT Supported in Scaffolds:**
- ❌ `inputType` (text, email, password, etc.)
- ❌ `required` (boolean)
- ❌ `placeholder`
- ❌ `value` or `defaultValue`
- ❌ `validation` rules

These are implementation details, not scaffold concerns.
```

---

### Issue 5: Ambiguity - Generate vs Manual

**Problem:** AGENTS.md suggests both "generate from pattern" and "write manually" but doesn't explain when to use which approach.

**Suggested Fix for AGENTS.md:**

Update Step 2:

```markdown
### 2. Produce a Scaffold

**Option A: Generate from Pattern (Recommended for Beginners)**

Use this when:
- ✅ Starting a new project
- ✅ Learning LUMA
- ✅ Building common UI patterns (todo list, form, table)

```bash
luma scaffold new --pattern todo-list --out ui/screens/<screen>.mock.json
luma scaffold new --pattern empty-screen --out ui/screens/<screen>.mock.json
```

**Option B: Write JSON Manually**

Use this when:
- ✅ You understand component schemas well
- ✅ Building custom/unique layouts
- ✅ Combining multiple patterns
- ✅ Need fine-grained control

**Recommended Approach:**
1. Start with a pattern: `luma scaffold new --pattern todo-list`
2. Customize the generated JSON for your needs
3. Validate iteratively
```

---

## 🔴 Missing Guidance

### 1. How to Debug Validation Failures

**Problem:** The doc says "revise the scaffold" but doesn't explain HOW to interpret error messages.

**Suggested Addition to AGENTS.md:**

```markdown
## Debugging Failed Validation

### If `luma ingest` Fails

1. **Check the error details:**
   ```bash
   cat .ui/runs/<run-id>/ingest.json
   ```

2. **Look for `jsonPointer`:**
   - Example: `"/screen/root/children/3"` means the 4th child (0-indexed) has an error

3. **Common Fixes:**
   - "Invalid union" → Wrong property name or type
     - Text: use `text` not `content`
     - Button: use `text` not `label`
     - Button: use `roleHint` not `variant`
   - "Required property missing" → 
     - Form needs `states` array
     - Form needs at least 1 field and 1 action
   - "Invalid type" →
     - Table columns must be strings: `["Name", "Email"]`
     - Not objects: `[{id: "col1", header: "Name"}]`

### If `luma score` is < 85

1. **Check individual artifacts:**
   ```bash
   cat .ui/runs/<run-id>/layout_320x640.json
   cat .ui/runs/<run-id>/flow.json
   ```

2. **Common Issues:**
   - **Stack padding not in spacingScale**
     - Fix: Use only values from spacingScale: `0, 4, 8, 12, 16, 24, 32`
   - **Touch target < 44px**
     - Fix: Add `minSize: {w: 44, h: 44}` to Button/Field
   - **Form actions before fields**
     - Fix: Put `fields` array before `actions` array
   - **Field missing label**
     - Fix: Every Field must have non-empty `label`

### If `luma keyboard` Shows Wrong Tab Order

1. **Check focusable elements:**
   - Buttons and Fields are focusable by default
   - Tab order follows document order (top to bottom)

2. **Fix:**
   - Reorder components in scaffold to match desired tab sequence
   - Don't use `tabIndex` unless absolutely necessary
```

---

### 2. No Complete Valid Scaffold Example

**Problem:** Golden template is referenced but not shown inline in AGENTS.md.

**Suggested Addition to AGENTS.md:**

Add after Step 0:

```markdown
### Complete Minimal Valid Scaffold

Here's a complete, minimal scaffold that passes all validations:

```json
{
  "schemaVersion": "1.0.0",
  "screen": {
    "id": "example-screen",
    "title": "Example Screen",
    "root": {
      "id": "root",
      "type": "Stack",
      "direction": "vertical",
      "gap": 16,
      "padding": 24,
      "children": [
        {
          "id": "title",
          "type": "Text",
          "text": "Hello World",
          "fontSize": 24
        },
        {
          "id": "submit-btn",
          "type": "Button",
          "text": "Submit",
          "roleHint": "primary"
        }
      ]
    }
  },
  "settings": {
    "spacingScale": [4, 8, 12, 16, 24, 32],
    "minTouchTarget": {
      "w": 44,
      "h": 44
    },
    "breakpoints": ["320x640", "768x1024", "1280x800"]
  }
}
```

**Key Elements Every Scaffold Needs:**
- ✅ `schemaVersion: "1.0.0"`
- ✅ `screen.id` and `screen.title`
- ✅ `screen.root` with a single component (usually Stack)
- ✅ `settings.spacingScale` array
- ✅ `settings.minTouchTarget` object
- ✅ `settings.breakpoints` array
```

---

## 💡 Suggested New Section: "Common First-Time Issues"

Add this to AGENTS.md as a quick troubleshooting reference:

```markdown
## Troubleshooting: Common First-Time Issues

### Error: "Invalid input" at /screen/root/children/X
**Cause:** Wrong component property or type  
**Fix:** Check component schema: `luma explain --topic component-<type>`

### Error: "Run folder missing keyboard.json"
**Cause:** Commands created separate run folders  
**Fix:** Re-run pipeline in sequence using semicolons/&& (see Step 3)

### Error: "Unknown pattern: form"
**Cause:** Pattern names are case-sensitive  
**Fix:** Use exact names: `Form.Basic`, `Table.Simple`

### Score < 85: "Stack padding not in spacingScale"
**Cause:** Padding value not in the defined scale  
**Fix:** Use only: `0, 4, 8, 12, 16, 24, 32`

### Error: Table columns validation failed
**Cause:** Used object array instead of string array  
**Fix:** Use `["Name", "Email"]` not `[{id: "col1", header: "Name"}]`

### Error: Field validation failed
**Cause:** Used HTML input properties in scaffold  
**Fix:** Field only needs: `id`, `type: "Field"`, `label`  
       Remove: `inputType`, `required`, `placeholder`

### Score < 85: "Actions before fields in Form"
**Cause:** Form structure order violation  
**Fix:** Put `fields` array before `actions` array in Form

### Error: "Form must include 'default' in states"
**Cause:** Missing required state  
**Fix:** Add `"states": ["default"]` to Form
```

---

## 🎯 Overall Assessment

### AGENTS.md is Excellent At:
- ✅ Explaining WHY (design-first philosophy)
- ✅ Defining WHAT NOT TO DO (violations, pitfalls)
- ✅ Setting clear rules (fidelity requirements)
- ✅ Real-world examples of mistakes

### Could Be Improved At:
- ❌ HOW to write valid scaffolds (component schemas up front)
- ❌ HOW to debug validation failures (error interpretation)
- ❌ HOW to run the pipeline efficiently (command chaining)
- ❌ Providing complete working examples inline

---

## 📊 Impact Summary

**Time Spent on Issues:**
- Component schema trial-and-error: ~40% of development time
- Pipeline execution debugging: ~15% of development time
- Pattern naming issues: ~5% of development time

**With Improvements:**
- Could reduce initial scaffold creation time by ~50%
- Would eliminate most validation iteration cycles
- New users would get to 100/100 score faster

---

## ✅ Recommended Priority

**High Priority (Fix First):**
1. Add component schema reference (Issue 1)
2. Add debugging guide (Missing Guidance 1)
3. Fix pipeline execution instructions (Issue 2)

**Medium Priority:**
4. Add complete example scaffold (Missing Guidance 2)
5. Clarify pattern vs manual approach (Issue 5)
6. Add troubleshooting section

**Low Priority:**
7. Pattern naming clarification (Issue 3)
8. Field component documentation (Issue 4)

---

**Bottom Line:** AGENTS.md has excellent workflow structure and philosophy, but needs more "how-to" detail for the scaffold creation phase. Most iteration time was spent discovering component schemas through trial-and-error rather than implementing features.
