# Contributing to QA Nexus

Internal Iksula Services project. Contributions during PM1 (M0 → M6, GA target 2026-09-21) are limited to the named pilot team — see [README.md → Pilot team](README.md#pilot-team).

## Before you write a single line of code

1. **Read [`CLAUDE.md`](CLAUDE.md)** end-to-end. The 13 hard rules are binding (cost gate, design tokens, banned deps, RWD requirements, visual confirmation gate, etc.). PreToolUse hooks block author-time violations; CI catches the rest.
2. **Skim the rules in [`.claude/rules/`](.claude/rules/)** — `frontend.md`, `api.md`, `security.md`. Per-area constraints not repeated in CLAUDE.md.
3. **Check [`docs/STATUS.md`](docs/STATUS.md)** for the current milestone, active PRs, and free-tier quota state. New work shouldn't conflict with what's already in flight.
4. **Read the relevant ADRs.** ADR-002 → ADR-006 capture decisions you'll bump into within the first hour: Prisma raw split, embedding model choice, deployment target, R2 storage pattern, seed data architecture.

## Workflow

### Branching

- Feature work: `feature/<area>-day-<N>-<short-desc>` (e.g. `feature/be-day-3-t023-llm-gateway`)
- Bug fixes: `fix/<short-desc>` (e.g. `fix/zod-resolver-pin`)
- CI / infra: `ci/<short-desc>` (e.g. `ci/push-trigger-on-main`)
- Refactors: `refactor/<area>-<short-desc>`
- Direct-to-main is allowed for: docs typos, EOD reports, comment-only changes. Anything touching `apps/**/src`, `packages/**/src`, `.github/workflows/**`, or `.claude/hooks/**` requires a PR.

### Commits

Conventional Commits (Angular style + PM1-custom `ops` type):

- `feat(api): T036 a1 scribe scaffold`
- `fix(ci): trigger workflows on push to main`
- `docs(eod): post day 4 eod report`
- `chore(permissions): add 30 auto-allow patterns`
- `refactor(web): seed centralization for F08a/b/c`
- `ops(deploy): wire render env vars for T011`

Lint-staged runs prettier + eslint --fix automatically. Husky's commit-msg hook enforces commitlint rules (header ≤ 72 chars, body lines ≤ 100 chars, footer lines ≤ 100 chars). Pre-push hook blocks pushes that touch `apps/**/src` or `packages/**/src` without a CHANGELOG bump.

### Pull requests

For every PR:

1. **CI must be 7/7 green** before requesting review (lint / typecheck / test / build / hook-validation / gitleaks / playwright).
2. **`docs/CHANGELOG.md` `[Unreleased]` updated** with what landed.
3. **Visual confirmation for every new/refactored UI screen** (CLAUDE.md Rule 13): screenshots at 320 + 1440 in `docs/screenshots/` + explicit "looks good — commit?" approval before merge.
4. **Pattern A discipline for FE onboarding components**: NO `fetch` / `useMutation` / `axios` — verified by grep before merge.
5. **Provider-agnostic discipline for BE LLM consumers**: NO direct `groq-sdk` or `@google/generative-ai` imports outside `apps/api/src/llm/providers/` — verified by grep before merge.

### The 4-gate merge checklist

Used by MAIN session for every PR review:

1. **Diff scope** — files touched match the PR title (no surprise drift).
2. **CI 7/7 green** — all checks pass against the new merge SHA.
3. **Tests** — claimed test counts in the PR body match what jest/playwright actually report.
4. **Discipline check** — area-specific (Pattern A for FE, provider-agnostic for BE LLM, RWD for any new screen).

If all 4 pass: squash-merge with the PR title as-is.

## Architecture you'll bump into in the first hour

- **3-layer seed data** ([ADR-006](docs/architecture/adr-006-seed-data-centralization.md)): types in `packages/shared/src/seed-types.ts`, demo source in `apps/web/lib/demo-seed.ts`, context providers in `apps/web/lib/contexts/`. Components import context hooks (`useCurrentUser`, `useActiveProject`, `useTeamRoster`) — never `lib/demo-seed.ts` directly. View fixtures stay in per-component `data.ts`; only entity identity moves to contexts (refinement post PR #16).
- **Provider-agnostic LLM gateway** (T023): `LLMGatewayService.complete(prompt, opts) → LLMResult`. Adding a new free LLM is one file in `apps/api/src/llm/providers/` + one line in `provider-registry.ts`. No core changes.
- **Pure-OTel telemetry** (T019, [`apps/api/src/observability/`](apps/api/src/observability/)): single redaction config (`redact.ts`) applied to BOTH trace + log exporters. NestJS Logger + OTel logs SDK — no pino, no winston (verified rule, see [`.claude/rules/api.md`](.claude/rules/api.md)).
- **Pattern A deferred routing** (CLAUDE.md): onboarding screens have ZERO fetch/useMutation/axios. Routes carry intent until a real BE endpoint can absorb the action.
- **HMAC-SHA256-chained audit log** (PM1_ERD §3.13): every state-changing endpoint writes a row synchronously before responding. `AuditLogService.append()` only — never insert into `audit_log` directly.

## Hooks (your guardrail)

PreToolUse hooks block bad edits at author-time:

- `block-dangerous.sh` — rejects `rm -rf`, `DROP TABLE`, force-push patterns
- `check-secrets.sh` — rejects committing `.env`, API keys, session tokens
- `enforce-design-tokens.sh` — rejects non-whitelisted hex / Tailwind colors / MD3 tokens
- `enforce-pm1-stack.sh` — rejects ban-list deps + locked-major drift
- `enforce-rwd.sh` — rejects fixed pixel widths in apps/web layout containers
- `load-binding-context.sh` (UserPromptSubmit) — prepends PM1 spec refs to every Claude session
- `audit-log.sh` (PostToolUse) — appends one JSONL line per tool call to `.claude/audit.jsonl`

If a hook blocks something it shouldn't, file a followup in [`docs/followups.md`](docs/followups.md). Don't disable hooks.

## Questions

Ask in PM chat. Yogesh (Admin) is the architectural decision-maker. CLAUDE.md Rule 11: "When in doubt, ask Yogesh — never guess."
