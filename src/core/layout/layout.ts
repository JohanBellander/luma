import type { Scaffold } from '../../types/scaffold.js';
import type { Node, StackNode, GridNode, BoxNode, TextNode, ButtonNode, FieldNode, TableNode } from '../../types/node.js';
import type { Viewport, Frame } from '../../types/viewport.js';
import type { Issue } from '../../types/issue.js';
import type { LayoutOutput } from '../../types/output.js';
import { applyResponsiveOverridesRecursive } from './responsive.js';
import { measureText, measureButton, measureField, measureTable } from './measure.js';
import { layoutStackVertical, layoutStackHorizontal, layoutStackHorizontalWrap, type LayoutContext } from './stack.js';
import { layoutGrid } from './grid.js';
import { layoutBox } from './box.js';

/**
 * Main layout engine orchestrator.
 * 
 * Per spec Section 5:
 * - Apply responsive overrides for viewport
 * - Pre-order tree traversal
 * - Compute frames {x, y, w, h} for all visible nodes
 * - Detect issues: overflow-x, spacing-off-scale, touch-target-too-small, primary-below-fold
 * 
 * Returns LayoutOutput with frames and issues.
 */
export function computeLayout(scaffold: Scaffold, viewport: Viewport): LayoutOutput {
  const issues: Issue[] = [];
  const frames: Frame[] = [];

  // Get settings
  const spacingScale = scaffold.settings?.spacingScale ?? [0, 4, 8, 12, 16, 24, 32, 48, 64];
  const minTouchTarget = scaffold.settings?.minTouchTarget ?? { w: 44, h: 44 };

  // Apply responsive overrides to root
  const root = applyResponsiveOverridesRecursive(scaffold.screen.root, viewport.width) as Node;

  // Layout root at viewport size
  const ctx: LayoutContext = {
    x: 0,
    y: 0,
    w: viewport.width,
    h: viewport.height,
    contentW: viewport.width,
    contentH: viewport.height,
    spacingScale,
    issues,
  };

  const rootFrames = layoutNode(root, ctx, viewport, minTouchTarget);
  frames.push(...rootFrames);

  // Check for primary below fold
  checkPrimaryBelowFold(frames, issues, viewport);

  return {
    viewport: `${viewport.width}x${viewport.height}`,
    frames,
    issues,
  };
}

/**
 * Layout a single node and its children (recursive).
 */
