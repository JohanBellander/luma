/**
 * Report renderer - aggregates data from run folder
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import type { ScoreOutput } from '../scoring/types.js';
import type { Issue } from '../../types/issue.js';
import type { ReportData } from './template.js';
import { generateHtml } from './template.js';

/**
 * Aggregate data from run folder and generate HTML report
 */
export function renderReport(runDir: string): string {
  const runId = runDir.split(/[/\\]/).pop() || 'unknown';
  
  // Load score.json (required)
  const scorePath = join(runDir, 'score.json');
  if (!existsSync(scorePath)) {
    throw new Error(`score.json not found in ${runDir}. Run 'luma score' first.`);
  }
  const score: ScoreOutput = JSON.parse(readFileSync(scorePath, 'utf-8'));
  
  // Collect all issues from various artifacts
  const allIssues: Issue[] = [];
  
  // Load ingest.json (if exists)
  const ingestPath = join(runDir, 'ingest.json');
  if (existsSync(ingestPath)) {
    const ingest = JSON.parse(readFileSync(ingestPath, 'utf-8'));
    if (ingest.errors) allIssues.push(...ingest.errors);
    if (ingest.warnings) allIssues.push(...ingest.warnings);
  }
  
  // Load layout_*.json files (if exist)
  const layoutFiles = findLayoutFiles(runDir);
  const viewportResults: ReportData['viewports'] = [];
  
  for (const file of layoutFiles) {
    const layoutData = JSON.parse(readFileSync(file, 'utf-8'));
    const viewport = file.match(/layout_(\d+x\d+)\.json$/)?.[1] || 'unknown';
    
    if (layoutData.issues) {
      allIssues.push(...layoutData.issues);
    }
    
    // Calculate responsive score for this viewport
    const vpIssues = layoutData.issues || [];
    const responsiveIssues = vpIssues.filter((i: Issue) => 
      i.id === 'overflow-x' || i.id === 'primary-below-fold'
    );
    const overflowPenalty = responsiveIssues.filter((i: Issue) => i.id === 'overflow-x').length * 30;
    const foldPenalty = responsiveIssues.filter((i: Issue) => i.id === 'primary-below-fold').length * 20;
    const responsiveScore = Math.max(0, 100 - overflowPenalty - foldPenalty);
    
    viewportResults.push({
      name: viewport,
      issueCount: vpIssues.length,
      responsiveScore,
    });
  }
  
  // Load keyboard.json (if exists)
  const keyboardPath = join(runDir, 'keyboard.json');
  if (existsSync(keyboardPath)) {
    const keyboard = JSON.parse(readFileSync(keyboardPath, 'utf-8'));
    if (keyboard.issues) allIssues.push(...keyboard.issues);
  }
  
  // Load flow.json (if exists)
  const flowPath = join(runDir, 'flow.json');
  if (existsSync(flowPath)) {
    const flow = JSON.parse(readFileSync(flowPath, 'utf-8'));
    if (flow.results) {
      for (const result of flow.results) {
        if (result.issues) allIssues.push(...result.issues);
      }
    }
  }
  
  // Group issues by severity
  const issuesBySeverity = {
    critical: allIssues.filter(i => i.severity === 'critical'),
    error: allIssues.filter(i => i.severity === 'error'),
    warn: allIssues.filter(i => i.severity === 'warn'),
    info: allIssues.filter(i => i.severity === 'info'),
  };
  
  // Count issues
  const issueCounts = {
    critical: issuesBySeverity.critical.length,
    error: issuesBySeverity.error.length,
    warn: issuesBySeverity.warn.length,
    info: issuesBySeverity.info.length,
    total: allIssues.length,
  };
  
  // Build report data
  const reportData: ReportData = {
    runId,
    score,
    issuesBySeverity,
    issueCounts,
    viewports: viewportResults.length > 0 ? viewportResults : undefined,
  };
  
  // Generate HTML
  return generateHtml(reportData);
}

/**
 * Find all layout_*.json files in run directory
 */
function findLayoutFiles(runDir: string): string[] {
  const files = readdirSync(runDir);
  return files
    .filter((f: string) => /^layout_\d+x\d+\.json$/.test(f))
    .map((f: string) => join(runDir, f));
}
