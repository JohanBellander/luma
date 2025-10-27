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
    .argument('<run-dir>', 'Path to run folder containing analysis artifacts')
    .option('--out <file>', 'Output file path', 'report.html')
    .action((runDir: string, options: { out: string }) => {
      try {
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
