import { describe, it, expect } from 'vitest';
import { generateTimestamp, getRunFilePath } from '../utils/run-folder.js';

describe('run-folder', () => {
  it('should generate timestamp in correct format', () => {
    const timestamp = generateTimestamp();
    expect(timestamp).toMatch(/^\d{8}-\d{6}-\d{3}$/);
  });

  it('should generate run file path', () => {
    const runFolder = '/path/to/run';
    const filename = 'test.json';
    const filePath = getRunFilePath(runFolder, filename);
    expect(filePath).toContain('test.json');
  });
});
