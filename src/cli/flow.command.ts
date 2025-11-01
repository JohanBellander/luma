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
 * Pattern suggestion confidence levels.
 */
type Confidence = 'high' | 'medium' | 'low';

interface PatternSuggestion {
  pattern: string;
  reason: string;
  confidence: Confidence;
}

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

/**
 * Detect guided flow hints (wizard or step roles) for auto-activation.
 * Per Guided Flow spec Section 2: activate if any node has behaviors.guidedFlow.role
 */
function hasGuidedFlowHints(root: Node): boolean {
  const nodes = traversePreOrder(root, false);
  for (const node of nodes) {
    const gf = node.behaviors?.guidedFlow;
    if (gf && (gf.role === 'wizard' || gf.role === 'step')) {
      return true;
    }
  }
  return false;
}

/**
 * Suggest patterns using same heuristics as patterns.command.ts --suggest.
 * (Duplicated lightweight logic to avoid cross-file coupling; keep in sync.)
 */
function suggestPatterns(root: Node): PatternSuggestion[] {
  const suggestions: PatternSuggestion[] = [];
  const nodes = traversePreOrder(root, false);
  let hasForm = false;
  let formFields = 0;
  let formActions = 0;
  let hasTable = false;
  let tableColumns = 0;
  let tableResponsiveStrategy: string | undefined;
  let hasDisclosure = false;
  let guidedFlowIndicators = 0;
  let guidedFlowIndicatorsDetails: string[] = [];

  for (const n of nodes) {
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
        guidedFlowIndicatorsDetails.push(text);
      } else if (/step\s*\d+/i.test(text)) {
        guidedFlowIndicators++;
        guidedFlowIndicatorsDetails.push(text);
      }
    } else if (n.behaviors?.guidedFlow) {
      guidedFlowIndicators++;
      guidedFlowIndicatorsDetails.push(n.id);
    }
  }

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
    const reason = `Found multi-step indicators (${guidedFlowIndicatorsDetails.slice(0,5).join(', ')}) suggesting a wizard flow`;
    suggestions.push({ pattern: 'Guided.Flow', reason, confidence: guidedFlowIndicators > 3 ? 'high' : 'medium' });
  } else if (guidedFlowIndicators === 1) {
    const reason = `Single guided-flow hint (${guidedFlowIndicatorsDetails[0]}) detected`;
    suggestions.push({ pattern: 'Guided.Flow', reason, confidence: 'low' });
  }

  return suggestions;
}

export function createFlowCommand(): Command {
  const command = new Command('flow');

  command
    .description('Validate scaffold against UX patterns')
    .argument('<file>', 'Path to scaffold JSON file')
    .option('--patterns <list>', 'Comma-separated list of patterns (optional; if omitted, auto-select high-confidence suggestions)')
  .option('--no-auto', 'Disable auto pattern selection when --patterns omitted')
    .option('--json', 'Output JSON only')
    .option('--run-folder <path>', 'Explicit run folder path (for deterministic testing)')
  .action(async (file: string, options: { patterns?: string; json?: boolean; runFolder?: string; auto?: boolean }) => {
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
  // By default commander sets option.auto === true unless --no-auto passed (then false)
  if (explicitPatternNames.length === 0 && options.auto !== false) {
          const suggestions = suggestPatterns(scaffold.screen.root);
          autoSelected = suggestions.filter(s => s.confidence === 'high');
          for (const s of autoSelected) {
            const p = getPattern(s.pattern);
            if (p && !patterns.some(existing => existing.name === p.name)) {
              patterns.push(p);
            }
          }
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

        if (!options.json) {
          console.log('[INFO] Flow analysis written to:', flowPath);
          if (autoSelected.length > 0) {
            console.log('[INFO] Auto-selected patterns:', autoSelected.map(s => `${s.pattern}(${s.confidence})`).join(', '));
          } else if (explicitPatternNames.length === 0 && options.auto === false) {
            console.log('[INFO] No patterns specified and auto-selection disabled (--no-auto).');
          }
        } else {
          const jsonOutput = {
            ...output,
            runFolder: runDir,
            autoSelected: autoSelected
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
