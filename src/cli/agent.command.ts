/**
 * Agent command - runtime knowledge envelope (LUMA-84, LUMA-85, LUMA-86, LUMA-87)
 *
 * Flags:
 *  --sections <csv>   Comma separated list of section names to include
 *  --all              Shortcut for including all sections (in canonical order)
 *  --get <dotPath>    Retrieve only a specific dot path from the generated envelope (simple, no array indexing)
 *  --list-sections    List available section names then exit
 *  --json             Output JSON (otherwise pretty text)
 *
 * Exit Codes:
 *  0 success
 *  2 invalid input (unknown section, conflicting flags, bad dot path)
 */

import { Command } from 'commander';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXIT_INVALID_INPUT } from '../utils/exit-codes.js';
import { getAllPatterns } from '../core/patterns/pattern-registry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Placeholder section identifiers (will be populated in later issues LUMA-85+)
export const AGENT_SECTION_NAMES = [
  'quick',        // Quick usage / minimal cheat sheet
  'workflow',     // Recommended pipeline stages (LUMA-85)
  'rules',        // Pattern rule ids per pattern (LUMA-85)
  'patterns',     // UX pattern overview (LUMA-86)
  'components',   // Component schema quick refs (LUMA-86)
  'examples',     // Example scaffold metadata (LUMA-86)
  'links',        // Helpful references (specs, docs) (LUMA-87)
  'meta'          // Build/platform metadata (LUMA-87)
];

interface AgentEnvelope {
  version: string;
  generatedAt: string; // ISO8601
  sections: Record<string, unknown>;
}

interface ErrorJSON {
  code: string; // MACHINE code e.g. INVALID_SECTION
  message: string; // Human readable
  details?: any;
}

// ---- Section Assemblers (LUMA-85) -------------------------------------------------

function assembleQuick(): Record<string, unknown> {
  return {
    usage: 'luma <command> [options] <file-or-run-folder>',
    primaryCommands: ['ingest', 'layout', 'keyboard', 'flow', 'score', 'report'],
    recommendedOrder: ['ingest', 'layout', 'keyboard', 'flow', 'score', 'report'],
  };
}

interface WorkflowStage {
  name: string;
  description: string;
  command: string;
  produces: string[];
}

function assembleWorkflow(): Record<string, unknown> {
  const stages: WorkflowStage[] = [
    {
      name: 'Ingest',
      description: 'Validate & normalize scaffold JSON',
      command: 'luma ingest <scaffold>',
      produces: ['ingest.json'],
    },
    {
      name: 'Layout',
      description: 'Compute frames for nodes across viewports',
      command: 'luma layout <scaffold> --viewports <list>',
      produces: ['layout_<viewport>.json'],
    },
    {
      name: 'Keyboard',
      description: 'Analyze focus / tab order and reachability',
      command: 'luma keyboard <scaffold>',
      produces: ['keyboard.json'],
    },
    {
      name: 'Flow',
      description: 'Validate activated UX patterns (MUST/SHOULD)',
      command: 'luma flow <scaffold> [--patterns names]',
      produces: ['flow.json'],
    },
    {
      name: 'Score',
      description: 'Aggregate category & pattern scores',
      command: 'luma score <run-folder>',
      produces: ['score.json'],
    },
    {
      name: 'Report',
      description: 'Generate HTML summary report',
      command: 'luma report <run-folder>',
      produces: ['report.html'],
    },
  ];
  return { stages };
}

function assembleRules(): Record<string, unknown> {
  // Patterns sorted by canonical name
  const patterns = getAllPatterns()
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(p => ({
      name: p.name,
      must: p.must.map(r => r.id),
      should: p.should.map(r => r.id),
    }));
  return { patterns };
}

// ---- LUMA-86 Additional Sections --------------------------------------------------

interface PatternSummaryEntry {
  name: string;
  mustIds: string[];
  shouldIds: string[];
  counts: { must: number; should: number };
}

function assemblePatterns(): Record<string, unknown> {
  const patterns: PatternSummaryEntry[] = getAllPatterns()
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(p => ({
      name: p.name,
      mustIds: p.must.map(r => r.id),
      shouldIds: p.should.map(r => r.id),
      counts: { must: p.must.length, should: p.should.length },
    }));
  return { patterns };
}

interface ComponentSummaryEntry {
  name: string;
  requiredProps: string[];
  optionalProps: string[];
}

// Read component-schemas.json once lazily (cached) to avoid repeated IO.
let componentSchemasCache: any | undefined;
function loadComponentSchemas(): any {
  if (!componentSchemasCache) {
    const path = join(__dirname, '../data/component-schemas.json');
    componentSchemasCache = JSON.parse(readFileSync(path, 'utf-8'));
  }
  return componentSchemasCache;
}

