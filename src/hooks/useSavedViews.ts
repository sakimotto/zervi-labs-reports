import { useCallback, useEffect, useState } from 'react';

export interface SavedView<T extends Record<string, any>> {
  id: string;
  name: string;
  state: T;
  createdAt: number;
}

const PREFIX = 'lms:savedViews:';

/**
 * Hook for persisting named filter presets in localStorage.
 * Each `key` (e.g. "equipment", "materials") gets its own bucket.
 */
export function useSavedViews<T extends Record<string, any>>(key: string) {
  const storageKey = PREFIX + key;
  const [views, setViews] = useState<SavedView<T>[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Initial load
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setViews(JSON.parse(raw));
    } catch {
      /* corrupted — ignore */
    }
  }, [storageKey]);

  const persist = useCallback(
    (next: SavedView<T>[]) => {
      setViews(next);
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        /* quota exceeded — silently fail */
      }
    },
    [storageKey],
  );

  const saveView = useCallback(
    (name: string, state: T): SavedView<T> => {
      const view: SavedView<T> = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: name.trim(),
        state,
        createdAt: Date.now(),
      };
      persist([view, ...views]);
      setActiveId(view.id);
      return view;
    },
    [persist, views],
  );

  const deleteView = useCallback(
    (id: string) => {
      persist(views.filter((v) => v.id !== id));
      if (activeId === id) setActiveId(null);
    },
    [activeId, persist, views],
  );

  const applyView = useCallback(
    (id: string): T | null => {
      const v = views.find((x) => x.id === id);
      if (!v) return null;
      setActiveId(id);
      return v.state;
    },
    [views],
  );

  return {
    views,
    activeId,
    setActiveId,
    saveView,
    deleteView,
    applyView,
  };
}
