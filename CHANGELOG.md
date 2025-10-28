# Changelog

All notable changes to the LUMA project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2025-10-28

### Added

#### Scaffold Generation & Contract
- **Scaffold Contract Topic** - Added `scaffold-contract` topic to `luma explain` command, providing deterministic rules for scaffold generation that AI agents must follow
- **Golden Template** - Created reference template at `templates/golden.todo.mock.json` demonstrating a fully-validated scaffold structure
- **Golden Template Topic** - Added `golden-template` topic to `luma explain` command for quick access to the reference template
- **`luma scaffold new` Command** - New command to generate valid scaffolds from predefined patterns:
  - `todo-list` pattern - Complete task management UI with table
  - `empty-screen` pattern - Minimal valid scaffold for starting from scratch
  - Customization options: `--title`, `--screen-id`, `--breakpoints`, `--force`
  - Pre-validation during generation ensures output always passes `luma ingest`
- **AGENT-RULES-SCAFFOLD.md** - Standalone reference file documenting the scaffold contract for easy agent access

#### Enhanced Error Reporting
- **Enhanced Issue Types** - Added `expected` and `found` fields to Issue type for clearer validation feedback
- **Error Enhancement Wrapper** - Intelligent error prioritization and actionable suggestions:
  - Single-error-at-a-time output by default (most critical blocking issue)
  - Contextual fix suggestions with code snippets
  - JSON pointer references to exact error locations
  - `--all-issues` flag to show all validation errors
  - `--no-suggest` flag to suppress fix suggestions
  - Smart error prioritization: schema > missing > enum > type

#### Documentation & Testing
- **AI Agent Quickstart Guide** - Comprehensive `AI-AGENT-QUICKSTART.md` for agent onboarding
- **Phase 1 Integration Tests** - 27 tests validating scaffold contract, golden template, and scaffold generation through full LUMA pipeline
- **Backward Compatibility Tests** - Ensures all v1.0 scaffolds continue to work unchanged under v1.1

### Changed
- Enhanced validator error messages to include precise location information via JSON pointers
- Improved ingest command error output for better agent and developer experience

### Technical Details
- **Backward Compatibility**: All v1.0 scaffolds and commands work unchanged
- **Schema Version**: Input scaffolds still use `schemaVersion: "1.0.0"`
- **New Folders**: `templates/` for reference scaffolds
- **Files Added**: 
  - `src/cli/scaffold.command.ts`
  - `src/core/scaffold/generator.ts`
  - `src/core/scaffold/patterns.ts`
  - `src/core/ingest/error-enhancer.ts`
  - `tests/integration/v1.1-phase1.test.ts`
  - `tests/compatibility/v1.0-scaffolds.test.ts`

---

## [1.0.0] - 2025-10-xx

### Initial Release

#### Core Features
- **Ingest Command** - Validate scaffold JSON structure against schema
- **Layout Command** - Compute responsive layouts and detect overflow issues
- **Keyboard Command** - Analyze tab sequence and keyboard accessibility
- **Flow Command** - Validate UX patterns (forms, tables)
- **Score Command** - Aggregate scores across all analysis dimensions
- **Report Command** - Generate HTML reports with visualization
- **Patterns Command** - List available UX pattern validators

#### Layout System
- **Stack Layout** - Vertical and horizontal stacking with gap and padding
- **Grid Layout** - Responsive grid with columns, rows, and gap
- **Box Layout** - Single-child container with padding
- **Responsive Analysis** - Multi-viewport testing with configurable breakpoints

#### Keyboard Accessibility
- **Tab Sequence Generation** - Automatic focus order calculation
- **Flow Rules** - Detect tab traps, invalid sequences, and missing focusability
- **Focusable Detection** - Smart detection of interactive elements

#### UX Patterns
- **Form.Basic** - Form validation with MUST/SHOULD/MAY rules
- **Table.Simple** - Table pattern validation with responsive strategies

#### Developer Experience
- **Exit Codes** - Standardized codes for programmatic use (0=success, 1=validation failed, 2=warnings, 3=invalid usage, 4=IO error)
- **JSON Output** - All commands support `--json` flag for machine-readable output
- **Help Topics** - `luma explain --topic <name>` for detailed concept documentation
- **FAQ System** - `luma faq` for common questions
- **Init Command** - `luma init` to set up LUMA in projects with agent instructions

#### Testing & Quality
- 191 tests across 18 test files
- Unit tests for all core modules
- Integration tests for complete workflows
- Example scaffolds in `examples/` directory

#### Technical Stack
- TypeScript 5.x with strict mode
- Commander.js for CLI
- Zod for schema validation
- Vitest for testing
- Node.js >= 18.0.0

---

## Release Notes

### v1.1.0 Highlights

This release focuses on **AI agent enablement** and **developer experience improvements**:

1. **Scaffold Generation** - Agents can now generate valid scaffolds using `luma scaffold new` instead of hand-crafting JSON
2. **Clear Contracts** - The scaffold contract topic removes ambiguity about what makes a valid scaffold
3. **Better Errors** - Enhanced error messages guide users to fixes faster with contextual suggestions
4. **Golden Template** - A reference scaffold provides a working example to learn from

All additions are **backward-compatible** - existing v1.0 scaffolds and workflows continue to work unchanged.

### Migration from v1.0

No migration needed! All v1.0 features work identically in v1.1. New features are purely additive:
- Use `luma scaffold new` if you want to generate scaffolds instead of writing JSON manually
- Use `luma explain --topic scaffold-contract` for contract reference
- Error messages are more helpful, but same exit codes and validation rules apply

---

[1.1.0]: https://github.com/JohanBellander/luma/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/JohanBellander/luma/releases/tag/v1.0.0
