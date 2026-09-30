import { Panel } from '../../components/Panel';
import { usePrefersReducedMotion } from '../../components/usePrefersReducedMotion';
import { MONTHS } from '../../domain/months';
import { CHART_HEIGHT_PX, PLOT_TOP_PX, X_AXIS_HEIGHT_PX } from '../chart/chartLayout';

/** Fixed, deliberately data-neutral placeholder heights (fraction of the plot). */
const BAR_HEIGHTS = [0.55, 0.7, 0.55, 0.7, 0.55, 0.7, 0.55, 0.7, 0.55, 0.7, 0.55, 0.7];
const GRID_LINES = 5;
const SKELETON_ROWS = 4;

export interface DashboardSkeletonProps {
  /** Opt-in shimmer; static by default and always static under reduced motion. */
  shimmer?: boolean;
}

/**
 * Loading state with the dashboard's geometry: chart axes, twelve month positions and
 * neutral bars, plus the table header and four initial rows. Purely decorative: the page's
 * status region announces loading.
 */
export function DashboardSkeleton({ shimmer: shimmerRequested = false }: DashboardSkeletonProps) {
  const reducedMotion = usePrefersReducedMotion();
  const shimmer = shimmerRequested && !reducedMotion;
  const block = 'rounded-[4px] bg-skeleton';
  return (
    <div data-testid="dashboard-skeleton" className="contents">
      <Panel aria-hidden="true" className="flex flex-col gap-4 px-4 pt-4 pb-4">
        <div className="flex h-9 flex-col justify-center gap-1.5">
          <div className={`${block} h-4 w-40`} />
          <div className={`${block} h-3 w-24`} />
        </div>
        <div className="relative pl-[38px]" style={{ height: CHART_HEIGHT_PX }}>
          <div
            className="absolute inset-x-0 left-[38px] flex flex-col justify-between"
            style={{ top: PLOT_TOP_PX, bottom: X_AXIS_HEIGHT_PX }}
          >
            {Array.from({ length: GRID_LINES }, (_, index) => (
              <div key={index} className="border-t border-dotted border-outline-dotted" />
            ))}
          </div>
          <div
            className="absolute right-0 left-[38px] flex items-end"
            style={{ top: PLOT_TOP_PX, bottom: X_AXIS_HEIGHT_PX }}
          >
            {BAR_HEIGHTS.map((height, index) => (
              <div key={index} className="flex h-full flex-1 items-end justify-center">
                <div
                  data-testid="skeleton-bar"
                  className={`${block} w-[78.5%] ${shimmer ? 'shimmer-y' : ''}`}
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
        <div className="h-4" />
      </Panel>

      <Panel aria-hidden="true" className="overflow-hidden">
        <div className="overflow-hidden [--name-column:min(264px,50vw)]">
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
