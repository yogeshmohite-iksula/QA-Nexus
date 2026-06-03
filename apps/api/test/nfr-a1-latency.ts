// QA Nexus PM1 — NFR-003 Composer (A1) generate() latency probe (Day-2 Task D.1).
//
// Measures Composer.generate() end-to-end (assert workspace → RAG/scaffold → Groq
// generation → response) against the seeded REQ-NFR-001 on the TEST branch. This
// exercises the live Groq path, so it consumes ~1 Groq call per loop.
//
// GATE (PM1_PRD §10 NFR-003): Composer A1 p95 < 10000 ms.
//
// SAFETY: refuses unless DATABASE_URL host == TEST_DATABASE_URL host. Each generate()
// is wrapped in try/catch — if generate persists test cases and a later iteration
// key-collides, that iteration is logged + skipped (only successful runs scored).
//
// USAGE:
//   DATABASE_URL="$TEST_DATABASE_URL" TEST_DATABASE_URL="$TEST_DATABASE_URL" \
//     OUT=/tmp/wed-nfr-a1.json A1_LIMIT=5 pnpm --filter @qa-nexus/api nfr:a1

import { NestFactory } from '@nestjs/core';
import { Module, Logger } from '@nestjs/common';
import * as fs from 'node:fs/promises';

import { ComposerService } from '../src/test-cases/composer.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuditService } from '../src/audit/audit.service';
import { LLMGatewayService } from '../src/llm/llm-gateway.service';
import type { ActorContext } from '../src/test-cases/test-cases.service';

@Module({
  providers: [ComposerService, PrismaService, AuditService, LLMGatewayService],
})
class NfrA1Module {}

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

const DB = process.env.DATABASE_URL ?? '';
const TEST = process.env.TEST_DATABASE_URL ?? '';
if (!TEST || hostOf(DB) !== hostOf(TEST)) {
  console.error(
    '[nfr-a1] REFUSED — DATABASE_URL host must equal TEST_DATABASE_URL host (run with ' +
      'DATABASE_URL="$TEST_DATABASE_URL" so PrismaService connects to ep-blue-star, not pilot).',
  );
  process.exit(2);
}

async function main(): Promise<void> {
  const logger = new Logger('NfrA1');
  const N = parseInt(process.env.A1_LIMIT ?? '5', 10);
  const out = process.env.OUT;
  const A1_GATE_MS = 10000;

  logger.log(`DB host: ${hostOf(DB)} · A1_LIMIT=${N}`);
  const app = await NestFactory.createApplicationContext(NfrA1Module, {
    logger: ['warn', 'error'],
  });
  const composer = app.get(ComposerService);
  const prisma = app.get(PrismaService);

  const ws = await prisma.workspace.findFirst({
    where: { name: 'NFR Latency Fixture' },
  });
  const user = await prisma.user.findFirst({
    where: { email: 'nfr-actor@test.local' },
  });
  const project = await prisma.project.findFirst({ where: { key: 'NFR' } });
  const req = await prisma.requirement.findFirst({
    where: { key: 'REQ-NFR-001' },
  });
  if (!ws || !user || !project || !req) {
    logger.error('Fixture not found — run seed:nfr first.');
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
  // count 3 (lighter Groq output) · step format. generate() parses this internally.
  const rawInput = { count: 3, format: 'step' as const };

  const lat: number[] = [];
  let errors = 0;
  for (let i = 0; i < N; i++) {
    const t0 = Date.now();
    try {
      const r = await composer.generate(project.id, req.id, rawInput, ctx);
      const ms = Date.now() - t0;
      lat.push(ms);
      logger.log(
        `run ${i + 1}/${N}: ${ms}ms · generated=${r.cases?.length ?? '?'}`,
      );
    } catch (err) {
      errors++;
      logger.warn(
        `run ${i + 1}/${N} FAILED (${Date.now() - t0}ms): ${err instanceof Error ? err.message.slice(0, 80) : String(err)}`,
      );
    }
  }
  await prisma.$disconnect();
  await app.close();

  if (lat.length === 0) {
    console.log(
      `[nfr-a1] all ${N} runs failed (${errors} errors) — no latency to report.`,
    );
    process.exit(1);
  }

  lat.sort((a, b) => a - b);
  const p50 = pct(lat, 50);
  const p95 = pct(lat, 95);
  const p99 = pct(lat, 99);
  const pass = p95 < A1_GATE_MS;

  console.log('\n=== NFR-003 A1 Composer generate() latency ===');
  console.log(
    `samples: ${lat.length}/${N} succeeded (${errors} errors) · REQ-NFR-001, count=3`,
  );
  console.log(
    `min/p50/p95/p99/max ms: ${lat[0]} / ${p50} / ${p95} / ${p99} / ${lat[lat.length - 1]}`,
  );
  console.log(
    `p95 ${p95}ms vs gate ${A1_GATE_MS}ms → ${pass ? 'PASS ✅' : 'FAIL ❌'}`,
  );

  if (out) {
    await fs.writeFile(
      out,
      JSON.stringify(
        {
          nfr: 'NFR-003 A1 Composer generate()',
          samples: lat.length,
          attempted: N,
          errors,
          stats: { min: lat[0], p50, p95, p99, max: lat[lat.length - 1] },
          gateMs: A1_GATE_MS,
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
  console.error('[nfr-a1] fatal:', err);
  process.exit(1);
});
