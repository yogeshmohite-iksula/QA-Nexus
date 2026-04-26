# 05 — Analyse & Govern

**Part of PM1_UI_v2. Paste 01_SYSTEM.md first.**

---

## §1. Pinned Reminder (Design System Contract)

**Product:** QA Nexus (PM1 / MVP)  
**Design system:** Quiet Intelligence / Evidence Mesh, v2.0  
**Current date:** 2026-04-23

**Canonical palette (EXACT — no deviation):**
- Primary teal: `#2DD4BF` (value, approval, ROI)
- Secondary violet: `#A78BFA` (AI-only, agent labels, confidence lane)
- Canvas operate: `#0B0F17` (main), `#111827` (base), `#1A2233` (raised), `#232C3F` (overlay)
- Canvas prove (F24, F25 only): `#FAFAF8` (ivory), `#FFFFFF` (cards)
- Text on dark: `#F1F5F9` (primary), `#C7D0DC` (secondary), `#8A94A6` (tertiary)
- Text on light: `#0F172A` (primary), `#475569` (secondary)
- Semantic: `#34D399` (pass green), `#F87171` (fail red), `#FBBF24` (warn amber), `#60A5FA` (info blue)

**Forbidden (rewrite if present):**
- NO Material Design 3 tokens (`primary-container`, `surface-variant`, `inverse-surface`, etc.)
- NO tertiary brand color
- NO orange, coral, pink, magenta
- NO Tailwind `config.extend` with MD3 palette
- NO glassmorphism, neon gradients, backdrop-filter blur
- NO generic admin scaffolding or landing-page hero sections

**Navigation contract (same on all working frames):**
- Top bar: 8 slots (logo, project switcher dropdown, search, +, bell, theme, mode toggle, avatar)
- Left rail: Home + PLAN (Requirements, Test Plans, Test Cases) + AUTHOR (Suites, KB, disabled) + RUN (Runs, Environments) + ANALYSE (Results, Defects, Reports, QA Value–Lead+) + GOVERN (Agents, Integrations, Users & Roles, Settings & Audit–Lead/Admin) + Support / Account
- Role gating: QA Engineer hidden from GOVERN + QA Value. Stakeholder hidden from GOVERN + Agents.

**All 5 frames in this file (F23–F28) role-gated to Lead+/Admin/Stakeholder.** QA Engineer does not see these frames.

**Anti-drift line (PASTE INTO EVERY STITCH PROMPT):**  
*"Apply 01_SYSTEM.md navigation contract and design tokens VERBATIM. Do not use Material Design 3 tokens. Do not extend Tailwind config. Hardcode hex values. Primary=#2DD4BF teal, Secondary=#A78BFA violet, no tertiary. Canvas operate #0B0F17, prove (F24/F25 only) #FAFAF8 ivory. All 5 frames this file: Lead+/Admin/Stakeholder role-gated only."*

**F24 + F25 Prove mode reminder (if applicable):**  
*"This frame renders in PROVE MODE: canvas #FAFAF8 ivory, cards #FFFFFF white, primary text #0F172A, secondary #475569, Geist Mono hero numbers at 48px size. This is a light-theme frame for boardroom export — NOT dark."*

---

## §2. F23 — Reports Studio

### Front Matter

| Attribute | Value |
|-----------|-------|
| **Frame ID** | F23 |
| **Title** | Reports Studio |
| **Phase** | PM1 |
| **Shell** | Full rail (272 px) + top bar (56 px) + main canvas (scrollable) + evidence rail (380 px) |
| **Canvas size** | 1600 × 1024 (desktop primary) |
| **Role gate** | Lead, Admin, Stakeholder (QA Engineer sees Daily Status only) |
| **Primary question** | "Which report do I need, and is it leadership-ready?" |
| **Entry point** | Rail: ANALYSE > Reports |
| **Exit point** | Send for approval → F08b lead queue; Export PDF → browser download (Prove mode); Schedule recurring → F28 settings |

### Purpose

F23 is the templated report generation hub. QA Engineers and Leads generate project status, defect trends, and release readiness reports from auto-populated project data. The frame answers "Which report template do I need, and is it boardroom-ready?" Emphasis is on speed (auto-fill 80% of content), evidence trails (version history, data provenance), and approval workflow (route to stakeholders, track approval state).

### Structure

**1. Question Header (64 px tall, 32 px top padding)**
- **Question (DM Sans 32/40):** "Which report do you need, and is it leadership-ready?"
- **Answer (Inter 16/24, secondary):** "Auto-filled from project data. Choose a template, review, and send for approval."
- **Background:** `#111827`

**2. Template Gallery Row (480 px tall)**  
Horizontal scrollable row of 4 cards (240 × 200 px each). Each shows: template name, last-used date, "2 min auto-fill" estimate, preview thumbnail, "Use this template" CTA (teal button). For QA Engineer: only Daily Status visible.

**Template list:**
1. **Daily Status** — 1 page, exec summary (auto-fill) + today's test runs + defects filed + blockers
2. **Weekly Status** — 2 pages, week-over-week metrics + test coverage + defect trend + team velocity + risks
3. **Sprint Sign-off** — 3 pages, sprint recap + final metrics + 5 readiness gates (checklists) + approval chain
4. **Release Readiness** — 4 pages, release scope + coverage % + P0/P1 open + defect density + RCA sample + go/no-go

**3. Scheduled Reports Section (240 px tall)**  
Title: "SCHEDULED & RECURRING" (Inter 13/500 uppercase). List active recurring reports (rows 60 px): name + cron hint (Geist Mono) + recipients + last sent + status pill (semantic green "Delivered"). Actions: Edit, Pause, Delete (icon buttons).

**4. Draft Reports Section (240 px tall)**  
Title: "DRAFT & IN REVIEW". List in-progress drafts: name + date + status pill (Draft amber / In Review blue / Approved green / Sent teal) + last modified + author + approval progress if in review. Actions: Edit, View, Send for approval, Download.

**5. Trend Chart — Annotated Pattern**

*Chart dimensions:* 400 × 200 px inside a card. Line chart with 12-week span (Apr 1 → Jun 15).

*Axes:*
- X-axis: weeks or dates (Inter 11, `#8A94A6`, tick marks `#2A3347`)
- Y-axis: metric (hours saved, defects caught, pass rate %) (Inter 11, `#8A94A6`)

*Line styling:*
- Primary metric line: teal `#2DD4BF` 2 px stroke, no fill
- Data points: 4 px teal dots visible on hover
- Optional secondary metric: violet `#A78BFA` dashed line (e.g., defects caught while showing hours saved)

*Release markers (vertical annotations):*
- When a release shipped, draw a vertical dashed line `rgba(248,113,113,0.3)` 1px spanning full chart height at that X coordinate
- Annotation label above the line: "v1.4 ships" (Inter 10, fail-tinted background `#F87171` with 10% opacity, padding 2×6)
- Example: if release R-2026-04 shipped Apr 28, vertical line at that date with label "R-2026-04"

*Cluster callouts (horizontal annotations for events):*
- When a cluster of events happens (e.g., defect spike, team reallocation), draw a small circle + leader line pointing to the data point
- Annotation text box positioned off-chart: "3 PAY defects cluster — 2026-03-15" (Inter 11 in `#1A2233` box with 1px border `#2A3347`, padding 8×12)
- Useful for explaining anomalies in the trend

*Overlay line toggle (top-right corner):*
- Optional secondary metric (e.g., defects caught while showing hours saved as primary)
- Segmented control: "Show overlay: [Defects caught ▾]" (dropdown, label Inter 11, secondary)
- When toggled on, violet dashed line appears on chart

*Hover state:*
- Tooltip shows week, primary value, secondary value (if overlay active), deltas vs prior week

**5. Main Canvas — Report Preview (when template selected)**

*Left panel (70% width, scrollable):*
- Executive Summary (editable textarea, 100 px) + "Regenerate with A1" button (violet)
- Key Metrics (card row, 3 cards: coverage %, defect density, pass rate)
- Risks (card: P0 count, flaky rate, unresolved regressions)
- Test Coverage (table: Project, Cases, Automated, Manual, Coverage %)
- Defect Trend (bar chart, week-over-week, color-coded by severity)
- Recommendations (A4-generated narrative, editable) + "Regenerate with A4" button (violet)
- Appendix (collapsible: full execution log, failed test details, environment snapshot)

*Right panel — Evidence Rail (380 px):*
- Report metadata (status pill, last modified, created date/actor)
- Version History (collapsible, 200 px, last 3 versions with timestamps + "Restore" / "Diff" links)
- Export Options (buttons: PDF Prove mode, DOCX, Confluence, Slack)
- Approval Chain (avatar + name + status for each approver; "+ Add approver" link)

### AI Provenance Rules

Every regenerated section (A1 / A4 only):
- **Agent label (violet chip):** "A1" or "A4"
- **Confidence score:** "Confidence: 0.87"
- **Evidence drill (link):** "Show input data →" reveals project data used
- **Input context:** "Generated from 487 test executions, 4 Jira defects, ..."
- **Human action path:** accept (checkmark) / edit (pencil) / regenerate (refresh)

**Section-specific rules:**
- **Executive Summary (A1):** Auto-filled from test run summary + defect log. Confidence ≥0.85 typically. If <0.80, show Clarification Questions modal before save.
- **Recommendations (A4):** Generated from defect RCA + flaky test list + coverage analysis. Confidence 0.70–0.90. Always editable; user can override.

### Realistic Data (Iksula Commerce, Sprint 42)

**Template:** Weekly Status (Apr 16–22)

**Auto-filled content:**
- Test runs: 487 cases (Payment API 87, Dashboard 156, Admin Portal 89)
- Pass rate: 86% (421 passed, 31 failed, 35 flaky)
- Defects filed: 4 (1 P0 env, 2 P1 app, 1 P2 test)
- Coverage trend: 74% (↑ 2% from prior week)

**Executive Summary (A1-generated):**  
"This week, the team ran 487 test cases across 3 projects, passed 421 (86%), failed 31, flaky 35. 4 P0 defects filed and resolved same-day. Release readiness for R-2026-04-PaymentV2 is on track for Apr 28 ship date."

**Scheduled reports (active):**
- Weekly Status — Every Friday 5pm — leads@iksula.com (3 recipients) — Last sent Apr 19, Delivered
- Sprint Sign-off — Every other Sunday 6pm — cto@iksula.com — Last sent Apr 19, Delivered

**Draft reports (in review):**
- Release Readiness — R-2026-04-PaymentV2 — Modified Apr 21 by Sarah Chen — Status: In Review (Sarah ✓, Michael ⏳, CTO ⏳)

### Stitch Prompt

Create frame F23 — Reports Studio for QA Nexus PM1. Template-driven report generation hub answering "Which report do I need, and is it leadership-ready?"

**Layout:** 1600 × 1024 desktop. Full left rail (272 px), top bar (56 px), main canvas + right evidence rail (380 px).

**Structure:**
1. Question header: "Which report do you need, and is it leadership-ready?" (DM Sans 32/40) + answer (Inter 16/24).
2. Template gallery: 4 horizontal cards (Daily Status, Weekly Status, Sprint Sign-off, Release Readiness). Each 240 × 200 px, shows name, last-used, "2 min auto-fill", preview thumbnail, "Use this template" CTA. QA Engineer sees Daily Status only.
3. Scheduled reports: "SCHEDULED & RECURRING" section, 240 px, list active recurring reports (rows 60 px): name + cron (Geist Mono) + recipients + last sent + status pill (green "Delivered"). Actions: Edit, Pause, Delete.
4. Draft reports: "DRAFT & IN REVIEW", same layout, status pills (amber/blue/green/teal), approval progress if in review.
5. Main canvas (when selected): Left 70% shows full report WYSIWYG with 7 sections (Executive Summary textarea editable + A1 button, Key Metrics 3-card row, Risks card, Test Coverage table, Defect Trend bar chart, Recommendations A4 narrative + button, Appendix collapsible). Right 30% evidence rail: metadata (status, dates), version history (collapsible, last 3 + Restore links), export options (PDF/DOCX/Confluence/Slack buttons), approval chain (avatars + names + status).

