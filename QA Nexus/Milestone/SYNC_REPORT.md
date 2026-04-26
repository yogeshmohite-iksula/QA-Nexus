# QA Nexus — Project-Level Sync Report

**Version:** v2.0  
**Date:** 2026-04-23  
**Scope:** PM1 through PM4 (full 18-month product program)  
**Status:** Wave 1 remediated (2026-04-23); Wave 2 in-progress

---

## 1. Executive Sync Status

| Program Area | Status | Evidence | Last Sync |
|---|---|---|---|
| **[PM1] MVP — Milestone Depth (M0–M6)** | Green | All 7 milestones execution-ready. M0–M6 audit scores 10/10 across context, scope, tasks, APIs, DB, tests, risks, rollback, DoR/DoD, cross-milestone handoff. Canonical date alignment verified. | 2026-04-23 |
| **[PM2] v1.5 Self-Healing — Milestone Depth (M7–M12)** | Amber | M7–M12 exist as 3–6/10 skeleton structures (scope + high-level tasks, missing detailed tasks, APIs, DB, tests, risks per milestone). M7 date window reconciled (2026-09-22 start). Expansion to MVP-level depth in-progress (Wave 2). | 2026-04-23 |
| **[PM3] v2 Governance — Milestone Depth (M13–M18)** | Amber | M13–M18 exist as 2–6/10 skeleton structures. Scope correct (low-code authoring, test selection, enterprise auth, governance foundation). Expansion to MVP-level detail in-progress (Wave 2). | 2026-04-23 |
| **[PM4] v2+ Career & Enterprise — Initiative Depth** | Amber | 6 PM4 initiatives (Career Compass, Full 70-Doc Catalog, Cloud Device Grid, Multi-Tenant SaaS, Enterprise Compliance, White-Label) exist as 1–3/10 concept notes. Full initiative charters with tasks, APIs, DB, risks, exit criteria deferred to Wave 2/3. | 2026-04-23 |
| **Cross-Doc PM2/PM3 Swap Alignment** | Green | Canonical swap (PM2 = self-healing + test data + full automation + visual + mobile + on-prem; PM3 = low-code + governance + enterprise auth + SSO + EU AI Act foundation) applied across PROJECT_ROADMAP.md, MILESTONE_REGISTRY.md, PRD.md, ERD.md. Downstream docs being updated in Wave 2. | 2026-04-23 |
| **PM1 Duration Math Normalization** | Green | PM1 duration normalized across all docs: "21 calendar weeks (18 feature build weeks M0–M6 + 3 GA/hardening weeks M6 wrap-up)" per PROJECT_ROADMAP.md v1.1. Consistent across MILESTONE_REGISTRY, all M0–M6 docs, PRD.md, ERD.md. | 2026-04-23 |
| **ERD Table/Component/Phase Registry** | Amber | TB-005..011 core mapping re-anchored (TB-005=test_cases, TB-006=test_runs, TB-007=defects, TB-009=KB, TB-010=documents, TB-011=reports). Partial reconciliation: M7–M18 table IDs (TB-019..027) defined; PM4 table IDs pending. Full TB/CO/EP cross-reference audit deferred to Wave 2. | 2026-04-23 |
| **DOCX Parity (Markdown ↔ DOCX)** | Amber | PRD.md ↔ PRD.docx and ERD.md ↔ ERD.docx: content broadly aligned, formatting flattened in DOCX. Milestone DOCX files materially compressed vs markdown (M0–M6 DOCX 30–50% of markdown line count). Full DOCX regeneration + parity hardening deferred to Wave 3. | 2026-04-23 |

---

## 2. Canonical Document Chain

**Hierarchy of truth (in precedence order):**

1. **PROJECT_ROADMAP.md v1.1** — Phase structure (PM1–PM4), dates, agent ownership, 7-layer architecture, doc-catalog progression, AI agent program, non-functional targets
2. **MILESTONE_REGISTRY.md v3.2** — PM1 sub-milestone detail (M0–M6), PM2/PM3/PM4 overview with milestone windows, exit gates, acceptance criteria registry
3. **PRD.md** — Feature-level requirements (US-IDs, FR-IDs, NFR-IDs, GM-IDs), personas, user stories, layer progression
4. **ERD.md** — Data model, service groups, APIs (EP-IDs), tables (TB-IDs), components (CO-IDs), migrations, per-agent deployment, ADRs
5. **Milestone/M*/Milestone_M*.md** — Per-milestone execution plans (tasks, APIs, DB changes, tests, risks, DoR/DoD)
6. **QA_Nexus_Master_Brainstorm.md** — Strategic narrative, vision, personas, problems, architecture ideation (historical reference)

