# LUMA Implementation Plan

**Version**: 1.0  
**Target Language**: TypeScript  
**Estimated Timeline**: 4-6 weeks  
**Architecture**: Modular, functional, CLI-focused

---

## 1. Project Architecture

### 1.1 High-Level Structure
```
luma/
├── src/
│   ├── cli/              # Command-line interface
│   ├── core/             # Core business logic
│   │   ├── ingest/       # Schema validation & normalization
│   │   ├── layout/       # Headless layout simulation
│   │   ├── keyboard/     # Keyboard flow analysis
│   │   ├── patterns/     # UX pattern validation
│   │   └── scoring/      # Score aggregation
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Shared utilities
│   └── index.ts          # Main entry point
├── tests/
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── fixtures/         # Test scaffolds
├── docs/                 # Additional documentation
└── examples/             # Example scaffolds
```

### 1.2 Technology Stack
- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.x
- **CLI Framework**: Commander.js
- **Testing**: Vitest
- **Validation**: Zod (for schema validation)
- **Build**: TSC + esbuild (for bundling)
- **Linting**: ESLint + Prettier

---

## 2. Implementation Phases

### Phase 1: Project Setup & Core Types (Week 1)
**Goal**: Establish project foundation, tooling, and type system

#### Deliverables:
1. **Project Scaffolding**
   - Initialize npm/package.json
   - Configure TypeScript (tsconfig.json)
   - Set up build scripts
   - Configure ESLint + Prettier
   - Set up Vitest

2. **Type Definitions** (`src/types/`)
   - `scaffold.ts` - Complete Scaffold JSON types
   - `node.ts` - All node type interfaces (Stack, Grid, Box, Text, Button, Field, Form, Table)
   - `issue.ts` - Canonical Issue object shape
   - `viewport.ts` - Viewport & Frame types
   - `pattern.ts` - Pattern rule types
   - `output.ts` - Command output types

3. **Utilities** (`src/utils/`)
   - `run-folder.ts` - Run folder management (timestamp generation, path creation)
   - `exit-codes.ts` - Exit code constants
   - `json-pointer.ts` - JSON pointer utilities
   - `logger.ts` - Simple logging utility

#### Exit Criteria:
- ✅ `npm run build` compiles successfully
- ✅ `npm test` runs (even with no tests yet)
- ✅ All types exported and linted
- ✅ Run folder creation works

---

### Phase 2: Ingest Command (Week 1-2)
**Goal**: Implement scaffold validation and normalization

#### Deliverables:
1. **Schema Validation** (`src/core/ingest/`)
   - `validator.ts` - Zod schemas for all node types
   - `schema-version.ts` - Version check (support "1.0.0")
   - `normalize.ts` - Apply defaults, validate structure

2. **Ingest Logic**
   - `ingest.ts` - Main ingest orchestrator
   - Validate required fields
   - Check node ID uniqueness
   - Validate enums (widthPolicy, heightPolicy, etc.)
   - Emit errors/warnings as Issue objects

3. **CLI Command** (`src/cli/`)
   - `ingest.command.ts` - Commander.js command
   - File reading
   - JSON parsing with error handling
   - Write `ingest.json` to run folder
   - Proper exit codes (0, 2, 5)

4. **Tests** (`tests/unit/ingest/`)
   - Valid scaffold passes
   - Invalid schemaVersion → exit 5
   - Missing required fields → exit 2
   - Unknown fields ignored
   - Duplicate node IDs detected

#### Exit Criteria:
- ✅ `luma ingest <file>` works
- ✅ `--json` flag outputs machine-readable result
- ✅ All validation rules from spec enforced
- ✅ Test coverage ≥ 80%

---

### Phase 3: Responsive Override System (Week 2)
**Goal**: Implement responsive override application logic

#### Deliverables:
1. **Override Engine** (`src/core/layout/`)
   - `responsive.ts` - Parse `at` keys, apply overrides
   - Implement normative algorithm (Section 3.4 of spec)
   - Handle ascending/descending order correctly
   - Shallow merge objects, replace arrays

2. **Tests** (`tests/unit/layout/`)
   - Override at `>=320` applied correctly
   - Override at `<=768` applied correctly
   - Multiple overrides in correct order
   - Nested object merging
   - Array replacement

#### Exit Criteria:
- ✅ Override algorithm matches spec exactly
- ✅ Deterministic results
- ✅ Test coverage ≥ 90%

---

