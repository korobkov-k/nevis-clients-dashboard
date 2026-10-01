import { useLayoutEffect, useRef, useState } from 'react';
import { useChartWidth, usePlotArea, useYAxisScale } from 'recharts';
import type { ChartModel } from '../../domain/chartModel';
import { BAR_GAP_RATIO } from './chartLayout';
import { ChartTooltip } from './ChartTooltip';
import { placeTooltip } from './tooltipPlacement';

interface BarAnchoredTooltipProps {
  model: ChartModel;
  monthIndex: number;
}

/**
 * Positions the month tooltip next to its bar rather than the cursor, inside the chart.
 * Rendered as Recharts tooltip content, so it reads the live plot geometry from chart hooks.
 */
export function BarAnchoredTooltip({ model, monthIndex }: BarAnchoredTooltipProps) {
  const plot = usePlotArea();
  const chartWidth = useChartWidth();
  const yScale = useYAxisScale();
  const boxRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  // Content, and therefore size, depends on the scope and month.
  useLayoutEffect(() => {
    const box = boxRef.current;
    if (box === null) return;
    const { offsetWidth: width, offsetHeight: height } = box;
    setSize((current) =>
      current?.width === width && current.height === height ? current : { width, height },
    );
  }, [model, monthIndex]);

  const month = model.months[monthIndex];
  if (month === undefined || plot === undefined || yScale === undefined) return null;

  const band = plot.width / model.months.length;
  const barLeft = plot.x + band * (monthIndex + BAR_GAP_RATIO);
  const barRight = plot.x + band * (monthIndex + 1 - BAR_GAP_RATIO);
  const barTop = yScale(month.stackTotal) ?? plot.y + plot.height;

  const position =
    size === null
      ? null
      : placeTooltip({
          anchor: { barLeft, barRight, barTop },
          size,
          bounds: {
            left: 0,
            top: plot.y,
            width: chartWidth ?? plot.x + plot.width,
            height: plot.height,
          },
        });

  return (
    <div
      ref={boxRef}
      className="absolute"
      style={
        position === null
          ? { visibility: 'hidden', left: 0, top: 0 }
          : { left: position.left, top: position.top }
      }
    >
      <ChartTooltip model={model} monthIndex={monthIndex} />
    </div>
  );
}
