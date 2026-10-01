import { createContext, use, useState, useSyncExternalStore, type ReactNode } from 'react';
import { createHoverStore, type HoverStore, type HoverTarget } from './hoverStore';

const HoverContext = createContext<HoverStore | null>(null);

/** Scopes linked hover to one dashboard. Without a provider, hover linking is simply off. */
export function LinkedHoverProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createHoverStore);
  return <HoverContext value={store}>{children}</HoverContext>;
}

const noopSubscribe = () => () => undefined;
const noop = () => undefined;
const NO_ACTIONS = { hover: noop, unhover: noop };

/** Reads a primitive derived from the hover target; re-renders only when it changes. */
export function useHoverSelector<T extends string | number | boolean | null>(
  selector: (target: HoverTarget | null) => T,
): T {
  const store = use(HoverContext);
  return useSyncExternalStore(store?.subscribe ?? noopSubscribe, () =>
    selector(store?.get() ?? null),
  );
}

/** Stable hover/unhover callbacks for eligible elements. */
export function useHoverActions(): Pick<HoverStore, 'hover' | 'unhover'> {
  return use(HoverContext) ?? NO_ACTIONS;
}
