import { describe, it, expect } from 'vitest';
import { ProgressiveDisclosure } from '../../../src/core/patterns/progressive-disclosure.js';
import { validatePattern } from '../../../src/core/patterns/validator.js';
import type { Node } from '../../../src/types/node.js';

describe('Progressive.Disclosure pattern - MUST failures', () => {
  describe('PD-MUST-1: disclosure-no-control', () => {
    it('should fail when collapsible has no control and no nearby Button', () => {
      const root: Node = {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        gap: 16,
        children: [
          {
            id: 'advanced-section',
            type: 'Box',
            behaviors: {
              disclosure: {
                collapsible: true,
                defaultState: 'collapsed',
              },
            },
            child: {
              id: 'advanced-content',
              type: 'Stack',
              direction: 'vertical',
              gap: 12,
              children: [
                { id: 'api-key', type: 'Field', label: 'API Key' },
              ],
            },
          },
        ],
      };

      const result = validatePattern(ProgressiveDisclosure, root);

      expect(result.mustFailed).toBeGreaterThan(0);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          id: 'disclosure-no-control',
          severity: 'error',
          nodeId: 'advanced-section',
        })
      );

      // Verify suggestion is present
      const issue = result.issues.find(i => i.id === 'disclosure-no-control');
      expect(issue?.suggestion).toBeTruthy();
      expect(issue?.suggestion).toContain('controlsId');
    });

    it('should include source attribution in disclosure-no-control issue', () => {
      const root: Node = {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        gap: 16,
        children: [
          {
            id: 'advanced-section',
            type: 'Box',
            behaviors: {
              disclosure: {
                collapsible: true,
              },
            },
            child: {
              id: 'content',
              type: 'Text',
              text: 'Advanced content',
            },
          },
        ],
      };

      const result = validatePattern(ProgressiveDisclosure, root);
      const issue = result.issues.find(i => i.id === 'disclosure-no-control');

      expect(issue?.source).toEqual({
        pattern: 'Progressive.Disclosure',
        name: expect.stringContaining('Nielsen Norman Group'),
        url: expect.stringContaining('nngroup.com'),
      });
    });
  });

  describe('PD-MUST-2: disclosure-hides-primary', () => {
    it('should fail when primary action is inside collapsed section', () => {
      const root: Node = {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        gap: 16,
        children: [
          {
            id: 'toggle-advanced',
            type: 'Button',
            text: 'Show Advanced',
          },
          {
            id: 'advanced-section',
            type: 'Stack',
            direction: 'vertical',
            gap: 12,
            behaviors: {
              disclosure: {
                collapsible: true,
                defaultState: 'collapsed',
                controlsId: 'toggle-advanced',
              },
            },
            children: [
              {
                id: 'save-btn',
                type: 'Button',
                text: 'Save',
                roleHint: 'primary',
              },
            ],
          },
        ],
      };

      const result = validatePattern(ProgressiveDisclosure, root);

      expect(result.mustFailed).toBeGreaterThan(0);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          id: 'disclosure-hides-primary',
          severity: 'error',
          nodeId: 'advanced-section',
        })
      );

      // Verify suggestion is present
      const issue = result.issues.find(i => i.id === 'disclosure-hides-primary');
      expect(issue?.suggestion).toBeTruthy();
      expect(issue?.suggestion).toContain('expanded');
    });

    it('should include source attribution in disclosure-hides-primary issue', () => {
      const root: Node = {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        gap: 16,
        children: [
          {
            id: 'toggle-btn',
            type: 'Button',
            text: 'Show More',
          },
          {
            id: 'collapsible',
            type: 'Box',
            behaviors: {
              disclosure: {
                collapsible: true,
                controlsId: 'toggle-btn',
              },
            },
            child: {
              id: 'primary-action',
              type: 'Button',
              text: 'Submit',
              roleHint: 'primary',
            },
          },
        ],
      };

      const result = validatePattern(ProgressiveDisclosure, root);
      const issue = result.issues.find(i => i.id === 'disclosure-hides-primary');

      expect(issue?.source).toEqual({
        pattern: 'Progressive.Disclosure',
        name: expect.stringContaining('GOV.UK'),
        url: expect.stringContaining('design-system.service.gov.uk'),
      });
    });

    it('should pass when primary action is outside collapsed section', () => {
      const root: Node = {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        gap: 16,
        children: [
          {
            id: 'save-btn',
            type: 'Button',
            text: 'Save',
            roleHint: 'primary',
          },
          {
            id: 'toggle-advanced',
            type: 'Button',
            text: 'Show Advanced',
          },
          {
            id: 'advanced-section',
            type: 'Box',
            behaviors: {
              disclosure: {
                collapsible: true,
                defaultState: 'collapsed',
                controlsId: 'toggle-advanced',
              },
            },
            child: {
              id: 'advanced-content',
              type: 'Field',
              label: 'Advanced Setting',
            },
          },
        ],
      };

      const result = validatePattern(ProgressiveDisclosure, root);

      // Should not have disclosure-hides-primary error
      const issue = result.issues.find(i => i.id === 'disclosure-hides-primary');
      expect(issue).toBeUndefined();
    });

    it('should pass when defaultState is expanded with primary inside', () => {
      const root: Node = {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        gap: 16,
        children: [
          {
            id: 'toggle-advanced',
            type: 'Button',
            text: 'Hide Advanced',
          },
          {
            id: 'advanced-section',
            type: 'Stack',
            direction: 'vertical',
            gap: 12,
            behaviors: {
              disclosure: {
                collapsible: true,
                defaultState: 'expanded',
                controlsId: 'toggle-advanced',
              },
            },
            children: [
              {
                id: 'save-btn',
                type: 'Button',
                text: 'Save',
                roleHint: 'primary',
              },
            ],
          },
        ],
      };

      const result = validatePattern(ProgressiveDisclosure, root);

      // Should not have disclosure-hides-primary error
      const issue = result.issues.find(i => i.id === 'disclosure-hides-primary');
      expect(issue).toBeUndefined();
    });
  });

  describe('PD-MUST-3: disclosure-missing-label', () => {
    it('should fail when collapsible has no label or summary', () => {
      const root: Node = {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        gap: 16,
        children: [
          {
            id: 'toggle-btn',
            type: 'Button',
            text: 'X', // Too short to be meaningful
          },
          {
            id: 'advanced-section',
            type: 'Box',
            behaviors: {
              disclosure: {
                collapsible: true,
                controlsId: 'toggle-btn',
              },
            },
            child: {
              id: 'content',
              type: 'Field',
              label: 'API Key',
            },
          },
        ],
      };

      const result = validatePattern(ProgressiveDisclosure, root);

      expect(result.mustFailed).toBeGreaterThan(0);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          id: 'disclosure-missing-label',
          severity: 'error',
          nodeId: 'advanced-section',
        })
      );

      // Verify suggestion is present
      const issue = result.issues.find(i => i.id === 'disclosure-missing-label');
      expect(issue?.suggestion).toBeTruthy();
      expect(issue?.suggestion).toContain('Text');
    });

    it('should include source attribution in disclosure-missing-label issue', () => {
      const root: Node = {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        gap: 16,
        children: [
          {
            id: 'toggle-btn',
            type: 'Button',
            text: '?',
          },
          {
            id: 'section',
            type: 'Box',
            behaviors: {
              disclosure: {
                collapsible: true,
                controlsId: 'toggle-btn',
              },
            },
            child: {
              id: 'content',
              type: 'Field',
              label: 'Value',
            },
          },
        ],
      };

      const result = validatePattern(ProgressiveDisclosure, root);
      const issue = result.issues.find(i => i.id === 'disclosure-missing-label');

      expect(issue?.source).toEqual({
        pattern: 'Progressive.Disclosure',
        name: expect.stringContaining('USWDS'),
        url: expect.stringContaining('designsystem.digital.gov'),
      });
    });

    it('should pass when collapsible has a sibling Text label', () => {
      const root: Node = {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        gap: 16,
        children: [
          {
            id: 'label',
            type: 'Text',
            text: 'Advanced Settings',
          },
          {
            id: 'toggle-advanced',
            type: 'Button',
            text: 'Show',
          },
          {
            id: 'advanced-section',
            type: 'Box',
            behaviors: {
              disclosure: {
                collapsible: true,
                controlsId: 'toggle-advanced',
              },
            },
            child: {
              id: 'content',
              type: 'Field',
              label: 'API Key',
            },
          },
        ],
      };

      const result = validatePattern(ProgressiveDisclosure, root);

      // Should not have disclosure-missing-label error
      const issue = result.issues.find(i => i.id === 'disclosure-missing-label');
      expect(issue).toBeUndefined();
    });

    it('should pass when control button has meaningful text', () => {
      const root: Node = {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        gap: 16,
        children: [
          {
            id: 'toggle-advanced',
            type: 'Button',
            text: 'Show Advanced Settings',
          },
          {
            id: 'advanced-section',
            type: 'Box',
            behaviors: {
              disclosure: {
                collapsible: true,
                controlsId: 'toggle-advanced',
              },
            },
            child: {
              id: 'content',
              type: 'Field',
              label: 'API Key',
            },
          },
        ],
      };

      const result = validatePattern(ProgressiveDisclosure, root);

      // Should not have disclosure-missing-label error
      const issue = result.issues.find(i => i.id === 'disclosure-missing-label');
      expect(issue).toBeUndefined();
    });
  });

  describe('Comprehensive MUST validation', () => {
    it('should pass all MUST rules for valid progressive disclosure', () => {
      const root: Node = {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        gap: 16,
        children: [
          {
            id: 'save-btn',
            type: 'Button',
            text: 'Save',
            roleHint: 'primary',
          },
          {
            id: 'advanced-label',
            type: 'Text',
            text: 'Advanced Settings',
          },
          {
            id: 'toggle-advanced',
            type: 'Button',
            text: 'Show Advanced',
          },
          {
            id: 'advanced-section',
            type: 'Box',
            behaviors: {
              disclosure: {
                collapsible: true,
                defaultState: 'collapsed',
                controlsId: 'toggle-advanced',
              },
            },
            affordances: ['chevron'],
            child: {
              id: 'advanced-content',
              type: 'Stack',
              direction: 'vertical',
              gap: 12,
              children: [
                { id: 'api-key', type: 'Field', label: 'API Key' },
                { id: 'webhook', type: 'Field', label: 'Webhook URL' },
              ],
            },
          },
        ],
      };

      const result = validatePattern(ProgressiveDisclosure, root);

      expect(result.mustFailed).toBe(0);
      expect(result.mustPassed).toBeGreaterThan(0);
    });

    it('should count multiple MUST failures correctly', () => {
      const root: Node = {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        gap: 16,
        children: [
          {
            id: 'section1',
            type: 'Box',
            behaviors: {
              disclosure: {
                collapsible: true,
                defaultState: 'collapsed',
              },
            },
            child: {
              id: 'primary1',
              type: 'Button',
              text: 'Submit',
              roleHint: 'primary',
            },
          },
          {
            id: 'section2',
            type: 'Box',
            behaviors: {
              disclosure: {
                collapsible: true,
              },
            },
            child: {
              id: 'content2',
              type: 'Field',
              label: 'Value',
            },
          },
        ],
      };

      const result = validatePattern(ProgressiveDisclosure, root);

      // Should have multiple failures:
      // - section1: no-control, hides-primary, missing-label
      // - section2: no-control, missing-label
      expect(result.mustFailed).toBeGreaterThan(0);
      
      const noControlIssues = result.issues.filter(i => i.id === 'disclosure-no-control');
      expect(noControlIssues.length).toBe(2);
      
      const hidesPrimaryIssues = result.issues.filter(i => i.id === 'disclosure-hides-primary');
      expect(hidesPrimaryIssues.length).toBe(1);
      
      const missingLabelIssues = result.issues.filter(i => i.id === 'disclosure-missing-label');
      expect(missingLabelIssues.length).toBe(2);
    });
  });
});

