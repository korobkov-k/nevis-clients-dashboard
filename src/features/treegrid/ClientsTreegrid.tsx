import { useCallback, useId, useRef, useState, type FocusEvent, type KeyboardEvent } from 'react';
import { hasChildren, type TreeNode } from '../../domain/clientTree';
import { MONTHS } from '../../domain/months';
import type { FocusLocation, SelectionOrigin } from '../dashboard/dashboardState';
import { TreegridRow } from './TreegridRow';
import {
  findTypeaheadMatch,
  isTypeaheadKey,
  resolveTreegridKey,
  type KeyInput,
} from './treegridKeyboard';
import { createTypeaheadBuffer } from './typeaheadBuffer';

const COLUMN_COUNT = MONTHS.length + 1;
const ROW_HEIGHT_PX = 56;

export interface ClientsTreegridProps {
  label: string;
  /** Visible rows in display order. */
  rows: readonly TreeNode[];
  expandedIds: ReadonlySet<string>;
  selectedId: string | null;
  /** The single location in the Tab sequence. */
  tabStop: FocusLocation;
  onSelect: (nodeId: string, origin: Extract<SelectionOrigin, `row-${string}`>) => void;
  onToggle: (nodeId: string, origin: 'pointer' | 'keyboard') => void;
  onSetExpanded: (nodeId: string, expanded: boolean) => void;
  onFocusChange: (focus: FocusLocation) => void;
}

function readLocation(target: EventTarget): FocusLocation | null {
  if (!(target instanceof HTMLElement)) return null;
  const rowId = target.closest<HTMLElement>('tr[data-row-id]')?.dataset.rowId;
  if (rowId === undefined) return null;
  const column = target.dataset.column;
  return { rowId, column: column === undefined ? null : Number(column) };
}

function findElement(table: HTMLTableElement, { rowId, column }: FocusLocation) {
  const row = table.querySelector<HTMLElement>(`tr[data-row-id="${CSS.escape(rowId)}"]`);
  if (row === null) return null;
  return column === null ? row : row.querySelector<HTMLElement>(`[data-column="${column}"]`);
}

/** Moves DOM focus; the table's focus listener records it as the logical focus location. */
function focusElement(table: HTMLTableElement | null, location: FocusLocation) {
  if (table === null) return;
  const element = findElement(table, location);
  if (element === null) return;
  element.focus({ preventScroll: true });
  // Rows scroll by their sticky name cell so horizontal position is kept.
  const scrollTarget = location.column === null ? element.querySelector('th') : element;
  scrollTarget?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

/**
 * Native table with WAI treegrid semantics: rows-first keyboard navigation, one roving tab
 * stop, and selection (Space / click) kept separate from disclosure (Enter / chevron).
 */
export function ClientsTreegrid({
  label,
  rows,
  expandedIds,
  selectedId,
  tabStop,
  onSelect,
  onToggle,
  onSetExpanded,
  onFocusChange,
}: ClientsTreegridProps) {
  const tableRef = useRef<HTMLTableElement>(null);
  const [typeahead] = useState(createTypeaheadBuffer);
  const helpId = useId();

  const handleRowClick = useCallback(
    (nodeId: string) => {
      focusElement(tableRef.current, { rowId: nodeId, column: null });
      onSelect(nodeId, 'row-pointer');
    },
    [onSelect],
  );

  const handleChevronClick = useCallback(
    (nodeId: string) => {
      focusElement(tableRef.current, { rowId: nodeId, column: null });
      onToggle(nodeId, 'pointer');
    },
    [onToggle],
  );

  const handleFocus = (event: FocusEvent<HTMLTableElement>) => {
    const location = readLocation(event.target);
    if (location !== null) onFocusChange(location);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTableElement>) => {
    if (event.nativeEvent.isComposing) return;
    const current = readLocation(event.target) ?? tabStop;
    const input: KeyInput = {
      key: event.key,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      altKey: event.altKey,
      shiftKey: event.shiftKey,
    };
    const command = resolveTreegridKey(input, {
      rows,
      expandedIds,
      focus: current,
      columnCount: COLUMN_COUNT,
      pageSize: Math.max(1, Math.floor(window.innerHeight / ROW_HEIGHT_PX) - 1),
    });

    if (command === null) {
      if (current.column !== null || !isTypeaheadKey(input)) return;
      event.preventDefault();
      const query = typeahead.append(event.key, event.timeStamp);
      const match = findTypeaheadMatch(rows, current.rowId, query);
      if (match !== null) focusElement(tableRef.current, { rowId: match, column: null });
      return;
    }

    event.preventDefault();
    switch (command.type) {
      case 'focus':
        focusElement(tableRef.current, command.focus);
        break;
      case 'setExpanded':
        onSetExpanded(command.nodeId, command.expanded);
        break;
      case 'toggle':
        onToggle(command.nodeId, 'keyboard');
        break;
      case 'select':
        onSelect(command.nodeId, 'row-keyboard');
        break;
      case 'none':
        break;
    }
  };

  return (
    <div className="group/treegrid [--name-column:min(264px,45vw)] [--tree-indent:16px] sm:[--tree-indent:28px]">
      <div className="overflow-x-auto overscroll-x-contain scroll-pl-[calc(var(--name-column)+16px)]">
        <table
          ref={tableRef}
          role="treegrid"
          aria-label={label}
          aria-describedby={helpId}
          className="w-full border-collapse text-body"
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
        >
          <thead>
            <tr role="row" className="h-14 [&>th]:border-b [&>th]:border-outline-solid">
              <th
                role="columnheader"
                scope="col"
                className="sticky left-0 z-10 bg-background-secondary pl-4"
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
          <tbody>
            {rows.map((node) => (
              <TreegridRow
                key={node.id}
                node={node}
                expanded={hasChildren(node) ? expandedIds.has(node.id) : undefined}
                selected={node.id === selectedId}
                tabStopColumn={node.id === tabStop.rowId ? tabStop.column : undefined}
                onRowClick={handleRowClick}
                onChevronClick={handleChevronClick}
              />
            ))}
          </tbody>
        </table>
      </div>
      <p
        id={helpId}
        className="sr-only px-4 pt-2 pb-3 text-footnote text-content-secondary group-has-[table_:focus-visible]/treegrid:not-sr-only"
      >
        Arrow keys move between rows and cells. Enter or Right/Left expands and collapses. Space
        selects a row for the chart. Type a name to jump to it.
      </p>
    </div>
  );
}
