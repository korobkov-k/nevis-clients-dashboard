import { describe, expect, it } from 'vitest';
import { readResponseDelayMs } from './config.js';

describe('readResponseDelayMs', () => {
  it('defaults to one second', () => {
    expect(readResponseDelayMs({})).toBe(1000);
  });

  it.each([
    ['0', 0],
    ['250', 250],
    ['-5', 0],
    ['abc', 0],
  ])('reads API_DELAY_MS=%s as %i', (value, expected) => {
    expect(readResponseDelayMs({ API_DELAY_MS: value })).toBe(expected);
  });
});
