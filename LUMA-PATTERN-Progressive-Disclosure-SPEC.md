# LUMA Pattern Specification — Progressive Disclosure (v1.1-PD)
_This document is an **additive** specification to LUMA v1.1. It introduces a new optional UX pattern validator without changing existing behavior._

**See also:** [SPECIFICATION.md §7.3](./SPECIFICATION.md#73-progressive-disclosure-optional-additive-v11) for usage summary and examples.

- Pattern name (CLI): `progressive-disclosure`
- Pattern id (internal): `Progressive.Disclosure`
- Scope: Structural validation only (no DOM; no styling; no runtime behavior)
- Compatibility: Backward-compatible; inactive unless requested or hinted
- Targets: `luma flow` command; `luma patterns` self-describe; scoring

---

## 0. Rationale & Sources
**Goal:** Prevent cognitive overload by showing secondary/advanced content only when needed.

**Why it matters:** Reduces initial complexity, increases completion for novices, preserves expert power via reveal controls.

**Primary references (cite in issues):**
- Nielsen Norman Group — Progressive Disclosure
- GOV.UK Design System — Details/Disclosure summary
- USWDS — Accordion/Disclosure guidance

> Note: Use these sources for rationale strings; do not fetch content at runtime.

---

## 1. Schema Additions (Optional, Non-breaking)

The base scaffold schema (v1.0.0) remains unchanged. This pattern is activated via optional **hints**.

### 1.1 Optional Node Extension
Add an optional object field to any container (`Stack`, `Grid`, `Box`) or compound node intended to be collapsible:

```json
"behaviors": {
  "disclosure": {
    "collapsible": true,
    "defaultState": "collapsed | expanded",
    "controlsId": "nodeId",
    "ariaSummaryText": "string (optional)"
  }
},
"affordances": ["chevron", "details", "accordion"]
```

**Notes:**
- `behaviors` is an existing extensible hint bag; safe to omit.
- `controlsId` points to a `Button`/`Text+Button` control; if omitted, validator may infer a nearby control (proximity rule in §3.2.3).

### 1.2 Defaults
- `defaultState` default: `"collapsed"`
- `affordances` default: empty

---

## 2. Activation Conditions

The Progressive Disclosure validator runs when **either**:
1. The pattern is explicitly requested at CLI:  
   ```bash
   luma flow screen.json --patterns progressive-disclosure
   ```
2. Any node contains `behaviors.disclosure.collapsible === true`.

If neither condition is met, this validator is **inactive** and returns no issues.

---

## 3. Validation Rules (Deterministic)

### 3.1 MUST Rules

**PD-MUST-1: Collapsible container has an associated control**
- If a node `N` has `behaviors.disclosure.collapsible === true`, a corresponding control must exist:
  - If `controlsId` is present → it must resolve to a `Button` (or `Text` sibling with nested `Button`) that is **visible**.
  - If `controlsId` is absent → validator attempts **proximity inference** (§3.2.3). If no candidate is found → **MUST fail** `disclosure-no-control`.

**PD-MUST-2: Primary action is not hidden by default**
- If `defaultState === "collapsed"` for node `N` and `N` contains a descendant `Button` with `roleHint:"primary"`, then either:
  - The primary button is **outside** of N (i.e., visible by default), or
  - N’s `defaultState` must be `"expanded"`.
- Otherwise **MUST fail** `disclosure-hides-primary`.

**PD-MUST-3: Label/summary present**
- For a collapsible node, there must be a **labeling element** reachable to users:
  - One of: a sibling `Text` immediately preceding N; a child `Text` within N designated as summary; or control button `text` that conveys topic (≥ 2 characters).
- Otherwise **MUST fail** `disclosure-missing-label`.

### 3.2 SHOULD Rules

**PD-SHOULD-1: Control placement proximity**
- The control should be **adjacent** to the collapsible node: same parent, and either **preceding sibling** or a header row within N.
- If not → **warn** `disclosure-control-far`.

**PD-SHOULD-2: Consistent affordance**
- If multiple collapsibles exist at the same level, their `affordances` should contain a common token (e.g., `"chevron"` or `"details"`).
- If inconsistent → **warn** `disclosure-inconsistent-affordance`.

**PD-SHOULD-3: Collapsible sections follow primary content**
- Prefer showing essential content first; collapsibles **after** core fields/actions.
- If a collapsible appears **before** required fields in a Form or before the main content block → **warn** `disclosure-early-section`.

### 3.2.3 Proximity Inference (when `controlsId` is omitted)
- **Candidate controls**: visible `Button` nodes whose text includes one of `{"Show","Hide","Expand","Collapse","Advanced","Details","More"}` (case-insensitive) or with `affordances` containing `"chevron"` or `"details"`.
- **Search order**:
  1. Preceding sibling within the same parent.
  2. Following sibling within the same parent.
  3. Within N as a first child in a header/container row.
- If multiple candidates are found, select the **closest preceding sibling**; otherwise the **closest following sibling**. Attach a **hint** in `details.inferredControlId`.

---

## 4. Issue Model

All issues must use the canonical LUMA Issue shape. Key IDs for this pattern:

| ID | Severity | Message (example) |
|----|----------|--------------------|
| `disclosure-no-control` | error | “Collapsible section has no associated control.” |
| `disclosure-hides-primary` | error | “Primary action is hidden by default within a collapsed section.” |
| `disclosure-missing-label` | error | “Collapsible section lacks a visible label or summary.” |
| `disclosure-control-far` | warn | “Disclosure control is not adjacent to the collapsible section.” |
| `disclosure-inconsistent-affordance` | warn | “Multiple collapsibles use inconsistent affordances.” |
| `disclosure-early-section` | warn | “Collapsible content precedes primary content; consider moving after core fields.” |

**Include in each issue (when relevant):**
- `nodeId` (the collapsible node id)
- `jsonPointer` (path to the offending node or missing property)
- `viewport` (optional; not required for structural-only checks)
- `source` (name+url from §0)
- `suggestion` (minimal fix; see §5)
- `details` (e.g., `{"expected": "controlsId referencing a Button", "found": null, "inferredControlId": "toggle-adv"}`)

---

## 5. Suggestions (Deterministic Text)

Provide minimal, actionable snippets. Examples:

**For `disclosure-no-control` (controlsId absent and no candidate):**
```
Add a control Button near the section and reference it:
"behaviors": { "disclosure": { "collapsible": true, "controlsId": "toggle-advanced", "defaultState": "collapsed" } }
...and define the control:
{ "id": "toggle-advanced", "type": "Button", "text": "Show advanced" }
```

**For `disclosure-hides-primary`:**
```
Move the primary action outside the collapsible section OR set:
"behaviors": { "disclosure": { "defaultState": "expanded" } }
```

**For `disclosure-missing-label`:**
```
Add a sibling Text label before the section:
{ "type":"Text", "id":"advanced-label", "text":"Advanced settings" }
```

**For `disclosure-control-far`:**
```
Place the control as a preceding sibling or within a header row next to the section.
```

**For `disclosure-inconsistent-affordance`:**
```
Align affordances across collapsible sections, e.g. "affordances":["chevron"].
```

**For `disclosure-early-section`:**
```
Move collapsible sections after required fields and before the action row.
```

---

## 6. CLI Integration

- `luma flow screen.json --patterns progressive-disclosure`
  - Activates these checks.
- Automatic activation when any node has `behaviors.disclosure.collapsible === true`.
- `luma patterns --list` adds `Progressive.Disclosure` entry.
- `luma patterns --show Progressive.Disclosure --json` prints **MUST/SHOULD** with `source` and `rationale` fields.

---

## 7. Scoring

- Category: **Pattern Fidelity** (45% of overall)
- Penalties within this pattern:
  - MUST failure: −30
  - SHOULD failure: −10
- Floor per-category: 0
- Report `patternScore` and `deductions[]` in `flow.json` for this pattern.

---

## 8. Acceptance Tests

### 8.1 Passing Example
- Collapsible “Advanced settings” with preceding “Show advanced” Button, defaultState `"collapsed"`, primary “Save” outside the section.
- Expect: **no errors**, possible no warns if affordances consistent.

### 8.2 MUST Fails
1. **No control present**  
   - Collapsible without `controlsId`, no nearby Button.  
   - Expect: `disclosure-no-control` (error).
2. **Primary hidden by default**  
   - Primary action inside the collapsed section.  
   - Expect: `disclosure-hides-primary` (error).
3. **Missing label**  
   - No Text/summary around the collapsible.  
   - Expect: `disclosure-missing-label` (error).

### 8.3 SHOULD Warns
1. Control far from section → `disclosure-control-far`
2. Inconsistent affordances among siblings → `disclosure-inconsistent-affordance`
3. Section appears before core fields → `disclosure-early-section`

### 8.4 Backward Compatibility
- When the pattern isn’t requested and there are no `behaviors.disclosure` hints, **no issues** are produced by this validator.

---

## 9. Examples (JSON fragments)

### 9.1 Valid collapsible section
```json
{
  "id": "advanced",
  "type": "Box",
  "behaviors": { "disclosure": { "collapsible": true, "defaultState": "collapsed", "controlsId": "toggle-advanced" } },
  "affordances": ["chevron"],
  "child": {
    "id": "advanced-content",
    "type": "Stack",
    "direction": "vertical",
    "gap": 12,
    "children": [
      { "id": "api-key", "type": "Field", "label": "API key" }
    ]
  }
}
```
Control defined as a sibling:
```json
{ "id": "toggle-advanced", "type": "Button", "text": "Show advanced" }
```

### 9.2 Invalid: primary hidden by default
```json
{
  "id": "adv",
  "type": "Stack",
  "behaviors": { "disclosure": { "collapsible": true, "defaultState": "collapsed" } },
  "children": [
    { "id":"save", "type":"Button", "text":"Save", "roleHint":"primary" }
  ]
}
```
Expected error: `disclosure-hides-primary`.

---

## 10. Implementation Notes

- **Traversal scope:** Evaluate proximity within the **same parent** first; avoid expensive global searches.
- **Inference determinism:** When multiple control candidates exist, select by stable rule (preceding sibling wins; then nearest by index).
- **Visibility filter:** Respect `visible:false` nodes (do not count as controls/labels).
- **Messages:** Keep consistent with Enhanced Ingest Errors style; include `suggestion` text.
- **Self-describe:** Update `patterns` docs with `pattern`, `must[]`, `should[]`, `source {name,url}`.

---

## 11. Deliverables Checklist

- [ ] Validator module `pattern.progressive-disclosure` with rules in §3.
- [ ] CLI wiring for `--patterns progressive-disclosure`.
- [ ] `luma patterns --show Progressive.Disclosure` JSON payload.
- [ ] Unit tests: passing, MUST fail, SHOULD warn cases.
- [ ] Docs: add to `PATTERNS.md` and release notes.
- [ ] Scoring integration as per §7.
- [ ] Back-compat guard per §8.4.

---

**End of Progressive Disclosure Pattern Specification (v1.1-PD)**