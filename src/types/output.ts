/**
 * Command output types for LUMA
 */

import type { Issue } from './issue.js';
import type { Frame } from './viewport.js';

export interface IngestOutput {
  valid: boolean;
  normalized?: unknown; // Normalized scaffold
  issues: Issue[];
  rawData?: unknown; // Original data for error enhancement
}

export interface LayoutOutput {
  viewport: string;
  frames: Frame[];
  issues: Issue[];
}

export interface LayoutDiffChange {
  id: string;
  before?: Frame; // undefined if added
  after?: Frame;  // undefined if removed
  delta?: { dx: number; dy: number; dw: number; dh: number }; // present if moved/resized
  changeType: 'added' | 'removed' | 'moved' | 'resized' | 'moved_resized' | 'unchanged';
}

export interface LayoutDiffOutput {
  viewport: string;
  added: Frame[];
  removed: Frame[];
  changed: LayoutDiffChange[]; // moved / resized breakdown
  unchangedCount: number;
  issueDelta: {
    added: Issue[];
    removed: Issue[];
  };
}

export interface KeyboardOutput {
  sequence: string[]; // ordered nodeIds
  unreachable: string[]; // focusable nodeIds not reached
  issues: Issue[];
}

export interface CategoryScore {
  category: string;
  score: number; // 0-100
  weight: number; // percentage as decimal (e.g., 0.45 for 45%)
}

export interface ScoreOutput {
  overall: number; // 0-100
  categories: CategoryScore[];
  passed: boolean; // No MUST failures, no critical errors
  issues: Issue[];
}

export interface ReportOutput {
  summary: string;
  score: ScoreOutput;
  details: {
    layout: LayoutOutput[];
    keyboard: KeyboardOutput;
    patterns: Issue[];
  };
}
