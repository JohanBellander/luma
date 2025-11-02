import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import { join } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

// Create a synthetic run folder with minimal artifacts required by score command.
function ensureRunArtifacts(): string {
  const runsRoot = join(process.cwd(), '.ui', 'runs');
  if (!existsSync(runsRoot)) mkdirSync(runsRoot, { recursive: true });
  const runId = 'test-run-score-table';
  const runDir = join(runsRoot, runId);
  if (!existsSync(runDir)) mkdirSync(runDir);
  // Minimal flow.json with zero failures
  const flow = {
    patterns: [
      {
        pattern: 'Form.Basic',
        source: { id: 'spec', name: 'Spec Source' },
        mustPassed: 5,
        mustFailed: 0,
        shouldPassed: 3,
        shouldFailed: 0,
        issues: []
      }
    ],
    hasMustFailures: false,
    totalIssues: 0
  };
  writeFileSync(join(runDir, 'flow.json'), JSON.stringify(flow, null, 2));
  // Minimal keyboard.json with no unreachable issues
  const keyboard = {
    issues: [],
    unreachable: []
  };
  writeFileSync(join(runDir, 'keyboard.json'), JSON.stringify(keyboard, null, 2));
  return runDir;
}

describe('score command --table output', () => {
  it('renders a human-readable table when --table used', () => {
    const runDir = ensureRunArtifacts();
  const scoreOutput = execSync(`node dist/index.js score ${runDir} --table`, { encoding: 'utf-8' });
    expect(scoreOutput).toContain('Score Breakdown (tabular):');
  expect(scoreOutput).toMatch(/Category +\| +Score +\| +Weight +\| +Contribution/);
    expect(scoreOutput).toMatch(/Pattern Fidelity/);
    expect(scoreOutput).toMatch(/Flow & Reachability/);
    expect(scoreOutput).toMatch(/Hierarchy & Grouping/);
    expect(scoreOutput).toMatch(/Responsive Behavior/);
  expect(scoreOutput).toMatch(/Overall/);
  });

  it('does not render table without --table flag', () => {
    const runDir = ensureRunArtifacts();
    const scoreOutput = execSync(`node dist/index.js score ${runDir}`, { encoding: 'utf-8' });
    expect(scoreOutput).not.toContain('Score Breakdown (tabular):');
    // Should still show category lines
    expect(scoreOutput).toContain('Category Scores:');
  });
});
