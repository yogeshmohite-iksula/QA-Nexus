---
description: /commit + push current branch + auto-generate PR title and body via gh pr create
---

PM1-customized version of the skill template. Composes /commit then pushes
the current branch and opens a PR with auto-derived title and body.

## Process

1. **Run `/commit` first** to stage + classify + commit (with all guards from
   that command — pre-flight lint+typecheck, conventional message, secrets
   scan, Rule 13 visual gate for frame ports). Halt if /commit aborts.

2. **Determine current branch:**

   ```bash
   BRANCH=$(git rev-parse --abbrev-ref HEAD)
   ```

   - If `BRANCH == main` and the diff includes anything under `apps/**`:
     **ABORT** with: "Direct commits to `main` for app changes are
     discouraged. Create a feature branch first
     (`git checkout -b feature/<scope>-<task>`) and re-run."

   - If `BRANCH == main` and the diff is only docs / .claude/ / root config:
     **WARN** with: "Pushing app/code changes directly to main bypasses PR
     review. Continue? (yes / no)". Only proceed on `yes`.

   - If `BRANCH != main`: proceed.

3. **Push the current branch:**

   ```bash
   export PATH="$HOME/homebrew/bin:$PATH"
   git push -u origin "$BRANCH"
   ```

   Husky pre-push runs `pnpm typecheck` — must pass. On failure, fix +
   re-run.

4. **Summarize the change for the PR body:**

   ```bash
   git diff main...HEAD --stat   # files + lines per file
   git log main..HEAD --oneline  # commit list since branched
   ```

5. **Auto-generate PR title and body:**
   - **Title:** the most recent commit subject (under 70 chars). If multiple
     commits, use the highest-priority commit's subject (`feat` > `fix` >
     `ops` > `docs` > `chore`).
   - **Body:** structured per the kickoff §5 PR template:

     ```markdown
     ## Summary

     <2-3 bullets describing what changed and why, derived from commit messages>

     ## Files changed

     <output of `git diff main...HEAD --stat`, formatted as a code block>

     ## Test plan

     - [ ] `pnpm lint` passes
     - [ ] `pnpm typecheck` passes
     - [ ] `pnpm --filter web build` clean (5 routes prerender)
     - [ ] Playwright at 320 / 768 / 1024 / 1440 / 1920 — no horizontal scroll
     - [ ] Visual confirmation per CLAUDE.md Rule 13 (URL + 320 + 1440 screenshots posted to Yogesh)
     - [ ] CF Pages preview deploys cleanly (auto on push if GitHub auto-deploy is wired; otherwise `pnpm deploy:web`)

     ## Closes

     - <MS0-T### references derived from commit messages>

     🤖 Generated with [Claude Code](https://claude.com/claude-code)
     ```

6. **Create the PR:**

   ```bash
   gh pr create --base main --head "$BRANCH" \
     --title "<title>" \
     --body "$(cat <<EOF
   <body>
   EOF
   )"
   ```

7. **Print the PR URL** so Yogesh can review and approve.

## Hard Rules

- **NEVER force-push to main** — error out if `--force` is in the user's
  request unless explicit `--force ok` follow-up.
- **NEVER skip CI gates** — wait for `gh pr checks` to report green before
  merging (merge is a separate command — this only opens the PR).
- **NEVER auto-merge** — opening the PR is the contract; Yogesh approves.
- **NEVER PR a branch with > 50 commits** without warning ("Big PR — split
  into smaller chunks?").

## Branch naming convention

- `feature/<scope>-<short-desc>` for new capabilities (e.g., `feature/f07-inbox`)
- `fix/<scope>-<short-desc>` for bug fixes
- `ops/<scope>-<short-desc>` for deployment work
- `docs/<scope>-<short-desc>` for doc-only changes
- `wip/<scope>-<short-desc>` for in-progress draft PRs

## Local fallback

This is the local fallback for `/commit-commands:commit-push-pr`. Prefer the
plugin version if installed (Phase 3 DX, deferred to P2.1).
