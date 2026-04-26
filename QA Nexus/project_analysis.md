# QA Nexus Project Analysis (Project-Level, PM1–PM4)

**Version:** 2.0  
**Date:** 2026-04-23  
**Organization:** Iksula Services Pvt Ltd  
**Status:** Project-level context and source-material index for PM1–PM4  
**Purpose:** Provide comprehensive background and traceability for program-wide execution documents  

---

## CANONICAL DOCUMENT CHAIN

The official hierarchy for project-level execution is:

1. **`PROJECT_ROADMAP.md` v1.2** — Phase structure, dates, agent ownership, scope per PM1–PM4
2. **`MILESTONE_REGISTRY.md`** — PM1 sub-milestone detail (M0–M6)
3. **`PRD.md`** — Feature-level requirements (full program, US-IDs, FR-IDs, NFR-IDs, GM-IDs)
4. **`ERD.md`** — Data + system design (TB-IDs, EP-IDs, CO-IDs, ADR-IDs)
5. **`Milestone/M*/Milestone_M*.md`** — Per-milestone execution plans
6. **`MVP_PRD.md`** — PM1 scope only (does not cover PM2–PM4)
7. **`QA_Nexus_Master_Brainstorm.md`** — Strategic master narrative (historical reference)

**This document** (`project_analysis.md`) serves as a project-level context spine and source-material inventory, not as an execution artifact. Use it to understand what exists and where; use the canonical chain above for authoritative phase/scope/feature decisions.

---

## 1. INVENTORY

### Root Folder: `/mnt/QA nexus MVP/`

| Path | Size | Type | Flag | Summary |
|------|------|------|------|---------|
| `PLAN_v2.md` | 26 KB | Plan (locked) | **CURRENT** | MVP v2 reconciliation (supersedes v0.1). Locked tech stack, 7-layer arch, 18-week roadmap, risk/mitigations. **CANONICAL — use this.** |
| `PLAN.md` | 14 KB | Plan (baseline) | history | Original v0.1 discovery plan. 15-week, 27 doc templates, 6 roles. Superseded by v2 but retained for reference. |
| `PRD.docx` | 50 KB | Binary (DOCX) | reference | Word doc PRD — exists but is being replaced by Blueprint Forge workflow. Do not read as canonical. |
| `wireframe.html` | 104 KB | Interactive HTML | design-v2 | Next.js/Tailwind wireframe. 12 screens (Dashboard, Project Picker, Docs, Test Plan, Test Cases, Defect, Logs, Reports, Exec Dashboard, Users, Integrations). Violet sidebar `#A78BFA`/`#7C3AED`, light canvas variant. Shows Quiet Intelligence direction but design tokens in v2 spec differ (dark canvas `#0B0F17`). Design v3 planned post-PRD. |
| `.DS_Store` | 11 KB | macOS metadata | ignore | — |

### Subfolder: `AI based QA Platform/` (17 files)

| Path | Size | Type | Flag | Summary |
|------|------|------|------|---------|
| `QA_Nexus_Brainstorm.md` | ~19 KB | Brainstorm | **key** | 7-section vision: vision, market research, 17 problems (3-era framework), 7-layer arch, 7 agents, feature priority, competitive analysis, tech stack, revenue model, UI/UX, flow diagrams, stats, open questions. **SOURCE OF TRUTH for platform vision.** |
| `QA_Nexus_Platform_Vision.md` | — | Brainstorm | reference | Career-long platform vision. 8 pain points, 6 core modules (Document Studio, Test Lab, Execution Co-Pilot, Defect Intelligence, Report Writer, Career Compass). High-level, not spec. |
| `QA_Nexus_Problem_Statement_FINAL.md` | — | Brainstorm | reference | 17-problem statement. 3 eras (Chronic/Accelerating/Emerging). $9.6K income gap. 65.6% profession fear. $166.91B market 2033. |
| `QA_Nexus_Future_Outlook_2026_2031.md` | — | Brainstorm | reference | 5-year vision. Fear crisis, income divide, regulatory (EU AI Act), career paths, market consolidation. |
| `QA_Nexus_Solution_Design.md` | — | Brainstorm | reference | 7-layer architecture deep dive. Document types (70+), agents (7), revenue model ($29/$19/$custom), phase roadmap (4 waves). |
| `QA_Nexus_Market_Research_2026_UPDATED.md` | — | Research | reference | Market sizing. Autonomous testing $166.91B CAGR 19.8%. QA professional population 4–5M. Salary: AI-using $45.4K vs non-AI $35.8K. |
| `QA_Nexus_Market_Research_Report.md` | — | Research | reference | Earlier version. Same data. |
| `QA_Nexus_Competitive_Analysis_2026.html` | — | Analysis (HTML) | competitive | 32 features × 7 platforms comparison. QA Nexus 32/32, Testomat.io 12/32, ContextQA 9/32, TestRail 8/32. Identifies 10 unique features. |
| `QA_Nexus_Mockups.html` | — | Design-v1 | obsolete | 5 screens, Notion design system, high-level preview. Superseded by v2 and wireframe.html. |
| `QA_Nexus_Mockups_v2.html` | — | Design-v2 | reference | 7 screens (added Compliance + Career). CORE badges on priority 5 screens. Deep feature detail per layer (Document Studio 70-type picker, RCA pipeline, 688% ROI, Career paths). |
| `QA_Nexus_Flow_Diagrams.html` | — | Flowcharts | reference | 7 swimlane diagrams (Requirements Analyzer, Test Generator, Execution Co-Pilot, Defect Intelligence, Report Writer, Compliance, Career Compass). Color palette: Blue/Purple/Green/Yellow/Red. |
| `QA_Roles_Documents_Reference_Guide.md` | — | Reference | reference | Persona definitions (Jr/Sr/Automation/Lead/Manager/Architect) and document types (70+) they consume. |
| `problem-landscape.drawio` | — | Diagram | reference | Draw.io format. Visualizes the 17-problem landscape across eras. |
| `qa-daily-workflow.drawio` | — | Diagram | reference | Draw.io. Daily workflow swimlanes. |
| `qa-nexus-architecture.drawio` | — | Diagram | reference | Draw.io. 7-layer architecture with components. |

### Subfolder: `test case management/test case management/` (11 files + diagrams)

