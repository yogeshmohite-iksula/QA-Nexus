# QA Nexus — Project Documentation Audit Report

**Date:** 2026-04-23  
**Scope:** Project-level documentation only (`PM1` → `PM4`)  
**Mode:** Audit first, no source-document rewrites in this phase  
**Excluded by request:** `MVP_PRD.*`  
**Audit basis:** Markdown and DOCX treated as equally authoritative where both exist

---

## 1. Executive Summary

### Overall Verdict

**Status: RED for execution sync, AMBER for strategic completeness.**

The QA Nexus documentation suite has a strong underlying product vision, a rich source corpus, and a mostly-correct project-level roadmap. However, the **project execution documents are not yet fully synchronized**. The biggest issues are not cosmetic:

1. **Phase sequencing drift** still exists across the project PRD, ERD, milestone registry overview, and older context docs after the `PM2` / `PM3` swap.
2. **ERD traceability is not safe to treat as engineering truth yet** because table IDs, phase ownership, migration sequencing, and component groupings conflict with the roadmap and milestone registry.
3. **Milestone depth collapses sharply after `M6`**, so the later project phases are not yet execution-ready at the same standard as the MVP phase docs.
4. **Timeline math is inconsistent** for `PM1`, which currently appears as **18 weeks**, **21 weeks**, and **23 weeks** depending on which document is read.
5. **Project context docs are not aligned in maturity**: `PROJECT_ROADMAP.md` is the cleanest canonical document, while `project_analysis.md`, `QA_Nexus_Master_Brainstorm.md`, `SYNC_REPORT.md`, and `FINAL_REVIEW.md` still carry MVP-era or pre-swap assumptions.

### Bottom-Line Assessment

- The **source corpus is rich enough** to support a coherent project-level program.
- The **project roadmap is close to the correct canonical backbone**.
- The **PRD is leadership-ready in structure but not yet fully phase-synchronized**.
- The **ERD is the highest-risk document** and should not be used as-is for implementation traceability.
- The **milestone suite is only execution-ready through `M6`**; most later milestones and all PM4 initiatives need deeper engineering decomposition.

---

## 2. Blockers

| Severity | Finding | Why it matters |
|---|---|---|
| `P0` | `PM2` / `PM3` sequencing is still inconsistent across project documents | Teams can build the wrong phase in the wrong order |
| `P0` | `ERD.md` table/component/phase mappings conflict with roadmap and registry | Engineering, API design, and DB planning can diverge immediately |
| `P1` | `PM1` duration math is inconsistent (`18w` vs `21w` vs `23w`) | Staffing, sprint planning, and milestone commitments become unreliable |
| `P1` | `M7`–`M18` and all `PM4` initiative docs are not execution-ready | Later phases cannot be estimated or built confidently |
| `P1` | `M4` and `M6` milestone docs contain wrong predecessor context | Handoffs and dependency assumptions are already drifting |
| `P1` | `project_analysis.md`, `SYNC_REPORT.md`, and `FINAL_REVIEW.md` are stale at project level | Downstream teams can cite outdated documents as authority |
| `P2` | DOCX parity is poor for milestone docs and has packaging issues in `PRD.docx` | Leadership and delivery teams may review materially different artifacts |

---

## 3. Scope and Inputs Reviewed

### Source Folders Treated as Input Truth

1. `QA nexus MVP/AI based QA Platform`
2. `QA nexus MVP/test case management/test case management`
3. `QA nexus MVP/testcase_generation&test Automation/TestCaseGeneration&TestAutomation`

### Project-Level Documents Audited

- `QA_Nexus_Master_Brainstorm.md`
- `project_analysis.md`
- `PROJECT_ROADMAP.md`
- `PRD/PRD.md`
- `PRD/PRD.docx`
- `ERD/ERD.md`
- `ERD/ERD.docx`
- `Milestone/MILESTONE_REGISTRY.md`
- `Milestone/SYNC_REPORT.md`
- `Milestone/FINAL_REVIEW.md`
- all milestone docs `M0`–`M18`
- all `PM4` initiative docs

### Source Corpus Interpretation Rules

- **Core project truth:** product/program information that should flow into roadmap, PRD, ERD, and milestones
- **MVP-only truth:** valid for PM1 only; should not be projected across the full program
- **Future-phase truth:** valid for PM2–PM4 but must be phase-tagged correctly
- **External benchmark/reference only:** competitive inspiration, UI patterns, or market framing, not canonical product truth

---

## 4. Canonical Concept Inventory

