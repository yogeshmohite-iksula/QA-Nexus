# ADR-022: Frontend Handoff Bundle workflow for M5+ frames

> **Ratification history:** Skeleton Day-22 PM 2026-05-19 · Day-22 PM tightened gate · Day-23 PM late §5.9 amendment (F22 REJECTION + MANDATORY pre-Step-3 sanity check, 30% threshold) · Day-24 AM gate-deferred to Day-25 PM · Sun 2026-05-24 re-tagged to Monday PM · Monday lost (orchestrator absence) · **Ratified Tue 2026-05-26 Day-27 PM** after F23 visual gate PASSED.
> **3-frame validation outcome:** F22 ✗ REJECTED (Day-23, ~30-50% structural divergence; v2 HTML fallback via Rule 15) · F25 ✓ PASSED (Day-24, 0% divergence — first bundle-workflow success) · F23 ✓ PASSED (Day-27, 12.5% ARIA divergence — pre-Step-3 sanity check confirmed, diff-probe AMBER 5.1-9.6%). **2 ✓ : 1 ✗ → RATIFY** with mandatory §5.9 pre-Step-3 sanity check + Rule 15 fallback retained.

---

- **Status:** **Ratified** Tue 2026-05-26 Day-27 PM · 3-frame validation outcome: F22 ✗ / F25 ✓ / F23 ✓ (2 ✓ : 1 ✗)
- **Date:** 2026-05-20 (drafted) · 2026-05-26 (ratified)
- **Deciders:** Yogesh Mohite (Admin), FE+1 (implementer), MAIN (planner)
- **Related:** Hard Rule 15 (v2 HTML source-of-truth) · Hard Rule 16 (canonical-first workflow) · Hard Rule 17 (canned-data extraction) · Hard Rule 18 (skill-mandatory workflow + Day-19 amendments Parts 1+2+3 + Day-21 amendment Part 4) · `.claude/skills/frame-port/SKILL.md` (the existing 7-step workflow) · F22 first-use journal in `feedback_skill_v2.2_first_use.md` · F25 handoff bundle (delivered Day-22)
- **Supersedes:** Partial supersession of Hard Rule 16 step 1+2 (canonical-first read of v2 HTML + extract-canned-data) — when a Handoff Bundle is provided, steps 1+2 collapse to "import bundle artifacts"
- **Superseded by:** none

---

## Context

The frame-port skill (`.claude/skills/frame-port/`) defines a 7-step workflow (extract-canned-data → extract-spec → spec.json approval → scaffold TSX from spec+canned-data NOT from HTML → diff-probe → visual gate → commit). Steps 1+2 currently parse the canonical v2 HTML each port; in practice this surfaces drift (Hard Rule 17 invented data, BEM heuristic gaps caught Day-19/21).

Starting Day-22, Yogesh + Claude Design ship **Handoff Bundles** per frame: ZIP containing pre-extracted tokens.css + canned-data.ts + component-tree.md + aria-contract.md + spec.json (schemaVersion 3). The bundle IS Step 1 + Step 2 output, externally vetted.

After F22 + F25 + F23 three-frame validation (F22 ✗ Day-23, F25 ✓ Day-24, F23 ✓ Day-27), this ADR **codifies** the bundle as an additive front-of-skill path for M5+ frames, gated by a mandatory pre-Step-3 sanity check (§5.9) that triggers Rule 15 fallback when ≥ 30% structural divergence is detected.

Four coupled decisions to lock if ratified:

1. **Bundle-vs-extract precedence** — when a bundle exists for a frame, does it OVERRIDE the local skill extraction, or merely augment it?
2. **Bundle authenticity contract** — what guarantees does the bundle make? (token completeness, canned-data verbatim from canonical HTML, ARIA exemplars matching, spec.json schemaVersion ≥3)
3. **Update cadence** — when canonical HTML revises, does the bundle re-ship, or does the local skill re-extract?
4. **Fallback when bundle missing** — frames without a bundle (M3 ports, older M4 frames) keep the existing 7-step extract flow.

## Decision

### 1. Bundle-vs-extract precedence

