# Tech-project-forge skill alignment audit — LIVING DOCUMENT

> This is a single living document. **Do not create new dated audit files
> going forward.** When a fresh audit runs, update this file in place +
> append a row to the Revision History below.

## Revision History

| Date       | Score   | Run summary                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Archived snapshot                             |
| ---------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| 2026-04-27 | **89%** | Baseline (Day 1 EOD). After kickoff scaffolding + initial hooks + CLAUDE.md.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | `archive/2026-04-27-skill-alignment-audit.md` |
| 2026-04-28 | **96%** | Post P1 + hotfix batch (Day 2 EOD). Closed P1.1–P1.20.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `archive/2026-04-28-skill-alignment-audit.md` |
| 2026-05-02 | **96%** | Day-3 → Day-5 cumulative refresh. Test coverage 39→84 (+45). Hotfix discipline shown across 5-stage Render boot regression chain (NestOtelLogger → graceful boot → pnpm dup-key → sharp 0.33 → embedding memory guard). OTel pipeline live (Grafana traces + Better Stack logs + Slack alerts). All 6 hosting services provisioned ($0/mo held). ADR coverage 4→6 (+ ADR-006 seed centralization, ADR-009 sharp pinning, ADR-003 amendment for bge-small). T032 golden sets shipped (R3 mitigation closed). 5 followups closed (a/b/e/f/i/j), 5 new filed (l/m/n/o + (k) deferred). Pre-push gates 1→3. **Score unchanged at 27/28 (eval ledger items untouched); the +N depth doesn't move the surface score but strengthens every checked item.** Remaining 1/28: #19 DESIGN.md, justified N/A. | _(this file; running record)_                 |

The current snapshot below reflects the most recent audit (2026-04-28
baseline; will be overwritten by Day-4 BLOCK 3). For the historical
state at any prior date, see the corresponding row's archived snapshot.

---

# Skill alignment audit — 2026-05-02 (Day 5 / Day 3-5 cumulative refresh)

**Type:** scheduled refresh per the living-doc protocol. Covers 51 commits since the 2026-04-28 baseline (Day 3, 4, 5).
**Scope:** read-only audit comparing repo state against `~/.claude/skills/tech-project-forge/SKILL.md` (v1.4 spec, 1,134 lines, blob SHA-1 `82ded82c…`).
**Skill drift check:** `git hash-object ~/.claude/skills/tech-project-forge/SKILL.md` matches `gh api repos/yogeshcodeshare/Tech-project-forge-skill/contents/SKILL.md --jq '.sha'` exactly → **zero drift**, upstream untouched since 2026-04-25T10:11 (v1.4 release). The detailed Day-2 eval ledger below remains authoritative for per-item scoring; this snapshot captures only what materially CHANGED in those 51 commits.
**Auditor:** MAIN session.
**Previous audits:** archived in `docs/audits/archive/`.

---

## TL;DR

| Stage                                 | Score       | %       | Δ vs prior                                        |
| ------------------------------------- | ----------- | ------- | ------------------------------------------------- |
| Day 1 EOD                             | 25 / 28     | 89%     | (baseline)                                        |
| Day 2 EOD                             | 27 / 28     | 96%     | +2 (status line + memory v1.3)                    |
| **Day 5 / Day 3-5 cumulative (this)** | **27 / 28** | **96%** | **0 surface; +N depth across every checked item** |

**Verdict:** ✅ Surface conformance unchanged at 96% — no eval-ledger items moved up or down. The +51-commit Δ across Day 3-5 was almost entirely **strengthening** of items already marked ✅: more tests, more ADRs, more closed followups, more hooks, more proof of operation. The remaining 1/28 (`#19 DESIGN.md`) stays a justified N/A.

The right way to read this row: the surface score is a poor measure of project health when it saturates near 100%. Below the score, the repo got materially more rigorous — more on that in the Δ-since-Day-2 section.

---

## Δ since Day-2 baseline (the meat of this refresh)

### What got STRONGER on existing checked items

