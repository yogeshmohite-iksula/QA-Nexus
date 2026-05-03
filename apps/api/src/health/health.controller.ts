// QA Nexus PM1 — health endpoint.
//
// Spec: MS0-T025. Surfaces the subsystem readouts UptimeRobot (T015)
// hits every 5 min:
//   - db        : Postgres ping (SELECT 1) with 2s timeout
//   - embedding : EmbeddingService warm? + load duration
//   - llm       : deferred (T023 not landed yet)
//   - r2        : deferred (T013 not landed yet)
//   - quota     : Neon DB size (vs 512 MB free tier)
//
// HTTP semantics:
//   - 200 OK         — all required subsystems "up" (db + embedding)
//   - 503 Service Unavailable — at least one required subsystem "down"
//                      OR quota >90% (warning band; UptimeRobot will alert)
//   - 500 Internal   — unexpected error inside the health controller itself
//
// PUBLIC endpoint: no @UseGuards (UptimeRobot can't authenticate). The
// payload is intentionally non-sensitive — sizes + boolean states only,
// no IDs or values.
import { Controller, Get, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { Res } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingService } from '../embedding/embedding.service';
import { LLMGatewayService } from '../llm/llm-gateway.service';
import { getProvider } from '../llm/provider-registry';
import { R2Service, type R2Health } from '../storage/r2.service';
import { getOtelTraceStatus } from '../observability/otel.config';
import { getOtelLogsStatus } from '../observability/otel-logs.config';

const NEON_FREE_TIER_MB = 512;
const QUOTA_WARNING_PCT = 90;
const DB_PING_TIMEOUT_MS = 2000;

interface SubsystemUp {
  status: 'up';
  latency_ms: number;
}
interface SubsystemDown {
  status: 'down';
  error: string;
}
interface SubsystemDeferred {
  status: 'deferred';
  note: string;
}
type Subsystem = SubsystemUp | SubsystemDown | SubsystemDeferred;

interface LLMRouteHealth {
  provider: string;
  model: string | undefined;
  status: 'up' | 'down' | 'unknown';
  last_success_at: string | null;
  last_failure_at: string | null;
  last_failure_message: string | null;
}

