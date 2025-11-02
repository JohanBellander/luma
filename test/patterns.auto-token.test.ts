import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import { join } from 'path';

// Use existing example with Form + Button to ensure Form.Basic suggestion triggers auto selection.
const FORM_EXAMPLE = join(process.cwd(), 'examples', 'happy-form.json');

function run(cmd: string): { stdout: string; code: number } {
  try {
    const stdout = execSync(cmd, { encoding: 'utf-8' });
    return { stdout, code: 0 };
  } catch (e: any) {
    return { stdout: e.stdout?.toString() || '', code: e.status ?? 1 };
  }
}

describe('--patterns auto token', () => {
  it('flow: treats --patterns auto same as omission and reports autoSelected array (JSON)', () => {
    const { stdout } = run(`node dist/index.js flow ${FORM_EXAMPLE} --patterns auto --json`);
    const parsed = JSON.parse(stdout);
    expect(parsed.autoSelected).toBeDefined();
    expect(Array.isArray(parsed.autoSelected)).toBe(true);
    // Should include Form.Basic with confidenceScore >= 80
    const names = parsed.autoSelected.map((p: any) => p.pattern);
    expect(names).toContain('Form.Basic');
  });

  it('flow: mixed list ignores auto token but keeps explicit patterns', () => {
    const { stdout } = run(`node dist/index.js flow ${FORM_EXAMPLE} --patterns auto,Form.Basic --json`);
    const parsed = JSON.parse(stdout);
    // autoSelected should be empty because explicit pattern provided (after filtering)
    expect(parsed.autoSelected?.length || 0).toBe(0);
    const validatedNames = parsed.patterns.map((p: any) => p.pattern);
    expect(validatedNames).toContain('Form.Basic');
  });

  it('validate: --patterns auto activates high-confidence patterns and exposes autoSelected list', () => {
    const { stdout, code } = run(`node dist/index.js validate ${FORM_EXAMPLE} --patterns auto --json`);
    expect(code).toBe(0); // happy form should pass
    const parsed = JSON.parse(stdout);
    expect(parsed.autoSelected).toBeDefined();
    expect(parsed.autoSelected).toContain('Form.Basic');
    expect(parsed.flow.patterns).toContain('Form.Basic');
  });

  it('validate: explicit pattern list with auto token filters auto out', () => {
    const { stdout, code } = run(`node dist/index.js validate ${FORM_EXAMPLE} --patterns Form.Basic,auto --json`);
    expect(code).toBe(0);
    const parsed = JSON.parse(stdout);
    // autoSelected absent because explicit patterns used
    expect(parsed.autoSelected).toBeUndefined();
    expect(parsed.flow.patterns).toContain('Form.Basic');
  });
});
