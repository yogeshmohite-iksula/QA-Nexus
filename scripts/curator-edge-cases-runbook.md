# Curator + Composer M3 edge-case runbook

**Filed:** Day-14 Block B++ TASK B++2 step 2 (BE+1 sandbox lacked Render/Postgres/staging access — handing off as a recipe).

**Run after:** PR #112 merged + Render staging deploy healthy + bge-small auto-loaded.

**Scope:** the 4 production edge cases the Day-14 brief specified for C3 BE-side verification. Each has a verification step + a restoration step (binding — staging must be returned to a clean state).

---

## Setup (5 min)

```bash
# Set in shell session for all 4 edge cases below.
export QA_NEXUS_API_BASE=https://qa-nexus-api.onrender.com
export QA_NEXUS_AUTH_COOKIE='better-auth.session_token=...'   # from browser devtools
export QA_NEXUS_PROJECT_ID=<RET-uuid-from-Iksula-seed>
export QA_NEXUS_TC_ID=<a-real-TC-uuid-in-RET>
```

Tip: fetch a known TC UUID via the list endpoint:

```bash
curl -s -H "Cookie: $QA_NEXUS_AUTH_COOKIE" \
  "$QA_NEXUS_API_BASE/api/projects/$QA_NEXUS_PROJECT_ID/test-cases?pageSize=5" \
  | jq -r '.testCases[] | "\(.id)\t\(.key)\t\(.title)"'
```

Postgres access (for edge cases 2 + 3 manual data manipulation): use Neon staging connection string from Render env var `DATABASE_URL`. Drop into `psql` directly.

---

## Edge case 1 — Empty corpus (project with 0 OTHER TCs)

**Setup:** create a fresh project via `POST /api/projects` then a single TC; never link other TCs.

```bash
# Create a fresh project + single TC (don't add more).
NEW_PROJECT_ID=$(curl -s -X POST -H "Cookie: $QA_NEXUS_AUTH_COOKIE" \
  -H "Content-Type: application/json" \
  "$QA_NEXUS_API_BASE/api/projects" \
  -d '{"key":"BENCH-EMPTY","name":"Bench empty corpus"}' | jq -r '.project.id')

NEW_TC_ID=$(curl -s -X POST -H "Cookie: $QA_NEXUS_AUTH_COOKIE" \
  -H "Content-Type: application/json" \
  "$QA_NEXUS_API_BASE/api/projects/$NEW_PROJECT_ID/test-cases" \
  -d '{"key":"TC-BENCH-001","title":"Lone case","preconditions":"none","stepsJson":[{"order":1,"action":"x","expected":"y"}],"expectedResult":"z","priority":"P2"}' \
  | jq -r '.testCase.id')
```

**Verify:**

```bash
curl -s -X POST -H "Cookie: $QA_NEXUS_AUTH_COOKIE" \
  -H "Content-Type: application/json" \
  "$QA_NEXUS_API_BASE/api/projects/$NEW_PROJECT_ID/test-cases/$NEW_TC_ID/duplicates" \
  -d '{}' | jq '{verdict, matches, candidatesScanned: .searchMetadata.candidatesScanned, stubbed}'
```

**Expected:**

```json
{ "verdict": "clear", "matches": [], "candidatesScanned": 0, "stubbed": false }
```

**Restoration:** archive the bench project (no destructive cleanup):

```bash
curl -X DELETE -H "Cookie: $QA_NEXUS_AUTH_COOKIE" \
  "$QA_NEXUS_API_BASE/api/projects/$NEW_PROJECT_ID"
```

---

## Edge case 2 — Null embedding (mixed corpus)

**Setup:** in `psql`, manually nullify ONE existing TC's embedding column. Pick a low-traffic TC.

```sql
-- Capture current embedding to a backup (Postgres array literal).
SELECT id, key, embedding::text AS backup_embedding
  FROM test_cases
 WHERE id = '<TARGET_TC_UUID>'
 \gset
-- Save the printed `backup_embedding` value to a local file before continuing!

-- Nullify.
UPDATE test_cases SET embedding = NULL WHERE id = '<TARGET_TC_UUID>';
```

**Verify:** trigger Curator on a DIFFERENT TC in the same project; the nullified TC should be excluded from results AND counted in `skipped_null_embeddings`.

```bash
# Use the same QA_NEXUS_TC_ID env var (a different TC than the nullified one).
curl -s -X POST -H "Cookie: $QA_NEXUS_AUTH_COOKIE" \
  -H "Content-Type: application/json" \
  "$QA_NEXUS_API_BASE/api/projects/$QA_NEXUS_PROJECT_ID/test-cases/$QA_NEXUS_TC_ID/duplicates" \
  -d '{}' \
  | jq '{verdict, candidatesScanned: .searchMetadata.candidatesScanned, matches_keys: [.matches[].candidateCaseKey]}'
```

Then check the audit row — `skipped_null_embeddings` should be ≥ 1:

