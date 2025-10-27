/**
 * Command output types for LUMA
 */

import type { Issue } from './issue.js';
import type { Frame } from './viewport.js';

export interface IngestOutput {
  valid: boolean;
  normalized?: unknown; // Normalized scaffold
  issues: Issue[];
}

export interface LayoutOutput {
  viewport: string;
  frames: Frame[];
  issues: Issue[];
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