| Concept | Classification | Source Evidence | Audit conclusion |
|---|---|---|---|
| Product vision: AI-native operating system for QA | Core project truth | `QA_Nexus_Brainstorm.md`, `QA_Nexus_Platform_Vision.md`, `QA_Nexus_Solution_Design.md` | Present across the project suite |
| Personas and JTBD hierarchy | Core project truth | `QA_Nexus_Platform_Vision.md`, `QA_Roles_Documents_Reference_Guide.md`, `04_UI_UX_Design_Document.md` | Present, but some persona-to-phase mappings drift in PRD |
| 17-problem framework | Core strategic truth | `QA_Nexus_Brainstorm.md`, `QA_Nexus_Problem_Statement_FINAL.md`, `QA_Nexus_Solution_Design.md` | Present in brainstorm/analysis, largely omitted from roadmap by design |
| 7-layer architecture | Core project truth | `QA_Nexus_Brainstorm.md`, `QA_Nexus_Solution_Design.md`, `01_Test_Management_and_Optimization.md` | Present across roadmap/PRD/ERD, but phase progression is not consistently applied |
| Document catalog progression `12 → 32 → 50 → 70` | Core project truth | `QA_Nexus_Solution_Design.md`, `QA_Roles_Documents_Reference_Guide.md`, test management specs | Present and mostly stable |
| AI agent catalog (`A1`–`A8`, `VCG`, `APT`) | Core project truth | source brainstorm + test management + automation specs | Present, but project docs still disagree on ship phases |
| Reporting / analytics / ROI surfaces | Core project truth | `02_Test_Reporting_and_Analytics.md` | Present, but milestone execution detail is uneven after PM1 |
| Automation hub / Playwright / multi-framework / device grid | Core project truth for PM1+ | `03_Automation_Playwright.md` | Present, but PM2/PM4 milestones are too shallow |
| On-prem, mobile, visual regression, APT | Future-phase truth (`PM2`) | source automation and solution-design docs | Canonical in roadmap; drift persists in PRD/ERD/support docs |
| Low-code authoring, test selection, SSO/SAML, Slack ChatOps, EU AI Act foundation | Future-phase truth (`PM3`) | source brainstorm + test management + UI/UX docs | Canonical in roadmap; drift persists elsewhere |
| Career Compass, multi-tenant SaaS, full 70-doc catalog, white-label, advanced compliance | Future-phase truth (`PM4`) | platform vision, future outlook, solution design | Present conceptually, but PM4 execution docs are only high-level shells |
| BrowserStack module/UI docs | External benchmark/reference only | 6 BrowserStack DOCX files | Useful inspiration only; should not be treated as QA Nexus truth |
| Market sizing, fear-crisis, salary-gap, ROI claims | Supporting strategy/reference | market research docs and brainstorms | Useful for pitch framing, but should be clearly qualified when used in PRD |

### BrowserStack Corpus Conclusion

The BrowserStack documents are valuable for:

- AI-agent taxonomy inspiration
- automation and low-code workflow patterns
- reporting and UI pattern benchmarking
- terminology and module naming ideas

They should **not** be treated as canonical QA Nexus scope, roadmap, or ERD truth.

---

## 5. Source-to-Consolidated Coverage Matrix

| Source concept | `QA_Nexus_Master_Brainstorm.md` | `project_analysis.md` | `PROJECT_ROADMAP.md` | Audit note |
|---|---|---|---|---|
| Product vision / positioning | Strong | Strong | Present | Good coverage |
| 17-problem framework | Strong | Present | Omitted | Acceptable omission in roadmap |
| 7-layer architecture | Strong | Strong | Strong | Good coverage |
| Project-level PM1–PM4 framing | Partial | Weak | Strong | Roadmap is canonical; other docs lag |
| PM2 = self-healing/test-data/on-prem/mobile | **Outdated** | Weak / MVP-centric | Strong | Key sequencing gap |
| PM3 = low-code/governance/enterprise foundation | **Outdated** | Weak / MVP-centric | Strong | Key sequencing gap |
| 10 AI entities (`A1`–`A8`, `VCG`, `APT`) | Partial / outdated ship tags | Partial | High-level only | Needs one canonical program table reused everywhere |
| 70-doc catalog progression | Strong | Present | Strong | Stable |
| Reporting / analytics / ROI module depth | Medium | Medium | High-level | Needs stronger translation into milestone detail after PM1 |
| Automation / grid / mobile / visual regression | Present but old ordering | Present | Strong | Roadmap correct, supporting docs mixed |
| SSO/SAML / Slack ChatOps / EU AI Act foundation | Present but old ordering | Present but shallow | Strong | Needs synchronized phase labels |
| Career intelligence / PM4 expansion | Strong | Present | Strong | PM4 docs too shallow to operationalize |

