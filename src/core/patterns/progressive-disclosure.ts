/**
 * Progressive.Disclosure pattern
 * 
 * Per LUMA-PATTERN-Progressive-Disclosure-SPEC.md:
 * Source: Nielsen Norman Group — Progressive Disclosure
 * 
 * MUST rules:
 * 1. disclosure-no-control: Collapsible container has an associated control
 * 2. disclosure-hides-primary: Primary action is not hidden by default
 * 3. disclosure-missing-label: Label/summary present for collapsible
 * 
 * SHOULD rules:
 * 1. disclosure-control-far: Control placement proximity
 * 2. disclosure-inconsistent-affordance: Consistent affordance
 * 3. disclosure-early-section: Collapsible sections follow primary content
 * 
 * NOTE: This is a stub implementation for registry registration.
 * Full implementation will be completed in LUMA-50.
 */

import type { Pattern, PatternRule } from './types.js';
import type { Node } from '../../types/node.js';
import type { Issue } from '../../types/issue.js';

/**
 * Stub MUST rule: Collapsible container has an associated control
 * Full implementation in LUMA-50
 */
const disclosureNoControl: PatternRule = {
  id: 'disclosure-no-control',
  level: 'must',
  description: 'Collapsible container has an associated control',
  check: (_root: Node): Issue[] => {
    // Stub implementation - will be completed in LUMA-50
    return [];
  },
};

/**
 * Stub MUST rule: Primary action is not hidden by default
 * Full implementation in LUMA-50
 */
const disclosureHidesPrimary: PatternRule = {
  id: 'disclosure-hides-primary',
  level: 'must',
  description: 'Primary action is not hidden by default',
  check: (_root: Node): Issue[] => {
    // Stub implementation - will be completed in LUMA-50
    return [];
  },
};

/**
 * Stub MUST rule: Label/summary present for collapsible
 * Full implementation in LUMA-50
 */
const disclosureMissingLabel: PatternRule = {
  id: 'disclosure-missing-label',
  level: 'must',
  description: 'Label/summary present for collapsible',
  check: (_root: Node): Issue[] => {
    // Stub implementation - will be completed in LUMA-50
    return [];
  },
};

/**
 * Stub SHOULD rule: Control placement proximity
 * Full implementation in LUMA-51
 */
const disclosureControlFar: PatternRule = {
  id: 'disclosure-control-far',
  level: 'should',
  description: 'Control should be adjacent to collapsible section',
  check: (_root: Node): Issue[] => {
    // Stub implementation - will be completed in LUMA-51
    return [];
  },
};

/**
 * Stub SHOULD rule: Consistent affordance
 * Full implementation in LUMA-51
 */
const disclosureInconsistentAffordance: PatternRule = {
  id: 'disclosure-inconsistent-affordance',
  level: 'should',
  description: 'Multiple collapsibles should use consistent affordances',
  check: (_root: Node): Issue[] => {
    // Stub implementation - will be completed in LUMA-51
    return [];
  },
};

/**
 * Stub SHOULD rule: Collapsible sections follow primary content
 * Full implementation in LUMA-51
 */
const disclosureEarlySection: PatternRule = {
  id: 'disclosure-early-section',
  level: 'should',
  description: 'Collapsible content should follow primary content',
  check: (_root: Node): Issue[] => {
    // Stub implementation - will be completed in LUMA-51
    return [];
  },
};

/**
 * Progressive Disclosure pattern definition
 */
export const ProgressiveDisclosure: Pattern = {
  name: 'Progressive.Disclosure',
  source: {
    pattern: 'Progressive.Disclosure',
    name: 'Nielsen Norman Group',
    url: 'https://www.nngroup.com/articles/progressive-disclosure/',
  },
  must: [
    disclosureNoControl,
    disclosureHidesPrimary,
    disclosureMissingLabel,
  ],
  should: [
    disclosureControlFar,
    disclosureInconsistentAffordance,
    disclosureEarlySection,
  ],
};
