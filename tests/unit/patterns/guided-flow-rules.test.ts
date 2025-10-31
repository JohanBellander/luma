import { describe, it, expect } from 'vitest';
import { GuidedFlow } from '../../../src/core/patterns/guided-flow.js';
import type { Node } from '../../../src/types/node.js';

function runRule(id: string, root: Node) {
  const rule = [...GuidedFlow.must, ...GuidedFlow.should].find(r => r.id === id);
  expect(rule).toBeTruthy();
  return rule!.check(root);
}

function button(id: string, text: string, roleHint?: string): Node {
  return { id, type: 'Button', text, roleHint } as Node;
}
function field(id: string): Node { return { id, type: 'Field', label: 'Label' } as Node; }
function stack(id: string, children: Node[], direction: 'vertical'|'horizontal'='vertical'): Node { return { id, type: 'Stack', direction, children } as Node; }
function step(id: string, index: number, children: Node[]): Node {
  return { id, type: 'Stack', direction: 'vertical', children, behaviors: { guidedFlow: { role: 'step', stepIndex: index, totalSteps: 3 } } } as Node;
}
function wizard(children: Node[]): Node {
  return { id: 'wiz', type: 'Stack', direction: 'vertical', children, behaviors: { guidedFlow: { role: 'wizard', totalSteps: 3, hasProgress: true, progressNodeId: 'progress' } } } as Node;
}

describe('Guided.Flow new MUST & SHOULD rule validations', () => {
  it('wizard-field-after-actions detects misplaced field', () => {
    const actions = stack('actions-1', [button('next-1','Next','primary')], 'horizontal');
    const s1 = step('step1',1,[actions, field('late-field')]); // field after actions
    const root = wizard([ { id:'progress', type:'Text', text:'Step 1 of 3' } as Node, s1 ]);
    const issues = runRule('wizard-field-after-actions', root);
    expect(issues.length).toBe(1);
    expect(issues[0].details?.misplacedFieldIds).toContain('late-field');
  });

  it('wizard-field-after-actions passes when fields before actions', () => {
    const actions = stack('actions-1', [button('next-1','Next','primary')], 'horizontal');
    const s1 = step('step1',1,[field('name'), actions]);
    const root = wizard([ { id:'progress', type:'Text', text:'Step 1 of 3' } as Node, s1 ]);
    const issues = runRule('wizard-field-after-actions', root);
    expect(issues.length).toBe(0);
  });

  it('wizard-multiple-primary flags >1 primary', () => {
    const actions = stack('actions-1', [button('next-1','Next','primary'), button('cont-1','Continue','primary')], 'horizontal');
    const s1 = step('step1',1,[field('name'), actions]);
    const root = wizard([ { id:'progress', type:'Text', text:'Step 1 of 3' } as Node, s1 ]);
    const issues = runRule('wizard-multiple-primary', root);
    expect(issues.length).toBe(1);
  expect((issues[0].details as any)?.primaryButtonIds.length).toBe(2);
  });

  it('wizard-multiple-primary passes with single primary', () => {
    const actions = stack('actions-1', [button('next-1','Next','primary'), button('back-1','Back')], 'horizontal');
    const s1 = step('step1',1,[field('name'), actions]);
    const root = wizard([ { id:'progress', type:'Text', text:'Step 1 of 3' } as Node, s1 ]);
    const issues = runRule('wizard-multiple-primary', root);
    expect(issues.length).toBe(0);
  });

  it('wizard-progress-missing warns when progress absent despite hasProgress', () => {
    const s1 = step('step1',1,[field('name'), stack('actions-1',[button('next-1','Next','primary')],'horizontal')]);
    // Remove progress node
    const root = { id:'wiz', type:'Stack', direction:'vertical', children:[s1], behaviors:{ guidedFlow:{ role:'wizard', totalSteps:3, hasProgress:true } } } as Node;
    const issues = runRule('wizard-progress-missing', root);
    expect(issues.length).toBe(1);
    expect(issues[0].severity).toBe('warn');
  });

  it('wizard-progress-missing passes with progress node', () => {
    const s1 = step('step1',1,[field('name'), stack('actions-1',[button('next-1','Next','primary')],'horizontal')]);
    const root = wizard([ { id:'progress', type:'Text', text:'Step 1 of 3' } as Node, s1 ]);
    const issues = runRule('wizard-progress-missing', root);
    expect(issues.length).toBe(0);
  });

  it('wizard-actions-order warns when Back after Next', () => {
    const actions = stack('actions-1',[button('next-1','Next','primary'), button('back-1','Back')],'horizontal');
    const s1 = step('step1',1,[field('name'), actions]);
    const root = wizard([ { id:'progress', type:'Text', text:'Step 1 of 3' } as Node, s1 ]);
    const issues = runRule('wizard-actions-order', root);
    expect(issues.length).toBe(1);
    expect(issues[0].severity).toBe('warn');
  });

  it('wizard-actions-order passes when Back precedes Next', () => {
    const actions = stack('actions-1',[button('back-1','Back'), button('next-1','Next','primary')],'horizontal');
    const s1 = step('step1',1,[field('name'), actions]);
    const root = wizard([ { id:'progress', type:'Text', text:'Step 1 of 3' } as Node, s1 ]);
    const issues = runRule('wizard-actions-order', root);
    expect(issues.length).toBe(0);
  });

  it('wizard-step-title-missing warns when no Text before actions', () => {
    const actions = stack('actions-1',[button('next-1','Next','primary')],'horizontal');
    const s1 = step('step1',1,[field('name'), actions]); // no title Text
    const root = wizard([ { id:'progress', type:'Text', text:'Step 1 of 3' } as Node, s1 ]);
    const issues = runRule('wizard-step-title-missing', root);
    expect(issues.length).toBe(1);
    expect(issues[0].severity).toBe('warn');
  });

  it('wizard-step-title-missing passes when Text present before actions', () => {
    const actions = stack('actions-1',[button('next-1','Next','primary')],'horizontal');
    const s1 = step('step1',1,[{ id:'title-1', type:'Text', text:'Personal Info' } as Node, field('name'), actions]);
    const root = wizard([ { id:'progress', type:'Text', text:'Step 1 of 3' } as Node, s1 ]);
    const issues = runRule('wizard-step-title-missing', root);
    expect(issues.length).toBe(0);
  });
});
