import { describe, expect, it } from 'vitest';
import { createTypeaheadBuffer } from './typeaheadBuffer';

describe('createTypeaheadBuffer', () => {
  it('builds a prefix from keys typed within the timeout', () => {
    const buffer = createTypeaheadBuffer(500);
    expect(buffer.append('r', 0)).toBe('r');
    expect(buffer.append('o', 200)).toBe('ro');
    expect(buffer.append('b', 650)).toBe('rob');
  });

  it('starts a new prefix after the timeout', () => {
    const buffer = createTypeaheadBuffer(500);
    buffer.append('r', 0);
    expect(buffer.append('s', 501)).toBe('s');
  });

  it('collapses a repeated character so presses cycle through matches', () => {
    const buffer = createTypeaheadBuffer(500);
    buffer.append('b', 0);
    expect(buffer.append('b', 100)).toBe('b');
    expect(buffer.append('b', 200)).toBe('b');
  });

  it('ignores case when collapsing repeats and building prefixes', () => {
    const buffer = createTypeaheadBuffer(500);
    buffer.append('b', 0);
    expect(buffer.append('B', 100)).toBe('b');
    const prefix = createTypeaheadBuffer(500);
    prefix.append('R', 0);
    expect(prefix.append('O', 100)).toBe('ro');
  });
});
