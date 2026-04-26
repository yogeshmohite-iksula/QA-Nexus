# Claude-Design HTML Review vs PM1_UI_v2 Spec

**Date:** 2026-04-23
**Inputs:** 9 HTMLs at `/mnt/uploads/01-home.html` through `09-integrations.html` (6,635 total lines — self-contained Tailwind CDN + Google Fonts + inline styles + realistic content)
**Reference:** PM1_UI_v2 consolidated spec (5 files, 4,466 lines)

---

## 1. Executive Summary

The 9 HTMLs are **high-quality and close to our design system — but with one important convention difference and several valuable patterns worth adopting.**

**Top-line verdict:**
- ✅ Brand name "QA Nexus" consistent across all 9 HTMLs
- ✅ Canvas / base / raised / overlay surface tokens match canonical exactly (`#0B0F17` / `#111827` / `#1A2233` / `#232C3F`)
- ✅ 3 of 4 typography stacks match (Inter, DM Sans, JetBrains Mono) — only Geist Mono is missing (replaced by JetBrains Mono everywhere for monospace)
- ✅ Rail grouping matches our lifecycle model (Home · PLAN · AUTHOR · Reports/Analyse · GOVERN-ish)
- ⚠️ **HTMLs use OLD primary/secondary convention:** `--d-primary: #A78BFA` violet, `--d-secondary: #2DD4BF` teal. Our latest spec (after your ask) inverted this: Primary=teal, Secondary=violet. **These HTMLs need a simple find-replace to align with the new convention.**
- ✅ HTMLs have a **better-defined Prove-mode palette** than our spec (complete semantic set for light mode). This is an upgrade worth adopting wholesale.
- ✅ Multiple high-quality patterns worth adopting: worklist row design, KPI card pattern, clarification-first A1 modal, agent-tile autonomy ladder, annotated trend chart.

**Recommendation:** use these HTMLs as the visual reference for PM1, but apply two adjustments before locking them:
1. Swap `--d-primary` (violet) and `--d-secondary` (teal) values to match the new convention.
2. Add `Geist Mono` to the font imports for metric displays (keep JetBrains Mono for code).

---

## 2. HTML-to-PM1-Frame Mapping (validated)

| HTML file | Lines | Maps to | Confidence | Notes |
|---|---:|---|:-:|---|
| `01-home.html` | 690 | **F08b Home Dashboard** | High | Has AI Value strip equivalent. Shows rail + top bar with project switcher. Realistic Iksula data. |
| `02-test-cases.html` | 785 | **F17 Test Case Library** | High | Three-panel layout present (tree / cards / detail). AI draft badges, confidence chips. |
| `03-ai-generator.html` | 736 | **F16b A1 Generate from Requirement** | High | 4-step stepper (clarify → review → accept). Inline A2 dedup chips. |
| `04-runs.html` | 746 | **F19 Run Console** or **F20 Run Results** | High | Has case-by-case progress + evidence capture. Likely closer to F20 (post-run review). |
| `05-reports.html` | 800 | **F23 Reports Studio** | High | Template library + report preview + trend charts with annotations. |
| `06-agents.html` | 874 | **F26 Agents config** | High | A1/A2/A4 detail cards + autonomy ladder + audit feed. Role-gated. |
| `07-automation-studio.html` | 1,055 | **OUT-OF-SCOPE for PM1** (PM3 low-code A3) | High | Block-based editor — this is the A3 Low-Code Authoring Studio from PM3. Keep for PM3 reference, **do not include in PM1_UI_v2**. |
| `08-failures.html` | 431 | **F21 Defects Hub** (partial) or **F20 Run Results cluster view** | Medium | Shorter frame, focused on failure clustering. A4 5-Layer RCA abbreviated here — full treatment in our F22 spec. |
| `09-integrations.html` | 518 | **F28 Settings & Audit — Integrations tab** OR standalone integration manager | Medium | Standalone — good reference for F28's Integrations tab. |

**Mapping verdict:** 7 of 9 HTMLs map cleanly to PM1 frames. 1 is out of PM1 scope (07 = PM3). 1 is a partial match (08).

