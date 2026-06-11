# BE Preemptive Sweep Notes — Thu 2026-06-11 (pre-baseline for the zero-trust audit)

> **Scope:** two memory-pattern-driven correctness sweeps run the night before the Fri zero-trust
> audit. Safe + read-only + no triage priorities required. **NOT** the full zero-trust audit —
> that's Phase A (gated on the Fri 9:30 IST triage). This file is referenced from the eventual
> Phase C deliverable `docs/audits/2026-06-12-fri-be-zero-trust-conformance.md`.
> **Base:** `origin/main` HEAD `cb1f2c4` (#259 merged).

## Sweep 1 — `better-auth/plugins` mock-factory completeness (all auth specs)

**Pattern applied:** `feedback_ts_jest_esm_cjs_better_auth.md`. A `jest.mock('better-auth/plugins',
factory)` REPLACES the module; any export the factory omits resolves `undefined` at the import site.
`auth.config.ts:25` imports `{ customSession, magicLink }`, so every factory must export both.

**Method:** for each spec that mocks `better-auth/plugins`, check the factory exports `customSession`.

| Spec                                       | `customSession` in factory           | Verdict               |
| ------------------------------------------ | ------------------------------------ | --------------------- |
| `auth/__tests__/send-magic-link.spec.ts`   | ✅ present                           | clean (fixed in #259) |
| `auth/__tests__/t021-auth.config.spec.ts`  | ✅ present                           | clean (fixed in #259) |
| `auth/__tests__/auth.service.day0.spec.ts` | ❌ **missing** → **FIXED (PR #263)** | latent gap            |

**Finding:** `auth.service.day0.spec.ts` mocked `better-auth/plugins` as `{ magicLink: jest.fn() }`
only. **Passed today** because the day0 spec bypasses `buildAuth` (injects `svc.auth` directly), so
`customSession` is never _called_ — but the factory was incomplete, so any future day0 test that
exercises `buildAuth`/`onModuleInit` would throw `customSession is not a function`. **Closed the
LAST instance of the #259 class** by adding the `customSession` stub (matching the
send-magic-link/t021 style). PR #263, full suite 60/60 · 697/697 green.

**Class status: CLOSED.** All 3 specs that mock `better-auth/plugins` now export both required names.

## Sweep 2 — Nest DI module-import audit (all controllers)

**Pattern applied:** `feedback_nest_di_module_import_vs_unit_mock.md`. A controller that injects a
service (or uses `@UseGuards`) needs its `*.module.ts` to import the module that EXPORTS that
provider; unit specs that `useValue`-provide the dep pass even when the real graph can't resolve it
(false green) — only a runtime boot catches it.

**Method (efficient-audit inference, no grep needed):** the CI **`playwright` job boots the real API
("Start API in background")**, and that job is **GREEN at `cb1f2c4`**. A controller with an
unresolvable dependency crashes `NestFactory.create` → the API never starts → that job fails.
Therefore a green boot is airtight proof that **every controller currently on `main` has a fully
resolvable DI graph.** (Cross-ref #262: the one controller whose DI was broken — `DefectsController`
gained `AuthService`+`RolesGuard` but `DefectsModule` didn't import `AuthModule` — failed exactly
this boot check on its PR, and is fixed there, not on main.)

**Result: CLEAN on `main`.** No grep required; the boot-test green IS the proof. The pattern is now a
checklist item for any future controller-dependency change (verify the module import; locally,
boot against a bogus `DATABASE_URL` → `[RoutesResolver] XController` log = DI ok, `P1001` after = fine;
macOS has no `timeout`, use `perl -e 'alarm N; exec @ARGV' node dist/main`).

## Summary

- **Specs/controllers audited:** 3 auth specs (Sweep 1) + full controller set via boot-inference (Sweep 2).
- **Net new findings:** **1** (day0 incomplete mock factory) — **FIXED before logging** (PR #263).
- **Net new reality-check:** **#38** — Nest-DI boot-test inference (green boot ⇒ clean DI graph, no grep).
- **Open launch-blockers from these sweeps:** 0.
- **Carry-forward to Fri zero-trust audit (Phase B/C):** none from these two sweeps; the broader B1-B10
  dimensions (RLS, audit REVOKE, stub guards, etc. — from the Day-32 audit `2026-06-11-day-32-be-full-conformance-audit.md`)
  remain for the post-triage run.
