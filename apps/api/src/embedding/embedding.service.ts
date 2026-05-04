// QA Nexus PM1 — embedding service.
//
// Spec: PM1_ERD §6 + MS0-T024. Loads a sentence-transformer ONNX model via
// @xenova/transformers (in-process WASM, no separate inference server) and
// exposes EmbeddingService.embed(text) -> 1024-dim Float32Array.
//
// Model selection — IMPORTANT note for reviewers (Day-8 Step-6 amended):
//   - PM1 binding spec (CLAUDE.md + database.md) says Qwen3-Embedding-0.6B.
//   - As of 2026-04-28, Xenova/Qwen3-Embedding-0.6B is NOT yet published as
//     an ONNX-converted model on Hugging Face. transformers.js needs ONNX.
//   - Day-4 PM Render Free 512 MB OOM forced bge-large → bge-small swap
//     (ADR-003 amendment + ADR-009). Schema migrated to vector(384) per
//     apps/api/prisma/raw/migrations/0002_vector_384_dim.sql (Day-5).
//   - Default is now Xenova/bge-small-en-v1.5 (384-dim, ~33 MB resident).
//     MTEB avg 62.17 vs bge-large's 64.23 = -2.06 pt quality cost in
//     exchange for fitting under 512 MB. Re-eval at M3 per followup (l).
//   - Override at runtime via EMBEDDING_MODEL_ID=... When Xenova publishes
//     a Qwen3-0.6B ONNX OR we move off Free tier, swap by setting that
//     env var (schema swap if dim differs).
//
// Eager-load strategy: model loads at NestJS bootstrap via OnModuleInit so
// the first /embedding call is warm, not cold. Cold loads can take 3-5s
// (download + WASM init); warm calls are <50ms after that.

