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
  r2: SubsystemDeferred;
  embedding:
    | {
        status: 'up';
        warm: boolean;
        load_duration_ms: number | null;
        model_id: string;
      }
    | { status: 'down'; error: string };
  quota: {
    neon_mb_used: number | null;
    neon_pct: number | null;
    neon_free_tier_mb: number;
    groq_rpd_used: number;
    groq_rpd_note: string;
  };
}

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly embedding: EmbeddingService,
    private readonly llm: LLMGatewayService,
  ) {}

  @Get()
  async health(@Res() res: Response): Promise<void> {
    const dbResult = await this.pingDb();
    const embeddingResult = this.checkEmbedding();
    const llmResult = this.snapshotLLM();
    const quota = await this.measureQuota();
    const overall = this.computeOverall(dbResult, embeddingResult, quota);

    const body: HealthResponse = {
      status: overall,
      timestamp: new Date().toISOString(),
      db: dbResult,
      llm: llmResult,
      r2: {
        status: 'deferred',
        note: 'MS0-T013 Cloudflare R2 wiring not yet landed',
      },
      embedding: embeddingResult,
      quota: {
        ...quota,
        neon_free_tier_mb: NEON_FREE_TIER_MB,
        groq_rpd_used: 0,
        groq_rpd_note:
          'RPD tracking deferred — surfaces when llm-gateway tracks per-window calls',
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
    try {
      const cfg = this.llm.getConfig();
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
    // Required subsystems for "ok": db + embedding.
    if (db.status !== 'up') return 'down';
    if (embedding.status !== 'up') return 'down';
    // Quota >90% degrades to alert state (UptimeRobot triggers on 503).
    if (quota.neon_pct !== null && quota.neon_pct > QUOTA_WARNING_PCT) {
      return 'degraded';
    }
    return 'ok';
  }
}
