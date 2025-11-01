/**
 * Patterns command - lists or shows UX pattern details
 * Per spec Section 9.7: luma patterns --list --json OR luma patterns --show <Pattern> --json
 */

import { Command } from 'commander';
import { getAllPatterns, getPattern, listPatternNames, getAliases, _getRegistry } from '../core/patterns/pattern-registry.js';
import { readFileSync } from 'fs';
import { ingest } from '../core/ingest/ingest.js';
import type { Node } from '../types/node.js';

interface PatternSuggestion {
  pattern: string;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
}

function traverse(root: Node, fn: (n: Node) => void) {
  fn(root);
  switch (root.type) {
    case 'Stack':
    case 'Grid':
      root.children.forEach(c => traverse(c, fn));
      break;
    case 'Box':
      if (root.child) traverse(root.child, fn);
      break;
    case 'Form':
      root.fields.forEach(f => traverse(f, fn));
      root.actions.forEach(a => traverse(a, fn));
      break;
  }
}

/**
 * Heuristic pattern suggestions per LUMA-74.
 */
function suggestPatterns(screenRoot: Node): PatternSuggestion[] {
  const suggestions: PatternSuggestion[] = [];
  let hasForm = false;
  let formActions = 0;
  let formFields = 0;
  let hasTable = false;
  let tableColumns = 0;
  let tableResponsiveStrategy: string | undefined;
  let hasDisclosure = false;
  let guidedFlowIndicators = 0; // next/previous buttons etc.
  let guidedFlowButtons: string[] = [];

  traverse(screenRoot, (n) => {
    if (n.type === 'Form') {
      hasForm = true;
      formFields += n.fields.length;
      formActions += n.actions.length;
    } else if (n.type === 'Table') {
      hasTable = true;
      tableColumns += n.columns.length;
      tableResponsiveStrategy = n.responsive?.strategy;
    } else if (n.behaviors?.disclosure?.collapsible) {
      hasDisclosure = true;
    } else if (n.type === 'Button') {
      const text = (n.text || '').toLowerCase();
      if (['next', 'previous', 'prev', 'back'].some(k => text.includes(k))) {
        guidedFlowIndicators++;
        guidedFlowButtons.push(text);
      } else if (/step\s*\d+/i.test(text)) {
        guidedFlowIndicators++;
        guidedFlowButtons.push(text);
      }
    } else if (n.behaviors?.guidedFlow) {
      guidedFlowIndicators++;
      guidedFlowButtons.push(n.id);
    }
  });

  if (hasForm) {
    const reason = `Detected Form node with ${formFields} field(s) and ${formActions} action(s)`;
    suggestions.push({ pattern: 'Form.Basic', reason, confidence: 'high' });
  }
  if (hasTable) {
    const reason = `Detected Table node (${tableColumns} columns, responsive.strategy=${tableResponsiveStrategy || 'none'})`;
    suggestions.push({ pattern: 'Table.Simple', reason, confidence: tableColumns > 0 ? 'high' : 'medium' });
  }
  if (hasDisclosure) {
    const reason = 'Found collapsible disclosure behavior on one or more nodes';
    suggestions.push({ pattern: 'Progressive.Disclosure', reason, confidence: 'high' });
  }
  if (guidedFlowIndicators >= 2) {
    const reason = `Found multi-step indicators (${guidedFlowButtons.slice(0,5).join(', ')}) suggesting a wizard flow`;
    suggestions.push({ pattern: 'Guided.Flow', reason, confidence: guidedFlowIndicators > 3 ? 'high' : 'medium' });
  } else if (guidedFlowIndicators === 1) {
    const reason = `Single guided-flow hint (${guidedFlowButtons[0]}) detected`;
    suggestions.push({ pattern: 'Guided.Flow', reason, confidence: 'low' });
  }

  return suggestions;
}

interface PatternListItem {
  name: string; // canonical name
  aliases: string[]; // alias names
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
    .description('List or show UX pattern details or suggest patterns for a scaffold')
    .option('--list', 'List all available patterns')
    .option('--show <name>', 'Show details for specific pattern')
    .option('--suggest <file>', 'Suggest patterns based on scaffold file')
    .option('--json', 'Output as JSON')
    .action((options: { list?: boolean; show?: string; suggest?: string; json?: boolean }) => {
      if (options.suggest) {
        // Load scaffold file and run suggestions
        try {
          const raw = readFileSync(options.suggest, 'utf-8');
          const data = JSON.parse(raw);
          if (!data.screen?.root) {
            console.error('Invalid scaffold: missing screen.root');
            process.exit(2);
          }
          const ingestResult = ingest(data);
          if (!ingestResult.valid) {
            console.error('Scaffold failed ingest validation; cannot suggest patterns.');
            if (options.json) {
              console.log(JSON.stringify({ valid: false, issues: ingestResult.issues }, null, 2));
            }
            process.exit(3);
          }
          const root: Node = data.screen.root as Node;
          const suggestions = suggestPatterns(root);
          const output = { suggestions };
          if (options.json) {
            console.log(JSON.stringify(output, null, 2));
          } else {
            if (suggestions.length === 0) {
              console.log('No pattern suggestions');
            } else {
              console.log('Pattern Suggestions:');
              for (const s of suggestions) {
                console.log(`  - ${s.pattern} [${s.confidence}] :: ${s.reason}`);
              }
            }
          }
        } catch (err: any) {
          console.error(`Failed to process scaffold: ${err.message}`);
          process.exit(2);
        }
        return; // exit after suggestions
      }
      if (options.list) {
        // List all patterns
        const patterns = getAllPatterns();
        // Build list items with aliases (registry maps canonical names -> pattern)
        const list: PatternListItem[] = patterns.map(pattern => ({
          name: pattern.name,
          aliases: getAliases(pattern.name),
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
            console.log(`    Aliases: ${item.aliases.length ? item.aliases.join(', ') : '(none)'}`);
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
