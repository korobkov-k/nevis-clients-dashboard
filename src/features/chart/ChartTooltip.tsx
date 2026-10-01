import { getChartColor } from '../../domain/chartPalette';
import { getReportedTotalMismatch, type ChartModel } from '../../domain/chartModel';
import { formatCount } from '../../domain/formatCount';

interface ChartTooltipProps {
  model: ChartModel;
  monthIndex: number;
}

/**
 * Month tooltip: every displayed series (zeros included), then the breakdown total and, only
 * when the source disagrees, the reported total. Leaves show just their own value.
 */
export function ChartTooltip({ model, monthIndex }: ChartTooltipProps) {
  const month = model.months[monthIndex];
  if (month === undefined) return null;
  const reportedTotal = getReportedTotalMismatch(model, month);

  return (
    <div
      aria-hidden="true"
      className="min-w-44 rounded-panel bg-background-secondary px-3 py-2 text-footnote shadow-[0_2px_12px_rgb(20_20_19/0.12)] tabular-nums-lining"
    >
      <p className="mb-1 font-medium">{month.longLabel}</p>
      <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-0.5">
        {model.series.map((series, index) => (
          <div key={series.nodeId} className="contents">
            <dt className="flex items-center gap-1.5 text-content-secondary">
              <span
                aria-hidden="true"
                className="size-2 shrink-0 rounded-[2px]"
                style={{ backgroundColor: getChartColor(series.colorIndex) }}
              />
              {series.name}
            </dt>
            <dd className="text-right">{formatCount(month.values[index] ?? 0)}</dd>
          </div>
        ))}
        {model.kind === 'breakdown' && (
          <div className="contents">
            <dt className="mt-1 border-t border-outline-solid pt-1">Breakdown total</dt>
            <dd className="mt-1 border-t border-outline-solid pt-1 text-right font-medium">
              {formatCount(month.stackTotal)}
            </dd>
          </div>
        )}
        {reportedTotal !== null && (
          <div className="contents">
            <dt>Reported total</dt>
            <dd className="text-right font-medium">{formatCount(reportedTotal)}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
