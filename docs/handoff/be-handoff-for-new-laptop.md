# QA Nexus PM1 — Backend (BE+1) Handoff for New Laptop

> **Purpose:** everything the next BE+1 needs to resume the QA Nexus PM1 backend on a
> fresh machine. The current laptop is being retired **Sun 2026-06-22** — nothing local
> survives. All code is on GitHub; this doc is the map.
>
> **Author:** BE+1 · **Written:** 2026-06-19 (Fri) · **Repo:** `github.com/yogeshmohite-iksula/QA-Nexus` (private)
>
> **Binding specs (highest authority):** `QA Nexus/PM1/PM1_PRD/PM1_PRD.md` v8.1 ·
> `QA Nexus/PM1/PM1_ERD/PM1_ERD.md` v2.1. Read `CLAUDE.md` at repo root first — it is
> auto-loaded every session and defines the 18 Hard Rules + locked stack + Iksula data canon.

---

## 0. TL;DR — first 30 minutes on the new laptop

1. Install: Node ≥20, pnpm, `gh` (auth as `yogeshmohite-iksula`), Postgres client optional.
2. `git clone https://github.com/yogeshmohite-iksula/QA-Nexus.git` → `cd QA-Nexus` → `pnpm install`.
3. Create `apps/api/.env` from Render env vars (see §3.3 — **never commit it**, it is gitignored).
4. Run the **bootstrap verification** (§5) — especially `prisma migrate diff --exit-code` (catches db-push drift, the 53rd-RC class).
5. Confirm in-flight PRs #288 + #289 merged before any fresh-DB deploy (§4.4).

---

## 1. Architecture

**One NestJS 10 service** (`apps/api`) serving REST + WebSocket. No microservices — single
deployable. Monorepo via pnpm workspaces:

