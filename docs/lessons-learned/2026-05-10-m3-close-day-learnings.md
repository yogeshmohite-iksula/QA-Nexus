# M3 close — Day-15 lessons learned (FE+1 contributions)

**Author:** FE+1 (Claude Code)
**Date:** 2026-05-10
**Sister doc:** `2026-05-05-m1-close-day-learnings.md` (M1 close retro)
**M3 surface covered:** F14 (list + drawer + 3 modals) · F16a (chooser) · F16b (Pattern A scaffold + Pattern B flip) · F16c (Pattern A scaffold)

---

## 1. API 400 image-error protocol — binding rules paid off

**Pattern:** No `fullPage:true` Playwright screenshots, no Bash binary stdout, no large PNG reads without resizing, macOS screenshots re-saved via Preview before any Read.

**Why it matters:** Late Day-14 we hit a session-poisoning API 400 image error from accumulated full-page screenshots. M3 Day-15 had ~32 screenshots taken across PR #116 + #117 — all viewport-bounded `clip:` only, all under 300 KB. **Zero context-poisoning incidents.**

**Codified in:** user memory `feedback_api_400_image_protocol.md`. Loaded at every session start.

**Reusable for:** every future visual-gate PR. Pre-write the sweep script with `clip:` baked in; never reach for `fullPage:` even when "just one screenshot" is tempting.

---

## 2. Cascade-rebase pattern at FE worktree

**Pattern:** When N PRs are open + main moves while they wait, rebase each in priority order using `git rebase --onto origin/main <stale-base-commit>`, force-push with `--force-with-lease`. CHANGELOG conflicts resolve via `sed -e '/^<<<<<<< /d' -e 's/^=======$//' -e '/^>>>>>>> /d' docs/CHANGELOG.md` — strip markers, keep both sections in chronological order.

