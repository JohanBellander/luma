import { describe, it, expect } from 'vitest';
import { parseViewport } from '../../src/types/viewport.js';

describe('parseViewport', () => {
  it('parses valid viewport', () => {
    expect(parseViewport('320x640')).toEqual({ width: 320, height: 640 });
  });

  it('parses uppercase X', () => {
    expect(parseViewport('800X600')).toEqual({ width: 800, height: 600 });
  });

  it('trims whitespace', () => {
    expect(parseViewport('  1024x768  ')).toEqual({ width: 1024, height: 768 });
  });

  it('throws on invalid format', () => {
    expect(() => parseViewport('1024')).toThrow();
    expect(() => parseViewport('x768')).toThrow();
    expect(() => parseViewport('1024x')).toThrow();
    expect(() => parseViewport('1024x0')).toThrow();
    expect(() => parseViewport('0x768')).toThrow();
    expect(() => parseViewport('320xabc')).toThrow();
    expect(() => parseViewport('abcx640')).toThrow();
  });
});
