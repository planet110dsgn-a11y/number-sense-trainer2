import { describe, expect, it } from 'vitest';
import { buildQuestionSet, generateQuestion, type DisplayType } from '../question';

describe('generateQuestion', () => {
  const types: DisplayType[] = ['sen', 'mil', 'M'];

  it.each(types)('keeps shown integer and valid range for %s', (type) => {
    for (let i = 0; i < 1000; i += 1) {
      const q = generateQuestion(type, Math.random);
      expect(Number.isInteger(q.shown)).toBe(true);
      expect(q.shown).toBeGreaterThan(0);
      expect(q.sig).toBeGreaterThanOrEqual(2);
      expect(q.sig).toBeLessThanOrEqual(3);
      expect(q.yen).toBeGreaterThanOrEqual(1e4);
      expect(q.yen).toBeLessThanOrEqual(1e13);
    }
  });
});

describe('buildQuestionSet', () => {
  it('includes all three display types and no duplicated actual amounts', () => {
    const set = buildQuestionSet(() => 0.5, false);
    expect(set).toHaveLength(10);

    const types = new Set(set.map((q) => q.type));
    expect(types.has('sen')).toBe(true);
    expect(types.has('mil')).toBe(true);
    expect(types.has('M')).toBe(true);

    const uniqueYen = new Set(set.map((q) => q.yen));
    expect(uniqueYen.size).toBe(set.length);
  });
});
