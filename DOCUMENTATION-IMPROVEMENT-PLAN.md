# Documentation Improvement Plan
**Date:** October 29, 2025  
**Source:** LUMA-WORKFLOW-FEEDBACK.md  
**Impact:** Reduce first-time AI agent friction by ~50%

---

## Overview

Based on feedback from an AI agent who successfully built a CRM app with LUMA (100/100 score), we've identified critical documentation gaps that caused 40% of development time to be spent on trial-and-error. This plan addresses those gaps in priority order.

---

## Issues Identified

### ✅ Verified Against Source Code

All issues have been verified by checking `src/core/ingest/validator.ts`:

**AGENT-RULES-SCAFFOLD.md Errors Found:**
- ❌ Says Button needs `label` → Actually uses `text` (optional)
- ❌ Says Field needs `fieldType` → Actually uses `inputType` (optional)
- ❌ Says Table columns are objects with `key` and `label` → Actually are strings
- ✅ Field does support: `label` (required), `inputType`, `required`, `helpText`, `errorText`
- ✅ Button does support: `text` (optional), `roleHint`, `focusable`, `tabIndex`

---

## Implementation Tasks

### Priority 1: Critical Fixes

#### Task 1: Fix AGENT-RULES-SCAFFOLD.md Component Schemas
**Estimated Time:** 30 minutes  
**Impact:** HIGH - Document has factual errors causing validation failures

**Changes Required:**

1. **Button Component (Lines 45-46)**
   - ❌ Remove: `label` (non-empty string)
   - ✅ Add: `text` (optional string)
   - ✅ Update: `role` → `roleHint`

2. **Field Component (Lines 49-50)**
   - ❌ Remove: `fieldType`
   - ✅ Add: `inputType` (optional: "text", "email", "password", "number", "date")
   - ✅ Add: `helpText` (optional)
   - ✅ Add: `errorText` (optional)

3. **Table Component (Lines 60-61)**
   - ❌ Remove: Column object format `{ key, label }`
   - ✅ Add: `columns: string[]` (array of column names)

4. **Update Example Scaffold (Lines 100-140)**
   - Fix Button to use `text` instead of `label`

**Acceptance Criteria:**
- All component schemas match `src/core/ingest/validator.ts`
- Example scaffold passes `luma ingest` validation
- No conflicting property names

---

#### Task 2: Add Component Schema Quick Reference to AGENTS.md
**Estimated Time:** 45 minutes  
**Impact:** HIGH - Saves 40% of development time

**Changes Required:**

Add new section **0.5. Learn Component Schemas** after the "Preflight" section:

**Content to Add:**
```markdown
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
```

### Common Property Mistakes

| Component | ✅ Correct Property | ❌ Wrong Property |
|-----------|-------------------|------------------|
| Text | `text` | `content`, `label` |
| Button | `text` | `label` |
| Button | `roleHint` | `variant`, `role`, `type` |
| Field | `inputType` | `fieldType`, `type` |
| Table | `columns: ["Name", "Email"]` | `columns: [{key, label}]` |

### Component Schemas

#### Text
```json
{
  "id": "my-text",
  "type": "Text",
  "text": "Display text",
  "fontSize": 16
}
```
- ✅ Required: `id`, `type`, `text`
- ✅ Optional: `fontSize`, `maxLines`
- ❌ NO: `content`, `label`, `fontWeight`, `fontStyle`

#### Button
```json
{
  "id": "my-button",
  "type": "Button",
  "text": "Click me",
  "roleHint": "primary"
}
```
- ✅ Required: `id`, `type`
- ✅ Optional: `text`, `roleHint` ("primary", "secondary", "danger", "link")
- ❌ NO: `label`, `variant`, `onClick`

