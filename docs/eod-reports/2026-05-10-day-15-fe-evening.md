# EOD addendum — Day 15 FE evening (2026-05-10)

**Author:** FE+1 (Claude Code)
**Window:** ~17:00 IST – 22:00 IST (~5 hr post-original-EOD)
**Original EOD:** `2026-05-10-day-15-fe.md` (covers 12:30–17:00 — shipped via PR #118 merged at 9b6427e)

This addendum captures Day-15 work that happened AFTER the original EOD was committed. Per `docs/eod-reports/README.md` convention for multi-session days.

---

## Completed today (post-original-EOD)

### Magic-link auth saga — 3 PRs

When BE+1's Path C (#115) went live and Yogesh ran cross-FE E2E, the magic-link sign-in still 404'd. Three PRs untangled it:

- **PR [#120](https://github.com/yogeshmohite-iksula/QA-Nexus/pull/120) — `fix(web): align BetterAuth client basePath with BE-canonical /auth`** — discovery-first audit caught FE auth client missing `basePath: '/auth'` (BetterAuth defaulted to `/api/auth` while BE serves `/auth`). Closes followup `(bc)`. **MERGED at 11:19:17Z (commit `dd2dc48`).**
- **PR [#122](https://github.com/yogeshmohite-iksula/QA-Nexus/pull/122) — `fix(web): hardcoded baseURL fallback for Cloudflare env-var bug`** — even after #120, magic-link still hit `pages.dev` origin instead of Render API. Root cause: Cloudflare Pages × Next.js 15 `NEXT_PUBLIC_*` env-var injection bug — `NEXT_PUBLIC_API_BASE_URL` was set in Pages dashboard, deployment succeeded, but the value did NOT bake into the JS bundle. Defense-in-depth fix: `process.env.NEXT_PUBLIC_API_BASE_URL || 'https://qa-nexus-api.onrender.com'`. Filed followup `(be)` for proper M5 Cloudflare investigation. **MERGED at 12:11:01Z (commit `cd857c9`).**
- Cascade rebases of #117 / #118 / #120 against post-#121 main (gitleaks allowlist fix) — all CHANGELOG-only conflicts, identical "keep both" sed resolution. All merged subsequently.

### Cross-FE E2E debugging session

Yogesh tested magic-link on `89c44180.qa-nexus-web.pages.dev/auth/sign-in/magic-link` — 405 Method Not Allowed. Diagnosis:

- `89c44180` is a Cloudflare Pages **preview deploy SHA prefix** built from a commit predating #122
- The preview bundle didn't include the `baseURL` fallback → resolved to `undefined` → BetterAuth fell back to same-origin `pages.dev` → POST hits a static asset path → 405
- **Fix is already on main** (`cd857c9`) — needs Cloudflare Pages production rebuild OR preview deploy from a post-#122 commit
- Documented diagnosis with 3-step recovery plan (test prod URL · test latest preview · force prod rebuild)

### Day-15 PR ledger (final, 9 PRs touched)

| PR                     | Title                               | State     |
| ---------------------- | ----------------------------------- | --------- |
| #110 #111 #113 cascade | Day-14 ports                        | ✅ MERGED |
| #116                   | F16b Pattern B flip (Composer wire) | ✅ MERGED |
| #117                   | RWD verification sweep (28 PNGs)    | ✅ MERGED |
| #118                   | Day-15 FE EOD + M3 retro            | ✅ MERGED |
| #120                   | Auth basePath fix                   | ✅ MERGED |
| #122                   | Auth baseURL fallback               | ✅ MERGED |

---

## In flight

- **Cloudflare Pages production rebuild** — needs to pick up `cd857c9` so `qa-nexus-web.pages.dev` (no SHA prefix) serves the bundle with the fallback. Yogesh has visibility on Pages dashboard.
- **Cross-FE E2E retry** — pending fresh prod deploy.

---

## Blockers

**One residual ops item:** Cloudflare Pages production deploy of `cd857c9`. Once it lands, magic-link sign-in works end-to-end. No code-side blockers.

---

## Tomorrow (Day 16)

- Cross-FE E2E retry once prod rebuild lands
- F14m2 Curator Pattern B flip (Day-16 task per existing M3 plan) — wire near-dup banner to `POST /test-cases/:tcId/duplicates` (Curator real pgvector from PR #112). Mirror PR #116's stubbed-mode-aware Pattern B pattern.
- M5 followup `(be)` planning — Cloudflare Pages × Next.js 15 env-var injection investigation
- M5 followup `(ay)` planning — F16c bulk-create endpoint design with BE+1

---

## Free-tier quota usage (cumulative Day-15)

| Provider                      | Usage today                           | Free-tier ceiling | Headroom |
| ----------------------------- | ------------------------------------- | ----------------- | -------- |
| Cloudflare Pages (FE deploys) | ~6 deploys (6 merged PRs + 2 retries) | 500/month         | 99%      |
| GitHub Actions (CI minutes)   | ~50 min across ~12 PR pushes          | 2000 min/month    | 97%      |
| Render (API dyno hours)       | n/a (BE+1 stream)                     | 750 hr/month      | n/a      |
| Groq (RPD)                    | ~5 calls (route-mocked sweeps)        | 1000 RPD          | 99.5%    |

No free-tier breaches.

---

## Notes

- 9-PR Day-15 was unusually busy — 4 cascade rebases, 1 strategic deferral (D3 → M5), 2 ship PRs (D2 + D4), 1 docs PR (EOD + retro), 2 auth-fix PRs (basePath + baseURL fallback). All shipped clean with 5/5 pre-push gates.
- Discovery-first pattern (lesson 4 in `2026-05-10-m3-close-day-learnings.md`) fired twice today — caught F16c bulk-create gap (PR #95 mismatch) AND BetterAuth basePath gap (FE/BE alignment) before any code burn. Highest-ROI engineering pattern of M3.
- Cloudflare Pages env-var injection bug (`(be)`) is a meaningful M5 hygiene item — same `NEXT_PUBLIC_*` pattern is used in `users-api.ts` without prod fallback, so similar runtime drift could hit other surfaces.
- All Hard Rules stayed binding throughout — API 400 image protocol (0 fullPage screenshots), Hard Rule 11 (paused for Yogesh on D3 endpoint gap), Hard Rule 15 (PR #116 visual surface unchanged from PR #110 v2 HTML port).

Day-15 closed. Signing off.
