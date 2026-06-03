#!/usr/bin/env ts-node
// QA Nexus PM1 — populate vector(384) embeddings on the NFR fixture test cases.
// Day-2 PM (Wed 2026-06-03), Task C — prerequisite for NFR-003 A2 Curator latency.
//
// USAGE (mirror the seed:nfr pattern — caller exports BOTH env vars):
//
//   TEST_DATABASE_URL="$(grep ^TEST_DATABASE_URL apps/api/.env | cut -d= -f2-)" \
//   DATABASE_URL="$(grep ^DATABASE_URL apps/api/.env | cut -d= -f2-)" \
//     pnpm --filter @qa-nexus/api populate:embeddings
//
// SAFETY: reads TEST_DATABASE_URL explicitly + connects ONLY to that URL via
// PrismaClient datasources override (never via DATABASE_URL — pilot stays
// untouched). Refuses if TEST_DATABASE_URL is unset OR its host equals the
// pilot DATABASE_URL host (same host-compare gate as nfr-fixture.seed.ts; a
// substring check on "neon.tech" is insufficient — pilot + test branch are
// both on neon.tech with different `ep-*` endpoints).
//
// Belt-and-suspenders: the UPDATE is filtered `WHERE key LIKE 'TC-NFR-%'`. The
// pilot DB has 1284 test cases but NO TC-NFR-* rows (Yogesh confirmed Wed AM),
// so even a misconfigured run would be a 0-row no-op on pilot.
//
// VECTOR WRITE: Prisma's typed client can't reference `Unsupported("vector(384)")`,
// so the write uses raw SQL with explicit `::vector` cast — mirror of
// KbEmbeddingService:175-176 (`UPDATE … SET embedding = $1::vector WHERE id = $2::uuid`).

import { NestFactory } from '@nestjs/core';
import { Module, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import { EmbeddingService } from '../src/embedding/embedding.service';

@Module({ providers: [EmbeddingService] })
class PopulateEmbedModule {}

const TEST_DB_URL = process.env.TEST_DATABASE_URL ?? '';
const PILOT_DB_URL = process.env.DATABASE_URL ?? '';

function hostOf(u: string): string {
  try {
    return new URL(u).host;
  } catch {
    return '';
  }
}

if (!TEST_DB_URL) {
  console.error(
    '[populate-embeddings] REFUSED — TEST_DATABASE_URL not set. ' +
      'Export it (along with DATABASE_URL for the host-compare safety gate) before running.',
  );
  process.exit(2);
}
if (PILOT_DB_URL && hostOf(TEST_DB_URL) === hostOf(PILOT_DB_URL)) {
  console.error(
    '[populate-embeddings] REFUSED — TEST_DATABASE_URL host equals pilot DATABASE_URL host. ' +
      'Pilot data is sacred.',
  );
  process.exit(2);
}

interface TestCaseRow {
  id: string;
  key: string;
  title: string;
  expected_result: string;
  preconditions: string;
}

async function main(): Promise<void> {
  const logger = new Logger('PopulateEmbed');
  logger.log(
    `target (TEST_DATABASE_URL): ${TEST_DB_URL.replace(/:[^:@]+@/, ':***@')}`,
  );

  const prisma = new PrismaClient({
    datasources: { db: { url: TEST_DB_URL } },
  });

  logger.log('Bootstrapping EmbeddingService (WASM model load)…');
  const app = await NestFactory.createApplicationContext(PopulateEmbedModule, {
    logger: ['warn', 'error'],
  });
  const embedder = app.get(EmbeddingService);

  // Warm-up — also triggers the lazy model load. Not measured.
  const tw = Date.now();
  await embedder.embed('warm-up probe');
  logger.log(`Warm-up embed: ${Date.now() - tw}ms`);

  if (embedder.deferred) {
    logger.error(
      `EmbeddingService is DEFERRED (${embedder.deferredReason}) — cannot embed. Aborting.`,
    );
    await prisma.$disconnect();
    await app.close();
    process.exit(2);
  }

  // Read the 3 seeded NFR test cases. Use raw SQL to read by `key`-LIKE filter
  // (we don't need the embedding column itself; we just need id + body fields).
  const rows = (await prisma.$queryRawUnsafe(
    `SELECT id, key, title, expected_result, preconditions
       FROM test_cases
       WHERE key LIKE 'TC-NFR-%'
       ORDER BY key`,
  )) as TestCaseRow[];

  if (rows.length === 0) {
    logger.error(
      'No TC-NFR-* rows found on this DB. Run seed:nfr first against the test branch.',
    );
    await prisma.$disconnect();
    await app.close();
    process.exit(1);
  }
  logger.log(`Found ${rows.length} TC-NFR-* rows`);

  // Embed + UPDATE each row.
  for (const row of rows) {
    const text = [row.title, row.preconditions, row.expected_result]
      .filter((s) => typeof s === 'string' && s.length > 0)
      .join(' · ')
      .trim();

    const t0 = Date.now();
    const vec = await embedder.embed(text);
    const embedMs = Date.now() - t0;

    if (vec.length !== 384) {
      throw new Error(
        `${row.key}: expected 384-dim Float32Array, got ${vec.length}-dim`,
      );
    }

    // pgvector array literal: '[v1,v2,...,v384]' (no spaces required; pgvector
    // accepts the JSON-array form). Per-row binding because the dim is baked
    // into the literal (per KbEmbeddingService's "bulk VALUES optimization
    // deferred" note).
    const literal = `[${Array.from(vec).join(',')}]`;
    const affected = await prisma.$executeRawUnsafe(
      `UPDATE test_cases SET embedding = $1::vector WHERE id = $2::uuid AND key LIKE 'TC-NFR-%'`,
      literal,
      row.id,
    );

    logger.log(
      `${row.key} (${row.id.slice(0, 8)}): embedded ${text.length} chars in ${embedMs}ms · UPDATE affected ${affected} row(s)`,
    );
  }

  // Verify dims on all updated rows.
  const verify = (await prisma.$queryRawUnsafe(
    `SELECT key, vector_dims(embedding) AS dims
       FROM test_cases
       WHERE key LIKE 'TC-NFR-%'
       ORDER BY key`,
  )) as Array<{ key: string; dims: number }>;

  for (const v of verify) {
    console.log(`[populate-embeddings] verify ${v.key} dims=${v.dims}`);
  }
  const allOk =
    verify.length === rows.length &&
    verify.every((v) => Number(v.dims) === 384);
  console.log(
    allOk
      ? `[populate-embeddings] PASS — ${verify.length}/${rows.length} TC-NFR-* rows carry 384-dim embeddings ✅`
      : `[populate-embeddings] FAIL — dimension or count mismatch`,
  );

  await prisma.$disconnect();
  await app.close();
  process.exit(allOk ? 0 : 1);
}

main().catch((err) => {
  console.error('[populate-embeddings] fatal:', err);
  process.exit(1);
});
