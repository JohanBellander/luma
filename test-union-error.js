import { z } from 'zod';

const stackSchema = z.object({ type: z.literal('Stack'), direction: z.enum(['vertical', 'horizontal']), children: z.array(z.any()) }).strict();
const gridSchema = z.object({ type: z.literal('Grid'), columns: z.number(), children: z.array(z.any()) }).strict();
const textSchema = z.object({ type: z.literal('Text'), text: z.string() }).strict();

const nodeSchema = z.discriminatedUnion('type', [stackSchema, gridSchema, textSchema]);

const invalidData = { type: 'InvalidType', id: 'test1' };

try {
  nodeSchema.parse(invalidData);
} catch (err) {
  console.log('Full error:', JSON.stringify(err, null, 2));
  console.log('\nError structure:');
  console.log('code:', err.code);
  console.log('issues:', err.issues);
  if (err.issues[0].code === 'invalid_union' && err.issues[0].errors) {
    console.log('\nUnion errors:', err.issues[0].errors);
  }
}
