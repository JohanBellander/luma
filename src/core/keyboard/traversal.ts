import type { Node } from '../../types/node.js';

/**
 * Pre-order tree traversal for keyboard flow analysis.
 * 
 * Pre-order means:
 * 1. Visit parent first
 * 2. Then visit children left-to-right
 * 
 * Per spec Section 6.2:
 * - Pre-order traversal of final node tree
 * - Skip nodes where visible:false
 */

/**
 * Traverse a node tree in pre-order, collecting all nodes.
 * 
 * @param root - Root node to start traversal
 * @param visibleOnly - If true, skip nodes with visible:false (default true)
 * @returns Array of nodes in pre-order sequence
 */
export function traversePreOrder(root: Node, visibleOnly = true): Node[] {
  const result: Node[] = [];

  function visit(node: Node): void {
    // Skip invisible nodes if requested
    if (visibleOnly && node.visible === false) {
      return;
    }

    // Visit this node first (pre-order)
    result.push(node);

    // Then visit children
    if ('children' in node && node.children) {
      for (const child of node.children) {
        visit(child);
      }
    }

    // Handle Box with single child
    if ('child' in node && node.child) {
      visit(node.child);
    }

    // Handle Form with fields and actions
    if (node.type === 'Form') {
      const formNode = node as any;
      if (formNode.fields) {
        for (const field of formNode.fields) {
          visit(field);
        }
      }
      if (formNode.actions) {
        for (const action of formNode.actions) {
          visit(action);
        }
      }
    }
  }

  visit(root);
  return result;
}

/**
 * Collect all node IDs in pre-order.
 * 
 * @param root - Root node to start traversal
 * @param visibleOnly - If true, skip nodes with visible:false (default true)
 * @returns Array of node IDs in pre-order sequence
 */
export function collectNodeIds(root: Node, visibleOnly = true): string[] {
  const nodes = traversePreOrder(root, visibleOnly);
  return nodes.map(n => n.id);
}
