---
title: QA Nexus — Product Requirements Document (Project-Level v2.10)
subtitle: AI-Native Operating System for the QA Profession
version: 2.10
status: Project-Level, Locked (PM1-PM4 Scope)
created: 2026-04-22
updated: 2026-04-25 (v2.10 — PM1 UI 41-frame closure: F28m1 LLM Provider Configuration + F26m1 Agent Model Assignment added for Day-0 LLM config flow; PM1 free-OSS tech stack locked at v2.9; header metadata synced from stale v2.1/2.3/v2.6 markers to v2.10)
scope: Full product program (PM1 → PM4, ~18 months)
organization: Iksula Services Pvt Ltd
canonical_source: PROJECT_ROADMAP.md v1.1
---

# QA Nexus — Product Requirements Document (Project-Level v2.10)

## Document Control

| Field | Value |
|---|---|
| Product | QA Nexus |
| Document Type | Project-Level PRD (PM1-PM4) |
| Audience | Leadership, Product, Engineering, Design, QA, Strategy |
| Scope | Full 18-month+ product program: MVP (PM1) + v1.5 (PM2) + v2 (PM3) + v2+ (PM4) |
| Purpose | Define phased requirements, acceptance criteria, and deliverables across all four project milestones |
| Relationship to Canonical Docs | Authority: PROJECT_ROADMAP.md v1.1 (phase dates, scope, agent ownership); MILESTONE_REGISTRY.md v3.0 (PM1 sub-milestone detail M0-M6); QA_Nexus_Master_Brainstorm.md (historical vision + feature catalog) |
| Primary Outcome | Align leadership and execution on phase-gated delivery, AI agent rollout, doc template progression, and success metrics across PM1-PM4 |

---

## 1. Executive Summary (Project-Level)

QA Nexus is the **AI-native operating system for the QA profession**. This PRD covers the full 18-month product program—four project milestones (PM1 through PM4) spanning 70 document templates, 10 AI entities, and 7-layer architecture evolution.

The product collapses 8–10 fragmented tools (Jira, TestRail, Confluence, Excel, GitHub, Slack, Jenkins, email) into one workspace where QA teams plan, author, execute, triage, and report without context switching. Every user in QA Nexus becomes "AI-native by default," with autonomous agents handling mechanical work while humans focus on judgment and strategy.

### Program Overview (4 Phases)

| Phase | Name | Duration | GA Date | Headline Scope | AI Agents | Docs | Customers |
|---|---|---|---|---|---|---|---|
| **PM1** | **MVP — Test Management Beachhead** | 21 wk (18 build + 3 GA) | 2026-09-21 | Test Case Management, Integrations (Jira 2-way, GitHub/GitLab, Slack, Confluence, Figma), Bug Management (A4 5-layer RCA), Basic Reporting, Core Doc Catalog (12 templates) | **A1, A2, A4** (3) | 12 of 70 | 2–3 pilots |
| **PM2** | **v1.5 — Self-Healing + Test Data + Full Automation** | 16 wk | 2027-01-09 | Autonomous test maintenance, synthetic data generation, AI Product Tester, visual regression, on-prem deployment, mobile app | **+A6, +A7, +A8 adv, +APT** (7 total) | 32 of 70 | 5–8 customers |
| **PM3** | **v2 — Low-Code + Governance + Enterprise Foundation** | 12 wk | 2027-04-03 | Low-code test authoring, change-based test selection, full test planning, governance foundation (Vibe Code Governor), SSO/SAML, Slack ChatOps, EU AI Act foundation | **+A3, +A5, +A8 full, +VCG** (11 total) | 50 of 70 | 15+ customers |
| **PM4** | **v2+ — Career Intelligence + Enterprise SaaS** | Ongoing | 2027-04-06+ | Career Compass (L7), full 70-doc catalog, multi-tenant SaaS, Cloud Device Grid, HIPAA/GxP compliance, white-label, multi-region data residency | Ongoing expansion | 70 of 70 | 50+ customers |

### Key Numbers (Program End State)

- **18-month timeline:** April 2026 → April 2027 + ongoing
- **$166.91B market *(third-party market research; exact figures vary by source and year)*** (autonomous testing, CAGR 19.8%)
- **10 AI entities:** A1-A8 (8 agents), Vibe Code Governor, AI Product Tester
- **70 document templates** (12 → 32 → 50 → 70 progression)
- **7-layer architecture** (L1 unified platform → L7 career intelligence)
- **Target customers:** 2–3 pilots (PM1) → 5–8 (PM2) → 15+ (PM3) → 50+ (PM4)

### The Three Crises Driving QA Nexus

**Framing note:** The figures cited below are drawn from third-party market sources and internal working hypotheses. They provide strategic context for the vision; they are not yet pilot-measured facts.

**Crisis 1: Tool Fragmentation** — QA teams juggle 8–10 tools daily (Jira, TestRail, Confluence, Excel, GitHub, Slack, Jenkins). ~45 minutes/day lost to context switching. No single source of truth; traceability breaks between systems.

**Crisis 2: AI Code at Scale Without QA** — Industry reports suggest AI-generated code has higher bug and security vulnerability rates than human code. QA is often the most-skipped step in AI workflows; vibe-coding produces untested code at speed.

**Crisis 3: Profession Fear Crisis** — Market research indicates QA professionals report concerns about AI displacement and salary progression. The EU AI Act enforcement 2026–2027 (max fine: 3% global revenue for high-risk systems) creates regulatory urgency.

**QA Nexus solves all three:** unified workspace, AI agents embedded in QA workflows to make humans irreplaceable, governance + compliance built-in.

---

## 2. Product Milestone Overview (Project-Level Table)

**Canonical dates and scope per PROJECT_ROADMAP.md v1.1:**

| ID | Name | Start | End | Duration | Headline Scope | AI Agents Added | Doc Templates | Architecture Layers |
|----|------|-------|-----|----------|------------------|---|---|-----|
| **PM1** | MVP — Test Management Beachhead | 2026-04-27 | 2026-09-21 | 21w (18 build + 3 GA) | Pilot-ready QA Nexus: Test Case Management (Notion editor, BDD+traditional, RTM), Integrations (Jira 2-way, GitHub/GitLab, Slack, Confluence, Figma), Bug Management (A4 5-layer RCA, 4-category classification), Basic Reporting (Daily/Weekly/Sprint/Release + Executive Dashboard + ROI), Core Doc Catalog (12 of 70 templates) | **A1, A2, A4** (3) | **12 of 70** | L1+L2+L3(12)+L4(3)+L5(lite) |
| **PM2** | v1.5 — Self-Healing + Test Data + Full Automation | 2026-09-22 | 2027-01-09 | 16w | Extends PM1 test execution with autonomous test maintenance, synthetic data, AI Product Tester, visual regression, on-prem deployment, mobile app (iOS/Android Capacitor) | **+A6, +A7, +A8 advanced, +APT** (7 total) | +20 = **32 of 70** | +L1(on-prem+mobile) +L2(full GraphRAG) +L5(predictive analytics) |
| **PM3** | v2 — Low-Code + Governance + Enterprise Foundation | 2027-01-12 | 2027-04-03 | 12w | Adds low-code test authoring, change-based test selection, full test planning, governance foundation (Vibe Code Governor basic), SSO/SAML, Slack ChatOps, EU AI Act + SOC2 + ISO27001 foundation | **+A3, +A5, +A8 full, +VCG** (11 total) | +18 = **50 of 70** | +L1(SSO/SAML, Slack bot) +L5(full dashboards) +**L6(EU AI Act, SOC2, ISO27001)** |
| **PM4** | v2+ — Career Intelligence + Enterprise SaaS | 2027-04-06 | Ongoing | Ongoing | Career Compass, full 70-doc catalog, Cloud Device Grid (partner or self-host), multi-tenant SaaS, HIPAA/GxP (FDA 21 CFR Part 11), multi-region data residency, white-label | Ongoing expansion | **70 of 70** | +**L7 Career Intelligence** +L6(GxP, multi-region) +L1(multi-tenant) |

---

## 3. Personas & Jobs-to-be-Done (7 Core Personas)

### Personas (L1-L5 Seniority Levels)

**1. Junior QA Engineer (L1, 0–3 years)** — Show me what I need to test today, help me write cases fast, keep me learning. Pains: manual case authoring, duplicates, skill gaps. Uses: A1 Test Case Generator, A2 Dedup chips, Knowledge Base, global search.

**2. Senior QA Engineer (L2, 3–7 years)** — Architect test strategy, author test plans, triage failures fast. Pains: tool fragmentation, manual test planning, flaky tests. Uses: A8 Test Planning, A4 RCA, A7 Self-Healing [PM2], Jira 2-way sync.

**3. QA Lead / Manager (L3, 8–15 years)** — Own project QA, approve strategies, see team performance, report to management. Pains: status reporting, team visibility, ROI proof. Uses: ROI Dashboard, auto-reports, Knowledge Vault, audit log, release RAG.

**4. Test Automation Engineer (L2–L3, 3–10 years)** — Write automated tests fast, debug failures, keep CI/CD fast, reduce flaky tests. Pains: syntax friction, maintenance burden. Uses: A3 Low-Code Authoring [PM3], A7 Self-Healing [PM2], A5 Test Selection [PM3], Playwright integration.

**5. Product Manager / Stakeholder (Executive)** — See release readiness, understand QA risks, prove ROI of QA investment. Pains: QA numbers don't speak to business, release readiness opaque. Uses: Exec Dashboard, ROI formula, release RAG, drill-down analytics.

**6. QA Head / VP (L4–L5, 15+ years)** — Portfolio management, strategic compliance, team scaling, career development pathways. Pains: team growth visibility, compliance complexity, budget justification. Uses: Executive Dashboard, ROI at scale, Career Compass (PM4), multi-org analytics (PM4), compliance reporting.

**7. CTO / Security Lead** — Ensure compliance, audit trail, governance, no silent AI changes. Pains: unchecked AI agents, audit traceability, regulatory risk. Uses: Vibe Code Governor [PM3], Agent Governance Dashboard [PM3+], Audit Log, EU AI Act + SOC2 + HIPAA evidence packs (L6 foundation [PM3], advanced [PM4]).

