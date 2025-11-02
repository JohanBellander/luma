/**
 * Error Enhancement Wrapper for LUMA
 * Adds suggestion and nextAction to validation issues
 */

import type { Issue } from '../../types/issue.js';

/**
 * Options for enhancing errors
 */
export interface ErrorEnhancementOptions {
  /** Show all issues instead of prioritizing one */
  allIssues?: boolean;
  /** Suppress suggestion generation */
  noSuggest?: boolean;
  /** Output format */
  format?: 'concise' | 'verbose';
}

/**
 * Common property name mistakes and their corrections
 */
const PROPERTY_NAME_CORRECTIONS: Record<string, Record<string, string>> = {
  Text: {
    content: 'text',
    label: 'text',
    value: 'text',
    fontWeight: 'fontSize (fontWeight not supported)',
  },
  Button: {
    label: 'text',
    content: 'text',
    variant: 'roleHint',
    type: 'roleHint',
    style: 'roleHint',
  },
  Field: {
    type: 'inputType',
    name: 'label',
    placeholder: 'helpText',
    error: 'errorText',
    validation: 'required',
  },
  Table: {
    headers: 'columns',
    cols: 'columns',
    header: 'title',
    name: 'title',
  },
  Form: {
    buttons: 'actions',
    inputs: 'fields',
    name: 'title',
  },
  Stack: {
    orientation: 'direction',
    spacing: 'gap',
  },
  Grid: {
    cols: 'columns',
    spacing: 'gap',
  },
};

/**
 * Valid node types for union error messages
 */
const VALID_NODE_TYPES = [
  'Stack',
  'Grid',
  'Box',
  'Text',
  'Button',
  'Field',
  'Form',
  'Table',
];

/**
 * Extract component type from JSON pointer
 * For errors like unrecognized_keys, pointer points to the object itself (e.g., /screen/root)
 * For errors like invalid_type, pointer points to the property (e.g., /screen/root/text)
 */
function getComponentTypeFromPointer(pointer: string, data?: any): string | undefined {
  if (!pointer || !data) return undefined;

  try {
    const parts = pointer.split('/').filter(p => p.length > 0);
    if (parts.length === 0) return undefined;
    
    // First, try navigating to the pointer itself and checking for .type
    let obj = data;
    for (const part of parts) {
      obj = obj[part];
      if (!obj) break;
    }
    if (obj && typeof obj === 'object' && obj.type) {
      return obj.type;
    }
    
    // If that didn't work, try navigating to parent (for property-level errors)
    if (parts.length > 1) {
      obj = data;
      for (let i = 0; i < parts.length - 1; i++) {
        obj = obj[parts[i]];
        if (!obj) break;
      }
      if (obj && typeof obj === 'object' && obj.type) {
        return obj.type;
      }
    }
  } catch {
    // Ignore navigation errors
  }

  // Check for component-specific paths
  if (pointer.includes('/fields')) return 'Form';
  if (pointer.includes('/actions')) return 'Form';
  if (pointer.includes('/columns') && !pointer.includes('/Grid')) return 'Table';
  if (pointer.includes('/children')) return 'Stack or Grid';
  if (pointer.includes('/child')) return 'Box';

  return undefined;
}

/**
 * Detect wrong property name and suggest correction
 */
function detectPropertyNameError(
  pointer: string,
  componentType?: string,
  actualData?: any
): { wrongProp: string; correctProp: string } | undefined {
  if (!pointer || !actualData) return undefined;

  const parts = pointer.split('/');
  const propertyName = parts[parts.length - 1];

  // Try to find correction for known component types
  if (componentType && PROPERTY_NAME_CORRECTIONS[componentType]) {
    const correction = PROPERTY_NAME_CORRECTIONS[componentType][propertyName];
    if (correction) {
      return { wrongProp: propertyName, correctProp: correction };
    }
  }

  // Try all component types if type is unknown
  for (const corrections of Object.values(PROPERTY_NAME_CORRECTIONS)) {
    if (corrections[propertyName]) {
      return { wrongProp: propertyName, correctProp: corrections[propertyName] };
    }
  }

  return undefined;
}

