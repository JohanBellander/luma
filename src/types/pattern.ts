/**
 * Pattern rule types for LUMA
 */

export type RuleType = 'MUST' | 'SHOULD';

export interface PatternSource {
  name: string;
  url: string;
}

export interface PatternRule {
  id: string; // e.g., "field-has-label"
  type: RuleType;
  description: string;
}

export interface Pattern {
  id: string; // e.g., "Form.Basic"
  name: string;
  source: PatternSource;
  rules: PatternRule[];
}

export interface PatternLibrary {
  patterns: Pattern[];
}