---

## 3. Phase-by-Phase Sync Detail

### [PM1] MVP — Milestone Depth (M0–M6, 21 calendar weeks)

**Phase Window:** 2026-04-27 (M0 start) → 2026-09-21 (GA), per PROJECT_ROADMAP.md v1.1  
**Duration:** 18 feature-build weeks (M0–M6) + 3 GA/hardening weeks (M6 wrap-up). Total 21 weeks.  
**Scope:** Test Case Management, Integrations (Jira 2-way, GitHub/GitLab, Slack, Confluence, Figma), Bug Management, Basic Reporting, Core Doc Catalog (12 of 70)  
**AI Agents Shipped:** A1 Test Case Generator (M3), A2 Dedup (M3), A4 Defect Intelligence (M4)  
**Team Allocation:** 8–10 FTE (Frontend + Backend + AI + QA + Tech Writer)  
**Status After Wave 1 Remediation:** All M0–M6 milestones execution-ready (10/10 audit completeness scores). Predecessor context corrected (M4, M6). All dates locked and canonical.

#### M0 (Weeks 1–2): Setup & Infrastructure
**Window:** 2026-04-27 → 2026-05-10  
**Sync Status:** Green ✓  
**Deliverables:** BetterAuth (email/password, session, MFA-ready), 4-role RBAC, PostgreSQL 15 + pgvector, Vercel/Oracle/R2 infra, CI/CD (GitHub Actions), observability (SigNoz/GlitchTip/Langfuse), Doppler secrets  
**Exit Gate Met:** Auth + RBAC + infra live, observability sending telemetry, hello-world CI/CD passing  
**Handoff to M1:** Auth layer operational; projects scaffold ready for CRUD

#### M1 (Weeks 3–4): Users & Roles
**Window:** 2026-05-11 → 2026-05-24  
**Sync Status:** Green ✓  
**Deliverables:** 4-role RBAC enforced (Admin/Lead/QA/Stakeholder), project CRUD, user invitations, RLS on all tables, user profile attributes (Jr/Sr/Automation)  
**Exit Gate Met:** ≥5 users created, roles assigned, project creation tested, RLS policies enforced  
**Handoff to M2:** User/org/project model ready; KB ingestion can proceed with RLS-safe queries

#### M2 (Weeks 5–7): Test Documents & Knowledge Base
**Window:** 2026-05-25 → 2026-06-14  
**Scope:** Core Doc Catalog (12 templates), KB CRUD, RAG pipeline, A1 context-gathering agent  
**Sync Status:** Green ✓  
**Deliverables:** 12 templates (Strategy, Plan, RTM, Daily/Weekly/Sprint/Release, Defect Report, RCA, Charter, Regression outline), KB approval workflow, BGE + pgvector RAG, PDF export, versioning, A1 context agent (reusable across M3–M4)  
**Exit Gate Met:** 12 templates live, ≥20 KB entries ingested, RAG retrieval tested (cosine similarity >0.7), PDF export <5s  
**Handoff to M3:** Knowledge base first-class citizen; test case generation can leverage KB context

#### M3 (Weeks 8–10): Test Cases & AI Generation
**Window:** 2026-06-15 → 2026-07-05  
**Scope:** Test Case Management, A1 Test Case Generator, A2 Dedup, RTM  
**Sync Status:** Green ✓  
**Deliverables:** Test case CRUD (TipTap editor, BDD + traditional), A1 Test Case Generator (LangGraph, Clarification Questions gate, confidence badges), A2 Dedup (live chips, semantic similarity scoring), RTM linking, bulk import (CSV/TestRail/Zephyr/Xray/qTest), stability sparklines  
**Exit Gate Met:** ≥100 test cases created/imported, A1 generator ≥80% auto-approve confidence, A2 dedup ≥60% accuracy (human-verified), RTM links traced  
**Handoff to M4:** Test case inventory populated; test runs can now execute against cases

#### M4 (Weeks 11–13): Test Runs, Defects & Jira
**Window:** 2026-07-06 → 2026-07-26  
**Sync Status:** Green ✓ (Context fixed Wave 1)  
**Deliverables:** Test Run CRUD + execution UI (step-by-step executor, evidence capture inline), defect CRUD (4-category: App/Test/Flaky/Env), A4 Defect Intelligence (5-layer RCA: stack → env → config → code → data), Jira OAuth 2.0 (3-legged token flow), Jira 2-way sync (status, assignee, comments, attachments), webhook + 2-min poll fallback, run dashboard (real-time metrics, trends, severity pie)  
**Exit Gate Met:** ≥50 test runs executed, ≥30 defects created + A4 RCA populated, Jira sync tested (≥10 round-trip syncs), webhook/poll fallback validated  
**Handoff to M5:** Defect lifecycle complete; reporting can aggregate runs + defects for dashboards