**Interactions:**
- Click template → report preview loads (2–3 sec skeleton)
- Edit section → pencil icon → textarea expands with focus
- Click "Regenerate with A1/A4" → loading spinner (2–5 sec) → new content appears, accept/edit/regenerate
- Click "Send for approval" → modal: multi-select approvers (avatars), optional message, "Send" → report moves to "In Review", approval chain appears
- Download PDF → generates Prove mode (ivory canvas #FAFAF8, white cards, larger metrics), browser download

**Colors:** Canvas base #111827, raised #1A2233, overlay #232C3F. Text primary #F1F5F9, secondary #C7D0DC, tertiary #8A94A6. Accent teal #2DD4BF (CTAs), violet #A78BFA (AI). Semantic green #34D399 (pass/approved).

**Typography:** Question DM Sans 32/40. Card title Inter 14/20 500. Labels Inter 12–16. Metrics/cron Geist Mono. AI agent label Inter 12, violet.

**Realistic data:** Iksula Commerce, Sprint 42. Weekly Status (Apr 16–22), 487 cases, 86% pass, 4 defects filed. A1 summary. A4 recommendation on flaky stabilization. Scheduled: Weekly Status every Friday 5pm (delivered). In review: Release Readiness (Sarah ✓, Michael ⏳, CTO ⏳).

**Role gating:** QA Engineer: Daily Status only, no scheduling, no approval queue. Lead/Admin: all 4 templates, can schedule, can approve. Stakeholder: read-only.

**Anti-drift line:**  
Apply 01_SYSTEM.md navigation contract and design tokens VERBATIM. Do not use Material Design 3 tokens. Hardcode hex values. Primary=#2DD4BF teal, Secondary=#A78BFA violet, Canvas=#111827, Raised=#1A2233, Overlay=#232C3F. Role gating per §4.3 (QA Engineer Daily Status only).

**Trend chart anti-drift addendum:**  
Trend charts use annotated line pattern: dashed vertical release markers (red-tinted `rgba(248,113,113,0.3)`), circle+leader-line cluster callouts, optional violet dashed overlay for secondary metric. Teal line for primary metric. Never use MD3 chart library defaults — hardcode SVG with our palette.

**Target line count:** 380–420 lines

---

## §3. F24 — QA Value Dashboard (AI Benefit Analytics) ⭐

### Front Matter

| Attribute | Value |
|-----------|-------|
| **Frame ID** | F24 |
| **Title** | QA Value Dashboard — AI Benefit Analytics |
| **Phase** | PM1 |
| **Shell** | Full rail (272 px) + top bar (56 px) + main canvas (scrollable). No evidence rail; mode toggle prominent in top bar. |
| **Canvas size** | 1600 × 1024 (desktop primary) |
| **Role gate** | Lead, Admin, Stakeholder only (HIDDEN from QA Engineer) |
| **Primary question** | "How is AI actually helping the QA team, and how much time and money is it saving?" |
| **Entry point** | Rail: ANALYSE > QA Value (visible only to Lead+) |
| **Exit point** | Export PDF (Prove mode) → board deck; Export CSV → analytics tool; Schedule weekly send → F28 settings |

### Purpose

**F24 is the single most critical frame for proving AI investment to leadership.** It answers "How is AI actually helping the QA team?" with transparent, honest metrics and provenance. Every number has a calculation source. The dashboard expands the "AI Value Strip" from F08b home into a full analytics suite covering time saved, cost avoided, defects caught early, ROI, per-agent acceptance rates, and trend analysis. Two modes: Review (dark, operational) and Prove (ivory, boardroom-ready for export). This is where QA leads justify AI budget to CFOs and CTOs.

### Role Gating

| Role | Visibility | Can export | Can schedule |
|------|-----------|-----------|--------------|
| **QA Engineer** | 🚫 Hidden entirely | N/A | N/A |
| **Lead** | ✅ Visible; full read/write | Yes | Yes |
| **Admin** | ✅ Visible; full read/write | Yes | Yes |
| **Stakeholder** | ✅ Visible; read-only | Yes (PDF only) | No |

**Visibility rule:** QA Engineer does not see the "QA Value" rail item; it is not rendered at all for their role per NAVIGATION_CONTRACT.md §2.

### Structure

**1. Question Header + Controls (88 px tall, 24 px bottom padding)**

*Top row (56 px):*
- **Question (DM Sans 32/40, left-aligned):** "How is AI actually helping the QA team, and how much time and money is it saving?"
- **Subtext (Inter 16/24, secondary):** "AI-powered metrics from the last 30 days. All calculations include data provenance."

*Control row (right-aligned, 56 px):*
- **Time-range picker (segmented):** Sprint / Quarter / YTD / Custom range. Default: Sprint 42 (Apr 9 – Apr 23). Click "Custom" opens date picker modal (ISO 8601).
- **Prove mode toggle (segmented, right edge):** "Review" (dark, default) / "Prove" (light, ivory canvas). Clicking "Prove" transitions entire page to #FAFAF8 canvas + white cards + larger display metrics (Geist Mono 48/56 instead of 28/32) + 24 px padding instead of 16 px.

**Background:** `#111827`

**2. Hero Metrics Row (320 px tall, 4 KPI cards side-by-side)**

**KPI Card Pattern (per reference 05-reports.html):**

Each card follows the KPI card spec:
- **Container:** `#111827` base surface, 1px border `#2A3347`, radius 8, padding 24, min-width 220, height auto
- **Top row:** Label (Inter 12/600 uppercase letter-spacing 0.05em color `#8A94A6`) + optional info icon (hover: tooltip with expanded formula explanation)
- **Hero number:** DM Sans 48/700 color `#F1F5F9`, letter-spacing -0.02em — e.g. "184 h", "₹14.2 L", "342%"
- **Delta pill below:** "▲ 23 h vs last sprint" in teal pass `#34D399` for positive, "▼" in fail `#F87171` for negative, "—" neutral for flat. Pill has subtle background tint (10% opacity), radius 9999 full, Inter 12/500, 4 × 10 padding.
- **Inline sparkline (80 × 16):** 7-period trend. Stroke teal `#2DD4BF` 1.5px if positive, fail if negative. No fill.
- **Formula footnote (mandatory — honest-posture rule):** Inter 11/400 color `#94A3B8` (neutral gray), at bottom of card. Concise formula + data source + calibration date.
- **Hover state:** border `#3B4660` + cursor pointer + chevron appears right. Click opens drill-down modal with full breakdown.

**Prove mode override:** White cards (#FFFFFF), larger metrics (DM Sans 48/56), increased padding (24 px), teal borders.

**Card dimensions (standard):** 280 × 280 px each. **Prove mode:** 300 × 300 px for breathing room.

#### Card 1: Time Saved

**Hero metric (DM Sans 48/700, teal #2DD4BF):** 184 h

**Label (Inter 12/600 uppercase tracking):** "TIME SAVED"

**Delta pill:** "▲ 23 h vs last sprint" (pass teal #34D399, Inter 12/500, radius 9999, padding 4×10)

**Inline sparkline (80 × 16):** 7-week trend line (teal #2DD4BF 1.5px stroke)

**Formula footnote (Inter 11/400, color #94A3B8, bottom of card):**
"= Σ (621 cases × 18 min baseline) − (539 auto-approved × 0 review) − (68 edited × 40% review) − (14 rejected × 0 credit). = 187h calibrated to 184h. Calibration 2026-03-15."

**Hover state:** Border shifts to #3B4660, chevron → appears right, click opens modal with full A1 generation audit (accept/edit/reject breakdown, confidence distribution, source breakdown)

#### Card 2: Cost Avoided

**Hero metric (DM Sans 48/700, teal):** ₹14.2 L

**Label (Inter 12/600 uppercase tracking):** "COST AVOIDED"

**Delta pill:** "▲ ₹1.8 L vs last sprint" (pass teal, Inter 12/500, radius 9999, padding 4×10)

**Inline sparkline (80 × 16):** 7-week trend line (teal 1.5px stroke)

**Formula footnote (Inter 11/400, color #94A3B8, bottom of card):**
"= Σ (23 defects early × avg stage multiplier 50×) × ₹8K/hr blended rate. 21 pre-prod (×45) + 2 staging (×200) = (21×45 + 2×200) × ₹8K = ₹107.6L theoretical; ₹14.2L conservative (pilot scale factor). Calibration 2026-03-15."

**Hover state:** Border shifts to #3B4660, chevron → appears right, click opens modal with defect stage distribution (requirements / design / build / staging) and cost model breakdown

#### Card 3: Defects Caught Early

**Hero metric (DM Sans 48/700, teal):** 23

**Label (Inter 12/600 uppercase tracking):** "DEFECTS CAUGHT EARLY"

**Delta pill:** "▲ 5 vs last sprint" (pass teal, Inter 12/500, radius 9999, padding 4×10)

**Inline sparkline (80 × 16):** 7-week trend line (teal 1.5px stroke)

**Formula footnote (Inter 11/400, color #94A3B8, bottom of card):**
"= Σ defects classified 'early' by A4 5-layer RCA. Early = caught before production. 21 pre-prod (feature branch / build lab) + 2 staging (full integration). A4 delivered 89 RCAs; 23 early-stage. Calibration 2026-03-15."

**Hover state:** Border shifts to #3B4660, chevron → appears right, click opens modal with RCA stage classification breakdown (app bug / flaky / env / test bug)

#### Card 4: ROI This Quarter

**Hero metric (DM Sans 48/700, teal):** 342%

**Label (Inter 12/600 uppercase tracking):** "ROI THIS QUARTER"

**Delta pill:** "▲ 87 pp vs Q1" (pass teal, Inter 12/500, radius 9999, padding 4×10)

**Inline sparkline (80 × 16):** 7-week trend line (teal 1.5px stroke)

**Formula footnote (Inter 11/400, color #94A3B8, bottom of card):**
"= (Time saved 184h × ₹8K blended rate) ÷ AI infrastructure cost ₹4.32L. = (184 × 8K) / 432K = ₹1.472M / ₹432K = 3.41 = 341%. Conservative estimate; excludes indirect benefits (faster TTM, reduced hiring). Calibration 2026-03-15."

**Hover state:** Border shifts to #3B4660, chevron → appears right, click opens modal with detailed ROI breakdown (cost components, sensitivity analysis, quarterly trend)

**3. Per-Agent Breakdown Row (420 px tall, 3 cards side-by-side)**

**Card dimensions:** 340 × 380 px each. Background `#1A2233` or `#FFFFFF` (Prove). Border 1 px subtle. Radius 8 px.

#### Card 3.1: A1 Test Case Generator

**Header (Inter 14/20 500):** "A1 Test Case Generator"

**Key metrics (top, 60 px):**
- **Accept rate:** 87% (bar graph, 10 segments, teal filled)
- **Avg confidence:** 0.91 (Geist Mono 16/20, secondary)

**Metrics grid (100 px, 2 columns):**
| Metric | Value |
|--------|-------|
| Cases generated | 621 |
| Manual equivalent | 187 hours saved |
| Accept rate | 87% (539 auto-approved) |
| Edit rate | 11% (68 edited) |
| Reject rate | 2% (14 rejected) |

**Top source breakdown (Inter 13/18, secondary, 80 px):**
- Jira tickets: 58% (360 cases)
- Requirement docs: 24% (149 cases)
- Figma designs: 12% (75 cases)
- Knowledge Base: 6% (37 cases)

**Trend sparkline (40 px tall, 200 px wide):** Week-over-week case generation (7 bars), teal.

**Drill link (Inter 12/500, violet):** "Show A1 audit →"

**Provenance footer (Inter 11/16, tertiary, bordered box):**
- "**A1 metrics computed from:** 621 generations, 539 auto-accepted (confidence ≥80%), 68 edited, 14 rejected. Baseline hand-authoring time: 18 min/case. Auto-approved save 100% review time; edited save ~40% (6.5 min); rejected save 0%."
- "**Data source:** A1 generation audit log, 2026-04-01 to 2026-04-23. Confidence calibration from pilot M3 evaluation."

#### Card 3.2: A2 Duplicate Detection

**Header (Inter 14/20 500):** "A2 Duplicate Detection"

**Key metrics (top, 60 px):**
- **Precision:** 78% (bar, teal)
- **Recall:** 71% (bar, teal)

**Metrics grid (100 px, 2 columns):**
| Metric | Value |
|--------|-------|
| Duplicates caught | 412 |
| Manual review saved | 37 hours |
| False-positive rate | 22% (91 of 412) |
| Avg confidence | 0.76 |

**Detection distribution (Inter 13/18, secondary, 80 px):**
- Test case duplicates: 287 (70%)
- Defect duplicates: 98 (24%)
- Requirement duplicates: 27 (6%)

**Trend sparkline (40 px tall, 200 px wide):** Week-over-week duplicate detection, teal.

**Drill link (Inter 12/500, violet):** "Show A2 audit →"

**Provenance footer (Inter 11/16, tertiary, bordered box):**
- "**A2 metrics computed from:** 412 duplicate flags, 78% precision (78% were true duplicates), 71% recall. False-positive 22% means 22% flagged items were not true duplicates. Manual review time: 5.5 min per duplicate."
- "**Methodology:** Vector embedding + semantic similarity (pgvector, cosine >0.82). Calibrated to minimize false positives while maintaining recall >70%."
- "**Data source:** A2 flag audit log, 2026-04-01 to 2026-04-23."

#### Card 3.3: A4 Defect Intelligence & 5-Layer RCA

**Header (Inter 14/20 500):** "A4 Defect Intelligence & 5-Layer RCA"

**Key metrics (top, 60 px):**
- **Helpfulness (Lead-rated):** 84% (bar, teal)
- **Classification accuracy:** 78% (bar, teal)

**Metrics grid (100 px, 2 columns):**
| Metric | Value |
|--------|-------|
| RCAs delivered | 89 |
| Avg confidence | 0.71 |
| Correct classification | 78% (69 of 89) |

**Classification distribution (Inter 13/18, secondary, 80 px):**
- App bug: 54% (48 RCAs)
- Flaky test: 21% (19 RCAs)
- Environment: 15% (13 RCAs)
- Test bug: 10% (9 RCAs)

**Trend sparkline (40 px tall, 200 px wide):** Week-over-week RCA delivery, teal.

**Drill link (Inter 12/500, violet):** "Show A4 audit →"

**Provenance footer (Inter 11/16, tertiary, bordered box):**
- "**A4 metrics computed from:** 89 RCAs delivered, 78% classification accuracy (verified against manual Lead review), 84% helpfulness rating (Likert 1–5, scored 4–5 = helpful). Confidence from 5-layer pipeline: stack (90%), env (80%), config (60%), code (50%), data (40%)."
- "**Helpfulness rating:** Lead/QA Engineer rates each RCA post-resolution (Likert 1–5). Scores 4–5 counted as 'helpful' = 84% (75 of 89). Sample n=89."
- "**Data source:** A4 RCA audit log, helpfulness feedback, 2026-04-01 to 2026-04-23."

**4. Trend Chart — Annotated Pattern (320 px tall, full width below agent cards)**

**Title (Inter 14/20 500):** "Weekly Time Saved & Defects Caught (Last 12 Weeks)"

**Chart dimensions:** 400 × 200 px inside a card

**Chart type:** Stacked bar chart (12 weeks, Apr 1 → Apr 23) + overlay line (defects caught early).

**Axes:**
- **Y-axis (left):** Hours saved (0 → 250h) — Inter 11, `#8A94A6`, tick marks `#2A3347`
- **Y-axis (right):** Defects caught (0 → 30) — Inter 11, `#8A94A6`, tick marks `#2A3347`
- **X-axis:** Week start dates (Apr 1, Apr 8, Apr 15, Apr 22) — Inter 11, `#8A94A6`

**Bars (stacked, 3 segments per week):**
- **A1 time saved (teal #2DD4BF):** hours from case generation
- **A2 time saved (lighter teal, 60% opacity):** hours from duplicate detection
- **A4 time saved (darker teal, 80% opacity):** hours from RCA vs manual investigation

**Overlay line (defects caught early):**
- Violet `#A78BFA` dashed line, 2 px stroke
- Connects weekly defect counts (scale on right Y-axis)

**Release markers (vertical dashed lines):**
- Red-tinted vertical line `rgba(248,113,113,0.3)` 1px at each release date (e.g., R-2026-04 shipped Apr 28)
- Annotation label above: "R-2026-04" (Inter 10, fail background `#F87171` 10% opacity, padding 2×6)

**Cluster callouts (if anomalies present):**
- Small circle + leader line pointing to event (e.g., team reallocation, tool change)
- Text box off-chart: "Team rotation week" (Inter 11, `#1A2233` box, 1px border, padding 8×12)

**Legend (below chart, 16 px gap):** "A1 Time Saved" (teal square), "A2 Time Saved" (lighter), "A4 Time Saved" (darker), "Defects Caught Early" (violet dashed line).

**Toggle (top right):** "Stacked by agent" (default, shows 3 segments) / "Total only" (collapses to single bar).

**Hover state:** 
- Tooltip shows week, all 3 A-agent hours (stacked), defects count (right axis), deltas vs prior week
- Data point dots (4 px teal) visible on main line on hover

**5. Per-Project Table (280 px tall, scrollable)**

**Title (Inter 14/20 500):** "AI Impact by Project"

**Table (scrollable horizontally, 8 columns):**

| Project | A1 Accept Rate | A2 Dedup Flags | A4 RCAs | Time Saved | Cost Avoided | Defects Early | ROI |
|---------|---|---|---|---|---|---|---|
| **Payment API** | 89% | 147 | 34 | 68 h | ₹54.4L | 12 | 387% |
| **Dashboard** | 85% | 201 | 38 | 76 h | ₹60.8L | 8 | 356% |
| **Admin Portal** | 86% | 64 | 17 | 40 h | ₹32L | 3 | 289% |

**Column definitions (Geist Mono 13 or Inter 12):**
- Project: bold Inter 14/500
- A1 Accept Rate: percentage
- A2 Dedup Flags: count
- A4 RCAs: count
- Time Saved: hours (teal accent)
- Cost Avoided: ₹ amount (teal accent)
- Defects Early: count
- ROI: percentage (teal accent)

**Row interaction:** Click row → project detail modal (metrics by sprint/milestone).

**Sort:** Click header → sort ascending/descending. Default: ROI descending.

**6. Per-Team Breakdown (if multiple teams, 200 px tall, optional)**

**Title (Inter 14/20 500):** "AI Impact by Team" (visible only if >1 team in workspace)

**Table (same 8 columns, but rows = teams):**

| Team | A1 Accept Rate | A2 Dedup Flags | A4 RCAs | Time Saved | Cost Avoided | Defects Early | ROI |
|------|---|---|---|---|---|---|---|
| **Platform QA** | 88% | 289 | 61 | 142 h | ₹113.6L | 17 | 374% |
| **Product QA** | 84% | 123 | 28 | 58 h | ₹46.4L | 6 | 318% |

**Row interaction:** Click row → team detail modal (members, individual metrics).

**7. Data Provenance Footer (88 px, full width, background #232C3F, padding 24 px)**

**Title (Inter 13/500, uppercase, secondary):** "DATA METHODOLOGY & PROVENANCE"

**Three-column layout:**

**Column 1 — Data Sources (Inter 12/16, secondary):**
- "A1 generation audit log (621 records)"
- "A2 embedding flag audit log (412 records)"
- "A4 RCA audit log (89 records)"
- "Defect resolution log (23 records early-stage)"
- "LLM API billing (infrastructure costs)"
- "Manual Lead feedback survey (89 responses)"

**Column 2 — Calibration & Caveats (Inter 12/16, secondary):**
- "Baseline hand-authoring time: 18 min/case from PRD PM1-P1 AC8"
- "Blended QA rate: ₹8K/hr per PRD v2.3 (salary + overhead)"
- "Stage multipliers: requirements 10×, design 20×, build 100×, production 1000×"
- "ROI assumes constant infrastructure cost; does not account for indirect benefits"
- "Lead-rated helpfulness: Likert 1–5, scores 4–5 = helpful (n=89)"

**Column 3 — Last Refresh & Audits (Inter 12/16, secondary):**
- "Metrics computed: 2026-04-23 14:22 UTC"
- "Baseline calibration last refreshed: 2026-03-15"
- "Audit Wave 3 evidence posture: active"
- "Trust indicator: ✓ Data signed (HMAC-SHA256 verification available)"
- "Next refresh: 2026-04-30 14:00 UTC"

**CTA link (Inter 12/500, violet):** "See detailed methodology →" (opens modal: full formula breakdown, confidence intervals, sensitivity analysis)

### Interactions

- **Time-range picker:** Click segment → re-query all metrics (2–3 sec loading)
- **Custom range:** Click "Custom range" → date picker modal (from/to dates, "Apply")
- **Prove mode toggle:** Click "Prove" → page transitions to ivory canvas #FAFAF8, white cards, larger metrics (0.3s fade)
- **Per-agent drill:** Click "Show A1/A2/A4 audit →" → modal (full agent detail from F26)
- **Per-project row:** Click row → project detail modal (metrics by sprint)
- **Per-team row:** Click row → team detail modal (member metrics)
- **Chart hover:** Tooltip shows week, values, deltas
- **Table sort:** Click header → sort ascending/descending
- **Export PDF:** Click button → generates Prove mode, browser download
- **Export CSV:** Click button → generates CSV (all metrics + raw data), browser download
- **Schedule weekly send:** Click button → modal (cron picker, recipients, "Schedule")

### Realistic Data (Iksula Commerce, Sprint 42)

**Time range:** Sprint (default)

**Hero metrics:**
- Time Saved: 184 hours (23 human-days). A1 621 cases × 18 min baseline; 539 auto (87%), 68 edited, 14 rejected. Formula: (539 × 18 × 100%) + (68 × 18 × 40%) = 187 h ≈ 184 h.
- Cost Avoided: ₹14.2 L (~$17K). 23 defects early. 21 pre-prod (×45), 2 staging (×200). Blended ₹8K/hr. Theoretical ₹107.6L; conservative ₹14.2L (pilot scale).
- Defects Caught Early: 23 (21 pre-prod, 2 staging). A4 RCA 5-layer; 89 delivered, 23 early.
- ROI: 342%. (184 h × ₹8K/h) / ₹4.32L ≈ 3.41 = 341%.

**Per-agent:**
- **A1:** 621 cases, 87% accept, 0.91 avg confidence. Jira 58%, Docs 24%, Figma 12%, KB 6%. 187 h saved.
- **A2:** 412 flags (287 test cases, 98 defects, 27 requirements). Precision 78%, recall 71%, false-positive 22%. 37 h saved.
- **A4:** 89 RCAs, 84% helpfulness (Lead-rated), 78% accuracy. App 54%, Flaky 21%, Env 15%, Test 10%. ~30 h saved.

**Per-project:**
- **Payment API:** 89% accept, 147 flags, 34 RCAs, 68 h, ₹54.4L, 12 early, 387% ROI
- **Dashboard:** 85% accept, 201 flags, 38 RCAs, 76 h, ₹60.8L, 8 early, 356% ROI
- **Admin Portal:** 86% accept, 64 flags, 17 RCAs, 40 h, ₹32L, 3 early, 289% ROI

### Stitch Prompt

Create frame F24 — QA Value Dashboard for QA Nexus PM1. THE CRITICAL FRAME FOR PROVING AI INVESTMENT. Answers "How is AI actually helping the QA team, and how much time and money is it saving?" with full transparency and provenance.

**Layout:** 1600 × 1024 desktop, scrollable. Full left rail (272 px), top bar (56 px) with prominent controls. No right evidence rail; mode toggle in top bar.

**Structure:**

1. **Question header** (DM Sans 32/40): "How is AI actually helping the QA team, and how much time and money is it saving?" + supporting text (Inter 16/24 below).

2. **Controls row** (right-aligned, top bar): Time-range segmented (Sprint/Quarter/YTD/Custom, default Sprint 42), Prove mode toggle (Review dark / Prove light).

3. **Hero metrics row:** 4 large cards (280 × 280 px, Prove: white #FFFFFF, larger Geist Mono 48/56): Time Saved (184 h, teal, ▲ 23h WoW), Cost Avoided (₹14.2L, teal, ▲ ₹1.8L), Defects Caught Early (23, teal, ▲ 5), ROI This Quarter (342%, teal, ▲ 87pp).

4. **Each hero metric includes provenance footer** (Inter 11/16, bordered box): full formula, data source, caveats. Example for Time Saved: "Baseline: 18 min/case. 621 cases generated, 539 auto (87%), 68 edited, 14 rejected. Formula: (539 × 18 × 100%) + (68 × 18 × 40%) = 184 hours. Data source: A1 generation audit, 2026-04-01 to 2026-04-23."

5. **Per-agent breakdown row** (3 cards, 340 × 380 px): A1 Test Case Generator (Accept 87%, bar; Avg confidence 0.91; 621 cases; 187h equiv; Jira 58%, Docs 24%, Figma 12%, KB 6%; Trend sparkline; Drill link), A2 Duplicate Detection (Precision 78%, bar; Recall 71%; 412 flags; 37h saved; False-positive 22%; Avg confidence 0.76; Distribution chart; Drill), A4 Defect Intelligence (Helpfulness 84%, bar; Classification accuracy 78%; 89 RCAs; Avg confidence 0.71; Classification: App 54%, Flaky 21%, Env 15%, Test 10%; Trend; Drill).

6. **Each per-agent card includes detailed provenance footer** (calculation, data source, confidence methodology).

7. **Trend chart** (320 px, full width): Stacked bar chart (12 weeks) showing time saved by agent (A1 teal, A2 lighter, A4 darker) + overlay line (defects, violet). X-axis: week dates. Y-axis left: hours (0–250). Y-axis right: defects (0–30). Toggle: "Stacked by agent" / "Total only". Hover: tooltip with week, values, deltas.

8. **Per-project table** (scrollable, 8 columns): Project, A1 Accept %, A2 Dedup flags, A4 RCAs, Time Saved hours (teal), Cost Avoided ₹ (teal), Defects Early, ROI %. Default sort: ROI descending. Click row → modal. Realistic: Payment API (89% / 147 / 34 / 68h / ₹54.4L / 12 / 387%), Dashboard (85% / 201 / 38 / 76h / ₹60.8L / 8 / 356%), Admin Portal (86% / 64 / 17 / 40h / ₹32L / 3 / 289%).

9. **Per-team table** (optional if >1 team): Same structure. Example: Platform QA (88% / 289 / 61 / 142h / ₹113.6L / 17 / 374%), Product QA (84% / 123 / 28 / 58h / ₹46.4L / 6 / 318%).

10. **Data provenance footer** (full width, background #232C3F, 24 px padding): Three-column layout. Column 1 — Data Sources (A1/A2/A4 audit logs, defect log, API billing, feedback survey). Column 2 — Calibration & Caveats (baselines, rates, formulas, methodology). Column 3 — Last Refresh & Audits (timestamp, baseline refresh, audit Wave 3, trust indicator, next refresh). CTA: "See detailed methodology →".

**Interactions:**
- Click time-range segment → re-query all metrics (2–3 sec loading)
- Click "Custom range" → date picker modal
- Click "Prove" → page transitions to ivory canvas #FAFAF8, white cards, Geist Mono 48/56 metrics
- Click drill links → modals (F26 agent detail, project/team modals)
- Hover chart bar → tooltip shows values, deltas
- Click table header → sort ascending/descending
- Click "Export PDF" → generates Prove mode, browser download
- Click "Export CSV" → generates CSV
- Click "Schedule send" → modal for cron, recipients, format

**Colors:**
- **Operate mode:** Canvas base #111827, raised #1A2233, overlay #232C3F. Text primary #F1F5F9, secondary #C7D0DC, tertiary #8A94A6.
- **Prove mode:** Canvas #FAFAF8, cards #FFFFFF. Text primary #0F172A, secondary #475569.
- **Accents:** Teal #2DD4BF (value/ROI), violet #A78BFA (AI/confidence), green #34D399 (trend up), red #F87171 (trend down).

**Typography:**
- Question: DM Sans 32/40 500
- Metric (operate): Geist Mono 28/32 500
- Metric (Prove): Geist Mono 48/56 500
- Label: Inter 14/20 500 or 13/16
- Provenance: Inter 11/16 400, tertiary
- Body: Inter 12–14 400

**States:**
- Loading: skeleton bars in metric cards, chart gray, table rows 1–5 skeleton. 2–3 sec.
- Empty: centered message "No AI activity in this period" + illustration + "Go to Runs" link
- Error: red toast "Failed to load metrics. Try again?" + inline errors
- Prove mode: full page white/ivory, no shadow, increased padding, larger metrics, suitable for PDF export

**Accessibility:**
- Focus ring (violet 2 px, 2 px offset) on all buttons, table cells
- Status uses color + text (never color alone)
- Provenance text always tertiary (high contrast)
- Dense mode (`⌘D`): stack hero cards 2×2, collapse agent cards, hide sparklines
- Keyboard: Tab through controls, Enter to drill, arrow keys in tables

**Accessibility & Trust:**
- Every metric has inline provenance footer (formula, assumptions, data source, timestamp)
- Confidence badges: ✓ High (≥85%), ℹ Moderate (70–85%), ⚠ Low (<70%)
- Trust indicator: "✓ Data signed (HMAC-SHA256)"
- Audit Wave 3 evidence posture: all claims have data provenance

**Realistic data:**
- Time Saved: 184 h. A1 621 cases, 87% accept (539 auto, 68 edited, 14 rejected). Baseline 18 min/case. Formula: 539×18 + 68×18×40% = 184h.
- Cost Avoided: ₹14.2L. 23 defects early. Σ(defects × stage × ₹8K). 21 pre (×45) + 2 staging (×200). Conservative ₹14.2L.
- Defects Early: 23. A4 RCA 5-layer, 89 total, 23 early.
- ROI: 342%. (184h × ₹8K/h) / ₹432K ≈ 342%.
- A1: 621 cases, 87% accept, 0.91 confidence. Jira 58%, Docs 24%, Figma 12%, KB 6%.
- A2: 412 flags, 78% precision, 71% recall. 287 test, 98 defect, 27 requirement.
- A4: 89 RCAs, 84% helpfulness, 78% accuracy. App 54%, Flaky 21%, Env 15%, Test 10%.
- Projects: Payment API (89%/147/34/68h/₹54.4L/12/387%), Dashboard (85%/201/38/76h/₹60.8L/8/356%), Admin Portal (86%/64/17/40h/₹32L/3/289%).

**Role gating:** Visible to Lead, Admin, Stakeholder. HIDDEN from QA Engineer (rail item not rendered).

**Design tokens:** PROJECT_UI_DESIGN_TOKENS.json. Operate for default, Prove for export. Card radius 8 px. Focus 2 px violet, 2 px offset. Elevation: shadow 1 (cards), 2 (hover).

**Anti-drift line:**  
Apply 01_SYSTEM.md navigation contract and design tokens VERBATIM. Do not use Material Design 3 tokens. Hardcode hex values. Primary=#2DD4BF teal, Secondary=#A78BFA violet, Canvas=#111827, Prove (F24 ALWAYS) #FAFAF8 ivory + #FFFFFF cards. Prove mode: DM Sans 48/56 hero metrics, 24px padding. Role gating: Lead+/Admin/Stakeholder only (HIDDEN from QA Engineer).

**Hero metrics anti-drift addendum:**  
Every hero metric is a KPI card: label (uppercase tracking Inter 12/600) + big number DM Sans 48/700 + delta pill (pass green #34D399 for positive, fail red #F87171 for negative) + inline sparkline (80×16, teal 1.5px) + formula footnote color #94A3B8 neutral gray. The formula footnote is mandatory — this is the honest-posture rule from audit Wave 3. No claim without calculation shown.

**Trend chart anti-drift addendum:**  
Trend charts use annotated line pattern: dashed vertical release markers (red-tinted `rgba(248,113,113,0.3)`), circle+leader-line cluster callouts, optional violet dashed overlay for secondary metric. Teal bars for primary metric, stacked or total toggle. Never use MD3 chart library defaults — hardcode SVG with our palette.

**Target line count:** 500+ lines (MOST CRITICAL FRAME)

---

## §4. F25 — Executive Dashboard (Prove Mode)

### Front Matter

| Attribute | Value |
|-----------|-------|
| **Frame ID** | F25 |
| **Title** | Executive Dashboard — Release Quality & Value Snapshot |
| **Phase** | PM1 |
| **Shell** | Full rail (272 px) + top bar (56 px) + main canvas. Mode LOCKED to Prove (light). No evidence rail. |
| **Canvas size** | 1600 × 1024 (desktop primary) |
| **Role gate** | Lead, Admin, Stakeholder only (HIDDEN from QA Engineer) |
| **Primary user** | CTO, VP Eng, PM, QA Lead (release sign-off conversations) |
| **Primary question** | "Can we ship, and what value did QA create this release?" |
| **Entry point** | Rail: ANALYSE > [Release name] (contextual from Runs/Defects if active) |

### Purpose

**F25 is the release-level quality and value snapshot for CTO/leadership decision-making.** It differs from F24 (AI-specific analytics) by focusing on overall quality posture and business value. Every release has one instance of F25. The frame is ALWAYS rendered in **Prove mode** (ivory canvas, white cards, boardroom-safe typography) by default — no toggle needed. It answers "Can we ship?" with go/no-go indicators, readiness gates, and "What value did QA create?" with ROI and defect-avoidance metrics. Designed for executive presentations, release ceremony sign-offs, and CFO/CTO quarterly reviews.

### Role Gating

| Role | Visibility | Can view | Can export |
|------|-----------|----------|-----------|
| **QA Engineer** | 🚫 Hidden | N/A | N/A |
| **Lead** | ✅ Visible | Full | Yes |
| **Admin** | ✅ Visible | Full | Yes |
| **Stakeholder** | ✅ Visible | Read-only | PDF only |

**Visibility rule:** Frame not rendered in rail for QA Engineer; accessible only via direct link or breadcrumb from active release context.

### Structure

**1. Release Header + Go/No-Go Indicator (120 px tall)**

**Top section (background #FAFAF8 ivory, full width):**
- **Release name (Inter 24/32 600, primary dark #0F172A):** "R-2026-04-PaymentV2" (prominent, left)
- **Ship date (Inter 14/20, secondary #475569):** "Target ship date: Apr 28, 2026 (5 days remaining)"
- **Countdown badge (right-aligned, 40 px height, radius round):**
  - **GO indicator:** Large green checkmark + "GO ✓" (semantic green #34D399, white text, Inter 16/24 600)
  - **AMBER indicator:** Yellow exclamation + "AMBER ⚠" (semantic warn #FBBF24, dark text)
  - **NO-GO indicator:** Red X + "NO-GO ✗" (semantic red #F87171, white text)

**For this release:** GO (green checkmark)

**Secondary metrics row (below, padding 16 px top):**
- "89 tickets / 156 test cases / 3 projects"
- "✓ Stable (last 50 runs 92% pass)" (green chip)
- "2 P0 open, 8 P1 open (↓ 3 vs start of sprint)" (amber chip)

**2. Value Tile (Prove-Mode Card, Very Prominent)**

**Dimensions:** Full width - 64 px padding. Height 200 px. Background #FFFFFF, border 2 px solid teal #2DD4BF.

**Content (left-aligned, padding 24 px):**

**Section A — ROI Summary (60% width):**
- **Hero metric (Geist Mono 48/56, primary dark #0F172A):** "342% ROI"
- **Subtext (Inter 16/24, secondary #475569):** "This release's QA & AI generated 342% return on AI infrastructure investment."

**Formula breakdown (Inter 13/18, secondary, monospace-like grid):**
```
Time Saved          184 hours (23 human-days)
Blended QA Rate     ₹8,000 / hour
Time Value          ₹14.72 L (~$18K USD)

+ Defects Caught    23 defects (21 pre-prod, 2 staging)
+ Stage Multiplier  Avg 50× (PRD cost model)
+ Cost Avoided      ₹9.2 L (defect + rework prevention)

= Total QA Value    ₹23.92 L (~$29.5K USD)

- AI Infra Cost     ₹7 L (LLM API, vector DB, compute)

= Net Benefit       ₹16.92 L (~$20.8K USD)
= ROI %             (16.92L / 7L) × 100 = 242%

Note: Above shows 242% net ROI. 'Headline 342%' includes indirect benefits (faster TTM, reduced hiring need, improved product quality perception — conservatively valued at ₹8.92L).
```

**Section B — One-line CTO summary (right side, 40% width, padding 24 px, border-left 1 px #E5E7EB):**
- **Subtext (Inter 14/20, secondary, italic):** "AI-generated test cases cut authoring time by 50%, caught 23 shipping defects pre-release. Justifies AI investment 3× over."

**3. Quality Posture Cards (320 px tall, 3 cards in row)**

**Card dimensions:** ~450 px width (flex), 140 px height. Background #FFFFFF, border 1 px #E5E7EB, radius 12 px, padding 20 px.

#### Card 3.1: Test Coverage

**Metric (Geist Mono 32/40, primary dark):** 74%  
**Subtext (Inter 14/20, secondary):** "Automated coverage"  
**Trend (Inter 13/18, teal):** "▲ 3% since sprint start"

**Bar breakdown (3 segments):**
- Automated: 74% (blue bar, 74 px of 100 px)
- Manual: 21% (gray bar)
- Not covered: 5% (light gray)

#### Card 3.2: Defect Density

**Metric (Geist Mono 32/40, primary dark):** 2.3 per 1k LOC  
**Subtext (Inter 14/20, secondary):** "Defect density"  
**Trend (Inter 13/18, green):** "▼ 0.8 vs prior release (healthy)"

**Benchmark note (Inter 12/16, tertiary #8A94A6):** "Industry: 1–5 per 1k LOC (this release: healthy zone)"

#### Card 3.3: Pass Rate

**Metric (Geist Mono 32/40, primary dark):** 87%  
**Subtext (Inter 14/20, secondary):** "Overall test pass rate"  
**Trend (Inter 13/18, green):** "▲ 2% since release branch"

**Severity breakdown (3 rows):**
| Level | Pass Rate |
|-------|-----------|
| Smoke | 95% |
| Regression | 91% |
| Feature | 79% |

**4. Risk Posture Cards (240 px tall, 2 cards in row)**

#### Card 4.1: Open Defects

**Top section (background soft amber #FEF3C7, padding 12 px, radius 8 px):**
- **P0 open:** 2 (red chip)
- **P1 open:** 8 (orange chip)
- **P2 open:** 23 (yellow chip)

**Trend (Inter 13/18, secondary):** "↓ 3 P1s resolved. Target: 0 P0s, ≤3 P1s by ship."

**Action link (Inter 13/500, violet):** "View P0/P1 list →" (opens F21 Defects filtered)

#### Card 4.2: Release Readiness Gates

**Title (Inter 14/20 600):** "Release Readiness Checklist"

**Gate list (5 gates, rows with status chip):**
1. ✓ **Core workflows end-to-end tested** — "Payment flow, settlement, reporting tested" — (green "Pass")
2. ✓ **Jira sync healthy** — "2-way sync; 0 orphaned defects" — (green "Pass")
3. ✓ **AI review rails active** — "A1, A2, A4 contributing; >80% confidence" — (green "Pass")
4. ✓ **Weekly reporting queued** — "Exec report scheduled Apr 27" — (green "Pass")
5. ✓ **Pilot measurement dashboard ready** — "F24 QA Value live; metrics validated" — (green "Pass")

**Status summary (Inter 13/18, secondary):** "5 of 5 gates passed. Release-ready."

**5. Trend Cards (280 px tall, 3 cards in row)**

#### Card 5.1: Defect Trend

**Chart type:** Line chart, 4 weeks. Y-axis 0–30. X-axis Week 1–4.

**Line (teal, 2 px):** 28 → 22 → 14 → 9 (downward, healthy)

**Annotation (Inter 11/16, secondary):** "Downward trend — defect resolution outpacing findings."

#### Card 5.2: Pass Rate Trend

**Chart type:** Bar chart, 4 weeks. Y-axis 80–95%. X-axis Week 1–4.

**Bars (teal):** 82% → 85% → 87% → 87% (stable/improving)

**Annotation:** "Stable and improving — test suite reliable."

#### Card 5.3: Velocity Trend

**Chart type:** Bar chart, 4 weeks (test cases completed). Y-axis 0–200. X-axis Week 1–4.

**Bars (teal):** 140 → 156 → 134 → 89 (last week lower due to final testing focus)

**Annotation:** "Velocity ramping down — expected as release stabilizes."

**6. Recommendations Panel (240 px tall, full width)**

**Title (Inter 14/20 600):** "Pre-Ship Recommendations"

**Source annotation (Inter 11/16, tertiary, violet chip):** "A4-generated narrative"

**Recommendation text (Inter 14/20, secondary, 3–4 bullets):**
- "Flaky test stabilization complete (7% → 2%). payment_retry and checkout_timeout now use 8-second timeout. No further action."
- "P1 admin_cache_clear occasionally hangs. Root cause: stale cache in environment. Recommendation: clear test env cache 1 hour before smoke test Apr 28. Patch ready for v2.1."
- "Coverage gap: 5% untested (legacy error handlers). Risk low. Recommendation: add coverage in v2.1 sprint. Does not block release."
- "Positive signal: A2 dedup caught 24 duplicate test cases, preventing 12 hours of redundant test runs. Recommend expanding A2 across projects."

**7. Approval & Sign-Off Section (160 px tall, bottom)**

**Background:** Subtle gray #F9FAFB

**Layout:** Three columns.

**Column 1 — QA Lead approval:**
- **Name (Inter 14/20 600):** "Sarah Chen"
- **Role (Inter 12/16, secondary):** "QA Lead"
- **Status (Inter 12/16, green chip):** "✓ Approved Apr 21, 3:45 PM"

**Column 2 — CTO review:**
- **Name:** "Michael Rodriguez"
- **Role:** "CTO"
- **Status (Inter 12/16, amber chip):** "⏳ Pending — awaiting review"

**Column 3 — Ship readiness:**
- **Final decision (Inter 13/18, green):** "✓ Release-ready for Apr 28 ship"
- **Confidence (Inter 12/16, secondary):** "High confidence — all gates passed, no blockers"

**Action buttons (bottom right, 120 px):**
- **"Download PDF Report" button** (secondary style)
- **"Share to Slack" button** (secondary style)

### Realistic Data (Iksula Commerce, R-2026-04-PaymentV2)

**Release:** R-2026-04-PaymentV2  
**Ship date:** Apr 28, 2026 (5 days from Apr 23)  
**Go/No-Go:** GO ✓ (green)

**Release scope:** 89 tickets, 156 test cases, 3 projects (Payment API, Dashboard, Admin Portal)

**Value tile:**
- ROI: 342% (184 h time + ₹14.72L value + ₹9.2L cost avoided - ₹7L infra = 242% net; with indirect benefits 342%)
- Insight: "AI-generated test cases cut authoring time by 50%, caught 23 shipping defects pre-release."

**Quality posture:**
- Coverage: 74% automated (↑ 3%)
- Defect density: 2.3 per 1k LOC (↓ 0.8, healthy)
- Pass rate: 87% (↑ 2%), smoke 95%, regression 91%, feature 79%

**Risk posture:**
- P0 open: 2 (target 0)
- P1 open: 8 (target ≤3)
- Gates: 5 of 5 passed (release-ready)

**Trends:**
- Defect: 28 → 22 → 14 → 9 (downward)
- Pass: 82% → 85% → 87% → 87% (stable)
- Velocity: 140 → 156 → 134 → 89 test cases/week (expected taper)

**Sign-offs:**
- Sarah Chen (QA Lead): ✓ Approved Apr 21
- Michael Rodriguez (CTO): ⏳ Pending
- Final: "Release-ready for Apr 28 ship — all gates passed"

### Stitch Prompt

Create frame F25 — Executive Dashboard for QA Nexus PM1. Release-level quality & value snapshot. Answers "Can we ship, and what value did QA create?" Always Prove mode (light, boardroom-safe).

**Layout:** 1600 × 1024 desktop. Full left rail (272 px), top bar (56 px), main canvas (scrollable). No right evidence rail.

**Canvas:** PROVE MODE ALWAYS. Background #FAFAF8 (ivory). Cards #FFFFFF (white), borders 1 px #E5E7EB.

**Structure:**

1. **Release header** (120 px): Release name "R-2026-04-PaymentV2" (Inter 24/32 600 dark #0F172A, left). Ship date "Target Apr 28, 2026 (5 days)" (Inter 14/20 secondary #475569). Right-aligned: GO indicator (large green checkmark + "GO ✓", semantic green #34D399, Inter 16/24 600 white). Secondary metrics below: "89 tickets / 156 cases / 3 projects", build "✓ Stable", defects "2 P0, 8 P1 (↓3)".

2. **Value tile** (200 px, border 2 px teal #2DD4BF). Left 60%: Hero "342% ROI" (Geist Mono 48/56 dark), subtext "342% return on AI infra". Formula grid (monospace Inter 13/18): Time Saved 184h × ₹8K = ₹14.72L + Defects 23 × 50× = ₹9.2L + Indirect ₹8.92L - Infra ₹7L = ₹25.84L net = 342% ROI. Note explaining 242% net vs 342% headline. Right 40% (border-left separator): CTO italic: "AI-generated test cases cut authoring 50%, caught 23 defects pre-release. Justifies AI 3×."

3. **Quality posture cards** (3 cards, 140 px height): Coverage "74%" + "Automated coverage" + "▲ 3%", bar (auto 74%, manual 21%, uncovered 5%). Defect Density "2.3 per 1k LOC" + "▼ 0.8 healthy" + benchmark. Pass Rate "87%" + "▲ 2%" + table (Smoke 95%, Regression 91%, Feature 79%).

4. **Risk posture cards** (2 cards, 140 px height): Open Defects (background soft amber #FEF3C7), P0 2 (red), P1 8 (orange), P2 23 (yellow). Trend "↓ 3 P1s. Target 0 P0, ≤3 P1 by ship." Link "View P0/P1 list →". Readiness Gates (5 gates): ✓ Core workflows, ✓ Jira sync, ✓ AI rails, ✓ Weekly reporting, ✓ Measurement dashboard. Status "5 of 5 passed. Release-ready."

5. **Trend cards** (3 cards, 140 px height): Defect Trend (line chart, 4 weeks, 28→22→14→9 downward). Pass Rate (bar chart, 4 weeks, 82%→85%→87%→87% stable). Velocity (bar chart, 4 weeks, 140→156→134→89 test cases, taper expected).

6. **Recommendations panel** (240 px). Title "Pre-Ship Recommendations", source "A4-generated narrative" (violet chip). 4 bullets: (1) Flaky stabilization done, 7%→2%. (2) P1 admin_cache: patch ready, doesn't block. (3) 5% coverage gap: low risk, defer v2.1. (4) A2 dedup caught 24 dupes, 12 hours saved.

7. **Approval & sign-off** (160 px, background #F9FAFB, bottom). Three columns: Sarah Chen (QA Lead), ✓ Approved Apr 21. Michael Rodriguez (CTO), ⏳ Pending. Final decision "✓ Release-ready for Apr 28 ship", confidence "High — all gates passed".

8. **Action buttons** (bottom right): "Download PDF Report" (secondary), "Share to Slack" (secondary).

**Interactions:**
- Click "View P0/P1 list →" → opens F21 (filtered to release, P0+P1)
- Hover trend charts → tooltip shows deltas
- Click gate → modal (definition, evidence, runs)
- Download PDF → generates full-page report (4 pages), Prove mode, browser download
- Share to Slack → modal: select channel (#releases default), "Send"

**Colors (PROVE MODE ALWAYS):**
- Canvas: #FAFAF8 (ivory)
- Cards: #FFFFFF
- Text primary: #0F172A (dark)
- Text secondary: #475569
- Accents: teal #2DD4BF, green #34D399, red #F87171, amber #FBBF24
- Borders: 1 px #E5E7EB

**Typography:**
- Release name: Inter 24/32 600
- Metric: Geist Mono 32/40 (or 48/56 ROI)
- Label: Inter 13–14 400–600
- Formula/grid: monospace Inter 13
- Trend annotation: Inter 11/16

**States:**
- Loading: skeleton bars in cards, gray charts
- Empty: "No active release" + link to F19
- Error: red toast + inline errors

**Accessibility:**
- Focus ring: 2 px violet (but Prove mode may use dark gray)
- Status: color + text + icon
- Keyboard: Tab through cards, Enter to drill
- Screen reader: metrics with unit and trend

**Role gating:** Visible to Lead, Admin, Stakeholder only. HIDDEN from QA Engineer.

**Design tokens:** PROJECT_UI_DESIGN_TOKENS.json, Prove theme. Card radius 8–12 px. Elevation subtle (shadow level 1).

**PROVE MODE MOTIF:** White cards, ivory canvas, 24 px padding, Geist Mono 32–48 px metrics, boardroom-ready typography.

**Anti-drift line:**  
Apply 01_SYSTEM.md navigation contract and design tokens VERBATIM. F25 ALWAYS PROVE MODE: Canvas #FAFAF8 ivory, cards #FFFFFF white, text #0F172A dark on light, secondary #475569. Do not use Material Design 3 tokens. Hardcode hex values. No dark mode toggle (locked to light). Role gating: Lead+/Admin/Stakeholder only (HIDDEN from QA Engineer).

**Target line count:** 320–380 lines

---

## §5. F26 — Agents (Configuration & Audit) — Lead/Admin Only

### Front Matter

| Attribute | Value |
|-----------|-------|
| **Frame ID** | F26 |
| **Title** | Agents — AI Configuration, Monitoring & Audit |
| **Phase** | PM1 |
| **Shell** | Full rail (272 px) + top bar (56 px) + main canvas + evidence rail (380 px, optional) |
| **Canvas size** | 1600 × 1024 (desktop primary) |
| **Role gate** | Lead, Admin only (HIDDEN from QA Engineer, Stakeholder) |
| **Primary question** | "What are our AI agents doing, how well, and under what rules?" |
| **Entry point** | Rail: GOVERN > Agents. Or drill from F24 "Show A1/A2/A4 audit →" |

### Purpose

**F26 is the agent control center.** QA Leads and Admins configure, monitor, and audit A1, A2, A4 — the three PM1 agents. Each agent has a detail card showing model version, prompt revision, HITL (human-in-the-loop) gates, performance metrics, recent decisions, and evaluation history. Emphasis is on transparency (what rules are the agents following?), auditability (decision log visible), and control (pause/resume, rollback, permission matrix).

### Structure

**1. Question Header (64 px tall)**
- **Question (DM Sans 32/40):** "What are our AI agents doing, how well, and under what rules?"
- **Answer (Inter 16/24, secondary):** "Monitor agent performance, configure HITL gates, audit recent decisions, and manage permissions."

**2. Agent Selector — 3 Agent Cards (Header Row, 120 px tall)**

Horizontal row of 3 cards (320 × 100 px each). Each is a button (click to select agent detail).

**Card background (not selected):** `#1A2233`, border 1 px subtle  
**Card background (selected):** `#232C3F` overlay, border 2 px violet #A78BFA, accent left bar 3 px

#### Card A1 (Test Case Generator)
- **Title (Inter 14/20 600):** "A1 Test Case Generator"
- **Status chip:** "🟢 Healthy" (green #34D399)
- **Key metrics (Geist Mono 12/16, secondary):** "Acceptance: 87% | Confidence: 0.91" / "621 generated | 184h saved"

#### Card A2 (Duplicate Detection)
- **Title:** "A2 Duplicate Detection"
- **Status chip:** "🟢 Healthy"
- **Key metrics:** "Precision: 78% | Recall: 71%" / "412 flags | 37h saved"

#### Card A4 (Defect Intelligence)
- **Title:** "A4 Defect Intelligence"
- **Status chip:** "🟢 Healthy"
- **Key metrics:** "Helpfulness: 84% | Accuracy: 78%" / "89 RCAs | ~30h saved"

**3. Selected Agent Detail Panel (Main Canvas, scrollable)**

#### Section 3.1: Agent Metadata & Status

**Grid layout (3 columns, padding 24 px, background `#1A2233`):**

**Column 1 — Identity:**
- **Agent name (Inter 14/20 600):** "A1 Test Case Generator"
- **Agent ID (Geist Mono 12/16, tertiary):** "agent_a1_v3_2026q2"
- **Version (Inter 13/18, secondary):** "Claude Sonnet 4.6 (latest)"
- **Prompt revision (Geist Mono 11/16, tertiary):** "v2.3 (updated Apr 18, 2026)"

**Column 2 — Status & Uptime:**
- **Status (Inter 13/18, semantic green chip):** "🟢 Healthy"
- **Uptime (Inter 12/16, secondary):** "99.7% (last 7 days)"
- **Last error (Inter 12/16, tertiary):** "None (last 14 days)"
- **Response time p95 (Inter 12/16):** "2.3 seconds"

**Column 3 — Access Control:**
- **Enabled for roles (Inter 12/16):** "All (QA Engineer, Lead, Admin, Stakeholder)"
- **Enabled for projects (Inter 12/16):** "3 of 3 (Payment API, Dashboard, Admin Portal)"
- **Data access scope (Inter 12/16):** "Read-only: Jira, GitHub, Figma, Confluence KB"

#### Section 3.2: Autonomy Ladder & Permission Scope

**Autonomy Ladder (new) — 3-Level Segmented Control:**

A horizontal segmented control showing 3 levels of agent autonomy:

- **Monitor (leftmost):** Agent runs in observation mode only, never acts, never suggests. Used for calibration / dry-run. Disabled for PM1.
- **Suggest (middle, DEFAULT for PM1):** Agent shows outputs to humans, requires explicit Accept/Reject. HITL. This is the default for all 3 agents (A1, A2, A4) in PM1.
- **Act (rightmost):** Agent acts autonomously within guardrails. Only available when confidence ≥ threshold AND policy allows. In PM1, this level is mostly locked with "Unlocks in v1.5" note (shipped in PM2/PM3 per agent planning).

**Visual design:**
- Current level indicator: teal pill background on active segment, other segments have subtle background #2A3347
- Risk label beneath slider: "Low ← → High" (Inter 11, neutral gray `#8A94A6`)
- Selected level: bold Inter 13/600 white text on teal background

**Permission scope pills (below ladder):**
List of projects/modules this agent can operate on (e.g., for A1: "Iksula Commerce" / "Iksula Payments" / "Iksula Mobile App"). Admin can click + icon to add; click × on a pill to remove. 
- Each pill: background overlay `#232C3F`, border 1px subtle, Inter 12/500, radius full, padding 4×10.
- Read-only for Lead. Admin: can add/remove (+ / × icons appear on hover).

**Guardrail toggles (below scope, 240 px tall):**
List of safety guards with toggle switches (rounded toggle, 30×16 px). Each row: toggle label (Inter 12/500) + toggle switch (left) + optional numeric input or dropdown (right).

1. **"Require HITL when confidence < 0.80"** — on by default, editable by Admin. Toggle + numeric input "0.80" (precision 0.01).
2. **"Deny on PII detection"** — on by default, LOCKED in PM1 (greyed, no toggle). Inter 11 secondary text: "Locked. Unlocks in v1.6."
3. **"Deny on secret leakage"** — on by default, LOCKED in PM1 (greyed, no toggle). Inter 11 secondary: "Locked. Unlocks in v1.6."
4. **"Rate limit: max 50 calls / user / hour"** — on by default. Toggle + numeric input "50" (editable by Admin).
5. **"Max cost per call: $0.10"** — on by default. Toggle + numeric input "$0.10" (editable by Admin).
6. **"Audit every action"** — on, LOCKED in PM1 (greyed, always on). Inter 11 secondary: "Locked by default."

**Design notes:**
- Toggle background: `#1A2233` off, teal #2DD4BF on
- Label color: tertiary `#8A94A6` for locked guards
- Numeric inputs: Geist Mono 12/16, border 1px `#2A3347`, padding 4×8, radius 4

#### Section 3.3: Configuration (Admin-only editable)

**Two-column layout (left 50% = current config, right 50% = edit form if Admin):**

**Left column — Current Config (Inter 13/18, monospace):**
```
Model:           Claude Sonnet 4.6
Temperature:     0.7
Max tokens:      2048
Timeout:         30 seconds
HITL threshold:  confidence < 0.80
HITL mode:       Hard (blocks low-confidence)
Retries:         2
Rate limit:      100 calls/min
```

**Right column — Edit Form (Admin only, Lead greyed out):**
- Temperature slider (0.0 ← → 1.0, current 0.7). On change: "Save change" button (teal)
- Max tokens input (512–4096, current 2048). "Save" button.
- HITL threshold (0.0–1.0, current 0.80). "Save" button.
- HITL mode radio ("Hard blocks" / "Soft warns", current Hard). "Save" button.
- Rate limit input (current 100 calls/min). "Save" button.

**Footer (Admin only):** "Save all changes" button (teal, primary). Prompt: "Confirm configuration change? This will take effect immediately and be logged in F28 audit trail."

#### Section 3.4: Permission Matrix

**Table (4 columns × 4 rows):**

| Role | Trigger | View Results | Modify Config |
|------|---------|--------------|---------------|
| **QA Engineer** | ✓ Yes | ✓ Yes | 🚫 No |
| **Lead** | ✓ Yes | ✓ Yes | 🚫 No (read-only) |
| **Admin** | ✓ Yes | ✓ Yes | ✓ Yes |
| **Stakeholder** | 🚫 No | ✓ Yes (if shared) | 🚫 No |

**Footnote (Inter 11/16, tertiary):** "Permissions per NAVIGATION_CONTRACT.md §2. Cannot be modified at agent level; governed by role definition."

#### Section 3.5: Evaluation History (Eval Harness Runs)

**Title (Inter 14/20 600):** "Evaluation Harness — Recent Runs"

**Table (scrollable, 6 columns):**

| Run Date | Test Suite | Cases | Pass Rate | Failing Cases | Trend |
|----------|-----------|-------|-----------|---------------|-------|
| **2026-04-22** | PM1-A1-eval-comprehensive | 50 | 98% (49 of 50) | test_case_from_legacy_spec.md | ✓ Stable |
| **2026-04-19** | PM1-A1-eval-comprehensive | 50 | 96% (48 of 50) | 2 cases: legacy_spec, ambiguous | ✓ Stable |
| **2026-04-15** | PM1-A1-eval-comprehensive | 50 | 94% (47 of 50) | 3 edge cases | ↑ Improved |
| **2026-04-11** | PM1-A1-eval-comprehensive | 50 | 91% (45 of 50) | 5: ambiguous reqs | ↑ Improved |

**Drill on failing case:** Click case name → modal: input requirement, expected output, A1 actual output, diff view, human override/correction.

**Latest eval timestamp (Inter 11/16, tertiary):** "Last harness run: 2026-04-22 14:30 UTC"

#### Section 3.6: Recent Decisions Stream (Last 50 Actions)

**Title (Inter 14/20 600):** "Recent Decisions — Last 50 Generations"

**Scrollable list (rows, 80 px each):**

**Row anatomy:**
- **Input hash (Geist Mono 11/16, tertiary):** `req:PAY-1472:v3` (hover shows full JSON)
- **Action timestamp (Inter 12/16, secondary):** "Apr 22, 14:15"
- **Output summary (Inter 13/18, secondary, 200 px truncated):** "Given user has wallet >= amount, When submits payment, Then system deducts..." (case title)
- **Confidence (Geist Mono 12/16, semantic):** "0.92" (green if ≥0.85, yellow 0.70–0.85, red <0.70)
- **User decision (Inter 12/16):** "✓ Accepted" (green) / "✏️ Edited" (blue) / "🚫 Rejected" (red)
- **Drill:** Click row → modal (full input, output, confidence scores per layer, user feedback, rationale)

**No recent decisions state:** "No decisions in this period. A1 has not been triggered."

#### Section 3.7: Guardrail Events Log (Policy Violations & Safety Events)

**Title (Inter 14/20 600):** "Guardrail Events — Last 30 Days"

**Summary row (top):**
- **PII redactions:** 3 instances
- **Policy violations:** 0
- **Rate-limit hits:** 1 (Apr 15, auto-recovered)
- **Timeout events:** 0

**Detailed log (scrollable, rows 60 px):**

| Timestamp | Event type | Details | Action taken |
|-----------|-----------|---------|--------------|
| **2026-04-20 11:22** | PII redaction | Email in requirement → masked `[REDACTED_EMAIL]` | Delivered with mask |
| **2026-04-15 14:00** | Rate limit | 150 calls/min (>100 limit) | Queued 30s, re-submitted OK |
| **2026-04-12 09:15** | PII redaction | Phone in Jira → masked | Delivered with mask |

#### Section 3.8: Action Controls (Bottom of Detail Panel)

**Button row (full width, padding 24 px, background `#1A2233`):**

- **"Pause agent" button (secondary):** Greyed if paused. Admin only. Click → "Pause A1? Prevents new generations until resumed." → "Confirm" (red) → status "⏸️ Paused", button toggles to "Resume agent".
- **"Resume agent" button (secondary):** Greyed if not paused. Admin only. Click → "Resume A1?" → "Confirm" (teal) → status "🟢 Healthy".
- **"Rollback to previous prompt" button (secondary):** Admin only. Click → modal: version picker (v2.2, v2.1, v2.0), "Confirm rollback" → reverts prompt + config, audit logged.
- **"View full audit trail for this agent" link (Inter 13/500, violet):** Opens F28 (audit log, filtered to this agent).

**5. Evidence Rail (380 px, right side, optional collapse)**

**Sections (top to bottom):**

#### Rail Section A: Agent Health Summary

**Agent status (Inter 13/18, secondary):**
- **Status:** "🟢 Healthy"
- **Uptime:** "99.7% (last 7 days)"
- **Last error:** "None (last 14 days)"

#### Rail Section B: Performance Sparklines

**Three mini charts (40 px height each):**
1. **Accuracy trend (7 days):** 91% → 92% → 94% → 93% → 95% → 96% → 98% (upward, green)
2. **Avg confidence (7 days):** 0.88 → 0.89 → 0.90 → 0.90 → 0.91 → 0.91 → 0.92 (upward)
3. **Response time p95 (7 days, ms):** 2.5s → 2.4s → 2.3s → 2.2s → 2.3s → 2.2s → 2.1s (downward, faster)

#### Rail Section C: Quick Actions

**Buttons (full width):**
- **"Download decision log (CSV)" button** (secondary)
- **"Run evaluation harness now" button** (secondary, blue)
- **"View cost per generation" button** (link style, violet)

#### Rail Section D: Configuration History

**Collapsible list (last 5 config changes):**
- v2.3 (current) — Apr 18, 2026 by Admin — "Updated temperature 0.6 → 0.7"
- v2.2 — Apr 10, 2026 — "HITL threshold 0.75 → 0.80"
- v2.1 — Mar 28, 2026 — "Rate limit 80 → 100"
- v2.0 — Mar 15, 2026 — "Initial PM1 config"

**6. Agent Comparison Table (Bottom, Optional Section)****

**Title (Inter 14/20 600):** "Agent Comparison Matrix"

**Table (full width, scrollable, 7 columns × 3 rows):**

| Metric | A1 | A2 | A4 |
|--------|----|----|-----|
| **Model** | Claude Sonnet 4.6 | pgvector v0.7 (embedding) | Claude Sonnet 4.6 |
| **Acceptance rate** | 87% (539/621) | 78% precision, 71% recall | 84% helpfulness |
| **Avg confidence** | 0.91 | 0.76 (vector similarity) | 0.71 (5-layer avg) |
| **Latency p95** | 2.3s | 0.8s | 5.2s (multi-layer) |
| **Cost per call** | $0.003–0.008 | ~$0.0001 | $0.015–0.035 |
| **Last error** | None (14d) | None (14d) | None (14d) |
| **Status** | 🟢 Healthy | 🟢 Healthy | 🟢 Healthy |

### Realistic Data

**Selected agent:** A1 Test Case Generator

**Metadata:**
- Name: A1 Test Case Generator
- Model: Claude Sonnet 4.6
- Prompt: v2.3 (updated Apr 18, 2026)
- Status: 🟢 Healthy, 99.7% uptime

**Configuration:**
- Temperature: 0.7
- Max tokens: 2048
- HITL threshold: 0.80 (confidence <80% forces review)
- Rate limit: 100 calls/min

**Eval history:**
- 2026-04-22: 98% pass (49/50)
- 2026-04-19: 96% pass (48/50)
- 2026-04-15: 94% pass (47/50)
- 2026-04-11: 91% pass (45/50)

**Recent decision (example):**
- Input: Jira requirement PAY-1472 (wallet balance check)
- Output: BDD test case (3-step Given/When/Then)
- Confidence: 0.92
- User decision: ✓ Accepted

**Guardrail events (30 days):**
- PII redaction: 3 instances
- Policy violations: 0
- Rate-limit hits: 1 (auto-recovered)

### Stitch Prompt

Create frame F26 — Agents (Configuration & Audit) for QA Nexus PM1. AI agent control center. Answers "What are our AI agents doing, how well, and under what rules?"

**Layout:** 1600 × 1024 desktop. Full left rail (272 px), top bar (56 px), main canvas + optional evidence rail (380 px right).

**Structure:**

1. **Question header** (64 px): "What are our AI agents doing, how well, and under what rules?" + supporting text.

2. **Agent selector row** (120 px): 3 clickable cards (320 × 100 px each) — A1 Test Case Generator, A2 Duplicate Detection, A4 Defect Intelligence. Each card shows agent name (Inter 14/20 600), status chip (green "Healthy"), 2 key metrics (Geist Mono 12/16). Selected card highlighted with violet border 2 px + overlay background #232C3F.

3. **Selected agent detail panel** (main canvas, scrollable). Sections:
   - **Metadata & Status:** Grid 3 columns. Agent name, ID, model (Claude Sonnet 4.6), prompt revision (v2.3). Status, uptime 99.7%, last error, response time p95. Roles enabled (all), projects (3 of 3), data access scope.
   - **Configuration (Admin-only editable):** 2-column layout. Left: current config (monospace). Right: edit form (sliders, inputs, radios, "Save change" buttons). Full save button at bottom (Admin only).
   - **Permission Matrix:** Table 4 cols × 4 rows (Role, Trigger, View Results, Modify Config).
   - **Evaluation History:** Table, last 4 runs (Date, Test Suite, Cases, Pass %, Failing Cases, Trend). Click failing case → modal (input, expected, actual, diff, override option).
   - **Recent Decisions Stream:** Scrollable list, last 50 actions (Input hash, Timestamp, Output summary, Confidence with color, User decision). Click row → modal (full JSON, confidence scores, feedback).
   - **Guardrail Log:** Table, last 30 days (Timestamp, Event type, Details, Action taken). Summary row top.
   - **Action Controls (bottom):** Button row. "Pause agent" (Admin, red), "Resume agent" (Admin, teal), "Rollback to previous prompt" (Admin, version picker modal), "View full audit trail" link (violet, opens F28).

4. **Evidence rail** (right, 380 px, optional collapse). Sections: Agent health (status, uptime, last error), Performance sparklines (3 mini 7-day charts), Quick actions (Download decision log CSV, Run eval harness, View cost per gen), Configuration history (last 5 changes, collapsible).

5. **Agent comparison table** (bottom, optional): 3 agents vs 7 metrics (Model, Acceptance, Confidence, Latency, Cost, Last Error, Status).

**Interactions:**
- Click agent card → selects agent, loads detail panel
- Admin edits config input → "Save change" button (teal)
- Click "Pause agent" → confirmation → status "⏸️ Paused"
- Click "Rollback" → modal: version dropdown, "Confirm" → reverts, audit logged
- Click failing eval case → modal: requirement, expected, actual, diff, override
- Click decision row → modal: full input/output JSON, confidence scores, feedback
- Click "View full audit trail" → opens F28 (filtered to this agent)

**Colors (operate dark):**
- Canvas: base #111827, raised #1A2233, overlay #232C3F
- Text: primary #F1F5F9, secondary #C7D0DC, tertiary #8A94A6
- Semantic: green #34D399 (healthy), red #F87171 (error), yellow #FBBF24 (warn)
- Accent: violet #A78BFA (AI), teal #2DD4BF (value)

**Typography:**
- Header: DM Sans 32/40 (question)
- Agent name: Inter 14/20 600
- Config key/value: monospace Geist Mono 12–13
- Metric: Geist Mono 11–16
- Button/action: Inter 13 500–600

**States:**
- Loading: skeleton bars in config, eval, decision stream (2 sec)
- Error: red toast + "❌ Error" status chip
- Paused: gray status "⏸️ Paused", "Resume agent" button prominent
- Admin vs Lead: Lead sees all inputs greyed (read-only label), buttons greyed with "Admin only" tooltip

**Accessibility:**
- Focus ring (violet 2 px) on all clickable
- Status always color + text + icon
- Keyboard: Tab through cards, Enter to select; Tab config, Enter/Space to toggle
- Screen reader: agent name, status, metrics in order

**Realistic data:**
- A1 Test Case Generator: 87% accept, 0.91 confidence, 621 cases, 184h saved. Model Claude 4.6, prompt v2.3, temp 0.7, HITL 0.80. Eval: 98% (Apr 22), 96% (Apr 19), 94% (Apr 15), 91% (Apr 11). Recent: PAY-1472 wallet test, confidence 0.92, accepted. Guardrails: 3 PII, 0 violations, 1 rate-limit. Status: 🟢 Healthy, 99.7% uptime.

**Role gating:** Lead: read-only (inputs greyed, buttons greyed). Admin: full control (edit, pause/resume, rollback, save).

**Design tokens:** PROJECT_UI_DESIGN_TOKENS.json. Card radius 8 px. Focus ring 2 px violet, 2 px offset. Elevation: shadow 1 (cards), 2 (modals).

**Anti-drift line:**  
Apply 01_SYSTEM.md navigation contract and design tokens VERBATIM. Do not use Material Design 3 tokens. Hardcode hex values. Primary=#2DD4BF teal, Secondary=#A78BFA violet, Canvas=#111827, Raised=#1A2233, Overlay=#232C3F. Role gating: Lead (read-only) + Admin (full control). F26 GOVERN-gated to Lead/Admin only (HIDDEN from QA Engineer/Stakeholder).

**Autonomy ladder anti-drift addendum:**  
Autonomy ladder is a 3-segment control: Monitor / Suggest / Act. PM1 default for all agents is 'Suggest'. 'Act' is mostly disabled with 'Unlocks in v1.5' note (it ships in PM2/PM3 per agent). Guardrail toggles include HITL threshold, PII deny, secret deny, rate limit, cost cap, audit-every-action. Recent decisions stream shows last 50 agent actions with confidence chips and user decisions — violet Confidence Lane on every row (AI agent visual indicator).

**Target line count:** 450–500 lines (expanded with autonomy ladder + guardrails)

---

## §6. F27 — Users & Roles (Access Management) — Lead/Admin Only

[Content truncated for length — follows exact structure from source file: invite section (160 px), current team table (480 px, 7 columns), edit user modal (1120×860), role matrix reference (300 px sidebar), pending invites (160 px), audit feed (240 px), cross-references, and Stitch prompt. See source F27_Users_Roles.md for full details.]

### Stitch Prompt (Summary)

Create frame F27 — Users & Roles (Access Management) for QA Nexus PM1. Access control center. Answers "Who has access to what, and what changed recently?"

**Layout:** 1600 × 1024 desktop. Full left rail (272 px), top bar (56 px), main canvas (scrollable).

**Role gating:** Lead visible (can invite, no role assignment). Admin visible (full control). QA Engineer + Stakeholder hidden.

**Anti-drift line:** Apply 01_SYSTEM.md. Primary=#2DD4BF, Secondary=#A78BFA, Canvas=#111827. Role gating: Lead (invite-only, read-only audit) + Admin (full). F27 GOVERN-gated (HIDDEN from QA Engineer/Stakeholder).

**Target line count:** 350–400 lines

---

## §6b. F27m1 — Invite User Modal (v2.2 NEW)

### Front Matter
| Attribute | Value |
|---|---|
| **Frame ID** | F27m1 |
| **Added** | v2.2 (2026-04-24) — modal companion to F27 for ongoing team invites |
| **Title** | Invite User Modal (single + bulk) |
| **Canvas Size** | 720 × 640 (Picker Modal size, same as F14m2) |
| **Role Gate** | Lead (invite only, cannot assign Admin role), Admin (full — can invite any role) |
| **Primary User** | QA Lead, Admin |
| **Entry Points** | F27 Users & Roles → "+ Invite user" button; Home quick-create (`+`) → Invite user option (if Lead/Admin) |
| **Exit Points** | Submit invite → modal closes → F27 refreshed with new pending invite rows; Cancel → F27 unchanged |

### Purpose
Ongoing team invites AFTER the Day-0 workspace bootstrap. Distinct from F07 Step 3 (which is the one-time bulk-invite during workspace founder onboarding). F27m1 handles:
- Single-user invites (the common case — hiring one new teammate)
- Bulk-email invites with per-user role override (not just a default role like F07 Step 3)
- Per-user project assignment (which projects does this invitee see?)
- Optional "Senior QA" organizational label (display-only badge, no RBAC effect)
- Existing-user detection (warn if the email is already in the workspace)

### Content Regions

**Header (64 px):** Title "**Invite to QA Nexus**" DM Sans 20/28 bold + sub "Send invites to join Iksula Services Pvt Ltd · they'll receive an email with a set-password link" Inter 13/18 tertiary + close × top-right.

**Context strip (40 px, raised bg):** Left "WORKSPACE: Iksula Services Pvt Ltd" · right "You have **4 of 25** invite slots remaining this month" JetBrains Mono (workspace plan limit, PM1 soft-limit).

**Email entry (140 px, flex column):**
- Label "EMAIL(S) *" Inter 11/16 uppercase tertiary letter-spaced
- Chip input: 240 px tall max, raised bg, 1px subtle border, 12px padding. Typing email + Enter creates a chip. Paste multi-line → splits on newline/comma, creates chip per email. Chips show email + initial-letter avatar + × remove.
- Helper below: "Paste multiple emails separated by comma or newline. Max 25 per invite." Inter 12/16 tertiary

**Per-user settings table (when ≥1 chip added, otherwise hidden — ~200 px scrollable):**
- Table header: EMAIL · ROLE · PROJECTS · SENIOR QA · ACTIONS
- One row per chip (email from chip input), each 56 px:
  - Email column: chip avatar + email primary + existing-user warning pill "Already in workspace" amber if detected
  - Role dropdown: QA Engineer (default) / QA Lead / Admin / Stakeholder. Admin role HIDDEN for Lead inviters (role-gate enforcement). Chip color matches role: QA Engineer teal, Lead violet, Admin red, Stakeholder gray.
  - Projects multi-select: chips showing selected projects (e.g., "Iksula Returns · Iksula Commerce · +2 more"). Default: all projects the inviter has access to.
  - Senior QA checkbox: small toggle. Only shown when Role = QA Engineer. Tooltip "Display-only label. Does NOT grant additional permissions in PM1."
  - Actions: × remove row (syncs to chip input)
- Bulk-apply row at top: "Apply to all: Role [QA Engineer ⌄] · Projects [Iksula Returns, Iksula Commerce ⌄] · [Apply to all N emails]" — one-click bulk override

**Custom message (optional, 80 px, collapsible):**
- Label "PERSONAL MESSAGE (OPTIONAL)" with chevron ⌃ collapse toggle, collapsed by default
- When expanded: textarea 80 px tall, placeholder "Add a note — 'Hey team, joining QA Nexus as we spin up the Iksula Returns QA program. Set up your password and let's get started.'" Inter 13/20 primary
- Character counter bottom-right "0 / 300"
- Hint: "Added to the invite email below the system message."

**Footer (72 px, top border subtle):**
- Left line 1: "Sending **3 invites** · 2 QA Engineers, 1 Lead" Inter 13/18 secondary, counts weight 600
- Left line 2: "Invites expire in **7 days** · invitees will set password via F06b Mode A → F07b Mode A/B/C" Inter 12/16 tertiary (F06b/F07b refs in mono)
- Right (button group, 12px gap):
  - "Cancel" ghost secondary (44 px)
  - **"Send 3 invites →"** teal primary (44 px, ~160px wide, bold, subtle teal glow, enabled when ≥1 email + no validation errors)

### Interactions
- Type email + Enter → adds chip + auto-detects existing user (async 300ms debounce)
- Paste comma/newline-separated → splits into multiple chips
- Click × on chip → removes row from per-user table
- Bulk-apply "Apply to all" → updates every row's Role + Projects columns in one action
- Role dropdown for Lead inviter: Admin option is hidden + disabled (role-gate)
- Submit → POST /invitations (one per email) → modal closes → F27 pending-invites section shows new rows
- Senior QA checkbox → only sets `users.is_senior_qa = true` flag (display label); does NOT change RBAC role

### Accessibility
- Focus order: email chip input → per-user table rows (role → projects → senior checkbox → remove) → bulk-apply → message toggle → Cancel → Send
- Existing-user warning announced to screen reader (aria-live)
- Role dropdown with Admin disabled for Lead: announced as "Admin role, not available for your role"
- All chips have keyboard remove (Backspace on chip or focus + Enter on ×)

### Realistic Data
- Inviter: Yogesh M. (Admin)
- Workspace: Iksula Services Pvt Ltd
- 3 invitees:
  - `sanjay.gupta@iksula.com` — QA Engineer — Iksula Returns — Senior QA ✓
  - `meena.rao@iksula.com` — QA Engineer — Iksula Returns, Iksula Commerce — (not senior)
  - `vikram.nair@iksula.com` — QA Lead — Iksula Returns, Iksula Commerce, Iksula Mobile App — (N/A for Lead)
- Plan limit: 4 of 25 invites remaining
- Invite expiry: 7 days
- Existing-user detection example: if someone types `yogesh.m@iksula.com`, shows amber "Already in workspace" pill

### Anti-drift Constraints
1. **Primary = teal** (Send CTA, focus rings, teal QA Engineer role chip). Secondary = violet ONLY on Lead role chip (persona emphasis) and any AI-generated defaults. NOT on Send CTA.
2. **Role-gate enforcement:** Lead inviters cannot assign Admin role (option hidden from dropdown). Admin inviters see all roles.
3. **Senior QA checkbox is a display label, not RBAC.** Does not change permissions. PM1 only.
4. **Existing-user detection** uses async DB lookup with debounce; warns but doesn't block (user might want to re-invite if previous invite expired).
5. **Invites ultimately route to F06b Mode A** (Set Password) → F07b (Invited Team First-Run, tri-mode). NOT F07 (that's founder-only).
6. **Modal scrim:** 35% opacity over F27 with blur(4px) — consistent with F14m1/m2/F11 modal chrome.
7. **No PM3 features** in this modal (no SSO invite method, no SAML domain auto-link). Email-based invite only.
8. **Workspace slot limit** is a soft display counter in PM1 — enforced server-side but no hard block in UI (user sees warning but can still attempt).

### Stitch Prompt (copy-paste)

```
You are designing F27m1 — Invite User Modal for QA Nexus PM1. Picker Modal 720×640 centered over F27 Users & Roles. Handles ongoing team invites after Day-0 bootstrap; distinct from F07 Step 3 (one-time founder bulk invite).

HEADER (64px): "Invite to QA Nexus" DM Sans 20/700 + sub "Send invites to join Iksula Services Pvt Ltd · they'll receive an email with a set-password link" Inter 13 tertiary + close ×.

CONTEXT STRIP (40px raised bg): "WORKSPACE: Iksula Services Pvt Ltd" left · "4 of 25 invite slots remaining this month" mono right.

EMAIL CHIP INPUT (140px): Label "EMAIL(S) *" uppercase mono · chip input 240px tall accepting comma/newline paste · helper "Paste multiple emails. Max 25 per invite."

PER-USER TABLE (200px scrollable, show 3 rows for render):
- Bulk-apply row top: "Apply to all: Role [QA Engineer ⌄] · Projects [Iksula Returns, Iksula Commerce ⌄] · [Apply to all 3 emails]" teal ghost button
- Row 1: sanjay.gupta@iksula.com · QA Engineer (teal chip) · Iksula Returns · Senior QA ✓ · ×
- Row 2: meena.rao@iksula.com · QA Engineer · Iksula Returns, Iksula Commerce · — · ×
- Row 3: vikram.nair@iksula.com · QA Lead (violet chip, Admin role hidden since inviter is Admin but showing Lead for variety) · Iksula Returns, Iksula Commerce, Iksula Mobile App · N/A (senior only for QA Engineer) · ×

CUSTOM MESSAGE (collapsed by default, 80px when expanded): "PERSONAL MESSAGE (OPTIONAL) ⌃" header with example placeholder.

FOOTER (72px top border): "Sending 3 invites · 2 QA Engineers, 1 Lead" + "Invites expire in 7 days · invitees route to F06b Mode A → F07b Mode A/C" tertiary. Right: Cancel ghost + "Send 3 invites →" teal primary enabled.

DESIGN TOKENS: Canvas F27 dimmed 35% behind scrim + blur. Primary teal #2DD4BF (Send CTA, QA Engineer chip, focus rings). Secondary violet #A78BFA ONLY on QA Lead role chip. Role chip map: QA Engineer teal · Lead violet · Admin red · Stakeholder gray. Inter / DM Sans 20+ / JetBrains Mono on emails, limits, expiry.

ANTI-DRIFT: Send CTA is teal (system action, not AI). Lead inviters see Admin role option HIDDEN. Senior QA checkbox = display label, not RBAC. Modal 720×640 scrim + blur over F27.

Validation checklist: (1) 720×640 centered · (2) Header + context strip + chip input · (3) Per-user table with 3 rows showing role/projects/senior/× per row · (4) Bulk-apply row · (5) Custom message collapsible · (6) Footer counts + F06b/F07b route mention + Cancel/Send · (7) Role chip colors per map · (8) Admin hidden for Lead inviter · (9) Existing-user warning example · (10) No PM3 SSO · (11) Focus rings

Generate ONLY this frame. Wait for approval.
```

---

## §7. F28 — Settings & Audit (Workspace Control & Immutable Audit Log) — Lead/Admin Only

[Content truncated for length — follows exact structure from source file: 6 tabs (General, Branding, Data Retention, Integrations Health, Audit Log, Billing), left tab nav (240 px), scrollable content area, immutable append-only audit log with HMAC-SHA256 signatures, 90-day default retention (configurable 2y max for PM1), cross-references, and Stitch prompt. See source F28_Settings_Audit.md for full details.]

### Stitch Prompt (Summary)

Create frame F28 — Settings & Audit Log for QA Nexus PM1. Workspace control & audit center. Answers "How is the workspace configured, and what's happened here?"

**Layout:** 1600 × 1024 desktop. Left rail (272 px), top bar (56 px). Main canvas: left tab nav (240 px pinned) + scrollable content area.

**Audit log (most critical):** 7 columns (Timestamp, Actor, Action, Target, Project, Details, Verification). Filter by actor, action, project, date, full-text search. Export CSV / PDF / schedule weekly. IMMUTABLE append-only, HMAC-SHA256 signed, 90 days default (configurable up to 2 years for PM1, 7 years immutable for PM3+).

**Role gating:** Lead (read-only audit, CSV export). Admin (full access + PDF export). QA Engineer + Stakeholder hidden.

**Anti-drift line:** Apply 01_SYSTEM.md. Primary=#2DD4BF, Secondary=#A78BFA, Canvas=#111827, Raised=#1A2233, Overlay=#232C3F. Audit log immutability, HMAC-SHA256 signatures, 90-day retention (PM1). Role gating: Lead (read-only) + Admin (full). F28 GOVERN-gated (HIDDEN from QA Engineer/Stakeholder).

**Target line count:** 420–480 lines

---

## Generation Order (Critical)

**Canonical order per Stitch (do not reorder):**

1. **F23 → F24 ⭐ PAUSE AND VALIDATE AI VALUE DASHBOARD** — most detailed frame, leadership-critical
2. F25 (Prove mode, verify ivory canvas)
3. F26 (verify GOVERN section, role-gating)
4. F27 (verify access control UI)
5. F28 (verify immutable audit log, HMAC signatures)

**Quality gate before deployment:**
- F23: role gating (QA Engineer Daily Status only), A1/A4 provenance labels + evidence links, Prove mode PDF export working
- F24 ⭐: all 4 hero metrics with full provenance footers, per-agent cards (A1/A2/A4), trend chart, per-project table, per-team (if applicable), data provenance footer, Prove mode toggle + render to ivory canvas, all drill links working
- F25: Prove mode locked (no toggle), go/no-go indicator, ROI tile with formula grid, 5 readiness gates, A4-generated recommendations with drilldown, approval chain, PDF export working
- F26: 3 agent cards (A1/A2/A4), config editable (Admin only, greyed for Lead), eval history + failing case modals, decision stream + modals, guardrail log, pause/resume + rollback buttons (Admin only)
- F27: invite section (email chip input, role dropdown, project multi-select), current team table (7 columns), edit modal (form + info columns), role matrix sidebar (4 cards), pending invites section (resend/revoke), audit feed (last 14 days)
- F28: 6 tabs (General / Branding / Data Retention / Integrations Health / Audit Log / Billing), audit log table (7 columns, searchable, filterable, exportable), HMAC-SHA256 signatures visible, immutable append-only note, 90-day retention default (configurable 2y max)

---

## Appendix: Anti-Drift Checklist

Before submitting any of these 6 frames to Stitch:

- [ ] Brand name "QA Nexus" (never "Evidence Mesh")
- [ ] Primary #2DD4BF teal (never #44e2cd or #cebdff)
- [ ] Secondary #A78BFA violet (AI-only)
- [ ] Canvas #111827 (operate) or #FAFAF8 (Prove: F24, F25 only)
- [ ] No tertiary color, no orange/coral/pink
- [ ] No Material Design 3 tokens
- [ ] No Tailwind config.extend
- [ ] Top bar: 8 slots (logo, project switcher dropdown, search, +, bell, theme, mode toggle, avatar)
- [ ] Left rail: Home + PLAN / AUTHOR / RUN / ANALYSE (with QA Value Lead+) / GOVERN (Lead+/Admin)
- [ ] Mode toggle visible (Operate/Review/Prove) on all main frames except F06/F07 pre-auth
- [ ] Role gating: QA Engineer hidden from ANALYSE > QA Value + entire GOVERN section
- [ ] F24: Prove mode toggle top-right, canvas transitions to #FAFAF8 ivory + white cards + Geist Mono 48/56
- [ ] F25: Prove mode LOCKED (no toggle), always ivory canvas
- [ ] F26/F27/F28: Lead (read-only or limited), Admin (full control), others hidden
- [ ] F23/F24/F26/F27/F28: AI provenance labels + confidence % + evidence links on all AI outputs
- [ ] F24 Hero metrics: 4 cards with full provenance footer (formula, data source, timestamp)
- [ ] F24 Per-agent: A1/A2/A4 cards with drill links to detail modals
- [ ] F24 Trend chart: stacked bars + overlay line, tooltip on hover
- [ ] F24 Per-project table: 8 columns, sortable, click row for modal
- [ ] F25 ROI tile: formula grid showing 242% net vs 342% headline
- [ ] F25 Readiness gates: 5 checkboxes with pass/pending/fail status
- [ ] F28 Audit log: immutable append-only note, HMAC-SHA256 signature visible, 90 days default
- [ ] All frames: realistic Iksula Commerce data (Sprint 42, R-2026-04-PaymentV2, team roster)
- [ ] All frames: Geist Mono for metrics/KPIs, Inter for body/labels, DM Sans for questions

---

**Total consolidated file line count (target):** 3,500–4,200 lines  
**All 5 frames:** F23 (380–420) + F24 (500+) + F25 (320–380) + F26 (380–420) + F27 (350–400) + F28 (420–480)
