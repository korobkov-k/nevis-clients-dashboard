/** What the pointer is over: a node, and for chart segments also the month. */
export interface HoverTarget {
  nodeId: string;
  /** Set only by chart segments, so the chart can highlight that one section. */
  monthIndex: number | null;
}

/**
 * Transient linked-hover state, kept outside the dashboard reducer: it changes on every
 * pointer move, and subscribers read it through narrow selectors so only the affected rows,
 * segments and legend items re-render.
 */
export function createHoverStore() {
  let current: HoverTarget | null = null;
  const listeners = new Set<() => void>();

  const set = (next: HoverTarget | null) => {
    if (current?.nodeId === next?.nodeId && current?.monthIndex === next?.monthIndex) return;
    current = next;
    listeners.forEach((listener) => {
      listener();
    });
  };

  return {
    get: () => current,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    hover: (nodeId: string, monthIndex: number | null = null) => {
      set({ nodeId, monthIndex });
    },
    /** Clears the hover only if it still belongs to `nodeId`, so leave/enter order can't race. */
    unhover: (nodeId: string) => {
      if (current?.nodeId === nodeId) set(null);
    },
  };
}

export type HoverStore = ReturnType<typeof createHoverStore>;
