import { Command } from 'commander';
import { readFileSync, writeFileSync } from 'node:fs';
import { parseViewport } from '../types/viewport.js';
import type { Scaffold } from '../types/scaffold.js';
import type { LayoutOutput } from '../types/output.js';
import { computeLayout } from '../core/layout/layout.js';
import { createRunFolder, getRunFilePath } from '../utils/run-folder.js';
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
    .action(async (file: string, options: { viewports: string; json?: boolean }) => {
      try {
        // Read scaffold file
        const scaffoldText = readFileSync(file, 'utf-8');
        const scaffold = JSON.parse(scaffoldText) as Scaffold;

        // Parse viewports
        const viewportStrings = options.viewports.split(',').map(s => s.trim());
        const viewports = viewportStrings.map(parseViewport);

        // Create run folder for this execution
        const runFolder = createRunFolder();

        // Compute layout for each viewport
        const outputs: LayoutOutput[] = [];
        let hasBlockingIssues = false;

        for (const viewport of viewports) {
          const output = computeLayout(scaffold, viewport);
          outputs.push(output);

          // Write to run folder
          const outputPath = getRunFilePath(runFolder, `layout_${viewport.width}x${viewport.height}.json`);
          writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
          logger.info(`Layout computed for ${viewport.width}x${viewport.height}: ${outputPath}`);

          // Check for blocking issues
          const blocking = output.issues.some(i => i.severity === 'error' || i.severity === 'critical');
          if (blocking) {
            hasBlockingIssues = true;
          }
        }

        // Output results
        if (options.json) {
          console.log(JSON.stringify(outputs, null, 2));
        } else {
          for (const output of outputs) {
            logger.info(`Viewport ${output.viewport}: ${output.frames.length} frames, ${output.issues.length} issues`);
            
            if (output.issues.length > 0) {
              for (const issue of output.issues) {
                const prefix = issue.severity === 'error' || issue.severity === 'critical' ? '❌' : '⚠️';
                logger.info(`  ${prefix} [${issue.severity}] ${issue.message}`);
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
