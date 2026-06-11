# BINDING RULE — P0-001 closure cascade (dual-layer auth-identity fix + mock-factory completeness)

**Type:** feedback · **Filed:** Thu 2026-06-11 ~16:45 IST · **Closed:** P0-001 verified live Thu 2026-06-11 4:16 PM IST

## The bug

P0-001: every signed-in user's pill rendered "Kishor K. · QA ENGINEER" regardless of who actually signed in. Surfaced Sun Jun 7 in Yogesh's fresh-incognito smoke. Initially mis-hypothesized as a stale deploy (see `feedback_stale_deploy_diagnosis_pattern.md`); proven a real cross-layer bug by fresh-incognito re-verify after redeploy.

## The dual-layer (actually tri-layer) fix pattern

A cross-site auth-identity bug on a split deploy (`pages.dev` FE ↔ `onrender.com` API) needed **three** coordinated layers — no single layer alone would fix it:

1. **BE infra (#256)** — cross-site session cookie + `/api` CORS. Without `SameSite=None; Secure` + `Access-Control-Allow-Credentials`, the session cookie never reached the browser cross-site → the FE session hook had nothing to read.
2. **FE wire (#258)** — Pattern-B session wire; remove the canned "Kishor K." persona fallback. The FE was defaulting to a canned persona when the session hook returned undefined (which it always did, because of layer 1).
3. **BE app fields (#259)** — `customSession` plugin to surface `role`/`displayName`/`organizationalLabel`. These live on the **separate** TB-002 `users` table, NOT BetterAuth's `auth_user` table (the `auth_*` tables are intentionally distinct). `additionalFields` can't surface them (they aren't on `auth_user`); the `customSession` `after` hook joins TB-002 by email per session read.

**Lesson:** when a bug spans infra + framework-wire + app-data layers, fixing any one or two leaves it visibly broken. Diagnose the full stack before declaring a fix; verify the END state (fresh incognito, real session), not the individual layer merges.

## BE+1's 36th reality-check — incomplete-mock-factory pattern

#259's CI failed with `TypeError: (0, plugins_1.customSession) is not a function`. Two diagnoses:

- **MAIN (layer-off):** hypothesized ts-jest ESM/CJS module-resolution interop. Isolation was RIGHT (jest-only, production-safe — verified via Node `require('better-auth/plugins')` → `customSession` is a `function`, proving production wouldn't crash). Layer was WRONG.
- **BE+1 (36th RC, correct):** the spec uses `jest.mock('better-auth/plugins', factory)`. **A `jest.mock(module, factory)` factory REPLACES the entire module** — any symbol the factory omits becomes `undefined`. The factory exported only `magicLink`, so `customSession` resolved `undefined` under the mock. BE+1 also found a **2nd file** (`send-magic-link.spec.ts`) with the same gap by running the full local suite (the CI summary surfaced only the first). Fix: 1-line `customSession` stub in both factories. Zero auth logic touched.

**Binding rule:** a `jest.mock(module, factory)` factory must export **every** symbol the unit-under-test imports from that module. An omitted export silently becomes `undefined` and presents at the call site as "X is not a function" — easily mis-read as an ESM/CJS interop bug. When you add a new import to a module that is `jest.mock`'d elsewhere, grep for `jest.mock('<that-module>'` across the suite and patch every factory.

## How to apply

- **Cross-layer auth bugs:** map FE↔API↔DB before fixing; verify the end-state in a fresh incognito session, not the layer merges.
- **`jest.mock` + new import:** `grep -rl "jest.mock('<module>'" apps/*/src` → patch every factory to export the newly-imported symbol.
- **"X is not a function" in a spec that mocks X's module:** suspect an incomplete mock factory FIRST (cheap to check), before ESM/CJS interop (expensive to investigate).

## Cross-references

- `feedback_stale_deploy_diagnosis_pattern.md` (10th — the initial mis-diagnosis + the mandatory fresh-incognito verification step that caught it)
- `feedback_independent_diagnosis_convergence.md` (13th — MAIN + BE+1 converged on "production-safe" via different evidence; diverged on the precise layer, which is healthy refinement)
- `feedback_chained_base_cascade_resolution.md` (the memory.md merge-wave Round 6 cascade resolved Thu)
- `feedback_ts_jest_esm_cjs_better_auth.md` (if present — sibling jest/better-auth gotcha)
- PRs #256 + #258 (Sun Jun 7) + #259 (Thu Jun 11) · BE+1 36th reality-check · verified live Thu 4:16 PM IST

_Authored Thu 2026-06-11. 14th week pattern (mock-factory completeness) folded into the P0-001 closure narrative. Reality-check cumulative: 36._
