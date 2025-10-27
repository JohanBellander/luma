import { describe, it, expect } from 'vitest';
import { validateSchemaVersion, isSupportedVersion } from '../../../src/core/ingest/schema-version.js';

describe('schema-version', () => {
  describe('validateSchemaVersion', () => {
    it('should return null for supported version 1.0.0', () => {
      const result = validateSchemaVersion('1.0.0');
      expect(result).toBeNull();
    });

    it('should return issue for unsupported version', () => {
      const result = validateSchemaVersion('2.0.0');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('unsupported-schema-version');
      expect(result?.severity).toBe('critical');
    });

    it('should return issue for invalid version format', () => {
      const result = validateSchemaVersion('invalid');
      expect(result).not.toBeNull();
      expect(result?.severity).toBe('critical');
    });
  });

  describe('isSupportedVersion', () => {
    it('should return true for 1.0.0', () => {
      expect(isSupportedVersion('1.0.0')).toBe(true);
    });

    it('should return false for unsupported version', () => {
      expect(isSupportedVersion('2.0.0')).toBe(false);
    });
  });
});
