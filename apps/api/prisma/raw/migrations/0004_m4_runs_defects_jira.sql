-- ─────────────────────────────────────────────────────────────────────────────
-- 0004_m4_runs_defects_jira.sql — M4 schema (Day-17 SCRATCH DRAFT, NOT applied)
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Status: SCRATCH DRAFT ONLY. NOT committed. NOT applied to Neon.
--   Will be promoted to apps/api/prisma/raw/migrations/0004_m4_runs_defects_jira.sql
--   on Day-18 when M3 closes + M4 kicks off, after Yogesh confirms
--   the Option A pre-flight SQL check (row counts + enum value sets).
--
-- Spec: PM1_ERD v2.1 §3.6 (RCA sequence) · §3.7 (Jira 2-way sync) ·
--       §3.9 (Defect state machine) · §3.10 (Test Run state machine) ·
--       §7 (HMAC-SHA256 audit chain) · TB-011 / TB-012 / TB-013 / TB-014 /
--       TB-015 / TB-016 (column schemas).
--
-- Resolved A-F decision matrix (Day-17, Yogesh-confirmed):
--   A — ALTER existing test_run_results (NOT new test_executions). Add
--       actual_result + evidence_ids + blocked_reason. The "test_executions"
--       name in the original brief was a misnomer; the canon table is
--       test_run_results per TB-012.
--   B — ALTER existing jira_connections (NOT new jira_integrations). Add
--       status_mapping JSONB. Extend jira_auth_method enum to include
--       api_token. Re-purpose oauth_access_token_encrypted column to
--       hold api_token payload when auth_method='api_token' (column
--       reuse via discriminated union; AES-GCM encryption layer is
--       agnostic to the plaintext shape inside).
--   C — SKIP jira_links. The 1:1 defect↔jira FK via defect.jira_issue_id
--       (TB-015) is the canonical link; no M:N join table needed.
--   D — ALTER existing rca_reports (NOT new defect_rca). Add 5 confidence
--       DOUBLE PRECISION columns (layer1_confidence ... layer5_confidence)
--       + otel_trace_id TEXT + feedback JSONB. Preserve the existing
--       per-layer JSON columns; ADD the confidence/trace/feedback on top.
--   E — ALTER defects. Add component + verified_at + closed_at. SKIP
--       state (column is status, enum already has all values), SKIP
--       assignee_id (already exists per TB-015 + schema.prisma:626).
--   F — Enum casing: snake_case lowercase (matches existing canon).
--       defect_status: new/triaged/in_progress/resolved/verified/closed/
--       reopened/blocked. test_run_status: queued/running/passed/failed/
--       blocked/aborted. These ALREADY EXIST per schema.prisma:60-127.
--
-- New tables (additive):
--   - evidence — FK to test_run_result OR defect (XOR via check
--     constraint); r2_path; signed_url_expires_at; created_by; audit_log_id.
--   - defect_history — state transitions audit trail; chained to
--     audit_log.id.
--   - jira_webhook_events — inbound webhook event log (deduplicated by
--     Jira's event_id); processed boolean; payload JSONB.
--   - jira_sync_logs — outbound + inbound sync action log; SHA-256
--     payload_hash; http_status; retried boolean; audit_log_id.
--
-- Excluded per brief (deferred to M5):
--   - defect_comments (entire table)
--   - auto_assign_rules
--   - reporting/dashboard tables
--
-- SAFETY:
--   - All ALTERs are ADD COLUMN IF NOT EXISTS (idempotent re-run safe).
--   - All new tables are CREATE TABLE IF NOT EXISTS.
--   - Enum extension uses ALTER TYPE ... ADD VALUE IF NOT EXISTS (Postgres
--     14+ supports this).
--   - NO DROP COLUMN, NO destructive cast.
--   - Assumption (Option A): zero existing rows in test_run_results,
--     defects, jira_*, rca_reports (M4 features haven't shipped yet).
--     If Yogesh's pre-flight reveals rows with legacy enum values
--     that don't map cleanly → STOP, switch to Option B 3-step
--     migration (add new col, backfill, drop old). ESCALATE per
--     Hard Rule 11.
--
-- PRE-FLIGHT (✅ COMPLETED 2026-05-13 Day-17 by Yogesh on Neon prod):
--   SELECT COUNT(*) FROM test_runs;             → 0
--   SELECT COUNT(*) FROM test_run_results;      → 0
--   SELECT COUNT(*) FROM defects;               → 0
--   SELECT COUNT(*) FROM rca_reports;           → 0
--   SELECT COUNT(*) FROM jira_connections;      → 0
--   SELECT DISTINCT status FROM test_runs;      → (no rows)
--   SELECT DISTINCT status FROM defects;        → (no rows)
--
-- Lock: Option A (direct ALTER) is SAFE. No legacy data to backfill.
-- Option B 3-step fallback NOT triggered. All ADD COLUMN IF NOT EXISTS +
-- ALTER TYPE ... ADD VALUE IF NOT EXISTS idempotency guards remain for
-- safe re-apply protection.
--
-- INVOCATION (Yogesh-only, NOT auto-applied in CI):
--   pnpm --filter @qa-nexus/api prisma:apply-raw:0004
--   (Script entry to add in apps/api/package.json after this scratch
--   promotes to the raw/migrations/ dir.)
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 1 — ENUM EXTENSIONS
-- ═══════════════════════════════════════════════════════════════════════════

-- Extend jira_auth_method to include api_token (PM3 will add pat /
-- custom_oauth). Per Yogesh's Day-17 Jira decision: PM1 supports both
-- api_token (simpler bootstrapping, no IT OAuth dance) AND oauth_3lo
-- (production-grade, eventual default). Status mapping per integration.
ALTER TYPE jira_auth_method ADD VALUE IF NOT EXISTS 'api_token';

-- defect_status, test_run_status, test_result_status, jira_connection_status
-- already match the brief (per schema.prisma:60-160). No enum changes needed.

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 2 — ALTER EXISTING TABLES
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── A. test_run_results — add execution result detail columns ───────────
ALTER TABLE test_run_results
  ADD COLUMN IF NOT EXISTS actual_result TEXT,
  ADD COLUMN IF NOT EXISTS evidence_ids JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS blocked_reason TEXT;

COMMENT ON COLUMN test_run_results.actual_result IS
  'M4 (Day-17 0004) — what the tester actually saw during execution. Free text. Surfaces in F20 Run Results detail panel.';
COMMENT ON COLUMN test_run_results.evidence_ids IS
  'M4 (Day-17 0004) — JSONB array of evidence.id UUIDs attached to this execution. Denormalized for fast lookup; canonical source is evidence.test_run_result_id.';
COMMENT ON COLUMN test_run_results.blocked_reason IS
  'M4 (Day-17 0004) — when status=blocked, required free-text reason. Surfaces in F20 + drives A4 RCA L1 (environment context).';

-- ─── B. jira_connections — add status_mapping + extend for api_token ─────
ALTER TABLE jira_connections
  ADD COLUMN IF NOT EXISTS status_mapping JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS account_email TEXT;

COMMENT ON COLUMN jira_connections.status_mapping IS
  'M4 (Day-17 0004) — per-integration Jira status → defect_status map. JSONB object {"Open":"new","In Progress":"in_progress",...}. Empty {} = use default map.';
COMMENT ON COLUMN jira_connections.account_email IS
  'M4 (Day-17 0004) — required when auth_method=api_token; the Atlassian account whose API token is in oauth_access_token_encrypted. NULL when auth_method=oauth_3lo (BetterAuth tracks user identity).';
COMMENT ON COLUMN jira_connections.oauth_access_token_encrypted IS
  'M4 (Day-17 0004) repurposed — holds OAuth access token (oauth_3lo) OR Jira API token (api_token), distinguished by auth_method column. AES-GCM encrypted at app layer via apps/api/src/llm/crypto.ts (BETTER_AUTH_SECRET keyed).';

-- ─── D. rca_reports — add 5-layer confidence + OTel trace + feedback ─────
ALTER TABLE rca_reports
  ADD COLUMN IF NOT EXISTS layer1_confidence DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS layer2_confidence DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS layer3_confidence DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS layer4_confidence DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS layer5_confidence DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS otel_trace_id TEXT,
  ADD COLUMN IF NOT EXISTS feedback JSONB DEFAULT '{}'::jsonb;

-- Confidence range constraint — 0.0 to 1.0 per A4 spec confidence canon
-- (L1=0.90, L2=0.80, L3=0.60, L4=0.50, L5=0.40 baseline values; runtime
-- A4 computes per-defect actuals).
ALTER TABLE rca_reports
  ADD CONSTRAINT rca_reports_layer1_confidence_range
    CHECK (layer1_confidence IS NULL OR (layer1_confidence >= 0.0 AND layer1_confidence <= 1.0)),
  ADD CONSTRAINT rca_reports_layer2_confidence_range
    CHECK (layer2_confidence IS NULL OR (layer2_confidence >= 0.0 AND layer2_confidence <= 1.0)),
  ADD CONSTRAINT rca_reports_layer3_confidence_range
    CHECK (layer3_confidence IS NULL OR (layer3_confidence >= 0.0 AND layer3_confidence <= 1.0)),
  ADD CONSTRAINT rca_reports_layer4_confidence_range
    CHECK (layer4_confidence IS NULL OR (layer4_confidence >= 0.0 AND layer4_confidence <= 1.0)),
  ADD CONSTRAINT rca_reports_layer5_confidence_range
    CHECK (layer5_confidence IS NULL OR (layer5_confidence >= 0.0 AND layer5_confidence <= 1.0));

COMMENT ON COLUMN rca_reports.layer1_confidence IS
  'M4 (Day-17 0004) — A4 L1 (stack/exception) confidence 0.0-1.0. Canon baseline 0.90.';
COMMENT ON COLUMN rca_reports.layer2_confidence IS
  'M4 (Day-17 0004) — A4 L2 (env/config) confidence. Canon baseline 0.80.';
COMMENT ON COLUMN rca_reports.layer3_confidence IS
  'M4 (Day-17 0004) — A4 L3 (recent code changes) confidence. Canon baseline 0.60.';
COMMENT ON COLUMN rca_reports.layer4_confidence IS
  'M4 (Day-17 0004) — A4 L4 (similar historical defects via pgvector) confidence. Canon baseline 0.50.';
COMMENT ON COLUMN rca_reports.layer5_confidence IS
  'M4 (Day-17 0004) — A4 L5 (data state) confidence. Canon baseline 0.40.';
COMMENT ON COLUMN rca_reports.otel_trace_id IS
  'M4 (Day-17 0004) — OTel trace_id for the A4 Promise.all parallel orchestration. Permits Grafana Cloud drill-down from F21 Defects Hub RCA panel.';
COMMENT ON COLUMN rca_reports.feedback IS
  'M4 (Day-17 0004) — user feedback JSONB: {"rating":1-5, "correct_layer":1-5|null, "comment":text|null, "submitted_by":user.id, "submitted_at":timestamptz}. Drives DeepEval golden-set refresh.';

-- ─── E. defects — add component + verified_at + closed_at ────────────────
ALTER TABLE defects
  ADD COLUMN IF NOT EXISTS component TEXT,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;

COMMENT ON COLUMN defects.component IS
  'M4 (Day-17 0004) — free-text component label (e.g. "checkout-flow", "payments-gateway", "auth"). Surfaces in F21 Defects Hub filter + A4 RCA L3 (recent commits in component).';
COMMENT ON COLUMN defects.verified_at IS
  'M4 (Day-17 0004) — stamped on status transition resolved → verified. Surfaces "time-to-verify" SLA in F25 Executive Dashboard.';
COMMENT ON COLUMN defects.closed_at IS
  'M4 (Day-17 0004) — stamped on status transition verified → closed. Permanent terminal state; differs from resolved_at which is the dev-side fix-complete moment.';

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 3 — NEW TABLES
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 5. evidence ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS evidence (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_run_result_id       UUID REFERENCES test_run_results(id) ON DELETE CASCADE,
  defect_id                UUID REFERENCES defects(id) ON DELETE CASCADE,
  r2_path                  TEXT NOT NULL,
  signed_url_expires_at    TIMESTAMPTZ,
  content_type             TEXT,
  size_bytes               BIGINT,
  filename                 TEXT,
  created_by               UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  audit_log_id             UUID REFERENCES audit_log(id) ON DELETE SET NULL,

  -- XOR: must attach to exactly ONE of test_run_result or defect (not both, not neither).
  CONSTRAINT evidence_exactly_one_parent
    CHECK ((test_run_result_id IS NOT NULL)::int + (defect_id IS NOT NULL)::int = 1)
);

CREATE INDEX IF NOT EXISTS idx_evidence_test_run_result ON evidence (test_run_result_id) WHERE test_run_result_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_evidence_defect ON evidence (defect_id) WHERE defect_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_evidence_created_by ON evidence (created_by);

COMMENT ON TABLE evidence IS
  'M4 (Day-17 0004) — screenshots / HARs / logs / videos attached to a test_run_result OR a defect (XOR). r2_path is the canonical R2 key; signed_url_expires_at is the lifetime of the currently-issued presigned URL (re-issue if expired).';

-- ─── 6. defect_history ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS defect_history (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  defect_id         UUID NOT NULL REFERENCES defects(id) ON DELETE CASCADE,
  from_status       defect_status,
  to_status         defect_status NOT NULL,
  actor_id          UUID REFERENCES users(id) ON DELETE SET NULL,
  comment           TEXT,
  transitioned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  audit_log_id      UUID REFERENCES audit_log(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_defect_history_defect ON defect_history (defect_id, transitioned_at);
CREATE INDEX IF NOT EXISTS idx_defect_history_actor ON defect_history (actor_id);

COMMENT ON TABLE defect_history IS
  'M4 (Day-17 0004) — state-transition audit trail for defects. Insert one row per status change. from_status=NULL on the initial Create row. transitioned_at + audit_log_id make this a tamper-evident chain via the audit_log HMAC reference.';

-- ─── 7. jira_webhook_events ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS jira_webhook_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        TEXT NOT NULL UNIQUE,            -- Jira's unique event id; dedupe key
  jira_issue_key  TEXT,                            -- e.g., "RET-247"
  event_type      TEXT NOT NULL,                   -- "jira:issue_updated", "jira:issue_created", etc.
  payload         JSONB NOT NULL,
  signature_valid BOOLEAN NOT NULL,                -- HMAC-SHA256 webhook signature verification result
  processed       BOOLEAN NOT NULL DEFAULT FALSE,
  processing_error TEXT,                           -- non-null on failed processing attempts
  received_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_jira_webhook_events_unprocessed ON jira_webhook_events (received_at) WHERE processed = FALSE;
CREATE INDEX IF NOT EXISTS idx_jira_webhook_events_issue ON jira_webhook_events (jira_issue_key) WHERE jira_issue_key IS NOT NULL;

COMMENT ON TABLE jira_webhook_events IS
  'M4 (Day-17 0004) — inbound Jira webhook event log. UNIQUE on event_id for idempotent dedupe (Jira retries on 5xx). signature_valid=false rows kept for forensics. Process in worker via processed=false partial index.';

-- ─── 8. jira_sync_logs ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS jira_sync_logs (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jira_connection_id   UUID REFERENCES jira_connections(id) ON DELETE SET NULL,
  direction            TEXT NOT NULL CHECK (direction IN ('outbound', 'inbound')),
  action               TEXT NOT NULL,                   -- "create_issue", "update_status", "fetch_issue", "process_webhook", ...
  defect_id            UUID REFERENCES defects(id) ON DELETE SET NULL,
  jira_issue_key       TEXT,
  payload_hash         CHAR(64) NOT NULL,               -- SHA-256 hex of canonical request body
  http_status          INT,
  success              BOOLEAN NOT NULL,
  error_message        TEXT,
  retried              BOOLEAN NOT NULL DEFAULT FALSE,
  retry_of             UUID REFERENCES jira_sync_logs(id) ON DELETE SET NULL,
  occurred_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  audit_log_id         UUID REFERENCES audit_log(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_jira_sync_logs_connection ON jira_sync_logs (jira_connection_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_jira_sync_logs_defect ON jira_sync_logs (defect_id) WHERE defect_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jira_sync_logs_failures ON jira_sync_logs (occurred_at) WHERE success = FALSE;

COMMENT ON TABLE jira_sync_logs IS
  'M4 (Day-17 0004) — every Jira API call (outbound) or webhook processing (inbound). payload_hash for dedupe + diff detection. retried + retry_of form a retry chain. F28 Audit surfaces failed entries.';

COMMIT;

-- ─────────────────────────────────────────────────────────────────────────────
-- POST-APPLY VERIFICATION (run manually after pnpm prisma:apply-raw:0004):
-- ─────────────────────────────────────────────────────────────────────────────
-- -- New columns on existing tables
-- \d test_run_results
-- \d jira_connections
-- \d rca_reports
-- \d defects
-- -- New tables
-- \d evidence
-- \d defect_history
-- \d jira_webhook_events
-- \d jira_sync_logs
-- -- Enum extension
-- SELECT enum_range(NULL::jira_auth_method);
-- -- Expected: {oauth_3lo, api_token}
-- ─────────────────────────────────────────────────────────────────────────────
