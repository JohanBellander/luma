# AGENTS.md Documentation Improvement Feedback

**Date**: October 31, 2025  
**Context**: CRM Seven project - Progressive.Disclosure pattern was not tested during initial validation phase

## Problem Identified

During the CRM implementation, I only tested `Form.Basic` and `Table.Simple` patterns but missed `Progressive.Disclosure`, even though the scaffold clearly demonstrates progressive disclosure (Add Contact button shows/hides the form). The pattern was only tested after implementation when explicitly requested.

**Root Cause**: The documentation doesn't require explicit pattern discovery as a mandatory step before validation.

---

## Recommended Documentation Improvements

### 1. Add Pattern Discovery Step Before Validation

**Location**: Insert new section 2.5 between "Produce a Scaffold" (Section 2) and "Validate with LUMA" (Section 3)

```markdown
### 2.5. Identify Applicable Patterns

Before running validation, identify ALL patterns that apply to your scaffold:

**Check your scaffold for these patterns:**

| Pattern | When to Use | Check For |
|---------|-------------|-----------|
| Form.Basic | Any Form component | Form with fields and actions |
| Table.Simple | Any Table component | Table with columns and rows |
| Progressive.Disclosure | Hidden/collapsible UI | Buttons that show/hide content, collapsible sections, modals |

**Command to check all available patterns:**
```bash
luma patterns --list
```

**For each pattern, check the rules:**
```bash
luma patterns --show <pattern-name>
```

**Build your pattern list:**
- ✅ Has Form? → Add `Form.Basic`
- ✅ Has Table? → Add `Table.Simple`
- ✅ Has show/hide interaction? → Add `Progressive.Disclosure`
```

---

### 2. Update Step 3 with Pattern Detection Checklist

**Location**: Replace the current Step 3 validation commands section

```markdown
### 3. Validate with LUMA

**BEFORE running validation, complete this checklist:**

**Pattern Detection Checklist:**
- [ ] Does scaffold contain Form component? → Include `Form.Basic`
- [ ] Does scaffold contain Table component? → Include `Table.Simple`
- [ ] Does scaffold have buttons that show/hide content? → Include `Progressive.Disclosure`
- [ ] Does scaffold have multi-step navigation? → Include `Form.MultiStep` (if applicable)
- [ ] Review `luma patterns --list` for other applicable patterns

**Example Pattern Selection:**
```markdown
Scaffold has:
✓ Form (contact-form) → Form.Basic
✓ Table (contacts-table) → Table.Simple
✓ Button that shows form (add-contact-btn) → Progressive.Disclosure

Pattern list: "Form.Basic,Table.Simple,Progressive.Disclosure"
```

**Then run the full LUMA pipeline:**

**Windows PowerShell:**
```powershell
luma ingest ui/screens/<screen>.mock.json; `
luma layout ui/screens/<screen>.mock.json --viewports 320x640,768x1024; `
luma keyboard ui/screens/<screen>.mock.json; `
luma flow ui/screens/<screen>.mock.json --patterns "<YOUR_PATTERN_LIST>"
```

**macOS/Linux:**
```bash
luma ingest ui/screens/<screen>.mock.json && \
luma layout ui/screens/<screen>.mock.json --viewports 320x640,768x1024 && \
luma keyboard ui/screens/<screen>.mock.json && \
luma flow ui/screens/<screen>.mock.json --patterns "<YOUR_PATTERN_LIST>"
```

Then score the run:
```bash
luma score .ui/runs/<run-id>
```
```

---

### 3. Add Pattern Detection Decision Tree

**Location**: Insert new section after "Component Schema Quick Reference" and before "Design & Development Workflow"

```markdown
## Pattern Detection Guide

**How to identify which patterns apply to your scaffold:**

### Quick Decision Tree

```
Does your scaffold have...

├─ Form component?
│  └─ YES → Add "Form.Basic"
│
├─ Table component?
│  └─ YES → Add "Table.Simple"
│
├─ Button that shows/hides other components?
│  └─ YES → Add "Progressive.Disclosure"
│      Examples:
│      - "Add Item" button → shows form
│      - "Show More" button → expands content
│      - "Edit" button → shows modal
│      - Any button with visible="false" target
│
├─ Multi-page form with "Next"/"Previous"?
│  └─ YES → Add "Form.MultiStep"
│
└─ Check `luma patterns --list` for others
```

### Pattern Signatures in Scaffolds

**Form.Basic Pattern Signature:**
```json
{
  "type": "Form",
  "fields": [...],  // Non-empty
  "actions": [...]  // Non-empty
}
```
**When you see this:** A Form component with fields and action buttons
**Pattern to test:** `Form.Basic`

---

**Table.Simple Pattern Signature:**
```json
{
  "type": "Table",
  "columns": [...],  // String array
  "responsive": {...}
}
```
**When you see this:** A Table component with columns and responsive strategy
**Pattern to test:** `Table.Simple`

