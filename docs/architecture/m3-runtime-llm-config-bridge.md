# M3 close — Runtime LLM config bridge (DB vs env-vars vs F26)

**Filed:** Day-15 (2026-05-10) ~13:00 IST in response to Yogesh's "give me a SQL INSERT, no env vars" ask. Three gaps surfaced during investigation; this memo documents them + proposes 3 paths with effort estimates so you can pick.

**TL;DR:** The tables exist (`TB-019/020/021`), but the SQL-INSERT-only approach does NOT work today because (a) `LLMGatewayService` still reads from `process.env`, (b) `api_key_encrypted` requires AES-GCM ciphertext (not plaintext), (c) no hot-reload — service reads config ONCE at `onModuleInit`. Recommended: **Path C** (~1 hr PR ships M3 close today, preserves runtime-config design intent, paves the way for F26 UI in M5).

---

## What I found in the codebase

### ✅ Tables exist (initial migration `20260427135123_init_pm1_schema`)

Three tables per PM1_ERD §5:

- **`llm_providers`** (TB-019) — workspace-scoped credential rows. Columns: `id`, `workspace_id`, `provider_kind` (enum: `groq` / `gemini` / `openai` / `anthropic` / `kimi` / `mistral` / `together` / `fireworks` / `custom_oai`), `display_name`, **`api_key_encrypted`** (AES-GCM ciphertext), `endpoint_url`, `extra_config_json`, `status` (enum: `connected` / `error` / `unverified`), `last_test_at`, `last_test_result`, `created_by`, `created_at`.
- **`llm_provider_models`** (TB-020) — catalog of fetched models per provider. Columns: `id`, `provider_id` (FK), `model_id` (e.g., `openai/gpt-oss-120b`), `display_name`, `capability_json`, `enabled_for_workspace`, `fetched_at`.
- **`agent_model_assignments`** (TB-021) — maps `(workspaceId × agentKind × role)` → `modelPk`. This is the routing layer F26 PUTs to.

### ❌ Gap 1: Gateway reads env, not DB

`apps/api/src/llm/llm-gateway.service.ts:296` `readConfig()`:

```ts
private readConfig(): GatewayConfig {
  const primary = process.env.LLM_PRIMARY_PROVIDER;
  // ... LLM_PRIMARY_MODEL, LLM_SECONDARY_PROVIDER, ...
}
```

**No Prisma query exists in the gateway path.** Even if you INSERT into `llm_providers` today, the gateway will continue to report `deferred=true` because env vars are unset.

### ❌ Gap 2: API key must be AES-GCM ciphertext

The schema declares `api_key_encrypted String @map("api_key_encrypted")` per `prisma/schema.prisma:716` with the inline comment:

> `api_key_encrypted holds AES-GCM-encrypted payload (BETTER_AUTH_SECRET).`

You cannot `INSERT ... VALUES ('gsk_xxx...')` and have it work — the read-side `LlmConfigService.list()` at `llm-config.service.ts:72` projects providers via `hasApiKey: !!p.apiKeyEncrypted` (boolean only), and any future decrypt path will use `BETTER_AUTH_SECRET` to AES-GCM-decrypt before passing to the SDK. Plaintext ciphertext = decrypt fails = service errors.

### ❌ Gap 3: No hot-reload

`LLMGatewayService.onModuleInit()` runs `this.config = this.readConfig()` ONCE at Nest bootstrap. Even after your refactor to read from DB, the running service won't pick up a fresh INSERT without either (a) a restart, or (b) an explicit reload endpoint, or (c) a per-call DB lookup.

---

## Three paths

