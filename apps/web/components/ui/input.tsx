// QA Nexus PM1 — Input (shadcn-pattern, PM1 palette)
// Implements the locked .input style from F06 Sign In: 48px tall, raised
// background, subtle border, teal focus ring. Optional leading icon via
// the InputWrap + InputIcon helpers.
//
// Source: PM1_UI_v2/frame  html view/F06 Sign In.html (.input + .input-wrap rules).

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** When true, reserves left padding (48px) for an icon rendered inside InputWrap. */
  hasIcon?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, hasIcon, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'border-border-subtle bg-raised text-text-primary h-12 w-full rounded-[4px] border text-[15px] outline-none transition-[border-color,box-shadow] duration-150',
          'placeholder:text-text-tertiary placeholder:opacity-50',
          'focus:border-primary focus:shadow-[0_0_0_1px_rgba(45,212,191,0.2)]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          hasIcon ? 'pl-12 pr-4' : 'px-4',
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

const InputWrap = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('relative', className)} {...props} />
  ),
);
InputWrap.displayName = 'InputWrap';

const InputIcon = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      aria-hidden="true"
      className={cn(
        'text-text-tertiary pointer-events-none absolute left-[14px] top-1/2 inline-flex -translate-y-1/2',
        className,
      )}
      {...props}
    />
  ),
);
InputIcon.displayName = 'InputIcon';

export { Input, InputWrap, InputIcon };
