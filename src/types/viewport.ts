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
  const [width, height] = viewport.split('x').map(Number);
  return { width, height };
}

export function formatViewport(viewport: Viewport): ViewportString {
  return `${viewport.width}x${viewport.height}`;
}
