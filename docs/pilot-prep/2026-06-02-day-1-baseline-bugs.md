# Day-1 Baseline Integrity Check — Tue Jun 2, 2026

> Purpose: catalogue any P0/P1 bugs found during BE+1 / FE+1 baseline
> verification before pilot prep build work begins Day 2-4.
> 5-day push: Tue Jun 2 → MVP pilot delivery Mon Jun 8.

## P0 (blocks pilot — MUST fix before Mon Jun 8)

- [ ] _none yet_

## P1 (degrades pilot — SHOULD fix before Mon Jun 8)

- [ ] _none yet_

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