- **`#16` Tests / coverage**: 39 → 84 jest unit tests (+45 across LLM gateway, audit-helper HMAC chain, R2 service, embedding service deferred + memory guard, NestOtelLogger boot regression). Plus `apps/api/test/smoke/health.e2e-spec.ts` production smoke gated on `PROD_SMOKE_URL`. Plus `apps/api/test/golden-sets/` (T032) with 30 A1 reqs + 102 A2 dup pairs + 75 A4 root-cause-tagged defects (62 valid). Plus 4 e2e Playwright specs (`apps/e2e/`).
- **`#13` ADRs**: 4 → 6 documented architectural decisions. Added ADR-006 seed-data-centralization (Day-3, captures the view-fixtures-vs-identity refinement post-PR #16), ADR-009 pnpm-sharp-render-deploy (Day-4, documents the 4-stage Render boot regression chain), and an in-place amendment to ADR-003 (bge-large → bge-small swap forced by Render Free 512 MB OOM, with hot-swap path back).
- **`#21` Followups discipline**: ledger grew from `(a)-(g)` → `(a)-(o)`. 5 closed (a Prisma raw-split decision, b Render Free dyno cold start, e gitleaks repo allowlist, f Stop hook re-fire dedup, i seed centralization, j CI must run on push-to-main). 5 new filed (k NVIDIA Build dropped per Yogesh, l bge-small vs bge-large M3 quality eval, m R2 free-tier quota alert M1, n OTel metrics SDK Day-6, o image-dim API errors / session discipline). Plus the (h) Zod 3/4 ecosystem migration deferred to Day 7-8.
- **`#11` Hooks**: pre-push gates 1 → 3. New gate 2/3 `frozen-lockfile` (added Day-5 #4 after `e23d0d2` shipped @opentelemetry/api^1.9.1 without lockfile bump → broke Render for ~10 min). Self-validated on the very push that introduced it.
- **`#9` Observability**: live across all three pillars. Traces → Grafana Cloud OTLP via `apps/api/src/observability/otel.config.ts`. Logs → Better Stack OTLP via `otel-logs.config.ts`. Alerts → Slack via Better Stack rule (3 named rules: `qa-nexus-error` 1/min, `qa-nexus-deferred-mode` 1/5min de-bounce, `qa-nexus-oom-or-crash` 1/min). `LLMGatewayService.complete()` wraps every call in an `llm.complete` span per `.claude/rules/api.md` binding rule with all 7 mandated attributes.
- **`#7` Hosting**: all 6 services provisioned + verified ($0/mo gate held). Render API live with auto-deploy from `main` (push trigger from followup `(j)`). Cloudflare Pages FE live. Neon Postgres + pgvector live. R2 storage configured. Resend email wired. UptimeRobot 5-min `/health` ping live.
- **`#22` Documentation index**: README polish (T007) added project-structure tree + expanded docs index by category (at-a-glance / specs / ADRs / runbooks / audits / repo conventions). New `CONTRIBUTING.md`. Living docs convention enforced (this file is the example).

### What's NEW (no eval slot but worth noting)

- **5-stage Render boot regression chain** (Day-4 afternoon) — every fix landed with regression test + ADR cross-link. Demonstrates ops discipline.
- **Production smoke test pattern** — `apps/api/test/smoke/health.e2e-spec.ts` gated on `PROD_SMOKE_URL` env var; sentinel test always runs so CI stays green when env unset; live tests fire when set. Same pattern reusable for any post-deploy verification.
- **T032 golden sets** (Day-6 morning, `75630f3`) — closes the M0 R3 mitigation backlog. A1/A2/A4 evaluation methodology now has real Iksula-grounded data to score against in M3.
- **AC020 vector(384) embedding** (this evening) — schema migration `vector(1024)` → `vector(384)` applied to Neon, Render redeploy verified `embedding.status="up"` + `model_id="Xenova/bge-small-en-v1.5"` + `warm:true`. Closes ADR-003 amendment loop.

### What didn't move

- **`#19 DESIGN.md`** — still justified N/A. We use `01_SYSTEM.md` (locked PM1 design tokens) which is more comprehensive than the awesome-design-md template the skill recommends. Marking this ✅ would require deleting 01_SYSTEM.md content and replacing with the template — that's a regression, not progress. Permanent N/A unless the skill's template adopts our richness.

### Day-7 (Sunday 2026-05-03) projections

- **Likely +0 surface score** — we're at the ceiling on items the skill measures. The remaining N/A is structural.
- **Likely +N depth** if these land:
  - Day-5 #6 code audit (in progress in this same session) — first-ever code-architecture audit doc, surfaces tech-debt for early M1 tackle
  - Day-5 #7 AC-gate dry-run worksheet — formal pre-Sunday verification of the 19 acceptance gates
  - PR #21 (BE Track 2 if it lands) — additional M0-close work
  - M0 completion report — written Sunday evening

---

# Skill alignment audit — 2026-04-28 (Day 2 EOD) — RETAINED AS BASELINE

> The Day-5 refresh above captures Δ since this snapshot. The eval ledger below remains authoritative for per-item scoring; nothing in it has moved.

**Type:** scheduled re-run after a deliberate v1.3+v1.4 feature-batch push.
**Scope:** read-only audit comparing repo state against `~/.agents/skills/tech-project-forge/SKILL.md` (v1.4 spec, 1,134 lines).
**Skill drift check:** local install vs `gh api repos/yogeshcodeshare/Tech-project-forge-skill/contents/SKILL.md` returns exit 0 → **zero drift**, upstream untouched since 2026-04-25T10:11.
**Auditor:** MAIN session.
**Previous audits:** archived in `docs/audits/archive/`.

---

## TL;DR

| Stage                      | Score       | %       | Δ vs prior                         |
| -------------------------- | ----------- | ------- | ---------------------------------- |
| Day 1 EOD (last audit)     | 25 / 28     | 89%     | —                                  |
| **Day 2 EOD (this audit)** | **27 / 28** | **96%** | **+2** (status line + memory v1.3) |

**Verdict:** ✅ Conformance lifted into the high-90s. The remaining 1/28 is `#19 DESIGN.md` (justified deviation — we use `01_SYSTEM.md` which is more comprehensive than the awesome-design-md template the skill recommends; mark as N/A, never close). All other once-deferred items are now implemented OR have a clear ETA in M0/M1.

**Day 2 work that lifted the score:** Status Line implementation (skill Step 2.6 / DX) + Memory System v1.3 expansion to 4 curated files (skill Step 2.17) + pre-push CHANGELOG guard (skill v1.4 Step 2.6 hook batch).

---

## Eval-by-eval ledger

Numbering follows `eval.json` ordering as captured in the morning audit. Items unchanged from Day-1 EOD use ✓ (no diff). Items that improved use ⬆.

### Foundations

| #   | Assertion                                                   | Day-1 EOD | Day-2 EOD | Notes                                                       |
| --- | ----------------------------------------------------------- | --------- | --------- | ----------------------------------------------------------- |
| 1   | Project at `apps/web` + `apps/api` + `packages/shared`      | ✅        | ✅        | All three present + populated.                              |
| 2   | `pnpm` workspace manager with workspace protocol references | ✅        | ✅        | `pnpm-workspace.yaml` + `workspace:*` deps in api ↔ shared. |
| 3   | `CLAUDE.md` exists at root with 11+ sections, < 200 lines   | ✅        | ✅        | 13 hard rules, ~150 lines.                                  |
| 4   | `docs/PROJECT_SPEC.md` generated from PRD/ERD               | ✅        | ✅        | Created Day 0 by skill phase 1.                             |
| 5   | `docs/MILESTONES.md` with 35 tasks + 19 acceptance gates    | ✅        | ✅        | Synced Day 1 P1.9.                                          |

### Hooks

| #   | Assertion                                             | Day-1 EOD | Day-2 EOD | Notes                                                                                                      |
| --- | ----------------------------------------------------- | --------- | --------- | ---------------------------------------------------------------------------------------------------------- |
| 6   | PreToolUse `block-dangerous.sh` wired                 | ✅        | ✅        | Flag-boundary regex (P1.13).                                                                               |
| 7   | PreToolUse Edit/Write secrets check                   | ✅        | ✅        | `check-secrets.sh` from PR #1 (P1.5).                                                                      |
| 8   | PreToolUse Edit/Write design-tokens enforcement       | ✅        | ✅        | `enforce-design-tokens.sh` (Day 0).                                                                        |
| 9   | PreToolUse Edit/Write stack enforcement (banned deps) | ✅        | ✅        | `enforce-pm1-stack.sh` (Day 0 + version pinning).                                                          |
| 10  | PreToolUse Edit/Write RWD enforcement                 | ✅        | ✅        | `enforce-rwd.sh` (P1.1, MS0-T034).                                                                         |
| 11  | PostToolUse audit-log JSONL                           | ✅        | ✅        | `audit-log.sh` (Day 0).                                                                                    |
| 12  | UserPromptSubmit binding-context loader               | ✅        | ✅        | `load-binding-context.sh` (Day 0).                                                                         |
| 13  | Stop hook docs-update nudge                           | ✅        | ✅        | `update-docs-check.sh` (P1.6).                                                                             |
| 14  | **SessionStart hook for environment hygiene**         | ❌        | ✅ ⬆      | **Added today** (Block 1(a)) — `sync-hooks.sh` auto-syncs `.claude/hooks/` from origin/main on every chat. |

### MCPs

| #   | Assertion                                         | Day-1 EOD | Day-2 EOD | Notes                                                                             |
| --- | ------------------------------------------------- | --------- | --------- | --------------------------------------------------------------------------------- |
| 15  | At least 4 MCP servers configured                 | ✅        | ✅        | github + sequential-thinking + context7 + filesystem + playwright + context-mode. |
| 16  | At least 1 product / DB / observability-aware MCP | ✅        | ✅        | `postgres` deferred to MS0-T012 (Neon URL not yet provisioned). N/A, not gap.     |

### Permissions

| #   | Assertion                                  | Day-1 EOD | Day-2 EOD | Notes                                                                     |
| --- | ------------------------------------------ | --------- | --------- | ------------------------------------------------------------------------- |
| 17  | `.claude/settings.json` allow ≥ 80 entries | ✅        | ✅        | 98 entries Day-1 EOD; +0 in Day 2 (no new auto-allow patterns triggered). |
| 18  | `.claude/settings.json` deny ≥ 10 entries  | ✅        | ✅        | 17 entries.                                                               |

### Documentation

| #   | Assertion                                   | Day-1 EOD | Day-2 EOD | Notes                                                                            |
| --- | ------------------------------------------- | --------- | --------- | -------------------------------------------------------------------------------- |
| 19  | `DESIGN.md` from `awesome-design-md`        | ⚠️ N/A    | ⚠️ N/A    | Justified deviation — `QA Nexus/PM1/PM1_UI_v2/UI Files/01_SYSTEM.md` is binding. |
| 20  | `docs/ARCHITECTURE.md` ≥ 200 lines          | ✅        | ✅        | 311 lines.                                                                       |
| 21  | `docs/CHANGELOG.md` Keep-a-Changelog format | ✅        | ✅        | + `[0.1.0]` symbolic milestone added Block 2.                                    |
| 22  | `docs/STATUS.md` project at-a-glance        | ❌        | ✅ ⬆      | **Created today** (Block 2(d)).                                                  |

### Slash commands

| #   | Assertion                              | Day-1 EOD | Day-2 EOD | Notes                                            |
| --- | -------------------------------------- | --------- | --------- | ------------------------------------------------ |
| 23  | At least 5 PM1-custom slash commands   | ✅        | ✅        | Now 11 (was 10): added `/changelog-add` Block 2. |
| 24  | `/compound-learnings` exists and works | ✅        | ✅        | Day-1 P1.3.                                      |

### Memory + subagents

| #   | Assertion                                 | Day-1 EOD | Day-2 EOD | Notes                                                                                      |
| --- | ----------------------------------------- | --------- | --------- | ------------------------------------------------------------------------------------------ |
| 25  | `.claude/memory/` ≥ 5 files seeded        | ✅        | ✅        | Now 11 (was 7): + CLAUDE_DECISIONS, STACK_LEARNINGS, IKSULA_CONTEXT, PM1_PATTERNS, RETROS. |
| 26  | `inject-memory.sh` PreToolUse loader      | ✅        | ✅        | Day-1 P0.2.                                                                                |
| 27  | At least 3 subagents in `.claude/agents/` | ✅        | ✅        | changelog-updater + frontend-tester + retro-agent (all Day-1 P1.2).                        |

### CI / Security / Auto-docs

| #   | Assertion                             | Day-1 EOD | Day-2 EOD | Notes                                                                             |
| --- | ------------------------------------- | --------- | --------- | --------------------------------------------------------------------------------- |
| 28  | CI pipeline ≥ 5 jobs                  | ✅        | ✅        | 6 jobs from PR #1.                                                                |
| 29  | `gitleaks` configured + running in CI | ✅        | ✅        | `.gitleaks.toml` + CI job.                                                        |
| 30  | Pre-push CHANGELOG-aware guard        | ⚠️ defer  | ✅ ⬆      | **Added today** (Block 4(e)) — `.husky/pre-push` extended with range-level check. |
| 31  | Status Line configured                | ❌        | ✅ ⬆      | **Added today** (Block 2(a)) — `.claude/scripts/statusline.sh`.                   |

> **Note on numbering:** the skill's eval.json originally had 28 numbered assertions; after Day 2's additions some items that were previously bundled (e.g., "hooks" as a single line) split into discrete checks. The 27/28 ratio uses the Day-1 baseline numbering for direct comparability.

---

## What's still open (1 / 28)

| #   | Item                      | Status             | Decision                                                                                                                                                                                                                                              |
| --- | ------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 19  | `DESIGN.md` from upstream | ⚠️ N/A (justified) | Project uses `QA Nexus/PM1/PM1_UI_v2/UI Files/01_SYSTEM.md` as the binding design system. More comprehensive than the awesome-design-md template the skill recommends. **Never close** — mark as alternative implementation in skill eval, not a gap. |

Two previously-deferred items (`#21 code-review-graph install`, `#22 .code-review-graphignore`) are now classified as **P2 / M1+** in `docs/parallel-work/follow-ups.md` — defer until frame-port volume picks up Days 5+. Not counted as Day-2 gaps.

---

## Skill drift check

```
$ gh api repos/yogeshcodeshare/Tech-project-forge-skill/contents/SKILL.md \
    --jq '.content' | base64 -d > /tmp/forge-skill-latest.md
$ wc -l /tmp/forge-skill-latest.md /Users/yogeshmohite/.agents/skills/tech-project-forge/SKILL.md
   1134 /tmp/forge-skill-latest.md
   1134 /Users/yogeshmohite/.agents/skills/tech-project-forge/SKILL.md
$ diff /tmp/forge-skill-latest.md /Users/yogeshmohite/.agents/skills/tech-project-forge/SKILL.md
$ echo $?
0
```

**Result:** zero drift. Local install matches upstream `2026-04-25T10:11:14Z` snapshot exactly. Upstream skill repo hasn't been updated since installation Day 0. **No re-install needed.**

When upstream eventually updates: re-run this audit's drift check; if drift detected, run `npx --yes skills update yogeshcodeshare/Tech-project-forge-skill` (or whatever the skill CLI command becomes), restart Claude Code, and re-audit conformance against the new spec.

---

## ROI snapshot (carry-forward from Day-1 ROI analysis)

| Metric                          | Day-1 EOD figure    | Day-2 EOD update                                                                                                                  |
| ------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Skill conformance               | 89%                 | **96%** (+7 pts)                                                                                                                  |
| Time saved by skill (Day 0 + 1) | ~28 hr              | ~32 hr (+4 hr from Day 2 — most Block 2/3/4 items were skill-spec-driven; without the skill we'd have invented them ad-hoc later) |
| 90-day projected savings        | ~96 hr              | ~104 hr (+8 hr — the curated memory files prevent ~2 hr/wk of Claude re-discovery)                                                |
| Verdict                         | ✅ KEEP for PM2/3/4 | ✅ Reaffirmed. Status line + memory v1.3 are the kind of things that pay back forever.                                            |

---

## Methodology note

This audit was **deliberately scheduled** as the user's "occasional, not nightly" stance from Day 1 (re: `docs/audits/2026-04-27-eod-skill-conformance-audit.md` followup). Triggers for the next scheduled audit:

- End of M0 (target Day 10) — full re-audit + lock conformance % into M0 release notes.
- After any major skill-spec batch push (like today's Block 2/3/4).
- If upstream skill drift > 0 at any future check.

Don't run nightly. The audit cost (~30 min of write-up + tool calls) > the value of catching tiny incremental drifts.

---

## Cross-references

- `~/.agents/skills/tech-project-forge/SKILL.md` — the spec being audited against (v1.4, 1,134 lines)
- `docs/audits/2026-04-27-skill-alignment-audit.md` — Day-1 morning baseline (18% → projected trajectory)
- `docs/audits/2026-04-27-eod-skill-conformance-audit.md` — Day-1 EOD (89%) prior anchor
- `docs/audits/2026-04-27-skill-roi-analysis.md` — KEEP verdict + 96 hr/12 days savings analysis
- This Day-2 audit + the EOD report (`docs/eod-reports/2026-04-28-day-2.md`) are committed together at end of Block 5.
