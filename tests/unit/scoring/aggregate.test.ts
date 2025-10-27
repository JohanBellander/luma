import { describe, it, expect } from 'vitest';
import {
  calculateOverallScore,
  evaluatePassFail,
  createScoreOutput,
} from '../../../src/core/scoring/aggregate.js';
import { DEFAULT_WEIGHTS, DEFAULT_CRITERIA } from '../../../src/core/scoring/types.js';
import type { CategoryScores, ScoreWeights, PassCriteria } from '../../../src/core/scoring/types.js';
import type { PatternResult } from '../../../src/core/patterns/types.js';

describe('Aggregate Scoring', () => {
  describe('calculateOverallScore', () => {
    it('should calculate weighted average with default weights', () => {
      const categories: CategoryScores = {
        patternFidelity: 100,
        flowReachability: 100,
        hierarchyGrouping: 100,
        responsiveBehavior: 100,
      };
      
      const overall = calculateOverallScore(categories, DEFAULT_WEIGHTS);
      expect(overall).toBe(100);
    });

    it('should apply 45% weight to pattern fidelity', () => {
      const categories: CategoryScores = {
        patternFidelity: 100,
        flowReachability: 0,
        hierarchyGrouping: 0,
        responsiveBehavior: 0,
      };
      
      const overall = calculateOverallScore(categories, DEFAULT_WEIGHTS);
      expect(overall).toBe(45); // round(100 * 0.45)
    });

    it('should apply 25% weight to flow reachability', () => {
      const categories: CategoryScores = {
        patternFidelity: 0,
        flowReachability: 100,
        hierarchyGrouping: 0,
        responsiveBehavior: 0,
      };
      
      const overall = calculateOverallScore(categories, DEFAULT_WEIGHTS);
      expect(overall).toBe(25); // round(100 * 0.25)
    });

    it('should apply 20% weight to hierarchy grouping', () => {
      const categories: CategoryScores = {
        patternFidelity: 0,
        flowReachability: 0,
        hierarchyGrouping: 100,
        responsiveBehavior: 0,
      };
      
      const overall = calculateOverallScore(categories, DEFAULT_WEIGHTS);
      expect(overall).toBe(20); // round(100 * 0.20)
    });

    it('should apply 10% weight to responsive behavior', () => {
      const categories: CategoryScores = {
        patternFidelity: 0,
        flowReachability: 0,
        hierarchyGrouping: 0,
        responsiveBehavior: 100,
      };
      
      const overall = calculateOverallScore(categories, DEFAULT_WEIGHTS);
      expect(overall).toBe(10); // round(100 * 0.10)
    });

    it('should round to nearest integer', () => {
      const categories: CategoryScores = {
        patternFidelity: 90,
        flowReachability: 85,
        hierarchyGrouping: 80,
        responsiveBehavior: 75,
      };
      
      // 90*0.45 + 85*0.25 + 80*0.20 + 75*0.10 = 40.5 + 21.25 + 16 + 7.5 = 85.25 → 85
      const overall = calculateOverallScore(categories, DEFAULT_WEIGHTS);
      expect(overall).toBe(85);
    });

    it('should support custom weights', () => {
      const categories: CategoryScores = {
        patternFidelity: 100,
        flowReachability: 100,
        hierarchyGrouping: 100,
        responsiveBehavior: 100,
      };
      
      const customWeights: ScoreWeights = {
        patternFidelity: 0.5,
        flowReachability: 0.3,
        hierarchyGrouping: 0.15,
        responsiveBehavior: 0.05,
      };
      
      const overall = calculateOverallScore(categories, customWeights);
      expect(overall).toBe(100);
    });
  });

  describe('evaluatePassFail', () => {
    const categories: CategoryScores = {
      patternFidelity: 90,
      flowReachability: 90,
      hierarchyGrouping: 90,
      responsiveBehavior: 90,
    };

    const passingResults: PatternResult[] = [
      {
        pattern: 'Test',
        source: { pattern: 'Test', name: 'Test', url: 'http://test.com' },
        mustPassed: 4,
        mustFailed: 0,
        shouldPassed: 2,
        shouldFailed: 0,
        issues: [],
      },
    ];

    it('should pass when all criteria met', () => {
      const { pass, failReasons } = evaluatePassFail(
        categories,
        90,
        passingResults,
        0,
        DEFAULT_CRITERIA
      );
      
      expect(pass).toBe(true);
      expect(failReasons).toHaveLength(0);
    });

    it('should fail when MUST failures present', () => {
      const failingResults: PatternResult[] = [
        {
          pattern: 'Test',
          source: { pattern: 'Test', name: 'Test', url: 'http://test.com' },
          mustPassed: 3,
          mustFailed: 2,
          shouldPassed: 0,
          shouldFailed: 0,
          issues: [],
        },
      ];
      
      const { pass, failReasons } = evaluatePassFail(
        categories,
        90,
        failingResults,
        0,
        DEFAULT_CRITERIA
      );
      
      expect(pass).toBe(false);
      expect(failReasons).toContain('2 MUST failure(s) in pattern validation');
    });

    it('should fail when unreachable nodes present', () => {
      const { pass, failReasons } = evaluatePassFail(
        categories,
        90,
        passingResults,
        3,
        DEFAULT_CRITERIA
      );
      
      expect(pass).toBe(false);
      expect(failReasons).toContain('3 unreachable node(s)');
    });

    it('should fail when overall score below minimum', () => {
      const { pass, failReasons } = evaluatePassFail(
        categories,
        80,
        passingResults,
        0,
        DEFAULT_CRITERIA
      );
      
      expect(pass).toBe(false);
      expect(failReasons).toContain('Overall score 80 below minimum 85');
    });

    it('should report multiple fail reasons', () => {
      const failingResults: PatternResult[] = [
        {
          pattern: 'Test',
          source: { pattern: 'Test', name: 'Test', url: 'http://test.com' },
          mustPassed: 3,
          mustFailed: 1,
          shouldPassed: 0,
          shouldFailed: 0,
          issues: [],
        },
      ];
      
      const { pass, failReasons } = evaluatePassFail(
        categories,
        70,
        failingResults,
        2,
        DEFAULT_CRITERIA
      );
      
      expect(pass).toBe(false);
      expect(failReasons).toHaveLength(3);
      expect(failReasons).toContain('1 MUST failure(s) in pattern validation');
      expect(failReasons).toContain('2 unreachable node(s)');
      expect(failReasons).toContain('Overall score 70 below minimum 85');
    });

    it('should respect custom criteria', () => {
      const customCriteria: PassCriteria = {
        noMustFailures: false,
        noCriticalFlowErrors: false,
        minOverallScore: 70,
      };
      
      const failingResults: PatternResult[] = [
        {
          pattern: 'Test',
          source: { pattern: 'Test', name: 'Test', url: 'http://test.com' },
          mustPassed: 2,
          mustFailed: 2,
          shouldPassed: 0,
          shouldFailed: 0,
          issues: [],
        },
      ];
      
      const { pass, failReasons } = evaluatePassFail(
        categories,
        75,
        failingResults,
        3,
        customCriteria
      );
      
      expect(pass).toBe(true);
      expect(failReasons).toHaveLength(0);
    });
  });

  describe('createScoreOutput', () => {
    it('should create complete score output', () => {
      const categories: CategoryScores = {
        patternFidelity: 90,
        flowReachability: 85,
        hierarchyGrouping: 95,
        responsiveBehavior: 100,
      };
      
      const patternResults: PatternResult[] = [
        {
          pattern: 'Test',
          source: { pattern: 'Test', name: 'Test', url: 'http://test.com' },
          mustPassed: 4,
          mustFailed: 0,
          shouldPassed: 1,
          shouldFailed: 1,
          issues: [],
        },
      ];
      
      const output = createScoreOutput(
        categories,
        DEFAULT_WEIGHTS,
        patternResults,
        0,
        DEFAULT_CRITERIA
      );
      
      expect(output.categories).toEqual(categories);
      expect(output.weights).toEqual(DEFAULT_WEIGHTS);
      expect(output.overall).toBe(91); // 90*0.45 + 85*0.25 + 95*0.20 + 100*0.10 = 90.75 → 91
      expect(output.criteria).toEqual(DEFAULT_CRITERIA);
      expect(output.pass).toBe(true);
      expect(output.failReasons).toHaveLength(0);
    });

    it('should include fail reasons when failing', () => {
      const categories: CategoryScores = {
        patternFidelity: 60,
        flowReachability: 50,
        hierarchyGrouping: 70,
        responsiveBehavior: 80,
      };
      
      const patternResults: PatternResult[] = [
        {
          pattern: 'Test',
          source: { pattern: 'Test', name: 'Test', url: 'http://test.com' },
          mustPassed: 2,
          mustFailed: 2,
          shouldPassed: 0,
          shouldFailed: 0,
          issues: [],
        },
      ];
      
      const output = createScoreOutput(
        categories,
        DEFAULT_WEIGHTS,
        patternResults,
        1,
        DEFAULT_CRITERIA
      );
      
      expect(output.pass).toBe(false);
      expect(output.failReasons.length).toBeGreaterThan(0);
    });
  });
});
