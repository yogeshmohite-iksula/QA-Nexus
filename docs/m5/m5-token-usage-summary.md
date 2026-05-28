# M5 Token Usage Summary + Cost-Gate Retrospective

> **Window:** M5 (Day-15 2026-05-10 → Day-28 2026-05-27, ~14 calendar days incl. 3 orchestrator-absence days).
> **Purpose:** Hard Rule 1 ($0/month cost gate) retrospective evidence for the M5 retro (Thu Day-29).
> **Source:** per-day EOD §5 "Free-tier quota usage" sections + Day-28 cascade observation.
> **Verdict (headline):** ✅ **$0/month cost gate held across all of M5.** No paid component introduced. All hosted free tiers stayed within ceiling with comfortable headroom.

---

## 1. Free-tier ceiling vs peak usage (M5 window)

| Provider           | Free-tier ceiling                                       | M5 peak (single day)                 | M5 status                | Notes                                                                            |
| ------------------ | ------------------------------------------------------- | ------------------------------------ | ------------------------ | -------------------------------------------------------------------------------- |
| **Groq RPD**       | 1,000/day (`gpt-oss-120b`) + 14,400/day (`gpt-oss-20b`) | **~424/1000** (Day-28 AC042 re-eval) | ✅ ~58% headroom at peak | AC042 binding eval is the only heavy LLM burn; ~200 calls/run × 2 runs Day-27/28 |
| **Neon CU-hr**     | 100/month                                               | **~85/100** (cumulative end-M5)      | ✅ within ceiling        | scale-to-zero; cascade CI push storms add small deltas                           |
| **GitHub Actions** | 2,000 min/month                                         | **~14 min** (Day-28 cascade peak)    | ✅ <1% of budget         | Phase A/B builds + rebase re-pushes; each job ~30-60 sec                         |
| **Gemini RPD**     | 1,500/day (fallback)                                    | ~0 most days                         | ✅ untouched             | fallback rarely triggered; Groq primary held                                     |
| **Cloudflare R2**  | 10 GB free                                              | ~0 writes                            | ✅ untouched             | frame ports don't upload                                                         |
| **Render Hobby**   | 750 hr/month                                            | scale-to-zero                        | ✅ within                | ADR-021 `02:30 IST` cron is the only scheduled wake                              |
| **Resend**         | 3,000 emails/month                                      | ~0                                   | ✅ untouched             | no transactional email in M5 scope                                               |
| **Atlassian**      | 350 req/hr                                              | ~0 (webhook inbound only)            | ✅ untouched             | webhooks are inbound; no outbound Jira polling                                   |

**Key insight:** the binding cost-gate risk in M5 was always **Groq RPD** (the AC042 corpus eval is the only workload that approaches a free-tier ceiling). Peak was ~424/1000 = 42% utilization on the worst day (Day-28, two eval runs). Comfortable margin; no upgrade pressure.

## 2. AC042 LLM-budget detail (the only material LLM cost)

- **Per binding run:** ~200 Groq calls (4 Sherlock agents × 50-defect corpus).
- **Day-27 FAIL run:** ~200 calls (wasted on the Zod-validation bug — see §4 leak).
- **Day-28 smoke + PASS run:** ~200 calls + ~24 smoke calls.
- **Cumulative AC042 burn Day-27+28:** ~424 RPD on the heaviest day, still 58% under the 1,000 `gpt-oss-120b` ceiling.

## 3. ctx-mode token-discipline adoption (per CLAUDE.md Token discipline §)

**Wins:**

- `ctx_batch_execute` used for multi-command gather (research + bulk gh queries) across BE+1/FE+1 sessions — collapses N round-trips to 1.
- `ctx_execute` used for log/data processing kept raw eval output in the sandbox (AC042 results JSON never flooded context).
- Pre-check pattern (Day-28): lightweight `gh pr view --jq` loops over 24+ PRs returned ~1 line/PR — surfaced 2 CONFLICTING Phase A PRs before the merge wave without dumping full PR bodies into context.

**Adoption gaps (areas of leak):**

- **MCP server cycling** (context-mode disconnected/reconnected repeatedly mid-session Day-25→28) forced fallback to native Bash for git ops. Mitigated by keeping all such Bash outputs <20 lines (HEAD checks, compact `--jq` loops). No large-output Bash leaks observed, but the ctx-mode tools were unavailable for stretches.
- **Day-27 AC042 FAIL = ~200-call leak** — a 60-min full-corpus eval burned on a schema bug a 4-call smoke would have caught (see §4). This is the single largest _avoidable_ resource spend in M5.

## 4. Largest avoidable leak: AC042 FAIL full-run (Day-27)

The Day-27 binding eval ran the full 50-defect corpus (~200 Groq calls, ~60 min) only to discover all 4 agents returned 0 hypotheses due to a Zod-schema mismatch — a defect a **1-defect smoke (4 calls, ~15s)** would have surfaced immediately. **M6 mitigation (adopted):** `pnpm ac042:smoke` (or `AC042_LIMIT=1`) gate BEFORE any full binding eval. Saves ~196 calls + ~55 min per future eval-gate failure.

## 5. Recommendations for M6

1. **Smoke-first eval gates** — never fire a full corpus eval without a 1-row smoke passing first (closes the §4 leak class).
2. **ctx-mode resilience** — investigate the MCP server cycling (Day-25→28 disconnect pattern); the token-discipline rules assume ctx-mode availability that wasn't consistent in M5.
3. **Work-log regen-from-source** — binary xlsx merge conflicts (Day-28 #207) waste cycles; regenerate from `update-work-log.py` in close ceremonies rather than merging binary diffs.
4. **Groq headroom monitoring** — AC042 is the cost-gate-critical workload; if M6 expands the corpus beyond 50 defects, model the RPD impact (n=100 → ~400 calls/run → still under 1,000 but margin shrinks).

---

## 6. Cost-gate verdict (Hard Rule 1)

✅ **PASS.** M5 closed at **$0/month** total infra. No paid component introduced; no ADR required a paid-tier escalation. The AC042 LLM workload — the only material cost driver — peaked at 42% of the binding Groq free-tier ceiling. Hard Rule 1 held across the entire milestone including the 3-day orchestrator-absence slip (which cost calendar time, not money).

_Authored Day-28 2026-05-27 post-close. Numbers from per-day EOD §5 sections; peaks are single-day maxima, not cumulative-month (Neon CU-hr is the only cumulative-month metric). Estimates marked ~ where exact per-call telemetry wasn't captured. Feeds M5 retro Thu Day-29._
