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
      expect(stderr).toContain('INVALID_SECTION');
    }
  });

  it('supports --get dot path into rules.patterns', () => {
    const value = execSync('node dist/index.js agent --sections rules --get sections.rules.patterns --json', { encoding: 'utf-8' });
    const parsed = JSON.parse(value);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0]).toHaveProperty('name');
  });
});
