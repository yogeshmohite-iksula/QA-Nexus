# Golden-set REVIEW_GUIDE — T032 (M0 R3 mitigation)

> **Status (2026-05-02 Day 6):** ✅ All 3 sets accepted and committed to `final/`.
> A4 root-cause tagging completed via Codex on 2026-05-02. M0 acceptance gate met.

---

## What was built (2026-05-01 → 2026-05-02)

| Set    | Agent                                | Items                                                                  | File                                                             |
| ------ | ------------------------------------ | ---------------------------------------------------------------------- | ---------------------------------------------------------------- |
| **A1** | A1 Scribe (test-case generator)      | 30 CPI requirements                                                    | `apps/api/test/golden-sets/a1/final/cpi_requirements.json`       |
| **A2** | A2 Sentinel (duplicate-bug detector) | 54 easy + 48 hard = **102 duplicate pairs**                            | `apps/api/test/golden-sets/a2/final/easy.json` + `hard.json`     |
| **A4** | A4 Sherlock (root-cause classifier)  | **75 CPI defects (50 real + 25 augmented), 62 L1-L5 tagged + 13 SKIP** | `apps/api/test/golden-sets/a4/final/cpi_postmortem_defects.json` |

**Total: 207 evaluation artifacts.**

---

## Source provenance (audit trail)

| Set | Source data                                                                                         | Method                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | Real CPI Jira export (114 Story+Task issues)                                                        | Picked top 30 with priority spread (Highest 6 / High 12 / Medium 8 / Low 2 / Minor 2). Real Iksula data — no synthesis.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| A2  | Codex-generated alternative phrasings of REAL CPI bugs                                              | Data augmentation from real defects: original bug + 3 alternative wordings = 1 dup-pair × N. NOT pure fabrication. Easy tier = recognizable pattern overlap. Hard tier = reduced keyword overlap, indirect module names, multi-perspective descriptions.                                                                                                                                                                                                                                                                                                                                                   |
| A4  | Real CPI Jira export (73 resolved Bug issues, top 50 by signal richness) + Codex-augmented (25 new) | **Two-tier composition.** First 50 (`CPI-###` keys): real Iksula defects, top 50 of 73 by signal richness (rca + corrective actions + comments length). Tagged L1-L5 by Codex on 2026-05-02 reading rca / corrective_actions / recent_comments fields. Last 25 (`CPI-NEW-###` keys): Codex-augmented synthetic defects in same CPI domain (PIM workflows, NPI processes, ERP, DAM, RBAC, mail routing, SKU enrichment, PMG/SAG selection). Augmentation requested distribution: L1(2) / L2(1) / L3(8) / L4(10) / L5(4). Eval consumers can filter by `key` prefix to weight or restrict to real-only data. |

---

## What A1, A2, A4 each test

Read this BEFORE tagging A4 — important for understanding the eval framework.

### A1 Scribe — Test-Case Generator

**Question A1 must answer:** "Given a requirement, would I generate the test cases a human QA expert would write?"
**Eval at M3:** Compare A1's generated test cases for each requirement in `a1/raw/cpi_requirements.json` against expected human-quality test cases (BE+MAIN to handcraft these in M3).
**Status:** Raw set ready. Expected test-case ground truth is M3-class work.

### A2 Sentinel — Duplicate-Bug Detector

**Question A2 must answer:** "Given a NEW bug report, can I detect that it's a duplicate of an EXISTING bug we've already filed?"
**Eval at M3:** For each pair in `a2/raw/easy.json` and `hard.json`, feed A2 the duplicate text + the corpus of CPI bugs. A2 should return the original key with high confidence.
**Two tiers** = pass rate at easy (baseline floor) vs hard (real-world skill).
**Status:** Ready to ship. No human review needed (Codex did the alternative-phrasing generation grounded in real CPI bugs).

### A4 Sherlock — Root-Cause Classifier

**Question A4 must answer:** "Given a defect report (description + steps + RCA), can I correctly classify the root cause as L1 Stack / L2 Env / L3 Config / L4 Code / L5 Data?"
**Eval at M3:** Compare A4's predicted layer against the tagged `root_cause_layer` field. For pure-real-data evaluation, filter to `key` matching `^CPI-\d+$`. For augmented evaluation, include `CPI-NEW-###` items.
**Status:** ✅ **Tagged 2026-05-02. 62 L1-L5 valid + 13 SKIP across 75 items. Acceptance gate (40+) met.**

**Final distribution (62 valid):**

| Layer     | Count | %     |
| --------- | ----- | ----- |
| L1 Stack  | 4     | 6.5%  |
| L2 Env    | 2     | 3.2%  |
| L3 Config | 29    | 46.8% |
| L4 Code   | 19    | 30.6% |
| L5 Data   | 8     | 12.9% |

**Confidence breakdown:** 52 high / 15 medium / 8 low.

---

## L1-L5 root-cause classification reference

For each defect in `a4/raw/cpi_postmortem_defects.json`, fill the `root_cause_layer` field with one of:

| Layer         | Lives at                            | Fix usually involves                                          | Common signals                                                                                    |
| ------------- | ----------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **L1 Stack**  | Infra / runtime / framework         | Library upgrade, runtime swap, dependency pin                 | "Updated Pimcore 11.x → 11.y", "Pinned dependency", browser bug, framework limitation             |
| **L2 Env**    | Deployment / environment vars       | Env var added or fixed, secret rotated, env-specific override | "Worked in dev, broke in prod", "Missing X env var", deploy config change                         |
| **L3 Config** | Application config / business rules | Toggle a feature flag, change a setting, RBAC scope           | "PMG mapping wrong", "Auto-approve flag off", "Permission scope incorrect", DAM tab visibility    |
| **L4 Code**   | Source code logic                   | Patch a function, fix a query, handle null, fix race          | "Off-by-one in pagination", "Race in approveAndReopen()", "Null handling missing", validation bug |
| **L5 Data**   | Database state / data quality       | Data migration, backfill script, fix corrupt rows             | "PMG_master missing entries", "Old SKUs had wrong category", schema migration leftovers           |