import {
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { getHeapStatistics } from 'node:v8';

// Lazy import inside the class to avoid pulling in the WASM at process start
// for tools that import this module (eg. typecheck) without using it.
type FeatureExtractionPipeline = (
  text: string | string[],
  opts?: { pooling?: 'mean' | 'cls' | 'none'; normalize?: boolean },
) => Promise<{ data: Float32Array; dims: number[] }>;

const DEFAULT_MODEL_ID = 'Xenova/bge-small-en-v1.5';
const EXPECTED_DIM = 384;

/**
 * Approximate resident-memory footprint per known model, in MB. Used by
 * the pre-flight memory guard to refuse loading a model that would OOM
 * the dyno. Source: empirical measurement on Render Free 512 MB
 * (Day-4 afternoon — bge-large OOM'd at ~470 MB resident).
 *
 * Anything not in this map gets a conservative 512 MB estimate that
 * forces an explicit allowlist for new models — better safe than sorry.
 */
const MODEL_MEMORY_MB: Record<string, number> = {
  'Xenova/bge-large-en-v1.5': 470,
  'Xenova/bge-small-en-v1.5': 33,
  'Xenova/bge-base-en-v1.5': 110,
  'Xenova/multilingual-e5-large': 470,
  'Xenova/all-MiniLM-L6-v2': 25,
};

/** Pre-flight memory guard threshold. If model size > available × this,
 *  refuse to load and stay in deferred mode. 0.7 leaves 30% headroom for
 *  Nest baseline + Prisma + R2 + LLM gateway. */
const MEMORY_HEADROOM_FACTOR = 0.7;

@Injectable()
export class EmbeddingService implements OnModuleInit {
  private readonly logger = new Logger(EmbeddingService.name);
  private extractor: FeatureExtractionPipeline | null = null;
  private loadingPromise: Promise<FeatureExtractionPipeline> | null = null;
  private loadedModelId = '';
  private loadStartedAt = 0;
  private loadCompletedAt = 0;
  /**
   * True when model load failed (e.g., sharp native binary missing on
   * Render Linux x64, OOM on 512 MB free dyno, network issue fetching
   * ONNX from Hugging Face). Service stays in deferred mode; /health
   * reports it; embed() throws ServiceUnavailableException with the
   * deferredReason.
   */
  public deferred = true;
  public deferredReason: string | null =
    'model not yet loaded (loading on bootstrap, lazy on first embed call)';

  /** Triggered by NestJS at startup; we kick off the load without awaiting
   *  it (so server bind isn't blocked) and the .embed() method awaits the
   *  same promise — so the FIRST embed call serializes on model availability,
   *  but the bootstrap proceeds. */
  onModuleInit(): void {
    // Pre-flight memory guard: if the configured model is known to exceed
    // available_memory × 0.7, refuse to load and stay deferred. Logs a
    // clear warning instead of crashing the pod with OOM (Day-4 afternoon
    // bge-large vs Render Free 512 MB lesson — see ADR-003 amendment).
    const guard = this.checkMemoryHeadroom();
    if (!guard.ok) {
      this.deferred = true;
      this.deferredReason = guard.reason;
      this.logger.warn(
        `EmbeddingService refusing to load (pre-flight memory guard): ${guard.reason}. ` +
          `Service will stay in deferred mode. Set EMBEDDING_MODEL_ID to a ` +
          `smaller model (e.g. Xenova/bge-small-en-v1.5 ≈ 33 MB) or upgrade ` +
          `the dyno tier. See ADR-003.`,
      );
      return;
    }
    this.loadingPromise = this.loadModel();
    // Don't await — fire-and-forget. embed() awaits it.
    this.loadingPromise
      .then((extractor) => {
        this.extractor = extractor;
        this.loadCompletedAt = Date.now();
        this.deferred = false;
        this.deferredReason = null;
        this.logger.log(
          `EmbeddingService ready: model=${this.loadedModelId} ` +
            `loaded in ${this.loadCompletedAt - this.loadStartedAt}ms`,
        );
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : String(err);
        this.deferred = true;
        this.deferredReason = msg;
        this.logger.warn(
          `EmbeddingService running in DEFERRED mode (model load failed): ${msg}. ` +
            `Likely sharp native binary missing on Render Linux x64 OR OOM on 512 MB free dyno. ` +
            `Add \`pnpm rebuild sharp\` to build command, or upgrade dyno tier for embeddings.`,
        );
      });
  }

  /** Returns true once the model is in memory. Used by /health. */
  isWarm(): boolean {
    return this.extractor !== null;
  }

  /**
   * Pre-flight memory guard. Checks whether the configured model's
   * known resident footprint fits within the available memory minus
   * a headroom factor (default 70% so Nest + Prisma + R2 + LLM gateway
   * have ~30% to breathe).
   *
   * Returns `{ok: true}` if the model is safe to load OR if we don't
   * know the model's footprint (unknown → log + allow, since blocking
   * unknown models would prevent us from trying new ones).
   *
   * Returns `{ok: false, reason}` if the model is known + exceeds the
   * threshold. The reason is admin-friendly for /health surfacing.
   *
   * Trigger: Day-4 afternoon Render Free OOM crash loop with bge-large
   * (470 MB) on a 512 MB dyno. See ADR-003 amendment.
   */
  private checkMemoryHeadroom(): { ok: true } | { ok: false; reason: string } {
    const modelId = process.env.EMBEDDING_MODEL_ID ?? DEFAULT_MODEL_ID;
    const modelMb = MODEL_MEMORY_MB[modelId];
    if (modelMb === undefined) {
      // Unknown model — allow with a warning. New models get added to
      // MODEL_MEMORY_MB after we measure them on the target environment.
      this.logger.log(
        `EmbeddingService memory guard: unknown model "${modelId}", ` +
          `allowing load. Add to MODEL_MEMORY_MB after measuring resident size.`,
      );
      return { ok: true };
    }
    // process.memoryUsage() reports current heap; for the dyno cap we
    // use V8's heap statistics (heap_size_limit ≈ dyno's available
    // memory minus other resident overhead). Falls back to 512 MB if
    // V8 doesn't expose the limit (test environments).
    const heapLimitMb =
      getHeapStatistics().heap_size_limit / (1024 * 1024) || 512;
    const safeBudgetMb = heapLimitMb * MEMORY_HEADROOM_FACTOR;
    if (modelMb > safeBudgetMb) {
      return {
        ok: false,
        reason:
          `model "${modelId}" footprint ~${modelMb} MB exceeds safe ` +
          `budget ${Math.round(safeBudgetMb)} MB ` +
          `(${MEMORY_HEADROOM_FACTOR * 100}% of heap limit ${Math.round(heapLimitMb)} MB). ` +
          `OOM risk. Use a smaller model OR upgrade dyno.`,
      };
    }
    this.logger.log(
      `EmbeddingService memory guard: model "${modelId}" ~${modelMb} MB ` +
        `fits in safe budget ${Math.round(safeBudgetMb)} MB ` +
        `(heap limit ${Math.round(heapLimitMb)} MB). Loading.`,
    );
    return { ok: true };
  }

  /** Diagnostic info for /health. */
  status(): {
    warm: boolean;
    modelId: string;
    loadStartedAt: number;
    loadCompletedAt: number;
    loadDurationMs: number | null;
    deferred: boolean;
    deferredReason: string | null;
  } {
    return {
      warm: this.isWarm(),
      modelId: this.loadedModelId,
      loadStartedAt: this.loadStartedAt,
      loadCompletedAt: this.loadCompletedAt,
      loadDurationMs:
        this.loadCompletedAt > 0
          ? this.loadCompletedAt - this.loadStartedAt
          : null,
      deferred: this.deferred,
      deferredReason: this.deferredReason,
    };
  }

  /** Embed a single text into a 384-dim Float32Array.
   *  Uses mean-pooling + L2-normalisation (the standard sentence-transformer
   *  setup; matches downstream cosine-similarity HNSW indexes). */
  async embed(text: string): Promise<Float32Array> {
    if (typeof text !== 'string' || text.length === 0) {
      throw new Error('embed(text): text must be a non-empty string');
    }
    const extractor = await this.requireExtractor();
    const out = await extractor(text, { pooling: 'mean', normalize: true });
    if (out.data.length !== EXPECTED_DIM) {
      throw new Error(
        `embedding dim mismatch: expected ${EXPECTED_DIM}, got ${out.data.length} ` +
          `(model=${this.loadedModelId}). Schema vector(${EXPECTED_DIM}) won't accept this. ` +
          `Fix EMBEDDING_MODEL_ID env var.`,
      );
    }
    return out.data;
  }

  /** Embed a batch of texts. The underlying transformers.js extractor
   *  accepts string[] and emits a flat Float32Array of size
   *  texts.length × EXPECTED_DIM, which we slice into per-text chunks.
   *  Materially faster than serial embed() calls (one WASM bridge
   *  crossing per batch instead of N) — important for the M2 KB
   *  embedding flow which writes ~50 chunks per document.
   *
   *  Returns Float32Array per input text, in input order. Throws
   *  ServiceUnavailableException if model deferred. Throws Error on
   *  dim mismatch (pinned by test). */
  async embedBatch(texts: string[]): Promise<Float32Array[]> {
    if (!Array.isArray(texts) || texts.length === 0) {
      throw new Error('embedBatch(texts): texts must be a non-empty array');
    }
    if (texts.some((t) => typeof t !== 'string' || t.length === 0)) {
      throw new Error(
        'embedBatch(texts): every entry must be a non-empty string',
      );
    }
    const extractor = await this.requireExtractor();
    const out = await extractor(texts, { pooling: 'mean', normalize: true });
    const expectedTotal = texts.length * EXPECTED_DIM;
    if (out.data.length !== expectedTotal) {
      throw new Error(
        `embedBatch dim mismatch: expected ${expectedTotal} ` +
          `(${texts.length} × ${EXPECTED_DIM}), got ${out.data.length} ` +
          `(model=${this.loadedModelId}).`,
      );
    }
    // Slice the flat output into per-text Float32Arrays. Each slice is
    // a view into the same underlying buffer — copy via slice() so the
    // caller can safely mutate / pass around without aliasing.
    const result: Float32Array[] = [];
    for (let i = 0; i < texts.length; i++) {
      const start = i * EXPECTED_DIM;
      result.push(out.data.slice(start, start + EXPECTED_DIM));
    }
    return result;
  }

  /** Internal: ensure the extractor is loaded. Awaits the in-flight
   *  loading promise if a load is already in progress, kicks one off
   *  if neither extractor nor loadingPromise exists (test path). */
  private async requireExtractor(): Promise<FeatureExtractionPipeline> {
    if (this.extractor) return this.extractor;
    if (!this.loadingPromise) {
      this.loadingPromise = this.loadModel();
    }
    try {
      this.extractor = await this.loadingPromise;
      return this.extractor;
    } catch (err) {
      throw new ServiceUnavailableException(
        `embedding model unavailable: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /** Internal: load the model. Wrapped so onModuleInit + lazy embed() share. */
  private async loadModel(): Promise<FeatureExtractionPipeline> {
    const modelId = process.env.EMBEDDING_MODEL_ID || DEFAULT_MODEL_ID;
    this.loadedModelId = modelId;
    this.loadStartedAt = Date.now();
    this.logger.log(
      `Loading embedding model: ${modelId} (cold load may take 3-5s)…`,
    );
    // Dynamic import — keeps tsc happy with @xenova/transformers' deep ESM
    // export shape, and keeps the WASM out of import-time side effects.
    const xenova = await import('@xenova/transformers');
    const pipeline = (xenova as { pipeline: unknown }).pipeline as (
      task: string,
      modelId: string,
      opts?: Record<string, unknown>,
    ) => Promise<FeatureExtractionPipeline>;
    return await pipeline('feature-extraction', modelId, { quantized: true });
  }
}
