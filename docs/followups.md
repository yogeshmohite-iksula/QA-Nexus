# Followups — top-level engineering backlog

---

## [2026-05-14] (bq) P1 — Raw-body webhook middleware design (Jira HMAC-SHA256 verify)

**Filed:** 2026-05-14 (Day-18 AM, M4 kickoff)
**Owner:** BE+1 (design Day-18 PM, implement Day-19 with MS4-T012)
**Linked AC:** MS4-AC008 + risk R002

Jira webhook posts JSON to our `/webhooks/jira` endpoint with an `X-Hub-Signature` header containing HMAC-SHA256 of the **raw request bytes**. NestJS / Express's default `bodyParser.json()` consumes the stream and stringifies to an object — recomputing HMAC over `JSON.stringify(req.body)` produces a different byte sequence than what Jira signed (whitespace, key order, unicode escape differences). Result: every webhook fails HMAC verify in production.

**Design constraints:**

1. Raw-body middleware MUST be scoped to `/webhooks/jira` only — DO NOT swap the global JSON body-parser. Mounting via NestJS's `MiddlewareConsumer.forRoutes('/webhooks/jira')` is the cleanest path; alternative is `app.use('/webhooks/jira', express.raw({ type: 'application/json' }))` BEFORE Nest's body-parser registers.
2. Handler must read `req.body` as Buffer for HMAC compute, then `JSON.parse(req.body.toString('utf8'))` for payload access.
3. HMAC compute: `crypto.createHmac('sha256', JIRA_WEBHOOK_SECRET).update(req.body).digest('hex')` — compare against `X-Hub-Signature: sha256=...` constant-time (`crypto.timingSafeEqual`).
4. Document the pattern in `docs/architecture/webhook-raw-body.md` so M5+ webhooks (Slack, GitHub, Stripe-style) inherit the same design.

**Status:** OPEN — design Day-18 PM, implement Day-19 alongside MS4-T012.

---

## [2026-05-13] (bk) P2 — Retrofit action-button inks into 01_SYSTEM.md

**Filed:** 2026-05-13 (Day-17, during M3 close cycle)
**Owner:** Design system maintainer (next M3+M4 retro)

During F19 design corrections, three canonical dark-ink hex values (`#022C1F` pass-ink, `#3D0707` fail-ink, `#3F2300` warn-ink) were added to `apps/web/app/globals.css` + the `enforce-design-tokens.sh` hook whitelist. These values are already canonical in the v2 HTML frames (F19 L407-411) but were never formally documented in `01_SYSTEM.md §3 Design Tokens`.

**Action:** Formally add `--pass-ink` / `--fail-ink` / `--warn-ink` to `01_SYSTEM.md §3`. Ensure new tokens are referenced wherever the design system documents filled-status surfaces (action buttons, status badges, alert banners).

**Why P2:** No functional impact — tokens work + hook whitelist is in sync. This is purely doc-debt cleanup so the `01_SYSTEM.md` spec stays single-source-of-truth for future frame ports.

**Cross-references:** F19 Run Console v2.html L407-411 (canonical source) · PR #129+ F19 Pattern A scaffold (introduces the tokens) · `.claude/hooks/pre-tool-use/enforce-design-tokens.sh` (whitelist updated in both worktrees).

---

## [2026-05-13] (bn) P3 — F08 Home user-pill stub-data wiring

F08 Home user-pill currently shows seeded `Kishor K.` (QA Engineer canon) instead of authenticated user. Stub-data placeholder from M3 scaffolding never wired to `authClient.getSession()`.

**Fix:** Replace stub render in F08 with `useSession()` hook from BetterAuth client; render `{session.user.name}` + role badge from `users.role` join.

**Owner:** FE+1 during M5 polish pass.
**Trigger:** M5 hardening sprint.
**ETA:** S (~30 min).

---

## [2026-05-13] (bm) P2 — Audit ALL existing M1-M3 React ports against `_DESIGN_RULES.md` 17 rules

`_DESIGN_RULES.md` was imported via #134 (Day-17) but FE+1 was porting M1+M2+M3 frames for weeks without this binding spec. Retroactive audit expected to surface silent token-fallback breaks, missing hover states, ink-token gaps, etc. (See `(bl)` for ink tokens specifically.)

**Method:** Apply Hard Rule 16 canonical-first workflow to each shipped M1-M3 React port (F06, F07, F08, F09, F12, F13, F14, F14m1-m3, F15, F16a-c, F19, F27, F28). Build diff table per page. Fix root-cause token gaps.

**Owner:** FE+1 (multi-day audit).
**Trigger:** M4 close cushion if available, else M5 hardening.
**ETA:** M (~2-3 days for full audit).

---

## [2026-05-13] (bo) P1 — Pre-push prod-boot smoke + request-level smoke gate

Pre-push gate currently runs `pnpm build` (catches compile errors) but not request-level smoke. The #138 P0 prod crash (`z.ipv4` TypeError in BetterAuth handler) passed pre-push compile but crashed on first auth request post-deploy. Boot smoke would also miss it (the crash happens in request handler, not at app boot).

**Fix:** Add a request-level pre-push step:

1. Boot app on ephemeral port (e.g., 4001) with `NODE_ENV=test`
2. `curl -X POST http://localhost:4001/auth/sign-in/magic-link -H 'Content-Type: application/json' -d '{"email":"smoke@test.local"}'`
3. Expect 200 (success) or 4xx (controlled rejection) — fail pre-push on 500/non-response
4. Tear down app

