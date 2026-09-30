import { describe, expect, it } from 'vitest';
import clients from '../server/data/clients.json' with { type: 'json' };
import { ClientsContractError, parseClientsResponse } from './clientsContract.js';

const leaf = (id: string) => ({ id, name: id, values: Array.from({ length: 12 }, () => 0) });

describe('parseClientsResponse', () => {
  it('accepts the source payload and returns the same reference', () => {
    expect(parseClientsResponse(clients)).toBe(clients);
  });

  it('accepts a root without children', () => {
    expect(parseClientsResponse(leaf('root'))).toStrictEqual(leaf('root'));
  });

  it.each([
    ['null', null],
    ['an empty object', {}],
    ['an array', [leaf('a')]],
    ['a short values array', { ...leaf('a'), values: [1, 2, 3] }],
    ['non-numeric values', { ...leaf('a'), values: Array.from({ length: 12 }, () => '1') }],
    ['a missing id', { name: 'x', values: leaf('a').values }],
    ['a non-array child list', { ...leaf('a'), branches: {} }],
    ['duplicate ids', { ...leaf('a'), branches: [leaf('b'), leaf('b')] }],
    ['an invalid nested node', { ...leaf('a'), branches: [{ ...leaf('b'), employees: [{}] }] }],
  ])('rejects %s', (_label, payload) => {
    expect(() => parseClientsResponse(payload)).toThrow(ClientsContractError);
  });
});
