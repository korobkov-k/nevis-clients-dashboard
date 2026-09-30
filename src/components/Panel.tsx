import type { ComponentPropsWithoutRef } from 'react';

/** White rounded surface shared by the chart and the table. */
export function Panel({ className = '', ...props }: ComponentPropsWithoutRef<'section'>) {
  return (
    <section {...props} className={`min-w-0 rounded-panel bg-background-secondary ${className}`} />
  );
}
