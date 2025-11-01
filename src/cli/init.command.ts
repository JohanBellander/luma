import {Command} from 'commander';
import * as fs from 'fs';
import * as path from 'path';

// Concise agent guidance replacing previous large static block.
// Refer to dynamic runtime knowledge via `luma agent` instead of embedding rules here.
const agentsContent = `# Agent Instructions

This repository uses **LUMA** for UI scaffold analysis. This file is intentionally concise.
Use the dynamic runtime knowledge system instead of embedding large static docs.

## Runtime Knowledge (Up-To-Date)
Commands (request only what you need):
  luma agent --sections list
  luma agent --sections quick,rules
  luma agent --sections quick,rules --json   (JSON envelope)
  luma agent --get quick.pipeline            (dot path retrieval)
  luma explain --topic scaffold-contract     (scaffold contract)

## Scaffold Generation
  luma scaffold new --pattern login-form --out login.json --title "Sign In"
  luma scaffold new --pattern form-basic --out form.json
Validate:
  luma ingest form.json

## Pipeline (single run folder)
  luma ingest form.json; luma layout form.json --viewports 320x640,768x1024; luma keyboard form.json; luma flow form.json --patterns Form.Basic
Then score:
  luma score .ui/runs/<run-id>

## Pattern Selection Checklist
  luma patterns --suggest ui/screens/<screen>.mock.json --json
  luma flow ui/screens/<screen>.mock.json --patterns Form.Basic,Table.Simple,Guided.Flow
Include disclosure hints: add behaviors.disclosure for collapsible/hidden sections.

## Governance
Issue tracking: use bd only.
Integrity check:
  pwsh scripts/validate-beads-integrity.ps1

## Reproducibility
Capture envelopes with --json for deterministic agent context across versions.

## Rules Summary
1. Design scaffold first.
2. Validate (ingest, layout, keyboard, flow) before coding.
3. Require score >= 85 & zero MUST failures.
4. One scaffold node -> one UI element.
5. Feature freeze after approval (updates require re-validation).
6. No hidden forms/modals unless in scaffold.
7. Prefer explicit behaviors.disclosure hints.
Red flags (STOP & update scaffold): "Obviously needs", "Users expect", "I'll just add".

Full reference (large): luma agent --sections all
`;

export const initCommand = new Command('init')
  .description('Initialize LUMA in the current project by creating/updating AGENTS.md')
  .action(() => {
    const cwd = process.cwd();
    const agentsPath = path.join(cwd, 'AGENTS.md');
    
    let existingContent = '';
    let fileExists = false;
    
    // Check if AGENTS.md exists
    try {
      if (fs.existsSync(agentsPath)) {
        existingContent = fs.readFileSync(agentsPath, 'utf-8');
        fileExists = true;
      }
    } catch (error) {
      // File doesn't exist or can't be read
    }
    
    // Check if LUMA section already exists
    if (existingContent.includes('# Agent Instructions') && existingContent.includes('Runtime Knowledge')) {
      console.log('\x1b[33m⚠ LUMA section already exists in AGENTS.md\x1b[0m');
      console.log('No changes made. To update, manually edit AGENTS.md.');
      return;
    }
    
    // Add LUMA section to AGENTS.md
    let newContent: string;
    if (fileExists && existingContent.trim()) {
      // Append to existing file
      newContent = existingContent.trimEnd() + '\n\n' + agentsContent + '\n';
      console.log('\x1b[32m✓ Added LUMA section to existing AGENTS.md\x1b[0m');
    } else {
      // Create new file - agentsContent already has the header
      newContent = agentsContent + '\n';
      console.log('\x1b[32m✓ Created AGENTS.md with LUMA section\x1b[0m');
    }
    
    try {
      fs.writeFileSync(agentsPath, newContent, 'utf-8');
    } catch (error) {
      console.error('\x1b[31m✗ Failed to write AGENTS.md:\x1b[0m', error);
      process.exit(1);
    }
    
    console.log('\n\x1b[1mNext steps:\x1b[0m');
    console.log('  • Review AGENTS.md to ensure the content is properly integrated');
    console.log('  • Create examples/ folder with sample scaffolds');
    console.log('  • Run \`luma --help\` to see available commands\n');
  });
