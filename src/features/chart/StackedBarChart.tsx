import {
  Bar,
  BarChart,
  BarStack,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { memo, useState } from 'react';
import type { ChartModel, ChartMonthDatum } from '../../domain/chartModel';
import { getChartColor } from '../../domain/chartPalette';
import { formatCount } from '../../domain/formatCount';
import { BarAnchoredTooltip } from './BarAnchoredTooltip';
import {
  BAR_RADIUS_PX,
  CHART_HEIGHT_PX,
  CHART_PROPS,
  GRID_PROPS,
  X_AXIS_PROPS,
  Y_AXIS_PROPS,
} from './chartLayout';

/** The tooltip wrapper covers the chart; BarAnchoredTooltip positions itself inside it. */
const TOOLTIP_WRAPPER_STYLE = { width: '100%', height: '100%', pointerEvents: 'none' } as const;
const ACTIVE_SEGMENT = { className: 'chart-segment-active' };

interface StackedBarChartProps {
  model: ChartModel;
  /** Disabled for reduced motion and deterministic tests/screenshots. */
  animate: boolean;
  onSelectSeries: (nodeId: string) => void;
}

/**
 * Recharts rendering of a chart model; each segment reports its series node ID on click.
 * Memoised so focus and expansion changes elsewhere never re-run Recharts' stacking.
 */
export const StackedBarChart = memo(function StackedBarChart({
  model,
  animate,
  onSelectSeries,
}: StackedBarChartProps) {
  // Bars appear in place on first render (replacing the skeleton without a grow-in flash) and
  // animate only when the scope changes.
  const [initialModel] = useState(model);
  const animateBars = animate && model !== initialModel;

  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT_PX}>
      <BarChart
        data={model.months}
        {...CHART_PROPS}
        accessibilityLayer
        // aria-label instead of an SVG <title>, which would also show a native browser tooltip.
        aria-label={`Monthly clients chart: ${model.path.map((node) => node.name).join(' / ')}. Use the left and right arrow keys to read each month.`}
      >
        <CartesianGrid {...GRID_PROPS} />
        <XAxis {...X_AXIS_PROPS} />
        <YAxis
          {...Y_AXIS_PROPS}
          domain={[0, model.yAxis.max]}
          ticks={model.yAxis.ticks}
          tickFormatter={formatCount}
        />
        <Tooltip
          cursor={false}
          isAnimationActive={false}
          position={{ x: 0, y: 0 }}
          wrapperStyle={TOOLTIP_WRAPPER_STYLE}
          content={({ activeIndex }) =>
            activeIndex === undefined || activeIndex === null ? null : (
              <BarAnchoredTooltip model={model} monthIndex={Number(activeIndex)} />
            )
          }
        />
        <BarStack radius={BAR_RADIUS_PX}>
          {model.series.map((series, seriesIndex) => (
            <Bar
              key={series.nodeId}
              name={series.name}
              dataKey={(month: ChartMonthDatum) => month.values[seriesIndex] ?? 0}
              fill={getChartColor(series.colorIndex)}
              activeBar={ACTIVE_SEGMENT}
              isAnimationActive={animateBars}
              onClick={() => {
                onSelectSeries(series.nodeId);
              }}
            />
          ))}
        </BarStack>
      </BarChart>
    </ResponsiveContainer>
  );
});
