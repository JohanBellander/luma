import { scaffoldSchema } from './dist/core/ingest/validator.js';

const scaffold = {
  schemaVersion: '1.0.0',
  screen: {
    id: 'test',
    root: {
      id: 'text1',
      type: 'Text',
      content: 'Hello', // Wrong property
    },
  },
  settings: {
    spacingScale: [0, 4, 8],
    minTouchTarget: { w: 44, h: 44 },
    breakpoints: ['320px'],
  },
};

const result = scaffoldSchema.safeParse(scaffold);

if (!result.success) {
  console.log('All errors:');
  result.error.issues.forEach((err, i) => {
    console.log(`\nError ${i}:`);
    console.log('  Code:', err.code);
    console.log('  Message:', err.message);
    console.log('  Path:', err.path.join('/'));
    
    // Check for nested errors in union
    if (err.code === 'invalid_union' && 'unionErrors' in err) {
      const unionErrors = err.unionErrors;
      console.log('  Union errors count:', unionErrors.length);
      unionErrors.forEach((ue, ui) => {
        console.log(`    Union ${ui}:`);
        ue.issues.forEach((issue, ii) => {
          console.log(`      Issue ${ii}: code=${issue.code}, path=${issue.path.join('/')}, keys=${issue.keys}`);
        });
      });
    }
    
    // Check for errors array
    if ('errors' in err && Array.isArray(err.errors)) {
      console.log('  Has errors array with', err.errors.length, 'errors');
      err.errors.forEach((suberr, si) => {
        console.log(`    SubError ${si}:`, JSON.stringify(suberr, null, 2).slice(0, 500));
      });
    }
  });
}
