// QA Nexus PM1 — Day-24 P0 ADR-021 Reports backend service.
//
// SCOPE Day-24 P0:
//   - POST /api/reports → ReportsService.run() returns ReportResponse
//     envelope.
//   - SWR (stale-while-revalidate) via lru-cache + report_aggregate.is_stale.
//   - 6 per-kind SQL builders (cycle_pass_rate, defect_age, agent_cost,
//     sprint_progress, test_coverage, requirement_coverage).
//   - Audit writes per ADR-021 §3 (synchronous, in-handler — api.md rule).
//   - UPSERT report_aggregate on (project_id, report_kind, time_range_key)
//     so the daily 02:30 IST cron + on-demand reads converge on the same
//     canonical row.
//
// SCOPE Day-25+ (out of this PR):
//   - AC042 corpus eval validation (Day-25 AM gate).
//   - F23 Reports Studio FE wire-up via shared schemas.
//   - Real pilot SQL tuning once data accrues. The current builders are
//     DEFENSIVE — empty/missing data returns zero-shaped payloads, not
//     errors. The shapes are stable; the math may evolve.
//
// COST GATE (Hard Rule 1):
//   lru-cache is in-process (no Redis). 6 kinds × 6 projects × 4 windows
//   = 144 cache entries at pilot scale. Heap ~1 MB. Free.

import { Injectable, Logger } from '@nestjs/common';
import { LRUCache } from 'lru-cache';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import type {
  ReportKind,
  ReportRequest,
  ReportResponse,
  ReportTemplate as ReportTemplateDto,
  ReportTemplateCreate,
} from '@qa-nexus/shared/dist/schemas/m5/report';
import { CACHE_TTL_MS, CACHE_MAX_ENTRIES } from './cache-ttl';
import { type ResolvedTimeRange, resolveTimeRange } from './time-range.helper';

