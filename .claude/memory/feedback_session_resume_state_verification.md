# feedback — session resume state verification (Day-22 pattern, 2026-05-19)

**Status:** PATTERN OBSERVED Day-22 multiple times. Reusable across all multi-session work.

## TL;DR

When a chat session resumes (via `/resume`, hook-loaded context, or background-agent handoff), the FIRST tool call should always be a **resume-state pulse**: a batched `gh pr list` + `git branch --show-current` + `git log origin/main --oneline -3` + `git status --short` query that confirms 4 invariants before any Edit/Write happens. Today's Day-22 session lost ~10 min to discovering branch drift, untracked files, and merged-PR state changes mid-task. A 30-second pulse at session start prevents the entire recovery cycle.

## The 4-invariant resume-state pulse

```
1. Current branch matches expected/intended branch?
   → git branch --show-current
2. origin/main HEAD matches my last-known state?
   → git log origin/main --oneline -3
3. Open PRs (mine + cross-author) still match my expectations?
   → gh pr list -R <repo> --state open --json number,title,headRefName,mergeable
4. Working tree is clean (or expected dirt is accounted for)?
   → git status --short
```

Run all 4 in a single `ctx_batch_execute` at session start. ~5 seconds wall-time; ~30 lines of output. Index for follow-up `ctx_search`.

## When to run the pulse

- **Always at session start** (post-`/resume`, post-hook-load, post-handoff).
- **Before any commit** if more than 15 minutes have passed since the last pulse (background agents may have moved branches mid-window).
- **After any branch switch** done by me or recovered from a branch-drift incident.

## What today's Day-22 session looked like WITHOUT a proper pulse

- 11:50 — started ADR-020 edits assuming I was on `docs/main-adr-020-jira-sync` (the branch I created Day-21)
- 12:00 — file edit succeeded; commit failed because background BG agent had reset HEAD to origin/main (89a5550) ~30 sec earlier
- 12:05 — recovery cycle: identify in reflog the commit (b924e1b) where my work landed; cherry-pick onto the correct base; force-push
- **Lost time:** ~10 min for one branch-drift incident; happened 4× during Day-22 P0 + P1 + P2

## What today's Day-22 session looked like WITH a hypothetical pulse pre-flight

- Session start 11:30 — pulse runs in 5 sec; surfaces "current branch = docs/main-day-21-eod-amend, origin/main = 89a5550 (advanced from yesterday's 3b598c3), PR #178 newly MERGED"
- I see the changed state explicitly + know to switch to `docs/main-adr-020-jira-sync` BEFORE editing
- 11:31 — explicit `git checkout docs/main-adr-020-jira-sync` + verify branch
- 11:32 — Edit + commit + push all land on the right branch first try

## Cost-benefit math

- **Cost of pulse:** ~5 sec wall-time × 4 sessions/day = 20 sec/day
- **Avoided cost of branch-drift recovery:** ~10 min × 4 incidents/day = 40 min/day
- **ROI:** 120× return on the time investment

## Reusable cmd snippet (for ctx_batch_execute)

```ts
ctx_batch_execute({
  commands: [
    { label: 'branch', command: 'git branch --show-current' },
    {
      label: 'main-head',
      command:
        'git fetch origin --quiet 2>&1; git log origin/main --oneline -3',
    },
    {
      label: 'open-prs',
      command:
        'gh pr list -R yogeshmohite-iksula/QA-Nexus --state open --limit 20 --json number,title,headRefName,mergeable 2>&1',
    },
    { label: 'wt-status', command: 'git status --short | head -15' },
  ],
  queries: ['current branch', 'main HEAD', 'open PRs', 'working tree state'],
});
```

## Cross-references

- `feedback_branch_lineage_drama.md` — sibling memory; pulse is the prevention, lineage drama is the recovery cost
- `feedback_parallel_chat_routing_paste_drift.md` — sibling memory; in multi-window setups the pulse also surfaces "did the right window get the paste"
- `feedback_chained_base_squash_gotcha.md` (Day-20) — same prevention principle for a different failure mode

---

_Entry Day-22 2026-05-19 ~17:30 IST. Promote to STACK_LEARNINGS.md once 2nd session validates the pulse-prevents-drift pattern. Pair with the Day-23 hook proposal (pre-tool-use branch-parent assertion)._
