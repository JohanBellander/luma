# LUMA Tool Feedback - Pattern Detection & Guidance

**Date:** November 1, 2025  
**Context:** AI agent following AGENTS.md workflow to build CRM app  
**Issue:** Did not run Guided.Flow pattern validation initially

---

## Problem Summary

When following the AGENTS.md workflow, I only tested Form.Basic and Table.Simple patterns initially, missing Guided.Flow entirely. The scaffold actually passed all 7 MUST rules and 4 SHOULD rules for Guided.Flow when tested later.

---

## Root Causes

### 1. Pattern Detection Checklist Incomplete

**Location:** AGENTS.md, Section 2a "Pattern Detection Checklist"

**Current Coverage:**
- ✅ Form.Basic - "Does your scaffold have a Form node?"
- ✅ Table.Simple - "Does your scaffold have a Table node?"
- ✅ Progressive.Disclosure - "Does your scaffold have show/hide/toggle UI?"

**Missing:**
- ❌ Guided.Flow - No decision tree entry

**Impact:** Agent had no trigger to consider testing Guided.Flow

### 2. Unclear Pattern Applicability

**Pattern Name:** Guided.Flow  
**Source URL:** https://www.nngroup.com/articles/wizard-design/

**My Mental Model:**
- "Guided.Flow" + "wizard-design" → Multi-step wizards only
- My scaffold has single-screen form → Doesn't apply

**Reality:**
- Pattern validates even single-screen action flows
- Tests form states (default → submitting → success/error)
- Applies to simple forms with clear action sequences

**Gap:** Pattern name/documentation creates mental model mismatch

### 3. No "Test All Patterns" Guidance

**Current AGENTS.md approach:**
```bash
luma flow ui/screens/<screen>.mock.json --patterns form,table
```

**Interpreted As:** "Only test patterns you think apply"

**Missing Guidance:**
- Should I test all available patterns?
- Are there performance/time costs to testing everything?
- Is there a "default" pattern set?

### 4. No Pattern Discovery Mechanism

**Current Workflow:**
1. Agent reads `luma patterns --list`
2. Agent manually decides which apply
3. Agent specifies patterns explicitly

**Missing:**
- No automated pattern suggestion
- No scaffold analysis for pattern applicability
- No warning about untested patterns

---

## Improvement Suggestions

### 1. Expand Pattern Detection Checklist ⭐

**Add to AGENTS.md Section 2a:**

```markdown
Does your scaffold have navigation between screens/steps?
  → YES: Include Guided.Flow in --patterns

Does your scaffold have Next/Previous/Submit/Back buttons?
  → LIKELY: Include Guided.Flow in --patterns

Does your scaffold have Form with multiple states?
  → YES: Include Guided.Flow in --patterns (validates state transitions)
```

**Why This Helps:** Gives agents clear triggers for when to test Guided.Flow

---

### 2. Add Pattern Suggestion Command ⭐⭐⭐

**New Command:**
```bash
luma patterns --suggest <scaffold-file>
```

**Example Output:**
```
Analyzing: ui/screens/crm-contacts.mock.json

Recommended patterns:
  ✓ Form.Basic - Found Form node with fields[] and actions[]
  ✓ Table.Simple - Found Table node with columns[]
  ✓ Progressive.Disclosure - Found behaviors.disclosure hint
  ? Guided.Flow - Found action buttons and form states (consider testing)

Suggested command:
  luma flow ui/screens/crm-contacts.mock.json --patterns Form.Basic,Table.Simple,Guided.Flow
```

**Why This Helps:**
- Removes guesswork for pattern selection
- Educational (shows why patterns apply)
- Can be used by agents and humans

---

### 3. Default Behavior: Test All Applicable Patterns ⭐⭐

**Current:**
```bash
# Must specify patterns explicitly
luma flow <file> --patterns Form.Basic,Table.Simple
```

**Proposed:**
```bash
# No --patterns = test all patterns, report which apply
luma flow <file>

# Output shows tested vs skipped:
# ✓ Form.Basic - 4 MUST passed
# ✓ Guided.Flow - 7 MUST passed
# ⊘ Multi.Step - Skipped (no step markers found)
```

**Why This Helps:**
- Ensures comprehensive validation by default
- Users can still use `--patterns` to limit testing
- Reduces cognitive load ("Did I test everything?")

---

