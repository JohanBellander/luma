/**
 * Run folder management for LUMA
 * Creates append-only directories at .ui/runs/<timestamp>/
 */

import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const RUN_FOLDER_BASE = '.ui/runs';

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
 * Create a new run folder and return its path
 * @param baseDir - Base directory (defaults to current working directory)
 * @returns Absolute path to the created run folder
 */
export function createRunFolder(baseDir: string = process.cwd()): string {
  const timestamp = generateTimestamp();
  const runFolderPath = join(baseDir, RUN_FOLDER_BASE, timestamp);

  if (!existsSync(runFolderPath)) {
    mkdirSync(runFolderPath, { recursive: true });
  }

  return runFolderPath;
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
