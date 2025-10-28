# AI Agent Quick Start Guide

Welcome! This guide will help you get oriented in the LUMA project and start contributing effectively.

---

## What is LUMA?

**LUMA** (Layout & UX Mockup Analyzer) is a CLI tool that validates UI scaffolds **before implementation**. It analyzes JSON-based UI descriptions for:
- Layout issues (overflow, spacing, responsive behavior)
- Keyboard accessibility (tab sequence, focusability)
- UX pattern compliance (forms, tables, etc.)
- Structural integrity

**Key Principle:** Design UI structure as JSON → Validate with LUMA → Only then write code.

---

## Project Structure

```
/
├── src/
│   ├── cli/              # Command handlers (ingest, layout, keyboard, etc.)
│   ├── core/
│   │   ├── ingest/       # Validation & normalization
│   │   ├── layout/       # Layout solver (Stack, Grid, Box)
│   │   ├── keyboard/     # Tab sequence & flow analysis
│   │   ├── patterns/     # UX pattern validators (Form, Table)
│   │   ├── scoring/      # Score aggregation
│   │   └── report/       # HTML report generation
│   ├── types/            # TypeScript types
│   ├── utils/            # Helpers (logger, exit codes, JSON pointer)
│   └── data/             # Static data (FAQ, topics)
├── test/                 # Vitest tests
├── examples/             # Example scaffolds
├── templates/            # Golden templates (v1.1+)
├── snippets/             # Reusable fragments (v1.1+)
└── scripts/              # Installation scripts
```

---

## Tech Stack

- **Language:** TypeScript 5.x (ESM modules, strict mode)
- **CLI Framework:** Commander.js
- **Testing:** Vitest (191 tests, 18 test files)
- **Build:** TypeScript compiler + esbuild (for bundling)
- **Validation:** Zod schemas
- **Node.js:** >= 18.0.0

---

## Development Workflow

### 1. Setup
```bash
# Install dependencies
npm install

# Build the project
npm run build

# Link globally for testing
npm link

# Verify installation
luma --help
```

### 2. Making Changes
```bash
# Run tests
npm test

# Run tests in watch mode
npm run test

# Run specific test file
npx vitest run test/ingest.test.ts

# Lint code
npm run lint

# Format code
npm run format
```

### 3. Testing Changes
```bash
# After code changes, rebuild
npm run build

# Test with a scaffold
luma ingest examples/happy-form.json
luma layout examples/happy-form.json --viewports 320x640,768x1024
luma keyboard examples/happy-form.json
luma flow examples/happy-form.json --patterns form
```

### 4. Committing
```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "Add feature: <description>"

# Push to GitHub
git push
```

---

## Key Files to Know

### Commands (src/cli/)
- `ingest.command.ts` - Validate scaffold structure
- `layout.command.ts` - Compute responsive layouts
- `keyboard.command.ts` - Analyze tab flow
- `flow.command.ts` - Validate UX patterns
- `score.command.ts` - Aggregate scores
- `report.command.ts` - Generate HTML reports
- `init.command.ts` - Initialize LUMA in projects

### Core Logic (src/core/)
- `ingest/validator.ts` - Zod-based schema validation
- `layout/layout.ts` - Main layout solver
- `layout/stack.ts` - Stack layout algorithm
- `layout/grid.ts` - Grid layout algorithm
- `keyboard/sequence.ts` - Tab sequence generation
- `patterns/form-basic.ts` - Form pattern rules
- `patterns/table-simple.ts` - Table pattern rules
- `scoring/aggregate.ts` - Score calculation

### Types (src/types/)
- `scaffold.ts` - Scaffold JSON structure
- `node.ts` - Node types (Stack, Grid, Form, etc.)
- `issue.ts` - Issue/error structure
- `output.ts` - Output artifact types

### Data (src/data/)
- `topics.json` - Help topics for `luma explain`
- `faq.json` - FAQs for `luma faq`

---

## Common Tasks

### Adding a New Command
1. Create `src/cli/mycommand.command.ts`
2. Export a Command instance with `.command()`, `.description()`, `.action()`
3. Import and add to `src/index.ts` in main program
4. Add tests in `test/mycommand.test.ts`
5. Update README.md with new command docs

