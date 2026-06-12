# Master PRD Conformance Dashboard — Phase B/C

> **Author:** MAIN · **Status:** 🟡 **LIVE AGGREGATION (compressed timeline — Fri 2026-06-12).** Per-requirement verdict cells ⏳ fill during **Phase C live-verify TODAY** (BE+1 HTTP smoke + FE+1 pages.dev verify, late afternoon), not Sat. Decisions, conflicts, wiring inventory = code-grounded + final. **Final verdict → separate doc `docs/audits/2026-06-12-fri-main-prd-conformance-final.md` (Phase D, evening).**
> **Inputs:** BE+1 #264 PRD baseline · #261 Day-32 audit (AMBER) · #262 (merged) · FE+1 baseline + Thu full-audit + P0-A #266 (merged) · my Phase A baseline · **Yogesh Fri live shake-down (items H/I/J below).**
> **Contract:** PM1-mandated = MUST WORK. PM2-PM4-deferred = acceptable stub/canned. Modified by Decisions A-E **+ Fri scope re-decisions (F18 deferred · W2-R stays · Yogesh test = Sun).**

---

## §0 — Yogesh's 5 binding decisions (applied throughout)

| #        | Decision                                                                                                                                                                              | Conformance effect                                                                           |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **A**    | Invite flow = **M1-MANDATED, must work for pilot**                                                                                                                                    | P0-D stays 🔴 must-fix (real Resend/Apps-Script invite + set-password)                       |
| **B(a)** | TipTap doc authoring = **SKIP from pilot**                                                                                                                                            | **GAP-1 reclassifies 🔴→⚫ acceptable-deferral** (removes a ~1-2 week P0)                    |
| **B(b)** | F18 Test Suites = ~~IN scope, build before test~~ → **🔁 DEFERRED-from-today (Fri re-decision)** — cross-agent dependency too tight for compressed timeline; **Sat-AM-optional / M6** | GAP-2 = ⚫ deferred-not-blocking-today (F18 conflict §2 still valid for whenever it's built) |
| **C**    | F24 QA-Value dashboard = **DROPPED for pilot**                                                                                                                                        | **GAP-3 reclassifies 🟡→⚫** (F25 already shipped covers exec view)                          |
| **D**    | Jira = **SEED-ONLY for pilot test; outbound sync = M5 hardening**                                                                                                                     | FR-013 Jira connect/sync 501-stubs = acceptable-for-pilot; outbound deferred                 |
| **E**    | P0-C fictional names = **canned-data override path** (NO Rule 3 locked-frame edits)                                                                                                   | P0-C 🔴 fix via canned-data swap to Iksula canon, not HTML edits                             |

**Net effect of A-E:** two big items removed (TipTap GAP-1, F24 GAP-3); F18 now **deferred-from-today**; real-data P0 set = **P0-A/B/C/D**.

### §0.5 — Fri live shake-down re-decisions + 3 new findings (Yogesh, 2026-06-12)

| Item                                    | Decision / finding                                                | Effect                                                                                     |
| --------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| F18                                     | **DEFERRED from today** (Sat-optional / M6)                       | removes the ~2-day build from today's critical path                                        |
| W2-R defects read API                   | **STAYS** (agentic-QA core requires it for F21)                   | BE+1 builds; FE+1 F21 consumes after                                                       |
| F21 Defects Hub                         | **STAYS** in pilot scope                                          | port already audited; wire to W2-R                                                         |
| Yogesh test                             | **= Sun**                                                         | launch date still set by test outcome                                                      |
| **H. Sign-out 405**                     | **P0 security gap** — sign-out returns 405, session may not clear | FE+1 baseURL fix + BE+1 endpoint confirm + joint smoke (cross-domain)                      |
| **I. F28 audit canned 47k vs real 158** | **P1** — F28 shows fabricated count; real chain = 158 rows        | FE+1 wires F28 → real `GET /api/audit`; **confirm pagination handshake vs BE shape first** |
| **J. RSC 404s**                         | **P2** — React Server Component 404s on some routes               | FE+1 investigates per-route; not a launch-blocker                                          |

**41st RC (institutional):** **live shake-down > static audits for UX-layer issues** — H/I/J surfaced only by Yogesh clicking through the deployed app, not by the file-level audits (which are strong on structure/wiring but blind to runtime UX like a 405 on sign-out). Candidate memory: `feedback_live_shakedown_beats_static_audit.md` (Phase D).

---

## §1 — Master conformance matrix (BE × FE × integration)

Verdict cells ⏳ = pending Sat BE+1/FE+1 fresh verdicts. Pre-filled from existing audits + code grounding.

| PRD    | Requirement                     | BE verdict                                     | FE verdict                                             | Integration (handshake)                   | Class (post A-E)                            |
| ------ | ------------------------------- | ---------------------------------------------- | ------------------------------------------------------ | ----------------------------------------- | ------------------------------------------- |
| FR-001 | role/project-scoped access      | PASS (tenant scope)                            | 🔴 FAIL (P0-A signed-out→Admin)                        | broken — no prod auth gate                | 🔴 must-fix                                 |
| FR-002 | 4-role RBAC                     | PASS server guards                             | 🔴 PARTIAL (client-only; AdminGuard passes signed-out) | client-only; server→M6 (BUG-003 accepted) | 🔴 (P0-A) / 🟡 server M6                    |
| FR-003 | create/switch/archive projects  | PASS (`GET /api/projects`, 5 real)             | 🔴 FAIL (switcher canned; #255 closed)                 | **BE LIVE, FE unwired — ~1-2 hr win**     | 🔴 must-fix (cheapest)                      |
| FR-004 | ingest docs versioned           | ⏳                                             | KB LIVE (F15)                                          | ⏳                                        | 🟢 likely                                   |
| FR-005 | AI-assisted QA doc gen (TipTap) | n/a                                            | NOT BUILT (GAP-1)                                      | n/a                                       | ⚫ **DROPPED (Dec B-a)**                    |
| FR-006 | test-case CRUD                  | exists                                         | canned (M3 in-flight)                                  | ⏳                                        | 🟡                                          |
| FR-007 | A1 draft gen                    | PASS-track                                     | MIXED-live (F16b)                                      | partial                                   | 🟢/🟡                                       |
| FR-008 | A2 dedup                        | ⏳                                             | acceptable                                             | ⏳                                        | 🟢                                          |
| FR-009 | link cases↔reqs (Should)        | exists                                         | —                                                      | ⏳                                        | 🟢 deferral                                 |
| FR-010 | manual runs+evidence            | exists                                         | canned (F19/20)                                        | ⏳                                        | 🟡 (M4)                                     |
| FR-011 | defects from failed tests       | exists                                         | 🔴 canned + fabricated P0 incident                     | ⏳                                        | 🔴 (P0-C names)                             |
| FR-012 | A4 RCA                          | PASS (but unguarded → **#262 fixes**)          | canned                                                 | **was P1: unguarded RCA kickoff**         | 🟡 (GAP-4 eval 64%)                         |
| FR-013 | **Jira 2-way sync**             | connect/sync = 501 stubs; inbound webhook LIVE | canned 3-step wizard                                   | not implemented outbound                  | 🟡 **seed-only pilot (Dec D)**; outbound M5 |
| FR-014 | reporting views                 | reports LIVE; exec aggregate exists            | F25 shipped; F23 canned; **F24 dropped**               | partial                                   | 🟢 (F24 ⚫ Dec C)                           |
| FR-015 | auditable record                | **PASS — HMAC chain PROVEN live (158 rows)**   | viewer canned-OK                                       | BE proven                                 | 🟢                                          |
| FR-016 | global search (Should)          | —                                              | palette renders but **links 404 (GAP-7 defect)**       | broken targets                            | 🟡 fix-or-hide                              |
| FR-017 | RAG historical QA               | KB LIVE                                        | PASS-track                                             | LIVE                                      | 🟢                                          |

**NFR:** NFR-002 (RBAC) BE-PASS/FE-client-only; NFR-003 (audit) **PASS proven live**; NFR-001 (RWD) enforced, prod-perf unmeasured (P2); latency authority = ERD §3.5 (A1 p50 18s/p95 30s) — the FastAPI table is stale.

---

## §2 — F18 Test Suites: CROSS-DOMAIN CONFLICT (surfaced, Rule 11) + build plan (Decision 2b)

**The conflict (must be reconciled by BE+1 at the Sat verdict):**

| Source                                | Claim                                                                                                                                                                                             |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BE Day-32 audit §2/§3 (#261)          | "F18 Suites — suites + members CRUD — ✅ **LIVE** — 5 real"                                                                                                                                       |
| FE baseline GAP-2 + Thu audit         | "**NOT BUILT** — orphaned models, no controller/endpoint/FE route"                                                                                                                                |
| **Independent grep (both worktrees)** | **0 hits** for `TestSuite` in `apps/api/src`; no controller/service/DTO/module; no FE `*suite*` route; only RLS policies reference `test_suites`. 5 rows may be seeded but **no API reads them.** |

**Code-grounded resolution: F18 must be built FRESH.** BE Day-32 over-claimed (the table is seeded + has RLS, but there is no CRUD surface). This mirrors the 33rd reality-check (BE catalog over-claim).

**Build plan (Decision 2b — IN scope, build before Yogesh tests):**

- **BE+1:** net-new `test-suites` controller + service + module + shared Zod schema + RBAC `@Roles` + audit writes + RLS already present. (`/api/projects/:projectId/test-suites` CRUD + `/members`.)
- **FE+1:** port `F18 Test Suites v2.html` + `F18m1 Edit Suite Modal v2.html` (canonical HTML ready) to React via frame-port skill; AdminShell wrap; canned-data extract.
- **Integration:** suite CRUD handshake + run-from-suite wire (W-002) + empty-states.
- **Effort:** **~1 week** (fresh build both sides). **Risk Yogesh should weigh now:** this is the single largest scope item and it gates "before Yogesh tests" — it likely sets the test-cycle start date.

---

## §3 — Cross-domain wiring-gap inventory (code-grounded, reclassified per A-E)

| #   | Gap                                                                                    | State                                                                                                                      | Class (post A-E)              | Effort                                    |
| --- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ----------------------------------------- |
| 1   | **F09 switcher canned, `GET /api/projects` LIVE (5 real)**                             | `fetchWithFallback` on main w/ ZERO callers; #255 closed (chained-base casualty), code on `feat/web-option-b-f09-projects` | 🔴 **cheapest real-data win** | **~1-2 hr** (re-target main + 1 conflict) |
| 2   | F18 — neither side exists                                                              | §2                                                                                                                         | 🔴 build                      | ~1 wk                                     |
| 3   | F22 defect actions — 5× 501 stubs                                                      | FE UI present, BE 501                                                                                                      | 🟡                            | BE impl                                   |
| 4   | Jira connect/sync — 501 stubs                                                          | inbound webhook LIVE                                                                                                       | 🟡 seed-only (Dec D)          | outbound M5                               |
| 5   | F25 Exec — BE LIVE, FE port Day-29 Tier-2                                              | BE-no-FE                                                                                                                   | 🟡                            | ~Tier-2 port                              |
| 6   | F26/m1 Agents — BE LIVE, FE Tier-2                                                     | BE-no-FE                                                                                                                   | 🟡                            | port                                      |
| 7   | F27 Users — BE LIVE (8 real), FE Tier-2 + **invite POSTs nothing (P0-D)** + #418 crash | BE-no-FE + P0-D                                                                                                            | 🔴 (P0-D, Dec A)              | port + wire invite                        |
| 8   | F08 Home — canned by design, no aggregate endpoint                                     | acceptable                                                                                                                 | 🟢 deferral                   | —                                         |
| 9   | F16b A1 Generate — MIXED-live                                                          | partial                                                                                                                    | 🟢/🟡                         | —                                         |
| 10  | F28 Settings/Audit — BE LIVE (158 rows), FE viewer canned                              | BE proven                                                                                                                  | 🟢                            | —                                         |
| 11  | Cmd-K omnibox links 404                                                                | shell present, targets dead                                                                                                | 🟡 GAP-7                      | fix-or-hide                               |
| —   | `/admin/users` live fetcher UNUSED (my Phase-A flagship example)                       | = #7                                                                                                                       | 🔴                            | wire                                      |

**Sequencing seed:** F09 (~1-2hr) is the cheapest real-data win → do first. Then P0-A auth gate + P0-C canned→Iksula-canon (Dec E) + P0-D invite (Dec A). F18 (~1wk) runs parallel BE+FE. F27/F26/F25 Tier-2 ports batch (~1 day).

---

## §4 — BE fixes already in flight (reduce the blocker count)

- **#262 (OPEN, 60/60 + 701/701 green)** — fixes BE Day-32's **1 pre-launch P1** (unguarded `POST /api/defects/:id/rca` → `@Roles` + tenant isolation + real actor) **AND** the disabled-user P2 (`resolveSession` returns null when `disabledAt` set). Merging this clears the BE pre-launch P1.
- **#263 (OPEN, test-only)** — completes the `better-auth/plugins` mock factory in the day0 spec → closes the **last #259-class instance**. Safe.

Both off `cb1f2c4`, no conflicts. **Recommend merging both** (subject to your review) to shrink the Sat backlog — #262 especially (it's the BE pre-launch P1 fix).

---

## §5 — BE GREEN(AMBER) vs FE HARD-HOLD — reconciled

BE Day-32 = **AMBER (launch-viable, 1 pre-launch P1)**; FE Thu = **HARD-HOLD (4 P0, 24/28 canned)**. Both correct for their layer. **The binding reality for a _real-data_ pilot is FE's HARD-HOLD** — the app shows fiction + lacks the auth gate. BE capability is largely present; the work is FE wiring + auth-gate + role-routing + the F18 fresh build. **M5 hardening is FE-led, BE in support** (+ #262/#263 + F18 BE CRUD).

---

## §6 — Phase C placeholders (GATED — Sat 1 PM)

- **C1 scoreboard** ⏳ (🟢/🟡/🔴/⚫ per route, after fresh verdicts)
- **C2 sequence** ⏳ (hours-to-GREEN; F09 first → P0-A/C/D → F18 parallel → Tier-2 ports → integration smoke → Yogesh deep test)
- **C3 Akshay comms** ⏳ (drafted once launch date set; framing: thorough verification caught canned-vs-real before user exposure; pilot includes agentic-QA core + F18 + working admin/invite; excludes TipTap doc authoring + Jira outbound + F24)
- **My independent launch recommendation** ⏳ (Phase C, separate from BE+1/FE+1)

## §7 — B4/B5 reconciliation (started)

- **B4 safety-pattern ordinal:** `memory.md` feedback list = **15 distinct files** (count Sat to finalize) incl. the new metadata-audit pattern. Brief's "17th" ≠ repo's ~15. Canonical renumber Sat. _(metadata-audit pattern = the trigger of THIS whole audit.)_
- **B5 reality-checks:** ~38 this week (BE+1 carried; confirm tally from EODs Sat).

## §8 — Phase D close-out status

- **D1** ⏳ — rename `2026-06-12-fri-pilot-launch.md` → `yogesh-deep-test-cycle.md` (no fixed date); strip "GREEN GO". Do before #260 merge.
- **D2** ✅ **RESOLVED by Yogesh** — `chat-history/` is outside-repo → never pushed → token-in-transcript not a leak risk. No scrub needed; archive stays local-only.
- **D3** ⏳ — 6 schema acks surfaced when Yogesh ready (deferred Sat AM).

---

_Phase B working draft authored Fri night 2026-06-11. Verdict cells gated on Sat BE+1/FE+1 inputs. Decisions A-E applied; F18 conflict + wiring inventory code-grounded; every finding cited (Rule 17 spirit). The F18 BE-claims-LIVE vs code-says-NOT-BUILT conflict is surfaced for Yogesh + BE+1 reconciliation, not resolved by MAIN._
