---
description: Append a one-line learning entry to .claude/memory/general.md based on surprising discoveries from the current session
---

PM1-customized version of the skill template. Yogesh's preference: **single
file (`general.md`), one-line format** — simpler than skill's 4-file split
across `domain/{architecture,bugs,api}.md` + `tools/{database,stack}.md`.
The retro-agent (P1.2) handles the deeper categorization at milestone close;
this command is the lightweight, every-session capture.

## Format (binding)

```
- [YYYY-MM-DD] <one-line learning, ≤120 chars>
```

Examples:

```
- [2026-04-26] Bash sub-shells need explicit `export PATH="$HOME/homebrew/bin:$PATH"` because husky doesn't inherit zsh profile
- [2026-04-26] Static export `output: 'export'` requires client-side redirect for `/` (server `redirect()` needs Node runtime)
- [2026-04-27] Tech-project-forge skill installed via symlink — direct path is `~/.agents/skills/tech-project-forge`
```

## Process

1. **Review the current session.** Look for:
   - Surprising bug root causes (something that took >15 min to diagnose)
   - Environment / tooling gotchas (PATH issues, version mismatches, hook misfires)
   - Architecture decisions made under time pressure (worth documenting)
   - Recurring patterns observed (e.g., "every CF Pages deploy needs `pnpm deploy:web` from root")
   - Spec / doc gaps surfaced (mismatches between PM1_PRD and actual code)

   **Skip** routine work that's already captured in commit messages — this
   is for the _unexpected_ learnings that future-Claude needs to know.

2. **Distill into 1-line entries** (≤120 chars each, ≤5 entries per session).

3. **Read `.claude/memory/general.md`** to confirm the learning isn't already
   present (idempotency — never duplicate).

4. **Append to a new section at the bottom of `general.md`** under heading
   `## Compound learnings (auto-appended via /compound-learnings)`. If the
   section doesn't exist yet, create it.

   Each entry one line:

   ```markdown
   - [YYYY-MM-DD] <learning>
   ```

   Most-recent entries at the top of the section (descending date order).

5. **Print summary:**

   ```
   ✓ N learnings appended to .claude/memory/general.md
   → <preview of each new entry>
   ⊘ M learnings skipped (already present)
   ```

6. **(Optional) Tag for retro-agent:** if any learning is high-confidence
   pattern-worthy (3+ occurrences), suggest the user runs `@retro-agent`
   to propose deeper categorization (move to `domain/architecture.md` or
   create a new CLAUDE.md hard rule).

## Hard Rules

- **NEVER append more than 5 learnings per invocation** — quality > quantity.
- **NEVER paraphrase from commit messages** — those are already captured
  in CHANGELOG.md. Only capture learnings _not yet recorded anywhere_.
- **NEVER write `${...}` placeholders** — substitute today's date inline.
- **NEVER move existing entries** in `general.md` — only append. Use
  `/reorganize-memory` for cleanup.
- **NEVER write to `domain/` or `tools/` files from this command** — that's
  the retro-agent's job (manual approval required). This command writes
  ONLY to `general.md` for fast capture.
