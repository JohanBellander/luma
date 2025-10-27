# LUMA — Layout & UX Mockup Analyzer
**Specification (Agent-Optimized, v1.0)**  
Target implementation language: **TypeScript**  
CLI Style: **Subcommand** (`luma <command> <args>` )  
Document structure: **Main spec + Appendices**

---

## 0. Intent & Audience
This document is a **complete, implementation-ready specification** for **LUMA**, a CLI tool that evaluates UI scaffolds defined in **Component Scaffold JSON**. It is optimized for **another AI** (or a junior developer) to produce an **implementation plan** and then code, without needing further clarification.

LUMA evaluates **structure and flow** of early-stage UI mockups (no browser, no CSS), focusing on:
- **Layout structure** (containers, sizing policies, spacing)
- **Interaction & keyboard flow** (reachability, ordering)
- **Hierarchy & grouping**
- **Responsive behavior** across viewports
- **UX pattern fidelity** against established sources

**Non-goals (out of scope for v1):**
- Visual design (colors, typography, branding)
- Accessibility/contrast auditing (WCAG)
- Browser/DOM/CSS rendering
- Code generation for production UIs

---

## 1. Definitions & Terms
- **Scaffold**: A JSON description of one screen’s structural UI tree.
- **Viewport**: Screen size as `width × height` in CSS px (e.g., `320x640`).
- **Frame**: Calculated rectangle `{x,y,w,h}` for a node at a viewport.
- **Focusable**: Nodes that participate in keyboard tab order (e.g., `Button`, `Field`).
- **Pattern**: A set of structural rules (MUST/SHOULD) referenced to canonical sources.
- **Run Folder**: Append-only directory `.ui/runs/<timestamp>/` containing command outputs.

---

## 2. High-Level Behavior
LUMA processes an input **Scaffold JSON**, applies **responsive overrides**, performs **headless layout simulation**, builds **keyboard flow**, checks **UX patterns**, aggregates **scores**, and writes **machine-readable artifacts** (JSON) and an optional **report**.

### 2.1 Core Capabilities
1. **ingest** — Validate & normalize the scaffold.
2. **layout** — Compute frames per viewport; emit layout issues.
3. **keyboard** — Build tab sequence; emit flow issues.
4. **flow** — Apply pattern rules; emit MUST/SHOULD failures.
5. **score** — Aggregate weighted category scores & thresholds.
6. **report** — Produce human-readable summary (optional).
7. **Self-Describe** — `capabilities`, `schema`, `patterns`, `explain`, `faq`.

### 2.2 Guarantees
- Deterministic (no network; pure functions).
- Append-only runs; never overwrite prior results.
- Stable **Issue** object shape across commands.
- Exit codes: `0` success; `2` invalid input; `3` blocking issues; `4` internal error; `5` schema version mismatch.

---

## 3. Input Model: Component Scaffold JSON
All fields are **normative**. Unknown fields **MUST** be ignored safely, not crash.

### 3.1 Top-Level
- `schemaVersion` (string) — supported: `"1.0.0"`
- `screen` (object)
  - `id` (string, required)
  - `title` (string, optional)
  - `root` (Node, required)
- `settings` (object, required)
  - `spacingScale` (number[]) — allowed gaps/padding, e.g., `[4,8,12,16,24,32]`
  - `minTouchTarget` (object) — `{ w:number, h:number }`, default expectation `44×44`
  - `breakpoints` (string[]) — e.g., `["320x640","768x1024","1280x800"]`

### 3.2 Common Node Fields (apply to all node types)
- `id` (string, required, unique per screen)
- `type` (string, required) — one of: `Stack|Grid|Box|Text|Button|Field|Form|Table`
- `visible` (boolean, default `true`)
- `widthPolicy` (`"hug"|"fill"|"fixed"`, default `"hug"`)
- `heightPolicy` (`"hug"|"fill"|"fixed"`, default `"hug"`)
- `minSize` (object `{w?:number,h?:number}`) — optional
- `maxSize` (object `{w?:number,h?:number}`) — optional
- `at` (object) — **responsive overrides** keyed by strings matching `/^(<=|>=)\d+$/` where number is viewport width (px).

