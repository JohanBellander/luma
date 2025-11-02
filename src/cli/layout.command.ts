import { Command } from 'commander';
import { readFileSync, writeFileSync } from 'node:fs';
import { parseViewport } from '../types/viewport.js';
import type { Scaffold } from '../types/scaffold.js';
import type { LayoutOutput } from '../types/output.js';
import { computeLayout } from '../core/layout/layout.js';
import { getRunFilePath, selectRunFolder } from '../utils/run-folder.js';
import { logger } from '../utils/logger.js';
import {
  EXIT_SUCCESS,
  EXIT_INVALID_INPUT,
  EXIT_BLOCKING_ISSUES,
  EXIT_INTERNAL_ERROR,
} from '../utils/exit-codes.js';

/**
 * Create the 'layout' command.
 * 
 * Usage: luma layout <file> --viewports <list>
 * 
 * Computes layout for each viewport and writes output to run folder.
 * Exits with code 3 if blocking (error/critical) issues found.
 */
export function createLayoutCommand(): Command {
  const command = new Command('layout');

  command
    .description('Compute layout frames for viewports')
    .argument('<file>', 'Path to scaffold JSON file')
    .option('--viewports <viewports>', 'Comma-separated viewport sizes (e.g., "320x640,768x1024")', '320x640,768x1024')
    .option('--json', 'Output results as JSON to stdout')
    .option('--errors-only', 'Show only error/critical issues (suppresses warnings)')
    .option('--quick', 'Skip verbose issue listing for faster iteration')
    .option('--dry-run', 'Do not write layout_<WxH>.json artifacts (simulate only)')
	.option('--run-folder <path>', 'Explicit run folder path (for deterministic testing)')
	.option('--run-id <id>', 'Explicit run id (creates/uses .ui/runs/<id>)')
  .action(async (file: string, options: { viewports: string; json?: boolean; runFolder?: string; runId?: string; errorsOnly?: boolean; quick?: boolean; dryRun?: boolean }) => {
      try {
        // Read scaffold file
        const scaffoldText = readFileSync(file, 'utf-8');
        const scaffold = JSON.parse(scaffoldText) as Scaffold;

        // Parse viewports
        const viewportStrings = options.viewports.split(',').map(s => s.trim()).filter(s => s.length > 0);
        if (viewportStrings.length === 0) {
          logger.error('No viewports provided. Use --viewports <width>x<height>[,<width>x<height>...]');
          process.exit(EXIT_INVALID_INPUT);
        }

        let viewports;
        try {
          viewports = viewportStrings.map(v => {
            try {
              return parseViewport(v);
            } catch (e: any) {
              throw new Error(`Viewport '${v}' invalid: ${e.message}`);
            }
          });
        } catch (e: any) {
          logger.error(e.message);
          process.exit(EXIT_INVALID_INPUT);
        }

        // Select run folder
        let runFolder: string;
        try {
          runFolder = selectRunFolder({ explicitPath: options.runFolder, runId: options.runId });
        } catch (e: any) {
          logger.error(e.message);
          process.exit(EXIT_INVALID_INPUT);
        }

        // Compute layout for each viewport
        const outputs: LayoutOutput[] = [];
        let hasBlockingIssues = false;

        for (const viewport of viewports) {
          const output = computeLayout(scaffold, viewport);
          outputs.push(output);

          // Write to run folder (unless dry-run)
          const outputPath = getRunFilePath(runFolder, `layout_${viewport.width}x${viewport.height}.json`);
          if (options.dryRun) {
            logger.info(`[dry-run] Computed layout ${viewport.width}x${viewport.height} (artifact skipped)`);
          } else {
            writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
            logger.info(`Layout computed for ${viewport.width}x${viewport.height}: ${outputPath}`);
          }

          // Check for blocking issues
          const blocking = output.issues.some(i => i.severity === 'error' || i.severity === 'critical');
          if (blocking) {
            hasBlockingIssues = true;
          }
        }

        // Output results
        if (options.json) {
          const jsonOutput = {
            layouts: outputs,
            runFolder: runFolder,
            ...(options.errorsOnly ? { filteredLayouts: outputs.map(o => ({
              viewport: o.viewport,
              frames: o.frames,
              issues: o.issues.filter(i => i.severity === 'error' || i.severity === 'critical')
            })) } : {})
          };
          console.log(JSON.stringify(jsonOutput, null, 2));
        } else {
          for (const output of outputs) {
            const visibleIssues = options.errorsOnly ? output.issues.filter(i => i.severity === 'error' || i.severity === 'critical') : output.issues;
            logger.info(`Viewport ${output.viewport}: ${output.frames.length} frames, ${visibleIssues.length} issues${options.errorsOnly ? ' (errors only)' : ''}`);
            if (visibleIssues.length > 0) {
              if (options.quick) {
                logger.info('  (Issues elided due to --quick)');
              } else {
                for (const issue of visibleIssues) {
                  const prefix = issue.severity === 'error' || issue.severity === 'critical' ? '❌' : '⚠️';
                  logger.info(`  ${prefix} [${issue.severity}] ${issue.message}`);
                }
                if (options.errorsOnly && output.issues.length !== visibleIssues.length) {
                  logger.info(`  (Suppressed ${output.issues.length - visibleIssues.length} non-error issues)`);
                }
              }
            }
          }
        }

        // Exit with appropriate code
        if (hasBlockingIssues) {
          logger.error('Blocking layout issues found');
          process.exit(EXIT_BLOCKING_ISSUES);
        } else {
          process.exit(EXIT_SUCCESS);
        }
      } catch (error) {
        logger.error(`Layout failed: ${error instanceof Error ? error.message : String(error)}`);
        
        if (error instanceof SyntaxError) {
          process.exit(EXIT_INVALID_INPUT);
        } else {
          process.exit(EXIT_INTERNAL_ERROR);
        }
      }
    });

  return command;
}
