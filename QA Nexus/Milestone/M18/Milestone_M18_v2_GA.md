---
milestone_id: M18
parent_project_milestone: PM3
name: "v2 GA + 50-Doc Catalog + Compliance Foundation"
version: 2.0
date: 2026-04-23
phase: v2 (GA)
window: "W12 of PM3"
start_date: 2027-03-30
end_date: 2027-04-03
duration_weeks: 1
calendar_period: "[PM3] M18 (2027-03-30 → 2027-04-03, 5 calendar days)"
primary_component: "v2 GA Release + 50-Doc Catalog"
secondary_components: "SOC2 Type I Evidence Pack, ISO27001 Compliance Foundation, Customer Success Onboarding"
status: "Build-Ready (GA Milestone)"
---

# Milestone M18 — v2 GA + 50-Doc Catalog + Compliance Foundation

**Organization:** Iksula Services Pvt Ltd  
**Milestone:** M18 (Week 12 of 12-week PM3) — **PROJECT MILESTONE EXIT**  
**Version:** 2.0 (Expanded from Stub)  
**Date Created:** 2026-04-22 | **Expanded:** 2026-04-23  
**Status Badge:** Build-Ready → v2 GA (Release)  

---

## EXECUTIVE SUMMARY

[PM3] M18 **ships v2 General Availability**, the culmination of PM1 (MVP: 3 agents, 12 docs), PM2 (v1.5: +self-healing/data/automation, 32 docs), and PM3 (v2: +low-code/governance/enterprise SSO, 50 docs). M18 is not a development milestone — it is a **release stabilization + customer onboarding + compliance evidence collection milestone**. By 2027-04-03, QA Nexus v2 is production-stable, ≥15 paying customers live, SOC2 Type I audit initiated, 50 doc templates stable, and PM3 feature set (VCG governance + SSO/SAML + Slack ChatOps) blocking merges with violations + operational.

**Mission:** Transition from product development (PM1–PM3) to enterprise product lifecycle management (customer success, compliance audits, ongoing support).

**Key Deliverables:**
- v2 GA announcement + release notes (shipped to all customers + public)
- 50-doc template catalog (18 new: Risk Matrix, Entry/Exit Criteria, Compliance Checklist, EU AI Act Evidence, SSO Integration Runbook, +13 others)
- VCG governance in production (blocking PRs with >5 violations)
- SSO/SAML + Slack ChatOps live for ≥3 enterprise customers
- SOC2 Type I audit initiated (scope, auditor selected, kickoff meeting held)
- Customer success playbook (onboarding kit, training materials, NPS tracking)
- Enterprise SLA documentation (24-hour hotfix response, 99.9% uptime target)
- Compliance evidence pack (audit trail export, SAML metadata, policy documentation)

**Success Criteria (PM3 Exit Gate — Production Lock):**
- ≥15 paying customers live + baseline metrics collected (adoption, NPS, defect flow)
- 0 critical bugs for ≥7 consecutive days before GA (hardening week)
- p95 API latency <250ms; VCG check <50ms p95; Slack command <1s p95 (all SLOs green)
- All PM3 features (M13–M17) passing acceptance criteria + merged
- SOC2 Type I audit contract signed + kickoff scheduled (not completed, but initiated)
- ISO27001 control mappings complete + evidence collected
- EU AI Act Article 13/14/15/22 compliance framework documented + approved by Compliance Officer
- 50 doc templates verified (section-level confidence, PDF export, versioning)
- Enterprise tier pricing published ($50K+ ACV customers signed)
- Dedicated enterprise success manager assigned (starts 2027-04-06, PM4 phase)

---

## CONTEXT: WHAT WAS DELIVERED BEFORE

**PM1 (MVP, 2026-04-27 → 2026-09-21):** Test case management (A1 gen, A2 dedup, RTM), test execution + evidence, defect logging (A4 RCA), Jira 2-way sync, basic reports + ROI, 12 doc templates, 3 agents, 2–3 pilots.

**PM2 (v1.5, 2026-09-22 → 2027-01-09):** A6 test data, A7 self-healing, A8-advanced planning, APT autonomous tester, visual regression, on-prem deployment, mobile app, 32 doc templates, 5–8 paying customers.

**M13–M15 (PM3 early, 2027-01-12 → 2027-03-06):** A3 low-code authoring (drag-drop editor + slash commands + Playwright/Selenium export), A5 test selection (change-based subsetting, GitHub/GitLab Actions, 60% CI time reduction), A8-full test planning (auto-strategy from PRD, risk matrix, entry/exit criteria).

