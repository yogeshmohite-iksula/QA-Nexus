// QA Nexus PM1 — TestRunsService (M4 P3 / Day-18 #149).
//
// Spec: PM1_ERD §3.10 — State machine:
//   Queued → Running → Passed | Failed | Blocked | Aborted
//   Failed → Defected → [*]   (defect creation handled separately)
//
// Responsibilities per transition (CLAUDE.md Hard Rule 7):
//   1. Validate prior state via state-machine guard (BadRequest if invalid)
//   2. Update test_runs row in Postgres
//   3. Append a row to audit_log (HMAC-SHA256 chained) — synchronous,
//      throws on chain failure so transition rolls back at app layer
//   4. Emit `test_run.progress` event via RealtimeGateway to all
//      subscribers of channel `test_run.progress.<runId>`
//
// Single source of truth for valid transitions is the static
// `ALLOWED_TRANSITIONS` table — a Map from current-status to the set of
// statuses it can move to. Mirrors ERD §3.10.
//
// Audit payload shape (entityType="test_run", entityId=runId):
//   {
//     from_status: 'queued',
//     to_status: 'running',
//     transitioned_at: ISO8601,
//     started_at: ISO8601,
//     completed_at: ISO8601 | null,
//   }
//
// WebSocket payload (event 'test_run.progress'):
//   {
//     status: 'running',
//     transitioned_at: ISO8601,
//     started_at, completed_at,
//     // optional: progressPct, passed/failed/blocked counts (denormalized
//     //           later by the runner; not in this skeleton).
//   }

import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { Prisma } from '@prisma/client';
import type { TestRun, TestRunStatus } from '@prisma/client';
import type { TestRunListItem, TestRunListQuery } from '@qa-nexus/shared';

/** State-machine table — single source of truth, mirrors ERD §3.10.
 *  Keys = current status. Values = the set of statuses the run may
 *  transition to. Terminal states (passed/failed/blocked/aborted) have
 *  empty sets — no outbound transitions in this skeleton (defect path
 *  is handled by a separate service in Day-19+). */
const ALLOWED_TRANSITIONS: Readonly<
  Record<TestRunStatus, ReadonlySet<TestRunStatus>>
> = {
  queued: new Set<TestRunStatus>(['running']),
  running: new Set<TestRunStatus>(['passed', 'failed', 'blocked', 'aborted']),
  passed: new Set<TestRunStatus>(),
  failed: new Set<TestRunStatus>(),
  blocked: new Set<TestRunStatus>(),
  aborted: new Set<TestRunStatus>(),
};

/** Minimal session shape the controller passes to the service. Lets the
 *  service stay decoupled from BetterAuth / Express. */
export interface TestRunActor {
  appUserId: string;
  workspaceId: string;
}

/** Single source of truth for the columns + joined refs a list row returns.
 *  `project.workspaceId` is NOT selected (the where-clause already scopes by
 *  it); `results.status` drives the case-count tally in the mapper. */
const TEST_RUN_SELECT = {
  id: true,
  projectId: true,
  name: true,
  status: true,
  triggeredBy: true,
  startedAt: true,
  completedAt: true,
  environment: true,
  project: { select: { id: true, key: true, name: true } },
  triggeredByUser: { select: { id: true, displayName: true } },
  results: { select: { status: true } },
} satisfies Prisma.TestRunSelect;

type TestRunRow = Prisma.TestRunGetPayload<{ select: typeof TEST_RUN_SELECT }>;

/** Map a Prisma row → the shared wire shape. Case counts are tallied from the
 *  joined `results` rows (the model has no denormalized counts). Date → ISO. */
function toListItem(row: TestRunRow): TestRunListItem {
  let passed = 0;
  let failed = 0;
  for (const r of row.results) {
    if (r.status === 'passed') passed++;
    else if (r.status === 'failed') failed++;
  }
  return {
    id: row.id,
    projectId: row.projectId,
    name: row.name,
    status: row.status,
    trigger: row.triggeredBy,
    environment: row.environment,
    startedAt: row.startedAt ? row.startedAt.toISOString() : null,
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    totalCases: row.results.length,
    passedCases: passed,
    failedCases: failed,
    triggeredBy: row.triggeredByUser
      ? {
          id: row.triggeredByUser.id,
          displayName: row.triggeredByUser.displayName,
        }
      : null,
    project: {
      id: row.project.id,
      key: row.project.key,
      name: row.project.name,
    },
  };
}

@Injectable()
export class TestRunsService {
  private readonly logger = new Logger(TestRunsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly gateway: RealtimeGateway,
  ) {}

  /** Transition queued → running. Stamps started_at. */
  async start(runId: string, actor: TestRunActor): Promise<TestRun> {
    return this.transition(runId, actor, 'running', { stampStartedAt: true });
  }

  /** Transition running → passed | failed | blocked. Stamps completed_at.
   *  Per PM1_ERD §3.10 + M4 brief, `evidenceIds` denormalizes onto
   *  the LAST execution row; the per-case `test_run_results` rows are
   *  written by the runner itself, NOT this top-level run transition.
   *  This service writes only the test_runs.status flip + audit + emit. */
  async report(
    runId: string,
    body: { status: 'passed' | 'failed' | 'blocked' },
    actor: TestRunActor,
  ): Promise<TestRun> {
    return this.transition(runId, actor, body.status, {
      stampCompletedAt: true,
    });
  }

