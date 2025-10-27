import { describe, it, expect } from 'vitest';
import { TableSimple } from '../../../src/core/patterns/table-simple.js';
import { validatePattern } from '../../../src/core/patterns/validator.js';
import type { Node } from '../../../src/types/node.js';

describe('Table.Simple pattern', () => {
  it('should pass all MUST rules for valid table', () => {
    const root: Node = {
      id: 'table',
      type: 'Table',
      title: 'User List',
      responsive: { strategy: 'wrap' },
      columns: ['Name', 'Email'],
      rows: 10,
    };

    const result = validatePattern(TableSimple, root);
    
    expect(result.mustFailed).toBe(0);
    expect(result.mustPassed).toBe(3);
  });

  it('should fail title-exists when title is empty', () => {
    const root: Node = {
      id: 'table',
      type: 'Table',
      title: '',
      responsive: { strategy: 'scroll' },
      columns: ['Name'],
    };

    const result = validatePattern(TableSimple, root);
    
    expect(result.mustFailed).toBeGreaterThan(0);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        id: 'title-exists',
        severity: 'error',
      })
    );
  });

  it('should fail responsive-strategy when strategy is invalid', () => {
    const root: Node = {
      id: 'table',
      type: 'Table',
      title: 'Data',
      responsive: { strategy: 'invalid' as any },
      columns: ['Col1'],
    };

    const result = validatePattern(TableSimple, root);
    
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        id: 'responsive-strategy',
        severity: 'error',
      })
    );
  });

  it('should accept wrap strategy', () => {
    const root: Node = {
      id: 'table',
      type: 'Table',
      title: 'Data',
      responsive: { strategy: 'wrap' },
      columns: ['Col1'],
    };

    const result = validatePattern(TableSimple, root);
    
    expect(result.issues.find(i => i.id === 'responsive-strategy')).toBeUndefined();
  });

  it('should accept scroll strategy', () => {
    const root: Node = {
      id: 'table',
      type: 'Table',
      title: 'Data',
      responsive: { strategy: 'scroll' },
      columns: ['Col1'],
    };

    const result = validatePattern(TableSimple, root);
    
    expect(result.issues.find(i => i.id === 'responsive-strategy')).toBeUndefined();
  });

  it('should accept cards strategy', () => {
    const root: Node = {
      id: 'table',
      type: 'Table',
      title: 'Data',
      responsive: { strategy: 'cards' },
      columns: ['Col1'],
    };

    const result = validatePattern(TableSimple, root);
    
    expect(result.issues.find(i => i.id === 'responsive-strategy')).toBeUndefined();
  });

  it('should fail min-width-fit-or-scroll when no responsive strategy set', () => {
    const root: Node = {
      id: 'table',
      type: 'Table',
      title: 'Data',
      responsive: { strategy: undefined as any },
      columns: ['Col1'],
    };

    const result = validatePattern(TableSimple, root);
    
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        id: 'min-width-fit-or-scroll',
        severity: 'error',
      })
    );
  });

  it('should pass min-width-fit-or-scroll when strategy is scroll', () => {
    const root: Node = {
      id: 'table',
      type: 'Table',
      title: 'Wide Table',
      responsive: { strategy: 'scroll' },
      columns: ['A', 'B', 'C', 'D', 'E'],
    };

    const result = validatePattern(TableSimple, root);
    
    expect(result.issues.find(i => i.id === 'min-width-fit-or-scroll')).toBeUndefined();
  });

  it('should pass min-width-fit-or-scroll when strategy is cards', () => {
    const root: Node = {
      id: 'table',
      type: 'Table',
      title: 'Mobile Table',
      responsive: { strategy: 'cards' },
      columns: ['A', 'B', 'C'],
    };

    const result = validatePattern(TableSimple, root);
    
    expect(result.issues.find(i => i.id === 'min-width-fit-or-scroll')).toBeUndefined();
  });

  it('should include source attribution in issues', () => {
    const root: Node = {
      id: 'table',
      type: 'Table',
      title: '',
      responsive: { strategy: 'wrap' },
      columns: ['Col1'],
    };

    const result = validatePattern(TableSimple, root);
    const issue = result.issues.find(i => i.id === 'title-exists');
    
    expect(issue?.source).toEqual({
      pattern: 'Table.Simple',
      name: 'IBM Carbon Design System',
      url: expect.stringContaining('carbondesignsystem.com'),
    });
  });
});
