/**
 * Integration tests for LUMA v1.1 Snippets
 * Tests: Inserting snippets into golden template and composing scaffolds from multiple snippets
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const SNIPPETS_DIR = join(process.cwd(), 'snippets');
const TEMPLATES_DIR = join(process.cwd(), 'templates');

/**
 * Helper to validate a scaffold structure
 */
function validateScaffold(scaffold: any): void {
  expect(scaffold).toBeDefined();
  expect(scaffold.schemaVersion).toBeDefined();
  expect(scaffold.screen).toBeDefined();
  expect(scaffold.screen.id).toBeDefined();
  expect(scaffold.screen.root).toBeDefined();
}

/**
 * Helper to create a scaffold with a snippet inserted into golden template
 */
function createScaffoldWithSnippet(snippetNode: any): any {
  const goldenPath = join(TEMPLATES_DIR, 'golden.todo.mock.json');
  const golden = JSON.parse(readFileSync(goldenPath, 'utf-8'));
  
  // Insert snippet into the root stack's children
  if (golden.screen.root.children) {
    golden.screen.root.children.push(snippetNode);
  } else {
    golden.screen.root.children = [snippetNode];
  }
  
  return golden;
}

/**
 * Helper to run ingest validation on a scaffold object
 */
function validateScaffoldWithIngest(scaffold: any): any {
  const { writeFileSync, unlinkSync } = require('fs');
  const tmpFile = join(process.cwd(), '.tmp-snippet-test.json');
  
  try {
    writeFileSync(tmpFile, JSON.stringify(scaffold, null, 2));
    const result = execSync(
      `node dist/index.js ingest ${tmpFile} --json`,
      { encoding: 'utf-8' }
    );
    return JSON.parse(result);
  } finally {
    if (existsSync(tmpFile)) {
      unlinkSync(tmpFile);
    }
  }
}

