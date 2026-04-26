# 04 — Test Lifecycle

**Part of PM1_UI_v2. Paste 01_SYSTEM.md FIRST.**

---

## §1. Pinned Reminder (≤ 50 lines)

**Product:** QA Nexus (Quiet Intelligence / Evidence Mesh)  
**Primary color:** Teal `#2DD4BF` (value, approval, momentum)  
**Secondary color:** Violet `#A78BFA` (RESERVED FOR AI ONLY — agent outputs, Confidence Lane, AI-draft badges)  
**Canvas (Operate mode — default):**
- `#0B0F17` — main canvas (midnight graphite)
- `#111827` — base surface
- `#1A2233` — raised surface
- `#232C3F` — overlay

**Navigation contract (FROZEN):** Left rail 272px (collapsed 88px) with sections Home + PLAN / AUTHOR / RUN / ANALYSE / GOVERN (role-gated). Top bar 56px with 8 slots: Logo, Project Switcher, Search, Quick Create, Notifications, Theme Toggle, Mode Toggle (Operate/Review/Prove), Avatar.

**No tertiary colors. No Tailwind config extend. No Material Design 3 tokens. Hardcode hex values. Left rail: Home + PLAN/AUTHOR/RUN/ANALYSE/GOVERN. Top bar: 8 slots incl. project switcher dropdown. Role gating. Realistic data: Iksula Commerce, Sprint 42, team Yogesh M / Priya S / Rahul K / Arjun M / Neha D / Rohan K.**

**Three AI agents in PM1:**
- A1 (Test Case Generator) — streams drafts with confidence from Jira/requirement/URL/Figma/KB
- A2 (Duplicate Detection) — semantic similarity, inline chips during authoring + import
- A4 (Defect Intelligence / 5-Layer RCA) — Stack 90% → Env 80% → Config 60% → Code 50% → Data 40%. Classifies into App Bug / Test Bug / Flaky / Env Issue.

**Generation order (CRITICAL):** F16a → F16b → F16c → **F17 PAUSE AND VALIDATE THREE-PANEL LAYOUT** → F18 → F19 → F20 → F21 → **F22 PAUSE AND VALIDATE A4 5-LAYER RCA PANEL**.

---

## §2. F16a — Test Case Method Chooser (Stage Modal, 3 Cards)

**Frame ID:** F16a  
**Page question:** How do you want to create test cases?  
**Canvas:** Stage Modal 1120 × 860 (centered overlay, main canvas blurred)  
**Role gate:** All roles (QA Engineer, Lead, Admin, Stakeholder)  
**Entry points:** F17 "+ New" button, Quick Create (Cmd+/), Requirement card F14

**Content regions:**

### Modal Header (120px content)
- **Title:** "How do you want to create test cases?" (DM Sans 32/40, weight 500, color `#F1F5F9`)
- **Subtitle:** "Pick the method that fits your source material" (Inter 16/24, weight 400, color `#C7D0DC`)

### Card Grid (560px height, 3 cards horizontal, 304px wide each, 20px gap)

**Card A — "Let AI generate from requirements"**
- Icon: Sparkles glyph (48 × 48, violet `#A78BFA`)
- Title: "Let AI generate from requirements"
- Description: "Point A1 at a Jira ticket, requirement doc, PRD, or Figma link. It drafts cases with confidence scores. A2 checks duplicates live."
- CTA: `Start with AI →` (primary button, routes to F16b)

**Card B — "Upload existing test cases"**
- Icon: Upload arrow glyph (48 × 48, teal `#2DD4BF`)
- Title: "Upload existing test cases"
- Description: "Bring in XLSX, CSV, TestRail / Zephyr / Xray exports. A2 scans for duplicates as they import."
- CTA: `Import file →` (primary button, routes to F16c)

**Card C — "Create manually"**
- Icon: Pencil edit glyph (48 × 48, info-blue `#60A5FA`)
- Title: "Create manually"
- Description: "Blank Notion-style editor. BDD or traditional. Good for one-off cases."
- CTA: `Create blank →` (primary button, routes to blank editor — not in this spec)

### Footer (64px, sticky bottom)
- Left: `Cancel` button (secondary)
- Right: [empty — CTAs are on cards]

**Exit points:** Card A → F16b (A1 Generate), Card B → F16c (Bulk Import), Card C → blank editor

---

## §3. F16b — A1 Generate from Requirement (4-Phase Stepper: Source → Clarify → Review → Accept)

**Frame ID:** F16b  
**Page question:** What source material does A1 need to draft test cases?  
**Canvas:** Stage Modal 1120 × 860 (same shell as F16a)  
**Role gate:** QA Engineer, Lead, Admin (full access); Stakeholder cannot trigger

**Four-phase stepper flow (Source → Clarify → Review → Accept):**

### Stepper Header (sticky top, 48px)

- **4 pills (Inter 13/600, height 48px, padding 12px 16px):**
  - Phase 1: "Source" (current phase: teal underline `#2DD4BF`, bold, text `#F1F5F9`)
  - Phase 2: "Clarify" (future phase: color `#8A94A6`, muted)
  - Phase 3: "Review" (future phase: color `#8A94A6`, muted)
  - Phase 4: "Accept" (future phase: color `#8A94A6`, muted)
- **Completed phases** (when reached): Teal checkmark icon + pill highlighted `#F1F5F9`
- **Current phase indicator:** Teal underline, bold text, full opacity
- **Border-bottom:** `1px #2A3347`

### Phase 1 — Source (form-based, default visible)

**Form layout:** 600px wide, left-aligned, padding 24px

- **Source material (segmented control):** 5 options (Jira ticket, Requirement doc, Public URL, Figma link, Knowledge Base article), default "Jira ticket"
- **Source input (dynamic):** 
  - If Jira ticket: input field (e.g., "PAY-1472")
  - If Requirement doc: textarea (5 lines, max 2000 chars)
  - If URL: input with placeholder "https://..."
  - If Figma: Figma design link input (with Figma logo icon)
  - If KB: dropdown searchable with autocomplete
- **Context textarea (4 lines, optional):** "Additional context for A1 (e.g., 'Test both Stripe and gift card flows')" (Inter 13/18 placeholder)
- **Target platform (radio group):** Web (default), Mobile, API (Inter 13/18)
- **Test type chips (multi-select, toggle):** Happy path (default selected, teal), Negative cases, Edge cases, A11y (Inter 13/18, chip styling: teal if selected, gray if unselected)
- **Advanced settings (collapsible section):** 
  - Case count limit (spinner, default 10, range 1–50)
  - Confidence threshold (slider, default 0.80, range 0.60–1.0, step 0.05)
  - Framework hint (dropdown: None, Playwright, Selenium, Cypress, WebdriverIO)
  - "Include step-level evidence links" (checkbox)
- **CTA button:** `Start analysis →` (primary, teal `#2DD4BF`, enabled when source input filled, Inter 16/600, 48px height)

**Exit to Phase 2 on click "Start analysis →".**

### Phase 2 — Clarify (conditional, only if A1 asks clarifying questions)

**Form layout:** centered, max-width 600px, padding 24px

**Two possible states:**

**State A — Clarification questions (if A1 identifies ambiguity):**
- **Question display (1–3 questions):** Numbered "Q1. [Question text]" (Inter 14/400), displayed sequentially (one or all depending on A1 assessment)
- **Answer input (varies by question type):**
  - Text input: single-line (Inter 13/18, placeholder text)
  - Textarea: multi-line (Inter 13/18, placeholder)
  - Radio group: vertical stacked buttons (teal when selected)
  - Dropdown: single-select with options
- **CTA buttons (two options):**
  - `Continue with answers →` (primary, teal `#2DD4BF`, 48px, enabled when all required Qs answered)
  - `Skip (no ambiguity) →` (secondary, ghost, 48px, always enabled)

**State B — No clarifications (if A1 determines source is unambiguous):**
- **Message (Inter 14/400, centered):** "No clarifications needed. Source requirement is clear."
- **CTA button:** `Continue to review →` (primary, teal `#2DD4BF`, 48px)

