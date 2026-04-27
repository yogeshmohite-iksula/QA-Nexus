---
description: Invoke consolidate-memory skill against .claude/memory/ — merge duplicates, prune stale entries, return diff summary
---

PM1-customized version. Wraps the `anthropic-skills:consolidate-memory` skill
when available; falls back to inline cleanup logic if the skill isn't loaded.

## Process

1. **Check for the skill:** if `anthropic-skills:consolidate-memory` is in
   the available-skills list, invoke it with `path=.claude/memory/`.

   ```
   /anthropic-skills:consolidate-memory path=.claude/memory/
   ```

   The skill applies its standard rules (merge duplicates, fix stale facts,
   prune the index) and returns a diff summary. Done.

2. **Fallback (skill not loaded):** apply Huryn's 7 cleanup rules in order
   to all files in `.claude/memory/`:
   1. **Remove duplicate entries.** Keep the entry with the most recent date
      stamp (or the more detailed wording if dates are identical).
   2. **Remove outdated/superseded entries.** If a later entry contradicts
      an earlier one, keep only the later. Mark the removed entry's date
      in the commit message for traceability.
   3. **Merge same-topic entries** into one consolidated entry. Keep all
      cited commit SHAs.
   4. **Split files over 200 lines** into focused sub-files under the same
      directory. Update `.claude/memory/memory.md` index to point at new files.
   5. **Re-sort entries by date** within each file (most recent at top).
   6. **Prune entries unreferenced in 90+ days** ONLY if explicitly approved
      by the user. Default: keep everything (PM1 is too young — entries
      will mostly be < 30 days old until M3+).
   7. **Update `.claude/memory/memory.md`** to reflect any newly created
      sub-files.

3. **Hard guard before write:** check that no `${...}` placeholders survive:

   ```bash
   ! grep -rq '\${' .claude/memory/ && echo "✓ no placeholders" || { echo "✗ placeholder found"; exit 1; }
   ```

4. **Print diff summary:**

   ```
   /reorganize-memory complete:
   ✓ X duplicates removed
   ✓ Y entries merged into Z consolidated entries
   ✓ M files split (memory.md index updated)
   ✓ N entries pruned as stale (>90 days, user-approved)
   → Net change: +A lines / -B lines across <file count> files
   → Run `git diff .claude/memory/` to review
   ```

5. **Do NOT auto-commit.** Print the suggested commit message:

   ```
   docs(memory): consolidate via /reorganize-memory — X duplicates / Y merged / M split

   Run `/commit` to commit + push.
   ```

## Hard Rules

- **NEVER prune entries < 30 days old** — too young to know if relevant.
- **NEVER drop cited commit SHAs** — they're how future retros find context.
- **NEVER auto-commit** — Yogesh reviews the diff first.
- **ALWAYS preserve the YYYY-MM-DD date prefix** on every entry.
- **NEVER touch `general.md`'s "Compound learnings" section** in a destructive
  way — only deduplication is OK; never reordering across dates (those are
  user-appended via /compound-learnings and the order matters for context).
- **ALWAYS run the placeholder hard-guard** (step 3) before declaring done.
