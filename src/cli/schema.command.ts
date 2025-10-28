/**
 * Schema command - summarizes input/output schema fields and component properties
 * Per spec Section 9.7: luma schema --json
 * Extended: luma schema --component <type> [--examples]
 */

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

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

interface ComponentProperty {
  type: string;
  required: boolean;
  description: string;
}

interface ComponentExample {
  name: string;
  code: any;
}

interface ComponentSchema {
  description: string;
  properties: Record<string, ComponentProperty>;
  required: string[];
  commonMistakes: string[];
  examples: ComponentExample[];
}

type ComponentSchemas = Record<string, ComponentSchema>;

// Load component schemas
function loadComponentSchemas(): ComponentSchemas {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const schemaPath = resolve(__dirname, '../data/component-schemas.json');
  const data = readFileSync(schemaPath, 'utf-8');
  return JSON.parse(data);
}

/**
 * Create the 'schema' command.
 * 
 * Usage: 
 *   luma schema --json
 *   luma schema --list
 *   luma schema --component Text
 *   luma schema --component Form --examples
 */
export function createSchemaCommand(): Command {
  const command = new Command('schema');

  command
    .description('Summarize input/output schema fields or show component properties')
    .option('--json', 'Output as JSON')
    .option('--list', 'List all available component types')
    .option('--component <type>', 'Show properties for a specific component type')
    .option('--examples', 'Show examples (use with --component)')
    .action((options: { json?: boolean; list?: boolean; component?: string; examples?: boolean }) => {
      // Handle --list option
      if (options.list) {
        const componentTypes = ['Text', 'Button', 'Field', 'Form', 'Table', 'Stack', 'Grid', 'Box'];
        if (options.json) {
          console.log(JSON.stringify(componentTypes, null, 2));
        } else {
          console.log('Available component types:');
          componentTypes.forEach(type => console.log(`  - ${type}`));
        }
        return;
      }

      // Handle --component option
      if (options.component) {
        const schemas = loadComponentSchemas();
        const componentType = options.component;
        const schema = schemas[componentType];

        if (!schema) {
          console.error(`Error: Unknown component type "${componentType}"`);
          console.error('Available types: Text, Button, Field, Form, Table, Stack, Grid, Box');
          process.exit(3);
        }

        if (options.examples) {
          // Show examples
          if (options.json) {
            console.log(JSON.stringify(schema.examples, null, 2));
          } else {
            console.log(`${componentType} Examples:\n`);
            schema.examples.forEach((example, idx) => {
              console.log(`${idx + 1}. ${example.name}:`);
              console.log(JSON.stringify(example.code, null, 2));
              console.log();
            });
          }
        } else {
          // Show component properties
          if (options.json) {
            const output = {
              type: componentType,
              description: schema.description,
              properties: schema.properties,
              required: schema.required,
              commonMistakes: schema.commonMistakes,
              examples: schema.examples
            };
            console.log(JSON.stringify(output, null, 2));
          } else {
            console.log(`Component: ${componentType}`);
            console.log(`Description: ${schema.description}\n`);
            
            console.log('Required Properties:');
            schema.required.forEach(prop => {
              const propDef = schema.properties[prop];
              console.log(`  - ${prop}: ${propDef.type}`);
              console.log(`    ${propDef.description}`);
            });

            const optionalProps = Object.keys(schema.properties).filter(
              prop => !schema.required.includes(prop)
            );
            if (optionalProps.length > 0) {
              console.log('\nOptional Properties:');
              optionalProps.forEach(prop => {
                const propDef = schema.properties[prop];
                console.log(`  - ${prop}: ${propDef.type}`);
                console.log(`    ${propDef.description}`);
              });
            }

            if (schema.commonMistakes.length > 0) {
              console.log('\nCommon Mistakes:');
              schema.commonMistakes.forEach(mistake => {
                console.log(`  ⚠ ${mistake}`);
              });
            }

            console.log('\nFor examples, run: luma schema --component ' + componentType + ' --examples');
          }
        }
        return;
      }

      // Default behavior: show input/output schemas
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

        console.log('\nFor component details, use:');
        console.log('  luma schema --list');
        console.log('  luma schema --component <type>');
        console.log('  luma schema --component <type> --examples');
      }
    });

  return command;
}
