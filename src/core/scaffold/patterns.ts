/**
 * Pattern definitions for scaffold generation
 */

import type { Scaffold } from '../../types/scaffold.js';
import type { StackNode, TextNode, ButtonNode, TableNode, FormNode, FieldNode } from '../../types/node.js';

export interface GenerateOptions {
  screenId?: string;
  title?: string;
  breakpoints?: string[];
}

export interface PatternGenerator {
  name: string;
  description: string;
  generate(options: GenerateOptions): Scaffold;
}

/**
 * Default settings for all scaffolds
 */
const defaultSettings = {
  spacingScale: [4, 8, 12, 16, 24, 32],
  minTouchTarget: {
    w: 44,
    h: 44,
  },
  breakpoints: ['320x640', '768x1024', '1280x800'],
};

/**
 * Todo List Pattern Generator
 * Creates a scaffold with a table and an "Add task" button
 * Based on the golden template
 */
class TodoListPattern implements PatternGenerator {
  name = 'todo-list';
  description = 'Table + Add Button';

  generate(options: GenerateOptions): Scaffold {
    const screenId = options.screenId ?? 'todo-list';
    const title = options.title ?? 'Todos';
    const breakpoints = options.breakpoints ?? defaultSettings.breakpoints;

    const titleNode: TextNode = {
      id: 'title',
      type: 'Text',
      text: title,
      fontSize: 24,
    };

    const addButton: ButtonNode = {
      id: 'add-task-button',
      type: 'Button',
      text: 'Add task',
      roleHint: 'primary',
    };

    const toolbar: StackNode = {
      id: 'toolbar',
      type: 'Stack',
      direction: 'horizontal',
      gap: 8,
      padding: 0,
      children: [addButton],
    };

    const table: TableNode = {
      id: 'todo-table',
      type: 'Table',
      title: 'Task List',
      columns: ['Task', 'Status', 'Due Date'],
      responsive: {
        strategy: 'scroll',
        minColumnWidth: 160,
      },
    };

    const root: StackNode = {
      id: 'root',
      type: 'Stack',
      direction: 'vertical',
      gap: 16,
      padding: 24,
      children: [titleNode, toolbar, table],
    };

    return {
      schemaVersion: '1.0.0',
      screen: {
        id: screenId,
        title,
        root,
      },
      settings: {
        ...defaultSettings,
        breakpoints,
      },
    };
  }
}

/**
 * Empty Screen Pattern Generator
 * Creates a minimal scaffold with just a title in a vertical Stack
 */
class EmptyScreenPattern implements PatternGenerator {
  name = 'empty-screen';
  description = 'Minimal vertical Stack with title';

  generate(options: GenerateOptions): Scaffold {
    const screenId = options.screenId ?? 'empty-screen';
    const title = options.title ?? 'Empty Screen';
    const breakpoints = options.breakpoints ?? defaultSettings.breakpoints;

    const titleNode: TextNode = {
      id: 'title',
      type: 'Text',
      text: title,
      fontSize: 24,
    };

    const root: StackNode = {
      id: 'root',
      type: 'Stack',
      direction: 'vertical',
      gap: 16,
      padding: 24,
      children: [titleNode],
    };

    return {
      schemaVersion: '1.0.0',
      screen: {
        id: screenId,
        title,
        root,
      },
      settings: {
        ...defaultSettings,
        breakpoints,
      },
    };
  }
}

/**
 * Form Basic Pattern Generator
 * Creates a scaffold with a form containing name and email fields
 * Based on form.basic.json snippet
 */
class FormBasicPattern implements PatternGenerator {
  name = 'form-basic';
  description = 'Basic form with name and email fields';

  generate(options: GenerateOptions): Scaffold {
    const screenId = options.screenId ?? 'form-screen';
    const title = options.title ?? 'Contact Form';
    const breakpoints = options.breakpoints ?? defaultSettings.breakpoints;

    const titleNode: TextNode = {
      id: 'title',
      type: 'Text',
      text: title,
      fontSize: 24,
    };

    const nameField: FieldNode = {
      id: 'name-field',
      type: 'Field',
      label: 'Name',
      inputType: 'text',
      required: true,
    };

    const emailField: FieldNode = {
      id: 'email-field',
      type: 'Field',
      label: 'Email',
      inputType: 'email',
      required: true,
    };

    const submitButton: ButtonNode = {
      id: 'submit-button',
      type: 'Button',
      text: 'Submit',
      roleHint: 'primary',
    };

    const cancelButton: ButtonNode = {
      id: 'cancel-button',
      type: 'Button',
      text: 'Cancel',
      roleHint: 'secondary',
    };

    const form: FormNode = {
      id: 'basic-form',
      type: 'Form',
      states: ['default'],
      fields: [nameField, emailField],
      actions: [submitButton, cancelButton],
    };

    const root: StackNode = {
      id: 'root',
      type: 'Stack',
      direction: 'vertical',
      gap: 16,
      padding: 24,
      children: [titleNode, form],
    };

    return {
      schemaVersion: '1.0.0',
      screen: {
        id: screenId,
        title,
        root,
      },
      settings: {
        ...defaultSettings,
        breakpoints,
      },
    };
  }
}

/**
 * Table Simple Pattern Generator
 * Creates a scaffold with a simple data table
 * Based on table.simple.json snippet
 */
class TableSimplePattern implements PatternGenerator {
  name = 'table-simple';
  description = 'Simple data table with name, email, status columns';

  generate(options: GenerateOptions): Scaffold {
    const screenId = options.screenId ?? 'table-screen';
    const title = options.title ?? 'Data Table';
    const breakpoints = options.breakpoints ?? defaultSettings.breakpoints;

    const titleNode: TextNode = {
      id: 'title',
      type: 'Text',
      text: title,
      fontSize: 24,
    };

    const table: TableNode = {
      id: 'simple-table',
      type: 'Table',
      title: 'Data Table',
      columns: ['Name', 'Email', 'Status'],
      responsive: {
        strategy: 'scroll',
      },
      states: ['default', 'empty'],
    };

    const root: StackNode = {
      id: 'root',
      type: 'Stack',
      direction: 'vertical',
      gap: 16,
      padding: 24,
      children: [titleNode, table],
    };

    return {
      schemaVersion: '1.0.0',
      screen: {
        id: screenId,
        title,
        root,
      },
      settings: {
        ...defaultSettings,
        breakpoints,
      },
    };
  }
}

/**
 * Pattern Registry
 * Maps pattern names to their generators
 */
export const patternRegistry: Map<string, PatternGenerator> = new Map([
  ['todo-list', new TodoListPattern()],
  ['empty-screen', new EmptyScreenPattern()],
  ['form-basic', new FormBasicPattern()],
  ['table-simple', new TableSimplePattern()],
]);

/**
 * Get a pattern generator by name
 */
export function getPattern(name: string): PatternGenerator | undefined {
  return patternRegistry.get(name);
}

/**
 * Get all available pattern names
 */
export function getAvailablePatterns(): string[] {
  return Array.from(patternRegistry.keys());
}

/**
 * Get pattern descriptions for help output
 */
export function getPatternDescriptions(): Array<{ name: string; description: string }> {
  return Array.from(patternRegistry.values()).map((pattern) => ({
    name: pattern.name,
    description: pattern.description,
  }));
}