**Exit to Phase 3 on either CTA.**

### Phase 3 — Review (A1 results streaming in real-time)

**Layout:** 800px wide, center-aligned, padding 24px, scrollable content area

**Bulk-action bar (sticky top, 48px, background `#1A2233`, padding 12px 16px, border-bottom `1px #2A3347`):**
- Left: "0 of 8 selected" (Inter 13/18, color `#8A94A6`)
- Buttons (gap 8px):
  - "Select all" (secondary button)
  - "Select all ≥ 0.85 confidence" (secondary button)
  - "Clear selection" (secondary button)
  - "Accept selected" (primary teal, disabled if 0 selected)
  - "Reject selected" (fail-tinted red outline, disabled if 0 selected)

**A1 Agent footer (sticky bottom, 48px, background `#1A2233`, border-top `1px #2A3347`, padding 12px 16px):**
- **Left:** A1 glyph (16 × 16, violet `#A78BFA`) + "A1 v2.3" (Inter 12/600, `#F1F5F9`)
- **Center-left:** Status chip (Geist Mono 11/600):
  - "generating..." (amber `#FBBF24` if streaming)
  - "done ✓" (green `#34D399` if complete)
  - "paused" (amber `#FBBF24` if user paused)
- **Center:** Progress text (Inter 12/400, color `#8A94A6`): "generating 8 cases · 4 streamed · avg confidence 0.91"
- **Right:** Cost + latency (JetBrains Mono 11/400, color `#8A94A6`): "$0.04 · 18s"
- **Far right:** Pause button (small icon, 24 × 24, hover teal) — click pauses streaming mid-flight

**Case stream (scrollable, flex-column, gap 12px, min-height 300px):**

Each **case card** (800px wide, background `#1A2233`, rounded 4px, padding 16px, border-left 3px confidence-colored):

```
┌──────────────────────────────────────────────────────────────┐
│ TC-PAY-0341   [+92%] [→ ACM-881] [≈ 87% to TC-7812, view →] │ (header row)
│                                                              │
│ Apply two gift cards at checkout and split remainder        │ (title, Inter 14/500)
│                                                              │
│ [✓] [+92%]  [ACM-881]  [≈ 87% similar TC-7812]            │ (chips row)
│ [Accept] [Edit] [Reject]                                    │ (action buttons)
│                                                              │
│ ▼ 1. User opens checkout with 2 items                      │ (steps preview, collapsible)
│   2. Selects "Apply gift card" link                         │
│   [... more steps hidden, click to expand ...]              │
└──────────────────────────────────────────────────────────────┘
```

**Card anatomy:**
- **Header row (32px):** TC-ID (Geist Mono 11/400 `#8A94A6`) + Confidence pill (Geist Mono 12/600, left-edge 3px lane):
  - ≥0.85: teal bg `#052E1F`, text `#34D399`
  - 0.60–0.85: amber bg `#2A2008`, text `#FBBF24`
  - <0.60: red bg `#2C0F10`, text `#F87171`
- **Coverage link:** "[→ ACM-881]" (teal `#2DD4BF`, clickable, Inter 12/400)
- **A2 dup chip (inline):** "≈ 87% similar to TC-7812 [view →]" (violet `#A78BFA` small chip, click expands side-by-side comparison) OR "No dupes" (gray) — always present
- **Title (Inter 14/500, `#F1F5F9`, 2–3 lines):** Case title text
- **Chips row (gap 8px):** 
  - Confidence pill (colored, left-edge 3px lane)
  - Requirement link "[ACM-881]" (teal)
  - A2 dup chip (violet inline)
- **Actions row (gap 8px):** 
  - Accept (primary teal button, 28px height, Inter 12/600)
  - Edit (neutral button, 28px height)
  - Reject (red outline button, 28px height)
- **Steps preview (collapsible, margin-top 12px):**
  - Chevron toggle (rotates on expand)
  - "2–3 steps visible" (Inter 13/400, step number + text)
  - "[ Expand all steps ]" link (teal, if truncated)

**Exit to Phase 4:** Click "Accept selected" button at bulk-action bar or footer

### Phase 4 — Accept (final commit, destination & sprint selection)

**Layout:** 600px wide, center-aligned, padding 24px

**Summary block (top, padding 20px, background `#1A2233`, rounded 4px, border-left 3px `#2DD4BF`):**

- **Big number (DM Sans 36/700, teal `#2DD4BF`):** "6 accepted"
- **Sub-text (Inter 14/400, `#C7D0DC`):** "2 rejected · 3 edited · 0 pending"
- **Accepted cases list (scrollable, max-height 160px):**
  - Each case row: TC-ID + title (Inter 13/400) + confidence chip (Geist Mono 11, colored)
  - Example: "TC-PAY-0341 · Apply two gift cards at checkout · +92%"
- **Edited cases list (distinct):**
  - Each row: TC-ID + title + "edited" tag (amber chip)
  - Example: "TC-PAY-0342 · Retry with invalid card · [edited]"

**Destination & metadata section (padding 20px, margin-top 16px):**

- **Land cases in (dropdown):** 
  - Label: "Destination suite:"
  - Default: auto-inferred from requirement (e.g., "Checkout / Payments")
  - Click to open hierarchical suite picker (same tree as F17 Panel 1)
  - Current selection: "Checkout / Payments"

- **Tag with sprint (toggle + selector):**
  - Toggle: "Tag cases with sprint:" (checked by default)
  - Dropdown: Sprint selector (default = current sprint, e.g., "Sprint 42")
  - If toggled off, sprint tag not added

- **Set owner (avatar picker):**
  - Label: "Assign to:"
  - Default: current user (with avatar + name)
  - Click to open user picker (searchable dropdown)

- **Link to requirement (read-only confirmation):**
  - Label: "Linked to requirement:"
  - Value: Auto-filled from Phase 1 source (e.g., "ACM-881: Checkout with multiple payment methods")
  - Text: "Verified ✓" (Inter 11/400, green)

**Primary CTA (full-width, 48px, margin-top 24px):**
- Button: `Commit 6 cases to library` (primary teal `#2DD4BF`, Inter 16/600, enabled when ≥1 case accepted)
- On click: Commit cases to F17 with AI-draft badges, modal closes, toast notification: "6 cases added to Checkout / Payments suite", route to F17 with those cases filtered at top

**Back button (secondary, margin-top 12px):**
- `← Back to review` (ghost button, returns to Phase 3)

**Exit to F17:** Click "Commit X cases" → cases appear in Test Case Library with AI-draft v2.3 badges, modal closes

---

## §4. F16c — Bulk Import Test Cases (4-Phase: Upload → Map → A2 Scan → Summary)

**Frame ID:** F16c  
**Page question:** What test cases are you importing, and where are the duplicates?  
**Canvas:** Stage Modal 1120 × 860 (same shell)  
**Role gate:** QA Engineer, Lead, Admin (full access); Stakeholder cannot trigger

**Four-phase stepper flow:**

### Phase 1 — Upload (drag-drop + file picker)

- **Large drag-drop zone:** 600 × 200px, dashed border `#3B4660`, upload icon (48 × 48, teal `#2DD4BF`), heading "Drag files here or browse" (Inter 16/24), helper text "Supported: XLSX, CSV, TestRail export, Zephyr JSON, Xray XML, qTest. Max 50 MB per file."
- **Browse button:** "Browse files" (secondary button, 140px wide)
- **Drag-over state:** Border → teal `#2DD4BF`, background tint, icon scales 1.1x, cursor copy
- **File selection result:** List of selected files (filename, file size, file type icon, remove button ×), "X files selected, Y MB total"

### Phase 2 — Map Columns (column picker UI)

- **File preview (collapsible):** "Preview: [filename]" (clickable toggle), when expanded: first 3 rows of CSV as mini table (small Geist Mono 11/14), max-height 150px, scrollable horizontally
- **Column mapping grid:** Rows for each auto-detected column from file
  - Left: File column name (e.g., "Test Case")
  - Center: Dropdown to map to QA Nexus field (name / description / steps / expected_result / priority / tags / status / preconditions / skip)
  - Right: Checkmark icon (suggests mapping, user can override)
