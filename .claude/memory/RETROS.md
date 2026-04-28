# RETROS — per-session and per-milestone retrospectives

> Append-only log of what worked / what didn't / what to try tomorrow.
> Maintained primarily by the `@retro-agent` subagent (invoke at end of session
> or end of milestone). Format: most-recent at top, ISO-8601 date headers.

## Format (binding)

```markdown
## YYYY-MM-DD — Day N (or "M0 retro", "Sprint 1 retro", etc.)

### What worked

- ...

### What didn't

- ...

### What to try tomorrow / next iteration

- ...

### Cross-references

- Commit SHAs / PR numbers / EOD report links
```

## Maintenance rules

- **Append-only.** Never edit a previous entry — if a learning was wrong, write a new entry that supersedes it and link back.
- **Keep it under 500 lines.** When it grows, the retro-agent should propose moving older entries into `archive/RETROS-pre-YYYY.md`.
- **Per-session retros are OPTIONAL.** Yogesh decides at end-of-day whether to invoke `@retro-agent` for a per-session retro. The EOD report (`docs/eod-reports/YYYY-MM-DD-day-N.md`) is the canonical daily artifact; this file captures only the introspective layer.
- **Per-milestone retros are MANDATORY.** Run `@retro-agent` at end of M0, M1, M2, M3, M4, M5, M6 before tagging the milestone release.

---

## 2026-04-28 — Day 2 (Block 4 seed entry)

### What worked

- Worktree-based parallel-chat workflow is now mature enough that 5 blocks of solo MAIN work fit comfortably in a 12-hour day with predictable cadence.
- Inventory-first approach (check what already exists before adding) saved ~30% of Day-2 effort vs assuming everything from the user spec is new — many "new" items in Block 2/3/4 were already shipped Day 1 and only needed augmentation.
- Adding curated memory files (CLAUDE_DECISIONS, STACK_LEARNINGS, IKSULA_CONTEXT, PM1_PATTERNS) before they're needed (rather than after a recurring miss) puts the right context in front of Claude on every relevant Edit.

### What didn't

- The user's Day-2 spec assumed Day-1 hadn't shipped Memory System / subagents / CHANGELOG / ARCHITECTURE — but those landed in P0/P1 batches yesterday. Reading the existing state ate context budget on every block. Mitigation for tomorrow: always run a `git log --oneline -10` + `ls .claude/{hooks,memory,commands,agents}` AT THE TOP OF SESSION before reading any task block.
- The /compound-learnings command says "single file (general.md)" while my updated memory.md initially said "auto-routes by tag" — internal contradiction caught + fixed mid-block 3, but ate ~5 min.

### What to try tomorrow / next iteration

- At session start, run a 30-second "current state snapshot" (last 10 commits + memory tree + open follow-ups) BEFORE reading any new task spec. This pre-empts the "user thinks X doesn't exist when it does" failure mode.
- Add a `/whats-next` slash command that auto-rebuilds `docs/STATUS.md` from git log + GH PRs + free-tier API responses — referenced in STATUS.md as planned but not yet implemented.

### Cross-references

- Day 2 block-1 commit `742982c` (closed 3 followups)
- Day 2 block-2 commit `945c3ef` (status line + STATUS.md + CHANGELOG-add command)
- Day 2 block-3 commit `5dcdb38` (4 memory files)
- (this commit) Day 2 block-4 — pre-push CHANGELOG guard + RETROS seed
- `docs/eod-reports/2026-04-28-day-2.md` (lands at end of block 5)
