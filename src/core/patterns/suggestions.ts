import type { Node } from '../../types/node.js';
import { traversePreOrder } from '../keyboard/traversal.js';

export type Confidence = 'high' | 'medium' | 'low';

export interface PatternSuggestion {
  pattern: string;
  reason: string;
  confidence: Confidence;
}

/**
 * Detect if any node in the tree has progressive disclosure hints.
 * Per spec: auto-activate when any node has behaviors.disclosure.collapsible === true
 */
export function hasDisclosureHints(root: Node): boolean {
  const nodes = traversePreOrder(root, false); // include invisible
  for (const node of nodes) {
    if (node.behaviors?.disclosure?.collapsible === true) return true;
  }
  return false;
}

/**
 * Detect guided flow hints (wizard or step roles) for auto-activation.
 */
export function hasGuidedFlowHints(root: Node): boolean {
  const nodes = traversePreOrder(root, false);
  for (const node of nodes) {
    const gf = node.behaviors?.guidedFlow;
    if (gf && (gf.role === 'wizard' || gf.role === 'step')) return true;
  }
  return false;
}

/**
 * Suggest patterns using heuristics.
 */
export function suggestPatterns(root: Node): PatternSuggestion[] {
  const suggestions: PatternSuggestion[] = [];
  const nodes = traversePreOrder(root, false);
  let hasForm = false;
  let formFields = 0;
  let formActions = 0;
  let hasTable = false;
  let tableColumns = 0;
  let tableResponsiveStrategy: string | undefined;
  let hasDisclosure = false;
  let guidedFlowIndicators = 0;
  const guidedFlowIndicatorsDetails: string[] = [];

  for (const n of nodes) {
    if (n.type === 'Form') {
      hasForm = true;
      // Cast to any to access Form-only properties safely
      const f: any = n;
      formFields += Array.isArray(f.fields) ? f.fields.length : 0;
      formActions += Array.isArray(f.actions) ? f.actions.length : 0;
    } else if (n.type === 'Table') {
      hasTable = true;
      const t: any = n;
      tableColumns += Array.isArray(t.columns) ? t.columns.length : 0;
      tableResponsiveStrategy = t.responsive?.strategy;
    } else if (n.behaviors?.disclosure?.collapsible) {
      hasDisclosure = true;
    } else if (n.type === 'Button') {
      const b: any = n;
      const text = (b.text || '').toLowerCase();
      if (['next', 'previous', 'prev', 'back'].some(k => text.includes(k))) {
        guidedFlowIndicators++;
        guidedFlowIndicatorsDetails.push(text);
      } else if (/step\s*\d+/i.test(text)) {
        guidedFlowIndicators++;
        guidedFlowIndicatorsDetails.push(text);
      }
    } else if (n.behaviors?.guidedFlow) {
      guidedFlowIndicators++;
      guidedFlowIndicatorsDetails.push(n.id);
    }
  }

  if (hasForm) {
    const reason = `Detected Form node with ${formFields} field(s) and ${formActions} action(s)`;
    suggestions.push({ pattern: 'Form.Basic', reason, confidence: 'high' });
  }
  if (hasTable) {
    const reason = `Detected Table node (${tableColumns} columns, responsive.strategy=${tableResponsiveStrategy || 'none'})`;
    suggestions.push({ pattern: 'Table.Simple', reason, confidence: tableColumns > 0 ? 'high' : 'medium' });
  }
  if (hasDisclosure) {
    const reason = 'Found collapsible disclosure behavior on one or more nodes';
    suggestions.push({ pattern: 'Progressive.Disclosure', reason, confidence: 'high' });
  }
  if (guidedFlowIndicators >= 2) {
    const reason = `Found multi-step indicators (${guidedFlowIndicatorsDetails.slice(0, 5).join(', ')}) suggesting a wizard flow`;
    suggestions.push({ pattern: 'Guided.Flow', reason, confidence: guidedFlowIndicators > 3 ? 'high' : 'medium' });
  } else if (guidedFlowIndicators === 1) {
    const reason = `Single guided-flow hint (${guidedFlowIndicatorsDetails[0]}) detected`;
    suggestions.push({ pattern: 'Guided.Flow', reason, confidence: 'low' });
  }

  return suggestions;
}
/**
 * Deterministic suggestion text for Progressive Disclosure pattern issues.
 * 
 * Based on LUMA-PATTERN-Progressive-Disclosure-SPEC.md §5
 */

/**
 * Map of issue IDs to their suggestion text.
 * 
 * These suggestions provide minimal, actionable fixes for Progressive Disclosure
 * pattern validation failures.
 */
export const PROGRESSIVE_DISCLOSURE_SUGGESTIONS: Record<string, (nodeId?: string) => string> = {
  'disclosure-no-control': (nodeId?: string) => {
    const id = nodeId || 'advanced';
    return `Add a control Button near the section and reference it:
"behaviors": { "disclosure": { "collapsible": true, "controlsId": "toggle-${id}", "defaultState": "collapsed" } }
...and define the control:
{ "id": "toggle-${id}", "type": "Button", "text": "Show details" }`;
  },

  'disclosure-hides-primary': () => {
    return `Move the primary action outside the collapsible section OR set:
"behaviors": { "disclosure": { "defaultState": "expanded" } }`;
  },

  'disclosure-missing-label': (nodeId?: string) => {
    const id = nodeId || 'section';
    return `Add a sibling Text label before the section:
{ "type":"Text", "id":"${id}-label", "text":"Section title" }`;
  },

  'disclosure-control-far': () => {
    return `Place the control as a preceding sibling or within a header row next to the section.`;
  },

  'disclosure-inconsistent-affordance': () => {
    return `Align affordances across collapsible sections, e.g. "affordances":["chevron"].`;
  },

  'disclosure-early-section': () => {
    return `Move collapsible sections after required fields and before the action row.`;
  },
};

/**
 * Get a deterministic suggestion for a Progressive Disclosure issue.
 * 
 * @param issueId - The issue ID (e.g., 'disclosure-no-control')
 * @param nodeId - Optional node ID for context-aware suggestions
 * @returns The suggestion text, or undefined if no suggestion exists
 */
export function getSuggestion(issueId: string, nodeId?: string): string | undefined {
  const suggestionFn = PROGRESSIVE_DISCLOSURE_SUGGESTIONS[issueId];
  return suggestionFn ? suggestionFn(nodeId) : undefined;
}
