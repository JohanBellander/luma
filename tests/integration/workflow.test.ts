/**
 * Integration tests for LUMA full workflow
 * Tests the commands working together with deterministic run folders
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import { readFileSync, existsSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

const EXAMPLES_DIR = join(process.cwd(), 'examples');
const TEST_OUTPUT_DIR = join(process.cwd(), 'test-output', 'workflow');

describe('Integration: Full Workflow', () => {
  beforeAll(() => {
    // Create test output directory
    if (!existsSync(TEST_OUTPUT_DIR)) {
      mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
    }
  });

  afterAll(() => {
    // Clean up test output directory
    if (existsSync(TEST_OUTPUT_DIR)) {
      rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true });
    }
  });

  describe('Happy Path: Valid Form', () => {
    const scaffoldPath = join(EXAMPLES_DIR, 'happy-form.json');
    let runFolder: string;

    it('should complete ingest without errors', () => {
      // Create deterministic run folder for this test suite
      runFolder = join(TEST_OUTPUT_DIR, 'happy-form-run');
      if (existsSync(runFolder)) {
        rmSync(runFolder, { recursive: true, force: true });
      }
      mkdirSync(runFolder, { recursive: true });

      const result = execSync(
        `node dist/index.js ingest ${scaffoldPath} --run-folder ${runFolder} --json`,
        { encoding: 'utf-8' }
      );

      const output = JSON.parse(result);
      expect(output.valid).toBe(true);
      expect(output.issues).toHaveLength(0);
      expect(output.normalized).toBeDefined();

      // Verify the run folder matches
      expect(output.runFolder).toBe(runFolder);
      
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
        `node dist/index.js layout ${scaffoldPath} --run-folder ${runFolder} --viewports 320x640,1024x768`,
        { encoding: 'utf-8' }
      );

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
        `node dist/index.js keyboard ${scaffoldPath} --run-folder ${runFolder}`,
        { encoding: 'utf-8' }
      );

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
        `node dist/index.js flow ${scaffoldPath} --run-folder ${runFolder} --patterns form`,
        { encoding: 'utf-8' }
      );

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
    let runFolder: string;

    it('should detect MUST violations in pattern validation', { timeout: 10000 }, () => {
      // Create deterministic run folder for this test
      runFolder = join(TEST_OUTPUT_DIR, 'pattern-failures-run');
      if (existsSync(runFolder)) {
        rmSync(runFolder, { recursive: true, force: true });
      }
      mkdirSync(runFolder, { recursive: true });

      // Ingest the scaffold
      execSync(
        `node dist/index.js ingest ${scaffoldPath} --run-folder ${runFolder}`,
        { encoding: 'utf-8' }
      );

      // Run layout
      execSync(
        `node dist/index.js layout ${scaffoldPath} --run-folder ${runFolder} --viewports 1024x768`,
        { encoding: 'utf-8' }
      );

      // Run keyboard
      execSync(
        `node dist/index.js keyboard ${scaffoldPath} --run-folder ${runFolder}`,
        { encoding: 'utf-8' }
      );

      // Run flow with form pattern - should detect missing labels
      // This will exit with non-zero code due to MUST failures, which is expected
      try {
        execSync(
          `node dist/index.js flow ${scaffoldPath} --run-folder ${runFolder} --patterns form`,
          { encoding: 'utf-8' }
        );
      } catch (error) {
        // Expected to fail due to pattern violations
      }

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
