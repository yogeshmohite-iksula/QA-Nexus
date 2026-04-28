# STACK_LEARNINGS — gotchas and surprises

> Per-incident notes about the locked stack — things that bit us once and shouldn't bite us again. Loaded by `inject-memory.sh` when Claude is about to edit a file that touches the same surface. Append new entries at the top with `[YYYY-MM-DD]` + tag (`[ZOD]`, `[NEXT]`, `[PRISMA]`, `[BUILD]`, `[CI]`, `[HOOK]`, `[A11Y]`).

---

## [2026-04-27] [ZOD] zod schemas + `@hookform/resolvers/zod` are version-coupled

**Surface:** `packages/shared` exports Zod schemas; `apps/web` uses `@hookform/resolvers/zod` to bind those schemas to react-hook-form. **`@hookform/resolvers/zod` peer-depends on a specific Zod major.**

**What can bite:** if you bump Zod from 3.x to 4.x in `packages/shared` without bumping `@hookform/resolvers` correspondingly, the `zodResolver(schema)` call (a) blows up at runtime with `zod.ZodError is not a constructor`-class issues, or (b) silently mis-parses fields after appearing to type-check.

**Rule:** treat Zod and `@hookform/resolvers` as a paired-major lock. Pin Zod in **root** `package.json` (single dependencies entry). When MS0-T004 lands `packages/shared`, add to `.claude/locked-deps.json`: `{ "zod": "3", "@hookform/resolvers": "3" }`. Update `enforce-pm1-stack.sh` to fail Edit if one moves without the other.

**Tagged followup:** `docs/followups.md` entry (c) — closes alongside MS0-T004.

---

## [2026-04-27] [HOOK] flag-class regex needs flag-boundary semantics

**Surface:** `.claude/hooks/pre-tool-use/block-dangerous.sh`.

**What bit us:** the regex `--force` matched `--force-with-lease` (a SAFE flag for `git push`). FE chat got blocked from pushing for 30 minutes despite using the right flag.

**Rule:** any regex that matches a CLI flag must use flag-boundary form `(^|[[:space:]])--<flag>([[:space:]]|$)`, NOT bare substring. This applies to all future hook regexes that look at `tool_input.command`. Bare-word matches without boundaries are footguns.

**Fixed in:** `455ea99` (P1.13). Pattern documented here so the next hook author follows it.

---

## [2026-04-26] [NEXT] static export needs client-side root redirects

**Surface:** `apps/web/src/app/page.tsx` (root `/`).

**What bit us:** `next.config.ts` is set to `output: 'export'` for Cloudflare Pages compatibility. Server-side `redirect('/sign-in')` from a route handler does NOT work in static export — it produces an HTML page with no redirect machinery. First page load just sat at `/` showing a blank page.

**Rule:** root `/` redirect is a `useEffect` + `router.push('/sign-in')` client-side. For other navigation flows that need a redirect on first paint, use Next.js middleware OR client-side `useEffect` — never `redirect()` from a server component. `next.config.ts` `output: 'export'` is locked, so this constraint is permanent for PM1.

**Fixed in:** `a2005cb`.

---

## [2026-04-26] [BUILD] Grammarly browser extension causes hydration warnings

**Surface:** `apps/web/src/app/layout.tsx` `<body>` element.

**What bit us:** Yogesh has Grammarly installed in the browser; it injects `data-gr-ext-installed` and `data-new-gr-c-s-check-loaded` attributes onto `<body>` after page load, mismatching the SSR'd HTML. React 19 logs a hydration warning. Looked like a real bug for ~10 min before we identified the cause.

**Rule:** use `<body suppressHydrationWarning>` to silence this class of warning when it's caused by 3rd-party browser extensions. Document at the JSX site so future readers don't think it's an anti-pattern. NEVER use `suppressHydrationWarning` on individual content nodes — only on root containers (`<body>`, `<html>`) where extension injection happens.

**Fixed in:** `a2005cb`.

---

## [2026-04-27] [CI] CI workflow on a feature branch can't validate its own PR

**Surface:** GitHub Actions + `.github/workflows/ci.yml`.

**What bit us:** when the CI-introducing PR (PR #1) was opened, GitHub used the BASE branch's workflows (which had no CI yet) to validate it. So the very PR that adds CI ran with zero CI coverage. Then when subsequent PRs (#2 hotfix, etc.) opened, they ran the new CI which surfaced 3 baseline failures (gitleaks false-positive, ESLint version skew, scaffold spec broken).

**Rule:** when introducing a CI workflow, plan for a "dirty baseline" hotfix immediately after merge. Don't promise zero-CI-friction on the PR-after-CI-introduces. Sequence: (1) merge CI-introducing PR, (2) accept failing baseline as expected, (3) ship hotfix PR addressing each surfaced issue, (4) THEN merge dependent PRs.

**Documented as pattern in:** `docs/parallel-work/follow-ups.md` § Closed today + `docs/eod-reports/2026-04-27-day-1.md` § Key learnings.

---

## [2026-04-27] [PRISMA] shadow-DB validator runs migrations in lex order against an empty DB

**Surface:** `apps/api/prisma/migrations/`.

**What bit us:** tried to land `0_init_rls_hnsw/migration.sql` (RLS + HNSW + pgvector) as a regular Prisma migration. Shadow-DB validation failed because the file referenced `audit_log` table before Prisma had emitted its init migration to create that table. We were trying to land both at once.

**Rule:** Prisma migrations are for schema (tables, columns, FKs) only. Hand-written infra (RLS, HNSW, extensions, triggers) goes in `apps/api/prisma/raw/*.sql`. See ADR-002. NEVER mix them in a single Prisma migration directory.

**Fixed in:** `a6644c1`. Formalized in `docs/architecture/adr-002-prisma-raw-split.md` (2026-04-28).

---

## [2026-04-27] [CI] gitleaks `regexes` matches secret VALUE not URL/path

**Surface:** `.gitleaks.toml`.

**What bit us:** to allowlist a NestJS scaffold README badge URL containing what looked like a token, I added a `regexes` allowlist entry. Didn't work — gitleaks `regexes` matches the SECRET value, not the URL or surrounding context. The right tool is `paths` (file-based allowlist).

**Rule:** for "this whole file is OK" allowlists, use `[[allowlist]] paths = [...]`. For "this specific secret pattern is OK anywhere", use `[[allowlist]] regexes = [...]`. They're different directives with different match semantics.

**Fixed in:** `5b32df3` (P1.14b).

---

## [2026-04-26] [A11Y] tap targets ≥ 44×44 px enforced by Rule 12

**Surface:** all FE component edits in `apps/web/**`.

**What bit us:** F06 sign-in had a forgot-password link sized to ~32 px tall (just text height). On a 1440 px viewport it looked fine, but on iPhone SE (320 px) the tap target was below WCAG 2.5.5 threshold. Caught only in visual confirmation gate (Rule 13), not by automation.

**Rule:** every clickable element in FE components must have explicit padding bringing tap target to ≥ 44×44 px. Use `min-h-[44px] min-w-[44px]` or equivalent padding. Verified via the `enforce-rwd.sh` hook + Rule 13 visual confirmation at 320 + 1440.
