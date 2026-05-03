---
title: QA Nexus — Project-Level Roadmap (Canonical Source of Truth)
version: 1.1
status: Locked
created: 2026-04-22
updated: 2026-04-22 (v1.1 — PM2/PM3 swapped; PM1 scope expanded with explicit T.C. Management / Integrations / Bug Management / Reporting / Core Doc Catalog call-outs)
supersedes: MVP-only scope (MILESTONE_REGISTRY v2.0 scope is retained as PM1 sub-structure)
scope: Full product program (PM1 → PM2 → PM3 → PM4), ~18 months
---

# QA Nexus — Project-Level Roadmap (v1.1)

## Purpose

This document establishes the **project-level** structure for QA Nexus. Previously, the PRD / ERD / Milestone suite was scoped to the **MVP only** (18 weeks, 3 AI agents, 12 doc templates). This roadmap re-anchors everything to the **full product program** — 4 project-level milestones (PM1 → PM4) over ~18 months, with the MVP now defined as the **first project milestone (PM1)**.

All project-level artifacts (PRD, ERD, Milestones, Sprint Plans, Release Checklists) **must** align to the structure defined here.

---

## v1.1 Change Log (2026-04-22)

1. **PM2 ↔ PM3 swap** — PM2 now ships **Self-Healing + Test Data + Full Automation + Visual Regression + On-Prem + Mobile** (former PM3 v2 content). PM3 now ships **Low-Code Authoring + Test Selection + Full Test Planning + Vibe Code Governor + SSO/SAML + Slack ChatOps + EU AI Act foundation** (former PM2 v1.5 content). Rationale: self-healing and automation extend PM1's core test management workflow directly, while governance and enterprise features make more sense after product depth is proven.
2. **Version labels stay tied to position** — PM2 = "v1.5", PM3 = "v2" (labels follow phase order, content moved across labels).
3. **PM1 scope line expanded** — now explicitly calls out: Test Case Management, Integrations (Jira/GitHub/Slack/Confluence/Figma), Bug Management, Basic Reporting, Core Doc Catalog (12 of 70). These were implicit in previous scope; now explicit.
4. **Sub-milestone IDs re-mapped** — former M7-M12 (governance) now live in PM3 positions M13-M18. Former M13-M18 (self-healing) now live in PM2 positions M7-M12.
5. **Dates re-calculated** — PM2 duration is 16 wk (self-healing content), PM3 duration is 12 wk (governance content).

---

## Project Milestone Structure (v1.1)

| ID | Name | Duration | Calendar Window | Headline Scope | AI Agents Added | Doc Templates | Architecture Layers |
|----|------|----------|-----------------|-----------------|------------------|---------------|---------------------|
| **PM1** | **MVP — Test Management Beachhead** | 21 wk (18 build + 3 GA) | 2026-04-27 → 2026-09-21 | Pilot-ready QA Nexus for 2–3 Iksula engagements. Covers **Test Case Management** (Notion-style editor, BDD+traditional modes, RTM), **Integrations** (Jira 2-way, GitHub/GitLab, Slack, Confluence, Figma inbound), **Bug Management** (defect form, A4 5-layer RCA, 4-category classification, evidence auto-capture), **Basic Reporting** (Daily/Weekly/Sprint/Release reports + Executive Dashboard with ROI), and **Core Doc Catalog** (12 of 70 templates: Test Plan, Strategy, Estimation, Daily/Weekly/Sprint/Release status, Defect Report, RCA, Exploratory Charter, Regression outline, RTM). | **A1, A2, A4** (3 agents) | 12 of 70 | L1 + L2 + L3(12) + L4(3) + L5(lite) |
| **PM2** | **v1.5 — Self-Healing + Test Data + Full Automation** | 16 wk | 2026-09-22 → 2027-01-09 | Extends PM1 test execution with autonomous test maintenance, synthetic data, AI Product Tester, visual regression, on-prem deployment, and mobile app. | **+A6, +A7, +A8 advanced**, +AI Product Tester (APT) | +20 = 32 total (Advanced Automation, Visual Regression, Performance Test Plan, Mobile Test Matrix, Synthetic Data Charter, Data Quality) | +L1 (on-prem + mobile) +L2 full GraphRAG +L5 predictive analytics |
| **PM3** | **v2 — Low-Code + Governance + Enterprise Foundation** | 12 wk | 2027-01-12 → 2027-04-03 | Adds low-code authoring, change-based test selection, full test planning, governance foundation, and enterprise-grade SSO/ChatOps for enterprise deals. | **+A3, +A5, +A8 (full)**, +Vibe Code Governor (VCG basic) | +18 = 50 total (Strategy, Risk Matrix, Entry/Exit Criteria, Compliance Checklist, EU AI Act Evidence, SSO Integration) | +L1 (SSO/SAML, Slack bot) +L5 full dashboards +**L6 foundation** (EU AI Act + SOC2 + ISO27001) |
| **PM4** | **v2+ — Career Intelligence + Enterprise SaaS** | Ongoing (W47+) | 2027-04-06 → ongoing | Career Compass, full 70-doc catalog, Cloud Device Grid, multi-tenant SaaS, HIPAA/GxP enterprise compliance, multi-region data residency. | Ongoing agent catalog expansion | Full 70 | +**L7 Career Intelligence** +L6 GxP, multi-region data residency +L1 multi-tenant |

