import { describe, it, expect } from 'vitest';
import { createPatternsCommand } from '../../../src/cli/patterns.command.js';
import { Command } from 'commander';
import fs from 'fs';

function runSuggest(scaffold: any) {
  const tmp = '.tmp-suggest.json';
  fs.writeFileSync(tmp, JSON.stringify(scaffold, null, 2));
  let output = '';
  const origLog = console.log;
  console.log = (msg?: any, ...rest: any[]) => { output += (typeof msg === 'string' ? msg : JSON.stringify(msg)) + '\n'; if (rest.length) output += rest.map(r => String(r)).join(' ') + '\n'; };
  try {
    const cmd = new Command();
  // Directly invoke the patterns subcommand
  const patternsCmd = createPatternsCommand();
  patternsCmd.parse(['node','patterns','--suggest', tmp, '--json']);
  } finally {
    console.log = origLog;
    fs.unlinkSync(tmp);
  }
  return JSON.parse(output.trim());
}

describe('Pattern Suggestions', () => {
  it('should suggest Table.Simple (and optionally other patterns) for golden todo mock', () => {
    const scaffold = JSON.parse(fs.readFileSync('templates/golden.todo.mock.json','utf-8'));
    const result = runSuggest(scaffold);
    const patterns = result.suggestions.map((s: any) => s.pattern).sort();
    expect(patterns).toContain('Table.Simple');
    // golden template may not have disclosure; allow optional
  });

  it('should return high confidence for Form.Basic when form present', () => {
    const scaffold = { schemaVersion: '1.0.0', screen: { id:'f', title:'F', root: { id:'r', type:'Form', fields:[{id:'email-field', type:'Field', label:'Email'}], actions:[{id:'submit-btn', type:'Button', text:'Submit'}], states:['default'] } }, settings:{ spacingScale:[4], minTouchTarget:{w:44,h:44}, breakpoints:['320x640'] } };
    const result = runSuggest(scaffold);
    const formSuggestion = result.suggestions.find((s: any) => s.pattern === 'Form.Basic');
    expect(formSuggestion).toBeDefined();
    expect(formSuggestion.confidence).toBe('high');
  });

  it('should produce medium/high confidence Guided.Flow based on button hints', () => {
    const scaffold = { schemaVersion:'1.0.0', screen:{ id:'g', title:'G', root:{ id:'root', type:'Stack', direction:'vertical', children:[{id:'step1', type:'Button', text:'Next'},{id:'step2', type:'Button', text:'Previous'}] } }, settings:{ spacingScale:[4], minTouchTarget:{w:44,h:44}, breakpoints:['320x640'] } };
    const result = runSuggest(scaffold);
    const gf = result.suggestions.find((s: any) => s.pattern === 'Guided.Flow');
    expect(gf).toBeDefined();
    expect(['medium','high']).toContain(gf.confidence);
  });

  it('should give low confidence Guided.Flow with single indicator', () => {
    const scaffold = { schemaVersion:'1.0.0', screen:{ id:'g', title:'G', root:{ id:'root', type:'Stack', direction:'vertical', children:[{id:'step1', type:'Button', text:'Next'}] } }, settings:{ spacingScale:[4], minTouchTarget:{w:44,h:44}, breakpoints:['320x640'] } };
    const result = runSuggest(scaffold);
    const gf = result.suggestions.find((s: any) => s.pattern === 'Guided.Flow');
    expect(gf).toBeDefined();
    expect(gf.confidence).toBe('low');
  });

  it('should be empty when scaffold has no pattern hints', () => {
    const scaffold = { schemaVersion:'1.0.0', screen:{ id:'x', title:'X', root:{ id:'root', type:'Stack', direction:'vertical', children:[{id:'t', type:'Text', text:'Hello'}] } }, settings:{ spacingScale:[4], minTouchTarget:{w:44,h:44}, breakpoints:['320x640'] } };
    const result = runSuggest(scaffold);
    expect(result.suggestions.length).toBe(0);
  });
});