---

**Progressive.Disclosure Pattern Signature:**
```json
// Scenario 1: Button that controls visibility
{
  "type": "Button",
  "text": "Add/Show/Expand/Edit..."
}
// + Component that starts hidden or becomes hidden
{
  "visible": false  // or toggled by button
}

// Scenario 2: Modal/dialog patterns
{
  "type": "Button",
  "text": "Open..."
}
// + Form/content that appears on click

// Scenario 3: Collapsible sections
{
  "type": "Button",
  "text": "Show More/Less"
}
// + Content that expands/collapses
```
**When you see this:** Any button that reveals/hides content
**Pattern to test:** `Progressive.Disclosure`

---

### Pattern Detection Checklist

Use this checklist for EVERY scaffold:

```
Pattern Detection Checklist:
□ Run `luma patterns --list` to see all available patterns
□ Scan scaffold for Form components → Add Form.Basic
□ Scan scaffold for Table components → Add Table.Simple
□ Scan scaffold for show/hide interactions → Add Progressive.Disclosure
□ Scan scaffold for multi-step flows → Add Form.MultiStep (if applicable)
□ Check if any other patterns apply
□ Document pattern list: "Pattern1,Pattern2,Pattern3"
□ Run flow validation with ALL patterns
□ Verify ALL patterns pass (no MUST failures)
```

**🚨 CRITICAL: Run ALL applicable patterns, not just one!**

Missing even one pattern means incomplete validation and potential UX issues.
```

---

### 4. Update Pre-Implementation Checkpoint

**Location**: Section 4.5 "PRE-IMPLEMENTATION CHECKPOINT"

**Add after "Functional Completeness Audit":**

```markdown
**2. Pattern Coverage Audit:**

Before proceeding to implementation, verify ALL applicable patterns were tested:

- [ ] Reviewed `luma patterns --list` output
- [ ] Identified ALL applicable patterns in scaffold
- [ ] Ran flow validation with complete pattern list
- [ ] No pattern-related MUST failures
- [ ] Documented which patterns apply and why

**Example Audit:**
```
Pattern Coverage Check:
✓ Form component exists → Form.Basic tested ✓
✓ Table component exists → Table.Simple tested ✓
✓ Button shows/hides form → Progressive.Disclosure tested ✓
✓ No multi-step flow → Form.MultiStep not applicable
✓ Checked patterns list → No other patterns apply

Pattern string used: "Form.Basic,Table.Simple,Progressive.Disclosure"
All patterns passed: YES
```

**Common Missing Pattern Indicators:**

| If Scaffold Has... | Missing Pattern Risk | Check For |
|-------------------|---------------------|-----------|
| Button with "Add/New/Create" | Progressive.Disclosure | Does button show hidden form? |
| Button with "Edit/View Details" | Progressive.Disclosure | Does button open modal/expand section? |
| Button with "Show More/Less" | Progressive.Disclosure | Does button toggle content visibility? |
| Multiple form pages | Form.MultiStep | Does form have navigation between pages? |

**🚨 CHECKPOINT FAILURE = Incomplete pattern coverage**

If you answer "no" or "unsure" to pattern coverage:
1. 🛑 DO NOT start implementation
2. 📝 Review `luma patterns --list` again
3. 🔍 Identify missing patterns
4. 🔄 Re-run LUMA flow validation with complete pattern list
5. ✅ Only proceed when ALL patterns tested and passed
```

---

### 5. Add to Common Pitfalls Section

**Location**: Section "⚠️ Common Pitfalls to Avoid"

**Add as new pitfall #5:**

```markdown
**5. "Partial Pattern Testing" - MAJOR VALIDATION GAP**
- ❌ "I tested Form.Basic, that's enough"
- ❌ "I only ran the obvious patterns"
- ❌ "Table and Form patterns passed, I'm good to go"
- ❌ Running flow with only 1-2 patterns when 3+ apply
- ❌ Not checking `luma patterns --list` before validation
- ✅ "I identified ALL applicable patterns and tested each one"
- ✅ "I consulted `luma patterns --list` during validation"
- ✅ "I verified no show/hide interactions were missed"

**Real Example - What Went Wrong:**
```
CRM Scaffold had:
✓ Form component → Tested Form.Basic
✓ Table component → Tested Table.Simple
✗ Button showing/hiding form → MISSED Progressive.Disclosure!

Result: Incomplete validation, pattern tested post-implementation
```

**How to Avoid:**
1. **ALWAYS** run `luma patterns --list` BEFORE validation
2. Check your scaffold against EACH pattern's signature
3. Look for hidden/show/toggle interactions (Progressive.Disclosure)
4. Include ALL applicable patterns in `--patterns` flag
5. Document which patterns apply and why in comments
6. Add pattern detection to your pre-implementation checklist

