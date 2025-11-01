import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import { join } from 'path';

const INPUT = join(process.cwd(), 'examples', 'pattern-failures.json');

describe('CLI --errors-only flag (keyboard)', () => {
  it('should include filteredIssues in JSON output', () => {
    const raw = execSync(`node dist/index.js keyboard ${INPUT} --json --errors-only`, { encoding: 'utf-8' });
    const firstBrace = raw.indexOf('{');
    const lastBrace = raw.lastIndexOf('}');
    expect(firstBrace).toBeGreaterThanOrEqual(0);
    expect(lastBrace).toBeGreaterThan(firstBrace);
    const parsed = JSON.parse(raw.slice(firstBrace, lastBrace + 1));
    expect(parsed.filteredIssues).toBeDefined();
    const severities = new Set(parsed.filteredIssues.map((i: any) => i.severity));
    expect([...severities].every(s => s === 'error' || s === 'critical')).toBe(true);
  });
});
