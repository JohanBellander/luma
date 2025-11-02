/**
 * Export command - generate prototype artifacts (initial: html-prototype) from a scaffold
 * Foundation for future formats (e.g., react-component, astro, markdown-doc)
 */

import { Command } from 'commander';
import { readFileSync, writeFileSync, statSync } from 'fs';
import { resolve, join } from 'path';
import { ingest } from '../core/ingest/ingest.js';
import { EXIT_INVALID_INPUT, EXIT_SUCCESS } from '../utils/exit-codes.js';

type ExportFormat = 'html-prototype';

interface ExportOptions {
  format?: ExportFormat;
  out?: string;
  runId?: string; // reserved for future when reading from run artifacts
  json?: boolean; // output metadata JSON instead of artifact content
  dryRun?: boolean; // no file write
  quick?: boolean; // skip optional decorations
}

export function createExportCommand(): Command {
  const cmd = new Command('export');

  cmd
    .description('Export a scaffold into a prototype artifact (format: html-prototype)')
    .argument('<input>', 'Scaffold JSON file OR run folder containing ingest.json')
    .option('--format <type>', 'Export format (html-prototype)', 'html-prototype')
    .option('--out <file>', 'Output file path (default depends on format)')
    .option('--run-id <id>', 'Alias for .ui/runs/<id> as input')
    .option('--json', 'Output only JSON metadata (do not emit artifact contents)')
    .option('--dry-run', 'Simulate export without writing file')
    .option('--quick', 'Generate minimal artifact (skip style, comments)')
    .action((input: string, options: ExportOptions) => {
      try {
        const format = options.format as ExportFormat;
        if (!['html-prototype'].includes(format)) {
          console.error('Error: unsupported --format value');
          process.exit(EXIT_INVALID_INPUT);
        }

        // Resolve input path (support --run-id)
        if (options.runId && input === '.') {
          input = `.ui/runs/${options.runId}`;
        }
        const inPath = resolve(input);
        let scaffold: any;
        let sourceType: 'scaffold-file' | 'run-folder' = 'scaffold-file';

        // Detect folder with ingest.json
        try {
          const stat = statSync(inPath);
          if (stat.isDirectory()) {
            const ingestPath = join(inPath, 'ingest.json');
            try {
              const ingestContent = JSON.parse(readFileSync(ingestPath, 'utf-8'));
              // Accept either rawData (enhanced ingest) or original
              scaffold = ingestContent.rawData || ingestContent.scaffold || ingestContent;
              sourceType = 'run-folder';
            } catch {
              console.error('Error: run folder missing ingest.json');
              process.exit(EXIT_INVALID_INPUT);
            }
          } else {
            scaffold = JSON.parse(readFileSync(inPath, 'utf-8'));
          }
        } catch (e) {
          console.error(`Error: cannot access input: ${(e as Error).message}`);
          process.exit(EXIT_INVALID_INPUT);
        }

        // Validate scaffold via ingest (ensures normalized structure)
        const ingestResult = ingest(scaffold);
        if (!ingestResult.valid) {
          console.error('Error: scaffold failed validation; cannot export');
          if (!options.json) {
            console.error('First issue:', ingestResult.issues[0]);
          }
          process.exit(EXIT_INVALID_INPUT);
        }

        // Determine output filename default
        const outFile = resolve(options.out || (format === 'html-prototype' ? 'prototype.html' : 'export.out'));

        // Generate artifact
        let artifactContent = '';
  const raw: any = (ingestResult as any).normalized || (ingestResult as any).rawData || {};
  let meta: any = { format, sourceType, outFile, schemaVersion: raw.schemaVersion };

        if (format === 'html-prototype') {
          artifactContent = generateHtmlPrototype(raw, { quick: !!options.quick });
          meta.nodes = countNodes(raw?.screen?.root);
        }

        if (options.json) {
          console.log(JSON.stringify(meta, null, 2));
        } else {
          if (options.dryRun) {
            console.log(`[dry-run] Skipped writing ${outFile}`);
          } else {
            writeFileSync(outFile, artifactContent, 'utf-8');
            console.log(`Exported ${format} → ${outFile}`);
          }
        }
        process.exit(EXIT_SUCCESS);
      } catch (err) {
        console.error('Error during export:', (err as Error).message);
        process.exit(EXIT_INVALID_INPUT);
      }
    });

  return cmd;
}

