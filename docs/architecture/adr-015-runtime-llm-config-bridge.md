# ADR-015: Runtime LLM provider config bridge (Path C — pre-F26 transitional)

- **Status:** **Transitional** (2026-05-10 — Day-15 M3 close; superseded by F26 v2 React UI in M5)
- **Date:** 2026-05-10
- **Deciders:** Yogesh Mohite (Admin), BE chat
- **Related:** PM1_ERD §5 (LLMGateway service spec) · PM1_ERD §3.13 (audit-log canon) · ADR-013 (Composer prompt strategy — depends on Gateway being initialized) · ADR-014 (Curator dedup — depends on Gateway initialized) · TB-019 `llm_providers` · TB-020 `llm_provider_models` · TB-021 `agent_model_assignments` · CLAUDE.md Hard Rule 1 ($0/month) + Hard Rule 6 (no secrets in repo) + Hard Rule 7 (audit-log) · `apps/api/src/llm/llm-gateway.service.ts` · `apps/api/src/llm/crypto.ts` · `apps/api/scripts/seed-llm-provider.ts` · followup `(az)` (filed in this PR)
- **Supersedes:** none
- **Superseded by:** F26 v2 React UI delivery in M5 (NOT a different ADR — this ADR's lifespan ends when F26 v2 ships and the env-var fallback path is removed per `(az)`)

---

## ⚠️ TRANSITIONAL — read this first

This ADR documents a **deliberately throwaway** pattern shipped on M3 close day (Day-15) to bridge the gap between:

- **Today's reality:** `LLMGatewayService` reads `process.env.LLM_PRIMARY_PROVIDER` at boot. PR #109 (Composer real Groq) + PR #112 (Curator real pgvector) ship the AI agents but the gateway stays `deferred=true` until the env var is set. Setting Render env vars violates Yogesh's runtime-config design intent.
- **F26 v2's intended state (M5):** an admin React UI that writes `LlmProvider` + `LlmProviderModel` + `AgentModelAssignment` rows; gateway reads from DB on boot AND hot-reloads when admin saves. Zero env vars touched.

The bridge: a CLI seed script + a 50-LOC gateway patch that lets Yogesh run `pnpm exec ts-node apps/api/scripts/seed-llm-provider.ts` once, encrypting the Groq API key with `BETTER_AUTH_SECRET` and persisting it to `llm_providers` (TB-019). On next Render boot, the gateway reads from DB instead of env. F26 v2 in M5 reuses the same encryption format + same tables — the seed script becomes the admin's CLI escape hatch, the React UI becomes the admin's GUI.

Tracked in followup `(az)` for removal once F26 v2 ships in M5.

---

## Context

### What ships in M3 close (Day-15)

The two AI-agent PRs (#109 Composer real Groq + #112 Curator real pgvector) are merged. Both depend on `LLMGatewayService` being initialized (Composer for actual Groq calls; Curator for embed pipeline indirectly via `EmbeddingService` which is independent — so Curator works even with gateway deferred).

But for Composer to work, the gateway needs an active provider config. Current options:

| Option                       | Effort | Yogesh's design intent                          |
| ---------------------------- | ------ | ----------------------------------------------- |
| Set Render env vars          | 5 min  | ❌ violates "no env vars — runtime config only" |
| Wait for F26 v2              | weeks  | ❌ blocks M3 close indefinitely                 |
| **Path C bridge (this ADR)** | ~1 hr  | ✅ preserves intent + ships M3 close today      |

### Why "no env vars" is the binding intent

Per Day-4 noon arch decision (referenced in `LLMGatewayService.deferred` comment):

> "LLM keys come from F26 UI in M1, not env vars. Until F26 lands, the service should NOT crash on boot if vars missing."

The design assumption: an admin pastes their API key into a web form → the BE encrypts it → DB row → gateway reads. Env vars require ops involvement (Render dashboard) and re-deploy on rotation. The DB path is admin-self-serve.

F26 was planned for M1 but slipped. M3 close is now demanding gateway initialization. Path C closes the gap with code that converges to the F26 v2 future, not diverges from it.

### Schema constraints (already in place from initial migration)

`prisma/migrations/20260427135123_init_pm1_schema/migration.sql` shipped TB-019/020/021 + `LlmProviderKind` + `LlmProviderStatus` + `AgentKind` + `AgentRole` enums. Schema is per ERD §5 + §3 L940. **No new schema or migration needed for Path C** — the bridge writes rows the F26 v2 UI will eventually write through.

`api_key_encrypted` is a `String` column with the inline schema comment:

> `api_key_encrypted holds AES-GCM-encrypted payload (BETTER_AUTH_SECRET)`

Path C ships the AES-GCM helper that this comment had been promising.

## Decision

### 1. Resolution order: env-first, DB-fallback

`LLMGatewayService.onModuleInit()` is now async. It tries:

1. **`readConfigFromEnv()`** — preserves backward compat for any deployment that has `LLM_PRIMARY_PROVIDER` set. If env config resolves cleanly → `configSource = 'env'`, gateway initialized.
2. **`readConfigFromDb()`** — if env path threw, query `LlmProvider.findFirst({ where: { status: 'connected' } })`, AES-GCM-decrypt `api_key_encrypted` via `BETTER_AUTH_SECRET`, inject plaintext into `process.env[GROQ_API_KEY|...]` so the lazy-constructed provider class finds it on first call. → `configSource = 'db'`, gateway initialized.
3. **Deferred mode** — if BOTH env AND DB are empty → `configSource = 'none'`, gateway stays `deferred=true` (current behavior; `/llm/*` returns 501).

**Why env-first:** any future Render deployment with env vars set continues to work without DB writes. Path C is additive, not breaking.

**Why injecting `process.env`:** the existing `GroqProvider` constructor reads `process.env.GROQ_API_KEY`. Refactoring it to take an explicit key arg is a wider blast radius (touches `provider-registry.ts` + every provider class). Setting `process.env` programmatically right before the lazy `getProvider()` call is internal to the gateway — no observer outside the process sees the env mutation. Tracked as a cleanup target in `(az)`.

### 2. Encryption format: AES-256-GCM, dot-separated base64url triplet

`apps/api/src/llm/crypto.ts`:

- **Algorithm:** `aes-256-gcm` (Node.js built-in `node:crypto`)
- **Key derivation:** `SHA-256(BETTER_AUTH_SECRET) → 32 bytes`
- **IV:** 12 random bytes per encrypt (GCM canonical; IV reuse with same key = catastrophic)
- **Auth tag:** 16 bytes appended; `decryptApiKey()` throws on auth-tag mismatch (covers tampering + wrong-seed cases)
- **Wire format:** `<iv>.<authtag>.<ciphertext>` — 3 dot-separated base64url segments. Stored as TEXT in `api_key_encrypted`. Human-readable in psql, JSON-safe.
- **AAD:** intentionally omitted in v1 (simpler API). `(az)` follow-up may add `AAD = workspaceId + providerKind` to bind ciphertext to its row context (defense against row-swap attacks).

### 3. Seed script: `apps/api/scripts/seed-llm-provider.ts`

Idempotent CLI that:

- Reads `GROQ_KEY` + `WORKSPACE_KEY` + `ADMIN_EMAIL` + `BETTER_AUTH_SECRET` from env (script-runtime only — values never persisted to disk or git).
- Resolves workspace via case-insensitive name match (no `key` column on `Workspace` model — Iksula data canon).
- AES-GCM-encrypts the plaintext key once.
- Three-table upsert in a single Prisma transaction: TB-019 provider row → TB-020 model catalog (3 Groq models) → TB-021 agent×role assignments (A1 Composer / A2 Curator / A4 Sherlock × primary/long_context/fast_layer).
- Audit row written **outside** the upsert tx via `writeAuditRow` helper (per-workspace pg_advisory_xact_lock — running inside another tx would deadlock). Payload: counts + lengths only, **NEVER the key plaintext OR ciphertext**.
- Re-running with same `WORKSPACE_KEY + PROVIDER_KIND` UPDATEs the existing row (refreshes ciphertext for key rotation).

### 4. Hot-reload: NOT in v1

Gateway reads config at `onModuleInit` ONCE. Re-seeding the DB requires Render restart (or redeploy on next push). M3 close ceremony only needs one boot → live. `(az)` follow-up tracks adding `POST /api/admin/llm/reload` for in-place hot-swap.

### 5. PII discipline: key never logged, audit shows lengths only

- The plaintext `GROQ_KEY` is held only in a function-local variable in the seed script.
- `LLMGatewayService.readConfigFromDb()` decrypts → sets `process.env[GROQ_API_KEY]` → does NOT log the value.
- Boot log line: `LLMGateway: injected GROQ_API_KEY from db (provider_id=<UUID> kind=groq); ...` — provider id + kind only.
- Audit payload (TB-013 `audit_log`): `api_key_length: 56, ciphertext_length: 124` — never the key itself.

## Consequences

### Positive

- **Zero env vars on Render** — preserves Yogesh's runtime-config design intent.
- **Zero schema changes** — TB-019/020/021 already exist; this PR uses what's there.
- **Forward-compatible with F26 v2** — same tables, same encryption format. F26 v2 React UI in M5 just adds a UI layer on top of the same model.
- **Backward-compatible with env vars** — env-first resolution means existing env-driven deployments unaffected.
- **Idempotent seed** — re-running rotates the key without manual cleanup.
- **Auditable** — `llm_provider_seeded` action lands in audit chain per Hard Rule 7.
- **Tamper-detected** — GCM auth tag throws on ciphertext alteration OR wrong seed. Failed decrypt surfaces as deferred-mode error (operator sees + escalates).

### Negative

- **`process.env` mutation in `readConfigFromDb`** — internal to process but an architectural smell; `(az)` cleanup will refactor providers to take explicit key args.
- **No hot-reload** — admin must restart Render after re-seed. Acceptable for M3 close (one-time setup); UX gap until `(az)` adds reload endpoint.
- **No AAD on ciphertext** — row-swap attack technically possible if attacker has DB write access. Low risk for pilot (8 internal users, Admin-only RLS); `(az)` follow-up adds AAD for defense-in-depth.
- **Single-provider routing in v1** — `readConfigFromDb()` returns only `primaryProvider`. Secondary + long_context derived from `agent_model_assignments` not implemented. Acceptable for M3 close (Composer needs primary only); F26 v2 adds the join.
- **Throwaway code** — gateway patch + seed script lifespan ends when F26 v2 ships. Tracked in `(az)` so it doesn't accumulate as long-term tech debt.

### Mitigation plan

1. **Lock crypto format** in `apps/api/src/llm/crypto.ts` constants. Any change requires ADR-016 + key migration.
2. **Pin tests** for: roundtrip, IV uniqueness (≠ across calls), tamper detection (3 ways), wrong-seed detection, malformed input (5 ways), env-var-name mapping. All in `crypto.spec.ts`.
3. **PR-review trigger:** any change to `crypto.ts` OR `LLMGatewayService.readConfigFromDb` OR `seed-llm-provider.ts` MUST cite this ADR + Yogesh approves.
4. **Followup `(az)`** — removal milestone tied to F26 v2 ship.
5. **F26 v2 design review must include** (per future ADR-016 or M5 spec):
   - DB write path uses `encryptApiKey()` from this ADR (NO new crypto)
   - DB read path = same `LLMGatewayService.readConfigFromDb` minus env-fallback
   - Hot-reload endpoint replaces "redeploy after seed" pattern
   - AAD addition (see Negative §3)

## Alternatives considered

### A. Render env vars (`LLM_PRIMARY_PROVIDER=groq` + `GROQ_API_KEY=...`)

- **Pros:** 5 min, zero new code, ships M3 close immediately.
- **Cons:** Violates Yogesh's "no env vars — runtime config" design intent. Env vars require ops involvement on every key rotation. F26 v2 in M5 then has to migrate FROM env vars instead of building ON the same DB pattern.
- **Verdict:** Rejected per Yogesh's explicit constraint.

### B. Full F26 v2 React UI in M3 close window

- **Pros:** Final-form solution; no transitional code.
- **Cons:** F26 v2 redesign is in progress with Claude Design (M5 scope). React port is a multi-day FE effort. Cannot ship today.
- **Verdict:** Rejected — schedule infeasible.

### C — chosen. See above.

### D. Skip Composer entirely for M3 close; ship only Curator

- **Pros:** Curator works without gateway (uses `EmbeddingService` directly, not `LLMGatewayService`).
- **Cons:** PR #109 Composer real Groq is already merged. Punting Composer to M3.5 means F16a modal stays `stubbed:true` and the M3 acceptance gate "Composer real Groq" fails.
- **Verdict:** Rejected — undermines M3 close.

### E. Deploy a one-shot REST endpoint to populate the DB

- **Pros:** Removes the CLI step; admin POSTs the key from a curl/Postman.
- **Cons:** Endpoint surface needs RBAC + Zod + audit + tests + review — same scope as the seed script BUT with HTTP attack surface. Net effort higher; net security worse.
- **Verdict:** Rejected — CLI script is simpler + auditable + ephemeral.

### F. Hardcode the key in `apps/api/src/llm/providers/groq.provider.ts` for M3 close, ADR-016 it later

- **Verdict:** Rejected — Hard Rule 6 binding ("API key never in repo"). Non-starter.

## Implementation plan

### Day-15 (this PR)

1. ✅ `apps/api/src/llm/crypto.ts` — AES-GCM helper (encrypt/decrypt/envVarFor)
2. ✅ `apps/api/src/llm/__tests__/crypto.spec.ts` — 13 tests pinning roundtrip + tamper + wrong-seed + malformed-input + env-mapping
3. ✅ `apps/api/src/llm/llm-gateway.service.ts` — async `onModuleInit` + env-first → DB-fallback resolution + `configSource: 'env' | 'db' | 'none'`
4. ✅ `apps/api/src/llm/__tests__/llm-gateway-graceful.spec.ts` + `llm-gateway.service.spec.ts` — updated for async signature + new mock PrismaService param
5. ✅ `apps/api/scripts/seed-llm-provider.ts` — idempotent CLI; uses `writeAuditRow` for chain integrity; resolves workspace by case-insensitive name match
6. ✅ This ADR + followup `(az)` + CHANGELOG

### Day-15 post-merge (operator action)

1. PR auto-merges → Render redeploys (~5 min)
2. Yogesh runs:
   ```bash
   cd apps/api && \
     GROQ_KEY=gsk_xxx WORKSPACE_KEY=iksula ADMIN_EMAIL=yogesh.mohite@iksula.com \
     pnpm exec ts-node --transpile-only \
       --compiler-options '{"module":"commonjs","moduleResolution":"node"}' \
       scripts/seed-llm-provider.ts
   ```
3. Render manual restart (or trivial commit-push to trigger redeploy)
4. Boot log shows: `LLMGateway initialised (source=db): primary=groq:openai/gpt-oss-120b ...`
5. Composer + Curator endpoints fully real on production. M3 acceptance gate met.

### Lifespan + retirement (`(az)` follow-up — post-M5)

When F26 v2 React UI ships:

1. Remove env-var fallback path in `LLMGatewayService.readConfigFromEnv()` (or gate behind `LLM_DEPLOY_ENV_FALLBACK=true` for emergency hatch)
2. Remove seed script (or move to `apps/api/scripts/legacy/` for ops escape hatch)
3. Add hot-reload endpoint `POST /api/admin/llm/reload`
4. Add AAD to crypto (workspaceId + providerKind binds ciphertext to row)
5. Refactor providers to take explicit `apiKey` constructor arg (remove process.env mutation)
6. Mark this ADR `Status: Superseded by F26 v2`

## Cross-references

- `apps/api/src/llm/crypto.ts` — AES-GCM helper
- `apps/api/src/llm/__tests__/crypto.spec.ts` — pinned tests (13)
- `apps/api/src/llm/llm-gateway.service.ts` — env-first then DB-fallback
- `apps/api/src/llm/__tests__/llm-gateway*.spec.ts` — async-signature spec updates
- `apps/api/scripts/seed-llm-provider.ts` — idempotent CLI seed
- `apps/api/prisma/schema.prisma` — TB-019/020/021 (LlmProvider + LlmProviderModel + AgentModelAssignment)
- `apps/api/src/audit/audit-helper.ts` — `writeAuditRow` (HMAC chain integrity)
- ADR-013 — Composer prompt strategy (depends on gateway initialized)
- ADR-014 — Curator dedup thresholds (sister ADR)
- CLAUDE.md "Locked tech stack" — Groq + Gemini pin + $0/month gate
- PM1_ERD §5 — LLMGateway service spec
- PM1_ERD §3.13 — audit-log canon
- PM1_ERD §3 L940 — Admin-only RLS on llm_providers
- followup `(az)` — removal trigger when F26 v2 ships in M5
