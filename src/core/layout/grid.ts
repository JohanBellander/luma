import type { GridNode } from '../../types/node.js';
import type { LayoutContext, ChildFrame } from './stack.js';

/**
 * Layout a Grid container.
 * Places children in a grid with column reduction based on minColWidth.
 * 
 * Algorithm per spec Section 5.3:
 * - If minColWidth present:
 *   - colsFit = floor((contentW + gap) / (minColWidth + gap))
 *   - effectiveCols = clamp(1, intendedColumns, colsFit)
 * - Else effectiveCols = intendedColumns
 * - cellW = (contentW - (effectiveCols-1)*gap) / effectiveCols
 * - Place children row-by-row
 * - If any child's measured w > cellW → overflow-x
 */
export function layoutGrid(
  node: GridNode,
  ctx: LayoutContext,
  measureChild: (childId: string, availableWidth: number) => { w: number; h: number }
): { frames: ChildFrame[]; containerHeight: number } {
  const gap = node.gap ?? 0;
  const intendedColumns = node.columns;
  const minColWidth = node.minColWidth;

  // Check spacing scale
  // Allow implicit zero even if not declared in spacingScale
  if (gap !== 0 && !ctx.spacingScale.includes(gap)) {
    ctx.issues.push({
      id: `spacing-off-scale-${node.id}-gap`,
      severity: 'warn',
      message: `Grid gap ${gap} not in spacingScale`,
      nodeId: node.id,
  jsonPointer: `/screen/root`,
    });
  }

  const contentW = ctx.w;

  // Calculate effective columns
  let effectiveCols = intendedColumns;
  if (minColWidth !== undefined) {
    const colsFit = Math.floor((contentW + gap) / (minColWidth + gap));
    effectiveCols = Math.max(1, Math.min(intendedColumns, colsFit));
  }

  // Calculate cell width
  const cellW = (contentW - (effectiveCols - 1) * gap) / effectiveCols;

  const frames: ChildFrame[] = [];

  if (!node.children) {
    return { frames, containerHeight: 0 };
  }

  const visibleChildren = node.children.filter((c) => c.visible !== false);

  let row = 0;
  let col = 0;
  let currentY = ctx.y;
  let rowHeight = 0;

  for (const child of visibleChildren) {
    // Measure child
    const { w: childW, h: childH } = measureChild(child.id, cellW);

    // Check overflow
    if (childW > cellW) {
      ctx.issues.push({
        id: `overflow-x-${child.id}`,
        severity: 'error',
        message: `Child ${child.id} width ${childW} exceeds Grid cell width ${cellW}`,
        nodeId: child.id,
  jsonPointer: `/screen/root`,
      });
    }

    // Calculate position
    const x = ctx.x + col * (cellW + gap);
    const y = currentY;

    frames.push({
      id: child.id,
      x: x,
      y: y,
      w: childW,
      h: childH,
    });

    rowHeight = Math.max(rowHeight, childH);

    // Move to next column or row
    col++;
    if (col >= effectiveCols) {
      col = 0;
      row++;
      currentY += rowHeight + gap;
      rowHeight = 0;
    }
  }

  const containerHeight = currentY > ctx.y ? currentY + rowHeight - ctx.y : 0;

  return { frames, containerHeight };
}