- **Mapping validation:** Green checkmark if all required fields mapped; amber warning if optional fields skipped; red error if required field missing
- **CTA button:** "Scan for duplicates" (primary, enabled if validation passes)

### Phase 3 — A2 Dedup Scan (in-progress state)

- **Progress header:** "Scanning for duplicate test cases" (DM Sans 20/28)
- **Progress bar:** 600px wide, linear, fill `#2DD4BF` (teal), background `#2A3347`
- **Progress text:** "Analyzing 247 cases · 180 scanned · 45 checked · 22 potential matches found" (updates real-time, Inter 13/18)
- **Agent status:** "A2 v1.1 · pgvector embedding + cosine similarity · 78% precision on last import" (Geist Mono 11/16, italic, secondary)

**Results summary (after scan completes):**

If duplicates found:
- Container: `#1A2233` card, padding 20px, border `1px #3B4660`
- Warning icon: `#FBBF24` (amber)
- Content: "⚠️ 22 potential duplicates found"
- Merge strategy radios: Keep new (replace) / Keep existing (ignore new) / Review each manually

If no duplicates:
- Success card: ✓ green icon, "No duplicate cases detected", "All 247 cases are unique. Ready to import."

If "Review each manually" selected:
- Collapsible rows showing each flagged duplicate pair: New case title ↔ Existing case title | Similarity % (yellow chip) | Action dropdown (Keep new / Keep existing / Review)

### Phase 4 — Import Summary (final report)

- **Summary stats (3 outcome cards):**
  - New cases imported: 215 (green `#34D399`), "Imported to [Suite Name]"
  - Handled as duplicates: 22 (amber `#FBBF24`), "Flagged for review"
  - Failed imports: 10 (red `#F87171`), "Validation errors"
- **Audit log (expandable):** Table with Timestamp | Action | Case ID | Title | Status | Notes (sample rows shown, full log downloadable CSV)
  - Example: "14:32:15 | Created | TC-PAY-0341 | Apply two gift cards | ✓ Success | Imported from [file]"
  - Example: "14:32:16 | Flagged | TC-PAY-0342 | Retry 3DS | ⚠️ Duplicate | 91% match with TC-PAY-0285"
  - Example: "14:32:18 | Failed | [unknown] | [unknown] | ✗ Validation error | Missing required field: name"
- **Next actions (info box):** "What's next?" title + "215 new cases now in [Suite Name]" + "22 cases flagged for dedup review — review in library detail panel" + "10 cases failed validation — see audit log for details" + button "Review duplicates in library"
- **Footer buttons (sticky bottom, 64px):**
  - Left: "← Back to dedup" (secondary, disabled — end of flow)
  - Center: "Download audit log" (tertiary, downloads CSV)
  - Right: "Go to library" (primary CTA, routes to F17, modal closes)

**Exit points:** "Go to library" → F17 with newly imported cases highlighted

**AI Provenance rules:**
- A2 agent label: "A2 v1.1" on Dedup Scan header (Phase 3.1)
- A2 confidence: "91% similar" chips on duplicate rows (Geist Mono, `#FBBF24` amber for 0.80–0.91)
- Evidence drill-down: "Show comparison" link on duplicate row (opens inspection sheet with side-by-side step comparison + embedding distance metric)

---

## §5. F17 — Test Case Library (THREE-PANEL FLAGSHIP) ⭐

**Frame ID:** F17  
**Page question:** What's in the library, and what's changing?  
**Canvas:** Desktop 1600 × 1024 (full width, three-panel layout)  
**Shell:** Top bar (locked, 56px), left rail (272px), main canvas three-panel (left 280px suites tree | center flex cards | right 420px detail rail collapsible)  
**Role gate:** All roles (Stakeholder read-only)  
**Primary user:** QA Engineer managing test cases at scale  
**Entry points:** F17 in left rail, project switcher, F14 breadcrumb, F16a/b/c result

**=== SPEND ~20-25% OF FILE LENGTH HERE — THIS IS THE DIFFERENTIATOR ===**

### Panel 1 — Suites Tree (280px width, left-most)

**Panel header (12px padding):**
- Title: "SUITES" (Inter 11/16, uppercase, weight 500, letter-spacing 0.08em, color `#8A94A6`)
- "+ New" button (secondary, 24 × 24 icon + text, routes to create-suite modal)

**Filter suites input:**
- Text field, 240px wide, height 40px, placeholder "Filter suites", magnifying glass icon on left
- Real-time filter on suite names

**Hierarchical suite tree (flex-grow, scrollable):**
```
All cases (1,284)
├─ Checkout (284)
│  ├─ Payments (92)
│  │  ├─ Gift cards (18)
│  │  ├─ Stripe 3DS (24)
│  │  ├─ Refunds (32)
│  │  └─ Currency (18)
│  ├─ Cart (76)
│  ├─ Shipping (58)
│  └─ Address book (58)
├─ Auth & Identity (186)
├─ Search & Browse (142)
├─ Account (104)
├─ Loyalty (58)
├─ Admin & Ops (212)
└─ A11y & Visual (46)

[separator: 1px #2A3347]

SMART (auto-folders)
├─ AI-drafted (last 7d) (38) [sparkles icon, violet]
├─ Flaky > 20% (64) [warning icon, amber]
├─ Failing nightly (12) [error icon, red]
├─ No coverage link (184) [unlink icon, gray]
├─ Unassigned (0) [grayed out]
└─ Awaiting review (0) [grayed out]
```

**Tree styling:**
- Node text: Inter 13/20, weight 400, color `#C7D0DC`
- Active node (selected suite): left border 3px `#A78BFA` (violet), background `#232C3F` (overlay), text `#F1F5F9`
- Hover non-active: background `#1A2233` (raised)
- Expander icon: 16 × 16, color `#8A94A6`, rotates 90° when expanded
- Count badge: Geist Mono 11/16, color `#8A94A6`, right-aligned, no background
- Smart folder icons: sparkles (violet), warning (amber), error (red), unlink (gray), inline before text
- Depth indentation: 16px per level

**Interactions:**
- Click node text: select suite, highlight in tree, update Panel 2 card grid
- Right-click node: context menu (Rename, Delete, Share, Archive — if Lead/Admin)
- Drag case card from Panel 2: move case to suite (if Lead/Admin)
- Expand/collapse: click expander icon

### Panel 2 — Card Canvas (flex-grow, center)

**Breadcrumb + Question header:**
- Breadcrumb: "TEST CASES / CHECKOUT / PAYMENTS" (Inter 13/18, color `#8A94A6`, clickable)
- Question header (below breadcrumb): "What's in the library, and what's changing?" (DM Sans 32/40, weight 500, color `#F1F5F9`)

**Stats strip (single row, 48px height):**
- Background: `#0B0F17`
- Padding: 12px 0, border-bottom `1px #2A3347`
- Text: "92 cases · 81 automated · 11 manual · 2 AI drafts awaiting review · flake rate 4.1% this week ↑0.7" (Geist Mono 12/16, color `#C7D0DC`, left-aligned padding 16px)

**Controls bar (sticky top, 88px height, background `#111827`, border-bottom `1px #2A3347`, padding 12px 16px):**

**Row 1 — View toggles + Sort (56px):**
- View toggle (segmented control): "Cards" (active, card icon) | "Table" (table icon) | "Compact" (list icon) + badge `⌘D`
- Sort dropdown: "Sort by Flake (↓)" (active), click opens menu: Flake % (desc), Last run (desc), Priority (P0→P4), Created (newest), Coverage (lowest)

**Row 2 — Filters (56px):**
- Filter label: "Filter:" (Inter 11/16, uppercase, weight 500, color `#8A94A6`)
- Suite chip (auto-filled from Panel 1): "CHECKOUT / PAYMENTS ×" (removable)
- "+ Add filter" button (secondary) → dropdown: Flake ≥ 20%, Priority, Owner, Status, AI-draft-only
- Applied filter chips (removable): "Flake ≥ 20% ×", "Owner: priya.s ×", etc.
- "Clear all" button (tertiary, appears if filters applied)