**M16 (2027-03-09 → 2027-03-20):** Vibe Code Governor governance layer (policy engine, immutable audit trail, merkle-chained, GitHub/GitLab PR checks, EU AI Act compliance foundation, SOC2 CC6.1/CC7.1/A.5/A.8/A.12 controls).

**M17 (2027-03-23 → 2027-03-27):** Enterprise SSO/SAML (Okta, Azure AD, Google Workspace, JIT provisioning, group-to-role mapping), Slack ChatOps (triage, assign, status commands, notifications).

**Deployment State (M18 Entry — Monday 2027-03-30):**
- Vercel (frontend) + Oracle VM (backend NestJS, FastAPI, Ollama, PostgreSQL, Redis, Neo4j, Qdrant)
- All agents (A1–A5, A6, A7, A8-full, APT, VCG) operational + feature-flagged
- GitHub/GitLab/Jira/Slack/Confluence/Figma integrations live
- 50 doc templates enabled + stable
- On-prem + mobile deployment validated with customers
- SSO + Slack bot operational (feature flags rolled to canary 50%)
- Audit trail (governance) logging all agent calls
- Observability (SigNoz, GlitchTip) dashboards operational

**Customer State (M18 Entry):**
- 5–8 paying customers from PM2
- +5–7 enterprise prospects (Okta/Azure AD customers) ready to onboard via M17 SSO
- Projected: ≥15 customers by 2027-03-30 (some during M18 hardening week, some ramp post-GA)

---

## SCOPE DEFINITION & ARCHITECTURE COMPLETION

### v2 Feature Set Recap (11 agents, 50 docs, 7 layers)

| Component | Count/Status | PM Phase |
|-----------|---|---|
| **AI Agents** | 11 total: A1, A2, A3, A4, A5, A6, A7, A8-full, APT, VCG | PM1(3) + PM2(4) + PM3(4) |
| **Doc Templates** | 50 of 70: Core(12) + Advanced(20) + Enterprise(18) | PM1(12) + PM2(20) + PM3(18) |
| **Architecture Layers** | L1 (unified platform, SSO/Slack/on-prem/mobile) + L2 (GraphRAG) + L4 (agentic AI) + L5 (analytics/dashboards) + L6 (governance/compliance) | All PMx |
| **Integrations** | Jira, GitHub, GitLab, Slack, Confluence, Figma (6 first-party) + on-prem + mobile | PM1–PM2 |
| **Deployment Modes** | SaaS (Vercel+Oracle), on-prem (Helm chart), mobile (iOS/Android Capacitor) | PM1–PM2 |
| **Compliance Framework** | EU AI Act (L6), SOC2 Type I (scoped), ISO27001 (controls mapped) | PM3 foundation |

### 50-Doc Template Catalog (PM3 Adds 18)

**Core 12 (PM1):**
Test Plan, Test Strategy, Test Estimation, Daily Status, Weekly Status, Sprint Sign-off, Release Readiness, Defect Report, RCA, Exploratory Charter, Regression Outline, RTM.

**Advanced 20 (PM2):**
Visual Regression Test Matrix, Performance Test Plan, Accessibility Audit, Mobile Test Matrix, Synthetic Data Charter, Data Quality Report, Test Maintenance Report, Flakiness Report, [+12 others: see PROJECT_ROADMAP.md row for PM2].

**Enterprise 18 (PM3, M18 ships these):**
1. Risk Matrix
2. Test Entry Criteria
3. Test Exit Criteria
4. Compliance Checklist (HIPAA, GxP, SOC2, ISO27001)
5. EU AI Act Evidence Pack (provenance, transparency, audit trail)
6. EU AI Act Impact Assessment
7. SOC2 Type I Readiness Report
8. ISO27001 Asset Register
9. ISO27001 Control Evidence Template
10. SSO Integration Runbook
11. Enterprise Migration Playbook (from TestRail/Xray/qTest)
12. Data Residency Policy (multi-region, GDPR)
13. Customer Security Questionnaire (vendor assessment template)
14. Incident Response Playbook
15. Change Management Approval Form
16. Third-Party Integration Security Review
17. Architecture Review Checklist
18. Enterprise Support SLA Appendix

All 50 templates include: section-level confidence scoring (AI-assisted generation), PDF export with versioning, @mentions, comments, access control (per-project or org-wide).

### Compliance Foundation (Layer 6 — Enterprise-Ready)

