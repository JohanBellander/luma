import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import type { LayoutOutput, LayoutDiffOutput } from '../types/output.js';
import type { Frame } from '../types/viewport.js';
import type { Issue } from '../types/issue.js';
import { logger } from '../utils/logger.js';
import { EXIT_INVALID_INPUT, EXIT_SUCCESS } from '../utils/exit-codes.js';
import { parseViewport } from '../types/viewport.js';

/**
 * Determine change type between two frames.
 */
function classifyFrameChange(before: Frame, after: Frame): { changeType: 'unchanged' | 'moved' | 'resized' | 'moved_resized'; delta: { dx: number; dy: number; dw: number; dh: number } } {
  const dx = after.x - before.x;
  const dy = after.y - before.y;
  const dw = after.w - before.w;
  const dh = after.h - before.h;
  const moved = dx !== 0 || dy !== 0;
  const resized = dw !== 0 || dh !== 0;
  let changeType: 'unchanged' | 'moved' | 'resized' | 'moved_resized';
  if (!moved && !resized) changeType = 'unchanged';
  else if (moved && resized) changeType = 'moved_resized';
  else if (moved) changeType = 'moved';
  else changeType = 'resized';
  return { changeType, delta: { dx, dy, dw, dh } };
}

function diffLayouts(before: LayoutOutput, after: LayoutOutput): LayoutDiffOutput {
  if (before.viewport !== after.viewport) {
    // Allow comparing different viewport size artifacts but set viewport to after.viewport for output
  }
  const beforeMap = new Map<string, Frame>(before.frames.map(f => [f.id, f]));
  const afterMap = new Map<string, Frame>(after.frames.map(f => [f.id, f]));

  const added: Frame[] = [];
  const removed: Frame[] = [];
  const changed: any[] = [];
  let unchangedCount = 0;

  for (const [id, bf] of beforeMap.entries()) {
    if (!afterMap.has(id)) {
      removed.push(bf);
      continue;
    }
    const af = afterMap.get(id)!;
    const { changeType, delta } = classifyFrameChange(bf, af);
    if (changeType === 'unchanged') {
      unchangedCount++;
    } else {
      changed.push({ id, before: bf, after: af, delta, changeType });
    }
  }
  for (const [id, af] of afterMap.entries()) {
    if (!beforeMap.has(id)) {
      added.push(af);
    }
  }

  // Issue delta
  const issueAdded: Issue[] = after.issues.filter(i => !before.issues.some(b => b.id === i.id && b.nodeId === i.nodeId));
  const issueRemoved: Issue[] = before.issues.filter(i => !after.issues.some(b => b.id === i.id && b.nodeId === i.nodeId));

  return {
    viewport: after.viewport,
    added,
    removed,
    changed,
    unchangedCount,
    issueDelta: { added: issueAdded, removed: issueRemoved }
  };
}

export function createLayoutDiffCommand(): Command {
  const command = new Command('layout-diff');
  command
    .description('Diff two layout artifacts to see frame and issue changes')
    .argument('<before>', 'Path to previous layout_<WxH>.json file')
    .argument('<after>', 'Path to new layout_<WxH>.json file')
    .option('--json', 'Output diff as JSON')
    .option('--viewport <size>', 'Viewport size override (e.g., 320x640) if not in filenames')
    .action((beforePath: string, afterPath: string, opts: { json?: boolean; viewport?: string }) => {
      try {
        const beforeRaw = JSON.parse(readFileSync(beforePath, 'utf-8')) as LayoutOutput;
        const afterRaw = JSON.parse(readFileSync(afterPath, 'utf-8')) as LayoutOutput;

        // Validate viewport if override provided
        if (opts.viewport) {
          parseViewport(opts.viewport); // will throw if invalid
          beforeRaw.viewport = opts.viewport;
          afterRaw.viewport = opts.viewport;
        }

        const diff = diffLayouts(beforeRaw, afterRaw);

        if (opts.json) {
          console.log(JSON.stringify(diff, null, 2));
        } else {
          logger.info(`Layout diff (${diff.viewport})`);
          logger.info(`  Added frames: ${diff.added.length}`);
          logger.info(`  Removed frames: ${diff.removed.length}`);
          logger.info(`  Changed frames: ${diff.changed.length}`);
          logger.info(`  Unchanged frames: ${diff.unchangedCount}`);
          if (diff.added.length) {
            logger.info('  + Added: ' + diff.added.map(f => f.id).join(', '));
          }
          if (diff.removed.length) {
            logger.info('  - Removed: ' + diff.removed.map(f => f.id).join(', '));
          }
          for (const ch of diff.changed) {
            const d = ch.delta || { dx: 0, dy: 0, dw: 0, dh: 0 };
            logger.info(`  * ${ch.id} ${ch.changeType} Δ(x:${d.dx}, y:${d.dy}, w:${d.dw}, h:${d.dh})`);
          }
          if (diff.issueDelta.added.length || diff.issueDelta.removed.length) {
            logger.info(`  Issue changes: +${diff.issueDelta.added.length} -${diff.issueDelta.removed.length}`);
            if (diff.issueDelta.added.length) {
              logger.info('    + ' + diff.issueDelta.added.map(i => `${i.id}${i.nodeId ? '('+i.nodeId+')' : ''}`).join(', '));
            }
            if (diff.issueDelta.removed.length) {
              logger.info('    - ' + diff.issueDelta.removed.map(i => `${i.id}${i.nodeId ? '('+i.nodeId+')' : ''}`).join(', '));
            }
          }
        }
        process.exit(EXIT_SUCCESS);
      } catch (e: any) {
        logger.error(`layout-diff failed: ${e.message}`);
        process.exit(EXIT_INVALID_INPUT);
      }
    });
  return command;
}
