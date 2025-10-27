/**
 * Patterns command - lists or shows UX pattern details
 * Per spec Section 9.7: luma patterns --list --json OR luma patterns --show <Pattern> --json
 */

import { Command } from 'commander';
import { getAllPatterns, getPattern, listPatternNames } from '../core/patterns/pattern-registry.js';

interface PatternListItem {
  name: string;
  source: {
    name: string;
    url: string;
  };
  mustRules: number;
  shouldRules: number;
}

interface PatternDetail {
  name: string;
  source: {
    pattern: string;
    name: string;
    url: string;
  };
  mustRules: Array<{ id: string; description: string }>;
  shouldRules: Array<{ id: string; description: string }>;
}

/**
 * Create the 'patterns' command.
 * 
 * Usage: luma patterns --list --json OR luma patterns --show <name> --json
 */
export function createPatternsCommand(): Command {
  const command = new Command('patterns');

  command
    .description('List or show UX pattern details')
    .option('--list', 'List all available patterns')
    .option('--show <name>', 'Show details for specific pattern')
    .option('--json', 'Output as JSON')
    .action((options: { list?: boolean; show?: string; json?: boolean }) => {
      if (options.list) {
        // List all patterns
        const patterns = getAllPatterns();
        const list: PatternListItem[] = patterns.map(pattern => ({
          name: pattern.name,
          source: {
            name: pattern.source.name,
            url: pattern.source.url,
          },
          mustRules: pattern.must.length,
          shouldRules: pattern.should.length,
        }));

        if (options.json) {
          console.log(JSON.stringify(list, null, 2));
        } else {
          console.log('Available Patterns:');
          for (const item of list) {
            console.log(`  ${item.name} (${item.source.name})`);
            console.log(`    MUST rules: ${item.mustRules}, SHOULD rules: ${item.shouldRules}`);
            console.log(`    Source: ${item.source.url}`);
          }
        }
      } else if (options.show) {
        // Show specific pattern
        const pattern = getPattern(options.show);
        
        if (!pattern) {
          console.error(`Pattern not found: ${options.show}`);
          console.error(`Available patterns: ${listPatternNames().join(', ')}`);
          process.exit(2);
        }

        const detail: PatternDetail = {
          name: pattern.name,
          source: pattern.source,
          mustRules: pattern.must.map(rule => ({
            id: rule.id,
            description: rule.description,
          })),
          shouldRules: pattern.should.map(rule => ({
            id: rule.id,
            description: rule.description,
          })),
        };

        if (options.json) {
          console.log(JSON.stringify(detail, null, 2));
        } else {
          console.log(`Pattern: ${detail.name}`);
          console.log(`Source: ${detail.source.name}`);
          console.log(`URL: ${detail.source.url}`);
          console.log('\nMUST Rules (blocking):');
          for (const rule of detail.mustRules) {
            console.log(`  - ${rule.id}: ${rule.description}`);
          }
          console.log('\nSHOULD Rules (recommended):');
          for (const rule of detail.shouldRules) {
            console.log(`  - ${rule.id}: ${rule.description}`);
          }
        }
      } else {
        console.error('Error: Either --list or --show <name> is required');
        console.log('Usage: luma patterns --list');
        console.log('       luma patterns --show <name>');
        process.exit(2);
      }
    });

  return command;
}
