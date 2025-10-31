import { describe, it, expect } from 'vitest';
import { GuidedFlow, _guidedFlowInternals } from '../../../src/core/patterns/guided-flow.js';
import type { Node } from '../../../src/types/node.js';

const { resolveGuidedFlowScope, detectActions } = _guidedFlowInternals;

function baseSettings() { /* placeholder to illustrate potential shared setup */ }

function makeButton(id: string, text: string, roleHint?: string): Node {
  return { id, type: 'Button', text, roleHint: roleHint as any } as Node;
}

function makeStep(id: string, index: number, children: Node[]): Node {
  return {
    id,
    type: 'Stack',
    direction: 'vertical',
    children,
    behaviors: { guidedFlow: { role: 'step', stepIndex: index, totalSteps: 3 } },
  } as Node;
}

function makeActionsRow(id: string, buttons: Node[]): Node {
  return { id, type: 'Stack', direction: 'horizontal', children: buttons } as Node;
}

describe('Guided Flow helper resolution', () => {
  it('resolves wizard container scope and steps', () => {
    const step1 = makeStep('step-1', 1, [makeButton('b1', 'Next', 'primary')]);
    const step2 = makeStep('step-2', 2, [makeButton('b2', 'Back'), makeButton('b3', 'Next', 'primary')]);
    const step3 = makeStep('step-3', 3, [makeButton('b4', 'Back'), makeButton('b5', 'Finish', 'primary')]);
    const root: Node = {
      id: 'wizard',
      type: 'Stack',
      direction: 'vertical',
      children: [step1, step2, step3],
      behaviors: { guidedFlow: { role: 'wizard', totalSteps: 3, hasProgress: true } },
    } as Node;

    const scope = resolveGuidedFlowScope(root);
    expect(scope.scopeNode?.id).toBe('wizard');
    expect(scope.totalSteps).toBe(3);
    expect(scope.steps.map(s => s.index)).toEqual([1, 2, 3]);
    expect(scope.steps.every(s => s.total === 3)).toBe(true);
  });

  it('derives totalSteps from max index when not provided', () => {
    const step1 = makeStep('s1', 1, []);
    delete step1.behaviors!.guidedFlow!.totalSteps;
    const step3 = makeStep('s3', 3, []);
    delete step3.behaviors!.guidedFlow!.totalSteps;
    const root: Node = { id: 'root', type: 'Stack', direction: 'vertical', children: [step1, step3] } as Node;

    const scope = resolveGuidedFlowScope(root);
    expect(scope.totalSteps).toBe(3); // derived from max index
    expect(scope.steps[0].total).toBe(3);
    expect(scope.steps[1].total).toBe(3);
  });

  it('detects actions row in step via horizontal stack', () => {
    const actions = makeActionsRow('actions-1', [makeButton('next', 'Next', 'primary')]);
    const content: Node = { id: 'content-1', type: 'Stack', direction: 'vertical', children: [] } as Node;
    const step = makeStep('step-1', 1, [content, actions]);
    const result = detectActions(step);
    expect(result.actionsRow?.id).toBe('actions-1');
    expect(result.buttons.length).toBe(1);
    expect(result.buttons[0].id).toBe('next');
  });

  it('falls back to leaf stack with buttons when no horizontal stack present', () => {
    const leaf = { id: 'leaf-actions', type: 'Stack', direction: 'vertical', children: [makeButton('finish', 'Finish', 'primary')] } as Node;
    const step = makeStep('step-3', 3, [leaf]);
    const result = detectActions(step);
    expect(result.actionsRow?.id).toBe('leaf-actions');
    expect(result.buttons[0].text).toMatch(/Finish/i);
  });
});
