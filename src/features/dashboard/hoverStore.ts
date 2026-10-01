/** What is being pointed at: a node, and for chart segments also the month. */
export interface HoverTarget {
  nodeId: string;
  /** Set only by chart segments, so the chart can highlight that one section. */
  monthIndex: number | null;
}

/**
 * The effective linked hover. Pointer hover wins; otherwise the keyboard-focused treegrid row
 * acts as hover, so keyboard users get the same chart highlight.
 */
export interface HoverState {
  target: HoverTarget | null;
  source: 'pointer' | 'focus' | null;
}

const IDLE: HoverState = { target: null, source: null };

/**
 * Transient linked-hover state, kept outside the dashboard reducer: it changes on every
 * pointer move, and subscribers read it through narrow selectors so only the affected rows,
 * segments and legend items re-render.
 */
export function createHoverStore() {
  let pointer: HoverTarget | null = null;
  let focusedNodeId: string | null = null;
  let state = IDLE;
  const listeners = new Set<() => void>();

  const update = () => {
    const next: HoverState = pointer
      ? { target: pointer, source: 'pointer' }
      : focusedNodeId !== null
        ? { target: { nodeId: focusedNodeId, monthIndex: null }, source: 'focus' }
        : IDLE;
    if (
      next.source === state.source &&
      next.target?.nodeId === state.target?.nodeId &&
      next.target?.monthIndex === state.target?.monthIndex
    ) {
      return;
    }
    state = next;
    listeners.forEach((listener) => {
      listener();
    });
  };

  return {
    get: () => state,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    hover: (nodeId: string, monthIndex: number | null = null) => {
      pointer = { nodeId, monthIndex };
      update();
    },
    /** Clears pointer hover only if it still belongs to `nodeId`, so leave/enter can't race. */
    unhover: (nodeId: string) => {
      if (pointer?.nodeId !== nodeId) return;
      pointer = null;
      update();
    },
    /** Keyboard focus channel: the focused row's node, or null when focus leaves the grid. */
    focus: (nodeId: string | null) => {
      focusedNodeId = nodeId;
      update();
    },
  };
}

export type HoverStore = ReturnType<typeof createHoverStore>;
