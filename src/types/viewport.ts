/**
 * Viewport types for LUMA
 */

export interface Viewport {
  width: number;
  height: number;
}

export interface Frame {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export type ViewportString = string; // e.g., "320x640"

export function parseViewport(viewport: ViewportString): Viewport {
  // Normalize and validate viewport string
  if (typeof viewport !== 'string') {
    throw new Error(`Invalid viewport type: expected string, got ${typeof viewport}`);
  }

  const trimmed = viewport.trim();
  // Accept separators 'x' or 'X'; tolerate surrounding whitespace
  const parts = trimmed.split(/x|X/).map(p => p.trim());
  if (parts.length !== 2 || parts[0] === '' || parts[1] === '') {
    throw new Error(`Invalid viewport format: '${viewport}' (expected <width>x<height>, e.g. 320x640)`);
  }

  const width = Number(parts[0]);
  const height = Number(parts[1]);

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0 || !Number.isInteger(width) || !Number.isInteger(height)) {
    throw new Error(`Invalid viewport dimensions: '${viewport}' (width and height must be positive integers)`);
  }

  return { width, height };
}

export function formatViewport(viewport: Viewport): ViewportString {
  return `${viewport.width}x${viewport.height}`;
}
