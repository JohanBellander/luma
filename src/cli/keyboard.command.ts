import { Command } from 'commander';
import { readFileSync, writeFileSync } from 'node:fs';
import type { Scaffold } from '../types/scaffold.js';
import { analyzeKeyboardFlow } from '../core/keyboard/keyboard.js';
import { getRunFilePath, selectRunFolder } from '../utils/run-folder.js';
import { logger } from '../utils/logger.js';
import {
  EXIT_SUCCESS,
  EXIT_INVALID_INPUT,
  EXIT_BLOCKING_ISSUES,
  EXIT_INTERNAL_ERROR,
} from '../utils/exit-codes.js';

/**
 * Create the 'keyboard' command.
 * 
 * Usage: luma keyboard <file> [--state <state>] [--viewport <width>]
 * 
 * Analyzes keyboard flow and tab sequence.
 * Exits with code 3 if critical flow errors found.
 */
export function createKeyboardCommand(): Command {
  const command = new Command('keyboard');

  command
    .description('Analyze keyboard tab sequence and flow')
    .argument('<file>', 'Path to scaffold JSON file')
    .option('--state <state>', 'Form state to analyze (e.g., "default", "error")')
    .option('--viewport <width>', 'Viewport width for responsive overrides (e.g., "320")', parseInt)
    .option('--json', 'Output results as JSON to stdout')
    .option('--errors-only', 'Show only error/critical issues (suppresses warnings)')
      .option('--quick', 'Skip verbose issue listing and unreachable node expansion')
      .option('--dry-run', 'Do not write keyboard.json artifact (simulate only)')
  .option('--run-folder <path>', 'Explicit run folder path (for deterministic testing)')
  .option('--run-id <id>', 'Explicit run id (creates/uses .ui/runs/<id>)')
  .action(async (file: string, options: { state?: string; viewport?: number; json?: boolean; runFolder?: string; runId?: string; errorsOnly?: boolean; quick?: boolean; dryRun?: boolean }) => {
      try {
        // Read scaffold file
        const scaffoldText = readFileSync(file, 'utf-8');
        const scaffold = JSON.parse(scaffoldText) as Scaffold;

        // Analyze keyboard flow
        const output = analyzeKeyboardFlow(scaffold, options.viewport, options.state);

        // Select run folder
        let runFolder: string;
        try {
          runFolder = selectRunFolder({ explicitPath: options.runFolder, runId: options.runId });
        } catch (e: any) {
          logger.error(e.message);
          process.exit(EXIT_INVALID_INPUT);
        }
        const outputPath = getRunFilePath(runFolder, 'keyboard.json');
        if (options.dryRun) {
          logger.info('[dry-run] Skipped writing keyboard.json artifact');
        } else {
          writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
          logger.info(`Keyboard analysis written to: ${outputPath}`);
        }

        // Output results
        if (options.json) {
          const jsonOutput = {
            ...output,
            runFolder: runFolder,
            ...(options.errorsOnly ? { filteredIssues: output.issues.filter(i => i.severity === 'error' || i.severity === 'critical') } : {})
          };
          console.log(JSON.stringify(jsonOutput, null, 2));
        } else {
          if (options.quick) {
            logger.info(`Tab sequence length: ${output.sequence.length} (elided via --quick)`);
          } else {
            logger.info(`Tab sequence (${output.sequence.length} focusable nodes):`);
            for (let i = 0; i < output.sequence.length; i++) {
              logger.info(`  ${i + 1}. ${output.sequence[i]}`);
            }
          }

          if (output.unreachable.length > 0) {
            if (options.quick) {
              logger.error(`Unreachable nodes: ${output.unreachable.length} (list elided via --quick)`);
            } else {
              logger.error(`Unreachable nodes (${output.unreachable.length}):`);
              for (const id of output.unreachable) {
                logger.error(`  - ${id}`);
              }
            }
          }

          const visibleIssues = options.errorsOnly ? output.issues.filter(i => i.severity === 'error' || i.severity === 'critical') : output.issues;
          if (visibleIssues.length > 0) {
            logger.info(`Issues found (${visibleIssues.length}):${options.errorsOnly ? ' (errors only)' : ''}`);
            if (options.quick) {
              logger.info('  (Issue details elided due to --quick)');
            } else {
              for (const issue of visibleIssues) {
                const prefix = issue.severity === 'error' || issue.severity === 'critical' ? '❌' : '⚠️';
                logger.info(`  ${prefix} [${issue.severity}] ${issue.message}`);
              }
              if (options.errorsOnly && output.issues.length !== visibleIssues.length) {
                logger.info(`(Suppressed ${output.issues.length - visibleIssues.length} non-error issues)`);
              }
            }
          } else {
            logger.info('No issues found');
          }
        }

        // Exit with appropriate code
        const hasCritical = output.issues.some(i => i.severity === 'critical' || i.severity === 'error');
        if (hasCritical) {
          logger.error('Critical keyboard flow issues found');
          process.exit(EXIT_BLOCKING_ISSUES);
        } else {
          process.exit(EXIT_SUCCESS);
        }
      } catch (error) {
        logger.error(`Keyboard analysis failed: ${error instanceof Error ? error.message : String(error)}`);
        
        if (error instanceof SyntaxError) {
          process.exit(EXIT_INVALID_INPUT);
        } else {
          process.exit(EXIT_INTERNAL_ERROR);
        }
      }
    });

  return command;
}
