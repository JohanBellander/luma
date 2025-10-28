/**
 * Tests for schema command
 */

import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';

describe('luma schema command', () => {
  describe('default behavior', () => {
    it('should show input and output schemas', () => {
      const output = execSync('node dist/index.js schema', { encoding: 'utf-8' });
      
      expect(output).toContain('Input Schema: Scaffold');
      expect(output).toContain('Output Schemas:');
      expect(output).toContain('IngestOutput');
      expect(output).toContain('LayoutOutput');
      expect(output).toContain('KeyboardOutput');
    });

    it('should output JSON when --json flag is used', () => {
      const output = execSync('node dist/index.js schema --json', { encoding: 'utf-8' });
      
      const parsed = JSON.parse(output);
      expect(parsed).toHaveProperty('inputSchema');
      expect(parsed).toHaveProperty('outputSchemas');
      expect(parsed.inputSchema.nodeTypes).toContain('Stack');
      expect(parsed.inputSchema.nodeTypes).toContain('Form');
    });
  });

  describe('--list flag', () => {
    it('should list all component types', () => {
      const output = execSync('node dist/index.js schema --list', { encoding: 'utf-8' });
      
      expect(output).toContain('Available component types:');
      expect(output).toContain('Text');
      expect(output).toContain('Button');
      expect(output).toContain('Field');
      expect(output).toContain('Form');
      expect(output).toContain('Table');
      expect(output).toContain('Stack');
      expect(output).toContain('Grid');
      expect(output).toContain('Box');
    });

    it('should output component list as JSON', () => {
      const output = execSync('node dist/index.js schema --list --json', { encoding: 'utf-8' });
      
      const parsed = JSON.parse(output);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toContain('Text');
      expect(parsed).toContain('Form');
      expect(parsed.length).toBe(8);
    });
  });

  describe('--component flag', () => {
    it('should show Text component properties', () => {
      const output = execSync('node dist/index.js schema --component Text', { encoding: 'utf-8' });
      
      expect(output).toContain('Component: Text');
      expect(output).toContain('Display text content');
      expect(output).toContain('Required Properties:');
      expect(output).toContain('id: string');
      expect(output).toContain('type: string');
      expect(output).toContain('text: string');
      expect(output).toContain('Optional Properties:');
      expect(output).toContain('fontSize: number');
    });

    it('should show Button component properties', () => {
      const output = execSync('node dist/index.js schema --component Button', { encoding: 'utf-8' });
      
      expect(output).toContain('Component: Button');
      expect(output).toContain('roleHint');
      expect(output).toContain('primary');
      expect(output).toContain('secondary');
    });

    it('should show Form component properties with fields and actions', () => {
      const output = execSync('node dist/index.js schema --component Form', { encoding: 'utf-8' });
      
      expect(output).toContain('Component: Form');
      expect(output).toContain('fields');
      expect(output).toContain('actions');
      expect(output).toContain('states');
      expect(output).toContain('Array of Field components');
      expect(output).toContain('Array of Button components');
    });

    it('should show Table component properties', () => {
      const output = execSync('node dist/index.js schema --component Table', { encoding: 'utf-8' });
      
      expect(output).toContain('Component: Table');
      expect(output).toContain('columns');
      expect(output).toContain('responsive');
      expect(output).toContain('Array of column names as strings');
    });

    it('should show Stack component properties', () => {
      const output = execSync('node dist/index.js schema --component Stack', { encoding: 'utf-8' });
      
      expect(output).toContain('Component: Stack');
      expect(output).toContain('direction');
      expect(output).toContain('children');
      expect(output).toContain('vertical');
      expect(output).toContain('horizontal');
    });

    it('should output component properties as JSON', () => {
      const output = execSync('node dist/index.js schema --component Text --json', { encoding: 'utf-8' });
      
      const parsed = JSON.parse(output);
      expect(parsed.type).toBe('Text');
      expect(parsed.description).toBeTruthy();
      expect(parsed.properties).toHaveProperty('text');
      expect(parsed.required).toContain('text');
      expect(parsed.commonMistakes).toBeDefined();
      expect(parsed.examples).toBeDefined();
    });

    it('should show common mistakes for each component', () => {
      const textOutput = execSync('node dist/index.js schema --component Text', { encoding: 'utf-8' });
      expect(textOutput).toContain('Common Mistakes:');
      expect(textOutput).toContain("Using 'content' instead of 'text'");

      const buttonOutput = execSync('node dist/index.js schema --component Button', { encoding: 'utf-8' });
      expect(buttonOutput).toContain("Using 'variant' instead of 'roleHint'");

      const tableOutput = execSync('node dist/index.js schema --component Table', { encoding: 'utf-8' });
      expect(tableOutput).toContain('object array');
    });

    it('should error on unknown component type', () => {
      try {
        execSync('node dist/index.js schema --component Unknown', { encoding: 'utf-8', stdio: 'pipe' });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.status).toBe(3); // Invalid usage exit code
        expect(error.stderr.toString()).toContain('Unknown component type');
      }
    });
  });

  describe('--examples flag', () => {
    it('should show Text component examples', () => {
      const output = execSync('node dist/index.js schema --component Text --examples', { encoding: 'utf-8' });
      
      expect(output).toContain('Text Examples:');
      expect(output).toContain('Simple text');
      expect(output).toContain('Hello World');
    });

    it('should show Form component examples', () => {
      const output = execSync('node dist/index.js schema --component Form --examples', { encoding: 'utf-8' });
      
      expect(output).toContain('Form Examples:');
      expect(output).toContain('Login form');
      expect(output).toContain('fields');
      expect(output).toContain('actions');
    });

    it('should show Table component examples', () => {
      const output = execSync('node dist/index.js schema --component Table --examples', { encoding: 'utf-8' });
      
      expect(output).toContain('Table Examples:');
      expect(output).toContain('columns');
      expect(output).toContain('responsive');
    });

    it('should output examples as JSON', () => {
      const output = execSync('node dist/index.js schema --component Button --examples --json', { encoding: 'utf-8' });
      
      const parsed = JSON.parse(output);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBeGreaterThan(0);
      expect(parsed[0]).toHaveProperty('name');
      expect(parsed[0]).toHaveProperty('code');
      expect(parsed[0].code).toHaveProperty('type', 'Button');
    });

    it('should show multiple examples for components', () => {
      const output = execSync('node dist/index.js schema --component Stack --examples', { encoding: 'utf-8' });
      
      expect(output).toContain('Stack Examples:');
      expect(output).toContain('Vertical stack');
      expect(output).toContain('Horizontal toolbar');
    });
  });

  describe('integration with component schemas', () => {
    it('should document all 8 component types', { timeout: 15000 }, () => {
      const types = ['Text', 'Button', 'Field', 'Form', 'Table', 'Stack', 'Grid', 'Box'];
      
      types.forEach(type => {
        const output = execSync(`node dist/index.js schema --component ${type}`, { encoding: 'utf-8' });
        expect(output).toContain(`Component: ${type}`);
        expect(output).toContain('Required Properties:');
      });
    });

    it('should provide working examples for all components', { timeout: 15000 }, () => {
      const types = ['Text', 'Button', 'Field', 'Form', 'Table', 'Stack', 'Grid', 'Box'];
      
      types.forEach(type => {
        const output = execSync(`node dist/index.js schema --component ${type} --examples --json`, { encoding: 'utf-8' });
        const examples = JSON.parse(output);
        expect(examples.length).toBeGreaterThan(0);
        expect(examples[0].code.type).toBe(type);
      });
    });

    it('should include common mistakes for all components', { timeout: 15000 }, () => {
      const types = ['Text', 'Button', 'Field', 'Form', 'Table', 'Stack', 'Grid', 'Box'];
      
      types.forEach(type => {
        const output = execSync(`node dist/index.js schema --component ${type} --json`, { encoding: 'utf-8' });
        const schema = JSON.parse(output);
        expect(schema.commonMistakes).toBeDefined();
        expect(Array.isArray(schema.commonMistakes)).toBe(true);
      });
    });
  });

  describe('help text', () => {
    it('should show component usage hints in default output', () => {
      const output = execSync('node dist/index.js schema', { encoding: 'utf-8' });
      
      expect(output).toContain('For component details, use:');
      expect(output).toContain('luma schema --list');
      expect(output).toContain('luma schema --component <type>');
    });

    it('should show examples hint in component output', () => {
      const output = execSync('node dist/index.js schema --component Text', { encoding: 'utf-8' });
      
      expect(output).toContain('For examples, run:');
      expect(output).toContain('luma schema --component Text --examples');
    });
  });
});
