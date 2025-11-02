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
import { getAllPatterns, _getRegistry } from '../core/patterns/pattern-registry.js';
import { logger } from '../utils/logger.js';
import { performance } from 'node:perf_hooks';
import { LUMA_VERSION } from '../version.js';

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

interface AgentEnvelopeSchema {
  id: string;            // constant schema id
  version: string;       // schema version (bump on breaking structural change)
  generated: string;     // ISO8601 timestamp
  sections: string[];    // list of included section keys (canonical order)
}

interface AgentEnvelope {
  // Backwards compatibility fields (original shape fields retained)
  version: string;
  generatedAt: string; // ISO8601 (legacy)
  // New schema metadata (spec v1)
  schema: AgentEnvelopeSchema;
  // Legacy container of sections for existing tests
  sections: Record<string, unknown>;
  // Also expose each section at top-level for direct dot path retrieval per spec
  [key: string]: any;
}

interface ErrorJSON {
  code: string; // MACHINE code e.g. UNKNOWN_SECTION, UNKNOWN_PATH, CONFLICTING_FLAGS
  message: string; // Human readable
  details?: any;
}

// ---- LUMA-135 Error guidance mapping ---------------------------------------------
// Source of canonical mappings: topics.json error-glossary section (selected subset)
// We duplicate essential structured knowledge here for fast lookup; keep lean.

interface ErrorGuidance {
  errorId: string;
  description: string;
  commonCauses: string[];
  resolutionSteps: string[];
  exampleFix?: string; // Optional JSON or snippet
}

