/**
 * Pattern registry for UX patterns.
 * 
 * Provides lookup and listing of available patterns.
 */

import type { Pattern } from './types.js';
import { FormBasic } from './form-basic.js';
import { TableSimple } from './table-simple.js';
import { ProgressiveDisclosure } from './progressive-disclosure.js';
import { GuidedFlow } from './guided-flow.js';

/**
 * Internal structure for pattern registration including aliases.
 */
interface RegisteredPattern {
  pattern: Pattern;
  aliases: string[]; // alias names (case-insensitive matching)
}

/**
 * Canonical pattern registry.
 * Keys are canonical pattern names; each entry declares its alias set.
 */
const registry: Map<string, RegisteredPattern> = new Map([
  [
    'Form.Basic',
    {
      pattern: FormBasic,
      aliases: ['form', 'form-basic'],
    },
  ],
  [
    'Table.Simple',
    {
      pattern: TableSimple,
      aliases: ['table', 'table-simple'],
    },
  ],
  [
    'Progressive.Disclosure',
    {
      pattern: ProgressiveDisclosure,
      aliases: ['progressive-disclosure', 'pd'],
    },
  ],
  [
    'Guided.Flow',
    {
      pattern: GuidedFlow,
      aliases: ['guided-flow', 'wizard', 'flow-wizard'],
    },
  ],
]);

/**
 * Reverse alias index for O(1) alias lookup.
 */
const aliasIndex: Map<string, string> = new Map(); // alias -> canonical name
for (const [canonical, entry] of registry.entries()) {
  for (const alias of entry.aliases) {
    aliasIndex.set(alias.toLowerCase(), canonical);
  }
  // Also map lowercase canonical to itself for case-insensitive match
  aliasIndex.set(canonical.toLowerCase(), canonical);
}

/**
 * Resolve a pattern by name or alias (case-insensitive).
 */
export function getPattern(name: string): Pattern | undefined {
  if (!name) return undefined;
  const lowered = name.toLowerCase();
  const canonical = aliasIndex.get(lowered);
  if (!canonical) return undefined;
  return registry.get(canonical)?.pattern;
}

/**
 * Return all canonical pattern objects.
 */
export function getAllPatterns(): Pattern[] {
  return Array.from(registry.values()).map(r => r.pattern);
}

/**
 * List all names (canonical + aliases) for backward compatibility.
 */
export function listPatternNames(): string[] {
  const names: string[] = [];
  for (const [canonical, entry] of registry.entries()) {
    names.push(canonical);
    for (const alias of entry.aliases) names.push(alias);
  }
  return names;
}

/**
 * Get aliases for a canonical pattern name.
 */
export function getAliases(canonical: string): string[] {
  return registry.get(canonical)?.aliases ?? [];
}

/**
 * Check if a pattern exists by any name.
 */
export function hasPattern(name: string): boolean {
  return getPattern(name) !== undefined;
}

/**
 * Export internal registry for advanced consumers (tests).
 */
export function _getRegistry(): Map<string, RegisteredPattern> {
  return registry;
}
