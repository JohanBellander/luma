import { Command } from 'commander';
import { readFileSync, writeFileSync } from 'node:fs';
import { ingest } from '../core/ingest/ingest.js';
import { validatePatterns } from '../core/patterns/validator.js';
import { getPattern } from '../core/patterns/pattern-registry.js';
import { createRunFolder, getRunFilePath } from '../utils/run-folder.js';
import { traversePreOrder } from '../core/keyboard/traversal.js';
import type { Pattern } from '../core/patterns/types.js';
import type { Scaffold } from '../types/scaffold.js';
import type { Node } from '../types/node.js';

/**
 * Detect if any node in the tree has progressive disclosure hints.
 * Per spec Section 2: Auto-activate when any node has behaviors.disclosure.collapsible === true
 */
function hasDisclosureHints(root: Node): boolean {
  const nodes = traversePreOrder(root, false); // Check all nodes, even invisible ones
  
  for (const node of nodes) {
    if (node.behaviors?.disclosure?.collapsible === true) {
      return true;
    }
  }
  
  return false;
}

export function createFlowCommand(): Command {
  const command = new Command('flow');

  command
    .description('Validate scaffold against UX patterns')
    .argument('<file>', 'Path to scaffold JSON file')
    .requiredOption('--patterns <list>', 'Comma-separated list of patterns')
    .option('--json', 'Output JSON only')
    .option('--run-folder <path>', 'Explicit run folder path (for deterministic testing)')
    .action(async (file: string, options: { patterns: string; json?: boolean; runFolder?: string }) => {
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
        
        // Auto-inject Progressive.Disclosure pattern if disclosure hints are present
        // Per spec Section 2: Auto-activate when any node has behaviors.disclosure.collapsible === true
        const hasDisclosure = hasDisclosureHints(scaffold.screen.root);
        const hasProgressiveDisclosurePattern = patterns.some(
          p => p.name === 'Progressive.Disclosure'
        );
        
        if (hasDisclosure && !hasProgressiveDisclosurePattern) {
          const pdPattern = getPattern('Progressive.Disclosure');
          if (pdPattern) {
            patterns.push(pdPattern);
          }
        }
        
        const output = validatePatterns(patterns, scaffold.screen.root);

        const runDir = createRunFolder(process.cwd(), options.runFolder);
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