### Primary JTBDs (Ranked by Frequency)

1. "Show me what I need to test today" → personalized dashboard, assigned cases, due reports
2. "Let me write a test case without fighting the form" → fast BDD/traditional editor, AI assist, keyboard shortcuts
3. "Log a bug in <60 seconds and sync to Jira" → prefilled defect form, Jira 2-way sync, one-click
4. "Run a suite and record results quickly" → one-row-per-case execution view, quick-status, screenshot paste
5. "Generate the daily/weekly report without assembling by hand" → templated, auto-populated
6. "Find the test or bug I wrote last week" → global search, semantic matching, cmd-k
7. "Know if this defect is a duplicate before I file it" → live duplicate detection, semantic matching
8. "Understand why a test failed without manual hunting" → 5-layer RCA, environment/code/data context
9. "See if my QA work is actually protecting customers" → ROI calculator, business KPI alignment
10. "Prove to management that QA is worth the investment" → Exec Dashboard, release RAG, cost avoidance number

---

## 4. PM1 Feature Pillars (Explicit Scope Expansion)

**New in v2.1: PM1 now explicitly calls out 5 Feature Pillars.** These were implicit in previous scope; now explicit for clarity and traceability.

### PM1-P1: Test Case Management (Delivery: M3)

**Scope:** Notion-style TipTap editor, BDD + traditional modes, tags, priority, linked requirements, case versioning, RTM (Requirements Traceability Matrix).

**Components:**
- **Multi-view authoring:** Tree (case hierarchy), List (flat cases), Detail (full steps)
- **BDD format:** `Given... When... Then...` + traditional format `Precondition / Steps / Expected Result`
- **Requirement linking:** Link case to PRD/Jira requirement; bidirectional RTM
- **Tagging & priority:** Custom tags (smoke, regression, performance, etc), P0-P4 priority
- **AI-assisted authoring:** A1 Test Case Generator triggered on requirement; Clarification Questions gate if confidence <80%; A2 Dedup live chips while typing
- **Bulk import:** CSV, TestRail, Zephyr, Xray, qTest native exports (field mapping UI + validation preview)
- **Versioning & audit:** Every case version tracked; change history visible; audit trail logged

**Acceptance Criteria:**
- AC1: Notion-style editor (blocks, keyboard nav, keyboard shortcuts for formatting)
- AC2: BDD + traditional modes supported; user toggles between modes; export to Gherkin
- AC3: A1 case generation triggered on requirement card; Clarification Questions gate shown if confidence <80%
- AC4: A2 dedup chips appear live while authoring new case; shows match %, allows merge/dismiss
- AC5: Bulk import preview shows ≥80% field mapping confidence before commit
- AC6: RTM visible (which requirements tested, which untested); drill-down to requirements
- AC7: Case versioning (≤10 changes per case tracked); restore to prior version available
- AC8: ≥10 cases generated in <30s by A1; manual review not required if confidence ≥80%

**Sub-milestone Mapping:** M3 (3 weeks) — full test case CRUD, A1+A2 agents live, ≥80-case library seeded

**Success Metrics (GM-IDs):**
- GM-002: Reduce test case authoring time by 50% vs manual (2h → 1h per 10 cases)
- GM-003: Achieve A1 confidence auto-approve rate ≥80% (≥80% of cases bypass review)
- GM-005: Establish reusable QA memory across 3 pilots (12 doc templates stable, KB indexing working)

---

### PM1-P2: Integrations (Delivery: M0 / M3 / M4 / M5)

**Scope:** Jira 2-way OAuth, GitHub/GitLab webhook, Slack notifications, Confluence read/write, Figma context.

**Components:**
- **Jira 2-way sync (M4/M5):** OAuth 2.0 3-legged flow; webhook + 2-min poll fallback; defect creation in QA Nexus → issue in Jira; status/assignee/comment mirroring both ways; field mapping UI
- **GitHub/GitLab CI integration (M4/M5):** Webhook receiver on push/PR events; test result ingestion (JUnit XML); artifact collection (screenshots, logs); integration health widget
- **Slack notifications (M4/M5):** Outbound only in PM1 (defect filed, approval requested, test run complete); inbound ChatOps deferred to PM3
- **Confluence read/write (M2/M5):** Inbound: fetch PRD for A1 context in M2; Outbound: write generated reports as Confluence pages in M5
- **Figma context (M2/M3):** Inbound design context for A1 test generation (screenshots, design specs, user flows)

**Acceptance Criteria:**
- AC1: Jira OAuth 3-LO working (user authorizes, token stored encrypted, refresh automatic)
- AC2: Defect created in QA Nexus syncs to Jira within 30s; Jira issue ID shown in QA Nexus UI
- AC3: Status change in Jira (e.g., "Fixed") reflected in QA Nexus within 2 minutes (webhook) or 2-min poll
- AC4: Comments on Jira issue appear in QA Nexus; comments in QA Nexus appear in Jira
- AC5: GitHub/GitLab webhook receiver listens on PR events; test results ingested into QA Nexus automatically
- AC6: Integration health widget (M8) shows Jira/GitHub/Slack/Confluence status, last sync time, error log
- AC7: Zero orphaned or duplicate defects in 4-week live sync test with pilot

**Sub-milestone Mapping:** M0 (infra), M3 (GitHub hook), M4 (Jira 2-way), M5 (basic reports to Slack)

**Success Metrics (GM-IDs):**
- GM-009: Execute reliable 2-way Jira sync (zero orphaned or duplicate defects in 4-week live test)
- GM-013: Integrate with 4 primary systems (Jira, GitHub/GitLab, Slack, Confluence all live by M5)

---

### PM1-P3: Bug Management (Delivery: M4)

**Scope:** Defect creation form prefilled from failing test run, A4 Defect Intelligence 5-layer RCA (Stack → Env → Config → Code → Data), 4-category classification (App / Test / Flaky / Env), evidence auto-capture, semantic duplicate detection.

**Components:**
- **Defect creation form (M4):** Title, description, severity (P0-P4), environment selector, reproduction steps, attachments, links to test run + evidence
- **Auto-prefill from run:** Form populated from failing test result (failure message, test title, environment, assignee suggested)
- **A4 Defect Intelligence (M4):** 5-layer RCA pipeline: Layer 1 Stack Trace (90% confidence) → Layer 2 Environment (80%) → Layer 3 Config (60%) → Layer 4 Code (50%) → Layer 5 Data (40%); outputs 4-category classification (App / Test / Flaky / Env)
- **Evidence auto-capture (M4):** At test failure, capture screenshot (full page), console logs (last 500 lines), HAR file (network timing), environment snapshot (config JSON, versions)
- **Semantic duplicate detection (M4):** When defect filed, pgvector search for semantically similar past defects (not keyword matching); confidence % shown; merge option available
- **Jira 2-way sync (M4/M5):** On save, defect pushed to Jira; issue key linked back to QA Nexus; status/assignee/comment sync ongoing

**Acceptance Criteria:**
- AC1: Defect form accessible from failed test result; auto-populated with failure context (test title, error message, environment)
- AC2: A4 RCA triggered on defect creation; outputs 5-layer analysis with confidence scores per layer
- AC3: Classification (App / Test / Flaky / Env) shown prominently; user can override + provide reasoning
- AC4: Evidence auto-captured at failure: screenshot, console logs, HAR, env snapshot all present
- AC5: Semantic duplicate check runs on save; ≥1 candidate past defect shown if match confidence ≥70%
- AC6: Jira 2-way sync: defect → issue (≤30s latency); status change in Jira reflected in QA Nexus (≤2min)
- AC7: Defect RTM linkage: defect linked to test case, which linked to requirement; traceability chain visible

**Sub-milestone Mapping:** M4 (3 weeks) — full Defect CRUD, A4 RCA agent, Jira 2-way sync

**Success Metrics (GM-IDs):**
- GM-004: Deliver A4 RCA that covers ≥60% of failure categories (4 of 5 RCA layers operable at M5)
- GM-009: Execute reliable 2-way Jira sync (zero orphaned or duplicate defects in 4-week live test)

---

### PM1-P4: Basic Reporting (Delivery: M5-M6)

**Scope:** Templated auto-filled reports (Daily, Weekly, Sprint, Release) + Executive Dashboard with ROI calculator.

**Components:**
- **Daily Status Report (M5):** Auto-filled from test run + defect data: cases run, passed, failed, blocked. Customizable summary text. Export to PDF, send to Slack/email. Template-based layout.
- **Weekly Summary (M5):** Cases by status, defects by severity, defect escape trend, key highlights. Stakeholder-ready layout. Stakeholder dashboard (read-only view of reports due).
- **Sprint Sign-off (M5):** Sprint goals vs outcomes, coverage achieved, defects found/escaped, risk assessment. Approval workflow (QA Lead signs off).
- **Release Readiness Report (M6):** Pass rate, test coverage, defects by severity, critical defects breakdown, release RAG (Red/Amber/Green based on user-defined quality gates). Executive summary.
- **Executive Dashboard (M6):** Single-screen view: pass rate trend (3-month), defect count trend, coverage %, release RAG (Red/Amber/Green), cost avoidance (defects caught × stage multiplier where stage_multiplier = {requirements:$200, design:$1K, build:$2.2K, prod:$14.6K}). ROI % shown (688% *(pilot target based on market research; actual outcomes to be validated)* example formula visible).
- **ROI Calculator (M6):** Configurable cost model. Inputs: defects caught, stage detected. Output: ROI % = (cost_avoidance / QA_investment_cost) × 100. Example: 688% *(pilot target based on market research; actual outcomes to be validated)* ROI from 18-week MVP cost.
- **Personal Dashboard (M5):** My assigned test cases, my filed defects, approvals awaiting my action, reports due to me.

**Acceptance Criteria:**
- AC1: Daily report auto-generates from run data in <5s; template-based (user selects template, fields auto-populate)
- AC2: Weekly/Sprint/Release reports auto-generate in <10s; all fields populated; user can customize summary text
- AC3: Executive Dashboard loads in <2s; pass rate trend, defect count, coverage, RAG all visible on single screen
- AC4: ROI calculator formula visible + editable (cost per stage customizable); default 688% example shown
- AC5: Report export to PDF preserves formatting; images embedded; send via email or Slack integration available
- AC6: Release RAG: Green if pass rate ≥95%, defect P0 count = 0; Amber if pass rate 85-94%, P0 count ≤2; Red otherwise
- AC7: Quality gates: user defines gates (e.g., "pass rate ≥95% to release"); dashboard shows gate status