### Phase 4: Headless Layout Engine (Week 2-3)
**Goal**: Implement layout simulation and frame computation

#### Deliverables:
1. **Layout Primitives** (`src/core/layout/`)
   - `measure.ts` - Text, Button, Field, Table measurement
   - Text width estimation (fontSize * 0.55 * charCount)
   - Line wrapping logic
   - Touch target enforcement

2. **Container Layout**
   - `stack.ts` - Vertical/horizontal stack layout with gap/padding
   - `grid.ts` - Grid layout with column reduction
   - `box.ts` - Simple box with padding
   - Alignment logic (start, center, end, stretch)
   - Wrap support for horizontal stacks

3. **Layout Orchestrator**
   - `layout.ts` - Main layout engine
   - Pre-order traversal
   - Frame computation per node
   - Issue detection (overflow-x, spacing-off-scale, touch-target-too-small, primary-below-fold)

4. **CLI Command**
   - `layout.command.ts` - Parse viewports, run layout per viewport
   - Write `layout_<WxH>.json` per viewport
   - Exit code 3 if blocking issues

5. **Tests** (`tests/unit/layout/`)
   - Stack vertical layout
   - Stack horizontal with wrap
   - Grid column reduction
   - Overflow detection
   - Primary button below fold detection
   - Spacing validation against spacingScale

#### Exit Criteria:
- ✅ `luma layout <file> --viewports 320x640,768x1024` works
- ✅ Frames computed correctly per spec algorithms
- ✅ All layout issues detected
- ✅ Test coverage ≥ 85%

---

### Phase 5: Keyboard Flow Analysis (Week 3)
**Goal**: Implement keyboard tab sequence and flow validation

#### Deliverables:
1. **Keyboard Flow Engine** (`src/core/keyboard/`)
   - `traversal.ts` - Pre-order tree traversal
   - `focusable.ts` - Identify focusable nodes (Button, Field, focusable:true)
   - `sequence.ts` - Build tab sequence
   - `flow-rules.ts` - Detect cancel-before-primary, field-after-actions

2. **Form-Specific Logic**
   - Fields before actions validation
   - Action group analysis
   - Unreachable node detection

3. **CLI Command**
   - `keyboard.command.ts` - Generate keyboard.json
   - Optional `--state` parameter (for future multi-state support)
   - Exit code 3 if critical flow errors

4. **Tests** (`tests/unit/keyboard/`)
   - Pre-order traversal correct
   - Focusable nodes identified
   - Form field ordering
   - Unreachable detection
   - Cancel-before-primary warning

#### Exit Criteria:
- ✅ `luma keyboard <file>` works
- ✅ Tab sequence matches spec expectations
- ✅ All flow issues detected
- ✅ Test coverage ≥ 85%

---

### Phase 6: UX Pattern Library (Week 3-4)
**Goal**: Implement pattern validation with MUST/SHOULD rules

#### Deliverables:
1. **Pattern Definitions** (`src/core/patterns/`)
   - `pattern-registry.ts` - Registry of all patterns
   - `form-basic.ts` - Form.Basic pattern (GOV.UK)
   - `table-simple.ts` - Table.Simple pattern (IBM Carbon)
   - Each pattern exports: name, source {name, url}, must[], should[]

2. **Pattern Validation**
   - `validator.ts` - Run pattern rules against scaffold
   - Rule execution engine
   - Issue generation with source attribution
   - MUST failure detection

3. **CLI Command**
   - `flow.command.ts` - Accept --patterns flag
   - Parse pattern list (e.g., "form,table")
   - Write flow.json with per-pattern results
   - Exit code 3 if any MUST fails

4. **Tests** (`tests/unit/patterns/`)
   - Form.Basic MUST rules
   - Table.Simple MUST rules
   - SHOULD rules (warnings)
   - Pattern not found handling
   - Source attribution in issues

#### Exit Criteria:
- ✅ `luma flow <file> --patterns form,table` works
- ✅ All MUST/SHOULD rules implemented per spec
- ✅ Source URLs included in issues
- ✅ Test coverage ≥ 85%

---

### Phase 7: Scoring System (Week 4)
**Goal**: Implement category scoring and aggregation

#### Deliverables:
1. **Scoring Engine** (`src/core/scoring/`)
   - `categories.ts` - Category score calculation
   - Pattern Fidelity scoring (100 - 30*MUST - 10*SHOULD)
   - Flow & Reachability scoring
   - Hierarchy & Grouping scoring
   - Responsive Behavior scoring
   - `aggregate.ts` - Weighted aggregation