/**
 * Priority order for issue types (higher = more blocking)
 */
const issuePriority: Record<string, number> = {
  'missing-schema-version': 100,
  'unsupported-schema-version': 95,
  'parse-error': 90,
  'validation-error': 80,
  'duplicate-node-id': 70,
  'missing-default-state': 60,
  'missing-error-state': 40,
  'non-zero-tabindex': 30,
};

/**
 * Get priority score for an issue
 */
function getIssuePriority(issue: Issue): number {
  // Critical and error severities get boosted
  let severityBoost = 0;
  if (issue.severity === 'critical') severityBoost = 200;
  else if (issue.severity === 'error') severityBoost = 100;
  else if (issue.severity === 'warn') severityBoost = 50;
  else if (issue.severity === 'info') severityBoost = 10;

  const typePriority = issuePriority[issue.id] ?? 50;
  return severityBoost + typePriority;
}

/**
 * Sort issues by priority (most blocking first)
 */
function sortIssuesByPriority(issues: Issue[]): Issue[] {
  return [...issues].sort((a, b) => {
    const priorityDiff = getIssuePriority(b) - getIssuePriority(a);
    if (priorityDiff !== 0) return priorityDiff;
    
    // If same priority, sort by nodeId for consistency
    if (a.nodeId && b.nodeId) {
      return a.nodeId.localeCompare(b.nodeId);
    }
    return 0;
  });
}

/**
 * Generate a suggestion for a validation error
 */
