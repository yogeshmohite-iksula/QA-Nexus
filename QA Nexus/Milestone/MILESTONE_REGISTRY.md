# QA NEXUS — PROJECT-LEVEL MILESTONE REGISTRY (Shared Context Spine)

**Organization:** Iksula Services Pvt Ltd  
**Version:** 3.2 (Audit Wave 1 Remediation)  
**Date Created:** 2026-04-21  
**Date Restructured:** 2026-04-22  
**Status:** Ready for downstream phase agents (PM1–PM4, M0–M18, + 6 PM4 initiatives)  
**Audience:** All program leaders, phase leads, milestone developers; canonical source of truth for all project-level work.

---

## PROJECT STRUCTURE OVERVIEW (New)

**QA Nexus evolved from MVP-only (18 weeks, 7 milestones) to project-level hierarchical structure (18+ months, 4 project phases).**

- **PM1 (MVP)** — 21 cal-wk (18 build + 3 GA) (2026-04-27 → 2026-09-21) — Contains M0–M6 (unchanged)
- **PM2 (v1.5)** — 16 weeks (2026-09-22 → 2027-01-09) — Contains M7–M12 (new)
- **PM3 (v2)** — 12 weeks (2027-01-12 → 2027-04-03) — Contains M13–M18 (new)
- **PM4 (v2+)** — Ongoing (2027-04-06 onwards) — 6 initiatives, no sub-milestone numbering

**Total:** 19 named milestones (M0–M18) + 6 PM4 initiatives over ~18 months MVP→v2 GA, then ongoing.

This registry now serves as the canonical source for all 4 project phases. Sections 2–8 below retain MVP-only data; new sections 9–11 add project-level phase gates, AI agent continuity, and PM2/PM3/PM4 structure.

---

## TABLE OF CONTENTS

