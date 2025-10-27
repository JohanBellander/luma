/**
 * Scoring types for LUMA v1.0
 * Per spec Section 8: Scoring & Thresholds
 */

/**
 * Category scores (0-100 each)
 */
export interface CategoryScores {
  /** Pattern Fidelity: 100 - 30*MUST - 10*SHOULD (floor 0) */
  patternFidelity: number;
  
  /** Flow & Reachability: 100 - 30*unreachable - 10*warn (floor 0) */
  flowReachability: number;
  
  /** Hierarchy & Grouping: 100 - 10*structural - 5*spacing_clusters (floor 0) */
  hierarchyGrouping: number;
  
  /** Responsive Behavior: Average penalties across viewports (floor 0) */
  responsiveBehavior: number;
}

/**
 * Category weights (must sum to 1.0)
 * Defaults: 45%, 25%, 20%, 10%
 */
export interface ScoreWeights {
  patternFidelity: number;
  flowReachability: number;
  hierarchyGrouping: number;
  responsiveBehavior: number;
}

/**
 * Pass/fail criteria
 */
export interface PassCriteria {
  /** No MUST pattern failures allowed */
  noMustFailures: boolean;
  
  /** No critical flow errors (unreachable nodes) */
  noCriticalFlowErrors: boolean;
  
  /** Minimum overall score (default: 85) */
  minOverallScore: number;
}

/**
 * Complete scoring output
 */
export interface ScoreOutput {
  /** Category scores (0-100) */
  categories: CategoryScores;
  
  /** Weights used for aggregation */
  weights: ScoreWeights;
  
  /** Overall weighted score (0-100) */
  overall: number;
  
  /** Pass criteria used */
  criteria: PassCriteria;
  
  /** Whether the scaffold passes all criteria */
  pass: boolean;
  
  /** Reasons for failure (if any) */
  failReasons: string[];
}

/**
 * Default category weights per spec Section 8
 */
export const DEFAULT_WEIGHTS: ScoreWeights = {
  patternFidelity: 0.45,
  flowReachability: 0.25,
  hierarchyGrouping: 0.20,
  responsiveBehavior: 0.10,
};

/**
 * Default pass criteria per spec Section 8.2
 */
export const DEFAULT_CRITERIA: PassCriteria = {
  noMustFailures: true,
  noCriticalFlowErrors: true,
  minOverallScore: 85,
};
