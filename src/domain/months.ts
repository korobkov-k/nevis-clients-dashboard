/**
 * The fixed reporting year. Each node's `values[i]` belongs to `MONTHS[i]`.
 * Labels are literal strings so rendering never depends on timezone-sensitive date parsing.
 */
export interface Month {
  key: string;
  label: string;
  longLabel: string;
}

export const MONTHS: readonly Month[] = [
  { key: '2024-02', label: 'Feb 2024', longLabel: 'February 2024' },
  { key: '2024-03', label: 'Mar 2024', longLabel: 'March 2024' },
  { key: '2024-04', label: 'Apr 2024', longLabel: 'April 2024' },
  { key: '2024-05', label: 'May 2024', longLabel: 'May 2024' },
  { key: '2024-06', label: 'Jun 2024', longLabel: 'June 2024' },
  { key: '2024-07', label: 'Jul 2024', longLabel: 'July 2024' },
  { key: '2024-08', label: 'Aug 2024', longLabel: 'August 2024' },
  { key: '2024-09', label: 'Sep 2024', longLabel: 'September 2024' },
  { key: '2024-10', label: 'Oct 2024', longLabel: 'October 2024' },
  { key: '2024-11', label: 'Nov 2024', longLabel: 'November 2024' },
  { key: '2024-12', label: 'Dec 2024', longLabel: 'December 2024' },
  { key: '2025-01', label: 'Jan 2025', longLabel: 'January 2025' },
];

export const PERIOD_LABEL = `${MONTHS[0]?.longLabel ?? ''} to ${MONTHS.at(-1)?.longLabel ?? ''}`;
