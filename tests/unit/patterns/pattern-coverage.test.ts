import { describe, it, expect } from 'vitest';
import { suggestPatterns } from '../../../src/core/patterns/suggestions.js';
import { computeCoverage } from '../../../src/core/patterns/coverage.js';
import { getPattern } from '../../../src/core/patterns/pattern-registry.js';
import type { Node } from '../../../src/types/node.js';

function stack(children: Node[]): Node {
  return { id: 'root', type: 'Stack', direction: 'vertical', children } as any;
}

describe('pattern coverage', () => {
  it('single pattern scenario (Form only)', () => {
    const form: Node = {
      id: 'login-form',
      type: 'Form',
      fields: [ { id: 'f1', type: 'Field', label: 'Email' } ],
      actions: [ { id: 'a1', type: 'Button', text: 'Submit' } ],
      states: ['default','error']
    } as any;
    const root = stack([form]);
    const suggestions = suggestPatterns(root);
    const activated = [getPattern('Form.Basic')!.name];
    const coverage = computeCoverage(suggestions, activated);
    expect(coverage.activated).toBe(1);
    expect(coverage.nTotal).toBeGreaterThanOrEqual(4); // registry size >=4
    expect(coverage.gaps.length).toBe(0);
  });

  it('multi-pattern scenario (Form, Table, Disclosure)', () => {
    const form: Node = {
      id: 'form', type: 'Form',
      fields: [ { id: 'f1', type: 'Field', label: 'Email' } ],
      actions: [ { id: 'a1', type: 'Button', text: 'Submit' } ],
      states: ['default','error']
    } as any;
    const table: Node = {
      id: 'table', type: 'Table', title: 'Data', columns: ['A'], responsive: { strategy: 'wrap' }
    } as any;
    const disclosure: Node = { id: 'disc', type: 'Box', behaviors: { disclosure: { collapsible: true } } } as any;
    const root = stack([form, table, disclosure]);
    const suggestions = suggestPatterns(root);
    const activated = ['Form.Basic','Table.Simple','Progressive.Disclosure'];
    const coverage = computeCoverage(suggestions, activated);
    expect(coverage.activated).toBe(3);
    expect(coverage.gaps.length).toBe(0);
  });

  it('gap scenario (Guided.Flow suggested but not activated)', () => {
    const form: Node = {
      id: 'form', type: 'Form',
      fields: [ { id: 'f1', type: 'Field', label: 'Email' } ],
      actions: [ { id: 'a1', type: 'Button', text: 'Next' }, { id: 'a2', type: 'Button', text: 'Previous' } ],
      states: ['default','error']
    } as any;
    const step1Btn: Node = { id: 's1', type: 'Button', text: 'Step 1' } as any;
    const step2Btn: Node = { id: 's2', type: 'Button', text: 'Step 2' } as any;
    const root = stack([form, step1Btn, step2Btn]);
    const suggestions = suggestPatterns(root);
    const activated = ['Form.Basic'];
    const coverage = computeCoverage(suggestions, activated);
    expect(coverage.gaps.some(g => g.pattern === 'Guided.Flow')).toBe(true);
  });
});