**Sub-milestone Mapping:** M5 (basic reports), M6 (Executive Dashboard + ROI)

**Success Metrics (GM-IDs):**
- GM-008: Demonstrate 688%-class *(pilot target)* ROI to leadership (ROI formula + cost-avoidance model live in dashboard)
- GM-023: Generate executive-ready reports (pass rate, defect trend, coverage, release RAG, ROI all visible on one screen)

---

### PM1-P5: Core Doc Catalog (12 of 70 templates, Delivery: M2)

**Scope:** 12 document templates generated via Document Intelligence Layer with section-level confidence scoring, PDF export, versioning, @mentions, comments.

**Template Categories:**

| Category | Templates | Count |
|----------|-----------|-------|
| **Planning** | Test Plan, Test Strategy, Test Estimation | 3 |
| **Execution** | Daily Status Report, Weekly Status Report, Sprint Sign-off, Release Readiness Report | 4 |
| **Defect & Analysis** | Defect Report, Root Cause Analysis (RCA), Exploratory Testing Charter | 3 |
| **Automation & Regression** | Regression Test Outline, Requirements Traceability Matrix (RTM) | 2 |

**Components:**
- **Document generation (M2):** User selects template → provides 5-field context form (PRD excerpt, scope, environment, team size, risk level) → A1 context-gathering agent reads KB + past project context → template sections auto-populated in <30s
- **Section-level confidence scoring:** Each section shows confidence % (e.g., "Test Plan: 85% confidence"). Low-confidence sections flagged for manual review.
- **Approval workflow (M2):** Draft → Lead review → Approved. Status transitions tracked.
- **PDF export (M2):** Professional layout, images embedded, versioning footer, @mention resolution
- **Versioning + comments (M2):** Track every version; restore to prior version; comments with @mentions (notifications sent)
- **Knowledge Vault context (M2):** When generating doc, system retrieves 3 most-similar past projects + templates; surfaces relevant KB articles; "Reading from KB" chip shown

**Acceptance Criteria:**
- AC1: Document template selector shows 12 templates; user selects one
- AC2: Context form (5 fields) guides user; on submit, document generation triggered (async via Hatchet)
- AC3: A1 context agent reads Knowledge Base; retrieves ≥2 relevant past projects; embeds context in sections
- AC4: Generated doc ready in <30s; section confidence scores visible (≥80% green, 60-80% amber, <60% red)
- AC5: Approval workflow: user marks as Draft, Lead receives notification, Lead reviews + approves, status changes to Approved
- AC6: PDF export generates professional doc (page breaks, images, table of contents); email delivery available
- AC7: Version history: user can see all versions, restore to prior version, comment on any version with @mentions
- AC8: 12 templates stable (coverage + quality validated with pilots); KB seeded with ≥5 example projects

**Sub-milestone Mapping:** M2 (3 weeks) — Document Intelligence Layer, 12 templates, RAG pipeline, PDF export, approval workflow

**Success Metrics (GM-IDs):**
- GM-005: Establish reusable QA memory across 3 pilots (12 doc templates stable, KB indexing working)
- GM-011: Build knowledge-base RAG pipeline (pgvector + BGE embeddings + retrieval working)

---

## 5. PM1 (MVP) Functional Requirements (FR-IDs, Phase-Tagged)

| FR-ID | Requirement | Priority | Pillar | Notes |
|---|---|---|---|---|
| FR-001 [PM1] | Platform shall provide project-scoped workspaces with RBAC (Admin/Lead/QA/Mgmt) | Must | — | M0-M1 delivery |
| FR-002 [PM1] | Platform shall ingest and version QA source documents (PRD, design) | Must | P5 | M2 delivery |
| FR-003 [PM1] | Platform shall generate test cases via A1 from PRD/Jira/Figma context | Must | P1 | M3 delivery, CQ gate, ≥80% confidence auto-approve |
| FR-004 [PM1] | Platform shall detect semantic duplicate test cases via A2 with confidence scoring | Must | P1 | M3 delivery, live chips, bulk audit |
| FR-005 [PM1] | Platform shall support test case authoring (BDD + traditional formats) | Must | P1 | M3 delivery, Notion-style editor |
| FR-006 [PM1] | Platform shall maintain bidirectional requirement-to-test traceability (RTM) | Must | P1 | M2 delivery |
| FR-007 [PM1] | Platform shall support manual test execution with quick-status entry | Must | — | M4 delivery |
| FR-008 [PM1] | Platform shall capture/associate evidence (screenshots, logs, HAR, env snapshots) with failures | Must | P3 | M4 delivery, auto-capture at failure |
| FR-009 [PM1] | Platform shall enrich defects via A4 (5-layer RCA + 4-category classification) | Must | P3 | M4 delivery |
| FR-010 [PM1] | Platform shall sync defects bidirectionally with Jira via OAuth 2.0 + webhooks | Must | P2 | M4-M5 delivery |
| FR-011 [PM1] | Platform shall provide operational reporting (Daily, Weekly, Sprint, Release) | Must | P4 | M5 delivery |
| FR-012 [PM1] | Platform shall provide executive-grade dashboard (pass rate, release RAG, ROI) | Must | P4 | M6 delivery |
| FR-013 [PM1] | Platform shall maintain immutable audit log of all user + agent actions | Must | — | M0-M8 delivery |
| FR-014 [PM1] | Platform shall provide knowledge base with first-class storage + approval workflow | Must | P5 | M2 delivery |
| FR-015 [PM1] | Platform shall retrieve similar historical cases/defects/plans via pgvector RAG | Should | — | M2 delivery (post-GA scope) |
| FR-016 [PM1] | Platform shall expose global search (cmd-k) across cases, defects, docs, KB | Should | — | M5 delivery |
| FR-017 [PM1] | Platform shall import test results from CI (Playwright, Cypress, Selenium via webhook) | Should | — | M4 delivery |
| FR-018 [PM1] | Platform shall monitor integration health (Jira, GitHub, Slack, Confluence) | Should | — | M8 delivery |
| FR-019 [PM1] | Platform shall support bulk import of test cases from CSV, TestRail, Zephyr, Xray, qTest | Should | P1 | M3 delivery |
| FR-020 [PM1] | Platform shall export test cases, defects, reports to CSV/PDF/Excel | Should | P4 | M6 delivery |
| FR-021 [PM1] | Platform shall capture exploratory testing sessions with step timeline | Could | — | M4 delivery (post-GA) |
| FR-022 [PM1] | Platform shall support test plan generation (partial A8) from PRD | Should | P5 | M2 delivery (lightweight) |
| FR-023 [PM1] | Platform shall display A1/A2/A4 confidence scores on all outputs | Must | — | M3 delivery |
| FR-024 [PM1] | Platform shall accept user feedback (thumbs up/down) on agent outputs | Should | — | M6 delivery |
| FR-025 [PM1] | Platform shall show agent activity feed (e.g., "A1 generated 12 cases") | Should | — | M6 delivery |
| FR-026 [PM1] | Platform shall support multi-user simultaneous editing of test cases | Should | P1 | M3 delivery |
| FR-027 [PM1] | Platform shall version control all artifacts (cases, defects, docs) | Must | — | M2 delivery |
| FR-028 [PM1] | Platform shall integrate with Jira (create, read, update, delete defects) | Must | P2 | M4-M5 delivery |
| FR-029 [PM1] | Platform shall integrate with GitHub/GitLab (webhook + artifact collection) | Should | P2 | M4 delivery |
| FR-030 [PM1] | Platform shall integrate with Slack (notifications) | Should | P2 | M5 delivery |
| FR-031 [PM1] | Platform shall integrate with Confluence (KB sync, report write) | Could | P2 | M2/M5 delivery |
| FR-032 [PM1] | Platform shall support environment configuration (env variables, secrets) | Should | — | M1 delivery |
| FR-033 [PM1] | Platform shall provide API for external integrations | Should | — | M8 delivery (post-GA) |
| FR-034 [PM1] | Platform shall support test suite organization (folders, tags, hierarchy) | Should | P1 | M3 delivery |
| FR-035 [PM1] | Platform shall display pass rate, defect count, coverage % on dashboard | Must | — | M6 delivery |

---

## 6. PM2 (v1.5) Scope — Self-Healing + Test Data + Full Automation

### Functional Requirements (20+ features)

| FR-ID | Requirement | Phase | Priority | Related Agent |
|---|---|---|---|---|
| FR-036 [PM2] | Platform shall provide A6 inline synthetic test data generation with provenance | PM2 | Must | A6 |
| FR-037 [PM2] | Platform shall provide A7 background test maintenance suggestions (self-healing) | PM2 | Must | A7 |
| FR-038 [PM2] | Platform shall support A8 advanced (risk-adaptive planning from defect patterns + code churn) | PM2 | Must | A8 adv |
| FR-039 [PM2] | Platform shall launch AI Product Tester (APT) for autonomous E2E testing | PM2 | Should | APT |
| FR-040 [PM2] | Platform shall provide visual regression detection (in-house or partner integration) | PM2 | Should | — |
| FR-041 [PM2] | Platform shall support on-prem deployment (Helm chart + observability bundle) | PM2 | Should | — |
| FR-042 [PM2] | Platform shall support mobile app (iOS/Android Capacitor) with push notifications | PM2 | Should | — |
| FR-043 [PM2] | Platform shall expand document templates from 12 to 32 | PM2 | Must | — |
| FR-044 [PM2] | Architecture shall include on-prem deployment option (Helm + upgrade paths) | PM2 | Should | L1 |
| FR-045 [PM2] | Platform shall support full GraphRAG (entity + relationship indexing) | PM2 | Should | L2 |

**Note:** FR-046 through FR-049 retired during v1.1 scope re-baseline (2026-04-22). Numbering resumes at FR-050 [PM3].

### Key Dates & Milestones (Project Roadmap v1.1)

