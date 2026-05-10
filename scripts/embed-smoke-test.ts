// Embedding smoke test — verifies @xenova/transformers loads + caches the
// configured embedding model + produces a vector of the expected dim.
//
// Run (apps/api dir, uses repo's ts-node — tsx not installed):
//   cd apps/api && pnpm exec ts-node --transpile-only \
//     --compiler-options '{"module":"commonjs","moduleResolution":"node"}' \
//     ../../scripts/embed-smoke-test.ts
//
// Override model:
//   EMBEDDING_MODEL_ID=Xenova/bge-large-en-v1.5 pnpm exec ts-node ... (same)
//
// Verified Day-14 (2026-05-09) — bge-small-en-v1.5: cold load 7.1s,
// warm embed 53ms, dim=384. Cache lands at:
//   node_modules/.pnpm/@xenova+transformers@*/...
// + ~/.cache/huggingface (user home) for model weights.
//
// Spec: Day-14 TASK B2.4 (BE+1 sprint brief). Pre-flight check that
// Sunday's Curator real-impl swap (TASK C2) won't burn 10-15 min on
// a cold model download mid-implementation.
//
// Expected output (bge-small-en-v1.5, 384-dim):
//   [smoke] loading Xenova/bge-small-en-v1.5...
//   [smoke] loaded in 4823ms — dim=384
//   [smoke] embed("hello world")[0..3] = [0.0234, -0.1112, ...]
//   [smoke] OK
//
// Hard Rule 1 reminder: bge-large = 470 MB resident on Render Free
// (vs bge-small = 33 MB). Don't override EMBEDDING_MODEL_ID without
// reading ADR-003 amendment + ADR-014 (lands Day-15) first.

/* eslint-disable no-console */
const MODEL_ID = process.env.EMBEDDING_MODEL_ID || 'Xenova/bge-small-en-v1.5';
const SAMPLE_TEXT =
  process.argv[2] ||
  'Refund flow within 7 days — verify customer can initiate refund via support portal.';

async function main(): Promise<void> {
  console.log(`[smoke] loading ${MODEL_ID}...`);
  const t0 = Date.now();

  // Lazy import to keep module-load cost off scripts that don't need it.
  // @ts-ignore — @xenova/transformers ships its own types; avoid pulling
  // them into the script's tsconfig surface.
  const xenova: any = await import('@xenova/transformers');
  const extractor = await xenova.pipeline('feature-extraction', MODEL_ID, {
    quantized: true,
  });

  const tLoad = Date.now() - t0;
  console.log(`[smoke] loaded in ${tLoad}ms`);

  const t1 = Date.now();
  const result = await extractor(SAMPLE_TEXT, {
    pooling: 'mean',
    normalize: true,
  });
  const tEmbed = Date.now() - t1;

  const dim = (result.dims as number[]).at(-1) ?? -1;
  const sample = Array.from(result.data as Float32Array)
    .slice(0, 4)
    .map((v) => Number(v.toFixed(4)));

  console.log(`[smoke] embed(${JSON.stringify(SAMPLE_TEXT)}) done in ${tEmbed}ms — dim=${dim}`);
  console.log(`[smoke] vector[0..3] = [${sample.join(', ')}]`);

  // Assertions.
  if (dim !== 384 && MODEL_ID.includes('small')) {
    console.error(
      `[smoke] FAIL — expected dim=384 for bge-small, got ${dim}. ` +
        `Schema migration or ADR-014 reconciliation needed.`,
    );
    process.exit(1);
  }
  if (dim !== 1024 && MODEL_ID.includes('large')) {
    console.error(`[smoke] FAIL — expected dim=1024 for bge-large, got ${dim}.`);
    process.exit(1);
  }

  console.log('[smoke] OK');
}

main().catch((err) => {
  console.error('[smoke] FAIL:', err instanceof Error ? err.message : err);
  process.exit(1);
});
