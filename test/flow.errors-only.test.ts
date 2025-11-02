import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import { join } from 'path';

const INPUT = join(process.cwd(), 'examples', 'pattern-failures.json');

describe('CLI --errors-only flag (flow)', () => {
  it('should include filteredPatterns in JSON output', () => {
    let raw: string;
    try {
      raw = execSync(`node dist/index.js flow ${INPUT} --json --errors-only`, { encoding: 'utf-8' });
    } catch (e: any) {
      // Flow exits with code 3 on MUST failures; still produce JSON prior to exit
      raw = e.stdout?.toString() || '';
      expect(raw.length).toBeGreaterThan(0);
    }
    const firstBrace = raw.indexOf('{');
    const lastBrace = raw.lastIndexOf('}');
    expect(firstBrace).toBeGreaterThanOrEqual(0);
    expect(lastBrace).toBeGreaterThan(firstBrace);
    const parsed = JSON.parse(raw.slice(firstBrace, lastBrace + 1));
    expect(parsed.filteredPatterns).toBeDefined();
    for (const p of parsed.filteredPatterns) {
      const severities = new Set(p.issues.map((i: any) => i.severity));
      expect([...severities].every(s => s === 'error' || s === 'critical')).toBe(true);
    }
  });
});
