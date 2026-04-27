# EOD reports — convention

End-of-day status reports for QA Nexus PM1. Established 2026-04-27 per skill alignment audit P1.10.

These reports are the daily build journal — they survive in the repo (so future contributors and Akshay can scrub the timeline without scrolling chat transcripts) and pair with `docs/CHANGELOG.md` (commit-level granularity) at a higher altitude (day-level signal).

---

## Filename convention

```
docs/eod-reports/YYYY-MM-DD-day-N.md
```

Where:

- `YYYY-MM-DD` is the calendar date the EOD was posted (Asia/Kolkata local time).
- `N` is the day count since Day 0 (Day 0 = 2026-04-26, the kickoff day; Day 1 = 2026-04-27, etc.).

Examples:

- `2026-04-26-day-0.md` — kickoff day, plan accepted + Phase 0 complete + first 10 commits to main + CF Pages live
- `2026-04-27-day-1.md` — skill alignment audit + P0 batch + worktree split for parallel chats
- `2026-09-21-day-148.md` — GA day (target)

If multiple sessions land on the same calendar day (rare), append `-evening` / `-late` suffix:

- `2026-04-27-day-1.md` (morning + afternoon work)
- `2026-04-27-day-1-evening.md` (post-EOD-report fixes that warranted a separate log)

---

## Required sections (kickoff §5 format)

Every EOD MUST contain these 5 sections, in this order:

```markdown
# EOD — Day N (YYYY-MM-DD)

## Completed today

- <2-8 bullets, each citing commit SHA(s) where applicable>
- <Use the `<type>(<scope>)` conventional-commit prefix to make scanning easy>

## In flight

- <Work that's started but not committed or is partially blocked>
- <Include "owned by: <chat / Yogesh>" if multi-chat work>

## Blockers

- <Anything stopping forward progress>
- <"None" is a valid entry>

## Tomorrow

- <Top 3-5 priorities for the next session>
- <Include estimated effort + owner where known>

## Free-tier quota usage

- Cloudflare Pages: <X> deploys / 500 mo
- GitHub Actions: <X> min / 2,000 mo
- Neon: <X> GB / 0.5 GB cap
- Render: <X> hours / free dyno
- Resend: <X> emails / 3,000 mo
- R2: <X> GB transfer / 10 GB mo
- Groq: <X> req / 1,000 RPD (gpt-oss-120b primary)
- Gemini: <X> req / 1,500 RPD (fallback)
- **Total infra cost: $0/month confirmed.** ✓
```

---

## Optional: token-savings summary block

If the `/token-savings` command is wired (depends on MS0-T035 hook landing in the BE chat), append this block at the bottom:

```markdown
## Token savings (auto-populated from .claude/token-savings.jsonl)

- Today: ~<X> tokens saved across <N> sessions (~$<Y>)
- Week-to-date: ~<X> tokens saved (~$<Y>)
- Cumulative: ~<X> tokens saved (~$<Y>)
- Memory health: <healthy / consider /reorganize-memory / urgent>
```

Insert by running `/token-savings` and copying its output into the EOD draft.

---

## Time of post

**17:00 IST** (5:00 PM Asia/Kolkata) every working day. If a session runs past 17:00, post the EOD just before standing down regardless of clock time.

The 17:00 IST cadence pairs with the kickoff §5 communication preference and Akshay's review window (he's typically available 18:00–20:00 IST to read async).

---

## Posting workflow

1. Open `docs/eod-reports/YYYY-MM-DD-day-N.md` in editor (use today's date + day count).
2. Use the template above (5 required sections + optional token-savings).
3. Cross-link any new ADRs, audit docs, or deploy logs by relative path.
4. Commit with conventional message: `docs(eod): post Day N EOD report`.
5. Push.
6. (Optional but encouraged) drop the live URL or screenshot into Slack for Akshay if there's anything visual to show.

---

## What NOT to put in an EOD

- **Raw chat transcript dumps** — that's what `.claude/projects/<repo>/` is for. EOD is the curated 5-section summary.
- **Confidential customer data** — these reports are committed to a public-internal repo at github.com/yogeshmohite-iksula/QA-Nexus. Only PM1 / Iksula-internal context belongs here.
- **Unreviewed predictions** — "Tomorrow" is a planning aid, not a contract. Don't promise specific times you can't keep.
- **Personal status** — sick days, PTO, etc. live in HR systems, not the build journal.

---

## Cross-references

- `docs/CHANGELOG.md` — commit-level granularity (the EOD points at the day's CHANGELOG entries by SHA)
- `docs/audits/` — periodic deep-dives (skill alignment, security, performance) — referenced from EOD when an audit lands
- `CLAUDE.md` — Communication preferences section references this convention
