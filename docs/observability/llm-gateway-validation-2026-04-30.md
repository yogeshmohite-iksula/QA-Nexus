# LLM Gateway Validation — 2026-04-30 (Day 4)

**Status: DEFERRED.** Render API not yet deployed at this work-window's
start (07:00 IST → 14:00 IST). All five validation blocks (a–e) are
scripted in `scripts/llm-gateway-validation.sh` and ready to fire the
moment Yogesh finishes Render provisioning + sets `GROQ_API_KEY` +
`GEMINI_API_KEY` env vars.

---

## Deferral cause

Pre-flight check at 07:30 IST:

```
$ curl -sS -o /dev/null -w "%{http_code}" --max-time 10 \
    https://qa-nexus-api.onrender.com/health
404
```

A 404 (rather than a 503 or a connection error) suggests the Render
service slot exists but no app is currently bound to it — i.e., Yogesh
has begun provisioning but the deploy hasn't gone live yet.

Both Day-4 noon brief Block 1 (live gateway validation) and Block 2 (A1
Scribe real-LLM smoke) require:

1. A reachable API origin (Render OR local `pnpm start` with real keys).
2. `GROQ_API_KEY` set (for primary route).
3. `GEMINI_API_KEY` set (for fallback route validation).
4. A valid better-auth session cookie for an Admin user.

None of (1)–(3) were available during this work window. Decision: pivot
to Block 3 (test coverage), package Block 1+2 as a one-shot script.

---

## When keys land — how to run

```bash
# 1. Get a session cookie:
#    Log in via the FE (Yogesh's email) → DevTools → Application →
#    Cookies → copy the value of `better-auth.session_token`.

# 2. Run the validation script:
export API_BASE="https://qa-nexus-api.onrender.com"
export COOKIE="better-auth.session_token=eyJ..."
bash scripts/llm-gateway-validation.sh

# 3. The script appends a timestamped section to THIS file with results
#    for blocks (a)–(e). Commit + push.
```

Total wall time: ~30 seconds (10 sequential `/llm/test` calls dominate).
Burns: ~12 Groq RPD + 0 Gemini RPD (Block (b) skipped by default).

---

## What the script covers

| Block | What                               | Pass criteria                                                                  |
| ----- | ---------------------------------- | ------------------------------------------------------------------------------ |
| (a)   | Happy path: short prompt → primary | HTTP 200, `fallbackUsed=false`, `providerName="groq"`, latency <2000ms         |
| (b)   | Force Gemini fallback              | manual: revoke `GROQ_API_KEY` in Render between runs                           |
| (c)   | Long-context route (~40k chars)    | `routeReason="long_context"`, provider matches `LLM_LONG_CONTEXT_PROVIDER` env |
| (d)   | 10× sequential latency benchmark   | p50 <1000ms, p95 <2000ms (short-reply prompts)                                 |
| (e)   | A1 Scribe smoke against real LLM   | HTTP 200, `testCases.length>=1`, latency <5000ms, `llm.providerName` populated |

---

## Free-tier quota — pre-validation budget

Validation cost (when fired):

- **Groq RPD:** ~12 requests (1 happy + 1 long + 10 benchmark) — 0.8% of 1500 RPD daily limit
- **Gemini RPD:** 0 (block (b) skipped by default)
- **Neon:** unchanged — `/llm/test` doesn't write to DB; A1 Scribe writes 1 audit row (~1 KB)

Daily margin: 1488/1500 Groq RPD remaining for the rest of the day after one validation run.

---

## Block 3 (Test coverage) — what landed today instead

Day-4 morning pivot. New jest test files added on `feature/be-day-4-validation`:

| File                                          | Tests | Coverage delta                                                                 |
| --------------------------------------------- | ----- | ------------------------------------------------------------------------------ |
| `src/audit/__tests__/audit-helper.spec.ts`    | 9     | `audit-helper.ts` 12.5% → ~95% (HMAC chain + canonical JSON + secret guard)    |
| `src/audit/__tests__/audit.service.spec.ts`   | 5     | `audit.service.ts` 35% → ~95% (write + writeNonBlocking + resolveActorByEmail) |
| `src/llm/__tests__/base.provider.spec.ts`     | 9     | `base.provider.ts` 9% → ~95% (retry-with-backoff + health tracking)            |
| `src/llm/__tests__/provider-registry.spec.ts` | 5     | `provider-registry.ts` 35% → 100% (lazy + cached + unknown-name)               |

**Suite total: 39 → 68 tests passing.**

Not added (deliberate — would need live integrations or Nest e2e):

- `auth.service.ts`, `auth.config.ts` — BetterAuth integration; covered by E2E magic-link test once T014 lands.
- `email.service.ts` — Resend integration; same story.
- `embedding.service.ts` — loads HF model (38s cold + bandwidth); covered by `/embedding/test` smoke.
- `realtime.gateway.ts` — WebSocket; covered by Day-3 manual smoke per server log.
- All `*.controller.ts` — need `@nestjs/testing` HTTP harness (separate followup, T031.b expansion).

---

## Followups filed

- **(k) Live LLM gateway validation** — fire `scripts/llm-gateway-validation.sh` once
  Render deploy + `GROQ_API_KEY` + `GEMINI_API_KEY` are live. Owner: BE chat,
  triggered by Yogesh's "Render is up" signal.
- Controller-level e2e tests (covered + filed under T031.b expansion in Day-3
  noon followups).
