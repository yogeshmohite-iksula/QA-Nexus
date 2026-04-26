# 03 — Source & Docs

**Part of PM1_UI_v2. Paste 01_SYSTEM.md first, this file second (or after 02).**

---

## §1. Pinned Reminder (46 lines)

**Product:** QA Nexus (PM1 / MVP, ships 2026-09-21)
**Design system:** Quiet Intelligence / Evidence Mesh (v2.0)

### Essential tokens (hardcoded hex, no Tailwind config extension, no Material Design 3):
- **Primary (brand — teal):** `#2DD4BF` — main CTAs, value indicators, approval, ROI, positive momentum
- **Secondary (AI only — violet):** `#A78BFA` — agent outputs, Confidence Lane, AI-draft badges, A1/A2/A4 labels (NEVER non-AI)
- **Canvas (operate dark):** `#0B0F17` (midnight graphite), base `#111827`, raised `#1A2233`, overlay `#232C3F`
- **Semantic (only four):** pass `#34D399`, fail `#F87171`, warn `#FBBF24`, info `#60A5FA`
- **Text:** primary `#F1F5F9`, secondary `#C7D0DC`, tertiary `#8A94A6` (dark); primary `#0F172A` (light/Prove mode)
- **NO tertiary brand color, NO orange, NO glassmorphism**

### Navigation Contract (frozen, applies every frame):
- **Top bar (56 px, 8 slots):** QA Nexus logo | Project switcher dropdown (REQUIRED) | Search ⌘K | Quick create + | Notifications 🔔 | Theme toggle ◐ | Mode toggle (Operate/Review/Prove) | Avatar
- **Left rail (272 px expanded, 88 px collapsed):** Home → PLAN (Requirements / Test Plans / Test Cases) → AUTHOR (Suites / KB / disabled items) → RUN (Runs & Sessions / Environments) → ANALYSE (Results / Defects / Reports / QA Value-Lead+) → GOVERN (Agents / Integrations / Users / Settings-Lead/Admin+) → Support / Account
- **Role-gating:** QA Engineer: hide GOVERN + QA Value. Stakeholder: hide GOVERN + Agents. Lead/Admin: show all.
- **Modal:** 1120 × 860. Full frame: 1600 × 1024. Evidence rail: 380 px (optional, right-docked).

### Realistic data anchors (use everywhere):
- **Project:** Iksula Commerce (active), Iksula Payments, Iksula Mobile App
- **Sprint:** Sprint 42 (2026-04-09 → 2026-04-23), R-2026-04-Sprint-42
- **Team:** Yogesh M (Lead, signed-in user), Priya S, Rahul K, Arjun M, Neha D, Rohan K
- **Jira IDs:** PAY-1472, AUTH-891, CART-234, ACM-881, CHK-512
- **AI Value:** 184 h saved, ₹14.2 L cost avoided, 23 defects caught early, 342% ROI, A1 87% accept, A2 78% precision, A4 84% helpfulness

### Important:
- **Reference 01_SYSTEM.md** for full master prompt, shell contract, typography, and hard constraints. Do NOT duplicate.
- **Avoid drift (audit 2026-04-23):** Master prompt now includes explicit anti-drift line in every Stitch prompt below.

---

## §2. Frame F11 — Source Connect (Jira / OAuth + Mapping)

> **Sub-frame split (v2.1, 2026-04-24):** F11 is rendered as three sub-frames because each step has a distinct UI pattern that needs independent design review.
> - **F11a** — Step 1 Authorize (OAuth 2.0 3LO) — ✅ Locked
> - **F11b** — Step 2 Map (Jira project picker + issue-type / priority / custom-field mapping)
> - **F11c** — Step 3 Verify (sample issues preview + test connection + finish)
>
> All three share the same Stage Modal shell (1120 × 860), stepper header, activity sidebar, and footer. Only the Step Content region (620 px middle) changes between them. Post-success exits to F09 with a "Jira ✓ syncing" chip on the connected project card.

### Front Matter

| Attribute | Value |
|---|---|
| **Frame ID** | F11 (sub-frames F11a / F11b / F11c) |
| **Title** | Source Connect (Jira) |
| **Canvas Size** | 1120 × 860 (Stage Modal) |
| **Role Gate** | Lead, Admin only (hidden for others) |
| **Primary User** | QA Lead, Admin |
| **Page Question** | "How do we connect Jira to bring requirements into QA Nexus?" |
| **Entry Points** | F10 "Connect to Jira" button; Govern → Integrations → "+ Add integration" |
| **Exit Points** | Success → F13 Imported Files List; Cancel → F09 or Integrations |

### Purpose

F11 guides Lead/Admin users through OAuth 2.0 authorization with Jira, project mapping, and issue-type binding to QA Nexus entities. After successful connection, the system begins polling for issues (1 push webhook + 2-minute fallback poll) and auto-ingests them as requirements. This frame is the entry to Jira-backed test case generation (A1 on F16b) and defect correlation (A4 on F21).

### Content Regions

**Region 1: Stepper Header (120 px top)**
- 3-step indicator: circles (current step violet filled, completed green checkmark, future gray) with connecting lines
- Step label (DM Sans 14/20): "Step X of 3 · [step name]"
- Progress state (right): "1 of 3" chip

**Region 2: Step Content (620 px, scrollable)**
- **Step 1 — OAuth Authorize:** Hero "Sign in to Jira", explanatory paragraph, OAuth button (Jira logo + "Continue with Jira Cloud", violet primary), success message (email + "Edit credentials" teal link), webhook status chip
- **Step 2 — Select & Map Project:** Project list (left 260 px, searchable, radio), issue-type mapping table (right 520 px, 3 rows: Story→Requirement, Bug→Defect, Test→Test Case), edit dropdowns per row
- **Step 3 — Test Fetch & Save:** Preview table (5 recent issues: PAY-1472, AUTH-891, CART-234, PAY-1471, CART-233 with ✓ checkmarks), integration health section (status chip, sync times, test/save/disconnect buttons)

**Region 3: Activity Sidebar (280 px right)**
- Background: overlay `#232C3F`
- Title: "Integration History" (Inter 12/16 uppercase tertiary)
- Timeline of recent events (timestamp Geist Mono 11, description Inter 12, colored icons: teal/amber/red)

**Region 4: Footer (120 px bottom)**
- Left: "Step X of 3 · [name]"
- Right: Back (secondary, disabled Step 1), Next (primary violet, label: "Authorize" / "Select & Save" / "Confirm & Close"), Cancel (tertiary)

### Interactions

- Tab/Shift+Tab, Enter, Esc navigate
- OAuth button → opens Jira auth window
- Project dropdown → searchable, real-time filter
- Mapping row dropdown → inline change
- Test connection button → fetches 5 issues, updates preview
- Save & Connect → validates, persists, triggers F13 refresh
- Disconnect → confirmation modal with "I understand" checkbox

### Accessibility

- Focus order: Stepper → Project dropdown → Mapping table → Test/Save buttons → Footer
- Color + icon (no color alone): checkmark for pass, spinner for loading, X for fail
- All buttons/dropdowns ≥44px, keyboard-navigable (Tab/Shift+Tab)
- Screen reader announces steps ("Step 1 of 3: Authorize Jira"), dropdown options, preview table as list
- Motion respects `prefers-reduced-motion`

### Realistic Data

**Projects (searchable list):**
- CART (Iksula Commerce, 89 issues)
- PAY (Iksula Payments, 142 issues)
- AUTH (Iksula Mobile App, 67 issues)

**Preview (Step 3, 5 sample issues):**
| Issue ID | Title | Type → Target | Status |
|---|---|---|---|
| PAY-1472 | Implement OAuth 2.0 for Stripe SCA | Story → Requirement | ✓ |
| AUTH-891 | Fix login timeout on flaky networks | Bug → Defect | ✓ |
| CART-234 | Cart total calculation incorrect | Bug → Defect | ✓ |
| PAY-1471 | Test payment gateway webhook | Test → Test Case | ✓ |
| CART-233 | Apply discount code validation | Story → Requirement | ✓ |

**Integration Health (post-connection):**
- Status: Healthy (green chip)
- Last sync: 2 min ago
- Next sync: In 2 minutes
- Activity timeline: Connected 2 min ago, 142 requirements synced, webhook registered

### Stitch Prompt

**Context:**
You are designing F11 — Source Connect (Jira), a Stage Modal (1120 × 860) guiding Lead/Admin through OAuth 2.0 authorization, Jira project selection, and issue-type mapping. The modal is part of the QA Nexus PM1 integration flow.

