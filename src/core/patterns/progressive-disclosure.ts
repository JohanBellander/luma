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
import { getSuggestion } from './suggestions.js';

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
            suggestion: getSuggestion('disclosure-no-control', node.id),
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
            suggestion: getSuggestion('disclosure-hides-primary'),
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
            suggestion: getSuggestion('disclosure-missing-label', node.id),
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
 * PD-SHOULD-1: Control placement proximity
 */
const disclosureControlFar: PatternRule = {
  id: 'disclosure-control-far',
  level: 'should',
  description: 'Control should be adjacent to collapsible section',
  check: (root: Node): Issue[] => {
    const issues: Issue[] = [];
    const nodes = traversePreOrder(root);
    const parentMap = buildParentMap(root);
    
    for (const node of nodes) {
      const disclosure = node.behaviors?.disclosure;
      if (disclosure && disclosure.collapsible) {
        const siblings = getSiblings(node.id, parentMap);
        const control = findControl(node, siblings);
        
        if (control && siblings) {
          // Check if control is a sibling (not inside the collapsible)
          const controlIndex = siblings.findIndex((n) => n.id === control.id);
          const collapsibleIndex = siblings.findIndex((n) => n.id === node.id);
          
          if (controlIndex !== -1 && collapsibleIndex !== -1) {
            // They are siblings - check distance
            const distance = Math.abs(controlIndex - collapsibleIndex);
            
            if (distance > 1) {
              issues.push({
                id: 'disclosure-control-far',
                severity: 'warn',
                message: `Control "${control.id}" is not adjacent to collapsible section "${node.id}" (distance: ${distance} siblings)`,
                nodeId: node.id,
                source: {
                  pattern: 'Progressive.Disclosure',
                  name: 'Nielsen Norman Group — Progressive Disclosure',
                  url: 'https://www.nngroup.com/articles/progressive-disclosure/',
                },
                suggestion: getSuggestion('disclosure-control-far'),
                details: {
                  expected: 'Control adjacent to collapsible (distance <= 1)',
                  found: `Control at distance ${distance} from collapsible`,
                  controlId: control.id,
                },
              });
            }
          }
        }
      }
    }
    
    return issues;
  },
};

/**
 * PD-SHOULD-2: Consistent affordance
 */
const disclosureInconsistentAffordance: PatternRule = {
  id: 'disclosure-inconsistent-affordance',
  level: 'should',
  description: 'Multiple collapsibles should use consistent affordances',
  check: (root: Node): Issue[] => {
    const issues: Issue[] = [];
    const nodes = traversePreOrder(root);
    const parentMap = buildParentMap(root);
    
    // Group collapsibles by parent
    const collapsiblesByParent = new Map<Node[] | undefined, Node[]>();
    
    for (const node of nodes) {
      const disclosure = node.behaviors?.disclosure;
      if (disclosure && disclosure.collapsible) {
        const siblings = getSiblings(node.id, parentMap);
        if (!collapsiblesByParent.has(siblings)) {
          collapsiblesByParent.set(siblings, []);
        }
        collapsiblesByParent.get(siblings)!.push(node);
      }
    }
    
    // Check each group for inconsistent affordances
    for (const [_siblings, collapsibles] of collapsiblesByParent) {
      if (collapsibles.length < 2) {
        continue; // Need at least 2 collapsibles to compare
      }
      
      // Extract affordances from each collapsible
      const affordanceSets: Set<string>[] = collapsibles.map((node) => {
        const affordances = (node as any).affordances;
        if (Array.isArray(affordances)) {
          return new Set(
            affordances
              .filter((token: any) => typeof token === 'string' && token.trim().length > 0)
              .map((token: string) => token.toLowerCase().trim())
          );
        }
        return new Set<string>();
      });
      
      // Filter out empty sets for intersection check
      const nonEmptySets = affordanceSets.filter((set) => set.size > 0);
      
      if (nonEmptySets.length < 2) {
        continue; // Need at least 2 non-empty affordance sets to check consistency
      }
      
      // Check intersection of all non-empty sets
      const intersection = nonEmptySets.reduce((acc, set) => {
        return new Set([...acc].filter((x) => set.has(x)));
      });
      
      if (intersection.size === 0) {
        // No common affordances - inconsistent
        const affordanceStrings = collapsibles.map((node, i) => {
          const tokens = Array.from(affordanceSets[i]);
          return `"${node.id}": [${tokens.map((t) => `"${t}"`).join(', ')}]`;
        });
        
        issues.push({
          id: 'disclosure-inconsistent-affordance',
          severity: 'warn',
          message: `Multiple collapsibles use inconsistent affordances: ${affordanceStrings.join('; ')}`,
          nodeId: collapsibles[0].id,
          source: {
            pattern: 'Progressive.Disclosure',
            name: 'GOV.UK Design System — Details',
            url: 'https://design-system.service.gov.uk/components/details/',
          },
          suggestion: getSuggestion('disclosure-inconsistent-affordance'),
          details: {
            expected: 'Common affordance token across all collapsibles',
            found: `No intersection: ${affordanceStrings.join('; ')}`,
            collapsibleIds: collapsibles.map((n) => n.id),
          },
        });
      }
    }
    
    return issues;
  },
};

/**
 * PD-SHOULD-3: Collapsible sections follow primary content
 */
const disclosureEarlySection: PatternRule = {
  id: 'disclosure-early-section',
  level: 'should',
  description: 'Collapsible content should follow primary content',
  check: (root: Node): Issue[] => {
    const issues: Issue[] = [];
    const nodes = traversePreOrder(root);
    
    // Find first required field (if any Form fields exist)
    let firstRequiredField: Node | null = null;
    for (const node of nodes) {
      if (node.type === 'Field') {
        const field = node as any;
        if (field.required === true) {
          firstRequiredField = node;
          break;
        }
      }
    }
    
    // Check if any collapsible appears before the first required field
    if (firstRequiredField) {
      let foundCollapsibleBefore = false;
      let collapsibleNode: Node | null = null;
      
      for (const node of nodes) {
        if (node.id === firstRequiredField.id) {
          break; // Reached the first required field
        }
        
        const disclosure = node.behaviors?.disclosure;
        if (disclosure && disclosure.collapsible) {
          foundCollapsibleBefore = true;
          collapsibleNode = node;
          break;
        }
      }
      
      if (foundCollapsibleBefore && collapsibleNode) {
        issues.push({
          id: 'disclosure-early-section',
          severity: 'warn',
          message: `Collapsible section "${collapsibleNode.id}" appears before the first required field "${firstRequiredField.id}"`,
          nodeId: collapsibleNode.id,
          source: {
            pattern: 'Progressive.Disclosure',
            name: 'USWDS — Accordion',
            url: 'https://designsystem.digital.gov/components/accordion/',
          },
          suggestion: getSuggestion('disclosure-early-section'),
          details: {
            expected: 'Collapsible after primary content (required fields)',
            found: `Collapsible "${collapsibleNode.id}" before required field "${firstRequiredField.id}"`,
            firstRequiredFieldId: firstRequiredField.id,
          },
        });
      }
    }
    
    return issues;
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
