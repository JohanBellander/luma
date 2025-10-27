/**
 * UX Pattern Library type definitions.
 * 
 * Per spec Section 7:
 * - Patterns have MUST and SHOULD rules
 * - Each pattern has a source attribution
 * - MUST failures are blocking (exit 3)
 */

import type { Issue, IssueSource } from '../../types/issue.js';
import type { Node } from '../../types/node.js';

/**
 * Pattern rule severity level.
 * MUST rules are blocking, SHOULD rules are recommendations.
 */
export type PatternRuleLevel = 'must' | 'should';

/**
 * Pattern rule definition.
 */
export interface PatternRule {
  id: string; // e.g., "field-has-label"
  level: PatternRuleLevel;
  description: string;
  check: (root: Node) => Issue[];
}

/**
 * Pattern definition with source attribution.
 */
export interface Pattern {
  name: string; // e.g., "Form.Basic"
  source: IssueSource; // e.g., GOV.UK Design System
  must: PatternRule[]; // blocking rules
  should: PatternRule[]; // recommendation rules
}

/**
 * Result of validating a pattern against a scaffold.
 */
export interface PatternResult {
  pattern: string; // pattern name
  source: IssueSource;
  mustPassed: number;
  mustFailed: number;
  shouldPassed: number;
  shouldFailed: number;
  issues: Issue[]; // all issues from this pattern
}

/**
 * Output of flow command (pattern validation).
 */
export interface FlowOutput {
  patterns: PatternResult[];
  hasMustFailures: boolean; // true if any MUST rule failed
  totalIssues: number;
}
