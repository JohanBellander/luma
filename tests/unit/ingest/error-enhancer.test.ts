/**
 * Tests for error enhancement wrapper
 */

import { describe, it, expect } from 'vitest';
import { enhanceIssue, enhanceIssues, formatIssuesForConsole } from '../../../src/core/ingest/error-enhancer.js';
import type { Issue } from '../../../src/types/issue.js';

describe('Error Enhancement', () => {
  describe('enhanceIssue', () => {
    it('should add suggestion for missing-schema-version', () => {
      const issue: Issue = {
        id: 'missing-schema-version',
        severity: 'critical',
        message: 'Missing required field: schemaVersion',
      };

      const enhanced = enhanceIssue(issue);

      expect(enhanced.suggestion).toBe('Add "schemaVersion": "1.0.0" to the root of your scaffold JSON');
    });

    it('should add suggestion for unsupported-schema-version', () => {
      const issue: Issue = {
        id: 'unsupported-schema-version',
        severity: 'critical',
        message: 'Unsupported schema version',
      };

      const enhanced = enhanceIssue(issue);

      expect(enhanced.suggestion).toBe('Change schemaVersion to "1.0.0"');
    });

    it('should add suggestion for duplicate-node-id', () => {
      const issue: Issue = {
        id: 'duplicate-node-id',
        severity: 'error',
        message: 'Duplicate node ID: "btn1"',
        nodeId: 'btn1',
      };

      const enhanced = enhanceIssue(issue);

      expect(enhanced.suggestion).toBe('Ensure all node IDs are unique within the scaffold');
    });

    it('should add suggestion for missing responsive strategy', () => {
      const issue: Issue = {
        id: 'validation-error',
        severity: 'error',
        message: 'Missing required property',
        jsonPointer: '/screen/root/children/2/responsive/strategy',
      };

      const enhanced = enhanceIssue(issue);

      expect(enhanced.suggestion).toContain('responsive');
      expect(enhanced.suggestion).toContain('strategy');
    });

    it('should add suggestion for missing table title', () => {
      const issue: Issue = {
        id: 'validation-error',
        severity: 'error',
        message: 'Missing title',
        jsonPointer: '/screen/root/children/0/title',
        expected: 'string',
      };

      const enhanced = enhanceIssue(issue);

      expect(enhanced.suggestion).toBeDefined();
      expect(enhanced.suggestion).toContain('title');
    });

    it('should add suggestion for missing form fields', () => {
      const issue: Issue = {
        id: 'validation-error',
        severity: 'error',
        message: 'Missing fields',
        jsonPointer: '/screen/root/children/1/fields',
      };

      const enhanced = enhanceIssue(issue);

      expect(enhanced.suggestion).toContain('Field');
    });

    it('should add suggestion for missing form actions', () => {
      const issue: Issue = {
        id: 'validation-error',
        severity: 'error',
        message: 'Missing actions',
        jsonPointer: '/screen/root/children/1/actions',
      };

      const enhanced = enhanceIssue(issue);

      expect(enhanced.suggestion).toContain('Button');
    });

    it('should not override existing suggestion', () => {
      const issue: Issue = {
        id: 'duplicate-node-id',
        severity: 'error',
        message: 'Duplicate node ID',
        suggestion: 'Existing suggestion',
      };

      const enhanced = enhanceIssue(issue);

      expect(enhanced.suggestion).toBe('Existing suggestion');
    });

    it('should suppress suggestion when noSuggest is true', () => {
      const issue: Issue = {
        id: 'missing-schema-version',
        severity: 'critical',
        message: 'Missing required field: schemaVersion',
      };

      const enhanced = enhanceIssue(issue, { noSuggest: true });

      expect(enhanced.suggestion).toBeUndefined();
    });

    it('should add nextAction for critical issues in verbose mode', () => {
      const issue: Issue = {
        id: 'missing-schema-version',
        severity: 'critical',
        message: 'Missing required field: schemaVersion',
      };

      const enhanced = enhanceIssue(issue, { format: 'verbose' }, 'test.json');

      expect(enhanced.details).toBeDefined();
      expect((enhanced.details as any).nextAction).toContain('luma ingest');
    });

    it('should add nextAction for error issues', () => {
      const issue: Issue = {
        id: 'validation-error',
        severity: 'error',
        message: 'Validation failed',
      };

      const enhanced = enhanceIssue(issue, {}, 'test.json');

      expect(enhanced.details).toBeDefined();
      expect((enhanced.details as any).nextAction).toBeDefined();
    });
  });

  describe('enhanceIssues', () => {
    it('should return empty array for no issues', () => {
      const enhanced = enhanceIssues([]);
      expect(enhanced).toEqual([]);
    });

    it('should return only most blocking issue by default', () => {
      const issues: Issue[] = [
        {
          id: 'non-zero-tabindex',
          severity: 'warn',
          message: 'Non-zero tabIndex',
        },
        {
          id: 'missing-schema-version',
          severity: 'critical',
          message: 'Missing schema version',
        },
        {
          id: 'duplicate-node-id',
          severity: 'error',
          message: 'Duplicate ID',
        },
      ];

      const enhanced = enhanceIssues(issues);

      expect(enhanced).toHaveLength(1);
      expect(enhanced[0].id).toBe('missing-schema-version');
    });

    it('should return all issues when allIssues is true', () => {
      const issues: Issue[] = [
        {
          id: 'non-zero-tabindex',
          severity: 'warn',
          message: 'Non-zero tabIndex',
        },
        {
          id: 'missing-schema-version',
          severity: 'critical',
          message: 'Missing schema version',
        },
      ];

      const enhanced = enhanceIssues(issues, { allIssues: true });

      expect(enhanced).toHaveLength(2);
    });

    it('should prioritize errors over warnings', () => {
      const issues: Issue[] = [
        {
          id: 'non-zero-tabindex',
          severity: 'warn',
          message: 'Warning',
        },
        {
          id: 'duplicate-node-id',
          severity: 'error',
          message: 'Error',
        },
      ];

      const enhanced = enhanceIssues(issues);

      expect(enhanced[0].severity).toBe('error');
    });

    it('should prioritize critical over errors', () => {
      const issues: Issue[] = [
        {
          id: 'duplicate-node-id',
          severity: 'error',
          message: 'Error',
        },
        {
          id: 'missing-schema-version',
          severity: 'critical',
          message: 'Critical',
        },
      ];

      const enhanced = enhanceIssues(issues);

      expect(enhanced[0].severity).toBe('critical');
    });

    it('should sort by issue type priority within same severity', () => {
      const issues: Issue[] = [
        {
          id: 'duplicate-node-id',
          severity: 'error',
          message: 'Duplicate',
        },
        {
          id: 'validation-error',
          severity: 'error',
          message: 'Validation',
        },
      ];

      const enhanced = enhanceIssues(issues);

      // validation-error has higher priority (80) than duplicate-node-id (70)
      expect(enhanced[0].id).toBe('validation-error');
    });

    it('should enhance all returned issues with suggestions', () => {
      const issues: Issue[] = [
        {
          id: 'missing-schema-version',
          severity: 'critical',
          message: 'Missing schema version',
        },
        {
          id: 'duplicate-node-id',
          severity: 'error',
          message: 'Duplicate ID',
        },
      ];

      const enhanced = enhanceIssues(issues, { allIssues: true });

      expect(enhanced[0].suggestion).toBeDefined();
      expect(enhanced[1].suggestion).toBeDefined();
    });
  });

  describe('formatIssuesForConsole', () => {
    it('should return "No issues found" for empty array', () => {
      const output = formatIssuesForConsole([]);
      expect(output).toBe('No issues found.');
    });

    it('should format single issue concisely', () => {
      const issues: Issue[] = [
        {
          id: 'missing-schema-version',
          severity: 'critical',
          message: 'Missing required field: schemaVersion',
          suggestion: 'Add "schemaVersion": "1.0.0"',
        },
      ];

      const output = formatIssuesForConsole(issues);

      expect(output).toContain('[CRITICAL]');
      expect(output).toContain('missing-schema-version');
      expect(output).toContain('Missing required field');
      expect(output).toContain('💡 Suggestion:');
    });

    it('should include nodeId when present', () => {
      const issues: Issue[] = [
        {
          id: 'duplicate-node-id',
          severity: 'error',
          message: 'Duplicate ID',
          nodeId: 'btn1',
        },
      ];

      const output = formatIssuesForConsole(issues);

      expect(output).toContain('Node: btn1');
    });

    it('should suppress suggestions when noSuggest is true', () => {
      const issues: Issue[] = [
        {
          id: 'missing-schema-version',
          severity: 'critical',
          message: 'Missing required field: schemaVersion',
          suggestion: 'Add "schemaVersion": "1.0.0"',
        },
      ];

      const output = formatIssuesForConsole(issues, { noSuggest: true });

      expect(output).not.toContain('💡 Suggestion');
    });

    it('should show jsonPointer in verbose mode', () => {
      const issues: Issue[] = [
        {
          id: 'validation-error',
          severity: 'error',
          message: 'Validation failed',
          jsonPointer: '/screen/root/children/0',
        },
      ];

      const output = formatIssuesForConsole(issues, { format: 'verbose' });

      expect(output).toContain('Location: /screen/root/children/0');
    });

    it('should show expected/found in verbose mode', () => {
      const issues: Issue[] = [
        {
          id: 'validation-error',
          severity: 'error',
          message: 'Invalid type',
          expected: 'string',
          found: 'number',
        },
      ];

      const output = formatIssuesForConsole(issues, { format: 'verbose' });

      expect(output).toContain('Expected: string');
      expect(output).toContain('Found: "number"');
    });

    it('should show nextAction in verbose mode when present', () => {
      const issues: Issue[] = [
        {
          id: 'validation-error',
          severity: 'error',
          message: 'Validation failed',
          details: {
            nextAction: 'Fix the issue and rerun: luma ingest test.json',
          },
        },
      ];

      const output = formatIssuesForConsole(issues, { format: 'verbose' });

      expect(output).toContain('➡️  Next:');
      expect(output).toContain('luma ingest test.json');
    });

    it('should format multiple issues with separators', () => {
      const issues: Issue[] = [
        {
          id: 'issue1',
          severity: 'error',
          message: 'First issue',
        },
        {
          id: 'issue2',
          severity: 'warn',
          message: 'Second issue',
        },
      ];

      const output = formatIssuesForConsole(issues);

      const lines = output.split('\n');
      // Should have separator between issues (empty line)
      expect(lines.some((line) => line === '')).toBe(true);
    });
  });
});
