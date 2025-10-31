# Guided Flow Pattern Implementation Plan (v1.1-GF)

This plan details adding the `Guided.Flow` (CLI name: `guided-flow`) UX pattern to LUMA, following `LUMA-PATTERN-Guided-Flow-SPEC.md`.

## 1. Objectives
- Provide deterministic validation of multi-step wizard scaffolds.
- Support explicit activation (`--patterns guided-flow`) and hint-based auto-activation (presence of `behaviors.guidedFlow.role` in any node).
- Integrate issues into existing `flow.json`, scoring, and reporting without breaking backward compatibility.

## 2. Scope
- Structural & flow validation only (no styling / runtime simulation).
- Reuses traversal (`traversePreOrder`) and keyboard analysis ordering for action row order warnings.

## 3. Data & Schema Extensions
- No base schema changes required; pattern consumes optional `behaviors.guidedFlow` hints:
  - Wizard container: `role:"wizard"`, `totalSteps`, `hasProgress`, optional `progressNodeId`.
  - Step node: `role:"step"`, `stepIndex`, optional `totalSteps`, optional `nextId`, `prevId`.
  - Optional `affordances: ["progress-indicator"]` for progress discovery.
- Derive `totalSteps` if absent on steps by max `stepIndex`.

## 4. Discovery Algorithm
1. Collect all nodes (visible-only for most rules; include invisible for indices check? -> Use visible nodes only; invisible steps ignored to avoid phantom indices).
2. Find wizard container(s): any node with `behaviors.guidedFlow.role === 'wizard'`.
   - If multiple wizard containers: treat each independently; step nodes must be descendants for container association.
3. Gather steps: nodes with `behaviors.guidedFlow.role === 'step'`.
   - Associate with nearest ancestor wizard container if present; else global scope.
4. For each scope (container or global):
   - Determine `totalSteps` (container value or max stepIndex).
   - Build ordered map by `stepIndex`.

## 5. Rule Evaluation
### MUST
- wizard-steps-missing: Indices must form contiguous 1..N and unique.
- wizard-next-missing: Step 1 lacks Next; intermediate lacks Next.
- wizard-back-illegal: Step 1 includes Back.
- wizard-back-missing: Intermediate steps (2..N-1) lack Back.
- wizard-finish-missing: Last step lacks Finish/Submit/Done.
- wizard-field-after-actions: In any step subtree, a Field appears after action row (fields must precede buttons); Form reuse or horizontal Stack detection.
- wizard-multiple-primary: >1 `roleHint:"primary"` in action row.

### SHOULD
- wizard-progress-missing: `hasProgress:true` but cannot resolve progress indicator.
- wizard-actions-order: Back appears after Next/Finish in detected action row sequence (pre-order keyboard sequence or row child order).
- wizard-step-title-missing: Missing top-level Text heading near top of step subtree (heuristic: first child not Text or no Text before first Field).
- wizard-primary-below-fold: At smallest viewport layout frame (requires layout artifact integration; if present) primary action's y+height > viewport height.

## 6. Action Row Detection
Priority:
1. If step is a `Form`: use `form.actions`.
2. Explicit `Stack` horizontal whose children are buttons and appears last among such stacks.
3. Fallback: Last cluster of buttons in pre-order for the step subtree.

## 7. Action Identification
- Explicit via `nextId` / `prevId` referencing Button nodes.
- Heuristic textual classification (case-insensitive sets):
  - Back: {"Back","Previous"}
  - Next: {"Next","Continue"}
  - Finish: {"Finish","Submit","Done"}
- Primary requirement: For finish, must have `roleHint:"primary"`.

## 8. Suggestions
Implement mapping per spec §5 similar to Progressive Disclosure suggestions, new constant `GUIDED_FLOW_SUGGESTIONS`.

## 9. Issue Construction
Populate Issue fields:
- `id`: per rule.
- `severity`: error for MUST, warn for SHOULD.
- `message`: concise description including stepIndex & nodeId.
- `nodeId`: step or wizard container.
- `details`: structured: `{ stepIndex, expectedRange, foundIndices, scopeNodeId, actionRowNodeId }` as applicable.
- `suggestion`: from suggestions map.
- `source`: `{ pattern: 'Guided.Flow', name: 'Multi‑Step Flow References', url: 'https://www.nngroup.com/articles/wizard-design/' }` (pick NNGroup as canonical; store others optionally?).

## 10. Pattern Definition Object
`GuidedFlow` exported from `guided-flow.ts` implementing `Pattern` interface:
- `name: 'Guided.Flow'` (full)
- Alias registration: `'guided-flow'`.
- `must: PatternRule[]` for each MUST rule.
- `should: PatternRule[]` for each SHOULD rule.
Rules implemented via pure functions over root node calling internal helpers for step extraction.

