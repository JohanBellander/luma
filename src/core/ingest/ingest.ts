/**
 * Main ingest orchestrator for LUMA
 * Validates, normalizes, and processes scaffolds
 */

import { ZodError } from 'zod';
import type { Issue } from '../../types/issue.js';
import type { IngestOutput } from '../../types/output.js';
import type { Node } from '../../types/node.js';
import { scaffoldSchema } from './validator.js';
import { validateSchemaVersion } from './schema-version.js';
import { normalizeScaffold } from './normalize.js';

/**
 * Find duplicate node IDs
 */
function findDuplicateNodeIds(node: Node): Issue[] {
  const issues: Issue[] = [];
  const seenIds = new Map<string, number>();

  function traverse(n: Node) {
    const count = seenIds.get(n.id) || 0;
    seenIds.set(n.id, count + 1);

    switch (n.type) {
      case 'Stack':
      case 'Grid':
        n.children.forEach(traverse);
        break;
      case 'Box':
        if (n.child) traverse(n.child);
        break;
      case 'Form':
        n.fields.forEach(traverse);
        n.actions.forEach(traverse);
        break;
    }
  }

  traverse(node);

  seenIds.forEach((count, id) => {
    if (count > 1) {
      issues.push({
        id: 'duplicate-node-id',
        severity: 'error',
        message: `Duplicate node ID: "${id}" appears ${count} times`,
        nodeId: id,
        suggestion: 'Ensure all node IDs are unique within the scaffold',
      });
    }
  });

  return issues;
}

/**
 * Check for non-zero tabIndex (discouraged)
 */
function checkTabIndex(node: Node): Issue[] {
  const issues: Issue[] = [];

  function traverse(n: Node) {
    if (n.type === 'Button' && n.tabIndex !== undefined && n.tabIndex !== 0) {
      issues.push({
        id: 'non-zero-tabindex',
        severity: 'warn',
        message: `Non-zero tabIndex (${n.tabIndex}) is discouraged`,
        nodeId: n.id,
        suggestion: 'Use default tab order (tabIndex=0) for better accessibility',
      });
    }

    switch (n.type) {
      case 'Stack':
      case 'Grid':
        n.children.forEach(traverse);
        break;
      case 'Box':
        if (n.child) traverse(n.child);
        break;
      case 'Form':
        n.fields.forEach(traverse);
        n.actions.forEach(traverse);
        break;
    }
  }

  traverse(node);
  return issues;
}

/**
 * Validate Form states
 */
function validateFormStates(node: Node): Issue[] {
  const issues: Issue[] = [];

  function traverse(n: Node) {
    if (n.type === 'Form') {
      // Must include "default" state
      if (!n.states.includes('default')) {
        issues.push({
          id: 'missing-default-state',
          severity: 'error',
          message: 'Form states must include "default"',
          nodeId: n.id,
          suggestion: 'Add "default" to the states array',
        });
      }

      // Should include "error" state if any field has errorText
      const hasErrorText = n.fields.some((f) => f.errorText);
      if (hasErrorText && !n.states.includes('error')) {
        issues.push({
          id: 'missing-error-state',
          severity: 'warn',
          message: 'Form has fields with errorText but states does not include "error"',
          nodeId: n.id,
          suggestion: 'Add "error" to the states array',
        });
      }
    }

    switch (n.type) {
      case 'Stack':
      case 'Grid':
        n.children.forEach(traverse);
        break;
      case 'Box':
        if (n.child) traverse(n.child);
        break;
      case 'Form':
        n.fields.forEach(traverse);
        n.actions.forEach(traverse);
        break;
    }
  }

  traverse(node);
  return issues;
}

/**
 * Ingest and validate a scaffold
 */
export function ingest(rawData: unknown): IngestOutput {
  const issues: Issue[] = [];

  try {
    // Parse as object
    const data = rawData as any;

    // Check schema version first
    if (!data.schemaVersion) {
      return {
        valid: false,
        issues: [
          {
            id: 'missing-schema-version',
            severity: 'critical',
            message: 'Missing required field: schemaVersion',
            suggestion: 'Add "schemaVersion": "1.0.0" to the scaffold',
          },
        ],
      };
    }

    const versionIssue = validateSchemaVersion(data.schemaVersion);
    if (versionIssue) {
      return {
        valid: false,
        issues: [versionIssue],
      };
    }

    // Validate with Zod schema
    const result = scaffoldSchema.safeParse(data);

    if (!result.success) {
      // Convert Zod errors to Issues
      const zodError = result.error as ZodError;
      zodError.issues.forEach((err) => {
        issues.push({
          id: 'validation-error',
          severity: 'error',
          message: err.message,
          jsonPointer: err.path.length > 0 ? '/' + err.path.join('/') : undefined,
          details: { code: err.code, path: err.path },
        });
      });

      return {
        valid: false,
        issues,
      };
    }

    // Normalize the scaffold
    const normalized = normalizeScaffold(result.data);

    // Additional validations
    const duplicateIssues = findDuplicateNodeIds(normalized.screen.root);
    issues.push(...duplicateIssues);

    const tabIndexIssues = checkTabIndex(normalized.screen.root);
    issues.push(...tabIndexIssues);

    const formStateIssues = validateFormStates(normalized.screen.root);
    issues.push(...formStateIssues);

    // Check if there are any errors or critical issues
    const hasBlockingIssues = issues.some(
      (issue) => issue.severity === 'error' || issue.severity === 'critical'
    );

    return {
      valid: !hasBlockingIssues,
      normalized,
      issues,
    };
  } catch (error) {
    return {
      valid: false,
      issues: [
        {
          id: 'parse-error',
          severity: 'critical',
          message: error instanceof Error ? error.message : 'Unknown parse error',
        },
      ],
    };
  }
}
