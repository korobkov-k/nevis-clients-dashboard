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
    <ul aria-label="Series" className="flex flex-wrap justify-center gap-x-2 gap-y-2">
      {series.map((item) => (
        <li key={item.nodeId}>
          <button
            type="button"
            className="relative flex h-4 items-center gap-1 rounded-[4px] px-1 text-footnote before:absolute before:-inset-y-1 before:inset-x-0 whitespace-nowrap text-content-secondary hover:text-content-primary"
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