**Owner:** BE+1 (pre-push hook script in `apps/api/scripts/`).
**Trigger:** Day-18 first task in M4 (high priority — would have saved #138's prod-crash recovery cycle).
**ETA:** M (~45 min — Docker-free ephemeral boot needs careful sequencing).

---

## [2026-05-11] (bj) ✅ CLOSED 2026-05-13 — Remove obsolete SMTP\_\* env vars from Render after Resend migration verified

**Closed via PR #133** (chore(docs): mark followup (bh) file-side CLOSED) and Yogesh's Render dashboard action post-Day-17 magic-link end-to-end green confirmation. SMTP\_\* env vars no longer referenced in code post-#128.

Following PR #128 (EmailService migrated to Resend HTTPS API per ADR-018), the legacy SMTP\_\* env vars on Render are no longer read by the service. Yogesh to manually delete via Render dashboard once Resend delivery is verified end-to-end:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_FROM_NAME`
- `SMTP_FROM_EMAIL`
- `SMTP_REPLY_TO`
- `SMTP_BCC_EMAIL`

**Trigger:** post-M3 close, after at least one successful magic-link round-trip verifies Resend delivery.
**Owner:** Yogesh (Render dashboard action).
**ETA:** S (~5 min).

---

## [2026-05-10] (bd) P3 — `[m5-hardening]` BetterAuth `trustedOrigins` wildcard-subdomain support for Cloudflare Pages previews

**Filed:** Day-15 alongside CORS hotfix (PR #122 — extends `trustedOrigins` to include `qa-nexus-web.pages.dev` + env-var append for extras).

**Symptom:** Cloudflare Pages preview deployments use hash-prefixed subdomains (e.g. `https://89c44180.qa-nexus-web.pages.dev`). Each preview build gets a fresh hash. Adding each hash to `trustedOrigins` via the `AUTH_TRUSTED_ORIGINS` env var works but requires per-build operator action — wrong long-term ergonomics.

**Fix scope:** ~2 hr. Refactor `apps/api/src/auth/auth.config.ts` to support pattern-matching origins:

- BetterAuth `trustedOrigins` accepts strings OR (in newer versions) a function. Switch to a function predicate that accepts:
  - Exact strings from `AUTH_TRUSTED_ORIGINS` (current behavior preserved)
  - Wildcard patterns like `https://*.qa-nexus-web.pages.dev` (parses to a regex)
- Test matrix: exact match, wildcard match, non-match, base list, env extras.
- ADR sidecar IF the predicate logic gets complex enough (e.g., regex caching, security review of pattern format).

**Trigger:** M5 (F26 v2 admin UI ships) OR earlier if Yogesh wants to share preview-build links with stakeholders during M4 dev cycles. Until then, manually append the preview hash via Render env var when needed.

**Owner:** BE chat. **Severity:** P3 (workaround exists via `AUTH_TRUSTED_ORIGINS`).

**Cross-references:**

- PR #122 — extends static list + env-var append
- `apps/api/src/auth/auth.config.ts:77` — current implementation
- BetterAuth docs §"trustedOrigins" — function-predicate support
- followup `(bb)` (sister BE-side: express auth mount catch-all)
- followup `(bc)` (sister FE-side: drop `/api` prefix from baseURL)

---

## [2026-05-10] (be) P2 — Cloudflare Pages NEXT_PUBLIC_API_BASE_URL not injecting at Next.js build time

Day-15 cross-FE E2E surfaced that Cloudflare Pages **built and deployed successfully** with `NEXT_PUBLIC_API_BASE_URL` set as a Plaintext variable in Pages → qa-nexus-web → Settings → Variables and Secrets, **but the value did not bake into the FE JS bundle**. Verified by inspecting network calls from `qa-nexus-web.pages.dev` post-deploy: requests still hit `pages.dev` origin (same-origin fallback), not `https://qa-nexus-api.onrender.com`.

Likely a Cloudflare Pages × Next.js framework integration quirk (specific to how `NEXT_PUBLIC_*` vars are wired through the Pages build worker vs `next build`'s expected `process.env` shape at compile-time). Could also be a Next.js 15 + Pages workers compat regression.

**Current bridge (FE+1 PR, 2026-05-10):** Hardcoded production URL fallback in `apps/web/lib/auth/client.ts`:

```ts
baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://qa-nexus-api.onrender.com',
```

This works for prod immediately (no Cloudflare config dependency) AND preserves dev/staging dynamic URL when the env var DOES bake correctly. Defense in depth. No breaking change.

**Scope for M5 investigation:**

- Read latest Cloudflare Pages docs on `NEXT_PUBLIC_*` env-var injection for Next.js 15 framework preset
- Test alternative env-var configs: Build env var (vs Variable) · Secret type · Production vs Preview environment scopes · `wrangler.toml` vs Pages dashboard
- Verify with `pnpm --filter web build` locally + `node -e "console.log(process.env.NEXT_PUBLIC_API_BASE_URL)"` to confirm baseline expectation
- Audit any other `NEXT_PUBLIC_*` vars that might silently fall back (currently only this one; other absolute URLs in FE are co-located in `lib/api/*-api.ts` with the same pattern)
- If confirmed Cloudflare bug: file Cloudflare support ticket OR migrate to Render Pages / Vercel (cost-equivalent free tier)
- If confirmed config quirk: document the working pattern + remove the hardcoded fallback bridge

**Owner:** FE+1 + Yogesh (Cloudflare dashboard access).
**Severity:** P2 — bridge works; investigation is hygiene + tech-debt cleanup.
**Effort:** S–M (1–3 hr depending on whether quick fix vs platform migration).
**Cross-references:** PR #120 (basePath fix — sibling auth fix) · `apps/web/lib/auth/client.ts` (file header documents the resolution order + bridge rationale) · `apps/web/lib/api/users-api.ts` (sister Pattern B FE client using same `NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001'` pattern — does NOT have prod fallback yet, audit when fixing).

---

## [2026-05-10] (ay) P2 — F16c Bulk Import Pattern B flip deferred from M3 to M5

Discovery during Day-15 M3 close (FE+1 TASK D3 prep) revealed PR #95 shipped `POST /api/projects/:projectId/test-cases/bulk-link` + `POST /api/projects/:projectId/test-cases/bulk-delete`, **not** `POST /test-cases/bulk-create`. F16c bulk-import flow needs CSV/XLSX parse → many-new-test-case insert endpoint, which is a fundamentally different surface than bulk-link (which links _existing_ IDs to a requirement) or bulk-delete (soft-archive).

**Decision (Yogesh, 2026-05-10):** Defer F16c Pattern B flip from M3 to **M5 (Automation + Reports + MVP Launch)** — natural home given M5 already includes Automation Studio file-import patterns. Three reasons:

1. F16c Pattern A scaffold (#113, merged Day-15) already gives end-user UX preview with canned data — sufficient for M3 close.
2. Pattern B today would create throwaway code (no real `bulk-create` endpoint to wire).
3. F16c bulk import naturally fits M5 file-import scope.

**Scope for M5:**

- **BE+1:** Design + ship `POST /api/projects/:projectId/test-cases/bulk-create` accepting `{ rows: Array<{ key?, title, preconditions, stepsJson, expectedResult, priority?, format?, sourceCaseId? }> }` with Zod schema in `@qa-nexus/shared`. Per-row outcome shape mirrors PR #95 `BulkLinkOutcomeItem` / `BulkDeleteOutcomeItem` pattern (`created` / `failed[]` with typed reasons). Hard cap 50 rows per call (re-uses `BULK_OPERATION_MAX_IDS` constant). Audit row per call (`test_cases_bulk_created`).
- **FE+1:** Wire F16c modal's CSV/XLSX upload + parse + dedupe stage `Continue` CTA to the new endpoint. Mirror Pattern B pattern from PR #116 (typed-error toasts, request/response Zod validation, stubbed-mode awareness if applicable).
- **(aw)** F16c bare "A2" agent-tag canon question still pending (filed Day-10) — resolve in same M5 pass.

**Owner:** BE+1 + FE+1 in M5 kickoff.
**ETA:** L (~3-5 hr combined across BE + FE).
**Cross-references:** PR #113 (F16c Pattern A scaffold), PR #95 (existing bulk-link/bulk-delete), PR #116 (canonical FE Pattern B wire pattern), `(aw)` (sister F16c canon question).

## [2026-05-10] (bc) P1 — `[fe-followup]` FE auth client call paths: drop `/api` prefix from BetterAuth requests

**Filed:** Day-15 alongside `(bb)` BE auth-mount widening (PR #117).

**Symptom:** FE POSTs to `/api/auth/sign-in/magic-link` were 404'ing. The `/api` prefix is for Nest controllers (those exist at `/api/auth/sign-up`, `/api/auth/sign-in`, etc. via `@Controller('auth')` + `setGlobalPrefix('api')`). BetterAuth's native handler is mounted DIRECTLY on the express app at `/auth/*` — NO `/api` prefix.

**Root cause:** Mismatch between FE auth client config (using `/api/auth/*`) and BE BetterAuth mount path (`/auth/*` per `basePath` set in `AuthService.onModuleInit`). The mount-path mismatch is the inverse of the BE-side `(bb)` issue — `(bb)` widens BE to handle catch-all; `(bc)` fixes FE to call the right base.

**Fix scope:** ~15 min. In `apps/web/lib/auth/` (or wherever the BetterAuth client is configured — likely `@better-auth/client/react`):

```ts
// BEFORE
const client = createAuthClient({
  baseURL: 'https://qa-nexus-api.onrender.com/api/auth',
});

// AFTER
const client = createAuthClient({
  baseURL: 'https://qa-nexus-api.onrender.com/auth',
});
```

Local dev should follow the same pattern (drop the `/api` prefix from the BetterAuth client baseURL only — Nest controllers under `/api/*` continue to work).

**Owner:** FE+1 chat (sister PR to BE #117). **Severity:** P1 (auth was broken end-to-end on Day-15 staging — BE #117 unblocks the catch-all but FE still calls the wrong base).

**Cross-references:**

- `(bb)` (sister BE-side fix — PR #117 widened mount)
- `apps/api/src/auth/auth.service.ts` — `basePath=/auth` log line at boot
- `apps/api/src/main.ts:54` — express catch-all post-#117
- BetterAuth docs §"Custom basePath" — canonical client config pattern

---

## [2026-05-10] (bb) P1 — `[m3-platform]` Express auth mount was narrow (catch-all is BetterAuth canonical) — RESOLVED in PR #117

**Filed + resolved Day-15 in the same PR.**

**Symptom:** `apps/api/src/main.ts` mounted the BetterAuth handler at two specific paths:

```ts
expressApp.all('/auth/magic-link/*', toNodeHandler(authService.auth));
expressApp.all('/auth/get-session', toNodeHandler(authService.auth));
```

— covering only the verify + session-check endpoints. When Day-15 FE flipped to a new sign-in flow per Pattern B (PR #116) and POSTed to `/auth/sign-in/magic-link`, the mount didn't expose that path → 404. Pre-existing latent bug; NOT caused by Path C / PR #115 (verified via `git diff`).

**Diagnostic clue:** `/auth/get-session` returned 200 throughout — proving BetterAuth handler + Nest async `onModuleInit` initialization were healthy. The FE's reported 405 was actually 404 (interpretation drift in error handling).

**Fix shipped in PR #117:**

```ts
// catch-all per BetterAuth standard pattern — let it own its basePath
expressApp.all('/auth/*', toNodeHandler(authService.auth));
```

Preserves all existing callers (subsets of `/auth/*`) + unblocks `/auth/sign-in/magic-link` + any future BetterAuth endpoint without further wiring.

**Future audit note (this is the followup-keeper part):** Any new `toNodeHandler(...)` mount for a third-party library that publishes its own routing tree (BetterAuth, Clerk, Auth.js, NextAuth, etc.) MUST use a catch-all (`/path/*`), NOT enumerated sub-paths. Enumerated sub-paths are silent-fail-prone — a new endpoint shipped by the upstream lib won't be reachable. CI smoke test should hit the third-party lib's introspection endpoint (e.g., BetterAuth's `/auth/get-session` or its OpenAPI route) on every release to catch mount drift.

**Owner:** BE chat. **Severity:** P1 (RESOLVED). **Effort:** S (1 LOC + CHANGELOG + 2 followups).

**Cross-references:**

- PR #117 — the fix
- `(bc)` (sister FE-side fix — drop `/api` prefix from auth client baseURL)
- `apps/api/src/main.ts:54` — the widened mount
- `apps/api/src/auth/auth.service.ts` — `basePath=/auth` setting
- BetterAuth docs §"Mounting in Express" — standard catch-all pattern

---

## [2026-05-10] (az) P2 — `[m3-followup]` Remove Path C bridge + add F26-equivalent admin LLM config UI flows when F26 v2 ships in M5

**Filed:** Day-15 alongside ADR-015 (Path C transitional bridge for runtime LLM provider config). This followup tracks the **removal milestone** so the throwaway code from Path C doesn't accumulate as long-term tech debt.

**Trigger:** F26 v2 React UI ships in M5 + admins are configuring LLM providers via the web form (NOT via the `seed-llm-provider.ts` CLI).

**Removal scope (3-4 hr work):**

1. **Remove env-var fallback** in `LLMGatewayService.readConfigFromEnv()` — OR gate behind `LLM_DEPLOY_ENV_FALLBACK=true` for emergency operator hatch.
2. **Remove seed script** `apps/api/scripts/seed-llm-provider.ts` — OR move to `apps/api/scripts/legacy/` as ops escape hatch with README warning.
3. **Add hot-reload endpoint** `POST /api/admin/llm/reload` (Admin-only) — replaces "redeploy after seed" pattern. F26 v2 hits this on save.
4. **Add AAD to crypto helper** in `apps/api/src/llm/crypto.ts` — `AAD = workspaceId + providerKind` binds ciphertext to its row context (defends against row-swap attacks). Backward-compat: read-side accepts both AAD + non-AAD ciphertext during the migration window; write-side always emits AAD.
5. **Refactor providers** (`GroqProvider`, `GeminiProvider`, future) to take explicit `apiKey` constructor arg — removes the `process.env.GROQ_API_KEY` mutation in `readConfigFromDb`. Provider-registry passes the key through.
6. **Wire `agent_model_assignments` (TB-021) → `LLMGatewayService.config`** so secondary + long_context providers come from per-agent×role routing instead of being undefined.
7. **Mark ADR-015** `Status: Superseded by F26 v2` (or `Retired`).

**Owner:** BE chat (post-F26 v2 sister PR). **Severity:** P2 (transitional code; not blocking). **Effort:** M (3-4 hr).

**Why P2 not P3:** the longer Path C lives, the higher the surface area for misuse (operators forgetting to rotate keys via UI vs CLI; env vars accumulating; the `process.env` mutation pattern getting copied elsewhere). Should be cleaned up within 2 weeks of F26 v2 ship.

**Cross-references:**

- ADR-015 §"Lifespan + retirement" — full retirement plan
- `apps/api/src/llm/llm-gateway.service.ts` `readConfigFromDb` — the patch this followup removes
- `apps/api/src/llm/crypto.ts` — AAD addition target
- `apps/api/scripts/seed-llm-provider.ts` — script removal target
- M5 spec for F26 v2 (TBD — Claude Design redesign in progress)
- CLAUDE.md Hard Rule 1 ($0/month) + Hard Rule 6 (no secrets in repo) — both preserved by Path C, must remain preserved post-retirement

---

## [2026-05-09] (av) P3 — `[m3-followup]` TestCase.embedding backfill + CLAUDE.md doc-drift on embedding model

**Two coupled doc-debt + data-debt items, filed together because they
share the same root cause (CLAUDE.md says bge-large but reality is
bge-small per ADR-003 amendment + Day-5 vector(384) migration).**

### Item 1 — TestCase.embedding backfill job (M3.5+)

**Symptom (ADR-014 §8):** Curator's pgvector cosine search excludes
rows where `test_cases.embedding IS NULL`. M2-era manual TestCases
(created via /test-cases POST before Composer wired auto-embedding)
have no embedding → silently skipped from dedup. Service logs
`metadata.skippedNullEmbeddings` count for observability but the
cases themselves never surface in F14m2 banner — even when a new
proposal IS a near-duplicate of one of them.

**Fix scope:** ~3 hr. New script
`scripts/backfill-test-case-embeddings.ts` that:

- Selects all `test_cases WHERE embedding IS NULL AND status != 'deprecated'`
- Batches through `EmbeddingService.embedBatch(texts)` at batch size 32
- Writes back via raw SQL (Prisma can't update `vector(384)` columns
  directly — same constraint as M2 KbChunk backfill in PR #34)
- Idempotent (re-runnable; only touches NULL rows)
- Audit row `test_case_embedding_backfilled` per batch with counts
- Optional `--dry-run` flag for QA validation

**Trigger:** post-M3 close once Composer + Curator are operational
in production AND Akshay confirms the backlog of pre-M3 manual cases
is non-trivial. If pilot starts with few/no manual cases, defer
indefinitely (Composer will be the only source of new cases).

**Owner:** BE+1 + Yogesh approval gate. **Priority:** P3.

### Item 2 — CLAUDE.md doc-drift on embedding model

**Symptom:** `CLAUDE.md` "Locked tech stack" §"Embeddings" still says:

> "BAAI/bge-large-en-v1.5 in-process via `@xenova/transformers`
> (1024-dim, ~47ms/embed warm)"

But the actual data layer is `Xenova/bge-small-en-v1.5` (384-dim,
~33 MB, ~50ms/embed warm) per ADR-003 amendment + ADR-009 +
migration `apps/api/prisma/raw/migrations/0002_vector_384_dim.sql`

- `apps/api/src/embedding/embedding.service.ts` `EXPECTED_DIM = 384`.

Same drift in PM1_PRD v8.1 + PM1_ERD v2.1 (both reference bge-large).

**Fix scope:** ~30 min. Single edit to CLAUDE.md "Embeddings" line

- note in PRD/ERD's relevant sections that bge-small is the runtime
  model (with bge-large + Qwen3-0.6B as future-target pin per ADR-003
  amendment). Schedule during M3.5 doc consolidation pass alongside
  any other CLAUDE.md drift accumulated during M3 build.

**Owner:** Yogesh (CLAUDE.md is admin-edit-only) or BE+1 with
explicit approval. **Priority:** P3 (cosmetic; runtime is correct).

**Cross-references:**

- ADR-014 §"Embedding model reality vs CLAUDE.md spec — the reconciliation"
- ADR-003 + ADR-003-amendment
- `apps/api/prisma/raw/migrations/0002_vector_384_dim.sql` (the actual ground truth)
- `apps/api/src/embedding/embedding.service.ts` `DEFAULT_MODEL_ID`
- followup `(au)` (sibling — bge-large upgrade evaluation)

---

## [2026-05-09] (au) P3 — `[m3-followup]` Post-pilot embedding-model upgrade evaluation (bge-small → bge-large / Qwen3-0.6B / Nomic-v1.5 / BGE-M3)

**Filed:** Day-14 alongside ADR-014 §"Decision §2 Path C". Path C
deliberately defers the bge-large vs bge-small decision until pilot
data is available — this followup tracks the eval gate.

**Trigger (any one of):**

1. Curator FP rate > 5% measured against Iksula's labeled seed set
   in the first 2 weeks of pilot
2. Pilot expands beyond 8 users → tighter dedup quality matters
3. Render upgrades to paid tier (Hobby) → 512 MB ceiling lifted
4. Akshay or Yogesh requests "stricter dedup" UX

**Scope:** ~3 hr. Benchmark the following on production Curator
dataset (Iksula test_cases at end of pilot week 4):

| Model                                        | Dim  | RAM      | Latency target | MTEB avg |
| -------------------------------------------- | ---- | -------- | -------------- | -------- |
| Xenova/bge-small-en-v1.5 (current)           | 384  | ~33 MB   | ~50ms warm     | 62.17    |
| Xenova/bge-large-en-v1.5                     | 1024 | ~470 MB  | ~150ms warm    | 64.23    |
| Xenova/Qwen3-Embedding-0.6B (when published) | 1024 | ~600 MB  | TBD            | 67.80+   |
| Xenova/nomic-embed-text-v1.5                 | 768  | ~250 MB  | ~100ms warm    | 62.39    |
| Xenova/bge-m3                                | 1024 | ~570 MB  | TBD            | 65.30    |
| Xenova/bge-large-en-v1.5 (int8 quantized)    | 1024 | ~120 MB? | ~120ms warm?   | 63.5 est |

**Measurement protocol:**

- Re-embed full Iksula corpus with each candidate model (separate
  index per model — temporary parallel `test_cases.embedding_<model>`
  columns OR temporary `test_cases_eval` table)
- Run Curator's actual cosine search against each
- Score precision / recall / FP-rate at the 0.85 / 0.95 thresholds
- Measure RAM (resident + peak during embed batch) on Render Free dyno
- Measure p50 / p95 / p99 latency for embed + cosine search

**Decision matrix per model:**

- **Pass:** RAM < 512 MB × 0.7 = 358 MB headroom AND latency < 200ms
  p95 AND quality delta > +2 MTEB pt over bge-small
- **Conditional pass:** RAM acceptable but latency > 200ms → consider
  if quality delta > +5 pt
- **Fail:** RAM > 358 MB OR quality delta ≤ +1 pt

**Migration cost (if upgrade chosen):**

- Schema migration: `ALTER TABLE test_cases ALTER COLUMN embedding
TYPE vector(<new-dim>) USING NULL`
- Backfill: re-run `(av)` Item 1's backfill script with new model
- HNSW index drop + recreate (dim-specific per pgvector docs)
- Update `EMBEDDING_MODEL_ID` env var on Render
- Update ADR-003 amendment + CLAUDE.md per `(av)` Item 2

**Owner:** BE+1 + Yogesh approval gate. **Priority:** P3 (post-pilot).

**Cross-references:**

- ADR-014 §"Decision §2 Path C" + §"Negative" (quality cost note)
- ADR-003 + ADR-003-amendment
- `(av)` (sibling — backfill + doc-drift)
- CLAUDE.md "Embeddings" (current state + future-target pin)

---

## [2026-05-09] (ar) P2 — `[platform]` Cross-worktree cascade rebase pattern — locked-frame / abandoned-rebase-state hazards

**Symptom (Day-14 cascade):** During Day-14's BE cascade rebase of 4
PRs (#87 / #93 / #95 / #97) onto a moving `origin/main` (which had
absorbed Hard-Rule-14/15 v2-frame migration #100, prettier-gate #91,
and TASK-2 #87 in rapid succession), the rebase encountered TWO
distinct hazard patterns that the canonical `git rebase --onto
origin/main <upstream>` runbook didn't anticipate:

**Hazard 1 — "Cross-worktree untracked locked frames":**
Five v2 HTMLs (`F18-F22 v2.html`) appeared as **untracked** in BE's
worktree at session-resume because PR #100 had moved them from `frame
html view/` + `frames - claude code build/` into `Redesign Frame by
claude design/` while BE's local main was still pre-#100. Naive `git
checkout <branch>` would have failed (and any destructive cleanup
would have violated **Hard Rule 3** since these are LOCKED FRAMES).
Worse — F15 + F16b v2 carried Yogesh's pending design tweaks (129 +
2014 line modifications) that already-merged PR #100 had absorbed,
but the worktree didn't yet know.

**Hazard 2 — "Abandoned rebase-merge state in sibling worktree":**
The pre-compaction session left `.git/worktrees/Project10-QA_Nexus-
backend/rebase-merge/` populated with stale state pointing at
`feature/be-m3-test-cases-bulk-ops`. This made `git switch
feature/be-m3-test-cases-bulk-ops` from the main worktree fail with
`fatal: 'feature/be-m3-test-cases-bulk-ops' is already used by
worktree at...` even though `git worktree list --porcelain` showed
the backend worktree as `detached`. The branch was effectively
locked across worktrees by the abandoned rebase metadata.

**Why the canonical runbook missed it:** The Day-13 cascade pattern
assumed (a) a single worktree with clean tree, (b) all `origin/main`
movement was source-only, never locked-frame, (c) `rebase --continue`
reliably advances msgnum after `git add` of resolved files. None of
these held on Day-14.

**Mitigation pattern (validated this PR):**

1. **`git stash push --include-untracked`** as the first action on
   any cascade resume — captures locked-frame deltas non-
   destructively. Stash is move-aside, not modify.
2. **Verify locked-frame integrity post-rebase** by comparing stash's
   post-state blob hash against `git ls-tree origin/main -- <path>`.
   Match → safe to drop. Drift → retain stash + report. (This PR:
   F15 stash blob `47cb6d9` matched origin/main verbatim; same for
   F16b.)
3. **For abandoned rebase-merge state in sibling worktree:** move
   the `rebase-merge/` directory aside (don't delete) within
   `.git/worktrees/<sibling>/` — preserves recovery option,
   unblocks the cross-worktree branch lock.
4. **Cherry-pick over rebase --continue** when the rebase machinery
   gets stuck on a phantom unmerged-paths error. After
   `git switch -C <branch> origin/main`, `git cherry-pick <feature-
sha>` is the cleaner path. Empty CI-retrigger commits can be
   skipped entirely.
5. **Prettier --check pre-push gate (from `(aq)`)** caught spec-file
   drift on every BE PR this cascade — confirmed working as
   designed; cascade-storm prevention is real.

**ADR worth writing:** `docs/architecture/adr-XXX-cascade-rebase-
with-untracked-locked-frames.md` capturing the 5-step mitigation as
the canonical Day-14+ runbook. Author: BE chat. Reviewers: MAIN +
FE+1 (cross-worktree pattern affects all 3 chats).

**Owner:** BE chat. **Tag:** `[platform]`. **Severity:** P2
(documentation hardening — current Day-13 runbook works for happy
path, breaks on cross-worktree concurrent state). **Effort:** M
(45 min for ADR + cross-link from CLAUDE.md token-discipline section).

**Cross-references:**

- PRs #93 / #95 / #97 (this Day-14 cascade — all 3 force-pushed
  with cherry-pick recovery)
- PR #100 (locked-frame v1→v2 migration that triggered Hazard 1)
- PR #91 — `(aq)` prettier gate (caught drift this cascade)
- PR #87 — TASK 2 requirements CRUD (auto-merged mid-cascade,
  triggered re-rebase need)
- `docs/CHANGELOG.md` Day-14 (ar) entry (when ADR ships)

---

## [2026-05-08] (aq) P1 — `[platform]` Add `prettier --check` as pre-push gate 2 — RESOLVED in this PR

**Symptom:** Prettier-cascade has now bitten 5 PRs across 2 days:
Day-12 #62 / #75 / #77 / #78 (cleared by MAIN's #79 fix on main); Day-13
#85 / #87 (cleared by BE+1's prettier-write fixes). Pattern is always
the same: a spec file with subtle whitespace drift sneaks past
author-time gates, CI lint catches it, MAIN relays a fix back, BE+1
runs `pnpm exec prettier --write` + force-pushes. Round-trip cost is
~5–15 min per PR + relay overhead.

**Root cause:** The pre-push hook had typecheck + frozen-lockfile +
CHANGELOG gates but no prettier gate. Husky pre-commit also doesn't
run prettier. Authors discover format errors only after CI reports.

**Fix shipped in this PR:**

`.husky/pre-push` gets a new gate 2 (between typecheck and
frozen-lockfile): `pnpm exec prettier --check .`. The repo's
`.prettierrc` + `.prettierignore` are honored. Fast — ~1–2s on warm
cache. On failure, the script prints:

- "Files needing format:" list (capped at 10)
- One-line auto-fix command: `pnpm exec prettier --write .`
- Re-stage + retry instructions
- Bypass note (`git push --no-verify`, but warns CI lint will fail)

Old gate numbering (1/3, 2/3, 3/3) renumbered to 4 gates (1/4, 2/4,
3/4, 4/4), informational work-log token refresh promoted to 5/5.

**Owner:** BE chat. **Tag:** `[platform]`. **Severity:** P1
(prevents author-time cascade-storm pattern). **Effort:** S (15 min).

**Cross-references:**

- PR #79 (MAIN's prettier-on-main fix from Day-12 — root cause that
  bled into the cascade)
- BE+1 prettier-write commits on #85 + #87 (Day-13 cleanup)
- `docs/CHANGELOG.md` Day-13 (aq) entry

---

## [2026-05-07] (an) P1 — `[m2-followup]` F15 KB RAG answer-UI surface not yet built

**Discovered:** Day-12 TASK 3 mid-flight. The Day-12 brief listed
`answer-with-citations@1440` as a required visual-gate screenshot,
implying F15 should expose the `/api/projects/:projectId/kb/answer`
RAG endpoint via UI. The current F15 React port (built in M1) only
renders search-results + chunk-detail; there is no question input,
answer panel, citation chips, or noContext fallback notice.

**What shipped on Day-12 (this PR):**

- `apps/web/lib/api/kb-api.ts`: `fetchKbAnswer(projectId, req)` +
  `KbAnswerRequestSchema` / `KbAnswerResponseSchema` re-exports.
  The data layer is fully wired Pattern B.
- The FE component layer does NOT consume `fetchKbAnswer` yet — no
  hook, no UI surface.

**What's NOT shipped:**

- `useKbAnswer(projectId, question)` TanStack mutation hook
- "Ask a question" input + Ask button on F15
- Answer panel showing the generated text
- Citation chips linked to retrieved chunks (intersect with
  `sourceChunkIds`)
- Confidence band UI (≥0.75 high · 0.50–0.75 medium · <0.50 low)
- `noContext` fallback notice (canonical "I don't have information…"
  rendered as a notice, not a chat bubble per ADR-012 §4)

**Severity:** **P1 — `[m2-followup]`**. Search Pattern B is shipped

- visually validated; only the answer surface remains. M2 close
  ceremony can proceed with F15 marked "search Pattern B + answer-UI
  deferred".

**Fix path (~2 hr, FE-only):**

1. New hook `apps/web/lib/hooks/use-kb-answer.ts` — TanStack
   `useMutation`, calls `fetchKbAnswer`.
2. New component `apps/web/components/kb/kb-answer-panel.tsx`:
   - Question textarea (1..2000 chars per Zod)
   - "Ask" button (TEAL system CTA; the answer canvas itself sits
     on `var(--secondary)` 12% — canonical violet AI surface)
   - Citation chips rendered from `sourceChunkIds` → click scrolls
     to chunk in the left panel
   - Confidence band per ADR-012
   - `noContext === true` → notice card (NOT a chat bubble)
3. Wire panel into F15 page (tab toggle: "Search" | "Ask", or
   stacked below the search bar).
4. Capture `answer-with-citations@1440` screenshot.

**Reference:** ADR-012 §1+§2 + §4 · BE+1 PR #57 · compound-learning
"chunk-header citation pattern" (2026-05-06).

**Owner:** FE chat. Land Fri 8 May or post-M2 ceremony.

**Tag:** `[m2-followup]`

---

## [2026-05-07] (am) P2 — `[m2-followup]` Hard Rule 14 retrofit: F08 Home + F09 Projects List

**Symptom (Day-12 retrofit audit):** Two pre-Rule-14 frames render bespoke top-bar + left-rail chrome instead of the canonical `AdminShell` wrapper. Found by `docs/audits/2026-05-07-rule-14-retrofit-audit.md`:

- **F08 Home** — `apps/web/app/home/page.tsx` → `apps/web/components/home/qa-engineer-home.tsx` does NOT import `AdminShell`.
- **F09 Projects List** — `apps/web/app/projects/page.tsx` → `apps/web/components/projects/projects-list-page.tsx` does NOT import `AdminShell`.

F27 + F28 already comply (wrap via `users-roles-page.tsx` + `settings-audit-page.tsx` respectively).

**Severity:** P2 — works visually today, but breaks Rule 14 shell-parity contract. Collapse + hamburger primitives won't ship to these two routes until retrofitted.

**Fix path (~60 min total, both frames in one PR):**

1. Land FE+1 TASK 0 first (AdminShell v2 — adds `data-shell-collapse` + `data-shell-hamburger` data attrs + collapse toggle + hamburger primitives).
2. **F08:** wrap `<QaEngineerHome>` body in `<AdminShell active='home'>`. Add `'home'` to the `AdminNavActive` union type. Remove bespoke top-bar + left-rail markup.
3. **F09:** wrap `<ProjectsListPage>` body in `<AdminShell active='projects'>`. Add `'projects'` to the `AdminNavActive` union type. Remove bespoke chrome.
4. Visual gate at 320 + 1440 px per Rule 13 amendment — both screenshots MUST show hamburger (320) + collapse toggle (1440).
5. Commit on `fix/web-rule-14-retrofit-f08-f09`.

**Owner:** FE chat. Land as Thu PM TASK 5 (after 3 flip PRs + AdminShell v2).

**Tag:** `[m2-followup]`

**Cross-references:**

- `docs/audits/2026-05-07-rule-14-retrofit-audit.md` — full audit (this PR)
- `CLAUDE.md` Hard Rule 14 (codified PR #64)
- `PM1_UI_v2/Redesign Frame by claude design/F15 Knowledge Base v2.html` — canonical reference
- Sibling `(ak)` — author-time hook to prevent future regressions

---

## [2026-05-06] (ak) P2 — `[m2-followup]` author-time hook for missing `AdminShell` wrap on `/(app)/*` routes

**Symptom (Day-11 visual gate):** F12 KB Upload (PR #52, already merged)
and F13 KB Imports (uncommitted) both shipped without their `AdminShell`
wrapper — page rendered as a full-bleed body with a custom top header
instead of the canonical app shell (left rail + top utility bar +
project switcher). Same regression had previously occurred on F15 in M1
and was caught by visual gate. The pattern is now confirmed across
three frames; relying on visual gate alone scales linearly with FE
surface area.

**Root cause:** No author-time enforcement that pages under
`apps/web/app/(app)/**/page.tsx` either (a) use `<AdminShell>` directly
or (b) render a component whose top-level export wraps in `<AdminShell>`.
The `enforce-design-tokens.sh` and `enforce-pm1-stack.sh` PreToolUse
hooks catch ban-list deps and raw hex / MD3 tokens but don't inspect
JSX structural patterns.

**Severity:** P2 — visual-gate is catching regressions, but each catch
costs ~45 min of rework + a fix PR. Cheaper to block at author time.

**Fix path (~60 min):**

1. New PreToolUse hook `.claude/hooks/pre-tool-use/enforce-app-shell.sh`
   — fires on Edit|Write to `apps/web/app/\(app\)/.*\.tsx` AND
   `apps/web/components/.*-page\.tsx`.
2. Block when the file is the default-export entry for an `(app)/`
   route AND ANY of the following are missing:
   (a) imports `AdminShell` (or comment marker `// no-shell:OK <reason>`)
   (b) **sidebar collapse toggle primitive** (per F15 v2 canonical) — desktop ≥ lg breakpoint
   (c) **mobile hamburger primitive** (per F15 v2 canonical) — < lg breakpoint
3. Detection heuristics for (b)+(c): grep the rendered shell output for
   `data-shell-collapse` + `data-shell-hamburger` data attributes (FE+1
   to add these attrs to AdminShell primitives so the hook can detect them
   without parsing JSX deeply). Comment-marker bypass `// shell-primitives:OK <reason>`.
4. Settings wiring in `.claude/settings.json` — append next to
   `enforce-rwd.sh` (P1.1 hook from 2026-04-27 audit).
5. Self-test fixtures: synthetic Edit event JSON for (a) a fresh
   `(app)/foo/page.tsx` without `AdminShell` → exit 1, (b) a wrapped
   page → exit 0, (c) a marker-bypassed page → exit 0, (d) AdminShell
   present but collapse/hamburger primitives missing → exit 1, (e)
   bypassed shell-primitives marker → exit 0.

**Reference:** Hard Rule 14 (CLAUDE.md) — codified 2026-05-06 evening
post-F15 HTML↔React port diff revealed missing collapse + hamburger
primitives. Canonical: `PM1_UI_v2/Redesign Frame by claude design/F15
Knowledge Base v2.html`.
Sibling discipline-cascade item to `enforce-rwd.sh` (Rule 12).

**Owner:** FE chat. Land alongside the next FE discipline batch.

**Tag:** `[m2-followup]`

---

## [2026-05-06] (af) P3 — M3 RAG quality eval methodology — DEFERRED to M3

**Symptom (Day-11 TASK 3, ADR-012):** M2 KB RAG pipeline (PR forthcoming) ships with a heuristic confidence score (avg of cited chunk similarities) and no labeled question-answer test set to gate quality regressions. Today's "answer feels reasonable" is a manual eyeball check; over time as the system prompt evolves + the embedding model changes + Groq → Gemini fallback fires, we'll lose visibility into whether quality is improving or regressing.

**Trigger to revisit:** any of the following.

1. **Pilot QA team flags >2 wrong-answer incidents in a single week** — current threshold for "we need a quality measurement before we can fix this".
2. **Embedding model swap** (e.g., Xenova ships Qwen3-Embedding-0.6B ONNX as ADR-003 anticipates; or M3 moves to bge-large after a Render upgrade) — need a regression-testable gate before flipping the env var.
3. **System prompt iteration** — once we've tuned the prompt 2-3 times based on pilot feedback, we need a regression test.
4. **Multi-tenant PM3** — if PM3 ships per-customer KB tuning, each tenant needs an isolated quality baseline.

**Decision (M3 work, ~6-10 hr — only if any trigger above fires):**

1. Curate a labeled test set of ~30 question-answer pairs against the Iksula `return_policy_v2.xlsx` corpus (canonical M2 demo file). Each row: `{question, expected_answer_key_phrases[], expected_cited_chunk_ids[], min_confidence}`.
2. Build a `pnpm --filter @qa-nexus/api eval:rag` script that runs the pipeline against the test set + scores: (a) % of expected key phrases present in answer, (b) % of expected chunks actually cited, (c) avg confidence, (d) end-to-end latency.
3. Wire into CI on a separate workflow (NOT pre-merge gate — too slow + quota-burning) — runs nightly + posts result to Slack.
4. Hold each metric to a baseline; CI fails when a metric drops >5pp vs the previous green run.
5. Update ADR-012 with a §"Quality eval methodology" section pointing at this followup's resolution.

**Owner:** BE chat (folds into M3 quality work).
**Effort:** L (6-10 hr — most time is curating the test set with QA team input, not building the script).
**Severity:** P3 (no functional impact today; current pipeline is production-fit for M2 pilot scale).

**Cross-references:**

- `docs/architecture/adr-012-kb-rag-prompt-strategy.md` (the decision being eval-gated)
- `apps/api/src/kb/kb-answer.service.ts` (system prompt + sampling defaults under test)
- `docs/followups.md` `(l)` — sister M3 quality eval for embedding model swap

---

## [2026-05-06] (ae) P2 — PRD/ERD/CLAUDE.md drift: embedding model spec says 1024-dim bge-large, code is 384-dim bge-small — `[m2-blocker]` (spec-only)

**Symptom (Day-11 skill alignment audit):** `PM1_PRD v8.1` and `PM1_ERD v2.1` both contain a 2026-04-28 implementation note saying _"PM1 ships with `Xenova/bge-large-en-v1.5` (1024-dim, ONNX, Apache-2.0)"_. `CLAUDE.md` "Locked tech stack" section says the same. **However**, the live code in `apps/api/prisma/schema.prisma` declares `KbChunk.embedding` as `Unsupported("vector(384)")` per ADR-003 amendment + ADR-009 (Day-5 migration `0002_vector_384_dim.sql`). The active runtime model is `Xenova/bge-small-en-v1.5` to fit Render Free's 512 MB memory ceiling.

**Severity:** P2 — code is correct (ADRs supersede), but specs are stale. New BE engineers reading PRD/ERD will be confused. M2 KB chunk-search PRs reference the spec for chunk dimension.

**Fix path (~30 min):**

1. Amend `PM1_PRD v8.1` 2026-04-28 implementation note: change "bge-large-en-v1.5 (1024-dim)" → "bge-small-en-v1.5 (384-dim) per ADR-003 amendment + ADR-009 (Day-5)"
2. Amend `PM1_ERD v2.1` matching note in §1, §6, §8.1
3. Amend `CLAUDE.md` "Locked tech stack" `Embeddings:` line: bge-large → bge-small, 1024-dim → 384-dim
4. Add reference to ADR-009 in all 3 docs (currently only ADR-003 is cited)

**Owner:** Yogesh (PRD/ERD spec authority) + MAIN (CLAUDE.md amendment).
**Effort:** S (~30 min — search/replace across 3 docs).
**Severity:** P2 — does not block M2 deployment; flagged here per "[m2-blocker]" tag for visibility before BE+1 ships KB endpoints citing spec dimensions.

**Cross-references:**

- `apps/api/prisma/schema.prisma` model `KbChunk` line: `embedding Unsupported("vector(384)")?`
- `docs/architecture/adr-003-embedding-model.md` (original 1024-dim decision)
- `docs/architecture/adr-009-*.md` (Day-5 amendment to 384-dim)
- `apps/api/prisma/migrations/.../0002_vector_384_dim.sql`
- `docs/audits/2026-05-06-skill-alignment-audit-day-11.md` §3.1

---

## ~~[2026-05-05] (ab) P0 — F27 `/admin/users` BLOCKER: GET /api/users returns 404~~ ✅ RESOLVED

**Resolved:** 2026-05-05 — PR `fix/users-controller-wiring` (Day-10 morning).

**Root cause (confirmed):** Hypothesis 1 was wrong — BE wiring was already correct:
`UsersController` in `UsersModule.controllers[]` ✓ · `UsersModule` in `AppModule.imports[]` ✓.
**Actual root cause: hypothesis 2** — `apps/web/lib/api/users-api.ts` called `fetch('/api/users')`
with a relative URL, routing to the Next.js dev server (port 3000) instead of the NestJS backend
(port 3001). In production (static Cloudflare Pages export), the same relative URL would hit
Cloudflare Pages with no proxy rule to Render — also a 404.

**Fix applied (`apps/web/lib/api/users-api.ts`):**
Added `API_BASE = NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001'` constant (trailing-slash
stripped). All three fetchers (`fetchAdminUsers`, `patchUserRole`, `patchUserStatus`) now use
`${API_BASE}/api/users/…` — absolute URLs, same pattern as `apps/web/lib/auth/client.ts`.

**Cross-references:**

- Visual sweep evidence: `docs/screenshots/m1-close-sweep/f27-users-{1440,320}.png`
- Locked HTML reference: `QA Nexus/PM1/PM1_UI_v2/frame  html view/F27 Users & Roles.html`

---

## [2026-05-05] (ac) P2 — F07 onboarding route mismatch — spec says `/onboarding/step-{1..4}`, actual routes are `/founder` + `/invited/{lead-admin,qa-engineer,stakeholder}` — `[m1-close-day-10]`

**Symptom (Day-9 afternoon, M1 close visual sweep):** All four `/onboarding/step-N` URLs return 404. The actual implemented routes for the F07/a/b/c/d onboarding flow are role-conditional: `/founder` (deployer-admin first-run wizard) + `/invited/lead-admin` + `/invited/qa-engineer` + `/invited/stakeholder` (per-role welcome screens).

**Visual evidence:** content at the actual routes renders correctly (`docs/screenshots/m1-close-sweep/f07-*.png`); this is purely a routing-spec alignment issue, NOT a visual regression.

**Decision needed:** which is canonical — the M0 spec naming (`/onboarding/step-N`, generic 4-step wizard) or the implemented role-conditional naming (`/founder` + `/invited/*`)? The implemented form aligns better with the actual UX (different roles see different content) but the spec naming is referenced in PRD §7 + M0 backlog.

**Fix path (~15 min):**

- **Option A (rename code → spec)**: rename folders to `app/(auth)/onboarding/step-{1..4}/page.tsx` with conditional content per role.
- **Option B (rename spec → code)**: update PRD §7 + M0 backlog to reference `/founder` + `/invited/*` paths.

Option B is recommended (preserve the role-conditional UX which is materially better than a generic 4-step wizard for an 8-user pilot).

**Owner:** PM (Yogesh) for spec decision; FE chat (Day-10) for the code/doc alignment after decision.
**Effort:** S (~15 min for either option).
**Severity:** P2 — visual gates pass; only spec/code drift.

---

## [2026-05-05] (ad) P3 — F08 `/home` has no separate empty-state route — `[m1-close-day-10]`

**Symptom (Day-9 afternoon, M1 close visual sweep):** `/home` always renders the data-state dashboard (with active sprint, attention panel populated). The locked HTML F08 (empty state) and F08b (data state) are TWO frames per `01_SYSTEM.md` mapping; the React port collapses them into one route that conditionally renders based on data presence (not a URL flag).

**Decision needed:** is "F08 empty" a distinct acceptance gate that needs a `?empty=1` query-param toggle or an `/admin/seed-clear` dev-only flow, or is the data-driven conditional render acceptable?

**Recommendation:** data-driven conditional is fine — the empty state will be visible naturally when a fresh workspace has no projects/sprints. Add a Storybook-style preview route (e.g. `/__preview/home-empty`) ONLY if dev-side visual gating needs it before pilot data lands.

**Owner:** Yogesh (decide); FE chat to implement if preview route is wanted.
**Effort:** S (~10 min) for preview route, OR 0 effort to accept current behaviour.
**Severity:** P3 — visually verifiable in pilot use; not blocking M1 close.

---

## [2026-05-05] (aa) P3 — Parent-zone migration plan if pilot expands beyond `qanexus.iksula.com` — DEFERRED to PM2

**Symptom (Day-9 morning, ADR-007):** T021 BetterAuth magic-link wiring (PR forthcoming) sets cross-subdomain session cookies via `crossSubDomainCookies.domain: '.qanexus.iksula.com'` so `app.` and `api.` subdomains share one session. The wildcard parent-domain choice is correct for PM1 pilot scale (8 internal Iksula users, single zone) but couples session cookies to that exact zone.

**Trigger to revisit:** any of the following.

1. **Pilot expansion to a different zone** — e.g. moving `app.` and `api.` to `qa.iksula.com` for a 50-user wave. Cookie domain must change in lockstep with the deployment domain swap.
2. **Multi-tenant plan (PM3)** — if PM3 ships per-customer subdomains (e.g. `acme.qanexus.iksula.com`), the wildcard cookie strategy still works WITHIN the zone but requires per-tenant session isolation logic in `auth.service.ts` (workspace-id check on every session resolve, which we already do — so this might be a no-op).
3. **Embedded-iframe surfaces (PM2)** — if PM2 ships a Jira app embedded in `iksula.atlassian.net`, the embedded surface won't share the session cookie with `app.qanexus.iksula.com` due to CHIPS partitioning. Either accept dual-sign-in OR move to a token-passing model for the embed.

**Decision (PM2 work, ~4-6 hr — only if any trigger above fires):**

1. Inventory all `crossSubDomainCookies.domain` references (currently 1: `apps/api/src/auth/auth.config.ts` plus the env-var coupling on `BETTER_AUTH_URL`).
2. Add an env-driven domain config so dev / staging / prod can target different parent zones without code changes (`BETTER_AUTH_COOKIE_DOMAIN` env override already in place from T021 — this followup adds the migration runbook + tested cutover path).
3. Update `apps/web/middleware.ts` cookie-domain expectation if the cookie name changes (BetterAuth allows custom cookie naming).
4. Migrate active sessions OR force a re-sign-in window during the cutover (8 users, low impact for PM1 pilot — higher impact at PM3 scale).
5. Update ADR-007 with a "Superseded by ADR-XXX" header pointing to the new decision.

**Owner:** BE chat (folds into PM2 deployment-architecture work).
**Effort:** M-L (4-6 hr depending on trigger; multi-tenant case + embedded-iframe case are L).
**Severity:** P3 (no functional impact today; current solution is production-fit for PM1 pilot scale).

**Cross-references:**

- `docs/architecture/adr-007-cookie-domain.md` (the decision being re-evaluated)
- `apps/api/src/auth/auth.config.ts` (implementation site, T021 PR)
- `apps/web/middleware.ts` (FE cookie reader, T021 PR)
- `docs/SECURITY.md` (cookie domain trust boundary section, added by T021 PR)

## [2026-05-05] (zz) P3 — Add `docs/observability/jira-exports/` to `.gitignore`

**Symptom:** `git status` on every FE branch since Day-3 has shown:

```
?? docs/observability/jira-exports/
```

Untracked dir, never committed, but creates persistent visual clutter in every status / diff and risks accidentally `git add .`-ing a file with PII pulled from Jira during local debugging.

**Fix:** add to root `.gitignore`:

```
# Local Jira-export scratchpad — never commit (may contain Iksula PII)
docs/observability/jira-exports/
```

Also worth a one-line README inside `docs/observability/jira-exports/` (existing dir) noting it's a scratch space + gitignored.

**Owner:** FE chat — 2-min job, can fold into any incoming PR.

**Severity:** P3 (cosmetic + minor PII-leak guardrail). No urgency, but the longer it sits the more confused future contributors will be about whether it's a tracked path.

---

## [2026-05-04] (z) P3 — M2.5 PDF parser re-evaluation gate (`pdf-parse` → `pdfjs-dist`) — DEFERRED to post-pilot

**Symptom (Day-8 Part C, ADR-010):** M2 chunking service (PR #34, Step 5) ships `pdf-parse@^2.4.5` over the implicit canonical `pdfjs-dist` because pdfjs-dist's `canvas` peer-dep would push the BE service past Render Free's 512 MB ceiling (recreating the Day-4 bge-large OOM condition). The decision is correct under current cost-gate constraints but worth re-evaluating once any of the following is true:

1. **Render upgrade approved** — Hobby ($7/mo) lifts the ceiling to 2 GB, making the canvas overhead negligible. Yogesh would need to approve the cost-gate exception via a separate ADR.
2. **Mozilla ships a canvas-free `pdfjs-dist` build** — there is an open RFE in the upstream `mozilla/pdf.js` issue tracker for a `--no-canvas` build target. If/when this lands, the M2 chunking pipeline could swap back to the canonical parser without operational risk.
3. **`pdf-parse` v3.x stalls or breaks against a `pdfjs-dist` API change** — the v2.x line is small-team-maintained (modicum/pdf-parse). If a `pdfjs-dist` text-extraction API shift breaks `pdf-parse` and the upstream maintainer doesn't ship a fix within ~2 weeks, we should pre-emptively migrate.

**Decision (M2.5 work, ~2-4 hr — only if any trigger above fires):**

1. Inventory all `pdf-parse` import sites (currently 1: `apps/api/src/chunking/parsers/pdf-parser.ts`).
2. Swap to `pdfjs-dist` + canvas (if trigger 1) OR canvas-free `pdfjs-dist` (if trigger 2) OR alternative library (if trigger 3 + maintainer exit).
3. Re-run `apps/api/src/chunking/__tests__/parsers.spec.ts` — all pdf cases must pass against the new parser. Output text shape must be byte-identical (or differ only in whitespace normalization) to avoid a chunk-embedding cache invalidation.
4. Update ADR-010 with a "Superseded by ADR-XXX" header pointing to the new decision.

**Owner:** BE chat.
**Effort:** S-M (2-4 hr depending on trigger).
**Severity:** P3 (no functional impact today; current solution is production-fit for pilot scale).

**Cross-references:**

- `docs/architecture/adr-010-pdf-parser-choice.md` (the decision being re-evaluated)
- `docs/architecture/adr-003-embedding-model.md` (sister 512 MB constraint that drove bge-small)
- `apps/api/src/chunking/parsers/pdf-parser.ts` (the implementation site)
- Mozilla `pdf.js` upstream RFE tracker (link to be added if/when the canvas-free build lands)

---

## [2026-05-04] (y) P1 — Wrong slug shape in `generateStaticParams()` on `[slug]` project routes — ✅ FIXED 2026-05-04 (this PR)

**Symptom (Day 8 PR #31 visual gate):** Two pages 500 at runtime with the Next.js error:

```
Page '/projects/[slug]/<route>/page' is missing param '/projects/[slug]/<route>'
in 'generateStaticParams()', which is required with 'output: export' config.
```

Affected pages confirmed:

- `/projects/ret/imports/`
- `/projects/ret/sources/jira/step-2/`

**Original hypothesis (visual-gate ping):** "Missing `generateStaticParams()`."

**Actual root cause (this PR's investigation):** The function EXISTS on all 5 dynamic routes — but it returns the wrong slug **shape**. Each route hardcoded long display slugs (`iksula-returns`, `iksula-commerce`, `iksula-payments`, `iksula-mobile`, `iksula-ops`), but the URL convention used everywhere else in the app (router pushes, the M1 admin shell, the home-empty rail, the F14m\* dynamic routes) is **lowercased project `key`** (`ret`, `cart`, `pay`, `auth`, `ops`). When a user navigated to `/projects/ret/imports/`, the `'ret'` slug wasn't in the pre-built list → Next 500. Pre-existing across 5 files, originally landed in early Day-3/4 ports before the URL convention crystallized.

**Fix (this PR):** Replace each route's hardcoded list with a seed-derived enumeration:

```ts
import { projects } from '@/lib/demo-seed';

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.key.toLowerCase() }));
}
```

Single source of truth (`projects` from `lib/demo-seed`), automatic coverage of all 5 Iksula seed projects (`auth`, `cart`, `ops`, `pay`, `ret`), and self-extending when the seed grows. Once BE M2 schema lands + the projects table is populated, this becomes a build-time DB lookup.

**Files fixed (5):**

- `apps/web/app/projects/[slug]/imports/page.tsx`
- `apps/web/app/projects/[slug]/sources/jira/page.tsx`
- `apps/web/app/projects/[slug]/sources/jira/step-2/page.tsx`
- `apps/web/app/projects/[slug]/sources/jira/step-3/page.tsx`
- `apps/web/app/projects/[slug]/upload/page.tsx`

**Verification:** `pnpm --filter web build` passes — `output: 'export'` static-build emits `out/projects/{auth,cart,ops,pay,ret}/{imports,sources/jira,sources/jira/step-2,sources/jira/step-3,upload}/index.html`.

**Pre-existing — NOT introduced by Phase 3 retrofit (PR #31).** Confirmed: PR #31's edits were pure CSS class swaps (`var(--primary)` → `var(--secondary)`).

**Reference template:** F14m1 + F14m2 + F14m3 dynamic routes already use the correct pattern — `REQUIREMENTS.map((r) => ({ key: r.key.toLowerCase() }))`. The pattern just hadn't propagated to `projects/[slug]/**` yet.

**Closed by:** PR opened 2026-05-04 (this same day) titled `fix(web): correct generateStaticParams slug shape on [slug] project routes (closes followup y)`.

---

## [2026-05-04] (x) P2 — Day-0 admin seed mechanism (bootstrap gap blocking automated email warmup) — BUNDLE INTO T021

**Symptom (Day-8 PM):** Gmail SMTP wiring (PR #26 / ADR-008) merged + Render-deployed. Warmup test per ADR-008 §6 needs the BE chat to call `POST /api/invitations` with an Admin session cookie. **Bootstrap gap discovered:** the only mechanism to acquire a session cookie is the BetterAuth magic-link login flow — which itself depends on SMTP working (the very thing we're testing). BE chat cannot break the loop without manual cookie injection from Yogesh's browser.

**Risk accepted (~24-48h interim):** Gmail SMTP code in production but unverified for real outbound delivery. Acceptable for pilot scale (8 internal users; no automated invitation sends until Day 9+). Yogesh can optionally fire the warmup curl pre-T021 with a manually-injected session token.

**Decision (Day-9 work, ~1-2 hr — folded into T021):**

1. Add a Day-0 admin seed mechanism that does NOT depend on magic-link working. Options:
   - **(a)** `pnpm --filter @qa-nexus/api admin:seed-session --email yogesh.mohite@iksula.com --ttl 1h` — one-off CLI that mints a short-TTL Admin session row directly via Prisma (skips BetterAuth's send/verify dance). Use only at Day-0 bootstrap or pre-T021 acceptance windows.
   - **(b)** Render-only env var `BOOTSTRAP_ADMIN_TOKEN` that, when set, lets a single curl call to `POST /admin/bootstrap/session` mint a session for the seeded Admin email. Auto-disables once a magic-link send succeeds.
   - **(c)** Manual SQL — Yogesh inserts an `auth_session` row via Neon console with a known token. Crude but zero-code.

   **Recommendation: (a)** — keeps the bootstrap mechanism in code where it's auditable + version-controlled.

2. Bundle into T021 (BetterAuth magic-link wiring) since both touch the auth surface and ship as one PR. Avoids a separate auth-touching PR + separate review cycle.

3. Document the bootstrap flow in `docs/runbooks/day-0-admin-seed.md` (NEW, ~50 lines): when to use it, security model (TTL bounded, audit-logged, never reusable), how to retire post-magic-link.

4. Audit: every bootstrap-session mint writes an `admin_bootstrap_session_minted` row to `audit_log` with the actor email + TTL + reason (free-text justification). Chain-binding per Hard Rule 7.

5. Update ADR-008 §6 status from "DEFERRED" to "VERIFIED" once warmup succeeds.

**Owner:** BE chat (folds into T021 BetterAuth wiring).
**Effort:** M (bundled into T021's ~6-hr surface).
**Severity:** P2 (blocks automated email warmup verification but NOT pilot functionality — Yogesh can still send invitations manually via the interim manual-cookie path if needed).

**Cross-references:**

- `docs/architecture/adr-008-email-service-gmail-smtp.md` §6 (acceptance gate, deferred state)
- `apps/api/docs/integrations/betterauth-invitations.md` (T021 plan)
- `apps/api/src/auth/auth.service.ts` (BetterAuth wiring entry point)

---

## [2026-05-03] (v) P3 — Phase-1 audit of remaining 37 locked frames — M2-M4 ROLLING

**Symptom (Day-7 close-ceremony, Step I):** Claude Design ran a Phase-1 spec-drift audit on the F15 + F16 cluster on 2026-05-03 and surfaced material drift between the locked HTML, `PM1_PRD`, `PM1_ERD`, and `01_SYSTEM.md`:

- **F15 Knowledge Base** — wiki-vs-chunk-search mismatch (locked HTML showed wiki UX; spec called for vector-chunk search). Resolved by v2 redesign with histogram slider + snap-sheet drawer + Cowork-style scrollbars.
- **F16a/b/c (Test Case generation cluster)** — multi-source / A2 dedupe / 5-step stepper additions surfaced. Resolved by v2 redesigns + new primitives-playground.html + 2026-05-03-phase-3-drift-retrofit-memo.html.

**Implication:** the same audit pattern likely exists for the **other 37 locked frames** (17 in `frame  html view/` + 20 in `frames - claude code build (PM1 v2.6-v2.8)/`). Surfacing them in batch BEFORE React port begins for each milestone avoids costly rework later (e.g., porting F22 to React, then discovering A4 5-Layer accordion needs structural changes per spec).

**Decision (M2-M4 rolling, ~2-3 hr per frame × 37 frames):**

1. Apply the same Phase-1 audit template Claude Design used for F15 + F16 cluster. Cross-reference each frame against:
   - `QA Nexus/PM1/PM1_PRD/PM1_PRD.md` v8.1 (current)
   - `QA Nexus/PM1/PM1_ERD/PM1_ERD.md` v2.1 (current)
   - `QA Nexus/PM1/PM1_UI_v2/UI Files/01_SYSTEM.md` (design tokens + interaction patterns)
2. **Priority order:**
   - **M2 adjacent (top):** F11 (Jira Wizard 2-way sync surfaces), F14 family (already partially ported in PR #25 — re-audit first)
   - **M3 adjacent:** F17 (Test Case Library), F18 (Test Suites)
   - **M4 adjacent:** F19 (Run Console live state), F20 (Run Results), F21 (Defects Hub), F22 (Defect Detail with A4 RCA accordion)
   - **M5 adjacent:** F23 (Reports Studio), F25 (Executive Dashboard Prove-mode), F26 (Agents), F28 (Settings & Audit)
   - Remaining ~25 frames in batch by milestone owner
3. Output per frame: drift items list + recommended v2 redesign or "no drift, ship as-is" verdict.
4. Where drift surfaces v2-redesign-required: file separate Phase 2/3 redesign tasks for Claude Design.

**Owner:** Yogesh + Claude Design (Wed 6 May reset onward, due to current 90% weekly limit).

**Severity:** **P3** (no current impact; high value for M2+ React port quality + avoids per-milestone rework).

**Cross-refs:**

- `QA Nexus/PM1/PM1_UI_v2/Redesign Frame by claude design/2026-05-03-phase-3-drift-retrofit-memo.html` (Phase 1 → Phase 3 retrofit template)
- `QA Nexus/PM1/PM1_UI_v2/Redesign Frame by claude design/primitives-playground.html` (canonical primitives for v2 patterns)
- CLAUDE.md Hard Rule #3 (updated 2026-05-03 to reflect 3-folder layout post-supersede)
- M0 completion report `docs/milestones/M0_completion_report.md` §4 D7

---

## [2026-05-03] (u) P2 — Onboarding spec FE failures `:38` + `:44` (pre-existing, masked) — M1.5 SWEEP

**Symptom (Day-7 close-ceremony PR #24):** After PR #24 (closes followup `(t)`) added the Postgres service container, **7 of 11 onboarding tests** went FAIL→PASS (`:123 /health`, `:145 /agents/a1/generate 401`, etc.). But **4 unique tests still fail across both browsers** (8 entries with retries):

| Test                                                                                          | Browsers                         | Likely cause                                                                                                                                                       |
| --------------------------------------------------------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `apps/e2e/tests/onboarding.spec.ts:38` "signed-out user lands on /sign-in"                    | chromium-desktop + mobile-safari | Pure FE redirect logic. Investigate router middleware in `apps/web/src/middleware.ts` or equivalent App Router redirect setup.                                     |
| `apps/e2e/tests/onboarding.spec.ts:44` "sign-in form triggers magic-link send (stub mode OK)" | chromium-desktop + mobile-safari | Depends on **T021 BetterAuth magic-link wiring**, explicitly deferred to M1.5 pending Yogesh's cookie-domain ADR-007. Test will resolve naturally when T021 lands. |

**Pre-existing context:** Both tests have been failing on every CI run since they were added; previously masked by `continue-on-error: true` on the `Run Playwright tests` step in `.github/workflows/e2e.yml`. PR #24 unmasked the partial picture (4 still-failing vs 7 newly-passing), enabling this followup.

**Decision (M1.5 sweep, ~1-2 hr):**

1. `:44` — wait until T021 magic-link wiring lands. Test should pass automatically.
2. `:38` — investigate FE `/sign-in` redirect. If real bug, fix before pilot. If also depends on T021 (e.g., session-cookie check route), mark `.skip` until T021.
3. **After both `:38` + `:44` are green:** remove `continue-on-error: true` from the playwright step in `e2e.yml`. Otherwise future masked regressions ship undetected — that's the structural debt followup `(t)` §6 captured.

**Owner:** FE chat (M1.5 sweep, alongside T021 BetterAuth magic-link work).

**Severity:** **P2** — no current pilot impact; tracks the masking debt that lets future real regressions ship undetected. Deadline: before pilot launch (M5 Day-0).

**Cross-refs:**

- `apps/e2e/tests/onboarding.spec.ts` lines 38 + 44
- `apps/api/docs/integrations/betterauth-invitations.md` (T021 plan, on PR #22 branch)
- `.github/workflows/e2e.yml` line 128 (the `continue-on-error: true` to remove)
- Followup `(t)` §6 (the bonus masking-removal item that was deferred)
- Day-7 EOD `docs/eod-reports/2026-05-03-day-7.md` (the original masking discovery)

---

## [2026-05-03] (t) P0 — CI Postgres service deficit — DAY 8 MORNING BLOCKING

**Symptom (Day-7 close-ceremony, PR #22 Step 4):** PR #22 (BE M1) E2E job fails 100% with all 22 playwright tests in `tests/onboarding.spec.ts` red across both chromium-desktop + mobile-safari. API never boots within the 60s `/health` budget. After Path δ instrumented `Tail server logs (always — diagnostic)` (PR #23 commit `4bb478c`), api.log dump revealed root cause:

```
Bootstrap failed: PrismaClientInitializationError:
  Can't reach database server at `localhost:5432`
  at Proxy.onModuleInit (apps/api/dist/prisma/prisma.service.js:27:9)
```

**Root cause:** `.github/workflows/e2e.yml` has **no `services: postgres:` block**. `DATABASE_URL` falls back to `postgresql://invalid:invalid@localhost:5432/postgres` (line 60). PrismaService.onModuleInit() calls `prisma.$connect()` eagerly → throws → API bootstrap aborts → /health never responds → tests fail. Long-standing structural debt previously **masked** by `.skip` markers on all DB-touching tests; unmasked 2026-05-03 by PR #22 M1 BE which added new non-skipped tests (`onboarding.spec.ts:123` `/health`, `:145` `/agents/a1/generate 401`, `:38` sign-in redirect, `:44` magic-link form trigger) requiring real API up.

**Falsified hypotheses** (kept for posterity — three halts today):

- ❌ Path α: GH Actions infra flake (re-run on `f5f9d43` failed identically; 50-min window pattern was coincidence, not cause)
- ❌ Path β: bge-large model load timeout (main `68b3ac0` E2E PASSED at 07:40 UTC TODAY _with_ bge-large; PR #23 with bge-small still FAILED at 10:27 UTC)
- ❌ Speculation: HF CDN flake on first-fetch (api.log shows model load completed before the Prisma error)

**Decision (Day-8 morning, ~3-4 hr):**

1. Open `fix/ci-postgres-service` PR off main (post-PR #23 merge).
2. Add `services: postgres:` block to `.github/workflows/e2e.yml`:
   ```yaml
   services:
     postgres:
       image: pgvector/pgvector:pg15 # NOT vanilla postgres:15 — we need pgvector ext
       env:
         POSTGRES_PASSWORD: postgres
         POSTGRES_USER: postgres
         POSTGRES_DB: postgres
       ports:
         - 5432:5432
       options: >-
         --health-cmd pg_isready
         --health-interval 10s
         --health-timeout 5s
         --health-retries 5
   ```
3. Set `DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/postgres"` (keep `${{ secrets.NEON_TEST_DATABASE_URL }}` fallback for future T012 wiring).
4. Add new step `Apply raw migrations` BEFORE `Start API in background`:
   ```yaml
   - name: Apply raw migrations (0001 → 0003)
     run: |
       pnpm --filter @qa-nexus/api prisma:apply-raw:0001
       pnpm --filter @qa-nexus/api prisma:apply-raw:0002
       pnpm --filter @qa-nexus/api prisma:apply-raw:0003  # M1 users.disabled_at + role_changed_at
   ```
5. Add minimal Iksula 8-user seed step (verbatim from `CLAUDE.md` canon) for tests that need authenticated context.
6. **Bonus fix (in same PR):** make `Start API in background` step actually exit 1 on /health timeout (currently the for-loop exits silently → masks failure → diagnostic step couldn't trigger via `if: failure()`). Append after for-loop:
   ```bash
   if [ "$code" != "200" ] && [ "$code" != "503" ]; then
     echo "::error::API failed to boot in 60s — see Tail server logs step"
     exit 1
   fi
   ```

**Acceptance:**

- [ ] CI on the fix PR: all 7 checks green INCLUDING playwright (no longer masked by `continue-on-error`)
- [ ] After merge, rebase PR #22 → CI green → ready for squash-merge
- [ ] Future M1+ tests can hit real Postgres in CI without `.skip` workarounds
- [ ] Diagnostic dump (Path δ from PR #23) remains in place — useful regardless

**Owner:** BE+1 (DevOps lift; one engineer can do alone in 3-4 hr).

**Severity:** **P0** — blocks all BE M1+ PRs from merging cleanly until resolved. M0 close ceremony is paused on this.

**Cross-refs:**

- `.github/workflows/e2e.yml` lines 58-61 (existing placeholder fallback comment)
- PR #22 (`feature/be-m1-users-schema` HEAD `f5f9d43`) — blocked
- PR #23 (`fix/ci-embedding-model-id` HEAD `4bb478c`) — drift D2 + Path δ instrumentation; merge first
- `docs/plans/01-pm1-execution-plan.md` drift D2 (env-var alignment, NOW resolved by PR #23)
- `docs/eod-reports/2026-05-03-day-7.md` (full investigation timeline)

---

## [2026-05-02] (r) Audit log span correlation — wire trace_id/span_id into audit_log + back-pointer attribute — M1 MORNING

**Symptom (Day-5 code audit FIND-5):** `auditService.write()` writes a Postgres row. `tracer.startActiveSpan('llm.complete', ...)` (Day-5 #3) emits a Grafana span. The two events have no correlation field. Incident postmortems that need to bridge "this audit row" ↔ "this trace" rely on timestamp + actor_id heuristics — brittle.

**Decision (M1 morning, ~1.5 hr):**

1. Migration: add `trace_id VARCHAR(32) NULL` + `span_id VARCHAR(16) NULL` columns to `audit_log` table. Raw SQL per ADR-002 split.
2. `AuditService.write()` reads `trace.getActiveSpan()?.spanContext()` and populates the new columns.
3. Conversely, when an audit row is written inside an active span, set span attributes `audit_log.row_id` + `audit_log.kind` so Grafana can link forward to F28 Settings & Audit URL.
4. F28 UI (M1) renders the trace_id as a link to Grafana Tempo when present.

**Owner:** BE chat (M1 morning, before F28 ships).

**Cross-refs:** PM1_ERD §3.13 (audit log) · `.claude/rules/api.md` (OTel binding rule) · `docs/audits/code-audit.md` FIND-5.

---

## [2026-05-02] (q) Test coverage for packages/shared schemas — M1 FIRST HALF

**Symptom (Day-5 code audit FIND-2):** `apps/api/src/` has 84 jest tests across 5 spec files (good). `packages/shared/src/` has **zero** tests despite owning the canonical Zod schemas that BE↔FE depend on. A subtle regression — say relaxing `.min(1)` to `.min(0)` — wouldn't be caught by typecheck.

**Decision (M1 first half, ~3 hr):**

1. Add `packages/shared/src/__tests__/schemas.spec.ts` with one happy-path + 2-3 edge-case tests per schema in `packages/shared/src/schemas/*`.
2. Aim for 40-60 tests covering the canonical request/response shapes used by BE controllers + FE forms.
3. Use jest with the same `passWithNoTests` pattern as the existing test:smoke setup.
4. **Defer apps/web unit tests** — Pattern A means components are mostly intent-routing + render. Visual gates + Playwright e2e cover the meaningful regressions. RTL would be high-cost / low-marginal-value.

**Owner:** BE chat owns shared schemas; tests land alongside the M1 endpoint expansion. FE chat skips per recommendation above (revisit M2 if a concrete miss surfaces).

**Cross-refs:** `docs/audits/code-audit.md` FIND-2 · `packages/shared/src/schemas/*`.

---

## [2026-05-02] (p) Audit-log discipline static-analysis gate — DAY 6 MORNING P1

**Symptom (Day-5 code audit FIND-1):** PM1_ERD §3.13 + CLAUDE.md Hard Rule 7 + `.claude/rules/api.md` all bind: every state-changing endpoint (POST/PUT/PATCH/DELETE) must write an audit row synchronously. Day-5 audit identified at least **10 such endpoints** across 6 controllers — but did NOT verify each one actually writes via `auditService.write(...)`. Could be 100% compliant. Could be 50%. **Unknown coverage = compliance gap.**

**Decision (Day-6 morning, ~40 min):**

1. **(~30 min)** Write `scripts/audit-discipline-check.sh`:
   - Greps every `@Post`/`@Put`/`@Patch`/`@Delete` decorator in `apps/api/src/**/*.controller.ts`
   - For each match, scans the surrounding method body (next ~50 lines until next class member) for `auditService.write(` or `audit.write(`
   - Allows `// audit-exempt: <reason>` markers (e.g. otel-test endpoints don't need rows)
   - Lists violations + returns non-zero
2. **(~10 min)** Wire as `.husky/pre-push` gate 4/4 (alongside typecheck, frozen-lockfile, CHANGELOG).
3. For each violation surfaced: either add `auditService.write(...)` OR add the explicit exempt marker.

**Acceptance:** zero violations after Day-6 morning fix-up; gate self-validates on the next push.

**Owner:** MAIN (Day-6 morning).

**Cross-refs:** PM1_ERD §3.13 · CLAUDE.md Hard Rule 7 · `.claude/rules/api.md` "Audit log" section · `docs/audits/code-audit.md` FIND-1.

---

## [2026-05-01] (o) FE/MAIN long-session image-dimension API errors — DEV-EXPERIENCE — IMMEDIATE

**Symptom (recurring twice during M1 prep):** FE chat session crashes with `An image in the conversation exceeds the dimension limit for many-image requests (2000px). Start a new session with fewer images.` after ~5+ visual-gate cycles. Forces context loss + brief recovery into a new session. Hit twice during F28 commit phase on Day 5.

**Root cause:** macOS retina captures screenshots at 2x — a `1440px` viewport screenshot is actually saved as 2880px. Anthropic's API rejects accumulated >2000px-dimension images in many-image requests. M0 (12 frames × 2 viewports) + M1 (3 frames × 2 viewports) = 30+ screenshots in FE's session by M1 commit time.

**Recurrence cost:** ~10-15 min per crash (recovery brief + context loss). Will recur every 5-7 visual gates (every 1-2 days at current pace) without a fix. Across PM1 (38 more frame ports M2-M5) = ~6-10 more crashes if unaddressed.

**3-layer permanent fix:**

### Layer 1 — Auto-resize pre-commit hook (~15 min build, 0 ongoing cost)

Append to `.husky/pre-commit`:

```bash
# Resize docs/screenshots/*.png to max 1500px wide before commit
for f in $(git diff --cached --name-only --diff-filter=ACMR | grep -E "^docs/screenshots/.*\.png$"); do
  if [ -f "$f" ]; then
    actual_width=$(sips -g pixelWidth "$f" | tail -1 | awk '{print $2}')
    if [ "$actual_width" -gt 1500 ]; then
      echo "  📐 Resizing $f from ${actual_width}px → 1500px wide"
      sips -Z 1500 "$f" --out "$f" > /dev/null
      git add "$f"
    fi
  fi
done
```

Uses macOS native `sips` (no install needed). Lossless quality drop is imperceptible at viewport sizes. Existing >2000px screenshots get caught + resized when they next pass through commit.

### Layer 2 — Session discipline (CLAUDE.md Hard Rule 14)

Add to CLAUDE.md Hard Rules:

> **14. FE/MAIN chat sessions MUST restart at every PR boundary OR every 5 visual gates, whichever comes first.** Image accumulation in long Cowork sessions causes recurring `image dimension exceeds 2000px` API errors. Per-PR sessions keep context bounded. Each new session loads a 1-paragraph "where I left off" brief from the previous session's last message — total restart overhead ~2 min vs ~30 min spent debugging mid-PR API failures. Established 2026-05-01 after F28 commit hit the API limit twice in a row.

### Layer 3 — Locked HTML never inline-loaded into chat context

Add to FE/MAIN compact instructions (CLAUDE.md):

> Locked HTML files in `PM1_UI_v2/` are REFERENCE ONLY. Never load full file into chat context (50-200KB each). Use Read with `offset` + `limit` to scan sections; otherwise read the structure summary in the corresponding frame `.md` description file. Same caution applies to chunky `CHANGELOG.md` and `docs/` files >50KB.

**Owner:** MAIN (Layer 1 + Layer 2 + Layer 3 wiring) + PM/Cowork (CLAUDE.md edit + verification).

**ETA:** Day 5 evening or Day 6 morning. ~30 min total.

**Acceptance:** zero `image dimension exceeds 2000px` errors observed across the next 10 visual-gate cycles AFTER hook lands. Confirmed by FE + MAIN reporting clean session lifecycles in EOD.

---

## [2026-05-01] (n) OTel metrics SDK wire — MeterProvider + 3 named meters — DAY 6 / M0 close window

**Status:** Day-5 OTel wire shipped traces (LLM gateway `llm.complete` span) + `/admin/otel/test-trace` endpoint + `/health` env_present diagnostics. **Metrics SDK setup deferred** to Day-6 because the no-op tracer already provides full trace observability once env vars land; metrics adds value but isn't blocking M0 close.

**Day-6 scope (~1-1.5 hr):**

1. Add `MeterProvider` + `PeriodicExportingMetricReader` + `OTLPMetricExporter` to NodeSDK config in `apps/api/src/observability/otel.config.ts`. Pointed at `GRAFANA_CLOUD_OTLP_ENDPOINT/v1/metrics`.
2. Create `apps/api/src/observability/metrics.ts` exposing 3 named meters via `metrics.getMeter('qa-nexus-api')`:
   - `embedding.latency_ms` — histogram, observed in `EmbeddingService.embed()`
   - `audit_log.writes_total` — counter, incremented in `AuditService.write()`
   - `llm.tokens_total` — counter labeled `{provider, model, kind: input|output}`, incremented in `LLMGatewayService.completeInternal()` (alongside the existing span attributes)
3. Tests verify the meters emit on call (mocked `metrics.getMeter` returns a fake meter that records calls).
4. Update `/health` to surface `otel.metrics.exporter` status + `last_export_at` (similar to traces/logs).

**Owner:** MAIN.

**ETA:** Day-6 morning, ~1-1.5 hr.

**Cross-refs:**

- `apps/api/src/observability/otel.config.ts` — where MeterProvider goes
- `.claude/rules/api.md` — binding rule on LLM gateway spans (already covered by Day-5 work; metrics is bonus)
- ADR-009 + ADR-003 amendment — for context on why deferred-mode-by-default is the pattern

---

## [2026-04-30] (m) R2 free-tier quota alert system — Yogesh login banner — M1 USER-FACING

**Symptom (Day-4 afternoon):** During R2 provisioning (T013), Yogesh added a Cloudflare credit card to enable R2 (free-tier still $0/mo, but requires card on file). He flagged a real risk: **a runaway upload — bug, infinite loop, or compromised credential — could silently exceed the 10 GB-month free tier and start billing his personal card**. He explicitly asked: "I want alert before my money cut. When 50% reached, then after every 10% — 60, 70, 80, 90, and 100% limit reach. Can you make one pop up alert come on the website when me Yogesh login?"

**Belt-and-suspenders status:**

- **Belt 1 (Cloudflare-side):** $1 spending alert configured at Members & Billing → Spending Alerts → $1 USD threshold. This is Cloudflare's native — fires email if spend > $1 in a billing cycle. Useful but external (email, not in-app) and only fires AFTER overage starts.
- **Belt 2 (THIS FOLLOWUP):** in-app banner system on Yogesh's QA Nexus login that surfaces R2 usage at 50/60/70/80/90/100% thresholds — fires BEFORE overage, not after.

**Why an in-app banner is required (not just Cloudflare's email):**

1. Email alerts are easy to miss / route to spam / mark as unread. An in-app banner that's IMPOSSIBLE to dismiss until ack'd forces the conversation.
2. Cloudflare's free-tier monitoring is byte-counted at the bucket; QA Nexus knows WHICH project / WHICH user is the heavy uploader. The banner can name names ("RET project up 4.2 GB this week — Akshay's Sprint 42 evidence pack ingestion is the driver").
3. Yogesh is the deployer-admin (per Day-0 bootstrap, RBAC role = Admin). Surfacing this only to him keeps it out of QA Engineers' faces — they're not the ones who pay if it overflows.

**Design (M1 owner: BE chat + FE chat collaboration):**

### BE side (apps/api/src/observability/r2-quota.service.ts)

1. **Cron job** running every 30 min (NestJS `@Cron('*/30 * * * *')` — Node-cron, no Redis dependency, lives in same process):
   - Calls Cloudflare R2 API `HEAD https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/r2/buckets/qa-nexus-evidence-pm1/usage` (or equivalent — confirm exact endpoint at impl time)
   - Reads `total_bytes` field, computes `pct = total_bytes / (10 * 1024^3)`
   - Persists snapshot to `r2_quota_log` table: `{ snapshot_at, total_bytes, total_objects, pct, threshold_crossed }`
2. **Threshold detection:** compare current `pct` against last snapshot's `pct`. If a 10-pp threshold (50, 60, 70, 80, 90, 100) was crossed UPWARD since last snapshot, set `threshold_crossed` to that value AND insert a row into `notifications` table targeted at user_id=Yogesh's UUID (RBAC role = Admin only).
3. **Per-project breakdown:** for the alert payload, also query R2 list-objects with prefix per project (`projects/RET/`, `projects/CART/`, etc.) and rank top-3 contributors. This lets the banner say "RET 4.2 GB / CART 1.8 GB / PAY 0.6 GB — RET ingest is the driver".
4. **Rate limit:** never fire the same threshold twice in 24h (de-bounce on `r2_quota_log.threshold_crossed`).
5. **Test:** unit test the cron logic with Cloudflare API stubs at 49% / 51% / 99% / 100% transitions; verify exactly one notification per threshold crossing.

### FE side (apps/web/components/admin/r2-quota-banner.tsx)

1. **Top-strip banner** rendered ONLY when `useCurrentUser().role === 'Admin'` AND there's an unacknowledged `r2_quota` notification in the user's notifications feed.
2. **Severity-colored:**
   - 50-69% → blue info banner ("Heads up — R2 usage at 56%. RET 3.8 GB is the driver.")
   - 70-89% → amber warn banner ("R2 usage at 78%. Consider archiving old runs from RET. Top 3: …")
   - 90-99% → red danger banner ("R2 usage at 94%. NEW UPLOADS WILL FAIL AT 100%. Archive or upgrade.")
   - 100%+ → red blocking banner WITH the upload-blocked state surfaced + immediate ack required to dismiss
3. **Always shows top 3 project contributors + bytes-per-project** (data from BE breakdown).
4. **Ack mechanism:** dismissable per threshold (50% banner dismissable independently of 60%) but re-fires next time it crosses upward. Once dismissed, FE writes `notifications.acknowledged_at`.
5. **F25 Executive Dashboard** also gets a small R2 usage tile (read-only — banner is the action surface, dashboard is the trend surface). Tile shows the last 14 snapshots as a sparkline.

### Schema migration (BE — adds 1 table)

```sql
CREATE TABLE r2_quota_log (
  id BIGSERIAL PRIMARY KEY,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_bytes BIGINT NOT NULL,
  total_objects INT NOT NULL,
  pct NUMERIC(5,2) NOT NULL,
  threshold_crossed SMALLINT NULL,  -- 50/60/70/80/90/100 if a threshold was crossed UPWARD; NULL otherwise
  per_project_bytes JSONB NOT NULL,  -- {"RET": 4200000000, "CART": 1800000000, ...}
  CONSTRAINT pct_range CHECK (pct >= 0 AND pct <= 200)  -- allow 100-200% to capture overage in case alert lag
);
CREATE INDEX r2_quota_log_snapshot_at ON r2_quota_log (snapshot_at DESC);
CREATE INDEX r2_quota_log_threshold ON r2_quota_log (threshold_crossed) WHERE threshold_crossed IS NOT NULL;
```

(Notifications table already exists per PM1_ERD §3.x — this followup just inserts new rows of `kind = 'r2_quota'`.)

### Acceptance gate

1. Manual smoke: at M1 acceptance, simulate by inserting 3 large dummy files into R2 totalling ~5.5 GB → verify cron fires within 30 min → verify Yogesh sees blue 50% banner on next login → verify ack persists → verify dashboard tile shows the spike.
2. Unit-test coverage: 6 threshold transitions (49→50, 59→60, …) + de-bounce + RBAC scoping (QA Engineer login does NOT see the banner even if user_id matches).
3. Manual test "what if Cloudflare API is down": cron should log + skip + retry next interval; never crash the API.

### Cross-references

- **Hard Rule 1** (CLAUDE.md) — $0/mo gate. This system is the safety net keeping it true.
- **PM1_PRD §10 NFR-001** (responsiveness) — banner must render at 320 / 1440 per CLAUDE.md Rule 12.
- **PM1_ERD §3.x** (notifications table) — new row kind `r2_quota`.
- **F25 Executive Dashboard** — gets read-only tile.
- **Cloudflare R2 API docs** — confirm exact bucket-usage endpoint at impl time; if not available, fall back to S3-compatible `HEAD bucket` with `--summarize` per S3 API spec.

### Owner

BE chat (cron service + schema migration + Cloudflare API client) + FE chat (banner component + dashboard tile + RBAC scoping).

### ETA

**M1** — Users & Roles milestone (Day-12 → Day-18 per MILESTONE_REGISTRY). Same milestone where F27 Admin user-management lands, since the banner is admin-only.

### Cost vs benefit

- Build cost: ~6 BE hours (cron + Cloudflare API client + schema + tests) + ~4 FE hours (banner + dashboard tile + tests). Total ~10 hours over 2 days at M1.
- Risk avoided: silent R2 overage → unbounded billing on Yogesh's personal card. Even one overage event over the 12-month pilot would cost more in $ + trust than the build cost.

---

## [2026-04-30] (l) Embedding model quality eval — bge-small vs bge-large at A1 Scribe retrieval time — M3 STRATEGIC

**Symptom (Day-4 afternoon):** Render Free 512 MB dyno OOM-crash-looped when EmbeddingService loaded `Xenova/bge-large-en-v1.5` (~470 MB resident in WASM). NestJS baseline + Prisma + R2 client + LLM gateway = ~520 MB total — over the 512 MB cap. Pod kicked every ~2 min; /health unreachable.

**Tactical fix landed Day-4 afternoon:** swap `EMBEDDING_MODEL_ID` env var → `Xenova/bge-small-en-v1.5` (33 MB resident, MTEB avg 62.17 vs 64.23 = −2.06 pt quality cost). ADR-003 amended. Pre-flight memory guard added to `EmbeddingService.checkMemoryHeadroom()` to prevent future config drift back to bge-large without intent.

**Strategic question deferred to M3:** is the −2 MTEB quality cost acceptable for A1 Scribe's actual retrieval workload? MTEB is a synthetic benchmark; real test-case retrieval may show smaller (if the corpus is structured) or larger (if free-text-heavy) deltas.

**Decision required at M3 boundary** (when A1 Scribe wires real retrieval — currently scaffold-only):

1. **Keep bge-small** if side-by-side eval shows acceptable retrieval quality. Lowest cost, fits Render Free comfortably.
2. **Move to bge-base-en-v1.5** (110 MB resident, MTEB ~63.5 — middle option) if bge-small misses obvious retrievals but the pilot can spare ~150 MB headroom on Render Free.
3. **Move back to bge-large + offload** via Cloudflare Workers AI free-tier embeddings endpoint (1024-dim BGE available there) OR Render One-Off Job for batch embeddings (free; runs nightly, results materialized into the `embedding` column).
4. **Upgrade Render plan** ($7/mo Standard) — **violates Hard Rule 1 + needs explicit ADR + Yogesh approval**. Last resort.

**Eval methodology (M3, when A1 Scribe lands real retrieval):**

- Build a corpus of ~50 representative test cases per project (RET, CART, PAY, AUTH, OPS) — ~250 total.
- Generate ground-truth retrieval pairs: for 30 sample queries, have Akshay or Yogesh manually mark the top-5 expected matches.
- Run side-by-side: bge-small vs bge-large embeds → cosine top-5 → compute recall@5, MRR, and "obviously-wrong" rate.
- Decision: if bge-small's recall@5 is within 5 pp of bge-large AND obviously-wrong rate < 10%, keep bge-small. Else escalate per options 2-4.

**Owner:** BE chat (eval implementation) + Yogesh + Akshay (ground-truth marking).

**ETA:** M3 (after T036 A1 Scribe ships real retrieval — currently scaffold; estimate Day-12 to Day-15).

**Cross-references:**

- ADR-003 (embedding model selection) — Day-4 amendment captures the bge-small swap
- `apps/api/src/embedding/embedding.service.ts` — pre-flight memory guard (`checkMemoryHeadroom()`)
- `apps/api/src/embedding/__tests__/embedding-graceful.spec.ts` — guard regression tests
- `MODEL_MEMORY_MB` table in `embedding.service.ts` — add new models here after measurement

---

## [2026-04-30] (k) Live LLM gateway + A1 Scribe validation — DEFERRED to Render-deploy day

**Symptom:** Day-4 noon brief Block 1 (live `/llm/test` happy + fallback + long-context + benchmark) and Block 2 (A1 Scribe real-LLM smoke) require a reachable API origin with `GROQ_API_KEY` + `GEMINI_API_KEY` set. At Day-4 morning start, `https://qa-nexus-api.onrender.com/health` returned 404 — Render slot exists but no app bound. Yogesh hasn't completed provisioning yet.

**Decision:** package the entire validation as a single re-runnable script (`scripts/llm-gateway-validation.sh`) so the moment Yogesh signals "Render is up + keys set" the BE chat fires it in one command and commits the report.

**Owner:** BE chat — fires on Yogesh's signal. Estimated wall time: ~30s. Cost: ~12 Groq RPD (0.8% of daily quota).

**Pre-work landed today** (Day-4 PR):

- `scripts/llm-gateway-validation.sh` — covers blocks (a)-(e) with `set -euo pipefail` + idempotent markdown-append output to `docs/observability/llm-gateway-validation-YYYY-MM-DD.md`.
- `docs/observability/llm-gateway-validation-2026-04-30.md` — placeholder explaining deferral + how to run when keys land.

**Closes:** Day-4 noon brief Blocks 1 + 2.

---

## [2026-04-29] (j) CI must run on push to main, not just on PRs — OBSERVABILITY HOLE — **CLOSED 2026-04-30**

**Resolution:** Day-4 morning, ~10 min. Added `push: branches: [main]` trigger to `.github/workflows/ci.yml` and `.github/workflows/e2e.yml`. The e2e workflow keeps the same path filter on the push trigger so pure docs/config pushes still skip. Verified by pushing this very commit and watching CI fire on the push event.

**Symptom:** Day-3 evening seed-centralization scaffold (commit `6385e25`) and the T031 e2e workspace scaffold were pushed directly to `main` and broke 3 of 7 CI jobs (typecheck, test, build). The breakage went undetected until PR #11 opened the next morning, blocking the entire Day-3 stretch merge cascade (PRs #11/#12/#13). Hotfix landed in this PR.

**Root cause:** `.github/workflows/ci.yml` triggers only on `pull_request: branches: [main]`. Direct-to-main commits — which happen for trivial doc/fix changes that don't warrant a PR — are never validated by CI. Any regression in such a commit lurks until the next PR is opened, then surfaces as "PR #N is failing CI for reasons unrelated to its diff" and blocks merges until the regression is found.

**Risk:** every direct-to-main commit is a silent landmine. Worse: the engineer who pushed direct-to-main isn't the one who hits the failure — the next PR author is. Trust in CI suffers ("CI is flaky / not my code's fault").

**Decision (Day-4 morning P1, ~10 min):**

1. **`.github/workflows/ci.yml`** — add `push: branches: [main]` alongside the existing `pull_request` trigger:
   ```yaml
   on:
     pull_request:
       branches: [main]
     push:
       branches: [main]
   ```
2. **`.github/workflows/e2e.yml`** — same change (e2e workflow currently only triggers on PR paths).
3. **Branch protection** — already requires CI green to merge to main, so this change has no merge-blocking impact for direct pushes (they're already on main); the value is detection latency: regressions surface within ~5 min of `git push origin main` instead of hours later when the next PR opens.
4. **Concurrency** — keep `concurrency.cancel-in-progress: true` so a rapid sequence of direct pushes doesn't queue stale runs.

**Followup-of-followup:** consider a `direct-to-main-policy.md` rule in `.claude/rules/` documenting which kinds of changes are OK to push direct (docs typo, comment-only, EOD reports) vs which require a PR (anything touching `apps/**/src` or `packages/**/src`, any CI/workflow file, any `.claude/hooks/`). The pre-push CHANGELOG guard already partially enforces this for source code; extending it to workflows + hooks would close the loop.

**Owner:** MAIN (Day-4 morning, batched with seed-centralization Phase-5 review).

---

## [2026-04-29] (i) Centralize demo seed data + decouple UI from hardcoded names — **CLOSED 2026-04-30**

**Resolution:** seed-centralization landed in two PRs, then refined post-merge:

- **PR #16** (Day-3 stretch FINAL evening, `089a999`) — F08a + F08b + F08c migrated. Surfaced the "view-fixtures-vs-identity" insight: data.ts files stay as VIEW-ONLY fixture stores; only ENTITY IDENTITY exports (SIGNED_IN_USER, ACTIVE_PROJECT) move to context providers. View fixtures get replaced by future M2/M3/M4 endpoints (run results, defect lists, agent activity feeds), NOT by user/project APIs the contexts swap to. Captured as ADR-006 Refinement section.
- **PR #17** (Day-4 morning, `22927a5`) — F09 + F10 (Projects List + Create Project Modal) migrated following the refined pattern. 8 RWD pre/post screenshots committed (320 + 1440 × projects-list + projects-create); pre/post deltas ~1% confirming pixel-near-identical output. All 5 originally-spec'd components now using `useCurrentUser` / `useActiveProject` / `useTeamRoster` for entity identity.

**Owner:** MAIN scaffolding (Day-3 evening, ADR-006 + 3-layer architecture) + FE chat per-component refactors (PR #16 + PR #17).

---

## [2026-04-29] (i) [historical] Centralize demo seed data + decouple UI from hardcoded names — DAY-4 MORNING P1

**Symptom:** F08a (`apps/web/components/home/data.ts`), F08b (`apps/web/components/home-lead/data.ts`), F08c (`apps/web/components/home-empty/data.ts`), F09 (Projects List), F10 (Sprint Board) all have inline `data.ts` files with hardcoded references to the 8 named Iksula pilot users (Akshay, Yogesh, Kishor, Nitin, Nadim, Govind, Mohanraj, Sagar) and the 5 Iksula projects (RET, CART, PAY, AUTH, OPS). The data is correct per IKSULA_CONTEXT.md but **architecturally wrong**: stub data lives in component files instead of a single source.

**Risk:** when **F27 Admin user-management** lands (M1) or **F28 Project CRUD** lands (M2), Admin can create new users + projects via the UI. Every component with an inline `data.ts` will need a source-code change to display the new entries — breaks the "Admin creates users → UI shows them" contract. This is the primary "demo-seed-rot" anti-pattern that bites every product when the seed survives past the M0 demo gate.

**Decision (made Day-3 evening):** centralize NOW, before more components copy the same anti-pattern. Clean separation of concerns:

- **MAIN owns:** `packages/shared/src/seed-types.ts` (typed contracts) + `apps/web/lib/demo-seed.ts` (single source) + `apps/web/lib/contexts/*` (React context providers `useCurrentUser`, `useProject`, `useTeamRoster`) + the migration runbook.
- **FE owns:** the per-component refactor — replace `import { ... } from './data'` with `useTeamRoster()` etc, delete the per-component `data.ts` files.

**Phases (this Day-3 evening session):**

1. **Phase 3(a):** `packages/shared/src/seed-types.ts` — typed interfaces for User, Project, TestCase, Defect, RunResult, AgentActivity, Approval. Each interface matches what the BE API will return when T021 + endpoints land. Barrel-exported.
2. **Phase 3(b):** `apps/web/lib/demo-seed.ts` — SINGLE source of all stub data. Header explicitly marks as DEMO + lists what BE endpoint replaces each array.
3. **Phase 4 (TBD per spec — Yogesh's message truncated):** likely React context providers + ADR-006 + migration runbook for FE.

**Day-4 morning protocol:** FE chat reads `docs/refactor/seed-centralization-migration.md`, refactors components one by one. Each FE PR closes one component (F08a → F08b → F08c → F09 → F10). MAIN reviews each PR for "no new inline data.ts" + "all usage via context hooks".

**ADR target:** `docs/architecture/adr-006-seed-data-centralization.md` — accepted, alternatives considered (per-component data.ts → status quo, BE-mock-server → over-engineered for PM1, Storybook fixtures → wrong tool, MSW → relies on HTTP we don't have yet). Filed as part of Phase 3 below.

**Owner:** MAIN (scaffolding tonight, Phases 3-4) + FE chat (refactor Day-4 morning).

**ETA:** ~1.5-2 hr scaffolding (this session) + ~1.5 hr FE refactor (Day-4 morning).

**Cross-references:**

- `apps/web/components/home/data.ts`, `apps/web/components/home-lead/data.ts`, `apps/web/components/home-empty/data.ts` — the per-component anti-pattern instances to migrate
- `IKSULA_CONTEXT.md` — the 8-user / 5-project canon that the seed must remain consistent with
- `PM1_PATTERNS.md` Pattern A — the deferred-routing ancestor pattern this builds on
- ADR-002 (Prisma raw split) — analogous "shared infrastructure has implicit version coupling" pattern

---

## [2026-04-29] (h) Zod 3 / Zod 4 ecosystem migration — DAY 7-8 STRATEGIC

**Symptom:** within 24 hours, **two** packages auto-resolved to versions requiring Zod 4:

1. **Day 2 evening:** `@hookform/resolvers/zod` started pulling in Zod 4 internals via the `$ZodTypeInternals` shape (followup f, fixed via root `pnpm.overrides.zod = "^3.25.76"`).
2. **Day 3:** `better-auth ^1.2.0` resolved up to `1.6.9` which uses `z.coerce.boolean().meta(...)` — a Zod 4 method — and crashed boot. BE chat patch-pinned to `~1.2.0` (Day-3 BE worktree CHANGELOG entry).
   - **BE-specific detail:** also dropped the `metadata` arg from `magicLink.sendMagicLink` callback in `apps/api/src/auth/auth.config.ts` (added in better-auth 1.4+; not in 1.2.x signature).

**Trend:** the Zod 3 → 4 migration is sweeping the JS/TS ecosystem in Q2 2026. Every week we delay, more transitive deps will force tactical pins. Each pin is ~15 min of investigation + commit + audit; the friction compounds.

**Recommendation:** schedule an **atomic Zod 4 migration as a Day 7-8 task** (after M0 hosting deploys land but before M1 endpoint expansion). One focused day:

- Bump root `pnpm.overrides.zod` to `^4.x` + remove the override entirely (let upstreams resolve naturally).
- Update `packages/shared/src/schemas/*` to Zod 4 syntax (largely back-compat; main breaks are `.strip()` removal + new `.meta()` method shape).
- Update `apps/api`'s `ZodValidationPipe` to use `result.error.issues` shape changes (Zod 4 renamed some fields).
- Update `apps/web`'s `zodResolver` import to `@hookform/resolvers/zod@^4.x`.
- Update `.claude/locked-deps.json` paired-major lock from `{ zod: "3", "@hookform/resolvers": "3" }` to `{ zod: "4", "@hookform/resolvers": "4" }`.
- Smoke-test BE auth + FE form validation + R2 upload Zod schemas + LLM gateway request schemas (from BE T023).
- 1 focused day beats accumulating 2-3 weeks of tactical pins.

**Owner:** BE chat (lead — touches the most surface) + FE chat (apps/web schemas).

**ETA:** ~1 day (Day 7 or Day 8 — slot when no other major M0 work is in flight).

**Closes:** alongside this migration, `STACK_LEARNINGS.md` `[ZOD]` + `[ZOD][TS]` entries get a "MIGRATION COMPLETE" addendum and the followup (c) zod-resolvers coupling note becomes historical context.

**Cross-references:**

- followup (c) — original zod-resolvers coupling prediction (Day 1 evening)
- followup (f) — first materialization (Day 2 evening, fixed via override)
- BE worktree CHANGELOG (Day 3) — second materialization with better-auth
- `STACK_LEARNINGS.md` `[ZOD]` and `[ZOD][TS]` entries
- `.claude/locked-deps.json` — paired-major lock (currently zod=3)
- root `package.json` `pnpm.overrides.zod` — the existing pin

---

## [2026-04-28] (g) Stakeholder Home — no locked frame, design ambiguity

**Identified during:** Day-2 stretch session, FE F08b port.

**Symptom:** The FE chat's brief described a "Stakeholder Home" frame, but **no such locked HTML exists in `PM1_UI_v2/`** (neither in `frame  html view/` nor in `frames - claude code build (PM1 v2.6-v2.8)/`). F07c's "Skip → F08b" routing assumes Stakeholder uses the same dashboard frame as Lead with role-gated content. Alternative interpretation: Stakeholder lands on F24 (QA Value Dashboard) directly, since they're a read-only/exec persona who'd prefer a value-summary view over a queue/board.

**Two candidate resolutions (pick ONE Day 3+ after design review):**

1. **Lock a new F08d Stakeholder Home frame.** Use F08b as the starting point; prune to read-only widgets (no "Take" actions, no inline edit, drop the My Queue card or replace with "Recently Reviewed"). Designer + Yogesh own the frame creation. Once locked, FE re-routes F07c Skip → `/home/stakeholder/`. Adds ~1 frame to the 41-frame inventory (now 42).
2. **Deprecate the "Stakeholder Home" concept.** Update F07c routing to land Stakeholders on F24 (QA Value Dashboard) directly — that frame already exists, already locked, already read-only by design. No new frame needed; just a routing tweak. Costs nothing in design budget but means Stakeholders lose the "today's status" lens until they navigate to the workspace's project-board view.

**Recommendation (engineering perspective):** option (2) is the lower-risk path — F24 already exists, already locked, designed for the exec persona. Option (1) re-opens the design-freeze door, which is risky 8 days into a 10-day M0. But this is a UX call, not engineering's to make alone.

**Owner:** PM (this chat) + Yogesh. Designer review to confirm intent.

**When:** after PM1 design freeze review (post-M0 review window, target Day 10–11).

**Action items if option (2) chosen:**

- Update F07c routing constant: `STAKEHOLDER_NEXT = '/value-dashboard'` (or whatever F24's route is) instead of `/home/stakeholder/`.
- Update PM1_PRD §<wherever Stakeholder onboarding flow is documented> to clarify "Stakeholder skips home" if PRD currently implies a Stakeholder home.
- Update `IKSULA_CONTEXT.md` memory note: "no Stakeholder users in pilot — reserved for future PM2/PM3" already explains why this is low-priority for PM1.

**Action items if option (1) chosen:**

- Designer creates `F08d Stakeholder Home.html` in `PM1_UI_v2/frame  html view/`.
- Frame inventory updates from 41 → 42 across CLAUDE.md + skill audit + binding-context hook.
- FE chat ports F08d as MS0-T030.f (or post-M0 if past freeze).

**Cross-references:**

- `PM1_UI_v2/frame  html view/F07c Invited - Stakeholder.html` — the source of the routing question
- `PM1_UI_v2/frames - claude code build (PM1 v2.6-v2.8)/F08b ...` — the QA-Engineer home that Stakeholder might or might not share
- `PM1_UI_v2/frames - claude code build (PM1 v2.6-v2.8)/F24 QA Value Dashboard.html` — the alternative-2 landing target
- `IKSULA_CONTEXT.md` § "Stakeholder role" — context that pilot has no Stakeholders, lowering urgency

---

## [2026-04-28] (f) P0 Day-3 morning — zod 3 ↔ zod 4 dual-install after BE PR #6 merge ✅ CLOSED 2026-04-28 EVENING

**Closed by:** root `package.json` `pnpm.overrides.zod = "^3.25.76"` (Day-2 stretch session, Block 1). Option 1 from the candidate list applied. **Plus a discovered gotcha:** clearing `apps/web/tsconfig.tsbuildinfo` and `apps/api/.tsbuildinfo` was REQUIRED — TypeScript's incremental compilation cache had stale Zod 4 type resolutions even after the lockfile re-resolved. Without the cache clear, typecheck kept showing `$ZodTypeInternals` errors despite only zod@3.25.76 being symlinked into apps/web/node_modules/zod. Documented in `STACK_LEARNINGS.md` `[ZOD]` entry as a recovery step for future workspace-wide dep changes.

Both typechecks now exit 0. better-auth runtime smoke-test deferred to Day 3 BE chat (the override forces better-auth to use Zod 3 at runtime; need to verify it doesn't actually depend on Zod 4 features).

---

## [2026-04-28] (f) [original] P0 Day-3 morning — zod 3 ↔ zod 4 dual-install after BE PR #6 merge

**Symptom:** post-merge of BE PR #6 (`7f60b8e`) which introduced `better-auth` dep, `pnpm install` resolves TWO Zod versions in `node_modules/.pnpm/`:

- `zod@3.25.76` (declared by packages/shared 3.23.8, apps/api 3.23.8, apps/web 3.25.76)
- `zod@4.3.6` (transitively pulled in by `better-auth`)

`pnpm typecheck` then fails on apps/web with: `Type 'ZodObject<...>' is missing the following properties from type 'ZodType<any, any, $ZodTypeInternals<any, any>>': def, type, toJSONSchema, check, and 18 more.` — Zod 4's internal type signature is incompatible with the `@hookform/resolvers/zod` import path apps/web uses.

**Why CI didn't catch it:** each PR was tested in isolation. BE PR #6 (zod 3.23 + better-auth → transitive zod 4) passed because BE doesn't use Zod for FE forms. FE PR #7 (zod 3.25 only) passed because no better-auth in scope. Combined dep graph post-merge surfaces the conflict.

**This is the materialized form of followup (c)** — the zod-resolvers paired-major lock we predicted yesterday. Confirmation came faster than expected (Day 2 evening, not "MS0-T004 landing").

**Fix candidates (pick ONE Day 3 morning, ~1h):**

1. **Pin Zod to v3 at the root level via `pnpm.overrides`.** Add to root `package.json`:

   ```json
   "pnpm": { "overrides": { "zod": "^3.25.76" } }
   ```

   This forces every transitive dep (including better-auth) to resolve to Zod 3. Risk: better-auth may break at runtime if it actually uses Zod 4 features. **Investigate before applying.**

2. **Upgrade everything to Zod 4 simultaneously.** Bump packages/shared + apps/api + apps/web to `zod ^4.3.6` AND `@hookform/resolvers ^4.x` (which supports Zod 4). Risk: larger blast radius; need to verify Zod 4 schema syntax is back-compat with our schemas.

3. **Pin better-auth to a version that uses Zod 3.** Check better-auth changelog for the version before they adopted Zod 4. May force pinning to an older better-auth (security risk if old version has CVEs).

**Recommended:** option 1 (pnpm.overrides Zod 3) as the fastest unblock; revisit option 2 if better-auth runtime breaks. Land the paired-major lock in `.claude/locked-deps.json` AT THE SAME TIME.

**Owner:** BE chat, Day-3 morning, BEFORE any other backend work.

**ETA:** ~1h (option 1 = 5 min change + smoke-test BE auth flow + smoke-test FE form validation; if better-auth breaks, escalate to option 2 ~3h).

**Closes followup (c) when shipped** (the paired-major lock makes this re-occur at a clear gate, not silently).

---

Canonical log for engineering followups (architecture decisions, hook drift, deferred installs). **Distinct from `docs/parallel-work/follow-ups.md`** — that one tracks parallel-chat-coordination items (rebases, merge conflicts); this one tracks structural / architectural decisions that need ADRs or implementation slots.

Convention: append at top with `[YYYY-MM-DD]` header. Cross-link to commit SHAs and ADR docs when they land.

---

## [2026-04-27] (a) ADR-002 — Prisma migrations vs `prisma/raw/` split ✅ CLOSED 2026-04-28

**Closed by:** `docs/architecture/adr-002-prisma-raw-split.md` (this commit). Three open questions resolved: (1) raw applied manually with human gate, formalized via `pnpm db:apply-raw`; (2) tracking via git history + idempotency contract; (3) idempotent-by-default rule. Pairs with closure of bonus (e) below.

---

## [2026-04-27] (a) [original] ADR-002 — Prisma migrations vs `prisma/raw/` split

**Context:** During MS0-T020, hand-written infra migrations (RLS policies, HNSW indexes, pgvector extension, audit-log triggers) couldn't live in Prisma's `migrations/` directory because Prisma's shadow-DB validator applies migrations in lex order. The original file `0_init_rls_hnsw/migration.sql` was failing because it referenced tables that hadn't been created yet by Prisma's auto-generated init migration.

**Resolution applied (in `e4869bb` → squashed to `a6644c1`):** relocated the file from `apps/api/prisma/migrations/0_init_rls_hnsw/` to `apps/api/prisma/raw/init_rls_hnsw.sql`. Applied via `prisma db execute --file prisma/raw/init_rls_hnsw.sql --schema prisma/schema.prisma` (manual one-shot during MS0-T020.5).

**Decision needed for ADR:** formalize the split convention as project policy:

- `apps/api/prisma/migrations/<timestamp>_*/` — Prisma-managed schema migrations (auto-generated by `prisma migrate dev`, applied by `prisma migrate deploy` in CI)
- `apps/api/prisma/raw/*.sql` — hand-written infra (RLS, HNSW, extensions, triggers, functions). Applied via `prisma db execute` with explicit human approval.

**Open questions to resolve in the ADR:**

1. How is `prisma/raw/` applied in CI? Currently no `db:apply-raw` script exists in `apps/api/package.json` (only `prisma:*` scripts). Add one + wire into the deploy workflow? Or keep it manual to enforce human approval on RLS changes?
2. How is the "applied" state tracked? Prisma tracks its own migrations in `_prisma_migrations` table; raw SQL has no equivalent. Add a `_raw_migrations` table with file hash + applied_at? Or trust git history?
3. Re-apply semantics: are `prisma/raw/*.sql` files idempotent (use `IF NOT EXISTS` everywhere) or one-shot (track applied state)? The current `init_rls_hnsw.sql` mixes both.

**Owner:** BE chat tomorrow morning, BEFORE T021 BetterAuth (because BetterAuth's session/account/verification tables also need RLS policies that follow this pattern).

**Output:** `docs/architecture/adr-002-prisma-raw-split.md` (new dir; ADR-001 doesn't exist yet — that one would be "Postgres + Prisma over alternatives", which we never formally documented but is implicit in the locked stack).

**ETA:** ~45 min (read existing raw SQL + draft ADR sections + cross-link to PM1_ERD §3 for the table inventory + commit).

---

## [2026-04-27] (b) P1.17 — Worktree hook drift, structural fix ✅ CLOSED 2026-04-28

**Closed by:** `.claude/hooks/session-start/sync-hooks.sh` (this commit). Picked option (i) from the original three candidates: SessionStart hook auto-syncs `.claude/hooks/` from `origin/main` on every chat start. Non-blocking; respects local uncommitted hook edits (skips auto-sync if `git diff -- .claude/hooks/` is dirty). Wired in `.claude/settings.json` under `hooks.SessionStart`.

---

## [2026-04-27] (b) [original] P1.17 — Worktree hook drift, structural fix

**Symptom:** Each new disposable Claude worktree starts off whatever SHA the parent process happened to be on, NOT the latest `origin/main`. This means new worktrees may not have the latest `.claude/hooks/` updates (e.g., `block-dangerous.sh` regex fix from P1.13 took 2 iterations to land in FE worktree because of stale hook).

**Specific failure mode observed Day 1:** FE chat's first force-push attempt was blocked by the OLD `block-dangerous.sh` (which didn't have the P1.13 flag-boundary regex yet), even though the fix had landed on main 30 minutes earlier. Yogesh had to manually push.

**Fix candidates (pick ONE):**

| #       | Approach                                                                                                                                                                                                                                                                      | Pros                           | Cons                                                                                                                                                                        |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **i**   | SessionStart hook that runs `git -C "$CLAUDE_PROJECT_DIR" fetch origin main && git checkout origin/main -- .claude/hooks/` before any tool call                                                                                                                               | Automatic; transparent to user | Risky — silently overwrites local hook changes the user may want; `git checkout origin/main -- .claude/hooks/` mid-session is confusing if they have uncommitted hook edits |
| **ii**  | Documentation only — every worktree creation MUST be from `origin/main`, not local `HEAD`. Update `scripts/refresh-worktrees.sh` to enforce this when creating new worktrees                                                                                                  | Simple; no surprise behavior   | Requires discipline; the gap reappears whenever someone forgets                                                                                                             |
| **iii** | Pre-flight check at the start of each Claude session that compares `.claude/hooks/` SHA against `origin/main:.claude/hooks/`. If drift detected, prompt "Update hooks from origin/main? [yes / no]". Implement as a SessionStart hook that exits 0 (info only, doesn't block) | User opt-in; visible           | Adds friction at session start; adds a hook that runs `git fetch` (network call) on every session                                                                           |

**Recommendation (my read):** option **iii**. Visible + opt-in + non-blocking. Can be a 30-line bash script.

**Owner:** MAIN, Day-2 morning. Pick one approach, implement, commit, push.

**ETA:** ~45 min (script + test + commit; or 5 min if option ii — just a doc edit).

---

## [2026-04-27] (c) Zod schema coupling — `packages/shared` ↔ `@hookform/resolvers/zod`

**Context:** Surfaced during FE PR #5 (F07 Founder Onboarding) review. The 3-step wizard uses `react-hook-form` + `@hookform/resolvers/zod` to validate fields against `LoginRequestSchema`-style Zod schemas. Once `MS0-T004` lands `packages/shared` as the canonical Zod-schema home (BE↔FE contract per `apps/api` Rule "Every endpoint must have a corresponding Zod schema in `packages/shared`"), the FE will import those same schemas instead of the local copies it carries today.

**The coupling risk:** `@hookform/resolvers/zod` peer-depends on a specific Zod major. If `packages/shared` upgrades Zod (e.g., 3.x → 4.x) without the FE simultaneously bumping `@hookform/resolvers`, the `zodResolver(schema)` call type-checks against a stale resolver shape and either (a) blows up at runtime with `zod.ZodError is not a constructor`-class issues, or (b) silently passes type validation but mis-parses fields. Tested today: works at Zod 3.23 + resolvers 3.9 (current), but no CI gate enforces the pairing.

**Sub-bullet — actions to land alongside `MS0-T004`:**

- Pin Zod in **root** `package.json` as a single `dependencies` entry (not in apps/web + apps/api + packages/shared independently). pnpm hoists, but explicit root pin is the contract.
- Add Zod and `@hookform/resolvers` to `.claude/locked-deps.json` as a **paired-major** entry: `{ "zod": "3", "@hookform/resolvers": "3" }`. Update `enforce-pm1-stack.sh` to fail the Edit if one moves without the other.
- Document in `apps/api/README.md` (or new `packages/shared/README.md` when created): "Zod major bumps require coordinated PR across api + web + shared + hookform/resolvers. No standalone Zod upgrade PRs."
- Add a 1-line CI assertion in `.github/workflows/ci.yml`: `node -e "const z=require('zod/package.json').version.split('.')[0]; const r=require('@hookform/resolvers/package.json').peerDependencies.zod; if (!r.includes(z)) process.exit(1)"`

**Owner:** BE chat (paired with `MS0-T004` packages/shared landing) + FE chat (verify `LoginRequestSchema`, `OnboardingStep1Schema`, etc. import from `@qa-nexus/shared` not local files).

**ETA:** ~30 min once `MS0-T004` is in flight (5 min per task above; no new code, just contract + lock).

**Cross-link:** see follow-up (a) ADR-002 — same "shared infrastructure has implicit version coupling" pattern as Prisma's `prisma/raw/` ↔ Prisma client major.

---

## [2026-04-27] (d) Lucide-react install decision

**Context:** F06 / F06b / F06c / F07 all use inline SVGs for icons (eye toggle, arrow, checkmark, X). Each is ~5-15 lines of JSX. The skill default was to install `lucide-react` and use `<EyeIcon />` etc.; PM1 deferred this on Day 0 to avoid premature optimization.

**Question:** at what point does inline-SVG accumulation justify installing lucide-react?

**Defer decision until F08 batch (Day 3+).** By then we'll have:

- F06 + F06b + F06c + F07 + F07b + F07c + F07d + F08 + F08a + F08b + F08c = 11 frames worth of icon usage data.
- Concrete numbers: how many distinct icons? How many duplicated inline SVGs?
- Bundle-size impact: `lucide-react` is tree-shakeable, so only used icons bloat the bundle.

**Decision criteria:**

- If we hit ≥15 distinct icons or ≥5 duplicated SVGs across frames → install `lucide-react`
- If <15 icons + low duplication → continue inline (smaller bundle, no dep)

**Owner:** FE chat at F08 kickoff (probably Day 3 or 4).

**No action tonight.** Just dockets the decision so we don't forget.

---

## [2026-04-27] (e) Bonus: missing `db:apply-raw` script — surfaced during PR #4 review ✅ CLOSED 2026-04-28

**Closed by:** `apps/api/package.json` `prisma:apply-raw` script + root `package.json` `db:apply-raw` proxy (this commit). Also referenced in ADR-002 §Decision and §Cross-references. Engineers can now run `pnpm db:apply-raw` from the repo root.

---

## [2026-04-27] (e) [original] Bonus: missing `db:apply-raw` script — surfaced during PR #4 review

**Context:** BE chat's PR #4 added `apps/api/prisma/raw/init_rls_hnsw.sql` but did NOT add a `db:apply-raw` script in `apps/api/package.json`. Currently the file must be applied via the verbose `prisma db execute --file prisma/raw/init_rls_hnsw.sql --schema prisma/schema.prisma` command from the README/commit message.

**Fix:** add to `apps/api/package.json` `scripts`:

```json
"prisma:apply-raw": "prisma db execute --file prisma/raw/init_rls_hnsw.sql --schema prisma/schema.prisma"
```

And to root `package.json` `scripts`:

```json
"db:apply-raw": "pnpm --filter api prisma:apply-raw"
```

This pairs with the (a) ADR above — once the ADR formalizes the split, this script is the executable shorthand. **Land both together** in tomorrow's BE chat.

**Owner:** BE chat, paired with (a) ADR-002.

**ETA:** ~5 min (just the script wiring).

---

## Cross-references

- `docs/parallel-work/follow-ups.md` — parallel-chat coordination items (Day 1 P1.13/14/15/16 closures + Days 2–7 task pipeline)
- `docs/audits/2026-04-27-skill-alignment-audit.md` — original P0/P1/P2 plan
- `docs/audits/2026-04-27-eod-skill-conformance-audit.md` — eval-by-eval ledger
- `docs/audits/2026-04-27-permission-triage.md` — permission decision-tree origin
- `QA Nexus/PM1/PM1_ERD/PM1_ERD.md` §3 — canonical entity inventory (TB-001..TB-021)
- `QA Nexus/PM1/PM1_milestone/M0/Milestone_M0_Setup_v8.md` — M0 backlog (35 tasks, 298h)
