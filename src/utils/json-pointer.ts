/**
 * JSON Pointer utilities for LUMA issue reporting
 * Implements RFC 6901 JSON Pointer
 */

/**
 * Encode a token for use in a JSON pointer
 */
function encodeToken(token: string): string {
  return token.replace(/~/g, '~0').replace(/\//g, '~1');
}

/**
 * Build a JSON pointer from path segments
 * @param segments - Array of path segments
 * @returns JSON pointer string (e.g., "/screen/root/children/1")
 */
export function buildJsonPointer(segments: (string | number)[]): string {
  if (segments.length === 0) {
    return '';
  }
  return '/' + segments.map((s) => encodeToken(String(s))).join('/');
}

/**
 * Decode a token from a JSON pointer
 */
function decodeToken(token: string): string {
  return token.replace(/~1/g, '/').replace(/~0/g, '~');
}

/**
 * Parse a JSON pointer into path segments
 * @param pointer - JSON pointer string
 * @returns Array of path segments
 */
export function parseJsonPointer(pointer: string): string[] {
  if (pointer === '') {
    return [];
  }
  if (!pointer.startsWith('/')) {
    throw new Error('Invalid JSON pointer: must start with /');
  }
  return pointer.slice(1).split('/').map(decodeToken);
}

/**
 * Resolve a JSON pointer against an object
 * @param obj - Object to resolve against
 * @param pointer - JSON pointer string
 * @returns The value at the pointer, or undefined if not found
 */
export function resolveJsonPointer(obj: unknown, pointer: string): unknown {
  if (pointer === '') {
    return obj;
  }

  const segments = parseJsonPointer(pointer);
  let current: Record<string, unknown> | unknown = obj;

  for (const segment of segments) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current === 'object' && current !== null) {
      current = (current as Record<string, unknown>)[segment];
    } else {
      return undefined;
    }
  }

  return current;
}
