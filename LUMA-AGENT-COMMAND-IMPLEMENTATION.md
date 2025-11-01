# Implementation Plan: `luma agent` Command (No Hash)

Status: Pending Implementation
Related Spec: `LUMA-AGENT-COMMAND-SPEC.md`
Owner: CLI / Agent Interface

## 1. Overview
Implement a new machine-oriented CLI command `luma agent` that serves structured runtime knowledge to AI agents, replacing the large generated `AGENTS.md` content with a minimal pointer. Hashing is intentionally skipped; semantic schema versioning is used.

## 2. Deliverables
- New CLI command file `src/cli/agent.command.ts`
- Section assemblers (quick, workflow, rules, patterns, components, examples, links, meta)
- Dot-path query (`--get <path>`)
- Section selection (`--sections`, `--all`), list sections (`--list-sections`)
- Plain vs JSON output modes
- Registration in `src/index.ts`
- Refactor `init.command.ts` to insert minimal pointer `AGENTS.md`
- Integration tests (`tests/integration/agent-command.test.ts`)
- CHANGELOG entry + version bump (patch)
- Documentation updates (README pointer + remove large markdown generation)

## 3. Out of Scope (Create follow-up issue if needed)
- Content integrity hash / diff protocol
- Streaming output / delta support
- Per-section version mapping

## 4. Architecture Summary
Single command composes small pure functions returning section JSON objects. Patterns and aliases pulled from existing pattern registry. Component meta hard-coded as minimal constant (can be externalized later). Dot-path resolver walks object tree; arrays not individually addressed beyond whole value (initial scope).

## 5. Flags (Recap)
```
--sections <csv>
--all
--list-sections
--get <dotpath>
--json
--plain
--version-only
```
Conflict Rules:
- `--all` mutually exclusive with `--sections` and `--get`
- `--get` ignores `--sections`/`--all`
- `--plain` mutually exclusive with `--json`
Default behavior (no selector flags): equivalent to `--sections quick --json` (or plain quick? Decide: JSON default for machine use. Implementation: default to JSON.)

## 6. Data Sources
- Patterns: from pattern registry (`getAllPatterns()`, `getAliases()`)
- Minimal scaffold: reuse from spec (embed constant)
- Component meta: typed constant map
- Rules: curated constant reflecting validator invariants
- Version: from `package.json`

## 7. Error Handling
- Invalid section name → exit code 2
- Invalid dot path → exit code 2
- Internal unexpected error → exit code 3
- Plain mode errors to stderr + process exit
- JSON mode errors as `{ "error": "NOT_FOUND", "path": "..." }`

## 8. Tests (Vitest)
| Test | Description |
|------|-------------|
| quick-json | `luma agent --sections quick --json` returns mission + workflow array |
| get-scalar | `luma agent --get rules.scaffold.schemaVersion` returns `1.0.0` |
| list-sections | Includes all documented sections |
| patterns-lengths | index/must/should arrays aligned |
| all-json | Contains every section key + schema envelope |
| invalid-section | Exit 2 with error |
| invalid-path | Exit 2 for bad dot path |
| plain-default | `luma agent` default provides quick section |

## 9. Step-by-Step Tasks
1. Create command skeleton file and export `createAgentCommand()`.
2. Implement section assembler functions (in same file or `core/agent/` directory; use simple object assembly).
3. Add option parsing & validation logic (mutual exclusion checks).
4. Add dot-path resolver function.
5. Implement JSON vs plain formatting helpers.
6. Register command in `src/index.ts`.
7. Create integration test file with outlined cases.
8. Refactor `init.command.ts`: replace large `agentsContent` with minimal pointer text referencing runtime command.
9. Add minimal pointer `AGENTS.md` template content.
10. Update README (brief new subsection: "Agent Runtime Docs").
11. Update CHANGELOG (Added `luma agent` command.)
12. Bump patch version.
13. Run full test suite.
14. Adjust for any lint errors.
15. Open follow-up issue: potential future hash + deltas.

## 10. Acceptance Criteria
- All new tests pass and are deterministic.
- Running `node dist/index.js agent --all --json` after build returns all documented sections.
- Generated `AGENTS.md` from init is <= 30 lines.
- No references remain to removed verbose content.

## 11. Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Drift between rules and validator | Keep rule constants minimal; note in follow-up issue to auto-derive later |
| Pattern registry change breaking tests | Use dynamic expectations (length > 0) rather than hard-coded counts where possible |
| CLI option parsing complexity | Centralize validation early in action handler |

## 12. Follow-Up Backlog Items
- Auto-derive rules from validator internals
- Add per-section version numbers
- Optional hash re-introduction if caching needed
- Streaming / diff mode

## 13. Implementation Notes
- Keep objects small; avoid large example expansions.
- Maintain key ordering by constructing literal objects in desired order (JSON output from `JSON.stringify` preserves insertion order for string keys in modern V8 for non-integer keys).
- Provide stable `schema.sections` ordering: `["quick","workflow","rules","patterns","components","examples","links","meta"]`.

---
End of Implementation Plan.
