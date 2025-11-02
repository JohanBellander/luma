import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';

// NOTE: These are skeleton tests; richer tests will arrive in later issues.

describe('agent command (sections quick/workflow/rules)', () => {
  it('lists sections', () => {
    const output = execSync('node dist/index.js agent --list-sections', { encoding: 'utf-8' });
    expect(output).toContain('Available agent sections:');
    expect(output).toContain('quick');
  });

  it('returns JSON envelope for --sections quick,workflow,rules --json', () => {
    const json = execSync('node dist/index.js agent --sections quick,workflow,rules --json', { encoding: 'utf-8' });
    const parsed = JSON.parse(json);
    expect(parsed).toHaveProperty('version');
    expect(parsed).toHaveProperty('generatedAt');
    expect(parsed.sections).toHaveProperty('quick');
    expect(parsed.sections).toHaveProperty('workflow');
    expect(parsed.sections).toHaveProperty('rules');
    // Basic shape checks
    expect(parsed.sections.quick).toHaveProperty('usage');
    expect(Array.isArray(parsed.sections.quick.primaryCommands)).toBe(true);
    expect(Array.isArray(parsed.sections.workflow.stages)).toBe(true);
    // rules.patterns should be sorted by name
    const patternNames = parsed.sections.rules.patterns.map((p: any) => p.name);
    const sorted = [...patternNames].sort((a, b) => a.localeCompare(b));
    expect(patternNames).toEqual(sorted);
  });

  it('errors on invalid section', () => {
    try {
      execSync('node dist/index.js agent --sections nope --json', { encoding: 'utf-8', stdio: 'pipe' });
      expect.fail('should have thrown');
    } catch (err: any) {
      // Expect exit code 2 (INVALID_INPUT)
      expect(err.status).toBe(2);
      const stderr = err.stderr.toString();
  expect(stderr).toContain('UNKNOWN_SECTION');
    }
  });

  it('supports --get dot path into rules.patterns', () => {
    const value = execSync('node dist/index.js agent --sections rules --get sections.rules.patterns --json', { encoding: 'utf-8' });
    const parsed = JSON.parse(value);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0]).toHaveProperty('name');
  });
});

describe('agent command new sections (patterns, components, examples)', () => {
  it('returns compressed patterns summary with counts', () => {
    const json = execSync('node dist/index.js agent --sections patterns --json', { encoding: 'utf-8' });
    const parsed = JSON.parse(json);
    const list = parsed.sections.patterns.patterns;
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
    for (const p of list) {
      expect(p.counts.must).toBe(p.mustIds.length);
      expect(p.counts.should).toBe(p.shouldIds.length);
    }
  });

  it('returns component summaries with requiredProps and optionalProps', () => {
    const json = execSync('node dist/index.js agent --sections components --json', { encoding: 'utf-8' });
    const parsed = JSON.parse(json);
    const comps = parsed.sections.components.components;
    expect(comps.find((c: any) => c.name === 'Text')).toBeTruthy();
    const text = comps.find((c: any) => c.name === 'Text');
    expect(text.requiredProps).toContain('id');
    expect(Array.isArray(text.optionalProps)).toBe(true);
  });

  it('returns examples metadata without embedding JSON bodies', () => {
    const json = execSync('node dist/index.js agent --sections examples --json', { encoding: 'utf-8' });
    const parsed = JSON.parse(json);
    const examples = parsed.sections.examples.examples;
    expect(Array.isArray(examples)).toBe(true);
    const hf = examples.find((e: any) => e.id === 'happy-form');
    expect(hf).toBeTruthy();
    expect(hf).not.toHaveProperty('code');
    expect(hf.file).toMatch(/examples\/happy-form\.json$/);
  });

  it('supports multiple new sections simultaneously', () => {
    const json = execSync('node dist/index.js agent --sections patterns,components,examples --json', { encoding: 'utf-8' });
    const parsed = JSON.parse(json);
    expect(parsed.sections.patterns).toBeTruthy();
    expect(parsed.sections.components).toBeTruthy();
    expect(parsed.sections.examples).toBeTruthy();
  });
});
