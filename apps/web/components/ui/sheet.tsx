'use client';
// Minimal Sheet primitives — matches the Sheet / SheetContent / SheetTitle
// API used by components/f22-defect-detail/RightRail.tsx (mobile drawer).
// FIXME: UI-002 — replace with @radix-ui/react-dialog once Radix is installed.

import * as React from 'react';
import { cn } from '@/lib/utils';

interface SheetCtxValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SheetCtx = React.createContext<SheetCtxValue>({
  open: false,
  onOpenChange: () => {},
});

export function Sheet({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  // Lock body scroll while the drawer is open (Hard Rule 14 behaviour).
  React.useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return <SheetCtx.Provider value={{ open, onOpenChange }}>{children}</SheetCtx.Provider>;
}

interface SheetContentProps {
  children: React.ReactNode;
  side?: 'left' | 'right' | 'top' | 'bottom';
  className?: string;
  'aria-label'?: string;
}

export function SheetContent({
  children,
  side = 'right',
  className,
  'aria-label': ariaLabel,
}: SheetContentProps) {
  const { open, onOpenChange } = React.useContext(SheetCtx);
  if (!open) return null;

  const sideClass: Record<string, string> = {
    right: 'right-0 top-0 h-full',
    left: 'left-0 top-0 h-full',
    top: 'top-0 left-0 w-full',
    bottom: 'bottom-0 left-0 w-full',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className={cn(
          'fixed z-50 overflow-y-auto bg-[color:var(--surface)]',
          sideClass[side],
          className,
        )}
      >
        {children}
      </div>
    </>
  );
}

export function SheetTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <h2 className={cn('text-base font-semibold', className)}>{children}</h2>;
}
