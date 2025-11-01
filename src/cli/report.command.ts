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
    .action((runDir: string | undefined, options: { out: string; runId?: string }) => {
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
        const html = renderReport(runPath);
        
        const outPath = resolve(options.out);
        writeFileSync(outPath, html, 'utf-8');
        
        console.log(`Report generated: ${outPath}`);
        process.exit(0);
      } catch (err) {
        console.error('Error generating report:', (err as Error).message);
        process.exit(4); // INTERNAL_ERROR
      }
    });
  
  return cmd;
}
