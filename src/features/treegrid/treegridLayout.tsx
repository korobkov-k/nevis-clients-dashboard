import { MONTHS } from '../../domain/months';

/**
 * Table geometry shared by the treegrid and its loading skeleton, so swapping one for the
 * other never shifts the layout.
 */
export const FRAME_CLASS =
  'group/treegrid [--name-column:min(264px,50vw)] [--tree-indent:16px] sm:[--tree-indent:28px]';
export const SCROLLER_CLASS =
  'overflow-x-auto overscroll-x-contain scroll-pl-[calc(var(--name-column)+16px)]';
export const TABLE_CLASS = 'w-full border-separate border-spacing-0 text-body';
export const ROW_CLASS = 'group/row h-14';
const NAME_COLUMN_WIDTH =
  'w-[calc(var(--name-column)+16px)] max-w-[calc(var(--name-column)+16px)] min-w-[calc(var(--name-column)+16px)] max-sm:shadow-[inset_-1px_0_0_var(--color-outline-solid)]';
export const NAME_CELL_CLASS = `sticky left-0 z-10 border-b border-outline-solid group-last/row:border-b-0 ${NAME_COLUMN_WIDTH} bg-inherit py-0 pr-2 pl-4 text-left font-normal`;
export const VALUE_CELL_CLASS =
  'w-[92px] border-b border-outline-solid py-0 pl-4 text-right group-last/row:border-b-0 tabular-nums-lining last:w-[116px] last:pr-6';
/** Indents a row name by its depth; set `--tree-depth` on the element. */
export const ROW_NAME_CLASS =
  'flex min-w-0 items-center gap-2 pl-[calc(var(--tree-depth)*var(--tree-indent))]';

export function TreegridHeader() {
  return (
    <thead>
      <tr role="row" className="h-14 [&>th]:border-b [&>th]:border-outline-solid">
        <th
          role="columnheader"
          scope="col"
          className={`sticky left-0 z-10 bg-background-secondary pl-4 ${NAME_COLUMN_WIDTH}`}
        >
          <span className="sr-only">Name</span>
        </th>
        {MONTHS.map((month) => (
          <th
            key={month.key}
            role="columnheader"
            scope="col"
            className="pb-4 pl-4 text-right align-bottom font-normal whitespace-nowrap text-content-secondary last:pr-6"
          >
            {month.label}
          </th>
        ))}
      </tr>
    </thead>
  );
}
