# Claude Design Master Prompt — QA Nexus PM1

**Purpose:** Paste this prompt into Claude Design **after attaching** the files listed below. Claude Design has a longer context window than Stitch, handles multi-file context better, and respects structured constraints more reliably. This prompt is designed to maximize Claude Design's output quality.

---

## Files to attach in Claude Design (before pasting the prompt)

Attach ALL of these as context files so Claude Design has the full design system in scope:

### From `/mnt/QA nexus MVP/QA Nexus/PM1_UI_v2/`
1. `01_SYSTEM.md` — locked design system, navigation contract, hard constraints
2. `02_ENTRY_AND_HOME.md` — F06, F07, F08a, F08b, F09, F10 frame specs
3. `03_SOURCE_AND_DOCS.md` — F11, F12, F13, F14, F15
4. `04_TEST_LIFECYCLE.md` — F16a, F16b, F16c, F17, F18, F19, F20, F21, F22
5. `05_ANALYSE_AND_GOVERN.md` — F23, F24, F25, F26, F27, F28
6. `CLAUDE_DESIGN_HTML_REVIEW.md` — the alignment review explaining how our spec relates to the 9 reference HTMLs

### From `/mnt/QA nexus MVP/QA Nexus/Project_UI/`
7. `PROJECT_UI_DESIGN_TOKENS.json` — machine-readable tokens with prove-mode palette + AI accent + neutral gray

### From `/mnt/uploads/` — the 9 reference HTMLs (attach for visual inspiration)
8. `01-home.html` — Home dashboard reference
9. `02-test-cases.html` — Test Case Library three-panel reference
10. `03-ai-generator.html` — A1 Generate 4-phase stepper reference
11. `04-runs.html` — Run Console / Results reference
12. `05-reports.html` — Reports Studio + annotated trend chart reference
13. `06-agents.html` — Agents with autonomy ladder reference
14. `08-failures.html` — Defects / failure clustering reference
15. `09-integrations.html` — Integrations tab reference

**Do NOT attach `07-automation-studio.html` — it's PM3 scope, out of PM1.**

---

## ===== CLAUDE DESIGN PROMPT — COPY-PASTE EVERYTHING BELOW =====

# Your role

You are a **Principal Product Designer** with deep experience designing high-density B2B QA platforms, AI governance tooling, and enterprise SaaS. You produce Figma-ready frame designs that are **self-consistent**, **pixel-precise**, and **operationally trustworthy**.

# The product you're designing

**QA Nexus** — an AI-native operating system for QA teams. It sits **beside Jira** (Jira owns project management; QA Nexus owns the QA operating layer: requirements → test cases → runs → defects → reports).

**Scope of this work — PM1 / MVP, 21 calendar weeks, ships 2026-09-21.**

**PM1 has exactly 3 AI agents. No others exist in PM1.**

| Agent | What it does |
|---|---|
| **A1** | Test Case Generator — streams draft cases from Jira ticket / requirement doc / URL / Figma / KB; asks clarification questions when ambiguous |
| **A2** | Duplicate Detection — semantic similarity across test cases and defects, inline chips during authoring |
| **A4** | Defect Intelligence — 5-Layer RCA (Stack 90% → Env 80% → Config 60% → Code 50% → Data 40%), classifies into App Bug / Test Bug / Flaky / Env Issue |

**Forbidden references in PM1:** A3, A5, A6, A7, A8, APT, VCG. These exist only as disabled "Coming in v1.5/v2" tooltips on rail items Automation Studio and Data & Mocks.

**Target users:** QA Engineer · QA Lead · Admin · Stakeholder — each with a defined role-gating matrix (see `01_SYSTEM.md §4.3`).

# Design language — echo this statement verbatim in your first response

> **QA Nexus is Quiet Intelligence / Evidence Mesh.** It is a calm mission-control system for quality: dark operational surfaces for daily work, lighter prove-mode surfaces for leadership and compliance, card-first orientation above data-dense detail, and AI that always leaves footprints through labels, confidence, and evidence. It must feel original, premium, and operationally trustworthy — not like BrowserStack, TestRail, ContextQA, or a generic AI SaaS dashboard.

