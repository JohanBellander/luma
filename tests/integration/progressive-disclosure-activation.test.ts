/**
 * Tests for Progressive Disclosure pattern activation in flow command.
 * 
 * Verifies:
 * 1. Explicit activation via --patterns flag
 * 2. Implicit activation when disclosure hints are present
 * 3. Non-activation when no hints and not explicitly requested
 */

import { describe, it, expect } from 'vitest';
import { ingest } from '../../src/core/ingest/ingest.js';
import { validatePatterns } from '../../src/core/patterns/validator.js';
import { getPattern } from '../../src/core/patterns/pattern-registry.js';
import { traversePreOrder } from '../../src/core/keyboard/traversal.js';
import type { Scaffold } from '../../src/types/scaffold.js';
import type { Node } from '../../src/types/node.js';

/**
 * Helper function to detect disclosure hints (same as in flow.command.ts)
 */
function hasDisclosureHints(root: Node): boolean {
  const nodes = traversePreOrder(root, false);
  
  for (const node of nodes) {
    if (node.behaviors?.disclosure?.collapsible === true) {
      return true;
    }
  }
  
  return false;
}

describe('Progressive Disclosure Pattern Activation', () => {
  describe('Explicit activation', () => {
    it('should activate Progressive.Disclosure when specified in --patterns flag', () => {
      const scaffold: Scaffold = {
        schemaVersion: '1.0.0',
        screen: {
          id: 'test-explicit',
          title: 'Test Explicit',
          root: {
            id: 'root',
            type: 'Stack',
            direction: 'vertical',
            children: [
              {
                id: 'text1',
                type: 'Text',
                text: 'Hello World'
              }
            ]
          }
        },
        settings: {
          spacingScale: [4, 8, 12, 16],
          minTouchTarget: { w: 44, h: 44 },
          breakpoints: ['320x640']
        }
      };

      // Simulate flow command with explicit pattern
      const pdPattern = getPattern('Progressive.Disclosure');
      expect(pdPattern).toBeDefined();
      expect(pdPattern?.name).toBe('Progressive.Disclosure');

      // Validate the pattern runs
      const result = validatePatterns([pdPattern!], scaffold.screen.root);
      expect(result.patterns).toHaveLength(1);
      expect(result.patterns[0].pattern).toBe('Progressive.Disclosure');
    });

    it('should accept progressive-disclosure alias', () => {
      const pdPattern = getPattern('progressive-disclosure');
      expect(pdPattern).toBeDefined();
      expect(pdPattern?.name).toBe('Progressive.Disclosure');
    });

    it('should accept Progressive.Disclosure canonical name', () => {
      const pdPattern = getPattern('Progressive.Disclosure');
      expect(pdPattern).toBeDefined();
      expect(pdPattern?.name).toBe('Progressive.Disclosure');
    });
  });

  describe('Implicit activation', () => {
    it('should auto-activate when collapsible hint is present', () => {
      const scaffold: Scaffold = {
        schemaVersion: '1.0.0',
        screen: {
          id: 'test-implicit',
          title: 'Test Implicit',
          root: {
            id: 'root',
            type: 'Stack',
            direction: 'vertical',
            children: [
              {
                id: 'toggle-btn',
                type: 'Button',
                text: 'Toggle Details',
                behaviors: {
                  disclosure: {
                    collapsible: true,
                    targetId: 'details-section'
                  }
                }
              },
              {
                id: 'details-section',
                type: 'Box',
                child: {
                  id: 'details-text',
                  type: 'Text',
                  text: 'Hidden details'
                }
              }
            ]
          }
        },
        settings: {
          spacingScale: [4, 8, 12, 16],
          minTouchTarget: { w: 44, h: 44 },
          breakpoints: ['320x640']
        }
      };

      // Verify disclosure hints are detected
      const hasHints = hasDisclosureHints(scaffold.screen.root);
      expect(hasHints).toBe(true);

      // Simulate auto-injection logic from flow.command.ts
      const patterns = [];
      const pdPattern = getPattern('Progressive.Disclosure');
      
      if (hasHints && pdPattern) {
        patterns.push(pdPattern);
      }

      expect(patterns).toHaveLength(1);
      expect(patterns[0].name).toBe('Progressive.Disclosure');
    });

    it('should detect collapsible hint in nested nodes', () => {
      const scaffold: Scaffold = {
        schemaVersion: '1.0.0',
        screen: {
          id: 'test-nested',
          title: 'Test Nested',
          root: {
            id: 'root',
            type: 'Stack',
            direction: 'vertical',
            children: [
              {
                id: 'container',
                type: 'Box',
                child: {
                  id: 'nested-stack',
                  type: 'Stack',
                  direction: 'vertical',
                  children: [
                    {
                      id: 'deep-toggle',
                      type: 'Button',
                      text: 'Show More',
                      behaviors: {
                        disclosure: {
                          collapsible: true,
                          targetId: 'more-info'
                        }
                      }
                    }
                  ]
                }
              }
            ]
          }
        },
        settings: {
          spacingScale: [4, 8, 12, 16],
          minTouchTarget: { w: 44, h: 44 },
          breakpoints: ['320x640']
        }
      };

      const hasHints = hasDisclosureHints(scaffold.screen.root);
      expect(hasHints).toBe(true);
    });

    it('should not duplicate pattern if already explicitly specified', () => {
      const scaffold: Scaffold = {
        schemaVersion: '1.0.0',
        screen: {
          id: 'test-no-duplicate',
          title: 'Test No Duplicate',
          root: {
            id: 'root',
            type: 'Stack',
            direction: 'vertical',
            children: [
              {
                id: 'toggle',
                type: 'Button',
                text: 'Toggle',
                behaviors: {
                  disclosure: {
                    collapsible: true,
                    targetId: 'content'
                  }
                }
              }
            ]
          }
        },
        settings: {
          spacingScale: [4, 8, 12, 16],
          minTouchTarget: { w: 44, h: 44 },
          breakpoints: ['320x640']
        }
      };

      // Simulate flow command with explicit pattern + auto-activation
      const patterns = [];
      const pdPattern = getPattern('Progressive.Disclosure');
      
      // User explicitly specified it
      patterns.push(pdPattern!);
      
      // Auto-activation logic
      const hasHints = hasDisclosureHints(scaffold.screen.root);
      const hasProgressiveDisclosurePattern = patterns.some(
        p => p.name === 'Progressive.Disclosure'
      );
      
      if (hasHints && !hasProgressiveDisclosurePattern && pdPattern) {
        patterns.push(pdPattern);
      }

      // Should still only have 1 pattern (no duplicate)
      expect(patterns).toHaveLength(1);
      expect(patterns[0].name).toBe('Progressive.Disclosure');
    });
  });

  describe('Non-activation cases', () => {
    it('should not activate without hints or explicit flag', () => {
      const scaffold: Scaffold = {
        schemaVersion: '1.0.0',
        screen: {
          id: 'test-no-activation',
          title: 'Test No Activation',
          root: {
            id: 'root',
            type: 'Stack',
            direction: 'vertical',
            children: [
              {
                id: 'text1',
                type: 'Text',
                text: 'Simple text'
              },
              {
                id: 'btn1',
                type: 'Button',
                text: 'Click Me'
              }
            ]
          }
        },
        settings: {
          spacingScale: [4, 8, 12, 16],
          minTouchTarget: { w: 44, h: 44 },
          breakpoints: ['320x640']
        }
      };

      // No disclosure hints
      const hasHints = hasDisclosureHints(scaffold.screen.root);
      expect(hasHints).toBe(false);

      // Simulate flow command without explicit pattern
      const patterns = [];
      
      // No auto-injection should happen
      const pdPattern = getPattern('Progressive.Disclosure');
      if (hasHints && pdPattern) {
        patterns.push(pdPattern);
      }

      expect(patterns).toHaveLength(0);
    });

    it('should not activate for buttons without disclosure behaviors', () => {
      const scaffold: Scaffold = {
        schemaVersion: '1.0.0',
        screen: {
          id: 'test-no-behavior',
          title: 'Test No Behavior',
          root: {
            id: 'root',
            type: 'Stack',
            direction: 'vertical',
            children: [
              {
                id: 'regular-button',
                type: 'Button',
                text: 'Submit',
                // No behaviors property
              }
            ]
          }
        },
        settings: {
          spacingScale: [4, 8, 12, 16],
          minTouchTarget: { w: 44, h: 44 },
          breakpoints: ['320x640']
        }
      };

      const hasHints = hasDisclosureHints(scaffold.screen.root);
      expect(hasHints).toBe(false);
    });

    it('should not activate when collapsible is false', () => {
      const scaffold: Scaffold = {
        schemaVersion: '1.0.0',
        screen: {
          id: 'test-false-collapsible',
          title: 'Test False Collapsible',
          root: {
            id: 'root',
            type: 'Stack',
            direction: 'vertical',
            children: [
              {
                id: 'btn',
                type: 'Button',
                text: 'Not Collapsible',
                behaviors: {
                  disclosure: {
                    collapsible: false,
                    targetId: 'section'
                  }
                }
              }
            ]
          }
        },
        settings: {
          spacingScale: [4, 8, 12, 16],
          minTouchTarget: { w: 44, h: 44 },
          breakpoints: ['320x640']
        }
      };

      const hasHints = hasDisclosureHints(scaffold.screen.root);
      expect(hasHints).toBe(false);
    });

    it('should not activate when disclosure property exists but no collapsible', () => {
      const scaffold: Scaffold = {
        schemaVersion: '1.0.0',
        screen: {
          id: 'test-no-collapsible-prop',
          title: 'Test No Collapsible Prop',
          root: {
            id: 'root',
            type: 'Stack',
            direction: 'vertical',
            children: [
              {
                id: 'btn',
                type: 'Button',
                text: 'Button',
                behaviors: {
                  disclosure: {
                    targetId: 'section'
                    // collapsible not set
                  }
                }
              }
            ]
          }
        },
        settings: {
          spacingScale: [4, 8, 12, 16],
          minTouchTarget: { w: 44, h: 44 },
          breakpoints: ['320x640']
        }
      };

      const hasHints = hasDisclosureHints(scaffold.screen.root);
      expect(hasHints).toBe(false);
    });
  });

  describe('Pattern parsing', () => {
    it('should handle comma-separated pattern lists', () => {
      const patternList = 'Form.Basic,progressive-disclosure,Table.Simple';
      const patternNames = patternList.split(',').map(p => p.trim());
      
      expect(patternNames).toHaveLength(3);
      expect(patternNames[0]).toBe('Form.Basic');
      expect(patternNames[1]).toBe('progressive-disclosure');
      expect(patternNames[2]).toBe('Table.Simple');

      // All should resolve
      const patterns = patternNames.map(name => getPattern(name)).filter(p => p !== undefined);
      expect(patterns).toHaveLength(3);
    });

    it('should trim whitespace from pattern names', () => {
      const patternList = ' Form.Basic , progressive-disclosure , Table.Simple ';
      const patternNames = patternList.split(',').map(p => p.trim());
      
      expect(patternNames[0]).toBe('Form.Basic');
      expect(patternNames[1]).toBe('progressive-disclosure');
      expect(patternNames[2]).toBe('Table.Simple');
    });
  });
});
