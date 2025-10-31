import { describe, it, expect } from 'vitest';
import { _guidedFlowInternals } from '../../../src/core/patterns/guided-flow.js';
import type { Node } from '../../../src/types/node.js';

const { resolveGuidedFlowScopes } = _guidedFlowInternals;

function wizard(id: string, totalSteps: number, children: Node[]): Node {
  return {
    id,
    type: 'Stack',
    direction: 'vertical',
    children,
    behaviors: { guidedFlow: { role: 'wizard', totalSteps } },
  } as Node;
}

function step(id: string, index: number, visible: boolean = true): Node {
  return {
    id,
    type: 'Stack',
    direction: 'vertical',
    children: [],
    visible,
    behaviors: { guidedFlow: { role: 'step', stepIndex: index, totalSteps: 3 } },
  } as Node;
}

describe('Guided Flow multi-scope & visibility handling', () => {
  it('creates separate scopes for multiple wizard containers plus global steps', () => {
    const w1 = wizard('wiz-1', 2, [step('w1-step-1', 1), step('w1-step-2', 2)]);
    const w2 = wizard('wiz-2', 1, [step('w2-step-1', 1)]);
    // Global steps not in any wizard
    const gStep1 = step('global-step-1', 1);
    const gStep2Invisible = step('global-step-2', 2, false); // invisible should be skipped

    const root: Node = {
      id: 'root',
      type: 'Stack',
      direction: 'vertical',
      children: [w1, w2, gStep1, gStep2Invisible],
    } as Node;

    const scopes = resolveGuidedFlowScopes(root);
    // Expect 3 scopes: w1, w2, global (in that order or order of detection)
    expect(scopes.length).toBe(3);
    const w1Scope = scopes.find(s => s.scopeNode?.id === 'wiz-1');
    const w2Scope = scopes.find(s => s.scopeNode?.id === 'wiz-2');
    const globalScope = scopes.find(s => !s.scopeNode);
    expect(w1Scope).toBeTruthy();
    expect(w2Scope).toBeTruthy();
    expect(globalScope).toBeTruthy();
    expect(w1Scope!.indices).toEqual([1,2]);
    expect(w2Scope!.indices).toEqual([1]);
    // Invisible step index (2) should be skipped in global scope
    expect(globalScope!.indices).toEqual([1]);
  });
});
