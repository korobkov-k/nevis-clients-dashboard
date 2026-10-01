import { createContext, use, useState, useSyncExternalStore, type ReactNode } from 'react';
import { createHoverStore, type HoverState, type HoverStore } from './hoverStore';

const HoverContext = createContext<HoverStore | null>(null);

/** Scopes linked hover to one dashboard. Without a provider, hover linking is simply off. */
export function LinkedHoverProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createHoverStore);
  return <HoverContext value={store}>{children}</HoverContext>;
}

const noopSubscribe = () => () => undefined;
const noop = () => undefined;
const IDLE: HoverState = { target: null, source: null };
const NO_ACTIONS = { hover: noop, unhover: noop, focus: noop };

/** Reads a primitive derived from the hover state; re-renders only when it changes. */
export function useHoverSelector<T extends string | number | boolean | null>(
  selector: (state: HoverState) => T,
): T {
  const store = use(HoverContext);
  return useSyncExternalStore(store?.subscribe ?? noopSubscribe, () =>
    selector(store?.get() ?? IDLE),
  );
}

/** Stable callbacks for eligible elements (pointer hover) and the treegrid (focus). */
export function useHoverActions(): Pick<HoverStore, 'hover' | 'unhover' | 'focus'> {
  return use(HoverContext) ?? NO_ACTIONS;
}