### 3.3 Specific Node Types
- **Stack**
  - `direction` (`"vertical"|"horizontal"`, required)
  - `gap` (number, default `0`, MUST be in `spacingScale` or issue `spacing-off-scale`)
  - `padding` (number, default `0`, MUST be in `spacingScale` or issue `spacing-off-scale`)
  - `align` (`"start"|"center"|"end"|"stretch"`, default `"start"`)
  - `wrap` (boolean, default `false`, only applies if `direction:"horizontal"`)
  - `children` (Node[], required)
- **Grid**
  - `columns` (number, required, intended max columns)
  - `gap` (number, default `0`, MUST be in spacingScale or issue)
  - `minColWidth` (number, optional; allows column reduction on small viewports)
  - `children` (Node[], required)
- **Box**
  - `padding` (number, default `0`, MUST be in spacingScale or issue)
  - `child` (Node, optional)
- **Text**
  - `text` (string, required)
  - `fontSize` (number, optional; default 16)
  - `maxLines` (number, optional)
  - `intrinsicTextWidth` (number, optional; if set, used as single-line width hint)
- **Button**
  - `text` (string, optional; if absent, treat as icon-only but still focusable unless `focusable:false`)
  - `focusable` (boolean, default `true`)
  - `tabIndex` (number, optional; non-zero discouraged and SHOULD emit a warn)
  - `roleHint` (string enum: `"primary"|"secondary"|"danger"|"link"`, optional)
  - `minSize` (object `{w?:number,h?:number}`, optional)
- **Field**
  - `label` (string, required, non-empty)
  - `inputType` (string enum: `"text"|"email"|"password"|"number"|"date"`, optional)
  - `required` (boolean, optional)
  - `helpText` (string, optional)
  - `errorText` (string, optional)
  - `focusable` (boolean, default `true`)
- **Form**
  - `title` (string, optional)
  - `fields` (Field[], required, length ≥1)
  - `actions` (Button[], required, length ≥1)
  - `states` (string[], must include `"default"`, include `"error"` if any field has `errorText`)
- **Table**
  - `title` (string, required, non-empty)
  - `columns` (string[], required, length ≥1)
  - `rows` (number, optional; density heuristic)
  - `responsive` (object, required)
    - `strategy` (`"wrap"|"scroll"|"cards"`, required)
    - `minColumnWidth` (number, optional)
  - `states` (string[], recommended: include `"default"`, `"empty"`, `"loading"`)

### 3.4 Responsive Override Application (Normative)
Given a viewport width `W`:
1. Collect all `>=X` where `X ≤ W`, **apply in ascending X order** (largest last).
2. Collect all `<=Y` where `Y ≥ W`, **apply in descending Y order** (smallest last).  
3. Overlays override base node fields. Nested objects merge shallowly; arrays replace.

---

## 4. Issue Object (Canonical Shape)
All commands MUST report issues using this shape.

- `id` (string; e.g., `"overflow-x"`, `"primary-below-fold"`, `"cancel-before-primary"`)
- `severity` (`"info"|"warn"|"error"|"critical"`)
- `message` (string; human-readable)
- `nodeId` (string; optional)
- `jsonPointer` (string; e.g., `"/screen/root/children/1/actions/0"`, optional)
- `viewport` (string; e.g., `"320x640"`, optional)
- `details` (object; arbitrary numeric/textual context, optional)
- `source` (object; optional for pattern-based issues)
  - `pattern` (string; e.g., `"Form.Basic"`)
  - `name` (string; source name)
  - `url` (string; source URL)
- `suggestion` (string; short actionable hint, optional)

---

## 5. Headless Layout Simulation (Standard Layout, v1)
No DOM/CSS. Deterministic. Purpose: compute frames + layout issues.

### 5.1 Inputs
- Scaffold after responsive overrides.
- Viewport `{w,h}`
- `settings.spacingScale`, `settings.minTouchTarget`

### 5.2 Measuring primitives
**Text**
- If `intrinsicTextWidth` present → use as single-line width hint.
- Else estimate: `singleLine = fontSize * 0.55 * charCount` (default `fontSize=16`).
- If `availableWidth < singleLine` →
  - `lines = ceil(singleLine / availableWidth)`
  - `height = lines * fontSize * 1.4`
  - `width = min(singleLine, availableWidth)`
