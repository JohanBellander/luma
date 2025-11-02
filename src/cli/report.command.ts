/**
 * Report command - generate HTML report from run folder
 */

import { Command } from 'commander';
import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { renderReport } from '../core/report/render.js';

export function createReportCommand(): Command {
  const cmd = new Command('report');
  
  cmd
    .description('Generate HTML report from run folder')
    .argument('[run-dir]', 'Path to run folder containing analysis artifacts (optional if --run-id provided)')
    .option('--run-id <id>', 'Run id alias for .ui/runs/<id>')
    .option('--out <file>', 'Output file path', 'report.html')
    .option('--quick', 'Skip aggregating non-critical issue details (faster, smaller report)')
    .option('--dry-run', 'Do not write report.html artifact (simulate only)')
    .action((runDir: string | undefined, options: { out: string; runId?: string; quick?: boolean; dryRun?: boolean }) => {
      try {
        if (!runDir) {
          if (options.runId) {
            runDir = resolve('.ui/runs/' + options.runId);
          } else {
            console.error('Error: run folder required (provide argument or --run-id)');
            process.exit(4);
          }
        }
        const runPath = resolve(runDir);
        let html = renderReport(runPath);
        if (options.quick) {
          // Simple heuristic: remove verbose issue lines to slim output
          html = html.replace(/<li class="issue-detail">[\s\S]*?<\/li>/g, '');
        }
        
        const outPath = resolve(options.out);
        if (options.dryRun) {
          console.log(`[dry-run] Skipped writing report (would be: ${outPath})`);
        } else {
          writeFileSync(outPath, html, 'utf-8');
          console.log(`Report generated: ${outPath}${options.quick ? ' (--quick)' : ''}`);
        }
        process.exit(0);
      } catch (err) {
        console.error('Error generating report:', (err as Error).message);
        process.exit(4); // INTERNAL_ERROR
      }
    });
  
  return cmd;
}
