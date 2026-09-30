import { describe, expect, it } from 'vitest';
import { buildChartModel } from '../../domain/chartModel';
import { buildClientTree } from '../../domain/clientTree';
import { getVisibleRows } from '../../domain/visibleRows';
import { IDS, sourceClients } from '../../test/sourceTree';
import {
  createDashboardReducer,
  createInitialState,
  type DashboardAction,
  type DashboardState,
} from './dashboardState';

const tree = buildClientTree(sourceClients);
const reducer = createDashboardReducer(tree);
const initial = createInitialState(tree);
const run = (...actions: DashboardAction[]) => actions.reduce(reducer, initial);
const visibleNames = (state: DashboardState) =>
  getVisibleRows(tree, state.expandedIds).map((node) => node.name);

describe('initial state', () => {
  it('expands only Company, selects nothing and has no focus yet', () => {
    expect(initial.selectedId).toBeNull();
    expect([...initial.expandedIds]).toEqual([IDS.company]);
    expect(initial.focus).toBeNull();
    expect(visibleNames(initial)).toHaveLength(4);
  });
});

describe('selection', () => {
  it('row pointer selection selects and focuses the row without changing expansion', () => {
    const state = run({ type: 'nodeSelected', nodeId: IDS.branch2, origin: 'row-pointer' });
    expect(state.selectedId).toBe(IDS.branch2);
    expect(state.focus).toEqual({ rowId: IDS.branch2, column: null });
    expect(state.expandedIds).toBe(initial.expandedIds);
  });

  it('keyboard selection keeps the current cell focus', () => {
    const state = run(
      { type: 'focusMoved', focus: { rowId: IDS.branch1, column: 4 } },
      { type: 'nodeSelected', nodeId: IDS.branch1, origin: 'row-keyboard' },
    );
    expect(state.selectedId).toBe(IDS.branch1);
    expect(state.focus).toEqual({ rowId: IDS.branch1, column: 4 });
  });

  it('repeated row selection is idempotent', () => {
    const once = run({ type: 'nodeSelected', nodeId: IDS.branch1, origin: 'row-pointer' });
    expect(
      reducer(once, { type: 'nodeSelected', nodeId: IDS.branch1, origin: 'row-pointer' }),
    ).toBe(once);
    expect(
      reducer(once, { type: 'nodeSelected', nodeId: IDS.branch1, origin: 'row-keyboard' }),
    ).toBe(once);
  });

  it.each(['chart-segment', 'chart-legend'] as const)(
    '%s selection reveals only ancestors and sets the next treegrid entry target',
    (origin) => {
      const state = run({ type: 'nodeSelected', nodeId: IDS.newOrganic, origin });
      expect(state.selectedId).toBe(IDS.newOrganic);
      expect(new Set(state.expandedIds)).toEqual(new Set([IDS.company, IDS.branch1, IDS.anna]));
      expect(state.focus).toEqual({ rowId: IDS.newOrganic, column: null });
    },
  );

  it('chart selection does not expand the selected node or collapse unrelated branches', () => {
    const state = run(
      { type: 'expansionSet', nodeId: IDS.branch1, expanded: true },
      { type: 'expansionSet', nodeId: IDS.anna, expanded: true },
      { type: 'expansionSet', nodeId: IDS.branch1, expanded: false },
      { type: 'nodeSelected', nodeId: IDS.branch1, origin: 'chart-segment' },
    );
    expect(state.expandedIds.has(IDS.branch1)).toBe(false);
    expect(state.expandedIds.has(IDS.anna)).toBe(true);
    expect(state.expandedIds.has(IDS.company)).toBe(true);
  });

  it('repeated chart selection of the active leaf is a no-op', () => {
    const once = run({ type: 'nodeSelected', nodeId: IDS.branch2, origin: 'chart-segment' });
    const collapsed = reducer(once, { type: 'expansionSet', nodeId: IDS.company, expanded: false });
    expect(
      reducer(collapsed, { type: 'nodeSelected', nodeId: IDS.branch2, origin: 'chart-segment' }),
    ).toBe(collapsed);
  });

  it('ignores unknown node IDs', () => {
    expect(run({ type: 'nodeSelected', nodeId: 'missing', origin: 'row-pointer' })).toBe(initial);
  });

  it('overview clears selection without resetting expansion or focus', () => {
    const selected = run(
      { type: 'nodeSelected', nodeId: IDS.anna, origin: 'chart-legend' },
      { type: 'focusMoved', focus: { rowId: IDS.james, column: 2 } },
    );
    const overview = reducer(selected, { type: 'overviewRequested' });
    expect(overview.selectedId).toBeNull();
    expect(overview.expandedIds).toBe(selected.expandedIds);
    expect(overview.focus).toBe(selected.focus);
    expect(reducer(overview, { type: 'overviewRequested' })).toBe(overview);
  });
});

