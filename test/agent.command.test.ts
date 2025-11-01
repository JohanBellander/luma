import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';

// NOTE: These are skeleton tests; richer tests will arrive in later issues.

describe('agent command (skeleton)', () => {
  it('lists sections', () => {
    const output = execSync('node dist/index.js agent --list-sections', { encoding: 'utf-8' });
    expect(output).toContain('Available agent sections:');
    expect(output).toContain('quick');
  });

  it('returns JSON envelope for --sections quick --json', () => {
    const json = execSync('node dist/index.js agent --sections quick --json', { encoding: 'utf-8' });
    const parsed = JSON.parse(json);
    expect(parsed).toHaveProperty('version');
    expect(parsed).toHaveProperty('generatedAt');
    expect(parsed.sections).toHaveProperty('quick');
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

  it('supports --get dot path', () => {
    const value = execSync('node dist/index.js agent --sections quick --get sections.quick --json', { encoding: 'utf-8' });
    const parsed = JSON.parse(value);
    // Placeholder is empty object
    expect(parsed).toMatchObject({});
  });
});
