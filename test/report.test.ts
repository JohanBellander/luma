/**
 * Tests for report generation
 */

import { describe, it, expect } from 'vitest';
import { renderReport } from '../src/core/report/render.js';
import { generateHtml } from '../src/core/report/template.js';
import type { ReportData } from '../src/core/report/template.js';
import type { Issue } from '../src/types/issue.js';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

describe('Report Generation', () => {
  describe('generateHtml', () => {
    it('should generate valid HTML with all sections', () => {
      const data: ReportData = {
        runId: 'test-run-2025-10-27',
        score: {
          categories: {
            patternFidelity: 85.0,
            flowReachability: 90.0,
            hierarchyGrouping: 95.0,
            responsiveBehavior: 80.0,
          },
          weights: {
            patternFidelity: 0.45,
            flowReachability: 0.25,
            hierarchyGrouping: 0.20,
            responsiveBehavior: 0.10,
          },
          overall: 87.5,
          criteria: {
            noMustFailures: true,
            noCriticalFlowErrors: true,
            minOverallScore: 85,
          },
          pass: true,
          failReasons: [],
        },
        issuesBySeverity: {
          critical: [],
          error: [],
          warn: [],
          info: [],
        },
        issueCounts: {
          critical: 0,
          error: 0,
          warn: 0,
          info: 0,
          total: 0,
        },
      };
      
      const html = generateHtml(data);
      
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<title>LUMA Report - test-run-2025-10-27</title>');
      expect(html).toContain('PASS ✓');
      expect(html).toContain('87.5');
      expect(html).toContain('Pattern Fidelity');
      expect(html).toContain('Flow & Reachability');
    });
    
    it('should show failure state correctly', () => {
      const data: ReportData = {
        runId: 'test-run-fail',
        score: {
          categories: {
            patternFidelity: 40.0,
            flowReachability: 70.0,
            hierarchyGrouping: 80.0,
            responsiveBehavior: 60.0,
          },
          weights: {
            patternFidelity: 0.45,
            flowReachability: 0.25,
            hierarchyGrouping: 0.20,
            responsiveBehavior: 0.10,
          },
          overall: 58.5,
          criteria: {
            noMustFailures: true,
            noCriticalFlowErrors: true,
            minOverallScore: 85,
          },
          pass: false,
          failReasons: ['Overall score 58.5 below minimum 85'],
        },
        issuesBySeverity: {
          critical: [],
          error: [],
          warn: [],
          info: [],
        },
        issueCounts: {
          critical: 0,
          error: 0,
          warn: 0,
          info: 0,
          total: 0,
        },
      };
      
      const html = generateHtml(data);
      
      expect(html).toContain('FAIL ✗');
      expect(html).toContain('58.5');
      expect(html).toContain('Failure Reasons');
      expect(html).toContain('Overall score 58.5 below minimum 85');
    });
    
    it('should display issues with proper severity', () => {
      const criticalIssue: Issue = {
        id: 'unreachable-node',
        severity: 'critical',
        message: 'Node cannot be reached in keyboard flow',
        nodeId: 'submit-button',
        jsonPointer: '/screen/root/children/0/actions/0',
      };
      
      const warnIssue: Issue = {
        id: 'spacing-cluster',
        severity: 'warn',
        message: 'Inconsistent spacing detected',
        details: { variance: 12.5 },
        suggestion: 'Use consistent spacing values',
      };
      
      const data: ReportData = {
        runId: 'test-issues',
        score: {
          categories: {
            patternFidelity: 70.0,
            flowReachability: 70.0,
            hierarchyGrouping: 90.0,
            responsiveBehavior: 80.0,
          },
          weights: {
            patternFidelity: 0.45,
            flowReachability: 0.25,
            hierarchyGrouping: 0.20,
            responsiveBehavior: 0.10,
          },
          overall: 73.5,
          criteria: {
            noMustFailures: true,
            noCriticalFlowErrors: false,
            minOverallScore: 85,
          },
          pass: false,
          failReasons: ['Critical flow errors detected'],
        },
        issuesBySeverity: {
          critical: [criticalIssue],
          error: [],
          warn: [warnIssue],
          info: [],
        },
        issueCounts: {
          critical: 1,
          error: 0,
          warn: 1,
          info: 0,
          total: 2,
        },
      };
      
      const html = generateHtml(data);
      
      expect(html).toContain('Critical Issues (1)');
      expect(html).toContain('unreachable-node');
      expect(html).toContain('Node cannot be reached in keyboard flow');
      expect(html).toContain('submit-button');
      expect(html).toContain('Warning Issues (1)');
      expect(html).toContain('spacing-cluster');
      expect(html).toContain('Use consistent spacing values');
    });
    
    it('should display viewport results', () => {
      const data: ReportData = {
        runId: 'test-viewports',
        score: {
          categories: {
            patternFidelity: 85.0,
            flowReachability: 90.0,
            hierarchyGrouping: 95.0,
            responsiveBehavior: 75.0,
          },
          weights: {
            patternFidelity: 0.45,
            flowReachability: 0.25,
            hierarchyGrouping: 0.20,
            responsiveBehavior: 0.10,
          },
          overall: 86.5,
          criteria: {
            noMustFailures: true,
            noCriticalFlowErrors: true,
            minOverallScore: 85,
          },
          pass: true,
          failReasons: [],
        },
        issuesBySeverity: {
          critical: [],
          error: [],
          warn: [],
          info: [],
        },
        issueCounts: {
          critical: 0,
          error: 0,
          warn: 0,
          info: 0,
          total: 0,
        },
        viewports: [
          { name: '320x640', issueCount: 2, responsiveScore: 60.0 },
          { name: '1024x768', issueCount: 0, responsiveScore: 100.0 },
        ],
      };
      
      const html = generateHtml(data);
      
      expect(html).toContain('Per-Viewport Results');
      expect(html).toContain('320x640');
      expect(html).toContain('1024x768');
      expect(html).toContain('60.0');
      expect(html).toContain('100.0');
    });
  });
  
  describe('renderReport', () => {
    const testDir = join(process.cwd(), '.test-runs', 'report-test');
    
    it('should throw error if score.json missing', () => {
      expect(() => renderReport(testDir)).toThrow('score.json not found');
    });
    
    it('should aggregate data from run folder', () => {
      // Create test run folder
      mkdirSync(testDir, { recursive: true });
      
      try {
        // Write test artifacts
        writeFileSync(join(testDir, 'score.json'), JSON.stringify({
          categories: {
            patternFidelity: 85.0,
            flowReachability: 90.0,
            hierarchyGrouping: 95.0,
            responsiveBehavior: 80.0,
          },
          weights: {
            patternFidelity: 0.45,
            flowReachability: 0.25,
            hierarchyGrouping: 0.20,
            responsiveBehavior: 0.10,
          },
          overall: 87.5,
          criteria: {
            noMustFailures: true,
            noCriticalFlowErrors: true,
            minOverallScore: 85,
          },
          pass: true,
          failReasons: [],
        }));
        
        writeFileSync(join(testDir, 'ingest.json'), JSON.stringify({
          errors: [{
            id: 'invalid-field',
            severity: 'error',
            message: 'Invalid field type',
            nodeId: 'field-1',
          }],
          warnings: [],
        }));
        
        writeFileSync(join(testDir, 'layout_320x640.json'), JSON.stringify({
          issues: [{
            id: 'overflow-x',
            severity: 'warn',
            message: 'Horizontal overflow detected',
            viewport: '320x640',
          }],
        }));
        
        writeFileSync(join(testDir, 'keyboard.json'), JSON.stringify({
          issues: [{
            id: 'unreachable-node',
            severity: 'critical',
            message: 'Node cannot be reached',
            nodeId: 'submit',
          }],
        }));
        
        const html = renderReport(testDir);
        
        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('PASS ✓');
        expect(html).toContain('87.5');
        expect(html).toContain('invalid-field');
        expect(html).toContain('overflow-x');
        expect(html).toContain('unreachable-node');
        expect(html).toContain('320x640');
      } finally {
        // Cleanup
        rmSync(testDir, { recursive: true, force: true });
      }
    });
  });
});
