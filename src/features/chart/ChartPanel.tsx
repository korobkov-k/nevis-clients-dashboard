import { memo, useCallback, useId, useLayoutEffect, useRef, type MouseEvent } from 'react';
import { Panel } from '../../components/Panel';
import type { ChartModel } from '../../domain/chartModel';
import { PERIOD_LABEL } from '../../domain/months';
import { ChartBreadcrumbs } from './ChartBreadcrumbs';
import { ChartLegend } from './ChartLegend';
import { CHART_HEIGHT_PX, CHART_PANEL_CLASS } from './chartLayout';
import { StackedBarChart } from './StackedBarChart';

export interface ChartPanelProps {
  model: ChartModel;
  /** Whether a node is explicitly selected, which enables the overview reset. */
  hasSelection: boolean;
  animate?: boolean;
  onSelectNode: (
    nodeId: string,
    origin: 'chart-segment' | 'chart-legend' | 'chart-breadcrumb',
  ) => void;
  onShowOverview: () => void;
}

function describe(model: ChartModel): string {
  const scope = model.path.map((node) => node.name).join(' / ');
  const chart =
    model.kind === 'leaf'
      ? `Bar chart of monthly clients for ${scope}`
      : `Stacked bar chart of monthly clients for ${scope}, ${model.groupingLabel.toLowerCase()}`;
  return `${chart}, ${PERIOD_LABEL}. Exact values are in the table below.`;
}

/** Chart surface with its scope context (clickable path, grouping), overview reset and legend. */
export const ChartPanel = memo(function ChartPanel({
  model,
  hasSelection,
  animate = true,
  onSelectNode,
  onShowOverview,
}: ChartPanelProps) {
  const headingId = useId();
  const descriptionId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const activatedButton = useRef<HTMLButtonElement | null>(null);

  // Legend entries and breadcrumbs belong to the previous scope and may unmount after
  // activation; keep focus inside the chart by moving it to the stable heading.
  useLayoutEffect(() => {
    const button = activatedButton.current;
    activatedButton.current = null;
    const focusLost = document.activeElement === null || document.activeElement === document.body;
    if (button !== null && !button.isConnected && focusLost) headingRef.current?.focus();
  }, [model]);

  const handleLegendSelect = (nodeId: string, event: MouseEvent<HTMLButtonElement>) => {
    activatedButton.current = event.currentTarget;
    onSelectNode(nodeId, 'chart-legend');
  };

  const handleBreadcrumbSelect = (nodeId: string, event: MouseEvent<HTMLButtonElement>) => {
    activatedButton.current = event.currentTarget;
    onSelectNode(nodeId, 'chart-breadcrumb');
  };

  const handleSelectSeries = useCallback(
    (nodeId: string) => {
      onSelectNode(nodeId, 'chart-segment');
    },
    [onSelectNode],
  );

  return (
    <Panel aria-labelledby={headingId} className={CHART_PANEL_CLASS}>
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h2
            ref={headingRef}
            id={headingId}
            tabIndex={-1}
            className="text-body font-medium break-words"
          >
            <ChartBreadcrumbs path={model.path} onSelect={handleBreadcrumbSelect} />
          </h2>
          <p className="text-footnote text-content-secondary">{model.groupingLabel}</p>
        </div>
        <button
          type="button"
          aria-disabled={!hasSelection}
          className="h-8 shrink-0 rounded-[6px] border border-outline-solid px-3 text-footnote text-content-primary hover:bg-surface-hover aria-disabled:cursor-default aria-disabled:text-content-secondary aria-disabled:hover:bg-transparent"
          onClick={() => {
            if (hasSelection) onShowOverview();
          }}
        >
          Company overview
        </button>
      </header>

      <figure aria-labelledby={headingId} aria-describedby={descriptionId} className="m-0">
        <p id={descriptionId} className="sr-only">
          {describe(model)}
        </p>
        {model.series.length === 0 ? (
          <div
            className="grid place-items-center text-content-secondary"
            style={{ height: CHART_HEIGHT_PX }}
          >
            No data to display
          </div>
        ) : (
          <div className="chart-interactive text-footnote tabular-nums-lining">
            <StackedBarChart model={model} animate={animate} onSelectSeries={handleSelectSeries} />
          </div>
        )}
      </figure>

      {model.kind === 'breakdown' && model.series.length > 0 ? (
        <ChartLegend series={model.series} onSelect={handleLegendSelect} />
      ) : (
        <div aria-hidden="true" className="h-4" />
      )}
    </Panel>
  );
});