| Sub-M | Name | Start | End | Duration | Exit Gate |
|-------|------|-------|-----|----------|-----------|
| M7 | Test Data Generation (A6) | 2026-09-22 | 2026-10-10 | 3w | Inline synthetic data with provenance, re-generate, version history |
| M8 | Test Maintenance Self-Healing (A7) | 2026-10-13 | 2026-10-31 | 3w | Background suggestions (never silent edit), approve-in-context, ≥40% flaky reduction |
| M9 | A8 Advanced (Risk-Adaptive Planning) | 2026-11-03 | 2026-11-14 | 2w | Adaptive strategy from defect patterns, risk scoring from code churn |
| M10 | AI Product Tester (APT) | 2026-11-17 | 2026-11-28 | 2w | Autonomous E2E test discovery, scenario execution, exploratory testing |
| M11 | Visual Regression + Mobile + On-Prem | 2026-12-01 | 2026-12-19 | 3w | Visual diff, iOS/Android Capacitor, Helm chart deployment |
| M12 | v1.5 GA + 32-Doc Catalog | 2026-12-22 | 2027-01-09 | 3w | 32 of 70 templates, APT in beta, 5-8 paying customers |

**PM2 Exit Gate:** v1.5 GA signed off, ≥5 paying customers, on-prem deployment validated at 1 customer, 32 doc templates stable, predictive analytics dashboard live, A7 self-heal blocking ≥40% flaky test rework.

---

## 7. PM3 (v2) Scope — Low-Code + Governance + Enterprise Foundation

### Functional Requirements (20+ features)

| FR-ID | Requirement | Phase | Priority | Related Agent |
|---|---|---|---|---|
| FR-050 [PM3] | Platform shall provide A3 low-code test automation editor (drag-handles + slash commands) | PM3 | Must | A3 |
| FR-051 [PM3] | Platform shall export A3-authored tests to Playwright/Selenium/Cypress/WebdriverIO | PM3 | Must | A3 |
| FR-052 [PM3] | Platform shall provide A5 PR-gated test selection with change-based impact ranking | PM3 | Must | A5 |
| FR-053 [PM3] | Platform shall achieve 60% CI time reduction via A5 subsetting | PM3 | Must | A5 |
| FR-054 [PM3] | Platform shall provide Vibe Code Governor basic (PR blocking on policy violations) | PM3 | Must | VCG |
| FR-055 [PM3] | Platform shall support configurable Vibe Code Governor rules | PM3 | Should | VCG |
| FR-056 [PM3] | Platform shall provide SSO/SAML integration (Okta, Azure AD, Google Workspace) | PM3 | Must | L1 |
| FR-057 [PM3] | Platform shall provide Slack ChatOps commands (/qa-create-case, /qa-rca, /qa-report) | PM3 | Should | L1 |
| FR-058 [PM3] | Platform shall provide A8 full test planning (strategy + risk matrix + entry/exit) | PM3 | Must | A8 full |
| FR-059 [PM3] | Platform shall expand document templates from 32 to 50 | PM3 | Must | L3 |
| FR-060 [PM3] | Platform shall provide agent governance dashboard with audit trail | PM3 | Should | L6 |
| FR-061 [PM3] | Platform shall achieve SOC2 Type I certification | PM3 | Should | L6 |
| FR-062 [PM3] | Platform shall provide EU AI Act compliance export (audit trail + governance) | PM3 | Should | L6 |
| FR-063 [PM3] | Platform shall provide Jira auth alternatives beyond OAuth 2.0 3LO: API Token + Email Basic Auth (Atlassian Cloud locked-down tenants), Personal Access Token (Jira Server/Data Center), per-project auth method selection, custom OAuth provider registration | PM3 | Must | L1 |
| FR-064 [PM3] | Platform shall support on-prem Jira Server / Data Center deployment via PAT with manual instance_url + self-signed cert trust option | PM3 | Should | L1 |

### Key Dates & Milestones (Project Roadmap v1.1)

| Sub-M | Name | Start | End | Duration | Exit Gate |
|-------|------|-------|-----|----------|-----------|
| M13 | Low-Code Authoring (A3) | 2027-01-12 | 2027-01-30 | 3w | Notion-style automation editor, drag-handles + slash commands |
| M14 | Test Selection (A5) + PR-Gated CI | 2027-02-02 | 2027-02-20 | 3w | Change-based subsetting, ranked by impact, 60% CI time reduction |
| M15 | Full Test Planning (A8 Full) | 2027-02-23 | 2027-03-06 | 2w | Auto-strategy from PRD, risk matrix, entry/exit criteria |
| M16 | Vibe Code Governor (Basic) + Agent Governance | 2027-03-09 | 2027-03-20 | 2w | AI-code governance, audit trail, EU AI Act L6 foundation |
| M17 | Enterprise Auth (SSO/SAML) + Slack ChatOps + Jira Auth Alternatives | 2027-03-23 | 2027-03-27 | 1w | Okta/Azure/Google SSO, Slack bot for test triage, Jira API Token + Email Basic Auth fallback, on-prem Jira Server/DC with PAT, per-project Jira auth method selection, custom OAuth provider support |
| M18 | v2 GA + 50-Doc Catalog | 2027-03-30 | 2027-04-03 | 1w | 50 of 70 templates, SOC2 Type I audit, 15+ customers |

**PM3 Exit Gate:** v2 GA signed off, ≥15 paying customers, SSO in production, Vibe Code Governor blocking merges with >5 violations, 50 doc templates stable, SOC2 Type I report issued.

---

## 8. PM4 (v2+) Scope — Career Intelligence + Enterprise SaaS (High-Level)

| Initiative | Timeline | Scope | Agents | Docs |
|------------|----------|-------|--------|------|
| **Career Compass** | W47-52 (2027-04-06 → 2027-05-14) | Skills graph, job matching, salary benchmarking, learning paths, portfolio builder | Ongoing expansion | L7 module |
| **Full 70-Doc Catalog** | W47-60 (2027-04-06 → 2027-07-30) | Remaining 20 templates (HIPAA, GxP, SOC2 extended, ISO27001 extended, Architecture Review, Advanced Analytics) | — | +20 → 70 total |
| **Cloud Device Grid** | W55-70 (2027-06-14 → 2027-10-08) | Partner integration (BrowserStack/LambdaTest) + hybrid self-host grid | — | L1 |
| **Multi-Tenant SaaS** | W50-68 (2027-05-03 → 2027-09-24) | Per-org subdomain routing, row-level tenant isolation, tenant-scoped secrets | — | L1 |
| **Enterprise Compliance** | W55-72 (2027-06-14 → 2027-10-22) | HIPAA, GxP (FDA 21 CFR Part 11), multi-region data residency (EU/US/APAC) | — | L6 |
| **White-Label** | W65-75 (2027-09-03 → 2027-11-19) | Customer branding, custom domains, embeddable QA Nexus widgets | — | L1 |

**PM4 has no fixed exit gate** — it is the ongoing product evolution phase.

---

## 9. AI Agent Program (Project-Level)

### AI Entity Catalog (10 Total: 8 Agents + VCG + APT)

| Entity | Name | Purpose | Confidence Model | Ships In | Phase Maturity |
|--------|------|---------|---|---|---|
| **A1** | Test Case Generator | PRD/Jira/Figma → test cases with CQ gate | ≥90% auto-approve, 70-89% review, <70% red | PM1 (M3) | PM1: basic, PM2+: matures |
| **A2** | Test Deduplication | Semantic dedup, live chips, bulk audit | ≥90% auto-flag, 70-89% review, <70% ignore | PM1 (M3) | PM1: basic, PM2+: matures |
| **A3** | Low-Code Authoring | Notion-style automation editor | <1 syntax error auto-approve, 1-3 warning, >3 red | PM3 (M13) | PM3: ships, PM4: matures |
| **A4** | Defect Intelligence (5-layer RCA) | Stack → Env → Config → Code → Data | Layer weighting: stack 90%, env 80%, config 60%, code 50%, data 40% | PM1 (M4) | PM1: basic, PM3+: matures |
| **A5** | Test Selection | PR-gated CI subsetting, impact ranking | High impact → full suite, low impact → minimal subset | PM3 (M14) | PM3: ships, PM4: matures |
| **A6** | Test Data Generation | Inline synthetic data with provenance | Constraints satisfied → green, 1 ignored → amber, nonsensical → red | PM2 (M7) | PM2: ships, PM4: matures |
| **A7** | Test Maintenance (Self-Healing) | Background suggestions, never silent edit | Clear pattern → 80% suggest, intermittent → 50% info only, conflicting → don't suggest | PM2 (M8) | PM2: ships, PM4: matures |
| **A8 (adv)** | Test Planning (Advanced) | Risk-adaptive planning from defect patterns | Clear PRD + low risk → 70-80%, complex + high risk → 80-90%, ambiguous → <70% CQ | PM2 (M9 adv), Full PM3 (M15) | PM1: partial (M2), PM2: advanced (M9), PM3: full (M15) |
| **VCG** | Vibe Code Governor | AI-code governance, policy blocking | Clear violation → block, ambiguous → warn, false positive → allow-list | PM3 (M16) | PM3: basic, PM4: advanced |
| **APT** | AI Product Tester | Autonomous E2E discovery, execution | Expected flow passes → green, unexpected → amber, crash → red escalate | PM2 (M10) | PM2: ships, PM4: matures |

### Confidence Auto-Approve Progression

| Phase | Agents | Target Auto-Approve | Milestone |
|-------|--------|---|---|
| PM1 | A1, A2, A4 | ≥80% | M6 |
| PM2 | A1-A8 advanced, APT | ≥85% | M12 |
| PM3 | A1-A8 full, VCG, APT | ≥90% | M18 |
| PM4 | A1-A8, VCG, APT + ongoing | ≥92% | Ongoing |

---

## 10. 7-Layer Architecture Progression (Project-Level)

### Layer 1: Unified Platform (L1)

**Components:** Identity + Access, Project Workspace, Navigation, Integrations (Jira, GitHub, Slack, Confluence, SSO/SAML, multi-tenant), Admin (users, roles, audit logs, integration health).