function generateSuggestion(issue: Issue, actualData?: any): string | undefined {
  // Skip if issue already has a suggestion
  if (issue.suggestion) return issue.suggestion;

  // Generate based on issue type
  switch (issue.id) {
    case 'missing-schema-version':
      return 'Add "schemaVersion": "1.0.0" to the root of your scaffold JSON';

    case 'unsupported-schema-version':
      return 'Change schemaVersion to "1.0.0"';

    case 'validation-error': {
      // Try to generate context-aware suggestions
      const pointer = issue.jsonPointer || '';
      const msg = issue.message.toLowerCase();

      // Detect wrong property names
      const details = issue.details as any;
      const componentType = getComponentTypeFromPointer(pointer, actualData);
      const propError = detectPropertyNameError(pointer, componentType, actualData);
      
      if (propError) {
        return `Property '${propError.wrongProp}' is not valid. Use '${propError.correctProp}' instead`;
      }

      // Handle union errors with specific component type lists
      if (msg.includes('invalid_union') || issue.found === 'none of the union members matched') {
        if (pointer.includes('/root') || pointer.includes('/child') || pointer.includes('/children')) {
          // Provide enriched guidance: list valid types, example snippet matching structural context, next steps
          const example: Record<string, any> = {
            Stack: '{ "id": "stack-1", "type": "Stack", "direction": "vertical", "children": [] }',
            Grid: '{ "id": "grid-1", "type": "Grid", "columns": 2, "children": [] }',
            Box: '{ "id": "box-1", "type": "Box", "child": { /* nested node */ } }',
            Text: '{ "id": "text-1", "type": "Text", "text": "Heading" }',
            Button: '{ "id": "btn-1", "type": "Button", "text": "Submit", "roleHint": "primary" }',
            Field: '{ "id": "field-1", "type": "Field", "label": "Email", "inputType": "email" }',
            Form: '{ "id": "form-1", "type": "Form", "fields": [{ "id": "f1", "type": "Field", "label": "Name" }], "actions": [{ "id": "submit", "type": "Button", "text": "Save" }], "states": ["default"] }',
            Table: '{ "id": "table-1", "type": "Table", "title": "Results", "columns": ["Name"], "responsive": { "strategy": "wrap" } }'
          };
          const exampleSnippets = VALID_NODE_TYPES.map(t => `${t}: ${example[t]}`).join('\n');
          return `Expected a valid node type. Must be one of: ${VALID_NODE_TYPES.join(', ')}.\n` +
            `Example nodes (choose one matching your intent):\n${exampleSnippets}\n` +
            `If you intended a semantic pattern (e.g., guided steps, disclosure), start with a supported structural type and add behaviors.roleHint or run: luma explain --topic scaffold-examples`;
        }
      }

      // Handle invalid_type errors with specific details
      if (details?.code === 'invalid_type') {
        const parts = pointer.split('/');
        const fieldName = parts[parts.length - 1];
        
        if (issue.expected && (issue.found !== undefined || issue.found === undefined)) {
          // Special handling for missing fields (found === 'undefined' or found === undefined)
          if (issue.found === 'undefined' || issue.found === undefined) {
            // Field-specific missing field messages
            if (fieldName === 'text' && componentType === 'Text') {
              return 'Text.text is required: "text": "Your text content"';
            }
            if (fieldName === 'text' && componentType === 'Button') {
              return 'Button.text is required: "text": "Button Label"';
            }
            if (fieldName === 'title' && componentType === 'Table') {
              return 'Table.title is required: "title": "Your Table Title"';
            }
            if (fieldName === 'title' && componentType === 'Form') {
              return 'Form.title is optional but recommended: "title": "Your Form Title"';
            }
            if (fieldName === 'label' && componentType === 'Field') {
              return 'Field.label is required: "label": "Field Label"';
            }
            if (fieldName === 'direction' && componentType === 'Stack') {
              return 'Stack.direction is required: "direction": "vertical" or "horizontal"';
            }
            if (fieldName === 'columns' && componentType === 'Grid') {
              return 'Grid.columns is required: "columns": 2';
            }
            if (fieldName === 'columns' && componentType === 'Table') {
              return 'Table.columns must be a non-empty string array: "columns": ["Column 1", "Column 2"]';
            }
            if (fieldName === 'fields' && componentType === 'Form') {
              return 'Form.fields must be a non-empty array: "fields": [{ "type": "Field", "id": "f1", "label": "Name" }]';
            }
            if (fieldName === 'actions' && componentType === 'Form') {
              return 'Form.actions must be a non-empty array: "actions": [{ "type": "Button", "id": "submit", "text": "Submit" }]';
            }
            if (fieldName === 'children' && (componentType === 'Stack' || componentType === 'Grid')) {
              return `${componentType}.children is required: "children": []`;
            }
            // Generic missing field message
            return `Required property '${fieldName}' is missing. Type: ${issue.expected}`;
          }
          
          // Special case for arrays vs objects
          if (issue.expected.includes('array') && issue.found === 'object') {
            if (fieldName === 'columns') {
              return `Table.columns expects a string array like ["Name", "Email", "Phone"], not an array of objects`;
            }
            return `Property '${fieldName}' expects an array, not an object`;
          }
          
          if (issue.expected.includes('object') && issue.found === 'array') {
            return `Property '${fieldName}' expects an object, not an array`;
          }

          return `Property '${fieldName}' expects type ${issue.expected}, but got ${issue.found}`;
        }
      }

      // Missing required field
      if (msg.includes('required') || msg.includes('missing')) {
        if (pointer.includes('responsive/strategy')) {
          return 'Table requires: "responsive": { "strategy": "scroll", "minColumnWidth": 160 }';
        }
        if (pointer.includes('title') && pointer.includes('table')) {
          return 'Table.title is required: "title": "Your Table Title"';
        }
        if (pointer.includes('title') && pointer.includes('form')) {
          return 'Form.title is optional but recommended: "title": "Your Form Title"';
        }
        if (pointer.includes('label') && pointer.includes('field')) {
          return 'Field.label is required and cannot be empty: "label": "Field Label"';
        }
        if (pointer.includes('fields')) {
          return 'Form.fields must be a non-empty array: "fields": [{ "type": "Field", "id": "f1", "label": "Name" }]';
        }
        if (pointer.includes('actions')) {
          return 'Form.actions must be a non-empty array: "actions": [{ "type": "Button", "id": "submit", "text": "Submit" }]';
        }
        if (pointer.includes('states') && pointer.includes('form')) {
          return 'Form.states is required: "states": ["default"]';
        }
        if (pointer.includes('columns') && pointer.includes('table')) {
          return 'Table.columns must be a non-empty string array: "columns": ["Column 1", "Column 2"]';
        }
        if (pointer.includes('text')) {
          return 'Text.text is required: "text": "Your text content"';
        }
        if (pointer.includes('direction')) {
          return 'Stack.direction is required: "direction": "vertical" or "horizontal"';
        }
        // Generic missing field
        if (issue.expected) {
          const fieldName = pointer.split('/').pop() || 'field';
          return `Required property '${fieldName}' is missing. Type: ${issue.expected}`;
        }
      }

      // Invalid enum value
      if (msg.includes('invalid enum') || msg.includes('invalid_enum_value') || msg.includes('invalid_value') || details?.code === 'invalid_enum_value' || details?.code === 'invalid_value') {
        const parts = pointer.split('/');
        const fieldName = parts[parts.length - 1];
        
        // Field-specific enum messages
        if (fieldName === 'direction' && componentType === 'Stack') {
          return 'Stack.direction must be "vertical" or "horizontal"';
        }
        if (fieldName === 'roleHint' && componentType === 'Button') {
          return 'Button.roleHint must be one of: "primary", "secondary", "danger"';
        }
        if (fieldName === 'inputType' && componentType === 'Field') {
          return 'Field.inputType must be one of: "text", "email", "password", "number", "tel", "url"';
        }
        if (fieldName === 'strategy' && pointer.includes('responsive')) {
          return 'responsive.strategy must be one of: "scroll", "stack", "hide"';
        }
        
        if (issue.expected && issue.expected.includes('one of:')) {
          return `Invalid value. ${issue.expected}`;
        }
        // Extract enum options from details if available
        if (details?.options) {
          const options = Array.isArray(details.options) ? details.options.join(', ') : details.options;
          return `Invalid enum value. Must be one of: ${options}`;
        }
      }

      // Invalid literal
      if (details?.code === 'invalid_literal') {
        if (details?.expected) {
          return `Expected literal value: ${details.expected}`;
        }
      }

      // Invalid type
      if (msg.includes('invalid type') || msg.includes('expected')) {
        if (issue.expected) {
          return `Value must be of type: ${issue.expected}`;
        }
      }

      // Array too small
      if (msg.includes('array') && (msg.includes('must have') || msg.includes('minimum')) || details?.code === 'too_small') {
        const fieldName = pointer.split('/').pop() || 'array';
        
        // Field-specific array size messages
        if (fieldName === 'fields' && componentType === 'Form') {
          return 'Form must have at least one Field in the fields array';
        }
        if (fieldName === 'actions' && componentType === 'Form') {
          return 'Form must have at least one Button in the actions array';
        }
        if (fieldName === 'columns' && componentType === 'Table') {
          return 'Table must have at least one column in the columns array';
        }
        if (fieldName === 'states' && componentType === 'Form') {
          return 'Form.states must include at least "default"';
        }
        if (fieldName === 'children' && (componentType === 'Stack' || componentType === 'Grid')) {
          return `${componentType} must have at least one child in the children array`;
        }
        
        // Generic array size message
        return `Array '${fieldName}' must have at least one item`;
      }

      // String too short
      if (msg.includes('cannot be empty') || (msg.includes('string') && msg.includes('minimum'))) {
        const fieldName = pointer.split('/').pop() || 'field';
        return `Property '${fieldName}' cannot be empty. Provide a non-empty string value`;
      }

      // Unrecognized property (Zod's unrecognized_keys)
      if (details?.code === 'unrecognized_keys' || msg.includes('unrecognized')) {
        if (details?.keys && Array.isArray(details.keys)) {
          // Check if we have a specific correction for any of the unrecognized keys
          if (componentType && PROPERTY_NAME_CORRECTIONS[componentType]) {
            const corrections = PROPERTY_NAME_CORRECTIONS[componentType];
            const correctedKeys = details.keys.map((key: string) => {
              const correction = corrections[key];
              if (correction) {
                return `'${key}' (use '${correction}' instead)`;
              }
              return `'${key}'`;
            });
            return `Unrecognized properties in ${componentType}: ${correctedKeys.join(', ')}. Check spelling or remove these properties`;
          }
          
          const keys = details.keys.join(', ');
          const componentHint = componentType ? ` in ${componentType}` : '';
          return `Unrecognized properties${componentHint}: ${keys}. Check spelling or remove these properties`;
        }
      }

      break;
    }

    case 'duplicate-node-id':
      return 'Ensure all node IDs are unique within the scaffold';

    case 'missing-default-state':
      return 'Add "default" to the states array';

    case 'missing-error-state':
      return 'Add "error" to the states array since fields have errorText';

    case 'non-zero-tabindex':
      return 'Remove tabIndex or set it to 0 for natural tab order';
  }

  return undefined;
}

