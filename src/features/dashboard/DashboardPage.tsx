import { useEffect, useRef, type MouseEvent } from 'react';
import { useClientsQuery } from '../../api/useClientsQuery';
import { usePrefersReducedMotion } from '../../components/usePrefersReducedMotion';
import { Dashboard } from './Dashboard';
import { DashboardSkeleton } from './DashboardSkeleton';
import { LoadError } from './LoadError';

export interface DashboardPageProps {
  /** Opt-in skeleton shimmer while loading. */
  loadingShimmer?: boolean;
}

/** Owns the request lifecycle and swaps loading, error and loaded states. */
export function DashboardPage({ loadingShimmer = false }: DashboardPageProps) {
  const query = useClientsQuery();
  const reducedMotion = usePrefersReducedMotion();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const restoreFocusAfterRetry = useRef(false);

  // The focused Retry button disappears on success; move focus to the page heading.
  useEffect(() => {
    if (query.isSuccess && restoreFocusAfterRetry.current) {
      restoreFocusAfterRetry.current = false;
      headingRef.current?.focus();
    }
  }, [query.isSuccess]);

  const handleRetry = (event: MouseEvent<HTMLButtonElement>) => {
    restoreFocusAfterRetry.current = document.activeElement === event.currentTarget;
    void query.refetch();
  };

  const announcement = query.isSuccess
    ? 'Client data loaded.'
    : query.isError && query.isFetching
      ? 'Retrying…'
      : '';

  return (
    <>
      {query.isError ? (
        <LoadError
          retrying={query.isFetching}
          failureCount={query.errorUpdateCount}
          onRetry={handleRetry}
        />
      ) : (
        <main className="flex min-h-screen min-w-0 flex-col gap-4 px-4 py-6">
          <h1 ref={headingRef} tabIndex={-1} className="text-title font-normal">
            Clients
          </h1>
          {query.isPending ? (
            <DashboardSkeleton shimmer={loadingShimmer} />
          ) : (
            <Dashboard data={query.data} animateChart={!reducedMotion} />
          )}
        </main>
      )}
      <p role="status" className="sr-only">
        {announcement}
      </p>
    </>
  );
}
