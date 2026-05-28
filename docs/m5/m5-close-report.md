# M5 Close Report — Mon 2026-05-25 (revised from Fri 2026-05-22 after Fri+Sat orchestrator absence)

> **Status:** PRE-DRAFT REFINED Sun 2026-05-24 ~17:30 IST. **M5 close shifted Fri 2026-05-22 → Mon 2026-05-25** after Fri+Sat zero-work gap (orchestrator unavailable; see `feedback_orchestrator_absence_blocks_all_agents.md`). Sun is a recovery session: F19 finish + F23 start + AC042 corpus eval tonight. §4 AC042 result placeholder expected Sun ~20:00 IST. §5 carry list final fill on Monday. Promote to `docs/m5/m5-close-report-2026-05-25.md` Monday PM after all gates land. Tag name: TBD (Yogesh decides whether to retain `m5-closed-2026-05-22` as milestone marker OR re-stamp `m5-closed-2026-05-25`).
> **Authored:** MAIN Day-24 ~15:30 IST · refined Sun 2026-05-24 ~17:30 IST with F25 PASSED + ADR-020/021 ratified known data. Cross-references: `.claude/scratch/m5-friday-close-plan.md` (binding plan that this report verifies against — close-date shifted but content unchanged).

---

## 1. M5 scope delivered

PM1 M5 milestone closes **Mon 2026-05-25** (revised from Fri 2026-05-22 after Fri+Sat orchestrator-absence gap) with 6 frames ported + ADR-020 Jira webhook ingestion (all 14 event types) + ADR-021 Reports backend (`ReportsService` + `report_aggregate` table + at least 2 report kinds live) + ADR-022 Frontend Handoff Bundle workflow (ratified OR documented as EXPERIMENTAL per Monday PM gate outcome).

**Scope summary (binding M5 close definition per `m5-friday-close-plan.md` §M5 close definition):**

- 6 frames ported (F19 · F22 · F23 · F25 · F26 · F28) — TSX shipped + diff-probe ≤ AMBER band + Hard Rule 13 visual gate PASSED
- ADR-021 Reports backend live (per §3 below)
- ADR-020 Jira webhook full (14/14 event types routed, Sherlock async trigger wired, WS emit working, QNT seed bootstrap successful)
- AC042 corpus eval PASSED (per §4 below)
- CHANGELOG `[Unreleased]` → `[M5] - 2026-05-22`
- Tag `m5-closed-2026-05-22` on main HEAD

Day-25 13 working days from PM1 kickoff (Day-12 2026-05-08 was M4 close). M5 ships in 7 working days vs M4's 6 — slightly longer cycle due to compressed Day-21-22 + Day-23 bundle-rejection recovery.

## 2. Frames shipped (table — refined Day-27 Tue 2026-05-26)