**Total program:** ~18 months PM1 start → PM3 GA, then ongoing PM4 expansion.

**Key dates (locked under v1.1):**
- Project kickoff: **2026-04-27** (PM1 M0 start)
- MVP GA (PM1 exit): **2026-09-21**
- v1.5 GA (PM2 exit): **2027-01-09** *(swap applied: self-healing needs 16 weeks)*
- v2 GA (PM3 exit): **2027-04-03** *(swap applied: governance + enterprise auth ships in 12 weeks after self-healing stable)*
- v2+ launch: **2027-04-06** onwards

---

## PM1 — MVP Scope (Expanded Explicit Call-Outs) (retained from MILESTONE_REGISTRY v2.0)

PM1 internally contains 7 sub-milestones (M0 → M6). This structure is canonical and locked via the existing `MILESTONE_REGISTRY.md`. Do not re-sequence.

### PM1 Feature Pillars (explicit)

1. **Test Case Management (PM1-P1)** — Notion-style TipTap editor, BDD + traditional modes, tags, priority, linked requirements, case versioning, RTM (Requirements Traceability Matrix), A1 Test Case Generator with Clarification Questions gate, A2 Dedup live chips while authoring, bulk import (CSV/TestRail/Zephyr/Xray/qTest). *Delivered in M3.*

2. **Integrations (PM1-P2)** — Jira 2-way sync (OAuth 2.0 3-LO, webhook + 2-min poll fallback, comment mirroring), GitHub/GitLab (webhook bridge for Test Runs, CI trigger), Slack (outbound notifications — inbound ChatOps deferred to PM3), Confluence (inbound PRD read for A1 context; outbound report write), Figma (inbound design context for A1). *Delivered across M0 (infra), M3 (Jira), M4 (Jira 2-way + webhooks), M5 (GitHub/GitLab/Slack notifications).*

3. **Bug Management (PM1-P3)** — Defect creation form prefilled from failing test run, A4 Defect Intelligence 5-layer RCA (Stack → Env → Config → Code → Data), 4-category classification (App / Test / Flaky / Env), evidence auto-capture (screenshot + console + HAR + environment snapshot), semantic duplicate defect detection via pgvector, Jira 2-way sync on save, defect form RTM linkage. *Delivered in M4.*

