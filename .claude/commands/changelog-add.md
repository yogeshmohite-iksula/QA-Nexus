---
description: Append an entry to the [Unreleased] section of docs/CHANGELOG.md based on the most recent commit on the current branch.
---

# /changelog:add — append to [Unreleased]

Reads the most recent commit on the current branch and appends a properly formatted entry to the `[Unreleased]` section of `docs/CHANGELOG.md`. Follows the Keep-a-Changelog + Conventional Commits convention used throughout this repo.

## What this command does

1. **Read the latest commit** via `git log -1 --pretty=format:"%H%n%s%n%b"`. Capture: SHA (short), conventional type, scope, subject, body.
2. **Map the conventional type to a Keep-a-Changelog category:**
   - `feat:` → `### Added`
   - `fix:` → `### Fixed`
   - `refactor:` / `chore:` / `style:` / `perf:` → `### Changed`
   - `docs:` → `### Changed` (or `### Added` if a brand-new doc)
   - `revert:` → `### Removed`
   - `ops:` → `### Changed` (PM1-custom type for deploy / infra)
3. **Build the entry line:**
   ```
   - **`<type>(<scope>)`** — <subject> (`<short_sha>`). [Optional 1-line elaboration from body.]
   ```
4. **Insert under the existing day-grouped subheader** in `[Unreleased]` (e.g. `### Added — Day 2 (2026-04-28)`). If today's date doesn't have a subheader yet, create one above the next-most-recent day's subheader. If `[Unreleased]` itself is empty, create the day subheader directly under it.
5. **Do NOT commit the change automatically.** Show Yogesh the diff and let him decide whether it lands as part of the next commit, or as a standalone `docs(changelog)` commit.

## Guardrails

- **Do not duplicate entries.** Before inserting, grep `docs/CHANGELOG.md` for the short SHA. If found, abort with "already logged".
- **Do not pull commits beyond `HEAD`.** This command logs ONE commit at a time, the most recent. For backfill, use the `@changelog-updater` subagent (`.claude/agents/changelog-updater.md`) which handles batch operations.
- **Respect the day-grouped structure.** Don't flatten existing subheaders — keep them.
- **Surface conflicts to Yogesh, never auto-resolve.** If today's subheader exists with conflicting content (e.g. someone manually wrote a different summary for the same SHA), stop and ask.

## When to use this

- Right after running `/commit` — captures what just landed.
- Right before `/commit-push-pr` — guarantees the CHANGELOG bump rides with the PR.
- During EOD reporting — Yogesh can run this 3-5x to capture the day's commits, then commit the resulting CHANGELOG diff as one `docs(changelog)` commit alongside the EOD report.

## When NOT to use this

- For batch backfill of >5 commits at once. Use the `@changelog-updater` subagent instead — it has loop semantics + dedupe across the whole `[Unreleased]` block.
- For squash-merge PRs — the squash commit on `main` is the canonical entry; ignore intermediate branch commits.

## Example invocation

After committing `feat(web): add F08a Plain English requirement intake (MS0-T034a)` at SHA `abcd123`:

```
/changelog:add
```

Resulting diff at the top of `[Unreleased]`:

```diff
 ## [Unreleased]

+### Added — Day 2 (2026-04-28)
+
+- **`feat(web)`** — add F08a Plain English requirement intake (MS0-T034a) (`abcd123`).
+
 ### Added — Day 2 (2026-04-28) [previous entries]
```

## Cross-references

- `docs/CHANGELOG.md` — the file this command edits
- `.claude/agents/changelog-updater.md` — batch / on-PR-merge equivalent (subagent, not slash command)
- `docs/eod-reports/` — daily EOD reports also reference CHANGELOG entries by SHA
