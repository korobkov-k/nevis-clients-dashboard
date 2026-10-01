import type { CSSProperties } from 'react';
import { MONTHS } from '../../domain/months';
import {
  FRAME_CLASS,
  NAME_CELL_CLASS,
  ROW_CLASS,
  ROW_NAME_CLASS,
  SCROLLER_CLASS,
  TABLE_CLASS,
  TreegridHeader,
  VALUE_CELL_CLASS,
} from './treegridLayout';

/** Depths of the four initial rows: Company and its three branches. */
const ROW_DEPTHS = [1, 2, 2, 2];
const BLOCK = 'inline-block h-4 rounded-[4px] bg-skeleton align-middle';

interface TreegridSkeletonProps {
  shimmer: boolean;
}

/** Decorative stand-in using the real table markup, header and row geometry. */
export function TreegridSkeleton({ shimmer }: TreegridSkeletonProps) {
  return (
    <div className={FRAME_CLASS}>
      <div className={SCROLLER_CLASS}>
        <table className={TABLE_CLASS}>
          <TreegridHeader />
          <tbody>
            {ROW_DEPTHS.map((depth, index) => (
              <tr
                key={index}
                data-testid="skeleton-row"
                className={`${ROW_CLASS} ${shimmer ? 'shimmer-x' : ''}`}
              >
                <th className={NAME_CELL_CLASS}>
                  <span
                    className={ROW_NAME_CLASS}
                    style={{ '--tree-depth': depth - 1 } as CSSProperties}
                  >
                    <span className="size-4 shrink-0" />
                    <span className={`${BLOCK} w-24`} />
                  </span>
                </th>
                {MONTHS.map((month) => (
                  <td key={month.key} className={VALUE_CELL_CLASS}>
                    <span className={`${BLOCK} w-8`} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
