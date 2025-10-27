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

🚧 **In Development** — Implementation planned based on [LUMA-SPEC.md](./LUMA-SPEC.md)

## Features (Planned)

- ✅ Headless layout simulation (no browser required)
- ✅ Keyboard navigation analysis
- ✅ UX pattern validation (GOV.UK, IBM Carbon, Material Design)
- ✅ Responsive viewport testing
- ✅ Machine-readable JSON outputs
- ✅ Deterministic, reproducible results

## Installation

_Coming soon_

## Usage

```bash
# Validate a scaffold
luma ingest scaffold.json

# Compute layout at multiple viewports
luma layout scaffold.json --viewports 320x640,768x1024,1280x800

# Check keyboard flow
luma keyboard scaffold.json

# Validate UX patterns
luma flow scaffold.json --patterns form,table

# Generate overall score
luma score <run-dir>

# Create HTML report
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
