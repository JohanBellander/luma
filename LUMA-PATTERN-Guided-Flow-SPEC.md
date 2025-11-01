# LUMA Pattern Specification — Guided Flow (v1.1-GF)
_This document is an **additive** specification to LUMA v1.1. It introduces an optional UX pattern validator for multi‑step “wizard” flows without changing existing behavior._

- Pattern name (CLI): `guided-flow`
- Pattern id (internal): `Guided.Flow`
- Scope: Structural & flow validation only (no DOM; no styling; no runtime simulation)
- Compatibility: Backward‑compatible; inactive unless requested or hinted
- Targets: `luma flow` command; `luma patterns` self-describe; scoring
- Related tools: `luma keyboard` (sequence checks referenced below)

---

## 0. Rationale & Sources
**Goal:** Lead users through a complex task one step at a time with clear progress and predictable actions.

**Why it matters:** Reduces friction and errors, improves completion, and sets expectations across multi‑step tasks (onboarding, checkout, setup).

**Primary Action Visibility (GF-SHOULD-4 Rationale):** Keeping the primary action (Next / Finish) visible without scrolling at the smallest viewport reduces abandonment and increases conversion. Users losing sight of the core progression or completion action introduce cognitive overhead and can produce premature exits. This SHOULD rule guides layout refinements early—before visual/UI implementation—by nudging designers to elevate or reduce vertical bloat.

**Primary references (cite in issues):**
- Nielsen Norman Group — Wizards & Multi‑Step Forms
- USWDS — Step Indicators
- Material Design — Steppers / Progress
- GOV.UK — Start pages & check before you start (step clarity)

> These sources are for rationale strings; do not fetch content at runtime.

---

## 1. Schema Additions (Optional, Non‑breaking)
This pattern activates via **hints**. The base scaffold schema (v1.0.0) remains unchanged.

### 1.1 Optional Hints for Wizard Containers and Steps
Hints may appear on a **wizard container** and/or **step nodes**.

```json
// May appear on a wizard container (Stack/Grid/Box/Form used as the flow wrapper)
"behaviors": {
  "guidedFlow": {
    "role": "wizard",
    "totalSteps": 4,
    "hasProgress": true,
    "progressNodeId": "progress-1"  // optional, resolves to a visible Text/StepIndicator
  }
}

// Must appear on each step node
"behaviors": {
  "guidedFlow": {
    "role": "step",
    "stepIndex": 1,
    "totalSteps": 4,           // recommended to repeat for self‑containment
    "nextId": "next-1",        // optional explicit mapping; else discovered by roleHint/text
    "prevId": "back-1"         // optional explicit mapping on steps > 1
  }
},
"affordances": ["progress-indicator"] // optional; used for SHOULD checks
```

**Notes**
- A **step node** is typically a `Stack` vertical with its own fields and an actions row.
- If a **wizard container** exists, its direct children that have `guidedFlow.role:"step"` are considered steps for that wizard. If no explicit container exists, all nodes marked with `role:"step"` on the screen form the sequence.
- `totalSteps` on steps should match container `totalSteps` when present.

**Defaults**
- If `totalSteps` is missing on a step, derive from the max `stepIndex` across all steps.
- `hasProgress` defaults to `false`.

---

## 2. Activation Conditions
Validator runs when **either**:
1. CLI explicitly requests the pattern:
   ```bash
   luma flow screen.json --patterns guided-flow
   ```
2. Any node has `behaviors.guidedFlow.role` set to `"wizard"` or `"step"`.

If neither is true, the validator is **inactive** and emits no issues.

---

## 3. Validation Rules (Deterministic)

### 3.1 MUST Rules

**GF‑MUST‑1: Contiguous Steps 1..N**
- Across all steps in the same flow scope, `stepIndex` values must be unique and form the contiguous range `1..totalSteps`.
- If container exists with `totalSteps`, all steps must belong to that container (direct or clearly grouped children).

**Issue:** `wizard-steps-missing` (error)  
**Details:** include `expectedRange`, `foundIndices`, and `scopeNodeId`.

---

**GF‑MUST‑2: Navigation Actions Present**
- For each step:
  - **First step (index 1):** must have a **Next** action; **Back** is **not allowed**.
  - **Intermediate (1 < i < N):** must have both **Back** and **Next**.
  - **Last step (index N):** must have **Finish/Submit** (treated as primary).

**How to identify actions**
- Prefer explicit references via `nextId` / `prevId`.
- Else, search within the step’s actions row (end of step subtree) for `Button`s by:
  - `roleHint:"primary"` + text ∈ { "Next", "Continue", "Finish", "Submit" } (case‑insensitive), or
  - text heuristics: back ∈ { "Back", "Previous" }, next ∈ { "Next", "Continue" }, finish ∈ { "Finish", "Submit", "Done" }.