**EU AI Act (Articles 13, 14, 15, 22):**
- Article 13 (Transparency): Audit trail + provenance documentation via VCG
- Article 14 (Human Oversight): Approval chain for high-risk outputs (confidence <0.7)
- Article 15 (Data Governance): Model version + training data version tracked
- Article 22 (Decision Documentation): Every VCG violation logged with evidence

**SOC2 Type I (Evidence Collection Phase):**
- CC6.1 (Logical Access): RBAC + SSO enforcement + audit trail
- CC7.1 (Monitoring): Audit log + SigNoz dashboards
- CC8.1 (Change Management): Feature flags + controlled rollout
- Evidence: Screenshots, access logs, policy documentation

**ISO27001 (Control Mappings):**
- A.5 (Access Control Policies): RBAC + SSO
- A.8 (Asset Management): Classification of sensitive data (audit trail marked "Confidential")
- A.12 (Operations Security): Policy versioning, dry-run before activation

---

## TASK BREAKDOWN (1 WEEK — STABILIZATION + LAUNCH)

M18 is **not development**, but **launch operations**. Tasks are parallelizable.

### DAYS 1–2: HARDENING + FINAL QA (2027-03-30 → 2027-03-31)

#### M18-T001: Feature Stabilization Review (M13–M17 Features)
**Description:** Triage all P1/P2 bugs from M13–M17; fix critical issues; defer minor issues to PM4.

**Details:**
- **Bug Triage Meeting (30 min, 2027-03-30, 9 AM):**
  - Team lists all open bugs (A1–A5, A3, A5, A8-full, VCG, SSO, Slack)
  - P0: Fix immediately (block release)
  - P1: Triage — fix if <2h; defer if >2h
  - P2/P3: All deferred to PM4 backlog
  - Accept: max 2 open P1 bugs at GA (documented in release notes as "known issues")
- **Targeted Testing (2–3 hours):**
  - Re-run all E2E test journeys (3 from M5: auth, test case, defect)
  - Smoke test: A1 gen, A2 dedup, A3 export, A5 selection, VCG governance, SSO login, Slack commands
  - Performance profiling: p95 latency for critical paths (API, VCG check, Slack response)
  - Load: 10 concurrent users (pilot-scale workload)
- **Decision Gate:**
  - If all critical SLOs green + <2 P1 open → proceed to release
  - If SLOs breached → delay GA by 1 week (slip to 2027-04-10)

**Priority:** P0  
**Estimate:** 6 hours  
**Owner:** QA Lead + Tech Lead  
**Dependencies:** M13–M17 all merged  
**US-ID:** N/A (meta task)  
**TB/EP:** None

---

#### M18-T002: 50-Doc Template Verification (Generation + Export)
**Description:** Verify all 50 doc templates generate correctly; PDF export works; section-level confidence visible.

**Details:**
- **Template Test Matrix:**
  - For each of 50 templates: A1-generate a skeleton (PRD context, team context)
  - Verify: section count ≥3, confidence ≥0.7 for each section
  - Export: PDF, verify formatting + pagination correct
  - Search: verify full-text search works (tsvector indexed)
  - Comment: add 1 comment per template, verify threaded view
- **Test Scenarios:**
  - New project (no prior docs): A1-generate all 50 templates in sequence
  - Existing project (rich context): Re-generate 5 key templates (Plan, Strategy, RCA, Risk Matrix, Compliance Checklist), verify improvement in confidence
- **Success Criteria:**
  - ≥90% of templates generate with confidence ≥0.7
  - PDF export 100% success (no corrupt files)
  - <1% variance in generated content (two runs of same template produce similar output)
- **Deferred:**
  - Templates with <0.6 average confidence → mark as "Beta" in UI, document in release notes

**Priority:** P0  
**Estimate:** 8 hours  
**Owner:** QA Engineer + AI Engineer  
**Dependencies:** M15 (A8-full planning) + document generation pipeline  
**US-ID:** US-015 (50-doc catalog)  
**TB/EP:** TB-010 (doc templates)

---

#### M18-T003: SigNoz + GlitchTip Pre-GA Verification
**Description:** Confirm all observability dashboards operational; SLO green lights; alert rules configured.

**Details:**
- **Dashboard Checklist:**
  - [ ] VCG Health Dashboard: policy check latency (p95 <50ms), audit log writes (p95 <10ms), violations/hour
  - [ ] API Latency Dashboard: all critical endpoints <250ms p95
  - [ ] Slack Bot Dashboard: command response time <1s p95, error rate <1%
  - [ ] Database Dashboard: connection pool health, slow query log, replication lag <100ms
  - [ ] Error Tracking Dashboard: error rate <0.1%, no P0 uncaught exceptions
