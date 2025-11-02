import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

function run(cmd: string, envExtra: Record<string,string>) {
  return execSync(cmd, { encoding: 'utf-8', env: { ...process.env, ...envExtra } });
}

describe('init command example copying', () => {
  it('copies a single example with --example', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'luma-init-single-'));
  const output = run(`node dist/index.js init --example happy-form`, { LUMA_INIT_TARGET: tmp });
    expect(output).toContain('Created AGENTS.md');
    const examplesDir = path.join(tmp, 'examples');
    expect(fs.existsSync(path.join(examplesDir, 'happy-form.json'))).toBe(true);
  });

  it('copies all examples with --examples all', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'luma-init-all-'));
  const output = run(`node dist/index.js init --examples`, { LUMA_INIT_TARGET: tmp });
    expect(output).toContain('Created AGENTS.md');
    const examplesDir = path.join(tmp, 'examples');
    // Expect at least one known example present
    expect(fs.existsSync(path.join(examplesDir, 'happy-form.json'))).toBe(true);
    expect(fs.readdirSync(examplesDir).filter(f => f.endsWith('.json')).length).toBeGreaterThan(1);
  });

  it('errors on unknown example', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'luma-init-bad-'));
    try {
      run(`node dist/index.js init --example does-not-exist`, { LUMA_INIT_TARGET: tmp });
      expect.fail('Should have thrown');
    } catch (err: any) {
      expect(err.status).toBe(2); // exit code from process.exit(2)
      expect(err.stderr.toString()).toContain("Example 'does-not-exist' not found");
    }
  });

  it('copies a crm template with --template crm', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'luma-init-template-crm-'));
    const output = run(`node dist/index.js init --template crm`, { LUMA_INIT_TARGET: tmp });
    expect(output).toContain('Copied scaffold template');
    expect(fs.existsSync(path.join(tmp, 'crm.scaffold.json'))).toBe(true);
  });

  it('errors on unsupported template name', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'luma-init-template-bad-'));
    try {
      run(`node dist/index.js init --template unknown`, { LUMA_INIT_TARGET: tmp });
      expect.fail('Should have thrown');
    } catch (err: any) {
      expect(err.status).toBe(3);
      expect(err.stderr.toString()).toContain("Template 'unknown' not supported");
    }
  });
});