4. **Basic Reporting (PM1-P4)** — Templated auto-filled reports for Daily Status, Weekly Status, Sprint Sign-off, Release Readiness. Executive Dashboard with pass rate, defect trend, coverage, release RAG indicators, and ROI calculator (cost_avoidance = SUM(defects_caught × stage_multiplier) where stage_multiplier = {requirements:10, design:20, build:100, prod:1000}). Personal dashboard (my cases, my bugs, my approvals, reports due). *Delivered in M5 (basic reports) and M6 (Executive Dashboard + ROI).*

5. **Core Doc Catalog (PM1-P5)** — 12 of 70 document templates unlocked: Test Plan, Test Strategy, Test Estimation, Daily Status Report, Weekly Status Report, Sprint Sign-off, Release Readiness Report, Defect Report, Root Cause Analysis (RCA), Exploratory Testing Charter, Regression Test Outline, Requirements Traceability Matrix (RTM). All generated via Document Intelligence Layer with section-level confidence scoring, PDF export, versioning, @mentions, comments. *Delivered in M2.*

### PM1 Sub-Milestone Table

| Sub | Name | Window | Exit Gate |
|-----|------|--------|-----------|
| M0 | Setup & Infrastructure | 2026-04-27 → **2026-05-03 (CLOSED)** | Auth + RBAC + Next.js shell + Render deploy + CI/CD hello-world. **✅ CLOSED — 17 PASS / 0 FAIL / 2 DEFERRED to M1.5. See `docs/milestones/M0_completion_report.md`.** |
| M1 | Users & Roles | 2026-05-11 → 2026-05-24 (2w) | 4 roles (Admin/Lead/QA/Stakeholder), project CRUD, RLS enforced |
| M2 | Test Documents & Knowledge Base — **Core Doc Catalog (12 templates)** | 2026-05-25 → 2026-06-14 (3w) | KB first-class, 12 doc templates, RAG pipeline (pgvector + BGE), PDF export |
| M3 | Test Cases & AI Generation — **Test Case Management** | 2026-06-15 → 2026-07-05 (3w) | **A1** Test Case Generator live, **A2** Dedup live chips, Notion editor, BDD+traditional, RTM |
| M4 | Runs, Defects & Jira — **Bug Management + Integrations** | 2026-07-06 → 2026-07-26 (3w) | Test Runs + evidence auto-capture + **A4** 5-layer RCA + Jira 2-way sync |
| M5 | Automation + Basic Reports + MVP Launch — **Basic Reporting** | 2026-07-27 → 2026-08-16 (3w) | Playwright runner, basic reports (Daily/Weekly/Sprint/Release), pilot onboarding |
| M6 | Full Reports & GA — **Executive Reporting + ROI** | 2026-08-17 → 2026-09-20 (5w) + GA 2026-09-21 | Executive Dashboard with ROI formula, release readiness, WCAG 2.2 AA, GA sign-off |

**PM1 exit gate → PM2 entry gate:** MVP GA signed off, ≥2 Iksula pilots live, ≤2% agent error rate, p95 latency targets met, 688%-class ROI demonstrated, 12-template catalog stable.

---

## PM2 — v1.5 Sub-Milestone Structure (SELF-HEALING + TEST DATA + FULL AUTOMATION — was PM3)

PM2 ships Post-MVP capabilities that extend test execution depth: synthetic data, self-healing, AI product testing, visual regression, mobile, on-prem. Core rationale: these strengthen what PM1 already delivers (test management + execution) before adding governance/low-code layers in PM3.

