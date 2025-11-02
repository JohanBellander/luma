import { describe, it, expect } from 'vitest';
import { suggestPatterns, HIGH_CONFIDENCE_THRESHOLD } from '../../../src/core/patterns/suggestions.js';
import type { Node } from '../../../src/types/node.js';

function makeRoot(children: Node[]): Node { return { id: 'root', type: 'Stack', direction: 'vertical', children }; }

describe('Pattern suggestions confidence scoring (LUMA-117)', () => {
  it('assigns high numeric score for Form.Basic structural match', () => {
    const root = makeRoot([
      { id: 'form', type: 'Form', title: 'Account', fields: [{ id: 'f1', type: 'Field', label: 'Email' }], actions: [{ id: 'submit', type: 'Button', text: 'Submit', roleHint: 'primary' }] }
    ] as any);
    const suggestions = suggestPatterns(root);
    const formSuggestion = suggestions.find(s => s.pattern === 'Form.Basic');
    expect(formSuggestion).toBeDefined();
    expect(formSuggestion!.confidence).toBe('high');
    expect(formSuggestion!.confidenceScore).toBeGreaterThanOrEqual(HIGH_CONFIDENCE_THRESHOLD);
  });

  it('assigns medium numeric score when Guided.Flow has limited indicators', () => {
    const root = makeRoot([
      { id: 'nextBtn', type: 'Button', text: 'Next' },
      { id: 'prevBtn', type: 'Button', text: 'Previous' }
    ] as any);
    const suggestions = suggestPatterns(root);
    const guided = suggestions.find(s => s.pattern === 'Guided.Flow');
    expect(guided).toBeDefined();
    expect(guided!.confidence).toBe('medium');
    expect(guided!.confidenceScore).toBeGreaterThan(50); // medium threshold mapping
    expect(guided!.confidenceScore).toBeLessThan(HIGH_CONFIDENCE_THRESHOLD);
  });

  it('assigns low numeric score for single Guided.Flow indicator', () => {
    const root = makeRoot([
      { id: 'nextBtn', type: 'Button', text: 'Next' }
    ] as any);
    const suggestions = suggestPatterns(root);
    const guided = suggestions.find(s => s.pattern === 'Guided.Flow');
    expect(guided).toBeDefined();
    expect(guided!.confidence).toBe('low');
    expect(guided!.confidenceScore).toBeLessThan(50);
  });

  it('auto-selected patterns should be those >= HIGH_CONFIDENCE_THRESHOLD', () => {
    const root = makeRoot([
      { id: 'form', type: 'Form', title: 'Sign In', fields: [{ id: 'email', type: 'Field', label: 'Email' }], actions: [{ id: 'login', type: 'Button', text: 'Login', roleHint: 'primary' }] },
      { id: 'table', type: 'Table', columns: ['Col1'], responsive: { strategy: 'scroll' } }
    ] as any);
    const suggestions = suggestPatterns(root);
    const auto = suggestions.filter(s => s.confidenceScore >= HIGH_CONFIDENCE_THRESHOLD).map(s => s.pattern).sort();
    expect(auto).toContain('Form.Basic');
    expect(auto).toContain('Table.Simple');
  });
});
