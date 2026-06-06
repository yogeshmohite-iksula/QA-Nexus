// QA Nexus PM1 — NFR-003 latency probe request/response schemas (Day-3 Task 5).
//
// Backs the admin-only POST /admin/nfr/{a1,a2} endpoints (Render-side,
// test-branch-targeted) that measure Composer (A1) + Curator (A2) latency from
// a host co-located with Neon. Gates per PM1_PRD §10 NFR-003: A1 p95 < 10s,
// A2 p95 < 500ms.

import { z } from 'zod';

export const NfrProbeRequest = z.object({
  /** Number of measured iterations (default a1=5, a2=10). */
  limit: z.number().int().min(1).max(50).optional(),
  /** Inter-call spacing in ms (A1 only — ≥6000 dodges the Groq free-tier RPM
   *  cascade; ignored by A2 which makes no LLM calls). */
  sleepMs: z.number().int().min(0).max(30000).optional(),
});
export type NfrProbeRequest = z.infer<typeof NfrProbeRequest>;

export const NfrProbeStats = z.object({
  min: z.number(),
  p50: z.number(),
  p95: z.number(),
  p99: z.number(),
  max: z.number(),
});
export type NfrProbeStats = z.infer<typeof NfrProbeStats>;

export const NfrProbeResponse = z.object({
  /** Human label, e.g. "NFR-003 A2 Curator check()". */
  nfr: z.string(),
  /** Neon host the probe actually ran against (must be the test branch). */
  dbHost: z.string(),
  attempted: z.number().int(),
  samples: z.number().int(),
  errors: z.number().int(),
  stats: NfrProbeStats,
  gateMs: z.number(),
  verdict: z.enum(['PASS', 'FAIL']),
  perCallMs: z.array(z.number()),
});
export type NfrProbeResponse = z.infer<typeof NfrProbeResponse>;
