# M5 NFR Baseline — Pilot prep (started Day-1 Tue 2026-06-02)

> NFR latency budgets per PM1_PRD §10 (NFR-001 page load, NFR-002 API latency,
> NFR-003 agent latency), measured under representative local load. Pulled
> forward from the pilot Day-4 plan. Repo HEAD at measurement: `a635fff` + Day-1
> branch `docs/be-day-1-pilot-push`.

**Status:** NFR-002 (public endpoints) measured Day-1. NFR-002 (authenticated) +
NFR-001 + NFR-003 scoped + scripted, deferred to Wed AM (need a session cookie /
running FE / Groq budget respectively). Tooling is permanent + reusable.

---

## NFR-002 — API latency

**Budget (PM1_PRD §10 NFR-002):** p50 < 200 ms, p95 < 500 ms (excluding LLM calls).

**Tool:** `scripts/nfr-api-latency.mjs` (parameterized: `BASE_URL`, `N`, `COOKIE`,
`--auth`). Reusable against local **and** deployed Render. N=100 sequential/endpoint.

### Measured Day-1 (public endpoints, local, N=100) — ✅ both PASS

| Endpoint       | p50 ms    | p95 ms | p99 ms | errors | verdict |
| -------------- | --------- | ------ | ------ | ------ | ------- |
| `/health`      | **1.4**   | 5.2    | 24.3   | 0      | PASS    |
| `/health/deep` | **120.4** | 133.6  | 232.3  | 0      | PASS    |

- `/health` is liveness-only (status/version) → sub-2ms p50, as expected.
- `/health/deep` does real work each call (Neon query + R2 head + embedding
  snapshot + quota) → 120ms p50 is meaningful and comfortably within the 200ms
  budget; the 232ms p99 is the Neon scale-to-zero cold-query tail.

### Deferred to Wed AM — authenticated endpoints (need a session cookie)

Real route shapes (verified Day-1 — **not** the flat `?project=RET` forms; routes
are project-scoped under `/api/projects/:id/…`):

`/api/projects` · `/api/projects/iksula-returns` ·
`/api/projects/iksula-returns/{test-cases,requirements,defects,runs,reports}` ·
`/llm/providers`

**Wed AM procedure:** sign in via the dev console-stub magic link (finding F-7 —
the link is logged, not emailed), capture the `better-auth.session_token` cookie,
then: `COOKIE="better-auth.session_token=…" node scripts/nfr-api-latency.mjs --auth`.

---

## NFR-001 — Page load latency

**Budget (PM1_PRD §10 NFR-001 / Rule 12):** target p50 < 1.5 s, p95 < 3 s FCP/LCP.

**Deferred to Wed AM** — needs the FE dev server (`:3000`) **and** an authenticated
session: every `(app)/**` route redirects to sign-in unauthenticated, so the target
(authenticated app pages) can't be measured without a session. Script will be
written + run Wed against the live FE (not shipped untested tonight).

**Corrected route list** (the Day-2 brief used Next.js route-group syntax `/(app)/…`
which never appears in the URL — route groups are path-transparent). Real URLs to
measure (8), pending confirmation each is built:

- `/home` · `/projects` · `/test-cases` · `/requirements`
- `/projects/iksula-returns/defects` · `/projects/iksula-returns/defects/DEF-RET-2104`
- `/dashboard/executive` · `/admin/settings`

**Method:** Playwright, 20 cold loads/route, capture p50/p95/p99 FCP + LCP via the
`PerformancePaintTiming` + `LargestContentfulPaint` observers.

---

## NFR-003 — Agent latency

**Budget (PM1_PRD §10 / ADR-019):** Composer A1 p95 < 10 s · Curator A2 p95 < 500 ms
· Sherlock A4 p95 < 15 s.

**Deferred** — exercising the agents burns Groq RPD, which today's pilot-push rules
forbid (preserve budget for Wed-approved agent-latency runs OR measure against a
production-warm deployed Render instance). The new `scripts/ac042-smoke.mjs` (1
defect, ~4 Groq calls) is the cheapest Sherlock-A4 latency probe when budget allows.

---

## Cold-start (observed, informational)

API boot (`nest start` → `Nest application successfully started` → listening): ~3-4 s
cold (Prisma connect ~1 s + embedding model warm ~1.2 s). Neon first-query cold
latency ~1.2 s (scale-to-zero), then warm (~10 ms, see `/health` p50).

---

_Started Day-1 2026-06-02 (BE+1). NFR-002 public baseline GREEN. Remaining NFRs
scripted/scoped for Wed AM completion._
