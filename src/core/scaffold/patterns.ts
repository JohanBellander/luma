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
 * Contact Form Pattern Generator
 * Creates a scaffold with a contact form containing name, email, phone fields
 */
class ContactFormPattern implements PatternGenerator {
  name = 'contact-form';
  description = 'Contact form with name, email, phone fields and actions';

  generate(options: GenerateOptions): Scaffold {
    const screenId = options.screenId ?? 'contact-form';
    const title = options.title ?? 'Contact Us';
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

    const phoneField: FieldNode = {
      id: 'phone-field',
      type: 'Field',
      label: 'Phone',
      inputType: 'text',
      required: false,
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
      id: 'contact-form',
      type: 'Form',
      states: ['default'],
      fields: [nameField, emailField, phoneField],
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
 * Data Table with Actions Pattern Generator
 * Creates a scaffold with a table and row-level action buttons
 */
class DataTableWithActionsPattern implements PatternGenerator {
  name = 'data-table-with-actions';
  description = 'Data table with edit and delete action buttons';

  generate(options: GenerateOptions): Scaffold {
    const screenId = options.screenId ?? 'data-table';
    const title = options.title ?? 'User Management';
    const breakpoints = options.breakpoints ?? defaultSettings.breakpoints;

    const titleNode: TextNode = {
      id: 'title',
      type: 'Text',
      text: title,
      fontSize: 24,
    };

    const addButton: ButtonNode = {
      id: 'add-button',
      type: 'Button',
      text: 'Add User',
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
      id: 'data-table',
      type: 'Table',
      title: 'Users',
      columns: ['Name', 'Email', 'Role', 'Actions'],
      responsive: {
        strategy: 'scroll',
        minColumnWidth: 120,
      },
      states: ['default', 'empty'],
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
 * Modal Dialog Pattern Generator
 * Creates a centered modal dialog with title, content, and action buttons
 */
class ModalDialogPattern implements PatternGenerator {
  name = 'modal-dialog';
  description = 'Centered modal dialog with title and actions';

  generate(options: GenerateOptions): Scaffold {
    const screenId = options.screenId ?? 'modal-dialog';
    const title = options.title ?? 'Confirm Action';
    const breakpoints = options.breakpoints ?? defaultSettings.breakpoints;

    const titleNode: TextNode = {
      id: 'modal-title',
      type: 'Text',
      text: title,
      fontSize: 20,
    };

    const contentNode: TextNode = {
      id: 'modal-content',
      type: 'Text',
      text: 'Are you sure you want to proceed?',
      fontSize: 16,
    };

    const confirmButton: ButtonNode = {
      id: 'confirm-button',
      type: 'Button',
      text: 'Confirm',
      roleHint: 'primary',
    };

    const cancelButton: ButtonNode = {
      id: 'cancel-button',
      type: 'Button',
      text: 'Cancel',
      roleHint: 'secondary',
    };

    const actionRow: StackNode = {
      id: 'action-row',
      type: 'Stack',
      direction: 'horizontal',
      gap: 8,
      padding: 0,
      children: [cancelButton, confirmButton],
    };

    const modalContent: StackNode = {
      id: 'modal-content-stack',
      type: 'Stack',
      direction: 'vertical',
      gap: 16,
      padding: 24,
      children: [titleNode, contentNode, actionRow],
    };

    const root: StackNode = {
      id: 'root',
      type: 'Stack',
      direction: 'vertical',
      gap: 0,
      padding: 0,
      children: [modalContent],
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
 * Login Form Pattern Generator
 * Creates a login form with username/email and password fields
 */
class LoginFormPattern implements PatternGenerator {
  name = 'login-form';
  description = 'Login form with email and password fields';

  generate(options: GenerateOptions): Scaffold {
    const screenId = options.screenId ?? 'login';
    const title = options.title ?? 'Login';
    const breakpoints = options.breakpoints ?? defaultSettings.breakpoints;

    const titleNode: TextNode = {
      id: 'title',
      type: 'Text',
      text: title,
      fontSize: 24,
    };

    const emailField: FieldNode = {
      id: 'email-field',
      type: 'Field',
      label: 'Email',
      inputType: 'email',
      required: true,
    };

    const passwordField: FieldNode = {
      id: 'password-field',
      type: 'Field',
      label: 'Password',
      inputType: 'password',
      required: true,
    };

    const loginButton: ButtonNode = {
      id: 'login-button',
      type: 'Button',
      text: 'Login',
      roleHint: 'primary',
    };

    const forgotButton: ButtonNode = {
      id: 'forgot-button',
      type: 'Button',
      text: 'Forgot Password?',
      roleHint: 'secondary',
    };

    const form: FormNode = {
      id: 'login-form',
      type: 'Form',
      states: ['default'],
      fields: [emailField, passwordField],
      actions: [loginButton, forgotButton],
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
 * Multi-Step Form Pattern Generator
 * Creates a multi-step form with navigation buttons
 */
class MultiStepFormPattern implements PatternGenerator {
  name = 'multi-step-form';
  description = 'Multi-step form with navigation and step indicator';

  generate(options: GenerateOptions): Scaffold {
    const screenId = options.screenId ?? 'multi-step-form';
    const title = options.title ?? 'Registration';
    const breakpoints = options.breakpoints ?? defaultSettings.breakpoints;

    const titleNode: TextNode = {
      id: 'title',
      type: 'Text',
      text: title,
      fontSize: 24,
    };

    const stepIndicator: TextNode = {
      id: 'step-indicator',
      type: 'Text',
      text: 'Step 1 of 3',
      fontSize: 14,
    };

    // Step 1: Personal Info
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

    // Navigation buttons
    const previousButton: ButtonNode = {
      id: 'previous-button',
      type: 'Button',
      text: 'Previous',
      roleHint: 'secondary',
    };

    const nextButton: ButtonNode = {
      id: 'next-button',
      type: 'Button',
      text: 'Next',
      roleHint: 'primary',
    };

    const step1Form: FormNode = {
      id: 'step1-form',
      type: 'Form',
      states: ['default'],
      fields: [nameField, emailField],
      actions: [previousButton, nextButton],
    };

    const root: StackNode = {
      id: 'root',
      type: 'Stack',
      direction: 'vertical',
      gap: 16,
      padding: 24,
      children: [titleNode, stepIndicator, step1Form],
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
 * Dashboard Grid Pattern Generator
 * Creates a dashboard with grid layout and multiple widget areas
 */
class DashboardGridPattern implements PatternGenerator {
  name = 'dashboard-grid';
  description = 'Dashboard with grid layout and card widgets';

  generate(options: GenerateOptions): Scaffold {
    const screenId = options.screenId ?? 'dashboard';
    const title = options.title ?? 'Dashboard';
    const breakpoints = options.breakpoints ?? defaultSettings.breakpoints;

    const titleNode: TextNode = {
      id: 'title',
      type: 'Text',
      text: title,
      fontSize: 24,
    };

    const statsTitle: TextNode = {
      id: 'stats-title',
      type: 'Text',
      text: 'Statistics',
      fontSize: 18,
    };

    const statsValue: TextNode = {
      id: 'stats-value',
      type: 'Text',
      text: '1,234',
      fontSize: 32,
    };

    const statsCard: StackNode = {
      id: 'stats-card',
      type: 'Stack',
      direction: 'vertical',
      gap: 8,
      padding: 16,
      children: [statsTitle, statsValue],
    };

    const activityTitle: TextNode = {
      id: 'activity-title',
      type: 'Text',
      text: 'Recent Activity',
      fontSize: 18,
    };

    const activityContent: TextNode = {
      id: 'activity-content',
      type: 'Text',
      text: 'Latest updates...',
      fontSize: 14,
    };

    const activityCard: StackNode = {
      id: 'activity-card',
      type: 'Stack',
      direction: 'vertical',
      gap: 8,
      padding: 16,
      children: [activityTitle, activityContent],
    };

    const chartTitle: TextNode = {
      id: 'chart-title',
      type: 'Text',
      text: 'Analytics',
      fontSize: 18,
    };

    const chartContent: TextNode = {
      id: 'chart-content',
      type: 'Text',
      text: 'Chart placeholder',
      fontSize: 14,
    };

    const chartCard: StackNode = {
      id: 'chart-card',
      type: 'Stack',
      direction: 'vertical',
      gap: 8,
      padding: 16,
      children: [chartTitle, chartContent],
    };

    const gridContainer: StackNode = {
      id: 'grid-container',
      type: 'Stack',
      direction: 'vertical',
      gap: 16,
      padding: 0,
      children: [statsCard, activityCard, chartCard],
    };

    const root: StackNode = {
      id: 'root',
      type: 'Stack',
      direction: 'vertical',
      gap: 16,
      padding: 24,
      children: [titleNode, gridContainer],
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
  ['contact-form', new ContactFormPattern()],
  ['data-table-with-actions', new DataTableWithActionsPattern()],
  ['modal-dialog', new ModalDialogPattern()],
  ['login-form', new LoginFormPattern()],
  ['multi-step-form', new MultiStepFormPattern()],
  ['dashboard-grid', new DashboardGridPattern()],
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
