#!/usr/bin/env node

/**
 * LUMA - Layout & UX Mockup Analyzer
 * Main entry point for the CLI
 */

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
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

// Read version from package.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = join(__dirname, '../package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

const program = new Command();

program
  .name('luma')
  .description('Layout & UX Mockup Analyzer - CLI tool for evaluating UI scaffolds')
  .version(packageJson.version);

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

// Placeholder for commands to be added in Phase 2+
program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}

// Export types and utils for programmatic use
export * from './types/index.js';
export * from './utils/index.js';
