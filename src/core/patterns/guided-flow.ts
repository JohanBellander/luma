/**
 * Guided.Flow pattern scaffolding
 *
 * Implements skeleton MUST/SHOULD rules per LUMA-PATTERN-Guided-Flow-SPEC.md
 * with placeholder logic. Actual validation logic will be filled in under
 * issue LUMA-71 (Validator scaffolding) and subsequent tasks.
 */
import type { Pattern, PatternRule } from './types.js';
import type { Node } from '../../types/node.js';

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
};
