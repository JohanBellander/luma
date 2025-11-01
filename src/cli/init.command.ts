import {Command} from 'commander';
import * as fs from 'fs';
import * as path from 'path';

// Strict agent guidance enforcing mandatory LUMA usage and verifiable compliance.
// Sentinel token used for automated detection of proper workflow adherence.
const agentsContent = `# Agent Instructions (Strict Mode)

MANDATORY: Use the **LUMA CLI** for ALL scaffold analysis. Manual reasoning without producing artifacts is non-compliant.

Sentinel: AGENT-COMPLIANCE-V1
You MUST echo this exact token inside a JSON compliance block after every completed task:
\`{"lumaCompliance":{"sentinel":"AGENT-COMPLIANCE-V1","ingestRun":"<run-id>","flowRun":"<run-id>","scoreRun":"<run-id>"}}\`

## Runtime Knowledge (Query, Do Not Memorize)
Always fetch fresh data (request only what you need):
  luma agent --sections quick,rules --json
  luma agent --get rules.patterns --json
  luma explain --topic scaffold-contract

## Non-Negotiable Workflow
1. Generate or modify scaffold ONLY after validating previous version.
2. Run in order (single run folder):
   luma ingest <scaffold> --json
   luma layout <scaffold> --viewports 320x640,768x1024 --json
   luma keyboard <scaffold> --json
   luma flow <scaffold> --patterns auto --json   (or explicit list)
   luma score .ui/runs/<run-id> --json
3. Use bd to manage tasks:
   bd ready --json
   bd update <id> --status in_progress --json
   bd close <id> --reason "...analysis summary..." --json

## Scaffold Generation
  luma scaffold new --pattern login-form --out login.json --title "Sign In"
  luma scaffold new --pattern form-basic --out form.json
Validate immediately:
  luma ingest form.json --json

## Compliance Checklist (ALL REQUIRED)
- Ingest artifact exists (.ui/runs/<run-id>/ingest.json)
- Flow artifact lists patterns validated
- Score artifact overall >= 85 and MUST failures == 0 (or task flagged as blocked)
- Agent emitted compliance JSON block (sentinel present)
- Issue close reason cites at least one real MUST/SHOULD rule id or component issue from artifacts

If ANY item missing: self-open a bug:
  bd create "Non-compliance: <reason>" -t bug -p 1 --json

## Forbidden
- Editing .beads/issues.jsonl directly
- Fabricating pattern results or scores
- Skipping ingest/layout/flow before suggesting code changes
- Guessing pattern names not shown by: luma patterns --list
- Deep array indexing in dot paths (not yet supported): rules.patterns[0].must[0]

## Allowed / Encouraged
- Minimal section retrieval: luma agent --sections quick,patterns --json
- Re-use run folder IDs for sequential commands
- Creating discovered-from issues when uncovering new tasks

## Verification Signals (Respond After Each Task)
1. Short summary (<=300 chars)
2. Compliance JSON block (with sentinel)
3. List of actual commands run

Example block:
\`{"lumaCompliance":{"sentinel":"AGENT-COMPLIANCE-V1","ingestRun":"2025-11-01T164255Z","flowRun":"2025-11-01T164255Z","scoreRun":"2025-11-01T164255Z"}}\`

## Escalation Rules
- If median luma flow > 1200ms over 5 runs: open performance issue.
- If a MUST failure persists across 2 consecutive iterations: open blocking issue & halt feature work.

## Governance
Issue tracking: use bd only.
Integrity check:
  pwsh scripts/validate-beads-integrity.ps1

## Reproducibility
Capture envelopes with --json for deterministic agent context across versions.

Full envelope (on demand):
  luma agent --sections all --json
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