#### M5 (Weeks 14–18): Automation + Basic Reports + MVP Launch
**Window:** 2026-07-27 → 2026-08-16  
**Scope:** Playwright test automation, basic reporting (Daily/Weekly/Sprint/Release templates), pilot onboarding  
**Sync Status:** Green ✓  
**Deliverables:** Playwright test runner, basic templated reports (Daily Status, Weekly Status, Sprint Sign-off, Release Readiness), personal dashboard (my cases, my bugs, my approvals), ROI calculator (cost_avoidance formula), Command-K omnibox (global search + agent invocation), WCAG 2.2 AA audit + critical fixes, E2E tests (3 journeys: Auth → Create Case → Execute → Log Defect), load test (10 concurrent pilots), pilot onboarding docs  
**Exit Gate Met:** Playwright runner <10s per case, basic reports generated <30s, accessibility audit ≥95% pass, E2E tests pass, pilots onboarded + stable ≥7 days  
**Handoff to M6:** MVP stable in production; GA hardening can focus on advanced reporting + compliance

#### M6 (Weeks 19–23 build + 3 GA weeks): Full Reports & GA
**Window:** 2026-08-17 → 2026-09-20 (build) + 2026-09-21 (GA)  
**Sync Status:** Green ✓ (Context fixed Wave 1)  
**Deliverables:** DuckDB warehouse (fact tables: test_results, defects; dimensions: date, project, tester), hourly ETL from Postgres, custom dashboard builder (drag-drop, 4 widget types: chart/KPI/table/heatmap), cohort analysis (tester × sprint × pass-rate heatmap), traceability matrix (requirements → cases → runs → defects, XLSX/PDF export), quality KPI dashboard (DPPM, DRE, yield, MTBF), PDF/XLSX export (via Playwright + exceljs), scheduled email reports (Hatchet + Resend), report library with sharing, performance tuning (p95 <300ms API, <2s warehouse query), security pen-test remediation, WCAG 2.1 AA audit pass, capacity plan sign-off, Go/No-Go review  
**Exit Gate Met:** Warehouse queries p95 <2s, all 4 dashboard widgets functional, PDF/XLSX export streaming >500MB, scheduled reports sent ≥100 times, pen-test findings resolved, accessibility audit passed, load test 20 concurrent users, GA sign-off from Product + Engineering + Security  
**GA Window:** 2026-09-21, external signup enabled

**PM1 Exit Gate Summary:**
- MVP live to ≥2 Iksula pilots for ≥14 days
- ≤2% agent error rate (A1/A2/A4 top-layer accuracy)
- p95 API latency <500ms, p95 doc gen <60s, p95 RCA <10s
- 688%-class ROI demonstrated (cost_avoidance formula validated with pilot data)
- All 12 doc templates stable + pilot-tested
- Zero P0 defects open ≥7 days
- WCAG 2.1 AA audit passed
- Incident response runbook approved
- Legal: privacy policy, ToS, GDPR assessment documented

---

### [PM2] v1.5 Self-Healing + Test Data + Full Automation (M7–M12, 16 weeks)

**Phase Window:** 2026-09-22 (M7 start) → 2027-01-09 (v1.5 GA)  
**Duration:** 16 weeks (PM1 exit gap: 2 calendar days between GA 2026-09-21 and PM2 start 2026-09-22)  
**Scope:** Test Data Generation (A6), Self-Healing (A7), Risk-Adaptive Planning (A8 advanced), AI Product Tester (APT autonomous E2E), Visual Regression + Mobile + On-Prem  
**AI Agents Shipped:** A6 (M7), A7 (M8), A8 advanced (M9), APT (M10)  
**Team Allocation:** 10–12 FTE (extending PM1 team)  
**Current Completeness:** M7–M12 average 3–6/10 (skeleton scope + task outlines, missing full task breakdown, APIs, DB schema, test strategy, risk mitigation detail)  
**Wave 2 Target Completeness:** 10/10 (matching M0–M6 depth)

