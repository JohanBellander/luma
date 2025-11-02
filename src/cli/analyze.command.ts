/**
 * Analyze command (LUMA-129)
 * Runs ingest -> layout -> keyboard -> flow -> score in a single run folder.
 * Adds scoring aggregation inline (unlike validate which stops before score).
 *
 * Usage:
 *   luma analyze <scaffold.json> [--patterns P1,P2|auto] [--viewports 320x640,768x1024]
 *   luma analyze <scaffold.json> --patterns auto   # treat as omission; auto-select high confidence
 *   luma analyze <scaffold.json> --no-auto         # disable implicit pattern selection
 *   luma analyze <scaffold.json> --json            # machine readable output
 *
 * Exit Codes (align with validate):
 *   0 success (no blocking issues, no MUST failures, passes score criteria)
 *   3 blocking issues (invalid ingest, layout critical/error, keyboard critical/error, pattern MUST failures, score fail)
 *   2 invalid input (bad args, unknown patterns, JSON errors, viewport parse errors)
 *   4 internal error (unexpected exceptions)
 */
import { Command } from 'commander';
import { readFileSync, writeFileSync } from 'node:fs';
import { ingest } from '../core/ingest/ingest.js';
import { enhanceIssues, type ErrorEnhancementOptions } from '../core/ingest/error-enhancer.js';
import { computeLayout } from '../core/layout/layout.js';
import { analyzeKeyboardFlow } from '../core/keyboard/keyboard.js';
import { validatePatterns } from '../core/patterns/validator.js';
import { getPattern } from '../core/patterns/pattern-registry.js';
import { suggestPatterns, HIGH_CONFIDENCE_THRESHOLD } from '../core/patterns/suggestions.js';
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
import { DEFAULT_WEIGHTS, DEFAULT_CRITERIA } from '../core/scoring/types.js';
import {
  scorePatternFidelity,
  scoreFlowReachability,
  scoreHierarchyGrouping,
  scoreResponsiveBehavior,
} from '../core/scoring/categories.js';
import { createScoreOutput } from '../core/scoring/aggregate.js';
import type { CategoryScores } from '../core/scoring/types.js';

interface AnalyzeJSONOutput {
  runFolder: string;
  stages: {
    ingest: { valid: boolean; issues: any[] };
    layout: { viewports: string[]; issues: Record<string, any[]> };
    keyboard: { sequenceLength: number; unreachable: string[]; issues: any[] };
    flow: { patterns: string[]; autoSelected?: Array<{ pattern: string; confidenceScore: number; reason: string }>; mustFailures: number; shouldWarnings: number; hasMustFailures: boolean };
    score: { overall: number; pass: boolean; category: { patternFidelity: number; flowReachability: number; hierarchyGrouping: number; responsiveBehavior: number }; failReasons: string[] };
  };
}

