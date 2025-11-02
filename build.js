import { copyFileSync, mkdirSync } from 'fs';

// Copy data files to dist
mkdirSync('dist/data', { recursive: true });
copyFileSync('src/data/topics.json', 'dist/data/topics.json');
copyFileSync('src/data/faq.json', 'dist/data/faq.json');
copyFileSync('src/data/component-schemas.json', 'dist/data/component-schemas.json');

// No bundling step: rely on TypeScript output (dist/index.js) as CLI entry.
// This avoids ESM/CJS interop issues and duplicate shebang problems introduced
// by previous esbuild configuration.