#### Field
```json
{
  "id": "my-field",
  "type": "Field",
  "label": "Email Address",
  "inputType": "email",
  "required": true,
  "helpText": "We'll never share your email"
}
```
- ✅ Required: `id`, `type`, `label`
- ✅ Optional: `inputType`, `required`, `helpText`, `errorText`
- ✅ Valid inputTypes: "text", "email", "password", "number", "date"
- ❌ NO: `placeholder`, `value`, `onChange`

#### Form
```json
{
  "id": "my-form",
  "type": "Form",
  "states": ["default"],
  "fields": [
    { "id": "field1", "type": "Field", "label": "Name" }
  ],
  "actions": [
    { "id": "submit", "type": "Button", "text": "Submit" }
  ]
}
```
- ✅ Required: `id`, `type`, `states`, `fields`, `actions`
- ✅ `states` must include "default"
- ✅ `fields` must be Field components (min 1)
- ✅ `actions` must be Button components (min 1)

#### Table
```json
{
  "id": "my-table",
  "type": "Table",
  "title": "Users",
  "columns": ["Name", "Email", "Role"],
  "responsive": {
    "strategy": "scroll"
  }
}
```
- ✅ Required: `id`, `type`, `title`, `columns`, `responsive`
- ✅ `columns` is string array (NOT objects)
- ✅ `responsive.strategy`: "wrap", "scroll", or "cards"
- ❌ NO: Object columns with `key` and `label`

#### Stack
```json
{
  "id": "my-stack",
  "type": "Stack",
  "direction": "vertical",
  "gap": 16,
  "padding": 24,
  "children": [...]
}
```
- ✅ Required: `id`, `type`, `direction`, `children`
- ✅ Optional: `gap`, `padding`, `align`, `wrap`
- ✅ `gap` and `padding` MUST be in `spacingScale`
```

**Acceptance Criteria:**
- Complete schema reference for all 8 component types
- Property mistake table with ✅/❌ examples
- No conflicting information with AGENT-RULES-SCAFFOLD.md

---

#### Task 3: Add Pipeline Command Chaining Examples
**Estimated Time:** 20 minutes  
**Impact:** HIGH - Prevents scattered run folders, enables scoring

**Changes Required:**

Add to AGENTS.md workflow example section:

```markdown
### Running Complete Pipeline (Same Run Folder)

**IMPORTANT:** Chain commands so they write to the same run folder.

**Windows PowerShell:**
```powershell
luma ingest contact.json; `
luma layout contact.json --viewports 320x640,768x1024; `
luma keyboard contact.json; `
luma flow contact.json --patterns Form.Basic

# Then score the run
luma score .ui/runs/<run-id>
```

**macOS/Linux (bash/zsh):**
```bash
luma ingest contact.json && \
luma layout contact.json --viewports 320x640,768x1024 && \
luma keyboard contact.json && \
luma flow contact.json --patterns Form.Basic

# Then score the run
luma score .ui/runs/<run-id>
```

**Why This Matters:**
- Each command creates a new run folder with timestamp
- Scoring requires all artifacts in same folder
- Chaining ensures sequential execution in same run

**Common Error:**
```
Error: .ui/runs/20251029-070139-805/keyboard.json not found
```
This means you ran commands separately. Re-run as a chain.
```

**Acceptance Criteria:**
- Windows PowerShell backtick syntax shown
- Linux/Mac && syntax shown
- Explanation of why chaining is needed
- Common error documented

---

### Priority 2: Medium Priority Enhancements

#### Task 4: Add Debugging/Troubleshooting Guide
**Estimated Time:** 60 minutes  
**Impact:** MEDIUM - Reduces iteration cycles, improves error comprehension

**Changes Required:**

Add new section to AGENTS.md:

```markdown
## Debugging Failed Validation

### If `luma ingest` Fails

1. **Check the error details:**
   ```bash
   cat .ui/runs/<run-id>/ingest.json
   ```

2. **Interpret `jsonPointer`:**
   - Example: `"/screen/root/children/3"` means the 4th child (0-indexed)
   - Example: `"/screen/root/children/0/text"` means first child's `text` property

3. **Common Fixes:**

   **"Invalid union" errors:**
   - Wrong property name or type
   - Text: use `text` not `content`
   - Button: use `text` not `label`
   - Button: use `roleHint` not `variant`
   
   **"Required property missing":**
   - Form needs `states` array with "default"
   - Form needs at least 1 field and 1 action
   - Field needs `label` (non-empty)
   - Table needs `title`, `columns`, `responsive.strategy`
   
   **"Invalid type":**
   - Table columns must be strings: `["Name", "Email"]`
   - Not objects: `[{id: "col1", header: "Name"}]`

### If `luma score` is < 85

1. **Check individual artifacts:**
   ```bash
   cat .ui/runs/<run-id>/layout_320x640.json
   cat .ui/runs/<run-id>/keyboard.json
   cat .ui/runs/<run-id>/flow.json
   ```

2. **Common Issues:**

   **Stack padding not in spacingScale:**
   - Symptom: Layout issues at certain viewports
   - Fix: Use only values from spacingScale: `0, 4, 8, 12, 16, 24, 32`
   
   **Touch target < 44px:**
   - Symptom: Scoring penalty for Button/Field
   - Fix: Add `minSize: {w: 44, h: 44}` to interactive elements
   
   **Form actions before fields:**
   - Symptom: Pattern validation failure
   - Fix: Put `fields` array before `actions` array in Form
   
   **Field missing label:**
   - Symptom: Validation error
   - Fix: Every Field must have non-empty `label`

### If `luma keyboard` Shows Wrong Tab Order

1. **Check focusable elements:**
   - Buttons and Fields are focusable by default
   - Tab order follows document order (top to bottom, left to right)

2. **Fix:**
   - Reorder components in scaffold JSON to match desired tab sequence
   - Avoid `tabIndex` unless absolutely necessary

### Pattern Validation Failures

**Pattern names are case-sensitive:**
- ✅ `Form.Basic` (correct)
- ❌ `form` or `form.basic` (wrong)

**List available patterns:**
```bash
luma patterns --list
```

**Run patterns separately:**
```bash
luma flow scaffold.json --patterns Form.Basic
luma flow scaffold.json --patterns Table.Simple
```
```

**Acceptance Criteria:**
- Error interpretation guide for jsonPointer
- Common error table with symptoms and fixes
- Scoring troubleshooting section
- Pattern naming clarification

---

#### Task 5: Add Complete Minimal Valid Scaffold Example
**Estimated Time:** 15 minutes  
**Impact:** MEDIUM - Provides working starting point

**Changes Required:**

