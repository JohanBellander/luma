/**
 * Integration tests for LUMA v1.1 Phase 1 features
 * Tests: scaffold contract topic, golden template, scaffold new command
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'child_process';
import { readFileSync, existsSync, readdirSync, statSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const TEMPLATES_DIR = join(process.cwd(), 'templates');
const RUNS_DIR = join(process.cwd(), '.ui', 'runs');
const TEST_OUTPUT_DIR = join(tmpdir(), 'luma-v1.1-test-' + Date.now());

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

describe('Integration: LUMA v1.1 Phase 1', () => {
  beforeAll(() => {
    // Create test output directory
    if (!existsSync(TEST_OUTPUT_DIR)) {
      mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
    }
  });

  describe('Feature: Scaffold Contract Topic (LUMA-15)', () => {
    it('should expose scaffold-contract topic via explain command', () => {
      const result = execSync(
        'node dist/index.js explain --topic scaffold-contract --json',
        { encoding: 'utf-8' }
      );

      const output = JSON.parse(result);
      expect(output.title).toBe('Scaffold Contract');
      expect(output.summary).toBeDefined();
      expect(output.details).toBeDefined();
      expect(Array.isArray(output.details)).toBe(true);
      
      // Verify it contains key contract terms
      const allContent = output.summary + output.details.join(' ');
      expect(allContent).toContain('schemaVersion');
      expect(allContent).toContain('1.0.0');
      expect(allContent).toContain('screen.id');
      expect(allContent).toContain('screen.root');
    });

    it('should verify scaffold-contract topic exists in topics.json', () => {
      const topicsPath = join(process.cwd(), 'src', 'data', 'topics.json');
      expect(existsSync(topicsPath)).toBe(true);
      
      const topicsContent = readFileSync(topicsPath, 'utf-8');
      const topics = JSON.parse(topicsContent);
      
      expect(topics['scaffold-contract']).toBeDefined();
      expect(topics['scaffold-contract'].title).toBe('Scaffold Contract');
      expect(topics['scaffold-contract'].summary).toBeDefined();
      expect(topics['scaffold-contract'].details).toBeDefined();
    });

    it('should have AGENT-RULES-SCAFFOLD.md file with contract', () => {
      const contractPath = join(process.cwd(), 'AGENT-RULES-SCAFFOLD.md');
      expect(existsSync(contractPath)).toBe(true);
      
      const content = readFileSync(contractPath, 'utf-8');
      expect(content).toContain('LUMA Scaffold Contract');
      expect(content).toContain('Canonical Contract');
      expect(content).toContain('Hard Rules');
      expect(content).toContain('Node Type Requirements');
      expect(content).toContain('Preflight Checklist');
    });
  });

  describe('Feature: Golden Template (LUMA-16)', () => {
    const goldenPath = join(TEMPLATES_DIR, 'golden.todo.mock.json');

    it('should have golden template file', () => {
      expect(existsSync(goldenPath)).toBe(true);
    });

    it('should have valid JSON structure', () => {
      const content = readFileSync(goldenPath, 'utf-8');
      const scaffold = JSON.parse(content);
      
      expect(scaffold.schemaVersion).toBe('1.0.0');
      expect(scaffold.screen).toBeDefined();
      expect(scaffold.screen.id).toBeDefined();
      expect(scaffold.screen.title).toBeDefined();
      expect(scaffold.screen.root).toBeDefined();
      expect(scaffold.settings).toBeDefined();
    });

    it('should pass ingest validation', () => {
      const result = execSync(
        `node dist/index.js ingest ${goldenPath} --json`,
        { encoding: 'utf-8' }
      );

      const output = JSON.parse(result);
      expect(output.valid).toBe(true);
      expect(output.issues).toHaveLength(0);
      expect(output.normalized).toBeDefined();
    });

    it('should pass layout analysis', () => {
      execSync(
        `node dist/index.js layout ${goldenPath} --viewports 320x640,768x1024,1280x800`,
        { encoding: 'utf-8' }
      );

      const runFolder = getMostRecentRunFolder();
      
      // Check all three viewports
      const viewports = ['320x640', '768x1024', '1280x800'];
      viewports.forEach(viewport => {
        const layoutPath = join(runFolder, `layout_${viewport}.json`);
        expect(existsSync(layoutPath)).toBe(true);
        
        const layoutData = JSON.parse(readFileSync(layoutPath, 'utf-8'));
        expect(layoutData.viewport).toBe(viewport);
        expect(layoutData.frames).toBeDefined();
        
        // Should have no blocking layout issues
        const blockingIssues = layoutData.issues.filter((i: any) => i.severity === 'error');
        expect(blockingIssues.length).toBe(0);
      });
    });

    it('should pass keyboard flow analysis', () => {
      execSync(
        `node dist/index.js keyboard ${goldenPath}`,
        { encoding: 'utf-8' }
      );

      const runFolder = getMostRecentRunFolder();
      const keyboardPath = join(runFolder, 'keyboard.json');
      expect(existsSync(keyboardPath)).toBe(true);

      const keyboardData = JSON.parse(readFileSync(keyboardPath, 'utf-8'));
      expect(keyboardData.sequence).toBeDefined();
      expect(Array.isArray(keyboardData.sequence)).toBe(true);
      
      // Should have focusable elements
      expect(keyboardData.sequence.length).toBeGreaterThan(0);
      
      // Should have no critical flow errors
      const criticalIssues = keyboardData.issues.filter((i: any) => i.severity === 'error');
      expect(criticalIssues.length).toBe(0);
    });

    it('should pass pattern validation', () => {
      execSync(
        `node dist/index.js flow ${goldenPath} --patterns table`,
        { encoding: 'utf-8' }
      );

      const runFolder = getMostRecentRunFolder();
      const flowPath = join(runFolder, 'flow.json');
      expect(existsSync(flowPath)).toBe(true);

      const flowData = JSON.parse(readFileSync(flowPath, 'utf-8'));
      expect(flowData.patterns).toBeDefined();
      
      const tableResult = flowData.patterns.find((r: any) => r.pattern === 'Table.Simple');
      expect(tableResult).toBeDefined();
      expect(tableResult.mustFailed).toBe(0);
    });

    it('should include golden-template topic in explain command', () => {
      const result = execSync(
        'node dist/index.js explain --topic golden-template --json',
        { encoding: 'utf-8' }
      );

      const output = JSON.parse(result);
      expect(output.title).toBe('Golden Template');
      expect(output.summary).toBeDefined();
      expect(output.details).toBeDefined();
      
      const allContent = output.summary + output.details.join(' ');
      expect(allContent).toContain('golden');
      expect(allContent).toContain('template');
      expect(allContent).toContain('templates/golden.todo.mock.json');
    });
  });

  describe('Feature: scaffold new command (LUMA-17)', () => {
    it('should show available scaffold patterns in error message when pattern is unknown', () => {
      const outputPath = join(TEST_OUTPUT_DIR, 'test-pattern-list.json');
      
      try {
        execSync(
          `node dist/index.js scaffold new --pattern invalid-pattern --out ${outputPath}`,
          { encoding: 'utf-8', stdio: 'pipe' }
        );
        // Should not reach here
        expect(false).toBe(true);
      } catch (error: any) {
        const stderr = error.stderr?.toString() || '';
        
        // Should list available patterns in error
        expect(stderr).toContain('Available patterns:');
        expect(stderr).toContain('todo-list');
        expect(stderr).toContain('empty-screen');
      }
    });

    describe('Pattern: todo-list', () => {
      const outputPath = join(TEST_OUTPUT_DIR, 'test-todo-list.json');

      it('should generate todo-list scaffold', () => {
        execSync(
          `node dist/index.js scaffold new --pattern todo-list --out ${outputPath}`,
          { encoding: 'utf-8' }
        );

        expect(existsSync(outputPath)).toBe(true);
      });

      it('should generate valid JSON', () => {
        const content = readFileSync(outputPath, 'utf-8');
        const scaffold = JSON.parse(content);
        
        expect(scaffold.schemaVersion).toBe('1.0.0');
        expect(scaffold.screen).toBeDefined();
        expect(scaffold.screen.id).toBe('todo-list');
        expect(scaffold.screen.title).toBe('Todos');
        expect(scaffold.screen.root).toBeDefined();
        expect(scaffold.settings).toBeDefined();
      });

      it('should include expected nodes', () => {
        const content = readFileSync(outputPath, 'utf-8');
        const scaffold = JSON.parse(content);
        
        const root = scaffold.screen.root;
        expect(root.type).toBe('Stack');
        expect(root.direction).toBe('vertical');
        expect(root.children).toBeDefined();
        expect(Array.isArray(root.children)).toBe(true);
        expect(root.children.length).toBeGreaterThan(0);
        
        // Should have title, toolbar, and table
        const ids = getAllNodeIds(root);
        expect(ids).toContain('title');
        expect(ids).toContain('toolbar');
        expect(ids).toContain('add-task-button');
        expect(ids).toContain('todo-table');
      });

      it('should pass ingest validation', () => {
        const result = execSync(
          `node dist/index.js ingest ${outputPath} --json`,
          { encoding: 'utf-8' }
        );

        const output = JSON.parse(result);
        expect(output.valid).toBe(true);
        expect(output.issues).toHaveLength(0);
      });

      it('should pass full pipeline (ingest → layout → keyboard → flow)', { timeout: 10000 }, () => {
        // Ingest
        execSync(`node dist/index.js ingest ${outputPath}`, { encoding: 'utf-8' });
        let runFolder = getMostRecentRunFolder();
        expect(existsSync(join(runFolder, 'ingest.json'))).toBe(true);

        // Layout
        execSync(`node dist/index.js layout ${outputPath} --viewports 768x1024`, { encoding: 'utf-8' });
        runFolder = getMostRecentRunFolder();
        expect(existsSync(join(runFolder, 'layout_768x1024.json'))).toBe(true);

        // Keyboard
        execSync(`node dist/index.js keyboard ${outputPath}`, { encoding: 'utf-8' });
        runFolder = getMostRecentRunFolder();
        expect(existsSync(join(runFolder, 'keyboard.json'))).toBe(true);

        // Flow (table pattern)
        execSync(`node dist/index.js flow ${outputPath} --patterns table`, { encoding: 'utf-8' });
        runFolder = getMostRecentRunFolder();
        expect(existsSync(join(runFolder, 'flow.json'))).toBe(true);

        const flowData = JSON.parse(readFileSync(join(runFolder, 'flow.json'), 'utf-8'));
        const tableResult = flowData.patterns.find((r: any) => r.pattern === 'Table.Simple');
        expect(tableResult).toBeDefined();
        expect(tableResult.mustFailed).toBe(0);
      });

      it('should support custom title option', () => {
        const customPath = join(TEST_OUTPUT_DIR, 'test-custom-title.json');
        execSync(
          `node dist/index.js scaffold new --pattern todo-list --out ${customPath} --title "My Tasks" --force`,
          { encoding: 'utf-8' }
        );

        const scaffold = JSON.parse(readFileSync(customPath, 'utf-8'));
        expect(scaffold.screen.title).toBe('My Tasks');
        
        // Title text node should also be updated
        const titleNode = scaffold.screen.root.children.find((c: any) => c.id === 'title');
        expect(titleNode.text).toBe('My Tasks');
      });

      it('should support custom screen-id option', () => {
        const customPath = join(TEST_OUTPUT_DIR, 'test-custom-id.json');
        execSync(
          `node dist/index.js scaffold new --pattern todo-list --out ${customPath} --screen-id my-todos --force`,
          { encoding: 'utf-8' }
        );

        const scaffold = JSON.parse(readFileSync(customPath, 'utf-8'));
        expect(scaffold.screen.id).toBe('my-todos');
      });

      it('should support custom breakpoints option', () => {
        const customPath = join(TEST_OUTPUT_DIR, 'test-custom-breakpoints.json');
        execSync(
          `node dist/index.js scaffold new --pattern todo-list --out ${customPath} --breakpoints "480x800,1920x1080" --force`,
          { encoding: 'utf-8' }
        );

        const scaffold = JSON.parse(readFileSync(customPath, 'utf-8'));
        expect(scaffold.settings.breakpoints).toEqual(['480x800', '1920x1080']);
      });
    });

    describe('Pattern: empty-screen', () => {
      const outputPath = join(TEST_OUTPUT_DIR, 'test-empty-screen.json');

      it('should generate empty-screen scaffold', () => {
        execSync(
          `node dist/index.js scaffold new --pattern empty-screen --out ${outputPath}`,
          { encoding: 'utf-8' }
        );

        expect(existsSync(outputPath)).toBe(true);
      });

      it('should generate minimal valid scaffold', () => {
        const content = readFileSync(outputPath, 'utf-8');
        const scaffold = JSON.parse(content);
        
        expect(scaffold.schemaVersion).toBe('1.0.0');
        expect(scaffold.screen.id).toBe('empty-screen');
        expect(scaffold.screen.title).toBe('Empty Screen');
        
        const root = scaffold.screen.root;
        expect(root.type).toBe('Stack');
        expect(root.direction).toBe('vertical');
        expect(root.children).toBeDefined();
        
        // Should have minimal structure (just title)
        const ids = getAllNodeIds(root);
        expect(ids).toContain('title');
      });

      it('should pass ingest validation', () => {
        const result = execSync(
          `node dist/index.js ingest ${outputPath} --json`,
          { encoding: 'utf-8' }
        );

        const output = JSON.parse(result);
        expect(output.valid).toBe(true);
        expect(output.issues).toHaveLength(0);
      });

      it('should pass layout analysis', () => {
        execSync(
          `node dist/index.js layout ${outputPath} --viewports 320x640`,
          { encoding: 'utf-8' }
        );

        const runFolder = getMostRecentRunFolder();
        const layoutPath = join(runFolder, 'layout_320x640.json');
        expect(existsSync(layoutPath)).toBe(true);

        const layoutData = JSON.parse(readFileSync(layoutPath, 'utf-8'));
        expect(layoutData.frames).toBeDefined();
        
        // Should have no blocking issues
        const errors = layoutData.issues.filter((i: any) => i.severity === 'error');
        expect(errors.length).toBe(0);
      });
    });

    describe('Error Handling', () => {
      it('should reject unknown pattern', () => {
        const outputPath = join(TEST_OUTPUT_DIR, 'test-unknown.json');
        
        try {
          execSync(
            `node dist/index.js scaffold new --pattern unknown-pattern --out ${outputPath}`,
            { encoding: 'utf-8', stdio: 'pipe' }
          );
          // Should not reach here
          expect(false).toBe(true);
        } catch (error: any) {
          expect(error.status).toBe(3); // EXIT_BLOCKING_ISSUES
        }
      });

      it('should reject overwrite without --force flag', () => {
        const outputPath = join(TEST_OUTPUT_DIR, 'test-no-force.json');
        
        // Create file first
        execSync(
          `node dist/index.js scaffold new --pattern empty-screen --out ${outputPath}`,
          { encoding: 'utf-8' }
        );
        
        // Try to overwrite without --force
        try {
          execSync(
            `node dist/index.js scaffold new --pattern empty-screen --out ${outputPath}`,
            { encoding: 'utf-8', stdio: 'pipe' }
          );
          // Should not reach here
          expect(false).toBe(true);
        } catch (error: any) {
          expect(error.status).toBe(4); // EXIT_INTERNAL_ERROR
        }
      });

      it('should allow overwrite with --force flag', () => {
        const outputPath = join(TEST_OUTPUT_DIR, 'test-force.json');
        
        // Create file first
        execSync(
          `node dist/index.js scaffold new --pattern empty-screen --out ${outputPath}`,
          { encoding: 'utf-8' }
        );
        
        // Overwrite with --force
        execSync(
          `node dist/index.js scaffold new --pattern todo-list --out ${outputPath} --force`,
          { encoding: 'utf-8' }
        );
        
        const scaffold = JSON.parse(readFileSync(outputPath, 'utf-8'));
        expect(scaffold.screen.id).toBe('todo-list'); // Should be todo-list now
      });
    });
  });

  describe('Integration: Phase 1 Complete Workflow', () => {
    it('should demonstrate agent workflow: explain → scaffold new → validate', { timeout: 15000 }, () => {
      // Step 1: Agent reads scaffold contract
      const contractResult = execSync(
        'node dist/index.js explain --topic scaffold-contract --json',
        { encoding: 'utf-8' }
      );
      const contract = JSON.parse(contractResult);
      expect(contract.title).toBe('Scaffold Contract');
      expect(contract.summary).toBeDefined();
      expect(contract.details).toBeDefined();

      // Step 2: Agent generates scaffold from pattern
      const scaffoldPath = join(TEST_OUTPUT_DIR, 'agent-workflow.json');
      execSync(
        `node dist/index.js scaffold new --pattern todo-list --out ${scaffoldPath} --title "Agent Tasks"`,
        { encoding: 'utf-8' }
      );

      // Step 3: Agent validates with LUMA
      const ingestResult = execSync(
        `node dist/index.js ingest ${scaffoldPath} --json`,
        { encoding: 'utf-8' }
      );
      const ingest = JSON.parse(ingestResult);
      expect(ingest.valid).toBe(true);

      // Step 4: Agent runs full analysis
      execSync(`node dist/index.js layout ${scaffoldPath} --viewports 768x1024`, { encoding: 'utf-8' });
      execSync(`node dist/index.js keyboard ${scaffoldPath}`, { encoding: 'utf-8' });
      execSync(`node dist/index.js flow ${scaffoldPath} --patterns table`, { encoding: 'utf-8' });
      
      const runFolder = getMostRecentRunFolder();
      execSync(`node dist/index.js score ${runFolder}`, { encoding: 'utf-8' });

      const scorePath = join(runFolder, 'score.json');
      const score = JSON.parse(readFileSync(scorePath, 'utf-8'));
      expect(score.pass).toBe(true);
      expect(score.overall).toBeGreaterThanOrEqual(85);
    });
  });
});

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
