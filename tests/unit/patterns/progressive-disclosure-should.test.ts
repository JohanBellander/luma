/**
 * Unit tests for Progressive Disclosure pattern SHOULD rules (PD-SHOULD-1..3)
 */

import { describe, it, expect } from 'vitest';
import { ProgressiveDisclosure } from '../../../src/core/patterns/progressive-disclosure.js';
import type { Node, StackNode, ButtonNode, BoxNode, TextNode, FieldNode } from '../../../src/types/node.js';

describe('Progressive Disclosure SHOULD rules', () => {
  describe('PD-SHOULD-1: disclosure-control-far', () => {
    it('should warn when control is not adjacent to collapsible section', () => {
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
            id: 'spacer-1',
            type: 'Text',
            text: 'Some content',
          } as TextNode,
          {
            id: 'spacer-2',
            type: 'Text',
            text: 'More content',
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
            } as FieldNode,
          } as BoxNode,
        ],
      };

      const rule = ProgressiveDisclosure.should.find((r) => r.id === 'disclosure-control-far');
      expect(rule).toBeDefined();
      
      const issues = rule!.check(root);
      
      expect(issues).toHaveLength(1);
      expect(issues[0].id).toBe('disclosure-control-far');
      expect(issues[0].severity).toBe('warn');
      expect(issues[0].nodeId).toBe('advanced');
      expect(issues[0].source?.pattern).toBe('Progressive.Disclosure');
      expect(issues[0].suggestion).toBeTruthy();
      expect(issues[0].details).toBeDefined();
      expect(issues[0].details?.controlId).toBe('toggle-advanced');
    });

    it('should NOT warn when control is adjacent to collapsible section', () => {
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
            } as FieldNode,
          } as BoxNode,
        ],
      };

      const rule = ProgressiveDisclosure.should.find((r) => r.id === 'disclosure-control-far');
      expect(rule).toBeDefined();
      
      const issues = rule!.check(root);
      
      expect(issues).toHaveLength(0);
    });

    it('should NOT warn when control is immediately after collapsible section', () => {
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
                controlsId: 'toggle-advanced',
                defaultState: 'collapsed',
              },
            },
            child: {
              id: 'api-key',
              type: 'Field',
              label: 'API Key',
            } as FieldNode,
          } as BoxNode,
          {
            id: 'toggle-advanced',
            type: 'Button',
            text: 'Show advanced',
          } as ButtonNode,
        ],
      };

      const rule = ProgressiveDisclosure.should.find((r) => r.id === 'disclosure-control-far');
      expect(rule).toBeDefined();
      
      const issues = rule!.check(root);
      
      expect(issues).toHaveLength(0);
    });
  });

  describe('PD-SHOULD-2: disclosure-inconsistent-affordance', () => {
    it('should warn when multiple collapsibles have inconsistent affordances', () => {
      const root: StackNode = {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        gap: 16,
        children: [
          {
            id: 'toggle-section1',
            type: 'Button',
            text: 'Show section 1',
          } as ButtonNode,
          {
            id: 'section1',
            type: 'Box',
            padding: 16,
            behaviors: {
              disclosure: {
                collapsible: true,
                controlsId: 'toggle-section1',
                defaultState: 'collapsed',
              },
            },
            affordances: ['chevron'],
            child: {
              id: 'content1',
              type: 'Text',
              text: 'Section 1 content',
            } as TextNode,
          } as any,
          {
            id: 'toggle-section2',
            type: 'Button',
            text: 'Show section 2',
          } as ButtonNode,
          {
            id: 'section2',
            type: 'Box',
            padding: 16,
            behaviors: {
              disclosure: {
                collapsible: true,
                controlsId: 'toggle-section2',
                defaultState: 'collapsed',
              },
            },
            affordances: ['details'],
            child: {
              id: 'content2',
              type: 'Text',
              text: 'Section 2 content',
            } as TextNode,
          } as any,
        ],
      };

      const rule = ProgressiveDisclosure.should.find((r) => r.id === 'disclosure-inconsistent-affordance');
      expect(rule).toBeDefined();
      
      const issues = rule!.check(root);
      
      expect(issues).toHaveLength(1);
      expect(issues[0].id).toBe('disclosure-inconsistent-affordance');
      expect(issues[0].severity).toBe('warn');
      expect(issues[0].source?.pattern).toBe('Progressive.Disclosure');
      expect(issues[0].suggestion).toBeTruthy();
      expect(issues[0].details).toBeDefined();
      expect(issues[0].details?.collapsibleIds).toContain('section1');
      expect(issues[0].details?.collapsibleIds).toContain('section2');
    });

    it('should NOT warn when multiple collapsibles have shared affordances', () => {
      const root: StackNode = {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        gap: 16,
        children: [
          {
            id: 'toggle-section1',
            type: 'Button',
            text: 'Show section 1',
          } as ButtonNode,
          {
            id: 'section1',
            type: 'Box',
            padding: 16,
            behaviors: {
              disclosure: {
                collapsible: true,
                controlsId: 'toggle-section1',
                defaultState: 'collapsed',
              },
            },
            affordances: ['chevron', 'accordion'],
            child: {
              id: 'content1',
              type: 'Text',
              text: 'Section 1 content',
            } as TextNode,
          } as any,
          {
            id: 'toggle-section2',
            type: 'Button',
            text: 'Show section 2',
          } as ButtonNode,
          {
            id: 'section2',
            type: 'Box',
            padding: 16,
            behaviors: {
              disclosure: {
                collapsible: true,
                controlsId: 'toggle-section2',
                defaultState: 'collapsed',
              },
            },
            affordances: ['chevron', 'details'],
            child: {
              id: 'content2',
              type: 'Text',
              text: 'Section 2 content',
            } as TextNode,
          } as any,
        ],
      };

      const rule = ProgressiveDisclosure.should.find((r) => r.id === 'disclosure-inconsistent-affordance');
      expect(rule).toBeDefined();
      
      const issues = rule!.check(root);
      
      expect(issues).toHaveLength(0);
    });

    it('should NOT warn when only one collapsible has affordances', () => {
      const root: StackNode = {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        gap: 16,
        children: [
          {
            id: 'toggle-section1',
            type: 'Button',
            text: 'Show section 1',
          } as ButtonNode,
          {
            id: 'section1',
            type: 'Box',
            padding: 16,
            behaviors: {
              disclosure: {
                collapsible: true,
                controlsId: 'toggle-section1',
                defaultState: 'collapsed',
              },
            },
            affordances: ['chevron'],
            child: {
              id: 'content1',
              type: 'Text',
              text: 'Section 1 content',
            } as TextNode,
          } as any,
          {
            id: 'toggle-section2',
            type: 'Button',
            text: 'Show section 2',
          } as ButtonNode,
          {
            id: 'section2',
            type: 'Box',
            padding: 16,
            behaviors: {
              disclosure: {
                collapsible: true,
                controlsId: 'toggle-section2',
                defaultState: 'collapsed',
              },
            },
            child: {
              id: 'content2',
              type: 'Text',
              text: 'Section 2 content',
            } as TextNode,
          } as any,
        ],
      };

      const rule = ProgressiveDisclosure.should.find((r) => r.id === 'disclosure-inconsistent-affordance');
      expect(rule).toBeDefined();
      
      const issues = rule!.check(root);
      
      expect(issues).toHaveLength(0);
    });
  });

  describe('PD-SHOULD-3: disclosure-early-section', () => {
    it('should warn when collapsible appears before first required field', () => {
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
              id: 'optional-field',
              type: 'Field',
              label: 'Optional setting',
            } as FieldNode,
          } as BoxNode,
          {
            id: 'name-field',
            type: 'Field',
            label: 'Name',
            required: true,
          } as FieldNode,
          {
            id: 'submit-btn',
            type: 'Button',
            text: 'Submit',
            roleHint: 'primary',
          } as ButtonNode,
        ],
      };

      const rule = ProgressiveDisclosure.should.find((r) => r.id === 'disclosure-early-section');
      expect(rule).toBeDefined();
      
      const issues = rule!.check(root);
      
      expect(issues).toHaveLength(1);
      expect(issues[0].id).toBe('disclosure-early-section');
      expect(issues[0].severity).toBe('warn');
      expect(issues[0].nodeId).toBe('advanced');
      expect(issues[0].source?.pattern).toBe('Progressive.Disclosure');
      expect(issues[0].suggestion).toBeTruthy();
      expect(issues[0].details).toBeDefined();
      expect(issues[0].details?.firstRequiredFieldId).toBe('name-field');
    });

    it('should NOT warn when collapsible appears after required fields', () => {
      const root: StackNode = {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        gap: 16,
        children: [
          {
            id: 'name-field',
            type: 'Field',
            label: 'Name',
            required: true,
          } as FieldNode,
          {
            id: 'email-field',
            type: 'Field',
            label: 'Email',
            required: true,
          } as FieldNode,
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
              id: 'optional-field',
              type: 'Field',
              label: 'Optional setting',
            } as FieldNode,
          } as BoxNode,
          {
            id: 'submit-btn',
            type: 'Button',
            text: 'Submit',
            roleHint: 'primary',
          } as ButtonNode,
        ],
      };

      const rule = ProgressiveDisclosure.should.find((r) => r.id === 'disclosure-early-section');
      expect(rule).toBeDefined();
      
      const issues = rule!.check(root);
      
      expect(issues).toHaveLength(0);
    });

    it('should NOT warn when no required fields exist', () => {
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
              id: 'optional-field',
              type: 'Field',
              label: 'Optional setting',
            } as FieldNode,
          } as BoxNode,
          {
            id: 'submit-btn',
            type: 'Button',
            text: 'Submit',
          } as ButtonNode,
        ],
      };

      const rule = ProgressiveDisclosure.should.find((r) => r.id === 'disclosure-early-section');
      expect(rule).toBeDefined();
      
      const issues = rule!.check(root);
      
      expect(issues).toHaveLength(0);
    });
  });
});
