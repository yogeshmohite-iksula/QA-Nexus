---
description: Run lint + typecheck, then stage all changes and create a conventional commit (with abort-on-failure)
---

PM1-customized version of the skill template. Adapted for pnpm monorepo +
Husky + commitlint + the 12-type allowlist (build/chore/ci/docs/feat/fix/
perf/refactor/revert/style/test/ops).

## Process

1. **Pre-flight: lint + typecheck.** Halt the entire flow if either fails — the
   commit message gate downstream is meaningless if the working tree is broken.

   ```bash
   export PATH="$HOME/homebrew/bin:$PATH"
   pnpm lint && pnpm typecheck
   ```

   On failure: print the exact error + offer to run `/fix-bug` or `pnpm lint:fix`.
   ABORT — do NOT proceed to staging.

2. **Inventory: what changed?**

   ```bash
   git status && git diff --stat
   ```

   Group changes by surface (apps/web, apps/api, packages/shared, .claude/, docs/, root).

3. **Classify by conventional-commit type:**
   - `feat` — new user-facing capability (frame ports, API endpoints, features)
   - `fix` — bug fix in existing capability
   - `chore` — build / config / housekeeping (no user-facing change)
   - `docs` — markdown / README / runbook / audit docs only
   - `refactor` — internal restructuring, no behavior change
   - `test` — test additions / corrections only
   - `perf` — performance improvement, no behavior change
   - `style` — whitespace / formatting only
   - `ci` — `.github/workflows/` only
   - `ops` — deployment-class work (CF Pages, Render, Neon, R2 wiring) — PM1-custom type per `be9f3be`
   - `build` — build system / package.json deps
   - `revert` — reverting a prior commit

4. **Propose the commit message:**
   `<type>(<scope>): <subject under 72 chars + lowercase first word>`

   Examples that pass commitlint:
   - `feat(web): port F07 Inbox to React (MS0-T029.6)`
   - `fix(api): correct CORS origin to allow *.qa-nexus-web.pages.dev`
   - `ops(deploy): switch CF Pages from Direct Upload to GitHub auto-deploy`

   Show the proposed message + body draft (5-10 lines explaining what + why
   - which `MS0-T###` task it closes) and ask the user to **approve, edit,
     or cancel**.

5. **On approve:**

   ```bash
   git add -A
   git commit -m "<message>"
   ```

   Husky pre-commit (lint-staged) runs. Husky commit-msg (commitlint)
   validates. If either fails, surface the error + offer to fix.

## Hard Rules

- **NEVER commit `.env*`, credentials, or files containing secrets** — abort if `git diff --cached` matches `(api[_-]?key|token|secret|password)\s*=\s*\S+` (excluding `.env.example` which has placeholder values).
- **NEVER use `--no-verify`** unless the user explicitly asks (typing `--no-verify ok` in chat).
- **NEVER commit on main** if a feature branch should have been used (branches `feature/*`, `fix/*` are appropriate; main commits are OK for direct documentation/audit work but warn the user).
- **NEVER commit if `git diff --cached` includes the 41 locked HTML frames** in `QA Nexus/PM1/PM1_UI_v2/` — abort with reference to CLAUDE.md Rule 3.

## Visual confirmation gate per CLAUDE.md Rule 13

If the diff touches `apps/web/app/(auth)/**/page.tsx` or any new frame port:
**HALT before commit** and prompt: "Per Rule 13, frame-port commits require
Yogesh's visual confirmation at the local URL + 320 + 1440 screenshots. Has
that gate passed? (yes / no)". Only proceed on `yes`.

## Local fallback

This is the local fallback for `/commit-commands:commit`. Prefer the plugin
version if installed (Phase 3 DX, deferred to P2.1).
