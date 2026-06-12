# Fri 2026-06-12 10:30 IST — Live Triage (compressed timeline)

> **Attendees:** Yogesh (decides, available now-10 PM, break 1-3 PM) + BE+1 + FE+1 + MAIN (orchestration).
> **Goal:** reconcile the PRD-conformance cycle + Yogesh's live shake-down into a today/Sat build plan. **Yogesh test target = Sun.** Launch date still set by test outcome.
> **Pre-reads:** `docs/audits/2026-06-12-fri-main-master-conformance-dashboard.md` (Phase B) · `docs/audits/2026-06-12-fri-main-prd-orchestration-baseline.md` (Phase A).
> _Status as of 10:30: 5 of 7 PRs merged Fri night (#260/261/262/265/266); #263/#264 held (item B). Yogesh confirmed smoke green at merge._

---

## A. F18 over-claim reconciliation + scope re-decision — 5 min

- **Finding (39th RC):** BE Day-32 (#261) recorded F18 "✅ LIVE — CRUD — 5 real"; FE baseline + **independent grep of both worktrees** = zero controller/service/DTO/module/FE-route refs (model orphaned, only RLS touches the table). **Code-grounded truth: F18 is NOT built** (~2-day fresh build). Same shape as the 33rd RC. **Lesson: commit-message/catalog entry ≠ verification — grep + curl is.** BE+1 to re-baseline the Day-32 entry.
- **🔁 SCOPE RE-DECISION (Yogesh):** **F18 DEFERRED from today** — cross-agent dependency too tight for the compressed timeline. **Sat AM optional** (if Yogesh wants it in pilot scope) **OR M6.** Supersedes the earlier Decision B(b) "build before Yogesh tests."

## B. PR merge confirmation — 3 min

- Confirm merged + Render redeployed: **#261** (Day-32 audit doc) · **#262** (BE pre-launch P1: RCA guard + tenant isolation + disabled-user gate) · **#263** (mock-factory #259-class close) · **#265 / #266** (FE+1 fixes — _confirm IDs + scope in call_).
- BE+1 + FE+1 confirm Phase-C smoke can begin once these are live.
- _MAIN note: #262 + #263 were OPEN + green at Fri-night read; recommend they merge first (they shrink the backlog)._

## C. F21 Defects Hub scope confirmation — 3 min

- **YES — Defects + Sherlock RCA in pilot scope** (Yogesh ruling). It is the core QA workflow.
- Implies Sun BE build: **W2-R defects read API**; Sun FE: **F21 consume the new defects API** (port already audited).

## D. P0 fixes status — 10 min

| P0   | Item                                             | Expected state (confirm in call)                                | Owner |
| ---- | ------------------------------------------------ | --------------------------------------------------------------- | ----- |
| P0-A | signed-out → Admin (prod auth gate)              | ✅ shipped (#266) + verified prod-mode _(confirm)_              | FE+1  |
| P0-B | F09 switcher → real `GET /api/projects` (5 rows) | FE+1 starts Sat 8 AM, ~1-2 hr (re-target #255 code to main)     | FE+1  |
| P0-C | fictional names → Iksula canon                   | canned-data override sweep (Decision E — no Rule-3 frame edits) | FE+1  |
| P0-D | invite flow inert + #418 crash                   | unminified repro + #418 fix + real invite POST (Decision A)     | FE+1  |

## E. Build plan (today→Sat) — 10 min

- **BE+1:** **W2-R defects read API** (STAYS — agentic-QA core requires it for F21). _(W5 F18 controller deferred per item A.)_
- **FE+1:** P0 fixes (D) + the 3 shake-down items (H/I/J) + **F21 consume defects API** once W2-R lands. _(F18 v2 port deferred per item A — Sat-AM-optional / M6.)_
- **MAIN:** Phase B aggregation (mid-day) + Phase C live-verify orchestration (late afternoon) + Phase D final deliverable (evening).
- **Sequence carefully:** W2-R defects → F21 consume — FE+1 waits for BE+1's controller; don't wire blind (11th-RC lesson).

## F. Mon test-cycle posture — 10 min

- Yogesh begins the **deep test cycle**; agents on standby for findings (fix-first workflow).
- **Launch decision = test feedback, no pre-set date.** Brief renamed → `docs/briefs/yogesh-deep-test-cycle.md` (stale "GREEN GO" removed).

## G. Phase D MAIN deliverable timeline — 5 min

- **Sat PM:** aggregate BE+1 + FE+1 fresh verdicts into the master dashboard (fill the ⏳ cells).
- **Sun PM:** master conformance dashboard FINAL + my independent launch-readiness read.
- **Mon AM:** hand-off to Yogesh's test.

---

## H-J. Yogesh live shake-down findings (NEW) — 10 min

The live shake-down surfaced 3 UX-layer issues the static audits missed (41st RC — see footer):

- **H. Sign-out 405 (P0 — security gap).** Sign-out returns 405 → session may not actually clear. **FE+1 fixes the baseURL; BE+1 confirms the endpoint exists + method matches.** **Both verify via joint smoke.** Cross-domain — sequence: FE baseURL fix → BE endpoint confirm → joint curl.
- **I. F28 audit log canned 47k vs real 158 (P1).** F28 renders a fabricated "47k" audit count; real chain = **158 rows** (BE proven live). **FE+1 wires F28 to the real `GET /api/audit`.** **Watchpoint: confirm the pagination handshake matches the BE API shape** before wiring (verify-API-paths lesson).
- **J. RSC 404s (P2).** React Server Component 404s on some routes. **FE+1 investigates** (per-route; likely build/route-manifest mismatch). Not a launch-blocker; document.

---

## Parked (surface at the right moment)

- **D2 chat-archive Rule 6:** ✅ RESOLVED (outside-repo → never pushed → no leak).
- **D3 schema acks (work-log Phase 2-3):** defer to post-test-cycle.
- **Ordinal reconciliation:** Phase D — count `.claude/memory/feedback_*.md` properly + renumber; the metadata-audit pattern + the F18 catch (39th RC) get correct ordinals.

## Decisions banked this cycle (A-E + F21 + Fri shake-down)

A invite M1-mandated · B(a) TipTap SKIP · **B(b) F18 → DEFERRED-from-today** (Sat-optional / M6 — supersedes "build before test") · C F24 DROPPED · D Jira seed-only (outbound→M5) · E P0-C canned-override · F21 Defects IN scope · **W2-R STAYS** (agentic-QA core) · **Yogesh test = Sun.**
**Shake-down (Fri):** H sign-out 405 (P0) · I F28 audit canned→158 real (P1) · J RSC 404s (P2).

---

_Updated Fri 2026-06-12 10:30 IST for the live triage (compressed timeline). Two institutional banks: (1) cross-domain "X is LIVE" claims need independent grep+curl, not commit-message trust (39th RC — F18 catch); (2) **live shake-down > static audits for UX-layer issues** (41st RC — H/I/J surfaced only by Yogesh clicking through, not by the file audits) — candidate memory file `feedback_live_shakedown_beats_static_audit.md` for Phase D._
