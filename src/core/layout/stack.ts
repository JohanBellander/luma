import type { StackNode } from '../../types/node.js';
import type { Issue } from '../../types/issue.js';

export interface LayoutContext {
  x: number;
  y: number;
  w: number;
  h: number;
  contentW: number;
  contentH: number;
  spacingScale: number[];
  issues: Issue[];
}

export interface ChildFrame {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Layout a vertical Stack container.
 * Places children top-to-bottom with gap spacing.
 * 
 * Algorithm per spec Section 5.3:
 * - contentW = container.w - 2*padding
 * - Start at (x = container.x + padding, y = container.y + padding)
 * - For each visible child:
 *   1. Measure child w,h using policies & contentW
 *   2. Apply horizontal alignment (start, center, end, stretch)
 *   3. Set child.y = y
 *   4. y += child.h + gap
 * - Container h = (y - gap + padding) - container.y
 */
export function layoutStackVertical(
  node: StackNode,
  ctx: LayoutContext,
  measureChild: (childId: string, availableWidth: number) => { w: number; h: number }
): { frames: ChildFrame[]; containerHeight: number } {
  const padding = node.padding ?? 0;
  const gap = node.gap ?? 0;
  const align = node.align ?? 'start';

  // Check spacing scale
  if (!ctx.spacingScale.includes(padding)) {
    ctx.issues.push({
      id: `spacing-off-scale-${node.id}-padding`,
      severity: 'warn',
      message: `Stack padding ${padding} not in spacingScale`,
      nodeId: node.id,
  jsonPointer: `/screen/root`, // Simplified for now
    });
  }
  if (gap !== 0 && !ctx.spacingScale.includes(gap)) {
    ctx.issues.push({
      id: `spacing-off-scale-${node.id}-gap`,
      severity: 'warn',
      message: `Stack gap ${gap} not in spacingScale`,
      nodeId: node.id,
  jsonPointer: `/screen/root`,
    });
  }

  const contentW = ctx.w - 2 * padding;
  let x = ctx.x + padding;
  let y = ctx.y + padding;

  const frames: ChildFrame[] = [];

  if (!node.children) {
    return { frames, containerHeight: 2 * padding };
  }

  for (const child of node.children) {
    if (child.visible === false) continue;

    // Measure child
    const { w: childW, h: childH } = measureChild(child.id, contentW);

    // Apply horizontal alignment
    let childX = x;
    let finalW = childW;

    if (align === 'stretch' && child.widthPolicy !== 'fixed') {
      finalW = contentW;
      childX = x;
    } else if (align === 'center') {
      childX = x + (contentW - childW) / 2;
    } else if (align === 'end') {
      childX = x + (contentW - childW);
    } // 'start' is default (childX = x)

    frames.push({
      id: child.id,
      x: childX,
      y: y,
      w: finalW,
      h: childH,
    });

    y += childH + gap;
  }

  // Container height = (y - gap + padding) - container.y
  const containerHeight = frames.length > 0 ? y - gap + padding - ctx.y : 2 * padding;

  return { frames, containerHeight };
}

/**
 * Layout a horizontal Stack container without wrapping.
 * Places children left-to-right with gap spacing.
 * 
 * Algorithm per spec Section 5.3:
 * - Place left-to-right with gap
 * - If child.x + child.w > container.x + container.w → overflow-x (error)
 */
export function layoutStackHorizontal(
  node: StackNode,
  ctx: LayoutContext,
  measureChild: (childId: string, availableWidth: number) => { w: number; h: number }
): { frames: ChildFrame[]; containerHeight: number } {
  const padding = node.padding ?? 0;
  const gap = node.gap ?? 0;
  const align = node.align ?? 'start';

  // Check spacing scale
  if (!ctx.spacingScale.includes(padding)) {
    ctx.issues.push({
      id: `spacing-off-scale-${node.id}-padding`,
      severity: 'warn',
      message: `Stack padding ${padding} not in spacingScale`,
      nodeId: node.id,
  jsonPointer: `/screen/root`,
    });
  }
  if (gap !== 0 && !ctx.spacingScale.includes(gap)) {
    ctx.issues.push({
      id: `spacing-off-scale-${node.id}-gap`,
      severity: 'warn',
      message: `Stack gap ${gap} not in spacingScale`,
      nodeId: node.id,
  jsonPointer: `/screen/root`,
    });
  }

  const contentW = ctx.w - 2 * padding;
  let x = ctx.x + padding;
  const y = ctx.y + padding;

  const frames: ChildFrame[] = [];
  let maxHeight = 0;

  if (!node.children) {
    return { frames, containerHeight: 2 * padding };
  }

  for (const child of node.children) {
    if (child.visible === false) continue;

    // Measure child with available width
    const { w: childW, h: childH } = measureChild(child.id, contentW);

    // Check overflow
    if (x + childW > ctx.x + ctx.w) {
      ctx.issues.push({
        id: `overflow-x-${child.id}`,
        severity: 'error',
        message: `Child ${child.id} overflows horizontal Stack container`,
        nodeId: child.id,
  jsonPointer: `/screen/root`,
      });
    }

    // Apply vertical alignment
    let childY = y;
    if (align === 'center') {
      // Center vertically (will need maxHeight, simplified for now)
      childY = y;
    } else if (align === 'end') {
      // Align to bottom (simplified)
      childY = y;
    } // 'start' is default

    frames.push({
      id: child.id,
      x: x,
      y: childY,
      w: childW,
      h: childH,
    });

    maxHeight = Math.max(maxHeight, childH);
    x += childW + gap;
  }

  const containerHeight = maxHeight + 2 * padding;

  return { frames, containerHeight };
}

/**
 * Layout a horizontal Stack container with wrapping.
 * Places children left-to-right, wrapping to next row when needed.
 * 
 * Algorithm per spec Section 5.3:
 * - Track row height
 * - Wrap to next row when next child would exceed content width
 * - Update container h accordingly
 */
export function layoutStackHorizontalWrap(
  node: StackNode,
  ctx: LayoutContext,
  measureChild: (childId: string, availableWidth: number) => { w: number; h: number }
): { frames: ChildFrame[]; containerHeight: number } {
  const padding = node.padding ?? 0;
  const gap = node.gap ?? 0;

  // Check spacing scale
  if (!ctx.spacingScale.includes(padding)) {
    ctx.issues.push({
      id: `spacing-off-scale-${node.id}-padding`,
      severity: 'warn',
      message: `Stack padding ${padding} not in spacingScale`,
      nodeId: node.id,
  jsonPointer: `/screen/root`,
    });
  }
  if (gap !== 0 && !ctx.spacingScale.includes(gap)) {
    ctx.issues.push({
      id: `spacing-off-scale-${node.id}-gap`,
      severity: 'warn',
      message: `Stack gap ${gap} not in spacingScale`,
      nodeId: node.id,
  jsonPointer: `/screen/root`,
    });
  }

  const contentW = ctx.w - 2 * padding;
  let x = ctx.x + padding;
  let y = ctx.y + padding;

  const frames: ChildFrame[] = [];
  let rowHeight = 0;

  if (!node.children) {
    return { frames, containerHeight: 2 * padding };
  }

  for (const child of node.children) {
    if (child.visible === false) continue;

    // Measure child
    const { w: childW, h: childH } = measureChild(child.id, contentW);

    // Check if we need to wrap
    if (frames.length > 0 && x + childW > ctx.x + ctx.w) {
      // Wrap to next row
      x = ctx.x + padding;
      y += rowHeight + gap;
      rowHeight = 0;
    }

    frames.push({
      id: child.id,
      x: x,
      y: y,
      w: childW,
      h: childH,
    });

    rowHeight = Math.max(rowHeight, childH);
    x += childW + gap;
  }

  // Container height includes last row
  const containerHeight = frames.length > 0 ? y + rowHeight + padding - ctx.y : 2 * padding;

  return { frames, containerHeight };
}
