# Better Stack runbook (T019 — logs)

Provision the OTel logs source in Better Stack and copy the OTLP
endpoint + token into Render env vars. ~10 minutes.

**Prerequisite:** Yogesh signed in to Better Stack on the free tier
(<https://logs.betterstack.com>). Free tier covers 1 GB/mo + 3-day
retention — sufficient for the 8-user pilot.

---

## 1. Create the source — type "OpenTelemetry"

1. **Logs → Sources → Connect source**.
2. Search for / pick **"OpenTelemetry"** as the source type. _(Do
   NOT pick "Pino", "Generic HTTP", or any other type — our pipeline
   uses pure OTel logs SDK per ADR planned for Day-4 + the
   `.claude/rules/api.md` rule "no third-party logger transports".
   Picking the wrong type means the OTLP endpoint shape won't match
   what `@opentelemetry/exporter-logs-otlp-http` posts.)_
3. **Name:** `qa-nexus-api-prod` (use `qa-nexus-api-dev` for the
   second source if you want a separate stream for local-laptop
   logs; pilot doesn't need this).
4. **Region:** US East (matches Grafana Cloud + Render Singapore
   has 200ms round-trip — acceptable for batched OTLP).
5. **Create source**.

## 2. Copy the connection details

Better Stack shows a **"Connect"** panel with two fields we need:

- **OTLP HTTP endpoint** — looks like `https://in-otel.logs.betterstack.com`
- **Source token** — Bearer token, looks like `tBs_<32+ chars>`

Copy both. They go into Render env vars below.

## 3. Wire into Render

In Render's environment editor for the `qa-nexus-api` service, add:

```
BETTER_STACK_OTLP_ENDPOINT=<endpoint from Connect panel>
BETTER_STACK_OTLP_AUTH=<source token from Connect panel>
```

Save. Render auto-redeploys (~3 min).

## 4. Verify ingestion

After the redeploy, hit `/health` against the live Render URL:

```bash
curl https://qa-nexus-api.onrender.com/health | jq '.otel.logs'
```

Expected:

```json
{
  "exporter": "configured",
  "sink": "better_stack",
  "endpoint": "https://in-otel.logs.betterstack.com",
  "last_export_at": "2026-04-30T..."
}
```

Then in Better Stack's Logs view, search for source `qa-nexus-api-prod`
— you should see Nest's bootstrap log lines (`QA Nexus API listening on
http://localhost:...`, the `Better Auth init` log, etc.) within ~30s of
the redeploy completing.

If `exporter` stays `"deferred"` after the redeploy, env vars didn't
make it to the dyno — check Render's env-var panel and confirm both are
set. If `exporter` shows `"error"`, check the `error` field for the
exception message; usually means a bad endpoint URL or expired token.

## 5. Sensitive-key redaction

Before any log ships, `apps/api/src/observability/redact.ts` strips
values for keys matching the SENSITIVE_KEYS list (auth tokens, cookies,
session tokens, API keys, audit-log payload bodies). Verified by the
`otel.spec.ts` tests landed in T019. Same redaction applies to traces
(Grafana Cloud) — single source of truth.

If incident review shows a sensitive key escaped redaction, **add it
to `SENSITIVE_KEYS` in `redact.ts`** and ship a hotfix; do not patch the
Better Stack ingest pipeline (which has no redaction layer).

## 6. Rotation

When you rotate the Better Stack source token (recommended: every 90
days, or immediately on any incident):

1. Better Stack → source → **Rotate token**.
2. Update `BETTER_STACK_OTLP_AUTH` in Render env editor.
3. Save → Render redeploys → `/health` confirms `last_export_at`
   updates.

## 7. Cost gate

Free tier: 1 GB/month + 3-day retention. The 8-user pilot at 12 hr/day
generates ~50-100 MB/month based on Day-2 stretch baseline (Nest
bootstrap + audit-log writes + LLM gateway calls + R2 presigned-URL
mints). Comfortable headroom; no upgrade needed for PM1.

If retention ≥ 7 days becomes a requirement (incident postmortems older
than 3 days), the **paid tier starts at $25/mo** — would need ADR + cost
gate amendment per CLAUDE.md hard rule #1.

---

## Cross-references

- `docs/deploy/render-runbook.md` — env-var matrix
- `apps/api/src/observability/otel-logs.config.ts` — the SDK setup
- `apps/api/src/observability/redact.ts` — SENSITIVE_KEYS list
- `apps/api/src/observability/__tests__/otel.spec.ts` — redaction tests
- `.claude/rules/api.md` — "no third-party logger transports" rule
