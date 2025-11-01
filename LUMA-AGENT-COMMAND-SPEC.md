# LUMA Agent Command Specification

Status: Draft
Target Version: >= 0.1.x (post 0.1.43)
Owner: CLI / Agent Interface
Hash Strategy: Skipped (by explicit decision) – semantic version only

## 1. Purpose
Provide a machine-first interface for autonomous AI agents to retrieve authoritative operational knowledge about LUMA (workflow, rules, patterns, component summaries, examples) without relying on a large static `AGENTS.md` file.

## 2. Goals
- Minimize token footprint (short keys, compressed enumerations)
- Deterministic, stable JSON shape per version
- Allow selective retrieval of sections
- Permit single-value (dot-path) extraction
- Avoid content duplication with existing commands (patterns, explain, faq)
- Enable future extension without breaking existing consumers

## 3. Non-Goals
- No integrity hash / checksum (explicitly skipped)
- No partial diff / delta protocol (could be added later)
- Not a human onboarding document
- Not a replacement for full pattern specs or schema validator internals

## 4. Command Synopsis
```
luma agent [options]
```
### Primary Options
| Flag | Description |
|------|-------------|
| `--sections <csv>` | Comma-separated section list to include in response |
| `--all` | Include all sections |
| `--list-sections` | Output list of available section identifiers |
| `--get <dotpath>` | Return a single value at dot path |
| `--json` | Output JSON (default for multi-section). Without this: concise plain output |
| `--version-only` | Print just the schema version |
| `--plain` | Force plain output even if multiple sections (mutually exclusive with `--json`) |

Exit codes:
- `0`: success
- `2`: invalid section / path
- `3`: internal error

Rules:
- `--all` cannot be combined with `--sections` or `--get`
- `--get` output prefers raw scalar; use `--json` to wrap in object
- If no selector flag is provided, default is `--sections quick` (agent startup card)

## 5. Sections Overview
| Section | Purpose | Typical Size |
|---------|---------|--------------|
| `quick` | Startup essentials (mission, workflow outline, key commands) | ~0.5 KB |
| `workflow` | State model + constraints + blocker actions | ~0.5 KB |
| `rules` | Compact rule contract for scaffold/form/table | ~0.4 KB |
| `patterns` | Compressed pattern metadata (names, rule counts, aliases) | ~0.6 KB |
| `components` | Required / optional property summaries | ~0.7 KB |
| `examples` | Abbreviated session flow + minimal scaffold object | ~0.8 KB |
| `links` | Pointers to other dynamic commands | ~0.1 KB |
| `meta` | Version, counts, generation timestamp | ~0.1 KB |

Only requested sections + `schema` envelope are emitted.

## 6. JSON Envelope Schema (Top Level)
```jsonc
{
  "schema": {
    "id": "luma.agent-docs",        // constant
    "version": "1",                 // schema version; bump on breaking shape change
    "generated": "2025-11-01T12:34:56Z", // ISO timestamp (not for integrity; may change each call)
    "sections": ["quick", ...]       // list of included section keys
  },
  "quick": { ... },                   // only if requested
  "rules": { ... }                    // etc.
}
```

## 7. Section Schemas
### 7.1 quick
```jsonc
{
  "mission": "evaluate_ui_scaffolds",
  "golden": ["use_bd_only","single_issue_in_progress","no_inline_todos","validate_before_close","create_discovered_from"],
  "workflow": ["discover","claim","implement","validate","close","reflect"],
  "cmd": {
    "ready": "bd ready --json",
    "claim": "bd update <id> --status in_progress --json",
    "close": "bd close <id> --reason Completed --json",
    "ingest": "luma ingest <file> --json",
    "patternsSuggest": "luma patterns --suggest <file> --json",
    "flow": "luma flow <file> --patterns <patlist> --json"
  }
}
```

### 7.2 workflow
```jsonc
{
  "states": ["new","in_progress","blocked","review","done"],
  "constraints": {"singleClaim": true, "mustUseBd": true},
  "blockers": [
    ["spec_ambiguous","create_issue_discovered_from"],
    ["schema_conflict","prefer_spec_then_issue"],
    ["missing_pattern","add_pattern_rerun_flow"]
  ]
}
```

### 7.3 rules
```jsonc
{
  "scaffold": {
    "schemaVersion": "1.0.0",
    "uniqueIds": true,
    "spacingFromScale": true,
    "breakpointFmt": "WxH",
    "touchTargetMin": [44,44]
  },
  "form": {"minFields": 1, "minActions": 1, "requiresStates": ["default"]},
  "table": {"title": true, "columnsType": "string[]", "responsiveStrategy": true}
}
```

### 7.4 patterns
Compressed arrays for minimal overhead.
```jsonc
{
  "index": ["Form.Basic","Table.Simple","Progressive.Disclosure","Guided.Flow"],
  "must":  [7,5,4,6],
  "should": [5,3,2,4],
  "aliases": {
    "Form.Basic": [],
    "Table.Simple": ["table","table-simple"],
    "Progressive.Disclosure": ["progressive-disclosure","pd"],
    "Guided.Flow": ["guided-flow","wizard","flow-wizard"]
  }
}
```

