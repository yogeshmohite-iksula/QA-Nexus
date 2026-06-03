// QA Nexus PM1 — NFR-003 Curator (A2) full check() latency probe (Day-2 Task D.2).
//
// Measures the FULL Curator.check() roundtrip (embed query → pgvector HNSW search →
// threshold scoring + audit write) against the seeded NFR fixture on the TEST branch.
// This supersedes the Day-1 embedding-only proxy (p95 98ms) with the real end-to-end
// number. No Groq — Curator is embedding + pgvector only.
//
// GATE (PM1_PRD §10 NFR-003): Curator A2 p95 < 500 ms.
//
// SAFETY: refuses unless DATABASE_URL host == TEST_DATABASE_URL host (i.e. the caller
// overrode DATABASE_URL to the test branch). Never runs against pilot. Curator.check()
// is read-only on test_cases (it only writes audit rows on the test branch).
//
// USAGE:
//   DATABASE_URL="$TEST_DATABASE_URL" TEST_DATABASE_URL="$TEST_DATABASE_URL" \
//     OUT=/tmp/wed-nfr-a2.json A2_LIMIT=10 pnpm --filter @qa-nexus/api nfr:a2

import { NestFactory } from '@nestjs/core';
import { Module, Logger } from '@nestjs/common';
import * as fs from 'node:fs/promises';

import { CuratorService } from '../src/test-cases/curator.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuditService } from '../src/audit/audit.service';
import { EmbeddingService } from '../src/embedding/embedding.service';
import type { ActorContext } from '../src/test-cases/test-cases.service';
import { CuratorCheckRequest } from '@qa-nexus/shared';

@Module({
  providers: [CuratorService, PrismaService, AuditService, EmbeddingService],
})
class NfrA2Module {}

function hostOf(u: string): string {
  try {
    return new URL(u).host;
  } catch {
    return '';
  }
}
function pct(sorted: number[], p: number): number {
  if (sorted.length === 0) return NaN;
  return sorted[
    Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)
  ];
}

// --- safety gate: DATABASE_URL must be the test branch -----------------------
const DB = process.env.DATABASE_URL ?? '';
const TEST = process.env.TEST_DATABASE_URL ?? '';
if (!TEST || hostOf(DB) !== hostOf(TEST)) {
  console.error(
    '[nfr-a2] REFUSED — DATABASE_URL host must equal TEST_DATABASE_URL host (run with ' +
      'DATABASE_URL="$TEST_DATABASE_URL" so PrismaService connects to ep-blue-star, not pilot).',
  );
  process.exit(2);
}

async function main(): Promise<void> {
  const logger = new Logger('NfrA2');
  const N = parseInt(process.env.A2_LIMIT ?? '10', 10);
  const out = process.env.OUT;
  const A2_GATE_MS = 500;

  logger.log(`DB host: ${hostOf(DB)} · A2_LIMIT=${N}`);
  const app = await NestFactory.createApplicationContext(NfrA2Module, {
    logger: ['warn', 'error'],
  });
  const curator = app.get(CuratorService);
  const prisma = app.get(PrismaService);

  // Resolve the seeded fixture (workspaces/users are RLS-exempt; project/testCase
  // are owned by the Neon role which bypasses RLS — seed/populate proved this).
  const ws = await prisma.workspace.findFirst({
    where: { name: 'NFR Latency Fixture' },
  });
  const user = await prisma.user.findFirst({
    where: { email: 'nfr-actor@test.local' },
  });
  const project = await prisma.project.findFirst({ where: { key: 'NFR' } });
  const subject = await prisma.testCase.findFirst({
    where: { key: 'TC-NFR-001' },
  });
  if (!ws || !user || !project || !subject) {
    logger.error(
      'Fixture not found — run seed:nfr + populate:embeddings first.',
    );
    await prisma.$disconnect();
    await app.close();
    process.exit(1);
  }

  const ctx: ActorContext = {
    workspaceId: ws.id,
    actorId: user.id,
    actorEmail: user.email,
    role: 'Admin',
  };
  const input = CuratorCheckRequest.parse({}); // defaults: flag 0.85 / block 0.95 / topK 5

  // Warm-up (model load + first pgvector query) — not measured.
  const tw = Date.now();
  const warm = await curator.check(project.id, subject.id, input, ctx);
  logger.log(
    `Warm-up check: ${Date.now() - tw}ms · matches=${warm.matches?.length ?? 0}`,
  );

  const lat: number[] = [];
  for (let i = 0; i < N; i++) {
    const t0 = Date.now();
    await curator.check(project.id, subject.id, input, ctx);
    lat.push(Date.now() - t0);
  }
  await prisma.$disconnect();
  await app.close();

  lat.sort((a, b) => a - b);
  const p50 = pct(lat, 50);
  const p95 = pct(lat, 95);
  const p99 = pct(lat, 99);
  const pass = p95 < A2_GATE_MS;

  console.log('\n=== NFR-003 A2 Curator full check() latency ===');
  console.log(
    `samples: ${lat.length} (subject TC-NFR-001 vs project NFR candidates)`,
  );
  console.log(
    `min/p50/p95/p99/max ms: ${lat[0]} / ${p50} / ${p95} / ${p99} / ${lat[lat.length - 1]}`,
  );
  console.log(
    `p95 ${p95}ms vs gate ${A2_GATE_MS}ms → ${pass ? 'PASS ✅' : 'FAIL ❌'}`,
  );

  if (out) {
    await fs.writeFile(
      out,
      JSON.stringify(
        {
          nfr: 'NFR-003 A2 Curator full check()',
          samples: lat.length,
          stats: { min: lat[0], p50, p95, p99, max: lat[lat.length - 1] },
          gateMs: A2_GATE_MS,
          verdict: pass ? 'PASS' : 'FAIL',
          perCallMs: lat,
        },
        null,
        2,
      ),
    );
    console.log(`JSON: ${out}`);
  }
  process.exit(pass ? 0 : 1);
}

main().catch((err) => {
  console.error('[nfr-a2] fatal:', err);
  process.exit(1);
});
