/**
 * Chart geometry and Recharts props shared by the live chart and its loading skeleton, so
 * swapping one for the other never shifts the plot, grid or month labels.
 */

/** 320 px plot plus axis label space, as in Figma. */
export const CHART_HEIGHT_PX = 361;

/** Space under the plot for month labels, including Figma's 12 px gap below the baseline. */
export const X_AXIS_HEIGHT_PX = 31;

/** Space above the plot so the top tick label is not clipped. */
export const PLOT_TOP_PX = 10;

/** Y-axis label column (26 px labels + 12 px gap). */
export const Y_AXIS_WIDTH_PX = 38;

/** Gap on each side of a bar as a fraction of its month band (Figma: 87.5 px bar in 111.5 px). */
export const BAR_GAP_RATIO = 0.1075;

export const BAR_RADIUS_PX = 4;

/** Panel chrome shared by ChartPanel and its skeleton. */
export const CHART_PANEL_CLASS = 'flex flex-col gap-4 px-4 pt-4 pb-4';

const AXIS_TICK = { fill: 'var(--color-content-secondary)', fontSize: 12 };

export const CHART_PROPS = {
  margin: { top: PLOT_TOP_PX, right: 0, bottom: 0, left: 0 },
  barCategoryGap: `${BAR_GAP_RATIO * 100}%`,
} as const;

export const GRID_PROPS = {
  vertical: false,
  stroke: 'var(--color-outline-dotted)',
  strokeDasharray: '1 6',
  strokeLinecap: 'round',
} as const;

export const X_AXIS_PROPS = {
  dataKey: 'label',
  axisLine: false,
  tickLine: false,
  tickSize: 0,
  tickMargin: 15,
  height: X_AXIS_HEIGHT_PX,
  interval: 'preserveStartEnd',
  minTickGap: 12,
  tick: AXIS_TICK,
} as const;

export const Y_AXIS_PROPS = {
  allowDecimals: false,
  axisLine: false,
  tickLine: false,
  tickSize: 0,
  tickMargin: 12,
  width: Y_AXIS_WIDTH_PX,
  tick: AXIS_TICK,
} as const;
