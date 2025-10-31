/**
 * Guided.Flow pattern scaffolding
 *
 * Implements skeleton MUST/SHOULD rules per LUMA-PATTERN-Guided-Flow-SPEC.md
 * with placeholder logic. Actual validation logic will be filled in under
 * issue LUMA-71 (Validator scaffolding) and subsequent tasks.
 */
import type { Pattern, PatternRule } from './types.js';
import type { Node, ButtonNode } from '../../types/node.js';
import type { Issue } from '../../types/issue.js';

// Helper placeholder: collect all nodes (simple depth-first)
function collectNodes(root: Node, acc: Node[] = []): Node[] {
  acc.push(root);
  if ('children' in root && Array.isArray((root as any).children)) {
    for (const child of (root as any).children as Node[]) {
      collectNodes(child, acc);
    }
  } else if (root.type === 'Box' && (root as any).child) {
    collectNodes((root as any).child, acc);
  } else if (root.type === 'Form') {
    const form = root as any;
    if (Array.isArray(form.fields)) {
      for (const f of form.fields as Node[]) collectNodes(f, acc);
    }
    if (Array.isArray(form.actions)) {
      for (const a of form.actions as Node[]) collectNodes(a, acc);
    }
  }
  return acc;
}

// Detect any guided flow hints
function hasGuidedFlowHints(root: Node): boolean {
  return collectNodes(root).some(n => n.behaviors?.guidedFlow);
}

/** Guided Flow helper types */
export interface GuidedFlowStep {
  node: Node; // original step node
  index: number; // stepIndex (1-based)
  total: number; // resolved totalSteps
  actionsRow?: Node; // detected actions container (Stack/Form actions array holder)
  buttons: ButtonNode[]; // all buttons considered actions (in row or form.actions)
}

export interface GuidedFlowScopeResolution {
  scopeNode?: Node; // wizard container if present; undefined means global scope
  steps: GuidedFlowStep[]; // resolved ordered steps
  indices: number[]; // raw indices found
  totalSteps: number; // resolved total steps (from container or max index)
}

/**
 * Resolve wizard scope and steps per spec Section 4.
 * - If a wizard container with role:"wizard" exists, only its descendant steps are considered.
 * - Otherwise all nodes with role:"step" participate.
 * - Derive totalSteps if missing from max stepIndex.
 */
export function resolveGuidedFlowScope(root: Node): GuidedFlowScopeResolution {
  const all = collectNodes(root);
  const wizardContainers = all.filter(n => n.behaviors?.guidedFlow?.role === 'wizard');
  const scopeNode = wizardContainers[0]; // first wizard container if any

  // Candidate step nodes based on scope
  const stepCandidates = all.filter(n => n.behaviors?.guidedFlow?.role === 'step');
  const scopedSteps = scopeNode
    ? stepCandidates.filter(s => isDescendant(scopeNode, s))
    : stepCandidates;

  // Build GuidedFlowStep objects
  const steps: GuidedFlowStep[] = [];
  for (const stepNode of scopedSteps) {
    // Skip invisible steps; validation logic will treat missing indices differently from hidden nodes
    if (stepNode.visible === false) continue;
    const gf = stepNode.behaviors!.guidedFlow!; // role:'step'
    if (!gf.stepIndex || gf.stepIndex < 1) continue; // skip invalid indices; validator will flag later
    const total = gf.totalSteps || 0; // may be 0; we derive below
    const { actionsRow, buttons } = detectActions(stepNode);
    steps.push({ node: stepNode, index: gf.stepIndex, total, actionsRow, buttons });
  }
  // Determine totalSteps precedence: wizard container totalSteps if set; else first non-zero steps matching; else max index
  const explicitTotals = [
    scopeNode?.behaviors?.guidedFlow?.totalSteps,
    ...steps.map(s => (s.total > 0 ? s.total : undefined)),
  ].filter((v): v is number => typeof v === 'number' && v > 0);
  const totalSteps = explicitTotals.length > 0 ? explicitTotals[0] : Math.max(0, ...steps.map(s => s.index));

  // Backfill total field for each step if 0
  for (const s of steps) {
    if (s.total === 0) s.total = totalSteps;
  }

  // Order by index ascending (ties remain - later validators will catch duplicates)
  steps.sort((a, b) => a.index - b.index);
  return {
    scopeNode,
    steps,
    indices: steps.map(s => s.index),
    totalSteps,
  };
}

