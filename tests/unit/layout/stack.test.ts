import { describe, it, expect } from 'vitest';
import { layoutStackVertical, layoutStackHorizontal, layoutStackHorizontalWrap, type LayoutContext } from '../../../src/core/layout/stack.js';
import type { StackNode } from '../../../src/types/node.js';

describe('layoutStackVertical', () => {
  it('should layout children vertically with gap', () => {
    const node: StackNode = {
      id: 'stack1',
      type: 'Stack',
      direction: 'vertical',
      gap: 8,
      padding: 16,
      children: [
        { id: 'child1', type: 'Text', text: 'First' },
        { id: 'child2', type: 'Text', text: 'Second' },
        { id: 'child3', type: 'Text', text: 'Third' },
      ],
    };

    const ctx: LayoutContext = {
      x: 0,
      y: 0,
      w: 320,
      h: 640,
      contentW: 320,
      contentH: 640,
      spacingScale: [0, 4, 8, 12, 16, 24, 32],
      issues: [],
    };

    const measureChild = () => ({ w: 100, h: 20 });

    const result = layoutStackVertical(node, ctx, measureChild);

    expect(result.frames).toHaveLength(3);
    
    // First child at padding offset
    expect(result.frames[0]).toMatchObject({
      id: 'child1',
      x: 16, // padding
      y: 16, // padding
      h: 20,
    });

    // Second child below first with gap
    expect(result.frames[1]).toMatchObject({
      id: 'child2',
      x: 16,
      y: 44, // 16 + 20 + 8
      h: 20,
    });

    // Third child
    expect(result.frames[2]).toMatchObject({
      id: 'child3',
      x: 16,
      y: 72, // 44 + 20 + 8
      h: 20,
    });

    // Container height = (y - gap + padding) - container.y = (72 + 20 + 16) - 0 = 108
    expect(result.containerHeight).toBe(108);
  });

  it('should align children to center', () => {
    const node: StackNode = {
      id: 'stack2',
      type: 'Stack',
      direction: 'vertical',
      align: 'center',
      padding: 0,
      children: [
        { id: 'child1', type: 'Text', text: 'Centered' },
      ],
    };

    const ctx: LayoutContext = {
      x: 0,
      y: 0,
      w: 320,
      h: 640,
      contentW: 320,
      contentH: 640,
      spacingScale: [0, 4, 8, 12, 16],
      issues: [],
    };

    const measureChild = () => ({ w: 100, h: 20 });

    const result = layoutStackVertical(node, ctx, measureChild);

    // contentW = 320, childW = 100
    // center: x + (contentW - childW)/2 = 0 + (320 - 100)/2 = 110
    expect(result.frames[0].x).toBe(110);
  });

  it('should stretch children when align is stretch', () => {
    const node: StackNode = {
      id: 'stack3',
      type: 'Stack',
      direction: 'vertical',
      align: 'stretch',
      padding: 0,
      children: [
        { id: 'child1', type: 'Text', text: 'Stretched', widthPolicy: 'hug' },
      ],
    };

    const ctx: LayoutContext = {
      x: 0,
      y: 0,
      w: 320,
      h: 640,
      contentW: 320,
      contentH: 640,
      spacingScale: [0],
      issues: [],
    };

    const measureChild = () => ({ w: 100, h: 20 });

    const result = layoutStackVertical(node, ctx, measureChild);

    // Should stretch to contentW
    expect(result.frames[0].w).toBe(320);
  });

  it('should warn for spacing not in scale', () => {
    const node: StackNode = {
      id: 'stack4',
      type: 'Stack',
      direction: 'vertical',
      gap: 13, // Not in scale
      padding: 0,
      children: [],
    };

    const ctx: LayoutContext = {
      x: 0,
      y: 0,
      w: 320,
      h: 640,
      contentW: 320,
      contentH: 640,
      spacingScale: [0, 8, 16, 24],
      issues: [],
    };

    const measureChild = () => ({ w: 0, h: 0 });

    layoutStackVertical(node, ctx, measureChild);

    expect(ctx.issues).toHaveLength(1);
    expect(ctx.issues[0].id).toContain('spacing-off-scale');
    expect(ctx.issues[0].severity).toBe('warn');
  });
});

