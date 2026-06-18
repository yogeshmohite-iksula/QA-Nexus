// QA Nexus PM1 — ReportsRefreshCron schedule guard (Day-32 Neon cron-gate).
//
// The 24/7 `*/15 * * * *` sweep + `30 2` overnight refresh kept Neon's compute
// awake round-the-clock (unconditional updateMany resetting the 5-min
// autosuspend timer) → hit the free-tier CU-hr cap. Both crons are now gated to
// the pilot window (Asia/Kolkata 10:00–21:59) so Neon sleeps overnight.
//
// This asserts the decorator strings directly (source-level) — a behavioral
// scheduler test would require booting SchedulerExplorer; the contract we must
// not regress is simply "these two cron expressions, with the IST timezone".

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('ReportsRefreshCron schedule — Neon cron-gate (Hard Rule 1)', () => {
  const src = readFileSync(
    join(__dirname, '..', 'reports-refresh.cron.ts'),
    'utf8',
  );

  it('daily aggregate fires at 10:00 IST (pilot-window start), NOT overnight', () => {
    expect(src).toContain("@Cron('0 10 * * *', { timeZone: 'Asia/Kolkata' })");
    // the old 02:30 IST schedule must be gone
    expect(src).not.toContain("@Cron('30 2 * * *'");
  });

  it('stale sweep is gated to the 10:00–21:59 IST window, NOT 24/7', () => {
    expect(src).toContain(
      "@Cron('*/15 10-21 * * *', { timeZone: 'Asia/Kolkata' })",
    );
    // the old round-the-clock */15 must be gone
    expect(src).not.toContain("@Cron('*/15 * * * *')");
  });
});
