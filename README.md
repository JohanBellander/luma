# LUMA — Layout & UX Mockup Analyzer

A CLI tool that evaluates UI scaffolds for structure, flow, and UX pattern fidelity without requiring a browser or CSS rendering.

## Overview

LUMA analyzes early-stage UI mockups defined in **Component Scaffold JSON** format, focusing on:

- **Layout structure** (containers, sizing policies, spacing)
- **Interaction & keyboard flow** (reachability, ordering)
- **Hierarchy & grouping**
- **Responsive behavior** across viewports
- **UX pattern fidelity** against established design systems

## Status

✅ **v1.1 Released** — Enhanced AI agent support, scaffold generation, and improved error reporting. See [CHANGELOG.md](./CHANGELOG.md) for details.

## Features

### Core Analysis (v1.0)
- ✅ Headless layout simulation (no browser required)
- ✅ Keyboard navigation analysis
- ✅ UX pattern validation (GOV.UK Form.Basic, IBM Carbon Table.Simple)
- ✅ Responsive viewport testing with override system
- ✅ Comprehensive scoring system across 4 categories
- ✅ Machine-readable JSON outputs
- ✅ HTML report generation
- ✅ Self-description commands for introspection
- ✅ Deterministic, reproducible results

### AI Agent Enhancements (v1.1)
- ✅ **Scaffold generation** — `luma scaffold new` with 10 built-in patterns
- ✅ **Scaffold contract** — Deterministic rules for scaffold creation
- ✅ **Enhanced error messages** — Context-aware suggestions with fix guidance
- ✅ **Golden template** — Reference scaffold for learning structure
- ✅ **Agent quickstart guide** — Comprehensive onboarding documentation

## Installation

### Quick Install

**Windows (PowerShell):**
```powershell
irm https://raw.githubusercontent.com/JohanBellander/luma/master/scripts/install.ps1 | iex
```

**macOS/Linux:**
```bash
curl -fsSL https://raw.githubusercontent.com/JohanBellander/luma/master/scripts/install.sh | bash
```

### From Source

```bash
git clone https://github.com/JohanBellander/luma.git
cd luma
npm install
npm run build
npm link  # Makes 'luma' command available globally
```

### Requirements

- Node.js >= 18.0.0
- TypeScript 5.x (dev dependency)

## Quick Start

```bash
# Generate a scaffold from a pattern (v1.1)
luma scaffold new --pattern todo-list --out todo.json

# Validate the scaffold
luma ingest todo.json

# Compute layout at multiple viewports
luma layout todo.json --viewports 320x640,1024x768

# Check keyboard flow
luma keyboard todo.json

# Validate UX patterns
luma flow todo.json --patterns form

# Generate overall score
luma score .ui/runs/<run-id>

# Create HTML report
luma report .ui/runs/<run-id>
```

**New to LUMA?**
```bash
# Get AI agent onboarding instructions
luma init

# See the scaffold contract (rules for creating scaffolds)
luma explain --topic scaffold-contract

# View the golden template (reference example)
luma explain --topic golden-template
```

See [QUICKSTART.md](./QUICKSTART.md) for a detailed walkthrough.

## Commands

### Setup Command

- `luma init` — Display onboarding instructions for integrating LUMA into agent workflows

### Analysis Commands

- `luma ingest <file>` — Validate and normalize scaffold JSON
- `luma layout <file> --viewports <WxH[,WxH...]>` — Compute layout frames per viewport
- `luma keyboard <file>` — Analyze keyboard tab sequence and flow
- `luma flow <file> --patterns <list>` — Validate against UX patterns
- `luma score <run-dir>` — Calculate aggregate scores and pass/fail
- `luma report <run-dir> --out <file>` — Generate HTML report

### Introspection Commands

- `luma capabilities [--json]` — List all commands, exit codes, and defaults
- `luma schema [--json]` — Summarize input/output schema fields
- `luma patterns --list [--json]` — List available UX patterns
- `luma patterns --show <name> [--json]` — Show MUST/SHOULD rules for a pattern
- `luma explain --topic <name> [--json]` — Explain LUMA concepts
- `luma faq [--json]` — Frequently asked questions

### Scaffold Generation (v1.1)

- `luma scaffold new --pattern <name> --out <file>` — Generate scaffold from pattern

