# Day-1 Baseline Integrity Check — Tue Jun 2, 2026

> Purpose: catalogue any P0/P1 bugs found during BE+1 / FE+1 baseline
> verification before pilot prep build work begins Day 2-4.
> 5-day push: Tue Jun 2 → MVP pilot delivery Mon Jun 8.

## Yogesh rulings (2026-06-02 ~17:00 IST)

FE+1 baseline surfaced 3 P1 findings; Yogesh ruled on each.

### BUG-001 — Project slug convention split

- **Ruling:** FIX tonight. Standardize on name-slug (`iksula-returns`) across all 10 project sub-routes.
- **Reasoning:** User-readable URLs, REST-friendly, matches PRD canonical naming "Iksula Returns".
- **Implementation:** New `lib/project-slug.ts` helper (`slugFromName` + `projectFromSlug` + `getProjectStaticParams`). 6 files need refactor (kb / imports / upload / sources + Jira step pages). 4 already-correct files (defects / reports / results / runs) also refactor to the shared helper for consistency.
- **Owner:** FE+1, tonight on `fix/web-bug-001-bug-005-slug-and-f22-320px` branch.

### BUG-003 — Client-side admin guard

- **Ruling:** ACCEPT FOR PILOT, defer server-side enforcement to MS0-T021 (M6 scope).
- **Reasoning:** 8-user trusted internal pilot. Admin HTML flash <100ms before JS redirect is low-risk for the known team. Server-side enforcement is M6 scope per CLAUDE.md.
- **Mitigation for pilot:** Document explicitly in `docs/pilot/risks.md` (R-001). Brief note in pilot training doc that the admin UI fence is honor-system in pilot mode.
- **Owner:** Yogesh adds to pilot risks + training doc tonight.

### BUG-005 — F22 Defect Detail horizontal scroll at 320px

- **Ruling:** APPROVED to fix tonight. Yogesh visual gate at end before commit.
- **Reasoning:** Hard Rule 12 RWD binding on all pilot-facing pages. F22 is a core pilot screen.
- **Implementation:** Sherlock RCA stack-trace spans get `word-break: break-all` + `overflow-wrap: anywhere` + wrapper `overflow-x: auto`. Header action row gets `flex-wrap` at <640px.
- **Owner:** FE+1, tonight, same branch as BUG-001 fix.

## P0 (blocks pilot — MUST fix before Mon Jun 8)

- [ ] _none yet_

## P1 (degrades pilot — SHOULD fix before Mon Jun 8)

- [ ] **BUG-001** — Project slug convention split → FIX tonight (FE+1, `fix/web-bug-001-bug-005-slug-and-f22-320px`). See ruling above.
- [x] **BUG-003** — Client-side admin guard → ACCEPTED for pilot, server-side deferred to MS0-T021 (M6). Mitigated via `docs/pilot/risks.md` R-001. See ruling above.
- [ ] **BUG-005** — F22 Defect Detail horizontal scroll at 320px → FIX tonight + Yogesh visual gate (FE+1, same branch). See ruling above.

## P2 (cosmetic / polish — defer to post-pilot)

- [ ] _none yet_

## Verification checklist

- [ ] BE+1: typecheck + lint + build all green
- [ ] BE+1: all integrations CONNECTED in F28 Integrations Health
- [ ] BE+1: F28m1 LLM Provider Setup Day-0 flow works
- [ ] BE+1: RBAC verified for 4 roles
- [ ] FE+1: 41 frames load without 500/404 errors
- [ ] FE+1: AdminGuard verified for 4 personas
- [ ] FE+1: Mobile rendering at 320px verified for top 10 routes

---

_Append findings inline under the P0/P1/P2 buckets with owner + PR ref. MAIN aggregates into the Day-1 status report (`2026-06-02-day-1-status.md`) at EOD._
