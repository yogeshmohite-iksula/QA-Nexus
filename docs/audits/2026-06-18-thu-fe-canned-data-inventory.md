# FE Canned-Data Inventory — Thu 2026-06-18 (STEP 1, for Yogesh's scope call)

**Purpose:** per-surface list of remaining Pattern-A fixtures for the "no dummy data" bar. **Classification only — not fixing; Yogesh decides scope.**
**Endpoint truth:** verified against the live BE controller list (Hard Rule 11). EXIST: `api/projects · api/defects · api/audit(+verify-chain) · api/invitations · api/users · api/requirements · api/test-cases · api/test-runs · api/projects/:slug/members · api/admin/config/llm-providers · api/.../kb`. **Do NOT exist:** releases, sprints, review/clarification queue, agent-activity feed (only via audit), pinned refs.

**Already LIVE (shipped this week):** F09 switcher (`/api/projects`) · F21 defects (`/api/defects`) · F27 pending invites (`/api/invitations`) · F28 audit (`/api/audit`) · invite POST · F16b generate (live+fallback).

---

## A. `/home` Outcome Board (F08a) — `components/home/data.ts`

| Surface (export)            | What it shows now (canned)                              | Endpoint                            | Verdict                                                                |
| --------------------------- | ------------------------------------------------------- | ----------------------------------- | ---------------------------------------------------------------------- |
| `HERO`                      | "Sprint 42 · Day 9 of 14", release banner               | sprint/release: **none**            | **De-fiction** → project name + generic greeting (no fake sprint/date) |
| `ACTION_QUEUE`              | summary counts                                          | defects ✅ / reviews ✗              | **PARTIAL** — wire defect count; rest "coming soon"                    |
| `ACTIVE_RUNS`               | "Refund regression suite … 42 cases"                    | `api/test-runs` ✅                  | **WIRE** (verify shape) or empty "No active runs"                      |
| `RELEASE_RISK`              | "R-2026-04-PaymentV2" risk card                         | **none**                            | **Coming soon** or HIDE                                                |
| `AI_NARRATIVE`              | "A1 drafted 8 cases from RET-137"                       | **none** (no narrative ep)          | **Coming soon**                                                        |
| `QUEUE_ROWS` / `QUEUE_TABS` | Your Queue: AI-reviews / clarifications / defect-triage | defects ✅ / AI-review ✗ / clarif ✗ | **PARTIAL** — defect-triage lane wireable; other lanes "coming soon"   |
| `EVIDENCE_THREAD`           | right-rail "Recent Agent Activity"                      | `api/audit` ✅ (agent actions)      | **WIRE** (filter audit to agent actors) or empty                       |
| `PINNED_REFS`               | Pinned References sidebar                               | **none**                            | **Coming soon** or HIDE                                                |
| `RECENT_RUNS`               | recent run chips                                        | `api/test-runs` ✅                  | **WIRE** or empty                                                      |
| `SUGGESTED_NEXT`            | next-action suggestion                                  | **none**                            | **Coming soon** or HIDE                                                |

**Home net:** 3 WIRE-able (runs ×2, agent-activity via audit), 2 PARTIAL (action-queue, your-queue — defect portions), 5 coming-soon/hide (hero-sprint, release, AI-narrative, pinned, suggested).

## B. Other admin Pattern-A surfaces (from Phase-B matrix, unchanged)

- **F27 Recent Activity feed** (`F27_RECENT_ACTIVITY`) — `api/audit` ✅ → **WIRE** (Sweep-C follow-up).
- **F27 team roster** — `api/users` ✅ exists + `useAdminUsers` hook unused → **WIRE** (currently canned).
- **F26m1 LLM config / `/admin/settings/providers`** — `api/admin/config/llm-providers` ✅ → **WIRE** or coming-soon.
- **F26 agents page** activity/health — agent runs (no clean ep) → **coming soon**.
- **F14 requirements** (`STUB_REQUIREMENTS`) — `api/requirements` ✅ → **WIRE** or empty.
- **F17 test-cases list** — `api/test-cases` ✅ → **WIRE** or empty.
- **F19/F20 run console + results** — `api/test-runs` ✅ → **WIRE** or coming-soon (live WS is M-later).
- **F23 reports / F25 executive** — M5 surfaces; canned previews → **coming soon** (label).
- **`/admin/users` edit/more buttons, ⌘K 404 links, ~20 `href="#"`** — dead controls → wire-or-label (Phase-B W4).

## C. Invite form pre-fill + pending table

- Invite modal pre-fill → **FIXED** (#278, empty default).
- F27 pending invites → **FIXED** (#283, live `/api/invitations`).

## D. RSC 404s

Resolved as stale-deploy churn (J/D findings); re-verify only on a settled deploy. `health/lite` now exists (earlier 404 was stale).

---

## Recommendation (Yogesh's call)

**Most "no dummy data" value per hour:** wire the surfaces whose endpoints exist (runs via `api/test-runs`, recent-activity + F27-activity via `api/audit`, F27 roster via `api/users`, F14/F17 lists), and **de-fiction the hero + mark the genuinely-unbacked cards (release, AI-narrative, pinned, suggested) "coming soon."** The 5 unbacked surfaces have NO endpoint → honest "coming soon" is the only truthful option short of building M-later BE.

_All wires gated on the live DB (Neon suspended → Supabase Sat) to actually render data; canned fallback holds until then._
