import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Minimal layout artifact shape
const beforeLayout = {
  viewport: '320x640',
  frames: [
    { id: 'btn-primary', x: 0, y: 500, w: 100, h: 44 },
    { id: 'title', x: 0, y: 0, w: 200, h: 32 }
  ],
  issues: [ { id: 'primary-below-fold', severity: 'warn', message: 'Primary button below fold', nodeId: 'btn-primary' } ]
};

const afterLayout = {
  viewport: '320x640',
  frames: [
    { id: 'btn-primary', x: 0, y: 300, w: 120, h: 44 }, // moved up & resized width
    { id: 'title', x: 0, y: 0, w: 200, h: 32 },
    { id: 'subtitle', x: 0, y: 40, w: 180, h: 24 }
  ],
  issues: []
};

function runCli(args: string, cwd: string): string {
  return execSync(`node ./dist/index.js ${args}`, { cwd, encoding: 'utf-8' });
}

describe('layout-diff command', () => {
  it('detects added, removed, and changed frames plus issue delta', () => {
    const dir = mkdtempSync(join(tmpdir(), 'luma-layout-diff-'));
    const beforePath = join(dir, 'layout_320x640_before.json');
    const afterPath = join(dir, 'layout_320x640_after.json');
    writeFileSync(beforePath, JSON.stringify(beforeLayout, null, 2));
    writeFileSync(afterPath, JSON.stringify(afterLayout, null, 2));

    const outputJson = runCli(`layout-diff ${beforePath} ${afterPath} --json`, process.cwd());
    const parsed = JSON.parse(outputJson);

    expect(parsed.added.map((f: any) => f.id)).toContain('subtitle');
    expect(parsed.removed).toHaveLength(0);
    const changedIds = parsed.changed.map((c: any) => c.id);
    expect(changedIds).toContain('btn-primary');
    const changeEntry = parsed.changed.find((c: any) => c.id === 'btn-primary');
    expect(changeEntry.changeType).toBe('moved_resized');
    expect(parsed.issueDelta.removed.some((i: any) => i.id === 'primary-below-fold')).toBe(true);
  });
});