### Adding a New Node Type
1. Add type to `src/types/node.ts`
2. Add Zod schema to `src/core/ingest/validator.ts`
3. Add layout logic to `src/core/layout/` (if applicable)
4. Update `src/core/layout/measure.ts` for intrinsic sizing
5. Add tests for validation and layout

### Adding a New Pattern
1. Create `src/core/patterns/my-pattern.ts`
2. Implement pattern validator with MUST/SHOULD/MAY rules
3. Register in `src/core/patterns/pattern-registry.ts`
4. Add tests in `test/patterns/my-pattern.test.ts`
5. Add pattern docs to README.md

### Fixing a Bug
1. Write a failing test that reproduces the bug
2. Fix the code
3. Verify test passes
4. Check no regressions with `npm test`
5. Commit with "Fix: <description>"

---

## Testing Philosophy

- **Unit tests:** Test individual functions in isolation
- **Integration tests:** Test complete workflows (ingest → layout → score)
- **Example-driven:** Use real scaffold examples in `examples/`
- **Coverage target:** 80%+ for new code
- **No mocking:** Use real file I/O and validation where possible

---

## Code Style

- **Strict TypeScript:** No `any`, explicit return types
- **Functional style:** Pure functions where possible, avoid side effects
- **Error handling:** Always handle errors, use proper exit codes
- **Naming:** Descriptive names (no abbreviations like `fn`, `idx`)
- **Comments:** Explain "why", not "what"
- **Formatting:** Run `npm run format` before committing

---

## Exit Codes (Important!)

LUMA uses specific exit codes for programmatic use:
- **0:** Success (all checks pass)
- **1:** Validation failed (critical issues, MUST rules violated)
- **2:** Analysis warnings (non-critical issues, SHOULD rules)
- **3:** Invalid usage (wrong arguments, missing files)
- **4:** File I/O error (can't read/write files)

Always use these codes consistently in CLI commands.

---

## Issue Tracking with Beads

This project uses **bd (beads)** for issue tracking:

```bash
# List open issues
bd list --status open

# Show ready work (no blockers)
bd ready

# Claim a task
bd update LUMA-15 --status in_progress

# Complete a task
bd close LUMA-15 --reason "Implemented feature"

# Create new issue
bd create "Fix keyboard flow bug" -t bug -p 1
```

See `AGENTS.md` for full Beads workflow.

---

## Next Steps

1. **Read AGENTS.md** - Full agent instructions and LUMA workflow
2. **Check ready work:** `bd ready` - Find unblocked tasks
3. **Pick a task:** Start with P1 (high priority) features
4. **Run tests:** `npm test` - Ensure everything passes
5. **Make changes:** Follow development workflow above
6. **Ask questions:** Check `luma faq`, `luma explain --topic <topic>`

---

## Helpful Commands Reference

```bash
# Development
npm run build          # Build TypeScript
npm test               # Run all tests
npm run lint           # Check code style
npm run format         # Auto-format code

# LUMA CLI
luma capabilities      # List all commands and defaults
luma explain --topic <topic>  # Get help on specific topic
luma faq               # Common questions
luma patterns          # List available patterns
luma schema            # Show scaffold schema

# Beads
bd ready               # Show ready-to-work issues
bd list                # List all issues
bd show LUMA-15        # Show issue details
bd update LUMA-15 --status in_progress  # Claim task

# Git
git status             # Check what's changed
git add .              # Stage all changes
git commit -m "..."    # Commit with message
git push               # Push to GitHub
```

---

## Current State (October 2025)

- **Version:** 1.0.0 (v1.1 in planning)
- **Status:** All v1.0 features complete (191 tests passing)
- **Active work:** v1.1 additions (scaffold contract, golden template, snippets)
- **Known issues:** Some integration tests fail due to example scaffold validation issues

---

## Getting Help

- **Commands:** `luma --help` or `luma <command> --help`
- **Concepts:** `luma explain --topic <topic>` (workflow, layout-solver, scoring, etc.)
- **FAQs:** `luma faq`
- **Code questions:** Read tests for examples of usage
- **Workflow questions:** See AGENTS.md

---

**You're ready to contribute! Pick an issue from `bd ready` and start coding.**
