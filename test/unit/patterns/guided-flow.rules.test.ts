import { describe, it, expect } from 'vitest';
import { GuidedFlow } from '../../../src/core/patterns/guided-flow.js';
import { validatePattern } from '../../../src/core/patterns/validator.js';
import type { Node } from '../../../src/types/node.js';

function run(root: Node) {
  return validatePattern(GuidedFlow, root);
}

// Utility builders
function step(index: number, total: number, children: Node[]): Node {
  return {
    id: `step${index}`,
    type: 'Stack',
    direction: 'vertical',
    behaviors: { guidedFlow: { role: 'step', stepIndex: index, totalSteps: total } },
    children,
  } as Node;
}
function btn(id: string, text: string, roleHint?: string): Node {
  return { id, type: 'Button', text, ...(roleHint ? { roleHint } : {}) } as Node;
}
function field(id: string, label: string): Node { return { id, type: 'Field', label } as Node; }
function actionsRow(id: string, buttons: Node[]): Node { return { id, type: 'Stack', direction: 'horizontal', children: buttons } as Node; }

function wizard(total: number, children: Node[], extra?: Partial<Node>): Node {
  return {
    id: 'wizard',
    type: 'Stack',
    direction: 'vertical',
    behaviors: { guidedFlow: { role: 'wizard', totalSteps: total, hasProgress: true, progressNodeId: 'progress' } },
    children: [{ id: 'progress', type: 'Text', text: `Step 1 of ${total}` }, ...children],
    ...extra,
  } as Node;
}

describe('Guided.Flow MUST rules', () => {
  it('wizard-steps-missing when indices not contiguous', () => {
    const root = wizard(3, [
      step(1, 3, [field('f1','Name'), actionsRow('actions-1',[btn('next-1','Next','primary')])]),
      // Missing stepIndex 2
      step(3, 3, [field('f3','Email'), actionsRow('actions-3',[btn('finish','Finish','primary')])]),
    ]);
    const r = run(root);
    expect(r.issues.some(i=>i.id==='wizard-steps-missing')).toBe(true);
  });

  it('wizard-next-missing for first step lacking next', () => {
    const root = wizard(2, [
      step(1, 2, [field('f1','Name'), actionsRow('actions-1',[btn('back-illegal','Back')])]), // Back illegal + no Next
      step(2, 2, [field('f2','Email'), actionsRow('actions-2',[btn('finish','Finish','primary')])]),
    ]);
    const r = run(root);
    expect(r.issues.find(i=>i.id==='wizard-next-missing')).toBeTruthy();
    expect(r.issues.find(i=>i.id==='wizard-back-illegal')).toBeTruthy();
  });

  it('wizard-back-missing on intermediate step', () => {
    const root = wizard(3, [
      step(1,3,[field('f1','Name'), actionsRow('a1',[btn('next-1','Next','primary')])]),
      step(2,3,[field('f2','Email'), actionsRow('a2',[btn('next-2','Next','primary')])]), // missing Back
      step(3,3,[field('f3','Role'), actionsRow('a3',[btn('finish','Finish','primary')])]),
    ]);
    const r = run(root);
    expect(r.issues.find(i=>i.id==='wizard-back-missing')).toBeTruthy();
  });

  it('wizard-finish-missing on last step', () => {
    const root = wizard(2, [
      step(1,2,[field('f1','Name'), actionsRow('a1',[btn('next-1','Next','primary')])]),
      step(2,2,[field('f2','Email'), actionsRow('a2',[btn('cancel','Cancel'), btn('other','Other')])]), // no finish
    ]);
    const r = run(root);
    expect(r.issues.find(i=>i.id==='wizard-finish-missing')).toBeTruthy();
  });

  it('wizard-field-after-actions when field appears after actions row', () => {
    const wrongStep = step(1,1,[actionsRow('a1',[btn('finish','Finish','primary')]), field('lateField','Late')]);
    const root = wizard(1,[wrongStep]);
    const r = run(root);
    expect(r.issues.find(i=>i.id==='wizard-field-after-actions')).toBeTruthy();
  });

  it('wizard-multiple-primary when two primary buttons present', () => {
    const stepNode = step(1,1,[field('f','Name'), actionsRow('a1',[btn('next','Next','primary'), btn('finish','Finish','primary')])]);
    const root = wizard(1,[stepNode]);
    const r = run(root);
    expect(r.issues.find(i=>i.id==='wizard-multiple-primary')).toBeTruthy();
  });
});

