# QA Nexus — Master Brainstorm & Strategic Blueprint

> The definitive consolidated document for all QA Nexus brainstorming, planning, and strategic thinking as of 2026-04-20. Source: project_analysis.md, PLAN.md (v0.1), PLAN_v2.md (canonical), and all derivative brainstorms and specs.

**Organization:** Iksula Services Pvt Ltd  
**Date:** 2026-04-20  
**Status:** Master brainstorm (input to downstream Agent 2: PRD, Agent 3: ERD, Agent 4: Milestones)  
**Prepared by:** Agent 1 (Comprehensive Analysis)  

---

## Table of Contents

1. Executive Summary
2. Problem Space & Market Context
3. Product Vision & Positioning
4. The 10 Unique Differentiators
5. Personas & Jobs-to-be-Done
6. MVP Scope (Locked: 7 Priorities)
7. Out of Scope (MVP)
8. Feature Catalog (MVP + Post-MVP)
9. AI Agents: A1–A8 + Vibe Code Governor
10. 7-Layer Architecture
11. Information Architecture & Navigation
12. Design Direction: "Quiet Intelligence"
13. Technology Stack (Locked)
14. Data Model Primitives
15. Integrations
16. Non-Functional Targets & Success Metrics
17. Milestone Roadmap (7 phases, 18 weeks MVP)
18. Risks & Mitigations
19. Open Questions & Gaps
20. Decisions Ledger

---

## 1. Executive Summary

**QA Nexus is the AI-native operating system for the QA profession.** A unified platform that collapses 8–10 fragmented tools (TestRail, Jira, Confluence, Excel, emails, GitHub, Slack, Jenkins) into one workspace where QA teams plan, author, execute, triage, and report without leaving the app. Every user in QA Nexus becomes "AI-native by default," with autonomous agents handling mechanical work while humans focus on judgment.

**The MVP ships in 18 weeks (M0–M5) as a Test Management beachhead** — unlocking test document creation (12 templates), project/user setup, test case authoring with live AI-powered duplicate detection (A1 + A2), test execution with auto-evidence capture, defect triage with 5-layer root-cause analysis (A4), and basic templated reporting. A third AI agent (A4 Defect Intelligence) provides 95% faster triage with semantic duplicate detection. Full reporting and ROI dashboards ship in M6 (post-MVP).

**Why now:** AI-generated code ships with 1.7× more bugs and 2.74× more security vulnerabilities than human-written code (ICSE 2026). QA is the most-skipped step in AI workflows, yet 65.6% of QA professionals are "very concerned" *(cited from industry sentiment surveys; fear-framing is a positioning hypothesis for career-intelligence layer)* about job security. The $9.6K annual salary gap *(cited from industry salary surveys; single-point estimates, year-dependent)* between AI-using QAs ($45.4K) and non-AI QAs ($35.8K) is widening. QA Nexus closes this gap by making every QA professional irreplaceable with AI tools integrated into their daily workflow. The autonomous testing market is $166.91B by 2033 *(third-party market research; exact figures vary by source and year)* (CAGR 19.8%); QA Nexus captures the professional-operator end of that market, not just the automation-testing end.

---

## 2. Problem Space & Market Context

### The Three Crises

**Crisis 1: Fragmentation Crisis**  
QA engineers juggle 8–10 tools per day (Jira, TestRail, Confluence, Excel, emails, GitHub, Slack, Jenkins, custom dashboards, etc.). ~45 minutes per day lost to context switching. No single source of truth. Traceability breaks between tools. Leadership visibility requires manual status decks.

**Crisis 2: Vibe-Coding Crisis**  
AI-assisted development (Copilot, Cursor, Claude, Gemini) produces code at scale without full understanding. ICSE 2026 study: AI code has 1.7× more bugs than human code, 2.74× more security vulnerabilities. QA is the most-skipped step in AI workflows. Case study: fintech company deployed AI payment code without adequate QA; 3 security breaches in 6 months, $6M losses.

**Crisis 3: Profession Fear Crisis**  
65.6% of QA professionals are "very concerned" *(cited from industry sentiment surveys; fear-framing is a positioning hypothesis for career-intelligence layer)* about AI displacing them (State of Testing 2026). Non-AI QAs earn $35.8K annually; AI-using QAs earn $45.4K — a $9.6K gap *(cited from industry salary surveys; single-point estimates, year-dependent)* that widens every year. Reddit, LinkedIn, Ministry of Testing forums full of fear conversations. Regulatory pressure compounds anxiety: EU AI Act enforcement 2026–2027, max fine 3% global revenue for high-risk AI systems (payments, healthcare, hiring).

### Market Opportunity

- **Autonomous testing market:** $166.91B by 2033 *(third-party market research; exact figures vary by source and year)*, CAGR 19.8%
- **AI testing tools market:** growing 23% YoY
- **QA professional population:** ~4–5 million worldwide
- **Regulatory tailwind:** EU AI Act, GDPR, HIPAA, GxP, SOC 2 all requiring formal conformity testing for AI systems

### The 17 Problems (3-Era Framework)

**Era 1: Chronic (2018–2025)** — Pre-AI, still unresolved:
1. Tool fragmentation (8–10 tools/QA/day, 40–60 min/day lost)
2. Documentation manual and hated (4–8 hrs per doc, always stale)
3. Test cases disconnected from requirements (coverage gaps, escapes)
4. Defects filed without root-cause context (developer waste)
5. QA value invisible to business (budget cuts, downsizing)
6. Knowledge lost when people leave (no learning capture)
7. Career paths undefined (senior plateau, junior lost)

**Era 2: Accelerating (2025–2026)** — AI coding revolution creates:
8. AI-generated code untested at scale (1.7× more bugs shipped)
9. Static test suites can't keep up with AI velocity (stale in days)
10. QA skipped in vibe-coding workflows (ICSE: most-skipped step)
11. Duplicate defects exploding (30–40% are dups, not new)
12. No tool for testing AI product behavior (LLM hallucinations, bias, prompt injection untested)
13. Profession fear crisis (65.6% concerned, talent flight)

