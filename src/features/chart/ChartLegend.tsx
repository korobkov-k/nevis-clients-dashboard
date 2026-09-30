import type { MouseEvent } from 'react';
import type { ChartSeries } from '../../domain/chartModel';
import { getChartColor } from '../../domain/chartPalette';

interface ChartLegendProps {
  series: readonly ChartSeries[];
  onSelect: (nodeId: string, event: MouseEvent<HTMLButtonElement>) => void;
}

/** Keyboard-operable legend; activating an entry drills into that node (it never hides series). */
export function ChartLegend({ series, onSelect }: ChartLegendProps) {
  return (
    <ul aria-label="Series" className="flex flex-wrap justify-center gap-x-4 gap-y-1">
      {series.map((item) => (
        <li key={item.nodeId}>
          <button
            type="button"
            className="flex h-6 items-center gap-1 rounded-[4px] px-1 text-footnote whitespace-nowrap text-content-secondary hover:text-content-primary"
            onClick={(event) => {
              onSelect(item.nodeId, event);
            }}
          >
            <span
              aria-hidden="true"
              className="size-2 shrink-0 rounded-[2px]"
              style={{ backgroundColor: getChartColor(item.colorIndex) }}
            />
            {item.name}
          </button>
        </li>
      ))}
    </ul>
  );
}
