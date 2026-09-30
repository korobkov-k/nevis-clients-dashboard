import { useEffect, useRef, useState, type MouseEvent } from 'react';
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
  // A refetch without data resets the query to pending, so the retry attempt is tracked here
  // to keep the error screen (and its focused Retry button) in place until the outcome.
  const [retrying, setRetrying] = useState(false);

  // The focused Retry button disappears on success; move focus to the page heading.
  useEffect(() => {
    if (query.isSuccess && restoreFocusAfterRetry.current) {
      restoreFocusAfterRetry.current = false;
      headingRef.current?.focus();
    }
  }, [query.isSuccess]);

  const handleRetry = (event: MouseEvent<HTMLButtonElement>) => {
    restoreFocusAfterRetry.current = document.activeElement === event.currentTarget;
    setRetrying(true);
    void query.refetch().finally(() => {
      setRetrying(false);
    });
  };

  const showError = query.isError || (retrying && !query.isSuccess);
  const announcement = query.isSuccess
    ? 'Client data loaded.'
    : showError
      ? retrying
        ? 'Retrying…'
        : ''
      : 'Loading client data…';

  return (
    <>
      {showError ? (
        <LoadError
          retrying={retrying}
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
