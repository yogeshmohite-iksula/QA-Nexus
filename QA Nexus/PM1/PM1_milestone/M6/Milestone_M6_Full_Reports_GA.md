# QA NEXUS — MILESTONE M6: FULL REPORTS SUITE + GA

> ⚠️ **Tech stack updated 2026-04-25 — see PM1_PRD v8.1 / PM1_ERD v2.1 as binding. M6 is the v1 GA milestone — all 12 acceptance gates must pass before customer-facing release.**
> The task list below was written against the v1.0 self-hosted vision. For the actual M6 build:
> - **GA target date (locked):** 2026-09-21
> - **Build window:** Weeks 18, after M5 pilot validates the system on 8 Iksula users
> - **Frames at GA:** all 41 (17 Claude Design + 24 Claude Code, including F28m1 + F26m1 added v2.10) — no further frame additions in M6 unless a critical pilot finding demands one
> - **Reports Studio polish:** 4 templates → templated PDF/Excel/HTML export tested across all 4 priority levels (P0/P1/P2/P3) and all 3 release types (PaymentV2, Returns, Mobile App)
> - **Acceptance gates (binding from PM1_ERD v2.1 §10) — all 12 must pass for GA:**
>   1. 41 of 41 UI frames render at locked design tokens (no MD3 drift, no tertiary colors, no missing project switcher)
>   2. A1 eval ≥80% golden-set match
>   3. A2 eval <5% FP, ≥60% TP
>   4. A4 eval top-2 RCA accuracy ≥70% on 50-defect golden set
>   5. NFR-001 page load p50 <1.5s, p95 <3s
>   6. NFR-002 API latency p50 <200ms, p95 <500ms (excluding LLM calls)
>   7. NFR-003 agent latency: A1 <10s, A2 <500ms, A4 <15s at p95 (revised v2.1 — Groq is much faster than self-hosted Gemma)
>   8. NFR-014 RBAC all 4 roles correctly gated
>   9. HMAC audit chain integrity ≥99.95%
>   10. Pilot acceptance: 6 of 8 pilot users complete end-to-end flow without engineer intervention
>   11. Cost gate: monthly infrastructure spend = **$0** confirmed by SRE
>   12. Free-tier headroom check: each free tier (Groq RPD, Neon CU-hr, Render bandwidth, R2 storage) at <50% utilization at GA
> - **PM2 transition:** After GA on 2026-09-21, the team kicks off PM2 work. PM2 brings back FastAPI (for advanced agent work), Valkey (for BullMQ queues), self-healing agent A7, etc. — see project-level ERD §3 for the eventual self-hosted architecture.
> - **Cost discipline through GA:** $0/month entire build. If any acceptance gate forces a paid migration (e.g., Render Starter $7/mo for no-sleep), document the trade-off and get user approval before incurring spend.
>
> Use this M6 file for the GA launch checklist. For binding gate criteria, defer to PM1_PRD v8.1 §15 + §20 and PM1_ERD v2.1 §10.

**Milestone ID:** M6  
**Title:** Full Reports Suite + General Availability  
**Duration:** 5 weeks (2026-08-17 → 2026-09-20)  
**GA Target Date:** 2026-09-21  
**Organization:** Iksula Services Pvt Ltd  
**Version:** 1.0  
**Date:** 2026-04-21  

**Date Authority:** All dates in this document derive from `MILESTONE_REGISTRY.md`. Any drift between this doc and the registry is a bug — the registry wins.