#### M7 (W1–3): Test Data Generation (A6)
**Window:** 2026-09-22 → 2026-10-10  
**Scope Summary:** Inline synthetic-data generation with provenance tracking, re-generate capability, version history, audit trail  
**Current Completeness:** 3/10 (scope articulated; task-breakdown outline only)  
**What's Missing (Wave 2):**
- Detailed task list (MS7-T001..T050+) with estimation
- A6 agent architecture (LangGraph flow: seed → generate → validate → commit → audit)
- Input/output schema (defect object + seed parameters → synthetic test data fixtures)
- DB changes (TB for synthetic_data_runs, synthetic_data_seeds, data_quality_metrics)
- API contracts (POST /api/synthetic-data/generate, GET /api/synthetic-data/{run_id}/history)
- Test strategy (golden-data validation, data-quality metric thresholds, ≥80% test-pass rate)
- Risk section (data leakage, Personally Identifiable Information in synthetic data, seed biases)
- Performance targets (data generation <5s per scenario, ≥1000 concurrent data-generation jobs)

#### M8 (W4–6): Test Maintenance Self-Healing (A7)
**Window:** 2026-10-13 → 2026-10-31  
**Scope Summary:** Background suggestions for failing tests, approve-in-context workflow (never silent auto-fix), 40% reduction in flaky-test rework  
**Current Completeness:** 3/10 (scope articulated; missing architectural detail)  
**What's Missing (Wave 2):**
- A7 LangGraph flow (observe failure → analyze logs/screenshots → suggest fixes → await human approval → apply + log)
- Input/output schema (failed-test logs + evidence → suggested fix proposals with confidence)
- DB changes (TB for suggested_fixes, fix_feedback, flakiness_signals)
- API contracts (GET /api/test-runs/{id}/fixes, POST /api/test-cases/{id}/fix-approval)
- Governance model (approval SLA: <24h for high-confidence fixes)
- Test strategy (A7 accuracy ≥70% across 200+ golden failing cases; approval rate ≥80%)
- Risk: Over-aggressive self-healing silently breaking tests → must have approval + audit trail

#### M9 (W7–8): A8 Advanced (Risk-Adaptive Planning)
**Window:** 2026-11-03 → 2026-11-14  
**Scope Summary:** Adaptive test strategy from historical defect patterns, risk scoring from code churn, auto-updated on PR  
**Current Completeness:** 3/10 (scope outline; missing algorithm detail)  
**What's Missing (Wave 2):**
- Risk-scoring formula (defect density per component × code-churn velocity × PR blast radius)
- Test-selection algorithm (rank test suites by risk coverage; suggest <60% of full suite for low-risk PRs)
- Data sources (defect history from TB-007, code-churn from GitHub API, test-case traceability from TB-005)
- API contracts (POST /api/risk-adaptive/score, GET /api/test-plans/adaptive/{pr_id})
- Integration with M14 (Test Selection A5); A8 advanced feeds risk scores to A5 ranker
- Test strategy (risk-score accuracy ≥75%; CI time reduction ≥30% vs. full suite)

#### M10 (W9–10): AI Product Tester (APT)
**Window:** 2026-11-17 → 2026-11-28  
**Scope Summary:** Autonomous end-to-end test execution, scenario discovery from user flows, exploratory testing automation  
**Current Completeness:** 1/10 (concept-stage; missing almost all detail)  
**What's Missing (Wave 2):**
- APT agent architecture (user-flow discovery → scenario generation → autonomous execution → evidence collection → reporting)
- Input/output schema (product definition + user personas → APT test scenarios + results)
- DB changes (TB for apt_test_scenarios, apt_execution_logs, apt_findings)
- API contracts (POST /api/apt/discover-flows, GET /api/apt/results/{scenario_id})
- Execution model (APT runs continuously in background; alerts on crashes/edge cases)
- Test strategy (APT ≥50% coverage expansion vs. manual cases; false-positive rate <5%)
- Risk: Over-automation reducing human QA judgment; APT tuned on pilot feedback only

#### M11 (W11–13): Visual Regression + Mobile + On-Prem
**Window:** 2026-12-01 → 2026-12-19  
**Scope Summary:** Visual-diff engine (in-house or partner), mobile app (iOS/Android via Capacitor), on-prem deployment (Helm chart + ops runbook)  
**Current Completeness:** 2/10 (scope outline; missing technical architecture)  
**What's Missing (Wave 2):**
- Visual-regression architecture (partner: Percy/Chromatic baseline uploads; fallback: in-house PixelMatch threshold)
- Mobile test matrix (iOS 14+, Android 11+; devices: iPhone 13/14/15, Samsung S22/S23)
- On-prem deployment (Helm chart for Oracle VM / Hetzner VM; persistent storage setup; backups; HTTPS/TLS)
- API contracts (POST /api/visual-diff/capture, GET /api/visual-diff/results)
- DB changes (TB for visual_baselines, visual_comparisons)
- Test strategy (visual-diff false-negative <2%; mobile test pass-rate ≥95%; on-prem uptime ≥99.5%)
- Operational burden (on-prem monitoring, log collection, upgrade paths for ≥5 customer instances)