| Sub | Name | Window (absolute) | Week (within PM2) | Exit Gate |
|-----|------|--------------------|-------------------|-----------|
| M7 | Test Data Generation (A6) | 2026-09-22 → 2026-10-10 | W1-3 (3w) | Inline synthetic data generation with provenance, re-generate, version history, audit trail |
| M8 | Test Maintenance Self-Healing (A7) | 2026-10-13 → 2026-10-31 | W4-6 (3w) | Background suggestions, self-healing at scale, approve-in-context only (never silent edit), 40% reduction in flaky tests |
| M9 | A8 Advanced (Risk-Adaptive Planning) | 2026-11-03 → 2026-11-14 | W7-8 (2w) | Adaptive test strategy from historical defect patterns, risk scoring from code churn, auto-updated on PR |
| M10 | AI Product Tester (APT) | 2026-11-17 → 2026-11-28 | W9-10 (2w) | Autonomous end-to-end test execution, scenario discovery from user flows, exploratory testing automation |
| M11 | Visual Regression + Mobile + On-Prem | 2026-12-01 → 2026-12-19 | W11-13 (3w) | In-house diff + partner hybrid, mobile app (iOS/Android Capacitor), on-prem deployment guide (Helm chart) |
| M12 | v1.5 GA + 32-Doc Catalog | 2026-12-22 → 2027-01-09 | W14-16 (3w) | 32 of 70 doc templates, v1.5 GA, AI Product Tester in beta, 5-8 paying customers, self-healing reducing flaky tests by ≥40% |

**PM2 exit gate → PM3 entry gate:** v1.5 GA signed off, ≥5 paying customers, on-prem deployment validated at 1 customer, 32 doc templates stable, predictive analytics dashboard live, A7 self-heal blocking ≥40% flaky test rework.

---

## PM3 — v2 Sub-Milestone Structure (LOW-CODE + GOVERNANCE + ENTERPRISE FOUNDATION — was PM2)

PM3 ships Governance + Low-Code + Enterprise capabilities: low-code authoring, test selection, full test planning, Vibe Code Governor, SSO/SAML, Slack ChatOps, EU AI Act / SOC2 / ISO27001 foundation. Rationale: these unlock enterprise buying with proven product depth from PM1+PM2 underpinning.

| Sub | Name | Window (absolute) | Week (within PM3) | Exit Gate |
|-----|------|--------------------|-------------------|-----------|
| M13 | Low-Code Authoring (A3) | 2027-01-12 → 2027-01-30 | W1-3 (3w) | Notion-style automation editor, drag-handles + slash commands, exports to Playwright/Selenium/Cypress/WebdriverIO |
| M14 | Test Selection (A5) + PR-Gated CI | 2027-02-02 → 2027-02-20 | W4-6 (3w) | Change-based subsetting, ranked by impact, GitHub/GitLab Actions integration, 60% CI time reduction demo |
| M15 | Full Test Planning (A8 Full) | 2027-02-23 → 2027-03-06 | W7-8 (2w) | Auto-strategy from PRD alone, risk matrix, entry/exit criteria, integrates with PM3 doc templates (+18) |
| M16 | Vibe Code Governor (Basic) + Agent Governance | 2027-03-09 → 2027-03-20 | W9-10 (2w) | Governance layer for AI-written code, every A1/A2/A3/A4/A5/A8 action traceable, audit trail for EU AI Act L6 |
| M17 | Enterprise Auth (SSO/SAML) + Slack ChatOps | 2027-03-23 → 2027-03-27 | W11 (1w) | Okta / Azure AD / Google Workspace SSO, Slack bot for test case triage, command-k from Slack |
| M18 | v2 GA + 50-Doc Catalog | 2027-03-30 → 2027-04-03 | W12 (1w) | 50 of 70 doc templates, v2 GA, Vibe Code Governor in production, SOC2 Type I audit initiated, 15+ paying customers |

**PM3 exit gate → PM4 entry gate:** v2 GA signed off, ≥15 paying customers, SSO in production, Vibe Code Governor blocking merges with >5 violations, 50 doc templates stable, SOC2 Type I report issued.

---

## PM4 — v2+ (Career + Enterprise SaaS) — High-Level Roadmap (ongoing)