**Issues:**
- `wizard-next-missing` (error)
- `wizard-back-illegal` (error) for step 1 if Back exists
- `wizard-back-missing` (error) for steps 2..N−1
- `wizard-finish-missing` (error) for step N

Include `stepIndex`, `nodeId`, and `suggestion` with minimal action snippet (see §5).

---

**GF‑MUST‑3: Actions After Fields**
- Within a step subtree, **Fields** must appear before the **Actions row** (conforms with Form.Basic).

**Issue:** `wizard-field-after-actions` (error)

---

**GF‑MUST‑4: Single Primary per Step**
- Each step’s action row must contain at most **one** primary action (`roleHint:"primary"`).

**Issue:** `wizard-multiple-primary` (error)

---

### 3.2 SHOULD Rules

**GF‑SHOULD‑1: Progress Indicator Present when hasProgress**
- If wizard/container `hasProgress:true`, a progress node should exist and be visible:
  - Either identified by `progressNodeId`, or
  - Discovered via `affordances` containing `"progress-indicator"` or a Text/StepIndicator near the top of the wizard container.

**Issue:** `wizard-progress-missing` (warn)

---

**GF‑SHOULD‑2: Back before Next in Action Order**
- In the step’s actions row, **Back** should precede **Next/Finish** in keyboard flow order (left‑to‑right or sequence order).

**Issue:** `wizard-actions-order` (warn)

---

**GF‑SHOULD‑3: Step Titles Present**
- Each step should expose a user‑visible title/heading (`Text` near the top of the step subtree).

**Issue:** `wizard-step-title-missing` (warn)

---

**GF‑SHOULD‑4: Primary Above Fold at Smallest Viewport**
- At the smallest configured viewport, the step’s primary action should be within the viewport height according to the headless layout.
- This reuses the existing layout solver’s frames; if the primary is below fold at the smallest viewport, emit a **warn** (the layout command may also emit its own error depending on global policy).

**Issue:** `wizard-primary-below-fold` (warn, reference layout viewport)

**Rationale:** Maintain visibility of the action that moves the user forward—avoids loss of momentum and ensures continual affordance recognition. (NNG wizard design + common checkout funnel studies)
### 3.3 MUST vs SHOULD Summary Table

| ID | Level | Description | Rationale (Abbrev.) |
|----|-------|-------------|---------------------|
| GF-MUST-1 | MUST | Contiguous unique step indices 1..N | Prevents broken navigation & orphaned steps |
| GF-MUST-2 | MUST | Required navigation actions per step (Next/Back/Finish rules) | Guarantees deterministic forward/back progress |
| GF-MUST-3 | MUST | Fields precede actions row | Aligns with Form.Basic ergonomics & scanning order |
| GF-MUST-4 | MUST | Single primary action per step | Avoids decision paralysis & focuses progression |
| GF-SHOULD-1 | SHOULD | Progress indicator when hasProgress=true | Reinforces mental model of position & remaining effort |
| GF-SHOULD-2 | SHOULD | Back precedes Next/Finish | Follows conventional left-to-right / tab order for predictability |
| GF-SHOULD-3 | SHOULD | Visible step title/heading | Provides contextual grounding per step |
| GF-SHOULD-4 | SHOULD | Primary action above fold at smallest viewport | Preserves forward-action visibility, reduces abandonment |

> NOTE: If future layout heuristics evolve, GF-SHOULD-4 may transition to MUST for critical conversion flows; current stance: warn-level suffices for early design iteration.


---

## 4. Flow & Scope Resolution

**Scope (wizard container vs global):**
- If a **wizard container** exists, only its descendant steps belong to that flow.
- If none exists, all `role:"step"` nodes on the screen are grouped into a single flow ordered by `stepIndex`.
- Steps from different scopes must not share the same `stepIndex` range; if ambiguous, include `scopeNodeId` in details.

**Action Row Detection:**
- Prefer explicit `Form.actions` when a step uses a `Form`.
- Else, the step’s last `Stack` horizontal with primarily `Button`s is treated as the actions row.
- Else, search the step subtree for a leaf `Stack` whose children are Buttons (≥1), and which is the **last** focus cluster in `luma keyboard` sequence.

---

## 5. Suggestions (Deterministic Text)

**For `wizard-steps-missing`:**
```
Define a contiguous sequence of steps 1..N. Example:
"behaviors":{ "guidedFlow":{ "role":"step", "stepIndex":2, "totalSteps":4 } }
```

**For `wizard-next-missing` (first or intermediate step):**
```
Add a Next button in the step’s action row:
{ "id":"next-<i>", "type":"Button", "text":"Next", "roleHint":"primary" }
```

