/**
 * Scaffold generator with built-in validation
 */

import type { Scaffold } from '../../types/scaffold.js';
import type { Issue } from '../../types/issue.js';
import { getPattern, type GenerateOptions } from './patterns.js';
import { ingest } from '../ingest/ingest.js';

export interface GenerateResult {
  success: boolean;
  scaffold?: Scaffold;
  issues?: Issue[];
  error?: string;
}

/**
 * Generate a scaffold from a pattern name
 * Validates the generated scaffold before returning it
 */
export function generateScaffold(
  patternName: string,
  options: GenerateOptions = {}
): GenerateResult {
  // Get the pattern generator
  const pattern = getPattern(patternName);
  if (!pattern) {
    return {
      success: false,
      error: `Unknown pattern: ${patternName}`,
    };
  }

  // Generate the scaffold
  let scaffold: Scaffold;
  try {
    scaffold = pattern.generate(options);
  } catch (error) {
    return {
      success: false,
      error: `Failed to generate scaffold: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  // Validate the generated scaffold
  const validation = ingest(scaffold);

  if (!validation.valid) {
    return {
      success: false,
      scaffold,
      issues: validation.issues,
      error: 'Generated scaffold failed validation',
    };
  }

  return {
    success: true,
    scaffold,
  };
}

/**
 * Parse breakpoints from a comma-separated string
 * e.g., "320x640,768x1024" -> ["320x640", "768x1024"]
 */
export function parseBreakpoints(breakpointsStr: string): string[] {
  return breakpointsStr
    .split(',')
    .map((bp) => bp.trim())
    .filter((bp) => bp.length > 0);
}
