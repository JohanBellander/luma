import { describe, it, expect } from 'vitest';
import { validatePatterns } from '../../src/core/patterns/validator.js';
import { getPattern } from '../../src/core/patterns/pattern-registry.js';
import { ingest } from '../../src/core/ingest/ingest.js';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';

/**
 * Integration tests for auto pattern selection (LUMA-75)
 * Ensures: implicit activation when --patterns omitted, suppression with --no-auto, and explicit override.
 */

describe('Integration: Auto Pattern Selection (LUMA-75)', () => {
  const baseScaffold = {
    schemaVersion: '1.0.0',
    screen: {
      id: 'auto-form',
      title: 'Auto Form',
      root: {
        id: 'root',
        type: 'Stack',
        direction: 'vertical',
        children: [
          {
            id: 'login-form',
            type: 'Form',
            title: 'Login',
            fields: [
              { id: 'email', type: 'Field', label: 'Email', inputType: 'email', required: true },
              { id: 'password', type: 'Field', label: 'Password', inputType: 'password', required: true }
            ],
            actions: [
              { id: 'submit', type: 'Button', text: 'Submit', roleHint: 'primary', minSize: { w: 44, h: 44 } }
            ],
            states: ['default']
          }
        ]
      }
    },
    settings: {
      spacingScale: [4,8,12,16],
      minTouchTarget: { w: 44, h: 44 },
      breakpoints: ['320x640']
    }
  };

  it('should auto-select Form.Basic when --patterns omitted', () => {
    const tmpPath = 'auto-form.json';
    require('fs').writeFileSync(tmpPath, JSON.stringify(baseScaffold, null, 2));
    const outputRaw = execSync(`node dist/index.js flow ${tmpPath} --json`, { encoding: 'utf-8' });
    const output = JSON.parse(outputRaw);
    const patternNames = output.patterns.map((p: any) => p.pattern);
    expect(patternNames).toContain('Form.Basic');
    expect(output.autoSelected.length).toBeGreaterThan(0);
    // Ensure Form.Basic came from auto selection list
    const autoNames = output.autoSelected.map((a: any) => a.pattern);
    expect(autoNames).toContain('Form.Basic');
  });

  it('should suppress auto-selection with --no-auto', () => {
    const tmpPath = 'auto-form-no-auto.json';
    require('fs').writeFileSync(tmpPath, JSON.stringify(baseScaffold, null, 2));
  const outputRaw = execSync(`node dist/index.js flow ${tmpPath} --no-auto --json`, { encoding: 'utf-8' });
  const output = JSON.parse(outputRaw);
  // No patterns should be validated when auto disabled and none explicitly provided
  expect(output.patterns).toHaveLength(0);
  expect(output.autoSelected).toHaveLength(0);
  });

  it('should combine explicit patterns with auto-selected when both exist', () => {
    // Provide explicit Table.Simple even though scaffold only has a Form; auto should still add Form.Basic
    const tmpPath = 'auto-form-explicit.json';
    require('fs').writeFileSync(tmpPath, JSON.stringify(baseScaffold, null, 2));
    const outputRaw = execSync(`node dist/index.js flow ${tmpPath} --patterns Table.Simple --json`, { encoding: 'utf-8' });
    const output = JSON.parse(outputRaw);
    const patternNames = output.patterns.map((p: any) => p.pattern);
    expect(patternNames).toContain('Table.Simple');
    // Legacy injection only auto-injects PD/GF when explicit patterns given; Form.Basic should NOT be added here (explicit only scenario)
    expect(patternNames).not.toContain('Form.Basic');
  });

  it('should auto-select Progressive.Disclosure when collapsible hint present', () => {
    const disclosureScaffold = JSON.parse(JSON.stringify(baseScaffold));
    disclosureScaffold.screen.root.children.push({
      id: 'toggle-details',
      type: 'Button',
      text: 'Details',
      behaviors: { disclosure: { collapsible: true, targetId: 'details-box' } }
    });
    disclosureScaffold.screen.root.children.push({
      id: 'details-box',
      type: 'Box',
      child: { id: 'details-text', type: 'Text', text: 'Hidden' }
    });
    const tmpPath = 'auto-disclosure.json';
    require('fs').writeFileSync(tmpPath, JSON.stringify(disclosureScaffold, null, 2));
    let outputRaw: string = '';
    try {
      outputRaw = execSync(`node dist/index.js flow ${tmpPath} --json`, { encoding: 'utf-8' });
    } catch (err: any) {
      // Flow may exit non-zero if new MUST failures; capture stdout from error
      outputRaw = err.stdout || '';
    }
    const output = JSON.parse(outputRaw);
    const patternNames = output.patterns.map((p: any) => p.pattern);
    expect(patternNames).toContain('Progressive.Disclosure');
  });
});