describe('Guided.Flow SHOULD rules', () => {
  it('wizard-progress-missing when hasProgress true but progress absent', () => {
    const w = wizard(1,[step(1,1,[field('f','Name'), actionsRow('a1',[btn('finish','Finish','primary')])])]);
    // remove progress child
    (w as any).children = [step(1,1,[field('f','Name'), actionsRow('a1',[btn('finish','Finish','primary')])])];
    const r = run(w);
    expect(r.issues.find(i=>i.id==='wizard-progress-missing')).toBeTruthy();
  });

  it('wizard-actions-order when Back appears after Next', () => {
    const root = wizard(2,[
      step(1,2,[field('f1','Name'), actionsRow('a1',[btn('next-1','Next','primary'), btn('back-1','Back')])]),
      step(2,2,[field('f2','Email'), actionsRow('a2',[btn('finish','Finish','primary')])]),
    ]);
    const r = run(root);
    expect(r.issues.find(i=>i.id==='wizard-actions-order')).toBeTruthy();
  });

  it('wizard-step-title-missing when step lacks Text before actions', () => {
    const root = wizard(1,[step(1,1,[field('f','Name'), actionsRow('a1',[btn('finish','Finish','primary')])])]);
    const r = run(root);
    expect(r.issues.find(i=>i.id==='wizard-step-title-missing')).toBeTruthy();
  });

  it('wizard-primary-below-fold when injected layout frame places primary below fold', () => {
    const stepNode = step(1,1,[field('f','Name'), actionsRow('a1',[btn('finish','Finish','primary')])]);
    const root = wizard(1,[stepNode]);
    // Inject synthetic layout frames
    (root as any).__layoutFrames = { 'finish': [{ id:'finish', x:0, y:700, w:100, h:44 }] };
    (root as any).__smallestViewportHeight = 640;
    const r = run(root);
    expect(r.issues.find(i=>i.id==='wizard-primary-below-fold')).toBeTruthy();
  });
});

// Passing example sanity check (no MUST failures, some SHOULD optional absent)
describe('Guided.Flow passing example', () => {
  it('has no MUST failures when fully valid', () => {
    const step1 = step(1,3,[{ id:'title-1', type:'Text', text:'Step 1 — Info' }, field('f1','Name'), actionsRow('a1',[btn('next-1','Next','primary')])]);
    const step2 = step(2,3,[{ id:'title-2', type:'Text', text:'Step 2 — Detail' }, field('f2','Email'), actionsRow('a2',[btn('back-2','Back'), btn('next-2','Next','primary')])]);
    const step3 = step(3,3,[{ id:'title-3', type:'Text', text:'Step 3 — Confirm' }, field('f3','Role'), actionsRow('a3',[btn('back-3','Back'), btn('finish','Finish','primary')])]);
    const root = wizard(3,[step1, step2, step3]);
    const r = run(root);
    expect(r.mustFailed).toBe(0);
    // Titles present, progress present, back ordering correct, finish above fold (inject frame above fold)
    (root as any).__layoutFrames = { 'finish': [{ id:'finish', x:0, y:200, w:100, h:44 }] };
    (root as any).__smallestViewportHeight = 640;
    const r2 = run(root);
    expect(r2.issues.find(i=>i.id==='wizard-primary-below-fold')).toBeFalsy();
  });
});
