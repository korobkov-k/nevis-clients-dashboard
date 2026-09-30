import { describe, expect, it } from 'vitest';
import { buildClientTree } from '../../domain/clientTree';
import { getVisibleRows } from '../../domain/visibleRows';
import { IDS, sourceClients } from '../../test/sourceTree';
import type { FocusLocation } from '../dashboard/dashboardState';
import {
  findTypeaheadMatch,
  isTypeaheadKey,
  resolveTreegridKey,
  type KeyInput,
} from './treegridKeyboard';

const tree = buildClientTree(sourceClients);
const expandedIds = new Set([IDS.company, IDS.branch1]);
const rows = getVisibleRows(tree, expandedIds);

const key = (value: string, modifiers: Partial<KeyInput> = {}): KeyInput => ({
  key: value,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  shiftKey: false,
  ...modifiers,
});

const press = (value: string, focus: FocusLocation, modifiers?: Partial<KeyInput>) =>
  resolveTreegridKey(key(value, modifiers), {
    rows,
    expandedIds,
    focus,
    columnCount: 13,
    pageSize: 3,
  });

const onRow = (rowId: string): FocusLocation => ({ rowId, column: null });
const onCell = (rowId: string, column: number): FocusLocation => ({ rowId, column });
const focusTo = (focus: FocusLocation) => ({ type: 'focus', focus });

describe('row focus', () => {
  it('moves between visible rows without wrapping', () => {
    expect(press('ArrowDown', onRow(IDS.company))).toEqual(focusTo(onRow(IDS.branch1)));
    expect(press('ArrowUp', onRow(IDS.anna))).toEqual(focusTo(onRow(IDS.branch1)));
    expect(press('ArrowUp', onRow(IDS.company))).toEqual({ type: 'none' });
    expect(press('ArrowDown', onRow(IDS.branch3))).toEqual({ type: 'none' });
  });

  it('Right expands a collapsed parent, otherwise enters the first cell', () => {
    expect(press('ArrowRight', onRow(IDS.anna))).toEqual({
      type: 'setExpanded',
      nodeId: IDS.anna,
      expanded: true,
    });
    expect(press('ArrowRight', onRow(IDS.branch1))).toEqual(focusTo(onCell(IDS.branch1, 0)));
    expect(press('ArrowRight', onRow(IDS.james))).toEqual(focusTo(onCell(IDS.james, 0)));
  });

  it('Left collapses an expanded parent, otherwise focuses the parent', () => {
    expect(press('ArrowLeft', onRow(IDS.branch1))).toEqual({
      type: 'setExpanded',
      nodeId: IDS.branch1,
      expanded: false,
    });
    expect(press('ArrowLeft', onRow(IDS.anna))).toEqual(focusTo(onRow(IDS.branch1)));
    expect(press('ArrowLeft', onRow(IDS.branch2))).toEqual(focusTo(onRow(IDS.company)));
    expect(press('ArrowLeft', onRow(IDS.company))).toEqual({
      type: 'setExpanded',
      nodeId: IDS.company,
      expanded: false,
    });
  });

  it('Enter toggles parents and selects leaves; Space always selects', () => {
    expect(press('Enter', onRow(IDS.branch1))).toEqual({ type: 'toggle', nodeId: IDS.branch1 });
    expect(press('Enter', onRow(IDS.branch2))).toEqual({ type: 'select', nodeId: IDS.branch2 });
    expect(press(' ', onRow(IDS.branch1))).toEqual({ type: 'select', nodeId: IDS.branch1 });
  });

  it('Home/End and Ctrl+Home/End go to the first/last visible row', () => {
    expect(press('End', onRow(IDS.anna))).toEqual(focusTo(onRow(IDS.branch3)));
    expect(press('Home', onRow(IDS.anna))).toEqual(focusTo(onRow(IDS.company)));
    expect(press('End', onRow(IDS.anna), { ctrlKey: true })).toEqual(focusTo(onRow(IDS.branch3)));
  });

  it('Page Up/Down move by the page size, clamped', () => {
    expect(press('PageDown', onRow(IDS.company))).toEqual(focusTo(onRow(IDS.james)));
    expect(press('PageDown', onRow(IDS.sarah))).toEqual(focusTo(onRow(IDS.branch3)));
    expect(press('PageUp', onRow(IDS.anna))).toEqual(focusTo(onRow(IDS.company)));
    expect(press('PageUp', onRow(IDS.company))).toEqual({ type: 'none' });
  });
});