**For `wizard-back-missing` (intermediate step):**
```
Add a Back button before Next:
{ "id":"back-<i>", "type":"Button", "text":"Back" }
```

**For `wizard-back-illegal` (first step):**
```
Remove Back from the first step or move it to step 2.
```

**For `wizard-finish-missing` (last step):**
```
Add a Finish/Submit button in the last step’s action row:
{ "id":"finish", "type":"Button", "text":"Finish", "roleHint":"primary" }
```

**For `wizard-field-after-actions`:**
```
Ensure fields appear before the actions row within each step.
```

**For `wizard-multiple-primary`:**
```
Keep only one primary action per step; demote secondary buttons (remove roleHint).
```

**For `wizard-progress-missing`:**
```
Add a visible progress indicator and reference it:
"behaviors":{"guidedFlow":{"role":"wizard","hasProgress":true,"progressNodeId":"progress-1"}}
{ "id":"progress-1", "type":"Text", "text":"Step 1 of 4" }
```

**For `wizard-actions-order`:**
```
Order actions as Back, then Next/Finish in the actions row.
```

**For `wizard-step-title-missing`:**
```
Add a heading at the top of each step:
{ "type":"Text", "id":"step-<i>-title", "text":"Step <i> — Details" }
```

**For `wizard-primary-below-fold`:**
```
Reduce vertical content or move the primary action higher so it appears within the initial viewport at the smallest breakpoint.
```

---

## 6. Issue Model
Use the canonical LUMA Issue shape and include where applicable:
- `nodeId` (step or wizard container)
- `jsonPointer` (path to the offending node)
- `viewport` (for below‑fold warn)
- `source` (one of the references listed in §0)
- `details` (e.g., stepIndex, expectedRange, foundIndices)
- `suggestion` (from §5)

Issue IDs for this pattern:
- `wizard-steps-missing` (error)
- `wizard-next-missing` (error)
- `wizard-back-illegal` (error)
- `wizard-back-missing` (error)
- `wizard-finish-missing` (error)
- `wizard-field-after-actions` (error)
- `wizard-multiple-primary` (error)
- `wizard-progress-missing` (warn)
- `wizard-actions-order` (warn)
- `wizard-step-title-missing` (warn)
- `wizard-primary-below-fold` (warn)

---

## 7. CLI Integration
- `luma flow screen.json --patterns guided-flow`
  - Runs the validator and writes `flow.json` entries for `Guided.Flow`.
- Auto‑activation when hints are present (`role:"wizard"` or `"step"`).
- `luma patterns --list` includes `Guided.Flow`.
- `luma patterns --show Guided.Flow --json` outputs MUST/SHOULD tables with rationale & sources.

---

## 8. Scoring
- Category: **Pattern Fidelity** (45% of overall)
- Penalties within this pattern:
  - MUST failure: −30
  - SHOULD failure: −10
- Floor per category: 0
- Report `patternScore` plus `deductions[]` for this pattern

---

## 9. Acceptance Tests

### 9.1 Passing Example
- Wizard with 3 steps (`1..3`) inside a container; each step has required actions; Back not shown on step 1; Finish on step 3; progress Text present; Back precedes Next in action row.

**Expected:** No errors; optional warns absent if progress and ordering are correct.

### 9.2 MUST Fail Cases
1. **Missing step indices**: steps 1 and 3 defined, step 2 absent → `wizard-steps-missing`.
2. **No Next on step 1** → `wizard-next-missing`.
3. **Back on step 1** → `wizard-back-illegal`.
4. **Missing Back on step 2** → `wizard-back-missing`.
5. **Missing Finish on last step** → `wizard-finish-missing`.
6. **Fields after actions** within a step → `wizard-field-after-actions`.
7. **Multiple primary actions** within a step → `wizard-multiple-primary`.

### 9.3 SHOULD Warn Cases
1. No progress indicator when `hasProgress:true` → `wizard-progress-missing`.
2. Action order places Next before Back → `wizard-actions-order`.
3. Step without heading → `wizard-step-title-missing`.
4. Primary below fold at smallest viewport → `wizard-primary-below-fold` (warn; layout provides frames).

### 9.4 Backward Compatibility
- If the pattern isn’t requested and no `guidedFlow` hints are present, the validator is silent.

---

## 10. Examples (JSON Fragments)

