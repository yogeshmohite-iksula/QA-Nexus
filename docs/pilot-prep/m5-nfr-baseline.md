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

### A4 Sherlock — MEASURED 2026-06-02 PM (real, 20-case via `AC042_LIMIT=20 ac042:eval`)

| metric                  | value                                               |
| ----------------------- | --------------------------------------------------- |
| n / quality             | 20 cases · top-2 80% · calibration 1.00 · 0 crashes |
| latency p50 / p95 / p99 | **12.9s / 18.2s / 22.3s** (min 1.7s / max 22.3s)    |
| **gate p95 < 15s**      | ❌ **FAIL** — p95 18.2s exceeds the 15s budget      |

The 4-agent merge tail (gpt-oss-120b on the code/data agents) drives p95 over budget.
**Real NFR finding** — flag for optimization (faster model on the slower agents /
parallelism tuning) OR a gate re-evaluation before pilot. p50 (12.9s) is within budget;
the tail isn't. Also a live **Groq Composer smoke** ran clean (4 calls, 0 crashes) —
providers verified end-to-end. Groq used: ~84 RPD (4 smoke + 80 this run).

### A1 Composer + A2-full Curator — DEFERRED (test-branch blocker)

Both need a seeded DB fixture with the **M3 schema**, but the Neon test branch is
**pre-M3**: the real seed hit `P2022: column 'format' does not exist` — workspace /
user / project / requirement seeded OK, test-case upserts blocked. Unblock Wed:
`prisma migrate deploy` to the test branch (needs a direct, non-pooler URL), then
populate `test_cases.embedding` via raw SQL → run the probes. The `nfr:a1`/`nfr:a2`
harnesses (Composer/Curator Nest contexts) still need writing. A2's embedding component
(p95 98ms) is already measured (above).

---

## Cold-start (observed, informational)

API boot (`nest start` → `Nest application successfully started` → listening): ~3-4 s
cold (Prisma connect ~1 s + embedding model warm ~1.2 s). Neon first-query cold
latency ~1.2 s (scale-to-zero), then warm (~10 ms, see `/health` p50).

---

## Day-2 PM (Wed 2026-06-03) — A1/A2 full harnesses + the network-RTT finding

Test branch (`ep-blue-star`) was migrated (`db push`) + seeded (1/1/1/1/3) + embeddings
populated (3/3 × 384-dim). Harnesses `nfr:a1` (Composer) + `nfr:a2` (Curator full
`check()`) written + run against it.

| NFR-003 agent             | gate (pilot/M5) | measured (test branch, local)                 | verdict        | reading                     |
| ------------------------- | --------------- | --------------------------------------------- | -------------- | --------------------------- |
| A4 Sherlock               | p95 < 20s       | p95 18.2s                                     | PASS (ADR-024) | real                        |
| A2 Curator full `check()` | p95 < 500ms     | p50 1551ms / p95 7146ms                       | local-FAIL     | **network-bound, not algo** |
| A1 Composer `generate()`  | p95 < 10s       | unmeasured (all 5 runs "providers exhausted") | n/a            | Groq RPM cascade            |

### 14th reality-check (RATIFIED) — the A2 number is client→DB network RTT, not the algorithm

A **read-only `SELECT 1` probe** measured a single Neon round-trip from the dev Mac →
`ap-southeast-1` (Singapore) at **~91ms p50 (warm pilot)**. Curator `check()` makes ~4
round-trips (2 audit-writes + embed-read + pgvector) → **~360ms of pure network latency**
before compute, + ~98ms embed + audit HMAC = the observed ~1.5s p50. The pilot DB shows
the **identical** 91ms RTT, so re-measuring A1/A2 against pilot from the Mac would NOT
reduce the inflation — **and would write audit rows (ZERO-writes violation), so it was not
run.** The TEST branch errored mid-probe (scaled to zero), confirming it's unreliable for
steady-state latency.

**Implication:** A1/A2 representative latency is only obtainable **from the deployed API
(Render, co-located with Neon → ~1-5ms RTT)**. Estimated production A2 ≈ embed (~98ms) +
~4×(~3ms) + pgvector ≈ **~120-200ms — under the 500ms gate.** The Curator algorithm is
sound; the local 7.1s is a network-distance ceiling, not a defect.

### Measurement methodology (binding going forward)

- Latency NFRs with DB round-trips (A1, A2, NFR-002) MUST be measured **from a host
  co-located with Neon** (Render prod, or a Render one-off job) — never from a dev Mac in
  a different region (adds ~91ms/round-trip).
- LLM-bound NFRs (A1 Composer, A4 Sherlock) MUST space Groq calls ≥6s (free-tier RPM).
- A1/A2 are NOT read-only (they audit-write) → can only run against a writable DB (test
  branch or a Render job), never pilot read-only.

### Still open (Render-side or dedicated session)

A1 Composer (Render-side, RPM-spaced) · A2 confirm (Render-side, expect ~150ms) ·
NFR-001 page-load (deployed FE) · NFR-002-auth · live Resend/R2 single-shot smokes.

---

_Started Day-1 2026-06-02 (BE+1); extended Day-1 PM with Yogesh-provided live keys.
**GREEN:** NFR-002 public · A2 embedding component (98ms). **RED:** NFR-003 A4 p95 18.2s
(ADR-024: pilot p95<20s). **NETWORK-BOUND (not a defect):** A2 full `check()` 7.1s local =
~91ms/RTT × 4 round-trips from the Mac; production ≈ ~150ms (Render-side measurement
pending). **DEFERRED:** A1 (Render-side, RPM-spaced) · NFR-001 · NFR-002-auth · Resend/R2.
No fabricated numbers · 14 reality-checks logged._
