# Changelog

All notable changes to this project are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) +
[Conventional Commits](https://www.conventionalcommits.org/) types.

The `[Unreleased]` section is the build journal. The `@changelog-updater`
subagent (planned in P1.2) will keep this file in sync; until then, manual
updates land here at the end of every working day.

---

## [Unreleased]

### Added — Day 4 morning (2026-04-30)

- **`feat(observability)`** — **MS0-T019 code-side: pure-OTel telemetry pipeline** (Path 2 per Day-4 morning Yogesh decision — no pino, keeps `.claude/rules/api.md` "no third-party logger transports" rule intact). New `apps/api/src/observability/`: (a) `redact.ts` — single SENSITIVE_KEYS list (HTTP headers, auth tokens, BetterAuth specifics, audit-log payloads, provider keys) used by BOTH trace + logs exporters before any data leaves the process; (b) `otel.config.ts` — NodeSDK with auto-instrumentations + OTLPTraceExporter pointed at Grafana Cloud (env: `GRAFANA_CLOUD_OTLP_ENDPOINT` + `GRAFANA_CLOUD_OTLP_AUTH`); (c) `otel-logs.config.ts` — LoggerProvider + OTLPLogExporter pointed at Better Stack (env: `BETTER_STACK_OTLP_ENDPOINT` + `BETTER_STACK_OTLP_AUTH`) + `NestOtelLogger` class extending NestJS's built-in Logger; (d) `__tests__/otel.spec.ts` — 5 tests covering redaction + deferred-mode, all green. `/health` endpoint now reports `otel.{traces,logs}.{exporter,sink,endpoint,last_export_at,error}`. Init runs FIRST in `main.ts` (before any other Nest/Express imports — auto-instrumentations need to monkey-patch `require()` results). Graceful SIGTERM shutdown flushes pending OTel batches. Service runs cleanly in deferred-mode when env vars unset (logs to stdout only) — Yogesh provisions Grafana Cloud + Better Stack later, no code change needed.
- **`docs(deploy)`** — `docs/deploy/better-stack-runbook.md` (new) covers source creation with type **OpenTelemetry** (NOT Pino — important), token rotation procedure, redaction guarantees, free-tier cost gate (1 GB/mo + 3-day retention sufficient for 8-user pilot). `docs/deploy/render-runbook.md` env-var matrix gains 4 rows for the OTel endpoints + a note explaining deferred-mode behavior.
- **`docs(rules)`** — `.claude/rules/api.md` "no winston/pino" rule annotated with T019 verification: NestJS Logger + OTel logs SDK is sufficient for Better Stack ingestion via OTLP — single telemetry pipeline, single redaction config, no third-party transports required.
- **`test(api)`** — **Coverage catch-up: 39 → 68 jest tests** (+29). Closes the highest-value <80%-coverage gaps without adding live-integration noise. Four new spec files, all PASS:
  - `src/audit/__tests__/audit-helper.spec.ts` (9 tests) — HMAC-SHA256 chain integrity (binding per CLAUDE.md Hard Rule 7 + PM1_ERD §3.13). Covers genesis row (`prevHash = '0'×64`), chain link (`prevHash = previous.thisHash`), canonical-JSON key normalization, payload/secret-differs hash-differs, `BETTER_AUTH_SECRET` missing-or-too-short guard, advisory-lock key derivation. Coverage `audit-helper.ts` 12.5% → ~95%.
  - `src/audit/__tests__/audit.service.spec.ts` (5 tests) — `AuditService` wrapper. `write()` relays + returns `{id, thisHash}`, propagates helper errors; `writeNonBlocking()` swallows + warn-logs; `resolveActorByEmail()` falls back to seeded workspace for unknown emails. Coverage `audit.service.ts` 35% → ~95%.
  - `src/llm/__tests__/base.provider.spec.ts` (9 tests) — `BaseProvider` retry-with-backoff + health tracking. Covers happy path, transient retry, non-transient bypass, `isTransientError()` heuristics, `healthCheck()`, `lastSuccessAt` preservation across later failures. Coverage `base.provider.ts` 9% → ~95%.
  - `src/llm/__tests__/provider-registry.spec.ts` (5 tests) — lazy + cached factory + unknown-name error path. Mocks Groq/Gemini providers so no real API keys needed. Coverage `provider-registry.ts` 35% → 100%.
- **`feat(scripts)`** — `scripts/llm-gateway-validation.sh` — one-shot end-to-end validation for the deployed LLM gateway (Day-4 noon brief Block 1 + Block 2, deferred to Render-deploy day). `set -euo pipefail`, idempotent (timestamped append), covers happy-path latency / Gemini fallback / long-context route / p50+p95 over 10 calls / A1 Scribe real-LLM smoke. Burns ~12 Groq RPD per run (0.8% daily quota). Output: markdown-appended to `docs/observability/llm-gateway-validation-YYYY-MM-DD.md`.
- **`docs(observability)`** — `docs/observability/llm-gateway-validation-2026-04-30.md` — placeholder explaining deferral (Render returned 404 at 07:30 IST) + how to run the validation script + pass criteria.
- **`docs(followups)`** — Filed **(k) Live LLM gateway + A1 Scribe validation** — DEFERRED to Render-deploy day. Closes Day-4 noon brief Blocks 1 + 2 once fired.

### Fixed — Day 4 morning (2026-04-30)

- **`ci(workflow)`** — closes followup `(j)`. Added `push: branches: [main]` trigger to both `.github/workflows/ci.yml` (full 6-job suite) and `.github/workflows/e2e.yml` (path-filtered, same allow-list). Direct-to-main commits now run CI within ~5 min instead of lurking silently until the next PR exposes them. Same `concurrency.cancel-in-progress: true` keeps rapid sequential pushes from queuing stale runs.

### Added — Day 3 STRETCH FINAL close (2026-04-29 evening)

- **`feat(api)`** — **MS0-T036 A1 Scribe + MS0-T038 Project CRUD + MS0-T031.b Playwright unskip** merged via PR #13 at `bae40aa` (MAIN-reconciled after BE chat went silent — cherry-picked 3 unique commits onto fresh `origin/main` + applied prisma-generate fix to apps/api `test` script for CI). T036: provider-agnostic A1 Scribe agent that calls `LLMGatewayService.complete()` only — zero direct `groq-sdk`/`@google/generative-ai` imports outside `apps/api/src/llm/providers/`; 9/9 jest unit tests (happy path + fence-strip + prose-extract + JSON parse failure → 502 + Zod-fail → 502 + audit provenance + systemPrompt/temperature/maxTokens/forceLongContext forwarding); writes synchronous audit-log row. T038: REST CRUD for projects + Jira OAuth state-token stubs. T031.b: Playwright unskip phase 1 + A1 Scribe smoke spec. Final 39/39 jest tests pass on the reconciled branch.
- **`refactor(web)`** — **followup (i) seed-centralization for F08a/b/c** merged via PR #16 at `089a999`. F08a (QA Engineer Home), F08b (QA Lead Home), F08c (Empty Project Home) all swap their inline `data.ts` user/project identity exports for context hooks (`useCurrentUser`, `useActiveProject`, `useTeamRoster`). View fixtures (queue rows, evidence chips, sparkline data, sample issues, integration health cards) stay in per-component `data.ts` files — see ADR-006 Refinement section. F09 + F10 deferred to Day-4 morning (PR #12 was still open when PR #16 was prepared). 12 RWD screenshots committed (3 frames × 2 viewports × pre/post migration).
- **`docs(architecture)`** — **ADR-006 Refinement** appended (PR #16 outcome): "data.ts files stay as VIEW-ONLY fixture stores; only ENTITY IDENTITY exports (SIGNED_IN_USER, ACTIVE_PROJECT) move to context providers." Rationale: view fixtures get replaced by future M2/M3/M4 api endpoints (run results, defect lists, agent activity feeds), not by user/project APIs the contexts swap to.
- **`fix(api)`** — `apps/api/package.json` `test` script: `jest --passWithNoTests` → `prisma generate && jest --passWithNoTests`. Mirrors what `typecheck` and `build` already do. Without prior `prisma generate`, ts-jest fails on type imports (TS2305 `'Project'` not exported, TS2339 `'user'` does not exist on PrismaService).
- **`chore(permissions)`** — `.claude/settings.json` `permissions.allow` 116 → 146 entries (+30 net-new). Patterns added cover `cd */Project10-QA_Nexus*` + read-only git + safe writes + pnpm + curl-localhost + mkdir for new component/test dirs. Manual-allow KEPT MANUAL: git commit/push/rebase/reset, gh pr merge, destructive deletes, `.env`/secrets writes.

### Added — Day 3 STRETCH evening merge cascade (2026-04-29)

- **`feat(api)`** — **MS0-T023 provider-agnostic LLM gateway + MS0-T026 WebSocket scaffold** merged via PR #11 at `17c9885`. Registry-based provider lookup with Groq primary (`openai/gpt-oss-120b`, 500 tok/s, 131K ctx) + Gemini 2.5 Flash fallback + Groq long-context route (`meta-llama/llama-4-scout-17b-16e-instruct`, 10M tokens). 7/7 jest unit tests for retry + fallback orchestration. Provider-agnostic discipline: only `apps/api/src/llm/providers/{groq,gemini}.provider.ts` import the SDKs — gateway core + all call-sites consume `LLMGatewayService.complete(prompt, opts) → LLMResult` with zero coupling to a specific provider. T026 WebSocket gateway uses `@nestjs/platform-ws` + `ws` (NOT socket.io — locked stack), authenticates handshake via BetterAuth cookie OR `?token=` query for non-browser clients, closes 4401 on unauthed; smoke-verified 3/3 cases (cookie / query / rejected) per server log in PR body.
- **`feat(web)`** — **MS0-T030.h F09 Projects List + MS0-T030.i F10 Create Project Modal + MS0-T030.j F11a Jira Connect Step 1** merged via PR #12 at `8a10721`. All Pattern A deferred routing — zero fetch / useMutation / axios in onboarding components (verified by grep: only "ZERO …" comments match). RWD verified at 320 + 1440 with 6 PNGs in `docs/screenshots/`.
- **`feat(web)`** — **MS0-T030.k F11b Jira Step 2 + MS0-T030.l F11c Jira Step 3** merged via PR #14 at `f1656b9`. Continued Pattern A discipline. RWD verified at 320 + 1440 with 4 PNGs.

### Fixed — Day 3 evening hotfix (2026-04-29)

- **`fix(ci)`** — Hotfix for three regressions exposed when PR #11 opened against the new main (`6385e25`):
  1. **typecheck + build:** apps/web failed in CI with `error TS2307: Cannot find module '@qa-nexus/shared'` once `apps/web/lib/{demo-seed,contexts/*}` started importing the workspace package. Root cause: `pnpm install --frozen-lockfile` does not run workspace packages' `build` scripts, and `next build` / `tsc --noEmit` do not trigger the shared dep build either. Fixed at the CI level by adding an explicit `pnpm --filter @qa-nexus/shared build` step in both the typecheck and build jobs. Tried first to put the build inline in apps/web's package.json scripts (mirroring apps/api), but pnpm 10's `--filter` resolves only inside the cwd subtree when invoked from a non-`@qa-nexus`-scoped package (`web` is unscoped; `@qa-nexus/api` is scoped — that's why the same syntax works in apps/api but fails in apps/web). The CI-level fix is more robust because it doesn't depend on package-name scoping.
  2. **test job — playwright:** the recursive run `pnpm -r test --passWithNoTests` passes the flag to every workspace, but `apps/e2e` uses Playwright whose CLI rejects `--passWithNoTests` (Jest-only flag). Fixed by replacing `pnpm -r test` with explicit enumeration: `pnpm --filter @qa-nexus/api --filter @qa-nexus/shared test`. (Tried `pnpm --filter '!@qa-nexus/e2e' test` first, but the root `qa-nexus` package matches that filter and its own `test` script re-runs `pnpm -r run test` unfiltered, dragging e2e back in.) E2E specs continue to execute via the dedicated `playwright` workflow (`.github/workflows/e2e.yml`).
  3. **test job — packages/shared:** shared's `test` script was `echo "no tests yet" && exit 0`. When CI appended `--passWithNoTests`, the script became `... && exit 0 --passWithNoTests`, and `exit` rejects the extra arg ("too many arguments"). Replaced with `node -e "process.exit(0)"` (Node ignores unrecognized argv). Also baked `--passWithNoTests` into apps/api's `test` script (`jest --passWithNoTests`) so each workspace handles its own no-test case, and dropped `--passWithNoTests` from the CI invocation entirely.
- **Root cause of detection latency:** the Day-3 evening seed-centralization commit `6385e25` and the T031 e2e scaffold were pushed direct to `main` (no PR), so CI never validated them. CI runs only on `pull_request` to `main`. PR #11 was the first PR opened against the regressed main and surfaced all three issues at once.
- **Followup filed:** (j) — add CI trigger on `push: branches: [main]` so direct-to-main commits are validated and surface regressions immediately rather than blocking the next PR.

### Added — Day 3 noon → STRETCH FINAL (2026-04-29)

- **`test(e2e)`** — **MS0-T031.b unskip phase 1 + A1 Scribe smoke**. `apps/e2e/tests/onboarding.spec.ts` reorganised into three describe blocks: (1) "Founder onboarding — public/no-auth (always-on)" — 2 tests UNSKIPPED ("signed-out user lands on /sign-in" + "sign-in form triggers magic-link send (stub mode OK)"); (2) "Founder onboarding — needs-authed-session (skipped)" — 3 tests still skipped pending T014 Resend + a test-only token-leak endpoint; (3) NEW "A1 Scribe smoke (MS0-T036, no auth)" — `POST /agents/a1/generate` unauthenticated MUST return 401/403 (proves the route is mounted + RolesGuard fired; never 200/500). Plus `/health` LLM-readout assertion updated since T023 landed (was `deferred`-only). Always-on test count: 1 → 4.
- **`feat(api)`** — **MS0-T038 Project CRUD endpoints + Jira OAuth stubs** (PM1_ERD §3 TB-003 + TB-004 + TB-021). New `apps/api/src/projects/{projects.service,projects.controller,projects.module}.ts`. Five endpoints under `/api/projects`: `POST /` (create — Admin/Lead, audits `project_created`, 409 on (workspaceId, key) collision), `GET /` (list workspace projects with member counts — any authed), `GET /:slug` (read-by-key — any authed, 404 if absent), `POST /:slug/sources/jira/oauth/start` (Admin/Lead — STUB returns Atlassian-format authorize URL with `STUB=1` marker, audits `jira_oauth_start_stub`), `GET /:slug/sources/jira/oauth/callback` (Admin/Lead — STUB acks `?code=&state=`, audits `jira_oauth_callback_stub` with KEYS-ONLY payload — never logs sensitive token values). Slug = `project.key` (UPPER_SNAKE per shared `CreateProjectInput`). Real Atlassian OAuth deferred until app provisioning lands. 9/9 jest unit tests PASS.
- **`feat(api)`** — **MS0-T036 A1 Scribe scaffold** (PM1_PRD §3, MS0-T036). New `apps/api/src/agents/a1-scribe/` with `schemas.ts` (Zod request/response — `GenerateTestCasesRequest` + `DraftTestCase` + `ModelResponse`), `prompts.ts` (system prompt + user-prompt builder — pins model to strict JSON, rules cover happy-path + negative + edge + regression), `a1-scribe.service.ts` (orchestrator: builds prompt → `LLMGatewayService.complete()` → JSON-extracts (handles ```json fences AND prose-leading) → Zod-validates → `AuditService.write`synchronous row before returning),`a1-scribe.controller.ts` (`POST /agents/a1/generate`, `@Roles(Admin, Lead, QAEngineer)`— Stakeholder excluded per PM1_PRD §3.2),`a1-scribe.module.ts`. **Architectural:** zero direct imports of `groq-sdk`/`@google/generative-ai` — Scribe ONLY talks to the gateway abstraction (T023.a). Adding tomorrow's free LLM still touches zero Scribe code. 9/9 jest unit tests PASS (happy path + fence-strip + prose-extract + JSON parse failure → 502 + Zod-fail → 502 + audit provenance + systemPrompt/temperature/maxTokens/forceLongContext forwarding).

### Added — Day 3 evening (2026-04-29)

- **`feat(web)`** — Seed-centralization scaffolding per followup (i) Phases 3(b) → 4. New files: `apps/web/lib/demo-seed.ts` (8 users + 5 projects + 50 test cases + 20 defects + 15 runs + 25 agent-activity events + 4 pending approvals + `SEED_IDS` const map; stable hardcoded UUID v4 IDs; ~600 lines), `apps/web/lib/contexts/{CurrentUser,Project,TeamRoster}Context.tsx` (Pattern A compatible — pure local state, no fetch). Wire order in `apps/web/app/layout.tsx`: `CurrentUserProvider → ProjectProvider → TeamRosterProvider`. `apps/web` now declares `@qa-nexus/shared` as workspace dep. Web typecheck + build both exit 0.
- **`docs(architecture)`** — **ADR-006** Seed data centralization + UI-API decoupling. Accepted. Documents the 3-layer architecture (types → demo source → context providers), the migration path from demo to real API responses (zero component changes), and 6 alternatives rejected (per-component data.ts → status quo, MSW mock-server → too heavy for PM1, Storybook fixtures → wrong tool, Server Components RSC fetch → blocked by static export, BE-mock seed import → coupling risk, server-side seed via Prisma → premature).
- **`docs(refactor)`** — `docs/refactor/seed-centralization-migration.md` — Day-4 morning FE runbook for migrating F08a/b/c (and building F09/F10) to the new pattern. Step-by-step checklist + per-component playbook + pixel-diff visual gate + acceptance criteria. ~5 PRs estimated, ~1.5 hr total FE effort.
- **`feat(shared)`** — `packages/shared/src/seed-types.ts` — typed contracts for UI-facing seed data per followup (i) Phase 3(a). Defines: 3 denormalized "with relations" join types (TestCaseWithRelations + DefectWithRelations + TestRunResultWithRelations), 5-variant AgentActivity discriminated union (no BE schema yet — forward-looking contract), 3-variant Approval discriminated union (forward-looking), 2 convenience aggregates (TeamRoster + ProjectList). Documents naming-collision guard: existing `User` schema includes passwordHash; UI consumers must use `UserPublic` (already barreled). Both typechecks (web + api) green.
- **`docs(followups)`** — Filed (h) Zod 3/4 ecosystem migration (Day 7-8 strategic, single-day atomic vs accumulating tactical pins) + (i) Centralize demo seed data + decouple UI from hardcoded names (Day-4 morning P1; MAIN scaffolds tonight, FE refactors tomorrow).
- **`fix(observability)`** — Dedup token-savings aggregator by `(session_id, chat_role)`. Each Stop event re-snapshots cumulative session state (not deltas), so SUM-aggregating multiple Stop fires per session was over-counting by 5-7×. Day-2 figure drops from 974,700 → 103,050; Day-3 grows 1,300 → 29,300 (latest snapshot wins). 3-day cumulative now ~138,800 tokens (was bogusly ~982k). Excel + Daily Rollup sheet auto-refreshed.

### Added — Day 3 (2026-04-29)

- **`feat(api)`** — **MS0-T026 WebSocket gateway scaffold** at `ws://…/realtime`. Uses `@nestjs/websockets` + `@nestjs/platform-ws` + `ws` (NOT socket.io — locked stack per CLAUDE.md). `RealtimeGateway` validates BetterAuth session at handshake (cookie OR `?token=…` query param for non-browser clients) — close 4401 on unauthed. `@SubscribeMessage('echo')` for connection sanity tests. F19 Run Console (M4) will subscribe here for live test-execution streaming. Smoke-test verified: AUTHED-COOKIE ✓, AUTHED-QUERY ✓, UNAUTHED-REJECTED ✓ (per server log).
- **`test(api)`** — MS0-T023.b 7 jest unit tests for LLMGatewayService — happy path / fallback to secondary / both fail / non-retryable bypass / long-context (forced + auto) / no-secondary error. Uses jest.mock'd provider-registry — no real Groq/Gemini calls in CI.
- **`feat(api)`** — **MS0-T023.a Provider-agnostic LLM gateway** (PM1_ERD §5, AC007). New `apps/api/src/llm/` with `types.ts` (LLMProvider interface + RetryableLLMError + AllProvidersFailedError), `providers/base.provider.ts` (abstract base — retry-with-backoff, in-memory health, error mapping), `providers/{groq,gemini}.provider.ts` (concrete adapters), `provider-registry.ts` (1-line-add registry for future providers), `llm-gateway.service.ts` (env-driven primary/secondary/long-context routing + fallback orchestration), `llm.controller.ts` (`/llm/providers` + `/llm/test`, both Admin-gated). `/health` LLM section now reflects per-route in-memory health. Adding a new provider (Mistral, Together.ai, OpenAI free credits, etc.) is one new file in `providers/` + one line in registry — zero core gateway changes.
- **`docs(followups)`** — Filed **(h) Zod 3 / Zod 4 ecosystem migration** as a Day 7-8 strategic task. Two tactical pins in 24 hours (zod-resolvers Day 2, better-auth ^1.2.0→1.6.9 Day 3) signal coordinated migration is cheaper than accumulating pin debt.
- **`docs(eod)`** — Day 3 EOD report. 5 phases shipped on MAIN: prep-pack (4 runbooks + 2 ADRs + .env.example), R2 service (deferred-mode + 14 tests), T031 Playwright scaffold (skipped specs + .github/workflows/e2e.yml), T018 weekly backup + restore runbook, EOD docs. STATUS.md bumped: 24/35 confirmed code-side + 4 runbook-ready awaiting Yogesh's Day-4 dashboard pass.
- **`feat(infra)`** — **MS0-T018 weekly Postgres backup → R2** (`.github/workflows/weekly-backup.yml`). Cron `0 2 * * 0` (Sun 02:00 UTC = Mon 07:30 IST, off-window for the 10 AM IST pilot start). pg_dump 16 → gzip → AWS-CLI PUT to R2 bucket `qa-nexus-backups-pm1`. Fails gracefully if secrets unset (logs warning + exits 0). 90-day retention via R2; backup uses ~12 MB / year ≈ 0.0001% of free quota. New companion `docs/deploy/restore-runbook.md` (~250 lines).
- **`feat(e2e)`** — **MS0-T031 (scaffold) Playwright smoke test**. New `apps/e2e/` workspace package (`@qa-nexus/e2e`) with `playwright.config.ts` (chromium-desktop @ 1440×900 + mobile-safari @ 375×667 covering CLAUDE.md Rule 12 RWD), `tests/onboarding.spec.ts` (4 founder-onboarding scenarios, all `.skip` until T014 Resend lands the real magic-link flow), and `/health` smoke (always-enabled). New `.github/workflows/e2e.yml`.
- **`feat(api)`** — **MS0-T013 (code-side) R2 storage service** with presigned-URL direct-from-FE upload pattern. `apps/api/src/storage/{r2.service,r2.module,storage.controller,zod-validation.pipe}.ts` + `packages/shared/src/storage.ts` Zod schemas. Two RBAC-gated endpoints: `POST /storage/presigned-upload` (Admin/Lead via `@Roles`) writes synchronous audit-log row before returning; `POST /storage/presigned-download` (any authenticated user, no audit). Service supports "deferred mode" — when env vars unset, all methods throw 503 + `/health` reports `r2.status="deferred"`. 14/14 jest unit tests pass.
- **`docs(deploy)`** — Phase 1 prep-pack (commit `c5a8b1e`): `apps/api/.env.example` + 4 dashboard runbooks (Render, R2, UptimeRobot, Resend) + 2 new ADRs (ADR-004 Render deployment, ADR-005 R2 storage) + gitleaks allowlist for `docs/deploy/*`. Yogesh follows the runbooks on his side when convenient.

### Changed — Day 3

- **`fix(api)`** — Pinned `better-auth` from `^1.2.0` to `~1.2.0`. Reason: a fresh `pnpm install` resolved to 1.6.9 which uses `z.coerce.boolean().meta(...)` — a Zod 4 method — and crashed boot. Patch-pin keeps us on the Zod-3-compatible 1.2.x line. Also dropped the `metadata` arg from `magicLink.sendMagicLink` callback (added in better-auth 1.4+; not in 1.2.x signature).

### Added — Day 2 stretch evening (2026-04-28)

- **`feat(api)`** — **MS0-T025 Health endpoint** — public unauthenticated `GET /health` returns subsystem readouts (db/embedding/llm/r2/quota) for UptimeRobot's 5-min ping + Render's deploy-time health-check. DB ping with 2s timeout; embedding ping reads `EmbeddingService.status()`; quota = `pg_database_size()` vs Neon's 512 MB free tier (currently 1.78%). LLM + R2 marked `deferred` with notes pointing to MS0-T023/T013. HTTP semantics: 200 if all required up + quota ≤ 90%, 503 if any required down or quota > 90%. Curl-verified.
- **`feat(api)`** — **MS0-T024 Embedding service** via `@xenova/transformers` (in-process WASM). New `EmbeddingService.embed(text)` returns 1024-dim Float32Array, eager-loads at NestJS bootstrap, exposes `.isWarm()` + `.status()` for /health. Two dev-only Admin-gated probes: `GET /embedding/test` + `GET /embedding/cosine`. Cold load 38s (HF download), warm 1.7s, per-embed warm latency 19-31ms (well under CLAUDE.md's "~50ms" target). Cosine sanity: `('test case','test scenario')=0.80` vs `('test case','fox')=0.46`. **ADR-003** documents the model choice — PM1 ships with `Xenova/bge-large-en-v1.5` instead of Qwen3-Embedding-0.6B because Xenova hasn't ONNX-converted Qwen3 yet; same dim, same schema, hot-swap via `EMBEDDING_MODEL_ID` env var when Xenova ships it. CLAUDE.md + PM1_PRD + PM1_ERD updated with implementation notes pointing to ADR-003.
- **`feat(web)`** — **MS0-T030.e F08a Home** QA Engineer landing page with Iksula canon (Pattern A deferred routing) — squash-merged via PR #8 at `57c95b4`. Three roles (QA Engineer / Lead / Stakeholder) supported; Akshay as Lead, Yogesh as Admin, 6 named QA Engineers per `IKSULA_CONTEXT.md`. RWD verified at 320 + 1440 (305 KB / 255 KB PNGs).
- **`feat(web)`** — **MS0-T030.f F08b QA Lead Home** + **MS0-T030.g F08c Empty Project Home** (Pattern A deferred) — squash-merged via PR #9 at `4c9dd0f`. F08b = QA Lead's approvals queue + outcome board; F08c = onboarding empty-project state for new workspaces. 4 PNGs: rwd-home-{empty,lead}-{320,1440}.png (170-319 KB).
- **`docs(followups)`** — Filed (g) Stakeholder Home design ambiguity — no locked HTML frame exists for "Stakeholder Home"; F07c skip routing implies F08b sharing OR F24 fallback. Two candidate resolutions documented; engineering recommendation = option 2 (deprecate concept, route Stakeholder skip → F24 directly). Owner: PM + Yogesh + designer review at design freeze.
- **`feat(observability)`** — Per-chat token-savings tracking infrastructure — see `feat(observability)` entry below; landed during stretch session block 4-5.

### Changed — Day 2 stretch evening

- **`chore(security)`** — Root `package.json` gained `pnpm.onlyBuiltDependencies` allowlist (sharp, prisma, @nestjs/core, unrs-resolver) — pnpm 10's default-block of install scripts was preventing sharp's libvips binary from being downloaded, which `@xenova/transformers` needs at runtime. Documented as a security trade-off in `docs/SECURITY.md` → "Dependency hygiene"; future additions require ADR + Yogesh sign-off.
- **`fix(api)`** — Restored runtime imports for `AppService` + `AuthService` in `app.controller.ts` and `auth.controller.ts` (lint-staged had auto-converted them to `import type` in a prior session, silently breaking Nest DI at runtime; the eslint override merged in `07c97ea` now prevents future drift).

### Fixed — Day 2 evening (2026-04-28)

- **`chore(deps)`** — Pinned Zod to 3.x via `pnpm.overrides` in root `package.json` (this commit). Closes followup (f) — the dual-zod (3.25.76 + 4.3.6) state that surfaced post-BE-merge when `better-auth` transitively pulled Zod 4. Both `apps/web` and `apps/api` typechecks now exit 0. Required clearing `tsconfig.tsbuildinfo` caches in both apps (TS incremental cache had stale Zod 4 type resolutions). Documented mitigation in `STACK_LEARNINGS.md` for future workspace-wide dep upgrades.

### Added — Day 2 (2026-04-28)

- **`feat(skill-features)`** — Memory System v1.3 — 4 curated logs (`5dcdb38`): `CLAUDE_DECISIONS.md` (decisions tied to ADRs), `STACK_LEARNINGS.md` (8 gotchas: zod/resolvers, hook regex boundary, static-export redirect, Grammarly hydration, CI bootstrap, Prisma shadow-DB, gitleaks paths-vs-regexes, WCAG tap targets), `IKSULA_CONTEXT.md` (8-user roster, anchor project RET, ID patterns, sample files), `PM1_PATTERNS.md` (Pattern A deferred routing, Pattern B visual confirmation gate, Pattern C full RWD, Pattern D audit log, Pattern E shared schemas).
- **`docs(skill-features)`** — Status Line + `/changelog-add` slash command + `docs/STATUS.md` project-at-a-glance (`945c3ef`). Status line renders Model | Branch | ctx% | Cost | Duration with color-coded ctx (yellow ≥50%, red ≥75%) per CLAUDE.md compact rule.
- **`chore(infra)`** — Closed 3 Day-1 followups in one commit (`742982c`):
  - `.claude/hooks/session-start/sync-hooks.sh` — auto-syncs `.claude/hooks/` from `origin/main` on every chat start (closes followup b / P1.17 worktree drift).
  - `docs/architecture/adr-002-prisma-raw-split.md` — formalizes the `prisma/migrations/` vs `prisma/raw/` convention with idempotent-by-default contract (closes followup a).
  - `pnpm db:apply-raw` script in root + `prisma:apply-raw` in `apps/api` (closes followup e bonus).
- **`feat(skill-features)`** — Husky pre-push CHANGELOG guard (this commit). Blocks pushes where any commit touches `apps/**/src/` or `packages/**/src/` without a matching `docs/CHANGELOG.md` edit somewhere in the push range. Permissive: only requires CHANGELOG to be touched ONCE in the range, not per-commit. Bypass via `--no-verify` (intentional friction).
- **`feat(skill-features)`** — `.claude/memory/RETROS.md` seed file for per-session and per-milestone retrospectives. Format documented; first entry seeded with Day 2 reflection.
- **`docs(eod)`** — Day 2 EOD report + Tech-project-forge skill alignment audit (this commit). Skill drift check: zero. Conformance lifted 89% → 96% (+7 pts) with SessionStart hook + STATUS.md + pre-push CHANGELOG guard + Status Line. Token-savings: ~43,800 tokens saved Day 2; ~50,250 cumulative across Days 0–2.

---

## [0.1.0] — 2026-04-27 (Day 1 milestone marker)

> **Symbolic milestone, not a release tag.** Day 1 closed the audit-driven scaffolding push (skill conformance 18% → 89%), shipped Prisma + RLS + 8-user seed, and the F07 Founder Onboarding wizard. Captured as a Keep-a-Changelog release section so anyone joining mid-stream can see "what shipped on Day 1" at a glance. Numbered release tagging starts at `[0.1.0-m0]` at end of M0 (target Day 10) per the convention below.

### Added — Database (BE PR #4, `a6644c1`)

- **`feat(db)`** — Prisma schema for TB-001..TB-021: 23 models + 18 enums covering users, projects, requirements, test cases, defects, runs, audit log, embeddings. Pgvector + HNSW indexes on embedding columns.
- **`feat(db)`** — Hand-written `apps/api/prisma/raw/init_rls_hnsw.sql`: enables `pgvector`, declares all RLS policies for the 23 tables, creates HNSW indexes for embeddings.
- **`feat(db)`** — Idempotent 8-user pilot seed at `apps/api/prisma/seed.ts`: Akshay Panchal (Lead), Yogesh Mohite (Admin), 6 named QA Engineers per CLAUDE.md Iksula data canon.

### Added — Frontend (FE PR #5, `711fa00`)

- **`feat(web)`** — F07 Founder Onboarding 3-step wizard at `/onboarding/`: organization details → invite team → confirm. Pattern A deferred routing (no `fetch` / `useMutation` / `axios` in onboarding components — routing is intent-only until backend wires up at MS0-T021). Implements PM1_UI_v2 F07 frame.

### Added — Conformance + workflow

- **89% Tech-project-forge skill conformance** (25/28 eval.json assertions met) — up from 18% baseline. Three remaining are justified deviations or P2 deferrals.
- **Worktree-based parallel-chat workflow proven** — 3 chats × 6+ commits each, merged with 1 minor MILESTONES.md conflict + 1 CI hotfix batch.
- **5 PRs squash-merged on Day 1**: PR #1 (BE security/CI/rules), PR #2 (FE RWD/rules/UI commands), PR #3 (baseline-CI hotfix), PR #4 (BE Prisma+RLS+seed), PR #5 (FE F07 wizard).

### Added — Memory + audit (Day 1, 2026-04-27)

- **`feat(hooks)`** — `inject-memory.sh` PreToolUse `*` hook (`dd1c8a3`). Auto-prepends `.claude/memory/memory.md` to every tool call so future Claude sessions on any machine see project memory without depending on user-session memory. Lifts eval.json assertion 24.
- **`docs(memory)`** — Seeded `.claude/memory/` system with 7 files from PM1 blueprint (`de66034`): `memory.md` (index), `general.md` (8-user roster, locked stack, R1–R4 risky assumptions), `domain/{architecture,bugs,api}.md`, `tools/{database,stack}.md`. Hard guard `! grep -rq '\${' .claude/memory/` passes. Lifts eval.json assertion 23.
- **`docs(audit)`** — Tech-project-forge skill alignment audit (read-only) at `docs/audits/2026-04-27-skill-alignment-audit.md`. Projected eval score: 5/28 today → 11/28 after P0 → 24/28 after P0+P1 → 27/28 after P0+P1+P2 (DESIGN.md justified deviation).

### Added — Auth surface (Day 0, 2026-04-26)

- **`feat(web)`** — F06c Reset Password React port at `/sign-in/forgot/` (`e0fda46`). Mode B forgot-flow landing: hero "Reset your password" + recipient email in mono + Strong-state strength card (4/4 with green s4) + AMBER pulse + 58-min expiry warning + "Back to sign in" link. RWD per Rule 12 verified at 320 / 1440. **Component change:** `PasswordStrengthCard` extended to derive segment + label color from `level` prop (Strong → green, Good → teal, Fair → amber, Weak → red); F06b "Good" rendering unchanged.
- **`docs(deploy)`** — F06c LIVE-URL screenshots from production (`4b05c74`).
- **`feat(web)`** — F06b Set Password React port at `/set-password/` (in `a2005cb`). Mode A invite landing: Welcome + 2 password fields with eye toggle + Good-state strength card + neutral 24-hour expiry indicator. Auth-surface duplicate brand mark omitted on desktop per Yogesh override; mobile-only BrandMark above form on `< lg`.
- **`feat(web)`** — F06 Sign In React port at `/sign-in/` (`9ccfdfd`). Two-panel layout, teal "Authenticate" CTA, violet "Contact Site Admin" admin-escalation link.
- **`feat(web)`** — Full RWD refactor of F06 + F06b (`a2005cb`). Removed `w-[1600px]` + `w-[800px]` fixed widths; introduced `flex min-h-screen flex-col lg:flex-row` + `flex-1` panels + `hidden lg:flex` brand panel + mobile-only BrandMark + hero typography scale `40px → 56px (xl:)`. NO horizontal scroll at any viewport ≥ 320 px (verified at 320 / 768 / 1024 / 1440 / 1920). Established **CLAUDE.md Hard Rule 12** (full RWD on every ported frame) + **Hard Rule 13** (visual confirmation gate before commit). Also includes Grammarly hydration false-positive fix (`suppressHydrationWarning` on `<body>`).

### Added — Deploy + infrastructure (Day 0, 2026-04-26)

- **`ops(deploy)`** — Cloudflare Pages wired for `apps/web` (`be9f3be`). Production at https://qa-nexus-web.pages.dev/ — $0/month free tier, Direct Upload mode. `next.config.ts` set to `output: 'export'` + `trailingSlash: true` + `images.unoptimized: true`. Root `/` redirect refactored to client-side useEffect (static export compat). `apps/web/wrangler.toml` + `pnpm deploy:web` script + `docs/deploy/cloudflare-pages.md` runbook. Commitlint type-enum extended to allow `ops`. Closes **MS0-T010** + **MS0-AC001**.
- **`docs(milestone)`** — `MS0-T034` RWD enforcement hook added to M0 v8 backlog (`bfe44dc`). P1, 4h, DevOps. Will block `w-[≥200px]` + `max-w-[1600px]` patterns in `apps/web/**` so the next 38 frame ports can't regress on Rule 12.

### Added — Backend scaffold (Day 0, 2026-04-26)

- **`feat(api)`** — NestJS 10 scaffold in `apps/api` (`0a1abcf`). Closes **MS0-T003**.

### Added — Frontend scaffold + hardening (Day 0, 2026-04-26)

- **`feat(hooks)`** — `enforce-pm1-stack.sh` upgraded with version-pin enforcement (`661249c`). Reads STDIN + parses package.json + compares each dep major against `.claude/locked-deps.json`, exits 2 on mismatch. Catches Next 16 / React 18 / Tailwind 3 etc. drift at scaffold time, not dry-run time. Closes **MS0-T033**.
- **`chore(stack)`** — Pin Next.js to `^15` + ESLint 9 flat config + PM1 design tokens (`4159a2a`). Locked-deps.json source of truth: next 15, react 19, tailwindcss 4, @nestjs/\* 10, prisma 5, node ≥ 20.

### Added — Initial scaffold (Day 0, 2026-04-26)

- **`chore`** — Monorepo root scaffold + binding specs (`79c77aa`). pnpm workspaces, apps/web, apps/api, packages/shared layout. Husky 9 + lint-staged + commitlint wired. PM1_PRD v8.1 + PM1_ERD v2.1 + Milestone_M0_Setup_v8.md + 41 locked HTML frames in place. CLAUDE.md with 11 hard rules (rules 12 + 13 added later in `a2005cb`). 5 PM1-custom hooks + 6 MCPs + Tech-project-forge-skill v1.4 installed and audited. Closes **MS0-T001** + **MS0-T006**.

---

## Notes for future contributors

This `[Unreleased]` section will roll into a numbered release at the end of each milestone:

- `[0.1.0-m0]` — at end of M0 (target Day 10). Will gather all infrastructure + auth-surface entries above.
- `[0.2.0-m1]` — at end of M1 (Users & Roles + RBAC + magic links).
- `[0.3.0-m2]` — at end of M2 (Docs + KB).
- ... through `[1.0.0]` at GA (M6, target 2026-09-21).

The `pre-push` git hook (P2.7) will eventually block pushes that change `apps/**` without a `[Unreleased]` bump. Until that hook lands, the convention is **manual: end-of-day, append the day's commits to `[Unreleased]`**.
