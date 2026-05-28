'use client';
// Minimal Tooltip primitives — matches the Tooltip / TooltipTrigger / TooltipContent
// API used by components/f22-defect-detail/agents/AgentName.tsx.
// FIXME: UI-001 — replace with @radix-ui/react-tooltip once Radix is installed.

import * as React from 'react';
import { cn } from '@/lib/utils';

interface TooltipContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const TooltipCtx = React.createContext<TooltipContextValue>({
  open: false,
  setOpen: () => {},
});

export function Tooltip({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return (
    <TooltipCtx.Provider value={{ open, setOpen }}>
      <span className="relative inline-flex">{children}</span>
    </TooltipCtx.Provider>
  );
}

export function TooltipTrigger({
  children,
  asChild,
}: {
  children: React.ReactNode;
  asChild?: boolean;
}) {
  const { setOpen } = React.useContext(TooltipCtx);

  const hoverProps = {
    onMouseEnter: () => setOpen(true),
    onMouseLeave: () => setOpen(false),
    onFocus: () => setOpen(true),
    onBlur: () => setOpen(false),
  };

  if (asChild && React.isValidElement(children)) {
    // FIXME: UI-001 — asChild dynamic prop merge; type-safe once Radix installed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return React.cloneElement(children as React.ReactElement<any>, hoverProps);
  }

  return (
    <span
      onMouseEnter={hoverProps.onMouseEnter}
      onMouseLeave={hoverProps.onMouseLeave}
      onFocus={hoverProps.onFocus}
      onBlur={hoverProps.onBlur}
    >
      {children}
    </span>
  );
}

export function TooltipContent({
  children,
  side = 'top',
  className,
}: {
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}) {
  const { open } = React.useContext(TooltipCtx);
  if (!open) return null;

  const pos: Record<string, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-1',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1',
    left: 'right-full top-1/2 -translate-y-1/2 mr-1',
    right: 'left-full top-1/2 -translate-y-1/2 ml-1',
  };

  return (
    <span
      role="tooltip"
      className={cn(
        'absolute z-50 max-w-xs rounded-md border border-[color:var(--border)]',
        'bg-[color:var(--overlay)] px-2 py-1 text-[12px] text-[color:var(--t1)]',
        'pointer-events-none whitespace-nowrap shadow-md',
        pos[side],
        className,
      )}
    >
      {children}
    </span>
  );
}
