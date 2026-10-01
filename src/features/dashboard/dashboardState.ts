import {
  getAncestorIds,
  hasChildren,
  isDescendantOf,
  type ClientTree,
} from '../../domain/clientTree';

/** A treegrid focus location. `column` is null for row focus, 0 for the name cell, 1–12 for months. */
export interface FocusLocation {
  rowId: string;
  column: number | null;
}

export interface DashboardState {
  /** Explicitly selected node; null means the Company overview. */
  selectedId: string | null;
  expandedIds: ReadonlySet<string>;
  /** Last logical treegrid focus location (the roving tab stop); null before any interaction. */
  focus: FocusLocation | null;
}

/** Where a selection came from. Each origin has its own expansion and focus consequences. */
export type SelectionOrigin =
  'row-pointer' | 'row-keyboard' | 'chart-segment' | 'chart-legend' | 'chart-breadcrumb';

export type DashboardAction =
  | { type: 'nodeSelected'; nodeId: string; origin: SelectionOrigin }
  | { type: 'expansionToggled'; nodeId: string; origin: 'pointer' | 'keyboard' }
  | { type: 'expansionSet'; nodeId: string; expanded: boolean }
  | { type: 'focusMoved'; focus: FocusLocation }
  | { type: 'overviewRequested' };

export function createInitialState(tree: ClientTree): DashboardState {
  return { selectedId: null, expandedIds: new Set([tree.rootId]), focus: null };
}

const rowFocus = (rowId: string): FocusLocation => ({ rowId, column: null });

function sameFocus(a: FocusLocation | null, b: FocusLocation | null): boolean {
  return a?.rowId === b?.rowId && a?.column === b?.column;
}

function withFocus(state: DashboardState, focus: FocusLocation | null): DashboardState {
  return sameFocus(state.focus, focus) ? state : { ...state, focus };
}

function setExpanded(
  tree: ClientTree,
  state: DashboardState,
  nodeId: string,
  expanded: boolean,
): DashboardState {
  const node = tree.nodes.get(nodeId);
  if (node === undefined || !hasChildren(node) || state.expandedIds.has(nodeId) === expanded) {
    return state;
  }
  const expandedIds = new Set(state.expandedIds);
  if (expanded) {
    expandedIds.add(nodeId);
  } else {
    expandedIds.delete(nodeId);
  }
  // Descendant expansion flags and a hidden selection are retained; only focus that would be
  // hidden moves up to the collapsing row.
  const focusHidden =
    !expanded && state.focus !== null && isDescendantOf(tree, state.focus.rowId, nodeId);
  return { ...state, expandedIds, focus: focusHidden ? rowFocus(nodeId) : state.focus };
}

function revealAncestors(tree: ClientTree, state: DashboardState, nodeId: string): DashboardState {
  const hidden = getAncestorIds(tree, nodeId).filter((id) => !state.expandedIds.has(id));
  if (hidden.length === 0) return state;
  return { ...state, expandedIds: new Set([...state.expandedIds, ...hidden]) };
}

function selectNode(
  tree: ClientTree,
  state: DashboardState,
  nodeId: string,
  origin: SelectionOrigin,
): DashboardState {
  if (!tree.nodes.has(nodeId)) return state;
  const selected = state.selectedId === nodeId ? state : { ...state, selectedId: nodeId };

  switch (origin) {
    case 'row-pointer':
      return withFocus(selected, rowFocus(nodeId));
    case 'row-keyboard':
      return selected;
    case 'chart-segment':
    case 'chart-legend':
    case 'chart-breadcrumb':
      // Repeating a chart selection (e.g. clicking a leaf bar) is a no-op.
      if (selected === state) return state;
      // Reveal the row and make it the next treegrid entry target, without its children.
      return withFocus(revealAncestors(tree, selected, nodeId), rowFocus(nodeId));
  }
}

/** Pure reducer; every user intent updates selection, expansion and logical focus atomically. */
export function createDashboardReducer(tree: ClientTree) {
  return function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
    switch (action.type) {
      case 'nodeSelected':
        return selectNode(tree, state, action.nodeId, action.origin);
      case 'expansionToggled': {
        const next = setExpanded(tree, state, action.nodeId, !state.expandedIds.has(action.nodeId));
        return action.origin === 'pointer' ? withFocus(next, rowFocus(action.nodeId)) : next;
      }
      case 'expansionSet':
        return setExpanded(tree, state, action.nodeId, action.expanded);
      case 'focusMoved':
        return tree.nodes.has(action.focus.rowId) ? withFocus(state, action.focus) : state;
      case 'overviewRequested':
        return state.selectedId === null ? state : { ...state, selectedId: null };
    }
  };
}