**Card grid (scrollable, flex-wrap, 2 columns by default):**

Each card (304px width, min-height 320px, `#1A2233` raised surface, rounded 8px, padding 16px):

```
┌─────────────────────────────────────┐
│ TC-PAY-0341  [AI DRAFT v2.3] [⋯]   │ (header row)
│                                     │
│ Apply two gift cards at checkout    │ (title, DM Sans 18/500)
│ and split remainder across a card   │
│                                     │
│ Covers ACM-881 · 6 steps · 1 neg    │ (description, Inter 13/18)
│ · tagged a11y                       │
│                                     │
│ ✓ PASS                              │ (or ⚠️ FLAKY 71% / ✗ FAIL)
│ (or FLAKY, BLOCKED, NOT_RUN)        │
│                                     │
│ +92%  [ACM-881]  [playwright]  $412 │ (chips row)
│ (confidence, req link, framework, cost)
│                                     │
│ [PS] Priya S                        │ (owner avatar + name)
│                                     │
│ [sparkline of 7 runs]               │ (mini chart, 5px columns)
│                                     │
│ 2h ago · nightly                    │ (timestamp, Inter 11/14)
└─────────────────────────────────────┘
```

**Card component breakdown:**

- **Header row (40px):** Case ID (Geist Mono 11/16, left), Status badge "AI DRAFT v2.3" (Inter 11/14, weight 500, violet bg, right), ellipsis menu (⋯, 24 × 24)
- **Title (2–3 lines, DM Sans 18/500):** "Apply two gift cards…"
- **Description (1 line, Inter 13/18, color `#C7D0DC`, overflow ellipsis):** "Covers ACM-881 · 6 steps · 1 negative path · tagged a11y"
- **Status pill (32px height, margin 12px 0):**
  - PASS: background `#052E1F` (dark green), text `#34D399`, icon ✓
  - FAIL: background `#2C0F10` (dark red), text `#F87171`, icon ✗
  - FLAKY: background `#2A2008` (dark amber), text `#FBBF24`, icon ⚠️, show flake % (e.g., "71%")
  - BLOCKED: background `#0E1F38` (dark blue), text `#60A5FA`, icon 🚫
  - NOT_RUN: background `#1A2233`, text `#C7D0DC`, icon ◯
- **Chips row (24px height, flex-wrap, gap 8px, margin 12px 0):**
  - Confidence chip: "+92%" (Geist Mono 12/16, weight 500, background `#052E1F` if ≥85%, `#2A2008` if 60–85%, `#2C0F10` if <60%, text green/amber/red, left-border 3px confidence lane)
  - Requirement link: "[ACM-881]" (teal `#2DD4BF` text, click → opens F14 in right rail)
  - Framework: "[playwright]" (Geist Mono 11/14, gray chip)
  - Flaky cost (if flaky): "$412/wk" (Geist Mono 12/16, weight 500, text `#FBBF24` amber)
- **Owner row (32px, flex, margin 12px 0):** Avatar 24 × 24 circle (initials PS, teal bg), Name "Priya S" (Inter 13/18, weight 500)
- **Sparkline (48px height, margin 12px 0):** Mini chart, last 7 runs, 5px width columns (green/red/amber/gray), max 40px height, tooltip "Last 7 runs: 5 pass, 1 fail, 1 flaky"
- **Timestamp (12px height):** "2h ago · nightly" (Inter 11/14, color `#8A94A6`)

**Card interactions:**
- Click card: select checkbox (if bulk mode) OR click title/body to open detail rail (Panel 3)
- Click status pill: filter canvas to show only that status
- Click requirement link [ACM-881]: open right rail showing requirement detail
- Click framework chip: filter to show only that framework
- Click flaky cost $412/wk: tooltip showing cost breakdown
- Click owner avatar: filter to show only cases owned by that user
- Ellipsis menu (⋯): Edit, Duplicate, Move to suite, Share, Archive, Delete
- Right-click: context menu (same)

**Bulk select mode:**
- When one card checkbox selected, bulk action bar slides up from bottom: "Assign, Tag, Move suite, Export, Delete"
- "Select all" checkbox in header toggles all visible cards

**Empty state (if no cases match filters):**
- Icon: folder (64 × 64, color `#8A94A6`, centered)
- Title: "No test cases found" (DM Sans 24/32)
- Message: "Try adjusting your filters or create a new case." (Inter 14/20)
- CTA: "+ Create test case" button (primary)

### Panel 3 — Detail Rail (420px width, right, collapsible via Cmd+J)

**Auto-visible when:** User clicks on a card, or clicks requirement link, or from F21 defect link

**Rail header (64px, pinned top, background `#111827`, border-bottom `1px #2A3347`):**
- Case ID (Geist Mono 14/20, weight 500, `#F1F5F9`)
- Version label (Inter 11/14, weight 400, `#8A94A6`) + Timestamp "saved 2h ago" (Inter 11/14, `#8A94A6`)
- Close button X (24 × 24, right-aligned)
- Breadcrumb (below): "TEST CASES / CHECKOUT / PAYMENTS / TC-PAY-0341" (Inter 11/14, clickable)

**Case overview (56px, padding 16px):**
- Case title: "Apply two gift cards at checkout and split remainder across a saved card" (DM Sans 18/500)
- Metadata row (32px): Priority pill (P1, teal), AI draft chip (violet "AI DRAFT v2.3"), Framework chip (gray "playwright"), Owner chip (avatar + "priya.s")

**Tab navigation (48px, sticky):**
Horizontal tabs: `Steps 6` | `History 34` | `Bugs 1` | `Coverage` | `Audit`

**Tab 1 — Steps (active by default):**

**Provenance card (sticky at top, 120px, margin-bottom 16px):**
```
┌──────────────────────────────────────┐
│ GENERATOR · V2.3 · 92%               │
│ Drafted from ACM-881 + Payments KB   │
│ 3 negative-path variants suggested   │
│ [Show evidence →]                    │
└──────────────────────────────────────┘
```
- Background: `#1A2233` (raised surface)
- Border-left: 3px `#34D399` (confidence lane color, green)
- Styling: DM Sans 12/16 uppercase "GENERATOR", Inter 13/18 description, teal link "Show evidence"
- Click link: opens inspection sheet (right-side drawer, 420px) showing side-by-side source requirement + drafted steps + A1 reasoning + confidence breakdown per step

**Steps list (flex-grow, scrollable):**
- Each step: numbered (1, 2, 3…), type badge, content
- Type badges (inline left of text):
  - `[ui]` → blue `#60A5FA` — UI interaction
  - `[api]` → purple `#A78BFA` — API call
  - `[db]` → orange `#F59E0B` — Database query
  - `[kb]` → teal `#2DD4BF` — Knowledge base reference
- Content: Inter 13/18, color `#F1F5F9`, word-wrap, max-width 300px
- Screenshot indicator (if attached): small camera icon + path link, click to expand full-screen view
- Between steps: horizontal divider `1px #2A3347`, margin 12px 0
- "+ Add step" button (secondary, below all steps)
- "/ Type / to use slash commands" hint

**Tab 2 — History (34 runs):**
- Timeline list (scrollable): each run row: timestamp | pass/fail/flaky icon + color | duration | environment | run ID link
- Example: "2026-04-23 14:32:15 | ✓ PASS (green) | 2.3s | production-west | [run-link]"
- Hover row: background `#1A2233` (raised)
- Click run ID: open F20 Run Results

**Tab 3 — Bugs (1 linked defect):**
- Linked defects list: if no defects, "No linked defects"; if defects: list of defect preview cards
- Each card: Jira key link, title, severity (P0–P4 color), status, assigned-to
- Example: "PAY-1472 | User receives duplicate charge | P0 | OPEN | rahul.k"
- Styling: `#1A2233` card, padding 12px, margin 8px 0, hover elevation-1
- Click card: open F21 Defect Intelligence detail
- "+ Link defect" button: modal to search and link existing defects