### Coverage Assessment

- `QA_Nexus_Master_Brainstorm.md` remains the **best broad narrative source**, but it still carries **pre-swap post-MVP sequencing**.
- `project_analysis.md` is the **least reliable project-level context doc** because it is still framed as **MVP pre-PRD analysis**.
- `PROJECT_ROADMAP.md` is the **cleanest project-level backbone** and should remain the top canonical anchor.

---

## 6. Detailed Findings

### 6.1 `QA_Nexus_Master_Brainstorm.md`

#### What is good

- Strong strategic framing, personas, JTBDs, problem-market context, architecture, and document/agent vision.
- Still the richest narrative bridge between product story and platform shape.

#### Gaps / Inconsistencies

| Severity | Reference | Finding | Impact | Recommended fix |
|---|---|---|---|---|
| `P1` | `QA_Nexus_Master_Brainstorm.md:761-767` | Post-MVP waves still reflect the **old** order: `v1.5` = low-code/governance and `v2` = self-healing/data/on-prem/mobile | Conflicts with the current project roadmap and can reintroduce wrong phase assumptions | Update the post-MVP waves to match `PROJECT_ROADMAP.md v1.1` |
| `P2` | `QA_Nexus_Master_Brainstorm.md:360-366` | Agent ship labels are outdated: `A6/A7` still shown as `v2`, `VCG`/`APT` shown as `v2+` | Agent program continuity is no longer canonical | Replace with a single current agent program table aligned to roadmap |
| `P2` | `QA_Nexus_Master_Brainstorm.md:757, 816, 862` | Older pitch claims such as `688%-class ROI` remain stated without qualification | Fine for ideation, risky if copied into executive docs | Mark as hypothesis / benchmark unless externally validated |

#### Assessment

`QA_Nexus_Master_Brainstorm.md` should remain in the suite, but it must be treated as a **strategic master narrative**, not a phase-canonical execution document, until the post-MVP sections are refreshed.

---

### 6.2 `project_analysis.md`

#### What is good

- Good source inventory.
- Good summary of early MVP decisions and source materials.

#### Gaps / Inconsistencies

| Severity | Reference | Finding | Impact | Recommended fix |
|---|---|---|---|---|
| `P1` | `project_analysis.md:1-6` | The document is explicitly titled and framed as **MVP** and **pre-PRD analysis** | Not suitable as a project-level context spine anymore | Reissue as `project_analysis_project_level.md` or rewrite current file for PM1–PM4 |
| `P1` | `project_analysis.md:16-18` | It still points to `PLAN_v2.md` as canonical and tells readers not to use `PRD.docx` as canonical | This predates the current project-level doc hierarchy | Replace with current canonical chain: `PROJECT_ROADMAP` → `PRD` → `ERD` → Milestones |
| `P1` | `project_analysis.md:147-192` | Scope is still MVP-only with deferred features described using old post-MVP ordering | Causes project-level planning drift | Expand to project scope and phase-correct all deferred features |
| `P2` | `project_analysis.md:141-143` | Market / regulatory claims are stated as direct facts without present validation notes | Fine for analysis, risky if reused in executive docs | Add “source date / verification needed” annotation column |

#### Assessment

This document currently behaves like an **archival MVP working paper**, not an authoritative project-level analysis artifact.

---

### 6.3 `PROJECT_ROADMAP.md`

#### What is good

- This is the **strongest and most internally coherent project-level document** in the suite.
- The `PM2` / `PM3` swap is explicit and clearly justified in `PROJECT_ROADMAP.md:21-27`.
- PM2 and PM3 sub-milestone structures are clearly laid out in `PROJECT_ROADMAP.md:83-113`.

#### Gaps / Inconsistencies

| Severity | Reference | Finding | Impact | Recommended fix |
|---|---|---|---|---|
| `P1` | `PROJECT_ROADMAP.md:35`, `PROJECT_ROADMAP.md:71-77` | `PM1` is labeled **18 wk**, but its listed sub-milestones sum to **21 weeks**, and the calendar range `2026-04-27 → 2026-09-21` spans ~21.1 weeks | Creates planning and staffing ambiguity | Decide whether `PM1` is 18, 21, or “18 core + 3 GA wrap-up”; then normalize all docs |
| `P2` | `PROJECT_ROADMAP.md` overall | It is canonical, but there is no explicit downstream reconciliation checklist for PRD / ERD / Milestone suite versions | Future sync drift is likely | Add a small “documents that must be updated when roadmap changes” section |

#### Assessment