#### M12 (W14–16): v1.5 GA + 32-Doc Catalog
**Window:** 2026-12-22 → 2027-01-09  
**Scope Summary:** Ship v1.5 GA; add 20 new doc templates (Advanced Automation, Data, Self-Heal categories)  
**Current Completeness:** 3/10 (deliverables list; missing doc-template definitions)  
**What's Missing (Wave 2):**
- All 20 doc template definitions (generation prompts, section outlines, example snapshots)
- v1.5 release checklist (feature flags disabled post-GA, rollback plan tested, on-call trained)
- v1.5 GA sign-off criteria (A6/A7/A8/APT top-layer accuracy ≥80%, ≥5 paying customers, self-healing reducing flaky rework ≥40%)
- Performance targets (p95 <300ms API, p95 data-generation <5s, p95 self-heal suggestion <10s)

**PM2 Exit Gate:**
- v1.5 GA signed off; external signup enabled
- ≥5 paying customers (with 14+ days telemetry)
- On-prem deployment validated at ≥1 customer
- 32 doc templates stable + customer-tested
- A7 self-heal blocking ≥40% of flaky-test rework
- A6 synthetic-data ≥80% test-pass rate
- Predictive analytics dashboard (A8 risk-scores) live

---

### [PM3] v2 Governance + Low-Code + Enterprise Foundation (M13–M18, 12 weeks)

**Phase Window:** 2027-01-12 (M13 start) → 2027-04-03 (v2 GA)  
**Duration:** 12 weeks  
**Scope:** Low-Code Authoring (A3), Test Selection (A5), Full Test Planning (A8 full), Vibe Code Governor (basic governance), Enterprise Auth (SSO/SAML/Slack ChatOps), 50-Doc Catalog  
**AI Agents Shipped:** A3 (M13), A5 (M14), A8 full (M15), VCG basic (M16)  
**Team Allocation:** 10–12 FTE  
**Current Completeness:** M13–M18 average 2–6/10 (scope + context outline; task-breakdown sketches only)  
**Wave 2 Target Completeness:** 10/10 (matching M0–M6 depth)

#### M13 (W1–3): Low-Code Authoring (A3)
**Scope:** Notion-style automation editor with drag-handles, slash commands; exports to Playwright/Selenium/Cypress/WebdriverIO  
**Current Completeness:** 6/10 (scope + context; missing UI spec detail)  
**Wave 2 Additions:**
- A3 editor UI mockups (TipTap + Slate for code blocks, drag-handle UI, slash-command menu)
- Export templates per framework (Playwright → TypeScript fixtures; Selenium → Java/Python; Cypress → JavaScript modules)
- DB schema (TB for automation_flows, flow_blocks, export_templates)
- API contracts (POST /api/automations/export, GET /api/automations/{id}/preview)
- Test strategy (export fidelity ≥95% execution match; IDE autocomplete integration)

#### M14 (W4–6): Test Selection (A5)
**Scope:** Change-based test subsetting, impact ranking, GitHub/GitLab Actions integration; 60% CI time reduction demo  
**Current Completeness:** 6/10  
**Wave 2 Additions:**
- Impact-ranking algorithm (code-change traceability to test cases via RTM; module-level diff + risk-score)
- GitHub/GitLab CI YAML integration (A5 outputs [case_ids] to matrix job; CI runs subset)
- API contracts (POST /api/test-selection/rank, GET /api/test-selection/impact-map)
- Test strategy (impact-ranking accuracy ≥85%; CI time reduction validation with ≥3 projects)

#### M15 (W7–8): Full Test Planning (A8 Full)
**Scope:** Auto-strategy from PRD alone, risk matrix generation, entry/exit criteria  
**Current Completeness:** 5/10  
**Wave 2 Additions:**
- A8 full architecture (ingest PRD → extract requirements → cross-reference with test cases → risk-matrix from defect history + code-metrics)
- Risk-matrix formula (likelihood = defect_frequency / req; impact = defect_severity_average; risk_score = likelihood × impact)
- Entry/exit criteria auto-generation (e.g., "Exit: all critical tests pass 2 consecutive runs; no P0 bugs; test coverage ≥80%")
- API contracts (POST /api/test-plans/auto-generate-from-prd, GET /api/risk-matrix/{plan_id})

