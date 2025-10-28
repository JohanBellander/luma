/**
 * Ingest command for LUMA CLI
 */

import { Command } from 'commander';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { ingest } from '../core/ingest/ingest.js';
import { enhanceIssues, formatIssuesForConsole, type ErrorEnhancementOptions } from '../core/ingest/error-enhancer.js';
import { createRunFolder, getRunFilePath } from '../utils/run-folder.js';
import {
  EXIT_SUCCESS,
  EXIT_INVALID_INPUT,
  EXIT_VERSION_MISMATCH,
} from '../utils/exit-codes.js';
import { logger } from '../utils/logger.js';
import { LogLevel } from '../utils/logger.js';

export function createIngestCommand(): Command {
  const command = new Command('ingest');

  command
    .description('Validate and normalize a scaffold JSON file')
    .argument('<file>', 'Path to the scaffold JSON file')
    .option('--json', 'Output result as JSON')
    .option('--all-issues', 'Show all validation issues instead of just the most blocking one')
    .option('--no-suggest', 'Suppress fix suggestions')
    .option('--format <type>', 'Output format: concise or verbose', 'concise')
    .action((file: string, options: { 
      json?: boolean;
      allIssues?: boolean;
      suggest?: boolean;
      format?: string;
    }) => {
      try {
        // Suppress INFO logs when using --json
        if (options.json) {
          logger.setLevel(LogLevel.ERROR);
        }

        // Validate format option
        if (options.format && !['concise', 'verbose'].includes(options.format)) {
          console.error('Error: --format must be either "concise" or "verbose"');
          process.exit(EXIT_INVALID_INPUT);
        }

        // Read the file
        const filePath = resolve(file);
        logger.info(`Reading scaffold from: ${filePath}`);

        const fileContent = readFileSync(filePath, 'utf-8');
        const rawData = JSON.parse(fileContent);

        // Run ingest
        const result = ingest(rawData);

        // Enhance errors with suggestions and nextAction
        const enhancementOptions: ErrorEnhancementOptions = {
          allIssues: options.allIssues,
          noSuggest: options.suggest === false, // Commander converts --no-suggest to suggest: false
          format: (options.format as 'concise' | 'verbose') || 'concise',
        };

        const enhancedIssues = enhanceIssues(result.issues, enhancementOptions, file, result.rawData);

        // Create enhanced result
        const enhancedResult = {
          ...result,
          issues: enhancedIssues,
        };

        // Create run folder
        const runFolder = createRunFolder();
        const outputPath = getRunFilePath(runFolder, 'ingest.json');

        // Write result to run folder
        writeFileSync(outputPath, JSON.stringify(enhancedResult, null, 2));
        logger.info(`Ingest result written to: ${outputPath}`);

        // Output to console
        if (options.json) {
          console.log(JSON.stringify(enhancedResult, null, 2));
        } else {
          console.log(`\nIngest ${result.valid ? 'PASSED' : 'FAILED'}`);
          console.log(`Issues: ${enhancedIssues.length}${options.allIssues ? '' : ' (showing most blocking)'}`);

          if (enhancedIssues.length > 0) {
            console.log('\nIssues found:');
            console.log(formatIssuesForConsole(enhancedIssues, enhancementOptions));
          }

          console.log(`\nResults saved to: ${outputPath}`);
        }

        // Exit with appropriate code
        if (!result.valid) {
          // Check if it's a version mismatch
          const hasVersionIssue = result.issues.some(
            (i) => i.id === 'unsupported-schema-version' || i.id === 'missing-schema-version'
          );

          if (hasVersionIssue) {
            process.exit(EXIT_VERSION_MISMATCH);
          } else {
            process.exit(EXIT_INVALID_INPUT);
          }
        }

        process.exit(EXIT_SUCCESS);
      } catch (error) {
        if (error instanceof SyntaxError) {
          logger.error('Invalid JSON:', error.message);
          console.error('Error: Invalid JSON in scaffold file');
          process.exit(EXIT_INVALID_INPUT);
        } else if ((error as any).code === 'ENOENT') {
          logger.error('File not found:', file);
          console.error(`Error: File not found: ${file}`);
          process.exit(EXIT_INVALID_INPUT);
        } else {
          logger.error('Unexpected error:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(EXIT_INVALID_INPUT);
        }
      }
    });

  return command;
}
