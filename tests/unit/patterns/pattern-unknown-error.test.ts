import { describe, it, expect } from 'vitest';
import { createPatternsCommand } from '../../../src/cli/patterns.command.js';
import { Command } from 'commander';

function runShow(name: string): { code: number; stderr: string } {
  let stderr = '';
  const origError = console.error;
  console.error = (msg?: any, ...rest: any[]) => { stderr += (typeof msg === 'string' ? msg : JSON.stringify(msg)) + '\n'; if (rest.length) stderr += rest.map(r => String(r)).join(' ') + '\n'; };
  let exitCode: number = 0;
  const origExit = process.exit as any;
  (process as any).exit = (code?: number) => { exitCode = code ?? 0; throw new Error('EXIT'); };
  try {
    const cmd = new Command();
    const patternsCmd = createPatternsCommand();
    // Simulate invocation
    patternsCmd.parse(['node','patterns','--show', name]);
  } catch (e: any) {
    // swallow forced exit
  } finally {
    console.error = origError;
    (process as any).exit = origExit;
  }
  return { code: exitCode, stderr };
}

describe('Unknown pattern error messaging (LUMA-102)', () => {
  it('provides suggestions and alias listing for unknown pattern', () => {
    const { code, stderr } = runShow('form.basicc'); // misspelled
    expect(code).toBe(2);
    expect(stderr).toMatch(/Unknown pattern: form.basicc/);
    expect(stderr).toMatch(/Available patterns & aliases:/);
    // Should include at least one canonical pattern name
    expect(stderr).toMatch(/Form\.Basic/);
  });

  it('shows suggestions when partial prefix matches', () => {
    const { code, stderr } = runShow('prog');
    expect(code).toBe(2);
    expect(stderr).toMatch(/Unknown pattern: prog/);
    expect(stderr).toMatch(/Progressive\.Disclosure/);
  });
});