#### M16 (W9–10): Vibe Code Governor (Basic)
**Scope:** Governance layer for AI-written code; audit trail for EU AI Act L6  
**Current Completeness:** 4/10  
**Wave 2 Additions:**
- VCG rule engine (code-analysis rules: max cyclomatic complexity 10, naming conventions, no hardcoded secrets, no unsafe patterns)
- Audit-trail schema (TB for vibe_code_reviews, vibe_violations, vibe_approvals)
- Governance UI (violations dashboard; merge-blocking policy; override workflow)
- API contracts (POST /api/vibe-governor/analyze-code, GET /api/vibe-violations)
- Compliance for EU AI Act L6 (every AI-written code change auditable, traceable, explainable)

#### M17 (W11): Enterprise Auth (SSO/SAML) + Slack ChatOps
**Scope:** Okta/Azure AD/Google Workspace SSO; Slack bot for case triage + /qanexus commands  
**Current Completeness:** 2/10  
**Wave 2 Additions:**
- SAML flow (IdP-initiated + SP-initiated, attribute mapping, JIT provisioning)
- Slack bot commands (/qanexus triage <case_id>, /qanexus create-case, /qanexus link-defect)
- Multi-IDP routing logic (org config selects IdP; users auto-routed on first login)
- API contracts (POST /api/auth/saml/callback, POST /api/slack/slash-command)

#### M18 (W12): v2 GA + 50-Doc Catalog
**Scope:** Ship v2 GA; add 18 new templates (Strategy, Governance, Enterprise categories)  
**Current Completeness:** 4/10  
**Wave 2 Additions:**
- All 18 doc-template definitions (Risk Matrix, Entry/Exit Criteria, Compliance Checklist, EU AI Act Evidence, Audit Trail, SSO Integration Guide, Migration Plan, etc.)
- v2 release checklist + sign-off criteria (A3/A5/A8/VCG production-ready; SSO live; Slack ChatOps beta; VCG violations <5/merge by week 3)
- SOC2 Type I audit timeline (engage auditor week 1, attestation target week 8)

**PM3 Exit Gate:**
- v2 GA signed off; external signup enabled
- ≥15 paying customers; ≥5 on-prem deployments
- SSO live (≥3 customers using Okta/Azure AD)
- VCG blocking merges with >5 violations
- 50 doc templates stable
- SOC2 Type I attestation initiated (report target Q2 2027)

---

### [PM4] v2+ Career Intelligence + Enterprise SaaS (Ongoing, W47+)

**Phase Window:** 2027-04-06 (W47) → ongoing  
**Duration:** Ongoing (no fixed exit gate)  
**Scope:** Career Compass (L7), Full 70-Doc Catalog (+20 templates), Cloud Device Grid (BrowserStack/LambdaTest hybrid), Multi-Tenant SaaS, Enterprise Compliance (HIPAA/GxP), White-Label  
**Team Allocation:** 12–15 FTE (ongoing hiring)  
**Current Completeness:** PM4 initiatives average 1–3/10 (concept notes; full charter details deferred to Wave 2–3)  
**Wave 2–3 Target Completeness:** 7+/10 (executable initiative charters)

#### Career Compass (L7)
**Timeline:** W47–52 (2027-04-06 → 2027-05-14)  
**Scope Summary:** Skills graph, job-market matching, salary benchmarking, learning paths  
**Current Status:** 2/10 (concept)  
**Wave 2 Work:**
- Career graph ontology (nodes: skills, certifications, job-titles, companies; edges: skill-prerequisite, title-progression, salary-correlation)
- Job-market data integration (partner with LinkedIn/Kaggle/Glassdoor for salary benchmarks, role trends)
- Learning-path generation (identify skill-gaps; recommend courses/certifications)
- Impact: Expand TAM from QA-Nexus-power-users to broader QA-profession career development

#### Cloud Device Grid
**Timeline:** W55–70 (2027-06-14 → 2027-10-08)  
**Scope Summary:** Partner integration (BrowserStack/LambdaTest) + hybrid self-host grid  
**Current Status:** 3/10 (concept)  
**Wave 2 Work:**
- Partner integration APIs (BrowserStack REST API for browser provision, Appium protocol for mobile)
- Fallback architecture (if partner unavailable, fall back to on-prem Selenium grid with 10–20 VMs)
- Device allocation algorithm (distribute load across partner + self-host; optimize cost)
- Risk: Competitive threat from BrowserStack; only build if demand exceeds partner pricing tolerance

