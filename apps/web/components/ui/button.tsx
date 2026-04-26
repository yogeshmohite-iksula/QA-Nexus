// QA Nexus PM1 — Button (shadcn-pattern, PM1 palette)
// Implements the locked btn-auth style from F06 Sign In and serves as the
// canonical CTA button for system actions across all 41 frames.
//
// Anti-drift: TEAL #2dd4bf is reserved for system actions only (Save, Approve,
// Generate, +Add, Authenticate). VIOLET #a78bfa is for AI surfaces only.
// Save buttons are NEVER violet. See PM1_UI_v2/UI Files/01_SYSTEM.md sec 3.1.

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-[4px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        // Primary teal CTA -- system actions (Authenticate, Save, Generate, etc.)
        // text uses --primary-ink (dark teal) for AA contrast against teal bg.
        primary: 'bg-primary text-[var(--primary-ink)] hover:bg-primary/90 active:bg-primary/80',
        // Secondary outline -- destructive-adjacent or low-emphasis
        secondary: 'border border-border-subtle bg-transparent text-text-primary hover:bg-overlay',
        // Ghost -- inline links/actions
        ghost: 'bg-transparent text-text-primary hover:bg-overlay',
      },
      size: {
        default: 'h-12 px-6 text-[16px]',
        sm: 'h-9 px-4 text-sm',
        lg: 'h-14 px-8 text-lg',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
