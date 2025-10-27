import { build } from 'esbuild';
import { copyFileSync, mkdirSync } from 'fs';

// Copy data files to dist
mkdirSync('dist/data', { recursive: true });
copyFileSync('src/data/topics.json', 'dist/data/topics.json');
copyFileSync('src/data/faq.json', 'dist/data/faq.json');

await build({
  entryPoints: ['dist/index.js'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  outfile: 'dist/bundle.js',
  format: 'esm',
  banner: {
    js: '#!/usr/bin/env node',
  },
}).catch(() => process.exit(1));
