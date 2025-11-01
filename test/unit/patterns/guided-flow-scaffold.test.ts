import { describe, it, expect } from 'vitest';
import { GuidedFlow } from '../../../src/core/patterns/guided-flow.js';
import { validatePattern } from '../../../src/core/patterns/validator.js';
import type { Node } from '../../../src/types/node.js';

// Minimal wizard container + one step (placeholder; rules not implemented yet)
const scaffoldRoot: Node = {
  id: 'wizard',
  type: 'Stack',
  direction: 'vertical',
  behaviors: { guidedFlow: { role: 'wizard', totalSteps: 1, hasProgress: true, progressNodeId: 'progress' } },
  children: [
    { id: 'progress', type: 'Text', text: 'Step 1 of 1' },
    {
      id: 'step1',
      type: 'Stack',
      direction: 'vertical',
      behaviors: { guidedFlow: { role: 'step', stepIndex: 1, totalSteps: 1 } },
      children: [
        { id: 'field1', type: 'Field', label: 'Name' },
        {
          id: 'actions-1',
          type: 'Stack',
          direction: 'horizontal',
          children: [
            { id: 'finish', type: 'Button', text: 'Finish', roleHint: 'primary' },
          ],
        },
      ],
    },
  ],
};

describe('Guided.Flow pattern scaffolding', () => {
  it('produces one SHOULD warning (missing title) with implemented rules', () => {
    const result = validatePattern(GuidedFlow, scaffoldRoot);
    expect(result.pattern).toBe('Guided.Flow');
    // Expect one warn issue: wizard-step-title-missing
    const warnIds = result.issues.map(i => i.id);
    expect(warnIds).toContain('wizard-step-title-missing');
    expect(result.mustFailed).toBe(0);
    expect(result.shouldFailed).toBe(1);
  });
});
