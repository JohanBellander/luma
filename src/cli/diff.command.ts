import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { ingest } from '../core/ingest/ingest.js';
import type { Node } from '../types/node.js';
import { suggestPatterns } from '../core/patterns/suggestions.js';
import type { Issue } from '../types/issue.js';
import type { ScaffoldDiffOutput, ScaffoldNodeChange } from '../types/output.js';
import { logger } from '../utils/logger.js';
import { EXIT_INVALID_INPUT, EXIT_SUCCESS } from '../utils/exit-codes.js';

/**
 * Recursively collect all nodes into a flat map by id for diffing.
 */
function collectNodes(root: Node): Map<string, any> {
  const map = new Map<string, any>();
  function walk(n: any) {
    map.set(n.id, n);
    switch (n.type) {
      case 'Stack':
      case 'Grid':
        n.children.forEach(walk); break;
      case 'Box':
        if (n.child) walk(n.child); break;
      case 'Form':
        n.fields.forEach(walk); n.actions.forEach(walk); break;
    }
  }
  walk(root);
  return map;
}

/**
 * Compute shallow property diffs between two node objects (excluding children collections to avoid noise).
 */
function diffNodeProps(before: any, after: any): Array<{ key: string; before: any; after: any }> {
  const keys = new Set<string>([...Object.keys(before), ...Object.keys(after)]);
  const changed: Array<{ key: string; before: any; after: any }> = [];
  for (const k of keys) {
    if (['children','fields','actions','child'].includes(k)) continue; // structural handled elsewhere
    const b = before[k];
    const a = after[k];
    const equal = JSON.stringify(b) === JSON.stringify(a);
    if (!equal) {
      changed.push({ key: k, before: b, after: a });
    }
  }
  return changed;
}

function buildScaffoldDiff(oldRoot: Node, newRoot: Node, oldIssues: Issue[], newIssues: Issue[]): ScaffoldDiffOutput {
  const oldMap = collectNodes(oldRoot);
  const newMap = collectNodes(newRoot);

  const addedNodes: any[] = [];
  const removedNodes: any[] = [];
  const changedNodes: ScaffoldNodeChange[] = [];

  // Node presence & modifications
  for (const [id, oldNode] of oldMap.entries()) {
    if (!newMap.has(id)) {
      removedNodes.push(oldNode);
      continue;
    }
    const newNode = newMap.get(id);
    const propChanges = diffNodeProps(oldNode, newNode);
    if (propChanges.length > 0) {
      changedNodes.push({ id, before: oldNode, after: newNode, changeType: 'modified', changedProps: propChanges });
    }
  }
  for (const [id, newNode] of newMap.entries()) {
    if (!oldMap.has(id)) {
      addedNodes.push(newNode);
    }
  }

  // Issue delta
  const addedIssues = newIssues.filter(i => !oldIssues.some(o => o.id === i.id && o.nodeId === i.nodeId));
  const resolvedIssues = oldIssues.filter(i => !newIssues.some(o => o.id === i.id && o.nodeId === i.nodeId));

  // Pattern suggestion delta (heuristics)
  const beforeSuggestions = suggestPatterns(oldRoot);
  const afterSuggestions = suggestPatterns(newRoot);
  const beforeNames = new Set(beforeSuggestions.map(s => s.pattern));
  const afterNames = new Set(afterSuggestions.map(s => s.pattern));
  const addedPatterns: string[] = [];
  const removedPatterns: string[] = [];
  for (const p of afterNames) if (!beforeNames.has(p)) addedPatterns.push(p);
  for (const p of beforeNames) if (!afterNames.has(p)) removedPatterns.push(p);

  return {
    addedNodes,
    removedNodes,
    changedNodes,
    issueDelta: { addedIssues, resolvedIssues },
    patternSuggestions: {
      before: beforeSuggestions.map(s => ({ pattern: s.pattern, confidence: s.confidence, confidenceScore: s.confidenceScore })),
      after: afterSuggestions.map(s => ({ pattern: s.pattern, confidence: s.confidence, confidenceScore: s.confidenceScore })),
      added: addedPatterns,
      removed: removedPatterns,
    },
  };
}

export function createDiffCommand(): Command {
  const command = new Command('diff');
  command
    .description('Diff two scaffold JSON files to see structural & validation changes')
    .argument('<old>', 'Path to previous scaffold JSON')
    .argument('<new>', 'Path to new scaffold JSON')
    .option('--json', 'Output diff result as JSON')
    .action((oldPath: string, newPath: string, opts: { json?: boolean }) => {
      try {
        const oldRaw = JSON.parse(readFileSync(oldPath, 'utf-8'));
        const newRaw = JSON.parse(readFileSync(newPath, 'utf-8'));

        const oldIngest = ingest(oldRaw);
        const newIngest = ingest(newRaw);
        if (!oldIngest.valid) {
          logger.error('Old scaffold failed ingest validation; diff aborted');
          process.exit(EXIT_INVALID_INPUT);
        }
        if (!newIngest.valid) {
          logger.error('New scaffold failed ingest validation; diff aborted');
          process.exit(EXIT_INVALID_INPUT);
        }

        const oldRoot = (oldRaw.screen?.root) as Node;
        const newRoot = (newRaw.screen?.root) as Node;
        if (!oldRoot || !newRoot) {
          logger.error('One or both scaffolds missing screen.root');
          process.exit(EXIT_INVALID_INPUT);
        }

        const diff = buildScaffoldDiff(oldRoot, newRoot, oldIngest.issues, newIngest.issues);

        if (opts.json) {
          console.log(JSON.stringify(diff, null, 2));
        } else {
          logger.info('Scaffold diff summary');
          logger.info(`  Added nodes: ${diff.addedNodes.length}`);
          logger.info(`  Removed nodes: ${diff.removedNodes.length}`);
          logger.info(`  Modified nodes: ${diff.changedNodes.length}`);
          if (diff.addedNodes.length) logger.info('    + ' + diff.addedNodes.map(n => n.id).join(', '));
          if (diff.removedNodes.length) logger.info('    - ' + diff.removedNodes.map(n => n.id).join(', '));
          for (const ch of diff.changedNodes) {
            logger.info(`    * ${ch.id} changed props: ${ch.changedProps?.map(p => p.key).join(', ')}`);
          }
          if (diff.issueDelta.addedIssues.length || diff.issueDelta.resolvedIssues.length) {
            logger.info(`  Issue changes: +${diff.issueDelta.addedIssues.length} -${diff.issueDelta.resolvedIssues.length}`);
          }
          if (diff.patternSuggestions) {
            const ps = diff.patternSuggestions;
            if (ps.added.length || ps.removed.length) {
              logger.info(`  Pattern suggestions delta: +${ps.added.length} -${ps.removed.length}`);
              if (ps.added.length) logger.info('    + ' + ps.added.join(', '));
              if (ps.removed.length) logger.info('    - ' + ps.removed.join(', '));
            }
          }
        }
        process.exit(EXIT_SUCCESS);
      } catch (e: any) {
        logger.error(`diff failed: ${e.message}`);
        process.exit(EXIT_INVALID_INPUT);
      }
    });
  return command;
}
