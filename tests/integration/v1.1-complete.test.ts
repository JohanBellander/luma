/**
 * LUMA v1.1 Complete Integration Test
 * End-to-end workflow test: read contract, generate scaffold, validate, run full pipeline
 * Tests: Complete agent workflow with all v1.1 features
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import { readFileSync, existsSync, readdirSync, statSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const TEMPLATES_DIR = join(process.cwd(), 'templates');
const RUNS_DIR = join(process.cwd(), '.ui', 'runs');
const TEST_OUTPUT_DIR = join(tmpdir(), 'luma-v1.1-complete-' + Date.now());

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

/**
 * Helper to recursively collect all node IDs from a tree
 */
function getAllNodeIds(node: any): string[] {
  const ids: string[] = [node.id];
  
  if (node.children && Array.isArray(node.children)) {
    node.children.forEach((child: any) => {
      ids.push(...getAllNodeIds(child));
    });
  }
  
  if (node.child) {
    ids.push(...getAllNodeIds(node.child));
  }
  
  if (node.fields && Array.isArray(node.fields)) {
    node.fields.forEach((field: any) => {
      ids.push(...getAllNodeIds(field));
    });
  }
  
  if (node.actions && Array.isArray(node.actions)) {
    node.actions.forEach((action: any) => {
      ids.push(...getAllNodeIds(action));
    });
  }
  
  return ids;
}

