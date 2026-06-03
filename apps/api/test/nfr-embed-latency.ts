// QA Nexus PM1 — NFR-003 embedding-latency probe (Day-1 PM pilot-push).
//
// Measures EmbeddingService.embed() latency over the A2 golden-set texts. This
// is the **query-embedding component** of the Curator (A2) <500ms budget — the
// DB-free, Groq-free part that is runnable WITHOUT a seeded fixture.
//
// WHY A PROXY (not the full Curator check()): Curator.check() is workspace-scoped
// — it does assertCaseWorkspace (DB lookup, throws if the case isn't seeded),
// writes audit rows, and (per ADR-014) falls to a STUB_DURATION_MS path when the
// embedder is deferred or CURATOR_OFFLINE=1. A meaningful full-check() latency
// therefore needs a seeded DB fixture (test cases WITH embeddings + a real
// ActorContext) + a warm embedder — Wed work. embed() alone needs neither, so it
// gives a real, honest tonight baseline for the dominant local A2 cost.
//
// USAGE:
//   pnpm --filter @qa-nexus/api nfr:embed
//   NFR_EMBED_N=50 OUT=/tmp/nfr-embed-results.json pnpm --filter @qa-nexus/api nfr:embed
//
// GATE CONTEXT: NFR-003 Curator A2 p95 < 500ms (full check(); embed() is a
// strict lower-bound component of it).

import { NestFactory } from '@nestjs/core';
import { Module, Logger } from '@nestjs/common';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import { EmbeddingService } from '../src/embedding/embedding.service';

@Module({ providers: [EmbeddingService] })
class NfrEmbedModule {}

function pct(sorted: number[], p: number): number {
  if (sorted.length === 0) return NaN;
  const idx = Math.min(
    sorted.length - 1,
    Math.ceil((p / 100) * sorted.length) - 1,
  );
  return sorted[idx];
}

interface GoldenItem {
  duplicate_description?: string;
  duplicate_title?: string;
  original_description?: string;
}

async function main(): Promise<void> {
  const logger = new Logger('NfrEmbed');
  const n = parseInt(process.env.NFR_EMBED_N ?? '30', 10);
  const out = process.env.OUT;

  const goldenPath = path.resolve(__dirname, 'golden-sets/a2/final/easy.json');
  const golden = JSON.parse(await fs.readFile(goldenPath, 'utf8')) as {
    items: GoldenItem[];
  };
  const texts = golden.items
    .slice(0, n)
    .map(
      (it) =>
        it.duplicate_description ??
        it.duplicate_title ??
        it.original_description ??
        '',
    )
    .filter((t) => t.length > 0);

  logger.log(`Loaded ${texts.length} A2 texts (NFR_EMBED_N=${n})`);
  logger.log('Bootstrapping EmbeddingService (WASM model load)…');
  const app = await NestFactory.createApplicationContext(NfrEmbedModule, {
    logger: ['warn', 'error'],
  });
  const embedder = app.get(EmbeddingService);

  // Warm-up (also triggers the lazy model load); not counted in measurements.
  const tw = Date.now();
  await embedder.embed('warm-up probe');
  logger.log(`Warm-up embed: ${Date.now() - tw}ms`);

  if (embedder.deferred) {
    logger.error(
      `EmbeddingService is DEFERRED (${embedder.deferredReason}) — cannot measure. ` +
        `On a >512MB machine this should not happen; check EMBEDDING_MODEL_ID.`,
    );
    await app.close();
    process.exit(2);
  }

  const lat: number[] = [];
  for (const t of texts) {
    const t0 = Date.now();
    await embedder.embed(t);
    lat.push(Date.now() - t0);
  }
  await app.close();

  lat.sort((a, b) => a - b);
  const p50 = pct(lat, 50);
  const p95 = pct(lat, 95);
  const p99 = pct(lat, 99);
  const A2_GATE_MS = 500; // full Curator check() budget; embed() is a component
  const pass = p95 < A2_GATE_MS;

  console.log(
    '\n=== NFR-003 embedding-latency (A2 query-embedding component) ===',
  );
  console.log(`samples:       ${lat.length}`);
  console.log(
    `min/p50/p95/p99/max ms: ${lat[0]} / ${p50} / ${p95} / ${p99} / ${lat[lat.length - 1]}`,
  );
  console.log(
    `embed() p95 = ${p95}ms vs A2 full-check gate ${A2_GATE_MS}ms → ${pass ? 'PASS (component)' : 'OVER (investigate)'}`,
  );
  console.log(
    'NOTE: this is the embedding component only; full Curator check() adds pgvector search + threshold logic (Wed, needs DB fixture).',
  );

  if (out) {
    await fs.writeFile(
      out,
      JSON.stringify(
        {
          nfr: 'NFR-003 A2 embedding component',
          samples: lat.length,
          stats: { min: lat[0], p50, p95, p99, max: lat[lat.length - 1] },
          a2GateMs: A2_GATE_MS,
          componentVerdict: pass ? 'PASS' : 'OVER',
          note: 'embed() only — full check() adds pgvector search (Wed, DB fixture)',
          perCallMs: lat,
        },
        null,
        2,
      ),
    );
    console.log(`\nJSON: ${out}`);
  }
}

main().catch((err) => {
  console.error('nfr-embed-latency failed:', err);
  process.exit(1);
});