`PROJECT_ROADMAP.md` should remain the top canonical source, but the **PM1 duration arithmetic must be corrected**.

---

### 6.4 `PRD/PRD.md` and `PRD/PRD.docx`

#### Strengths

- Strong leadership-oriented structure.
- Covers program overview, personas, layers, FR/NFR, roadmap, risks, and metrics.
- Broadly aligned with roadmap at the top-level phase table (`PRD/PRD.md:37-42`, `PRD/PRD.md:69-74`).

#### Material Gaps / Inconsistencies

| Severity | Reference | Finding | Impact | Recommended fix |
|---|---|---|---|---|
| `P0` | `PRD/PRD.md:84-95` | Persona phase mappings are wrong after the swap: Senior QA still uses `A7` in `PM3`, Automation Engineer uses `A3/A5` in `PM2`, CTO uses governance dashboard in `PM2+` | Personas imply the wrong rollout order | Re-phase persona tooling references to match roadmap |
| `P0` | `PRD/PRD.md:431-435` | Layer 1 progression is reversed: `PM2` shows `SSO/SAML` + Slack ChatOps, while `PM3` shows mobile + on-prem | Conflicts with roadmap and milestone suite | Swap these phase labels |
| `P0` | `PRD/PRD.md:462-465` | Layer 4 progression is reversed: `PM2` shows `A3/A5/VCG`, while roadmap places them in `PM3` | High-risk requirements drift | Replace with roadmap-correct agent sequence |
| `P0` | `PRD/PRD.md:483-485` | Compliance layer progression is also phase-shifted | Governance/compliance rollout may be planned incorrectly | Re-map `PM3` vs `PM4` compliance levels |
| `P0` | `PRD/PRD.md:511-525` | Sample user stories still allocate low-code/test-selection to `PM2` and self-healing/test-data/on-prem to `PM3` | User-story traceability is phase-wrong | Re-tag sample user stories |
| `P1` | `PRD/PRD.md:39`, `PRD/PRD.md:71` | `PM1` duration still shows `18 wk` while sub-milestone structure elsewhere implies ~21 weeks | Planning ambiguity persists inside PRD | Normalize duration arithmetic |
| `P1` | `PRD/PRD.md:328-355` | FR numbering jumps from `FR-045` to `FR-050` with no explanation | Traceability quality is weakened | Either restore `FR-046`–`FR-049` or explicitly retire those IDs |
| `P2` | `PRD/PRD.md:46-59` | Market, security, salary-gap, and profession-fear claims are stated strongly and could be read as fully-validated | Fine for narrative context, risky in formal executive review | Mark as benchmark / market context unless cited in appendix |
| `P2` | `PRD/PRD.docx` first paragraph | DOCX packaging includes YAML/frontmatter bleed at the top | Leadership-facing Word artifact looks unpolished | Regenerate DOCX from cleaned markdown frontmatter handling |

#### PRD Parity Result

- `PRD.md` and `PRD.docx` are **broadly content-aligned**.
- The main parity issue is **presentation packaging**, not a major content split.
- Heading counts are close enough (`68` markdown headings vs `69` DOCX headings), but the DOCX opening paragraph needs cleanup.

#### Assessment

The project PRD is **structurally strong but not fully phase-safe yet**. It is close to executive quality, but it should not be treated as the authoritative phase model until the swap-related drift is removed.

---

### 6.5 `ERD/ERD.md` and `ERD/ERD.docx`

#### Strengths

- Broad technical ambition is strong: data model, services, APIs, AI agents, deployment, migrations, and risk sections all exist.
- Covers PM1 through PM4 domains, not just MVP.

#### Critical Gaps / Inconsistencies