describe('Integration: LUMA v1.1 Complete Workflow', () => {
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

  describe('Complete Agent Workflow: From Contract to Validated Scaffold', () => {
    const scaffoldPath = join(TEST_OUTPUT_DIR, 'agent-complete-workflow.json');
    let runFolder: string;

    it('Step 1: Agent reads scaffold contract via explain command', () => {
      const result = execSync(
        'node dist/index.js explain --topic scaffold-contract --json',
        { encoding: 'utf-8' }
      );

      const contract = JSON.parse(result);
      
      // Verify contract structure
      expect(contract.title).toBe('Scaffold Contract');
      expect(contract.summary).toBeDefined();
      expect(contract.details).toBeDefined();
      expect(Array.isArray(contract.details)).toBe(true);
      
      // Verify contract contains essential schema information
      const allContent = contract.summary + contract.details.join(' ');
      expect(allContent).toContain('schemaVersion');
      expect(allContent).toContain('1.0.0');
      expect(allContent).toContain('screen.id');
      expect(allContent).toContain('screen.root');
      expect(allContent).toContain('Stack');
      expect(allContent).toContain('Grid');
      
      // Exit code should be 0 (success)
      // execSync throws on non-zero exit, so reaching here means success
    });

    it('Step 2: Agent generates scaffold from pattern', () => {
      const result = execSync(
        `node dist/index.js scaffold new --pattern todo-list --out ${scaffoldPath} --title "Complete Test" --screen-id complete-test`,
        { encoding: 'utf-8' }
      );

      // Verify file was created
      expect(existsSync(scaffoldPath)).toBe(true);
      
      // Verify it contains success message
      expect(result).toContain('Scaffold created');
      expect(result).toContain('complete-test');
      expect(result).toContain('Complete Test');
    });

    it('Step 3: Agent validates scaffold structure with ingest', () => {
      const result = execSync(
        `node dist/index.js ingest ${scaffoldPath} --json`,
        { encoding: 'utf-8' }
      );

      const ingestOutput = JSON.parse(result);
      
      // Verify validation passed
      expect(ingestOutput.valid).toBe(true);
      expect(ingestOutput.issues).toBeDefined();
      expect(Array.isArray(ingestOutput.issues)).toBe(true);
      expect(ingestOutput.issues.length).toBe(0);
      expect(ingestOutput.normalized).toBeDefined();
      
      // Verify run folder was created with ingest.json
      runFolder = getMostRecentRunFolder();
      const ingestPath = join(runFolder, 'ingest.json');
      expect(existsSync(ingestPath)).toBe(true);
      
      const ingestData = JSON.parse(readFileSync(ingestPath, 'utf-8'));
      expect(ingestData.valid).toBe(true);
      expect(ingestData.issues.length).toBe(0);
    });

    it('Step 4: Agent runs layout analysis for multiple viewports', () => {
      const result = execSync(
        `node dist/index.js layout ${scaffoldPath} --viewports 320x640,768x1024,1280x800`,
        { encoding: 'utf-8' }
      );

      runFolder = getMostRecentRunFolder();
      
      // Verify layout files created for all viewports
      const viewports = ['320x640', '768x1024', '1280x800'];
      viewports.forEach(viewport => {
        const layoutPath = join(runFolder, `layout_${viewport}.json`);
        expect(existsSync(layoutPath)).toBe(true);
        
        const layoutData = JSON.parse(readFileSync(layoutPath, 'utf-8'));
        expect(layoutData.viewport).toBe(viewport);
        expect(layoutData.frames).toBeDefined();
        expect(layoutData.issues).toBeDefined();
        expect(Array.isArray(layoutData.issues)).toBe(true);
        
        // Should have no critical layout errors
        const errors = layoutData.issues.filter((i: any) => i.severity === 'error');
        expect(errors.length).toBe(0);
      });
    });

    it('Step 5: Agent runs keyboard flow analysis', () => {
      const result = execSync(
        `node dist/index.js keyboard ${scaffoldPath}`,
        { encoding: 'utf-8' }
      );

      runFolder = getMostRecentRunFolder();
      const keyboardPath = join(runFolder, 'keyboard.json');
      expect(existsSync(keyboardPath)).toBe(true);
      
      const keyboardData = JSON.parse(readFileSync(keyboardPath, 'utf-8'));
      expect(keyboardData.sequence).toBeDefined();
      expect(Array.isArray(keyboardData.sequence)).toBe(true);
      expect(keyboardData.issues).toBeDefined();
      
      // Should have focusable elements (todo-list has buttons)
      expect(keyboardData.sequence.length).toBeGreaterThan(0);
      
      // Should have no critical flow errors
      const criticalIssues = keyboardData.issues.filter((i: any) => i.severity === 'error');
      expect(criticalIssues.length).toBe(0);
    });

    it('Step 6: Agent runs pattern validation', () => {
      const result = execSync(
        `node dist/index.js flow ${scaffoldPath} --patterns table`,
        { encoding: 'utf-8' }
      );

      runFolder = getMostRecentRunFolder();
      const flowPath = join(runFolder, 'flow.json');
      expect(existsSync(flowPath)).toBe(true);
      
      const flowData = JSON.parse(readFileSync(flowPath, 'utf-8'));
      expect(flowData.patterns).toBeDefined();
      expect(Array.isArray(flowData.patterns)).toBe(true);
      
      // Todo-list pattern includes a table
      const tableResult = flowData.patterns.find((r: any) => r.pattern === 'Table.Simple');
      expect(tableResult).toBeDefined();
      expect(tableResult.mustFailed).toBe(0);
    });

    it('Step 7: Agent generates overall score', () => {
      runFolder = getMostRecentRunFolder();
      
      const result = execSync(
        `node dist/index.js score ${runFolder}`,
        { encoding: 'utf-8' }
      );

      const scorePath = join(runFolder, 'score.json');
      expect(existsSync(scorePath)).toBe(true);
      
      const scoreData = JSON.parse(readFileSync(scorePath, 'utf-8'));
      expect(scoreData.overall).toBeDefined();
      expect(scoreData.categories).toBeDefined();
      expect(scoreData.pass).toBeDefined();
      
      // Generated scaffold should score well
      expect(scoreData.overall).toBeGreaterThanOrEqual(85);
      expect(scoreData.pass).toBe(true);
      
      // Verify categories present (actual category names from score.json)
      expect(scoreData.categories.patternFidelity).toBeDefined();
      expect(scoreData.categories.flowReachability).toBeDefined();
      expect(scoreData.categories.hierarchyGrouping).toBeDefined();
      expect(scoreData.categories.responsiveBehavior).toBeDefined();
    });

    it('Step 8: Agent generates HTML report', () => {
      runFolder = getMostRecentRunFolder();
      
      const reportPath = join(runFolder, 'report.html');
      execSync(
        `node dist/index.js report ${runFolder} --out ${reportPath}`,
        { encoding: 'utf-8' }
      );

      expect(existsSync(reportPath)).toBe(true);
      
      const reportContent = readFileSync(reportPath, 'utf-8');
      expect(reportContent).toContain('<!DOCTYPE html>');
      expect(reportContent).toContain('LUMA');
      expect(reportContent).toContain('Report');
    });
  });

  describe('Golden Template Workflow: Complete Pipeline', () => {
    const goldenPath = join(TEMPLATES_DIR, 'golden.todo.mock.json');
    let runFolder: string;

    it('should run complete pipeline on golden template', { timeout: 10000 }, () => {
      // Verify golden template exists
      expect(existsSync(goldenPath)).toBe(true);
      
      // Step 1: Ingest
      const ingestResult = execSync(
        `node dist/index.js ingest ${goldenPath} --json`,
        { encoding: 'utf-8' }
      );
      const ingest = JSON.parse(ingestResult);
      expect(ingest.valid).toBe(true);
      expect(ingest.issues.length).toBe(0);
      
      // Step 2: Layout (multiple viewports)
      execSync(
        `node dist/index.js layout ${goldenPath} --viewports 320x640,768x1024,1280x800`,
        { encoding: 'utf-8' }
      );
      
      runFolder = getMostRecentRunFolder();
      ['320x640', '768x1024', '1280x800'].forEach(viewport => {
        const layoutPath = join(runFolder, `layout_${viewport}.json`);
        expect(existsSync(layoutPath)).toBe(true);
        
        const layout = JSON.parse(readFileSync(layoutPath, 'utf-8'));
        const errors = layout.issues.filter((i: any) => i.severity === 'error');
        expect(errors.length).toBe(0);
      });
      
      // Step 3: Keyboard
      execSync(`node dist/index.js keyboard ${goldenPath}`, { encoding: 'utf-8' });
      const keyboardPath = join(runFolder, 'keyboard.json');
      expect(existsSync(keyboardPath)).toBe(true);
      
      const keyboard = JSON.parse(readFileSync(keyboardPath, 'utf-8'));
      expect(keyboard.sequence.length).toBeGreaterThan(0);
      const kbErrors = keyboard.issues.filter((i: any) => i.severity === 'error');
      expect(kbErrors.length).toBe(0);
      
      // Step 4: Flow patterns
      execSync(`node dist/index.js flow ${goldenPath} --patterns table`, { encoding: 'utf-8' });
      const flowPath = join(runFolder, 'flow.json');
      expect(existsSync(flowPath)).toBe(true);
      
      const flow = JSON.parse(readFileSync(flowPath, 'utf-8'));
      const tablePattern = flow.patterns.find((p: any) => p.pattern === 'Table.Simple');
      expect(tablePattern).toBeDefined();
      expect(tablePattern.mustFailed).toBe(0);
      
      // Step 5: Score
      execSync(`node dist/index.js score ${runFolder}`, { encoding: 'utf-8' });
      const scorePath = join(runFolder, 'score.json');
      expect(existsSync(scorePath)).toBe(true);
      
      const score = JSON.parse(readFileSync(scorePath, 'utf-8'));
      expect(score.overall).toBeGreaterThanOrEqual(85);
      expect(score.pass).toBe(true);
      
      // Step 6: Report
      const reportPath = join(runFolder, 'report.html');
      execSync(`node dist/index.js report ${runFolder} --out ${reportPath}`, { encoding: 'utf-8' });
      expect(existsSync(reportPath)).toBe(true);
    });
  });

  describe('Exit Code Verification', () => {
    it('should return exit code 0 for successful operations', () => {
      const scaffoldPath = join(TEST_OUTPUT_DIR, 'exit-code-success.json');
      
      // scaffold new should succeed
      execSync(
        `node dist/index.js scaffold new --pattern empty-screen --out ${scaffoldPath}`,
        { encoding: 'utf-8' }
      );
      
      // ingest should succeed
      execSync(
        `node dist/index.js ingest ${scaffoldPath}`,
        { encoding: 'utf-8' }
      );
      
      // If we reach here, exit codes were 0 (execSync throws on non-zero)
      expect(true).toBe(true);
    });

    it('should return exit code 3 for validation errors (unknown pattern)', () => {
      const scaffoldPath = join(TEST_OUTPUT_DIR, 'exit-code-error.json');
      
      try {
        execSync(
          `node dist/index.js scaffold new --pattern invalid-pattern --out ${scaffoldPath}`,
          { encoding: 'utf-8', stdio: 'pipe' }
        );
        // Should not reach here
        expect(false).toBe(true);
      } catch (error: any) {
        expect(error.status).toBe(3); // EXIT_BLOCKING_ISSUES
      }
    });

    it('should return exit code 4 for file exists without --force', () => {
      const scaffoldPath = join(TEST_OUTPUT_DIR, 'exit-code-exists.json');
      
      // Create file first
      execSync(
        `node dist/index.js scaffold new --pattern empty-screen --out ${scaffoldPath}`,
        { encoding: 'utf-8' }
      );
      
      // Try to overwrite without --force
      try {
        execSync(
          `node dist/index.js scaffold new --pattern empty-screen --out ${scaffoldPath}`,
          { encoding: 'utf-8', stdio: 'pipe' }
        );
        // Should not reach here
        expect(false).toBe(true);
      } catch (error: any) {
        expect(error.status).toBe(4); // EXIT_INTERNAL_ERROR
      }
    });
  });

  describe('Scaffold Pattern Coverage', () => {
    it('should test all available patterns in full pipeline', { timeout: 15000 }, () => {
      const patterns = ['todo-list', 'empty-screen'];
      
      patterns.forEach(pattern => {
        const scaffoldPath = join(TEST_OUTPUT_DIR, `pattern-${pattern}.json`);
        
        // Generate
        execSync(
          `node dist/index.js scaffold new --pattern ${pattern} --out ${scaffoldPath} --force`,
          { encoding: 'utf-8' }
        );
        
        // Validate structure
        const scaffold = JSON.parse(readFileSync(scaffoldPath, 'utf-8'));
        expect(scaffold.schemaVersion).toBe('1.0.0');
        expect(scaffold.screen).toBeDefined();
        expect(scaffold.screen.id).toBeDefined();
        expect(scaffold.screen.root).toBeDefined();
        
        // Run ingest
        const ingestResult = execSync(
          `node dist/index.js ingest ${scaffoldPath} --json`,
          { encoding: 'utf-8' }
        );
        const ingest = JSON.parse(ingestResult);
        expect(ingest.valid).toBe(true);
        expect(ingest.issues.length).toBe(0);
        
        // Run layout
        execSync(
          `node dist/index.js layout ${scaffoldPath} --viewports 768x1024`,
          { encoding: 'utf-8' }
        );
        
        const runFolder = getMostRecentRunFolder();
        const layoutPath = join(runFolder, 'layout_768x1024.json');
        const layout = JSON.parse(readFileSync(layoutPath, 'utf-8'));
        const layoutErrors = layout.issues.filter((i: any) => i.severity === 'error');
        expect(layoutErrors.length).toBe(0);
        
        // Run keyboard
        execSync(`node dist/index.js keyboard ${scaffoldPath}`, { encoding: 'utf-8' });
        const keyboardPath = join(runFolder, 'keyboard.json');
        const keyboard = JSON.parse(readFileSync(keyboardPath, 'utf-8'));
        const kbErrors = keyboard.issues.filter((i: any) => i.severity === 'error');
        expect(kbErrors.length).toBe(0);
      });
    });
  });

  describe('Custom Options Coverage', () => {
    it('should support all custom options in scaffold new', () => {
      const scaffoldPath = join(TEST_OUTPUT_DIR, 'custom-options.json');
      
      execSync(
        `node dist/index.js scaffold new --pattern todo-list --out ${scaffoldPath} --title "Custom Title" --screen-id custom-id --breakpoints "480x800,1920x1080" --force`,
        { encoding: 'utf-8' }
      );
      
      const scaffold = JSON.parse(readFileSync(scaffoldPath, 'utf-8'));
      
      // Verify custom title
      expect(scaffold.screen.title).toBe('Custom Title');
      
      // Verify custom screen ID
      expect(scaffold.screen.id).toBe('custom-id');
      
      // Verify custom breakpoints
      expect(scaffold.settings.breakpoints).toEqual(['480x800', '1920x1080']);
      
      // Verify it still validates
      const ingestResult = execSync(
        `node dist/index.js ingest ${scaffoldPath} --json`,
        { encoding: 'utf-8' }
      );
      const ingest = JSON.parse(ingestResult);
      expect(ingest.valid).toBe(true);
    });
  });

  describe('Contract and Documentation Verification', () => {
    it('should verify all v1.1 topics are accessible', () => {
      const topics = ['scaffold-contract', 'golden-template'];
      
      topics.forEach(topic => {
        const result = execSync(
          `node dist/index.js explain --topic ${topic} --json`,
          { encoding: 'utf-8' }
        );
        
        const output = JSON.parse(result);
        expect(output.title).toBeDefined();
        expect(output.summary).toBeDefined();
        expect(output.details).toBeDefined();
        expect(Array.isArray(output.details)).toBe(true);
      });
    });

    it('should verify AGENT-RULES-SCAFFOLD.md exists and contains contract', () => {
      const contractPath = join(process.cwd(), 'AGENT-RULES-SCAFFOLD.md');
      expect(existsSync(contractPath)).toBe(true);
      
      const content = readFileSync(contractPath, 'utf-8');
      expect(content).toContain('LUMA Scaffold Contract');
      expect(content).toContain('Canonical Contract');
      expect(content).toContain('Hard Rules');
      expect(content).toContain('Preflight Checklist');
    });

    it('should verify topics.json contains v1.1 topics', () => {
      const topicsPath = join(process.cwd(), 'src', 'data', 'topics.json');
      expect(existsSync(topicsPath)).toBe(true);
      
      const topics = JSON.parse(readFileSync(topicsPath, 'utf-8'));
      expect(topics['scaffold-contract']).toBeDefined();
      expect(topics['golden-template']).toBeDefined();
    });
  });

  describe('Output Artifacts Verification', () => {
    it('should verify all expected output files are created in run folder', { timeout: 15000 }, () => {
      const scaffoldPath = join(TEST_OUTPUT_DIR, 'artifacts-test.json');
      
      // Generate scaffold
      execSync(
        `node dist/index.js scaffold new --pattern todo-list --out ${scaffoldPath} --force`,
        { encoding: 'utf-8' }
      );
      
      // Run full pipeline
      execSync(`node dist/index.js ingest ${scaffoldPath}`, { encoding: 'utf-8' });
      execSync(`node dist/index.js layout ${scaffoldPath} --viewports 768x1024`, { encoding: 'utf-8' });
      execSync(`node dist/index.js keyboard ${scaffoldPath}`, { encoding: 'utf-8' });
      execSync(`node dist/index.js flow ${scaffoldPath} --patterns table`, { encoding: 'utf-8' });
      
      const runFolder = getMostRecentRunFolder();
      execSync(`node dist/index.js score ${runFolder}`, { encoding: 'utf-8' });
      
      const reportPath = join(runFolder, 'report.html');
      execSync(`node dist/index.js report ${runFolder} --out ${reportPath}`, { encoding: 'utf-8' });
      
      // Verify all output files exist
      const expectedFiles = [
        'ingest.json',
        'layout_768x1024.json',
        'keyboard.json',
        'flow.json',
        'score.json',
        'report.html'
      ];
      
      expectedFiles.forEach(filename => {
        const filepath = join(runFolder, filename);
        expect(existsSync(filepath)).toBe(true);
        
        // Verify files are non-empty
        const stats = statSync(filepath);
        expect(stats.size).toBeGreaterThan(0);
      });
    });
  });
});
