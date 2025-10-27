import type { BoxNode } from '../../types/node.js';
import type { LayoutContext, ChildFrame } from './stack.js';

/**
 * Layout a Box container.
 * Simple container with padding around a single child.
 * 
 * Algorithm:
 * - contentW = container.w - 2*padding
 * - Place child at (x + padding, y + padding)
 * - Container h = child.h + 2*padding
 */
export function layoutBox(
  node: BoxNode,
  ctx: LayoutContext,
  measureChild: (childId: string, availableWidth: number) => { w: number; h: number }
): { frames: ChildFrame[]; containerHeight: number } {
  const padding = node.padding ?? 0;

  // Check spacing scale
  if (!ctx.spacingScale.includes(padding)) {
    ctx.issues.push({
      id: `spacing-off-scale-${node.id}-padding`,
      severity: 'warn',
      message: `Box padding ${padding} not in spacingScale`,
      nodeId: node.id,
      jsonPointer: `/screens/0/root`,
    });
  }

  const contentW = ctx.w - 2 * padding;
  const frames: ChildFrame[] = [];

  if (!node.child) {
    return { frames, containerHeight: 2 * padding };
  }

  if (node.child.visible === false) {
    return { frames, containerHeight: 2 * padding };
  }

  // Measure and place child
  const { w: childW, h: childH } = measureChild(node.child.id, contentW);

  frames.push({
    id: node.child.id,
    x: ctx.x + padding,
    y: ctx.y + padding,
    w: childW,
    h: childH,
  });

  const containerHeight = childH + 2 * padding;

  return { frames, containerHeight };
}
