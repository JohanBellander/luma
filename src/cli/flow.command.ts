import { Command } from 'commander';
import { readFileSync, writeFileSync } from 'node:fs';
import { ingest } from '../core/ingest/ingest.js';
import { validatePatterns } from '../core/patterns/validator.js';
import { getPattern } from '../core/patterns/pattern-registry.js';
import { createRunFolder, getRunFilePath } from '../utils/run-folder.js';
import type { Pattern } from '../core/patterns/types.js';
import type { Scaffold } from '../types/scaffold.js';
import { suggestPatterns, hasDisclosureHints, hasGuidedFlowHints, type PatternSuggestion } from '../core/patterns/suggestions.js';
import { computeCoverage } from '../core/patterns/coverage.js';


export function createFlowCommand(): Command {
  const command = new Command('flow');

  command
    .description('Validate scaffold against UX patterns')
    .argument('<file>', 'Path to scaffold JSON file')
    .option('--patterns <list>', 'Comma-separated list of patterns (optional; if omitted, auto-select high-confidence suggestions)')
  .option('--no-auto', 'Disable auto pattern selection when --patterns omitted')
  .option('--json', 'Output JSON only')
  .option('--coverage', 'Include pattern coverage metrics in output')
    .option('--run-folder <path>', 'Explicit run folder path (for deterministic testing)')
  .action(async (file: string, options: { patterns?: string; json?: boolean; runFolder?: string; auto?: boolean; coverage?: boolean }) => {
      try {
        const patterns: Pattern[] = [];
        let explicitPatternNames: string[] = [];
        if (options.patterns) {
          explicitPatternNames = options.patterns.split(',').map(p => p.trim()).filter(p => p.length > 0);
          for (const name of explicitPatternNames) {
            const pattern = getPattern(name);
            if (!pattern) {
              console.error('[ERROR] Unknown pattern:', name);
              process.exit(2);
            }
            patterns.push(pattern);
          }
        }

        const content = readFileSync(file, 'utf-8');
        const rawData = JSON.parse(content);
        const result = ingest(rawData);
        
        if (!result.valid || !result.normalized) {
          console.error('[ERROR] Invalid scaffold');
          process.exit(2);
        }

        const scaffold = result.normalized as Scaffold;
        
        // If no explicit patterns provided and auto-selection enabled, suggest high-confidence patterns.
  let autoSelected: PatternSuggestion[] = [];
  let allSuggestions: PatternSuggestion[] = [];
  // By default commander sets option.auto === true unless --no-auto passed (then false)
  if (explicitPatternNames.length === 0 && options.auto !== false) {
          allSuggestions = suggestPatterns(scaffold.screen.root);
          autoSelected = allSuggestions.filter(s => s.confidence === 'high');
          for (const s of autoSelected) {
            const p = getPattern(s.pattern);
            if (p && !patterns.some(existing => existing.name === p.name)) {
              patterns.push(p);
            }
          }
        }
        if (explicitPatternNames.length > 0 && options.coverage) {
          allSuggestions = suggestPatterns(scaffold.screen.root); // still gather for coverage
        }

  if (options.auto !== false) {
          // Legacy auto-injection for disclosure & guided flow if not already captured by suggestions (backward compatible)
          const hasDisclosure = hasDisclosureHints(scaffold.screen.root);
          const hasProgressiveDisclosurePattern = patterns.some(p => p.name === 'Progressive.Disclosure');
          if (hasDisclosure && !hasProgressiveDisclosurePattern && explicitPatternNames.length > 0) {
            // Only inject if user explicitly requested others (old behavior retained when specifying patterns)
            const pdPattern = getPattern('Progressive.Disclosure');
              if (pdPattern) {
                patterns.push(pdPattern);
              }
          }
          const hasGuidedFlow = hasGuidedFlowHints(scaffold.screen.root);
          const hasGuidedFlowPattern = patterns.some(p => p.name === 'Guided.Flow');
          if (hasGuidedFlow && !hasGuidedFlowPattern && explicitPatternNames.length > 0) {
            const gfPattern = getPattern('Guided.Flow');
            if (gfPattern) {
              patterns.push(gfPattern);
            }
          }
        }
        
        const output = validatePatterns(patterns, scaffold.screen.root);

        const runDir = createRunFolder(process.cwd(), options.runFolder);
        const flowPath = getRunFilePath(runDir, 'flow.json');
        writeFileSync(flowPath, JSON.stringify(output, null, 2));

        const coverage = options.coverage ? computeCoverage(allSuggestions.length ? allSuggestions : suggestPatterns(scaffold.screen.root), patterns.map(p => p.name)) : undefined;

        if (!options.json) {
          console.log('[INFO] Flow analysis written to:', flowPath);
          if (autoSelected.length > 0) {
            console.log('[INFO] Auto-selected patterns:', autoSelected.map(s => `${s.pattern}(${s.confidence})`).join(', '));
          } else if (explicitPatternNames.length === 0 && options.auto === false) {
            console.log('[INFO] No patterns specified and auto-selection disabled (--no-auto).');
          }
          if (coverage) {
            console.log(`[INFO] Coverage: activated=${coverage.activated}/${coverage.nTotal} (${coverage.percent}%) gaps=${coverage.gaps.length}`);
            if (coverage.gaps.length > 0) {
              for (const g of coverage.gaps) {
                console.log(`  - Gap: ${g.pattern} (${g.reason})`);
              }
            }
          }
        } else {
          const jsonOutput = {
            ...output,
            runFolder: runDir,
            autoSelected: autoSelected,
            ...(coverage ? { coverage } : {})
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
