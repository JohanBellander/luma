import { describe, it, expect } from 'vitest';
import {
  parseAtKey,
  shallowMerge,
  applyResponsiveOverrides,
  applyResponsiveOverridesRecursive,
} from '../../../src/core/layout/responsive.js';

describe('responsive', () => {
  describe('parseAtKey', () => {
    it('should parse >=320 correctly', () => {
      const result = parseAtKey('>=320');
      expect(result).toEqual({ operator: '>=', value: 320 });
    });

    it('should parse <=768 correctly', () => {
      const result = parseAtKey('<=768');
      expect(result).toEqual({ operator: '<=', value: 768 });
    });

    it('should return null for invalid format', () => {
      expect(parseAtKey('invalid')).toBeNull();
      expect(parseAtKey('> 320')).toBeNull();
      expect(parseAtKey('320')).toBeNull();
      expect(parseAtKey('')).toBeNull();
    });

    it('should handle large viewport values', () => {
      const result = parseAtKey('>=1920');
      expect(result).toEqual({ operator: '>=', value: 1920 });
    });
  });

  describe('shallowMerge', () => {
    it('should merge simple objects', () => {
      const base = { a: 1, b: 2 };
      const override = { b: 3, c: 4 };
      const result = shallowMerge(base, override);

      expect(result).toEqual({ a: 1, b: 3, c: 4 });
    });

    it('should replace arrays completely', () => {
      const base = { items: [1, 2, 3] };
      const override = { items: [4, 5] };
      const result = shallowMerge(base, override);

      expect(result).toEqual({ items: [4, 5] });
    });

    it('should merge nested objects shallowly', () => {
      const base = { nested: { a: 1, b: 2 }, other: 'value' };
      const override = { nested: { b: 3, c: 4 } };
      const result = shallowMerge(base, override);

      expect(result).toEqual({
        nested: { a: 1, b: 3, c: 4 },
        other: 'value',
      });
    });

    it('should replace primitives', () => {
      const base = { value: 10 };
      const override = { value: 20 };
      const result = shallowMerge(base, override);

      expect(result).toEqual({ value: 20 });
    });

    it('should handle null/undefined override', () => {
      const base = { a: 1 };
      expect(shallowMerge(base, null)).toEqual({ a: 1 });
      expect(shallowMerge(base, undefined)).toEqual({ a: 1 });
    });

    it('should handle null/undefined base', () => {
      const override = { a: 1 };
      expect(shallowMerge(null, override)).toEqual({ a: 1 });
      expect(shallowMerge(undefined, override)).toEqual({ a: 1 });
    });

    it('should replace base array with override object', () => {
      const base = [1, 2, 3];
      const override = { a: 1 };
      const result = shallowMerge(base, override);

      expect(result).toEqual({ a: 1 });
    });
  });

  describe('applyResponsiveOverrides', () => {
    it('should return node unchanged if no at field', () => {
      const node = {
        id: 'test',
        type: 'Text',
        text: 'Hello',
      };

      const result = applyResponsiveOverrides(node, 768);
      expect(result).toEqual(node);
    });

    it('should apply >=320 override at viewport 768', () => {
      const node = {
        id: 'test',
        type: 'Text',
        text: 'Hello',
        fontSize: 16,
        at: {
          '>=320': {
            fontSize: 18,
          },
        },
      };

      const result = applyResponsiveOverrides(node, 768);

      expect(result.fontSize).toBe(18);
      expect(result.at).toBeUndefined();
    });

    it('should NOT apply >=768 override at viewport 320', () => {
      const node = {
        id: 'test',
        type: 'Text',
        text: 'Hello',
        fontSize: 16,
        at: {
          '>=768': {
            fontSize: 24,
          },
        },
      };

      const result = applyResponsiveOverrides(node, 320);

      expect(result.fontSize).toBe(16); // Original value
    });

    it('should apply <=768 override at viewport 320', () => {
      const node = {
        id: 'test',
        type: 'Stack',
        direction: 'horizontal',
        gap: 16,
        at: {
          '<=768': {
            direction: 'vertical',
            gap: 8,
          },
        },
      };

      const result = applyResponsiveOverrides(node, 320);

      expect(result.direction).toBe('vertical');
      expect(result.gap).toBe(8);
    });

    it('should NOT apply <=320 override at viewport 768', () => {
      const node = {
        id: 'test',
        type: 'Stack',
        direction: 'horizontal',
        at: {
          '<=320': {
            direction: 'vertical',
          },
        },
      };

      const result = applyResponsiveOverrides(node, 768);

      expect(result.direction).toBe('horizontal'); // Original value
    });

    it('should apply multiple >= overrides in ascending order', () => {
      const node = {
        id: 'test',
        type: 'Text',
        fontSize: 14,
        at: {
          '>=320': { fontSize: 16 },
          '>=768': { fontSize: 18 },
          '>=1024': { fontSize: 20 },
        },
      };

      const result = applyResponsiveOverrides(node, 1280);

      // All three apply, but >=1024 is last (largest)
      expect(result.fontSize).toBe(20);
    });

    it('should apply multiple <= overrides in descending order', () => {
      const node = {
        id: 'test',
        type: 'Text',
        fontSize: 20,
        at: {
          '<=1024': { fontSize: 18 },
          '<=768': { fontSize: 16 },
          '<=320': { fontSize: 14 },
        },
      };

      const result = applyResponsiveOverrides(node, 320);

      // All three apply, but <=320 is last (smallest)
      expect(result.fontSize).toBe(14);
    });

    it('should apply >= before <= (>= in ascending, <= in descending)', () => {
      const node = {
        id: 'test',
        type: 'Text',
        fontSize: 16,
        maxLines: 5,
        at: {
          '>=320': { fontSize: 18, maxLines: 3 },
          '<=768': { fontSize: 14, maxLines: 4 },
        },
      };

      const result = applyResponsiveOverrides(node, 640);

      // Both apply: >=320 first (fontSize: 18, maxLines: 3)
      // Then <=768 (fontSize: 14, maxLines: 4) - overwrites
      expect(result.fontSize).toBe(14);
      expect(result.maxLines).toBe(4);
    });

    it('should handle nested object overrides', () => {
      const node = {
        id: 'test',
        type: 'Text',
        minSize: { w: 100, h: 50 },
        at: {
          '>=768': {
            minSize: { w: 200 }, // Shallow merge with existing h
          },
        },
      };

      const result = applyResponsiveOverrides(node, 768);

      expect(result.minSize).toEqual({ w: 200, h: 50 });
    });

    it('should replace arrays in overrides', () => {
      const node = {
        id: 'test',
        type: 'Stack',
        children: [
          { id: 'child1', type: 'Text', text: 'A' },
          { id: 'child2', type: 'Text', text: 'B' },
        ],
        at: {
          '>=768': {
            children: [{ id: 'child1', type: 'Text', text: 'A' }], // Replace array
          },
        },
      };

      const result = applyResponsiveOverrides(node, 768);

      expect(result.children).toHaveLength(1);
      expect(result.children[0].text).toBe('A');
    });
  });

  describe('applyResponsiveOverridesRecursive', () => {
    it('should apply overrides to nested Stack children', () => {
      const node = {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        children: [
          {
            id: 'child1',
            type: 'Text',
            text: 'Hello',
            fontSize: 16,
            at: {
              '>=768': { fontSize: 20 },
            },
          },
          {
            id: 'child2',
            type: 'Text',
            text: 'World',
            fontSize: 14,
          },
        ],
      };

      const result = applyResponsiveOverridesRecursive(node as any, 768);

      expect(result.children[0].fontSize).toBe(20);
      expect(result.children[1].fontSize).toBe(14);
      expect(result.children[0].at).toBeUndefined();
    });

    it('should apply overrides to Box child', () => {
      const node = {
        id: 'box',
        type: 'Box',
        padding: 16,
        child: {
          id: 'text',
          type: 'Text',
          text: 'Content',
          fontSize: 16,
          at: {
            '>=768': { fontSize: 18 },
          },
        },
      };

      const result = applyResponsiveOverridesRecursive(node as any, 768);

      expect(result.child.fontSize).toBe(18);
      expect(result.child.at).toBeUndefined();
    });

    it('should apply overrides to Form fields and actions', () => {
      const node = {
        id: 'form',
        type: 'Form',
        fields: [
          {
            id: 'email',
            type: 'Field',
            label: 'Email',
            widthPolicy: 'hug',
            at: {
              '>=768': { widthPolicy: 'fill' },
            },
          },
        ],
        actions: [
          {
            id: 'submit',
            type: 'Button',
            text: 'Submit',
            minSize: { w: 100, h: 44 },
            at: {
              '>=768': { minSize: { w: 150 } },
            },
          },
        ],
        states: ['default'],
      };

      const result = applyResponsiveOverridesRecursive(node as any, 768);

      expect(result.fields[0].widthPolicy).toBe('fill');
      expect(result.actions[0].minSize).toEqual({ w: 150, h: 44 });
    });

    it('should handle deeply nested structures', () => {
      const node = {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        children: [
          {
            id: 'nested-stack',
            type: 'Stack',
            direction: 'horizontal',
            gap: 8,
            at: {
              '<=768': { direction: 'vertical' },
            },
            children: [
              {
                id: 'text',
                type: 'Text',
                text: 'Nested',
                fontSize: 16,
                at: {
                  '<=768': { fontSize: 14 },
                },
              },
            ],
          },
        ],
      };

      const result = applyResponsiveOverridesRecursive(node as any, 320);

      expect(result.children[0].direction).toBe('vertical');
      expect(result.children[0].children[0].fontSize).toBe(14);
    });
  });
});