| Severity | Reference | Finding | Impact | Recommended fix |
|---|---|---|---|---|
| `P0` | `ERD/ERD.md:107-121` | PM2 and PM3 service groups are reversed: `PM2` contains low-code / test selection / VCG / Slack / compliance, while `PM3` contains synthetic data / self-heal / mobile / on-prem / APT | Engineering teams can build the wrong component set in the wrong phase | Rebuild the service-group architecture section from roadmap |
| `P0` | `ERD/ERD.md:827-914`, `ERD/ERD.md:917-993` | PM2 and PM3 table blocks are reversed in the SQL section for the same reason | DB planning is phase-wrong | Re-phase all PM2/PM3 table blocks |
| `P0` | `ERD/ERD.md:2357-2382` | Migration sequencing is also reversed: `PM1→PM2` is labeled SSO/governance, `PM2→PM3` is labeled on-prem support | Downstream data-migration planning is misordered | Rewrite migration section to match canonical phase order |
| `P0` | `ERD/ERD.md:203-206`, `ERD/ERD.md:368-371`, `MILESTONE_REGISTRY.md:234-241` | Table IDs are reused or mapped differently across docs: registry says `TB-005=test_cases`, `TB-006=test_runs`, `TB-007=defects`, `TB-009=KB`, `TB-010=documents`, `TB-011=reports`; ERD remaps several of these differently | Breaks DB traceability, API references, and milestone ownership | Reconcile ERD table IDs against one canonical TB registry |
| `P0` | `ERD/ERD.md:412`, `ERD/ERD.md:807-820` | File claims core entities are `TB-001` through `TB-048`, but later introduces `TB-050` and `TB-051` | Numbering scheme is not trustworthy | Either extend declared range or renumber consistently |
| `P1` | `ERD/ERD.md:1662`, `ERD/ERD.md:1776`, `ERD/ERD.md:1910`, `ERD/ERD.md:1963` | Later agent sections are internally inconsistent: `A3/A5/VCG` are marked `PM2`, while top architecture maps them to `PM3`; `APT` is `PM2-PM4` | Internal ERD logic is self-contradictory | Normalize all agent section phase tags |
| `P1` | `ERD/ERD.md:1746`, `ERD/ERD.md:1846-1849`, `ERD/ERD.md:1918-1935` | Stray generated comments remain in the doc (`# Similar for...`, `# User clicks...`, `# Max nested loop depth...`) | Makes the ERD look partially generated and not fully reviewed | Remove generation artifacts and convert any needed examples into prose |
| `P2` | `ERD/ERD.md:186` | `Qdrant migration path` appears without matching canonical support in the main project backbone | Tooling direction becomes ambiguous | Clarify whether Qdrant is exploratory only or planned |

#### ID Hygiene Check

Observed in `ERD.md`:

- `TB` range spans `001` to `051` but only `48` unique IDs are consistently represented
- missing `TB` IDs inside the span: `012`, `037`, `049`
- `CO-005` is absent from the component sequence
- multiple `TB`, `CO`, `EP`, and `ADR` references are repeated in prose, which is acceptable, but the **entity-to-meaning mapping is not stable enough**

#### ERD Parity Result

- `ERD.md` and `ERD.docx` are **closer than the milestone pairs**, but parity is not perfect.
- Heading structure is flattened in DOCX (`96` markdown headings vs `75` DOCX headings).
- The bigger issue is not DOCX formatting; it is the **underlying content drift in ERD.md itself**.

#### Assessment

`ERD.md` is currently the **highest-risk artifact in the project suite**. It has strong coverage breadth, but it is **not yet reliable enough to serve as engineering truth** until phase order, ID mapping, and migration logic are reconciled.

---

### 6.6 Milestone Suite

Reviewed:

- `MILESTONE_REGISTRY.md`
- `SYNC_REPORT.md`
- `FINAL_REVIEW.md`
- milestone docs `M0`–`M18`
- all `PM4` initiative docs

#### 6.6.1 `MILESTONE_REGISTRY.md`

| Severity | Reference | Finding | Impact | Recommended fix |
|---|---|---|---|---|
| `P0` | `MILESTONE_REGISTRY.md:16-19` vs `MILESTONE_REGISTRY.md:740-772` | Registry overview still says `PM2=12 weeks` and `PM3=16 weeks`, but later sections correctly use the swapped structure (`PM2=16`, `PM3=12`) | Same document provides conflicting phase truth | Update the overview section immediately |
| `P1` | `MILESTONE_REGISTRY.md:54-62` | Registry states `7 milestones (M0–M6) in 23 weeks total`, but the listed durations sum to `21 weeks` | PM1 duration math is inconsistent even inside the registry | Normalize PM1 duration logic |
| `P1` | `MILESTONE_REGISTRY.md:744-749` vs `PROJECT_ROADMAP.md:89-94` | PM2 milestone date windows differ from roadmap by up to weeks | Creates ambiguity for planning and staffing | Align registry milestone windows to roadmap or explicitly supersede roadmap with a new version |

#### 6.6.2 `SYNC_REPORT.md`

| Severity | Reference | Finding | Impact | Recommended fix |
|---|---|---|---|---|
| `P1` | `SYNC_REPORT.md:1-6` | Still framed as **MVP** and scoped only to `M0–M6`, PRD, ERD, registry | Not a trustworthy project-level sync report anymore | Replace with a new full-program sync report |
| `P1` | `SYNC_REPORT.md:20-30` | Still claims M4–M6 date drifts that are no longer the main issue after restructuring | This report is stale and misleading | Archive or replace |
| `P1` | `SYNC_REPORT.md:993-1031` | Later section says the PM2/PM3 swap is complete and green, but other project docs still contradict it | Report overstates actual sync health | Rewrite after real full-suite audit |

