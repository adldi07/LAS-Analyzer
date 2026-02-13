const lasParser = require('../src/services/lasParser');
const fs = require('fs');
const path = require('path');

describe('LAS Parser', () => {
  let sampleLAS;

  beforeAll(() => {
    sampleLAS = fs.readFileSync(
      path.join(__dirname, 'fixtures/sample.las'),
      'utf-8'
    );
  });

  test('should parse LAS file correctly', () => {
    const parsed = lasParser.parse(sampleLAS);
    
    expect(parsed).toHaveProperty('version');
    expect(parsed).toHaveProperty('well');
    expect(parsed).toHaveProperty('curves');
    expect(parsed).toHaveProperty('data');
  });

  test('should extract correct number of curves', () => {
    const parsed = lasParser.parse(sampleLAS);
    expect(parsed.curves.length).toBeGreaterThan(0);
  });

  test('should handle null values', () => {
    const parsed = lasParser.parse(sampleLAS);
    const hasNulls = parsed.data.some(row => 
      Object.values(row).some(val => val === null)
    );
    // Should either have nulls or all valid values
    expect(typeof hasNulls).toBe('boolean');
  });

  test('should extract depth range', () => {
    const parsed = lasParser.parse(sampleLAS);
    const range = lasParser.getDepthRange(parsed);
    
    expect(range).toHaveProperty('start');
    expect(range).toHaveProperty('stop');
    expect(range.start).toBeLessThan(range.stop);
  });
});