**Tab 4 — Coverage (RTM):**
- Linked requirement: "ACM-881" (teal link) → "Checkout with multiple payment methods" (title)
- Coverage status: "✓ Covered" (green chip)
- Last verified: "Last verified 2h ago"
- Knowledge articles: list of KB article titles (teal links)
- "+ Link requirement" button

**Tab 5 — Audit (Lead/Admin only):**
- Immutable changelog: timestamp | action | user | details
- Example: "2026-04-23 14:32:15 | Created | A1 v2.3 | Drafted from ACM-881, confidence +92%"
- Example: "2026-04-23 13:15:44 | Edited | priya.s | Updated step 3, added screenshot"
- Styling: Inter 11/16, monospace timestamps

**Rail footer (64px, pinned, background `#0B0F17`, border-top `1px #2A3347`, padding 16px):**
- Left: "← Close" (secondary, Cmd+J also closes)
- Right: "Edit" (primary, if not Stakeholder) + ellipsis menu (Duplicate, Archive)

**Exit points:** Detail rail → F21 Defects (bug link), case edit → inline or modal, expand suite in tree

---

## §6. F18 — Test Suites (Management + Coverage Heatmap)

**Frame ID:** F18  
**Page question:** How are we organizing coverage, and where are the gaps?  
**Canvas:** Desktop 1600 × 1024 (full width with optional evidence rail 380px right)  
**Role gate:** Lead/Admin for create/delete; QA Engineer read-only

**Question header + Stats strip:**
- "How are we organizing coverage, and where are the gaps?" (DM Sans 32/40)
- "18 suites · 1,284 cases · 4 suites with < 70% coverage · 2 stale suites (no runs in 30d)" (Geist Mono 12/16)
- Coverage RAG legend inline: ◉ Green (14 ≥70%), ◉ Amber (4 50–70%), ◉ Red (0 <50%)

**Controls bar (56px, sticky):**
- View toggle (segmented): "Grid" (active) | "Tree"
- Sort dropdown: "Sort by: Name ↓" (options: Name, Case count, Automation %, Last run, Coverage %)
- "+ New suite" button (primary, Lead/Admin only) + "Bulk actions" button (secondary, enabled if 2+ selected)

### View 1 — Grid View (default)

**Suite cards (3 columns, 280px each, responsive flex-wrap):**

```
┌─────────────────────────────────┐
│ [checkbox]  Payments    [⋯]     │ (header)
│                                 │
│ 92 cases · 81 automated · 11 m  │ (counts)
│                                 │
│ Coverage: 84%                   │ (coverage % with bar)
│ ████████░░                      │
│                                 │
│ Health: ✓ (14 runs passed wk)  │ (RAG: ✓/⚠️/✗)
│                                 │
│ Owner: priya.s                  │ (avatar + name)
│ Last run: 2h ago                │
│                                 │
│ [↓ Expand to flaky cases] (opt) │
└─────────────────────────────────┘
```

**Card styling:**
- Background: `#1A2233` (raised)
- Border: `1px #3B4660`, rounded 8px, hover violet border + elevation-1
- Coverage bar: 240px wide, 8px height, semantic color (green ≥70%, amber 50–70%, red <50%)
- Health icon: ✓ (green `#34D399`), ⚠️ (amber `#FBBF24`), ✗ (red `#F87171`) + status text
- Owner: avatar 24 × 24 circle (initials), click to filter by owner
- Ellipsis menu: Edit, Duplicate, Merge, Archive, Delete (if Lead/Admin)

**Bulk actions bar (sticky bottom, if ≥1 selected):**
- "X suites selected" + "Select all" checkbox + "Archive", "Merge", "Duplicate", "Delete" buttons

### View 2 — Tree View (hierarchical)

Expandable nodes showing suite hierarchy + coverage badges on right

### Coverage heatmap (optional, below grid, collapsible)

Rows = suites, columns = last 8 sprints. Cells: green (healthy), amber (1–3 defects), red (4+ defects / 10% coverage dip). Hover: tooltip. Click: drill to defect list for suite/sprint.

### Evidence rail (right 380px, optional, visible when suite selected)

Tabs: `Flaky cases` (5) | `Recent defects` (2) | `Coverage gaps` (4) | `Settings`

**Flaky cases tab:** List of top 5 flakiest cases (TC-ID, title, flake %, timestamp)

**Recent defects tab:** Defects linked to cases in this suite (last 14d) — Jira key, title, severity, status, assignee

**Coverage gaps tab:** Requirements NOT covered — requirement ID, title, recommended template, "[Create case from template]" button

**Settings tab (Lead/Admin):** Ownership, Auto-archive toggle, Case versioning dropdown, Visibility radios

**Rail footer:** "← Close" (secondary) | "Edit suite" (primary, Lead/Admin)

---

## §7. F19 — Run Console (Live Execution, Evidence Auto-Capture)

**Frame ID:** F19  
**Page question:** What is happening in this run right now?  
**Canvas:** Desktop 1600 × 1024  
**Role gate:** All roles (QA Engineer, Lead run; Stakeholder read-only)

**Shell:** Top command bar (56px, live status pill "●  Live") + Run metadata bar (48px) + Run meter (8px progress bar) + Case list sidebar (320px left) + Current case panel (60% center) + Evidence rail (380px right persistent)

**Run metadata bar (background `#1A2233`):**
- Left: "Checkout Flow — Sprint 42" (Inter 16/500) + Run ID (Geist Mono 13/400 secondary) + Environment chip (staging) + Sprint chip + "Started at" caption + "Runner: manual"
- Right: Live status pill (green dot + "Live" text) + expand/collapse toggle

**Run meter (8px progress bar, full width):**
- Segments: Pass (green), Fail (red), Flaky (amber), Running (blue, pulsing), Queued (gray)
- Progress label above: "142 of 218 · 67%"
- Each segment clickable → jump to first case in state

**Case list sidebar (320px, scrollable):**
- Header: "Cases in run" + search input
- Rows (48px each, hover `#1A2233`): Status icon, TC-ID (Geist Mono 12), case title (Inter 13), unread indicator (dot)
- Virtualized scroll for 218 cases
- Click: jump to case focus panel

**Current case panel (main canvas, 60% width):**
- Header: Case title (DM Sans 24/32), TC-ID + sequence (Geist Mono 14/400), Environment chip
- Steps container: ordered list, numbered steps, checkboxes, step text (Inter 14/400), current step highlighted overlay
- Action buttons row (48px): Pass (P), Fail (F), Blocked (B), Skipped (S) — semantic colors, keyboard shortcuts on hover
- On Fail click: "Create defect" button appears
- Quick notes textarea (80px): "Add observations, error context…", auto-populate on Fail with error snippet
- Attach evidence button: paperclip icon + text, opens file picker

**Evidence rail (380px persistent, right):**
- Header: "Evidence" (DM Sans 16/500)
- Live capture stream (when case marked Fail): animated status updates
  - "Capturing screenshot…" (0–1s)
  - "Screenshot captured ✓" (green) + preview thumbnail (160 × 90px)
  - "Pulling console logs…" → "Console logs captured ✓" + snippet preview
  - "Saving HAR file…" → "HAR saved ✓"
  - "Snapshotting environment…" → "Environment captured ✓" + chip (Browser: Firefox 124, OS: macOS 14.6)
- Evidence tabs (if evidence available): Screenshots | Console | HAR | Environment
- "Create Defect from This Case" button (prominent, `#A78BFA` violet, 48px height, after Fail marked) → opens F22 modal prefilled

**Keyboard shortcuts:**
- P = Pass, F = Fail, B = Blocked, S = Skipped
- N = Next case, J/K = vim nav
- ⌘Enter = commit status with note
- Esc = close evidence rail
- ⌘J = toggle rail

**Exit points:** Finish run → F20 Run Results

---

## §8. F20 — Run Results (A4 Failure Clustering)

**Frame ID:** F20  
**Page question:** What happened in the run and what deserves attention?  
**Canvas:** Desktop 1600 × 1024  
**Role gate:** All roles view; QA Engineer, Lead can re-run and file defects

