# feedback — Claude Design Handoff Bundle first-use findings (Day-23 PM 2026-05-20, F22)

**Status:** **AMENDED Day-23 PM late** to reflect F22 Step 6 visual gate REJECTION. Originally filed Day-23 ~16:00 IST during F22 Step 3 inspection (path adaptation finding); amended Day-23 PM late after Yogesh rejected at Step 6 visual gate (structural divergence finding). Memory survives M5 close + feeds Day-25 retro evidence pile.

## Headline: F22 bundle workflow REJECTED at Step 6 visual gate; v2-HTML re-port via Rule 15 + skill v2.2 PASSED 17:25 IST

Bundle workflow assumes Claude Design's bundle output preserves canonical v2 HTML design intent. **F22 first-use proved this assumption FALSE.** Bundle generated a simplified ~50% page (4 layers + basic structure) vs v2 HTML canonical (5 layers + rich per-layer evidence panels + Sherlock confidence bar + Curator similar defects + Discussion+Jira sync + 5-section right rail). Yogesh rejected at Step 6; **FE+1 re-ported from v2 HTML directly per Hard Rule 15 + skill v2.2 — visual gate PASSED 17:25 IST.** This is the headline finding for F22 — supersedes the Day-23 16:00 path-adaptation finding as the more material lesson.

## TL;DR (Day-23 16:00 path-adaptation finding — still valid + cited by ADR-022 §5.3)

Anthropic public Handoff Bundle docs describe the artifact set as **5 files**: `design.html` + `screenshots/` + `design-notes.md` + `spec.json` + `README.md`. **F22 first-use inspection Day-23 PM revealed the bundle ALSO contains pre-built TSX scaffolding** at codebase-convention paths Claude Design infers from project context. Path convention inference is imperfect — F22 bundle used `apps/web/src/app/` but QA Nexus codebase uses `apps/web/app/` (no `src/` directory). FE+1 adapts paths during Step 4 (not Step 1+2 collapse). Bundle pre-built TSX is a **STARTING POINT for Step 4 scaffold, NOT drop-in.**

This is the FIRST production inspection of an Anthropic Handoff Bundle in QA Nexus. The findings update ADR-022 candidate §5.3 (Day-23 PM amendment) AND §5.9 (Day-23 PM late amendment — structural divergence finding).

## The structural divergence (the REJECTION finding)

### What the F22 v2 HTML canonical specifies

- 5 layers of evidence (sections of the page)
- Per-layer evidence panels with rich content (run logs, stack traces, expected/actual diffs)
- Sherlock confidence bar with per-cluster confidence + RCA summary text
- Curator similar-defects section (3-5 related defect cards with similarity score)
- Discussion + Jira sync section (comment thread + Jira link state)
- Right rail with 5 sections (defect meta + status flow + assignees + history + attachments)

### What the F22 bundle generated

- 4 layers (one short of canonical)
- Basic structure per layer (no rich evidence panels)
- No Sherlock confidence bar
- No Curator similar-defects section
- Basic discussion section (no Jira sync visualization)
- Right rail simplified (~3 sections vs canonical 5)

**Net: ~30-50% structural divergence.** Hand-augmenting to fill the gap would be Hard Rule 17 invention risk; full v2 HTML port via Rule 15 is cleaner + more auditable.

## Mitigation (MANDATORY Day-23+ pre-Step-3 sanity check)

ADR-022 §5.9 amendment Day-23 PM adds a new pre-flight Step 2.5 between bundle ingest (Steps 1+2 collapsed) and Yogesh Step 3 approval:

1. Run `extract-spec.mjs` against the canonical v2 HTML — count sections (use schemaVersion 3 BEM heuristic + depth-7 from skill v2.2)
2. Compare count vs bundle's `spec.json` sections
3. If divergence > 30% (sections-missing OR sections-collapsed): **REJECT bundle** + escalate to Yogesh
4. Yogesh decides: (a) re-run Claude Design session with different prompt, OR (b) fall back to v2 HTML port via Rule 15 + skill v2.2 7-step workflow

**F22 Step 6 REJECTION outcome:** Yogesh chose option (b) — fall back to v2 HTML port. **The v2-HTML re-port PASSED visual gate at 17:25 IST** — validates Rule 15 + skill v2.2 workflow as the reliable fallback path.

## Yogesh's Day-23 PM decisions (revised)

Original Step 3 decisions (Day-23 16:00, bundle-path-adaptation):

1. **Path correction:** `apps/web/src/app/` → `apps/web/app/`
2. **Project-scoped route:** `/projects/[slug]/defects/[id]`

Updated Step 6 decision (Day-23 PM late, after bundle REJECTION):

3. **REJECT bundle workflow for F22.** Re-port from v2 HTML directly per Hard Rule 15. Decisions 1+2 no longer apply (bundle is discarded); v2 HTML port follows skill v2.2 7-step workflow with its own path + route conventions.

F22 v2-HTML re-port outcome (Day-23 ~17:25 IST):

4. **VISUAL GATE PASSED.** FE+1 executing Step 7 commit + amend force-push; Day-23 FE EOD lands 18:00-18:30 IST. F22 ships clean Day-23 EOD via Rule 15 + skill v2.2.

## What does this mean for ADR-022 ratification gate Day-24 PM?

**F22 is NOT a clean validation.** F22 outcome = "bundle REJECTED, fell back to v2 HTML via Rule 15" → VALIDATES Rule 15 + skill v2.2 workflow, does NOT validate bundle workflow.

**For ADR-022 to ratify Day-24 PM:** F25 + F23 must BOTH show < 30% structural divergence. If EITHER also rejects > 30%, bundle workflow stays EXPERIMENTAL — not formalized as ADR-022.

