# LUMA v1.1 Implementation Plan

## Overview

This document provides a detailed implementation plan for LUMA v1.1 additions as specified in `LUMA-ADDITIONS-SPEC-v1.1.md`.

**Target Version:** 1.1.0  
**Implementation Approach:** Three phases with incremental testing  
**Estimated Effort:** ~40-60 hours

---

## Phase 1: Foundations (Est: 15-20 hours)

### 1.1 Scaffold Contract Topic
**Priority:** High  
**Dependencies:** None  
**Files to modify:**
- `src/data/topics.json` - Add `scaffold-contract` topic
- `AGENT-RULES-SCAFFOLD.md` - Create standalone reference file

**Implementation:**
1. Add `scaffold-contract` entry to `topics.json` with canonical contract text
2. Create `AGENT-RULES-SCAFFOLD.md` with same content
3. Test: `luma explain --topic scaffold-contract --json` returns expected text

**Acceptance Criteria:**
- [ ] Command returns canonical contract text verbatim
- [ ] `AGENT-RULES-SCAFFOLD.md` file exists and matches
- [ ] Topic listed in `luma explain` available topics

**Estimated Time:** 2 hours

---

### 1.2 Golden Template
**Priority:** High  
**Dependencies:** None  
**Files to create:**
- `templates/golden.todo.mock.json` - Pre-validated scaffold template
- `src/data/topics.json` - Add `golden-template` topic

**Implementation:**
1. Create `templates/` directory
2. Write `golden.todo.mock.json`:
   - Root: Stack vertical (gap: 16, padding: 24)
   - Title Text node
   - Toolbar Stack with "Add task" Button
   - Table with 3 columns, scroll strategy, minColumnWidth: 160
   - Settings: spacingScale, minTouchTarget, breakpoints
3. Validate template passes all checks
4. Add `golden-template` topic to `topics.json` that returns file contents

**Acceptance Criteria:**
- [ ] `luma ingest templates/golden.todo.mock.json` exits 0
- [ ] `luma layout templates/golden.todo.mock.json --viewports 320x640` shows no overflow
- [ ] `luma flow templates/golden.todo.mock.json` passes Table.Simple pattern
- [ ] `luma explain --topic golden-template --json` returns template content

**Estimated Time:** 4 hours

---

### 1.3 `luma scaffold new` Command (Basic Patterns)
**Priority:** High  
**Dependencies:** 1.2 (Golden Template)  
**Files to create:**
- `src/cli/scaffold.command.ts` - New command handler
- `src/core/scaffold/generator.ts` - Template generation logic
- `src/core/scaffold/patterns.ts` - Pattern definitions
- `test/scaffold.test.ts` - Command tests

**Implementation:**
1. Create `scaffold` subcommand structure with Commander.js
2. Implement pattern generators for:
   - `todo-list` (based on golden template)
   - `empty-screen` (minimal Stack with title)
3. Add CLI flags: `--pattern`, `--out`, `--title`, `--screen-id`, `--breakpoints`, `--force`
4. Validate generated scaffold with ingest validator before writing
5. Add helpful next-step output after generation

**Pattern Generation Logic:**
```typescript
interface PatternGenerator {
  generate(options: GenerateOptions): Scaffold;
}

type GenerateOptions = {
  screenId?: string;
  title?: string;
  breakpoints?: string[];
};
```

**Acceptance Criteria:**
- [ ] `luma scaffold new --pattern todo-list --out test.json` creates valid file
- [ ] `luma scaffold new --pattern empty-screen --out test.json` creates valid file
- [ ] Generated files pass `luma ingest` with exit 0
- [ ] Command prevents overwrite without `--force`
- [ ] Exit code 3 if generated scaffold fails validation
- [ ] Exit code 4 on file I/O errors
- [ ] Prints helpful next-step commands after success

**Estimated Time:** 8 hours

---

### 1.4 Phase 1 Integration & CI
**Priority:** High  
**Dependencies:** 1.1, 1.2, 1.3  
**Files to modify:**
- `test/integration/v1.1-phase1.test.ts` - Integration tests
- `.github/workflows/test.yml` - CI updates (if exists)

**Implementation:**
1. Write integration test that:
   - Generates scaffold from each pattern
   - Runs full LUMA pipeline (ingest → layout → keyboard → flow → score)
   - Verifies passing scores
2. Update CI to run new tests

**Acceptance Criteria:**
- [ ] Integration test passes for all Phase 1 patterns
- [ ] CI runs successfully with Phase 1 features

**Estimated Time:** 2 hours

---

## Phase 2: Enhanced Validation (Est: 12-15 hours)

### 2.1 Enhanced Error Structure (Core)
**Priority:** High  
**Dependencies:** None  
**Files to modify:**
- `src/core/ingest/validator.ts` - Enrich Issue objects
- `src/types/issue.ts` - Add new Issue fields

