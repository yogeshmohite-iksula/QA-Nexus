# feedback — Jira webhook 20s response budget (Day-22 ADR-020 ratification hurdle)

**Status:** ADOPTED into ADR-020 §7 (BINDING) at Day-22 2026-05-19 11:30 IST ratification meeting.

## TL;DR

Atlassian Jira Cloud webhooks enforce **5s connection + 20s response timeout**. Synchronous "receive → verify → Sherlock-trigger → DB-write → 200 OK" handlers ROUTINELY blow the budget because Sherlock's `Promise.all` LLM fan-out is 4-12s p95 (per ADR-019). Late `200 OK` → Atlassian retries 5× with exponential backoff → cascading retry storms that compound Neon CU-hr burn + audit-log noise.

This was caught in Day-22 research addendum HURDLE-3. The ADR-020 draft did NOT explicitly mandate the async-write pattern — without ratification surfacing this, BE+1 would likely have implemented synchronous-by-default.

## The contract (BINDING for M5 inbound `/webhooks/jira`)

```
1. Verify HMAC signature                              ≤ 50ms   (BLOCKING; reject 401 on fail)
2. INSERT into webhook_event staging table            ≤ 100ms  (raw payload + processed=false)
3. Postgres NOTIFY 'webhook_event:new', <event_id>    ≤ 10ms   (same Tx as step 2)
4. Return 200 OK to Atlassian                         target < 500ms p95 total
   ── ASYNC BOUNDARY ──
5. NestJS @OnEvent listener (subscribed via pg-listen) picks up the NOTIFY
6. Listener runs heavy work: Zod-parse → idempotency check → jira_issue upsert
   → audit_log write → optional Sherlock trigger (via existing orchestrator,
   NOT in the webhook hot path)
7. Listener sets webhook_event.processed=true + processed_at=now() on success
```

## Why Postgres `LISTEN/NOTIFY` (not BullMQ / Redis / EventEmitter)

- Hard Rule 5 bans Redis / Valkey / Memcached / BullMQ.
- `LISTEN/NOTIFY` ships with Postgres natively; `pg-listen` npm package gives NestJS lifecycle hook.
- Single Render Free dyno satisfies "single consumer" guarantee. M6+ multi-dyno: same pattern + advisory locks.
- EventEmitter is in-process — loses durability across dyno restarts. NOT acceptable.

## Idempotency lift via UNIQUE INDEX

```sql
CREATE TABLE webhook_event (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jira_connection_id  UUID NOT NULL REFERENCES jira_connection(id),
  atlassian_event_id  TEXT NOT NULL,                    -- from X-Atlassian-Webhook-Identifier header
  webhook_event       TEXT NOT NULL,                    -- e.g. 'jira:issue_updated'
  raw_payload         JSONB NOT NULL,
  received_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed           BOOLEAN NOT NULL DEFAULT false,
  processed_at        TIMESTAMPTZ,
  error_message       TEXT,
  retry_count         SMALLINT NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX webhook_event_atlassian_dedup
  ON webhook_event (jira_connection_id, atlassian_event_id);
CREATE INDEX webhook_event_processing_queue
  ON webhook_event (processed, received_at) WHERE processed = false;
```

Duplicate Atlassian retry → unique-violation → handler catches → fast `200 OK` (no NOTIFY fired the second time). Atlassian sees success; processor never re-runs.

## Cold-dyno-window handling

Render Free dynos sleep after 15min idle. If a webhook arrives DURING cold-start:

- Atlassian's 5s connection timeout fires (dyno takes 10-20s to wake).
- Atlassian retries 5× with exponential backoff (typically lands on warm dyno by retry 2-3).
- For rare full-window miss, the daily reconciliation cron (ADR-020 §1) catches the gap via REST puller.
- UptimeRobot 5min keep-alive (Day-18 deployed) makes cold-window practically negligible at pilot scale.

## Forbidden patterns (visual review FAIL triggers)

- Calling `LLMGateway` / `Sherlock` / any external HTTP from inside `/webhooks/jira` handler
- Skipping the `webhook_event` INSERT and processing inline
- Returning 200 OK BEFORE the INSERT commits (data loss on crash)
- Implementing dispatch via in-memory `EventEmitter` instead of Postgres `LISTEN/NOTIFY`

## Observability mandate

Two OTel spans:

- `jira.webhook.receive` — covers steps 1-4; target p95 < 500ms
- `jira.webhook.process` — covers steps 5-7; target p95 < 8s (Sherlock upper bound)

Lets us monitor handler latency separately from processor latency. Independent SLOs.

## Cross-references

- ADR-020 §7 — full binding contract.
- ADR-019 — Sherlock 4-12s p95 LLM call latency (the trigger for needing async).
- `.claude/scratch/day-22-research-addendum.md` HURDLE-3 — empirical basis (Atlassian Feb-2024 webhook spec).
- Hard Rule 5 — Redis / BullMQ ban-list driving `LISTEN/NOTIFY` choice.
- Hard Rule 7 — audit_log writes on each processed step.

## Reuse pattern (M6+ candidates)

This `staging_table + pg LISTEN/NOTIFY + @OnEvent processor` pattern generalizes to ANY external webhook that needs async processing:

- Slack webhooks (M5: F23 "share report" affordance posts to Slack)
- Stripe webhooks (M7: pricing wire-up — far future)
- GitHub webhooks (M8+: CI integration)

When a new webhook surfaces, default to this pattern. Don't re-litigate sync-vs-async.

---

_Entry Day-22 2026-05-19 ~14:45 IST. Ratification + adoption in same session. Promote to STACK_LEARNINGS.md once 2nd webhook adopts the pattern._