| Path                        | Effort             | Ships M3 close? | Env vars touched?                         | Notes                                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------- | ------------------ | --------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A — Set Render env vars** | 5 min              | ✅ yes          | ❌ violates your "no env vars" constraint | Just `LLM_PRIMARY_PROVIDER=groq` + `LLM_PRIMARY_MODEL=openai/gpt-oss-120b` + `GROQ_API_KEY=...` on Render. Render auto-redeploys. F26 UI in M5 will replace this with DB-driven config.                                                                                                                                                                                                                          |
| **B — Full refactor**       | ~3 hr (PR + tests) | 🟡 tight        | ✅ no                                     | LLMGatewayService.readConfig refactored to (1) query `LlmProvider` + `AgentModelAssignment` first, (2) AES-GCM-decrypt key via `BETTER_AUTH_SECRET`, (3) fall back to env if DB empty, (4) cache config + add `/api/admin/llm/reload` endpoint for hot-swap. Cleanest long-term but real PR scope.                                                                                                               |
| **C — Minimal bridge** ✅   | ~1 hr (PR + tests) | ✅ yes          | ✅ no                                     | Two-part PR: (1) `apps/api/scripts/seed-llm-provider.ts` — takes `GROQ_KEY` env, AES-GCM-encrypts via `BETTER_AUTH_SECRET`, INSERTs all 3 rows. (2) Minimal `LLMGatewayService.readConfig()` patch (~50 LOC) — async DB query first via Prisma, decrypt key, **set `process.env.GROQ_API_KEY` programmatically** so existing `GroqProvider` constructor path works unchanged. Hot-reload deferred to F26-era PR. |

