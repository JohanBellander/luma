import {Command} from 'commander';
import * as fs from 'fs';
import * as path from 'path';

// Strict agent guidance enforcing mandatory LUMA usage and verifiable compliance.
// Scaffold-first: absolutely no HTML/CSS/JS/JSX before full artifact validation.
const agentsContent = `# Agent Instructions (Strict Mode)

MANDATORY: Use the **LUMA CLI** for ALL scaffold analysis. Manual reasoning without producing artifacts is non-compliant.

CRITICAL RULE: Do NOT generate HTML, JSX/TSX, CSS, design tokens, or component code BEFORE producing and validating a scaffold with the required LUMA artifacts (ingest/layout/keyboard/flow/score). Scaffold-first always.

Sentinel: AGENT-COMPLIANCE-V1
You MUST echo this exact token inside a JSON compliance block after every completed task:
\`{"lumaCompliance":{"sentinel":"AGENT-COMPLIANCE-V1","ingestRun":"<run-id>","flowRun":"<run-id>","scoreRun":"<run-id>"}}\`

## Runtime Knowledge (Query, Do Not Memorize)
Always fetch fresh data (request only what you need):
  luma agent --sections quick,rules --json
  luma agent --get rules.patterns --json
  luma explain --topic scaffold-contract

## Non-Negotiable Workflow
1. Collect requirements / clarify intent (no UI code yet).
2. Draft / modify a scaffold JSON (minimal viable structure).
3. Run in strict order (single run folder):
   luma ingest <scaffold.json> --json
   luma layout <scaffold.json> --viewports 320x640,768x1024 --json
   luma keyboard <scaffold.json> --json
   luma flow <scaffold.json> --patterns auto --json
   luma score .ui/runs/<run-id> --json
4. If score passes (>=85, zero MUST failures) THEN and ONLY THEN produce implementation code (HTML/React/etc) as a separate phase.
5. When changing scaffold again, repeat the analysis sequence BEFORE adjusting implementation.

## Compliance Checklist (ALL REQUIRED BEFORE ANY UI CODE)
- ingest.json present
- layout.json present
- keyboard.json present
- flow.json includes validated patterns
- score.json overall >=85 & zero MUST failures (or task explicitly blocked)
- Compliance JSON block (sentinel present)

If ANY item missing: Fix the scaffold or rerun analysis. Do NOT output HTML/JSX/CSS.

## Forbidden
- Producing HTML/JSX/CSS/component code before compliant artifacts exist
- Fabricating pattern results or scores
- Skipping ingest/layout/keyboard/layout/flow/score sequence
- Using pattern names not in: luma patterns --list
- Dot path deep array indexing (e.g. rules.patterns[0].must[0])

## Allowed / Encouraged
- Minimal section retrieval: luma agent --sections quick,patterns --json
- Re-use run folder IDs across steps
- Provide concise diffs of scaffold changes (structure only) before re-analysis

## Verification Signals (Respond After Each Task)
1. Short summary (<=300 chars)
2. Compliance JSON block (with sentinel)
3. Exact commands run (copyable)
4. NEXT ACTION (if not compliant)

Example block:
\`{"lumaCompliance":{"sentinel":"AGENT-COMPLIANCE-V1","ingestRun":"2025-11-01T164255Z","flowRun":"2025-11-01T164255Z","scoreRun":"2025-11-01T164255Z"}}\`

## Escalation Rules
- Median luma flow > 1200ms over 5 runs: flag performance concern.
- MUST failure persists for 2 iterations: halt implementation; refine scaffold.

## Full Envelope (On Demand)
  luma agent --sections all --json

## Incorrect vs Correct Examples

INCORRECT (non-compliant):
  (1) "Here's the full HTML for the login form"  <-- BEFORE any ingest/layout/keyboard/flow/score
  (2) luma ingest login.json (after code)   <-- Late analysis

CORRECT (compliant):
  (1) Draft login.json scaffold (structure only)
  (2) luma ingest login.json --json
  (3) luma layout login.json --viewports 320x640,768x1024 --json
  (4) luma keyboard login.json --json
  (5) luma flow login.json --patterns auto --json
  (6) luma score .ui/runs/<run-id> --json  (score >=85, no MUST failures)
  (7) Produce HTML/React component (implementation phase)

## HTML / UI Implementation Gate
Only after passing compliance checklist may you output any UI code. If you must propose future implementation, describe it textually (no tags) until artifacts are validated.

## Reproducibility
Capture envelopes with --json for deterministic agent context across versions.

By following Strict Mode you ensure reproducible, auditable, and token-efficient AI agent operations. Scaffold-first preserves correctness and prevents premature UI divergence.
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