export function createAnalyzeCommand(): Command {
  const command = new Command('analyze');

  command
    .description('Run full analysis pipeline (ingest, layout, keyboard, flow, score)')
    .argument('<file>', 'Path to scaffold JSON file')
    .option('--patterns <list>', 'Comma-separated patterns or "auto" token (treats as omission)')
    .option('--no-auto', 'Disable implicit high-confidence pattern selection')
    .option('--viewports <list>', 'Comma-separated viewports (default: 320x640,768x1024)', '320x640,768x1024')
    .option('--json', 'Output machine-readable JSON summary')
    .option('--all-issues', 'Show all ingest validation issues (console mode)')
    .option('--verbose', 'Verbose console output per stage')
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
        // Parse scaffold JSON
        let raw: any;
        try {
          raw = JSON.parse(readFileSync(file, 'utf-8'));
        } catch (e: any) {
          if (!options.json) console.error('[ERROR] Invalid JSON file');
          process.exit(EXIT_INVALID_INPUT);
        }

        // Ingest stage
        const ingestResult = ingest(raw);
        const ingestEnhancement: ErrorEnhancementOptions = {
          allIssues: options.allIssues || false,
          noSuggest: true,
          format: 'concise'
        };
        const enhancedIngestIssues = enhanceIssues(ingestResult.issues, ingestEnhancement, file, ingestResult.rawData);
        if (!ingestResult.valid) {
          // Early termination; no run folder creation
          if (options.json) {
            const out: AnalyzeJSONOutput = {
              runFolder: '<none>',
              stages: {
                ingest: { valid: false, issues: enhancedIngestIssues },
                layout: { viewports: [], issues: {} },
                keyboard: { sequenceLength: 0, unreachable: [], issues: [] },
                flow: { patterns: [], mustFailures: 0, shouldWarnings: 0, hasMustFailures: false },
                score: { overall: 0, pass: false, category: { patternFidelity: 0, flowReachability: 0, hierarchyGrouping: 0, responsiveBehavior: 0 }, failReasons: ['INGEST_INVALID'] }
              }
            };
            console.log(JSON.stringify(out, null, 2));
          } else {
            console.log('Ingest FAILED');
            console.log(`Issues: ${enhancedIngestIssues.length}`);
            for (const issue of enhancedIngestIssues) console.log(` - ${issue.id}: ${issue.message}`);
          }
          const hasVersionIssue = ingestResult.issues.some(i => i.id === 'unsupported-schema-version' || i.id === 'missing-schema-version');
          process.exit(hasVersionIssue ? EXIT_VERSION_MISMATCH : EXIT_BLOCKING_ISSUES);
        }
        const scaffold = ingestResult.normalized as Scaffold;

        // Select run folder (after ingest success)
        let runFolder: string;
        try {
          runFolder = selectRunFolder({ explicitPath: options.runFolder, runId: options.runId });
        } catch (e: any) {
          if (!options.json) console.error('[ERROR]', e.message);
          process.exit(EXIT_INVALID_INPUT);
        }

        // Persist ingest artifact
        const ingestPath = getRunFilePath(runFolder, 'ingest.json');
        writeFileSync(ingestPath, JSON.stringify({ ...ingestResult, issues: enhancedIngestIssues }, null, 2));
        if (!options.json) console.log(`Ingest PASSED → ${ingestPath}`);

        // Parse viewports
        const viewportTokens = options.viewports.split(',').map(v => v.trim()).filter(Boolean);
        const parsedViewports: { width: number; height: number; token: string }[] = [];
        for (const token of viewportTokens) {
          try {
            const vp = parseViewport(token);
            parsedViewports.push({ width: vp.width, height: vp.height, token });
          } catch (e: any) {
            if (!options.json) console.error(`[ERROR] Invalid viewport '${token}' (${e.message})`);
            process.exit(EXIT_INVALID_INPUT);
          }
        }

        // Layout stage
        const layoutIssuesAggregated: Record<string, any[]> = {};
        let blockingLayout = false;
        for (const vp of parsedViewports) {
          const layoutOutput = computeLayout(scaffold, { width: vp.width, height: vp.height });
          layoutIssuesAggregated[vp.token] = layoutOutput.issues;
          const layoutPath = getRunFilePath(runFolder, `layout_${vp.width}x${vp.height}.json`);
          writeFileSync(layoutPath, JSON.stringify(layoutOutput, null, 2));
          if (!options.json) console.log(`Layout ${vp.token} → ${layoutPath} (issues: ${layoutOutput.issues.length})`);
          if (layoutOutput.issues.some(i => i.severity === 'error' || i.severity === 'critical')) blockingLayout = true;
        }

        // Keyboard stage
        const keyboardOutput = analyzeKeyboardFlow(scaffold);
        const keyboardPath = getRunFilePath(runFolder, 'keyboard.json');
        writeFileSync(keyboardPath, JSON.stringify(keyboardOutput, null, 2));
        if (!options.json) console.log(`Keyboard → ${keyboardPath} (tab sequence: ${keyboardOutput.sequence.length}, unreachable: ${keyboardOutput.unreachable.length})`);
        const blockingKeyboard = keyboardOutput.issues.some(i => i.severity === 'error' || i.severity === 'critical');

        // Flow stage (patterns)
        const patterns: Pattern[] = [];
        let explicitPatternNames: string[] = [];
        if (options.patterns) {
          explicitPatternNames = options.patterns.split(',').map(p => p.trim()).filter(Boolean);
          if (explicitPatternNames.length === 1 && explicitPatternNames[0].toLowerCase() === 'auto') explicitPatternNames = [];
          explicitPatternNames = explicitPatternNames.filter(n => n.toLowerCase() !== 'auto');
          for (const name of explicitPatternNames) {
            const p = getPattern(name);
            if (!p) {
              if (!options.json) console.error(`[ERROR] Unknown pattern '${name}'`);
              process.exit(EXIT_INVALID_INPUT);
            }
            patterns.push(p);
          }
        }
        let autoSelected: Array<{ pattern: string; confidenceScore: number; reason: string }> = [];
        if (explicitPatternNames.length === 0 && options.noAuto !== true) {
          autoSelected = suggestPatterns(scaffold.screen.root)
            .filter(s => s.confidenceScore >= HIGH_CONFIDENCE_THRESHOLD)
            .map(s => ({ pattern: s.pattern, confidenceScore: s.confidenceScore, reason: s.reason }));
          for (const sel of autoSelected) {
            const p = getPattern(sel.pattern);
            if (p && !patterns.some(existing => existing.name === p.name)) patterns.push(p);
          }
        }
        const flowOutput = validatePatterns(patterns, scaffold.screen.root);
        const flowPath = getRunFilePath(runFolder, 'flow.json');
        writeFileSync(flowPath, JSON.stringify(flowOutput, null, 2));
        if (!options.json) {
          console.log(`Flow → ${flowPath} (patterns: ${patterns.map(p => p.name).join(', ') || 'none'})`);
          if (autoSelected.length > 0) console.log(`Auto-selected patterns: ${autoSelected.map(a => `${a.pattern}(${a.confidenceScore})`).join(', ')}`);
        }
        const mustFailuresCount = flowOutput.patterns.reduce((acc, p) => acc + p.mustFailed, 0);
        const shouldWarningsCount = flowOutput.patterns.reduce((acc, p) => acc + p.shouldFailed, 0);
        const hasMustFailures = flowOutput.hasMustFailures;

        // Scoring stage (reads artifacts we just wrote)
        const weights = DEFAULT_WEIGHTS; // could be extended with flag later
        // Layout issues aggregated already; flatten to array for scoring responsive/hierarchy categories
        const allLayoutIssues = Object.values(layoutIssuesAggregated).flat();
        const categories: CategoryScores = {
          patternFidelity: scorePatternFidelity(flowOutput.patterns),
          flowReachability: scoreFlowReachability(keyboardOutput),
          hierarchyGrouping: scoreHierarchyGrouping(keyboardOutput.issues, allLayoutIssues),
          responsiveBehavior: scoreResponsiveBehavior(allLayoutIssues),
        };
        const scoreOutput = createScoreOutput(
          categories,
          weights,
          flowOutput.patterns,
          keyboardOutput.unreachable?.length ?? 0,
          DEFAULT_CRITERIA
        );
        const scorePath = getRunFilePath(runFolder, 'score.json');
        writeFileSync(scorePath, JSON.stringify(scoreOutput, null, 2));
        if (!options.json) console.log(`Score → ${scorePath} (overall: ${scoreOutput.overall.toFixed(1)} ${scoreOutput.pass ? 'PASS' : 'FAIL'})`);

        // Determine blocking state (any earlier blocking OR score fail)
        const blocking = blockingLayout || blockingKeyboard || hasMustFailures || !scoreOutput.pass;

        if (options.json) {
          const out: AnalyzeJSONOutput = {
            runFolder,
            stages: {
              ingest: { valid: true, issues: enhancedIngestIssues },
              layout: { viewports: parsedViewports.map(v => v.token), issues: layoutIssuesAggregated },
              keyboard: { sequenceLength: keyboardOutput.sequence.length, unreachable: keyboardOutput.unreachable, issues: keyboardOutput.issues },
              flow: { patterns: patterns.map(p => p.name), autoSelected: autoSelected.length ? autoSelected : undefined, mustFailures: mustFailuresCount, shouldWarnings: shouldWarningsCount, hasMustFailures },
              score: { overall: scoreOutput.overall, pass: scoreOutput.pass, category: {
                patternFidelity: categories.patternFidelity,
                flowReachability: categories.flowReachability,
                hierarchyGrouping: categories.hierarchyGrouping,
                responsiveBehavior: categories.responsiveBehavior,
              }, failReasons: scoreOutput.failReasons }
            }
          };
          console.log(JSON.stringify(out, null, 2));
        } else {
          console.log('\nSummary:');
          console.log(` Run Folder: ${runFolder}`);
          console.log(` Ingest: PASS`);
          console.log(` Layout Blocking Issues: ${blockingLayout ? 'YES' : 'NO'}`);
          console.log(` Keyboard Blocking Issues: ${blockingKeyboard ? 'YES' : 'NO'}`);
          console.log(` Patterns: ${patterns.map(p => p.name).join(', ') || 'none'}${autoSelected.length ? ` (auto: ${autoSelected.map(a=>a.pattern).join(', ')})` : ''}`);
          console.log(` MUST Failures: ${mustFailuresCount}`);
          console.log(` SHOULD Warnings: ${shouldWarningsCount}`);
          console.log(` Score Overall: ${scoreOutput.overall.toFixed(1)} (${scoreOutput.pass ? 'PASS' : 'FAIL'})`);
          if (!scoreOutput.pass && scoreOutput.failReasons.length) {
            console.log(' Fail Reasons:');
            for (const reason of scoreOutput.failReasons) console.log(`  - ${reason}`);
          }
        }

        process.exit(blocking ? EXIT_BLOCKING_ISSUES : EXIT_SUCCESS);
      } catch (e) {
        logger.error('Unexpected error in analyze pipeline', e);
        if (options.json) {
          console.error(JSON.stringify({ error: 'INTERNAL_ERROR', message: (e as any)?.message }, null, 2));
        }
        process.exit(EXIT_INTERNAL_ERROR);
      }
    });

  return command;
}