- Else `width = singleLine`, `height = 1 * fontSize * 1.4`.

**Button / Field**
- Width:
  - `"fill"` → content width
  - `"hug"` → `min(textWidth + 24, contentWidth)` (24 is a constant padding hint)
  - `"fixed"` → clamp to content width respecting `min/max`
- Height:
  - `"hug"` → at least `minTouchTarget.h` (default 44)
  - `"fixed"` → clamp by `min/max`

**Table**
- Width: `"fill"` unless explicitly fixed.
- Height heuristic: `header=48 + rowHeight*rows` where `rowHeight=40` (defaults: rows=5).

### 5.3 Containers
**Root**
- Root frame: `{x:0, y:0, w:viewport.w, h:auto}`; content width includes any root padding.

**Stack (vertical)**
- `contentW = container.w - 2*padding`
- Start at `(x = container.x + padding, y = container.y + padding)`
- For each visible child:
  1. Measure child `w,h` using policies & `contentW`
  2. Horizontal placement:
     - `start` → `child.x = x`
     - `center` → `child.x = x + (contentW - child.w)/2`
     - `end` → `child.x = x + (contentW - child.w)`
     - `stretch` → set `child.w = contentW` unless `widthPolicy:"fixed"`
  3. `child.y = y`
  4. `y += child.h + gap`
- Container `h = (y - gap + padding) - container.y`
- If `gap` or `padding` not in `spacingScale` → issue `spacing-off-scale` (warn).

**Stack (horizontal, wrap=false)**
- Place left-to-right with `gap`, same `contentW` logic.
- If `child.x + child.w > container.x + container.w` → `overflow-x` (error).

**Stack (horizontal, wrap=true)**
- Track row height; wrap to next row when next child would exceed content width.
- Update container `h` accordingly.

**Grid**
- If `minColWidth` present:
  - `colsFit = floor((contentW + gap) / (minColWidth + gap))`
  - `effectiveCols = clamp(1, intendedColumns, colsFit)`
- Else `effectiveCols = intendedColumns`
- `cellW = (contentW - (effectiveCols-1)*gap) / effectiveCols`
- Place children row-by-row; if any child’s measured `w > cellW` → `overflow-x`.

### 5.4 Layout issues
- **overflow-x** (error): `child.x + child.w > container.right` where container strategy does not explicitly allow scrolling (e.g., Table with strategy `"scroll"` is exempt).
- **primary-below-fold**: identify first Button with `roleHint:"primary"`. If `child.y + child.h > viewport.h` at **smallest** viewport → **error**; at larger viewports → **warn**.
- **spacing-off-scale** (warn): any `gap` or `padding` value not in `spacingScale`.
- **touch-target-too-small** (warn): any focusable node with `w < minTouchTarget.w` or `h < minTouchTarget.h`.

### 5.5 Outputs
- `frames[]` for every visible node: `{ id, x, y, w, h }`
- `issues[]` (see canonical shape)

---

## 6. Keyboard & Interaction Flow
Produces a tab sequence and flow issues **after overrides**.

### 6.1 Focusable nodes
- `Button`, `Field`, and any node with `focusable:true`.
- Ignore nodes where `visible:false`.

### 6.2 Traversal & sequencing
- **Pre-order traversal** of final node tree.
- For `Form`, expected order is **Fields → Actions** (also a pattern rule).

### 6.3 Flow rules & issues
- **cancel-before-primary** (warn): In the last action group of a `Form`, a cancel/back button precedes a `roleHint:"primary"` button.
- **field-after-actions** (error): In the same `Form`, any `Field` appears after `actions`.
- **unreachable** (critical): Any focusable node omitted from the sequence due to malformed structure/visibility.

### 6.4 Outputs
- `sequence` (string[]): ordered `nodeId`s
- `unreachable` (string[]): focusable nodeIds not reached
- `issues[]` (see canonical shape)

---

## 7. UX Pattern Library (with Sources)
Each pattern contains MUST/SHOULD rules. Failing a **MUST** is **blocking**.

### 7.1 Form.Basic
- **Source**: GOV.UK Design System — Forms
- **MUST**
  1. `field-has-label`: Every `Field.label` is non-empty.
  2. `actions-exist`: `Form.actions.length ≥ 1`.
  3. `actions-after-fields`: Actions appear **after** all fields in the same `Form`.
  4. `has-error-state`: If any `Field.errorText` exists, `Form.states` includes `"error"`.