Add to AGENTS.md after Preflight section:

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
          "roleHint": "primary",
          "minSize": { "w": 44, "h": 44 }
        }
      ]
    }
  },
  "settings": {
    "spacingScale": [4, 8, 12, 16, 24, 32],
    "minTouchTarget": { "w": 44, "h": 44 },
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

**Test it:**
```bash
# Save to file
echo '<json above>' > test.json

# Validate
luma ingest test.json
```
```

**Acceptance Criteria:**
- Example passes `luma ingest` validation
- Example gets 100/100 score when run through full pipeline
- All required sections present

---

#### Task 6: Clarify Pattern vs Manual Scaffold Creation
**Estimated Time:** 15 minutes  
**Impact:** LOW - Helpful but not blocking

**Changes Required:**

Update "Generating Scaffolds" section in AGENTS.md:

```markdown
### When to Use Pattern Generation vs Manual Creation

**Use `luma scaffold new` (Pattern) when:**
- ✅ Starting a new project
- ✅ Learning LUMA component schemas
- ✅ Building common UI patterns (forms, tables, lists)
- ✅ Need a valid starting point

**Write JSON manually when:**
- ✅ You understand component schemas well
- ✅ Building custom/unique layouts
- ✅ Combining multiple patterns
- ✅ Need fine-grained control over every property

**Recommended Workflow:**
1. Generate from pattern: `luma scaffold new --pattern form-basic`
2. Customize the generated JSON for your needs
3. Validate iteratively with `luma ingest`
4. Run full pipeline once structure is correct
```

**Acceptance Criteria:**
- Clear decision criteria for pattern vs manual
- Recommended hybrid workflow shown

---

## Testing Plan

### Pre-Deployment Tests

1. **Verify All Examples:**
   - Run all JSON examples through `luma ingest`
   - Ensure 100% pass rate

2. **Cross-Reference Check:**
   - Compare AGENT-RULES-SCAFFOLD.md with validator.ts
   - Compare AGENTS.md with AGENT-RULES-SCAFFOLD.md
   - Ensure no conflicting information

3. **Command Validation:**
   - Test PowerShell chaining on Windows
   - Test bash chaining on Linux/Mac (if available)
   - Verify run folder behavior

4. **Pattern Names:**
   - Run `luma patterns --list`
   - Verify documented names match output

### Post-Deployment Validation

1. **Fresh AI Agent Test:**
   - Have a new AI agent attempt to build a simple app
   - Track time spent on schema discovery
   - Compare to baseline (40% before fixes)

2. **Documentation Completeness:**
   - Review feedback categories
   - Verify all High and Medium priority items addressed

---

## Success Metrics

**Before Fixes:**
- 40% of dev time on schema trial-and-error
- 15% of dev time on pipeline debugging
- Multiple validation iteration cycles

**After Fixes (Target):**
- < 10% of dev time on schema issues
- < 5% of dev time on pipeline issues
- Reduce validation iterations by 50%

**Overall Goal:**
- Reduce first-time AI agent friction by ~50%
- Achieve 100/100 LUMA score faster

---

## Implementation Order

1. ✅ Task 1: Fix AGENT-RULES-SCAFFOLD.md (30 min) - **CRITICAL**
2. ✅ Task 2: Add Component Schema Quick Reference (45 min) - **CRITICAL**
3. ✅ Task 3: Add Pipeline Command Chaining (20 min) - **CRITICAL**
4. ✅ Task 4: Add Debugging Guide (60 min) - **IMPORTANT**
5. ✅ Task 5: Add Complete Example (15 min) - **HELPFUL**
6. ✅ Task 6: Clarify Pattern Usage (15 min) - **NICE-TO-HAVE**

**Total Estimated Time:** 3 hours 5 minutes

---

## Files to Modify

**⚠️ CORRECTION REQUIRED (LUMA-47):**

The initial plan targeted the wrong file. Changes should go to:

1. `AGENT-RULES-SCAFFOLD.md` - Fix component schemas (CORRECT ✅)
2. **`src/cli/init.command.ts`** - Update `agentsContent` template (CORRECT ✅)
   - This is what AI agents building apps actually see via `luma init`
3. ~~`AGENTS.md`~~ - This is for LUMA project contributors, not end users (WRONG ❌)

**Rationale:**
- AI agent feedback was about agents **using LUMA** to build apps
- Those agents run `luma init` which generates AGENTS.md from `src/cli/init.command.ts`
- Changes to project's AGENTS.md don't help end users

---

## Rollout Plan

1. **Create feature branch:** `docs/agent-feedback-improvements`
2. **Implement tasks 1-3** (critical fixes)
3. **Test with validation examples**
4. **Implement tasks 4-6** (enhancements)
5. **Final cross-reference check**
6. **Merge to master**
7. **Update CHANGELOG.md** with documentation improvements
8. **Consider version bump:** Patch (1.1.17) or Minor (1.2.0)?

---

## Notes

- All issues verified against actual source code (`validator.ts`)
- Feedback from AI agent with 100/100 LUMA score achievement
- High-quality feedback with quantified impact
- Solutions are complete and actionable
