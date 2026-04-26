// QA Nexus PM1 — PulseDot
// Used on F06b Set Password footer (link expiry indicator) and elsewhere as
// a subtle "live" / "pending" indicator.
// Source: PM1_UI_v2/frames - claude code build (PM1 v2.6-v2.8)/F06b Set Reset Password.html
// (.pulse-dot keyframe + amber variant).

import { cn } from '@/lib/utils';

interface PulseDotProps {
  /** When true, dot turns amber (warning state e.g. <2h until link expiry). */
  amber?: boolean;
  className?: string;
}

export function PulseDot({ amber = false, className }: PulseDotProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-block h-[6px] w-[6px] rounded-full',
        amber ? 'bg-warn' : 'bg-text-tertiary',
        // Animation lives in globals.css so prefers-reduced-motion can override
        'animate-[pulseDot_2.6s_ease-in-out_infinite]',
        className,
      )}
    />
  );
}