Then explain in one sentence each how you will instantiate:
1. calm mission-control
2. evidence-first workbench
3. card-first above dense detail
4. AI always leaves footprints
5. one shell across all 23 PM1 frames

# HARD CONSTRAINTS — violations require rewriting from scratch, not patching

## Color — exactly 2 brand colors + semantic states + AI accent + neutral

**Primary = `#2DD4BF` teal** — used on CTA buttons ("Authenticate", "Generate", "Save", "Approve"), primary links, value indicators (ROI tiles), approval flows, positive momentum.

**Secondary = `#A78BFA` violet** — **RESERVED FOR AI ONLY**: agent labels (A1/A2/A4), Confidence Lane 3px edge, AI-draft badges, AI chip backgrounds, agent audit entries. Never on a non-AI CTA.

**The CTA / AI disambiguation rule:** if the button triggers a regular action (save, submit, approve, generate-a-report), it is **teal**. If the element represents an AI agent's work, it is **violet**. Example from the approved F06 Sign In: the `Authenticate` button is teal; the `Contact Site Admin` link is violet — canonical pattern.

**Canvas surfaces (Operate mode, default):**
- `#0B0F17` canvas
- `#111827` base surface
- `#1A2233` raised
- `#232C3F` overlay

**Canvas surfaces (Prove mode — F24, F25, any export surface):**
- `#FAFAF8` ivory canvas
- `#FFFFFF` white card
- `#F4F3EF` raised
- Prove-mode semantic: pass `#047857`, fail `#B91C1C`, warn `#B45309`, info `#1D4ED8`, ai `#6D28D9`, neutral `#475569`

**Operate-mode semantic states:**
- `#34D399` pass / `#F87171` fail / `#FBBF24` warn / `#60A5FA` info

**AI accent (softer violet for tints / highlights):** `#C4B5FD`
**Neutral gray:** `#94A3B8`

**Confidence Lane (3px left edge on AI-generated cards):**
- High ≥ 0.85 → teal `#34D399`
- Medium 0.60–0.85 → amber `#FBBF24`
- Low < 0.60 → red `#F87171` (forces HITL review)

## FORBIDDEN

