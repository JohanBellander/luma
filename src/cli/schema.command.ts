/**
 * Schema command - summarizes input/output schema fields
 * Per spec Section 9.7: luma schema --json
 */

import { Command } from 'commander';

interface SchemaOutput {
  inputSchema: {
    name: string;
    description: string;
    requiredFields: string[];
    nodeTypes: string[];
  };
  outputSchemas: Array<{
    name: string;
    description: string;
    fields: string[];
  }>;
}

/**
 * Create the 'schema' command.
 * 
 * Usage: luma schema --json
 */
export function createSchemaCommand(): Command {
  const command = new Command('schema');

  command
    .description('Summarize input/output schema fields')
    .option('--json', 'Output as JSON')
    .action((options: { json?: boolean }) => {
      const output: SchemaOutput = {
        inputSchema: {
          name: 'Scaffold',
          description: 'UI mockup definition with screen hierarchy and responsive overrides',
          requiredFields: ['schemaVersion', 'screen', 'screen.id', 'screen.title', 'screen.root'],
          nodeTypes: ['Stack', 'Grid', 'Box', 'Text', 'Button', 'Field', 'Form', 'Table'],
        },
        outputSchemas: [
          {
            name: 'IngestOutput',
            description: 'Validation and normalization results',
            fields: ['valid', 'normalized', 'issues'],
          },
          {
            name: 'LayoutOutput',
            description: 'Layout analysis per viewport',
            fields: ['viewport', 'frames', 'issues'],
          },
          {
            name: 'KeyboardOutput',
            description: 'Keyboard flow and tab sequence',
            fields: ['sequence', 'unreachable', 'issues'],
          },
          {
            name: 'FlowOutput',
            description: 'Pattern validation results',
            fields: ['patterns', 'hasMustFailures', 'totalIssues'],
          },
          {
            name: 'ScoreOutput',
            description: 'Aggregated scoring and pass/fail',
            fields: ['categories', 'weights', 'overall', 'criteria', 'pass', 'failReasons'],
          },
          {
            name: 'Issue',
            description: 'Canonical issue format',
            fields: ['id', 'severity', 'message', 'nodeId', 'source?'],
          },
        ],
      };

      if (options.json) {
        console.log(JSON.stringify(output, null, 2));
      } else {
        console.log('Input Schema: ' + output.inputSchema.name);
        console.log('  Description:', output.inputSchema.description);
        console.log('  Required:', output.inputSchema.requiredFields.join(', '));
        console.log('  Node Types:', output.inputSchema.nodeTypes.join(', '));
        
        console.log('\nOutput Schemas:');
        for (const schema of output.outputSchemas) {
          console.log(`  ${schema.name}: ${schema.description}`);
          console.log(`    Fields: ${schema.fields.join(', ')}`);
        }
      }
    });

  return command;
}
