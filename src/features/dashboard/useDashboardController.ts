import { useMemo, useReducer } from 'react';
import { buildChartModel } from '../../domain/chartModel';
import type { ClientTree } from '../../domain/clientTree';
import { getNearestVisibleId, getVisibleRows } from '../../domain/visibleRows';
import {
  createDashboardReducer,
  createInitialState,
  type FocusLocation,
  type SelectionOrigin,
} from './dashboardState';

export interface DashboardActions {
  selectNode: (nodeId: string, origin: SelectionOrigin) => void;
  toggleExpanded: (nodeId: string, origin: 'pointer' | 'keyboard') => void;
  setExpanded: (nodeId: string, expanded: boolean) => void;
  moveFocus: (focus: FocusLocation) => void;
  showOverview: () => void;
}

/**
 * Dashboard-scoped controller: one reducer owns selection, expansion and logical focus;
 * everything the chart and treegrid render is derived and memoised per dependency.
 */
export function useDashboardController(tree: ClientTree) {
  const reducer = useMemo(() => createDashboardReducer(tree), [tree]);
  const [state, dispatch] = useReducer(reducer, tree, createInitialState);
  const { selectedId, expandedIds, focus } = state;

  const visibleRows = useMemo(() => getVisibleRows(tree, expandedIds), [tree, expandedIds]);

  // Depends on selection only: expansion and focus changes never rebuild chart data.
  const chartScopeId = selectedId ?? tree.rootId;
  const chartModel = useMemo(() => buildChartModel(tree, chartScopeId), [tree, chartScopeId]);

  // The roving tab stop: Company before any interaction, otherwise the last focus location,
  // falling back to its nearest visible ancestor (row focus) when hidden.
  const tabStop = useMemo((): FocusLocation => {
    if (focus === null) return { rowId: tree.rootId, column: null };
    const visibleId = getNearestVisibleId(tree, expandedIds, focus.rowId);
    return visibleId === focus.rowId ? focus : { rowId: visibleId, column: null };
  }, [tree, expandedIds, focus]);

  const actions = useMemo(
    (): DashboardActions => ({
      selectNode: (nodeId, origin) => {
        dispatch({ type: 'nodeSelected', nodeId, origin });
      },
      toggleExpanded: (nodeId, origin) => {
        dispatch({ type: 'expansionToggled', nodeId, origin });
      },
      setExpanded: (nodeId, expanded) => {
        dispatch({ type: 'expansionSet', nodeId, expanded });
      },
      moveFocus: (next) => {
        dispatch({ type: 'focusMoved', focus: next });
      },
      showOverview: () => {
        dispatch({ type: 'overviewRequested' });
      },
    }),
    [],
  );

  return { selectedId, expandedIds, visibleRows, chartModel, tabStop, actions };
}
