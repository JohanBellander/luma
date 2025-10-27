/**
 * HTML report template for LUMA
 * Embedded template for generating report.html
 */

import type { ScoreOutput } from '../scoring/types.js';
import type { Issue } from '../../types/issue.js';

export interface ReportData {
  /** Run folder timestamp/name */
  runId: string;
  
  /** Overall scoring results */
  score: ScoreOutput;
  
  /** All issues grouped by severity */
  issuesBySeverity: {
    critical: Issue[];
    error: Issue[];
    warn: Issue[];
    info: Issue[];
  };
  
  /** Total issue counts */
  issueCounts: {
    critical: number;
    error: number;
    warn: number;
    info: number;
    total: number;
  };
  
  /** Per-viewport results (if available) */
  viewports?: Array<{
    name: string;
    issueCount: number;
    responsiveScore: number;
  }>;
}

/**
 * Generate HTML report from aggregated data
 */
export function generateHtml(data: ReportData): string {
  const passClass = data.score.pass ? 'pass' : 'fail';
  const passText = data.score.pass ? 'PASS ✓' : 'FAIL ✗';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LUMA Report - ${escapeHtml(data.runId)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
      color: #333;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      margin-top: 0;
      color: #2c3e50;
      border-bottom: 3px solid #3498db;
      padding-bottom: 10px;
    }
    h2 {
      color: #34495e;
      margin-top: 30px;
      border-bottom: 2px solid #ecf0f1;
      padding-bottom: 8px;
    }
    h3 {
      color: #7f8c8d;
      margin-top: 20px;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 20px 0;
    }
    .card {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 6px;
      border-left: 4px solid #3498db;
    }
    .card.pass { border-left-color: #27ae60; }
    .card.fail { border-left-color: #e74c3c; }
    .card h3 {
      margin: 0 0 10px 0;
      font-size: 14px;
      text-transform: uppercase;
      color: #7f8c8d;
    }
    .card .value {
      font-size: 32px;
      font-weight: bold;
      color: #2c3e50;
    }
    .card.pass .value { color: #27ae60; }
    .card.fail .value { color: #e74c3c; }
    .score-breakdown {
      margin: 20px 0;
    }
    .score-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px;
      background: #f8f9fa;
      margin-bottom: 8px;
      border-radius: 4px;
    }
    .score-item .label {
      font-weight: 500;
    }
    .score-item .value {
      font-weight: bold;
      color: #2c3e50;
    }
    .issue-list {
      margin: 15px 0;
    }
    .issue {
      background: #fff;
      border: 1px solid #e1e4e8;
      border-left: 4px solid;
      border-radius: 4px;
      padding: 12px;
      margin-bottom: 10px;
    }
    .issue.critical { border-left-color: #d73a49; background: #fff5f5; }
    .issue.error { border-left-color: #e74c3c; background: #fef9f9; }
    .issue.warn { border-left-color: #f39c12; background: #fffbf5; }
    .issue.info { border-left-color: #3498db; background: #f5fbff; }
    .issue-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 8px;
    }
    .issue-id {
      font-family: 'Courier New', monospace;
      font-weight: bold;
      color: #2c3e50;
    }
    .issue-severity {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 3px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .severity-critical { background: #d73a49; color: white; }
    .severity-error { background: #e74c3c; color: white; }
    .severity-warn { background: #f39c12; color: white; }
    .severity-info { background: #3498db; color: white; }
    .issue-message {
      margin: 8px 0;
      color: #24292e;
    }
    .issue-details {
      font-size: 13px;
      color: #586069;
      margin-top: 8px;
    }
    .issue-details code {
      background: #f6f8fa;
      padding: 2px 4px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
    }
    .issue-suggestion {
      margin-top: 8px;
      padding: 8px;
      background: #f0f8ff;
      border-left: 3px solid #3498db;
      font-style: italic;
      color: #2c3e50;
    }
    .viewport-table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    .viewport-table th,
    .viewport-table td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #e1e4e8;
    }
    .viewport-table th {
      background: #f6f8fa;
      font-weight: 600;
      color: #24292e;
    }
    .viewport-table tr:hover {
      background: #f6f8fa;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e1e4e8;
      text-align: center;
      color: #6a737d;
      font-size: 14px;
    }
    .no-issues {
      padding: 20px;
      text-align: center;
      color: #27ae60;
      background: #f0fff4;
      border-radius: 4px;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>LUMA Analysis Report</h1>
    <p><strong>Run ID:</strong> ${escapeHtml(data.runId)}</p>
    
    <h2>Summary</h2>
    <div class="summary">
      <div class="card ${passClass}">
        <h3>Overall Result</h3>
        <div class="value">${passText}</div>
      </div>
      <div class="card">
        <h3>Overall Score</h3>
        <div class="value">${data.score.overall.toFixed(1)}</div>
      </div>
      <div class="card ${data.issueCounts.critical > 0 ? 'fail' : ''}">
        <h3>Critical Issues</h3>
        <div class="value">${data.issueCounts.critical}</div>
      </div>
      <div class="card ${data.issueCounts.error > 0 ? 'fail' : ''}">
        <h3>Error Issues</h3>
        <div class="value">${data.issueCounts.error}</div>
      </div>
      <div class="card">
        <h3>Total Issues</h3>
        <div class="value">${data.issueCounts.total}</div>
      </div>
    </div>
    
    <h2>Category Scores</h2>
    <div class="score-breakdown">
      <div class="score-item">
        <span class="label">Pattern Fidelity (${(data.score.weights.patternFidelity * 100).toFixed(0)}%)</span>
        <span class="value">${data.score.categories.patternFidelity.toFixed(1)}</span>
      </div>
      <div class="score-item">
        <span class="label">Flow & Reachability (${(data.score.weights.flowReachability * 100).toFixed(0)}%)</span>
        <span class="value">${data.score.categories.flowReachability.toFixed(1)}</span>
      </div>
      <div class="score-item">
        <span class="label">Hierarchy & Grouping (${(data.score.weights.hierarchyGrouping * 100).toFixed(0)}%)</span>
        <span class="value">${data.score.categories.hierarchyGrouping.toFixed(1)}</span>
      </div>
      <div class="score-item">
        <span class="label">Responsive Behavior (${(data.score.weights.responsiveBehavior * 100).toFixed(0)}%)</span>
        <span class="value">${data.score.categories.responsiveBehavior.toFixed(1)}</span>
      </div>
    </div>
    
    ${data.score.failReasons.length > 0 ? `
    <h2>Failure Reasons</h2>
    <ul>
      ${data.score.failReasons.map(reason => `<li>${escapeHtml(reason)}</li>`).join('\n      ')}
    </ul>
    ` : ''}
    
    ${renderViewports(data.viewports)}
    
    ${renderIssues('Critical', data.issuesBySeverity.critical)}
    ${renderIssues('Error', data.issuesBySeverity.error)}
    ${renderIssues('Warning', data.issuesBySeverity.warn)}
    ${renderIssues('Info', data.issuesBySeverity.info)}
    
    <div class="footer">
      Generated by LUMA v1.0 on ${new Date().toISOString()}
    </div>
  </div>
</body>
</html>`;
}

function renderViewports(viewports?: ReportData['viewports']): string {
  if (!viewports || viewports.length === 0) {
    return '';
  }
  
  return `
    <h2>Per-Viewport Results</h2>
    <table class="viewport-table">
      <thead>
        <tr>
          <th>Viewport</th>
          <th>Issues</th>
          <th>Responsive Score</th>
        </tr>
      </thead>
      <tbody>
        ${viewports.map(vp => `
        <tr>
          <td><code>${escapeHtml(vp.name)}</code></td>
          <td>${vp.issueCount}</td>
          <td>${vp.responsiveScore.toFixed(1)}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderIssues(title: string, issues: Issue[]): string {
  if (issues.length === 0) {
    return '';
  }
  
  const severity = title.toLowerCase() as 'critical' | 'error' | 'warn' | 'info';
  
  return `
    <h2>${title} Issues (${issues.length})</h2>
    <div class="issue-list">
      ${issues.map(issue => renderIssue(issue, severity)).join('\n      ')}
    </div>
  `;
}

function renderIssue(issue: Issue, severity: 'critical' | 'error' | 'warn' | 'info'): string {
  const detailParts: string[] = [];
  
  if (issue.nodeId) {
    detailParts.push(`Node: <code>${escapeHtml(issue.nodeId)}</code>`);
  }
  if (issue.jsonPointer) {
    detailParts.push(`Path: <code>${escapeHtml(issue.jsonPointer)}</code>`);
  }
  if (issue.viewport) {
    detailParts.push(`Viewport: <code>${escapeHtml(issue.viewport)}</code>`);
  }
  if (issue.source) {
    detailParts.push(`Pattern: <a href="${escapeHtml(issue.source.url)}" target="_blank">${escapeHtml(issue.source.pattern)}</a>`);
  }
  
  return `
      <div class="issue ${severity}">
        <div class="issue-header">
          <span class="issue-id">${escapeHtml(issue.id)}</span>
          <span class="issue-severity severity-${severity}">${severity}</span>
        </div>
        <div class="issue-message">${escapeHtml(issue.message)}</div>
        ${detailParts.length > 0 ? `
        <div class="issue-details">${detailParts.join(' • ')}</div>
        ` : ''}
        ${issue.suggestion ? `
        <div class="issue-suggestion">💡 ${escapeHtml(issue.suggestion)}</div>
        ` : ''}
      </div>`;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
