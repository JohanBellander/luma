/**
 * Progressive.Disclosure pattern
 * 
 * Per LUMA-PATTERN-Progressive-Disclosure-SPEC.md:
 * Source: Nielsen Norman Group — Progressive Disclosure
 * 
 * MUST rules:
 * 1. disclosure-no-control: Collapsible container has an associated control
 * 2. disclosure-hides-primary: Primary action is not hidden by default
 * 3. disclosure-missing-label: Label/summary present for collapsible
 * 
 * SHOULD rules:
 * 1. disclosure-control-far: Control placement proximity
 * 2. disclosure-inconsistent-affordance: Consistent affordance
 * 3. disclosure-early-section: Collapsible sections follow primary content
 */

import type { Pattern, PatternRule } from './types.js';
import type { Node } from '../../types/node.js';
import type { Issue } from '../../types/issue.js';
import { traversePreOrder } from '../keyboard/traversal.js';
import { findControl, hasPrimaryHidden, hasLabel } from './disclosure-utils.js';

/**
 * Helper to get parent-child relationships for proximity checks.
 */
function buildParentMap(root: Node): Map<string, Node[]> {
  const parentMap = new Map<string, Node[]>();
  
  function visit(node: Node, parentChildren: Node[] | undefined) {
    if (parentChildren) {
      parentMap.set(node.id, parentChildren);
    }
    
    // Visit children
    if ('children' in node && Array.isArray(node.children)) {
      const children = node.children as Node[];
      for (const child of children) {
        visit(child, children);
      }
    } else if ('child' in node && node.child) {
      const child = node.child as Node;
      visit(child, [child]);
    } else if (node.type === 'Form' && 'fields' in node && 'actions' in node) {
      const form = node as any;
      const formChildren: Node[] = [];
      if (form.fields) formChildren.push(...form.fields);
      if (form.actions) formChildren.push(...form.actions);
      for (const child of formChildren) {
        visit(child, formChildren);
      }
    }
  }
  
  visit(root, undefined);
  return parentMap;
}

/**
 * Helper to get siblings for a given node.
 */
function getSiblings(nodeId: string, parentMap: Map<string, Node[]>): Node[] | undefined {
  return parentMap.get(nodeId);
}

/**
 * PD-MUST-1: Collapsible container has an associated control
 */
const disclosureNoControl: PatternRule = {
  id: 'disclosure-no-control',
  level: 'must',
  description: 'Collapsible section must have an associated control',
  check: (root: Node): Issue[] => {
    const issues: Issue[] = [];
    const nodes = traversePreOrder(root);
    const parentMap = buildParentMap(root);
    
    for (const node of nodes) {
      const disclosure = node.behaviors?.disclosure;
      if (disclosure && disclosure.collapsible) {
        const siblings = getSiblings(node.id, parentMap);
        const control = findControl(node, siblings);
        
        if (!control) {
          issues.push({
            id: 'disclosure-no-control',
            severity: 'error',
            message: `Collapsible section "${node.id}" has no associated control`,
            nodeId: node.id,
            source: {
              pattern: 'Progressive.Disclosure',
              name: 'Nielsen Norman Group — Progressive Disclosure',
              url: 'https://www.nngroup.com/articles/progressive-disclosure/',
            },
            suggestion: `Add a control Button near the section and reference it:
"behaviors": { "disclosure": { "collapsible": true, "controlsId": "toggle-${node.id}", "defaultState": "collapsed" } }
...and define the control:
{ "id": "toggle-${node.id}", "type": "Button", "text": "Show details" }`,
            details: {
              expected: 'controlsId referencing a Button or nearby Button with disclosure keywords',
              found: disclosure.controlsId || null,
            },
          });
        }
      }
    }
    
    return issues;
  },
};

/**
 * PD-MUST-2: Primary action is not hidden by default
 */
