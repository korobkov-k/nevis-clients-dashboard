import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { Panel } from '../../components/Panel';
import { MONTHS } from '../../domain/months';
import {
  BAR_RADIUS_PX,
  CHART_HEIGHT_PX,
  CHART_PANEL_CLASS,
  CHART_PROPS,
  GRID_PROPS,
  PLOT_TOP_PX,
  X_AXIS_HEIGHT_PX,
  X_AXIS_PROPS,
  Y_AXIS_PROPS,
  Y_AXIS_WIDTH_PX,
} from './chartLayout';

/** Fixed, deliberately data-neutral placeholder values on a 0–500 scale. */
const PLACEHOLDER_VALUES = [275, 350, 275, 350, 275, 350, 275, 350, 275, 350, 275, 350];
const PLACEHOLDER_DATA = MONTHS.map((month, index) => ({
  label: month.label,
  value: PLACEHOLDER_VALUES[index] ?? 0,
}));
/** Five gridlines like a real scope; no tick labels, so no invented numbers are shown. */
const PLACEHOLDER_TICKS = [0, 125, 250, 375, 500];
const hideTickLabel = () => '';

interface ChartSkeletonProps {
  shimmer: boolean;
}

/**
 * Loading stand-in rendered with the same Recharts grid, axes and margins as the live chart,
 * with neutral grey bars. Static and non-interactive.
 */
export function ChartSkeleton({ shimmer }: ChartSkeletonProps) {
  return (
    <Panel aria-hidden="true" className={CHART_PANEL_CLASS}>
      <div className="flex h-9 flex-col justify-center gap-1.5">
        <span className="h-4 w-40 rounded-[4px] bg-skeleton" />
        <span className="h-3 w-24 rounded-[4px] bg-skeleton" />
      </div>
      <div className="relative text-footnote tabular-nums-lining">
        <ResponsiveContainer width="100%" height={CHART_HEIGHT_PX}>
          <BarChart data={PLACEHOLDER_DATA} accessibilityLayer={false} {...CHART_PROPS}>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis {...X_AXIS_PROPS} />
            <YAxis
              {...Y_AXIS_PROPS}
              domain={[0, 500]}
              ticks={PLACEHOLDER_TICKS}
              tickFormatter={hideTickLabel}
            />
            <Bar
              dataKey="value"
              fill="var(--color-skeleton)"
              radius={BAR_RADIUS_PX}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
        {shimmer && (
          // A white band sweeping over the plot only shows on the grey bars.
          <div
            data-testid="chart-shimmer"
            className="shimmer-y pointer-events-none absolute right-0"
            style={{ left: Y_AXIS_WIDTH_PX, top: PLOT_TOP_PX, bottom: X_AXIS_HEIGHT_PX }}
          />
        )}
      </div>
      <div className="h-4" />
    </Panel>
  );
}
