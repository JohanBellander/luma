import { Command } from 'commander';
import { readFileSync, statSync, watch as fsWatch, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ingest } from '../core/ingest/ingest.js';
import { enhanceIssues, type ErrorEnhancementOptions } from '../core/ingest/error-enhancer.js';
import { analyzeKeyboardFlow } from '../core/keyboard/keyboard.js';
import { computeLayout } from '../core/layout/layout.js';
import { validatePatterns } from '../core/patterns/validator.js';
import { suggestPatterns, HIGH_CONFIDENCE_THRESHOLD } from '../core/patterns/suggestions.js';
import { getPattern } from '../core/patterns/pattern-registry.js';
import type { Pattern } from '../core/patterns/types.js';
import type { Scaffold } from '../types/scaffold.js';
import { parseViewport } from '../types/viewport.js';
import { getRunFilePath, selectRunFolder } from '../utils/run-folder.js';
import { logger } from '../utils/logger.js';
import { EXIT_INVALID_INPUT, EXIT_SUCCESS } from '../utils/exit-codes.js';

/**
 * Watch command (LUMA-132)
 * Prototype: monitors a single scaffold JSON file for changes and re-runs a lightweight pipeline.
 * By default runs: ingest -> layout -> keyboard -> flow
 * Optionally includes score when --score flag provided (slower).
 * Prints delta summary vs previous successful run.
 */
