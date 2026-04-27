# Changelog

All notable changes to this project are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) +
[Conventional Commits](https://www.conventionalcommits.org/) types.

The `[Unreleased]` section is the build journal. The `@changelog-updater`
subagent (planned in P1.2) will keep this file in sync; until then, manual
updates land here at the end of every working day.

---

## [Unreleased]

### Added — Memory + audit (Day 1, 2026-04-27)

- **`feat(hooks)`** — `inject-memory.sh` PreToolUse `*` hook (`dd1c8a3`). Auto-prepends `.claude/memory/memory.md` to every tool call so future Claude sessions on any machine see project memory without depending on user-session memory. Lifts eval.json assertion 24.
- **`docs(memory)`** — Seeded `.claude/memory/` system with 7 files from PM1 blueprint (`de66034`): `memory.md` (index), `general.md` (8-user roster, locked stack, R1–R4 risky assumptions), `domain/{architecture,bugs,api}.md`, `tools/{database,stack}.md`. Hard guard `! grep -rq '\${' .claude/memory/` passes. Lifts eval.json assertion 23.
- **`docs(audit)`** — Tech-project-forge skill alignment audit (read-only) at `docs/audits/2026-04-27-skill-alignment-audit.md`. Projected eval score: 5/28 today → 11/28 after P0 → 24/28 after P0+P1 → 27/28 after P0+P1+P2 (DESIGN.md justified deviation).

### Added — Auth surface (Day 0, 2026-04-26)

- **`feat(web)`** — F06c Reset Password React port at `/sign-in/forgot/` (`e0fda46`). Mode B forgot-flow landing: hero "Reset your password" + recipient email in mono + Strong-state strength card (4/4 with green s4) + AMBER pulse + 58-min expiry warning + "Back to sign in" link. RWD per Rule 12 verified at 320 / 1440. **Component change:** `PasswordStrengthCard` extended to derive segment + label color from `level` prop (Strong → green, Good → teal, Fair → amber, Weak → red); F06b "Good" rendering unchanged.
- **`docs(deploy)`** — F06c LIVE-URL screenshots from production (`4b05c74`).
- **`feat(web)`** — F06b Set Password React port at `/set-password/` (in `a2005cb`). Mode A invite landing: Welcome + 2 password fields with eye toggle + Good-state strength card + neutral 24-hour expiry indicator. Auth-surface duplicate brand mark omitted on desktop per Yogesh override; mobile-only BrandMark above form on `< lg`.
- **`feat(web)`** — F06 Sign In React port at `/sign-in/` (`9ccfdfd`). Two-panel layout, teal "Authenticate" CTA, violet "Contact Site Admin" admin-escalation link.
- **`feat(web)`** — Full RWD refactor of F06 + F06b (`a2005cb`). Removed `w-[1600px]` + `w-[800px]` fixed widths; introduced `flex min-h-screen flex-col lg:flex-row` + `flex-1` panels + `hidden lg:flex` brand panel + mobile-only BrandMark + hero typography scale `40px → 56px (xl:)`. NO horizontal scroll at any viewport ≥ 320 px (verified at 320 / 768 / 1024 / 1440 / 1920). Established **CLAUDE.md Hard Rule 12** (full RWD on every ported frame) + **Hard Rule 13** (visual confirmation gate before commit). Also includes Grammarly hydration false-positive fix (`suppressHydrationWarning` on `<body>`).

### Added — Deploy + infrastructure (Day 0, 2026-04-26)

- **`ops(deploy)`** — Cloudflare Pages wired for `apps/web` (`be9f3be`). Production at https://qa-nexus-web.pages.dev/ — $0/month free tier, Direct Upload mode. `next.config.ts` set to `output: 'export'` + `trailingSlash: true` + `images.unoptimized: true`. Root `/` redirect refactored to client-side useEffect (static export compat). `apps/web/wrangler.toml` + `pnpm deploy:web` script + `docs/deploy/cloudflare-pages.md` runbook. Commitlint type-enum extended to allow `ops`. Closes **MS0-T010** + **MS0-AC001**.
- **`docs(milestone)`** — `MS0-T034` RWD enforcement hook added to M0 v8 backlog (`bfe44dc`). P1, 4h, DevOps. Will block `w-[≥200px]` + `max-w-[1600px]` patterns in `apps/web/**` so the next 38 frame ports can't regress on Rule 12.

### Added — Backend scaffold (Day 0, 2026-04-26)

- **`feat(api)`** — NestJS 10 scaffold in `apps/api` (`0a1abcf`). Closes **MS0-T003**.

### Added — Frontend scaffold + hardening (Day 0, 2026-04-26)

- **`feat(hooks)`** — `enforce-pm1-stack.sh` upgraded with version-pin enforcement (`661249c`). Reads STDIN + parses package.json + compares each dep major against `.claude/locked-deps.json`, exits 2 on mismatch. Catches Next 16 / React 18 / Tailwind 3 etc. drift at scaffold time, not dry-run time. Closes **MS0-T033**.
- **`chore(stack)`** — Pin Next.js to `^15` + ESLint 9 flat config + PM1 design tokens (`4159a2a`). Locked-deps.json source of truth: next 15, react 19, tailwindcss 4, @nestjs/\* 10, prisma 5, node ≥ 20.

### Added — Initial scaffold (Day 0, 2026-04-26)

- **`chore`** — Monorepo root scaffold + binding specs (`79c77aa`). pnpm workspaces, apps/web, apps/api, packages/shared layout. Husky 9 + lint-staged + commitlint wired. PM1_PRD v8.1 + PM1_ERD v2.1 + Milestone_M0_Setup_v8.md + 41 locked HTML frames in place. CLAUDE.md with 11 hard rules (rules 12 + 13 added later in `a2005cb`). 5 PM1-custom hooks + 6 MCPs + Tech-project-forge-skill v1.4 installed and audited. Closes **MS0-T001** + **MS0-T006**.

---

## Notes for future contributors

This `[Unreleased]` section will roll into a numbered release at the end of each milestone:

- `[0.1.0-m0]` — at end of M0 (target Day 10). Will gather all infrastructure + auth-surface entries above.
- `[0.2.0-m1]` — at end of M1 (Users & Roles + RBAC + magic links).
- `[0.3.0-m2]` — at end of M2 (Docs + KB).
- ... through `[1.0.0]` at GA (M6, target 2026-09-21).

The `pre-push` git hook (P2.7) will eventually block pushes that change `apps/**` without a `[Unreleased]` bump. Until that hook lands, the convention is **manual: end-of-day, append the day's commits to `[Unreleased]`**.