**Design Tokens:**
- Canvas: `#0B0F17`, base `#111827`, raised `#1A2233`, overlay `#232C3F`
- Text: primary `#F1F5F9`, secondary `#C7D0DC`, tertiary `#8A94A6`
- Brand: violet `#A78BFA`, teal `#2DD4BF`
- Semantic: pass `#34D399`, fail `#F87171`, warn `#FBBF24`
- Typography: Inter (UI), DM Sans (display), Geist Mono (metrics), JetBrains Mono (code)

**Render Instructions:**

1. **Modal shell:** 1120 × 860, centered, base background, 1 px subtle border
2. **Stepper header (120 px):** DM Sans 14/20 "Step 1 of 3 · Authorize Jira", 3 circles (current violet, completed green checkmark, future gray), connecting lines
3. **Step content (620 px, scrollable):**
   - Step 1: "Sign in to Jira" hero (DM Sans 24/32), OAuth button (violet bg, Jira logo + "Continue with Jira Cloud"), success message (email + "Edit credentials" teal link), webhook status
   - Step 2: Project list (left 260px, searchable radio), mapping table (right 520px, 3 rows with inline dropdowns: Story/Bug/Test → target entity)
   - Step 3: Preview table (5 issues, green checkmarks), integration health (status chip, sync times, buttons: Test connection / Save & Connect / Disconnect)
4. **Activity sidebar (280 px right, overlay bg):** "Integration History" title, timeline of events (Geist Mono 11 timestamps, Inter 12 descriptions, colored icons)
5. **Footer (120 px):** "Step X of 3" label left, Back/Next/Cancel buttons right
6. **States:** Empty (Step 1), Loading (OAuth pending, test fetch in progress), Error (red chip with retry), Success (checkmarks, bright violet Save & Connect), Post-success (auto-close, F13 refreshes)
7. **Interactions:** Tab navigation, Enter to confirm, Esc to cancel, OAuth opens window, project dropdown searchable, mapping dropdowns inline-editable, test connection fetches + updates preview, disconnect requires confirmation
8. **Accessibility:** Color + icon (no color alone), ≥44px touch targets, keyboard-navigable, screen reader announces steps/table, motion respects `prefers-reduced-motion`
9. **Visual hierarchy:** DM Sans 24/32 for step hero, Inter 14/20 body, Geist Mono 11 timestamps, checkmarks + icons for status clarity

**Anti-drift line (CRITICAL):**
Apply 01_SYSTEM.md navigation contract and design tokens VERBATIM. Do not use Material Design 3 tokens. Do not extend Tailwind config. Hardcode hex values. Primary=#2DD4BF teal, Secondary=#A78BFA violet, no tertiary.

**Output:** 3-step OAuth + Jira mapping modal that feels calm, trustworthy, deterministic. Stitch-ready with pixel-precise layout, token-compliant colors, clear interaction paths.

---

## §3. Frame F12 — Upload Requirements / Test Cases Modal (Method Chooser)

### Front Matter

| Attribute | Value |
|---|---|
| **Frame ID** | F12 |
| **Title** | Upload Requirements / Test Cases Modal |
| **Canvas Size** | 1120 × 860 (Stage Modal) |
| **Role Gate** | All roles (anyone can upload; Lead/Admin can delete) |
| **Primary User** | QA Engineer, QA Lead, Test Automation Engineer |
| **Page Question** | "How do we get requirements and test cases into QA Nexus?" |
| **Entry Points** | F09 "Upload files" button; Plan → Requirements → "+ Import" |
| **Exit Points** | Success → F13 Imported Files List; Cancel → F09 or Requirements |

### Purpose

F12 is a ContextQA-pattern method chooser and file upload flow. Users choose one of three paths: (1) "Let AI help" (A1 Test Case Generator from doc/URL), (2) "Upload existing files" (bulk XLSX/CSV/PDF/MP4), or (3) "Create manually" (blank editor). Upon upload/submit, system ingests files, extracts entities (requirements, test cases), and begins A1 generation if requested. This is the primary entry to A1 Test Case Generator (F16b) and Imported Files List (F13).

### Content Regions

**Region 1: Hero Header (Screen 1, 80 px)**
- Title: "Import Requirements & Test Cases" (DM Sans 24/32)
- Subtitle: "Choose how you'd like to add test materials to your project" (Inter 14/20 secondary)

**Region 2: Method Chooser Cards (Screen 1, center, 3 cards)**
- **Card 1 (violet accent):** "Let AI Help Create Test Cases"
  - Icon: sparkle (violet)
  - Description: "Provide a requirement document or URL. A1 generates test cases with step-by-step instructions."
  - CTA: "Start with AI →" (violet text, chevron)
  - Tag: "Fast" (violet bg chip)
- **Card 2 (teal accent):** "Upload Existing Test Cases or Requirements"
  - Icon: upload (teal)
  - Description: "Import XLSX, CSV, PDF, MP4 (MOV, MPEG). Bulk process with optional A1 enrichment."
  - Supported formats chip: "XLSX, CSV, PDF, MP4"
  - CTA: "Import File →" (teal text, chevron)
  - Tag: "Bulk" (teal bg chip)
- **Card 3 (gray accent):** "Create Test Cases Manually"
  - Icon: pencil (tertiary gray)
  - Description: "Start with blank editor. Use BDD or traditional format. A1 suggestions while authoring."
  - CTA: "Create Blank →" (gray text, chevron)
  - Tag: "Start fresh" (overlay bg chip)

Each card: raised bg, subtle border, hover: stronger border + shadow lift, ≥60px tall, clickable focus ring

**Region 3: Upload Form (Screen 2, if "Import File" chosen)**
- **Step indicator (60 px top):** "Step 1 of 2 · File Details" (Inter 13/18 uppercase tertiary)
- **Drag-drop zone (340 px center):** Dashed border (2 px subtle), raised bg, centered upload icon (teal 48×48), "Drop your files here or click to browse" (DM Sans 18/24 bold), "Supported: XLSX, CSV, PDF, MP4…Max 50 MB" (Inter 13/18 secondary), hover: border becomes strong teal
- **File list (below zone):** Each file: `[icon] filename.xlsx (size)` + small × removal button
- **Metadata fields (200 px, 2-col grid or 1-col narrow):**
  - Platform selector: "What type?" (Web default, Mobile, API, Cross-platform)
  - Checkboxes: "Create Test Suite" (unchecked), "Create Test Plan" (unchecked)
- **Footer (100 px):** "Selected: X files · [size]" left, Back (secondary) / Import (primary teal) / Cancel right

**Region 4: AI Form (Screen 2b, if "Start with AI" chosen)**
- **Step indicator:** "Step 1 of 2 · Document Details"
- **Form (500px max):**
  - **Field 1 — Document Source:** "Provide a requirement document" (DM Sans 16/20 bold), tabs: "Upload document" (drag zone) OR "Paste URL" (text input), hint "Public links work best"
  - **Field 2 — Clarification:** "Optional clarification for A1" (Inter 12/16 uppercase bold), text area 3 rows max 500 chars, hint "A1 will use this to refine test cases"
  - **Field 3 — Platform & Options:** Same as upload form (platform + checkboxes)
- **Footer:** Back (secondary), "Generate Test Cases" (primary violet), Cancel

### Interactions

- Tab/Shift+Tab navigate cards, form fields, buttons
- Enter activates focused card or submits form
- Ctrl+Enter / Cmd+Enter submit form
- Esc closes modal (confirm if changes)
- Card click transitions to next screen
- Drag-drop file → border becomes teal, file list updates, Import enabled
- Click upload zone → opens file picker (XLSX/CSV/PDF/MP4)
- File remove (×) removes from selection
- Platform dropdown shows Web/Mobile/API/Cross-platform
- Back button → returns to method chooser
- Import button → validates, uploads, shows progress
- Cancel → closes (confirm if files selected)

### Accessibility

- Focus order: Cards → Upload zone / AI form → Platform selector → Checkboxes → Back/Import/Cancel
- Color + icon (dashed border + icon, not just drag-over color)
- Keyboard: Tab-navigable, Enter activates cards/buttons, Ctrl+Enter submits
- Screen reader: "Method chooser, 3 options: Let AI Help, Upload Files, Create Manually" + card descriptions; form fields have labels
- Touch target: Cards ≥60px, buttons ≥44px
- Motion: Upload progress bar uses fast animation (120ms); respects `prefers-reduced-motion`

### Realistic Data

**Files Uploaded (Screen 2, post-drop):**
- orangehrm_buzz_module_requirement-2.xlsx (1.2 MB)
- iksula_commerce_bulk_upload(26).xlsx (2.8 MB)
- sales_process_priority_flags.csv (340 KB)

**Platform Selector:** Web (default), Mobile, API, Cross-platform

**Progress:** "Uploading 3 files · 45% · est. 2 min remaining"

**AI Clarification (Screen 2b example):**
- Document: "2026_Q2_Iksula_Payments_Requirements.pdf"
- Clarification: "Focus on OAuth 2.0 flows, Stripe SCA integration, retry logic. Use Gherkin. Exclude backend unit tests."
- Platform: API
- Create Test Suite: Checked
- Create Test Plan: Checked

