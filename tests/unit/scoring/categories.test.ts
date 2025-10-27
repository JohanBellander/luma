import { describe, it, expect } from 'vitest';
import {
  scorePatternFidelity,
  scoreFlowReachability,
  scoreHierarchyGrouping,
  scoreResponsiveBehavior,
} from '../../../src/core/scoring/categories.js';
import type { PatternResult } from '../../../src/core/patterns/types.js';
import type { KeyboardOutput } from '../../../src/types/output.js';
import type { Issue } from '../../../src/types/issue.js';

describe('Category Scoring', () => {
  describe('scorePatternFidelity', () => {
    it('should return 100 for perfect score (no failures)', () => {
      const results: PatternResult[] = [
        {
          pattern: 'Test.Pattern',
          source: { pattern: 'Test', name: 'Test', url: 'http://test.com' },
          mustPassed: 4,
          mustFailed: 0,
          shouldPassed: 2,
          shouldFailed: 0,
          issues: [],
        },
      ];
      
      expect(scorePatternFidelity(results)).toBe(100);
    });

    it('should subtract 30 points per MUST failure', () => {
      const results: PatternResult[] = [
        {
          pattern: 'Test.Pattern',
          source: { pattern: 'Test', name: 'Test', url: 'http://test.com' },
          mustPassed: 2,
          mustFailed: 2,
          shouldPassed: 0,
          shouldFailed: 0,
          issues: [],
        },
      ];
      
      expect(scorePatternFidelity(results)).toBe(40); // 100 - 30*2
    });

    it('should subtract 10 points per SHOULD failure', () => {
      const results: PatternResult[] = [
        {
          pattern: 'Test.Pattern',
          source: { pattern: 'Test', name: 'Test', url: 'http://test.com' },
          mustPassed: 4,
          mustFailed: 0,
          shouldPassed: 1,
          shouldFailed: 3,
          issues: [],
        },
      ];
      
      expect(scorePatternFidelity(results)).toBe(70); // 100 - 10*3
    });

    it('should apply both MUST and SHOULD penalties', () => {
      const results: PatternResult[] = [
        {
          pattern: 'Test.Pattern',
          source: { pattern: 'Test', name: 'Test', url: 'http://test.com' },
          mustPassed: 3,
          mustFailed: 1,
          shouldPassed: 1,
          shouldFailed: 2,
          issues: [],
        },
      ];
      
      expect(scorePatternFidelity(results)).toBe(50); // 100 - 30*1 - 10*2
    });

    it('should floor at 0', () => {
      const results: PatternResult[] = [
        {
          pattern: 'Test.Pattern',
          source: { pattern: 'Test', name: 'Test', url: 'http://test.com' },
          mustPassed: 0,
          mustFailed: 10,
          shouldPassed: 0,
          shouldFailed: 5,
          issues: [],
        },
      ];
      
      expect(scorePatternFidelity(results)).toBe(0);
    });

    it('should aggregate across multiple patterns', () => {
      const results: PatternResult[] = [
        {
          pattern: 'Pattern.One',
          source: { pattern: 'One', name: 'One', url: 'http://one.com' },
          mustPassed: 3,
          mustFailed: 1,
          shouldPassed: 2,
          shouldFailed: 0,
          issues: [],
        },
        {
          pattern: 'Pattern.Two',
          source: { pattern: 'Two', name: 'Two', url: 'http://two.com' },
          mustPassed: 4,
          mustFailed: 0,
          shouldPassed: 1,
          shouldFailed: 1,
          issues: [],
        },
      ];
      
      expect(scorePatternFidelity(results)).toBe(60); // 100 - 30*1 - 10*1
    });
  });

  describe('scoreFlowReachability', () => {
    it('should return 100 for perfect flow (no issues)', () => {
      const output: KeyboardOutput = {
        sequence: ['btn1', 'btn2'],
        unreachable: [],
        issues: [],
      };
      
      expect(scoreFlowReachability(output)).toBe(100);
    });

    it('should subtract 30 points per unreachable node', () => {
      const output: KeyboardOutput = {
        sequence: ['btn1'],
        unreachable: ['btn2', 'btn3'],
        issues: [],
      };
      
      expect(scoreFlowReachability(output)).toBe(40); // 100 - 30*2
    });

    it('should subtract 10 points per warning', () => {
      const output: KeyboardOutput = {
        sequence: ['btn1', 'btn2'],
        unreachable: [],
        issues: [
          {
            id: 'cancel-before-primary',
            severity: 'warn',
            message: 'Warning',
            nodeId: 'btn1',
          },
          {
            id: 'cancel-before-primary',
            severity: 'warn',
            message: 'Warning',
            nodeId: 'btn2',
          },
        ],
      };
      
      expect(scoreFlowReachability(output)).toBe(80); // 100 - 10*2
    });

    it('should ignore non-warn severities', () => {
      const output: KeyboardOutput = {
        sequence: ['btn1'],
        unreachable: [],
        issues: [
          {
            id: 'some-error',
            severity: 'error',
            message: 'Error',
            nodeId: 'btn1',
          },
        ],
      };
      
      expect(scoreFlowReachability(output)).toBe(100);
    });

    it('should floor at 0', () => {
      const output: KeyboardOutput = {
        sequence: [],
        unreachable: ['btn1', 'btn2', 'btn3', 'btn4'],
        issues: Array(20).fill({
          id: 'warn',
          severity: 'warn',
          message: 'Warn',
          nodeId: 'btn',
        }),
      };
      
      expect(scoreFlowReachability(output)).toBe(0);
    });
  });

  describe('scoreHierarchyGrouping', () => {
    it('should return 100 for perfect hierarchy (no issues)', () => {
      expect(scoreHierarchyGrouping([], [])).toBe(100);
    });

    it('should subtract 10 points per structural issue', () => {
      const keyboardIssues: Issue[] = [
        {
          id: 'field-after-actions',
          severity: 'error',
          message: 'Structural error',
          nodeId: 'field1',
        },
        {
          id: 'field-after-actions',
          severity: 'error',
          message: 'Structural error',
          nodeId: 'field2',
        },
      ];
      
      expect(scoreHierarchyGrouping(keyboardIssues, [])).toBe(80); // 100 - 10*2
    });

    it('should subtract 5 points per spacing cluster (>2 issues)', () => {
      const layoutIssues: Issue[] = [
        { id: 'spacing-off-scale', severity: 'warn', message: 'Spacing', nodeId: 'a' },
        { id: 'spacing-off-scale', severity: 'warn', message: 'Spacing', nodeId: 'b' },
        { id: 'spacing-off-scale', severity: 'warn', message: 'Spacing', nodeId: 'c' },
        { id: 'spacing-off-scale', severity: 'warn', message: 'Spacing', nodeId: 'd' },
        { id: 'spacing-off-scale', severity: 'warn', message: 'Spacing', nodeId: 'e' },
        { id: 'spacing-off-scale', severity: 'warn', message: 'Spacing', nodeId: 'f' },
      ];
      
      // 6 issues = 2 clusters (floor(6/3))
      expect(scoreHierarchyGrouping([], layoutIssues)).toBe(90); // 100 - 5*2
    });

    it('should combine structural and spacing penalties', () => {
      const keyboardIssues: Issue[] = [
        {
          id: 'field-after-actions',
          severity: 'error',
          message: 'Structural',
          nodeId: 'field1',
        },
      ];
      
      const layoutIssues: Issue[] = [
        { id: 'spacing-off-scale', severity: 'warn', message: 'Spacing', nodeId: 'a' },
        { id: 'spacing-off-scale', severity: 'warn', message: 'Spacing', nodeId: 'b' },
        { id: 'spacing-off-scale', severity: 'warn', message: 'Spacing', nodeId: 'c' },
      ];
      
      // 1 structural = -10, 1 cluster (3 issues) = -5
      expect(scoreHierarchyGrouping(keyboardIssues, layoutIssues)).toBe(85);
    });

    it('should floor at 0', () => {
      const keyboardIssues: Issue[] = Array(20).fill({
        id: 'field-after-actions',
        severity: 'error',
        message: 'Structural',
        nodeId: 'field',
      });
      
      expect(scoreHierarchyGrouping(keyboardIssues, [])).toBe(0);
    });
  });

  describe('scoreResponsiveBehavior', () => {
    it('should return 100 for no responsive issues', () => {
      expect(scoreResponsiveBehavior([])).toBe(100);
    });

    it('should subtract 30 points per overflow-x', () => {
      const issues: Issue[] = [
        { id: 'overflow-x', severity: 'error', message: 'Overflow', nodeId: 'container' },
      ];
      
      expect(scoreResponsiveBehavior(issues)).toBe(70); // 100 - 30
    });

    it('should subtract 20 points per primary-below-fold', () => {
      const issues: Issue[] = [
        {
          id: 'primary-below-fold',
          severity: 'warn',
          message: 'Below fold',
          nodeId: 'button',
        },
      ];
      
      expect(scoreResponsiveBehavior(issues)).toBe(80); // 100 - 20
    });

    it('should combine multiple penalty types', () => {
      const issues: Issue[] = [
        { id: 'overflow-x', severity: 'error', message: 'Overflow', nodeId: 'container' },
        {
          id: 'primary-below-fold',
          severity: 'warn',
          message: 'Below fold',
          nodeId: 'button',
        },
      ];
      
      expect(scoreResponsiveBehavior(issues)).toBe(50); // 100 - 30 - 20
    });

    it('should floor at 0', () => {
      const issues: Issue[] = [
        { id: 'overflow-x', severity: 'error', message: 'Overflow', nodeId: 'c1' },
        { id: 'overflow-x', severity: 'error', message: 'Overflow', nodeId: 'c2' },
        { id: 'overflow-x', severity: 'error', message: 'Overflow', nodeId: 'c3' },
        { id: 'overflow-x', severity: 'error', message: 'Overflow', nodeId: 'c4' },
      ];
      
      expect(scoreResponsiveBehavior(issues)).toBe(0);
    });
  });
});
