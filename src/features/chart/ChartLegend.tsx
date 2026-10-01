import type { MouseEvent } from 'react';
import type { ChartSeries } from '../../domain/chartModel';
import { getChartColor } from '../../domain/chartPalette';
import { useHoverActions, useHoverSelector } from '../dashboard/linkedHover';

interface ChartLegendProps {
  series: readonly ChartSeries[];
  onSelect: (nodeId: string, event: MouseEvent<HTMLButtonElement>) => void;
}

/** Keyboard-operable legend; activating an entry drills into that node (it never hides series). */
export function ChartLegend({ series, onSelect }: ChartLegendProps) {
  return (
    <ul aria-label="Series" className="flex flex-wrap justify-center gap-x-2 gap-y-2">
      {series.map((item) => (
        <li key={item.nodeId}>
          <LegendItem item={item} onSelect={onSelect} />
        </li>
      ))}
    </ul>
  );
}

function LegendItem({
  item,
  onSelect,
}: {
  item: ChartSeries;
  onSelect: ChartLegendProps['onSelect'];
}) {
  const linkedHover = useHoverSelector(({ target }) => target?.nodeId === item.nodeId);
  const { hover, unhover } = useHoverActions();
  return (
    <button
      type="button"
      className={`relative flex h-4 items-center gap-1 rounded-[4px] px-1 text-footnote whitespace-nowrap before:absolute before:-inset-y-1 before:inset-x-0 hover:text-content-primary ${
        linkedHover ? 'text-content-primary' : 'text-content-secondary'
      }`}
      onClick={(event) => {
        unhover(item.nodeId);
        onSelect(item.nodeId, event);
      }}
      onMouseEnter={() => {
        hover(item.nodeId);
      }}
      onMouseLeave={() => {
        unhover(item.nodeId);
      }}
    >
      <span
        aria-hidden="true"
        className="size-2 shrink-0 rounded-[2px]"
        style={{ backgroundColor: getChartColor(item.colorIndex) }}
      />
      {item.name}
    </button>
  );
}
