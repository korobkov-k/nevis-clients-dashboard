import { describe, expect, it, vi } from 'vitest';
import { createHoverStore } from './hoverStore';

describe('createHoverStore', () => {
  it('records the hovered node and month', () => {
    const store = createHoverStore();
    store.hover('a', 3);
    expect(store.get()).toEqual({ nodeId: 'a', monthIndex: 3 });
    store.hover('b');
    expect(store.get()).toEqual({ nodeId: 'b', monthIndex: null });
  });

  it('notifies only on real changes', () => {
    const store = createHoverStore();
    const listener = vi.fn();
    store.subscribe(listener);
    store.hover('a');
    store.hover('a');
    store.hover('a', 2);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('unhovers only the node that is still hovered', () => {
    const store = createHoverStore();
    store.hover('b');
    store.unhover('a'); // a late leave from the previous row
    expect(store.get()?.nodeId).toBe('b');
    store.unhover('b');
    expect(store.get()).toBeNull();
  });

  it('stops notifying after unsubscribe', () => {
    const store = createHoverStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    unsubscribe();
    store.hover('a');
    expect(listener).not.toHaveBeenCalled();
  });
});