**Progression:**
- **[PM1]:** Email/password auth, 4 roles (Admin/Lead/QA/Mgmt), project CRUD, 4 integrations (Jira via OAuth 2.0 3LO only, GitHub, Slack, Confluence)
- **[PM2]:** +Mobile API, on-prem deployment (Helm)
- **[PM3]:** +SSO/SAML (Okta, Azure, Google), Slack ChatOps, integration health dashboard, **Jira auth alternatives** (API Token + Email Basic Auth for locked-down Atlassian Cloud, PAT for Jira Server/DC on-prem, per-project auth method, custom OAuth providers)
- **[PM4]:** +Multi-tenant architecture (per-org isolation, subdomain routing), multi-IDP federation

### Layer 2: Knowledge Layer (L2)

**Components:** Document storage, Vector DB (pgvector, BGE embeddings), RAG pipeline, Knowledge Base.

**Progression:**
- **PM1:** pgvector foundation (5-dim embeddings), BGE embeddings, RAG retrieval for cases/defects/KB
- **PM2:** Full GraphRAG (entity + relationship indexing), cross-project knowledge retrieval
- **PM3:** Graphiti temporal metadata, temporal reasoning
- **PM4:** Knowledge mesh (org-wide cross-project graphs), predictive analytics

### Layer 3: Document Intelligence (L3)

**Components:** 70 doc templates (progress 12 → 32 → 50 → 70), ingestion, generation engine, approval workflow, versioning.

**Progression:**
- **PM1:** 12 doc templates (Planning, Execution, Defect, Automation, Regression, RTM)
- **PM2:** +20 = 32 (Advanced Automation, Data, Governance, Enterprise)
- **PM3:** +18 = 50 (Strategy, Governance, Enterprise enhanced)
- **PM4:** +20 = 70 (Enterprise compliance, Architecture Review, Advanced Analytics, Career Intelligence)

### Layer 4: Agentic AI (L4)

**Components:** LangGraph orchestration, A1-A8 agents, VCG, APT, confidence scoring, HITL gates, feedback collection.

**Progression:**
- **[PM1]:** 3 agents (A1, A2, A4), ≥80% auto-approve, CQ gate, manual review for <80%
- **[PM2]:** +3 agents (A6, A7, A8 adv), +APT, ≥85% auto-approve, agent governance foundation
- **[PM3]:** +3 agents (A3, A5, A8 full), +VCG basic, ≥90% auto-approve, advanced governance (cost tracking, latency SLAs)
- **[PM4]:** ≥92% auto-approve, multi-model support (GPT, Claude, Gemini, open LLMs), advanced reasoning

### Layer 5: Analytics & Value Visibility (L5)

**Components:** Dashboards (operational, executive), Report templates, Cost avoidance model, Quality gates.

**Progression:**
- **PM1 (Lite):** Daily/Weekly/Sprint/Release reports, basic pass rate + defect charts, ROI dashboard, Exec summary
- **PM2 (Full):** Custom dashboard builder, trend analysis, quality gate enforcement, agent usage metrics, advanced ROI
- **PM3 (Predictive):** Predictive analytics, forecasting, anomaly detection
- **PM4 (Enterprise BI):** Cross-org analytics, financial reporting, benchmarking

### Layer 6: Compliance & Governance (L6)

**Components:** Audit trail, Policy enforcement, Evidence packs, Sign-off workflows, Compliance reporting.

**Progression:**
- **[PM1]:** Audit log of all actions (actor, action, target, timestamp, outcome)
- **[PM2]:** Evidence capture + immutable records, audit trail designed for compliance retroactive support
- **[PM3] (Foundation):** Vibe Code Governor, EU AI Act foundation, SOC2 Type I cert, ISO27001 controls
- **[PM4] (Advanced):** GxP (FDA 21 CFR Part 11), HIPAA, multi-region data residency (EU/US/APAC), advanced DLP, white-label compliance

### Layer 7: Career Intelligence (L7)

**Components:** Skills graph, Portfolio builder, Job market matching, Learning paths, Career recommendations.

**Progression:**
- **PM1-PM3:** Not shipped
- **PM4:** Career Compass module (skills graph, job matching, salary data, learning paths, portfolio export)

---

## 11. User Stories (Sample, Phase-Tagged)

### PM1 (MVP) Sample User Stories (US-001 → US-045)

**US-001 [PM1]:** As a QA Lead, I can create a new project and invite team members. AC: Project form captures name, description, environment; invite by email; roles assigned (Admin/Lead/QA/Mgmt); activation email sent.

**US-003 [PM1]:** As a QA Lead, I can generate a test strategy from PRD using A8. AC: A8 triggered on doc; strategy auto-populated in template; risk matrix suggested; entry/exit criteria suggested; all editable post-gen.

**US-006 [PM1]:** As a QA Engineer, I can generate test cases from a requirement. AC: A1 triggered on requirement; CQ gate shown if confidence <80%; 10 cases generated in <30s; trace links to requirement shown.

**US-020 [PM1]:** As a QA Engineer, I can sync a defect to Jira. AC: 2-way sync on create; status changes QA Nexus → Jira; comments mirrored both ways; audit log of sync events.

**US-023 [PM1]:** As a QA Lead, I can view the ROI dashboard. AC: Cost avoidance (hours saved by AI); risk reduction; capacity unlocked; ROI % shown; 688% *(pilot target based on market research)* example formula visible.

### PM2 (v1.5) Sample User Stories (US-046 → US-069)

**US-046 [PM2]:** As QA Auto, I can generate synthetic test data via A6. AC: A6 triggered on test case; input data generated with constraints; provenance shown; re-generate option available.

**US-047 [PM2]:** As a QA Engineer, I can receive A7 self-healing suggestions. AC: Background job suggests fix for flaky test; suggestion shown in test detail (not auto-applied); approve/reject in context; change tracked in history.

**US-050 [PM2]:** As QA Lead, I can deploy QA Nexus on-prem. AC: Helm chart provided; deployment guide + troubleshooting; upgrade path documented; observability bundle included.

### PM3 (v2) Sample User Stories (US-070 → US-084)

**US-070 [PM3]:** As QA Auto, I can create test automation without touching code. AC: A3 low-code editor (Notion-style); slash commands (/click, /type, /wait, /assert); export to Playwright/Selenium/Cypress/WebdriverIO; <2h for 10-step test.

**US-071 [PM3]:** As QA Lead, I can see PR-gated test selection (A5). AC: GitHub/GitLab integration; PR → changed files detected; A5 suggests subset; ranked by impact; CI runs subset (60% time saved).

**US-074 [PM3]:** As a QA Engineer, I can see Vibe Code Governor warnings on PR. AC: GitHub/GitLab bot comments on PR with violations; policy rules visible; PR blocked if >5 violations; allow-list available.

### PM4 (v2+) Sample User Stories (US-085 → US-090)

**US-085 [PM4]:** As a QA Engineer, I can view my portfolio + career insights. AC: Career Compass page shows skills graph, past work, learning paths; job market matching; salary benchmarking.

**US-086 [PM4]:** As QA Lead, I can manage multiple orgs (multi-tenant). AC: Org picker in top nav; per-org data isolation; Admin controls per org; cross-org analytics (opt-in).

---

## 12. Acceptance Criteria (Gherkin-Style Examples, PM1 Critical Paths)

### AC-001: A1 Test Case Generation with CQ Gate

```gherkin
Feature: Test Case Generation with Clarification Questions

  Scenario: A1 generates test cases with high confidence
    Given a requirement with clear acceptance criteria
    When I click "Generate test cases" with A1
    Then 10 test cases are generated within 30 seconds
    And each case has confidence score ≥80%
    And I can see trace links back to source requirement
    And the cases are marked as auto-approvable (green)

  Scenario: A1 asks clarification questions if confidence low
    Given a requirement with vague or ambiguous language
    When I click "Generate test cases" with A1
    Then the system shows 2-3 Clarification Questions
    And I must answer before proceeding
    And after answering, A1 regenerates with higher confidence
```

### AC-002: A4 5-Layer RCA on Defect

```gherkin
Feature: Defect Intelligence (5-Layer RCA)

  Scenario: A4 enriches defect with RCA layers
    Given a failing test result with auto-captured evidence
    When I click "Analyze with A4" on the failure
    Then the system walks through 5 RCA layers:
      | Layer | Example | Confidence |
      | Stack Trace | java.lang.NullPointerException | 90% |
      | Environment | Staging DB version 5.2 vs Prod 5.3 | 80% |
      | Config | Feature flag is_feature_x = false | 60% |
      | Code | Recent commit changed login validator | 50% |
      | Data | Input email was empty string | 40% |
    And the defect is classified as: App (code bug)
    And similar past defects are suggested (pgvector dedup)
```

### AC-003: Jira 2-Way Sync

```gherkin
Feature: Bidirectional Jira Sync

  Scenario: Defect created in QA Nexus syncs to Jira
    Given a defect filed in QA Nexus with title, description, severity
    When I click "Save and sync to Jira"
    Then the defect is created in Jira within 30 seconds
    And the Jira issue key is shown in QA Nexus
    And the defect remains linked bidirectionally

  Scenario: Status change in Jira reflected in QA Nexus
    Given a defect synced to Jira with status "Open"
    When an engineer changes status to "Fixed" in Jira
    Then within 2 minutes, the status in QA Nexus updates to "Fixed"
    And a notification is sent to the QA assignee
```

---

## 13. Non-Functional Requirements (NFR-IDs, Phase-Tagged)

### PM1 NFRs

| NFR-ID | Requirement | Target | Milestone |
|--------|---|---|---|
| NFR-001 [PM1] | P95 API latency | <500ms | M6 |
| NFR-002 [PM1] | System uptime (business hours) | ≥99.5% | M6 |
| NFR-003 [PM1] | Document ingestion time | <30s for 100-page PDF | M2 |
| NFR-004 [PM1] | A1 case generation time | <30s for 10 cases | M3 |
| NFR-005 [PM1] | A2 bulk dedup scan time | <2min for 1000 cases | M3 |
| NFR-006 [PM1] | A4 RCA analysis time | <10s per failure | M4 |
| NFR-007 [PM1] | Max concurrent users per project | ≥50 simultaneous | M6 |
| NFR-008 [PM1] | Database storage per project | ≥10GB (scalable) | M0 |
| NFR-009 [PM1] | Accessibility | WCAG 2.2 AA (100% UI flows) | M6 |
| NFR-010 [PM1] | Browser compatibility | Chrome, Firefox, Safari (latest 2 versions) | M6 |
| NFR-011 [PM1] | Data encryption at rest | AES-256 or better | M0 |
| NFR-012 [PM1] | Data encryption in transit | TLS 1.3 | M0 |
| NFR-013 [PM1] | API rate limiting | Per-user quota (e.g., 1000 req/hour) | M5 |
| NFR-014 [PM1] | Audit log retention | ≥1 year | M0 |
| NFR-015 [PM1] | Backup frequency | Daily snapshots, 7-day retention | M0 |
| NFR-016 [PM1] | Disaster recovery RTO | <4 hours | M0 |
| NFR-017 [PM1] | Disaster recovery RPO | <1 hour | M0 |

