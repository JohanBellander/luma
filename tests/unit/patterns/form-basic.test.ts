import { describe, it, expect } from 'vitest';
import { FormBasic } from '../../../src/core/patterns/form-basic.js';
import { validatePattern } from '../../../src/core/patterns/validator.js';
import type { Node } from '../../../src/types/node.js';

describe('Form.Basic pattern', () => {
  it('should pass all MUST rules for valid form', () => {
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
      ],
    };

    const result = validatePattern(FormBasic, root);
    
    expect(result.mustFailed).toBe(0);
    expect(result.mustPassed).toBe(4);
  });

  it('should fail field-has-label when field has empty label', () => {
    const root: Node = {
      id: 'form',
      type: 'Form',
      states: ['default'],
      fields: [
        { id: 'f1', type: 'Field', label: '' },
      ],
      actions: [
        { id: 'submit', type: 'Button', text: 'Submit' },
      ],
    };

    const result = validatePattern(FormBasic, root);
    
    expect(result.mustFailed).toBeGreaterThan(0);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        id: 'field-has-label',
        severity: 'error',
      })
    );
  });

  it('should fail actions-exist when form has no actions', () => {
    const root: Node = {
      id: 'form',
      type: 'Form',
      states: ['default'],
      fields: [
        { id: 'f1', type: 'Field', label: 'Name' },
      ],
      actions: [],
    };

    const result = validatePattern(FormBasic, root);
    
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        id: 'actions-exist',
        severity: 'error',
      })
    );
  });

  it('should fail actions-after-fields when field appears after action', () => {
    const root: Node = {
      id: 'form',
      type: 'Form',
      states: ['default'],
      fields: [
        { id: 'f1', type: 'Field', label: 'First Field' },
      ],
      actions: [
        { id: 'submit', type: 'Button', text: 'Submit' },
        { id: 'f2', type: 'Field', label: 'Late Field' } as any,
      ],
    };

    const result = validatePattern(FormBasic, root);
    
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        id: 'actions-after-fields',
        severity: 'error',
      })
    );
  });

  it('should fail has-error-state when errorText present but no error state', () => {
    const root: Node = {
      id: 'form',
      type: 'Form',
      states: ['default'],
      fields: [
        { id: 'f1', type: 'Field', label: 'Email', errorText: 'Invalid email' },
      ],
      actions: [
        { id: 'submit', type: 'Button', text: 'Submit' },
      ],
    };

    const result = validatePattern(FormBasic, root);
    
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        id: 'has-error-state',
        severity: 'error',
      })
    );
  });

  it('should pass has-error-state when errorText present with error state', () => {
    const root: Node = {
      id: 'form',
      type: 'Form',
      states: ['default', 'error'],
      fields: [
        { id: 'f1', type: 'Field', label: 'Email', errorText: 'Invalid email' },
      ],
      actions: [
        { id: 'submit', type: 'Button', text: 'Submit' },
      ],
    };

    const result = validatePattern(FormBasic, root);
    
    expect(result.mustFailed).toBe(0);
  });

  it('should warn about help-text for short labels', () => {
    const root: Node = {
      id: 'form',
      type: 'Form',
      states: ['default'],
      fields: [
        { id: 'f1', type: 'Field', label: 'ID' },
      ],
      actions: [
        { id: 'submit', type: 'Button', text: 'Submit' },
      ],
    };

    const result = validatePattern(FormBasic, root);
    
    expect(result.shouldFailed).toBeGreaterThan(0);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        id: 'help-text',
        severity: 'warn',
      })
    );
  });

  it('should include source attribution in issues', () => {
    const root: Node = {
      id: 'form',
      type: 'Form',
      states: ['default'],
      fields: [
        { id: 'f1', type: 'Field', label: '' },
      ],
      actions: [
        { id: 'submit', type: 'Button', text: 'Submit' },
      ],
    };

    const result = validatePattern(FormBasic, root);
    const issue = result.issues.find(i => i.id === 'field-has-label');
    
    expect(issue?.source).toEqual({
      pattern: 'Form.Basic',
      name: 'GOV.UK Design System',
      url: expect.stringContaining('design-system.service.gov.uk'),
    });
  });
});