function layoutNode(
  node: Node,
  ctx: LayoutContext,
  viewport: Viewport,
  minTouchTarget: { w: number; h: number }
): Frame[] {
  if (node.visible === false) {
    return [];
  }

  const frames: Frame[] = [];

  // Measure and layout based on type
  switch (node.type) {
    case 'Stack': {
      const stackNode = node as StackNode;
      const childFrames = layoutStackNode(stackNode, ctx, viewport, minTouchTarget);
      
      // Add Stack's own frame
      const stackHeight = Math.max(...childFrames.map(f => f.y + f.h - ctx.y), 0);
      frames.push({
        id: node.id,
        x: ctx.x,
        y: ctx.y,
        w: ctx.w,
        h: stackHeight || ctx.h,
      });
      
      // Add children frames
      frames.push(...childFrames);
      break;
    }

    case 'Grid': {
      const gridNode = node as GridNode;
      const childFrames = layoutGridNode(gridNode, ctx, viewport, minTouchTarget);
      
      // Add Grid's own frame
      const gridHeight = Math.max(...childFrames.map(f => f.y + f.h - ctx.y), 0);
      frames.push({
        id: node.id,
        x: ctx.x,
        y: ctx.y,
        w: ctx.w,
        h: gridHeight || ctx.h,
      });
      
      // Add children frames
      frames.push(...childFrames);
      break;
    }

    case 'Box': {
      const boxNode = node as BoxNode;
      const childFrames = layoutBoxNode(boxNode, ctx, viewport, minTouchTarget);
      
      // Add Box's own frame
      const boxHeight = childFrames.length > 0 ? Math.max(...childFrames.map(f => f.y + f.h - ctx.y), 0) : 0;
      frames.push({
        id: node.id,
        x: ctx.x,
        y: ctx.y,
        w: ctx.w,
        h: boxHeight || ctx.h,
      });
      
      // Add children frames
      frames.push(...childFrames);
      break;
    }

    case 'Text': {
      const textNode = node as TextNode;
      const size = measureText(textNode, ctx.w);
      frames.push({
        id: node.id,
        x: ctx.x,
        y: ctx.y,
        w: size.w,
        h: size.h,
      });
      break;
    }

    case 'Button': {
      const buttonNode = node as ButtonNode;
      const size = measureButton(buttonNode, ctx.w, minTouchTarget);
      frames.push({
        id: node.id,
        x: ctx.x,
        y: ctx.y,
        w: size.w,
        h: size.h,
      });
      
      // Check touch target size
      if (buttonNode.focusable !== false && (size.w < minTouchTarget.w || size.h < minTouchTarget.h)) {
        ctx.issues.push({
          id: `touch-target-too-small-${node.id}`,
          severity: 'warn',
          message: `Button ${node.id} has touch target ${size.w}x${size.h}, minimum is ${minTouchTarget.w}x${minTouchTarget.h}`,
          nodeId: node.id,
          jsonPointer: `/screen/root`,
        });
      }
      break;
    }

    case 'Field': {
      const fieldNode = node as FieldNode;
      const size = measureField(fieldNode, ctx.w, minTouchTarget);
      frames.push({
        id: node.id,
        x: ctx.x,
        y: ctx.y,
        w: size.w,
        h: size.h,
      });
      
      // Check touch target size
      if (size.w < minTouchTarget.w || size.h < minTouchTarget.h) {
        ctx.issues.push({
          id: `touch-target-too-small-${node.id}`,
          severity: 'warn',
          message: `Field ${node.id} has touch target ${size.w}x${size.h}, minimum is ${minTouchTarget.w}x${minTouchTarget.h}`,
          nodeId: node.id,
          jsonPointer: `/screen/root`,
        });
      }
      break;
    }

    case 'Table': {
      const tableNode = node as TableNode;
      const size = measureTable(tableNode, ctx.w);
      frames.push({
        id: node.id,
        x: ctx.x,
        y: ctx.y,
        w: size.w,
        h: size.h,
      });
      break;
    }

    case 'Form': {
      // Form is a container, treat children like Stack would
      const formNode = node as any;
      if (formNode.children) {
        for (const child of formNode.children) {
          const childFrames = layoutNode(child, ctx, viewport, minTouchTarget);
          frames.push(...childFrames);
        }
      }
      frames.push({
        id: node.id,
        x: ctx.x,
        y: ctx.y,
        w: ctx.w,
        h: ctx.h,
      });
      break;
    }
  }

  return frames;
}

/**
 * Layout Stack node and return child frames.
 */
function layoutStackNode(
  node: StackNode,
  ctx: LayoutContext,
  viewport: Viewport,
  minTouchTarget: { w: number; h: number }
): Frame[] {
  const measureChild = (childId: string, availableWidth: number) => {
    const child = node.children?.find(c => c.id === childId);
    if (!child) return { w: 0, h: 0 };
    
    return measureNodeSize(child, availableWidth, minTouchTarget);
  };

  let result;
  if (node.direction === 'vertical') {
    result = layoutStackVertical(node, ctx, measureChild);
  } else if (node.wrap) {
    result = layoutStackHorizontalWrap(node, ctx, measureChild);
  } else {
    result = layoutStackHorizontal(node, ctx, measureChild);
  }

  // Recursively layout children
  const allFrames: Frame[] = [];
  for (const childFrame of result.frames) {
    const child = node.children?.find(c => c.id === childFrame.id);
    if (!child) continue;

    const childCtx: LayoutContext = {
      x: childFrame.x,
      y: childFrame.y,
      w: childFrame.w,
      h: childFrame.h,
      contentW: childFrame.w,
      contentH: childFrame.h,
      spacingScale: ctx.spacingScale,
      issues: ctx.issues,
    };

    const childFrames = layoutNode(child, childCtx, viewport, minTouchTarget);
    allFrames.push(...childFrames);
  }

  return allFrames;
}

