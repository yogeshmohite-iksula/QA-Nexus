// QA Nexus PM1 — PasswordInput (with eye-toggle)
// Used on F06b Set Password and F06c Reset Password.
// Source: PM1_UI_v2/frames - claude code build (PM1 v2.6-v2.8)/F06b Set Reset Password.html
// (.input + .eye-btn + .input-wrap rules + the inline eye-toggle script).

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface PasswordInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type'
> {
  /** Aria label for the eye-toggle button when password is hidden. Default: "Show password". */
  showLabel?: string;
  /** Aria label for the eye-toggle button when password is visible. Default: "Hide password". */
  hideLabel?: string;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, showLabel = 'Show password', hideLabel = 'Hide password', ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);

    return (
      <div className="relative">
        <input
          ref={ref}
          type={visible ? 'text' : 'password'}
          className={cn(
            'border-border-subtle bg-raised text-text-primary h-12 w-full rounded-[4px] border text-[15px] outline-none transition-[border-color,box-shadow] duration-150',
            'placeholder:text-text-tertiary placeholder:opacity-50',
            'focus:border-primary focus:shadow-[0_0_0_1px_rgba(45,212,191,0.2)]',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'pl-4 pr-12',
            className,
          )}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-label={visible ? hideLabel : showLabel}
          className="text-text-tertiary hover:text-text-secondary absolute right-[14px] top-1/2 inline-flex h-5 w-5 -translate-y-1/2 cursor-pointer items-center justify-center border-0 bg-transparent p-0 transition-colors duration-150"
        >
          {visible ? (
            // eye-off icon
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M3 3l14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path
                d="M6.3 6.4C3.7 7.9 1.5 10 1.5 10S4.5 15.5 10 15.5c1.5 0 2.8-.3 3.9-.9M8.2 4.7A8.9 8.9 0 0 1 10 4.5c5.5 0 8.5 5.5 8.5 5.5s-.9 1.6-2.5 3.1"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path d="M8.2 8.2a2.5 2.5 0 0 0 3.6 3.6" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          ) : (
            // eye-open icon
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M1.5 10S4.5 4.5 10 4.5 18.5 10 18.5 10 15.5 15.5 10 15.5 1.5 10 1.5 10z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          )}
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
