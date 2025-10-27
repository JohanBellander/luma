import { describe, it, expect } from 'vitest';
import { validatePattern, validatePatterns } from '../../../src/core/patterns/validator.js';
import type { Pattern } from '../../../src/core/patterns/types.js';
import type { Node } from '../../../src/types/node.js';

describe('Pattern Validator', () => {
  describe('validatePattern', () => {
    it('should run all MUST and SHOULD rules', () => {
      const mockPattern: Pattern = {
        name: 'Test.Pattern',
        source: {
          pattern: 'Test.Pattern',
          name: 'Test Source',
          url: 'https://example.com',
        },
        must: [
          {
            id: 'must-rule-1',
            level: 'must',
            description: 'First must rule',
            check: () => [],
          },
          {
            id: 'must-rule-2',
            level: 'must',
            description: 'Second must rule',
            check: () => [],
          },
        ],
        should: [
          {
            id: 'should-rule-1',
            level: 'should',
            description: 'First should rule',
            check: () => [],
          },
        ],
      };

      const root: Node = { id: 'root', type: 'Box' };
      const result = validatePattern(mockPattern, root);

      expect(result.pattern).toBe('Test.Pattern');
      expect(result.mustPassed).toBe(2);
      expect(result.mustFailed).toBe(0);
      expect(result.shouldPassed).toBe(1);
      expect(result.shouldFailed).toBe(0);
      expect(result.issues).toHaveLength(0);
    });

    it('should count failed MUST rules', () => {
      const mockPattern: Pattern = {
        name: 'Test.Pattern',
        source: {
          pattern: 'Test.Pattern',
          name: 'Test Source',
          url: 'https://example.com',
        },
        must: [
          {
            id: 'must-fail',
            level: 'must',
            description: 'Failing must rule',
            check: (root: Node) => [
              {
                id: 'must-fail',
                severity: 'error',
                message: 'Must rule failed',
                nodeId: root.id,
              },
            ],
          },
          {
            id: 'must-pass',
            level: 'must',
            description: 'Passing must rule',
            check: () => [],
          },
        ],
        should: [],
      };

      const root: Node = { id: 'root', type: 'Box' };
      const result = validatePattern(mockPattern, root);

      expect(result.mustPassed).toBe(1);
      expect(result.mustFailed).toBe(1);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].severity).toBe('error');
    });

    it('should count failed SHOULD rules', () => {
      const mockPattern: Pattern = {
        name: 'Test.Pattern',
        source: {
          pattern: 'Test.Pattern',
          name: 'Test Source',
          url: 'https://example.com',
        },
        must: [],
        should: [
          {
            id: 'should-fail',
            level: 'should',
            description: 'Failing should rule',
            check: (root: Node) => [
              {
                id: 'should-fail',
                severity: 'warn',
                message: 'Should rule failed',
                nodeId: root.id,
              },
            ],
          },
          {
            id: 'should-pass',
            level: 'should',
            description: 'Passing should rule',
            check: () => [],
          },
        ],
      };

      const root: Node = { id: 'root', type: 'Box' };
      const result = validatePattern(mockPattern, root);

      expect(result.shouldPassed).toBe(1);
      expect(result.shouldFailed).toBe(1);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].severity).toBe('warn');
    });

    it('should aggregate all issues from all rules', () => {
      const mockPattern: Pattern = {
        name: 'Test.Pattern',
        source: {
          pattern: 'Test.Pattern',
          name: 'Test Source',
          url: 'https://example.com',
        },
        must: [
          {
            id: 'must-1',
            level: 'must',
            description: 'First must',
            check: (root: Node) => [
              {
                id: 'must-1',
                severity: 'error',
                message: 'Error 1',
                nodeId: root.id,
              },
              {
                id: 'must-1',
                severity: 'error',
                message: 'Error 2',
                nodeId: root.id,
              },
            ],
          },
        ],
        should: [
          {
            id: 'should-1',
            level: 'should',
            description: 'First should',
            check: (root: Node) => [
              {
                id: 'should-1',
                severity: 'warn',
                message: 'Warning 1',
                nodeId: root.id,
              },
            ],
          },
        ],
      };

      const root: Node = { id: 'root', type: 'Box' };
      const result = validatePattern(mockPattern, root);

      expect(result.issues).toHaveLength(3);
      expect(result.issues.filter(i => i.severity === 'error')).toHaveLength(2);
      expect(result.issues.filter(i => i.severity === 'warn')).toHaveLength(1);
    });
  });

  describe('validatePatterns', () => {
    it('should validate multiple patterns', () => {
      const pattern1: Pattern = {
        name: 'Pattern.One',
        source: {
          pattern: 'Pattern.One',
          name: 'Source One',
          url: 'https://example.com/one',
        },
        must: [
          {
            id: 'rule-1',
            level: 'must',
            description: 'Rule 1',
            check: () => [],
          },
        ],
        should: [],
      };

      const pattern2: Pattern = {
        name: 'Pattern.Two',
        source: {
          pattern: 'Pattern.Two',
          name: 'Source Two',
          url: 'https://example.com/two',
        },
        must: [
          {
            id: 'rule-2',
            level: 'must',
            description: 'Rule 2',
            check: () => [],
          },
        ],
        should: [],
      };

      const root: Node = { id: 'root', type: 'Box' };
      const result = validatePatterns([pattern1, pattern2], root);

      expect(result.patterns).toHaveLength(2);
      expect(result.patterns[0].pattern).toBe('Pattern.One');
      expect(result.patterns[1].pattern).toBe('Pattern.Two');
      expect(result.hasMustFailures).toBe(false);
      expect(result.totalIssues).toBe(0);
    });

    it('should detect MUST failures across patterns', () => {
      const passingPattern: Pattern = {
        name: 'Pattern.Pass',
        source: {
          pattern: 'Pattern.Pass',
          name: 'Source',
          url: 'https://example.com',
        },
        must: [
          {
            id: 'pass-rule',
            level: 'must',
            description: 'Passing rule',
            check: () => [],
          },
        ],
        should: [],
      };

      const failingPattern: Pattern = {
        name: 'Pattern.Fail',
        source: {
          pattern: 'Pattern.Fail',
          name: 'Source',
          url: 'https://example.com',
        },
        must: [
          {
            id: 'fail-rule',
            level: 'must',
            description: 'Failing rule',
            check: (root: Node) => [
              {
                id: 'fail-rule',
                severity: 'error',
                message: 'Must failure',
                nodeId: root.id,
              },
            ],
          },
        ],
        should: [],
      };

      const root: Node = { id: 'root', type: 'Box' };
      const result = validatePatterns([passingPattern, failingPattern], root);

      expect(result.hasMustFailures).toBe(true);
      expect(result.totalIssues).toBe(1);
      expect(result.patterns[0].mustFailed).toBe(0);
      expect(result.patterns[1].mustFailed).toBe(1);
    });

    it('should count total issues across all patterns', () => {
      const pattern1: Pattern = {
        name: 'Pattern.One',
        source: {
          pattern: 'Pattern.One',
          name: 'Source',
          url: 'https://example.com',
        },
        must: [
          {
            id: 'rule-1',
            level: 'must',
            description: 'Rule 1',
            check: (root: Node) => [
              {
                id: 'rule-1',
                severity: 'error',
                message: 'Error from pattern 1',
                nodeId: root.id,
              },
            ],
          },
        ],
        should: [],
      };

      const pattern2: Pattern = {
        name: 'Pattern.Two',
        source: {
          pattern: 'Pattern.Two',
          name: 'Source',
          url: 'https://example.com',
        },
        must: [],
        should: [
          {
            id: 'rule-2',
            level: 'should',
            description: 'Rule 2',
            check: (root: Node) => [
              {
                id: 'rule-2',
                severity: 'warn',
                message: 'Warning from pattern 2',
                nodeId: root.id,
              },
            ],
          },
        ],
      };

      const root: Node = { id: 'root', type: 'Box' };
      const result = validatePatterns([pattern1, pattern2], root);

      expect(result.totalIssues).toBe(2);
      expect(result.hasMustFailures).toBe(true);
    });

    it('should handle empty pattern list', () => {
      const root: Node = { id: 'root', type: 'Box' };
      const result = validatePatterns([], root);

      expect(result.patterns).toHaveLength(0);
      expect(result.hasMustFailures).toBe(false);
      expect(result.totalIssues).toBe(0);
    });
  });
});