/**
 * Generate next action recommendation
 */
function generateNextAction(issue: Issue, filePath?: string): string {
  const file = filePath || 'path/to/file.mock.json';
  
  switch (issue.severity) {
    case 'critical':
    case 'error':
      if (issue.suggestion) {
        return `Fix the issue and rerun: luma ingest ${file}`;
      }
      return `Correct the error at ${issue.jsonPointer || 'the indicated location'} and rerun validation`;

    case 'warn':
      return `Consider addressing this warning, then rerun: luma ingest ${file}`;

    case 'info':
      return 'This is informational only; no immediate action required';

    default:
      return `Review the issue and rerun: luma ingest ${file}`;
  }
}

/**
 * Enhance a single issue with suggestion and nextAction
 */
export function enhanceIssue(
  issue: Issue,
  options: ErrorEnhancementOptions = {},
  filePath?: string,
  actualData?: any
): Issue {
  const enhanced: Issue = { ...issue };

  // Add suggestion if not suppressed and not already present
  if (!options.noSuggest && !enhanced.suggestion) {
    const suggestion = generateSuggestion(issue, actualData);
    if (suggestion) {
      enhanced.suggestion = suggestion;
    }
  }

  // Add nextAction if in verbose mode or if it's a critical/error
  if (options.format === 'verbose' || issue.severity === 'critical' || issue.severity === 'error') {
    enhanced.details = enhanced.details || {};
    (enhanced.details as any).nextAction = generateNextAction(enhanced, filePath);
  }

  return enhanced;
}