**Implementation:**
1. Extend `Issue` type with new fields:
   ```typescript
   interface Issue {
     // Existing fields
     id: string;
     severity: 'error' | 'warn' | 'info';
     message: string;
     nodeId?: string;
     
     // New fields
     jsonPointer?: string;
     expected?: string;
     found?: any;
   }
   ```
2. Update validator to populate `jsonPointer`, `expected`, `found` for all errors
3. Maintain backward compatibility (new fields optional)

**Acceptance Criteria:**
- [ ] All schema validation errors include `jsonPointer`
- [ ] All errors include `expected` and `found` where applicable
- [ ] Existing tests still pass (no breaking changes)

**Estimated Time:** 6 hours

---

### 2.2 Error Enhancement Wrapper
**Priority:** High  
**Dependencies:** 2.1  
**Files to create:**
- `src/core/ingest/error-enhancer.ts` - Suggestion/action logic
- `test/error-enhancer.test.ts` - Tests

**Files to modify:**
- `src/cli/ingest.command.ts` - Integrate enhancer

**Implementation:**
1. Create error enhancer that:
   - Prioritizes errors (schema > missing > enum > type)
   - Adds `suggestion` field with fix snippet
   - Adds `nextAction` field with command to run
   - Supports `--all-issues`, `--no-suggest`, `--format` flags
2. Integrate into ingest command
3. Default behavior: show top-1 blocking issue only

**Error Priority Logic:**
```typescript
const ERROR_PRIORITY = {
  'schema-invalid': 1,
  'schema-missing-field': 2,
  'enum-violation': 3,
  'type-mismatch': 4,
  'validation-failed': 5
};
```

**Acceptance Criteria:**
- [ ] Default output shows single most critical error
- [ ] `--all-issues` shows all errors
- [ ] `--no-suggest` suppresses suggestions
- [ ] `--format verbose` shows full error details
- [ ] All errors include `suggestion` and `nextAction`

**Estimated Time:** 5 hours

---

### 2.3 Backward Compatibility Tests
**Priority:** Critical  
**Dependencies:** 2.1, 2.2  
**Files to create:**
- `test/compatibility/v1.0-scaffolds.test.ts` - Regression tests

**Implementation:**
1. Collect all existing v1.0 example scaffolds
2. Run full LUMA pipeline on each
3. Verify identical results to v1.0 behavior
4. Add test to CI

**Acceptance Criteria:**
- [ ] All v1.0 scaffolds pass ingest/layout/keyboard/flow
- [ ] Scores match v1.0 baseline (±1 point tolerance)
- [ ] No new errors introduced

**Estimated Time:** 2 hours

---

## Phase 3: Composition Features (Est: 12-18 hours)

### 3.1 Snippets Pack
**Priority:** Medium  
**Dependencies:** None  
**Files to create:**
- `snippets/stack.vertical.json` - Vertical stack fragment
- `snippets/stack.horizontal.toolbar.json` - Toolbar fragment
- `snippets/form.basic.json` - Basic form fragment
- `snippets/table.simple.json` - Simple table fragment
- `snippets/button.primary.json` - Primary button fragment
- `snippets/field.email.json` - Email field fragment
- `snippets/index.json` - Metadata and usage hints
- `src/data/topics.json` - Add `snippets` topic

**Implementation:**
1. Create `snippets/` directory
2. Write each snippet as valid, self-contained JSON
3. Create `index.json` with metadata:
   ```json
   {
     "snippets": [
       {
         "file": "form.basic.json",
         "label": "Form (2 fields + actions)",
         "insertInto": ["Stack.children", "Box.child"],
         "notes": "Actions must follow fields."
       }
     ]
   }
   ```
4. Add `snippets` topic to return index content
5. Validate each snippet by inserting into golden template

**Acceptance Criteria:**
- [ ] All 6 snippets created and valid JSON
- [ ] `snippets/index.json` exists with metadata
- [ ] `luma explain --topic snippets --json` returns index
- [ ] Each snippet passes ingest when inserted into golden template

**Estimated Time:** 6 hours

---

### 3.2 Expand `luma scaffold new` Patterns
**Priority:** Medium  
**Dependencies:** 1.3, 3.1  
**Files to modify:**
- `src/core/scaffold/patterns.ts` - Add new pattern generators

**Implementation:**
1. Add `form-basic` pattern generator (2 fields, Cancel/Save)
2. Add `table-simple` pattern generator (standalone table)
3. Use snippets as building blocks where applicable

**Acceptance Criteria:**
- [ ] `form-basic` pattern generates valid scaffold
- [ ] `table-simple` pattern generates valid scaffold
- [ ] Both patterns pass full LUMA pipeline
- [ ] Patterns use snippets internally where appropriate

**Estimated Time:** 4 hours

---

### 3.3 Snippets Integration Tests
**Priority:** Medium  
**Dependencies:** 3.1, 3.2  
**Files to create:**
- `test/integration/snippets.test.ts` - Snippet insertion tests

