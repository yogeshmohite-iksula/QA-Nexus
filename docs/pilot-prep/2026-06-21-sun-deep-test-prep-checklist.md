# Yogesh Deep-Test — Prep Checklist (target Sun 2026-06-21)

> **Author:** MAIN · **Date:** Thu 2026-06-18 (prep ahead of Sun) · **Scope:** Yogesh's **solo deep test** (precedes the 7-user team invite in `docs/briefs/yogesh-deep-test-cycle.md`).
> **Binding gate:** the test cannot run with real data until the **DB is unlocked** (Path C = `qa-nexus-2` Neon project, active since Thu Jun 18; original `qa-nexus` auto-resumes Jul 1) **and Render is redeployed** (see §A). Until then every data surface shows Pattern A canned fallback (46th RC). _(PR #285 Supabase plan CLOSED per 49th RC — Path C supersedes.)_
> **Discipline:** every "✅ works" requires the **network-tab check** (46th RC) — open DevTools → Network on the live `pages.dev`, confirm the request hits `qa-nexus-api.onrender.com` + 2xx + REAL data, not canned fallback. Playwright-pass / page-renders ≠ verified.

---

## §A — Pre-flight gates (MUST clear in order before testing)

- [ ] **1. DB unlocked.** Path C active: `qa-nexus-2` Neon project should be live (created Thu Jun 18, BE+1 Path B migration). Confirm: `curl -s https://qa-nexus-api.onrender.com/api/projects` returns **5 real Iksula projects**, not empty/canned. If Path B PR not yet merged, check `gh pr list` for status.
- [ ] **2. Render redeployed `04c73ea`+.** Currently STALE (v0.0.1, `/health/lite` 404). Render dashboard → Manual Deploy. Confirm: `curl .../health/lite` → **200**.
- [ ] **3. Pages bundle current.** Confirm FE on `cb1ed3a`+ (the #277 prod-baseURL fix). Network-tab: F09 switcher request → host = `onrender.com`, not `localhost`.
- [ ] **4. Identity regression guard (P0-001).** Fresh incognito → sign in `yogesh.mohite@iksula.com` → user pill = **"Yogesh M. · ADMIN"** (NOT "Kishor K."). Wrong identity → STOP + escalate.
- [ ] **5. Auth gate (P0-A).** Signed-out → any `/(app)` route redirects to `/sign-in` (not the Admin surface).

**If any gate fails → do not proceed; log it as P0 and fix-first.**

---

## §B — Per-surface deep-test (click every surface; network-tab each data call)

| #   | Surface                   | What to verify (real data, network-tab)                                             | Decision ref |
| --- | ------------------------- | ----------------------------------------------------------------------------------- | ------------ |
| 1   | **F08 Home**              | loads; project switcher defaults to **Iksula Returns (RET)**; no nav-trap (B-b)     | —            |
| 2   | **F09 Projects switcher** | shows **5 real** projects (RET/CART/PAY/AUTH/OPS); request → `/api/projects` 200    | P0-B         |
| 3   | **F14 Requirements**      | seeded **RET-###** rows render from API (not Priya/Ravi fiction)                    | P0-C         |
| 4   | **F16 Test Cases**        | TC-RET-### list; A1 Composer generate (Groq) returns a draft                        | FR-006/007   |
| 5   | **F19 Run Console**       | happy-path run executes; states update                                              | FR-010       |
| 6   | **F21 Defects Hub**       | **25 real** defects via `/api/defects` (#276 wire); A4 Sherlock RCA renders         | FR-011/012   |
| 7   | **F27 Users & Roles**     | **8 real** users from `/api/users` (not canned "8 members · Priya Tiwari")          | —            |
| 8   | **F28 Settings & Audit**  | audit count = **real ~158** (NOT canned 47k); HMAC chain badge                      | Finding I    |
| 9   | **Sign-out**              | returns cleanly (not 405); session actually clears (re-visit → /sign-in)            | Finding H    |
| 10  | **RSC routes**            | no React Server Component 404s on /admin/\* (41st RC: confirm current bundle first) | Finding J    |

---

## §C — Invite-flow test (Decision A — M1-mandated)

- [ ] **Send ONE test invite** via F27m1 Invite User modal to a **⟦confirm-with-Yogesh test address⟧** (NOT a real teammate yet — this validates the pipe before the 7-user send).
- [ ] Confirm the **Apps Script bridge** sent it (execution history) + the email landed.
- [ ] Click the invite link → **set-password** round-trip → new user can sign in.
- [ ] Network-tab: the invite POST → `/api/users/invite` (or confirmed path) returns **201** (#273 wire).
- [ ] **Only after this passes** does the 7-user team send (deep-test-cycle brief §08:30) become safe.

---

## §D — Issue log template (file each finding)

Log to `docs/pilot/2026-06-21-sun-deep-test-findings.md` (create on test day). One block per issue:

```
### [P0|P1|P2] <short title>
- Surface / route: F__ · /app/<route>
- Steps to reproduce: 1… 2… 3…
- Expected: …
- Actual: … (network-tab: request URL + status + canned-or-real)
- Screenshot: docs/screenshots/2026-06-21-<slug>.png (320 + 1440 per Rule 13)
- Severity rationale: P0 = blocks the workflow · P1 = wrong/missing data, workaround exists · P2 = cosmetic/polish
- Owner: BE+1 | FE+1 | MAIN
```

**Severity bar:** P0 = launch-blocker (fix-first, hotfix path in deep-test-cycle brief §P0). P1 = pre-team-invite fix. P2 = backlog.

---

## §E — Screenshot convention (Rule 13)

- Save to `docs/screenshots/2026-06-21-<surface>-<viewport>.png`; capture **320px + 1440px** for any UI finding.
- For a data-correctness finding, also screenshot the **DevTools Network panel** showing the request URL + status (this is the 46th-RC evidence).

---

_Authored Thu 2026-06-18 ahead of the Sun deep test. The §A pre-flight gates are the real story: code is GREEN-structural, the DB is the single gate. Once DB+Render are live, §B/§C is a ~1-2 hr click-through with the network-tab discipline. The test-invite address in §C is flagged for Yogesh (Rule 11 — not invented)._