describe('Progressive.Disclosure pattern - SHOULD warnings', () => {
  describe('PD-SHOULD-1: disclosure-control-far', () => {
    it('should warn when control is more than 1 sibling away from collapsible', () => {
      const root: Node = {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        gap: 16,
        children: [
          {
            id: 'toggle-advanced',
            type: 'Button',
            text: 'Show Advanced',
          },
          {
            id: 'separator-text',
            type: 'Text',
            text: '---',
          },
          {
            id: 'another-text',
            type: 'Text',
            text: 'Some text',
          },
          {
            id: 'advanced-section',
            type: 'Box',
            behaviors: {
              disclosure: {
                collapsible: true,
                controlsId: 'toggle-advanced',
              },
            },
            child: {
              id: 'content',
              type: 'Field',
              label: 'Advanced Setting',
            },
          },
        ],
      };

      const result = validatePattern(ProgressiveDisclosure, root);

      expect(result.shouldFailed).toBeGreaterThan(0);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          id: 'disclosure-control-far',
          severity: 'warn',
          nodeId: 'advanced-section',
        })
      );

      const issue = result.issues.find(i => i.id === 'disclosure-control-far');
      expect(issue?.suggestion).toBeTruthy();
      expect(issue?.details?.controlId).toBe('toggle-advanced');
    });

    it('should not warn when control is adjacent to collapsible', () => {
      const root: Node = {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        gap: 16,
        children: [
          {
            id: 'toggle-advanced',
            type: 'Button',
            text: 'Show Advanced',
          },
          {
            id: 'advanced-section',
            type: 'Box',
            behaviors: {
              disclosure: {
                collapsible: true,
                controlsId: 'toggle-advanced',
              },
            },
            child: {
              id: 'content',
              type: 'Field',
              label: 'Advanced Setting',
            },
          },
        ],
      };

      const result = validatePattern(ProgressiveDisclosure, root);

      const issue = result.issues.find(i => i.id === 'disclosure-control-far');
      expect(issue).toBeUndefined();
    });

    it('should not warn when control is directly after collapsible', () => {
      const root: Node = {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        gap: 16,
        children: [
          {
            id: 'advanced-section',
            type: 'Box',
            behaviors: {
              disclosure: {
                collapsible: true,
                controlsId: 'toggle-advanced',
              },
            },
            child: {
              id: 'content',
              type: 'Field',
              label: 'Advanced Setting',
            },
          },
          {
            id: 'toggle-advanced',
            type: 'Button',
            text: 'Hide Advanced',
          },
        ],
      };

      const result = validatePattern(ProgressiveDisclosure, root);

      const issue = result.issues.find(i => i.id === 'disclosure-control-far');
      expect(issue).toBeUndefined();
    });
  });

  describe('PD-SHOULD-2: disclosure-inconsistent-affordance', () => {
    it('should warn when two collapsibles have no common affordances', () => {
      const root: Node = {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        gap: 16,
        children: [
          {
            id: 'toggle-1',
            type: 'Button',
            text: 'Show Section 1',
          },
          {
            id: 'section-1',
            type: 'Box',
            behaviors: {
              disclosure: {
                collapsible: true,
                controlsId: 'toggle-1',
              },
            },
            affordances: ['chevron'],
            child: {
              id: 'content-1',
              type: 'Text',
              text: 'Section 1 content',
            },
          },
          {
            id: 'toggle-2',
            type: 'Button',
            text: 'Show Section 2',
          },
          {
            id: 'section-2',
            type: 'Box',
            behaviors: {
              disclosure: {
                collapsible: true,
                controlsId: 'toggle-2',
              },
            },
            affordances: ['details'],
            child: {
              id: 'content-2',
              type: 'Text',
              text: 'Section 2 content',
            },
          },
        ],
      };

      const result = validatePattern(ProgressiveDisclosure, root);

      expect(result.shouldFailed).toBeGreaterThan(0);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          id: 'disclosure-inconsistent-affordance',
          severity: 'warn',
        })
      );

      const issue = result.issues.find(i => i.id === 'disclosure-inconsistent-affordance');
      expect(issue?.suggestion).toBeTruthy();
      expect(issue?.details?.collapsibleIds).toContain('section-1');
      expect(issue?.details?.collapsibleIds).toContain('section-2');
    });

    it('should not warn when collapsibles share common affordances', () => {
      const root: Node = {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        gap: 16,
        children: [
          {
            id: 'toggle-1',
            type: 'Button',
            text: 'Show Section 1',
          },
          {
            id: 'section-1',
            type: 'Box',
            behaviors: {
              disclosure: {
                collapsible: true,
                controlsId: 'toggle-1',
              },
            },
            affordances: ['chevron', 'expandable'],
            child: {
              id: 'content-1',
              type: 'Text',
              text: 'Section 1 content',
            },
          },
          {
            id: 'toggle-2',
            type: 'Button',
            text: 'Show Section 2',
          },
          {
            id: 'section-2',
            type: 'Box',
            behaviors: {
              disclosure: {
                collapsible: true,
                controlsId: 'toggle-2',
              },
            },
            affordances: ['chevron'],
            child: {
              id: 'content-2',
              type: 'Text',
              text: 'Section 2 content',
            },
          },
        ],
      };

      const result = validatePattern(ProgressiveDisclosure, root);

      const issue = result.issues.find(i => i.id === 'disclosure-inconsistent-affordance');
      expect(issue).toBeUndefined();
    });

    it('should not warn with only one collapsible', () => {
      const root: Node = {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        gap: 16,
        children: [
          {
            id: 'toggle',
            type: 'Button',
            text: 'Show Section',
          },
          {
            id: 'section',
            type: 'Box',
            behaviors: {
              disclosure: {
                collapsible: true,
                controlsId: 'toggle',
              },
            },
            affordances: ['chevron'],
            child: {
              id: 'content',
              type: 'Text',
              text: 'Section content',
            },
          },
        ],
      };

      const result = validatePattern(ProgressiveDisclosure, root);

      const issue = result.issues.find(i => i.id === 'disclosure-inconsistent-affordance');
      expect(issue).toBeUndefined();
    });
  });

  describe('PD-SHOULD-3: disclosure-early-section', () => {
    it('should warn when collapsible appears before first required field', () => {
      const root: Node = {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        gap: 16,
        children: [
          {
            id: 'toggle-advanced',
            type: 'Button',
            text: 'Show Advanced',
          },
          {
            id: 'advanced-section',
            type: 'Box',
            behaviors: {
              disclosure: {
                collapsible: true,
                controlsId: 'toggle-advanced',
              },
            },
            child: {
              id: 'optional-field',
              type: 'Field',
              label: 'Optional Setting',
            },
          },
          {
            id: 'required-name',
            type: 'Field',
            label: 'Name',
            required: true,
          },
          {
            id: 'required-email',
            type: 'Field',
            label: 'Email',
            inputType: 'email',
            required: true,
          },
        ],
      };

      const result = validatePattern(ProgressiveDisclosure, root);

      expect(result.shouldFailed).toBeGreaterThan(0);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          id: 'disclosure-early-section',
          severity: 'warn',
          nodeId: 'advanced-section',
        })
      );

      const issue = result.issues.find(i => i.id === 'disclosure-early-section');
      expect(issue?.suggestion).toBeTruthy();
      expect(issue?.details?.firstRequiredFieldId).toBe('required-name');
    });

    it('should not warn when collapsible appears after all required fields', () => {
      const root: Node = {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        gap: 16,
        children: [
          {
            id: 'required-name',
            type: 'Field',
            label: 'Name',
            required: true,
          },
          {
            id: 'required-email',
            type: 'Field',
            label: 'Email',
            inputType: 'email',
            required: true,
          },
          {
            id: 'toggle-advanced',
            type: 'Button',
            text: 'Show Advanced',
          },
          {
            id: 'advanced-section',
            type: 'Box',
            behaviors: {
              disclosure: {
                collapsible: true,
                controlsId: 'toggle-advanced',
              },
            },
            child: {
              id: 'optional-field',
              type: 'Field',
              label: 'Optional Setting',
            },
          },
        ],
      };

      const result = validatePattern(ProgressiveDisclosure, root);

      const issue = result.issues.find(i => i.id === 'disclosure-early-section');
      expect(issue).toBeUndefined();
    });

    it('should not warn when there are no required fields', () => {
      const root: Node = {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        gap: 16,
        children: [
          {
            id: 'toggle-advanced',
            type: 'Button',
            text: 'Show Advanced',
          },
          {
            id: 'advanced-section',
            type: 'Box',
            behaviors: {
              disclosure: {
                collapsible: true,
                controlsId: 'toggle-advanced',
              },
            },
            child: {
              id: 'optional-field',
              type: 'Field',
              label: 'Optional Setting',
            },
          },
          {
            id: 'another-optional',
            type: 'Field',
            label: 'Another Optional',
          },
        ],
      };

      const result = validatePattern(ProgressiveDisclosure, root);

      const issue = result.issues.find(i => i.id === 'disclosure-early-section');
      expect(issue).toBeUndefined();
    });
  });

  describe('Comprehensive SHOULD validation', () => {
    it('should pass all SHOULD rules for well-structured disclosure', () => {
      const root: Node = {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        gap: 16,
        children: [
          {
            id: 'required-name',
            type: 'Field',
            label: 'Name',
            required: true,
          },
          {
            id: 'required-email',
            type: 'Field',
            label: 'Email',
            inputType: 'email',
            required: true,
          },
          {
            id: 'toggle-advanced',
            type: 'Button',
            text: 'Show Advanced Settings',
          },
          {
            id: 'advanced-section',
            type: 'Box',
            behaviors: {
              disclosure: {
                collapsible: true,
                controlsId: 'toggle-advanced',
              },
            },
            affordances: ['chevron'],
            child: {
              id: 'optional-field',
              type: 'Field',
              label: 'Advanced Option',
            },
          },
        ],
      };

      const result = validatePattern(ProgressiveDisclosure, root);

      expect(result.shouldFailed).toBe(0);
    });

    it('should count multiple SHOULD warnings correctly', () => {
      const root: Node = {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        gap: 16,
        children: [
          {
            id: 'toggle-1',
            type: 'Button',
            text: 'Show Section 1',
          },
          {
            id: 'spacer-1',
            type: 'Text',
            text: '---',
          },
          {
            id: 'spacer-2',
            type: 'Text',
            text: '---',
          },
          {
            id: 'section-1',
            type: 'Box',
            behaviors: {
              disclosure: {
                collapsible: true,
                controlsId: 'toggle-1',
              },
            },
            affordances: ['chevron'],
            child: {
              id: 'optional-1',
              type: 'Field',
              label: 'Optional 1',
            },
          },
          {
            id: 'toggle-2',
            type: 'Button',
            text: 'Show Section 2',
          },
          {
            id: 'section-2',
            type: 'Box',
            behaviors: {
              disclosure: {
                collapsible: true,
                controlsId: 'toggle-2',
              },
            },
            affordances: ['details'],
            child: {
              id: 'optional-2',
              type: 'Field',
              label: 'Optional 2',
            },
          },
          {
            id: 'required-field',
            type: 'Field',
            label: 'Required Field',
            required: true,
          },
        ],
      };

      const result = validatePattern(ProgressiveDisclosure, root);

      // Should have warnings for:
      // - disclosure-control-far (section-1 is 3 siblings away from toggle-1)
      // - disclosure-inconsistent-affordance (chevron vs details)
      // - disclosure-early-section (both sections before required field)
      expect(result.shouldFailed).toBeGreaterThan(0);

      const controlFarIssues = result.issues.filter(i => i.id === 'disclosure-control-far');
      expect(controlFarIssues.length).toBeGreaterThan(0);

      const inconsistentAffordanceIssues = result.issues.filter(i => i.id === 'disclosure-inconsistent-affordance');
      expect(inconsistentAffordanceIssues.length).toBeGreaterThan(0);

      const earlySectionIssues = result.issues.filter(i => i.id === 'disclosure-early-section');
      expect(earlySectionIssues.length).toBeGreaterThan(0);
    });
  });
});
