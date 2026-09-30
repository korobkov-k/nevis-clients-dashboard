import { Panel } from '../../components/Panel';
import { MONTHS } from '../../domain/months';
import { CHART_HEIGHT_PX } from '../chart/StackedBarChart';

/** Fixed, non-data placeholder heights (fraction of the plot) for the twelve month positions. */
const BAR_HEIGHTS = [0.62, 0.66, 0.7, 0.74, 0.78, 0.82, 0.86, 0.64, 0.64, 0.64, 0.64, 0.9];
const GRID_LINES = 5;
const SKELETON_ROWS = 4;

export interface DashboardSkeletonProps {
  /** Opt-in shimmer; static by default and always static under reduced motion. */
  shimmer?: boolean;
}

/**
 * Loading state with the dashboard's geometry: chart axes, twelve month positions and
 * neutral bars, plus the table header and four initial rows. Announced once as a whole.
 */
export function DashboardSkeleton({ shimmer = false }: DashboardSkeletonProps) {
  const block = 'rounded-[4px] bg-skeleton';
  return (
    <div role="status" className="contents">
      <span className="sr-only">Loading client data…</span>

      <Panel aria-hidden="true" className="flex flex-col gap-4 px-4 pt-4 pb-4">
        <div className="flex flex-col gap-1.5 py-0.5">
          <div className={`${block} h-4 w-40`} />
          <div className={`${block} h-3 w-24`} />
        </div>
        <div className="relative pl-[38px]" style={{ height: CHART_HEIGHT_PX }}>
          <div className="absolute inset-x-0 top-[10px] bottom-[28px] left-[38px] flex flex-col justify-between">
            {Array.from({ length: GRID_LINES }, (_, index) => (
              <div key={index} className="border-t border-dotted border-outline-dotted" />
            ))}
          </div>
          <div className="absolute top-[10px] right-0 bottom-[28px] left-[38px] flex items-end">
            {BAR_HEIGHTS.map((height, index) => (
              <div key={index} className="flex h-full flex-1 items-end justify-center px-[10.75%]">
                <div
                  data-testid="skeleton-bar"
                  className={`${block} w-full ${shimmer ? 'shimmer-y' : ''}`}
                  style={{ height: `${height * 100}%` }}
                />
              </div>
            ))}
          </div>
          <div className="absolute right-0 bottom-0 left-[38px] flex h-4">
            {MONTHS.map((month) => (
              <span
                key={month.key}
                className="flex-1 truncate text-center text-footnote text-content-secondary max-sm:[&:nth-child(even)]:invisible"
              >
                {month.label}
              </span>
            ))}
          </div>
        </div>
        <div className="h-6" />
      </Panel>

      <Panel aria-hidden="true" className="overflow-hidden">
        <div className="overflow-hidden [--name-column:min(264px,45vw)]">
          <div className="flex h-14 min-w-max items-end border-b border-outline-solid pr-6 pb-4 pl-4">
            <div className="w-[var(--name-column)] shrink-0" />
            {MONTHS.map((month) => (
              <span
                key={month.key}
                className="w-[92px] shrink-0 pl-4 text-right whitespace-nowrap text-content-secondary"
              >
                {month.label}
              </span>
            ))}
          </div>
          {Array.from({ length: SKELETON_ROWS }, (_, index) => (
            <div
              key={index}
              data-testid="skeleton-row"
              className={`flex h-14 min-w-max items-center border-b border-outline-solid pr-6 pl-4 last:border-b-0 ${shimmer ? 'shimmer-x' : ''}`}
            >
              <div className="w-[var(--name-column)] shrink-0">
                <div className={`${block} h-4 w-28`} style={{ marginLeft: index === 0 ? 0 : 28 }} />
              </div>
              {MONTHS.map((month) => (
                <div key={month.key} className="flex w-[92px] shrink-0 justify-end pl-4">
                  <div className={`${block} h-4 w-8`} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
