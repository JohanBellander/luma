import { describe, it, expect } from 'vitest';
import { layoutStackVertical } from '../../../src/core/layout/stack.js';
import { layoutBox } from '../../../src/core/layout/box.js';
import { layoutGrid } from '../../../src/core/layout/grid.js';
import type { StackNode, BoxNode, GridNode } from '../../../src/types/node.js';
import type { LayoutContext } from '../../../src/core/layout/stack.js';

// These tests verify LUMA-113: allowing implicit 0 spacing values even if 0 not present in spacingScale

describe('spacing scale implicit zero (LUMA-113)', () => {
  it('should not warn when stack padding/gap are 0 and 0 not in spacingScale', () => {
    const node: StackNode = {
      id: 'stack-zero',
      type: 'Stack',
      direction: 'vertical',
      padding: 0,
      gap: 0,
      children: [ { id: 'child1', type: 'Text', text: 'Hi' } ],
    };
    const ctx: LayoutContext = {
      x: 0, y: 0, w: 200, h: 200, contentW: 200, contentH: 200,
      spacingScale: [4,8,12], // 0 omitted intentionally
      issues: [],
    };
    const measureChild = () => ({ w: 100, h: 20 });
    layoutStackVertical(node, ctx, measureChild);
    expect(ctx.issues.some(i => i.id.includes('spacing-off-scale'))).toBe(false);
  });

  it('should not warn when box padding is 0 and 0 not in spacingScale', () => {
    const node: BoxNode = {
      id: 'box-zero',
      type: 'Box',
      padding: 0,
      child: { id: 'child1', type: 'Text', text: 'Hi' }
    };
    const ctx: LayoutContext = {
      x: 0, y: 0, w: 200, h: 200, contentW: 200, contentH: 200,
      spacingScale: [4,8,12],
      issues: [],
    };
    const measureChild = () => ({ w: 50, h: 10 });
    layoutBox(node, ctx, measureChild);
    expect(ctx.issues.some(i => i.id.includes('spacing-off-scale'))).toBe(false);
  });

  it('should not warn when grid gap is 0 and 0 not in spacingScale', () => {
    const node: GridNode = {
      id: 'grid-zero',
      type: 'Grid',
      columns: 2,
      gap: 0,
      children: [ { id: 'c1', type: 'Text', text: 'A' }, { id: 'c2', type: 'Text', text: 'B' } ]
    };
    const ctx: LayoutContext = {
      x: 0, y: 0, w: 200, h: 200, contentW: 200, contentH: 200,
      spacingScale: [4,8,12],
      issues: [],
    };
    const measureChild = () => ({ w: 50, h: 10 });
    layoutGrid(node, ctx, measureChild);
    expect(ctx.issues.some(i => i.id.includes('spacing-off-scale'))).toBe(false);
  });
});