**CLARIFIED Day-23 per Anthropic Handoff Bundle official docs** (corrects Day-22 draft assumption that bundle auto-generated React TSX):

**The Anthropic Handoff Bundle is RICHER INPUT than v2 HTML alone — NOT auto-generated React.** The bundle contains:

- `design.html` — canonical reference HTML (functionally equivalent to today's `<frame> v2.html` in `Redesign Frame by claude design/`; the design intent in human-readable HTML form)
- `screenshots/` — per-viewport rendering of `design.html` (320 / 768 / 1024 / 1440 / desktop). Crucial for `diff-probe.mjs` visual-baseline comparison BEFORE FE+1 writes a line of TSX.
- `design-notes.md` — designer's intent prose: edge cases, interaction states, accessibility decisions, data canon decisions. Captures the "why" that's invisible from HTML alone.
- `spec.json` — pre-extracted section tree (schemaVersion ≥3, v2.2-compatible BEM + depth-7). Same shape as `extract-spec.mjs` output.
- `README.md` — bundle-level manifest + checksum + designer authorship.

**Workflow collapse:** ADR-022 collapses Steps 1+2 of the existing 7-step skill workflow (extract-canned-data + extract-spec) by replacing them with direct bundle ingestion. Steps 3-7 unchanged from v2 HTML port — TSX scaffold + diff-probe + Hard Rule 13 visual gate + commit + PR.

**60-70% time saving comes from:**

1. **Collapsed extraction phases** (Steps 1+2 → "import bundle artifacts" = ~30 min saved per frame)
2. **Screenshot diff baselines** (skip the "manually capture canonical HTML at each viewport" Step 5 setup = ~20 min saved per frame)
3. **Design intent captured in `design-notes.md`** (skip the inline ambiguity-resolution round-trip Yogesh ↔ FE+1 = ~15-30 min saved per frame)

**The 60-70% NUMBER DOES NOT come from auto-generated React** — Anthropic's bundle does NOT produce React natively. Day-22 draft implied otherwise; corrected here.

### 2. Bundle authenticity contract

Five artifacts each carry an explicit contract:

- `design.html` — every TSX element must trace to a DOM element in this HTML (Rule 15 spirit + diff-probe selector matching). The HTML is the ground truth for layout + semantic structure.
- `screenshots/<viewport>.png` — `diff-probe.mjs` compares port-rendered screenshots against these as BASELINE (replaces Step 5's "render canonical HTML in Playwright" step). Bundle screenshots are GENERATED FROM `design.html` so they're trustable.
- `design-notes.md` — every "non-obvious" design decision lives here. FE+1 reads end-to-end at Step 3 before TSX scaffold; ambiguity goes through Yogesh, not invented by FE+1 (Rule 17 spirit).
- `spec.json` — schemaVersion ≥3; section tree pre-extracted. Skill's `extract-spec.mjs` is the FALLBACK if bundle is stale/missing.
- `README.md` — bundle metadata (designer name + ISO timestamp + checksum of `design.html`). Anchors the bundle's authorship + drift detection.

**When bundle is AUTHORITATIVE vs ADVISORY:**

- **Authoritative** for Steps 1+2 inputs (replaces extract-canned-data + extract-spec).
- **Advisory** for everything else — FE+1 still writes TSX (Step 4); diff-probe still runs (Step 5); Hard Rule 13 visual gate still gates (Step 6). Bundle does NOT auto-pass the gate.

### 3. Update cadence

Bundle re-ships on canonical revision. If FE+1 finds the bundle stale vs the latest `design.html` (or canonical revision exists), FE+1 escalates to Yogesh + Claude Design for re-bundle. Local skill's `extract-spec.mjs` is the FALLBACK + diff-probe authority — `diff-probe.mjs` walks the bundle's spec.json AND the running React port; if both agree, gate passes; if bundle is stale, the diff surfaces the gap (sections in `design.html` but missing from bundle `spec.json`).

### 4. Fallback when bundle missing

Existing 7-step workflow per `.claude/skills/frame-port/SKILL.md` runs UNCHANGED. No regression on M3 frames + non-redesigned M4 frames. The bundle path is ADDITIVE, not REPLACEMENT.

### Updated 7-step workflow (when bundle present)

```
1. Import bundle artifacts (replaces "extract-canned-data" + "extract-spec")
   — read design.html (canonical reference) + design-notes.md (intent) +
     spec.json (section tree) + screenshots/ (baselines)
2. Validate bundle contract (5 artifacts present, spec.json schemaVersion ≥3,
   checksum matches README.md, design.html parses, screenshots cover 5 viewports)
3. Show spec.json to Yogesh for approval (UNCHANGED — bundle's spec.json is the artifact under review)
4. Scaffold TSX from design.html + design-notes.md + spec.json (UNCHANGED in spirit;
   FE+1 STILL writes the TSX manually — bundle does NOT auto-generate React)
5. Run diff-probe.mjs against running localhost — using bundle screenshots as
   BASELINE (replaces the "render design.html in Playwright at each viewport"
   sub-step; bundle ships pre-rendered screenshots) (60-70% Step 5 setup saved)
6. Submit screenshots for Rule 13 visual gate (UNCHANGED — Yogesh visual approval)
7. Commit + push + open PR (UNCHANGED)
```

Steps 3-7 stay identical in CONTRACT; only steps 1+2 inputs collapse + Step 5 setup compresses. Net workflow cost: ~60-70% reduction on the extraction + baseline phases; Steps 3-7 quality + duration unchanged (FE+1 still writes TSX manually).

## Consequences

- **Faster ports for M5+ frames** — bundle eliminates the most error-prone steps (Day-19 BEM heuristic gap + Day-18 invented-data drift both fell here)
- **Externalized quality control** — Claude Design owns the bundle's authenticity contract; FE+1 + MAIN can REJECT a bundle that fails contract checks
- **Lower diff-probe iteration** — bundle's spec.json is pre-validated; first run is more likely to GREEN
- **New failure mode: stale bundle** — addressed by diff-probe's cross-canonical comparison (still runs against current HTML)
- **Workflow split requires Hard Rule 15 amendment** — Rule 15 currently mandates "v2 HTML port source-of-truth"; ADR-022 introduces "bundle port source-of-truth" as an additive path. Rule 15 needs an amendment Part X codifying: "When a Claude Design Handoff Bundle exists for a frame, the bundle artifacts (design.html + design-notes.md + spec.json + screenshots) become source-of-truth; the v2 HTML reverts to a CANONICAL CROSS-CHECK target (diff-probe runs against bundle screenshots; bundle is the implementation input)." Without this amendment, Rule 15 and ADR-022 conflict.
- **Future LISTEN/NOTIFY channels follow ADR-021 §6 namespace** — if the bundle workflow ever needs cross-process eventing (e.g., a future "skill-event LISTEN/NOTIFY" for diff-probe progress streaming OR bundle-validation completion fanout), the channel name MUST follow `qa_nexus.<domain>.<event>` per ADR-021 §6 ratified Day-23. Example: `qa_nexus.skill.frame_port.diff_probe_complete`. No new channel naming convention introduced here.

### 5.3 Pre-built TSX scaffolding finding (Day-23 PM, F22 first-use)

Anthropic public docs describe Handoff Bundle as `design.html` + `screenshots/` + `design-notes.md` + `spec.json` + `README.md`. **Actual bundle ALSO contains pre-built TSX scaffolding** at codebase-convention paths Claude Design infers from project context. Inference is imperfect — F22 bundle used `apps/web/src/app/` paths; actual QA Nexus codebase uses `apps/web/app/` (no `src/` directory). FE+1 verifies and adapts paths during Step 4 (not Step 1+2 collapse). Bundle pre-built TSX is **STARTING POINT for Step 4 scaffold, NOT drop-in.**

**Impact on 60-70% time-saving estimate:** source breakdown updates to:

- (a) collapsed Steps 1+2 extraction phases — **~30 min saved per frame**
- (b) pre-rendered screenshot diff baselines skipping Step 5 setup — **~20 min saved per frame**
- (c) `design-notes.md` intent capture removing ambiguity round-trips — **~15-30 min saved per frame**
- (d) **NEW: pre-built TSX scaffolding accelerating Step 4 by ~30-40 min once path adaptation done**
- (e) MINUS path/convention adaptation cost — **~10-15 min cost per frame**

Net: **~85-110 min saved per frame vs HTML port, holds at the 60-70% saving estimate.**

**Implications for FE+1 Step 4 workflow:**

- Bundle's pre-built TSX is checked into FE+1's Step-4 starting point but treated as a SCAFFOLD (rename + relocate per codebase conventions); NOT a final TSX
- Path adaptation gates: import paths · component-tree paths in `design-notes.md` · `apps/web/src/app/` → `apps/web/app/` rewrite · any `import { x } from 'src/...'` patterns get the prefix removed
- Yogesh project-context decisions (Day-23 F22 example: project-scoped route `/projects/[slug]/defects/[id]`) still surface at Step 3 spec.json approval — bundle does not auto-assign routes
- Hard Rule 13 visual gate (Step 6) unchanged — pre-built TSX has the same gate as hand-scaffolded TSX

**Forbidden patterns added (visual review FAIL triggers from Day-23+):**

- Treating bundle pre-built TSX as drop-in (skips path adaptation = build failure)
- Skipping Step 3 spec.json approval because "bundle pre-built TSX implies it's ready" (Yogesh approval gate is BEFORE Step 4 even with pre-built TSX)
- Inferring routes from bundle pre-built TSX without verifying against QA Nexus route conventions (project-scoped vs workspace-scoped)

**Cross-references:** `feedback_claude_design_bundle_first_use.md` (to-be-filed memory documenting the full F22 Step 3 inspection) · `feedback_skill_v2.2_first_use.md` (sibling memory; F22 first-use journal) · ADR-021 §6 namespace convention (precedent for cross-ADR cross-cutting concerns) · Yogesh Day-23 Step 3 approval decisions (path correction + project-scoped route).

### 5.9 Bundle-canonical divergence finding (Day-23 PM, F22 first-use REJECTION)

Bundle workflow ASSUMES Claude Design's bundle output preserves canonical v2 HTML design intent. F22 first-use proved this assumption **FALSE** — bundle generated simplified page (4 layers, basic structure) vs v2 HTML canonical (5 layers, rich per-layer evidence panels, Sherlock confidence bar, Curator similar defects, Discussion+Jira sync, rich right rail with 5 sections). **~30-50% structural divergence.**

**Mitigation: pre-Step-3 sanity check MANDATORY** (added Day-23+ to skill workflow per this amendment):

- Compare bundle output against v2 HTML structure BEFORE FE+1 begins scaffolding
- Quantify: count v2 HTML sections (via existing `extract-spec.mjs`) vs bundle `spec.json` sections
- **Threshold:** if divergence > 30% structural (sections-missing OR sections-collapsed), **REJECT the bundle** and port from v2 HTML directly per Hard Rule 15
- This becomes a new pre-flight Step 2.5 between bundle ingest (Steps 1+2 collapsed) and Yogesh Step 3 approval

**Impact on ADR-022 ratification gate (Day-24 PM):** F22 is **NOT a clean validation.** F25 + F23 must pass with < 30% structural divergence for the gate to fire green. **If either F25 or F23 also shows >30% divergence, bundle workflow remains EXPERIMENTAL — not formalized as ADR-022.** Hard Rule 15 (v2 HTML port source-of-truth) stays the default; bundle is an opt-in optimization with mandatory pre-Step-3 sanity check.

**Implications cascade for F19 Option B decision (already-ratified Day-23):**

- F19 Option B (bundle workflow) assumed bundle preserves canonical intent. If F25 + F23 also show >30% divergence Day-24-25, F19 Option B is in doubt; Yogesh may need to revert F19 to Option A (v2 HTML + skill v2.2 7-step workflow) before Day-25.
- IF Yogesh hasn't started F19 Claude Design session yet (Day-23 PM): **hold F19 Claude Design session until Day-24 PM ADR-022 gate outcome.**
- IF F19 bundle already generated and looks divergent (>30% vs canonical F19 v2 HTML): apply same REJECTION pattern, fall back to Option A.

**New forbidden patterns (visual review FAIL triggers Day-23+):**

- Skipping the pre-Step-3 sanity check (assuming bundle is faithful to canonical without measurement)
- Yogesh approving Step 3 spec.json without comparing bundle's structural count vs v2 HTML's structural count
- Treating bundle as authoritative when divergence > 30% (use v2 HTML directly per Rule 15 — bundle is REJECTED, not amended)
- Hand-augmenting a divergent bundle's TSX with missing sections (FE+1 hand-augmentation is Hard Rule 17 invention risk; full v2 HTML port is cleaner + more auditable)

**Cross-references:** `feedback_claude_design_bundle_first_use.md` (memory captures full F22 REJECTION reasoning) · `feedback_f19_workflow_decision.md` (Day-23 ratified F19 Option B — amendment candidate if Day-24 PM gate fails) · Hard Rule 15 (v2 HTML port source-of-truth — remains DEFAULT pending gate outcome) · ADR-021 §6 namespace (precedent for cross-cutting constraints).

## Alternatives considered

- **v2 HTML port only (current — Hard Rule 15 + 16 + 17 stack, no ADR-022)** — works for M3 + M4 frames but doesn't capture the M5 Day-22+ shift; F22 + F25 + (assumed) F23 will run the bundle pattern regardless. Codifying matches reality + locks the workflow contract.
- **Bundle port only (premature)** — REJECTED. M3 + earlier M4 frames have no bundles; forcing bundle-only would require retroactive bundle generation for those frames (~6 historical frames × 30 min each = 3+ hours of pure rework with zero pilot-visible benefit). Hybrid is the right answer.
- **Hybrid (CURRENT PROPOSAL):** when a bundle exists, it is AUTHORITATIVE for steps 1+2 (extract-canned-data + extract-spec collapsed into "import bundle artifacts"); steps 3-7 unchanged. Frames without a bundle fall back to the current 7-step workflow. Diff-probe + visual gate always run regardless of port source.
- **Per-frame ADR amendment instead of a global ADR-022** — REJECTED. Pattern repeats across F22 + F25 + F23 + F26 + F28 — single ADR captures the workflow once vs five amendments.
- **Bundle as advisory only (no precedence)** — REJECTED. Confuses "which source of truth"; FE+1 has to reconcile two extractions. Adds work instead of saving it.
- **Bundle replaces ALL 7 steps (including diff-probe + visual gate)** — REJECTED. Diff-probe + visual gate are FE+1's local trust gates; bundle is Claude Design's pre-extraction; both checks must run.

## Ratification gate (TWO-DAY validation — Day-23 close + Day-24 AM)

**Day-23 EOD scope:** DRAFT skeleton fill-in only. NO ratification.

**Day-24 AM scope:** ratify IFF the two-day gate holds across 3 frames.

- **Day-23 close gate (necessary, not sufficient):** F22 + F25 first-uses BOTH GREEN or AMBER per skill v2.2 Hard Rule 18 Day-19 Part 3 band system.
  - GREEN = <5% pixel diff on all viewports + DOM probe sections all PASS + MISSING_NESTED count 0
  - AMBER = 5-10% pixel diff acceptable + ≥60% sections PASS via PRIMARY (ARIA) or SECONDARY (class) tier + MISSING_NESTED count 0
- **Day-24 AM gate (full ratification):** Day-23 close gate held AND F23 port (assuming iteration 2 lands tonight + handoff bundle delivered Day-23 PM/EOD) is also GREEN or AMBER.
- **3-frame minimum validation:** F22 (depth-heavy nested-count test) + F25 (shell-graft test) + F23 (form-heavy / Configure-region test). Each frame stresses a different bundle-workflow axis. All 3 must validate before formalizing.
- **RED gate (postpone Day-24+):** ANY of F22 / F25 / F23 is RED (>10% pixel diff at any viewport OR DOM probe <60% sections PASS OR MISSING_NESTED catches real drift not explained by Radix/shadcn wrappers) → POSTPONE ADR-022 indefinitely. File the friction details in `.claude/memory/feedback_handoff_bundle_rough_patches.md` for retro analysis. Bundle pattern needs hardening before formalizing.
- **Why two days, not one:** one-day signal is thin — could be a fluke (e.g., F22 + F25 happen to be unusually clean; F26 + F28 fail). Two days across 3 frames catches the "Day-23 was a fluke" failure mode AND extends validation to the form-heavy frame class (F23) which the dashboard frames (F25) don't stress.

## Ratification decisions (Tue 2026-05-26 Day-27)

1. **Bundle versioning** — DEFERRED to M6. `bundleVersion` field documented in `docs/m6/m6-hygiene-followups.md` (post-M5 scope). Current bundles carry the implicit "v1" of Anthropic's Handoff Bundle schema; explicit versioning waits until schema evolution becomes a real problem.
2. **Bundle storage** — RATIFIED. Bundles committed to repo at `apps/web/components/<frame>/handoff-bundle/` (per Day-23 F22 precedent). R2 storage REJECTED — no auditability + adds free-tier dependency without clear benefit at pilot scale.
3. **Bundle signing** — DEFERRED to M6. HMAC-SHA256 signature considered but pilot trust model is "Yogesh approves" not "supply-chain attack". M6 hygiene followup if pilot scale changes (8 → 50+ users) or external bundle distribution becomes a requirement.

## Cross-references

- `feedback_skill_v2.2_first_use.md` — F22 + F25 first-use journal will populate the ratification evidence
- `feedback_handoff_bundle_rough_patches.md` — to-be-created if RED gate fires
- Hard Rule 18 stack (Parts 1+2+3+4) — ADR-022 inherits the band system; doesn't supersede
- F22 canonical: `QA Nexus/PM1/PM1_UI_v2/Redesign Frame by claude design/F22 Defect Detail v2.html`
- F25 canonical: `QA Nexus/PM1/PM1_UI_v2/Redesign Frame by claude design/F25 Executive Dashboard v2 -Dark-.html` (Day-22 delivery)
- F25 bundle: `QA Nexus/PM1/PM1_UI_v2/Redesign Frame by claude design/F25 Ex V2 handoff Bundle for claude code (FE +1).zip` (Day-22 delivery)

---

**Ratification footer (Tue 2026-05-26 Day-27 PM):**

- **Authority:** Yogesh Mohite (Admin) + MAIN (planner) + FE+1 (implementer). 3-frame validation: F22 v2 HTML fallback Day-23 (bundle ~30-50% divergent) · F25 bundle SUCCESS Day-24 (0% divergence) · F23 bundle PASS Day-27 (12.5% ARIA divergence, well under §5.9 30% threshold; diff-probe AMBER band 5.1-9.6%).
- **Effective scope (M5+):** F25 already PASSED Day-24 · F23 PASSED Day-27 · F26 + F28 carry to **Wed Day-28 2026-05-27** as Tier-2 reserve (neither has a bundle: F26 = Day-24 scope-locked to v2 HTML + skill v2.2; F28 = no v2 redesign exists, ports from `frames - claude code build (PM1 v2.6-v2.8)/F28 Settings & Audit.html` v1 + skill v2.2). Bundle path remains ENABLED for any future M5+/M6 frame where Claude Design ships a bundle AND pre-Step-3 sanity check passes.
- **Hard Rule 15 amendment:** Forthcoming as a separate followup (post-M5 enhancement). Will codify precedence when both bundle + v2 HTML exist for a frame: bundle is AUTHORITATIVE for Steps 1+2 IFF sanity check ≤ 30% divergence; otherwise Rule 15 (v2 HTML) remains DEFAULT.

_Ratified Tue 2026-05-26 Day-27 PM. Bundle workflow is now an additive M5+ path; Hard Rule 15 stays the binding port source-of-truth when bundle absent OR sanity check fails. Promote this file to `docs/architecture/adr-022-frontend-bundle-workflow.md` per the ratification commit._
