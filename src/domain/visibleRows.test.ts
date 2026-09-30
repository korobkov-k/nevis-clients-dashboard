import { describe, expect, it } from 'vitest';
import { IDS, sourceClients } from '../test/sourceTree';
import { buildClientTree, getAncestorIds, isDescendantOf } from './clientTree';
import { getNearestVisibleId, getVisibleRows } from './visibleRows';

const tree = buildClientTree(sourceClients);
const names = (expanded: string[]) =>
  getVisibleRows(tree, new Set(expanded)).map((node) => node.name);

describe('buildClientTree', () => {
  it('indexes levels, depth and sibling positions', () => {
    expect(tree.nodes.size).toBe(12);
    expect(tree.nodes.get(IDS.company)).toMatchObject({ level: 'company', depth: 1 });
    expect(tree.nodes.get(IDS.branch3)).toMatchObject({
      level: 'branch',
      depth: 2,
      siblingIndex: 2,
      siblingCount: 3,
      childIds: [],
    });
    expect(tree.nodes.get(IDS.robert)).toMatchObject({ level: 'adviser', siblingIndex: 3 });
    expect(tree.nodes.get(IDS.newPaid)).toMatchObject({ level: 'channel', depth: 4 });
  });

  it('keeps the source value arrays by reference', () => {
    expect(tree.nodes.get(IDS.company)?.values).toBe(sourceClients.values);
  });

  it('resolves ancestors', () => {
    expect(getAncestorIds(tree, IDS.newOrganic)).toEqual([IDS.company, IDS.branch1, IDS.anna]);
    expect(isDescendantOf(tree, IDS.newOrganic, IDS.branch1)).toBe(true);
    expect(isDescendantOf(tree, IDS.branch1, IDS.branch1)).toBe(false);
  });
});

describe('getVisibleRows', () => {
  it('shows Company and its branches initially', () => {
    expect(names([IDS.company])).toEqual(['Company', 'Branch 1', 'Branch 2', 'Branch 3']);
  });

  it('shows only Company when collapsed', () => {
    expect(names([])).toEqual(['Company']);
  });

  it('reveals advisers and channels in source order', () => {
    expect(names([IDS.company, IDS.branch1, IDS.anna])).toEqual([
      'Company',
      'Branch 1',
      'Anna Blackwood',
      'Existing clients',
      'New organic',
      'New paid',
      'James Walker',
      'Maria Gutierrez',
      'Robert Chen',
      'Sarah Smith',
      'Branch 2',
      'Branch 3',
    ]);
  });

  it('hides descendants of a collapsed parent while retaining their flags', () => {
    expect(names([IDS.company, IDS.anna])).toEqual(['Company', 'Branch 1', 'Branch 2', 'Branch 3']);
  });
});

describe('getNearestVisibleId', () => {
  it('returns a visible node unchanged', () => {
    expect(getNearestVisibleId(tree, new Set([IDS.company]), IDS.branch2)).toBe(IDS.branch2);
  });

  it('returns the closest visible ancestor of a hidden node', () => {
    expect(getNearestVisibleId(tree, new Set([IDS.company, IDS.anna]), IDS.newPaid)).toBe(
      IDS.branch1,
    );
    expect(getNearestVisibleId(tree, new Set([IDS.branch1, IDS.anna]), IDS.newPaid)).toBe(
      IDS.company,
    );
  });
});