2. **Pass/Fail Logic**
   - Check: no MUST failures
   - Check: no critical flow errors
   - Check: overall ≥ 85 (configurable threshold)

3. **CLI Command**
   - `score.command.ts` - Read run folder artifacts
   - Optional `--weights` JSON override
   - Write score.json
   - Exit code 0 for pass, 3 for fail

4. **Tests** (`tests/unit/scoring/`)
   - Category calculations
   - Weight application
   - Pass criteria
   - Custom weight override

#### Exit Criteria:
- ✅ `luma score <run-dir>` works
- ✅ Scoring formulas match spec exactly
- ✅ Pass/fail logic correct
- ✅ Test coverage ≥ 90%

---

### Phase 8: Self-Description Commands (Week 4-5)
**Goal**: Implement introspection commands

#### Deliverables:
1. **Self-Description** (`src/cli/`)
   - `capabilities.command.ts` - List commands, exit codes, defaults
   - `schema.command.ts` - Summarize input/output schemas
   - `patterns.command.ts` - List/show patterns
   - `explain.command.ts` - Topic-based explanations
   - `faq.command.ts` - Q&A

2. **Static Data** (`src/data/`)
   - `faq.json` - Common questions
   - `topics.json` - Explanation topics
   - Embedded in build

3. **Tests**
   - All commands return valid JSON with `--json`
   - Content accuracy

#### Exit Criteria:
- ✅ All self-description commands work
- ✅ JSON output valid
- ✅ Documentation accurate

---

### Phase 9: Report Generation (Week 5)
**Goal**: Implement HTML report generation (optional feature)

#### Deliverables:
1. **Report Generator** (`src/core/report/`)
   - `template.ts` - HTML template
   - `render.ts` - Aggregate data from run folder
   - Summary sections: scores, issues by severity, per-viewport results
   - Issue grouping and formatting

2. **CLI Command**
   - `report.command.ts` - Generate report.html
   - `--out` parameter for output path

3. **Tests**
   - Report contains all expected sections
   - HTML is valid
   - Issues displayed correctly

#### Exit Criteria:
- ✅ `luma report <run-dir> --out report.html` works
- ✅ Report is readable and informative
- ✅ Test coverage ≥ 70%

---

### Phase 10: Integration & Polish (Week 5-6)
**Goal**: End-to-end testing, documentation, examples

#### Deliverables:
1. **Integration Tests** (`tests/integration/`)
   - Full workflow: ingest → layout → keyboard → flow → score
   - Happy path (Appendix A example)
   - Error scenarios
   - Multiple viewports
   - Pattern failures

2. **Example Scaffolds** (`examples/`)
   - `happy-form.json` - Valid form (from spec)
   - `overflow-table.json` - Table with overflow issue
   - `keyboard-issues.json` - Flow problems
   - `pattern-failures.json` - MUST violations

3. **Documentation**
   - Update README with installation instructions
   - Create QUICKSTART.md
   - Add API documentation
   - Document each Issue ID

4. **Performance Optimization**
   - Profile against target benchmarks:
     - ingest < 100ms
     - layout/viewport < 200ms
     - keyboard < 50ms
     - flow < 100ms
   - Optimize hot paths if needed

5. **CLI Polish**
   - Progress indicators for multi-viewport layout
   - Better error messages
   - Help text refinement
   - `--version` flag

#### Exit Criteria:
- ✅ All integration tests pass
- ✅ Examples run successfully
- ✅ Performance targets met
- ✅ Documentation complete
- ✅ Overall test coverage ≥ 80%

---

## 3. Testing Strategy

### Unit Tests
- Each module has corresponding test file
- Test pure functions in isolation
- Mock file I/O where needed
- Target: 80-90% coverage per module

### Integration Tests
- Test command workflows end-to-end
- Use real fixture files
- Validate JSON outputs
- Check exit codes

### Fixtures
- Maintain library of test scaffolds:
  - Valid minimal
  - Valid complex
  - Invalid (various error types)
  - Edge cases (empty children, max nesting, etc.)

---

## 4. Build & Deployment

### Build Process
1. TypeScript compilation → `dist/`
2. Bundle CLI with esbuild (single executable)
3. Make bin file executable (`chmod +x`)

