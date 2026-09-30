import { hasChildren, type TreeNode } from '../../domain/clientTree';
import type { FocusLocation } from '../dashboard/dashboardState';

/** What a key press asks the dashboard to do. `none` is a handled key with no effect. */
export type TreegridCommand =
  | { type: 'focus'; focus: FocusLocation }
  | { type: 'setExpanded'; nodeId: string; expanded: boolean }
  | { type: 'toggle'; nodeId: string }
  | { type: 'select'; nodeId: string }
  | { type: 'none' };

export interface KeyInput {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
}

export interface TreegridKeyContext {
  rows: readonly TreeNode[];
  expandedIds: ReadonlySet<string>;
  focus: FocusLocation;
  /** Name cell plus one cell per month. */
  columnCount: number;
  /** Rows moved by Page Up/Down. */
  pageSize: number;
}

const NONE: TreegridCommand = { type: 'none' };

/**
 * Maps a key to a command following the rows-first WAI treegrid model, with Space for
 * idempotent selection and Enter for disclosure. Returns null for keys that stay unhandled
 * (Tab, browser shortcuts, typeahead) so their default behaviour is preserved.
 */
export function resolveTreegridKey(
  input: KeyInput,
  { rows, expandedIds, focus, columnCount, pageSize }: TreegridKeyContext,
): TreegridCommand | null {
  if (input.altKey || input.metaKey || input.shiftKey) return null;
  if (input.ctrlKey && input.key !== 'Home' && input.key !== 'End') return null;

  const rowIndex = rows.findIndex((row) => row.id === focus.rowId);
  const row = rows[rowIndex];
  if (row === undefined) return null;

  const { column } = focus;
  const lastColumn = columnCount - 1;
  const isParent = hasChildren(row);
  const isExpanded = isParent && expandedIds.has(row.id);

  const toRow = (index: number): TreegridCommand => {
    const target = rows[Math.min(Math.max(index, 0), rows.length - 1)];
    return target === undefined || target.id === row.id
      ? NONE
      : { type: 'focus', focus: { rowId: target.id, column } };
  };
  const toColumn = (next: number | null): TreegridCommand =>
    next === column ? NONE : { type: 'focus', focus: { rowId: row.id, column: next } };
  const activateRow = (): TreegridCommand =>
    isParent ? { type: 'toggle', nodeId: row.id } : { type: 'select', nodeId: row.id };

  switch (input.key) {
    case 'ArrowDown':
      return rowIndex < rows.length - 1 ? toRow(rowIndex + 1) : NONE;
    case 'ArrowUp':
      return rowIndex > 0 ? toRow(rowIndex - 1) : NONE;
    case 'PageDown':
      return toRow(rowIndex + pageSize);
    case 'PageUp':
      return toRow(rowIndex - pageSize);
    case ' ':
      return { type: 'select', nodeId: row.id };
    case 'Home':
      if (input.ctrlKey || column === null) return toRow(0);
      return toColumn(0);
    case 'End':
      if (input.ctrlKey || column === null) return toRow(rows.length - 1);
      return toColumn(lastColumn);
    case 'ArrowRight':
      if (column === null) {
        return isParent && !isExpanded
          ? { type: 'setExpanded', nodeId: row.id, expanded: true }
          : toColumn(0);
      }
      return column < lastColumn ? toColumn(column + 1) : NONE;
    case 'ArrowLeft':
      if (column === null) {
        if (isExpanded) return { type: 'setExpanded', nodeId: row.id, expanded: false };
        return row.parentId === null
          ? NONE
          : { type: 'focus', focus: { rowId: row.parentId, column: null } };
      }
      return toColumn(column === 0 ? null : column - 1);
    case 'Enter':
      return column === null || column === 0 ? activateRow() : NONE;
    default:
      return null;
  }
}

/** A single printable character typed without command modifiers. */
export function isTypeaheadKey(input: KeyInput): boolean {
  return (
    input.key.length === 1 && input.key !== ' ' && !input.ctrlKey && !input.metaKey && !input.altKey
  );
}

/**
 * Finds the next visible row whose name starts with `query` (case-insensitive), wrapping.
 * A single character starts after the current row so repeated presses cycle through matches;
 * a longer prefix may keep matching the current row.
 */
export function findTypeaheadMatch(
  rows: readonly TreeNode[],
  currentRowId: string,
  query: string,
): string | null {
  const needle = query.toLocaleLowerCase();
  const start = rows.findIndex((row) => row.id === currentRowId);
  const offset = needle.length === 1 ? 1 : 0;
  for (let step = 0; step < rows.length; step += 1) {
    const candidate = rows[(start + offset + step + rows.length) % rows.length];
    if (candidate?.name.toLocaleLowerCase().startsWith(needle)) return candidate.id;
  }
  return null;
}
