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

## 7. Slack alerting — alert-rule setup (Day-5 #4)

Path (a) per Day-5 architectural decision: **Better Stack OWNS the
alerting**. The QA Nexus API just emits OTel logs at the appropriate
severity; Better Stack matches them against rules and posts to Slack.
This keeps the alert plane out of our app's hot path + lets ops tune
rules without redeploying.

### 7.1 Slack workspace prep

Yogesh-side, ~5 min. (Skip if `#qa-nexus-alerts` already exists.)

1. Slack workspace → **Apps → Incoming Webhooks → Add to Slack**.
2. Pick channel `#qa-nexus-alerts` (create if missing — recommended:
   private channel, members = Yogesh + Akshay only initially; expand
   to QA-Lead RBAC role if signal is good).
3. Copy the webhook URL (shape: `https://hooks.slack.com/services/T.../B.../xyz`).

### 7.2 Better Stack → Slack integration

1. Better Stack → **Integrations → Slack → Connect**.
2. Paste the webhook URL from §7.1.
3. Test connection (Better Stack sends a "hello" message; verify it
   lands in `#qa-nexus-alerts`).

### 7.3 Three alert rules (deploy in this order)

Better Stack → **Alerts → Create Rule**. All three pointed at the
same Slack integration from §7.2.

| #   | Rule name                | Match                                                              | Action               | Rate limit         |
| --- | ------------------------ | ------------------------------------------------------------------ | -------------------- | ------------------ |
| 1   | `qa-nexus-error`         | `severity_number >= 17` (ERROR per OTel spec)                      | Slack to alerts chan | 1/min              |
| 2   | `qa-nexus-deferred-mode` | `body contains "DEFERRED mode"` OR `body contains "deferred=true"` | Slack to alerts chan | 1/5min (de-bounce) |
| 3   | `qa-nexus-oom-or-crash`  | `body contains "OOM"` OR `body contains "Bootstrap failed"`        | Slack to alerts chan | 1/min              |

**Why these three:**

- **Rule 1** catches anything we explicitly logged as ERROR — Nest's
  exception filter already routes uncaught exceptions through
  `Logger.error()` which emits at severity 17.
- **Rule 2** catches the deferred-mode subsystem warnings from
  hotfix-2 (`LLMGateway running in DEFERRED mode...`,
  `EmbeddingService running in DEFERRED mode...`,
  `EmbeddingService refusing to load (pre-flight memory guard)...`).
  These don't always come through as ERROR severity (some are WARN)
  but matter for ops awareness.
- **Rule 3** catches process-level catastrophes — sharp native binary
  missing, Render OOM-kicks, NestFactory.create rejection at boot.

**Rate limit rationale:** Rule 2 uses 1/5min because deferred-mode is
a steady-state condition until Yogesh sets the env var — we don't want
30 Slack pings in the first hour of a misconfiguration. Rules 1 and 3
use 1/min because these are typically transient + actionable.

### 7.4 Verify alert path end-to-end

Once rules + Slack integration are live:

```bash
curl -X POST https://qa-nexus-api.onrender.com/admin/alerts/test-slack \
  -H "Cookie: better-auth.session_token=<your-admin-cookie>"
```

Endpoint emits a single log record at severity ERROR with a unique
`test_marker` in the body. Within ~30 seconds you should see a Slack
message in `#qa-nexus-alerts` containing that marker. The endpoint's
JSON response includes the marker for grep-search confirmation.

If no Slack message arrives:

1. Check Better Stack → **Live tail** — did the log record arrive at
   Better Stack? If not, the OTel logs exporter isn't wired (env vars
   missing or wrong). See §1 + `/health` `otel.logs.deferred_reason`.
2. Check Better Stack → **Alerts → Rule firings** — did any rule
   match the event? If yes but no Slack message, the Slack
   integration is broken (re-test §7.2).
3. Check Slack → channel permissions — make sure the webhook is
   active + the channel allows the webhook bot to post.

### 7.5 Sample alert payload — what Slack receives

For an OOM crash on Render, the typical Slack message looks like:

```
🔴 [Better Stack] qa-nexus-oom-or-crash
qa-nexus-api-prod · 2026-04-30 14:22:11 UTC

Bootstrap failed: Error: Cannot find module '../build/Release/sharp-linux-x64.node'
trace_id: 9b1c... — view in Grafana Tempo
```

For a deferred-mode log:

```
🟡 [Better Stack] qa-nexus-deferred-mode
qa-nexus-api-prod · 2026-05-01 09:15:33 UTC

LLMGateway running in DEFERRED mode (no provider configured): LLM_PRIMARY_PROVIDER env var is required (e.g. "groq"). Available providers: groq, gemini.
trace_id: f3a7... — view in Grafana Tempo
```

The `trace_id` link is auto-injected by Better Stack's Grafana Cloud
integration when both sources share a tenant; if you don't see it,
check Better Stack → **Source → Settings → Linked sources**.

### 7.6 Tuning + de-bounce (post-pilot)

Day-5 rules are intentionally noisy on the cautious side. After 1 week
of pilot operation:

- If Rule 2 (deferred-mode) fires every 5 min during steady-state
  because LLM stays deferred until F26 (M1) — that's expected
  behavior. Either silence the rule until F26 lands OR add an
  exclusion for `body contains "F26 UI in M1"` (the runbook-specific
  marker we already include in the deferred reason).
- If Rule 1 fires too often during normal traffic spikes — narrow to
  `severity_number >= 21` (FATAL only) or add a body exclusion for
  known-noisy errors.
- Track false-positive rate in `docs/observability/alert-tuning.md`
  (new file at first tuning).

---

## 8. Cost gate

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
