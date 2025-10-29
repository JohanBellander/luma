# LUMA — Layout & UX Mockup Analyzer
**Unified Specification (Agent-Optimized, v1.1)**  
Target implementation language: **TypeScript**  
CLI Style: **Subcommand** (`luma <command> <args>`)  
Document structure: **Normative Sections + Appendices**

---

## 0. Intent & Audience
This document is the **complete, implementation-ready specification** for **LUMA v1.1**, a CLI tool that evaluates UI scaffolds defined in **Component Scaffold JSON** before any production UI code is written. It is optimized for execution by **AI agents or junior developers** without further clarification.

LUMA analyzes:
- **Layout structure** (containers, sizing policies, spacing)
- **Interaction & keyboard flow** (reachability, ordering)
- **Hierarchy & grouping**
- **Responsive behavior** across viewports
- **UX pattern fidelity** (Form.Basic, Table.Simple)

**v1.1 Additive Enhancements:**
- Scaffold Contract topic
- Golden Template reference
- Enhanced ingest error model (prioritized, actionable)
- `luma scaffold new` command (pattern-based generation)
- Snippets Pack for composition

**Non-goals (out of scope):** Visual design (colors, typography), WCAG accessibility auditing, browser rendering (DOM/CSS), production code generation.

---

## 1. Definitions & Terms
- **Scaffold**: JSON description of one screen’s structural UI tree.
- **Viewport**: Screen size as `widthxheight` (e.g., `320x640`).
- **Frame**: Calculated rectangle `{x,y,w,h}` per node per viewport.
- **Focusable**: Node participating in keyboard tab order (`Button`, `Field`, or `focusable:true`).
- **Pattern**: Named set of rules (MUST/SHOULD) validated against canonical UX sources.
- **Run Folder**: `.ui/runs/<timestamp>/` directory collecting artifacts of a single pipeline execution.
- **Golden Template**: Canonical passing scaffold (`templates/golden.todo.mock.json`).
- **Snippet**: Valid JSON fragment representing a node or subtree meant for insertion.

---

## 2. High-Level Behavior
Given an input scaffold JSON, LUMA:
1. **Ingests** (validate & normalize)
2. Applies **responsive overrides**
3. Performs **headless layout simulation** per viewport
4. Builds **keyboard flow sequence**
5. Validates **UX patterns**
6. Aggregates **scores**
7. Optionally produces **HTML report**
8. Self-describes via introspection commands

### 2.1 Core Capabilities
- `ingest` | `layout` | `keyboard` | `flow` | `score` | `report`
- `scaffold new` (v1.1) — pattern-based generation
- Self-description: `capabilities`, `schema`, `patterns`, `explain`, `faq`

### 2.2 Guarantees
- Deterministic (pure, no network access)
- Append-only run folders (never overwrite prior runs)
- Stable Issue object shape (extended in v1.1 with optional fields)
- Backward compatible: **All v1.0 scaffolds pass unchanged under v1.1**
- Additions are **non-breaking & opt-in**
- Standard exit codes maintained

---

## 3. Input Model: Component Scaffold JSON
All described fields are **normative**. Unknown fields MUST be ignored (never crash).

### 3.1 Top-Level
- `schemaVersion`: string — supported: `"1.0.0"` (unchanged in v1.1)
- `screen` (object)
  - `id` (string, required)
  - `title` (string, optional)
  - `root` (Node, required)
- `settings` (object, required)
  - `spacingScale` (number[]) — allowed spacing tokens (gap/padding MUST come from here)
  - `minTouchTarget` ({ w:number, h:number }) — recommended ≥ 44×44
  - `breakpoints` (string[]) — each `"WxH"` e.g. `"320x640"`

### 3.2 Common Node Fields
- `id` (string, unique per screen)
- `type` (string) — one of `Stack|Grid|Box|Text|Button|Field|Form|Table`
- `visible` (boolean, default `true`)
- `widthPolicy` (`"hug"|"fill"|"fixed"`, default `"hug"`)
- `heightPolicy` (`"hug"|"fill"|"fixed"`, default `"hug"`)
- `minSize` ({w?:number,h?:number}, optional)
- `maxSize` ({w?:number,h?:number}, optional)
- `at` (object) — responsive overrides keyed by `">=W"` or `"<=W"` (W = viewport width px)