- **Alert Rules (configured in SigNoz):**
  - If API p95 latency >300ms → page on-call (dev workload, not prod incident)
  - If error rate >1% → page on-call
  - If audit log disk >80% capacity → page DevOps
  - If Slack API unavailable → page Slack integration owner
  - If any SLO red for >10 min → disable feature flag + alert PM
- **Test:** Trigger each alert rule artificially (inject latency, error); verify notification + escalation works

**Priority:** P0  
**Estimate:** 4 hours  
**Owner:** DevOps + Backend Lead  
**Dependencies:** All monitoring infra from M0–M17  
**US-ID:** None (infrastructure)  
**TB/EP:** None

---

### DAYS 3–4: RELEASE NOTES + ANNOUNCEMENT (2027-04-01 → 2027-04-02)

#### M18-T004: v2 GA Release Notes + Marketing Copy
**Description:** Write comprehensive release notes + marketing announcement for public + customer communication.

**Details:**
- **Release Notes (GitHub Releases + In-App Banner):**
  - **Headline:** "QA Nexus v2 — Governed AI, Enterprise-Ready QA Automation"
  - **What's New (PM3 focus):**
    1. Low-Code Test Authoring (A3): Notion-style editor, drag-drop, 60% faster test creation vs. manual
    2. Smart Test Selection (A5): Change-based subsetting, 60% CI time reduction
    3. Vibe Code Governor: AI governance layer, every agent call auditable, EU AI Act-ready
    4. Enterprise SSO/SAML: Okta, Azure AD, Google Workspace; JIT provisioning
    5. Slack ChatOps: Triage, assign, approve from Slack; <1s response time
  - **Improvements (PM1–PM2 recap):**
    - 11 AI agents (3 in MVP + 4 in v1.5 + 4 in v2)
    - 50 doc templates (12 core + 20 advanced + 18 enterprise)
    - Self-healing (A7) now catching 40% of flaky tests
    - On-prem deployment with Helm chart (40+ enterprises on-prem)
    - Mobile QA app (iOS/Android, Capacitor)
  - **Known Issues (P1 deferred):**
    - (List any 2 P1 bugs + workarounds)
    - "These will be fixed in v2.0.1 (2027-04-10)"
  - **Upgrade Path:**
    - v1.5 → v2: no breaking changes, automatic schema migrations
    - On-prem: follow Helm upgrade guide (rolling update, 0 downtime)
  - **Enterprise Support:**
    - Dedicated success manager (start 2027-04-06)
    - 24-hour hotfix SLA for P0 bugs
    - Monthly business reviews (adoption, ROI, roadmap alignment)
- **Marketing Copy (for sales + website):**
  - Tag: "Enterprise AI Governance for QA"
  - Key benefits: "Trust AI with proof of control + audit trail. EU AI Act-compliant. SOC2 Type I-ready."
  - CTA: "Get started free. Scale to enterprise with SSO + VCG."
- **Distribution:**
  - GitHub release tag (public)
  - In-app banner (all users, 1-week visibility)
  - Email to ≥15 customers (v2 now live, next steps)
  - Sales deck updated (product positioning)

**Priority:** P0  
**Estimate:** 8 hours  
**Owner:** PM + Technical Writer + Marketing  
**Dependencies:** M13–M17 complete  
**US-ID:** None (marketing)  
**TB/EP:** None

---

#### M18-T005: Enterprise Onboarding Kit (Customer Success Playbook)
**Description:** Package training materials, playbooks, success metrics for post-GA customer success.

**Details:**
- **Onboarding Checklist (1-2 pages, PDF):**
  - Pre-launch: IT access (VPN, email invite), project setup, role assignment
  - Day 1: 30-min intro call (product walkthrough, success metrics, support channel)
  - Week 1: 2-hour hands-on training (test creation, VCG governance, SSO setup, Slack bot)
  - Weeks 2–4: Weekly 15-min check-ins, async Slack support
  - Month 2+: Monthly business review (adoption %, NPS, ROI)
- **Training Materials:**
  - Video walkthrough (10 min): test case creation (A1 gen) + A3 low-code authoring
  - Video: VCG governance (how to approve/deny violations)
  - Video: SSO setup (admin guide per IDP)
  - Video: Slack bot (3 commands)
  - Quick-start guides (1-pager each)
- **Success Metrics Dashboard** (in QA Nexus admin panel, customer view):
  - Last 30 days: active users (login ≥4 days/week), test cases created, test runs, defects logged
  - Jira defect flow: # QA Nexus defects → Jira (adoption signal)
  - Adoption curve: % team members active (target ≥80% by day 30)
  - NPS survey: monthly, "Would you recommend QA Nexus?" (target ≥50)