#### 6.6.3 `FINAL_REVIEW.md`

| Severity | Reference | Finding | Impact | Recommended fix |
|---|---|---|---|---|
| `P1` | `FINAL_REVIEW.md:1-29` | Still evaluates the **MVP documentation suite** rather than the full project-level suite | Leadership could mistake this for current whole-program readiness | Replace with a project-level final review after sync fixes |

#### 6.6.4 Milestone Depth and Execution Readiness

Execution-readiness rubric used:

1. Context
2. Scope
3. Tasks
4. API/contracts
5. DB changes
6. Tests
7. Risks
8. Rollback
9. Exit criteria
10. Cross-milestone handoff

##### Milestone Completeness Table

| Doc | Lines | Completeness Score | Missing Dimensions |
|---|---:|---:|---|
| `M0/Milestone_M0_Setup.md` | 1052 | `10/10` | — |
| `M1/Milestone_M1_Users_Roles.md` | 1266 | `10/10` | — |
| `M2/Milestone_M2_Docs_KB.md` | 1173 | `10/10` | — |
| `M3/Milestone_M3_Test_Cases_AI.md` | 1437 | `10/10` | — |
| `M4/Milestone_M4_Runs_Defects_Jira.md` | 1148 | `10/10` | — |
| `M5/Milestone_M5_Automation_Basic_Reports_MVP_Launch.md` | 1627 | `10/10` | — |
| `M6/Milestone_M6_Full_Reports_GA.md` | 997 | `10/10` | — |
| `M7/Milestone_M7_Test_Data_Generation.md` | 75 | `2/10` | Context, Tasks, API, DB, Tests, Risks, Rollback, Handoff |
| `M8/Milestone_M8_Self_Healing.md` | 76 | `3/10` | Tasks, API, DB, Tests, Risks, Rollback, Handoff |
| `M9/Milestone_M9_A8_Advanced.md` | 43 | `3/10` | Context, Scope, Tasks, API, DB, Rollback, Handoff |
| `M10/Milestone_M10_AI_Product_Tester.md` | 43 | `1/10` | Context, Scope, Tasks, API, DB, Tests, Risks, Rollback, Handoff |
| `M11/Milestone_M11_Visual_Mobile_OnPrem.md` | 41 | `2/10` | Context, Scope, Tasks, API, DB, Risks, Rollback, Handoff |
| `M12/Milestone_M12_v15_GA.md` | 67 | `3/10` | Context, Tasks, DB, Tests, Risks, Rollback, Handoff |
| `M13/Milestone_M13_LowCode_Authoring.md` | 121 | `6/10` | Tasks, DB, Rollback, Handoff |
| `M14/Milestone_M14_Test_Selection_CI.md` | 93 | `6/10` | Tasks, DB, Tests, Rollback |
| `M15/Milestone_M15_Full_Test_Planning.md` | 93 | `5/10` | Tasks, API, DB, Rollback, Handoff |
| `M16/Milestone_M16_Vibe_Code_Governor.md` | 83 | `4/10` | Tasks, API, DB, Tests, Rollback, Handoff |
| `M17/Milestone_M17_Enterprise_Auth_Slack.md` | 68 | `2/10` | Context, Tasks, API, DB, Tests, Risks, Rollback, Handoff |
| `M18/Milestone_M18_v2_GA.md` | 70 | `4/10` | Context, Tasks, DB, Risks, Rollback, Handoff |
| `PM4/Initiative_Career_Compass.md` | 41 | `2/10` | Context, Tasks, DB, Tests, Risks, Rollback, Exit, Handoff |
| `PM4/Initiative_Cloud_Device_Grid.md` | 34 | `3/10` | Context, Tasks, DB, Risks, Rollback, Exit, Handoff |
| `PM4/Initiative_Enterprise_Compliance_GxP.md` | 40 | `1/10` | Context, Tasks, API, DB, Tests, Risks, Rollback, Exit, Handoff |
| `PM4/Initiative_Full_70_Docs.md` | 33 | `1/10` | Context, Tasks, API, DB, Tests, Risks, Rollback, Exit, Handoff |
| `PM4/Initiative_Multi_Tenant_SaaS.md` | 39 | `3/10` | Context, Tasks, Tests, Risks, Rollback, Exit, Handoff |
| `PM4/Initiative_White_Label.md` | 34 | `2/10` | Context, Tasks, DB, Tests, Risks, Rollback, Exit, Handoff |

