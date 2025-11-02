import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';

function run(cmd: string) {
  try {
    return execSync(cmd, { encoding: 'utf-8' });
  } catch (err: any) {
    if (err.stdout) return err.stdout.toString();
    throw err;
  }
}

describe('agent command --help-with (LUMA-135)', () => {
  it('returns JSON guidance for known error id', () => {
    const json = run('node dist/index.js agent --help-with field-has-label --json');
    const guidance = JSON.parse(json);
    expect(guidance.errorId).toBe('field-has-label');
    expect(Array.isArray(guidance.commonCauses)).toBe(true);
    expect(guidance.resolutionSteps.length).toBeGreaterThan(0);
  });

  it('errors with UNKNOWN_ERROR_ID for unknown id', () => {
    try {
      execSync('node dist/index.js agent --help-with not-a-real-error --json', { encoding: 'utf-8' });
      expect.fail('Should have errored');
    } catch (err: any) {
      expect(err.status).toBe(2); // EXIT_INVALID_INPUT
      expect(err.stderr).toContain('UNKNOWN_ERROR_ID');
    }
  });

  it('supports non-JSON pretty output', () => {
    const text = run('node dist/index.js agent --help-with actions-exist');
    expect(text).toContain('Guidance for actions-exist');
    expect(text).toContain('Resolution Steps');
  });
});
