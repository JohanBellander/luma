/**
 * Validate pipeline command (LUMA-101)
 * Runs ingest -> layout -> keyboard -> flow in a single run folder.
 *
 * Usage:
 *   luma validate <scaffold.json> [--patterns P1,P2] [--viewports 320x640,768x1024] [--no-auto]
 *   luma validate <scaffold.json> --json  (machine readable summary)
 *
 * Behavior:
 * - Creates/reuses a run folder (same precedence rules as other commands)
 * - Writes artifacts: ingest.json, layout_*.json, keyboard.json, flow.json
 * - Prints concise summary and exit codes:
 *     0 success (no blocking issues, no MUST failures)
 *     3 blocking issues (ingest invalid, layout critical/error, keyboard critical/error, pattern MUST failures)
 *     2 invalid input (bad args, unknown patterns, JSON parse errors)
 *     4 internal error (unexpected exceptions)
 * - When --json is used, returns structured object with artifact statuses.
 */

import { Command } from 'commander';
import { readFileSync, writeFileSync } from 'node:fs';
import { ingest } from '../core/ingest/ingest.js';
import { enhanceIssues, type ErrorEnhancementOptions } from '../core/ingest/error-enhancer.js';
import { computeLayout } from '../core/layout/layout.js';
import { analyzeKeyboardFlow } from '../core/keyboard/keyboard.js';
import { validatePatterns } from '../core/patterns/validator.js';
import { getPattern } from '../core/patterns/pattern-registry.js';
import { suggestPatterns } from '../core/patterns/suggestions.js';
import type { Pattern } from '../core/patterns/types.js';
import type { Scaffold } from '../types/scaffold.js';
import { parseViewport } from '../types/viewport.js';
import { selectRunFolder, getRunFilePath } from '../utils/run-folder.js';
import { logger } from '../utils/logger.js';
import {
  EXIT_SUCCESS,
  EXIT_INVALID_INPUT,
  EXIT_BLOCKING_ISSUES,
  EXIT_INTERNAL_ERROR,
  EXIT_VERSION_MISMATCH,
} from '../utils/exit-codes.js';

interface ValidateJSONOutput {
  runFolder: string;
  ingest: { valid: boolean; issues: any[] };
  layout: { viewports: string[]; issues: Record<string, any[]> };
  keyboard: { sequenceLength: number; unreachable: string[]; issues: any[] };
  flow: { patterns: string[]; hasMustFailures: boolean; mustFailures: number; shouldWarnings: number };
  autoSelected?: string[];
}

