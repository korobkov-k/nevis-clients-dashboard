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
import { memo } from 'react';
import type { ChartModel, ChartMonthDatum } from '../../domain/chartModel';
import { getChartColor } from '../../domain/chartPalette';
import { formatCount } from '../../domain/formatCount';
import { BarAnchoredTooltip } from './BarAnchoredTooltip';
import { BAR_GAP_RATIO, CHART_HEIGHT_PX, PLOT_TOP_PX, X_AXIS_HEIGHT_PX } from './chartLayout';

const AXIS_TICK = { fill: 'var(--color-content-secondary)', fontSize: 12 };
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
  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT_PX}>
      <BarChart
        data={model.months}
        margin={{ top: PLOT_TOP_PX, right: 0, bottom: 0, left: 0 }}
        barCategoryGap={`${BAR_GAP_RATIO * 100}%`}
        accessibilityLayer
        // aria-label instead of an SVG <title>, which would also show a native browser tooltip.
        aria-label={`Monthly clients chart: ${model.path.map((node) => node.name).join(' / ')}. Use the left and right arrow keys to read each month.`}
      >
        <CartesianGrid
          vertical={false}
          stroke="var(--color-outline-dotted)"
          strokeDasharray="1 6"
          strokeLinecap="round"
        />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tickSize={0}
          tickMargin={15}
          height={X_AXIS_HEIGHT_PX}
          interval="preserveStartEnd"
          minTickGap={12}
          tick={AXIS_TICK}
        />
        <YAxis
          domain={[0, model.yAxis.max]}
          ticks={model.yAxis.ticks}
          allowDecimals={false}
          axisLine={false}
          tickLine={false}
          tickSize={0}
          tickMargin={12}
          width={38}
          tick={AXIS_TICK}
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
        <BarStack radius={4}>
          {model.series.map((series, seriesIndex) => (
            <Bar
              key={series.nodeId}
              name={series.name}
              dataKey={(month: ChartMonthDatum) => month.values[seriesIndex] ?? 0}
              fill={getChartColor(series.colorIndex)}
              className="cursor-pointer"
              activeBar={ACTIVE_SEGMENT}
              isAnimationActive={animate}
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
