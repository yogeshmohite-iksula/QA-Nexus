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
import type { TestRun, TestRunStatus } from '@prisma/client';

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
