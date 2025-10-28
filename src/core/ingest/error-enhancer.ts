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
function generateSuggestion(issue: Issue): string | undefined {
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

      // Missing required field
      if (msg.includes('required') || msg.includes('missing')) {
        if (pointer.includes('responsive/strategy')) {
          return '"responsive": { "strategy": "scroll", "minColumnWidth": 160 }';
        }
        if (pointer.includes('title')) {
          return '"title": "Your Table Title"';
        }
        if (pointer.includes('fields')) {
          return 'Add at least one Field to the fields array';
        }
        if (pointer.includes('actions')) {
          return 'Add at least one Button to the actions array';
        }
        if (pointer.includes('states') && pointer.includes('form')) {
          return '"states": ["default"]';
        }
        if (pointer.includes('columns') && pointer.includes('table')) {
          return '"columns": ["Column 1", "Column 2"]';
        }
        // Generic missing field
        if (issue.expected) {
          const fieldName = pointer.split('/').pop() || 'field';
          return `Add missing "${fieldName}" property`;
        }
      }

      // Invalid enum value
      if (msg.includes('invalid enum') || msg.includes('invalid_enum_value')) {
        if (issue.expected && issue.expected.includes('one of:')) {
          return `Use ${issue.expected}`;
        }
      }

      // Invalid type
      if (msg.includes('invalid type') || msg.includes('expected')) {
        if (issue.expected) {
          return `Ensure this value is of type: ${issue.expected}`;
        }
      }

      // Array too small
      if (msg.includes('array') && (msg.includes('must have') || msg.includes('minimum'))) {
        const fieldName = pointer.split('/').pop() || 'array';
        return `Add more items to the ${fieldName} array to meet minimum requirements`;
      }

      // String too short
      if (msg.includes('cannot be empty') || (msg.includes('string') && msg.includes('minimum'))) {
        const fieldName = pointer.split('/').pop() || 'field';
        return `Provide a non-empty value for "${fieldName}"`;
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
export function enhanceIssue(issue: Issue, options: ErrorEnhancementOptions = {}, filePath?: string): Issue {
  const enhanced: Issue = { ...issue };

  // Add suggestion if not suppressed and not already present
  if (!options.noSuggest && !enhanced.suggestion) {
    const suggestion = generateSuggestion(issue);
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
  filePath?: string
): Issue[] {
  if (issues.length === 0) {
    return [];
  }

  // Sort by priority
  const sorted = sortIssuesByPriority(issues);

  // Filter to single issue if not showing all
  const toEnhance = options.allIssues ? sorted : [sorted[0]];

  // Enhance each issue
  return toEnhance.map((issue) => enhanceIssue(issue, options, filePath));
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
