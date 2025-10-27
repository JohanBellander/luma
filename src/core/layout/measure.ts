/**
 * Measurement primitives for LUMA layout engine
 * Implements spec Section 5.2
 */

import type { TextNode, ButtonNode, FieldNode, TableNode } from '../../types/node.js';
import type { MinTouchTarget } from '../../types/scaffold.js';

export interface Size {
  w: number;
  h: number;
}

/**
 * Measure a Text node
 * Per spec: fontSize * 0.55 * charCount for single line width
 * Line height: fontSize * 1.4
 */
export function measureText(node: TextNode, availableWidth: number): Size {
  const fontSize = node.fontSize ?? 16;
  const charCount = node.text.length;

  // Use intrinsic width if provided
  if (node.intrinsicTextWidth !== undefined) {
    const singleLine = node.intrinsicTextWidth;
    
    if (availableWidth < singleLine) {
      const lines = Math.ceil(singleLine / availableWidth);
      return {
        w: Math.min(singleLine, availableWidth),
        h: lines * fontSize * 1.4,
      };
    }
    
    return {
      w: singleLine,
      h: fontSize * 1.4,
    };
  }

  // Estimate single-line width
  const singleLine = fontSize * 0.55 * charCount;

  if (availableWidth < singleLine) {
    const lines = Math.ceil(singleLine / availableWidth);
    return {
      w: Math.min(singleLine, availableWidth),
      h: lines * fontSize * 1.4,
    };
  }

  return {
    w: singleLine,
    h: fontSize * 1.4,
  };
}

/**
 * Measure a Button node
 * Per spec:
 * - Width: hug = min(textWidth + 24, contentWidth); fill = contentWidth; fixed = respect min/max
 * - Height: hug = at least minTouchTarget.h (default 44); fixed = respect min/max
 */
export function measureButton(
  node: ButtonNode,
  availableWidth: number,
  minTouchTarget: MinTouchTarget
): Size {
  let width: number;
  let height: number;

  // Calculate text width if text exists
  const fontSize = 16; // Default font size for button text
  const textWidth = node.text ? fontSize * 0.55 * node.text.length : 0;

  // Width calculation (default is "hug")
  const widthPolicy = node.widthPolicy ?? 'hug';
  if (widthPolicy === 'fill') {
    width = availableWidth;
  } else if (widthPolicy === 'hug') {
    width = Math.min(textWidth + 24, availableWidth);
  } else {
    // fixed
    width = node.minSize?.w ?? textWidth + 24;
  }

  // Apply min/max constraints
  if (node.minSize?.w !== undefined) {
    width = Math.max(width, node.minSize.w);
  }
  if (node.maxSize?.w !== undefined) {
    width = Math.min(width, node.maxSize.w);
  }

  // Enforce minimum touch target
  width = Math.max(width, minTouchTarget.w);

  // Height calculation (default is "hug")
  const heightPolicy = node.heightPolicy ?? 'hug';
  if (heightPolicy === 'hug') {
    height = Math.max(minTouchTarget.h, node.minSize?.h ?? 0);
  } else if (heightPolicy === 'fill') {
    height = minTouchTarget.h; // Default height for buttons
  } else {
    // fixed
    height = node.minSize?.h ?? minTouchTarget.h;
  }

  // Apply min/max constraints
  if (node.minSize?.h !== undefined) {
    height = Math.max(height, node.minSize.h);
  }
  if (node.maxSize?.h !== undefined) {
    height = Math.min(height, node.maxSize.h);
  }

  return { w: width, h: height };
}

/**
 * Measure a Field node
 * Similar to Button measurement
 */
export function measureField(
  node: FieldNode,
  availableWidth: number,
  minTouchTarget: MinTouchTarget
): Size {
  let width: number;
  let height: number;

  // Calculate label width
  const labelWidth = (16) * 0.55 * node.label.length; // Default font size for labels

  // Width calculation (default is "hug")
  const widthPolicy = node.widthPolicy ?? 'hug';
  if (widthPolicy === 'fill') {
    width = availableWidth;
  } else if (widthPolicy === 'hug') {
    width = Math.min(labelWidth + 24, availableWidth);
  } else {
    // fixed
    width = node.minSize?.w ?? labelWidth + 24;
  }

  // Apply min/max constraints
  if (node.minSize?.w !== undefined) {
    width = Math.max(width, node.minSize.w);
  }
  if (node.maxSize?.w !== undefined) {
    width = Math.min(width, node.maxSize.w);
  }

  // Enforce minimum touch target
  width = Math.max(width, minTouchTarget.w);

  // Height calculation - fields need touch target height (default is "hug")
  const heightPolicy = node.heightPolicy ?? 'hug';
  if (heightPolicy === 'hug') {
    height = Math.max(minTouchTarget.h, node.minSize?.h ?? 0);
  } else if (heightPolicy === 'fill') {
    height = minTouchTarget.h;
  } else {
    // fixed
    height = node.minSize?.h ?? minTouchTarget.h;
  }

  // Apply min/max constraints
  if (node.minSize?.h !== undefined) {
    height = Math.max(height, node.minSize.h);
  }
  if (node.maxSize?.h !== undefined) {
    height = Math.min(height, node.maxSize.h);
  }

  return { w: width, h: height };
}

/**
 * Measure a Table node
 * Per spec: header=48 + rowHeight*rows where rowHeight=40, default rows=5
 */
export function measureTable(node: TableNode, availableWidth: number): Size {
  const rows = node.rows ?? 5;
  const headerHeight = 48;
  const rowHeight = 40;

  const width = availableWidth; // Tables fill by default
  const height = headerHeight + rowHeight * rows;

  return { w: width, h: height };
}