## 11. Registry Changes
In `pattern-registry.ts` add:
```
import { GuidedFlow } from './guided-flow.js';
patterns.set('guided-flow', GuidedFlow);
patterns.set('Guided.Flow', GuidedFlow);
```

## 12. CLI Auto-Activation
In `flow.command.ts` add detection similar to `hasDisclosureHints`:
- `hasGuidedFlowHints(root)` checks for any `behaviors.guidedFlow.role`.
If hints present and pattern list lacks `Guided.Flow` or alias, append GuidedFlow pattern.

## 13. Scoring Integration
- Extend scoring aggregator to recognize Guided.Flow pattern results.
- Deduction scheme: each MUST failure `-30`, each SHOULD failure `-10` within Pattern Fidelity category.
- Update scoring logic (where pattern fidelity is computed) to include Guided.Flow deductions; ensure floor 0.
- Add test verifying pattern fidelity score with various failure counts.

## 14. Tests
### Unit (patterns / guided-flow)
- Step sequence success & missing index.
- Navigation actions presence (first, intermediate, last variants).
- Illegal Back on first step.
- Multiple primary detection.
- Fields after actions.
- Progress missing when `hasProgress:true`.
- Actions ordering warning.
- Step title missing.
- Primary below fold (simulate layout by crafting layout artifact stub or mark TODO if layout integration not yet implemented; if layout integration required, create integration test).

### Integration
- Valid 3-step wizard passes with no issues.
- Mixed issues produce correct counts and severities.
- Auto-activation: Provide scaffold with hints and run flow command with unrelated pattern list; ensure Guided.Flow added.
- Backward compatibility: No hints & not requested -> no Guided.Flow in output.

## 15. Edge Cases & Considerations
- Duplicate `stepIndex`: triggers wizard-steps-missing.
- Missing `totalSteps` everywhere: derive from max index; verify range contiguous.
- Invisible steps: exclude from sequence; if gaps created solely by invisibility we do NOT issue missing (Design choice: Visible-only. Document reasoning.)
- Multiple wizard containers: treat separately; each must satisfy contiguous sequence independently.
- Nested steps: only direct descendants of the container considered? Spec: "descendant" — implement depth-inclusive but same container scope.
- Button text localization: fallback heuristics may miss; explicit nextId/prevId recommended; if cannot classify Next/Finish by text or id, issue missing.
- Primary action detection: require `roleHint:"primary"`; if Finish exists without primary roleHint, treat as missing finish.
- Layout integration deferred if layout frames not accessible during flow stage (consider reading layout artifact if run folder shared; else skip `wizard-primary-below-fold` or mark planned integration).

## 16. Performance
- Single pre-order traversal for extraction, reuse arrays for rule checks.
- Avoid repeated full-tree traversals inside each rule by precomputing step subtrees.

## 17. Implementation Phases
1. Scaffolding: create file `guided-flow.ts`, suggestions map.
2. Step extraction helpers.
3. MUST rules implementation & tests.
4. SHOULD rules (excluding below fold) & tests.
5. Primary below fold rule (integration with layout) & test.
6. Registry & CLI auto-activation.
7. Scoring integration.
8. Documentation & examples.
9. Final regression & performance review.

## 18. Acceptance Criteria
- `luma patterns --list` shows Guided.Flow with correct rule counts.
- `luma patterns --show Guided.Flow --json` returns all rule IDs & descriptions.
- Flow analysis with valid wizard yields zero Guided.Flow issues & no mustFailures.
- Introducing each failure triggers appropriate issue ID and suggestion.
- Scoring deducts -30 per MUST & -10 per SHOULD for Guided.Flow.
- Auto-activation works with hints present when not explicitly requested.
- No issues emitted when pattern not requested and no hints (silent back-compat).

## 19. Documentation Updates
- QUICKSTART: Add example invocation for guided-flow and mention hints.
- README: Add Guided Flow description and pattern table row.
- CHANGELOG: Entry under `Added` for Guided Flow pattern.
- AGENTS.md: Advise agents about hints and activation.
- PATTERNS section in SPECIFICATION or separate patterns doc updated.

## 20. Open Questions / TBD
- Layout artifact availability at flow stage: If not accessible, either (a) require chained run and read layout JSON from same folder or (b) move below-fold check to layout stage and reflect as pattern issue by cross-artifact reference. Decision: Phase 2—initial release may skip `wizard-primary-below-fold` with explicit TODO test stub; mark in CHANGELOG.
- Multiple progress indicators: choose first by pre-order.

## 21. Risk & Mitigation
- Text heuristic false negatives: Encourage explicit `nextId`/`prevId` in docs.
- Performance overhead: Minimized by single traversal and caching step subtrees.
- Backward compatibility: Guarded by auto-activation only when hints present.

## 22. Beads Issue Mapping
(See separate bd issues for execution; each phase is an independent issue with dependencies.)

---

Prepared: 2025-10-31