| Frame                   | PR #                        | Port path                                                                                  | Visual gate band                                                                                                                                        | Day shipped                                                                                                                                                                                                                                                                                                   |
| ----------------------- | --------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F22 Defect Detail       | **#192**                    | **v2 HTML + skill v2.2** (bundle REJECTED Day-23)                                          | **PASSED Day-23 17:25 IST**                                                                                                                             | Day-23                                                                                                                                                                                                                                                                                                        |
| F25 Executive Dashboard | **#197**                    | **bundle** (first bundle-workflow SUCCESS; 0% structural divergence)                       | **PASSED Day-24 ~16:30 IST**                                                                                                                            | Day-24                                                                                                                                                                                                                                                                                                        |
| F19 Run Console         | **#198 READY**              | v2 HTML + skill v2.2 · Option C hybrid reorganize + patch · 6 polish rounds at visual gate | **PASSED Day-25 Sun-recovery**                                                                                                                          | Day-25 (Sun 2026-05-24)                                                                                                                                                                                                                                                                                       |
| F23 Reports Studio      | **#203 READY** at `ce49b25` | bundle (`handoff/F23/`); **pre-Step-3 sanity check PASS at 12.5% ARIA divergence**         | **✓ SHIPPED Day-27 18:45 IST** — flipped DRAFT → READY; diff-probe AMBER 5.1-9.6%, 11/33 ARIA exemplars matched. **F23 was the ADR-022 tiebreaker → ✓** | Day-27 (Tue 2026-05-26)                                                                                                                                                                                                                                                                                       |
| F26 Agents              | —                           | —                                                                                          | —                                                                                                                                                       | **SLIPPED to Wed Day-28 2026-05-27** — bundle never generated (Day-24 scope-lock confirmed v2 HTML + skill v2.2 path); orchestrator-absence (Fri+Sat+Mon = 3 days lost) consumed the Day-25/Day-26 capacity originally allocated. Tier-2 reserve scope per `m5-friday-close-plan.md` §M5 close definition.    |
| F28 Settings & Audit    | —                           | —                                                                                          | —                                                                                                                                                       | **SLIPPED to Wed Day-28 2026-05-27** — never redesigned by Claude Design (no v2 HTML in `Redesign Frame by claude design/`; ports from existing v1 HTML in `frames - claude code build (PM1 v2.6-v2.8)/F28 Settings & Audit.html`); orchestrator-absence consumed the planned capacity. Tier-2 reserve scope. |

**3-frame bundle validation outcome (feeds ADR-022 gate):**

- F22 bundle: ✗ **REJECTED Day-23** (~30-50% structural divergence; FE+1 fell back to v2 HTML). Strike against ADR-022.
- F25 bundle: ✓ **PASSED Day-24 ~16:30 IST** (first bundle-workflow SUCCESS; 0% structural divergence; ported clean via pre-Step-3 sanity check + Step 3 APPROVED 14:00 IST + Step 6 visual gate PASSED). Validation **FOR** ADR-022.
- F23 bundle: **TIEBREAKER Day-27 Tue 2026-05-26 ~17:00 IST** — pre-Step-3 sanity check **PASSED at 12.5% ARIA divergence** (well under §5.9 30% threshold); diff-probe AMBER band (5.1-9.6% pixel diff); 11/33 ARIA exemplars matched. PR #203 awaits Yogesh Step 6 visual gate sign-off.

**ADR-022 ratification interpretation (Day-27 Tue 2026-05-26 refined):**

- 1 ✗ (F22) + 1 ✓ (F25) + F23 PENDING. **Pre-Step-3 sanity check ratified Day-23 §5.9 (30% threshold) PROVED ITS VALUE on F23 today** — bundle measured 12.5% ARIA divergence, well under threshold; gate fired green. Without the sanity check, F23 would have proceeded blind to whatever structural drift exists.
- **If F23 PASSES Step 6 today → ADR-022 RATIFIES Day-27** (2 ✓ : 1 ✗; bundle workflow is an additive M5+ path; pre-Step-3 sanity check (§5.9) mandatory; Rule 15 fallback retained for divergence ≥ 30%). **Pre-staged Edit playbook at `.claude/scratch/adr-022-ratification-edits.md` — ~3.5 min ETA from PASS-signal to PR-open.**
- **If F23 REJECTS Step 6 today → ADR-022 stays EXPERIMENTAL** (1 ✓ : 2 ✗); Rule 15 remains DEFAULT; file `feedback_handoff_bundle_rough_patches.md` with the 2-frame-reject pattern. M5 close still proceeds — ADR-022 ratification is NOT a Tier-1 blocker (frames + ADR-020/021 + AC042 are).

## 3. ADRs landed Day-22 → Day-27

