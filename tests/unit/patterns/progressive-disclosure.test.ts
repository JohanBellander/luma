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
