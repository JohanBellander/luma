import { describe, it, expect } from 'vitest';
import { normalizeNode, normalizeScaffold } from '../../../src/core/ingest/normalize.js';

describe('normalize', () => {
  describe('normalizeNode', () => {
    it('should apply default values to base node fields', () => {
      const node = {
        id: 'test-1',
        type: 'Text',
        text: 'Hello',
      };

      const normalized = normalizeNode(node);

      expect(normalized.visible).toBe(true);
      expect(normalized.widthPolicy).toBe('hug');
      expect(normalized.heightPolicy).toBe('hug');
    });

    it('should preserve existing values', () => {
      const node = {
        id: 'test-1',
        type: 'Text',
        text: 'Hello',
        visible: false,
        widthPolicy: 'fill' as const,
      };

      const normalized = normalizeNode(node);

      expect(normalized.visible).toBe(false);
      expect(normalized.widthPolicy).toBe('fill');
    });

    it('should apply Stack-specific defaults', () => {
      const node = {
        id: 'stack-1',
        type: 'Stack',
        direction: 'vertical' as const,
        children: [],
      };

      const normalized = normalizeNode(node);

      expect(normalized.gap).toBe(0);
      expect(normalized.padding).toBe(0);
      expect(normalized.align).toBe('start');
      expect(normalized.wrap).toBe(false);
    });

    it('should apply Text-specific defaults', () => {
      const node = {
        id: 'text-1',
        type: 'Text',
        text: 'Hello',
      };

      const normalized = normalizeNode(node);

      expect(normalized.fontSize).toBe(16);
    });

    it('should apply Button-specific defaults', () => {
      const node = {
        id: 'btn-1',
        type: 'Button',
        text: 'Click me',
      };

      const normalized = normalizeNode(node);

      expect(normalized.focusable).toBe(true);
    });

    it('should normalize nested children', () => {
      const node = {
        id: 'stack-1',
        type: 'Stack',
        direction: 'vertical' as const,
        children: [
          {
            id: 'text-1',
            type: 'Text',
            text: 'Hello',
          },
        ],
      };

      const normalized = normalizeNode(node);

      expect(normalized.children[0].fontSize).toBe(16);
      expect(normalized.children[0].visible).toBe(true);
    });
  });

  describe('normalizeScaffold', () => {
    it('should normalize the entire scaffold', () => {
      const scaffold = {
        schemaVersion: '1.0.0',
        screen: {
          id: 'screen-1',
          title: 'Test',
          root: {
            id: 'root-1',
            type: 'Stack',
            direction: 'vertical',
            children: [],
          },
        },
        settings: {
          spacingScale: [4, 8, 16],
          minTouchTarget: { w: 44, h: 44 },
          breakpoints: ['320x640'],
        },
      };

      const normalized = normalizeScaffold(scaffold);

      expect(normalized.screen.root.gap).toBe(0);
      expect(normalized.screen.root.visible).toBe(true);
    });
  });
});
