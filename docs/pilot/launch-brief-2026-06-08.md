# QA Nexus PM1 MVP — Pilot Launch Brief (Mon Jun 8, 2026)

> **Audience:** Yogesh (Admin) + 8-user Iksula pilot team.
> **Status:** FILLED Sat Day-3+4 2026-06-06 evening. §5 (known limits) + §7 (feedback channel) populated with BE+1 Day-3-4 results + Yogesh ratified channel decision. Ready for Sun smoke + Mon launch.

---

## §1 — What is QA Nexus PM1 MVP

QA Nexus is a purpose-built QA platform for Iksula's test management workflow. PM1 MVP delivers: AI-assisted test case generation (Composer A1), duplicate detection (Curator A2), 5-layer root cause analysis (Sherlock A4), Jira bi-directional sync, reports studio, and a full knowledge base — all running on a $0/month infrastructure stack (Render Free + Neon Free + Groq Free + Cloudflare R2 Free).

The Mon Jun 8 pilot puts this in the hands of your 8-person QA team for daily use on the Iksula Returns (RET) project.

## §2 — Pilot team (8 users)

| #   | Name           | Org role    | RBAC role   |
| --- | -------------- | ----------- | ----------- |
| 1   | Akshay Panchal | QA Lead     | Lead        |
| 2   | Yogesh Mohite  | Sr QA       | Admin       |
| 3   | Kishor Kadam   | QA Engineer | QA Engineer |
| 4   | Nitin Gomle    | QA Engineer | QA Engineer |
| 5   | Nadim Siddiqui | QA Engineer | QA Engineer |
| 6   | Govind Daware  | QA Engineer | QA Engineer |
| 7   | Mohanraj K.    | QA Engineer | QA Engineer |
| 8   | Sagar Todankar | QA Engineer | QA Engineer |

## §3 — Day-1 onboarding flow

1. **Magic-link sign-in** — user receives email via Resend (F06); clicks link; lands on verify page (F07)
2. **Onboarding modal** — first-time setup: name + avatar + preferences
3. **Home landing** — F08 Home with project switcher defaulting to Iksula Returns (RET)
4. **First action** — navigate to Requirements (F14) or Test Cases (F16a) to see the seeded data

## §4 — Surfaces ready for pilot

| Frame    | Page                                | Status                                     |
| -------- | ----------------------------------- | ------------------------------------------ |
| F06      | Sign In                             | ✅ shipped M1                              |
| F07      | Verify                              | ✅ shipped M1                              |
| F08      | Home                                | ✅ shipped M2                              |
| F09      | Projects List                       | ✅ shipped M2                              |
| F12-F13  | Knowledge Base (list + detail)      | ✅ shipped M3                              |
| F14      | Requirements                        | ✅ shipped M3                              |
| F15      | Knowledge Base v2 (canonical shell) | ✅ shipped M3                              |
| F16a/b/c | Test Cases (list + detail + runs)   | ✅ shipped M4                              |
| F18      | Test Suites                         | ✅ shipped M4                              |
| F19      | Run Console                         | ✅ shipped M5                              |
| F20      | Run Results                         | ✅ shipped M4                              |
| F21      | Defects Hub                         | ✅ shipped M4                              |
| F22      | Defect Detail                       | ✅ shipped M5                              |
| F23      | Reports Studio                      | ✅ shipped M5                              |
| F25      | Executive Dashboard                 | ✅ shipped M5                              |
| F26      | Agents                              | ✅ shipped Day-2 pilot-prep                |
| F27      | Users & Roles                       | ✅ shipped Sat Day-3+4                     |
| F28      | Settings & Audit                    | ✅ shipped M5                              |
| F26m1    | LLM Provider Setup modal            | ✅ shipped Sat Day-3+4                     |
| F28m1    | LLM Provider Config modal           | ✅ shipped Sat Day-3+4                     |
| F26m2    | Curator Detail modal                | ⏳ Sat evening (defer post-pilot if slips) |
| F27m1    | Invite User modal                   | ⏳ Sat evening                             |

## §5 — Known limits / deferred items

