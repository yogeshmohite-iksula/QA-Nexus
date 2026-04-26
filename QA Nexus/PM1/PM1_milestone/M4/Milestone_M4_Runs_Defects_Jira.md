# MILESTONE M4 — Test Runs, Defects & Jira Integration

> ⚠️ **Tech stack updated 2026-04-25 — see PM1_PRD v8.1 / PM1_ERD v2.1 as binding. M4 ships A4 5-Layer RCA — the locked LLM stack applies.**
> The task list below was written against the v1.0 self-hosted vision. For the actual M4 build:
> - **A4 5-Layer RCA:** Groq free → `openai/gpt-oss-120b` for full-context layers (L2 Env, L3 Config, L4 Code); `openai/gpt-oss-20b` (1,000 tok/s, 14.4K RPD free) for L1 Stack fast parsing; Gemini 2.5 Flash fallback on 429/503. All 5 layers run in parallel via `Promise.all` in NestJS service. **NO Ollama, NO LangGraph in Python — pure TypeScript orchestration.**
> - **5-Layer confidence canon (locked, do not deviate):** L1 Stack 90% → L2 Env 80% → L3 Config 60% → L4 Code 50% → L5 Data 40%
> - **A4 latency budget (revised v2.1):** p50 8s · p95 15s (down from v1.0's 30s — Groq's parallel LPU speed)
> - **Jira 2-way sync (PM1):** OAuth 2.0 3LO ONLY (NO API Token, NO PAT, NO custom OAuth — those are PM3 M17 scope, FR-063/064). OAuth tokens encrypted via Vault transit (Render env vars in PM1; OpenBao migration in PM2).
> - **Inbound Jira webhooks:** HMAC-SHA256 verified; status mapping in `jira_status_map`; sync events written to audit_log.
> - **Frames in scope:** F18 Test Suites, F18m1 Edit Suite Modal, F19 Run Console (live state, 4-zone layout, pulsing live pill via Framer Motion), F20 Run Results, F21 Defects Hub, F22 Defect Detail (A4 RCA accordion) — all locked in PM1_UI_v2.
> - **WebSocket events used:** `test_run.progress`, `defect.rca_ready`, `agent_run.complete` (NestJS `@nestjs/websockets`, NO Redis pub/sub).
> - **Evidence storage:** Cloudflare R2 free (10 GB) — direct browser → R2 upload via presigned URLs from EP-013/EP-014; NO buffering through 512 MB Render dyno.
> - **Defect state machine (locked v2.1, see PM1_ERD §3.9):** New → Triaged → In-Progress / Blocked → Resolved → Verified → Closed (with Reopened branch). A4 RCA fires on Triaged.
> - **TestRun state machine (locked v2.1, see PM1_ERD §3.10):** Queued → Running → Passed/Failed/Blocked/Aborted. Failed → Defected (auto-creates defect via EP-011).
>
> Use this M4 file for workflow narrative + acceptance criteria. For binding model + integration choices, defer to PM1_PRD v8.1 §12.3 and PM1_ERD v2.1 §3.6 (A4 RCA sequence), §3.7 (Jira 2-way sync sequence), §3.9-3.10 (state machines), §7 (A4 spec).

**Organization:** Iksula Services Pvt Ltd  
**Milestone:** M4 (Weeks 14–16)  
**Duration:** 3 weeks | 2026-07-06 → 2026-07-26  
**Status:** Specification Document (Locked Scope)  
**Version:** 1.0  
**Authors:** Agent Milestone (M4 Generator), reviewed against MILESTONE_REGISTRY.md

---

## TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [What Was Delivered Before (M0–M3)](#what-was-delivered-before-m0m3)
3. [M4 Scope (Locked)](#m4-scope-locked)
4. [Technical Stack](#technical-stack)
5. [Definition of Ready (DoR) = M3 DoD](#definition-of-ready-dor--m3-dod)
6. [Tasks (MS4-T001–T060)](#tasks-ms4-t001t060)
7. [Week-Wise Breakdown](#week-wise-breakdown)
8. [Acceptance Criteria (MS4-AC001–AC045)](#acceptance-criteria-ms4-ac001ac045)
9. [API Contracts & Endpoints](#api-contracts--endpoints)
10. [Database Changes](#database-changes)
11. [Testing Strategy](#testing-strategy)
12. [Feature Flags](#feature-flags)
13. [Risks & Mitigations](#risks--mitigations)
14. [Rollback Plan](#rollback-plan)
15. [Deliverables Checklist](#deliverables-checklist)
16. [Next Milestone Preview (M5)](#next-milestone-preview-m5)

---

## EXECUTIVE SUMMARY

**Mission:** Users execute test runs manually, capture evidence inline, log defects with AI-powered root-cause analysis (Agent A4), and sync defects bidirectionally with Jira. Run dashboards track progress in real-time.

**Headline Scope:**
- **Test Runs**: Create from test plan, assign tester, track execution (in-progress → pass/fail/blocked)
- **Test Executions**: One-per-test-case step-by-step executor page with evidence capture (screenshot paste, file upload to R2), actual-result entry
- **Defect Lifecycle**: New → Triaged → In Progress → Ready for QA → Verified → Closed (+ Reopened)
- **Defect Detail Pop-Up**: Tabs—Details | History | Linked Tests | AI RCA (5-layer analysis)
- **Agent A4 (Defect Intelligence)**: LangGraph flow analyzing defect evidence → 5 root-cause layers (surface, component, data/state, dependency, root + preventive). Langfuse traced.
- **Jira Bidirectional Sync**: OAuth 2.0 3-legged, issue mapping (QA Nexus Defect ↔ Jira Issue), status transitions synced, comments + attachments synced via webhook + 2-min poll fallback
- **Run Dashboard**: Real-time active runs, pass/fail rates, blockers flagged
- **Evidence Storage**: R2 signed URLs, secure attachment download

**Why This Matters:** Defects are the currency of QA. Without frictionless logging + AI analysis + Jira sync, QA teams lose hours to manual triage. M4 closes that loop.

---

## CONTEXT / PREDECESSORS: WHAT WAS DELIVERED BEFORE (M0–M3)

**This milestone sits in position M4 of the PM1 (MVP) phase, which runs M0–M6 (21 weeks total). Canonical predecessor order per MILESTONE_REGISTRY.md v3.2:**

### M0: Setup & Infrastructure (Weeks 1–2)
- BetterAuth (email/password, session, password reset)
- 4-role RBAC (Admin, Lead, QA, Mgmt) with profile attributes (Jr/Sr/Automation)
- PostgreSQL 15 + pgvector on Oracle Always Free VM
- Vercel deployment + GitHub Actions CI/CD
- SigNoz, GlitchTip, Langfuse observability
- Doppler + GitHub Secrets for env management

### M1: Users & Roles (Weeks 3–4)
- 4-role RBAC fully enforced (Admin/Lead/QA/Stakeholder)
- Project CRUD (create, list, delete)
- Row-Level Security (RLS) enabled on all tables
- User profile attributes (Jr/Sr/Automation)
- User invitations and org management

### M2: Test Documents & Knowledge Base — Core Doc Catalog (12 templates) (Weeks 5–7)
- KB CRUD + approval workflow
- RAG pipeline (BGE embeddings + pgvector)
- 12 document templates (Strategy, Plan, RTM, Daily/Weekly/Sprint/Release reports, Defect Report, RCA, Charter, Regression)
- Document Intelligence Layer (A1 context-gathering)
- PDF export + versioning

### M3: Test Cases & AI Generation — Test Case Management (Weeks 8–10)
- Test case CRUD (TipTap editor, BDD + traditional modes)
- A1 Test Case Generator (LangGraph, Clarification Questions gate)
- A2 Dedup (live chips, semantic similarity scoring)
- RTM linking, tags, priority, stability sparklines
- Bulk import (CSV, TestRail, Zephyr, Xray, qTest)
- Test Case Management complete and core test case data model populated

**M3 Handoff to M4:**
- Test runs table populated (100+ runs across 3–5 projects)
- Defects table seeded (50+ defects with evidence attachments)
- Jira OAuth integration validated (token flow working)
- A4 RCA agent ready (trained on 50-defect corpus, Langfuse instrumented)

---

## M4 SCOPE (LOCKED)

### Feature 1: Complete Test Execution Flow (Weeks 1–2)
- **Execution page redesign** for manual testers: expanded step panel, evidence capture inline
- **Evidence capture mechanisms**: screenshot paste (Ctrl+V), file upload dialog, automatic snapshot on failure
- **R2 integration**: signed URLs for secure evidence access, TTL-based expiry (7 days)
- **Actual-result entry**: rich text field, reference screenshots, mark pass/fail/blocked
- **Defect creation pop-up**: triggered mid-execution, pre-filled with test context (run ID, case ID, step #, evidence refs)

### Feature 2: Defect Lifecycle & Detail Pop-Up (Weeks 1–2)
- **Defect lifecycle states**: New → Triaged → In Progress → Ready for QA → Verified → Closed (+ Reopened loop)
- **Defect detail pop-up**: modal with tabs:
  - **Details**: Title, description, category, severity, steps-to-reproduce, expected-vs-actual
  - **History**: State transitions, assignee changes, comments, timestamps
  - **Linked Tests**: List of test cases that surfaced this defect
  - **AI RCA**: Agent A4 output (5 layers, confidence per layer, root cause statement, preventive action)
- **Defect assignments**: Auto-assign based on component (from evidence analysis) or manual override
- **Comments thread**: @-mentions, markdown, linked defects

### Feature 3: Agent A4 — Defect Intelligence (Week 2–3)
- **5-Layer RCA Flow** (LangGraph):
  1. **Layer 1 (Surface)**: Parse error message, stack trace, log lines → surface symptom
  2. **Layer 2 (Component)**: Map stack trace to architecture (backend/frontend/API/DB) → likely component
  3. **Layer 3 (Data/State)**: Analyze test data, environment variables, screenshots → data state anomaly
  4. **Layer 4 (Dependency)**: Correlate timing, external service failures, config drift → dependency failure
  5. **Layer 5 (Root + Preventive)**: Synthesize L1–L4 → root cause statement + actionable preventive steps
- **Confidence scoring**: Per-layer confidence (0.0–1.0), visual indicators (green=high, yellow=medium, red=low)
- **Evidence analysis**:
  - Extract text from screenshots (OCR if needed)
  - Parse HAR logs (response times, 4xx/5xx errors, headers)
  - Scan console logs for warnings/errors
  - Inspect env snapshot (browser version, test data ID, backend version)
- **Async execution**: RCA triggered on defect creation, populated into defect detail within 5–10 seconds
- **Langfuse tracing**: Full LangGraph execution logged (model inputs, outputs, latency, cost)
- **Human feedback loop**: Mark RCA layer as "Correct" / "Incorrect" → signal for continuous tuning

### Feature 4: Jira Bidirectional Sync (Week 3)
- **OAuth 2.0 3-Legged Flow**:
  - User clicks "Link to Jira" in settings
  - Redirects to Jira login → QA Nexus OAuth callback
  - Token stored (encrypted in DB), refresh token rotated on use
  - User selects Jira project, status mapping (QA Nexus → Jira field names)
- **Issue Mapping**:
  - QA Nexus Defect ID ↔ Jira Issue Key (stored in jira_links table)
  - One-to-one mapping; supports bulk re-mapping if Jira issue closed/merged
- **Sync Events**:
  - **QA Nexus → Jira**: Defect created/updated/transitioned → POST to Jira REST API v3 (issue create, issue update)
  - **Jira → QA Nexus**: Webhook (registered on OAuth callback) receives issue.updated events → update defect state in QA Nexus
  - **Fallback**: 2-min poll (if webhook delivery fails) queries Jira for linked issue status
- **Synced Fields**:
  - Status (with mapping: New→Open, Triaged→Open, In Progress→In Progress, Ready for QA→Ready for QA, Verified→Done, Closed→Closed)
  - Assignee (Jira assignee.email_address ↔ QA Nexus user.email)
  - Comments/descriptions (append "Synced from QA Nexus" or "Synced from Jira" footer)
  - Attachments (evidence screenshots, console logs uploaded as Jira issue attachments)
  - Custom fields (e.g., affected_version, environment, priority) if configured
- **Webhook Processor**: Hatchet consumer listening for Jira webhook events, parsing payload, updating defect via API
- **Sync Audit Trail**: jira_sync_logs table logs every sync event (timestamp, direction, payload hash, status)

### Feature 5: Run Dashboard (Week 2)
- **Real-Time Metrics**:
  - Active runs (count, list with project + assigned tester)
  - Pass rate (% of cases executed with PASS result)
  - Fail rate (% of cases executed with FAIL result)
  - Blocked count (cases blocked by blocker defect)
  - In-progress count (cases not yet executed in active runs)
- **Charts**:
  - Pass/fail/blocked trend line (last 7 days, auto-refresh every 30s)
  - Defect severity distribution (pie chart: Critical/High/Medium/Low)
- **Run List**:
  - Run name, test plan, assigned tester, execution %age, start time, estimated completion
  - Quick-action buttons: View Details, Download Evidence, Add Defect
- **Live Updates**: WebSocket or polling (30s interval) for real-time refresh
- **Filtering**: By project, by test plan, by tester, by status

---

## TECHNICAL STACK

| Component | Technology | Purpose | Notes |
|-----------|-----------|---------|-------|
| **Async Job Queue** | Hatchet | RCA job processing, Jira sync, evidence processing | 2 workers, 30s timeout for RCA |
| **LLM for RCA** | Ollama (Gemma 4) + Claude API fallback | Layer-by-layer RCA analysis | Langfuse traced; per-layer confidence scoring |
| **File Storage** | Cloudflare R2 | Evidence screenshots, logs, HAR files | Signed URLs, 7-day expiry |
| **Jira REST API** | Jira Cloud REST API v3 | Issue CRUD, status mapping, webhook registration | OAuth 2.0 3LO; token refresh |
| **Webhooks** | Hatchet consumer pattern | Jira issue.updated events → defect update | Retry logic; 2-min poll fallback if webhook fails |
| **Event Tracing** | Langfuse | A4 RCA execution, sync events, API calls | Public key-based sampling; 5% trace rate initially |
| **Real-Time Updates** | Server-Sent Events (SSE) or WebSocket | Run dashboard live refresh | Poll-based (30s) fallback if SSE unavailable |

---

## DEFINITION OF READY (DoR) = M3 DoD

M4 entry criteria (all of these must be complete before sprint planning):

1. Test Run CRUD complete from M3 (create run, assign cases, manage environments)
2. Execution UI functional from M3 (one-row-per-case, step detail, quick-status buttons)
3. Auto-evidence capture working (screenshot, HAR, console logs, env snapshot)
4. Defect CRUD from M3 (create from run, categorize, attachments)
5. Jira OAuth 2.0 token flow working (3-legged, token refresh)
6. Defect → Jira issue one-way creation validated
7. Jira REST API v3 access tested (create, update, get issue calls)
8. Webhook endpoint created (POST /webhooks/jira/issue-updated)
9. R2 bucket configured with signed URL template
10. Langfuse integration live (keys provisioned, trace sampling configured)
11. Ollama Gemma 4 model warm + responsive (<5s inference for simple prompts)
12. A4 RCA agent skeleton ready (prompt templates for L1–L5 defined)
13. Test data: ≥50 defects seeded with evidence (screenshots, logs, HAR files)
14. Database schema for jira_links, jira_webhook_events, jira_sync_logs created + indexed

---

## TASKS (MS4-T001–T060)

**Estimation Methodology:** T-shirt sizing (XS=2h, S=4h, M=8h, L=16h, XL=32h), 20% buffer applied to sprint capacity.

### Week 1: Execution UI + Evidence Capture

| Task ID | Title | Assignee | Type | Est. | Status | AC IDs |
|---------|-------|----------|------|-----|--------|--------|
| **MS4-T001** | Redesign execution page layout (step panel expansion) | Frontend | Story | M | TODO | AC001, AC002 |
| **MS4-T002** | Implement screenshot paste handler (Ctrl+V → R2 upload) | Frontend | Feature | M | TODO | AC003 |
| **MS4-T003** | Build file upload dialog (drag-drop, file picker) | Frontend | Feature | M | TODO | AC004 |
| **MS4-T004** | Create R2 upload endpoint (multipart, signed URL generation) | Backend | Feature | M | TODO | AC005 |
| **MS4-T005** | Implement R2 signed URL retrieval (TTL=7d expiry) | Backend | Feature | S | TODO | AC006 |
| **MS4-T006** | Add evidence list to execution page (thumbnails + download links) | Frontend | Feature | S | TODO | AC007 |
| **MS4-T007** | Build actual-result entry form (rich text, pass/fail/blocked buttons) | Frontend | Feature | M | TODO | AC008 |
| **MS4-T008** | Create defect creation pop-up (pre-filled form, evidence ref) | Frontend | Feature | M | TODO | AC009 |
| **MS4-T009** | Build POST /api/defects endpoint (from execution context) | Backend | Feature | M | TODO | AC010 |
| **MS4-T010** | Implement execution state transitions (in-progress → pass/fail/blocked) | Backend | Feature | S | TODO | AC011 |
| **MS4-T011** | Add execution history tab (timeline view) | Frontend | Feature | S | TODO | AC012 |
| **MS4-T012** | Test execution UI end-to-end (Playwright) | QA | Test | M | TODO | AC013 |

**Week 1 Subtotal: 14 tasks, ~112 hours (80h base + 20% buffer)**

---

### Week 2: Defect Lifecycle + Detail Pop-Up + Run Dashboard

| Task ID | Title | Assignee | Type | Est. | Status | AC IDs |
|---------|-------|----------|------|-----|--------|--------|
| **MS4-T013** | Design defect detail pop-up layout (4 tabs) | Design | Story | S | TODO | AC014 |
| **MS4-T014** | Build defect detail pop-up component (modal, tab nav) | Frontend | Feature | M | TODO | AC015 |
| **MS4-T015** | Create Details tab (title, description, category, severity) | Frontend | Feature | M | TODO | AC016 |
| **MS4-T016** | Create History tab (state transitions, assignee, comments) | Frontend | Feature | M | TODO | AC017 |
| **MS4-T017** | Create Linked Tests tab (list of test cases) | Frontend | Feature | S | TODO | AC018 |
| **MS4-T018** | Create AI RCA tab (layer display, confidence indicators) | Frontend | Feature | M | TODO | AC019 |
| **MS4-T019** | Implement defect lifecycle state machine (6 states + transitions) | Backend | Feature | M | TODO | AC020 |
| **MS4-T020** | Build defect update endpoint (PATCH /api/defects/{id}) | Backend | Feature | M | TODO | AC021 |
| **MS4-T021** | Create comments thread UI (markdown, @-mentions) | Frontend | Feature | L | TODO | AC022 |
| **MS4-T022** | Implement comments API (create, read, update) | Backend | Feature | M | TODO | AC023 |
| **MS4-T023** | Add defect assignment logic (auto-assign by component) | Backend | Feature | M | TODO | AC024 |
| **MS4-T024** | Build run dashboard page layout | Frontend | Feature | M | TODO | AC025 |
| **MS4-T025** | Implement real-time metrics cards (active runs, pass/fail counts) | Frontend | Feature | M | TODO | AC026 |
| **MS4-T026** | Create pass/fail/blocked trend chart (7-day history) | Frontend + Analytics | Feature | L | TODO | AC027 |
| **MS4-T027** | Create defect severity pie chart | Frontend + Analytics | Feature | S | TODO | AC028 |
| **MS4-T028** | Build run list with quick actions | Frontend | Feature | M | TODO | AC029 |
| **MS4-T029** | Implement SSE subscription (30s poll fallback) for dashboard | Frontend | Feature | M | TODO | AC030 |
| **MS4-T030** | Create dashboard filter controls (project, plan, tester, status) | Frontend | Feature | M | TODO | AC031 |
| **MS4-T031** | Build GET /api/dashboards/runs (metrics + run list) | Backend | Feature | M | TODO | AC032 |
| **MS4-T032** | Test run dashboard end-to-end | QA | Test | L | TODO | AC033 |

**Week 2 Subtotal: 20 tasks, ~162 hours (130h base + 20% buffer)**

---

### Week 3: Agent A4 + Jira Sync + Integration Testing

| Task ID | Title | Assignee | Type | Est. | Status | AC IDs |
|---------|-------|----------|------|-----|--------|--------|
| **MS4-T033** | Design A4 RCA LangGraph flow (5 layers) | AI/Eng | Design | M | TODO | AC034 |
| **MS4-T034** | Implement Layer 1 prompt (surface symptom extraction) | AI | Feature | S | TODO | AC035 |
| **MS4-T035** | Implement Layer 2 prompt (component classification) | AI | Feature | S | TODO | AC035 |
| **MS4-T036** | Implement Layer 3 prompt (data/state analysis) | AI | Feature | S | TODO | AC035 |
| **MS4-T037** | Implement Layer 4 prompt (dependency failure detection) | AI | Feature | S | TODO | AC035 |
| **MS4-T038** | Implement Layer 5 prompt (root cause + preventive action) | AI | Feature | M | TODO | AC036 |
| **MS4-T039** | Wire A4 agent to Hatchet (async RCA job) | Backend | Feature | M | TODO | AC037 |
| **MS4-T040** | Add Langfuse tracing to RCA flow | Backend | Feature | S | TODO | AC038 |
| **MS4-T041** | Implement RCA result storage (defect_rca table) | Backend | Feature | S | TODO | AC039 |
| **MS4-T042** | Add confidence scoring to RCA output | AI | Feature | S | TODO | AC040 |
| **MS4-T043** | Build RCA feedback mechanism (correct/incorrect buttons) | Frontend | Feature | S | TODO | AC041 |
| **MS4-T044** | Implement Jira OAuth 2.0 3-legged flow (redirect + callback) | Backend | Feature | L | TODO | AC042 |
| **MS4-T045** | Build Jira integration settings page (project + field mapping) | Frontend | Feature | M | TODO | AC043 |
| **MS4-T046** | Create POST /api/jira/sync/defect (defect → Jira issue) | Backend | Feature | L | TODO | AC044 |
| **MS4-T047** | Implement Jira webhook receiver (POST /webhooks/jira/issue-updated) | Backend | Feature | M | TODO | AC045 |
| **MS4-T048** | Build Jira webhook → defect sync logic (status, assignee, comments) | Backend | Feature | L | TODO | AC046 |
| **MS4-T049** | Create 2-min poll fallback (if webhook delivery fails) | Backend | Feature | M | TODO | AC047 |
| **MS4-T050** | Implement jira_sync_logs table + audit trail | Backend | Feature | S | TODO | AC048 |
| **MS4-T051** | Add sync error handling + retry logic | Backend | Feature | M | TODO | AC049 |
| **MS4-T052** | Test Jira OAuth flow (mocked Jira sandbox) | QA | Test | M | TODO | AC050 |
| **MS4-T053** | Test full defect-to-Jira sync (2-way) | QA | Test | L | TODO | AC051 |
| **MS4-T054** | Test A4 RCA on golden defects (50-defect corpus) | AI/QA | Test | L | TODO | AC052 |
| **MS4-T055** | Load test dashboard (10 concurrent users, 100 active runs) | QA | Test | L | TODO | AC053 |
| **MS4-T056** | E2E test: plan → run → defect → Jira (Playwright) | QA | Test | XL | TODO | AC054 |
| **MS4-T057** | Documentation: User guide (evidence, defect, RCA, Jira sync) | Tech Writer | Doc | M | TODO | AC055 |
| **MS4-T058** | Documentation: API contract (endpoints, schemas, examples) | Tech Writer | Doc | M | TODO | AC056 |
| **MS4-T059** | Documentation: Admin runbook (Jira mapping, webhook debugging) | Tech Writer | Doc | S | TODO | AC057 |
| **MS4-T060** | Rollback plan validation (disable flags, manual defect creation) | DevOps | Test | S | TODO | AC058 |

**Week 3 Subtotal: 28 tasks, ~224 hours (180h base + 20% buffer)**

**Total M4 Tasks: 62 tasks, ~498 hours (~100 story points, 6 eng FTE @ 80h/week = ~1 week buffer)**

---

## WEEK-WISE BREAKDOWN

### Week 1 (2026-07-06 → 2026-07-12): Execution UI + Evidence Capture

**Goal:** Testers can execute steps, capture evidence inline, and pre-fill defect form.

**Deliverables:**
- Redesigned execution page (expanded step panel)
- Screenshot paste + file upload (→ R2)
- Evidence list with download links
- Actual-result form (pass/fail/blocked)
- Defect creation pop-up (pre-filled)

**Key Milestones:**
- Mon 7/08: R2 endpoint live, upload tested
- Wed 7/10: Execution UI with evidence capture in production
- Fri 7/11: Defect pop-up integrated, E2E tested

---

### Week 2 (2026-07-13 → 2026-07-19): Defect Lifecycle + Run Dashboard

**Goal:** Defect lifecycle states, detail pop-up, and real-time run dashboard operational.

**Deliverables:**
- Defect detail pop-up (4 tabs)
- Defect lifecycle state machine (6 states)
- Comments thread
- Run dashboard (metrics + charts)
- Dashboard live refresh (SSE + polling)

**Key Milestones:**
- Tue 7/15: Defect state machine + lifecycle complete
- Wed 7/16: Dashboard real-time metrics live
- Fri 7/19: Full dashboard in production

---

### Week 3 (2026-07-20 → 2026-07-26): Agent A4 + Jira Sync + E2E Testing

**Goal:** A4 RCA live, Jira bidirectional sync functional, E2E pipeline validated.

**Deliverables:**
- A4 RCA LangGraph flow (5 layers, confidence scoring)
- Jira OAuth 2.0 integration (token management)
- Jira issue creation + 2-way sync
- Webhook receiver + 2-min poll fallback
- Comprehensive E2E tests

**Key Milestones:**
- Mon 7/20: A4 RCA agent in production (async)
- Tue 7/21: Jira OAuth + webhook live
- Wed 7/22: 2-way sync validated
- Fri 7/26: E2E test suite passing, documentation complete

---

## ACCEPTANCE CRITERIA (MS4-AC001–AC045)

### Execution & Evidence (AC001–AC013)

| AC ID | Criterion | Type | Verification Method |
|-------|-----------|------|---------------------|
| **AC001** | Execution page step panel expands to ≥50% viewport height | UI | Visual inspection + responsive test |
| **AC002** | Tester can scroll through multiple steps without page reload | UI | Playwright navigation test |
| **AC003** | Screenshot pasted (Ctrl+V) uploads to R2 within 3 seconds | Integration | Automated upload + verify R2 object exists |
| **AC004** | File upload dialog accepts .png, .jpg, .zip, .txt, .log (max 50MB) | Validation | File type + size rejection test |
| **AC005** | R2 upload endpoint returns signed URL with 7-day expiry | API | Verify URL decode + timestamp validation |
| **AC006** | Signed URL accesses file without authentication (before expiry) | Security | HTTP GET without bearer token |
| **AC007** | Evidence list displays thumbnails for images, file icons for logs | UI | Visual regression test |
| **AC008** | Actual-result rich text editor supports bold, italic, code blocks | UI | TipTap editor feature test |
| **AC009** | Defect pop-up pre-fills with run ID, case ID, step #, evidence refs | Data | Defect creation payload inspection |
| **AC010** | POST /api/defects returns 201 with defect ID + initial state=New | API | Request/response schema validation |
| **AC011** | Execution result persisted (PASS/FAIL/BLOCKED) in test_executions table | Data | DB query verification |
| **AC012** | Execution history shows state transitions with timestamps | UI | Timeline rendering test |
| **AC013** | E2E: Author → Create Run → Execute Step → Log Evidence → Create Defect (≤2 min) | E2E | Playwright scenario timing |

### Defect Lifecycle & Pop-Up (AC014–AC024)

| AC ID | Criterion | Type | Verification Method |
|-------|-----------|------|---------------------|
| **AC014** | Defect detail pop-up renders 4 tabs (Details, History, Linked Tests, RCA) | UI | DOM inspection |
| **AC015** | Pop-up modal is centered, dismissible via X or Esc key | UI | Visual + keyboard test |
| **AC016** | Details tab displays title, description, category, severity, steps-to-reproduce | UI | Field rendering test |
| **AC017** | History tab shows state transitions (date, old state, new state, actor) | UI | Data rendering test |
| **AC018** | Linked Tests tab lists all test cases that produced this defect | Data | Query validation (defects ↔ test_executions join) |
| **AC019** | RCA tab displays 5 layers with color-coded confidence (green/yellow/red) | UI | CSS class inspection |
| **AC020** | Defect state transitions follow FSM: New → Triaged → In Progress → Ready for QA → Verified → Closed (+ Reopened) | Logic | State transition test (invalid transitions rejected) |
| **AC021** | PATCH /api/defects/{id} updates state, assignee, category | API | Request/response validation |
| **AC022** | Comments thread supports @-mentions, markdown, links | UI | Rich text rendering test |
| **AC023** | Comments persisted to defect_comments table with user + timestamp | Data | DB query |
| **AC024** | Auto-assignment logic assigns defect to component owner (if A4 identifies component) | Logic | RCA → component → owner mapping test |

### Run Dashboard (AC025–AC033)

| AC ID | Criterion | Type | Verification Method |
|-------|-----------|------|---------------------|
| **AC025** | Dashboard displays active run count, pass rate, fail rate, blocked count | UI | Metrics card rendering |
| **AC026** | Pass/fail/blocked trend chart shows 7-day history with ≥hourly granularity | Analytics | Chart data points validation |
| **AC027** | Trend chart auto-refreshes every 30 seconds (SSE or polling) | Responsiveness | WebSocket/HTTP polling monitor |
| **AC028** | Severity pie chart (Critical/High/Medium/Low) displays current open defects | Analytics | Pie slice calculation test |
| **AC029** | Run list displays name, plan, tester, execution %, start time, estimated completion | UI | Table rendering |
| **AC030** | Quick-action buttons (View Details, Download Evidence, Add Defect) functional | UI | Click handlers + routing |
| **AC031** | Dashboard filter controls (project, plan, tester, status) apply to metrics + run list | Filtering | Filtered query validation |
| **AC032** | GET /api/dashboards/runs returns metrics + run list in ≤500ms | Performance | Latency measurement |
| **AC033** | E2E: View dashboard → apply filters → see updated metrics (≤2 min) | E2E | Playwright scenario |

### Agent A4 RCA (AC034–AC042)

| AC ID | Criterion | Type | Verification Method |
|-------|-----------|------|---------------------|
| **AC034** | RCA LangGraph job completes within 10 seconds for defect with complete evidence | Performance | Langfuse trace latency |
| **AC035** | RCA outputs text for all 5 layers (L1 surface, L2 component, L3 data/state, L4 dependency, L5 root) | Data | Output parsing test |
| **AC036** | Layer 5 includes root cause statement + ≥2 actionable preventive steps | Content | Manual review of 10 RCAs |
| **AC037** | RCA job queued immediately on defect creation, async notification on completion | Architecture | Hatchet job log + event trigger |
| **AC038** | Langfuse trace captures model calls, input tokens, output tokens, latency per layer | Observability | Langfuse dashboard inspection |
| **AC039** | RCA result stored in defect_rca table linked to defect ID | Data | DB query |
| **AC040** | Per-layer confidence score (0.0–1.0) displayed with color gradient | UI | Confidence badge rendering |
| **AC041** | User can mark RCA layer as "Correct" / "Incorrect" → signal logged for future retraining | Feedback | Button click + feedback table entry |
| **AC042** | A4 achieves ≥75% top-layer accuracy on 50-defect golden corpus (human-verified) | Quality | Manual evaluation report |

### Jira Integration (AC043–AC051)

| AC ID | Criterion | Type | Verification Method |
|-------|-----------|------|---------------------|
| **AC043** | OAuth 2.0 3-legged flow: user clicks "Link Jira" → redirected to Jira → token stored | Security | OAuth redirect capture + token table inspection |
| **AC044** | Token refresh automatic (< 1 min before expiry) without user intervention | Architecture | Token refresh logs in jira_sync_logs |
| **AC045** | Jira integration settings page allows project selection + status field mapping | UI | Settings form rendering + save |
| **AC046** | POST /api/jira/sync/defect creates issue in Jira + records jira_links mapping | Integration | Jira API call logged; jira_links table inspected |
| **AC047** | Webhook receives issue.updated event → updates defect state within 2 seconds | Real-time | Webhook delivery log + defect state change timestamp |
| **AC048** | Sync fails gracefully: if webhook fails, 2-min poll queries Jira for status | Reliability | Webhook failure simulation + poll validation |
| **AC049** | Sync audit trail (jira_sync_logs) records every sync event with direction, payload hash, status | Audit | Table query |
| **AC050** | Defect status mapping (New→Open, Verified→Done, etc.) validated on mocked Jira | Integration | Mock Jira test API responses |
| **AC051** | E2E: Create defect in QA Nexus → see issue in Jira → update in Jira → defect updates in QA Nexus (≤2 min round-trip) | E2E | Playwright scenario with Jira sandbox |

### Documentation & Runbooks (AC052–AC058)

| AC ID | Criterion | Type | Verification Method |
|-------|-----------|------|---------------------|
| **AC052** | User guide covers evidence capture, defect lifecycle, RCA interpretation, Jira sync with screenshots | Documentation | Peer review |
| **AC053** | API contract documents all endpoints (request, response, error codes, examples) | API Docs | API spec (OpenAPI 3.0) validation |
| **AC054** | Admin runbook includes Jira OAuth setup, status mapping, webhook debugging, rollback steps | Operations | Runbook completeness review |
| **AC055** | Rollback plan validated: disable feature flags → manual defect creation remains available | Deployment | Smoke test with flags disabled |
| **AC056** | No P0 bugs remain open at M4 DoD | Quality | Bug tracking system query |
| **AC057** | No untracked AI agent invocations (100% logged to Langfuse with user/action/timestamp) | Compliance | Audit log verification |
| **AC058** | Jira sync latency p95 < 5 seconds (issue create), webhook delivery SLA 99% within 2 min | Performance | APM + webhook logs |

---

## API CONTRACTS & ENDPOINTS

### Runs & Executions

```http
POST /api/test-runs
Content-Type: application/json

{
  "project_id": "proj_123",
  "test_plan_id": "plan_456",
  "name": "Smoke Test Run 2026-07-15",
  "assigned_tester_id": "user_789",
  "test_case_ids": ["case_001", "case_002"]
}

Response: 201 Created
{
  "run_id": "run_789",
  "status": "IN_PROGRESS",
  "created_at": "2026-07-15T10:30:00Z"
}
```

```http
GET /api/test-runs/{run_id}/executions
Response: 200 OK
{
  "executions": [
    {
      "execution_id": "exec_001",
      "test_case_id": "case_001",
      "status": "PASSED",
      "result": "...",
      "actual_result": "...",
      "evidence_ids": ["evid_001", "evid_002"],
      "started_at": "2026-07-15T10:35:00Z",
      "ended_at": "2026-07-15T10:40:00Z"
    }
  ]
}
```

```http
PATCH /api/test-executions/{execution_id}
Content-Type: application/json

{
  "status": "PASSED",
  "actual_result": "Feature rendered correctly on all browsers",
  "evidence_ids": ["evid_001"]
}

Response: 200 OK
```

### Evidence Storage

```http
POST /api/evidence/upload
Content-Type: multipart/form-data

[file binary]

Response: 201 Created
{
  "evidence_id": "evid_001",
  "filename": "screenshot_2026-07-15_103500.png",
  "signed_url": "https://r2-bucket.example.com/evidence/evid_001?token=xyz&expires=2026-07-22",
  "expires_at": "2026-07-22T10:35:00Z"
}
```

```http
GET /api/evidence/{evidence_id}
Response: 200 OK
{
  "evidence_id": "evid_001",
  "filename": "screenshot.png",
  "mime_type": "image/png",
  "size_bytes": 245621,
  "signed_url": "https://r2-bucket.example.com/..."
}
```

### Defects

```http
POST /api/defects
Content-Type: application/json

{
  "project_id": "proj_123",
  "run_id": "run_789",
  "execution_id": "exec_001",
  "title": "Login button unresponsive on mobile",
  "description": "...",
  "category": "UI Bug",
  "severity": "HIGH",
  "steps_to_reproduce": "1. Open app on iPhone 14\n2. Click login button",
  "evidence_ids": ["evid_001", "evid_002"]
}

Response: 201 Created
{
  "defect_id": "defect_123",
  "status": "NEW",
  "created_at": "2026-07-15T10:45:00Z"
}
```

```http
GET /api/defects/{defect_id}
Response: 200 OK
{
  "defect_id": "defect_123",
  "title": "...",
  "status": "TRIAGED",
  "assignee_id": "user_456",
  "linked_test_cases": ["case_001", "case_002"],
  "comments": [...],
  "rca": {
    "layer_1": { "text": "...", "confidence": 0.95 },
    "layer_2": { "text": "...", "confidence": 0.87 },
    ...
    "layer_5": { "text": "Root cause: CSS media query not triggered on viewport < 375px. Preventive: Add unit test for mobile breakpoints." }
  }
}
```

```http
PATCH /api/defects/{defect_id}
Content-Type: application/json

{
  "status": "IN_PROGRESS",
  "assignee_id": "user_456"
}

Response: 200 OK
```

### Jira Sync

```http
POST /api/jira/oauth/authorize
Response: 302 Found
Location: https://auth.atlassian.com/authorize?...
```

```http
POST /api/jira/oauth/callback
Query: code=xyz, state=abc

Response: 302 Found
Location: /settings/integrations/jira?status=linked

(Token stored in jira_integrations table, encrypted)
```

```http
POST /api/jira/sync/defect/{defect_id}
Content-Type: application/json

{
  "project_key": "PROJ"
}

Response: 200 OK
{
  "jira_issue_key": "PROJ-456",
  "jira_issue_id": "10001",
  "synced_at": "2026-07-15T10:50:00Z"
}
```

### Webhooks

```http
POST /webhooks/jira/issue-updated
Content-Type: application/json
Authorization: Bearer webhook_token_xyz

{
  "issue": {
    "key": "PROJ-456",
    "id": "10001",
    "fields": {
      "status": { "name": "In Progress" },
      "assignee": { "email_address": "alice@example.com" }
    }
  }
}

Response: 200 OK
{ "status": "processed" }
```

### Dashboards

```http
GET /api/dashboards/runs?project_id=proj_123&limit=10
Response: 200 OK
{
  "metrics": {
    "active_runs": 3,
    "total_cases_executed": 45,
    "pass_count": 38,
    "fail_count": 5,
    "blocked_count": 2,
    "pass_rate": 0.84
  },
  "runs": [
    {
      "run_id": "run_789",
      "name": "Smoke Test 2026-07-15",
      "plan_name": "...",
      "tester_name": "Alice",
      "execution_percent": 100,
      "started_at": "2026-07-15T10:30:00Z",
      "estimated_completion": "2026-07-15T13:00:00Z"
    }
  ],
  "trend": [
    { "timestamp": "2026-07-15T10:00:00Z", "pass_rate": 0.82, "fail_rate": 0.12, "blocked_rate": 0.06 },
    ...
  ]
}
```

---

## DATABASE CHANGES

### New Tables

**test_runs** (M3, enhanced)
```sql
ALTER TABLE test_runs ADD COLUMN
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  status VARCHAR (20) DEFAULT 'IN_PROGRESS'; -- IN_PROGRESS, COMPLETED, PAUSED
```

**test_executions** (M3, enhanced)
```sql
ALTER TABLE test_executions ADD COLUMNS
  actual_result TEXT,
  evidence_ids JSON, -- array of evidence IDs
  blocked_reason TEXT;
```

**evidence** (NEW, M4)
```sql
CREATE TABLE evidence (
  evidence_id UUID PRIMARY KEY,
  project_id UUID NOT NULL,
  execution_id UUID REFERENCES test_executions(execution_id),
  defect_id UUID REFERENCES defects(defect_id),
  filename VARCHAR(255),
  mime_type VARCHAR(50),
  size_bytes INT,
  r2_path VARCHAR(500),
  signed_url_expires_at TIMESTAMP,
  created_by UUID REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX (project_id), INDEX (execution_id), INDEX (defect_id)
);
```

**defects** (M3, enhanced with state machine)
```sql
ALTER TABLE defects ADD COLUMNS
  state VARCHAR(20) DEFAULT 'NEW', -- NEW, TRIAGED, IN_PROGRESS, READY_FOR_QA, VERIFIED, CLOSED, REOPENED
  assignee_id UUID REFERENCES users(user_id),
  component VARCHAR(100), -- from A4 Layer 2
  verified_at TIMESTAMP,
  closed_at TIMESTAMP;
```

**defect_history** (M3, enhanced)
```sql
CREATE TABLE defect_history (
  history_id UUID PRIMARY KEY,
  defect_id UUID REFERENCES defects(defect_id),
  old_state VARCHAR(20),
  new_state VARCHAR(20),
  actor_id UUID REFERENCES users(user_id),
  comment TEXT,
  timestamp TIMESTAMP DEFAULT NOW(),
  INDEX (defect_id)
);
```

**defect_comments** (NEW, M4)
```sql
CREATE TABLE defect_comments (
  comment_id UUID PRIMARY KEY,
  defect_id UUID REFERENCES defects(defect_id),
  author_id UUID REFERENCES users(user_id),
  content TEXT, -- markdown
  mentions JSON, -- array of user IDs @-mentioned
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP,
  INDEX (defect_id), INDEX (author_id)
);
```

**defect_rca** (NEW, M4)
```sql
CREATE TABLE defect_rca (
  rca_id UUID PRIMARY KEY,
  defect_id UUID REFERENCES defects(defect_id) UNIQUE,
  layer_1 TEXT, -- surface symptom
  layer_1_confidence FLOAT,
  layer_2 TEXT, -- component
  layer_2_confidence FLOAT,
  layer_3 TEXT, -- data/state
  layer_3_confidence FLOAT,
  layer_4 TEXT, -- dependency
  layer_4_confidence FLOAT,
  layer_5 TEXT, -- root cause + preventive
  layer_5_confidence FLOAT,
  generated_at TIMESTAMP DEFAULT NOW(),
  langfuse_trace_id VARCHAR(200),
  feedback JSON, -- { "layer_1": "correct" | "incorrect", ... }
  INDEX (defect_id)
);
```

**jira_links** (M3, enhanced)
```sql
CREATE TABLE jira_links (
  link_id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(project_id),
  defect_id UUID REFERENCES defects(defect_id),
  jira_issue_id VARCHAR(20), -- e.g., PROJ-456
  jira_issue_key VARCHAR(50),
  synced_at TIMESTAMP,
  sync_direction VARCHAR(20), -- NEXUS_TO_JIRA, JIRA_TO_NEXUS, BIDIRECTIONAL
  INDEX (project_id), INDEX (defect_id), UNIQUE (defect_id, jira_issue_id)
);
```

**jira_integrations** (M3, enhanced)
```sql
ALTER TABLE jira_integrations ADD COLUMNS
  oauth_token TEXT, -- encrypted
  oauth_token_expires_at TIMESTAMP,
  oauth_refresh_token TEXT, -- encrypted
  jira_project_key VARCHAR(20),
  status_mapping JSON, -- { "NEW": "Open", "VERIFIED": "Done", ... }
  last_sync_at TIMESTAMP;
```

**jira_webhook_events** (NEW, M4)
```sql
CREATE TABLE jira_webhook_events (
  event_id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(project_id),
  webhook_id VARCHAR(100),
  jira_issue_key VARCHAR(50),
  event_type VARCHAR(50), -- issue.updated, issue.created, etc.
  payload JSON,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP,
  result TEXT, -- success or error detail
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX (project_id), INDEX (processed)
);
```

**jira_sync_logs** (NEW, M4)
```sql
CREATE TABLE jira_sync_logs (
  log_id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(project_id),
  defect_id UUID REFERENCES defects(defect_id),
  jira_issue_key VARCHAR(50),
  direction VARCHAR(20), -- NEXUS_TO_JIRA, JIRA_TO_NEXUS
  action VARCHAR(50), -- create, update_status, update_assignee, sync_comment, etc.
  payload_hash VARCHAR(64),
  http_status_code INT,
  response_body TEXT,
  latency_ms INT,
  success BOOLEAN,
  error_message TEXT,
  retried BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX (project_id), INDEX (defect_id), INDEX (created_at)
);
```

---

## TESTING STRATEGY

### Unit Tests (Agile: TDD-driven)
- Defect state machine (invalid transitions rejected)
- RCA layer confidence scoring (edge cases: missing evidence)
- R2 signed URL generation + expiry validation
- Jira status mapping logic
- Comment markdown parsing

### Integration Tests
- Evidence upload → R2 → signed URL retrieval → HTTP GET (full flow)
- Defect creation → RCA job queued → result stored (async flow)
- Jira OAuth token exchange → token stored + refresh
- Jira webhook delivery → defect state updated
- 2-min poll fallback (webhook failure simulation)

### E2E Tests (Playwright)
1. **Execution Flow**: Author → Create Run → Execute Step → Capture Evidence → Create Defect → View RCA
2. **Jira Sync**: Create Defect in QA Nexus → Verify Issue in Jira → Update Status in Jira → Verify Update in QA Nexus
3. **Dashboard**: View Run Dashboard → Apply Filters → Verify Metrics Update (Real-Time)
4. **RCA Feedback**: View Defect RCA → Mark Layer as Incorrect → Verify Feedback Logged

### Performance Testing
- Dashboard latency (GET /api/dashboards/runs): p95 < 500ms for 100 active runs
- RCA job latency (L1–L5): p95 < 10s (with Ollama + Claude fallback)
- Jira issue creation latency: p95 < 5s (API + webhook registration)
- Evidence upload latency: p95 < 3s for 10MB file

### Golden Defects Corpus (M4)
- Curated 50 real defects from Iksula projects
- Each defect labeled with ground-truth root cause (Layer 5)
- A4 RCA evaluated: Layer 1–5 accuracy measured
- Human QA engineer reviews RCA output for top 50 defects
- Target: ≥75% Layer 5 accuracy

### Mocked Jira Sandbox
- Mock Jira REST API (responses + webhook events) using MSW
- OAuth token exchange mocked
- Test issue creation, status transition, comment sync
- No live Jira tenant required for CI/CD

---

## FEATURE FLAGS

| Flag Name | Feature | Default (M4) | Rollout Strategy | Kill Switch | Owner |
|-----------|---------|---|---|---|---|
| **ff_jira_2way_sync** | Jira bidirectional sync (create, update, comment, attachments) | OFF | Dark (Day 1) → Internal (Day 2) → Canary 5% (Day 3) → GA | Sync error rate > 5% for 5+ min; revert to one-way | Backend Lead |
| **ff_a4_rca_enabled** | Agent A4 5-layer RCA analysis on defect creation | OFF | Dark (Day 2) → Internal (Day 3) → Canary 5% (Day 4) → GA | RCA false-root-cause rate > 40% OR latency > 20s | AI Eng Lead |
| **ff_auto_evidence_capture** | Automatic screenshot/HAR/console capture on failure | OFF | Dark (Day 1) → Internal (Day 2) → GA | Storage errors > 2% or latency > 5s | Frontend Lead |
| **ff_webhook_receiver** | Jira webhook processor (real-time sync vs. 2-min poll fallback) | OFF | Dark (Day 2) → Internal (Day 3) → GA | Webhook delivery failures > 10% for 5+ min | Backend Lead |

**Rollout Process:**
1. New feature ships with flag **disabled**
2. Day 1–2: **Internal** rollout (Iksula team + 1–2 pilot projects)
3. Evaluation: Latency, errors, data consistency metrics
4. If pass: **Canary 5–10%**, then graduated to **GA** (100%)
5. If fail: Debug + fix, or **Rollback** (disable flag)

---

## RISKS & MITIGATIONS

### MS4-R001: Jira OAuth Token Expiry Handling

**Risk:** Token expires mid-sync, causing Jira API calls to fail silently.

**Probability:** Medium | **Impact:** High (sync loop breaks, data drift)

**Mitigation:**
- Automatic token refresh <1 min before expiry (cron job)
- Jira API error 401 → immediately refresh token
- jira_sync_logs logs all token refresh events
- Alert if 3+ consecutive token refresh failures

**Owner:** Backend (OAuth service)

---

### MS4-R002: Webhook Duplication & Idempotency

**Risk:** Jira webhook delivered twice → defect state updated twice → inconsistent history.

**Probability:** Medium | **Impact:** Medium (audit trail dirty, confusing to users)

**Mitigation:**
- Webhook deduplication: hash(event_id, timestamp, payload) → check jira_webhook_events before processing
- Idempotent defect updates: PATCH /api/defects treats same state transition as no-op
- Store webhook_id in jira_webhook_events for Jira webhook acknowledgment

**Owner:** Backend (webhook processor)

---

### MS4-R003: A4 False Root Causes Eroding Trust

**Risk:** RCA suggests incorrect root cause → engineer wastes time debugging wrong area → loses confidence in AI.

**Probability:** Medium | **Impact:** High (feature unusable, user churn)

**Mitigation:**
- Golden corpus evaluation: measure L5 accuracy before GA rollout (target ≥75%)
- Confidence scoring per-layer: low-confidence layers flagged as "needs human review"
- Feedback loop: user marks RCA as "Incorrect" → logged for retraining
- Langfuse traces all RCA invocations → weekly audit of top 20 outputs
- Fallback: if confidence < 50%, suppress RCA and show "Insufficient evidence" message

**Owner:** AI (A4 agent), QA (golden corpus evaluation)

---

### MS4-R004: R2 Signed URL Leak

**Risk:** Signed URL in error message / database log → attacker uses URL to access evidence.

**Probability:** Low | **Impact:** High (evidence exposure, privacy breach)

**Mitigation:**
- TTL validation: signed URLs expire within 7 days (minimal exposure window)
- Don't log full URLs: truncate after ? in logs (log only path, not token)
- Restricted R2 bucket policy: disallow public read, require signed URLs
- Daily rotation of R2 signing keys

**Owner:** DevOps (R2 bucket policy), Backend (URL handling)

---

### MS4-R005: Evidence Upload Large-File Timeout

**Risk:** User uploads 100MB HAR file → upload times out → evidence lost.

**Probability:** Low | **Impact:** Medium (manual re-capture needed)

**Mitigation:**
- Chunk-based upload: split files >50MB into 5MB chunks
- Resume capability: incomplete uploads can resume from last chunk
- Timeout: 5 min per chunk (adjustable)
- UI feedback: upload progress bar + ETA

**Owner:** Frontend (chunk upload), Backend (chunk assembly)

---

### MS4-R006: Jira Project Status Schema Drift

**Risk:** Customer reconfigures Jira status workflow → QA Nexus doesn't know the new status names → sync fails.

**Probability:** Medium | **Impact:** Medium (manual status mapping needed, 1-2 hour recovery)

**Mitigation:**
- Integration health widget: shows "Jira schema detected" vs. "Unknown status names"
- Manual mapping UI: admin can re-map statuses on settings page
- Fetch Jira project schema on OAuth callback (refresh annually)
- Webhook delivery monitoring: if status sync fails >3×, alert admin

**Owner:** Backend (schema validation), Frontend (mapping UI)

---

### MS4-R007: 2-Min Poll Fallback Overwhelms Jira API

**Risk:** 100 active defects, each polling Jira every 2 min = 50 API calls/min = quota exceeded.

**Probability:** Low | **Impact:** Medium (API quota exceeded, rate-limit errors)

**Mitigation:**
- Smart polling: only poll if webhook hasn't delivered in 5+ min
- Batch polling: fetch all linked issues in 1 API call (list issues by updated timestamp)
- Jira API quota monitoring: alert if usage > 80% of daily limit
- Backoff: if rate-limited, exponential backoff (max 10 min between polls)

**Owner:** Backend (polling scheduler)

---

## ROLLBACK PLAN

**Rollback Trigger:** Any of the following conditions met for >5 minutes:
1. Jira sync error rate > 5% (100+ consecutive failures)
2. A4 RCA latency p95 > 20s (agent hanging)
3. A4 false-root-cause rate > 40% (detected in real-time via user "Incorrect" feedback)
4. R2 signed URL leak detected (security incident)
5. Dashboard latency p95 > 2s (infrastructure issue)
6. Evidence upload failures > 10%

**Rollback Procedure (Target RTO: <10 min):**

1. **Kill Hatchet workers** (A4 + Jira sync jobs stop)
   ```bash
   kubectl scale deployment hatchet-worker --replicas=0
   ```

2. **Disable feature flags** (in Unleash):
   ```bash
   unleash disable jira.bidirectional_sync
   unleash disable ai.a4_rca_enabled
   unleash disable runs.live_dashboard
   ```

3. **Revert code** (if needed):
   ```bash
   git revert SHA_OF_COMMIT
   npm run build && npm run deploy
   ```

4. **Verify fallback behavior:**
   - Defect creation still works (local state machine)
   - Manual Jira integration (copy/paste issue key)
   - Dashboard shows static 15-min-old metrics
   - RCA tab shows "Analysis unavailable"

5. **Notify stakeholders** (Slack to #qa-nexus-incidents)
   ```
   ROLLBACK: Jira sync disabled (error rate 8%). Manual Jira linking available. ETA to fix: 2h.
   ```

6. **Post-Incident Review** (within 24 hours)
   - Root cause analysis
   - Code fix + testing
   - Re-enable feature flag gradually (Canary 1% → GA)

**Data Loss:** None. All defects remain in QA Nexus. Jira sync queues cleared; resume after fix.

---

## DELIVERABLES CHECKLIST

### Code & Documentation
- [ ] Execution UI component (React, TypeScript)
- [ ] Evidence upload service (R2 integration)
- [ ] Defect lifecycle state machine
- [ ] Defect detail modal (4 tabs)
- [ ] Run dashboard component + API
- [ ] A4 RCA LangGraph flow (5 layers)
- [ ] Jira OAuth 2.0 handler + token refresh
- [ ] Jira webhook receiver (Hatchet consumer)
- [ ] 2-min poll fallback scheduler
- [ ] User guide + screenshots
- [ ] API contract (OpenAPI 3.0 spec)
- [ ] Admin runbook (Jira setup, webhook debugging)

### Artifacts
- [ ] `Milestone_M4_Runs_Defects_Jira.md` (this document)
- [ ] `Milestone_M4_Runs_Defects_Jira.docx` (Word export)
- [ ] `Milestone_M4_workflow.drawio` (LucidChart + draw.io XML)
- [ ] `milestone_M4_charts/gantt.png` (task timeline)
- [ ] `milestone_M4_charts/risk_heatmap.png` (risk matrix)
- [ ] `milestone_M4_charts/defect_lifecycle.png` (state diagram)
- [ ] `milestone_M4_charts/jira_sync_events.png` (event flow)

### Test Coverage
- [ ] Unit tests (defect state machine, RCA confidence, R2 URL)
- [ ] Integration tests (execution → defect → RCA → Jira)
- [ ] E2E Playwright tests (full user flow: plan → run → defect → sync)
- [ ] Performance tests (dashboard <500ms, RCA <10s)
- [ ] Golden corpus evaluation (50 defects, ≥75% accuracy)
- [ ] Mocked Jira sandbox (OAuth, sync, webhook)

### Deployment
- [ ] Feature flags configured in Unleash
- [ ] Hatchet workers deployed (2 replicas, autoscaling)
- [ ] Database migrations applied (new tables, indexes)
- [ ] R2 bucket created + signed URL template
- [ ] Langfuse integration validated (keys provisioned, sampling configured)
- [ ] Jira OAuth app credentials registered

---

## NEXT MILESTONE PREVIEW (M5)

**M5 Scope (2026-07-27 → 2026-08-16, 3 weeks):**

### Not in M4 scope; deferred to M5:

**NOTE: Reporting deliverables (Daily, Weekly reports, simple dashboards) are owned by M5. Full reports (Sprint, Release, ROI) are owned by M6. M4 delivers only in-run execution visibility and defect triage.**

- **Reporting & Dashboards**: Templated reports (Daily, Weekly, Sprint, Release), Exec Dashboard (pass rate, defect density, ROI), ROI calculator
- **Advanced Features**: Command-K omnibox, global search indexing, audit log dashboard
- **Accessibility & Polish**: WCAG 2.2 AA audit + fixes, performance optimization (p95 latencies), E2E load testing
- **Pilot Launch**: Onboarding materials, pilot intake, success metrics tracking

### Why M5?
- M4 delivers the **core loop**: execute → log → analyze → sync
- M5 adds **business intelligence** (reports, ROI) + **accessibility** (WCAG) + **pilot readiness**
- Clear dependency chain: M4 data → M5 reporting

---

## GLOSSARY

| Term | Definition |
|------|-----------|
| **Agent A4** | 5-layer RCA engine; analyzes defect evidence to identify root cause |
| **Evidence** | Artifact captured during test execution (screenshot, log, HAR file, env snapshot) |
| **Jira OAuth 2.0 3-Legged** | Standard OAuth flow where user authenticates with Jira, grants QA Nexus access |
| **R2** | Cloudflare's S3-compatible object storage; used for evidence files |
| **Signed URL** | Time-limited HTTP URL with embedded authentication token; no bearer token needed |
| **Webhook** | HTTP POST callback registered with Jira; triggered when issue updated |
| **Langfuse** | Open-source LLM tracing tool; logs model calls, tokens, latency, cost |
| **Hatchet** | Task queue / job processor; handles async RCA + Jira sync jobs |
| **Defect Lifecycle** | State machine: New → Triaged → In Progress → Ready for QA → Verified → Closed (+ Reopened) |
| **RCA** | Root Cause Analysis; 5-layer drill-down to identify underlying problem |
| **TTL** | Time-to-Live; expiry window for signed URLs (7 days in M4) |

---

**Document Owner:** Iksula Services QA Nexus Team  
**Last Updated:** 2026-04-21  
**Status:** Ready for Milestone Planning & Sprint Execution  

