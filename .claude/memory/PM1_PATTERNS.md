# PM1_PATTERNS — codified PM1-specific patterns

> Loaded by `inject-memory.sh` when Claude is about to write component code, FE routing, or BE handlers. Patterns established and proven during Day 0–1 builds; deviation requires explicit Yogesh approval.

---

## Pattern A — Deferred routing for onboarding components

**Established:** 2026-04-27 in F07 Founder Onboarding (FE PR #5).

**Rule:** Onboarding-flow components (everything under `apps/web/src/app/(onboarding)/**` and `apps/web/src/components/onboarding/**`) MUST NOT directly call any of:

- `fetch()` / `Fetch API`
- `useMutation()` from TanStack Query
- `axios` (which is also banned by `enforce-pm1-stack.sh`)
- direct `signIn()` / `signUp()` / `signOut()` from BetterAuth

Instead: capture user input + intent, store in local React state or React Context. Route to next step via `router.push()` only — no actual backend write happens during onboarding wizard until the final "Complete" step at the END of the flow, and even then it's a single batched call from the orchestrator component.

**Why:** until MS0-T021 (BetterAuth) lands, the backend doesn't exist yet. Pattern A lets us ship the entire FE onboarding surface (F07 + F07b/c/d) before backend, then wire up real submission via a single integration point. Avoids the "rewrite half the components when backend lands" trap.

**Verification:** before merging any FE onboarding PR, grep:

```bash
grep -rE 'fetch\(|useMutation|axios|signIn\(|signUp\(' apps/web/src/components/onboarding/ apps/web/src/app/\(onboarding\)/
```

Must return zero matches. The PR description should explicitly note "Pattern A: deferred routing — no backend wiring".

**Where to deviate:** the orchestrator component that submits the FINAL step (e.g., `OnboardingComplete` in F07d) is the ONE place that may call `fetch` / mutation. Mark it with a comment `// Pattern A orchestrator — single integration point`.

---

## Pattern B — Visual confirmation gate before commit (CLAUDE.md Rule 13)

**Established:** 2026-04-26 after F06 + F06b RWD iterations where automated checks passed but real-screen rendering revealed slider overflow + browser-extension hydration noise + cramped form spacing.

**Rule:** for every newly developed/refactored screen, BEFORE running `git commit`:

1. Post the local URL (`http://localhost:3000/<route>`) in chat.
2. Capture screenshots at 320 px (iPhone SE) AND 1440 px (typical desktop).
3. Save screenshots to `docs/screenshots/<route>-<width>.png`.
4. Wait for explicit "looks good — commit?" approval from Yogesh.
5. ONLY after approval, run `git commit`.

**Tooling:** the `/ui-check` slash command automates steps 1-3 and halts at step 4.

**Why:** static analysis (typecheck, lint, hooks) catches structural issues but misses runtime rendering bugs that depend on viewport, browser extensions, font loading, or animation timing. Real-eyes-on-real-pixels is the only check that catches this class.

**Where to deviate:** non-visual changes (BE handlers, types, tests, docs, hooks) skip this gate. Only FE component changes that produce a visible diff at any viewport require it.

---

## Pattern C — Full RWD on every ported frame (CLAUDE.md Rule 12)

**Established:** 2026-04-26 from CLAUDE.md Rule 12 codification.

**Rule:** the 41 locked HTML frames in `PM1_UI_v2/` are **design references at 1600×1024 canvas size**, NOT mandated widths. Every React port MUST be:

- (a) **mobile-first** — base styles target ~320 px (iPhone SE), enhance via Tailwind breakpoints `sm:640 / md:768 / lg:1024 / xl:1280 / 2xl:1536`.
- (b) **NO fixed pixel widths on layout containers.** Banned: `w-[1600px]`, `w-[800px]`, `min-w-[1600px]`. Use `w-full`, `max-w-*`, `flex-1`, grid.
- (c) **Component max-widths only where semantically correct:** forms ≤ 480 px, reading content ≤ 768 px.
- (d) **Tap targets ≥ 44 × 44 px** (WCAG 2.5.5).
- (e) **NO horizontal scroll at any viewport ≥ 320 px wide.** Test at 320 / 768 / 1024 / 1440 / 1920 minimum before commit.
- (f) **Typography scales appropriately** across breakpoints.
- (g) **Modals** (Stage 1120×860, Edit 960×720, Picker 720×640, Confirm 480×360 per `01_SYSTEM.md`) become **full-screen Drawer sheets on mobile**, render at declared sizes on desktop.

**Verification:** the `enforce-rwd.sh` PreToolUse hook blocks Edit/Write of FE files containing banned patterns. Visual confirmation gate (Pattern B above) catches the rest.

**Where to deviate:** never. Even modals. Even single-line tooltips. The whole pilot demo runs from a 1440 × 900 desktop browser, but Iksula leadership has been promised "mobile browsers acceptable" — and mid-demo someone WILL pull out their phone.

---

## Pattern D — Audit log on every state-changing operation

**Established:** PM1_ERD §3.13 (binding spec).

**Rule:** every NestJS handler that performs `POST` / `PUT` / `PATCH` / `DELETE` MUST write a row to the `audit_log` table **synchronously, inside the same transaction as the state change**. Async / fire-and-forget is forbidden.

**Implementation:**

- Use `AuditLogService.append({ actor, action, resource, before, after })` — never insert into `audit_log` directly.
- The service computes `this_hash = HMAC-SHA256(secret, prev_hash || row_payload)` and links rows in an HMAC-chained sequence.
- If the audit write fails, the entire request transaction MUST roll back. Failing closed is correct here.

**Verification:** every BE PR is reviewed for "is there a `auditLog.append` call in this handler?" If no, the PR is bounced.

**Where to deviate:** read-only handlers (`GET`) skip this. The four whitelisted public endpoints (`GET /health`, `POST /auth/sign-in`, `POST /auth/sign-up`, `GET|POST /auth/callback`) skip this — auth events are tracked separately by BetterAuth's own session table.

---

## Pattern E — Zod schemas in `packages/shared`, imported by both BE + FE

**Established:** PM1_ERD §3 (will land in code at MS0-T004).

**Rule:** every NestJS endpoint has a corresponding Zod schema (request body + response) in `packages/shared`. The frontend imports the SAME schema for client-side form validation. Never duplicate the schema definition across BE and FE.

**Implementation:**

- BE: `import { CreateProjectRequest } from '@qa-nexus/shared'`. Use as the body validator decorator.
- FE: `import { CreateProjectRequest } from '@qa-nexus/shared'`. Use as the `zodResolver(CreateProjectRequest)` arg in react-hook-form.

**Constraints (paired with Pattern A above):**

- Zod and `@hookform/resolvers` are version-coupled (see `STACK_LEARNINGS.md` [ZOD] entry). Pin both at root with locked majors.
- Schemas exported from `packages/shared/src/index.ts`. Never deep-import.

**Verification:** every new endpoint PR is reviewed for "is the schema in `packages/shared`?" Backend Rule: `apps/api`-level rule explicitly states "Every endpoint must have a corresponding Zod schema in `packages/shared` … never duplicate."

**Where to deviate:** BE-internal types that aren't exposed to FE (e.g., service-layer DTOs) live in `apps/api/src/**` Zod schemas, NOT in `packages/shared`. The split rule is "is this on a network boundary that FE sees?" → if yes, shared.
