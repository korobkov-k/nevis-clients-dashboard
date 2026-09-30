import { memo, useId, type MouseEvent } from 'react';
import type { TreeNode } from '../../domain/clientTree';
import { formatCount } from '../../domain/formatCount';
import { MONTHS } from '../../domain/months';
import { RowName } from './RowName';

interface TreegridRowProps {
  node: TreeNode;
  expanded: boolean | undefined;
  selected: boolean;
  /** The column holding the roving tab stop in this row: null = row, undefined = not here. */
  tabStopColumn: number | null | undefined;
  onRowClick: (nodeId: string) => void;
  onChevronClick: (nodeId: string) => void;
}

const tabIndexFor = (isTabStop: boolean) => (isTabStop ? 0 : -1);

export const TreegridRow = memo(function TreegridRow({
  node,
  expanded,
  selected,
  tabStopColumn,
  onRowClick,
  onChevronClick,
}: TreegridRowProps) {
  const nameId = useId();
  const handleChevronClick = (event: MouseEvent) => {
    event.stopPropagation();
    onChevronClick(node.id);
  };

  return (
    <tr
      role="row"
      aria-level={node.depth}
      aria-posinset={node.siblingIndex + 1}
      aria-setsize={node.siblingCount}
      aria-expanded={expanded}
      aria-selected={selected}
      aria-labelledby={nameId}
      tabIndex={tabIndexFor(tabStopColumn === null)}
      data-row-id={node.id}
      className={`treegrid-row group/row h-14 cursor-pointer ${
        selected
          ? 'bg-surface-selected hover:bg-surface-selected-hover'
          : 'bg-background-secondary hover:bg-surface-hover'
      }`}
      onClick={() => {
        onRowClick(node.id);
      }}
    >
      <th
        id={nameId}
        role="rowheader"
        scope="row"
        tabIndex={tabIndexFor(tabStopColumn === 0)}
        data-column={0}
        className="sticky left-0 z-10 border-b border-outline-solid group-last/row:border-b-0 w-[calc(var(--name-column)+16px)] max-w-[calc(var(--name-column)+16px)] min-w-[calc(var(--name-column)+16px)] max-sm:shadow-[inset_-1px_0_0_var(--color-outline-solid)] bg-inherit py-0 pr-2 pl-4 text-left font-normal"
      >
        <RowName node={node} expanded={expanded} onChevronClick={handleChevronClick} />
      </th>
      {MONTHS.map((month, index) => (
        <td
          key={month.key}
          role="gridcell"
          tabIndex={tabIndexFor(tabStopColumn === index + 1)}
          data-column={index + 1}
          className="w-[92px] border-b border-outline-solid py-0 pl-4 text-right group-last/row:border-b-0 tabular-nums-lining last:w-[116px] last:pr-6"
        >
          {formatCount(node.values[index] ?? 0)}
        </td>
      ))}
    </tr>
  );
});
