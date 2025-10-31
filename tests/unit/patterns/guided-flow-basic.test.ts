import { describe, it, expect } from 'vitest';
import { GuidedFlow, _guidedFlowInternals } from '../../../src/core/patterns/guided-flow.js';
import type { Node } from '../../../src/types/node.js';

function runRule(id: string, root: Node) {
  const rule = [...GuidedFlow.must, ...GuidedFlow.should].find(r => r.id === id);
  expect(rule).toBeTruthy();
  return rule!.check(root);
}

function makeWizard(steps: Array<{ id: string; index: number; buttons: Array<{ id: string; text: string; roleHint?: string }> }>, total?: number): Node {
  return {
    id: 'wizard',
    type: 'Stack',
    direction: 'vertical',
    behaviors: { guidedFlow: { role: 'wizard', totalSteps: total || steps.length, hasProgress: false } },
    children: steps.map(s => ({
      id: s.id,
      type: 'Stack',
      behaviors: { guidedFlow: { role: 'step', stepIndex: s.index, totalSteps: total || steps.length } },
      children: [
        { id: `${s.id}-field`, type: 'Field', label: 'Field' },
        { id: `${s.id}-actions`, type: 'Stack', direction: 'horizontal', children: s.buttons.map(b => ({ id: b.id, type: 'Button', text: b.text, roleHint: b.roleHint })) }
      ]
    }))
  } as Node;
}

describe('Guided.Flow basic MUST rules', () => {
  it('detects contiguous step index success', () => {
    const root = makeWizard([
      { id: 's1', index: 1, buttons: [{ id: 'next-1', text: 'Next', roleHint: 'primary' }] },
      { id: 's2', index: 2, buttons: [{ id: 'back-2', text: 'Back' }, { id: 'next-2', text: 'Next', roleHint: 'primary' }] },
      { id: 's3', index: 3, buttons: [{ id: 'back-3', text: 'Back' }, { id: 'finish', text: 'Finish', roleHint: 'primary' }] },
    ]);
    const issues = runRule('wizard-steps-missing', root);
    expect(issues.length).toBe(0);
  });

  it('flags missing contiguous index (gap)', () => {
    const root = makeWizard([
      { id: 's1', index: 1, buttons: [{ id: 'next-1', text: 'Next', roleHint: 'primary' }] },
      { id: 's3', index: 3, buttons: [{ id: 'back-3', text: 'Back' }, { id: 'finish', text: 'Finish', roleHint: 'primary' }] },
    ], 3);
    const issues = runRule('wizard-steps-missing', root);
    expect(issues.length).toBe(1);
    expect(issues[0].id).toBe('wizard-steps-missing');
    expect(issues[0].details?.foundIndices).toEqual([1,3]);
  });

  it('flags duplicate indices', () => {
    const root = makeWizard([
      { id: 's1', index: 1, buttons: [{ id: 'next-1', text: 'Next', roleHint: 'primary' }] },
      { id: 's1b', index: 1, buttons: [{ id: 'back-1b', text: 'Back' }, { id: 'next-1b', text: 'Next', roleHint: 'primary' }] },
    ], 2);
    const issues = runRule('wizard-steps-missing', root);
    expect(issues.length).toBe(1);
    expect(issues[0].details?.foundIndices).toEqual([1,1]);
  });

  it('flags missing next on first step', () => {
    const root = makeWizard([
      { id: 's1', index: 1, buttons: [] },
      { id: 's2', index: 2, buttons: [{ id: 'back-2', text: 'Back' }, { id: 'next-2', text: 'Next', roleHint: 'primary' }] },
    ]);
    const issues = runRule('wizard-next-missing', root);
    expect(issues.some(i => i.id === 'wizard-next-missing')).toBe(true);
  });

  it('flags illegal back on first step', () => {
    const root = makeWizard([
      { id: 's1', index: 1, buttons: [{ id: 'back-1', text: 'Back' }, { id: 'next-1', text: 'Next', roleHint: 'primary' }] },
      { id: 's2', index: 2, buttons: [{ id: 'back-2', text: 'Back' }, { id: 'next-2', text: 'Next', roleHint: 'primary' }] },
    ]);
    const issues = runRule('wizard-back-illegal', root);
    expect(issues.length).toBe(1);
    expect(issues[0].id).toBe('wizard-back-illegal');
  });

  it('flags missing back on intermediate step', () => {
    const root = makeWizard([
      { id: 's1', index: 1, buttons: [{ id: 'next-1', text: 'Next', roleHint: 'primary' }] },
      { id: 's2', index: 2, buttons: [{ id: 'next-2', text: 'Next', roleHint: 'primary' }] },
      { id: 's3', index: 3, buttons: [{ id: 'back-3', text: 'Back' }, { id: 'finish', text: 'Finish', roleHint: 'primary' }] },
    ]);
    const issues = runRule('wizard-back-missing', root);
    expect(issues.length).toBe(1);
    expect(issues[0].id).toBe('wizard-back-missing');
    expect(issues[0].details?.stepIndex).toBe(2);
  });

  it('flags missing finish on last step', () => {
    const root = makeWizard([
      { id: 's1', index: 1, buttons: [{ id: 'next-1', text: 'Next', roleHint: 'primary' }] },
      { id: 's2', index: 2, buttons: [{ id: 'back-2', text: 'Back' }, { id: 'next-2', text: 'Next', roleHint: 'primary' }] },
      { id: 's3', index: 3, buttons: [{ id: 'back-3', text: 'Back' }] },
    ]);
    const issues = runRule('wizard-next-missing', root); // finish missing surfaced here
    expect(issues.some(i => i.id === 'wizard-finish-missing')).toBe(true);
  });
});
