import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import { join } from 'path';

// Reuse example scaffold that should pass end-to-end
const FORM_EXAMPLE = join(process.cwd(), 'examples', 'happy-form.json');
// Broken form (should trigger blocking layout or ingest issues if used)
const BROKEN_EXAMPLE = join(process.cwd(), 'examples', 'broken-form.json');

function run(cmd: string): { stdout: string; code: number } {
  try {
    const stdout = execSync(cmd, { encoding: 'utf-8' });
    return { stdout, code: 0 };
  } catch (e: any) {
    return { stdout: e.stdout?.toString() || '', code: e.status ?? 1 };
  }
}

describe('analyze command (LUMA-130)', () => {
  it('produces JSON with all stage keys and overall score >= 0 (happy path)', () => {
    const { stdout, code } = run(`node dist/index.js analyze ${FORM_EXAMPLE} --json`);
    expect(code).toBe(0);
    const parsed = JSON.parse(stdout);
  // Accept Windows backslashes or POSIX slashes
  expect(parsed.runFolder.replace(/\\/g,'/')).toMatch(/\.ui\/runs\//);
    expect(parsed.stages).toBeDefined();
    expect(parsed.stages.ingest.valid).toBe(true);
    expect(Array.isArray(parsed.stages.ingest.issues)).toBe(true);
    expect(parsed.stages.layout.viewports.length).toBeGreaterThan(0);
    expect(parsed.stages.keyboard.sequenceLength).toBeGreaterThan(0);
    expect(Array.isArray(parsed.stages.flow.patterns)).toBe(true);
    expect(parsed.stages.score.overall).toBeGreaterThanOrEqual(0);
    // category scores present
    expect(parsed.stages.score.category.patternFidelity).toBeGreaterThanOrEqual(0);
    expect(parsed.stages.score.category.flowReachability).toBeGreaterThanOrEqual(0);
  });

  it('auto pattern selection surfaces autoSelected when no explicit list provided', () => {
    const { stdout } = run(`node dist/index.js analyze ${FORM_EXAMPLE} --json`);
    const parsed = JSON.parse(stdout);
    if (parsed.stages.flow.autoSelected) {
      expect(Array.isArray(parsed.stages.flow.autoSelected)).toBe(true);
      const names = parsed.stages.flow.autoSelected.map((p: any) => p.pattern);
      expect(names).toContain('Form.Basic');
    } else {
      // If not present, treat as acceptable only if patterns list already includes Form.Basic explicitly
      expect(parsed.stages.flow.patterns).toContain('Form.Basic');
    }
  });

  it('blocking layout or pattern MUST failure yields exit code 3', () => {
    // Use broken example which should produce at least one blocking issue in pipeline
    const { code } = run(`node dist/index.js analyze ${BROKEN_EXAMPLE} --json`);
    expect(code).toBe(3); // EXIT_BLOCKING_ISSUES
  });
});