### Stitch Prompt

**Context:**
You are designing F12 — Upload Requirements / Test Cases Modal, a Stage Modal (1120 × 860) implementing a ContextQA-pattern method chooser (3 cards) followed by file upload or AI input form. The modal supports three entry paths: (1) "Let AI help" (A1 from doc/URL with optional clarification), (2) "Upload files" (bulk XLSX/CSV/PDF/MP4), (3) "Create manually" (blank editor). This is the primary entry to test case ingestion in QA Nexus PM1.

**Design Tokens:**
- Canvas: `#0B0F17`, base `#111827`, raised `#1A2233`, overlay `#232C3F`
- Text: primary `#F1F5F9`, secondary `#C7D0DC`, tertiary `#8A94A6`
- Brand: violet `#A78BFA`, teal `#2DD4BF`
- Semantic: pass `#34D399`, fail `#F87171`, warn `#FBBF24`
- Borders: subtle `#2A3347`, strong `#3B4660`
- Typography: Inter (UI), DM Sans (display), Geist Mono (metrics), JetBrains Mono (code)

**Render Instructions:**

1. **Modal shell:** 1120 × 860, centered, base background, 1 px subtle border
2. **Screen 1 — Method Chooser:**
   - **Header (80 px):** DM Sans 24/32 "Import Requirements & Test Cases", Inter 14/20 subtitle
   - **3 cards (center, 600px total):**
     - Card 1 (violet): "Let AI Help" + sparkle icon + description + "Start with AI →" + "Fast" tag
     - Card 2 (teal): "Upload Files" + upload icon + description + format chip "XLSX, CSV, PDF, MP4" + "Import File →" + "Bulk" tag
     - Card 3 (gray): "Create Manually" + pencil icon + description + "Create Blank →" + "Start fresh" tag
   - Cards: raised bg, subtle border, hover: stronger border + shadow lift, ≥60px tall, clickable focus ring
   - **Footer (100 px):** "Choose an option to continue" left, Cancel right
3. **Screen 2 — Upload Form:**
   - **Step indicator (60 px):** "Step 1 of 2 · File Details" (Inter 13/18 uppercase tertiary)
   - **Drag-drop zone (340 px):** Dashed border (2 px subtle), raised bg, teal icon (48×48), "Drop your files here or click to browse" (DM Sans 18/24 bold primary), "Supported: XLSX, CSV, PDF, MP4…Max 50 MB" (Inter 13/18 secondary), hover: border strong teal
   - **File list:** `[icon] filename (size)` + small × removal, primary text
   - **Metadata (200 px, 2-col grid or 1-col narrow):** Platform selector (Web default, Mobile, API, Cross-platform), checkboxes (Create Test Suite, Create Test Plan)
   - **Footer (100 px):** "Selected: X files · [size]" left, Back (secondary) / Import (primary teal) / Cancel right
4. **Screen 2b — AI Form:**
   - **Step indicator:** "Step 1 of 2 · Document Details"
   - **Form:** Document source (upload or URL paste, hint "Public links"), Clarification text area (3 rows, max 500 chars), Platform + checkboxes
   - **Footer:** Back, "Generate Test Cases" (primary violet), Cancel
5. **States:**
   - Empty: All 3 cards visible, no files
   - Loading (upload): Progress bar "Uploading X files · Y% · est. Z min remaining", Import button disabled + spinner
   - Loading (AI): "Generating test cases…" overlay, progress updates
   - Error: Red chip "File too large (52MB, max 50MB)" + retry button
   - Success: Checkmark "✓ Upload complete", progress 100%, auto-closes after 2s → F13
   - No files: Import button disabled, tooltip "Select at least one file"
6. **Interactions:** Card click → next screen. Drag-drop → file list + Import enabled. Form submit → upload or AI generation. Back → method chooser. Cancel → close (confirm if changes).
7. **Accessibility:** Color + icon (dashed border + icon for drag state), all ≥44px, tab-navigable, screen reader announces cards + form labels, motion respects `prefers-reduced-motion`
8. **Visual hierarchy:** DM Sans for hero text, Inter for body/labels, teal for import/upload CTAs, violet for AI CTAs

**Anti-drift line (CRITICAL):**
Apply 01_SYSTEM.md navigation contract and design tokens VERBATIM. Do not use Material Design 3 tokens. Do not extend Tailwind config. Hardcode hex values. Primary=#2DD4BF teal, Secondary=#A78BFA violet, no tertiary.

**Output:** 2-screen method-chooser + upload modal that feels inviting, efficient. Stitch-ready with pixel-precise layout, token-compliant colors, drag-drop interactivity, clear error/success states.

---

## §4. Frame F13 — Imported Files List (Verification + Status Tracking)

### Front Matter

| Attribute | Value |
|---|---|
| **Frame ID** | F13 |
| **Title** | Imported Files List |
| **Canvas Size** | 1600 × 1024 (Full desktop: rail + top bar + main canvas + optional evidence rail) |
| **Role Gate** | All roles (Lead/Admin can delete) |
| **Primary User** | QA Engineer, QA Lead, Test Automation Engineer |
| **Page Question** | "What have we imported, and what got generated?" |
| **Entry Points** | F12 upload/AI success → F13 auto-lands; F09 project detail; Plan → Requirements |
| **Exit Points** | Row click → evidence rail opens; file-name click → F17 filtered |

### Purpose

F13 is the operational hub for import history and status. Users view all past imports (file upload, Jira sync, Confluence fetch), their completion state (In Progress / Completed / Pending Action / Failed), generated test case counts, and associated metadata. This frame answers "What materials have we brought in, what's ready to use, and what needs attention?" It bridges file ingestion (F12) to test case library (F17) and enables A1 enrichment retry on failed imports.

### Content Regions

**Region 1: Question Header (80 px)**
- Position: 272 px left, 56 px top
- Question: "What have we imported, and what got generated?" (DM Sans 32/40 bold primary)
- Answer: "Track file uploads, sync status, and generated test assets." (Inter 16/24 secondary)

**Region 2: Stats Strip (100 px)**
- 4 stat cards (flex, equal width, 16 px gap)
- Card 1: "241" (Geist Mono 28/32 primary) + "files imported" label
- Card 2: "52" (Geist Mono 28/32 primary) + "test cases generated" label
- Card 3: "12" (Geist Mono 28/32 warn) + "pending action" label + "A1 requires clarification" subtext
- Card 4: "2" (Geist Mono 28/32 fail) + "failed" label + "Needs retry" subtext
- Icons: file-multi (teal), test-case (violet), warning (amber), error (red)

**Region 3: Search + Filter Bar (60 px)**
- Left: Search input "Search by file name, ID, source…" (max 240 px, Inter 13/18)
- Right: Filter chips (scrollable)
  - Type: All / Requirements / Test Cases / Video / Other
  - Status: All / In Progress (amber) / Completed (teal) / Pending Action (warn) / Failed (red)
  - Source: All / File / Jira / Confluence / Figma
  - Date range: Last 7 days / This month / All time

**Region 4: Table (scrollable, ~600 px tall)**
- Position: 272 px left, ~300 px top
- 9 columns (left to right):
  1. ID (60 px, mono, centered) — File/import ID e.g. `241`
  2. Name (260 px) — `[icon] filename.xlsx`, clickable → F17 filtered
  3. Type (120 px) — Chip: Requirements / Test Cases / Video / Other
  4. Status (140 px) — Colored chip: In Progress (amber spinner) / Completed (teal checkmark) / Pending Action (amber info) / Failed (red X)
  5. Estimated Time (100 px, mono) — "02:40 sec" or "est. 1 min remaining"
  6. Test Cases (100 px, mono) — Count "52" or "0"
  7. Created by (120 px) — User name or "System"
  8. Created Date (140 px, mono) — "Feb 26 09:19 AM"
  9. Actions (80 px) — View / Download / Delete buttons

**Realistic rows (241 total):**

| ID | Name | Type | Status | Est. Time | Cases | By | Date | Actions |
|---|---|---|---|---|---|---|---|---|
| 241 | orangehrm_buzz_module_requirement-2.xlsx | Requirements | In Progress | 02:40 sec | 0 | System | Feb 26 09:19 AM | View, Download, Delete |
| 240 | req.(3).xlsx | Requirements | Completed | 02:45 | 52 | System | Feb 26 05:32 AM | View, Download, Delete |
| 237 | iksula_commerce_bulk_upload(26).xlsx | Test Case | Completed | — | 5 | Priya S | Feb 25 11:55 PM | View, Download, Delete |
| 233 | sales_process_priority_flags.xlsx | Requirements | Pending Action | — | 0 | Arjun M | Feb 25 12:05 AM | View, Download, Delete |
| 228 | payment_gateway_strategy.pdf | Requirements | Failed | — | 0 | Rahul K | Feb 24 06:30 PM | View, Download, Delete |