/**
 * Resolve ALL guided flow scopes (multi-wizard support).
 * Returns an array of scope resolutions. If no wizard container exists,
 * returns a single global scope. If multiple wizard containers exist, a
 * separate scope is returned for each; any standalone step nodes not
 * belonging to a container form an additional global scope.
 */
export function resolveGuidedFlowScopes(root: Node): GuidedFlowScopeResolution[] {
  const all = collectNodes(root);
  const wizardContainers = all.filter(n => n.behaviors?.guidedFlow?.role === 'wizard');
  const stepCandidates = all.filter(n => n.behaviors?.guidedFlow?.role === 'step');

  // Map steps to the first ancestor wizard container (if any)
  const scopes: GuidedFlowScopeResolution[] = [];
  const containerStepsMap = new Map<Node, Node[]>();
  for (const container of wizardContainers) {
    containerStepsMap.set(container, []);
  }
  const globalSteps: Node[] = [];
  for (const step of stepCandidates) {
    // Identify containing wizard (first for which isDescendant returns true)
    const container = wizardContainers.find(c => isDescendant(c, step));
    if (container) {
      containerStepsMap.get(container)!.push(step);
    } else {
      globalSteps.push(step);
    }
  }

  // Build scope resolutions
  for (const [container] of containerStepsMap.entries()) {
    scopes.push(resolveGuidedFlowScope(container));
  }
  if (wizardContainers.length === 0 || globalSteps.length > 0) {
    // Construct a synthetic root with just the global steps to reuse logic
    const syntheticRoot: Node = {
      id: '__guided_flow_global_scope',
      type: 'Stack',
      direction: 'vertical',
      children: globalSteps,
    } as Node;
    const globalResolution = resolveGuidedFlowScope(syntheticRoot);
    // Indicate no container
    globalResolution.scopeNode = undefined;
    scopes.push(globalResolution);
  }
  return scopes;
}

/** Determine if descendant relationship (including self) */
function isDescendant(parent: Node, candidate: Node): boolean {
  if (parent === candidate) return true;
  if ('children' in parent && Array.isArray((parent as any).children)) {
    for (const child of (parent as any).children as Node[]) {
      if (isDescendant(child, candidate)) return true;
    }
  } else if (parent.type === 'Box' && (parent as any).child) {
    return isDescendant((parent as any).child, candidate);
  } else if (parent.type === 'Form') {
    const form = parent as any;
    if (Array.isArray(form.fields)) {
      for (const f of form.fields as Node[]) if (isDescendant(f, candidate)) return true;
    }
    if (Array.isArray(form.actions)) {
      for (const a of form.actions as Node[]) if (isDescendant(a, candidate)) return true;
    }
  }
  return false;
}

/**
 * Detect actions row within a step subtree per spec Section 4.
 * Priority:
 * 1. Form.actions if step node itself is a Form
 * 2. Last horizontal Stack whose children are Buttons
 * 3. Fallback: any leaf Stack containing ≥1 Buttons (last in traversal)
 */
function detectActions(stepNode: Node): { actionsRow?: Node; buttons: ButtonNode[] } {
  // Case 1: Form node
  if (stepNode.type === 'Form') {
    const form = stepNode as any;
    const buttons = Array.isArray(form.actions) ? (form.actions as ButtonNode[]) : [];
    return { actionsRow: stepNode, buttons };
  }
  // Traverse subtree to find candidate stacks
  const nodes = collectNodes(stepNode);
  const stackCandidates = nodes.filter(n => n.type === 'Stack');
  const horizontalStacks = stackCandidates.filter(s => (s as any).direction === 'horizontal');
  // Horizontal stacks whose children are all Buttons (or majority)
  const actionLike = horizontalStacks.filter(s => {
    const children = (s as any).children as Node[];
    if (!children || children.length === 0) return false;
    const buttonCount = children.filter(c => c.type === 'Button').length;
    return buttonCount > 0 && buttonCount === children.length; // all buttons
  });
  if (actionLike.length > 0) {
    // Choose last one (closest to bottom)
    const chosen = actionLike[actionLike.length - 1];
    return { actionsRow: chosen, buttons: ((chosen as any).children as ButtonNode[]) };
  }
  // Fallback: any leaf stack with ≥1 button (last in traversal order)
  const leafStackWithButtons: Node[] = [];
  for (const s of stackCandidates) {
    const children = (s as any).children as Node[];
    if (!children || children.length === 0) continue;
    const buttonChildren = children.filter(c => c.type === 'Button');
    const nonContainerChildren = children.filter(c => c.type !== 'Stack' && c.type !== 'Grid' && c.type !== 'Box' && c.type !== 'Form');
    if (buttonChildren.length > 0 && nonContainerChildren.length === children.length) {
      leafStackWithButtons.push(s);
    }
  }
  if (leafStackWithButtons.length > 0) {
    const chosen = leafStackWithButtons[leafStackWithButtons.length - 1];
    const children = (chosen as any).children as Node[];
    const buttons = children.filter(c => c.type === 'Button') as ButtonNode[];
    return { actionsRow: chosen, buttons };
  }
  return { actionsRow: undefined, buttons: [] };
}

