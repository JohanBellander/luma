import { describe, it, expect } from 'vitest';
import { getPattern, listPatternNames } from '../../../src/core/patterns/pattern-registry.js';

/**
 * Tests for pattern alias resolution (LUMA-78).
 */

describe('pattern alias resolution', () => {
  it('resolves canonical names', () => {
    expect(getPattern('Form.Basic')?.name).toBe('Form.Basic');
    expect(getPattern('Table.Simple')?.name).toBe('Table.Simple');
    expect(getPattern('Progressive.Disclosure')?.name).toBe('Progressive.Disclosure');
    expect(getPattern('Guided.Flow')?.name).toBe('Guided.Flow');
  });

  it('resolves short aliases', () => {
    expect(getPattern('form')?.name).toBe('Form.Basic');
    expect(getPattern('table')?.name).toBe('Table.Simple');
    expect(getPattern('pd')?.name).toBe('Progressive.Disclosure');
    expect(getPattern('wizard')?.name).toBe('Guided.Flow');
  });

  it('resolves kebab-case aliases', () => {
    expect(getPattern('form-basic')?.name).toBe('Form.Basic');
    expect(getPattern('table-simple')?.name).toBe('Table.Simple');
    expect(getPattern('progressive-disclosure')?.name).toBe('Progressive.Disclosure');
    expect(getPattern('guided-flow')?.name).toBe('Guided.Flow');
    expect(getPattern('flow-wizard')?.name).toBe('Guided.Flow');
  });

  it('is case-insensitive', () => {
    expect(getPattern('FORM')?.name).toBe('Form.Basic');
    expect(getPattern('TABLE')?.name).toBe('Table.Simple');
    expect(getPattern('PROGRESSIVE-DISCLOSURE')?.name).toBe('Progressive.Disclosure');
    expect(getPattern('GUIDED-FLOW')?.name).toBe('Guided.Flow');
  });

  it('returns undefined for unknown names', () => {
    expect(getPattern('unknown-pattern')).toBeUndefined();
    // 'form.basic' should resolve via case-insensitive canonical match
    expect(getPattern('form.basic')?.name).toBe('Form.Basic');
  });

  it('lists all names including aliases', () => {
    const names = listPatternNames();
    // Canonical names
    expect(names).toContain('Form.Basic');
    expect(names).toContain('Table.Simple');
    expect(names).toContain('Progressive.Disclosure');
    expect(names).toContain('Guided.Flow');
    // Aliases
    expect(names).toContain('form');
    expect(names).toContain('form-basic');
    expect(names).toContain('table');
    expect(names).toContain('table-simple');
    expect(names).toContain('pd');
    expect(names).toContain('progressive-disclosure');
    expect(names).toContain('wizard');
    expect(names).toContain('guided-flow');
    expect(names).toContain('flow-wizard');
  });
});
