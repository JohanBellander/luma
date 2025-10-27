/**
 * Scaffold JSON type definitions for LUMA
 */

import type { Node } from './node.js';

export interface MinTouchTarget {
  w: number;
  h: number;
}

export interface ScaffoldSettings {
  spacingScale: number[]; // allowed gaps/padding, e.g., [4,8,12,16,24,32]
  minTouchTarget: MinTouchTarget; // default expectation 44×44
  breakpoints: string[]; // e.g., ["320x640","768x1024","1280x800"]
}

export interface Screen {
  id: string; // required
  title?: string;
  root: Node; // required
}

export interface Scaffold {
  schemaVersion: string; // supported: "1.0.0"
  screen: Screen;
  settings: ScaffoldSettings;
}