### 10.1 Wizard Container + Steps (Valid)
```json
{
  "id": "setup-wizard",
  "type": "Stack",
  "direction": "vertical",
  "behaviors": { "guidedFlow": { "role": "wizard", "totalSteps": 3, "hasProgress": true, "progressNodeId": "progress" } },
  "children": [
    { "id": "progress", "type": "Text", "text": "Step 1 of 3" },
    {
      "id": "step1",
      "type": "Stack",
      "behaviors": { "guidedFlow": { "role": "step", "stepIndex": 1, "totalSteps": 3, "nextId": "next-1" } },
      "children": [
        { "id": "name", "type": "Field", "label": "Name" },
        { "id": "actions-1", "type": "Stack", "direction": "horizontal", "children": [
          { "id": "next-1", "type": "Button", "text": "Next", "roleHint": "primary" }
        ]}
      ]
    }
  ]
}
```

### 10.2 Intermediate Step (Valid)
```json
{
  "id": "step2",
  "type": "Stack",
  "behaviors": { "guidedFlow": { "role": "step", "stepIndex": 2, "totalSteps": 3, "prevId": "back-2", "nextId": "next-2" } },
  "children": [
    { "id": "email", "type": "Field", "label": "Email" },
    { "id": "actions-2", "type": "Stack", "direction": "horizontal", "children": [
      { "id": "back-2", "type": "Button", "text": "Back" },
      { "id": "next-2", "type": "Button", "text": "Next", "roleHint": "primary" }
    ]}
  ]
}
```

### 10.3 Last Step (Valid)
### 10.4 Failing Example – Primary Action Below Fold (Triggers GF-SHOULD-4)
Smallest viewport height: 640. Suppose the Finish button frame is `{ "y": 700, "h": 44 }` → bottom = 744 > 640.

```json
{
  "id": "step3",
  "type": "Stack",
  "behaviors": { "guidedFlow": { "role": "step", "stepIndex": 3, "totalSteps": 3, "prevId": "back-3" } },
  "children": [
    { "id": "long-content", "type": "Text", "text": "(Many paragraphs causing vertical overflow...)" },
    { "id": "actions-3", "type": "Stack", "direction": "horizontal", "children": [
      { "id": "back-3", "type": "Button", "text": "Back" },
      { "id": "finish", "type": "Button", "text": "Finish", "roleHint": "primary" }
    ]}
  ]
}
```

**Result:** `wizard-primary-below-fold` warn suggests reducing content height or elevating actions.

### 10.5 State Transition Snippet (Multi-Step Progress)
Demonstrates form submission state changes inside a step (optional; complements flow analysis):

```json
{
  "id": "step2",
  "type": "Form",
  "title": "Account Details",
  "behaviors": { "guidedFlow": { "role": "step", "stepIndex": 2, "totalSteps": 3, "prevId": "back-2", "nextId": "next-2" } },
  "fields": [
    { "id": "email", "type": "Field", "label": "Email", "inputType": "email", "required": true },
    { "id": "password", "type": "Field", "label": "Password", "inputType": "password", "required": true }
  ],
  "actions": [
    { "id": "back-2", "type": "Button", "text": "Back" },
    { "id": "next-2", "type": "Button", "text": "Next", "roleHint": "primary" }
  ],
  "states": ["default", "submitting", "error"]
}
```

State transitions (e.g., disabling Next during `submitting`) are not simulated; scaffold presence ensures completeness.

```json
{
  "id": "step3",
  "type": "Stack",
  "behaviors": { "guidedFlow": { "role": "step", "stepIndex": 3, "totalSteps": 3, "prevId": "back-3" } },
  "children": [
    { "id": "confirm", "type": "Text", "text": "Confirm details" },
    { "id": "actions-3", "type": "Stack", "direction": "horizontal", "children": [
      { "id": "back-3", "type": "Button", "text": "Back" },
      { "id": "finish", "type": "Button", "text": "Finish", "roleHint": "primary" }
    ]}
  ]
}
```

---

## 11. Implementation Notes
- **Discovery order** for actions: explicit ids (`nextId`/`prevId`) → roleHint/text heuristics → keyboard sequence fallback.
- **Keyboard integration:** Use `luma keyboard` pre‑order to verify action ordering (`Back` before `Next/Finish`).
- **Visibility:** Ignore nodes with `visible:false`.
- **Determinism:** If multiple candidates match, choose the earliest in step subtree pre‑order.
- **Self‑describe:** Update `patterns` docs with `pattern`, `must[]`, `should[]`, and `source {name,url}`.

---

## 12. Deliverables Checklist
- [ ] Validator module `pattern.guided-flow` implementing §3 rules
- [ ] CLI wiring for `--patterns guided-flow`
- [ ] `luma patterns --show Guided.Flow` JSON payload
- [ ] Unit tests: passing + MUST + SHOULD cases
- [ ] Integration with `luma keyboard` for ordering checks
- [ ] Docs: add to `PATTERNS.md` & release notes
- [ ] Scoring integration as per §8
- [ ] Back‑compat guard per §9.4

---

**End of Guided Flow Pattern Specification (v1.1-GF)**
