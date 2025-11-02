#!/usr/bin/env node

/**
 * LUMA - Layout & UX Mockup Analyzer
 * Main entry point for the CLI
 */

import { Command } from 'commander';
import { performance } from 'node:perf_hooks';
import { LUMA_VERSION } from './version.js';
// NOTE: Commands are now lazy-loaded (LUMA-122 performance investigation).
// This reduces upfront spawn time by deferring module parsing until after
// base CLI options are processed. Help output still loads all for completeness.

// Startup timestamp for perf flag
// Capture startup timestamp early for optional perf reporting
const _startupTs = performance.now();

const program = new Command();

program
  .name('luma')
  .description('Layout & UX Mockup Analyzer - CLI tool for evaluating UI scaffolds')
  .version(LUMA_VERSION)
  .option('--perf-startup', 'Print CLI startup (initialization) time in ms');

// Lazy loader definitions. Each entry returns a Promise of a Commander Command.
// The "eager" phase (when --help or no subcommand specified) will still load all
// to ensure documentation completeness.
type LoaderEntry = { name: string; loader: () => Promise<Command> };

const loaderEntries: LoaderEntry[] = [
  { name: 'init', loader: async () => (await import('./cli/init.command.js')).initCommand },
  { name: 'scaffold', loader: async () => (await import('./cli/scaffold.command.js')).createScaffoldCommand() },
  { name: 'ingest', loader: async () => (await import('./cli/ingest.command.js')).createIngestCommand() },
  { name: 'layout', loader: async () => (await import('./cli/layout.command.js')).createLayoutCommand() },
  { name: 'keyboard', loader: async () => (await import('./cli/keyboard.command.js')).createKeyboardCommand() },
  { name: 'flow', loader: async () => (await import('./cli/flow.command.js')).createFlowCommand() },
  { name: 'score', loader: async () => (await import('./cli/score.command.js')).createScoreCommand() },
  { name: 'capabilities', loader: async () => (await import('./cli/capabilities.command.js')).createCapabilitiesCommand() },
  { name: 'schema', loader: async () => (await import('./cli/schema.command.js')).createSchemaCommand() },
  { name: 'patterns', loader: async () => (await import('./cli/patterns.command.js')).createPatternsCommand() },
  { name: 'explain', loader: async () => (await import('./cli/explain.command.js')).createExplainCommand() },
  { name: 'faq', loader: async () => (await import('./cli/faq.command.js')).createFaqCommand() },
  { name: 'report', loader: async () => (await import('./cli/report.command.js')).createReportCommand() },
  { name: 'agent', loader: async () => (await import('./cli/agent.command.js')).createAgentCommand() },
  { name: 'validate', loader: async () => (
    // @ts-ignore - dynamic import resolves after build transpiles .ts to .js
    await import('./cli/validate.command.js')
  ).createValidateCommand() }, // .js for built output; TS source exists
  { name: 'agent-verify', loader: async () => (await import('./cli/agent-verify.command.js')).createAgentVerifyCommand() }
];

// Determine requested subcommand name early (first arg not starting with '-')
const requestedSub = process.argv.slice(2).find(a => !a.startsWith('-'));
const eager = !requestedSub || process.argv.includes('--help');

// Performance breakdown store (only populated when --perf-startup flag used)
const perfBreakdown: { name: string; ms: number }[] = [];

async function registerCommands() {
  for (const entry of loaderEntries) {
    const t0 = performance.now();
    // Load only requested command unless eager/help scenario
    if (eager || entry.name === requestedSub) {
      try {
        const cmd = await entry.loader();
        program.addCommand(cmd);
      } catch (err) {
        // If a dynamic import fails we still continue so other commands work.
        // Optionally could surface error via a hidden diagnostics command.
        if (program.getOptionValue('perfStartup')) {
          perfBreakdown.push({ name: entry.name + ':error', ms: performance.now() - t0 });
        }
        continue;
      }
      const t1 = performance.now();
      if (program.opts().perfStartup) {
        perfBreakdown.push({ name: entry.name, ms: t1 - t0 });
      }
    }
  }
}

// Main async bootstrap then parse.
await registerCommands();
program.parse(process.argv);

// Optional performance output
const rootOpts = program.opts();
if (rootOpts.perfStartup) {
  const dur = performance.now() - _startupTs;
  console.log(`startup_ms=${dur.toFixed(1)}`);
  if (perfBreakdown.length) {
    const totalLoaded = perfBreakdown.reduce((a, b) => a + b.ms, 0);
    // Provide per-command breakdown sorted descending to highlight heavy modules.
    const sorted = perfBreakdown.slice().sort((a, b) => b.ms - a.ms);
    console.log('module_breakdown_ms=' + JSON.stringify({ totalLoaded: Number(totalLoaded.toFixed(1)), modules: sorted.map(m => ({ name: m.name, ms: Number(m.ms.toFixed(1)) })) }));
  }
}

if (!process.argv.slice(2).length) {
  program.outputHelp();
}

// Export types and utils for programmatic use
export * from './types/index.js';
export * from './utils/index.js';
