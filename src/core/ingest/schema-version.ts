/**
 * Schema version validation for LUMA
 */

import type { Issue } from '../../types/issue.js';

const SUPPORTED_VERSIONS = ['1.0.0'];

/**
 * Validate the schema version
 * @param version - Schema version from the scaffold
 * @returns Issue if version is unsupported, null otherwise
 */
export function validateSchemaVersion(version: string): Issue | null {
  if (!SUPPORTED_VERSIONS.includes(version)) {
    return {
      id: 'unsupported-schema-version',
      severity: 'critical',
      message: `Unsupported schema version: ${version}. Supported versions: ${SUPPORTED_VERSIONS.join(', ')}`,
      suggestion: `Update schemaVersion to one of: ${SUPPORTED_VERSIONS.join(', ')}`,
    };
  }
  return null;
}

/**
 * Check if a schema version is supported
 * @param version - Schema version to check
 * @returns true if supported, false otherwise
 */
export function isSupportedVersion(version: string): boolean {
  return SUPPORTED_VERSIONS.includes(version);
}

export { SUPPORTED_VERSIONS };
