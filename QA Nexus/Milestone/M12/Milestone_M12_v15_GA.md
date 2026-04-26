---
milestone_id: M12
parent_project_milestone: PM2
name: "v1.5 GA + 32-Doc Catalog + Customer Onboarding"
version: 2.0
date: 2026-04-23
phase: v1.5
window: "W14–16 of PM2"
start_date: 2026-12-22
end_date: 2027-01-09
duration_weeks: 3
status: "Build-Ready"
---

# MILESTONE M12: v1.5 GA + 32-DOC CATALOG + CUSTOMER ONBOARDING

**Organization:** Iksula Services Pvt Ltd  
**Milestone:** M12 (Weeks 14–16 of PM2)  
**Version:** 2.0 (Build-Ready)  
**Date Created:** 2026-04-22  
**Date Updated:** 2026-04-23  
**Status Badge:** Planning → Build-Ready  
**Duration:** 3 weeks (2026-12-22 → 2027-01-09)  
**Key Achievement:** v1.5 General Availability (GA) launch; 32 doc templates unlocked; ≥5 paying customers; APT in beta; all PM2 features stable

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Context: PM2 Exit Milestone](#2-context-pm2-exit-milestone)
3. [Definition of Ready (DoR)](#3-definition-of-ready-dor)
4. [M12 Scope & Mission](#4-m12-scope--mission)
5. [32-Doc Catalog Expansion](#5-32-doc-catalog-expansion)
6. [Customer Expansion & Onboarding](#6-customer-expansion--onboarding)
7. [GA Readiness Checklist](#7-ga-readiness-checklist)
8. [Feature & Task Breakdown](#8-feature--task-breakdown)
9. [Test Strategy](#9-test-strategy)
10. [Risks & Mitigations](#10-risks--mitigations)
11. [Rollback & Fallback](#11-rollback--fallback)
12. [Observability & GA Metrics](#12-observability--ga-metrics)
13. [Launch Communications](#13-launch-communications)
14. [Post-GA 14-Day Stabilization](#14-post-ga-14-day-stabilization)
15. [Handoff & Definition of Done](#15-handoff--definition-of-done)
16. [Appendix: 32-Doc Templates](#16-appendix-32-doc-templates)

---

## 1. EXECUTIVE SUMMARY

M12 is **QA Nexus v1.5 General Availability (GA)** milestone. All features from PM1 (MVP) + PM2 (A6, A7, A8-adv, APT, visual regression, mobile, on-prem) are stable, hardened, and ready for production customer use.

**Mission:** Ship v1.5 GA to production; unlock 32 of 70 document templates; onboard ≥5 paying customers; establish post-GA support infrastructure.

**Key Deliverables:**
- **v1.5 GA Release:** Frozen feature set, zero P0 defects, all PM2 features tested + documented
- **32-Doc Catalog:** Advanced Automation (Visual, Performance, Mobile, Accessibility), Data (Synthetic, Quality), Self-Heal (Maintenance, Flakiness), Strategy (Risk Matrix, Entry/Exit), plus 20 additional templates
- **Customer Onboarding:** 5–8 customer prospects converted to pilots → paying customers; NPS baseline measured
- **Support Infrastructure:** Slack channel, on-call runbook, escalation playbook, SLA definitions

**Success Criteria:**
- ≥5 paying customers live on v1.5
- 0 critical bugs in first week post-GA
- ≥80% customer team adoption (login ≥4 days/week)
- NPS ≥40 (promoters − detractors)
- Self-healing reducing flaky test rework by ≥40% (measured vs. M8 baseline)

---

## 2. CONTEXT: PM2 EXIT MILESTONE

**M7–M11 Summary (All Stable):**
- **M7 (A6 Test Data):** Synthetic data generation with provenance, versioning, audit trail — live
- **M8 (A7 Self-Healing):** Flaky test suggestions, HITL approval gates, ≥40% reduction in flaky rework — live
- **M9 (A8 Advanced):** Risk-adaptive test planning from code churn, auto-updated on PR — live
- **M10 (APT):** Autonomous E2E discovery, execution, exploratory testing, scenario promotion — live in beta
- **M11 (Visual/Mobile/OnPrem):** Visual regression, iOS/Android native apps, Helm chart — stable

**M12 (GA) Role:** Harden all PM2 features for production; unlock additional document templates (32 of 70); convert prospect pilots to paying customers; establish production support.

---

## 3. DEFINITION OF READY (DoR)

**Prerequisites for Viable M12 Kickoff:**

1. M11 (Visual Regression + Mobile + On-Prem) complete (all sub-features stable for ≥7 days)
2. M10 (APT) beta operational (scenario discovery, execution, exploratory testing working, <25% false-positive rate on exploratory findings)
3. All M7–M9 features validated at scale (A6, A7, A8 tested with 5+ pilot projects)
4. Feature flags dark-launched for A6, A7, A8-adv, APT, visual, mobile, on-prem (ready to enable/disable per customer)
5. Observability dashboards live (SigNoz + Langfuse, all PM2 metrics tracked)
6. Documentation drafted (API specs, user guide, admin guide, deployment guide, troubleshooting)
7. Customer success team trained (onboarding playbook, SLA definitions, escalation procedures)
8. Legal + compliance sign-off: ToS, privacy policy, GDPR assessment, SOC2 Type I audit initiated
9. Security audit completed (pen testing, vulnerability scan, remediation closed)
10. ≥5 customer prospects identified + pilots scheduled (Iksula relationships, signed SOW)

---

## 4. M12 SCOPE & MISSION

### Phase 1 (W1: GA Hardening + Doc Catalog Expansion) — 2026-12-22 → 2026-12-28

**Goal:** All PM2 features stable + frozen; 32-doc catalog complete; customer-ready state.

**Scope:**
- **Feature Freeze:** No new features in W1; only critical bug fixes (P0 + P1)
- **Doc Catalog:** Expand from 12 (PM1) → 32 (PM2 additional 20 templates)
- **Customer Migration:** Migrate MVP pilots (M5, M6) to v1.5; measure adoption metrics
- **Documentation:** Finalize API specs, user guide, admin guide, deployment guide, troubleshooting

---

### Phase 2 (W2–3: Customer Onboarding + GA Launch) — 2026-12-29 → 2027-01-09

**Goal:** ≥5 paying customers live; launch communications published; post-GA support running.

**Scope:**
- **Customer Expansion:** Onboard 5–8 customer pilots (signed contract, SaaS/on-prem deployment)
- **Pilot Support:** 1 dedicated customer success person per customer (first 2 weeks)
- **GA Launch:** Announcement email, release notes, webinar, marketing site update
- **Post-GA Stabilization:** 14-day dedicated hotfix queue; daily standup; SLA tracking

---

## 5. 32-DOC CATALOG EXPANSION

### PM1 (12 Templates)

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

### PM2 Additional (20 Templates) — NEW in M12

**Advanced Automation (4):**
- 13. Visual Regression Test Plan (how to baseline, approve diffs, integrate into CI)
- 14. Performance Test Plan (load testing, stress testing, endurance testing)
- 15. Accessibility Audit Report (WCAG 2.1 AA checklist + findings)
- 16. Mobile Test Matrix (iOS/Android test coverage, device list, OS versions)

**Data & Synthetic (2):**
- 17. Synthetic Data Charter (test data strategy, generation rules, compliance)
- 18. Data Quality Report (data completeness, accuracy, timeliness metrics)

**Self-Healing & Maintenance (2):**
- 19. Test Maintenance Report (flaky test fixes applied, A7 suggestions reviewed, stability trend)
- 20. Flakiness Report (flaky test inventory, root causes, remediation plan)

**Strategy & Governance (4):**
- 21. Risk Assessment Matrix (features × risk levels, test prioritization)
- 22. Entry/Exit Criteria (when to start/stop testing, gate definitions)
- 23. Compliance Checklist (regulatory requirements, audit trail evidence, sign-off)
- 24. Quality Metrics Dashboard (DPPM, DRE, test yield, MTBF, coverage %)

**Integration & Deployment (4):**
- 25. Continuous Integration Plan (pipeline stages, automation gates, deployment strategy)
- 26. Test Environment Setup Guide (infrastructure, seed data, performance baselines)
- 27. On-Prem Deployment Runbook (Helm install, health checks, troubleshooting)
- 28. Mobile App Release Plan (TestFlight/Play Store submission, rollout strategy)

**Customer & Operations (4):**
- 29. SLA & Support Agreement (response times, incident severity definitions)
- 30. Customer Onboarding Playbook (pilot-to-paid conversion, success metrics)
- 31. Release Communications Template (announcement, change log, upgrade guide)
- 32. Post-GA Stabilization Runbook (hotfix queue, daily standup, escalation)

### Generation & Approval

**A1 Context Gathering:**
- User selects template (e.g., "Visual Regression Test Plan")
- Provides context: project scope, platforms (web/mobile), test environment, risk level
- A1 reads KB + past projects; generates draft in <30s
- Section confidence scores visible; user can refine low-confidence sections
- Lead approval required; version history tracked

---

## 6. CUSTOMER EXPANSION & ONBOARDING

### Customer Prospect Pipeline (Target: 5–8)

| Customer | Status | Type | Deployment | Contract | Start Date |
|----------|--------|------|-----------|----------|-----------|
| **Customer A** | Qualified | Mid-market SaaS | SaaS (Vercel+Oracle) | SOW signed | 2026-12-29 |
| **Customer B** | Qualified | Enterprise (fintech) | On-prem (Helm) | SOW signed | 2027-01-02 |
| **Customer C** | Qualified | Startup | SaaS | SOW signed | 2027-01-05 |
| **Customer D** | Qualified | Mid-market | On-prem | SOW signed | 2027-01-02 |
| **Customer E** | Qualified | Enterprise | SaaS + Mobile pilot | SOW signed | 2027-01-06 |

### Onboarding Flow (Per Customer)

**Week 1 (2026-12-29 → 2027-01-04):**
1. Kickoff meeting: success criteria, user roles, integrations (Jira, GitHub, Slack)
2. Workspace setup: projects, team members, RBAC roles
3. Data migration: import existing test cases (CSV, TestRail export)
4. Integrations: OAuth Jira, GitHub webhook, Slack notifications
5. Training: 2-hour live session per team (QA engineers, leads, managers)

**Week 2 (2027-01-05 → 2027-01-09):**
1. Go-live: customer begins using v1.5 in production
2. Daily check-in: dedicated CSM verifies adoption, resolves issues
3. Feedback collection: NPS survey, feature requests, pain points
4. Metrics baseline: adoption (login days), velocity (cases/day), quality metrics
5. Stabilization: hotfixes deployed same-day if P0 bug reported

### Success Metrics (Per Customer)

- **Adoption:** ≥80% of assigned team members log in ≥4 days/week
- **Velocity:** ≥50 test cases authored/executed per week (target: 10 per person)
- **Quality:** Defect escape rate ≤5%; RTM coverage ≥80%
- **NPS:** ≥40 (promoters − detractors) at 2-week mark

### Pricing Model (v1.5)

**Tier 1 (Starter):** $2K/month
- 5–10 team members, up to 1K test cases, SaaS deployment only

**Tier 2 (Professional):** $5K/month
- 10–50 team members, up to 10K test cases, SaaS + mobile app, all PM2 features

**Tier 3 (Enterprise):** $15K+/month + implementation
- Unlimited team members, unlimited test cases, on-prem deployment, SSO (PM3), dedicated CSM

---

## 7. GA READINESS CHECKLIST

### Feature Completeness

- ✅ A1 Test Case Generator (PM1) — stable, ≥80% confidence auto-approve rate
- ✅ A2 Test Deduplication (PM1) — live chips, semantic matching working
- ✅ A4 Defect Intelligence (PM1) — 5-layer RCA, 4-category classification stable
- ✅ A6 Test Data Generation (M7) — synthetic data with provenance, versioning
- ✅ A7 Self-Healing (M8) — background suggestions, HITL approval, ≥40% flaky reduction
- ✅ A8 Advanced Planning (M9) — risk-adaptive strategy, code churn scoring
- ✅ APT (M10) — scenario discovery, autonomous execution, exploratory testing (beta)
- ✅ Visual Regression (M11) — screenshot diff, baseline management, approval workflow
- ✅ Mobile App (M11) — iOS + Android, biometric auth, offline sync
- ✅ On-Prem Deployment (M11) — Helm chart, air-gapped networking, KMS integration

### Quality Gates

- ✅ Zero P0 defects in main branch (7+ consecutive days)
- ✅ <3 P1 defects open (all slated for M12 or M13)
- ✅ <5% test flakiness (E2E + API tests)
- ✅ p95 API latency <350ms (doc gen <60s, RCA <10s)
- ✅ No regressions vs. M5 MVP baseline

### Security & Compliance

- ✅ Pen testing completed; critical + high vulnerabilities remediated
- ✅ GDPR assessment signed off (privacy policy, data retention)
- ✅ SOC2 Type I audit initiated (audit scope + evidence collection started)
- ✅ Jira 2-way sync — zero data loss in 30-day live test
- ✅ Password reset + MFA flows — tested + working

### Documentation

- ✅ API specification (OpenAPI 3.0): all endpoints, request/response examples
- ✅ User guide: 6 core JTBDs, keyboard shortcuts, search, integrations
- ✅ Admin guide: user management, RBAC, project setup, integrations, audit log
- ✅ Deployment guide (SaaS + On-Prem): prerequisites, install steps, verification
- ✅ Troubleshooting guide: common issues + remediation (agent errors, API failures, sync issues)
- ✅ API migration guide (if breaking changes from MVP)
- ✅ Release notes: v1.5 highlights, new features, bug fixes, known issues, upgrade path

### Support Infrastructure

- ✅ Slack channel: #qa-nexus-support (Iksula team + customer reps)
- ✅ On-call runbook: P0–P3 scenarios, escalation tree, communication templates
- ✅ Customer success playbook: onboarding, NPS, feedback collection, success metrics
- ✅ SLA definitions: response time (P0: 1h, P1: 4h, P2: 24h), MTTR targets
- ✅ Incident response: postmortem template, RCA format, communication to customers

### Marketing & Launch

- ✅ Release announcement email (Iksula + customer mailing lists)
- ✅ Release notes (published on website + in-app)
- ✅ Launch webinar (2 sessions: 9am + 6pm PT, 30 min each, Q&A)
- ✅ Marketing website: v1.5 feature highlights, case studies, pricing page
- ✅ Social media: LinkedIn + Twitter announcements
- ✅ Internal comms: all-hands update, customer success prep

---

## 8. FEATURE & TASK BREAKDOWN

### Week 1: GA Hardening + Doc Catalog (W1: 2026-12-22 → 2026-12-28)

#### GA-T001: Feature Freeze + Bug Triage
**Description:** Freeze features; triage open defects; fix P0 + P1 only.

**Details:**
- Lock code: no new features merged after 2026-12-22
- Triage all open issues: P0 (fix), P1 (fix or doc), P2+ (defer to M13)
- Regression testing: run full E2E suite against every fix

**Priority:** P0  
**Estimate:** 24 hours (ongoing through W1)  
**Owner:** Eng Lead  
**TB/EP:** None (process task)

---

#### GA-T002: 32-Doc Template Generation + Approval
**Description:** A1 generates 20 new doc templates; QA Lead approves all.

**Details:**
- Loop: select template (13–32) → A1 generates draft → Lead reviews + approves
- Templates provided: Visual, Performance, Accessibility, Mobile, Synthetic Data, Data Quality, Maintenance, Flakiness, Risk Matrix, Entry/Exit, Compliance, CI Plan, Test Env Guide, On-Prem Runbook, Mobile Release, SLA, Onboarding, Release Comms, Post-GA Runbook
- Confidence scoring: all sections ≥80% confidence before approval
- Versioning: freeze template versions for GA (can't be edited until PM3)

**Priority:** P0  
**Estimate:** 16 hours  
**Owner:** Product + QA  
**TB/EP:** TB-003 (documents table)

---

#### GA-T003: Documentation Finalization
**Description:** Complete all user-facing docs for GA.

**Details:**
- API spec: OpenAPI 3.0, all EP-IDs, request/response examples
- User guide: 6 JTBDs, keyboard shortcuts, integrations
- Admin guide: RBAC, projects, users, audit log, troubleshooting
- Deployment guide: SaaS + on-prem install, verification steps
- Troubleshooting: common issues, remediation

**Priority:** P0  
**Estimate:** 20 hours  
**Owner:** Technical Writer + Eng  
**TB/EP:** None (documentation artifact)

---

#### GA-T004: Customer Migration (MVP → v1.5)
**Description:** Migrate 2–3 MVP pilots to v1.5; measure adoption.

**Details:**
- Pre-migration: backup data, test upgrade path
- Migration: 1-click upgrade in SaaS + mobile app distribution to beta testers
- Validation: all test cases + defects present, no data loss
- Adoption tracking: login days, velocity, NPS baseline

**Priority:** P0  
**Estimate:** 12 hours  
**Owner:** Backend + Customer Success  
**TB/EP:** None (operational task)

---

### Week 2–3: Customer Onboarding + GA Launch (W2–3: 2026-12-29 → 2027-01-09)

#### GA-T005: Customer Kickoff + Workspace Setup (Daily)
**Description:** Per customer: kickoff meeting, workspace setup, data migration, integrations, training.

**Details:**
- Daily per customer: 4-hour kickoff (all roles), 2-hour training session
- Workspace: create projects, teams, RBAC roles
- Migration: import test cases (CSV, TestRail)
- Integrations: OAuth Jira, GitHub webhook, Slack
- Training: QA engineers (authoring, execution, reporting), leads (approvals, dashboards)

**Priority:** P0  
**Estimate:** 40 hours (5 customers × 8 hours/customer)  
**Owner:** Customer Success + Eng  
**TB/EP:** None (operational task)

---

#### GA-T006: Metrics Baseline Collection
**Description:** Establish adoption + quality metrics baseline for each customer (for ROI calculation at PM3).

**Details:**
- Metrics: login days/week, cases authored/executed, velocity, quality gates
- Tools: Mixpanel (event tracking), Slack for daily updates
- Dashboard: custom per customer (visible to customer success + leadership)
- Tracking: throughout 2w pilot + post-GA

**Priority:** P1  
**Estimate:** 8 hours  
**Owner:** Product + Data Eng  
**TB/EP:** None (observability artifact)

---

#### GA-T007: GA Launch Communications
**Description:** Publish release announcement, notes, webinar.

**Details:**
- Email: Iksula + customer mailing lists (2026-12-29)
- Release notes: API changes, new features, bug fixes, known issues
- Website: update pricing, feature highlights
- Webinar: 2 sessions, 30 min each, live Q&A
- Social: LinkedIn + Twitter announcement

**Priority:** P0  
**Estimate:** 12 hours  
**Owner:** Marketing + Product  
**TB/EP:** None (marketing artifact)

---

#### GA-T008: Post-GA Support Operations (Ongoing 2w)
**Description:** Run hotfix queue, daily standups, escalation handling.

**Details:**
- Hotfix queue: P0 bugs fixed + deployed same-day; P1 within 4 hours
- Daily standup: 9am PT (ops + eng + customer success), 15 min
- Escalation: if customer critical issue, CEO + Eng Lead join call
- SLA tracking: response time, resolution time, customer satisfaction

**Priority:** P0  
**Estimate:** 80 hours (shared across team, 2w × 40h/w)  
**Owner:** Eng + Customer Success + Ops  
**TB/EP:** None (operational task)

---

## 9. TEST STRATEGY

### Regression Testing (Pre-GA)

- Full E2E suite: all 6 primary JTBDs (case, run, defect, jira, report, doc)
- All PM2 features: A6, A7, A8-adv, APT (basic), visual, mobile, on-prem
- 3 test apps: simple form, SPA (React), e-commerce (multi-page)
- Platforms: Chrome, Firefox, Safari (desktop); Chrome, Safari (mobile)

### Customer Acceptance Testing (Post-Kickoff)

- Customer-led testing: their test cases + data
- Validation: no data loss, integrations working, performance acceptable
- Sign-off: customer QA lead approves go-live

### Load Testing (Pre-GA)

- 5–8 concurrent customers × 10 users/customer = 50–80 concurrent users
- Sustained load test: 4 hours, measure latency + error rate
- Target: p95 <350ms, error rate <0.5%

---

## 10. RISKS & MITIGATIONS

| Risk | Impact | Likelihood | Mitigation | Owner |
|------|--------|------------|-----------|-------|
| **Customer data loss in migration** (CSV import fails) | Trust loss, legal liability | Low | Test import 3× on staging; rollback procedure documented; backup data pre-migration | Backend |
| **On-prem customer Helm chart failure** (install hangs) | Customer unable to deploy | Medium | 3-customer on-prem pilot pre-GA; runbook tested; DevOps on-call during customer install | DevOps |
| **APT exploratory testing false positives** (non-reproducible "bugs") | Customer frustration, support burden | Medium | Confidence threshold >0.8; HITL gate required; document false-positive rate in release notes | AI Eng |
| **Mobile app crashes in production** (critical iOS/Android regression) | Customer unable to review offline | Low | Pilot via TestFlight + Internal Track ≥2w pre-release; crash rate <1% required | Mobile Eng |
| **Jira 2-way sync orphans defect** (bidirectional sync breaks) | Data integrity issue | Low | Live sync test with customer Jira ≥2w pre-GA; zero orphan tolerance | Backend |
| **Customer success team overwhelmed** (5 customers × complex setups) | Poor onboarding experience | Medium | Assign 1 CSM per customer (first 2w); onboarding playbook detailed; async video guide fallback | Customer Success |
| **Post-GA hotfix queue backlog** (>3 P0 bugs arrive simultaneously) | SLA breach | Low | Dedicated hotfix team (3 eng rotating on-call); escalation to all-hands if needed | Eng Lead |
| **Marketing launch fails** (low customer inbound) | Revenue miss | Low | Pre-GA pipeline: 5–8 customers already qualified + signed SOW; don't rely on marketing for customer acquisition | Product |

---

## 11. ROLLBACK & FALLBACK

### Feature Flags (All dark-launched, ready to disable)

- `pm2.a6_synthetic_data` — Test data generation
- `pm2.a7_self_healing` — Flaky test suggestions
- `pm2.a8_advanced_planning` — Risk-adaptive strategy
- `pm2.apt_discovery` — Scenario discovery
- `pm2.apt_execution` — Autonomous execution
- `pm2.apt_exploratory` — Exploratory testing
- `pm2.visual_regression` — Screenshot diff
- `pm2.mobile_app_ios` — iOS native app
- `pm2.mobile_app_android` — Android native app
- `pm2.onprem_deployment` — On-prem Helm chart

### Fallback Paths

1. **Critical feature bug post-GA:** Disable feature flag; customer reverts to PM1 MVP while hotfix built
2. **Customer data loss:** Restore from daily backup (S3 or on-prem snapshot)
3. **On-prem install failure:** Revert Helm chart to prior version; customer waits for hotfix
4. **Jira sync broken:** Disable sync; customer manually syncs defects until fixed

### Rollback Decision (Post-GA)

- If >1 P0 bug in first 48 hours, declare "GA rollback phase" (pause new customer onboarding, focus on stabilization)
- If customer data loss occurs, mandatory audit of migration + backup strategy before next customer

---

## 12. OBSERVABILITY & GA METRICS

### Real-Time Dashboards

**Customer Adoption:**
- `active_customers` (count)
- `active_users_per_customer` (gauge, per customer)
- `login_days_per_week` (gauge, target ≥4 days)
- `test_cases_authored_per_week` (gauge, per customer)

**Product Quality:**
- `critical_bugs_open` (gauge, target = 0)
- `p95_api_latency_ms` (gauge, target <350ms)
- `doc_generation_p95_seconds` (gauge, target <60s)
- `error_rate_pct` (gauge, target <0.5%)

**Customer Satisfaction:**
- `nps_score` (gauge, target ≥40)
- `support_ticket_backlog` (gauge)
- `response_time_minutes` (gauge, P0 target <60min)

**Feature Usage (PM2):**
- `a6_synthetic_data_runs_total` (counter)
- `a7_self_healing_suggestions_total` (counter)
- `a8_risk_adaptive_plans_generated_total` (counter)
- `apt_scenarios_discovered_total` (counter)
- `visual_baseline_diffs_reviewed_total` (counter)
- `mobile_app_installs` (gauge, per platform)
- `onprem_deployments_active` (gauge)

### Alarms

- `critical_bugs_open > 0` → P0 alert (to Slack #qa-nexus-support)
- `p95_api_latency > 500ms` → P1 alert
- `error_rate > 1%` → P1 alert
- `support_ticket_backlog > 5` → P2 alert
- `nps_score < 30` → P2 alert (escalate to leadership)

---

## 13. LAUNCH COMMUNICATIONS

### Release Announcement Email (2026-12-29)

```
Subject: QA Nexus v1.5 GA — Autonomous Testing + Visual Regression + Mobile + On-Prem

Hello QA Community,

We're thrilled to announce QA Nexus v1.5 General Availability — the world's first 
AI-native operating system for QA professionals.

What's New:
• Autonomous E2E Testing (APT): Discover untested flows. Execute without scripting.
• Visual Regression: Screenshot diffs with approval workflow.
• Mobile App: Native iOS + Android for on-the-go QA.
• On-Prem Deployment: Air-gapped Kubernetes for regulated industries.
• Test Self-Healing (A7): AI fixes flaky tests automatically.
• Synthetic Data (A6): Generate realistic test data from templates.
• 32 Document Templates: Advanced Automation, Visual, Performance, Mobile, more.

ROI Proven: 688% ROI demonstrated across MVP pilots. Self-healing reduces test 
maintenance by 40%. Visual regression catches 2× more regressions vs. manual review.

Join our Launch Webinar:
Thursday 2026-12-30, 9am PT + 6pm PT (30 min, Q&A)
[register link]

v1.5 Pricing:
Starter: $2K/mo (5–10 team members, SaaS only)
Professional: $5K/mo (10–50 team members, SaaS + mobile + all PM2)
Enterprise: $15K+/mo (unlimited users, on-prem, SSO coming in v2)

[Full release notes] [Upgrade guide] [Pricing page]

Questions? Reply to this email or join #qa-nexus-support on Slack.

— The QA Nexus Team
```

### Release Notes (v1.5)

**Headline:** "Autonomous Testing, Visual Validation, Mobile QA, On-Prem Deployment"

**New Features:**
- APT (Autonomous Product Tester): Scenario discovery, autonomous execution, exploratory testing
- Visual Regression: Pixel-level + perceptual diff, baseline management, approval workflow
- Mobile App: iOS + Android native shells, biometric auth, offline-first
- On-Prem Deployment: Helm chart, air-gapped networking, customer KMS keys
- Test Self-Healing (A7): Flaky test suggestions, HITL approval, ≥40% rework reduction
- Synthetic Data (A6): Test data generation with provenance + versioning
- Risk-Adaptive Planning (A8-adv): Auto-strategy from code churn + defect history
- Doc Catalog: 32 of 70 templates (Advanced Automation, Data, Strategy, Operations)

**Bug Fixes:** [list of ≥10 notable fixes from M7–M12]

**Known Issues:**
- APT exploratory testing in beta; false-positive rate ~20% (improving in PM3)
- Mobile app v1.0 (basic navigation; advanced features in PM3)
- On-prem: single-node deployment only (HA in PM3)

**Upgrade Path:** SaaS customers auto-upgraded; on-prem: helm upgrade command

---

## 14. POST-GA 14-DAY STABILIZATION

### Daily Activities (2w, Jan 1–14)

**9am PT Daily Standup (15 min):**
- P0/P1 bug status
- Customer issue status
- Hotfix deployment status
- Blockers for next 24h

**4pm PT Customer Check-In (30 min, rotating per customer):**
- Adoption metrics review
- Feature usage analysis
- Support ticket review
- Go-live blockers

**Support Ticket Triage (2h/day):**
- P0: Fix + deploy same-day (hardstop)
- P1: Fix + deploy within 4 hours
- P2: Triage + schedule for M13
- P3: Document + defer to PM3

### Escalation Procedures

**P0 Escalation:**
1. Support team → Eng Lead (within 10 min)
2. Eng Lead → All Hands (pause other work, swarm fix)
3. If customer-critical: CEO + Eng Lead + Customer Success join call
4. Root cause documented; RCA posted to #qa-nexus-support within 2h

**Customer Escalation:**
1. If customer unhappy (NPS <30): Customer Success → Eng Lead → CEO call
2. Outcome: remediation offer (credit, extra support, feature priority)

---

## 15. HANDOFF & DEFINITION OF DONE

### Exit Criteria (M12 DoD)

1. ✅ Feature freeze observed; all P0 defects fixed; <3 P1 defects open
2. ✅ 32-doc catalog unlocked + approved (templates 13–32 live)
3. ✅ ≥5 paying customers live + onboarded (SaaS + on-prem mix)
4. ✅ Adoption metrics baseline collected (login days, velocity, NPS)
5. ✅ 0 critical bugs in first 48h post-GA
6. ✅ v1.5 GA announcement published (email, webinar, website, social)
7. ✅ Full documentation live (API spec, user guide, admin guide, troubleshooting, deployment)
8. ✅ Post-GA support operations running (daily standup, hotfix queue, escalation)
9. ✅ Customer success team trained + assigned (1 CSM per customer, first 2w)
10. ✅ Observability dashboards live (adoption, quality, support metrics)
11. ✅ Feature flags deployed (all PM2 flags dark-launched, ready to enable/disable)
12. ✅ 14-day stabilization protocol in place (daily standups, escalation procedures)
13. ✅ Legal + compliance finalized (ToS, privacy, GDPR, SOC2 evidence collection)
14. ✅ Security pen-test completed; critical + high vulnerabilities closed

### Handoff Artifacts

- **Deployment Guide:** SaaS auto-upgrade instructions; on-prem Helm chart + install guide
- **Customer Success Playbook:** Onboarding checklist, training materials, success metrics, NPS survey
- **Support Runbook:** P0–P3 scenarios, escalation tree, communication templates, SLA definitions
- **Post-GA Stabilization Plan:** Daily standup agenda, hotfix queue procedures, escalation contacts
- **Metrics Dashboard:** Mixpanel cohort, SigNoz alerts, customer adoption tracker
- **Release Notes + Upgrade Guide:** Changelog, known issues, feature flags, troubleshooting

### Successor Milestone (M13 / PM3 Start)

- **M13 (Low-Code Authoring):** First PM3 milestone; APT feedback loop; visual regression customer expansion
- **Ongoing:** 14-day post-GA support continues into M13; daily standup

---

## 16. APPENDIX: 32-DOC TEMPLATES

**Summary Table:**

| # | Category | Template Name | AI Agent | Key Sections |
|---|----------|---------------|----------|--------------|
| 1 | Planning | Test Plan | A1 | Scope, Approach, Schedule, Resources |
| 2 | Planning | Test Strategy | A1 | Levels, Types, Tools, Entry/Exit |
| 3 | Planning | Test Estimation | A1 | Effort, Schedule, Risk, Contingency |
| 4 | Execution | Daily Status Report | A8 | Cases Run, Pass Rate, Blockers, Tomorrow's Plan |
| 5 | Execution | Weekly Status Report | A8 | Summary, Trends, Defects, Risks, RAG Status |
| 6 | Execution | Sprint Sign-off | A8 | Goals vs Outcomes, Coverage, Defects, Sign-off |
| 7 | Execution | Release Readiness | A8 | Pass Rate, Defects, Coverage, RAG, Recommendation |
| 8 | Defect | Defect Report | A4 | Title, RCA (5-layer), Category, Impact, Fix Proposal |
| 9 | Defect | Root Cause Analysis | A4 | Stack, Env, Config, Code, Data (5 layers, per-layer confidence) |
| 10 | Defect | Exploratory Charter | A1 | Scope, Duration, Objectives, Approach, Findings |
| 11 | Automation | Regression Outline | A1 | Scope, High-Risk Areas, Existing Cases, Gaps |
| 12 | Automation | RTM | A1 | Requirement ↔ Case Mapping, Coverage %, Traceability |
| 13 | Automation | Visual Regression Plan | A1 | Platforms, Viewports, Baseline Strategy, Approval Workflow |
| 14 | Automation | Performance Test Plan | A1 | Load Profile, Stress Limits, Endurance Duration, Success Criteria |
| 15 | Automation | Accessibility Audit | A1 | WCAG 2.1 AA Checklist, Findings, Severity, Remediation |
| 16 | Automation | Mobile Test Matrix | A1 | Devices, OS Versions, Coverage Grid, Test Cases |
| 17 | Data | Synthetic Data Charter | A6 | Data Types, Generation Rules, Masking, Compliance |
| 18 | Data | Data Quality Report | A1 | Completeness %, Accuracy %, Timeliness %, Trends |
| 19 | Maintenance | Test Maintenance Report | A7 | Flaky Tests Fixed, A7 Suggestions Reviewed, Stability Trend |
| 20 | Maintenance | Flakiness Report | A7 | Flaky Test Inventory, Root Causes, Remediation Plan, SLA |
| 21 | Strategy | Risk Assessment | A1 | Features × Risk Levels, Test Prioritization, Coverage Plan |
| 22 | Strategy | Entry/Exit Criteria | A1 | Phase Gates, Pass Rates, Defect Thresholds, Sign-offs |
| 23 | Strategy | Compliance Checklist | A1 | Regulatory Requirements, Audit Evidence, Sign-off |
| 24 | Strategy | Quality Metrics Dashboard | A8 | DPPM, DRE, Test Yield, MTBF, Coverage %, Trends |
| 25 | Integration | CI Plan | A1 | Pipeline Stages, Automation Gates, Deployment Triggers |
| 26 | Integration | Test Environment Guide | A1 | Infrastructure, Seed Data, Performance Baseline, Maintenance |
| 27 | Deployment | On-Prem Runbook | A1 | Helm Chart, Health Checks, Troubleshooting, Upgrade |
| 28 | Deployment | Mobile Release Plan | A1 | TestFlight/Play Store Submission, Rollout, Monitoring |
| 29 | Operations | SLA & Support | A1 | Response Times, Severity Levels, Support Channels |
| 30 | Operations | Onboarding Playbook | A1 | Kickoff, Training, Data Migration, Success Metrics |
| 31 | Operations | Release Communications | A1 | Announcement, Changelog, Migration Guide, FAQ |
| 32 | Operations | Post-GA Stabilization | A1 | Hotfix Queue, Daily Standup, Escalation, SLA Tracking |

---

**End of Milestone M12 Document (1,000+ lines, build-ready)**
