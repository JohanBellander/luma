import { describe, it, expect } from 'vitest';
import { validateFlowRules } from '../../../src/core/keyboard/flow-rules.js';
import type { Node } from '../../../src/types/node.js';

describe('flow-rules', () => {
  describe('validateFlowRules', () => {
    it('should return no issues for correct Form field-action order', () => {
      const root: Node = {
        id: 'form',
        type: 'Form',
        states: ['default'],
        fields: [
          { id: 'f1', type: 'Field', label: 'Username' },
          { id: 'f2', type: 'Field', label: 'Password' },
        ],
        actions: [
          { id: 'submit', type: 'Button', text: 'Submit', roleHint: 'primary' },
          { id: 'cancel', type: 'Button', text: 'Cancel' },
        ],
      };

      const issues = validateFlowRules(root);
      expect(issues).toEqual([]);
    });

    it('should warn when cancel button before primary in Form', () => {
      const root: Node = {
        id: 'form',
        type: 'Form',
        states: ['default'],
        fields: [
          { id: 'f1', type: 'Field', label: 'Username' },
        ],
        actions: [
          { id: 'cancel', type: 'Button', text: 'Cancel' },
          { id: 'submit', type: 'Button', text: 'Submit', roleHint: 'primary' },
        ],
      };

      const issues = validateFlowRules(root);
      expect(issues).toHaveLength(1);
      expect(issues[0]).toMatchObject({
        severity: 'warn',
        id: 'cancel-before-primary',
        message: expect.stringContaining('Cancel/back button'),
        nodeId: 'form',
      });
    });

    it('should not warn when only cancel button exists', () => {
      const root: Node = {
        id: 'form',
        type: 'Form',
        states: ['default'],
        fields: [
          { id: 'f1', type: 'Field', label: 'Name' },
        ],
        actions: [
          { id: 'cancel', type: 'Button', text: 'Cancel' },
        ],
      };

      const issues = validateFlowRules(root);
      expect(issues).toEqual([]);
    });

    it('should not warn when primary before cancel', () => {
      const root: Node = {
        id: 'form',
        type: 'Form',
        states: ['default'],
        fields: [
          { id: 'f1', type: 'Field', label: 'Name' },
        ],
        actions: [
          { id: 'submit', type: 'Button', text: 'Submit', roleHint: 'primary' },
          { id: 'cancel', type: 'Button', text: 'Cancel' },
        ],
      };

      const issues = validateFlowRules(root);
      expect(issues).toEqual([]);
    });

    it('should error when Field appears after actions in Form', () => {
      const root: Node = {
        id: 'form',
        type: 'Form',
        states: ['default'],
        fields: [
          { id: 'f1', type: 'Field', label: 'Username' },
        ],
        actions: [
          { id: 'submit', type: 'Button', text: 'Submit', roleHint: 'primary' },
          { id: 'f2', type: 'Field', label: 'Late Field' } as any,
        ],
      };

      const issues = validateFlowRules(root);
      expect(issues).toHaveLength(1);
      expect(issues[0]).toMatchObject({
        severity: 'error',
        id: 'field-after-actions',
      });
    });

    it('should handle multiple Forms independently', () => {
      const root: Node = {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        children: [
          {
            id: 'form1',
            type: 'Form',
            states: ['default'],
            fields: [{ id: 'f1', type: 'Field', label: 'Name' }],
            actions: [
              { id: 'cancel1', type: 'Button', text: 'Cancel' },
              { id: 'submit1', type: 'Button', text: 'Submit', roleHint: 'primary' },
            ],
          },
          {
            id: 'form2',
            type: 'Form',
            states: ['default'],
            fields: [{ id: 'f2', type: 'Field', label: 'Email' }],
            actions: [
              { id: 'submit2', type: 'Button', text: 'Submit', roleHint: 'primary' },
              { id: 'cancel2', type: 'Button', text: 'Cancel' },
            ],
          },
        ],
      };

      const issues = validateFlowRules(root);
      expect(issues).toHaveLength(1);
      expect(issues[0].nodeId).toBe('form1');
    });

    it('should handle Form with no fields', () => {
      const root: Node = {
        id: 'form',
        type: 'Form',
        states: ['default'],
        fields: [],
        actions: [
          { id: 'submit', type: 'Button', text: 'Submit', roleHint: 'primary' },
        ],
      };

      const issues = validateFlowRules(root);
      expect(issues).toEqual([]);
    });

    it('should handle Form with no actions', () => {
      const root: Node = {
        id: 'form',
        type: 'Form',
        states: ['default'],
        fields: [
          { id: 'f1', type: 'Field', label: 'Name' },
        ],
        actions: [],
      };

      const issues = validateFlowRules(root);
      expect(issues).toEqual([]);
    });

    it('should handle non-Form structures', () => {
      const root: Node = {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        children: [
          { id: 'b1', type: 'Button', text: 'Button 1' },
          { id: 'b2', type: 'Button', text: 'Button 2' },
        ],
      };

      const issues = validateFlowRules(root);
      expect(issues).toEqual([]);
    });

    it('should detect multiple issues in same Form', () => {
      const root: Node = {
        id: 'form',
        type: 'Form',
        states: ['default'],
        fields: [
          { id: 'f1', type: 'Field', label: 'Username' },
        ],
        actions: [
          { id: 'cancel', type: 'Button', text: 'Cancel' },
          { id: 'submit', type: 'Button', text: 'Submit', roleHint: 'primary' },
          { id: 'f2', type: 'Field', label: 'Late Field' } as any,
        ],
      };

      const issues = validateFlowRules(root);
      expect(issues).toHaveLength(2);
      const ids = issues.map((i) => i.id).sort();
      expect(ids).toEqual(['cancel-before-primary', 'field-after-actions']);
    });
  });
});
