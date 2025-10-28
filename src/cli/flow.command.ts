import { Command } from 'commander';
import { readFileSync, writeFileSync } from 'node:fs';
import { ingest } from '../core/ingest/ingest.js';
import { validatePatterns } from '../core/patterns/validator.js';
import { getPattern } from '../core/patterns/pattern-registry.js';
import { createRunFolder, getRunFilePath } from '../utils/run-folder.js';
import type { Pattern } from '../core/patterns/types.js';
import type { Scaffold } from '../types/scaffold.js';

export function createFlowCommand(): Command {
  const command = new Command('flow');

  command
    .description('Validate scaffold against UX patterns')
    .argument('<file>', 'Path to scaffold JSON file')
    .requiredOption('--patterns <list>', 'Comma-separated list of patterns')
    .option('--json', 'Output JSON only')
    .action(async (file: string, options: { patterns: string; json?: boolean }) => {
      try {
        const patternNames = options.patterns.split(',').map(p => p.trim());
        const patterns: Pattern[] = [];
        
        for (const name of patternNames) {
          const pattern = getPattern(name);
          if (!pattern) {
            console.error('[ERROR] Unknown pattern:', name);
            process.exit(2);
          }
          patterns.push(pattern);
        }

        const content = readFileSync(file, 'utf-8');
        const rawData = JSON.parse(content);
        const result = ingest(rawData);
        
        if (!result.valid || !result.normalized) {
          console.error('[ERROR] Invalid scaffold');
          process.exit(2);
        }

        const scaffold = result.normalized as Scaffold;
        const output = validatePatterns(patterns, scaffold.screen.root);

        const runDir = createRunFolder();
        const flowPath = getRunFilePath(runDir, 'flow.json');
        writeFileSync(flowPath, JSON.stringify(output, null, 2));

        if (!options.json) {
          console.log('[INFO] Flow analysis written to:', flowPath);
        } else {
          const jsonOutput = {
            ...output,
            runFolder: runDir
          };
          console.log(JSON.stringify(jsonOutput, null, 2));
        }

        if (output.hasMustFailures) {
          process.exit(3);
        }
      } catch (error) {
        console.error('[ERROR] Internal error:', error);
        process.exit(4);
      }
    });

  return command;
}