| Path | Size | Type | Flag | Summary |
|------|------|------|------|---------|
| `MANIFEST.md` | ~10 KB | Spec index | **key** | Deliverables inventory. 4 markdown specs (01 Test Management, 02 Reporting, 03 Automation Playwright, 04 UI/UX), 8 draw.io diagrams (01–08, master flow). 9 agents + Insight agent. Quality gate presets (Pragmatic/Strict/Regulated). 4 delivery phases. |
| `01_Test_Management_and_Optimization.md` | ~47 KB | Spec | **key** | Master spec: test assets, test plans, execution, defects, 8 AI agents, reporting. Benchmarks BrowserStack. Full data schemas, APIs, UX, compliance, phase plan. |
| `02_Test_Reporting_and_Analytics.md` | ~39 KB | Spec | **key** | 10 named dashboards (Build Run, Failure Analysis, Health, Insights, Coverage, Execution Time, Quality Gate, QA Value, Executive), 5 reporting agents, ingestion pipeline, quality gates, ROI formula. |
| `03_Automation_Playwright.md` | ~34 KB | Spec | **key** | Zero-to-first-run Playwright, `@qanexus/playwright` helper, CI YAML, multi-framework grid (3,500+ browser-OS), 4 automation agents, visual/accessibility/performance. |
| `04_UI_UX_Design_Document.md` | ~39 KB | Spec | **key** | Copyright-safe UX handoff. 10 design principles, tokens, IA (Home/Projects/Test/Automation/Reporting/Agents/Admin), per-module screen specs, Session Replay, WCAG 2.2 AA, i18n, component library, handoff checklist. |
| `CLAUDE_DESIGN_PROMPT.md` | — | Prompt | reference | Prompt used to generate wireframes. References Notion, ContextQA visual patterns with anti-rails for copyright safety. |
| `brainstorm.md` | — | Brainstorm | **key** | **"Test Management beachhead brainstorm."** 3 promises (90% faster cases, 95% faster triage, 50% higher coverage). Feature inventory (F1–F18), priority order. UI/UX decisions (lifecycle nav, three-pane, card-first, Notion editor, Command-K, Knowledge Base). Visual direction "Quiet Intelligence" with tokens. |
| `diagrams/01-test-case-management-flow.drawio` | — | Diagram | reference | 3-lane swimlane: Manual/AI-generate/Import → dedupe → data gen → link → commit. |
| `diagrams/02-test-plans-flow.drawio` | — | Diagram | reference | QA Lead → AI Planning Agent → System. New plan → scope → AI plan → review → test selection → quality gate. |
| `diagrams/03-test-execution-flow.drawio` | — | Diagram | reference | 5-lane: Trigger/Manual/Automation/AI/Result. Manual vs automated bifurcation, self-heal branch. |
| `diagrams/04-defect-management-flow.drawio` | — | Diagram | reference | 4-lane: Source → AI RCA → Engineer → Jira/Linear. Failure → evidence → fingerprint → cluster → dedupe → link or create. |
| `diagrams/05-ai-agents-flow.drawio` | — | Diagram | reference | Orchestration map. 5 inputs, 8 agents + Insight, 6 outputs via LangGraph. |
| `diagrams/06-reporting-analytics-flow.drawio` | — | Diagram | reference | 4-lane: Ingest → Normalise → AI Enrichment → Surface. Run → JUnit/SDK → Kafka → ClickHouse → AI → dashboards → quality gate. |
| `diagrams/07-automation-playwright-flow.drawio` | — | Diagram | reference | 5-lane: Author → CI → Cloud Grid → AI → Outputs. Selector-break? → self-heal PR. |
| `diagrams/08-combined-master-flow.drawio` | — | Diagram | **key** | **End-to-end.** Requirements → AI planning → cycle → authoring → grid → artefacts → ingest → AI enrichment → quality gate (GREEN/AMBER/RED) → 10 dashboards → QA Value Dashboard → notifications → feedback loop. |
| `research/COMPETITOR_UI_RESEARCH.md` | — | Research | reference | ContextQA, BrowserStack UI analysis. |
| `research/CONSOLIDATED_UI_DIRECTION.md` | — | Research | reference | Quiet Intelligence direction rationale, design tokens, screen ownership. |
| `research/CONTEXTQA_ANALYSIS.md` | — | Analysis | reference | Feature-by-feature ContextQA breakdown. |
| `research/DESIGN_INSPIRATION.md` | — | Research | reference | Notion, Linear, Figma inspiration notes. |

### Subfolder: `testcase_generation&test Automation/TestCaseGeneration&TestAutomation/` (5 binary files)

| Path | Size | Type | Flag | Summary |
|------|------|------|------|---------|
| `BrowserStack_AI_Agents_Masterclass_Complete_Guide.docx` | — | Reference (DOCX) | reference | BrowserStack benchmarking. AI agents 1–7 breakdown. |
| `BrowserStack_Masterclass_Complete_UI_Guide.docx` | — | Reference (DOCX) | reference | UI/UX patterns from BrowserStack. |
| `BrowserStack_Website_UI_Flow_Reference.docx` | — | Reference (DOCX) | reference | Flow diagrams reference. |
| `Modules3_4_5_BrowserStack_UI_Complete_Guide.docx` | — | Reference (DOCX) | reference | Modules 3–5 UI reference. |
| `Modules3_4_5_BrowserStack_UI_Complete_Guide_Enhanced.docx` | — | Reference (DOCX) | reference | Enhanced version. |
| `Part5_Module5_BrowserStack_UI_Notes.docx` | — | Reference (DOCX) | reference | Module 5 notes. |

### Root Folder: `/mnt/uploads/` (6 files)

| Path | Size | Type | Flag | Summary |
|------|------|------|------|---------|
| `QA_Nexus_Brainstorm.md` | 34 KB | Brainstorm | **key** | **PRIMARY SOURCE.** Duplicate of AI-based-QA-Platform version. 15 sections. Market research, 17 problems, 7-layer arch, 7 agents, 32-feature competitor matrix, revenue model, phase roadmap. |
| `brainstorm.md` | 16 KB | Brainstorm | **key** | **Test Management beachhead.** Why this module, user priority, 18 features (F1–F18), 4 AI agents (A1, A2, A4, A8), UI/UX decisions (10 principles), visual direction "Quiet Intelligence," design tokens. |
| `PRD_Skill.md` | 19 KB | Skill template | tool | Blueprint Forge PRD skill. Auto-research workflow, document structure (20 sections), writing standards, visual content planning, DOCX generation pipeline. **Consumed by Agent 2 (PRD generator).** |
| `ERD_Skill.md` | 28 KB | Skill template | tool | Blueprint Forge ERD skill. Database schema planning, entity design patterns, architecture decision tree, API contract generation, compliance mapping. **Consumed by Agent 2 (ERD generator).** |
| `Milestone_Skill.md` | 29 KB | Skill template | tool | Blueprint Forge Milestone skill. Phased breakdown, work package tree, resource allocation, risk/dependency mapping, YAML/drawio generation. **Consumed by Agent 2 (Milestone generator).** |
| `README.md` | 16 KB | Documentation | tool | Blueprint Forge readme. Install, features, workflow, skill architecture. **Reference only.** |

---

## 2. PRODUCT VISION & POSITIONING

### What Is QA Nexus?

**QA Nexus is the AI-native operating system for the QA profession** — a unified platform that collapses 8–10 fragmented tools (TestRail, Jira, Confluence, Excel, emails, GitHub, Slack, Jenkins, etc.) into one workspace where QA teams plan, author, execute, triage, and report without leaving the app.

**The origin insight** (from `QA_Nexus_Brainstorm.md §3`):
- AI-generated code has **1.7× more bugs** and **2.74× more security vulnerabilities** than human code (ICSE 2026).
- QA is the **most-skipped step** in AI workflows.
- Yet **65.6% of QA professionals are "very concerned"** about AI displacing them (State of Testing 2026).
- The **$9.6K annual salary gap** between QA pros using AI tools ($45.4K) vs. non-AI ($35.8K) is widening.

### The Three Crises It Solves

1. **Fragmentation Crisis** — 8–10 tools per QA per day = ~45 min/day lost to context switching.
2. **Vibe-Coding Crisis** — AI-generated code ships with 1.7× more bugs; QA must scale intelligently.
3. **Profession Fear Crisis** — 65.6% of QAs are scared about job security; QA Nexus makes every QA "AI-native by default."

### The Three Product Promises (from `PLAN_v2.md §1`)

- **Test cases in minutes, not days** — 90% faster authoring (A1 Test Case Generator).
- **Failures diagnosed without human hunting** — 95% faster triage (A4 Defect Intelligence 5-layer RCA).
- **Coverage that actually grows** — 50% higher than baseline (A1 + A2 dedupe + Knowledge Vault memory).

### Who Is It For?

**Primary Persona:** Individual QA Engineer (Jr/Sr/Test Automation) — spends entire day in the app. Every screen must be fast, keyboard-accessible, low-friction.

**Secondary Personas:**
- QA Lead — creates projects, approves docs, sign-offs, team oversight.
- Higher Management — read-only dashboards, release readiness, ROI trends.
- Admin — tenant/user/role management, Jira credentials, integrations.

**MVP collapse decision (PLAN_v2.md §2):** 6 roles → 4 roles (Admin/Lead/QA/Mgmt), with Jr/Sr/Automation as profile attributes.

### What Makes It Different (from `QA_Nexus_Brainstorm.md §7`)

**10 unique features no competitor has:**
1. Document Generation (70+ types in ~28s)
2. Execution Co-Pilot (real-time guidance during live testing)
3. Knowledge Vault (cross-project memory via vector DB)
4. Career Compass (AI-powered career pathing for QA professionals)
5. ROI Dashboard (automatic business value calculation, avg 688%)
6. Portfolio Builder (auto-generated from real work)
7. Job Market Intelligence (live matching + salary benchmarking)
8. Duplicate Defect Detection (semantic vector similarity)
9. JIT Evidence Capture (auto-captured at exact failure moment)
10. Agent Governance (audit trail for every AI agent action)

