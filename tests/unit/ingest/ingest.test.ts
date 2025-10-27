import { describe, it, expect } from 'vitest';
import { ingest } from '../../../src/core/ingest/ingest.js';

describe('ingest', () => {
  const validScaffold = {
    schemaVersion: '1.0.0',
    screen: {
      id: 'home-screen',
      title: 'Home',
      root: {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        children: [
          {
            id: 'title',
            type: 'Text',
            text: 'Welcome',
          },
        ],
      },
    },
    settings: {
      spacingScale: [4, 8, 12, 16, 24, 32],
      minTouchTarget: { w: 44, h: 44 },
      breakpoints: ['320x640', '768x1024'],
    },
  };

  describe('valid scaffold', () => {
    it('should pass validation for a valid scaffold', () => {
      const result = ingest(validScaffold);

      expect(result.valid).toBe(true);
      expect(result.normalized).toBeDefined();
    });

    it('should normalize the scaffold', () => {
      const result = ingest(validScaffold);

      expect(result.normalized).toBeDefined();
      // Defaults should be applied
    });

    it('should return empty issues array for valid scaffold', () => {
      const result = ingest(validScaffold);

      expect(result.issues).toEqual([]);
    });
  });

  describe('schema version validation', () => {
    it('should fail for missing schemaVersion', () => {
      const scaffold = { ...validScaffold };
      delete (scaffold as any).schemaVersion;

      const result = ingest(scaffold);

      expect(result.valid).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].id).toBe('missing-schema-version');
      expect(result.issues[0].severity).toBe('critical');
    });

    it('should fail for unsupported schemaVersion', () => {
      const scaffold = {
        ...validScaffold,
        schemaVersion: '2.0.0',
      };

      const result = ingest(scaffold);

      expect(result.valid).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].id).toBe('unsupported-schema-version');
      expect(result.issues[0].severity).toBe('critical');
    });
  });

  describe('required field validation', () => {
    it('should fail for missing screen.id', () => {
      const scaffold = {
        ...validScaffold,
        screen: {
          ...validScaffold.screen,
          id: '',
        },
      };

      const result = ingest(scaffold);

      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.severity === 'error')).toBe(true);
    });

    it('should fail for missing Stack.direction', () => {
      const scaffold = {
        ...validScaffold,
        screen: {
          ...validScaffold.screen,
          root: {
            id: 'root',
            type: 'Stack',
            children: [],
          },
        },
      };

      const result = ingest(scaffold);

      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.id === 'validation-error')).toBe(true);
    });

    it('should fail for Field without label', () => {
      const scaffold = {
        ...validScaffold,
        screen: {
          ...validScaffold.screen,
          root: {
            id: 'root',
            type: 'Field',
            label: '',
          },
        },
      };

      const result = ingest(scaffold);

      expect(result.valid).toBe(false);
    });
  });

  describe('duplicate node ID detection', () => {
    it('should detect duplicate node IDs', () => {
      const scaffold = {
        ...validScaffold,
        screen: {
          ...validScaffold.screen,
          root: {
            id: 'root',
            type: 'Stack',
            direction: 'vertical',
            children: [
              {
                id: 'duplicate',
                type: 'Text',
                text: 'First',
              },
              {
                id: 'duplicate',
                type: 'Text',
                text: 'Second',
              },
            ],
          },
        },
      };

      const result = ingest(scaffold);

      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.id === 'duplicate-node-id')).toBe(true);
      const dupIssue = result.issues.find((i) => i.id === 'duplicate-node-id');
      expect(dupIssue?.nodeId).toBe('duplicate');
    });
  });

  describe('unknown fields', () => {
    it('should ignore unknown fields', () => {
      const scaffold = {
        ...validScaffold,
        unknownField: 'should be ignored',
        screen: {
          ...validScaffold.screen,
          unknownScreenField: true,
        },
      };

      const result = ingest(scaffold);

      // Should still be valid - unknown fields are ignored
      expect(result.valid).toBe(true);
    });
  });

  describe('Form validation', () => {
    it('should fail if Form states does not include "default"', () => {
      const scaffold = {
        ...validScaffold,
        screen: {
          ...validScaffold.screen,
          root: {
            id: 'form',
            type: 'Form',
            fields: [
              {
                id: 'name',
                type: 'Field',
                label: 'Name',
              },
            ],
            actions: [
              {
                id: 'submit',
                type: 'Button',
                text: 'Submit',
              },
            ],
            states: ['loading'], // Missing "default"
          },
        },
      };

      const result = ingest(scaffold);

      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.id === 'missing-default-state')).toBe(true);
    });

    it('should warn if Form has errorText but no error state', () => {
      const scaffold = {
        ...validScaffold,
        screen: {
          ...validScaffold.screen,
          root: {
            id: 'form',
            type: 'Form',
            fields: [
              {
                id: 'email',
                type: 'Field',
                label: 'Email',
                errorText: 'Invalid email',
              },
            ],
            actions: [
              {
                id: 'submit',
                type: 'Button',
                text: 'Submit',
              },
            ],
            states: ['default'], // Missing "error"
          },
        },
      };

      const result = ingest(scaffold);

      expect(result.issues.some((i) => i.id === 'missing-error-state')).toBe(true);
      const errorStateIssue = result.issues.find((i) => i.id === 'missing-error-state');
      expect(errorStateIssue?.severity).toBe('warn');
    });
  });

  describe('tabIndex validation', () => {
    it('should warn for non-zero tabIndex', () => {
      const scaffold = {
        ...validScaffold,
        screen: {
          ...validScaffold.screen,
          root: {
            id: 'root',
            type: 'Button',
            text: 'Click',
            tabIndex: 5,
          },
        },
      };

      const result = ingest(scaffold);

      expect(result.issues.some((i) => i.id === 'non-zero-tabindex')).toBe(true);
      const tabIndexIssue = result.issues.find((i) => i.id === 'non-zero-tabindex');
      expect(tabIndexIssue?.severity).toBe('warn');
    });
  });
});
