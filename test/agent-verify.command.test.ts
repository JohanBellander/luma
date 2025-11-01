import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';

function run(cmd: string) {
  try {
    return { stdout: execSync(cmd, { encoding: 'utf-8' }), status: 0 };
  } catch (err: any) {
    return { stdout: err.stdout?.toString() || '', stderr: err.stderr?.toString() || '', status: err.status };
  }
}

describe('agent-verify command', () => {
  it('produces JSON output with checks summary', () => {
    const out = run('node dist/index.js agent-verify --json');
    // Non-zero status allowed if some checks fail locally
    const parsed = JSON.parse(out.stdout);
    expect(parsed).toHaveProperty('version');
    expect(parsed).toHaveProperty('checks');
    expect(Array.isArray(parsed.checks)).toBe(true);
    expect(parsed).toHaveProperty('summary');
    expect(parsed.summary.total).toBe(parsed.checks.length);
  });

  it('includes agents_md check id', () => {
    const out = run('node dist/index.js agent-verify --json');
    const parsed = JSON.parse(out.stdout);
    const ids = parsed.checks.map((c: any) => c.id);
    expect(ids).toContain('agents_md');
  });
});