| ADR                              | Status                                  | Ratified                         | PR #                                     | Notes                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------- | --------------------------------------- | -------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ADR-020 Jira sync architecture   | **RATIFIED Day-22 · IMPL LIVE on main** | Day-22 2026-05-19 11:30 IST      | #179 (ratification) · #189 + #195 (impl) | §7 webhook async-write contract BINDING (Day-22 amendment); §6 namespace convention `qa_nexus.<domain>.<event>` BINDING M5+. Wire-up cascade landed Sun 2026-05-24 on commits `f907378` + `351b751`. 15 events wired (target 14, +1 surplus); `sprint_started` filed as Day-28+ minor followup.                                                        |
| ADR-021 Reports backend          | **RATIFIED Day-23 · IMPL LIVE on main** | Day-23 2026-05-20 11:50 IST      | #183 (ratification) · #194 (impl)        | 5 sub-decisions + Amendment A (cron 02:30 IST) + Amendment B (`is_stale` column) + §6 namespace + sequencing risk locked. Impl cascade landed Sun 2026-05-24 commit `81711b3`: 6 report kinds + SWR cache + 02:30 IST cron.                                                                                                                            |
| ADR-022 Frontend Bundle workflow | **✓ RATIFIED Day-27**                   | Day-27 Tue 2026-05-26 ~16:00 IST | **#208 OPEN** (merges Wed Phase A)       | 3-frame validation: F22 ✗ + F25 ✓ + F23 ✓ → 2:1 RATIFY. Mandatory §5.9 pre-Step-3 sanity check (30% threshold triggers Rule 15 fallback) · bundle path ADDITIVE to Rule 15 · bundle storage at `apps/web/components/<frame>/handoff-bundle/` · versioning + HMAC signing DEFERRED to M6. 10-step playbook fired ~3 min wall (well under 5-min budget). |

**M5 retro candidate (deferred from in-flight ratification):** Hard-Rule sibling — "Architectural conventions established in one ADR §X are inherited by ALL subsequent ADRs and must be referenced, not re-declared." Surfaced at Day-23 EOD §7.5; promote to RETROS.md at M5 close.

## 4. AC042 Sherlock corpus eval — PASS Wed Day-28 2026-05-27

