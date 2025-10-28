import { ingest } from './dist/core/ingest/ingest.js';

const scaffold = {
  schemaVersion: '1.0.0',
  screen: {
    id: 'test',
    root: {
      id: 'invalid1',
      type: 'InvalidType'
    }
  },
  settings: {
    spacingScale: [0, 4, 8, 16, 24, 32],
    minTouchTarget: { w: 44, h: 44 },
    breakpoints: ['320px', '768px', '1024px']
  }
};

const result = ingest(scaffold);

console.log('\nTotal issues:', result.issues.length);
console.log('\nIssue codes:');
result.issues.forEach(i => {
  const details = i.details;
  console.log(`  ${i.jsonPointer}: code=${details.code}, found=${i.found}`);
});

const unionErr = result.issues.find(i => i.found === 'none of the union members matched');
console.log('\nUnion error found:', !!unionErr);
if (unionErr) {
  console.log(JSON.stringify(unionErr, null, 2));
}
