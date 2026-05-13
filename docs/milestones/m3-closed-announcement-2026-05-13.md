# M3 Closed — 2026-05-13

**To:** Yogesh Mohite (Admin), Akshay Panchal (QA Lead), Iksula leadership
**From:** QA Nexus PM1 build team (BE+1, FE+1, MAIN orchestration)
**Status:** ✅ Milestone 3 (Test Cases + AI Generation) **closed** Wednesday 13 May 2026, 10:30 IST

---

## What just shipped

QA Nexus now writes test cases for you.

The Knowledge Base from M2 is no longer just searchable — it's an active input. Type a requirement, click **Generate**, and an AI agent ("Composer") drafts 5 candidate test cases grounded in your project's KB content. A second agent ("Curator") flags near-duplicates so you don't get noise.

A QA engineer at Iksula can now go from "I just wrote requirement RET-247" to "I have 5 reviewable test-case drafts citing the actual policy doc" in **under 20 seconds**.

## What's live in production

- **Requirements** — Full CRUD page (F14), modals for edit / link-to-test-case / convert-to-Jira, and a right-side detail drawer.
- **Test Cases** — Method chooser modal (manual / AI / import), AI generation page wired to the real Composer agent, bulk import modal (manual paste flow).
- **Composer (A1)** — Real `gpt-oss-120b` via Groq; ADR-013 locked the prompt strategy + retry chain.
- **Curator (A2)** — Real pgvector cosine similarity dedup; ADR-014 locked thresholds.
- **AdminShell v2** — Polished nav-icon canon across every authenticated page.
- **Auth** — Magic-link sign-in functional end-to-end via Resend (replaced Render-blocked SMTP).

## By the numbers

| Metric                  | Value                                                      |
| ----------------------- | ---------------------------------------------------------- |
| Calendar duration       | 6 days (Fri 8 May → Wed 13 May)                            |
| Working days            | ~3.6 days                                                  |
| PRs merged              | **42** (project record sprint)                             |
| New tests added         | +6 BE jest suites; RWD sweep new                           |
| New frames live         | 8 (F14, 3 modals, drawer, F16a/b/c)                        |
| Cumulative frames live  | 32 of 46 locked frames                                     |
| Production deploys      | First Cloudflare auto-deploy success in 100+ workflow runs |
| **Infrastructure cost** | **$0.00/month** (Hard Rule 1 preserved)                    |

## What was hard

Two stories worth knowing about:

1. **The 3-PR Cloudflare deploy unlock.** For the entire history of the project, the auto-deploy workflow had been silently failing. Every M1+M2 PR that merged successfully was producing a green CI but never actually publishing to `qa-nexus-web.pages.dev`. On Day-14 (Saturday), the diagnostic chain (#102 → #103 → #104) found three stacked failure modes: missing shared-package build, pnpm 10 workspace-root conflict, and Node 22 wrangler requirement. Production went from "M0-era only" to "all 32 frames live" in 26 minutes once fix #3 landed.

2. **The 5-fix BetterAuth chain.** Magic-link auth crossed the wire successfully on Day-15 morning, but each user attempt revealed a new layer. Five PRs (#119 → #120 → #122 → #123 → #124) plus a sixth on Day-17 (#129) addressed: BE Express mount narrowness, FE basePath misalignment, Cloudflare env-var injection bug, missing trustedOrigins, BetterAuth 1.4.x CORS preflight regression, and finally relative-vs-absolute callbackURL. Each fix was small. The chain was the lesson: any auth-stack version bump deserves end-to-end smoke before merge.

Both stories now live in our halt-to-root-cause pattern catalog (close report §9).

## What's next

- **M4 — Runs, Defects & Jira** kicks off Wednesday afternoon, 4-day compressed sprint targeting Saturday 16 May close.
- Adds: Test Run console (F19), Run Results (F20), Defects Hub (F21), Defect Detail (F22), Test Suites (F18 + m1), Sherlock (A4) defect-RCA agent, real Jira Cloud 2-way sync.
- Compression rationale: M3 absorbed 1 extra day (quota + auth chain); M4 needs to recover the schedule. Original Sat targets restored.

## Sign-off

- **Tag:** `m3-closed-2026-05-13` at commit `9c28610`
- **Close report:** `docs/milestones/m3-close-report.md`
- **Retro:** `docs/retros/2026-05-13-m3-retro.md` (covers M2 + M3)

---

_Thanks to BE+1 and FE+1 for the cleanest cascade-rebase choreography to date. Day-15's 15-PR record day stays the high-water mark._