- **SHOULD**
  1. `help-text`: Provide `helpText` for ambiguous labels.

### 7.2 Table.Simple
- **Source**: IBM Carbon — Data Table
- **MUST**
  1. `title-exists`: `Table.title` non-empty.
  2. `responsive-strategy`: `Table.responsive.strategy ∈ {"wrap","scroll","cards"}`.
  3. `min-width-fit-or-scroll`: At smallest viewport, table does **not** overflow horizontally; either columns fit (`minColWidth` logic), or strategy is `scroll/cards`.
- **SHOULD**
  1. `controls-adjacent`: Filters/controls adjacent to the table container (same parent, near placement).

*(Modal.Basic reserved for v1.1)*

---

## 8. Scoring & Thresholds
Category weights (defaults):
- Pattern Fidelity **45%**
- Flow & Reachability **25%**
- Hierarchy & Grouping **20%**
- Responsive Behavior **10%**

### 8.1 Category scoring
- **Pattern Fidelity**: Start at 100. Subtract 30 per MUST failure; subtract 10 per SHOULD failure. Floor at 0.
- **Flow & Reachability**: Start at 100. Subtract 30 per `unreachable` (critical). Subtract 10 per warn (`cancel-before-primary`, etc.).
- **Hierarchy & Grouping**: Start at 100. Subtract 10 per ungrouped or mis-ordered structural issue (e.g., `field-after-actions`). Subtract 5 per `spacing-off-scale` cluster (>2 occurrences).
- **Responsive Behavior**: Average penalties across smallest & mid viewports. Subtract 30 per `overflow-x` error; subtract 20 for `primary-below-fold`.

### 8.2 Overall
`overall = round( Σ weight[i] * score[i] )`

**Pass Criteria**
- No MUST failures
- No critical flow errors
- `overall ≥ 85`

---

## 9. CLI API (Subcommand Style)
All commands **SHOULD** support `--json` for machine-readable output and write artifacts to `.ui/runs/<runId>/`.

### 9.1 `luma ingest <file> [--json] [--out <run-dir>]`
- Validate & normalize the scaffold.
- Output: `ingest.json` with normalized model, errors[], warnings[].
- Exit: `0` if valid, `2` if invalid, `5` if schemaVersion unsupported.

### 9.2 `luma layout <file> --viewports <WxH[,WxH...]> [--json] [--out <run-dir>]`
- Compute frames and layout issues per viewport.
- Output: `layout_<WxH>.json` for each viewport.
- Exit: `0` on success; `3` if blocking layout issues; `2` invalid input.

### 9.3 `luma keyboard <file> [--state <name>] [--json] [--out <run-dir>]`
- Produce tab sequence & flow issues.
- Output: `keyboard.json`.
- Exit: `0` or `3` if critical flow errors.

### 9.4 `luma flow <file> --patterns <list> [--json] [--out <run-dir>]`
- Apply pattern rules (e.g., `form,table`).
- Output: `flow.json` with per-pattern results.
- Exit: `0` or `3` if any MUST fails.

### 9.5 `luma score <run-dir> [--weights <json>] [--json]`
- Aggregate category scores & thresholds.
- Output: `score.json`.
- Exit: `0` for pass; `3` for fail.

### 9.6 `luma report <run-dir> --out <file>`
- Produce `report.html` summarizing all results (optional).

### 9.7 Self-Description
- `luma capabilities --json` — list commands, exit codes, defaults.
- `luma schema --json` — summarize input/output schema fields.
- `luma patterns --list --json` — list available patterns + sources.
- `luma patterns --show <Pattern> --json` — show MUST/SHOULD details.
- `luma explain --topic <name> --json` — layout-solver, keyboard-flow, scoring, overrides, issue-fields, exit-codes, run-folders.
- `luma faq --json` — short Q&A.

---

## 10. Artifacts & Run Folders
- All commands write into `.ui/runs/<ISO-like-timestamp>/` unless `--out` is provided.
- Files include:
  - `ingest.json`
  - `layout_<WxH>.json` (one per viewport)
  - `keyboard.json`
  - `flow.json`
  - `score.json`
  - `report.html` (optional)