// ---- Suggestions map (expanded) ----
const SUGGESTIONS: Record<string, string> = {
  'wizard-steps-missing': 'Define contiguous stepIndex values 1..N. Example: {"behaviors":{"guidedFlow":{"role":"step","stepIndex":2,"totalSteps":4}}}',
  'wizard-next-missing': 'Add a Next button: {"id":"next-<i>","type":"Button","text":"Next","roleHint":"primary"}',
  'wizard-back-missing': 'Add a Back button before Next: {"id":"back-<i>","type":"Button","text":"Back"}',
  'wizard-back-illegal': 'Remove Back from the first step or move it to step 2.',
  'wizard-finish-missing': 'Add a Finish action: {"id":"finish","type":"Button","text":"Finish","roleHint":"primary"}',
  'wizard-field-after-actions': 'Ensure fields appear before the actions row. Move the actions Stack below all Field nodes.',
  'wizard-multiple-primary': 'Keep only one primary action per step; remove roleHint or demote extras.',
  'wizard-progress-missing': 'Add a visible progress indicator: {"id":"progress-1","type":"Text","text":"Step 1 of 4"} and reference it via behaviors.guidedFlow.progressNodeId.',
  'wizard-actions-order': 'Order actions as Back then Next/Finish inside the actions row.',
  'wizard-step-title-missing': 'Add a heading Text near the top of each step: {"id":"step-<i>-title","type":"Text","text":"Step <i> — Details"}',
};

function makeIssue(id: string, node: Node | undefined, message: string, details: any, severity: 'error' | 'warn' = 'error'): Issue {
  return {
    id,
    severity,
    message,
    nodeId: node?.id,
    jsonPointer: node ? `/screen/root/.../${node.id}` : undefined,
    source: { pattern: 'Guided.Flow', name: 'LUMA Spec – Guided Flow', url: 'https://spec.local/guided-flow' },
    details,
    suggestion: SUGGESTIONS[id],
  } as Issue;
}

// Helper: classify button by text heuristics
function classifyButton(btn: ButtonNode): 'back' | 'next' | 'finish' | 'other' {
  const text = (btn.text || '').toLowerCase();
  if (/^(back|previous)$/.test(text)) return 'back';
  if (/^(next|continue)$/.test(text)) return 'next';
  if (/^(finish|submit|done)$/.test(text)) return 'finish';
  return 'other';
}

