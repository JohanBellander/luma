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
