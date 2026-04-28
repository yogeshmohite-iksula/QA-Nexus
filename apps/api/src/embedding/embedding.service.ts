// QA Nexus PM1 — embedding service.
//
// Spec: PM1_ERD §6 + MS0-T024. Loads a sentence-transformer ONNX model via
// @xenova/transformers (in-process WASM, no separate inference server) and
// exposes EmbeddingService.embed(text) -> 1024-dim Float32Array.
//
// Model selection — IMPORTANT note for reviewers:
//   - PM1 binding spec (CLAUDE.md + database.md) says Qwen3-Embedding-0.6B.
//   - As of 2026-04-28, Xenova/Qwen3-Embedding-0.6B is NOT yet published as
//     an ONNX-converted model on Hugging Face. transformers.js needs ONNX.
//   - Default is Xenova/bge-large-en-v1.5 (verified 1024-dim, BGE family,
//     widely-used sentence-transformer). Same vector dimension as Qwen3,
//     so the schema's vector(1024) column + HNSW index continue to fit.
//   - Override at runtime via EMBEDDING_MODEL_ID=... When Xenova publishes
//     a Qwen3-0.6B ONNX, swap by setting that env var (no schema change
//     needed). Filed as Day-3+ followup.
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

// Lazy import inside the class to avoid pulling in the WASM at process start
// for tools that import this module (eg. typecheck) without using it.
type FeatureExtractionPipeline = (
  text: string | string[],
  opts?: { pooling?: 'mean' | 'cls' | 'none'; normalize?: boolean },
) => Promise<{ data: Float32Array; dims: number[] }>;

const DEFAULT_MODEL_ID = 'Xenova/bge-large-en-v1.5';
const EXPECTED_DIM = 1024;

@Injectable()
export class EmbeddingService implements OnModuleInit {
  private readonly logger = new Logger(EmbeddingService.name);
  private extractor: FeatureExtractionPipeline | null = null;
  private loadingPromise: Promise<FeatureExtractionPipeline> | null = null;
  private loadedModelId = '';
  private loadStartedAt = 0;
  private loadCompletedAt = 0;

  /** Triggered by NestJS at startup; we kick off the load without awaiting
   *  it (so server bind isn't blocked) and the .embed() method awaits the
   *  same promise — so the FIRST embed call serializes on model availability,
   *  but the bootstrap proceeds. */
  onModuleInit(): void {
    this.loadingPromise = this.loadModel();
    // Don't await — fire-and-forget. embed() awaits it.
    this.loadingPromise
      .then((extractor) => {
        this.extractor = extractor;
        this.loadCompletedAt = Date.now();
        this.logger.log(
          `EmbeddingService ready: model=${this.loadedModelId} ` +
            `loaded in ${this.loadCompletedAt - this.loadStartedAt}ms`,
        );
      })
      .catch((err) => {
        this.logger.error(
          `EmbeddingService failed to load model: ${err instanceof Error ? err.message : String(err)}`,
        );
      });
  }

  /** Returns true once the model is in memory. Used by /health. */
  isWarm(): boolean {
    return this.extractor !== null;
  }

  /** Diagnostic info for /health. */
  status(): {
    warm: boolean;
    modelId: string;
    loadStartedAt: number;
    loadCompletedAt: number;
    loadDurationMs: number | null;
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
    };
  }

  /** Embed a single text into a 1024-dim Float32Array.
   *  Uses mean-pooling + L2-normalisation (the standard sentence-transformer
   *  setup; matches downstream cosine-similarity HNSW indexes). */
  async embed(text: string): Promise<Float32Array> {
    if (typeof text !== 'string' || text.length === 0) {
      throw new Error('embed(text): text must be a non-empty string');
    }
    let extractor = this.extractor;
    if (!extractor) {
      // Fall through to the in-flight load, or kick a fresh one off if init
      // never ran (eg. unit-test directly newing the service).
      if (!this.loadingPromise) {
        this.loadingPromise = this.loadModel();
      }
      try {
        extractor = await this.loadingPromise;
        this.extractor = extractor;
      } catch (err) {
        throw new ServiceUnavailableException(
          `embedding model unavailable: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
    const out = await extractor(text, { pooling: 'mean', normalize: true });
    if (out.data.length !== EXPECTED_DIM) {
      throw new Error(
        `embedding dim mismatch: expected ${EXPECTED_DIM}, got ${out.data.length} ` +
          `(model=${this.loadedModelId}). Schema vector(1024) won't accept this. ` +
          `Fix EMBEDDING_MODEL_ID env var.`,
      );
    }
    return out.data;
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