function assembleComponents(): Record<string, unknown> {
  const schemas = loadComponentSchemas();
  const components: ComponentSummaryEntry[] = Object.keys(schemas)
    .sort()
    .map(name => {
      const schema = schemas[name];
      const required: string[] = Array.isArray(schema.required) ? schema.required.slice().sort() : [];
      // Derive optional by diffing properties keys vs required
      const propertyKeys = schema.properties ? Object.keys(schema.properties) : [];
      const optional = propertyKeys.filter(k => !required.includes(k)).sort();
      return { name, requiredProps: required, optionalProps: optional };
    });
  return { components };
}

interface ExampleMetaEntry {
  id: string; // filename without extension
  file: string; // relative path from repo root
  description: string;
  patternsIllustrated: string[];
}

const EXAMPLE_PATTERN_HEURISTICS: { [id: string]: string[] } = {
  'happy-form': ['Form.Basic'],
  'pattern-failures': ['Form.Basic'],
  'overflow-table': ['Table.Simple'],
  'responsive-demo': ['Table.Simple', 'Form.Basic'],
  'login': ['Form.Basic'],
  // progressive disclosure examples could be added in future if present
};

const EXAMPLE_DESCRIPTIONS: { [id: string]: string } = {
  'happy-form': 'Valid form scaffold (expected pass)',
  'pattern-failures': 'Form with MUST violations to illustrate failures',
  'overflow-table': 'Table demonstrating horizontal overflow scenario',
  'responsive-demo': 'Demo scaffold with multiple responsive behaviors',
  'login': 'Login form example',
  'keyboard-issues': 'Scaffold exhibiting keyboard flow issues',
  'broken-form': 'Intentionally broken form scaffold for ingest errors',
  'invalid-version': 'Scaffold with invalid schemaVersion to test version check',
};

function assembleExamples(): Record<string, unknown> {
  const examplesDir = join(__dirname, '../../examples');
  let files: string[] = [];
  try {
    files = readdirSync(examplesDir).filter(f => f.endsWith('.json'));
  } catch {
    // Directory may not exist in some packaged contexts; return empty set.
    return { examples: [] };
  }
  const examples: ExampleMetaEntry[] = files
    .sort()
    .map(file => {
      const id = file.replace(/\.json$/, '');
      return {
        id,
        file: `examples/${file}`,
        description: EXAMPLE_DESCRIPTIONS[id] || 'Example scaffold',
        patternsIllustrated: EXAMPLE_PATTERN_HEURISTICS[id] || [],
      };
    });
  return { examples };
}

// ---- LUMA-87 Additional Sections (links, meta) -----------------------------------

interface LinkEntry { name: string; path?: string; url?: string; description?: string }

function assembleLinks(): Record<string, unknown> {
  // Provide authoritative internal spec file references & pattern spec docs.
  // If project later publishes canonical URLs, they can be added here without changing shape.
  const links: LinkEntry[] = [
    { name: 'Specification', path: 'SPECIFICATION.md', description: 'Core system specification' },
    { name: 'Quickstart', path: 'QUICKSTART.md', description: 'Step-by-step usage guide' },
    { name: 'Patterns Overview', path: 'SPECIFICATION.md#7-ux-pattern-library', description: 'Pattern library section in spec' },
    { name: 'Progressive Disclosure Pattern', path: 'LUMA-PATTERN-Progressive-Disclosure-SPEC.md' },
    { name: 'Guided Flow Pattern', path: 'LUMA-PATTERN-Guided-Flow-SPEC.md' },
    { name: 'Flip Spec', path: 'FLIP-SPEC.md', description: 'Future layout improvement plan (if applicable)' },
    { name: 'Readme', path: 'README.md', description: 'Project overview & install' },
  ];
  return { links };
}

interface MetaSection {
  nodeVersion: string;
  platform: string;
  arch: string;
  processPid?: number;
  patternsRegistered: number;
}

function assembleMeta(): Record<string, unknown> {
  const patternsRegistered = getAllPatterns().length;
  const meta: MetaSection = {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    processPid: process.pid,
    patternsRegistered,
  };
  return { meta };
}

function buildEnvelope(version: string, selected: string[]): AgentEnvelope {
  const sections: Record<string, unknown> = {};
  for (const name of selected) {
    switch (name) {
      case 'quick':
        sections.quick = assembleQuick();
        break;
      case 'workflow':
        sections.workflow = assembleWorkflow();
        break;
      case 'rules':
        sections.rules = assembleRules();
        break;
      case 'patterns':
        sections.patterns = assemblePatterns();
        break;
      case 'components':
        sections.components = assembleComponents();
        break;
      case 'examples':
        sections.examples = assembleExamples();
        break;
      case 'links':
        sections.links = assembleLinks();
        break;
      case 'meta':
        sections.meta = assembleMeta();
        break;
      default:
        // Placeholder until implemented in later beads
        sections[name] = {};
    }
  }
  return {
    version,
    generatedAt: new Date().toISOString(),
    sections,
  };
}

