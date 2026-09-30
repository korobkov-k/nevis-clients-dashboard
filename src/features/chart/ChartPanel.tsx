import { useId, useLayoutEffect, useRef, type MouseEvent } from 'react';
import { Panel } from '../../components/Panel';
import type { ChartModel } from '../../domain/chartModel';
import { PERIOD_LABEL } from '../../domain/months';
import { ChartLegend } from './ChartLegend';
import { StackedBarChart } from './StackedBarChart';

export interface ChartPanelProps {
  model: ChartModel;
  /** Whether a node is explicitly selected, which enables the overview reset. */
  hasSelection: boolean;
  animate?: boolean;
  onSelectNode: (nodeId: string, origin: 'chart-segment' | 'chart-legend') => void;
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

/** Chart surface with its scope context (path, grouping), overview reset and legend. */
export function ChartPanel({
  model,
  hasSelection,
  animate = true,
  onSelectNode,
  onShowOverview,
}: ChartPanelProps) {
  const headingId = useId();
  const descriptionId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const activatedLegendButton = useRef<HTMLButtonElement | null>(null);

  // A legend entry belongs to the previous scope, so it unmounts after activation; keep
  // keyboard focus inside the chart by moving it to the stable heading.
  useLayoutEffect(() => {
    const button = activatedLegendButton.current;
    activatedLegendButton.current = null;
    if (button !== null && !button.isConnected) headingRef.current?.focus();
  }, [model]);

  const handleLegendSelect = (nodeId: string, event: MouseEvent<HTMLButtonElement>) => {
    activatedLegendButton.current = event.currentTarget;
    onSelectNode(nodeId, 'chart-legend');
  };

  return (
    <Panel aria-labelledby={headingId} className="flex flex-col gap-4 px-4 pt-4 pb-4">
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h2
            ref={headingRef}
            id={headingId}
            tabIndex={-1}
            className="text-body font-medium break-words"
          >
            {model.path.map((node, index) => (
              <span key={node.id}>
                {index > 0 && <span className="px-1 text-content-secondary">/</span>}
                {node.name}
              </span>
            ))}
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
        <div className="text-footnote tabular-nums-lining">
          <StackedBarChart
            model={model}
            animate={animate}
            onSelectSeries={(nodeId) => {
              onSelectNode(nodeId, 'chart-segment');
            }}
          />
        </div>
      </figure>

      {model.kind === 'breakdown' ? (
        <ChartLegend series={model.series} onSelect={handleLegendSelect} />
      ) : (
        <div aria-hidden="true" className="h-6" />
      )}
    </Panel>
  );
}
