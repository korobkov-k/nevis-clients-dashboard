/**
 * Fixed ten-colour chart palette. Hex values live in `src/styles.css` (`--color-chart-N`);
 * the first five are the approved design colours and the rest a one-off generated extension.
 * A series keeps the colour of its position among its siblings, never of its render order.
 */
export const CHART_COLOR_COUNT = 10;

export function getChartColor(siblingIndex: number): string {
  const tokenNumber = (siblingIndex % CHART_COLOR_COUNT) + 1;
  return `var(--color-chart-${tokenNumber})`;
}
