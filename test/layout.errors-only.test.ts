import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import { join } from 'path';

const INPUT = join(process.cwd(), 'examples', 'pattern-failures.json');

describe('CLI --errors-only flag (layout)', () => {
  it('should include filteredLayouts in JSON output', () => {
    const raw = execSync(`node dist/index.js layout ${INPUT} --json --errors-only --viewports 320x640`, { encoding: 'utf-8' });
    const firstBrace = raw.indexOf('{');
    const lastBrace = raw.lastIndexOf('}');
    expect(firstBrace).toBeGreaterThanOrEqual(0);
    expect(lastBrace).toBeGreaterThan(firstBrace);
    const parsed = JSON.parse(raw.slice(firstBrace, lastBrace + 1));
    expect(parsed.filteredLayouts).toBeDefined();
    expect(Array.isArray(parsed.filteredLayouts)).toBe(true);
    for (const layout of parsed.filteredLayouts) {
      const severities = new Set(layout.issues.map((i: any) => i.severity));
      expect([...severities].every(s => s === 'error' || s === 'critical')).toBe(true);
    }
  });
});
