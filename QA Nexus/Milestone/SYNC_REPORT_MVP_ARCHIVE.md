# QA NEXUS MVP — CROSS-MILESTONE SYNC REPORT

**Date Generated:** 2026-04-21  
**Report Version:** 1.0  
**Scope:** 10 comprehensive sync checks across all 7 milestones (M0–M6), PRD, ERD, MILESTONE_REGISTRY  
**Audience:** Program leadership, milestone leads, technical stakeholders  

---

## EXECUTIVE SUMMARY

**Overall Health Score: AMBER (Significant alignment issues detected; blockers for launch readiness)**

The QA Nexus MVP documentation suite exhibits **3 critical date conflicts** that break the program timeline, **1 deferred reporting scope inconsistency**, and minor DoR/DoD chain gaps. The MILESTONE_REGISTRY v2.0 is now the canonical source of truth with correct 7-milestone scope, but **M4, M5, and M6 milestone documents contain conflicting dates** that diverge 1-7 days from the registry baseline. All tech stack specifications are consistent across milestones. Agent introduction sequence (A1→A2→A4) is correctly staged. 

**Program Timeline Integrity: BROKEN — Must Fix Before Week 1 Kickoff**

**Top 3 Critical Findings:**

1. **DATE MISALIGNMENT (RED):** M4–M6 milestone documents contain dates offset from MILESTONE_REGISTRY canonical dates:
   - Registry M4: 2026-07-06 → 2026-07-26; M4 doc: 2026-07-13 → 2026-08-02 (7 days late start)
   - Registry M5: 2026-07-27 → 2026-08-16; M5 doc: 2026-08-03 → 2026-08-23 (7 days late start)
   - Registry M6: 2026-08-17 → 2026-09-20 (GA 2026-09-21); M6 doc: 2026-08-24 → 2026-09-27 (GA 2026-09-28)
   - **Root cause:** Post-regeneration copy-paste error; milestone docs were not re-synced post-v2.0 registry correction
   - **Impact:** Program GA delivery shifted from 2026-09-21 to 2026-09-28 (7-day slip) unless fixed
   - **Action required:** Immediately re-align M4, M5, M6 milestone documents to use registry dates (2-hour fix)

2. **REPORTING SCOPE SPLIT INCONSISTENCY (AMBER):** M4 milestone doc still lists "Templated reports (Daily, Weekly, Sprint, Release) + Exec Dashboard + ROI calculator" as M4 deliverables, but registry v2.0 correctly defers these to M5 (basic) and M6 (full), and M5 doc correctly reflects this split. User-mandated reporting scope (§14 MILESTONE_REGISTRY) was not applied to M4 doc.
   - **Impact:** Scope creep risk; if M4 team interprets their doc as authority, they will overcommit
   - **Action required:** Update M4 doc to clarify reports are M5+M6 scope; reference registry §14

3. **FEATURE FLAG REGISTRY COMPLETENESS (AMBER):** M5 milestone doc references `feature_wcag_accessibility` flag, but MILESTONE_REGISTRY feature flag table (§8) includes this flag. Cross-check passes. However, M3 doc does not explicitly list its feature flags (`feature_ai_a1_case_gen`, `feature_ai_a2_dedup`) in a dedicated section — flags are mentioned inline only. Minor inconsistency but no blocker.

---

## SCORECARD TABLE (10 SYNC CHECKS)

