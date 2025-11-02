import { Command } from 'commander';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

interface AgentVerifyResult {
  version: string;
  checks: Array<{ id: string; passed: boolean; message: string; details?: any }>; // ordered deterministic
  summary: { total: number; passed: number; failed: number };
}

function checkAgentsMd(root: string): { passed: boolean; message: string; details?: any } {
  const path = join(root, 'AGENTS.md');
  if (!existsSync(path)) return { passed: false, message: 'AGENTS.md file missing' };
  const content = readFileSync(path, 'utf-8');
  // Minimal heuristic: ensure governance policy line and bd quick start references
  const hasPolicy = /Never edit .*\.beads\/issues\.jsonl/i.test(content);
  const hasBd = /bd ready|beads/i.test(content);
  const hasPatternsHint = /luma patterns --suggest/i.test(content);
  const passed = hasPolicy && hasBd && hasPatternsHint;
  return { passed, message: passed ? 'AGENTS.md contains required governance & usage hints' : 'AGENTS.md missing one or more required lines', details: { hasPolicy, hasBd, hasPatternsHint } };
}

function checkBeadsIntegrityScript(root: string): { passed: boolean; message: string } {
  const scriptPath = join(root, 'scripts', 'validate-beads-integrity.ps1');
  const passed = existsSync(scriptPath);
  return { passed, message: passed ? 'Integrity validation script present' : 'Missing scripts/validate-beads-integrity.ps1' };
}

function checkPackageJson(root: string): { passed: boolean; message: string; details?: any } {
  const pkgPath = join(root, 'package.json');
  if (!existsSync(pkgPath)) return { passed: false, message: 'package.json missing' };
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  const hasScripts = pkg.scripts && (pkg.scripts['test'] || pkg.scripts['build']);
  return { passed: !!hasScripts, message: hasScripts ? 'package.json contains build/test scripts' : 'package.json missing build/test scripts', details: { scripts: pkg.scripts || {} } };
}

function checkTypescriptConfig(root: string): { passed: boolean; message: string } {
  const tsconfigPath = join(root, 'tsconfig.json');
  const passed = existsSync(tsconfigPath);
  return { passed, message: passed ? 'Found tsconfig.json' : 'tsconfig.json missing' };
}

export function createAgentVerifyCommand(): Command {
  const command = new Command('agent-verify');
  command
    .description('Verify repository agent integration readiness (AGENTS.md, scripts, config)')
    .option('--json', 'Output JSON result')
    .action((options: { json?: boolean }) => {
      const root = process.cwd();
      // Derive version from package.json if available
      let version = '0.0.0';
      try {
        const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf-8'));
        version = pkg.version || version;
      } catch { /* ignore */ }

      const checks: AgentVerifyResult['checks'] = [];
      const push = (id: string, r: { passed: boolean; message: string; details?: any }) => checks.push({ id, passed: r.passed, message: r.message, details: r.details });
      push('agents_md', checkAgentsMd(root));
      push('beads_integrity_script', checkBeadsIntegrityScript(root));
      push('package_json_scripts', checkPackageJson(root));
      push('tsconfig_present', checkTypescriptConfig(root));

      const passed = checks.filter(c => c.passed).length;
      const result: AgentVerifyResult = {
        version,
        checks,
        summary: { total: checks.length, passed, failed: checks.length - passed },
      };

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(`Agent Verify (v${version})\n`);
        for (const c of checks) {
          console.log(`${c.passed ? '✓' : '✗'} ${c.id}: ${c.message}`);
        }
        console.log(`\nSummary: ${result.summary.passed}/${result.summary.total} checks passed`);
        if (result.summary.failed > 0) {
          console.log('Failed checks:');
          for (const c of checks.filter(c => !c.passed)) console.log(` - ${c.id}`);
        }
      }

      // Non-zero exit if any failed for easier CI gating
      if (result.summary.failed > 0) process.exit(2);
    });
  return command;
}
