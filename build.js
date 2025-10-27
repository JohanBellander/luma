import { build } from 'esbuild';

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
