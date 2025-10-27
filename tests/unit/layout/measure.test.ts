import { describe, it, expect } from 'vitest';
import { measureText, measureButton, measureField, measureTable } from '../../../src/core/layout/measure.js';
import type { TextNode, ButtonNode, FieldNode, TableNode } from '../../../src/types/node.js';

describe('measureText', () => {
  it('should calculate single-line text width', () => {
    const node: TextNode = {
      id: 'text1',
      type: 'Text',
      text: 'Hello World', // 11 chars
      fontSize: 16,
    };

    const size = measureText(node, 500);
    
    // fontSize * 0.55 * charCount = 16 * 0.55 * 11 = 96.8
    expect(size.w).toBeCloseTo(96.8, 1);
    // height = fontSize * 1.4 = 16 * 1.4 = 22.4
    expect(size.h).toBeCloseTo(22.4, 1);
  });

  it('should wrap text when exceeds available width', () => {
    const node: TextNode = {
      id: 'text2',
      type: 'Text',
      text: 'This is a very long text that will wrap',
      fontSize: 16,
    };

    const availableWidth = 100;
    const size = measureText(node, availableWidth);
    
    // singleLine = 16 * 0.55 * 40 = 352
    // lines = ceil(352 / 100) = 4
    // height = 4 * 16 * 1.4 = 89.6
    expect(size.w).toBe(availableWidth);
    expect(size.h).toBeCloseTo(89.6, 1);
  });

  it('should use intrinsicTextWidth when provided', () => {
    const node: TextNode = {
      id: 'text3',
      type: 'Text',
      text: 'Test',
      fontSize: 16,
      intrinsicTextWidth: 150,
    };

    const size = measureText(node, 500);
    
    expect(size.w).toBe(150);
    expect(size.h).toBeCloseTo(22.4, 1); // 16 * 1.4
  });

  it('should use default fontSize of 16', () => {
    const node: TextNode = {
      id: 'text4',
      type: 'Text',
      text: 'Test', // 4 chars
    };

    const size = measureText(node, 500);
    
    // 16 * 0.55 * 4 = 35.2
    expect(size.w).toBeCloseTo(35.2, 1);
  });
});

describe('measureButton', () => {
  it('should enforce minimum touch target', () => {
    const node: ButtonNode = {
      id: 'btn1',
      type: 'Button',
      text: 'OK', // Small text
    };

    const minTouchTarget = { w: 44, h: 44 };
    const size = measureButton(node, 500, minTouchTarget);
    
    // Should be at least minTouchTarget
    expect(size.w).toBeGreaterThanOrEqual(44);
    expect(size.h).toBe(44);
  });

  it('should calculate button width with padding', () => {
    const node: ButtonNode = {
      id: 'btn2',
      type: 'Button',
      text: 'Submit Form', // 11 chars
    };

    const minTouchTarget = { w: 44, h: 44 };
    const size = measureButton(node, 500, minTouchTarget);
    
    // textWidth = 16 * 0.55 * 11 = 96.8
    // width = textWidth + 24 = 96.8 + 24 = 120.8
    expect(size.w).toBeCloseTo(120.8, 1);
    expect(size.h).toBe(44);
  });

  it('should handle icon-only button (no text)', () => {
    const node: ButtonNode = {
      id: 'btn3',
      type: 'Button',
      // No text property
    };

    const minTouchTarget = { w: 44, h: 44 };
    const size = measureButton(node, 500, minTouchTarget);
    
    // Should be minimum touch target
    expect(size.w).toBe(44);
    expect(size.h).toBe(44);
  });
});

describe('measureField', () => {
  it('should enforce minimum touch target', () => {
    const node: FieldNode = {
      id: 'field1',
      type: 'Field',
      label: 'Name',
    };

    const minTouchTarget = { w: 44, h: 44 };
    const size = measureField(node, 500, minTouchTarget);
    
    expect(size.h).toBe(44);
  });

  it('should calculate field width with label', () => {
    const node: FieldNode = {
      id: 'field2',
      type: 'Field',
      label: 'Email Address', // 13 chars
    };

    const minTouchTarget = { w: 44, h: 44 };
    const size = measureField(node, 500, minTouchTarget);
    
    // labelWidth = 16 * 0.55 * 13 = 114.4
    // width = labelWidth + 24 = 114.4 + 24 = 138.4
    expect(size.w).toBeCloseTo(138.4, 1);
    expect(size.h).toBe(44);
  });
});

describe('measureTable', () => {
  it('should calculate table height with default rows', () => {
    const node: TableNode = {
      id: 'table1',
      type: 'Table',
      headers: ['Name', 'Email'],
    };

    const size = measureTable(node, 500);
    
    // header: 48, rowHeight: 40, rows: 5 (default)
    // height = 48 + 40 * 5 = 248
    expect(size.w).toBe(500); // Full width
    expect(size.h).toBe(248);
  });

  it('should calculate table height with specified rows', () => {
    const node: TableNode = {
      id: 'table2',
      type: 'Table',
      headers: ['ID', 'Name', 'Status'],
      rows: 10,
    };

    const size = measureTable(node, 800);
    
    // height = 48 + 40 * 10 = 448
    expect(size.w).toBe(800);
    expect(size.h).toBe(448);
  });

  it('should handle table with strategy scroll', () => {
    const node: TableNode = {
      id: 'table3',
      type: 'Table',
      headers: ['Column1', 'Column2'],
      rows: 3,
      strategy: 'scroll',
    };

    const size = measureTable(node, 400);
    
    // height = 48 + 40 * 3 = 168
    expect(size.w).toBe(400);
    expect(size.h).toBe(168);
  });
});