### Market Size & Opportunity

- **Autonomous testing market:** $166.91B by 2033, CAGR 19.8%
- **QA professional population:** ~4–5 million worldwide
- **Regulatory tailwind:** EU AI Act enforcement 2026–2027, max fine 3% global revenue

---

## 3. PROJECT SCOPE (PM1–PM4 per PROJECT_ROADMAP.md v1.2)

### PM1 (MVP) — Test Management Beachhead

**Duration:** 21 calendar weeks (18 build + 3 GA)  
**Agents shipped:** A1, A2, A4 (3 total)  
**Core pillars:**

1. **Test Case Management** — Notion-style TipTap editor, BDD + traditional modes, tags, priority, linked requirements, case versioning, RTM, A1 Test Case Generator with Clarification Questions gate, A2 Dedup live chips, bulk import (CSV/TestRail/Zephyr/Xray/qTest).
2. **Integrations** — Jira 2-way sync (OAuth 2.0, webhook + poll), GitHub/GitLab (webhook bridge for Test Runs), Slack (outbound notifications; inbound ChatOps deferred to PM3), Confluence (inbound PRD read for A1 context), Figma (inbound design context for A1).
3. **Bug Management** — Defect creation form prefilled from failing test run, A4 Defect Intelligence 5-layer RCA (Stack → Env → Config → Code → Data), 4-category classification (App / Test / Flaky / Env), evidence auto-capture (screenshot + console + HAR + environment snapshot), semantic duplicate defect detection, Jira 2-way sync on save, defect form RTM linkage.
4. **Basic Reporting** — Templated auto-filled reports for Daily Status, Weekly Status, Sprint Sign-off, Release Readiness. Executive Dashboard with pass rate, defect trend, coverage, release RAG indicators, and ROI calculator (cost_avoidance = SUM(defects_caught × stage_multiplier)).
5. **Core Doc Catalog** — 12 of 70 document templates unlocked: Test Plan, Test Strategy, Test Estimation, Daily Status Report, Weekly Status Report, Sprint Sign-off, Release Readiness Report, Defect Report, Root Cause Analysis (RCA), Exploratory Testing Charter, Regression Test Outline, Requirements Traceability Matrix (RTM).

**Exit gate:** MVP GA signed off, ≥2 Iksula pilots live, ≤2% agent error rate, p95 latency targets met, 688%-class ROI demonstrated, 12-template catalog stable.

---

### PM2 (v1.5) — Self-Healing + Test Data + Full Automation [PM2]

**Duration:** 16 weeks  
**Agents shipped:** +A6 (Synthetic Data), +A7 (Test Maintenance), +A8 Advanced (Risk-Adaptive Planning), +APT (AI Product Tester)  
**Key scope:**

- Synthetic data generation with provenance, re-generate, version history, audit trail [PM2]
- Background self-healing suggestions; approve-in-context only (never silent edit); 40% flaky-test reduction [PM2]
- Adaptive test strategy from historical defect patterns, risk scoring from code churn [PM2]
- Autonomous end-to-end test execution, scenario discovery from user flows, exploratory automation [PM2]
- Visual Regression + Mobile App (iOS/Android Capacitor) + On-Prem Deployment guide (Helm chart) [PM2]
- 32-doc catalog (+20 templates: Advanced Automation, Visual Regression, Performance Test Plan, Mobile Test Matrix, Synthetic Data Charter, Data Quality, Maintenance Report, Flakiness Report) [PM2]
- Layers: +on-prem, +mobile, +GraphRAG full, +predictive analytics [PM2]

**Exit gate:** v1.5 GA signed off, ≥5 paying customers, on-prem deployment validated at 1 customer, 32 doc templates stable, predictive analytics dashboard live, A7 self-heal blocking ≥40% flaky test rework.

---

### PM3 (v2) — Low-Code + Governance + Enterprise Foundation [PM3]

**Duration:** 12 weeks  
**Agents shipped:** +A3 (Low-Code Authoring), +A5 (Test Selection), +A8 Full (Test Planning), +VCG basic (Governance)  
**Key scope:**

- Notion-style automation editor, drag-handles + slash commands, exports to Playwright/Selenium/Cypress/WebdriverIO [PM3]
- Change-based test subsetting for PR gates, ranked by impact, GitHub/GitLab Actions integration [PM3]
- Auto-strategy from PRD alone, risk matrix, entry/exit criteria, integrates with PM3 doc templates [PM3]
- Governance layer for AI-written code; every A1/A2/A3/A4/A5/A8 action traceable, audit trail for EU AI Act L6 [PM3]
- Enterprise Auth (SSO/SAML: Okta / Azure AD / Google Workspace) + Slack ChatOps (test case triage, command-k from Slack) [PM3]
- EU AI Act + SOC2 + ISO27001 foundation (L6) [PM3]
- 50-doc catalog (+18 templates: Strategy, Risk Matrix, Entry/Exit Criteria, Compliance Checklist, EU AI Act Evidence, SSO Integration, Migration Plan) [PM3]

**Exit gate:** v2 GA signed off, ≥15 paying customers, SSO in production, Vibe Code Governor blocking merges with >5 violations, 50 doc templates stable, SOC2 Type I report issued.

---

### PM4 (v2+) — Career Intelligence + Enterprise SaaS [PM4]

**Duration:** Ongoing (W47+)  
**Key scope:**

- Career Compass (L7): Skills graph, job market matching, salary benchmarking, learning paths [PM4]
- Full 70-doc catalog (+20 templates: Compliance, Advanced Analytics, Architecture Review, etc.) [PM4]
- Cloud Device Grid (partner integration: BrowserStack/LambdaTest + hybrid self-host grid) [PM4]
- Multi-Tenant SaaS (per-org subdomain routing, row-level tenant isolation, tenant-scoped secrets) [PM4]
- Enterprise Compliance (HIPAA, GxP / FDA 21 CFR Part 11, multi-region data residency: EU/US/APAC) [PM4]
- White-Label (customer branding, custom domains, embeddable QA Nexus widgets) [PM4]
- VCG full governance expansion [PM4]

**No fixed exit gate** — PM4 is ongoing product evolution.

---

### Explicitly Out of Scope (all phases)

- Replacing Jira (we complement)
- Project/sprint management (we link to Jira sprints)
- Code-repo integration beyond CI webhook

### AI Surface Rails (apply everywhere per PLAN_v2.md §4)

- **Clarification Questions before generation** — never "generate and regret"
- **Three-tier confidence model:** ≥90% auto-healed (green) / 70–89% amber / <70% red (blocks)
- **Provenance Trifecta:** label + confidence % + drill-to-evidence link
- **Knowledge Base chip** visible on every agent action

---

## 4. LOCKED TECHNICAL DECISIONS

All from `PLAN_v2.md §8` (dated 2026-04-20). PM1-specific stack updated 2026-04-25 — see note below.

> ⚠️ **PM1 stack updated 2026-04-25 — see `PM1/PM1_PRD/PM1_PRD.md` v8.0 and `PM1/PM1_ERD/PM1_ERD.md` v2.0 as the binding spec.**
> The §4 stack below describes the **eventual self-hosted PM2-PM4 architecture**. For PM1 build (8-user × 12hr/day × 1-2 month internal pilot), we run on free APIs and free-tier hosting to hit $0/month cost. Specifically:
> - **PM1 LLM:** Groq free API (`openai/gpt-oss-120b` primary, `meta-llama/llama-4-scout-17b-16e-instruct` long-ctx, `openai/gpt-oss-20b` fast layers) + Gemini 2.5 Flash free fallback. Self-hosted Gemma 4 26B MoE on Ollama deferred to PM2.
> - **PM1 embedding:** Qwen3-Embedding-0.6B via `@xenova/transformers` (in-process WASM in NestJS) — replaces BGE-large.
> - **PM1 hosting:** Cloudflare Pages + Render free + Neon free + Cloudflare R2 free + Resend free + Grafana Cloud free + UptimeRobot free. Oracle VM dropped.
> - **PM1 backend:** Single NestJS service. FastAPI dropped (revisit in PM2 if Python-specific needs emerge).
> - **PM1 cache/queue:** None. Sessions in Postgres, async via WebSocket. Redis + BullMQ dropped.
> - **PM1 frontend:** Next.js 15 + React 19 + Tailwind 4 + shadcn/ui + Sonner.
> - **PM1 vector store:** Postgres + pgvector (no pgvectorscale — not on Neon free; PM1 ~50K vectors fits comfortably).
> - **PM1 cost:** **$0/month** for the entire pilot.
> Project-level architecture below remains as planned for PM2-PM4 build. PM1 binding stack lives in PM1_PRD/PM1_ERD.

