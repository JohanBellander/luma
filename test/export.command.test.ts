/**
 * Tests for export command (html-prototype)
 */

import { describe, it, expect } from 'vitest';
import { writeFileSync, readFileSync, rmSync } from 'fs';
import { join } from 'path';
import { Command } from 'commander';
import { createExportCommand } from '../src/cli/export.command.js';

describe('export command', () => {
  const tmpScaffold = join(process.cwd(), '.test-export-scaffold.json');
  const outFile = join(process.cwd(), '.test-prototype.html');

  const scaffold = {
    schemaVersion: '1.0.0',
    screen: {
      id: 'login-screen',
      title: 'Login',
      root: {
        id: 'root-stack',
        type: 'Stack',
        direction: 'vertical',
        gap: 16,
        padding: 24,
        children: [
          { id: 'heading', type: 'Text', text: 'Sign In' },
          {
            id: 'login-form',
            type: 'Form',
            title: 'Account Access',
            fields: [
              { id: 'email-field', type: 'Field', label: 'Email', inputType: 'email', required: true },
              { id: 'password-field', type: 'Field', label: 'Password', inputType: 'password', required: true }
            ],
            actions: [
              { id: 'submit-btn', type: 'Button', text: 'Login', roleHint: 'primary' },
              { id: 'cancel-btn', type: 'Button', text: 'Cancel', roleHint: 'secondary' }
            ],
            states: ['default', 'submitting', 'error']
          }
        ]
      }
    },
    settings: {
      spacingScale: [4, 8, 12, 16, 24],
      minTouchTarget: { w: 44, h: 44 },
      breakpoints: ['320x640', '768x1024']
    }
  };

  it('should generate html prototype file', async () => {
    writeFileSync(tmpScaffold, JSON.stringify(scaffold, null, 2));
    try {
      const program = new Command();
      program.addCommand(createExportCommand());
      let exitCode: number | undefined;
      const originalExit = process.exit as any;
      (process.exit as any) = (code?: number) => { exitCode = code ?? 0; };
      await program.parseAsync(['node','test.js','export', tmpScaffold, '--format','html-prototype','--out', outFile]);
      (process.exit as any) = originalExit;
      expect(exitCode).toBe(0);
      const html = readFileSync(outFile, 'utf-8');
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Login - LUMA Prototype');
      expect(html).toContain('form');
      expect(html).toContain('email-field');
      expect(html).toContain('button');
    } finally {
      rmSync(tmpScaffold, { force: true });
      rmSync(outFile, { force: true });
    }
  });

  it('should output metadata JSON with --json', async () => {
    writeFileSync(tmpScaffold, JSON.stringify(scaffold, null, 2));
    try {
      let captured = '';
      const originalLog = console.log;
      console.log = (msg?: any) => { captured += (typeof msg === 'string' ? msg : JSON.stringify(msg)) + '\n'; };
      const program = new Command();
      program.addCommand(createExportCommand());
      let exitCode: number | undefined;
      const originalExit = process.exit as any;
      (process.exit as any) = (code?: number) => { exitCode = code ?? 0; };
      await program.parseAsync(['node','test.js','export', tmpScaffold, '--format','html-prototype','--json']);
      (process.exit as any) = originalExit;
      console.log = originalLog;
      expect(exitCode).toBe(0);
      const meta = JSON.parse(captured);
      expect(meta.format).toBe('html-prototype');
      expect(meta.nodes).toBeGreaterThan(0);
    } finally {
      rmSync(tmpScaffold, { force: true });
    }
  });
});