#### 6.6.5 Specific Milestone Context Errors

| Severity | Reference | Finding | Impact | Recommended fix |
|---|---|---|---|---|
| `P1` | `M4/Milestone_M4_Runs_Defects_Jira.md:61-81` | Predecessor context is wrong: it says `M1=Knowledge Base + Documents`, `M2=Test Cases`, `M3=Test Execution + Jira` | Breaks shared milestone spine | Rebuild context from current registry sequence |
| `P1` | `M6/Milestone_M6_Full_Reports_GA.md:73-108` | Predecessor chain is shifted by one milestone and uses outdated labels | Handoff assumptions are inaccurate | Refresh M0–M5 recap from current registry |
| `P1` | `M7/Milestone_M7_Test_Data_Generation.md:16-75` | Later milestone docs are summary cards, not build-ready plans | Later phases cannot be estimated or executed at MVP-document quality | Expand M7–M18 to the same template used by M0–M6 |
| `P1` | `PM4/Initiative_Enterprise_Compliance_GxP.md:13-40` and all PM4 initiative docs | PM4 initiative docs are concept notes, not executable initiatives | PM4 is not operationalized | Create full initiative charters with tasks, APIs, DB, risks, exit criteria, and dependencies |

#### Assessment

The milestone suite is **strong for PM1** and **weak for the rest of the program**. The current suite supports MVP execution well, but it does not yet support full-program execution at the same rigor.

---

## 7. MD ↔ DOCX Parity Audit

### Project-Level Pairs

| Pair | Parity result | Notes |
|---|---|---|
| `PRD/PRD.md` ↔ `PRD/PRD.docx` | Medium-good | Content broadly aligned; DOCX has frontmatter bleed |
| `ERD/ERD.md` ↔ `ERD/ERD.docx` | Medium | Broad structure aligned, but heading flattening exists |

### Milestone Pairs

| Pair | Markdown Headings | DOCX Headings | Audit note |
|---|---:|---:|---|
| `M0` | 58 | 24 | DOCX is materially compressed |
| `M1` | 54 | 10 | DOCX is materially compressed |
| `M2` | 53 | 59 | Best parity of the milestone set |
| `M3` | 78 | 21 | DOCX is materially compressed |
| `M4` | 66 | 26 | DOCX is materially compressed |
| `M5` | 76 | 12 | DOCX is materially compressed |
| `M6` | 62 | 16 | DOCX is materially compressed |

### Parity Conclusion

- The **project PRD/ERD pairs are usable but need cleanup**.
- The **milestone DOCX files are not consistently faithful renderings** of their markdown sources.
- Several milestone DOCX files behave more like **executive summaries** than equal-authority copies.

---

## 8. Cross-Document Sync Matrix

| Topic | Source corpus | Brainstorm | Analysis | Roadmap | PRD | ERD | Milestones | Status |
|---|---|---|---|---|---|---|---|---|
| PM2 = self-healing/test-data/on-prem/mobile | Yes | No | Weak | Yes | Mixed | No | Mixed | `P0` |
| PM3 = low-code/governance/SSO/Slack | Yes | No | Weak | Yes | Mixed | No | Mixed | `P0` |
| AI agent sequencing | Yes | Partial / outdated | Partial | High-level yes | Mixed | Mixed | Mixed | `P0` |
| PM1 duration | Source corpus implies milestone-based schedule | N/A | MVP-only | `18w` label but ~21w by dates | `18w` | inherits PM1 framing | `23w` summary, `21w` by sub-milestones | `P1` |
| TB / EP / CO traceability | Not source-driven; should be downstream-canonical | N/A | N/A | High-level only | Partial | Conflicted | Registry has intended mapping | `P0` |
| Document catalog `12 → 32 → 50 → 70` | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Good |
| SSO/Slack vs on-prem/mobile phase ownership | Yes | Old order | Weak | Correct | Wrong in layer progression | Wrong in tables/services/migrations | Mixed | `P0` |
| Compliance progression (`EU AI Act` vs `HIPAA/GxP`) | Yes | Mostly old order | Shallow | Correct | Mixed | Mixed | Mixed | `P1` |
| PM4 operationalization | Yes | Strategic | Strategic | High-level | High-level | High-level | Too shallow | `P1` |
| Reporting / ROI execution depth beyond PM1 | Yes | Strategic | Medium | High-level | Medium | Medium | Too shallow after `M6` | `P1` |

---

## 9. Prioritized Remediation Backlog

### Wave 1 — Must Fix Before Any Further Detailed Engineering Planning

