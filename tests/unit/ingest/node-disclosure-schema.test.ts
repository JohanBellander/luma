import { describe, it, expect } from 'vitest';
import { ingest } from '../../../src/core/ingest/ingest.js';

function baseSettings() {
  return {
    spacingScale: [4, 8, 12, 16, 24],
    minTouchTarget: { w: 44, h: 44 },
    breakpoints: ['320x640'],
  };
}

describe('Disclosure behavior schema', () => {
  it('accepts valid behaviors.disclosure with collapsed defaultState', () => {
    const scaffold = {
      schemaVersion: '1.0.0',
      screen: {
        id: 'test',
        root: {
          id: 'box1',
            type: 'Box',
            behaviors: {
              disclosure: {
                collapsible: true,
                defaultState: 'collapsed',
                controlsId: 'toggle-btn',
                ariaSummaryText: 'Advanced options'
              }
            },
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

  it('accepts valid behaviors.disclosure with expanded defaultState', () => {
    const scaffold = {
      schemaVersion: '1.0.0',
      screen: {
        id: 'test',
        root: {
          id: 'stack1',
          type: 'Stack',
          direction: 'vertical',
          behaviors: {
            disclosure: {
              collapsible: true,
              defaultState: 'expanded'
            }
          },
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

  it('rejects invalid defaultState enum value', () => {
    const scaffold = {
      schemaVersion: '1.0.0',
      screen: {
        id: 'test',
        root: {
          id: 'box2',
          type: 'Box',
          behaviors: {
            disclosure: {
              collapsible: true,
              // @ts-expect-error intentionally wrong
              defaultState: 'partially',
            }
          },
          child: { id: 't2', type: 'Text', text: 'Hi' }
        }
      },
      settings: baseSettings()
    };

    const result = ingest(scaffold);
    expect(result.valid).toBe(false);
    const enumIssue = result.issues.find(i => i.expected && typeof i.expected === 'string' && i.expected.includes('collapsed'));
    expect(enumIssue).toBeDefined();
  });
});
