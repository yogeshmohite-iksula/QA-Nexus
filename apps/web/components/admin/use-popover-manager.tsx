// Shared popover state — one-at-a-time + outside-click + ESC.
// Source: _SHELL Developer Handoff.md §4 ("One open at a time. Close on
// outside-click and Esc.")
//
// Used by the 7 topbar dropdowns (project switcher, search, quick create,
// notifications, theme toggle = direct click, mode toggle = direct click,
// user menu). Opening any popover closes all others.

'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

/** Stable popover identifiers. Add new entries as we wire more dropdowns. */
export type PopoverId =
  | 'project-switcher'
  | 'search'
  | 'quick-create'
  | 'notifications'
  | 'user-menu';

interface PopoverManagerValue {
  openId: PopoverId | null;
  isOpen: (id: PopoverId) => boolean;
  open: (id: PopoverId) => void;
  close: () => void;
  toggle: (id: PopoverId) => void;
}

const PopoverManagerContext = createContext<PopoverManagerValue | null>(null);

interface ProviderProps {
  children: ReactNode;
}

/** Wraps AdminShell so all 7 topbar dropdowns share state. */
export function PopoverManagerProvider({ children }: ProviderProps) {
  const [openId, setOpenId] = useState<PopoverId | null>(null);

  const isOpen = useCallback((id: PopoverId) => openId === id, [openId]);
  const open = useCallback((id: PopoverId) => setOpenId(id), []);
  const close = useCallback(() => setOpenId(null), []);
  const toggle = useCallback((id: PopoverId) => setOpenId((cur) => (cur === id ? null : id)), []);

  // ESC closes whichever popover is open.
  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenId(null);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [openId]);

  const value = useMemo<PopoverManagerValue>(
    () => ({ openId, isOpen, open, close, toggle }),
    [openId, isOpen, open, close, toggle],
  );

  return <PopoverManagerContext.Provider value={value}>{children}</PopoverManagerContext.Provider>;
}

/** Hook for consumers. Throws if used outside the provider. */
export function usePopoverManager(): PopoverManagerValue {
  const ctx = useContext(PopoverManagerContext);
  if (!ctx) {
    throw new Error('usePopoverManager must be used inside <PopoverManagerProvider>');
  }
  return ctx;
}

/**
 * Outside-click hook. Pass a ref to the popover root (button + panel
 * combined wrapper) — click anywhere outside calls onOutside().
 * Used by each individual popover button to close itself on outside click.
 */
export function useClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  onOutside: () => void,
  enabled: boolean,
) {
  // Use a ref to avoid re-binding the listener every render when onOutside
  // closure changes. The handler reads the current callback via the ref.
  const cbRef = useRef(onOutside);
  useEffect(() => {
    cbRef.current = onOutside;
  }, [onOutside]);

  useEffect(() => {
    if (!enabled) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const root = ref.current;
      if (!root) return;
      if (e.target instanceof Node && !root.contains(e.target)) {
        cbRef.current();
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [enabled, ref]);
}