function uniqueOrdered<T>(items: T[]): T[] {
  const seen = new Set<T>();
  const result: T[] = [];
  for (const i of items) {
    if (!seen.has(i)) {
      seen.add(i);
      result.push(i);
    }
  }
  return result;
}

function resolveDotPath(obj: any, dotPath: string): { ok: boolean; value?: any } {
  const parts = dotPath.split('.').filter(Boolean);
  let cur: any = obj;
  for (const p of parts) {
    if (cur && Object.prototype.hasOwnProperty.call(cur, p)) {
      cur = cur[p];
    } else {
      return { ok: false };
    }
  }
  return { ok: true, value: cur };
}

export function createAgentCommand(): Command {
  const command = new Command('agent');

  command
    .description('Runtime agent knowledge (skeleton)')
    .option('--sections <csv>', 'Comma separated section names to include')
    .option('--all', 'Include all sections')
    .option('--get <dotPath>', 'Return only the value at a dot path inside the envelope (simple keys only)')
    .option('--list-sections', 'List available section names')
    .option('--json', 'Output JSON')
    .action((options: { sections?: string; all?: boolean; get?: string; listSections?: boolean; json?: boolean }) => {
      // Read version from package.json (same as index.ts approach)
      const packageJsonPath = join(__dirname, '../../package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const version: string = packageJson.version;

      // 1. Handle --list-sections early
      if (options.listSections) {
        if (options.json) {
          console.log(JSON.stringify(AGENT_SECTION_NAMES, null, 2));
        } else {
          console.log('Available agent sections:');
          for (const s of AGENT_SECTION_NAMES) console.log(' - ' + s);
          console.log('\nUse --sections <names> or --all to generate an envelope.');
        }
        return;
      }

      // Validate flag conflicts
      if (options.all && options.sections) {
        const err: ErrorJSON = { code: 'CONFLICTING_FLAGS', message: 'Cannot use --all with --sections' };
        if (options.json) console.error(JSON.stringify(err, null, 2));
        else console.error('Error: ' + err.message);
        process.exit(EXIT_INVALID_INPUT);
      }

      // Determine selected sections
      let requested: string[] = [];
      if (options.all) {
        requested = [...AGENT_SECTION_NAMES];
      } else if (options.sections) {
        requested = uniqueOrdered(options.sections.split(',').map(s => s.trim()).filter(Boolean));
      } else if (options.get) {
        // If only --get is provided without explicit sections, default to all (so path can work)
        requested = [...AGENT_SECTION_NAMES];
      } else {
        // No actionable flag: show guidance and exit 2 (invalid usage) to encourage explicitness
        const err: ErrorJSON = { code: 'NO_SECTIONS_SPECIFIED', message: 'Specify --sections <csv> or --all or use --list-sections.' };
        if (options.json) console.error(JSON.stringify(err, null, 2));
        else {
          console.error('Error: ' + err.message);
          console.error('Hint: luma agent --list-sections');
        }
        process.exit(EXIT_INVALID_INPUT);
      }

      // Validate section names
      const invalid = requested.filter(s => !AGENT_SECTION_NAMES.includes(s));
      if (invalid.length) {
        const err: ErrorJSON = { code: 'INVALID_SECTION', message: 'Unknown section(s): ' + invalid.join(', '), details: { invalid } };
        if (options.json) console.error(JSON.stringify(err, null, 2));
        else console.error('Error: ' + err.message);
        process.exit(EXIT_INVALID_INPUT);
      }

      const envelope = buildEnvelope(version, requested);

      if (options.get) {
        const { ok, value } = resolveDotPath(envelope, options.get);
        if (!ok) {
          const err: ErrorJSON = { code: 'DOT_PATH_NOT_FOUND', message: `Dot path not found: ${options.get}` };
            if (options.json) console.error(JSON.stringify(err, null, 2));
            else console.error('Error: ' + err.message);
            process.exit(EXIT_INVALID_INPUT);
        }
        if (options.json) {
          console.log(JSON.stringify(value, null, 2));
        } else {
          console.log(`Value at ${options.get}:`);
          console.log(JSON.stringify(value, null, 2));
        }
        return;
      }

      if (options.json) {
        console.log(JSON.stringify(envelope, null, 2));
        return;
      }

      // Pretty output
      console.log(`Agent Knowledge Envelope (v${envelope.version})`);
      console.log('Generated:', envelope.generatedAt);
      console.log('Sections included (placeholders):');
      for (const s of requested) {
        console.log(' - ' + s);
      }
      console.log('\n(To view raw JSON: use --json)');
    });

  return command;
}