export function createWatchCommand(): Command {
  const command = new Command('watch');

  command
    .description('Watch a scaffold file and auto re-run analysis on change (prototype)')
    .argument('<file>', 'Path to scaffold JSON file to watch')
    .option('--patterns <list>', 'Comma-separated pattern list, or omit for auto (high confidence)')
    .option('--no-auto', 'Disable auto pattern selection when --patterns omitted')
    .option('--viewports <list>', 'Comma-separated viewports (default: 320x640,768x1024)', '320x640,768x1024')
    .option('--debounce <ms>', 'Debounce interval in milliseconds', (v) => parseInt(v, 10), 500)
    .option('--score', 'Include scoring stage on each run (slower)')
    .option('--json', 'Emit JSON event objects per run (newline-delimited)')
    .option('--run-folder <path>', 'Explicit run folder base path (reused for artifacts)')
    .option('--run-id <id>', 'Explicit run folder id (.ui/runs/<id>)')
    .option('--once', 'Run a single analysis then exit (useful for scripting)')
    .action(async (file: string, opts: { patterns?: string; noAuto?: boolean; viewports: string; debounce: number; score?: boolean; json?: boolean; runFolder?: string; runId?: string; once?: boolean }) => {
      let targetPath = resolve(file);
      try {
        statSync(targetPath);
      } catch {
        logger.error(`File not found: ${targetPath}`);
        process.exit(EXIT_INVALID_INPUT);
      }

      // Prepare run folder (will be reused; watch does not create a new timestamp each time)
      let runFolder: string;
      try {
        runFolder = selectRunFolder({ explicitPath: opts.runFolder, runId: opts.runId });
      } catch (e: any) {
        logger.error(e.message);
        process.exit(EXIT_INVALID_INPUT);
      }

      logger.info(`Watching: ${targetPath}`);
      logger.info(`Run folder: ${runFolder}`);
      logger.info(`Viewports: ${opts.viewports}`);
      if (opts.score) logger.info('Score: enabled');

      // Parsed viewports upfront
      const viewportTokens = opts.viewports.split(',').map(v => v.trim()).filter(Boolean);
      let parsedViewports: { width: number; height: number; token: string }[] = [];
      try {
        parsedViewports = viewportTokens.map(t => {
          const vp = parseViewport(t);
            return { width: vp.width, height: vp.height, token: t };
        });
      } catch (e: any) {
        logger.error(`Invalid viewport list: ${e.message}`);
        process.exit(EXIT_INVALID_INPUT);
      }

      let timer: NodeJS.Timeout | undefined;
      let lastResult: any | null = null;

      async function runPipeline(reason: string) {
        clearTimeout(timer as any);
        timer = undefined;
        let raw: any;
        try {
          raw = JSON.parse(readFileSync(targetPath, 'utf-8'));
        } catch (e: any) {
          logger.error(`JSON parse failed: ${e.message}`);
          return;
        }

        // Ingest
        const ingestResult = ingest(raw);
        const ingestEnhancement: ErrorEnhancementOptions = { allIssues: false, noSuggest: true, format: 'concise' };
        const enhancedIngestIssues = enhanceIssues(_ingestResultSafeIssues(ingestResult.issues), ingestEnhancement, targetPath, ingestResult.rawData);
        if (!ingestResult.valid) {
          outputRun({ stage: 'ingest', valid: false, issues: enhancedIngestIssues, reason });
          return;
        }
        const scaffold = ingestResult.normalized as Scaffold;

        // Layout
        const layoutIssuesAggregated: Record<string, any[]> = {};
        for (const vp of parsedViewports) {
          const layoutOut = computeLayout(scaffold, { width: vp.width, height: vp.height });
          layoutIssuesAggregated[vp.token] = layoutOut.issues;
          const layoutPath = getRunFilePath(runFolder, `layout_${vp.width}x${vp.height}.json`);
          // Overwrite artifact each run (prototype behavior)
          writeFileSync(layoutPath, JSON.stringify(layoutOut, null, 2));
        }

        // Keyboard
        const keyboardOut = analyzeKeyboardFlow(scaffold);
        const keyboardPath = getRunFilePath(runFolder, 'keyboard.json');
        writeFileSync(keyboardPath, JSON.stringify(keyboardOut, null, 2));

        // Patterns
        const patterns: Pattern[] = [];
        let explicitPatternNames: string[] = [];
        if (opts.patterns) {
          explicitPatternNames = opts.patterns.split(',').map(p => p.trim()).filter(Boolean);
          if (explicitPatternNames.length === 1 && explicitPatternNames[0].toLowerCase() === 'auto') explicitPatternNames = [];
          explicitPatternNames = explicitPatternNames.filter(n => n.toLowerCase() !== 'auto');
          for (const name of explicitPatternNames) {
            const pat = getPattern(name);
            if (!pat) {
              logger.error(`Unknown pattern: ${name}`);
              outputRun({ stage: 'flow', error: 'UNKNOWN_PATTERN', pattern: name });
              return;
            }
            patterns.push(pat);
          }
        }
        let autoSelected: Array<{ pattern: string; confidenceScore: number; reason: string }> = [];
        if (explicitPatternNames.length === 0 && opts.noAuto !== true) {
          autoSelected = suggestPatterns(scaffold.screen.root)
            .filter(s => s.confidenceScore >= HIGH_CONFIDENCE_THRESHOLD)
            .map(s => ({ pattern: s.pattern, confidenceScore: s.confidenceScore, reason: s.reason }));
          for (const sel of autoSelected) {
            const p = getPattern(sel.pattern);
            if (p && !patterns.some(ex => ex.name === p.name)) patterns.push(p);
          }
        }
        const flowOut = validatePatterns(patterns, scaffold.screen.root);
        const flowPath = getRunFilePath(runFolder, 'flow.json');
        writeFileSync(flowPath, JSON.stringify(flowOut, null, 2));

        // Optional score
        let scoreOut: any = undefined;
        if (opts.score) {
          // Minimal inline scoring uses keyboard + patterns only (layout scoring TBD)
          const unreachableCount = keyboardOut.unreachable.length;
          const mustFailedTotal = flowOut.patterns.reduce((a, p) => a + p.mustFailed, 0);
          scoreOut = {
            stub: true,
            overall: flowOut.hasMustFailures || unreachableCount > 0 ? 60 : 95,
            unreachable: unreachableCount,
            mustFailures: mustFailedTotal,
            pass: !flowOut.hasMustFailures && unreachableCount === 0
          };
        }

        const current = {
          reason,
          ingest: { valid: true, issues: enhancedIngestIssues },
          layout: layoutIssuesAggregated,
          keyboard: keyboardOut,
          flow: { patterns: patterns.map(p => p.name), autoSelected, hasMustFailures: flowOut.hasMustFailures },
          score: scoreOut,
          runFolder,
          timestamp: new Date().toISOString()
        };

        // Delta summary
        const delta = lastResult ? computeDelta(lastResult, current) : undefined;
        lastResult = current;
        outputRun(current, delta);
      }

      function outputRun(current: any, delta?: any) {
        if (opts.json) {
          const payload = { event: 'run', current, ...(delta ? { delta } : {}) };
          console.log(JSON.stringify(payload));
          return;
        }
        logger.info(`\n[watch] Run @ ${current.timestamp} (${current.reason})`);
        if (delta) {
          logger.info('Changes since last run:');
          if (delta.ingestIssuesChanged) logger.info(` ingest issues changed: ${delta.ingestIssuesChanged}`);
          if (delta.layoutIssueDelta.totalChanged > 0) logger.info(` layout issue delta: +${delta.layoutIssueDelta.added} -${delta.layoutIssueDelta.resolved}`);
          if (delta.keyboard.unreachableDelta !== 0) logger.info(` unreachable count delta: ${delta.keyboard.unreachableDelta}`);
          if (delta.flow.mustFailureDelta !== 0) logger.info(` must failures delta: ${delta.flow.mustFailureDelta}`);
          if (delta.flow.patternSetChanged) logger.info(` patterns changed: ${delta.flow.patternSetChanged}`);
          if (delta.score && delta.score.overallDelta !== 0) logger.info(` score overall delta: ${delta.score.overallDelta.toFixed(1)}`);
        } else {
          logger.info('Initial run (no delta).');
        }
        logger.info(` Patterns: ${current.flow.patterns.join(', ') || 'none'}${current.flow.autoSelected.length ? ' (auto: ' + current.flow.autoSelected.map((a:any)=>a.pattern).join(', ') + ')' : ''}`);
        logger.info(` MUST Failures: ${current.flow.hasMustFailures ? 'YES' : 'NO'}`);
        if (current.score) logger.info(` Score (stub): ${current.score.overall} (${current.score.pass ? 'PASS' : 'FAIL'})`);
      }

      function computeDelta(prev: any, next: any) {
        const ingestIssuesChanged = prev.ingest.issues.length !== next.ingest.issues.length;
        const layoutIssueDelta = { added: 0, resolved: 0, totalChanged: 0 };
        const prevIssues = Object.values(prev.layout).flat();
        const nextIssues = Object.values(next.layout).flat();
        const prevIds = new Set(prevIssues.map((i: any) => i.id + ':' + i.message));
        const nextIds = new Set(nextIssues.map((i: any) => i.id + ':' + i.message));
        for (const id of nextIds) if (!prevIds.has(id)) layoutIssueDelta.added++;
        for (const id of prevIds) if (!nextIds.has(id)) layoutIssueDelta.resolved++;
        layoutIssueDelta.totalChanged = layoutIssueDelta.added + layoutIssueDelta.resolved;
        const keyboard = { unreachableDelta: next.keyboard.unreachable.length - prev.keyboard.unreachable.length };
        const flow = {
          mustFailureDelta: (next.flow.hasMustFailures ? 1 : 0) - (prev.flow.hasMustFailures ? 1 : 0),
          patternSetChanged: JSON.stringify(prev.flow.patterns) !== JSON.stringify(next.flow.patterns)
        };
        const score = next.score && prev.score ? { overallDelta: next.score.overall - prev.score.overall } : undefined;
        return { ingestIssuesChanged, layoutIssueDelta, keyboard, flow, score };
      }

      function _ingestResultSafeIssues(issues: any[]) { return issues || []; }

      // Initial run
      await runPipeline('startup');
      if (opts.once) {
        process.exit(EXIT_SUCCESS);
      }

      const watcher = fsWatch(targetPath, { persistent: true });
      watcher.on('change', () => {
        if (timer) return; // already scheduled
        timer = setTimeout(() => runPipeline('file-change'), opts.debounce);
      });

      // Keep process alive
    });

  return command;
}