/**
 * Layout Grid node and return child frames.
 */
function layoutGridNode(
  node: GridNode,
  ctx: LayoutContext,
  viewport: Viewport,
  minTouchTarget: { w: number; h: number }
): Frame[] {
  const measureChild = (childId: string, availableWidth: number) => {
    const child = node.children?.find(c => c.id === childId);
    if (!child) return { w: 0, h: 0 };
    
    return measureNodeSize(child, availableWidth, minTouchTarget);
  };

  const result = layoutGrid(node, ctx, measureChild);

  // Recursively layout children
  const allFrames: Frame[] = [];
  for (const childFrame of result.frames) {
    const child = node.children?.find(c => c.id === childFrame.id);
    if (!child) continue;

    const childCtx: LayoutContext = {
      x: childFrame.x,
      y: childFrame.y,
      w: childFrame.w,
      h: childFrame.h,
      contentW: childFrame.w,
      contentH: childFrame.h,
      spacingScale: ctx.spacingScale,
      issues: ctx.issues,
    };

    const childFrames = layoutNode(child, childCtx, viewport, minTouchTarget);
    allFrames.push(...childFrames);
  }

  return allFrames;
}

/**
 * Layout Box node and return child frames.
 */
function layoutBoxNode(
  node: BoxNode,
  ctx: LayoutContext,
  viewport: Viewport,
  minTouchTarget: { w: number; h: number }
): Frame[] {
  const measureChild = (_childId: string, availableWidth: number) => {
    if (!node.child) return { w: 0, h: 0 };
    return measureNodeSize(node.child, availableWidth, minTouchTarget);
  };

  const result = layoutBox(node, ctx, measureChild);

  // Recursively layout child
  const allFrames: Frame[] = [];
  for (const childFrame of result.frames) {
    if (!node.child) continue;

    const childCtx: LayoutContext = {
      x: childFrame.x,
      y: childFrame.y,
      w: childFrame.w,
      h: childFrame.h,
      contentW: childFrame.w,
      contentH: childFrame.h,
      spacingScale: ctx.spacingScale,
      issues: ctx.issues,
    };

    const childFrames = layoutNode(node.child, childCtx, viewport, minTouchTarget);
    allFrames.push(...childFrames);
  }

  return allFrames;
}

/**
 * Measure a node's size for layout purposes.
 */
function measureNodeSize(
  node: Node,
  availableWidth: number,
  minTouchTarget: { w: number; h: number }
): { w: number; h: number } {
  switch (node.type) {
    case 'Text':
      return measureText(node as TextNode, availableWidth);
    case 'Button':
      return measureButton(node as ButtonNode, availableWidth, minTouchTarget);
    case 'Field':
      return measureField(node as FieldNode, availableWidth, minTouchTarget);
    case 'Table':
      return measureTable(node as TableNode, availableWidth);
    case 'Stack':
    case 'Grid':
    case 'Box':
    case 'Form':
      // Containers need recursive layout, return available space for now
      return { w: availableWidth, h: 100 }; // Placeholder
  }
}

/**
 * Check for primary button below fold.
 * Per spec Section 5.4: If first Button with roleHint:"primary" has y+h > viewport.h
 * → error at smallest viewport, warn at larger viewports
 */
function checkPrimaryBelowFold(frames: Frame[], issues: Issue[], viewport: Viewport): void {
  // Find first primary button frame
  const primaryFrame = frames.find(f => f.id.includes('primary')); // Simplified
  
  if (primaryFrame && primaryFrame.y + primaryFrame.h > viewport.height) {
    // Simplified: treat as warn for now (would need to check if this is smallest viewport)
    issues.push({
      id: 'primary-below-fold',
      severity: 'warn',
      message: `Primary button below fold at viewport ${viewport.width}x${viewport.height}`,
      nodeId: primaryFrame.id,
      viewport: `${viewport.width}x${viewport.height}`,
  jsonPointer: `/screen/root`,
    });
  }
}