- **Customer Success Manager Playbook:**
  - Week 1: Introduction call, assign CSM, share playbook
  - Week 2–4: Weekly check-in, unblock adoption issues
  - Month 1 (post-launch): Business review, measure ROI (defects caught, time saved), identify expansion (more agents, on-prem, HIPAA)
  - Ongoing: Quarterly reviews, product feedback loops

**Priority:** P0  
**Estimate:** 12 hours  
**Owner:** Customer Success Manager + PM + QA Lead  
**Dependencies:** All features stable (M13–M17)  
**US-ID:** GM-001 (customer adoption)  
**TB/EP:** None

---

### DAYS 4–5: COMPLIANCE + CUSTOMER ONBOARDING (2027-04-02 → 2027-04-03)

#### M18-T006: SOC2 Type I Audit Initiation (Contract + Kickoff)
**Description:** Finalize audit scope, sign contract with auditor, schedule kickoff meeting.

**Details:**
- **Audit Scope (with auditor, e.g., Drata, Vanta, Coalfire):**
  - Services in scope: QA Nexus SaaS (Vercel + Oracle)
  - Services excluded: on-prem deployments, partner integrations
  - Trust principles: CC (Common Criteria) — Focus: CC6.1, CC7.1, CC8.1
  - Period: 6 months (2027-04-01 → 2027-09-30, audit report issued 2027-10-30)
  - Cost: $15K–$30K (typical SOC2 Type I budget)
- **Evidence Collection Plan (prepared by Compliance Officer):**
  - Audit trail export: governance policy changes, user access changes
  - Access control matrix: roles → permissions (RBAC documentation)
  - Change log: feature deployments, flag rollouts, incidents
  - Incident response examples: P0 bugs, how they were investigated + fixed
  - Infrastructure: architecture diagram, backup/restore procedures
  - Monitoring: SigNoz dashboards, alert configuration
  - Endpoint: VCG audit log (merkle chain validation), policy rules, violation exports
- **Kickoff Meeting (2027-04-06, with auditor + Iksula team):**
  - Confirm scope + timeline
  - Introduce evidence owners (DevOps, Backend, Security, Compliance)
  - Distribute evidence collection template
  - Set weekly review cadence (auditor queries → Iksula responds)
  - Expected completion: SOC2 Type I report issued 2027-10-30 (before PM4 enterprise push)

**Priority:** P0  
**Estimate:** 6 hours  
**Owner:** Compliance Officer + Tech Lead + DevOps  
**Dependencies:** M16 (governance layer complete)  
**US-ID:** None (compliance)  
**TB/EP:** None

---

#### M18-T007: Customer Success Onboarding (3+ Enterprise Customers Live)
**Description:** Execute kickoff meetings with ≥3 enterprise customers; enroll in SSO + Slack bot; collect baseline metrics.

**Details:**
- **Customer List (confirmed to launch on 2027-03-30–2027-04-03):**
  - Acme Corp (Okta SSO, 20 QAs)
  - TechStart Inc. (Azure AD SSO, 15 QAs)
  - FinanceFlow Ltd. (Google Workspace SAML, 10 QAs)
- **Per-Customer Kickoff (2 hours):**
  - Agenda: Product walkthrough (A1–A5, A8, VCG, SSO, Slack), success metrics, support SLA, roadmap
  - Setup: Create project, invite team members, configure SSO (IT), join Slack workspace
  - Hands-on: Create 1 test case (A1 gen), run it, log 1 defect, view report
  - Metrics baseline: capture login count, test case count, defect count (day 1 snapshot)
- **Follow-up (Week 1):**
  - Daily pulse check: Are users logging in? Any blockers?
  - Mid-week: 30-min "test case authoring" training (A1 + A3 low-code)
  - EOW: Defect logging + Jira sync training
- **Baseline Metrics (collected by 2027-04-03):**
  - Adoption: # users active (≥1 login) in week 1
  - Velocity: # test cases created + # test runs
  - Defect flow: # defects logged in QA Nexus + % synced to Jira
  - Slack usage: # commands run, # notifications engaged

**Priority:** P0  
**Estimate:** 10 hours (Customer Success Manager lead)  
**Owner:** Customer Success Manager + Product  
**Dependencies:** M17 (SSO + Slack) live + stable  
**US-ID:** GM-001  
**TB/EP:** None

---

