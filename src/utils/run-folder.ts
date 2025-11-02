/**
 * Run folder management for LUMA
 * Creates append-only directories at .ui/runs/<timestamp>/
 */

import { mkdirSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const RUN_FOLDER_BASE = '.ui/runs';
// Allow tests to override the threshold via environment variable
const RUN_FOLDER_REUSE_THRESHOLD_MS = process.env.LUMA_RUN_FOLDER_REUSE_MS 
  ? parseInt(process.env.LUMA_RUN_FOLDER_REUSE_MS, 10) 
  : 5000; // 5 seconds default

/**
 * Generate a timestamp string for run folders
 * Format: YYYYMMDD-HHmmss-SSS
 */
export function generateTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const millis = String(now.getMilliseconds()).padStart(3, '0');

  return `${year}${month}${day}-${hours}${minutes}${seconds}-${millis}`;
}

/**
 * Get the most recently created run folder, if one exists within the reuse threshold
 * @param baseDir - Base directory (defaults to current working directory)
 * @returns Path to the most recent run folder, or null if none exists or too old
 */
export function getMostRecentRunFolder(baseDir: string = process.cwd()): string | null {
  const runsDir = join(baseDir, RUN_FOLDER_BASE);
  
  if (!existsSync(runsDir)) {
    return null;
  }

  const folders = readdirSync(runsDir)
    .map(name => join(runsDir, name))
    .filter(path => {
      try {
        return statSync(path).isDirectory();
      } catch {
        return false;
      }
    })
    .sort((a, b) => {
      const statA = statSync(a);
      const statB = statSync(b);
      // Use birthtimeMs (creation time) instead of mtimeMs for more reliable sorting
      return statB.birthtimeMs - statA.birthtimeMs;
    });

  if (folders.length === 0) {
    return null;
  }

  const mostRecent = folders[0];
  // Use birthtimeMs (creation time) instead of mtimeMs to check age
  // This is more reliable across platforms, especially Windows
  const age = Date.now() - statSync(mostRecent).birthtimeMs;

  // Only reuse if created within the threshold
  if (age <= RUN_FOLDER_REUSE_THRESHOLD_MS) {
    return mostRecent;
  }

  return null;
}

/**
 * Create a new run folder or reuse the most recent one if within threshold
 * @param baseDir - Base directory (defaults to current working directory)
 * @param explicitPath - If provided, use this exact path instead of creating/reusing
 * @returns Absolute path to the run folder
 */
export function createRunFolder(baseDir: string = process.cwd(), explicitPath?: string): string {
  // If explicit path provided, use it directly
  if (explicitPath) {
    if (!existsSync(explicitPath)) {
      mkdirSync(explicitPath, { recursive: true });
    }
    return explicitPath;
  }

  // Try to reuse the most recent run folder
  const recentFolder = getMostRecentRunFolder(baseDir);
  if (recentFolder) {
    return recentFolder;
  }

  // Create a new run folder
  const timestamp = generateTimestamp();
  const runFolderPath = join(baseDir, RUN_FOLDER_BASE, timestamp);

  if (!existsSync(runFolderPath)) {
    mkdirSync(runFolderPath, { recursive: true });
  }

  return runFolderPath;
}

/**
 * Resolve a run folder from a user-provided run ID (safe subset of characters)
 * Creates the folder if it does not exist.
 * @param runId - User provided ID (e.g. "login-flow-1")
 * @param baseDir - Base directory (defaults to CWD)
 */
export function resolveRunFolderFromId(runId: string, baseDir: string = process.cwd()): string {
  // Enforce safe characters to prevent path traversal or injection.
  // Allow alphanumerics, dash, underscore. Reject others.
  if (!/^[A-Za-z0-9_-]+$/.test(runId)) {
    throw new Error(`Invalid run id '${runId}'. Allowed characters: A-Z a-z 0-9 - _`);
  }
  const folder = join(baseDir, RUN_FOLDER_BASE, runId);
  if (!existsSync(folder)) {
    mkdirSync(folder, { recursive: true });
  }
  return folder;
}

/**
 * Helper to choose run folder based on precedence:
 * 1. explicit runFolder path (from --run-folder)
 * 2. runId (from --run-id) resolved under .ui/runs/
 * 3. reuse recent or create new timestamped
 */
export function selectRunFolder(opts: { explicitPath?: string; runId?: string; baseDir?: string }): string {
  const { explicitPath, runId, baseDir = process.cwd() } = opts;
  if (explicitPath && runId) {
    throw new Error('Cannot specify both explicit run folder path and run id');
  }
  if (explicitPath) return createRunFolder(baseDir, explicitPath);
  if (runId) return resolveRunFolderFromId(runId, baseDir);
  return createRunFolder(baseDir);
}

/**
 * Get the path to a file within a run folder
 * @param runFolder - Path to the run folder
 * @param filename - Name of the file
 * @returns Absolute path to the file
 */
export function getRunFilePath(runFolder: string, filename: string): string {
  return join(runFolder, filename);
}