---

## 3. Shared Design System (confirmed across all HTMLs)

Every one of the 9 HTMLs uses the same `<style>` prelude with CSS variables:

```css
/* Operate mode (dark) */
--d-canvas:    #0B0F17;   ✅ matches PM1_UI_v2 canonical
--d-base:      #111827;   ✅ matches
--d-raised:    #1A2233;   ✅ matches
--d-overlay:   #232C3F;   ✅ matches

--d-pass:      #34D399;   ✅ matches
--d-fail:      #F87171;   ✅ matches
--d-warn:      #FBBF24;   ✅ matches
--d-info:      #60A5FA;   ✅ matches

--d-ai:        #C4B5FD;   ⚠️ new — separate "AI accent" token (lighter violet)
--d-neutral:   #94A3B8;   ⚠️ new — neutral gray (useful)

--d-primary:   #A78BFA;   ⚠️ VIOLET as primary (OLD convention)
--d-secondary: #2DD4BF;   ⚠️ TEAL as secondary (OLD convention)

/* Prove mode (light) — not in our spec yet */
--l-canvas:    #FAFAF8;   ✅ matches PROVE canvas
--l-base:      #FFFFFF;   ✅ matches PROVE card
--l-raised:    #F4F3EF;   ⚠️ new — prove raised surface
--l-overlay:   #FFFFFF;   matches

--l-pass:      #047857;   ⚠️ new — darker green for light mode contrast
--l-fail:      #B91C1C;   ⚠️ new — darker red for light mode
--l-warn:      #B45309;   ⚠️ new — darker amber for light mode
--l-info:      #1D4ED8;   ⚠️ new — darker blue for light mode
--l-ai:        #6D28D9;   ⚠️ new — darker violet AI for light mode
--l-neutral:   #475569;   ✅ matches our prove-mode secondary text
```

**Font imports (all 9 HTMLs):**
```
Inter 400/500/600/700        ✅
DM Sans 600/700               ✅
JetBrains Mono 400/500/600    ✅
```

**Missing from HTMLs:** Geist Mono (our canonical metrics font). The HTMLs use JetBrains Mono for BOTH code AND metrics. Decision: either (a) add Geist Mono to HTML imports, or (b) accept JetBrains Mono for metrics — simpler, just collapse to one monospace stack. **Recommend (b) — simplify our spec to just 3 fonts.**

---

## 4. The Primary/Secondary Convention Conflict 🚨

This is the key finding.

**Our new canonical (per your last instruction):**
- Primary = teal `#2DD4BF` (for CTAs, value, approval)
- Secondary = violet `#A78BFA` (for AI only)

**HTMLs use the OLD convention:**
- Primary = violet `#A78BFA` (used on buttons, accents)
- Secondary = teal `#2DD4BF` (used on value markers)

**Impact:** if you hand these HTMLs to Stitch as reference, Stitch will replicate the OLD convention — CTAs will render violet instead of teal. Major buttons on home, reports, agents pages would be violet, not teal.

**Fix:** one-line find-replace in each HTML before using as reference:
```css
/* swap these two values */
--d-primary:   #2DD4BF;   /* was #A78BFA */
--d-secondary: #A78BFA;   /* was #2DD4BF */
```