#### Multi-Tenant SaaS
**Timeline:** W50–68 (2027-05-03 → 2027-09-24)  
**Scope Summary:** Per-org subdomain routing, row-level tenant isolation, tenant-scoped secrets  
**Current Status:** 3/10 (architecture sketch)  
**Wave 2 Work:**
- Data-isolation architecture (row-level tenant_id column + RLS policies on all tables; no cross-tenant data exposure)
- Subdomain routing (org.qanexus.io → route to org-specific database + app instance)
- Tenant-scoped secrets (each org stores Jira/GitHub/Slack tokens encrypted with org-specific key)
- Billing integration (usage-metering per org; seat limits)
- Migration strategy (PMM from single-tenant PostgreSQL to multi-tenant; zero-downtime data re-partitioning)

#### Enterprise Compliance (HIPAA / GxP)
**Timeline:** W55–72 (2027-06-14 → 2027-10-22)  
**Scope Summary:** HIPAA audit-trail, GxP 21 CFR Part 11 validation, multi-region data residency  
**Current Status:** 1/10 (concept)  
**Wave 2 Work:**
- HIPAA compliance (PHI handling controls, access logs, encryption at-rest + in-transit, breach-notification procedures)
- GxP compliance (test-case audit trail, immutable data records, electronic signature integration for FDA 21 CFR Part 11)
- Data residency (EU data in Frankfurt; US data in us-east-1; APAC data in ap-southeast-1)
- Audit timeline (engage auditor Q2 2027; HIPAA BAA target Q3 2027; GxP report target Q4 2027)

#### White-Label
**Timeline:** W65–75 (2027-09-03 → 2027-11-19)  
**Scope Summary:** Customer branding, custom domains, embeddable QA Nexus widgets  
**Current Status:** 2/10 (concept)  
**Wave 2 Work:**
- White-label deployment (customer uploads logo + color scheme + custom domain cert; QA Nexus renders with branding)
- Embeddable widgets (SDN for partner sites; test-results iframe + defect tracker iframe; authentication via API key)
- License key validation (API-based key checking; entitlements per feature)
- Pricing model (white-label add-on: +$X/month per customer; up to N embedded domains)

**PM4 Ongoing Gate:**
- No fixed exit gate; quarterly business reviews + roadmap adjustments
- Target: ≥50 customers by end of 2027; ≥$X MRR

---

## 4. Wave 1 Audit Remediation (2026-04-23)

**Fixes Applied (Completed):**

1. **M4 Predecessor Context** — `/Milestone/M4/Milestone_M4_Runs_Defects_Jira.md` L61–103
   - Old: "M1 = Knowledge Base + Documents (WRONG), M2 = Test Cases (WRONG), M3 = Test Execution + Jira (WRONG)"
   - New: "M0 = Setup & Infrastructure, M1 = Users & Roles, M2 = Test Documents & Knowledge Base (KB first-class, 12 templates), M3 = Test Cases & AI Generation (A1 Test Case Gen, A2 Dedup, RTM), M4 = Runs, Defects & Jira (Test Runs + evidence, A4 5-layer RCA, Jira 2-way)"
   - Impact: Downstream teams now have correct understanding of M4's dependencies

2. **M6 Predecessor Context** — `/Milestone/M6/Milestone_M6_Full_Reports_GA.md` L63–148
   - Old: M0–M5 recap with mixed-order and outdated scope labels
   - New: Complete M0–M5 recap with canonical scope per MILESTONE_REGISTRY (M2=Docs/KB, M3=TestCases, M4=Runs/Defects/Jira, M5=Playwright/BasicReports, etc.)
   - Impact: M6 team now sees correct feature baseline for GA hardening work

3. **SYNC_REPORT.md → Project-Level** — `/Milestone/SYNC_REPORT.md` (new v2.0, 800+ lines)
   - Old: MVP-scoped sync report (1,041 lines, claims "all green" on PM2/PM3 swap, outdated M4–M6 drift claims)
   - New: Project-level sync covering PM1–PM4, with per-phase depth breakdown, status (Green/Amber), Wave 2 targets, phase-by-phase detail (15–30 lines per milestone/initiative)
   - Archive: `/Milestone/SYNC_REPORT_MVP_ARCHIVE.md` (1,041 lines, kept for historical reference)
   - Impact: Leadership now has honest project-wide sync status instead of misleading MVP-only green

4. **FINAL_REVIEW.md → Project-Level** — `/Milestone/FINAL_REVIEW.md` (new v2.0, 600+ lines)
   - Old: MVP documentation suite final review (496 lines, evaluates M0–M6 only)
   - New: Project-level final review covering PM1–PM4, per-phase readiness analysis, post-Wave-1 baseline
   - Archive: `/Milestone/FINAL_REVIEW_MVP_ARCHIVE.md` (496 lines, kept for historical reference)
   - Impact: Leadership now has project-scope readiness assessment instead of MVP-only verdict

