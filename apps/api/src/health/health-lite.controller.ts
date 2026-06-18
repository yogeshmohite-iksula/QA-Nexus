// QA Nexus PM1 — HealthLiteController.
//
// The canonical keep-alive target. Added Day-32 (2026-06-12) during the Neon
// free-tier compute incident as a PROVABLY DB-free endpoint *by construction* —
// this controller injects NOTHING (no PrismaService, no service of any kind),
// so it can never touch Postgres and therefore never wakes Neon. Operators
// point UptimeRobot / Render health checks here.
//
// (The existing GET /health is also memory-only, but it lives on a controller
// that injects PrismaService/Embedding/LLM/R2 for the /health/deep readout;
// this one has a zero-dependency constructor so DB-freeness is structural, not
// just "the handler happens not to call the injected client".)
//
// NOTE: neither /health nor /health/lite was the cause of the Neon CU-hr cap —
// the real driver was the 24/7 reports-refresh cron (now window-gated). This
// endpoint is belt-and-suspenders: a single, clearly-named, guaranteed-clean
// keep-alive target.
//
// Public route (no @UseGuards) — keep-alive probes must not require auth.

import { Controller, Get } from '@nestjs/common';

@Controller('health/lite')
export class HealthLiteController {
  /** Memory-only liveness probe. Returns in <1ms; no I/O, no DB query. */
  @Get()
  lite(): { status: 'ok'; uptime: number; ts: string } {
    return {
      status: 'ok',
      uptime: process.uptime(),
      ts: new Date().toISOString(),
    };
  }
}