**Implementation:**
1. Test inserting each snippet into golden template
2. Test composing scaffolds from multiple snippets
3. Verify combined scaffold passes validation

**Acceptance Criteria:**
- [ ] Each snippet can be inserted into golden template
- [ ] Combined scaffolds pass ingest/layout/flow
- [ ] Snippets compose correctly (no ID conflicts, valid structure)

**Estimated Time:** 3 hours

---

## Phase 4: Documentation & Polish (Est: 6-8 hours)

### 4.1 Update AGENTS.md
**Priority:** High  
**Dependencies:** All features complete  
**Files to modify:**
- `AGENTS.md` - Add preflight checklist

**Implementation:**
1. Add "Preflight / Before You Generate" section
2. Reference scaffold contract
3. Add example workflow using new commands:
   ```bash
   # Quick start
   luma scaffold new --pattern todo-list --out ui/todo.json
   luma ingest ui/todo.json
   ```

**Estimated Time:** 2 hours

---

### 4.2 Update README and QUICKSTART
**Priority:** Medium  
**Dependencies:** All features complete  
**Files to modify:**
- `README.md` - Add v1.1 feature highlights
- `QUICKSTART.md` - Update with `scaffold new` examples

**Implementation:**
1. Add v1.1 section to README
2. Update QUICKSTART to use `luma scaffold new` in Step 0
3. Link to new topics (scaffold-contract, golden-template, snippets)

**Estimated Time:** 2 hours

---

### 4.3 Version Bump & Changelog
**Priority:** High  
**Dependencies:** All features complete  
**Files to modify:**
- `package.json` - Bump to 1.1.0
- `CHANGELOG.md` - Document v1.1 additions

**Implementation:**
1. Update version in package.json
2. Create CHANGELOG.md if doesn't exist
3. Document all v1.1 additions

**Estimated Time:** 1 hour

---

### 4.4 Final Integration Test
**Priority:** Critical  
**Dependencies:** All features complete  
**Files to create:**
- `test/integration/v1.1-complete.test.ts` - End-to-end workflow test

**Implementation:**
1. Test complete agent workflow:
   - Read contract: `luma explain --topic scaffold-contract`
   - Generate scaffold: `luma scaffold new --pattern form-basic`
   - Validate: `luma ingest`
   - Get suggestions on errors (if any)
   - Insert snippets
   - Re-validate
   - Run full pipeline
2. Verify all exit codes correct
3. Verify all outputs match spec

**Estimated Time:** 2 hours

---

## Testing Strategy

### Unit Tests
- All new functions have unit tests
- Coverage target: 80%+ for new code
- Test files co-located with source

### Integration Tests
- Phase-specific integration tests
- Cross-feature integration tests
- Backward compatibility regression tests

### Manual Testing Checklist
- [ ] Generate scaffold from each pattern
- [ ] Insert each snippet into template
- [ ] Trigger each error type and verify enhanced output
- [ ] Run with all CLI flags
- [ ] Test file overwrite protection
- [ ] Test custom breakpoints/title/screen-id

---

## Risk Assessment

### High Risk
- **Breaking changes in validator:** Mitigate with extensive regression tests
- **Pattern generation bugs:** Mitigate with validation-on-generate

### Medium Risk
- **Snippet composition conflicts:** Mitigate with ID generation strategy
- **Error enhancement complexity:** Mitigate with incremental implementation

### Low Risk
- **Documentation updates:** Easy to fix post-release
- **Topic additions:** Non-breaking, easy to verify

---

## Rollout Plan

### Pre-Release
1. Complete Phase 1-3 implementation
2. Pass all tests (unit + integration + compatibility)
3. Internal testing with AI agents
4. Documentation complete

### Release
1. Merge to master
2. Tag v1.1.0
3. Update npm package
4. Announce in README

### Post-Release
1. Monitor for compatibility issues
2. Gather agent feedback
3. Plan v1.2 enhancements

---

## Success Metrics

- [ ] All Phase 1-3 features implemented and tested
- [ ] 100% backward compatibility with v1.0 scaffolds
- [ ] All built-in patterns pass full LUMA pipeline
- [ ] All snippets validate correctly
- [ ] Enhanced errors provide actionable suggestions
- [ ] Documentation complete and accurate
- [ ] CI/CD pipeline green
- [ ] Zero breaking changes

---

## Estimated Timeline

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Phase 1: Foundations | 15-20 hrs | 15-20 hrs |
| Phase 2: Enhanced Validation | 12-15 hrs | 27-35 hrs |
| Phase 3: Composition Features | 12-18 hrs | 39-53 hrs |
| Phase 4: Documentation & Polish | 6-8 hrs | 45-61 hrs |

**Total: 45-61 hours** (approximately 1-1.5 weeks of focused development)

---

## Next Steps

1. Review this plan for approval
2. Create Beads issues for each task
3. Set up Phase 1 development branch
4. Begin implementation with 1.1 (Scaffold Contract)

---

**End of Implementation Plan**
