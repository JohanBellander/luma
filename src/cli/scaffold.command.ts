/**
 * Scaffold command for LUMA CLI
 */

import { Command } from 'commander';
import { writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { generateScaffold, parseBreakpoints } from '../core/scaffold/generator.js';
import { getAvailablePatterns, getPatternDescriptions } from '../core/scaffold/patterns.js';
import {
  EXIT_SUCCESS,
  EXIT_BLOCKING_ISSUES,
  EXIT_INTERNAL_ERROR,
} from '../utils/exit-codes.js';
import { logger } from '../utils/logger.js';

export function createScaffoldCommand(): Command {
  const command = new Command('scaffold');

  command
    .description('Generate scaffolds from templates')
    .addCommand(createScaffoldNewCommand());

  return command;
}

function createScaffoldNewCommand(): Command {
  const command = new Command('new');

  command
    .description('Create a new scaffold from a pattern')
    .requiredOption('--pattern <name>', 'Pattern name (e.g., todo-list, empty-screen)')
    .requiredOption('--out <path>', 'Output file path')
    .option('--title <string>', 'Screen title')
    .option('--screen-id <id>', 'Screen ID')
    .option('--breakpoints <list>', 'Comma-separated breakpoints (e.g., "320x640,768x1024")')
    .option('--force', 'Overwrite existing file')
    .action((options: {
      pattern: string;
      out: string;
      title?: string;
      screenId?: string;
      breakpoints?: string;
      force?: boolean;
    }) => {
      try {
        // Validate pattern exists
        const availablePatterns = getAvailablePatterns();
        if (!availablePatterns.includes(options.pattern)) {
          console.error(`Error: Unknown pattern "${options.pattern}"`);
          console.error(`\nAvailable patterns:`);
          const descriptions = getPatternDescriptions();
          descriptions.forEach((p) => {
            console.error(`  ${p.name.padEnd(15)} - ${p.description}`);
          });
          process.exit(EXIT_BLOCKING_ISSUES);
        }

        // Check if output file exists
        const outputPath = resolve(options.out);
        if (existsSync(outputPath) && !options.force) {
          console.error(`Error: File already exists: ${outputPath}`);
          console.error('Use --force to overwrite');
          process.exit(EXIT_INTERNAL_ERROR);
        }

        // Parse options
        const generateOptions = {
          screenId: options.screenId,
          title: options.title,
          breakpoints: options.breakpoints ? parseBreakpoints(options.breakpoints) : undefined,
        };

        // Generate scaffold
        logger.info(`Generating scaffold from pattern: ${options.pattern}`);
        const result = generateScaffold(options.pattern, generateOptions);

        if (!result.success) {
          console.error(`Error: ${result.error}`);
          
          if (result.issues && result.issues.length > 0) {
            console.error('\nValidation issues:');
            result.issues.forEach((issue) => {
              console.error(`  [${issue.severity}] ${issue.message}`);
              if (issue.nodeId) {
                console.error(`    Node: ${issue.nodeId}`);
              }
              if (issue.suggestion) {
                console.error(`    Suggestion: ${issue.suggestion}`);
              }
            });
          }

          process.exit(EXIT_BLOCKING_ISSUES);
        }

        // Write scaffold to file
        writeFileSync(outputPath, JSON.stringify(result.scaffold, null, 2));
        logger.info(`Scaffold written to: ${outputPath}`);

        // Success message with next steps
        console.log(`✓ Scaffold created: ${outputPath}`);
        console.log(`  Pattern: ${options.pattern}`);
        console.log(`  Screen ID: ${result.scaffold!.screen.id}`);
        console.log(`  Title: ${result.scaffold!.screen.title || '(none)'}`);
        console.log('');
        console.log('Next steps:');
        console.log(`  luma ingest ${options.out}`);
        console.log(`  luma layout ${options.out} --viewports 320x640,768x1024`);
        console.log(`  luma keyboard ${options.out}`);
        console.log(`  luma flow ${options.out} --patterns form,table`);
        console.log(`  luma score ${options.out}`);

        process.exit(EXIT_SUCCESS);
      } catch (error) {
        if ((error as any).code === 'EACCES') {
          console.error(`Error: Permission denied writing to: ${options.out}`);
          process.exit(EXIT_INTERNAL_ERROR);
        } else {
          logger.error('Unexpected error:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(EXIT_INTERNAL_ERROR);
        }
      }
    });

  return command;
}
