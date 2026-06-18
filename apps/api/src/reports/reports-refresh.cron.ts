// QA Nexus PM1 — Day-24 P0 ADR-021 Reports refresh cron.
//
// Schedule per ADR-021 Amendment A — GATED to the pilot window (Asia/Kolkata)
// for Neon free-tier compute (Day-32 cron-gate, 2026-06-12):
//   - 10:00 IST daily — pre-compute all (kind × project × window) into
//     report_aggregate. Tier-1 of the hybrid 3-tier strategy. Runs at the
//     pilot-window START so the day opens with fresh aggregates.
//   - Every 15 min, 10:00–21:59 IST ONLY — stale sweep. Defensive backup for
//     event-triggered invalidation; flips is_stale=true on rows >24h old.
//
// WHY window-gated: the prior 24/7 schedule (02:30 daily + */15 round-the-clock)
// issued an unconditional updateMany every 15 min, resetting Neon's 5-min
// autosuspend timer overnight → compute never scaled to zero → hit the free-tier
// CU-hr cap (project suspended 2026-06-12). Gating to 10:00–21:59 IST lets Neon
// sleep 22:00–10:00 IST (12h/day guaranteed). Trade-off: aggregates may be stale
// during 22:00–10:00 IST — acceptable for the 8-user pilot (nobody queries reports
// overnight; the 10:00 refresh heals at window-open). Hard Rule 1 ($0 cost gate).
//
// Failure semantics: a single (project, kind, window) failure does NOT
// crash the cron. Logged + audited + continue. The next run heals.

import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReportsService } from './reports.service';
import { resolveTimeRange } from './time-range.helper';
import type {
  ReportKind,
  ReportTimeRange,
} from '@qa-nexus/shared/dist/schemas/m5/report';

const REPORT_KINDS: ReportKind[] = [
  'cycle_pass_rate',
  'defect_age',
  'agent_cost',
  'sprint_progress',
  'test_coverage',
  'requirement_coverage',
];

const TIME_WINDOWS: ReportTimeRange[] = [
  { kind: 'sprint' },
  { kind: '7d' },
  { kind: '30d' },
  { kind: '90d' },
];

@Injectable()
export class ReportsRefreshCron implements OnModuleInit {
  private readonly logger = new Logger(ReportsRefreshCron.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly reports: ReportsService,
  ) {}

  onModuleInit(): void {
    this.logger.log(
      'ReportsRefreshCron: 10:00 IST daily + 15-min stale sweep (10:00–21:59 IST window) registered',
    );
  }

  /// 10:00 IST daily (pilot-window start) — pre-compute all tier-1 aggregates.
  /// Moved from 02:30 IST so Neon stays asleep overnight (Day-32 cron-gate).
  ///
  /// Runs serially per (project × kind × window) to avoid Neon CU-hr
  /// spike from a parallel storm. Pilot scale: 6 kinds × 6 projects × 4
  /// windows = 144 invocations. With ~50-200ms each, ~30-60s total
  /// runtime — well within the 30-min budget.
  @Cron('0 10 * * *', { timeZone: 'Asia/Kolkata' })
  async aggregateAllReports(): Promise<void> {
    const startedAt = Date.now();
    let computed = 0;
    let failed = 0;
    this.logger.log('ReportsRefreshCron: starting daily aggregation');

    const projects = await this.prisma.project.findMany({
      select: { id: true, workspaceId: true },
    });

    for (const project of projects) {
      for (const kind of REPORT_KINDS) {
        for (const window of TIME_WINDOWS) {
          try {
            const resolved = resolveTimeRange(window);
            const data = await this.reports.buildData(
              kind,
              project.id,
              resolved,
            );
            await this.prisma.reportAggregate.upsert({
              where: {
                projectId_reportKind_timeRangeKey: {
                  projectId: project.id,
                  reportKind: kind,
                  timeRangeKey: resolved.key,
                },
              },
              create: {
                workspaceId: project.workspaceId,
                projectId: project.id,
                reportKind: kind,
                timeRangeKey: resolved.key,
                timeRange: window as unknown as object,
                data: data as object,
                isStale: false,
              },
              update: {
                data: data as object,
                aggregatedAt: new Date(),
                isStale: false,
              },
            });
            computed++;
          } catch (err) {
            failed++;
            this.logger.warn(
              `cron aggregate FAILED project=${project.id.slice(0, 8)} kind=${kind} window=${window.kind}: ${err instanceof Error ? err.message : String(err)}`,
            );
          }
        }
      }
    }

    const durationMs = Date.now() - startedAt;
    this.logger.log(
      `ReportsRefreshCron: complete computed=${computed} failed=${failed} duration=${durationMs}ms`,
    );
    // Cron-run audit — single row per execution (system actor).
    // Use the first project's workspaceId as the audit-row workspace because
    // audit_log.workspace_id is NOT NULL. If no projects exist, skip the audit.
    if (projects.length > 0) {
      try {
        await this.audit.write({
          workspaceId: projects[0].workspaceId,
          actorId: null,
          entityType: 'report',
          entityId: null,
          action: 'report.cron_aggregation_complete',
          payload: { computed, failed, durationMs },
        });
      } catch (err) {
        this.logger.warn(
          `cron-completion audit FAILED: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }

  /// Every 15 min DURING 10:00–21:59 IST — mark rows older than 24h as stale.
  /// This is the BACKUP path; primary invalidation is event-triggered
  /// (defect/run state transitions call ReportsService.invalidate()).
  /// Window-gated (hours 10-21) so the unconditional updateMany does NOT wake
  /// Neon overnight — see the file header (Day-32 cron-gate, Hard Rule 1).
  @Cron('*/15 10-21 * * *', { timeZone: 'Asia/Kolkata' })
  async sweepStaleAggregates(): Promise<void> {
    try {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const result = await this.prisma.reportAggregate.updateMany({
        where: { aggregatedAt: { lt: cutoff }, isStale: false },
        data: { isStale: true },
      });
      if (result.count > 0) {
        this.logger.log(
          `ReportsRefreshCron sweep: marked ${result.count} rows stale (>24h)`,
        );
      }
    } catch (err) {
      this.logger.warn(
        `ReportsRefreshCron sweep FAILED: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