// Minimal curated guidance map (extend as new errors appear). Each entry lists causes and fix steps.
const ERROR_GUIDANCE_MAP: Record<string, ErrorGuidance> = {
  'field-has-label': {
    errorId: 'field-has-label',
    description: 'Field missing required non-empty label property.',
    commonCauses: ['Forgot to add label', 'Used wrong property name (e.g., title)', 'Empty string label'],
    resolutionSteps: ['Add label property to each Field node', 'Ensure label is a non-empty user-visible string'],
    exampleFix: '{"id":"email","type":"Field","label":"Email","inputType":"email"}',
  },
  'actions-exist': {
    errorId: 'actions-exist',
    description: 'Form component missing required action Buttons.',
    commonCauses: ['Form.actions omitted', 'Empty actions array', 'Used different property name (buttons)'],
    resolutionSteps: ['Add at least one Button to actions[]', 'Include a primary submit action'],
    exampleFix: '{"type":"Form","id":"login-form","fields":[{"id":"email","type":"Field","label":"Email"}],"actions":[{"id":"submit","type":"Button","text":"Submit","roleHint":"primary"}],"states":["default","error"]}',
  },
  'actions-after-fields': {
    errorId: 'actions-after-fields',
    description: 'Form actions precede fields breaking expected field→actions order.',
    commonCauses: ['Defined actions before fields array', 'Refactored field order without moving actions'],
    resolutionSteps: ['Place all Field nodes first inside fields[]', 'List action Buttons only after fields[]'],
    exampleFix: '{"type":"Form","id":"f","fields":[{"id":"username","type":"Field","label":"User"}],"actions":[{"id":"save","type":"Button","text":"Save","roleHint":"primary"}],"states":["default"]}',
  },
  'title-exists': {
    errorId: 'title-exists',
    description: 'Table component missing non-empty title.',
    commonCauses: ['Forgot title', 'Empty string used', 'Property named heading or label instead of title'],
    resolutionSteps: ['Add title property with non-empty string', 'Use concise descriptive name'],
    exampleFix: '{"id":"users","type":"Table","title":"Users","columns":["Name","Email"],"responsive":{"strategy":"scroll"}}',
  },
  'responsive-strategy': {
    errorId: 'responsive-strategy',
    description: 'Table.responsive.strategy missing or invalid.',
    commonCauses: ['Forgot responsive object', 'Typo in strategy value', 'Used unsupported strategy'],
    resolutionSteps: ['Add responsive.strategy with one of wrap|scroll|cards', 'Choose scroll for wide datasets'],
    exampleFix: '{"id":"tasks","type":"Table","title":"Tasks","columns":["Task","Status"],"responsive":{"strategy":"scroll"}}',
  },
  'overflow-x': {
    errorId: 'overflow-x',
    description: 'Horizontal content exceeds viewport width producing overflow.',
    commonCauses: ['Table columns too wide', 'Excessive gap/padding', 'Large minSize constraints'],
    resolutionSteps: ['Switch table responsive.strategy to scroll', 'Reduce gap/padding to scale values', 'Adjust minColumnWidth or remove fixed width constraints'],
  },
  'primary-below-fold': {
    errorId: 'primary-below-fold',
    description: 'Primary action located below viewport fold reducing visibility.',
    commonCauses: ['Too much vertical spacing', 'Primary action nested deep inside collapsible section', 'Missing top-level action bar'],
    resolutionSteps: ['Move primary action higher or outside collapsible', 'Reduce vertical padding/gap', 'Introduce sticky/top actions toolbar'],
  },
  'unreachable-node': {
    errorId: 'unreachable-node',
    description: 'Focusable node not reached by tab order traversal.',
    commonCauses: ['Node invisible (visible:false)', 'Nested under hidden parent', 'Missing focusable property where needed'],
    resolutionSteps: ['Ensure visible:true for focusable nodes', 'Avoid placing focusable nodes under collapsed default sections', 'Remove focusable flag for non-interactive nodes'],
  },
  'disclosure-no-control': {
    errorId: 'disclosure-no-control',
    description: 'Collapsible disclosure section lacks a control Button.',
    commonCauses: ['Forgot toggle button', 'Placed control after section far away', 'Used non-Button node as control without affordances'],
    resolutionSteps: ['Add adjacent Button with label like "Show more"', 'Use behaviors.disclosure.controlsId to link explicit control'],
    exampleFix: '{"id":"advanced","type":"Box","behaviors":{"disclosure":{"collapsible":true,"defaultState":"collapsed"}},"children":[{"id":"more-btn","type":"Button","text":"Show more","roleHint":"secondary"}]}'
  },
  'disclosure-hides-primary': {
    errorId: 'disclosure-hides-primary',
    description: 'Primary action hidden inside collapsed section by default.',
    commonCauses: ['Placed primary action inside advanced settings collapsed area', 'defaultState set to collapsed'],
    resolutionSteps: ['Move primary action outside collapsible or set defaultState:"expanded"', 'Reconsider what belongs in advanced section'],
  },
  'disclosure-missing-label': {
    errorId: 'disclosure-missing-label',
    description: 'Collapsible section lacks a textual label or summary.',
    commonCauses: ['No heading Text node', 'ariaSummaryText not provided', 'Only buttons present inside section'],
    resolutionSteps: ['Add Text child as label', 'Provide behaviors.disclosure.ariaSummaryText'],
  },
  'wizard-primary-below-fold': {
    errorId: 'wizard-primary-below-fold',
    description: 'Guided.Flow primary action below viewport fold on a step.',
    commonCauses: ['Long step content pushes actions downward', 'Insufficient scroll strategy', 'Missing top-level sticky action container'],
    resolutionSteps: ['Elevate primary action above fold', 'Consider splitting long step into multiple steps', 'Add persistent top or bottom sticky actions bar'],
  },
  'spacing-off-scale': {
    errorId: 'spacing-off-scale',
    description: 'gap or padding value not in settings.spacingScale.',
    commonCauses: ['Used arbitrary spacing value (e.g., 10 when scale has [4,8,12,16])', 'Scale not updated after design change'],
    resolutionSteps: ['Restrict gap/padding to spacingScale entries', 'Expand spacingScale intentionally if new size needed'],
  },
  'touch-target-too-small': {
    errorId: 'touch-target-too-small',
    description: 'Interactive element smaller than minTouchTarget dimensions.',
    commonCauses: ['Missing minSize on Button', 'Too short text label', 'Overridden heightPolicy causing shrink'],
    resolutionSteps: ['Set minSize >= settings.minTouchTarget', 'Increase padding or label text', 'Avoid reducing size via overrides'],
  },
  'invalid-schema-version': {
    errorId: 'invalid-schema-version',
    description: 'Unsupported or missing schemaVersion in scaffold.',
    commonCauses: ['Typo in version string', 'Omitted schemaVersion', 'Using future unsupported version'],
    resolutionSteps: ["Set schemaVersion to '1.0.0'", 'Regenerate scaffold from luma scaffold new to ensure correct contract'],
    exampleFix: '{"schemaVersion":"1.0.0", ... }'
  },
  'invalid-node-type': {
    errorId: 'invalid-node-type',
    description: 'Node type not part of allowed union.',
    commonCauses: ['Typo in type', 'Used conceptual type not yet modeled (e.g., Card)', 'Forgot to nest node inside children array'],
    resolutionSteps: ['Replace type with one of: Stack, Grid, Box, Text, Button, Field, Form, Table', 'Model custom semantics using existing base types'],
    exampleFix: '{"id":"card","type":"Box","children":[{"id":"title","type":"Text","text":"Card Title"}]}'
  }
};

