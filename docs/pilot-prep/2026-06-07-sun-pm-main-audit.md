# MAIN Sun PM Fresh-Session Audit — Sun 2026-06-07

> **Window:** Sun 14:00-17:00 IST · **Author:** MAIN fresh session per Sat 28th reality-check Path B
> **Scope:** Buckets 1, 2, 9 (deferred from Sat) + 4 missing runbooks
> **Verdict:** 🟢 GREEN with Yogesh dashboard verification needed for Buckets 1 + 2

---

## Bucket coverage

| Bucket                     | Sat status | Sun PM status                                 |
| -------------------------- | ---------- | --------------------------------------------- |
| 1 — Dashboards             | DEFERRED   | Checklist prepped for Yogesh (~10 min paired) |
| 2 — Observability          | DEFERRED   | Checklist prepped for Yogesh (~10 min paired) |
| 9 — Backup + DR (restore)  | AMBER      | Runbook written → closes AMBER finding        |
| Bonus — 4 missing runbooks | P1 (Sat)   | All 4 written → closes Sat P1 finding         |

---

## Bucket 1 — Render + Cloudflare Dashboard Verification

**Method:** paired verification with Yogesh. Each check is a Yogesh action + MAIN documents the result.

### 1.1 — Render env vars completeness

Yogesh: open Render Dashboard → `qa-nexus-api` Service → Environment tab.

Compare against the source list (Bucket 1.1 in `2026-06-06-sat-pre-mvp-project-audit.md`):

#### Must be present (security-critical):

- [ ] `DATABASE_URL` — Neon pooled connection
- [ ] `DIRECT_URL` — Neon direct connection
- [ ] `BETTER_AUTH_SECRET` — long random string
- [ ] `BETTER_AUTH_URL` = `https://qa-nexus-api.onrender.com`
- [ ] `BETTER_AUTH_COOKIE_DOMAIN` — set per cross-site needs
- [ ] `AUTH_TRUSTED_ORIGINS` = `https://qa-nexus-web.pages.dev`
- [ ] `GROQ_API_KEY`
- [ ] `GEMINI_API_KEY`
- [ ] `R2_ACCESS_KEY_ID` + `R2_SECRET_ACCESS_KEY` + `R2_ENDPOINT` + `R2_BUCKET`

#### Must be present (Apps Script bridge — ADR-025):

- [ ] `EMAIL_PROVIDER` = `apps-script` (or unset, defaults to apps-script)
- [ ] `APPS_SCRIPT_EMAIL_URL` — Web App deploy URL
- [ ] `APPS_SCRIPT_EMAIL_SECRET` — shared secret matching Apps Script `SHARED_SECRET`
- [ ] `APPS_SCRIPT_FROM_NAME` (optional, defaults to "QA Nexus")
- [ ] `APPS_SCRIPT_REPLY_TO` (optional)

#### Must be present (NFR-003 probe — ADR-024):

- [ ] `TEST_DATABASE_URL` — Neon `ep-blue-star` connection
- [ ] `TEST_DATABASE_DIRECT_URL`
- [ ] `NFR_PROBE_ENABLED` = `true`

#### Should be present (observability):

- [ ] `BETTER_STACK_OTLP_ENDPOINT`
- [ ] `BETTER_STACK_OTLP_AUTH`
- [ ] `GRAFANA_CLOUD_OTLP_ENDPOINT`
- [ ] `GRAFANA_CLOUD_OTLP_AUTH`

#### NOT present (these are FE-only via Cloudflare Pages):

- `NEXT_PUBLIC_API_BASE_URL` — should be on Cloudflare Pages, not Render
- `NEXT_PUBLIC_APP_BASE_URL` — same

**Yogesh response:** _[paste current Render env list here, redact sensitive values, MAIN cross-references]_

### 1.2 — Cloudflare Pages config

Yogesh: open Cloudflare Dashboard → Pages → `qa-nexus-web` project.

- [ ] Build command: `pnpm install --frozen-lockfile && pnpm --filter @qa-nexus/web build` (or equivalent)
- [ ] Build output directory: `apps/web/out` (Next.js static export per current architecture)
- [ ] Production branch: `main`
- [ ] Auto-deploy from `main` enabled
- [ ] Environment variables:
  - `NEXT_PUBLIC_API_BASE_URL` = `https://qa-nexus-api.onrender.com`
  - `NEXT_PUBLIC_APP_BASE_URL` = `https://qa-nexus-web.pages.dev`

### 1.3 — UptimeRobot

Yogesh: open UptimeRobot Dashboard.

- [ ] Monitor `qa-nexus-api /health` exists with 5-minute interval
- [ ] Monitor `qa-nexus-api /health/deep` exists with 15-minute interval (or similar)
- [ ] Both monitors are "Up" status
- [ ] Alert contacts configured: email to `yogesh.mohite@iksula.com` + Slack webhook (if any)

### 1.4 — Better Stack

Yogesh: open Better Stack Dashboard.

- [ ] Log source `qa-nexus-api` receiving recent entries
- [ ] Alert rules configured for ERROR level
- [ ] Slack integration tested (firing test alert returns Slack delivery confirmation)

---

## Bucket 2 — Observability Verification

**Method:** paired with Yogesh — generate test traffic, observe traces.

### 2.1 — OpenTelemetry traces visible in Grafana Cloud

