/**
 * Guided.Flow pattern scaffolding
 *
 * Implements skeleton MUST/SHOULD rules per LUMA-PATTERN-Guided-Flow-SPEC.md
 * with placeholder logic. Actual validation logic will be filled in under
 * issue LUMA-71 (Validator scaffolding) and subsequent tasks.
 */
import type { Pattern, PatternRule } from './types.js';
import type { Node, ButtonNode } from '../../types/node.js';

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
  scopeNode?: Node; // wizard container if present
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

// Placeholder MUST rules (return empty issues until implemented)
const mustRules: PatternRule[] = [
  {
    id: 'wizard-steps-missing',
    level: 'must',
    description: 'Steps must form contiguous 1..N sequence',
    check: (_root: Node) => [],
  },
  {
    id: 'wizard-next-missing',
    level: 'must',
    description: 'Each step must have required next action (or finish on last step)',
    check: (_root: Node) => [],
  },
  {
    id: 'wizard-back-illegal',
    level: 'must',
    description: 'Back action must not appear on first step',
    check: (_root: Node) => [],
  },
  {
    id: 'wizard-back-missing',
    level: 'must',
    description: 'Intermediate steps must include back action',
    check: (_root: Node) => [],
  },
  {
    id: 'wizard-finish-missing',
    level: 'must',
    description: 'Last step must provide a finish/submit action',
    check: (_root: Node) => [],
  },
  {
    id: 'wizard-field-after-actions',
    level: 'must',
    description: 'Fields must appear before actions row in a step',
    check: (_root: Node) => [],
  },
  {
    id: 'wizard-multiple-primary',
    level: 'must',
    description: 'Only one primary action per step',
    check: (_root: Node) => [],
  },
];

// Placeholder SHOULD rules
const shouldRules: PatternRule[] = [
  {
    id: 'wizard-progress-missing',
    level: 'should',
    description: 'Progress indicator should exist when hasProgress=true',
    check: (_root: Node) => [],
  },
  {
    id: 'wizard-actions-order',
    level: 'should',
    description: 'Back should precede Next/Finish in action sequence',
    check: (_root: Node) => [],
  },
  {
    id: 'wizard-step-title-missing',
    level: 'should',
    description: 'Each step should expose a visible title',
    check: (_root: Node) => [],
  },
  {
    id: 'wizard-primary-below-fold',
    level: 'should',
    description: 'Primary action should appear within initial viewport (smallest breakpoint)',
    check: (_root: Node) => [],
  },
];

export const GuidedFlow: Pattern = {
  name: 'Guided.Flow',
  source: {
    pattern: 'Guided.Flow',
    name: 'LUMA Spec  Guided Flow (v1.1-GF)',
    url: 'https://spec.local/guided-flow', // placeholder URL
  },
  must: mustRules,
  should: shouldRules,
};

// Export helpers for future implementation (not used yet)
export const _guidedFlowInternals = {
  hasGuidedFlowHints,
  resolveGuidedFlowScope,
  detectActions,
};
