# feedback — F19 Run Console workflow decision (Yogesh strategic call, Day-23 2026-05-20)

**Status:** **RATIFIED Day-23 PM (early) — NOW IN DOUBT Day-23 PM (late) after F22 visual gate REJECTION.** F19 was committed to **Option B** (Claude Design redesign → bundle → port) over Option A (v2 HTML + skill v2.2 7-step workflow). **HOLD Day-24 PM ADR-022 gate outcome before resuming F19 Claude Design session.** See `feedback_claude_design_bundle_first_use.md` for the F22 REJECTION evidence.

**Amendment triggers** (Day-24+ if either fires):

- **F19 Option B HOLDS** IFF F25 + F23 BOTH pass < 30% structural divergence Day-24-25 + ADR-022 ratifies green Day-24 PM. No memory amendment needed.
- **F19 Option B REVERTS to Option A** IFF F25 OR F23 also exhibits > 30% structural divergence. Amend this memory's TL;DR + Why + How sections to reflect the revert. F19 ports via v2 HTML + skill v2.2 7-step workflow Day-25+.

**Day-22→23 narrative context preserved below (decision was correct AT THAT TIME; the revert trigger is Day-23 PM late, post-F22 visual gate REJECTION):**

## TL;DR

F19 Run Console port goes through the **Claude Design Handoff Bundle workflow** (per ADR-022 candidate). The existing F19 v2 HTML in `PM1_UI_v2/Redesign Frame by claude design/F19 Run Console v2.html` becomes a **historical artifact**, NOT the canonical port source. Yogesh runs a fresh F19 Claude Design redesign session Day-24 (AM or in parallel with Day-23 PM work); bundle is generated; FE+1 ports Day-25 PM.

This is the FIRST frame to bypass Rule 15 (v2 HTML port source-of-truth) in favor of the bundle workflow. ADR-022 — if ratified Day-24 PM per the 3-frame gate — formalizes this pattern; until then, F19 is the test case.

## The Two Options

### Option A — v2 HTML + skill v2.2 7-step workflow (REJECTED at decision time, BUT may revert per Day-23 PM late F22 REJECTION)

- **What:** existing F19 v2 HTML acts as canonical source; FE+1 runs skill v2.2 (extract-canned-data → extract-spec → spec.json approval → scaffold TSX → diff-probe → visual gate → commit).
- **Pros:** validates skill v2.2 nested-count probe + BEM heuristic against F19's specific section structure; preserves Hard Rule 15 source-of-truth contract.
- **Cons (Day-23 PM early view):** slower (~3-4 hr full skill flow); v2.2 validation deferred but NOT lost — F22 + F25 bundle ports already exercise v2.2 nested-count probe regardless.

### Option B — Claude Design redesign → bundle → port (CHOSEN Day-23 PM early; IN DOUBT Day-23 PM late)

- **What:** Yogesh runs F19 Claude Design redesign session; Anthropic generates Handoff Bundle; FE+1 ports via bundle workflow per ADR-022 candidate.
- **Pros (Day-23 PM early view):** ~60-70% faster port time per bundle-workflow time-saving math; extends bundle-workflow coverage from 3 frames to 4 frames before M5 close.
- **Cons (Day-23 PM late discovery):** F22 first-use proved bundle workflow may generate ~50% simplified page vs canonical v2 HTML (~30-50% structural divergence). F19 Option B inherits this risk until F25 + F23 outcomes validate the pattern.

## Why Option B (rationale, Day-23 PM early — preserved for audit trail)

1. **v2.2 skill validation already covered by F22 + F25 + F23 bundles.** F19 doesn't add unique v2.2 signal.
2. **Bundle workflow saves ~60-70% time on F19 vs HTML port.** Compressed M5 window made the saving material.
3. **Day-23 compressed window left no slack for slower path.** F19 must ship Day-25 EOD.

## Why IN DOUBT now (Day-23 PM late)

F22 visual gate REJECTED at 30-50% structural divergence; Yogesh fell back to v2 HTML port via Rule 15. If F25 + F23 also reject, bundle workflow is not reliable enough to assume for F19 — Option A becomes the safer choice (preserves Rule 15, accepts ~3-4 hr port time).

