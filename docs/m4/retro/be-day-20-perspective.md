# M4 Retro — BE+1 Day-20 perspective

**Author:** BE+1
**Date:** 2026-05-17 (Sun, M4 close day)
**Scope:** Day-20 cascade work + lessons from the chained-PR cascade + Sherlock orchestrator promotion

---

## What worked

**Scratch → promote pattern, twice validated.** The Day-19 P3 pre-draft of Sherlock orchestrator + 3 sibling agents in `.claude/scratch/sherlock-orchestrator-impl/` paid back end-to-end in ~5 minutes Sunday afternoon: `mv` files into `apps/api/src/agents/{sherlock-orchestrator,sherlock-data,sherlock-env,sherlock-flake}/` → run jest scoped (`pnpm test -- sherlock-orchestrator`) → 10/10 pass → push. The same pattern previously validated for Sherlock agent #1 (Day-19, 5 min). Both times: zero re-design at promote time, all design questions answered on Sunday afternoon (not Monday morning when the merge cascade was running).

**ADR-019 4-agent parallel architecture shipped clean with smart scope cuts.** Two prisma-schema-impedance issues surfaced at promote time:

1. `RcaReport` (TB-016 from #144) is a 5-layer JSON design that pre-dates ADR-019's flat hypothesis array
2. `RealtimeGateway` has no public `emit()` method — only `@SubscribeMessage` handlers

Rather than fight the schema or scope-creep into RealtimeGateway internals during the M4-close timebox, I cut DB persistence + async/WS + audit-writes from #173 and filed a comprehensive followup `(da)` for Day-21 hardening. The synchronous in-memory contract is the right V1 — pilot volumes (~10 RCA runs/day) keep this safe behind the 30s per-agent timeout, and Day-21 has full implementation context to pick the right adapter (5-layer mapping vs. flat-array migration).

**Smart followup `(da)` capture.** Spent ~10 min writing a detailed followup with: full context (why the scope cut), 2 forward-options analysis (5-layer mapping vs flat-array migration), acceptance criteria, cost-gate note, cross-refs to PR #144 + #161 + ADR-019. Day-21 morning won't need to re-derive the design.

**Hard Rule 11 internalized.** 0 fires Day-20 vs. 4 fires Day-19. The Day-19 cycles trained me to verify GitHub state with multiple signals (`gh api repos/.../pulls/N`, `git ls-remote`, `git log origin/main`, file-content inspection) before acting on user messages. Saved ~30 min today.

---

## What hurt

**3 chained-base + squash gotchas (~5 min recovery each = 15 min lost).** PRs #149 and #168 both used the chained-base pattern (`base: <parent-branch>`). When parents squash-merged via GitHub UI, GitHub auto-deleted the parent branches AND auto-closed the children. Cannot reopen (`gh pr reopen` fails — base branch gone) nor retarget (`gh pr edit --base` fails — closed PR). The only fix is opening fresh PRs (#172, #173) with `base: main` against the same head branches. The git work was clean (rebase auto-skipped already-merged commits via cherry-pick detection), but the PR-reopen ceremony added 5 min × 2 cycles + 1 same-pattern recovery for #148 squash-detection. **Day-21 prevention: filed followup `(db)` to default to "Create a merge commit" for parent PRs OR retarget children to main BEFORE parent merges.**

**CHANGELOG conflicts compounded across 4 sibling PRs.** Every cascade merge (#148, #149, #161, #162) triggered a CHANGELOG conflict on every subsequent PR's rebase, because all 4 PRs added entries to `[Unreleased]` in the same chunk-relative position. Each rebase needed ~2 min of manual `<<<<<<< HEAD` → resolve → `=======` → `>>>>>>>` removal + insert `---` separator. Six rebases × ~2 min = ~12 min lost. **Day-21 prevention: filed followup `(dc)` to design a CHANGELOG fragment-file pattern (per-PR fragments merged at release time, scriv-style).**

**Prettier doesn't lint git conflict markers.** Caught one stale `<<<<<<< HEAD` marker that survived a CHANGELOG resolution AND passed pre-push gates (prettier checked formatting — markers don't break markdown parse; CHANGELOG guard checked entry presence — entry was there). The marker was only caught when a downstream child branch tried to rebase onto the parent and failed with `unresolved conflicts`. **Day-21 prevention: filed followup `(dd)` for a pre-push hook addition that greps for conflict markers before push.**

**1 post-cascade smoke gap.** `test-runs.controller.spec.ts` was rewritten during the #149 chained-base rebase to use `Test.createTestingModule` for clean DI mocking, but the import chain transitively pulled `better-auth` (ESM) into jest's CJS transformer. Test passed in isolation (`pnpm test -- test-runs.controller`) but failed in the full `pnpm test` run where module-load order changes. **Lesson:** when rewriting an existing spec during a rebase, ALSO run the FULL jest suite locally, not just the touched spec. Single-spec runs hide module-load-order issues. Fix-forward shipped as PR #174 with `jest.mock` at module boundary (same pattern as Day-17 #138/#139).

---

## What's next (Day-21+)

**P0 — Followup `(da)` Sherlock hardening (Day-21 AM):**

- 5-layer RcaReport schema adapter for orchestrator output
- Async 202+`{runId}` pattern + WS emit on completion
- `RealtimeGateway.emit()` public method
- Audit writes (`defects.rca_kicked_off` + `defects.rca_completed`)

**P1 — Kimi K2 HIGH triage queue (Day-21 mid-morning, ~4 hr total):**

- Open redirect on `/auth/callback` (1 hr)
- WS rate limit + max connections (2-3 hr)
- HMAC secret loaded at boot, fail-fast on missing env (1 hr)
- Auth Zod schemas extracted to `packages/shared` (1 hr)

**P2 — CVE replacements (Day-21 afternoon, ~2-4 hr):**

- xlsx → research alternatives (`exceljs`, `xlsx-js-style`)
- pdf-parse → research alternatives (`pdfjs-dist`, `unpdf`)

**P3 — Followup queue hygiene (Day-21 evening):**

- Drive `(db)` chained-base prevention through M5 planning
- Drive `(dc)` CHANGELOG fragment pattern through release-tooling pass
- Drive `(dd)` conflict-marker pre-push hook through repo-hygiene pass

---

## Numbers

- **6 PRs touched Day-20 (BE):** 5 cascade merges + 1 fix-forward
- **2 chained-base fast-replaces:** #149 → #172, #168 → #173
- **4 cascade rebases with manual conflict resolution:** #148, #149/172, #161, #162, #168/173
- **Final smoke:** 592/592 jest pass, 50 suites, ~64s
- **Cost-gate:** $0/mo holds; Neon at ~82/100 CU-hr (unchanged from Day-19); zero live LLM calls today
- **Time on GitHub mechanics:** ~30 min (could have been ~15 min with chained-base policy fix `(db)`)
- **Hard Rule 11 fires:** 0 (vs. Day-19: 4)

---

End of BE+1 retro. M4 status: CLOSED.

— BE+1