### 3.3 Specific Node Types
- **Stack**: `direction` (required: `vertical|horizontal`), `gap` (spacingScale), `padding` (spacingScale), `align` (`start|center|end|stretch`), `wrap` (horizontal only), `children[]` (required)
- **Grid**: `columns` (required), `gap` (spacingScale), `minColWidth` (number, optional), `children[]` (required)
- **Box**: `padding` (spacingScale), `child` (optional)
- **Text**: `text` (required), `fontSize` (optional, default 16), `maxLines`, `intrinsicTextWidth`
- **Button**: `text` (optional; icon-only if absent), `roleHint` (`primary|secondary|danger|link`), `focusable` (default true), `tabIndex` (non-zero discouraged), `minSize`
- **Field**: `label` (required), `inputType` (`text|email|password|number|date` optional), `required` (optional), `helpText`, `errorText`, `focusable` (default true)
- **Form**: `fields[]` (Field ≥1), `actions[]` (Button ≥1), `states[]` (include `"default"`; include `"error"` if any field has `errorText`), optional `title`
- **Table**: `title` (required, non-empty), `columns[]` (string ≥1), `responsive.strategy` (`wrap|scroll|cards`), optional `responsive.minColumnWidth`, `rows`, `states[]`

### 3.4 Responsive Override Application (Normative Algorithm)
For viewport width `W`:
1. Apply all `>=X` where `X ≤ W` in ascending order (smallest first → largest last)
2. Apply all `<=Y` where `Y ≥ W` in descending order (largest first → smallest last)
3. Shallow-merge objects; arrays replace entirely

### 3.5 Scaffold Contract (Additive, v1.1)
Hard rules an agent MUST satisfy (canonical content exposed via topic `scaffold-contract`):
- `schemaVersion === "1.0.0"`
- `screen.id` non-empty
- `screen.root` single node of allowed type
- All nodes: `id`, `type` + required type-specific fields
- Form: non-empty `fields[]`, `actions[]`, `states[]` (includes `"default"`)
- Table: non-empty `title`, non-empty `columns[]`, valid `responsive.strategy`
- All `gap` & `padding` values ∈ `settings.spacingScale`
- `settings.minTouchTarget` ≥ `{w:44,h:44}`
- `settings.breakpoints` list of `"WxH"` strings
- Output: pure JSON (no comments/markdown)

### 3.6 Minimal Valid Scaffold (Inline Reference)
See §Appendix B for full examples. Minimal scaffolds MUST include all top-level sections (`schemaVersion`, `screen`, `settings`).

### 3.7 Golden Template Reference
File: `templates/golden.todo.mock.json` — Pre-validated example combining vertical Stack, toolbar Stack, Table (scroll strategy), and correct settings. Must pass ingest/layout/flow with exit code 0.

---

## 4. Issue Object (Canonical Shape + Enhancements)
Baseline fields (v1.0):
- `id`, `severity`, `message`, `nodeId?`, `jsonPointer?`, `viewport?`, `details?`, `source? { pattern, name, url }`, `suggestion?`

v1.1 Additions (optional when available):
- `expected` (string) — normative expectation description
- `found` (any) — actual received value fragment
- `nextAction` (string) — actionable command hint

### 4.1 Enhanced Ingest Errors (v1.1)
Behavior:
- Default: show top-1 prioritized blocking issue
- Priority order: schema structure > missing required field > enum violation > type mismatch > generic validation
- Flags:
  - `--all-issues` — list all issues
  - `--no-suggest` — omit `suggestion` & `nextAction`
  - `--format concise|verbose` — output verbosity (default `concise`)
- Each reported issue SHOULD include `jsonPointer`, `expected`, `found` (if applicable), and `suggestion` unless suppressed.

---

## 5. Headless Layout Simulation
(Algorithm unchanged from v1.0; normative details retained.)
- Text measurement heuristic: `fontSize * 0.55 * charCount`
- Multi-line wrapping when width insufficient
- Button/Field sizing honors touch target ≥ `minTouchTarget`
- Containers compute frames and spacing validity

Issues emitted: `overflow-x`, `primary-below-fold`, `spacing-off-scale`, `touch-target-too-small` (see §Appendix D for examples).

---

## 6. Keyboard & Interaction Flow
- Pre-order traversal after responsive overrides
- Focusable nodes: Button, Field, any with `focusable:true`
- Form ordering rule: Fields MUST precede Actions