### 4. Pattern Coverage Report ⭐

**Add to `luma score` command:**
```bash
luma score <run-folder> --show-coverage
```

**Example Output:**
```
Overall Score: 100/100

Pattern Coverage:
  ✓ Form.Basic (tested)
  ✓ Table.Simple (tested)
  ✓ Progressive.Disclosure (auto-activated)
  
Untested Patterns:
  ? Guided.Flow - May apply to your scaffold (7 MUST rules)
    Run: luma flow ui/screens/crm-contacts.mock.json --patterns Guided.Flow
```

**Why This Helps:**
- Post-validation safety net
- Shows what might be missing
- Actionable next steps

---

### 5. Improve Pattern Documentation ⭐⭐

**Add to `luma patterns --show Guided.Flow`:**

```
Pattern: Guided.Flow
Source: LUMA Spec – Guided Flow (v1.1-GF)

Applies When:
  • Multi-step wizards (checkout, onboarding, registration)
  • Single-screen flows with state transitions (form submission → success/error)
  • Sequential task completion
  • Navigation between screens
  • Action buttons that change application state

Examples:
  ✓ Contact form with save → success/error states
  ✓ Multi-page checkout flow
  ✓ Onboarding wizard with next/previous
  ✗ Static content page (no actions)

MUST Rules (7):
  1. [Rule description]
  ...
```

**Why This Helps:**
- Clarifies "when does this pattern apply?"
- Provides concrete examples (including simple cases)
- Reduces mental model mismatches

---

### 6. Update AGENTS.md Default Workflow ⭐

**Current Example:**
```powershell
luma flow ui/screens/<screen>.mock.json --patterns form,table
```

**Updated Example:**
```powershell
# RECOMMENDED: Test all major patterns (comprehensive validation)
luma flow ui/screens/<screen>.mock.json --patterns Form.Basic,Table.Simple,Guided.Flow

# OR: Let LUMA suggest patterns
luma patterns --suggest ui/screens/<screen>.mock.json
# Then run the suggested command
```

**Why This Helps:**
- Sets expectation: "test comprehensively by default"
- Shows all major patterns in example
- Introduces pattern suggestion workflow

---

### 7. Pattern Name Consistency ⭐

**Current Pattern Names:**
- `Form.Basic` (Component.Variant)
- `Table.Simple` (Component.Variant)
- `Progressive.Disclosure` (Adjective.Noun)
- `Guided.Flow` (Adjective.Noun)

**Suggestion:** Consider renaming for clarity:
- `Flow.Guided` → Matches Component.Variant pattern
- `Action.Flow` → Broader, less "wizard-specific"
- Or keep `Guided.Flow` but emphasize it's not wizard-only

**Why This Helps:**
- Name consistency aids pattern discovery
- "Flow.Guided" groups with other flow patterns
- Reduces "this is only for wizards" misconception

---

## Real-World Impact

**What Happened:**
1. Built CRM scaffold with form + table
2. Tested Form.Basic + Table.Simple only
3. Got 100/100 score
4. Assumed validation was complete
5. Later discovered Guided.Flow also passed (but wasn't tested initially)

**No Harm Done Because:**
- Guided.Flow passed when tested later
- Implementation was already correct

**Potential Risk:**
- If scaffold had Guided.Flow violations, would have been missed
- Would have implemented non-validated UX patterns
- Could have caught issues earlier with better guidance

---

## Priority Recommendations

**High Priority (Do These First):**
1. ⭐⭐⭐ Add `luma patterns --suggest <file>` command
2. ⭐⭐ Update pattern documentation with "Applies When" examples
3. ⭐ Add Guided.Flow to AGENTS.md pattern checklist

**Medium Priority:**
4. ⭐⭐ Default behavior: test all patterns (with opt-out via --patterns)
5. ⭐ Add pattern coverage report to scoring

**Nice to Have:**
6. Pattern naming consistency review
7. AGENTS.md workflow examples showing comprehensive testing

---

## Conclusion

The LUMA validation framework is excellent - this feedback is purely about **discoverability and guidance**. The tool works perfectly once you know to test Guided.Flow; the challenge is knowing when to test it.

Adding pattern suggestion/discovery mechanisms would make the tool more accessible to both AI agents and human developers following the workflow.

**Key Insight:** Pattern selection should be obvious from scaffold structure, not require domain knowledge about pattern applicability.
