# Runbook — Render-side NFR latency measurement (A1/A2/NFR-002)

> Thu Day-3 first task. Resolves the **14th reality-check**: dev-Mac → Neon (Singapore)
> RTT is ~91ms/round-trip, so DB-round-trip-bound NFRs (Composer A1, Curator A2,
> authenticated NFR-002) measured locally are network-inflated, not representative. The
> Render API runs **co-located with Neon** (~1-5ms RTT) → measure from there.

## §1 — Why local numbers don't count

| metric                        | local (Mac→Neon SG)       | Render (co-located) |
| ----------------------------- | ------------------------- | ------------------- |
| 1 round-trip                  | ~91 ms (`SELECT 1` probe) | ~1-5 ms             |
| A2 `check()` (~4 round-trips) | ~1.5s p50 / 7.1s p95      | est. **~120-200ms** |

A2's local 7.1s is **network distance**, not the algorithm. The gate (p95<500ms) is only
meaningfully testable from Render.

## §2 — Options (pick one)

- **(a) Render shell** — `render ssh` if available on the service tier. Run the existing
  `nfr:a1` / `nfr:a2` harnesses directly. Fast, but verify Free/Hobby tier allows SSH.
- **(b) Render one-off job** — `render.yaml` `jobs:` entry running the harness. Clean +
  repeatable; needs a deploy + a job trigger.
- **(c) Admin-only NFR endpoint (RECOMMENDED)** — least config, fastest iteration: add
  `POST /admin/nfr/a1` + `POST /admin/nfr/a2` to NestJS, trigger from the Mac via curl
  with the admin bearer/session. The DB round-trips happen **Render→Neon (co-located)**;
  the network latency from the Mac is only to the API (one hop), not multiplied per
  DB-round-trip.

## §3 — Recommended impl (Option c)

- New `apps/api/src/nfr/nfr.controller.ts`, guarded by `@Roles('Admin')` + a NODE_ENV /
  `NFR_PROBE_ENABLED` flag (never exposed in normal prod).
- Body: `{ limit?: number, sleepMs?: number }`. Response: `{ p50, p95, min, max, count, errors }`.
- A1 endpoint wraps `ComposerService.generate()` over a seeded fixture requirement;
  **spaces Groq calls ≥6s** (`sleepMs` default 6000) to dodge the free-tier RPM cascade
  (the A1 local failure mode).
- A2 endpoint wraps `CuratorService.check()` over the seeded fixture (no Groq).
- **Fixture:** seed the NFR fixture on the **pilot DB is NOT allowed** (ZERO writes).
  Either (i) seed it on a Render-reachable test branch + point the endpoint's Prisma at
  it, or (ii) measure against an existing pilot project read-path that does NOT write —
  but A1/A2 audit-write, so (i) is required. Decide Thu before coding.
- Guard: the endpoint must target a **writable test DB**, never pilot (reuse the
  `host(DATABASE_URL)==host(TEST_DATABASE_URL)` gate from the local harnesses).

## §4 — Thu execution plan

| time (IST)  | step                                                                |
| ----------- | ------------------------------------------------------------------- |
| 09:30-10:30 | implement `/admin/nfr/{a1,a2}` (Option c) + the test-DB safety gate |
| 10:30-11:00 | push → Render auto-deploy; verify the endpoint is up + guarded      |
| 11:00-11:30 | trigger A1 + A2 via curl (admin token); capture p50/p95             |
| 11:30-12:00 | update `m5-nfr-baseline.md` with real **production** numbers        |

## §5 — Quota / safety

- Groq: A1 5 calls (6s-spaced) + A2 0 = ~5 calls. Negligible.
- Endpoint behind admin guard + a feature flag; **never public**; targets a writable test
  DB only (never pilot — ZERO-writes rule + `directUrl` gotcha both apply).
- $0 gate intact.

## §6 — Cross-references

- `docs/pilot-prep/m5-nfr-baseline.md` (§"network-RTT finding" + binding methodology).
- `apps/api/test/nfr-a1-latency.ts` / `nfr-a2-latency.ts` (the harness logic to lift into
  the endpoints).
- `.claude/memory/feedback_prisma_directurl_gotcha.md` (migration-target safety).
- ADR-024 (A4 pilot vs GA gate — A1 may need a companion if it FAILs warm too).

---

_Written Day-2 (Wed 2026-06-03, BE+1) as Thu Day-3 prep. The Render-side measurement is
the single clean unblock for representative A1/A2/NFR-002 numbers._
