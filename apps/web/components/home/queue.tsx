// Region 3 of F08a Home — "Your queue".
//
// Zero-canned sweep (2026-06-19 ~22:30 IST): the canonical /home QUEUE
// canonically shows per-user "AI reviews / clarifications / defect triage"
// items routed to the signed-in QA Engineer. There's no per-user queue
// roll-up endpoint in PM1 yet (M2/M3 candidate); the canned QUEUE_ROWS
// invented 6 plausible items + agent activity that don't reflect any real
// workspace state. Honest empty state until the endpoint lands. The
// previous defect-triage tab count wire (via /api/defects?status=new)
// is dropped — the defects list itself is shown on F21, not on the home
// queue. QueueRowItem + Glyph helpers were trimmed; restore from git
// history (commit before 2026-06-19 22:30) once the personal-queue
// endpoint ships.

'use client';

interface QueueProps {
  onRoute: (target: string, entityId?: string) => void;
}

export function Queue(_props: QueueProps) {
  return (
    <section aria-labelledby="queue-head" className="flex w-full flex-col gap-3">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="queue-head"
          className="font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--text-tertiary)]"
        >
          Your queue
        </h2>
      </header>
      <div className="flex flex-col items-start gap-2 rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--base)] p-5">
        <p className="font-display text-[15px] font-semibold text-[var(--text-primary)]">
          Your queue is clear.
        </p>
        <p className="text-[12.5px] leading-[18px] text-[var(--text-tertiary)]">
          AI reviews, clarifications and defect-triage items assigned to you will appear here as
          soon as the per-user queue endpoint lands. Until then, jump to{' '}
          <span className="font-mono text-[var(--text-secondary)]">/defects</span> for the full
          defect inbox.
        </p>
      </div>
    </section>
  );
}
