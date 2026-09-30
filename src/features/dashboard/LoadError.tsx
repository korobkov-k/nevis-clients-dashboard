import type { MouseEvent } from 'react';

export interface LoadErrorProps {
  retrying: boolean;
  /** Increments per failure so a repeated failure is announced again. */
  failureCount: number;
  onRetry: (event: MouseEvent<HTMLButtonElement>) => void;
}

/** Full-viewport error that replaces the dashboard; the Retry control stays in place. */
export function LoadError({ retrying, failureCount, onRetry }: LoadErrorProps) {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-6">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <div key={failureCount} role="alert" className="flex flex-col gap-1">
          <h1 className="text-[20px] leading-7 font-medium">Couldn’t load client data</h1>
          <p className="text-content-secondary">
            The client data service didn’t respond as expected. Check your connection and try again.
          </p>
        </div>
        <button
          type="button"
          aria-disabled={retrying}
          className="h-9 rounded-[6px] bg-content-primary px-4 text-body text-background-secondary hover:bg-content-primary/85 aria-disabled:cursor-progress aria-disabled:opacity-70"
          onClick={(event) => {
            if (!retrying) onRetry(event);
          }}
        >
          {retrying ? 'Retrying…' : 'Retry'}
        </button>
      </div>
    </main>
  );
}