### LLM Strategy — Gemma 4 Centred (PM2-PM4 vision; PM1 uses Groq free API)

| Tier | Model | Role | Host |
|------|-------|------|------|
| **PRIMARY** | **Gemma 4 26B MoE** (Apache 2.0, 2 Apr 2026) | Document generation, A1/A2/A4 reasoning, report writing | Self-host via **Ollama** on Oracle Always Free VM (4 B active params, ~16 GB VRAM-equiv with offload) |
| **BURST** | **Gemini 2.5 Flash** (free tier) | Interactive co-pilot, overflow | Google AI Studio — 1,500 req/day, 1M tok/min |
| **LIGHT** | **Gemma 4 E4B** | Classification, A2 dedup scoring | CPU inference on Oracle VM |
| **EMBED** | **BGE-large-en-v1.5** | KB/RAG embeddings | sentence-transformers, CPU |

**Why Gemma 4:** Released 2 Apr 2026 under Apache 2.0. Ranks #6 on LMArena (26B MoE), activates only 4B params. Beats Llama 4, DeepSeek V4, GPT-class on AIME 2026 and LiveCodeBench v6. Closes "Claude API rate limits at scale" open question.

### Frontend Stack

- **Next.js 14+** (App Router, RSC) · **React 18** · **TypeScript strict**
- **Tailwind CSS** + design-token CSS variables (Quiet Intelligence)
- **TipTap / ProseMirror** (Notion-style block editor)
- **Zustand** (state), **TanStack Query** (async), **Recharts** (charting), **Socket.IO** (realtime)
- **Fonts:** Inter var (UI), DM Sans (display), Geist Mono (numeric), JetBrains Mono (code)

### Backend Stack

- **NestJS** (Node/TS) — API gateway, auth, RBAC, Jira integration, audit log
- **Python FastAPI** — AI inference tier (LangGraph + agents, RAG, RCA pipeline)
- **LangGraph** — agent orchestration with HITL interrupts, checkpointing, branching RCA (not CrewAI)

### Data & Memory Stack

- **PostgreSQL 15+** — primary relational store
- **pgvector** — vector store embedded in Postgres (replaces Pinecone; handles ~5M vectors on Oracle VM)
- **Redis 7** — cache, realtime run state, light pub/sub
- **Neo4j Community** — backs Graphiti temporal knowledge graph
- **Graphiti** (by Zep) — long-lived agent memory, 63.8% LongMemEval, +14.8 pts vs mem0

### Storage & Infrastructure

- **MinIO** or **Cloudflare R2** — S3-compatible object store for evidence blobs
- **Hatchet OSS** (MIT, Postgres-backed) — durable workflow / job queue, purpose-built for AI
- **BetterAuth** (TS-native, 27.8k★) — email/password + session for MVP (Keycloak v1.5+ path)

### Hosting — Tier 1 Zero-Cost Composition (LOCKED)

| Layer | Service | Free allowance |
|---|---|---|
| **Frontend** | **Vercel Hobby** | 100 GB bandwidth/mo · 100K serverless invocations · auto deploys |
| **Backend + AI** | **Oracle Cloud Always Free** | 4 ARM OCPU · 24 GB RAM · 200 GB block storage · 10 TB egress/mo |
| **Postgres + pgvector** | On Oracle VM | Unlimited within VM |
| **Neo4j Community** | On Oracle VM | Unlimited within VM |
| **Cache** | **Upstash Redis** (or on-VM Redis) | 10,000 commands/day |
| **Object storage** | **Cloudflare R2** | 10 GB · zero egress |
| **CDN** | **Cloudflare Workers** | 100,000 requests/day |
| **Email** | **Resend** | 3,000 emails/mo |
| **Observability** | Self-hosted on Oracle | Unlimited |

**Scale path:** When Tier 1 caps bind (≥8 concurrent pilots or >5M vectors), lift-and-shift backend to **Hetzner CX32** ($7.40/mo — 4 vCPU, 8 GB RAM, 80 GB NVMe). Every component portable, no code rewrite.

### Automation & Execution

- **Playwright** — browser automation runner
- **Docker runners** on Oracle VM — isolated execution environment
- **Webhook bridge** to external CI (GitHub/GitLab Actions) for existing pipelines

### Observability & Ops

- **Langfuse** (self-hosted on Oracle) — LLM traces, evals, prompt registry
- **SigNoz** (self-hosted) — APM, logs, metrics, distributed traces
- **GlitchTip** — Sentry-OSS-compatible error tracking
- **Unleash** — feature flags
- **GitHub Actions** — CI/CD

### Integrations (MVP)

- **Jira** (OAuth 2.0 3LO, 2-way sync, webhook + 2-min poll fallback)
- **Confluence** (read PRDs, write reports)
- **GitHub / GitLab** (CI webhook for automation results)
- **Slack** (notification webhook only in MVP; full ChatOps v1.5+)

---

## 5. UI/UX SIGNALS

### Wireframe Summary (`wireframe.html`)

**Size:** 104 KB HTML, fully interactive Next.js-compiled prototype.

**Tech:** Tailwind CSS + design-token variables. Violet sidebar gradient (`var(--violet-950)` → `var(--violet-900)`). Light canvas variant (not dark per final spec).

**12 Screens Included:**
1. Dashboard ("Good morning, Jane 👋") — 5-KPI strip, agent activity feed, quick stats
2. Project Picker ("Choose a project") — project switcher
3. Documents — template picker with category navigation
4. Test Plan ("Sprint 14 · Checkout") — AI-generated, versioned, commented
5. Test Cases ("Regression · Sprint 14") — three-pane list with tags/priority
6. Test Case Create — right-slide panel, Notion-style steps
7. Defect Log ("Log a bug") — prefilled from failing run
8. Defects List — three-pane, severity badges, Jira sync status
9. Reports — templated daily/weekly/sprint/release
10. Exec Dashboard — pass rate, defect trend, coverage, ROI
11. Users & Roles — RBAC management grid
12. Integrations — Jira, GitHub, Slack, Confluence configuration panels

**Design Tokens in Wireframe:**
- **Sidebar:** `var(--violet-950)` / `var(--violet-900)` gradient with `#E9E4F8` text
- **Logo gradient:** `linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)` (purple/violet)
- **Typography:** Inter var (body), DM Sans implied (display)
- **Status colors:** Pass `#34D399`, Fail `#F87171`, Warn `#FBBF24`, Info `#60A5FA`
- **Buttons:** Violet CTAs with shadow `0 6px 14px rgba(124,58,237,.35)`

**Layout Patterns:**
- **Lifecycle navigation** — Suggested: PLAN → AUTHOR → RUN → ANALYSE → GOVERN (not yet visible in wireframe; in design notes)
- **Three-pane layouts** — Test Cases & Defects show folder tree (L), list (M), detail+evidence (R)
- **Card-first density** — Cases and defects as cards, not rows; hover to expand
- **Right-slide panels** — Create case / Create defect / AI Generate slide from right edge, preserving list context
- **Command-K omnibox** — Noted in topbar as `⌘K` for "Search, navigate, agents…" (UI placeholder, not interactive in wireframe)

