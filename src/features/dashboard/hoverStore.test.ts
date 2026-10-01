import { describe, expect, it, vi } from 'vitest';
import { createHoverStore } from './hoverStore';

describe('createHoverStore', () => {
  it('records the hovered node and month', () => {
    const store = createHoverStore();
    store.hover('a', 3);
    expect(store.get()).toEqual({ target: { nodeId: 'a', monthIndex: 3 }, source: 'pointer' });
    store.hover('b');
    expect(store.get().target).toEqual({ nodeId: 'b', monthIndex: null });
  });

  it('notifies only on real changes and keeps the snapshot stable', () => {
    const store = createHoverStore();
    const listener = vi.fn();
    store.subscribe(listener);
    store.hover('a');
    const snapshot = store.get();
    store.hover('a');
    expect(store.get()).toBe(snapshot);
    store.hover('a', 2);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('unhovers only the node that is still hovered', () => {
    const store = createHoverStore();
    store.hover('b');
    store.unhover('a'); // a late leave from the previous row
    expect(store.get().target?.nodeId).toBe('b');
    store.unhover('b');
    expect(store.get()).toEqual({ target: null, source: null });
  });

  it('treats keyboard focus as hover, with pointer hover taking precedence', () => {
    const store = createHoverStore();
    store.focus('row');
    expect(store.get()).toEqual({ target: { nodeId: 'row', monthIndex: null }, source: 'focus' });
    store.hover('segment', 4);
    expect(store.get().source).toBe('pointer');
    store.unhover('segment');
    expect(store.get()).toEqual({ target: { nodeId: 'row', monthIndex: null }, source: 'focus' });
    store.focus(null);
    expect(store.get().target).toBeNull();
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
