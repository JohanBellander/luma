import { describe, it, expect } from 'vitest';
import { ingest } from '../src/core/ingest/ingest.js';
import { enhanceIssues } from '../src/core/ingest/error-enhancer.js';

// Construct a scaffold with an invalid node type at root to trigger union guidance suggestion
const INVALID_SCAFFOLD = {
  schemaVersion: '1.0.0',
  screen: {
    id: 'screen-1',
    title: 'Invalid Root',
    root: {
      id: 'mystery-1',
      type: 'MysteryComponent', // invalid type to trigger union error
      children: []
    }
  },
  settings: { spacingScale: [4,8,12], minTouchTarget: { w: 44, h: 44 }, breakpoints: ['320x640'] }
};

describe('error-enhancer invalid node type suggestion (LUMA-130)', () => {
  it('provides enriched guidance listing valid node types and examples', () => {
    const result = ingest(INVALID_SCAFFOLD as any);
    expect(result.valid).toBe(false);
    const enhanced = enhanceIssues(result.issues, { allIssues: true }, 'invalid.json', INVALID_SCAFFOLD);
    // Find validation-error with union guidance text
    const unionIssue = enhanced.find(i => i.id === 'validation-error' && (i.suggestion || '').includes('Must be one of')); 
    expect(unionIssue).toBeDefined();
    expect(unionIssue!.suggestion).toMatch(/Stack/);
    expect(unionIssue!.suggestion).toMatch(/Example nodes/);
  });
});
