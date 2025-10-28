/**
 * Integration tests for LUMA full workflow
 * Tests the current implementation which auto-generates run folders
 */

import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const EXAMPLES_DIR = join(process.cwd(), 'examples');
const RUNS_DIR = join(process.cwd(), '.ui', 'runs');

/**
 * Get the most recently created run folder
 */
function getMostRecentRunFolder(): string {
  if (!existsSync(RUNS_DIR)) {
    throw new Error('No run folders found');
  }
  
  const folders = readdirSync(RUNS_DIR)
    .map(name => join(RUNS_DIR, name))
    .filter(path => statSync(path).isDirectory())
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
  
  if (folders.length === 0) {
    throw new Error('No run folders found');
  }
  
  return folders[0];
}

describe('Integration: Full Workflow', () => {
  describe('Happy Path: Valid Form', () => {
    const scaffoldPath = join(EXAMPLES_DIR, 'happy-form.json');
    let runFolder: string;

    it('should complete ingest without errors', () => {
      const result = execSync(
        `node dist/index.js ingest ${scaffoldPath} --json`,
        { encoding: 'utf-8' }
      );

      const output = JSON.parse(result);
      expect(output.valid).toBe(true);
      expect(output.issues).toHaveLength(0);
      expect(output.normalized).toBeDefined();

      // Get the run folder from ingest output
      runFolder = output.runFolder;
      expect(runFolder).toBeDefined();
      
      // Verify ingest.json was created
      const ingestPath = join(runFolder, 'ingest.json');
      expect(existsSync(ingestPath)).toBe(true);

      const ingestData = JSON.parse(readFileSync(ingestPath, 'utf-8'));
      expect(ingestData.valid).toBe(true);
      expect(ingestData.issues).toHaveLength(0);
      expect(ingestData.normalized).toBeDefined();
    });

    it('should complete layout for multiple viewports', () => {
      execSync(
        `node dist/index.js layout ${scaffoldPath} --viewports 320x640,1024x768`,
        { encoding: 'utf-8' }
      );

      runFolder = getMostRecentRunFolder();

      // Verify layout files were created
      const layout320 = join(runFolder, 'layout_320x640.json');
      const layout1024 = join(runFolder, 'layout_1024x768.json');

      expect(existsSync(layout320)).toBe(true);
      expect(existsSync(layout1024)).toBe(true);

      const layout320Data = JSON.parse(readFileSync(layout320, 'utf-8'));
      expect(layout320Data.viewport).toBe('320x640');
      expect(layout320Data.frames).toBeDefined();
      expect(layout320Data.issues).toBeDefined();
    });

    it('should complete keyboard analysis', () => {
      execSync(
        `node dist/index.js keyboard ${scaffoldPath}`,
        { encoding: 'utf-8' }
      );

      runFolder = getMostRecentRunFolder();

      // Verify keyboard.json was created
      const keyboardPath = join(runFolder, 'keyboard.json');
      expect(existsSync(keyboardPath)).toBe(true);

      const keyboardData = JSON.parse(readFileSync(keyboardPath, 'utf-8'));
      expect(keyboardData.sequence).toBeDefined();
      expect(keyboardData.issues).toBeDefined();
      expect(Array.isArray(keyboardData.sequence)).toBe(true);
    });

    it('should complete flow pattern validation', () => {
      execSync(
        `node dist/index.js flow ${scaffoldPath} --patterns form`,
        { encoding: 'utf-8' }
      );

      runFolder = getMostRecentRunFolder();

      // Verify flow.json was created
      const flowPath = join(runFolder, 'flow.json');
      expect(existsSync(flowPath)).toBe(true);

      const flowData = JSON.parse(readFileSync(flowPath, 'utf-8'));
      expect(flowData.patterns).toBeDefined();
      expect(Array.isArray(flowData.patterns)).toBe(true);

      // Should have Form.Basic pattern result
      const formResult = flowData.patterns.find((r: any) => r.pattern === 'Form.Basic');
      expect(formResult).toBeDefined();
      expect(formResult.mustPassed).toBeGreaterThan(0);
      expect(formResult.issues).toBeDefined();
    });

    it('should complete scoring with pass result', () => {
      runFolder = getMostRecentRunFolder();
      
      execSync(
        `node dist/index.js score ${runFolder}`,
        { encoding: 'utf-8' }
      );

      // Verify score.json was created
      const scorePath = join(runFolder, 'score.json');
      expect(existsSync(scorePath)).toBe(true);

      const scoreData = JSON.parse(readFileSync(scorePath, 'utf-8'));
      expect(scoreData.overall).toBeGreaterThanOrEqual(0);
      expect(scoreData.overall).toBeLessThanOrEqual(100);
      expect(scoreData.pass).toBe(true);
      expect(scoreData.categories).toBeDefined();
      expect(scoreData.categories.patternFidelity).toBeGreaterThanOrEqual(0);
      expect(scoreData.categories.flowReachability).toBeGreaterThanOrEqual(0);
      expect(scoreData.categories.hierarchyGrouping).toBeGreaterThanOrEqual(0);
      expect(scoreData.categories.responsiveBehavior).toBeGreaterThanOrEqual(0);
    });

    it('should generate HTML report', () => {
      runFolder = getMostRecentRunFolder();
      const reportPath = join(runFolder, 'report.html');
      
      execSync(
        `node dist/index.js report ${runFolder} --out ${reportPath}`,
        { encoding: 'utf-8' }
      );

      expect(existsSync(reportPath)).toBe(true);
      const html = readFileSync(reportPath, 'utf-8');
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('LUMA Analysis Report');
      expect(html).toContain('PASS');
    });
  });

  describe('Pattern Failures', () => {
    const scaffoldPath = join(EXAMPLES_DIR, 'pattern-failures.json');

    it('should detect MUST violations in pattern validation', { timeout: 10000 }, () => {
      // Ingest the scaffold
      execSync(
        `node dist/index.js ingest ${scaffoldPath}`,
        { encoding: 'utf-8' }
      );

      let runFolder = getMostRecentRunFolder();

      // Run layout
      execSync(
        `node dist/index.js layout ${scaffoldPath} --viewports 1024x768`,
        { encoding: 'utf-8' }
      );

      runFolder = getMostRecentRunFolder();

      // Run keyboard
      execSync(
        `node dist/index.js keyboard ${scaffoldPath}`,
        { encoding: 'utf-8' }
      );

      runFolder = getMostRecentRunFolder();

      // Run flow with form pattern - should detect missing labels
      // This will exit with non-zero code due to MUST failures, which is expected
      try {
        execSync(
          `node dist/index.js flow ${scaffoldPath} --patterns form`,
          { encoding: 'utf-8' }
        );
      } catch (error) {
        // Expected to fail due to pattern violations
      }

      runFolder = getMostRecentRunFolder();

      const flowPath = join(runFolder, 'flow.json');
      const flowData = JSON.parse(readFileSync(flowPath, 'utf-8'));

      const formResult = flowData.patterns.find((r: any) => r.pattern === 'Form.Basic');
      expect(formResult).toBeDefined();
      expect(formResult.mustFailed).toBeGreaterThan(0);
      expect(formResult.issues.length).toBeGreaterThan(0);

      // Should have field-has-label MUST violation
      const labelIssue = formResult.issues.find((i: any) => i.id === 'field-has-label');
      expect(labelIssue).toBeDefined();
      expect(labelIssue.severity).toBe('error');
    });
  });
});