- ❌ **No Material Design 3 color tokens.** No `primary-container`, `on-primary`, `surface-tint`, `surface-container-*`, `on-tertiary`, `inverse-surface`. We have 4 surface values + 2 brand + semantic + AI + neutral. That's it.
- ❌ **No Tailwind config extension with MD3 palettes.** Hardcode hex values in inline styles or use `bg-[#0B0F17]` Tailwind arbitrary-value syntax.
- ❌ **No tertiary brand color.** No yellow, orange, coral, pink, olive.
- ❌ **No glassmorphism, backdrop-blur, neon gradients, decorative shadows.**
- ❌ **No landing-page hero sections inside product frames.** This is operational tooling.
- ❌ **No generic admin scaffolding for F26/F27/F28** — governance surfaces still use our shell.
- ❌ **No AI magic boxes** without agent label + confidence % + evidence link.
- ❌ **No dense-table-first home screens.** Cards first, tables below.
- ❌ **No lorem ipsum.** Use realistic Iksula data (see below).
- ❌ **No brand wobble.** Product name is "QA Nexus" — never "Evidence Mesh" (that's the design system name), never "Workbench".

## Typography — exactly 3 stacks (simplified from 4 after HTML review)

- **Inter Variable** — UI body, labels, tables
- **DM Sans** — display, page question headers, hero metrics (48px+)
- **JetBrains Mono** — metrics, KPIs, IDs, code, selectors (replaces both Geist Mono and JetBrains across our spec — simpler)

# Navigation contract — FROZEN across every working frame

## Top Command Bar (56 px tall, 8 slots, left → right)

| Slot | Element | Behavior |
|---|---|---|
| 1 | **QA Nexus logo** | Flask/beaker icon teal + wordmark DM Sans. Click = Home. |
| 2 | **Project switcher dropdown** | Pill: `[glyph] Iksula Commerce · main ▾`. Opens dropdown of accessible projects + `+ Create new project` (Lead/Admin only). **Selecting a project re-queries every panel.** |
| 3 | **Global search / command palette** | Max 520 px wide. Placeholder "Search cases, defects, runs, docs, agents…" + `⌘K` chip. |
| 4 | **Quick create (+)** | 36 × 36 icon. Dropdown: New Test Case / New Run / New Defect / New Document / New Project (Lead+). |
| 5 | **Notifications bell** | Unread dot. |
| 6 | **Theme toggle** | Dark / Light. |
| 7 | **Mode toggle** | Segmented `Operate` / `Review` / `Prove`. Prove tab visible only to Lead / Admin / Stakeholder. |
| 8 | **Avatar / profile** | 32 × 32. Dropdown menu. |

Background `#111827`, bottom border `1 px solid #2A3347`.

## Left Primary Rail (272 px expanded)

```
[QA Nexus logo top — 48px block]

Home                                ← role-aware

PLAN
  Requirements
  Test Plans & Cycles               (read-only, from Jira)
  Test Cases                        (count chip inline: "1,284")

AUTHOR
  Test Suites
  Knowledge Base
  Automation Studio                 ← disabled, tooltip "Coming in v1.5 (PM2)"
  Data & Mocks                      ← disabled, tooltip "Coming in v1.5 (PM2)"

RUN
  Runs & Sessions
  Environments

ANALYSE
  Run Results
  Defects / Failures
  Reports
  QA Value                          ← HIDDEN for QA Engineer

GOVERN                              ← ENTIRE SECTION HIDDEN for QA Engineer & Stakeholder
  Agents                            (Lead + Admin only; count chip)
  Integrations                      (Lead + Admin only)
  Users & Roles                     (Lead + Admin only)
  Settings & Audit                  (Lead + Admin only)

[hairline separator]
[pinned bottom]
  Support
  Account                           user avatar + name + role chip (Geist Mono)
```

**Active rail item:** 3 px left accent bar `#A78BFA` (violet), background `#232C3F`, text `#F1F5F9`.
**Hover:** `#1A2233`.
**Section labels:** Inter 10/600 UPPERCASE `#8A94A6` letter-spacing 0.08em.

## Role gating

| Item | QA Engineer | Lead | Admin | Stakeholder |
|---|:-:|:-:|:-:|:-:|
| QA Value | 🚫 hidden | ✅ | ✅ | ✅ |
| Agents | 🚫 hidden | ✅ | ✅ | 🚫 hidden |
| Integrations | 🚫 hidden | ✅ | ✅ | 🚫 hidden |
| Users & Roles | 🚫 hidden | ✅ | ✅ | 🚫 hidden |
| Settings & Audit | 🚫 hidden | ✅ | ✅ | 🚫 hidden |

# Canvas geometry

- Desktop canvas: **1600 × 1024**
- Modal: **1120 × 860** (F10, F12, F16a, F16b, F16c, F22)
- Inspection sheet: **420 × 1024** (right-docked)
- Main canvas outer padding: 32 px
- Grid: 12 cols, 24 px gutter
- Optional right evidence rail: 380 px (toggleable via ⌘J)

# Signature motifs — use consistently

| Motif | When to use |
|---|---|
| **Question Header** | Top of every main frame. Question in DM Sans 32/40, one-line answer Inter 16/24 below. The page-question is also the HTML `<title>`: `QA Nexus — What's in the library?` |
| **Outcome Board** | Row of 3–4 KPI cards on Home / Dashboard frames |
| **KPI card** | Label (uppercase) + big number (DM Sans 48/700) + delta pill (teal ▲ or red ▼) + inline sparkline (80×16) + formula footnote (Inter 11, neutral gray) — the footnote is mandatory for transparency |
| **Confidence Lane** | 3 px left edge on AI-generated items. Color = confidence bucket |
| **Evidence Thread** | Thin vertical connector linking agent actions → source chips → affected objects |
| **Worklist row** | 56 px dense rows for queues: checkbox + status shape + title + meta + sparkline + quick actions. Use on F08a queue, F08b approvals queue, F21 defects list |
| **Annotated trend chart** | Line chart with vertical release markers + cluster callouts + optional overlay line. Use on F23, F24 |
| **Autonomy ladder** | 3-segment control Monitor / Suggest / Act. Use on F26 agent detail |
| **Prove-Mode Cards** | Ivory canvas `#FAFAF8`, white cards `#FFFFFF`, darker semantic colors. Use on F24, F25, export surfaces |

# Realistic data anchors (use throughout every frame)

- **Active project:** Iksula Commerce (default in switcher)
- **Other projects in dropdown:** Iksula Payments · Iksula Mobile App
- **Current sprint:** Sprint 42 (2026-04-09 → 2026-04-23)
- **Release target:** R-2026-04-Sprint-42 (ship 2026-04-28)
- **Team:**
  - Yogesh M — QA Lead (the logged-in user on Lead frames)
  - Priya S — Senior QA (assigned to checkout tests)
  - Rahul K — QA Engineer
  - Arjun M — Senior QA / Automation
  - Neha D — QA Engineer
  - Rohan K — QA Engineer
- **Jira ticket IDs:** ACM-881 · PAY-1472 · AUTH-891 · CART-234 · CHK-512
- **Test case:** TC-PAY-0341 — "Apply two gift cards at checkout and split remainder across a saved card"
- **Defect:** PAY-1472 — "Checkout hangs on Stripe 3DS redirect in Firefox" (P1, App Bug, A4 87% confidence)

**ROI constants (from PRD v2.3):**
- Stage multipliers: `{requirements: 10, design: 20, build: 100, prod: 1000}`
- Blended QA rate: ₹8,000 / hr (≈ $96 / hr)
- Formula: `cost_avoidance = Σ (defects_caught × stage_multiplier)`

**AI Value metrics (F08b + F24):**
- Time saved: 184 h this sprint (▲ 23 h)
- Cost avoided: ₹14.2 L (≈ $17K)
- Defects caught early: 23 (21 pre-prod, 2 staging)
- ROI: 342% this quarter
- A1 accept rate 87% · A2 precision 78% · A4 helpfulness 84%
- Activity base: 2,341 A1 gens · 412 A2 flags · 89 A4 RCAs

**Provenance rule:** every number on dashboards has a formula footnote. Example:
> 184 h saved = Σ (621 A1 × 18 min baseline) + (412 A2 × 5 min review) + (89 A4 × 25 min triage). Calibration refreshed 2026-03-15.

# How to use the 9 reference HTMLs I've attached

These HTMLs are high-quality visual references. **Use them for layout patterns and micro-interactions, NOT for the color convention — the HTMLs use the OLD primary/secondary convention (violet primary, teal secondary). Our new convention is Primary=teal, Secondary=violet. Translate while you design:**

- Any CTA button that appears violet in the HTMLs → render teal `#2DD4BF` in your output
- Any AI chip / label that appears violet stays violet `#A78BFA`
- Any value / approval indicator that's teal stays teal
- Any teal button labeled "Save" / "Submit" / "Approve" stays teal

Mapping of HTMLs to PM1 frames:

| HTML | Reference for frame(s) |
|---|---|
| 01-home.html | F08a personal queue + F08b dashboard — **adopt worklist row pattern** |
| 02-test-cases.html | F17 Test Case Library — **three-panel layout confirmed** |
| 03-ai-generator.html | F16b A1 Generate — **4-phase stepper pattern** (Source → Clarify → Review → Accept) |
| 04-runs.html | F19 Run Console / F20 Run Results — evidence capture + cluster view |
| 05-reports.html | F23 Reports Studio + F24 QA Value — **KPI card pattern** + **annotated trend chart** |
| 06-agents.html | F26 Agents — **autonomy ladder** + scope pills + guardrail toggles |
| 08-failures.html | F21 Defects Hub cluster view |
| 09-integrations.html | F28 Settings & Audit — Integrations tab |

Do NOT reference `07-automation-studio.html` for PM1 frames — it's PM3 scope.

# What I want you to do

## Phase 1 — Confirm understanding

In your first response, do ONLY these things:

1. Echo the design language statement (see top of this prompt) verbatim
2. Confirm the 5 instantiation points in one sentence each
3. State: "I will use Primary = teal `#2DD4BF` for CTAs and Secondary = violet `#A78BFA` for AI only. I will translate the attached HTMLs' color convention to match."
4. State the 3 typography stacks (Inter, DM Sans, JetBrains Mono)
5. State the 8 top bar slots including project switcher dropdown in slot 2
6. State the rail structure (Home + PLAN / AUTHOR / RUN / ANALYSE / GOVERN) and which items are role-gated
7. Confirm: "I will NOT use Material Design 3 tokens, NOT extend Tailwind config, NOT use a tertiary brand color, NOT add orange/yellow/coral/pink."

Then wait. Do NOT generate any frame yet. I will paste the specific frame I want next.

## Phase 2 — Frame generation (triggered by me, one frame at a time)

When I paste a specific frame request like "Generate F08b Home Dashboard" or "Generate F17 Test Case Library":

1. Briefly echo: frame ID, canvas size (1600 × 1024 or modal 1120 × 860), role gate, primary user, page question, top 3 regions you'll include
2. Reference which attached reference HTML informs the visual pattern (if any)
3. Generate the frame as self-contained HTML with:
   - Inline Tailwind via arbitrary-value classes `bg-[#0B0F17]` — NOT extended config
   - Inline `<style>` for CSS custom properties at the root
   - Google Fonts import for Inter / DM Sans / JetBrains Mono only
   - Material Symbols Outlined (or equivalent) for glyphs
   - Proper `<title>` tag matching the page-question convention
   - Realistic Iksula data throughout
   - Confidence Lane on all AI-generated content
   - Formula footnote on every dashboard metric
4. After rendering, provide a short validation checklist:
   - Brand name "QA Nexus" confirmed
   - All 8 top bar slots present incl. project switcher dropdown
   - Left rail matches canonical structure with correct role gating
   - Colors match canonical palette (no MD3, no tertiary)
   - CTA buttons are teal, AI elements are violet
   - Realistic Iksula data (no lorem ipsum, no generic "Project Alpha")

## Phase 3 — Iteration

If I reply with "rewrite" — start fresh, do NOT patch the previous output.
If I reply with "adjust X" — minimal targeted change.
If I reply with a specific correction like "the Authenticate button should be teal not violet" — apply that single fix and re-render.

# Generation order when I ask for multiple frames

Follow this validation sequence:

1. **F06 Sign In** (already approved — baseline ✅) — do NOT regenerate unless I ask
2. **F08b Home Dashboard** — validates: top bar project switcher, rail lifecycle grouping, AI Value strip KPI cards, Lead/Admin role
3. **F17 Test Case Library** — validates: three-panel layout, Confidence Lane, AI-draft badges, suites tree + SMART auto-folders
4. **F22 Defect Detail** — validates: A4 5-Layer RCA accordion with confidence weights, Jira 2-way sync, A2 duplicate detection
5. **F24 QA Value Dashboard** — validates: KPI cards with formula footnotes, Prove mode ivory canvas, annotated trend chart

These 5 are the critical validation frames. If these look right, the remaining 18 frames should follow consistently.

# What will make me reject a frame

- Material Design 3 color tokens anywhere in the HTML
- Tailwind `tailwind.config.extend` block with custom palette
- Tertiary brand color (yellow/orange/coral/pink)
- Wrong brand name ("Evidence Mesh", "Workbench", or missing)
- Missing project switcher dropdown in top bar
- Left rail in a different order than canonical
- CTA button rendered violet (should be teal)
- AI chip rendered teal (should be violet)
- Lorem ipsum or "Acme Corp" placeholder data
- Generic SaaS dashboard aesthetic (we are operational tooling)
- Glassmorphism or decorative gradients

---

## ===== END CLAUDE DESIGN PROMPT =====

## After Claude Design responds to Phase 1

It should have echoed the design language statement, confirmed the 7 lock-ins, and be waiting for a frame request.

Paste this for the first frame (F08b — the most demanding):

```
Generate F08b Home Dashboard — Lead / Admin / Stakeholder view.

Canvas 1600 × 1024. Full shell (rail + top bar + main canvas + optional right evidence rail).

This is the "how AI is helping the team" Dashboard — the single most important frame for leadership.

Reference: 01-home.html for worklist row pattern, 05-reports.html for KPI card pattern + annotated trend chart.

Page question: "How is the team doing, and what needs approval?"

Page <title>: "QA Nexus — How is the team doing?"

Primary regions top-to-bottom:

1. Top command bar (56px — full 8 slots per contract)
2. Left rail (272px — canonical lifecycle grouping; user is Yogesh M, QA Lead, so Govern section visible)
3. Question Header (64px tall main canvas top): "How is the team doing, and what needs approval?" DM Sans 32/40, one-line answer "Sprint 42 Day 9 of 14 · 12 approvals pending · 2 A4 findings worth triaging" Inter 16/24
4. AI Value Strip (full-width row, 4 KPI cards at 340px each, 24px gap):
   - TIME SAVED: 184 h / ▲ 23 h vs last sprint / sparkline / formula footnote
   - COST AVOIDED: ₹14.2 L / ▲ 8% / sparkline / formula
   - DEFECTS CAUGHT EARLY: 23 / ▲ 5 vs previous / sparkline / formula
   - ROI THIS QUARTER: 342% / (calculated over 90 days) / sparkline / formula
   Each card as spec'd: big number DM Sans 48/700 color #F1F5F9, delta pill teal/red, sparkline teal #2DD4BF, formula footnote Inter 11/400 color #94A3B8. Every metric has a formula footnote. Every card opens a drill-down on click (chevron on hover).
5. Secondary Outcome Board (4 compact cards, 220px each, 16px gap):
   - Team pass rate: 87% (sparkline 7 days)
   - Defect trend: 47 open ▼ 4
   - Release risk: Amber (3 P1s)
   - Approvals pending me: 3 with next deadline
6. Per-project Cockpit tiles (horizontal row, 320px each, project-card pattern):
   - Iksula Commerce — Sprint 42 — pass 91%, open 6 — status GREEN
   - Iksula Payments — Sprint 42 — pass 82%, open 3 — status AMBER
   - Iksula Mobile App — Sprint 41 — pass 88%, open 5 — status GREEN
7. Approvals Queue (worklist row pattern per 01-home.html reference):
   - Tabs: All approvals (12) / Strategies (4) / Reports (3) / RTM changes (4) / Team defect triage (1)
   - Rows showing: Confidence Lane on AI-drafted items (violet), status shape, title ("Priya S requested approval on Test Strategy for CHK-512"), sub-line (submitter + timestamp + source), quick actions (Approve teal / Request changes / Reject red / Pin / ···)
   - Bulk approve via header checkbox
8. Right Evidence Rail (380px, collapsible):
   - Recent team agent activity (A4 RCA'd PAY-1472, A1 drafted 8 cases, A2 flagged 3 dupes) — Evidence Thread linking to source chips
   - Suggested next action (teal card): "Review A4's RCA on PAY-1472 first — blocking release regression"
   - Pinned knowledge: "Checkout 3DS runbook" + "Sprint 42 exit criteria"

Use Iksula Commerce / Sprint 42 / Yogesh M data throughout. Every AI chip (A1, A2, A4) is violet #A78BFA. Every CTA (Approve / Review / Open QA Value Dashboard) is teal #2DD4BF.

After rendering, validate against the checklist.
```

## For subsequent frames

Use the same pattern: reference the attached HTML if applicable, request specific regions, remind the color convention.

---

## Expected outcomes

With all context files attached + this prompt pasted:

- Claude Design should produce **visually consistent, brand-compliant, role-gated frames** that match the reference HTMLs in quality but with the correct new primary/secondary convention
- Each frame should be **1600 × 1024 production-ready HTML** with inline styles, usable directly as a Figma import or as a standalone preview
- Typography, color, spacing, and motifs should be **identical across all 23 frames** (eliminates the drift Stitch produced in v1)
- Output should include **formula footnotes on every metric, Confidence Lane on every AI output, role-appropriate rail rendering**

If Claude Design drifts (rare — it's better than Stitch at this):
- "Make CTA buttons teal, not violet. Primary=teal #2DD4BF, Secondary=violet #A78BFA (AI only)."
- "Use our canonical surface colors: #0B0F17 canvas, #111827 base, #1A2233 raised, #232C3F overlay. No Material Design 3 tokens."
- "Brand name is QA Nexus. Remove any 'Evidence Mesh' or 'Workbench' reference — Evidence Mesh is the design-system name, not the product name."
