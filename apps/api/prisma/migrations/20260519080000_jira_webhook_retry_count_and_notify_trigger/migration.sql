-- QA Nexus PM1 — Day-22 P1 — Jira webhook scaffold per ratified ADR-020 §7.
--
-- Adds the missing pieces to the existing `jira_webhook_events` table so
-- the webhook receiver can drop a staging row + notify a processor in
-- under 500ms (ADR-020 §7 hard budget) without holding the request
-- handler open for any LLM / Sherlock work.
--
-- 1. retry_count column — populated by the Day-23 wire-up when the
--    processor implements retry-with-backoff on transient failures.
-- 2. Postgres NOTIFY trigger — AFTER INSERT ON jira_webhook_events emits
--    pg_notify('webhook_received', NEW.id::text). A pg-listen subscriber
--    on the NestJS side pulls the row + drives the async pipeline.
--
-- Channel name 'webhook_received' is generic (not jira-prefixed) so
-- future webhook sources (GitHub, Slack) can reuse the same fan-out
-- pattern with a `source` column added then.

-- 1. retry_count column
ALTER TABLE "jira_webhook_events"
  ADD COLUMN IF NOT EXISTS "retry_count" INTEGER NOT NULL DEFAULT 0;

-- Index on (processed, received_at) — used by the fallback "find unprocessed"
-- scan if the LISTEN/NOTIFY subscriber misses an event (process crash, etc).
CREATE INDEX IF NOT EXISTS "jira_webhook_events_processed_received_at_idx"
  ON "jira_webhook_events" ("processed", "received_at");

-- 2. NOTIFY trigger function — idempotent CREATE OR REPLACE so the
-- migration can re-run safely. Trigger fires AFTER INSERT only;
-- updates do not re-notify (processor sets processed=true on a row
-- and we don't want a re-fire).
CREATE OR REPLACE FUNCTION "notify_webhook_received"()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('webhook_received', NEW.id::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "jira_webhook_events_notify_received_trg"
  ON "jira_webhook_events";

CREATE TRIGGER "jira_webhook_events_notify_received_trg"
  AFTER INSERT ON "jira_webhook_events"
  FOR EACH ROW
  EXECUTE FUNCTION "notify_webhook_received"();