#### M18-T008: Final Release Checklist + Go/No-Go Review (Board + Leadership)
**Description:** Complete final readiness checklist; conduct board-level go/no-go meeting.

**Details:**
- **Checklist (all items must be "✅"):**
  - [ ] All M13–M17 tasks merged + tested (QA sign-off)
  - [ ] SigNoz SLO dashboards green (p95 latency, error rate, uptime)
  - [ ] 50 doc templates verified (generation + export + confidence)
  - [ ] VCG governance in production (0 false positives in 24h baseline)
  - [ ] SSO live for ≥2 providers (Okta + Azure AD tested)
  - [ ] Slack bot 3 commands working (<1s p95 response)
  - [ ] <2 open P1 bugs (documented as known issues)
  - [ ] Release notes approved by PM + Marketing
  - [ ] Customer Success Kit prepared (onboarding, playbook, CSM assigned)
  - [ ] SOC2 audit initiated (contract signed, kickoff scheduled)
  - [ ] ISO27001 controls mapped + evidence collected
  - [ ] EU AI Act compliance approved by Compliance Officer
  - [ ] ≥15 customers committed to launch week (3+ on day 1, others ramping)
  - [ ] Support infrastructure live (Slack channel, on-call roster, runbook)
  - [ ] Monitoring alerts configured + tested
  - [ ] Rollback procedure documented (feature flags, DB backup)
- **Go/No-Go Review (1 hour, 2027-04-03, 3 PM):**
  - Attendees: VP Eng, VP Product, CFO (investment decision), Compliance Officer, Tech Lead, QA Lead
  - Decision: Must be unanimous "Go" (no conditional go)
  - If "No-Go": Identify blockers, decide whether to delay 1 week or descope feature
  - If "Go": Approve release authorization, confirm post-GA support staffing
  - Record: Decision + signatures in Jira epic ticket (retain for audit trail)

**Priority:** P0  
**Estimate:** 4 hours  
**Owner:** PM + Tech Lead  
**Dependencies:** All M13–M17 complete  
**US-ID:** N/A (meta task)  
**TB/EP:** None

---

#### M18-T009: v2 GA Release Execution (Feature Flags → GA, Customer Notification)
**Description:** Enable v2 GA features across all customers; send announcement; monitor first 24h.

**Details:**
- **Feature Flags (all enabled at 2027-04-03, 4 PM UTC):**
  - `pm3_v2_ga`: Release announcement banner + pricing page update
  - `auth.sso_*`: Enable SSO for all orgs (flag: true)
  - `vibe_code_governor`: Enable governance for all orgs (flag: true)
  - `slack.chatops_*`: Enable Slack bot for all orgs (flag: true)
  - `doc_templates_50`: Unlock all 50 templates (flag: true)
- **Announcement Sequence:**
  1. In-app banner: "v2 is now live! 50 doc templates, AI governance, enterprise SSO, Slack ChatOps. Get started: [link to guide]"
  2. Email: to all ≥15 customers + waitlist (50+ prospects)
  3. Slack #announcements: "QA Nexus v2 GA 🎉 — Enterprise AI governance is here"
  4. Twitter/LinkedIn: Product announcement with ROI metrics
  5. Sales enablement: Updated deck + talking points
- **24-Hour Monitoring (2027-04-03 4 PM → 2027-04-04 4 PM UTC):**
  - Dedicated on-call team (2 engineers): watch SigNoz + GlitchTip
  - Slack war room: #qa-nexus-incident (real-time updates)
  - SLO thresholds (alert if breached):
    - API latency: p95 >350ms (vs. normal <250ms)
    - Error rate: >2% (vs. normal <0.5%)
    - VCG latency: p95 >100ms
    - Slack command response: >2s
  - If any SLO breached for >10 min: disable feature flag + investigate root cause
  - Customer calls on-call for urgent issues
- **Decision Gate (2027-04-04, 8 AM):**
  - If all SLOs green + no P0 bugs: continue GA
  - If issues detected: brief rollback, fix, re-enable after 24h

**Priority:** P0  
**Estimate:** 8 hours (distributed across on-call team)  
**Owner:** PM + DevOps + SRE (on-call rotation)  
**Dependencies:** All M13–M17 + M18-T001 to T008  
**US-ID:** None (ops)  
**TB/EP:** None

---

#### M18-T010: Post-GA Week 1 Support + Escalation Playbook
**Description:** Active support during week 1 of GA; respond to customer issues; document escalation procedures.

