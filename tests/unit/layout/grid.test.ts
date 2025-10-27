import { describe, it, expect } from 'vitest';
import { layoutGrid } from '../../../src/core/layout/grid.js';
import type { GridNode } from '../../../src/types/node.js';
import type { LayoutContext } from '../../../src/core/layout/stack.js';

describe('layoutGrid', () => {
  it('should layout children in grid with specified columns', () => {
    const node: GridNode = {
      id: 'grid1',
      type: 'Grid',
      columns: 3,
      gap: 8,
      children: [
        { id: 'cell1', type: 'Text', text: '1' },
        { id: 'cell2', type: 'Text', text: '2' },
        { id: 'cell3', type: 'Text', text: '3' },
        { id: 'cell4', type: 'Text', text: '4' },
        { id: 'cell5', type: 'Text', text: '5' },
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

    const measureChild = () => ({ w: 100, h: 50 });

    const result = layoutGrid(node, ctx, measureChild);

    expect(result.frames).toHaveLength(5);

    // First row (3 cells)
    expect(result.frames[0].y).toBe(0);
    expect(result.frames[1].y).toBe(0);
    expect(result.frames[2].y).toBe(0);

    // Second row (2 cells) - includes gap
    expect(result.frames[3].y).toBe(58); // 50 (rowHeight) + 8 (gap)
    expect(result.frames[4].y).toBe(58);
  });

  it('should reduce columns based on minColWidth', () => {
    const node: GridNode = {
      id: 'grid2',
      type: 'Grid',
      columns: 4, // Intended
      minColWidth: 100,
      gap: 8,
      children: [
        { id: 'cell1', type: 'Text', text: '1' },
        { id: 'cell2', type: 'Text', text: '2' },
        { id: 'cell3', type: 'Text', text: '3' },
      ],
    };

    const ctx: LayoutContext = {
      x: 0,
      y: 0,
      w: 250, // Can only fit 2 columns with gap
      h: 640,
      contentW: 250,
      contentH: 640,
      spacingScale: [0, 8],
      issues: [],
    };

    const measureChild = () => ({ w: 100, h: 50 });

    const result = layoutGrid(node, ctx, measureChild);

    // colsFit = floor((250 + 8) / (100 + 8)) = floor(258 / 108) = 2
    // effectiveCols = clamp(1, 4, 2) = 2
    
    // First row (2 cells)
    expect(result.frames[0].y).toBe(0);
    expect(result.frames[1].y).toBe(0);

    // Second row (1 cell) - includes gap
    expect(result.frames[2].y).toBe(58); // 50 (rowHeight) + 8 (gap)
  });

  it('should calculate cell width correctly', () => {
    const node: GridNode = {
      id: 'grid3',
      type: 'Grid',
      columns: 3,
      gap: 16,
      children: [
        { id: 'cell1', type: 'Text', text: '1' },
      ],
    };

    const ctx: LayoutContext = {
      x: 0,
      y: 0,
      w: 320,
      h: 640,
      contentW: 320,
      contentH: 640,
      spacingScale: [0, 16],
      issues: [],
    };

    let capturedAvailableWidth = 0;
    const measureChild = (_id: string, availableWidth: number) => {
      capturedAvailableWidth = availableWidth;
      return { w: availableWidth, h: 50 };
    };

    layoutGrid(node, ctx, measureChild);

    // cellW = (contentW - (cols-1)*gap) / cols
    // cellW = (320 - 2*16) / 3 = 288 / 3 = 96
    expect(capturedAvailableWidth).toBeCloseTo(96, 1);
  });

  it('should detect overflow-x when child exceeds cell width', () => {
    const node: GridNode = {
      id: 'grid4',
      type: 'Grid',
      columns: 3,
      gap: 8,
      children: [
        { id: 'cell1', type: 'Text', text: 'Too Wide' },
      ],
    };

    const ctx: LayoutContext = {
      x: 0,
      y: 0,
      w: 320,
      h: 640,
      contentW: 320,
      contentH: 640,
      spacingScale: [0, 8],
      issues: [],
    };

    // Child is wider than cell
    const measureChild = () => ({ w: 200, h: 50 });

    layoutGrid(node, ctx, measureChild);

    // cellW = (320 - 2*8) / 3 = 304 / 3 ≈ 101.3
    // childW = 200 > 101.3 → overflow
    expect(ctx.issues.length).toBeGreaterThan(0);
    expect(ctx.issues.some(i => i.id.includes('overflow-x'))).toBe(true);
  });

  it('should handle gap not in spacing scale', () => {
    const node: GridNode = {
      id: 'grid5',
      type: 'Grid',
      columns: 2,
      gap: 13, // Not in scale
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

    layoutGrid(node, ctx, measureChild);

    expect(ctx.issues).toHaveLength(1);
    expect(ctx.issues[0].severity).toBe('warn');
  });

  it('should clamp effective columns to at least 1', () => {
    const node: GridNode = {
      id: 'grid6',
      type: 'Grid',
      columns: 4,
      minColWidth: 400, // Very wide, can't fit even 1
      gap: 8,
      children: [
        { id: 'cell1', type: 'Text', text: '1' },
      ],
    };

    const ctx: LayoutContext = {
      x: 0,
      y: 0,
      w: 320, // Too narrow
      h: 640,
      contentW: 320,
      contentH: 640,
      spacingScale: [0, 8],
      issues: [],
    };

    const measureChild = () => ({ w: 100, h: 50 });

    const result = layoutGrid(node, ctx, measureChild);

    // Should still layout with 1 column
    expect(result.frames).toHaveLength(1);
  });
});
