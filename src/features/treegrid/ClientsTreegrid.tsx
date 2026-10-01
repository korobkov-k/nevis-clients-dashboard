import { useCallback, useId, useRef, useState, type FocusEvent, type KeyboardEvent } from 'react';
import { hasChildren, type TreeNode } from '../../domain/clientTree';
import { MONTHS } from '../../domain/months';
import type { FocusLocation, SelectionOrigin } from '../dashboard/dashboardState';
import { FRAME_CLASS, SCROLLER_CLASS, TABLE_CLASS, TreegridHeader } from './treegridLayout';
import { useHoverActions } from '../dashboard/linkedHover';
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
  const scroller = table.parentElement;
  const scrollLeft = scroller?.scrollLeft ?? 0;
  const scrollTarget = location.column === null ? element.querySelector('th') : element;
  scrollTarget?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  // The sticky name cell is always visible but sits inside the scroll padding, so revealing
  // it would needlessly scroll the months back to the start.
  if (scroller && (location.column === null || location.column === 0)) {
    scroller.scrollLeft = scrollLeft;
  }
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
  const hoverActions = useHoverActions();

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
    if (location === null) return;
    onFocusChange(location);
    // Keyboard focus (not focus from a click) highlights the row's node in the chart.
    const keyboardFocus = event.target instanceof Element && event.target.matches(':focus-visible');
    hoverActions.focus(keyboardFocus ? location.rowId : null);
  };

  const handleBlur = (event: FocusEvent<HTMLTableElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) hoverActions.focus(null);
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
    <div className={FRAME_CLASS}>
      <div className={SCROLLER_CLASS}>
        <table
          ref={tableRef}
          role="treegrid"
          aria-label={label}
          aria-describedby={helpId}
          className={TABLE_CLASS}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        >
          <TreegridHeader />
          <tbody>
            {rows.length === 0 && (
              <tr role="row">
                <td
                  role="gridcell"
                  colSpan={COLUMN_COUNT}
                  className="h-14 px-4 text-content-secondary"
                >
                  No clients to show
                </td>
              </tr>
            )}
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
        className="sr-only text-footnote text-content-secondary group-has-[table_:focus-visible]/treegrid:not-sr-only"
      >
        <span className="block px-4 pt-2 pb-3">
          Arrow keys move between rows and cells. Enter or Right/Left expands and collapses. Space
          selects a row for the chart. Type a name to jump to it.
        </span>
      </p>
    </div>
  );
}
