/**
 * Tests for Progressive Disclosure inference engine.
 * 
 * Per LUMA-52:
 * - Selection precedence (preceding > following > first child)
 * - Invisibility skip (visible:false nodes ignored)
 * - Keyword case-insensitivity
 * - Affordances fallback (chevron, details)
 */

import { describe, it, expect } from 'vitest';
import { findDisclosureControl } from '../../../src/core/patterns/disclosure-inference.js';
import type { Node, ButtonNode, BoxNode } from '../../../src/types/node.js';

describe('Progressive Disclosure Inference Engine', () => {
  describe('Selection precedence', () => {
    it('should prefer preceding sibling over following sibling', () => {
      const siblings: Node[] = [
        {
          id: 'before-btn',
          type: 'Button',
          text: 'Show details',
        } as ButtonNode,
        {
          id: 'collapsible',
          type: 'Box',
          behaviors: {
            disclosure: { collapsible: true },
          },
        } as BoxNode,
        {
          id: 'after-btn',
          type: 'Button',
          text: 'Expand more',
        } as ButtonNode,
      ];

      const collapsible = siblings[1];
      const control = findDisclosureControl(collapsible, siblings);

      expect(control).toBeTruthy();
      expect(control?.id).toBe('before-btn');
    });

    it('should choose closest preceding sibling when multiple exist', () => {
      const siblings: Node[] = [
        {
          id: 'far-btn',
          type: 'Button',
          text: 'Show far',
        } as ButtonNode,
        {
          id: 'near-btn',
          type: 'Button',
          text: 'Show near',
        } as ButtonNode,
        {
          id: 'collapsible',
          type: 'Box',
          behaviors: {
            disclosure: { collapsible: true },
          },
        } as BoxNode,
      ];

      const collapsible = siblings[2];
      const control = findDisclosureControl(collapsible, siblings);

      expect(control).toBeTruthy();
      expect(control?.id).toBe('near-btn');
    });

    it('should choose following sibling when no preceding exists', () => {
      const siblings: Node[] = [
        {
          id: 'collapsible',
          type: 'Box',
          behaviors: {
            disclosure: { collapsible: true },
          },
        } as BoxNode,
        {
          id: 'after-btn',
          type: 'Button',
          text: 'Expand',
        } as ButtonNode,
      ];

      const collapsible = siblings[0];
      const control = findDisclosureControl(collapsible, siblings);

      expect(control).toBeTruthy();
      expect(control?.id).toBe('after-btn');
    });

    it('should choose closest following sibling when multiple exist', () => {
      const siblings: Node[] = [
        {
          id: 'collapsible',
          type: 'Box',
          behaviors: {
            disclosure: { collapsible: true },
          },
        } as BoxNode,
        {
          id: 'near-btn',
          type: 'Button',
          text: 'Show near',
        } as ButtonNode,
        {
          id: 'far-btn',
          type: 'Button',
          text: 'Show far',
        } as ButtonNode,
      ];

      const collapsible = siblings[0];
      const control = findDisclosureControl(collapsible, siblings);

      expect(control).toBeTruthy();
      expect(control?.id).toBe('near-btn');
    });

    it('should check first child when no siblings match', () => {
      const collapsible: BoxNode = {
        id: 'collapsible',
        type: 'Box',
        behaviors: {
          disclosure: { collapsible: true },
        },
        child: {
          id: 'header-btn',
          type: 'Button',
          text: 'Collapse',
        } as ButtonNode,
      };

      const siblings: Node[] = [collapsible];
      const control = findDisclosureControl(collapsible, siblings);

      expect(control).toBeTruthy();
      expect(control?.id).toBe('header-btn');
    });
  });

  describe('Invisibility skip', () => {
    it('should skip invisible preceding sibling', () => {
      const siblings: Node[] = [
        {
          id: 'invisible-btn',
          type: 'Button',
          text: 'Show details',
          visible: false,
        } as ButtonNode,
        {
          id: 'visible-btn',
          type: 'Button',
          text: 'Expand',
        } as ButtonNode,
        {
          id: 'collapsible',
          type: 'Box',
          behaviors: {
            disclosure: { collapsible: true },
          },
        } as BoxNode,
      ];

      const collapsible = siblings[2];
      const control = findDisclosureControl(collapsible, siblings);

      expect(control).toBeTruthy();
      expect(control?.id).toBe('visible-btn');
    });

    it('should skip invisible following sibling', () => {
      const siblings: Node[] = [
        {
          id: 'collapsible',
          type: 'Box',
          behaviors: {
            disclosure: { collapsible: true },
          },
        } as BoxNode,
        {
          id: 'invisible-btn',
          type: 'Button',
          text: 'Show details',
          visible: false,
        } as ButtonNode,
        {
          id: 'visible-btn',
          type: 'Button',
          text: 'Expand',
        } as ButtonNode,
      ];

      const collapsible = siblings[0];
      const control = findDisclosureControl(collapsible, siblings);

      expect(control).toBeTruthy();
      expect(control?.id).toBe('visible-btn');
    });

    it('should return null when all controls are invisible', () => {
      const siblings: Node[] = [
        {
          id: 'invisible-btn',
          type: 'Button',
          text: 'Show details',
          visible: false,
        } as ButtonNode,
        {
          id: 'collapsible',
          type: 'Box',
          behaviors: {
            disclosure: { collapsible: true },
          },
        } as BoxNode,
      ];

      const collapsible = siblings[1];
      const control = findDisclosureControl(collapsible, siblings);

      expect(control).toBeNull();
    });
  });

  describe('Keyword case-insensitivity', () => {
    const keywords = ['show', 'hide', 'expand', 'collapse', 'advanced', 'details', 'more'];

    keywords.forEach((keyword) => {
      it(`should match keyword "${keyword}" in lowercase`, () => {
        const siblings: Node[] = [
          {
            id: 'btn',
            type: 'Button',
            text: `Click to ${keyword}`,
          } as ButtonNode,
          {
            id: 'collapsible',
            type: 'Box',
            behaviors: {
              disclosure: { collapsible: true },
            },
          } as BoxNode,
        ];

        const collapsible = siblings[1];
        const control = findDisclosureControl(collapsible, siblings);

        expect(control).toBeTruthy();
        expect(control?.id).toBe('btn');
      });

      it(`should match keyword "${keyword.toUpperCase()}" in uppercase`, () => {
        const siblings: Node[] = [
          {
            id: 'btn',
            type: 'Button',
            text: `Click to ${keyword.toUpperCase()}`,
          } as ButtonNode,
          {
            id: 'collapsible',
            type: 'Box',
            behaviors: {
              disclosure: { collapsible: true },
            },
          } as BoxNode,
        ];

        const collapsible = siblings[1];
        const control = findDisclosureControl(collapsible, siblings);

        expect(control).toBeTruthy();
        expect(control?.id).toBe('btn');
      });

      it(`should match keyword "${keyword}" in mixed case`, () => {
        const mixedCase = keyword.charAt(0).toUpperCase() + keyword.slice(1).toLowerCase();
        const siblings: Node[] = [
          {
            id: 'btn',
            type: 'Button',
            text: `Click to ${mixedCase}`,
          } as ButtonNode,
          {
            id: 'collapsible',
            type: 'Box',
            behaviors: {
              disclosure: { collapsible: true },
            },
          } as BoxNode,
        ];

        const collapsible = siblings[1];
        const control = findDisclosureControl(collapsible, siblings);

        expect(control).toBeTruthy();
        expect(control?.id).toBe('btn');
      });
    });

    it('should match keywords as whole words only', () => {
      // "showing" should not match "show" keyword
      const siblings: Node[] = [
        {
          id: 'btn',
          type: 'Button',
          text: 'showing results',
        } as ButtonNode,
        {
          id: 'collapsible',
          type: 'Box',
          behaviors: {
            disclosure: { collapsible: true },
          },
        } as BoxNode,
      ];

      const collapsible = siblings[1];
      const control = findDisclosureControl(collapsible, siblings);

      expect(control).toBeNull();
    });
  });

  describe('Affordances fallback', () => {
    it('should match "chevron" affordance', () => {
      const siblings: Node[] = [
        {
          id: 'btn',
          type: 'Button',
          text: 'Toggle',
          affordances: ['chevron'],
        } as ButtonNode,
        {
          id: 'collapsible',
          type: 'Box',
          behaviors: {
            disclosure: { collapsible: true },
          },
        } as BoxNode,
      ];

      const collapsible = siblings[1];
      const control = findDisclosureControl(collapsible, siblings);

      expect(control).toBeTruthy();
      expect(control?.id).toBe('btn');
    });

    it('should match "details" affordance', () => {
      const siblings: Node[] = [
        {
          id: 'btn',
          type: 'Button',
          text: 'Toggle',
          affordances: ['details'],
        } as ButtonNode,
        {
          id: 'collapsible',
          type: 'Box',
          behaviors: {
            disclosure: { collapsible: true },
          },
        } as BoxNode,
      ];

      const collapsible = siblings[1];
      const control = findDisclosureControl(collapsible, siblings);

      expect(control).toBeTruthy();
      expect(control?.id).toBe('btn');
    });

    it('should prefer keyword match over affordance', () => {
      const siblings: Node[] = [
        {
          id: 'affordance-btn',
          type: 'Button',
          text: 'Toggle',
          affordances: ['chevron'],
        } as ButtonNode,
        {
          id: 'keyword-btn',
          type: 'Button',
          text: 'Show details',
        } as ButtonNode,
        {
          id: 'collapsible',
          type: 'Box',
          behaviors: {
            disclosure: { collapsible: true },
          },
        } as BoxNode,
      ];

      const collapsible = siblings[2];
      const control = findDisclosureControl(collapsible, siblings);

      expect(control).toBeTruthy();
      // Closest preceding with keyword should win
      expect(control?.id).toBe('keyword-btn');
    });

    it('should ignore non-matching affordances', () => {
      const siblings: Node[] = [
        {
          id: 'btn',
          type: 'Button',
          text: 'Toggle',
          affordances: ['icon', 'rounded'],
        } as ButtonNode,
        {
          id: 'collapsible',
          type: 'Box',
          behaviors: {
            disclosure: { collapsible: true },
          },
        } as BoxNode,
      ];

      const collapsible = siblings[1];
      const control = findDisclosureControl(collapsible, siblings);

      expect(control).toBeNull();
    });
  });

  describe('Edge cases', () => {
    it('should return null when no siblings provided', () => {
      const collapsible: BoxNode = {
        id: 'collapsible',
        type: 'Box',
        behaviors: {
          disclosure: { collapsible: true },
        },
      };

      const control = findDisclosureControl(collapsible, undefined);

      expect(control).toBeNull();
    });

    it('should return null when node not in siblings', () => {
      const collapsible: BoxNode = {
        id: 'collapsible',
        type: 'Box',
        behaviors: {
          disclosure: { collapsible: true },
        },
      };

      const siblings: Node[] = [
        {
          id: 'other-node',
          type: 'Box',
        } as BoxNode,
      ];

      const control = findDisclosureControl(collapsible, siblings);

      expect(control).toBeNull();
    });

    it('should ignore non-Button nodes', () => {
      const siblings: Node[] = [
        {
          id: 'text-node',
          type: 'Text',
          text: 'Show details',
        },
        {
          id: 'collapsible',
          type: 'Box',
          behaviors: {
            disclosure: { collapsible: true },
          },
        } as BoxNode,
      ];

      const collapsible = siblings[1];
      const control = findDisclosureControl(collapsible, siblings);

      expect(control).toBeNull();
    });

    it('should handle button without text property', () => {
      const siblings: Node[] = [
        {
          id: 'icon-btn',
          type: 'Button',
          affordances: ['chevron'],
        } as ButtonNode,
        {
          id: 'collapsible',
          type: 'Box',
          behaviors: {
            disclosure: { collapsible: true },
          },
        } as BoxNode,
      ];

      const collapsible = siblings[1];
      const control = findDisclosureControl(collapsible, siblings);

      expect(control).toBeTruthy();
      expect(control?.id).toBe('icon-btn');
    });
  });
});
