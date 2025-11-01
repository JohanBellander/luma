import type { PatternSuggestion } from './suggestions.js';
import { getAllPatterns } from './pattern-registry.js';

export interface CoverageGap {
  pattern: string;
  reason: string;
}

export interface CoverageResult {
  activated: number;
  nTotal: number;
  percent: number; // 0-100
  gaps: CoverageGap[];
}

/**
 * Compute pattern coverage metrics.
 * @param suggestions All pattern suggestions (any confidence)
 * @param activatedPatternNames Names of patterns currently validated
 */
export function computeCoverage(suggestions: PatternSuggestion[], activatedPatternNames: string[]): CoverageResult {
  const uniquePatterns = getAllPatterns();
  const activatedSet = new Set(activatedPatternNames);
  // Consider gaps only for medium/high suggestions not in activated
  const gaps: CoverageGap[] = [];
  for (const s of suggestions) {
    if ((s.confidence === 'high' || s.confidence === 'medium') && !activatedSet.has(s.pattern)) {
      gaps.push({ pattern: s.pattern, reason: s.reason });
    }
  }
  const activated = activatedSet.size;
  const nTotal = uniquePatterns.length;
  const percent = nTotal === 0 ? 0 : parseFloat(((activated / nTotal) * 100).toFixed(2));
  return { activated, nTotal, percent, gaps };
}
