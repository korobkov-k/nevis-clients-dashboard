import { Panel } from '../../components/Panel';
import { usePrefersReducedMotion } from '../../components/usePrefersReducedMotion';
import { ChartSkeleton } from '../chart/ChartSkeleton';
import { TreegridSkeleton } from '../treegrid/TreegridSkeleton';

export interface DashboardSkeletonProps {
  /** Opt-in shimmer; static by default and always static under reduced motion. */
  shimmer?: boolean;
}

/**
 * Loading state built from the chart's and table's own layout primitives, so the dashboard
 * replaces it without shifting. Purely decorative: the page's status region announces loading.
 */
export function DashboardSkeleton({ shimmer: shimmerRequested = false }: DashboardSkeletonProps) {
  const reducedMotion = usePrefersReducedMotion();
  const shimmer = shimmerRequested && !reducedMotion;
  return (
    <div data-testid="dashboard-skeleton" className="contents">
      <ChartSkeleton shimmer={shimmer} />
      <Panel aria-hidden="true" className="overflow-hidden">
        <TreegridSkeleton shimmer={shimmer} />
      </Panel>
    </div>
  );
}