### PM2-PM4 NFRs (Progressive Tightening)

| Phase | P95 Latency | Uptime | Auto-Approve | Concurrent Users |
|-------|---|---|---|---|
| PM1 | <500ms | ≥99.5% | ≥80% | 50 |
| PM2 | <350ms | ≥99.9% | ≥85% | 500 |
| PM3 | <250ms | ≥99.95% | ≥90% | 5000 |
| PM4 | <200ms | ≥99.99% | ≥92% | 50000 |

---

## 14. Out-of-Scope (Explicit Deferrals by Phase)

### PM1 Explicitly Out-of-Scope (Deferred to PM2+)

- **A3 Low-Code Authoring** — Notion-style automation editor (ships PM3 M13)
- **A5 Test Selection** — PR-gated CI subsetting (ships PM3 M14)
- **A6 Test Data** — Inline synthetic data generation (ships PM2 M7)
- **A7 Test Maintenance** — Background self-healing suggestions (ships PM2 M8)
- **A8 (Full)** — Auto-strategy from PRD alone + risk matrix + entry/exit criteria (ships PM3 M15; PM1 M2 is partial only)
- **Vibe Code Governor** — AI-code governance (ships PM3 M16)
- **Visual Regression** — In-house diff or vendor integration (ships PM2 M11)
- **Mobile app** — iOS/Android Capacitor (ships PM2 M11)
- **On-prem deployment** — Helm chart (ships PM2 M11)
- **SSO/SAML** — Okta, Azure, Google (ships PM3 M17)
- **Slack ChatOps** — Beyond notification webhook (ships PM3 M17)
- **Jira auth alternatives** — API Token + Email Basic Auth (locked-down Atlassian Cloud), PAT (Jira Server/DC on-prem), per-project auth method, custom OAuth providers (ships PM3 M17). PM1 supports OAuth 2.0 3LO only.
- **Full 70-document catalog** — MVP ships 12; progressively unlock 32 → 50 → 70
- **EU AI Act compliance workflow** (L6) — Foundation in PM2 M16, full PM3+
- **Career Compass** (L7) — Deferred entirely to PM4
- **Cloud Device Grid** — Build vs partner vs defer TBD (PM4)
- **White-label** — Custom domains, embedded widgets (PM4)
- **Multi-tenant SaaS** — Per-org isolation (PM4)
- **HIPAA/GxP** — Compliance certification (PM4)

### Explicit Never In-Scope

- Replacing Jira (complement, not replace)
- Project/sprint management (link to Jira, not own)
- Code repository integration beyond CI webhook
- Product analytics (not QA focus)

---

## 15. Release Plan & Go-to-Market (Phase-Gated)

### PM1 Deployment Model — Single-Tenant Internal (binding)

**PM1 is a single-tenant internal deployment.** Iksula Services Pvt Ltd is the only organization that exists in the database. Multi-tenant SaaS with per-org subdomain routing, external customer acquisition, and sales-led provisioning are explicitly **PM4** scope (see §8 and ERD Layer 1 progression).

**Day-0 Bootstrap (one-time, at first deploy):**

The initial Admin account is created via a **deployment-time database seed script** run during milestone M0 — not via a sales/marketing provisioning flow. Bootstrap sequence:

1. Engineering runs the deploy pipeline into Iksula's infrastructure (Oracle Always Free + internal cloud).
2. Seed script inserts:
   - One `organizations` row: `{ name: "Iksula Services Pvt Ltd" }`
   - One `users` row with `role = 'Admin'`, `password_hash = NULL`, `invite_token = <random>`, `first_login = true`. **Assignment for PM1:** Yogesh M. holds the Admin RBAC role (inheriting all Lead permissions — Admin > Lead in the PM1 permission hierarchy). His organizational / persona label remains "QA Lead / Manager", but his system-level access is Admin for bootstrap and ongoing workspace governance. Email assigned at deploy time by IT.
3. Seed script triggers one transactional email to the initial Admin using the **same F06b Mode A template** as regular user invites (copy varies: "Your QA Nexus workspace is ready" vs "You've been invited by X"). The email carries a magic link with the `invite_token`.
4. Admin clicks the link → lands on F06b Mode A (Set Password) → sets password → flag `first_login` still true because the workspace has no projects yet → routed to **F07 Workspace-Founder Onboarding** (3-step wizard: create first project · choose data source · invite team).
5. On F07 completion, `first_login` flips to false and user lands on F09 Projects List with the first project created.

**Subsequent Admin / Lead / QA Engineer / Stakeholder invites** (after Day-0) are sent by the existing Admin via **F27 Users & Roles → F27m1 Invite User Modal**. F27m1 supports per-user role override (not just a default role like F07 Step 3), per-user project assignment, Senior QA organizational label, and existing-user detection. Same F06b Mode A landing page on accept; invitees route to role-specific first-run onboarding on first login: **F07b** (QA Engineer) · **F07c** (Stakeholder) · **F07d** (invited Lead/Admin). Workspace founders continue to route to F07 (founder wizard).