1. **Re-baseline the canonical chain**
   - Canonical order should be: `PROJECT_ROADMAP.md` → `MILESTONE_REGISTRY.md` → `PRD/PRD.md` → `ERD/ERD.md` → milestone docs → support audits/reviews.

2. **Fix PM2 / PM3 drift everywhere**
   - Update `QA_Nexus_Master_Brainstorm.md`
   - Rewrite `project_analysis.md` as project-level
   - Correct PRD persona/layer/user-story phase tags
   - Correct ERD service groups, tables, migration logic, and later agent phase labels

3. **Fix PM1 duration arithmetic**
   - Choose a single rule:
   - Option A: `PM1 = 21 weeks`
   - Option B: `PM1 = 18 build weeks + 3 GA/hardening weeks`
   - Option C: keep `18 weeks` only if the M0–M6 table and dates are restructured

4. **Reconcile ERD ID registry**
   - One canonical TB/EP/CO/ADR map
   - No reused table meanings
   - No undeclared range extensions
   - No orphan IDs

### Wave 2 — Must Fix Before Later-Phase Delivery Planning

5. **Expand `M7`–`M18` to MVP-level detail**
   - Each later milestone needs full context, task breakdown, APIs, DB changes, test strategy, risks, rollback, exit criteria, and predecessor/handoff context.

6. **Replace PM4 initiative stubs with executable initiative charters**
   - Especially `Enterprise_Compliance_GxP`, `Multi_Tenant_SaaS`, `Full_70_Docs`, and `Cloud_Device_Grid`.

7. **Retire or replace stale meta-docs**
   - `SYNC_REPORT.md`
   - `FINAL_REVIEW.md`

### Wave 3 — Quality and Presentation Hardening

8. **Regenerate DOCX files from cleaned markdown**
   - Remove PRD frontmatter bleed
   - Ensure milestone DOCX files are full-fidelity, not summarized exports

9. **Tighten evidence posture in executive-facing docs**
   - Convert hard market/ROI/salary/fear assertions into sourced context or labeled hypotheses

10. **Add a document sync checklist**
   - Any future roadmap change must explicitly list which docs were updated and which are still pending

---

## 10. Final Audit Conclusion

QA Nexus already has the **raw material for a very strong project-level documentation suite**. The missing piece is not vision; it is **discipline of synchronization**.

At the moment:

- the **roadmap is the best canonical backbone**
- the **PRD is close to ready but not fully phase-correct**
- the **ERD needs a substantive reconciliation pass before engineering should trust it**
- the **milestone suite is execution-ready only through `M6`**

If the `P0` and `P1` items above are fixed in order, the documentation set can become genuinely safe for long-horizon delivery and reduce future execution gaps significantly.

---

## Appendix A — Key Evidence References

- `PROJECT_ROADMAP.md:21-27` — canonical PM2/PM3 swap
- `PROJECT_ROADMAP.md:35-37` — project phase table
- `PROJECT_ROADMAP.md:71-77` — PM1 sub-milestone durations
- `QA_Nexus_Master_Brainstorm.md:360-366` — outdated post-MVP agent ship phases
- `QA_Nexus_Master_Brainstorm.md:761-767` — outdated v1.5/v2 ordering
- `project_analysis.md:1-6` — still MVP/pre-PRD analysis
- `project_analysis.md:147-192` — MVP-only scope and old deferred-feature framing
- `PRD/PRD.md:84-95` — persona phase drift
- `PRD/PRD.md:431-485` — layer progression drift
- `PRD/PRD.md:511-525` — sample user-story phase drift
- `ERD/ERD.md:107-121` — reversed PM2/PM3 service groups
- `ERD/ERD.md:827-993` — reversed PM2/PM3 table blocks
- `ERD/ERD.md:1662`, `1776`, `1910`, `1963` — inconsistent later agent phase labels
- `ERD/ERD.md:2357-2382` — reversed migration sequencing
- `MILESTONE_REGISTRY.md:16-19` — wrong PM2/PM3 overview durations
- `MILESTONE_REGISTRY.md:54-62` — PM1 total-week inconsistency
- `MILESTONE_REGISTRY.md:234-241` — intended TB mapping
- `M4/Milestone_M4_Runs_Defects_Jira.md:61-81` — wrong predecessor context
- `M6/Milestone_M6_Full_Reports_GA.md:73-108` — wrong predecessor context
- `M7/Milestone_M7_Test_Data_Generation.md:16-75` — summary-only milestone
- `Milestone/PM4/Initiative_Enterprise_Compliance_GxP.md:13-40` — summary-only PM4 initiative