/**
 * Enhance issues according to options
 * - Adds suggestions and nextAction
 * - Prioritizes single most blocking issue if allIssues=false
 * - Respects noSuggest flag
 */
export function enhanceIssues(
  issues: Issue[],
  options: ErrorEnhancementOptions = {},
  filePath?: string,
  actualData?: any
): Issue[] {
  if (issues.length === 0) {
    return [];
  }

  // Sort by priority
  const sorted = sortIssuesByPriority(issues);

  // Filter to single issue if not showing all
  const toEnhance = options.allIssues ? sorted : [sorted[0]];

  // Enhance each issue
  return toEnhance.map((issue) => enhanceIssue(issue, options, filePath, actualData));
}

/**
 * Format issues for console output
 */
export function formatIssuesForConsole(
  issues: Issue[],
  options: ErrorEnhancementOptions = {}
): string {
  if (issues.length === 0) {
    return 'No issues found.';
  }

  const lines: string[] = [];
  const isVerbose = options.format === 'verbose';

  issues.forEach((issue, index) => {
    // Issue header
    lines.push(`[${issue.severity.toUpperCase()}] ${issue.id}`);
    lines.push(`  ${issue.message}`);

    // Location info
    if (issue.nodeId) {
      lines.push(`  Node: ${issue.nodeId}`);
    }
    if (issue.jsonPointer && isVerbose) {
      lines.push(`  Location: ${issue.jsonPointer}`);
    }

    // Expected/found
    if (isVerbose && issue.expected) {
      lines.push(`  Expected: ${issue.expected}`);
    }
    if (isVerbose && issue.found !== undefined) {
      lines.push(`  Found: ${JSON.stringify(issue.found)}`);
    }

    // Suggestion
    if (issue.suggestion && !options.noSuggest) {
      lines.push(`  💡 Suggestion: ${issue.suggestion}`);
    }

    // Next action
    if (isVerbose && issue.details && (issue.details as any).nextAction) {
      lines.push(`  ➡️  Next: ${(issue.details as any).nextAction}`);
    }

    // Separator between issues
    if (index < issues.length - 1) {
      lines.push('');
    }
  });

  return lines.join('\n');
}
