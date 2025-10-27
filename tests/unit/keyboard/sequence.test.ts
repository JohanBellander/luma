import { describe, it, expect } from 'vitest';
import { buildTabSequence, getAllFocusableIds } from '../../../src/core/keyboard/sequence.js';
import type { Node } from '../../../src/types/node.js';

describe('sequence', () => {
  describe('buildTabSequence', () => {
    it('should build sequence in document order for tabIndex 0', () => {
      const root: Node = {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        children: [
          { id: 'b1', type: 'Button', text: 'First' },
          { id: 'f1', type: 'Field', label: 'Field' },
          { id: 'b2', type: 'Button', text: 'Second' },
        ],
      };

      const sequence = buildTabSequence(root);
      expect(sequence).toEqual(['b1', 'f1', 'b2']);
    });

    it('should place positive tabIndex nodes before tabIndex 0 nodes', () => {
      const root: Node = {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        children: [
          { id: 'b1', type: 'Button', text: 'Third', tabIndex: 0 },
          { id: 'b2', type: 'Button', text: 'First', tabIndex: 1 },
          { id: 'b3', type: 'Button', text: 'Second', tabIndex: 2 },
        ],
      };

      const sequence = buildTabSequence(root);
      expect(sequence).toEqual(['b2', 'b3', 'b1']);
    });

    it('should exclude negative tabIndex nodes', () => {
      const root: Node = {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        children: [
          { id: 'b1', type: 'Button', text: 'First' },
          { id: 'b2', type: 'Button', text: 'Skip', tabIndex: -1 },
          { id: 'b3', type: 'Button', text: 'Second' },
        ],
      };

      const sequence = buildTabSequence(root);
      expect(sequence).toEqual(['b1', 'b3']);
    });

    it('should handle Form fields and actions', () => {
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

      const sequence = buildTabSequence(root);
      expect(sequence).toEqual(['f1', 'f2', 'submit', 'cancel']);
    });

    it('should skip non-focusable nodes', () => {
      const root: Node = {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        children: [
          { id: 'b1', type: 'Button', text: 'First' },
          { id: 't1', type: 'Text', text: 'Not focusable' },
          { id: 'b2', type: 'Button', text: 'Second' },
          { id: 'b3', type: 'Button', text: 'Skip', focusable: false },
          { id: 'f1', type: 'Field', label: 'Third' },
        ],
      };

      const sequence = buildTabSequence(root);
      expect(sequence).toEqual(['b1', 'b2', 'f1']);
    });

    it('should return empty sequence when no focusable nodes', () => {
      const root: Node = {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        children: [
          { id: 't1', type: 'Text', text: 'Text 1' },
          { id: 't2', type: 'Text', text: 'Text 2' },
        ],
      };

      const sequence = buildTabSequence(root);
      expect(sequence).toEqual([]);
    });

    it('should handle visible: false nodes', () => {
      const root: Node = {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        children: [
          { id: 'b1', type: 'Button', text: 'First' },
          { id: 'b2', type: 'Button', text: 'Hidden', visible: false },
          { id: 'b3', type: 'Button', text: 'Second' },
        ],
      };

      const sequence = buildTabSequence(root);
      expect(sequence).toEqual(['b1', 'b3']);
    });
  });

  describe('getAllFocusableIds', () => {
    it('should return all focusable IDs including negative tabIndex', () => {
      const root: Node = {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        children: [
          { id: 'b1', type: 'Button', text: 'First' },
          { id: 'b2', type: 'Button', text: 'Skip Tab', tabIndex: -1 },
          { id: 't1', type: 'Text', text: 'Not focusable' },
          { id: 'f1', type: 'Field', label: 'Field' },
        ],
      };

      const ids = getAllFocusableIds(root);
      expect(ids).toEqual(['b1', 'b2', 'f1']);
    });

    it('should handle empty tree', () => {
      const root: Node = {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        children: [],
      };

      const ids = getAllFocusableIds(root);
      expect(ids).toEqual([]);
    });
  });
});
