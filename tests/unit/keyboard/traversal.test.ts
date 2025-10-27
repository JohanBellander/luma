import { describe, it, expect } from 'vitest';
import { traversePreOrder, collectNodeIds } from '../../../src/core/keyboard/traversal.js';
import type { Node } from '../../../src/types/node.js';

describe('traversal', () => {
  describe('traversePreOrder', () => {
    it('should traverse simple flat list in pre-order', () => {
      const root: Node = {
        id: 'root',
        type: 'Box',
        child: {
          id: 'c1',
          type: 'Stack',
          direction: 'vertical',
          children: [
            { id: 'b1', type: 'Button', text: 'First' },
            { id: 'b2', type: 'Button', text: 'Second' },
          ],
        },
      };

      const nodes = traversePreOrder(root);
      expect(nodes.map((n) => n.id)).toEqual(['root', 'c1', 'b1', 'b2']);
    });

    it('should traverse nested structure in pre-order', () => {
      const root: Node = {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        children: [
          {
            id: 'container1',
            type: 'Box',
            child: {
              id: 'inner1',
              type: 'Button',
              text: 'Button 1',
            },
          },
          {
            id: 'container2',
            type: 'Stack',
            direction: 'horizontal',
            children: [
              { id: 'inner2', type: 'Button', text: 'Button 2' },
              { id: 'inner3', type: 'Button', text: 'Button 3' },
            ],
          },
        ],
      };

      const nodes = traversePreOrder(root);
      expect(nodes.map((n) => n.id)).toEqual(['root', 'container1', 'inner1', 'container2', 'inner2', 'inner3']);
    });

    it('should traverse Form fields and actions in pre-order', () => {
      const root: Node = {
        id: 'form',
        type: 'Form',
        states: ['default'],
        fields: [
          { id: 'f1', type: 'Field', label: 'Username' },
          { id: 'f2', type: 'Field', label: 'Password' },
        ],
        actions: [
          { id: 'a1', type: 'Button', text: 'Submit', roleHint: 'primary' },
          { id: 'a2', type: 'Button', text: 'Cancel' },
        ],
      };

      const nodes = traversePreOrder(root);
      expect(nodes.map((n) => n.id)).toEqual(['form', 'f1', 'f2', 'a1', 'a2']);
    });

    it('should skip nodes with visible: false', () => {
      const root: Node = {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        children: [
          { id: 'b1', type: 'Button', text: 'Visible' },
          { id: 'b2', type: 'Button', text: 'Hidden', visible: false },
          { id: 'b3', type: 'Button', text: 'Also Visible' },
        ],
      };

      const nodes = traversePreOrder(root);
      expect(nodes.map((n) => n.id)).toEqual(['root', 'b1', 'b3']);
    });

    it('should skip entire subtrees when parent has visible: false', () => {
      const root: Node = {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        children: [
          { id: 'b1', type: 'Button', text: 'Visible' },
          {
            id: 'hidden-container',
            type: 'Box',
            visible: false,
            child: {
              id: 'child-of-hidden',
              type: 'Button',
              text: 'Should not appear',
            },
          },
          { id: 'b2', type: 'Button', text: 'Also Visible' },
        ],
      };

      const nodes = traversePreOrder(root);
      expect(nodes.map((n) => n.id)).toEqual(['root', 'b1', 'b2']);
    });

    it('should handle single child containers', () => {
      const root: Node = {
        id: 'box1',
        type: 'Box',
        child: {
          id: 'box2',
          type: 'Box',
          child: {
            id: 'button',
            type: 'Button',
            text: 'Deep Button',
          },
        },
      };

      const nodes = traversePreOrder(root);
      expect(nodes.map((n) => n.id)).toEqual(['box1', 'box2', 'button']);
    });

    it('should handle empty children arrays', () => {
      const root: Node = {
        id: 'stack',
        type: 'Stack',
        direction: 'vertical',
        children: [],
      };

      const nodes = traversePreOrder(root);
      expect(nodes.map((n) => n.id)).toEqual(['stack']);
    });
  });

  describe('collectNodeIds', () => {
    it('should collect all node IDs in pre-order', () => {
      const root: Node = {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        children: [
          { id: 'b1', type: 'Button', text: 'Button 1' },
          { id: 'b2', type: 'Button', text: 'Button 2' },
        ],
      };

      const ids = collectNodeIds(root);
      expect(ids).toEqual(['root', 'b1', 'b2']);
    });

    it('should respect visible: false when collecting IDs', () => {
      const root: Node = {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        children: [
          { id: 'b1', type: 'Button', text: 'Visible' },
          { id: 'b2', type: 'Button', text: 'Hidden', visible: false },
        ],
      };

      const ids = collectNodeIds(root);
      expect(ids).toEqual(['root', 'b1']);
    });
  });
});