**My recommendation: Path C.** Ships today, preserves runtime-config intent (no Render env var touched by Yogesh — script does the encryption + INSERT), keeps the GroqProvider untouched (the script's runtime-injection of `process.env.GROQ_API_KEY` is internal — env values come FROM the DB, not from operator config). F26 UI in M5 then just becomes a UI on top of the seed script.

---

## Path C — Concrete deliverables (if you greenlight)

### 1. SQL skeleton (for reference — script does the actual INSERT)

For documentation only. The seed script generates this with proper UUIDs + AES-GCM ciphertext:

```sql
-- TB-019: provider credential row.
INSERT INTO llm_providers (
  id, workspace_id, provider_kind, display_name,
  api_key_encrypted,          -- AES-GCM(plaintext_key, BETTER_AUTH_SECRET)
  endpoint_url,
  extra_config_json,
  status,
  created_by
) VALUES (
  gen_random_uuid(),
  '<IKSULA_WORKSPACE_UUID>',
  'groq',
  'Groq (M3 close — pre-F26 seed)',
  '<BASE64_AES_GCM_CIPHERTEXT>',
  'https://api.groq.com/openai/v1',
  '{}'::jsonb,
  'connected',
  '<YOGESH_USER_UUID>'
);

-- TB-020: model catalog (one row per usable model).
INSERT INTO llm_provider_models (id, provider_id, model_id, display_name, enabled_for_workspace)
VALUES
  (gen_random_uuid(), '<PROVIDER_ID_FROM_ABOVE>', 'openai/gpt-oss-120b', 'GPT-OSS-120B (primary)', true),
  (gen_random_uuid(), '<PROVIDER_ID_FROM_ABOVE>', 'meta-llama/llama-4-scout-17b-16e-instruct', 'Llama-4 Scout (long-context)', true),
  (gen_random_uuid(), '<PROVIDER_ID_FROM_ABOVE>', 'openai/gpt-oss-20b', 'GPT-OSS-20B (fast)', true);

-- TB-021: routing assignments (one per agentKind × role).
-- AgentKind enum likely: composer / curator / scribe / sentinel / sherlock
-- AgentRole enum likely: primary / secondary / long_context
INSERT INTO agent_model_assignments (id, workspace_id, agent_kind, role, model_pk, created_by)
VALUES
  (gen_random_uuid(), '<WS_UUID>', 'composer', 'primary',     '<MODEL_PK_120B>', '<YOGESH_UUID>'),
  (gen_random_uuid(), '<WS_UUID>', 'composer', 'secondary',   '<MODEL_PK_20B>',  '<YOGESH_UUID>'),
  (gen_random_uuid(), '<WS_UUID>', 'composer', 'long_context','<MODEL_PK_SCOUT>','<YOGESH_UUID>');
```

### 2. Seed script (`apps/api/scripts/seed-llm-provider.ts`)

```bash
GROQ_KEY=gsk_xxxxxxxxxxxx \
  WORKSPACE_KEY=iksula \
  ADMIN_EMAIL=yogesh.mohite@iksula.com \
  pnpm exec ts-node --transpile-only \
    --compiler-options '{"module":"commonjs","moduleResolution":"node"}' \
    apps/api/scripts/seed-llm-provider.ts
```

Script does:

1. Resolve `workspaceId` from `WORKSPACE_KEY` + `userId` from `ADMIN_EMAIL`
2. AES-GCM-encrypt `GROQ_KEY` via existing helper (`apps/api/src/auth/crypto.ts` or similar — I'll search/add as needed)
3. INSERT the 3-table cascade in a transaction
4. Audit-log per Hard Rule 7: `llm_provider_seeded` with `provider_kind` + `model_count` + counts only (NEVER the key)
5. Idempotent — safe to re-run; UPDATEs the existing row if `(workspace_id, provider_kind)` exists

### 3. Gateway patch (~50 LOC)

`LLMGatewayService.readConfig()` becomes async + DB-first:

```ts
private async readConfig(): Promise<GatewayConfig> {
  // 1. Try DB first (Path C bridge — until F26 ships hot-reload).
  const dbProvider = await this.prisma.llmProvider.findFirst({
    where: { providerKind: 'groq', status: 'connected' },
    include: { models: true },
  });
  if (dbProvider) {
    const plaintextKey = await decryptAesGcm(
      dbProvider.apiKeyEncrypted,
      process.env.BETTER_AUTH_SECRET!,
    );
    // Inject into process.env so GroqProvider constructor finds it.
    // Idempotent — env stays set across restarts (in-memory only).
    process.env.GROQ_API_KEY = plaintextKey;
    return {
      primaryProvider: 'groq',
      primaryModel: dbProvider.models[0]?.modelId ?? 'openai/gpt-oss-120b',
      // ... map secondary + long_context from agent_model_assignments
    };
  }
  // 2. Fall back to env vars (current behavior — preserves backward compat).
  return this.readConfigFromEnv();
}
```

Plus `LLMGatewayService.constructor` injects `PrismaService`, and `onModuleInit` becomes async.

### 4. Hot-reload (optional, can ship in same PR or defer)

Add `POST /api/admin/llm/reload` (Admin-only) that re-runs `readConfig()` on the running gateway. Lets you re-seed via the script + reload without Render restart.

---

## Answer to your specific questions

> **"any service restart needed after DB insert?"**

**Today: yes** — `onModuleInit` reads config once. After Path C ships: still yes UNLESS the optional `/api/admin/llm/reload` endpoint lands in the same PR. Render auto-redeploys on every push to main, so the path is: seed → push trivial commit (or hit reload endpoint) → service picks up.

> **"does LLMGateway hot-reload from DB?"**

**No, not today.** Gateway is one-shot config read. Path C adds DB-first lookup but reload requires the optional endpoint OR a service restart.

---

## What I recommend you greenlight

**Path C — small ~1 hr PR shipping today:**

1. Seed script (`apps/api/scripts/seed-llm-provider.ts`)
2. Gateway DB-first refactor (~50 LOC service patch + tests)
3. Optional: `/api/admin/llm/reload` endpoint (~30 min more)
4. CHANGELOG + ADR-015 ("M3-close runtime config bridge — pre-F26 transitional pattern")

**Or Path A** if you want the absolute fastest and we accept env-var stopgap until F26 v2 ships in M5 (would just need a one-line followup `(aw)` "remove env-var fallback when F26 hot-reload lands").

Ping with your call.
