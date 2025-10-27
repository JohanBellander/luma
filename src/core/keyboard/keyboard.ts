import type { Scaffold } from '../../types/scaffold.js';
import type { Node } from '../../types/node.js';
import type { Issue } from '../../types/issue.js';
import type { KeyboardOutput } from '../../types/output.js';
import { applyResponsiveOverridesRecursive } from '../layout/responsive.js';
import { buildTabSequence, getAllFocusableIds } from './sequence.js';
import { validateFlowRules } from './flow-rules.js';

/**
 * Keyboard flow analysis orchestrator.
 * 
 * Per spec Section 6:
 * - Produces tab sequence and flow issues after overrides
 * - Detects unreachable focusable nodes (critical)
 * - Validates flow rules (cancel-before-primary, field-after-actions)
 * 
 * @param scaffold - Scaffold to analyze
 * @param viewportWidth - Viewport width for responsive overrides (optional)
 * @param state - Form state for conditional visibility (optional)
 * @returns KeyboardOutput with sequence, unreachable nodes, and issues
 */
export function analyzeKeyboardFlow(
  scaffold: Scaffold,
  viewportWidth?: number,
  _state?: string
): KeyboardOutput {
  const issues: Issue[] = [];

  // Apply responsive overrides if viewport specified
  let root: Node = scaffold.screen.root;
  if (viewportWidth !== undefined) {
    root = applyResponsiveOverridesRecursive(root, viewportWidth) as Node;
  }

  // TODO: Apply state-based visibility if state specified
  // For now, we'll skip state handling (would filter based on Form.states)

  // Build tab sequence
  const sequence = buildTabSequence(root);

  // Get all focusable nodes (to detect unreachable)
  const allFocusableIds = getAllFocusableIds(root);

  // Find unreachable nodes
  const unreachable: string[] = [];
  for (const id of allFocusableIds) {
    if (!sequence.includes(id)) {
      unreachable.push(id);
      
      // Unreachable is CRITICAL
      issues.push({
        id: `unreachable-${id}`,
        severity: 'critical',
        message: `Focusable node ${id} is unreachable in tab sequence`,
        nodeId: id,
        jsonPointer: `/screen/root`,
        suggestion: 'Check tabIndex values and node visibility',
      });
    }
  }

  // Validate flow rules
  const flowIssues = validateFlowRules(root);
  issues.push(...flowIssues);

  return {
    sequence,
    unreachable,
    issues,
  };
}
