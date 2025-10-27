/**
 * Pattern validator - executes pattern rules and generates issues.
 */

import type { Pattern, PatternResult, FlowOutput } from './types.js';
import type { Node } from '../../types/node.js';
import type { Issue } from '../../types/issue.js';

/**
 * Validate a scaffold against a single pattern.
 * 
 * @param pattern - Pattern to validate against
 * @param root - Root node of scaffold
 * @returns Pattern validation result
 */
export function validatePattern(pattern: Pattern, root: Node): PatternResult {
  const issues: Issue[] = [];
  let mustPassed = 0;
  let mustFailed = 0;
  let shouldPassed = 0;
  let shouldFailed = 0;
  
  // Run MUST rules
  for (const rule of pattern.must) {
    const ruleIssues = rule.check(root);
    
    if (ruleIssues.length > 0) {
      mustFailed++;
      issues.push(...ruleIssues);
    } else {
      mustPassed++;
    }
  }
  
  // Run SHOULD rules
  for (const rule of pattern.should) {
    const ruleIssues = rule.check(root);
    
    if (ruleIssues.length > 0) {
      shouldFailed++;
      issues.push(...ruleIssues);
    } else {
      shouldPassed++;
    }
  }
  
  return {
    pattern: pattern.name,
    source: pattern.source,
    mustPassed,
    mustFailed,
    shouldPassed,
    shouldFailed,
    issues,
  };
}

/**
 * Validate a scaffold against multiple patterns.
 * 
 * @param patterns - Array of patterns to validate against
 * @param root - Root node of scaffold
 * @returns Flow validation output
 */
export function validatePatterns(patterns: Pattern[], root: Node): FlowOutput {
  const results: PatternResult[] = [];
  let hasMustFailures = false;
  let totalIssues = 0;
  
  for (const pattern of patterns) {
    const result = validatePattern(pattern, root);
    results.push(result);
    
    if (result.mustFailed > 0) {
      hasMustFailures = true;
    }
    
    totalIssues += result.issues.length;
  }
  
  return {
    patterns: results,
    hasMustFailures,
    totalIssues,
  };
}