- A `run.log` SHOULD record timings and counts of issues by severity.

---

## 11. Exit Codes
- `0` — Success (no blocking issues)
- `2` — Schema/ingest error
- `3` — Blocking analysis issues (MUST failures or critical flow/layout)
- `4` — Internal tool error
- `5` — Unsupported `schemaVersion`

---

## 12. Determinism, Performance, Privacy
- No network calls.
- Fixed heuristics; same input → same output.
- Target perf (typical screen):
  - ingest < 100ms; layout/viewport < 200ms; keyboard < 50ms; flow < 100ms.
- Local file IO only; never transmit scaffolds.

---

## Appendix A — Example Scaffold (Happy Form)
Minimal valid input demonstrating a pass. (Illustrative, not binding.)

```
schemaVersion: "1.0.0"
screen:
  id: "form-happy"
  title: "Profile"
  root:
    type: "Stack"
    id: "root"
    direction: "vertical"
    gap: 16
    padding: 24
    children:
      - type: "Text", id: "title", text: "Edit profile", fontSize: 24
      - type: "Form", id: "profile-form",
        fields:
          - { type: "Field", id: "name",  label: "Name",  inputType: "text" }
          - { type: "Field", id: "email", label: "Email", inputType: "email", errorText: "Enter a valid email" }
        actions:
          - { type: "Button", id: "cancel", text: "Cancel" }
          - { type: "Button", id: "save",   text: "Save", roleHint: "primary" }
        states: ["default","error"]
settings:
  spacingScale: [4,8,12,16,24,32]
  minTouchTarget: { w: 44, h: 44 }
  breakpoints: ["320x640","768x1024"]
```

Expected: no MUST failures; no overflow; sequence `name → email → cancel → save`; score ≥ 90.

---

## Appendix B — Example Issues
- `overflow-x` (error): `nodeId:"table"`, `viewport:"320x640"`, `details:{ requiredWidth: 360, available: 320 }`
- `primary-below-fold` (error @ smallest viewport): `nodeId:"save"`, `viewport:"320x640"`
- `spacing-off-scale` (warn): `nodeId:"root"`, `details:{ gap:14, allowed:[8,12,16,24] }`
- `touch-target-too-small` (warn): `nodeId:"ok"`, `details:{ w:36,h:36, min:{w:44,h:44} }`
- `cancel-before-primary` (warn): `nodeId:"cancel"`
- `field-after-actions` (error): `nodeId:"email"`
- Pattern MUST failure: `pattern:"Table.Simple"`, `id:"responsive-strategy"`

All issues should include `message` and `suggestion` when actionable.

---

## Appendix C — Pattern Sources (Citations)
- GOV.UK Design System — Forms (form structure, labels, errors)
- IBM Carbon — Data Table (table usage & responsiveness)
- Material Design — Dialogs (modal structure & actions; reserved v1.1)
- USWDS — Step Indicators (task flows; future)
- Nielsen Norman Group — Usability heuristics (rationales)

Include `source.name` and `source.url` in pattern-related issues.

---

## Appendix D — Self-Description Output (Shapes)
**capabilities (--json):**
- `tool`, `version`, `schemaVersion`
- `commands[]`: name, summary, machineOutput(bool)
- `exit_codes` map
- `defaults`: weights, thresholds

**schema (--json):**
- Summaries of required fields for inputs (Scaffold, Node types)
- Output shapes: CommandResult, Issue

**patterns --list (--json):**
- `patterns[]`: name, source{name,url}

**patterns --show <Pattern> (--json):**
- `pattern`, `source`, `must[]`, `should[]`

**explain --topic <name> (--json):**
- `topic`, `answer`, `example?`

**faq (--json):**
- `faq[]`: {q, a}

---

## Appendix E — Acceptance Checklist
- Inputs validated with clear error messages (exit 2 on failure).
- Layout produces frames & issues per viewport.
- Keyboard returns a sequence & issues.
- Pattern checks produce MUST/SHOULD outcomes with sources.
- Score respects weights & thresholds and sets exit 3 on block.
- Run folders are timestamped; prior runs untouched.
- Self-description commands work and return strict JSON.

---

**End of LUMA Specification (v1.0)**