---

## 5. Wave 2 Audit Remediation (In-Progress, Target Completion 2026-05-05)

**Scope:**

1. **M7–M18 Expansion to MVP-Level Detail**
   - Expand each of M7–M12 (PM2) and M13–M18 (PM3) from 3–6/10 to 10/10 completeness
   - Template: context (predecessors), scope, technical stack, definition of ready, tasks (MS#-T###), acceptance criteria (MS#-AC###), APIs, DB changes, tests, risks, rollback, exit criteria, handoff
   - Target line count: 1,100–1,400 lines per milestone (matching M0–M6 depth)

2. **PM4 Initiative Charters**
   - Expand all 6 PM4 initiatives from 1–3/10 to 7+/10 (full executable charters, not concept notes)
   - Charter template: context, scope (timeline, deliverables), tasks, APIs, DB, tests, risks, exit criteria, success metrics
   - Target: 300–500 lines per initiative

3. **PM2/PM3 Swap Propagation**
   - Update QA_Nexus_Master_Brainstorm.md §17 (post-MVP waves) to reflect current PM2=self-healing, PM3=governance order
   - Rewrite project_analysis.md as project-level analysis (currently still MVP pre-PRD analysis)
   - Update all PRD user-story phase tags to match roadmap (some still show old PM2=governance labels)
   - Update ERD service groups and table blocks (PM2/PM3 currently reversed in SQL sections)

4. **M4/M6 Downstream Reference Fixes**
   - Search M4 and M6 docs for any remaining references to "M1=KB" or "M2=Test Cases" patterns; correct to canonical names
   - Ensure all M0–M6 docs use consistent terminology (e.g., "M2 = Test Documents & Knowledge Base — Core Doc Catalog (12 templates)")

---

## 6. Known Open Issues (Wave 3+, Q2 2027)

1. **DOCX Parity for M0–M6** — Milestone DOCX files 30–50% of markdown line count; full regen needed
2. **Evidence Posture Tightening** — Market/ROI claims need verification annotations
3. **FR ID Retirement (FR-046..049)** — Clarify whether retired or should be restored
4. **Qdrant vs pgvector Direction** — ERD mentions "Qdrant migration path" without canonical roadmap support

---

## 7. Downstream Sync Checklist

**Whenever PROJECT_ROADMAP.md changes, these documents must be re-checked:**

| Document | Verify | Owner | Frequency |
|----------|--------|-------|-----------|
| MILESTONE_REGISTRY.md | Duration cells, windows, agent phases, layer progression | PM | On roadmap change |
| SYNC_REPORT.md | Project-level scope, PM2/PM3 swap, wave status | PM | Weekly |
| FINAL_REVIEW.md | Audit covers all PMx, readiness per-phase | Head of Eng | Post-audit |
| PRD/PRD.md | Duration, persona phase tags, layer progression, US phase tags | Product Lead | On change |
| ERD/ERD.md | Service groups, tables, migration sequencing, agent phases | Tech Lead | On change |
| Brainstorm §17 | Post-MVP wave labels, agent ship tags | PM | Post-Wave-2 |
| project_analysis.md | Project-level framing (not MVP pre-PRD) | PM | Post-Wave-2 |
| MVP_PRD.md | PM1 scope pillars match sub-milestone table | Product Lead | On change |
| All M*.md | Predecessor/handoff labels match registry order | Milestone Lead | Post-Wave-2 |
| All PM4 initiatives | Phase tagged PM4 (not PM2 or PM3) | PM | Post-Wave-2 |

---

## 8. Changelog

| Date | Version | Change | Author |
|------|---------|--------|--------|
| 2026-04-22 | v1.0 | Initial MVP sync report (1,041 lines). Audit-driven, scope M0–M6 only. | Claude |
| 2026-04-23 | v2.0 | **Archived MVP sync report to `SYNC_REPORT_MVP_ARCHIVE.md`. Created project-level sync covering PM1–PM4.** Wave 1 audit fixes applied: M4/M6 predecessor context rewritten, SYNC_REPORT/FINAL_REVIEW replaced with project-level versions. Phase-by-phase breakdown: PM1 Green/execution-ready, PM2 Amber/3–6/10 completion, PM3 Amber/2–6/10 completion, PM4 Amber/1–3/10 completion. Wave 2 targets listed (M7–M18 expansion, PM4 charters, doc-swap propagation). Known Wave 3+ issues catalogued. | Claude |

---

**End of QA Nexus — Project-Level Sync Report (v2.0)**