### Package.json Scripts
```json
{
  "scripts": {
    "build": "tsc && esbuild src/index.ts --bundle --platform=node --outfile=dist/luma.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src --ext .ts",
    "format": "prettier --write 'src/**/*.ts'",
    "dev": "tsx watch src/index.ts"
  }
}
```

### Distribution
- npm package: `@luma/cli` or `luma-cli`
- GitHub releases with pre-built binaries
- Installation: `npm install -g luma-cli`

---

## 5. Dependencies

### Production Dependencies
- `commander` - CLI framework
- `zod` - Schema validation
- `chalk` (optional) - Terminal colors

### Dev Dependencies
- `typescript` - TypeScript compiler
- `vitest` - Testing framework
- `@types/node` - Node.js types
- `esbuild` - Bundler
- `tsx` - TypeScript executor (dev)
- `eslint` - Linter
- `prettier` - Code formatter
- `@vitest/coverage-v8` - Coverage reports

---

## 6. Risk Mitigation

### Risks & Mitigation

1. **Layout Algorithm Complexity**
   - Risk: Complex edge cases in layout simulation
   - Mitigation: Extensive unit tests, compare against manual calculations

2. **Responsive Override Logic**
   - Risk: Order-dependent bugs in override application
   - Mitigation: Formal test cases for all combinations, property-based testing

3. **Performance on Large Scaffolds**
   - Risk: Deep nesting or many nodes slow down analysis
   - Mitigation: Profile early, implement caching if needed, set max depth limits

4. **Type System Complexity**
   - Risk: Discriminated unions for node types can be error-prone
   - Mitigation: Use Zod for runtime validation, comprehensive type tests

---

## 7. Success Criteria

### Acceptance Checklist (from spec Appendix E)
- ✅ Inputs validated with clear error messages (exit 2 on failure)
- ✅ Layout produces frames & issues per viewport
- ✅ Keyboard returns a sequence & issues
- ✅ Pattern checks produce MUST/SHOULD outcomes with sources
- ✅ Score respects weights & thresholds and sets exit 3 on block
- ✅ Run folders are timestamped; prior runs untouched
- ✅ Self-description commands work and return strict JSON

### Additional Success Metrics
- ✅ All example scaffolds process without errors
- ✅ Test coverage ≥ 80% overall
- ✅ Performance targets met (Section 12 of spec)
- ✅ Zero known bugs in core functionality
- ✅ Documentation complete and accurate

---

## 8. Post-v1.0 Roadmap

### Future Enhancements (v1.1+)
1. **Modal.Basic Pattern** - Add dialog/modal validation
2. **Multi-State Support** - Analyze scaffolds across different states (default, error, loading, empty)
3. **Custom Pattern Definition** - Allow users to define custom patterns via config files
4. **Visual Diff Tool** - Compare scaffold versions
5. **LSP/Editor Integration** - Real-time validation in editors
6. **Web UI** - Browser-based scaffold editor + live validation
7. **Export to Design Tools** - Generate Figma/Sketch files from scaffolds

---

## 9. Timeline Summary

| Phase | Duration | Key Deliverable |
|-------|----------|-----------------|
| 1. Setup & Types | Week 1 | Project foundation |
| 2. Ingest | Week 1-2 | `luma ingest` |
| 3. Responsive | Week 2 | Override engine |
| 4. Layout | Week 2-3 | `luma layout` |
| 5. Keyboard | Week 3 | `luma keyboard` |
| 6. Patterns | Week 3-4 | `luma flow` |
| 7. Scoring | Week 4 | `luma score` |
| 8. Self-Describe | Week 4-5 | Introspection |
| 9. Report | Week 5 | `luma report` |
| 10. Integration | Week 5-6 | Polish & docs |

**Total: 4-6 weeks** (single developer, full-time equivalent)

---

## 10. Implementation Notes

### Code Style
- Functional programming preferred (pure functions, immutability)
- Avoid classes unless necessary (prefer modules)
- No side effects in core logic (all I/O isolated in CLI layer)
- Explicit error handling (no silent failures)

### Naming Conventions
- Files: kebab-case (`layout-engine.ts`)
- Functions: camelCase (`computeFrames()`)
- Types: PascalCase (`ScaffoldNode`)
- Constants: UPPER_SNAKE_CASE (`EXIT_CODE_INVALID`)

### Error Handling
- Use Result types or explicit error returns
- Never throw in core logic
- All errors become Issues where appropriate
- CLI layer handles process.exit()

---

**End of Implementation Plan**