**Conservative posture for Day-24 morning brief:** don't promise green Day-24 PM gate to BE+1 or FE+1. Outcome is now in doubt.

## What does this mean for F19 Option B (already-ratified Day-23)?

`feedback_f19_workflow_decision.md` ratified F19 Option B (Claude Design bundle workflow) Day-23. **In doubt now.**

- IF Yogesh HASN'T started F19 Claude Design session yet (Day-23 PM): **HOLD F19 Claude Design until Day-24 PM ADR-022 gate outcome**
- IF F25 + F23 both pass Day-24 with < 30% divergence: F19 Option B holds + ADR-022 ratifies
- IF F25 OR F23 also reject > 30% divergence: revert F19 to Option A (v2 HTML + skill v2.2) before Day-25; amend `feedback_f19_workflow_decision.md` to reflect the revert

## The pattern (Day-23+ binding for FE+1 Step 4 workflow IF bundle passes pre-Step-3 sanity check)

When FE+1 receives a bundle and reaches Step 4 (TSX scaffolding):

### Treat bundle pre-built TSX as a starting scaffold

- Bundle's `<frame>/apps/web/src/app/...` paths are STARTING POINTS, NOT drop-in
- FE+1 verifies `apps/web/src/app/` (Anthropic-inferred) → `apps/web/app/` (QA Nexus-actual)
- Any `import { x } from 'src/...'` patterns: drop the `src/` prefix
- Component-tree paths in `design-notes.md` may also reference `apps/web/src/...` paths — same rewrite

### Yogesh project-context decisions still gate at Step 3

- Route assignment (project-scoped vs workspace-scoped vs root-scoped) is NOT inferred from bundle; Yogesh decides at spec.json approval

### Step 4 cost accounting (provisional)

Per ADR-022 candidate §5.3 (Day-23 PM amendment) — **PROVISIONAL only if bundle survives the §5.9 pre-Step-3 sanity check:**

- (a) collapsed Steps 1+2 extraction phases — ~30 min saved
- (b) pre-rendered screenshot diff baselines skipping Step 5 setup — ~20 min saved
- (c) `design-notes.md` intent capture removing ambiguity round-trips — ~15-30 min saved
- (d) pre-built TSX scaffolding accelerating Step 4 by ~30-40 min once path adaptation done
- (e) MINUS path/convention adaptation cost — ~10-15 min cost

Net: **~85-110 min saved per frame vs HTML port** — **conditional on bundle PASSING the pre-Step-3 sanity check.** If bundle FAILS sanity check → full v2 HTML port; bundle workflow yields ZERO time saving on that frame (Day-23 F22 outcome: rejected bundle + v2 HTML port is ~3-4 hr full skill workflow).

## Forbidden patterns (visual review FAIL triggers Day-23+)

- **Treating bundle pre-built TSX as drop-in** (skips path adaptation = build failure on import resolution)
- **Skipping Step 3 spec.json approval because "bundle pre-built TSX implies it's ready"**
- **Inferring routes from bundle pre-built TSX without verifying against QA Nexus route conventions**
- **Editing bundle pre-built TSX path strings before Step 3 approval**
- **Skipping the pre-Step-3 sanity check (assuming bundle is faithful to canonical without measurement)** — ADR-022 §5.9 amendment
- **Treating bundle as authoritative when divergence > 30%** (use v2 HTML directly per Rule 15)
- **Hand-augmenting a divergent bundle's TSX with missing sections** (cleaner to full-port from v2 HTML)

## Lesson generalization (for M5 retro candidate)

External docs are a STARTING POINT for ADR drafting, not a SUFFICIENT specification. First production inspection of the artifact is what locks the contract. Day-22 → Day-23 13:30 → Day-23 16:00 → Day-23 PM late trajectory: **4 successive corrections** of the bundle-shape understanding in <30 hours. Each correction came from a different evidence layer (assumption → public docs → production input inspection → production OUTPUT inspection).

**Practice for future ADRs:** when an ADR depends on an external artifact (bundle, API, file format), DRAFT against external docs but FLAG explicit assumptions. Mark `[VERIFY AT FIRST PRODUCTION USE]` next to each docs-derived claim. Schedule ratification AFTER first production use, not before.

**Trigger for promotion to STACK_LEARNINGS.md:** 2nd ADR exhibits the same docs-vs-reality gap pattern.

## Cross-references

- ADR-022 candidate skeleton: `.claude/scratch/adr-022-candidate-skeleton.md` §5.3 (path adaptation) + §5.9 (structural divergence)
- Day-23 EOD §7.7 lesson: `.claude/scratch/day-23-eod-prep.md` + `docs/eod-reports/2026-05-20-day-23-main.md`
- F19 Option B decision: `feedback_f19_workflow_decision.md` (sibling — IN DOUBT now)
- Skill v2.2 first-use journal: `feedback_skill_v2.2_first_use.md` (parallel memory)
- Day-23 morning brief: `.claude/scratch/day-23-morning-brief.md`
- Day-22 lesson §7.4: bundle structure clarification (Anthropic docs vs assumption) — this memory is the 2nd + 3rd order refinement

---

_Entry Day-23 2026-05-20 ~16:00 IST (initial path-adaptation finding) + amended Day-23 PM late (structural divergence + REJECTION + v2-HTML re-port PASSED 17:25 IST). Filed alongside F22 Step 3+6 outcomes. Promote to STACK_LEARNINGS.md after 2nd ADR exhibits the docs-vs-reality gap pattern OR at M5 retro if the bundle workflow becomes generalized via ADR-022 ratification._