**F07 Step 2 Deferred Routing (Pattern A, binding):** The data-source choice in F07 Step 2 (Connect to Jira / Upload files / Start blank) is stored as wizard state only — no external flow fires during Step 2. On Step 3 submit ("Create project & send invites"), the backend atomically creates the project row + invite records in a single transaction, THEN routes to the data-source flow: F11a → F11b → F11c for Jira, F12 for upload, F09 directly for blank. Rationale: invites go out immediately (don't block on Jira OAuth); abandoning the Jira wizard mid-flow leaves no orphaned state; F11a/b/c and F12 remain universal regardless of entry point (F07, F09 + project, Plan → Imports, etc.).

**Resend path:** If the Day-0 bootstrap email is lost (spam filter, etc.), the engineering team can re-trigger the seed in PM1. A self-service "resend invitation" affordance on F27 handles subsequent invite losses. Self-service resend of the Day-0 bootstrap itself is deferred to PM4 (along with multi-tenant provisioning).

**What PM1 explicitly does NOT include:**
- Marketing website signup funnel (no `/signup` public page)
- Sales-led tenant provisioning (no external admin dashboard)
- Email domain verification (internal trust on `@iksula.com`)
- Multiple workspaces per user (Iksula is the only tenant)
- SSO / SAML federation (PM3 M17)
- Self-service workspace creation (PM4)

### PM1 (MVP) Release Plan

**Launch Date:** 2026-09-21 (GA)

**Pre-GA Milestones:**
- M0-M5: Feature development (18 weeks)
- M6: GA prep (5 weeks) — legal sign-off, security audit, support infrastructure, marketing collateral

**Launch Assets:**
- Marketing website + case studies (1-2 pilot stories)
- Admin guide + user guide + API docs
- Sales playbook + win/loss template
- Support runbooks (on-call, incident response)
- Pilot onboarding program (2-3 Iksula internal pilots)

**Success Criteria for PM1 GA:**
- ≥2 Iksula pilots live, completing all 6 primary JTBDs without blockers
- p95 latency <500ms achieved
- WCAG 2.2 AA compliance audited + critical fixes applied
- Security audit (pen testing) passed
- Legal + compliance sign-off (GDPR, SOC 2 roadmap acknowledged)
- Success metrics baseline collected (adoption, speed, AI quality, ROI)

### PM2 (v1.5) Release Plan (2027-01-09)

**Headline:** "Self-Healing + Test Data + Enterprise Scale"

**Pre-GA Milestones:**
- M7-M11: Feature development (13 weeks)
- M12: GA prep (3 weeks)

**Launch Criteria:**
- ≥5 paying customers (not just pilots)
- On-prem deployment validated at 1 customer
- APT in beta (2-3 customer feedback loops)
- 32 doc templates stable
- Predictive analytics dashboard live
- A7 self-heal blocking ≥40% flaky test rework

### PM3 (v2) Release Plan (2027-04-03)

**Headline:** "Low-Code + Governance + Enterprise Ready"

**Pre-GA Milestones:**
- M13-M17: Feature development (10 weeks)
- M18: GA prep (1 week)

**Launch Criteria:**
- ≥15 paying customers
- SSO in production (≥80% adoption)
- Vibe Code Governor blocking merges with >5 violations at 5+ customers
- SOC2 Type I audit completed + report issued
- 50 doc templates stable
- EU AI Act compliance foundation audited

### PM4 (v2+ Ongoing)

No fixed release gates. Continuous deployment model. Career Compass, full 70 docs, multi-tenant, cloud device grid, HIPAA/GxP, white-label, multi-region shipped in waves (W47-W75).

---

## 16. Success Metrics (Phase-Gated)

### PM1 Success Metrics (Measured at M6 / GA)

| Metric | Target | Owner |
|--------|--------|-------|
| **Adoption** | ≥3 concurrent Iksula pilots active (≥4 days/week login) | Product |
| **Speed (AI)** | A1 case generation ≥10× faster than manual | Product |
| **Speed (Execution)** | Median time-to-log-a-bug ≤90s (vs baseline measured week 1) | QA |
| **AI Quality** | ≥80% of A1-generated cases auto-approved (confidence ≥80%) | Product |
| **AI Quality** | A2 catches ≥60% of true duplicates in controlled dataset | Product |
| **AI Quality** | A4 RCA top-layer accuracy ≥75% (human verification) | Product |
| **ROI** | 688% ROI demonstrated for at least one pilot | Product |
| **Latency** | p95 API latency <500ms | Eng |
| **Uptime** | ≥99.5% uptime (business hours) | DevOps |
| **Accessibility** | WCAG 2.2 AA audit passed (≥80% critical/major fixes) | Design |
| **Security** | Pen test passed, 0 critical vulnerabilities | Security |

### PM2 Success Metrics

| Metric | Target | Owner |
|--------|--------|-------|
| Paying customers | ≥5 | Sales |
| SSO adoption (new accounts) | ≥80% use SSO by end | Product |
| A3 syntax error rate | ≥90% of A3-authored tests run without manual fix | Product |
| A5 CI time reduction | 60% reduction in p50 test run time | Eng |
| A7 flaky test reduction | ≥40% reduction in flaky-test fixes across customers | Product |
| Vibe Code Governor rules | ≥5 rule-based policies deployed | Product |
| Doc templates | 32 of 70 stable | Product |
| Latency | p95 <350ms | Eng |
| Uptime | ≥99.9% | DevOps |
| Auto-approve rate | ≥85% across A1-A8 agents | Product |

### PM3 Success Metrics

| Metric | Target | Owner |
|--------|--------|-------|
| Paying customers | ≥15 | Sales |
| Vibe Code Governor adoption | Blocking ≥5 violations/week at ≥5 customers | Product |
| SOC2 Type I | Certification completed | Compliance |
| Doc templates | 50 of 70 stable | Product |
| A8 test planning automation | Auto-strategy from PRD alone, 100% editable | Product |
| On-prem deployment | ≥1 customer live | Eng |
| Low-code adoption | ≥5 customers using A3 | Product |
| Latency | p95 <250ms | Eng |
| Auto-approve rate | ≥90% across A1-A8 + VCG + APT | Product |

### PM4 Success Metrics (Ongoing)

| Metric | Target | Owner |
|--------|--------|-------|
| Paying customers | ≥50 | Sales |
| Career Compass adoption | ≥20% of MAU accessing portfolio | Product |
| Doc templates | 70 of 70 | Product |
| Multi-tenant customers | ≥10 separate orgs | Sales |
| HIPAA + GxP customers | ≥5 | Sales |
| Cloud Device Grid | Live with ≥3 customers | Eng |
| ARR | $X (TBD) | Finance |
| NPS | ≥60 | Product |
| Auto-approve rate | ≥92% | Product |

---

## 17. Risk Register (Project-Level, Select Risks)

| Risk | Phase Impact | Probability | Mitigation |
|------|---|---|---|
| A1 confidence model underperforms on ambiguous PRDs | PM1 (M3) | Medium | Clarification Questions gate; manual review fallback; user feedback loop |
| A4 RCA 5-layer weighting misaligned (over-confident in wrong layers) | PM1 (M4) | Medium | Manual Sr QA audit of 50 failures; threshold tuning from pilot feedback |
| Jira 2-way sync orphans / duplicates defects at scale | PM1 (M4-M5) | Medium | Webhook + 2-min poll fallback; 4-week live pilot validation; zero orphans threshold |
| On-prem deployment support burden exceeds capacity | PM2 (M11) | High | Limit to ≤3 on-prem customers in PM2; Helm chart + runbooks; partner support model |
| A7 self-healing silent edits (forbidden) are accidentally enabled | PM2 (M8) | Low | Architectural gate: never silent edit; always require user approve-in-context; test for this failure mode |
| SSO vendor lock-in (Okta only in PM3) | PM3 (M17) | Medium | Abstract auth provider interface in PM1 M1; multi-IDP from PM3 onward |
| Vibe Code Governor false positive rate too high | PM3 (M16) | Medium | Start in warn-only mode for 4 weeks; progress to block-mode after tuning |
| Multi-tenant data isolation failure (tenant_id leakage) | PM4 | High | Row-level RLS policies introduced in PM3 schema migration (not PM4); audit verification |
| EU AI Act compliance proves impossible to retrofit | PM3 (M16) | Medium | Begin evidence capture in PM2; audit trail designed from M0; retroactive compliance in PM3 M16 |
| Cloud Device Grid can't compete with BrowserStack/LambdaTest | PM4 | High | Partner-first strategy; build only if demand exceeds partner pricing tolerance |
| Career Compass unclear monetization path | PM4 | Medium | Ship as free-tier user engagement feature (not revenue driver); revisit at W60 |

---

## 18. Open Questions & Decisions Log

| Q # | Question | Status | Decision | Owner | Target Resolve |
|-----|----------|--------|----------|-------|---|
| Q1 | Should A8 partial in PM1 M2 include risk matrix? | Open | Awaiting product prioritization | Product | 2026-05-01 |
| Q2 | Jira field mapping: which custom fields required vs optional? | Open | Depends on customer survey | Sales | 2026-04-30 |
| Q3 | A4 layer weighting: are the 5-layer percentages (90/80/60/50/40) optimal? | Open | Pilot feedback during M4 | Product | 2026-07-26 |
| Q4 | On-prem: should Helm chart auto-upgrade PostgreSQL + pgvector? | Pending Tech Review | Likely yes with downtime window | Eng | 2026-10-15 |
| Q5 | Career Compass: are we building job market APIs or licensing from third-party? | Open | TBD cost/benefit analysis | Product | 2026-12-01 |
| Q6 | White-label: can customers customize the logo only, or full CSS? | Open | MVP white-label scope TBD | Product | 2027-03-01 |
| Q7 | Multi-region data residency: which regions in GA (EU only or EU+US+APAC)? | Open | Customer demand survey | Sales | 2027-02-01 |

---

## 19. Glossary

- **A1-A8, VCG, APT:** 10 AI entities (agents + governance + tester)
- **BDD:** Behavior-Driven Development (Gherkin syntax: Given/When/Then)
- **RAG:** Retrieval-Augmented Generation (knowledge base context fed to LLM)
- **RCA:** Root Cause Analysis (5-layer: stack, env, config, code, data)
- **RTM:** Requirements Traceability Matrix (links requirements to test cases)
- **pgvector:** PostgreSQL extension for vector similarity search (embeddings)
- **OAuth 2.0 3-LO:** Three-Legged OAuth (user authorizes app to access external system)
- **L1-L7:** 7-layer architecture (L1: Unified Platform → L7: Career Intelligence)
- **PM1-PM4:** 4 project milestones (phases over ~18 months)
- **M0-M18:** 19 milestones (sub-phases within PM1-PM4)
- **GM-ID:** Goal Metric ID (e.g., GM-001 = Goal #1)
- **FR-ID:** Functional Requirement ID
- **US-ID:** User Story ID
- **NFR-ID:** Non-Functional Requirement ID
- **AC:** Acceptance Criteria
- **DoR:** Definition of Ready
- **DoD:** Definition of Done
- **JIT:** Just-In-Time
- **EU AI Act:** European Union AI Act (regulatory framework for high-risk AI systems, enforcement 2026–2027)

---

## 20. Appendices

### Appendix A: ROI Formula (688% Pilot Target)

**Cost Avoidance Model:**

```
cost_avoidance = SUM(defects_caught[i] × stage_multiplier[i])

Where:
  stage_multiplier = {
    requirements_phase: $200,
    design_phase: $1,000,
    build_phase: $2,200,
    production: $14,600
  }

Example (one pilot, 18-week MVP):
  Defects caught:
    - Requirements: 5 defects × $200 = $1,000
    - Design: 8 defects × $1,000 = $8,000
    - Build: 15 defects × $2,200 = $33,000
    - Production (prevented): 3 defects × $14,600 = $43,800
  Total cost avoidance = $85,800

  QA investment (18-week MVP):
    - Team cost: 3 FTE × $150K salary / 52 weeks × 18 weeks = ~$155K (internal)
    - Infrastructure: ~$20K
    - Tools/licenses: ~$5K
  Total investment = $180K

  ROI = ($85,800 / $180,000) × 100 = 48% (conservative)
  
  With extended benefits (faster iteration, team learning, knowledge vault):
    Adjusted cost avoidance = $1.2M (includes capacity unlocked, velocity gain)
    Adjusted ROI = ($1.2M / $180K) × 100 = 688%
```

### Appendix B: Document Template Catalog Progression (70 Total)

**PM1 (12 templates):**
1. Test Plan
2. Test Strategy
3. Test Estimation
4. Daily Status Report
5. Weekly Status Report
6. Sprint Sign-off
7. Release Readiness Report
8. Defect Report
9. Root Cause Analysis (RCA)
10. Exploratory Testing Charter
11. Regression Test Outline
12. Requirements Traceability Matrix (RTM)

**PM2 (+20 = 32 total):**
13-20. Advanced Automation (Visual Regression, Performance Test Plan, Accessibility Audit, Mobile Test Matrix, Load Test Charter, API Test Charter, etc)
21-26. Data & Synthetic (Synthetic Data Charter, Data Quality Report, Test Data Dictionary, Edge Case Catalog, etc)
27-32. Governance & Self-Heal (Maintenance Report, Flakiness Report, Automation Debt Log, Test Infrastructure Health, etc)

**PM3 (+18 = 50 total):**
33-36. Strategy (Risk Matrix, Entry/Exit Criteria, Compliance Checklist, Test Automation Strategy)
37-40. Governance (EU AI Act Audit Trail, Agent Governance Log, Vibe Code Governor Report, Data Classification)
41-50. Enterprise (SSO Integration Guide, Migration Plan, On-Prem Deployment Checklist, Support Runbook, etc)

**PM4 (+20 = 70 total):**
51-60. Enterprise Compliance (HIPAA Attestation, GxP Checklist, SOC2 Evidence Pack, ISO27001 Mapping, etc)
61-65. Architecture Review, Advanced Analytics, Benchmarking Report, etc
66-70. Career Intelligence, Skills Development, Learning Paths, Portfolio Export, Job Market Brief

---

## 21. Document Precedence & Authority

When any two project-level artifacts conflict, precedence order is:

1. **PROJECT_ROADMAP.md v1.1** (this PRD defers to) — phase structure, dates, agent ownership
2. **PRD.md v2.10** (this document) — feature-level requirements (FR-IDs, US-IDs, NFR-IDs, GM-IDs)
3. **MILESTONE_REGISTRY.md v3.0** — PM1 sub-milestone detail (M0-M6), tables, endpoints, components
4. **ERD.md** — data model + system design (TB-IDs, EP-IDs, CO-IDs, ADR-IDs)
5. **Milestone/M*/Milestone_M*.md** — per-milestone execution plans
6. **QA_Nexus_Master_Brainstorm.md** — original vision (historical reference)

---

## 22. Changelog (PRD Versions)

| Date | Version | Change | Author |
|------|---------|--------|--------|
| 2026-04-22 | v2.0 | Created project-level PRD (PM1-PM4 scope from PROJECT_ROADMAP.md v1.0) | Claude |
| 2026-04-22 | v2.1 | **PM2 ↔ PM3 content swap applied** (v1.5 = Self-Healing/Data/Automation; v2 = Low-Code/Governance/Enterprise); **PM1 expanded with explicit 5 Feature Pillars** (PM1-P1 through PM1-P5); **depth restored** (28% content loss recovered from Master Brainstorm); milestone sub-structure mapped (M7-M12 now self-healing, M13-M18 now governance); 2,400+ lines achieved. | Claude |
| 2026-04-23 | v2.2 | **Audit Wave 1 remediation:** Persona phase tags corrected (Senior QA: A7 now [PM2], not PM3; Automation Engineer: A3/A5 now [PM3], not PM2; CTO: governance dashboard now [PM3+], not PM2+). Layer progression corrected (L1: SSO/Slack now [PM3]; L4: A3/A5/VCG now [PM3]; L6: EU AI Act foundation now [PM3], advanced [PM4]). User-story phase tags re-allocated to canonical PM2↔PM3 order (self-healing/test-data/on-prem → [PM2]; low-code/test-selection → [PM3]). PM1 duration normalized to 21 calendar weeks (18 build + 3 GA) in all phase tables. FR numbering gap (FR-046..049) annotated as "retired during v1.1 scope re-baseline." Market/security/salary claims softened with framing note: "third-party sources and internal hypotheses, not pilot-measured facts." All requirements and user stories tagged [PM1]/[PM2]/[PM3]/[PM4] for downstream traceability. | Claude |
| 2026-04-24 | v2.3 | **PM3 M17 Jira auth alternatives + UI design evolution v2.2:** Added FR-063 (Jira multi-method auth: API Token + Email, PAT, per-project, custom OAuth) and FR-064 (on-prem Jira Server/DC with self-signed cert trust). M17 row expanded. L1 PM1 component line clarified (PM1 = OAuth 2.0 3LO only). Deferred list updated with Jira auth alternatives deferral. **UI frame inventory expanded from 23 → 29** via F11 split (F11a/b/c) and new F08c (Home Empty Project), F14m1 (Edit/Add Requirement Modal), F14m2 (Link Test Case Modal), F14m3 (Convert to Jira Modal, deferred). Design system formally canonized with binding **teal=system, violet=AI** rule across all AI/system CTAs. Realistic data canon anchored to Iksula Returns (RET) flow. See `PM1_UI_v2/UI Files/DESIGN_EVOLUTION_v2.2.md` and Brainstorm §21. | Claude |
| 2026-04-24 | v2.4 | **Day-0 workspace bootstrap model documented + UI frames F06b / F07b added.** §15 now explicitly states PM1 is single-tenant internal deployment. Added PM1 Deployment Model subsection explaining the engineering seed-script path for the initial Admin (no sales, no marketing funnel — deployment-time provisioning). Admin assignment: Yogesh M. holds Admin RBAC (inherits Lead permissions); organizational persona label remains "QA Lead / Manager". Bootstrap email reuses F06b Mode A template. Flow: seed → F06b Mode A → F07 (founder wizard) → F09. Subsequent invites: F27 invite → F06b Mode A → F07b (tri-mode). UI frame count grew to 31 (added F06b Set/Reset Password, F07b Invited Team First-Run Onboarding). | Claude |
| 2026-04-24 | v2.5 | **F07 Pattern A deferred routing + F27m1 Invite User Modal.** Pattern A binding: F07 Step 2 data-source choice is wizard state only; data-source flows (Jira/Upload) fire AFTER Step 3 atomic project-creation transaction. F27m1 added for ongoing invites post-bootstrap (per-user role override, per-user project assignment, Senior QA organizational label, existing-user detection). UI frame count grew to 32. | Claude |
| 2026-04-24 | v2.6 | **F07b tri-mode split into 3 frames + frame count correction.** F07b (Invited QA Engineer), F07c (Invited Stakeholder — dashboard-focused, no AI agent tour), F07d (Invited Lead/Admin — agent tour + Govern Access Strip) are now 3 dedicated frames instead of one tri-mode. Each role routes invitees to the role-specific frame: QA Engineer → F07b · Stakeholder → F07c · invited Lead/Admin → F07d. Workspace founders still route to F07. Frame count corrected 32 → 37: +2 from F07b split (F07c, F07d) and +3 from prior undercount where F16a/b/c were collectively counted as one Test Case Editor frame instead of three. | Claude |
| 2026-04-24 | v2.7 | **F06b dual-mode split into F06b + F06c.** F06b Set Password (Invite Setup) and F06c Reset Password (Forgot-Password flow) split into 2 dedicated frames matching the F07b → F07b/c/d split rationale. Each auth path gets a dedicated route, URL, and rendered HTML. F06c reset window tightened to 1 hour vs 7 days for invites. UI frame count 37 → 38. | Claude |
| **2026-04-25** | **v2.8** | **PM1 UI inventory closed at 39 frames.** F18m1 Edit Suite Modal added (Stage Modal 720×760 with Archive/Restore danger zone). All 19 pending frames at v2.7 (F07b/c/d, F14m2, F14m3, F15, F16a/b/c, F18, F19, F20, F21, F23, F25 Prove mode, F26 Agents, F27, F27m1, F28 with HMAC-SHA256 audit chain) built sequentially in single Claude Code session per Plan A. Frame count 38 → 39. **PM1 UI is now 100% complete (39 of 39 locked).** Provenance: 17 Claude Design + 22 Claude Code. Folder reorganization: Claude Code-built frames isolated to `frames - claude code build (PM1 v2.6-v2.8)/`; original `frame  html view/` reserved for future Claude Design touch-up work. Anti-drift discipline (teal=system, violet=AI, no MD3, hardcoded tokens) verified across all 39 frames. See `PM1_UI_v2/UI Files/DESIGN_EVOLUTION_v2.2.md` v2.7-rapid / v2.8 / v2.9 entries for full build log. | Claude |
| **2026-04-25** | **v2.9** | **PM1 phase split + free-OSS tech stack lock.** Created `PM1/PM1_PRD/` and `PM1/PM1_ERD/` with PM1-only specs (PM1_PRD v8.0 + PM1_ERD v2.0). PM1 tech stack locked to all-free-OSS for the 8-user × 12hr/day × 1-2 month internal pilot: Groq free API for LLM (gpt-oss-120b primary, llama-4-scout long-ctx, gpt-oss-20b fast layers) + Gemini 2.5 Flash fallback; Qwen3-Embedding-0.6B via @xenova/transformers in-process (no separate Python service); Postgres + pgvector on Neon free; Cloudflare Pages + R2 free; NestJS on Render free + UptimeRobot keep-alive; Resend free for email; Grafana Cloud free for observability; DeepEval for engineering eval (Colab Free, never user-facing). **Dropped from PM1 (deferred to PM2+):** FastAPI service, Redis/Valkey + BullMQ, pgvectorscale, self-hosted Ollama+Gemma. **Frontend bumped:** Tailwind 3.4 → 4, React 18 → 19, Next.js 14 → 15. **Total monthly cost: $0** for the pilot. Project-level PRD/ERD continue to describe the eventual PM1-PM4 self-hosted architecture; binding PM1 spec lives in `PM1/PM1_PRD/PM1_PRD.md` v8.0 and `PM1/PM1_ERD/PM1_ERD.md` v2.0. | Claude |
| **2026-04-25 (late)** | **v2.10** | **Day-0 LLM configuration flow added — PM1 UI inventory grew 39 → 41 frames.** Gap analysis triggered by user: with API keys (Groq, Gemini) now in the locked PM1 stack, Admin/Lead need a UI to configure providers, fetch available models, and assign them per-agent — none of the 39 frames covered this. Added 2 new modals to `PM1/PM1_UI_v2/frames - claude code build (PM1 v2.6-v2.8)/`. **F28m1 LLM Provider Configuration Modal** (Stage 1120×860, opens from F28 → "+ Add Provider"): two-pane layout with provider directory (Groq + Gemini connected, 9 available — OpenRouter, Cerebras, OpenAI/ChatGPT, Anthropic Claude, Kimi, Mistral, Together, Fireworks, Custom OpenAI-compat) and right pane with API key + endpoint + prominent teal "Test connection" button + free-tier callout + 11-model checkbox list with violet "Used by" agent assignment pills. **F26m1 Agent Model Assignment Modal** (Edit 960×760, opens from F26 agent card → "Configure model"): violet AI-surface header, agent summary, three model dropdowns (Primary teal-accent / Long-context / Fallback) populated from F28m1's enabled pool, read-only routing rules card (prompt_tokens > 100K → Long-context; 429/503/timeout → Fallback; otherwise → Primary), sample test panel with realistic Iksula REQ-088 3DS prompt. **PM1_PRD bumped to v8.1, PM1_ERD bumped to v2.1.** New tables in PM1_ERD: TB-019 `llm_provider`, TB-020 `llm_provider_model`, TB-021 `agent_model_assignment` (PM1 table count 18 → 21). New endpoints: EP-026 to EP-029 (PM1 endpoint count 25 → 29). PM1 inventory now closed at **41 of 41 frames** (17 Claude Design + 24 Claude Code). Future-proof: F28m1's provider directory list is generic — adding a new provider (when more free-tier services emerge) requires no schema or UI redesign. See `PM1/PM1_UI_v2/UI Files/DESIGN_EVOLUTION_v2.2.md` v2.10 entry for full build log. | Claude |

---

**End of QA Nexus PRD v2.10 (Project-Level — PM1 UI closed at 41 frames + Day-0 LLM config flow)**

---

*This document is locked pending PM1 kickoff (2026-04-27). PM2/PM3/PM4 scope is directional and subject to ADR lock 6 weeks before each phase start.*
