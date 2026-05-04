// F27 view-state primitives — Pattern A→B flip prep.
//
// Replaces the implicit "always-rendered" stub with explicit Loading
// / Error / Empty surfaces so when `useAdminUsersList()` (TanStack
// Query) returns its real-API state, the F27 list page has the
// correct UI for each branch.
//
// Pattern A→B connection point: F27 component will conditionally
// render these based on `isLoading` / `isError` / `data?.users.length`.
// See `users-roles-page.tsx` PAUSE marker for the exact swap-in.

'use client';

import { Loader2, AlertCircle, Users as UsersIcon } from 'lucide-react';

// ---------------------------------------------------------------------------
// Skeleton (loading state)
// ---------------------------------------------------------------------------

export function UsersListSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading team members"
      className="flex flex-col gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--base)] p-4"
    >
      <div className="flex items-center gap-2 text-[var(--text-tertiary)]">
        <Loader2 size={14} aria-hidden="true" className="animate-spin" />
        <span className="text-[12.5px]">Loading team members…</span>
      </div>
      {/* 3 skeleton rows so the layout doesn't pop on first paint */}
      <ul role="list" className="flex flex-col gap-2">
        {[0, 1, 2].map((i) => (
          <li
            key={i}
            className="flex items-center gap-3 rounded-md border border-[var(--border-subtle)] bg-[var(--raised)] px-3 py-2.5"
            aria-hidden="true"
          >
            <span className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-[var(--overlay)]" />
            <div className="flex flex-1 flex-col gap-1.5">
              <span className="h-3 w-32 animate-pulse rounded bg-[var(--overlay)]" />
              <span className="h-2.5 w-48 animate-pulse rounded bg-[var(--overlay)]" />
            </div>
            <span className="h-5 w-16 shrink-0 animate-pulse rounded bg-[var(--overlay)]" />
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

interface UsersListErrorProps {
  /** Human-readable message — usually `error.message` from the query. */
  message?: string;
  /** Retry handler — usually `query.refetch`. */
  onRetry: () => void;
}

export function UsersListError({ message, onRetry }: UsersListErrorProps) {
  return (
    <div
      role="alert"
      className="border-[var(--fail)]/30 bg-[var(--fail)]/5 flex flex-col gap-3 rounded-xl border p-5"
    >
      <div className="flex items-start gap-2">
        <AlertCircle size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--fail)]" />
        <div className="flex flex-col gap-1">
          <h3 className="font-display text-[14px] font-semibold text-[var(--text-primary)]">
            Could not load team members
          </h3>
          <p className="text-[12.5px] leading-[18px] text-[var(--text-secondary)]">
            {message ??
              'The /api/admin/users request failed. Try again, or contact support if it persists.'}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="border-[var(--fail)]/40 bg-[var(--fail)]/10 hover:bg-[var(--fail)]/20 inline-flex h-9 min-h-[44px] w-fit items-center justify-center rounded-md border px-3 text-[12.5px] font-semibold text-[var(--fail)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] sm:min-h-0"
      >
        Try again
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state (zero users — first-day workspace before invites land)
// ---------------------------------------------------------------------------

interface UsersListEmptyProps {
  onInvite: () => void;
}

export function UsersListEmpty({ onInvite }: UsersListEmptyProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--base)] py-16 text-center"
    >
      <UsersIcon size={28} aria-hidden="true" className="text-[var(--text-tertiary)]" />
      <p className="text-[14px] font-semibold text-[var(--text-primary)]">No team members yet.</p>
      <p className="max-w-[420px] text-[12.5px] text-[var(--text-tertiary)]">
        Invite teammates to start collaborating. Each person gets a 7-day set-password link.
      </p>
      <button
        type="button"
        onClick={onInvite}
        className="inline-flex h-10 min-h-[44px] items-center justify-center gap-1.5 rounded-md bg-[var(--primary)] px-4 text-[13px] font-semibold text-[var(--primary-ink)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] sm:min-h-0"
      >
        + Invite first teammate
      </button>
    </div>
  );
}