Issues: `cancel-before-primary` (warn), `field-after-actions` (error), `unreachable` (critical)

---

## 7. UX Pattern Library
Patterns contain MUST (blocking) and SHOULD (advisory) rules.

### 7.1 Form.Basic (GOV.UK Source)
MUST: label presence, actions existence, actions-after-fields, error state inclusion
SHOULD: helpful `helpText` for ambiguous labels

### 7.2 Table.Simple (IBM Carbon Source)
MUST: title exists, valid responsive strategy, no horizontal overflow at smallest viewport (fit or scroll/cards)
SHOULD: controls adjacent to table container

### 7.3 Invocation Rules (Clarification)
- Pattern names are case-sensitive: `Form.Basic`, `Table.Simple`
- Recommended: invoke patterns individually (`--patterns Form.Basic`) rather than ambiguous shorthand

---

## 8. Scoring & Thresholds
Category weights (defaults): Pattern 45%, Flow 25%, Hierarchy 20%, Responsive 10%
Formulas unchanged from v1.0 (see original spec §8). Pass criteria: no MUST failures, no critical flow errors, overall ≥ 85.

---

## 9. CLI API (Subcommands)
Retains all v1.0 commands plus new scaffold generation.

### 9.1 ingest
Validate & normalize. Exit codes: 0 success, 2 invalid, 5 schema version mismatch.

### 9.2 layout
Compute frames per viewport; emit layout issues. Exit 3 if blocking layout issues.

### 9.3 keyboard
Generate tab sequence & flow issues. Exit 3 on critical flow errors.

### 9.4 flow
Apply pattern rules. Exit 3 if any MUST fails.

### 9.5 score
Aggregate scores. Exit 3 if pass criteria not met.

### 9.6 report
Generate `report.html` summarizing artifacts.

### 9.7 scaffold new (Additive v1.1)
```
luma scaffold new --pattern <name> --out <file>
  [--title <string>] [--screen-id <id>] [--breakpoints <WxH,...>] [--force]
```
Patterns (v1.1): `todo-list`, `empty-screen`, `form-basic`, `table-simple`, `contact-form`, `data-table-with-actions`, `modal-dialog`, `login-form`, `multi-step-form`, `dashboard-grid`
Behavior:
- Generates scaffold, validates via ingest before writing.
- Abort (exit 3) if validation fails; exit 4 on I/O error.
- Provides next-step usage hints.

### 9.8 Snippets & Composition Guidance
Snippets directory supplies valid fragments. Recommended insertion contexts documented via optional `snippets/index.json` and `luma explain --topic snippets`.

### 9.9 Self-Description
Unchanged: `capabilities`, `schema`, `patterns --list/--show`, `explain --topic <name>`, `faq`.

---

## 10. Snippets Pack (Additive v1.1)
Directory: `snippets/`
- Each file: single valid node or subtree
- Must pass ingest when inserted appropriately (e.g., `Stack.children` array or `Box.child`)
- `index.json` (optional) lists metadata: `file`, `label`, `insertInto[]`, `notes`
Acceptance: All published snippets validate when composed with Golden Template (no ID conflicts).

---

## 11. Artifacts & Run Folders
Run folder: `.ui/runs/<timestamp>/`
Artifacts: `ingest.json`, `layout_<WxH>.json`, `keyboard.json`, `flow.json`, `score.json`, `report.html` (optional), `run.log` (recommended)