function buildErrorGuidance(errorId: string): ErrorGuidance | undefined {
  return ERROR_GUIDANCE_MAP[errorId];
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
  aliases: string[]; // canonical pattern aliases exposed for agent retrieval (LUMA new chore)
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
      aliases: _getRegistry().get(p.name)?.aliases ?? [],
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

// Simple memoization cache keyed by sorted section list string
const envelopeCache: Map<string, AgentEnvelope> = new Map();
export function buildEnvelope(version: string, selected: string[]): AgentEnvelope {
  // Preserve order as passed (already canonical ordering performed by caller)
  const key = selected.join('|');
  if (envelopeCache.has(key)) return envelopeCache.get(key)!;
  const start = performance.now();
  const sections: Record<string, unknown> = {};
  for (const name of selected) {
    switch (name) {
      case 'quick': sections.quick = assembleQuick(); break;
      case 'workflow': sections.workflow = assembleWorkflow(); break;
      case 'rules': sections.rules = assembleRules(); break;
      case 'patterns': sections.patterns = assemblePatterns(); break;
      case 'components': sections.components = assembleComponents(); break;
      case 'examples': sections.examples = assembleExamples(); break;
      case 'links': sections.links = assembleLinks(); break;
      case 'meta': sections.meta = assembleMeta(); break;
      default: sections[name] = {}; // should not occur
    }
  }
  const generatedAt = new Date().toISOString();
  const envelope: AgentEnvelope = {
    version,
    generatedAt,
    schema: {
      id: 'luma.agent-docs',
      version: '1',
      generated: generatedAt,
      sections: selected.slice(),
    },
    sections,
  };
  // Expose each section at top-level for spec compliance (quick, rules, etc.)
  for (const name of selected) {
    (envelope as any)[name] = sections[name];
  }
  const duration = performance.now() - start;
  logger.debug(`agent envelope generated in ${duration.toFixed(2)}ms (${selected.length} sections)`);
  envelopeCache.set(key, envelope);
  return envelope;
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

// Resolve a dot path starting from the envelope.sections root.
// Grammar (v1): section(.segment)* where segment matches /^[A-Za-z0-9_]+$/
// Backward compatibility: allow an initial "sections" token (old tests) and skip it.
export function resolveDotPath(envelope: AgentEnvelope, dotPath: string): { ok: boolean; value?: any } {
  const rawParts = dotPath.split('.').filter(Boolean);
  if (!rawParts.length) return { ok: false };
  // Allow legacy leading 'sections'
  let parts = rawParts[0] === 'sections' ? rawParts.slice(1) : rawParts;
  if (!parts.length) return { ok: false };
  for (const seg of parts) if (!/^[A-Za-z0-9_]+$/.test(seg)) return { ok: false };
  let cur: any = envelope;
  for (const seg of parts) {
    if (cur && Object.prototype.hasOwnProperty.call(cur, seg)) cur = cur[seg];
    else return { ok: false };
  }
  return { ok: true, value: cur };
}

export function createAgentCommand(): Command {
  const command = new Command('agent');

  command
  .description('Runtime agent knowledge (deterministic sections; default quick)')
    .option('--sections <csv>', 'Comma separated section names to include')
    .option('--all', 'Include all sections')
    .option('--get <dotPath>', 'Return only the value at a dot path inside the envelope (simple keys only)')
    .option('--list-sections', 'List available section names')
    .option('--help-with <errorId>', 'Provide structured guidance for a known issue/error id')
    .option('--json', 'Output JSON')
    .action((options: { sections?: string; all?: boolean; get?: string; listSections?: boolean; helpWith?: string; json?: boolean }) => {
  // Use centralized version (avoids extra FS read per invocation)
  const version: string = LUMA_VERSION;

      // 1. Handle --help-with guidance early (LUMA-135)
      if (options.helpWith) {
        const guidance = buildErrorGuidance(options.helpWith);
        if (!guidance) {
          const err: ErrorJSON = { code: 'UNKNOWN_ERROR_ID', message: `Unknown error/issue id: ${options.helpWith}` };
          if (options.json) console.error(JSON.stringify(err, null, 2));
          else console.error('Error: ' + err.message);
          process.exit(EXIT_INVALID_INPUT);
        }
        if (options.json) console.log(JSON.stringify(guidance, null, 2));
        else {
          console.log(`Guidance for ${guidance.errorId}\n`);
          console.log('Description: ' + guidance.description);
          if (guidance.commonCauses.length) {
            console.log('\nCommon Causes:');
            for (const c of guidance.commonCauses) console.log(' - ' + c);
          }
          if (guidance.resolutionSteps.length) {
            console.log('\nResolution Steps:');
            for (const s of guidance.resolutionSteps) console.log(' - ' + s);
          }
          if (guidance.exampleFix) {
            console.log('\nExample Fix:');
            console.log(guidance.exampleFix);
          }
        }
        return; // Do not proceed to envelope building
      }

      // 2. Handle --list-sections early
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

      // Determine selected sections (default quick if no explicit flags)
      let requested: string[] = [];
      if (options.all) requested = [...AGENT_SECTION_NAMES];
      else if (options.sections) {
        // PowerShell can split comma-separated arguments into separate tokens (e.g. quick,rules -> quick rules)
        // so we also treat whitespace as a valid delimiter. Pattern: split on one or more commas OR whitespace.
        requested = uniqueOrdered(options.sections.split(/[\s,]+/).map(s => s.trim()).filter(Boolean));
      }
      else if (options.get) requested = [...AGENT_SECTION_NAMES]; // build all so dot path likely resolves
      else requested = ['quick']; // default startup card per spec

      // Validate section names
      const invalid = requested.filter(s => !AGENT_SECTION_NAMES.includes(s));
      if (invalid.length) {
        const err: ErrorJSON = { code: 'UNKNOWN_SECTION', message: 'Unknown section(s): ' + invalid.join(', '), details: { invalid } };
        if (options.json) console.error(JSON.stringify(err, null, 2));
        else console.error('Error: ' + err.message);
        process.exit(EXIT_INVALID_INPUT);
      }

  // Stability: ensure requested order is canonical (AGENT_SECTION_NAMES order)
  const canonicalOrder = AGENT_SECTION_NAMES.filter(n => requested.includes(n));
  const envelope = buildEnvelope(version, canonicalOrder);

      if (options.get) {
        const { ok, value } = resolveDotPath(envelope, options.get);
        if (!ok) {
          const err: ErrorJSON = { code: 'UNKNOWN_PATH', message: `Dot path not found or invalid: ${options.get}` };
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
        // Deterministic ordering of sections inside legacy sections object
        const stableSections = Object.keys(envelope.sections).sort().reduce((acc, k) => { acc[k] = (envelope.sections as any)[k]; return acc; }, {} as Record<string, unknown>);
        const out = { ...envelope, sections: stableSections };
        console.log(JSON.stringify(out, null, 2));
        return;
      }

      console.log(`Agent Knowledge Envelope (schema ${envelope.schema.version})`);
      console.log('Included sections:', envelope.schema.sections.join(', '));
      if (envelope.quick) {
        const q = envelope.quick as any;
        console.log('\n[quick]');
        console.log('usage: ' + q.usage);
        console.log('primaryCommands: ' + q.primaryCommands.join(','));
        console.log('recommendedOrder: ' + q.recommendedOrder.join('>'));
      }
      console.log('\n(JSON: add --json)');
    });

  return command;
}