And visually, any `bg-[#A78BFA]` used as CTA background should become `bg-[#2DD4BF]`; any `text-[#2DD4BF]` used as value indicator stays teal (that's correct); AI chips/badges should stay violet `#A78BFA` (those represent AI, so violet is right for them under new convention too).

In practice: **CTA buttons swap from violet to teal**, everything else stays. It's a 10-minute change per HTML.

---

## 5. What the HTMLs Got RIGHT (adopt these into PM1_UI_v2)

### 5.1 Prove Mode palette (09 variables)
Our spec mentions Prove mode but doesn't fully define it. HTMLs provide the complete light-mode semantic set (`#047857` pass, `#B91C1C` fail, `#B45309` warn, `#1D4ED8` info, `#6D28D9` AI, `#F4F3EF` raised). **Adopt verbatim into `PROJECT_UI_DESIGN_TOKENS.json`.**

### 5.2 Separate `--ai` token from primary
HTMLs have `--d-ai: #C4B5FD` as its own token, not the same as primary or secondary. Clean separation. **Adopt into our token JSON.** Maps to "violet-400" in our current spec.

### 5.3 Neutral gray token `#94A3B8`
Used for deeply-secondary labels, disabled states, subtle metadata. We don't have this. **Adopt.** Maps nicely between our secondary-text `#C7D0DC` and tertiary-text `#8A94A6`.

### 5.4 Count chips on rail items
Rail items show counts inline in JetBrains Mono 10px: "Test Cases 1,284", "Agents 9". Our spec doesn't mention this. **Adopt** — useful signal.

### 5.5 Page-question as `<title>`
Each HTML has `<title>QA Nexus — What should I do today?</title>` (Home), `<title>QA Nexus — What's in the library?</title>` (Test Cases), etc. The page question IS the tab title — reinforces the Question Header motif. **Adopt** in Stitch prompt output.

### 5.6 Worklist row design (01-home.html, F08 queue)
Checkbox + status-shape indicator + title + meta chips + sparkline + quick actions, all in one horizontal row. High-density, readable. Better than our spec's card-list. **Adopt for F08a's personal queue + F21 Defects Hub list rows.**

### 5.7 KPI card with delta + sparkline (05-reports.html)
Big number (DM Sans 48px) + delta pill ("▲ 12% vs last week") + inline sparkline + formula footnote. Cleaner than our F24 spec which has 4 separate rows. **Adopt for F24 hero metrics and F08b AI Value strip.**

### 5.8 Clarification-first A1 modal (03-ai-generator.html)
4-step stepper: Source → Clarify → Review → Accept. A2 dedup chips inline on generated cases. Our F16b spec has 3 phases; this is 4 and cleaner. **Adopt — upgrade F16b to 4-phase.**

### 5.9 Agent tile with autonomy ladder (06-agents.html)
Each agent shows: name + version + status + 3 autonomy levels (Monitor / Suggest / Act) with a sliding indicator + permission scope pills + guardrail toggles. Rich governance visualization. **Adopt for F26 agent detail panel.**

### 5.10 Trend chart with annotations (05-reports.html)
Line chart with release markers ("v1.4 ships" on a specific date) and cluster callouts (defect spikes tagged with cause). Narrative data viz. **Adopt for F23 Reports trend charts and F24 QA Value weekly trend.**

---

## 6. What's MISSING in the HTMLs (preserve in our spec)

The HTMLs are polished visual designs. They don't encode some governance/ops concerns our PM1 spec does. **Do NOT drop these when adopting HTML patterns:**

1. **Role gating matrix** — HTMLs don't encode that QA Engineer hides Govern section, Stakeholder hides Environments, etc. Our spec has this explicit. **Keep.**
2. **Project switcher dropdown with `+ Create new project`** — HTMLs show a project chip in the top bar but the dropdown behavior and Create-new affordance isn't visible in the markup. Our spec is explicit. **Keep.**
3. **AI Value strip as its own focal row on F08b** — 01-home.html has dashboard metrics but not specifically framed as the "how AI is saving time for leadership" narrative. Our spec positions this as the #1 feature for Lead/Admin/Stakeholder home. **Keep and blend — use KPI card pattern from HTML for the 4 AI Value cards.**
4. **A4 5-Layer RCA panel** (Stack 90 → Env 80 → Config 60 → Code 50 → Data 40) — 08-failures.html has an abbreviated RCA but not the full 5-layer accordion. Our F22 spec is deeper. **Keep F22 as specified.**
5. **Provenance footnote on every AI Value metric** — HTMLs show metrics but don't explicitly document formula + data source + calibration date underneath. Our spec insists on this. **Keep** — it's the honest-posture rule from audit Wave 3.
6. **Prove mode toggle on F24 / F25** — HTMLs define prove-mode palette but don't show the mode toggle on the exec dashboard. Our spec makes this explicit. **Keep.**
7. **Immutable audit log with HMAC signatures (F28)** — HTMLs don't cover this. Our F28 spec does. **Keep.**

---

## 7. Per-HTML Notes

### `01-home.html` → F08b Home Dashboard (Lead/Admin/Stakeholder)
- Question title: "What should I do today?"
- Rail: full canonical structure (Home, PLAN: Test Plans & Cycles, Test Cases [1,284], AUTHOR, RUN: Runs & Sessions, Reports, QA Value, GOVERN: Agents [9], Integrations, Settings & Audit)
- Shows a worklist-style queue with status shape indicators — **adopt for F08a and F08b both**
- Has "What AI did for me today" strip — **this IS the AI Value strip pattern, good**
- Missing: explicit per-project cockpit tiles (our spec specifies these for Lead view) — **add back when merging**

### `02-test-cases.html` → F17 Test Case Library
- Question title: "What's in the library?"
- Three-panel layout confirmed (suites tree / card grid / detail)
- AI draft badges, confidence chips, sparklines per test case — **all match our spec**
- Missing: Confidence Lane (3px left edge motif) on AI-draft cards — **add back**
- Missing: SMART auto-folders in suites tree (AI-drafted last 7d / Flaky >20% / etc.) — **add back from our spec**

### `03-ai-generator.html` → F16b A1 Generate from Requirement
- Question title: "What should I write tests for?"
- 4-step stepper: Source → Clarify → Review → Accept (our spec has 3 — upgrade to 4)
- A2 dedup chips appear inline during Review step — good
- Cost / latency display per generation run — **adopt; we don't have this explicit in F16b**

### `04-runs.html` → F19 Run Console / F20 Run Results
- Question title: "What's running and what just broke?"
- Hybrid of F19 + F20 — shows both active run progress and post-run cluster view
- Evidence auto-capture preview (screenshot + console + HAR) — **matches our spec**
- Consider: split back into F19 (active) and F20 (review) per our spec, or accept the hybrid

### `05-reports.html` → F23 Reports Studio
- Question title: "What do I need to show this week?"
- Template gallery (Daily Status / Weekly / Sprint Sign-off / Release Readiness) — **matches our spec**
- Trend chart with annotations (release markers, cluster callouts) — **richer than our spec; adopt**
- Schedule-recurring + drafts sections — matches our spec

### `06-agents.html` → F26 Agents
- Question title: "Are the agents safe, scoped, and auditable?"
- Agent tile with autonomy ladder (Monitor / Suggest / Act) + permission scope + guardrail toggles — **adopt wholesale**
- Audit feed showing last 50 agent decisions — matches our spec

### `07-automation-studio.html` → **OUT-OF-SCOPE for PM1**
- Block-based low-code editor — this is A3 (Low-Code Authoring Studio) from PM3 scope, not PM1
- Keep this file as PM3 reference (move to `PM3_reference/` folder or just leave in `/uploads/`)
- **Do NOT adopt into PM1_UI_v2**

### `08-failures.html` → F21 Defects Hub (partial)
- Shorter frame (431 lines), focused on failure clustering
- A4 RCA shows abbreviated 3-layer hypothesis (not full 5-layer) — use this for F21 defect card preview, full 5-layer stays on F22 Defect Detail
- Good cluster-grouping UI — adopt for F20 Run Results cluster view

### `09-integrations.html` → F28 Settings & Audit — Integrations tab
- Standalone integrations management (Jira / GitHub / Slack / Confluence / Figma cards with status + last sync + test/disconnect buttons)
- **Adopt as F28's "Integrations tab" design** — don't need a standalone integrations frame in PM1

---

## 8. Proposed changes to PM1_UI_v2 (priority-ranked)

### Critical (do before next Stitch run)

| # | Change | File | Effort |
|---|---|---|---|
| 1 | Fix primary/secondary swap in HTMLs before reusing: `--d-primary: #2DD4BF`, `--d-secondary: #A78BFA` (or state explicitly in Stitch prompt that CTA buttons must be teal, AI accents violet) | All 9 HTMLs OR Stitch prompts in 02-05 | 10 min |
| 2 | Add Prove-mode palette (light-l-variables) to `PROJECT_UI_DESIGN_TOKENS.json` | `Project_UI/PROJECT_UI_DESIGN_TOKENS.json` | 5 min |
| 3 | Add `--d-ai: #C4B5FD` and `--d-neutral: #94A3B8` as distinct tokens | `Project_UI/PROJECT_UI_DESIGN_TOKENS.json` + `01_SYSTEM.md` §3.1 | 5 min |

### High (improves Stitch output quality materially)

| # | Change | File | Effort |
|---|---|---|---|
| 4 | Update F08a + F08b to adopt worklist row pattern from 01-home.html | `02_ENTRY_AND_HOME.md` §4, §5 | 20 min |
| 5 | Update F16b from 3-phase to 4-phase (Source → Clarify → Review → Accept) per 03-ai-generator.html | `04_TEST_LIFECYCLE.md` §3 | 15 min |
| 6 | Update F24 hero metrics to adopt KPI card pattern (big number + delta + sparkline + formula footnote) from 05-reports.html | `05_ANALYSE_AND_GOVERN.md` §3 | 20 min |
| 7 | Update F26 agent tile to include autonomy ladder + scope pills + guardrail toggles per 06-agents.html | `05_ANALYSE_AND_GOVERN.md` §5 | 15 min |
| 8 | Update F23 trend chart spec to include release markers + cluster callouts per 05-reports.html | `05_ANALYSE_AND_GOVERN.md` §2 | 10 min |

### Nice-to-have

| # | Change | File | Effort |
|---|---|---|---|
| 9 | Add count chips to rail items where counts are known (Test Cases N, Agents 3) | `01_SYSTEM.md` §4.2 | 5 min |
| 10 | Collapse "Geist Mono + JetBrains Mono" to just JetBrains Mono (match HTML convention — simpler) | `01_SYSTEM.md` §3.3 + all Stitch prompts | 15 min |
| 11 | Add `<title>QA Nexus — {page question}</title>` convention to Stitch prompts | Every frame's Stitch prompt | 10 min |
| 12 | Move `07-automation-studio.html` to `PM3_reference/` folder, flag as PM3-only | File move | 2 min |

**Total effort to land all changes:** ~2 hours.

---

## 9. Scope flags

### 07-automation-studio.html (out of PM1)
Confirmed: this is the A3 Low-Code Authoring Studio from PM3. Block-based editor with drag handles, slash commands, export to Playwright/Selenium/Cypress. **Do not add to PM1_UI_v2.** Move to a `PM3_UI_reference/` folder for use when we design PM3 frames later.

### Frames NOT covered by these 9 HTMLs
The following PM1 frames have no HTML equivalent in this batch — they remain spec-only until Stitch/Claude Design generates them:
- F06 Sign In (already locked — you approved a design earlier)
- F07 First-Run Onboarding
- F09 Projects List
- F10 Create Project Modal
- F11 Source Connect Jira
- F12 Upload Requirements Modal
- F13 Imported Files List
- F14 Requirements
- F15 Knowledge Base
- F16a Test Case Method Chooser
- F16c Bulk Import Test Cases
- F18 Test Suites
- F22 Defect Detail (A4 5-Layer RCA — the deep version)
- F25 Executive Dashboard (Prove mode)
- F27 Users & Roles
- F28 Settings & Audit (beyond the Integrations tab)

That's **16 frames** still to generate. When you generate them in Stitch, use the HTMLs as the visual pattern reference but apply the primary/secondary swap.

---

## 10. Recommended next actions (ranked)

1. **Apply primary/secondary swap to Stitch prompts** in `02_ENTRY_AND_HOME.md`, `03_SOURCE_AND_DOCS.md`, `04_TEST_LIFECYCLE.md`, `05_ANALYSE_AND_GOVERN.md` — make the anti-drift line even more explicit: *"Primary is teal `#2DD4BF` — used on CTA buttons like 'Authenticate', 'Generate', 'Save'. Secondary is violet `#A78BFA` — used ONLY on AI accents: agent labels, Confidence Lane, AI-draft badges. Do NOT use violet for CTAs; do NOT use teal for AI."*
2. **Adopt Prove-mode palette** from HTMLs into our tokens file.
3. **Adopt new tokens:** `--d-ai: #C4B5FD`, `--d-neutral: #94A3B8` — add to tokens JSON + 01_SYSTEM.md.
4. **Update F08a/F08b/F21** to use worklist row pattern from 01-home.html.
5. **Update F16b** to 4-phase stepper from 03-ai-generator.html.
6. **Update F24 + F08b AI Value strip** to use KPI card pattern (big number + delta + sparkline + formula footnote) from 05-reports.html.
7. **Update F26 agent tile** to include autonomy ladder + scope pills per 06-agents.html.
8. **Use these HTMLs as reference screenshots in the Stitch prompts** — embed them inline or attach as secondary reference so Stitch has the visual target + our spec rules.

---

## 11. Summary table

| Aspect | Our PM1_UI_v2 spec | 9 HTMLs | Verdict |
|---|---|---|---|
| Brand name | "QA Nexus" | "QA Nexus" | ✅ aligned |
| Canvas colors | `#0B0F17` / `#111827` / `#1A2233` / `#232C3F` | Same | ✅ aligned |
| Semantic state colors | `#34D399` / `#F87171` / `#FBBF24` / `#60A5FA` | Same | ✅ aligned |
| Primary / Secondary | teal / violet (new) | violet / teal (old) | 🚨 swap needed |
| Typography | Inter / DM Sans / Geist Mono / JetBrains Mono | Inter / DM Sans / JetBrains Mono (no Geist) | ⚠️ drop Geist, simpler |
| AI accent token | Implicit in brand.violet | Explicit `--d-ai: #C4B5FD` | 🔧 adopt explicit token |
| Prove mode palette | Mentioned, not fully defined | Fully defined 9 vars | 🔧 adopt wholesale |
| Rail lifecycle grouping | Home + PLAN/AUTHOR/RUN/ANALYSE/GOVERN | Same groups | ✅ aligned |
| Project switcher | Dropdown with Create option | Visible but dropdown behavior unclear | ⚠️ keep our spec |
| Role gating | Explicit matrix | Not encoded | ⚠️ keep our spec |
| AI Value strip on F08b | Focal row with 4 KPI cards | Dashboard metrics (similar but less narrative) | 🔧 adopt KPI card + keep narrative |
| Three-panel F17 library | Specified | Present | ✅ aligned |
| A4 5-Layer RCA (F22) | Full 5-layer accordion | Abbreviated 3-layer in 08-failures | ⚠️ keep our F22 full depth |
| Worklist row pattern | Card-list | Worklist row (better) | 🔧 adopt |
| F16b A1 stepper | 3-phase | 4-phase (better) | 🔧 adopt |
| Agent autonomy ladder | Basic config | Full autonomy ladder visualization | 🔧 adopt |
| Automation Studio | Flagged as PM3 | Designed in 07-automation-studio.html | ⚠️ move to PM3 ref |

**Status:** 7 of 9 HTMLs are high-value PM1 references. Adopting patterns + fixing the one convention reversal unlocks strong visual quality for the remaining 16 PM1 frames.

---

## 12. If you want me to execute the updates

Say the word and I'll:
1. Run a 15-minute pass to apply items #1–#3 (token updates) and #9–#11 (nice-to-haves)
2. Run a 60-minute pass to apply items #4–#8 (frame spec updates to adopt HTML patterns)
3. Produce an updated 5-file PM1_UI_v2 package with the HTML reference patterns baked in
4. Give you Stitch prompts updated to reference these HTMLs explicitly

Total effort: ~2 hours. Delivers a tighter spec + better Stitch output quality for the remaining 16 frames.
