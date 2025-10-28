import { describe, it, expect } from 'vitest';
import { generateScaffold, parseBreakpoints } from '../src/core/scaffold/generator.js';
import { getAvailablePatterns, getPattern } from '../src/core/scaffold/patterns.js';
import { ingest } from '../src/core/ingest/ingest.js';

describe('scaffold generator', () => {
  describe('generateScaffold', () => {
    it('should generate a valid todo-list scaffold', () => {
      const result = generateScaffold('todo-list');

      expect(result.success).toBe(true);
      expect(result.scaffold).toBeDefined();
      expect(result.error).toBeUndefined();
      expect(result.issues).toBeUndefined();

      // Verify scaffold structure
      expect(result.scaffold!.schemaVersion).toBe('1.0.0');
      expect(result.scaffold!.screen.id).toBe('todo-list');
      expect(result.scaffold!.screen.title).toBe('Todos');
      expect(result.scaffold!.screen.root.type).toBe('Stack');
    });

    it('should generate a valid empty-screen scaffold', () => {
      const result = generateScaffold('empty-screen');

      expect(result.success).toBe(true);
      expect(result.scaffold).toBeDefined();
      expect(result.scaffold!.screen.id).toBe('empty-screen');
      expect(result.scaffold!.screen.title).toBe('Empty Screen');
    });

    it('should fail for unknown pattern', () => {
      const result = generateScaffold('unknown-pattern');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown pattern: unknown-pattern');
      expect(result.scaffold).toBeUndefined();
    });

    it('should accept custom screen id and title', () => {
      const result = generateScaffold('empty-screen', {
        screenId: 'my-screen',
        title: 'My Custom Title',
      });

      expect(result.success).toBe(true);
      expect(result.scaffold!.screen.id).toBe('my-screen');
      expect(result.scaffold!.screen.title).toBe('My Custom Title');
    });

    it('should accept custom breakpoints', () => {
      const result = generateScaffold('empty-screen', {
        breakpoints: ['480x800', '1024x768'],
      });

      expect(result.success).toBe(true);
      expect(result.scaffold!.settings.breakpoints).toEqual(['480x800', '1024x768']);
    });

    it('should validate generated scaffolds with ingest', () => {
      const patterns = getAvailablePatterns();

      patterns.forEach((patternName: string) => {
        const result = generateScaffold(patternName);

        // Should succeed
        expect(result.success).toBe(true);

        // Should pass ingest validation
        const ingestResult = ingest(result.scaffold!);
        expect(ingestResult.valid).toBe(true);
        expect(ingestResult.issues).toEqual([]);
      });
    });
  });

  describe('parseBreakpoints', () => {
    it('should parse comma-separated breakpoints', () => {
      const result = parseBreakpoints('320x640,768x1024,1280x800');
      expect(result).toEqual(['320x640', '768x1024', '1280x800']);
    });

    it('should trim whitespace', () => {
      const result = parseBreakpoints('320x640, 768x1024 , 1280x800');
      expect(result).toEqual(['320x640', '768x1024', '1280x800']);
    });

    it('should handle empty string', () => {
      const result = parseBreakpoints('');
      expect(result).toEqual([]);
    });

    it('should filter empty values', () => {
      const result = parseBreakpoints('320x640,,768x1024');
      expect(result).toEqual(['320x640', '768x1024']);
    });
  });

  describe('pattern registry', () => {
    it('should have todo-list pattern', () => {
      const pattern = getPattern('todo-list');
      expect(pattern).toBeDefined();
      expect(pattern!.name).toBe('todo-list');
      expect(pattern!.description).toBe('Table + Add Button');
    });

    it('should have empty-screen pattern', () => {
      const pattern = getPattern('empty-screen');
      expect(pattern).toBeDefined();
      expect(pattern!.name).toBe('empty-screen');
      expect(pattern!.description).toBe('Minimal vertical Stack with title');
    });

    it('should return undefined for unknown pattern', () => {
      const pattern = getPattern('unknown');
      expect(pattern).toBeUndefined();
    });

    it('should list all available patterns', () => {
      const patterns = getAvailablePatterns();
      expect(patterns).toContain('todo-list');
      expect(patterns).toContain('empty-screen');
      expect(patterns.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('pattern generation', () => {
    describe('todo-list pattern', () => {
      it('should have title, toolbar, and table', () => {
        const pattern = getPattern('todo-list')!;
        const scaffold = pattern.generate({});

        const root = scaffold.screen.root;
        expect(root.type).toBe('Stack');
        expect(root.id).toBe('root');

        if (root.type === 'Stack') {
          expect(root.children.length).toBe(3);

          // Title
          const title = root.children[0];
          expect(title.type).toBe('Text');
          expect(title.id).toBe('title');

          // Toolbar
          const toolbar = root.children[1];
          expect(toolbar.type).toBe('Stack');
          expect(toolbar.id).toBe('toolbar');

          // Table
          const table = root.children[2];
          expect(table.type).toBe('Table');
          expect(table.id).toBe('todo-table');
        }
      });

      it('should have proper default settings', () => {
        const pattern = getPattern('todo-list')!;
        const scaffold = pattern.generate({});

        expect(scaffold.settings.spacingScale).toEqual([4, 8, 12, 16, 24, 32]);
        expect(scaffold.settings.minTouchTarget).toEqual({ w: 44, h: 44 });
        expect(scaffold.settings.breakpoints).toEqual(['320x640', '768x1024', '1280x800']);
      });

      it('should have primary button in toolbar', () => {
        const pattern = getPattern('todo-list')!;
        const scaffold = pattern.generate({});

        const root = scaffold.screen.root;
        if (root.type === 'Stack') {
          const toolbar = root.children[1];
          if (toolbar.type === 'Stack') {
            expect(toolbar.children.length).toBeGreaterThan(0);
            const button = toolbar.children[0];
            expect(button.type).toBe('Button');
            if (button.type === 'Button') {
              expect(button.roleHint).toBe('primary');
            }
          }
        }
      });
    });

    describe('empty-screen pattern', () => {
      it('should have minimal structure with title', () => {
        const pattern = getPattern('empty-screen')!;
        const scaffold = pattern.generate({});

        const root = scaffold.screen.root;
        expect(root.type).toBe('Stack');
        expect(root.id).toBe('root');

        if (root.type === 'Stack') {
          expect(root.children.length).toBe(1);

          const title = root.children[0];
          expect(title.type).toBe('Text');
          expect(title.id).toBe('title');
        }
      });

      it('should use custom title', () => {
        const pattern = getPattern('empty-screen')!;
        const scaffold = pattern.generate({ title: 'Custom Title' });

        const root = scaffold.screen.root;
        if (root.type === 'Stack') {
          const title = root.children[0];
          if (title.type === 'Text') {
            expect(title.text).toBe('Custom Title');
          }
        }

        expect(scaffold.screen.title).toBe('Custom Title');
      });
    });
  });
});