  /** Transition running → aborted. Stamps completed_at. User-initiated
   *  cancel (F19 "Abort run" button). */
  async abort(runId: string, actor: TestRunActor): Promise<TestRun> {
    return this.transition(runId, actor, 'aborted', { stampCompletedAt: true });
  }

  /**
   * GET /api/test-runs — workspace-scoped list for F08 /home ACTIVE_RUNS
   * (filter `status=running`) + RECENT_RUNS (default `started_at_desc`).
   * Read-only, NOT audited (ERD §8.7). The workspace constraint lives on
   * the where-clause (via project.workspaceId) and is never client-supplied,
   * so cross-tenant rows are invisible — no leak, no 403. Mirrors
   * DefectsService.list (offset pagination, NOT the audit cursor).
   *
   * `startedAt` is nullable (queued runs never started), so the desc sort
   * pushes not-yet-started runs last via `nulls: 'last'`.
   */
  async list(
    query: TestRunListQuery,
    actor: TestRunActor,
  ): Promise<{
    testRuns: TestRunListItem[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const where: Prisma.TestRunWhereInput = {
      project: {
        workspaceId: actor.workspaceId,
        ...(query.projectId ? { id: query.projectId } : {}),
      },
      ...(query.status ? { status: query.status } : {}),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.testRun.findMany({
        where,
        select: TEST_RUN_SELECT,
        orderBy: { startedAt: { sort: 'desc', nulls: 'last' } },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.testRun.count({ where }),
    ]);

    return {
      testRuns: rows.map(toListItem),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  // ────────────────────────────────────────────────────────────────────
  // Internal — shared transition pipeline (load + guard + update +
  // audit + emit). Keeps the public methods one-liners.
  // ────────────────────────────────────────────────────────────────────

  private async transition(
    runId: string,
    actor: TestRunActor,
    toStatus: TestRunStatus,
    opts: { stampStartedAt?: boolean; stampCompletedAt?: boolean },
  ): Promise<TestRun> {
    const existing = await this.prisma.testRun.findUnique({
      where: { id: runId },
    });
    if (!existing) {
      throw new NotFoundException(`test_run ${runId} not found`);
    }

    const fromStatus = existing.status;
    const allowed = ALLOWED_TRANSITIONS[fromStatus];
    if (!allowed.has(toStatus)) {
      throw new ConflictException(
        `invalid transition: ${fromStatus} → ${toStatus} ` +
          `(allowed from ${fromStatus}: ${[...allowed].join(', ') || '(none — terminal)'})`,
      );
    }

    const now = new Date();
    const updated = await this.prisma.testRun.update({
      where: { id: runId },
      data: {
        status: toStatus,
        ...(opts.stampStartedAt ? { startedAt: now } : {}),
        ...(opts.stampCompletedAt ? { completedAt: now } : {}),
      },
    });

    // Hard Rule 7 — audit chain BEFORE WS emit (audit failure must abort
    // before clients are notified; otherwise FE+audit drift).
    await this.audit.write({
      workspaceId: actor.workspaceId,
      actorId: actor.appUserId,
      entityType: 'test_run',
      entityId: runId,
      action: `transition:${fromStatus}->${toStatus}`,
      payload: {
        from_status: fromStatus,
        to_status: toStatus,
        transitioned_at: now.toISOString(),
        started_at: updated.startedAt?.toISOString() ?? null,
        completed_at: updated.completedAt?.toISOString() ?? null,
      },
    });

    // Best-effort WS emit. If the gateway throws, we DO NOT roll back —
    // the run state + audit are already canonical; missing one frame on a
    // subscriber is recoverable via a fresh fetch from the FE.
    try {
      const subscribers = this.gateway.emitTestRunProgress(runId, {
        status: toStatus,
      });
      this.logger.log(
        `test_run ${runId.slice(0, 8)} ${fromStatus} → ${toStatus} ` +
          `(${subscribers} ws subscribers)`,
      );
    } catch (err) {
      this.logger.warn(
        `WS emit failed for test_run ${runId}: ` +
          (err instanceof Error ? err.message : String(err)),
      );
    }

    return updated;
  }

  /** Hint for tests / debug surfaces. Returns the static transition table
   *  so callers can verify the canon without re-importing. */
  static allowedTransitionsFrom(
    status: TestRunStatus,
  ): readonly TestRunStatus[] {
    return [...ALLOWED_TRANSITIONS[status]];
  }
}

/** Re-export for ergonomic guard checks at the controller layer + tests. */
export { ALLOWED_TRANSITIONS };

/** Convenience BadRequest variant — controllers may throw this when the
 *  Zod schema accepts a value but the service-level invariant rejects it
 *  (e.g. report body status='aborted' is the wrong endpoint). */
export class InvalidTestRunReportStatus extends BadRequestException {
  constructor(status: string) {
    super(
      `result endpoint accepts only passed | failed | blocked; got '${status}'. ` +
        `Use PATCH /api/test-runs/:id/abort for aborted.`,
    );
  }
}
