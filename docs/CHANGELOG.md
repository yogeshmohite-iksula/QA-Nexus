# Changelog

All notable changes to this project are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) +
[Conventional Commits](https://www.conventionalcommits.org/) types.

The `[Unreleased]` section is the build journal. The `@changelog-updater`
subagent (planned in P1.2) will keep this file in sync; until then, manual
updates land here at the end of every working day.

---

## [Unreleased]

### Decided — Day 27 (Tue) — ADR-022 ratified: Frontend Handoff Bundle workflow for M5+ frames [m5 day-27]

Day-27 Tue 2026-05-26 PM. ADR-022 ratified after the 3-frame validation gate fired: F22 ✗ (Day-23, bundle 30-50% structurally divergent, v2 HTML fallback per Hard Rule 15) + F25 ✓ (Day-24, 0% divergence, first bundle-workflow SUCCESS) + F23 ✓ (Day-27, 12.5% ARIA divergence, sanity check confirmed; diff-probe AMBER band 5.1-9.6%). **2 ✓ : 1 ✗ → ratified** with mandatory §5.9 pre-Step-3 sanity check (30% structural-divergence threshold triggers Rule 15 fallback).

**Decisions locked:**

- Bundle path is **ADDITIVE** to Hard Rule 15, not REPLACEMENT. Frames without bundles (M3 ports, F26, F28) keep the existing 7-step workflow.
- Bundle artifacts (`design.html` + `design-notes.md` + `spec.json` + `screenshots/` + `README.md`) are AUTHORITATIVE for Steps 1+2 only; Steps 3-7 unchanged from the v2 HTML port flow.
- FE+1 still writes TSX manually in Step 4 — bundle does NOT auto-generate React (Day-23 amendment correcting Day-22 draft).
- Pre-Step-3 sanity check (§5.9) MANDATORY: count v2 HTML sections vs bundle `spec.json` sections; if ≥ 30% structural divergence, REJECT the bundle + port via Rule 15.
- Bundle storage: repo at `apps/web/components/<frame>/handoff-bundle/`; R2 rejected (no auditability + free-tier add).
- Bundle versioning + HMAC signing: DEFERRED to M6 (see `docs/m6/m6-hygiene-followups.md`).

**Effective scope:** F25 (PASSED Day-24) + F23 (PASSED Day-27) shipped via bundle path. F26 + F28 carry to Wed Day-28 via v2 HTML/v1 HTML + skill v2.2 (neither has a bundle). Bundle path remains ENABLED for any future M5+/M6 frame where Claude Design ships a bundle AND pre-Step-3 sanity check passes.

**Hard Rule 15 amendment Part X:** forthcoming as a separate followup (post-M5 enhancement); will codify precedence when both bundle + v2 HTML exist for a frame.

**Cross-references:** Hard Rule 15 (v2 HTML source-of-truth — remains DEFAULT when bundle absent OR sanity check fails) · Hard Rule 18 (skill-mandatory workflow + Day-19/21 amendments) · §5.3 pre-built TSX path-adaptation finding from F22 · §5.9 bundle-canonical divergence + sanity check threshold from F22 REJECTION · `.claude/memory/feedback_claude_design_bundle_first_use.md` · `.claude/memory/feedback_skill_v2.2_first_use.md` 3-frame outcome journal.

### Added — Day 25 (Sun) — AC042 corpus port script + 45 staged cases + labeling worksheet [m5 day-25 ac042 prep]

Day-25 Sun buffer task (~2 hr) — eliminated the mechanical half of Monday's AC042 corpus-expansion blocker. Splits the prep into (a) deterministic schema port (this PR, done) + (b) ground-truth labeling (Yogesh Day-26 AM, ~2-3 hr down from previously-estimated 4-6 hr).

**Pipeline (3 scripts now):**

1. **`scripts/port-cpi-corpus.mjs`** (NEW) — one-shot mechanical port from `apps/api/test/golden-sets/a4/raw/cpi_postmortem_defects.json` (50 CUMI/PIM cases, no ground truth) to:
   - `apps/api/test/golden-sets/sherlock-rca/staged/def-006.json` … `staged/def-050.json` (45 staged files; synthesizes testCaseId TC-RET-901…945, runId via deterministic UUID-from-seed, stepNumber, stepLabel, durationMs, environment, errorMessage from description first 500 chars; placeholder groundTruth that Yogesh replaces)
   - `apps/api/test/golden-sets/sherlock-rca/LABELING-WORKSHEET.md` (85 KB · 45 sections; per case: synthesized fields summary + source description + cleaned `recent_comments` (Jira account-ID prefixes + ADF JSON blocks + screenshot markup all stripped) + YAML form block for Yogesh to fill)

2. **`scripts/apply-cpi-labels.mjs`** (NEW) — Day-26 executor. Reads filled worksheet → extracts YAML blocks → validates (rootCauseCategory must be 1 of 10 enums, rootCauseDetail ≥10 chars + no leftover "TODO", confidence must be high/medium/low, acceptableAlternatives must be subset of 10 enums) → dry-run by default; `--promote` flag required to actually write. On promote: updates staged JSON groundTruth + moves staged → live (`sherlock-rca/def-NNN.json`). Refuses to promote if ANY case is blocked.

3. **`apps/api/test/ac042-eval.ts`** (from PR #201, awaiting merge) — corpus-size-agnostic harness. Runs the binding AC042 in ~30-60 sec once corpus = 50.

**Cleaning logic in port:**

- Comment account-ID prefix: `^\d{2}/\w{3}/\d{2} \d{1,2}:\d{2} (AM|PM)?;712020:UUID;\s*` → `DD/MMM/YY: `
- Embedded ADF tables: `{adf:display=block}…{adf}` → `[ADF table elided]`
- Screenshot markup: `!Screenshot…!` → `[screenshot elided]`
- Whitespace normalization + truncation to 800 chars per comment for worksheet readability

**Field source mapping (Yogesh-correction-applied):** brief assumed `rca` + `root_cause_corrective_actions` would carry RCA evidence, but BOTH are 100% empty in the source corpus (0/50). RCA evidence is actually in `recent_comments` (avg 3/case) + `description` (41/50 cases). Worksheet sources from those instead.

**Coverage:** 41/50 cpi cases have descriptions → prioritized. 4 description-less cases included as fallback (errorMessage synthesized from title). Environments distributed: staging-iksula 14 / local-dev 18 / prod-iksula 13.

**Verification:** ran port + dry-run apply-cpi-labels → 45 sections parsed correctly, all 45 reported BLOCKED (rootCauseCategory empty + rootCauseDetail TODO + confidence empty), refused to promote — exactly the expected pre-labeling state.

**README update:** `apps/api/test/golden-sets/sherlock-rca/README.md` Status section refreshed (Day-18 stale → Day-25 current) with pipeline scripts inventory.

### Added — Day 25 (Sun) — AC042 Sherlock RCA eval harness [m5 day-25 — M5 close enabler]

Day-25 Sun P1 — built the AC042 eval harness that was missing pre-Day-25. `apps/api/test/ac042-eval.ts` loads any `def-*.json` from `apps/api/test/golden-sets/sherlock-rca/`, runs each through `SherlockOrchestratorService.runRca()` (per ADR-019), and scores top-2 hit rate + confidence calibration (≥0.8 threshold) per M4 plan §4.5 + ADR-019 AC042 spec.

**Design:**

- **Corpus-size-agnostic:** smoke run on 5 seed defects (today) and binding run on 50 (post Mon corpus expansion) use the same harness — no code change between runs.
- **Self-contained bootstrap:** `NestFactory.createApplicationContext(AC042EvalModule)` with `LLMGatewayService` injected directly (bypasses `LLMGatewayModule`'s controller graph which would drag `AuthService` → better-auth ESM chain). `runRca()` is a pure-function code path that never touches Prisma/Audit/Realtime, so those deps are wired to no-op fakes.
- **Scoring:** top-2 hit = `groundTruth.rootCauseCategory` OR any of `groundTruth.acceptableAlternatives` appears in orchestrator's top-2 hypothesis categories. Calibration = fraction of top-1 predictions with `confidence ≥ 0.8` that match ground-truth.
- **Output:** prints `AC042 RESULT: top-2 = X% · calibration = Y · crashes = Z/N · corpus n=N` + writes per-case JSON to `apps/api/test/golden-sets/sherlock-rca/results-YYYY-MM-DD.json`. Per-run output is gitignored after this first commit.

**Smoke run today (n=5, NOT the binding gate):**

- Harness plumbing GREEN end-to-end: 5 defects loaded, NestJS bootstrap clean (zero DI/ESM errors), 20 LLM calls dispatched via real `GroqProvider`, retry logic + 4-agent merge + scoring + reporting all worked, zero code crashes, ~5 sec total runtime.
- LLM responses: 0/20 successful — all returned `401 invalid_api_key`. Root cause: `GROQ_API_KEY` in `apps/api/.env` was the literal placeholder `REPLACE_ME` from `.env.example`, never populated in this worktree. Trivial Mon AM fix.
- Binding AC042 BLOCKED on (1) corpus expansion 5 → 50 (per `sherlock-rca/README.md` line 4 — Yogesh manual labeling task, plan staged at `.claude/scratch/ac042-corpus-expansion-plan.md`) + (2) valid `GROQ_API_KEY` in the apps/api/.env.

**Scripts:**

- New `apps/api/package.json` script: `ac042:eval` — runs `ts-node --transpile-only -P tsconfig.json test/ac042-eval.ts`.

**Gitignore:** future `results-YYYY-MM-DD.json` files are gitignored. Today's first run (broken-key 401 noise floor) is force-included as the worked-example artifact.

### Added — Day 24 — ADR-021 Reports backend: 6 report kinds + SWR cache + 02:30 IST aggregation cron [m5 day-24]

Day-24 P0 — ratified ADR-021 Reports backend impl. POST /api/reports endpoint with 6 report kinds (cycle_pass_rate, defect_age, agent_cost, sprint_progress, test_coverage, requirement_coverage), in-process LRU SWR cache (no Redis per Hard Rule 5), per-kind TTLs (5min/15min/30min/1hr), is_stale Amendment B sentinel, 02:30 IST daily aggregation cron + 15-min stale sweep.

**Migration `20260521090000_reports_backend_schema`:**

- New `report_aggregate` table — tier-1 pre-computed cache per ADR-021 §2. UNIQUE on (project_id, report_kind, time_range_key); 3 partial indexes (lookup hot path filters is_stale=false; sweep index targets is_stale=true).
- New `report_template` table — saved user configs per ADR-021 §1. Composite index on (project_id, owner_user_id) for the F23 Reports Studio template picker.
- New `sprint_current(project_id)` PL/pgSQL helper per ADR-021 §4. Depends on jira_sprints.state + start_date from PR #189 migration — sequencing critical (this PR branches from PR #189 head).

**Shared schemas (packages/shared/src/schemas/m5/report.ts):**

- `ReportKindSchema` enum + `ReportTimeRangeSchema` discriminated union (sprint/7d/30d/90d/custom)
- `ReportRequestSchema` (POST body) + `ReportResponseSchema` envelope (kind + projectId + timeRange + aggregatedAt + source + isStale + data)
- 6 per-kind data shape schemas (CyclePassRateData, DefectAgeData, AgentCostData, SprintProgressData, TestCoverageData, RequirementCoverageData)
- `ReportTemplateCreateSchema` + `ReportTemplateSchema`

**`ReportsService`** — POST /api/reports orchestrator:

- SWR (stale-while-revalidate) flow: lru-cache → report_aggregate.is_stale check → live compute path. Audit emits `report.cache_hit` / `report.cache_stale_swr` / `report.persisted_hit` / `report.computed` per branch (sync per api.md).
- UPSERT on (project_id, report_kind, time_range_key) for cron + on-demand convergence.
- 6 per-kind SQL builders via Prisma `$queryRaw` — defensive zero-shape return on empty data (Day-25 pilot tuning will sharpen the math; shapes are stable).
- `invalidate(projectId, kinds[])` — event-triggered hook (defects/runs call to flip is_stale=true + drop in-process cache for project).
- Template CRUD — `createTemplate` + `listTemplates` (owner-owned + isShared).

**`ReportsController`** — 3 endpoints under /api:

- `POST /api/reports` — @Roles(Admin/Lead/QAEngineer/Stakeholder); Zod-validated; calls `reports.run(workspaceId, request, actorId)`
- `POST /api/reports/templates` — @Roles(Admin/Lead/QAEngineer); Stakeholder excluded (read-only role)
- `GET /api/projects/:projectId/reports/templates` — @Roles(Admin/Lead/QAEngineer/Stakeholder)

**`ReportsRefreshCron`** — 2 schedules:

- `@Cron('30 2 * * *', { timeZone: 'Asia/Kolkata' })` — daily aggregation across (project × kind × window). Per-cell try/catch so a single failure doesn't crash the cron.
- `@Cron('*/15 * * * *')` — every 15 min stale sweep (mark rows >24h old).

**Module wiring:**

- `AppModule` imports `ScheduleModule.forRoot()` (first cron registration in the codebase) + `ReportsModule`.
- `ReportsModule` imports AuditModule + AuthModule; exports ReportsService for downstream invalidate() consumers.

**Deps added:** `@nestjs/schedule` + `lru-cache` (both free OSS; lru-cache in-process per Hard Rule 5 — no Redis).

**Tests (+33 vs Day-23):**

- 6 SWR cache tests (miss/hit/stale/persisted hit + invalidate + template lifecycle)
- 6 builder defensive-shape tests (empty data per kind)
- 7 controller tests (Zod validation + RBAC happy paths + template create + list)
- 4 cron tests (24-cell upsert × project, per-cell failure isolation, audit firing, zero-project no-op)
- 5 time-range helper tests (sprint/7d/30d/90d + custom + reject-bad-bounds + idempotency)

669/669 jest pass (+33). pnpm typecheck clean. pnpm exec prettier --check clean.

### Added — Day 24 — ADR-020 Jira webhook wire-up FINISH: Comment + Version + Property events [m5 day-24 — completes ADR-020 wire-up]

Day-24 P1 — completes ADR-020 webhook wire-up by adding the remaining 8 of 14 Atlassian event types. After this PR + #189, all 14 Atlassian webhook event families are routed end-to-end.

**Schema additions (`jira-webhook.schema.ts`):**

- `JiraWebhookCommentRefSchema` + 3 per-event schemas (comment_created / \_updated / \_deleted)
- `JiraWebhookVersionRefSchema` + 3 per-event schemas (jira:version_created / \_released / \_unreleased)
- `JiraWebhookPropertyPayloadSchema` — single schema for issue_property_set / \_deleted (discriminated on webhookEvent literal union)
- `WIRED_EVENT_TYPES` extended from 7 to 15 entries

**3 new handlers (audit-only — no DB tables for these event families in PM1):**

- `CommentWebhookHandler` (handleCreated / handleUpdated / handleDeleted) — Day-25 Sherlock cluster detection scans audit_log for jira_comment.\* actions
- `VersionWebhookHandler` (handleCreated / handleReleased / handleUnreleased) — release tracking deferred to M6 with jira_versions table + report.release_health kind
- `PropertyWebhookHandler` (handle — discriminated by webhookEvent) — LOW-priority no-op + forensic audit; PM1 has no use case for issue properties

All 3 handlers resolve `{workspaceId, projectId}` from first active jira_connection (single-tenant pilot pattern from Day-23 SprintWebhookHandler). Drains silently if no connection.

**Dispatch extension (`webhook-processor.service.ts`):**

- 8 new `case` arms in the dispatch switch — each Zod-validates the payload before invoking the handler. Failures rethrow per Day-23 retry-with-backoff pattern.
- `JiraSyncModule` registers the 3 new handlers as providers.

**Tests (+20 vs PR #189 base):**

- 12 handler-spec tests (4 per handler: 3 event types × happy path + 1 no-connection drain)
- 8 dispatch tests in webhook-processor.service.spec.ts (3 comment + 3 version + 2 property)
- 1 existing test updated: the "unwired event type" test now uses `worklog_created` since `comment_created` is now wired

656/656 jest pass (+20 vs PR #189 base). pnpm typecheck clean. pnpm exec prettier --check clean.

### Added — Day 23 — ADR-020 Jira webhook wire-up: Issue + Sprint event routing [m5 PARTIAL — Day-24 adds Comment+Version+Property]

Day-23 P1 — implements 7 of 14 Atlassian webhook event types per ADR-020 ratified. Replaces PR #186's stub handler with real per-event-type dispatch + Sherlock trigger logic + soft-delete semantics + audit chain integrity per Hard Rule 7.

**Migration `20260520120000_jira_sync_sprint_columns`:**

- New `jira_sprints` table — TEXT id (Atlassian numeric serialized as string) + `project_id` FK + state CHECK(active/closed/future) + dates + board_id + `deleted_at` for soft-delete
- New columns on `jira_issues` — `sprint_*` denormalization (6 cols), `deleted_at`, `priority`, `assignee_account_id`, `resolution`, `labels JSONB` for delta-tracking
- 4 partial indexes — `idx_jira_sprints_project_active` (ADR-021 `sprint_current()` dependency), `idx_jira_sprints_project_state`, `idx_jira_issues_sprint_active`, `idx_jira_issues_deleted_at`

**`IssueWebhookHandler`** (new, 3 events):

- `handleCreated` — UPSERT row with denormalized sprint + priority + audit `jira_issue.created`
- `handleUpdated` — UPDATE delta-tracked fields + audit `jira_issue.updated` with `changedFields[]` + **Sherlock trigger** IF (prev status≠Done && new status==Done) OR (priority bumped on `Lowest<Low<Medium<High<Highest` ladder); only when linkedDefectId present
- `handleDeleted` — SOFT-DELETE (`deleted_at`=NOW; never hard delete per Hard Rule 7) + audit

**`SprintWebhookHandler`** (new, 4 events):

- `handleCreated` / `handleUpdated` / `handleDeleted` / `handleClosed` — UPSERT/UPDATE/soft-delete + audit
- `sprint_updated` future→active transition logs cache-invalidation hook (M6 LISTEN/NOTIFY `qa_nexus.cache.report.invalidate` channel per ADR-021 §3 ratified)
- `sprint_closed` logs sprint-summary aggregation hook (M6 ADR-021 tier-1 precompute)
- **Critical:** Sprint events filter by `project_id` APP-SIDE — Atlassian webhook subscription does NOT support JQL filtering per ADR-020 §6

**`WebhookProcessorService` refactor:**

- `handleNotification` now fetches full `payload` JSONB + dispatches by `eventType`
- 7 wired event types; unwired (comment*\*, version*\_, property\_\_) absorbed with `markProcessed(id, 'unwired_event_type')` to drain staging table — Day-24 wires the rest
- Signature-invalid rows marked + skipped
- Handler exception rethrows (leaves `processed=false` for Day-24 retry-with-backoff sweep)

**Zod schemas** (`jira-webhook.schema.ts`):

- 7 event-specific payload schemas with discriminator `webhookEvent` literals
- `JiraWebhookSprintRefSchema` + `extractCurrentSprint()` helper (active > most-recent-closed > NULL precedence per Atlassian multi-valued sprint semantics)
- `isWiredEventType()` type guard + `WIRED_EVENT_TYPES` constant for dispatcher safety

**Module wiring:** `JiraSyncModule` imports `SherlockOrchestratorModule`; registers both handlers as providers.

**Tests:** 54/54 suites pass; **636 tests pass** (+19 vs Day-22: 10 dispatch + 7 IssueHandler + 6 SprintHandler). Sherlock trigger logic specifically covered: status→Done, priority bump, no-trigger on routine update, no-trigger without linked defect, no-trigger on downgrade, no-trigger on create.

**Cost gate:** Migration adds 1 table + 10 cols + 4 partial indexes (~15KB at pilot scale, <0.1 CU-hr/day). No new deps. Sherlock trigger uses existing `runAndPersist` (#178) async pipeline — zero added LLM cost until pilot Atlassian connection (Day-24 P2).

**Scope cut (PARTIAL):** Day-24 adds the remaining 7 Atlassian event types (comment_created/updated/deleted, version_created/released/unreleased, property_set/deleted) + retry-with-backoff scanner via `@nestjs/schedule` + DLQ at MAX_RETRIES + ADR-021 reports backend implementation start.

### Fixed — Day 22 — xlsx → exceljs swap (CVE remediation, Kimi K2 HIGH followup) [m5]

Day-22 P0c (followup to Kimi K2's Day-19 HIGH triage) — replaced abandoned `xlsx` (SheetJS CE 0.18.5) with actively-maintained `exceljs@^4.4.0` (Apache 2.0, ~1.9M weekly DLs).

**Live HIGH advisories closed:**

- `GHSA-4r6h-8v6p-xvw6` — Prototype Pollution in sheetJS (`<0.19.3`, no patched version)
- `GHSA-5pgg-2g8v-p4x9` — Regular Expression Denial of Service / ReDoS (`<0.20.2`, no patched version)

Both showed in `pnpm audit --prod` with patched versions `<0.0.0` — SheetJS maintainer moved fixes to paid model. Override pinning was not viable; library swap was the only path.

**Surface:** 2 callsites only (`apps/api/src/chunking/parsers/xlsx-parser.ts:17` + `__tests__/parsers.spec.ts:11`) — direct refactor; no `lib/spreadsheet.ts` adapter needed (below 3-callsite threshold per HURDLE-1 mitigation).

**API mapping:**

- `XLSX.read(buffer, {type:'buffer'})` → `new Workbook(); await wb.xlsx.load(buffer as ArrayBuffer)` (parseXlsx now async)
- `workbook.SheetNames` + `XLSX.utils.sheet_to_json(sheet, {header:1, defval:null})` → `wb.eachSheet((ws) => ws.eachRow({includeEmpty:true}, row => row.values.slice(1)))`
- `XLSX.utils.book_new/aoa_to_sheet/book_append_sheet + XLSX.write` (test fixture) → `new Workbook(); ws.addWorksheet/addRow + await wb.xlsx.writeBuffer()`
- New `stringify()` branches handle ExcelJS rich-text (`{richText:[]}`), formula (`{formula, result}`), and hyperlink (`{text, hyperlink}`) cell shapes so embeddings see rendered values.

**pdf-parse:** NOT in audit output → confirmed clean → deferred to M6 hygiene followup (saves ~2 hr of Day-22 budget — see `.claude/scratch/day-22-p0a-cve-triage-memo.md`).

**Test plan:** 51/51 test suites pass; 610 tests pass. 4 parseXlsx tests rewritten as async; output shape (chunk count, metadata.sheet, lineRange, idempotency) byte-equivalent to xlsx behavior.

**Cost gate:** Zero new DB calls, zero new env requirements. ExcelJS bundle ~1.7 MB unpacked vs xlsx ~1.4 MB — negligible on Render Hobby. Neon CU-hr untouched.

### Added — Day 22 — Jira webhook receiver scaffold per ADR-020 §7 ratified [m5 PARTIAL — wire-up Day-23]

Day-22 P1 — implements the async webhook pipeline mandated by ADR-020 §7 (≤500ms p95 hot-path budget; LISTEN/NOTIFY for fan-out per Hard Rule 5 no-Redis).

**Migration** (`20260519080000_jira_webhook_retry_count_and_notify_trigger`):

- `jira_webhook_events.retry_count INT NOT NULL DEFAULT 0` — populated by Day-23 retry-with-backoff loop
- `(processed, received_at)` index — fallback unprocessed-queue scan if the LISTEN subscriber misses an event (process crash)
- `notify_webhook_received()` plpgsql function → `pg_notify('webhook_received', NEW.id::text)`
- AFTER INSERT trigger on `jira_webhook_events` invoking the function. Channel `webhook_received` is generic so future webhook sources can reuse the fan-out pattern.

**`JiraSyncService.persistWebhookEvent(input)`** (new): INSERTs the staging row inside the request handler before returning 200. Atlassian's `X-Atlassian-Webhook-Identifier` header becomes the UNIQUE `event_id`; retries collapse on the UNIQUE constraint and return `'duplicate'` for absorbing-200-OK semantics. Body-hash fallback when the header is absent.

**`JiraSyncController.webhook()`** (flipped to async): HMAC verify → JSON parse → Zod validate → `persistWebhookEvent()` → audit fire-and-forget → 200 OK with `{ ack, duplicate, eventId, eventType, issueKey }`. The AFTER-INSERT trigger fires `pg_notify` to reach the processor — the controller never awaits the LLM/Sherlock work.

**`WebhookProcessorService`** (new — pg-listen subscriber): boots in `OnModuleInit` (skipped in `NODE_ENV=test`), connects via `pg-listen@^1.7.0` on a dedicated Postgres connection (separate from Prisma pool), listens to `webhook_received`. On notification: fetches the row, logs the stub, marks `processed=true` via `markWebhookProcessed`. Day-23 wire-up replaces the stub with handler logic.

**Robustness:** `pg-listen` auto-reconnects on connection drop. Per-notification handler wrapped in try/catch so a bad event can't crash the subscriber loop. `OnModuleDestroy` closes cleanly.

**Tests:** 52/52 suites pass; **617 tests pass** (+7 vs Day-22 start: 4 for WebhookProcessor.handleNotification + 3 for persistWebhookEvent). Existing `jira-sync.controller.spec.ts` updated for the async signature + new response shape.

**Cost gate:** +1 row/webhook to `jira_webhook_events`. At 8-user × ~10 webhook/min sustained pilot peak = ~5k rows/day. Neon CU-hr impact <0.5/day. Well under 100/cap.

**Scope cut (PARTIAL tag):** Day-23 wire-up adds: routing per `webhookEvent` (jira:issue_created → DefectsService.createFromJira; jira:issue_updated → status sync), Sherlock trigger on relevant events, sync-state delta writes, WebSocket `defect.updated` emit, retry-with-backoff (with `retryCount` increment + DLQ at MAX_RETRIES).

### Added — Day 21 — Sherlock orchestrator hardening: DB persistence + async/WS + audit [m5 da]

Day-21 P0 followup `(da)` — closes the 3 hardening gaps left from PR #173 (synchronous-only Day-20 path).

**(a) 5-layer RcaReport schema adapter.** New `SherlockOrchestratorService.runAndPersist(input, ctx)` method: AgentRun row (kind=A4, status=running) → 4-agent fan-out → RcaReport persistence with 5-layer JSONB mapping (flake→L1_stack, env→L2_env, L3_config empty for future env-config split, code→L4_code, data→L5_data) → AgentRun complete → audit row → WS emit. Failure path marks AgentRun failed + writes `rca_failed` audit row, does NOT emit WS (subscribers detect via AgentRun status). Refactored 4-agent fan-out into private `runFanout()` so sync `runRca()` (Day-20 path, preserved) and async `runAndPersist()` share fan-out logic.

**(b) Async 202+WS pattern.** `DefectsController.kickoffRca` flipped: validates UUID+body, resolves workspaceId via defect→project lookup (doubles as 404 check), pre-allocates runId, spawns orchestrator via `setImmediate`, returns `202 + { defectId, runId, accepted: true, wsChannel: "rca.complete.<runId>" }`. `RealtimeGateway.emitRcaComplete(runId, payload)` — new public emit method on existing channel-fanout pattern. FE subscribes to `rca.complete.<runId>` BEFORE firing the request.

**(c) Audit writes (HMAC chain per ERD §3.13).** `rca_kicked_off` written SYNC before 202 (a failed audit fails the request per `.claude/rules/api.md`). `rca_completed` / `rca_failed` written SYNC within orchestrator scope, before WS emit (durable-before-notify).

**Test plan:** 49/50 suites pass at PR-open time (1 pre-existing test-runs ESM trap fixed by PR #174). 12 new defects.controller tests for async contract + new jest.mock pattern for orchestrator.service spec. Smoke once merged: POST `/api/defects/:id/rca` → 202 + runId; FE subscribes to wsChannel; receives `rca.complete` event when persistence + audit + 5-layer RcaReport row are all durable.

**Cost gate (Hard Rule 1):** +0.5-1 CU-hr/day at 8-user pilot load (2 Prisma writes + 1 RcaReport row + 1-2 audit rows + 1 WS emit per RCA). Neon ~82/100 CU-hr — safely under cap.

### Fixed — Day 21 — Kimi K2 HIGH triage (4 items): open-redirect, ws rate-limit, hmac-at-boot, zod-extract [m5 hardening]

Closes all 4 HIGH-severity items from Kimi K2's Day-19 security review. Bundled as one PR with 4 independently-revertable commits.

**(c) HMAC secret loaded at boot, not per-write.** `AuditService.onModuleInit()` loads + validates `BETTER_AUTH_SECRET` once at boot (min 32 chars, app crashes if missing — chain integrity is binding per PM1_ERD §3.13 + Hard Rule 7). Stored in `private readonly this.secret`. `writeAuditRow()` now takes secret as a required param. Previously read `process.env` on every write + every `verifyChain()` call — slow + late-failing + could silently sign half the chain with old secret + half with new during rotation.

**(d) Auth Zod schemas extracted to `@qa-nexus/shared`.** New `packages/shared/src/schemas/auth.ts` exports `SignUpBodySchema` + `SignInBodySchema` (+ inferred types). FE can now use the same schema for react-hook-form + zodResolver, preventing drift where FE accepts inputs the BE rejects.

**(a) callbackURL validated against trusted-origins allowlist.** Closes magic-link → phishing chain (`?callbackURL=https://evil.com`). New `apps/api/src/auth/callback-url.ts` with `parseTrustedOrigins()` + `isTrustedCallbackUrl()` helpers (14 unit tests). Defense-in-depth at two points: (1) sign-up/sign-in intake rejects 400 `UntrustedCallbackURL`; (2) callback redirect rewrites to `/home` (don't lock out legitimate users). Allowlist via `TRUSTED_CALLBACK_ORIGINS` env CSV. Same-origin relative paths (`/home`) always allowed; protocol-relative (`//evil.com`) always rejected.

**(b) WS rate limit + connection ceiling.** `RealtimeGateway.handleConnection` adds two layers BEFORE the Prisma auth lookup: (1) global ceiling via `MAX_WS_CONNECTIONS` env (default 100) — close `4409 capacity exceeded`; (2) per-IP token bucket (capacity 10, refill 10/min) — close `4408 rate limited`. Per-IP buckets GC'd every 60s after 5min idle. `connectionCount` decremented in `handleDisconnect` with double-disconnect clamp. 8-user pilot has 12.5x headroom on ceiling + 60x on bucket — guards catch abuse, never normal traffic.

**Test plan:** 51/51 test suites pass; 607 tests pass (+14 callback-url tests; 5 verifyChain tests reworked for boot pattern). Smoke once merged: untrusted callbackURL → 400 UntrustedCallbackURL; 11 rapid WS connects from one IP → 11th close 4408.

### Changed — Day 21 — Hard Rule 18 Day-21 amendment Part 4 + frame-port skill v2.2 (BEM-class section detection + nested-section-count inverse probe)

**Part 4 — BEM-class section detection + nested-section-count inverse probe.** Codified 2026-05-18 (Day-21 AM) after F21 v2.1.2 closeout surfaced a structural-detection gap in extract-spec v2: per-frame v2 canonical HTML uses BEM-style class tokens for sections (`sd-tabs`, `sr-layers`, `def-shell`, `cl-class`, `rs-stats`, etc.) on plain `<div>` elements. The generic `STRUCTURAL_CLASS_HINTS` list missed these because each frame coins its own short prefix; we can't enumerate them all up-front. Result: 5 F21 sections silently dropped from `spec.json`; per-selector probes were blind because there was no probe to fail. Caught only by Yogesh manual visual gate during F21 Round-5.

**`extract-spec.mjs` v2.2 gap fix:** `isSectionLike()` adds BEM heuristic — `<div>` / `<section>` where `classList[0]` matches `/^[a-z]+(-[a-z]+)+$/` AND has either a heading child (h1-h6) OR ≥3 text-bearing children. Tailwind utility prefixes explicitly excluded (`bg-`, `text-`, `p-`, `m-`, `w-`, `h-`, etc.) — canonical v2 HTML doesn't use Tailwind; the exclusion is a safety net for future mixed-mode files. Surfaces the 5 F21 misses (sd-tabs L490-499, PEOPLE L1180-1186, sr-layers L1199-1204, group separators L819+L944+L1063, Assignee filter L778) without re-listing each per-frame token.

**`diff-probe.mjs` v2.2 nested-count inverse probe:** Per-parent bidirectional aggregate sanity check on top of per-selector probes. For each PASSED parent probe with >0 nested sections in canonical, count nested-section-like descendants on BOTH sides via the matched parent selector:

- **MATCH** — counts equal; structural fidelity confirmed
- **MISSING** — port < canonical; structural incomplete (BLOCKS, sets `failed = true`)
- **POTENTIAL_INVERSION** — port > canonical; Rule 17 spirit violation candidate (WARNS, does not block)

Why per-parent nested count on top of per-selector probes: per-selector probes only catch sections that EXIST in `spec.json`. If extract-spec missed a section, per-selector probes can't catch the miss. The nested count compares structural-mass under each matched parent and surfaces drift the per-selector approach is blind to. MISSING blocks (React port dropped canonical content — defect); POTENTIAL_INVERSION warns only (React port added unverified extras — worth investigating but not necessarily wrong).

**CLAUDE.md amendment:** Hard Rule 18 Day-21 Part 4 codifies both contracts + adds 4 new forbidden patterns (silencing via React noise, inventing canonical sections, treating nested-count as authoritative, skipping spec regeneration on existing frames).

**Skill arc Day-18 → Day-21:** v1 → v2 → v2.1 → v2.1.1 → v2.1.2 → v2.2. Each iteration < 60 min, each catching a real failure mode (Finding A on Tailwind class-only false-positive, Finding B on shell-substitution pixel floor, Bug A on asymmetric crop, Bug B on v1-spec backward-compat, Case C on AA inflation, Case AMBER on renderer-noise floor, **Part 4 on BEM-class detection gap**). Close-and-redo loop applied at tool layer, not at PR layer.

---

## [M4] - 2026-05-17

### Changed — Day 19 — Hard Rule 18 Day-19 amendment Parts 1 + 2 + 3 + frame-port skill v2.1.2 (final — ARIA-primary + UNION crop + AA tolerance + GREEN/AMBER/RED band system)

**Part 3 — GREEN / AMBER / RED band system** (Day-19 late afternoon, after F21 v2.1.2 validation reached the renderer-noise floor).

**F21 v2.1.2 final result: AMBER (5.2-6.6% across all viewports, 10x improvement from v2.1.1).** Floor reached. Industry research validates the 2-4% cross-renderer noise floor on perfectly-aligned ports due to rasterization variance + font hinting + lucide vs inline-SVG. F21 sits just above that floor (~1-2% real visible drift + ~3-5% renderer floor), so the skill is working as designed.

**Three-band gate replaces binary 5% pass/fail:**

- **GREEN** — diff < 5% on ALL viewports. Structural sanity auto-passes; Yogesh visual gate is fast-check approval.
- **AMBER** — diff 5-10% on any viewport, DOM probe ≥ 60% sections PASS via PRIMARY (ARIA) or SECONDARY (class). Yogesh visual gate required; expected approval. Notes in PR description.
- **RED** — diff > 10% on any viewport OR DOM probe < 60% sections PASS. Real port drift; iterate TSX. Re-probe after each fix.

**Why three bands:** A binary 5% gate produces either false-positives (AMBER ports look fine to humans but probe fails) or false-negatives (RED is silenced if threshold is loosened to accommodate AMBER). Industry-standard pattern (Chromatic, Percy, Lost Pixel, Cypress all support tri-band). Visual gate (Hard Rule 13) remains authoritative for AMBER and GREEN — diff-probe is structural sanity check + drift early-warning, not the product gate.

3 new forbidden patterns: loosening pixel threshold above 10% to make RED ports auto-pass · skipping Yogesh visual gate for AMBER · marking PR ready-for-review on RED without iteration.

**PR #158 LIFTING HOLD — ready for merge.** Skill iteration arc Day-18 PM → Day-19 EOD: v1 → v2 → v2.1 → v2.1.1 → v2.1.2 + Hard Rule 18 amendments Parts 1+2+3. Each iteration < 30 min, each catching a real failure mode (Finding A on Tailwind class-only false-positive, Finding B on shell-substitution pixel floor, Bug A on asymmetric crop, Bug B on v1-spec backward-compat, Case C on AA inflation, Case AMBER on renderer-noise floor). Close-and-redo loop applied at tool layer, not at PR layer.

### Changed — Day 19 AM — Hard Rule 18 Day-19 amendment Parts 1 + 2 + frame-port skill v2.1.2 (pixelmatch AA tolerance + report.json fix)

**v2.1.2 fix (Day-19 ~13:00, after FE+1's F21 validation showed pixel-diff math overstating visible drift by ~4x — Case C):**

- **Bug C — pixel-diff inflating drift via anti-aliasing.** v2.1.1 used sharp raw RGBA Manhattan distance with threshold 24 (no AA awareness). Every anti-aliased font glyph + lucide icon stroke + sub-pixel line-height edge counted as full-pixel drift — 3-4x inflation over visible content drift. Evidence from FE+1's F21 inspection: visual side-by-side at 1440px was ~85-90% structurally aligned but pixel-diff reported 44.7%. **Fix:** switched `comparePngs()` to `pixelmatch` with the same options as the project's playwright VR config (`apps/web/tests/visual/playwright.config.ts`): `threshold: 0.2`, `includeAA: false`, `alpha: 0.1`. pixelmatch's AA detection naturally filters glyph + icon edge noise.
- **Bug D — report.json `pixelDiff` serialization defensive fallback.** Reports could show `pixelDiff: undefined` when JSON.stringify dropped the field on edge cases (NaN, crop failure). **Fix:** force null when measurement absent; emit BOTH `pixelDiff` and `pixelDiffPct` aliases in the report so external tooling (FE+1's overlay, BE+1's VR runner) can find the value regardless of naming convention.
- **CLAUDE.md amendment Part 2 — "Anti-alias tolerance" clarification (v2.1.2 Day-19 line):** pixelmatch options MUST include `includeAA: false` and `threshold: 0.2`. Manhattan-distance pixel comparison (v2.1.1 and earlier) was a v2.1.2 implementation bug fixed in v2.1.2 and must never recur. Consistent with VR baseline matching so the two systems agree on what "drift" means.
- **`pixelmatch@^7.2.0` added to root devDependencies.** Pulled in directly. Sharp continues to handle PNG decode + resize + crop (no new PNG-decoder dep).

**v2.1.2 smoke (F21 v2 canonical vs /home/ React, all 4 viewports — same cross-page smoke as v2.1.1):**

| Viewport | v2.1.1 (raw Manhattan) | v2.1.2 (pixelmatch + AA-off) | Improvement |
| -------- | ---------------------- | ---------------------------- | ----------- |
| 320      | 69.33%                 | **7.45%**                    | -10x        |
| 768      | 70.30%                 | **6.55%**                    | -10x        |
| 1024     | 66.40%                 | **6.50%**                    | -10x        |
| 1440     | 62.73%                 | **6.16%**                    | -10x        |

Remaining 6-7% diff is REAL drift between two completely different pages (F21 Defects Hub vs /home/ Home Page). For FE+1's actual F21 React port vs F21 canonical, expected diff drops to the 1-5% range (under threshold). `report.json` fields populated correctly: `pixelDiff=0.0745...`, `pixelDiffPct=0.0745...`, both per-viewport.

PR #158 force-pushed `33946ea` → new SHA with v2.1.2 fixes. FE+1 to re-validate against F21 with overlay.

### Changed — Day 19 AM — Hard Rule 18 Day-19 amendment Parts 1 + 2 + frame-port skill v2.1.1 (ARIA-primary probe + UNION content-region pixel crop)

**v2.1.1 fix (Day-19 mid-morning, after FE+1's F21 validation surfaced two implementation bugs in v2.1):**

- **Bug A — asymmetric content-region crop.** v2.1 measured shell dims on the React port only and applied the SAME crop to canonical. Canonical has its OWN custom shell with DIFFERENT dimensions; same-crop clipped canonical's content on the left and widened diff at larger viewports (F21 1024: v1 full=39.9% → v2.1 content=47.0% / 1440: 39.1% → 44.7%). **Fix:** measure shell separately on both sources, take UNION (`crop_x = max(canonical_rail, port_rail)`, `crop_y = max(canonical_topbar, port_topbar)`). Applies same union crop to both screenshots so neither shell intrudes on the comparison.
- **Bug B — SECONDARY class-name matcher silently dropped on v1 spec.jsons.** v2.1's probe builder read `n.aria_signal.classes` (v2 schema path) but v1 spec.jsons have classes at top-level `n.classes` only — no aria_signal block exists. Result: probes built from v1 specs had ZERO tiers (no PRIMARY because most non-semantic-tag sections have no role/aria; no SECONDARY because the path didn't fall back to `n.classes`; no TERTIARY). Sections like `def-shell` / `def-head` / `def-toolbar` showed `NEITHER` even though canonical HTML had the classes right there. **Fix:** read from BOTH paths — `sig.classes ?? n.classes`, `sig.role ?? n.role`. Backward-compatible with v1 specs; class-match SECONDARY tier now fires unconditionally for any section with class tokens.
- **Report.json envelope extended** — per-viewport entry now includes `canonicalShellBounds` + `portShellBounds` + `cropBounds` (the union) so reviewer can verify what was measured on each side AND what was excluded from the diff.
- **CLAUDE.md amendment Part 2 clarification (Day-19 v2.1.1 line):** "Union crop is mandatory" — single-source measurement is a v2.1 implementation bug fixed in v2.1.1 and must never recur. Inserted as a 1-line tightening of Hard Rule 18 Day-19 amendment Part 2.

**v2.1.1 smoke (F21 v2 canonical vs /home/ React, all 4 viewports):**

- Bug A fix validated: at 1440px viewport, both `canonical: rail=240px topbar=56px` AND `port: rail=240px topbar=56px` measured separately → union=240. At 320px both fall to 0 (mobile drawer overlay). At 1024 both 240. Union working correctly.
- Bug B fix validated: `def-shell` / `rail-content` / `rail-foot` all report `C-tier=SECONDARY` (matched via class on canonical) where v2.1 would have shown NEITHER. Their "MISSING" status is REAL drift (F21 Defects Hub sections absent in /home/ React, which is the home page — expected for cross-page smoke).
- PRIMARY tier still firing correctly: `rail` (aside tag) and `railCollapseToggle` (id-with-role) both PRIMARY-match on both pages.

PR #158 force-pushed `dea1d74` → new SHA with v2.1.1 fixes. FE+1 to re-validate against F21 with overlay.

### Changed — Day 19 AM — Hard Rule 18 Day-19 amendment Parts 1 + 2 + frame-port skill v2.1 (ARIA-primary probe + content-region pixel crop)

**Closes structural false-positive on Tailwind React ports surfaced by F21 Day-19 Finding A. ARIA roles + labels are now the binding HTML ↔ React contract.**

The v1 `diff-probe.mjs` matched sections by class name (`.rail`, `.def-shell`). Tailwind-based React ports use utility classes (`className="flex shrink-0 flex-col"`) per Hard Rule 5 + Tailwind convention — so the v1 probe returned 0% structural presence on every Tailwind port regardless of port quality. Would have blocked every M4 frame port through the skill.

**v2 changes (PR #158 extension):**

- `diff-probe.mjs` — three-tier OR-semantics matching: PRIMARY (`role` + `aria-label`) → SECONDARY (class-name substring, v1 fallback) → TERTIARY (`data-canonical-section` escape hatch). Section PRESENT = any tier matches. Output table shows matched tier per side (C-tier / P-tier) for diagnostics.
- `extract-spec.mjs` — emits `aria_signal: { role, aria_label, classes[], data_canonical_section }` per section + top-level `schemaVersion: 2`. Backward compatible — v1 spec.jsons still valid input but produce less precise structural matching.
- `SKILL.md` — Step 5 docs updated with three-tier strategy + new "Tailwind React port note" explaining why ARIA is primary signal.
- `CLAUDE.md` Hard Rule 18 — Day-19 amendment block inserted between "Workflow tools" and "The close-and-redo precedent". Codifies the binding HTML ↔ React contract (ARIA mandatory, class names diverge by design), documents the three-tier matching strategy, adds 3 new forbidden patterns (drop aria-label, change role, abuse data-canonical-section as workaround).

**Smoke test (F08b canonical vs production /home/):** v2 PASS rate jumped from 2/5 → 4/5 selectors at every viewport (320/768/1024/1440). Remaining MISSING is real M2 drift (`stage` section in canonical wireframe, absent in production /home/) — diff-probe correctly identified real drift instead of false-positive. Pixel diff still 53-61% (real M2 wireframe-vs-production drift, expected calibration baseline).

**v2.1 changes (added same PR):**

- `diff-probe.mjs` `--scope content` (default) | `--scope full` (debug). Content scope crops both canonical + React port screenshots to the `<main>` region BEFORE pixel-diff, then applies strict 5% threshold (blocks). Full scope returns to 50% warning-only.
- `measureContentBounds(page, vp)` helper queries the React port's AdminShell dimensions at runtime (rail width via 6 selector candidates, topbar height via 5 candidates) and returns a clamp-safe crop rectangle. Falls back to rail=0 + topbar=64 if AdminShell selectors don't resolve.
- `comparePngs(canonical, port, vp, cropBounds)` extends to apply `sharp.extract()` with the same crop to both images before raw RGBA Manhattan-distance compare.
- `report.json` envelope: top-level `scope` + `pixelThreshold` + `pixelBlocks` + `schemaVersion`; per-viewport entry includes `cropBounds` so reviewers can verify what was compared.
- `CLAUDE.md` Hard Rule 18 — Day-19 amendment Part 2 inserted after Part 1: codifies the two-canonical model (SHELL canonicalized via F19 React per Rule 14, CONTENT canonicalized via v2 HTML per Rule 15), 3 new forbidden patterns (modify AdminShell to match a frame's custom shell, use --scope full to override the gate, re-baseline canonical from React port output), CLI surface docs.
- `SKILL.md` Step 5 — content-region pixel diff explanation + two-canonical model footnote (v1 wireframes in `frame  html view/` need `--scope full` because they pre-date AdminShell).

**v2.1 smoke test (F08b /home/):** rail=240px + topbar=56px detected correctly. F08b is a v1 wireframe so content-crop misaligns vs canonical (expected — v1 has no parallel shell layout). FE+1 will validate v2.1 against F21 (v2 frame, the real target — expected pixel diff drops from 38-40% → likely 5-15% as shell-substitution noise drops out and only real content drift remains).

PR #158 force-pushed with the v2 + v2.1 amendments landing alongside the original v1 polish work.

---

### Added — Day 20 — Sherlock RCA orchestrator + 3 sibling agents + DefectsController.rca [M4 TASK A4-A8]

**P1 per Day-20 plan + ADR-019.** Completes the Sherlock RCA fan-out architecture begun by PR #161 (agent #1 code). Wires the orchestrator + 3 sibling agents (data on gpt-oss-120b for long-context; env + flake on gpt-oss-20b for fast classification) + functional `POST /api/defects/:id/rca` endpoint.

**Files (10 new + 4 modified, ~1100 LOC + 19 net-new tests):**

- **NEW** `apps/api/src/agents/sherlock-orchestrator/sherlock-orchestrator.service.ts` — `runRca(input)` Promise.all fan-out + 30s per-agent timeout + deterministic dedupe-by-(category, hypothesis-prefix-100) merge + 2-of-4 tolerance per ADR-019 §6. Returns `{ runId, status, okAgentCount, hypotheses }` synchronously.
- **NEW** `apps/api/src/agents/sherlock-orchestrator/sherlock-orchestrator.module.ts` — wires all 4 agent services.
- **NEW** `apps/api/src/agents/sherlock-data/sherlock-data.service.ts` — gpt-oss-120b · long-context for data-rooted defects (fixture drift, NULL fields, schema mismatch). Re-tags agent='data' on output.
- **NEW** `apps/api/src/agents/sherlock-env/sherlock-env.service.ts` — gpt-oss-20b · fast env-config classification.
- **NEW** `apps/api/src/agents/sherlock-flake/sherlock-flake.service.ts` — gpt-oss-20b · retry-pattern flake detection.
- **NEW** `apps/api/src/agents/sherlock-orchestrator/__tests__/sherlock-orchestrator.service.spec.ts` — 9 tests (runId/status/okAgentCount return shape + invalid-input + deterministic merge × 4 + 2-of-4 tolerance × 4 including agent contract-violation defense).
- **NEW** `apps/api/src/agents/sherlock-data/__tests__/sherlock-data.service.spec.ts` — 5 tests representative for siblings (happy path + gpt-oss-120b model assertion + retry exhaustion + malformed JSON + invalid input).
- **MODIFIED** `apps/api/src/agents/sherlock-code/schemas.ts` — widened `agent: z.literal('code')` → `z.enum(['code','data','env','flake'])`. Added `SHERLOCK_AGENTS` export. Sibling agents reuse this schema for input + hypothesis output.
- **MODIFIED** `apps/api/src/agents/sherlock-code/sherlock-code.service.ts` — re-tags output to `agent='code'` defensively (symmetric with siblings; defends against LLM prompt-drift mis-tagging).
- **MODIFIED** `apps/api/src/defects/defects.controller.ts` — `POST :id/rca` becomes FUNCTIONAL: UUID validation → Zod body validation → orchestrator call → 200 + `{ defectId, runId, status, okAgentCount, hypotheses }` inline. Other 4 endpoints stay 501 stubs (DefectsService CRUD lands Day-21+).
- **MODIFIED** `apps/api/src/defects/defects.module.ts` — imports `SherlockOrchestratorModule`.
- **MODIFIED** `apps/api/src/defects/__tests__/defects.controller.spec.ts` — extends with 4 new tests for POST :id/rca (happy + invalid UUID + Zod body fail + degraded status propagation).
- **MODIFIED** `apps/api/src/app.module.ts` — updated DefectsModule comment to reflect Day-20 partial-functional state.

**Critical contract (binding):**

- `runRca()` NEVER throws — all 4 agent services already never-throw by contract (ADR-019 §6). Timeouts collapse to empty arrays. Worst case: all 4 timeout → `{ status: 'degraded', hypotheses: [] }`.
- Deterministic merge: dedupe by (category, hypothesis-prefix-100) keeping higher-confidence; sort by confidence DESC then category ASC; cap at MAX_HYPOTHESES=10.
- Sibling agents inherit input schema from sherlock-code/schemas.ts (single source of truth). Each re-tags `agent` field on output to its own literal.

**Scope cuts deferred to Day-21 (followup `(da)`):**

- **NO DB persistence** — existing `RcaReport` prisma model (TB-016 from #144) uses pre-ADR-019 5-layer JSON design (`layer1StackJson..layer5DataJson` + per-layer confidences + `topHypothesis` + `createdByAgentRunId`). Flat hypothesis array doesn't map cleanly. Day-21 picks adapter strategy (5-layer mapping vs migration to flat array).
- **NO async 202+WS** — orchestrator returns synchronously; controller returns inline. p95 latency expected <5s; Day-21 flips to 202+`{runId}` + background fan-out + WS emit if real ops show >5s. Requires `RealtimeGateway.emit()` public method (Day-21 addition).
- **NO audit writes** — `defects.rca_kicked_off` + `defects.rca_completed` rows deferred to Day-21 (DefectsService CRUD landing).

**Pre-push gates 5/5 ✓:** prettier ✓ · typecheck ✓ · **543/543 jest** (524 baseline on `feat/be-sherlock-code-agent` + 14 net-new orchestrator/sibling specs + 5 new functional defects-controller tests; some pre-existing stub-contract reused) · lint clean ✓ · CHANGELOG ✓.

**Cost-gate:** zero new infra. ~40 LLM invocations/day at pilot scale (~10 defects × 4 agents) — 4% of Groq gpt-oss-120b RPD (1k/day) + <1% of gpt-oss-20b RPD (14.4k/day). **Neon CU-hr untouched** during the test run (orchestrator is pure-function this PR). $0/mo holds.

**Branch dependency:** This PR is chained onto `feat/be-sherlock-code-agent` (PR #161). Cascade merge order: #161 → this PR. Once #161 lands on main, GitHub auto-retargets this PR's base to main (or BE+1 rebases on request).

**Hard Rules check:** Rule 1 (no infra) · Rule 5 (no banned dep) · Rule 7 (audit deferred per scope-cut — followup `(da)` tracks) · Rule 9 (no `any`) · Rule 11 (scope cuts called out explicitly + followup filed — no scope creep into Day-20 timebox).

**M4 close cascade:** ships as part of M4 close (Sun May 17). Joins #148 (WebSocket) + #149 (TestRun) + #161 (Sherlock #1) + #162 (Jira webhook) on the cascade.

**Cross-references:** ADR-019 (Sherlock prompt strategy) · `.claude/scratch/sherlock-agent-1-design.md` (Day-19 design scratch) · `.claude/scratch/sherlock-orchestrator-impl/` (Day-19 P3 pre-draft — files promoted in this PR) · followup `(da)` (Day-21 hardening note for 5-layer persistence + async/WS) · PR #161 (chain parent) · PR #157 (DefectsController stub origin).

---

### Added — Day 19 — Sherlock RCA agent #1 (`agent.code` on gpt-oss-120b) [M4 TASK A4]

**P1 per Day-19 plan + ADR-019.** First of four parallel Sherlock RCA agents (code/data/env/flake) the Day-20 `SherlockOrchestratorService` will fan out via `Promise.all`. This PR ships agent #1 only — pure-function, fully unit-tested, NOT yet wired into AppModule (that flip lands Day-20 alongside the orchestrator + 3 sibling agents in a single AppModule-surface PR).

**Files (5 new, ~440 LOC + 10 tests):**

- `apps/api/src/agents/sherlock-code/sherlock-code.service.ts` — `SherlockCodeService.analyze(input): Promise<SherlockHypothesis[]>`. Pattern lifted from `A1ScribeService`: prompt build → `LLMGatewayService.complete()` → JSON-fence strip → Zod-validate. Adds: 1-retry-with-jitter (250-1000ms) on top of LLMGateway's existing Groq→Gemini fallback. Wraps in `sherlock.code` OTel span (attrs: `defect.id`, `model`, `provider`, `latency_ms`, `input_tokens_est`, `output_bytes`, `outcome` ∈ {success|empty|failed}, `retried`).
- `apps/api/src/agents/sherlock-code/schemas.ts` — Zod input + output. Input: `{defectId, stackTrace, failureMessage, component, recentCommits[]}`. Output: array of `{category, hypothesis, confidence, evidence[], agent: 'code'}`. Category enum (10 buckets per ADR-019 §4): `code-bug | data-bug | env-config | flaky-network | auth-permissions | dependency-version | ui-regression | race-condition | payment-gateway | other`.
- `apps/api/src/agents/sherlock-code/prompts.ts` — system prompt (Sherlock persona + JSON contract + allowed categories) + user prompt builder (defect ID + component + failure message + stack trace + optional recent commits).
- `apps/api/src/agents/sherlock-code/sherlock-code.module.ts` — `providers + exports` only. NO controller (Day-20 orchestrator is the caller; `DefectsController.rca` stays 501-stub from #157 until Day-20).
- `apps/api/src/agents/sherlock-code/__tests__/sherlock-code.service.spec.ts` — 10 tests via NestJS DI `useValue` mock of `LLMGatewayService` (matches A1Scribe precedent — no `jest.mock` magic; `LLMGatewayModule` is `@Global` so no transitive better-auth import chain).

**Critical contract (binding):**

- `analyze()` **NEVER throws to caller.** Returns `[]` on any failure (input validation / retry exhaustion / malformed JSON / Zod fail). Day-20 orchestrator counts emptiness as "agent failed" for ADR-019 §6 2-of-4 tolerance check.
- ZERO direct LLM SDK imports — provider-agnostic seam preserved.
- ZERO new DB hits — `agent_run` row write defers to Day-20 orchestrator.

**Test coverage (10 tests, beats brief's minimum of 4):**

1. happy path — valid JSON array → parsed + returned with `agent: 'code'`
2. ` ```json ` fences stripped before parse
3. JSON array surrounded by prose — extractor finds it via `[`/`]` bracket scan
4. retry success — first call throws transient, second succeeds
5. retry exhausted — both calls throw → returns `[]` (NEVER throws)
6. malformed JSON → returns `[]` + warn logged
7. invalid category enum → Zod rejects → returns `[]` + warn logged
8. invariant: every returned hypothesis carries `agent: 'code'`
9. empty `recentCommits[]` → prompt includes `(no recent-commit context available)` line
10. invalid input UUID → input Zod fails → returns `[]` + LLM never called

**Pre-push gates 5/5 ✓:** prettier ✓ · typecheck ✓ · **524/524 jest** (514 baseline + 10 new sherlock-code) · lint clean ✓ · CHANGELOG ✓.

**Cost-gate:** Sherlock invoked on defect creation only (8-user pilot, ~10 defects/day expected) → ~10 invocations/day Day-19 (just `agent.code`); ~40/day Day-20 once 4-agent fan-out lands. ~4% of Groq RPD daily budget on `gpt-oss-120b` (1k/day). Zero infra impact, $0/mo holds. **Neon untouched** — no new DB hot path (Neon at 81.61/100 CU-hr respected).

**Hard Rules check:** Rule 1 (no infra) · Rule 5 (no banned dep) · Rule 7 (audit deferred to orchestrator — single source-of-truth) · Rule 9 (no `any`) · Rule 11 (Zod schemas + Hard Rule 11 deeper-diagnostic discipline applied through 4 false-merge cycles this morning).

**M4 close cascade:** ships as part of M4 close (HOLD until Sat May 16). Joins #148 (WebSocket) + #149 (TestRun) on the cascade.

**Day-20 preview** (NOT in this PR):

```ts
// SherlockOrchestratorService.runRca(defectId)
const [code, data, env, flake] = await Promise.all([
  this.code.analyze(input),
  this.data.analyze(input),
  this.env.analyze(input),
  this.flake.analyze(input),
]);
const merged = this.mergeHypotheses({ code, data, env, flake });
// then: write rca_reports row + emit defect.rca_ready WS event + audit
```

**Cross-references:** ADR-019 (Sherlock prompt strategy) · `.claude/scratch/sherlock-agent-1-design.md` (full design scratch) · A1ScribeService (pattern source) · #157 (M4 stub controllers Sherlock will eventually wire to via DefectsController.rca).

---

### Added — Day 19 — Jira webhook receiver with HMAC-SHA256 signature validation [M4 TASK A6]

**P2 per Day-19 plan + followup `(bq)` (filed Day-18).** Converts the Day-19 P0 #2 stub (PR #157) for `POST /api/jira/webhook` from 501 to functional. Atlassian sends issue-lifecycle webhooks with `X-Hub-Signature: sha256=<hex>` computed over RAW request bytes; this PR ships the receiver + verifier + audit-write end-to-end. `connect`/`sync` endpoints stay as 501 stubs — they land Day-20+ alongside DefectsService.createFromJira + WS emit.

**Files (5 new + 3 modified, ~660 LOC):**

- **NEW** `apps/api/src/jira-sync/hmac-verifier.ts` — pure-function `verifyHmacSha256(rawBody, sigHeader, secret) → {ok}|{ok:false, reason}` with constant-time compare (`crypto.timingSafeEqual`). Reusable for future Slack/GitHub/Stripe webhook receivers.
- **NEW** `apps/api/src/jira-sync/jira-webhook.schema.ts` — Zod for the Atlassian webhook envelope (event discriminator + minimal issue ref + optional user). `passthrough()` so we don't reject unknown fields — Atlassian-shape evolution stays safe.
- **NEW** `apps/api/src/jira-sync/jira-sync.service.ts` — `JiraSyncService` (+ `OnModuleInit` workspace-cache + `recordWebhookReceived` + `recordWebhookSignatureInvalid`). System workspace UUID cached at boot via single `prisma.workspace.findFirst` — **zero per-webhook DB hits** (Neon at 81.61/100 CU-hr respected).
- **NEW** `apps/api/src/jira-sync/__tests__/hmac-verifier.spec.ts` — 10 unit tests (4 fail-reason buckets + happy + tamper + case-insensitive prefix).
- **NEW** `apps/api/src/jira-sync/__tests__/jira-sync.service.spec.ts` — 7 tests via NestJS DI mocks (workspace caching + audit-call shape).
- **NEW** `docs/architecture/webhook-raw-body.md` — design doc fulfilling followup `(bq)`. Reusable pattern table for Slack/GitHub/Stripe/Linear M5+ webhooks.
- **MODIFIED** `apps/api/src/jira-sync/jira-sync.controller.ts` — webhook stub → functional (HMAC verify → JSON parse → Zod validate → fire-and-forget audit → 200 ack). `connect`/`sync` retained as 501 stubs.
- **MODIFIED** `apps/api/src/jira-sync/jira-sync.module.ts` — adds `JiraSyncService` provider + `AuditModule` import.
- **MODIFIED** `apps/api/src/jira-sync/__tests__/jira-sync.controller.spec.ts` — extended to 10 tests covering: 2 happy-path + 3 signature-failure (mismatch/missing-header/secret-missing) + 3 body-shape-failure (raw-body-missing/invalid-json/Zod-fail) + 2 retained stub-contract for connect/sync.
- **MODIFIED** `apps/api/src/main.ts` — installs `app.use('/api/jira/webhook', express.raw({ type: '*/*', limit: '5mb' }))` BEFORE the global `express.json()`. Identical pattern to the BetterAuth `/auth/*` raw mount above it.

**Critical contract (binding):**

- HMAC verified over **raw request bytes** (not `JSON.stringify(req.body)`) — every webhook would fail in prod otherwise per followup `(bq)` rationale.
- Constant-time compare via `crypto.timingSafeEqual` — defends against timing-attack signature recovery.
- Fail-closed on missing secret: empty `JIRA_WEBHOOK_SECRET` env returns 401 `{reason: 'secret_missing'}`. No silent bypass.
- Audit-write is **fire-and-forget** (`AuditService.writeNonBlocking`) so 200 ack returns in <50ms. System workspace UUID is cached at `OnModuleInit` (1 boot DB hit, 0 per-request).
- Day-20 side-effects (defect upsert + WS emit + dead-letter retry) deferred to a separate PR.

**Pre-push gates 5/5 ✓:** prettier ✓ · typecheck ✓ · **538/538 jest** (514 baseline + 24 net-new: 10 hmac + 7 service + 10 controller − 3 retired stub-contract for webhook) · lint clean ✓ · CHANGELOG ✓.

**Cost-gate:** zero new infra, zero per-request DB hit (cached workspace ID), $0/mo holds. Audit-row inserts are normal `audit_log` writes (existing table from MS0); not a hot-path issue at pilot scale (~10 webhooks/day expected).

**Hard Rules check:** Rule 1 (no infra) · Rule 5 (no banned dep — uses `node:crypto` builtin) · Rule 6 (no env in repo — `JIRA_WEBHOOK_SECRET` lives in Render env vars, `.env.example` placeholder lands Day-20 with deploy-side rotation doc) · Rule 7 (audit-chain write on every receipt + every signature failure) · Rule 9 (no `any`) · Rule 11 (followup `(bq)` design honored — no improvisation).

**M4 close cascade:** ships as part of M4 close (HOLD until Sat May 16). Joins #148 (WebSocket) + #149 (TestRun) + #161 (Sherlock A4) on the cascade.

**Cross-references:** followup `(bq)` 2026-05-14 (the design note this PR fulfills) · `docs/architecture/webhook-raw-body.md` (the binding design doc) · #157 (M4 stub controllers — connect/sync retain stub contract from there) · #161 (Sherlock A4 sibling Day-19 BE deliverable).

---

### Added — Day 19 AM — VR baseline seed: 12 canonical PNGs + 3 frame specs + VR_BASELINES_READY flip

**Day-19 AM seed PR.** Activates BE+1's visual-regression Playwright suite (PR #153) by committing the 12 canonical baseline PNGs FE+1 captured Day-18 evening, writing 3 frame-specific specs, and flipping the `VR_BASELINES_READY` env gate in CI.

**Files:**

- **NEW** `apps/web/tests/visual/canonical/{F19,F20,F21}/{320,768,1024,1440}.png` — 12 baselines (4.6 MB total). Captured via headed Chromium + Playwright `file://` against the canonical v2 HTML at `PM1_UI_v2/Redesign Frame by claude design/F{19,20,21}*.html` (full-page, dark colorScheme, deviceScaleFactor 1). Paths match BE+1's `snapshotPathTemplate: '{testDir}/canonical/{arg}/{projectName}.png'` exactly — zero move/rename.
- **NEW** `apps/web/tests/visual/capture-canonical-baselines.mjs` — reusable ~50 LOC script accepting `FRAMES` + `VIEWPORTS` arrays. Idempotent re-capture command for future frames (F08/F14/F15/F16abc/F18/F22-F28).
- **NEW** `apps/web/tests/visual/f19.spec.ts` — F19 Run Console route `/projects/iksula-returns/runs/RUN-RET-2026-04-25-002`. Route is on origin/main (PR #135 merged) → unskipped once `VR_BASELINES_READY=1`.
- **NEW** `apps/web/tests/visual/f20.spec.ts` — F20 Run Results route `/projects/:slug/runs/:runId/results/`. **Double-gated**: `VR_BASELINES_READY` + `F20_ROUTE_READY`. Second flag flips when PR #150 merges; until then F20 spec stays skipped (baseline PNG ready, just waiting on route).
- **NEW** `apps/web/tests/visual/f21.spec.ts` — F21 Defects Hub route `/projects/:slug/defects/`. **Double-gated**: `VR_BASELINES_READY` + `F21_ROUTE_READY`. Second flag flips when the Day-20 re-port (via `frame-port` skill from `wip/f21-pre-tooling-fix`) merges.
- **DELETED** `apps/web/tests/visual/home.spec.ts` — superseded by f19/f20/f21 specs. F08 baseline can be added separately if needed; the placeholder pattern is no longer load-bearing.
- **MODIFIED** `.github/workflows/ci.yml` — `VR_BASELINES_READY: "1"` added to the visual-regression job's env block. Replaces the prior "UNSET until seed PR" comment with the activated state.
- **MODIFIED** `docs/CHANGELOG.md` — this entry.

**Spec pattern** (copied verbatim from BE+1's `home.spec.ts` template, snapshotPathTemplate `{testDir}/canonical/{arg}/{projectName}.png`): describe-level `test.skip(!VR_BASELINES_READY)` gate + frame-specific second gate for in-flight routes + `page.goto(route)` → `waitForLoadState('networkidle')` → 500 ms hydration settle → `expect(page).toHaveScreenshot('F2x', { maxDiffPixelRatio: 0.01, threshold: 0.2, animations: 'disabled', caret: 'hide' })`.

**Expected CI behaviour post-merge:** F19 spec unskipped → compares live F19 render against `canonical/F19/*.png`. First run may fail with 1-2 % pixel-diff (canonical from v2 HTML vs React port rendering — font anti-aliasing, lucide-vs-inline-SVG per Hard Rule 14 amendment). Tolerance config (`maxDiffPixelRatio: 0.01`) was designed to absorb these. If exceeded, FE+1 either (a) re-captures from React route as new baseline (intentional design ack), or (b) fixes drift root cause. F20/F21 specs stay skipped via second gate until their PRs merge.

**Cross-references:**

- PR #153 (BE+1) — VR Playwright suite scaffolding
- PR #154 (MAIN) — frame-port skill v1 + Hard Rule 18
- Day-18 Rule 17 audit: `docs/audits/2026-05-14-rule17-audit-day-18.md`

---

### Fixed — Day 19 — Pin `@hookform/resolvers` to `~3.9.1` (FE typecheck zod-v3↔v4 incompat blocker)

**P0 unblocker for FE+1.** `apps/web/package.json` was on `^3.10.0` (resolved to 3.10.0 in lockfile); 3.10.0 was the last v3 release of `@hookform/resolvers` but already shipped TypeScript types referencing zod-v4's internal `$ZodTypeInternals` symbol. Workspace zod is `~3.25.76` (zod-v4 only enters scoped via `better-auth>zod` + `@better-auth/core>zod` overrides). Result: `pnpm --filter web typecheck` failed with `ZodObject<...>` not assignable to `ZodType<any, any, $ZodTypeInternals<any, any>>` on three M1-era modal files (invite-user-modal, founder-wizard, create-project-modal).

**Diagnosis path:** Initial triage (this morning) read as stale local node_modules — recommended `pnpm install --frozen-lockfile`. FE+1's deeper diagnostic on a clean `--frozen-lockfile` install proved the fault was in `@hookform/resolvers@3.10.0` itself, not the lockfile. Verified by reading `apps/web/node_modules/zod` → symlinks to v3.25.76 (correct), but typecheck still failed → the resolver's type declarations were the problem. Hard Rule 11 lesson: when a deeper diagnostic contradicts a "looks clean" surface check, dig deeper — don't defer.

**Fix:**

- `apps/web/package.json`: `"@hookform/resolvers": "^3.10.0"` → `"~3.9.1"`
- `pnpm install` → lockfile resolves to `3.9.1` (last release with stable zod-v3 internal-type shape)
- `pnpm --filter web typecheck` → exit 0

**Trade-off:** Defers the v4 migration (`@hookform/resolvers` v4.x is zod-v4-only). Tracked as followup `(cz)` for post-M4 hardening — needs paired bump of `packages/shared` zod, `apps/web` resolvers, `apps/api` zod imports, and `.claude/locked-deps.json` paired-major lock all in one PR.

**Files:**

- `apps/web/package.json` — version pin
- `pnpm-lock.yaml` — resolved version 3.9.1
- `docs/followups.md` — `(bw)` marked RESOLVED, new `(cz)` filed for the deferred v4 migration

**Closes:** followup `(bw)` (filed 2026-05-14 Day-18). **Opens:** followup `(cz)` (post-M4 zod-v4 + resolvers-v4 paired migration).

**Cost-gate:** zero infra impact ($0/mo holds).

---

### Added — Day 19 — M4 module stubs: TestRuns + Defects + JiraSync (P0 #2 AppModule wiring)

**P0 HIGH per Kimi K2 review** (Day-19 morning). M4 DB tables exist (migration 0004 from Day-17 #144) but the API surface was absent — no `TestRunsModule`, `DefectsModule`, or `JiraSyncModule` on main. Per Day-19 brief decision-tree (`if module files don't exist: scaffold the three modules with stub controllers returning 501`) this PR lands additive 501 stubs so FE+1 + Yogesh have API surface to point at before the full implementations land at M4 close.

**Stub contract (locked by 11 contract tests):**

- All endpoints return `501 Not Implemented`
- Response header `x-m4-stub: true` (visibility for FE+1 + Yogesh)
- Response body `{ error, message, m4Stub: true, op | landingPr }`

**11 routes registered (boot-smoke verified):**

- `PATCH /api/test-runs/:id/{start,result,abort}` — replaced by PR #149 (HOLD) at M4 close; paths chosen to match #149 for clean rebase
- `POST /api/defects` · `GET /api/defects/:id` · `GET /api/defects/:id/rca` · `POST /api/defects/:id/jira` · `PATCH /api/defects/:id/status` — replaced Day-20 alongside A4 RCA
- `POST /api/jira/webhook` · `POST /api/projects/:slug/jira/{connect,sync}` — replaced Day-19/20 alongside HMAC raw-body middleware

**Files (10 new + 1 modified, +445 LOC):**

- `apps/api/src/test-runs/{test-runs.controller.ts,test-runs.module.ts,__tests__/test-runs.controller.spec.ts}`
- `apps/api/src/defects/{defects.controller.ts,defects.module.ts,__tests__/defects.controller.spec.ts}`
- `apps/api/src/jira-sync/{jira-sync.controller.ts,jira-sync.module.ts,__tests__/jira-sync.controller.spec.ts}`
- `apps/api/src/app.module.ts` — `+ 3 module imports`

**Pre-push gates 5/5 ✓:** prettier ✓ · typecheck ✓ · **514/514 jest** (503 baseline + 11 new stub-contract tests) · lint clean ✓ · CHANGELOG ✓.

**Hard Rules check:** Rule 1 (no infra) · Rule 5 (no banned dep; single-process) · Rule 6 (no env) · Rule 7 (audit not relevant — stubs return immediately) · Rule 9 (no `any`) · Rule 11 (Kimi review surfaced before code; brief decision-tree explicit). Lands as standalone P0 fix today (NOT in M4 close cascade).

---

### Added — Day 18 PM — `.claude/skills/frame-port/` v1 + Hard Rule 18 (skill-mandatory port workflow)

**Tier-2 of the Day-18 PM port-discipline build (companion to BE+1's Tier-1 visual-regression suite).** New skill at `.claude/skills/frame-port/` orchestrates the canonical-first port workflow as an executable, auditable pipeline. Triggered by "port frame Fxx" / "build the Fxx React port" / similar phrases.

**Files:**

- `SKILL.md` — orchestrator instructions defining the mandatory 7-step workflow (extract canned-data → extract spec → Yogesh approves spec → scaffold TSX from spec+canned-data NOT from HTML → diff-probe → Rule 13 visual gate ONLY after probe clean → commit + PR). Lists 11 trigger phrases.
- `extract-spec.mjs` — Step 2 tool. Reads canonical v2 HTML via jsdom, emits `spec.json` with: section tree (`tag` / `id` / `role` / `classes` per node), `tokens_used` (every `var(--token)` ref), `token_definitions` (every `--token: value` in `<style>` blocks), `assets` (img src + bg-image url + favicon), `canned_data_keys` (data-_ attrs, heading exemplars, aria-label exemplars). Smoke-tested against F19 v2: 18 sections / 16 structural · 33 tokens used · 38 tokens defined · 6 data-_ attrs · 4 headings · 20 aria-labels.
- `diff-probe.mjs` — Step 5 tool. Playwright + sharp pixel diff at viewports 320 / 768 / 1024 / 1440. For each: section-by-section locator-count compare (canonical vs port — FAIL if MISSING or EXTRA), pixel diff via sharp raw RGBA Manhattan distance >24 (>10% per channel — tuned for font anti-aliasing tolerance). Exit 0 = clean; Exit 1 = drift (gate blocked). Smoke-tested canonical-vs-canonical: 0.0% / 0.0% / 0.1% / 0.0% pixel diff across viewports as expected.
- `README.md` — usage doc with quick-start, file inventory, why-this-exists rationale citing PR #145 → #150 precedent.
- `.gitignore` — excludes per-port `specs/` and `diffs/` generated artifacts (regenerate per port).

**CLAUDE.md Hard Rule 18 codified.** "All frame ports MUST execute via `.claude/skills/frame-port/`." Skipping the skill workflow = visual gate FAIL regardless of output quality. The close-and-redo precedent (Rule 17 violations are CLOSED not patched) is now formal canon — diff-probe catches drift early so the loop runs at most once per frame.

**Dependencies added to root devDependencies (all already transitive — hoisted only):**

- `jsdom@^29.1.1` (was in `apps/web` via vitest)
- `playwright@^1.59.1` (was in `apps/e2e`)
- `sharp@^0.33.5` (was in `apps/api` via `@xenova/transformers` + ADR-009 pin)

Zero new monthly cost. Hard Rule 1 ($0/mo) retained.

**Day-18 PM tier-2 status entry per the 9 PM EOD plan:** BE+1's tier-1 VR suite (separate PR) + this tier-2 skill together close the discipline-drift class. From Day-19 forward, every M4+ frame port runs through this skill before reaching visual gate.

### Added — Day 18 — Visual Regression (VR) Playwright suite scaffolding (P0 evening, M4 close gate)

**Day-18 evening P0.** Scaffolding for the VR suite that locks pixel-level FE rendering against canonical baselines on every PR touching `apps/web/**`. Sister to the existing `apps/e2e/` Playwright suite (which exercises behavioural FE↔API flows, NOT pixel diffs).

**Architecture decision: separate dirs.** VR lives at `apps/web/tests/visual/` (per brief), NOT in the existing `apps/e2e/` workspace. Rationale: (a) brief explicit, (b) VR is tightly coupled to the FE bundle so co-locating with `apps/web` keeps spec ↔ component proximity, (c) different runtime profile — VR doesn't need API + Postgres spinup, just `next start` + chromium → faster CI loop suitable for a required-on-main check.

- **`feat(test)`** — `apps/web/tests/visual/playwright.config.ts` (NEW). Chromium-only (free-tier discipline; ~140 MB browser install vs ~400 MB for chromium+firefox+webkit). 4 viewport projects per CLAUDE.md Hard Rule 12: `chromium-320` (iPhone SE) · `chromium-768` (iPad portrait) · `chromium-1024` (small desktop) · `chromium-1440` (canonical desktop). `expect.toHaveScreenshot` defaults: `maxDiffPixelRatio: 0.01` (≤1% pixels may differ) · `threshold: 0.2` (per-pixel color tolerance, normalized 0-1). `animations: 'disabled'` + `caret: 'hide'` to eliminate transient noise. `snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}-{projectName}-{platform}.png'` per brief — keys baselines by viewport project AND host platform so macOS local snapshots don't false-fail Linux CI.

- **`feat(test)`** — `apps/web/tests/visual/home.spec.ts` (NEW). Template spec for FE+1 to copy when adding more frames (F15, F19, etc.). Targets `/home` route. Runs once per project (4 baselines: one per viewport). Gated behind `VR_BASELINES_READY=1` env-var skip so the empty-baseline first run doesn't false-fail before FE+1 lands canonical PNGs. CI sets this env var; local dev keeps the gate off until baselines are committed.

- **`feat(test)`** — `apps/web/tests/visual/README.md` (NEW). Onboarding doc — explains the two-tier `canonical/` + `__screenshots__/` split, viewport matrix, tolerance canon, local + CI invocation, "adding a new VR spec" recipe, and the `gh api` snippet to make `visual-regression` a required check on `main` branch protection.

- **`chore(deps)`** — `apps/web/package.json` `+ @playwright/test ^1.59.1` devDep (the test runner; `playwright` lib was already installed for browser binaries). 3 new scripts: `test:visual` · `test:visual:update` (regen baselines after intentional design changes) · `test:visual:install-browsers` (chromium only).

- **`feat(ci)`** — `.github/workflows/ci.yml` `+ visual-regression` job. Path-filtered to `apps/web/**` (skips on doc/config-only PRs). Pipeline: install pnpm deps → install chromium browser → build shared + web → `next start` in background → poll `/` for readiness (30s timeout) → run `pnpm --filter web test:visual` → on failure, upload `apps/web/playwright-report-visual/` + `apps/web/test-results/` as `vr-diffs-pr<num>-run<id>` artifact (14d retention) so reviewers can download + inspect diff PNGs. `if: always()` cleanup kills the background `next start` process.

**Local smoke-test verified ✓:**

```
$ pnpm --filter web exec playwright test --config=tests/visual/playwright.config.ts --list
[chromium-320]  › home.spec.ts:37:7 › F08 Home — VR baselines (Hard Rule 12 RWD) › renders within tolerance
[chromium-768]  › home.spec.ts:37:7 › F08 Home — VR baselines (Hard Rule 12 RWD) › renders within tolerance
[chromium-1024] › home.spec.ts:37:7 › F08 Home — VR baselines (Hard Rule 12 RWD) › renders within tolerance
[chromium-1440] › home.spec.ts:37:7 › F08 Home — VR baselines (Hard Rule 12 RWD) › renders within tolerance
Total: 4 tests in 1 file
```

Config compiles, all 4 viewport projects discover the template spec.

**FE+1 follow-up tonight (per brief):**

1. Populate `apps/web/tests/visual/canonical/F08/{320,768,1024,1440}.png` from a known-good /home render
2. Run `pnpm --filter web test:visual:update` to seed `__screenshots__/`
3. Commit both `canonical/` + `__screenshots__/` PNGs
4. Remove the `test.skip(!process.env.VR_BASELINES_READY, ...)` gate from `home.spec.ts`
5. Add additional VR specs for F15 / F19 / F14 / etc.

**Yogesh follow-up (after merge):** make `visual-regression` a **required** check on `main` branch protection via `gh api` snippet documented in the README.

**Hard Rules check:**

- Rule 1 (cost): chromium-only browser install + 1 worker in CI → minimal GitHub Actions minutes
- Rule 5 (ban list): `@playwright/test` is the canon Playwright runner; matches `apps/e2e/` choice
- Rule 6 (secrets): no env changes
- Rule 11 (escalate): brief explicit; no ambiguity
- Rule 12 (RWD): VR enforces — 4 viewports = the canon breakpoints
- Rule 13 (visual gate): VR automates what was previously manual; canonical/ stays human-curated as the editorial baseline

### Added — Day 18 PM — ADR-019 Sherlock prompt strategy + sherlock-rca golden corpus seed (5 defects)

**ADR-019** (`docs/architecture/adr-019-sherlock-prompt-strategy.md`) — draft, ratify Day-19 AM before BE+1 starts MS4-T016. Locks the M4 A4 RCA agent design:

- **4-agent parallel fan-out** via `Promise.all` (NOT LangGraph, NOT Hatchet): `agent.code` (`gpt-oss-120b`, stack traces) + `agent.data` (`gpt-oss-120b`, fixtures/DB) + `agent.env` (`gpt-oss-20b`, config) + `agent.flake` (`gpt-oss-20b`, retry history).
- **Deterministic merge algorithm** (NO LLM call): group by category → take max confidence per category → ensemble boost `+0.05` per duplicate agent (cap `+0.15`) → sort + take top 5 → cap final confidence `0.95`.
- **JSON-only response schema** with strict calibration rules ("DO NOT inflate; wrong-high-confidence is worse than right-low-confidence") to honor the F22 `< 0.5` needs-review trigger.
- **Retry chain per agent:** primary call → 1 retry with jitter → Gemini fallback → empty array + OTel span. Aggregate tolerance: 2-of-4-agent failures OK; 3+ fails → degraded RCA UX path in F22 (separate from amber low-confidence banner).
- **OpenTelemetry shape:** parent `sherlock.rca` span with 4 child agent spans, full provider/model/latency/byte/outcome attribution.
- **Numbering note:** previous M4 v2 plan referenced "ADR-015" — that number is already taken by `adr-015-runtime-llm-config-bridge.md`. Renumbered to ADR-019 (next-free clean number).

**`apps/api/test/golden-sets/sherlock-rca/`** (corpus scaffold for AC042 ≥40% gate per M4 v2 §4.5):

- `README.md` — folder structure, schema spec, 10 category enums (`code-bug` / `data-bug` / `env-config` / `flaky-network` / `auth-permissions` / `dependency-version` / `ui-regression` / `race-condition` / `payment-gateway` / `other`), eval harness usage example.
- `schema.json` — JSON Schema (draft-07) validating every `def-NNN.json`. Enforces UUID `runId`, env enum, category enum on `rootCauseCategory` + `acceptableAlternatives`, kbContext max 3 items, confidence enum, required field presence.
- **5 seed defects** (`def-001.json` … `def-005.json`) sourced from F20 Run Results v2 canonical Iksula Returns failures:
  - `def-001` TC-RET-0247 split-tender refund precision loss → `code-bug` (alt: `data-bug`)
  - `def-002` TC-RET-0342 `refund.retry.exhausted` cold-start exhausts gateway retries → `env-config` (alt: `flaky-network`, `payment-gateway`)
  - `def-003` TC-RET-0345 multi-currency FX (live vs locked-at-purchase) → `code-bug` (alt: `data-bug`)
  - `def-004` TC-PAY-0211 UPI mandate revoked pre-check missing → `payment-gateway` (alt: `code-bug`)
  - `def-005` TC-PAY-0224 3DS auth-complete race with gateway debit → `race-condition` (alt: `code-bug`, `payment-gateway`)
- All 5 validated against `schema.json` via pure-Node validator. Coverage: 4 of 10 category enums (gap: `data-bug`, `flaky-network`, `auth-permissions`, `dependency-version`, `ui-regression`, `other` — BE+1 expansion Day-19 from the existing 62-case `cpi_postmortem_defects.json` mining source).

M4 v2 plan §3 + §4.5 + §7.5 patched to reflect: ADR-019 (was ADR-015), seed status, mining source for Day-19 expansion. PR #146 still HOLD per Yogesh — waiting for final approval.

### Added — Day 18 — Hard Rule 17 (canned-data verbatim extraction) + `scripts/extract-canned-data.mjs`

**New CLAUDE.md Hard Rule.** Rule 17 — _Canned-data verbatim extraction (mandatory)_ — establishes that before writing ANY React component code for a frame port, FE+1 must run `scripts/extract-canned-data.mjs` against the canonical v2 HTML, output `apps/web/components/<frame>/canned-data.ts`, and import ALL user-visible strings from that file. Any string in a component file that doesn't trace back to the v2 HTML is a Rule 17 violation → visual gate FAIL.

**Rationale:** F19 / F20 / F21 visual gate failures in M3 close week all traced to FE+1 inventing stub data (cluster titles, ticket IDs, error messages, right-rail labels) that didn't match the canonical HTML. Each invention created a "minor" drift that compounded across the screen. Extracting verbatim from the HTML eliminates the entire stub-data-invention drift class.

**`scripts/extract-canned-data.mjs`** — pure-Node (no npm deps) regex-based extractor. Reads the canonical v2 HTML, strips scripts/styles/comments, then extracts page title, headings h1-h6, data-\* attributes, ID patterns (TC-/DEF-/REQ-/Jira-key), text content per common tag, image alt text, and aria-label / title attrs. Writes a TypeScript file with a `<FRAME>_RAW` object plus a starter `<FRAME>_PAGE_TITLE` export. The FE+1 dev organizes the raw extracts into semantically named exports (e.g. `F22_DEFECT_IDS`, `F22_RIGHT_RAIL_LABELS`) that the React port imports from.

Smoke-tested against `F22 Defect Detail v2.html`: extracted 1 page title + 16 headings + 6 data-attribute groups + 13 ID matches + 319 text tags + 10 aria labels + 2 titles. Ready for M4 FE+1 workflow.

Folded into M4 v2 plan as ACs MS4-AC020a (canned-data.ts exists per frame) + MS4-AC020b (no untraced strings in \*.tsx).

### Docs — Day 18 — M4 v2 plan promoted (Runs/Defects/Jira, 3-day compressed + Sun reserve, M4 kickoff)

**M4 kickoff doc.** Promoted `.claude/scratch/m4-v2-plan-skeleton.md` to `QA Nexus/PM1/PM1_milestone/M4/Milestone_M4_Runs_Defects_Jira_v2.md` (~250 lines) with the following Day-18 amendments locked per Yogesh's morning directive:

- **AC042 = ≥40%** on 50-defect Sherlock RCA golden corpus (was TBD in skeleton). Sun Day-21 reserve allocated for prompt iteration if first eval miss.
- **"Needs human review" UI affordance** — F22 Defect Detail shows an amber banner with `Sherlock is unsure — please verify the root cause` when Sherlock RCA returns `confidence < 0.5`. Disables auto-Jira-create; surfaces manual override. New tasks/ACs: MS4-T034 + MS4-AC016 + MS4-AC017.
- **Timeline:** 3-day compressed Day-18 Thu May 14 → Day-20 Sat May 16, with **Day-21 Sun May 17 reserve** explicitly scoped (Sherlock corpus re-eval, visual gate retries, close-gate fixes, slipped ceremony — fix-only, no new scope).
- **4 research-backed risks** (R001-R004) folded in:
  - R001 WebSocket lifetime under Render Free scale-to-zero (UptimeRobot 4-min keep-alive + client reconnect)
  - R002 Jira webhook HMAC needs raw-body middleware (scoped to `/webhooks/jira`, NOT global)
  - R003 R2 CORS allow-list + XHR `upload.onprogress` for attachments >2MB (fetch() exposes no progress)
  - R004 Jira webhook retry idempotency (UNIQUE INDEX on jira_sync_log.provider_event_id)
- **M3 retro action items 1-5** folded into M4 ACs: close-gate sweep authored Day-1 (MS4-T023 + MS4-AC025), auth regression test in CI (MS4-AC031), Rule 16 diff-probe enforced (MS4-T039), multi-worktree hook sync (out-of-band).

Parallel mirror committed to `~/Claude Cowork Workspace /AI Based QA Platform/m4-plan/` per two-folder workflow. Followup `(bq)` filed for the raw-body webhook middleware design pattern (BE+1 design Day-18 PM, implement Day-19 with MS4-T012). Summary view `docs/plans/02-milestones/M4-runs-defects-jira.md` updated to point at v2 binding spec.

The v1.0 Apr 25 doc is fully superseded — only its v2.1 amendment block (lines 3-16) was binding and that's already locked in CLAUDE.md.

---

### Added — Day 18 — TestRun service skeleton: state machine + audit + WS emit (M4 TASK 3 P3)

**M4 Day-18 PM TASK 3 complete.** Implements PM1_ERD §3.10 state machine on `test_runs.status` with HMAC-chained audit-log writes (Hard Rule 7) and `test_run.progress` WebSocket fan-out via the P2 RealtimeGateway (PR #148).

**State machine (single source of truth: `ALLOWED_TRANSITIONS` table in `test-runs.service.ts`):**

| From                                        | Allowed →                                   |
| ------------------------------------------- | ------------------------------------------- |
| `queued`                                    | `running`                                   |
| `running`                                   | `passed` · `failed` · `blocked` · `aborted` |
| `passed` / `failed` / `blocked` / `aborted` | **(terminal — no outbound)**                |

The `Failed → Defected` path in ERD §3.10 is handled by a separate service in Day-19 (defect creation); this skeleton stays at the run-level status flip.

**3 REST endpoints** (mounted at `/api/test-runs/`):

| Route                       | Method | Role         | Transition                                                   |
| --------------------------- | ------ | ------------ | ------------------------------------------------------------ |
| `/api/test-runs/:id/start`  | PATCH  | any authed   | queued → running (stamps `startedAt`)                        |
| `/api/test-runs/:id/result` | PATCH  | any authed   | running → passed \| failed \| blocked (stamps `completedAt`) |
| `/api/test-runs/:id/abort`  | PATCH  | Admin / Lead | running → aborted (stamps `completedAt`)                     |

`abort` is RBAC-gated to Admin/Lead — pulling the stop-cord on someone else's run is a supervisory action.

**Per-transition pipeline (in `TestRunsService.transition()`):**

1. Load existing run via `prisma.testRun.findUnique`; 404 if missing
2. State-machine guard: throws `ConflictException` if `toStatus` not in `ALLOWED_TRANSITIONS[fromStatus]`
3. Update `test_runs.status` + conditionally stamp `started_at` / `completed_at`
4. **Audit BEFORE WS emit** (Hard Rule 7): `audit.write({ entityType: 'test_run', action: 'transition:<from>-><to>', payload: { from_status, to_status, transitioned_at, started_at, completed_at }})`. Audit failure throws — run state already updated but WS emit is **gated** behind audit success
5. **Best-effort WS emit**: `gateway.emitTestRunProgress(runId, { status })` — if it throws, log + swallow (audit + state are already canonical; FE recovers via fetch)

**Files changed:**

- `apps/api/src/test-runs/test-runs.service.ts` (NEW, ~200 LOC) — state machine + transitions
- `apps/api/src/test-runs/test-runs.controller.ts` (NEW, ~120 LOC) — 3 PATCH endpoints, ZodValidationPipe on body, ParseUUIDPipe on id
- `apps/api/src/test-runs/test-runs.module.ts` (NEW) — wires PrismaModule + AuditModule + AuthModule + RealtimeModule
- `apps/api/src/test-runs/__tests__/test-runs.service.spec.ts` (NEW, **17 tests**)
- `apps/api/src/app.module.ts` — `+ TestRunsModule` import

**Tests (17, beats brief's 8 minimum):**

State machine (10):

- `start` queued → running succeeds, stamps `startedAt`, returns updated row
- `start` re-running (running → running) throws ConflictException
- `start` from terminal `passed` throws ConflictException
- `report` running → passed stamps `completedAt`
- `report` running → failed
- `report` running → blocked
- `report` from queued throws (must transition through running first)
- `abort` running → aborted stamps `completedAt`
- `abort` from queued throws
- missing runId → NotFoundException; no audit/WS side-effects

Audit + WS contracts (4):

- `audit.write` called with `entityType=test_run`, `action='transition:running->passed'`, full payload shape
- `gateway.emitTestRunProgress(runId, { status })` called with right args
- **WS emit failure is SWALLOWED** (audit + state canonical; missing frame recoverable)
- **audit.write failure PROPAGATES** + WS emit is NOT fired (ordering invariant)

Static helper (3):

- `allowedTransitionsFrom('queued')` → `['running']`
- `allowedTransitionsFrom('running')` → set `{passed, failed, blocked, aborted}`
- All terminal states have empty outbound sets

**Spec-mock pattern:** uses `jest.mock` at module boundary for `RealtimeGateway` + `AuthService` + `PrismaService` + `AuditService` to keep the better-auth ESM chain out of jest's CJS transformer (same pattern as Day-17 #138 + Day-18 #148).

**Pre-push gates 5/5 ✓:** prettier ✓ · typecheck ✓ · **530/530 jest** (513 baseline + 17 new) · lint clean ✓ · CHANGELOG ✓.

**Prod-boot smoke (manual `(bj)` gate) ✓:**

```
[Nest] LOG [RoutesResolver] TestRunsController {/api/test-runs}:
[Nest] LOG [RouterExplorer] Mapped {/api/test-runs/:id/start, PATCH} route
[Nest] LOG [RouterExplorer] Mapped {/api/test-runs/:id/result, PATCH} route
[Nest] LOG [RouterExplorer] Mapped {/api/test-runs/:id/abort, PATCH} route
```

Controller wired into AppModule, all 3 routes registered. Sister `/health` + WS routes (P2 #148) intact.

**R2 presigned upload/download endpoints — already shipped:** the brief mentioned EP-013 (`POST /storage/presigned-upload`) + EP-014 (`POST /storage/presigned-download`). Both ALREADY exist at `apps/api/src/storage/storage.controller.ts` from MS0-T013 + ADR-005 — issuing presigned URLs with HMAC audit on the upload side. **No new BE code required for the R2 endpoints today.** R2 CORS `AllowedHeaders: "content-type"` (NOT `"*"`) is a Cloudflare-dashboard setting; flagged in followup queue for Day-19 R2-bucket config audit.

**Hard Rules check:**

- Rule 1 (cost): no new infra
- Rule 5 (ban list): no banned deps; WS emit reuses single-instance per-process Map from #148
- Rule 6 (secrets): no env changes
- **Rule 7 (audit log):** every state transition writes a chained audit row BEFORE the WS emit; audit failure aborts the transition for the FE caller
- Rule 9 (TS strict): no `any` types; Prisma client types power state-machine signatures
- Rule 10 (Zod schemas in shared): controller uses inline Zod for `ReportRunResultSchema` since the M4 `TestExecutionUpdateInput` shape in `@qa-nexus/shared` is for per-execution updates (different surface — that's the runner's, not the run-level state flip). Tiny scope-specific schema lives at the controller boundary as M4 hardening; M5 retro can promote to shared if reused

**HOLD merge** per Day-18 brief — gated on M4 close cascade. Depends on PR #148 (WebSocket gateway) which is also HOLD.

**Acceptance gate (post-merge):**

1. Render auto-redeploys (~2 min)
2. `PATCH /api/test-runs/:id/start` on a queued run with valid session → 200 with `{ id, status: 'running', startedAt }`
3. Replay same PATCH → 409 Conflict
4. `PATCH /api/test-runs/:id/result` body `{ status: 'passed' }` → 200, stamps `completedAt`
5. New audit_log row visible at `/api/audit?entityType=test_run&entityId=<id>` with `action=transition:running->passed`
6. F19 Run Console FE (subscribed to `test_run.progress.<runId>`) receives `{ event: 'test_run.progress', data: { status: 'passed' } }` frame

**Day-19 follow-ups (NOT in this PR):**

- ProjectScopedRolesGuard on routes (per-runId → project membership check) — currently service-layer relies on global RBAC; tighten Day-19 alongside A4 RCA
- Failed → Defected path: defect creation from failed test run + auto-link via `defect.triggered_by_run_id`
- Per-case `test_run_results` writes from the runner itself (the run-level status flip is THIS PR's surface only)

---

### Added — Day 18 — WebSocket gateway channel subscribe/unsubscribe + emit fanout (M4 TASK 2 P2)

**M4 Day-18 PM TASK 2 complete.** Extends the M0-T026 `RealtimeGateway` scaffold (echo handler + BetterAuth session-cookie handshake on `/realtime` path) with the M4 channel-pub/sub surface F19 Run Console + A4 RCA + AgentRun handlers will use to push live updates to subscribed clients.

**Hard Rule 5 single-instance discipline preserved:** Per-process `Map<channelKey, Set<ConnectedClient>>` for the channel registry. **NO Redis pub/sub**, NO socket.io. Single NestJS dyno, single WS process — pilot scale (8 users × 12 hr/day) fits comfortably.

**Path note:** brief specified `path: '/ws'` but the existing M0-T026 gateway is mounted at `path: '/realtime'`. Preserved `/realtime` to avoid breaking pre-existing FE wiring + the echo sanity test. Functionally identical; path is cosmetic. ADR sidecar if Yogesh wants to rename in M5.

**New channel pattern:**

- `test_run.progress.<runId>` — F19 live updates, the only auth-gated subscriber today. Channel name regex-validated against UUID format. On subscribe, gateway queries `prisma.testRun.findFirst({ where: { id: runId, project: { members: { some: { userId } } } } })` — single round-trip; returns null when the user lacks project membership → `WsException('forbidden: run <id> not accessible')`. Defence-in-depth: DB-level RLS would also reject the query, but rejecting at the WS layer surfaces the error to the client cleanly.
- Future `defect.<defectId>` + `agent_run.<agentRunId>` channels — emit-method skeletons added; subscribe-side auth dispatch lands in Day-19 follow-up alongside A4 RCA + AgentRun wiring.

**New `@SubscribeMessage` handlers:**

- `subscribe` → ack `{ event: 'subscribe:ack', data: { channel, ts } }`. Idempotent (Set semantics).
- `unsubscribe` → ack `{ event: 'unsubscribe:ack', data: { channel, ts } }`. No auth check beyond connected — symmetric.

**New public emit methods (called from TestRunService / A4 RCA / AgentRun handlers):**

- `emitTestRunProgress(runId, payload)` → `event: 'test_run.progress'`. Returns count of clients receiving the frame.
- `emitDefectRcaReady(defectId, payload)` → `event: 'defect.rca_ready'`. Skeleton; subscribers wire-up Day-19.
- `emitAgentRunComplete(agentRunId, payload)` → `event: 'agent_run.complete'`. Skeleton; subscribers wire-up Day-19.
- Internal `emitToChannel(channel, event, payload)` does the fan-out: skips clients whose `readyState !== 1` (defensive — `handleDisconnect` cleans up but races exist), JSON-serializes once, sends to each.

**Disconnect cleanup:** `handleDisconnect` now iterates `client.qaNexusChannels` to remove the client from each channel's bucket; garbage-collects empty channel entries to keep the registry bounded.

**Files changed:**

- `apps/api/src/realtime/realtime.gateway.ts` — extended (172 → ~365 LOC). All M0-T026 wiring (handshake auth, echo, header building, IP extraction) preserved verbatim.
- `apps/api/src/realtime/realtime.module.ts` — imports `PrismaModule` (gateway needs `prisma.testRun.findFirst` for subscribe auth); exports `RealtimeGateway` so TestRunService / A4 RCA / AgentRun can inject + call emit\*().
- `apps/api/src/realtime/__tests__/realtime.gateway.spec.ts` (NEW, 10 tests):
  1. `handleConnection` close 4401 when session null
  2. `handleConnection` attaches qaNexus on success
  3. `subscribe` ack-resolves when user has project access
  4. `subscribe` REJECTS (WsException) when Prisma returns null
  5. `subscribe` REJECTS on unsupported channel pattern (no DB call)
  6. `subscribe` REJECTS on malformed payload
  7. `emitTestRunProgress` sends ONLY to subscribed clients
  8. `emitTestRunProgress` SKIPS clients whose readyState != 1 (OPEN)
  9. `emitTestRunProgress` no-op (returns 0) when no subscribers
  10. `handleDisconnect` clears all channel-bucket entries

**Spec-mock pattern:** uses `jest.mock('../../auth/auth.service')` + `jest.mock('../../prisma/prisma.service')` at the module boundary so the `better-auth` ESM chain (auth.config.ts → better-auth) never evaluates inside the CJS jest transformer. Same workaround as Day-17 #138 + #139 better-auth-core-ip.spec.ts pattern.

**Pre-push gates 5/5 ✓:** prettier ✓ · typecheck ✓ · **513/513 jest** (503 baseline + 10 new realtime) · lint clean ✓ · CHANGELOG ✓.

**Prod-boot smoke (manual `(bj)` gate) ✓:** boot log shows `RealtimeGateway subscribed to the "echo" message`, `"subscribe" message`, `"unsubscribe" message` — all three handlers registered. `/health` LIGHT + `/health/deep` both intact (#147 regression-pin holds).

**Hard Rules check:**

- Rule 1 (cost): no new infra. WS multiplexes onto the existing dyno's port.
- **Rule 5 (ban list):** **NO Redis / Valkey / ioredis pub/sub.** Per-process Map only. Confirmed by grep on the gateway file.
- Rule 6 (secrets): no env changes.
- Rule 7 (audit log): subscribe/emit events are NOT individually audit-logged today (they're high-volume); gateway logs structured INFO lines per subscribe + per disconnect. Per-channel emit-count traceable via `emitTestRunProgress` return value if a future caller needs it.
- Rule 11 (escalate): brief watchpoints all confirmed handled — cookie parsing on WS upgrade was already solved by M0-T026's `buildHeadersFromRequest`; no subprotocol negotiation needed; BetterAuth `getSession()` over WS context works via the same Headers object Express middleware passes.

**Acceptance gate (post-merge, gated on M4 close cascade):**

1. Render auto-redeploys
2. WS handshake against `wss://qa-nexus-api.onrender.com/realtime` with valid session cookie → connection accepted
3. Send `{ event: 'subscribe', data: { channel: 'test_run.progress.<real-runId>' } }` from authed FE → ack received
4. Send same with a runId the user lacks access to → WsException close
5. P3 (TestRun service) wires `emitTestRunProgress(...)` into state-transition handlers — F19 Run Console FE polls subscribe + receives live frames

**Followups noted (NOT blockers for this PR):**

- `defect.<defectId>` + `agent_run.<agentRunId>` channel subscribe-side auth dispatch (Day-19 alongside A4 RCA + AgentRun)
- WS path rename `/realtime` → `/ws` if Yogesh wants brief-spec exact match (cosmetic; ADR sidecar)

---

### Changed — Day 18 — `/health` decoupled from DB query (Neon free-tier compute optimization, PR #147 P1)

**P1 cost-gate hold.** Project Neon usage was at **80.81/100 CU-hrs (May 14)** with the burn rate (~5.77 CU-hrs/day) projecting to hit the 100 CU-hr free-tier cap on **May 17** — well before the May-31 reset. Root cause: UptimeRobot 5-min keep-alive pings on `/health` triggered the full subsystem readout including `SELECT 1` against Postgres + `pg_database_size` quota query → kept Neon's compute warm during 9PM-9AM idle hours when no real user traffic. Hard Rule 1 ($0/mo) at risk.

**2-tier endpoint pattern shipped:**

- **`refactor(api)` `GET /health`** — LIGHT. Returns `{ status, timestamp, version }` synchronously. NO DB query, NO R2 head, NO LLM check, NO embedding probe. Just confirms the API process is alive + has bound to a port. UptimeRobot's keep-alive hits this; with no DB query, Neon compute auto-scales to zero during idle hours. Recovers ~3-4 CU-hrs/day → free-tier runway carries through May 31 reset with headroom.

- **`feat(api)` `GET /health/deep`** — FULL. Original MS0-T025 readout: db ping ($queryRawUnsafe SELECT 1, 2s timeout), R2 head, LLM gateway snapshot (in-memory state, NOT live ping — preserves Day-4 quota-frugality), embedding warm state, Neon size quota, OTel exporter status. Returns 200 / 503 / 503 by overall status. Operators curl on demand to verify wiring; NOT in keep-alive path. Body shape unchanged from pre-#146 `/health`.

- **`test(api)`** — `apps/api/src/health/__tests__/health.controller.spec.ts` (NEW, 7 tests):
  1. `/health` returns `{ status, timestamp, version }` with NO Prisma call (`$queryRaw` + `$queryRawUnsafe` both assertion-not-called) + NO R2 call — the regression pin that locks in the (br) optimization
  2. `/health` responds well under 50ms (UptimeRobot perf budget)
  3. `/health` falls back to `version="1.0"` when `npm_package_version` unset
  4. `/health/deep` invokes Prisma `$queryRawUnsafe` (db ping)
  5. `/health/deep` invokes `R2Service.health` (storage subsystem)
  6. `/health/deep` body includes `llm` subsystem readout
  7. `/health/deep` returns 200 (not 500) when db ping succeeds + embedding deferred

- **Pre-push gates 5/5 ✓:** prettier ✓ · typecheck ✓ · **503/503 jest** (496 baseline + 7 new health) · lint clean ✓ · CHANGELOG ✓.

- **Prod-boot smoke (manual (bj) gate) ✓:** NestJS boots clean, both routes mapped: `Mapped {/health, GET}` + `Mapped {/health/deep, GET}`.

- **Hard Rules check:** Rule 1 (cost — entire purpose of this PR; $0/mo retained) · Rule 5 (no banned dep) · Rule 6 (no env changes) · Rule 11 (P1 brief from Yogesh; followup-trigger explicit) · Rule 13 (no UI change; visual gate N/A).

- **No FE coordination needed.** UptimeRobot URL unchanged (`/health` same path).

- **Followup `(br)`** filed at top of `docs/followups.md`: UptimeRobot monitoring interval 5 min → 4 min (~30 sec operator task) to add headroom against Render's 15-min idle spin-down threshold. Sister-monitor via Better Stack free uptime considered if UptimeRobot free plan blocks <5-min interval.

- **Acceptance gate (post-merge):**
  1. Render auto-redeploys (~2 min)
  2. UptimeRobot URL unchanged; next ping (within 5 min) returns LIGHT body without touching DB
  3. Yogesh `curl https://qa-nexus-api.onrender.com/health/deep` → full readout to verify everything still wired
  4. Monitor Neon dashboard for next 24h → daily CU-hr rate drops from ~5.77 → target ~2
  5. May-31 free-tier reset reached with headroom; Hard Rule 1 held

### Added — Day 18 — M4 migration 0004: runs / defects / jira tables (PR #144, M4 kickoff)

**M4 Day-18 AM task complete.** Schema delta for the M4 features (run execution, defect lifecycle, A4 RCA, Jira 2-way sync). Resolved A-F decision matrix from Day-17 BE+1 scratch:

- A — ALTER `test_run_results` (NOT new `test_executions`); adds `actual_result` + `evidence_ids` JSONB + `blocked_reason`
- B — ALTER `jira_connections` (NOT new `jira_integrations`); adds `status_mapping` JSONB + `account_email`; column-reuse for `oauth_access_token_encrypted` via `auth_method` discriminated union
- C — SKIP `jira_links` (defect↔jira via existing 1:1 `defect.jira_issue_id` FK)
- D — ALTER `rca_reports` (NOT new `defect_rca`); adds 5× `layer{1..5}_confidence` DOUBLE PRECISION + `otel_trace_id` + `feedback` JSONB
- E — ALTER `defects`; adds `component` + `verified_at` + `closed_at` (skip `state`/`assignee_id` — already exist)
- F — snake_case lowercase enum casing (matches existing canon)

**New tables (4):** `evidence` (XOR parent: test_run_result OR defect, DB CHECK enforced) · `defect_history` (state-transition audit trail) · `jira_webhook_events` (UNIQUE on event_id, dedup partial index) · `jira_sync_logs` (SHA-256 payload_hash + retry chain).

**Enum extension:** `jira_auth_method` += `api_token` (PM1 supports both api_token + oauth_3lo per Yogesh's Day-17 Jira decision).

**Audit-log linkage:** every new table has nullable `audit_log_id` FK to `audit_log` (HMAC-SHA256 chained per PM1_ERD §3.13). SetNull on cascade keeps audit chain immutable.

- **`feat(api)`** — new raw migration `apps/api/prisma/raw/migrations/0004_m4_runs_defects_jira.sql` (~290 lines including comprehensive header). All ALTERs are `ADD COLUMN IF NOT EXISTS` + `ALTER TYPE ... ADD VALUE IF NOT EXISTS` (idempotent re-run safe). All new tables are `CREATE TABLE IF NOT EXISTS`. Single transaction for atomicity. New `prisma:apply-raw:0004` script in `apps/api/package.json` (Yogesh-only invocation).

- **`feat(api)`** — `apps/api/prisma/schema.prisma` synchronized: `JiraAuthMethod` enum extended, ALTERs to `JiraConnection` / `Defect` / `RcaReport` / `TestRunResult` (new fields + back-relations), 4 new models (`Evidence` with XOR parent, `DefectHistory`, `JiraWebhookEvent`, `JiraSyncLog` with retry chain self-relation), back-relations added to `User` (`evidenceCreated`, `defectHistoryActions`) + `AuditLog` (`evidence`, `defectHistory`, `jiraSyncLogs`). `prisma format` + `prisma validate` + `prisma generate` all clean.

- **`feat(shared)`** — new M4 Zod schemas under `packages/shared/src/schemas/m4/`: 10 files (enums, evidence, defect, defect-history, jira-integration with discriminated union, jira-webhook-event, jira-sync-log, test-run, test-execution with status-conditional refines, rca-report with confidence 0-1 range, plus barrel `index.ts`). Re-exported as `m4` namespace from `packages/shared/src/index.ts` to avoid name collisions with legacy M0-M3 schemas (`DefectSchema`, `TestRunSchema`, `RcaReportSchema` exist at package root from earlier milestones; M5 retro will dedupe). Consumer pattern: `import { m4 } from '@qa-nexus/shared'; m4.DefectSchema.parse(...)`.

- **Pre-flight (Yogesh, Day-17 evening on Neon prod):** `SELECT COUNT(*)` on `test_runs` / `test_run_results` / `defects` / `rca_reports` / `jira_connections` → all **0**. `SELECT DISTINCT status` on `test_runs` / `defects` → no rows. **Option A (direct ALTER) is safe**; no Option B 3-step backfill needed.

- **Pre-push gates 5/5 ✓:** prettier ✓ · typecheck ✓ · **496/496 jest tests** (no new tests in this PR; schema-only addition with type-level coverage from existing suites) · lint clean ✓ · CHANGELOG ✓.

- **Hard Rules check:**
  - Rule 1 (cost): no new infra
  - Rule 5 (ban list): no banned deps
  - Rule 6 (secrets): no env changes; AES-GCM ciphertext columns inherited from existing `crypto.ts` (PR #115)
  - Rule 7 (audit log): new tables wire `audit_log_id` per PM1_ERD §3.13; HMAC chain enforced at app layer by `AuditService` writes
  - Rule 11 (escalate): pre-flight check + brief decision matrix authored Day-17 evening; A-F resolved before code

- **HOLD merge.** Per Day-18 brief: Yogesh runs `pnpm --filter @qa-nexus/api prisma:apply-raw:0004` against Neon manually (NOT auto-applied in CI). After Yogesh confirms applied + verifies via `\d evidence` / `\d defect_history` / `\d jira_webhook_events` / `\d jira_sync_logs` / `SELECT enum_range(NULL::jira_auth_method)`, PR can squash-merge.

- **Acceptance gate (post-apply + merge):**
  1. Yogesh: `pnpm --filter @qa-nexus/api prisma:apply-raw:0004` against Neon; transaction commits cleanly
  2. Verify: `\d evidence` shows XOR check constraint, `enum_range(NULL::jira_auth_method)` returns `{oauth_3lo, api_token}`, `\d rca_reports` shows 5 confidence + otel_trace_id + feedback columns
  3. Merge PR → Render auto-redeploys (~2 min) → boot smoke clean (no Prisma drift; client matches DB)
  4. M4 Day-18 PM TASK 2 (WebSocket gateway) unblocks

### Fixed — Day 17 — Drop `/auth/` prefix in magic-link verify URL (Next.js route-group convention, completes M3 close)

**Day-17 third + final P0 of the magic-link saga.** After PR #138 restored the API from the zod-v4 crash, Yogesh clicked the magic-link in Gmail and got a **Next.js 404** at `/auth/verify-magic-link`. Manually visiting `https://qa-nexus-web.pages.dev/verify-magic-link` (no `/auth/` prefix) rendered the page cleanly with the Iksula brand + expected "Sign in failed — No sign-in token found" state.

**Root cause (Next.js docs):** PR #137's FE page lives at `apps/web/src/app/(auth)/verify-magic-link/page.tsx`. The `(auth)` parenthesized segment is a **Next.js route group** — per [the official docs](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups):

> "(folderName) ... should not be included in the route's URL path"

So `(auth)` is stripped at routing time and the page mounts at `/verify-magic-link`, NOT `/auth/verify-magic-link`. PR #137's BE-side `sendMagicLink` callback incorrectly assumed the URL would include `/auth/`. Result: scanner pre-fetch worked (Gmail follows the link to the 404 page), real user click landed on a Next.js 404. No `?error=INVALID_TOKEN` symptom because the token never reached BA's verify endpoint — the FE page that POSTs to BA was never rendered.

**Decision direction:** BE emit matches FE URL convention, NOT the other way around. FE+1's `(auth)` route-group preserves the file-system organization pattern that all other auth-flow pages share (`sign-in`, `verify`, `onboarding/**`, `set-password`, `reset-password` — all live under `app/(auth)/`). Moving the FE page out of the group would break that convention. Changing one line of BE code is the right surface for the fix.

**Changes shipped here:**

- **`fix(api)`** — `apps/api/src/auth/auth.config.ts` `sendMagicLink` callback: drop `/auth/` segment from constructed URL. Before: `${cleanBase}/auth/verify-magic-link?...`. After: `${cleanBase}/verify-magic-link?...`. Plus a multi-line inline comment block citing the Next.js docs + the route-group convention so a future engineer doesn't add `/auth/` back when refactoring. Token + callbackURL handling unchanged. Soft-fallback `FRONTEND_BASE_URL` unchanged.

- **`test(api)`** — `apps/api/src/auth/__tests__/send-magic-link.spec.ts`: 5 of the 6 existing tests updated to assert the new URL shape (regex match dropped `\/auth\/`, literal-string `toContain` checks now `/verify-magic-link?` not `/auth/verify-magic-link?`). Test #1 ("emits FE confirm-page URL, not BA verify endpoint") **strengthened** with an additional negative assertion: `expect(arg.magicLinkUrl).not.toContain('/auth/verify-magic-link')` — pins the PR #139 regression specifically. Net test count: **496/496 still passing** (1 strengthened, 5 modernized; no tests added or removed).

- **`test(api)`** — `apps/api/src/auth/__tests__/t021-auth.config.spec.ts`: the legacy magic-link send test ("passes `in 10 minutes` expiry copy to EmailService") updated to assert the new FE URL: `https://qa-nexus-web.pages.dev/verify-magic-link?token=abc&callbackURL=%2Fhome` (was `/auth/verify-magic-link`).

- **No new test files.** Existing coverage is the right surface — no parallel testing dimension introduced.

**Why this couldn't be caught by PR #137's tests:** the tests asserted the URL contained `/auth/verify-magic-link`, which exactly matched the BE-emitted URL. The mismatch was BE↔FE (server emits one path, client expects another), not BE-internal. The only way to catch this in CI would be an E2E test that follows the emitted URL against a running FE worker. Filed as part of `(bj)` followup expansion.

**Pre-push gates 5/5 ✓:** prettier ✓ · typecheck ✓ · **496/496 tests** ✓ · lint clean ✓ · CHANGELOG ✓.

**Prod-boot smoke (manual `(bj)` gate) ✓:** 10-second local prod-mode boot shows NestJS startup + BetterAuth initialised + all `/auth/*` routes mapped + NO `z.ipv4` TypeError (#138 override intact) + NO `allowedAttempts` warning (#132 removal intact).

**Hard Rules check:**

- Rule 1 (cost): no new infra
- Rule 5 (ban list): no deps changed
- Rule 6 (secrets): no env changes
- Rule 11 (escalate): not triggered — research-confirmed 1-line fix with Next.js docs reference + manual page-visit proof from Yogesh

**Acceptance gate (post-merge):**

1. Render auto-redeploys (~2 min)
2. Yogesh requests fresh magic-link via FE sign-in form
3. Email arrives with URL ending `/verify-magic-link?token=...&callbackURL=...` (NO `/auth/` segment)
4. Gmail scanner pre-fetches → page renders harmlessly (no token POST)
5. Yogesh clicks link in Gmail → lands on `/verify-magic-link` → clicks "Confirm Sign In"
6. POST to BA → token consumed → session cookie set → redirect to `/home`
7. **M3 close visual gate finally GREEN end-to-end**

**Followup expansion `(bj)`:** pre-push gate request-level smoke should also fetch the emitted FE URL against either the deployed Cloudflare Pages worker OR a local `pnpm --filter web build && start` worker, to catch the entire URL-mismatch class of bugs. Separate PR.

### Fixed — Day 17 — Scope zod@^4 override for `@better-auth/core` (P0 prod crash, completes #132)

**Day-17 second P0 crash, final fix.** After #137 merged, Render's first auth request crashed:

```
TypeError: z.ipv4 is not a function
    at isValidIP (@better-auth/core@1.6.11/.../utils/ip.mjs:7:11)
    at getIp (better-auth@1.6.11/.../get-request-ip.mjs:13:8)
    at resolveRateLimitConfig (rate-limiter/index.mjs:107)
```

**Root cause:** PR #132 added `pnpm.overrides: "better-auth>zod": "^4.3.6"` to fix BA 1.6.11's zod-v4 requirement, but `@better-auth/core` is a **separate npm package** (BA's modular split since 1.6) — its `dependencies.zod` got the root workspace pin (`^3.25.76`) instead of v4. The v4-only `z.ipv4()` API is invoked at request-time inside `@better-auth/core/dist/utils/ip.mjs:7` to validate Render's `X-Forwarded-For` IP. The TypeError crashed BA's request handler before any error middleware could catch it → Render 502.

**Why the boot-smoke from PR #132's gate missed it:** `isValidIP` is called on every auth request, never at module load. The 10-second prod-mode boot test in PR #132 confirmed Nest started + routes mapped — exactly what Render also showed — but the crash only manifests when a real auth request lands. The (bj) followup gate (boot-smoke step in pre-push) is therefore **insufficient**; it needs a request-level smoke (POST `/auth/sign-in/magic-link` with `X-Forwarded-For` header) to catch this class of bug. Filed as (bj-amend) below.

**Why all 4 jest suites under `apps/api/src/auth/__tests__/` missed it:** every existing auth spec does `jest.mock('better-auth')` at the top — the real `@better-auth/core` module never loads in any of the 38 test suites. Module-load + request-handling crashes in BA internals are invisible to test-mocked imports.

**Changes shipped here:**

- **`chore(deps)`** — root `package.json` `pnpm.overrides` gets one new entry: `"@better-auth/core>zod": "^4.3.6"`. Sibling to the existing `"better-auth>zod"` override from PR #132. `pnpm install --no-frozen-lockfile` regenerated the lockfile. After install, the pnpm slot for `@better-auth/core@1.6.11` now nests `zod@4.4.3` (was `zod@3.25.76`). Verification:

  ```
  $ ls node_modules/.pnpm/@better-auth+core@1.6.11*/node_modules/zod/package.json
  → "version": "4.4.3"  ✓ (was "3.25.76")
  ```

- **`test(api)`** — NEW `apps/api/src/auth/__tests__/better-auth-core-ip.spec.ts` (4 pinning tests, ~120 LOC). Exercises the override via filesystem-resolution checks rather than direct ESM import (transitive subpath import of `@better-auth/core/utils/ip` doesn't load through jest's CJS transformer). The 4 pinned invariants:
  1. Root `pnpm.overrides` contains `@better-auth/core>zod` matching `^?4.x`
  2. Root `pnpm.overrides` still has the sibling `better-auth>zod: ^?4.x` from PR #132
  3. `@better-auth/core@1.6.x` resolves to `zod@4.x` in its pnpm slot (NOT `zod@3.x`)
  4. `@better-auth/core/dist/utils/ip.mjs` exists + source contains `z.ipv4`/`z.ipv6` (the v4-only API that crashed) — proves the crash file is the SAME shape we're testing against

  Together these crash the test suite if a future engineer removes the override line or downgrades BA. Total BE jest suite: 492 → **496/496 passing**.

- **Verification artifacts** (captured locally; NOT in CI gate due to jest/ESM constraint above):
  - `pnpm why zod` shows both versions resolved:
    ```
    zod@3.25.76  ← workspace + @qa-nexus/api + @qa-nexus/shared
    zod@4.4.3    ← @better-auth/core + better-auth + better-call
    ```
  - Direct Node runtime invocation of the exact crash entrypoint:
    ```
    $ node --input-type=module -e "import('.../node_modules/.pnpm/@better-auth+core@1.6.11_*/node_modules/@better-auth/core/dist/utils/ip.mjs').then(m => {
        console.log(m.isValidIP('203.0.113.42'));   // Render-style X-Forwarded-For
        console.log(m.isValidIP('::1'));
        console.log(m.isValidIP('not-an-ip'));
      })"
    → true
    → true
    → false
    → CLEAN — no z.ipv4 TypeError ✓
    ```

- **Hard Rules check:** Rule 1 (no new infra), Rule 5 (no banned dep — only an override addition), Rule 6 (no secrets), Rule 11 (escalated BEFORE writing code when initial brief diagnosis "BA's getIp throws → uncaught in rate-limiter" didn't match the BA 1.6.11 source, which returns null gracefully; Yogesh provided the actual Render stack trace showing `z.ipv4 is not a function`, which matched a different root cause path entirely).

- **Acceptance gate (post-merge):**
  1. Render auto-redeploys (~2 min). Boot log MUST show NestJS startup + port-bind within 10s.
  2. Yogesh requests fresh magic-link via FE sign-in form → email arrives with FE confirm-page URL (per #137).
  3. Clicks link in Gmail → lands on `/auth/verify-magic-link` page → clicks "Confirm Sign In".
  4. POST to `/auth/sign-in/magic-link` MUST NOT crash with `TypeError: z.ipv4 is not a function`.
  5. Session cookie set → redirect to `/home`. **M3 close visual gate finally GREEN.**

- **Followup `(bj)` amendment filed (separate PR):** pre-push gate needs request-level smoke (POST `/auth/sign-in/magic-link` with `X-Forwarded-For`), not just boot-smoke. Boot-smoke alone is insufficient for module-load-vs-request-handler crash classes — proven by this incident.

### Added — Day 18 — Intermediate confirm page (magic-link Gmail prefetch fix) + cross-tab session sync (PR #137, M3 close blocker)

**FINAL M3 close blocker.** Atomic FE + BE PR. Fixes the Gmail-prefetch class of magic-link failure (BetterAuth ≥ 1.6.11 hardcoded atomic single-use via GHSA-hc7v-rggr-4hvx; Gmail's email-security scanner pre-fetches links and consumes the token before the real user clicks). Canonical pattern (Slack, Notion, Linear, GitHub all use this): the magic-link URL now points to a FE page with a "Confirm Sign In" button instead of directly to the BetterAuth verify endpoint. Scanner can pre-fetch the page but can't click the button; real user clicks → POSTs token → session cookie set → redirect to `callbackURL`.

**FE changes (this commit):**

- **NEW** `apps/web/app/(auth)/verify-magic-link/page.tsx` (~210 LOC) — intermediate confirm page with three view states (`ready` / `loading` / `error`). Reuses `<BrandMark />`, `<Button variant="primary">`, and the sign-in page's centered-card layout for visual consistency. Open-redirect guard on `callbackURL` (rejects protocol-relative `//host` URLs + non-absolute paths, falls back to `/home`). AdminShell deliberately NOT wrapped (Hard Rule 14 exclusion for auth-flow pages). Wrapped in `<Suspense>` per Next.js 15 static-prerender requirement (same pattern as sign-in page).
- **MODIFIED** `apps/web/app/(auth)/sign-in/page.tsx` — added cross-tab session polling (~30 LOC). While "Check your inbox" is on screen, polls `authClient.getSession()` every 2 s; when the verify-magic-link tab completes sign-in and sets the session cookie, the original sign-in tab auto-redirects to `/home`. 10-minute hard timeout (matches BA `expiresIn: 600s`). Three-layer cleanup (unmount + state-change + timeout).

**BE changes (cherry-picked onto this branch by BE+1, commit `ca7bb84`):**

- `apps/api/src/auth/auth.config.ts` — `sendMagicLink` callback now destructures `token`, parses `callbackURL` out of BA's default `url`, and builds a FE-rooted confirm-page URL `${FRONTEND_BASE_URL}/auth/verify-magic-link?token=<encoded>&callbackURL=<encoded>` instead of passing BA's verify endpoint URL through. `FRONTEND_BASE_URL` soft-fallback to `https://qa-nexus-web.pages.dev` (matches Day-15 PR #122 + #129 baseURL precedent; followup `(be)` tracks Cloudflare env-var baking fix). Trailing-slash safe, special-char tokens URL-encoded, `callbackURL` defaults to `/home` when absent.
- `apps/api/src/auth/__tests__/send-magic-link.spec.ts` (new) — 6 pinning tests: emits FE URL not BA endpoint · preserves callbackURL · defaults to `/home` · soft-fallback · URL-encodes `+`/`/`/`=` · strips trailing slash.
- `apps/api/src/auth/__tests__/t021-auth.config.spec.ts` — 1 existing test updated to assert the new FE-URL contract (expectation flipped from BA verify URL to FE confirm-page URL).
- **Pre-push gates 5/5 ✓** (BE half): prettier ✓ · typecheck ✓ · **492/492 tests** (486 pre-#137 + 6 new pinning tests, 1 updated) · lint ✓ · CHANGELOG ✓.
- **Prod-boot smoke ✓** (manual (bj) gate until husky step ships): 10s NestJS boot clean, BetterAuth initialised with basePath=/auth, all `/auth/*` routes mapped, **NO `allowedAttempts` warning** (#132 removal intact), **NO `TypeError ... meta is not a function`** (#132 zod override intact). DB-connect error at tail is expected for local-only repro (fake `DATABASE_URL`).
- Per `.claude/scratch/137-be-sendmagiclink-draft.md` Option α.

**Render env var required post-deploy:**

- `FRONTEND_BASE_URL=https://qa-nexus-web.pages.dev` (belt-and-suspenders to BE soft fallback; same Cloudflare Pages × Next.js 15 env-var injection bug as PR #122 motivates the hardcoded fallback).

**Visual gate (Hard Rule 13):**

- `docs/screenshots/m3-verify-magic-link/verify-ready-1440.png` — desktop, button enabled, Iksula brand panel above card
- `docs/screenshots/m3-verify-magic-link/verify-ready-320.png` — mobile, button full-width, all copy fits
- `docs/screenshots/m3-verify-magic-link/verify-error-1440.png` — desktop, "Sign in failed" + "Request a new link" CTA
- `docs/screenshots/m3-verify-magic-link/verify-error-320.png` — mobile, error state, no overflow

**Yogesh end-to-end test plan (post-merge):**

1. Render auto-redeploys after merge (~2 min)
2. Set `FRONTEND_BASE_URL` env var if not already
3. Request fresh magic-link from `/sign-in`
4. Open Gmail → click magic-link → expected: lands on `/auth/verify-magic-link?token=...` with "Confirm Sign In" button visible
5. Click "Confirm Sign In" → expected: redirects to `/home` with session cookie set
6. Switch back to original sign-in tab → expected: auto-redirected to `/home` within 2-3 s (cross-tab polling)
7. Reply MAIN: "magic-link GREEN end-to-end"

**HOLD merge until M3 close PR lands.** Per Yogesh instruction — same hold policy as #135 (F19) and #136 (AdminShell drift). After M3 close PR cascade signal, drop "ready to merge" here for squash-merge.

**Files:**

- NEW `apps/web/app/(auth)/verify-magic-link/page.tsx`
- MODIFIED `apps/web/app/(auth)/sign-in/page.tsx` (cross-tab polling)
- MODIFIED `apps/api/src/auth/auth.config.ts` (BE one-liner, cherry-picked)
- NEW `apps/api/src/auth/__tests__/send-magic-link.spec.ts` (6 tests, BE)
- NEW `scripts/m3-verify-magic-link-sweep.js` (visual gate sweep)
- NEW `docs/screenshots/m3-verify-magic-link/` (4 PNGs)
- MODIFIED `docs/CHANGELOG.md` (this entry)

**Cross-references:**

- GHSA-hc7v-rggr-4hvx — BetterAuth atomic single-use security advisory
- BetterAuth GH #6104, #7406 — magic-link callbackURL behavior
- PR #130 → #131 → #132 → #133 — Day-17 better-auth bump saga (this PR closes the cascade)
- PR #135 (F19 Run Console) — sister M3 close blocker, HOLD
- PR #136 (AdminShell drift fix) — sister M3 close blocker, HOLD
- `.claude/scratch/137-be-sendmagiclink-draft.md` — BE+1's Option α cherry-pick draft

### Fixed — Day 18 — AdminShell drift fix vs F15 v2 canonical (M3 close blocker, PR #136)

**Pixel-faithful AdminShell drift fix.** Playwright probe (canonical F15/F19 v2 HTML vs React port @ 1440/1024/768/320) revealed three categories of drift that survive F19 PR #135. Single-component fix in `apps/web/components/admin/admin-shell.tsx` cascades retroactively to **every authenticated page** in the project (F08 Home, F09 Projects, F12-F15 KB family, F14 Requirements, F16abc Test Cases, F19 Run Console (after #135), F27, F28).

**Three drift items resolved:**

1. **Data-tone nav-icon chip alpha mismatches (Item 3).** `toneStyle()` had hardcoded `rgba(X, 0.12) / 0.30` for all non-home tones; canonical alpha values differ per tone — `primary` is 0.10/0.28, `warn/pass/fail` are 0.14/0.34. Swapped all hardcoded literals for `var(--*-soft) / var(--*-line)` tokens (already in globals.css :root from F19 Round 2). Single edit-site for any future alpha tweak. Also fixed `secondary` chip color: was `var(--secondary)` violet `#a78bfa`, canon F15 L197 specifies `var(--ai-accent)` lighter violet `#c4b5fd`.

2. **Utility-bar item geometry (Item 1).** Probe-confirmed drift:
   - `icon-btn` height: was `h-9 w-9` (36px) at all viewports; canon F15 L108/112 specifies 44px (`--tap`) at <1024px, 36px at ≥1024px. WCAG 2.5.5 tap-target compliance restored at mobile + tablet. Fixed to `h-11 w-11 lg:h-9 lg:w-9`.
   - `user-pill` height: was ~42px (`py-1.5` + 28px avatar + border); canon L120 is 36px. Pinned `h-9` + avatar `h-7 w-7` (28px per L122) + padding `py-0.5 pl-0.5 pr-2.5` per L121.
   - `user-pill` border-radius: Tailwind `rounded-full` computes to `calc(infinity*1px)` = 33554432px in Tailwind 4; canon is `999px`. Pinned `borderRadius: '999px'` inline.
   - `proj-pill` height: was `auto` (no explicit height); canon L94 is 36px. Pinned `h-9`.
   - `mode-toggle` height: was `auto`; canon L114 is 32px. Pinned `h-8`.
   - **Belt-and-suspenders 6px radius pin** applied to proj-pill / global-search / icon-btn / mode-toggle wrapper / mobile-drawer close / project-pill IR dot / global-search ⌘K kbd. Tailwind `rounded-md` is 6px today, but inline `borderRadius: '6px'` defensively survives any future theme override. Hamburger pinned to canonical 8px (L89). User-pill pinned to canonical 999px (L121).

3. **Nav-item left-alignment (Item 2) — VERIFIED no drift.** Probe confirms `display: flex / align-items: center / gap: 10px / padding: 8px 10px / flex-direction: row` all match canonical L181 at every viewport. The only string-level difference is `textAlign: start` (canon) vs `left` (react) — semantically identical in LTR per CSS spec. No code change needed; documented in PR for future probe baseline.

**Retroactive cascade impact:** This fix lands at the shell component level. The colored nav-icon chips, correct utility-bar heights, and pinned radii silently propagate to F08, F09, F12, F13, F14, F15, F16a/b/c, F19 (post-#135), F27, F28 — every page wrapped by `AdminShell`. No per-page edit required.

**Probe-verified property match (re-probe after fix @ 4 viewports):**

| Item                                                               | 1440            | 1024 | 768 | 320 |
| ------------------------------------------------------------------ | --------------- | ---- | --- | --- |
| Utility-bar radii + heights                                        | ✅              | ✅   | ✅  | ✅  |
| Nav-item alignment                                                 | ✅ (start≡left) | ✅   | ✅  | ✅  |
| Data-tone chip colors (home/primary/secondary/info/warn/pass/fail) | ✅              | ✅   | ✅  | ✅  |

**Files:**

- `apps/web/components/admin/admin-shell.tsx` — `toneStyle()` + `IconButton` + user-pill + proj-pill + global-search + mode-toggle + hamburger + drawer-close (all geometry/radius fixes)
- `scripts/m3-adminshell-drift-fix-sweep.js` — NEW visual gate sweep (5 viewports + mobile drawer open)
- `docs/screenshots/m3-adminshell-drift-fix/` — NEW 6 PNGs (1440 / 1440-collapsed / 1024 / 768 / 320 / 320-drawer)

**HOLD merge until M3 close PR lands** (per Yogesh instruction, same policy as #135 F19 PR). Sister PR — branched off `feature/fe-m4-f19-run-console-pattern-a` (#135) so it inherits F19's globals.css token additions; will rebase cleanly onto main after #135 merges.

**Cross-references:**

- F15 v2 canonical: `PM1_UI_v2/Redesign Frame by claude design/F15 Knowledge Base v2.html` (lines 89 / 94-99 / 102-105 / 108-112 / 114-118 / 120-125 / 181-187 / 195-201)
- `_DESIGN_RULES.md` Rule 14 (shell parity) · Rule 1 (tokens only from 01_SYSTEM.md)
- Hard Rule 14 (CLAUDE.md) — codified F19 React as AdminShell canonical per Yogesh decision in #135 PR
- F19 PR #135 — sister M3-close blocker, established `--*-soft / --*-line` tokens this fix depends on
- Followup `(bk)` — formal addition of `--ai-accent` + tone alpha values to `01_SYSTEM.md §3 Design Tokens`

### Fixed — Day 17 — Silent prod crash on better-auth 1.6.11 boot + remove dead `allowedAttempts` (P0 fixes #130, blocks M3 close)

**P0 production-restore PR.** PR #130 (better-auth bump 1.2.12 → 1.6.11 + `allowedAttempts: 3`) silent-crashed Render on deploy with `==> No open ports detected · ==> Exited with status 1 (19s after start)`. Yogesh rolled back to the previous deploy artifact (BA 1.2.12). This PR is fix-forward; PR #130's commit stays on main per scope-discipline directive.

**Two root causes, both surfaced by local prod-mode boot test (the gate that should have caught #130):**

1. **Zod-version mismatch.** `better-auth@1.6.11` declares `dependencies.zod: ^4.3.6` and uses zod-v4-only APIs at module load time (`z.coerce.boolean().meta(...)` in `cookies/session-store.mjs:192`). Root `package.json` has a workspace-wide `pnpm.overrides`: `{"zod": "^3.25.76"}` (legitimate — keeps zod uniform across BE+FE+shared). That override silently downgraded BA's `zod@^4.3.6` request to `zod@3.25.76` → BA's compiled `.mjs` imported zod, called `.meta()`, v3 doesn't have it → synchronous `TypeError` at top-level module evaluation, BEFORE NestJS Logger initialised → silent crash on Render.

2. **`allowedAttempts` is a no-op in BA ≥ 1.6.11.** Discovered when post-fix boot test printed: `[better-auth/magic-link] allowedAttempts is ignored: tokens are consumed atomically on the first verification call (GHSA-hc7v-rggr-4hvx). Any value other than 1 has no effect; remove the option to silence this warning.` The security advisory hardcoded single-use atomic consumption — concurrent verifies could otherwise mint multiple sessions from one token. So the entire premise of #130's `allowedAttempts: 3` doesn't apply on BA ≥ 1.6.11. The Gmail-prefetch problem is real but the canonical fix is the **intermediate-confirm-page pattern** (Slack / Notion / Linear / GitHub all use this) — FE renders `/auth/verify-magic-link?token=...` with a "Confirm Sign In" button; the token is POSTed only on the real user click. Followup `(bk)` filed; tracks to PR #133.

**Changes shipped here:**

- **`chore(deps)`** — root `package.json` `pnpm.overrides` gets one new entry: `"better-auth>zod": "^4.3.6"`. Scoped — installs `zod@4` in `better-auth@1.6.11`'s slot only, leaves the workspace-wide `zod@^3.25.76` pin intact for all our own code, FE auth client, `@qa-nexus/shared` schemas, etc. `pnpm install --no-frozen-lockfile` regenerated the lockfile (~600 lines of churn — Zod v4 has different transitive helper tree). `pnpm-lock.yaml` committed alongside. We do NOT import any zod types FROM better-auth anywhere in `apps/api/src/` (grepped to confirm) — so no type drift; the two zod versions coexist safely.

  Verification:

  ```
  $ pnpm --filter @qa-nexus/api why zod
  zod@3.25.76   ← workspace + @better-auth/core (our code)
  zod@4.4.3     ← better-auth@1.6.11 + better-call@1.3.5 (BA's internal)
  ```

- **`fix(api)`** — `apps/api/src/auth/auth.config.ts` removes the dead `allowedAttempts: 3` line shipped in #130 (now a no-op + emits BA runtime warning). Replaced with a multi-line comment block recording the discovery: cites GHSA-hc7v-rggr-4hvx, references the runtime warning verbatim, points forward to followup `(bk)` for the intermediate-confirm-page solution. Keeps `expiresIn: 60 * 10` unchanged.

- **`test(api)`** — `apps/api/src/auth/__tests__/t021-auth.config.spec.ts` flips the `allowedAttempts=3` pinning test (shipped in #130) into a negative pin: `expect(call).not.toHaveProperty('allowedAttempts')`. Locks in the removal so the dead option doesn't drift back in by accident if a future engineer re-reads the stale GH #6985/#5550 advice. Test count stays at 486.

**Why the 5 pre-push gates missed #130** (documented for audit):

- `tsc --noEmit`: BA's `.d.ts` doesn't expose zod-v4-specific types externally; we consume narrowed exports (`betterAuth`, `magicLink`, `prismaAdapter`, `toNodeHandler`, `nextCookies`). The `.meta()` call lives inside BA's compiled `.mjs`, not exposed to the type surface.
- `jest`: `t021-auth.config.spec.ts` mocks the entire `'better-auth'` module — BA's real code never loads in any of the 36 test suites. Module-load crashes are invisible to test-mocked imports.
- **No prod-mode boot smoke step.** This is the gap. The 5-second prod-mode boot would have caught both #130 (zod meta crash) and the no-op warning before merge. Followup `(bj)` ships the husky pre-push addition.
- `prettier`/`lint`: source-formatting only.
- `CHANGELOG`: doc gate.

**Verification artifacts** (captured locally):

- `pnpm why zod` output paste (above)
- 10-sec boot log paste in PR body — Nest fully bootstrapped, all `/auth/*` routes mapped, NO `allowedAttempts is ignored` warning, NO `TypeError: ... .meta is not a function`
- **486/486 jest tests pass** (same count; one test flipped from positive to negative pin, no net add)

**Hard Rules check:**

- Rule 1 (cost): no new infra.
- Rule 5 (ban list): zod v4 not on ban list; pnpm scoped override is a config change, not a new dep.
- Rule 6 (no secrets): no env changes.
- Rule 11 (escalate before non-trivial decision): escalated TWICE — (a) when local prod-boot reproduced the crash + revealed the zod-meta root cause, surfaced 4 paths to Yogesh; (b) when the post-fix boot log revealed the `allowedAttempts` no-op warning, surfaced 3 reframed paths and Yogesh chose P1+removal.

**Acceptance gate (post-merge):**

1. Render auto-redeploys (~2 min). Boot log MUST show NestJS startup logs + port-bind within 10s. If silent again → ROLLBACK + escalate.
2. Yogesh re-tests magic-link from `qa-nexus-web.pages.dev/sign-in`. Gmail-prefetch issue is STILL EXPECTED to surface as `?error=INVALID_TOKEN` — that closes on PR #133 (intermediate-confirm-page, followup `(bk)`).
3. M3 close magic-link visual gate is GREEN once PR #133 merges + Render redeploys + Yogesh confirms.

**Followups filed:**

- `(bj)` — add prod-mode boot smoke step to `.husky/pre-push` so dep bumps that silent-crash at module-load time are blocked at author-time, not at deploy-time. ~5 LOC husky addition. PR after #132 lands.
- `(bk)` — intermediate-confirm-page pattern: FE renders `/auth/verify-magic-link?token=…` with a "Confirm Sign In" button; token POSTed only on real user click; scanner prefetch loads the page but never POSTs → token survives. Coordinates BE+1 (BA `sendMagicLink` URL change, ~10 LOC) + FE+1 (new page route, ~80 LOC + test). Becomes PR #133 this session.

### Fixed — Day 17 — Magic-link `?error=INVALID_TOKEN` from Gmail prefetch (M3 close visual-gate blocker)

**Day-17 P0 root cause closed.** Gmail's email-security scanner pre-fetches inbound URLs (including magic-link tokens) before the user clicks, to scan for malware. With BetterAuth's default `allowedAttempts=1`, that pre-fetch consumed the single-use token → real user click hit `?error=INVALID_TOKEN` → visual gate blocked. Per BetterAuth maintainer guidance in GH discussions #6985 + #5550, the fix is `allowedAttempts: 3` on the magic-link plugin (scanner = 1, user = 1, retry = 1). Option requires BetterAuth ≥ 1.5; we were on 1.2.12. Bumped to 1.6.11 (latest 1.6 stable, NOT 1.7-beta).

- **`chore(deps)`** — `apps/api/package.json`: `better-auth` `~1.2.0` → `~1.6.11`. pnpm resolved 1.6.11. Locked-deps policy allows minor bumps within major (no `enforce-pm1-stack.sh` block — better-auth not on the version-pin list). Bonus security wins from 1.6: (a) magic-link race-condition fix where concurrent verification requests could mint multiple sessions from one token (silent regression in 1.5.x), (b) `verification` table schema stabilization that was inconsistent across 1.5.x patch releases. **Zero type drift surfaced** — `pnpm typecheck` clean on first run after upgrade. No source changes elsewhere in the codebase. **Prisma schema unchanged** — our `auth_user` / `auth_session` / `auth_account` / `auth_verification` tables (from `20260428051015_add_betterauth_tables`) already match BetterAuth 1.6's expected core schema (`identifier` / `value` / `expiresAt` / `createdAt` / `updatedAt`).

- **`fix(api)`** — `apps/api/src/auth/auth.config.ts` (the `magicLink({ ... })` plugin block): add `allowedAttempts: 3`. Inline comment cites GH #6985 + #5550 + the Day-17 visual-gate incident. NOT `Infinity` — that would disable attempt-based invalidation entirely (too lax). 3 leaves headroom for: Gmail scanner (1) + real user click (1) + one operator retry (1).

- **`test(api)`** — `apps/api/src/auth/__tests__/t021-auth.config.spec.ts`: new test "magicLink.allowedAttempts=3 — survives Gmail prefetch (Day-17 P0, BetterAuth GH #6985/#5550)" pins the value via `expect(magicLink).toHaveBeenCalledWith(expect.objectContaining({ allowedAttempts: 3 }))`. Sister-line to the existing `expiresIn: 600` pinning test. Total auth.config tests: +1. Full BE jest suite: **486/486 passing** (was 485 + 1 new pin). No behavioural regression in any of the 36 pre-existing test suites.

- **No FE coordination needed.** BetterAuth client API surface unchanged (we use `createAuthClient` + `magicLink` plugin shape that's stable across 1.2 → 1.6). The fix is server-side only.

- **Hard Rules check:** Rule 1 (cost gate — no new infra), Rule 5 (better-auth not on ban list; minor bump within major allowed), Rule 6 (no secrets), Rule 11 (escalated before bumping major version + before any non-trivial decision; Yogesh authored Path A). Visual-gate verification is the user-facing acceptance test per Rule 13.

- **Acceptance gate (post-merge):** Render auto-redeploys (~2 min). Yogesh requests fresh magic-link via FE sign-in → clicks the link directly in Gmail (where the scanner pre-fetch has already consumed attempt 1) → expect land on `/home` with session cookie set, NO `?error=` param. If still INVALID_TOKEN → `allowedAttempts` didn't take effect; escalate.

### Added — Day 17 M4 — F19 Run Console Pattern A scaffold + AdminShell drift fixes + globals.css v2-HTML token compat aliases (2026-05-13 — M3 close blocker)

- **`feat(web)`** — **F19 A1 Run Console Pattern A scaffold ships at `/projects/[slug]/runs/[runId]`.** Direct port of `PM1_UI_v2/Redesign Frame by claude design/F19 Run Console v2.html` (1066 LOC) per Hard Rule 15. **Layout (canonical-faithful):** Run metadata bar (title `Refund Flow — Sprint 42` + chips + LIVE pill + Pause + Stop run) + run meter (5-segment progress bar) + 3-pane body (case list 300px / current case 1fr / evidence rail 360px). **Pane 1:** 12-row case list with counts pill + active row (TC-RET-0247) with pulsing running icon + filter input. **Pane 2:** Now-running eyebrow + display title + chips + Composer agent pill + Curator dedup hint + 5 BDD steps (done/current/queued) + 4 Action buttons (Pass/Fail/Block/Skip filled-variant per canonical L407-414 with kbd hints) + Execution notes textarea. **Pane 3:** Tabbed evidence (Last failure / Screenshots / Console / Network / DOM) + fail card (TC-RET-0342 + capture stream + screenshots + console snippet + env chips) + Sherlock RCA preview (5 layer bars Stack/Env/Config/Code/Data + "Create defect from Sherlock RCA" CTA) + keyboard hints footer. **Pattern A markers (11):** websocket / case-row-click / case-filter / action-pass/fail/block/skip / pause-run / stop-run / tab-change / sherlock / curator-dedup / attach-evidence / voice-memo / notes-save. Day-18 swap point wires to BE WebSocket Gateway.
- **`feat(web)`** — **globals.css :root extended with 20 new tokens** to fix silent visual drift across ALL authenticated pages. Round 1: 3 filled-status inks (`--pass-ink: #022C1F`, `--fail-ink: #3D0707`, `--warn-ink: #3F2300`) per canonical F19 L407-411. Round 2: `--secondary-ink: #2E1065` + 5 v2-HTML short-name aliases (`--border`, `--t1..t4`) → maps to existing project longer names (`--border-subtle`, `--text-primary..disabled`) + 11 alpha variants (`--primary-soft/line`, `--ai-soft/line`, `--pass-soft/line`, `--warn-soft/line`, `--fail-soft/line`, `--info-soft/line`). **Root cause of Round 2 visual gate failure:** v2 HTML frames use SHORT token names but project canon used longer names → `var(--border)` resolved undefined → `border-color: currentColor` fallback → bright white text-primary borders cascading on chips/cards/panes. Token aliases retroactively repair F14/F15/F16abc/F19 + every other authenticated page using v2-HTML token names. Followup `(bk)` tracks formal addition to `01_SYSTEM.md §3 Design Tokens`.
- **`feat(web)`** — **AdminShell drift fixes** (left rail + top utility bar — affects all 10+ authenticated pages). (a) Chip-on-disabled bug: `chipStyle = toneStyle(item.tone)` always; disabled status now affects item text opacity (`opacity-55`) only — matches canonical F15 v2 L181-201 where disabled items retain colored data-tone chip identity. Test Plans/Test Cases/Test Suites/KB chips now render their proper tone colors. (b) Nav-item text-align: added defensive `text-left` to NavLinkRow className to defeat any inherited center-align cascade from parent sections. (c) Corner radii: 5 elements switched from `rounded-full` / `rounded-lg` → `rounded-md` (6px) per canonical L94/102/108 — hamburger / project pill / global-search / mode-toggle wrapper / mobile-drawer close button. (d) Header + rail bg: `bg-[var(--canvas)]` → `bg-[var(--base)]` to match canonical F15 v2 topbar/rail (#111827 not #0B0F17). (e) Bell pip color: `--fail` (red) → `--secondary` (violet) per canonical. (f) Icon-button text color: `--text-secondary` → `--text-tertiary` per canonical. (g) Search omnibox dimensions: shrunk to 36px height, padding 0 10px (was 46×8/16). (h) Mode-toggle "Operate" selected state: subtle `--overlay` bg + `--text-primary` color + 4px radius + 26px height (was bright primary teal + rounded-full + 30px). (i) RWD overflow at 768/906/1024 viewports fixed: search omnibox shifted to `xl:flex` (1280+), mode-toggle shifted to `xl:inline-flex`, header padding/gap shifted to `lg:` — probe-verified 0 overflow at all 7 viewports (320/480/768/906/1024/1280/1440).
- **`feat(web)`** — **F19 Pattern A page-level fixes** (5 rounds of visual-gate iteration): (a) Pane backgrounds correctly mapped — case-list `--canvas`, current-case `--base`, ev-rail `--canvas`, run-metadata-bar `--base` (Round 5 swap fix). (b) Typography — run-title 15px/600/lh22, eyebrow 10px/700/`--info`/1.2px letter-spacing, display-title 22px/700/lh28, BDD-keyword 12px/600, cr-id weight 500, cr-title 12px/`--t1`, env-chip 10px/`--t2`/`--overlay`/3-7 padding (Round 3 corrections per diff-probe). (c) Action buttons FILLED variant — solid pass/fail/warn bg + dark ink text + colored glow on hover (Round 1 correction). (d) Sherlock card content — added canonical "Likely root cause" + "Cluster" text + CTA "Create defect from Sherlock RCA" (was "Open full RCA →"). (e) Case-row hover — `onMouseEnter`/`onMouseLeave` handlers apply `var(--raised)` bg to non-active rows (Round 4 — inline style was overriding Tailwind `hover:*`).
- **`fix(web)`** — `apps/web/app/layout.tsx` — added `suppressHydrationWarning` to `<html>` element (was on `<body>` only) — silences Scribe browser-extension hydration mismatch (`data-scribe-recorder-ready` attribute injected on `<html>` post-SSR). Next.js canonical pattern.
- **`feat(infra)`** — `.claude/hooks/pre-tool-use/enforce-design-tokens.sh` whitelist extended with 4 new hexes: `#022C1F`, `#3D0707`, `#3F2300`, `#2E1065` (all in BOTH worktrees — multi-worktree config quirk discovered Round 2). New tokens are canonical per v2 HTML frames but were never formally in 01_SYSTEM.md `--primary-ink` namespace.
- **`docs(ui)`** — `apps/web/docs/frames/F19-discovery.md` — structural discovery manifest produced via pre-flight ctx_execute on v2 HTML per Day-15 retro lesson 3 (pre-work pattern). Documents layout / tokens / keyframes / media queries / state machine / Iksula canon / Pattern A swap points for the F19 port.
- **`feat(scripts)`** — `scripts/m4-f19-run-console-sweep.js` — Playwright visual-gate sweep (5 viewports — 1440 / 1440-rail-collapsed / 1024 / 768 / 320). Viewport-bounded `clip:` only (NOT `fullPage:`) per API 400 image protocol. Output to `docs/screenshots/m4-f19-run-console/`.
- **`docs(ui)`** — `apps/web/public/_design-refs/F19-new-canonical.html` ships as a side-by-side viewing aid (the canonical F19 v2 HTML served directly from public/ for browser-rendered visual comparison vs the React port). Accessible at `http://localhost:3000/_design-refs/F19-new-canonical.html`.
- **`docs(followups)`** — `(bk)` filed in `docs/followups.md` head: retrofit `--pass-ink` / `--fail-ink` / `--warn-ink` / `--secondary-ink` formally into `01_SYSTEM.md §3 Design Tokens` (currently only in globals.css + hook whitelist). P2 doc-debt.
- **NEW Hard Rule codified (per Yogesh decision, this PR):** AdminShell canonical reference = F19's current React implementation, NOT the F15 v2 HTML for shell internals. Lucide-react icons retained (visual variance from canonical inline SVG paths is minor + acceptable; lucide is maintained + accessible + uniform). Every NEW authenticated page port (F18/F20/F21/F22/F23/F25/F26/F28 etc.) MUST diff-probe against F19's React DOM, NOT v2 HTML, for shell. Non-shell page content (`<main>` area) still uses v2 HTML as canonical per Hard Rule 15. Codifies as Hard Rule 14 sub-clause to be added to CLAUDE.md by MAIN.
- **Visual gate methodology codified (per Yogesh decision, this PR):** Playwright diff-probe (canonical-vs-React computed styles) is MANDATORY before every visual-gate ping. Builds diff table BEFORE coding; only post screenshots when probe shows zero unexpected diffs. Pre-flight reading of `_DESIGN_RULES.md` + `_README.md` + relevant v2 HTML before any frame port also mandatory.

### Fixed — Day 16 — Pass absolute callbackURL to `signIn.magicLink` (cross-origin redirect, M3 close blocker)

- **`fix(web)`** — **Magic-link verify was 404'ing on the API origin.** Symptom (Day-16 M3 close blocker): user clicked magic link → browser landed at `https://qa-nexus-api.onrender.com/home` → `{"statusCode":404,"error":"Not Found"}`. Root cause: `apps/web/app/(auth)/sign-in/page.tsx` passed `callbackURL: '/home'` (relative path) to `authClient.signIn.magicLink({ ... })`. BetterAuth's verify route runs on the API origin (`qa-nexus-api.onrender.com`); when it 302's to the relative `/home`, the browser resolves against the API origin, not the FE origin (`qa-nexus-web.pages.dev`) — landing on a NestJS 404. Per BetterAuth GH #6104 + #7406, cross-origin FE/API deployments REQUIRE absolute `callbackURL`. **Fix:** new `apps/web/lib/env.ts` exports `getAppBaseURL()` mirroring the API-baseURL fallback pattern from PR #122 (reads `NEXT_PUBLIC_APP_BASE_URL`, falls back to `https://qa-nexus-web.pages.dev` in prod / `http://localhost:3000` in dev — defense in depth against the Cloudflare Pages × Next.js 15 `NEXT_PUBLIC_*` injection quirk tracked in followup `(be)`). Sign-in page's `handleSubmit` + `handleResend` now pass `callbackURL: \`${getAppBaseURL()}/home\``(absolute). **Bonus:** new`apps/web/.env.example`ships placeholders for both`NEXT_PUBLIC_API_BASE_URL`+`NEXT_PUBLIC_APP_BASE_URL` (was missing — first local-dev contributor reads this file). **Scope guard honored:** BE auth config unchanged (`trustedOrigins`already includes the FE origin per #123;`baseURL`is correctly the API origin so BetterAuth mounts there). **No new tests** — observable correctness via the magic-link sign-in flow on production; visual gate confirms the verify URL's`callbackURL`param is now absolute + landing on FE`/home`(NOT API 404). **Cross-references:** BetterAuth GH #6104 / #7406 · PR #122 (sister API-baseURL fallback pattern this mirrors) · PR #120 (basePath fix) · PR #123 (BE trustedOrigins) · followup`(be)` (Cloudflare Pages env-var injection M5 investigation).

### Changed — Day 16 — EmailService: migrate transport from nodemailer/Gmail SMTP → Resend HTTPS API (ADR-018 supersedes ADR-008)

**Day-15 P0 root cause closed.** The Day-15 magic-link silent-failure (auth POST returned 200 but no email arrived) was traced to Render's Sept-2025 outbound-SMTP block — the ADR-008 nodemailer/Gmail path is silently non-functional on Render Free regardless of how correctly the 9 `SMTP_*` env vars are set. ADR-018 migrates to Resend's HTTPS API which round-trips through `api.resend.com:443` and bypasses the block entirely. Resend free tier (3,000/mo, no expiry, no card on file) covers the pilot with 30× headroom. BetterAuth's official default email provider so future plugin upgrades stay frictionless.

- **`feat(api)`** — Add `resend` SDK to `apps/api` (`pnpm add resend -F @qa-nexus/api`). Not on the kickoff §6 ban list. pnpm-lock.yaml regenerated.

- **`feat(shared)`** — New Zod schema `packages/shared/src/schemas/resend-env.ts` + `parseResendEnv()` with 1 required field (`RESEND_API_KEY`, must start with `re_`) + 4 optional (`RESEND_FROM_EMAIL` defaults to `onboarding@resend.dev`, `RESEND_FROM_NAME` defaults to `QA Nexus`, `RESEND_REPLY_TO` + `RESEND_BCC_EMAIL` omitted when unset). Mirrors the `parseSmtpEnv` pattern from ADR-008 — fail-fast at boot rather than at first send hours later. Re-exported from `packages/shared/src/index.ts`. `parseSmtpEnv` schema retained for ~1 sprint as rollback bridge (followup `(bh)`).

- **`feat(api)`** — Full rewrite of `apps/api/src/email/email.service.ts`. Drops `nodemailer.createTransport` + 9-var SMTP env contract; replaces with `new Resend(...)` + 5-var Resend env contract. `sendInternal()` calls `this.resend.emails.send({ from, to, subject, html, text, bcc?, replyTo? })` — `bcc` and `replyTo` are conditionally spread (Resend rejects null values). Error path adapts to Resend's `{ data, error }` response shape: `error` field caught + logged + returned as `failed-<uuid>` with safe-redacted message; SDK throws caught the same way. `RESEND_API_KEY` redacted from any logged error message via `String.split(KEY).join('<redacted>')` defence-in-depth pass (mirrors the SMTP_PASSWORD redaction from ADR-008). DEFERRED + capture-mode + `getCapturedEmails`/`clearCapturedEmails` test surface preserved verbatim. Public API contract from Day-6 (`sendInvitation` / `sendMagicLink` / `sendPasswordReset` / `send` / `getHealth`) is byte-for-byte identical — auth.config.ts callers + invitations service + password-reset flow need ZERO coordination. Boot detects deprecated `SMTP_HOST`/`SMTP_USER` env vars + emits a one-line warning pointing to followup `(bh)` for cleanup.

- **`test(api)`** — Full rewrite of `apps/api/src/email/__tests__/email.service.spec.ts`. `jest.mock('nodemailer')` → `jest.mock('resend')` (mocks the `Resend` class constructor + `emails.send` method). Test count preserved + extended (~25 tests): mode detection (capture/deferred/real, including new "minimal RESEND_API_KEY-only set" path that exercises Zod defaults), template content (preserved from Day-6, no diff), capture-mode behavioral assertions (preserved + retargeted to `RESEND_BCC_EMAIL`), deferred mode, real mode happy path with from/to/bcc/replyTo/subject/html/text wiring assertion, BCC-on-every-method (3-call assertion preserved), bcc/replyTo OMITTED-not-undefined when env vars unset (new — matches Resend's null-rejection semantics), Resend `{ error }` response handling (new — replaces the throw-only test surface), SDK throw handling (preserved), API-key redaction (new — replaces SMTP_PASSWORD redaction test), legacy `send()` shape (preserved). The `bcc: yogesh.mohite@iksula.com` pilot-tracking discipline from Day-8 follow-up retained.

- **`docs(adr)`** — `docs/architecture/adr-008-email-service-gmail-smtp.md` header marked `**Status:** SUPERSEDED by ADR-018` with explanatory link-forward block; body retained as audit history per Hard Rule 11 spirit (explain WHY, don't delete).

- **`docs(adr)`** — New `docs/architecture/adr-018-email-provider-migration-resend.md` (Status: Accepted, ~6 KB). Sections: (1) Context — full Day-15 cascade RCA culminating in Render Sept-2025 SMTP-block discovery. (2) Decision — 5-var Resend env contract + `sendInternal()` wiring + fail-fast Zod validation + redaction discipline + deprecated-SMTP-warn behaviour. (3) Consequences — positive (free tier headroom, BetterAuth-native, simpler env surface), negative (sandbox From-address until `(bg)`, 100/day soft cap, vendor dependency), neutral. (4) Migration record — line-itemed list of every file changed in this PR. (5) Alternatives considered — AWS SES, Postmark/Mailgun/SendGrid, self-hosted, Slack-distribution (each rejected with reasoning). (6) Acceptance gate — 7-step post-merge verification including the 3-thing inbox-not-spam check that closes the Day-15 magic-link blocker. (7) Cross-references.

- **`docs(deploy)`** — `docs/deploy/render-runbook.md` Step 3 env var table swapped: 2 SMTP rows (`SMTP_USER` + `SMTP_PASSWORD`) replaced with 4 RESEND rows (`RESEND_API_KEY` + `RESEND_FROM_EMAIL` + `RESEND_REPLY_TO` + `RESEND_BCC_EMAIL`). Notes column references ADR-018 + followup `(bg)`.

- **`docs(meta)`** — `CLAUDE.md` tech stack section: `Email:` line updated from "Resend free" (which was historically aspirational from Day-0 kickoff before the ADR-008 Gmail-SMTP detour) to "Resend free tier (3,000/mo) via `resend` SDK over HTTPS API (ADR-018, supersedes ADR-008 Gmail SMTP — Render Free blocks outbound SMTP since Sept 2025)" — now grounded in code.

- **`docs(followups)`** — 3 new entries filed at top of `docs/followups.md`:
  - `(bg)` P1 — verify `qanexus.iksula.com` domain in Resend dashboard for branded From-address (replaces `onboarding@resend.dev` sandbox sender); Cloudflare DNS round-trip + Yogesh IT coord.
  - `(bh)` P2 — remove deprecated 9 `SMTP_*` env vars from Render staging + production after this PR soaks; rotate the underlying Gmail App Password; code-side cleanup PR (delete `parseSmtpEnv` schema + nodemailer dep) deferred ~1 sprint for rollback safety.
  - `(bi)` P2 — sweep `apps/api/docs/integrations/betterauth-magic-link.md` + sister auth/invitation/password-reset spec docs to assert "Resend SDK" not "nodemailer" in the delivery-contract sentences; spec drift only, no code.

- **No FE coordination needed.** Public API surface is unchanged. The first redeploy after this merges should immediately resolve the Day-15 magic-link silent-failure on `qa-nexus-web.pages.dev` (assuming Yogesh's already-set `RESEND_API_KEY` Render env var is intact). Acceptance gate per ADR-018 §6 closes the Day-15 P0 blocker → M3 close ceremony resumes with TASK E2-E8.

- **Hard Rules check:** Rule 1 (cost gate) — Resend free tier covers pilot; $0/mo retained. Rule 5 (ban list) — `resend` not on ban list. Rule 6 (no secrets) — `RESEND_API_KEY` lives only in Render env vars + GitHub Secrets; redacted from logged errors. Rule 7 (audit log) — invitation audit rows still record domain only on the `invitation_email_sent` row; PII contract preserved.

### Fixed — Day 15 — BetterAuth CORS preflight on `/auth/*` (Day-15 P0 — magic-link CORS, two-layer fix)

**Two-layer fix for the same root symptom:** magic-link sign-in from `qa-nexus-web.pages.dev` was rejected with "CORS error" + 0 bytes transferred. First-attempt fix (`trustedOrigins` extension) was correct but insufficient — BetterAuth 1.4.x has a regression where preflight responses lack `Access-Control-Allow-Origin` even when `trustedOrigins` is set (issues #7657 / #4720 / #4052). Layer 2 (Express CORS middleware) handles preflight cleanly + injects the right headers.

- **`fix(api)`** — Layer 1: `apps/api/src/auth/auth.config.ts` `trustedOrigins` extended to include `https://qa-nexus-web.pages.dev` (Cloudflare Pages production alias) alongside the existing canonical-future-zone aliases. Plus optional `AUTH_TRUSTED_ORIGINS` env-var append (comma-separated) for preview hashes / staging without code changes. Auth specs: 25 → **28** (+3 new pinning env-var append behavior). This layer satisfies BetterAuth's internal CSRF check on the actual POST.

- **`fix(api)`** — Layer 2: `apps/api/src/main.ts` adds explicit Express CORS middleware on `/auth/*` MOUNTED **BEFORE** the BetterAuth `toNodeHandler` mount. Allowed-origin function checks: (a) base list (`qa-nexus-web.pages.dev` + canonical aliases + localhost), (b) Cloudflare Pages preview-hash regex (`/^https:\/\/[a-f0-9]+\.qa-nexus-web\.pages\.dev$/`) — solves followup `(bd)` ergonomic gap for preview deployments without waiting for M5, (c) `AUTH_TRUSTED_ORIGINS` env-var extras (so CORS layer + BetterAuth CSRF layer stay in sync). `credentials: true` (BetterAuth uses cookies — required), `methods: GET/POST/OPTIONS/PATCH/PUT/DELETE`, `allowedHeaders: Content-Type/Cookie/Authorization`, `optionsSuccessStatus: 204`. Same-origin + non-browser tools (curl/Postman) pass through (no Origin header). Rejection error never echoes the bad origin to the client (logged for diagnostics only). New deps: `cors` + `@types/cors` (canonical Express middleware; not on kickoff §6 ban list). pnpm-lock.yaml regenerated.

- **Defense-in-depth design:** Express CORS handles preflight + Allow-Origin header injection (where BetterAuth 1.4.x is broken); BetterAuth's `trustedOrigins` continues to enforce CSRF on the request body. Two layers, two policies, both kept in sync via the shared `AUTH_TRUSTED_ORIGINS` env var + the same canonical origin list. Followup `(bd)` partially superseded — preview hashes now work out of the box at the CORS layer; only need env-var append if BetterAuth's own CSRF check trips them (rare for BetterAuth's permissive same-origin handling).

### Fixed — Day 15 — BetterAuth client baseURL hardcoded fallback (Cloudflare Pages NEXT*PUBLIC*\* injection bug — followup (be))

- **`fix(web)`** — **Add hardcoded production URL fallback to `createAuthClient()` `baseURL` in `apps/web/lib/auth/client.ts`** as a defense-in-depth bridge for the Cloudflare Pages env-var injection issue surfaced during Day-15 cross-FE E2E. **Symptom:** `NEXT_PUBLIC_API_BASE_URL` was set as a Plaintext variable in Cloudflare Pages → qa-nexus-web → Settings → Variables and Secrets, deployment succeeded, but the FE bundle still referenced same-origin (`pages.dev`) instead of the API origin. Net effect: magic-link sign-in still 404'd post-#119 + #120 deploy because the BetterAuth client's `baseURL` resolved to `undefined` at runtime → BetterAuth fell back to same-origin `pages.dev` → no BE handler. **Fix:** `process.env.NEXT_PUBLIC_API_BASE_URL || 'https://qa-nexus-api.onrender.com'` — uses env value when it bakes correctly (preserved for dev/staging dynamic URLs), falls back to hardcoded prod URL when injection fails. **Trade-off:** removed the Day-9 `!` non-null assertion. Original rationale was "fail loudly at build time if env missing" — Day-15 reality is the build succeeds + the value silently dropped at runtime, exactly the failure mode `!` was meant to prevent. The string fallback catches both build-time and run-time variants. **Followup `(be)` filed** for proper M5 Cloudflare Pages × Next.js 15 env-var injection investigation. Sister concern: `apps/web/lib/api/users-api.ts` uses same `?? 'http://localhost:3001'` pattern without prod fallback — audit when fixing `(be)`. **No new tests** — config-only change. **Hard Rules unchanged.** **Cross-references:** PR #120 (basePath fix sibling) · `(bc)` (basePath audit, closed by #120) · `(be)` (this PR's followup for proper investigation) · BE+1 PR #119 (Express mount widen — the BE half of magic-link unblock).

### Added — Day 15 M3 — RWD verification sweep across all M3 pages (2026-05-10 — TASK D4)

- **`test(rwd)`** — **M3 RWD verification sweep ships at `docs/screenshots/m3-d4-rwd-sweep/` with 28 viewport-bounded PNGs** (7 pages × 4 viewports) per Hard Rule 12 (RWD mandatory at 320 / 768 / 1024 / 1440) + Hard Rule 13 (visual gate evidence) + API 400 image protocol (`clip:` not `fullPage:`). New sweep script `scripts/m3-d4-rwd-sweep.js` reuses the route-mock + viewport-clip pattern from PR #116. Pages covered: F14 Requirements list (`/requirements`), F14 Detail Drawer (`?view=…`), F14m1 Edit Modal (`?edit=…`), F14m2 Link Test Case Modal (`?link=…`), F16a Test Case Method Chooser (`?new-test-case=1`), F16b A1 Generate page Pattern B (`/test-cases/generate?source=RET-247`), F16c Bulk Import Modal Pattern A (`?bulk-import=1`). Sweep route-mocks the Composer endpoint with the canonical `composer-sample-RET-247.json` fixture so F16b screenshots show populated Pattern B UI; all other Pattern A pages use local canned data (no BE wire needed). All 28 captures clean (0 failures); largest PNG 279 KB (well under 1 MB ceiling — no resize needed). Total sweep size 3.4 MB across 28 files. **F14m3 Convert to Jira Modal NOT in sweep** — the React component (`apps/web/components/requirements/convert-to-jira-modal.tsx`) doesn't exist on main as of 2026-05-10; documented as shipping-gap in PR body, not RWD finding. **2 new followups filed:** (1) `(ay)` — F16c Pattern B flip deferred from M3 to M5 (PR #95 shipped bulk-link/bulk-delete only, not the bulk-create endpoint F16c needs); (2) sweep doubles as M3 close visual-gate evidence consolidation. **Hard Rule 12 spot-check**: all 28 viewports rendered without runtime errors, no crashes, modals + drawer mount cleanly at every viewport including 320 px iPhone SE. Visual review against horizontal-scroll + tap-target-≥44px norms is the visual gate review work.

### Fixed — Day 15 — Widen BetterAuth express mount to catch-all `/auth/*` (Day-15 P0 — magic-link 404)

- **`fix(api)`** — `apps/api/src/main.ts` BetterAuth handler mount widened from two specific paths (`/auth/magic-link/*` + `/auth/get-session`) to a single catch-all (`/auth/*`). Pre-existing latent bug surfaced Day-15 when the FE flipped to a new sign-in flow (Pattern B per PR #116) and POSTed to `/auth/sign-in/magic-link` — a path BetterAuth handles natively but the narrow mount didn't expose, returning 404. Standard BetterAuth pattern is to let the handler own its entire `basePath` (set to `/auth` in `AuthService` per the boot log). Catch-all preserves existing `/auth/magic-link/verify` + `/auth/get-session` callers (subsets) + unblocks `/auth/sign-in/magic-link` + any future BetterAuth endpoint without further wiring. **NOT a Path C / PR #115 regression** — verified via `git diff --name-only`: PR #115 touched zero auth files. The 404→404 (not the 405 the FE initially reported) was the diagnostic clue: `/auth/get-session` returned 200 throughout, proving BetterAuth handler + Path C async `onModuleInit` initialization were healthy. Followups `(bb)` filed (BE-side audit: any future custom express mounts of `toNodeHandler` should be catch-alls per BetterAuth docs) + `(bc)` filed (FE-side: drop `/api` prefix from auth client call paths so requests land on the express catch-all not the Nest globalPrefix routes).

### Fixed — Day 15 — Align BetterAuth client basePath with BE-canonical /auth (closes (bc) audit)

- **`fix(web)`** — **Add `basePath: '/auth'` to `createAuthClient()` in `apps/web/lib/auth/client.ts`.** Root cause: BetterAuth client defaults to `basePath = '/api/auth'` when `basePath` is unset; BE BetterAuth at `apps/api/src/auth/auth.module.ts` is mounted at `basePath = '/auth'` (per Render boot log: `BetterAuth initialised (basePath=/auth)`). FE was constructing `<API_BASE>/api/auth/sign-in/magic-link` while BE served `<API_BASE>/auth/sign-in/magic-link` → 404 on production magic-link sign-in (Day-15 cross-FE E2E surface). Fix is a single-line config addition + L14 file-header comment update from `/api/auth/magic-link/verify` to `/auth/magic-link/verify` (the comment had silently encoded the wrong default since Day-9 pre-prep when the client was authored). **No BE change required** — BE+1's parallel "widen Express auth mount to `/auth/*` catch-all" PR (which fixed the 405 on `/auth/sign-in/magic-link` separately) lands independently; the two fixes are complementary and unordered. **Closes followup `(bc)`** — FE auth client basePath audit. Discovery surfaced via FE+1's pre-flight check on the magic-link 405 heads-up before any code was written, saving a round-trip cost. **No new tests** — the fix is a config change that aligns FE wire-shape with BE; correctness is observable end-to-end via the magic-link sign-in flow on `qa-nexus-web.pages.dev` after both this PR + BE+1's mount-widen PR merge + Cloudflare Pages rebuilds + Render redeploys (Yogesh smoke). **Cloudflare Pages env var prerequisite:** `NEXT_PUBLIC_API_BASE_URL = https://qa-nexus-api.onrender.com` must be set on Cloudflare Pages → qa-nexus-web → Settings → Variables and Secrets (Yogesh handling separately) — without it, `baseURL` is undefined at build time and the `!` non-null assertion fails the build loudly (which is the desired behaviour vs silent runtime crash; see Day-9 file header rationale).

### Fixed — Day 15 — apps/api/tsconfig.build.json excludes scripts/ (PR #115 CI #3 — E2E boot)

- **`fix(build)`** — Add `scripts` to `apps/api/tsconfig.build.json` exclude list. The new `apps/api/scripts/seed-llm-provider.ts` (Path C bridge) was being pulled into the production build because tsc's exclude list didn't cover `scripts/`. With scripts/ included, tsc's implicit `rootDir` shifts from `src/` up to `apps/api/` (the shared parent of all input files), which moves the build output from `dist/main.js` to `dist/src/main.js`. The `start:prod` script (`node dist/main`) then fails with `MODULE_NOT_FOUND` — exactly what the E2E job's "Start API in background" step hit (CI #3 failure on PR #115). Scripts under `apps/api/scripts/` are run via `ts-node` directly (per their header docs); they are NOT part of the production build artifact. Verified locally: post-fix build emits `dist/main.js` (correct), `dist/src/main.js` absent (correct). No change to the test (workspace) job because tsc's typecheck (`--noEmit`) doesn't care about output paths — only the build step does. Inline comment added to `tsconfig.build.json` so a future reviewer knows why `scripts` is excluded.

### Fixed — Day 15 — Crypto test flakes from base64url last-char tampering (PR #115 CI #2)

- **`fix(test)`** — `crypto.spec.ts` tamper-detection tests rewritten to mutate at the BYTE level (decode → bit-flip → re-encode) instead of replacing the last base64url character. **The crypto implementation was correct all along** — AES-GCM auth-tag verification works as designed. The bug was test-side: base64url encoding for a 16-byte auth tag uses 22 chars where the last char's top 2 bits are real + bottom 4 bits are ignored padding. Flipping `'A'`→`'B'` (which differ only in the ignored low-4 bits) decodes to IDENTICAL bytes → no actual tamper happened → decrypt rightly succeeded → test failed. CI hit unlucky random auth tag with the `'A'`→`'B'`-equivalent property; local passed by chance. New `flipFirstBit()` helper toggles the LSB of the first byte of the decoded buffer — guaranteed delta. Same flakiness latent in the ciphertext tamper test (longer cipher → low probability but still a smell) — also fixed. **+1 new sanity-check test** asserts `flipFirstBit()` actually mutates the decoded buffer (defense against future "simplification" regressions). Crypto specs: 13 → 15. Verified 5 consecutive runs stable.

### Fixed — Day 15 — Defer BETTER_AUTH_SECRET check until DB row exists (PR #115 CI regression)

- **`fix(api)`** — `LLMGatewayService.readConfigFromDb()` re-ordered: call `prisma.llmProvider.findFirst()` BEFORE checking `BETTER_AUTH_SECRET`. CI envs rightly lack the seed (it lives only in Render + local `.env`); when DB is empty (fresh CI state), service should fall through to deferred mode with the actual root cause (`"no LLM_PRIMARY_PROVIDER env AND no llm_providers row"`), NOT mask it with a misleading `"BETTER_AUTH_SECRET required"` error. Seed is only required when there's a row to decrypt — actionable error then mentions the `llm_providers` row id + provider kind so operator can correlate. **+2 new regression tests** in `llm-gateway-graceful.spec.ts` pinning both invariants (LLM specs: 39 → 41).

### Added — Day 15 M3 — Runtime LLM provider config bridge + ADR-015 (2026-05-10 — Path C transitional)

- **`docs(adr)`** — **ADR-015 Runtime LLM provider config bridge** ships at `docs/architecture/adr-015-runtime-llm-config-bridge.md` with `Status: Transitional` (superseded by F26 v2 React UI in M5). Path C decision: ship a CLI seed script + 50-LOC gateway patch that lets admin onboard an LLM provider via `pnpm exec ts-node apps/api/scripts/seed-llm-provider.ts` with the API key AES-GCM-encrypted via `BETTER_AUTH_SECRET`. Preserves Yogesh's runtime-config design intent (no Render env vars), ships M3 close on schedule, forward-compatible with F26 v2 (same tables + same encryption format). 6 alternatives rejected: env vars (violates intent), full F26 React build (multi-day), skip Composer (undermines M3 close), one-shot REST endpoint (more attack surface), hardcoded key (Hard Rule 6 ban). Sister followup `(az)` filed for removal milestone post-F26 v2.
- **`feat(api)`** — **`apps/api/src/llm/crypto.ts` (NEW)** — AES-256-GCM helper for `llm_providers.api_key_encrypted` column (TB-019 schema comment promised this; Path C delivers). Functions: `encryptApiKey(plaintext, seed)` → `<iv>.<authtag>.<ciphertext>` base64url triplet; `decryptApiKey(triplet, seed)` → plaintext or throws on tamper/wrong-seed (GCM auth-tag enforcement); `envVarForProviderKind(kind)` → maps `'groq'` → `'GROQ_API_KEY'` etc. for the gateway's lazy-provider injection path. Key derivation: `SHA-256(BETTER_AUTH_SECRET) → 32 bytes`. Fresh 12-byte random IV per encrypt (GCM canonical). AAD intentionally omitted in v1 (followup `(az)` adds workspace-binding AAD when F26 v2 lands). 13 unit tests pinning roundtrip / tamper detection (3 ways) / wrong-seed / malformed input (5 ways) / env-var-name mapping. **No new dep added** — uses Node.js built-in `node:crypto`.
- **`feat(api)`** — **`LLMGatewayService.onModuleInit()` patched** to env-first-then-DB-fallback resolution per ADR-015 §1. New private method `readConfigFromDb()` queries `LlmProvider.findFirst({ where: { status: 'connected' } })`, AES-GCM-decrypts `api_key_encrypted` via `BETTER_AUTH_SECRET`, injects plaintext into `process.env[GROQ_API_KEY|GEMINI_API_KEY|...]` so the lazy-constructed provider class (`GroqProvider`, `GeminiProvider`) finds it on first `getProvider()` call. New public field `configSource: 'env' | 'db' | 'none'` surfaces resolution path in boot logs + `/health` (future). Backward-compatible: existing env-driven Render deployments unaffected (env-first wins). Constructor now takes `PrismaService` (was zero-arg). `onModuleInit` is now async — graceful spec + service spec updated to `await` calls + mark `beforeEach` as async. Boot log format: `LLMGateway initialised (source=env|db): primary=groq:openai/gpt-oss-120b ...`. Deferred-mode path preserved when BOTH env AND DB are empty (logs admin-friendly hint mentioning the seed script). Decrypt failures stay deferred + surface error (catches wrong `BETTER_AUTH_SECRET` / tampered ciphertext). **39/39 LLM specs passing** (existing 26 + 13 new crypto tests).
- **`chore(scripts)`** — **`apps/api/scripts/seed-llm-provider.ts` (NEW)** — idempotent CLI that onboards an LLM provider in one command. Reads `GROQ_KEY` + `WORKSPACE_KEY` + `ADMIN_EMAIL` + `BETTER_AUTH_SECRET` from env (script-runtime only — values never persisted to disk or git). Resolves workspace via case-insensitive name match (Workspace model has no `key` column), validates Admin role on `created_by` user (per ERD §3 L940). AES-GCM-encrypts the plaintext key once via `crypto.ts`. Three-table upsert in a single Prisma transaction: TB-019 provider row → TB-020 model catalog (3 Groq models: `openai/gpt-oss-120b` + `meta-llama/llama-4-scout-17b-16e-instruct` + `openai/gpt-oss-20b`) → TB-021 agent×role assignments (A1 Composer / A2 Curator / A4 Sherlock × primary/long_context/fast_layer per ERD §5). Audit row `llm_provider_seeded` written via `writeAuditRow` helper (HMAC chain integrity per Hard Rule 7 + per-workspace `pg_advisory_xact_lock`); written **outside** the upsert tx to avoid lock-on-lock deadlock. **PII discipline:** audit payload carries `api_key_length` + `ciphertext_length` + counts only — NEVER the key plaintext OR ciphertext (ciphertext leak would help an attacker correlate with future re-encrypts under the same seed). Re-running with same `WORKSPACE_KEY + PROVIDER_KIND` UPDATEs the existing row (clean key-rotation path). Run command documented in script header.
- **`docs(followups)`** — **`(az)` filed at top of `docs/followups.md`** — Path C removal milestone tied to F26 v2 ship in M5. 7-step retirement scope: remove env-var fallback (or gate behind escape-hatch flag), remove/legacy-archive seed script, add `POST /api/admin/llm/reload` hot-reload endpoint, add AAD to crypto helper for row-binding, refactor providers to take explicit `apiKey` constructor arg (removes `process.env` mutation smell), wire `agent_model_assignments` (TB-021) into `LLMGatewayService.config` for per-agent×role secondary + long_context routing, mark ADR-015 as Superseded.
- **No new schema, no migration** — TB-019 `llm_providers` + TB-020 `llm_provider_models` + TB-021 `agent_model_assignments` already shipped in initial migration `20260427135123_init_pm1_schema`. Path C uses what's already in the schema. Forward-compatible with F26 v2 — same tables, same encryption format; React UI in M5 just becomes a layer on top.
- **Operator runbook (post-merge):** (1) PR auto-merges → Render redeploys ~5 min; (2) Yogesh runs the seed script with his Groq key in env; (3) Render manual restart (or trivial commit-push to trigger redeploy); (4) boot log shows `source=db`; (5) Composer + Curator endpoints fully real on production. M3 acceptance gate for "Composer real Groq" met without env-var taste.

### Added — Day 15 M3 — F16b Pattern A → Pattern B flip (Composer real Groq wire) (2026-05-10 — TASK D2)

- **`feat(web)`** — **F16b A1 Generate from Requirement page flips from Pattern A scaffold to Pattern B real Composer wire.** `onGenerate` + `onRegenAll` (and a new `useEffect` auto-trigger on first mount) now POST `/api/projects/:projectId/requirements/:reqId/test-cases/generate` (the Composer endpoint shipped in PR #109 with real Groq + ADR-013). Wire shape pinned by `@qa-nexus/shared` Zod schemas (`ComposerGenerateRequest` / `ComposerGenerateResponse` / `ComposerGeneratedCase`) + reference fixture `docs/architecture/composer-sample-RET-247.json` from PR #109. **2 new files + 2 modified files** (4 net): (1) **`apps/web/lib/api/composer-api.ts`** (NEW, ~125 LOC) — typed Pattern-B BE client mirroring `users-api.ts` canonical pattern from Day-8 followup ab. Exposes `generateTestCases(args)` + 3 typed errors: `ComposerUnavailableError` (503 with `retryAfterSec` + `runId`), `ComposerSchemaError` (400), `ComposerRateLimitError` (429 with `retryAfterSec`). Validates request body via shared Zod before send (catches dev typos + parses defaults); validates response via shared Zod after (guards against BE/FE drift — undefined-deref turns into a loud parse error). Uses `NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001'` absolute URL pattern; `credentials: 'include'` for BetterAuth session cookie. (2) **`apps/web/components/test-cases/generate/composer-adapter.ts`** (NEW, ~55 LOC) — maps BE `ComposerGeneratedCase` → FE `GeneratedCase` so existing `case-card`/`case-list-pane`/`streaming-card` render trees from PR #110 work unchanged after the flip. Adapts: `key→id`, `title→title`, `state='drafted'` (newly generated), `confidencePct=85`+`confidenceTier='high'` (defaults — Composer doesn't score; future scoring endpoint will fill), `similarityPct=0`+`similarityTier='distinct'` (Curator concern, separate endpoint), `groundedReq=URL-source-key`, `groundedChunkId=sourceChunkIds[0] ?? 'CHUNK-PENDING'`, `stepsJson[{order,action,expected}] → steps[{step:order, text:action — expected}]`, `expectedResult→expected`. (3) **`apps/web/components/test-cases/generate/requirement-key-resolver.ts`** (NEW, ~50 LOC) — translates URL `?source=RET-247` to canonical `(projectId, requirementId)` UUID pair. Hardcoded canon mapping for `RET-247` matching the BE seed UUIDs from `composer-sample-RET-247.json _meta.input_used`. Other keys → `null` (FE shows "requirement not found" toast + aborts). M3.5 follow-up will swap to real `GET /api/projects?key=…` lookup. (4) **`apps/web/components/test-cases/generate/generate-page.tsx`** (MODIFIED) — file header rewritten as Pattern B doc; imports `composer-api` + `composer-adapter` + `requirement-key-resolver` + `sonner toast`; `cases` initial state now `[]` (was `CANNED_CASES`); new `runGenerate` async useCallback resolves key → calls Composer → adapts response → setCases; toast on stubbed-mode (mirrors M2 KbSearchResponse `stubbed:true` UX); typed-error toasts for 503 / 429 / 400 / network with retry-after when present; `isGenerating` flag drives existing streaming-card animation; `useEffect` + `useRef` guard auto-triggers exactly once on mount (StrictMode-safe); `onGenerate` + `onRegenAll` both delegate to `runGenerate`. **Markers still on Pattern A** (deferred to future PRs, documented in file-header): `accept-case` / `reject-case` / `edit-case` (need single-case POST endpoint), `regen-variation` (per-card regen — M3.5), `curator-action` (Curator wire-up — separate F14m2 Day-16 task), `accept-all` / `back` / `save-exit` (FE-only state / nav). **Hard Rules 12/13/14/15 unchanged from PR #110** — visual surface identical, only behavior flips. **Stubbed-mode aware:** when Render env hasn't loaded `LLM_PRIMARY_PROVIDER=groq` + `GROQ_API_KEY` yet, BE returns `stubbed:true` and FE renders identically with a "demo data" toast — zero UX regression. After Render Day-15 deploy lands those env vars, the page flips to real Groq output automatically with no FE change. **Cross-references:** PR #109 (Composer real Groq + ADR-013), PR #110 (F16b Pattern A scaffold + 15 markers this flip targets), `docs/architecture/composer-sample-RET-247.json` (wire fixture), `apps/web/lib/api/users-api.ts` (canonical Pattern B FE-client pattern from followup ab).

### Added — Day 14 M3 — Curator (A2) real pgvector cosine impl + ADR-014 Accepted (2026-05-09 — TASK B+1 + B+2 Sunday-pull-forward)

- **`docs(adr)`** — **ADR-014 Curator dedup thresholds + cosine-similarity calibration** promoted from Proposed (Day-14 outline) to **Accepted** at `docs/architecture/adr-014-curator-dedup-thresholds.md`. Locks: (1) threshold canon (≥0.95 block / ≥0.85 flag / <0.85 clean), (2) embedding model **Path C** decision — pin `Xenova/bge-small-en-v1.5` (384-dim) for M3 pilot per ADR-003 amendment + Day-5 vector(384) migration; bge-large upgrade deferred to followup `(au)` post-pilot, (3) pgvector HNSW params (m=16, ef_construction=64, search-time ef=40) — already in place from Day-5 migration `0002_vector_384_dim.sql`, no new migration needed, (4) cosine operator `<=>` (NOT `<->` — brief mentioned L2; ADR locks cosine), (5) tie-breaking + topK cutoff (default 10, max 20), (6) FP-rate ceiling 5% with calibration trigger + ADR amendment path, (7) PII redaction reaffirmed, (8) scope boundary — Curator is dedup NOT relevance (cross-ref ADR-013 §M3.5), (9) empty-corpus + null-embedding service contract. 8 alternatives rejected with full reasoning (paths A/B/D/E + edit-distance + per-project tuning UI + bge-large quantization + ML reranker). 5 sister followups filed: `(au)` post-pilot embedding upgrade eval, `(av)` TestCase.embedding backfill + CLAUDE.md doc-drift cleanup.
- **`docs(followups)`** — **`(au)` + `(av)` filed at top of `docs/followups.md`.** `(au)` defines the post-pilot bge-large/Qwen3/Nomic/BGE-M3 evaluation gate with a 6-model benchmark protocol + decision matrix (RAM < 358MB AND p95 < 200ms AND quality delta > +2 MTEB pt). `(av)` covers two coupled doc-debt + data-debt items: TestCase.embedding backfill job for M2-era manual cases + CLAUDE.md/PRD/ERD drift cleanup (CLAUDE.md still says bge-large but reality is bge-small).
- **`feat(api)`** — **Curator real pgvector cosine impl ships, replacing PR #97's Pattern A canned-matches path.** Service body now: (a) injects `EmbeddingService` (3rd constructor arg — `EmbeddingModule` is `@Global` so no module-imports change), (b) extends `assertCaseWorkspace()` to also fetch `title` + `preconditions` + `stepsJson` for embed-input construction, (c) ONLINE path runs empty-corpus fast-path → counts skipped-null candidates (raw SQL — Prisma can't WHERE-filter `Unsupported("vector(384)")`) → embeds source case via `EmbeddingService.embed(title\n preconditions\n stepsConcat)` → runs `prisma.$queryRawUnsafe` cosine search with the canonical pgvector pattern (`embedding <=> $1::vector` with the cosine-ops HNSW index from Day-5 migration accelerating the ORDER BY) → fetches topK×2 (capped at 50) for app-side threshold headroom → returns matches with `stubbed: false`, (d) OFFLINE path preserved when `EmbeddingService.deferred=true` OR `CURATOR_OFFLINE=1` env var set — emits the canned 3-template Pattern A fallback from PR #97 with `stubbed: true`. **Audit payload extensions** (additive — no schema break): `skipped_null_embeddings` count + real `candidates_scanned` + real `duration_ms` + `stubbed` flag. **Embed-input construction** uses `serializeStepsForEmbed()` helper that handles canonical stepsJson shape + degrades gracefully on null/malformed input (never throws — embed input must always be valid). **Performance:** Curator with bge-small warm cache + HNSW index runs ~50ms embed + ~20-50ms cosine search = ~80-120ms typical. Per-call total wrapped in slow-call watchdog (`logger.warn` if > 500ms). **No new schema, no migration** — `test_cases.embedding vector(384)` + `test_cases_embedding_hnsw_idx` (cosine-ops, m=16, ef_construction=64) already in place from Day-5 PR. **Tests:** 6 new jest in `curator.service.spec.ts` (16 → **22**) covering ONLINE block path (≥0.95 → verdict='block', stubbed:false), ONLINE flag path ([0.85,0.95) → verdict='flag'), ONLINE clean path (sub-flag matches all dropped → verdict='clear'), empty-corpus fast-path (no embed call, no SQL), null-embedding-skip (mixed corpus → `skipped_null_embeddings` in audit metadata + `candidates_scanned` excludes them), raw-SQL invocation shape assertion (cosine `<=>` operator + pgvector literal + projectId/sourceCaseId positions + topK×2 fetch limit + embed-input includes title/preconditions/steps). Pattern A scaffold tests preserved via `embedder.deferred=true` mock. **464/464 full BE suite** (was 458 post-PR #109/#112; +6 net). Typecheck + lint + prettier --check clean. After this PR: F14m2 Curator ⓘ near-dup banner flips from `stubbed:true` → `stubbed:false` automatically once Render env loads bge-small WASM weights at boot (Render staging deploy already does — model auto-loaded at Nest bootstrap per `EmbeddingService.onModuleInit()`).

### Added — Day 14 M3 — Composer real Groq + ADR-013 + Day-14 polish bundle (2026-05-09 — TASK A2/A3 + B1.3/B2.2/B2.3/B2.4)

- **`feat(api)`** — **`LLM_DEBUG=true` env toggle** added to `LLMGatewayService.complete()` (Day-14 TASK B1.3). When enabled, emits `systemPrompt` + `prompt` + `result.text` + provider/model/token/latency metadata to stderr. Binary-string check (`'true'` only); env-gated for local dev + Render staging debugging only — NEVER enable in prod. Useful for FE+1's Sunday Pattern-A→B flip wiring + Day-15 Groq deploy smoke. No-op overhead when unset (single string compare per call). Cross-references ADR-013 §"Implementation plan".
- **`docs(architecture)`** — **ADR-014 outline shipped at `docs/architecture/adr-014-curator-dedup-thresholds.md` with Status: PROPOSED** (Day-14 TASK B2.2). Full body lands Sunday Day-15 TASK C1. Outline locks: threshold canon (0.85 flag / 0.95 block) · pgvector HNSW params (m=16, ef_construction=64, search-time ef=40) · top-K defaults (5 default, 20 max) · tie-breaking (similarity DESC then created_at DESC) · 5% FP-rate ceiling with calibration script. **Surfaces 1 OPEN QUESTION for Sunday morning resolution:** brief specifies `bge-large-en-v1.5 (1024-dim)` but current data layer is `bge-small-en-v1.5 (384-dim)` per ADR-003 amendment + Day-5 `vector(384)` migration. Three resolution paths drafted: (A) pin bge-small / (B) migrate to bge-large + re-embed / (C) pin bge-small NOW with planned upgrade post-pilot. **Recommended path: (C)** — preserves $0/month gate + Hard Rule 1; followup `(au)` to be filed for bge-large upgrade once Render Hobby tier approved. KB-grounding scope boundary explicitly cross-referenced with ADR-013 §M3.5 (Curator is dedup, NOT relevance — never `test_cases ↔ kb_chunks`).
- **`feat(api)`** — **Curator `PATTERN-A → PATTERN-B SWAP` comment header** inserted in `apps/api/src/test-cases/curator.service.ts` per Day-14 TASK B2.3 brief spec. References ADR-014 + threshold canon + bge-small/large reconciliation note. Greppable single-search-and-replace marker for Sunday's TASK C2 implementation.
- **`docs(architecture)`** — **`docs/architecture/composer-sample-RET-247.json`** ships as canonical reference fixture for FE+1 (Day-14 TASK B1.2). Generated via OFFLINE path (no Groq key needed locally); wire shape is byte-identical to ONLINE Groq path (only `stubbed:false` + real `llmMetadata` differs after Day-15 cutover). Includes 5 canned cases + `_error_response_examples` covering 503 (retry-exhausted with retry_after) / 400 (Zod validation) / 404 (cross-workspace req leak-free) / 403 (Stakeholder write-denied) + non-streaming-mode note.
- **`chore(scripts)`** — **`scripts/embed-smoke-test.ts`** ships (Day-14 TASK B2.4) — Xenova `bge-small-en-v1.5` load + embed smoke check. Verifies `dim=384` + caches model. **Verified Day-14: cold load 7.1s, warm embed 53ms, dim=384 ✅.** Sunday's Curator TASK C2 implementation now has warm cache (no 7s mid-PR cold start). Override via `EMBEDDING_MODEL_ID` env var; assertions check dim matches model name (`small` → 384, `large` → 1024). Run via repo's existing `ts-node` (no `tsx` dep added — frozen-lockfile safe).
- **`docs(eod)`** — **`docs/eod-reports/2026-05-09-day-14-be.md`** ships per kickoff §5 (5 sections + architectural-wins summary).

### Added — Day 14 M3 — Composer (A1) real Groq integration + ADR-013 (2026-05-09 — TASK A2 + A3)

- **`docs(adr)`** — **ADR-013 Composer prompt strategy + JSON schema lock ships at `docs/architecture/adr-013-composer-prompt-strategy.md`.** Locks: (1) system prompt (8 rules incl. domain-vocab, P0/P1 priority bias, gherkin-only-when-explicit, no-prose-output), (2) user-message template (req key/title/desc + project key + suggested-key prefix + optional KB chunks framed `[chunk: <UUID>]`), (3) `response_format=json_schema` enforcement (Groq strict-mode), (4) sampling defaults (temperature **0.4** — higher than RAG's 0.2 for diverse cases · maxTokens **1500** · count default **5** capped 1–10), (5) retry chain (Groq primary → JSON-parse-retry-with-reinforcement → long-context fallback → Gemini fallback → 503 with structured error), (6) PII redaction (req text NEVER in audit; counts/keys/lengths only), (7) schema versioning (additive-only; breaking changes → `/v2` endpoint, never in-place). 5 alternatives rejected: free-form parsing (5% drift cost), function-calling (overkill + Groq partial support), multi-turn refinement (3-5x token cost, no quality data), local LLM (Hard Rule 5 ban), `mode: json_object` without schema (no enforcement benefit). KB grounding (`useKbContext` flag) explicitly deferred to M3.5.

- **`feat(api)`** — **Composer real Groq integration ships, replacing PR #93's Pattern A canned-cases path.** Service body now calls `LLMGatewayService.complete()` with `responseFormat={type:'json_schema', jsonSchema:{name:'composer_generated_cases', strict:true, schema: COMPOSER_RESPONSE_JSON_SCHEMA}}`. New file `apps/api/src/test-cases/composer-prompt.ts` is the SOURCE OF TRUTH for the system prompt + user-message template + JSON schema constant + sampling defaults — single greppable lock point per ADR-013 §"Mitigation plan". JSON schema is hand-maintained (no `zod-to-json-schema` dep added — avoids lockfile bump cascade); `composer.service.ts` Zod-validates the parsed response with a parallel schema (`CASES_VALIDATION_SCHEMA`) so drift between the two is caught at parse time. **Retry chain (ADR-013 §5):** attempt 1 = canonical system prompt; attempt 2 = system prompt + reinforcement clause appended ("Output ONLY the JSON object, no other text"); both attempts ride the gateway's existing primary→secondary fallback (Groq→Gemini) so 4 underlying provider calls are possible per Composer call before a 503 fires. **Failure path:** ALL providers exhausted OR 2 JSON parse failures → ServiceUnavailableException(503) with `{error:'composer_unavailable', retry_after:60, run_id}`; failed TB-022 row + `composer_generation_failed` audit row written BEFORE throw so chain stays auditable. **Offline/dev mode:** when `COMPOSER_OFFLINE=1` env var set OR `LLMGatewayService.deferred=true` (no LLM env vars set yet — F26 admin-config UI lands M1+), service emits the same 10 canned templates from PR #93 with `stubbed: true` flag; Pattern A → Pattern B FE flip already implemented in F16a/b modal. **`LLMOptions` type extension** in `apps/api/src/llm/types.ts`: new `responseFormat?: {type:'text'} | {type:'json_schema', jsonSchema:{name, strict?, schema}}` field — typed, opt-in, backward-compatible with all existing call sites (KB RAG `kb-answer.service.ts`, M1 LLM playground). **`GroqProvider.callProvider`** extended to forward `response_format` to Groq's chat.completions API when the option is set; Gemini provider extension deferred to next PR (gateway's RetryableLLMError fallback handles Gemini-incompatibility gracefully). **Module wiring:** `LLMGatewayService` injected as 3rd constructor arg into `ComposerService`; `LLMGatewayModule` is `@Global` so no `TestCasesModule.imports` change needed. **PII discipline strengthened:** audit payload now includes `title_length` + `description_length` (NEW — both pinned by negative test); req title/description text remains forbidden. **Tests:** 5 new jest in `composer.service.spec.ts` (15 → **20**) covering ONLINE happy path (`stubbed:false`, real metadata), `responseFormat` arg shape assertion, parse-retry → run_status='partial', parse-exhausted → 503 + failed run + audit, gateway-fallback → `fallback_used:true` propagation. Pattern A scaffold tests preserved via `llm.deferred=true` mock. **458/458 full BE suite** (was 410 post-Day-13; +5 new ONLINE + 43 carried from cascade merges = +48 net). Typecheck + lint + prettier --check clean. **No new schema, no migration** — TB-022 already covers. **`COMPOSER_OFFLINE=1`** env flag documented in `composer.service.ts` header. After this PR: F16a Composer modal flips from `stubbed:true` → `stubbed:false` automatically once Render env has `LLM_PRIMARY_PROVIDER=groq` + `GROQ_API_KEY` set (Day-15 deploy task — no FE change needed).

### Added — Day 14 M3 — F16b A1 Generate from Requirement page Pattern A (2026-05-09 — TASK A2)

- **`feat(web)`** — **F16b A1 Generate from Requirement page ships as a Pattern A scaffold** ahead of Day-15's Composer (A1) + Curator (A2) endpoint flips. New route `/test-cases/generate` reached from F16a Test Case Method Chooser modal "AI Generated" card (targetRoute updated from stub `/test-cases/new?method=ai` → `/test-cases/generate?source=RET-247`). Direct port of `PM1_UI_v2/Redesign Frame by claude design/F16b A1 Generate from Requirement v2.html` (1130 LOC) per Hard Rule 15. **Layout:** Hard Rule 14 AdminShell wrap (active='test-cases') + breadcrumb (Home › Author › Test Cases › Generate) + 4-step stepper (Source done · Generate current · Review · Accept) + 3-col workspace (340px Source pane / 1fr Case list / 340px Activity pane). Workspace is fully responsive — `xl ≥1280` shows all 3 cols, `lg 1024-1279` auto-collapses Activity, `< 1024` stacks vertically (mobile/tablet). Activity pane manually closeable via X icon (persists `qa-nexus.f16b.activity-closed`); reopen pill appears in center pane head. **Source pane:** segmented tabs (F14 Requirement / Jira / Freeform), search input (placeholder `Search RET-, CART-, PAY-, AUTH-, OPS-…`), pre-selected RET-247 card with violet AI accent stripe + 3 ACs, KB grounding panel with 3 chunks (CHUNK-RET-0341/0287/0342 + relevance scores), "Add KB chunk" dashed button, "Generate without KB grounding" pure-LLM toggle, Provider strip (A1-Groq · gpt-oss-120b · 4/1000 quota bar · A1-Gemini fallback), 42px teal Generate CTA. **Center pane:** header (`5 test cases for RET-247` + drafted/streaming counts + Curator ⓘ dedup live + Re-generate all + Accept all) → case list scroll surface → sticky footer (counts + Back + Save & exit teal CTA with accepted-count badge). **Case cards** (Pattern A canned set): TC-RET-0341 accepted (92% conf · 34% sim distinct), TC-RET-0342 accepted with **Curator dedup pair callout** flagging TC-RET-0142 at 87% similarity + 4 actions (Merge Curator suggest / Keep new / Keep existing / Mark distinct), TC-RET-0343 awaiting review (81% conf · 22% sim), TC-RET-0344 streaming card with animated `streamPulse` left-edge gradient + skeleton shimmer lines, TC-RET-0345 queued card. **Streaming animations:** `@keyframes streamPulse` (1.4s linear infinite, gradient slide on the violet accent stripe) + `@keyframes skelShimmer` (1.6s linear infinite, gradient sweep on skeleton lines) added to `apps/web/app/globals.css`; both honor `prefers-reduced-motion: reduce`. Existing `pulseDot` keyframe reused for streaming-status dot. **Activity pane:** 2-tab (Activity 12 / Provenance) + close X. Timeline of 6 events (Composer started · drafted TC-RET-0341 · accepted · drafted TC-RET-0342 with Curator warn flag · drafted TC-RET-0343 · streaming TC-RET-0344) with AI/OK glyph variants + connecting line. **Pattern A markers (15):** generate-start · source-tab:{requirement|jira|freeform} · source-search · kb-add-chunk · kb-skip-toggle · accept-case · reject-case · edit-case · regen-variation · regen-all · accept-all · curator-action · activity-close · back · save-exit. All log via `console.info('pattern-a:deferred:f16b:*')` for Day-15 swap-point traceability. **Hard Rule 15:** `<AgentName code="composer" />` + `<AgentName code="curator" />` reused from `@/components/ui/agent-name` — single source of truth for named-agent display. **Iksula canon:** RET-247 refund-window scenario, TC-RET-0341..0345 IDs, Yogesh M. owner, Sprint 42, refund_policy_v3.pdf grounding. **Files added:** `apps/web/app/(app)/test-cases/generate/page.tsx` (route shell) · `apps/web/components/test-cases/generate/generate-page.tsx` (main client component + state mgmt) · `apps/web/components/test-cases/generate/source-pane.tsx` (left pane) · `apps/web/components/test-cases/generate/case-list-pane.tsx` (center pane) · `apps/web/components/test-cases/generate/case-card.tsx` (single card + Curator dup callout) · `apps/web/components/test-cases/generate/streaming-card.tsx` (skel + queued variants) · `apps/web/components/test-cases/generate/activity-pane.tsx` (right pane timeline) · `apps/web/components/test-cases/generate/stepper.tsx` (4-step header) · `apps/web/components/test-cases/generate/canned-data.ts` (TS types + Pattern A fixtures) · `scripts/m3-f16b-generate-sweep.js` (Playwright CLI sweep, NOT MCP per TASK A1). **Files modified:** `apps/web/components/test-cases/test-case-method-chooser-modal.tsx` (F16a "AI Generated" card targetRoute + handleResume route updated) · `apps/web/app/globals.css` (+streamPulse +skelShimmer keyframes). **Visual sweep:** 5 screenshots committed at `docs/screenshots/m3-f16b-generate/` (1440 / 1024 / 768 / 320 / activity-closed-1440). **Build:** typecheck clean + lint 0 errors (2 pre-existing warnings unrelated to F16b) + static export green (`/test-cases/generate` 9.87 kB · 133 kB First Load JS). **TASK A1 (Playwright CLI switch) folded into this PR** — sweep script uses `require('playwright')` direct npm import, NOT the deprecated MCP tools. **`[VISUAL GATE PENDING]`** — awaiting Yogesh sign-off before squash-merge to main.

### Added — Day 14 M3 — F14 Requirement Detail Drawer (right-side slide-in) (2026-05-09 — TASK A3)

- **`feat(web)`** — **F14 Requirement Detail Drawer ships as a Pattern A right-side preview surface**, reinstating the v1 affordance Yogesh requested back at 13:00 IST. Read-only quick-look that complements the F14m1 Edit Modal (full-edit flow stays at Edit-icon). **URL flow:** row body click → `?view=<id>` → drawer slides in from right; ESC + backdrop tap + X icon → clears param. **Affordance split** (mutually exclusive, priority `edit > link > jira > view`): row click → `?view=` (drawer) · Edit icon → `?edit=` (F14m1) · More menu → `?link=` (F14m2) · F14m3 jira flow unchanged. **Sizing per Hard Rule 12:** `max-w-md` (~448 px) on `sm+`; full-screen sheet `< sm` (mobile). Uses semantic Tailwind token because the `enforce-rwd.sh` hook only allowlists `max-w-{md|lg|xl|2xl|3xl|4xl}` + `max-w-[480|640|768]px` — `sm:w-[420px]` per the original brief was hook-blocked, `max-w-md` is the closest semantic alternative. **Layout:** sticky header (Jira chip + req ID + status chip + X close) → title + sprint context → 5 stacked sections in a scrollable body (1. Description · 2. Acceptance Criteria with numbered chips · 3. Coverage with pass/fail/blocked/not-run breakdown + meter bar · 4. **Composer ⓘ Suggests** with violet AI tone + 3 next-step suggestions + "Generate test cases" CTA → routes to `/test-cases/generate?source=<id>` · 5. Traceability dl-grid with Sprint / Epic / Jira / Audit hash) → footer (View in Jira → opens iksula.atlassian.net new tab · Edit mapping → switches URL to `?edit=<id>` (route-replacement) · Unlink → fail-toned button, Pattern A console.info marker only). **Pattern A markers (8):** `f14:detail-drawer:{esc-close|backdrop-close|x-close|generate-from-req|edit-mapping|view-in-jira|unlink-jira}`. **`<AgentName code="composer" inherit />`** reused per Hard Rule 15 SSOT. **A11y:** `role=dialog` + `aria-modal=true` + `aria-labelledby` + body scroll-lock + initial focus on close button + ESC-handler keydown wired to document. **Mobile card list also wired** — title + description region wrapped in a focus-visible `<button>` so the drawer opens via keyboard nav too. **Files added:** `apps/web/components/requirements/requirement-detail-drawer.tsx` (~470 LOC) · `scripts/m3-f14-detail-drawer-sweep.js` (Playwright CLI sweep, 4 viewports). **Files modified:** `apps/web/components/requirements/requirements-list-page.tsx` (+import, +`?view=<id>` URL param read, +`openViewDrawer`/`closeViewDrawer` callbacks, +`drawerData` memo, +`rowToDrawerData` adapter at file bottom with canon enrichment for RET-247/248/251/252/258, +drawer render under existing modals, +mobile card title-button wrapper, +`onOpenView` prop threaded through `RequirementsTable` + `RequirementCard`). **Visual sweep:** 4 PNGs at `docs/screenshots/m3-f14-detail-drawer/` (1440 / 768 / 320 / empty-coverage-1440). **Build:** typecheck clean + build green (`/requirements` 11.7 kB · 134 kB FLJS, no regression). **Independent of F16b PR #110** — drawer's "Generate test cases" CTA routes to `/test-cases/generate` which lands when #110 merges; sequence-agnostic. **`[VISUAL GATE PENDING]`** — awaiting Yogesh sign-off.

### Added — Day 14 M3 — F16c Bulk Import Test Cases Modal Pattern A (2026-05-09 — TASK B1)

- **`feat(web)`** — **F16c Bulk Import Test Cases Modal ships as a Pattern A scaffold** ahead of Day-15+ real CSV-parse + Curator dedupe pipeline. Reached from F16a Test Case Method Chooser modal "Bulk Import" card (targetRoute updated `/test-cases/new?method=bulk` → `/test-cases?bulk-import=1`). URL trigger: `?bulk-import=1` on the parent F22 Test Case Library page. Direct port of `PM1_UI_v2/Redesign Frame by claude design/F16c Bulk Import Test Cases v2.html` (565 LOC) per Hard Rule 15. **Sizing per 01_SYSTEM.md §4.4:** Stage modal `max-w-screen-xl` capped at `sm:max-h-[860px]` desktop; full-screen sheet on mobile (Hard Rule 12). **Layout:** header (cloud-upload icon + eyebrow with file pill `legacy_refund_test_cases.csv` + size pill `2.4 MB` + title "Resolve duplicates before import" + sub stats + X close) → 5-step stepper (Upload done · Map fields done · Validate done · **Dedupe current** · Summary) → scrollable body → footer (A2 v1.1 chip + summary metadata + Back to validate + Continue (231 new) teal CTA). **Body sections:** (1) **Done-card recap** of Steps 1-3 (pass-toned, "247 rows · 8/9 fields mapped · Steps→test_steps · Expected→expected_results · 245 valid · 2 excluded" + Review ↑ button + inline exclude reasons "Row 17: expected_results empty · Row 89: malformed steps"); (2) **Phase card** (violet AI tone, Sparkles icon + "14 potential duplicates found in 245 valid rows" + Curator metadata pill `A2 v1.1` + technique `pgvector + cosine similarity · scanned in 11.4s · 78% precision on last import` + scan-complete pass pill); (3) **Strategy radio group** (3-col grid `sm:grid-cols-3` → 1-col mobile · radio cards: Keep new (replace) / Keep existing (skip) / **Review each manually** (default-selected with primary tint + glow); (4) **Pair list** (header with "Duplicate pairs 14" + Sort / Export ghost buttons + 5 pair-row 5-col grid `lg:grid-cols-[1fr_auto_1fr_auto_auto]` degrades to 1-col stack < lg). 5 canned pairs from v2 spec verbatim: row 12 ↔ TC-RET-0089 (sim 91% high · "Keep existing"), row 23 ↔ TC-RET-0341 (sim 93% high · "Keep existing"), row 41 ↔ TC-RET-0343 (sim 84% med · "Review pair"), row 58 ↔ TC-RET-0202 (sim 81% med · "Review pair"), row 79 ↔ TC-RET-0418 (sim 68% low · "Keep both"). Sim chip uses **explicit-label tier** ("likely dup" / "probable dup" / "possible dup") per audit-mandated cross-frame collision avoidance — tier color (red/amber/green) PLUS textual qualifier kills any "red=bad-vs-red=good" semantic ambiguity. + 1-line "+ 9 more pairs below the fold (Pattern B paginates)" stub. **Pattern A markers (8):** open · close (esc/backdrop/x) · strategy-change · pair-action · sort · export-pairs · review-prior-steps · back-to-validate · continue. All log via `console.info('pattern-a:deferred:f16c:*')`. **Footer summary** (computed from canned dataset): "Will import 231 new rows · handle 14 dups per strategy · 2 excluded from validate · destination RET / Refund Core". Continue CTA badge updates dynamically when strategy changes (replace = 245 new; skip/review = 231 new). **A11y:** `role=dialog` + `aria-modal=true` + `aria-labelledby` + body scroll-lock + initial focus on close + ESC keydown handler + radio group with `role=radiogroup` + each card `role=radio` + `aria-checked`. **Files added:** `apps/web/components/test-cases/bulk-import-modal.tsx` (~700 LOC) · `apps/web/components/test-cases/bulk-import-canned-data.ts` (~160 LOC) · `scripts/m3-f16c-bulk-import-sweep.js`. **Files modified:** `apps/web/components/test-cases/test-case-library-placeholder.tsx` (+import + `?bulk-import=1` URL param read + `closeBulkImport` callback + render `<BulkImportModal>` alongside chooser) · `apps/web/components/test-cases/test-case-method-chooser-modal.tsx` (Bulk Import card targetRoute updated). **Visual sweep:** 5 PNGs at `docs/screenshots/m3-f16c-bulk-import/` (1440 / 1024 / 768 / 320 + strategy-replace-1440 showing "Keep new" selected with footer count flipping to 245 new). **Build:** typecheck clean + lint 0 errors (2 pre-existing warns unrelated). **`[VISUAL GATE PENDING]`** — awaiting Yogesh sign-off.

### Changed — Day 13 (aq) `[platform]` — pre-push hook gains prettier gate (2026-05-08)

- **`chore(husky)`** — **`.husky/pre-push` extended with a `prettier --check` gate (gate 2/4) to prevent prettier-cascade pattern at author time.** Cascade had bitten 5 PRs across 2 days: Day-12 #62/#75/#77/#78 (cleared by MAIN's #79 fix on main) + Day-13 #85/#87 (cleared by BE+1's prettier-write fixes). Round-trip per cascade was ~5–15 min plus relay overhead. New gate runs `pnpm exec prettier --check .` (honors `.prettierrc` + `.prettierignore`, ~1–2s warm cache). On failure: prints offending files (capped at 10), one-line auto-fix command (`pnpm exec prettier --write .`), re-stage + retry instructions, bypass note (warns CI lint will fail anyway). Renumbered existing gates: typecheck stays 1/4, prettier inserted as 2/4, frozen-lockfile becomes 3/4 (was 2/3), CHANGELOG becomes 4/4 (was 3/3); informational work-log token refresh promoted to 5/5. **No application code touched** — pure platform hardening. **No new tests** — bash hook is wired into the husky harness; failure modes are observable on next push from any contributor. **Followup `(aq)` filed in `docs/followups.md` + marked RESOLVED in this PR.** Recommended to mirror in FE worktree's pre-push hook (FE chat to ship sister PR).

### Added — Day 13 M3 — requirement CRUD real implementation + RTM coverage view (2026-05-08 — TASK 2)

- **`feat(api)`** — **RequirementsService + RequirementsController real CRUD ships, replacing the 501 stubs from PR #77 + adding RTM coverage view.** Sister PR to TASK 1 (PR #85). Pipeline mirrors TestCasesService pattern: `assertProjectWorkspace()` → 404 cross-workspace; `assertReqWorkspace()` → 404 cross-workspace OR cross-project. Five project-scoped CRUD endpoints + one top-level RTM coverage endpoint: (1) **`POST /api/projects/:projectId/requirements`** (Admin/Lead/QAEng, 201) — Zod-validates `CreateRequirementInput`, Prisma P2002 unique-key collision → 409 ConflictException, audits `requirement_created`. (2) **`GET /api/projects/:projectId/requirements`** (all 4 roles) — paginated by `createdAt DESC`; per-row `linkedTestCaseCount` derived via Prisma `_count.testCaseLinks`; filters: `?priority=P0,P1` (CSV → IN), `?status=active,done` (CSV → IN), `?source=jira` (single value), `?sprint=Sprint-42` (exact match), `?q=refund` (case-insensitive title ILIKE). (3) **`GET /api/projects/:projectId/requirements/:reqId`** (all 4 roles) — full detail incl. description + linkedTestCaseCount. **Path shape change vs M3-BE-03 skeleton** — promoted from top-level `/api/requirements/:reqId` to project-scoped per Day-13 TASK 2 spec (workspace + project both validated server-side; cross-project reqId → 404 no leak). (4) **`PATCH /api/projects/:projectId/requirements/:reqId`** (Admin/Lead/QAEng) — partial patch, only `!== undefined` fields applied; `key` PATCH intentionally rejected (immutable identifier — would orphan TestCaseLink rows + break Jira RET-### round-tripping); audits `requirement_updated` with `fields_changed` array (NOT values). (5) **`DELETE /api/projects/:projectId/requirements/:reqId`** (Admin/Lead/QAEng) — **soft delete via `status='archived'`** (RequirementStatus enum already has 'archived' — no reconciliation needed unlike test*cases). (6) **`GET /api/requirements/:reqId/test-cases`** (all 4 roles) — RTM coverage view (intentionally NOT project-scoped — coverage is the RTM perspective; project is implicit from reqId). Delegates to `TestCasesService.coverageForRequirement()` which JOIN-then-WHEREs on Project.workspaceId for isolation. **Module wiring:** `RequirementsModule.imports` adds `TestCasesModule` (which exports TestCasesService); RequirementsCoverageController is a sibling controller alongside RequirementsProjectScopedController (skeleton's RequirementsReqScopedController retired). **`assertWriteRole()`** defense-in-depth ForbiddenException on Stakeholder writes. **PII discipline:** audit payloads omit title + description text; `req_key` + `title_length` + `description_length` + counts only. Pinned by negative test asserting no `Customer XYZ` / `50000` / `SECRET_TITLE_PHRASE` / `SECRET_DESCRIPTION_BODY` appear in payload string. **Zod schemas in `packages/shared/src/schemas/requirement.ts`** (extended): `RequirementListQuery` (CSV-coerce filters), `RequirementListItem`/`RequirementListResponse`, `RequirementDetailItem`/`RequirementDetailResponse`, `RequirementCreateResponse`/`RequirementUpdateResponse`/`RequirementDeleteResponse`. **Bonus fix in TestCasesService.coverageForRequirement():** typed return shape now matches `RequirementCoverageItem` Zod schema (priority/status casts to enum literal types). **No new schema, no migration** — TB-006 + TB-008 already cover. **Tests:** 16 jest in new `apps/api/src/requirements/__tests__/requirements.service.spec.ts` (target was 12+) covering: create happy + 409 + cross-workspace, list paginated + filters + cross-workspace, detail full shape + cross-workspace + cross-project, update partial + cross-workspace, archive + cross-workspace, \*\*PII guard with synthetic SECRET*\* + Customer XYZ payload**, assertWriteRole matrix. **410/410 full BE suite\*\* (was 407 post-TASK-1; +16 new − 13 from skeleton-replaced spec = +3 net). Typecheck + lint clean. After this PR + FE+1 wiring: F11 Requirements browser + F31 RTM matrix can render real data; A1 Composer (Day-14) reads requirements via this surface.

### Added — Day 13 M3 — Composer (A1) endpoint scaffold (Pattern A) (2026-05-08 — TASK BE-1)

- **`feat(api)`** — **`POST /api/projects/:projectId/requirements/:reqId/test-cases/generate` ships as a Pattern A scaffold** ahead of Day-15's real Groq integration. New `ComposerService` + `ComposerController` wired into TestCasesModule. Wire shape locked: `{ runId, cases[5], llmMetadata, stubbed: true }` so FE+1's F16a Composer modal can implement against a stable contract this week. Day-15 swap point clearly marked in service body — single search-and-replace point that flips `stubbed: true` → `false` once ADR-013 (lands Day-14) + JSON-schema response_format wiring lands. **Pattern A behavior:** 5 canned-but-realistic test cases generated deterministically from `(req.key, index)` so tests are stable. Each proposal carries a suggested key (`TC-<projectKey>-PROPOSED-NNN`), parameterized title (`<req.title> — <template-suffix>`), preconditions, ordered stepsJson, expectedResult, priority (P0–P2 mix biased toward security/integrity tests), format='step', rationale prose for F16a review UI, and `sourceChunkIds: []` (Day-15 will populate from KbSearchService RAG context). 10 canned templates cover: happy path, validation 400, **cross-workspace isolation**, **audit log integrity**, rate limit + retry, concurrent edit conflict, **RBAC denial**, **soft-delete preserves references**, **PII redaction in audit**, pagination + filter combos. **Persistence:** TB-022 `TestCaseGenerationRun` row written per call. **DOES NOT insert TestCase rows** — proposals stay in-memory until the FE accepts each in F16a + POSTs to `/api/projects/:projectId/test-cases`. **RBAC:** Admin/Lead/QAEngineer; Stakeholder = 403. **PII discipline:** audit payloads carry `req_key` + counts only — NEVER req.title text. Pinned by negative test. Two audit rows per call: `composer_generation_started` + `composer_generation_completed`. **Zod schemas** added to `packages/shared/src/schemas/test-case.ts`: `ComposerGenerateRequest`, `ComposerGeneratedCase`, `ComposerGenerateResponse` (with `stubbed` flag). **No new schema, no migration** — TB-022 already covers. **Tests:** 15 jest in new `apps/api/src/test-cases/__tests__/composer.service.spec.ts` (target was 8+). Typecheck + lint clean. After this PR + FE+1 wiring: F16a Composer modal renders proposals; Day-15 swap is single PR with zero FE changes.

### Added — Day 13 M3 — Curator (A2) endpoint scaffold (Pattern A) (2026-05-08 — TASK BE-3 stretch)

- **`feat(api)`** — **`POST /api/projects/:projectId/test-cases/:tcId/duplicates` ships as a Pattern A scaffold** ahead of Day-16's real pgvector cosine search. New `CuratorService` + `CuratorController` wired into TestCasesModule. Wire shape locked: `{ testCaseId, verdict, highestSimilarity, matches, thresholds, searchMetadata, stubbed: true }` so FE+1's F14m2 Curator ⓘ near-dup banner can implement against a stable contract this week. **Threshold canon** (per CLAUDE.md + ADR-014 lands Day-15): ≥0.95 → 'block' (true duplicate); ≥0.85 → 'flag' (near-duplicate warning); <0.85 → not surfaced. Per-match verdict + overall verdict computed against thresholds. **Pattern A:** 3 canned matches per call, similarity scores derived deterministically from SHA-256 hash of source caseId — same input always produces same output (stable for tests, demo-friendly for FE). **Day-16 swap point** clearly marked: real impl will embed source case + run pgvector HNSW cosine search SQL. **RBAC:** all 4 roles (read-equivalent — dedupe checks don't modify state). **PII discipline:** audit payload carries `case_keys` + `match_case_keys` + counts only — NEVER candidate case titles. Pinned by negative test. Two audit rows per call: `curator_dedupe_check_started` + `curator_dedupe_check_completed`. **Zod schemas** added: `CuratorVerdict`, `CuratorMatchVerdict`, `CURATOR_THRESHOLD_FLAG_DEFAULT=0.85`, `CURATOR_THRESHOLD_BLOCK_DEFAULT=0.95`, `CURATOR_TOP_K_DEFAULT=5`, `CURATOR_TOP_K_MAX=20`, `CuratorCheckRequest` (with `.refine()` enforcing thresholdBlock > thresholdFlag), `CuratorMatch`, `CuratorCheckResponse`. **No new schema, no migration** — TB-007 already covers. **Tests:** 16 jest in new `apps/api/src/test-cases/__tests__/curator.service.spec.ts` (target was 4+). Typecheck + lint clean. Prettier --check clean. After this PR + FE+1 wiring: F14m2 near-dup banner renders with stub data; Day-16 swap is single PR with zero FE changes.

### Added — Day 13 M3 — test cases bulk operations (2026-05-08 — TASK BE-2)

- **`feat(api)`** — **Two new bulk endpoints on `/api/projects/:projectId/test-cases/`** for the F14m2 Link Test Case modal + F14 list-page bulk-archive checkbox flow. (1) **`POST /api/projects/:projectId/test-cases/bulk-link`** (Admin/Lead/QAEng, 200) — link N test cases (1..50) to a single requirement. Idempotent: re-linking returns `outcome='existed'` per row without writing duplicate rows. Cross-project / cross-workspace test cases land in `failed[]` with a typed reason (`not_found` / `cross_project` / `cross_workspace`) — partial success is normal. (2) **`POST /api/projects/:projectId/test-cases/bulk-delete`** (Admin/Lead/QAEng, 200) — bulk soft-delete N test cases via `status='deprecated'`. Same per-row outcome / failure shape. **Performance:** ≤4 Prisma calls per bulk op regardless of N (no N+1). ONE audit row per call (`test_cases_bulk_linked` / `test_cases_bulk_archived`) keeps the chain compact. **PII discipline:** audit payload carries `case_keys` + counts only — NEVER titles. Pinned by negative test asserting no `Customer XYZ` / `50000` / `SECRET_TITLE_PHRASE` from synthetic case titles in audit payload string. **Hard cap:** `BULK_OPERATION_MAX_IDS = 50` (Zod `.max(50)`); larger ops → CSV import path (Day-16). **Zod schemas** added to `packages/shared/src/schemas/test-case.ts`: `BulkLinkInput`/`BulkLinkResponse` (with `totals` aggregate for FE summary line), `BulkDeleteInput`/`BulkDeleteResponse`, plus per-row outcome + failure item shapes. **No new schema, no migration** — TB-007 + TB-008 already cover. **Tests:** 12 jest in new `apps/api/src/test-cases/__tests__/test-cases-bulk.spec.ts` (target was 6+). Typecheck + lint clean. Prettier --check clean (new pre-push gate from PR #91 catches drift). After this PR + FE+1 wiring: F14m2 multi-select link + F14 bulk-archive checkbox flow operational.

### Added — Day 13 M3 — test case CRUD real implementation (2026-05-08 — TASK 1)

- **`feat(api)`** — **TestCasesService + TestCasesController real CRUD ships, replacing the 501 stubs from PR #75.** Pipeline mirrors the KbDocumentsService pattern from M2 Day-11 PR #60: `assertProjectWorkspace()` → 404 on cross-workspace (no leak); `assertCaseWorkspace()` → 404 on cross-workspace caseId. Five endpoints: (1) **`POST /api/projects/:projectId/test-cases`** (Admin/Lead/QAEng, 201) — Zod-validates `CreateTestCaseInput` w/ format/gherkin refinement, optional `linkedRequirementIds[]` (validates all exist in project, 404 on cross-project link, atomically inserts TestCase + TestCaseLink rows in one Prisma `$transaction`), Prisma P2002 unique-key collision → 409 ConflictException, audits `test_case_created`. (2) **`GET /api/projects/:projectId/test-cases`** (all 4 roles) — paginated by `createdAt DESC`, default page 20 capped at 100, dynamic where clause from filters: `?priority=P0,P1` (CSV → `IN`), `?status=manual_draft,reviewed` (CSV → `IN`), `?format=gherkin` (single value), `?hasLinks=true|false` (Prisma `requirementLinks: { some/none: {} }`), `?q=login` (case-insensitive title `ILIKE`); per-row `linkCount` derived via Prisma `_count.requirementLinks`. (3) **`GET /api/test-cases/:caseId`** (all 4 roles) — full detail incl. linked requirements (key + title + priority + status) + suite memberships (id + name); `gherkin`/`sourceChunkIds`/`rationale`/`aiProvenanceJson` exposed. (4) **`PATCH /api/test-cases/:caseId`** (Admin/Lead/QAEng) — partial patch, only fields with `!== undefined` get updated; `linkedRequirementIds` delta applied via delete-then-insert in a single transaction (mirrors LLM-config routing pattern from M1 Day-8); audits `test_case_updated` with `fields_changed` array (NOT values). (5) **`DELETE /api/test-cases/:caseId`** (Admin/Lead/QAEng) — **soft delete via `status='deprecated'`** (the existing TestCaseStatus enum's closest equivalent to v2 plan's 'archived' — reconciliation deferred to M3 close per BE-01 reconciliation note). Run results + defect references stay valid. **Bundled — RTM linking endpoints (TASK 2 surface):** `POST /api/test-cases/:caseId/links` (Admin/Lead/QAEng, 201) — idempotent: `outcome='created'` on first link + audit; `outcome='existed'` on retry (no audit, chain stays clean); cross-project requirement → 404. `DELETE /api/test-cases/:caseId/links/:reqId` (Admin/Lead/QAEng) — 404 when no link exists. **`assertWriteRole()`** defense-in-depth check: even though `@Roles` guard catches Stakeholder writes upstream, service-layer throws `ForbiddenException` if Stakeholder hits a write path via shaped request. **PII discipline:** audit payloads omit title/preconditions/expectedResult/stepsJson/gherkin/rationale text (these can leak business intent like "Verify Customer XYZ refund flow"). Audit records `case_key` (UUID-like, safe) + counts/lengths only — pinned by negative test asserting no "SECRET*PRE_TEXT"/"SECRET_GHERKIN_BODY"/"Customer XYZ"/"50000" appear in payload string. **Zod schemas in `packages/shared/src/schemas/test-case.ts`** (extended): `TestCaseListQuery` (with CSV-coerce filters), `TestCaseListItem`/`TestCaseListResponse`, `LinkedRequirementSummary`, `SuiteMembershipSummary`, `TestCaseDetailItem`/`TestCaseDetailResponse`, `TestCaseCreateResponse`/`TestCaseUpdateResponse`/`TestCaseDeleteResponse`, `CreateTestCaseLinkInput`/`TestCaseLinkResponse`/`TestCaseUnlinkResponse`, `RequirementCoverageItem`/`RequirementCoverageResponse`. **No new schema, no migration** — TB-007 + TB-008 already cover. **Tests:** 24 jest in new `apps/api/src/test-cases/__tests__/test-cases.service.spec.ts` (target was 15+) covering: create happy path × 1, create with links → tx insert × 1, P2002 → 409 × 1, cross-workspace → 404 × 1, linked-req cross-project → 404 × 1, list paginated + linkCount × 1, list filter combinations × 2, list cross-workspace × 1, detail with links + suites × 1, detail cross-workspace × 1, update partial patch × 1, update linkedReqs delta in tx × 1, update cross-workspace × 1, archive flips status × 1, archive cross-workspace × 1, \*\*PII guard with synthetic SECRET*\* + Customer XYZ payload × 1**, link happy path × 1, link idempotent (no audit on existed) × 1, unlink happy path × 1, unlink missing link → 404 × 1, coverageForRequirement happy path × 1, assertWriteRole allows write roles × 1, assertWriteRole rejects Stakeholder × 1. **407/407 full BE suite\*\* (was 370 post-PR #78; +37 net new this PR — 24 new + 13 carried from skeleton-replaced spec). Typecheck + lint clean. After this PR + FE+1 wiring: F14 Test Case browser + F31 Composer review modal can render real data; A1 Composer (Day-14) inserts via this surface.

### Added — Day 12 M2 (al) F12 upload-pipeline gap fix (2026-05-07 — `[m2-blocker]`)

- **`feat(api)`** — **`POST /api/projects/:projectId/kb/documents` ships, closing the F12 upload-pipeline gap (followup `(al)`).** FE+1 audit revealed: existing pipeline was presigned-upload → R2 PUT → finalize-upload, but finalize-upload required a KbDocument row that NO endpoint created. This PR is that endpoint. Pipeline: (1) Validate Zod (`CreateKbDocumentRequest` — fileName 1..512 chars, fileSize positive int ≤ 50 MB, mimeType regex-validated against canonical type/subtype shape, fileType ∈ pdf/docx/md/txt/xlsx/csv) + cross-field `.refine()` enforcing mimeType ↔ fileType plausibility (e.g. `text/plain` is rejected when fileType=`xlsx`); (2) RBAC = Admin/Lead/QAEngineer (any signed-in user with project membership); (3) `assertProjectWorkspace()` — cross-workspace projectId → 404 (no leak); (4) Defense-in-depth size cap inside service (Zod could be skipped if a future caller bypasses the controller); (5) Generate documentId via `crypto.randomUUID()`; (6) Issue R2 presigned PUT URL via `R2Service.presignedUpload({ contentType: mimeType, filename: fileName, prefix: '<projectId>/<documentId>' })` — final R2 key shape is `<projectId>/<documentId>/<YYYY-MM-DD>/<inner-uuid>-<sanitized-filename>` (slight deviation from the user's `{projectId}/{documentId}/{filename}` spec — preserves the existing R2Service date-prefix convention used by every other M2 upload, where date prefix simplifies lifecycle cleanup + inner uuid prevents collisions on duplicate-filename retries to the same documentId); (7) Persist KbDocument row in a single Prisma write (`title=fileName`, `bodyMd=''`, `templateKind=fileType`, `authorId=actorId`, `pinned=false`); **status='pending_upload' is implicit** — a KbDocument with no kb_chunks rows is in the pending state until finalize-upload populates them, so no schema migration was needed; (8) Audit `kb_document_create_initiated` synchronously with PII-redacted payload (`document_id`, `project_id`, `workspace_id`, `file_name_length`, `file_name_extension` (just the .pdf/.xlsx body — safe), `file_size_bytes`, `mime_type`, `file_type`, `r2_key_prefix` (only `<projectId>/<documentId>` — pinned by negative test, NEVER the raw filename portion which the R2 key carries), `actor_email`). **PII guard caught a real bug during dev:** initial implementation logged the full `r2_key` in the audit payload — the R2 key includes the sanitized filename, so a doc named "Customer XYZ Refund Policy 50000.pdf" would have leaked through. Test asserts `payloadStr` does NOT contain "Customer XYZ" / "Refund Policy" / "50000"; fix logs only `r2_key_prefix`. R2Service is called BEFORE the DB write so a bucket/auth failure never leaves an orphan KbDocument row. Returns 201 `{ documentId, presignedUploadUrl, r2Key, expiresAt }`. **Bundled fix:** `UploadOrchestratorController.finalizeUpload` RBAC widened from Admin-only to Admin/Lead/QAEngineer, matching the new create endpoint — a QAEng who creates an upload can now also finalize it. Workspace isolation still enforced inside `UploadOrchestratorService` via the project-membership chain. **Zod schemas in `packages/shared/src/schemas/kb.ts`:** `KbUploadFileType` enum, `KB_UPLOAD_MAX_BYTES` const (50 MB), `KbUploadMimeType` regex schema, `CreateKbDocumentRequest` (with `.refine()`), `CreateKbDocumentResponse`. **No new schema, no migration** — TB-017's existing columns (id, projectId, title, bodyMd, templateKind, authorId, pinned, timestamps) cover the surface; chunk-count = 0 implicitly tracks pending-upload status. **Tests:** 14 new jest in `apps/api/src/kb/__tests__/kb-document-create.spec.ts` covering: happy path returns documentId/presignedUrl/r2Key/expiresAt × 1, KbDocument row created with right fields × 1, R2Service called with right args incl. prefix × 1, **PII redaction guard with synthetic "Customer XYZ" filename × 1** (assert no leak in audit payload), cross-workspace project → 404 × 1, missing project → 404 × 1, oversize > 50 MB → 400 + no R2 + no DB + no audit × 1, Zod refusal: mimeType doesn't match fileType × 1, Zod refusal: oversize at Zod layer × 1, Zod refusal: unknown fileType × 1, Zod refusal: malformed mimeType × 1, all 6 fileTypes accept their canonical mimeType × 1, RBAC matrix × 2 (POST = Admin/Lead/QAEng + finalize-upload widened to same trio). **370/370 full BE suite** (was 322 baseline + 47 from M3 starter PRs + 1 net new from this — actually +1 over the M3 cluster since M3-BE-01 ships only schema tests). Typecheck + lint clean. After this PR + FE+1 wiring: F12 KB upload UX is fully functional end-to-end (FE POST create → R2 PUT → POST finalize-upload → chunk + embed → KB search/answer hits live data).

### Added — Day 12 M3 starter — test_case AI columns + TB-022 generation_runs (2026-05-07 — TASK M3-BE-01)

- **`feat(api)`** — **Prisma migration `20260507135000_m3_test_case_ai_columns/migration.sql`** + schema.prisma extension lay the schema foundation for M3 (Composer / Test Case Generator). Two changes: (1) **TB-007 `test_cases`** gains 5 new columns: `format VARCHAR(10) NOT NULL DEFAULT 'step' CHECK ('step', 'gherkin')` (discriminator), `gherkin TEXT NULL` (alt body for BDD-format cases), `generated_by_agent VARCHAR(20) NULL` ('composer' / 'curator' / null), `source_chunk_ids JSONB NULL` (kb_chunk UUIDs that grounded a Composer run), `rationale TEXT NULL` (LLM-rendered "why this case" for F31 review modal). New compound index `(project_id, format)` for `?format=gherkin` filter (per v2 plan §"List + Filter UI"). **Reconciliation note:** the M3 v2 plan was written assuming a clean test_cases table; in practice `confidence_score` (Float?) and `status` (TestCaseStatus enum: ai_draft/manual_draft/reviewed/active/flaky/deprecated) already exist from M2. Both are functionally equivalent to the v2 plan's DECIMAL(3,2) + ('draft','ai_draft','ready','archived') CHECK proposals; reconciling the status vocabulary forces a Prisma enum migration + Zod cascade in the same PR. Decision: keep existing columns, defer status-vocab reconciliation to Day-13 if real CRUD logic demands it. Documented inline in the migration SQL header. (2) **TB-022 (NEW) `test_case_generation_runs`** — one row per Composer run, captures: `llm_provider` (CHECK 'groq'/'gemini'), `llm_model`, `input_token_count`, `output_token_count`, `chunks_retrieved`, `cases_generated`, `cases_accepted` (NULL pre-review), `cases_dedupe_flagged` (NULL pre-Curator), `duration_ms`, `status` (CHECK 'success'/'partial'/'failed'), `error_reason TEXT?` (truncated to ~500 chars in app code mirroring `kb_search_failed`). FK plumbing: `project_id` → CASCADE (project gone → runs gone), `requirement_id` → SET NULL (req gone → keep run history), `triggered_by` → no cascade (user delete fails loud). Two indices: `(project_id, created_at DESC)` for per-project Composer history, `(triggered_by)` for per-user audit trail. **Schema.prisma model**: `TestCaseGenerationRun` added with relations on `Project.testCaseGenerationRuns`, `Requirement.testCaseGenerationRuns`, `User.testCaseGenerationRunsTriggered` (named relation `TestCaseGenerationRunTriggerer`). **Zod schemas in `packages/shared/src/schemas/test-case.ts`** (extended): `TestCaseFormat`/`GeneratedByAgent`/`TestCaseGenerationLlmProvider`/`TestCaseGenerationRunStatus` enums (mirror raw SQL CHECKs), `TestCaseSchema` extended with all 5 new fields, `CreateTestCaseInput` extended with `.refine()` enforcing the format/gherkin invariant ("`format='gherkin'` requires non-empty body; `format='step'` requires gherkin=null"), `UpdateTestCaseInput` re-shaped to a flat `.partial()` (fixes pre-existing latent bug where `.omit({key:true}).partial()` prevented patching the AI-provenance fields), `TestCaseGenerationRunSchema` for the new TB-022 row. **Tests:** 20 jest in new `apps/api/src/__tests__/m3-test-case-ai-schema.spec.ts` covering: TestCase nullable invariants × 4, CreateTestCaseInput format/gherkin refinement × 4, TestCaseGenerationRun shape + CHECK vocab mirrors × 7, migration SQL additive-idempotent contract × 5 (all 5 ADD COLUMNs present, format CHECK present, both FKs configured correctly, both indices present, no DROP / DELETE / TRUNCATE / RENAME ops — re-running on partial DB is safe). Typecheck + lint clean. **No application code wires these fields yet** — Day-13's TestCasesService gets that work. Next PR (TASK M3-BE-02) wires the empty TestCaseModule + TestCasesController stubs against this schema.

### Added — Day 12 M3 starter — requirements CRUD skeleton (2026-05-07 — TASK M3-BE-03)

- **`feat(api)`** — **`/api/projects/:projectId/requirements` + `/api/requirements/:reqId` skeleton ships.** Sister PR to TASK M3-BE-02. Two new controllers (`RequirementsProjectScopedController` + `RequirementsReqScopedController`) wrap a single `RequirementsService` whose 5 methods all throw `NotImplementedException` (501) with a Day-14 hand-off comment per method. Real CRUD lands later in M3 (Day-14+) once PRD ingestion + Composer trigger flow is settled. Zod validation runs at the controller surface BEFORE the 501 fires (using existing `CreateRequirementInput` + `UpdateRequirementInput` from `@qa-nexus/shared`). RBAC same matrix as test-cases skeleton: POST/PATCH/DELETE = Admin/Lead/QAEngineer; GET list/detail = all 4 roles incl. Stakeholder. **`apps/api/src/app.module.ts`**: `RequirementsModule` added to imports list. **No new schema** — TB-006 already covers; no Zod additions either (existing exports sufficient). **Tests:** 13 jest in `apps/api/src/requirements/__tests__/requirements.controller.spec.ts`: 5 endpoint × 501 contracts, 3 Zod 400 contracts (CreateRequirementInput + pageSize > 100 + empty title), 5 RBAC matrix assertions. All 13 pass; typecheck + lint clean. **Locks the `/api/projects/:projectId/requirements` URL space before A1 Composer (M3 Day-14) needs to ground generation runs against a Requirement** — TB-022 already has the `requirement_id` FK from TASK M3-BE-01.

### Added — Day 12 M3 starter — test cases CRUD skeleton (2026-05-07 — TASK M3-BE-02)

- **`feat(api)`** — **`/api/projects/:projectId/test-cases` + `/api/test-cases/:caseId` skeleton ships ahead of Day-13 real CRUD.** Two new controllers (split because the v2 plan spec puts POST + LIST at the project-scoped path and GET/PATCH/DELETE at a top-level case-scoped path): `TestCasesProjectScopedController` (POST + LIST under `/api/projects/:projectId/test-cases`) + `TestCasesCaseScopedController` (GET / PATCH / DELETE under `/api/test-cases/:caseId`). Both wrap a single `TestCasesService` whose 5 methods all throw `NotImplementedException` (501) with a Day-13 hand-off comment per method. Zod validation runs at the controller surface BEFORE the 501 fires, so invalid payloads still return 400 (Day-13's real implementation never sees malformed input). RBAC via existing `RolesGuard` + `@Roles(...)` decorator: POST/PATCH/DELETE = Admin/Lead/QAEngineer; GET list/detail = all 4 roles incl. Stakeholder (Stakeholder = read-only across the entire surface, mirrors KbDocumentsController's list/detail-vs-delete split). Workspace isolation TBD inside service (Day-13) — controllers resolve `ActorContext` (workspaceId/actorId/actorEmail/role) the same way KbDocumentsController does. **`apps/api/src/app.module.ts`**: `TestCasesModule` added to imports list. **No new schema** — TASK M3-BE-01 already shipped that. **No new Zod schemas** — uses existing `CreateTestCaseInput` + `UpdateTestCaseInput` from `@qa-nexus/shared` (extended in M3-BE-01 with the AI-provenance refinements). **Tests:** 14 jest in `apps/api/src/test-cases/__tests__/test-cases.controller.spec.ts`: 5 endpoint × 501 contracts, 3 Zod 400 contracts, 1 format-refinement guard, 5 RBAC matrix assertions (POST/PATCH/DELETE = 3 write roles; GET list + GET detail = all 4 roles). All 14 pass; typecheck + lint clean. **Establishes the canonical `/api/projects/:projectId/test-cases` URL space before A1 Composer (M3 Day-14) needs to insert into it.**

### Added — Day 11 M2 KB document CRUD (2026-05-06 — TASK 4)

- **`feat(api)`** — **Document CRUD endpoints under `/api/projects/:projectId/kb/documents` ship.** Three endpoints + cascade-delete plumbing: (1) **`GET /api/projects/:projectId/kb/documents`** (Admin/Lead/QAEng/Stake) — paginated list (default 20, capped at 100) ordered by `pinned DESC, createdAt DESC`; per-row `chunkCount` derived via Prisma `_count.chunks`. (2) **`GET /api/projects/:projectId/kb/documents/:docId`** (Admin/Lead/QAEng/Stake) — single doc + most-recent K chunks inline (default K=50, capped at 100). (3) **`DELETE /api/projects/:projectId/kb/documents/:docId`** (**Admin/Lead only** — RBAC tightened from list/detail) — cascade-delete: (a) lookup `r2_key` from latest `kb_chunks_generated` audit-row payload (KbDocument has no r2_key column; chunking flow stores it in audit payload per PR #34); (b) **R2 delete FIRST** per Yogesh ordering "don't orphan DB row if R2 fails" — on R2 failure, throw 500 + DB row preserved + retry-the-call hint logged + `kb_document_delete_failed` audit row with stage='r2'; (c) DB delete (chunks cascade automatically via `KbChunk.documentId` `onDelete: Cascade` FK in TB-018); (d) audit `kb_document_deleted` synchronously with PII-redacted payload (`doc_id`, `project_id`, `workspace_id`, `chunk_count_at_delete`, `title_LENGTH` (NOT title — filenames can contain customer PII like "Customer XYZ Refund Policy.pdf"), `r2_delete_attempted`, `r2_delete_succeeded`, `actor_email`). When the doc was created without ever being chunked (no `kb_chunks_generated` audit row found), R2 delete is **SKIPPED** with a logged warning + DB delete still proceeds. New `KbDocumentsService` + `KbDocumentsController` wired in `KbModule`. **Workspace isolation:** every method calls `assertProjectWorkspace()` which checks `Project.workspaceId === ctx.workspaceId` → 404 (no leak) on mismatch. **No new schema, no migration** — TB-017 + TB-018 + R2Service.deleteObject() already cover. Zod schemas added to `packages/shared/src/schemas/kb.ts`: `KbDocumentListQuery` (`z.coerce.number()` for query-string parsing), `KbDocumentDetailQuery`, `KbDocumentListItem` + `KbDocumentListResponse`, `KbDocumentChunkInline`, `KbDocumentDetailItem` + `KbDocumentDetailResponse`, `KbDocumentDeleteResponse` (with `r2DeleteAttempted/Succeeded` flags). **Tests:** 11 new jest (target was 8+) — list paginated + workspace-scoped, list cross-workspace 404, pageSize > 100 clamped to 100, detail returns K chunks, detail cross-project 404, **delete happy path with R2-before-DB pinned via `mock.invocationCallOrder`**, delete skips R2 when no audit row, delete 404 missing/cross-workspace, **delete R2 failure → 500 + DB.delete NEVER called + audit failure row** (Yogesh ordering pinned), PII guard (assert payloadStr does NOT contain "Customer XYZ"/"Refund Policy"/"50000" + `title_length` IS present). **322/322 full BE suite** (+11 net new). Typecheck + lint clean. After this PR: F12 KB upload list/delete UX gets real BE backing; FE+1 TASK 4 (F12 Pattern A→B flip) on Thu unblocked.

### Added — Day 11 M2 RAG answer pipeline + ADR-012 (2026-05-06 — TASK 3)

- **`feat(api)` + `docs(adr)`** — **`POST /api/projects/:projectId/kb/answer` ships the M2 RAG question-answering pipeline.** Sits on top of `KbSearchService` (Step 8 / TASK 2) + `LLMGatewayService.complete()` (MS0-T023). New surface across 4 files + 1 ADR: (1) **`docs/architecture/adr-012-kb-rag-prompt-strategy.md`** — locks the system prompt (4-rule constant in source code, never env/DB-loaded so diffs make any change visible in PR review) + the citation format `[chunk: <UUID>]` (UUID-anchored regex parser; same marker appears in INPUT chunk header AND OUTPUT citation so the model trivially mirrors it, avoiding citation-drift failure modes) + sampling defaults (temperature 0.2 deterministic, maxTokens 800 free-tier-budget cap, default top-K=5 clamped to MAX_TOP_K=10) + empty-context behavior (skip LLM, return canonical "I don't have information…" string + confidence 0 + `noContext: true` so FE shows a no-info notice rather than a chat bubble) + confidence-score formula (avg of cited chunk similarities, fall back to top-chunk similarity when LLM cited nothing) + PII-redacted audit shape. 4 alternatives rejected: ChatML messages array (gateway shape stays simple), JSON-mode citation output (verbose + breaks streaming UX), self-hosted re-ranker (Render Free 512 MB ceiling), multi-step ReAct agent (free-tier RPD cost). Followup `(af)` filed for M3 RAG quality eval methodology. (2) **`apps/api/src/kb/kb-answer.service.ts`** (`KbAnswerService`) — orchestrates: (a) reuses `KbSearchService.search()` for top-K chunks (workspace isolation + per-call audit row inherited for free); (b) empty-context short-circuit (no LLM call when 0 chunks; saves Groq RPD); (c) builds context block as `[chunk: <UUID>]\nSource: <title>\n<text>` per chunk (citation marker IS the chunk header); (d) calls `LLMGatewayService.complete(userMessage, { systemPrompt, temperature: 0.2, maxTokens: 800 })`; (e) parses cited chunk IDs via UUID-anchored regex `/\[chunk:\s*([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\]/gi`, intersects with retrieved set to filter hallucinated UUIDs; (f) computes confidence as avg cited similarity || top-chunk fallback, clamped to [0,1]; (g) audits `kb_answer_generated` synchronously with PII guard — payload carries question_length + question_token_count + result_chunks + cited_chunks + answer_length + provider/model + tokens_in/out + confidence_score + actor_email, NEVER question text NOR answer text NOR chunk text. **Failure semantics:** KbSearchService failure (embedder down) propagates as ServiceUnavailableException; LLM failure → wrap as 503 + `kb_answer_failed` audit row with stage='llm' + truncated reason ≤ 500 chars (audit-failure-doesn't-mask-original-error pattern preserved). (3) **`apps/api/src/kb/kb-answer.controller.ts`** (`KbAnswerController`) — thin HTTP wrapper, Admin/Lead/QAEngineer/Stakeholder allowed (any signed-in user can ask questions), resolves actor context via `authService.resolveSession()`, delegates to `KbAnswerService.answer()`. (4) **`apps/api/src/kb/kb.module.ts`** — adds `KbAnswerController` + `KbAnswerService` to controllers/providers/exports (LLMGatewayModule is `@Global` so no re-import needed; same pattern as EmbeddingModule). **Zod schemas in `packages/shared/src/schemas/kb.ts`:** `KbAnswerRequest` (question 1..2000 chars + topK 1..10 default 5), `KbAnswerLlmMetadata` (provider/model/tokens/latency/fallback), `KbAnswerResponse` (answer + sourceChunkIds[] + confidenceScore [0,1] + noContext + retrievedChunkCount + llmMetadata-or-null). **No new schema** — TB-018 + TB-017 already cover. **No migration.** **Tests:** 14 new jest in `apps/api/src/kb/__tests__/kb-answer.service.spec.ts` covering (a) empty-context short-circuit (LLM NEVER called when 0 chunks, audit STILL written with no_context=true); (b) happy path with citations (system prompt locked-string assertion, temperature=0.2, maxTokens=800, user message has Question/Context/chunk markers, sourceChunkIds extracted, confidence=0.8 for [0.9,0.7] cited); (c) multi-citation per sentence parsed; (d) hallucinated UUIDs filtered (cited UUID NOT in retrieved set → stripped); (e) confidence falls back to top-chunk similarity when no citations; (f) UUID-anchored regex rejects non-UUID forms ([chunk: 1], [chunk: abc] both rejected); (g) topK clamping (>10 → 10, <1 → 1, default 5); (h) ServiceUnavailableException on LLM fail + kb_answer_failed audit with stage='llm' + retrieved_chunks count; (i) propagates KbSearchService failure without LLM call; (j) PII redaction (sensitive question + answer + chunk text NEVER in audit, only counts/provider/tokens — pinned by `expect(payloadStr).not.toContain('xyz123'/'cancel customer'/'$50000'/'SENSITIVE_CHUNK_CONTENT_DO_NOT_LEAK'/'Refund $50000')`); (k) confidence math correctness (avg of cited); (l) confidence clamped to [0,1]. **325/325 full BE suite** (was 311 post-TASK-2; +14 net new). Typecheck + lint clean. After this PR: F19 Run Console gets a real "Ask a question" surface; FE renders cited chunks as anchored cards beneath the answer; M2 RAG vertical is feature-complete pending TASK 4 (doc CRUD) + TASK 5 (close-gate sweep).

### Added — Day 11 M2 close prep (2026-05-06 — TASK 6)

- **`docs(milestones)` + `feat(api)`** — **M2 close-ceremony toolkit lands ahead of Sat 9 May ceremony.** Two deliverables Yogesh-spec'd in the Day-11 PM brief: (1) **`docs/milestones/m2-close-report-template.md`** — fillable template for MAIN's Sat M2 close report, modeled on `m1-close-report-template.md` precedent. 10 sections: dates+duration, M2 PRs landed (the Day-11 cluster: #51 staging deployment, #53 chunk-search pgvector flip, #57 RAG answer pipeline + ADR-012, #58 platform-discipline, #60 KB document CRUD, #61 M2 close-gate KB sweep, plus this PR), test counts + coverage delta vs M1 baseline (322 BE post-M1 close → ~390+ post-M2-sweep), M2 audit-action coverage table (11 new actions: kb_chunks_generated, kb_chunks_embedded, kb_document_orchestration_started/completed/failed, kb_search_performed/\_failed, kb_answer_generated/\_failed, kb_document_deleted/\_delete_failed), free-tier quota usage (8 providers — Render/Neon/R2/GitHub Actions/Groq/Gemini/Resend/Cloudflare Pages with usage + headroom + canonical query commands), acceptance gates status (M2-CLOSE-GATE sweep / pgvector index health / RAG citation drift / R2-FIRST cascade-delete / 6 other binary gates), carry-overs to M3 (followup table snapshot — `(af)`, `(z)`, `(aa)`, `(l)`, `(v)`), notable wins, notable misses, sign-off table (Admin/Lead/MAIN). Each `<FILL>` marker is a required field; each "→ command:" line is the canonical command MAIN runs to extract the data. (2) **`scripts/verify-audit-chain.ts`** extended with **`--summary` flag** — prints M2 audit-action coverage table after chain verification: per-action row count + workspaces touched + last-seen-at, grouped by feature pillar (KB chunking, KB embedding, Upload orchestrator, KB search, KB RAG answer, KB document CRUD). Zero rows on a critical action = sweep gap, not a feature gap — MAIN reads the table top-to-bottom during ceremony and ticks each pillar. Combines naturally with existing `--workspace`/`--since`/`--json`/`--quiet` flags. New `M2_ACTIONS` const (11 entries) is the single source of truth for which audit actions M2 introduced; same list informs the close-report template §5.2. **No new schema** — purely additive to existing audit_log table. **No new tests** — flag is a read-only forensics surface; existing 5 verifier tests still pass; typecheck clean. After this PR + Sat close ceremony: M2 sealed with verifiable per-action coverage + traceable PR provenance + acceptance-gate audit trail. Combined with PR #61 sweep, gives MAIN full close-gate audit in two commands (`pnpm test:e2e -- -t "@M2-CLOSE-GATE"` + `pnpm verify:audit --summary`).

### Added — Day 11 M2 close prep (2026-05-06 — TASK 6)

- **`docs(milestones)` + `feat(api)`** — **M2 close-ceremony toolkit lands ahead of Sat 9 May ceremony.** Two deliverables Yogesh-spec'd in the Day-11 PM brief: (1) **`docs/milestones/m2-close-report-template.md`** — fillable template for MAIN's Sat M2 close report, modeled on `m1-close-report-template.md` precedent. 10 sections: dates+duration, M2 PRs landed (the Day-11 cluster: #51 staging deployment, #53 chunk-search pgvector flip, #57 RAG answer pipeline + ADR-012, #58 platform-discipline, #60 KB document CRUD, #61 M2 close-gate KB sweep, plus this PR), test counts + coverage delta vs M1 baseline (322 BE post-M1 close → ~390+ post-M2-sweep), M2 audit-action coverage table (11 new actions: kb_chunks_generated, kb_chunks_embedded, kb_document_orchestration_started/completed/failed, kb_search_performed/\_failed, kb_answer_generated/\_failed, kb_document_deleted/\_delete_failed), free-tier quota usage (8 providers — Render/Neon/R2/GitHub Actions/Groq/Gemini/Resend/Cloudflare Pages with usage + headroom + canonical query commands), acceptance gates status (M2-CLOSE-GATE sweep / pgvector index health / RAG citation drift / R2-FIRST cascade-delete / 6 other binary gates), carry-overs to M3 (followup table snapshot — `(af)`, `(z)`, `(aa)`, `(l)`, `(v)`), notable wins, notable misses, sign-off table (Admin/Lead/MAIN). Each `<FILL>` marker is a required field; each "→ command:" line is the canonical command MAIN runs to extract the data. (2) **`scripts/verify-audit-chain.ts`** extended with **`--summary` flag** — prints M2 audit-action coverage table after chain verification: per-action row count + workspaces touched + last-seen-at, grouped by feature pillar (KB chunking, KB embedding, Upload orchestrator, KB search, KB RAG answer, KB document CRUD). Zero rows on a critical action = sweep gap, not a feature gap — MAIN reads the table top-to-bottom during ceremony and ticks each pillar. Combines naturally with existing `--workspace`/`--since`/`--json`/`--quiet` flags. New `M2_ACTIONS` const (11 entries) is the single source of truth for which audit actions M2 introduced; same list informs the close-report template §5.2. **No new schema** — purely additive to existing audit_log table. **No new tests** — flag is a read-only forensics surface; existing 5 verifier tests still pass; typecheck clean. After this PR + Sat close ceremony: M2 sealed with verifiable per-action coverage + traceable PR provenance + acceptance-gate audit trail. Combined with PR #61 sweep, gives MAIN full close-gate audit in two commands (`pnpm test:e2e -- -t "@M2-CLOSE-GATE"` + `pnpm verify:audit --summary`).

### Added — Day 11 M2 close prep (2026-05-06 — TASK 6)

- **`docs(milestones)` + `feat(api)`** — **M2 close-ceremony toolkit lands ahead of Sat 9 May ceremony.** Two deliverables Yogesh-spec'd in the Day-11 PM brief: (1) **`docs/milestones/m2-close-report-template.md`** — fillable template for MAIN's Sat M2 close report, modeled on `m1-close-report-template.md` precedent. 10 sections: dates+duration, M2 PRs landed (the Day-11 cluster: #51 staging deployment, #53 chunk-search pgvector flip, #57 RAG answer pipeline + ADR-012, #58 platform-discipline, #60 KB document CRUD, #61 M2 close-gate KB sweep, plus this PR), test counts + coverage delta vs M1 baseline (322 BE post-M1 close → ~390+ post-M2-sweep), M2 audit-action coverage table (11 new actions: kb_chunks_generated, kb_chunks_embedded, kb_document_orchestration_started/completed/failed, kb_search_performed/\_failed, kb_answer_generated/\_failed, kb_document_deleted/\_delete_failed), free-tier quota usage (8 providers — Render/Neon/R2/GitHub Actions/Groq/Gemini/Resend/Cloudflare Pages with usage + headroom + canonical query commands), acceptance gates status (M2-CLOSE-GATE sweep / pgvector index health / RAG citation drift / R2-FIRST cascade-delete / 6 other binary gates), carry-overs to M3 (followup table snapshot — `(af)`, `(z)`, `(aa)`, `(l)`, `(v)`), notable wins, notable misses, sign-off table (Admin/Lead/MAIN). Each `<FILL>` marker is a required field; each "→ command:" line is the canonical command MAIN runs to extract the data. (2) **`scripts/verify-audit-chain.ts`** extended with **`--summary` flag** — prints M2 audit-action coverage table after chain verification: per-action row count + workspaces touched + last-seen-at, grouped by feature pillar (KB chunking, KB embedding, Upload orchestrator, KB search, KB RAG answer, KB document CRUD). Zero rows on a critical action = sweep gap, not a feature gap — MAIN reads the table top-to-bottom during ceremony and ticks each pillar. Combines naturally with existing `--workspace`/`--since`/`--json`/`--quiet` flags. New `M2_ACTIONS` const (11 entries) is the single source of truth for which audit actions M2 introduced; same list informs the close-report template §5.2. **No new schema** — purely additive to existing audit_log table. **No new tests** — flag is a read-only forensics surface; existing 5 verifier tests still pass; typecheck clean. After this PR + Sat close ceremony: M2 sealed with verifiable per-action coverage + traceable PR provenance + acceptance-gate audit trail. Combined with PR #61 sweep, gives MAIN full close-gate audit in two commands (`pnpm test:e2e -- -t "@M2-CLOSE-GATE"` + `pnpm verify:audit --summary`).

### Added — Day 11 M2 close-gate KB sweep (2026-05-06 — TASK 5, pulled from Fri)

- **`feat(api)`** — **M2 close-gate KB e2e sweep ships ahead of Sat 9 May ceremony.** Mirror-pattern of the Day-9 M1 close-gate sweep. New file `apps/api/test/m2-close/kb-sweep.e2e-spec.ts` with **69 jest assertions tagged `[@M2-CLOSE-GATE]`** for MAIN's grep filter (target was 30+). 6 describe blocks: (1) **Endpoint × role matrix — 36 assertions** = 9 M2 KB endpoints × 4 roles (Admin/Lead/QAEng/Stakeholder), Allow/Deny pinned against the `@Roles(...)` decorator with sourcePR cross-reference (`#34/#39/#40/#53/#57/#60`). (2) **Workspace isolation contracts — 8 markers** pointing at per-service spec coverage. (3) **PII redaction contracts — 6 markers** for every M2 audit action (no chunk text / no question text / no answer text / no title text / no raw vectors / no file bytes). (4) **Search relevance contract — 3 assertions** including a known-doc → known-chunk top-3 ranking test that ranks 4 synthetic chunks by cosine similarity DESC. (5) **RAG answer pipeline contracts — 6 assertions** including an inline UUID-anchored citation regex test that confirms `[chunk: <UUID>]` matches but `[chunk: 1]` and `[chunk: abc]` are rejected; canonical "no info" string from ADR-012 §4 pinned; sampling defaults (temperature 0.2, maxTokens 800, topK default 5/max 10) pinned. (6) **Cascade-delete contracts — 5 markers** for the Yogesh-spec'd ordering (R2 FIRST, FK CASCADE on chunks, audit failure stage='r2'). **Implementation pattern:** in-memory mock-driven (no live DB, no Render staging dependency); per-service behavior already covered by per-spec files (cross-referenced inline). **No new schema, no migration.** **69/69 e2e tests pass** locally (target was 30+; CI queued behind sustained outage — push will land when runner clears). Typecheck + lint clean. After this lands: MAIN's Sat 9 May M2 close ceremony has the `[@M2-CLOSE-GATE]` grep recipe (`pnpm --filter @qa-nexus/api test:e2e -- -t "@M2-CLOSE-GATE"`); cascade-ready.

### Added — Day 11 M2 Step 8 chunk-search real pgvector flip (2026-05-06 — TASK 2)

- **`feat(api)`** — **`POST /api/projects/:projectId/kb/search` flips from Step-4 fixture stub to real pgvector(384) HNSW similarity search.** Wire shape unchanged — Zod `KbSearchRequest` / `KbSearchResponse` / `Chunk` schemas are byte-identical pre/post swap, FE `stubbed: false` flag flips off the demo banner. New surface: (1) **`apps/api/src/kb/kb-search.service.ts`** (`KbSearchService`) — embeds the query via `EmbeddingService.embed()` (bge-small-en-v1.5, 384-dim per ADR-003 amendment), runs raw SQL `SELECT c.id, c.document_id, d.title, c.chunk_text, c.chunk_index, c.metadata_json, 1 - (c.embedding <=> $1::vector) AS similarity FROM kb_chunks c JOIN kb_documents d ON d.id = c.document_id WHERE d.project_id = $2::uuid AND d.workspace_id = $3::uuid AND c.embedding IS NOT NULL ORDER BY c.embedding <=> $1::vector LIMIT $4` (Prisma's typed client can't reference the `Unsupported("vector(384)")` column in WHERE/ORDER BY — raw SQL is the only path; the HNSW index from `0002_vector_384_dim.sql` makes this O(log N)). **Workspace isolation enforced server-side** via the JOIN-then-WHERE clause: chunks for projects in OTHER workspaces are filtered at the DB level (no leak via 200/empty, no need for a 404 path). Optional `sourceFileIds` filter via `d.id = ANY($5::uuid[])`; optional `minRelevanceScore` filter applied post-query (pre-filtering would defeat the HNSW index). Cosine similarity clamped to `[0, 1]` to handle pgvector FP drift on near-orthogonal vectors. Audits **`kb_search_performed`** synchronously with PII-redacted payload (query LENGTH + token COUNT + result COUNT + filter counts + actor — NEVER the query text; search queries can leak business intent). Embedder failure short-circuits → `ServiceUnavailableException` + `kb_search_failed` audit row with stage='embedding' + truncated reason ≤ 500 chars. (2) **`apps/api/src/kb/kb.controller.ts`** rewritten — injects `KbSearchService` + `AuthService` + `PrismaService`; `search()` resolves actor context, delegates to searcher, applies post-search sort overrides + Step-4 base64(offset) cursor pagination preserved. `detail()` flips to real `prisma.kbChunk.findUnique` + JOIN with workspace check enforced (cross-workspace OR cross-project chunkId → 404, no existence leak); neighbour pointers fetched via two cheap queries against the `(documentId, chunkIndex)` unique index. Both responses now carry `stubbed: false`. (3) **`apps/api/src/kb/kb.module.ts`** — added `KbSearchService` to providers + exports. **No new schema** — TB-018 + TB-017 already cover; HNSW index from Day-5's 0002 migration. **Tests:** 19 new jest across 2 specs replacing the Step-4 fixture-driven controller spec — `kb.controller.spec.ts` (11 tests: stubbed=false flip, filter pass-through, no embedding leak, sort=recency, cursor pagination contract, Zod empty-query, detail returns chunk + neighbour nulls, detail 404 missing/cross-project/cross-workspace) + `kb-search.service.spec.ts` (11 tests: embed call + raw SQL exec, audit PII redaction guard, empty result set 200, similarity clamping, sourceFileIds SQL param, empty-filter omits clause, minRelevanceScore post-filter, embedder failure → ServiceUnavailable + audit failure row, wrong-dim throws, workspace_id WHERE clause asserted). **311/311 full BE suite**. Typecheck + lint clean. After this PR: F19 Run Console search box + F30 KB browser get real ranked chunks; M2 RAG pipeline (TASK 3 Thu) builds on this.

### Fixed — Day 10 M1 close ceremony (2026-05-05)

- **`fix(web)`** — **F27 `/admin/users` 404 resolved (followup ab).** Root cause: `apps/web/lib/api/users-api.ts` called `fetch('/api/users', ...)` with a **relative URL**, routing to the Next.js dev-server (port 3000) instead of the NestJS backend (port 3001). In production (static Cloudflare Pages export) the same relative URL would also miss the Render API with no proxy rule in place. **BE wiring was already correct** — `UsersController` in `UsersModule.controllers[]` + `UsersModule` in `AppModule.imports[]` — so no BE changes needed. Fix: added `API_BASE = (NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001').replace(/\/$/, '')` constant to `users-api.ts`; all three fetchers (`fetchAdminUsers`, `patchUserRole`, `patchUserStatus`) now construct absolute URLs — identical pattern to `apps/web/lib/auth/client.ts`. Default to `http://localhost:3001` in local dev; Cloudflare Pages env var points to Render in production.

### Added — Day 11 M2 staging deployment artifacts (2026-05-06 — TASK 1)

- **`docs(adr)` + `feat(deploy)`** — **M2 staging deployment toolkit lands as P0 unblock for Sat 9 May M2 close.** Five artifacts so Yogesh can stand up `qa-nexus-api-staging` with one Blueprint apply + ~10 min of env-var fill: (1) **`docs/architecture/adr-011-m2-staging-deployment.md`** — full decision doc for the staging environment topology (Render Free `qa-nexus-api-staging` + Neon Free `qa-nexus-staging` + UptimeRobot keep-alive on `/health` 04:30-16:30 UTC). Documents the env-var manifest (28 distinct vars across providers — Postgres × 2, BetterAuth × 4, LLM × 3, SMTP × 9, R2 × 6, embedding × 1, OTel × 3), the build pipeline (install → rebuild sharp → build shared → build api → `prisma migrate deploy` baked in so M2 KB schema additions ship safely on every deploy), 4 alternatives considered + rejected (single-environment reuse, Fly.io free [256 MB RAM ceiling rejected], Railway free [credit-clock conflicts with Hard Rule 1], self-host with ngrok [URL rotation breaks magic-link callback]), and 4 mitigation actions (Blueprint-first deploy, smoke-test gate, audit verify nightly, followup `(ae)` for production deployment topology at M3). Cross-references ADR-004 (original M0 deploy), ADR-007 (cookie domain `.qanexus.iksula.com`), ADR-008 (Gmail SMTP). (2) **`render.yaml`** — extended (NOT replaced — preserves the original `qa-nexus-api` M0 service block from MS0-T011) with a SECOND service block `qa-nexus-api-staging` configured for region oregon (closer to Neon us-east-2 than the M0 singapore service — ~80ms RTT vs ~200ms), `pnpm install --frozen-lockfile && pnpm rebuild sharp` (Day-4 hotfix carries over for sharp's native binary on Render Linux x64), `prisma:migrate:deploy` baked into build, `BETTER_AUTH_SECRET` auto-generated via `generateValue: true`, `BETTER_AUTH_COOKIE_DOMAIN` left unset for `*.onrender.com` initially (auth.config.ts's localhost guard handles it correctly; only set to `.qanexus.iksula.com` after custom-domain DNS swap), 13 secret env vars marked `sync: false` for Yogesh-fill via dashboard. (3) **`scripts/smoke-test-render.sh`** — bash post-deploy smoke test, exits 0 on all-pass / 1 on any-fail / 2 on misconfiguration. 7 checks in ~5 seconds: `/health` HTTP 200 + parseable JSON + valid status field, `/health.db.status === up` (Neon connection live), `/health.embedding.status` is `up` OR `deferred` (NOT `down`), LLM gateway path responds non-5xx (501 deferred OK pre-F26), `POST /api/auth/sign-in/magic-link` is wired (non-5xx response — 200/400/422/429 all prove route mounted), `/api/users` returns 401/403 (RBAC guard active), `/health` response time < 5s (catches cold-start regressions). Saves health body to `/tmp/qa-nexus-health.json` for forensics on failure. (4) **`docs/deploy/render-runbook.md` Day-11 amendment** — appended ~155-line section with 7 numbered steps Yogesh follows: create Neon staging Postgres project (us-east-2, pgvector extension SQL), apply Render Blueprint via dashboard (only check the staging service for new creation; M0 service is unchanged), fill 13 sync:false env vars (table with sources + which dashboard to grab them from), manual redeploy after env fill, run smoke-test script, add UptimeRobot monitor (5-min interval, 04:30-16:30 UTC window, same Slack alert), DNS swap-in deferred to M3. Includes 5-item acceptance gate checklist for "GREEN" status. (5) **`apps/api/.env.example`** — added `BETTER_AUTH_COOKIE_DOMAIN` (with M1 T021 + ADR-007 cross-reference + production/staging/localhost guidance) + `ADMIN_SEED_EMAIL` (default `yogesh.mohite@iksula.com` per CLAUDE.md "Iksula data canon", documents Day-0 auto-promote behavior + closes followup `(x)`). **No code changes** — pure deploy artifacts. **No CI risk** — `render.yaml` Blueprint changes don't trigger CI; only the M0 `qa-nexus-api` service redeploys on push to main, and its config is byte-identical to the pre-PR state. After this PR + Yogesh's ~30-min Render/Neon dashboard work: `qa-nexus-api-staging` live, FE+1 unblocked for Pattern B real BetterAuth wiring, M2 RAG pipeline can be exercised against real pgvector HNSW indexes, M2 close ceremony Sat 9 May has a real audit_log to verify.

### Added — Day 9 M1 close prep (2026-05-05)

- **`feat(api)` + `docs(milestones)`** — **M1 close-ceremony toolkit lands ahead of Wed 6 May ceremony.** Three deliverables Yogesh-spec'd in the Day-9 PM brief: (1) **`apps/api/test/m1-close/rbac-sweep.e2e-spec.ts`** — comprehensive RBAC sweep tagged `[@M1-CLOSE-GATE]` for MAIN's grep filter (`pnpm --filter @qa-nexus/api test:e2e -- -t "@M1-CLOSE-GATE"`). 54 tests in 5 describe blocks: (a) endpoint matrix — every M1 role-gated endpoint × all 4 roles (Admin/Lead/QAEngineer/Stakeholder), with Allow/Deny pinned against the `@Roles` decorator (UsersController × 4 + InvitationsController × 5 = 9 endpoints × 4 roles = 36 matrix assertions); (b) cross-workspace isolation markers (3 contracts: users 404, doc 404, LLM-config 400 — pinned by per-service specs); (c) audit log HMAC chain integrity (8 tests synthesizing 22 chained M1 audit actions: workspace_created, day0_admin_seeded, magic_link_sent, sign_in_succeeded, invitation_created/email_sent/accepted/revoked, user_role_changed, user_status_changed, project_created, project_member_added/role_changed, llm_provider_config_changed, kb_chunks_generated/embedded, kb_document_orchestration_started/completed/failed, rbac_denied, sign_out, audit_chain_verified — verified end-to-end + tamper-detected at row 5 + reordered-rows-detected + canonical-JSON key-order independence + PII-redaction guard caught a real synthetic-row schema bug surfacing a `actorEmail` leak that's now corrected to `actorId` UUID matching real `audit_log` schema); (d) Day-0 admin seed pin (3 contract markers); (e) magic-link flow contract (4 contract markers — 600s TTL, `.qanexus.iksula.com` cookie domain, `nextCookies()` LAST in array, `trustedOrigins` includes both subdomains). All 54 pass against an empty DB — no live Postgres needed; service behavior pinned by per-controller specs. (2) **`scripts/verify-audit-chain.ts`** — standalone HMAC chain verifier for the live `audit_log` table, runnable via `pnpm --filter @qa-nexus/api verify:audit` (added as npm script with inline `--compiler-options` so root-level script bypasses apps/api's `module: NodeNext` tsconfig). Sweeps every workspace + every row ordered by `createdAt asc`, recomputes `HMAC_SHA256(BETTER_AUTH_SECRET, prev_hash || canonical(payload))` per row, exits 0 on chain-OK + 1 on first break with full debug context (workspace_id, row_id, action, expected vs actual hashes, plus diagnosis of whether failure was `prev_hash` mismatch (out-of-order/deleted prior row) vs `this_hash` mismatch (payload tampered post-insert)). Flags: `--workspace <uuid>` (single-workspace mode), `--since <ISO-8601>` (skip pre-checkpoint rows + accept first row's prev_hash as baseline since prior chain not loaded), `--quiet`, `--json` (machine-readable for CI parsing). Mirrors the canonical-JSON algorithm from `apps/api/src/audit/audit-helper.ts` byte-for-byte so MAIN's Wed-ceremony chain verification gives the same answer the production write path produced. (3) **`docs/milestones/m1-close-report-template.md`** — fillable template for MAIN's Wed close report. 10 sections: dates+duration, PRs landed (with `gh pr list` command), test counts + coverage delta vs M0 baseline (213 BE unit / N FE), frames live in production (10 named M1 frames + count of N/41 from `PM1_UI_v2/`), acceptance gates status (RBAC sweep / audit chain verify / Day-0 admin seed / 9 other binary gates), carry-overs to M2 (followup table snapshot), free-tier quota usage (8 providers — Render/Neon/R2/GitHub Actions/Groq/Gemini/Gmail/Cloudflare Pages with usage + headroom + canonical query commands), notable wins, notable misses, sign-off table (Admin/Lead/MAIN). Each `<FILL>` marker is a required field; each "→ command:" line is the canonical command MAIN runs to extract the data. Modeled on `docs/milestones/M0_completion_report.md` precedent. **Total impact:** 296 → 350 BE jest tests (+54 net new in 1 e2e suite); typecheck + lint clean; no schema change; no migration; standalone verify script ships as npm-runnable. After this PR + Wed close ceremony: M1 sealed with verifiable chain integrity + traceable PR provenance + acceptance-gate audit trail.

### Added — Day 9 ADR-007 cookie-domain decision (2026-05-05)

- **`docs(adr)`** — **ADR-007 filed: cookie domain — wildcard parent over exact-domain for cross-subdomain BetterAuth sessions.** Documents the decision to set `crossSubDomainCookies.domain: '.qanexus.iksula.com'` so the session cookie set by `api.qanexus.iksula.com` on the magic-link callback is also visible to `app.qanexus.iksula.com` for FE middleware route guards. Strategy A (exact-domain default + per-fetch `credentials: 'include'`) was rejected because it adds CORS preflight latency to every state-changing call + makes the FE middleware unable to read the session cookie without an API round-trip. Strategy B (wildcard parent) wins on UX + edge-readable session. CHIPS compliance via `defaultCookieAttributes.partitioned: true` (Chrome 118+ requirement for wildcard parent-domain cookies). `SameSite: 'lax'` (NOT `strict`) required for the magic-link callback cross-site GET from Gmail. **CRITICAL discovery from research:** Next.js 15 App Router REQUIRES the `nextCookies()` plugin from `better-auth/next-js` — without it, auth functions invoked from Server Actions silently fail to set cookies (BetterAuth issue #4038). Plugin must be LAST in the array per BetterAuth docs. **Magic-link TTL: 10 minutes** (matches FE copy in F06 Sign In + industry standard for unauthenticated callbacks; corporate Gmail latency ~5s observed at Iksula leaves comfortable margin). Four alternatives considered + rejected (exact-domain + per-fetch credentials, JWT-in-Authorization-header, separate session per subdomain UX rejected by Yogesh, CDN-edge-worker proxy adds operational complexity). **Followup `(aa)`** filed for parent-zone migration plan if pilot expands beyond `qanexus.iksula.com` (PM2 trigger). Cross-references: ADR-008 (sister email transport ADR), `apps/api/src/auth/auth.config.ts` (T021 PR will implement), `docs/SECURITY.md` (cookie domain trust boundary, T021 PR will amend), CHIPS spec, BetterAuth issue #4038. **No code in this PR** — this is the architecture decision; implementation lands in T021 PR (gated on this merging first).

### Added — Day 8 M2 upload-completion orchestrator (2026-05-04 — Step 7)

- **`feat(api)`** — **`UploadOrchestratorService` + `POST /api/admin/kb/finalize-upload` (Admin-only).** Step 7 of M2 closes the two-call pattern from Steps 5 + 6 (PR #34 chunking + PR #39 embedding) by wrapping both stages into a single upload-completion entry point. New service at `apps/api/src/kb/upload-orchestrator.service.ts` runs: (1) audit `kb_document_orchestration_started`; (2) `R2Service.getObject(r2Key)` → 404 on miss with stage='r2_fetch' audit; (3) `ChunkingService.chunkDocument()` → re-throws BadRequest/NotFound with stage='chunking' audit; (4) `KbEmbeddingService.embedDocument()` → wraps as 500 with stage='embedding' audit (chunks remain valid + retryable via `POST /api/admin/kb/embed-document`); (5) audit `kb_document_orchestration_completed` with chunk_count + embedded_count + total_duration_ms. **Failure semantics:** chunking failure short-circuits embedding; embedding failure leaves intact `kb_chunks` rows so caller can retry without re-chunking (the Step-6 `WHERE embedding IS NULL` filter picks them up). **Audit chain:** every call emits a `started` row pre-flight + either `completed` (success) OR `failed` (with stage + truncated reason ≤500 chars). Audit-write failure during the `failed` row does NOT mask the original error (logged then swallowed). Synchronous response carries chunking + embedding results so the FE can render terminal state in the upload modal without polling — M2 pilot uploads are ≤50 chunks (~3-5s wall-clock incl. cold-load), so blocking is acceptable; non-blocking WebSocket push deferred to a follow-up. Body shape `{ documentId, fileName, r2Key }` is intentionally identical to Step 5's `chunk-document` so callers porting from the two-call pattern just change the URL path. **No new schema** — TB-018 already covers chunks. New `KbModule` providers: `UploadOrchestratorController` + `UploadOrchestratorService`; `KbModule.imports` adds `ChunkingModule` + `StorageModule` (was: AuthModule only). Zod schemas in `packages/shared/src/schemas/kb.ts` (extended): `FinalizeUploadRequest` + `FinalizeUploadResponse`. **Tests:** 8 jest in `apps/api/src/kb/__tests__/upload-orchestrator.service.spec.ts` (happy path with full audit-chain assertion, R2 fetch failure → 404, chunking failure stage audit, cross-workspace document 404 propagation, embedding-after-chunking failure → 500 wrap, audit reason 500-char truncation, audit-failure-doesn't-mask-original-error, security: file bytes + vectors absent from audit payloads). 287/287 full suite (was 279 post-Step-6; +8 net new). After this PR: Steps 5 + 6 endpoints (`chunk-document`, `embed-document`) remain available as ops/debug entry points for manual re-runs; the canonical happy path is now `finalize-upload`.

### Added — Day 9 magic-link Pattern A scaffold (2026-05-05)

- **`feat(web)`** — F06 sign-in refactored from password to BetterAuth-style magic-link UX. 4 view states (initial / submitting / sent / error toast). New `<AuthProvider>` + `useAuth()` with localStorage stub backend (storage key `qa-nexus.auth.stub-user.v1`); BetterAuth flip target post BE T021 + ADR-007 (afternoon Pattern A→B PR). No custom verify page on the FE — BetterAuth owns `/api/auth/magic-link/verify` internally + redirects via `callbackURL` per the magic-link plugin contract.
- **Magic-link expiry copy locked at 10 minutes.** FE shows "valid for 10 minutes" in two surfaces (initial-state helper + sent-state copy). **Action item for BE+1 T021 config:** align `magicLink({ expiresIn: 60 * 10 })` (currently planned 15-min slot needs trim to 10 min so FE/BE copy match). Single source of truth: 10-min cap, no FE override.
- **Resend help-text bug fix** in PR #42 visual-gate review: changed "wait 30 seconds and resend" → "wait a moment and resend" to remove the 30s-vs-60s contradiction (button itself stays at 60-s lockout).

### Added — Day 8 M2 embedding service (2026-05-04 — Step 6 + Part D)

- **`feat(api)`** — **`KbEmbeddingService` + `POST /api/admin/kb/embed-document` (Admin-only).** Step 6 of M2: populates `kb_chunks.embedding` (vector(384)) for chunks emitted by the Step-5 chunking service (PR #34). New service at `apps/api/src/kb/embedding.service.ts` orchestrates: (1) verify document exists + workspace matches → 404 if not (cross-workspace = 404, no leak); (2) raw SQL `SELECT id, chunk_text, chunk_index FROM kb_chunks WHERE document_id = $1 AND embedding IS NULL` (Prisma's typed client can't reference the `Unsupported("vector(384)")` column in WHERE filters); (3) batch through `EmbeddingService.embedBatch()` — single WASM bridge crossing for all chunks vs N serial calls (materially faster at the 50-chunks-per-doc M2 baseline); (4) write back via raw SQL `UPDATE kb_chunks SET embedding = $1::vector` per row inside a single Prisma `$transaction` (per-row binding because pgvector array literals need the dim baked in — bulk VALUES optimization deferred to M3 if throughput demands it); (5) synchronous `kb_chunks_embedded` audit row with embedded_count + total_chunks + already_embedded + embedder_status (modelId/warm/loadDurationMs) + actor_email — payload INTENTIONALLY omits chunk_text + raw vectors (pinned by security test). **Idempotency:** the `WHERE embedding IS NULL` filter makes re-running on an already-embedded document a no-op (returns `embeddedCount: 0, noop: true`); audit still written for forensics. **Bundled fix:** `apps/api/src/embedding/embedding.service.ts` had stale `EXPECTED_DIM = 1024` + `DEFAULT_MODEL_ID = 'Xenova/bge-large-en-v1.5'` left over from before the Day-5 vector(384) migration (0002_vector_384_dim.sql); Step 6 corrects both to 384 + `Xenova/bge-small-en-v1.5` so `embed()` no longer throws on real model output. Memory guard map already had `bge-small` listed (~33 MB), so the Render Free 512 MB load path is unchanged. Also added `EmbeddingService.embedBatch(texts)` for efficient multi-chunk embedding (slices flat Float32Array output into per-text views, copy via `.slice()` to avoid aliasing). **No new schema** — `KbChunk.embedding` (TB-018) covers it; no migration 0006 needed. Cross-workspace document → 404 (no leak). New module: `KbEmbeddingController` + `KbEmbeddingService` registered in `KbModule.controllers/providers/exports`. AppModule already wires KbModule (PR #30) so no AppModule edit needed. Zod schemas in `packages/shared/src/schemas/kb.ts` (extended): `EmbedDocumentRequest` + `EmbedDocumentResponse`. **Tests:** 10 jest in `apps/api/src/kb/__tests__/embedding.service.spec.ts` (happy path × 2: full + partial-already-embedded; idempotent no-op; 404s × 3: missing/cross-workspace/no-project; 400 no-chunks; embedder dim mismatch; embedder unavailable propagation; security/PII redaction in audit). 279/279 full suite (was 269 post-Part-A; +10 net new). Update to `apps/api/src/kb/README.md` documents the new endpoint + Step 5 → Step 6 → Step 4-search workflow.

### Added — Day 8 ADR-010 PDF parser choice (2026-05-04 — Part C)

- **`docs(adr)`** — **ADR-010 filed: pdf-parse over pdfjs-dist for the M2 chunking service.** Documents the deviation from the implicit canonical PDF parser (`pdfjs-dist`) introduced by PR #34 (Step 5 chunking). Decision: `pdf-parse@^2.4.5` (canvas-stripped wrapper around the same `pdfjs-dist` text-extraction core). Rationale: `pdfjs-dist` pulls `canvas` as a peer dep — a heavy native module (~120 MB installed; ~40-80 MB resident) that would push the BE service from M1-Day-7's ~340 MB baseline to ~400-420 MB on Render Free's 512 MB ceiling, leaving <100 MB headroom for request bursts (recreating the Day-4 bge-large OOM condition). The chunking service NEVER renders PDFs to images — it only needs `getTextContent()`, which `pdf-parse` exposes without the canvas dependency. Same text quality, ~6 MB install footprint vs ~140 MB. Tradeoffs: `pdf-parse` is small-team-maintained vs Mozilla-backed pdfjs-dist (longer bug-fix latency); pinned to `^2.4.5` to prevent silent semver-major bumps; M2.5 re-eval gate filed as followup `(z)`. Cross-references: ADR-003 (same 512 MB constraint motivated bge-small swap), ADR-009 (sister native-binary handling), ADR-004 (Render Free dyno specs). Five alternatives considered + rejected: pdfjs-dist+canvas, pdfjs-dist --no-canvas (no such flag), pdf2json (sporadic maintenance), Cloudflare Worker offload (operational complexity), defer-PDF (would push to M3). Hard Rule 1 ($0/month cost gate) was the binding constraint — Render Hobby ($7/mo) would have absorbed the canvas overhead but was not approved.

### Added — Day 8 Part A users Zod schema publication (2026-05-04)

- **`feat(shared)`** — **FE-friendly user schemas published in `packages/shared/src/schemas/user.ts`** to unblock FE+1's F27 Pattern A→B real wiring (currently PAUSE-marker'd in PR #28 scaffolding). Five new exports layered on top of existing M1 Day-6 PM internals: (1) `UserListResponse` — superset of `ListUsersResponse` with optional `pagination` envelope (pilot has 8 users, server-side pagination lands in M3); (2) `PaginationMeta` — `{ total, page, pageSize }` with `pageSize ≤ 200` hard cap; (3) `UserCreateRequest` — minimal F27 invite form `{ email, name, role }` mapping to `POST /api/invitations` (BE service expands to `CreateInvitationInput` with `projectScopeJson=[]` + `expiresInHours=168`); (4) `UserUpdateRequest` — partial `{ role?, disabledAt? }` with `.refine()` enforcing at least one field set, BE splits to `PATCH /api/users/:id/role` vs `/status` based on which key is present; (5) `InvitationCreateResult` + `UserInviteResponse` — formal names for what `InvitationsController.create()` returns (plaintext token surfaced ONCE for FE magic-link URL construction). **Naming note:** `UserPublic` (type) + `UserPublicSchema` (const) already exist as the auth-internal "stripped passwordHash" variant; canonical FE-facing user record is `UserDetailItem` (already exported, M1 Day-6 PM) — FE+1 imports that directly. `apps/api/src/users/users.controller.ts` already uses shared schemas (`ListUsersQuery`, `ChangeUserRoleInput`, `ChangeUserStatusInput`) — no inline Zod, no refactor needed. Tests: 27 jest (UserListResponse × 5, PaginationMeta × 3, UserCreateRequest × 4, UserUpdateRequest × 6, InvitationCreateResult × 4, UserInviteResponse × 3, UserListItem sanity × 2). Tests live in `apps/api/src/users/__tests__/shared-user-schemas.spec.ts` because `packages/shared` has no jest runner (test script is a `node -e exit(0)` shim). 269/269 full suite (was 242 pre-Part-A; +27 net new). After merge: ping FE+1 — F27 Pattern A→B unblocked, connection-flip recipe in PR #28.

### Added — Day 8 M2 chunking service (2026-05-04 — Step 5)

- **`feat(api)`** — **`ChunkingService` + `POST /api/admin/kb/chunk-document` (Admin-only).** Parses uploaded source files (PDF / XLSX / CSV / TXT/MD) into `KbChunk` rows. Per-format parsers in `apps/api/src/chunking/parsers/`: `pdf-parser.ts` uses `pdf-parse@^2.4.5` (PDFParse class API; chose pdf-parse over the originally-spec'd `pdfjs-dist` because pdfjs pulls `canvas` as a peer dep — heavy native module that risks recreating the Day-4 bge-large 512MB OOM on Render Free; pdf-parse is a thin wrapper around the same pdfjs core text extraction without canvas; same quality, fraction of memory). `xlsx-parser.ts` uses SheetJS Community Edition (`xlsx ^0.18`) — per-sheet, 25-row groups, header repeated in each chunk for embedding context. `csv-parser.ts` uses `csv-parse/sync` — same 25-row grouping. `txt-parser.ts` is also the MP4-transcript parser (Step 7's upload pipeline pre-extracts transcripts to `.txt`). All parsers target ~2000 chars (~500 tokens at 4 chars/token, matching ERD §5 budget). Chunk metadata stamps `pageNo` (PDF only; null for non-paginated formats) + `lineRange` (1-indexed inclusive) + `sheet` (XLSX only). **Idempotency:** atomic `delete-then-insert` in a single Prisma transaction leverages the existing `(documentId, chunkIndex)` unique constraint on `kb_chunks`; re-running on the same file produces deterministic chunkIndex sequence (chunkIds regenerate per run by design — Step 6's embedding write uses fresh chunkIds). **Audit (chain-binding):** `kb_chunks_generated` row written synchronously with `{document_id, format, source_file_name, chunk_count, first_chunk_preview_chars, actor_email}`. **No new schema** — `KbChunk` (TB-018) covers it; no migration 0005 needed. **Embedding generation deferred to Step 6** (next PR; @xenova/transformers per ADR-003). Cross-workspace document → 404 (no leak). Bonus: `R2Service.getObject(key) → Buffer` helper added for server-side fetching (chunking pulls source file bytes from R2). Zod schemas in `packages/shared/src/schemas/kb.ts`: `ChunkDocumentRequest` + `ChunkDocumentResponse`. Wired into `AppModule.imports` as `ChunkingModule`. **Tests:** 29 jest (16 parser-direct: detectFormat × 9, parseTxt × 4, parseCsv × 5, parseXlsx × 4 + 13 service: happy path + 400 unsupported format + 404 missing/cross-workspace/no-project doc + 400 empty file + idempotency-pin + parser dispatch). 242/242 full suite (was 213 pre-Step-5; +29 net new = chunking).

### Added — Day 8 FE Phase 3 retrofit MVP batch (2026-05-04 — Step 6)

- **`feat(web)`** — **PR #31 squash-merged at `9622bd9`** — Phase 3 retrofit MVP batch: SYS-1 + SYS-8 + SYS-6 + SYS-7 + F14-2 violet sweep. Drift fixes from Claude Design Phase 3 retrofit memo (`PM1_UI_v2/Redesign Frame by claude design/2026-05-03-phase-3-drift-retrofit-memo.html`) applied across `apps/web` system-level styles + the F14 family ports. **Yogesh visual gate PASSED** (320 + 1440 px screenshots committed under `docs/screenshots/phase3-retrofit/`). All 7 CI checks green. Unblocks downstream F15 React port (Pattern A scaffold) on the FE+1 next-shifts queue.

### Changed — Day 8 small ceremony PRs (2026-05-04)

- **`chore(claude)`** — **PR #27 squash-merged at `f83585c`** — Removed two `PM1_UI_v2/**` Edit/Write deny lines from `.claude/settings.json` to unblock FE+1's Phase 3 retrofit (the retrofit memo + redesign reference files live under `PM1_UI_v2/Redesign Frame by claude design/` and FE+1 needs Edit access to apply locked-HTML side fixes per the retrofit playbook). 2-line config delete; 6 of 6 CI checks green (E2E path-filter excludes config-only PRs).
- **`feat(web)`** — **PR #28 squash-merged at `250bd66`** — F27 Pattern A→B scaffolding: `QueryProvider` + `use-admin-users` hook scaffolded (stub data only; no real API call yet — wired to be flipped to live BE endpoints once the users Zod schema is published in `packages/shared/src/schemas/users.ts`). All 7 CI checks green. F27 page now ready for the connection-point flip downstream.

### Added — Day 8 M1.5 LLM provider config persistence (2026-05-04 — Step 3)

- **`feat(api)`** — **GET + PUT `/api/admin/config/llm-providers` (Admin-only RBAC + audit, F26 consumer).** Two endpoints under new `LlmConfigController` (`apps/api/src/admin/llm-config/`). GET returns workspace's full LLM picture: registered providers (TB-019) + their model catalog (TB-020) + agent×role routing assignments (TB-021), all joined and projected. **API-key ciphertext NEVER leaves the service** — response carries only a derived `hasApiKey: boolean`. Pinned by a redaction test. PUT replaces the workspace's routing assignments wholesale in a single `delete-all + insert-all` Prisma transaction; validates duplicate `(agentKind, role)` pairs (400) and cross-workspace `modelPk` escalation attempts (400). On Prisma P2002 race (concurrent Admin updates), surfaces 409. **Audits `llm_provider_config_changed`** with old + new assignment counts + new routing **shape** (`agentKind` + `role` only, NOT `modelPk` values — keeps audit rows small). Returns freshly-updated state in PUT response so F26 doesn't need a follow-up GET. **No new schema** — existing TB-019/020/021 cover the surface; no migration 0004 needed. Zod schemas in `packages/shared/src/schemas/llm.ts` (extended): `LlmProviderConfigItem`, `LlmAssignmentItem`, `LlmProviderConfigResponse`, `PutLlmProviderConfigRequest`. Module wired into `AppModule.imports` as `LlmConfigModule`. API-key onboarding + rotation NOT in this surface — lives on a separate future endpoint (`POST /api/admin/config/llm-providers/:id/key`) so a single PUT can never accidentally clobber a key. Tests: 8 jest (api-key redaction, hasApiKey derivation, workspace-scoping, atomic replace, dup-pair 400, cross-workspace pk 400, Prisma P2002 → 409, actor_email in audit). 195/195 full suite (was 187 baseline pre-Step-3; +8 net new).

### Changed — Day 8 PM warmup deferral docs (2026-05-04)

- **`docs(adr,followups)`** — **ADR-008 §6 amended + followup `(x)` filed: warmup deferred to Day-9 post-T021 magic-link wiring.** Bootstrap gap discovered Day-8 PM: warmup test needs Admin session cookie which only the BetterAuth magic-link flow can produce; magic-link itself depends on SMTP working (the very thing we're testing). Cleanest fix is during T021 magic-link wiring on Day-9 — proper Day-0 admin seed mechanism (followup `(x)`, recommended option: `pnpm admin:seed-session` CLI) + real login flow → session cookie → fire warmup naturally. Risk accepted in the ~24-48h interim: Gmail SMTP code in production but unverified for real outbound delivery. Acceptable for pilot scale (8 internal users; no automated invitation sends until Day-9+). Yogesh can optionally fire warmup curl pre-T021 with manually-injected session token. ADR-008 §6 status flips from "DEFERRED" to "VERIFIED" once warmup succeeds Day-9+.

### Added — Day 8 M2 chunk-search contract scaffold (2026-05-04 — Step 4)

- **`feat(api)`** — **POST `/api/projects/:projectId/kb/search` + GET `/api/projects/:projectId/kb/chunks/:chunkId` (RBAC: Admin/Lead/QAEng/Stakeholder, STUBBED).** Wire shape locked NOW so FE can implement F19 search box + F30 KB browser against a stable contract while BE still returns demo `return_policy_v2.xlsx` fixtures from `apps/api/src/kb/kb.fixtures.ts`. Every response carries `stubbed: true` so FE can render a "demo data" banner. M2 swap is body-only — `kb.controller.ts` is the sole file that changes (replace fixture lookup with `EmbeddingService.embed(query)` → pgvector(384) HNSW → optional `LLMGatewayService.complete()` re-rank). Wire shape unchanged across the swap. **Real today:** Zod `KbSearchRequest` / `KbSearchResponse` / `Chunk` / `ChunkDetail` / `ChunkDetailResponse` / `ChunkSourceAttribution` schemas in `packages/shared/src/schemas/kb.ts`; sort+filter+cursor pagination semantics; RolesGuard mounted; `stubbed` flag. **Stubbed today:** 8 hardcoded chunks from one file (Iksula Returns canon — `return_policy_v2.xlsx`, `CHUNK-RET-####` deterministic UUIDs, realistic relevance distribution); keyword-overlap heuristic ranking; base64(offset) cursor. The 384-dim embedding is **server-side only — pinned by test that asserts `embedding` key never appears in response payloads**. `apps/api/src/kb/README.md` (~150 lines) documents real-vs-stubbed surface + M2 swap diff. Wired into `AppModule.imports` as `KbModule`. Tests: 13 jest (search + detail + shape contract + no-embedding-leak + keyword heuristic + filters + sort + pagination + 404). 205/205 full suite.

### Changed — Day 8 M1 Gmail SMTP wiring (2026-05-04)

- **`fix(shared)`** — **PR #26 amend.** `parseSmtpEnv()` signature changed to require `env` as a parameter (was defaulted to `process.env`). `packages/shared` is consumed by both `apps/api` (Node) and `apps/web` (Next.js client-side); referencing `process.env` would require `@types/node` in shared and couple the FE to a Node-only global. BE caller already passed `process.env` explicitly so call sites unchanged. Lesson banked: shared additions MUST not reference Node globals (process/Buffer/fs) or browser-only APIs (window/document) — refactor to inject the dependency. (Caught by MAIN's pre-merge review on PR #26 before squash-merge.)
- **`feat(api)`** — **Gmail SMTP via nodemailer (ADR-008).** Swapped `EmailService` transport from Resend SDK stub to Gmail SMTP (`@nestjs-modules/mailer` + `nodemailer ^8.0.7`). 9 env vars (HOST/PORT/SECURE/USER/PASSWORD/FROM_NAME/FROM_EMAIL/REPLY_TO/BCC_EMAIL) Zod-validated at boot via new `packages/shared/src/schemas/smtp-env.ts` (`parseSmtpEnv`). Zod failure → DEFERRED mode (logs body to stdout, never crashes the dyno). `SMTP_BCC_EMAIL=yogesh.mohite@iksula.com` silently BCCs every outbound for pilot tracking — recipient does NOT see this header (BCC is hidden by RFC). Single `sendInternal()` choke point ensures BCC + Reply-To wiring cannot be forgotten on a per-call basis. `SMTP_PASSWORD` redacted defensively from any error.message before reaching the logger. Public surface (`sendInvitation` / `sendMagicLink` / `sendPasswordReset` / legacy `send`) unchanged — InvitationsService callers don't touch. Driver: Day-7 IT block on Resend custom domain (6-8 week wait); Gmail bridge keeps pilot on schedule. Migration plan back to Resend documented in ADR-008 §4. Tests: 22 jest (mode detection × 6, template × 3, capture × 4, deferred × 1, real+BCC+graceful × 5, env-validation edge cases × 3). 192/192 full suite (was 187 baseline pre-Step-2). Acceptance gate: warmup email to `yogesh.mohite@iksula.com` (corrected — Day-8 brief overrode the stale `akshay@iksula.com` draft reference) per ADR-008 §6 — verify (a) inbox not spam, (b) BCC copy also lands at `yogesh.mohite@iksula.com`, (c) recipient headers do NOT show `Bcc:`. Halt rollout to remaining 6 pilot users if any check fails.

### Added — Day 7 M0 close ceremony — 5 PRs landed + M0 CLOSED (2026-05-03)

- **`feat(web)`** — **PR #21 merged at `68b3ac0`** — FE M1 prep: F27 Users & Roles + F27m1 Invite User Modal + F28 Settings & Audit admin frames + AdminGuard. Pattern A deferred routing, ADR-006 3-layer demo seeds. 27 files / +5039 / −10. All 7 CI checks green pre-merge. Branch `feature/fe-m1-users-roles` deleted. Merged 13:36 IST.
- **`feat(api)`** — **PR #22 merged at `af4bdf6`** — BE M1 backend: users + roles + invitations + project-scoped RBAC + audit query + email service (Resend SDK wrapper, real/deferred/capture modes). Schema delta: `User.disabledAt` + `User.roleChangedAt` (via migration `0003_users_disabled_at.sql`). Two-row audit pattern (`invitation_created` + `invitation_email_sent`) preserves chain integrity. Last-Admin guards on role/status mutations; project-scoped RBAC via `ProjectScopedRolesGuard`. T022 (email service) moved INTO M1 scope (was M1.5). T021 (BetterAuth magic-link wiring) DEFERRED to M1.5 pending Yogesh's cookie-domain ADR-007. Test gate: 187/187 PASS (was 120 baseline pre-M1; +67 net new across 17 suites). 32 files / +5531 / −41 on the merge.
- **`fix(ci)`** — **PR #23 merged at `57bddb38`** — drift D2 + Path δ observability. Two changes: (1) align `EMBEDDING_MODEL_ID` env var in `.github/workflows/e2e.yml` with ADR-003 amendment (`bge-large-en-v1.5` → `bge-small-en-v1.5`); (2) fix the broken `if: failure()` gate on `Tail server logs` step (continue-on-error: true on playwright was masking failure() from triggering) — switched to `if: always()` + added ps + free + df system snapshots. Diagnostic step is the reason we found the Postgres deficit at all; PR #24 followed within the hour.
- **`fix(ci)`** — **PR #24 merged at `fa56f70`** — Postgres CI service container (closes followup `(t)`). Adds `services: postgres:` block (`pgvector/pgvector:pg15` image; matches Neon free version). DATABASE_URL re-pointed to local container. New "Initialize Postgres + apply schema" step: pg_isready loop + `CREATE EXTENSION pgvector` + `prisma db push --skip-generate --accept-data-loss` (tolerant of future schema additions). Bonus: Start API step now exits 1 on /health timeout instead of silently exiting 0 (per followup `(t)` §6). Resolves the long-standing structural CI deficit previously hidden by `.skip` markers; unmasked by PR #22 adding new non-skipped tests in `tests/onboarding.spec.ts`.
- **`feat(web)`** — **PR #25 opened as Draft at `49cbbcc`** ([#25](https://github.com/yogeshmohite-iksula/QA-Nexus/pull/25)) — FE M2 prep: F14 Requirements list + F14m1 Edit/Add Requirement Modal + F14m2 Link Test Case Modal + F14m3 Convert to Jira Story Modal (all Pattern A deferred). 5 commits + 1 main-merge with lockfile reconciliation (sonner + vitest + @vitejs/plugin-react picked up from PR #21 merge). PR body references the 4 canonical Claude Design v2 references for the React port (F15 Knowledge Base v2 + F15 Mobile Breakpoints + Phase 3 retrofit memo + primitives-playground). Stays Draft per close-ceremony spec; not authorized for autonomous merge.
- **`feat(api)`** — **Migration `0003_users_disabled_at.sql` applied to Neon** ~22:15 IST by Yogesh via `pnpm --filter @qa-nexus/api prisma:apply-raw:0003`. `psql \d users` confirmed `disabled_at` + `role_changed_at` columns present. Public-URL smoke verified: `/health` → 200 (db up · embedding warm · r2 up · llm deferred); `/api/users` → 401 (RBAC clean, table reachable); `/api/audit` → 401 (same). Render auto-redeploy completed cleanly post PR #22 merge.
- **`docs(milestone-m0)`** — **M0 marked CLOSED 2026-05-03**. Status banner added to `Milestone_M0_Setup_v8.md`. Status tables updated in `01-pm1-execution-plan.md`, `02-milestones/M0-setup-infra.md`, `04-plan-vs-actual.md`. Final tally: **17 PASS / 0 FAIL / 2 DEFERRED** to M1.5 (AC007 LLM key UI · AC013 3rd Slack rule). AC012 footnoted-PASS (manual workflow_dispatch SUCCESS proves end-to-end pipeline; first scheduled cron drift on first activation noted).
- **`docs(milestones)`** — **M0 completion report** at `docs/milestones/M0_completion_report.md` (262 lines). Sections: scope summary, AC matrix (19 ACs with PASS/footnoted-PASS/DEFERRED + evidence), drift items D1-D7, open followups (a-u), free-tier quota at close, 102 commits over M0 window, **3 halt-to-root-cause patterns codified** (R2 token scope · ESLint config collision · CI Postgres deficit), M1 readiness gate. Sign-off section for Yogesh + Akshay.
- **`docs(claude)`** — **CLAUDE.md Hard Rule #3 updated** for 3-folder frame inventory post-supersede. New layout: `frame  html view/` (17 frames) + `frames - claude code build (PM1 v2.6-v2.8)/` (20 frames) + `Redesign Frame by claude design/` (4 v2 frames: F15, F16a, F16b, F16c — supersede the v1 originals removed today per Claude Design Phase 1 audit). Plus 3 supporting reference files (Mobile Breakpoints, primitives-playground, retrofit memo) — NOT in 41 count. 4 superseded HTMLs removed; 7 new redesign files committed.
- **`docs(followups)`** — **Followup `(t)` CLOSED** by PR #24. **Followup `(u)` filed** — P2 onboarding spec FE failures `:38` + `:44` (pre-existing, masked by `continue-on-error: true`; M1.5 sweep). **Followup `(v)` filed** — P3 systematic Phase-1 audit of remaining 37 locked frames (Claude Design + Yogesh, Wed 6 May reset onward).
- **`docs(eod)`** — Day-7 EOD amended post-close at `docs/eod-reports/2026-05-03-day-7.md` to reflect actual outcome (M0 CLOSED tonight, not deferred to Day 8). 4th halt-to-root-cause pattern added: **refined pre-merge gate rule** (compare PR vs main, only NEW failures gate; pre-existing inherited failures get filed as followups). Pattern: halt-to-escalate even on rules I wrote myself; rules can be wrong; evidence wins.
- **Acceptance gate (M0 close):** All 19 ACs measured; 17 PASS / 0 FAIL / 2 DEFERRED. Free-tier $0/month confirmed across all 9 services. Main HEAD pre-EOD-amend: `44b06ef`; further SHAs from tonight's housekeeping commits will close out the night.

### Added — Day 6 M1 Users + Roles + Email (2026-05-02 → 2026-05-03)

- **`feat(api)`** — **M1 Users & Roles milestone (T036 + T038 + T031.b + T022).** Closes M1 BE backend in a single PR bundling 5 commits (`6bf56ca`, `5d5dda4`, `61a97d1`, `0e9268f`, `bc08753`):
  - **Invitations** (`InvitationsService` + `InvitationsController` under `/api/invitations`): create / list / get / accept (public-by-token) / resend (rotates token + audits) / revoke. SHA-256-hashed tokens, plaintext returned ONCE for the magic-link URL. Two-row audit pattern (`invitation_created` + `invitation_email_sent`) preserves append-only chain integrity.
  - **Users** (`UsersService` + `UsersController` under `/api/users`): list / detail / change role (with last-Admin guard, no self-mutation) / change status (purges BetterAuth sessions on disable). Status DERIVED from `User.activatedAt` + `disabledAt` (no enum column).
  - **Project members** (`ProjectMembersService` + `ProjectMembersController` under `/api/projects/:slug/members`): list / add / role-override / remove. Uses `ProjectScopedRolesGuard` (effective role = `roleOverride ?? user.role`). Last-project-Admin guard counts both override-Admins and inherited workspace-Admins.
  - **Audit query + verify-chain** (`AuditController` under `/api/audit`): cursor-paginated workspace audit log (Admin/Lead) + HMAC chain re-verification (Admin only, 10K-row cap, returns `truncated=true` for larger workspaces).
  - **Email service** (`EmailService` + `apps/api/src/email/templates/invitation.ts`): Resend SDK wrapper with three modes (real / deferred / capture). High-level `sendInvitation()` / `sendMagicLink()` / `sendPasswordReset()`. Graceful Resend errors (caught + returned as `{messageId: 'failed-…', error}`, never thrown). T022 moved INTO M1 scope (was M1.5).
  - **Schema delta:** `User.disabledAt` + `User.roleChangedAt` columns via `apps/api/prisma/raw/migrations/0003_users_disabled_at.sql`. Apply via `pnpm --filter @qa-nexus/api prisma:apply-raw:0003`. Both columns nullable — no backfill needed.
  - **Audit redaction** pinned by tests: payloads carry email DOMAIN only (no local-part), never `passwordHash` / `tokenHash` / plaintext token / session token.
  - **Test gate:** 187/187 PASS (was 120 baseline pre-M1; +67 net new across 17 suites).
  - **Deferred to M1.5:** T021 BetterAuth wiring (session creation on invite-accept). Plan in `apps/api/docs/integrations/betterauth-invitations.md`.

### Added — Day 6 `docs/plans/` scaffold (2026-05-02)

- **`docs(plans)`** — Scaffolded `docs/plans/` as the **execution view** of the project (complement to the binding specs in `QA Nexus/PRD/`, `QA Nexus/ERD/`, `QA Nexus/PM1/`). Doc-only; no code/tests/migrations touched. 12 files landed (~2014 lines): `README.md` (folder purpose + methodology for re-runs); `00-project-overview.md` (PM1→PM4 view + tech-stack at a glance + Iksula canon + top-decisions log); `01-pm1-execution-plan.md` (PM1 scope IN/DEFERRED + M0→M6 timeline + 12-AC GA tracker + risks R1-R8 + 7 architectural patterns shipped Day-3/5 + 6 drift items D1-D6); `02-milestones/M{0..6}-*.md` (per-milestone plans, M0 pre-filled with Day-6 actuals 15 PASS / 2 AUTO / 2 DEFERRED / 0 FAIL, M1 IN PROGRESS, M2-M6 NOT STARTED placeholders); `03-drift-checklist.md` (generic Mn-close template, 20-row checklist); `04-plan-vs-actual.md` (living append-only delivery log, M0 baseline row pre-filled). `PROMPT_TEMPLATE.md` (pre-existing, authored by Yogesh) included unmodified — it is the reusable plan-mode prompt for PM2 plans + future re-runs. Methodology: Phase 1 discovery (parallel Explore agents) → Phase 2 web research (14 topics, May 2026 currency confirmed) → Phase 3 authoring (12 files) → Phase 4 cross-link + commit. Web-research findings surfaced inline as "Plan recommendation: consider X" notes — never silently swap stack. Notable findings: (1) Gemini 2.5 Flash free RPD may have been cut from 1500 → 250/day in Dec 2025 (M3 R1 + M3-D4 + M4-D3 track this); (2) `onnx-community/Qwen3-Embedding-0.6B-ONNX` is now available (Transformers.js 3.6.0) — migration path opens earlier than expected (M2-D2 + M3-D2 capture); (3) Neon was acquired by Databricks in 2025, free tier doubled to 100 CU-hr/mo post-acquisition (no migration trigger). All 53 real cross-folder `.md` references verified resolvable; 7 forward references to `../architecture/patterns.md` + `../architecture/adr-007-telemetry-pipeline.md` are intentional (both are M1-morning deliverables, explicitly labeled "forthcoming").

### Added — Day 6 T032 golden-set seeds (2026-05-02)

- **`feat(test)`** — T032 golden-set seeds committed to `final/`. Three sets covering the M0 R3 mitigation:
  - **A1 Scribe** (test-case generator) — 30 real CPI requirements with priority spread (Highest 6 / High (migrated) 8 / High 4 / Medium 8 / Low 2 / Minor 2). `apps/api/test/golden-sets/a1/final/cpi_requirements.json`. Real Iksula data, no synthesis.
  - **A2 Sentinel** (duplicate-bug detector) — 102 duplicate pairs in 2 difficulty tiers: 54 easy (recognizable pattern overlap) + 48 hard (reduced keyword overlap, indirect module names, multi-perspective descriptions). `apps/api/test/golden-sets/a2/final/easy.json` + `hard.json`. Codex-augmented from real CPI bugs (data augmentation, not pure fabrication).
  - **A4 Sherlock** (root-cause classifier) — 75 defects (50 real + 25 augmented), 62 valid L1-L5 tags + 13 SKIP. Two-tier composition: keys `CPI-###` (50 real) + `CPI-NEW-###` (25 augmented in same CPI domain — PIM workflows, NPI processes, ERP, DAM, RBAC, mail routing, SKU enrichment, PMG/SAG selection). Codex tagged on 2026-05-02 reading `rca` / `root_cause_corrective_actions` / `recent_comments`. Distribution: L1 6.5% / L2 3.2% / L3 46.8% / L4 30.6% / L5 12.9% — within expected sanity bands. Confidence: 52 high / 15 medium / 8 low. `apps/api/test/golden-sets/a4/final/cpi_postmortem_defects.json`.
- **`docs(test)`** — `apps/api/test/golden-sets/REVIEW_GUIDE.md` updated to reflect 75-item A4 set + new acceptance closure section. Methodology + provenance + eval-time filtering instructions documented.
- **Acceptance gate (T032 R3 mitigation):** A4 has 40+ valid L1-L5 tags. **PASS at 62/75.** M0 acceptance criterion AC for T032 satisfied.

### Added — Day 5 morning vector(384) schema migration (2026-05-01) ← (a) PR #20

- **`feat(api)`** — **MS0 last task: vector(1024) → vector(384) schema migration.** Per ADR-003 amendment + ADR-009 (Day-4 Render Free 512 MB OOM forced bge-large → bge-small swap; output dim drops from 1024 → 384). New `apps/api/prisma/raw/migrations/0002_vector_384_dim.sql` does the canonical DROP-HNSW → ALTER-COLUMN-USING-NULL → RECREATE-HNSW dance inside a single transaction. Tables empty at M0 (no real embeddings written yet — only stub seed) so `USING NULL` is safe. Runbook: `pnpm --filter @qa-nexus/api prisma:apply-raw:0002` (new npm script). Schema: `apps/api/prisma/schema.prisma` — `TestCase.embedding` and `KbChunk.embedding` flipped from `Unsupported("vector(1024)")?` to `Unsupported("vector(384)")?`, doc comments updated to point at the new model + ADR + migration file. Closes BE's last M0 deliverable.

### Added — Day 5 morning OTel SDK wire (2026-05-01) ← (b)

- **`feat(observability)`** — `llm.complete` span instrumentation in `LLMGatewayService.complete()` per `.claude/rules/api.md` binding rule. Wraps the entire routing + retry + fallback flow in a single span via `tracer.startActiveSpan('llm.complete', ...)`. Span attributes: `llm.input_tokens_estimate`, `llm.long_context_forced`, `llm.long_context_threshold`, `llm.has_secondary`, `llm.has_long_context` set at start; `llm.provider`, `llm.model`, `llm.prompt_tokens`, `llm.completion_tokens`, `llm.latency_ms`, `llm.fallback_triggered`, `llm.route_reason` set on completion. Span status `OK` on success, `ERROR` with recorded exception on failure. Body refactored into private `completeInternal()` to keep the span wrapper ergonomic. Tracer is no-op until OTel SDK init flips it (auto-routes to Grafana Cloud OTLP once env vars set on Render — no further code change needed). 84/84 jest tests still green.
- **`feat(observability)`** — `/admin/otel/test-trace` endpoint (Admin-gated, refuses in NODE_ENV=production unless `ALLOW_ADMIN_OTEL_TEST=true`). Emits a parent + child span (with simulated 50ms work) + a log record correlated by trace_id, returns the IDs + a Grafana Tempo search URL + a Better Stack search URL so ops can verify the OTel pipeline end-to-end after env-var changes without needing real traffic. New `ObservabilityModule` registered in `AppModule`.
- **`feat(observability)`** — `/health` enhanced with OTel diagnostics: `otel.traces.env_present` + `otel.logs.env_present` (boolean-only, never the actual value) so ops can verify env vars made it to the Render dyno without server-log access. Plus a `deferred_reason` field with admin-friendly text pointing at the runbook (e.g. `"GRAFANA_CLOUD_OTLP_ENDPOINT env var missing on this dyno. Set in Render env editor; redeploy. See docs/deploy/render-runbook.md."`).
- **`docs(followup)`** — Filed Day-6 todo: custom metrics SDK setup (MeterProvider + OTLPMetricExporter + embedding latency histogram + audit-log writes counter + LLM tokens counter labeled by provider/model). Skipped Day-5 because the no-op tracer already provides observability once env vars land; metrics adds value but isn't blocking.

### Added — Day 5 #4 Better Stack Slack alert pipeline (2026-05-01) ← (c)

- **`feat(observability)`** — `/admin/alerts/test-slack` Admin-gated endpoint (mirrors `/admin/otel/test-trace` pattern). Emits a single OTel log record at severity ERROR with a unique `test_marker` in the body. Better Stack alert rules pointed at Slack should fire on this event within ~30s. Returns the marker + a Grafana/Better Stack search hint + a `next_step` instruction. Refuses in NODE_ENV=production unless `ALLOW_ADMIN_OTEL_TEST=true`. Path (a) per Day-5 architectural decision: Better Stack OWNS the alerting (rule → webhook → Slack); the API just emits trigger events. Body refactored: `OtelTestController` now lives at `@Controller('admin')` so both `otel/test-trace` and `alerts/test-slack` share one mount.
- **`docs(deploy)`** — `docs/deploy/better-stack-runbook.md` extended with a full Slack alerting section (§7): Slack workspace prep, Better Stack ↔ Slack integration, three named alert rules with rate-limit rationale (`qa-nexus-error` 1/min · `qa-nexus-deferred-mode` 1/5min · `qa-nexus-oom-or-crash` 1/min), end-to-end verification via `/admin/alerts/test-slack`, sample payload for OOM + deferred-mode events, post-pilot tuning guidance.
- **`docs(security)`** — `docs/SECURITY.md` rotation table updated: replaced the outdated `OTEL_EXPORTER_OTLP_HEADERS` row with separate Grafana Cloud OTLP + Better Stack OTLP rows using current env var names (`GRAFANA_CLOUD_OTLP_AUTH` Basic auth + `BETTER_STACK_OTLP_AUTH` Bearer). Added new row for Slack incoming webhook URL (the URL itself IS the secret; rotation flow goes through Slack admin → Better Stack integration paste).

### Fixed — Day 5 #4 followup: lockfile regen + pre-push gate (2026-05-01) ← (d)

- **`fix(deps)`** — Regenerate `pnpm-lock.yaml` to match `apps/api/package.json` after Day-5 #4 (`e23d0d2`) added `@opentelemetry/api@^1.9.1` without a lockfile bump. Render's `pnpm install --frozen-lockfile` was rejecting with `ERR_PNPM_OUTDATED_LOCKFILE` → boot failed → `/admin/alerts/test-slack` endpoint + Better Stack Live tail were unreachable for ~10 min. Lockfile now in sync.
- **`ci(husky)`** — Add `pre-push` gate 2/3: `pnpm install --frozen-lockfile --lockfile-only`. Reads all workspace `package.json` files + verifies the lockfile satisfies them. Returns non-zero with a clear remediation message (run `pnpm install`, commit lockfile, retry) if drift detected. Fast (~2s on warm cache; lockfile-only skips actual install I/O). Renumbered existing gates: 1/3 typecheck (unchanged), 2/3 frozen-lockfile (NEW), 3/3 CHANGELOG guard (was 2/2). This catches the exact failure mode that bit Day-5 #4 — future deps edits can't ship without the lockfile in the same push range.

### Changed — Day 5 morning M0 spec amendments (2026-05-01)

- **`docs(spec)`** — Two amendments to `QA Nexus/PM1/PM1_milestone/M0/Milestone_M0_Setup_v8.md` to bring the binding spec in line with two architectural decisions made Day-4:
  - **MS0-T017 amended:** "Store in Render env vars" → "F26-UI-driven config (Admin enters via Settings UI in M1)." LLMGateway boots in deferred mode until F26 lands; tactical hotfix-2 already implemented graceful deferred boot. Keys never live in repo (unchanged from original).
  - **MS0-AC008 amended:** "1024-dim vector" → "384-dim vector" per ADR-003 Day-4 amendment. bge-small-en-v1.5 chosen for Render Free 512 MB compatibility (bge-large OOM'd at ~470 MB resident WASM on a 512 MB dyno). Hot-swap path back to 1024-dim via Cloudflare Workers AI free-tier endpoint OR Render dyno upgrade documented in ADR-003. Schema migration `vector(1024)` → `vector(384)` lands separately (BE-owned Day-5 work).

### Added — Day 4 EOD closure (2026-04-30 evening)

- **`docs(eod)`** — Day 4 EOD master report at `docs/eod-reports/2026-04-30-day-4.md`. Aggregates the cross-chat picture: 5-hotfix BE boot regression chain (NestOtelLogger → graceful boot → pnpm dup-key → sharp 0.33 → embedding memory guard), 2 PRs merged (#17 F09+F10 seed-cent + closes followup (i); #19 F12+F13 uploads), 6 dashboard services provisioned (Render + R2 + Resend + UptimeRobot + Grafana Cloud + Better Stack), ADR-009 + ADR-003 amendment, followup (i)+(j) closed, (k) NVIDIA Build dropped per Yogesh, (l)+(m) filed. Total infra cost still **$0/month** (Hard Rule 1 held).
- **`docs(followups)`** — Filed `(m)` R2 free-tier quota alert system. M1 user-facing: admin-only top-strip banner at 50/60/70/80/90/100% thresholds + per-project breakdown of bytes used (RET/CART/PAY/AUTH/OPS). BE cron service + FE banner + new `r2_quota_log` table schema + acceptance gate + cross-references. Honors Yogesh's explicit ask: "alert before money cut" (during R2 card-on-file step).
- **`docs(observability)`** — Consolidated Excel master at `docs/observability/QA_Nexus_Work_Log.xlsx`. Merges the prior `Token_Savings_Log.xlsx` (3 sheets) into the work-hours log (13 sheets), token sheets prefixed `Tokens — *`. Days 2/3/4 placeholder rows added to Development + All Sessions sheets (per-session granularity to be back-filled by Yogesh per his actual operating windows). Cover sheet annotated with consolidation note + new aggregator script reference.
- **`scripts`** — New `scripts/update-work-log.py` aggregator (8 KB Python, argparse, dry-run mode). Appends a session row to BOTH the per-phase sheet and the chronological sheet, preserves styling, validates inputs (date format, phase whitelist, hours range, files ≥0). Single canonical source-of-truth path: `docs/observability/QA_Nexus_Work_Log.xlsx`.

### Removed — Day 4 EOD closure (2026-04-30 evening)

- **`docs(observability)`** — Deleted `docs/observability/Token_Savings_Log.xlsx` (data merged into the consolidated `QA_Nexus_Work_Log.xlsx` master per the closure entry above).

### Fixed — Day 4 afternoon hotfix-5 (2026-04-30)

- **`fix(api)`** — Pre-flight memory guard added to `EmbeddingService.checkMemoryHeadroom()`. Trigger: hotfix-4 successfully loaded sharp's native binary, but bge-large-en-v1.5 (~470 MB resident WASM) + NestJS baseline + Prisma + R2 + LLM gateway = ~520 MB on Render Free's 512 MB dyno → OOM crash loop every ~2 min. Tactical fix: Yogesh swapped `EMBEDDING_MODEL_ID` env to `Xenova/bge-small-en-v1.5` (33 MB resident, MTEB avg 62.17 vs 64.23 = −2.06 pt). Structural fix: pre-flight guard refuses to load when `MODEL_MEMORY_MB[modelId] > heapLimit × 0.7`, logs a clear warning + stays in deferred mode instead of crashing the pod. New table `MODEL_MEMORY_MB` in `embedding.service.ts` lists known model footprints (extend after measuring new models). Unknown models allowed-with-warning so we don't block forward progress on unmeasured ones. 3 new regression tests (`embedding-graceful.spec.ts`): refuses bge-large on 512 MB, allows bge-small on 512 MB, allows unknown models with warning. **84/84 jest green** (was 81, +3).
- **`docs(architecture)`** — **ADR-003 amended** with the Day-4 afternoon Render Free RAM constraint: bge-small chosen for M0 pilot, bge-large remains future-target when off Free tier. Documents the schema impact (vector(1024) → vector(384) migration needed before A1 Scribe writes first real embedding), the hot-swap path back to bge-large via Cloudflare Workers AI / Render One-Off Job / dyno upgrade (with cost-gate caveat), and references the new pre-flight memory guard.
- **`docs(followups)`** — Filed `(l)` Embedding model quality eval — bge-small vs bge-large at A1 Scribe retrieval time. M3 strategic; eval methodology + 4 escalation options documented. Owner BE chat + Yogesh + Akshay (ground-truth marking).

### Fixed — Day 4 afternoon hotfix-4 (2026-04-30)

- **`fix(deps)`** — Pin `sharp` to `^0.33.5` via root `pnpm.overrides`. Hotfix-3 merged the duplicate `pnpm` keys (so `onlyBuiltDependencies` is now actually applied) but sharp 0.32.6 STILL didn't materialize its native binary on Render Linux x64 — root cause: sharp 0.32's `postinstall` script tarball download has multiple failure modes on Render's locked-down build env (`--frozen-lockfile`, no script internet access, broken-cache persistence). Sharp 0.33 (Nov 2023) **decoupled prebuilt binaries from postinstall** — they're now sibling packages (`@img/sharp-linux-x64` etc) that pnpm installs via the regular dep graph, no script execution needed. Local `pnpm install` confirmed `install: Done` for sharp 0.33.5 (the dep graph approach materializes the binary cleanly). 81/81 unit tests still green.
- **`docs(architecture)`** — **ADR-009** Pin sharp ≥0.33.5 to ship native binary on Render. Documents the four-part Day-4 boot regression chain (NestOtelLogger → LLMGateway → dup-pnpm-key → sharp-postinstall) + why each prior hotfix was real-but-insufficient + why bumping sharp is the right structural fix vs more buildscript hackery. Future contributors who consider downgrading sharp will hit this ADR.

### Fixed — Day 4 afternoon hotfix-3 (2026-04-30)

- **`fix(deps)`** — Root `package.json` had **TWO `pnpm` keys** (one with `onlyBuiltDependencies`, one with `overrides`). JSON last-key-wins → `onlyBuiltDependencies` was silently dropped, sharp's install script never ran, native binary never materialized on Render Linux x64, embedding stayed `deferred` forever. Merged into a single `pnpm` key containing BOTH `onlyBuiltDependencies` (now also includes `@xenova/transformers` + `onnxruntime-node` for completeness) AND `overrides`. The `_pnpm_security_note` updated to flag "do NOT split into separate `pnpm` keys again".
- **`test(api)`** — New production smoke test (`apps/api/test/smoke/health.e2e-spec.ts`) catches future regressions of this exact bug. Reads `PROD_SMOKE_URL` from env; if set, hits `/health` and asserts `embedding.status === "up"` with `warm: true`. If unset, only the sentinel test runs (1 passed + 5 skipped) so local + CI stay green. Convenience script: `pnpm --filter @qa-nexus/api test:smoke`. Intended invocation: `PROD_SMOKE_URL=https://qa-nexus-api.onrender.com pnpm --filter @qa-nexus/api test:smoke` post-deploy.

### Fixed — Day 4 afternoon hotfix (2026-04-30)

- **`fix(api)`** — Graceful boot when LLM/embedding deps unavailable + sharp rebuild fix. Three Render boot crashes back-to-back; this entry covers the second + third (NestOtelLogger entry below covers the first):
  - **`LLMGatewayService.onModuleInit`** previously threw `LLM_PRIMARY_PROVIDER env var is required` and crashed bootstrap. Per Day-4 noon arch decision, LLM keys come from F26 UI in M1 — not env vars — so missing-vars is the EXPECTED state on first deploy. Now wraps `readConfig()` in try/catch; on missing-vars logs a warning + sets `deferred=true` + `deferredReason`. `complete()` throws `HttpException(501)` with admin-friendly message (`"LLM gateway not configured: ... Admin must set LLM provider via F26 UI in M1."`). Matches R2Service / EmailService pattern.
  - **`EmbeddingService.onModuleInit`** was already non-crash (fire-and-forget `loadModel()` with `.catch` log) but had no `deferred` flag visible to /health, so /health reported embedding `down` and UptimeRobot would alert. Now flips `deferred=true` + `deferredReason` on model load failure (`sharp-linux-x64.node` missing, OOM, network).
  - **`/health` endpoint** updated: `llm` reports `{status: "deferred", note: ...}` instead of throwing; `embedding` adds a `deferred` variant alongside `up` + `down`. `computeOverall` treats embedding-deferred as still `ok` (returns 200, surfaced in body for ops) — only db-down or quota >90% return 503.
  - **`render.yaml` (new)** — Build Command now includes `pnpm rebuild sharp` so sharp's native binary is materialized for Render Linux x64. Without it, `Cannot find module '../build/Release/sharp-linux-x64.node'` crashes boot. pnpm 10's `onlyBuiltDependencies` whitelist works locally but Render's frozen-lockfile install somehow doesn't run sharp's install script — `pnpm rebuild sharp` forces it. Yogesh ALSO needs to update the Build Command field in Render's UI (Settings tab) to match this file.
  - **2 regression spec files** (`llm/__tests__/llm-gateway-graceful.spec.ts` + `embedding/__tests__/embedding-graceful.spec.ts`) — verify deferred mode toggles + complete() throws 501 + status() exposes deferred state. **81/81 jest green** (was 74, +7 across both files).
- **`fix(observability)`** — `NestOtelLogger` must `extend ConsoleLogger`, not `Logger`. Render redeploy crashed at boot with `Using the "extends Logger" instruction is not allowed in Nest v9. Please, use "extends ConsoleLogger" instead.` Root cause: Nest 10's `app.useLogger()` calls `overrideLogger()` which checks `instance instanceof ConsoleLogger`. Extending `Logger` (the static API facade) triggers the error at the FIRST `app.useLogger()` call — never fired in unit tests that just instantiated the class directly. Fix: import `ConsoleLogger` from `@nestjs/common` (instead of `Logger`) and have `NestOtelLogger extends ConsoleLogger`. No constructor changes needed (ConsoleLogger has the same constructor shape). Added regression test in `apps/api/src/observability/__tests__/otel.spec.ts` that builds a minimal stub Nest module + calls `Test.createTestingModule(...).createNestApplication({ logger: new NestOtelLogger() }).init()` — exercises the exact crash path.

### Added — Day 4 noon merge cascade (2026-04-30)

- **`refactor(web)`** — **followup `(i)` fully closed** via PR #17 at `22927a5`. F09 Projects List + F10 Create Project Modal migrated to context-provider entity identity (`useCurrentUser`, `useActiveProject`, `useTeamRoster`). View fixtures stay in per-component `data.ts` (per ADR-006 Refinement post-PR #16). 8 RWD pre/post screenshots committed; pre/post deltas ~1% confirming pixel-near-identical output. All 5 originally-spec'd components (F08a + F08b + F08c + F09 + F10) now using the centralized pattern.
- **`test(api)`** — **Coverage catch-up 39 → 73 jest tests** via PR #18 at `9d7f0cc` (+34: includes Task A's 5 new OTel tests + BE's 28 new audit/llm tests; spec called for +29). Four new spec files in apps/api: `audit/__tests__/audit-helper.spec.ts` (HMAC chain integrity, 9 tests), `audit/__tests__/audit.service.spec.ts` (wrapper behavior, 5), `llm/__tests__/base.provider.spec.ts` (retry-with-backoff, 9), `llm/__tests__/provider-registry.spec.ts` (lazy + cached factory, 5). Plus `scripts/llm-gateway-validation.sh` (deferred end-to-end validation, fires when Render is up + LLM keys land) + `docs/observability/llm-gateway-validation-2026-04-30.md` (placeholder).
- **`docs(followups)`** — Closed `(i)` (seed-centralization fully done across PR #16 + PR #17) + filed `(k)` Live LLM gateway + A1 Scribe validation (deferred to Render-deploy day, owner BE chat).
- **`fix(deps)`** — Both PRs needed `pnpm-lock.yaml` regen mid-cascade because they were opened against pre-Task-A main; cherry-pick + update-branch brought the api/package.json deltas but lockfile lagged. Standard pattern going forward: any PR opened before a deps-touching commit lands needs a lockfile regen as part of the rebase.

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
