-- QA Nexus PM1 — Day-29 fix: backfill the MISSING CREATE TABLE for
-- `jira_webhook_events` (clean-DB migration-interleave gap).
--
-- ROOT CAUSE: the `JiraWebhookEvent` model (schema.prisma) reached the original
-- qa-nexus database via an early `prisma db push` / manual create whose
-- migration was never generated. The migration chain therefore had NO migration
-- that CREATEs the table — only the later `20260519080000_jira_webhook_retry_
-- count_and_notify_trigger` migration which ALTERs it. On a FRESH database that
-- ALTER fails ("relation \"jira_webhook_events\" does not exist", P3018),
-- which blocked the qa-nexus-2 switchover (2026-06-18) and would block the
-- Jul-1 switchback to qa-nexus.
--
-- FIX: this migration backfills the CREATE, timestamped BEFORE the ALTER so it
-- sorts first (m3 20260507 → THIS 20260518 → ALTER 20260519). The table is
-- created in its CURRENT model shape (incl. retry_count + all indexes) so the
-- schema matches schema.prisma immediately; the subsequent ALTER's
-- `ADD COLUMN IF NOT EXISTS retry_count` + `CREATE INDEX IF NOT EXISTS …` become
-- idempotent no-ops and only its NOTIFY trigger is net-new.
--
-- IDEMPOTENT: every statement is IF NOT EXISTS, so this is a safe no-op on the
-- OLD qa-nexus DB (which already has the table) — `prisma migrate deploy`
-- records it as applied there without changing anything. The model has NO
-- relations, so there are no foreign keys / ordering dependencies.
--
-- Day-29 ledger item "fresh-DB migration interleave (raw-SQL vs Prisma ordering
-- on clean DB)" — CLOSED by this migration.

CREATE TABLE IF NOT EXISTS "jira_webhook_events" (
    "id" UUID NOT NULL,
    "event_id" TEXT NOT NULL,
    "jira_issue_key" TEXT,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "signature_valid" BOOLEAN NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processing_error" TEXT,
    "received_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMPTZ(6),
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "jira_webhook_events_pkey" PRIMARY KEY ("id")
);

-- @unique on event_id
CREATE UNIQUE INDEX IF NOT EXISTS "jira_webhook_events_event_id_key"
    ON "jira_webhook_events" ("event_id");

-- @@index([receivedAt])
CREATE INDEX IF NOT EXISTS "jira_webhook_events_received_at_idx"
    ON "jira_webhook_events" ("received_at");

-- @@index([jiraIssueKey])
CREATE INDEX IF NOT EXISTS "jira_webhook_events_jira_issue_key_idx"
    ON "jira_webhook_events" ("jira_issue_key");

-- @@index([processed, receivedAt]) — also (re)created idempotently by the
-- 20260519080000 ALTER; harmless duplicate, kept here so a fresh DB matches the
-- model after THIS migration alone.
CREATE INDEX IF NOT EXISTS "jira_webhook_events_processed_received_at_idx"
    ON "jira_webhook_events" ("processed", "received_at");
