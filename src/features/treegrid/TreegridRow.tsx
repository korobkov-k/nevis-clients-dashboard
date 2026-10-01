import { memo, useId, type MouseEvent } from 'react';
import type { TreeNode } from '../../domain/clientTree';
import { formatCount } from '../../domain/formatCount';
import { MONTHS } from '../../domain/months';
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
      className={`treegrid-row ${ROW_CLASS} cursor-pointer ${
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