| Initiative | Timeline | Scope |
|------------|----------|-------|
| Career Compass (L7) | W47-52 (2027-04-06 → 2027-05-14) | Skills graph, job market matching, salary benchmarking, learning paths |
| Full 70-Doc Catalog | W47-60 (2027-04-06 → 2027-07-30) | Remaining 20 templates (Compliance, Advanced Analytics, Architecture Review, etc.) |
| Cloud Device Grid | W55-70 (2027-06-14 → 2027-10-08) | Partner integration (BrowserStack/LambdaTest) + hybrid self-host grid |
| Multi-Tenant SaaS | W50-68 (2027-05-03 → 2027-09-24) | Per-org subdomain routing, row-level tenant isolation, tenant-scoped secrets |
| Enterprise Compliance | W55-72 (2027-06-14 → 2027-10-22) | HIPAA, GxP (FDA 21 CFR Part 11), multi-region data residency (EU/US/APAC) |
| White-Label | W65-75 (2027-09-03 → 2027-11-19) | Customer branding, custom domains, embeddable QA Nexus widgets |

**PM4 has no fixed exit gate** — it is the ongoing product evolution phase.

---

## AI Agent Program (project-level, v1.1)

| Agent | Name | Purpose | Ships In | Blueprint Owner |
|-------|------|---------|----------|------------------|
| **A1** | Test Case Generator | PRD/Jira/Figma → test cases with Clarification Questions gate | PM1 (M3) | Product |
| **A2** | Test Deduplication | Semantic dedup, live chips, bulk audit | PM1 (M3) | Product |
| **A4** | Defect Intelligence (5-layer RCA) | Stack → Env → Config → Code → Data with 4-category classification | PM1 (M4) | Product |
| **A6** | Test Data Generation | Inline synthetic data with provenance | **PM2 (M7)** | Product |
| **A7** | Test Maintenance | Self-healing background suggestions | **PM2 (M8)** | Product |
| **A8 (adv)** | Test Planning (Advanced) | Risk-adaptive planning from defect patterns | **PM2 (M9)** | Product |
| **APT** | AI Product Tester | Autonomous E2E test discovery + execution | **PM2 (M10)** | Product |
| **A3** | Low-Code Authoring | Notion-style automation editor (drag + slash) | **PM3 (M13)** | Product |
| **A5** | Test Selection | Change-based PR-gated CI subsetting | **PM3 (M14)** | DevEx |
| **A8 (full)** | Test Planning (Full) | Auto-strategy from PRD alone, risk matrix, entry/exit criteria | **PM3 (M15)** (partial in PM1 M2) | Product |
| **VCG** | Vibe Code Governor | Governance layer for AI-written code | **PM3 (M16)** basic / PM4 advanced | Security |

**Total AI entities across program:** 9 named agents (A1-A8 + VCG) + 1 autonomous product tester (APT) = **10 AI entities**.

---

## 7-Layer Architecture Progression (v1.1)

```
LAYER 7: CAREER INTELLIGENCE              ─────── PM4 (W47+)
LAYER 6: COMPLIANCE & GOVERNANCE          ──── PM3 foundation (EU AI Act, SOC2/ISO27001), PM4 GxP/HIPAA/multi-region
LAYER 5: ANALYTICS & VALUE VISIBILITY     ── PM1 lite, PM2 predictive, PM3 full dashboards, PM4 enterprise BI
LAYER 4: AGENTIC AI                       ─ PM1 (3) → PM2 (+A6/A7/A8adv/APT = 7) → PM3 (+A3/A5/A8full/VCG = 11) → PM4 (ongoing)
LAYER 3: DOCUMENT INTELLIGENCE            PM1 (12) → PM2 (32) → PM3 (50) → PM4 (70)
LAYER 2: KNOWLEDGE LAYER                  PM1 pgvector + RAG foundation → PM2 full GraphRAG → PM3 Graphiti temporal → PM4 knowledge mesh
LAYER 1: UNIFIED PLATFORM                 PM1 5 integrations (Jira+GitHub+Slack+Confluence+Figma) → PM2 +on-prem +mobile → PM3 +SSO +Slack ChatOps → PM4 multi-tenant
```

---

## Doc Template Catalog Progression (of 70 total, v1.1)