**Red Flag Patterns to Watch For:**
- Button text contains: "Add", "New", "Create", "Edit", "Show", "Open", "Expand"
- Components with `visible: false` or visibility toggles
- Modal dialogs or overlays
- Collapsible sections or accordions
- Multi-step workflows

**When you see these → Check if Progressive.Disclosure or other patterns apply!**
```

---

### 6. Update "Key Rules" Table

**Location**: Section "Key Rules" table

**Add new row:**

```markdown
| Do | Do Not |
|---|---|
| Design UI in scaffold form first | Jump straight to HTML/JSX |
| Run `luma score` before coding | Ignore failing pattern rules |
| Use `luma scaffold new` for quick starts | Write invalid JSON manually |
| **Run `luma patterns --list` before validation** | **Assume you know which patterns apply** |
| **Test ALL applicable patterns (Form, Table, Progressive.Disclosure, etc.)** | **Only test 1-2 "obvious" patterns** |
| **Implement ONLY what's in approved scaffold** | **Add features during implementation** |
| **Map scaffold components 1:1 to HTML** | **Add extra form fields, buttons, or sections** |
| **Preserve all scaffold component IDs** | **Rename or omit scaffold-defined IDs** |
| Iterate until layout/flow are correct | Hardcode layout fixes in CSS later |
| Keep scaffolds committed in VCS | Let scaffolds drift from implementation |
```

---

## Summary of Changes

### What's Missing in Current Documentation:
1. ❌ No explicit pattern discovery step
2. ❌ No checklist for identifying applicable patterns
3. ❌ No decision tree or pattern signatures
4. ❌ No pattern coverage verification in checkpoint
5. ❌ No warning about partial pattern testing

### What Needs to Be Added:
1. ✅ Section 2.5: Pattern discovery as mandatory step
2. ✅ Updated Section 3: Pattern detection checklist before validation
3. ✅ New section: Pattern Detection Guide with decision tree
4. ✅ Updated Section 4.5: Pattern coverage audit in checkpoint
5. ✅ New pitfall: "Partial Pattern Testing"
6. ✅ Updated Key Rules: Pattern discovery requirement

### Expected Impact:
- Agents will explicitly identify ALL patterns before validation
- Progressive.Disclosure won't be missed for show/hide interactions
- Pattern coverage becomes part of the approval checklist
- Reduces validation gaps and post-implementation discoveries

---

## Validation of Improvements

**Test Case**: CRM Scaffold with Form, Table, and Add Contact button

**Current Flow (Missing Progressive.Disclosure):**
1. Create scaffold with Form + Table + Button (shows form)
2. Run validation with `--patterns "Form.Basic,Table.Simple"`
3. ❌ Miss Progressive.Disclosure pattern
4. Proceed to implementation
5. Discover pattern later

**Improved Flow (Complete Pattern Coverage):**
1. Create scaffold with Form + Table + Button (shows form)
2. **Run `luma patterns --list`** ← NEW STEP
3. **Check Pattern Detection Checklist** ← NEW STEP
   - ✓ Form → Form.Basic
   - ✓ Table → Table.Simple
   - ✓ Button shows form → **Progressive.Disclosure** ← CAUGHT!
4. Run validation with `--patterns "Form.Basic,Table.Simple,Progressive.Disclosure"`
5. ✓ ALL patterns pass
6. **Complete Pattern Coverage Audit** ← NEW CHECKPOINT
7. Proceed to implementation with confidence

---

## Implementation Priority

**High Priority** (Prevents validation gaps):
1. Section 2.5: Pattern Discovery step
2. Section 4.5: Pattern Coverage Audit
3. Pitfall #5: Partial Pattern Testing

**Medium Priority** (Improves clarity):
4. Pattern Detection Guide with decision tree
5. Updated Section 3 checklist

**Low Priority** (Nice to have):
6. Updated Key Rules table

---

## Additional Recommendations

### Consider Adding:
1. **Pattern quick reference card** at the top of AGENTS.md
2. **Example scaffolds** for each pattern (with annotations)
3. **Pattern combination matrix** (which patterns commonly appear together)
4. **Automated pattern detection** (if LUMA could auto-suggest patterns)

### Future Enhancements:
- Could LUMA have a `--detect-patterns` flag that scans scaffold and suggests patterns?
- Could `luma ingest` warn if Form/Table detected but no patterns specified?
- Could pattern detection be part of the score (deduct points for missing applicable patterns)?

---

## Conclusion

The core issue is treating pattern testing as optional rather than mandatory. By making pattern discovery an explicit, checkpointed step with clear indicators and checklists, agents will consistently test ALL applicable patterns before implementation.

**Key Principle**: "If your scaffold has the structure, you must test the pattern."