**Day-15 application:** 3 PRs (#110 / #111 / #113) + later PR #116 = 4 cascade rebases done in ~50 min total. All identical resolution. Each pre-push 5/5 gates green.

**Key insight:** PR #113 had a 2-file overlap (CHANGELOG + chooser-modal) — but git's auto-merge handled the chooser-modal cleanly because PR #110's "AI Generated" card edit + PR #113's "Bulk Import" card edit touched DIFFERENT lines in the same file. Lesson: trust git's auto-merge for non-overlapping line-level changes in shared files; only the conflict markers in `git status -s` (`UU` flag) need manual intervention.

**Pre-flight discovery:** `comm -12 <(git diff --name-only $BASE..HEAD | sort) <(git diff --name-only $BASE..origin/main | sort)` reveals the overlap surface in 1 line. Run before every rebase to know what to expect.

**Anti-pattern avoided:** rebasing PR #116 BEFORE the #110/#111/#113 cascade cleared would have created compounding conflicts. Wait for parent PRs to merge to main, THEN rebase children.

---

## 3. Pre-work pattern — read v2 HTML structurally before code

**Pattern:** Before writing any port code, run `ctx_execute` on the source v2 HTML to extract: section headings, CSS-var inventory, media-query breakpoints, state-keyword presence, agent integration markers, Iksula canon presence, button labels, layout primitives.

**Day-15 application:** Stage 1 pre-work read F16b (1131 LOC) + F16c (566 LOC) v2 HTMLs in ~30 min and produced `/tmp/day15-fe-prework.md` with full mental model. When TASK D2 implementation started, I already knew:

- F16b uses 35 CSS vars / 8 media queries / `streaming · queued · retry · 503 · 400` state surface / 15 Pattern A markers as swap points
- F16c uses bare `A2` agent-tag chip pattern (10+ occurrences) — diverges from broader canon (which surfaced followup `(aw)` policy question)
- Iksula canon presence per page (RET-247 / TC-RET-\* / refund_policy_v3 / Sprint 42 / Yogesh)

**Saved time:** ~20 min of reading-while-coding distractions per page. For PR #116 the wire-up went smoothly because the Pattern A → Pattern B swap points were already mapped.

**Reusable for:** every future page port. Pre-work is cheap; it pays back 3-5× in implementation focus.

---

## 4. Discovery-first pattern — caught F16c bulk-create endpoint gap

**Pattern:** Before writing any FE client code that hits a BE endpoint, verify the endpoint actually exists on main. Use `grep -rn '@Post\|@Get' apps/api/src/<area>/` + check shared Zod schemas in `packages/shared/src/schemas/`.

**Day-15 application:** TASK D3 brief said "wire to `POST /api/projects/:projectId/test-cases/bulk-create` (PR #95 merged)". My pre-work discovery batch found:

```
apps/api/src/test-cases/test-cases.controller.ts:142:  @Post('bulk-link')
apps/api/src/test-cases/test-cases.controller.ts:174:  @Post('bulk-delete')
```

**No `bulk-create` endpoint.** PR #95 actually shipped bulk-link + bulk-delete (link/archive _existing_ IDs); F16c needs CSV/XLSX → many-new-test-case insert (a fundamentally different surface).

**Saved cost:** Without discovery, I'd have written ~1.5 hr of FE client + adapter code for an endpoint that doesn't exist. Per Hard Rule 11 ("when in doubt, ask Yogesh"), I paused with 3 resolution options. Yogesh approved Option 1 (defer to M5). Filed followup `(ay)` with full M5 scope for BE+1 + FE+1.

**Anti-pattern avoided:** "trust the brief, write the code, find the gap at PR review time" — that's a 2-3× round-trip cost on top of throwaway code.

**Codified in:** followup `(ay)` doubles as the design ticket for M5.

---

## 5. Stubbed-mode awareness in Pattern B (PR #116)

**Pattern:** When wiring FE to a real BE endpoint that has `stubbed: true | false` semantics (because the BE service may be running with offline/canned-data fallback during deploy gaps), the FE must:

1. Render the response identically whether `stubbed:true` or `stubbed:false` (same wire shape, same UI components)
2. Surface a non-blocking "demo data" toast on success when `stubbed:true` so users know the data isn't real-LLM
3. Handle the typed error envelopes (503 retry-exhausted, 400 schema-fail, 429 rate-limit, network) with specific Sonner toasts that include `retryAfterSec` when present
4. Use `try/catch` with a `finally` block to revert UI state (e.g. `isGenerating → false`) regardless of success/failure path

**Day-15 application:** PR #116 ships this exact pattern for F16b Composer wire. Path C transitional bridge (PR #115) wasn't deployed yet when D2 was written, so BE was still returning `stubbed:true`. PR #116's stubbed-mode awareness made the page render perfectly with canned data + a clear demo-data toast.

**Validated by:** Path C went LIVE later in the day (Render boot log: `LLMGateway initialised (source=db): primary=groq:openai/gpt-oss-120b`). Once PR #116 merges + Cloudflare Pages redeploys, F16b will flip to real Groq output **with zero FE change required.**

**Reusable for:** Day-16 F14m2 Curator Pattern B flip (same `stubbed:true | false` semantics from PR #112). Mirror the pattern verbatim — typed-error class hierarchy + adapter + auto-trigger + sonner toasts.

**Architectural lesson:** The `stubbed: boolean` field in shared response schemas is the BE/FE contract that makes graceful degradation possible. Both sides MUST honor it; FE renders identically + adds a banner, BE returns it accurately based on env state.

---

## Cross-cutting meta-lesson

All 5 patterns above share a theme: **mid-flight discovery + pre-flight validation prevents end-of-day regret**.

- API 400 protocol = pre-flight discipline (set rules before they bite)
- Cascade-rebase = mid-flight pre-flight (overlap discovery before rebase)
- Pre-work pattern = pre-flight (mental model before code)
- Discovery-first = pre-flight (endpoint existence before client code)
- Stubbed-mode awareness = pre-flight (handle BE state diversity before deploy)

**For M4 / M5 onwards:** prepend a `pre-flight-discovery:` step to every TASK brief. Cost is ~10-30 min; payback is hours of avoided rework.

---

## Cross-references

- `2026-05-05-m1-close-day-learnings.md` — sister M1 retro
- PR #116 — canonical Pattern B FE-client wire pattern
- PR #117 — canonical RWD verification sweep pattern
- Followup `(ay)` — F16c M5 deferral with full scope
- Followup `(aw)` — F16c bare-A2 canon question (filed Day-10, still open)
- User memory `feedback_api_400_image_protocol.md` — binding rules
- `apps/web/lib/api/users-api.ts` — Pattern B FE-client canonical reference (Day-8 followup ab)
