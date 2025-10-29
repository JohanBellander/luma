/**
 * Utility functions for Progressive Disclosure pattern validation.
 */

import type { Node, ButtonNode, TextNode } from '../../types/node.js';
import { traversePreOrder } from '../keyboard/traversal.js';
import { findDisclosureControl } from './disclosure-inference.js';

/**
 * Find the control node associated with a collapsible section.
 * 
 * @param node - The collapsible node
 * @param parentChildren - Siblings of the collapsible node (for proximity search)
 * @returns The control node if found, or null
 */
export function findControl(
  node: Node,
  parentChildren: Node[] | undefined
): ButtonNode | null {
  // Check if explicit controlsId is provided
  const controlsId = node.behaviors?.disclosure?.controlsId;
  
  if (controlsId) {
    // Search for the control by ID (should be a Button)
    const allNodes = traversePreOrder(node);
    for (const candidate of allNodes) {
      if (candidate.id === controlsId && candidate.type === 'Button') {
        const btn = candidate as ButtonNode;
        // Must be visible
        if (btn.visible !== false) {
          return btn;
        }
      }
    }
    
    // Also search in parent's children (siblings)
    if (parentChildren) {
      for (const sibling of parentChildren) {
        if (sibling.id === controlsId && sibling.type === 'Button') {
          const btn = sibling as ButtonNode;
          if (btn.visible !== false) {
            return btn;
          }
        }
        // Search within sibling's descendants
        const descendants = traversePreOrder(sibling);
        for (const desc of descendants) {
          if (desc.id === controlsId && desc.type === 'Button') {
            const btn = desc as ButtonNode;
            if (btn.visible !== false) {
              return btn;
            }
          }
        }
      }
    }
    
    return null; // controlsId specified but not found
  }
  
  // No explicit controlsId - attempt proximity inference
  return findDisclosureControl(node, parentChildren);
}

/**
 * Check if a collapsible node hides a primary action by default.
 * 
 * Per spec PD-MUST-2:
 * If defaultState is "collapsed" and there's a primary button inside,
 * that's a violation.
 * 
 * @param node - The collapsible node
 * @returns true if a primary action is hidden by default
 */
export function hasPrimaryHidden(node: Node): boolean {
  const disclosure = node.behaviors?.disclosure;
  if (!disclosure || !disclosure.collapsible) {
    return false;
  }
  
  // Default state is "collapsed" if not specified
  const defaultState = disclosure.defaultState || 'collapsed';
  
  if (defaultState !== 'collapsed') {
    return false; // If expanded by default, nothing is hidden
  }
  
  // Search for primary buttons in descendants
  const descendants = traversePreOrder(node);
  for (const desc of descendants) {
    if (desc.type === 'Button') {
      const btn = desc as ButtonNode;
      if (btn.roleHint === 'primary') {
        return true; // Found primary button inside collapsed section
      }
    }
  }
  
  return false;
}

/**
 * Check if a collapsible node has an associated label.
 * 
 * Per spec PD-MUST-3:
 * - Sibling Text immediately preceding the node, OR
 * - Child Text designated as summary, OR
 * - Control button text that's meaningful (>= 2 chars)
 * 
 * @param node - The collapsible node
 * @param parentChildren - Siblings of the collapsible node
 * @param control - The associated control button (if found)
 * @returns true if a label exists
 */
export function hasLabel(
  node: Node,
  parentChildren: Node[] | undefined,
  control: ButtonNode | null
): boolean {
  // Check if control button has meaningful text
  if (control && control.text && control.text.trim().length >= 2) {
    return true;
  }
  
  // Check for preceding sibling Text
  if (parentChildren) {
    const nodeIndex = parentChildren.findIndex((n) => n.id === node.id);
    if (nodeIndex > 0) {
      const preceding = parentChildren[nodeIndex - 1];
      if (preceding.type === 'Text' && preceding.visible !== false) {
        const textNode = preceding as TextNode;
        if (textNode.text && textNode.text.trim().length > 0) {
          return true;
        }
      }
    }
  }
  
  // Check for child Text that could be a summary
  const children = getChildren(node);
  if (children && children.length > 0) {
    for (const child of children) {
      if (child.type === 'Text' && child.visible !== false) {
        const textNode = child as TextNode;
        if (textNode.text && textNode.text.trim().length > 0) {
          return true;
        }
      }
    }
  }
  
  return false;
}

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
 * Calculate the sibling distance between a control and a collapsible node.
 * 
 * Per spec PD-SHOULD-1: Control should be adjacent (distance <= 1).
 * 
 * @param collapsibleId - The ID of the collapsible node
 * @param controlId - The ID of the control button
 * @param parentChildren - Siblings array containing both nodes
 * @returns Distance between siblings (0 if adjacent, >0 otherwise), or -1 if not siblings
 */
export function calculateSiblingDistance(
  collapsibleId: string,
  controlId: string,
  parentChildren: Node[] | undefined
): number {
  if (!parentChildren) {
    return -1; // Not siblings
  }
  
  const collapsibleIndex = parentChildren.findIndex((n) => n.id === collapsibleId);
  const controlIndex = parentChildren.findIndex((n) => n.id === controlId);
  
  if (collapsibleIndex === -1 || controlIndex === -1) {
    return -1; // One or both not found in sibling array
  }
  
  return Math.abs(collapsibleIndex - controlIndex);
}

/**
 * Extract affordance tokens from a collapsible node.
 * 
 * Per spec PD-SHOULD-2: Multiple collapsibles should have consistent affordances.
 * 
 * @param node - The collapsible node
 * @returns Array of affordance tokens (e.g., ["chevron", "details"])
 */
export function extractAffordanceTokens(node: Node): string[] {
  const affordances = (node as any).affordances;
  if (Array.isArray(affordances)) {
    return affordances
      .filter((token: any) => typeof token === 'string' && token.trim().length > 0)
      .map((token: string) => token.toLowerCase().trim());
  }
  return [];
}

/**
 * Find all collapsible nodes in a tree.
 * 
 * @param root - The root node
 * @returns Array of collapsible nodes
 */
export function findCollapsibles(root: Node): Node[] {
  const nodes = traversePreOrder(root);
  return nodes.filter((n) => n.behaviors?.disclosure?.collapsible === true);
}

/**
 * Find the first required Form field in a tree.
 * 
 * Per spec PD-SHOULD-3: Collapsible sections should follow primary content.
 * 
 * @param root - The root node
 * @returns The first required field node, or null if none found
 */
export function findFirstRequiredField(root: Node): Node | null {
  const nodes = traversePreOrder(root);
  for (const node of nodes) {
    if (node.type === 'Field') {
      const field = node as any;
      if (field.required === true) {
        return node;
      }
    }
  }
  return null;
}

/**
 * Check if a collapsible node appears before another node in document order.
 * 
 * @param collapsibleId - ID of the collapsible node
 * @param targetId - ID of the target node
 * @param root - The root node
 * @returns true if collapsible appears before target in traversal order
 */
export function appearsBefore(collapsibleId: string, targetId: string, root: Node): boolean {
  const nodes = traversePreOrder(root);
  let foundCollapsible = false;
  
  for (const node of nodes) {
    if (node.id === collapsibleId) {
      foundCollapsible = true;
    }
    if (node.id === targetId) {
      return foundCollapsible; // true if we saw collapsible before target
    }
  }
  
  return false;
}
