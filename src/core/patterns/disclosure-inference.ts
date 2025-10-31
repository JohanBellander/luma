/**
 * Inference engine for Progressive Disclosure pattern control detection.
 * 
 * Per LUMA-PATTERN-Progressive-Disclosure-SPEC.md Section 3.2.3:
 * Deterministic search order:
 * 1. Preceding siblings (reverse order - closest first)
 * 2. Following siblings (forward order - closest first)
 * 3. First child if it's a header/container
 * 
 * Keyword match: /\b(show|hide|expand|collapse|advanced|details|more)\b/i
 * Fallback affordances: 'chevron', 'details'
 */

import type { Node, ButtonNode } from '../../types/node.js';

/**
 * Helper to get children from a node (handles different container types).
 */
function getChildren(node: Node): Node[] | undefined {
  if ('children' in node && Array.isArray(node.children)) {
    return node.children as Node[];
  }
  if ('child' in node && node.child) {
    return [node.child as Node];
  }
  if (node.type === 'Form' && 'fields' in node) {
    // Form has fields and actions
    const form = node as any;
    const children: Node[] = [];
    if (form.fields) children.push(...form.fields);
    if (form.actions) children.push(...form.actions);
    return children;
  }
  return undefined;
}

/**
 * Find the disclosure control for a collapsible section using proximity inference.
 * 
 * Per spec Section 3.2.3: search order is:
 * 1. Preceding sibling (reverse order - closest first)
 * 2. Following sibling (forward order - closest first)
 * 3. First child if it's a header/container
 * 
 * @param node - The collapsible node
 * @param parentChildren - Siblings of the collapsible node (for proximity search)
 * @returns The control node if found, or null
 */
export function findDisclosureControl(
  node: Node,
  parentChildren: Node[] | undefined
): ButtonNode | null {
  if (!parentChildren) {
    return null;
  }
  
  const nodeIndex = parentChildren.findIndex((n) => n.id === node.id);
  if (nodeIndex === -1) {
    return null;
  }
  
  // Keywords for control identification (case-insensitive)
  const keywords = /\b(show|hide|expand|collapse|advanced|details|more)\b/i;
  
  // Helper to check if a node is a valid control candidate
  const isCandidate = (n: Node): boolean => {
    if (n.type !== 'Button') return false;
    if (n.visible === false) return false;
    
    const btn = n as ButtonNode;
    
    // Check button text for keywords
    if (btn.text && keywords.test(btn.text)) {
      return true;
    }
    
    // Check affordances
    const affordances = n.affordances || [];
    if (affordances.includes('chevron') || affordances.includes('details')) {
      return true;
    }
    
    return false;
  };
  
  // 1. Search preceding siblings (reverse order - closest first)
  for (let i = nodeIndex - 1; i >= 0; i--) {
    const sibling = parentChildren[i];
    if (isCandidate(sibling)) {
      return sibling as ButtonNode;
    }
  }
  
  // 2. Search following siblings (forward order - closest first)
  for (let i = nodeIndex + 1; i < parentChildren.length; i++) {
    const sibling = parentChildren[i];
    if (isCandidate(sibling)) {
      return sibling as ButtonNode;
    }
  }
  
  // 3. Check if first child is a control (header row scenario)
  const children = getChildren(node);
  if (children && children.length > 0) {
    const firstChild = children[0];
    if (isCandidate(firstChild)) {
      return firstChild as ButtonNode;
    }
  }
  
  return null;
}