describe('cell focus', () => {
  it('moves vertically in the same column', () => {
    expect(press('ArrowDown', onCell(IDS.branch1, 5))).toEqual(focusTo(onCell(IDS.anna, 5)));
    expect(press('PageDown', onCell(IDS.company, 5))).toEqual(focusTo(onCell(IDS.james, 5)));
  });

  it('moves horizontally without wrapping and returns to the row from the first cell', () => {
    expect(press('ArrowRight', onCell(IDS.anna, 0))).toEqual(focusTo(onCell(IDS.anna, 1)));
    expect(press('ArrowRight', onCell(IDS.anna, 12))).toEqual({ type: 'none' });
    expect(press('ArrowLeft', onCell(IDS.anna, 3))).toEqual(focusTo(onCell(IDS.anna, 2)));
    expect(press('ArrowLeft', onCell(IDS.anna, 0))).toEqual(focusTo(onRow(IDS.anna)));
  });

  it('Home/End go to the first/last cell; Ctrl variants keep the column', () => {
    expect(press('Home', onCell(IDS.anna, 6))).toEqual(focusTo(onCell(IDS.anna, 0)));
    expect(press('End', onCell(IDS.anna, 6))).toEqual(focusTo(onCell(IDS.anna, 12)));
    expect(press('Home', onCell(IDS.anna, 6), { ctrlKey: true })).toEqual(
      focusTo(onCell(IDS.company, 6)),
    );
  });

  it('Enter acts like the row on the name cell only; Space selects the row', () => {
    expect(press('Enter', onCell(IDS.anna, 0))).toEqual({ type: 'toggle', nodeId: IDS.anna });
    expect(press('Enter', onCell(IDS.anna, 4))).toEqual({ type: 'none' });
    expect(press(' ', onCell(IDS.anna, 4))).toEqual({ type: 'select', nodeId: IDS.anna });
  });
});

describe('unhandled keys', () => {
  it.each([
    ['Tab', {}],
    ['ArrowDown', { shiftKey: true }],
    ['c', { metaKey: true }],
    ['ArrowLeft', { altKey: true }],
    ['a', { ctrlKey: true }],
    ['r', {}],
  ])('leaves %s %o to the browser', (value, modifiers) => {
    expect(press(value, onRow(IDS.company), modifiers)).toBeNull();
  });
});

describe('typeahead', () => {
  it('recognises printable keys without command modifiers', () => {
    expect(isTypeaheadKey(key('b'))).toBe(true);
    expect(isTypeaheadKey(key('B', { shiftKey: true }))).toBe(true);
    expect(isTypeaheadKey(key(' '))).toBe(false);
    expect(isTypeaheadKey(key('b', { ctrlKey: true }))).toBe(false);
    expect(isTypeaheadKey(key('ArrowDown'))).toBe(false);
  });

  it('cycles through single-character matches, wrapping', () => {
    expect(findTypeaheadMatch(rows, IDS.company, 'b')).toBe(IDS.branch1);
    expect(findTypeaheadMatch(rows, IDS.branch1, 'b')).toBe(IDS.branch2);
    expect(findTypeaheadMatch(rows, IDS.branch3, 'b')).toBe(IDS.branch1);
  });

  it('matches a buffered prefix case-insensitively, including the current row', () => {
    expect(findTypeaheadMatch(rows, IDS.company, 'ro')).toBe(IDS.robert);
    expect(findTypeaheadMatch(rows, IDS.robert, 'ROB')).toBe(IDS.robert);
    expect(findTypeaheadMatch(rows, IDS.company, 'zz')).toBeNull();
  });
});
