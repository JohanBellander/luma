import type { Node, FormNode, ButtonNode, FieldNode } from '../../types/node.js';
import type { Issue } from '../../types/issue.js';
import { traversePreOrder } from './traversal.js';

/**
 * Flow rules validation for keyboard navigation.
 * 
 * Per spec Section 6.3:
 * - cancel-before-primary (warn): In the last action group of a Form, a cancel/back button precedes a roleHint:"primary" button
 * - field-after-actions (error): In the same Form, any Field appears after actions
 */

/**
 * Check for cancel-before-primary issue in Form actions.
 * 
 * @param formNode - Form node to check
 * @returns Issue if cancel comes before primary, null otherwise
 */
export function checkCancelBeforePrimary(formNode: FormNode): Issue | null {
  if (!formNode.actions || formNode.actions.length === 0) {
    return null;
  }

  // Find the primary button
  let primaryIndex = -1;
  let cancelIndex = -1;

  for (let i = 0; i < formNode.actions.length; i++) {
    const action = formNode.actions[i];
    
    if (action.type === 'Button') {
      const buttonNode = action as ButtonNode;
      
      if (buttonNode.roleHint === 'primary') {
        primaryIndex = i;
      }
      
      // Check for cancel/back button (roleHint or text contains cancel/back)
      if (
        buttonNode.roleHint === 'secondary' ||
        buttonNode.text?.toLowerCase().includes('cancel') ||
        buttonNode.text?.toLowerCase().includes('back')
      ) {
        cancelIndex = i;
      }
    }
  }

  // If we found both and cancel comes before primary, issue warning
  if (primaryIndex >= 0 && cancelIndex >= 0 && cancelIndex < primaryIndex) {
    return {
      id: 'cancel-before-primary',
      severity: 'warn',
      message: `Cancel/back button appears before primary button in Form ${formNode.id}`,
      nodeId: formNode.id,
      jsonPointer: `/screen/root`,
      suggestion: 'Place primary action button before cancel/back button',
    };
  }

  return null;
}

/**
 * Check for field-after-actions issue in Form.
 * 
 * Per spec: In the same Form, any Field appears after actions is an ERROR.
 * 
 * @param formNode - Form node to check
 * @returns Issue if fields appear after actions, null otherwise
 */
export function checkFieldAfterActions(formNode: FormNode): Issue | null {
  if (!formNode.fields || !formNode.actions) {
    return null;
  }

  // Get all nodes in the Form's tree
  const allNodes = traversePreOrder(formNode, true);

  let lastFieldIndex = -1;
  let firstActionIndex = -1;

  for (let i = 0; i < allNodes.length; i++) {
    const node = allNodes[i];
    
    if (node.type === 'Field') {
      lastFieldIndex = i;
    }
    
    if (formNode.actions.some(a => a.id === node.id)) {
      if (firstActionIndex === -1) {
        firstActionIndex = i;
      }
    }
  }

  // If we found both and a field comes after the first action, error
  if (lastFieldIndex >= 0 && firstActionIndex >= 0 && lastFieldIndex > firstActionIndex) {
    const problematicField = allNodes[lastFieldIndex] as FieldNode;
    
    return {
      id: 'field-after-actions',
      severity: 'error',
      message: `Field "${problematicField.label}" appears after action buttons in Form ${formNode.id}`,
      nodeId: problematicField.id,
      jsonPointer: `/screen/root`,
      suggestion: 'Move all fields before action buttons in Forms',
    };
  }

  return null;
}

/**
 * Find all Form nodes in a tree.
 * 
 * @param root - Root node to search from
 * @returns Array of Form nodes
 */
export function findFormNodes(root: Node): FormNode[] {
  const allNodes = traversePreOrder(root, true);
  return allNodes.filter(n => n.type === 'Form') as FormNode[];
}

/**
 * Validate all flow rules for a node tree.
 * 
 * @param root - Root node to validate
 * @returns Array of issues found
 */
export function validateFlowRules(root: Node): Issue[] {
  const issues: Issue[] = [];

  // Find all Forms
  const forms = findFormNodes(root);

  for (const form of forms) {
    // Check cancel-before-primary
    const cancelIssue = checkCancelBeforePrimary(form);
    if (cancelIssue) {
      issues.push(cancelIssue);
    }

    // Check field-after-actions
    const fieldIssue = checkFieldAfterActions(form);
    if (fieldIssue) {
      issues.push(fieldIssue);
    }
  }

  return issues;
}