// MUST rule implementations (subset)
const mustRules: PatternRule[] = [
  {
    id: 'wizard-steps-missing',
    level: 'must',
    description: 'Steps must form contiguous 1..N sequence',
    check: (root: Node) => {
      const scopes = resolveGuidedFlowScopes(root);
      const issues: Issue[] = [];
      for (const scope of scopes) {
        if (scope.steps.length === 0) continue; // nothing to validate
        const expectedRange = Array.from({ length: scope.totalSteps }, (_, i) => i + 1);
        const indices = scope.indices;
        const contiguous = indices.length === expectedRange.length && expectedRange.every(v => indices.includes(v));
        const unique = new Set(indices).size === indices.length;
        if (!contiguous || !unique) {
          issues.push(
            makeIssue('wizard-steps-missing', scope.scopeNode || scope.steps[0].node, 'Step indices must be unique & contiguous 1..N', {
              expectedRange,
              foundIndices: indices,
              totalSteps: scope.totalSteps,
              scopeNodeId: scope.scopeNode?.id,
            })
          );
        }
      }
      return issues;
    },
  },
  {
    id: 'wizard-next-missing',
    level: 'must',
    description: 'Each step must have required next action (or finish on last step)',
    check: (root: Node) => {
      const scopes = resolveGuidedFlowScopes(root);
      const issues: Issue[] = [];
      for (const scope of scopes) {
        for (const step of scope.steps) {
          const isLast = step.index === scope.totalSteps && scope.totalSteps > 0;
          // Determine actions present
          const classifications = step.buttons.map(classifyButton);
          const hasNext = classifications.includes('next');
          const hasFinish = classifications.includes('finish');
          if (!isLast && !hasNext) {
            issues.push(
              makeIssue('wizard-next-missing', step.node, `Step ${step.index} missing Next action`, {
                stepIndex: step.index,
                totalSteps: scope.totalSteps,
                actionsRowNodeId: step.actionsRow?.id,
              })
            );
          }
          if (isLast && !hasFinish) {
            issues.push(
              makeIssue('wizard-finish-missing', step.node, `Last step ${step.index} missing Finish action`, {
                stepIndex: step.index,
                totalSteps: scope.totalSteps,
                actionsRowNodeId: step.actionsRow?.id,
              })
            );
          }
        }
      }
      return issues;
    },
  },
  {
    id: 'wizard-back-illegal',
    level: 'must',
    description: 'Back action must not appear on first step',
    check: (root: Node) => {
      const scopes = resolveGuidedFlowScopes(root);
      const issues: Issue[] = [];
      for (const scope of scopes) {
        const first = scope.steps.find(s => s.index === 1);
        if (!first) continue;
        const hasBack = first.buttons.some(b => classifyButton(b) === 'back');
        if (hasBack) {
          issues.push(
            makeIssue('wizard-back-illegal', first.node, 'Back button not allowed on first step', {
              stepIndex: first.index,
              actionsRowNodeId: first.actionsRow?.id,
            })
          );
        }
      }
      return issues;
    },
  },
  {
    id: 'wizard-back-missing',
    level: 'must',
    description: 'Intermediate steps must include back action',
    check: (root: Node) => {
      const scopes = resolveGuidedFlowScopes(root);
      const issues: Issue[] = [];
      for (const scope of scopes) {
        for (const step of scope.steps) {
          if (step.index <= 1 || step.index >= scope.totalSteps) continue; // only intermediate
          const hasBack = step.buttons.some(b => classifyButton(b) === 'back');
          if (!hasBack) {
            issues.push(
              makeIssue('wizard-back-missing', step.node, `Step ${step.index} missing Back action`, {
                stepIndex: step.index,
                totalSteps: scope.totalSteps,
                actionsRowNodeId: step.actionsRow?.id,
              })
            );
          }
        }
      }
      return issues;
    },
  },
  {
    id: 'wizard-finish-missing',
    level: 'must',
    description: 'Last step must provide a finish/submit action',
    // Implemented inside wizard-next-missing rule block to avoid duplicate scanning; kept for compatibility
    check: (_root: Node) => [],
  },
  {
    id: 'wizard-field-after-actions',
    level: 'must',
    description: 'Fields must appear before actions row in a step',
    check: (root: Node) => {
      const scopes = resolveGuidedFlowScopes(root);
      const issues: Issue[] = [];
      for (const scope of scopes) {
        for (const step of scope.steps) {
          if (!step.actionsRow) continue; // no actions row to order against
          const subtree = collectNodes(step.node);
          const actionsIndex = subtree.indexOf(step.actionsRow);
          const fieldNodes = subtree.filter(n => n.type === 'Field');
          const misplaced = fieldNodes.filter(f => subtree.indexOf(f) > actionsIndex);
          if (misplaced.length > 0) {
            issues.push(
              makeIssue('wizard-field-after-actions', step.node, `Fields appear after actions row in step ${step.index}`, {
                stepIndex: step.index,
                actionsRowId: step.actionsRow.id,
                misplacedFieldIds: misplaced.map(m => m.id),
              })
            );
          }
        }
      }
      return issues;
    },
  },
  {
    id: 'wizard-multiple-primary',
    level: 'must',
    description: 'Only one primary action per step',
    check: (root: Node) => {
      const scopes = resolveGuidedFlowScopes(root);
      const issues: Issue[] = [];
      for (const scope of scopes) {
        for (const step of scope.steps) {
          const primaryButtons = step.buttons.filter(b => b.roleHint === 'primary');
          if (primaryButtons.length > 1) {
            issues.push(
              makeIssue('wizard-multiple-primary', step.node, `Multiple primary actions in step ${step.index}`, {
                stepIndex: step.index,
                primaryButtonIds: primaryButtons.map(p => p.id),
              })
            );
          }
        }
      }
      return issues;
    },
  },
];

