import {
  Bar,
  BarChart,
  BarStack,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type BarShapeProps,
} from 'recharts';
import { memo, useMemo, useState } from 'react';
import type { ChartModel, ChartMonthDatum } from '../../domain/chartModel';
import { getChartColor } from '../../domain/chartPalette';
import { formatCount } from '../../domain/formatCount';
import { useHoverActions } from '../dashboard/linkedHover';
import { BarAnchoredTooltip } from './BarAnchoredTooltip';
import { HoverableSegment } from './HoverableSegment';
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
  const { hover, unhover } = useHoverActions();

  // One stable shape renderer per series, so linked hover never re-renders Recharts itself.
  const segmentShapes = useMemo(
    () =>
      model.series.map(
        (series) =>
          function SeriesSegment(props: BarShapeProps) {
            return <HoverableSegment {...props} seriesId={series.nodeId} />;
          },
      ),
    [model.series],
  );

  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT_PX}>
      <BarChart
        data={model.months}
        {...CHART_PROPS}
        // Pointer-only by product decision: exact values are reachable through the treegrid, so
        // the chart is a single labelled image rather than a second keyboard surface.
        accessibilityLayer={false}
        role="img"
        // aria-label instead of an SVG <title>, which would also show a native browser tooltip.
        aria-label={`Monthly clients chart: ${model.path.map((node) => node.name).join(' / ')}. Exact values are in the table below.`}
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
              isAnimationActive={animateBars}
              shape={segmentShapes[seriesIndex]}
              onMouseEnter={(_, monthIndex) => {
                hover(series.nodeId, monthIndex);
              }}
              onMouseLeave={() => {
                unhover(series.nodeId);
              }}
              onClick={() => {
                // The clicked segment unmounts with the old scope and never sees mouseleave.
                unhover(series.nodeId);
                onSelectSeries(series.nodeId);
              }}
            />
          ))}
        </BarStack>
      </BarChart>
    </ResponsiveContainer>
  );
});