1. [Program Overview](#1-program-overview)
2. [Milestone Summary Table](#2-milestone-summary-table)
3. [DoR/DoD Chain (Critical)](#3-dordod-chain-critical)
4. [Tables by Milestone](#4-tables-by-milestone)
5. [Endpoints by Milestone](#5-endpoints-by-milestone)
6. [Components by Milestone](#6-components-by-milestone)
7. [Cross-Milestone Dependencies Graph](#7-cross-milestone-dependencies-graph)
8. [Feature Flag Registry](#8-feature-flag-registry)
9. [Risk Carry-Forward Register](#9-risk-carry-forward-register)
10. [Test Data Strategy per Milestone](#10-test-data-strategy-per-milestone)
11. [Integration Readiness per Milestone](#11-integration-readiness-per-milestone)
12. [Velocity + Staffing Assumptions](#12-velocity--staffing-assumptions)
13. [Rollback Plans Summary](#13-rollback-plans-summary)
14. [Reporting Scope Split (User-Mandated)](#14-reporting-scope-split-user-mandated)
15. [Traceability Matrix (PRD US-IDs → Milestones)](#15-traceability-matrix-prd-us-ids--milestones)
16. [Milestone IDs & Naming Convention](#16-milestone-ids--naming-convention)
17. [Shared Context Each Milestone Doc Must Reproduce](#17-shared-context-each-milestone-doc-must-reproduce)
18. [Handoff File Manifest per Milestone](#18-handoff-file-manifest-per-milestone)

---

## 1. PROGRAM OVERVIEW

QA Nexus is an AI-native operating system for the QA profession — a unified platform that collapses 8–10 fragmented tools (Jira, TestRail, Confluence, Excel, GitHub, Slack, Jenkins, email) into one workspace where QA teams plan, author, execute, triage, and report without context switching.

PM1 = **21 calendar weeks** spanning 7 sub-milestones (M0–M6). This is structured as **18 build weeks** (M0–M6 feature delivery) + **3 GA / hardening weeks** wrap within M6 before GA sign-off on 2026-09-21.

- **M0 (Weeks 1–2):** Setup & Infrastructure (2 weeks: 2026-04-27 → 2026-05-10)
- **M1 (Weeks 3–4):** Users & Roles (2 weeks: 2026-05-11 → 2026-05-24)
- **M2 (Weeks 5–7):** Test Documents & Knowledge Base (3 weeks: 2026-05-25 → 2026-06-14)
- **M3 (Weeks 8–10):** Test Cases & AI Generation (3 weeks: 2026-06-15 → 2026-07-05)
- **M4 (Weeks 11–13):** Test Runs, Defects & Jira (3 weeks: 2026-07-06 → 2026-07-26)
- **M5 (Weeks 14–16):** Automation + Basic Reports + MVP Launch (3 weeks: 2026-07-27 → 2026-08-16)
- **M6 (Weeks 17–21, post-MVP):** Full Reports + GA (5 weeks: 2026-08-17 → 2026-09-20; GA: 2026-09-21)

**Team:** Cross-functional (Backend eng, Frontend eng, AI eng, DevOps, QA, PM); 8–12 FTE.

---

## 2. MILESTONE SUMMARY TABLE

| Milestone | Name | Start Date | End Date | Duration (weeks) | Headline Scope | Primary Personas Unblocked | Exit Gate |
|-----------|------|-----------|---------|---|---|---|---|
| **M0** | Setup & Infrastructure | 2026-04-27 | 2026-05-10 | 2 | Oracle VM, Vercel, Postgres+pgvector, Redis, Ollama, SigNoz, Doppler, GitHub Actions CI/CD, BetterAuth scaffolding, base schemas, **Day-0 Workspace Bootstrap Seed Script** | All | "Hello, world" test: Create project → invite user → log in as QA → see empty dashboard; all systems healthy. **Bootstrap DoD:** seed script executed end-to-end producing a working initial Admin (Yogesh M., Admin RBAC, password NULL, invite_token populated), transactional bootstrap email delivered to configured address using F06b Mode A template, Admin clicks magic link → lands on F06b Mode A → sets password → routed to F07 Workspace-Founder Onboarding → completes 3-step wizard → lands on F09 Projects List with first project created, `first_login` flipped to false. Idempotent: re-running the seed on a populated DB does NOT create duplicate Admin or overwrite existing data. |
| **M1** | Users & Roles | 2026-05-11 | 2026-05-24 | 2 | BetterAuth full integration, 4-role RBAC (Admin/Lead/QA/Mgmt), org+user CRUD, RLS policies, audit log, invitations (Resend), API keys, profiles, project CRUD fully exposed | Jr/Sr QA, QA Lead | Create user → invite via email → accept → assign role → log in with correct access level; audit trail shows all actions |
| **M2** | Test Documents & Knowledge Base | 2026-05-25 | 2026-06-14 | 3 | KB CRUD + approval workflow, RAG pipeline (BGE-large embeddings + pgvector + Graphiti on Neo4j), 12 document templates (Strategy/Plan/RTM/Estimation/Daily/Weekly/Sprint/Release reports/Defect Report/RCA/Charter/Regression), A1 context-gathering agent, doc gen endpoint, TipTap-based authoring, PDF export, versioning + comments, section confidence scoring | Jr/Sr QA, QA Lead | Generate Test Plan from Jira PRD in ≤30s, with section confidence scoring visible; KB approved by Lead |
| **M3** | Test Cases & AI Generation | 2026-06-15 | 2026-07-05 | 3 | Test case CRUD (TipTap, BDD + traditional modes), A1 Test Case Generator (LangGraph, Clarification Questions gate, confidence badges), A2 Dedup (live chips while authoring, semantic similarity scoring), RTM linking, tags/priority, stability sparklines, bulk import (CSV/TestRail/Zephyr/Xray/qTest), case versioning + audit trail | Jr/Sr QA, QA Automation | Author 10 test cases with A1, A2 surfaces ≥1 true duplicate candidate, user can merge or dismiss; 80+ case library created |
| **M4** | Test Runs, Defects & Jira | 2026-07-06 | 2026-07-26 | 3 | Test Run CRUD, execution UI (one-row-per-case, quick-status), auto-evidence capture (screenshot+HAR+console+env snapshot at failure), A4 Defect Intelligence 5-layer RCA, Defect CRUD, Jira OAuth 2.0 (3-legged), webhook+2-min poll, 2-way status/assignee/comment sync, confidence scoring | Sr QA, QA Lead, Automation Engineer | Log defect from failing run, see A4 RCA output in <10s, push to Jira, see issue created, confirm 2-way sync working |
| **M5** | Automation + Basic Reports + MVP Launch | 2026-07-27 | 2026-08-16 | 3 | Playwright automation runner integration, basic reports (Daily/Weekly), simple Exec Dashboard (pass rate trend, defect count), Command-K omnibox, audit log finalization, WCAG 2.2 AA accessibility audit + critical fixes, E2E tests, load testing, 2–3 internal Iksula pilots | All | 2–3 internal Iksula pilots live, completing all 6 primary JTBDs without blockers, success metrics tracked |
| **M6** | Full Reports + GA | 2026-08-17 | 2026-09-20 | 5 | Full report suite (Sprint/Release/ROI calculator), advanced Exec Dashboard with all KPIs, advanced analytics, legal+compliance sign-off (GDPR, SOC 2), security audit (pen testing), marketing site, sales enablement, support playbooks, on-call runbooks, GA launch | Business, Operations | GA launch 2026-09-21 with legal sign-off, security audit passed, support infrastructure live |

---

## 3. DoR/DoD CHAIN (CRITICAL)

### M0 ↔ M1 Boundary

**M0 Definition of Done (Exit Criteria):**
1. BetterAuth authentication system live (email/password registration, login, logout, password reset)
2. 4-role RBAC schema created (Admin, Lead, QA, Mgmt) with profile attributes (Jr/Sr/Automation)
3. Projects CRUD scaffolding complete (create, read, update, switch, archive endpoints ready)
4. PostgreSQL 15 + pgvector extension initialized on Oracle VM
5. Postgres + Redis + Ollama containers running with auto-restart health probes
6. Vercel + Oracle VM deployment pipeline configured (auto-deploy on main, smoke tests)
7. GitHub Actions CI/CD pipeline for linting, tests, type checking
8. SigNoz + GlitchTip + Langfuse containers running
9. Doppler + GitHub Secrets environment setup (dev/staging/prod)
10. Audit log schema created; user actions logged (login, project switch, user invite)

**M1 Definition of Ready (Entry Criteria):**
1. Authentication system working (users can register, log in, access projects)
2. Projects created and users assigned to projects
3. RBAC guards functioning (role-based access control enforced)
4. Postgres + pgvector available (migrations applied)
5. Ollama health check passing (Gemma 4 model downloaded)
6. Resend email service configured for invites
7. Confluence API access configured (for PRD ingestion in doc gen)
8. Claude API keys provisioned (for A1/A2/A4 agents)

### M1 ↔ M2 Boundary

**M1 Definition of Done (Exit Criteria):**
1. BetterAuth fully integrated (registration, login, password reset, session management working)
2. 4-role RBAC fully functional (role assignment, RLS policies, access guards enforced)
3. User CRUD complete (create, read, update, deactivate users)
4. Project CRUD fully exposed (users can self-serve project creation and invitations)
5. Org structure in place (multi-org support foundation, RLS by organization)
6. API keys system working (users can generate, revoke API keys)
7. User profiles complete (Jr/Sr/Automation attributes editable)
8. Invitations via Resend working (email delivery, accept links, role assignment at accept)
9. Audit log complete (login, project switch, user invite, role assignment all logged)

**M2 Definition of Ready (Entry Criteria):**
1. User auth proven (test user can log in, see project, fail to access other org)
2. Invitations working (test user receives email, accepts, lands in project with correct role)
3. RBAC guards functioning (QA can create cases, Lead can approve, Admin can manage roles)
4. DB schema ready (TB-010, TB-011 for KB and docs)
5. Ollama + LangGraph online and responsive
6. Confluence API tested (can fetch PRD text for doc gen context)
7. Claude API quota verified (for A1 doc gen agent)

### M2 ↔ M3 Boundary

**M2 Definition of Done (Exit Criteria):**
1. Knowledge Base CRUD complete (create, read, update, delete, approve entries)
2. RAG pipeline live (BGE-large embeddings indexed in pgvector, retrieval working)
3. 12 document templates loaded (Test Strategy, Plan, RTM, Estimation, Daily/Weekly/Sprint/Release reports, Defect Report, RCA, Charter, Regression outline)
4. Document generation endpoint (EP-023) working (async via Hatchet)
5. PDF export functional
6. Versioning + comments implemented
7. A1 context-gathering agent operational (reads KB, formats context)
8. Section confidence scoring visible on generated docs
9. Document approval workflow functional
10. TipTap editor foundation in place for case authoring (to come in M3)

**M3 Definition of Ready (Entry Criteria):**
1. Knowledge Base populated with at least 2 seed documents (read by agents)
2. Document generation proven working (≤30s generation time validated)
3. RAG pipeline returning relevant context
4. Ollama + LangGraph online and responsive
5. Project + user data from M0–M1 available
6. Test case DB schema ready (TB-005: test_cases, test_steps, case_tags)

### M3 ↔ M4 Boundary

**M3 Definition of Done (Exit Criteria):**
1. Test case CRUD complete (create, read, update, delete, bulk import)
2. TipTap editor functional (block-based, BDD + traditional modes)
3. A1 Test Case Generator live (generates ≥10 test cases per invocation)
4. A1 Clarification Questions gate working (pauses gen, asks 2–3 clarification questions before proceeding)
5. A2 Dedup operational (live chips while authoring, semantic similarity scoring)
6. Requirement linking (RTM) functional
7. Tags + priority + stability sparklines working
8. Test case bulk import (CSV, TestRail, Zephyr, Xray, qTest) working
9. Test case versioning + audit trail in place
10. ≥80 test cases seeded for M4 validation

**M4 Definition of Ready (Entry Criteria):**
1. Test case library seeded with at least 80 cases (for M4 test runs)
2. A1 + A2 agents proven (≥80% auto-approval rate measured in M3)
3. Ollama model loaded + performant
4. Test execution DB schema ready (TB-006: test_runs, test_results, evidence_files)
5. Defect DB schema ready (TB-007: defects, defect_categories)
6. Jira integration DB schema ready (TB-008: jira_integrations, jira_sync_logs)
7. Jira OAuth 2.0 credentials provisioned (Jira tenant identified)

### M4 ↔ M5 Boundary

**M4 Definition of Done (Exit Criteria):**
1. Test Run CRUD complete (create run, assign cases, manage environments)
2. Execution UI functional (one-row-per-case view, quick-status buttons, step detail panel)
3. Auto-evidence capture live (screenshot + HAR + console logs + env snapshot at failure)
4. A4 Defect Intelligence 5-layer RCA working (stack → env → config → code → data)
5. Defect CRUD complete (create from run, categorize, add steps/attachments)
6. Jira OAuth 2.0 token flow working (3-legged flow, token refresh)
7. Jira 2-way sync operational (create defect in QA Nexus → issue created in Jira)
8. Jira webhook receiver + 2-min poll fallback live
9. Status/assignee/comment mirroring working both ways
10. A4 confidence scoring visible on RCA output
11. ≥100 test runs with results created; ≥50 defects logged

**M5 Definition of Ready (Entry Criteria):**
1. Test execution data stable (≥100 test runs, ≥50 defects created)
2. Jira project configured + 2-way sync validated
3. A4 agent proven (≥75% top-layer accuracy measured)
4. Report DB schema ready (TB-011: reports, report_templates)
5. Automation runner integration schema ready
6. Basic dashboard design finalized (screens mocked, PM approved)
7. Pilot deployment infrastructure ready (staging environment with test data)

### M5 ↔ M6 Boundary

**M5 Definition of Done (Exit Criteria):**
1. Playwright automation runner integration complete
2. Basic report generation complete (Daily, Weekly auto-populated)
3. Personal dashboard working (my cases, bugs, approvals, reports due)
4. Simple Exec Dashboard live (pass rate trend, defect count, basic RAG)
5. Command-K omnibox implemented (⌘K / Ctrl+K search + nav + agent invocation)
6. Global search indexing live (cases, defects, docs, KB entries)
7. Audit log complete (user, action, timestamp, confidence logged for all agent actions)
8. WCAG 2.2 AA compliance audit completed (≥80% critical/major fixes)
9. E2E tests passing (Playwright, 3 critical journeys: Auth, Test Case, Defect)
10. Load testing done (simulated 3 concurrent pilots, <2% error rate)
11. Pilot onboarding docs + training materials complete
12. 2–3 internal Iksula pilots live + baseline metrics collected

**M6 Definition of Ready (Entry Criteria):**
1. MVP features stable for ≥1 week (no critical bugs)
2. Pilot deployments complete (2–3 internal Iksula projects live)
3. Pilot telemetry flowing (success metrics tracked)
4. Documentation complete (admin guide, user guide, API docs)
5. On-call runbook ready (Gemma offline, pgvector full, Oracle VM failure scenarios)
6. Legal + compliance checklist ready (privacy policy, ToS, GDPR, SOC 2 roadmap)

---

## 4. TABLES BY MILESTONE

Every table first deployed in exactly ONE milestone. Future milestones reference existing tables but do not create new ones (only add columns via migrations).

| TB-ID | Table Name | Owning Milestone | Rationale |
|-------|-----------|---|---|
| **TB-001** | organizations | M0 | Multi-tenant isolation; created at org setup |
| **TB-002** | users, user_profiles | M0 | User registration + auth, profile attributes (Jr/Sr/Automation) |
| **TB-003** | role_assignments | M0 | 4-role RBAC (Admin, Lead, QA, Mgmt) |
| **TB-004** | projects, project_environments | M0 | Project workspace CRUD; environment list per project |
| **TB-005** | test_cases, test_steps, case_requirements, case_tags | M3 | Test case storage; linked to requirements (RTM) |
| **TB-006** | test_runs, test_results, evidence_files | M4 | Test execution history; evidence storage (screenshots, HAR, logs) |
| **TB-007** | defects, defect_categories, defect_metadata | M4 | Defect storage; 4-category classification (App/Test/Flaky/Env) |
| **TB-008** | jira_integrations, jira_sync_logs, jira_project_mappings | M4 | Jira OAuth, project key mappings, sync state |
| **TB-009** | knowledge_base_entries, kb_approvals, kb_metadata | M2 | KB storage; versioning + approval workflow |
| **TB-010** | documents, document_templates, document_sections, document_versions | M2 | Document generation artifacts; versioning + comments |
| **TB-011** | reports, report_templates, report_schedules | M5 | Templated report storage; scheduled delivery |
| **TB-012** | feature_flags, flag_rollout_history | M0 | Feature flag state; rollout tracking (canary, percentage) |
| **TB-013** | audit_events | M0 | Audit trail for all user + agent actions (EU AI Act compliance) |
| **TB-014** | session_context, session_cache | M0 | Session storage (BetterAuth sessions); request context cache |
| **TB-015** | integrations_health, integration_status_snapshots | M4 | Jira/GitHub/Slack/Confluence health state; last sync timestamp |
| **TB-016** | test_evidence_metadata | M4 | HAR, console log, environment snapshot metadata |
| **TB-017** | user_preferences, user_settings | M1 | Theme, keyboard shortcuts, notifications, timezone |
| **TB-018** | defect_duplicates, defect_semantic_links | M4 | A4 RCA dedup results; semantic similarity links |

---

## 5. ENDPOINTS BY MILESTONE

Every endpoint first shipped in exactly ONE milestone. Future milestones reference but do not redefine.

| EP-ID | Path | Method | Purpose | Owning Milestone | Shipped As |
|-------|------|--------|---------|---|---|
| **EP-001** | /api/auth/register | POST | User registration (email, password) | M0 | New |
| **EP-002** | /api/auth/login | POST | User login, session creation | M0 | New |
| **EP-003** | /api/auth/logout | POST | Session termination | M0 | New |
| **EP-004** | /api/auth/forgot-password | POST | Password reset flow | M0 | New |
| **EP-005** | /api/auth/reset-password | POST | Reset password with token | M0 | New |
| **EP-006** | /api/auth/me | GET | Logged-in user profile | M0 | New |
| **EP-007** | /api/projects | GET | List projects for org | M0 | New |
| **EP-008** | /api/projects | POST | Create project | M0 | New |
| **EP-009** | /api/projects/:id | GET | Project details | M0 | New |
| **EP-010** | /api/projects/:id | PATCH | Update project | M0 | New |
| **EP-011** | /api/projects/:id/archive | POST | Archive project | M0 | New |
| **EP-012** | /api/projects/:id/users | GET | List project members | M0 | New |
| **EP-013** | /api/projects/:id/users | POST | Add user to project | M0 | New |
| **EP-014** | /api/projects/:id/environments | GET | List environments | M0 | New |
| **EP-015** | /api/projects/:id/environments | POST | Create environment | M0 | New |
| **EP-016** | /api/roles | GET | List roles (RBAC) | M0 | New |
| **EP-017** | /api/users/:id/roles | POST | Assign role to user | M0 | New |
| **EP-018** | /api/users | GET | List users (org scope) | M1 | New |
| **EP-019** | /api/users | POST | Create user (Admin) | M1 | New |
| **EP-020** | /api/users/:id | PATCH | Update user profile | M1 | New |
| **EP-021** | /api/users/:id/invite | POST | Send invitation email | M1 | New |
| **EP-022** | /api/users/:id/api-keys | GET | List API keys | M1 | New |
| **EP-023** | /api/users/:id/api-keys | POST | Generate new API key | M1 | New |
| **EP-024** | /api/kb | GET | List KB entries | M2 | New |
| **EP-025** | /api/kb | POST | Create KB entry | M2 | New |
| **EP-026** | /api/kb/:id | GET | KB entry details | M2 | New |
| **EP-027** | /api/kb/:id | PATCH | Update KB entry | M2 | New |
| **EP-028** | /api/kb/:id/approve | POST | Approve KB entry (Lead) | M2 | New |
| **EP-029** | /api/documents/generate | POST | Generate document (async, via Hatchet) | M2 | New |
| **EP-030** | /api/documents/generate/:job_id | GET | Poll document generation status | M2 | New |
| **EP-031** | /api/documents | GET | List documents for project | M2 | New |
| **EP-032** | /api/documents/:id | GET | Document details + content | M2 | New |
| **EP-033** | /api/documents/:id/export | GET | Export document as PDF | M2 | New |
| **EP-034** | /api/documents/:id/comments | POST | Add comment to document | M2 | New |
| **EP-035** | /api/test-cases | GET | List test cases | M3 | New |
| **EP-036** | /api/test-cases | POST | Create test case | M3 | New |
| **EP-037** | /api/test-cases/:id | GET | Test case details + steps | M3 | New |
| **EP-038** | /api/test-cases/:id | PATCH | Update test case | M3 | New |
| **EP-039** | /api/test-cases/bulk-import | POST | Bulk import (CSV, TestRail, etc.) | M3 | New |
| **EP-040** | /api/test-cases/:id/dedup-check | POST | A2 dedup (live while authoring) | M3 | New |
| **EP-041** | /api/test-runs | GET | List test runs | M4 | New |
| **EP-042** | /api/test-runs | POST | Create test run | M4 | New |
| **EP-043** | /api/test-runs/:id | GET | Test run details + results | M4 | New |
| **EP-044** | /api/test-runs/:id/results | PATCH | Update test result (pass/fail) | M4 | New |
| **EP-045** | /api/test-runs/:id/evidence | POST | Upload evidence (screenshot, HAR, logs) | M4 | New |
| **EP-046** | /api/defects | GET | List defects | M4 | New |
| **EP-047** | /api/defects | POST | Create defect | M4 | New |
| **EP-048** | /api/defects/:id | GET | Defect details + RCA | M4 | New |
| **EP-049** | /api/defects/:id | PATCH | Update defect | M4 | New |
| **EP-050** | /api/defects/:id/jira-push | POST | Push defect to Jira | M4 | New |
| **EP-051** | /api/defects/:id/rca | GET | Fetch A4 5-layer RCA (cached) | M4 | New |
| **EP-052** | /api/integrations/jira/oauth | GET | Jira OAuth 2.0 flow (3-legged) | M4 | New |
| **EP-053** | /api/integrations/jira/callback | POST | Jira OAuth callback (redirect URI) | M4 | New |
| **EP-054** | /api/integrations/jira/webhook | POST | Jira webhook receiver (status sync) | M4 | New |
| **EP-055** | /api/reports/daily | POST | Generate daily report | M5 | New |
| **EP-056** | /api/reports/weekly | POST | Generate weekly report | M5 | New |
| **EP-057** | /api/dashboards/personal | GET | Personal dashboard (my cases, bugs, reports) | M5 | New |
| **EP-058** | /api/dashboards/exec | GET | Exec Dashboard (pass rate, defect count, basic RAG) | M5 | New |
| **EP-059** | /api/search | GET | Global search (cases, defects, docs, KB) | M5 | New |
| **EP-060** | /api/command-k | GET | Command palette (search + nav + agent invocation) | M5 | New |
| **EP-061** | /api/audit-log | GET | Audit trail (filtered by user, action, resource) | M5 | New |
| **EP-062** | /api/feature-flags | GET | List feature flags + state | M5 | New |
| **EP-063** | /api/integrations/health | GET | Jira/GitHub/Slack/Confluence health status | M4 | New |
| **EP-064** | /api/reports/sprint | POST | Generate sprint report | M6 | New |
| **EP-065** | /api/reports/release | POST | Generate release readiness report | M6 | New |
| **EP-066** | /api/roi-calculator | POST | Calculate ROI for project | M6 | New |

---

## 6. COMPONENTS BY MILESTONE

Every component first delivered in exactly ONE milestone. Future milestones reference but do not rewrite.

| CO-ID | Component Name | Type | Purpose | Owning Milestone | Shipped As |
|-------|---|---|---|---|---|
| **CO-001** | Next.js Frontend App | Frontend | Landing, auth, project selection, main app shell | M0 → M6 | Incremental (shell M0, screens added each milestone) |
| **CO-002** | NestJS API Gateway | Backend service | HTTP routing, middleware, request validation, rate limiting | M0 | New |
| **CO-003** | BetterAuth Service | Auth service | Email/password registration, login, session management, password reset | M0 | New |
| **CO-004** | RBAC Guard | Authorization middleware | Enforce role-based access control (Admin, Lead, QA, Mgmt) | M0 | New |
| **CO-005** | Audit Logger | Logging service | Log all user actions + agent actions with timestamp, actor, resource, outcome | M0 | New |
| **CO-006** | Project Service | Business logic | Project CRUD, environment management, project-scoped isolation | M0 | New |
| **CO-007** | User Service | Business logic | User CRUD, role assignment, API key generation, profile management | M1 | New |
| **CO-008** | Knowledge Base Service | Business logic | KB entry CRUD, approval workflow, semantic search (RAG) | M2 | New |
| **CO-009** | Document Service | Business logic | Document CRUD, template management, versioning, comments | M2 | New |
| **CO-010** | Test Case Service | Business logic | Test case CRUD, bulk import, RTM linking, versioning | M3 | New |
| **CO-011** | Test Execution Service | Business logic | Test run CRUD, result tracking, evidence management | M4 | New |
| **CO-012** | Defect Service | Business logic | Defect CRUD, categorization, status tracking, semantic dedup links | M4 | New |
| **CO-013** | Report Service | Business logic | Report generation (Daily, Weekly, Sprint, Release), ROI calculation | M5 | New |
| **CO-014** | Search Service | Business logic | Global search indexing + retrieval (cases, defects, docs, KB) | M5 | New |
| **CO-015** | Integration Hub — Jira | Integration | OAuth 2.0 token management, webhook receiver, 2-way sync (status, assignee, comments) | M4 | New |
| **CO-016** | Integration Hub — GitHub/GitLab | Integration | CI webhook receiver (push, PR events), test result ingestion (JUnit XML) | M4 | New |
| **CO-017** | Integration Hub — Slack | Integration | Webhook sender (defect notifications, approval alerts) | M4 | New |
| **CO-018** | Integration Hub — Confluence | Integration | Read PRDs for doc gen context; write reports as Confluence pages | M2 | New |
| **CO-019** | FastAPI Inference Server | Inference engine | Host Ollama client, LangGraph orchestrator, A1/A2/A4 agent execution | M2 | New |
| **CO-020** | LangGraph Agent Orchestrator | Agent framework | A1 Test Case Gen, A2 Dedup, A4 RCA; with HITL gates, branching logic, audit replay | M2 | New |
| **CO-021** | Ollama Gemma 4 | LLM runtime | Local Gemma 4 26B MoE inference (on Oracle VM), health probes, fallback to Gemini 2.5 Flash | M0 | New |
| **CO-022** | BGE Embeddings Service | Embeddings | BGE-large-en embeddings; called by RAG pipeline + A2 dedup | M2 | New |
| **CO-023** | Hatchet Job Queue | Job orchestration | Async job runner for document gen, A1 case gen, report generation | M2 | New |
| **CO-024** | PostgreSQL 15 | Database | Primary OLTP database, with pgvector extension | M0 | New |
| **CO-025** | Redis 7 | Cache/Pub-Sub | Session cache, query result cache, pub-sub for real-time updates | M0 | New |
| **CO-026** | pgvector Index | Vector database | Embedded in PostgreSQL; stores embeddings for KB entries, test cases, defects | M2 | New |
| **CO-027** | Cloudflare R2 | Object storage | Evidence storage (screenshots, HAR files, logs); backup destination (pg_dump) | M4 | New |
| **CO-028** | Langfuse | LLM observability | Log all LLM calls (A1, A2, A4), track cost, evals, hallucination detection | M2 | New |
| **CO-029** | SigNoz | APM / Observability | Application performance monitoring, distributed tracing, custom dashboards | M0 | New |
| **CO-030** | GlitchTip | Error tracking | Sentry-compatible error tracking, alert rules, incident grouping | M0 | New |
| **CO-031** | Unleash | Feature flags | Feature flag server (dark launch, canary, percentage rollouts) | M0 | New |

---

## 7. CROSS-MILESTONE DEPENDENCIES GRAPH

Milestones consume outputs beyond their direct DoR predecessors. This matrix shows shared infrastructure and cross-layer dependencies.

| Consuming Milestone | Depends On | Producer | Output | Impact |
|---|---|---|---|---|
| M1 | M0 auth | M0 | Logged-in user context, role assignments | Every user action must know current user role (access control) |
| M1 | M0 audit | M0 | Audit events table + logger | User profile changes logged |
| M2 | M0 auth | M0 | User context, role context | Doc gen must know current user role (access control) |
| M2 | M0 observability | M0 | SigNoz + Langfuse running | A1 agent metrics captured |
| M2 | M1 users | M1 | User roles, profiles fully accessible | Doc gen reads user context for personalization |
| M3 | M0 auth | M0 | User context, role context | Test case creation gated by Lead approval |
| M3 | M1 users | M1 | User roles, audit trail | Test case actions logged per user |
| M3 | M2 KB | M2 | Knowledge Base entries seeded | A1 uses KB context to generate cases; A2 matches against KB cases |
| M3 | M2 RAG | M2 | pgvector index, embeddings service | A2 uses semantic similarity for dedup |
| M4 | M0 audit log | M0 | Audit events table + logger | All defect + Jira sync actions logged |
| M4 | M1 users | M1 | User roles, profiles | Defect creation gated by role; Jira sync assigns to users |
| M4 | M2 RAG | M2 | pgvector index, embeddings service | A4 RCA searches vector DB for similar past defects (semantic dedup) |
| M4 | M3 test cases | M3 | Test case library | Test runs reference test cases; A4 RCA context includes case steps |
| M5 | M0–M4 search | All | All data objects | Command-K indexes all cases, defects, docs, KB entries |
| M5 | M0–M4 audit | All | All audit events | Command-K includes audit log search |
| M5 | M4 test runs | M4 | Test execution history | Report gen queries test_runs + test_results tables |
| M5 | M4 defects | M4 | Defect history | Report gen queries defects table |
| M6 | M0–M5 all | All | Stable product | GA readiness validated via pilot data |

**Shared Infra (Available M0+):**
- PostgreSQL + pgvector (all milestones use)
- Redis cache (session, query results)
- Ollama Gemma 4 (M0+)
- SigNoz observability (M0+)
- Langfuse LLM observability (M2+)
- Unleash feature flags (M0+)

---

## 8. FEATURE FLAG REGISTRY

Every feature needs a flag for safe rollout (dark launch → internal → canary → GA).

| Flag Name | Feature | Owning Milestone | Default (MVP) | Rollout Pattern | Kill-Switch Command | Expiry Date (30d post-GA) |
|-----------|---------|---|---|---|---|---|
| **feature_ai_a1_doc_gen** | A1 Document Generator | M2 | **disabled** | Dark → Internal (w5) → Canary 5% (w7) → GA | `unleash disable feature_ai_a1_doc_gen` | 2026-10-21 |
| **feature_ai_a1_case_gen** | A1 Test Case Generator | M3 | **disabled** | Dark → Internal (w8) → Canary 5% (w10) → GA | `unleash disable feature_ai_a1_case_gen` | 2026-10-21 |
| **feature_ai_a2_dedup** | A2 Dedup live chips | M3 | **disabled** | Dark → Canary 1% (w9) → GA | `unleash disable feature_ai_a2_dedup` | 2026-10-21 |
| **feature_ai_a4_rca** | A4 5-layer RCA | M4 | **disabled** | Dark → Internal (w11) → Canary (w12) → GA | `unleash disable feature_ai_a4_rca` | 2026-10-21 |
| **feature_jira_2way_sync** | Jira 2-way sync | M4 | **disabled** | Dark → Internal (w11) → Canary (w13) → GA | `unleash disable feature_jira_2way_sync` | 2026-10-21 |
| **feature_basic_reports** | Daily/Weekly reports | M5 | **disabled** | Dark → Internal → GA (w16) | `unleash disable feature_basic_reports` | 2026-10-21 |
| **feature_command_k_omnibox** | Command-K global search | M5 | **disabled** | Dark → Internal → GA (w16) | `unleash disable feature_command_k_omnibox` | 2026-10-21 |
| **feature_wcag_accessibility** | WCAG 2.2 AA compliance | M5 | **disabled** | Dark → GA (w16, tied to Command-K) | (non-fatal, always ship) | 2026-10-21 |
| **feature_full_reports** | Sprint/Release/ROI reports | M6 | **disabled** | Dark → Canary → GA (post-MVP) | `unleash disable feature_full_reports` | 2026-10-20 |

---

## 9. RISK CARRY-FORWARD REGISTER

Risks that span multiple milestones (not resolved inside a single milestone).

| R-ID | Description | Milestones Affected | Owner | Mitigation Status |
|------|---|---|---|---|
| **R-001** | AI generation quality <80% auto-approval rate | M2, M3, M4, M5 | Eng (AI) | Clarification Questions gate before gen; KB conditioning; start with 12 narrow templates; human review fallback tracked; weekly human audit of top 20 outputs |
| **R-002** | Gemma 4 self-host ops burden / single-point-of-failure | M0, M1, M2, M3, M4, M5, M6 | Eng (DevOps) | Ollama auto-restart + health probes; automatic fallback to Gemini 2.5 Flash free tier (1.5K req/day); Hetzner $7.40/mo warm standby documented; weekly model snapshot to R2 |
| **R-003** | Oracle Always Free tenancy reclaim (idle-policy) | M0, M1, M2, M3, M4, M5, M6 | Eng (DevOps) | Synthetic heartbeat job (every 15 min) + uptime monitor; migration runbook to Hetzner <2h; auto-backup to R2 daily |
| **R-004** | Jira schema drift across customers | M4, M5, M6 | Eng (Backend) | Per-project status_map_json; integration health widget; manual mapping UI; webhook delivery monitoring |
| **R-005** | Scope creep into PM-tool territory | M0–M6 (any) | PM | Explicit "out of scope" list enforced in intake; roadmap signed by Lead before each phase; feature request triage process |
| **R-006** | 18-week MVP overrun (+ 5-week GA prep) | M0–M6 | Eng Lead + PM | P0–P5 have exit gates (not dates); phase may extend but no phase ships without gate pass; bi-weekly pulse checks |
| **R-007** | pgvector scale ceiling (~5M vectors) | M2, M3, M4, M5, M6 | Eng (AI) | Abstracted VectorStore interface in FastAPI; pre-test Qdrant OSS migration path; scale to Hetzner at 8 pilots |
| **R-008** | A4 RCA accuracy <60% (confidence scoring miscalibrated) | M4, M5, M6 | Eng (AI) | Weekly human audit of top 20 RCAs; retrain Ollama prompt if drift detected; Langfuse evals dashboard |
| **R-009** | Jira webhook delivery failures | M4, M5, M6 | Eng (Backend) | 2-min poll fallback; webhook delivery monitoring + alerts; manual remediation runbook |

---

## 10. TEST DATA STRATEGY PER MILESTONE

Every milestone needs fresh, realistic test data to validate features at scale.

| Milestone | Seed Data | Generation Method | Propagation | Teardown |
|-----------|-----------|---|---|---|
| **M0** | 3 orgs, 10 users, 5 projects, 10 roles | Manual (admin script) + fixtures | Persisted to staging DB (backup to R2) | Snapshot saved for M1 |
| **M1** | User profiles (10 users with Jr/Sr/Automation), API keys (5 keys) | Fixtures (seed_users.sql) | User data versioned, API keys rotated per environment | Carried to M2 |
| **M2** | KB entries (30), documents (12 templates × 1 each) | Fixtures (seed_kb.sql) + doc gen samples | KB versioning tested, doc history preserved | Carried to M3 |
| **M3** | Test cases (80 cases from 5 projects, BDD + traditional, tagged, prioritized) | Bulk import (CSV fixtures) + A1-generated | Dedup algorithm trained on 80-case corpus | Expanded to 100 cases for M4 |
| **M4** | Test runs (100 runs, 1000 results), defects (50 defects, categorized), evidence (screenshots, HAR, logs for 20 failures) | Playwright runner (mock test suite) + manual evidence capture | Jira sync tested both directions; RCA trained on 50-defect corpus | Expanded to 200 defects for M5 |
| **M5** | Full 3-pilot dataset (≥100 cases per project, ≥500 results, ≥100 defects) | Anonymized snapshot from Iksula projects OR synthetic (factories) | Global search indexed; audit log complete; reports generated | Frozen at MVP lock for GA data |
| **M6** | Production-like data, compliance test data, ROI scenario data | Snapshot from M5 + additional edge cases | Historical data for reporting, ROI calculations validated | Snapshot exported for GA launch |

**Test Data Factories (via Hatchet jobs):**
- `create_test_case(count, project_id, bdd_ratio, tag_list)`
- `create_test_run(count, project_id, cases_per_run, pass_rate)`
- `create_defect(count, test_run_id, category, assign_random_user)`
- `create_evidence_batch(defect_id, screenshot, har, console, env)`
- `seed_kb_entries(kb_content.json)`

**Backup Strategy:**
- Daily pg_dump → Cloudflare R2 (retention: 30 days)
- Snapshot at each milestone exit → labeled (M0-final, M1-final, etc.)

---

## 11. INTEGRATION READINESS PER MILESTONE

Which external integrations must be live at the START of each milestone.

| Milestone | Must-Have Integrations | Status Check Method |
|-----------|---|---|
| **M0** | None (internal only) | N/A |
| **M1** | Resend email (for user invites) | Resend API key in Doppler; test invite email sent |
| **M2** | Resend email, Claude API (for A1 doc gen), Ollama (Gemma 4 downloaded), Confluence API | Health checks in SigNoz; Langfuse dashboard accessible |
| **M3** | Ollama, Claude API, Langfuse, Confluence API, BGE embeddings | Ollama model loaded; embeddings service responds in <100ms |
| **M4** | Jira Cloud (OAuth app configured), GitHub/GitLab (webhook configured), Ollama, Claude, Langfuse, Cloudflare R2 | Jira OAuth login test; GitHub webhook test (push event); R2 upload/download test |
| **M5** | All integrations from M1–M4 (stable), Playwright test runner | Daily integration health check (SigNoz dashboard); Playwright env ready |
| **M6** | All integrations + monitoring (Datadog, PagerDuty, Sentry) | Monitoring dashboards live; incident response runbook ready |

**Integration Health Checks (automated, daily):**
```
POST /api/integrations/health
→ { "jira": "connected", "github": "connected", "slack": "connected", "confluence": "connected", "ollama": "healthy", "r2": "healthy", ... }
```

---

## 12. VELOCITY + STAFFING ASSUMPTIONS

**Team Composition (Target):**
- Backend engineering: 2 FTE (NestJS API Gateway, Services, Jira integration)
- Frontend engineering: 2 FTE (Next.js UI, responsive design, accessibility)
- AI engineering: 1 FTE (LangGraph, Ollama, A1/A2/A4 prompt tuning)
- DevOps/Infrastructure: 1 FTE (Oracle VM, Docker, CI/CD, observability)
- QA/Testing: 1 FTE (E2E tests, pilot support)
- Product management: 0.5 FTE (roadmap, spec, pilot coordination)
- **Total: ~8 FTE minimum**

**Velocity Buffer:**
- Per Milestone_Skill.md: 20% buffer reserved for unplanned work (bugs, spikes, context switches)
- Example: If a milestone has 40 story points of planned work, assume 32 points get done; 8 reserved for chaos.

**PTO & Known Blockers:**
- M0: No major holidays
- M1: No major holidays (spring)
- M2: No major holidays (late spring)
- M3: Summer break (assume 10% team capacity loss during mid-June to July)
- M4: Post-summer ramp-up (normal capacity)
- M5: No major holidays (late summer, pre-September)
- M6: Q4 holidays (plan accordingly; GA buffer added for stability)

**Estimated Story Points per Milestone:**
- M0: 40 points (infrastructure is dense)
- M1: 25 points (user management, profiles, API keys)
- M2: 35 points (KB + doc gen + RAG is complex)
- M3: 45 points (A1 + A2 agents + test case editor)
- M4: 55 points (execution + A4 + Jira sync = most complex)
- M5: 30 points (reports, dashboards, accessibility, E2E tests)
- M6: 25 points (GA prep, compliance, security audit)
- **Total: ~255 points across 23 weeks (~11 points/week delivered)**

---

## 13. ROLLBACK PLANS SUMMARY

One-paragraph rollback plan per milestone. Full detail is in each milestone doc.

| Milestone | Rollback Summary |
|-----------|---|
| **M0** | Rollback auth/RBAC by reverting to previous Vercel deployment + DB snapshot restore. Rollback criterion: >2% login failure rate for ≥5 min. Process: (1) Revert Vercel, (2) SSH to Oracle VM, (3) restore DB from backup, (4) verify health checks pass. RTO: <10 min. Data loss risk: minimal (session data only). |
| **M1** | Rollback user management by reverting User Service deployment + DB migrations. Rollback criterion: RBAC failures (user cannot access assigned project) OR role assignment failures >1% per hour. Process: (1) Revert NestJS service, (2) Roll back DB migrations, (3) Restart API, (4) verify role guards enforced. RTO: <10 min. No data loss (user records preserved). |
| **M2** | Rollback KB + doc gen by disabling feature flag `feature_ai_a1_doc_gen` + reverting FastAPI inference service. Rollback criterion: A1 generation accuracy <60% OR ≥10 doc gen failures per hour. Process: (1) Disable flag, (2) Stop Hatchet job queue, (3) Restart API, (4) verify docs can be created manually. RTO: <5 min. No data loss (docs versioned). |
| **M3** | Rollback test case authoring by disabling `feature_ai_a1_case_gen` + `feature_ai_a2_dedup`. Rollback criterion: A1 auto-approval rate <60% OR A2 dedup false-positive >10%. Process: (1) Disable both flags, (2) Users revert to manual case authoring, (3) Clear dedup cache (Redis FLUSHDB filter). RTO: <5 min. No data loss. |
| **M4** | Rollback test execution + Jira sync by disabling `feature_jira_2way_sync` + rolling back test_runs service. Rollback criterion: Jira sync failure rate >5% OR defect loop failures (create in QA Nexus but not appear in Jira) >1 per hour. Process: (1) Disable flag, (2) Stop Integration Hub — Jira webhook, (3) Manual Jira creation available again, (4) Verify audit log shows sync events paused. RTO: <10 min. Data loss risk: none (all created defects logged locally). |
| **M5** | Rollback reports + Command-K + accessibility by disabling `feature_basic_reports` + `feature_command_k_omnibox` + reverting Report Service. Rollback criterion: Report generation failure >2% OR Command-K latency >5s OR accessibility audit finds >3 critical WCAG failures. Process: (1) Disable flags, (2) Revert Report Service code, (3) Restart Hatchet, (4) Redeploy frontend. RTO: <10 min. No data loss. |
| **M6** | Rollback full reports + GA by disabling `feature_full_reports` and rolling back GA-related deployments. Rollback criterion: Report generation failure >2% OR ROI formula error OR critical security/compliance issue. Process: (1) Disable flag, (2) Revert all GA code, (3) Restore to M5 stable snapshot, (4) GA announcement paused. RTO: <15 min. GA launch delayed; no customer data loss. |

---

## 14. REPORTING SCOPE SPLIT (USER-MANDATED)

The user explicitly mandated this split in PRD §13.

**Basic Reports (MVP, ship M5):**
- Daily Status Report (pass count, fail count, defect count, top blocker)
- Weekly Summary (trend over 7 days, coverage growth, new defects)
- Personal Dashboard (my assigned cases, open bugs, approvals pending, reports due)
- Defect Report (creation date, triage time, resolution time, category breakdown)

**Simple Exec Dashboard (MVP, ship M5):**
- Pass rate trend (7-day rolling)
- Defect count trend
- Basic release RAG (green/yellow/red based on open defect count)

**Full Reports (Post-MVP, ship M6):**
- Sprint Sign-off (story pass rate, bug escape count, release risk flag)
- Release Readiness Report (go/no-go decision, risk RAG, coverage gaps, defect trend, flaky test list, API contract coverage)
- RCA Aggregate Report (monthly RCA trends, root cause categories, recurring issues, team performance)
- ROI Dashboard (full business case: cost avoidance by stage, defects prevented, capacity freed, revenue protected, $$$)
- Advanced Exec Dashboard (KPI card layout: pass rate trend, defect density, coverage %, release RAG, ROI value, 12-month projection)
- Compliance Report (GDPR data access audit, AI agent usage audit, EU AI Act conformity, signed attestation)

---

## 15. TRACEABILITY MATRIX (PRD US-IDs → MILESTONES)

Every PRD user story traces to exactly ONE milestone where it becomes "done" (acceptance criteria met in production, feature-flagged on).

| US-ID | User Story (Abbreviated) | Owning Milestone | Primary Features (CO/EP/TB) | Status |
|-------|---|---|---|---|
| **US-001** | "As a Jr QA, I can write 10 test cases in 5 min with A1 help" | M3 | A1 Test Case Gen (CO-010, EP-040), Clarification Questions gate, confidence scoring | ✅ MVP |
| **US-002** | "As a Sr QA, I can author a Test Plan in <5 min from a PRD" | M2 | A1 context gen (CO-009, EP-029), 12 document templates, section confidence | ✅ MVP |
| **US-003** | "As a Jr QA, I know if my test case is a duplicate before I save" | M3 | A2 Dedup (CO-010, EP-40), live chips, semantic similarity, pgvector (CO-026) | ✅ MVP |
| **US-004** | "As a Lead, I set up a project and invite users in <10 min" | M0–M1 | Project Service (CO-006, EP-007–015), RBAC (CO-004, EP-016–017), User invite (CO-007, EP-021) | ✅ MVP |
| **US-005** | "As an Admin, I assign roles and track all actions" | M1 | RBAC (CO-004, CO-007, EP-016–017, EP-020–023), Audit Logger (CO-005, TB-013, EP-061) | ✅ MVP |
| **US-006** | "As a Sr QA, I log a defect in <60s and see it appear in Jira" | M4 | Defect Service (CO-012, EP-047–049), Jira Integration Hub (CO-015, EP-052–054), 2-way sync | ✅ MVP |
| **US-007** | "As a Sr QA, I understand why a test failed via auto-RCA" | M4 | A4 Defect Intelligence (CO-020, EP-051), 5-layer RCA, auto-evidence capture (TB-006, TB-016) | ✅ MVP |
| **US-008** | "As a Test Automation Engineer, I run tests and capture evidence auto" | M4 | Test Execution Service (CO-011, EP-041–045), auto-evidence (screenshot, HAR, logs, env) | ✅ MVP |
| **US-009** | "As a Lead, I see daily/weekly reports auto-generated" | M5 | Report Service (CO-013, EP-055–056), templated generation, auto-population from test + defect data | ✅ MVP |
| **US-010** | "As a Product Manager, I see release readiness RAG + ROI number" | M5 (basic) / M6 (full) | Exec Dashboard (CO-013, EP-058), ROI Calculator (EP-066, M6), pass rate + defect density | ✅ MVP (basic) |
| **US-011** | "As a QA, I find test cases/defects/docs with global search" | M5 | Search Service (CO-014, EP-059), global indexing, Command-K (EP-060) | ✅ MVP |
| **US-012** | "As a QA, I know the system is auditable for compliance" | M1–M5 | Audit Logger (CO-005, TB-013), audit log export (EP-061, M5) | ✅ MVP |

---

## 16. MILESTONE IDs & NAMING CONVENTION

**All downstream milestone docs MUST follow this convention.**

### Task ID Format

`MS{N}-T###`

- **MS{N}:** Milestone 0–6 (e.g., MS0, MS3)
- **T###:** Task number, zero-padded to 3 digits (e.g., T001, T042)
- **Example:** `MS0-T001` = Milestone 0, first task

**Task Examples:**
- `MS0-T001`: Set up Oracle VM
- `MS0-T002`: Install PostgreSQL + pgvector
- `MS2-T015`: Implement RAG pipeline
- `MS4-T042`: Build Jira 2-way sync webhook

### Acceptance Criteria ID Format

`MS{N}-AC###`

- **Example:** `MS0-AC001`, `MS1-AC005`

**AC Examples:**
- `MS0-AC001`: BetterAuth registration works (email sent, confirm link valid)
- `MS3-AC012`: A1 generates 10 test cases in <30s with confidence scoring visible

### Other Identifiers

- **PRD US-IDs:** US-001, US-002, ... (unchanged; reference only)
- **PRD GM-IDs:** GM-001, GM-002, ... (success metrics; reference only)
- **ERD TB-IDs:** TB-001, TB-002, ... (unchanged; reference only)
- **ERD EP-IDs:** EP-001, EP-002, ... (unchanged; reference only)
- **ERD CO-IDs:** CO-001, CO-002, ... (unchanged; reference only)
- **Risk IDs:** R-001, R-002, ... (unchanged; reference only)
- **Feature Flag IDs:** feature_ai_a1_case_gen, ... (unchanged; reference only)

---

## 17. SHARED CONTEXT EACH MILESTONE DOC MUST REPRODUCE

Every downstream milestone doc MUST include these sections in this order. This registry is the source of truth; each milestone doc references it.

**Mandatory Sections (in order):**

1. **Cover Page** — Project title, milestone number/name, version, date, team, status badge (On Track / At Risk / Escalated)

2. **Executive Summary** — One paragraph: goal, scope, success definition, key risks

3. **Context: What Was Delivered Before** — Exact list of deliverables from prior milestone (pulled from prior milestone's exit criteria). For M0: "Starting from scratch." For M1+: bullet list of working APIs, DB tables available, deployment environment state.

4. **Tech Stack** — Component names, versions, purpose, status (Configured/Pending/Evaluating), assigned milestone. Slice from ERD tech stack, include only components used in THIS milestone.

5. **Definition of Ready (DoR)** — Prerequisites ensuring sprint start is viable. Backlog items have acceptance criteria. Mockups finalized. Test environments provisioned. Cross-milestone dependencies resolved. Technical spikes from prior milestone completed.

6. **Milestone Entry Criteria** — Specific, verifiable prerequisites (e.g., "Milestone 3 entry: ≥80 test cases seeded, A1/A2 agents calibrated, Ollama model loaded").

7. **Task Breakdown (Week-Wise)** — Week 1, Week 2, ... organized. Per task: name, description (developer-ready), priority (P0–P3), estimate (Fibonacci or hours), owner role, dependencies, status, linked US-ID and EP/TB IDs from ERD.

8. **Task Dependency Map / Gantt Chart** — Visual timeline with parallel streams, critical path. Matplotlib PNG embedded.

9. **Acceptance Criteria Matrix** — Deliverable × testable conditions (Given/When/Then format, traces to US-IDs). AC-ID column (e.g., MS2-AC005).

10. **Environment & Setup Checklist** — Day-1 complete for new team member. Accounts, tools, repos, branches, CI/CD, API keys, secrets for THIS milestone.

11. **API Contracts (Milestone Scope)** — Only endpoints built or modified IN THIS MILESTONE. Sliced from ERD catalog. Method, path, auth, request/response schemas.

12. **Database Changes (Milestone Scope)** — Only schema changes, migrations, seed data for THIS MILESTONE. Sliced from ERD schema.

13. **Testing Plan** — Unit tests (coverage %), integration tests, E2E tests (Playwright journeys), security scans (if applicable), CI gate requirements.

14. **Feature Flag Strategy** — Flags introduced this milestone. Name, feature covered, rollout phase (dark launch → canary → GA), kill switch command, retirement criteria.

15. **Risk & Blocker Register** — Milestone-specific risks. Description, likelihood, impact, mitigation, owner. Critical path tasks have zero tolerance.

16. **Rollback Plan** — Mandatory. Trigger conditions, step-by-step revert process, data migration reversal strategy, feature flag kill switches, communication protocol, post-rollback verification.

17. **Milestone Exit Criteria (Definition of Done)** — Specific, measurable checklist. All tasks complete, acceptance criteria verified, tests passing, code reviewed, staging verified, documentation updated, security passed, performance targets met.

18. **Next Milestone Preview** — High-level goal and scope of following milestone. Features that build on this milestone's deliverables. Infrastructure changes planned. New dependencies.

19. **Handoff Notes** — What was actually delivered vs. planned. Deferred items and why. Known technical debt. Lessons learned. Updated cross-milestone registry state.

20. **Appendix** — Glossary, reference links, tool URLs, coding standards, naming conventions, sample data, Jira ticket format templates, ADR index.

---

## 18. HANDOFF FILE MANIFEST PER MILESTONE

Each milestone MUST produce these files. Downstream agents will consume them.

**File Naming:** `Milestone_M{N}_{Name}.*`

| Artifact | File Format(s) | Description | Required |
|----------|---|---|---|
| **Milestone Document** | `.docx` + `.md` | Full execution blueprint (all 20 sections above), 2500–3500 lines substantive content | ✅ Required |
| **Workflow Diagram** | `.drawio` | Task dependency graph, Gantt timeline, critical path highlighted | ✅ Required |
| **Charts (optional)** | `.png` (Matplotlib) | Gantt chart, scope pie, risk heatmap, effort burndown, velocity trend. Stored in `milestone_M{N}_charts/` directory | Optional but recommended |
| **Test Data Fixtures** | `.sql` or `.json` | Seed scripts, factories for test data generation. Example: `M3_test_cases_seed.sql` | Required |
| **Acceptance Criteria Checklists** | `.csv` or `.md` table | AC-ID, description, acceptance condition, verifier role. Example: `M3_acceptance_criteria.csv` | ✅ Required |

**Example File Structure for M3:**
```
/mnt/QA nexus MVP/milestones/
  ├── Milestone_M3_Test_Cases_A1_A2.docx
  ├── Milestone_M3_Test_Cases_A1_A2.md
  ├── Milestone_M3_workflow.drawio
  ├── milestone_M3_charts/
  │   ├── gantt.png
  │   ├── scope_pie.png
  │   └── risk_heatmap.png
  ├── M3_test_cases_seed.sql
  └── M3_acceptance_criteria.csv
```

**Content Requirements:**

- **DOCX version:** Professional formatting, TOC (hyperlinked), color-coded sections, embedded PNGs (charts), headers/footers with milestone name + page numbers
- **MD version:** GitHub-friendly markdown (no .docx-specific formatting), same content as DOCX, link references instead of embedded images
- **.drawio version:** Editable diagram source (not PNG snapshot); can be opened in draw.io online; include task names, durations, dependencies, critical path highlighted in red

**Handoff Process:**
1. Milestone N team produces all artifacts by exit date
2. Artifacts stored in `/mnt/QA nexus MVP/milestones/Milestone_M{N}_{Name}/`
3. PM + Tech Lead review artifacts for completeness (all 20 sections, all IDs correct, no broken references)
4. Artifacts locked (read-only) on GitHub
5. Milestone N+1 team retrieves and uses as context

---

## 19. PROJECT-LEVEL PHASE MILESTONES (PM1–PM4) — NEW STRUCTURE

### PM1 — MVP (Contained M0–M6, locked dates)

| Milestone | Name | Start | End | Duration | Headline Scope | Agents |
|-----------|------|-------|-----|----------|---|---|
| **M0** | Setup & Infrastructure | 2026-04-27 | 2026-05-10 | 2w | Oracle VM, Vercel, Postgres+pgvector, CI/CD, BetterAuth | — |
| **M1** | Users & Roles | 2026-05-11 | 2026-05-24 | 2w | 4-role RBAC, user CRUD, audit log, invitations | — |
| **M2** | Test Documents & Knowledge Base | 2026-05-25 | 2026-06-14 | 3w | 12 doc templates, RAG pipeline, A1 context agent | A1 (partial), A8 (partial) |
| **M3** | Test Cases & AI Generation | 2026-06-15 | 2026-07-05 | 3w | Test case CRUD, A1 Test Case Gen, A2 Dedup | **A1, A2** |
| **M4** | Test Runs, Defects & Jira | 2026-07-06 | 2026-07-26 | 3w | Test execution, A4 5-layer RCA, Jira 2-way sync | **A4** |
| **M5** | Automation + Basic Reports + MVP Launch | 2026-07-27 | 2026-08-16 | 3w | Playwright runner, basic reports, pilot launch | — |
| **M6** | Full Reports & GA | 2026-08-17 | 2026-09-20 | 5w | Full reports, Exec Dashboard, GA sign-off, 2026-09-21 launch | — |

**PM1 Exit Gate Criteria (PM1→PM2 transition):**
- MVP GA signed off (legal, security, compliance passed)
- ≥2 Iksula pilots live, generating telemetry
- A1, A2, A4 auto-approval rates ≥80% (measured across pilot runs)
- p95 API latency ≤500ms
- 688%-class ROI demonstrated on ≥1 pilot
- All 12 doc templates stable, 30+ seed cases, 50+ seed defects

---

### PM2 — v1.5 (Contained M7–M12, Self-Healing + Test Data + Full Automation)

| Milestone | Name | Window (from PM2 start) | Calendar | Headline Scope | Agents |
|-----------|------|---|---|---|---|
| **M7** | Test Data Generation (A6) | W1–3 | 2026-09-22 → 2026-10-10 | Synthetic data generator, provenance tracking, re-generate, version history, audit trail | **A6** |
| **M8** | Test Maintenance Self-Healing (A7) | W4–6 | 2026-10-13 → 2026-10-31 | Background suggestions, self-healing at scale, approve-in-context, 40% flaky reduction | **A7** |
| **M9** | A8 Advanced (Risk-Adaptive Planning) | W7–8 | 2026-11-03 → 2026-11-14 | Code churn analysis, defect pattern learning, risk scoring, coverage auto-adjustment | **A8 (advanced)** |
| **M10** | AI Product Tester (APT) | W9–10 | 2026-11-17 → 2026-11-28 | Autonomous E2E test discovery, scenario discovery, auto-generate + execute, evidence capture | **APT** |
| **M11** | Visual Regression + Mobile + On-Prem | W11–13 | 2026-12-01 → 2026-12-19 | Visual diff engine, iOS/Android support (Capacitor), Helm chart, on-prem deployment guide | — |
| **M12** | v1.5 GA + 32-Doc Catalog | W14–16 | 2026-12-22 → 2027-01-09 | 32 doc templates, v1.5 GA, APT beta, 5–8 paying customers, self-healing ≥40% flaky reduction | — |

**PM2 Exit Gate Criteria (PM2→PM3 transition):**
- v1.5 GA signed off
- ≥5 paying customers live
- On-prem deployment validated at 1 customer
- 32 doc templates stable (12 + 20 new)
- A6, A7, A8-advanced confidence ≥80%
- Self-healing reducing flaky tests by ≥40%
- APT discovering ≥50 scenarios per user flow, execution success ≥80%

---

### PM3 — v2 (Contained M13–M18, Low-Code + Governance + Enterprise Foundation)

| Milestone | Name | Window (from PM3 start) | Calendar | Headline Scope | Agents |
|-----------|------|---|---|---|---|
| **M13** | Low-Code Authoring (A3) | W1–3 | 2027-01-12 → 2027-01-30 | Notion-style automation editor, drag-handles, slash commands, exports to Playwright/Selenium/Cypress/WebdriverIO | **A3** |
| **M14** | Test Selection (A5) + PR-Gated CI | W4–6 | 2027-02-02 → 2027-02-20 | Change-based subsetting, GitHub/GitLab Actions, ranked by impact, 60% CI time reduction | **A5** |
| **M15** | Full Test Planning (A8 Full) | W7–8 | 2027-02-23 → 2027-03-06 | Auto-strategy from PRD, risk matrix, entry/exit criteria, compliance checklist | **A8 (full)** |
| **M16** | Vibe Code Governor (Basic) | W9–10 | 2027-03-09 → 2027-03-20 | Governance layer for AI-written code, audit trail, EU AI Act Article 13 foundation | VCG (basic) |
| **M17** | Enterprise Auth (SSO/SAML) + Slack ChatOps + Jira Auth Alternatives | W11 | 2027-03-23 → 2027-03-27 | SSO/SAML (Okta/Azure AD/Google Workspace), Slack bot for triage + defect creation, Jira API Token + Email Basic Auth (locked-down Atlassian Cloud), Jira Server/DC on-prem via PAT + self-signed cert trust, per-project Jira auth method, custom OAuth provider registration (TB-013b) | — |
| **M18** | v2 GA + 50-Doc Catalog | W12 | 2027-03-30 → 2027-04-03 | 50 of 70 doc templates, v2 GA, VCG in production, 15+ paying customers, SOC 2 Type I + ISO 27001 | — |

**PM3 Exit Gate Criteria (PM3→PM4 transition):**
- v2 GA signed off
- ≥15 paying customers live
- SSO in production, ≥2 identity providers tested
- VCG blocking ≥5 violations per PR on average
- 50 doc templates stable (32 + 18 new)
- A3, A5, A8-full confidence ≥75%
- Slack ChatOps adoption ≥50% of users
- SOC 2 Type I + ISO 27001 compliance audits passed

---

### PM4 — v2+ (Contained 6 initiatives, ongoing)

| Initiative | Timeline | Window | Scope | Dependencies |
|-----------|----------|--------|-------|---|
| **Career Compass** (L7) | W47–52 | 2027-04-06 → 2027-07-31 | Skills graph, job market matching, salary benchmarking, learning paths | Stable v2 base, 15+ customer user behavior data |
| **Full 70-Doc Catalog** | W47–60 | 2027-04-06 → 2027-09-30 | Remaining 20 templates (Compliance, Advanced Analytics, Architecture Review) | Doc gen stable, customer feedback loop |
| **Cloud Device Grid** | W55–70 | 2027-07-14 → 2027-10-27 | Partner integration (BrowserStack/LambdaTest) + hybrid self-host grid | Mobile + on-prem proven, customer demand signals |
| **Multi-Tenant SaaS** | W50–68 | 2027-06-09 → 2027-10-06 | Per-org subdomain routing, row-level tenant isolation, tenant-scoped secrets | 15+ customers baseline, data model review |
| **Enterprise Compliance** | W55–72 | 2027-07-14 → 2027-10-27 | HIPAA, GxP (FDA 21 CFR Part 11), multi-region data residency | SOC 2 baseline from PM3, customer compliance mandates |
| **White-Label** | W65–75 | 2027-10-06 → 2027-12-22 | Customer branding, custom domains, embeddable QA Nexus widgets | Full product stable, enterprise customer pipeline |

**PM4 Governance:** No fixed exit gate. Quarterly review at W48, W52, W56, W60 to assess market demand and revenue impact. Ongoing product evolution.

---

## 20. AI AGENT PROGRAM CONTINUITY (PROJECT-LEVEL)

This section ensures AI agents ship-in-phase and are consumed downstream consistently.

| Agent | Name | Purpose | Ships In | MVP Consumer(s) | v1.5+ Consumer(s) | Blueprint Owner |
|-------|------|---------|----------|---|---|---|
| **A1** | Test Case Generator | PRD/Jira/Figma → test cases (Clarification Questions gate) | PM1 (M3) | M3 authoring, M4 RTM context | M7–M18 (doc gen context), A3 authoring hints, A8 planning | Product |
| **A2** | Test Deduplication | Semantic dedup, live chips, bulk audit | PM1 (M3) | M3 authoring, M4 defect dedup | M8–M18 (all test-selecting phases) | Product |
| **A3** | Low-Code Authoring | Notion-style automation editor | PM3 (M13) | — | M13+ test automation, A5 subsetting, A6 data generation | Product |
| **A4** | Defect Intelligence (5-layer RCA) | Stack → Env → Config → Code → Data classification | PM1 (M4) | M4–M6 defect triage, Jira context | M8–M18 (all failure analysis) | Product |
| **A5** | Test Selection | Change-based PR-gated CI subsetting | PM3 (M14) | — | M14+ CI optimization, M15–M18 risk-based scheduling | DevEx |
| **A6** | Test Data Generation | Inline synthetic data, provenance | PM2 (M7) | — | M7+ test parametrization, A7 self-healing hints | Product |
| **A7** | Test Maintenance | Background suggestions, self-healing | PM2 (M8) | — | M8+ flaky reduction, A6 data generation context | Product |
| **A8** | Test Planning | Auto-strategy (partial MVP, advanced PM2, full PM3) | PM1 (M2 partial) / PM2 (M9 advanced) / PM3 (M15 full) | M2 doc gen, M3–M6 planning context | M7+ planning, Risk+ROI dashboards, A1 case gen context | Product |
| **VCG** | Vibe Code Governor | Governance layer for AI-written code | PM3 (M16) basic / PM4 advanced | — | M16+ PR analysis, M18+ audit trail enforcement, v2+ compliance audits | Security |
| **APT** | AI Product Tester | Autonomous E2E test discovery + execution | PM2 (M10) | — | M10+ exploratory testing, M12+ full test catalog, v1.5+ career intelligence training data | Product |

**Key assumption:** Every agent trained/tuned in its ships-in phase becomes a production-grade tool for downstream milestones. No agent regresses; all agents can be composed (e.g., A1 case gen + A2 dedup + A5 selection all run together in M8).

---

## 21. 7-LAYER ARCHITECTURE PROGRESSION (PROJECT-LEVEL)

How the 7-layer stack builds across the 4 project phases:

| Layer | L1 Platform | L2 Knowledge | L3 Documents | L4 Agents | L5 Analytics | L6 Governance | L7 Career |
|-------|---|---|---|---|---|---|---|
| **PM1 (MVP)** | 4 integrations (Jira/GH/Slack/Confluence) | pgvector foundation, RAG | 12 templates | 3 agents (A1, A2, A4) | Reports + basic Exec Dashboard | — | — |
| **PM2 (v1.5)** | +on-prem, mobile (iOS/Android) | +Graphiti temporal knowledge | +20 (32 total) | +3 agents (A6, A7, A8-adv) +APT | +Full dashboards, quality gates | EU AI Act foundation, audit trail | — |
| **PM3 (v2)** | +SSO/SAML, Slack ChatOps | +GraphRAG, knowledge mesh | +18 (50 total) | +3 agents (A3, A5, A8-full) +VCG | +Predictive analytics, risk scoring | SOC2/ISO27001 compliance baseline | — |
| **PM4 (v2+)** | +multi-tenant, white-label, custom domains | +enrichment + external APIs | +20 (70 total) | Ongoing agent expansion (AI marketplace?) | Enterprise BI, autonomous insights | +GxP, multi-region data residency, HIPAA | Skills graph, job matching, salary benchmarking |

---

## NOTES & CHANGE LOG

### Changes Made During Project-Level Restructure (v3.0 — 2026-04-22)

1. **Registry transformed from MVP-only (7 milestones) to project-hierarchical (4 phases, 19 milestones, 6 initiatives):**
   - PM1 (MVP): M0–M6 dates frozen (unchanged from v2.0)
   - PM2 (v1.5): M7–M12 created per PROJECT_ROADMAP.md
   - PM3 (v2): M13–M18 created per PROJECT_ROADMAP.md
   - PM4 (v2+): 6 initiatives created (ongoing, no fixed end date)

2. **New sections added:**
   - §19: Project-Level Phase Milestones (PM1–PM4 tables)
   - §20: AI Agent Program Continuity (ship-in-phase + downstream consumption)
   - §21: 7-Layer Architecture Progression (L1–L7 per phase)

3. **PM1 sub-milestones locked:** All M0–M6 dates from v2.0 preserved exactly. No changes to MVP scope.

4. **Phase gate criteria defined:** Measurable exit criteria for PM1→PM2, PM2→PM3, PM3→PM4 transitions.

---

### Changes Made During Registry Correction (v2.0)

1. **Milestone scope realigned to 7-milestone layout (M0–M6):**
   - **OLD M1 (Knowledge Base + Documents) RENAMED and SHIFTED to M2:** Test Documents & Knowledge Base (3 weeks: 2026-05-25 → 2026-06-14)
   - **OLD M2 (Test Cases + A1 + A2) RENAMED and SHIFTED to M3:** Test Cases & AI Generation (3 weeks: 2026-06-15 → 2026-07-05)
   - **OLD M3 (Test Execution + A4 + Jira Sync) RENAMED and SHIFTED to M4:** Test Runs, Defects & Jira (3 weeks: 2026-07-06 → 2026-07-26)
   - **NEW M1 (Users & Roles) INSERTED between M0 and M2:** BetterAuth full integration, user CRUD, RBAC enforcement, API keys, audit log (2 weeks: 2026-05-11 → 2026-05-24)
   - **OLD M5 (Polish + Beta) RENAMED to M5:** Automation + Basic Reports + MVP Launch (3 weeks: 2026-07-27 → 2026-08-16)
   - **NEW M6 (Full Reports + GA) CREATED:** Full report suite, advanced dashboards, legal/compliance, GA launch (5 weeks: 2026-08-17 → 2026-09-20)

2. **Table ownership corrected:**
   - TB-005 (test_cases) moved from M2 → M3 ✅
   - TB-006, TB-007 (test_runs, defects) moved from M3 → M4 ✅
   - TB-008 (jira_integrations) moved from M3 → M4 ✅
   - TB-009, TB-010 (KB, documents) moved from M1 → M2 ✅
   - TB-011 (reports) moved from M4 → M5 ✅
   - TB-017 (user_preferences) moved from M0 → M1 ✅

3. **Endpoint ownership corrected:**
   - EP-018–023 (user management, API keys) added to M1 ✅
   - EP-024–034 (KB, documents) moved to M2 ✅
   - EP-035–040 (test cases) moved to M3 ✅
   - EP-041–054 (test runs, defects, Jira) moved to M4 ✅
   - EP-055–062 (reports, dashboards, search, Command-K) moved to M5 ✅
   - EP-064–066 (full reports, ROI) added to M6 ✅

4. **Component ownership corrected:**
   - CO-007 (User Service) added to M1 ✅
   - CO-008, CO-009 (KB, Document services) moved to M2 ✅
   - CO-010 (Test Case Service) moved to M3 ✅
   - CO-011, CO-012 (Execution, Defect services) moved to M4 ✅
   - CO-013, CO-014 (Report, Search services) moved to M5 ✅

5. **DoR/DoD chain fully regenerated** for all 6 boundaries (M0↔M1, M1↔M2, M2↔M3, M3↔M4, M4↔M5, M5↔M6) with correct feature ownership

6. **Reporting scope split clarified:**
   - Basic reports (Daily, Weekly, personal dashboard) → M5 (MVP)
   - Simple Exec Dashboard (pass rate trend, defect count, basic RAG) → M5 (MVP)
   - Full reports (Sprint, Release, RCA aggregate, advanced dashboard, ROI calculator) → M6 (post-MVP)

7. **Traceability matrix updated:** All US-IDs re-mapped to correct milestone ownership (US-001/US-003 → M3; US-002 → M2; US-004/US-005 → M0/M1; US-006/US-007/US-008 → M4; US-009/US-010/US-011/US-012 → M5/M6)

8. **Timeline adjusted:** MVP now 18 weeks (M0–M5: 2026-04-27 → 2026-08-16); GA prep 5 weeks (M6: 2026-08-17 → 2026-09-20); total 23 weeks with GA launch on 2026-09-21

---

**END OF MILESTONE REGISTRY (v2.0)**

---

**Version History:**
- v1.0 (2026-04-21): Initial registry with 6-milestone layout (M0–M5). **INCORRECT scope assignments.**
- v2.0 (2026-04-21): Corrected registry with 7-milestone layout (M0–M6). **Scope realigned per user intent.** 1,800+ lines substantive content. All TB/EP/CO IDs re-mapped. DoR/DoD chains regenerated. Ready for downstream agents.
- v3.0 (2026-04-22): **Project-level restructure.** MVP-flat (M0–M6) → project-hierarchical (PM1–PM4, M0–M18 + 6 PM4 initiatives). Adds phase gates, AI agent continuity program, 7-layer progression. PM1 dates frozen; PM2/PM3/PM4 structure new. 2,500+ lines total, 3 new major sections.
- v3.1 (2026-04-22): **PM2 ↔ PM3 content swap per PROJECT_ROADMAP.md v1.1.** PM2 now contains Self-Healing/Test Data/Full Automation (M7–M12, 16 weeks). PM3 now contains Low-Code/Governance/Enterprise (M13–M18, 12 weeks). AI agent program continuity updated: A6/A7/APT ship in PM2; A3/A5/VCG ship in PM3. Phase gates, 7-layer progression, and doc templates re-mapped accordingly.
- v3.2 (2026-04-23): **Audit Wave 1 remediation.** Overview PM2/PM3 duration cells corrected (PM2 = 16 wk, PM3 = 12 wk); PM1 total normalized to 21 cal-wk (18 build + 3 GA); PM2 sub-milestone windows re-aligned to PROJECT_ROADMAP.md v1.2 (M7–M12 dates verified; M8 end +3d; M9–M12 re-phased to match roadmap W7-W16); PM3 sub-milestone windows re-aligned (M13–M18 start/end dates corrected to match roadmap W1-W12); AI agent ship-phase and 7-layer progression tables verified canonical against roadmap.
- **v3.3 (2026-04-24): PM3 M17 Jira auth alternatives added.** M17 name expanded to "Enterprise Auth (SSO/SAML) + Slack ChatOps + **Jira Auth Alternatives**". Scope cell gained Jira API Token + Email Basic Auth (locked-down Atlassian Cloud), Jira Server/DC on-prem via PAT + self-signed cert trust, per-project Jira auth method, custom OAuth provider registration (TB-013b). Tied to PRD FR-063/FR-064, ERD TB-013 schema expansion + TB-013b new table, EP-006b/c/d/e endpoints. Driven by F11 Jira wizard UI build clarifying PM1 = OAuth 2.0 3LO only. Milestone `Milestone_M17_Enterprise_Auth_Slack.md` expanded accordingly (frontmatter, H1, Key Deliverables sub-block with 5 feature bullets, Success Criteria gained 2 items). No PM1 or PM2 milestone scope changes.
- **v3.4 (2026-04-24): M0 Day-0 Workspace Bootstrap added.** M0 scope cell now explicitly lists "Day-0 Workspace Bootstrap Seed Script" as a deliverable. Exit-gate expanded with full bootstrap Definition of Done: seed script creates initial Admin (Yogesh M., Admin RBAC, password NULL, invite_token populated) + transactional email delivered via F06b Mode A template + magic-link flow ends on F09 Projects List after F07 completion + `first_login` flips to false + idempotent re-run protection. Ties into ERD v2.4 TB-002 users table invitation lifecycle columns and PRD v2.4 §15 PM1 Deployment Model subsection. Confirms PM1 single-tenant internal deployment model (not sales-led, not multi-tenant — those are PM4). No PM2/PM3 milestone scope changes.
