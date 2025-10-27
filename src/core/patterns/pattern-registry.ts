/**
 * Pattern registry for UX patterns.
 * 
 * Provides lookup and listing of available patterns.
 */

import type { Pattern } from './types.js';
import { FormBasic } from './form-basic.js';
import { TableSimple } from './table-simple.js';

/**
 * Registry of all available patterns.
 */
const patterns: Map<string, Pattern> = new Map();

// Register patterns
patterns.set('form', FormBasic);
patterns.set('Form.Basic', FormBasic);
patterns.set('table', TableSimple);
patterns.set('Table.Simple', TableSimple);

/**
 * Get a pattern by name.
 * Supports both short names (form, table) and full names (Form.Basic, Table.Simple).
 * 
 * @param name - Pattern name (case-insensitive)
 * @returns Pattern if found, undefined otherwise
 */
export function getPattern(name: string): Pattern | undefined {
  const normalizedName = name.toLowerCase();
  
  // Try exact match first
  if (patterns.has(name)) {
    return patterns.get(name);
  }
  
  // Try case-insensitive match
  for (const [key, pattern] of patterns.entries()) {
    if (key.toLowerCase() === normalizedName) {
      return pattern;
    }
  }
  
  return undefined;
}

/**
 * Get all registered patterns.
 * 
 * @returns Array of all patterns
 */
export function getAllPatterns(): Pattern[] {
  // Return unique patterns (avoid duplicates from aliases)
  const unique = new Set<Pattern>();
  for (const pattern of patterns.values()) {
    unique.add(pattern);
  }
  return Array.from(unique);
}

/**
 * List all pattern names (both short and full names).
 * 
 * @returns Array of pattern names
 */
export function listPatternNames(): string[] {
  return Array.from(patterns.keys());
}

/**
 * Check if a pattern exists.
 * 
 * @param name - Pattern name
 * @returns True if pattern exists
 */
export function hasPattern(name: string): boolean {
  return getPattern(name) !== undefined;
}