// Placeholder SHOULD rules
const shouldRules: PatternRule[] = [
  {
    id: 'wizard-progress-missing',
    level: 'should',
    description: 'Progress indicator should exist when hasProgress=true',
    check: (root: Node) => {
      const scopes = resolveGuidedFlowScopes(root);
      const allNodes = collectNodes(root);
      const issues: Issue[] = [];
      for (const scope of scopes) {
        const container = scope.scopeNode;
        const hasProgress = container?.behaviors?.guidedFlow?.hasProgress;
        if (!hasProgress) continue;
        const progressId = container?.behaviors?.guidedFlow?.progressNodeId;
        let progressNode: Node | undefined;
        if (progressId) {
          progressNode = allNodes.find(n => n.id === progressId && n.visible !== false);
        } else if (container) {
          const containerSubtree = collectNodes(container);
          const topSlice = containerSubtree.slice(0, 6);
            progressNode = topSlice.find(n => n.type === 'Text' && /step\s+\d+\s+of\s+\d+/i.test((n as any).text || ''));
          if (!progressNode) {
            progressNode = topSlice.find(n => n.affordances?.includes('progress-indicator'));
          }
        }
        if (!progressNode) {
          issues.push(
            makeIssue('wizard-progress-missing', container, 'Progress indicator missing for wizard', {
              scopeNodeId: container?.id,
              hasProgress: true,
            }, 'warn')
          );
        }
      }
      return issues;
    },
  },
  {
    id: 'wizard-actions-order',
    level: 'should',
    description: 'Back should precede Next/Finish in action sequence',
    check: (root: Node) => {
      const scopes = resolveGuidedFlowScopes(root);
      const issues: Issue[] = [];
      for (const scope of scopes) {
        for (const step of scope.steps) {
          const order = step.buttons.map(classifyButton);
          const backIndex = order.indexOf('back');
          const nextIndex = order.indexOf('next');
          const finishIndex = order.indexOf('finish');
          const primaryIndex = finishIndex >= 0 ? finishIndex : nextIndex;
          if (backIndex >= 0 && primaryIndex >= 0 && backIndex > primaryIndex) {
            issues.push(
              makeIssue('wizard-actions-order', step.node, `Back action appears after Next/Finish in step ${step.index}`, {
                stepIndex: step.index,
                order,
              }, 'warn')
            );
          }
        }
      }
      return issues;
    },
  },
  {
    id: 'wizard-step-title-missing',
    level: 'should',
    description: 'Each step should expose a visible title',
    check: (root: Node) => {
      const scopes = resolveGuidedFlowScopes(root);
      const issues: Issue[] = [];
      for (const scope of scopes) {
        for (const step of scope.steps) {
          const subtree = collectNodes(step.node);
          let title: Node | undefined;
          for (const n of subtree) {
            if (n === step.actionsRow) break;
            if (n.type === 'Text') { title = n; break; }
          }
          if (!title) {
            issues.push(
              makeIssue('wizard-step-title-missing', step.node, `Step ${step.index} missing title/heading`, {
                stepIndex: step.index,
              }, 'warn')
            );
          }
        }
      }
      return issues;
    },
  },
  {
    id: 'wizard-primary-below-fold',
    level: 'should',
    description: 'Primary action should appear within initial viewport (smallest breakpoint)',
    check: (_root: Node) => [], // deferred layout integration
  },
];

export const GuidedFlow: Pattern = {
  name: 'Guided.Flow',
  source: {
    pattern: 'Guided.Flow',
    name: 'LUMA Spec – Guided Flow (v1.1-GF)',
    url: 'https://www.nngroup.com/articles/wizard-design/', // canonical reference
  },
  must: mustRules,
  should: shouldRules,
};

// Export helpers for future implementation (not used yet)
export const _guidedFlowInternals = {
  hasGuidedFlowHints,
  resolveGuidedFlowScope,
  resolveGuidedFlowScopes,
  detectActions,
};