const disclosureHidesPrimary: PatternRule = {
  id: 'disclosure-hides-primary',
  level: 'must',
  description: 'Primary action must not be hidden by default in collapsed section',
  check: (root: Node): Issue[] => {
    const issues: Issue[] = [];
    const nodes = traversePreOrder(root);
    
    for (const node of nodes) {
      const disclosure = node.behaviors?.disclosure;
      if (disclosure && disclosure.collapsible) {
        if (hasPrimaryHidden(node)) {
          issues.push({
            id: 'disclosure-hides-primary',
            severity: 'error',
            message: `Primary action is hidden by default within collapsed section "${node.id}"`,
            nodeId: node.id,
            source: {
              pattern: 'Progressive.Disclosure',
              name: 'GOV.UK Design System — Details',
              url: 'https://design-system.service.gov.uk/components/details/',
            },
            suggestion: `Move the primary action outside the collapsible section OR set:
"behaviors": { "disclosure": { "defaultState": "expanded" } }`,
            details: {
              expected: 'Primary action outside collapsed section or defaultState expanded',
              found: `defaultState: ${disclosure.defaultState || 'collapsed'}, primary inside section`,
            },
          });
        }
      }
    }
    
    return issues;
  },
};

/**
 * PD-MUST-3: Label/summary present for collapsible section
 */
const disclosureMissingLabel: PatternRule = {
  id: 'disclosure-missing-label',
  level: 'must',
  description: 'Collapsible section must have a visible label or summary',
  check: (root: Node): Issue[] => {
    const issues: Issue[] = [];
    const nodes = traversePreOrder(root);
    const parentMap = buildParentMap(root);
    
    for (const node of nodes) {
      const disclosure = node.behaviors?.disclosure;
      if (disclosure && disclosure.collapsible) {
        const siblings = getSiblings(node.id, parentMap);
        const control = findControl(node, siblings);
        
        if (!hasLabel(node, siblings, control)) {
          issues.push({
            id: 'disclosure-missing-label',
            severity: 'error',
            message: `Collapsible section "${node.id}" lacks a visible label or summary`,
            nodeId: node.id,
            source: {
              pattern: 'Progressive.Disclosure',
              name: 'USWDS — Accordion',
              url: 'https://designsystem.digital.gov/components/accordion/',
            },
            suggestion: `Add a sibling Text label before the section:
{ "type":"Text", "id":"${node.id}-label", "text":"Section title" }`,
            details: {
              expected: 'Sibling Text label, child Text summary, or control button with meaningful text',
              found: null,
            },
          });
        }
      }
    }
    
    return issues;
  },
};

/**
 * Stub SHOULD rule: Control placement proximity
 * Full implementation in LUMA-51
 */
const disclosureControlFar: PatternRule = {
  id: 'disclosure-control-far',
  level: 'should',
  description: 'Control should be adjacent to collapsible section',
  check: (_root: Node): Issue[] => {
    // Stub implementation - will be completed in LUMA-51
    return [];
  },
};

/**
 * Stub SHOULD rule: Consistent affordance
 * Full implementation in LUMA-51
 */
const disclosureInconsistentAffordance: PatternRule = {
  id: 'disclosure-inconsistent-affordance',
  level: 'should',
  description: 'Multiple collapsibles should use consistent affordances',
  check: (_root: Node): Issue[] => {
    // Stub implementation - will be completed in LUMA-51
    return [];
  },
};

/**
 * Stub SHOULD rule: Collapsible sections follow primary content
 * Full implementation in LUMA-51
 */
const disclosureEarlySection: PatternRule = {
  id: 'disclosure-early-section',
  level: 'should',
  description: 'Collapsible content should follow primary content',
  check: (_root: Node): Issue[] => {
    // Stub implementation - will be completed in LUMA-51
    return [];
  },
};

/**
 * Progressive Disclosure pattern definition
 */
export const ProgressiveDisclosure: Pattern = {
  name: 'Progressive.Disclosure',
  source: {
    pattern: 'Progressive.Disclosure',
    name: 'Nielsen Norman Group',
    url: 'https://www.nngroup.com/articles/progressive-disclosure/',
  },
  must: [
    disclosureNoControl,
    disclosureHidesPrimary,
    disclosureMissingLabel,
  ],
  should: [
    disclosureControlFar,
    disclosureInconsistentAffordance,
    disclosureEarlySection,
  ],
};
