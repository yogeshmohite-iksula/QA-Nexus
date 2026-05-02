# Code architecture audit — LIVING DOCUMENT

> First-ever code audit for QA Nexus PM1. Single living document.
> When a fresh audit runs, update this file in place + append a row to
> the Revision History below.

## Revision History

| Date       | Reviewer     | Score  | Run summary                                                                                                                                                                                                                                                               |
| ---------- | ------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-05-02 | MAIN session | **A−** | Day-5 #6. First-ever pass. 159 .ts/.tsx production files across 4 workspaces. Zero `any` in prod, zero LLM-SDK rule violations, zero Pattern A FE violations. 38 TODO/FIXME (Jira-pages-heavy). 5 jest spec files in api (84 tests). Findings + 7 actionable items below. |

---

# Audit pass — 2026-05-02 (Day 5)

**Type:** scheduled first-ever code audit per Day-5 plan. Looks at
**code architecture** — cross-cutting concerns, discipline rules,
test coverage, file-size hot-spots, dep-graph health. NOT a security
audit (that's `docs/SECURITY.md` + gitleaks CI), NOT a skill-conformance
audit (`docs/audits/skill-alignment-audit.md`).

**Scope:** apps/api, apps/web, packages/shared, apps/e2e. Excludes
docs/, .claude/, QA Nexus/, node_modules/.

**Methodology:** Explore-agent structural survey + targeted greps
across binding-rule files (`.claude/rules/api.md`, `.claude/rules/frontend.md`,
`.claude/rules/security.md`, CLAUDE.md hard rules 1-13, PM1_ERD §3.13
audit log discipline). Findings ranked by impact.

**Bias declaration:** MAIN authored most of the apps/api code under
audit. To partially counter, where MAIN's own code is reviewed I link
to the spec / rule file so the judgement is checkable against the rule
not against MAIN's preference.

---

## TL;DR

| Category                             | Score  | Δ from baseline | Notes                                                                                                                   |
| ------------------------------------ | ------ | --------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Binding-rule conformance             | **A**  | (baseline)      | Zero `any` in prod · zero LLM-SDK rule violations · zero Pattern A FE violations                                        |
| Test coverage discipline             | **B**  | (baseline)      | apps/api 5 spec files / 84 tests. apps/web + packages/shared have zero unit tests                                       |
| File-size hygiene                    | **B−** | (baseline)      | 4 FE files >1000 lines (demo-seed 1,775; imports-page 1,335; upload-page 1,028; jira-step2 1,002) — refactor candidates |
| TODO/FIXME density                   | **A−** | (baseline)      | 38 total, 24 concentrated in Jira pages (expected; scaffold). Zero `XXX` / `HACK`.                                      |
| Audit-log discipline (PM1_ERD §3.13) | **C**  | (baseline)      | 8+ state-changing endpoints; not all verified to write audit rows. **Needs scripted gate.**                             |
| Deferred-mode pattern consistency    | **A**  | (baseline)      | Both `LLMGatewayService` + `EmbeddingService` follow the same shape, both surfaced in /health                           |
| Dep-graph isolation                  | **A**  | (baseline)      | 15 files import `@qa-nexus/shared`. Zero files import contexts/ across boundaries                                       |
| **Overall**                          | **A−** | (baseline)      | Production code is clean; coverage + audit-log gate are the two biggest tightening opportunities                        |

**Verdict:** ✅ Code is in solid shape for M0 close. The B in test coverage and the C in audit-log discipline are the two items worth tightening before pilot launch — both are tracked as new findings (FIND-1 and FIND-2 below).

---

## Findings (impact-ranked)

### FIND-1 (P1) — Audit-log discipline not enforced by gate

**Spec touched:** `.claude/rules/api.md` ("Every state-changing operation (POST / PUT / PATCH / DELETE) must write a row to the `audit_log` table") + PM1_ERD §3.13 + CLAUDE.md Hard Rule 7.

**Observation:** The structural survey identified at least **10 controller methods** across 6 files that match the rule's "state-changing op" definition (auth.controller `signUp`/`signIn`/`signOut`, projects.controller `create`/`jiraOAuthStart`, storage.controller `presignedUpload`/`presignedDownload`, llm.controller `test`, otel-test.controller `testTrace`/`testSlackAlert`, a1-scribe.controller — endpoints not enumerated). The audit pass did NOT verify each one writes `auditService.write(...)` synchronously inside the method body — that requires per-method body inspection.

The known case: `storage.controller.ts:presignedUpload` IS audit-wired (verified Day-3 stretch). Other endpoints — unknown. **Could be 100% compliant. Could be 50%. We don't know.**

**Risk:** missing audit rows → F28 Settings & Audit screen shows incomplete history → incident postmortem can't reconstruct who did what when. The hash-chain stays intact (it's per-row), but coverage gaps mean the chain skips events that should be in it.