**Light/Dark Handling:**
- Wireframe shows **light canvas variant** (`#f6f5f4` / Notion-inspired, not production)
- **PLAN_v2.md §5 specifies dark canvas** as canonical: `#0B0F17` (cool undertone), Surface `#111827`, Primary violet, Secondary teal, Semantic colors (Pass/Fail/Warn/Info/AI)
- **v3 wireframe redesign scheduled post-PRD** to align to Quiet Intelligence dark tokens

**User Direction Captured:**
- **"Pop-ups preferred over sliders"** (noted in PLAN_v2 context)
- **"Combine old + new MVP designs"** — blend wireframe patterns with brainstorm details
- **"Clean/professional, looks good in light AND dark mode"** — v3 design must support both
- **"Anti-ContextQA visual similarity <10%"** (target from brainstorm.md §7.2) — copyright safety

---

## 6. PERSONAS & JOBS-TO-BE-DONE

### Six Core Personas (from `PLAN.md §2` and `QA_Nexus_Platform_Vision.md`)

1. **Junior QA Engineer** (3–5 yrs exp)
   - Primary JTBD: "Show me what I need to test today and help me write cases fast"
   - Pain: Manual case authoring, duplicates, document templates
   - Super power in QA Nexus: A1 Test Case Generator (10× faster), A2 Dedup detection, Knowledge Base (learn from past projects)

2. **Senior QA / QA Automation Engineer** (5–10 yrs exp)
   - Primary JTBD: "Architect test strategy, author test plans, run suites, triage failures fast"
   - Pain: Tool fragmentation, manual test planning, defect triage is slow
   - Super power: Test Planning Agent (A8), Defect Intelligence 5-layer RCA (A4), integration with CI/CD

3. **QA Lead / QA Manager** (8–15 yrs exp)
   - Primary JTBD: "Own project QA, approve strategies/plans, see team performance, report to management"
   - Pain: Status report generation, team oversight visibility, portfolio management
   - Super power: ROI Dashboard (688% avg), auto-reports (Daily/Weekly/Sprint/Release), Knowledge Vault (cross-project memory)

4. **Test Automation Engineer** (3–10 yrs exp)
   - Primary JTBD: "Write automated tests fast, debug failures, integrate with CI/CD"
   - Pain: Low-code isn't powerful enough, high-code takes too long, flaky tests, maintenance burden
   - Super power: A3 Low-Code Authoring (v1.5), A7 Test Maintenance (self-healing), Playwright integration with auto-evidence

5. **Product Manager / Stakeholder**
   - Primary JTBD: "See release readiness, understand QA risks, prove ROI of QA investment"
   - Pain: QA numbers don't speak to business; release readiness is opaque
   - Super power: Exec Dashboard, ROI formula with business KPIs, release sign-off workflow

6. **Automation / Executive Viewer** (Management read-only)
   - Primary JTBD: "See QA metrics at a glance, release readiness RAG, cost avoidance"
   - Pain: Too much detail in reports, metrics scattered across tools
   - Super power: Single-screen executive summary, live dashboards, one-click drill-down

### Primary JTBD (from `PLAN.md §3`)

Ranked by daily frequency:

1. "Show me what I need to test today on this project" → personalized dashboard, assigned cases, due reports
2. "Let me write a test case without fighting the form" → fast BDD/traditional editor, keyboard shortcuts, reusable steps, tags
3. "Log a bug in under 60 seconds and get it into Jira" → prefilled form, Jira sync on save, one-click
4. "Run a suite and record pass/fail quickly" → one-row-per-case execution view, quick-status, screenshot paste, defect link inline
5. "Generate the daily/weekly report without assembling by hand" → templated auto-populated
6. "Find the test case or bug I wrote last week" → global search across cases, defects, docs

---

## 7. INTEGRATIONS

**MVP integrations (locked, PLAN_v2.md §8.9):**

| Integration | Type | Sync Direction | Protocol | Status | Notes |
|---|---|---|---|---|---|
| **Jira** | Issue tracker | 2-way (MVP) | OAuth 2.0 3LO + webhook + 2-min poll | MVP | Create issue on Defect save, status/assignee/comment sync both ways. Per-project status_map_json for schema drift. |
| **GitHub / GitLab** | VCS | Inbound (CI webhook) | Webhook | MVP | CI webhook for automation results. PR-gated test selection (v1.5+). |
| **Confluence** | Wiki/docs | Outbound (write) | API | MVP | Write reports, PDF export. Read PRDs for A1 context. |
| **Slack** | Chat | Outbound (notify) | Webhook | MVP | Notification webhook only. Full ChatOps (v1.5+). |

**Future integrations (v1.5+ or v2):**

| Integration | Type | Rationale |
|---|---|---|
| **Azure DevOps** | Issue tracker | Enterprise demand, Jira alternative. |
| **Linear** | Issue tracker | Startup-friendly, growing adoption. |
| **TestRail / Zephyr / Xray / qTest** | Test management | Import legacy test cases. |
| **Notion** | Wiki/docs | Docs storage alternative. |
| **Google Docs** | Docs | Collaborative editing fallback. |
| **GitHub Actions / GitLab CI / Jenkins / CircleCI** | CI/CD | Automation result ingestion, quality gates. |
| **Microsoft Teams** | Chat | Slack alternative. |
| **Keycloak** | SSO | SAML/SCIM for enterprise (v1.5+). |
| **OpenTelemetry** | APM | App instrumentation. |

**MVP integrations NOT in scope:**
- Visual regression services (Applitools, Percy, etc.) — v2+
- Cloud device grids (BrowserStack, Sauce Labs) — build vs partner decision pending
- Payment/billing systems (Stripe, etc.) — post-MVP

---

## 8. OPEN QUESTIONS & GAPS

### Specification Gaps (for Agent 2 to resolve in PRD/ERD)

1. **Design v3 specification** — Wireframe uses light canvas + violet; PLAN_v2 §5 specifies dark canvas `#0B0F17`. Which is canonical? (Answer: dark per v2, v3 wireframe redesign needed post-PRD.)

2. **Exploratory Testing session capture UX** — Loom-style video recording vs annotation layer on live browser? (Open per PLAN_v2.md §12.)

3. **Cloud Device Grid strategy** — Build vs partner vs defer? (Open per PLAN_v2.md §12.)

4. **Visual Regression approach** — In-house diff vs Applitools/Percy? (Open per PLAN_v2.md §12.)

5. **AI Generator visual mitigation** — Pick one from brainstorm.md §7.2 (copyright safety) before design freeze. (Open per PLAN_v2.md §12.)

6. **Deployment model** — Cloud-hosted SaaS only (Vercel + Oracle) for MVP, or on-prem path in v2? (Answered: Vercel + Oracle for MVP; on-prem v2+ per PLAN_v2.md §8.2.)

7. **Single-tenant vs multi-tenant from day 1?** (Not answered; recommend multi-tenant foundation for enterprise scalability.)

8. **Data residency requirements for enterprise clients?** (Not answered; relevant for EU AI Act compliance phase.)

9. **Knowledge Base storage / approval workflow specifics** — Who approves entries? Version history? Auto-merge rules? (Not fully detailed; needs ERD/API spec.)

10. **Test Dedup (A2) matching threshold** — At what % match should two cases be flagged as duplicates? Manual review required? (Not specified; recommend 70%+ semantic similarity, manual review at 50–70%.)

11. **A4 5-layer RCA confidence scoring** — How to weight each layer? (Stack trace = 90%, env = 80%, config = 60%, code = 50%, data = 40%?) (Not specified; needs AI spec.)

12. **Jira webhook reliability & fallback timing** — 2-min poll is conservative; can we reduce? Webhook delivery guarantees? (Not specified; needs integration spec.)

13. **ROI formula customization** — Is the default cost-per-stage ($200 Req / $1K Dev / $2.2K QA / $14.6K Prod) locked, or customer-configurable? (Mentioned in brainstorm.md §5 but not finalized in PLAN_v2.md.)

14. **Test Case versioning & diff display** — How many versions retained? Rollback UI? (Not specified.)