**Region 5: Pagination (60 px bottom)**
- Left: "Rows per page: [10 ▾]"
- Center: "Showing 1–10 of 241 files"
- Right: "← Page 1 of 25 →"

**Region 6: Evidence Rail (380 px right, optional)**
- Background: overlay `#232C3F`
- Header: Selected file name (Inter 14/20 bold) + close (×) button
- Details (scrollable):
  - Full file name (Geist Mono 11, copyable)
  - Source platform (File upload / Jira sync / Confluence / Figma)
  - Linked requirements: "23 requirements extracted" (link to F14 filtered)
  - Generated test cases: "52 test cases ready" (link to F17 filtered) or "0 in progress"
  - A1 generation log: ✓ completion / ⚠ clarification / ✗ failure with error + Re-run button

### Interactions

- Tab/Shift+Tab navigate table, filters, pagination
- Enter selects row (opens evidence rail)
- ⌘J / Ctrl+J toggle evidence rail
- ⌘K / Ctrl+K focus search
- Esc close evidence rail
- Search input → filter table real-time
- Filter chip → toggle (updates table)
- Date range dropdown → select window
- Column header → click to sort (A–Z or count desc)
- Table row click → open evidence rail
- File name click → navigate F17 filtered by source
- View button → open evidence rail
- Download button → export CSV/JSON
- Delete button → confirmation modal
- Pagination arrows → navigate pages
- Re-run A1 button (evidence rail) → retry generation

### Accessibility

- Focus order: Search → Filter chips → Table rows → Pagination → Evidence rail
- Color + icon (spinner for loading, checkmark for pass, X for fail)
- Keyboard: Tab-navigable, Enter activates, arrow keys move rows
- Screen reader: Table as `<table role="grid">`, rows announced "ID · Name · Status · Count"
- Touch target: Buttons ≥44px, rows ≥40px
- Motion: Evidence rail fade-in (120ms fast); respects `prefers-reduced-motion`

### Realistic Data

**Stats snapshot:**
- 241 files imported (total)
- 52 test cases generated (from completed)
- 12 pending action (waiting clarification/retry)
- 2 failed (PDF parsing, fetch timeout)

**Evidence Rail (row 241 selected):**
- File: orangehrm_buzz_module_requirement-2.xlsx
- Status: In Progress · 45% · est. 1 min remaining
- Source: File upload by System at Feb 26 09:19 AM
- Linked requirements: 23 extracted
- Generated test cases: 0 (A1 in progress, est. 15 to generate)
- Confidence: Medium (65%, may need review)

### Stitch Prompt

**Context:**
You are designing F13 — Imported Files List, a full-frame operational hub for tracking all file imports, Jira syncs, and generated test assets. The frame shows a table of 241+ imports with status (In Progress / Completed / Pending Action / Failed), generated test case counts, metadata, and an optional evidence rail for detailed import info, A1 logs, and retry buttons. This is the primary post-import landing page in QA Nexus PM1.

**Design Tokens:**
- Canvas: `#0B0F17`, base `#111827`, raised `#1A2233`, overlay `#232C3F`
- Text: primary `#F1F5F9`, secondary `#C7D0DC`, tertiary `#8A94A6`
- Brand: violet `#A78BFA`, teal `#2DD4BF`
- Semantic: pass `#34D399`, fail `#F87171`, warn `#FBBF24`, info `#60A5FA`
- Typography: Inter (UI), DM Sans (display), Geist Mono (metrics), JetBrains Mono (code)

**Render Instructions:**

1. **Question header (80 px):** "What have we imported, and what got generated?" (DM Sans 32/40 bold primary), answer below (Inter 16/24 secondary)
2. **Stats strip (100 px, 4 cards):** "241 files imported" (Geist Mono 28/32 primary + label), "52 test cases generated" (teal metric), "12 pending action" (warn metric), "2 failed" (fail metric). Icons: file-multi, test-case, warning, error. Cards: raised bg, subtle border.
3. **Search + Filter (60 px):** Search input left (max 240 px, Inter 13/18 placeholder, search icon left), filter chips right (scrollable): "Type: All / Requirements / Test Cases / Video / Other", "Status: All / In Progress (amber) / Completed (teal) / Pending (warn) / Failed (red)", "Source: All / File / Jira / Confluence / Figma", "Date range: Last 7 days / This month / All time"
4. **Table (scrollable, 600 px tall, 9 columns):**
   - Columns: ID (60 px mono centered) | Name (260 px with icon, clickable) | Type (120 px chip) | Status (140 px colored chip: In Progress amber+spinner / Completed teal+checkmark / Pending warn+info / Failed red+X) | Est. Time (100 px mono) | Test Cases (100 px mono bold) | Created by (120 px) | Created Date (140 px mono) | Actions (80 px: View/Download/Delete)
   - Realistic rows (241 total, showing 10): [See table above in Content Regions]
   - Headers sortable (click), rows selectable (click opens evidence rail)
   - Padding: 0 edges, 32 px outer sides
5. **Pagination (60 px bottom):** "Rows per page: [10 ▾]" left, "Showing 1–10 of 241 files" center, "← Page 1 of 25 →" right
6. **Evidence rail (380 px right docked, optional):**
   - **Header (80 px):** File name (Inter 14/20 bold) + close (×) top-right
   - **Scrollable details:**
     - Full file name (Geist Mono 11 copyable)
     - Source platform (File / Jira / Confluence / Figma)
     - Linked requirements: count + link to F14
     - Generated test cases: count + status + link to F17
     - **A1 generation log:** If completed: "✓ A1 completed 2 min ago. 52 cases generated high confidence." If pending: "⚠ A1 waiting for clarification: '[question]'" with Respond/Skip buttons. If failed: "✗ A1 failed. Error: [error text]" with Re-run button (red border).
     - "Re-run A1 generation" button (secondary violet) if status Failed/Pending
   - Overlay bg, left border subtle
7. **States:**
   - Empty: "No imports yet" CTA "Upload your first file →"
   - Loading: Table skeleton rows (10 rows gray shimmer), spinner in Pending Action stat
   - Error (row): Status "Failed" red chip, tooltip in evidence rail "PDF parsing failed. Retry?"
   - Success: Status "Completed" teal checkmark, stats increment, toast "Import complete! 52 test cases ready."
   - Pending: Status "Pending Action" amber warning, A1 clarification questions in evidence rail with Respond/Skip
8. **Interactions:** Search/filter update table real-time. Column header click sorts (arrow indicator). Table row click opens evidence rail. File name click → F17 filtered. View button → evidence rail. Download exports CSV/JSON. Delete → confirmation modal. Pagination arrows navigate. Evidence rail Re-run A1 button retries + shows result inline.
9. **Accessibility:** Focus: search → filters → table → pagination. Color + icon + text (no color alone). All ≥44px. Tab/Enter/arrow nav. Screen reader announces table as grid, rows with ID/name/status/count. Motion respects `prefers-reduced-motion`.
10. **Visual hierarchy:** DM Sans for question, Inter for body labels, Geist Mono for metrics/timestamps, colored chips for status, teal for file-name clickability.

**Anti-drift line (CRITICAL):**
Apply 01_SYSTEM.md navigation contract and design tokens VERBATIM. Do not use Material Design 3 tokens. Do not extend Tailwind config. Hardcode hex values. Primary=#2DD4BF teal, Secondary=#A78BFA violet, no tertiary.

**Output:** Data-heavy operational table with real-time filtering, sorting, and side-panel details. Stitch-ready with pixel-precise layout, token-compliant colors, clear status indicators, evidence integration.

---

## §5. Frame F14 — Requirements (Jira-Fetched + Uploaded)

### Front Matter

| Attribute | Value |
|---|---|
| **Frame ID** | F14 |
| **Title** | Requirements |
| **Canvas Size** | 1600 × 1024 (Full desktop: rail + top bar + main canvas + optional evidence rail) |
| **Role Gate** | All roles |
| **Primary User** | QA Engineer, QA Lead, Product Manager, Stakeholder |
| **Page Question** | "What requirements are we covering, and what's missing tests?" |
| **Entry Points** | Plan → Requirements (main nav); F13 file-name click (filtered to source); F08b Home dashboard |
| **Exit Points** | Requirement card click → evidence rail opens; "Generate cases with A1" → F16b; "View cases" → F17 filtered |

### Purpose

F14 is the operational Requirements view, answering "What do we need to test, and how well are we testing it?" Users see all requirements (from Jira and uploaded files), grouped by source, with test coverage metrics and quick actions to generate test cases (A1) or view existing ones. This frame bridges requirements discovery (F13) to test case authoring (F16b/F17) and enables live traceability between requirements and test coverage.