describe('layoutStackHorizontal', () => {
  it('should layout children horizontally with gap', () => {
    const node: StackNode = {
      id: 'hstack1',
      type: 'Stack',
      direction: 'horizontal',
      gap: 8,
      padding: 16,
      wrap: false,
      children: [
        { id: 'child1', type: 'Button', text: 'First' },
        { id: 'child2', type: 'Button', text: 'Second' },
      ],
    };

    const ctx: LayoutContext = {
      x: 0,
      y: 0,
      w: 320,
      h: 640,
      contentW: 320,
      contentH: 640,
      spacingScale: [0, 8, 16],
      issues: [],
    };

    const measureChild = () => ({ w: 80, h: 44 });

    const result = layoutStackHorizontal(node, ctx, measureChild);

    expect(result.frames).toHaveLength(2);
    
    // First child
    expect(result.frames[0]).toMatchObject({
      id: 'child1',
      x: 16, // padding
      y: 16, // padding
      w: 80,
      h: 44,
    });

    // Second child
    expect(result.frames[1]).toMatchObject({
      id: 'child2',
      x: 104, // 16 + 80 + 8
      y: 16,
      w: 80,
      h: 44,
    });

    // Container height = maxHeight + 2*padding = 44 + 32 = 76
    expect(result.containerHeight).toBe(76);
  });

  it('should detect overflow-x when child exceeds container width', () => {
    const node: StackNode = {
      id: 'hstack2',
      type: 'Stack',
      direction: 'horizontal',
      gap: 0,
      padding: 0,
      wrap: false,
      children: [
        { id: 'child1', type: 'Button', text: 'Wide' },
        { id: 'child2', type: 'Button', text: 'Button' },
      ],
    };

    const ctx: LayoutContext = {
      x: 0,
      y: 0,
      w: 150, // Too narrow
      h: 640,
      contentW: 150,
      contentH: 640,
      spacingScale: [0],
      issues: [],
    };

    const measureChild = () => ({ w: 100, h: 44 });

    layoutStackHorizontal(node, ctx, measureChild);

    // Second child at x=100 with w=100 exceeds container w=150
    expect(ctx.issues.length).toBeGreaterThan(0);
    expect(ctx.issues.some(i => i.id.includes('overflow-x'))).toBe(true);
  });
});

describe('layoutStackHorizontalWrap', () => {
  it('should wrap children to next row when needed', () => {
    const node: StackNode = {
      id: 'wrapstack1',
      type: 'Stack',
      direction: 'horizontal',
      wrap: true,
      gap: 8,
      padding: 16,
      children: [
        { id: 'child1', type: 'Button', text: '1' },
        { id: 'child2', type: 'Button', text: '2' },
        { id: 'child3', type: 'Button', text: '3' },
        { id: 'child4', type: 'Button', text: '4' },
      ],
    };

    const ctx: LayoutContext = {
      x: 0,
      y: 0,
      w: 200, // Can fit 2 buttons per row (80 + 8 + 80 + 32 padding = 200)
      h: 640,
      contentW: 200,
      contentH: 640,
      spacingScale: [0, 8, 16],
      issues: [],
    };

    const measureChild = () => ({ w: 80, h: 44 });

    const result = layoutStackHorizontalWrap(node, ctx, measureChild);

    expect(result.frames).toHaveLength(4);
    
    // First row
    expect(result.frames[0].y).toBe(16);
    expect(result.frames[1].y).toBe(16);
    
    // Second row (wraps after 2nd child)
    expect(result.frames[2].y).toBe(68); // 16 + 44 + 8
    expect(result.frames[3].y).toBe(68);

    // Container height includes both rows
    expect(result.containerHeight).toBeGreaterThan(100);
  });

  it('should handle empty children', () => {
    const node: StackNode = {
      id: 'empty',
      type: 'Stack',
      direction: 'vertical',
      children: [],
    };

    const ctx: LayoutContext = {
      x: 0,
      y: 0,
      w: 320,
      h: 640,
      contentW: 320,
      contentH: 640,
      spacingScale: [0],
      issues: [],
    };

    const measureChild = () => ({ w: 0, h: 0 });

    const result = layoutStackVertical(node, ctx, measureChild);

    expect(result.frames).toHaveLength(0);
    expect(result.containerHeight).toBe(0);
  });
});
