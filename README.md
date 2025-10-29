# LUMA — Layout & UX Mockup Analyzer

## Purpose
LUMA lets you quickly validate raw UI scaffolds (simple JSON describing screens) before investing in full UI implementation. It answers:

| Question | Command |
|----------|---------|
| Is my scaffold structurally valid? | `luma ingest` |
| Does layout behave at target viewports? | `luma layout` |
| Is keyboard navigation orderly & reachable? | `luma keyboard` |
| Do I follow required UX pattern rules? | `luma flow` |
| What is the overall quality score? | `luma score` |
| Can I see a human-readable summary? | `luma report` |

It runs headless (no DOM/CSS) for speed and determinism—ideal for CI and early design iteration.

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
Or from source:
```bash
git clone https://github.com/JohanBellander/luma.git
cd luma
npm install && npm run build && npm link
```
Requires Node.js ≥ 18.

## Quick Start (Init → Generate → Analyze → Score)

```powershell
# Initialize a new project (creates AGENTS.md with usage instructions)
luma init
```

## Documentation

- [SPECIFICATION.md](./LUMA-SPEC-v1.1.md) — Full data & behavior spec
- [QUICKSTART.md](./QUICKSTART.md) — Step-by-step workflow & chaining
- [AGENT-RULES-SCAFFOLD.md](./AGENT-RULES-SCAFFOLD.md) — Scaffold contract (spacing scale, required fields)
- [CHANGELOG.md](./CHANGELOG.md) — Version history

## License

ISC

## Contributing

PRs welcome: https://github.com/JohanBellander/luma. Use `bd create` for new issues.