### Content Regions

**Region 1: Question Header (80 px)**
- Position: 272 px left, 56 px top
- Question: "What requirements are we covering, and what's missing tests?" (DM Sans 32/40 bold primary)
- Answer: "View all requirements with test case coverage metrics." (Inter 16/24 secondary)

**Region 2: Stats Strip (100 px)**
- 4 stat cards: "142 requirements" (Geist Mono 28/32 primary), "98 covered by tests" (green metric), "36 partial coverage" (amber metric), "8 uncovered" (red metric + "7 high-priority uncovered" subtext)
- Icons: requirement (teal), checkmark (green), warning (amber), X (red)

**Region 3: Filter Bar (60 px)**
- Left: Search input "Search by title, ID, source…" (max 240 px, Inter 13/18)
- Right: Filter chips (scrollable)
  - Status: All / Draft / Active / Done
  - Priority: All / P0 / P1 / P2
  - Source: All / Jira / Uploaded
  - Coverage: All / Covered / Partial / Uncovered
  - Sprint: [dropdown: All / Sprint 42 / Sprint 41 / Backlog]
  - Owner: [dropdown: All / Priya S / Arjun M / Rahul K / Neha D]

**Region 4: Requirement Groups (scrollable, main content)**
- **Group 1: "From Jira" (128 requirements)**
  - Header: "From Jira" (Inter 13/18 uppercase bold) + chip "128", collapsible arrow
  - List: Grid of requirement cards (1–2 per row)
  
  **Requirement Card Layout:**
  - Background: raised `#1A2233`
  - Border: 1 px subtle, hover: 1 px strong, shadow lift on hover
  - Padding: 20 px
  - Border radius: `radius.md` (8 px)
  
  **Card Content:**
  1. Header row: ID (Geist Mono 12/16 bold secondary left) | Priority chip (P0/P1/P2 right, colored) | Status chip (Draft/Active/Done right, colored)
  2. Title: Full title or truncated (Inter 14/20 bold primary, max 80 chars, tooltip)
  3. Source badge: "Jira" (Geist Mono 10/14 white, teal pill)
  4. Coverage section: "Coverage: " label + coverage chip (e.g. "12 cases · 10 automated", green pill) + colored bar (100% green, 50% amber, 0% red)
  5. Metadata: "Last updated: Feb 26 10:15 AM" (Inter 11/16 tertiary right) | "Assigned to: [avatar] Priya S"
  6. Quick actions: "Generate cases with A1 →" (secondary violet text, chevron) | "View cases →" (secondary teal text, chevron)

- **Group 2: "Uploaded" (14 requirements)**
  - Header: "Uploaded" (Inter 13/18 uppercase) + chip "14", collapsible
  - Same card layout, source badge shows "File upload" (e.g. "orangehrm_buzz_module_requirement-2.xlsx")
  
  **Realistic cards (Uploaded):**
  - ACM-UL-001 | "Email notifications on task assignment" | Uploaded | P1 | Active | 3 cases · 2 automated
  - ACM-UL-002 | "Buzz module comment threading UI" | Uploaded | P2 | Draft | 0 cases (urgent)

### Interactions

