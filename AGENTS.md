# Agent Instructions (Strict Mode)

MANDATORY: Use the **LUMA CLI** for ALL scaffold analysis. Manual reasoning without producing artifacts is non-compliant.

CRITICAL RULE: Do NOT generate HTML, JSX/TSX, CSS, design tokens, or component code BEFORE producing and validating a scaffold with the required LUMA artifacts (ingest/layout/keyboard/flow/score). Scaffold-first always.

Sentinel: `AGENT-COMPLIANCE-V1`
You MUST echo this exact token inside a JSON compliance block after every completed task:
```
{"lumaCompliance":{"sentinel":"AGENT-COMPLIANCE-V1","ingestRun":"<run-id>","flowRun":"<run-id>","scoreRun":"<run-id>"}}
```

## Runtime Knowledge (Query, Do Not Memorize)
Fetch fresh data each time:
```
luma agent --sections quick,rules --json
luma agent --get rules.patterns --json
luma explain --topic scaffold-contract
```

## Non-Negotiable Workflow
1. Collect requirements / clarify intent (no UI code yet).
2. Draft / modify a scaffold JSON (minimal viable structure).
3. Run in strict order (single run folder):
```
luma ingest <scaffold.json> --json
luma layout <scaffold.json> --viewports 320x640,768x1024 --json
luma keyboard <scaffold.json> --json
luma flow <scaffold.json> --patterns auto --json
luma score .ui/runs/<run-id> --json
```
4. If score passes (>=85, zero MUST failures) THEN and ONLY THEN produce implementation code (HTML/React/etc) as a separate phase.
5. When changing scaffold again, repeat the analysis sequence BEFORE adjusting implementation.

## Compliance Checklist (ALL REQUIRED BEFORE ANY UI CODE)
- ingest.json present
- layout.json present
- keyboard.json present
- flow.json includes validated patterns
- score.json overall >=85 & zero MUST failures (or task explicitly blocked)
- Compliance JSON block (sentinel present)

If ANY item missing: Fix the scaffold or rerun analysis. Do NOT output HTML/JSX/CSS.

## Forbidden
- Producing HTML/JSX/CSS/component code before compliant artifacts exist
- Fabricating pattern results or scores
- Skipping ingest/layout/keyboard/layout/flow/score sequence
- Using pattern names not in `luma patterns --list`
- Dot path deep array indexing (e.g. rules.patterns[0].must[0])

## Allowed / Encouraged
- Minimal section retrieval: `luma agent --sections quick,patterns --json`
- Re-use run folder IDs across steps
- Provide concise diffs of scaffold changes (structure only) before re-analysis

## Verification Signals (after each task)
1. Summary (<=300 chars)
2. Compliance JSON block
3. Exact commands run (copyable)
4. NEXT ACTION (if not compliant)

Example:
```
{"lumaCompliance":{"sentinel":"AGENT-COMPLIANCE-V1","ingestRun":"2025-11-01T164255Z","flowRun":"2025-11-01T164255Z","scoreRun":"2025-11-01T164255Z"}}
```

## Escalation Rules
- Median `luma flow` >1200ms across 5 runs: flag performance concern.
- MUST failure persists for 2 iterations: halt implementation; refine scaffold.

## Full Envelope (On Demand)
```
luma agent --sections all --json
```

## Incorrect vs Correct Examples

INCORRECT (non-compliant):
```
1. "Here's the full HTML for the login form"  <-- BEFORE any ingest/flow/score
2. luma ingest login.json (after code)   <-- Late analysis
```

CORRECT (compliant):
```
1. Draft login.json scaffold (structure only)
2. luma ingest login.json --json
3. luma layout login.json --viewports 320x640,768x1024 --json
4. luma keyboard login.json --json
5. luma flow login.json --patterns auto --json
6. luma score .ui/runs/<run-id> --json  (score >=85, no MUST failures)
7. Produce HTML/React component (implementation phase)
```

## HTML / UI Implementation Gate
Only after passing compliance checklist may you output any UI code. If you must propose future implementation, describe it textually (no tags) until artifacts are validated.

By following Strict Mode you ensure reproducible, auditable, and token-efficient AI agent operations. Scaffold-first preserves correctness and prevents premature UI divergence.