- **R-001:** client-side admin guard only (server-side → M6/MS0-T021). Pilot is honor-system for 8 trusted users.
- **R-002:** Sherlock A4 RCA p95 ~18s (pilot gate <20s per ADR-024; GA gate <15s deferred to M6).
- **Email sender (ADR-025):** magic-link email is sent via the Apps Script bridge from `yogesh.mohite@iksula.com` (Workspace 1,500 recipients/day). Migration trigger: when Iksula IT verifies `mail.qanexus.iksula.com` in Resend → flip `EMAIL_PROVIDER=resend` env var, Render auto-redeploys, Apps Script bridge stays as fallback. See `docs/architecture/adr-025-pilot-email-via-apps-script-bridge.md`.
- **NFR-003 production verification deferred to Day-29** — `NFR_PROBE_TOKEN` mechanism is code-ready (PR #238 documents the followup); production A1/A2 measurement on the Render-co-located runner runs in the Day-29 followup window, NOT during the pilot. Pilot-tier gate per ADR-024 holds.
- **FE Home page (`/home/`)** renders stub data, not API-backed yet. Day-29 followup for FE+1; pilot users see static demo content on the Home landing surface (functional nav unaffected).
- **F26 Agents page — Phase-3 modal interactions** (deep config editor flows beyond the F26m1/F28m1 setup-and-config modals) are scoped post-pilot. F26 view + F26m1 + F28m1 cover the pilot surface; F26's Phase-3 cfgModal hooks remain TODOs.
- **F26m2 Curator Detail modal** — shipping Sat evening if FE+1 has time; if not, the F26 Agents parent page already shows the Curator card without the drill-in detail. Defer post-pilot if Sat ship slips.
- **`mail.qanexus.iksula.com` Resend domain verification** — Iksula IT dependency; outside Yogesh's DNS edit access. Drives ADR-025 above. Long-poll for IT verification post-pilot.
- Modal Batch A shipped Sat (F26m1 + F28m1, PRs #236/#237). Modal Batch B (F26m2 + F27m1) in flight Sat evening; parent pages function without these modals.

## §6 — Pilot operating window

- **7 days/week, 10:00 AM — 10:00 PM IST** (12-hour daily window including weekends)
- **UptimeRobot 5-minute keep-alive** on `/health` covers the full window
- Render Free scale-to-zero outside operating hours; first request after cold start takes ~15-30s
- Neon Free scale-to-zero; first DB query after cold wake takes ~2-5s

## §7 — Feedback collection

Pilot users report bugs / questions / feedback via email to `yogesh.mohite@iksula.com`. Yogesh triages in Gmail with labels (P0 bug / P1 bug / question / feature request) and either resolves directly or routes to BE+1/FE+1 via Claude Code. Migration target post-pilot: `qa-nexus-pilot@iksula.com` group alias when Iksula IT verifies.

## §8 — Mon Jun 8 D-day timeline

| Time (IST) | Action                                                                                                                 | Owner                   |
| ---------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| 09:00      | Yogesh sends magic-link invite emails to 8 users via Resend                                                            | Yogesh                  |
| 09:15      | Verify first 2-3 sign-ins successful (check Resend delivery logs + BetterAuth session table)                           | Yogesh + BE+1 on-call   |
| 09:30      | Team standup — introduce QA Nexus, walk through F08 Home → F14 Requirements → F19 Run Console → F21 Defects happy path | Yogesh                  |
| 10:00      | Open floor — team explores freely, reports issues to feedback channel                                                  | All 8                   |
| 12:00      | First check-in — any P0 issues? Quick fix cycle if needed                                                              | Yogesh + agents on-call |
| 15:00      | Afternoon check-in — usage patterns, confusion points, any feature requests                                            | Yogesh                  |
| 18:00      | Day-1 pilot wrap — collect feedback, file P1/P2 issues for next day                                                    | Yogesh                  |

## §9 — Rollback plan

If a P0 surfaces during pilot:

1. **Identify** — user reports via feedback channel; Yogesh triages severity
2. **Hotfix path** — agent branches from main → fix → flat-base PR → Yogesh visual gate → squash-merge to main
3. **Deploy** — Cloudflare Pages auto-deploys on main push (FE); Render auto-deploys (API). ~2-5 min from merge to live.
4. **Verify** — user confirms fix on the live URL
5. **If hotfix impossible in <1 hr** — revert to last known good main commit: `git revert <bad-commit> && git push origin main`. Cloudflare + Render auto-deploy the revert. Alert users: "We've rolled back a change; the feature will return tomorrow."

---

_Skeleton authored Day-3 2026-06-04. Filled Sat Day-3+4 2026-06-06 evening with all pilot-prep deferrals + Yogesh-ratified email feedback channel. Sun smoke (Yogesh-driven) → Mon Jun 8 D-day launch._
