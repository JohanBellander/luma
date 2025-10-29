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
- UX pattern fidelity (e.g. Form.Basic, Table.Simple)

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

## Documentation

- [SPECIFICATION.md](./SPECIFICATION.md) — Full data & behavior spec
- [QUICKSTART.md](./QUICKSTART.md) — Step-by-step workflow & chaining
- [AGENT-RULES-SCAFFOLD.md](./AGENT-RULES-SCAFFOLD.md) — Scaffold contract (spacing scale, required fields)
- [CHANGELOG.md](./CHANGELOG.md) — Version history

## License

ISC

## Contributing

PRs welcome: https://github.com/JohanBellander/luma.

