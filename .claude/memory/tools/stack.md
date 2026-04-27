# Stack — environment + tooling notes

Append new entries at the top with `[YYYY-MM-DD]: gotcha/decision — rationale` format.

## Local dev environment (Yogesh's MacBook Air)

- **macOS** with non-admin account → Homebrew installed at `~/homebrew/bin/` (NOT `/opt/homebrew/bin/` or `/usr/local/bin/`).
- **`$PATH` for sub-shells:** any non-interactive Bash spawned by Claude / husky / wrangler MUST prepend `export PATH="$HOME/homebrew/bin:$PATH"`. Auto-loaded in interactive zsh via `~/.zprofile` but not inherited by spawned sub-shells.
- **Display:** 1440 × 900 scaled "Default" resolution → this is the binding worst case for the pilot fleet (most QA Engineers on similar MacBook 13"/14" displays). Always test RWD at 1440 × 900.

## Versions (locked)

- **Node** v24.13.1 system install. Locked-deps requires `>= 20`. Skill warns "wanted: 20.x, current: 24.x" but tolerated — pnpm scripts work fine on Node 24.
- **pnpm** 10.33.2 (corepack). NEVER npm or yarn. Workspace manager.
- **gh CLI** authenticated as `yogeshmohite-iksula` (corporate). Personal account `yogeshcodeshare` is separate (hosts the Tech-project-forge skill repo).
- **wrangler** via `pnpm dlx wrangler@latest` (currently 4.85.0). Token in `~/.zprofile` as `CLOUDFLARE_API_TOKEN`.
- **git** 2.x, system install. `core.hooksPath` = `.husky` (set by husky 9 install).

## GitHub accounts

| Account                 | Used for                               | Auth method                                 |
| ----------------------- | -------------------------------------- | ------------------------------------------- |
| **yogeshmohite-iksula** | QA Nexus repo (this repo) — corporate  | gh CLI logged in; PAT not used for QA Nexus |
| **yogeshcodeshare**     | Tech-project-forge skill repo (public) | PAT for github MCP general queries          |

**Repo:** `https://github.com/yogeshmohite-iksula/QA-Nexus.git` (private, corporate). NEVER `gh repo create` — already exists.

## Husky 9 conventions

- `core.hooksPath` = `.husky/`
- `.husky/pre-commit` → `pnpm exec lint-staged`
- `.husky/commit-msg` → `pnpm exec commitlint --edit "$1"`
- `.husky/pre-push` → `pnpm typecheck`
- Skill spec wants `.githooks/` instead — we use husky as the more standard JS-ecosystem convention. Both are valid.

## Commitlint

`@commitlint/config-conventional` extended in root `package.json`:

- Allowed types: `build, chore, ci, docs, feat, fix, perf, refactor, revert, style, test, ops`
- `ops` added 2026-04-26 for deployment-class commits (commit `be9f3be`)

## Cloudflare account

- Email: `yogesh.mohite@iksula.com` (Iksula corporate, free tier, no card)
- Account ID: `1ec3036cd3c742f44d00f013b344d221`
- Token name: `QA_Nexus` (template "Edit Cloudflare Workers" — auto-includes Pages: Edit + R2 Storage: Edit + Workers Scripts: Edit)
- Token in `~/.zprofile` as `CLOUDFLARE_API_TOKEN`
- Pages project: `qa-nexus-web` (Direct Upload mode; GitHub auto-deploy deferred)
- Production URL: https://qa-nexus-web.pages.dev/

## MCPs configured (project-local)

- `github` (PAT-authenticated as yogeshcodeshare for general queries)
- `sequential-thinking`
- `context7`
- `filesystem` (scoped to project root)
- `playwright`
- `context-mode` (pre-existing, plugin marketplace)
- `postgres` — **deferred** until MS0-T012 (Neon URL not yet provisioned)

## Skill installed

- **tech-project-forge v1.4** at `~/.claude/skills/tech-project-forge` (symlink → `~/.agents/skills/tech-project-forge`)
- Phase status: DISCOVER ✅, PLAN ⚠ partial, SETUP ⚠ ~40%, DX ✗, VALIDATION ✗, BUILD GUIDANCE ✗
- Audit: `docs/audits/2026-04-27-skill-alignment-audit.md` (full P0/P1/P2 plan)