| Phase | Count Added | Running Total | Categories Unlocked |
|-------|-------------|---------------|----------------------|
| PM1 | +12 | 12 | **Core Doc Catalog**: Planning (Test Plan, Strategy, Estimation), Execution (Daily, Weekly, Sprint, Release), Defect (Defect Report, RCA, Exploratory Charter), Regression outline, RTM |
| PM2 | +20 | 32 | Advanced Automation (Visual Regression, Performance Test Plan, Accessibility Audit, Mobile Test Matrix), Data (Synthetic Data Charter, Data Quality), Self-Heal (Maintenance Report, Flakiness Report) |
| PM3 | +18 | 50 | Strategy (Risk Matrix, Entry/Exit Criteria, Compliance Checklist), Governance (EU AI Act, Audit Trail), Enterprise (SSO Integration, Migration Plan) |
| PM4 | +20 | 70 | Enterprise (HIPAA, GxP, SOC2 extended, ISO27001 extended), Architecture Review, Advanced Analytics, Career Intelligence |

---

## Non-Functional Targets (project-level, v1.1)

| Metric | PM1 (MVP) | PM2 (v1.5 Self-Healing) | PM3 (v2 Governance) | PM4 (v2+) |
|--------|-----------|--------------------------|----------------------|-----------|
| Customer count | 2-3 pilots | 5-8 customers | 15+ customers | 50+ customers |
| p95 API latency | <500ms | <350ms | <250ms | <200ms |
| A1/A2/A4 confidence auto-approve | ≥80% | ≥85% | ≥90% | ≥92% |
| Doc template count | 12 | 32 | 50 | 70 |
| Named AI agents | 3 | 7 | 11 | 12+ |
| Architecture layers | L1-L5 | +L2 full GraphRAG +L5 predictive | +L6 foundation (EU AI Act, SOC2, ISO27001) | +L7 Career |
| Compliance | None | None (execution depth focus) | EU AI Act + SOC2 Type I + ISO27001 | +HIPAA +GxP +multi-region |
| Deployment modes | SaaS (Vercel+Oracle) | +On-prem + Mobile | +SSO + Slack ChatOps | +Multi-tenant SaaS |

---

## Cross-Phase Risks (project-level, beyond MVP)

| Risk | Phase Impact | Mitigation |
|------|--------------|------------|
| A6/A7/APT orchestration complexity at scale | PM2 | Reuse LangGraph patterns from A1/A2/A4, apply Agent Governance framework retroactively once VCG lands in PM3 |
| On-prem deployment support burden | PM2 | Helm chart + observability bundle + documented upgrade paths; limit to ≤3 on-prem customers in PM2 |
| Self-healing silent-edit risk | PM2 | A7 must never auto-apply — approve-in-context only, governance audit from M8 onwards |
| SSO vendor lock-in | PM3 | Abstract auth provider interface in PM1 M1, support multi-IDP from PM3 |
| Vibe Code Governor false positive rate | PM3 | Start VCG in warn-only mode for 4 weeks, progress to block-mode after tuning |
| Multi-tenant data isolation failure | PM4 | Row-level tenant_id + RLS policies introduced in PM3 schema migration, not PM4 |
| Enterprise compliance certification cost | PM3/PM4 | Outsource SOC2/ISO27001 to fractional CISO, start PM2 evidence capture, audit PM3 |
| Cloud Device Grid competitive moat (vs BrowserStack) | PM4 | Partner-first strategy; build only if demand exceeds partner pricing tolerance |
| Career Compass (L7) unclear monetization | PM4 | Ship as free-tier user engagement feature, not revenue driver; revisit at W60 |

---

## Decision Governance

**PM1 scope is locked** (per MILESTONE_REGISTRY v2.0 + SYNC_REPORT 2026-04-22 remediation). Any PM1 changes require Product + Eng Lead dual sign-off.

**PM2/PM3 scope is directional**, lockable 6 weeks before each phase start via Architecture Decision Records (ADRs). ADRs must be reviewed by Product + Eng + Security before lock. Note: PM2 v1.5 content was swapped with PM3 v2 content on 2026-04-22 — see v1.1 change log above.

