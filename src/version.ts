/**
 * Central version accessor (single synchronous package.json read).
 * This reduces repeated filesystem reads across multiple commands (perf optimization LUMA-122).
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = join(__dirname, '../package.json');

// Read once at module init.
const pkgRaw = readFileSync(packageJsonPath, 'utf-8');
export const LUMA_VERSION: string = JSON.parse(pkgRaw).version;