**Details:**
- **Support Model (Week 1: 2027-04-03 → 2027-04-09):**
  - Slack #support channel: monitored by Customer Success Manager + on-call engineer
  - SLA: <1 hour response for P0, <4 hours for P1
  - P0 (service down): page on-call, establish war room, 30-min ETA for mitigation
  - P1 (feature broken, customer blocked): assign support engineer, daily update
  - P2 (minor issue, workaround exists): non-blocking, fix in v2.0.1 (2027-04-10)
- **Daily Standup (Week 1: 9 AM + 5 PM UTC):**
  - Review support tickets, escalations, metrics (adoption, errors)
  - Discuss: Is GA stable? Any rollback triggers hit?
  - Communicate: Share updates with customers (transparency)
- **Known Issues Register:**
  - Document any discovered issues (P1 deferred from M18-T001)
  - Publish in help center: "v2.0 Known Issues" (not blocking, fixed in v2.0.1)
  - Example: "VCG policy editor autocomplete slow on 100+ rules (workaround: manually paste rule)"
- **Customer Success Calls (Week 1):**
  - Acme, TechStart, FinanceFlow: Day 2 check-in (any blockers?)
  - Share: adoption metrics, Slack bot tips, success stories
  - Gather: product feedback for PM, bugs to fix
- **Handoff to PM4 (2027-04-06):**
  - Assign dedicated enterprise success manager (starts on-call)
  - Transfer customer relationships + metrics
  - Weekly cadence: business reviews, product feedback, expansion conversations

**Priority:** P0  
**Estimate:** 20 hours (distributed across team)  
**Owner:** Customer Success Manager + Support Engineer  
**Dependencies:** v2 GA live  
**US-ID:** None (post-GA support)  
**TB/EP:** None

---

## ACCEPTANCE CRITERIA MATRIX

| AC-ID | Feature | Acceptance Condition | Verifier |
|-------|---------|----------------------|----------|
| **M18-AC001** | Feature Stability | Given all M13–M17 features, when hardening tests run, then <2 open P1 bugs found | QA |
| **M18-AC002** | 50-Doc Catalog | Given 50 templates, when generation tested, then ≥90% avg confidence ≥0.7 | AI/QA |
| **M18-AC003** | SLOs Green | Given critical paths, when latency measured, then p95 API <250ms, VCG <50ms, Slack <1s | DevOps |
| **M18-AC004** | Release Notes Approved | Given GA notes drafted, when reviewed by PM + Marketing, then approved + distributed | PM |
| **M18-AC005** | ≥15 Customers Live | Given customer list, when adoption tracked day 1, then ≥15 paying customers active | Product |
| **M18-AC006** | Customer Success Prepared | Given onboarding kit, when 3 customers trained, then ≥80% team adoption in week 1 | CS Manager |
| **M18-AC007** | SOC2 Audit Initiated | Given auditor engagement, when contract signed, then kickoff meeting scheduled | Compliance |
| **M18-AC008** | EU AI Act Compliance | Given governance layer, when mapping reviewed, then Article 13/14/15/22 satisfied | Compliance |
| **M18-AC009** | ISO27001 Foundation | Given control mappings, when evidence collected, then ≥5 controls with artifacts | Security |
| **M18-AC010** | Go/No-Go Approved | Given board meeting, when all 8 criteria evaluated, then unanimous "Go" vote recorded | Leadership |
| **M18-AC011** | v2 GA Announcement | Given release published, when tracking enabled, then >1000 downloads/views day 1 | Marketing/Analytics |
| **M18-AC012** | Enterprise SLA Live | Given support playbook, when customer issue reported, then <1h response SLA met | Support |
| **M18-AC013** | 0 P0 Bugs Week 1 | Given GA live, when monitoring 24–168h, then 0 critical production bugs surface | DevOps |
| **M18-AC014** | ≥50 NPS | Given customer surveys week 1, when collected, then NPS (promoters - detractors) ≥50 | Product |

---

## RISKS & MITIGATIONS (FINAL WEEK)

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|-----------|
| **P1 bug found day-of-GA** | Reputation damage, customer churn | Medium | Hardening week (M18-T001) catches bugs; have rollback plan; communicate transparently |
| **Customer adoption stalls** | Revenue at risk, expansion halted | Low | Onboarding kit + CSM engagement + success metrics tracking (real-time visibility) |
| **SOC2 auditor delays kickoff** | Compliance window compresses | Low | Book auditor early (M16 phase); have backup auditor firm on standby |
| **Slack API outage during GA week** | ChatOps unavailable, customer frustration | Low | Fallback: in-app approval UI; document incident; communicate post-mortem |
| **VCG false positive surge** | Developers frustrated by governance | Medium | Policy dry-run + tuning before GA; monitor violation rate (if >5% change policy); user feedback loop |
| **SSO group mapping misconfigured** | Enterprise customer locked out | Low | Test with real customer IDP day-of-GA; have admin manual role assignment fallback |
| **On-prem customers hit upgrade issues** | Support burden, negative sentiment | Medium | Pre-GA testing with 1 on-prem customer; have rollback Helm chart ready; dedicated on-call support |