interface HealthResponse {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  db: Subsystem;
  llm:
    | {
        status: 'up' | 'degraded' | 'down';
        primary: LLMRouteHealth;
        secondary: LLMRouteHealth | null;
        long_context: LLMRouteHealth | null;
      }
    | SubsystemDeferred;
  r2: R2Health;
  embedding:
    | {
        status: 'up';
        warm: boolean;
        load_duration_ms: number | null;
        model_id: string;
      }
    | { status: 'deferred'; reason: string; model_id: string }
    | { status: 'down'; error: string };
  quota: {
    neon_mb_used: number | null;
    neon_pct: number | null;
    neon_free_tier_mb: number;
    groq_rpd_used: number;
    groq_rpd_note: string;
  };
  otel: {
    traces: {
      exporter: 'configured' | 'deferred' | 'error';
      endpoint?: string;
      last_export_at?: string;
      error?: string;
      env_present?: Record<string, boolean>;
      deferred_reason?: string;
    };
    logs: {
      exporter: 'configured' | 'deferred' | 'error';
      sink: 'better_stack' | 'stdout';
      endpoint?: string;
      last_export_at?: string;
      error?: string;
      env_present?: Record<string, boolean>;
      deferred_reason?: string;
    };
  };
}

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly embedding: EmbeddingService,
    private readonly llm: LLMGatewayService,
    private readonly r2Service: R2Service,
  ) {}

  @Get()
  async health(@Res() res: Response): Promise<void> {
    const [dbResult, r2Result, quota] = await Promise.all([
      this.pingDb(),
      this.r2Service.health(),
      this.measureQuota(),
    ]);
    const embeddingResult = this.checkEmbedding();
    const llmResult = this.snapshotLLM();
    const overall = this.computeOverall(dbResult, embeddingResult, quota);

    const traceStatus = getOtelTraceStatus();
    const logStatus = getOtelLogsStatus();
    const body: HealthResponse = {
      status: overall,
      timestamp: new Date().toISOString(),
      db: dbResult,
      llm: llmResult,
      r2: r2Result,
      embedding: embeddingResult,
      quota: {
        ...quota,
        neon_free_tier_mb: NEON_FREE_TIER_MB,
        groq_rpd_used: 0,
        groq_rpd_note:
          'RPD tracking deferred — surfaces when llm-gateway tracks per-window calls',
      },
      otel: {
        traces: {
          exporter: traceStatus.status,
          endpoint: traceStatus.exporter_endpoint,
          last_export_at: traceStatus.last_export_at,
          error: traceStatus.error,
          env_present: traceStatus.env_present,
          deferred_reason: traceStatus.deferred_reason,
        },
        logs: {
          exporter: logStatus.status,
          sink: logStatus.sink,
          endpoint: logStatus.exporter_endpoint,
          last_export_at: logStatus.last_export_at,
          error: logStatus.error,
          env_present: logStatus.env_present,
          deferred_reason: logStatus.deferred_reason,
        },
      },
    };
    const httpStatus =
      overall === 'ok' ? 200 : overall === 'degraded' ? 503 : 503;
    res.status(httpStatus).json(body);
  }

  /** Snapshot the LLM gateway's primary/secondary/long-context route
   *  health from in-memory state set by BaseProvider on each call. Does
   *  NOT actively ping the providers (would burn free-tier quota every
   *  5 minutes) — instead reflects the most recent real call's outcome. */
  private snapshotLLM(): HealthResponse['llm'] {
    // Deferred mode (Day-4 afternoon hotfix): if LLMGateway didn't init
    // due to missing env vars, surface that explicitly so /health can
    // still return 200 + UptimeRobot doesn't false-alert.
    if (this.llm.deferred) {
      return {
        status: 'deferred',
        note:
          this.llm.deferredReason ??
          'LLM provider not configured. Admin must set via F26 UI in M1.',
      };
    }
    try {
      const cfg = this.llm.getConfig()!;
      const buildRoute = (
        providerName: string | undefined,
        modelName: string | undefined,
      ): LLMRouteHealth | null => {
        if (!providerName) return null;
        try {
          const provider = getProvider(providerName);
          const h = provider.getHealth();
          return {
            provider: providerName,
            model: modelName,
            status: h.status,
            last_success_at: h.lastSuccessAt,
            last_failure_at: h.lastFailureAt,
            last_failure_message: h.lastFailureMessage,
          };
        } catch (err) {
          // Provider construction failed (likely missing API key in env).
          return {
            provider: providerName,
            model: modelName,
            status: 'down',
            last_success_at: null,
            last_failure_at: new Date().toISOString(),
            last_failure_message:
              err instanceof Error ? err.message : String(err),
          };
        }
      };
      const primary = buildRoute(cfg.primaryProvider, cfg.primaryModel)!;
      const secondary = buildRoute(cfg.secondaryProvider, cfg.secondaryModel);
      const longContext = buildRoute(
        cfg.longContextProvider,
        cfg.longContextModel,
      );
      // Overall LLM status:
      //   up       = primary up
      //   degraded = primary down BUT secondary up
      //   down     = primary down AND (no secondary OR secondary down)
      //   unknown statuses don't degrade — they're the bootstrap state.
      let overallLlm: 'up' | 'degraded' | 'down';
      if (primary.status === 'up' || primary.status === 'unknown') {
        overallLlm = 'up';
      } else if (
        secondary &&
        (secondary.status === 'up' || secondary.status === 'unknown')
      ) {
        overallLlm = 'degraded';
      } else {
        overallLlm = 'down';
      }
      return {
        status: overallLlm,
        primary,
        secondary,
        long_context: longContext,
      };
    } catch (err) {
      // Gateway not initialised — usually means LLM_PRIMARY_PROVIDER not set.
      return {
        status: 'deferred',
        note:
          'LLMGateway not initialised — set LLM_PRIMARY_PROVIDER + LLM_PRIMARY_MODEL ' +
          `in env. (${err instanceof Error ? err.message : String(err)})`,
      };
    }
  }

  /** Postgres ping with hard 2-second timeout. */
  private async pingDb(): Promise<Subsystem> {
    const t0 = Date.now();
    try {
      const ping = this.prisma.$queryRawUnsafe(`SELECT 1 AS up`);
      const timeout = new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(`db ping timed out after ${DB_PING_TIMEOUT_MS}ms`),
            ),
          DB_PING_TIMEOUT_MS,
        ),
      );
      await Promise.race([ping, timeout]);
      return { status: 'up', latency_ms: Date.now() - t0 };
    } catch (err) {
      return {
        status: 'down',
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /** Embedding service warm-state probe. */
  private checkEmbedding(): HealthResponse['embedding'] {
    try {
      const status = this.embedding.status();
      // Deferred mode: model load failed (sharp missing on Linux x64,
      // OOM on free dyno, etc.). Service stays alive; /health surfaces
      // the reason so Yogesh can react. computeOverall treats deferred
      // as acceptable (200 OK) rather than firing UptimeRobot alerts.
      if (status.deferred) {
        return {
          status: 'deferred',
          reason: status.deferredReason ?? 'unknown',
          model_id: status.modelId,
        };
      }
      if (!status.warm) {
        return {
          status: 'down',
          error: `embedding model not warm yet (modelId=${status.modelId || 'unset'})`,
        };
      }
      return {
        status: 'up',
        warm: true,
        load_duration_ms: status.loadDurationMs,
        model_id: status.modelId,
      };
    } catch (err) {
      return {
        status: 'down',
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /** Neon DB size probe — pg_database_size on the current DB. */
  private async measureQuota(): Promise<{
    neon_mb_used: number | null;
    neon_pct: number | null;
  }> {
    try {
      const rows = await this.prisma.$queryRawUnsafe<{ size_bytes: bigint }[]>(
        `SELECT pg_database_size(current_database())::bigint AS size_bytes`,
      );
      const bytes = Number(rows[0]?.size_bytes ?? 0);
      const mb = bytes / (1024 * 1024);
      const pct = (mb / NEON_FREE_TIER_MB) * 100;
      return {
        neon_mb_used: Math.round(mb * 100) / 100,
        neon_pct: Math.round(pct * 100) / 100,
      };
    } catch (err) {
      this.logger.warn(
        `quota measurement failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      return { neon_mb_used: null, neon_pct: null };
    }
  }

  private computeOverall(
    db: Subsystem,
    embedding: HealthResponse['embedding'],
    quota: { neon_pct: number | null },
  ): 'ok' | 'degraded' | 'down' {
    // Required subsystems for "ok": db. Embedding "deferred" state
    // (sharp missing on Linux x64, OOM on free dyno) is ACCEPTABLE — the
    // service is alive + serving non-embedding routes. Day-4 afternoon
    // hotfix: don't 503 when embedding is gracefully deferred. The
    // deferred state is still surfaced in the response body so ops can
    // see it; UptimeRobot just doesn't alert on it.
    if (db.status !== 'up') return 'down';
    if (embedding.status === 'down') return 'down';
    // Quota >90% degrades to alert state (UptimeRobot triggers on 503).
    if (quota.neon_pct !== null && quota.neon_pct > QUOTA_WARNING_PCT) {
      return 'degraded';
    }
    // Embedding deferred → still 'ok' overall (returns 200). Visible in
    // the body's `embedding.status` field for ops + future F26 UI.
    return 'ok';
  }
}
