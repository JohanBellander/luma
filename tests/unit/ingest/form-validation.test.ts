/**
 * Form component validation tests
 * 
 * Tests to verify Form validation works correctly and documents
 * the exact structure required for Form components.
 * 
 * Related: LUMA-33 (Investigation of Form component validation)
 */

import { describe, it, expect } from 'vitest';
import { scaffoldSchema } from '../../../src/core/ingest/validator.js';
import type { ZodError } from 'zod';

describe('Form Component Validation', () => {
  const baseSettings = {
    spacingScale: [4, 8, 12, 16, 24, 32],
    minTouchTarget: { w: 44, h: 44 },
    breakpoints: ['320x640', '768x1024'],
  };

  describe('Valid Form structures', () => {
    it('should accept Form with correct structure as nested component', () => {
      const scaffold = {
        schemaVersion: '1.0.0',
        screen: {
          id: 'test-screen',
          title: 'Test',
          root: {
            id: 'root',
            type: 'Stack',
            direction: 'vertical',
            children: [
              {
                id: 'my-form',
                type: 'Form',
                title: 'Test Form',
                states: ['default'],
                fields: [
                  {
                    id: 'field1',
                    type: 'Field',
                    label: 'Name',
                  },
                ],
                actions: [
                  {
                    id: 'action1',
                    type: 'Button',
                    text: 'Submit',
                  },
                ],
              },
            ],
          },
        },
        settings: baseSettings,
      };

      const result = scaffoldSchema.safeParse(scaffold);
      expect(result.success).toBe(true);
    });

    it('should accept Form as root component', () => {
      const scaffold = {
        schemaVersion: '1.0.0',
        screen: {
          id: 'form-screen',
          root: {
            id: 'root',
            type: 'Form',
            states: ['default'],
            fields: [
              {
                id: 'field1',
                type: 'Field',
                label: 'Email',
                inputType: 'email',
              },
            ],
            actions: [
              {
                id: 'submit',
                type: 'Button',
                text: 'Submit',
                roleHint: 'primary',
              },
            ],
          },
        },
        settings: baseSettings,
      };

      const result = scaffoldSchema.safeParse(scaffold);
      expect(result.success).toBe(true);
    });

    it('should accept Form with multiple fields and actions', () => {
      const scaffold = {
        schemaVersion: '1.0.0',
        screen: {
          id: 'multi-field-form',
          root: {
            id: 'contact-form',
            type: 'Form',
            title: 'Contact Us',
            states: ['default', 'error'],
            fields: [
              {
                id: 'name-field',
                type: 'Field',
                label: 'Name',
                inputType: 'text',
                required: true,
              },
              {
                id: 'email-field',
                type: 'Field',
                label: 'Email',
                inputType: 'email',
                required: true,
                helpText: 'We will never share your email',
              },
              {
                id: 'message-field',
                type: 'Field',
                label: 'Message',
                inputType: 'text',
              },
            ],
            actions: [
              {
                id: 'submit-btn',
                type: 'Button',
                text: 'Submit',
                roleHint: 'primary',
              },
              {
                id: 'cancel-btn',
                type: 'Button',
                text: 'Cancel',
                roleHint: 'secondary',
              },
            ],
          },
        },
        settings: baseSettings,
      };

      const result = scaffoldSchema.safeParse(scaffold);
      expect(result.success).toBe(true);
    });
  });

  describe('Invalid Form structures (missing required properties)', () => {
    it('should reject Form with missing type on Field', () => {
      const scaffold = {
        schemaVersion: '1.0.0',
        screen: {
          id: 'test-screen',
          root: {
            id: 'root',
            type: 'Stack',
            direction: 'vertical',
            children: [
              {
                id: 'my-form',
                type: 'Form',
                states: ['default'],
                fields: [
                  {
                    id: 'field1',
                    // Missing: type: 'Field'
                    label: 'Name',
                  },
                ],
                actions: [
                  {
                    id: 'action1',
                    type: 'Button',
                    text: 'Submit',
                  },
                ],
              },
            ],
          },
        },
        settings: baseSettings,
      };

      const result = scaffoldSchema.safeParse(scaffold);
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error as ZodError;
        expect(error.issues[0].code).toBe('invalid_union');
      }
    });

    it('should reject Form with missing type on Button', () => {
      const scaffold = {
        schemaVersion: '1.0.0',
        screen: {
          id: 'test-screen',
          root: {
            id: 'root',
            type: 'Stack',
            direction: 'vertical',
            children: [
              {
                id: 'my-form',
                type: 'Form',
                states: ['default'],
                fields: [
                  {
                    id: 'field1',
                    type: 'Field',
                    label: 'Name',
                  },
                ],
                actions: [
                  {
                    id: 'action1',
                    // Missing: type: 'Button'
                    text: 'Submit',
                  },
                ],
              },
            ],
          },
        },
        settings: baseSettings,
      };

      const result = scaffoldSchema.safeParse(scaffold);
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error as ZodError;
        expect(error.issues[0].code).toBe('invalid_union');
      }
    });

    it('should reject Form with missing states array', () => {
      const scaffold = {
        schemaVersion: '1.0.0',
        screen: {
          id: 'test-screen',
          root: {
            id: 'my-form',
            type: 'Form',
            // Missing: states: ['default']
            fields: [
              {
                id: 'field1',
                type: 'Field',
                label: 'Name',
              },
            ],
            actions: [
              {
                id: 'action1',
                type: 'Button',
                text: 'Submit',
              },
            ],
          },
        },
        settings: baseSettings,
      };

      const result = scaffoldSchema.safeParse(scaffold);
      expect(result.success).toBe(false);
    });

    it('should reject Form with empty fields array', () => {
      const scaffold = {
        schemaVersion: '1.0.0',
        screen: {
          id: 'test-screen',
          root: {
            id: 'my-form',
            type: 'Form',
            states: ['default'],
            fields: [], // Empty array
            actions: [
              {
                id: 'action1',
                type: 'Button',
                text: 'Submit',
              },
            ],
          },
        },
        settings: baseSettings,
      };

      const result = scaffoldSchema.safeParse(scaffold);
      expect(result.success).toBe(false);
    });

    it('should reject Form with empty actions array', () => {
      const scaffold = {
        schemaVersion: '1.0.0',
        screen: {
          id: 'test-screen',
          root: {
            id: 'my-form',
            type: 'Form',
            states: ['default'],
            fields: [
              {
                id: 'field1',
                type: 'Field',
                label: 'Name',
              },
            ],
            actions: [], // Empty array
          },
        },
        settings: baseSettings,
      };

      const result = scaffoldSchema.safeParse(scaffold);
      expect(result.success).toBe(false);
    });
  });

  describe('Field validation within Form', () => {
    it('should accept Field with all optional properties', () => {
      const scaffold = {
        schemaVersion: '1.0.0',
        screen: {
          id: 'test-screen',
          root: {
            id: 'my-form',
            type: 'Form',
            states: ['default', 'error'],
            fields: [
              {
                id: 'email-field',
                type: 'Field',
                label: 'Email',
                inputType: 'email',
                required: true,
                helpText: 'Your email address',
                errorText: 'Invalid email format',
                focusable: true,
              },
            ],
            actions: [
              {
                id: 'submit',
                type: 'Button',
                text: 'Submit',
              },
            ],
          },
        },
        settings: baseSettings,
      };

      const result = scaffoldSchema.safeParse(scaffold);
      expect(result.success).toBe(true);
    });

    it('should reject Field with empty label', () => {
      const scaffold = {
        schemaVersion: '1.0.0',
        screen: {
          id: 'test-screen',
          root: {
            id: 'my-form',
            type: 'Form',
            states: ['default'],
            fields: [
              {
                id: 'field1',
                type: 'Field',
                label: '', // Empty string not allowed
              },
            ],
            actions: [
              {
                id: 'submit',
                type: 'Button',
                text: 'Submit',
              },
            ],
          },
        },
        settings: baseSettings,
      };

      const result = scaffoldSchema.safeParse(scaffold);
      expect(result.success).toBe(false);
    });

    it('should accept all valid inputType values', () => {
      const inputTypes: Array<'text' | 'email' | 'password' | 'number' | 'date'> = [
        'text',
        'email',
        'password',
        'number',
        'date',
      ];

      inputTypes.forEach((inputType) => {
        const scaffold = {
          schemaVersion: '1.0.0',
          screen: {
            id: 'test-screen',
            root: {
              id: 'my-form',
              type: 'Form',
              states: ['default'],
              fields: [
                {
                  id: 'field1',
                  type: 'Field',
                  label: 'Test',
                  inputType,
                },
              ],
              actions: [
                {
                  id: 'submit',
                  type: 'Button',
                  text: 'Submit',
                },
              ],
            },
          },
          settings: baseSettings,
        };

        const result = scaffoldSchema.safeParse(scaffold);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Button validation within Form actions', () => {
    it('should accept Button with all optional properties', () => {
      const scaffold = {
        schemaVersion: '1.0.0',
        screen: {
          id: 'test-screen',
          root: {
            id: 'my-form',
            type: 'Form',
            states: ['default'],
            fields: [
              {
                id: 'field1',
                type: 'Field',
                label: 'Name',
              },
            ],
            actions: [
              {
                id: 'submit',
                type: 'Button',
                text: 'Submit',
                roleHint: 'primary',
                focusable: true,
                tabIndex: 0,
              },
            ],
          },
        },
        settings: baseSettings,
      };

      const result = scaffoldSchema.safeParse(scaffold);
      expect(result.success).toBe(true);
    });

    it('should accept all valid roleHint values', () => {
      const roleHints: Array<'primary' | 'secondary' | 'danger' | 'link'> = [
        'primary',
        'secondary',
        'danger',
        'link',
      ];

      roleHints.forEach((roleHint) => {
        const scaffold = {
          schemaVersion: '1.0.0',
          screen: {
            id: 'test-screen',
            root: {
              id: 'my-form',
              type: 'Form',
              states: ['default'],
              fields: [
                {
                  id: 'field1',
                  type: 'Field',
                  label: 'Name',
                },
              ],
              actions: [
                {
                  id: 'submit',
                  type: 'Button',
                  text: 'Submit',
                  roleHint,
                },
              ],
            },
          },
          settings: baseSettings,
        };

        const result = scaffoldSchema.safeParse(scaffold);
        expect(result.success).toBe(true);
      });
    });

    it('should accept icon-only Button (no text)', () => {
      const scaffold = {
        schemaVersion: '1.0.0',
        screen: {
          id: 'test-screen',
          root: {
            id: 'my-form',
            type: 'Form',
            states: ['default'],
            fields: [
              {
                id: 'field1',
                type: 'Field',
                label: 'Name',
              },
            ],
            actions: [
              {
                id: 'icon-btn',
                type: 'Button',
                // No text property - icon-only button
                roleHint: 'primary',
              },
            ],
          },
        },
        settings: baseSettings,
      };

      const result = scaffoldSchema.safeParse(scaffold);
      expect(result.success).toBe(true);
    });
  });
});
