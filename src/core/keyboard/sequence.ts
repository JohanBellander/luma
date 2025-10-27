import type { Node } from '../../types/node.js';
import { traversePreOrder } from './traversal.js';
import { isFocusable, getTabIndex } from './focusable.js';

/**
 * Build tab sequence from a node tree.
 * 
 * Per spec Section 6.2:
 * - Pre-order traversal of final node tree
 * - Only include focusable nodes
 * - Respect tabIndex for ordering
 * 
 * Tab index ordering rules:
 * - Positive tabIndex values come first, in numeric order
 * - tabIndex=0 (or unspecified) come next, in document order
 * - Negative tabIndex values are not focusable via tab
 */

export interface TabSequenceNode {
  id: string;
  node: Node;
  tabIndex: number;
  documentOrder: number;
}

/**
 * Build the tab sequence from a root node.
 * 
 * @param root - Root node to start from
 * @returns Array of node IDs in tab order
 */
export function buildTabSequence(root: Node): string[] {
  // Get all nodes in pre-order
  const allNodes = traversePreOrder(root, true);

  // Filter to focusable nodes and collect info
  const focusableNodes: TabSequenceNode[] = [];
  let documentOrder = 0;

  for (const node of allNodes) {
    if (isFocusable(node)) {
      const tabIndex = getTabIndex(node);
      
      // Skip negative tabIndex (not tab-reachable)
      if (tabIndex >= 0) {
        focusableNodes.push({
          id: node.id,
          node,
          tabIndex,
          documentOrder: documentOrder++,
        });
      }
    }
  }

  // Sort by tab index rules:
  // 1. Positive tabIndex first, ordered by value
  // 2. Then tabIndex=0, ordered by document order
  focusableNodes.sort((a, b) => {
    // If both have positive tabIndex, sort by tabIndex
    if (a.tabIndex > 0 && b.tabIndex > 0) {
      return a.tabIndex - b.tabIndex;
    }

    // Positive tabIndex comes before zero
    if (a.tabIndex > 0) return -1;
    if (b.tabIndex > 0) return 1;

    // Both are zero, sort by document order
    return a.documentOrder - b.documentOrder;
  });

  return focusableNodes.map(n => n.id);
}

/**
 * Get all focusable nodes that should be reachable.
 * 
 * @param root - Root node to start from
 * @returns Array of all focusable node IDs (including negative tabIndex)
 */
export function getAllFocusableIds(root: Node): string[] {
  const allNodes = traversePreOrder(root, true);
  return allNodes.filter(isFocusable).map(n => n.id);
}