export function createValidateCommand(): Command {
  const command = new Command('validate');

  command
    .description('Run full validation pipeline (ingest, layout, keyboard, flow)')
    .argument('<file>', 'Path to scaffold JSON file')
    .option('--patterns <list>', 'Comma-separated list of patterns to activate (otherwise auto-select high-confidence)')
    .option('--no-auto', 'Disable auto pattern selection when --patterns omitted')
    .option('--viewports <list>', 'Comma-separated viewports (default: 320x640,768x1024)', '320x640,768x1024')
    .option('--json', 'Output machine-readable JSON summary')
    .option('--all-issues', 'Show all ingest validation issues instead of single most-blocking (console mode)')
    .option('--verbose', 'Verbose console output for each stage')
    .option('--run-folder <path>', 'Explicit run folder path (for deterministic testing)')
    .option('--run-id <id>', 'Explicit run id (creates/uses .ui/runs/<id>)')
    .action(async (file: string, options: {
      patterns?: string;
      noAuto?: boolean;
      viewports: string;
      json?: boolean;
      allIssues?: boolean;
      verbose?: boolean;
      runFolder?: string;
      runId?: string;
    }) => {
      try {
        // Read & parse scaffold JSON
        let raw: any;
        try {
          raw = JSON.parse(readFileSync(file, 'utf-8'));
        } catch (e: any) {
          if (!options.json) console.error('Error: invalid JSON file');
          process.exit(EXIT_INVALID_INPUT);
        }

        // Ingest stage
        const ingestResult = ingest(raw);
        const ingestEnhancement: ErrorEnhancementOptions = {
          allIssues: options.allIssues || false,
          noSuggest: true, // pipeline mode focuses on status; suggestions available via standalone ingest
          format: 'concise'
        };
        const enhancedIngestIssues = enhanceIssues(ingestResult.issues, ingestEnhancement, file, ingestResult.rawData);
        if (!ingestResult.valid) {
          if (options.json) {
            const out: ValidateJSONOutput = {
              runFolder: '<none>',
              ingest: { valid: false, issues: enhancedIngestIssues },
              layout: { viewports: [], issues: {} },
              keyboard: { sequenceLength: 0, unreachable: [], issues: [] },
              flow: { patterns: [], hasMustFailures: false, mustFailures: 0, shouldWarnings: 0 },
            };
            console.log(JSON.stringify(out, null, 2));
          } else {
            console.log('Ingest FAILED');
            console.log(`Issues: ${enhancedIngestIssues.length}`);
            if (enhancedIngestIssues.length > 0) {
              console.log(enhancedIngestIssues.map(i => ` - ${i.id}: ${i.message}`).join('\n'));
            }
          }
          const hasVersionIssue = ingestResult.issues.some(i => i.id === 'unsupported-schema-version' || i.id === 'missing-schema-version');
          process.exit(hasVersionIssue ? EXIT_VERSION_MISMATCH : EXIT_BLOCKING_ISSUES);
        }
        const scaffold = ingestResult.normalized as Scaffold;

        // Select run folder (only after ingest success to avoid orphaned folders)
        let runFolder: string;
        try {
          runFolder = selectRunFolder({ explicitPath: options.runFolder, runId: options.runId });
        } catch (e: any) {
          if (!options.json) console.error('Error:', e.message);
          process.exit(EXIT_INVALID_INPUT);
        }

        // Persist ingest artifact
        const ingestPath = getRunFilePath(runFolder, 'ingest.json');
        writeFileSync(ingestPath, JSON.stringify({ ...ingestResult, issues: enhancedIngestIssues }, null, 2));

        if (!options.json) {
          console.log(`Ingest PASSED → ${ingestPath}`);
        }

        // Parse viewports
        const viewportTokens = options.viewports.split(',').map(v => v.trim()).filter(Boolean);
  const parsedViewports = [] as { width: number; height: number; token: string }[];
        for (const token of viewportTokens) {
          try {
            const vp = parseViewport(token);
            parsedViewports.push({ width: vp.width, height: vp.height, token });
          } catch (e: any) {
            if (!options.json) console.error(`Error: invalid viewport '${token}' (${e.message})`);
            process.exit(EXIT_INVALID_INPUT);
          }
        }

        // Layout stage
        const layoutIssuesAggregated: Record<string, any[]> = {};
        let blockingLayout = false;
        for (const vp of parsedViewports) {
          // computeLayout expects a Viewport (width,height). Preserve token separately for reporting.
          const layoutOutput = computeLayout(scaffold, { width: vp.width, height: vp.height });
          layoutIssuesAggregated[vp.token] = layoutOutput.issues;
          const layoutPath = getRunFilePath(runFolder, `layout_${vp.width}x${vp.height}.json`);
          writeFileSync(layoutPath, JSON.stringify(layoutOutput, null, 2));
          if (!options.json) {
            console.log(`Layout ${vp.token} → ${layoutPath} (issues: ${layoutOutput.issues.length})`);
          }
          if (layoutOutput.issues.some(i => i.severity === 'error' || i.severity === 'critical')) {
            blockingLayout = true;
          }
        }

        // Keyboard stage
        const keyboardOutput = analyzeKeyboardFlow(scaffold);
        const keyboardPath = getRunFilePath(runFolder, 'keyboard.json');
        writeFileSync(keyboardPath, JSON.stringify(keyboardOutput, null, 2));
        if (!options.json) {
          console.log(`Keyboard → ${keyboardPath} (tab sequence: ${keyboardOutput.sequence.length}, unreachable: ${keyboardOutput.unreachable.length})`);
        }
        const blockingKeyboard = keyboardOutput.issues.some(i => i.severity === 'error' || i.severity === 'critical');

        // Flow (patterns) stage
        const patterns: Pattern[] = [];
        let explicitPatternNames: string[] = [];
        if (options.patterns) {
          explicitPatternNames = options.patterns.split(',').map(p => p.trim()).filter(Boolean);
          for (const name of explicitPatternNames) {
            const p = getPattern(name);
            if (!p) {
              if (!options.json) console.error(`Error: unknown pattern '${name}'`);
              process.exit(EXIT_INVALID_INPUT);
            }
            patterns.push(p);
          }
        }
        let autoSelected: string[] = [];
        if (explicitPatternNames.length === 0 && options.noAuto !== true) {
          autoSelected = suggestPatterns(scaffold.screen.root)
            .filter(s => s.confidence === 'high')
            .map(s => s.pattern);
          for (const patName of autoSelected) {
            const p = getPattern(patName);
            if (p && !patterns.some(existing => existing.name === p.name)) patterns.push(p);
          }
        }
        const flowOutput = validatePatterns(patterns, scaffold.screen.root);
        const flowPath = getRunFilePath(runFolder, 'flow.json');
        writeFileSync(flowPath, JSON.stringify(flowOutput, null, 2));
        if (!options.json) {
          console.log(`Flow → ${flowPath} (patterns: ${patterns.map(p => p.name).join(', ') || 'none'})`);
          if (autoSelected.length > 0) console.log(`Auto-selected patterns: ${autoSelected.join(', ')}`);
        }

        // Summarize & exit
        const hasMustFailures = flowOutput.hasMustFailures;
  // Derive counts from PatternResult shape (mustFailed, shouldFailed) and issues array filtering
  const mustFailuresCount = flowOutput.patterns.reduce((acc, p) => acc + p.mustFailed, 0);
  const shouldWarningsCount = flowOutput.patterns.reduce((acc, p) => acc + p.shouldFailed, 0);

        const blocking = blockingLayout || blockingKeyboard || hasMustFailures;

        if (options.json) {
          const out: ValidateJSONOutput = {
            runFolder,
            ingest: { valid: true, issues: enhancedIngestIssues },
            layout: { viewports: parsedViewports.map(v => v.token), issues: layoutIssuesAggregated },
            keyboard: { sequenceLength: keyboardOutput.sequence.length, unreachable: keyboardOutput.unreachable, issues: keyboardOutput.issues },
            flow: { patterns: patterns.map(p => p.name), hasMustFailures, mustFailures: mustFailuresCount, shouldWarnings: shouldWarningsCount },
            ...(autoSelected.length > 0 ? { autoSelected } : {}),
          };
          console.log(JSON.stringify(out, null, 2));
        } else {
          console.log('\nSummary:');
          console.log(` Run Folder: ${runFolder}`);
          console.log(` Ingest: PASS`);
          console.log(` Layout Blocking Issues: ${blockingLayout ? 'YES' : 'NO'}`);
          console.log(` Keyboard Blocking Issues: ${blockingKeyboard ? 'YES' : 'NO'}`);
          console.log(` Patterns: ${patterns.map(p => p.name).join(', ') || 'none'}${autoSelected.length ? ` (auto: ${autoSelected.join(', ')})` : ''}`);
          console.log(` MUST Failures: ${mustFailuresCount}`);
          console.log(` SHOULD Warnings: ${shouldWarningsCount}`);
          console.log(` Overall Status: ${blocking ? 'FAIL' : 'PASS'}`);
          console.log(' Next: run "luma score ' + runFolder + '" or "luma report ' + runFolder + '"');
        }

        process.exit(blocking ? EXIT_BLOCKING_ISSUES : EXIT_SUCCESS);
      } catch (e) {
        logger.error('Unexpected error in validate pipeline', e);
        if (options.json) {
          console.error(JSON.stringify({ error: 'INTERNAL_ERROR', message: (e as any)?.message }, null, 2));
        }
        process.exit(EXIT_INTERNAL_ERROR);
      }
    });

  return command;
}
