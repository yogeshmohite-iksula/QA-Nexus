# Sherlock RCA golden corpus

> **Binding:** M4 v2 plan §4.5 (AC042 measurement protocol) · ADR-019 (Sherlock prompt strategy)
> **AC042:** `(hits / 50) ≥ 0.40` top-2 hit rate on this corpus — at least **20 of 50** defects must be top-2 hits at M4 close.
> **Status (Day-25 Sun 2026-05-24):** 5 seed defects landed (`def-001` … `def-005`). 45 mechanical-ported cpi cases staged at `staged/def-006.json` … `staged/def-050.json` (synthesized non-scored fields + cleaned RCA evidence in `LABELING-WORKSHEET.md`). Pending Yogesh Day-26 AM: fill the 45 ground-truth YAML blocks in `LABELING-WORKSHEET.md` (~2-3 hr), then run `node scripts/apply-cpi-labels.mjs --promote` to validate + promote staged → live → corpus = 50 → run binding AC042 via `pnpm --filter @qa-nexus/api ac042:eval`.
>
> **Pipeline scripts (Day-25 Sun):**
>
> - `scripts/port-cpi-corpus.mjs` — one-shot mechanical port from `cpi_postmortem_defects.json` → 45 staged + worksheet. Already executed; re-run only if you want to regenerate staged files.
> - `scripts/apply-cpi-labels.mjs` — reads filled worksheet → validates each label → promotes staged → live. Dry-run by default; `--promote` flag required to actually write.
> - `apps/api/test/ac042-eval.ts` — the corpus-size-agnostic eval harness. Runs via `pnpm --filter @qa-nexus/api ac042:eval`. Outputs `results-YYYY-MM-DD.json` (gitignored except today's worked-example file).

---

## Folder structure

```
apps/api/test/golden-sets/sherlock-rca/
├── README.md              ← this file
├── schema.json            ← JSON Schema validating every def-XXX.json
├── def-001.json           ← seed: RET-0247 split-tender refund (real Iksula failure)
├── def-002.json           ← seed: RET-0342 refund.retry.exhausted webhook timeout
├── def-003.json           ← seed: RET-0345 multi-currency INR→USD conversion mismatch
├── def-004.json           ← seed: PAY-0211 UPI mandate refund-to-original-source
├── def-005.json           ← seed: PAY-0224 3DS challenge invocation on refund reversal
├── def-006.json … def-050.json  ← BE+1 expansion Day-19 (45 more)
└── results-{YYYY-MM-DD}.json     ← eval harness output (gitignored except latest)
```

## Defect file shape (§4.5 spec)

Every `def-NNN.json` MUST match `schema.json`. Required keys:

| Key                                  | Type     | Meaning                                                                          |
| ------------------------------------ | -------- | -------------------------------------------------------------------------------- |
| `id`                                 | string   | `def-001` … `def-050`. Must match the filename.                                  |
| `input`                              | object   | What gets fed into Sherlock's user-message template (see ADR-019 §3)             |
| `input.testCaseId`                   | string   | e.g. `TC-RET-0247`                                                               |
| `input.testCaseTitle`                | string   | The canonical title from the F20 Run Results frame or Jira issue                 |
| `input.runId`                        | string   | Synthetic UUID — eval harness fills real values at runtime                       |
| `input.stepNumber`                   | int      | The 1-indexed step that failed                                                   |
| `input.stepLabel`                    | string   | What the step was attempting                                                     |
| `input.durationMs`                   | int      | Duration of the failed step                                                      |
| `input.environment`                  | string   | `staging-iksula` / `prod-iksula` / `local-dev`                                   |
| `input.errorMessage`                 | string   | Raw error message as logged                                                      |
| `input.stackTrace`                   | string?  | Optional — null if no trace                                                      |
| `input.priorHistory`                 | object?  | Optional — `{ runs: [...], passRate, lastFailureAt }`                            |
| `input.kbContext`                    | string[] | Up to 3 KB chunk excerpts. Empty array OK.                                       |
| `groundTruth`                        | object   | What a senior Iksula QA engineer would say is the cause                          |
| `groundTruth.rootCauseCategory`      | string   | One of the 10 enums in ADR-019 §2 system prompt                                  |
| `groundTruth.rootCauseDetail`        | string   | 1-2 sentence human-written specific cause                                        |
| `groundTruth.acceptableAlternatives` | string[] | Other category enums a reviewer would accept as correct                          |
| `groundTruth.confidence`             | string   | `high` / `medium` / `low` — corpus author's confidence in the ground truth label |
| `groundTruth.notesForEval`           | string   | Comments to help the eval reviewer interpret ambiguous cases                     |

## 10 category enums (locked Day-18 PM)

Defined in ADR-019 §2 system-prompt rule 2:

1. `code-bug`
2. `data-bug`
3. `env-config`
4. `flaky-network`
5. `auth-permissions`
6. `dependency-version`
7. `ui-regression`
8. `race-condition`
9. `payment-gateway`
10. `other`

If a real Iksula defect doesn't fit any of these, default to `other` and document in `notesForEval`. If `other` count exceeds 5/50 at expansion, propose an 11th category in a followup.

## How seed defects were chosen

All 5 seed defects come from canonical Iksula Returns example data in `PM1_UI_v2/Redesign Frame by claude design/F20 Run Results v2.html`. They cover four of the 10 category enums (coverage tally matches `node` validator output below):

| Seed    | Test case   | Ground-truth category | Acceptable alternatives            | Why this seed?                                                                 |
| ------- | ----------- | --------------------- | ---------------------------------- | ------------------------------------------------------------------------------ |
| def-001 | TC-RET-0247 | `code-bug`            | `data-bug`                         | Split-tender refund — floating-point precision loss at `refund.service.ts:142` |
| def-002 | TC-RET-0342 | `env-config`          | `flaky-network`, `payment-gateway` | `refund.retry.exhausted` — Render cold-start exhausts gateway retry budget     |
| def-003 | TC-RET-0345 | `code-bug`            | `data-bug`                         | Multi-currency refund using live FX instead of locked-at-purchase FX           |
| def-004 | TC-PAY-0211 | `payment-gateway`     | `code-bug`                         | UPI mandate refund — missing pre-check before refundToMandate() call           |
| def-005 | TC-PAY-0224 | `race-condition`      | `code-bug`, `payment-gateway`      | 3DS auth-complete event awaited before gateway debit dispatch                  |

**Coverage tally (validated via `node` validator script):**

| Category             | Seeds |
| -------------------- | ----- |
| `code-bug`           | 2     |
| `env-config`         | 1     |
| `payment-gateway`    | 1     |
| `race-condition`     | 1     |
| `data-bug`           | 0     |
| `flaky-network`      | 0     |
| `auth-permissions`   | 0     |
| `dependency-version` | 0     |
| `ui-regression`      | 0     |
| `other`              | 0     |

**Coverage gap to fill Day-19 (BE+1):** `data-bug`, `flaky-network`, `auth-permissions`, `dependency-version`, `ui-regression`, `other` — at least 4 seeds per remaining category to hit 50. The existing `apps/api/test/golden-sets/a4/raw/cpi_postmortem_defects.json` is a strong mining source — 62 real defects with `root_cause_layer` already tagged. Mapping `root_cause_layer` (L1-L5) to the 10-category enum is a Day-19 task; ADR-019 §2 follow-up table to document the mapping once BE+1 starts.

## Eval harness usage (M4 close-gate)

```bash
# Run the full 50-defect eval against the deployed Sherlock service
pnpm tsx scripts/eval-sherlock.ts \
  --corpus apps/api/test/golden-sets/sherlock-rca/ \
  --api https://qa-nexus-api.onrender.com \
  --out apps/api/test/golden-sets/sherlock-rca/results-$(date +%Y-%m-%d).json

# Output summary
# {
#   "totalDefects": 50,
#   "top2Hits": 23,
#   "top2HitRate": 0.46,        ← AC042 PASS (≥0.40)
#   "calibrationTop1AtHighConfidence": { "highConfidenceCases": 12, "top1HitRate": 0.83 },
#   "perCategoryAccuracy": { "code-bug": 0.50, "data-bug": 0.60, ... }
# }
```

Nightly CI cron (added Day-19) runs the harness and posts results to Slack via the OTel exporter.

## Cross-references

- ADR-019 — Sherlock prompt strategy (this corpus is what the prompts are scored against)
- M4 v2 plan §4.5 — AC042 measurement protocol
- M4 v2 plan §4.6 — `confidence < 0.5` triggers the F22 needs-review affordance; corpus also measures calibration sub-gate
- `apps/api/test/golden-sets/a4/raw/cpi_postmortem_defects.json` — mining source for Day-19 expansion (62 cases with `root_cause_layer` tags)
- `PM1_UI_v2/Redesign Frame by claude design/F20 Run Results v2.html` — canonical Iksula example failures (5 seed defects sourced from here)
