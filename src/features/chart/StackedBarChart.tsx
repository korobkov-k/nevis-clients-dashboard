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
import { CHART_HEIGHT_PX, PLOT_TOP_PX, X_AXIS_HEIGHT_PX } from './chartLayout';
import { ChartTooltip } from './ChartTooltip';

const AXIS_TICK = { fill: 'var(--color-content-secondary)', fontSize: 12 };

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
        barCategoryGap="10.75%"
        accessibilityLayer
        title={`Monthly clients chart: ${model.path.map((node) => node.name).join(' / ')}`}
        desc="Use the left and right arrow keys to read each month's values."
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
          cursor={{ fill: 'var(--color-surface-hover)' }}
          isAnimationActive={false}
          content={({ activeIndex }) =>
            activeIndex === undefined || activeIndex === null ? null : (
              <ChartTooltip model={model} monthIndex={Number(activeIndex)} />
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
