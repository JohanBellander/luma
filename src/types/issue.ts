/**
 * Canonical Issue object shape for LUMA
 */

export type IssueSeverity = 'info' | 'warn' | 'error' | 'critical';

export interface IssueSource {
  pattern: string; // e.g., "Form.Basic"
  name: string; // source name
  url: string; // source URL
}

export interface Issue {
  id: string; // e.g., "overflow-x", "primary-below-fold"
  severity: IssueSeverity;
  message: string; // human-readable
  nodeId?: string;
  jsonPointer?: string; // e.g., "/screen/root/children/1/actions/0"
  viewport?: string; // e.g., "320x640"
  details?: Record<string, unknown>; // arbitrary numeric/textual context
  source?: IssueSource; // for pattern-based issues
  suggestion?: string; // short actionable hint
  expected?: string; // what was expected (e.g., "strategy ∈ {wrap, scroll, cards}")
  found?: unknown; // what was actually found (can be null, string, number, etc.)
}
