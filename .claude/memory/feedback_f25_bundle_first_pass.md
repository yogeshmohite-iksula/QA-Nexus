# F25 bundle — first bundle-workflow SUCCESS (Day-24 2026-05-21)

> Companion to `feedback_claude_design_bundle_first_use.md` (MAIN's canonical, F22 rejection precedent). F25 is the first PASS for the bundle workflow. Contrast confirms: **bundle quality is frame-specific, not uniformly bad**. Pre-Step-3 sanity check is the safety mechanism that makes the workflow viable.

## Outcome

F25 Executive Dashboard bundle (`PM1_UI_v2/Redesign Frame by claude design/handoff/F25/`) ported in **~3.5 hr total** (including 4 polish iterations). For comparison: F22's bundle-then-rewrite recovery cost ~205 min on Day-23.

PR #197 shipped via bundle workflow Steps 1+2 collapsed (bundle pre-extracted canned-data + spec + TSX). Hard Rule 13 visual gate APPROVED by Yogesh at 320 + 1440 viewports.

## Pre-Step-3 sanity check verdict (ADR-022 §5.9)

| Check                         | F22 (rejected Day-23)                                             | F25 (passed Day-24)                                                                            |
| ----------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Top-level structural sections | 5 (canonical) vs 4 (bundle) = ~50% divergence                     | 8 (canonical) vs 8 (bundle regions) = **0% divergence**                                        |
| Content-faithful spot-check   | bundle ships simplified placeholders (DEF-318, basic 4-layer RCA) | bundle ships canonical-faithful structures (verified on quality-posture: 3 KPIs match exactly) |
| Bundle workflow ROI           | NEGATIVE (+130 min recovery cost)                                 | POSITIVE (~90 min saved vs canonical re-port)                                                  |

**Threshold validated:** the ADR-022 §5.9 30%-divergence reject threshold correctly:

- REJECTED F22 (50% divergence)
- ACCEPTED F25 (0% divergence)

## Bundle quality is frame-specific

The two data points so far suggest bundle quality depends on:

- **Per-section depth of the canonical**: F22 has dense per-RCA-layer typed boxes (HYPOTHESIS/FINDING/RECOMMENDATION/NOTE), per-layer rich payloads (stack trace / env kv / commit cards / data anomalies). Bundle missed all this depth. F25 has shallower per-region structure (most regions are static cards or KPI grids).
- **Number of nested article landmarks**: F25 has 8 articles inside 8 sections (1:1 ratio — each section has one main article). F22 has 8 articles inside 5 sections (denser nesting per parent — bundle dropped the per-layer typed boxes).
- **Use of named-agent typed boxes**: F22 uses per-layer Sherlock typed boxes which bundle skipped entirely. F25 uses only one named-agent reference (Sherlock recommendations pill + Curator agent tooltip in a "Positive signal" bullet).

Hypothesis: bundle workflow succeeds when canonical's per-section depth is shallow / homogeneous. Fails when per-section depth is heterogeneous and contains domain-specific embeds (typed boxes, code blocks, evidence chips).

## Adaptations required on F25 (bundle → repo)

Even with 0% structural divergence, the bundle needed adaptation:

1. **AdminShell prop API mismatch**: bundle used `<AdminShell activeNav="..." activeSection="..." mode="prove-locked">`. Repo's AdminShell signature is `<AdminShell active={AdminNavActive} projectKeyLower?>`. Fix: changed to `active="executive-dashboard"`, dropped `activeSection` (auto-inferred from active), dropped `mode` (Prove mode via f25.css theme scope instead).

2. **Directory layout**: bundle README assumed nested `apps/web/components/executive/components/` for TSX + `executive/data/` for canned-data. I flattened to `apps/web/components/executive/` + `executive/data/`. This required updating 9 import paths from `../data/...` → `./data/...` (8 TSX files + 1 agent file via single sed pass).

3. **Self-referential TypeScript**: bundle's `canned-data.ts` had `activeTimeframe: 'Sprint' as (typeof f25Demo)['timeframes'][number]` — a recursive type reference that breaks TS strict mode. Fixed via `'Sprint' as const`.

4. **Invalid Tailwind v4 font syntax**: bundle used `font-[JetBrains_Mono]` and `font-[DM_Sans]` (no quotes) — invalid in Tailwind v4. The font classes were silently dropped, leaving default fonts. Fixed by replacing with `font-mono` / `font-display` Tailwind utilities backed by globals.css `@theme`.

5. **`dark:` Tailwind variant**: bundle used `dark:bg-[rgba(167,139,250,0.20)]` etc. for theme-aware coloring. Repo uses `data-theme="dark"` attribute on `.f25-shell`, not the `dark` class on `<html>`. Fixed by replacing `dark:` variants with `color-mix(in srgb, var(--p-secondary) 14%/20%, transparent)` — token-aware via f25.css scope.

6. **spec.json schemaVersion mismatch**: bundle ships schemaVersion 3 (flat regions list). Skill v2.2's diff-probe expects schemaVersion 2 (tree with `children`). Re-extracted via skill's extract-spec.mjs → got 57/53 schemaVersion 2 spec compatible with probe. Same Day-23 lesson as F22.

7. **Theme variant**: bundle's F25Page defaults to `theme='light'` (ivory boardroom). Canonical v2 HTML on disk is "-Dark-" variant only. Yogesh requested dark match → route passes `<F25Page theme="dark" />` explicitly.

## Mobile polish loop after bundle scaffold

Even with bundle-PASSED port, 4 polish iterations were needed at 320px:

1. **Dark theme prop**: switched route to `theme="dark"` (~1 min)
2. **Visibility polish**: bumped `%` unit size 16→18px; replaced `dark:` variants with token-aware `color-mix`; bumped Approve button to `h-10 px-4` (~10 min)
3. **Mobile stack**: ExecutiveHeader from side-by-side to flex-col<sm; sprint info from `<p>` to `flex flex-wrap` div; timeframe tablist scrollable; `.f25-shell` `overflow-x: hidden` + `* { min-width: 0 }` defensive (~15 min)
4. **Icon button shape**: locked to `w-[34px] h-[34px] shrink-0` (was `min-w-[44px] min-h-[44px]` which stretched tall) (~5 min)

Total polish: ~30-35 min. Compare to F22 polish loop on Day-23: ~40 min for 4 iterations after the v2-HTML re-port. Bundle workflow polish cost looks similar to canonical-port polish cost — the savings come from skipping the scaffold step, not the polish step.

## Updated bundle-workflow rules (Day-24 amendment candidate to ADR-022 §5.9)

- ✅ Pre-Step-3 sanity check (structural divergence < 30%) — KEEP, this is the safety mechanism
- ✅ Content-faithful spot-check on ONE highest-density region — ADD as sanity layer 2 (F22 would have failed spot-check even at 50% structural; F25 passes both)
- ✅ Always regenerate spec via skill's extract-spec.mjs — KEEP, bundle's schemaVersion 3 spec is not probe-compatible
- ✅ Verify AdminShell prop signature matches before scaffolding — ADD (F25 bundle assumed wrong API)
- ✅ Check for `dark:` Tailwind variants — ADD (port uses data-theme attribute, not class)
- ✅ Verify Tailwind font syntax — ADD (`font-[Name]` is silently dropped; use `font-mono`/`font-display`)

## Cross-references

- `feedback_claude_design_bundle_first_use.md` (MAIN's canonical, F22 rejection) — REJECTED case
- ADR-022 §5.9 — pre-Step-3 sanity check (codified Day-23 after F22, validated Day-24 with F25)
- PR #197 — F25 canonical port via bundle workflow
- PR #192 — F22 canonical port via v2-HTML re-port (precedent for canonical-fallback path)

## Bundle workflow recommendation (Day-24 evolved)

**Use bundle workflow when:**

- Pre-Step-3 sanity check passes (< 30% structural divergence)
- Spot-check on highest-density region confirms content faithfulness
- Frame has shallow per-section depth (KPI grids, kv lists, single-article-per-section)

**Skip bundle workflow when:**

- Frame uses per-section named-agent typed boxes (HYPOTHESIS/FINDING/RECOMMENDATION/NOTE pattern)
- Per-section depth is heterogeneous (different content shapes in each section)
- Frame has > 2 nested-article-per-section ratio (bundle tends to flatten these)

Day-25 will test on F23 Reports Studio (bundle exists) — likely shallow per-section depth (charts + tables), good bundle candidate.