> AC042 binding eval re-ran 2026-05-27 via Plan A2 schema + prompt fix. **Verdict: PASS** at top-2 **64%** (gate 40%), calibration **1.00** (gate 0.8), crashes **0/50**, corpus n=50.
>
> **Fixes applied (PR #213 on `fix/be-sherlock-schema-bridge`):**
>
> 1. Zod schema loosen — `apps/api/src/agents/sherlock-code/schemas.ts` (evidence `union(array, string)` + `agent.optional()`, shared across all 4 agents)
> 2. Prompt calibration nudge — 4 agent system prompts per ADR-019 §2 amendment (explicit confidence-band guidance preventing ≥0.8 default)
>
> **Provenance:** Codex-assisted corpus labels (Yogesh spot-checked 6 sub-0.70 cases) per ADR-022 §5.9 reserve-allowance precedent. Cumulative Day-28 Groq usage: ~424/1000 RPD (~58% headroom retained).

**Pass condition verified (per ADR-019 §AC042 + M5 v2 plan §4.5):**

- ✓ Top-2 hit rate 64% ≥ 40% gate
- ✓ Confidence calibration 1.00 ≥ 0.8 gate
- ✓ Crash rate 0/50 < 5% threshold
- ✓ LLM budget within free tier (~424/1000 RPD across Day-28 smoke + re-eval)

**ADR-019 status update:** promoted from "ratified, eval pending" → "ratified, AC042 PASSED Wed Day-28 2026-05-27".

---

### Day-27 FAIL diagnosis (preserved for retro)

> AC042 binding eval ran 2026-05-26 ~19:55 IST. **Verdict: FAIL** at top-2 0.0%
> (gate 40%). Diagnosis: Sherlock prompt + SherlockHypothesisSchema Zod
> validation out of sync with gpt-oss-120b JSON output shape; all 4 agents
> (data/code/env/flake) fail Zod validation → 0 hypotheses returned →
> status=degraded across the entire corpus.
>
> **NOT a label-quality issue.** Labels were Codex-assisted + Yogesh
> spot-checked on 6 sub-0.70 confidence cases (per ADR-022 §5.9
> reserve-allowance precedent). Labels never reached the comparison layer
> because agent output failed validation upstream.
>
> **NOT a model-cap or quota issue.** Groq responded successfully on all 200
> calls (input_tokens ~400/call), no 401s, no rate limits, no network errors.
>
> **Fix path identified** (3 options ranked cheapest-first):
>
> 1. Loosen SherlockHypothesisSchema Zod to model's natural output shape
> 2. Tighten ADR-019 prompt with explicit JSON field-name example + nag
> 3. Add Groq `response_format: { type: 'json_schema' }` structured-output wrapper
>
> **Re-eval: Wed Day-28 09:00 IST.** AC042 PASS verdict required before M5
> CORE close ceremony fires.
>
> Cost burned: ~200 Groq calls (20% of daily RPD); ~800 RPD headroom for Wed
> re-eval cycles.

**Pass condition (per ADR-019 §AC042 + M5 v2 plan §4.5) — unchanged for Wed re-eval:**

- Top-2 hit rate ≥ 40% on 50-defect golden corpus
- Confidence calibration ≥ 0.8 for high-confidence rows
- < 5% of 50-defect set crashes
- LLM budget: ~200 calls per run (4 agents × 50 defects)

**Wed Day-28 schedule:**

- 09:00 IST: BE+1 implements fix-path option 1 (or 2/3 if needed)
- 09:30 IST: smoke single-defect end-to-end via `pnpm ac042:smoke` (proposed M6 hardening)
- 10:00-10:45 IST: full 50-defect binding re-eval
- 10:45 IST: PASS verdict expected → fire Phase A merge wave

## 5. Known carries — Wed Day-28 2026-05-27 (revised post-AC042-FAIL)

**Tier-1 fix-forward (Wed Day-28 AM, blocking M5 close ceremony):**

- **AC042 schema-bridge fix + re-eval** — BE+1 owned. Fix path: Sherlock prompt + SherlockHypothesisSchema Zod alignment per §4 diagnosis. ~1-2 hr Wed AM. PASS verdict required before tag fires.

**Tier-2 reserve (Wed Day-28, allowed per ADR-022 §5.9 reserve-allowance precedent):**

- **F26 Agents bundle port** — Tier-2 reserve allowance. Claude Design quota refresh expected Wed AM enables bundle generation (vs Day-24 scope-lock v2-HTML path). FE+1 port via skill v2.2; ~2-2.5 hr.
- **F28 Settings & Audit redesign + port** — Tier-2 reserve. Claude Design quota refresh Wed AM enables fresh v2 redesign (vs Day-27 v1-HTML-only path); FE+1 port via skill v2.2 after Yogesh design lands; ~2.5-3 hr including design wait.
- **F27 Users & Roles** — pending Yogesh Wed AM decision. Currently still v1; candidate for batch with F28 redesign if quota allows. NOT in original M5 scope.

**Outstanding PRs (queued for Wed close docs wave):**

- **All EOD HOLD PRs** (#180, #182, #185, #188, #190, #191, #193, #196, #199, #200, #202, #205, #207, #209, plus Day-27 EODs landing tonight, plus Wed EODs)
- **ADR-022 PR #208** (merges Wed Phase A — docs-only, AC042-independent)
- **BE+1 corpus labels PR** `feat/be-ac042-corpus-labels-codex` (merges Wed after AC042 PASS)
- **Functional PRs** #192/#197/#198/#203/#201/#206 (Phase A merge wave Wed AM post-PASS)

**Minor carries:**

- **`sprint_started` event wire-up** — 15/14 events wired Sun cascade, surplus +1; `sprint_started` filed as Day-28+ minor followup at `docs/m6/m6-hygiene-followups.md`. Does NOT block M5 close.
- **Hard Rule 15 amendment Part X** — codifies bundle-vs-v2-HTML precedence at frame port time; deferred to Day-28+ alongside F26 + F28 ports as a clean separation (M5 close = ratification + scope locked; Day-28+ = applied rule + frames ported using the rule).

**Reserve does NOT burn on:**

- New frames or new features beyond F26 + F28 + (possible) F27
- Bundle workflow iteration beyond F26/F28/F27 — that's M6 enhancement scope
- ADR-022 second-attempt ratification (ADR-022 already ratified Day-27)

**Wed Day-28 schedule preview:**

- **09:00 IST:** kickoff coordination (MAIN + BE+1 + FE+1 + Yogesh)
- **BE+1 09:00-10:45:** AC042 schema-bridge fix-forward (~1-2 hr) + smoke + re-eval
- **10:45 IST:** BE+1 posts "AC042 PASS" → MAIN finalizes §4 numbers → fire Phase A merge wave
- **10:45-11:30:** Phase A merge wave (8 PRs: 7 original + `feat/be-ac042-corpus-labels-codex`)
- **11:30-12:30:** Phase B EOD merge wave (14 EOD HOLDs + Day-27 EODs + Wed EODs)
- **12:30-12:45:** Phase D close ceremony — promote close report to `docs/m5/m5-close-report.md`; CHANGELOG bump `[Unreleased]` → `[M5 CORE] - 2026-05-27`; tag `m5-closed-2026-05-27`; release notes from this report
- **12:45 IST:** POST "M5 CORE CLOSED — tag m5-closed-2026-05-27 cut" to all channels
- **Parallel Wed AM:** Yogesh runs F28 Claude Design (quota refreshed) + decides F27 inclusion
- **Parallel Wed PM:** FE+1 ports F26 + F28 (+ possible F27) bundles via skill v2.2

## 6. M5 retro candidates

Seven retro candidates identified across Day-19 → Day-27, surfaced at M5 close report for the retro doc handoff (separate file: `docs/m5/retro/m5-close-retro-2026-05-26.md` — to be drafted Wed Day-28 alongside F26+F28 ports). **§6.7 (orchestrator-absence) is the DOMINANT friction class of M5 — 3 calendar days lost (Fri+Sat+Mon); all other friction classes combined are smaller in calendar impact.**

### 6.1 Bundle workflow (frame-specific quality — 3-frame validation)

F22 bundle REJECTED Day-23 (30-50% structural divergence vs v2 HTML); F25 bundle PASSED Day-24 (0% divergence); F23 bundle PENDING Day-27 (12.5% ARIA divergence at pre-Step-3 sanity check, well under 30% threshold — gate fired green, awaiting Step 6 visual confirmation). **The bundle workflow quality is frame-specific, NOT universally reliable.** Mandatory pre-Step-3 sanity check (ADR-022 §5.9) is the right safety net. Treat ADR-022 — if ratified Day-27 — as "bundle workflow ENABLED with sanity check; fall back to Rule 15 if sanity check fails". Don't promote bundle to universal default until 5+ frames port clean (Day-28 F26 v2 HTML + F28 v1 HTML do NOT count toward this number since neither has a bundle).

### 6.2 Pre-stage scaffold pattern (3× validated this week)

- Day-22 ADR-021 ratification walkthrough pre-staged Day-22 PM → ratification compressed to <10 min Day-23 AM
- Day-23 EOD content pre-staged Day-23 PM → 17:30 commit took <5 min
- Day-24 Day-25 close plan + Day-25 close report skeleton pre-staged Day-24 PM → Day-25 EOD becomes mechanical commit

**ROI math:** ~30-45 min pre-stage cost vs ~60-90 min synchronous-meeting cost = 2-3× savings per ratification or EOD push. Promote to STACK_LEARNINGS.md at retro doc handoff.

### 6.3 Branch-lineage drama (cat-heredoc muscle memory)

Day-22 ~30 min recovery → Day-23 ~3 min recovery → Day-24 ~0 min (no incidents Day-24 observed yet). Pattern is now muscle memory. Pre-tool-use `git rev-parse HEAD == <expected SHA>` hook proposal (M5 retro candidate) would have caught both Day-23 incidents at 0 cost — recommend Day-26+ implementation as the first M6 hygiene task.

### 6.4 Paste-drift (~14 misroutes Day-22-23-24)

- Day-22: 7 misroutes (28 min cost)
- Day-23: 10 misroutes Day-23 morning paste + ~1 Day-23 PM
- Day-24: ~3 misroutes observed (TBD final count at Day-24 EOD)
- **Cumulative ~14 misroutes / ~56 min lost across the umbrella theme** "single-human × N-window coordination friction"
- 4 mitigations in `feedback_parallel_chat_routing_paste_drift.md` ladder (color-coding · validation · paste-pin · destination-park). Window-color-coding remains the cheapest unimplemented mitigation.

### 6.5 Fresh-session-restart pattern (FE+1 Day-23 → Day-24)

FE+1 chat was offline Day-21+Day-22; Day-23 fresh restart with brief parked at `-frontend/.claude/scratch/day-23-fe-kickoff.md` (filesystem handoff bypassed paste-routing). **Pattern validated for offline destinations:** when destination chat is unreachable, park at destination's worktree scratch — Yogesh `cat`s the brief at session restart. Promote to `feedback_offline_destination_scratch_park.md` memory file Day-25 PM if pattern survives 1 more destination-offline incident.

### 6.6 Agent-session context-staleness (5th friction class) + bundle-workflow REJECTION (6th friction class)

- **5th friction class (Day-23 14:30 IST):** session memory drifted from filesystem + git + gh ground truth; refresh via `gh + git + cat scratch`, NOT internal memory. Promoted to memory candidate Day-24 AM (`feedback_agent_session_context_staleness.md` to-be-filed Day-28).
- **6th friction class (Day-23 PM late):** bundle workflow REJECTION (F22) — external-artifact-quality variability adds a new failure mode beyond branch-lineage / paste-drift / commitlint / resume-pulse / context-staleness. Captured in `feedback_claude_design_bundle_first_use.md`.

**Cumulative Day-22-24 cost across 6 friction classes:** ~80 min Day-22 + ~60 min Day-23 + ~30 min Day-24 = ~170 min total. ~30% of session time across the umbrella theme. Each mitigation candidate filed; M6 hygiene work owner = TBD at retro. **Note:** these 6 are session-internal friction (minutes lost per session). §6.7 below is CALENDAR friction (days lost) and dwarfs all 6 combined.

### 6.7 Orchestrator-absence (7th friction class — DOMINANT M5 lesson)

**Cost:** 3 calendar days lost — Fri 2026-05-22 + Sat 2026-05-23 + Mon 2026-05-25. M5 close target shifted Fri → Mon → Tue (Day-27) — a **5-day slip** from the original Fri-close plan to the Day-27 CORE close target.

**Mechanism:** PM1's 3-agent build (MAIN + BE+1 + FE+1) is routed entirely through **one human (Yogesh)**. Hard Rules 11/13/14/18 + skill-mandatory workflows + ADR ratification ceremony + EOD merge approval ALL require human-in-the-loop signals. When Yogesh is unavailable for ≥1 calendar day, **all 3 agents go idle simultaneously** — none can self-trigger the next priority queue, merge a PR, approve a Step 3 spec.json, or close a Step 6 visual gate.

**Why it dominates other friction classes:** 6.1-6.6 cost MINUTES per session (3-30 min each). 6.7 costs DAYS. The Fri+Sat+Mon gap consumed:

- The entire Sat-Sun reserve baked into `m5-friday-close-plan.md` (sized for AC042 fixes + frame slippage, NOT orchestrator absence)
- 1 additional weekday (Monday)
- A 5-frame Day-25 plan (F19 + F23 + F26 + F28 + close ceremony) collapsed into a Day-25 Sun-recovery (F19 + F23 PARTIAL) + Day-27 (F23 finish + close) + Day-28 (F26 + F28)

**Mitigation candidates (memory file already filed Day-25):**

1. **Pre-flag gaps ≥48 hr in advance via EOD report.** Day-24 EOD did NOT flag Fri-Sat absence; if it had, MAIN could have re-cast the plan to "M5 close shifts to Mon" instead of "Fri close + 2-day reserve burn."
2. **Pre-stage agent-side work that doesn't need human approval.** BE+1 can run unit tests, write internal docs, refactor non-shipped code — anything pre-PR. FE+1 can pre-extract spec.json for future frames, scaffold canned-data.ts files. These unblock the FIRST hours after the orchestrator returns.
3. **MAIN's pre-stage scaffold pattern (§6.2 — validated 4× now)** is the existing first-line defense — pre-drafted briefs + close-report skeletons + ratification-edit playbooks (Day-27 #23-#24 task completions). Doesn't unblock during the gap, but eliminates startup-cost on return.

**Severity escalation rule:** if this pattern recurs (a second multi-day gap in M5 or M6), upgrade severity from Medium to **High**. Pilot is 18-week timeline; one 3-day gap = ~2.4% of total time (tolerable). Three or four 2-day gaps = 2-3 week milestone slip (project-level concern).

**For M6 planning specifically:** add an explicit "Human availability calendar" section at the front of each milestone plan. List committed work days + known gaps. Plan compresses or shifts based on calendar, NOT optimism.

**Memory file:** `feedback_orchestrator_absence_blocks_all_agents.md` (filed Day-25; promote to M6 plan section header).

### 6.8 AC042 schema-bridge failure surfaced as zero-hypothesis degraded state, not a calibration miss (Day-27 lesson)

**AC042 schema-bridge failure surfaced as zero-hypothesis degraded state, not a calibration miss.** Future eval-gate runs should pre-validate at least ONE agent's raw response shape against schema BEFORE running the full corpus burn — would have caught this in <5 min instead of 60 min full eval. Add a `pnpm ac042:smoke` script that runs a single defect end-to-end with verbose output, gated before the full binding eval can fire. **Track for M6 hardening.**

**Why this matters:** the FAIL verdict reported top-2 0.0% which initially read as a model-cap or calibration miss. Diagnosis took ~30 min to traverse from "0% top-2" → "0 hypotheses returned" → "status=degraded across corpus" → "Zod validation fails all 4 agents" → "schema out of sync with model output shape". A 1-defect smoke harness would have surfaced "Zod validation failure" in the first 5 min and skipped the 200-call burn entirely.

**Mitigation cost:** ~30 min M6 implementation; saves ~55 min per fail + ~200 RPD per fail. Pays for itself on the first eval-gate failure post-M5.

### 6.9 LLM-assisted labeling provenance must be documented when used (Day-27 lesson)

**LLM-assisted labeling provenance must be documented in close report when used.** Codex-assisted 45-case labeling with human spot-check is acceptable trade-off per ADR-022 §5.9 reserve-allowance precedent, but the AC042 verdict it would have produced (had eval reached comparison layer) carries different semantics than pure-human ground truth. **M6+ corpus governance should require an explicit LLM-assist vs pure-human flag on every eval run.**

**Why this matters:** the Day-25 → Day-26 corpus expansion used Codex (LLM) to label 45 of the 50 CPI cases with human spot-check on 6 sub-0.70 confidence cases. The §5.9 reserve-allowance precedent permitted this. However, when AC042 verdicts are eventually compared across runs (M6 + M7 + …), the LLM-assist provenance becomes relevant for understanding why eval accuracy changes between runs — same model + different ground truth provenance yields different verdicts.

**Mitigation:** add a `groundTruth.provenance` field to each staged case (enum: `pure_human` / `llm_assisted_spot_check` / `llm_only`) + surface in AC042 results JSON + close report. M6 scope.

## 7. Version bump + tag (Wed Day-28 2026-05-27 AM action, AFTER docs wave)

**Sequential M5 CORE close ceremony (Wed Day-28 post-AC042-PASS, post-Phase-A+B docs wave merge per `.claude/scratch/m5-docs-wave-merge-order.md`):**

1. `docs/CHANGELOG.md` patch: move `[Unreleased]` content → `[M5 CORE] - 2026-05-27` heading; new empty `[Unreleased]` above for Day-28+ work
2. Commit: `docs(changelog): close M5 CORE 2026-05-27` (Yogesh runs on main directly OR opens 1-PR via `docs/main-m5-close-2026-05-27`)
3. Tag: `gh release create m5-closed-2026-05-27 --target main --title "M5 CORE — Iksula QA Pilot Frame Closure" --notes-file docs/m5/m5-close-report.md`
4. Release notes = the close report at `docs/m5/m5-close-report.md` (promoted from this scratch file Wed AM)
5. Post to MAIN chat: `M5 CORE CLOSED — tag m5-closed-2026-05-27 cut. F26+F28 carry to Day-28 PM per ADR-022 §5.9. AC042 top-2 [X]% / calibration [Y]. 4/5 frames + 3 ADRs + corpus eval gate cleared.`

**Tag ONLY lands after (Wed Day-28 Tier-1 close definition):**

- AC042 PASS verdict locked (top-2 ≥ 40% + calibration ≥ 0.8) per BE+1's Wed AM re-eval
- 4 of 6 core frames PRs merged (F19 #198 · F22 #192 · F23 #203 · F25 #197); F26 + F28 = Tier-2 reserve to Wed Day-28 PM
- ADR-020 wire-up cascade (already LIVE on main — #189 + #195, Day-23 Sun)
- ADR-021 impl cascade (already LIVE on main — #194, Day-23 Sun)
- ADR-022 ratification PR #208 merged (Wed Phase A; ready since Day-27)
- BE+1 corpus labels PR `feat/be-ac042-corpus-labels-codex` merged (Wed Phase A after PASS)
- Phase A + B docs wave complete (~22 PRs total: 8 functional + 14+ EOD HOLDs + Day-27 EODs + Wed EODs)
- Wed Day-28 EOD trio (BE+1 + FE+1 + MAIN) filed + merged

**If any of the above is incomplete Wed Day-28 EOD:** tag deferred further. M5 "functional CORE close" is the public-facing milestone; tag follows the docs trail. F26+F28 ports happen Wed Day-28 PM inside the M5 release notes (single append, no new tag).

---

**Cross-references:**

- `.claude/scratch/m5-friday-close-plan.md` — binding M5 close plan + risk register + Saturday docs-wave checklist
- `.claude/scratch/adr-022-candidate-skeleton.md` — Day-25 PM ratification target (gate deferred to Day-25 PM per Day-24 status update)
- `.claude/memory/feedback_claude_design_bundle_first_use.md` — F22 REJECTION evidence + Day-23 17:25 v2-HTML re-port PASS
- `.claude/memory/feedback_skill_v2.2_first_use.md` — append F25/F19/F23/F26/F28 outcome bands Day-24-25
- `.claude/memory/feedback_chained_base_squash_gotcha.md` — Day-20 lesson (Day-25 cascade verified flat-base, no auto-close risk)
- ADR-019 Sherlock RCA strategy — AC042 eval target document
- ADR-020 + ADR-021 ratified on main: `docs/architecture/adr-020-jira-sync-architecture.md` + `docs/architecture/adr-021-reports-backend.md`
- F22 first canonical port: PR #192 (Day-23 17:25 IST)

---

_Skeleton authored Day-24 ~15:30 IST. Sections §2 / §4 / §5 are placeholders for Day-25 PM fill-in. Promote to `docs/m5/m5-close-report-2026-05-22.md` ONLY when Day-25 PM gates land. Do NOT commit this scratch file._