interface CachedReport {
  /** The full envelope; ready to return on cache hit. */
  envelope: ReportResponse;
  /** When this entry was computed (server clock). Used to detect SWR-stale. */
  computedAt: number;
}

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);
  private readonly cache = new LRUCache<string, CachedReport>({
    max: CACHE_MAX_ENTRIES,
    // TTL is per-entry so different kinds get different TTLs.
    // Setting cache-wide TTL = max (1h) lets per-set TTL govern; we use
    // `set(key, value, { ttl })` per-entry.
    ttl: 60 * 60 * 1000,
    ttlAutopurge: false,
  });

  /** SWR in-flight tracker so two concurrent stale-hits don't both spawn
   *  a refresh. Map key = cacheKey; value = the refresh promise so callers
   *  can await it if they want to (we don't — fire-and-forget). */
  private readonly inFlightRefresh = new Map<string, Promise<void>>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Run a report — entry point for POST /api/reports.
   *
   * SWR flow:
   *   1. Compute cache key (project + kind + window).
   *   2. lru-cache lookup:
   *      - HIT + fresh → return cached envelope, audit `report.cache_hit`.
   *      - HIT + stale (TTL expired but still in cache) → return cached
   *        envelope marked stale, fire background refresh.
   *      - MISS → check report_aggregate for a fresh persisted row; if found
   *        warm the cache and return. Otherwise compute live.
   *
   * Concurrency note: the in-flight tracker is BEST-EFFORT — two requests
   * arriving simultaneously may both miss the cache and both compute. That's
   * fine: the UPSERT collapses them. The tracker prevents the same KIND of
   * thrash for SWR background refreshes.
   */
  async run(
    workspaceId: string,
    request: ReportRequest,
    actorId: string | null,
  ): Promise<ReportResponse> {
    const resolved = resolveTimeRange(request.timeRange);
    const cacheKey = this.computeCacheKey(request, resolved);

    // 1. lru-cache hot path
    const cached = this.cache.get(cacheKey);
    if (cached) {
      const age = Date.now() - cached.computedAt;
      const ttl = CACHE_TTL_MS[request.kind];
      if (age <= ttl) {
        await this.audit.write({
          workspaceId,
          actorId,
          entityType: 'report',
          entityId: null,
          action: 'report.cache_hit',
          payload: { kind: request.kind, key: resolved.key },
        });
        return { ...cached.envelope, source: 'cache_fresh' };
      }
      // SWR — serve stale, kick a background refresh.
      this.scheduleBackgroundRefresh(workspaceId, request, resolved, cacheKey);
      await this.audit.write({
        workspaceId,
        actorId,
        entityType: 'report',
        entityId: null,
        action: 'report.cache_stale_swr',
        payload: { kind: request.kind, key: resolved.key, ageMs: age },
      });
      return { ...cached.envelope, source: 'cache_stale_swr', isStale: true };
    }

    // 2. report_aggregate persisted layer
    const persisted = await this.prisma.reportAggregate.findUnique({
      where: {
        projectId_reportKind_timeRangeKey: {
          projectId: request.projectId,
          reportKind: request.kind,
          timeRangeKey: resolved.key,
        },
      },
    });
    if (persisted && !persisted.isStale) {
      const envelope = this.envelopeFromPersisted(persisted, request);
      this.cache.set(
        cacheKey,
        { envelope, computedAt: persisted.aggregatedAt.getTime() },
        { ttl: CACHE_TTL_MS[request.kind] },
      );
      await this.audit.write({
        workspaceId,
        actorId,
        entityType: 'report',
        entityId: persisted.id,
        action: 'report.persisted_hit',
        payload: { kind: request.kind, key: resolved.key },
      });
      return { ...envelope, source: 'precomputed' };
    }

    // 3. Live compute
    const data = await this.buildData(
      request.kind,
      request.projectId,
      resolved,
    );
    const aggregatedAt = new Date();
    const upserted = await this.prisma.reportAggregate.upsert({
      where: {
        projectId_reportKind_timeRangeKey: {
          projectId: request.projectId,
          reportKind: request.kind,
          timeRangeKey: resolved.key,
        },
      },
      create: {
        workspaceId,
        projectId: request.projectId,
        reportKind: request.kind,
        timeRangeKey: resolved.key,
        timeRange: this.timeRangeToJson(request),
        data: data as object,
        isStale: false,
        aggregatedAt,
      },
      update: {
        data: data as object,
        aggregatedAt,
        isStale: false,
      },
    });

    const envelope: ReportResponse = {
      kind: request.kind,
      projectId: request.projectId,
      timeRange: request.timeRange,
      aggregatedAt: aggregatedAt.toISOString(),
      source: 'computed',
      isStale: false,
      data,
    };
    this.cache.set(
      cacheKey,
      { envelope, computedAt: aggregatedAt.getTime() },
      { ttl: CACHE_TTL_MS[request.kind] },
    );
    await this.audit.write({
      workspaceId,
      actorId,
      entityType: 'report',
      entityId: upserted.id,
      action: 'report.computed',
      payload: { kind: request.kind, key: resolved.key },
    });
    return envelope;
  }

  /** Invalidate by flipping is_stale=true. Called by event triggers (defect
   *  state transitions, run completions). On next read SWR will recompute. */
  async invalidate(
    projectId: string,
    kinds: ReportKind[] = [
      'cycle_pass_rate',
      'defect_age',
      'agent_cost',
      'sprint_progress',
      'test_coverage',
      'requirement_coverage',
    ],
  ): Promise<number> {
    const result = await this.prisma.reportAggregate.updateMany({
      where: { projectId, reportKind: { in: kinds }, isStale: false },
      data: { isStale: true },
    });
    // Drop in-process cache for the affected project too — otherwise the
    // SWR `cached` branch would return stale data without consulting the DB.
    for (const key of [...this.cache.keys()]) {
      if (key.startsWith(`${projectId}:`)) this.cache.delete(key);
    }
    this.logger.log(
      `ReportsService.invalidate: project=${projectId.slice(0, 8)} kinds=${kinds.join(',')} rows=${result.count}`,
    );
    return result.count;
  }

  // ============================================================
  // Internal: cache key + envelope mapping
  // ============================================================

  private computeCacheKey(
    request: ReportRequest,
    resolved: ResolvedTimeRange,
  ): string {
    const filters = request.filters
      ? JSON.stringify(request.filters, Object.keys(request.filters).sort())
      : '';
    const groupBy = request.groupBy ? request.groupBy.sort().join(',') : '';
    return `${request.projectId}:${request.kind}:${resolved.key}:${filters}:${groupBy}`;
  }

  private timeRangeToJson(request: ReportRequest): object {
    return request.timeRange as unknown as object;
  }

  private envelopeFromPersisted(
    persisted: {
      aggregatedAt: Date;
      data: unknown;
      timeRange: unknown;
      isStale: boolean;
    },
    request: ReportRequest,
  ): ReportResponse {
    return {
      kind: request.kind,
      projectId: request.projectId,
      timeRange: request.timeRange,
      aggregatedAt: persisted.aggregatedAt.toISOString(),
      source: 'precomputed',
      isStale: persisted.isStale,
      // Trust the persisted shape — Zod-validated on write at the request
      // boundary; the DB CHECK + UNIQUE keep it canonical.
      data: persisted.data as ReportResponse['data'],
    };
  }

  // ============================================================
  // Internal: SWR background refresh
  // ============================================================

  private scheduleBackgroundRefresh(
    workspaceId: string,
    request: ReportRequest,
    resolved: ResolvedTimeRange,
    cacheKey: string,
  ): void {
    if (this.inFlightRefresh.has(cacheKey)) return;
    const refreshP = this.refreshAndCache(
      workspaceId,
      request,
      resolved,
      cacheKey,
    )
      .catch((err) => {
        this.logger.warn(
          `SWR refresh FAILED for ${cacheKey}: ${err instanceof Error ? err.message : String(err)}`,
        );
      })
      .finally(() => this.inFlightRefresh.delete(cacheKey));
    this.inFlightRefresh.set(cacheKey, refreshP);
  }

  private async refreshAndCache(
    workspaceId: string,
    request: ReportRequest,
    resolved: ResolvedTimeRange,
    cacheKey: string,
  ): Promise<void> {
    const data = await this.buildData(
      request.kind,
      request.projectId,
      resolved,
    );
    const aggregatedAt = new Date();
    await this.prisma.reportAggregate.upsert({
      where: {
        projectId_reportKind_timeRangeKey: {
          projectId: request.projectId,
          reportKind: request.kind,
          timeRangeKey: resolved.key,
        },
      },
      create: {
        workspaceId,
        projectId: request.projectId,
        reportKind: request.kind,
        timeRangeKey: resolved.key,
        timeRange: this.timeRangeToJson(request),
        data: data as object,
        isStale: false,
        aggregatedAt,
      },
      update: { data: data as object, aggregatedAt, isStale: false },
    });
    const envelope: ReportResponse = {
      kind: request.kind,
      projectId: request.projectId,
      timeRange: request.timeRange,
      aggregatedAt: aggregatedAt.toISOString(),
      source: 'computed',
      isStale: false,
      data,
    };
    this.cache.set(
      cacheKey,
      { envelope, computedAt: aggregatedAt.getTime() },
      { ttl: CACHE_TTL_MS[request.kind] },
    );
  }

  // ============================================================
  // Internal: per-kind builders
  // ============================================================

  async buildData(
    kind: ReportKind,
    projectId: string,
    range: ResolvedTimeRange,
  ): Promise<ReportResponse['data']> {
    switch (kind) {
      case 'cycle_pass_rate':
        return this.buildCyclePassRate(projectId, range);
      case 'defect_age':
        return this.buildDefectAge(projectId, range);
      case 'agent_cost':
        return this.buildAgentCost(projectId, range);
      case 'sprint_progress':
        return this.buildSprintProgress(projectId, range);
      case 'test_coverage':
        return this.buildTestCoverage(projectId, range);
      case 'requirement_coverage':
        return this.buildRequirementCoverage(projectId, range);
    }
  }

  /** cycle_pass_rate — daily test_run pass rate over window + 30-day avg.
   *  TODO(Day-25): pilot-tune the daily-bucket SQL once test_runs accrues
   *  realistic volume. Current builder returns empty series for projects
   *  without test_runs in window. */
  private async buildCyclePassRate(
    projectId: string,
    range: ResolvedTimeRange,
  ): Promise<ReportResponse['data']> {
    const start = range.start ?? new Date(0);
    type Row = { day: Date; passed: bigint; total: bigint };
    const rows = await this.prisma.$queryRaw<Row[]>`
      SELECT
        DATE_TRUNC('day', tr.created_at) AS day,
        SUM(CASE WHEN tr.status = 'passed' THEN 1 ELSE 0 END) AS passed,
        COUNT(*) AS total
      FROM test_runs tr
      WHERE tr.project_id = ${projectId}::uuid
        AND tr.created_at >= ${start}
        AND tr.created_at < ${range.end}
      GROUP BY DATE_TRUNC('day', tr.created_at)
      ORDER BY day ASC
    `;
    const series = rows.map((r) => ({
      ts: r.day.toISOString(),
      passRate: Number(r.total) === 0 ? 0 : Number(r.passed) / Number(r.total),
    }));
    const current =
      series.length === 0 ? 0 : series[series.length - 1].passRate;
    const avg30d =
      series.length === 0
        ? 0
        : series.reduce((a, s) => a + s.passRate, 0) / series.length;
    return { series, kpi: { current, avg30d } };
  }

  /** defect_age — histogram of open defects by age + median. */
  private async buildDefectAge(
    projectId: string,
    _range: ResolvedTimeRange,
  ): Promise<ReportResponse['data']> {
    // Open = not closed. resolved_at IS NULL keeps it simple at pilot.
    type Row = { age_bin: string; count: bigint };
    const rows = await this.prisma.$queryRaw<Row[]>`
      WITH d AS (
        SELECT EXTRACT(EPOCH FROM (NOW() - created_at))/86400 AS age_days
        FROM defects
        WHERE project_id = ${projectId}::uuid AND closed_at IS NULL
      )
      SELECT
        CASE
          WHEN age_days < 1   THEN '0-1d'
          WHEN age_days < 7   THEN '1-7d'
          WHEN age_days < 30  THEN '7-30d'
          ELSE '30d+'
        END AS age_bin,
        COUNT(*) AS count
      FROM d
      GROUP BY age_bin
    `;
    const buckets = rows.map((r) => ({
      ageBin: r.age_bin,
      count: Number(r.count),
    }));
    const medianResult = await this.prisma.$queryRaw<
      { median: number | null }[]
    >`
      SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (NOW() - created_at))/86400) AS median
      FROM defects
      WHERE project_id = ${projectId}::uuid AND closed_at IS NULL
    `;
    return {
      buckets,
      medianAgeDays: medianResult[0]?.median ?? 0,
    };
  }

  /** agent_cost — per-provider $ + tokens over window.
   *  TODO(Day-25): agent_runs lacks cost/token columns at pilot. Returns
   *  zero-shaped payload until those columns land (see ADR-021 Amendment
   *  C candidate). */
  private async buildAgentCost(
    _projectId: string,
    range: ResolvedTimeRange,
  ): Promise<ReportResponse['data']> {
    const start = range.start ?? new Date(0);
    type Row = { agent_kind: string; runs: bigint };
    const rows = await this.prisma.$queryRaw<Row[]>`
      SELECT agent_kind, COUNT(*) AS runs
      FROM agent_runs
      WHERE created_at >= ${start} AND created_at < ${range.end}
      GROUP BY agent_kind
    `;
    const byProvider: Record<string, { usd: number; tokens: number }> = {};
    for (const r of rows) {
      byProvider[r.agent_kind] = { usd: 0, tokens: 0 };
    }
    return { byProvider, totalUsd: 0, totalTokens: 0 };
  }

  /** sprint_progress — current sprint points completed / remaining / velocity.
   *  Uses sprint_current() function from migration §3. Velocity is a
   *  rolling-avg placeholder until story-points columns settle. */
  private async buildSprintProgress(
    projectId: string,
    _range: ResolvedTimeRange,
  ): Promise<ReportResponse['data']> {
    type Row = {
      sprint_id: string | null;
      done: bigint;
      total: bigint;
    };
    const rows = await this.prisma.$queryRaw<Row[]>`
      WITH cur AS (SELECT sprint_current(${projectId}::uuid) AS sprint_id)
      SELECT
        cur.sprint_id,
        SUM(CASE WHEN ji.status = 'Done' THEN 1 ELSE 0 END) AS done,
        COUNT(ji.id) AS total
      FROM cur
      LEFT JOIN jira_issues ji
        ON ji.sprint_id = cur.sprint_id AND ji.deleted_at IS NULL
      GROUP BY cur.sprint_id
    `;
    const row = rows[0] ?? { sprint_id: null, done: 0n, total: 0n };
    return {
      sprintId: row.sprint_id,
      pointsCompleted: Number(row.done),
      pointsRemaining: Number(row.total) - Number(row.done),
      velocity: 0,
    };
  }

  /** test_coverage — total cases vs executed vs pass rate + gaps. */
  private async buildTestCoverage(
    projectId: string,
    range: ResolvedTimeRange,
  ): Promise<ReportResponse['data']> {
    const start = range.start ?? new Date(0);
    type Row = {
      total_cases: bigint;
      executed: bigint;
      passed: bigint;
    };
    const rows = await this.prisma.$queryRaw<Row[]>`
      SELECT
        (SELECT COUNT(*) FROM test_cases WHERE project_id = ${projectId}::uuid) AS total_cases,
        (SELECT COUNT(DISTINCT test_case_id) FROM test_results tres
          JOIN test_runs tr ON tres.test_run_id = tr.id
          WHERE tr.project_id = ${projectId}::uuid
            AND tr.created_at >= ${start} AND tr.created_at < ${range.end}) AS executed,
        (SELECT COUNT(*) FROM test_results tres
          JOIN test_runs tr ON tres.test_run_id = tr.id
          WHERE tr.project_id = ${projectId}::uuid
            AND tres.status = 'passed'
            AND tr.created_at >= ${start} AND tr.created_at < ${range.end}) AS passed
    `;
    const row = rows[0] ?? { total_cases: 0n, executed: 0n, passed: 0n };
    const total = Number(row.total_cases);
    const executed = Number(row.executed);
    const passed = Number(row.passed);
    return {
      totalCases: total,
      executed,
      passRate: executed === 0 ? 0 : passed / executed,
      gaps: [],
    };
  }

  /** requirement_coverage — requirements with ≥1 linked test case. */
  private async buildRequirementCoverage(
    projectId: string,
    _range: ResolvedTimeRange,
  ): Promise<ReportResponse['data']> {
    type Row = { total: bigint; covered: bigint };
    const rows = await this.prisma.$queryRaw<Row[]>`
      SELECT
        (SELECT COUNT(*) FROM requirements WHERE project_id = ${projectId}::uuid) AS total,
        (SELECT COUNT(DISTINCT r.id) FROM requirements r
          JOIN test_case_links tcl ON tcl.requirement_id = r.id
          WHERE r.project_id = ${projectId}::uuid) AS covered
    `;
    const row = rows[0] ?? { total: 0n, covered: 0n };
    return {
      totalReqs: Number(row.total),
      covered: Number(row.covered),
      gaps: [],
    };
  }

  // ============================================================
  // Templates — saved user configs (ADR-021 §1)
  // ============================================================

  async createTemplate(
    workspaceId: string,
    ownerUserId: string,
    input: ReportTemplateCreate,
  ): Promise<ReportTemplateDto> {
    const row = await this.prisma.reportTemplate.create({
      data: {
        workspaceId,
        projectId: input.projectId,
        ownerUserId,
        name: input.name,
        config: input.config as unknown as object,
        isShared: input.isShared ?? false,
      },
    });
    await this.audit.write({
      workspaceId,
      actorId: ownerUserId,
      entityType: 'report_template',
      entityId: row.id,
      action: 'report_template.created',
      payload: {
        name: input.name,
        projectId: input.projectId,
        kind: input.config.kind,
      },
    });
    return this.templateToDto(row);
  }

  async listTemplates(
    workspaceId: string,
    projectId: string,
    requestorUserId: string,
  ): Promise<ReportTemplateDto[]> {
    const rows = await this.prisma.reportTemplate.findMany({
      where: {
        workspaceId,
        projectId,
        OR: [{ ownerUserId: requestorUserId }, { isShared: true }],
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.templateToDto(r));
  }

  private templateToDto(row: {
    id: string;
    workspaceId: string;
    projectId: string;
    ownerUserId: string;
    name: string;
    config: unknown;
    isShared: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): ReportTemplateDto {
    return {
      id: row.id,
      workspaceId: row.workspaceId,
      projectId: row.projectId,
      ownerUserId: row.ownerUserId,
      name: row.name,
      config: row.config as ReportTemplateDto['config'],
      isShared: row.isShared,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
