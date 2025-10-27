import { describe, it, expect } from 'vitest';
import { isFocusable, filterFocusable, getTabIndex } from '../../../src/core/keyboard/focusable.js';
import type { Node } from '../../../src/types/node.js';

describe('focusable', () => {
  describe('isFocusable', () => {
    it('should return true for Button nodes by default', () => {
      const node: Node = { id: 'b1', type: 'Button', text: 'Click' };
      expect(isFocusable(node)).toBe(true);
    });

    it('should return false for Button with focusable: false', () => {
      const node: Node = { id: 'b1', type: 'Button', text: 'Click', focusable: false };
      expect(isFocusable(node)).toBe(false);
    });

    it('should return true for Button with explicit focusable: true', () => {
      const node: Node = { id: 'b1', type: 'Button', text: 'Click', focusable: true };
      expect(isFocusable(node)).toBe(true);
    });

    it('should return true for Field nodes', () => {
      const node: Node = { id: 'f1', type: 'Field', label: 'Name' };
      expect(isFocusable(node)).toBe(true);
    });

    it('should return true for any node with focusable: true', () => {
      const node: Node = { id: 'txt', type: 'Text', text: 'Hello', focusable: true } as Node;
      expect(isFocusable(node)).toBe(true);
    });

    it('should return false for Text without focusable', () => {
      const node: Node = { id: 'txt', type: 'Text', text: 'Hello' };
      expect(isFocusable(node)).toBe(false);
    });

    it('should return false for Box without focusable', () => {
      const node: Node = { id: 'box', type: 'Box', child: { id: 'inner', type: 'Text', text: 'Hi' } };
      expect(isFocusable(node)).toBe(false);
    });

    it('should return false for Stack without focusable', () => {
      const node: Node = {
        id: 'stack',
        type: 'Stack',
        direction: 'vertical',
        children: [],
      };
      expect(isFocusable(node)).toBe(false);
    });

    it('should return false for Grid without focusable', () => {
      const node: Node = {
        id: 'grid',
        type: 'Grid',
        columns: 2,
        children: [],
      };
      expect(isFocusable(node)).toBe(false);
    });

    it('should return false for Form without focusable', () => {
      const node: Node = {
        id: 'form',
        type: 'Form',
        states: ['default'],
        fields: [{ id: 'f1', type: 'Field', label: 'Name' }],
        actions: [{ id: 'a1', type: 'Button', text: 'Submit' }],
      };
      expect(isFocusable(node)).toBe(false);
    });
  });

  describe('filterFocusable', () => {
    it('should filter to only focusable nodes', () => {
      const nodes: Node[] = [
        { id: 'b1', type: 'Button', text: 'Click' },
        { id: 't1', type: 'Text', text: 'Hello' },
        { id: 'f1', type: 'Field', label: 'Name' },
        { id: 'b2', type: 'Button', text: 'Skip', focusable: false },
      ];

      const focusable = filterFocusable(nodes);
      expect(focusable.map((n) => n.id)).toEqual(['b1', 'f1']);
    });

    it('should return empty array when no focusable nodes', () => {
      const nodes: Node[] = [
        { id: 't1', type: 'Text', text: 'Hello' },
        { id: 'box', type: 'Box', child: { id: 'inner', type: 'Text', text: 'Hi' } },
      ];

      const focusable = filterFocusable(nodes);
      expect(focusable).toEqual([]);
    });

    it('should handle empty input array', () => {
      const focusable = filterFocusable([]);
      expect(focusable).toEqual([]);
    });
  });

  describe('getTabIndex', () => {
    it('should return tabIndex when specified', () => {
      const node: Node = { id: 'b1', type: 'Button', text: 'Click', tabIndex: 5 };
      expect(getTabIndex(node)).toBe(5);
    });

    it('should return 0 when tabIndex not specified', () => {
      const node: Node = { id: 'b1', type: 'Button', text: 'Click' };
      expect(getTabIndex(node)).toBe(0);
    });

    it('should handle negative tabIndex', () => {
      const node: Node = { id: 'b1', type: 'Button', text: 'Click', tabIndex: -1 };
      expect(getTabIndex(node)).toBe(-1);
    });

    it('should handle zero tabIndex explicitly', () => {
      const node: Node = { id: 'b1', type: 'Button', text: 'Click', tabIndex: 0 };
      expect(getTabIndex(node)).toBe(0);
    });
  });
});
