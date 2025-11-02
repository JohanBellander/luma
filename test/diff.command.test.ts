import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';

// Basic test comparing example happy-form vs broken-form
describe('diff command', () => {
  const root = process.cwd();
  const oldFile = join(root, 'examples', 'login.json');
  const newFile = join(root, 'examples', 'happy-form.json');

  it('produces JSON diff with expected shape', () => {
    const output = execSync(`node dist/index.js diff ${oldFile} ${newFile} --json`, { encoding: 'utf-8' });
    const data = JSON.parse(output);
    expect(data).toHaveProperty('addedNodes');
    expect(data).toHaveProperty('removedNodes');
    expect(data).toHaveProperty('changedNodes');
    expect(data).toHaveProperty('issueDelta');
    expect(data.issueDelta).toHaveProperty('addedIssues');
    expect(data.issueDelta).toHaveProperty('resolvedIssues');
  });
});
