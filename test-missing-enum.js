import { z } from 'zod';

const stackSchema = z.object({ 
  type: z.literal('Stack'), 
  direction: z.enum(['vertical', 'horizontal']),
  children: z.array(z.any())
}).strict();

const gridSchema = z.object({ 
  type: z.literal('Grid'), 
  columns: z.number(),
  children: z.array(z.any())
}).strict();

const nodeSchema = z.union([stackSchema, gridSchema]);  // Regular union, not discriminated

const invalidData = { type: 'InvalidType', children: [] }; // invalid type value

try {
  nodeSchema.parse(invalidData);
} catch (err) {
  console.log('Full error structure:');
  console.log(JSON.stringify(err, null, 2));
  
  if (err.issues && err.issues.length > 0) {
    console.log('\nFirst issue:');
    console.log(JSON.stringify(err.issues[0], null, 2));
    
    if (err.issues[0].code === 'invalid_union' && err.issues[0].errors) {
      console.log('\nUnion errors:');
      console.log('errors.length:', err.issues[0].errors.length);
      console.log(JSON.stringify(err.issues[0].errors, null, 2));
    }
  }
}
