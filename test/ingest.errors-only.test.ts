import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import { readFileSync, existsSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

const TEST_DIR = join(process.cwd(), 'test-output', 'errors-only');
const INGEST_INPUT = join(process.cwd(), 'examples', 'pattern-failures.json');

function runCli(args: string): any {
  const cmd = `node dist/index.js ${args}`;
  const output = execSync(cmd, { encoding: 'utf-8' });
  return output;
}

describe('CLI --errors-only flag (ingest)', () => {
  beforeAll(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true });
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterAll(() => {
    // keep artifacts for inspection
  });

  it('should output filteredIssues array when --errors-only used with --json', () => {
    const json = execSync(`node dist/index.js ingest ${INGEST_INPUT} --json --errors-only`, { encoding: 'utf-8' });
    const parsed = JSON.parse(json);
    expect(parsed.filteredIssues).toBeDefined();
    const allSeverities = new Set(parsed.filteredIssues.map((i: any) => i.severity));
    expect([...allSeverities].every(s => s === 'error' || s === 'critical')).toBe(true);
    // Ensure original issues still present
    expect(parsed.issues).toBeDefined();
    expect(parsed.filteredIssues.length).toBeLessThanOrEqual(parsed.issues.length);
  });

  it('should not show warn issues or warn symbol in console output', () => {
    const output = runCli(`ingest ${INGEST_INPUT} --errors-only`);
    // Should not show warn symbol
    expect(output).not.toContain('⚠️');
    // Should indicate errors-only mode if Issues line present
    if (output.includes('Issues:')) {
      expect(output).toMatch(/Issues: \d+ \(errors only\)/);
    }
  });
});