### 11.1 Single Run Folder Pipeline (Chaining)
To score correctly, commands MUST be executed in sequence referencing the same run folder:
- PowerShell:
```
luma ingest screen.json; `
luma layout screen.json --viewports 320x640,768x1024; `
luma keyboard screen.json; `
luma flow screen.json --patterns Form.Basic
```
- Bash/Zsh:
```
luma ingest screen.json && \
luma layout screen.json --viewports 320x640,768x1024 && \
luma keyboard screen.json && \
luma flow screen.json --patterns Form.Basic
```
Then:
```
luma score .ui/runs/<run-id>
```

---

## 12. Exit Codes
(Consistent with v1.0 + scaffold new semantics)
- `0` — Success (no blocking issues)
- `2` — Schema/ingest error
- `3` — Blocking analysis issues OR scaffold generation validation failure
- `4` — Internal / file I/O error
- `5` — Unsupported `schemaVersion`

---

## 13. Determinism, Performance, Privacy
No network calls. Fixed heuristics. Typical targets: ingest <100ms; layout/viewport <200ms; keyboard <50ms; flow <100ms (representative baseline). Local-only file IO.

---

## 14. Backward Compatibility & Versioning
- Input `schemaVersion` remains `"1.0.0"`
- CLI version: v1.1.x (additive)
- All v1.0 scaffolds and workflows pass unchanged
- New features (contract, golden template, scaffold new, snippets, enhanced errors) are opt-in

---

## 15. Troubleshooting & Debugging
### 15.1 Interpreting `jsonPointer`
`/screen/root/children/2` → 3rd child (0-indexed) of root’s children. `/screen/root/children/1/text` → property `text` on second child.

### 15.2 Common Validation Failures
- **Invalid union/type**: Wrong property name (`text` vs `content`, `roleHint` vs `variant`). Fix names.
- **Missing property**: Form missing `states` or `fields`/`actions`. Add required arrays.
- **Spacing off-scale**: Use values explicitly listed in `settings.spacingScale`.
- **Table columns wrong type**: Must be string array (e.g., `["Name","Email"]`).

### 15.3 Pattern Name Errors
Use exact case: `Form.Basic`, `Table.Simple`. Avoid shorthand `form` or `table`.

### 15.4 Tab Order Corrections
Tab sequence follows document order. Reorder nodes; avoid relying on `tabIndex` except exceptional cases.

### 15.5 First-Time Issue Catalog
- Missing `type` on nested Field/Button → add `"type": "Field"` / `"Button"`
- Separate run folders → chain commands (§11.1)
- Score <85 due to touch targets → ensure `minSize` or larger intrinsic size
- Actions before fields in Form → reorder so fields precede actions
- Missing Form `states` → add `states: ["default"]` (+ `"error"` if any `errorText`)

---

## 16. Acceptance Checklist (v1.1)
- Scaffold passes ingest (exit 0) with normalized structure
- Golden Template ingests, layouts, flows successfully
- `luma explain --topic scaffold-contract` returns canonical contract text
- `luma scaffold new` patterns all pass ingest
- Enhanced ingest errors show prioritized single issue by default
- Snippets validate when inserted (no ID collisions)
- Layout detects overflow & spacing issues correctly
- Keyboard sequence contains all focusable nodes (no `unreachable` unless intentional)
- Pattern validations produce correct MUST/SHOULD results
- Score respects weights & pass criteria
- Chained pipeline produces complete artifact set enabling scoring
- Backward compatibility tests: all v1.0 examples still pass

---

## Appendices

### Appendix A — Golden Template (Full JSON)
(Reference file `templates/golden.todo.mock.json` — source of truth; omitted here for brevity.)

### Appendix B — Example Minimal Scaffold
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
        { "id": "welcome-text", "type": "Text", "text": "Welcome to LUMA" },
        { "id": "action-button", "type": "Button", "text": "Get Started", "roleHint": "primary", "minSize": { "w": 44, "h": 44 } }
      ]
    }
  },
  "settings": {
    "spacingScale": [4,8,12,16,24,32],
    "minTouchTarget": { "w": 44, "h": 44 },
    "breakpoints": ["320x640","768x1024","1280x800"]
  }
}
```

### Appendix C — Issue Examples (Enhanced)
```json
{
  "id": "schema-missing-field",
  "severity": "error",
  "message": "Table.responsive.strategy is missing.",
  "jsonPointer": "/screen/root/children/2/responsive",
  "expected": "strategy ∈ {wrap, scroll, cards}",
  "found": null,
  "suggestion": "\"responsive\": { \"strategy\": \"scroll\", \"minColumnWidth\": 160 }",
  "nextAction": "Insert suggested object then rerun: luma ingest table.json"
}
```

### Appendix D — Pattern Sources
- GOV.UK Design System — Forms
- IBM Carbon — Data Table
- Material Design — Dialogs (reserved)

### Appendix E — Self-Description Output Shapes
Same as v1.0 (`capabilities`, `schema`, `patterns`, `explain`, `faq` JSON shapes).

### Appendix F — Change Log Summary (v1.0 → v1.1)
Additions: Contract topic, Golden Template, scaffold generation command & patterns, enhanced error fields (`expected`, `found`, `nextAction`), snippets pack, improved documentation & onboarding. No breaking changes.

---

**End of LUMA Unified Specification (v1.1)**