**Available patterns:**
- `todo-list` — Table with Add button (default golden template)
- `empty-screen` — Minimal valid scaffold
- `form-basic` — Simple form with 2 fields
- `table-simple` — Basic data table
- `contact-form` — Contact form with validation
- `data-table-with-actions` — Table with row actions
- `modal-dialog` — Dialog with action buttons
- `login-form` — Email + password login
- `multi-step-form` — Multi-page form flow
- `dashboard-grid` — Dashboard with cards

**Options:**
- `--title <string>` — Custom screen title
- `--screen-id <id>` — Custom screen ID
- `--breakpoints <list>` — Custom breakpoints (e.g., "375x667,1920x1080")
- `--force` — Overwrite existing file

## Output Artifacts

All analysis commands write results to `.ui/runs/<timestamp>/`:

- `ingest.json` — Normalized scaffold with validation errors/warnings
- `layout_<WxH>.json` — Layout frames and issues per viewport
- `keyboard.json` — Tab sequence and reachability issues
- `flow.json` — Pattern validation results
- `score.json` — Category scores and pass/fail result
- `report.html` — Visual summary report (optional)

### Enhanced Error Reporting (v1.1)

By default, `luma ingest` shows **one error at a time** with actionable fix suggestions:

```bash
luma ingest broken.json
# Shows the most critical blocking issue with:
# - Exact JSON pointer location
# - What was expected vs. what was found
# - Suggested fix with code snippet

# To see all errors at once:
luma ingest broken.json --all-issues

# To disable fix suggestions:
luma ingest broken.json --no-suggest
```

## Scoring

LUMA evaluates scaffolds across 4 weighted categories:

1. **Pattern Fidelity** (45%) — MUST/SHOULD rule compliance
2. **Flow & Reachability** (25%) — Keyboard accessibility
3. **Hierarchy & Grouping** (20%) — Structural organization
4. **Responsive Behavior** (10%) — Multi-viewport handling

Default pass criteria:
- No MUST pattern failures
- No critical flow errors (unreachable nodes)
- Overall score ≥ 85/100

Custom weights can be provided with `luma score --weights weights.json`.

## Examples

See `examples/` directory for sample scaffolds:

- `happy-form.json` — Valid login form (passes all checks)
- `overflow-table.json` — Table with responsive issues
- `keyboard-issues.json` — Form with unreachable nodes
- `pattern-failures.json` — Form with MUST violations

## Exit Codes

- `0` — Success
- `2` — Invalid input
- `3` — Blocking issues detected
- `4` — Internal error
- `5` — Schema version mismatch

## Development

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript
npm run test         # Run unit tests
npm run test:run     # Run all tests once
npm run lint         # Check code style
```

## Documentation

- [LUMA-SPEC.md](./LUMA-SPEC.md) — Complete specification
- [QUICKSTART.md](./QUICKSTART.md) — Step-by-step tutorial
- [AGENTS.md](./AGENTS.md) — AI agent instructions
- [AI-AGENT-QUICKSTART.md](./AI-AGENT-QUICKSTART.md) — Agent onboarding guide (v1.1)
- [AGENT-RULES-SCAFFOLD.md](./AGENT-RULES-SCAFFOLD.md) — Scaffold contract reference (v1.1)
- [CHANGELOG.md](./CHANGELOG.md) — Version history
- [IMPLEMENTATION-PLAN.md](./IMPLEMENTATION-PLAN.md) — Development roadmap

## Test Coverage

- 191+ tests across 18 test files
- Unit tests for all core modules
- Integration tests for end-to-end workflows
- Pattern validation tests

## License

ISC

## Contributing

Issues and pull requests welcome at https://github.com/JohanBellander/luma
luma report <run-dir> --out report.html
```

## Documentation

- [Full Specification](./LUMA-SPEC.md) — Complete implementation-ready spec
- [Agent Instructions](./AGENTS.md) — For AI development agents

## Development

This project uses [bd (beads)](https://github.com/steveyegge/beads) for issue tracking.

```bash
# See what's ready to work on
bd ready

# Create a new issue
bd create "Issue description" -t task -p 1
```

## Non-Goals

- Visual design evaluation (colors, typography)
- WCAG accessibility auditing
- Browser/DOM rendering
- Production UI code generation

## License

_To be determined_

## Contributing

_Guidelines coming soon_
