// QA Nexus PM1 — NFR-003 A1/A2 latency probe service (Day-3 Task 5).
//
// Runs the Composer (A1) + Curator (A2) latency loops from a host co-located
// with Neon (Render → ap-southeast-1) so the numbers are representative — the
// dev-Mac adds ~91ms/round-trip (Day-2 14th reality-check). Mirrors the
// standalone harnesses test/nfr-a1-latency.ts + test/nfr-a2-latency.ts,
// parameterized for HTTP triggering.
//
// SAFETY (Yogesh ruling Day-3 — "test branch"): each call builds a per-request
// child Nest context whose PrismaService is bound to TEST_DATABASE_URL
// (ep-blue-star), NEVER the pilot DATABASE_URL. A1 (Composer.generate) PERSISTS
// test cases and both agents audit-write, so they may only run against the
// writable test branch. assertTestBranch() refuses if TEST_DATABASE_URL is
// unset OR resolves to the same host as DATABASE_URL (pilot) — belt-and-braces
// against the directUrl-style mis-targeting from Day-2.

import {
  Injectable,
  Logger,
  Module,
  ServiceUnavailableException,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { PrismaClient } from '@prisma/client';
import { CuratorCheckRequest, type NfrProbeResponse } from '@qa-nexus/shared';

import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { LLMGatewayService } from '../llm/llm-gateway.service';
import { EmbeddingService } from '../embedding/embedding.service';
import { ComposerService } from '../test-cases/composer.service';
import { CuratorService } from '../test-cases/curator.service';
import type { ActorContext } from '../test-cases/test-cases.service';

function hostOf(u: string): string {
  try {
    return new URL(u).host;
  } catch {
    return '';
  }
}
function pct(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  return sorted[
    Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)
  ];
}
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Build a PrismaClient bound to the TEST branch (never pilot) for the probe's
 * child context. Cast to the PrismaService DI token: Composer/Curator/Audit
 * only call PrismaClient query methods, so the structural cast is safe — the
 * standalone harnesses (which provide the real PrismaService reading
 * DATABASE_URL) proved the exact same module shape works.
 */
function makeTestPrisma(): PrismaService {
  return new PrismaClient({
    datasources: { db: { url: process.env.TEST_DATABASE_URL } },
  }) as unknown as PrismaService;
}

@Module({
  providers: [
    ComposerService,
    AuditService,
    LLMGatewayService,
    { provide: PrismaService, useFactory: makeTestPrisma },
  ],
})
class NfrA1ProbeModule {}

@Module({
  providers: [
    CuratorService,
    AuditService,
    EmbeddingService,
    { provide: PrismaService, useFactory: makeTestPrisma },
  ],
})
class NfrA2ProbeModule {}

const A1_GATE_MS = 10_000;
const A2_GATE_MS = 500;

@Injectable()
export class NfrProbeService {
  private readonly logger = new Logger(NfrProbeService.name);

  /** Refuse unless TEST_DATABASE_URL is set AND differs from the pilot host. */
  private assertTestBranch(): string {
    const test = process.env.TEST_DATABASE_URL ?? '';
    const pilot = process.env.DATABASE_URL ?? '';
    if (!test) {
      throw new ServiceUnavailableException(
        'TEST_DATABASE_URL not set — the NFR probe requires the writable test branch (never pilot).',
      );
    }
    if (hostOf(test) === hostOf(pilot)) {
      throw new ServiceUnavailableException(
        'TEST_DATABASE_URL host equals DATABASE_URL (pilot) host — refusing (would write to pilot).',
      );
    }
    return hostOf(test);
  }

  async runA1(limit: number, sleepMs: number): Promise<NfrProbeResponse> {
    const dbHost = this.assertTestBranch();
    const app = await NestFactory.createApplicationContext(NfrA1ProbeModule, {
      logger: ['warn', 'error'],
    });
    const prisma = app.get(PrismaService);
    try {
      const composer = app.get(ComposerService);
      const ctx = await this.resolveActor(prisma);
      const project = await prisma.project.findFirst({ where: { key: 'NFR' } });
      const req = await prisma.requirement.findFirst({
        where: { key: 'REQ-NFR-001' },
      });
      if (!project || !req) {
        throw new ServiceUnavailableException(
          'Fixture project NFR / REQ-NFR-001 not found on the test branch — run seed:nfr.',
        );
      }

      const lat: number[] = [];
      let errors = 0;
      for (let i = 0; i < limit; i++) {
        const t0 = Date.now();
        try {
          await composer.generate(
            project.id,
            req.id,
            { count: 3, format: 'step' },
            ctx,
          );
          lat.push(Date.now() - t0);
        } catch (err) {
          errors++;
          this.logger.warn(
            `A1 run ${i + 1}/${limit} failed: ${err instanceof Error ? err.message.slice(0, 80) : String(err)}`,
          );
        }
        if (sleepMs > 0 && i < limit - 1) await sleep(sleepMs);
      }
      return this.summarize(
        'NFR-003 A1 Composer generate()',
        dbHost,
        limit,
        errors,
        lat,
        A1_GATE_MS,
      );
    } finally {
      await prisma.$disconnect().catch(() => undefined);
      await app.close();
    }
  }

