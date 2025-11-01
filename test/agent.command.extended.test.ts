import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import { performance } from 'perf_hooks';

// Extended tests for LUMA-89

function run(cmd: string) {
  return execSync(cmd, { encoding: 'utf-8' });
}

describe('agent command extended suite', () => {
  it('produces stable snapshot for all sections (ignoring volatile fields)', () => {
    const first = JSON.parse(run('node dist/index.js agent --all --json'));
    const second = JSON.parse(run('node dist/index.js agent --all --json'));
    // Remove volatile fields
    delete first.generatedAt; delete second.generatedAt;
    delete first.sections?.meta?.meta?.processPid; delete second.sections?.meta?.meta?.processPid;
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect(first).toHaveProperty('sections.quick');
    expect(first).toHaveProperty('sections.workflow');
  });

  it('de-dupes duplicate sections in --sections flag', () => {
    const json = run('node dist/index.js agent --sections quick,quick,workflow --json');
    const parsed = JSON.parse(json);
    // Should only include quick & workflow once
    expect(Object.keys(parsed.sections)).toContain('quick');
    expect(Object.keys(parsed.sections)).toContain('workflow');
    expect(Object.keys(parsed.sections).filter(k => k === 'quick').length).toBe(1);
  });

  it('errors on conflicting flags --all plus --sections', () => {
    try {
      run('node dist/index.js agent --all --sections quick --json');
      expect.fail('Should have errored');
    } catch (err: any) {
      expect(err.status).toBe(2);
      expect(err.stderr).toContain('CONFLICTING_FLAGS');
    }
  });

  it('errors on unknown section', () => {
    try {
      run('node dist/index.js agent --sections unknownstuff --json');
      expect.fail('Should have errored');
    } catch (err: any) {
      expect(err.status).toBe(2);
      expect(err.stderr).toContain('UNKNOWN_SECTION');
    }
  });

  it('errors on unknown dot path', () => {
    try {
      run('node dist/index.js agent --sections quick --get quick.nonexistent --json');
      expect.fail('Should have errored');
    } catch (err: any) {
      expect(err.status).toBe(2);
      expect(err.stderr).toContain('UNKNOWN_PATH');
    }
  });

  it('returns raw subtree for --get quick', () => {
    const json = run('node dist/index.js agent --get quick --json');
    const parsed = JSON.parse(json);
    expect(parsed).toHaveProperty('usage');
    expect(parsed).not.toHaveProperty('sections');
  });

  it('performance: full generation under 400ms wall clock', () => {
    const start = performance.now();
    run('node dist/index.js agent --all --json');
    const end = performance.now();
    const duration = end - start;
    expect(duration).toBeLessThan(400); // relaxed threshold for CI variability
  });
});