15. **Global search indexing lag** — Real-time or eventual consistency? (Not specified; recommend eventual with <5s lag for knowledge base, <30s for external integrations.)

### Architecture Unknowns

1. **Gemma 4 self-host operational burden** — Oracle VM uptime expectations? Failover to Gemini 2.5 Flash automatic or manual? (Mitigation documented in PLAN_v2.md §11: Ollama auto-restart + health probes + automatic fallback.)

2. **pgvector scale ceiling** — 5M vectors estimated; what triggers migration to Qdrant OSS? (Answer: 8 concurrent pilots or >5M vectors per PLAN_v2.md §8.2.)

3. **Playwright runner environment** — Docker on Oracle VM sufficient, or need cloud grid for speed? (Answer: Docker for MVP; cloud grid v1.5+ per brainstorm.md §3.)

4. **Graphiti temporal knowledge graph pruning** — 90-day retention? 1-year? Infinite? (Not specified; needs data retention policy.)

5. **Hatchet job queue durability** — Postgres transaction log backups to R2? RTO/RPO targets? (Not specified; recommend R2 snapshots daily.)

---

## 9. OBSOLETE / SUPERSEDED ARTIFACTS

### Explicitly Superseded (do not use as source of truth)

| Artifact | Status | Reason | Use Instead |
|---|---|---|---|
| `PLAN.md` (v0.1) | Superseded | v2 consolidation reconciled with brainstorms. v0.1 is baseline but outdated. | `PLAN_v2.md` |
| `PRD.docx` | Being replaced | Word doc is placeholder; new Blueprint Forge PRD workflow will generate canonical DOCX. | (Wait for Agent 2 output) |
| `QA_Nexus_Mockups.html` (v1) | Superseded | 5 screens, high-level. v2 has deeper detail. | `QA_Nexus_Mockups_v2.html` |
| Old `ERD.html` + `ERD.drawio` | Deleted & redefined | User clarified: ERD now means "Engineering Requirements Document," not ER diagram. Architectural diagrams moved to brainstorm draw.io files. | (ERD coming from Agent 2) |
| `wireframe.html` design tokens | Partially outdated | Uses light canvas + violet sidebar. PLAN_v2 §5 specifies dark canvas `#0B0F17` as canonical. | `PLAN_v2.md §5` design tokens table |

### Files Retained for Reference (not authoritative)

| Artifact | Reason Retained |
|---|---|
| `PLAN.md` | Historical baseline; shows evolution from v0.1 → v2. Useful for context. |
| `QA_Nexus_Mockups.html` (v1) | Shows early design thinking; v2 is superset. |
| `QA_Nexus_Mockups_v2.html` | Reference for existing design direction; v3 redesign planned post-PRD. |
| BrowserStack reference docs (`.docx` files in testcase_generation subfolder) | Competitive benchmarking only. No design/code to copy. |
| `QA_Nexus_Market_Research_Report.md` | Duplicate of `_UPDATED.md`. Both retained; use UPDATED. |

### Known Future Work (Post-MVP)

| Item | Phase | Rationale |
|---|---|---|
| **v3 Wireframe redesign** | Post-PRD | Align to Quiet Intelligence dark tokens (`#0B0F17` canvas, violet primary, teal secondary). |
| **Full 70-document catalog** | v1.5+ | MVP ships 12 templates. Remaining 58 progressively. |
| **A3 Low-Code Authoring** | v1.5+ | Notion-style automation editor for test scripts. |
| **A5 Test Selection** | v1.5+ | Change-based subsetting, PR-gated CI. |
| **A6 Test Data generation** | v2 | Inline synthetic data with provenance. |
| **A7 Test Maintenance** | v2 | Background suggestions, self-healing at scale. |
| **Vibe Code Governor** | v2+ | JIT testing for AI-generated code, integration with LLM supply chain. |
| **AI Product Tester** | v2+ | Hallucination, bias, prompt-injection testing. |
| **Career Compass (L7)** | v2+ | Career pathing, job market matching, portfolio builder. |
| **Compliance & Governance (L6)** | v1.5+ | EU AI Act automation, agent audit trail, immutable test records. |
| **Visual Regression** | v2+ | In-house diff vs external vendor TBD. |
| **Cloud Device Grid** | v2+ | Build vs partner TBD. |
| **Mobile app** | v2+ | Notification + approval workflows on mobile. |
| **White-label / multi-tenant** | v2+ | SaaS per-customer branding. |
| **Keycloak + SSO/SAML** | v1.5+ | Enterprise authentication. |

---

## 10. RISK LANDSCAPE (from PLAN_v2.md §11)

| Risk | Severity | Mitigation | Status |
|---|---|---|---|
| AI generation quality below 80% auto-approve rate | High | Clarification Questions gate; KB conditioning; start templates narrow (12 not 70); human review fallback tracked per-doc | Designed in |
| Gemma 4 self-host ops burden / single-point-of-failure on Oracle VM | High | Ollama auto-restart + health probes; automatic fallback to Gemini 2.5 Flash free tier; Hetzner $7.40 warm standby documented; weekly model snapshot to R2 | Designed in |
| Oracle Always Free tenancy reclaim (idle-policy) | Med | Synthetic heartbeat job + uptime monitor; migration runbook to Hetzner in <2h | Designed in |
| Jira schema drift across customers | Med | Per-project `status_map_json` + integration health widget + mapping UI | Designed in |
| Scope creep into PM-tool territory | Med | Explicit "out of scope" list enforced in intake; roadmap signed by Lead before each phase | Designed in |
| 18-week MVP overrun | Med | P0–P5 have exit gates, not dates; phase may extend but no phase may ship without gate pass | Designed in |
| pgvector scale ceiling (~5M vectors) | Low | Abstracted `VectorStore` interface in FastAPI; swap to Qdrant OSS without code rewrite when pilot count crosses 8 | Designed in |
| Copyright similarity to BrowserStack | Low | `CLAUDE_DESIGN_PROMPT.md` §3 anti-rails; legal review before public launch | Design task |
| AI Generator visual similarity to ContextQA (~30%) | Low | Pick one mitigation from `brainstorm.md §7.2` before design freeze | Open |
| Role model confusion | **Closed** | Collapsed to 4 roles (Admin/Lead/QA/Mgmt); Jr/Sr/Automation as profile attributes | ✅ Locked in v2 |
| KB surface lives in Settings (lost discoverability) | **Closed** | Own top-level screen under AUTHOR | ✅ Locked in v2 |

---

## 11. DECISIONS LOCKED IN PLAN_v2 (from §12)

These are **non-negotiable for MVP:**

1. ✅ **Knowledge Base gets its own top-level screen** — not buried in Settings
2. ✅ **Duplicate Detection panel is always-visible-while-authoring**, dismissible per session
3. ✅ **Traceability matrix is tabular** with graph-view as toggle in v1.5
4. ✅ **Role model: 4 roles** (Admin/Lead/QA/Mgmt); Jr/Sr/Automation profile attributes
5. ✅ **Editor: build on TipTap/ProseMirror**, not buy
6. ✅ **pgvector (on Postgres) primary for MVP**, Qdrant OSS as scale-out path
7. ✅ **Cloud-hosted SaaS** Vercel + Oracle Always Free + Cloudflare R2 + Upstash (zero-dollar); on-prem v2+
8. ✅ **MVP entry point: Test Management beachhead** — docs are shipped but Test Cases = stickiness measure
9. ✅ **LLM: Gemma 4 26B MoE (Apache 2.0) self-hosted via Ollama** primary; Gemini 2.5 Flash free tier burst
10. ✅ **Agent orchestration: LangGraph** (not CrewAI) — HITL interrupts, checkpointing, branching RCA
11. ✅ **Long-term agent memory: Graphiti** (63.8% LongMemEval) on Neo4j Community

---

## 12. PHASE ROADMAP SUMMARY (18 weeks MVP)

From `PLAN_v2.md §9`:

| Phase | Duration | Deliverables | Exit Gate |
|---|---|---|---|
| **P0 — Foundation** | 2 wk | Auth, RBAC, project CRUD, Next.js shell, design tokens, deploy pipeline, Postgres v1, pgvector index, Claude API wiring | Internal hello-world test |
| **P1 — Knowledge + Docs** | 3 wk | KB CRUD, RAG pipeline, 12 doc templates, 5-field context form, section confidence, PDF export | Generate Test Plan from Jira PRD in ≤30s |
| **P2 — Cases + A1 + A2** | 4 wk | Notion editor, BDD+traditional, A1 Generator (Clarification Questions gate), A2 Dedup (live chips), RTM | Author 10 cases, A2 surfaces ≥1 duplicate |
| **P3 — Runs + A4 + Jira** | 4 wk | Runs, evidence auto-capture, A4 5-layer RCA, 4-category classification, Jira 2-way sync | Log defect, see it in Jira < 60s |
| **P4 — Reports + Dashboards** | 2 wk | Daily/Weekly/Sprint/Release templates auto-filled, Exec Dashboard, ROI formula, personal dashboard | Executive sees live 688%-class ROI |
| **P5 — Polish + Beta** | 3 wk | WCAG 2.2 AA, Command-K, global search, audit log, perf, E2E tests, pilot onboarding | 2–3 internal Iksula pilots live |
| **Total MVP** | **~18 wk** | Pilot-ready QA Nexus MVP | |

---

## 13. SUCCESS METRICS (MVP Pilots, 12 weeks post-launch)

From `PLAN_v2.md §10`:

**Adoption:**
- ≥80% of pilot QAs log in ≥4 days/week by week 3
- ≥70% of defects in pilot projects flow through QA Nexus → Jira

**Speed:**
- Median time-to-log-a-bug ≤90s (baseline measured week 1)
- Median time-to-generate-a-Test-Plan ≤30s
- A1 case generation: ≥10× faster than manual (validated in pilot)

**Quality of AI output:**
- ≥80% of A1-generated cases auto-approved (confidence ≥80%) without edit
- A2 catches ≥60% of true duplicates in controlled dataset
- A4 RCA top-layer accuracy ≥75% (human verification)

**Value:**
- ≥5 document types actively used per pilot project by week 6
- ≥1 exec-dashboard view per business day per pilot
- ROI calculator produces defensible number for at least one pilot by week 8

**Product quality:**
- P0 bug count open during pilot <3
- <2% agent runs return error to user
- p95 document-generation latency <60s

---

## 14. COMPETITIVE CONTEXT (from brainstorm.md §7)

### QA Nexus Feature Coverage: 32/32 (100%)

**Closest competitors:**

| Platform | Features | Gaps |
|---|---|---|
| **ContextQA** | 9/32 | ✓ 5-layer RCA, auto-healing. ✗ NO document generation, NO career, NO execution co-pilot, NO vibe code governor, NO ROI |
| **Testomat.io** | 12/32 | ✓ Clean UI, 40+ integrations, free tier. ✗ NO AI doc gen, NO career, NO knowledge vault, NO ROI |
| **TestRail** | 8/32 | ✓ 10K enterprise clients, trusted, mature. ✗ Legacy architecture, NO AI, NO career, NO doc gen |
| **Confident AI / DeepEval** | 6/32 | ✓ Best LLM evaluation (hallucination/bias testing). ✗ Developer-only, NO test management, NO doc gen, NO career |
| **TestGrid AI** | 7/32 | ✓ Browser farm + AI generation. ✗ NO doc gen, NO career, NO execution co-pilot |
| **Autonoma** | 5/32 | ✓ Self-healing. ✗ NO document gen, NO reporting, NO career |

### 10 Unique Features QA Nexus Ships (No Competitor Has)

1. Document Generation (70+ types in ~28s)
2. Execution Co-Pilot (real-time guidance during live execution)
3. Knowledge Vault (cross-project vector memory)
4. Career Compass (AI career pathing)
5. ROI Dashboard (automatic business value, avg 688%)
6. Portfolio Builder (auto-generated from real work)
7. Job Market Intelligence (live matching + salary benchmarking)
8. Semantic Duplicate Defect Detection (vector similarity)
9. JIT Evidence Capture (auto at exact failure)
10. Agent Governance (audit trail for every AI action)

---

## 15. DOWNSTREAM AGENT HANDOFF

### What Agent 2 (PRD Agent) needs from this dossier:

- ✅ **Problem statement** (§2 Product Vision)
- ✅ **MVP feature list** (§3 MVP Scope, M1–M10)
- ✅ **User personas + JTBDs** (§6)
- ✅ **Success metrics** (§13)
- ✅ **Risks & mitigations** (§10)
- ✅ **Design direction + tokens** (§5)
- ✅ **Integrations** (§7)
- ✅ **Competitive positioning** (§14)
- ❓ **Detailed API contracts** (create in PRD from MANIFEST + spec docs)
- ❓ **Wireframe visual specs** (formalize in PRD from wireframe.html analysis)
- ❓ **Acceptance criteria per feature** (create in PRD from MVP scope M1–M10)

### What Agent 3 (ERD Agent) needs from this dossier:

- ✅ **Tech stack** (§4 Locked Technical Decisions)
- ✅ **Data model hints** (from PLAN.md §8 sketch + MANIFEST spec references)
- ✅ **Integration contracts** (§7 Integrations, Jira OAuth schema, webhook expectations)
- ✅ **Agent I/O specs** (from MANIFEST diagrams 01–08, brainstorm.md §4)
- ✅ **Compliance requirements** (from brainstorm.md EU AI Act, GDPR hints)
- ✅ **Scaling considerations** (§4 pgvector 5M vectors, Hetzner scale path)
- ❓ **Full entity relationships** (create ERD from brainstorm data models)
- ❓ **API endpoint definitions** (create from M1–M10 CRUD operations)
- ❓ **Database schema** (formalize from PLAN.md §8 + MANIFEST references)

### What Agent 4 (Milestone Agent) needs from this dossier:

- ✅ **Phase roadmap** (§12, P0–P5, 18 weeks)
- ✅ **Exit gates per phase** (§12)
- ✅ **Risk mitigation timeline** (§10)
- ✅ **Locked decisions** (§11 — non-negotiable constraints)
- ✅ **Pilot strategy** (§13 — 2–3 Iksula internal projects)
- ✅ **Success metrics per phase** (§13)
- ❓ **Work breakdown structure** (WBS) per phase
- ❓ **Resource allocation** (headcount, skills, capacity)
- ❓ **Dependency map** (which phases block which)
- ❓ **Risk register with burn-down tracking**

---

## 16. READING ORDER FOR DOWNSTREAM AGENTS

**If you are Agent 2 (PRD):**
1. Start: `PLAN_v2.md` §1–5 (Vision, Users, MVP Scope, UX, Stack)
2. Then: This analysis (§2, §3, §6, §13, §14)
3. Then: `QA_Nexus_Brainstorm.md` §1–7 (Origin, 17 problems, 7-layer arch, agents, competitive landscape)
4. Reference: `wireframe.html` (visual direction)
5. Deep dive: `/test case management/MANIFEST.md` + `brainstorm.md` (feature specs, UI/UX decisions)
6. Cross-check: Open questions in §8 of this analysis

**If you are Agent 3 (ERD):**
1. Start: `PLAN_v2.md` §8 (Tech Stack, locked decisions)
2. Then: This analysis §4 (full stack table)
3. Then: `PLAN.md` §8 (data model sketch — foundation)
4. Reference: `/test case management/MANIFEST.md` diagrams 01–08 (data flow)
5. Deep dive: `/test case management/01_Test_Management_and_Optimization.md` (full schemas)
6. Cross-check: Open questions in §8 of this analysis (data residency, versioning, scale paths)

**If you are Agent 4 (Milestones):**
1. Start: `PLAN_v2.md` §9 (Phased Roadmap, P0–P5 deliverables + gates)
2. Then: This analysis §12 (summary) + §13 (metrics) + §10 (risks)
3. Then: `PLAN_v2.md` §11 (Risks & Mitigations — full table)
4. Reference: `PLAN.md` §10 (older 15-week roadmap for historical context)
5. Cross-check: Open questions in §8 of this analysis (resource gaps, phase dependencies)