function countNodes(root: any): number {
  let count = 0;
  function walk(n: any) {
    if (!n || typeof n !== 'object') return;
    count++;
    switch (n.type) {
      case 'Stack':
      case 'Grid':
        (n.children || []).forEach(walk);
        break;
      case 'Box':
        if (n.child) walk(n.child);
        break;
      case 'Form':
        (n.fields || []).forEach(walk);
        (n.actions || []).forEach(walk);
        break;
    }
  }
  walk(root);
  return count;
}

interface HtmlOpts { quick: boolean }

function generateHtmlPrototype(scaffold: any, opts: HtmlOpts): string {
  const title = scaffold?.screen?.title || 'Prototype';
  const root = scaffold?.screen?.root;
  const style = opts.quick ? '' : `\n<style>
body{font-family:system-ui,Arial,sans-serif;line-height:1.4;margin:24px;background:#f9fafb;color:#222}
.stack.vertical{display:flex;flex-direction:column}
.stack.horizontal{display:flex;flex-direction:row;align-items:center}
form{display:flex;flex-direction:column;gap:12px;padding:16px;background:#fff;border:1px solid #ddd;border-radius:8px;max-width:480px}
label{font-weight:600}
input,button{font-size:14px;padding:8px 12px}
button.primary{background:#2563eb;color:#fff;border:none;border-radius:4px}
button.secondary{background:#e2e8f0;color:#333;border:1px solid #cbd5e1;border-radius:4px}
.field{display:flex;flex-direction:column;gap:4px}
.actions{display:flex;gap:8px;margin-top:8px}
</style>`;
  const html: string[] = [];
  html.push('<!DOCTYPE html>');
  html.push('<html lang="en">');
  html.push('<head>');
  html.push(`<meta charset="utf-8" />`);
  html.push(`<title>${escapeHtml(title)} - LUMA Prototype</title>`);
  html.push(style);
  if (!opts.quick) {
    html.push('<!-- Generated by luma export --format html-prototype -->');
  }
  html.push('</head><body>');
  html.push(`<h1>${escapeHtml(title)}</h1>`);
  html.push(renderNode(root));
  html.push('</body></html>');
  return html.join('\n');
}

function renderNode(node: any): string {
  if (!node) return '';
  switch (node.type) {
    case 'Stack':
      return `<div class="stack ${node.direction === 'horizontal' ? 'horizontal' : 'vertical'}" style="gap:${node.gap || 0}px;padding:${node.padding || 0}px">${(node.children||[]).map(renderNode).join('\n')}</div>`;
    case 'Form':
      return `<form aria-label="${escapeHtml(node.title||'Form')}">${(node.fields||[]).map(renderNode).join('\n')}<div class="actions">${(node.actions||[]).map(renderNode).join('\n')}</div></form>`;
    case 'Field':
      return `<div class="field"><label for="${escapeHtml(node.id)}">${escapeHtml(node.label||node.id)}</label><input id="${escapeHtml(node.id)}" name="${escapeHtml(node.id)}" type="${escapeHtml(node.inputType||'text')}" ${node.required? 'required':''} /></div>`;
    case 'Button':
      return `<button class="${node.roleHint==='primary'?'primary':'secondary'}" type="button">${escapeHtml(node.text||'Button')}</button>`;
    case 'Text':
      return `<p>${escapeHtml(node.text||'')}</p>`;
    default:
      // Fallback: ignore unsupported types for prototype
      return '';
  }
}

function escapeHtml(str: string): string {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
