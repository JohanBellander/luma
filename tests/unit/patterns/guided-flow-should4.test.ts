import { describe, it, expect } from 'vitest';
import { GuidedFlow, _guidedFlowInternals } from '../../../src/core/patterns/guided-flow.js';
import type { Node } from '../../../src/types/node.js';

// Minimal helper builders
function button(id: string, text: string, roleHint?: string): Node {
  return { id, type: 'Button', text, roleHint } as Node;
}
function field(id: string): Node { return { id, type: 'Field', label: 'Label' } as Node; }
function stack(id: string, children: Node[], direction: 'vertical'|'horizontal'='vertical'): Node { return { id, type: 'Stack', direction, children } as Node; }
function step(id: string, index: number, children: Node[]): Node {
  return { id, type: 'Stack', direction: 'vertical', children, behaviors: { guidedFlow: { role: 'step', stepIndex: index, totalSteps: 2 } } } as Node;
}
function wizard(children: Node[]): Node {
  return { id: 'wiz', type: 'Stack', direction: 'vertical', children, behaviors: { guidedFlow: { role: 'wizard', totalSteps: 2, hasProgress: true, progressNodeId: 'progress' } } } as Node;
}

// Fake layout frame type for test context (aligning with layout.ts Frame interface)
interface Frame { id: string; x: number; y: number; w: number; h: number; }

function runShouldRule(id: string, root: Node, framesById: Record<string, Frame[]>, smallestViewportHeight: number) {
  const rule = GuidedFlow.should.find(r => r.id === id);
  expect(rule).toBeTruthy();
  // Monkey patch internals accessor if needed in future; current rule reads injected symbol on root
  // We'll simulate via global symbol on root for viewport frames.
  (root as any).__layoutFrames = framesById; // attach synthetic layout frames map
  (root as any).__smallestViewportHeight = smallestViewportHeight;
  return rule!.check(root);
}

describe('Guided.Flow GF-SHOULD-4 wizard-primary-below-fold', () => {
  it('warns when primary action bottom exceeds smallest viewport height', () => {
    const actions = stack('actions-1',[button('next-1','Next','primary')],'horizontal');
    const s1 = step('step1',1,[field('name'), actions]);
    const root = wizard([{ id:'progress', type:'Text', text:'Step 1 of 2' } as Node, s1 ]);
    // Simulate layout: primary button at y=500 height=48, viewport=520 -> y+h=548 > 520
    const frames: Frame[] = [
      { id: 'next-1', x: 0, y: 500, w: 120, h: 48 },
    ];
    const issues = runShouldRule('wizard-primary-below-fold', root, { 'next-1': frames }, 520);
    expect(issues.length).toBe(1);
    expect(issues[0].id).toBe('wizard-primary-below-fold');
    expect(issues[0].severity).toBe('warn');
  });

  it('passes when primary action within smallest viewport height', () => {
    const actions = stack('actions-1',[button('next-1','Next','primary')],'horizontal');
    const s1 = step('step1',1,[field('name'), actions]);
    const root = wizard([{ id:'progress', type:'Text', text:'Step 1 of 2' } as Node, s1 ]);
    const frames: Frame[] = [
      { id: 'next-1', x: 0, y: 420, w: 120, h: 48 }, // 420+48=468 < 520
    ];
    const issues = runShouldRule('wizard-primary-below-fold', root, { 'next-1': frames }, 520);
    expect(issues.length).toBe(0);
  });

  it('passes when multiple steps and all primaries visible', () => {
    const actions1 = stack('actions-1',[button('next-1','Next','primary')],'horizontal');
    const s1 = step('step1',1,[field('name'), actions1]);
    const actions2 = stack('actions-2',[button('finish-1','Finish','primary')],'horizontal');
    const s2 = step('step2',2,[field('address'), actions2]);
    const root = wizard([{ id:'progress', type:'Text', text:'Step 1 of 2' } as Node, s1, s2 ]);
    const frames: Frame[] = [
      { id: 'next-1', x: 0, y: 410, w: 120, h: 48 },
      { id: 'finish-1', x: 0, y: 400, w: 140, h: 48 },
    ];
    const issues = runShouldRule('wizard-primary-below-fold', root, { 'next-1': [frames[0]], 'finish-1': [frames[1]] }, 520);
    expect(issues.length).toBe(0);
  });
});