describe('expansion', () => {
  it('toggles parents and ignores leaves', () => {
    const expanded = run({ type: 'expansionToggled', nodeId: IDS.branch1, origin: 'keyboard' });
    expect(visibleNames(expanded)).toHaveLength(9);
    expect(
      reducer(expanded, { type: 'expansionToggled', nodeId: IDS.branch2, origin: 'keyboard' }),
    ).toBe(expanded);
  });

  it('pointer toggles focus the toggled row', () => {
    const state = run({ type: 'expansionToggled', nodeId: IDS.branch1, origin: 'pointer' });
    expect(state.focus).toEqual({ rowId: IDS.branch1, column: null });
    expect(state.selectedId).toBeNull();
  });

  it('shows twelve rows fully expanded', () => {
    const state = run(
      { type: 'expansionSet', nodeId: IDS.branch1, expanded: true },
      { type: 'expansionSet', nodeId: IDS.anna, expanded: true },
    );
    expect(visibleNames(state)).toHaveLength(12);
  });

  it('collapsing retains descendant expansion and hidden selection', () => {
    const state = run(
      { type: 'expansionSet', nodeId: IDS.branch1, expanded: true },
      { type: 'expansionSet', nodeId: IDS.anna, expanded: true },
      { type: 'nodeSelected', nodeId: IDS.newPaid, origin: 'row-pointer' },
      { type: 'expansionToggled', nodeId: IDS.branch1, origin: 'pointer' },
    );
    expect(state.selectedId).toBe(IDS.newPaid);
    expect(state.expandedIds.has(IDS.anna)).toBe(true);
    expect(visibleNames(state)).toHaveLength(4);

    const reopened = reducer(state, { type: 'expansionSet', nodeId: IDS.branch1, expanded: true });
    expect(visibleNames(reopened)).toHaveLength(12);
  });

  it('moves hidden focus to the collapsing ancestor without changing selection', () => {
    const state = run(
      { type: 'expansionSet', nodeId: IDS.branch1, expanded: true },
      { type: 'focusMoved', focus: { rowId: IDS.robert, column: 7 } },
      { type: 'expansionSet', nodeId: IDS.branch1, expanded: false },
    );
    expect(state.focus).toEqual({ rowId: IDS.branch1, column: null });
    expect(state.selectedId).toBeNull();
  });

  it('keeps focus when collapsing an unrelated branch', () => {
    const state = run(
      { type: 'expansionSet', nodeId: IDS.branch1, expanded: true },
      { type: 'focusMoved', focus: { rowId: IDS.branch2, column: 1 } },
      { type: 'expansionSet', nodeId: IDS.branch1, expanded: false },
    );
    expect(state.focus).toEqual({ rowId: IDS.branch2, column: 1 });
  });

  it('returns the same state for no-op expansion changes', () => {
    expect(run({ type: 'expansionSet', nodeId: IDS.company, expanded: true })).toBe(initial);
  });
});

describe('derived chart independence', () => {
  it('expansion and focus changes preserve the selected scope and its values', () => {
    const selected = run({ type: 'nodeSelected', nodeId: IDS.anna, origin: 'chart-legend' });
    const moved = [
      { type: 'expansionSet', nodeId: IDS.branch1, expanded: false },
      { type: 'focusMoved', focus: { rowId: IDS.company, column: 3 } },
      { type: 'expansionSet', nodeId: IDS.company, expanded: false },
    ] satisfies DashboardAction[];
    const after = moved.reduce(reducer, selected);

    expect(after.selectedId).toBe(IDS.anna);
    expect(buildChartModel(tree, after.selectedId ?? tree.rootId)).toEqual(
      buildChartModel(tree, IDS.anna),
    );
  });

  it('numbers never change on interaction', () => {
    run(
      { type: 'expansionSet', nodeId: IDS.branch1, expanded: true },
      { type: 'nodeSelected', nodeId: IDS.robert, origin: 'row-pointer' },
    );
    expect(tree.nodes.get(IDS.branch1)?.values[5]).toBe(201);
    expect(tree.nodes.get(IDS.robert)?.values[6]).toBe(58);
  });
});
