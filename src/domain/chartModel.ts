import { getNode, getPath, type ClientTree, type NodeLevel } from './clientTree';
import { getAxisScale, type AxisScale } from './axisScale';
import { MONTHS, type Month } from './months';

export interface ChartSeries {
  nodeId: string;
  name: string;
  /** Position among the node's siblings, which selects the palette colour. */
  colorIndex: number;
}

export interface ChartMonthDatum extends Month {
  /** One value per series, in series order. */
  values: readonly number[];
  /** Sum of the displayed series. */
  stackTotal: number;
  /** The scope node's own value for this month, straight from the source. */
  reportedTotal: number;
}

export type ChartKind = 'breakdown' | 'leaf';

export interface ChartModel {
  scopeId: string;
  /** Breakdown stacks the scope's immediate children; leaf shows the node's own values. */
  kind: ChartKind;
  path: readonly { id: string; name: string }[];
  groupingLabel: string;
  series: readonly ChartSeries[];
  months: readonly ChartMonthDatum[];
  yAxis: AxisScale;
}

const GROUPING_LABELS: Record<NodeLevel, string> = {
  company: 'By company',
  branch: 'By branch',
  adviser: 'By adviser',
  channel: 'By acquisition channel',
};

export const LEAF_GROUPING_LABEL = 'Monthly clients';

/**
 * Derives the chart for one scope. A node with children stacks exactly those children;
 * a leaf shows its own values. Source values are never normalised or reconciled, so the
 * breakdown total may legitimately differ from the reported parent value.
 */
export function buildChartModel(tree: ClientTree, scopeId: string): ChartModel {
  const scope = getNode(tree, scopeId);
  const children = scope.childIds.map((id) => getNode(tree, id));
  const seriesNodes = children.length > 0 ? children : [scope];
  const kind: ChartKind = children.length > 0 ? 'breakdown' : 'leaf';

  const series = seriesNodes.map((node) => ({
    nodeId: node.id,
    name: node.name,
    colorIndex: node.siblingIndex,
  }));

  const months = MONTHS.map((month, index): ChartMonthDatum => {
    const values = seriesNodes.map((node) => node.values[index] ?? 0);
    return {
      ...month,
      values,
      stackTotal: values.reduce((sum, value) => sum + value, 0),
      reportedTotal: scope.values[index] ?? 0,
    };
  });

  const firstChild = children[0];
  return {
    scopeId,
    kind,
    path: getPath(tree, scopeId).map(({ id, name }) => ({ id, name })),
    groupingLabel: firstChild ? GROUPING_LABELS[firstChild.level] : LEAF_GROUPING_LABEL,
    series,
    months,
    yAxis: getAxisScale(Math.max(0, ...months.map((month) => month.stackTotal))),
  };
}

/** The reported value to surface next to a breakdown total, or null when they agree. */
export function getReportedTotalMismatch(model: ChartModel, month: ChartMonthDatum): number | null {
  return model.kind === 'breakdown' && month.reportedTotal !== month.stackTotal
    ? month.reportedTotal
    : null;
}