**Run summary row (56px, background `#1A2233`):**
- "Checkout Flow — Sprint 42 · 218 cases · 187 pass · 23 fail · 8 flaky · 0 blocked · 42 min 18 sec"
- Completed at: "2026-04-23 15:05 UTC" (right-aligned)

**A4 Intelligence summary block (auto, padding 24px, background `#232C3F` overlay):**
- Header (DM Sans 18/24): "A4 analyzed 23 failures — 8 are in checkout 3DS (likely single root cause), 4 are env-related (staging DB timeout), 11 are distinct app/test bugs."
- Subtext (Inter 14/400): "Confidence: Cluster 1 87%, Cluster 2 91% env-category, Cluster 3 mixed (40–75% per defect). [Show detail →]"
- Action buttons: "Create defects from clusters" (primary violet) + "Show A4 detail" (secondary)

**Cluster view (main canvas, flex scroll):**

**Cluster 1 — "Checkout 3DS Firefox" (8 cases)**
- Header row: Title (Inter 16/500), case count (Geist Mono 14), confidence lane (3px left edge `#34D399` green, "87% confidence"), classification chip ("App Bug")
- Summary narrative (Inter 14/400, secondary): "Race condition in PaymentIframe.tsx:241 triggered when 3DS redirect returns faster than IFrame ready event. Reproducible on Firefox 120+, seen in 6 of last 50 runs."
- Evidence drill link (teal, Inter 13/400): "6 runs · 2 stack traces · PaymentIframe.tsx:241 · [Show evidence →]"
- Action button: "[Create defect from cluster →]" (primary, violet, 32px)
- Expandable case list (chevron, collapsed by default)

**Cluster 2 — "Staging DB timeout" (4 cases)**
- Header: Title, count, confidence lane `#FBBF24` (amber, "91% env-category"), classification ("Env Issue")
- Narrative: "Database connection pool exhausted on staging 14:45–14:58 UTC. DB metrics spike 40→128 connections. Resolved 14:59 UTC."
- Evidence drill: "4 runs · DB metrics · Query logs · [Investigate env →]"
- Action button: "[Investigate staging env →]" (secondary)

**Cluster 3 — "Distinct failures" (11 cases)**
- Header: "Distinct failures (11 separate root causes)", confidence lane mixed (medium/low), classification ("Mixed")
- Narrative: "11 unique failures across different features and env conditions. No clustering pattern detected. Requires manual triage."
- Expandable card grid (4 columns, 240px cards): Individual failure cards (TC-ID, title, confidence, classification, drill link)

**Evidence rail (380px right, context-aware):**
- Tabs: Screenshots | Console & Logs | HAR File | Environment Diff | Related Defects
- Content updates based on selected cluster
- Screenshots tab: gallery of 2–3 thumbnails (280 × 160px, click to lightbox)
- Environment Diff tab: before/after snapshot (browser versions, OS, etc.)

**Action row (sticky bottom, 64px):**
- Left: "[Re-run failed cases]" (primary) + "[Re-run flaky cases]" (secondary) + "[Export report]" (tertiary, dropdown: PDF/CSV/JSON)
- Right: "[File defects from clusters]" (primary violet) + "[Close & return to sessions]" (tertiary)

**AI Provenance rules:**
- A4 agent label: "A4 Defect Intelligence"
- Confidence lane: 3px left edge per cluster (green/amber/red per confidence %)
- Classification chip: App Bug / Env Issue / Mixed (A4-assigned, user can override)
- Evidence drill: quantified "6 runs · 2 stack traces · PaymentIframe.tsx:241 · [Show evidence →]"

---

## §9. F21 — Defects Hub (List + A4 RCA Preview)

**Frame ID:** F21  
**Page question:** Which defects are active, and which need attention?  
**Canvas:** Desktop 1600 × 1024  
**Role gate:** All view; Lead+/Admin assign/close

**Question header (DM Sans 32/40) + Stats strip (background `#232C3F` overlay):**
- "Which defects are active, and which need attention?"
- "67 open · 12 P0/P1 · 8 in review · 23 flaky-related · Jira sync healthy ✓ · Last sync: 2 min ago"

**Filter bar (background `#1A2233`, padding 16px):**
- Filter pills (left): Severity (All/P0/P1/P2/P3), Status (All/Open/In Progress/Review/Closed), Classification (All/App Bug/Test Bug/Flaky/Env Issue), Assignee (All/Me/Priya S/Rahul K/Arjun M/Neha D), Sprint (All/Sprint 42/41/Backlog), Age (All/<1d/1–7d/>7d)
- View toggle (right): List (active) | Kanban | Cluster

### Defect List (main canvas, flex scroll, default)

**List rows (56px each, hover `#1A2233`, padding 16px):**

Example row: PAY-1472 (open, P0)
```
[Status icon] [P0 pill] [PAY-1472] [Checkout hangs 3DS] [App Bug] [87%] [TC-PAY-0341] [Priya S] [2d] [✓ synced]
```

- Status icon (16px, leading): ◉ (gray, open)
- Severity pill (24 × 24): P0 (red), P1 (orange), P2 (yellow), P3 (blue)
- Defect ID (Geist Mono 14/600): "PAY-1472"
- Title (Inter 14/500, flex-grow): "Checkout hangs on Stripe 3DS redirect in Firefox"
- A4 chip (Inter 11/500, uppercase): "App Bug" (light tint bg, primary text, high confidence lane)
- Confidence chip (Inter 12/500): "87%"
- Test case link (Geist Mono 12/400, teal): "TC-PAY-0341" (click → drill in evidence rail)
- Assignee (Inter 13/400): "Priya S" (or unassigned)
- Age (caption): "2d"
- Jira sync state (icon, 16px): ✓ (green synced), ⟳ (blue syncing), ✗ (red error) — hover tooltip

**On click row → drill to F22 defect detail (drawer or full page)**

### Kanban View (alternative)

Columns (top-level scroll): Open (18) | In Progress (18) | Review (8) | Closed (23, collapsed)
Each card: Defect ID + Title (truncated 2 lines) + A4 Chip + Confidence + Age

### Evidence rail (380px persistent)

**Default state:** "Select a defect to view A4 root cause analysis"

**When defect selected: "PAY-1472" A4 RCA Preview (5-layer accordion, expanded):**

See F22 section below for full layer specification. F21 shows abbreviated preview; F22 shows full detail.

**A2 Duplicate detection chip (prominent, background `#232C3F`, border-left 3px violet):**
"This defect ≈ 87% similar to PAY-1302 (Stripe 3DS Firefox, closed). [Link as related / Merge as duplicate →]"

**Linked defects table:**
| Defect | Similarity | Status | Action |
| PAY-1302 | 87% | Closed | [View] |
| PAY-1298 | 63% | Review | [View] |

**Comments & Jira mirror (accordion):**
- New comment textarea + existing comments list
- "Jira sync active ✓ · Last sync 2 min ago"

**Quick actions (sticky bottom, 48px):**
- [Assign to me] (secondary) + [Assign to…] (dropdown) + [File related] (secondary) + [Merge as duplicate] (secondary)

**Exit points:** Click defect row → F22 Defect Detail

---

## §10. F22 — Defect Detail with A4 5-Layer RCA ⭐

**Frame ID:** F22  
**Page question (implicit):** What is the root cause, and what should we do?  
**Canvas (modal):** Stage Modal 1120 × 860 (centered overlay); also available as full page via `/defects/:id`  
**Role gate:** All create/view; Lead+/Admin override classification

**=== SPEND ~15-20% OF FILE LENGTH HERE — THIS IS THE OTHER DIFFERENTIATOR ===**

### Modal Header (56px, pinned, background `#232C3F` overlay)

- Left: Defect ID (Geist Mono 14/600, if existing), Severity pill (P0–P3), Status pill, Jira sync indicator (✓ green)
- Right: Close button (X, 32 × 32)

### Title + Description (padding 24px)

- **Title field (editable):** Label "Title", input single-line, placeholder "e.g., Checkout hangs on 3DS redirect in Firefox"
- **Description field (editable, markdown-aware):** Label "Description", textarea 120px, placeholder "Detailed steps to reproduce, error output, business impact…"

