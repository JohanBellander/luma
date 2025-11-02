/**
 * Capabilities command - lists all LUMA commands, exit codes, and defaults
 * Per spec Section 9.7: luma capabilities --json
 */

import { Command } from 'commander';

interface CommandInfo {
  name: string;
  description: string;
  arguments: string[];
  options: Array<{ flag: string; description: string; default?: string }>;
}

interface ExitCodeInfo {
  code: number;
  name: string;
  description: string;
}

interface CapabilitiesOutput {
  version: string;
  commands: CommandInfo[];
  exitCodes: ExitCodeInfo[];
  defaults: {
    scoreWeights: {
      patternFidelity: number;
      flowReachability: number;
      hierarchyGrouping: number;
      responsiveBehavior: number;
    };
    passCriteria: {
      noMustFailures: boolean;
      noCriticalFlowErrors: boolean;
      minOverallScore: number;
    };
    runFolderPrefix: string;
  };
}

/**
 * Create the 'capabilities' command.
 * 
 * Usage: luma capabilities --json
 */
export function createCapabilitiesCommand(): Command {
  const command = new Command('capabilities');

  command
    .description('List LUMA commands, exit codes, and defaults')
    .option('--json', 'Output as JSON')
    .action((options: { json?: boolean }) => {
      const output: CapabilitiesOutput = {
        version: '1.0.0',
        commands: [
          {
            name: 'ingest',
            description: 'Validate and normalize a scaffold JSON file',
            arguments: ['<file>'],
            options: [
              { flag: '--json', description: 'Output result as JSON' },
            ],
          },
          {
            name: 'layout',
            description: 'Compute frames and layout issues per viewport',
            arguments: ['<file>'],
            options: [
              { flag: '--viewports <WxH,...>', description: 'Comma-separated viewport dimensions', default: '375x667,1024x768' },
              { flag: '--json', description: 'Output result as JSON' },
            ],
          },
          {
            name: 'keyboard',
            description: 'Analyze keyboard tab sequence and flow',
            arguments: ['<file>'],
            options: [
              { flag: '--state <name>', description: 'Form state to analyze' },
              { flag: '--viewport <width>', description: 'Viewport width for responsive overrides' },
              { flag: '--json', description: 'Output result as JSON' },
            ],
          },
          {
            name: 'flow',
            description: 'Validate scaffold against UX patterns',
            arguments: ['<file>'],
            options: [
              { flag: '--patterns <list>', description: 'Comma-separated pattern names (required)' },
              { flag: '--json', description: 'Output result as JSON' },
            ],
          },
          {
            name: 'score',
            description: 'Aggregate scores from analysis artifacts',
            arguments: ['<run-dir>'],
            options: [
              { flag: '--weights <json>', description: 'Custom category weights as JSON' },
              { flag: '--json', description: 'Output result as JSON' },
            ],
          },
          {
            name: 'capabilities',
            description: 'List LUMA commands, exit codes, and defaults',
            arguments: [],
            options: [
              { flag: '--json', description: 'Output result as JSON' },
            ],
          },
          {
            name: 'schema',
            description: 'Summarize input/output schema fields',
            arguments: [],
            options: [
              { flag: '--json', description: 'Output result as JSON' },
            ],
          },
          {
            name: 'patterns',
            description: 'List or show UX pattern details',
            arguments: [],
            options: [
              { flag: '--list', description: 'List all available patterns' },
              { flag: '--show <name>', description: 'Show details for specific pattern' },
              { flag: '--json', description: 'Output result as JSON' },
            ],
          },
          {
            name: 'explain',
            description: 'Explain LUMA concepts and algorithms',
            arguments: [],
            options: [
              { flag: '--topic <name>', description: 'Topic to explain (required)' },
              { flag: '--json', description: 'Output result as JSON' },
            ],
          },
          {
            name: 'faq',
            description: 'Frequently asked questions',
            arguments: [],
            options: [
              { flag: '--json', description: 'Output result as JSON' },
            ],
          },
          {
            name: 'agent-verify',
            description: 'Verify agent integration readiness (AGENTS.md, scripts, config)',
            arguments: [],
            options: [
              { flag: '--json', description: 'Output result as JSON' },
            ],
          },
        ],
        exitCodes: [
          { code: 0, name: 'SUCCESS', description: 'No blocking issues' },
          { code: 2, name: 'INVALID_INPUT', description: 'Schema or ingest error' },
          { code: 3, name: 'BLOCKING_ISSUES', description: 'MUST failures or critical flow/layout errors' },
          { code: 4, name: 'INTERNAL_ERROR', description: 'Internal tool error' },
          { code: 5, name: 'VERSION_MISMATCH', description: 'Unsupported schemaVersion' },
        ],
        defaults: {
          scoreWeights: {
            patternFidelity: 0.45,
            flowReachability: 0.25,
            hierarchyGrouping: 0.20,
            responsiveBehavior: 0.10,
          },
          passCriteria: {
            noMustFailures: true,
            noCriticalFlowErrors: true,
            minOverallScore: 85,
          },
          runFolderPrefix: '.ui/runs/',
        },
      };

      if (options.json) {
        console.log(JSON.stringify(output, null, 2));
      } else {
        console.log('LUMA v' + output.version);
        console.log('\nCommands:');
        for (const cmd of output.commands) {
          console.log(`  ${cmd.name} - ${cmd.description}`);
        }
        console.log('\nExit Codes:');
        for (const code of output.exitCodes) {
          console.log(`  ${code.code} (${code.name}) - ${code.description}`);
        }
        console.log('\nDefaults:');
        console.log('  Score Weights:', JSON.stringify(output.defaults.scoreWeights));
        console.log('  Pass Criteria:', JSON.stringify(output.defaults.passCriteria));
      }
    });

  return command;
}
