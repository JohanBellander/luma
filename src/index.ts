#!/usr/bin/env node

/**
 * LUMA - Layout & UX Mockup Analyzer
 * Main entry point for the CLI
 */

import { Command } from 'commander';
import { createIngestCommand } from './cli/ingest.command.js';
import { createLayoutCommand } from './cli/layout.command.js';
import { createKeyboardCommand } from './cli/keyboard.command.js';

const program = new Command();

program
  .name('luma')
  .description('Layout & UX Mockup Analyzer - CLI tool for evaluating UI scaffolds')
  .version('1.0.0');

// Add commands
program.addCommand(createIngestCommand());
program.addCommand(createLayoutCommand());
program.addCommand(createKeyboardCommand());

// Placeholder for commands to be added in Phase 2+
program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}

// Export types and utils for programmatic use
export * from './types/index.js';
export * from './utils/index.js';
