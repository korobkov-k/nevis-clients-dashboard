import { memo, useId, type MouseEvent } from 'react';
import type { TreeNode } from '../../domain/clientTree';
import { formatCount } from '../../domain/formatCount';
import { MONTHS } from '../../domain/months';
import { useHoverActions, useHoverSelector } from '../dashboard/linkedHover';
import { RowName } from './RowName';
import { NAME_CELL_CLASS, ROW_CLASS, VALUE_CELL_CLASS } from './treegridLayout';

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

/** Linked hover (from the chart, legend or path) uses the same colour as pointer hover. */
function rowBackground(selected: boolean, linkedHover: boolean): string {
  if (selected) {
    return linkedHover
      ? 'bg-surface-selected-hover'
      : 'bg-surface-selected hover:bg-surface-selected-hover';
  }
  return linkedHover ? 'bg-surface-hover' : 'bg-background-secondary hover:bg-surface-hover';
}

export const TreegridRow = memo(function TreegridRow({
  node,
  expanded,
  selected,
  tabStopColumn,
  onRowClick,
  onChevronClick,
}: TreegridRowProps) {
  const nameId = useId();
  // Focus-driven hover is already shown by the focus ring, so rows react to pointer hover only.
  const linkedHover = useHoverSelector(
    ({ target, source }) => source === 'pointer' && target?.nodeId === node.id,
  );
  const { hover, unhover } = useHoverActions();
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
      className={`treegrid-row ${ROW_CLASS} cursor-pointer ${rowBackground(selected, linkedHover)}`}
      onClick={() => {
        onRowClick(node.id);
      }}
      onMouseEnter={() => {
        hover(node.id);
      }}
      onMouseLeave={() => {
        unhover(node.id);
      }}
    >
      <th
        id={nameId}
        role="rowheader"
        scope="row"
        tabIndex={tabIndexFor(tabStopColumn === 0)}
        data-column={0}
        className={NAME_CELL_CLASS}
      >
        <RowName node={node} expanded={expanded} onChevronClick={handleChevronClick} />
      </th>
      {MONTHS.map((month, index) => (
        <td
          key={month.key}
          role="gridcell"
          tabIndex={tabIndexFor(tabStopColumn === index + 1)}
          data-column={index + 1}
          className={VALUE_CELL_CLASS}
        >
          {formatCount(node.values[index] ?? 0)}
        </td>
      ))}
    </tr>
  );
});
