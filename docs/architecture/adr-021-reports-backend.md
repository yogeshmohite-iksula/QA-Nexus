# ADR-021: Reports backend — flexible query API, hybrid pre-compute + lru-cache, three-track export

- **Status:** **Ratified** (Day-23 2026-05-20 11:50 IST by Yogesh + BE+1 + MAIN, after PR #179/#184/#187 merge wave landed; PR #186 wire-up resolves separately under BE+1). All 5 sub-decisions ratified as drafted; 2 amendments adopted (cron 02:30 IST + `is_stale` column); namespace convention `qa_nexus.<domain>.<event>` adopted as binding M5+ contract; sequencing risk locked (ADR-020 Day-23 wire-up merges before ADR-021 implementation migration); 3 open questions all deferred to M6 per pre-positions. Implementation may proceed Day-23 PM after PR #186 wire-up lands.
- **Date:** 2026-05-19 (drafted) · 2026-05-20 (ratified)
- **Deciders:** Yogesh Mohite (Admin), BE+1 (implementer), MAIN (planner)
- **Related:** PM1_PRD §6 (Reports + Executive Dashboard scope) · PM1_ERD §TB-016 `rca_report` · PM1_UI_v2 Redesign Frame F23 Reports Studio v2 + F25 Executive Dashboard v2 · ADR-009 (pnpm + sharp Render deploy pattern — same stack constraint applies) · ADR-010 (pdf-parser choice — pdfkit already in stack for emitter, this ADR reuses it) · ADR-015 (runtime LLM config bridge — config-token pattern reused for report kinds) · ADR-020 (Jira sync architecture, ratified Day-22 — Reports may surface synced Jira ticket data)
- **Supersedes:** none
- **Superseded by:** none

---

## Context

PM1 M5 ships two report-shaped surfaces:

- **F23 Reports Studio** — authoring surface for QA Lead + Admin. Users define a report (kind + filters + time range), preview the rendered view, save as a named template, schedule recurring runs, share via signed URL.
- **F25 Executive Dashboard** — read-only KPI grid for QA Lead + Admin (and pilot stakeholders). Live tiles: cycle pass rate, defect age distribution, agent-cost-per-defect, run throughput, Sherlock top-2 hit rate.

Both surfaces hit the **same backend service** — F25 is a fixed set of pre-defined "report kinds", F23 lets users compose new ones from the same building blocks. Today that backend has **zero design**: no `ReportsService` skeleton, no schema for report definitions, no cache strategy, no export path. BE+1 needs this design ratified Day-23 AM before starting implementation.

Five coupled decisions need locking:

1. **Query API shape** — single endpoint with a typed-discriminator body, or one endpoint per report kind?
2. **Aggregation layer** — pre-compute KPIs to a denormalized table vs query the live event tables on demand?
3. **Cache strategy** — per-tenant memoization at what layer + with what eviction discipline? (Redis is ban-list, so this is in-process.)
4. **Time-range query patterns** — what windows are first-class, and how do "sprint" + "rolling" intersect with the canonical `sprint_current()` SQL helper?
5. **Export endpoints** — three target formats (CSV, PDF, JSON); which library per format, and where does the trade-off between tabular-fast (pdfkit) vs designed-template (Playwright HTML→PDF) sit?

Binding constraints:

- **Hard Rule 1 ($0/month)** — Neon CU-hr budget already at ~82/100 entering Day-22. Reports CANNOT be allowed to bring Neon over 90 sustained. Heavy queries must be either cached or pre-computed.
- **Hard Rule 5 (stack lock)** — Redis / Valkey / Memcached / BullMQ all ban-list. In-process cache only. `@nestjs/schedule` for pre-compute cron.
- **Hard Rule 7** — every state-changing op writes to the HMAC-SHA256 chained `audit_log`. Saving a report definition + sharing a signed URL both qualify.
- **Render Free dyno** — 512MB heap ceiling; we use ~200MB steady-state per Day-18 measurement. In-process cache budget ≤ 50MB.
- **ADR-020 cross-cut** — Reports may surface synced Jira ticket data, but agents access `jira_issue` rows the same way Reports does. No special Jira REST call from Reports.

## Decision

### 1. Query API shape — single `POST /api/reports/run` endpoint with discriminated-union body

**Decision:** ONE endpoint, body is a Zod-discriminated-union on `kind`. Spec is the abstraction layer; each `kind` has its own internal SQL + post-processor. Returns a uniform envelope.

```ts
// packages/shared/schemas/reports.schema.ts (NEW)
const ReportKindSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('cycle_pass_rate'), filters: CycleFiltersSchema }),
  z.object({ kind: z.literal('defect_age'), filters: DefectFiltersSchema }),
  z.object({ kind: z.literal('agent_cost'), filters: AgentFiltersSchema }),
  z.object({ kind: z.literal('run_throughput'), filters: RunFiltersSchema }),
  z.object({
    kind: z.literal('sherlock_hit_rate'),
    filters: SherlockFiltersSchema,
  }),
  z.object({
    kind: z.literal('defect_status_flow'),
    filters: DefectFiltersSchema,
  }),
  // M6+: extensible via new kind entries; no API break
]);

const ReportRequestSchema = z.object({
  spec: ReportKindSchema,
  timeRange: z.union([
    z.object({ window: z.enum(['sprint', '7d', '30d', '90d']) }),
    z.object({ start: z.string().datetime(), end: z.string().datetime() }), // ≤365d gated
  ]),
  groupBy: z.enum(['day', 'week', 'sprint']).optional().default('day'),
  exportFormat: z.enum(['json', 'csv', 'pdf']).optional().default('json'),
});

// Response (uniform across all kinds)
const ReportResponseSchema = z.object({
  spec: ReportKindSchema, // echo back what we ran
  timeRange: ResolvedTimeRangeSchema, // start+end after resolving window
  series: z.array(
    z.object({
      // time-bucketed data
      bucket: z.string(), // ISO date OR sprint key
      values: z.record(z.string(), z.number()),
    }),
  ),
  summary: z.record(z.string(), z.number()), // single-figure roll-ups
  generatedAt: z.string().datetime(),
  cacheHit: z.boolean(), // diagnostic; not for prod consumers
  sourceFreshness: z.enum(['live', 'precomputed', 'cached']),
});
```

**Why one endpoint, not many:**

- Authentication / RBAC / audit logging lives in ONE controller method — fewer surfaces to keep in sync (Hard Rule 7 audit chain stays uniform).
- F23 Reports Studio composes the same `ReportRequest` body from a builder UI; F25 Executive Dashboard fires the same body for each tile. One backend code path serves both.
- Adding a new report `kind` in M6 = one Zod entry + one SQL builder + one post-processor. No new route, no new controller, no new docs.

**Why discriminated-union (not `kind: string`):**

- Zod enforces the filter shape per kind at request boundary — `agent_cost` filters validated differently from `defect_age` filters at the schema layer, not in the service.
- TypeScript narrowing in the service layer means `if (spec.kind === 'agent_cost') { spec.filters.modelId }` is type-safe — no `(filters as any).modelId` cast.
- Frontend (F23 builder UI) imports the same Zod schema from `@qa-nexus/shared` — single source of truth for the kind catalog.

### 2. Aggregation layer — hybrid pre-compute + live-query

**Decision:** Three-tier read pipeline. The "right" tier per report kind is chosen by `ReportsService.resolveTier(kind, timeRange)`:

```
┌────────────────────────────────────────────────────────────────────┐
│  TIER 1 — pre-computed (report_aggregate table)                    │
│  - 6-8 most-queried KPIs (cycle pass rate, defect age, agent cost) │
│  - Daily refresh via @nestjs/schedule cron 02:30 IST               │
│  - Event-triggered refresh on `defect.*` / `run.*` WS event burst  │
│  - Freshness: ≤24h (cron) OR ≤5min (event-triggered subset)        │
│  - Use when: F25 dashboard tiles + F23 "stale OK" report kinds     │
├────────────────────────────────────────────────────────────────────┤
│  TIER 2 — live SQL query (no cache)                                │
│  - Custom date ranges + uncommon report kinds                       │
│  - Freshness: live (current-millisecond)                            │
│  - Use when: F23 ad-hoc reports where the user wants today's data  │
│  - CU-hr cost: high; gated by lru-cache (§3) to avoid repeat-burn  │
├────────────────────────────────────────────────────────────────────┤
│  TIER 3 — pre-computed + live delta merge                          │
│  - Tier 1 base + Tier 2 query for "since last cron run"            │
│  - Freshness: live, with TTL caveat in response                     │
│  - Use when: Tier 1 covers >80% of the range; live delta is small  │
│  - Example: 90d cycle pass rate with today included                 │
└────────────────────────────────────────────────────────────────────┘
```

**New schema (M5 migration, additive):**

```sql
CREATE TABLE report_aggregate (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        UUID NOT NULL REFERENCES workspace(id),
  project_id          UUID REFERENCES project(id),               -- NULL = workspace-scoped
  kind                TEXT NOT NULL,                              -- matches Zod discriminator
  bucket_key          TEXT NOT NULL,                              -- 'sprint:42' | '2026-05-19' | '2026-W21'
  bucket_kind         TEXT NOT NULL,                              -- 'sprint' | 'day' | 'week'
  values              JSONB NOT NULL,                             -- {pass: 87, fail: 12, blocked: 3}
  computed_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  source_row_count    INTEGER NOT NULL,                           -- diagnostic; how many event rows aggregated
  is_stale            BOOLEAN NOT NULL DEFAULT false              -- Day-23 ratification Amendment B: event-triggered invalidation marks rows stale; next read OR next cron tick recomputes
);
CREATE UNIQUE INDEX report_aggregate_natural_key
  ON report_aggregate (workspace_id, COALESCE(project_id, '00000000-0000-0000-0000-000000000000'::uuid), kind, bucket_kind, bucket_key);
CREATE INDEX report_aggregate_freshness
  ON report_aggregate (kind, computed_at DESC);
```

**Why hybrid (not all-live + not all-precomputed):**

- All-live: every F25 tile re-runs a window function over the run/defect tables on every dashboard load. With 8 users × 12hr/day, that's ~500 CU-hr/month for the dashboard alone. Blows the Neon free tier ceiling.
- All-precomputed: stale-by-design. Users in F23 Reports Studio expect ad-hoc filters to return today's data, not 24h-old data. Pre-compute alone breaks the F23 UX contract.
- Hybrid: dashboard tiles (the 80% query) hit pre-compute (cheap + stale-OK); ad-hoc F23 queries hit live (expensive but rare). The Tier 3 merge handles the 5% "I want the precomputed history with today included" case without re-running a 90-day query.

**Refresh cron:**

```ts
// apps/api/src/reports/refresh.cron.ts
@Cron('30 2 * * *', { timeZone: 'Asia/Kolkata' })  // 02:30 IST daily — avoids Render Free nightly restart window per Day-23 ratification Amendment A
async dailyRefresh() {
  for (const kind of TIER_1_KINDS) {
    for (const project of activeProjects) {
      await this.refreshAggregate(kind, project.id, { window: '7d' });
      await this.refreshAggregate(kind, project.id, { window: '30d' });
      await this.refreshAggregate(kind, project.id, { window: '90d' });
    }
  }
}

@OnEvent('defect.created') @OnEvent('defect.status_changed')
async invalidateDefectAggregates(event: DefectEvent) {
  // Day-23 Amendment B: mark rows stale (is_stale=true), don't delete.
  // Refresh fires lazily on next read OR at next 02:30 IST cron tick — whichever first.
  // This defers compute cost without losing the stale signal.
  await this.markStale(event.projectId, ['defect_age', 'defect_status_flow']);
  // markStale impl: UPDATE report_aggregate SET is_stale=true WHERE project_id=$1 AND kind=ANY($2)
}
```

### 3. Cache strategy — `lru-cache` in-process, per-Render-dyno, ≤50MB heap

**Decision:** `lru-cache@^11.x` (already MIT-licensed, zero deps, in-stack via existing audit indirect dep). One `LRUCache<string, ReportResponse>` per `ReportsService` instance (= one per Render dyno = one per process). Sized at 50MB heap budget via `sizeCalculation` callback over `JSON.stringify(value).length`.

```ts
// apps/api/src/reports/reports.cache.ts
import { LRUCache } from 'lru-cache';

const TTL_PER_KIND: Record<ReportKind, number> = {
  cycle_pass_rate: 5 * 60_000, //  5min  — high-velocity event-driven data
  defect_age: 15 * 60_000, // 15min  — defects move slower than runs
  agent_cost: 60 * 60_000, //  1hr   — cost data updates per cron only
  run_throughput: 5 * 60_000,
  sherlock_hit_rate: 60 * 60_000,
  defect_status_flow: 15 * 60_000,
};

export const reportsCache = new LRUCache<string, ReportResponse>({
  maxSize: 50 * 1024 * 1024, // 50MB
  sizeCalculation: (value) => Buffer.byteLength(JSON.stringify(value), 'utf8'),
  ttl: 5 * 60_000, // default; per-kind override applied at set()
  ttlAutopurge: true,
  allowStale: false,
});

// Cache key = SHA-256 of canonicalized ReportRequest body + actor.projectId
// (RBAC isolation guarantee — a Lead in Project A can't see cached Project B data)
```

**Why `lru-cache` (not in-house Map):**

- Battle-tested LRU eviction + TTL handling. Re-implementing this in-house = bug surface.
- `sizeCalculation` + `maxSize` together give us the heap-budget guarantee (Hard Rule 5 stack lock — Render Free 512MB ceiling).
- Pre-existing transitive dep (per Day-18 lockfile audit); no new install.

**Why per-dyno (not shared):**

- Hard Rule 5 bans Redis / Valkey / Memcached. No external shared cache layer available.
- Render Free runs ONE dyno (no horizontal scale). "Per-dyno" = "global" in practice.
- If we ever go to multi-dyno (M6+ scale): replace with `lru-cache` + Postgres LISTEN/NOTIFY invalidation (same pattern as ADR-020 §7), NOT Redis.

**Cache key includes `actor.projectId`:** RBAC isolation. A Lead in Project A executing a `cycle_pass_rate` query must NOT receive Project B's cached result. The key salts on project ensure cache hits only within the same RBAC scope.

**Cache invalidation:** event-driven via `@OnEvent('defect.*' | 'run.*' | 'test_case.*')`. On burst events, the cache is purged for affected kinds, not refreshed in-place (avoids stampede on burst).

### 4. Time-range query patterns — four canonical windows + bounded custom range

**Decision:** Four first-class windows ratified for M5:

| Window   | Resolution                                                                                  | Bucket                | SQL helper                                               |
| -------- | ------------------------------------------------------------------------------------------- | --------------------- | -------------------------------------------------------- |
| `sprint` | current active Jira sprint, falls back to `now() - INTERVAL '14 days'` if no Jira connected | per-sprint or per-day | `sprint_current(project_id)` returns `(start, end, key)` |
| `7d`     | rolling 7 days ending now                                                                   | per-day               | `now() - INTERVAL '7 days'`                              |
| `30d`    | rolling 30 days ending now                                                                  | per-day or per-week   | `now() - INTERVAL '30 days'`                             |
| `90d`    | rolling 90 days ending now                                                                  | per-week              | `now() - INTERVAL '90 days'`                             |

**Custom range:** `{ start, end }` ISO datetime. Gated by:

- `end - start ≤ 365 days` (Hard Rule 1 cost protection — beyond 365d ALWAYS hits pre-compute, never live SQL)
- `end ≤ now()` (no future-dated reports; defends against time-skew bugs)
- `start ≥ workspace.created_at` (no point querying before the workspace existed)

**Why these four (not "last week" + "last month" + "MTD" + "YTD" too):**

- 4 windows × 6-8 kinds = 24-32 pre-compute entries per project. Manageable storage + manageable refresh cron load.
- Adding more windows = combinatorial table growth + cron runtime. M6 if pilot usage data shows >2 of "last week / MTD / YTD" demands.
- "Sprint" is the QA-native time unit — every pilot user thinks in sprints; the canonical mapping to Jira sprints (via `jira_issue.sprint_id`, M5 schema) is the integration point.

**`sprint_current()` SQL helper:**

```sql
-- Resolves the current sprint for a project. Falls back to fixed window
-- when no Jira sprint is active (no Jira connection, or all sprints closed).
CREATE OR REPLACE FUNCTION sprint_current(project_uuid UUID)
RETURNS TABLE(start_ts TIMESTAMPTZ, end_ts TIMESTAMPTZ, sprint_key TEXT)
LANGUAGE plpgsql STABLE AS $$
BEGIN
  RETURN QUERY
  SELECT ji.sprint_start, ji.sprint_end, ji.sprint_key
    FROM jira_issue ji
   WHERE ji.project_id = project_uuid
     AND ji.sprint_active = true
   LIMIT 1;
  IF NOT FOUND THEN
    RETURN QUERY SELECT now() - INTERVAL '14 days', now(), 'fallback-14d'::text;
  END IF;
END$$;
```

(Helper added in M5 migration alongside `report_aggregate`. `jira_issue.sprint_*` columns also M5-added per ADR-020.)

### 5. Export endpoints — three-track strategy (CSV / PDF / JSON)

**Decision:** Three export tracks; the track is chosen per report kind, NOT globally:

| Track          | Library                                                | Trigger                                             | Best for                                          |
| -------------- | ------------------------------------------------------ | --------------------------------------------------- | ------------------------------------------------- |
| JSON           | native (Zod schema serialized)                         | `?format=json` default                              | API consumers, F23 preview, F25 dashboard         |
| CSV            | `csv-stringify@^6.x` (zero-dep, AsyncIterator-safe)    | `?format=csv`                                       | Tabular reports, BI tool import (Looker, Tableau) |
| PDF (tabular)  | `pdfkit@^0.15.x` (already in ADR-010 stack)            | `?format=pdf` AND `report_kind.layout = 'tabular'`  | Audit reports, compliance exports                 |
| PDF (designed) | Playwright HTML→PDF (already deployed for visual gate) | `?format=pdf` AND `report_kind.layout = 'designed'` | F23 published reports, executive PDFs             |

**Layout assignment per kind (locked Day-22; M6 may revise):**

| Report kind          | Layout                                            |
| -------------------- | ------------------------------------------------- |
| `cycle_pass_rate`    | designed (template — KPI tiles + trend chart)     |
| `defect_age`         | designed (Sankey diagram via embedded SVG)        |
| `agent_cost`         | tabular (cost-per-agent-per-day grid)             |
| `run_throughput`     | designed (timeline chart)                         |
| `sherlock_hit_rate`  | tabular (defect × hit_rank matrix)                |
| `defect_status_flow` | designed (state-machine diagram via embedded SVG) |

**Why two PDF tracks:**

- `pdfkit` generates 5-page tabular PDFs in 200-400ms; well below the 30s Render request timeout. Cheap to scale.
- Playwright HTML→PDF takes 2-4s (browser launch + render) but supports the designed-template path with full CSS Grid + SVG + the design tokens already in `globals.css`. Avoids hand-coding pdfkit layout primitives for designed reports.
- Tabular reports DON'T need Playwright (overkill); designed reports DON'T fit pdfkit's primitive model (would require re-implementing CSS Grid in pdfkit).

**Output storage:** all exports persist to R2 (per ADR-005 R2 storage). Signed URLs returned to caller with 7-day expiry. Re-generation re-uses the same `report_export.id` (idempotent — same input → same R2 key via content-hash).

**New schema (M5 migration, additive):**

```sql
CREATE TABLE report_export (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspace(id),
  spec_hash     TEXT NOT NULL,                  -- SHA-256 of canonicalized ReportRequest body
  format        TEXT NOT NULL,                  -- 'csv' | 'pdf' | 'json'
  layout        TEXT,                            -- 'tabular' | 'designed' (only for PDF)
  r2_key        TEXT NOT NULL,                  -- path in R2 bucket
  byte_count    BIGINT NOT NULL,
  generated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  generated_by  UUID NOT NULL REFERENCES user(id),
  expires_at    TIMESTAMPTZ NOT NULL            -- signed-URL expiry; cleanup cron purges after this
);
CREATE UNIQUE INDEX report_export_dedup
  ON report_export (workspace_id, spec_hash, format, COALESCE(layout, 'na'));
CREATE INDEX report_export_expiry_purge
  ON report_export (expires_at) WHERE expires_at < now();
```

### 6. Postgres LISTEN/NOTIFY channel naming convention (BINDING M5+)

_(Added Day-23 ratification per BE+1 review §3 — applies to ALL future LISTEN/NOTIFY channels across all domains.)_

**Convention:** `qa_nexus.<domain>.<event>` — three-segment dot-separated namespace.

| Source                                          | Channel name                                                                                               |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Jira webhook receiver (PR #186)                 | `qa_nexus.webhook.jira.received` _(M6 rename; legacy `webhook_received` retained M5 — see migration plan)_ |
| Report cache invalidate (this ADR M6 extension) | `qa_nexus.cache.report.invalidate`                                                                         |
| Defect change events (M6+)                      | `qa_nexus.defect.changed`                                                                                  |
| Run state change (M6+)                          | `qa_nexus.run.state_changed`                                                                               |
| Slack webhook receiver (M6 candidate)           | `qa_nexus.webhook.slack.received`                                                                          |
| Stripe webhook receiver (M7 candidate)          | `qa_nexus.webhook.stripe.received`                                                                         |

**Rationale:**

- Collision-free namespace across N domains × M event types
- `qa_nexus.` prefix prevents collision with shared-DB consumers (M6+ multi-tenant)
- Grep-able + visually consistent
- Matches the `pg-listen` `.notifications.on('<channel>', ...)` API without escaping

**Migration plan for legacy `webhook_received` (PR #186):**

- **M5: NO RENAME.** Keep `webhook_received` as-is to avoid churn on already-shipped scaffold. ADR-020 §7 channel name reconciliation moves from "amend ADR to match shipped code" to "amend ADR to reference the M6 rename target".
- **M6 hygiene followup:** rename `webhook_received` → `qa_nexus.webhook.jira.received` via one trigger function recreation migration + one constant rename in `webhook-processor.service.ts`. Tracked at `docs/m6/m6-hygiene-followups.md`.

**Forbidden patterns (visual review FAIL triggers from Day-23+):**

- Channel names without the `qa_nexus.` prefix (collision risk)
- Two-segment names (`<domain>.<event>` without root prefix)
- Underscore-separated bare names (`webhook_received` style) — LEGACY ONLY; all new channels MUST use the namespaced convention
- Channel name containing the project key (e.g., `qa_nexus.RET.webhook.received`) — channels are per-instance, not per-project

**Cross-references:** `feedback_jira_webhook_20s_budget.md` (top-section addendum forthcoming) · `docs/m6/m6-hygiene-followups.md` (legacy rename entry) · BE+1 PR #183 review comment id `4487421841` §3.

## Consequences

- **Predictable Neon CU-hr budget** — Tier 1 pre-compute absorbs the 80% query mass (F25 dashboard tiles); Tier 2 live queries are rate-limited by lru-cache hit rate. Worst-case 20% above Day-22 baseline (~98/100 CU-hr month-end projection).
- **F25 dashboard responsive** — pre-compute means every tile loads in <100ms (single indexed query against `report_aggregate`). No spinner-fatigue.
- **F23 Reports Studio flexible** — discriminated-union API lets the builder UI compose any kind with any filter combo without backend changes; M6 adds new kinds via a Zod entry + SQL builder pair.
- **Export consistency** — three tracks × per-kind layout assignment gives users PDFs that look like the F25 frame design AND CSVs that import cleanly into BI tools. R2 storage + content-hash idempotency means re-exports are free.
- **Cache memory bounded** — 50MB lru-cache cap + per-dyno isolation = Render Free heap pressure stays predictable. Multi-dyno migration (M6+) needs only the invalidation path swapped.
- **Audit chain complete** — every report save, every share, every export writes to `audit_log` via the same `AuditService` used by ADR-020 (Hard Rule 7).

## Alternatives considered

- **One endpoint per report kind** — rejected. Would require N controller methods, N RBAC checks, N audit-write call sites. Combinatorial maintenance cost; no architectural gain.
- **All-live, no pre-compute** — rejected. Neon CU-hr math (see §2) shows this blows Hard Rule 1 ceiling.
- **All-precomputed, no live tier** — rejected. F23 Reports Studio ad-hoc query UX requires "today's data" freshness; pre-compute alone breaks the contract.
- **In-house cache (Map + setInterval eviction)** — rejected. Re-implementing LRU + TTL + size-aware eviction is a bug surface; `lru-cache` is the de facto standard.
- **GraphQL or tRPC for the query surface** — rejected. Adding a new transport for ONE service violates "boring tech" principle (Hard Rule 5 spirit). REST + Zod schemas match the rest of the API surface.
- **OpenSearch / Elasticsearch for time-series** — rejected. Postgres time-bucketed aggregates handle the M5 query patterns; introducing a second data store doubles ops + cost.
- **MaterializedView per report kind** — rejected for M5; revisit M6. MVs are good for "always-fresh" pre-compute but the refresh-on-write semantics (`REFRESH MATERIALIZED VIEW CONCURRENTLY`) require per-kind tuning + risk N×refresh-cost during burst events. Cron + on-event-invalidation pattern is simpler for M5 scale.
- **Server-side report PDF generation in a separate worker** — rejected. Render Free single-dyno; Playwright launch cost (2-4s) is acceptable inline given the lru-cache absorbs repeat requests.

## Ratification decisions (Day-23 2026-05-20 11:50 IST)

The 5 sub-decisions + 2 amendments + 3 open questions filed at draft time + the namespace convention surfaced by BE+1 review comment id `4487421841` were decided as follows by Yogesh + BE+1 + MAIN. Decisions are binding for MS5 Reports backend implementation.

**5 sub-decisions — all RATIFIED as drafted:**

1. **Single endpoint with Zod-discriminated-union** — RATIFIED. BE+1 cost estimate: 4-6 hr (controller + Zod variants + `ReportResponse` envelope in `@qa-nexus/shared` + RBAC guard). Zero Neon CU-hr impact.
2. **Hybrid Tier-1/Tier-2/Tier-3 aggregation** — RATIFIED. BE+1 owns Tier-1 kinds list cross-referenced against F25 dashboard tile spec (Day-23 PM scope).
3. **`lru-cache@^11.x` in-process @ 50MB heap, RBAC-salted** — RATIFIED. Per-kind TTLs ratified as drafted (5 min cycle_pass_rate / 15 min defect_age / 1 hr agent_cost / 5 min run_throughput / 1 hr sherlock_hit_rate / 15 min defect_status_flow). Re-evaluate `agent_cost = 1hr` if pilot users report stale-cost surprise.
4. **Four canonical windows + bounded custom range (≤365d)** — RATIFIED. `sprint_current()` PL/pgSQL helper depends on `jira_issue.sprint_*` columns from ADR-020 wire-up (see Sequencing risk below).
5. **Three-track export + per-kind layout assignment** — RATIFIED as drafted in §5 table. R2 storage + content-hash idempotency + 7-day signed-URL expiry locked.

**2 amendments — both ADOPTED:**

- **Amendment A** (refresh cron 02:00 → 02:30 IST): adopted to avoid Render Free dyno nightly restart window. §2 cron block updated in-place above.
- **Amendment B** (`is_stale BOOLEAN NOT NULL DEFAULT false` on `report_aggregate`): adopted. Schema patched in §2 above. Invalidation logic narrative updated to `is_stale=true` semantics (refresh fires lazily on next read OR next 02:30 IST cron tick — defers compute cost without losing the stale signal).

**§6 namespace convention — ADOPTED as BINDING M5+:**

`qa_nexus.<domain>.<event>` namespace for ALL future LISTEN/NOTIFY channels. Legacy `webhook_received` from PR #186 retained M5; M6 hygiene followup recreates the trigger under `qa_nexus.webhook.jira.received` (tracked at `docs/m6/m6-hygiene-followups.md`). 4 forbidden patterns codified in §6.

**3 open questions — all DEFERRED to M6 per pre-positions:**

1. **Report scheduling — M5 or M6?** → **DEFERRED to M6.** F23 spec includes "schedule recurring runs"; cron infra exists but the scheduling UI + state machine adds ~1 day BE+1 estimate. M5 budget already absorbed by ADR-020 wire-up + Reports backend implementation. M6 picks it up.
2. **Shared report state scope — workspace or project?** → **PROJECT-SCOPED.** Matches RBAC isolation pattern (ADR-020 §4 Composer/Curator/Sherlock data access; ADR-021 §3 cache key `actor.projectId` salting).
3. **Embed-in-Slack — M5 or M6?** → **DEFERRED to M6.** Pilot stakeholder demand uncertain; surfaces only if pilot users request post-launch. Hygiene tracked at `docs/m6/m6-hygiene-followups.md`.

**Sequencing risk locked (BE+1 review §4):**

ADR-021's `sprint_current(project_uuid)` PL/pgSQL helper depends on `jira_issue.sprint_id` + `jira_issue.sprint_name` columns added by ADR-020 Day-23 wire-up (successor PR to #186 PARTIAL). **Migration merge order MATTERS:**

1. **First:** ADR-020 Day-23 wire-up PR — adds `jira_issue.sprint_*` columns
2. **Second:** ADR-021 implementation PR — adds `report_aggregate` table + `sprint_current()` helper

If reversed, `prisma migrate deploy` throws `column does not exist`. BE+1 acknowledges via review comment + this section.

**Implementation gate:** BE+1 may proceed Day-23 PM with MS5 Reports backend implementation against this ratified design AFTER PR #186 wire-up PR merges. If any sub-decision needs revisiting during implementation, amend this ADR in-place (single ADR, multiple ratifications) rather than spawning a parallel ADR.

---

**Ratification record:** Day-23 2026-05-20 11:50 IST · Yogesh (Admin) + BE+1 (implementer, via PR #183 review comment `4487421841`) + MAIN (planner) · 5 sub-decisions ratified + 2 amendments adopted + namespace convention BINDING M5+ + sequencing risk locked + 3 open questions all M6 deferred · 0 deferred to a future ADR.

---

**Cross-references for Day-23 ratification meeting:**

- ADR-020 (Jira sync) — `jira_issue.sprint_*` columns added M5 are dependencies for `sprint_current()` SQL helper
- ADR-005 (R2 storage) — export artifact storage pattern reused
- ADR-009 (sharp + pnpm Render deploy) — Playwright HTML→PDF runs in the same Render dyno; verify no contention with sharp image processing
- ADR-010 (pdf-parser choice) — pdfkit reuse for tabular reports
- ADR-015 (runtime LLM config bridge) — config-token pattern for per-kind TTL + layout assignment
- PM1_PRD §6 (Reports + Executive Dashboard scope)
- PM1_UI_v2/Redesign Frame by claude design/F23 Reports Studio v2.html (canonical frontend reference)
- PM1_UI_v2/Redesign Frame by claude design/F25 Executive Dashboard v2.html (canonical frontend reference, when produced — Day-23 Claude Design handoff bundle per kickoff §M5 Day-23+)