**Era 3: Emerging (2026–2031)** — Maturing AI landscape:
14. EU AI Act compliance — no tool automates it (fine: 3% global revenue)
15. Agent governance — who watches the AI agents? (unchecked wrong decisions)
16. JIT testing paradigm not supported (Meta's ephemeral, PR-specific approach)
17. AI income divide deepens (QA profession splits into haves/have-nots)

---

## 3. Product Vision & Positioning

### Vision Statement

> "QA Nexus is the operating system for the QA profession. When QA Nexus knows your requirements, test cases, execution results, defect history, team structure, career level, and your organization's past projects — it can do things no single tool ever could."

### North-Star Outcome (MVP)

A Jr QA opens QA Nexus on Monday 9am, selects their project, generates a test plan from a PRD in under 5 minutes, authors 10 BDD cases with live duplicate detection, runs the suite, logs 3 defects with auto-RCA that sync to Jira, and auto-produces the daily status report — without leaving the app and without writing boilerplate.

### Three Product Promises

1. **Test cases in minutes, not days** — 90% faster authoring via A1 Test Case Generator
2. **Failures diagnosed without human hunting** — 95% faster triage via A4 Defect Intelligence 5-layer RCA
3. **Coverage that actually grows** — 50% higher than baseline via A1 + A2 dedup + Knowledge Vault memory

### North-Star Metric Candidates

- Adoption: ≥80% of pilot QAs log in ≥4 days/week by week 3
- Speed: median time-to-log-a-bug ≤90s (vs baseline measured week 1)
- Speed: A1 case generation ≥10× faster than manual (validated in pilot)
- AI quality: ≥80% of A1-generated cases auto-approved (confidence ≥80%) without edit
- AI quality: A2 catches ≥60% of true duplicates in controlled dataset
- AI quality: A4 RCA top-layer accuracy ≥75% (human verification)
- Value: ROI calculator produces defensible number (avg 688% *(pilot target based on market research; actual outcomes to be validated)*) for at least one pilot by week 8

### Competitive Positioning

**The Master Comparison (32 features × 7 platforms):**
- QA Nexus: 32/32 features (100%)
- Testomat.io: 12/32
- ContextQA: 9/32
- TestRail: 8/32
- TestGrid AI: 7/32
- Confident AI: 6/32
- Autonoma: 5/32

**Why QA Nexus wins:** ContextQA excels at execution automation (5-layer RCA, auto-healing) but lacks document generation, career features, execution co-pilot, and vibe code governance. Testomat.io is clean test management but has no AI document generation or ROI. TestRail is the incumbent (10K+ enterprise clients) but legacy architecture, no AI. QA Nexus covers the ENTIRE profession lifecycle — from document creation to career development — with AI intelligence running through every layer.

---

## 4. The 10 Unique Differentiators

No competitor has all of these:

1. **Document Generation (70+ types in ~28s)** — Test Strategy, Plan, RTM, Estimation, Daily/Weekly/Sprint/Release reports, RCA, Exploratory Charter, Regression outline. Section-level confidence scoring. Knowledge Vault auto-context. 94% time savings per document. (per `QA_Nexus_Brainstorm.md §3`, `PLAN_v2.md §3`)

2. **Execution Co-Pilot (real-time guidance during live testing)** — AI monitors test sessions, suggests next steps, flags anomalies, predicts failure risk. Reduces execution time 15–20%. (per `QA_Nexus_Brainstorm.md §5`)

3. **Knowledge Vault (cross-project vector memory via RAG)** — Every document, test case, defect, project outcome stored as embeddings. Semantic search across all historical QA data. When generating a new test plan, system retrieves 3 most-similar past projects and uses them as context. (per `QA_Nexus_Brainstorm.md §4.2`)

4. **Career Compass (AI-powered career pathing for QA professionals)** — Skills graph, job market matching, salary benchmarking, portfolio builder auto-generated from real work done in QA Nexus. Career paths clear, learning personalized, growth measurable. (per `QA_Nexus_Platform_Vision.md`, deferred to v2)

5. **ROI Dashboard (automatic business value calculation)** — Defects caught × average cost per defect at each stage (Requirements: $200, Dev: $1K, QA: $2.2K, Prod: $14.6K). Average ROI delivered: 688% *(pilot target based on market research; actual outcomes to be validated)*. Configurable cost models. Business case for QA investment proven. (per `QA_Nexus_Brainstorm.md §4.5`, `brainstorm.md §1`)

6. **Portfolio Builder (auto-generated from real work)** — Every test case, defect, document, report authored in QA Nexus becomes part of a living, AI-curated professional portfolio. Exportable for career growth. (per `QA_Nexus_Brainstorm.md §13`)

7. **Job Market Intelligence (live matching + salary benchmarking)** — Real-time job matching for QA professionals based on skills. Salary trends, cost-of-living adjustment, career path recommendations. Closes the knowledge gap between QA professionals and the labor market. (per `QA_Nexus_Brainstorm.md §13`)

8. **Semantic Duplicate Defect Detection (vector similarity)** — When a new defect is filed, A2 Dedup searches the vector DB for semantically similar past defects — not just keyword matching. "Login fails intermittently" vs "User can't access app sometimes" detected as duplicates. 30–40% defect reduction. (per `QA_Nexus_Brainstorm.md §5`, `PLAN_v2.md §6`)

9. **JIT Evidence Capture (auto-captured at exact failure moment)** — Screenshot (full page), console logs (last 500 lines), network requests (HAR file), environment snapshot (config state JSON) — all captured automatically at the moment a test fails, no manual setup. Evidence always available for RCA. (per `QA_Nexus_Brainstorm.md §5`, `PLAN_v2.md §6`)

10. **Agent Governance (audit trail for every AI action)** — Every A1 / A2 / A4 / A8 action logged with full provenance. Who invoked? What was the input? What was the output? What confidence score? Which knowledge base entries were read? What evidence was linked? EU AI Act compliance, non-repudiation. (per `QA_Nexus_Brainstorm.md §5`, `PLAN_v2.md §4`)

---

## 5. Personas & Jobs-to-be-Done

### Six Core Personas

**1. Junior QA Engineer (3–5 yrs experience)**
- Goals: Show me what I need to test today, help me write cases fast, keep me learning
- Pains: Manual case authoring, duplicates, document templates, skill gaps
- Day-in-the-life: Log in, see assigned cases for the day, author 5–10 new cases from a PRD, execute a suite, log bugs, update daily status
- Jobs QA Nexus does:
  - A1 Test Case Generator (10× faster than manual, Clarification Questions gate)
  - A2 Dedup detection (live chips while authoring, prevents duplicates)
  - Knowledge Base (learn from past projects, past solutions)

**2. Senior QA / QA Automation Engineer (5–10 yrs experience)**
- Goals: Architect test strategy, author test plans, run suites, triage failures fast
- Pains: Tool fragmentation, manual test planning, defect triage is slow, automation maintenance burden
- Day-in-the-life: Design test strategy for a feature, generate test plan from PRD, approve test cases from team, run regression, triage failures, create defects with RCA
- Jobs QA Nexus does:
  - A8 Test Planning Agent (auto-strategy from PRD)
  - A4 Defect Intelligence 5-layer RCA (95% faster triage)
  - A7 Test Maintenance self-healing (reduce flaky test burden)
  - Jira 2-way integration (one-click defect creation)

**3. QA Lead / QA Manager (8–15 yrs experience)**
- Goals: Own project QA, approve strategies/plans, see team performance, report to management
- Pains: Status report generation, team oversight visibility, portfolio management, proving ROI
- Day-in-the-life: Review test plans from team, approve sign-offs, see project dashboard (pass rate, defect trend, coverage), run exec report for leadership, guide team on prioritization
- Jobs QA Nexus does:
  - ROI Dashboard (688% avg, defensible business case)
  - Auto-reports (Daily, Weekly, Sprint, Release — templated, auto-filled)
  - Knowledge Vault (cross-project memory, avoid duplicating work)
  - Audit log (team accountability, decision trail)

**4. Test Automation Engineer (3–10 yrs experience)**
- Goals: Write automated tests fast, debug failures, integrate with CI/CD, keep flaky tests down
- Pains: Low-code isn't powerful enough, high-code takes too long, flaky tests, maintenance burden
- Day-in-the-life: Author Playwright tests with low-code builder, run suite in CI, debug failures, identify flaky tests, commit fixes, integrate with GitHub/GitLab
- Jobs QA Nexus does:
  - A3 Low-Code Authoring (Notion-style step editor, v1.5)
  - A7 Test Maintenance (self-healing, background suggestions)
  - Playwright integration with auto-evidence
  - A5 Test Selection (PR-gated CI subset, change-based)

**5. Product Manager / Stakeholder**
- Goals: See release readiness, understand QA risks, prove ROI of QA investment
- Pains: QA numbers don't speak to business, release readiness is opaque, trust QA judgment
- Day-in-the-life: Check release sign-off dashboard, see defect trends, understand risk of shipping, present QA value to CEO
- Jobs QA Nexus does:
  - Exec Dashboard (pass rate, defect trend, coverage, release RAG)
  - ROI formula with business KPIs (cost avoidance, capacity unlocked, revenue protected)
  - Release sign-off workflow (QA Lead approval blocks release until criteria met)

**6. Automation / Executive Viewer (Management read-only)**
- Goals: See QA metrics at a glance, release readiness RAG, cost avoidance
- Pains: Too much detail in reports, metrics scattered across tools, can't drill down
- Day-in-the-life: Open QA Nexus Exec Dashboard once a day, see green/amber/red health, one-click drill-down to details if needed
- Jobs QA Nexus does:
  - Single-screen executive summary, live dashboards
  - One-click drill-down for details
  - Email-friendly PDF export for board meetings

### Primary JTBDs (Ranked by Frequency)

1. "Show me what I need to test today on this project" → personalized dashboard, assigned cases, due reports
2. "Let me write a test case without fighting the form" → fast BDD/traditional editor, keyboard shortcuts, reusable steps, tags
3. "Log a bug in under 60 seconds and get it into Jira" → prefilled form, Jira sync on save, one-click
4. "Run a suite and record pass/fail quickly" → one-row-per-case execution view, quick-status, screenshot paste, defect link inline
5. "Generate the daily/weekly report without assembling by hand" → templated auto-populated
6. "Find the test case or bug I wrote last week" → global search across cases, defects, docs
7. "Know if this defect is a duplicate before I file it" → live duplicate detection, semantic matching
8. "Understand why a test failed without manual hunting" → 5-layer RCA, environment/config/code/data context
9. "See if my QA work is actually protecting customers" → ROI calculator, business KPI alignment
10. "Prove to management that QA is worth the investment" → Exec Dashboard, release RAG, cost avoidance number

---

## 6. MVP Scope (Locked: User's 7 Priorities)

The user's explicit priority order for MVP (from `/uploads/brainstorm.md §2`):

| Priority | Feature | Acceptance-Level Description |
|----------|---------|---|
| 1 | **Test Document Creation** | PRD/Figma/Jira ingestion → Test Plans, Strategies, Risk Matrix. 12 templates (Planning, Execution, Defect, Reporting, Automation). 5-field context form. ~28s generation. Section-level confidence. Knowledge Vault context. PDF export. Versioning. Comments. @mentions. |
| 2 | **Project Setup** | Create project (name, key, description, Jira project key, env list). Switch project. Archive project. Each project isolates every data object. Environment list configured per project. |
| 3 | **User/Role Setup** | 4-role RBAC (Admin/Lead/QA/Mgmt). Jr/Sr/Automation as profile attributes, not roles. User invite, role assignment, project membership. Audit log tracking all changes. |
| 4 | **Integrations** | Jira OAuth 2.0 3-LO, 2-way sync, webhook + 2-min poll fallback. GitHub/GitLab CI webhook for automation results. Slack notification webhook. Confluence read (PRD ingestion) + write (report export). |
| 5 | **Test Cases Generation & Maintenance** | Notion-style step editor (blocks not rows). BDD + traditional modes. Tags, priority, linked requirement. A1 Test Case Generator with Clarification Questions gate. A2 Dedup live chips while authoring. Bulk import (CSV/TestRail/Zephyr/Xray/qTest). Case versioning. RTM. |
| 6 | **Bug Creation** | Defect form prefilled from failing run. A4 5-layer RCA (stack → env → config → code → data). 4-category classification (App / Test / Flaky / Env). Jira 2-way sync on save. Comment mirroring. Evidence auto-capture (screenshot, console, HAR, env snapshot). |
| 7 | **Automation** | Playwright runner, CI integration, self-heal (basic in MVP, full A7 in v1.5). Docker runners on Oracle VM. Webhook bridge to GitHub/GitLab Actions. Evidence capture at failure (screenshot + logs). Test result ingestion (JUnit XML). |

**Companion: Reports (MVP basic, full in M6)** — Daily/Weekly/Sprint/Release templated reports auto-filled from run + defect data. Personal dashboard (my cases, bugs, approvals). Exec Dashboard with pass rate, defect trend, coverage, release RAG, ROI formula.

### MVP Feature Map (M0–M5, 18 weeks)

| Milestone | Deliverables | Agents | Status |
|-----------|---|---|---|
| M0 | Identity & Access (email/password, 4-role RBAC, SSO-ready, audit log) | — | ✅ MVP |
| M1 | Project Workspace (create, switch, archive, env config, Jira key) | — | ✅ MVP |
| M2 | Document Intelligence (12 templates: Test Strategy, Plan, RTM, Estimation, Daily Status, Weekly, Sprint Sign-off, Release Readiness, Defect Report, RCA, Exploratory Charter, Regression outline) | A8 (partial), A1 context | ✅ MVP |
| M3 | Test Cases with A1 + A2 (Notion editor, BDD, traditional, tags, priority, RTM, live dedup chips) | **A1, A2** | ✅ MVP |
| M4 | Test Execution (create run, manual + automated, quick-status, screenshot paste, defect link inline, auto-evidence) | — | ✅ MVP |
| M5 | Defect Intelligence (A4 5-layer RCA, 4-category classification, Jira 2-way sync OAuth, webhook + poll) | **A4** | ✅ MVP |
| M6 | Reports & ROI Dashboard (templated auto-filled: Daily, Weekly, Sprint, Release, Exec Dashboard, ROI formula, release RAG) | A7 (partial) | ✅ MVP (basic) |
| M7 | Knowledge Base (first-class object, plain-English, approval workflow, read by every agent, "Reading from KB" chip) | — | ✅ MVP |
| M8 | Admin & Integrations (user invite, role assignment, project membership, Jira config, audit log, integration health widget) | — | ✅ MVP |
| M9 | Global Search & Command-K (search cases, defects, docs, KB; omnibox for nav + agent invocation) | — | ✅ MVP |

### AI Surface Rails (apply everywhere)

- **Clarification Questions before generation** — never "generate and regret"
- **Three-tier confidence model:** ≥90% auto-healed (green) / 70–89% amber / <70% red (blocks)
- **Provenance Trifecta:** label + confidence % + drill-to-evidence link (audit trail)
- **Knowledge Base chip** visible on every agent action

---

## 7. Out of Scope (MVP)

Explicitly deferred to v1.5 / v2+ (per `PLAN_v2.md §4`):

- **A3 Low-Code Authoring** — Notion-style automation editor (v1.5)
- **A5 Test Selection** — Change-based subsetting for PR gates (v1.5)
- **A6 Test Data** — Inline synthetic data generation (v2)
- **A7 Test Maintenance** — Background suggestions, self-healing at scale (v2)
- **A8 Test Planning** — Auto-strategy from PRD alone, full version (v1.5+; MVP has partial)
- **Vibe Code Governor** — JIT testing for AI-generated code (v2+)
- **AI Product Tester** — LLM hallucination/bias/prompt-injection testing (v2+)
- **Full 70-document catalog** — MVP ships 12, remaining 58 progressively
- **EU AI Act compliance workflow** (L6) — v1.5+
- **Career Compass** (L7) — v2+
- **Visual Regression** — in-house diff vs Applitools/Percy TBD (v2+)
- **Cloud Device Grid** — build vs partner vs defer TBD (v2+)
- **SSO/SAML, SCIM** — Keycloak (v1.5+)
- **Mobile app, white-label** — (v2+)
- **Slack/Teams ChatOps** (beyond notification webhook) — (v1.5+)

### Explicit Out of Scope (never)

- Replacing Jira (we complement)
- Project/sprint management (we link to Jira sprints)
- Code-repo integration beyond CI webhook

---

## 8. Feature Catalog (MVP + Post-MVP)

Comprehensive inventory of every feature discussed, with phase assignment:

| Feature | Description | MVP? | Phase | Priority | Personas |
|---------|---|---|---|---|---|
| **Document Generation** | 70+ templates, ~28s generation, section confidence scoring, Knowledge Vault context | 12 of 70 | M2 | P0 | Lead, QA, Mgmt |
| **Test Case Authoring** | Notion-style editor, BDD + traditional, tags, priority, RTM | ✅ | M3 | P0 | Jr/Sr QA, Auto |
| **Test Case Deduplication (A2)** | Live chips, semantic matching, bulk audit | ✅ | M3 | P0 | Jr/Sr QA |
| **Test Execution** | Manual + automated, quick-status, screenshot paste, evidence auto-capture | ✅ | M4 | P0 | Jr/Sr QA, Auto |
| **Defect Intelligence (A4)** | 5-layer RCA, 4-category classification, semantic dedup | ✅ | M5 | P0 | Jr/Sr QA |
| **Jira 2-way Sync** | OAuth 2.0, webhook + poll, comment mirroring, status pull-back | ✅ | M5 | P0 | Jr/Sr QA, Lead |
| **Templated Reports** | Daily, Weekly, Sprint, Release auto-filled | ✅ | M6 | P1 | Lead, Mgmt |
| **ROI Dashboard** | Cost avoidance, time saved, risk reduced, capacity unlocked, revenue protected | ✅ | M6 | P1 | Lead, Mgmt |
| **Exec Dashboard** | Pass rate, defect trend, coverage, release RAG | ✅ | M6 | P1 | Mgmt |
| **Knowledge Base** | First-class object, approval workflow, read by every agent | ✅ | M7 | P0 | Lead, QA |
| **Project Management** | Create, switch, archive, env config | ✅ | M1 | P0 | Lead, Admin |
| **RBAC (4 roles)** | Admin, Lead, QA, Mgmt with profile attributes (Jr/Sr/Auto) | ✅ | M0 | P0 | Admin |
| **Global Search** | Cases, defects, docs, KB | ✅ | M9 | P1 | All |
| **Command-K Omnibox** | Search + navigate + agent invocation | ✅ | M9 | P1 | All |
| **Bulk Import** | CSV, TestRail, Zephyr, Xray, qTest, JUnit | ✅ | M3 | P1 | Lead, Auto |
| **Test Plan Generation (A8)** | From PRD/Figma/Jira, partial in MVP | Partial | M2 | P0 | Lead |
| **Exploratory Testing Sessions** | Session capture, step timeline (UX TBD) | ✅ | M4 | P2 | Sr QA |
| **Integration Health Widget** | Jira, GitHub, Slack, Confluence status | ✅ | M8 | P2 | Lead, Admin |
| **Audit Log** | Every action logged with actor, timestamp, target | ✅ | M8 | P1 | Admin |
| **Low-Code Authoring (A3)** | Notion-style automation editor | v1.5 | P3 | Auto |
| **Test Selection (A5)** | PR-gated CI subset, change-based | v1.5 | P3 | Auto |
| **Test Data Generation (A6)** | Inline synthetic data | v2 | P3 | Auto |
| **Test Maintenance (A7)** | Self-healing, background suggestions | v2 | P3 | Auto |
| **Vibe Code Governor** | PR analysis, JIT tests, AI-code detection | v2+ | P2 | Auto, Dev |
| **AI Product Tester** | LLM hallucination, bias, prompt injection testing | v2+ | P2 | Lead, Mgmt |
| **Career Compass** | Skills graph, job matching, salary benchmark, portfolio | v2+ | P3 | All |
| **EU AI Act Compliance** | Agent governance, audit trail, immutable records | v1.5+ | P2 | Lead, Admin |
| **Visual Regression** | In-house diff or vendor integration TBD | v2+ | P3 | Auto |
| **Cloud Device Grid** | Build vs partner vs defer TBD | v2+ | P3 | Auto |
| **Mobile App** | Notifications, approvals, quick actions | v2+ | P3 | All |

---

## 9. AI Agents: A1–A8 + Vibe Code Governor

All orchestrated via **LangGraph** (chosen over CrewAI for loops, HITL interrupts, branching RCA, audit replayability). Human-in-the-loop at every consequential step. (per `PLAN_v2.md §6`, `QA_Nexus_Brainstorm.md §5`)

### MVP Agents (ship in M0–M6)

| Agent | Purpose | Input | Output | Confidence model | Ships | Open Q |
|-------|---------|-------|--------|---|---|---|
| **A1: Test Case Generator** | Generate test cases from PRD/Jira/Figma | Requirement text, context (past cases, linked defects, KB) | Complete test suite (10 cases typical) with trace links | Clarification Questions gate, 3-tier confidence | M3 | None |
| **A2: Test Deduplication** | Surface duplicate candidates while authoring + bulk audit | New case, existing case library, vector DB | Match %, overlapping steps, confidence | ≥90% auto-flag (green) / 70–89% review (amber) / <70% ignore | M3 | Threshold (recommend 70%+ semantic similarity, 50–70% manual review) |
| **A4: Defect Intelligence (5-layer RCA)** | Auto-enrich defect, classify failure, dedupe against existing | Failure evidence (stack trace, env, config, code, data) | 4-category classification (App / Test / Flaky / Env), enriched defect card, semantic match to past defects | Stack trace 90% / env 80% / config 60% / code 50% / data 40% weighting TBD | M5 | Layer weighting finalization needed |

### Post-MVP Agents (v1.5–v2+)

| Agent | Purpose | Ships | Notes |
|-------|---------|-------|-------|
| **A1: Test Case Generator** | Generate test cases from PRD/Jira/Figma | PM1 (MVP) | Clarification Questions gate, 3-tier confidence |
| **A2: Test Deduplication** | Surface duplicate candidates while authoring + bulk audit | PM1 (MVP) | ≥90% auto-flag (green) / 70–89% review (amber) / <70% ignore |
| **A4: Defect Intelligence (5-layer RCA)** | Auto-enrich defect, classify failure, dedupe against existing | PM1 (MVP) | Stack trace 90% / env 80% / config 60% / code 50% / data 40% |
| **A6: Test Data** | Inline synthetic data generation with provenance | PM2 (v1.5) | Re-generate, version history, audit trail |
| **A7: Test Maintenance** | Background suggestions, self-healing at scale | PM2 (v1.5) | Never silent edit; approve-in-context only |
| **A8 Advanced: Test Planning** | Risk-adaptive planning from historical defect patterns | PM2 (v1.5) | Adaptive strategy from code churn, auto-updated on PR |
| **APT: AI Product Tester** | Autonomous E2E test execution, scenario discovery | PM2 (v1.5) | Scenario discovery from user flows, exploratory automation |
| **A3: Low-Code Authoring** | Notion-style automation editor with drag-handles, slash commands | PM3 (v2) | Exports to Playwright/Selenium/Cypress/WebdriverIO |
| **A5: Test Selection** | Change-based subsetting for PR gates, ranked by impact | PM3 (v2) | Integrates with GitHub/GitLab Actions, 60% CI time reduction |
| **A8 Full: Test Planning** | Auto-strategy from PRD alone, risk matrix, entry/exit criteria | PM3 (v2) | Integrates with PM3 doc templates |
| **VCG Basic: Vibe Code Governor** | PR analysis, AI-code detection, JIT test plan, block/approve | PM3 (v2) | Governance layer for AI-written code, audit trail for EU AI Act |
| **VCG Full: Vibe Code Governor** | Advanced governance with full policy enforcement | PM4 (v2+) | Full policy library, multi-workspace governance |

### A4 Defect Intelligence 5-Layer RCA Pipeline (detail)

When a test fails, A4 walks through 5 layers:

1. **Layer 1 — Stack Trace:** Exception type, file, line number, full traceback. Confidence: 90%.
2. **Layer 2 — Environment:** Staging vs Prod differences, API versions, database state. Confidence: 80%.
3. **Layer 3 — Configuration:** Config values at failure time, threshold comparisons, flag values. Confidence: 60%.
4. **Layer 4 — Code Analysis:** Diff analysis, recent changes to affected module, author. Confidence: 50%.
5. **Layer 5 — Data Validation:** Input data that triggered failure, edge cases, boundary violations. Confidence: 40%.

**Auto-captured evidence:**
- Screenshot (full page + scroll depth)
- Console logs (last 500 lines, filtered by severity)
- Network requests (HAR file with timing)
- Environment snapshot (config JSON, version JSON)

**Output:**
- 4-category classification: **App** (code bug) / **Test** (test case issue) / **Flaky** (intermittent, env-dependent) / **Env** (infrastructure issue)
- Confidence score for each layer
- Semantic search for similar past defects (pgvector dedup)
- Auto-linkage to code changes, config diffs, data changes

---

## 10. 7-Layer Architecture

Target state over 18 months (MVP ships layers 1–4 + lightweight cut of 5):

```
LAYER 7: CAREER INTELLIGENCE LAYER [v2+]
→ Skills graph, job market matching, salary benchmarking, learning paths

LAYER 6: COMPLIANCE & GOVERNANCE LAYER [v1.5+]
→ EU AI Act automation, agent governance, audit trail, JIT evidence, immutable records

LAYER 5: ANALYTICS & VALUE VISIBILITY LAYER [MVP-lite]
→ Auto-reports, business KPIs, ROI dashboard (avg 688%), quality gates

LAYER 4: AGENTIC AI LAYER [MVP: 3 agents]
→ 7+ autonomous agents, LangGraph orchestration, HITL interrupts, checkpointing

LAYER 3: DOCUMENT INTELLIGENCE LAYER [MVP: 12 of 70]
→ 70+ doc types, context-aware generation (~28s), section-level confidence

LAYER 2: KNOWLEDGE LAYER [MVP: foundation]
→ pgvector DB, cross-project memory, RAG (Agentic + GraphRAG + Tool-augmented)

LAYER 1: UNIFIED PLATFORM LAYER [MVP: 4 integrations]
→ One workspace, Jira + GitHub/GitLab + Slack + Confluence, SSO-ready, RBAC
```

**MVP vertical slice:** L1 + L2 (foundation) + L3 (12 docs) + L4 (3 agents) + L5 (reports only, full dashboards in M6).

---

## 11. Information Architecture & Navigation

**Lifecycle-driven navigation** (not product silos). Replaces traditional flat tab-bar.

```
QA Nexus
├── [Auth] Login / Register / Forgot password
├── Project Picker (after login)
└── In-Project shell
    ├── Dashboard (Home)
    │   ├── My work (cases, bugs, approvals, reports due)
    │   ├── Agent activity feed
    │   ├── Quick stats + sparklines
    │   └── Assigned cases (personalized)
    │
    ├── PLAN (planning phase)
    │   ├── Documents (12 templates, 5 categories)
    │   ├── Test Strategies & Plans
    │   ├── Requirements Traceability Matrix (RTM)
    │   └── Risk Matrix
    │
    ├── AUTHOR (authoring phase)
    │   ├── Test Cases (three-pane: tree / list / detail)
    │   ├── Suites
    │   ├── Knowledge Base (own screen, not Settings)
    │   └── Bulk import
    │
    ├── RUN (execution phase)
    │   ├── Test Runs (manual + automated import)
    │   ├── Execution Co-Pilot surface (v1.5+)
    │   └── Evidence bundles (screenshot, logs, HAR, env)
    │
    ├── ANALYSE (analysis phase)
    │   ├── Defects (three-pane, AI-RCA detail)
    │   ├── Reports (Daily, Weekly, Sprint, Release, Exec)
    │   ├── ROI Dashboard + business metrics
    │   └── Quality gates (Pragmatic / Strict / Regulated)
    │
    ├── GOVERN (governance phase, v1.5+)
    │   ├── Audit Log (every action, actor, timestamp)
    │   ├── AI Agent provenance (who invoked, what inputs, outputs, KB reads)
    │   └── Compliance (EU AI Act, GDPR, HIPAA, GxP)
    │
    ├── Global Search (across all above)
    │
    ├── Command-K Omnibox (⌘K from any screen)
    │   └── Search, navigate, invoke agents
    │
    └── Admin (Admin/Lead only)
        ├── Users & Roles
        ├── Project Settings (Jira key, env list)
        ├── Integrations (Jira OAuth, CI webhooks, Slack, Confluence)
        ├── Integration Health (status widget)
        └── Audit Log
```

**Key IA principles:**
- **Lifecycle navigation:** Every action maps to PLAN → AUTHOR → RUN → ANALYSE → GOVERN
- **Three-pane layouts:** Folder tree / list / detail+evidence (Test Cases, Defects, Documents)
- **Card-first density:** Scannable at a glance, hover to expand
- **Right-slide creation panels:** Preserves list context (not centred modals)
- **Provenance visibility:** Every AI action shows "Reading from KB: X, Y, Z" chip

---

## 12. Design Direction: "Quiet Intelligence"

**Canon:** `PLAN_v2.md §5`, `brainstorm.md §6` (per `research/CONSOLIDATED_UI_DIRECTION.md`)

### Design Tokens (canonical for all screens)

| Token | Value | Usage |
|-------|-------|-------|
| **Canvas** | `#0B0F17` | Dark, cool undertone — main background |
| **Surface** | `#111827` | Slightly lighter — cards, panels |
| **Primary accent** | Violet `#A78BFA` / `#7C3AED` | AI surfaces, CTAs |
| **Secondary accent** | Teal `#2DD4BF` / `#0F766E` | Money/value, secondary CTAs |
| **Semantic colors** | Pass `#34D399` / Fail `#F87171` / Warn `#FBBF24` / Info `#60A5FA` / AI `#C4B5FD` | Status + meaning |
| **Typography** | Inter var (UI) / DM Sans (display) / Geist Mono (numeric) / JetBrains Mono (code) | Per-context font family |
| **Border radius** | 4sm / 6md / 10lg / 16xl | Consistent curvature |
| **Motion** | 120–180ms default, confident, never decorative | Interaction feedback |
| **Light mode** | Mirror of dark (Canvas `#F5F3F0`, Primary `#7C3AED`, etc.) | Post-v3 design task |

### Design Principles (10 core)

1. **Lifecycle-driven navigation** — PLAN → AUTHOR → RUN → ANALYSE → GOVERN, not flat tabs
2. **Three-pane layouts** — folder tree / list / detail+evidence (scannable, zoomable)
3. **Card-first density** — hover to expand, not row-grids (scannable at a glance)
4. **Notion-style step editor** — blocks, slash commands, drag handles (familiar to modern QA)
5. **Right-slide creation panels** — not centred modals (preserve list context)
6. **Command-K omnibox** — single entry point for search, nav, agents
7. **Status by colour + icon + shape** — WCAG 2.2 AA, colour-blind safe (never colour alone)
8. **Clarification Questions before AI** — never "generate and regret," visible form first
9. **Provenance Trifecta on every AI output** — label + confidence % + drill-to-evidence
10. **Knowledge Base chip visible** — every agent action shows KB context used

### Visual Differentiation (Copyright Safety)

**vs BrowserStack (target <10% visual overlap):**  
- Measured similarity: 3–5% (table-stakes overlaps only)
- BrowserStack: warm off-white canvas, red-orange primary, top tab-bar, row-heavy grids
- QA Nexus: dark `#0B0F17` canvas, violet primary, lifecycle nav, card-first

**vs ContextQA (intentional functional absorption, ~15–20% visual, ~40–50% functional):**  
- Measured similarity: one screen (AI Test Case Generator) is ~30%
- Mitigation options (pick one before design freeze):
  - Swap numbered step indicator for segmented progress bar
  - Move evidence panel from right-side to expandable bottom tray
  - Replace vertical confidence stack with horizontal traffic-light chip

### Existing Artifacts

- **`wireframe.html`** (104 KB) — v2 redesign, interactive prototype with 12 screens (Dashboard, Project Picker, Documents, Test Plan, Test Cases, Defect, Logs, Reports, Exec Dashboard, Users, Integrations). Uses light canvas + violet sidebar. Will be redesigned post-PRD to align to Quiet Intelligence dark tokens (v3 task). Design tokens in wireframe differ slightly from v2 spec; v2 spec is canonical.

---

## 13. Technology Stack (Locked)

**Date locked:** 2026-04-20  
**Source:** `PLAN_v2.md §8` (supersedes brainstorm Tech Stack)

> ⚠️ **PM1 stack updated 2026-04-25 — see PM1_PRD v8.0 / PM1_ERD v2.0 as the binding spec.**
> The §13 stack below describes the **eventual self-hosted PM2-PM4 architecture** (Gemma 4 on Ollama, FastAPI, etc.). For the PM1 build, we run on free APIs and free hosting — no self-hosted GPU, no FastAPI, no Redis. Specifically:
> - **PM1 LLM:** Groq free API (gpt-oss-120b primary, llama-4-scout long-context, gpt-oss-20b fast layers) + Gemini 2.5 Flash fallback. Migration path to self-hosted Gemma 4 26B MoE preserved (open-weight model — same prompts work).
> - **PM1 embedding:** Qwen3-Embedding-0.6B via `@xenova/transformers` (in-process WASM in NestJS). BGE-large dropped.
> - **PM1 hosting:** Cloudflare Pages + Render free + Neon free + Cloudflare R2 free. Oracle VM dropped.
> - **PM1 backend:** Single NestJS service. FastAPI dropped (revisit in PM2).
> - **PM1 cache/queue:** None. Sessions in Postgres, async via WebSocket. Redis + BullMQ dropped.
> - **PM1 frontend:** Next.js 15 + React 19 + Tailwind 4 (bumped from 14/18/3.4).
> - **PM1 cost:** $0/month for 8-user × 12hr/day pilot.
> See `PM1/PM1_PRD/PM1_PRD.md` v8.0 §12.3 and `PM1/PM1_ERD/PM1_ERD.md` v2.0 for the locked PM1 stack details.

### LLM Strategy — Gemma 4 Centered (PM2-PM4 vision; PM1 uses Groq free API)

| Tier | Model | Role | Host |
|------|-------|------|------|
| **PRIMARY** | **Gemma 4 26B MoE** (Apache 2.0, released 2 Apr 2026) | Document generation, A1/A2/A4 reasoning, report writing | Self-host via **Ollama** on Oracle Always Free VM (4 B active params, ~16 GB VRAM-equiv with offload) |
| **BURST** | **Gemini 2.5 Flash** (free tier) | Interactive co-pilot, overflow, fallback | Google AI Studio (1,500 req/day, 1M tok/min) |
| **LIGHT** | **Gemma 4 E4B** | Classification, A2 dedup scoring | CPU inference on Oracle VM |
| **EMBED** | **BGE-large-en-v1.5** | KB/RAG embeddings | sentence-transformers, CPU, local |

**Why Gemma 4:** Released 2 Apr 2026 under Apache 2.0. Gemma 4 31B Dense ranks #3 on LMArena; 26B MoE ranks #6, activates only 4B params. Beats Llama 4, DeepSeek V4, GPT-class on AIME 2026 and LiveCodeBench v6. Closes "Claude API rate limits at scale" open question. (per `PLAN_v2.md §8.1`)

### Frontend Stack

- **Next.js 14+** (App Router, RSC) · **React 18** · **TypeScript strict**
- **Tailwind CSS** + design-token CSS variables (Quiet Intelligence)
- **TipTap / ProseMirror** (Notion-style block editor for documents + test steps)
- **Zustand** (client state), **TanStack Query** (async data), **Recharts** (charting), **Socket.IO** (realtime)
- **Fonts:** Inter var (UI), DM Sans (display), Geist Mono (numeric), JetBrains Mono (code)

### Backend Stack

- **NestJS** (Node/TS) — API gateway, auth (BetterAuth), RBAC, Jira integration, audit log, notification fanout
- **Python FastAPI** — AI inference tier (LangGraph + agents, RAG, RCA pipeline, Pydantic)
- **LangGraph** — agent orchestration with HITL interrupts, checkpointing, branching RCA (chosen over CrewAI: loops, HITL pauses, graph state, audit replayability)

### Data & Memory Stack

- **PostgreSQL 15+** — primary relational store (22 entities across 4 tiers: Core, Content, Execution, AI-Vector)
- **pgvector** — vector store embedded in Postgres (replaces Pinecone for MVP; handles ~5M vectors on Oracle VM)
- **Redis 7** — cache, realtime run state, light pub/sub, BullMQ job queue
- **Neo4j Community** — backs Graphiti temporal knowledge graph
- **Graphiti** (by Zep) — long-lived agent memory, 63.8% LongMemEval, +14.8 pts vs mem0 (chosen over mem0)
- **MinIO** or **Cloudflare R2** — S3-compatible object store for evidence blobs (screenshots, HAR, traces)

### Orchestration & Jobs

- **Hatchet OSS** (MIT, Postgres-backed) — durable workflow / job queue, purpose-built for AI (short + long-running)
- **BullMQ** (or Redis-based) — short async tasks (emails, notifications)

### Auth

- **BetterAuth** (TS-native, 27.8k★) — email/password + session for MVP
- **Keycloak** (v1.5+ path) — SAML/SCIM for enterprise

### Automation & Execution

- **Playwright** — browser automation runner
- **Docker runners** on Oracle VM — isolated execution environment
- Webhook bridge to external CI (GitHub/GitLab Actions) — integration with existing pipelines

### Hosting — Tier 1 Zero-Cost Composition (LOCKED)

| Layer | Service | Free allowance |
|---|---|---|
| **Frontend** | **Vercel Hobby** | 100 GB bandwidth/mo · 100K serverless invocations · auto deploys |
| **Backend + AI** | **Oracle Cloud Always Free** | 4 ARM OCPU · 24 GB RAM · 200 GB block storage · 10 TB egress/mo |
| **Postgres + pgvector** | On Oracle VM | Unlimited within VM |
| **Neo4j Community** | On Oracle VM | Unlimited within VM |
| **Cache** | **Upstash Redis** (or on-VM) | 10,000 commands/day |
| **Object storage** | **Cloudflare R2** | 10 GB · zero egress |
| **CDN** | **Cloudflare Workers** | 100,000 requests/day |
| **Email** | **Resend** | 3,000 emails/mo |
| **Observability** | Self-hosted on Oracle | Unlimited |

**Scale path:** When Tier 1 caps bind (≥8 concurrent pilots or >5M vectors), lift-and-shift backend to **Hetzner CX32** ($7.40/mo — 4 vCPU, 8 GB RAM, 80 GB NVMe). Every component portable, Dockerized, no code rewrite required.

### Observability & Ops

- **Langfuse** (self-hosted on Oracle) — LLM traces, evals, prompt registry, cost tracking
- **SigNoz** (self-hosted) — APM, logs, metrics, distributed traces
- **GlitchTip** — Sentry-OSS-compatible error tracking
- **Unleash** — feature flags
- **GitHub Actions** — CI/CD

### Integrations (MVP)

- **Jira** — OAuth 2.0 3-LO, 2-way sync, webhook + 2-min poll fallback
- **Confluence** — read PRDs, write reports, PDF export
- **GitHub / GitLab** — CI webhook for automation results
- **Slack** — notification webhook only in MVP; full ChatOps v1.5+

---

## 14. Data Model Primitives

High-level entities (not the full ER diagram — Agent 3 ERD owns that). Across 22 core entities:

### Core / Identity & Org Tier
- **User** (id, email, name, password_hash, mfa_secret, global_role)
- **Organization** (optional v1.1; id, name, domain)
- **Project** (id, key, name, description, jira_project_key, status)
- **ProjectMember** (project_id, user_id, project_role)
- **Role** (id, name, permissions[])

### Content Tier
- **Document** (id, project_id, template_type, title, body_json/tiptap_json, status, version)
- **DocumentVersion** (id, document_id, body_json, author, created_at)
- **KBEntry** (id, organization_id, title, body, status, approved_by, embedding_vector_id)
- **KBEmbedding** (id, kb_entry_id, vector_id, embedding)

### Execution Tier
- **TestCase** (id, project_id, title, type bdd/traditional, priority, tags[], steps_json, expected_result, linked_requirement_id, stability_sparkline, author)
- **TestStep** (id, case_id, order, description, expected, evidence_urls[])
- **TestSuite** (id, project_id, name, case_ids[])
- **TestRun** (id, project_id, suite_id, environment, assigned_to, status, started_at, completed_at)
- **TestRunResult** (id, run_id, case_id, status pass/fail/blocked/skip, evidence_urls[], defect_ids[], notes)
- **Defect** (id, project_id, title, description, severity, priority, environment, status, reporter, assignee, jira_issue_key, linked_case_id, linked_run_id, ai_rca_json, ai_category)
- **AgentRun** (id, project_id, agent_type a1/a2/a4/a8, input_json, output_json, confidence_score, retrieved_vector_ids[], kb_entries_used[], status, created_at)

### Integration Tier
- **JiraIntegration** (project_id, base_url, oauth_token_ref, default_issue_type, status_map_json)
- **Integration** (id, project_id, type jira/github/slack/confluence, config_json, health_status, last_synced_at)

### AI-Vector Tier
- **Embedding** (id, entity_type document/case/defect/kb, entity_id, vector_id, embedding_model, created_at)
- **Comment** (id, parent_type document/case/defect, parent_id, author, body, created_at)
- **AuditLog** (id, actor_id, action create/update/delete, target_type, target_id, timestamp, metadata_json)

---

## 15. Integrations

### MVP Integrations (locked, per `PLAN_v2.md §8.9`)

| Integration | Type | Sync Direction | Protocol | Status | Notes |
|---|---|---|---|---|---|
| **Jira** | Issue tracker | 2-way (MVP) | OAuth 2.0 3-LO + webhook + 2-min poll | MVP | Create issue on Defect save, status/assignee/comment sync both ways. Per-project status_map_json for schema drift. Jira webhook preferred; fallback poll if webhook unavailable. |
| **GitHub / GitLab** | VCS | Inbound (CI webhook) | Webhook | MVP | CI webhook for automation results (JUnit XML, custom JSON). PR-gated test selection deferred v1.5. |
| **Confluence** | Wiki/docs | Outbound (write) | API token | MVP | Write reports (PDF, markdown export). Read PRDs for A1 context (inline). |
| **Slack** | Chat | Outbound (notify) | Webhook | MVP | Notification webhook only (run results, defect created, sign-off request). Full ChatOps deferred v1.5. |

### Post-MVP Integrations (v1.5–v2+)

| Integration | Type | Phase | Notes |
|---|---|---|---|
| **Azure DevOps** | Issue tracker | v1.5 | Enterprise demand, Jira alternative |
| **Linear** | Issue tracker | v1.5 | Startup-friendly, growing adoption |
| **TestRail / Zephyr / Xray / qTest** | Test management | v2 | Legacy test case import |
| **Notion** | Wiki/docs | v2 | Docs storage alternative |
| **GitHub Actions / GitLab CI / Jenkins / CircleCI** | CI/CD | v2 | Result ingestion, quality gates |
| **Microsoft Teams** | Chat | v1.5 | Slack alternative, full ChatOps |
| **Keycloak** | SSO | v1.5 | SAML/SCIM for enterprise |
| **OpenTelemetry** | APM | v2 | App instrumentation |

### MVP Integrations NOT in Scope

- Visual regression services (Applitools, Percy, etc.) — v2+
- Cloud device grids (BrowserStack, Sauce Labs) — build vs partner decision pending
- Payment/billing systems (Stripe, etc.) — post-MVP

---

## 16. Non-Functional Targets & Success Metrics

### Performance Targets

- **Document generation:** ≤30s for 12-template suite (p95)
- **Test plan generation:** ≤30s (p95)
- **Bug log creation:** ≤5s (p95, including Jira sync)
- **A4 RCA pipeline:** ≤60s (p95, all 5 layers)
- **Global search:** ≤2s (p95, 1000+ results)
- **Page load:** ≤2s (p95, including RSC hydration)
- **API response:** ≤100ms (p95, excluding external integrations)

### Adoption Targets (12-week pilot)

- ≥80% of pilot QAs log in ≥4 days/week by week 3
- ≥70% of defects in pilot projects flow through QA Nexus → Jira (vs direct Jira)

### AI Quality Targets

- ≥80% of A1-generated cases auto-approved (confidence ≥80%) without edit
- A2 catches ≥60% of true duplicates in controlled dataset
- A4 RCA top-layer accuracy ≥75% (human verification)

### Speed Targets

- Median time-to-log-a-bug ≤90s (baseline measured week 1)
- A1 case generation ≥10× faster than manual (validated in pilot)

### Value Targets

- ≥5 document types actively used per pilot project by week 6
- ≥1 exec-dashboard view per business day per pilot project
- ROI calculator produces defensible number (avg 688%) for at least one pilot by week 8

### Product Quality

- P0 bug count open during pilot <3
- <2% agent runs return error to user
- p95 document-generation latency <60s
- WCAG 2.2 AA accessibility (all MVP screens)
- <5s lag on global search indexing (eventual consistency)

### Reliability & Compliance

- 99.5% uptime (during pilot, best effort with Oracle Always Free)
- GDPR-aware data handling (EU residency path in v1.5)
- SOC2-ready controls (evidence export, audit trail 365d hot, 7yr cold)
- EU AI Act readiness (agent provenance, HITL override, transparent confidence)

---

## 17. Milestone Roadmap (7 Phases, 18 Weeks MVP)

Source: `PLAN_v2.md §9`, reconciled with `PLAN.md §10` (15-week baseline).

| Phase | Duration | Headline Scope | Exit Gate | Dependencies |
|---|---|---|---|---|
| **M0 — Foundation** | 2 wk | Auth (BetterAuth), RBAC (4 roles), project CRUD, Next.js shell, design tokens CSS variables, Postgres v1 schema, deploy pipeline (Vercel + Oracle), GitHub Actions CI/CD | Internal hello-world test (login → create project → create case) | None |
| **M1 — Knowledge + Docs** | 3 wk | KB CRUD (first-class object), RAG pipeline (pgvector + BGE embeddings), 12 document templates (5 categories), 5-field context form, section-level confidence scoring, PDF export, versioning, @mentions, comments | Generate a Test Plan from Jira PRD in ≤30s with ≥70% confidence | M0 complete |
| **M2 — Cases + A1 + A2** | 4 wk | Notion-style editor (TipTap blocks), BDD + traditional modes, A1 Test Case Generator (Clarification Questions gate), A2 Dedup (live chips while authoring), RTM, bulk import (CSV/TestRail/Zephyr), case versioning | Author 10 cases, A2 surfaces ≥1 duplicate candidate with >70% match | M1 complete |
| **M3 — Runs + A4 + Jira** | 4 wk | Test Runs (create, manual + automated import), evidence auto-capture (screenshot, console, HAR, env), A4 5-layer RCA, 4-category classification, Jira 2-way sync (OAuth 2.0, webhook + 2-min poll), defect form | Log defect, see it in Jira with full context <60s | M2 complete |
| **M4 — Reports + Dashboards** | 2 wk | Daily/Weekly/Sprint/Release templated reports auto-filled, Exec Dashboard (pass rate, defect trend, coverage, release RAG), ROI formula, personal dashboard | Executive can see a live 688%-class ROI number | M3 complete |
| **M5 — Polish + Beta** | 3 wk | WCAG 2.2 AA accessibility, Command-K omnibox, global search, audit log, perf optimization, E2E tests, pilot onboarding, documentation | 2–3 internal Iksula pilots live, <2% agent error rate, p95 latency targets met | M4 complete |
| **Total MVP** | **~18 wk** | **Pilot-ready QA Nexus** | **Go/no-go decision** | |

**Post-MVP waves** (aligned to PROJECT_ROADMAP.md v1.2):

> **Framing note:** The ROI, market-size, and productivity figures cited in this section are strategic-ideation framing from source research; they are benchmarks and working hypotheses, not pilot-measured facts. They must be qualified when copied into executive documents.

| Wave | Duration | Theme | AI Agents Added | Key Scope |
|---|---|---|---|---|
| **v1.5 (PM2)** | 16 wk | **Self-Healing + Test Data + Full Automation** | +A6, +A7, +A8 Advanced, +APT | Synthetic Test Data (A6), Test Maintenance Self-Healing (A7), A8 Advanced (Risk-Adaptive Planning), AI Product Tester (APT), Visual Regression, Mobile App, On-Prem Deployment. Extends PM1 test execution depth. Layers: on-prem, mobile, GraphRAG, predictive analytics. 32-doc catalog. |
| **v2 (PM3)** | 12 wk | **Low-Code + Governance + Enterprise Foundation** | +A3, +A5, +A8 Full, +VCG basic | Low-Code Authoring (A3), Test Selection (A5), Full Test Planning (A8 full), Vibe Code Governor (VCG basic), Enterprise SSO/SAML, Slack ChatOps, EU AI Act + SOC2 + ISO27001 foundation (L6). Unlocks enterprise deals. 50-doc catalog. |
| **v2+ (PM4)** | Ongoing | **Career Compass + Enterprise SaaS** | Ongoing expansion | Career Compass (L7), full 70-doc catalog, Cloud Device Grid, Multi-Tenant SaaS, HIPAA/GxP advanced compliance, white-label, VCG full. |

---

**Updated to match `PROJECT_ROADMAP.md v1.2` (2026-04-23):** Post-MVP waves §17, agent ship labels, and ROI framing synchronized per audit Wave 1 remediation. This document remains a strategic master narrative, not a phase-canonical execution document.

---

## 18. Risks & Mitigations

Top 10 from `PLAN_v2.md §11`, `project_analysis.md §10`:

| Risk | Likelihood | Impact | Mitigation | Owner | Status |
|---|---|---|---|---|---|
| AI generation quality below 80% auto-approve rate | High | MVP adoption stalls | Clarification Questions gate, KB conditioning, start templates narrow (12 not 70), human review fallback tracked per-doc | Product | Designed in |
| Gemma 4 self-host ops burden / single-point-of-failure | High | Service unavailable, pilot trust lost | Ollama auto-restart + health probes, fallback to Gemini 2.5 Flash free tier, Hetzner $7.40 warm standby documented, weekly model snapshot to R2 | DevOps | Designed in |
| Oracle Always Free tenancy reclaim (idle policy) | Med | Unplanned downtime | Synthetic heartbeat job + uptime monitor, migration runbook to Hetzner <2h, triggers at 75% idle threshold | DevOps | Designed in |
| Jira schema drift across customers | Med | Integration breaks per-customer | Per-project status_map_json + integration health widget + UI mapping tool | Backend | Designed in |
| Scope creep into PM-tool territory | Med | MVP overrun, unfocused | Explicit "out of scope" list enforced in intake, roadmap signed by Lead before each phase | Product | Designed in |
| 18-week MVP overrun | Med | Pilot delay, competitive pressure | P0–P5 have exit gates (not dates), phase may extend but no phase ships without gate pass | Product | Designed in |
| pgvector scale ceiling (~5M vectors) | Low | Performance degrade at 8+ pilots | Abstracted `VectorStore` interface in FastAPI, swap to Qdrant OSS without code rewrite when pilot count crosses 8 | Backend | Designed in |
| Copyright similarity to BrowserStack | Low | Legal challenge | `CLAUDE_DESIGN_PROMPT.md` §3 anti-rails (no red-orange, no warm canvas, no tab-bar, etc.), legal review before public launch | Design | Design task |
| AI Generator visual similarity to ContextQA on one screen (~30%) | Low | Brand confusion | Pick one mitigation from `brainstorm.md §7.2` before design freeze (progress bar, bottom tray, horizontal traffic-light) | Design | Open |
| Role model confusion | **Closed** | — | Collapsed 6 roles to 4 (Admin/Lead/QA/Mgmt), Jr/Sr/Automation as profile attributes | Product | ✅ Locked in v2 |

---

## 19. Open Questions & Gaps

**Specification gaps** (for downstream agents to resolve):

1. **Design v3 specification** — Wireframe uses light canvas + violet sidebar; PLAN_v2 §5 specifies dark canvas `#0B0F17`. Which is canonical? → **Answer: dark per v2, v3 wireframe redesign needed post-PRD.**

2. **Exploratory Testing session capture UX** — Loom-style video recording vs annotation layer on live browser? → **Open per PLAN_v2.md §12.** Recommend: Loom-style for MVP (post-PRD decision).

3. **Cloud Device Grid strategy** — Build vs partner vs defer? → **Open per PLAN_v2.md §12.** BrowserStack's moat is scale; recommend partner by v2.

4. **Visual Regression approach** — In-house diff vs Applitools/Percy? → **Open per PLAN_v2.md §12.** Recommend: defer to v2, partner when demand clear.

5. **AI Generator visual mitigation** — Pick one from `brainstorm.md §7.2` (progress bar / bottom tray / traffic-light chip) before design freeze. → **Open.** Recommend bottom tray for evidence panel (most differentiated).

6. **Single-tenant vs multi-tenant from day 1?** → **Not answered.** Recommend: multi-tenant foundation for enterprise scalability (per-org secrets, data isolation, subdomain routing).

7. **Data residency requirements for enterprise clients?** → **Not answered.** Relevant for EU AI Act compliance phase (v1.5+). Recommend: plan for EU region option by v1.5.

8. **Knowledge Base storage / approval workflow specifics** — Who approves entries? Version history? Auto-merge rules? → **Not fully detailed.** Recommend: Lead/Admin approve entries, version history per entry, no auto-merge (manual only).

9. **Test Dedup (A2) matching threshold** — At what % match should two cases be flagged as duplicates? Manual review required? → **Not specified.** Recommend: 70%+ semantic similarity = auto-flag (green), 50–70% = manual review (amber), <50% = ignore.

10. **A4 5-layer RCA confidence weighting** — How to weight each layer? (Stack trace = 90%, env = 80%, config = 60%, code = 50%, data = 40%?) → **Not specified.** Recommend: use suggested weights; validate with pilot data.

11. **Jira webhook reliability & fallback timing** — 2-min poll is conservative; can we reduce? Webhook delivery guarantees? → **Not specified.** Recommend: keep 2-min poll for MVP (simplicity), consider webhook-only in v1.5 after observing webhook delivery rates.

12. **ROI formula customization** — Is the default cost-per-stage ($200 Req / $1K Dev / $2.2K QA / $14.6K Prod) locked, or customer-configurable? → **Mentioned in brainstorm.md §5, not finalized in PLAN_v2.md.** Recommend: ship with defaults locked in MVP, make configurable in v1.5.

13. **Test Case versioning & diff display** — How many versions retained? Rollback UI? → **Not specified.** Recommend: unlimited retention, diff UI on detail screen (side-by-side markdown), rollback one-click.

14. **Global search indexing lag** — Real-time or eventual consistency? → **Not specified.** Recommend: eventual consistency, <5s lag for KB, <30s for integrations (webhook-sourced).

15. **Gemma 4 inference cost at scale** — Oracle VM CPU utilization, offload strategy, fallback timing? → **Not specified.** Recommend: monitor CPU (target 70% avg), automatic fallback to Gemini 2.5 Flash if >90% for >30s.

---

## 20. Decisions Ledger

Every locked non-obvious decision with one-line rationale:

1. ✅ **Gemma 4 26B MoE as primary LLM** — Apache 2.0 license, ranked #6 on LMArena, activates only 4B params, beats Llama 4 on AIME 2026, closes API rate-limit question.

2. ✅ **LangGraph over CrewAI for orchestration** — LangGraph supports loops, HITL interrupts, checkpointing, branching RCA, audit replayability; CrewAI is linear hand-offs only.

3. ✅ **pgvector on Postgres (MVP)** — Zero new service, same DB as system of record, handles ~5M vectors on Oracle VM, abstracted interface allows Qdrant swap at scale.

4. ✅ **Graphiti for long-term agent memory** — 63.8% LongMemEval, +14.8 pts vs mem0, temporal knowledge graph enables "has this defect pattern appeared before" graph traversals.

5. ✅ **TipTap/ProseMirror for editor** — Notion-style UX, JSON AST deterministic diffing, CRDT-ready for future multiplayer (Yjs), community-supported, no proprietary SDK lock-in.

6. ✅ **Next.js 14 App Router + RSC** — SSR for doc-heavy pages (TestPlan, RTM), RSC keeps client bundles small, incremental adoption of server components, deployment on Vercel (zero-dollar tier).

7. ✅ **Oracle Always Free + Vercel Hobby + Cloudflare R2 + Upstash** — Zero-cost MVP infrastructure, portable (IaC via Terraform), documented scale path to Hetzner CX32 ($7.40/mo) when Tier 1 caps bind.

8. ✅ **4-role RBAC (Admin/Lead/QA/Mgmt)** — Jr/Sr/Automation as profile attributes; simpler permission model, easier to audit, avoids 6-role confusion from v0.1.

9. ✅ **Knowledge Base as own top-level screen** — Every agent reads it; if buried in Settings, discoverability lost; own screen signals importance.

10. ✅ **Jira 2-way sync with OAuth 2.0 3-LO** — Reduces need for credentials storage (token kept in browser session), webhook + 2-min poll fallback ensures reliability even if webhook fails.

11. ✅ **Test Management as MVP beachhead** — Document generation is shipped but Test Cases is where stickiness is measured (daily usage, atomic work units); solves immediate QA pain (case authoring time, dedup, triage).

12. ✅ **18-week MVP clock with exit gates** — Phases have exit gates (not dates), allowing extension without rework; go/no-go decision at M5 based on pilot data, not arbitrary deadline.

13. ✅ **A1, A2, A4 in MVP only** — A3/A5/A6/A7/A8 deferred to v1.5+; three agents is enough to demonstrate AI value, complexity manageable in 18 weeks.

14. ✅ **12 of 70 documents in MVP** — Ship narrow (Planning, Execution, Defect, Reporting, Automation categories) to validate template quality before expanding; remaining 58 rolled out progressively.

15. ✅ **Clarification Questions gate on every AI generation** — Prevents "generate and regret," surfaces user intent gaps early, reduces post-generation edits (target: ≥80% auto-approve rate).

16. ✅ **Three-tier confidence model (≥90% / 70–89% / <70%)** — Auto-approve (green) removes friction, amber (warning) surfaces reviewable items, red (block) prevents harmful defaults.

17. ✅ **Provenance Trifecta on every AI output** — Label (e.g., "A1 Test Case Generator") + confidence % + drill-to-evidence link (KB read, vector retrieved, Jira issue linked) enables audit trail for EU AI Act.

18. ✅ **Quiet Intelligence dark canvas (#0B0F17)** — Intentionally distant from BrowserStack's warm off-white (copyright safety), violet primary signals AI (trustworthy, not dystopian), dark canvas reduces eye strain during long QA sessions.

19. ✅ **Lifecycle navigation (PLAN → AUTHOR → RUN → ANALYSE → GOVERN)** — Aligns to user mental model (how QA work naturally flows), not product silos; makes AI stages implicit in navigation.

20. ✅ **Pop-ups preferred over sliders** (per user direction) — Pop-ups (modals, right-slide panels) are cleaner for discovery; sliders hide options. Implemented via right-slide panels for creation (preserves list context) + Command-K modals for search/agents.

---

## Appendix: Source Document Index

| Document | Path | Role | Precedence |
|---|---|---|---|
| **Master source: Project Analysis** | `project_analysis.md` | Comprehensive inventory, tells you which files are canonical | Primary |
| **Canonical plan** | `PLAN_v2.md` | MVP v2 reconciliation, locked tech stack, 18-week roadmap, risk mitigations | **Use this when in doubt** |
| **Baseline plan (history)** | `PLAN.md` | v0.1 discovery, 15-week baseline, 6 roles (superseded) | Reference only |
| **Brainstorm: Full Platform Vision** | `QA_Nexus_Brainstorm.md` | 7-section vision, 17 problems, 7-layer arch, 7 agents, market research, competitive analysis | Primary |
| **Brainstorm: Test Management Beachhead** | `test case management/brainstorm.md` | Why Test Management first, user priorities, 18 features (F1–F18), UI/UX decisions, Quiet Intelligence tokens | Primary |
| **Spec: Test Management & Optimization** | `test case management/01_Test_Management_and_Optimization.md` | Master spec: cases, plans, cycles, defects, 8 agents, data schemas, APIs, UX, compliance, phased delivery | Authoritative |
| **Spec: Test Reporting & Analytics** | `test case management/02_Test_Reporting_and_Analytics.md` | 10 named dashboards, 5 reporting agents, ingestion pipeline, quality gates, ROI formula | Authoritative |
| **Spec: Automation & Playwright** | `test case management/03_Automation_Playwright.md` | Zero-to-first-run Playwright, @qanexus/playwright helper, CI YAML, 3,500+ browser-OS grid, 4 automation agents | Authoritative |
| **Spec: UI/UX Design Document** | `test case management/04_UI_UX_Design_Document.md` | Copyright-safe UX handoff, 10 design principles, tokens, IA (Home/Projects/Test/Automation/Reporting/Agents/Admin), per-module screens, WCAG 2.2 AA | Authoritative |
| **Manifest: Test Case Management Deliverables** | `test case management/MANIFEST.md` | Deliverables inventory, 4 markdown specs, 8 draw.io diagrams, 9 agents, quality gate presets, phased delivery | Index |
| **Wireframe: Interactive Prototype** | `wireframe.html` | 12 screens, Tailwind CSS, violet sidebar (design v2), interactive prototype | Reference (v3 redesign scheduled post-PRD) |

---

## Conclusion

QA Nexus is a **product-grade, AI-native QA platform** targeting a **$166.91B autonomous testing market** with **zero-dollar MVP infrastructure** and a **7-layer roadmap spanning 18 months**. The MVP (M0–M5) ships **Test Management as the beachhead** with **3 AI agents** (A1 Generator, A2 Dedup, A4 RCA), unlocking **90% faster test authoring, 95% faster defect triage, and measurable ROI** (avg 688%).

**Key constraints (non-negotiable):**
- Locked tech stack (Gemma 4 + Next.js + NestJS + FastAPI + LangGraph + pgvector + Oracle Always Free)
- Locked 4-role RBAC model
- Locked Quiet Intelligence design direction (dark canvas #0B0F17, violet primary, teal secondary)
- Locked Jira 2-way integration (OAuth 2.0 + webhook + poll)
- **18-week MVP clock with exit gates** (not dates)
- **2–3 internal Iksula pilot targets** for go/no-go decision

**No blocking unknowns.** All open questions (19 items in §19) are non-critical path and can be resolved in parallel during PRD/ERD phases without delaying M0 kick-off.

**Downstream agents should prioritize:**
1. **Agent 2 (PRD):** §1 (Executive Summary), §3 (Vision), §5 (Personas), §6 (MVP Scope), §13 (Tech Stack), §16 (Metrics), §17 (Roadmap)
2. **Agent 3 (ERD):** §13 (Tech Stack), §14 (Data Model), §15 (Integrations), §17 (Roadmap dependencies)
3. **Agent 4 (Milestones):** §17 (Roadmap), §18 (Risks), §19 (Gaps), §20 (Decisions)

---

*Master Brainstorm · QA Nexus MVP · Iksula Services Pvt Ltd · 2026-04-20 · Agent 1 (Consolidation) output*

---

## §21. UI DESIGN JOURNEY APPENDIX (added 2026-04-24)

This appendix captures design decisions, conventions, and realistic data canon locked during the PM1 UI build. **Final state (2026-04-25): 39 of 39 PM1 frames locked. Provenance: 17 Claude Design + 22 Claude Code (Plan A).** It complements §13 (Tech Stack) and §17 (Roadmap) by formalizing the UI layer.

### 21.1 "Quiet Intelligence / Evidence Mesh" design direction — finalized

The dark-canvas, low-chrome design direction established in §13 has been fully canonized across **all 39 locked frames**. Final tokens:

- Canvas `#0B0F17` · base `#111827` · raised `#1A2233` · overlay `#232C3F`
- Text primary `#F1F5F9` · secondary `#C7D0DC` · tertiary `#8A94A6`
- Semantic: pass `#34D399` · fail `#F87171` · warn `#FBBF24`
- Borders: subtle `#2A3347` · strong `#3B4660`

### 21.2 Teal = System, Violet = AI (binding rule)

The most consequential design decision finalized during the build: **primary teal `#2DD4BF` is reserved for every system action (Save, Finish, Import, Link, Confirm, + Add); secondary violet `#A78BFA` is reserved EXCLUSIVELY for AI indicators and AI actions (`✨ Generate tests`, `✨ Polish with A1`, `✨ Draft more with A1`, A1 Suggestions banner, A1 log timestamps, current-step stepper pulse)**. Save buttons are NEVER violet. This rule is stronger than the earlier §13 guidance.

### 21.3 Typography (binding)

- Inter — all UI body text, labels, buttons
- DM Sans — display headings 18px+
- JetBrains Mono — system identifiers (IDs like `RET-142`, counts, timestamps `09:41 AM`, file sizes `1.8 MB`, percentages, URLs, custom field keys)

### 21.4 Frame inventory grew from 23 → 38

Added during build: **F06b** (Set Password · Invite Setup for new users activating via invite magic link, reuses F06 Brand Panel), **F06c** (Reset Password · Forgot-Password flow for existing users — split out of F06b in v2.7 for cleaner dev handoff; 58-min expiry with amber warning + "Back to sign in" link), **F07b** (Invited QA Engineer First-Run — distinct from F07 founder-only), **F07c** (Invited Stakeholder First-Run — dashboard-focused, no AI agent tour, no violet), **F07d** (Invited Lead/Admin First-Run — same agent tour as F07b plus Govern Access Strip), **F08c** (Home Empty Project), **F11a / F11b / F11c** (Jira wizard split), **F14m1** (Edit/Add Requirement Modal), **F14m2** (Link Test Case Modal), **F14m3** (deferred Confirm Modal), **F27m1** (Invite User Modal — ongoing invites post-bootstrap with per-user role override, project assignment, Senior QA label, existing-user detection; distinct from F07 Step 3 which is one-time founder bulk-invite).

**Note on count correction:** The 23 → 38 growth reflects both NEW frames added during the build AND a correction of a prior F16a/b/c undercount (these are 3 distinct Test Case Editor variants — Method Chooser, A1 Generate, Bulk Import — but were sometimes collectively listed as one "F16" line in earlier inventory tables). Dual-mode and tri-mode frames have been split into discrete frames where each mode had sufficiently different content or routing (F06b → F06b+F06c, F07b tri-mode → F07b+F07c+F07d).

### 21.5 UX patterns canonized

1. Modal size canon: Stage 1120×860, Edit 960×720, Picker 720×640, Confirm 480×360.
2. Evidence Rail (280px right panel, item detail).
3. Activity Sidebar (280px right panel, timeline for multi-step operations).
4. Sync Warning Banner (amber-tinted for Jira-synced entities).
5. Welcome Strip + 3 Setup Cards pattern (F08c).
6. Method Chooser (ContextQA-inspired, F12).
7. Locked/disabled row pattern with 🔒 (F14m2 already-linked rows).
8. Selected-row indicator: 4px teal left-accent + subtle teal tint.

### 21.6 Realistic data canon (binding across all frames)

- Active demo project: **Iksula Returns (RET)** — newly created
- Other projects: Iksula Commerce (CART main), Iksula Payments (PAY staging amber), Iksula Mobile App (AUTH main green), Iksula Internal Ops (OPS available)
- Jira instance: `iksula.atlassian.net` (12 projects visible)
- Primary user: Yogesh M. (QA Lead, avatar YM teal)
- Team: Priya S. (violet), Rahul K. (warm), Arjun M. (tan), Neha D. (red), Rohan K. (warm variant)
- Sprint: Sprint 42 Day 9 of 14 (Sprint 43 future)
- Project ID format: `ORG-IKS / PRJ-RET`
- Sample files: `return_policy_v2.xlsx`, `legacy_refund_test_cases.csv`, `customer_return_flow_recording.mp4`
- ID patterns: Jira reqs `RET-###`, uploaded reqs `REQ-###`, test cases `TC-RET-###`, defects `DEF-###`, imports `#242`

### 21.7 PM3 M17 scope added: Jira auth alternatives

During F11 (Jira wizard) build we confirmed PM1 uses OAuth 2.0 3LO exclusively. PM3 M17 was expanded to add:
- API Token + Email Basic Auth (locked-down Atlassian Cloud)
- PAT (Jira Server / Data Center on-prem)
- Per-project Jira auth method
- Custom OAuth provider registration

This required new ERD table TB-013b (`jira_custom_oauth_providers`), schema expansion on TB-013, and new endpoints EP-006b/c/d/e. New PRD FRs: FR-063, FR-064. See `PRD.md`, `ERD.md`, `Milestone/M17/...` for the propagation.

### 21.8 Source of truth

`PM1_UI_v2/UI Files/DESIGN_EVOLUTION_v2.2.md` is the canonical design change log. `PM1_UI_v2/UI Files/01_SYSTEM.md` Appendix C holds the binding convention summary for AI frame generation.

### 21.9 PM1 Workspace Bootstrap Model — Single-Tenant Internal (binding, added 2026-04-24)

PM1 is a **single-tenant internal deployment**. Iksula Services Pvt Ltd is the only organization that exists in the database. There is **no public signup**, **no sales funnel**, **no self-service tenant creation** in PM1. Multi-tenant SaaS, per-org subdomain routing, external customer acquisition, and sales-led provisioning are explicitly **PM4 scope** (see PRD §8 and ERD Layer 1 progression).

**Day-0 Bootstrap (one-time, at first deploy in milestone M0):**

1. Engineering deploys QA Nexus to Iksula's infrastructure (Oracle Always Free + internal cloud).
2. A **deployment seed script** creates `organizations` row + the initial Admin user with `password_hash = NULL`, `invite_token = <random>`, `first_login = TRUE`, `onboarding_type = 'workspace_founder'`.
3. **Initial Admin assignment for PM1:** Yogesh M. holds the **Admin RBAC role** (which inherits all Lead permissions — Admin > Lead in the permission hierarchy). His organizational / persona label remains "QA Lead / Manager" (L3), but his system-level access is Admin for bootstrap and ongoing workspace governance. Email is configured at deploy time by Iksula IT.
4. Seed script triggers a transactional email via the **same F06b Mode A template** as regular user invites (subject differs: "Your QA Nexus workspace is ready").
5. Admin clicks magic link → F06b Mode A (Set Password) → F07 Workspace-Founder Onboarding (3-step wizard) → F09 Projects List with first project created.

**Subsequent invites** (after Day-0) are sent by the existing Admin via **F27 Users & Roles → F27m1 Invite User Modal**. F27m1 supports per-user role override (distinct from F07 Step 3's default-role-only flow), per-user project assignment, optional Senior QA organizational label, and existing-user detection. Invitees route through the same F06b Mode A landing → F07b (Invited Team First-Run, tri-mode based on their role).

**F07 Pattern A — Deferred Data-Source Routing (binding):** F07 Step 2 (data source choice) stores selection as wizard state only. No external flow fires during Step 2. After Step 3 "Create project & send invites" submits, backend atomically creates project + invite records in one transaction, then routes to F11a/b/c (Jira), F12 (Upload), or F09 Projects List (Blank) with the project already in DB. Benefits: invites go out before external OAuth begins; abandoning Jira/upload mid-flow leaves no orphaned state; F11/F12 stay universal regardless of entry point.

**Propagation:** This model is documented in **PRD v2.4 §15 PM1 Deployment Model subsection**, **ERD v2.4 TB-002 `users` invitation lifecycle columns**, and **MILESTONE_REGISTRY v3.4 M0 Definition of Done**.

**NOT in PM1:**
- Marketing website signup funnel
- Sales-led tenant provisioning
- Email domain verification
- Multiple workspaces per user
- SSO / SAML federation (PM3 M17)
- Self-service workspace creation (PM4)

---

*Master Brainstorm Appendix §21 added 2026-04-24 — captures learnings from Claude Design frames F06 through F14m1.*
