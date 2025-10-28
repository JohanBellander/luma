# LUMA Additions Specification (v1.1)
_This document defines additive enhancements to the existing LUMA v1.0 tool._

These changes **extend**, not replace, the existing functionality.  
All previously defined commands and behaviors from **LUMA v1.0** remain valid and unchanged.

---

## Overview

**Goal:** Improve AI Agent reliability when producing valid Component Scaffold JSONs.  
**Scope:** Five targeted feature additions for better guidance, templates, and feedback.

### Included Additions
1. Scaffold Contract (agent generation rules)  
2. Golden Template (valid starter scaffold)  
3. Enhanced Ingest Errors (fix-oriented output)  
4. `luma scaffold new` command (generate valid scaffolds)  
5. Snippets Pack (ready-to-use node fragments)

---

## 0. Versioning & Compatibility

- Tool version: **1.1.0**
- Input `schemaVersion` remains **"1.0.0"**
- Additions are **backward-compatible** and **optional**
- New assets: `/templates/`, `/snippets/`, `/schemas/` (optional)
- New subcommand: `luma scaffold`
- Existing CLI and JSON schema unaffected

---

## 1. Scaffold Contract (Agent Prompt Payload)

### Purpose
Provide a **minimal, deterministic rule set** the AI Agent can use when generating scaffolds.

### Description
- Available via:
  ```bash
  luma explain --topic scaffold-contract --json
  ```
- Optional file in repo: `AGENT-RULES-SCAFFOLD.md`

### Contract Text
```
You are producing a LUMA Component Scaffold JSON.

Hard rules:
- schemaVersion === "1.0.0"
- screen.id is a non-empty string
- screen.root is ONE node of type Stack|Grid|Box|Text|Button|Field|Form|Table
- Every node has: id, type (and required fields for its type)
- Form has fields[] (len ≥ 1) and actions[] (len ≥ 1)
- Table has title (non-empty), columns[] (len ≥ 1), responsive.strategy ∈ {wrap, scroll, cards}
- settings.spacingScale is an array of numbers
- settings.minTouchTarget is { "w": 44, "h": 44 } or larger
- settings.breakpoints are "WxH" strings, e.g. ["320x640","768x1024"]

Output MUST be a single JSON object. No comments. No markdown.
```

### Acceptance
- Command `luma explain --topic scaffold-contract --json` returns the above string.
- `AGENTS.md` references it as “Preflight / Before You Generate”.

---

## 2. Golden Template (Seed Scaffold)

### Purpose
Provide a **ready-to-pass example** for agents to clone or modify.

### Delivery
- File: `/templates/golden.todo.mock.json`
- Viewable via:
  ```bash
  luma explain --topic golden-template --json
  ```

### Template Requirements
- Root: `Stack` vertical, gap 16, padding 24
- Children:
  - Title `Text` node
  - Toolbar `Stack` with `Button` (“Add task”)
  - `Table` with 3 columns, responsive.strategy `"scroll"`, minColumnWidth 160
- Settings: valid spacingScale, touch targets ≥ 44×44, standard breakpoints

### Acceptance
- `luma ingest` returns exit 0
- `luma layout` reports no `overflow-x` or `primary-below-fold` (at 320×640)
- `luma flow` passes `Table.Simple` pattern checks

---

## 3. Enhanced Ingest Errors (Fix-Oriented Messaging)

### Purpose
Improve `luma ingest` output clarity and actionability.

### Behavior
- On validation failure (`exit 2`), include:
  ```json
  {
    "id": "schema-missing-field",
    "severity": "error",
    "message": "Table.responsive.strategy is missing.",
    "jsonPointer": "/screen/root/children/2/responsive",
    "expected": "strategy ∈ {wrap, scroll, cards}",
    "found": null,
    "suggestion": ""responsive": { "strategy": "scroll", "minColumnWidth": 160 }",
    "nextAction": "Insert the suggested snippet and rerun: luma ingest path/to/file.mock.json"
  }
  ```

### CLI Enhancements
- Flags:
  - `--all-issues` — show all errors
  - `--no-suggest` — suppress fix hints
  - `--format concise|verbose` — default `concise`

### Acceptance
- Each validation failure includes pointer, expected/found, and actionable suggestion.
- Top-1 blocking issue shown by default.

---

## 4. `luma scaffold new` (Starter Scaffolds by Intent)

### Purpose
Allow quick generation of **valid base scaffolds** from named patterns.

### Command
```bash
luma scaffold new --pattern <name> --out <path> [--title <str>] [--screen-id <id>] [--breakpoints <WxH,...>]
```

### Supported Patterns (v1.1)
- `todo-list` — List view with table + add button
- `form-basic` — Simple form (2 fields, Cancel/Save)
- `table-simple` — Standalone table
- `empty-screen` — Minimal Stack with title

### Behavior
- Writes a **ready-to-validate** scaffold.
- Prevents overwrite unless `--force` specified.
- Fills metadata (`screen.id`, `title`, `settings`) automatically.
- Ends with guidance text for next commands (`ingest`, `layout`, `flow`).

### Exit Codes
- `0` — success
- `4` — file I/O error
- `3` — generated scaffold failed ingest (should not occur)

### Acceptance
- All pattern outputs pass `luma ingest` with exit 0.
- Generated scaffolds follow the Scaffold Contract rules.

---

## 5. Snippets Pack (Common Node Patterns)

### Purpose
Provide small, composable node fragments agents can safely reuse.

### Location
`/snippets/` directory, viewable via:
```bash
luma explain --topic snippets --json
```

### Required Snippets
| File | Description |
|------|--------------|
| `stack.vertical.json` | Vertical stack with gap + padding |
| `stack.horizontal.toolbar.json` | Toolbar stack (horizontal) |
| `form.basic.json` | Form with fields + actions |
| `table.simple.json` | Simple table with responsive scroll |
| `button.primary.json` | Primary button node |
| `field.email.json` | Example email field |

### Rules
- Each snippet is a valid JSON object (no comments).
- Must insert cleanly into any valid scaffold’s `children` array.
- Each snippet must pass `ingest` individually.

---

## 6. Documentation & Self-Describe Additions

### New topics
- `luma explain --topic scaffold-contract --json`
- `luma explain --topic golden-template --json`
- `luma explain --topic snippets --json`

### AGENTS.md Updates
- Add Preflight checklist referencing scaffold contract.
- Add callout:
  ```bash
  luma scaffold new --pattern todo-list --out ui/screens/todo.mock.json
  ```

---

## 7. Folder & File Layout

```
/templates/
  golden.todo.mock.json
/snippets/
  stack.vertical.json
  stack.horizontal.toolbar.json
  form.basic.json
  table.simple.json
  button.primary.json
  field.email.json
/AGENT-RULES-SCAFFOLD.md
/AGENTS.md
```

---

## 8. Test Plan

| Feature | Verification |
|----------|--------------|
| Scaffold Contract | Returned by `explain`; matches expected string |
| Golden Template | Passes ingest/layout/flow |
| Enhanced Ingest Errors | Emits expected pointer/suggestion fields |
| `scaffold new` | Creates valid file per pattern; passes ingest |
| Snippets | Pass ingest when inserted into template children |

---

## 9. Rollout Notes

- Version bump to `1.1.0`.
- No breaking changes; all existing LUMA v1.0 commands remain valid.
- Additions are optional but recommended defaults for agent-friendly workflows.

---

**End of LUMA Additions Specification (v1.1)**  
*(An additive extension to LUMA v1.0)*
