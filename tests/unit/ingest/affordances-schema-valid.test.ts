import { describe, it, expect } from 'vitest';
import { ingest } from '../../../src/core/ingest/ingest.js';

function baseSettings() {
  return {
    spacingScale: [4, 8, 12, 16, 24],
    minTouchTarget: { w: 44, h: 44 },
    breakpoints: ['320x640'],
  };
}

describe('Affordances array schema', () => {
  it('accepts valid affordances array with string values', () => {
    const scaffold = {
      schemaVersion: '1.0.0',
      screen: {
        id: 'test',
        root: {
          id: 'box1',
          type: 'Box',
          affordances: ['chevron', 'details', 'accordion'],
          child: {
            id: 'text1',
            type: 'Text',
            text: 'Hello'
          }
        }
      },
      settings: baseSettings()
    };

    const result = ingest(scaffold);
    expect(result.valid).toBe(true);
    expect(result.issues.find(i => i.severity === 'error')).toBeUndefined();
  });

  it('accepts empty affordances array', () => {
    const scaffold = {
      schemaVersion: '1.0.0',
      screen: {
        id: 'test',
        root: {
          id: 'stack1',
          type: 'Stack',
          direction: 'vertical',
          affordances: [],
          children: [
            { id: 't1', type: 'Text', text: 'A' }
          ]
        }
      },
      settings: baseSettings()
    };

    const result = ingest(scaffold);
    expect(result.valid).toBe(true);
  });

  it('accepts node without affordances property', () => {
    const scaffold = {
      schemaVersion: '1.0.0',
      screen: {
        id: 'test',
        root: {
          id: 'box2',
          type: 'Box',
          child: {
            id: 'text2',
            type: 'Text',
            text: 'World'
          }
        }
      },
      settings: baseSettings()
    };

    const result = ingest(scaffold);
    expect(result.valid).toBe(true);
  });

  it('rejects affordances with non-string entries', () => {
    const scaffold = {
      schemaVersion: '1.0.0',
      screen: {
        id: 'test',
        root: {
          id: 'box3',
          type: 'Box',
          affordances: ['chevron', 123, 'details'],
          child: {
            id: 'text3',
            type: 'Text',
            text: 'Invalid'
          }
        }
      },
      settings: baseSettings()
    };

    const result = ingest(scaffold);
    expect(result.valid).toBe(false);
    const errors = result.issues.filter(i => i.severity === 'error');
    expect(errors.length).toBeGreaterThan(0);
    // The error should be about incorrect type in the array
  });

  it('rejects affordances with object entries', () => {
    const scaffold = {
      schemaVersion: '1.0.0',
      screen: {
        id: 'test',
        root: {
          id: 'grid1',
          type: 'Grid',
          columns: 2,
          affordances: ['chevron', { type: 'details' }],
          children: [
            { id: 't4', type: 'Text', text: 'A' }
          ]
        }
      },
      settings: baseSettings()
    };

    const result = ingest(scaffold);
    expect(result.valid).toBe(false);
    const errors = result.issues.filter(i => i.severity === 'error');
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects affordances as non-array value', () => {
    const scaffold = {
      schemaVersion: '1.0.0',
      screen: {
        id: 'test',
        root: {
          id: 'box4',
          type: 'Box',
          affordances: 'chevron',
          child: {
            id: 'text5',
            type: 'Text',
            text: 'Bad type'
          }
        }
      },
      settings: baseSettings()
    };

    const result = ingest(scaffold);
    expect(result.valid).toBe(false);
    const errors = result.issues.filter(i => i.severity === 'error');
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.message.includes('affordances') || e.message.includes('array'))).toBe(true);
  });

  it('accepts affordances on all node types', () => {
    const scaffold = {
      schemaVersion: '1.0.0',
      screen: {
        id: 'test',
        root: {
          id: 'stack1',
          type: 'Stack',
          direction: 'vertical',
          affordances: ['section'],
          children: [
            {
              id: 'text1',
              type: 'Text',
              text: 'Title',
              affordances: ['heading']
            },
            {
              id: 'btn1',
              type: 'Button',
              text: 'Toggle',
              affordances: ['chevron']
            },
            {
              id: 'field1',
              type: 'Field',
              label: 'Name',
              affordances: ['required-indicator']
            }
          ]
        }
      },
      settings: baseSettings()
    };

    const result = ingest(scaffold);
    expect(result.valid).toBe(true);
    expect(result.issues.find(i => i.severity === 'error')).toBeUndefined();
  });

  it('preserves affordances in normalized output', () => {
    const scaffold = {
      schemaVersion: '1.0.0',
      screen: {
        id: 'test',
        root: {
          id: 'box1',
          type: 'Box',
          affordances: ['chevron', 'collapsible'],
          child: {
            id: 'text1',
            type: 'Text',
            text: 'Content'
          }
        }
      },
      settings: baseSettings()
    };

    const result = ingest(scaffold);
    expect(result.valid).toBe(true);
    expect(result.normalized.screen.root.affordances).toEqual(['chevron', 'collapsible']);
  });
});