| Path              | What                                                                          |
| ----------------- | ----------------------------------------------------------------------------- |
| `apps/api`        | NestJS service (controllers/services/Prisma) — the backend                    |
| `apps/web`        | Next.js 15 frontend (FE+1's domain — BE does not edit)                        |
| `packages/shared` | Zod schemas shared FE↔BE (single source of truth for request/response shapes) |

**Stack:** NestJS 10 · Prisma 5 · BetterAuth (Postgres adapter, magic-link) · Zod ·
Groq + Gemini via an `LLMGateway` · `@xenova/transformers` bge-small-en-v1.5 (384-dim, in-process WASM) ·
Postgres 15 + pgvector (HNSW) on Neon · Cloudflare R2 (presigned upload).

**Module map** (each is a Nest module under `apps/api/src/<name>`):
`auth` (BetterAuth + RBAC guard) · `projects` · `requirements` · `test-cases` (Composer agent) ·
`test-runs` · `defects` (W2-R read API — **see §2**) · `reports` (SWR cache + cron) ·
`jira-sync` (ADR-020 webhook + push) · `rca`/`agents` (Sherlock RCA, 5-layer) · `kb` (knowledge base,
embeddings, chunking, upload orchestrator) · `audit` (HMAC-chained) · `embedding` · `llm` (gateway) ·
`storage` (R2) · `health` (+ `health-lite`) · `nfr` (NFR probes) · `invitations` · `admin` (llm-config).

**Request flow:** FE → REST (BetterAuth **session cookie**, not Bearer — see §2) → Nest controller
(`@Roles()` RBAC guard) → service → Prisma → Neon. Every state change writes an HMAC-chained
`audit_log` row **synchronously in-handler** (Hard Rule 7; ERD §3.13).

**Data model truth:** `apps/api/prisma/schema.prisma`. Tables `snake_case` plural. Vector columns
`vector(384)`. ⚠️ The schema was historically evolved partly via `prisma db push` — see §3.5 + §4
(the 53rd-RC drift class). Always trust `migrate diff`, not `migrate status`.

---

## 2. API Contracts (what FE+1 consumes)

**Auth model (critical):** BetterAuth **session cookie** (`RolesGuard` reads it), **NOT** a Bearer
token. Cross-site (FE on Pages, API on Render = different registrable domains) needs
`SameSite=None; Secure; Partitioned` (CHIPS) host-only cookies — see `resolveCookieConfig`
and memory `feedback_cross_site_cookie_chips_pattern`. The `/admin/nfr/*` routes also use the
session cookie, not Bearer (memory `feedback_nfr_probe_token_auth`).

**RBAC roles (ERD §3.4):** `Admin`, `Lead`, `QA Engineer`, `Stakeholder`. Guard via `@Roles(...)`.
Unauth → **401**; wrong role → **403**. Open routes: `GET /health`, `/health/lite`, auth sign-in/up/callback.

**All schemas live in `packages/shared/src/schemas`** — FE imports the same Zod schema it validates
against. Never hand-duplicate a shape.

**Live controller base paths** (≈29; `grep -r "@Controller(" apps/api/src`):
`api/projects` · `api/projects/:projectId/requirements` · `.../test-cases` · `api/test-cases` ·
`api/test-runs` · `api/defects` · `api/audit` · `api/users` · `api/invitations` ·
`api/projects/:slug/members` · `api/admin/config/llm-providers` · `api/admin/kb` ·
`api/projects/:projectId/kb[/documents]` · `auth` · `storage` · `embedding` · `llm` · `health[/lite]` ·
`reports` · `rca`/`agents` · `nfr` · `admin/nfr`.

**Verify-before-wire (33rd RC, memory `feedback_verify_api_paths_before_consumer_wiring`):** source
endpoint path/wrapper/error shapes from controller code + the shared Zod schema — never assume REST
conventions. 5 wrong assumptions were caught this way.

**W2-R Defects read API (shipped #271, MERGED):**

- `GET /api/defects` (list) + `GET /api/defects/:id` (detail). RBAC all 4 roles. **Reads are NOT audited** (ERD §8.7).
- Workspace-scoped; cross-tenant id → 404 (findFirst, not findUnique).
- Response carries M4 fields `component` / `verifiedAt` / `closedAt` on **`DefectListItem`** (not on base `DefectSchema`, which the FE demo-seed consumer depends on — do not move them).
- 25 defects seeded → unblocks F21 Defects Hub.

**Test-runs list API (shipped #292, MERGED — same W2-R read pattern):**

- `GET /api/test-runs` — list backing F08 /home ACTIVE_RUNS (`?status=running`) + RECENT_RUNS (default `sort=started_at_desc`, nulls-last). Also `?projectId=&page=&pageSize=` (offset, max 50, NOT the audit cursor). RBAC all 4 roles. **NOT audited** (ERD §8.7).
- Workspace-scoped via `project.workspaceId`; case counts (`totalCases`/`passedCases?`/`failedCases?`) tallied from `test_run_results` (no denormalized columns).
- Response `{ ok, testRuns: TestRunListItem[], pagination }` — `TestRunListItem`/`TestRunListQuery`/`TestRunListResponse` in `@qa-nexus/shared`. `projectKey` = `project.key`; `triggeredBy` = nullable human (webhook/cron → null), distinct from the `trigger` enum.
- `test_runs` is **empty until the runner creates runs** → returns `{testRuns:[], total:0}`. The `@Patch :id/start|result|abort` state-transition routes are the other half (the runner; PM-future).
- ACTIVE_RUNS FE wire deferred to Sat AM (FE+1 lane); RECENT_RUNS has no UI slot yet (M5 backlog).

**501 stubs (PM2–PM4 deferred — acceptable, per PRD):** `jira-sync.controller.ts` + write-ops on
`defects.controller.ts` return `NOT_IMPLEMENTED`. Contract = "PM1-mandated MUST work now; PM2-4 = 501 stub."
Confirm any "is X live?" claim by `grep @Controller` + AppModule import + a live curl (non-501) —
a ledger saying "LIVE" is not proof (39th RC, memory `feedback_audit_doc_live_claim_verification`).

---

## 3. Infrastructure

### 3.1 Hosting (all $0/month — Hard Rule 1)

| Component  | Provider                                              | Notes                                                                      |
| ---------- | ----------------------------------------------------- | -------------------------------------------------------------------------- |
| API        | **Render** free (oregon region, closer to Neon ~80ms) | autospins down; `/health` keep-alive                                       |
| FE         | Cloudflare Pages free                                 |                                                                            |
| DB         | **Neon** free Postgres 15 + pgvector                  | 0.5GB, scale-to-zero (5-min autosuspend), 100 CU-hr/mo cap **per project** |
| Storage    | Cloudflare R2 free                                    | presigned direct upload                                                    |
| Keep-alive | UptimeRobot                                           | targets `/health/lite` (memory-only, DB-free)                              |
| Email      | Resend free (3k/mo) HTTPS API                         | Render Free blocks SMTP                                                    |

### 3.2 Render build/deploy (`render.yaml`)

- `buildCommand: pnpm install --frozen-lockfile && pnpm rebuild sharp && pnpm --filter @qa-nexus/shared build && pnpm --filter @qa-nexus/api build && pnpm --filter @qa-nexus/api prisma:migrate:deploy`
- `startCommand: pnpm --filter @qa-nexus/api start:prod` · `healthCheckPath: /health`
- **Migrations run at build time** via `prisma migrate deploy` (uses `DIRECT_URL`). A broken/incomplete migration chain = a failed Render build (this is exactly what the Day-29/Day-32 work fixed).

### 3.3 Env vars (names only — **values live in Render env vars + GitHub Secrets, never the repo**, Rule 6)

Actual names per `apps/api/.env.example` (the canonical template — the LLM keys use
provider-agnostic naming, **not** `GROQ_API_KEY`/`GEMINI_API_KEY`):
`DATABASE_URL` (pooled, runtime) · `DIRECT_URL` (direct, **migrations only**, no `-pooler`) ·
`BETTER_AUTH_SECRET` (≥32 chars — also the audit HMAC key) · `BETTER_AUTH_URL` · `BETTER_AUTH_COOKIE_DOMAIN` ·
`ADMIN_SEED_EMAIL` · `LLM_PRIMARY_PROVIDER`/`LLM_PRIMARY_MODEL`/`LLM_PRIMARY_API_KEY` (Groq) ·
`LLM_SECONDARY_PROVIDER`/`LLM_SECONDARY_MODEL`/`LLM_SECONDARY_API_KEY` (Gemini fallback) ·
`LLM_LONG_CONTEXT_PROVIDER`/`LLM_LONG_CONTEXT_MODEL`/`LLM_LONG_CONTEXT_THRESHOLD_TOKENS` ·
`RESEND_API_KEY` · `R2_ACCESS_KEY_ID` · `R2_SECRET_ACCESS_KEY` · `R2_BUCKET` · `R2_ENDPOINT` ·
`EMBEDDING_MODEL_ID` (hot-swap embedding model) · `NODE_ENV` · `PORT`. Full list: `apps/api/.env.example` (placeholders only).

Prisma datasource (`schema.prisma`): `url = env("DATABASE_URL")` + `directUrl = env("DIRECT_URL")`.
⚠️ Local `.env` may carry duplicate keys — Prisma's loader keeps the **last** occurrence. zsh cannot
`source` a `.env` whose URLs contain `&` (query params) — let Prisma read it, or pass URLs as explicit args.

### 3.4 The two Neon projects (Path C, Day-32)

- **qa-nexus** (original): hit the 100 CU-hr cap (a 24/7 `*/15` reports cron kept compute awake — fixed by window-gating the cron to 10:00–21:59 IST + a DB-free `/health/lite`; memories `feedback_serverless_db_background_cron_cost` + `feedback_verify_ticket_premise_before_fix`). Currently the cold/standby project.
- **qa-nexus-2** (Path C, **current live DB**): fresh Neon project = fresh 100 CU-hr (the cap is **per-project**, not per-account = constraint-scope RC). Fully migrated + seeded + RLS/HNSW/audit-trigger verified on 2026-06-19.
- Plan: run on qa-nexus-2 until **Jul-1**, then switch back to qa-nexus (fresh monthly CU budget), keep qa-nexus-2 as hot standby.
- Host strings are in Render env vars only (masked refs: old = `ep-blue-silence-…`; qa-nexus-2 = `ep-lingering-union-…` direct / `…-pooler` pooled).

### 3.5 Out-of-band DB setup (NOT in the migration chain)

- `apps/api/prisma/raw/init_rls_hnsw.sql` — installs 20 RLS policies + 2 HNSW vector indexes (`CREATE INDEX CONCURRENTLY`) + the **audit append-only triggers** (P0001 on UPDATE/DELETE). **Run-once, NOT idempotent** (no `IF NOT EXISTS` guards) — run exactly once per fresh DB, after migrations + before/after seed. Apply via `prisma db execute --file prisma/raw/init_rls_hnsw.sql --schema prisma/schema.prisma` (db execute runs statements un-wrapped, so CONCURRENTLY works).
- RLS note (G5): the 20 policies are installed but **inert** at runtime — the app connects as `neondb_owner` (`rolbypassrls=true`, no FORCE-RLS, GUC unset). They are PM2 scaffolding, proven installable, not enforced for the single-workspace pilot.

### 3.6 Seeding a fresh DB (two scripts, in order)

1. `prisma/seed.ts` (`pnpm --filter @qa-nexus/api prisma:seed`) — **base roster**: 1 workspace "Iksula" + 8 users (idempotent: workspace find-or-create, users upsert by email). No audit writes.
2. `scripts/seed-iksula-pilot.ts` (`pnpm --filter @qa-nexus/api seed:pilot -- --commit`) — **pilot content**: 5 projects (RET + 4 shells) / 30 requirements / 63 test cases / 5 suites / 25 defects + ~128 audit rows. **Dry-run is the default**; needs `--commit` (+ `BETTER_AUTH_SECRET` ≥32). Pre-flight requires the workspace + users to already exist (run script 1 first). Idempotent create-if-absent. Golden-set is the content source.

### 3.7 🔁 Jul-1 switchback procedure (qa-nexus-2 → qa-nexus)

1. **Verify both PR #288 (jira_webhook_events CREATE) + #289 (align-clean-db-schema-drift) are merged to `main`.** Without them, any fresh/rebuilt qa-nexus deploy fails (the db-push drift).
2. In **Render env vars**, flip `DATABASE_URL` + `DIRECT_URL` → the qa-nexus pooled + direct strings.
3. Trigger a Render redeploy. The build's `prisma migrate deploy` applies #288 + #289 — on the already-populated qa-nexus they are **idempotent no-ops** (every statement `IF [NOT] EXISTS`), so nothing changes.
4. Verify counts unchanged on qa-nexus: 5/30/63/5/25 + ≥128 audit rows (plus any new pilot rows). `migrate diff --from-schema-datasource … --to-schema-datamodel … --exit-code` should be **0**.
5. Keep qa-nexus-2 as a hot standby; monitor the qa-nexus CU-hr burn (window-gated crons + DB-free `/health/lite` keep it within free tier).

---

## 4. Institutional context

### 4.1 Memory bank (the durable lessons)

Location: `~/.claude/projects/-Users-…-Project10-QA-Nexus/memory/` (the `MEMORY.md` index is loaded
every session). These survive the laptop change because they live under `~/.claude`, **not** in the
repo — re-create or copy them on the new machine if you want recall. Highest-value BE memories:
`feedback_migrate_status_vs_schema_drift` (53rd RC — see §4.2), `feedback_serverless_db_background_cron_cost`,
`feedback_verify_ticket_premise_before_fix`, `feedback_audit_immutability_and_seed_drift`,
`feedback_cross_site_cookie_chips_pattern`, `feedback_nest_di_module_import_vs_unit_mock`,
`feedback_verify_api_paths_before_consumer_wiring`, `feedback_audit_doc_live_claim_verification`,
`feedback_bank_the_blocked_window_with_stable_deliverable`.

### 4.2 🆕 53rd RC — `migrate status` ≠ schema match (db-push drift)

`prisma migrate status` "up to date" only means migration **files** are applied — **not** that the DB
matches `schema.prisma`. Schema evolved via `prisma db push` (or manual SQL) without a migration leaves
**fresh** DBs silently behind. Discovered Day-32 on qa-nexus-2: the chain was **3 tables + 17 columns +
6 enum/type + 21 FK reconciliations** behind schema.prisma; the seed failed `P2022: users.disabled_at
does not exist` while `migrate status` said "up to date". **Detect:** `prisma migrate diff
--from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --exit-code`
(2 = drift, 0 = match). **Fix:** idempotent corrective migration (PR #289 is the worked example).
Memory: `feedback_migrate_status_vs_schema_drift`.

### 4.3 Audit immutability

`audit_log` is HMAC-SHA256-chained (`this_hash = HMAC(BETTER_AUTH_SECRET, prev_hash || payload)`) +
DB append-only triggers (UPDATE/DELETE → P0001, **verified live on qa-nexus-2**). A known row-25 chain
break is **benign seed-time secret drift**, documented-as-exception (memory
`feedback_audit_immutability_and_seed_drift`). Verify chain via `pnpm --filter @qa-nexus/api verify:audit`.

### 4.4 Migration PRs (Day-29 db-push-drift closure) — MERGED + production-verified

- **#288** `fix/be-day29-jira-webhook-events-create-migration` — backfills the missing `CREATE TABLE jira_webhook_events`. **MERGED 2026-06-19.**
- **#289** `fix/be-day29-align-clean-db-schema-drift` — the §4.2 idempotent corrective migration. **MERGED 2026-06-19.**
- Both close the Day-29 ledger item "clean-DB migration interleave / db-push drift". Idempotent → safe no-op on the populated DB.
- **Production-verified end-to-end:** after merge, Render auto-redeployed; the fresh instance booted (`/health/lite` 200, uptime ~66s), which **proves the build's `prisma migrate deploy` succeeded** — a failed migration = failed build = no new instance (old one keeps serving with high uptime). The fix is validated in production, not just on the local sandbox.
- Companion handoff PRs: **#290** (this doc) · **#287** (MAIN master handoff).

### 4.5 Hard rules that bite the backend

$0 cost gate · free-OSS only · ban list (no FastAPI/Redis/Neo4j/socket.io/etc — `enforce-pm1-stack.sh`) ·
strict TS no `any` · every endpoint has a shared Zod schema + `@Roles()` guard · migrations are
append-only/immutable once on `main` · LLM only via `LLMGateway` · NestJS Logger + OTel (no winston/pino) ·
`ws` only (no socket.io). Pre-push gates (4): typecheck, prettier `--check` (scans untracked too —
memory `feedback_prettier_prepush_gitignored`), frozen-lockfile, CHANGELOG guard (triggers on
`apps/**/src` or `packages/**/src` only — `prisma/**` does not). commitlint: lowercase-led subject ≤100,
body/footer lines ≤100.

---

## 5. Bootstrap (new laptop) — verification commands

> Non-admin Mac note (carried over): Homebrew lives at `~/homebrew/bin`, NOT `/opt` or `/usr/local`.
> Bash sub-shells need `export PATH="$HOME/homebrew/bin:$PATH"`. Node ≥20 satisfies the engine pin.

```bash
# 1. clone + install
git clone https://github.com/yogeshmohite-iksula/QA-Nexus.git && cd QA-Nexus
pnpm install                                   # workspaces: api + web + shared

# 2. shared + prisma client
pnpm --filter @qa-nexus/shared build
pnpm --filter @qa-nexus/api exec prisma generate

# 3. local env (NEVER commit — gitignored). Paste DATABASE_URL + DIRECT_URL from Render.
#    Single DATABASE_URL (pooled) + single DIRECT_URL (direct, no -pooler). Both same Neon project.
$EDITOR apps/api/.env

# 4. typecheck + unit tests (no DB needed for most)
pnpm --filter @qa-nexus/api typecheck
pnpm --filter @qa-nexus/api jest

# 5. DB-state verification (needs .env pointing at the live DB)
cd apps/api
npx prisma migrate status                                   # files applied?
# 53rd-RC guard — catches db-push drift that migrate status misses:
npx prisma migrate diff --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma --exit-code    # 0 = match, 2 = drift → write corrective migration

# 6. gh auth (corporate account) + sanity
gh auth status                                              # expect yogeshmohite-iksula
curl -s -o /dev/null -w "%{http_code}\n" https://qa-nexus-api.onrender.com/health/lite   # 200
```

**Fresh-DB-from-scratch** (new env / DR / switchback): migrations → `init_rls_hnsw.sql` (run-once, §3.5)
→ `prisma:seed` → `seed:pilot -- --commit` → verify counts + `migrate diff --exit-code = 0` + anon 401 battery.

**Worktree note:** BE work happened in a git worktree (`…/Project10-QA_Nexus-backend`) parallel to the
FE/MAIN checkouts. Optional on the new laptop — a single clone is fine for solo BE work.

---

## Appendix — quick file map

| Need                    | Path                                                                |
| ----------------------- | ------------------------------------------------------------------- |
| Binding rules           | `CLAUDE.md` (root), `.claude/rules/{api,database,security}.md`      |
| Schema                  | `apps/api/prisma/schema.prisma`                                     |
| Migrations              | `apps/api/prisma/migrations/`                                       |
| RLS/HNSW/audit triggers | `apps/api/prisma/raw/init_rls_hnsw.sql`                             |
| Seeds                   | `apps/api/prisma/seed.ts` + `apps/api/scripts/seed-iksula-pilot.ts` |
| Shared Zod              | `packages/shared/src/schemas/`                                      |
| Deploy                  | `render.yaml`                                                       |
| EOD reports             | `docs/eod-reports/`                                                 |
| ADRs                    | `docs/architecture/`                                                |
