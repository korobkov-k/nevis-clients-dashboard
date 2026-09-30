import { describe, expect, it } from 'vitest';
import { getAxisScale } from './axisScale';

describe('getAxisScale', () => {
  it.each([
    [350, { max: 400, ticks: [0, 100, 200, 300, 400] }],
    [216, { max: 300, ticks: [0, 100, 200, 300] }],
    [38, { max: 40, ticks: [0, 10, 20, 30, 40] }],
    [91, { max: 100, ticks: [0, 50, 100] }],
    [4, { max: 4, ticks: [0, 1, 2, 3, 4] }],
    [3, { max: 3, ticks: [0, 1, 2, 3] }],
    [1, { max: 1, ticks: [0, 1] }],
  ])('scales a maximum of %i', (maxValue, expected) => {
    expect(getAxisScale(maxValue)).toEqual(expected);
  });

  it('returns a non-degenerate domain for all-zero data', () => {
    expect(getAxisScale(0)).toEqual({ max: 1, ticks: [0, 1] });
  });

  it('always covers the maximum with integer ticks starting at zero', () => {
    for (let value = 0; value <= 2000; value += 7) {
      const { max, ticks } = getAxisScale(value);
      expect(max).toBeGreaterThanOrEqual(value);
      expect(ticks[0]).toBe(0);
      expect(ticks.at(-1)).toBe(max);
      expect(ticks.every(Number.isInteger)).toBe(true);
    }
  });
});