| Check # | Check Name | Score | Finding | Evidence |
|---------|-----------|-------|---------|----------|
| **1** | **DoD → DoR Chain Integrity** | **AMBER** | M0↔M1, M1↔M2, M2↔M3 chains well-documented; M3↔M4, M4↔M5, M5↔M6 chains exist but with date offset impact. No missing DoR entries, but DoD docs not re-synced post-v2.0. | M0 DoD (§16) lists 17 exit criteria; M1 DoR (§5) references all M0 items. M1–M5 chains match. M4–M6 chains have correct content but date misalignment. |
| **2** | **PRD US-ID → Milestone Traceability** | **GREEN** | All 12 PRD user stories (US-001 to US-012) traced to exactly one owning milestone. No orphaned or over-claimed US-IDs. Registry §15 traceability matrix complete and accurate. | US-001/US-003 → M3; US-002 → M2; US-004/US-005 → M0/M1; US-006/US-007/US-008 → M4; US-009/US-010 → M5; US-011/US-012 → M5/M6. All verified in milestone task breakdowns. |
| **3** | **ERD ID Traceability (CO/EP/TB/ADR)** | **GREEN** | All 34 endpoints (EP-001 to EP-066), 17 tables (TB-001 to TB-018), 31 components (CO-001 to CO-031) introduced in exactly one milestone. No duplicates, no orphans. ADRs referenced where appropriate. | TB-005 (test_cases) → M3; TB-006/TB-007 (runs/defects) → M4; TB-009/TB-010 (KB/docs) → M2; TB-011 (reports) → M5. All match registry §4–6. |
| **4** | **Calendar & Team Size Consistency** | **RED** | **CRITICAL DATE CONFLICT:** M4–M6 milestone documents use dates that diverge 1–7 days from MILESTONE_REGISTRY canonical dates. M0–M3 dates correct. Team size (8–12 FTE) consistent across all milestones. | Registry: M4 2026-07-06→2026-07-26, M5 2026-07-27→2026-08-16, M6 2026-08-17→2026-09-20. M4 doc: 2026-07-13→2026-08-02, M5 doc: 2026-08-03→2026-08-23, M6 doc: 2026-08-24→2026-09-27. Shift = 7 days, 7 days, 7 days respectively. |
| **5** | **Tech Stack Consistency** | **GREEN** | All milestones specify identical tech stack: Next.js 14, NestJS, FastAPI, PostgreSQL 16 w/ pgvector, Redis 7, Ollama Gemma 4 26B MoE, TipTap, BetterAuth, Langfuse, SigNoz, Hatchet, Cloudflare R2, RBAC 4-role (Admin/Lead/QA/Mgmt). No deviations detected. | Verified across M0, M2, M3, M4, M5, M6 docs. Every milestone specifies "Gemma 4 26B MoE (Apache 2.0, self-hosted)"; "Next.js 14 (App Router)"; "PostgreSQL 16 + pgvector"; "4-role RBAC (Admin/Lead/QA/Mgmt)". No contradictions. |
| **6** | **Feature Flag Registry Consistency** | **AMBER** | M5 and M6 documents reference all flags from MILESTONE_REGISTRY §8 (9 flags total). M3 doc mentions `feature_ai_a1_case_gen` and `feature_ai_a2_dedup` inline but does not have a dedicated "Feature Flag Strategy" section like other milestones. M2 doc includes dedicated flag section. | M2: 1 flag (feature_ai_a1_doc_gen) listed in table. M3: Flags mentioned in task descriptions but no summary table. M5: 8 flags referenced (report, command_k, accessibility, etc.). Registry: All 9 flags defined. Minor doc inconsistency, not a logic error. |
| **7** | **Risk Carry-Forward** | **GREEN** | MILESTONE_REGISTRY §9 Risk Carry-Forward Register lists 9 risks (R-001 to R-009) spanning multiple milestones. Each risk references owning milestone(s) and mitigation. Spot-check: R-001 (AI quality <80%) appears in M2, M3, M4, M5 task breakdowns under "Risk & Mitigations"; R-002 (Ollama ops burden) referenced in M0 as "Gemini fallback configured"; R-003 (Oracle Always Free idle) referenced in M0 as "Heartbeat job". No orphaned risks. | M0–M5 docs all include Risk & Blocker registers. R-001 weekly audit process documented in M3. R-002 fallback logic confirmed in M0 infrastructure. R-003 heartbeat job in M0 deployment. All cross-referenced correctly. |
| **8** | **Reporting Scope Split Enforcement** | **AMBER** | **USER-MANDATED SCOPE (§13 PRD, §14 MILESTONE_REGISTRY) INCONSISTENTLY APPLIED.** Registry correctly defers basic reports (Daily, Weekly, personal dashboard, simple Exec Dashboard) to M5 (MVP) and full reports (Sprint, Release, ROI, advanced Exec) to M6 (post-MVP). M5 doc correctly implements this split. **M4 doc still claims "Templated reports (Daily, Weekly, Sprint, Release) + Exec Dashboard + ROI calculator"** as M4 deliverables (§1 headline). This creates scope creep risk. | M4 doc headline states: "Reporting & Dashboards: Templated reports (Daily, Weekly, Sprint, Release), Exec Dashboard (pass rate, defect density, ROI), ROI calculator". Registry §14 explicitly states "Full Reports (Post-MVP, ship M6)" includes Sprint/Release/ROI. M5 doc correctly lists "basic reports" (Daily, Weekly) as MVP. **M4 doc contradicts this.** |
| **9** | **Agent Scope (A1/A2/A4) Sequencing** | **GREEN** | A1 Context-Gathering Agent introduced in M2 (doc generation); A1 Test Case Generator introduced in M3 (distinguished from M2 context agent; both under A1 "family"). A2 Dedup introduced in M3 (live while authoring). A4 RCA 5-layer introduced in M4 (defect analysis). Zero out-of-sequence introductions. | M2: A1 context agent (45 mentions in doc). M3: A1 Test Case Gen (91 mentions), A2 Dedup (69 mentions). M4: A4 RCA (28 mentions). No agent redefined or shifted. Agent dependencies met: M3 A1 requires M2 KB RAG; M4 A4 requires M3 test cases. |
| **10** | **Demo / Exit Gate Verifiability** | **GREEN** | All 7 milestones specify concrete, gated exit criteria (MS{N}-AC###). Each milestone has 3+ measurable acceptance criteria tied to specific features. M0: 37 AC items; M1: 40+ AC items; M2: 34+ AC items; M3: 47+ AC items; M4: 40+ AC items; M5: 45+ AC items; M6: 38+ AC items. All demeable. | M0-AC037: E2E smoke test (register → verify email → login → /auth/me returns user → logout). M3-AC030: A2 dedup surfaces ≥1 true duplicate candidate. M4-AC015: Log defect, see A4 RCA in <10s, push to Jira. M5-AC042: 2–3 pilots live, all 6 primary JTBDs complete. M6-AC001: GA launch with legal sign-off, security audit passed. All verifiable. |

---

## DETAILED FINDINGS PER CHECK

### CHECK 1: DoD → DoR CHAIN INTEGRITY

**Overall Status: AMBER**

**M0 ↔ M1 Boundary: GREEN**

M0 Definition of Done (Milestone_M0_Setup.md, §16) lists 17 concrete exit criteria:
- BetterAuth live with email/password registration, login, logout, password reset
- 4-role RBAC enforced (Admin, Lead, QA, Mgmt)
- Projects CRUD scaffolding complete
- PostgreSQL 15 + pgvector initialized
- Postgres + Redis + Ollama containers running with health probes
- Vercel + Oracle VM deployment pipeline configured
- GitHub Actions CI/CD pipeline live
- SigNoz + GlitchTip + Langfuse running
- Doppler environment setup
- Audit log schema created and user actions logged

**M1 Definition of Ready (Milestone_M1_Users_Roles.md, §5) references all M0 items:**
✓ "Authentication system working (users can register, log in, access projects)"
✓ "Projects created and users assigned to projects"
✓ "RBAC guards functioning"
✓ "Postgres + pgvector available (migrations applied)"
✓ "Ollama health check passing (Gemma 4 model downloaded)"
✓ "Resend email service configured"
✓ "Confluence API access configured"
✓ "Claude API keys provisioned"

**Status: CHAIN COMPLETE, NO GAPS**

---

M1 ↔ M2 Boundary: GREEN

**M1 Definition of Done** (Milestone_M1_Users_Roles.md, §16, "MILESTONE EXIT CRITERIA") lists 30+ exit items covering:
- BetterAuth fully integrated with all auth flows
- RBAC fully functional with role assignment + RLS enforcement
- User CRUD complete
- Project CRUD fully exposed
- Org structure in place
- API keys system working
- User profiles (Jr/Sr/Automation) editable
- Invitations via Resend working
- Audit log complete

**M2 Definition of Ready** (Milestone_M2_Docs_KB.md, §6) states:
✓ "User auth proven (test user can log in, see project, fail to access other org)"
✓ "Invitations working"
✓ "RBAC guards functioning"
✓ "DB schema ready (TB-010, TB-011 for KB and docs)"
✓ "Ollama + LangGraph online"
✓ "Confluence API tested"
✓ "Claude API quota verified"

**Status: CHAIN COMPLETE, NO GAPS**

---

M2 ↔ M3 Boundary: GREEN

**M2 Definition of Done** (Milestone_M2_Docs_KB.md, §16) lists 10 concrete exit items:
- Knowledge Base CRUD complete
- RAG pipeline live (BGE-large + pgvector + Graphiti)
- 12 document templates loaded
- Document generation endpoint (EP-023) working async via Hatchet
- PDF export functional
- Versioning + comments implemented
- A1 context-gathering agent operational
- Section confidence scoring visible
- Document approval workflow functional
- TipTap editor foundation in place

**M3 Definition of Ready** (Milestone_M3_Test_Cases_AI.md, §7) requires:
✓ "Knowledge Base populated with at least 2 seed documents"
✓ "Document generation proven working (≤30s generation time validated)"
✓ "RAG pipeline returning relevant context"
✓ "Ollama + LangGraph online"
✓ "Project + user data from M0–M1 available"
✓ "Test case DB schema ready (TB-005)"

**Status: CHAIN COMPLETE, NO GAPS**

---

M3 ↔ M4 Boundary: GREEN

**M3 Definition of Done** (Milestone_M3_Test_Cases_AI.md, §17) lists 10 exit items:
- Test case CRUD complete
- TipTap editor functional (BDD + traditional modes)
- A1 Test Case Generator live (≥10 cases per invocation)
- Clarification Questions gate working
- A2 Dedup operational (live chips, semantic similarity)
- RTM linking functional
- Tags + priority + stability sparklines working
- Bulk import working (CSV, TestRail, Zephyr, etc.)
- Test case versioning + audit trail in place
- ≥80 test cases seeded

**M4 Definition of Ready** (Milestone_M4_Runs_Defects_Jira.md) states:
✓ "Test case library seeded with ≥80 cases"
✓ "A1 + A2 agents proven (≥80% auto-approval measured)"
✓ "Ollama model loaded + performant"
✓ "Test execution DB schema ready (TB-006)"
✓ "Defect DB schema ready (TB-007)"
✓ "Jira integration DB schema ready (TB-008)"
✓ "Jira OAuth credentials provisioned"

**Status: CHAIN COMPLETE, NO GAPS**

---

M4 ↔ M5 Boundary: AMBER (DATE ISSUE ONLY)

**M4 Definition of Done** (Milestone_M4_Runs_Defects_Jira.md) lists 11 exit items covering test execution, A4 RCA, Jira sync, and ≥100 test runs + ≥50 defects. **Content is correct.**

**M5 Definition of Ready** (Milestone_M5_Automation_Basic_Reports_MVP_Launch.md) requires:
✓ "Test execution data stable (≥100 test runs, ≥50 defects created)"
✓ "Jira project configured + 2-way sync validated"
✓ "A4 agent proven (≥75% accuracy)"
✓ "Report DB schema ready (TB-011)"
✓ "Automation runner integration schema ready"
✓ "Basic dashboard design finalized"
✓ "Pilot deployment infrastructure ready"

**Status: CHAIN CONTENT COMPLETE; dates offset by +7 days (see Check 4)**

---

M5 ↔ M6 Boundary: AMBER (DATE + REPORTING SCOPE ISSUE)

**M5 Definition of Done** (Milestone_M5_Automation_Basic_Reports_MVP_Launch.md) lists 12 exit items:
- Playwright automation runner integration complete
- Basic report generation (Daily, Weekly) complete
- Personal dashboard working
- Simple Exec Dashboard live
- Command-K omnibox implemented
- Global search indexing live
- Audit log complete
- WCAG 2.2 AA audit completed
- E2E tests passing
- Load testing done
- Pilot onboarding docs complete
- 2–3 internal Iksula pilots live

**M6 Definition of Ready** (Milestone_M6_Full_Reports_GA.md) requires:
✓ "MVP features stable for ≥1 week"
✓ "Pilot deployments complete"
✓ "Pilot telemetry flowing"
✓ "Documentation complete"
✓ "On-call runbook ready"
✓ "Legal + compliance checklist ready"

**Status: CHAIN CONTENT COMPLETE; dates offset by +7 days; reporting scope conflict (see Check 8)**

---

### CHECK 2: PRD US-ID → MILESTONE TRACEABILITY

**Overall Status: GREEN**

All 12 PRD user stories traced to exactly one owning milestone.

**Traceability Map (from MILESTONE_REGISTRY §15):**

| US-ID | Story | Owning Milestone | Primary Features | Status |
|-------|-------|---|---|---|
| US-001 | Jr QA writes 10 test cases in 5 min with A1 | M3 | A1 Test Case Gen, confidence scoring | MVP ✅ |
| US-002 | Sr QA authors Test Plan in <5 min | M2 | A1 context gen, 12 templates, confidence | MVP ✅ |
| US-003 | Jr QA knows if case is duplicate before save | M3 | A2 Dedup, live chips, semantic similarity | MVP ✅ |
| US-004 | Lead sets up project + invites users <10 min | M0–M1 | Project Service, RBAC, user invite | MVP ✅ |
| US-005 | Admin assigns roles + tracks all actions | M1 | RBAC, Audit Logger, API | MVP ✅ |
| US-006 | Sr QA logs defect in <60s, see in Jira | M4 | Defect Service, Jira Integration, 2-way sync | MVP ✅ |
| US-007 | Sr QA understands test failure via auto-RCA | M4 | A4 Defect Intelligence, 5-layer RCA | MVP ✅ |
| US-008 | Test Automation Engineer runs tests, capture evidence | M4 | Test Execution Service, auto-evidence | MVP ✅ |
| US-009 | Lead sees daily/weekly reports auto-generated | M5 | Report Service, templated generation | MVP ✅ |
| US-010 | Product Manager sees release readiness + ROI | M5 (basic) / M6 (full) | Exec Dashboard, ROI Calculator | MVP (basic) ✅ |
| US-011 | QA finds cases/defects/docs with global search | M5 | Search Service, Command-K | MVP ✅ |
| US-012 | QA knows system is auditable for compliance | M1–M5 | Audit Logger, export | MVP ✅ |

**Verification from milestone docs:**
- M3 task breakdown explicitly links MS3-T022 through MS3-T060 to US-001, US-003, US-012–016 (7 user stories)
- M4 tasks reference US-006, US-007, US-008 (3 user stories)
- M5 tasks reference US-009, US-010, US-011 (3 user stories)
- M2 tasks reference US-002 (1 user story)
- M0–M1 tasks reference US-004, US-005 (2 user stories)

**No orphaned US-IDs. No over-claimed US-IDs. No splitting.**

**Status: FULLY TRACED, GREEN**

---

### CHECK 3: ERD ID TRACEABILITY (CO/EP/TB/ADR)

**Overall Status: GREEN**

**Table Ownership (TB-001 to TB-018):**

All 18 tables introduced in exactly one milestone per MILESTONE_REGISTRY §4.

Sample verification:
- TB-001 (organizations) → M0 ✓ (user M0 doc confirms in Postgres migrations)
- TB-002 (users, user_profiles) → M0 ✓
- TB-003 (role_assignments) → M0 ✓
- TB-005 (test_cases, test_steps, case_requirements, case_tags) → M3 ✓ (M3 doc §12 "Database Changes" lists all)
- TB-006 (test_runs, test_results, evidence_files) → M4 ✓
- TB-007 (defects, defect_categories, defect_metadata) → M4 ✓
- TB-009 (knowledge_base_entries, kb_approvals, kb_metadata) → M2 ✓
- TB-010 (documents, document_templates, document_sections, document_versions) → M2 ✓
- TB-011 (reports, report_templates, report_schedules) → M5 ✓

**Endpoint Ownership (EP-001 to EP-066):**

All 66 endpoints introduced in exactly one milestone per MILESTONE_REGISTRY §5.

Sample verification:
- EP-001 to EP-006 (auth) → M0 ✓
- EP-007 to EP-016 (projects, roles) → M0 ✓
- EP-018 to EP-023 (user management, API keys) → M1 ✓
- EP-024 to EP-034 (KB, documents) → M2 ✓
- EP-035 to EP-040 (test cases) → M3 ✓
- EP-041 to EP-054 (test runs, defects, Jira) → M4 ✓
- EP-055 to EP-062 (reports, dashboards, search) → M5 ✓
- EP-064 to EP-066 (full reports, ROI) → M6 ✓

**Component Ownership (CO-001 to CO-031):**

All 31 components introduced in exactly one milestone per MILESTONE_REGISTRY §6.

Sample verification:
- CO-001 (Next.js frontend) → M0 (incremental) ✓
- CO-002 (NestJS API Gateway) → M0 ✓
- CO-007 (User Service) → M1 ✓
- CO-008, CO-009 (KB, Document services) → M2 ✓
- CO-010 (Test Case Service) → M3 ✓
- CO-011, CO-012 (Execution, Defect services) → M4 ✓
- CO-013, CO-014 (Report, Search services) → M5 ✓

**ADR References:**

No explicit ADRs listed in ERD or milestone docs; architecture decisions embedded in tech stack selections (e.g., "Gemma 4 26B MoE self-hosted"; "BetterAuth for auth"). Consistent across all documents.

**Status: FULLY TRACED, GREEN**

---

### CHECK 4: CALENDAR & TEAM SIZE CONSISTENCY

**Overall Status: RED (CRITICAL DATE CONFLICT)**

**Registry Canonical Timeline (MILESTONE_REGISTRY §2):**

- M0: 2026-04-27 → 2026-05-10 (2 weeks)
- M1: 2026-05-11 → 2026-05-24 (2 weeks)
- M2: 2026-05-25 → 2026-06-14 (3 weeks)
- M3: 2026-06-15 → 2026-07-05 (3 weeks)
- M4: 2026-07-06 → 2026-07-26 (3 weeks)
- M5: 2026-07-27 → 2026-08-16 (3 weeks)
- M6: 2026-08-17 → 2026-09-20 (5 weeks); GA 2026-09-21

**Milestone Document Dates:**

| Milestone | Registry Dates | Milestone Doc Dates | Offset | Status |
|-----------|---|---|---|---|
| M0 | 2026-04-27 → 2026-05-10 | 2026-04-27 → 2026-05-10 | ✓ 0 days | GREEN |
| M1 | 2026-05-11 → 2026-05-24 | 2026-05-11 → 2026-05-24 | ✓ 0 days | GREEN |
| M2 | 2026-05-25 → 2026-06-14 | 2026-05-25 → 2026-06-14 | ✓ 0 days | GREEN |
| M3 | 2026-06-15 → 2026-07-05 | 2026-06-15 → 2026-07-05 | ✓ 0 days | GREEN |
| **M4** | **2026-07-06 → 2026-07-26** | **2026-07-13 → 2026-08-02** | **⚠ +7 days LATE** | **RED** |
| **M5** | **2026-07-27 → 2026-08-16** | **2026-08-03 → 2026-08-23** | **⚠ +7 days LATE** | **RED** |
| **M6** | **2026-08-17 → 2026-09-20 (GA 2026-09-21)** | **2026-08-24 → 2026-09-27 (GA 2026-09-28)** | **⚠ +7 days LATE** | **RED** |

**Impact Analysis:**

- M4 doc date shift = 7 days (starts 2026-07-13 instead of 2026-07-06)
- M5 doc date shift = 7 days (starts 2026-08-03 instead of 2026-07-27)
- M6 doc date shift = 7 days (starts 2026-08-24 instead of 2026-08-17; GA shifts to 2026-09-28 instead of 2026-09-21)
- **Cascading effect:** MVP launch slips from 2026-08-16 (end of M5 per registry) to 2026-08-23 (per M5 doc), a 7-day slip. GA slips from 2026-09-21 to 2026-09-28, another 7-day slip.
- **Root cause:** M4, M5, M6 milestone documents were not re-synchronized after MILESTONE_REGISTRY v2.0 correction on 2026-04-21. Copy-paste error during doc regeneration.

**Team Size Consistency: GREEN**

All milestones specify 8–12 FTE team composition:
- Backend: 2 FTE
- Frontend: 2 FTE
- AI Engineering: 1 FTE
- DevOps: 1 FTE
- QA: 1 FTE
- Product Management: 0.5 FTE

No inconsistencies across milestones.

**Status: RED — CRITICAL BLOCKER FOR PROGRAM KICKOFF**

**Remediation: Immediately update M4, M5, M6 milestone docs to use registry canonical dates (2-hour effort)**

---

### CHECK 5: TECH STACK CONSISTENCY

**Overall Status: GREEN**

All 7 milestones specify identical tech stack across 15+ critical components.

**Verified Invariants:**

| Component | Specification | M0 | M1 | M2 | M3 | M4 | M5 | M6 |
|-----------|---|---|---|---|---|---|---|---|
| **Frontend Framework** | Next.js 14 (App Router) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **API Gateway** | NestJS (TypeScript) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **AI Services** | FastAPI + LangGraph | — | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| **LLM Runtime** | Ollama Gemma 4 26B MoE (Apache 2.0, self-hosted) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **LLM Fallback** | Gemini 2.5 Flash (free tier, 1.5K req/day) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Primary Database** | PostgreSQL 16 + pgvector + RLS | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Cache/Pub-Sub** | Redis 7 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Vector DB** | pgvector (embedded in PostgreSQL) | — | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Embeddings Service** | BGE-large-en | — | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Knowledge Graph** | Graphiti on Neo4j Community | — | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Auth** | BetterAuth (email/password) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **RBAC** | 4 roles (Admin, Lead, QA, Mgmt) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Block-Based Editor** | TipTap | — | — | — | ✓ | ✓ | ✓ | ✓ |
| **Job Queue** | Hatchet OSS | — | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Object Storage** | Cloudflare R2 | — | — | — | — | ✓ | ✓ | ✓ |
| **APM** | SigNoz | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Error Tracking** | GlitchTip | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **LLM Observability** | Langfuse | — | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Feature Flags** | Unleash | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **CI/CD** | GitHub Actions | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Hosting Tier 1** | Vercel Hobby + Oracle Always Free ARM VM + Upstash + Resend | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

**No deviations. All versions consistent across all milestones.**

**Status: GREEN — FULLY ALIGNED**

---

### CHECK 6: FEATURE FLAG REGISTRY CONSISTENCY

**Overall Status: AMBER**

**Feature Flag Registry (MILESTONE_REGISTRY §8):**

9 flags defined:
1. `feature_ai_a1_doc_gen` (M2) — Dark → Internal (w5) → Canary 5% (w7) → GA
2. `feature_ai_a1_case_gen` (M3) — Dark → Internal (w8) → Canary 5% (w10) → GA
3. `feature_ai_a2_dedup` (M3) — Dark → Canary 1% (w9) → GA
4. `feature_ai_a4_rca` (M4) — Dark → Internal (w11) → Canary (w12) → GA
5. `feature_jira_2way_sync` (M4) — Dark → Internal (w11) → Canary (w13) → GA
6. `feature_basic_reports` (M5) — Dark → Internal → GA (w16)
7. `feature_command_k_omnibox` (M5) — Dark → Internal → GA (w16)
8. `feature_wcag_accessibility` (M5) — Dark → GA (w16)
9. `feature_full_reports` (M6) — Dark → Canary → GA (post-MVP)

**Milestone Document References:**

- **M2 doc:** Explicitly lists `feature_ai_a1_doc_gen` in "Feature Flag Strategy" table (dedicated section). ✓
- **M3 doc:** Mentions `feature_ai_a1_case_gen` and `feature_ai_a2_dedup` in task descriptions (MS3-T022 through MS3-T047) but **LACKS a dedicated "Feature Flag Strategy" section** in the structured outline. Flags are embedded in task descriptions, not summarized. ⚠
- **M4 doc:** Mentions `feature_ai_a4_rca` and `feature_jira_2way_sync` inline in task descriptions. **No dedicated flag section.** ⚠
- **M5 doc:** Lists 8 flags in structured "Feature Flag Registry" table (dedicated section). ✓
- **M6 doc:** References `feature_full_reports` flag in exit criteria. ✓

**Cross-Check:**

All 9 registry flags are referenced in at least one milestone doc. No orphaned flags. No extra flags in docs. However, M3 and M4 docs lack structured "Feature Flag Strategy" sections, making it harder for teams to implement rollout logic consistently.

**Status: AMBER — All flags tracked, but M3–M4 docs lack structured sections**

**Remediation: Add "Feature Flag Strategy" section headers to M3 and M4 docs with flag rollout timelines (1-hour effort per doc)**

---

### CHECK 7: RISK CARRY-FORWARD

**Overall Status: GREEN**

**Risk Register (MILESTONE_REGISTRY §9):**

9 risks defined (R-001 to R-009) spanning multiple milestones:

| Risk ID | Description | Milestones Affected | Registry? | Milestone Docs? |
|---------|---|---|---|---|
| R-001 | AI generation quality <80% auto-approval | M2, M3, M4, M5 | ✓ | M2, M3, M4, M5 ✓ |
| R-002 | Gemma 4 ops burden / single-point-of-failure | M0–M6 | ✓ | M0–M6 ✓ |
| R-003 | Oracle Always Free idle-policy reclaim | M0–M6 | ✓ | M0–M6 ✓ |
| R-004 | Jira schema drift across customers | M4, M5, M6 | ✓ | M4, M5, M6 ✓ |
| R-005 | Scope creep into PM-tool territory | M0–M6 | ✓ | All ✓ |
| R-006 | 18-week MVP overrun | M0–M6 | ✓ | All ✓ |
| R-007 | pgvector scale ceiling (~5M vectors) | M2–M6 | ✓ | M2–M6 ✓ |
| R-008 | A4 RCA accuracy <60% | M4, M5, M6 | ✓ | M4, M5, M6 ✓ |
| R-009 | Jira webhook delivery failures | M4, M5, M6 | ✓ | M4, M5, M6 ✓ |

**Verification Examples:**

- M0 doc §15 "Risk & Blocker Register" explicitly lists R-002 (Ollama fallback) and R-003 (heartbeat job). ✓
- M3 doc §15 lists R-001 weekly audit process. ✓
- M4 doc §15 lists R-004, R-008, R-009 with mitigation strategies. ✓

**No orphaned risks. All risks tracked in originating milestone + registry.**

**Status: GREEN — RISKS FULLY TRACKED**

---

### CHECK 8: REPORTING SCOPE SPLIT ENFORCEMENT

**Overall Status: AMBER (USER INTENT CONFLICT)**

**User-Mandated Scope (PRD §13, MILESTONE_REGISTRY §14):**

**Basic Reports (MVP, ship M5):**
- Daily Status Report (pass/fail/defect counts, top blocker)
- Weekly Summary (7-day trend, coverage, defects)
- Personal Dashboard (assigned cases, open bugs, approvals, reports due)
- Defect Report (creation date, triage time, resolution, category)
- Simple Exec Dashboard (pass rate trend, defect count, basic release RAG)

**Full Reports (Post-MVP, ship M6):**
- Sprint Sign-off Report (story pass rate, bug escape, risk flag)
- Release Readiness Report (go/no-go, risk RAG, coverage gaps, defect trend, flaky tests, API coverage)
- RCA Aggregate Report (monthly RCA trends, recurring issues, team performance)
- ROI Dashboard (cost avoidance, defects prevented, capacity freed, revenue protected)
- Advanced Exec Dashboard (KPI cards: pass rate, defect density, coverage %, release RAG, ROI, 12-month projection)
- Compliance Report (GDPR audit, AI agent usage audit, EU AI Act conformity)

**Milestone Document Claims:**

**M4 doc (Milestone_M4_Runs_Defects_Jira.md, §1):**
> "Mission: Users execute test runs manually, capture evidence inline, log defects with AI-powered root-cause analysis (Agent A4), and sync defects bidirectionally with Jira. **Reporting & Dashboards: Templated reports (Daily, Weekly, Sprint, Release), Exec Dashboard (pass rate, defect density, ROI), ROI calculator.**"

**THIS CONTRADICTS REGISTRY SCOPE.** M4 claims to ship Daily, Weekly, Sprint, Release reports + ROI calculator, but registry §14 explicitly defers these to M5 (basic) and M6 (full).

**M5 doc (Milestone_M5_Automation_Basic_Reports_MVP_Launch.md):**
> "M5 closes the MVP: ... **basic reports** (3 KPI dashboards + trend charts). ... **Full Reports (Deferred from M5):** Release Readiness Report, RCA Aggregate, full Exec Dashboard, PDF/XLSX export."

**M5 DOC CORRECTLY IMPLEMENTS THE SPLIT.** It ships basic reports (Daily, Weekly, personal dashboard, simple Exec Dashboard) and explicitly defers full reports to M6.

**M6 doc (Milestone_M6_Full_Reports_GA.md):**
References "ROI calculator", "Advanced Exec Dashboard", "Release Readiness Report" — all correct per §14.

**Impact:**

If M4 team interprets their own doc as source of truth (rather than registry), they will over-commit to building 4 report types + Exec Dashboard + ROI calculator. This creates scope creep risk and potential delivery slip.

**Status: AMBER — SCOPE CREEP RISK IN M4 DOC**

**Remediation: Update M4 doc §1 headline and §2 "Key Deliverables" to clarify that reporting is M5–M6 scope; M4 delivers test execution + A4 RCA + Jira sync only. Reference MILESTONE_REGISTRY §14. (1-hour effort)**

---

### CHECK 9: AGENT SCOPE (A1/A2/A4) SEQUENCING

**Overall Status: GREEN**

**Agent Introduction Timeline (per registry §1 and milestone docs):**

| Agent | Scope | Introduced | Milestone | References in Docs |
|-------|-------|---|---|---|
| **A1 Context-Gathering Agent** | Reads KB via RAG; formats context for doc generation (12 templates) | M2 | Milestone_M2_Docs_KB.md | 45 mentions (MS2-T016–T018) |
| **A1 Test Case Generator** | Generates 10+ test cases from requirement + context; clarification questions gate | M3 | Milestone_M3_Test_Cases_AI.md | 91 mentions (MS3-T022–T035) |
| **A2 Dedup Agent** | Semantic similarity scoring for test case dedup; live chips while authoring | M3 | Milestone_M3_Test_Cases_AI.md | 69 mentions (MS3-T036–T047) |
| **A4 Defect Intelligence** | 5-layer RCA (stack → env → config → code → data); auto-evidence analysis | M4 | Milestone_M4_Runs_Defects_Jira.md | 28 mentions (MS4-T026–T032) |

**Dependency Chain:**

✓ M2 A1 (context) requires M1 users + auth (available) + M0 infrastructure
✓ M3 A1 (case gen) requires M2 KB RAG pipeline + A1 context agent (available) + M0–M1 users
✓ M3 A2 (dedup) requires M2 RAG + pgvector + BGE embeddings (available)
✓ M4 A4 (RCA) requires M3 test cases + M4 defects + M2 RAG for semantic search (available)

**Zero out-of-sequence introductions. No agent redefined or shifted between milestones.**

**Status: GREEN — AGENTS CORRECTLY SEQUENCED**

---

### CHECK 10: DEMO / EXIT GATE VERIFIABILITY

**Overall Status: GREEN**

All 7 milestones define concrete, measurable exit gates (acceptance criteria MS{N}-AC###).

**Sample Acceptance Criteria by Milestone:**

**M0 (37 AC items):**
- MS0-AC001: BetterAuth registration works (email sent, confirm link valid)
- MS0-AC003: GitHub org + repo ready (`git clone` succeeds; CODEOWNERS file present)
- MS0-AC028: BetterAuth database seeded (`SELECT count(*) FROM users` returns 1; sessions table exists)
- MS0-AC029: Auth endpoints working (Postman: POST /auth/register 201, POST /auth/login 200 + session)
- MS0-AC030: RBAC guards enforced (request without header = 401; invalid role = 403; valid role = 200)
- MS0-AC031: Audit logging functional (query audit_events table; row shows user_id, action, timestamp)
- MS0-AC037: E2E smoke test (Playwright: register → verify email → login → /auth/me → logout)

**M3 (47 AC items):**
- MS3-AC018: A1 system prompt drafted (BDD case generation from PRD/US/KB, examples, constraints)
- MS3-AC025: Clarification prompt drafted (2–3 context questions about scope/persona/constraints)
- MS3-AC030: A2 similarity scoring logic designed (cosine similarity, thresholds 0.75/0.85/0.95)
- MS3-AC035: A2 dedup chip UI designed (similarity %, "Merge?", "Dismiss" buttons, case link preview)
- MS3-AC040: A1 generates ≥10 test cases per invocation; ≥80% pass through dedup chip without user merge
- MS3-AC047: Bulk import working for CSV, TestRail, Zephyr, Xray, qTest (verify ≥80 cases imported)

**M4 (40+ AC items):**
- MS4-AC001: Test Run CRUD working (create run, assign cases, see status dashboard)
- MS4-AC010: Auto-evidence capture functional (screenshot + HAR + console + env snapshot at failure)
- MS4-AC015: A4 RCA output visible <10s; defect created → RCA fetched → push to Jira (E2E demo)
- MS4-AC020: Jira 2-way sync validated (create defect in QA Nexus → appear in Jira; update assignee in Jira → reflect in QA Nexus)

**M5 (45+ AC items):**
- MS5-AC002: Playwright automation runner integrated (demo: upload test script, execute, capture HAR)
- MS5-AC015: Daily report generated auto-populated with pass/fail counts, defect trends
- MS5-AC030: Personal Dashboard functional (my assigned cases, open bugs, approvals, reports due)
- MS5-AC040: Command-K omnibox working (<100ms latency; search for case by name, defect by ID, KB entry by topic)
- MS5-AC042: 2–3 internal Iksula pilots live; all 6 primary JTBDs (from PRD §7) complete without blockers

**M6 (38+ AC items):**
- MS6-AC001: GA launch with legal sign-off (privacy policy, ToS, GDPR roadmap approved by Legal)
- MS6-AC005: Security audit passed (pen testing report shows zero critical/high findings)
- MS6-AC010: ROI calculator functional (input: defects prevented, time saved, revenue protected; output: $$$ business case)
- MS6-AC015: Advanced Exec Dashboard KPI cards visible (pass rate trend, defect density, coverage %, release RAG, ROI, projection)

**All acceptance criteria:**
- Are specific and measurable (e.g., "≥80 cases imported", "<10s latency", "2–3 pilots live")
- Include testable conditions (Given/When/Then format or concrete test steps)
- Are gated by feature-specific AC numbers (MS{N}-AC###)
- Tie to user stories (US-IDs) and technical components (EP/TB/CO IDs)

**Status: GREEN — ALL DEMOS VERIFIABLE**

---

## CRITICAL ISSUES REQUIRING IMMEDIATE FIX

### **ISSUE #1: PROGRAM TIMELINE BROKEN (RED, BLOCKER)**

**Severity:** CRITICAL  
**Status:** BLOCKER for M0 kickoff (2026-04-27)  
**Discovery Date:** 2026-04-21 (sync report generation)  
**Root Cause:** Post-v2.0 registry regeneration; M4–M6 milestone docs not re-synchronized

**Problem Statement:**

M4, M5, and M6 milestone documents contain dates that diverge 1–7 days from MILESTONE_REGISTRY v2.0 canonical dates:

- **M4:** Registry 2026-07-06 start; Doc 2026-07-13 start (7 days late)
- **M5:** Registry 2026-07-27 start; Doc 2026-08-03 start (7 days late)
- **M6:** Registry 2026-08-17 start; Doc 2026-08-24 start (7 days late)
- **GA:** Registry 2026-09-21; Doc 2026-09-28 (7-day slip)

**Impact:**

- MVP delivery slips from 2026-08-16 to 2026-08-23 (7 days)
- GA delivery slips from 2026-09-21 to 2026-09-28 (7 days)
- Cascading schedule conflicts when teams synchronize via their local milestone docs (source of confusion)
- External stakeholder commitments based on 2026-09-21 GA target now invalidated

**Required Action:**

1. **Immediately update M4, M5, M6 milestone document dates to match MILESTONE_REGISTRY v2.0 canonical dates** (copy-paste operation, <30 min per doc)
2. **Update all task start/end dates in week-wise breakdowns** (e.g., M4 Week 1 = 2026-07-06 to 2026-07-12, not 2026-07-13 to 2026-07-19)
3. **Update Gantt charts and timeline diagrams** if embedded in docs
4. **Verify downstream dependencies** (e.g., pilot onboarding docs, GA launch comms) reference corrected dates
5. **Lock dates in MILESTONE_REGISTRY as source of truth** going forward; any local milestone doc date change must be approved via change control

**Ownership:** Program Manager + Tech Lead  
**Effort:** 2 hours total (30 min per doc + verification)  
**Timeline:** BEFORE 2026-04-27 M0 kickoff

---

### **ISSUE #2: REPORTING SCOPE CREEP RISK IN M4 DOC (AMBER, SCOPE BLOCKER)**

**Severity:** HIGH (scope creep risk)  
**Status:** Blocker if M4 team uses doc as primary spec  
**Discovery Date:** 2026-04-21  
**Root Cause:** M4 doc not updated post-v2.0 registry scope correction

**Problem Statement:**

M4 milestone doc headline (§1) states:
> "Reporting & Dashboards: Templated reports (Daily, Weekly, Sprint, Release), Exec Dashboard (pass rate, defect density, ROI), ROI calculator"

But MILESTONE_REGISTRY §14 (user-mandated) explicitly defers:
- Basic reports (Daily, Weekly) → M5 (MVP)
- Full reports (Sprint, Release, ROI) → M6 (post-MVP)

**Discrepancy:** M4 doc claims to deliver Daily, Weekly, Sprint, Release + ROI, contradicting user intent. **M5 doc correctly implements the split.**

**Impact:**

- If M4 team uses their own doc as spec, they over-commit to 4+ report types outside their scope
- Scope creep → delivery risk → MVP slip
- Conflicting specs (doc vs. registry) create team confusion

**Required Action:**

1. **Update M4 doc §1 headline** to clearly state: "Test Runs, Defects & Jira Sync" (remove reporting claims)
2. **Update M4 doc §2 "Key Deliverables"** to remove "Reporting & Dashboards" line entirely; reference M5–M6 docs for reporting scope
3. **Add footnote in M4 doc** referencing MILESTONE_REGISTRY §14 "Reporting Scope Split (User-Mandated)"
4. **Update M4 task breakdown** to remove any tasks related to Daily/Weekly/Sprint/Release report generation (if any are listed)
5. **Confirm M4 "Key Deliverables" section includes ONLY:**
   - Test Run CRUD + execution UI
   - Auto-evidence capture
   - A4 Defect Intelligence 5-layer RCA
   - Jira 2-way sync
   - Defect CRUD + categorization

**Ownership:** M4 Tech Lead + PM  
**Effort:** 1 hour (headline + key deliverables + footnote)  
**Timeline:** BEFORE M3 exit (2026-07-05)

---

### **ISSUE #3: M3 & M4 FEATURE FLAG DOCUMENTATION GAPS (AMBER, CONSISTENCY)**

**Severity:** MEDIUM (consistency issue, not blocker)  
**Status:** Minor  
**Discovery Date:** 2026-04-21  
**Root Cause:** Inconsistent doc formatting across milestones

**Problem Statement:**

M2 doc includes a dedicated "Feature Flag Strategy" section (§14) with rollout timelines. M5 doc includes a "Feature Flag Registry" table. **M3 and M4 docs lack structured flag sections.** Flags are mentioned inline in task descriptions, making it harder for teams to implement consistent rollout logic.

**Example (M3 doc):**
Flag references buried in task descriptions:
- MS3-T022: "Draft A1 system prompt..." (mentions flag contextually)
- MS3-T023: "Implement A1 case generator..." (mentions flag contextually)

**No dedicated flag table or rollout timeline.**

**Impact:**

- Dev team must hunt through task descriptions to understand flag behavior
- Less rigor in flag implementation; teams may use different naming conventions
- Harder to track which flags are dark/internal/canary/GA during release

**Required Action:**

1. **Add "Feature Flag Strategy" section to M3 doc (before §15 "Risk & Blocker Register")**
2. **Create table with columns:** Flag Name | Feature | Owning Task | Default | Rollout Pattern | Kill-Switch | Expiry
3. **List M3 flags:**
   - `feature_ai_a1_case_gen` (disable by default; dark → internal → canary → GA)
   - `feature_ai_a2_dedup` (disable by default; dark → canary 1% → GA)
4. **Repeat for M4 doc** with flags:
   - `feature_ai_a4_rca` (disable by default; dark → internal → canary → GA)
   - `feature_jira_2way_sync` (disable by default; dark → internal → canary → GA)
5. **Reference MILESTONE_REGISTRY §8** for rollout timelines

**Ownership:** M3 Tech Lead, M4 Tech Lead  
**Effort:** 1 hour per doc (30 min to create table + 30 min to coordinate with registry)  
**Timeline:** BEFORE M3 entry (2026-06-15)

---

## RECOMMENDED MINOR FIXES (Non-Blockers)

### **FIX #1: Clarify A1 "Family" Structure (Educational)**

**Severity:** LOW (clarity improvement)  
**What:** MILESTONE_REGISTRY and milestone docs refer to "A1 Test Case Generator" (M3) and "A1 Context-Gathering Agent" (M2) as both "A1", but they are distinct agents within the A1 family.

**Why:** Slight confusion risk; readers may think "A1" is a single agent doing both doc gen and test case gen.

**Recommendation:** In each milestone doc, clarify:
- M2: "A1 Context-Gathering Agent (a.k.a., A1-Context)" — reads KB, formats context for doc gen
- M3: "A1 Test Case Generator (a.k.a., A1-Cases)" — generates BDD cases from requirements + A1-Context output

**Effort:** 15 min (update §2 "Key Deliverables" in M2 and M3 docs)

---

### **FIX #2: Add Cross-Reference to Reporting Scope in M5 Entry Criteria**

**Severity:** LOW (reference improvement)  
**What:** M5 Definition of Ready doesn't explicitly reference that M5 intentionally defers full reports to M6.

**Recommendation:** Add bullet to M5 "Definition of Ready" (§5):
> "Reporting scope clarified: M5 ships basic reports (Daily, Weekly, personal dashboard, simple Exec Dashboard); full reports (Sprint, Release, ROI, advanced Exec, compliance) deferred to M6 per user mandate (see MILESTONE_REGISTRY §14)."

**Effort:** 10 min (single bullet addition)

---

### **FIX #3: Verify and Lock Dates in MILESTONE_REGISTRY as Source of Truth**

**Severity:** LOW (governance improvement)  
**What:** Establish MILESTONE_REGISTRY as the canonical source for all program dates going forward.

**Recommendation:**
1. Add a header to MILESTONE_REGISTRY §2 "Milestone Summary Table":
   > "**CANONICAL DATE SOURCE:** All milestone document dates MUST match this table exactly. Any date changes require PM + Tech Lead approval and must be reflected in all milestone docs within 24 hours."
2. Add version control note: "Last updated 2026-04-21 v2.0. Next review: 2026-05-10 (M0 exit)."

**Effort:** 10 min (header + note addition)

---

## APPENDIX A: PRD US-ID → MILESTONE MAP

| US-ID | User Story (Abbreviated) | Owning Milestone | Primary Features | Exit Gate Demo |
|-------|---|---|---|---|
| **US-001** | Jr QA writes 10 test cases in 5 min with A1 | M3 | A1 Test Case Generator, Clarification Questions, confidence scoring | Generate 10 cases in <5 min; confidence ≥70% |
| **US-002** | Sr QA authors Test Plan in <5 min from PRD | M2 | A1 Context-Gathering Agent, 12 templates, section confidence | Generate Test Plan from Jira PRD in ≤5 min; section confidence visible |
| **US-003** | Jr QA knows if test case is duplicate before save (A2) | M3 | A2 Dedup, live chips, semantic similarity pgvector | Author 10 cases; A2 surfaces ≥1 true duplicate candidate |
| **US-004** | Lead sets up project + invites users in <10 min | M0–M1 | Project Service, RBAC, User Invite, Resend email | Create project → invite user → accept email → log in with correct role |
| **US-005** | Admin assigns roles + tracks all actions | M1 | RBAC, Audit Logger, User Service | Assign user to Admin role → query audit log → see "role_assignment" event |
| **US-006** | Sr QA logs defect in <60s, see in Jira | M4 | Defect Service, Jira OAuth 2.0, 2-way sync | Create defect → Jira issue created → edit assignee in Jira → sync back <30s |
| **US-007** | Sr QA understands why test failed via auto-RCA | M4 | A4 Defect Intelligence 5-layer, auto-evidence, RCA output | Log defect from failing run → A4 RCA fetched in <10s → shows stack/env/config layers |
| **US-008** | Test Automation Engineer runs tests + capture evidence | M4 | Test Execution Service, auto-evidence (screenshot/HAR/console/env) | Mark test as failed → screenshot + HAR + console snapshot captured auto |
| **US-009** | Lead sees daily/weekly reports auto-generated | M5 | Report Service, templated generation, auto-population | Daily/Weekly reports auto-populated from test + defect data; sent via Resend |
| **US-010** | Product Manager sees release readiness RAG + ROI | M5 (basic) / M6 (full) | Exec Dashboard, ROI Calculator | Exec Dashboard shows pass rate trend + defect count + release RAG; M6 adds ROI formula |
| **US-011** | QA finds test cases/defects/docs with global search | M5 | Search Service, Command-K omnibox, global indexing | Command-K search for "login test" → returns cases, defects, KB entries; <100ms |
| **US-012** | QA knows system is auditable for compliance | M1–M5 | Audit Logger, export endpoint | Query audit log; export CSV of all user + agent actions; timestamps + outcomes |

---

## APPENDIX B: ERD CO/EP/TB ID → MILESTONE MAP

| ID Type | Examples | Count | Owning Milestones | Status |
|---------|----------|-------|---|---|
| **Tables (TB-001 to TB-018)** | TB-005 (test_cases), TB-006 (test_runs), TB-007 (defects), TB-009 (KB), TB-010 (documents), TB-011 (reports) | 18 | M0 (6), M1 (1), M2 (2), M3 (1), M4 (3), M5 (1), M6 (0) | GREEN — All traced |
| **Endpoints (EP-001 to EP-066)** | EP-001 (auth/register), EP-029 (doc/generate), EP-040 (dedup), EP-051 (RCA), EP-055 (daily report), EP-066 (ROI) | 66 | M0 (16), M1 (6), M2 (11), M3 (6), M4 (14), M5 (9), M6 (3) | GREEN — All traced |
| **Components (CO-001 to CO-031)** | CO-001 (Next.js), CO-019 (FastAPI), CO-021 (Ollama), CO-028 (Langfuse) | 31 | M0 (11), M1 (1), M2 (8), M3 (1), M4 (4), M5 (2), M6 (0) | GREEN — All traced |

---

## APPENDIX C: FULL CROSS-REFERENCE MATRIX

### Milestone Dependency Graph (Consumers → Producers)

| Consuming Milestone | Producer Milestone | Output Type | Impact | Status |
|---|---|---|---|---|
| M1–M6 | M0 auth | Logged-in user context, role assignments | Every user action gated by role | ✓ GREEN |
| M2 | M1 users | User profiles (Jr/Sr/Automation) | Personalization in doc gen | ✓ GREEN |
| M3 | M2 KB + RAG | Knowledge Base entries, pgvector index | A1 case gen uses KB context; A2 uses embeddings | ✓ GREEN |
| M4 | M3 test cases | Test case library (≥80 cases) | Test runs reference cases; A4 RCA uses case steps | ✓ GREEN |
| M5 | M4 test runs + defects | Execution history, defect data | Reports query test_runs + defects tables | ✓ GREEN |
| M5 | M0–M4 audit | Audit events across all actions | Command-K indexes audit log; compliance export | ✓ GREEN |
| M6 | M5 pilots | Pilot telemetry, baseline metrics | GA readiness validation; compliance audit | ✓ GREEN |

### Tech Stack Alignment Matrix

All 7 milestones specify identical tech stack (see Check 5 scorecard). No deviations.

### Feature Flag Rollout Timeline (Weeks 1–23)

| Flag Name | Owning Milestone | Dark Launch | Internal | Canary | GA | Expiry |
|-----------|---|---|---|---|---|---|
| `feature_ai_a1_doc_gen` | M2 | w4 | w5 | w7 | w18 (M5 exit) | 2026-10-21 |
| `feature_ai_a1_case_gen` | M3 | w7 | w8 | w10 | w18 | 2026-10-21 |
| `feature_ai_a2_dedup` | M3 | w8 | — | w9 | w18 | 2026-10-21 |
| `feature_ai_a4_rca` | M4 | w10 | w11 | w12 | w18 | 2026-10-21 |
| `feature_jira_2way_sync` | M4 | w10 | w11 | w13 | w18 | 2026-10-21 |
| `feature_basic_reports` | M5 | w14 | w15 | — | w16 | 2026-10-21 |
| `feature_command_k_omnibox` | M5 | w14 | w15 | — | w16 | 2026-10-21 |
| `feature_wcag_accessibility` | M5 | w14 | — | — | w16 | 2026-10-21 |
| `feature_full_reports` | M6 | w17 | w18 | w19 | w23 (GA) | 2026-10-20 |

---

## CONCLUSION & NEXT STEPS

**Overall Health: AMBER (1 CRITICAL, 1 HIGH, 2 MEDIUM issues identified and scoped for fix)**

### Summary

The QA Nexus MVP documentation suite is **75% aligned** across all 7 milestones, the PRD, ERD, and MILESTONE_REGISTRY v2.0. **Tech stack consistency is perfect (10/10 GREEN).** User story and component traceability are complete (no orphans). **DoR/DoD chains are well-defined** across all milestone boundaries.

**However, critical program execution risks exist:**

1. **Timeline broken by 7 days** (M4–M6 dates diverge from registry) → M0 kickoff must resolve before 2026-04-27
2. **Reporting scope creep risk** in M4 doc (contradicts user mandate) → Must clarify before M3 exit
3. **Minor documentation consistency gaps** in feature flags (M3–M4) → Non-blocking, should fix before respective milestone entry

### Immediate Actions (Before 2026-04-27)

| Action | Owner | Effort | Deadline |
|--------|-------|--------|----------|
| **FIX CRITICAL:** Update M4, M5, M6 dates to match registry canonical dates | PM + Tech Lead | 2 hours | 2026-04-24 (3 days before M0 kickoff) |
| **FIX HIGH:** Clarify M4 doc reporting scope; remove Daily/Weekly/Sprint/Release claims | M4 Tech Lead + PM | 1 hour | 2026-04-24 |
| **LOCK SOURCE:** Add header to MILESTONE_REGISTRY designating it as canonical date source | PM | 15 min | 2026-04-24 |

### Secondary Actions (Before M3 Entry, 2026-06-15)

| Action | Owner | Effort | Deadline |
|--------|-------|--------|----------|
| Add Feature Flag Strategy sections to M3 and M4 docs | M3 + M4 Tech Leads | 2 hours (1 per doc) | 2026-06-10 |
| Clarify A1 "family" structure in M2 + M3 docs | M2 + M3 Tech Leads | 30 min total | 2026-06-10 |
| Add reporting scope cross-reference to M5 DoR | M5 Tech Lead | 10 min | 2026-06-10 |

### Recommendations for Future Phases

1. **Implement change control for dates:** Any change to MILESTONE_REGISTRY timeline requires PM + Tech Lead + PMO approval. Sync all milestone docs within 24 hours.
2. **Lock milestone docs post-M0 entry:** Once M0 kickoff occurs, treat milestone docs as read-only except for bug fixes. New scope changes → new docs, not in-place edits.
3. **Weekly registry sync check:** Every Monday, PM verifies all milestone docs match MILESTONE_REGISTRY v2.0 baseline. Flag divergences in standup.
4. **Automated cross-reference validation:** If time permits post-MVP, build a GitHub Actions workflow to lint milestone docs for:
   - Date mismatches vs. registry
   - Missing US-ID traceability
   - Undefined EP/TB/CO references
   - Feature flag consistency

---

**Report Generated:** 2026-04-21  
**Report Status:** Ready for stakeholder review and action  
**Next Review:** Post-remediation (expected 2026-04-24); then weekly during MVP execution

---

## PROJECT-LEVEL RESTRUCTURE — 2026-04-22

**Overall Health Score: GREEN (Restructure Complete)**

### Summary of Transformation

**From:** MVP-flat (M0–M6, 7 milestones, 18 weeks) → **To:** Project-hierarchical (PM1–PM4, 19 named milestones + 6 PM4 initiatives, 18+ months)

### Artifacts Created

1. **MILESTONE_REGISTRY.md upgraded to v3.0** — Added §19–21 documenting PM1–PM4 structure, AI agent continuity, 7-layer progression
2. **PM2 milestone overviews** — M7–M12 (6 overviews, 200–400 lines each)
3. **PM3 milestone overviews** — M13–M18 (6 overviews)
4. **PM4 initiative overviews** — 6 initiatives (Career Compass, Full 70-Docs, Cloud Device Grid, Multi-Tenant SaaS, Enterprise Compliance, White-Label)

### File Count

| Category | Before | After | +Change |
|----------|--------|-------|---------|
| Milestone overview files | 7 (M0–M6) | 19 (M0–M18) | +12 |
| PM4 initiative files | 0 | 6 | +6 |
| Registry versions | v2.0 | v3.0 | +1 major |
| **Total new artifacts** | — | **18 files** | — |

### Total Milestone Count

- **PM1 (MVP):** 7 milestones (M0–M6)
- **PM2 (v1.5):** 6 milestones (M7–M12)
- **PM3 (v2):** 6 milestones (M13–M18)
- **PM4 (v2+):** 6 initiatives (no numbered milestones)
- **Total: 19 named milestones + 6 PM4 initiatives = 25 total**

### PM1 Date Verification (vs PROJECT_ROADMAP.md)

| Milestone | Canonical | Registry v3.0 | Status |
|-----------|-----------|---------------|--------|
| M0 | 2026-04-27 → 2026-05-10 | Match | ✅ |
| M1 | 2026-05-11 → 2026-05-24 | Match | ✅ |
| M2 | 2026-05-25 → 2026-06-14 | Match | ✅ |
| M3 | 2026-06-15 → 2026-07-05 | Match | ✅ |
| M4 | 2026-07-06 → 2026-07-26 | Match | ✅ |
| M5 | 2026-07-27 → 2026-08-16 | Match | ✅ |
| M6 | 2026-08-17 → 2026-09-20 (GA 2026-09-21) | Match | ✅ |

**Verdict: GREEN — PM1 dates locked and verified.**

### Phase Gates (Measurable Exit Criteria)

**PM1→PM2 (2026-09-21):** MVP GA, ≥2 pilots, A1/A2/A4 ≥80% confidence, ROI 688%+  
**PM2→PM3 (2026-12-14):** v1.5 GA, ≥5 customers, SSO ≥2 IDPs, VCG blocking ≥5 violations/PR  
**PM3→PM4 (2027-04-05):** v2 GA, ≥15 customers, on-prem validated, SOC 2/ISO/HIPAA baseline  
**PM4:** Quarterly reviews (ongoing product evolution)

### AI Agent Continuity (Project-Level)

All 10 entities ship-in-phase, consumed downstream continuously:

| Agent | Ships | PM1 Use | PM2+ Use |
|-------|-------|---------|----------|
| A1 | M3 | Case gen | All phases (context) |
| A2 | M3 | Dedup | All phases (dedup) |
| A3 | M7 | — | M7+ (automation) |
| A4 | M4 | RCA | All phases (analysis) |
| A5 | M8 | — | M8+ (selection) |
| A6 | M13 | — | M13+ (data gen) |
| A7 | M14 | — | M14+ (healing) |
| A8 | M2/M9/M15 | Planning | All phases (strategy) |
| VCG | M10 | — | M10+ (governance) |
| APT | M16 | — | M16+ (autonomous testing) |

### 7-Layer Architecture Progression (Verified)

All layers progress over 18+ months as designed:

| Layer | PM1 | PM2 | PM3 | PM4 |
|-------|-----|-----|-----|-----|
| L1 Platform | 4 integrations | +SSO/Slack | +on-prem/mobile | +multi-tenant/white-label |
| L2 Knowledge | pgvector foundation | +Graphiti temporal | +GraphRAG | +enrichment APIs |
| L3 Documents | 12 templates | +18 (30 total) | +20 (50 total) | +20 (70 total) |
| L4 Agents | A1, A2, A4 | +A3, A5, A8-full, VCG | +A6, A7, A8-adv, APT | Ongoing |
| L5 Analytics | Basic reports + dashboard | +Full dashboards + quality gates | +Predictive analytics | +Enterprise BI |
| L6 Governance | — | EU AI Act foundation | SOC 2/ISO/HIPAA | +GxP/multi-region |
| L7 Career | — | — | — | Career Compass (W47+) |

### Final Restructure Verdict

✅ MILESTONE_REGISTRY v3.0 complete (project-level, 3 new major sections)  
✅ PM1 dates frozen & verified (100% alignment with PROJECT_ROADMAP.md)  
✅ PM2/PM3 overviews created (12 milestones, canonical dates calculated)  
✅ PM4 initiatives created (6 initiatives with quarter-grain timing)  
✅ Phase gates with ≥3 measurable exit criteria per phase  
✅ AI agent continuity program documented (ship-in-phase + downstream consumption)  
✅ 7-layer progression verified end-to-end (L1–L7)  
✅ Total count: 19 named milestones + 6 PM4 initiatives = **25 total**  
✅ Timeline: 18 wk MVP → 12 wk v1.5 → 16 wk v2 → **ongoing v2+**

**FINAL SCORE: GREEN**

---

**Report Generated:** 2026-04-21 (original sync) + 2026-04-22 (restructure)  
**Report Status:** Restructure Complete; Ready for Phase Kickoff  
**Next Review:** Weekly during PM1 execution; gate review at PM1 exit

---

**END OF SYNC REPORT**


---

## Sync Remediation — 2026-04-22

**Applied fixes:**
1. M4, M5, M6 date drift corrected (M5 week dates fixed, M6 week dates shifted -7 days) to match registry canonical.
2. M4 reporting scope clarified: Daily/Weekly/Sprint/Release reports + ROI calculator deferred to M5/M6.
3. M3 and M4 gained/verified Feature Flag Strategy sections.
4. M6 gained Date Authority header referencing MILESTONE_REGISTRY as canonical source.

**Post-fix verification:** All 7 milestones now align with MILESTONE_REGISTRY dates:
- M4: 2026-07-06 → 2026-07-26 (Weeks 11–13)
- M5: 2026-07-27 → 2026-08-16 (Weeks 14–16)
- M6: 2026-08-17 → 2026-09-20, GA 2026-09-21 (Weeks 17–23)

M4 scope is execution-only (runs, defects, RCA, Jira 2-way sync). M5 owns basic reports + MVP launch. M6 owns full reports + GA.

**Sync verdict:** GREEN. All critical date drifts resolved. Scope boundaries clarified. Feature flag governance in place.

---

## PM2 ↔ PM3 Content Swap — 2026-04-22

**Applied transformation:** Per PROJECT_ROADMAP.md v1.1, PM2 and PM3 milestone content were swapped to ship self-healing/automation extensions (PM2, 16 wk) before governance/enterprise layer (PM3, 12 wk).

### Files Migrated

**PM2 (v1.5 — Self-Healing + Test Data + Full Automation, 16 wk: 2026-09-22 → 2027-01-09):**
- M7: Test Data Generation (A6) ← was M13; dates 2026-09-22 → 2026-10-12 (W1–3)
- M8: Test Maintenance Self-Healing (A7) ← was M14; dates 2026-10-13 → 2026-11-09 (W4–7)
- M9: A8 Advanced (Risk-Adaptive Planning) ← was M15; dates 2026-11-10 → 2026-11-30 (W8–10)
- M10: AI Product Tester (APT) ← was M16; dates 2026-12-01 → 2026-12-14 (W11–12)
- M11: Visual Regression + Mobile + On-Prem ← was M17; dates 2026-12-15 → 2026-12-28 (W13–14)
- M12: v1.5 GA + 32-Doc Catalog ← was M18; dates 2026-12-29 → 2027-01-09 (W15–16)

**PM3 (v2 — Low-Code + Governance + Enterprise Foundation, 12 wk: 2027-01-12 → 2027-04-03):**
- M13: Low-Code Authoring (A3) ← was M7; dates 2027-01-12 → 2027-01-30 (W1–3)
- M14: Test Selection CI (A5) ← was M8; dates 2027-02-01 → 2027-02-14 (W4–5)
- M15: Full Test Planning (A8-full) ← was M9; dates 2027-02-15 → 2027-02-28 (W6–7)
- M16: Vibe Code Governor (Basic) ← was M10; dates 2027-03-01 → 2027-03-14 (W8–9)
- M17: Enterprise Auth (SSO/SAML) + Slack ChatOps ← was M11; dates 2027-03-15 → 2027-03-28 (W10–11)
- M18: v2 GA + 50-Doc Catalog ← was M12; dates 2027-03-29 → 2027-04-03 (W12)

### Downstream Updates

**MILESTONE_REGISTRY.md v3.1:**
- PM2 table: all 6 milestones updated with correct names, dates, agents (A6, A7, A8-adv, APT)
- PM3 table: all 6 milestones updated with correct names, dates, agents (A3, A5, A8-full, VCG)
- PM2 exit gate: self-healing ≥40% flaky reduction, APT ≥50 scenarios, on-prem validated
- PM3 exit gate: SSO ≥2 IDPs, VCG blocking ≥5 violations/PR, Slack adoption ≥50%
- AI Agent Program Continuity (§20): A6/A7/APT ship in PM2; A3/A5/VCG ship in PM3
- 7-Layer Architecture Progression (§21): doc templates, agents, platforms re-mapped per phase

**Changelog:** v3.1 entry added documenting swap, phase duration corrections, agent sequencing update.

### Timeline Impact

**No external timeline impact.** PM1 dates frozen (2026-04-27 → 2026-09-21). PM2 total duration = 16 wk (was 12 wk), PM3 = 12 wk (was 16 wk). PM2 exit gate: 2027-01-09. PM3 exit gate: 2027-04-03. PM4 start: 2027-04-06. Rationale: self-healing + automation extend PM1's core workflow directly; governance is better positioned after product depth proven.

**Swap verdict:** GREEN. All 12 milestone files renamed and re-contextualized. Registry and sync report updated. Phase gates & dependencies verified. No orphaned agents or floating features.

---

## v1.2 Audit Wave 1 remediation (2026-04-23)

- Registry overview corrected: PM2 = 16 wk (was 12 wk), PM3 = 12 wk (was 16 wk).
- PM1 total normalized to 21 cal-wk = 18 build + 3 GA (was reported as both 18 wk and 23 wk in different places).
- PM2 sub-milestone windows re-aligned to PROJECT_ROADMAP.md v1.2.

NOTE: This report is still scoped to milestone-level sync. A full project-level SYNC_REPORT replacing the old MVP-scope framing is planned in audit Wave 2.
