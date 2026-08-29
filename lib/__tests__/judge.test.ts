import { describe, expect, it } from 'vitest';
import { correctAnswer, judge, normalize } from '../judge';

describe('correctAnswer', () => {
  it('handles boundary values', () => {
    expect(correctAnswer(99_900_000)).toEqual({ unit: '万円', value: 9990 });
    expect(correctAnswer(100_000_000)).toEqual({ unit: '億円', value: 1 });
    expect(correctAnswer(105_000_000)).toEqual({ unit: '億円', value: 1.05 });
    expect(correctAnswer(10_000)).toEqual({ unit: '万円', value: 1 });
  });
});

describe('judge', () => {
  it('rejects unit mismatch only', () => {
    expect(judge(1_000_000_00, 0.1, '億円')).toBe(false);
  });

  it('accepts full-width input and unit', () => {
    expect(normalize('３７．５')).toBe(37.5);
    expect(judge(3_750_000_000, 37.5, '億円')).toBe(true);
  });

  it('parses comma input properly', () => {
    expect(normalize('3,700')).toBe(3700);
  });

  it('rejects empty or invalid strings', () => {
    expect(normalize('')).toBeNull();
    expect(normalize('abc')).toBeNull();
  });
});