---

## 17. CONCLUSION

**QA Nexus is a product-grade, AI-native QA platform targeting a $166.91B autonomous testing market with a 4-phase roadmap spanning ~18 months (PM1–PM3 planned, PM4 ongoing). PM1 (MVP) ships Test Management as the beachhead with 3 AI agents (A1 Generator, A2 Dedup, A4 RCA), unlocking 90% faster test authoring, 95% faster defect triage, and strategic ROI metrics. PM2 extends with self-healing, test data, and full automation. PM3 adds low-code authoring, governance, and enterprise foundation. PM4 provides career intelligence and enterprise SaaS expansion.**

**Key constraints:**
- Locked tech stack (Gemma 4 + Next.js + NestJS + FastAPI + LangGraph + pgvector + Oracle Always Free)
- Locked 4-role RBAC model
- Locked Quiet Intelligence design direction
- Locked Jira 2-way integration (OAuth 2.0 + webhook + poll)
- PM1 21-calendar-week clock (18 build + 3 GA)
- 2–3 internal Iksula pilot targets for PM1 go/no-go decision

**Document state and sync status:** This project-level analysis is paired with `PROJECT_ROADMAP.md v1.2` and audit remediation Wave 1 (2026-04-23). Post-MVP waves are phase-tagged `[PM2]`, `[PM3]`, `[PM4]` per canonical roadmap. All deferred features are mapped to current program phases. Use the canonical document chain (§ CANONICAL DOCUMENT CHAIN at top of this file) for authoritative phase/scope/feature decisions.

---

## § UI DESIGN EVOLUTION (v2.9 final — 2026-04-25)

**PM1 UI inventory closed at 39 of 39 frames locked (100% complete).** The spec evolved from 23 → 39 frames across multiple version increments. Provenance: 17 Claude Design + 22 Claude Code per Plan A. Final closure marked at v2.8 with F18m1 addition; folder reorganization at v2.9.

**New frames added:**
- **F06b** — Set Password · Invite Setup (new user activating via invite magic link, reuses F06 Brand Panel)
- **F06c** — Reset Password · Forgot-Password flow (existing user via email reset link, split from F06b in v2.7)
- **F07b** — Invited QA Engineer First-Run Onboarding (split out of original tri-mode v2.6)
- **F07c** — Invited Stakeholder First-Run Onboarding (split from F07b Mode B, no AI agent tour, dashboard-focused)
- **F07d** — Invited Lead/Admin First-Run Onboarding (split from F07b Mode C, same agent tour + Govern Access Strip)
- **F08c** — Home · Empty Project First-Run (Lead/Admin landing after F10 "Start blank")
- **F11a / F11b / F11c** — Jira wizard split into 3 sub-frames (Authorize / Map / Verify)
- **F14m1** — Edit / Add Requirement Modal (dual-mode: Edit pre-filled, Add empty)
- **F14m2** — Link Test Case Modal (multi-select picker with A1 draft awareness)
- **F14m3** — Convert to Jira Story Modal (deferred to engineering unless demo-needed)
- **F27m1** — Invite User Modal (ongoing team invites post-bootstrap; per-user role override, per-user project assignment, Senior QA label, existing-user detection)

**Count correction:** The 32 → 37 bump reflects both the F07b tri-mode split (+2: F07c, F07d) and a prior undercount of F16a/b/c where they were collectively counted as one Test Case Editor line item but are actually three distinct variants (Method Chooser, A1 Generate, Bulk Import).

**Final additions in v2.7-rapid → v2.8:** F15 Knowledge Base · F16a/b/c trio · F18 Test Suites · **F18m1 Edit Suite Modal (NEW v2.8 — Option B addition)** · F19 Run Console · F20 Run Results · F21 Defects Hub · F23 Reports Studio · F25 Executive Dashboard (Prove mode, ivory canvas) · F26 Agents (largest at 64 KB, violet-saturated control plane) · F27 Users & Roles · F28 Settings & Audit (HMAC-SHA256 immutable audit chain). All built via Claude Code in a single session per Plan A.

**Role-gate clarifications:**
- F07 now explicitly scoped to the workspace founder (the Admin/Lead who creates the workspace and first project). **F07 Step 2 uses Pattern A deferred routing** — data-source flows (Jira/Upload) fire AFTER Step 3 atomic project-creation transaction, not during Step 2.
- Invited members route to role-specific first-run onboarding: **F07b** (QA Engineer) · **F07c** (Stakeholder) · **F07d** (Invited Lead/Admin). All three share a common shell (top bar, welcome header, workspace strip, first-action picker, skip link) but differ in middle-region content and first-action destinations.
- **F07 Step 3 handles ONE-TIME bulk invites** during founder onboarding. **F27m1 handles ALL subsequent invites.** Invitees are routed to F06b Mode A → F07b / F07c / F07d based on their role.

**Design system canonizations:**
- **Teal = system, Violet = AI** rule formally locked. Save/Finish/Confirm/Import/Link CTAs are ALWAYS teal. Only `✨`-prefixed AI actions (Generate tests, Polish with A1, Draft more with A1) and A1 indicators are violet.
- Modal size canon: Stage 1120×860 (F10/F11/F12), Edit 960×720 (F14m1), Picker 720×640 (F14m2), Confirm 480×360 (F14m3).
- UX patterns canonized: Evidence Rail, Activity Sidebar, Sync Warning Banner, Welcome Strip + Setup Cards, Method Chooser (ContextQA), Locked Row 🔒.
- Typography binding: Inter (UI), DM Sans (display 18+), JetBrains Mono (all IDs, timestamps, counts, code).
- Realistic data canon: active project **Iksula Returns (RET)**, primary user Yogesh M. (Lead), team PS/RK/AM/ND/RK2, Sprint 42 Day 9 of 14, Jira `iksula.atlassian.net`, sample files `return_policy_v2.xlsx` + `legacy_refund_test_cases.csv` + `customer_return_flow_recording.mp4`.

**PM3 scope additions** (propagated to PRD / ERD / Milestone M17):
- Jira auth alternatives added as PM3 M17 scope: API Token + Email Basic Auth, PAT (Jira Server/DC on-prem), per-project auth, custom OAuth providers.
- ERD: TB-013 expanded with `auth_method` ENUM + `project_id` + `api_token_encrypted` + `custom_oauth_provider_id` + `self_signed_cert_trusted` + `last_test_connection_*` fields + CHECK constraint. New TB-013b `jira_custom_oauth_providers` table. New endpoints EP-006b/c/d/e.
- PRD: new FR-063, FR-064. M17 row expanded. L1 component progression refined.

**Full change log:** `PM1_UI_v2/UI Files/DESIGN_EVOLUTION_v2.2.md` captures every design decision, color rule, and realistic data anchor locked during the build.

**Final status (2026-04-25):** **39 of 39 frames locked. PM1 UI inventory is closed.**

**By provenance:**
- **Claude Design (17 frames in `frame  html view/`):** F06, F07, F08a, F08b, F08c, F09, F10, F11, F11b, F11c, F12, F13, F14, F14m1, F17, F22, F24.
- **Claude Code (22 frames in `frames - claude code build (PM1 v2.6-v2.8)/`):** F06b, F06c, F07b, F07c, F07d, F14m2, F14m3, F15, F16a, F16b, F16c, F18, F18m1, F19, F20, F21, F23, F25, F26, F27, F27m1, F28.

**Folder reorganization at v2.9:** Claude Code-built frames isolated to a sibling folder so future Claude Design touch-up passes can write to the original `frame  html view/` folder without conflict. Anti-drift discipline (teal=system, violet=AI, no MD3, hardcoded tokens, 8-slot top bar, 6-section left rail, realistic Iksula data canon) verified across all 39 frames. PM1 → PM2 boundary now clean; PM2 frame work begins fresh in `PM2_UI/`.

---

*Project-Level Context · QA Nexus PM1–PM4 · Iksula Services Pvt Ltd · Updated 2026-04-25 (PM1 UI closure)*