  async runA2(limit: number): Promise<NfrProbeResponse> {
    const dbHost = this.assertTestBranch();
    const app = await NestFactory.createApplicationContext(NfrA2ProbeModule, {
      logger: ['warn', 'error'],
    });
    const prisma = app.get(PrismaService);
    try {
      const curator = app.get(CuratorService);
      const embedder = app.get(EmbeddingService);
      const ctx = await this.resolveActor(prisma);
      const project = await prisma.project.findFirst({ where: { key: 'NFR' } });
      const subject = await prisma.testCase.findFirst({
        where: { key: 'TC-NFR-001' },
      });
      if (!project || !subject) {
        throw new ServiceUnavailableException(
          'Fixture project NFR / TC-NFR-001 not found on the test branch — run seed:nfr + populate:embeddings.',
        );
      }

      const input = CuratorCheckRequest.parse({});
      // Warm-up (model load + first pgvector query) — not measured.
      await curator.check(project.id, subject.id, input, ctx);
      // Honesty guard: if the child embedder deferred (Render memory pressure
      // from a 2nd model load), Curator.check() silently uses the ADR-014 stub
      // path — which would report a FAKE latency. Fail loudly instead.
      if (embedder.deferred) {
        throw new ServiceUnavailableException(
          `Child embedder deferred (${embedder.deferredReason ?? 'unknown'}) — A2 would measure a stub, not real embed+pgvector latency.`,
        );
      }

      const lat: number[] = [];
      let errors = 0;
      for (let i = 0; i < limit; i++) {
        const t0 = Date.now();
        try {
          await curator.check(project.id, subject.id, input, ctx);
          lat.push(Date.now() - t0);
        } catch (err) {
          errors++;
          this.logger.warn(
            `A2 run ${i + 1}/${limit} failed: ${err instanceof Error ? err.message.slice(0, 80) : String(err)}`,
          );
        }
      }
      return this.summarize(
        'NFR-003 A2 Curator check()',
        dbHost,
        limit,
        errors,
        lat,
        A2_GATE_MS,
      );
    } finally {
      await prisma.$disconnect().catch(() => undefined);
      await app.close();
    }
  }

  /** Resolve the seeded fixture workspace + user → ActorContext (test branch). */
  private async resolveActor(prisma: PrismaService): Promise<ActorContext> {
    const ws = await prisma.workspace.findFirst({
      where: { name: 'NFR Latency Fixture' },
    });
    const user = await prisma.user.findFirst({
      where: { email: 'nfr-actor@test.local' },
    });
    if (!ws || !user) {
      throw new ServiceUnavailableException(
        'NFR fixture (workspace/user) not found on the test branch — run seed:nfr.',
      );
    }
    return {
      workspaceId: ws.id,
      actorId: user.id,
      actorEmail: user.email,
      role: 'Admin',
    };
  }

  private summarize(
    nfr: string,
    dbHost: string,
    attempted: number,
    errors: number,
    lat: number[],
    gateMs: number,
  ): NfrProbeResponse {
    const sorted = [...lat].sort((a, b) => a - b);
    const stats = {
      min: sorted.length ? sorted[0] : 0,
      p50: pct(sorted, 50),
      p95: pct(sorted, 95),
      p99: pct(sorted, 99),
      max: sorted.length ? sorted[sorted.length - 1] : 0,
    };
    const verdict: 'PASS' | 'FAIL' =
      sorted.length > 0 && stats.p95 < gateMs ? 'PASS' : 'FAIL';
    this.logger.log(
      `${nfr} · host=${dbHost} · samples=${sorted.length}/${attempted} · p50=${stats.p50} p95=${stats.p95}ms · gate ${gateMs}ms → ${verdict}`,
    );
    return {
      nfr,
      dbHost,
      attempted,
      samples: sorted.length,
      errors,
      stats,
      gateMs,
      verdict,
      perCallMs: sorted,
    };
  }
}