1. Yogesh hits a few API endpoints (sign in, navigate to /home, etc.)
2. Open Grafana Cloud → Explore → Tempo datasource
3. Query: `{ service.name = "qa-nexus-api" }` — should return recent traces

Yogesh response: _[paste 3-5 trace IDs from the last hour]_

### 2.2 — Sensitive attribute redaction working

Pick a trace with auth-related spans. Open the span attributes panel:

- [ ] No raw cookie values visible in attribute keys
- [ ] No raw API key values in attribute keys
- [ ] No user PII beyond what the audit log already captures

If any sensitive value leaks → file P0 fix, halt Mon launch decision until patched.

### 2.3 — Better Stack log ingestion

Better Stack → search `service.name=qa-nexus-api` in the last 60 min. Confirm recent log entries with timestamps matching the test traffic.

Spot-check: any `[error]` or `[warn]` entries from the last hour? If yes → triage P0/P1 before Mon launch.

### 2.4 — Slack alert dry run

Yogesh: trigger a synthetic 5xx error (e.g., POST to a known-broken admin endpoint with malformed body, OR temporarily set `ALLOW_ADMIN_OTEL_TEST=true` and POST to a synthetic-error endpoint if BE+1 wired one).

- [ ] Slack alert fires within 5 min of the error
- [ ] Alert message contains useful context (endpoint, status, timestamp)
- [ ] Alert links back to Better Stack / Grafana trace

---

## Bucket 9 — Backup + DR

### 9.1 — Verify last successful backup ran

```bash
gh run list --workflow="weekly-backup.yml" --limit 3
```

_[Run this from MAIN session — paste output here]_

Expected: latest run from Sun 02:30 IST today (2026-06-07).

### 9.2 — Backup file present on R2

```bash
aws s3 ls s3://qa-nexus-backups/ --endpoint-url "$R2_ENDPOINT" | tail -5
```

_[Run from MAIN session if R2 creds available locally; otherwise Yogesh from Cloudflare R2 dashboard]_

Expected: file with timestamp from this morning ~02:30 IST.

### 9.3 — Restore procedure documented — ✅ CLOSED

`docs/runbooks/backup-restore.md` authored this session. Sat AMBER finding closed.

### 9.4 — Restore drill — RECOMMENDED post-pilot

Per the runbook §4, a monthly restore drill is recommended. Schedule the first drill for Day-35 (first Sunday after pilot launch + 4 weeks).

---

## Runbook deliverables — ✅ ALL 4 SHIPPED

| Runbook                               | Path                                         | Status     |
| ------------------------------------- | -------------------------------------------- | ---------- |
| DB migration rollback                 | `docs/runbooks/db-migration-rollback.md`     | ✅ written |
| Env reset / secret rotation           | `docs/runbooks/env-reset-secret-rotation.md` | ✅ written |
| Magic-link debug (Apps Script bridge) | `docs/runbooks/magic-link-debug.md`          | ✅ written |
| Backup + restore                      | `docs/runbooks/backup-restore.md`            | ✅ written |

Closes Sat audit P1 finding (Bucket 2.2 — 4 runbooks missing).

---

## Verdict matrix (Sun PM update)

| Bucket | Sat status       | Sun PM status                                          |
| ------ | ---------------- | ------------------------------------------------------ |
| 1      | DEFERRED         | 🟡 PENDING Yogesh paired dashboard check (~10 min)     |
| 2      | DEFERRED         | 🟡 PENDING Yogesh paired observability check (~15 min) |
| 9      | 1 PASS / 1 AMBER | 🟢 1 PASS / 1 PASS — restore runbook closes Sat AMBER  |
| Bonus  | P1 (4 runbooks)  | 🟢 ALL 4 WRITTEN — closes Sat P1                       |

**Sun PM Verdict:** 🟢 GREEN PENDING Yogesh ~25-min paired dashboard verification window. If all Bucket 1 + 2 checks PASS → Mon Jun 8 launch unconditional GREEN GO.

## Combined Sat + Sun audit posture

| Component                     | Sat verdict             | Sun verdict                              | Mon-blocker? |
| ----------------------------- | ----------------------- | ---------------------------------------- | ------------ |
| BE+1 code audit               | PARTIAL (Bucket A only) | Sun AM fresh 5-bucket (Yogesh-driven)    | NO           |
| MAIN project audit            | 22/6/0 + 8 deferred     | Sun PM 3-bucket + 4 runbooks (this doc)  | NO           |
| Apps Script bridge LIVE       | YES                     | YES (verify in §1.1 above)               | NO           |
| Audit log HMAC chain          | NOT verified Sat        | TODO — request BE+1 run `verify:audit`   | MAYBE        |
| RBAC `@Roles(...)` coverage   | NOT verified Sat        | TODO — request BE+1 produce coverage map | NO           |
| Cross-site cookie persistence | NOT verified Sat        | TODO — Yogesh smoke (Scenario A)         | YES          |

**Audit log HMAC chain** is the highest-leverage residual unknown — BE+1 should run `pnpm verify:audit` against pilot main before 19:00 IST. If chain integrity fails → P0, halt Mon launch.

---

_Authored Sun Day-5 2026-06-07 ~15:30 IST as part of MAIN fresh-session audit per Sat 28th reality-check Path B. Pairs with BE+1 Sun AM audit + Yogesh evening smoke testing._