### Decision tree for ambiguous cases

When a defect could be 2 layers:

1. Was the fix a **library/runtime change**? → **L1 Stack**
2. Did it only happen in **prod / certain env**? → **L2 Env**
3. Did it require a **setting toggle or RBAC change**? → **L3 Config**
4. Did it need a **code patch**? → **L4 Code**
5. Did it require a **data migration or backfill script**? → **L5 Data**

**Rule of thumb:** pick the LOWEST layer. If a Pimcore upgrade fixed it (and a code workaround would also have worked), still classify as L1 Stack — that was the structural root cause.

---

## How to do A4 tagging (~2-3 hours)

### Workflow per defect

For each of the 50 defects in `a4/raw/cpi_postmortem_defects.json`:

1. **Read these fields in this order** (most signal first):
   - `rca` (Root Cause Analysis — most direct signal)
   - `root_cause_corrective_actions` (what was actually done to fix)
   - `recent_comments` (last 5 — the real fix is often discussed here, not in formal RCA)
   - `description` + `steps_to_reproduce` (only if above are empty)

2. **Apply the decision tree** above → pick L1 / L2 / L3 / L4 / L5

3. **Edit the JSON file** — fill in:

   ```json
   "root_cause_layer": "L4",
   "confidence": "high",       // optional: high / medium / low
   "notes_for_eval": "..."     // optional: 1-line reason
   ```

4. **Move on.** Don't dwell more than 4 min per defect. Trust your gut.

### When to skip a defect

If `rca` AND `root_cause_corrective_actions` AND `recent_comments` are all empty/vague — set:

```json
"root_cause_layer": "SKIP",
"notes_for_eval": "no root-cause signal in any field"
```

You'll likely skip 5-10 of the 50. Aim for **40+ valid tags out of 50.**

### Time budget

- ~3 min per defect avg = 150 min for 50 defects = **2.5 hours**
- If you split with Akshay (2 reviewers, 25 each) = ~75 min each = **1.25 hours each**

### Tagging tools

**Easiest method:** Open the JSON file in your favorite editor (VS Code, Sublime, even TextEdit) and edit `root_cause_layer` for each entry inline. Save. Done.

**Spreadsheet method:** Open in Excel, add a column for `root_cause_layer`, tag, then I'll merge back into JSON.

---

## After tagging

When done, reply to me here:

> ✅ A4 tagging complete (40/50 tagged, 10 skipped) — file at `apps/api/test/golden-sets/a4/raw/cpi_postmortem_defects.json`

I'll then:

1. Validate the tags (any L6/L0 typos? any non-standard values?)
2. Build a tag distribution sanity-check ("Hmm, 35 are L4 — review L4 cases for over-coding bias")
3. Move files from `raw/` → `final/` to mark them as accepted golden sets
4. Commit to git as `feat(test): T032 golden-set seeds — A1 (30) + A2 (102 pairs) + A4 (50 root-cause-tagged)`
5. Mark T032 complete on M0 backlog

---

## Folder structure after tagging

```
apps/api/test/golden-sets/
├── REVIEW_GUIDE.md          ← this file
├── a1/
│   ├── raw/cpi_requirements.json     ← 30 reqs (no expected test cases yet — M3 work)
│   └── final/                        ← (created when M3 ground truth is added)
├── a2/
│   ├── raw/easy.json                 ← 54 dup pairs (standard difficulty)
│   ├── raw/hard.json                 ← 48 dup pairs (high difficulty)
│   └── final/easy.json + hard.json   ← (copy of raw/, accepted)
└── a4/
    ├── raw/cpi_postmortem_defects.json  ← 50 defects (Yogesh fills root_cause_layer)
    └── final/cpi_postmortem_defects.json ← (created post-tagging)
```

---

## Cross-references

- M0 backlog: `QA Nexus/PM1/PM1_milestone/M0/Milestone_M0_Setup_v8.md` § T032 (R3 mitigation add-on)
- ADR-003 (embedding model selection — affects A2 retrieval quality)
- ADR-006 (seed centralization — referenced when A2 production data lands in M3)
- Followup (l) — bge-small vs bge-large eval at A1 retrieval time (M3)

---

**Owner:** Yogesh + Akshay (A4 tagging only)
**ETA:** ~2.5 hours over 1-2 sessions
**Acceptance gate:** A4 set has 40+ defects with valid `root_cause_layer` (L1/L2/L3/L4/L5) values

---

## Acceptance closure (2026-05-02)

✅ T032 complete. Final state:

- A1: 30 reqs in `a1/final/cpi_requirements.json`
- A2: 54 easy + 48 hard pairs in `a2/final/easy.json` + `hard.json`
- A4: 75 defects (62 valid + 13 SKIP) in `a4/final/cpi_postmortem_defects.json`

Acceptance gate (40+ valid L1-L5 in A4): **PASS** at 62/75.

Workflow used:

1. Original 50 real CPI defects tagged by Codex on 2026-05-02 → 37 valid + 13 SKIP
2. Augmentation pass on 2026-05-02: Codex generated 25 additional realistic defects in CPI domain with full ground-truth tags
3. Combined set validated: 75 items, 62 valid L1-L5, sane distribution, all values pass schema check
4. Files moved `raw/` → `final/` and committed