### 7.5 components
Each key is a component type; values compress required/optional/recommended sets.
```jsonc
{
  "Stack": {"req": ["id","type","direction","children"], "opt": ["gap","padding","align"]},
  "Grid": {"req": ["id","type","columns","children"], "opt": ["gap","minColWidth"]},
  "Box": {"req": ["id","type"], "opt": ["padding","child"]},
  "Text": {"req": ["id","type","text"], "opt": ["fontSize","maxLines"]},
  "Button": {"req": ["id","type"], "rec": ["text","roleHint","minSize"]},
  "Field": {"req": ["id","type","label","inputType"], "rec": ["placeholder","required"]},
  "Form": {"req": ["id","type","fields","actions","states"], "rec": ["title"]},
  "Table": {"req": ["id","type","title","columns"], "rec": ["responsive"]}
}
```

### 7.6 examples
```jsonc
{
  "session": [
    "bd ready",
    "bd update bd-42 --status in_progress",
    "luma ingest form.json",
    "luma flow form.json --patterns Form.Basic",
    "bd close bd-42 --reason Completed"
  ],
  "minimalScaffold": {
    "schemaVersion": "1.0.0",
    "screen": {"id":"minimal","root":{"id":"root","type":"Stack","direction":"vertical","children":[]}},
    "settings": {"spacingScale":[4,8,16],"minTouchTarget":{"w":44,"h":44},"breakpoints":["320x640"]}
  }
}
```

### 7.7 links
```jsonc
{
  "faq": "luma faq --json",
  "patternsList": "luma patterns --list --json",
  "schemaExplain": "luma explain --topic scaffold-contract --json"
}
```

### 7.8 meta
```jsonc
{
  "sourceVersion": "0.1.43",
  "patternCount": 4
}
```

## 8. Plain (Non-JSON) Output Rules
- Default (`luma agent`) prints `quick` section as a concise block:
```
LUMA Agent Quick
mission: evaluate_ui_scaffolds
workflow: discover > claim > implement > validate > close > reflect
key: ready | claim | close | ingest | patternsSuggest | flow
```
- `--get` without `--json` prints raw scalar or JSON if structure not scalar.
- Multi-section plain output concatenates sections separated by `---` (only if `--plain` explicitly provided). Otherwise encourage JSON for multiple sections.

## 9. Dot Path Resolution
- Syntax: dot-separated keys, arrays by numeric index (future extension; initial arrays not individually addressed unless simple).
- Examples:
  - `luma agent --get rules.scaffold.schemaVersion` → `1.0.0`
  - `luma agent --get quick.workflow` → JSON array or newline-joined if plain mode.
- Invalid path → exit 2; JSON mode: `{ "error": "NOT_FOUND", "path": "..." }`.

## 10. Validation & Tests
Test File: `tests/integration/agent-command.test.ts`
| Test | Assertion |
|------|-----------|
| quick json | Contains mission + workflow array length > 0 |
| get scalar | Returns exact string version |
| list sections | Includes `patterns` |
| patterns counts | Index length === must length === should length |
| all sections | Contains keys for every documented section |
| invalid section | Exit 2 + error message |

## 11. Implementation Outline
1. New file: `src/cli/agent.command.ts`.
2. Add assembler functions in same file (or `src/core/agent/` if expanding later).
3. Import pattern registry for dynamic counts & aliases.
4. Embed component meta and minimal scaffold constants.
5. Register command in `src/index.ts`.
6. Update `init.command.ts` to insert a minimal pointer `AGENTS.md` instead of verbose content.
7. Add tests.

## 12. Backward Compatibility
- Existing long AGENTS content replaced; offer opt-in legacy via future `--legacy-agents-doc` flag if needed (not in initial scope).
- No existing `luma agent` command → additive change.

## 13. Versioning Policy
- Increment `schema.version` only on breaking structural changes (renamed keys, removed fields, semantics shift).
- Content additions inside existing sections (extra optional keys) do NOT bump version.
- `sourceVersion` mirrors `package.json`.

## 14. Security / Injection Considerations
- Output is static + derived from internal code; no user-provided JSON injection risk.
- Ensure no environment variable expansion or shell interpolation.

## 15. Performance Considerations
- Expected runtime < 2ms (small object assembly, pattern registry already loaded).
- No caching layer required initially.

## 16. Future Extensions (Out of Scope Now)
- `--since <version|timestamp>` diff support
- Per-section version map (fine-grained invalidation)
- Streaming line-delimited JSON (`--stream`)
- Subhash map if hash concept reintroduced
- JSON Schema export for agent-docs

## 17. Acceptance Criteria
- Command compiles and appears in `luma --help`
- All test cases pass
- Minimal `AGENTS.md` (< 30 lines) points agents to `luma agent`
- Running `luma agent --all --json` returns schema envelope + all documented sections exactly matching spec

## 18. Minimal Pointer AGENTS.md (Planned Replacement)
```
# LUMA Agent Interface
Use runtime command instead of static doc.
Quick: luma agent --sections quick --json
All:   luma agent --all --json
Rule:  luma agent --get rules.scaffold.schemaVersion
Patterns: luma patterns --list --json
FAQ: luma faq --json
All task tracking must use bd.
```

---
End of Specification.