```sql
SELECT payload->>'skipped_null_embeddings' AS skipped,
       payload->>'candidates_scanned'      AS scanned,
       payload->>'verdict'                 AS verdict
  FROM audit_log
 WHERE action = 'curator_dedupe_check_completed'
 ORDER BY id DESC LIMIT 1;
```

**Expected:** `skipped >= 1`, target TC's key NOT in `matches_keys`.

**Restoration (binding — don't leave staging broken):**

```sql
UPDATE test_cases
   SET embedding = '<BACKUP_EMBEDDING_STRING>'::vector
 WHERE id = '<TARGET_TC_UUID>';
```

---

## Edge case 3 — Composer schema fail (forced retry exhaustion → 503)

**Setup:** no DB modification needed. Use `LLM_DEBUG=true` (TASK B1.3 toggle from PR #112) on Render to capture prompts. To FORCE a JSON parse failure, the cleanest path is:

- **Option A (preferred):** add a one-time test endpoint behind a dev-only flag that calls `LLMGatewayService.complete()` with a prompt designed to elicit prose ("explain how you'd write a test case in plain English, no JSON"). Don't ship this to prod.
- **Option B (faster):** unit-test path is already covered by `composer.service.spec.ts` "parse exhausted (2 invalid JSONs) → 503" test — pinned in PR #109. ADR-013 §5 retry chain is exercised at unit-test layer.

**Production smoke version** (no forced fail — just observability):

```bash
# Trigger 5 normal Composer runs against a real RET requirement; verify zero parse retries.
for i in 1 2 3 4 5; do
  curl -s -X POST -H "Cookie: $QA_NEXUS_AUTH_COOKIE" \
    -H "Content-Type: application/json" \
    "$QA_NEXUS_API_BASE/api/projects/$QA_NEXUS_PROJECT_ID/requirements/<REQ_ID>/test-cases/generate" \
    -d '{"count":3,"format":"auto"}' | jq '{ok, runId, cases_count: (.cases|length), stubbed, fallback: .llmMetadata.fallbackUsed}'
done
```

Then inspect the TB-022 rows:

```sql
SELECT id, status, error_reason, llm_provider, llm_model
  FROM test_case_generation_runs
 WHERE project_id = '<PROJECT_UUID>'
 ORDER BY created_at DESC LIMIT 5;
```

**Expected:** all 5 rows `status='success'`, `error_reason IS NULL`, `llm_provider='groq'`. If ANY row shows `status='partial'` or `'failed'`, dig into the audit log + Render OTel span for that `runId`.

**No restoration needed** — this is read-only.

---

## Edge case 4 — Composer retry-fallback chain (forced)

**Setup:** to force the Groq → Gemini fallback path on STAGING (NOT prod):

1. Render staging dashboard → Environment → temporarily set `LLM_PRIMARY_MODEL` to a known-bad value (e.g., `groq-nonexistent-model-xyz`).
2. Render auto-redeploys (~2 min).

**Verify:**

```bash
curl -s -X POST -H "Cookie: $QA_NEXUS_AUTH_COOKIE" \
  -H "Content-Type: application/json" \
  "$QA_NEXUS_API_BASE/api/projects/$QA_NEXUS_PROJECT_ID/requirements/<REQ_ID>/test-cases/generate" \
  -d '{"count":2,"format":"auto"}' | jq '{ok, fallback: .llmMetadata.fallbackUsed, provider: .llmMetadata.providerName, model: .llmMetadata.modelUsed}'
```

**Expected:** `fallback: true`, `provider: "gemini"`, `model: "gemini-2.5-flash"` (or whatever `LLM_SECONDARY_MODEL` resolves to).

**Restoration (binding):** Render dashboard → Environment → restore `LLM_PRIMARY_MODEL` to `openai/gpt-oss-120b`. Verify next call returns `fallback: false`.

---

## Sign-off checklist

- [ ] Edge case 1 — empty corpus → `verdict: clear`, `candidatesScanned: 0`
- [ ] Edge case 2 — null embedding → `skipped_null_embeddings >= 1`, target TC not in matches
- [ ] Edge case 2 — embedding RESTORED post-test (audit query confirms)
- [ ] Edge case 3 — 5 Composer runs all `status='success'` with `error_reason IS NULL`
- [ ] Edge case 4 — staging force-fallback returns `fallback: true`, `provider: gemini`
- [ ] Edge case 4 — staging `LLM_PRIMARY_MODEL` RESTORED + verified next call returns `fallback: false`
- [ ] perf benchmark (`scripts/curator-perf-benchmark.ts`) → p95 result documented in `docs/performance/m3-acceptance-baseline.jsonl`

If all green → C3 BE-side verification complete. Cross-FE E2E (Composer + Curator chained through F16b real backend) waits for FE+1's Pattern B flip on Sunday.

If any fail → log P0/P1/P2 followup per severity; do NOT block M3 close ceremony unless a P0 surfaces.