**PM4 scope is aspirational**, reviewed quarterly. No lock required until 6 weeks before each initiative start.

---

## Document Precedence (project-level)

When any two project-level artifacts conflict, precedence order is:

1. **This document (PROJECT_ROADMAP.md v1.1)** — phase structure, dates, agent ownership
2. **MILESTONE_REGISTRY.md** — PM1 sub-milestone detail (M0-M6)
3. **PRD.md** — feature-level requirements (US-IDs, FR-IDs, NFR-IDs, GM-IDs)
4. **ERD.md** — data + system design (TB-IDs, EP-IDs, CO-IDs, ADR-IDs)
5. **Milestone/M*/Milestone_M*.md** — per-milestone execution plans
6. **QA_Nexus_Master_Brainstorm.md** — original vision (historical reference)

### Downstream Sync Checklist (new in v1.2)

Whenever this roadmap changes, the following documents must be re-checked for alignment. Record the sync status on each roadmap change.

| Document | What to check |
|----------|---------------|
| `MILESTONE_REGISTRY.md` | PM1/PM2/PM3 duration cells; sub-milestone windows; AI-agent ship phase; 7-layer progression |
| `SYNC_REPORT.md` | Scope still reads "project-level"; PM2/PM3 swap statement present; any new wave logged |
| `FINAL_REVIEW.md` | Audit scope covers all PMx, not just MVP; wave-1 fixes ticked |
| `PRD/PRD.md` | PM1 duration, persona-to-tool phase tags, layer progression (L1/L4/L6), user-story phase tags, FR numbering continuity |
| `ERD/ERD.md` | Service groups, table blocks, migration sequencing, per-agent phase tags, TB/CO/EP ID registry, Qdrant note clarified |
| `QA_Nexus_Master_Brainstorm.md` §17 | Post-MVP wave labels and agent ship tags match current PM2/PM3 order |
| `project_analysis.md` | Framed project-level (PM1–PM4), not MVP pre-PRD |
| `MVP_PRD.md` | PM1 scope pillars in sync with PM1 sub-milestone table |
| All `Milestone/M*/*.md` | Predecessor/handoff labels match current registry order |
| All `Milestone/PM4/*.md` | Initiative phase still correctly tagged PM4 |

---

## Changelog

| Date | Version | Change | Author |
|------|---------|--------|--------|
| 2026-04-22 | v1.0 | Initial project-level roadmap created. PM1 (MVP) = current 18-week program; PM2/PM3/PM4 derived from brainstorm §17 + §10. | Claude |
| 2026-04-22 | v1.1 | **PM2 ↔ PM3 swap** (v1.5 content = Self-Healing/Data/Automation, v2 content = Low-Code/Governance/Enterprise); **PM1 scope expanded** with explicit Test Case Management / Integrations / Bug Management / Basic Reporting / Core Doc Catalog call-outs. Sub-milestone IDs re-mapped: old M7-M12 (governance) → new M13-M18; old M13-M18 (self-healing) → new M7-M12. Dates recalculated: PM2 = 16 wk (2026-09-22 → 2027-01-09), PM3 = 12 wk (2027-01-12 → 2027-04-03). | Claude |
| 2026-04-23 | v1.2 | **Audit remediation (Wave 1).** Normalized PM1 duration to "21 calendar weeks (18 build weeks M0–M6 feature delivery + 3 GA / hardening weeks wrap within M6)"; no milestone dates or exit gates changed. Added downstream sync checklist. PM2/PM3 swap confirmed in all PRD persona / layer / user-story mappings; ERD service groups, tables, migration logic, and agent phase tags rebuilt from canonical phase order. Registry overview corrected (PM2 = 16 wk, PM3 = 12 wk). Stale SYNC_REPORT and FINAL_REVIEW flagged for Wave 2 replacement. | Claude |

---

**End of PROJECT_ROADMAP.md (v1.1)**
