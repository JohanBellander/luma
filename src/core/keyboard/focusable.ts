import type { Node, ButtonNode } from '../../types/node.js';

/**
 * Focusable node detection for keyboard flow analysis.
 * 
 * Per spec Section 6.1:
 * - Button, Field, and any node with focusable:true
 * - Ignore nodes where visible:false
 */

/**
 * Check if a node is focusable.
 * 
 * @param node - Node to check
 * @returns True if the node can receive keyboard focus
 */
export function isFocusable(node: Node): boolean {
  // Skip invisible nodes
  if (node.visible === false) {
    return false;
  }

  // Button nodes are focusable by default (unless explicitly marked false)
  if (node.type === 'Button') {
    const buttonNode = node as ButtonNode;
    return buttonNode.focusable !== false;
  }

  // Field nodes are always focusable
  if (node.type === 'Field') {
    return true;
  }

  // Any other node with explicit focusable:true
  if ('focusable' in node && node.focusable === true) {
    return true;
  }

  return false;
}

/**
 * Filter an array of nodes to only focusable ones.
 * 
 * @param nodes - Array of nodes to filter
 * @returns Array of focusable nodes
 */
export function filterFocusable(nodes: Node[]): Node[] {
  return nodes.filter(isFocusable);
}

/**
 * Get the tab index of a node.
 * 
 * @param node - Node to get tab index from
 * @returns Tab index (defaults to 0 if not specified)
 */
export function getTabIndex(node: Node): number {
  if ('tabIndex' in node && typeof node.tabIndex === 'number') {
    return node.tabIndex;
  }
  return 0; // Default tab index
}
