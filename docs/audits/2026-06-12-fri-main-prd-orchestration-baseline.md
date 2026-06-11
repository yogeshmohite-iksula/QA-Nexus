# PRD Conformance Orchestration — Phase A Baseline (Knowledge Index)

> **Author:** MAIN · **Date:** Fri 2026-06-12 (Phase A; authored Thu night ahead of Sat triage) · **Audited SHA:** `cb1f2c4` (P0-001 cascade #256/#258/#259 live)
> **Purpose:** the cross-domain knowledge index that BE+1's domain audit + FE+1's domain audit hang off. **This is NOT the verdict** — the master conformance verdict is Phase C (`2026-06-13-sat-main-prd-conformance-master-dashboard.md`), gated on BE+1 + FE+1 fresh PRD-conformance verdicts (Sat 10-11 AM).
> **The contract:** PM1-mandated in PRD = MUST WORK NOW. PM2-PM4-deferred per PRD = acceptable as stub/canned/coming-soon.
> **Sources:** PM1_PRD v8.1 §9-§10, PM1_ERD v2.1 §2-§8, BE Sun deep-audit (`docs/pilot-prep/2026-06-07-sun-deep-audit-be.md`), FE full audit (`../Project10-QA_Nexus-frontend/docs/audits/2026-06-11-thu-fe-full-audit.md`), API shape catalog, app-routes/controllers inventory. Every finding below cites its source; nothing is invented (Rule 17 spirit).

---

## §0 — HEADLINE: the cross-domain conflict I must surface (Rule 11)

**BE+1 (Sun 2026-06-07) verdict: 🟢 GREEN — GO.** FE+1 (Thu 2026-06-11) verdict: 🔴 **HARD-HOLD — "not safe to put 8 real users on it today."** These are **not contradictory** — they describe different layers:

- **BE is largely sound:** audit-log HMAC chain PROVEN live (§3.13), RBAC guards + tenant scope verified, all endpoints exist + return correct envelopes, seed ran (5 projects / 30 reqs / 63 cases / 5 suites / 25 defects), quotas GREEN.
- **FE is canned + ungated:** 24 of 28 routes render _fictional_ data (Priya S./Ravi K./fabricated defects); signed-out visitors reach the full Admin surface; the invite flow POSTs nothing; no role-based routing; two home routes are nav-traps (Hard Rule 14 violation).

**The gap is integration/wiring, not isolated breakage.** Example the orchestration view makes obvious: `/admin/users` has a **live BE fetcher that exists but is UNUSED** — the FE renders canned "8 members · 1 pending invite (Priya Tiwari)" instead of calling the working `users` controller. The BE built the endpoints; the FE never wired them. **This is the class of gap single-domain audits each rate differently (BE: "my endpoint works" ✓; FE: "my page shows fiction" ✗) and only the orchestration layer reconciles.** Surfaced for Yogesh — not resolved by me.

---

## §1 — Functional requirement inventory → owner → current status

PM1_PRD §9.1, FR-001→FR-017 (all **Must** unless noted). Status = from existing audits at `cb1f2c4`; ⏳ = Phase B will confirm with BE+1/FE+1 fresh verdicts.

| FR     | Title (abbrev)                          | BE owner                                   | FE owner                         | Status @ cb1f2c4 (cited)                                                                         |
| ------ | --------------------------------------- | ------------------------------------------ | -------------------------------- | ------------------------------------------------------------------------------------------------ |
| FR-001 | role/project-scoped workspace access    | `projects`, `project-members` + RolesGuard | `(app)` shell, project switcher  | BE PASS (tenant scope verified, BE-audit §B3); **FE 🔴 no prod auth gate (FE-P0#1)**             |
| FR-002 | Admin/Lead/QA/Mgmt RBAC                 | `@Roles` guards (RBAC PASS)                | AdminGuard                       | BE PASS; **FE 🔴 AdminGuard passes for signed-out (FE-P0#1); Lead read-only not impl (FE-P0#3)** |
| FR-003 | create/switch/archive projects          | `projects`                                 | `projects`, `[slug]`             | BE endpoints exist; **FE 🔴 /projects canned (FE-P0)**                                           |
| FR-004 | ingest source docs, versioned           | `kb/*`, `storage`                          | `kb/upload`, `kb/imports`        | ⏳ Phase B                                                                                       |
| FR-005 | AI-assisted QA doc gen                  | `composer`                                 | `test-cases/generate`            | ⏳                                                                                               |
| FR-006 | test-case CRUD/tag/prioritize           | `test-cases`                               | `test-cases`                     | BE exists; FE canned ⏳                                                                          |
| FR-007 | **A1** draft test-case gen              | `test-cases/composer` (A1)                 | `test-cases/generate`            | ⏳ (A1 latency authority = ERD §3.5, see §9)                                                     |
| FR-008 | **A2** duplicate detection              | `test-cases/curator` (A2, embedding-only)  | inline                           | ⏳                                                                                               |
| FR-009 | link cases↔requirements (**Should**)    | `requirements`                             | —                                | ⏳                                                                                               |
| FR-010 | manual test runs + evidence             | `test-runs`                                | `runs/[runId]`, `results`        | ⏳                                                                                               |
| FR-011 | create defects from failed tests        | `defects`                                  | `defects`, `defects/[id]`        | BE exists; **FE 🔴 defects canned, fabricated P0 incident (FE-P0)**                              |
| FR-012 | **A4** RCA summaries                    | `defects` (A4 5-layer)                     | defect detail                    | ⏳ (A4 = AC042 PASS top-2 64%/calib 1.00 Day-28)                                                 |
| FR-013 | **Jira 2-way sync** (Must)              | `jira-sync` (TB-013/014)                   | `sources/jira` wizard            | **PM1-MANDATED** (not PM2); ⏳ Phase B                                                           |
| FR-014 | reporting views                         | `reports`                                  | `reports`, `dashboard/executive` | **FE 🔴 executive dash canned (FE-P0); no executive controller (aggregate/canned)**              |
| FR-015 | auditable record (AI/approvals/defects) | `audit` (§3.13 HMAC)                       | F28 settings/audit               | **BE PASS — immutability PROVEN live (B1)**                                                      |
| FR-016 | global search (**Should**)              | —                                          | omnibox                          | ⏳                                                                                               |
| FR-017 | retrieve historical QA knowledge (RAG)  | `kb/kb-answer`, `kb/embedding`             | —                                | ⏳                                                                                               |

## NFR inventory (PM1_PRD §10, binding table)

| NFR     | Requirement                                           | Owner | Status                                                                       |
| ------- | ----------------------------------------------------- | ----- | ---------------------------------------------------------------------------- |
| NFR-001 | **Full RWD mobile-first 320→1920px** (NOT latency)    | FE    | enforce-rwd.sh active; per-frame verified through M5                         |
| NFR-002 | RBAC on all project-scoped access (RLS + Nest guards) | BE    | **PASS** (BE-audit §B3)                                                      |
| NFR-003 | auditability for user + AI actions                    | BE    | **PASS — proven live** (B1)                                                  |
| NFR-004 | secure token storage (AES-256)                        | BE    | ⏳ Phase B                                                                   |
| NFR-005 | version history for docs/cases                        | BE    | ⏳                                                                           |
| NFR-006 | graceful AI fallback (low-conf/unavailable)           | BE+FE | ⏳                                                                           |
| NFR-007 | observability (errors/latency/integration)            | BE    | OTel + Better Stack + Grafana wired (Sun audit Bucket 2 pending Yogesh dash) |
| NFR-008 | accessibility WCAG 2.1 AA                             | FE    | ⏳                                                                           |
| NFR-009 | traceable IDs (projects/docs/runs/cases/defects)      | both  | ⏳                                                                           |
| NFR-010 | (truncated in source)                                 | —     | re-read PM1_PRD §10 in Phase B                                               |

> **NFR latency authority resolution (§9):** PM1*PRD §10 NFRs are \_qualitative*. A SECOND quantified-latency table exists in the corpus referencing **FastAPI/Hatchet/SigNoz — STALE** (PM1 bans FastAPI; Hard Rule 5). The **binding** agent-latency budget is **PM1_ERD §3.5: A1 p50=18s · p95=30s · timeout=45s + 1 retry.** ADR-024 set the A4 pilot gate <20s (GA <15s). Discard the FastAPI table; cite ERD §3.5.

---

## §2 — ERD module / table / agent map (PM1_ERD v2.1)

- **3 agents · 21 tables.** Agents: **A1** Generator (→ gpt-oss-_), **A2** Dedup (embedding-only, no LLM), **A4** 5-Layer RCA (→ gpt-oss-120b + fast layers gpt-oss-20b). _(Out of scope PM1: A3/A5/A6/A7/A8.)\* Agent NAMES Composer/Curator/Sherlock are CLAUDE.md/UI canon, NOT in the ERD.
- **Tables TB-001→021:** workspace, user (TB-002 — the table P0-001's customSession joins), project, project_member, user_invitation, requirement, test_case (+confidence_score), test_case_link, test_suite(+member), test_run(+result), jira_connection (TB-013), jira_issue (TB-014), defect (TB-015), rca_report (TB-016), kb_document, kb_chunk, llm_provider (TB-019), llm_provider_model (TB-020), agent_model_assignment (TB-021, enum A1/A2/A4) + aux `agent_run`.
- **§3.13 = audit_log** (HMAC `prev_hash`/`this_hash`) — the binding spec for FR-015/NFR-003.
- **Endpoints v2.1:** EP-026 `/llm-providers` · EP-027 `…/{id}/test` · EP-028 `…/{id}/models` · EP-029 `/agents/{id}/model-config` (FE consumers F26m1/F28m1).
- **Pilot scale (§3.4):** 8 users · ~100 page loads/day · ~150 LLM/day · ~250 A2/day · ~5 runs/day.

## §2.1 — Route ↔ controller integration map (33 FE routes / 32 controllers)

No hard contradictions; gaps are naming-convention (FE composes multiple controllers per page) + infra-only controllers. Key integration facts:

- `(app)/dashboard/executive` → **no executive controller** (aggregates reports/test-runs OR pure canned — FE-P0 says canned).
- `admin/users` → `users` controller exists + **live fetcher exists but UNUSED** (canned). The flagship wiring gap.
- onboarding/\* → `invitations` + `auth` (invite flow POSTs nothing — FE-P0#2).
- Infra-only controllers (no UI, expected): health, app, otel-test, embedding, chunking, kb/embedding, rbac-demo, nfr.

---

## §3 — Hard Rule → enforcement owner

| Rule                        | Owner     | Enforcement                                                                      |
| --------------------------- | --------- | -------------------------------------------------------------------------------- |
| 1 ($0 gate)                 | all       | enforce-pm1-stack.sh + ADR sign-off                                              |
| 3 (46 locked frames)        | FE        | harness deny + visual gate                                                       |
| 4/5 (no MD3/ban-list)       | all       | enforce-design-tokens.sh + enforce-pm1-stack.sh                                  |
| 6 (no secrets)              | all       | check-secrets.sh + gitleaks                                                      |
| 7 (audit_log chain)         | BE        | §3.13 + DB triggers (PROVEN live)                                                |
| 8/9/10 (pnpm/strict/Zod)    | both      | CI typecheck + shared schemas                                                    |
| 12 (RWD)                    | FE        | enforce-rwd.sh                                                                   |
| 13 (visual gate)            | FE→Yogesh | manual gate                                                                      |
| **14 (AdminShell parity)**  | FE        | **VIOLATED — /home/lead-admin + /home/empty use own shell → nav-trap (FE-P0#4)** |
| 15-18 (frame-port workflow) | FE        | frame-port skill                                                                 |
| 11 (ask Yogesh)             | all       | judgment                                                                         |

---

## §4 — Milestone → PRD subset

| MS  | Scope                                              | PRD/ERD subset                              | AC coverage                                               |
| --- | -------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------- |
| M0  | infra/setup                                        | NFR-007, deploy topology §3.4               | 19 acceptance gates (M0_v8)                               |
| M1  | Users & Roles (auth/RBAC/invite)                   | FR-001/002, NFR-002; AC-056-061 invitations | exit: every endpoint RBAC-guarded, zero cross-org leakage |
| M2  | (home/projects)                                    | FR-003                                      | ⏳ re-read M2 doc Phase B                                 |
| M3  | KB/Requirements                                    | FR-004/016/017                              | ⏳                                                        |
| M4  | Test Cases/Suites/Runs/Defects                     | FR-006/007/008/010/011                      | ⏳                                                        |
| M5  | Run Console/Defect Detail/Reports/Exec Dash/Agents | FR-012/014, EP-026-029                      | tag m5-closed-2026-05-27; AC042 PASS                      |
| M6  | (hardening/GA gates)                               | NFR GA gates                                | not started                                               |

> **Gap flagged:** my Phase-A grep captured M1 ACs only. **M2-M6 per-AC detail to be cross-referenced in Phase B** from each `PM1_milestone/M{2..6}/` doc. Not invented here.

---

## §5 — Existing audit ledger (cross-refs)

| Audit                                                     | Date        | Verdict            | Key finding                                                              |
| --------------------------------------------------------- | ----------- | ------------------ | ------------------------------------------------------------------------ |
| BE Sun deep-audit (4 buckets)                             | 2026-06-07  | 🟢 GREEN-GO        | B1 audit-chain PROVEN; B5 pilot-data gap (later seeded)                  |
| FE full audit (§5 journeys + §6 click-sweep + 5 targeted) | 2026-06-11  | 🔴 HARD-HOLD       | **4 P0** (below); 24/28 routes canned; React #418 hydration P1 ×7 routes |
| Sat pre-MVP project audit (MAIN, 10 buckets)              | 2026-06-06  | GREEN w/ P1s       | 4 P1 + 6 P2 Day-29 items                                                 |
| MAIN Sun PM audit (3 buckets + 4 runbooks)                | 2026-06-07  | GREEN pending dash | runbooks shipped                                                         |
| 11 historical skill/code audits                           | Apr27-May17 | —                  | `docs/audits/`                                                           |

### FE+1's 4 P0 launch-blockers (verbatim source: FE full audit lines 13-19, 79-81)

1. **🔴 Signed-out visitors get the full app incl. /admin** — `CurrentUserContext` falls back to Yogesh/Admin seed persona (`CurrentUserContext.tsx:75-92`, `users[7]`); AdminGuard passes for signed-out; no `middleware.ts`/server gate. _(Consequence of #258 dev-fallback; prod-vs-dev `NODE_ENV` gate was planned but not shipped.)_ **NEW P0 (4th).**
2. **🔴 Invite flow is theater** — modal POSTs nothing (`invite-user-modal.tsx:62`); onboarding/\* + /set-password orphaned, fictional identities, no-op submit.
3. **🔴 No role-based routing** — magic-link callbackURL hardcoded `/home` for all; `/home` = QA-Engineer view for everyone; `/home/lead-admin` orphaned; no Stakeholder home; Lead read-only unimplemented.
4. **🔴 /home/lead-admin + /home/empty nav-traps** — own shell not AdminShell (Hard Rule 14), 24/22 dead buttons, user TRAPPED.

- **24/28 routes render canned fiction** (P0 for /home, /projects, /admin/users, defects, /dashboard/executive). FE net P0 = **4**.

---

## §6 — Safety-pattern + reality-check ledger (Phase B5 reconciliation seed)

- **Reality-checks this week:** ~36-38 (BE+1 carried; 36th = mock-factory catch). Phase B5 to confirm exact count from EODs.
- **Safety patterns:** repo `memory.md` sequences ~14 distinct feedback patterns; the Thu brief named the metadata-audit pattern "17th." **Ordinal drift is real + UNRESOLVED** — Phase B5 rebuilds the canonical 1-N ledger from `.claude/memory/feedback_*.md` source. I did not assert "17th" (Rule 11). The metadata-audit pattern is what triggered THIS audit (Yogesh Excel question → MAIN stop → BE/FE audits → 4 P0s).

---

## §7 — What Phase B/C need (gated)

**Phase B (Sat 10-11 AM, after BE+1 + FE+1 fresh PRD-conformance verdicts):**

- B1 master matrix BE×FE per FR/NFR/AC (this §1 table, completed with fresh verdicts)
- B2 cross-domain integration verification per workflow (the §0 wiring-gap class, enumerated)
- B3 Yogesh-test-readiness scoreboard (🟢/🟡/🔴/⚫ per route)
- B4 the 4 named workflows end-to-end verdict
- B5 pattern/RC ledger reconciliation + PR #260 brief fix
- M2-M6 AC cross-reference (the §4 gap)

**Phase C (Sat 1 PM):** exec summary + GREEN/AMBER/RED + test-ready YES/NO/CONDITIONAL + hours-to-GREEN + Akshay comms + **my independent launch-date recommendation** (separate from BE+1/FE+1).

**My provisional read (NOT the verdict — that's Phase C with fresh inputs):** the BE↔FE conflict resolves toward FE+1's HARD-HOLD for a _real-data_ pilot — the blockers are FE wiring + auth-gate + role-routing, not BE capability. The likely M5-hardening shape is **FE-led** (wire existing BE endpoints, add prod auth gate, role routing, AdminShell on the two trap routes), with BE in support. Quantified sequence + date land in Phase C.

---

_Phase A baseline authored Thu night 2026-06-11 ahead of the Sat triage. Knowledge index only — verdicts are Phase C. Every finding cited; nothing invented (Rule 17 spirit). The §0 cross-domain conflict (BE GREEN vs FE HARD-HOLD) is surfaced for Yogesh per Rule 11, not resolved by MAIN._