---

## ROLLBACK & CONTINGENCY

**If any critical SLO breached day-of-GA:**
1. Page on-call immediately
2. Disable feature flag (`pm3_v2_ga: false`) — reverts to v1.5 (last stable)
3. Investigate: root cause analysis within 1 hour
4. Customer communication: brief transparency statement ("We identified an issue and rolled back. Fix incoming.")
5. Fix + re-enable: within 24h (not re-releasing day-of)

**If customer adoption <10 by day 1:**
- Not a "rollback" scenario, but a growth issue
- Activate outreach campaign: "Why not try v2?" email + webinar
- Extend onboarding for slow-ramping customers
- Monitor week 2–4 (adoption curve should accelerate as word spreads)

**If SOC2 auditor unavailable:**
- Engage backup auditor (e.g., Coalfire, BDO)
- May delay audit completion, but do NOT delay GA
- Document: intended 2027-10-30 completion date in customer comms

---

## DATABASE & INFRASTRUCTURE

**No new migrations (M18 is stabilization):**
- M16: governance_policies, policy_violations, audit_log (done)
- M17: sso_sessions, sso_provider_config, slack_integrations (done)
- M18: No schema changes (doc templates already supported by documents table)

**Monitoring Enhancements:**
- SigNoz: Add "v2 GA Stability" dashboard (tracks SLOs during release week)
- GlitchTip: Enable error aggregation + customer impact assessment
- Slack: Automated alerts to #oncall

**Backup & Disaster Recovery:**
- Pre-GA: Full system backup (DB + R2 artifacts) + verified restore
- Restore point: 2027-04-03 2 PM UTC (pre-GA)
- RTO target: <4 hours (restore DB from backup + redeploy services)

---

## DEFINITION OF DONE (M18 = PROJECT PHASE EXIT)

**Code (Merged & Stable):**
- All M13–M17 tasks complete + tested
- No breaking changes in v1.5 → v2 migration (schema evolution only)
- Feature flags all deployable + rollback-safe

**Documentation:**
- Release notes (public + customer comms)
- Customer success onboarding kit (playbook + training)
- Admin guide (SSO setup, VCG policies, Slack bot config)
- Support runbook (P0–P2 escalation procedures)
- Compliance documentation (EU AI Act, SOC2, ISO27001 mappings)

**Deployment:**
- Staging environment passes all acceptance criteria
- SLO dashboards green (p95 <250ms, error rate <0.5%, VCG <50ms)
- Feature flags staged + ready for GA flip
- Rollback procedure tested + documented

**Compliance:**
- SOC2 Type I audit contract signed + kickoff scheduled
- EU AI Act Article 13/14/15/22 mapping approved
- ISO27001 control mappings documented + evidence collected

**Customer Readiness:**
- ≥15 customers confirmed for launch week
- ≥3 customers onboarded + live on day 1
- CSM assigned + trained
- Support infrastructure live (SLA <1h for P0)

**Metrics Captured (Day 1 Baseline):**
- Customer adoption: # active users, login frequency
- Velocity: # test cases created, test runs, defects logged
- Health: p95 API latency, error rate, VCG violations
- Sentiment: NPS survey sent (results by end of week 1)

---

## HANDOFF TO PM4 (2027-04-06 → Ongoing)

**PM3 Exit → PM4 Entry Gate:**
- v2 GA live + stable (≥7 days, 0 P0 bugs)
- ≥15 customers live + baseline metrics collected
- SOC2 audit kickoff held (evidence collection underway)
- Customer Success Manager on-board + taking ownership
- Enterprise SLA operational (24-hour hotfix response)

**Items Deferred to PM4:**
- SCIM 2.0 bulk user sync (M17 deferred)
- Slack command-K parity (M17 deferred)
- Advanced policy heuristics (ML-based VCG tuning, M16 deferred)
- Career Compass (L7 intelligence layer)
- Full 70-doc catalog completion
- GxP / HIPAA / multi-region compliance
- Multi-tenant SaaS transformation

---

**End of Milestone M18 (Expanded)**
