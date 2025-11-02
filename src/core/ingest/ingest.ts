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
import { hasPattern } from '../patterns/pattern-registry.js';

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
 * Collect optional pattern annotation warnings (non-blocking).
 * Emits a warn issue when a node carries a 'pattern' property that does not
 * resolve to a known pattern or alias. Forward-looking; annotations are
 * ignored if valid for now.
 */
function collectPatternAnnotationIssues(node: Node): Issue[] {
  const annIssues: Issue[] = [];
  function walk(n: Node) {
    const annotated = (n as any).pattern as string | undefined;
    if (annotated) {
      if (!hasPattern(annotated)) {
        annIssues.push({
          id: 'unknown-pattern-annotation',
          severity: 'warn',
          message: `Pattern annotation '${annotated}' is not a known pattern or alias`,
          nodeId: n.id,
          suggestion: 'Remove or correct the pattern name (see: luma patterns --list)',
        });
      }
    }
    switch (n.type) {
      case 'Stack':
      case 'Grid':
        n.children.forEach(walk); break;
      case 'Box':
        if (n.child) walk(n.child); break;
      case 'Form':
        n.fields.forEach(walk); n.actions.forEach(walk); break;
    }
  }
  walk(node);
  return annIssues;
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
            jsonPointer: '/schemaVersion',
            expected: '"1.0.0" or "1.1.0"',
            found: undefined,
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
        // Special handling for invalid_union errors - extract nested specific errors
        if (err.code === 'invalid_union' && 'errors' in err && Array.isArray((err as any).errors)) {
          const unionErrors = (err as any).errors;
          
          // Check if this is a discriminator error (no matching union member)
          const note = (err as any).note;

          if (unionErrors.length === 0 || note === 'No matching discriminator') {
            // This is a discriminator mismatch - keep the union error
            const fullPath = err.path.length > 0 ? '/' + err.path.join('/') : undefined;
            issues.push({
              id: 'validation-error',
              severity: 'error',
              message: err.message,
              jsonPointer: fullPath,
              found: 'none of the union members matched',
              details: { code: err.code, path: err.path },
            });
            return;
          }
          
          // Check if ALL union members failed on the 'type' discriminator
          // This indicates an invalid type value (e.g., type: 'InvalidType')
          const allFailedOnType = unionErrors.every((unionErr: any) => {
            if (!Array.isArray(unionErr) || unionErr.length === 0) return false;
            const firstError = unionErr[0];
            return firstError.path && firstError.path.length > 0 && firstError.path[firstError.path.length - 1] === 'type';
          });
          
          if (allFailedOnType) {
            // Create a union error for invalid discriminator
            const fullPath = err.path.length > 0 ? '/' + err.path.join('/') : undefined;
            issues.push({
              id: 'validation-error',
              severity: 'error',
              message: 'Invalid node type',
              jsonPointer: fullPath,
              found: 'none of the union members matched',
              details: { code: err.code, path: err.path },
            });
            return;
          }
          
          // Collect all nested errors from union attempts
          const nestedErrorsMap = new Map<string, any[]>();
          
          unionErrors.forEach((unionErr: any) => {
            if (Array.isArray(unionErr)) {
              unionErr.forEach((nestedErr: any) => {
                const pathKey = nestedErr.path.join('/');
                if (!nestedErrorsMap.has(pathKey)) {
                  nestedErrorsMap.set(pathKey, []);
                }
                nestedErrorsMap.get(pathKey)!.push(nestedErr);
              });
            }
          });

          // Process errors by path - prioritize most useful error types
          const extractedIssues: Issue[] = [];
          nestedErrorsMap.forEach((errors, pathKey) => {
            // Priority order: unrecognized_keys > invalid_type > invalid_enum_value > invalid_value > too_small > others
            const priorityOrder = ['unrecognized_keys', 'invalid_type', 'invalid_enum_value', 'invalid_value', 'invalid_literal', 'too_small', 'too_big'];
            
            // Find the highest priority error
            let selectedError: any = null;
            for (const priority of priorityOrder) {
              selectedError = errors.find(e => e.code === priority);
              if (selectedError) break;
            }
            if (!selectedError) selectedError = errors[0];
            
            if (selectedError) {
              const fullPath = err.path.concat(pathKey.split('/').filter(p => p.length > 0));
              const errAny = selectedError;
              
              // Build issue based on error type
              let enhancedMessage = selectedError.message;
              const issue: Issue = {
                id: 'validation-error',
                severity: 'error',
                message: enhancedMessage,
                jsonPointer: fullPath.length > 0 ? '/' + fullPath.join('/') : undefined,
                details: { code: selectedError.code, path: fullPath },
              };

              // Customize based on error code
              switch (selectedError.code) {
                case 'unrecognized_keys':
                  if (errAny.keys) {
                    issue.message = `Unrecognized keys in object: ${errAny.keys.join(', ')}`;
                    issue.expected = 'valid properties only';
                    issue.found = `unrecognized: ${errAny.keys.join(', ')}`;
                    (issue.details as any).keys = errAny.keys;
                  }
                  break;
                case 'invalid_type':
                  issue.message = `Invalid type: expected ${errAny.expected}, received ${errAny.received}`;
                  issue.expected = errAny.expected;
                  issue.found = errAny.received;
                  break;
                case 'too_small':
                  if (errAny.type === 'array') {
                    issue.message = `Array must have at least ${errAny.minimum} item(s)`;
                    issue.expected = `minimum ${errAny.minimum} items`;
                    issue.found = `${errAny.received || 0} items`;
                  } else if (errAny.type === 'string') {
                    issue.message = `String must have at least ${errAny.minimum} character(s)`;
                    issue.expected = `minimum ${errAny.minimum} characters`;
                    issue.found = `${errAny.received || 0} characters`;
                  }
                  break;
                case 'invalid_enum_value':
                case 'invalid_literal':
                case 'invalid_value':  // Handle z.enum errors
                  if (errAny.options && Array.isArray(errAny.options)) {
                    issue.message = `Invalid value. Expected one of: ${errAny.options.join(', ')}`;
                    issue.expected = `one of: ${errAny.options.join(', ')}`;
                    issue.found = errAny.received;
                    (issue.details as any).options = errAny.options;
                  } else if (errAny.values && Array.isArray(errAny.values)) {
                    // z.enum uses 'values' instead of 'options'
                    issue.message = `Invalid value. Expected one of: ${errAny.values.join(', ')}`;
                    issue.expected = `one of: ${errAny.values.join(', ')}`;
                    issue.found = errAny.received;
                    (issue.details as any).options = errAny.values;
                  } else if (errAny.expected) {
                    issue.expected = String(errAny.expected);
                    issue.found = errAny.received;
                  }
                  break;
              }
              
              extractedIssues.push(issue);
            }
          });

          // If we extracted specific errors, use them instead of the generic union error
          if (extractedIssues.length > 0) {
            issues.push(...extractedIssues);
            return;
          }
        }

        // Build a more descriptive message
        let enhancedMessage = err.message;
        const errAny = err as any;

        // Enhance message based on error code
        if (err.code === 'invalid_union') {
          enhancedMessage = 'Invalid input: none of the union members matched';
        } else if (err.code === 'invalid_type') {
          enhancedMessage = `Invalid type: expected ${errAny.expected}, received ${errAny.received}`;
        } else if (err.code === 'too_small') {
          if (errAny.type === 'array') {
            enhancedMessage = `Array must have at least ${errAny.minimum} item(s)`;
          } else if (errAny.type === 'string') {
            enhancedMessage = `String must have at least ${errAny.minimum} character(s)`;
          }
        } else if (err.code === 'unrecognized_keys') {
          if (errAny.keys) {
            enhancedMessage = `Unrecognized keys in object: ${errAny.keys.join(', ')}`;
          }
        } else if (errAny.options && Array.isArray(errAny.options)) {
          // Handle enum-like errors (invalid literal, invalid enum, etc.)
          enhancedMessage = `Invalid value. Expected one of: ${errAny.options.join(', ')}`;
        }

        const issue: Issue = {
          id: 'validation-error',
          severity: 'error',
          message: enhancedMessage,
          jsonPointer: err.path.length > 0 ? '/' + err.path.join('/') : undefined,
          details: { code: err.code, path: err.path },
        };

        // Extract expected and found values based on error code
        switch (err.code) {
          case 'invalid_type':
            issue.expected = errAny.expected;
            issue.found = errAny.received;
            break;
          case 'too_small':
            // Check minimum property to determine constraint
            if (errAny.type === 'string') {
              issue.expected = `minimum ${errAny.minimum} characters`;
              issue.found = errAny.received !== undefined ? `${errAny.received} characters` : undefined;
            } else if (errAny.type === 'array') {
              issue.expected = `minimum ${errAny.minimum} items`;
              issue.found = errAny.received !== undefined ? `${errAny.received} items` : 'empty array';
            } else if (errAny.type === 'number') {
              issue.expected = `>= ${errAny.minimum}`;
              issue.found = errAny.received;
            } else {
              // Generic handling
              issue.expected = `minimum ${errAny.minimum}`;
              issue.found = errAny.received;
            }
            break;
          case 'too_big':
            if (errAny.type === 'string') {
              issue.expected = `maximum ${errAny.maximum} characters`;
              issue.found = errAny.received !== undefined ? `${errAny.received} characters` : undefined;
            } else if (errAny.type === 'array') {
              issue.expected = `maximum ${errAny.maximum} items`;
              issue.found = errAny.received !== undefined ? `${errAny.received} items` : undefined;
            } else if (errAny.type === 'number') {
              issue.expected = `<= ${errAny.maximum}`;
              issue.found = errAny.received;
            } else {
              // Generic handling
              issue.expected = `maximum ${errAny.maximum}`;
              issue.found = errAny.received;
            }
            break;
          case 'invalid_union':
            issue.expected = 'valid union member';
            issue.found = 'none of the union members matched';
            break;
          case 'unrecognized_keys':
            if (errAny.keys) {
              issue.expected = 'valid properties only';
              issue.found = `unrecognized: ${errAny.keys.join(', ')}`;
              // Store keys in details for later use
              (issue.details as any).keys = errAny.keys;
            }
            break;
          default:
            // For other error types (e.g., invalid enum, literals)
            // Check for options or values array (enum-like errors)
            if (errAny.options && Array.isArray(errAny.options)) {
              issue.expected = `one of: ${errAny.options.join(', ')}`;
              issue.found = errAny.received;
              (issue.details as any).options = errAny.options;
            } else if (errAny.values && Array.isArray(errAny.values)) {
              // z.enum uses 'values' instead of 'options'
              issue.expected = `one of: ${errAny.values.join(', ')}`;
              issue.found = errAny.received;
              (issue.details as any).options = errAny.values;
            } else {
              // Generic fallback
              if (errAny.expected !== undefined) {
                issue.expected = String(errAny.expected);
              }
              if (errAny.received !== undefined) {
                issue.found = errAny.received;
              }
            }
        }

        issues.push(issue);
      });

      return {
        valid: false,
        issues,
        rawData: data, // Store raw data for error enhancement
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

  // Pattern annotation warnings (non-blocking)
  issues.push(...collectPatternAnnotationIssues(normalized.screen.root));

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
