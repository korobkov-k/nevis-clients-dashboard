import { useMemo } from 'react';
import type { ClientsResponse } from '../../../shared/clientsContract';
import { Panel } from '../../components/Panel';
import { buildClientTree } from '../../domain/clientTree';
import { ChartPanel } from '../chart/ChartPanel';
import { ClientsTreegrid } from '../treegrid/ClientsTreegrid';
import { useDashboardController } from './useDashboardController';

export interface DashboardProps {
  data: ClientsResponse;
  animateChart?: boolean;
}

/** Linked chart and treegrid over one loaded client tree. */
export function Dashboard({ data, animateChart = true }: DashboardProps) {
  const tree = useMemo(() => buildClientTree(data), [data]);
  const { selectedId, expandedIds, visibleRows, chartModel, tabStop, actions } =
    useDashboardController(tree);

  return (
    <>
      <ChartPanel
        model={chartModel}
        hasSelection={selectedId !== null}
        animate={animateChart}
        onSelectNode={actions.selectNode}
        onShowOverview={actions.showOverview}
      />
      <Panel aria-label="Monthly detail" className="overflow-hidden">
        <ClientsTreegrid
          label="Clients by month"
          rows={visibleRows}
          expandedIds={expandedIds}
          selectedId={selectedId}
          tabStop={tabStop}
          onSelect={actions.selectNode}
          onToggle={actions.toggleExpanded}
          onSetExpanded={actions.setExpanded}
          onFocusChange={actions.moveFocus}
        />
      </Panel>
    </>
  );
}