describe('Integration: Snippets', () => {
  describe('Snippets Index', () => {
    const indexPath = join(SNIPPETS_DIR, 'index.json');

    it('should have snippets index file', () => {
      expect(existsSync(indexPath)).toBe(true);
    });

    it('should have valid JSON structure', () => {
      const content = readFileSync(indexPath, 'utf-8');
      const index = JSON.parse(content);
      
      expect(index.version).toBe('1.1.0');
      expect(index.description).toBeDefined();
      expect(Array.isArray(index.snippets)).toBe(true);
      expect(index.snippets.length).toBeGreaterThan(0);
    });

    it('should list all snippet files', () => {
      const content = readFileSync(indexPath, 'utf-8');
      const index = JSON.parse(content);
      
      // Expected snippets based on LUMA-23
      const expectedSnippets = [
        'stack.vertical',
        'stack.horizontal.toolbar',
        'form.basic',
        'table.simple',
        'button.primary',
        'field.email'
      ];
      
      const snippetNames = index.snippets.map((s: any) => s.name);
      expectedSnippets.forEach(name => {
        expect(snippetNames).toContain(name);
      });
    });

    it('should have all snippet files referenced in index', () => {
      const content = readFileSync(indexPath, 'utf-8');
      const index = JSON.parse(content);
      
      index.snippets.forEach((snippet: any) => {
        const snippetPath = join(SNIPPETS_DIR, snippet.file);
        expect(existsSync(snippetPath)).toBe(true);
      });
    });
  });

  describe('Individual Snippet Validation', () => {
    it('should validate stack.vertical snippet', () => {
      const snippetPath = join(SNIPPETS_DIR, 'stack.vertical.json');
      expect(existsSync(snippetPath)).toBe(true);
      
      const snippet = JSON.parse(readFileSync(snippetPath, 'utf-8'));
      expect(snippet.id).toBeDefined();
      expect(snippet.type).toBe('Stack');
      expect(snippet.direction).toBe('vertical');
      expect(snippet.gap).toBeDefined();
      expect(Array.isArray(snippet.children)).toBe(true);
    });

    it('should validate stack.horizontal.toolbar snippet', () => {
      const snippetPath = join(SNIPPETS_DIR, 'stack.horizontal.toolbar.json');
      expect(existsSync(snippetPath)).toBe(true);
      
      const snippet = JSON.parse(readFileSync(snippetPath, 'utf-8'));
      expect(snippet.id).toBeDefined();
      expect(snippet.type).toBe('Stack');
      expect(snippet.direction).toBe('horizontal');
      expect(snippet.gap).toBeDefined();
      expect(Array.isArray(snippet.children)).toBe(true);
    });

    it('should validate form.basic snippet', () => {
      const snippetPath = join(SNIPPETS_DIR, 'form.basic.json');
      expect(existsSync(snippetPath)).toBe(true);
      
      const snippet = JSON.parse(readFileSync(snippetPath, 'utf-8'));
      expect(snippet.id).toBeDefined();
      expect(snippet.type).toBe('Form');
      expect(Array.isArray(snippet.fields)).toBe(true);
      expect(snippet.fields.length).toBeGreaterThan(0);
      expect(Array.isArray(snippet.actions)).toBe(true);
      expect(snippet.actions.length).toBeGreaterThan(0);
    });

    it('should validate table.simple snippet', () => {
      const snippetPath = join(SNIPPETS_DIR, 'table.simple.json');
      expect(existsSync(snippetPath)).toBe(true);
      
      const snippet = JSON.parse(readFileSync(snippetPath, 'utf-8'));
      expect(snippet.id).toBeDefined();
      expect(snippet.type).toBe('Table');
      expect(Array.isArray(snippet.columns)).toBe(true);
      expect(snippet.columns.length).toBeGreaterThan(0);
      expect(snippet.responsive).toBeDefined();
    });

    it('should validate button.primary snippet', () => {
      const snippetPath = join(SNIPPETS_DIR, 'button.primary.json');
      expect(existsSync(snippetPath)).toBe(true);
      
      const snippet = JSON.parse(readFileSync(snippetPath, 'utf-8'));
      expect(snippet.id).toBeDefined();
      expect(snippet.type).toBe('Button');
      expect(snippet.text).toBeDefined();
      expect(snippet.roleHint).toBe('primary');
    });

    it('should validate field.email snippet', () => {
      const snippetPath = join(SNIPPETS_DIR, 'field.email.json');
      expect(existsSync(snippetPath)).toBe(true);
      
      const snippet = JSON.parse(readFileSync(snippetPath, 'utf-8'));
      expect(snippet.id).toBeDefined();
      expect(snippet.type).toBe('Field');
      expect(snippet.label).toBeDefined();
      expect(snippet.inputType).toBe('email');
    });
  });

  describe('Inserting Snippets into Golden Template', () => {
    it('should insert stack.vertical into golden template', () => {
      const snippetPath = join(SNIPPETS_DIR, 'stack.vertical.json');
      const snippet = JSON.parse(readFileSync(snippetPath, 'utf-8'));
      
      // Give it a unique ID to avoid conflicts
      snippet.id = 'inserted-vertical-stack';
      
      const scaffold = createScaffoldWithSnippet(snippet);
      validateScaffold(scaffold);
      
      // Verify the snippet was inserted
      const lastChild = scaffold.screen.root.children[scaffold.screen.root.children.length - 1];
      expect(lastChild.id).toBe('inserted-vertical-stack');
      expect(lastChild.type).toBe('Stack');
      expect(lastChild.direction).toBe('vertical');
    });

    it('should insert stack.horizontal.toolbar into golden template', () => {
      const snippetPath = join(SNIPPETS_DIR, 'stack.horizontal.toolbar.json');
      const snippet = JSON.parse(readFileSync(snippetPath, 'utf-8'));
      
      snippet.id = 'inserted-toolbar';
      
      const scaffold = createScaffoldWithSnippet(snippet);
      validateScaffold(scaffold);
      
      const lastChild = scaffold.screen.root.children[scaffold.screen.root.children.length - 1];
      expect(lastChild.id).toBe('inserted-toolbar');
      expect(lastChild.type).toBe('Stack');
      expect(lastChild.direction).toBe('horizontal');
    });

    it('should insert form.basic into golden template', () => {
      const snippetPath = join(SNIPPETS_DIR, 'form.basic.json');
      const snippet = JSON.parse(readFileSync(snippetPath, 'utf-8'));
      
      snippet.id = 'inserted-form';
      
      const scaffold = createScaffoldWithSnippet(snippet);
      validateScaffold(scaffold);
      
      const lastChild = scaffold.screen.root.children[scaffold.screen.root.children.length - 1];
      expect(lastChild.id).toBe('inserted-form');
      expect(lastChild.type).toBe('Form');
    });

    it('should insert table.simple into golden template', () => {
      const snippetPath = join(SNIPPETS_DIR, 'table.simple.json');
      const snippet = JSON.parse(readFileSync(snippetPath, 'utf-8'));
      
      snippet.id = 'inserted-table';
      
      const scaffold = createScaffoldWithSnippet(snippet);
      validateScaffold(scaffold);
      
      const lastChild = scaffold.screen.root.children[scaffold.screen.root.children.length - 1];
      expect(lastChild.id).toBe('inserted-table');
      expect(lastChild.type).toBe('Table');
    });

    it('should insert button.primary into golden template', () => {
      const snippetPath = join(SNIPPETS_DIR, 'button.primary.json');
      const snippet = JSON.parse(readFileSync(snippetPath, 'utf-8'));
      
      snippet.id = 'inserted-button';
      
      const scaffold = createScaffoldWithSnippet(snippet);
      validateScaffold(scaffold);
      
      const lastChild = scaffold.screen.root.children[scaffold.screen.root.children.length - 1];
      expect(lastChild.id).toBe('inserted-button');
      expect(lastChild.type).toBe('Button');
    });

    it('should insert field.email into golden template', () => {
      const snippetPath = join(SNIPPETS_DIR, 'field.email.json');
      const snippet = JSON.parse(readFileSync(snippetPath, 'utf-8'));
      
      snippet.id = 'inserted-email-field';
      
      const scaffold = createScaffoldWithSnippet(snippet);
      validateScaffold(scaffold);
      
      const lastChild = scaffold.screen.root.children[scaffold.screen.root.children.length - 1];
      expect(lastChild.id).toBe('inserted-email-field');
      expect(lastChild.type).toBe('Field');
    });
  });

  describe('Composing Scaffolds from Multiple Snippets', () => {
    it('should compose a scaffold with vertical stack containing buttons', () => {
      const verticalStackPath = join(SNIPPETS_DIR, 'stack.vertical.json');
      const buttonPath = join(SNIPPETS_DIR, 'button.primary.json');
      
      const verticalStack = JSON.parse(readFileSync(verticalStackPath, 'utf-8'));
      const button = JSON.parse(readFileSync(buttonPath, 'utf-8'));
      
      // Create two buttons with unique IDs
      const button1 = { ...button, id: 'action-button-1', text: 'Save' };
      const button2 = { ...button, id: 'action-button-2', text: 'Cancel', roleHint: 'secondary' };
      
      // Add buttons to the stack
      verticalStack.id = 'action-buttons-stack';
      verticalStack.children = [button1, button2];
      
      const scaffold = createScaffoldWithSnippet(verticalStack);
      validateScaffold(scaffold);
      
      // Verify composition
      const insertedStack = scaffold.screen.root.children[scaffold.screen.root.children.length - 1];
      expect(insertedStack.children.length).toBe(2);
      expect(insertedStack.children[0].type).toBe('Button');
      expect(insertedStack.children[1].type).toBe('Button');
    });

    it('should compose a scaffold with horizontal toolbar containing buttons', () => {
      const toolbarPath = join(SNIPPETS_DIR, 'stack.horizontal.toolbar.json');
      const buttonPath = join(SNIPPETS_DIR, 'button.primary.json');
      
      const toolbar = JSON.parse(readFileSync(toolbarPath, 'utf-8'));
      const button = JSON.parse(readFileSync(buttonPath, 'utf-8'));
      
      // Create toolbar buttons
      const newButton = { ...button, id: 'new-btn', text: 'New' };
      const editButton = { ...button, id: 'edit-btn', text: 'Edit' };
      const deleteButton = { ...button, id: 'delete-btn', text: 'Delete', roleHint: 'destructive' };
      
      toolbar.id = 'main-toolbar';
      toolbar.children = [newButton, editButton, deleteButton];
      
      const scaffold = createScaffoldWithSnippet(toolbar);
      validateScaffold(scaffold);
      
      // Verify composition
      const insertedToolbar = scaffold.screen.root.children[scaffold.screen.root.children.length - 1];
      expect(insertedToolbar.type).toBe('Stack');
      expect(insertedToolbar.direction).toBe('horizontal');
      expect(insertedToolbar.children.length).toBe(3);
    });

    it('should compose a complex scaffold with nested stacks', () => {
      const verticalStackPath = join(SNIPPETS_DIR, 'stack.vertical.json');
      const toolbarPath = join(SNIPPETS_DIR, 'stack.horizontal.toolbar.json');
      const formPath = join(SNIPPETS_DIR, 'form.basic.json');
      
      const outerStack = JSON.parse(readFileSync(verticalStackPath, 'utf-8'));
      const toolbar = JSON.parse(readFileSync(toolbarPath, 'utf-8'));
      const form = JSON.parse(readFileSync(formPath, 'utf-8'));
      
      // Compose: outer vertical stack with toolbar and form
      outerStack.id = 'page-layout';
      toolbar.id = 'page-toolbar';
      form.id = 'user-form';
      
      outerStack.children = [toolbar, form];
      
      const scaffold = createScaffoldWithSnippet(outerStack);
      validateScaffold(scaffold);
      
      // Verify nested composition
      const insertedLayout = scaffold.screen.root.children[scaffold.screen.root.children.length - 1];
      expect(insertedLayout.type).toBe('Stack');
      expect(insertedLayout.children.length).toBe(2);
      expect(insertedLayout.children[0].type).toBe('Stack'); // toolbar
      expect(insertedLayout.children[0].direction).toBe('horizontal');
      expect(insertedLayout.children[1].type).toBe('Form'); // form
    });

    it('should compose a data-heavy scaffold with table and form', () => {
      const verticalStackPath = join(SNIPPETS_DIR, 'stack.vertical.json');
      const tablePath = join(SNIPPETS_DIR, 'table.simple.json');
      const formPath = join(SNIPPETS_DIR, 'form.basic.json');
      
      const container = JSON.parse(readFileSync(verticalStackPath, 'utf-8'));
      const table = JSON.parse(readFileSync(tablePath, 'utf-8'));
      const form = JSON.parse(readFileSync(formPath, 'utf-8'));
      
      container.id = 'data-page';
      table.id = 'users-table';
      form.id = 'add-user-form';
      
      container.children = [form, table];
      
      const scaffold = createScaffoldWithSnippet(container);
      validateScaffold(scaffold);
      
      // Verify composition
      const insertedContainer = scaffold.screen.root.children[scaffold.screen.root.children.length - 1];
      expect(insertedContainer.children.length).toBe(2);
      expect(insertedContainer.children[0].type).toBe('Form');
      expect(insertedContainer.children[1].type).toBe('Table');
    });
  });

  describe('LUMA Validation with Composed Snippets', () => {
    it('should pass ingest validation with a snippet-composed scaffold', () => {
      const verticalStackPath = join(SNIPPETS_DIR, 'stack.vertical.json');
      const buttonPath = join(SNIPPETS_DIR, 'button.primary.json');
      
      const stack = JSON.parse(readFileSync(verticalStackPath, 'utf-8'));
      const button = JSON.parse(readFileSync(buttonPath, 'utf-8'));
      
      stack.id = 'validated-stack';
      button.id = 'validated-button';
      stack.children = [button];
      
      const scaffold = createScaffoldWithSnippet(stack);
      
      // Run through LUMA ingest
      const result = validateScaffoldWithIngest(scaffold);
      
      expect(result.valid).toBe(true);
      expect(result.normalized).toBeDefined();
    });

    it('should pass ingest validation with form snippet', () => {
      const formPath = join(SNIPPETS_DIR, 'form.basic.json');
      const form = JSON.parse(readFileSync(formPath, 'utf-8'));
      
      form.id = 'validated-form';
      
      const scaffold = createScaffoldWithSnippet(form);
      
      const result = validateScaffoldWithIngest(scaffold);
      
      expect(result.valid).toBe(true);
      expect(result.normalized).toBeDefined();
    });

    it('should pass ingest validation with table snippet', () => {
      const tablePath = join(SNIPPETS_DIR, 'table.simple.json');
      const table = JSON.parse(readFileSync(tablePath, 'utf-8'));
      
      table.id = 'validated-table';
      
      const scaffold = createScaffoldWithSnippet(table);
      
      const result = validateScaffoldWithIngest(scaffold);
      
      expect(result.valid).toBe(true);
      expect(result.normalized).toBeDefined();
    });

    it('should pass ingest validation with complex nested composition', () => {
      const verticalStackPath = join(SNIPPETS_DIR, 'stack.vertical.json');
      const toolbarPath = join(SNIPPETS_DIR, 'stack.horizontal.toolbar.json');
      const buttonPath = join(SNIPPETS_DIR, 'button.primary.json');
      const tablePath = join(SNIPPETS_DIR, 'table.simple.json');
      
      const container = JSON.parse(readFileSync(verticalStackPath, 'utf-8'));
      const toolbar = JSON.parse(readFileSync(toolbarPath, 'utf-8'));
      const button = JSON.parse(readFileSync(buttonPath, 'utf-8'));
      const table = JSON.parse(readFileSync(tablePath, 'utf-8'));
      
      // Build complex structure
      container.id = 'app-layout';
      toolbar.id = 'app-toolbar';
      button.id = 'refresh-btn';
      button.text = 'Refresh';
      toolbar.children = [button];
      table.id = 'main-table';
      
      container.children = [toolbar, table];
      
      const scaffold = createScaffoldWithSnippet(container);
      
      const result = validateScaffoldWithIngest(scaffold);
      
      expect(result.valid).toBe(true);
      expect(result.normalized).toBeDefined();
    });
  });
});
