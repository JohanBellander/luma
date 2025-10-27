/**
 * Form.Basic pattern from GOV.UK Design System.
 * 
 * Per spec Section 7.1:
 * Source: GOV.UK Design System — Forms
 * 
 * MUST rules:
 * 1. field-has-label: Every Field.label is non-empty
 * 2. actions-exist: Form.actions.length ≥ 1
 * 3. actions-after-fields: Actions appear after all fields in the same Form
 * 4. has-error-state: If any Field.errorText exists, Form.states includes "error"
 * 
 * SHOULD rules:
 * 1. help-text: Provide helpText for ambiguous labels
 */

import type { Pattern, PatternRule } from './types.js';
import type { Node, FormNode, FieldNode } from '../../types/node.js';
import type { Issue } from '../../types/issue.js';
import { traversePreOrder } from '../keyboard/traversal.js';

/**
 * Check that every Field has a non-empty label.
 */
const fieldHasLabel: PatternRule = {
  id: 'field-has-label',
  level: 'must',
  description: 'Every Field.label must be non-empty',
  check: (root: Node): Issue[] => {
    const issues: Issue[] = [];
    const nodes = traversePreOrder(root);
    
    for (const node of nodes) {
      if (node.type === 'Field') {
        const field = node as FieldNode;
        if (!field.label || field.label.trim() === '') {
          issues.push({
            id: 'field-has-label',
            severity: 'error',
            message: `Field "${field.id}" has empty or missing label`,
            nodeId: field.id,
            source: {
              pattern: 'Form.Basic',
              name: 'GOV.UK Design System',
              url: 'https://design-system.service.gov.uk/components/text-input/',
            },
          });
        }
      }
    }
    
    return issues;
  },
};

/**
 * Check that Form has at least one action button.
 */
const actionsExist: PatternRule = {
  id: 'actions-exist',
  level: 'must',
  description: 'Form.actions.length must be ≥ 1',
  check: (root: Node): Issue[] => {
    const issues: Issue[] = [];
    const nodes = traversePreOrder(root);
    
    for (const node of nodes) {
      if (node.type === 'Form') {
        const form = node as FormNode;
        if (!form.actions || form.actions.length === 0) {
          issues.push({
            id: 'actions-exist',
            severity: 'error',
            message: `Form "${form.id}" has no action buttons`,
            nodeId: form.id,
            source: {
              pattern: 'Form.Basic',
              name: 'GOV.UK Design System',
              url: 'https://design-system.service.gov.uk/patterns/question-pages/',
            },
          });
        }
      }
    }
    
    return issues;
  },
};

/**
 * Check that actions appear after all fields in Form.
 */
const actionsAfterFields: PatternRule = {
  id: 'actions-after-fields',
  level: 'must',
  description: 'Actions must appear after all fields in the same Form',
  check: (root: Node): Issue[] => {
    const issues: Issue[] = [];
    const nodes = traversePreOrder(root);
    
    for (const node of nodes) {
      if (node.type === 'Form') {
        const form = node as FormNode;
        
        // Get all nodes in the Form's tree
        const formNodes = traversePreOrder(form);
        
        let lastFieldIndex = -1;
        let firstActionIndex = -1;
        
        for (let i = 0; i < formNodes.length; i++) {
          const n = formNodes[i];
          
          if (n.type === 'Field') {
            lastFieldIndex = i;
          }
          
          if (form.actions.some(a => a.id === n.id)) {
            if (firstActionIndex === -1) {
              firstActionIndex = i;
            }
          }
        }
        
        // If we found both and a field comes after an action
        if (lastFieldIndex > firstActionIndex && firstActionIndex >= 0) {
          issues.push({
            id: 'actions-after-fields',
            severity: 'error',
            message: `Form "${form.id}" has fields appearing after action buttons`,
            nodeId: form.id,
            source: {
              pattern: 'Form.Basic',
              name: 'GOV.UK Design System',
              url: 'https://design-system.service.gov.uk/patterns/question-pages/',
            },
          });
        }
      }
    }
    
    return issues;
  },
};

/**
 * Check that Form has "error" state if any field has errorText.
 */
const hasErrorState: PatternRule = {
  id: 'has-error-state',
  level: 'must',
  description: 'If any Field.errorText exists, Form.states must include "error"',
  check: (root: Node): Issue[] => {
    const issues: Issue[] = [];
    const nodes = traversePreOrder(root);
    
    for (const node of nodes) {
      if (node.type === 'Form') {
        const form = node as FormNode;
        
        // Check if any field has errorText
        const hasError = form.fields.some(f => f.errorText && f.errorText.trim() !== '');
        
        if (hasError && (!form.states || !form.states.includes('error'))) {
          issues.push({
            id: 'has-error-state',
            severity: 'error',
            message: `Form "${form.id}" has fields with errorText but states does not include "error"`,
            nodeId: form.id,
            source: {
              pattern: 'Form.Basic',
              name: 'GOV.UK Design System',
              url: 'https://design-system.service.gov.uk/components/error-message/',
            },
          });
        }
      }
    }
    
    return issues;
  },
};

/**
 * Recommend helpText for fields that might be ambiguous.
 */
const helpText: PatternRule = {
  id: 'help-text',
  level: 'should',
  description: 'Provide helpText for ambiguous labels',
  check: (root: Node): Issue[] => {
    const issues: Issue[] = [];
    const nodes = traversePreOrder(root);
    
    // Simple heuristic: if label is very short (≤ 5 chars) or contains technical terms,
    // recommend helpText
    const technicalTerms = ['id', 'uuid', 'api', 'url', 'uri', 'ssn', 'ein'];
    
    for (const node of nodes) {
      if (node.type === 'Field') {
        const field = node as FieldNode;
        const label = field.label.toLowerCase();
        
        const isShort = field.label.length <= 5;
        const hasTechnicalTerm = technicalTerms.some(term => label.includes(term));
        
        if ((isShort || hasTechnicalTerm) && !field.helpText) {
          issues.push({
            id: 'help-text',
            severity: 'warn',
            message: `Field "${field.id}" with label "${field.label}" should have helpText for clarity`,
            nodeId: field.id,
            source: {
              pattern: 'Form.Basic',
              name: 'GOV.UK Design System',
              url: 'https://design-system.service.gov.uk/components/text-input/',
            },
          });
        }
      }
    }
    
    return issues;
  },
};

/**
 * Form.Basic pattern definition.
 */
export const FormBasic: Pattern = {
  name: 'Form.Basic',
  source: {
    pattern: 'Form.Basic',
    name: 'GOV.UK Design System',
    url: 'https://design-system.service.gov.uk/patterns/question-pages/',
  },
  must: [
    fieldHasLabel,
    actionsExist,
    actionsAfterFields,
    hasErrorState,
  ],
  should: [
    helpText,
  ],
};