**Action:**

1. **Day-6 morning (~30 min):** write a static-analysis script `scripts/audit-discipline-check.sh` that:
   - Greps every `@Post`/`@Put`/`@Patch`/`@Delete` decorator in `apps/api/src/**/*.controller.ts`
   - For each match, scans the method body for `auditService.write(` or `audit.write(`
   - Lists any decorator-without-write as a violation
   - Returns non-zero on any violation
2. **Day-6 morning (~10 min):** add the script as `pre-push gate 4/4`. Same shape as the frozen-lockfile gate added Day-5 #4 follow-up.
3. **Day-6 morning (~varies):** for each violation surfaced by the script, either add `auditService.write(...)` OR explicitly mark the endpoint as audit-exempt with `// audit-exempt: <reason>` (e.g. otel-test endpoints don't need audit rows).
4. **Cross-link:** file as followup `(p)` in `docs/followups.md`.

**Owner:** MAIN (Day 6 morning).

---

### FIND-2 (P1) — Test coverage absent for apps/web + packages/shared

**Spec touched:** none binding (CLAUDE.md doesn't mandate FE unit tests; visual confirmation gate covers FE quality). But best practice + risk mitigation for F26 admin endpoints lands in M1.

**Observation:**

- `apps/api/src/`: **5 spec files**, 84 jest tests. Strong.
- `apps/web/`: zero unit tests. Visual gates + Pattern A grep are the only quality nets.
- `packages/shared/`: zero unit tests. Schemas have no fixture-based assertion that they catch malformed inputs.
- `apps/e2e/`: 1 Playwright spec (login flow + /health smoke).

**Risk:** Zod schemas in `packages/shared/src/schemas/*` are the single source of truth for BE↔FE type safety. A subtle regression in one (e.g. relaxing a `.min(1)` to `.min(0)`) wouldn't be caught by typecheck. Today the only catch is "next deploy + manual smoke."

**Action:**

1. **M1 first half (~3 hr):** add `packages/shared/src/__tests__/schemas.spec.ts` with one happy-path + 2-3 edge-case tests per schema. Use jest with the same `passWithNoTests` pattern. Aim for 40-60 tests covering the canonical request/response shapes.
2. **Defer apps/web unit tests** — Pattern A means components are mostly intent-routing + render. Visual gates + Playwright e2e (M1) catch the meaningful regressions. Adding RTL would be high-cost / low-marginal-value.
3. **Cross-link:** file as followup `(q)` in `docs/followups.md`.

**Owner:** BE chat (shared schemas) + FE chat (skip — defer to M2 if needed).

---

### FIND-3 (P2) — Four FE files >1000 lines suggest extract candidates

**Spec touched:** none binding. Best practice + future-maintenance.

**Observation:**

| File                                                           | Lines | Why it's big                                                                                                                                                 |
| -------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `apps/web/lib/demo-seed.ts`                                    | 1,775 | 8 users + 5 projects + 50 test cases + 20 defects + 15 runs + 25 agent activities + 4 approvals + SEED_IDS const map. Justified — single source per ADR-006. |
| `apps/web/components/imports/imports-page.tsx`                 | 1,335 | F13 Imported Files List — Pattern A view fixtures inlined per ADR-006 refinement.                                                                            |
| `apps/web/components/upload/upload-page.tsx`                   | 1,028 | F12 Upload Modal — same pattern.                                                                                                                             |
| `apps/web/components/sources-jira/connect-jira-step2-page.tsx` | 1,002 | F11b Jira Step 2 — multi-step form state.                                                                                                                    |

**Risk:** maintainability erodes around 800 lines for React components. Diff review gets harder. Cognitive load on edit grows. NOT critical at M0 (all four files were one-PR ports + work today), but worth monitoring.

**Action:**

1. **M2 first half (~varies):** for each >1000-line file, evaluate one-time extraction:
   - `demo-seed.ts` → split into `demo-seed/{users,projects,test-cases,defects,runs,agent-activity,approvals}.ts` keeping `SEED_IDS` central. Stays in `apps/web/lib/`.
   - View-fixtures in `imports-page` and `upload-page` → extract per ADR-006 refinement: keep `data.ts` as view-fixture file but split into smaller themed chunks.
   - `jira-step2` → extract state-machine logic into a hook (`useJiraStep2State`).
2. **Trigger:** if any of the 4 grows >1500 lines OR a non-trivial bug needs to be fixed in one of them, do the split THEN.
3. **Don't proactively split now** — refactor cost > maintenance cost at current pace.

**Owner:** FE chat (M2 only if triggered).

---

### FIND-4 (P3) — TODO/FIXME concentration in Jira integration pages

**Observation:** 24 of 38 TODOs (63%) live in 4 Jira-related files (`connect-jira-step{1,2,3}-page.tsx` + `connect-jira-shell.tsx`). Most are "Day-4 P1 followup i" markers — already closed by PR #16 + #17 — and some are "BE wires real Jira OAuth in M2".

**Risk:** Low at current state; these are intentional scaffold markers. But "follow-up i" markers should be cleaned now that (i) is closed.

**Action:**

1. **Day-6 (~15 min):** sweep the 4 Jira files; remove or update all `// TODO: followup (i)` comments since (i) is closed. Replace with concrete `// M2: BE provides /api/integrations/jira/...` markers where appropriate.
2. The other 14 TODOs are unrelated and contextual — leave alone unless adjacent code is being touched.

**Owner:** FE chat (Day 6 if available; otherwise Day 7).

---

### FIND-5 (P2) — Audit log span correlation (OTel + audit_log) not yet wired

**Spec touched:** PM1_ERD §3.13 (audit log) + `.claude/rules/api.md` (OTel spans).

**Observation:** `auditService.write()` writes a row to Postgres. `tracer.startActiveSpan('llm.complete', ...)` (Day-5 #3) emits a span to Grafana. **These two events have no correlation.** When we look at the audit log in F28 and want to see "what was the trace for this audit row," there's no `trace_id` column in `audit_log`.

Conversely, an OTel span has no audit_id attribute pointing back at the row that was written during this span's lifetime.

**Risk:** Low for M0 (audit log alone is sufficient for compliance). Medium for M1+ when incident postmortems use both layers — manual correlation via timestamp + actor_id is brittle.

**Action:**

1. **M1 morning (~1 hr):** add `trace_id` (NULLABLE varchar(32)) + `span_id` (NULLABLE varchar(16)) to `audit_log` table. Populate in `AuditService.write()` by reading `trace.getActiveSpan()?.spanContext()`.
2. **M1 morning (~30 min):** add the same as span attributes (`audit_log.row_id`, `audit_log.kind`) when an audit row is written inside an active span.
3. **Cross-link:** file as followup `(r)` in `docs/followups.md`.

**Owner:** BE chat (M1 morning).

---

### FIND-6 (P3) — Deferred-mode pattern is good but not codified

**Observation:** `LLMGatewayService` and `EmbeddingService` both have `public deferred: boolean` + `public deferredReason: string | null` fields, both surfaced in `/health` with consistent shape. **This is the right pattern.** R2Service uses a similar but slightly different shape (`isConfigured()` predicate + per-method 503 throw).

**Risk:** Low. Future services that need to ship in deferred mode (notifications? analytics?) might invent a third pattern.

**Action:**

1. **Day-6 (~20 min, optional):** document the pattern in a new file `docs/architecture/patterns.md` (or add to `.claude/rules/api.md` as a new section "Deferred-mode services"). Cover: when to use it (env vars missing on first deploy + grace-degrade > crash), the contract (boolean field + reason string + /health visibility + method-level 501-or-503 throw), the prior-art services (LLMGateway / Embedding / R2).
2. **Don't refactor R2** — its shape predates the pattern + works correctly. Just document.

**Owner:** MAIN (low priority; nice-to-have for M1 onboarding).

---

### FIND-7 (P3) — `apps/e2e` only has 1 spec; smoke gate is thin

**Observation:** `apps/e2e/tests/onboarding.spec.ts` covers login flow + /health smoke. M0 scope is small enough that this is fine. M1 onwards (F27 Admin user-management, F26 LLM key UI, F19 Run Console) will need more.

**Risk:** Low for M0. But the moment F26 lands, the e2e workspace is the right place to add a spec proving "Admin enters Groq key in F26 → LLMGateway.deferred flips to false → /llm/test returns success."

**Action:**

1. **M1 first half (~2 hr):** add `apps/e2e/tests/f26-llm-config.e2e-spec.ts` covering F26 → LLMGateway state transition.
2. **M1 first half (~1 hr):** add `apps/e2e/tests/f27-admin-users.e2e-spec.ts` covering invite flow.
3. **Don't expand e2e for M0** — the existing 1 spec + jest unit coverage is enough.

**Owner:** FE chat or QA (Akshay) once F26/F27 land.

---

## What did NOT fail (the green list)

These are the things audit checked + found clean. Worth keeping intact:

- **`any` types in production code:** 0. All 5 instances are in test files where `any` is acceptable for mock setup.
- **Direct `groq-sdk` / `@google/generative-ai` imports outside `apps/api/src/llm/providers/`:** 0. The provider-agnostic gateway architecture (T023) holds.
- **Pattern A discipline (FE):** 22 mentions, 0 actual `fetch(` / `useMutation` / `axios` calls. All hits are negative comments documenting the rule.
- **Cross-boundary imports:** 0 files import from `apps/web/lib/contexts/` outside of `apps/web/`. The seed-centralization layer (ADR-006) is properly isolated.
- **Module count:** 13 NestJS modules, all with consistent `*.module.ts` naming. No mystery modules.
- **Bound design tokens:** 0 violations (verified by `enforce-design-tokens.sh` PreToolUse hook + manual sample of 5 components).
- **Bound stack deps:** 0 violations (verified by `enforce-pm1-stack.sh` PreToolUse hook + `.claude/locked-deps.json`).
- **Hash-chained audit log helper (`audit-helper.ts`):** 9 jest tests cover genesis row + chain link + canonical JSON normalization + secret-rotation + advisory-lock key derivation. PM1_ERD §3.13 binding rule covered at the helper level (whether it's INVOKED everywhere is FIND-1's question).

---

## Methodology + reproducibility

The structural survey runs in ~5 min via Explore agent + targeted greps:

```bash
# File counts
find apps/api/src apps/web packages/shared/src apps/e2e -name "*.ts" -o -name "*.tsx" | grep -v node_modules | wc -l

# any usage in prod
grep -rn ": any\b" apps/api/src/ apps/web/lib/ apps/web/components/ packages/shared/src/ | grep -v __tests__

# LLM SDK rule violations
grep -rn "from ['\"]groq-sdk['\"]\|from ['\"]@google/generative-ai['\"]" apps/api/src/ | grep -v "apps/api/src/llm/providers/"

# Pattern A FE check
grep -rnE "fetch\(|useMutation|axios" apps/web/components/ apps/web/app/ | grep -v "//"

# State-changing controllers (for FIND-1 manual + FIND-1 future scripted gate)
grep -rn "@Post\|@Put\|@Patch\|@Delete" apps/api/src/**/*.controller.ts

# File size hot spots
find apps/api/src apps/web packages/shared/src -name "*.ts" -o -name "*.tsx" | grep -v __tests__ | xargs wc -l | sort -rn | head -15
```

Re-run quarterly OR before each milestone close (M1, M2, etc.) to track drift.

---

## Cross-references

- **Binding rules:** `.claude/rules/{api,frontend,security}.md`, CLAUDE.md hard rules 1-13.
- **Architecture:** ADR-002 (Prisma raw split), ADR-003 + amendment (embedding model), ADR-004 (Render), ADR-005 (R2), ADR-006 + refinement (seed centralization), ADR-009 (sharp pinning).
- **Sister audit:** `docs/audits/skill-alignment-audit.md` (skill conformance — different lens, same project).
- **Followups inbox:** `docs/followups.md` — new (p), (q), (r) to be filed alongside this audit's commit.
