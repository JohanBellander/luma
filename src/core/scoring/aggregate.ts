/**
 * Aggregate scoring and pass/fail logic per spec Section 8.2
 */

import type {
  CategoryScores,
  ScoreWeights,
  PassCriteria,
  ScoreOutput,
} from './types.js';
import type { PatternResult } from '../patterns/types.js';

/**
 * Calculate overall weighted score.
 * Formula: round(Σ weight[i] * score[i])
 * 
 * @param categories - Category scores (0-100 each)
 * @param weights - Category weights (must sum to 1.0)
 * @returns Overall score (0-100)
 */
export function calculateOverallScore(
  categories: CategoryScores,
  weights: ScoreWeights
): number {
  const weighted =
    weights.patternFidelity * categories.patternFidelity +
    weights.flowReachability * categories.flowReachability +
    weights.hierarchyGrouping * categories.hierarchyGrouping +
    weights.responsiveBehavior * categories.responsiveBehavior;
  
  return Math.round(weighted);
}

/**
 * Determine pass/fail and reasons.
 * 
 * Per spec Section 8.2 Pass Criteria:
 * - No MUST failures
 * - No critical flow errors
 * - overall >= 85 (configurable)
 * 
 * @param categories - Category scores
 * @param overall - Overall weighted score
 * @param patternResults - Pattern validation results
 * @param unreachableCount - Number of unreachable nodes
 * @param criteria - Pass criteria to apply
 * @returns Pass boolean and fail reasons
 */
export function evaluatePassFail(
  _categories: CategoryScores,
  overall: number,
  patternResults: PatternResult[],
  unreachableCount: number,
  criteria: PassCriteria
): { pass: boolean; failReasons: string[] } {
  const failReasons: string[] = [];
  
  // Check for MUST failures
  if (criteria.noMustFailures) {
    const mustFailures = patternResults.reduce(
      (sum, result) => sum + result.mustFailed,
      0
    );
    
    if (mustFailures > 0) {
      failReasons.push(`${mustFailures} MUST failure(s) in pattern validation`);
    }
  }
  
  // Check for critical flow errors
  if (criteria.noCriticalFlowErrors && unreachableCount > 0) {
    failReasons.push(`${unreachableCount} unreachable node(s)`);
  }
  
  // Check minimum overall score
  if (overall < criteria.minOverallScore) {
    failReasons.push(
      `Overall score ${overall} below minimum ${criteria.minOverallScore}`
    );
  }
  
  return {
    pass: failReasons.length === 0,
    failReasons,
  };
}

/**
 * Create complete score output.
 * 
 * @param categories - Category scores
 * @param weights - Weights used
 * @param patternResults - Pattern validation results
 * @param unreachableCount - Number of unreachable nodes
 * @param criteria - Pass criteria
 * @returns Complete ScoreOutput
 */
export function createScoreOutput(
  categories: CategoryScores,
  weights: ScoreWeights,
  patternResults: PatternResult[],
  unreachableCount: number,
  criteria: PassCriteria
): ScoreOutput {
  const overall = calculateOverallScore(categories, weights);
  const { pass, failReasons } = evaluatePassFail(
    categories,
    overall,
    patternResults,
    unreachableCount,
    criteria
  );
  
  return {
    categories,
    weights,
    overall,
    criteria,
    pass,
    failReasons,
  };
}
