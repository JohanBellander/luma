/**
 * Tests for Progressive Disclosure suggestion generator
 * 
 * Verifies that each PD issue includes a suggestion field identical to spec examples.
 * Based on LUMA-PATTERN-Progressive-Disclosure-SPEC.md §5
 */

import { describe, it, expect } from 'vitest';
import { getSuggestion, PROGRESSIVE_DISCLOSURE_SUGGESTIONS } from '../../../src/core/patterns/suggestions.js';

describe('Progressive Disclosure Suggestions', () => {
  describe('getSuggestion', () => {
    it('should return suggestion for disclosure-no-control', () => {
      const suggestion = getSuggestion('disclosure-no-control', 'advanced');
      expect(suggestion).toBeDefined();
      expect(suggestion).toContain('Add a control Button near the section');
      expect(suggestion).toContain('toggle-advanced');
      expect(suggestion).toContain('"collapsible": true');
      expect(suggestion).toContain('"controlsId": "toggle-advanced"');
      expect(suggestion).toContain('"type": "Button"');
      expect(suggestion).toContain('"text": "Show details"');
    });

    it('should return suggestion for disclosure-hides-primary', () => {
      const suggestion = getSuggestion('disclosure-hides-primary');
      expect(suggestion).toBeDefined();
      expect(suggestion).toContain('Move the primary action outside the collapsible section');
      expect(suggestion).toContain('"defaultState": "expanded"');
    });

    it('should return suggestion for disclosure-missing-label', () => {
      const suggestion = getSuggestion('disclosure-missing-label', 'section');
      expect(suggestion).toBeDefined();
      expect(suggestion).toContain('Add a sibling Text label before the section');
      expect(suggestion).toContain('"type":"Text"');
      expect(suggestion).toContain('"id":"section-label"');
      expect(suggestion).toContain('"text":"Section title"');
    });

    it('should return suggestion for disclosure-control-far', () => {
      const suggestion = getSuggestion('disclosure-control-far');
      expect(suggestion).toBeDefined();
      expect(suggestion).toContain('Place the control as a preceding sibling');
      expect(suggestion).toContain('within a header row');
    });

    it('should return suggestion for disclosure-inconsistent-affordance', () => {
      const suggestion = getSuggestion('disclosure-inconsistent-affordance');
      expect(suggestion).toBeDefined();
      expect(suggestion).toContain('Align affordances across collapsible sections');
      expect(suggestion).toContain('"affordances":["chevron"]');
    });

    it('should return suggestion for disclosure-early-section', () => {
      const suggestion = getSuggestion('disclosure-early-section');
      expect(suggestion).toBeDefined();
      expect(suggestion).toContain('Move collapsible sections after required fields');
      expect(suggestion).toContain('before the action row');
    });

    it('should return undefined for unknown issue ID', () => {
      const suggestion = getSuggestion('unknown-issue-id');
      expect(suggestion).toBeUndefined();
    });
  });

  describe('PROGRESSIVE_DISCLOSURE_SUGGESTIONS map', () => {
    it('should have all 6 Progressive Disclosure issue IDs', () => {
      const expectedIds = [
        'disclosure-no-control',
        'disclosure-hides-primary',
        'disclosure-missing-label',
        'disclosure-control-far',
        'disclosure-inconsistent-affordance',
        'disclosure-early-section',
      ];

      for (const id of expectedIds) {
        expect(PROGRESSIVE_DISCLOSURE_SUGGESTIONS[id]).toBeDefined();
        expect(typeof PROGRESSIVE_DISCLOSURE_SUGGESTIONS[id]).toBe('function');
      }
    });

    it('should generate deterministic suggestions with node context', () => {
      // Test that node ID is properly used in suggestions
      const suggestion1 = getSuggestion('disclosure-no-control', 'settings');
      const suggestion2 = getSuggestion('disclosure-no-control', 'preferences');

      expect(suggestion1).toContain('toggle-settings');
      expect(suggestion2).toContain('toggle-preferences');
      expect(suggestion1).not.toEqual(suggestion2);
    });

    it('should generate consistent suggestions without node context', () => {
      // Test that suggestions without node context are deterministic
      const suggestion1 = getSuggestion('disclosure-hides-primary');
      const suggestion2 = getSuggestion('disclosure-hides-primary');

      expect(suggestion1).toEqual(suggestion2);
    });

    it('should use default node ID when not provided', () => {
      const suggestion = getSuggestion('disclosure-no-control');
      expect(suggestion).toBeDefined();
      expect(suggestion).toContain('toggle-advanced'); // Default ID
    });
  });

  describe('Spec compliance', () => {
    it('disclosure-no-control suggestion should match spec §5', () => {
      const suggestion = getSuggestion('disclosure-no-control', 'advanced');
      
      // Verify it matches the spec example structure
      expect(suggestion).toContain('"behaviors": { "disclosure": { "collapsible": true, "controlsId": "toggle-advanced", "defaultState": "collapsed" } }');
      expect(suggestion).toContain('{ "id": "toggle-advanced", "type": "Button", "text": "Show details" }');
    });

    it('disclosure-hides-primary suggestion should match spec §5', () => {
      const suggestion = getSuggestion('disclosure-hides-primary');
      
      // Verify key phrases from spec
      expect(suggestion).toContain('Move the primary action outside the collapsible section');
      expect(suggestion).toContain('OR set:');
      expect(suggestion).toContain('"behaviors": { "disclosure": { "defaultState": "expanded" } }');
    });

    it('disclosure-missing-label suggestion should match spec §5', () => {
      const suggestion = getSuggestion('disclosure-missing-label', 'advanced');
      
      // Verify it matches the spec example structure
      expect(suggestion).toContain('Add a sibling Text label before the section:');
      expect(suggestion).toContain('{ "type":"Text", "id":"advanced-label", "text":"Section title" }');
    });

    it('disclosure-control-far suggestion should match spec §5', () => {
      const suggestion = getSuggestion('disclosure-control-far');
      expect(suggestion).toBe('Place the control as a preceding sibling or within a header row next to the section.');
    });

    it('disclosure-inconsistent-affordance suggestion should match spec §5', () => {
      const suggestion = getSuggestion('disclosure-inconsistent-affordance');
      expect(suggestion).toBe('Align affordances across collapsible sections, e.g. "affordances":["chevron"].');
    });

    it('disclosure-early-section suggestion should match spec §5', () => {
      const suggestion = getSuggestion('disclosure-early-section');
      expect(suggestion).toBe('Move collapsible sections after required fields and before the action row.');
    });
  });
});
