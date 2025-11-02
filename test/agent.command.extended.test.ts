import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import { performance } from 'perf_hooks';
import { buildEnvelope, AGENT_SECTION_NAMES } from '../src/cli/agent.command';

// Extended tests for LUMA-89

function run(cmd: string) {
  return execSync(cmd, { encoding: 'utf-8' });
}

describe('agent command extended suite', () => {
  it('produces stable snapshot for all sections (ignoring volatile fields)', () => {
    const first = JSON.parse(run('node dist/index.js agent --all --json'));
    const second = JSON.parse(run('node dist/index.js agent --all --json'));
    // Strip volatile timestamps & PIDs & legacy duplicates
    delete first.generatedAt; delete second.generatedAt;
    delete first.schema.generated; delete second.schema.generated;
    delete first.sections?.meta?.meta?.processPid; delete second.sections?.meta?.meta?.processPid;
    delete first.meta?.meta?.processPid; delete second.meta?.meta?.processPid;
    // Compare deterministic JSON
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect(first).toHaveProperty('sections.quick');
    expect(first).toHaveProperty('quick'); // top-level exposure
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

  it('performance: buildEnvelope direct invocation under 25ms (after warm-up)', () => {
    const version = '0.0.0-test';
    // Warm-up JIT / module cache
    buildEnvelope(version, AGENT_SECTION_NAMES);
    const start = performance.now();
    const env = buildEnvelope(version, AGENT_SECTION_NAMES);
    const end = performance.now();
    expect(env.sections.quick).toBeTruthy();
    expect(end - start).toBeLessThan(25);
  });

  it('includes aliases in patterns section entries', () => {
    const json = run('node dist/index.js agent --sections patterns --json');
    const parsed = JSON.parse(json);
    const patterns = parsed.patterns?.patterns || parsed.sections?.patterns?.patterns;
    expect(Array.isArray(patterns)).toBe(true);
    const formBasic = patterns.find((p: any) => p.name === 'Form.Basic');
    expect(formBasic).toBeTruthy();
    expect(Array.isArray(formBasic.aliases)).toBe(true);
    expect(formBasic.aliases).toContain('form');
  });

  it('performance: CLI spawn median < 1200ms, max < 1800ms over 5 runs', () => {
    const runs: number[] = [];
    const iterations = 5;
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      run('node dist/index.js agent --all --json');
      const end = performance.now();
      runs.push(end - start);
    }
    const sorted = [...runs].sort((a,b)=>a-b);
    const median = sorted[Math.floor(sorted.length/2)];
    const max = Math.max(...runs);
    // Log stats for visibility (stdout acceptable in test context)
    // eslint-disable-next-line no-console
    console.log('[agent performance] runs(ms)=', JSON.stringify(runs), 'median=', median.toFixed(2), 'max=', max.toFixed(2));
    expect(median).toBeLessThan(1200);
    expect(max).toBeLessThan(1800);
  });
});