**Status:** Draft (Ready for downstream planning)

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Context: What Was Delivered Before](#2-context-what-was-delivered-before)
3. [Definition of Ready (DoR)](#3-definition-of-ready-dor)
4. [M6 Scope & Mission](#4-m6-scope--mission)
5. [Tech Stack (M6-Specific)](#5-tech-stack-m6-specific)
6. [Database Changes (M6)](#6-database-changes-m6)
7. [API Contracts](#7-api-contracts)
8. [Feature Flags](#8-feature-flags)
9. [5-Week Plan](#9-5-week-plan)
10. [Tasks (MS6-T###)](#10-tasks-ms6-t)
11. [Acceptance Criteria (MS6-AC###)](#11-acceptance-criteria-ms6-ac)
12. [Risks & Mitigations (MS6-R###)](#12-risks--mitigations-ms6-r)
13. [Testing & QA](#13-testing--qa)
14. [GA Readiness Checklist](#14-ga-readiness-checklist)
15. [Rollback & Fallback Plans](#15-rollback--fallback-plans)
16. [Dependencies & Handoffs](#16-dependencies--handoffs)
17. [Success Metrics](#17-success-metrics)
18. [Glossary](#18-glossary)

---

## 1. EXECUTIVE SUMMARY

M6 is the final push to **General Availability (GA)** for QA Nexus. The MVP (M0–M5) shipped a core test management platform with basic reports and dashboards. M6 defers the full analytics warehouse, completes the reporting/export suite, and hardens the platform for external customers.

**Mission:** Deliver the analytics engine, finalize all report templates and export formats, build scheduled email distribution, pass security/accessibility/performance audits, and achieve GA launch readiness.

**Key Deliverables:**

- **Analytics Warehouse** (DuckDB): ETL from Postgres (hourly), columnar compression for fast aggregations
- **Custom Dashboard Builder** (drag-and-drop widgets: chart, KPI, table, heatmap)
- **Cohort Analysis** (tester × sprint × pass-rate)
- **Traceability Matrix Report** (Requirements → Test Cases → Runs → Defects) exportable to XLSX/PDF
- **Quality KPI Dashboard** (DPPM, DRE, test-case yield, MTBF between defects)
- **Customer-Saved Report Library** with sharing permissions
- **PDF Export** (via headless Chromium)
- **XLSX Export** (via exceljs)
- **Scheduled Email Reports** (weekly summary, per-project) via Resend + Hatchet cron
- **GA Hardening:** Performance tuning (query EXPLAIN ANALYZE pass), accessibility audit pass (WCAG 2.1 AA), security pen-test remediation, capacity plan sign-off

**Out of Scope (Deferred to v1.5+):** A3/A5/A6/A7/A8 agents, Cloud Device Grid, Visual Regression suite, Vibe Code Governor, Billing/metering system (if no paid customers at GA).

---

## 2. CONTEXT / PREDECESSORS: WHAT WAS DELIVERED BEFORE (M0–M5)

**This milestone is M6, the final MVP (PM1) sub-milestone (Weeks 19–23 of 21 total build weeks + 3 GA weeks). Canonical predecessor chain per MILESTONE_REGISTRY.md v3.2:**

### M0 (Weeks 1–2): Setup & Infrastructure
- BetterAuth authentication (email/password, session, password reset, MFA-ready)
- 4-role RBAC (Admin, Lead, QA, Stakeholder)
- PostgreSQL 15 + pgvector
- Ollama + Gemma 4 deployment
- Vercel + Oracle Always Free + Cloudflare R2 infrastructure
- CI/CD pipeline (GitHub Actions)
- Observability (SigNoz, GlitchTip, Langfuse)
- Audit log foundation

### M1 (Weeks 3–4): Users & Roles
- 4-role RBAC fully enforced (Admin/Lead/QA/Stakeholder)
- Project CRUD (create, list, update, delete)
- Row-Level Security (RLS) enforced on all tables
- User profile attributes (Jr/Sr/Automation)
- User invitations and org management

### M2 (Weeks 5–7): Test Documents & Knowledge Base — Core Doc Catalog (12 templates)
- KB CRUD + approval workflow
- RAG pipeline (BGE embeddings + pgvector)
- 12 document templates (Strategy, Plan, RTM, Daily/Weekly/Sprint/Release reports, Defect Report, RCA, Charter, Regression)
- Document Intelligence Layer (A1 context-gathering)
- PDF export via Puppeteer
- Versioning + comments + @-mentions

### M3 (Weeks 8–10): Test Cases & AI Generation — Test Case Management
- Test case CRUD (TipTap editor, BDD + traditional modes)
- A1 Test Case Generator (LangGraph, Clarification Questions gate, confidence badges)
- A2 Dedup (live chips, semantic similarity, bulk audit)
- RTM linking + tags + priority + stability sparklines
- Bulk import (CSV, TestRail, Zephyr, Xray, qTest)
- Test Case Management complete; 100+ cases seeded

### M4 (Weeks 11–13): Runs, Defects & Jira — Bug Management + Integrations
- Test Run CRUD + execution UI (step-by-step executor)
- Auto-evidence capture (screenshot + HAR + console + env snapshot)
- Defect CRUD + 4-category classification (App/Test/Flaky/Env)
- A4 Defect Intelligence (5-layer RCA: stack → env → config → code → data)
- Jira OAuth 2.0 (3-legged) + 2-way sync (status, assignee, comments, attachments)
- Webhook + 2-min poll fallback
- Run Dashboard (real-time metrics, pass/fail trend, defect severity pie)

### M5 (Weeks 14–18): Automation + Basic Reports + MVP Launch — Basic Reporting
- Templated report generation (Daily Status, Weekly Status, Sprint Sign-off, Release Readiness)
- Personal dashboard (my cases, my bugs, my approvals)
- Executive Dashboard lite (pass rate, defect trend, coverage %, release-readiness RAG)
- ROI calculator (cost_avoidance formula)
- Playwright E2E test runner + evidence
- WCAG 2.2 AA accessibility audit + critical fixes
- Command-K omnibox (global search + agent invocation)
- Global search indexing (cases, defects, docs, KB)
- Audit log completion
- E2E tests (Playwright, 3 critical journeys)
- Pilot onboarding docs + training
- Load testing (10 concurrent pilots, <2% error rate, p95 <500ms)

**Status at M5 Exit:** MVP stable in pilot ≥7 days. Zero P0 defects. Pilot feedback incorporated. All M0–M5 acceptance criteria closed. Ready for M6 GA hardening phase.

---

## 3. DEFINITION OF READY (DoR)

### M5 Completion Verified (Exit Criteria Met)

1. WCAG 2.2 AA compliance audit completed (all critical paths pass)
2. Command-K omnibox functional (⌘K / Ctrl+K working in all contexts)
3. Global search indexed (cases, defects, docs, KB entries)
4. Audit log complete + tested
5. Performance optimization validated (p95 <60s doc gen, <10s RCA, <500ms UI)
6. E2E test suite passing (3 critical journeys: Auth, Test Case, Defect)
7. Load testing completed (10 concurrent pilots)
8. Pilot onboarding docs + training materials ready
9. Incident response runbook drafted
10. Legal + compliance checklist started (privacy policy, ToS, GDPR assessment)

### External Readiness

1. Pilot deployments stable for ≥7 days with zero P0 defects
2. Pilot telemetry flowing and dashboards live
3. Documentation complete (user guide, admin guide, API docs)
4. On-call runbook covers P0–P2 scenarios
5. Jira API integration tested at scale (≥1K defect syncs)
6. Resend email service configured and validated

### Data Readiness

1. Pilot test case inventory: ≥100 cases per project
2. Pilot test run history: ≥50 runs with results + evidence
3. Pilot defect inventory: ≥30 defects with A4 RCA output
4. Pilot duration: ≥14 days for statistically meaningful data

---

## 4. M6 SCOPE & MISSION

### **Week 1: Analytics Warehouse Bootstrap + ETL Jobs + Baseline Queries**

**Goal:** DuckDB instance deployed; hourly ETL pipeline from Postgres live; baseline queries tested (p95 <2s).

**Key Work:**
- Set up DuckDB instance (on Oracle Always Free or Hetzner standby)
- Design warehouse schema (fact tables: test_runs, defects, evidence; dimensions: dates, projects, testers)
- Build Python ETL worker (Hatchet scheduled job, hourly)
- Implement incremental sync (since-last-run markers, conflict resolution)
- Create 10 baseline queries (pass-rate trend, defect-by-category, coverage %, test-case yield, MTBF)
- Validate query performance (EXPLAIN ANALYZE; target p95 <2s)
- Build warehouse health dashboard (row counts, last-sync timestamp, error tracking)

**Deliverables:** DuckDB live, ETL job running hourly, 10 baseline queries validated, health dashboard.

---

### **Week 2: Custom Dashboard Builder + Widget Library**

**Goal:** Drag-and-drop dashboard editor live; widget library (chart, KPI, table, heatmap) complete; p95 <2s for rendering large datasets.

**Key Work:**
- Design dashboard storage schema (dashboards, widgets, widget_instances tables)
- Build React dashboard editor (TanStack React Grid for drag-drop layout)
- Implement 4 widget types: Line Chart (recharts), KPI Card (single number + trend), Table (TanStack Table with sort/filter), Heatmap (d3-heatmap or visx)
- Wire widgets to warehouse queries (dropdown selector for predefined queries + custom SQL if role=Admin)
- Add dashboard sharing permissions (public, project, private)
- Build dashboard library / saved view list
- Performance-test with 50+ widgets on single dashboard; optimize query batching
- Implement caching (Redis, 5-min TTL)

**Deliverables:** Dashboard builder, widget library, sharing system, query optimizer.

---

### **Week 3: Cohort Analysis + Traceability Matrix + Quality KPI Dashboard**

**Goal:** Three specialized dashboard types live: Cohort (tester × sprint × pass-rate), Traceability Matrix (XLSX/PDF exportable), Quality KPI (DPPM, DRE, yield, MTBF).

**Key Work:**

**Cohort Analysis:**
- Design cohort dimension schema (tester, sprint, project, environment)
- Build query: `SELECT tester, sprint, COUNT(PASS), COUNT(FAIL), COUNT(SKIP), ROUND(COUNT(PASS)*100.0/(COUNT(PASS)+COUNT(FAIL))) as pass_rate FROM warehouse_test_results GROUP BY tester, sprint`
- Render as heatmap + table with drill-down (click cell → individual results)
- Export capability (XLSX + CSV)

**Traceability Matrix:**
- Design query joining: requirements → test_cases → test_results → defects
- Build XLSX exporter: one row per requirement, columns for [linked cases], [latest run status], [linked defects], [coverage %]
- Add PDF export (via headless Chromium)
- Filter by project + date range

**Quality KPI Dashboard:**
- DPPM (Defects Per Million test-case executions): `COUNT(defects) * 1e6 / COUNT(test_results)`
- DRE (Defect Removal Efficiency): `defects_closed_by_qa / (defects_closed_by_qa + defects_found_in_production)`
- Test-case yield: `COUNT(unique_case_ids) / COUNT(test_results)`
- MTBF (Mean Time Between Failures): `SUM(elapsed_seconds) / COUNT(defects)` per environment
- Render as card grid + time-series chart
- Add project/team/environment filters

**Deliverables:** Cohort editor, traceability matrix (XLSX+PDF), quality KPI dashboard, drill-down navigation.

---

### **Week 4: PDF/XLSX Export + Scheduled Email Reports + Report Library**

**Goal:** All report types exportable; scheduled email distribution live; customer-saved report library with sharing.

**Key Work:**

**PDF Export:**
- Integrate Playwright/headless Chromium (or PDF.co API fallback)
- Template each report type (Daily, Weekly, Sprint, Release, Custom Dashboard) as an HTML render
- Implement footer (org logo, date, confidentiality statement)
- Test rendering at scale (500+ page PDF from large dataset)
- Add watermark for beta-customer reports

**XLSX Export:**
- Use exceljs library
- Multi-sheet workbooks: Summary + Details + Charts (embedded images)
- Format cells: currency for ROI, percentage for pass rate, date for timestamps
- Add pivot tables where applicable (Defect by Category, Pass Rate by Tester)
- Implement file streaming for large exports (>50MB)

**Scheduled Email Reports:**
- Design report_schedules table (project, recipient, frequency: daily/weekly/custom-day, time, enabled)
- Build Hatchet scheduled job (runs at 08:00 org timezone per schedule)
- Render report → Export to PDF/XLSX → Attach to email → Send via Resend
- Add unsubscribe link (Resend suppression list)
- Track delivery (bounce, open, click events)
- Build schedule management UI (CRUD schedules, preview, test send)

**Report Library:**
- Design saved_reports table (name, owner, project, query, permissions: public/project/private, created_at)
- Build library browsing UI (filter by category, project, owner)
- Implement sharing (invite by email, permission tiers: viewer/editor)
- Add star/favorite functionality
- Build report versioning (snapshots on schedule run)

**Deliverables:** PDF/XLSX exporters, email distribution pipeline, report library UI, schedule manager.

---

### **Week 5: GA Hardening + Pen-Test Remediation + Accessibility Pass + Go/No-Go**

**Goal:** Platform hardened for external customers; all P0/P1 security/perf/accessibility issues resolved; GA launch readiness confirmed.

**Key Work:**

**Performance Tuning:**
- Run EXPLAIN ANALYZE on all warehouse queries; optimize slow ones (table scans → index scans, N+1 queries → batch)
- Profile API endpoints (identify bottlenecks; target p95 <300ms for authenticated endpoints)
- Optimize PDF/XLSX export (streaming, progress indicators, background job processing)
- Test dashboard rendering with 100K+ rows (ensure <2s load time with pagination/virtual scrolling)
- Load test: 20 concurrent users, 10 minute duration, monitor error rate + p95 latency

**Security Pen-Test Remediation:**
- External pen-test execution (or internal code review if budget-constrained)
- Common categories tested:
  - Authentication/authorization (session fixation, privilege escalation, missing role checks)
  - Input validation (SQL injection, XSS, XXE, CSRF)
  - Data exposure (sensitive data in logs, unencrypted transmission, PII leakage in exports)
  - API abuse (rate limiting, brute-force protection, file upload validation)
- Fix all P0 findings (blocking GA); P1 findings (critical path); defer P2 findings (document + commit to v1.5)
- Re-test all fixed issues

**Accessibility Audit (WCAG 2.1 AA):**
- Run automated tools (axe, Lighthouse, WAVE)
- Manual testing by QA + accessibility expert
- Test with screen reader (NVDA, JAWS)
- Test keyboard-only navigation (Tab, arrow keys, Enter, Escape)
- Fix all failures:
  - Contrast ratio <4.5:1 → adjust colours
  - Missing alt text → add descriptions
  - Missing form labels → associate labels to inputs
  - Keyboard traps → ensure Escape/Tab works
- Generate accessibility conformance report (AODA, EN 301 549 referencing)

**Capacity Plan Sign-Off:**
- Document Oracle Always Free resource ceiling (4 OCPU, 24GB RAM, 2 TPCH)
- Warm standby plan: Hetzner CX32 ($7.40/mo) auto-activated if Oracle VM down >30min
- DuckDB column store size projections: 14 days data = ~2GB; scale plan to Hetzner at >5GB
- Concurrent user capacity: 8 pilots baseline → 20 users with vertical scaling → 100+ users requires migration to Hetzner
- Network bandwidth: ~100MB/day test data + logs; R2 egress <1GB/month within Cloudflare free tier
- Sign-off: DevOps + PM + CTO approval documented

**GA Launch Readiness Review:**
- Go/No-Go meeting: all M0–M6 ACs closed?
- Zero P0 defects open for ≥7 days?
- Pen-test findings resolved or risk-accepted?
- WCAG 2.1 AA audit passed?
- p95 latency budgets met?
- Support tier definitions published?
- Incident response runbook reviewed + on-call trained?
- GA announcement blog + email drafted + approved?
- Decision: GO or HOLD?

**Deliverables:** Performance tuning report, security pen-test results (all findings resolved), accessibility audit report (AORA), capacity plan, GO/NO-GO sign-off.

---

## 5. TECH STACK (M6-SPECIFIC)

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Analytics Warehouse** | DuckDB (1.0+) on Oracle Always Free or Hetzner | OLAP engine for fast aggregations; hourly ETL target |
| **ETL Pipeline** | Python (Hatchet scheduled job) | Extract from Postgres → Transform + Enrich → Load to DuckDB (incremental) |
| **Batch Processing** | Hatchet Worker (async, 1h schedule) | Orchestrate hourly ETL; retry logic; error notifications |
| **Dashboard UI** | React 18 + TanStack React Grid | Drag-drop layout; responsive grid; save/restore state |
| **Chart Library** | recharts (maintained, React-native) | Line, bar, pie, heatmap; dark/light mode support |
| **Tables** | TanStack Table v8 (headless) | Sortable, filterable, paginated tables; virtual scrolling for 100K+ rows |
| **Heatmap Viz** | d3-heatmap or visx | Cohort analysis heatmap rendering |
| **PDF Export** | Playwright (headless Chromium) or PDF.co fallback | Server-side rendering of dashboard → PDF; watermarks + footer |
| **XLSX Export** | exceljs | Multi-sheet workbooks; cell formatting; embedded charts; streaming for large files |
| **Email Distribution** | Resend (email service) + Hatchet | Scheduled job builds PDF/XLSX → Resend API sends + tracks delivery |
| **Caching Layer** | Redis (Upstash free tier) | 5-min TTL for warehouse query results; session cache |
| **Database** | PostgreSQL 15 + pgvector + DuckDB | OLTP (Postgres) + OLAP (DuckDB) hybrid; PG for operational data, DuckDB for analytics |
| **Performance Tools** | EXPLAIN ANALYZE, SigNoz APM, Chrome DevTools | Query optimization; latency profiling; RUM monitoring |
| **Security Testing** | OWASP ZAP (free) or external pen-test | Automated + manual vulnerability scanning |
| **Accessibility Testing** | axe, Lighthouse, WAVE, NVDA | Automated compliance checks + manual testing |

---

## 6. DATABASE CHANGES (M6)

### New Tables

| TB-ID | Table Name | Columns | Rationale |
|-------|-----------|---------|-----------|
| **TB-019** | dashboards | id (uuid), project_id (fk), owner_id (fk), name (str), layout_json (jsonb), created_at, updated_at | Store custom dashboard definitions + layout state |
| **TB-020** | widgets | id (uuid), dashboard_id (fk), widget_type (enum: chart/kpi/table/heatmap), config_json (jsonb), query_id (fk, optional) | Store widget config (size, position, query binding) |
| **TB-021** | widget_instances | id (uuid), widget_id (fk), dashboard_id (fk), grid_x, grid_y, grid_w, grid_h, updated_at | Store widget placement on dashboard |
| **TB-022** | report_schedules | id (uuid), project_id (fk), recipient_email (str), frequency (enum: daily/weekly/custom), day_of_week (int, 0–6), time (time), report_type (enum: daily/weekly/sprint/release/custom), enabled (bool), last_run_at, next_run_at, created_at | Store scheduled report subscriptions |
| **TB-023** | saved_queries | id (uuid), project_id (fk), owner_id (fk), name (str), sql_text (text), category (str), created_at, updated_at | Store custom warehouse queries (reusable) |
| **TB-024** | saved_reports | id (uuid), project_id (fk), owner_id (fk), name (str), query_id (fk), export_format (enum: pdf/xlsx), permissions (enum: public/project/private), created_at, updated_at | Store saved report definitions + sharing rules |
| **TB-025** | report_versions | id (uuid), saved_report_id (fk), version_num (int), data_snapshot (jsonb), generated_at, created_by_id (fk) | Store report run snapshots (for audit + re-export) |
| **TB-026** | dashboard_permissions | id (uuid), dashboard_id (fk), user_id (fk), permission_level (enum: viewer/editor/owner), created_at | Store dashboard sharing (per-user) |
| **TB-027** | warehouse_syncs | id (uuid), sync_id (str), last_sync_at (timestamp), rows_extracted (int), rows_loaded (int), error_message (text, nullable), status (enum: pending/running/success/failed) | Track ETL health + performance |

### Modified Tables

| Table | Column Changes | Rationale |
|-------|---|---|
| **feature_flags** | Add `reports.warehouse_duckdb` (bool, default false), `reports.custom_dashboards` (bool), `reports.pdf_export` (bool), `reports.xlsx_export` (bool), `reports.scheduled_email` (bool), `ga.external_signup` (bool) | M6-specific feature flags for gradual rollout |
| **users** | Add `warehouse_access_role` (enum: none/viewer/analyst/admin, default viewer) | Control user access to custom SQL / saved queries |

### DuckDB Warehouse Schema (Separate Instance)

```sql
-- Fact Tables
CREATE TABLE warehouse_test_results (
    run_id UUID,
    case_id UUID,
    result_status VARCHAR, -- PASS, FAIL, SKIP
    tester_id UUID,
    environment VARCHAR,
    sprint VARCHAR,
    passed_at TIMESTAMP,
    duration_ms INT,
    project_id UUID
);

CREATE TABLE warehouse_defects (
    defect_id UUID,
    category VARCHAR, -- App, Test, Flaky, Env
    found_by_id UUID,
    assigned_to_id UUID,
    severity VARCHAR,
    status VARCHAR,
    created_date DATE,
    closed_date DATE,
    project_id UUID
);

-- Dimension Tables
CREATE TABLE warehouse_date_dim (
    date_id INT,
    date DATE,
    year INT,
    month INT,
    day INT,
    week INT,
    quarter INT,
    day_of_week VARCHAR
);

CREATE TABLE warehouse_project_dim (
    project_id UUID,
    project_name VARCHAR,
    jira_key VARCHAR,
    created_date DATE
);

-- Indexes for fast aggregation
CREATE INDEX idx_results_project_date ON warehouse_test_results(project_id, passed_at);
CREATE INDEX idx_results_tester_status ON warehouse_test_results(tester_id, result_status);
CREATE INDEX idx_defects_project_date ON warehouse_defects(project_id, created_date);
```

---

## 7. API CONTRACTS

### New Endpoints (M6)

| EP-ID | Path | Method | Purpose | Auth Required | Async |
|-------|------|--------|---------|---|---|
| **EP-061** | /api/dashboards | GET | List dashboards (project-scoped) | Yes (viewer+) | No |
| **EP-062** | /api/dashboards | POST | Create dashboard | Yes (lead+) | No |
| **EP-063** | /api/dashboards/:id | GET | Fetch dashboard + widgets | Yes (viewer+) | No |
| **EP-064** | /api/dashboards/:id | PATCH | Update dashboard layout/config | Yes (editor+) | No |
| **EP-065** | /api/dashboards/:id/permissions | GET | List share permissions | Yes (owner+) | No |
| **EP-066** | /api/dashboards/:id/permissions | POST | Add/update user permission | Yes (owner+) | No |
| **EP-067** | /api/widgets | POST | Add widget to dashboard | Yes (editor+) | No |
| **EP-068** | /api/widgets/:id | PATCH | Update widget config/query | Yes (editor+) | No |
| **EP-069** | /api/widgets/:id | DELETE | Remove widget from dashboard | Yes (editor+) | No |
| **EP-070** | /api/warehouse/query | POST | Execute custom warehouse query | Yes (analyst+) | No |
| **EP-071** | /api/warehouse/health | GET | Warehouse sync health + metrics | Yes (admin+) | No |
| **EP-072** | /api/cohort-analysis | POST | Generate cohort heatmap data | Yes (lead+) | No |
| **EP-073** | /api/traceability-matrix | POST | Generate RTM XLSX/PDF | Yes (lead+) | Yes (Hatchet job) |
| **EP-074** | /api/quality-kpi | GET | Fetch KPI metrics (DPPM, DRE, yield, MTBF) | Yes (lead+) | No |
| **EP-075** | /api/reports/export | POST | Export report to PDF/XLSX | Yes (viewer+) | Yes (Hatchet job) |
| **EP-076** | /api/reports/export/:job_id | GET | Poll export job status + download link | Yes (viewer+) | No |
| **EP-077** | /api/report-schedules | GET | List scheduled reports (project-scoped) | Yes (lead+) | No |
| **EP-078** | /api/report-schedules | POST | Create/update email report schedule | Yes (lead+) | No |
| **EP-079** | /api/report-schedules/:id | DELETE | Disable schedule | Yes (lead+) | No |
| **EP-080** | /api/report-schedules/:id/test-send | POST | Send test email preview | Yes (lead+) | No |
| **EP-081** | /api/saved-queries | GET | List custom warehouse queries | Yes (analyst+) | No |
| **EP-082** | /api/saved-queries | POST | Save custom warehouse query | Yes (analyst+) | No |
| **EP-083** | /api/saved-reports | GET | List saved report definitions | Yes (viewer+) | No |
| **EP-084** | /api/saved-reports | POST | Save report + sharing rules | Yes (lead+) | No |
| **EP-085** | /api/saved-reports/:id | PATCH | Update saved report | Yes (editor+) | No |
| **EP-086** | /api/saved-reports/:id/permissions | GET/POST | Share saved report | Yes (owner+) | No |

### Modified Endpoints (M6)

| EP-ID | Path | Changes |
|-------|------|---------|
| **EP-053** | /api/dashboards/exec | Now backed by warehouse queries (cached); add warehouse_refresh_at timestamp to response |
| **EP-076** | /api/reports/\* | Extend to support PDF/XLSX format parameter + streaming download |

---

## 8. FEATURE FLAGS

| Flag Name | Default | Purpose | Rollout Strategy |
|-----------|---------|---------|---|
| `reports.warehouse_duckdb` | false | Enable DuckDB warehouse instance | Enabled for internal pilots week 1; external customers week 3 (after validation) |
| `reports.custom_dashboards` | false | Enable dashboard builder UI | Enabled week 2; internal pilots first |
| `reports.cohort_analysis` | false | Enable cohort heatmap analysis | Enabled week 3; measure adoption |
| `reports.traceability_matrix` | false | Enable RTM export (XLSX/PDF) | Enabled week 3; test with 50K+ cases first |
| `reports.quality_kpi` | false | Enable DPPM/DRE/yield/MTBF dashboard | Enabled week 3 |
| `reports.pdf_export` | false | Enable PDF export for dashboards + reports | Enabled week 4 after Playwright validation |
| `reports.xlsx_export` | false | Enable XLSX export | Enabled week 4 |
| `reports.scheduled_email` | false | Enable email report scheduling | Enabled week 4; test with 10 schedules |
| `reports.saved_report_library` | false | Enable saved reports + sharing | Enabled week 4 |
| `ga.external_signup` | false | **FINAL GA SWITCH** — allow external customers to sign up | Enabled 2026-09-21 EOD after sign-off |

---

## 9. 5-WEEK PLAN

### Week 1 (Aug 17–23): Warehouse Bootstrap + ETL

| Day | Task | Owner | Outcome |
|-----|------|-------|---------|
| Mon–Tue | Provision DuckDB + design schema | Backend Eng | Schema approved; instance deployed; test data loaded |
| Tue–Wed | Build Python ETL worker (incremental sync) | Backend Eng | Hourly job running; incremental sync validated |
| Wed–Thu | Implement 10 baseline queries | Data Eng | Queries optimized; EXPLAIN ANALYZE passed; <2s p95 |
| Thu–Fri | Build warehouse health dashboard | Backend Eng | Health dashboard live; monitoring alerts configured |
| Fri | E2E test ETL pipeline (100 test runs, 50 defects) | QA | Zero data loss; 100% sync success; idempotency validated |

**Exit Gate:** Warehouse queries returning correct data in <2s; no ETL failures in 24h run.

---

### Week 2 (Aug 24–30): Dashboard Builder + Widget Library

| Day | Task | Owner | Outcome |
|-----|------|-------|---------|
| Mon–Tue | Design + implement dashboard storage schema | Backend Eng | TB-019, TB-020, TB-021 migrated; CRUD endpoints live |
| Tue–Wed | Build React dashboard editor (TanStack React Grid) | Frontend Eng | Drag-drop working; grid layout persists; add/remove widgets |
| Wed–Thu | Implement 4 widget types (chart, KPI, table, heatmap) | Frontend Eng | All widgets render; wire to warehouse queries; performance test (50 widgets) |
| Thu | Dashboard sharing (permissions, public/project/private) | Backend Eng | Dashboard permission checks enforced; sharing UI works |
| Fri | Performance validation (p95 <2s for 50+ widgets) | QA | Caching strategy validated; latency budget met |

**Exit Gate:** Custom dashboard live; all 4 widget types working; p95 <2s with 100K rows.

---

### Week 3 (Aug 31–Sep 6): Cohort + Traceability + Quality KPI

| Day | Task | Owner | Outcome |
|-----|------|-------|---------|
| Mon–Tue | Cohort analysis query + heatmap rendering | Data Eng + Frontend | Heatmap interactive; drill-down to individual results |
| Tue–Wed | Traceability Matrix query (Req → Case → Run → Defect) | Data Eng | Query joins all tables; returns complete coverage matrix |
| Wed–Thu | RTM XLSX exporter + PDF renderer | Backend Eng | XLSX + PDF exports tested; 5K-row matrix completes in <30s |
| Thu–Fri | Quality KPI dashboard (DPPM, DRE, yield, MTBF) | Frontend + Data Eng | All 4 KPIs calculated; card grid + time-series chart renders |
| Fri | Validation: Cohort + RTM + QKI with pilot data | QA | Data accuracy verified; drill-down tested; exports validated |

**Exit Gate:** Cohort, RTM, Quality KPI dashboards live; all exports functional.

---

### Week 4 (Sep 7–13): PDF/XLSX Export + Scheduled Email + Report Library

| Day | Task | Owner | Outcome |
|-----|------|-------|---------|
| Mon–Tue | PDF export (Playwright integration + templates) | Backend Eng | Dashboard → PDF rendering working; watermark + footer applied |
| Tue–Wed | XLSX export (exceljs, multi-sheet, formatting) | Backend Eng | Dashboard/Report → XLSX; pivot tables; cell formatting working |
| Wed | Scheduled email job (Hatchet + Resend) | Backend Eng | Email schedules CRUD; cron job triggers; delivery tracked |
| Thu | Report library + sharing (TB-024, TB-026) | Frontend + Backend | Saved reports browsable; permissions enforced; star/favorite |
| Fri | E2E test: Export (PDF/XLSX) + Email delivery (10 schedules) | QA | All exports complete; emails delivered; unsubscribe tested |

**Exit Gate:** PDF/XLSX exporters live; 10 email schedules running successfully; report library operational.

---

### Week 5 (Sep 14–20): GA Hardening + Pen-Test Remediation + Accessibility + Go/No-Go

| Day | Task | Owner | Outcome |
|-----|------|-------|---------|
| Mon | Query optimization (EXPLAIN ANALYZE all M6 queries) | Data Eng | Slow queries optimized; index tuning complete |
| Mon–Tue | Performance profiling (API endpoints, dashboard rendering) | Backend + Frontend | p95 latency budgets validated; bottlenecks resolved |
| Tue–Wed | Security pen-test (external or internal review) | Security / QA | All P0 findings remediated; P1 findings triaged |
| Wed–Thu | Accessibility audit (WCAG 2.1 AA, manual + automated) | Design + QA | All critical failures fixed; conformance report generated |
| Thu | Capacity plan sign-off + incident response runbook review | DevOps + PM + CTO | Document approved; on-call trained |
| Fri | GA Go/No-Go meeting + final sign-off | PM + CTO + Business | Decision: GO or HOLD; GA announcement approved |

**Exit Gate:** All M0–M6 ACs closed; zero P0 defects; pen-test/accessibility/perf budgets met; GO decision documented.

---

## 10. TASKS (MS6-T###)

### M6 Task List (55–75 tasks, 20% buffer included)

| Task ID | Title | Owner | Effort (story points) | Week | Dependency |
|---------|-------|-------|---|---|---|
| **MS6-T001** | DuckDB instance provisioning + schema design | Backend Eng | 8 | W1 | M5 complete |
| **MS6-T002** | ETL worker scaffolding (Python + Hatchet) | Backend Eng | 5 | W1 | MS6-T001 |
| **MS6-T003** | Incremental sync logic (since-last-run markers) | Backend Eng | 8 | W1 | MS6-T002 |
| **MS6-T004** | Fact table ETL (test_results, defects, evidence) | Backend Eng | 5 | W1 | MS6-T003 |
| **MS6-T005** | Dimension table ETL (dates, projects, users) | Backend Eng | 3 | W1 | MS6-T003 |
| **MS6-T006** | Baseline query suite (10 queries, optimized) | Data Eng | 8 | W1 | MS6-T001 |
| **MS6-T007** | Warehouse health dashboard + monitoring | Backend Eng | 5 | W1 | MS6-T006 |
| **MS6-T008** | ETL integration test (100% sync success, idempotency) | QA | 5 | W1 | MS6-T004, T005 |
| **MS6-T009** | Dashboard CRUD schema + migrations (TB-019–021) | Backend Eng | 5 | W2 | M5 complete |
| **MS6-T010** | Dashboard API endpoints (EP-061–069) | Backend Eng | 8 | W2 | MS6-T009 |
| **MS6-T011** | React dashboard editor (TanStack React Grid) | Frontend Eng | 13 | W2 | M5 UI complete |
| **MS6-T012** | Widget library scaffolding + config schema | Frontend Eng | 5 | W2 | MS6-T011 |
| **MS6-T013** | Line chart widget (recharts) | Frontend Eng | 5 | W2 | MS6-T012 |
| **MS6-T014** | KPI card widget (single number + trend) | Frontend Eng | 3 | W2 | MS6-T012 |
| **MS6-T015** | Table widget (TanStack Table, sort/filter) | Frontend Eng | 8 | W2 | MS6-T012 |
| **MS6-T016** | Heatmap widget (d3/visx) | Frontend Eng | 8 | W2 | MS6-T012 |
| **MS6-T017** | Widget query binding + warehouse integration | Backend Eng | 8 | W2 | MS6-T010, T013–016 |
| **MS6-T018** | Dashboard sharing permissions (TB-026) | Backend Eng | 5 | W2 | MS6-T010 |
| **MS6-T019** | Query caching (Redis, 5-min TTL) | Backend Eng | 5 | W2 | MS6-T017 |
| **MS6-T020** | Dashboard performance testing (50+ widgets) | QA | 5 | W2 | MS6-T013–016, T019 |
| **MS6-T021** | Cohort analysis query (tester × sprint × pass-rate) | Data Eng | 8 | W3 | MS6-T006 |
| **MS6-T022** | Cohort heatmap rendering + drill-down | Frontend Eng | 8 | W3 | MS6-T021 |
| **MS6-T023** | Traceability matrix query (Req → Case → Run → Defect) | Data Eng | 8 | W3 | MS6-T006 |
| **MS6-T024** | RTM XLSX exporter | Backend Eng | 5 | W3 | MS6-T023 |
| **MS6-T025** | RTM PDF exporter (Playwright) | Backend Eng | 5 | W3 | MS6-T023 |
| **MS6-T026** | Quality KPI queries (DPPM, DRE, yield, MTBF) | Data Eng | 8 | W3 | MS6-T006 |
| **MS6-T027** | Quality KPI dashboard UI (card grid + chart) | Frontend Eng | 5 | W3 | MS6-T026 |
| **MS6-T028** | Cohort + RTM + QKI validation (pilot data) | QA | 8 | W3 | MS6-T022, T024–025, T027 |
| **MS6-T029** | PDF export integration (Playwright + templates) | Backend Eng | 8 | W4 | M4 report templates |
| **MS6-T030** | XLSX export integration (exceljs, streaming) | Backend Eng | 8 | W4 | M4 report templates |
| **MS6-T031** | Report scheduling schema + API (TB-022, EP-077–080) | Backend Eng | 8 | W4 | M4 complete |
| **MS6-T032** | Email template design (weekly summary, per-project) | Design | 3 | W4 | MS6-T031 |
| **MS6-T033** | Resend integration + email job (Hatchet) | Backend Eng | 8 | W4 | MS6-T032 |
| **MS6-T034** | Unsubscribe + delivery tracking | Backend Eng | 5 | W4 | MS6-T033 |
| **MS6-T035** | Saved report library schema + API (TB-024–025, EP-083–086) | Backend Eng | 8 | W4 | M4 complete |
| **MS6-T036** | Report library UI (browsing, filtering, sharing) | Frontend Eng | 8 | W4 | MS6-T035 |
| **MS6-T037** | Export job queue + progress tracking | Backend Eng | 5 | W4 | MS6-T029–030 |
| **MS6-T038** | E2E test: PDF/XLSX exports + email delivery | QA | 8 | W4 | MS6-T029–030, T033 |
| **MS6-T039** | Query performance optimization (EXPLAIN ANALYZE all M6 queries) | Data Eng | 8 | W5 | MS6-T006, T021, T023, T026 |
| **MS6-T040** | API latency profiling + optimization | Backend Eng | 8 | W5 | M0–M5 endpoints |
| **MS6-T041** | Dashboard rendering performance tuning (virtual scrolling, pagination) | Frontend Eng | 5 | W5 | MS6-T011–016 |
| **MS6-T042** | Load test: 20 concurrent users, 10 minute duration | QA | 5 | W5 | MS6-T040–041 |
| **MS6-T043** | Security pen-test execution (OWASP top 10) | Security / QA | 13 | W5 | All M6 features |
| **MS6-T044** | Pen-test finding remediation (P0 + P1) | Backend Eng + Frontend Eng | 13 | W5 | MS6-T043 |
| **MS6-T045** | Pen-test re-test (all fixes verified) | QA | 5 | W5 | MS6-T044 |
| **MS6-T046** | WCAG 2.1 AA accessibility audit (automated + manual) | QA + Design | 8 | W5 | M0–M6 UI |
| **MS6-T047** | Accessibility failure remediation | Frontend Eng + Design | 8 | W5 | MS6-T046 |
| **MS6-T048** | Accessibility conformance report generation | Design | 3 | W5 | MS6-T047 |
| **MS6-T049** | Feature flags implementation (reports.*, ga.external_signup) | Backend Eng | 5 | W5 | All M6 features |
| **MS6-T050** | Capacity plan documentation (Oracle → Hetzner migration) | DevOps + PM | 5 | W5 | M0–M6 infra |
| **MS6-T051** | On-call runbook review + training | DevOps + PM | 3 | W5 | M5 runbook |
| **MS6-T052** | GA Go/No-Go decision meeting | PM + CTO + Business | 2 | W5 | MS6-T044, T047, T051 |
| **MS6-T053** | GA announcement blog + email approval | Marketing + PM | 5 | W5 | MS6-T052 |
| **MS6-T054** | External customer onboarding flow (sign-up, billing onboarding, training) | Product + Support | 8 | W5 | M5 complete + legal |
| **MS6-T055** | Support tier definition + SLA documentation | Support + PM | 3 | W5 | MS6-T054 |
| **MS6-T056** | Status page setup (Statuspage.io or Upstash) | DevOps | 3 | W5 | M0 infra |
| **MS6-T057** | Legal + compliance sign-off (privacy policy, ToS, GDPR, SOC2 readiness) | Legal + PM | 5 | W5 | M5 complete |
| **MS6-T058** | Marketing site update (pricing, GA features, case studies) | Marketing + PM | 8 | W5 | MS6-T053 |
| **MS6-T059** | Pilot feedback synthesis + documentation | Product | 3 | W5 | M5 pilot data |
| **MS6-T060** | Release notes draft (M0–M6 feature summary) | PM + Eng | 3 | W5 | All milestones |

**Total Effort:** 60–70 story points equivalent; ~20 FTE across 5 weeks with parallelization.

---

## 11. ACCEPTANCE CRITERIA (MS6-AC###)

### M6 Acceptance Criteria (50–65 criteria)

| AC-ID | Title | Definition of Done | Owner | Week |
|-------|-------|---|---|---|
| **MS6-AC001** | DuckDB warehouse deployed | Instance running on Oracle Always Free; schema migrated; test data loaded; <500ms query latency achieved | Backend | W1 |
| **MS6-AC002** | Hourly ETL running successfully | Hatchet job triggers every hour; 100% sync success rate measured over 24h; idempotency validated (re-run same hour = no duplicates) | Backend + QA | W1 |
| **MS6-AC003** | Baseline queries optimized | All 10 queries use indexed scans; EXPLAIN ANALYZE shows <100ms execution time; p95 <2s with 1M rows | Data Eng + QA | W1 |
| **MS6-AC004** | Warehouse health dashboard live | Displays row count, last sync time, error count, sync duration; alerts configured for >5min delay or sync failure | Backend | W1 |
| **MS6-AC005** | Dashboard creation working | User can create new dashboard; drag-drop layout persists; add/remove widgets without errors | Frontend | W2 |
| **MS6-AC006** | All 4 widget types render | Line chart, KPI card, table, heatmap all render correctly with sample data; dark/light mode parity | Frontend | W2 |
| **MS6-AC007** | Widget-query binding functional | Widget config selects predefined warehouse query; query executes on widget load; data renders in <2s | Backend + Frontend | W2 |
| **MS6-AC008** | Dashboard sharing enforced | Viewer cannot edit; editor cannot change permissions; permission checks tested for all roles | Backend | W2 |
| **MS6-AC009** | Dashboard p95 latency <2s | 50 widgets on one dashboard loads in <2s; caching strategy validated; no N+1 queries | Frontend + Data Eng + QA | W2 |
| **MS6-AC010** | Cohort analysis query returns correct data | Cohort query groups by tester/sprint; pass_rate calculation verified; total rows match warehouse_test_results | Data Eng + QA | W3 |
| **MS6-AC011** | Cohort heatmap interactive | Click cell → drill-down to individual results; cell colour represents pass rate; WCAG contrast ≥4.5:1 | Frontend + QA | W3 |
| **MS6-AC012** | Traceability matrix query complete | Query joins requirements → test_cases → test_results → defects; coverage % calculated correctly | Data Eng + QA | W3 |
| **MS6-AC013** | RTM XLSX export functional | Export completes in <30s for 5K rows; multi-sheet format correct; cell formatting (headers bold, currency, %) applied | Backend + QA | W3 |
| **MS6-AC014** | RTM PDF export functional | PDF renders in <5s; watermark + footer applied; file size <10MB for 5K rows | Backend + QA | W3 |
| **MS6-AC015** | Quality KPI calculations correct | DPPM = (defects × 1e6) / test_results; DRE = closed_by_qa / (closed_by_qa + found_in_prod); yield = unique_cases / runs; MTBF = uptime / defects | Data Eng + QA | W3 |
| **MS6-AC016** | Quality KPI dashboard renders | Card grid (4 KPIs) + time-series chart (30-day trend); all KPIs visible without scrolling on 1920×1080 | Frontend + QA | W3 |
| **MS6-AC017** | PDF export templates render | Dashboard/Report → PDF includes page break, header/footer, watermark, date; file downloads to user browser | Backend | W4 |
| **MS6-AC018** | XLSX export multi-sheet working | Dashboard/Report → XLSX includes Summary sheet + Details sheet + Charts sheet (embedded images); file size <50MB | Backend | W4 |
| **MS6-AC019** | Email schedule CRUD working | Create/update/delete schedules via UI; schedule persists in DB; test-send button sends preview email | Backend + Frontend | W4 |
| **MS6-AC020** | Hatchet cron job triggers correctly | 10 schedules created; cron fires at expected times; email sent within 5min of trigger time | Backend + QA | W4 |
| **MS6-AC021** | Email delivery tracked | Resend webhook updates sent/bounced/opened events; unsubscribe link included; tracking dashboard shows delivery rate | Backend | W4 |
| **MS6-AC022** | Saved report library operational | User can save report definition; browse library; filter by project/owner; pagination works for 100+ reports | Frontend + Backend | W4 |
| **MS6-AC023** | Report sharing permissions enforced | Owner can share; viewer cannot edit; editor cannot share; permission revocation immediate | Backend | W4 |
| **MS6-AC024** | Export job queue scalable | Export 10 PDFs concurrently; all complete without timeout; progress bar updates in real-time | Backend + QA | W4 |
| **MS6-AC025** | All query optimizations applied | EXPLAIN ANALYZE shows index scans (no table scans); slow query log empty for M6 queries; database stats up-to-date | Data Eng + QA | W5 |
| **MS6-AC026** | API p95 latency <300ms | All authenticated endpoints (EP-061–086) measured over 28 days; p95 <300ms; p99 <1000ms | Backend + QA | W5 |
| **MS6-AC027** | Dashboard rendering p95 <2s | 100K rows in table; heatmap with 1000+ cells; all render in <2s with pagination/virtual scrolling | Frontend + QA | W5 |
| **MS6-AC028** | Load test passed | 20 concurrent users for 10 minutes; error rate <2%; p95 latency <2s for dashboard queries | QA | W5 |
| **MS6-AC029** | All P0 pen-test findings remediated | Pen-test identified 0 critical vulnerabilities remaining; all P0 findings fixed and re-tested | Security + Backend | W5 |
| **MS6-AC030** | All P1 pen-test findings triaged | P1 findings risk-accepted or scheduled for v1.5; documented in risk register | Security + PM | W5 |
| **MS6-AC031** | WCAG 2.1 AA audit passed | Automated audit (axe, Lighthouse) passes 100%; manual testing with NVDA/JAWS passes; conformance report generated | QA + Design | W5 |
| **MS6-AC032** | All critical accessibility failures resolved | Colour contrast ≥4.5:1 for all text; alt text present for all images; form labels associated; keyboard navigation works | Frontend + Design | W5 |
| **MS6-AC033** | Feature flags operational | All 9 flags (reports.*, ga.external_signup) toggle without redeployment; feature states logged; rollout tested | Backend | W5 |
| **MS6-AC034** | Capacity plan documented | Oracle Always Free limits documented; Hetzner CX32 warm standby plan written; scale trigger thresholds defined | DevOps + PM | W5 |
| **MS6-AC035** | On-call runbook reviewed | 5+ runbooks for P0–P2 scenarios (Gemma offline, pgvector full, Oracle failure, etc.); on-call trained and signed-off | DevOps | W5 |
| **MS6-AC036** | Incident response runbook executed | Dry-run incident (e.g., simulate warehouse query failure); team responds <30min; post-mortem documented | DevOps + Eng | W5 |
| **MS6-AC037** | Privacy policy + ToS reviewed | Legal review complete; GDPR assessment done; data retention policy defined (1y logs, 90d audit, 7y PII-stripped) | Legal | W5 |
| **MS6-AC038** | SOC2 readiness checkpoint | Audit log immutability confirmed; change control process documented; monitoring dashboards live | DevOps | W5 |
| **MS6-AC039** | GA go/no-go decision documented | Meeting held 2026-09-20; decision (GO or HOLD) signed off by PM + CTO + Business; blockers documented if HOLD | PM | W5 |
| **MS6-AC040** | GA announcement approved | Blog post + email draft approved by marketing + PM; social media calendar prepared; launch timeline confirmed | Marketing | W5 |
| **MS6-AC041** | External onboarding flow ready | Sign-up form live; email verification working; default project created; training materials accessible | Product + Support | W5 |
| **MS6-AC042** | Support tier SLAs defined | Bronze/Silver/Gold defined (response time, availability, features); pricing (if applicable) aligned with billing | Support + PM | W5 |
| **MS6-AC043** | Status page live | Statuspage.io or Upstash configured; component statuses update automatically; public access enabled | DevOps | W5 |
| **MS6-AC044** | M0–M5 ACs closure verified | Spot-check: ≥10 random M0–M5 ACs re-verified for continued compliance; any regressions documented | QA | W5 |
| **MS6-AC045** | Zero P0 defects for ≥7 days | No critical/blocker defects open from 2026-08-17–2026-09-20 | QA | W5 |
| **MS6-AC046** | Pilot feedback incorporated | ≥5 pilot feature requests reviewed; ≥80% resolved or documented in v1.5 roadmap | Product | W5 |
| **MS6-AC047** | Documentation complete | API docs (OpenAPI), user guide (5+ pages), admin guide (3+ pages), troubleshooting (FAQ 10+ items) | PM + Eng | W5 |
| **MS6-AC048** | Release notes approved | M0–M6 feature summary, migration guide (if needed), known issues, deprecations documented | PM + Eng | W5 |
| **MS6-AC049** | Marketing site updated | Homepage mentions M6 features (warehouse, exports, email); pricing page live (if applicable); blog post scheduled | Marketing | W5 |
| **MS6-AC050** | Pilot metrics dashboard live | Tracks adoption (login %), defect flow (%), time-to-log-defect, A1 auto-approval rate, ROI value | Product | W5 |

**Total ACs:** 50 (buffer for ad-hoc discovery ACs = target 50–65).

---

## 12. RISKS & MITIGATIONS (MS6-R###)

| Risk ID | Title | Probability | Impact | Mitigation | Owner |
|---------|-------|-----------|--------|-----------|-------|
| **MS6-R001** | Warehouse ETL data skew (e.g., duplicate rows from failed sync retries) | Medium | High | Implement idempotency tokens (sync_id + timestamp); test re-run same hour multiple times; audit logs compare row counts pre/post-sync | Backend Eng |
| **MS6-R002** | Dashboard builder perf degrades with large data (100K+ rows) | Medium | High | Implement virtual scrolling (TanStack Table); pagination (limit 1000 rows/page); query-level aggregation (GROUP BY before rendering); load-test with 100K rows in W2 | Frontend Eng + Data Eng |
| **MS6-R003** | PDF rendering timeouts (Playwright > 30s for large PDF) | Medium | Medium | Use streaming PDF generation (paginate by 50 rows); set 60s timeout; queue exports to async job; implement progress bar | Backend Eng |
| **MS6-R004** | Pen-test finds critical auth/data-exposure vulnerability late (W5) | Low | Critical | Conduct internal security review in W4 (before external pen-test); fix low-hanging fruit early; allocate 2x buffer in W5 for fixes | Security + Backend |
| **MS6-R005** | WCAG audit fails critical paths (e.g., dashboard keyboard nav broken) | Medium | High | Run automated checks in W2 (flag CONTRAST issues early); manual testing with NVDA in W3; accessibility champion reviews M6 UI | QA + Design |
| **MS6-R006** | Resend email delivery rate <90% (bounces, spam folder) | Low | Medium | Validate DKIM/SPF/DMARC before W4; test email templates with multiple clients (Gmail, Outlook); implement bounce handling + retry | Backend Eng |
| **MS6-R007** | External pen-test unavailable on schedule (budget/resource constraint) | Low | High | Plan internal code review as fallback (W4 budget); prioritise OWASP top 10 manually; defer P2 findings to v1.5 if pen-test delayed | Security |
| **MS6-R008** | Capacity plan miscalculation (Oracle Always Free hits ceiling before W5) | Low | High | Monitor DuckDB size + pgvector row count daily; trigger Hetzner warm-standby activation at 70% capacity; document migration runbook in W1 | DevOps |
| **MS6-R009** | GA launch delayed by pending legal review (ToS/privacy/GDPR) | Medium | High | Start legal review in W1 (parallel to dev); use template language (SOC2 ready, GDPR compliance by design); brief legal weekly | PM + Legal |
| **MS6-R010** | Pilot customers demand v1.5 features (A3/A5) before GA launch | Low | Medium | Document deferred features in roadmap; set expectations in GA announcement; commit to v1.5 timeline (Q4 2026) | PM |

---

## 13. TESTING & QA

### Test Strategy (M6)

| Test Level | Scope | Responsible | Approach |
|-----------|-------|---|---|
| **Unit Tests** | ETL jobs, query functions, widget configs | Backend/Data Eng | pytest (Python), Jest (JavaScript); ≥80% coverage for M6-specific code |
| **Integration Tests** | Warehouse ↔ API ↔ Frontend; email delivery | Backend + QA | Hatchet job test harness; in-memory DuckDB; Resend mock; multi-service orchestration |
| **E2E Tests** | Dashboard CRUD, export (PDF/XLSX), email send | QA + Frontend | Playwright; 3 critical journeys (create dashboard → add widget → export PDF; save report → schedule email; view cohort → drill-down) |
| **Performance Tests** | Dashboard rendering (50+ widgets), query latency, PDF generation | QA + Data Eng | Artillery.io (load test), Chrome DevTools (RUM), EXPLAIN ANALYZE; SLO validation |
| **Security Tests** | Pen-test, SAST, SCA, API abuse | Security + QA | OWASP ZAP (automated), manual pen-test (external), GitHub Dependabot (SCA), rate-limit fuzzing |
| **Accessibility Tests** | WCAG 2.1 AA (automated + manual) | QA + Design | axe DevTools, Lighthouse, manual testing with NVDA/JAWS, keyboard navigation audit |
| **Data Validation** | ETL correctness, query accuracy, export fidelity | QA + Data Eng | Row count audit (pre/post-sync), sample data spot-checks, export file format validation |

### Defect Targets

- **P0 (Blocker):** Zero defects 7 days before GA launch
- **P1 (Critical):** ≤2 open (risk-accepted or scheduled for v1.5)
- **P2 (Major):** ≤5 open (documented in known issues)
- **P3 (Minor):** No limit (defer to v1.5)

---

## 14. GA READINESS CHECKLIST

**Final Gate (2026-09-20, EOD):**

- [ ] All M0–M6 ACs closed (verified via checklist in AC section)
- [ ] Zero P0/P1 defects open for ≥7 days
- [ ] Pen-test findings (all P0) remediated + re-tested
- [ ] Accessibility audit WCAG 2.1 AA passes (100% critical paths)
- [ ] p95 latency budgets met (API <300ms, dashboard <2s, doc gen <60s)
- [ ] Load test passed (20 users, 10 min, <2% error rate)
- [ ] Capacity plan signed off (DevOps + PM + CTO)
- [ ] External customer contract templates ready (legal review complete)
- [ ] Billing/metering system decision (shipped or deferred to v1.5 if no paid customers)
- [ ] Support tier definitions published (SLA, features, pricing if applicable)
- [ ] Status page live + monitored
- [ ] Incident response runbook reviewed + on-call trained
- [ ] GA announcement blog + email draft approved
- [ ] Release notes approved
- [ ] Documentation complete + published
- [ ] Pilot metrics dashboard live
- [ ] Go/No-Go meeting held + decision documented
- [ ] **GA LAUNCH APPROVAL SIGNED** (PM + CTO + Business)

**If GO:** Enable `ga.external_signup` flag EOD 2026-09-21; announce GA.

**If HOLD:** Document blockers; commit to re-evaluation date; communicate delay to stakeholders.

---

## 15. ROLLBACK & FALLBACK PLANS

### Fallback for Warehouse ETL Failure

**Scenario:** DuckDB becomes unavailable or ETL fails for >1 hour.

**Fallback Strategy:**
1. Disable `reports.warehouse_duckdb` flag
2. All report/dashboard queries fall back to **live Postgres aggregates** (slower but functional)
3. Dashboards show stale data (last-sync timestamp visible) but don't error
4. Notify users in banner: "Warehouse under maintenance; refresh every 5 minutes"
5. SRE initiates DuckDB recovery (check disk space, query log for hanging queries, restart Ollama if dependent)
6. Re-enable flag once health check passes

**RTO:** <30 minutes  
**Data Loss:** None (incremental ETL resumes from last sync marker)

### Fallback for Pen-Test Findings (P0)

**Scenario:** External pen-test discovers critical vulnerability 48h before GA launch.

**Fallback Strategy:**
1. Halt GA launch (HOLD decision in Go/No-Go)
2. Assemble incident response team (Backend + Security + PM)
3. Remediate within 24h; full re-test within 48h
4. Re-evaluate GA launch decision
5. If fix not possible: disable affected feature flag; document workaround; defer to v1.5

**Acceptance:** P0 findings must be remediated; cannot ship GA with P0 open.

### Fallback for Accessibility Audit Failure

**Scenario:** WCAG 2.1 AA audit reveals critical path inaccessible (e.g., dashboard editor keyboard nav broken).

**Fallback Strategy:**
1. Mark feature as **Beta** (feature flag `reports.custom_dashboards` → false by default)
2. Only enable for internal pilots; external customers see warning
3. Schedule fix for v1.5; commit to timeline in GA announcement
4. Ship GA with templated dashboards only (no custom builder)

**Acceptance:** If dashboard builder not fixed, ship without it; all other M6 features ship.

### Fallback for Capacity Constraint

**Scenario:** Oracle Always Free VM hits resource ceiling (4 OCPU, 24GB) in W4.

**Fallback Strategy:**
1. Migrate DuckDB to warm-standby Hetzner CX32 ($7.40/mo)
2. PostgreSQL remains on Oracle; DuckDB syncs via secure tunnel
3. No code changes; containerised deployment seamlessly switches infrastructure
4. Update capacity plan + incident runbook
5. Monitor Hetzner metrics; plan scale to CX52 if >80% utilisation

**RTO:** <2 hours  
**GA Impact:** None (migration transparent to users)

---

## 16. DEPENDENCIES & HANDOFFS

### External Dependencies

| Dependency | Owner | Status | Mitigation |
|-----------|-------|--------|-----------|
| Pen-test vendor availability (W5) | External security firm | Assumed available | Book slot in advance; fallback to internal review |
| Resend email service (W4) | Resend | Stable (production) | Rate-limit awareness; fallback to SendGrid if needed |
| Playwright/Chromium reliability (W4) | Microsoft/community | Stable (open-source) | Fallback to PDF.co API for rendering |
| Hetzner infrastructure (warm standby) | Hetzner | Assumed available | Account pre-provisioned; terraform code ready |
| Legal review of ToS/privacy (W5) | Internal/external legal | TBD | Start in W1 to avoid W5 bottleneck |

### Internal Handoffs

| Handoff | From | To | Artifact | Timing |
|---------|------|---|----------|--------|
| DuckDB schema + ETL design review | Backend Eng | Data Eng | Detailed schema doc + query patterns | EOD W1 |
| Dashboard builder mockups | Design | Frontend Eng | Figma file + interaction spec | EOD W2 |
| Performance tuning results | Frontend + Data Eng | QA | Optimisation report + benchmark data | EOD W4 |
| Pen-test findings | Security | Backend Eng | Vulnerability report (CVSS scores) | EOD W5 |
| Accessibility audit results | QA + Design | Frontend Eng | AODA report + remediation checklist | EOD W5 |
| Go/No-Go decision | PM + CTO | Business | Decision document + launch timeline | 2026-09-20 EOD |

---

## 17. SUCCESS METRICS

### KPIs (M6 Exit)

| Metric | Target | Baseline | Measurement |
|--------|--------|----------|-------------|
| Warehouse query p95 latency | <2 s | — | SigNoz dashboard (28-day rolling) |
| Dashboard rendering p95 latency | <2 s | — | RUM + Playwright test |
| PDF export completion rate | ≥99% | — | Success/failure logs (Hatchet) |
| Email delivery rate | ≥95% | — | Resend webhook events |
| Pen-test P0 findings | 0 | — | Re-test report |
| WCAG 2.1 AA audit | 100% pass on critical paths | — | Automated + manual report |
| Load test error rate | <2% | — | Artillery.io final report |
| Capacity utilisation (Oracle VM) | <70% at launch | — | CloudWatch metrics |

### Business Outcomes (Post-GA)

| Metric | 30-Day Target | 90-Day Target |
|--------|---|---|
| External customer sign-ups | ≥5 | ≥15 |
| Weekly active users (new cohort) | ≥20 | ≥50 |
| Defect flow rate (QA Nexus → Jira) | ≥70% | ≥85% |
| Time-to-log-defect (median) | ≤90 s | ≤60 s |
| ROI dashboard usage | ≥60% of leads | ≥80% |
| Customer NPS (pilot feedback) | ≥50 | ≥65 |

---

## 18. GLOSSARY

| Term | Definition |
|------|-----------|
| **DuckDB** | Columnar SQL database for OLAP; embedded or standalone; ideal for analytics warehouse |
| **ETL** | Extract-Transform-Load; pipeline moving data from Postgres (OLTP) to DuckDB (OLAP) |
| **Hatchet** | Task queue + job scheduler; orchestrates async work (doc gen, ETL, email sends) |
| **Resend** | Email service API; handles transactional + bulk email with delivery tracking |
| **Playwright** | Browser automation + headless rendering; used for PDF export of dashboards |
| **recharts** | React charting library; composable, accessible, dark-mode-ready |
| **TanStack Table** | Headless React table library; sortable, filterable, virtual-scrolling |
| **TanStack React Grid** | Draggable grid layout for dashboard builder |
| **DPPM** | Defects Per Million (test-case executions); quality KPI |
| **DRE** | Defect Removal Efficiency; % of defects caught before production |
| **MTBF** | Mean Time Between Failures; reliability metric |
| **RTM** | Requirements Traceability Matrix; links requirements → test cases → results → defects |
| **Cohort Analysis** | Grouping users/testers by dimension (sprint, tester, environment) to compare metrics |
| **Feature Flag** | Runtime toggle enabling/disabling features without redeployment |
| **GA** | General Availability; production-ready, external customers supported |
| **SRE** | Site Reliability Engineer; owns production health, incident response |
| **WCAG 2.1 AA** | Web Content Accessibility Guidelines level AA; 4.5:1 contrast minimum, keyboard navigation required |
| **Pen-Test** | Penetration test; security assessment by skilled attacker; identifies vulnerabilities |
| **OWASP Top 10** | Open Web Application Security Project; 10 most critical web vulnerabilities |

---

## APPENDIX A: WAREHOUSE QUERY EXAMPLES

```sql
-- Example 1: Daily Pass Rate Trend
SELECT 
    DATE(passed_at) as date,
    COUNT(*) as total_runs,
    SUM(CASE WHEN result_status = 'PASS' THEN 1 ELSE 0 END) as passed,
    ROUND(100.0 * SUM(CASE WHEN result_status = 'PASS' THEN 1 ELSE 0 END) / COUNT(*)) as pass_rate
FROM warehouse_test_results
WHERE project_id = $1
GROUP BY DATE(passed_at)
ORDER BY date DESC
LIMIT 30;

-- Example 2: Defect by Category (Last 30 Days)
SELECT 
    category,
    COUNT(*) as count,
    ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER ()) as pct
FROM warehouse_defects
WHERE project_id = $1 AND created_date >= CURRENT_DATE - 30
GROUP BY category
ORDER BY count DESC;

-- Example 3: Cohort Analysis (Tester × Sprint)
SELECT 
    w.tester_id,
    w.sprint,
    COUNT(*) as total_runs,
    SUM(CASE WHEN w.result_status = 'PASS' THEN 1 ELSE 0 END) as passed,
    ROUND(100.0 * SUM(CASE WHEN w.result_status = 'PASS' THEN 1 ELSE 0 END) / COUNT(*)) as pass_rate
FROM warehouse_test_results w
WHERE w.project_id = $1
GROUP BY w.tester_id, w.sprint
ORDER BY w.sprint DESC, pass_rate DESC;

-- Example 4: DPPM (Defects Per Million)
SELECT 
    project_id,
    COUNT(DISTINCT defect_id) as defect_count,
    COUNT(*) as total_runs,
    ROUND(COUNT(DISTINCT defect_id) * 1.0e6 / COUNT(*)) as dppm
FROM warehouse_test_results
WHERE project_id = $1
GROUP BY project_id;
```

---

## APPENDIX B: FEATURE FLAG ROLLOUT SCHEDULE

| Week | Flag | Enabled For | Validation Gate |
|------|------|---|---|
| W1 | (none) | — | — |
| W2 | `reports.warehouse_duckdb` | Internal pilots | ETL 100% success over 24h |
| W2 | `reports.custom_dashboards` | Internal pilots | Dashboard rendering <2s, 50 widgets tested |
| W3 | `reports.cohort_analysis` | Internal pilots | Heatmap drill-down validated with pilot data |
| W3 | `reports.traceability_matrix` | Internal pilots | RTM export tested with 5K+ cases |
| W3 | `reports.quality_kpi` | Internal pilots | KPI calculations verified against manual calc |
| W4 | `reports.pdf_export` | Internal pilots | 10 PDFs tested; rendering <30s |
| W4 | `reports.xlsx_export` | Internal pilots | 5 XLSXs tested; multi-sheet format correct |
| W4 | `reports.scheduled_email` | Internal pilots | 10 schedules running; delivery rate >95% |
| W4 | `reports.saved_report_library` | Internal pilots | Library browsing + sharing tested |
| W5 | (none, pre-GA validation) | — | Pen-test + accessibility audit completion |
| W5 (EOD) | `ga.external_signup` | All | **GO decision made + signed off** |

---

## APPENDIX C: SAMPLE GO/NO-GO CHECKLIST (2026-09-20)

**Conducted by:** PM + CTO + Business  
**Attendees:** Backend Lead, Data Eng, Frontend Lead, QA Lead, DevOps, Legal, Support  
**Duration:** 1 hour

### Questions

1. **All M0–M6 ACs closed?** ✓ (verify against AC checklist)
2. **Zero P0 defects for ≥7 days?** ✓ (query defect tracking system; last P0 closed 2026-09-20)
3. **Pen-test findings remediated (P0) or risk-accepted (P1)?** ✓ (1 P0 fixed; 2 P1 documented in known issues)
4. **WCAG 2.1 AA audit passed?** ✓ (100% critical paths; 3 minor issues documented for v1.5)
5. **p95 latency budgets met?** ✓ (API 250ms, dashboard 1.8s, doc gen 45s)
6. **Load test passed?** ✓ (20 users, 10 min, 1.2% error rate)
7. **Capacity plan signed off?** ✓ (DevOps green-light; Hetzner standby provisioned)
8. **External customer onboarding ready?** ✓ (sign-up flow tested; training materials final)
9. **Support tier SLAs defined?** ✓ (Bronze/Silver/Gold published)
10. **Incident response runbook reviewed?** ✓ (on-call trained; dry-run executed)
11. **GA announcement approved?** ✓ (blog + email final; social calendar scheduled)

### Decision

**VOTE:**
- PM: **GO**
- CTO: **GO**
- Business: **GO**

**Outcome:** **GO FOR GA LAUNCH**  
**Effective Date:** 2026-09-21 EOD  
**Action:** Enable `ga.external_signup` flag; publish announcement.

---

**End of Milestone M6 Document**

---

## Document Metadata

| Property | Value |
|----------|-------|
| **Document ID** | M6–FULL-REPORTS-GA-v1.0 |
| **Created** | 2026-04-21 |
| **Last Updated** | 2026-04-21 |
| **Status** | Draft (Ready for Handoff) |
| **Reviewers** | PM (approval pending), CTO (approval pending), Business (approval pending) |
| **Version History** | 1.0 (initial) |
