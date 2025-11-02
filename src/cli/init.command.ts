import { Command } from 'commander';
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

interface ExampleMeta { id: string; file: string }
function discoverExamples(repoRoot: string): ExampleMeta[] {
  const dir = path.join(repoRoot, 'examples');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(f => ({ id: f.replace(/\.json$/, ''), file: path.join(dir, f) }));
}
function copyExample(ex: ExampleMeta, destDir: string) {
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  const dest = path.join(destDir, path.basename(ex.file));
  if (fs.existsSync(dest)) return { copied: false, path: dest, reason: 'exists' };
  fs.copyFileSync(ex.file, dest);
  return { copied: true, path: dest };
}

export const initCommand = new Command('init')
  .description('Initialize LUMA in the current project (AGENTS.md) and optionally copy example scaffolds')
  .option('--example <name>', 'Copy a single example scaffold into ./examples')
  .option('--examples', 'Copy ALL example scaffolds into ./examples (skip existing)')
  .option('--template <name>', 'Copy a scaffold template (crm|dashboard|ecommerce) into the current directory')
  .action((opts: { example?: string; examples?: boolean }) => {
  const cwd = process.cwd();
  const targetDir = process.env.LUMA_INIT_TARGET ? path.resolve(process.env.LUMA_INIT_TARGET) : cwd;
  const agentsPath = path.join(targetDir, 'AGENTS.md');
    // Determine repo root by walking up for package.json (max 5 levels)
    let repoRoot = cwd;
    let probe = cwd;
    for (let i = 0; i < 5; i++) {
      if (fs.existsSync(path.join(probe, 'package.json'))) { repoRoot = probe; break; }
      const parent = path.dirname(probe);
      if (parent === probe) break;
      probe = parent;
    }
    const availableExamples = discoverExamples(repoRoot);
    
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
    
    // Example copy handling
  const destDir = path.join(targetDir, 'examples');
    const reports: Array<{ copied: boolean; path: string; reason?: string }> = [];
    if (opts.example) {
      const match = availableExamples.find(e => e.id === opts.example);
      if (!match) {
        console.error(`\x1b[31m✗ Example '${opts.example}' not found. Available: ${availableExamples.map(e => e.id).join(', ')}\x1b[0m`);
        process.exit(2);
      } else {
        reports.push(copyExample(match, destDir));
      }
    } else if (opts.examples) {
      for (const ex of availableExamples) reports.push(copyExample(ex, destDir));
    }
    
    // Template handling (LUMA-134)
    // Template files live in templates/<name>.scaffold.json and are copied verbatim to targetDir
    const templateName: string | undefined = (process.argv.includes('--template'))
      ? (() => { const idx = process.argv.indexOf('--template'); return process.argv[idx + 1]; })()
      : undefined;
    if (templateName) {
      const allowed = ['crm', 'dashboard', 'ecommerce'];
      if (!allowed.includes(templateName)) {
        console.error(`\x1b[31m✗ Template '${templateName}' not supported. Allowed: ${allowed.join(', ')}\x1b[0m`);
        process.exit(3);
      }
      const templateFile = path.join(repoRoot, 'templates', `${templateName}.scaffold.json`);
      if (!fs.existsSync(templateFile)) {
        console.error(`\x1b[31m✗ Template file missing: ${templateFile}\x1b[0m`);
        process.exit(3);
      }
      const dest = path.join(targetDir, `${templateName}.scaffold.json`);
      if (fs.existsSync(dest)) {
        console.log(`\x1b[33m⚠ Template destination already exists, skipping copy: ${path.basename(dest)}\x1b[0m`);
      } else {
        fs.copyFileSync(templateFile, dest);
        console.log(`\x1b[32m✓ Copied scaffold template: ${path.basename(dest)}\x1b[0m`);
      }
    }

    console.log('\n\x1b[1mNext steps:\x1b[0m');
    console.log('  • Review AGENTS.md to ensure the content is properly integrated');
  if (!opts.example && !opts.examples) console.log('  • (Optional) Re-run with --example <name> or --examples to copy scaffold examples');
    if (!templateName) console.log('  • (Optional) Re-run with --template <crm|dashboard|ecommerce> to add a scaffold template');
    console.log('  • Run `luma --help` to see available commands');
    if (reports.length) {
      console.log('\n\x1b[1mExample copy results:\x1b[0m');
      for (const r of reports) {
        if (r.copied) console.log(`  ✓ Copied ${path.basename(r.path)}`); else console.log(`  • Skipped ${path.basename(r.path)} (exists)`);
      }
    }
    if (!availableExamples.length) console.log('\n  (No repository examples discovered)');
    console.log('\n');
  });
