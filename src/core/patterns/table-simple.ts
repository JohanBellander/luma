/**
 * Table.Simple pattern from IBM Carbon Design System.
 * 
 * Per spec Section 7.2:
 * Source: IBM Carbon — Data Table
 * 
 * MUST rules:
 * 1. title-exists: Table.title non-empty
 * 2. responsive-strategy: Table.responsive.strategy ∈ {"wrap","scroll","cards"}
 * 3. min-width-fit-or-scroll: At smallest viewport, table does not overflow horizontally
 * 
 * SHOULD rules:
 * 1. controls-adjacent: Filters/controls adjacent to the table container
 */

import type { Pattern, PatternRule } from './types.js';
import type { Node, TableNode } from '../../types/node.js';
import type { Issue } from '../../types/issue.js';
import { traversePreOrder } from '../keyboard/traversal.js';

/**
 * Check that Table has a non-empty title.
 */
const titleExists: PatternRule = {
  id: 'title-exists',
  level: 'must',
  description: 'Table.title must be non-empty',
  check: (root: Node): Issue[] => {
    const issues: Issue[] = [];
    const nodes = traversePreOrder(root);
    
    for (const node of nodes) {
      if (node.type === 'Table') {
        const table = node as TableNode;
        if (!table.title || table.title.trim() === '') {
          issues.push({
            id: 'title-exists',
            severity: 'error',
            message: `Table "${table.id}" has empty or missing title`,
            nodeId: table.id,
            source: {
              pattern: 'Table.Simple',
              name: 'IBM Carbon Design System',
              url: 'https://carbondesignsystem.com/components/data-table/usage/',
            },
          });
        }
      }
    }
    
    return issues;
  },
};

/**
 * Check that Table has a valid responsive strategy.
 */
const responsiveStrategy: PatternRule = {
  id: 'responsive-strategy',
  level: 'must',
  description: 'Table.responsive.strategy must be one of: wrap, scroll, cards',
  check: (root: Node): Issue[] => {
    const issues: Issue[] = [];
    const nodes = traversePreOrder(root);
    const validStrategies = ['wrap', 'scroll', 'cards'];
    
    for (const node of nodes) {
      if (node.type === 'Table') {
        const table = node as TableNode;
        
        if (!table.responsive?.strategy) {
          issues.push({
            id: 'responsive-strategy',
            severity: 'error',
            message: `Table "${table.id}" is missing responsive.strategy`,
            nodeId: table.id,
            source: {
              pattern: 'Table.Simple',
              name: 'IBM Carbon Design System',
              url: 'https://carbondesignsystem.com/components/data-table/usage/',
            },
          });
        } else if (!validStrategies.includes(table.responsive.strategy)) {
          issues.push({
            id: 'responsive-strategy',
            severity: 'error',
            message: `Table "${table.id}" has invalid responsive.strategy "${table.responsive.strategy}" (must be: wrap, scroll, or cards)`,
            nodeId: table.id,
            source: {
              pattern: 'Table.Simple',
              name: 'IBM Carbon Design System',
              url: 'https://carbondesignsystem.com/components/data-table/usage/',
            },
          });
        }
      }
    }
    
    return issues;
  },
};

/**
 * Check that Table doesn't overflow at smallest viewport.
 * 
 * Note: This is a simplified check. Full implementation would require
 * layout calculation, but we can check for the responsive strategy.
 */
const minWidthFitOrScroll: PatternRule = {
  id: 'min-width-fit-or-scroll',
  level: 'must',
  description: 'At smallest viewport, table must not overflow horizontally; either columns fit or strategy is scroll/cards',
  check: (root: Node): Issue[] => {
    const issues: Issue[] = [];
    const nodes = traversePreOrder(root);
    
    for (const node of nodes) {
      if (node.type === 'Table') {
        const table = node as TableNode;
        
        // If strategy is scroll or cards, it's designed to handle overflow
        const strategy = table.responsive?.strategy;
        if (strategy === 'scroll' || strategy === 'cards') {
          // These strategies handle overflow appropriately
          continue;
        }
        
        // For wrap strategy or no strategy, we would need actual layout calculation
        // For now, issue a warning if no responsive strategy is set at all
        if (!strategy) {
          issues.push({
            id: 'min-width-fit-or-scroll',
            severity: 'error',
            message: `Table "${table.id}" has no responsive strategy; may overflow on small viewports`,
            nodeId: table.id,
            source: {
              pattern: 'Table.Simple',
              name: 'IBM Carbon Design System',
              url: 'https://carbondesignsystem.com/components/data-table/usage/',
            },
          });
        }
        
        // Note: Full implementation would calculate actual table width
        // and compare to viewport, but that requires layout engine integration
      }
    }
    
    return issues;
  },
};

/**
 * Recommend controls adjacent to table.
 * 
 * This is a heuristic check - looks for buttons/fields near the table in the tree.
 */
const controlsAdjacent: PatternRule = {
  id: 'controls-adjacent',
  level: 'should',
  description: 'Filters/controls should be adjacent to the table container',
  check: (_root: Node): Issue[] => {
    const issues: Issue[] = [];
    
    // Heuristic check for controls adjacent to table
    // This requires parent traversal which we haven't implemented
    // Skip for now - could be added in future version
    
    return issues;
  },
};

/**
 * Table.Simple pattern definition.
 */
export const TableSimple: Pattern = {
  name: 'Table.Simple',
  source: {
    pattern: 'Table.Simple',
    name: 'IBM Carbon Design System',
    url: 'https://carbondesignsystem.com/components/data-table/usage/',
  },
  must: [
    titleExists,
    responsiveStrategy,
    minWidthFitOrScroll,
  ],
  should: [
    controlsAdjacent,
  ],
};
