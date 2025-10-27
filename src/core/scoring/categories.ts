/**
 * Category scoring functions per spec Section 8.1
 */

import type { Issue } from '../../types/issue.js';
import type { PatternResult } from '../patterns/types.js';
import type { KeyboardOutput } from '../../types/output.js';

/**
 * Calculate Pattern Fidelity score.
 * Formula: 100 - 30*MUST - 10*SHOULD (floor at 0)
 * 
 * @param patternResults - Results from pattern validation (flow.json)
 * @returns Score from 0-100
 */
export function scorePatternFidelity(patternResults: PatternResult[]): number {
  let mustFailures = 0;
  let shouldFailures = 0;
  
  for (const result of patternResults) {
    mustFailures += result.mustFailed;
    shouldFailures += result.shouldFailed;
  }
  
  const score = 100 - (30 * mustFailures) - (10 * shouldFailures);
  return Math.max(0, score);
}

/**
 * Calculate Flow & Reachability score.
 * Formula: 100 - 30*unreachable - 10*warn (floor at 0)
 * 
 * @param keyboardOutput - Output from keyboard analysis
 * @returns Score from 0-100
 */
export function scoreFlowReachability(keyboardOutput: KeyboardOutput): number {
  const unreachableCount = keyboardOutput.unreachable?.length ?? 0;
  
  // Count warnings (severity: warn)
  const warnCount = keyboardOutput.issues.filter(
    (issue: Issue) => issue.severity === 'warn'
  ).length;
  
  const score = 100 - (30 * unreachableCount) - (10 * warnCount);
  return Math.max(0, score);
}

/**
 * Calculate Hierarchy & Grouping score.
 * Formula: 100 - 10*structural - 5*spacing_clusters (floor at 0)
 * 
 * Structural issues include field-after-actions and similar ordering problems.
 * Spacing clusters are groups of >2 spacing-off-scale issues.
 * 
 * @param keyboardIssues - Issues from keyboard analysis
 * @param layoutIssues - Issues from layout analysis (all viewports)
 * @returns Score from 0-100
 */
export function scoreHierarchyGrouping(
  keyboardIssues: Issue[],
  layoutIssues: Issue[]
): number {
  // Count structural issues (e.g., field-after-actions)
  const structuralIssues = keyboardIssues.filter(
    issue => issue.id === 'field-after-actions'
  ).length;
  
  // Count spacing-off-scale issues and cluster them
  const spacingIssues = layoutIssues.filter(
    issue => issue.id === 'spacing-off-scale'
  );
  
  // A cluster is defined as >2 occurrences
  // For simplicity, we count clusters as floor(count / 3)
  const spacingClusters = Math.floor(spacingIssues.length / 3);
  
  const score = 100 - (10 * structuralIssues) - (5 * spacingClusters);
  return Math.max(0, score);
}

/**
 * Calculate Responsive Behavior score.
 * Formula: Average penalties across smallest & mid viewports
 * Penalties: 30 per overflow-x, 20 per primary-below-fold
 * 
 * @param layoutIssues - Issues from layout analysis (all viewports)
 * @returns Score from 0-100
 */
export function scoreResponsiveBehavior(layoutIssues: Issue[]): number {
  // Group issues by viewport (if available in issue metadata)
  const viewportPenalties = new Map<string, number>();
  
  for (const issue of layoutIssues) {
    const viewport = (issue as any).viewport || 'default';
    const currentPenalty = viewportPenalties.get(viewport) || 0;
    
    let penalty = 0;
    if (issue.id === 'overflow-x') {
      penalty = 30;
    } else if (issue.id === 'primary-below-fold') {
      penalty = 20;
    }
    
    viewportPenalties.set(viewport, currentPenalty + penalty);
  }
  
  // If no viewport-specific penalties, assume single viewport
  if (viewportPenalties.size === 0) {
    return 100;
  }
  
  // Average penalties across all viewports
  const totalPenalty = Array.from(viewportPenalties.values()).reduce(
    (sum, penalty) => sum + penalty,
    0
  );
  const avgPenalty = totalPenalty / viewportPenalties.size;
  
  const score = 100 - avgPenalty;
  return Math.max(0, score);
}