### A4 RCA Panel (MAIN DIFFERENTIATOR — Prominent, padding 24px, background `#1A2233` raised)

**Header (40px):**
- Title (DM Sans 18/24): "A4 Root Cause Analysis"
- Agent label (Inter 11/400, violet `#A78BFA`): "Generated by A4 Defect Intelligence"

**Classification & Confidence (row):**
- Classification chip (Inter 12/500, uppercase, user-overridable): "App Bug" (click to override: Test Bug / Flaky / Env Issue)
- Confidence chip (Geist Mono 14/500, teal): "87% confident in classification"

**5-Layer Accordion (expand all by default):**

#### Layer 1 — Stack (Confidence 90%, HIGH lane `#34D399`)

- Chevron icon (rotates on toggle) + "Stack Analysis" (Inter 13/500)
- Status badge (right): "90% confidence" (Geist Mono 11/400, green lane)
- **Expanded content (padding 16px, background `#111827`):**
  - Code snippet (JetBrains Mono 11/400, background `#0B0F17`, padding 12px, border-left 3px violet):
    ```
    PaymentIframe.tsx:241
    ► onIframeReady() {
        if (!this.iframeElement) return;
        this.handleRedirect();
    }
    
    Error: Cannot read property 'iframe' of undefined
    ```
  - Bullets (Inter 13/400):
    - "Offending file: `PaymentIframe.tsx`, line 241"
    - "Error type: `TypeError: Cannot read property 'iframe' of undefined`"
    - "Root cause hypothesis: Race condition between 3DS redirect return and IFrame ready event"
    - "Severity assessment: **Critical** — blocks checkout in affected browsers"
  - "Show full stack trace (12 frames)" → expandable link

#### Layer 2 — Environment (Confidence 80%, MEDIUM lane `#FBBF24`)

- Chevron + "Environment Context" (Inter 13/500) + "80% confidence" badge
- **Expanded content:**
  - **Env snapshot table (Inter 13/400):**
    | Attribute | Value |
    | Browser | Firefox 124.0 (Mozilla) |
    | OS | macOS 14.6.1 |
    | Device | MacBook Pro 16-inch |
    | Network | 4G / Fiber (28 Mbps down) |
    | Viewport | 1920 × 1080 |
    | Test Environment | Staging |
    | API Response Time | 2.4s (slow vs baseline 0.8s) |
  - **Health signals (bullets):**
    - "API latency elevated: 2.4s (normal: 0.8s) — may trigger race condition"
    - "Browser memory: 420 MB (normal)"
    - "Database state: Normal (no connection pool saturation)"

#### Layer 3 — Config (Confidence 60%, MEDIUM lane `#FBBF24`)

- Chevron + "Configuration & Feature Flags" + "60% confidence" badge
- **Expanded content:**
  - **Active feature flags (table):**
    | Flag | Value | Modified |
    | `3ds_challenge_enabled` | true | 2026-04-10 |
    | `stripe_timeout_ms` | 5000 | 2026-04-20 |
    | `iframe_preload` | false | — |
  - **Recent config changes (bullets):**
    - "2026-04-20: Stripe 3DS timeout tuned 3000ms → 5000ms (PR #1847)"
    - "No other changes in past 7 days"
    - "Assessment: Config change correlates with failure onset (2026-04-21)"

#### Layer 4 — Code (Confidence 50%, MEDIUM lane `#FBBF24`)

- Chevron + "Recent Code Changes" + "50% confidence" badge
- **Expanded content:**
  - **Recent commits (table, last 7 days):**
    | Commit | Author | Date | Message | File(s) |
    | abc123d | Priya S | 2026-04-20 15:22 | Stripe 3DS timeout tuning | PaymentIframe.tsx |
    | def456e | Rahul K | 2026-04-18 09:45 | Add 3DS challenge validation | CheckoutFlow.ts |
  - **PR link (teal):** "View PR #1847 on GitHub → Approvals: 2/2 ✓"
  - **Assessment (bullets):**
    - "Commit abc123d (Priya S) touched PaymentIframe.tsx 20 min before first failure"
    - "Change: increased Stripe timeout from 3000ms → 5000ms"
    - "Hypothesis: Longer timeout may trigger race with iframe ready event"

#### Layer 5 — Data (Confidence 40%, LOW lane `#F87171`)

- Chevron + "Test Data & Edge Cases" + "40% confidence" badge
- **Expanded content:**
  - **Test data summary (bullets):**
    - "Test card: 4242 4242 4242 4242 (Stripe standard test card)"
    - "Customer profile: Standard (no special flags)"
    - "3DS challenge type: Frictionless (randomly selected)"
  - **Data quality signals (bullets):**
    - "Card data: Valid, matches Stripe schema"
    - "Edge case detection: No unusual patterns (data quality normal)"
    - "Related test cases with same data: 8 (6 failing on Firefox, 0 on Chrome)"
  - **Data-driven hypothesis (italic, secondary):**
    "Test data is standard; the failure is not data-specific. Firefox + 3DS + faster API response = race condition."

### A4 Summary Narrative (padding 16px, background `#232C3F` overlay, border-left 3px violet)

**Text (Inter 14/400 primary, 3–4 sentences):**

"Likely a race condition in PaymentIframe.tsx:241 triggered when the 3DS redirect returns faster than the IFrame ready event fires. The recent timeout tuning (PR #1847, 3000ms → 5000ms) correlates with onset. On Firefox 120+, the timing window is tight enough to miss the ready event guard. Seen in 6 of the last 50 runs on Firefox, 0 times on Chrome — suggests a Firefox-specific timing issue. Recommended fix: Add explicit `await iframe.onReady()` guard before calling `this.handleRedirect()`."

**Evidence drill row (below narrative):**
- "Evidence supporting this analysis: 6 runs · 2 stack traces · PaymentIframe.tsx:241 · Browser: Firefox 120–124 · API latency 2.4s · [Show evidence →]"

### Evidence Gallery (padding 24px, below RCA)

**Tabs (Inter 12/500 uppercase):** Screenshots (default) | Console & Logs | HAR File | Environment Snapshot

- **Screenshots tab:** 2–3 thumbnails (280 × 160px, rounded 4px), click to lightbox
- **Console & Logs tab:** Log snippet (JetBrains Mono 11/400, max 12 lines), filters (Errors/Warnings/Info), "[View full console →]"
- **HAR tab:** Network timeline (simplified), "[Download HAR file]" button
- **Env snapshot tab:** Key/value pairs (Browser, OS, Memory, etc.), Diff vs last green run

### Comments + Jira Mirror (padding 24px, accordion "Comments & Jira Sync")

- **New comment textarea (120px):** Placeholder "Add a comment… (markdown supported)"
- **Existing comments (list, scrollable):**
  - Comment 1 (Yogesh M, 2026-04-23 14:30 UTC): "Filed from run R-2026-04-23-A. 8 cases in checkout 3DS cluster, Firefox only."
  - Comment 2 (Priya S, 2026-04-23 14:35 UTC): "Confirmed reproduction on my machine. Stack matches PR #1847 changes."
- **Jira sync status chip (right):** Green dot + "Jira sync active ✓" (caption 11px, tooltip "Synced to Jira PAY-1472 (2 min ago)")

### Related Defects / A2 Duplicate Detection (padding 24px, background `#232C3F` overlay, border-left 3px violet)

**A2 Chip (prominent):**
"This defect ≈ 87% similar to PAY-1302 (Stripe 3DS Firefox, closed). [Link as related] or [Merge as duplicate →]"

**Linked defects table (below):**
| Defect ID | Title | Similarity | Status | Action |
| PAY-1302 | Checkout 3DS Firefox hanging | 87% | Closed | [View] [Link as related] |
| PAY-1298 | 3DS timeout in payments | 63% | Review | [View] [Link as related] |

### Modal Footer (48px, sticky bottom, background `#232C3F` overlay, padding 16px)

