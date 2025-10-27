/**
 * Responsive override system for LUMA
 * Implements spec Section 3.4: Responsive Override Application (Normative)
 */

import type { Node } from '../../types/node.js';

/**
 * Parse an `at` key to extract the operator and value
 * @param key - The `at` key (e.g., ">=320", "<=768")
 * @returns Object with operator and value, or null if invalid
 */
export function parseAtKey(key: string): { operator: '>=' | '<='; value: number } | null {
  const match = key.match(/^(>=|<=)(\d+)$/);
  if (!match) {
    return null;
  }

  const operator = match[1] as '>=' | '<=';
  const value = parseInt(match[2], 10);

  return { operator, value };
}

/**
 * Shallow merge two objects
 * - Nested objects are merged shallowly (one level deep)
 * - Arrays are replaced, not merged
 * @param base - Base object
 * @param override - Override object
 * @returns Merged object
 */
export function shallowMerge(base: any, override: any): any {
  if (override === null || override === undefined) {
    return base;
  }

  if (base === null || base === undefined) {
    return override;
  }

  // If override is an array, replace completely
  if (Array.isArray(override)) {
    return override;
  }

  // If override is not an object, replace
  if (typeof override !== 'object') {
    return override;
  }

  // If base is not an object, replace with override
  if (typeof base !== 'object' || Array.isArray(base)) {
    return override;
  }

  // Shallow merge objects
  const result: any = { ...base };

  for (const key in override) {
    if (Object.prototype.hasOwnProperty.call(override, key)) {
      const overrideValue = override[key];
      const baseValue = result[key];

      // Arrays replace completely
      if (Array.isArray(overrideValue)) {
        result[key] = overrideValue;
      }
      // Nested objects merge shallowly
      else if (
        typeof overrideValue === 'object' &&
        overrideValue !== null &&
        typeof baseValue === 'object' &&
        baseValue !== null &&
        !Array.isArray(baseValue)
      ) {
        result[key] = { ...baseValue, ...overrideValue };
      }
      // Primitives replace
      else {
        result[key] = overrideValue;
      }
    }
  }

  return result;
}

/**
 * Apply responsive overrides to a node for a given viewport width
 * 
 * Algorithm per spec Section 3.4:
 * 1. Collect all `>=X` where `X ≤ W`, apply in ascending X order (largest last)
 * 2. Collect all `<=Y` where `Y ≥ W`, apply in descending Y order (smallest last)
 * 3. Overlays override base node fields. Nested objects merge shallowly; arrays replace
 * 
 * @param node - The node to apply overrides to
 * @param viewportWidth - The viewport width in pixels
 * @returns Node with overrides applied
 */
export function applyResponsiveOverrides(node: any, viewportWidth: number): any {
  // If no `at` field, return node as-is
  if (!node.at || typeof node.at !== 'object') {
    return node;
  }

  let result = { ...node };
  delete result.at; // Remove the `at` field from result

  // Step 1: Collect all `>=X` where X ≤ W, sort ascending
  const greaterThanOrEqual: Array<{ value: number; override: any }> = [];
  
  // Step 2: Collect all `<=Y` where Y ≥ W, sort descending
  const lessThanOrEqual: Array<{ value: number; override: any }> = [];

  for (const key in node.at) {
    if (Object.prototype.hasOwnProperty.call(node.at, key)) {
      const parsed = parseAtKey(key);
      if (!parsed) {
        continue; // Skip invalid keys
      }

      const { operator, value } = parsed;
      const override = node.at[key];

      if (operator === '>=' && value <= viewportWidth) {
        greaterThanOrEqual.push({ value, override });
      } else if (operator === '<=' && value >= viewportWidth) {
        lessThanOrEqual.push({ value, override });
      }
    }
  }

  // Sort >= in ascending order (smallest first, largest last)
  greaterThanOrEqual.sort((a, b) => a.value - b.value);

  // Sort <= in descending order (largest first, smallest last)
  lessThanOrEqual.sort((a, b) => b.value - a.value);

  // Apply >= overrides in ascending order
  for (const item of greaterThanOrEqual) {
    result = shallowMerge(result, item.override);
  }

  // Apply <= overrides in descending order
  for (const item of lessThanOrEqual) {
    result = shallowMerge(result, item.override);
  }

  return result;
}

/**
 * Recursively apply responsive overrides to a node tree
 * @param node - The root node
 * @param viewportWidth - The viewport width in pixels
 * @returns Node tree with all overrides applied
 */
export function applyResponsiveOverridesRecursive(node: Node, viewportWidth: number): Node {
  // Apply overrides to current node
  let result = applyResponsiveOverrides(node, viewportWidth);

  // Recursively apply to children based on node type
  switch (result.type) {
    case 'Stack':
    case 'Grid':
      if (result.children) {
        result.children = result.children.map((child: Node) =>
          applyResponsiveOverridesRecursive(child, viewportWidth)
        );
      }
      break;

    case 'Box':
      if (result.child) {
        result.child = applyResponsiveOverridesRecursive(result.child, viewportWidth);
      }
      break;

    case 'Form':
      if (result.fields) {
        result.fields = result.fields.map((field: Node) =>
          applyResponsiveOverridesRecursive(field, viewportWidth)
        );
      }
      if (result.actions) {
        result.actions = result.actions.map((action: Node) =>
          applyResponsiveOverridesRecursive(action, viewportWidth)
        );
      }
      break;

    // Text, Button, Field, Table have no children
    default:
      break;
  }

  return result;
}
