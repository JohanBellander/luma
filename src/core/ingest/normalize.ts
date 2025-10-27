/**
 * Normalization utilities for scaffold data
 * Applies default values to nodes
 */

import type { Node } from '../../types/node.js';

/**
 * Apply default values to a node and its children
 * @param node - Node to normalize
 * @returns Normalized node with defaults applied
 */
export function normalizeNode(node: any): Node {
  const normalized: any = {
    ...node,
    visible: node.visible ?? true,
    widthPolicy: node.widthPolicy ?? 'hug',
    heightPolicy: node.heightPolicy ?? 'hug',
  };

  // Type-specific defaults
  switch (node.type) {
    case 'Stack':
      normalized.gap = node.gap ?? 0;
      normalized.padding = node.padding ?? 0;
      normalized.align = node.align ?? 'start';
      normalized.wrap = node.wrap ?? false;
      if (node.children) {
        normalized.children = node.children.map(normalizeNode);
      }
      break;

    case 'Grid':
      normalized.gap = node.gap ?? 0;
      if (node.children) {
        normalized.children = node.children.map(normalizeNode);
      }
      break;

    case 'Box':
      normalized.padding = node.padding ?? 0;
      if (node.child) {
        normalized.child = normalizeNode(node.child);
      }
      break;

    case 'Text':
      normalized.fontSize = node.fontSize ?? 16;
      break;

    case 'Button':
      normalized.focusable = node.focusable ?? true;
      break;

    case 'Field':
      normalized.focusable = node.focusable ?? true;
      break;

    case 'Form':
      if (node.fields) {
        normalized.fields = node.fields.map(normalizeNode);
      }
      if (node.actions) {
        normalized.actions = node.actions.map(normalizeNode);
      }
      break;

    case 'Table':
      // No additional defaults for Table
      break;
  }

  return normalized;
}

/**
 * Normalize the entire scaffold
 * @param scaffold - Raw scaffold data
 * @returns Normalized scaffold
 */
export function normalizeScaffold(scaffold: any): any {
  return {
    ...scaffold,
    screen: {
      ...scaffold.screen,
      root: normalizeNode(scaffold.screen.root),
    },
  };
}
