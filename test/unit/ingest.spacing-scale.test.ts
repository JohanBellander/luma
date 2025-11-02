import { describe, it, expect } from 'vitest';
import { layoutStackVertical } from '../../src/core/layout/stack.js';
import type { StackNode } from '../../src/types/node.js';

/**
 * Tests for LUMA-114: Adjust spacing scale validation to allow 0.
 * We validate behavior in layout stage where spacingScale warnings are generated.
 */
describe('layout spacingScale validation (LUMA-114)', () => {
  function makeStack(padding: number, gap: number): StackNode {
    return {
      id: 'root',
      type: 'Stack',
      direction: 'vertical',
      padding,
      gap,
      children: [
        { id: 'txt', type: 'Text', text: 'Hello' }
      ]
    } as StackNode;
  }

  function runLayout(stack: StackNode, spacingScale: number[]) {
    const ctx = {
      x: 0,
      y: 0,
      w: 200,
      h: 0,
      contentW: 0,
      contentH: 0,
      spacingScale,
      issues: [] as any[]
    };
    const measureChild = () => ({ w: 100, h: 20 });
    layoutStackVertical(stack, ctx as any, measureChild);
    return ctx.issues;
  }

  it('accepts explicit 0 in spacingScale with zero padding/gap', () => {
    const issues = runLayout(makeStack(0, 0), [0, 4, 8, 12]);
    const spacingIssues = issues.filter(i => i.id.startsWith('spacing-off-scale'));
    expect(spacingIssues.length).toBe(0);
  });

  it('accepts implicit 0 (zero padding/gap) even if 0 not declared in spacingScale', () => {
    const issues = runLayout(makeStack(0, 0), [4, 8, 12]);
    const spacingIssues = issues.filter(i => i.id.startsWith('spacing-off-scale'));
    expect(spacingIssues.length).toBe(0);
  });

  it('warns for non-zero padding not in spacingScale (gap in scale)', () => {
    const issues = runLayout(makeStack(16, 4), [4, 8, 12]);
    const paddingIssue = issues.find(i => i.id === 'spacing-off-scale-root-padding');
    const gapIssue = issues.find(i => i.id === 'spacing-off-scale-root-gap');
    expect(paddingIssue).toBeDefined();
    expect(paddingIssue?.severity).toBe('warn');
    expect(gapIssue).toBeUndefined();
  });
});
