#!/usr/bin/env node

/**
 * LUMA - Layout & UX Mockup Analyzer
 * Main entry point for the CLI
 */

import { Command } from 'commander';
import { performance } from 'node:perf_hooks';
import { LUMA_VERSION } from './version.js';
import { createIngestCommand } from './cli/ingest.command.js';
import { createLayoutCommand } from './cli/layout.command.js';
import { createKeyboardCommand } from './cli/keyboard.command.js';
import { createFlowCommand } from './cli/flow.command.js';
import { createScoreCommand } from './cli/score.command.js';
import { createCapabilitiesCommand } from './cli/capabilities.command.js';
import { createSchemaCommand } from './cli/schema.command.js';
import { createPatternsCommand } from './cli/patterns.command.js';
import { createExplainCommand } from './cli/explain.command.js';
import { createFaqCommand } from './cli/faq.command.js';
import { createReportCommand } from './cli/report.command.js';
import { initCommand } from './cli/init.command.js';
import { createScaffoldCommand } from './cli/scaffold.command.js';
import { createAgentCommand } from './cli/agent.command.js';
import { createValidateCommand } from './cli/validate.command.js';
import { createAgentVerifyCommand } from './cli/agent-verify.command.js';

// Startup timestamp for perf flag
// Capture startup timestamp early for optional perf reporting
const _startupTs = performance.now();

const program = new Command();

program
  .name('luma')
  .description('Layout & UX Mockup Analyzer - CLI tool for evaluating UI scaffolds')
  .version(LUMA_VERSION)
  .option('--perf-startup', 'Print CLI startup (initialization) time in ms');

// Add commands
program.addCommand(initCommand);
program.addCommand(createScaffoldCommand());
program.addCommand(createIngestCommand());
program.addCommand(createLayoutCommand());
program.addCommand(createKeyboardCommand());
program.addCommand(createFlowCommand());
program.addCommand(createScoreCommand());
program.addCommand(createCapabilitiesCommand());
program.addCommand(createSchemaCommand());
program.addCommand(createPatternsCommand());
program.addCommand(createExplainCommand());
program.addCommand(createFaqCommand());
program.addCommand(createReportCommand());
program.addCommand(createAgentCommand());
program.addCommand(createValidateCommand());
program.addCommand(createAgentVerifyCommand());

// Placeholder for commands to be added in Phase 2+
program.parse(process.argv);

// Optional performance output
const rootOpts = program.opts();
if (rootOpts.perfStartup) {
  const dur = performance.now() - _startupTs;
  // Use minimal output to avoid noise for measurement scripts
  console.log(`startup_ms=${dur.toFixed(1)}`);
}

if (!process.argv.slice(2).length) {
  program.outputHelp();
}

// Export types and utils for programmatic use
export * from './types/index.js';
export * from './utils/index.js';