- Tab/Shift+Tab navigate search, filters, cards
- Enter activates focused card or button
- ↑↓ move between cards
- ⌘J / Ctrl+J toggle evidence rail
- ⌘K / Ctrl+K focus search
- Esc close evidence rail
- Search input → filter cards real-time
- Filter chip → toggle (updates cards)
- Sprint dropdown → select sprint
- Owner dropdown → select assignee
- Group header (collapsible arrow) → expand/collapse
- Requirement card click → open evidence rail
- "Generate cases with A1" → open F16b (prefilled with requirement)
- "View cases" → navigate F17 (filtered to requirement's test cases)

### Accessibility

- Focus order: Search → Filters → Cards → Evidence rail
- Color + icon (priority/status use color + text, no color alone)
- Keyboard: Tab-navigable, Enter opens evidence rail/button, arrow keys navigate cards
- Screen reader: Group headers announced ("From Jira, 128 requirements"), cards read as "ID · Title · Priority · Status · Coverage"
- Touch target: Cards ≥60px, buttons ≥44px
- Motion: Evidence rail fade-in (120ms fast); respects `prefers-reduced-motion`

### Realistic Data

**Stat Cards:**
- 142 requirements (total)
- 98 covered by tests (69%)
- 36 partial coverage (25%)
- 8 uncovered (5.6%, including 7 high-priority)

**Cards (From Jira, first 3):**

| ID | Title | Priority | Status | Coverage | Last Updated |
|---|---|---|---|---|---|
| CART-234 | Cart total calculation incorrect for 3+ items | P1 | Active | 12 cases · 10 automated | Feb 26 10:15 AM |
| AUTH-891 | Login timeout on flaky networks | P0 | Active | 8 cases · 7 automated | Feb 26 08:20 AM |
| PAY-1472 | Implement OAuth 2.0 for Stripe SCA | P1 | Active | 15 cases · 12 automated | Feb 26 04:30 AM |

**Evidence Rail (CART-234 selected):**
- Title + Description + Jira link
- Priority (P1 red chip), Status (Active teal), Sprint (Sprint 42), Owner (Priya S avatar)
- Linked test cases: 12 total (list preview, link to F17)
- Linked defects: 2 total (preview, link to F21)
- Generation history: "A1 generated 12 cases on Feb 26 10:12 AM · High confidence"

### Stitch Prompt

**Context:**
You are designing F14 — Requirements, a full-frame operational view of all requirements for a QA Nexus project (Jira-fetched + uploaded). The frame shows question header, stats cards (Total / Covered / Partial / Uncovered), search + filter bar, grouped requirement cards (From Jira / Uploaded) with ID, title, priority, status, test coverage (count + %), quick actions (generate A1 / view cases), and optional evidence rail with full requirement detail, linked test cases, defects, generation history. This is the central requirements planning hub in QA Nexus PM1.

**Design Tokens:**
- Canvas: `#0B0F17`, base `#111827`, raised `#1A2233`, overlay `#232C3F`
- Text: primary `#F1F5F9`, secondary `#C7D0DC`, tertiary `#8A94A6`
- Brand: violet `#A78BFA`, teal `#2DD4BF`
- Semantic: pass `#34D399`, fail `#F87171`, warn `#FBBF24`, info `#60A5FA`
- Typography: Inter (UI), DM Sans (display), Geist Mono (metrics), JetBrains Mono (code)

**Render Instructions:**

1. **Question header (80 px):** "What requirements are we covering, and what's missing tests?" (DM Sans 32/40 bold primary), answer (Inter 16/24 secondary)
2. **Stats strip (100 px, 4 cards):** "142 requirements" (Geist Mono 28/32 primary), "98 covered" (green metric), "36 partial" (amber metric), "8 uncovered" (red metric). Icons: requirement, checkmark, warning, X. Cards: raised bg, subtle border.
3. **Search + Filter (60 px):** Search input left (max 240 px), filter chips right: "Status: All / Draft / Active / Done", "Priority: All / P0 / P1 / P2", "Source: All / Jira / Uploaded", "Coverage: All / Covered / Partial / Uncovered", "Sprint: [dropdown]", "Owner: [dropdown]"
4. **Requirement Groups (scrollable):**
   - **Group 1: "From Jira" (128)** — collapsible header + chip "128"
   - **Group 2: "Uploaded" (14)** — collapsible header + chip "14"
   - **Card per card:** Header row: ID (Geist Mono 12/16 bold secondary left) | Priority chip (P0/P1/P2 colored right) | Status chip (Draft/Active/Done colored right) | Title (Inter 14/20 bold primary, max 80 chars, tooltip) | Source badge ("Jira" or "File upload", teal pill, Geist Mono 10/14 white) | Coverage section ("Coverage: " label + chip "12 cases · 10 automated" colored pill + colored bar 100% = green) | Metadata ("Last updated: Feb 26 10:15 AM" tertiary right, "Assigned to: [avatar] Priya S") | Quick actions ("Generate cases with A1 →" violet secondary chevron, "View cases →" teal secondary chevron)
   - Card background: raised bg, subtle border, hover: strong border + elevation.1, clickable focus ring
5. **Evidence rail (380 px right docked, optional):**
   - **Header:** Requirement ID + Title (Inter 14/20 bold) + close (×) top-right
   - **Details:**
     - Full description (Inter 13/18, scroll for more)
     - Jira link (clickable)
     - Priority, Status, Sprint, Owner (chips/labels)
     - Linked test cases: "12 total" (link to F17) + preview list (first 3, clickable)
     - Linked defects: "2 total" (link to F21) + preview (first 2, clickable)
     - Generation history: "A1 generated 12 cases on Feb 26 10:12 AM · High confidence"
     - "Generate cases with A1" button (secondary violet) repeats from card
   - Overlay bg, left border subtle
6. **Interactions:** Search/filter update cards real-time. Group headers toggle expand/collapse. Card click opens evidence rail. Action buttons navigate F16b or F17. Filter dropdowns show dynamic lists.
7. **States:**
   - Empty: "No requirements yet" CTA "Import from Jira or upload →"
   - Loading: Card skeletons (10 rows), search/filter disabled
   - Error (search): "No requirements match search." + "Clear search"
   - Error (filter): "No requirements match filters." + "Clear filters"
   - Success: All cards visible, stats show counts, filters applied
8. **Accessibility:** Focus: search → filters → cards → evidence rail. Color + text (no color alone). All ≥44px. Tab/Enter/arrow nav. Screen reader announces groups ("From Jira 128 requirements") and cards ("CART-234 · title · P1 · Active · 12 cases"). Motion respects `prefers-reduced-motion`.
9. **Visual hierarchy:** DM Sans for question, Inter for body labels, Geist Mono for metrics/IDs, colored chips for priority/status/coverage, violet for A1 actions, teal for view actions.

**Anti-drift line (CRITICAL):**
Apply 01_SYSTEM.md navigation contract and design tokens VERBATIM. Do not use Material Design 3 tokens. Do not extend Tailwind config. Hardcode hex values. Primary=#2DD4BF teal, Secondary=#A78BFA violet, no tertiary.

**Output:** Requirements planning hub with grouped cards, live filters, coverage metrics, quick actions. Stitch-ready with pixel-precise layout, token-compliant colors, status hierarchy, evidence integration.

---

## §5b. Frame F14m1 — Edit / Add Requirement Modal (v2.2 NEW)

### Front Matter
| Attribute | Value |
|---|---|
| **Frame ID** | F14m1 |
| **Added** | v2.2 (2026-04-24) — modal companion to F14 |
| **Title** | Edit / Add Requirement Modal (dual-mode) |
| **Canvas Size** | 960 × 720 (Edit Modal) |
| **Role Gate** | All roles can edit own; Lead/Admin can edit any |
| **Primary User** | QA Lead, QA Engineer, Admin |
| **Entry Points** | F14 "Edit" button on any requirement card → Edit mode pre-filled; F14 header "+ Add requirement" → Add mode empty form |
| **Exit Points** | Save → F14 refreshed with updated data · Cancel → F14 unchanged |

### Purpose
Single modal handles TWO modes: Edit (pre-filled with existing requirement, e.g., RET-142) and Add (empty form, auto-generates next `REQ-###` ID). Shared shell: header, form, footer all identical; mode differences = Edit mode shows sync warning banner + RET ID; Add mode hides banner and shows ID preview. For render, depict Edit mode as main composition with Add mode as 320×200 thumbnail reference panel in top-left of body.

### Content Regions

**Header (80px):** Title "Edit requirement" + sub `RET-142` + "Synced from Jira" status dot + last-edited metadata + Edit/Add segmented mode toggle + close ×.

**Sync Warning Banner (56px, Edit mode only, amber-tinted):** ⚠️ + "Changes sync to Jira — edits push bidirectionally to `RET-142` on `iksula.atlassian.net`." + Sync changes toggle ON (teal).

**Body (scrollable, 2-column):**
- Left 320px: Add mode thumbnail reference card with mini skeletons + footnote explaining mode differences + role block "QA LEAD · full edit · any requirement".
- Right 600px: Form fields — Title (required, 48/200 counter), Description (required, 218/2000 counter, with "✨ Polish with A1" violet ghost helper + "(unsaved)" dirty indicator), Priority + Status + Sprint + Owner (2-col metadata grid), Acceptance Criteria (3 rows with drag handles, editable inputs, "✨ Draft more with A1" violet link), Tags & Links (3 tag chips + 3 linked-item chips including DEF-087 red, 8 linked TC teal, RET-E-12 violet-outlined Parent Epic), Custom Fields (collapsed "3 auto-synced" with expand ⌄).

**Footer (80px):** Left — `RET-142` mono + "Synced to `iksula.atlassian.net`" + "Last sync: `9:58 AM` · Next sync: on save". Right — View history ghost + Discard changes ghost + **"Save changes"** teal primary.

### Interactions
- Edit field → Save enabled + "(unsaved)" appears
- Drag AC rows to reorder
- Toggle Sync changes OFF → banner turns neutral, "Changes will be LOCAL only"
- "✨ Polish with A1" → inline A1 wording polish
- Save → validates, saves, closes, F14 refreshes, Activity Sidebar logs change

### Accessibility
- Focus order: mode toggle → sync toggle → title → description → A1 polish → priority → status → sprint → owner → AC rows → tags → add-tag input → linked-item actions → custom-field expand → view-history / discard / save
- All required fields marked with `*` label; sync banner announced to screen reader

### Realistic Data
Fully pre-filled with RET-142: title "Implement refund API for failed orders", description with `refund.retry.exhausted` inline code, P0 Critical red, Active teal, Sprint 42, Yogesh M. owner (LEAD violet pill), 3 ACs (1s/4s/9s delays, idempotency key, exhausted event), tags `refund · payments · high-risk`, linked DEF-087 + 8 TC-RET + RET-E-12 Epic.

### Anti-drift constraints
1. Primary = teal (Save CTA, status chip, sprint chip, AC add link, focus rings, Sync toggle ON). Secondary = violet (ONLY on "✨ Polish with A1", "✨ Draft more with A1", Parent Epic chip outline, LEAD role pill).
2. **Save changes is TEAL, not violet** — this is a system confirm action.
3. P0 red, P1 amber, P2 teal, P3 tertiary on priority.
4. Sync banner hidden in Add mode.
5. Add mode ID preview `REQ-035` in thumbnail.
6. Modal shell 960 × 720; scrim + blur over F14.

---

## §5c. Frame F14m2 — Link Test Case Modal (v2.2 NEW)

### Front Matter
| Attribute | Value |
|---|---|
| **Frame ID** | F14m2 |
| **Added** | v2.2 (2026-04-24) — picker companion to F14 |
| **Title** | Link Test Case Modal (multi-select picker) |
| **Canvas Size** | 720 × 640 (Picker Modal) |
| **Role Gate** | All roles |
| **Primary User** | QA Lead, QA Engineer |
| **Entry Points** | F14 "Link test" button on any requirement card |
| **Exit Points** | Link N tests → F14 refreshed with updated coverage · Cancel → no change |

### Purpose
Multi-select picker that lets a user search, filter, and check test cases from the project's library to link them to a specific requirement. Already-linked cases shown as disabled with 🔒. A1-drafted cases get a violet "✨ A1 draft" pill. Selected chips strip appears above list when ≥1 newly checked. Primary action count reflects newly-checked count (e.g., "Link 2 tests →").

### Content Regions

**Header (80px):** Title "Link test cases" + sub "Linking to `RET-142` · Implement refund API for failed orders" + status strip "Currently linked: 8 cases · Coverage: 67% (8/12)" + close ×.

**Requirement Context Card (64px):** Story blue dot + `RET-142` mono teal + title + "View requirement →" tertiary.

**Search + Filter Bar (56px):** Search "Search test cases by title, ID, or tag…" + Suite/Priority/Source/Sort dropdowns.

**A1 Suggestion Banner (56px, violet-tinted, only if matches exist):** ✨ + "A1 found 4 drafts matching this requirement — generated from `return_policy_v2.xlsx` via import `#242`" + "Show only A1 drafts" violet link.

**Selected Chips Strip (44px, only when ≥1 checked):** "Selected (2):" + TC chips with × + "Clear selection" tertiary.

**Test Case List (280px scrollable):** Header row (checkbox · TEST CASE · SUITE · PRIORITY · LAST RUN), 6 data rows each 56px — mix of unchecked available, CHECKED newly-selected (teal tinted + 3px teal accent), LOCKED 🔒 already-linked (with "Already linked" tertiary annotation), A1 drafts (violet "A1 draft" pill).

**Footer (72px):** Left "Don't see your test case? + Create new test case →" teal link (routes to F16a). Right — Cancel ghost + **"Link 2 tests →"** teal primary (count reflects newly-checked).

### Interactions
- Click unlocked row → toggle check, update Selected strip + count on Link button
- Click × on selected chip → uncheck
- Hover locked row → tooltip "This test case is already linked"
- "Show only A1 drafts" → filter to A1-source cases
- "+ Create new test case →" → close modal, open F16a scoped to requirement

### Accessibility
- Focus order: search → filters → A1 banner link → selected chips → table rows → Create new link → Cancel → Link CTA
- Locked row announced as "Already linked, not selectable"

### Realistic Data
- Linking to RET-142, 8 already linked, coverage 67%
- Rows: TC-RET-405 unchecked A1 draft (Not run), TC-RET-411 CHECKED A1 draft (Not run), TC-RET-401 🔒 linked (Pass 2d ago), TC-RET-402 🔒 linked (Pass 2d ago), TC-RET-418 CHECKED Flaky "3 of 5 passed · 1d ago", TC-RET-423 unchecked Fail 4h ago
- Selected: TC-RET-411 + TC-RET-418
- Link button: "Link 2 tests →" enabled

### Anti-drift constraints
1. **Link CTA is teal, not violet** — this is a system action, not AI.
2. Violet reserved for A1 banner + A1 draft pills + "Show only A1 drafts" link.
3. Locked rows use 🔒 + "Already linked" annotation; NOT grayscale.
4. Selected rows use teal 3px left-accent + subtle teal-tinted bg.
5. Run status color-coded (Pass green, Fail red, Flaky amber, Not run tertiary).
6. Modal 720 × 640; scrim + blur over F14.

---

## §5d. Frame F14m3 — Convert to Jira Story Modal (v2.2 DEFERRED)

Deferred to engineering implementation unless stakeholder demo requires it. When built: 480 × 360 Confirm Modal, pre-fills Jira fields from the uploaded requirement, previews mapping (Story → Requirement), Cancel + "Create in Jira →" teal primary. Would use the standard confirm-modal shell.

---

## §6. Frame F15 — Knowledge Base (Searchable KB + AI Synthesis)

### Front Matter

| Attribute | Value |
|---|---|
| **Frame ID** | F15 |
| **Title** | Knowledge Base |
| **Canvas Size** | 1600 × 1024 (Full desktop: rail + top bar + main canvas + optional evidence rail) |
| **Role Gate** | All roles (Lead/Admin can create/edit) |
| **Primary User** | QA Engineer, QA Lead, Test Automation Engineer |
| **Page Question** | "What do we already know that should shape this work?" |
| **Entry Points** | Author → Knowledge Base (main nav); F16b context link (A1 uses KB); global search (⌘K) |
| **Exit Points** | Article click → evidence rail opens; "Use in A1 context" → pins article for A1 generation; related articles → navigate KB |

### Purpose

F15 is a searchable knowledge graph of approved QA documents — test strategies, runbooks, RCA reports, release readiness playbooks, and onboarding guides. Users search for domain knowledge (e.g. "How do we test 3DS flows?"), A1 synthesizes a contextual answer from KB articles with cited sources, and users can pin articles to feed A1 Test Case Generator (F16b). This frame centralizes organizational QA knowledge, making it discoverable and actionable for test planning and case generation. KB documents are part of PM1 Core Doc Catalog (12 templates).

### Content Regions

**Region 1: Question Header (80 px)**
- Position: 272 px left, 56 px top
- Question: "What do we already know that should shape this work?" (DM Sans 32/40 bold primary)
- Answer: "Search the knowledge base and pin articles to guide AI generation." (Inter 16/24 secondary)

**Region 2: AI Answer Preview Card (120 px, below header)**
- Background: raised `#1A2233`, 24 px margin
- Border: 1 px subtle, hover: 1 px strong + shadow lift
- **Input field (50 px top):** Placeholder "Ask a question or search (e.g., 'How do we test 3DS flows?')" (Inter 14/20), search icon left, sparkle icon right (indicates AI), focus: violet border, shadow lift
- **AI Answer section (below, when user types + Enter or 1s idle):**
  - Agent label (top-left): "A1 · Knowledge Synthesis" (violet chip, Inter 11/16)
  - Answer text (Inter 14/20 primary, max 200 chars truncate): "We test 3DS by validating challenge flow, webhook delivery, fallback handling. See: 'Payment Gateway Testing' and 'OAuth 2.0 flows'."
  - Cited sources (bottom, small chips): `[Article 1] [Article 2]` (Inter 11/16 teal, clickable → jump to article)
  - Loading: Spinner + "Synthesizing answer…" (1–3 seconds)

**Region 3: Browse Tree (left pane, 240 px, optional context)**
- Position: 272 px left, ~256 px top
- Width: 240 px (toggleable via hamburger or `⌘J`)
- Background: overlay `#232C3F`
- Hierarchical, collapsible categories (icons):
  - Runbooks (blue icon)
    - Manual Testing Runbook (sub-section)
      - "Setup test environment"
      - "Edge case testing"
    - Automation Runbook (sub-section)
      - "CI/CD integration"
  - Test Strategies (violet icon)
    - "Mobile testing strategy"
    - "API testing strategy"
    - "Performance testing approach"
  - RCA Reports (red icon)
    - "Q1 2026 production issues"
    - "Flakiness investigation Feb 2026"
  - Release Playbooks (teal icon)
    - "Pre-release testing checklist"
    - "Rollback procedures"
  - Onboarding Guides (gray icon)
    - "QA Engineer onboarding"
    - "Automation setup guide"

**Region 4: Filter Chips + Sort (60 px, if tree hidden)**
- Left: Category filters "All / Runbooks / Test Strategies / RCA Reports / Release Playbooks / Onboarding" (teal underline on active)
- Right: Sort dropdown "Recent / Most viewed / Alphabetical", View toggle (Grid 3-col / List 2-col)

**Region 5: Main Content Grid (scrollable, 3-col responsive)**
- **KB Article Card Layout:**
  - Background: raised `#1A2233`
  - Border: 1 px subtle, hover: 1 px strong + shadow lift
  - Padding: 20 px
  - Border radius: `radius.md` (8 px)
  - Clickable focus ring
  
  **Card Content (top-to-bottom):**
  1. Header row: Title (Inter 14/20 bold primary, 60 chars truncate, left) | Star icon (unpadded if pinned = violet filled, right, clickable)
  2. Category badge: "Test Strategies" (chip, gray bg, Inter 11/16 secondary)
  3. Metadata: "Approved on Feb 15, 2026 · By Priya S" (Inter 11/16 tertiary)
  4. View count: "👁 1,247 views" (emoji + count, Inter 11/16 tertiary right)
  5. Content preview (optional): 2–3 line excerpt (Inter 13/18 secondary, truncate)
  6. Quick actions row: "View" button (secondary teal) | "Pin for A1 context" button (secondary violet star) | "⋯" menu

**Realistic cards (12 visible, 80+ total):**

| Category | Title | Approved On | By | Views | Pinned |
|---|---|---|---|---|---|
| Test Strategies | Mobile Testing Strategy | Feb 15, 2026 | Priya S | 1,247 | — |
| Test Strategies | API Testing Best Practices | Feb 10, 2026 | Rahul K | 892 | ⭐ |
| Runbooks | Manual Testing Runbook | Feb 8, 2026 | Neha D | 654 | — |
| Release Playbooks | Pre-Release Readiness Checklist | Feb 1, 2026 | Arjun M | 2,341 | ⭐ |
| RCA Reports | Q1 2026 Production Issues | Jan 31, 2026 | Yogesh M | 456 | — |
| Onboarding | QA Engineer Onboarding Guide | Jan 25, 2026 | Priya S | 1,893 | — |

**Region 6: Evidence Rail (380 px right, optional)**
- Background: overlay `#232C3F`, left border subtle
- **Header (100 px):** Title (Inter 14/20 bold, wrap) + Category chip + "Pin for A1 context" button (violet star, Inter 12/16) + close (×) top-right
- **Table of Contents (scrollable section):** Heading list extracted (Inter 13/18 links, hierarchical indent)
- **Article content (main scrollable):** Full text, headings bold, body Inter 13/18, links teal + underline
- **Related articles (sticky bottom):** "Related articles" header (Inter 12/16 uppercase bold) + 3–5 articles (Inter 12/16 teal, clickable)
- **"Pin for A1 context" button (sticky bottom, 44 px full-width):** "Pin for A1 context" (violet chip white Inter 13/500) OR "✓ Pinned for A1" (teal checkmark momentary highlight)

### Interactions

- ⌘K / Ctrl+K focus search
- Enter submit search → A1 synthesizes answer (1s idle or Enter)
- Tab/Shift+Tab navigate cards, filters, buttons
- Enter activate focused card (opens evidence rail) or button
- ↑↓ move between cards
- ⌘J / Ctrl+J toggle evidence rail
- Esc close evidence rail
- Search input → type → A1 synthesizes answer → shows answer + cited sources
- Cited source chip (in AI answer) → jump to article in grid
- Filter chip → toggle (updates grid)
- Sort dropdown → update order
- View toggle (Grid/List) → switch layout
- Tree item (left pane) → filter by category
- Card click → open evidence rail
- "View" button → open evidence rail
- "Pin for A1 context" (card or evidence rail) → toggle pinned state (star fill, violet)
- TOC heading link (evidence rail) → scroll article to heading
- Related articles link → open in evidence rail

### Accessibility

- Focus order: Search → Filter chips → Tree (if shown) → Cards → Evidence rail
- Color + icon (pinned = star filled + violet)
- Keyboard: Tab-navigable, Enter opens evidence rail/button, arrow keys navigate grid
- Screen reader: Search announced as "Ask question or search, AI synthesis enabled", grid as "Article grid 12 per page", cards as "Title · Category · Approved · Author · Views"
- Touch target: Cards ≥60px, buttons ≥44px
- Motion: Evidence rail slide-in (200ms medium); respects `prefers-reduced-motion`

### Realistic Data

**Search Query:**
- Input: "How do we test OAuth 2.0 flows?"
- A1 answer (1–2 seconds): "OAuth 2.0 flows tested by validating authorization code flow, token refresh, scope validation, error handling. See: 'API Testing Best Practices' and 'Payment Gateway Testing Runbook'."
- Cited sources: [API Testing Best Practices] [Payment Gateway Testing Runbook]

**Filter State:**
- Category: "Test Strategies" (teal underline)
- Grid: 8 articles from Test Strategies
- Message: "Showing 8 articles in 'Test Strategies'"

**Evidence Rail (article "Mobile Testing Strategy" opened):**
- Title: Mobile Testing Strategy
- Category: Test Strategies
- TOC: 1. Setup, 2. Device Testing, 3. Network Conditions, 4. Accessibility Testing, 5. Performance Baseline
- Content: Full strategy text (scrollable)
- Related articles: API Testing Best Practices, Performance Testing Approach, QA Engineer Onboarding Guide

### Stitch Prompt

**Context:**
You are designing F15 — Knowledge Base, a full-frame searchable knowledge graph for QA Nexus. The frame features question header, AI answer preview card (user types question, A1 synthesizes contextual answer with cited sources), optional left tree (browse KB categories: Runbooks, Test Strategies, RCA Reports, Release Playbooks, Onboarding), main grid of KB article cards (3-col responsive), and optional evidence rail showing full article content, TOC, related articles, "Pin for A1 context" button. This is the organizational knowledge hub feeding A1 Test Case Generator with domain context.

**Design Tokens:**
- Canvas: `#0B0F17`, base `#111827`, raised `#1A2233`, overlay `#232C3F`
- Text: primary `#F1F5F9`, secondary `#C7D0DC`, tertiary `#8A94A6`
- Brand: violet `#A78BFA`, teal `#2DD4BF`
- Semantic: pass `#34D399`, fail `#F87171`, warn `#FBBF24`, info `#60A5FA`
- Typography: Inter (UI), DM Sans (display), Geist Mono (metrics), JetBrains Mono (code)

**Render Instructions:**

1. **Question header (80 px):** "What do we already know that should shape this work?" (DM Sans 32/40 bold primary), answer "Search knowledge base and pin articles to guide AI generation" (Inter 16/24 secondary)
2. **AI Answer card (120 px, 24 px margin):**
   - Search input (DM Sans 14/20, placeholder "Ask a question or search (e.g., 'How do we test 3DS flows?')" + search icon left + sparkle icon right)
   - Answer text below (Inter 14/20 primary, max 200 chars): "We test 3DS by validating challenge flow, webhook delivery, fallback handling. See: 'Payment Gateway Testing' and 'OAuth 2.0 flows'."
   - Agent label (top-left below input): "A1 · Knowledge Synthesis" (violet chip, Inter 11/16)
   - Cited sources (bottom, small teal chips): [Article 1] [Article 2] (clickable)
   - Background: raised bg, subtle border, hover: stronger border + shadow lift
3. **Browse tree (left, optional, 240 px docked or hamburger toggle):**
   - Categories (collapsible): Runbooks (blue icon), Test Strategies (violet icon), RCA Reports (red icon), Release Playbooks (teal icon), Onboarding (gray icon)
   - Sub-items: Indented, clickable, filter grid by category
   - Background: Overlay bg, subtle borders
4. **Filter chips + sort (60 px if tree hidden):**
   - Left: Category filters "All / Runbooks / Test Strategies / RCA Reports / Release Playbooks / Onboarding" (chips, teal underline on active)
   - Right: Sort dropdown "Recent / Most viewed / Alphabetical" + View toggle (Grid 3-col / List 2-col)
5. **Main content grid (scrollable, 3-col responsive):**
   - **KB article card per card:**
     - **Header row:** Title (Inter 14/20 bold primary, 60 chars truncate, left) | Star icon (unpadded if pinned = violet filled, right, clickable)
     - **Category badge:** "Test Strategies" (chip gray bg, Inter 11/16 secondary)
     - **Metadata:** "Approved on Feb 15, 2026 · By Priya S" (Inter 11/16 tertiary)
     - **View count:** "👁 1,247 views" (emoji + count, Inter 11/16 tertiary right)
     - **Content preview (optional):** 2–3 line excerpt (Inter 13/18 secondary, truncate)
     - **Quick actions row:** "View" button (secondary teal) | "Pin for A1 context" button (secondary violet star) | "⋯" menu (tertiary)
   - Card background: Raised bg, subtle border, hover: stronger border + elevation.1
   - Realistic articles (12 visible, 80+ total): See table above in Content Regions
6. **Evidence rail (380 px right docked, optional):**
   - **Header (100 px):** Title (Inter 14/20 bold primary, wrap) + Category chip + "Pin for A1 context" button (violet text star, Inter 12/16) + close (×) top-right
   - **Table of Contents (scrollable):** Heading list extracted (Inter 13/18 links, indented hierarchy)
   - **Article content (main scrollable):** Full text, headings bold, paragraphs Inter 13/18, links teal underline
   - **Related articles (sticky bottom):** "Related articles" header (Inter 12/16 uppercase bold) + 3–5 articles (Inter 12/16 teal, clickable)
   - **"Pin for A1 context" button (sticky bottom, 44 px full-width):** "Pin for A1 context" (violet chip white Inter 13/500) OR "✓ Pinned for A1" (teal checkmark momentary highlight)
   - Background: Overlay bg, left border subtle
7. **Interactions:**
   - Search input → type → A1 synthesizes answer (1s idle or Enter) → shows answer + cited sources
   - Cited source chip click → jump to article in grid
   - Filter chip click → updates grid immediately
   - Sort dropdown → updates grid order
   - Tree item click → filter grid by category
   - Card click → open evidence rail
   - "View" button → open evidence rail (same as card click)
   - "Pin for A1 context" (card or evidence rail) → toggle pinned state (star fill, violet), add to session context
   - TOC heading link → scroll article to heading
   - Related articles link → open related article in evidence rail
8. **States:**
   - Empty: "No articles yet" CTA "Create first knowledge article →" (Admin only)
   - Loading: Grid skeleton cards (12 rows), tree categories with spinners on expand
   - AI answer loading: Spinner + "Synthesizing answer…" (1–3 seconds)
   - AI answer error: Red warning icon + "Unable to synthesize answer. Try different question."
   - Search results: "Showing X articles matching 'query'" message + filtered grid
   - No results: "No articles match search." + "Try different search" CTA
   - Evidence rail open: Full article text, TOC, related articles, pin button
9. **Accessibility:** Focus: search → filters → tree (if shown) → cards → evidence rail. Color + icon (pinned = star + violet). All ≥44px. Tab/Enter/arrow nav. Screen reader announces grid as "Article grid", cards as "Title · Category · Approved · Author · Views". Motion respects `prefers-reduced-motion`.
10. **Visual hierarchy:** DM Sans for question, Inter for body labels, Geist Mono for dates/counts, violet for A1 actions + pinned indicator, teal for view/related article actions, category chips use semantic colors.

**Anti-drift line (CRITICAL):**
Apply 01_SYSTEM.md navigation contract and design tokens VERBATIM. Do not use Material Design 3 tokens. Do not extend Tailwind config. Hardcode hex values. Primary=#2DD4BF teal, Secondary=#A78BFA violet, no tertiary.

**Output:** Knowledge discovery hub with AI synthesis, browsable tree, searchable grid, side-panel article reading. Stitch-ready with pixel-precise layout, token-compliant colors, AI context integration, pin-for-A1 workflow.

---

## §7. Generation Order

**Verify F11 → F12 → F13 (end-to-end upload flow) → F14 → F15**

This ordering ensures:
1. F11 (Jira source) and F12 (upload/AI) are integration/ingestion entry points
2. F13 (imported files list) is the post-ingestion hub, verifying what was brought in
3. F14 (requirements) depends on F13's data being available to display coverage
4. F15 (KB) is supplementary context for test case generation, stands alone but feeds F16b

**CRITICAL:** Before generating any frame, re-confirm with Stitch that §1 pinned reminder and all anti-drift lines are locked in 01_SYSTEM.md context.

---

**End of 03_SOURCE_AND_DOCS.md**
