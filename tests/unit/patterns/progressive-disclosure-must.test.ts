/**
 * Unit tests for Progressive Disclosure pattern MUST rules (PD-MUST-1..3)
 */

import { describe, it, expect } from 'vitest';
import { ProgressiveDisclosure } from '../../../src/core/patterns/progressive-disclosure.js';
import type { Node, StackNode, ButtonNode, BoxNode, TextNode } from '../../../src/types/node.js';

describe('Progressive Disclosure MUST rules', () => {
  describe('passing example', () => {
    it('should pass all MUST rules for valid collapsible section', () => {
      const root: StackNode = {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        gap: 16,
        children: [
          {
            id: 'basic-field',
            type: 'Field',
            label: 'Name',
          } as Node,
          {
            id: 'toggle-advanced',
            type: 'Button',
            text: 'Show advanced',
          } as ButtonNode,
          {
            id: 'advanced',
            type: 'Box',
            padding: 16,
            behaviors: {
              disclosure: {
                collapsible: true,
                controlsId: 'toggle-advanced',
                defaultState: 'collapsed',
              },
            },
            child: {
              id: 'api-key',
              type: 'Field',
              label: 'API Key',
            } as Node,
          } as BoxNode,
          {
            id: 'submit-btn',
            type: 'Button',
            text: 'Submit',
            roleHint: 'primary',
          } as ButtonNode,
        ],
      };

      // Validate pattern
      const mustIssues = ProgressiveDisclosure.must.flatMap((rule) => rule.check(root));
      
      expect(mustIssues).toHaveLength(0);
    });
  });

  describe('PD-MUST-1: disclosure-no-control', () => {
    it('should fail when collapsible has no control and no candidate nearby', () => {
      const root: StackNode = {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        gap: 16,
        children: [
          {
            id: 'advanced',
            type: 'Box',
            padding: 16,
            behaviors: {
              disclosure: {
                collapsible: true,
                defaultState: 'collapsed',
              },
            },
            child: {
              id: 'api-key',
              type: 'Field',
              label: 'API Key',
            } as Node,
          } as BoxNode,
        ],
      };

      const rule = ProgressiveDisclosure.must.find((r) => r.id === 'disclosure-no-control');
      expect(rule).toBeDefined();
      
      const issues = rule!.check(root);
      
      expect(issues).toHaveLength(1);
      expect(issues[0].id).toBe('disclosure-no-control');
      expect(issues[0].severity).toBe('error');
      expect(issues[0].nodeId).toBe('advanced');
      expect(issues[0].source?.pattern).toBe('Progressive.Disclosure');
      expect(issues[0].suggestion).toBeTruthy();
      expect(issues[0].details).toBeDefined();
    });

    it('should fail when controlsId references non-existent button', () => {
      const root: StackNode = {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        gap: 16,
        children: [
          {
            id: 'advanced',
            type: 'Box',
            padding: 16,
            behaviors: {
              disclosure: {
                collapsible: true,
                controlsId: 'missing-button',
                defaultState: 'collapsed',
              },
            },
            child: {
              id: 'api-key',
              type: 'Field',
              label: 'API Key',
            } as Node,
          } as BoxNode,
        ],
      };

      const rule = ProgressiveDisclosure.must.find((r) => r.id === 'disclosure-no-control');
      const issues = rule!.check(root);
      
      expect(issues).toHaveLength(1);
      expect(issues[0].id).toBe('disclosure-no-control');
      expect(issues[0].details?.found).toBe('missing-button');
    });
  });

  describe('PD-MUST-2: disclosure-hides-primary', () => {
    it('should fail when primary action is hidden in collapsed section', () => {
      const root: StackNode = {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        gap: 16,
        children: [
          {
            id: 'toggle-advanced',
            type: 'Button',
            text: 'Show advanced',
          } as ButtonNode,
          {
            id: 'advanced',
            type: 'Box',
            padding: 16,
            behaviors: {
              disclosure: {
                collapsible: true,
                controlsId: 'toggle-advanced',
                defaultState: 'collapsed',
              },
            },
            child: {
              id: 'save-btn',
              type: 'Button',
              text: 'Save',
              roleHint: 'primary',
            } as ButtonNode,
          } as BoxNode,
        ],
      };

      const rule = ProgressiveDisclosure.must.find((r) => r.id === 'disclosure-hides-primary');
      expect(rule).toBeDefined();
      
      const issues = rule!.check(root);
      
      expect(issues).toHaveLength(1);
      expect(issues[0].id).toBe('disclosure-hides-primary');
      expect(issues[0].severity).toBe('error');
      expect(issues[0].nodeId).toBe('advanced');
      expect(issues[0].source?.pattern).toBe('Progressive.Disclosure');
      expect(issues[0].suggestion).toBeTruthy();
      expect(issues[0].details).toBeDefined();
      expect(issues[0].details?.found).toContain('collapsed');
    });

    it('should pass when primary action is outside collapsed section', () => {
      const root: StackNode = {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        gap: 16,
        children: [
          {
            id: 'toggle-advanced',
            type: 'Button',
            text: 'Show advanced',
          } as ButtonNode,
          {
            id: 'advanced',
            type: 'Box',
            padding: 16,
            behaviors: {
              disclosure: {
                collapsible: true,
                controlsId: 'toggle-advanced',
                defaultState: 'collapsed',
              },
            },
            child: {
              id: 'api-key',
              type: 'Field',
              label: 'API Key',
            } as Node,
          } as BoxNode,
          {
            id: 'save-btn',
            type: 'Button',
            text: 'Save',
            roleHint: 'primary',
          } as ButtonNode,
        ],
      };

      const rule = ProgressiveDisclosure.must.find((r) => r.id === 'disclosure-hides-primary');
      const issues = rule!.check(root);
      
      expect(issues).toHaveLength(0);
    });

    it('should pass when defaultState is expanded even with primary inside', () => {
      const root: StackNode = {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        gap: 16,
        children: [
          {
            id: 'toggle-advanced',
            type: 'Button',
            text: 'Hide advanced',
          } as ButtonNode,
          {
            id: 'advanced',
            type: 'Box',
            padding: 16,
            behaviors: {
              disclosure: {
                collapsible: true,
                controlsId: 'toggle-advanced',
                defaultState: 'expanded',
              },
            },
            child: {
              id: 'save-btn',
              type: 'Button',
              text: 'Save',
              roleHint: 'primary',
            } as ButtonNode,
          } as BoxNode,
        ],
      };

      const rule = ProgressiveDisclosure.must.find((r) => r.id === 'disclosure-hides-primary');
      const issues = rule!.check(root);
      
      expect(issues).toHaveLength(0);
    });
  });

  describe('PD-MUST-3: disclosure-missing-label', () => {
    it('should fail when collapsible has no label or summary', () => {
      const root: StackNode = {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        gap: 16,
        children: [
          {
            id: 'toggle-btn',
            type: 'Button',
            text: '+', // Too short to be meaningful (< 2 chars)
          } as ButtonNode,
          {
            id: 'advanced',
            type: 'Box',
            padding: 16,
            behaviors: {
              disclosure: {
                collapsible: true,
                controlsId: 'toggle-btn',
                defaultState: 'collapsed',
              },
            },
            child: {
              id: 'api-key',
              type: 'Field',
              label: 'API Key',
            } as Node,
          } as BoxNode,
        ],
      };

      const rule = ProgressiveDisclosure.must.find((r) => r.id === 'disclosure-missing-label');
      expect(rule).toBeDefined();
      
      const issues = rule!.check(root);
      
      expect(issues).toHaveLength(1);
      expect(issues[0].id).toBe('disclosure-missing-label');
      expect(issues[0].severity).toBe('error');
      expect(issues[0].nodeId).toBe('advanced');
      expect(issues[0].source?.pattern).toBe('Progressive.Disclosure');
      expect(issues[0].suggestion).toBeTruthy();
      expect(issues[0].details).toBeDefined();
    });

    it('should pass when control button has meaningful text', () => {
      const root: StackNode = {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        gap: 16,
        children: [
          {
            id: 'toggle-advanced',
            type: 'Button',
            text: 'Show advanced settings',
          } as ButtonNode,
          {
            id: 'advanced',
            type: 'Box',
            padding: 16,
            behaviors: {
              disclosure: {
                collapsible: true,
                controlsId: 'toggle-advanced',
                defaultState: 'collapsed',
              },
            },
            child: {
              id: 'api-key',
              type: 'Field',
              label: 'API Key',
            } as Node,
          } as BoxNode,
        ],
      };

      const rule = ProgressiveDisclosure.must.find((r) => r.id === 'disclosure-missing-label');
      const issues = rule!.check(root);
      
      expect(issues).toHaveLength(0);
    });

    it('should pass when sibling Text label exists', () => {
      const root: StackNode = {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        gap: 16,
        children: [
          {
            id: 'advanced-label',
            type: 'Text',
            text: 'Advanced Settings',
          } as TextNode,
          {
            id: 'advanced',
            type: 'Box',
            padding: 16,
            behaviors: {
              disclosure: {
                collapsible: true,
                controlsId: 'toggle-advanced',
                defaultState: 'collapsed',
              },
            },
            child: {
              id: 'api-key',
              type: 'Field',
              label: 'API Key',
            } as Node,
          } as BoxNode,
          {
            id: 'toggle-advanced',
            type: 'Button',
            text: 'Toggle',
          } as ButtonNode,
        ],
      };

      const rule = ProgressiveDisclosure.must.find((r) => r.id === 'disclosure-missing-label');
      const issues = rule!.check(root);
      
      expect(issues).toHaveLength(0);
    });
  });
});
