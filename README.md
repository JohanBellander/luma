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

✅ **v1.0 Complete** — All core features implemented. See [LUMA-SPEC.md](./LUMA-SPEC.md) for full specification.

## Features

- ✅ Headless layout simulation (no browser required)
- ✅ Keyboard navigation analysis
- ✅ UX pattern validation (GOV.UK Form.Basic, IBM Carbon Table.Simple)
- ✅ Responsive viewport testing with override system
- ✅ Comprehensive scoring system across 4 categories
- ✅ Machine-readable JSON outputs
- ✅ HTML report generation
- ✅ Self-description commands for introspection
- ✅ Deterministic, reproducible results

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
# Validate a scaffold
luma ingest examples/happy-form.json

## Quick Start

```bash
# Initialize a new project with starter scaffold
luma init

# Analyze your scaffold
luma ingest scaffold.json

# Compute layout at multiple viewports
luma layout examples/happy-form.json --viewports 320x640,1024x768

# Check keyboard flow
luma keyboard examples/happy-form.json

# Validate UX patterns
luma flow examples/happy-form.json --patterns form

# Generate overall score
luma score .ui/runs/<run-id>

# Create HTML report
luma report .ui/runs/<run-id>
```

See [QUICKSTART.md](./QUICKSTART.md) for a detailed walkthrough.

## Commands

### Setup Command

- `luma init` — Initialize LUMA in current directory (creates starter scaffold.json)

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

## Output Artifacts

All analysis commands write results to `.ui/runs/<timestamp>/`:

- `ingest.json` — Normalized scaffold with validation errors/warnings
- `layout_<WxH>.json` — Layout frames and issues per viewport
- `keyboard.json` — Tab sequence and reachability issues
- `flow.json` — Pattern validation results
- `score.json` — Category scores and pass/fail result
- `report.html` — Visual summary report (optional)

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
- [IMPLEMENTATION-PLAN.md](./IMPLEMENTATION-PLAN.md) — Development roadmap
- [AGENTS.md](./AGENTS.md) — AI agent instructions

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