## How to apply (CONDITIONAL on Day-24 PM gate)

### IF ADR-022 ratifies Day-24 PM (F25 + F23 both pass < 30% divergence)

- Day-24 PM or Day-25 AM: Yogesh runs F19 Claude Design redesign session
- Bundle delivered to `QA Nexus/PM1/PM1_UI_v2/Redesign Frame by claude design/handoff/F19/`
- FE+1 ports Day-25 PM via bundle workflow + MANDATORY pre-Step-3 sanity check (count v2 HTML sections vs bundle spec.json; if > 30% divergence, REJECT bundle + revert to Option A)

### IF ADR-022 fails Day-24 PM gate (F25 OR F23 also reject)

- Amend this memory: status flipped from "Option B RATIFIED" to "Option B REVERTED to Option A"
- F19 ports via v2 HTML + skill v2.2 7-step workflow Day-25+
- Rule 15 preserved as default for all M5 ports going forward
- Bundle workflow flagged as EXPERIMENTAL, not formalized

## Forbidden patterns (Day-23+ visual-review FAIL triggers)

- Treating the existing `F19 Run Console v2.html` as canonical for F19 port IF Option B is held (it's historical, not authoritative — bundle is authoritative)
- Running skill v2.2's `extract-spec.mjs` against the existing v2 HTML instead of using the bundle's `spec.json` if Option B is held
- Inventing F19 design decisions not in `design-notes.md` (Hard Rule 17 spirit — bundle's notes are the ambiguity-resolution source)
- **NEW Day-23+:** skipping the pre-Step-3 sanity check (count v2 HTML sections vs bundle spec.json) — MANDATORY per ADR-022 §5.9 amendment

## Does this generalize?

**Not yet.** F19 is a one-off Day-23 decision driven by M5 close timing. ADR-022 ratification (Day-24 PM per the 3-frame gate) is what generalizes the bundle workflow into a Hard Rule 15 amendment.

If ADR-022 ratifies green Day-24 PM:

- F19 stays Option B
- F26 + F28 + future M6+ frames default to bundle workflow + pre-Step-3 sanity check
- M3 + older M4 frames stay on v2 HTML port (no retroactive migration)

If ADR-022 fails the gate:

- F19 REVERTS to Option A (this memory amended)
- Future frames revert to v2 HTML port (Rule 15 unmodified) until bundle pattern is hardened
- Day-24 EOD §7 lesson: "F19 Option B was a justified one-off attempt; bundle workflow needs hardening before generalization"

## Cross-references

- `.claude/scratch/adr-022-candidate-skeleton.md` — bundle workflow definition (Day-22 draft + Day-23 PM refine + Day-23 PM late §5.9 amendment)
- `.claude/scratch/day-24-morning-brief.md` §P2 — Day-24 FE+1 queue references this decision (HOLD pending gate)
- `feedback_claude_design_bundle_first_use.md` — F22 REJECTION evidence (sibling memory)
- ADR-021 §6 namespace convention (analogous "cross-cutting rule across multiple ADRs" precedent — Day-23 ratified)
- F19 existing v2 HTML: `QA Nexus/PM1/PM1_UI_v2/Redesign Frame by claude design/F19 Run Console v2.html` (historical artifact at decision time; restored as canonical IF Option B reverts to A)
- F19 bundle target IF Option B holds: `QA Nexus/PM1/PM1_UI_v2/Redesign Frame by claude design/handoff/F19/`
- Day-22 Yogesh strategic call posted in Day-22 cross-agent close `.claude/scratch/day-22-cross-agent-close.md` §4

---

_Entry Day-23 2026-05-20 ~15:30 IST. F19 is the first frame attempt to bypass Rule 15 in favor of bundle workflow; Day-23 PM late F22 REJECTION put the decision in doubt. Promote to RETROS.md after F19 actually ports Day-25 EOD + ADR-022 ratifies. If ADR-022 fails the gate Day-24, amend this memory's status to "REVERTED to Option A" + adjust the TL;DR + How sections._