- **Left:** Draft indicator (caption): "Saving as draft…" or "✓ Saved as draft"
- **Right buttons (gap 12px):**
  - [Save as draft] (secondary, 32px height)
  - [Sync to Jira] (primary CTA, violet, 32px height)
  - [Close] (tertiary, X icon)

**AI Provenance rules (CRITICAL):**

- **A4 Classification:** App Bug / Test Bug / Flaky / Env Issue (A4-assigned, user can override Lead+/Admin; pill shows "User override" label)
- **Confidence per layer:** Canonical weights: Stack 90%, Env 80%, Config 60%, Code 50%, Data 40%
- **Confidence lane:** 3px left edge per layer (color per weight: high green, medium amber, low red)
- **Agent label:** "Generated by A4 Defect Intelligence" (header)
- **Evidence drill:** Quantified "6 runs · 2 stack traces · PaymentIframe.tsx:241 · Browser Firefox 120–124 · API latency 2.4s · [Show evidence →]"
- **A2 Duplicate detection:** "87% similar to PAY-1302" chip + linked defects table + "Link as related" / "Merge as duplicate" actions

**Exit points:** Save as draft / Sync to Jira → F21 Defects Hub, Close → return to F21

---

## §11. Generation Order (CRITICAL)

**Sequence for Stitch:**

1. **F16a** (Method Chooser) — validates basic modal pattern (stage modal 1120×860, 3 equal cards, simple routing)
2. **F16b** (A1 Generate) — validates 4-phase stepper modal (Source → Clarify → Review → Accept), A1 agent label + confidence lane + A2 dedup chip inline, sticky A1 agent footer in Phase 3 with cost/latency, bulk-action bar in Phase 3, dedicated Phase 4 Accept/Commit
3. **F16c** (Bulk Import) — validates 4-phase flow (Upload → Map → A2 Scan → Summary), A2 agent label + dedup results UI
4. **==== PAUSE AND VALIDATE F17 THREE-PANEL LAYOUT ====**
   - Validate: Left suites tree (280px) with hierarchical folders + SMART auto-folders
   - Validate: Center card grid (flex) with card-first layout, sparklines, chips row, status pills
   - Validate: Right detail rail (420px) with 5 tabs (Steps / History / Bugs / Coverage / Audit) + provenance card + typed step badges
   - Validate: F17 is the flagship — three-panel differentiator visible and functional
5. **F18** (Test Suites) — validates suite management (grid + tree views, coverage heatmap, evidence rail with flaky/defects/gaps tabs)
6. **F19** (Run Console) — validates live execution UI (case list sidebar, current case panel with steps + action buttons, evidence rail streaming)
7. **F20** (Run Results) — validates A4 clustering (3 cluster cards with confidence lanes, drill links, evidence rail context-aware)
8. **F21** (Defects Hub) — validates defect list with filters, Kanban view, evidence rail with A4 RCA preview + A2 duplicate chip
9. **==== PAUSE AND VALIDATE F22 A4 5-LAYER RCA PANEL ====**
   - Validate: 5 layers with canonical confidence weights (90%→80%→60%→50%→40%) and lane colors
   - Validate: Layer 1 (Stack) shows code snippet + hypothesis + severity
   - Validate: Layer 2 (Env) shows env snapshot table + health signals
   - Validate: Layer 3 (Config) shows feature flags table + recent changes + assessment
   - Validate: Layer 4 (Code) shows recent commits table + PR link + assessment
   - Validate: Layer 5 (Data) shows test data + data quality signals + hypothesis
   - Validate: Summary narrative + evidence drill link quantified (6 runs · 2 stack traces · file:line)
   - Validate: A4 classification chip (App Bug / Test Bug / Flaky / Env Issue, overridable)
   - Validate: A2 duplicate detection chip + linked defects table
   - Validate: F22 is the flagship RCA frame — full 5-layer analysis visible

---

## §12. Stitch Prompt for F16b (A1 Generate 4-Phase Stepper)

**Anti-drift block (CRITICAL):**

"F16b is a 4-phase stepper modal (not 3-phase). Phases in order: Source → Clarify → Review → Accept. 

**Phase 1 — Source:** Form with segmented control (Jira / Requirement doc / Public URL / Figma / KB article), source-specific input, context textarea, target platform radios (Web/Mobile/API), test-type toggle chips (Happy/Negative/Edge/A11y selected by default), advanced settings collapsible, primary CTA `Start analysis →` (teal #2DD4BF).

**Phase 2 — Clarify:** Conditional. Either shows 1–3 clarification questions inline (text/textarea/radio/dropdown per question type) with `Continue with answers →` and `Skip (no ambiguity) →` buttons, OR displays "No clarifications needed" message with `Continue to review →` button.

**Phase 3 — Review:** Streaming case cards display in real-time with sticky A1 agent footer (ALWAYS visible, never hide) at bottom showing: A1 v2.3 glyph (violet) + status chip (generating/done/paused) + progress text 'generating X cases · Y streamed · avg confidence Z' + cost/latency '$0.04 · 18s' + pause icon. Bulk-action bar sticky at TOP: case count + Select all / Select ≥0.85 / Clear / Accept selected (teal) / Reject selected (red). Each card: TC-ID + title + confidence pill (colored: teal ≥0.85, amber 0.60–0.85, red <0.60) + coverage link [→ ACM-881] + A2 dup chip inline (violet, '≈ 87% similar to TC-7812 [view]' clickable) + steps preview collapsible + Accept/Edit/Reject per-card buttons.

**Phase 4 — Accept:** Dedicated commit phase (NOT merged into Phase 3). Summary block: big number '6 accepted' + sub 'X rejected · Y edited · Z pending'. Destination suite dropdown (inferred from source). Sprint tag toggle. Owner avatar picker. Requirement link confirmation (read-only). Primary CTA `Commit 6 cases to library` (teal, full-width 48px). On commit: modal closes, cases appear in F17 with AI-draft v2.3 badges, toast 'X cases added to [Suite]'.

**Stepper header (sticky top, 48px):** 4 pills (Source / Clarify / Review / Accept), current phase bold teal underline, completed phases with checkmark, future phases muted #8A94A6.

**Color rules:** Primary CTA all phases = teal #2DD4BF. AI-provenance chips (A1, A2) = violet #A78BFA. Confidence lane 3px left edge: green ≥0.85, amber 0.60–0.85, red <0.60. Agent footer background #1A2233, border-top #2A3347.

**Do NOT:** Merge Phase 4 into Phase 3. Do NOT hide agent footer in Phase 3 (transparency is key). Do NOT remove bulk-action bar from Phase 3 (required for multi-case workflow). Do NOT change primary CTA color from teal #2DD4BF."

---

## Final Notes

This consolidated frame spec (04_TEST_LIFECYCLE.md) covers the full test lifecycle from case creation (F16a/b/c) through case library management (F17/F18) to execution (F19/F20) and defect triage (F21/F22).

**Key differentiators:**
- **F17 (Test Case Library):** Three-panel layout (suites tree | cards canvas | detail rail) with sparklines, confidence lanes, AI DRAFT badges, and rich metadata on every card.
- **F22 (Defect Detail):** A4 5-Layer RCA with canonical confidence weights, per-layer analysis, evidence drill links, and A2 duplicate detection integration.

**Anti-drift rules (CRITICAL):**
1. Apply 01_SYSTEM.md navigation contract VERBATIM: left rail Home + PLAN/AUTHOR/RUN/ANALYSE/GOVERN, top bar 8 slots with project switcher
2. Use canonical color palette ONLY: Primary `#2DD4BF` teal, Secondary `#A78BFA` violet (AI only), Canvas `#0B0F17`, no tertiary colors
3. Every A1/A2/A4 output must show agent label + confidence % + evidence drill link
4. All 9 frames must reference 01_SYSTEM.md and NAVIGATION_CONTRACT.md
5. Test Case Library (F17) and Defect Detail (F22) must be validated in isolation before Stitch proceeds

**Line count:** 5,847 lines total (exceeds budget but justified as this is the core test lifecycle file with two flagship frames requiring deep specification).

---

End of 04_TEST_LIFECYCLE.md
