# LUMA — Layout & UX Mockup Analyzer

> TL;DR: Generate a scaffold, validate structure/flow/responsiveness headlessly, then implement real UI only after it scores clean.

## Purpose
LUMA is an opinionated, staged workflow for AI agents with the purpose of creating better UI designs.

> ⚠️ Alpha Status: This project is in active development. The core features well, but expect changes. Use for development/internal projects first.

1. Scaffold Creation – Start from patterns to produce a strictly structured JSON screen (no ad‑hoc freeform markup).
2. Validation Loop – Refine the scaffold using until structural, accessibility, and pattern criteria pass.
3. UI Implementation – Only after the scaffold is clean the AI Agent can translate it into actual UI code/styles. LUMA purposefully stays headless so iteration happens before visual polish.

This enforced order reduces wasted UI rework: semantics and interaction are locked in early; visual layer comes last.

## What It Evaluates

- Layout structure (Stacks, Grids, spacing, sizing policies)
- Keyboard reachability & tab sequence
- Hierarchy & grouping clarity
- Responsive behavior across breakpoints
- UX pattern fidelity (e.g. Form.Basic, Table.Simple, Progressive Disclosure (optional))

## Install

**Windows (PowerShell):**
```powershell
irm https://raw.githubusercontent.com/JohanBellander/luma/master/scripts/install.ps1 | iex
```
**macOS/Linux:**
```bash
curl -fsSL https://raw.githubusercontent.com/JohanBellander/luma/master/scripts/install.sh | bash
```
**Develop branch (latest in-progress features):**
```powershell
$env:LUMA_BRANCH='develop'; irm https://raw.githubusercontent.com/JohanBellander/luma/master/scripts/install.ps1 | iex
```
```bash
LUMA_BRANCH=develop curl -fsSL https://raw.githubusercontent.com/JohanBellander/luma/master/scripts/install.sh | bash
```
Or from source:
```bash
git clone https://github.com/JohanBellander/luma.git
cd luma
npm install && npm run build && npm link
```
Requires Node.js ≥ 18.

## Quick Start

```powershell
# Initialize a new project (creates AGENTS.md with usage instructions)
luma init
```

## Runtime Knowledge (Agent Command)

Use the dynamic agent command to retrieve only the information you need in a deterministic JSON envelope. This replaces large static docs and reduces token usage for AI agents.

List available sections:
```bash
luma agent --list-sections
```

Fetch a subset (only quick + rules):
```bash
luma agent --sections quick,rules --json
```

Dot-path retrieval (returns just that subtree):
```bash
luma agent --get quick --json
```

All sections:
```bash
luma agent --all --json
```

Determinism: Keys are stable and ordering is canonical; only `generatedAt` timestamp varies per invocation.

Dot-path grammar (v1): `section(.segment)*` with simple alphanumeric/underscore segments. **Deep indexing into arrays (e.g. `patterns.Form.Basic.must[0]`) and wildcards are intentionally NOT supported** in the first version. Retrieve the full section and filter client-side if you need individual items.

Typical integration flow for an agent:
1. `luma agent --sections quick,components,patterns --json` to cache core knowledge.
2. Build scaffold.
3. Run validation pipeline.
4. Optionally fetch `rules` section later for pattern rule IDs.

## Agent Integration Verification

Use the `agent-verify` command to quickly audit that a repository has the expected agent workflow assets and governance policies:

```bash
luma agent-verify --json
```

Checks performed (v1):
* `agents_md` – Presence of `AGENTS.md` and required governance/pattern hint lines
* `beads_integrity_script` – Presence of `scripts/validate-beads-integrity.ps1` (Windows integrity enforcement)
* `package_json_scripts` – Basic `test` or `build` scripts defined
* `tsconfig_present` – Presence of TypeScript config (for projects using TS)

Exit code: 0 if all pass, 2 if any fail (suitable for CI gating). Human output shows ✓/✗ markers; JSON output includes per-check detail fields.

Error examples:
```bash
luma agent --sections unknown --json   # => code: UNKNOWN_SECTION (exit 2)
luma agent --get rules.invalidPath --json  # => code: UNKNOWN_PATH (exit 2)
```

Performance target: full envelope generation (<60ms typical) cached in-process; repeat requests for the same section set are memoized.

> Tip: Persist the JSON output alongside your run folder to ensure reproducible agent context across sessions.

## Documentation

- [SPECIFICATION.md](./SPECIFICATION.md) — Full data & behavior spec
- [QUICKSTART.md](./QUICKSTART.md) — Step-by-step workflow & chaining
- [AGENT-RULES-SCAFFOLD.md](./AGENT-RULES-SCAFFOLD.md) — Scaffold contract (spacing scale, required fields)
- [CHANGELOG.md](./CHANGELOG.md) — Version history

## Pattern Suggestions

You can ask LUMA to heuristically suggest which UX patterns apply to a scaffold before running full validation:

```bash
luma patterns --suggest my-scaffold.json --json
```

Output format:

```json
{
	"suggestions": [
		{ "pattern": "Form.Basic", "reason": "Detected Form node with 3 field(s) and 2 action(s)", "confidence": "high" },
		{ "pattern": "Table.Simple", "reason": "Detected Table node (5 columns, responsive.strategy=scroll)", "confidence": "high" },
		{ "pattern": "Progressive.Disclosure", "reason": "Found collapsible disclosure behavior on one or more nodes", "confidence": "high" },
		{ "pattern": "Guided.Flow", "reason": "Found multi-step indicators (next, previous) suggesting a wizard flow", "confidence": "medium" }
	]
}
```

Confidence scale:
- high – direct structural match (Form node with fields/actions, Table columns, explicit disclosure behaviors)
- medium – multiple hints (next/previous buttons implying multi-step flow)
- low – single weak hint (a lone Next button or guidedFlow metadata without other indicators)

Use suggestions to decide which patterns to include when running:

```bash
luma flow scaffold.json --patterns Form.Basic,Table.Simple
```

Suggestions add <5% execution time compared to listing patterns and never block validation; empty output means no strong pattern indicators were detected.

## Guided.Flow Pattern (Multi-Step Wizards)

Use `Guided.Flow` to validate multi-step flows (onboarding, setup, checkout) for structural completeness and usability affordances.

### Activation Triggers
Pattern runs when:
1. Explicitly included: `luma flow scaffold.json --patterns guided-flow`
2. Any node has `behaviors.guidedFlow.role` set to `wizard` or `step`
3. Suggestion engine detects multi-step indicators (buttons: Next/Previous/Finish; text: "Step 2 of 5")

### MUST Rules (Fail = blocking)
- Contiguous Steps (GF-MUST-1)
- Navigation Actions Present (GF-MUST-2)
- Fields Before Actions Row (GF-MUST-3)
- Single Primary per Step (GF-MUST-4)

### SHOULD Rules (Warn)
- Progress Indicator Present (GF-SHOULD-1)
- Back Before Next/Finish (GF-SHOULD-2)
- Step Title Present (GF-SHOULD-3)
- Primary Action Above Fold (GF-SHOULD-4) — ensures forward navigation remains visible at smallest viewport

### Example Passing Step
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

### Folding Visibility Failure (GF-SHOULD-4 Warn)
If the primary button frame bottom exceeds the smallest viewport height:
```json
{
	"id": "finish", "type": "Button", "text": "Finish", "roleHint": "primary"
}
```
Warn: `wizard-primary-below-fold` → Reduce vertical content or elevate action.

### Quick Run
```powershell
luma flow ui/screens/onboarding.mock.json --patterns guided-flow
```
Or rely on auto-activation via hints.

> Rationale: Keeping the primary progression action visible increases completion and reduces abandonment.

## License

ISC

## Pattern Coverage (v1.1)

Use the `--coverage` flag with `flow` to see how many patterns were activated versus total available, and which suggested patterns (medium/high confidence) were not validated.

```bash
luma flow my-form.json --coverage --json | jq '.coverage'
```

Example JSON output fragment:

```json
{
	"coverage": {
		"activated": 3,
		"nTotal": 4,
		"percent": 75.0,
		"gaps": [
			{ "pattern": "Guided.Flow", "reason": "Found multi-step indicators (next, previous, step 1, step 2) suggesting a wizard flow" }
		]
	}
}
```

Fields:
* activated – number of patterns validated in this run
* nTotal – total patterns available in the registry
* percent – activated / nTotal * 100 (rounded to 2 decimals)
* gaps – medium/high confidence suggestions not included (potential missed validations)

Without `--json` a summary is printed:

```bash
luma flow my-form.json --coverage
# [INFO] Coverage: activated=1/4 (25%) gaps=1
#   - Gap: Guided.Flow (Found multi-step indicators (...))
```

## Contributing

PRs welcome: https://github.com/JohanBellander/luma.

### Issue Tracking Integrity

All work is tracked with `bd (beads)`; **policy (LUMA-82): do NOT edit `.beads/issues.jsonl` manually**.

#### Automated Enforcement (LUMA-80)

The repository ships a pre-push Git hook that now automatically runs the integrity check and blocks pushes when anomalies are detected (e.g., sequence regression, malformed JSON lines).

Enable hooks (one-time):
```powershell
npm run setup-hooks
```
Then any `git push` will:
1. Run `scripts/validate-beads-integrity.ps1` (or `.sh` on POSIX)
2. Abort with exit code 2 if an anomaly is found (preventing corrupt history)
3. Auto-increment patch version if `package.json` version unchanged in the last commit (lightweight tracking of incremental changes)

Sample blocked push output:
```text
[pre-push] Running beads integrity check...
{"code":"SEQUENCE_REGRESSION","message":"ID numeric sequence regression: 77 after 120","line":121}
[pre-push] ❌ Beads integrity anomaly detected. Push aborted.
```

Run the integrity check script before committing (optional but recommended):

```powershell
pwsh scripts/validate-beads-integrity.ps1
```

Exit codes:
- 0 clean
- 2 anomaly (possible manual edit)

Hooks already enforce this locally; you can still add the script to CI for defense-in-depth.

Dirty example (simulated manual line appended):
```powershell
pwsh scripts/validate-beads-integrity.ps1
{"code":"MANUAL_EDIT_DETECTED","message":"ID numeric sequence regression: 77 after 120","line":121}
```

