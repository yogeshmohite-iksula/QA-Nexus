# Sherlock RCA Golden-Set Labeling Report

Date: 2026-05-26

Scope: 45 CPI expansion cases in `LABELING-WORKSHEET.md` (`def-006` through `def-050`). No case fell below 0.50 confidence, so `_UNCERTAIN_CASES.md` was not created.

Note: `scripts/apply-cpi-labels.mjs` in this checkout validates `confidence` as `high | medium | low`, not a numeric float. I preserved numeric confidence in each case's `notesForEval` and used those numeric values for the distributions below.

## Category Distribution

| ADR-019 category     | Count | Coverage note                                                                  |
| -------------------- | ----: | ------------------------------------------------------------------------------ |
| `code-bug`           |    13 | Covered                                                                        |
| `data-bug`           |     7 | Covered                                                                        |
| `env-config`         |     2 | Covered                                                                        |
| `flaky-network`      |     0 | Gap in this 45-case expansion and still a primary-label gap in the full corpus |
| `auth-permissions`   |    11 | Covered                                                                        |
| `dependency-version` |     0 | Gap in this 45-case expansion and still a primary-label gap in the full corpus |
| `ui-regression`      |     8 | Covered                                                                        |
| `race-condition`     |     0 | Gap in this expansion; seed `def-005` covers it in the full corpus             |
| `payment-gateway`    |     0 | Gap in this expansion; seed `def-004` covers it in the full corpus             |
| `other`              |     4 | Covered                                                                        |

## Confidence Distribution

| Numeric bucket | Count |
| -------------- | ----: |
| 0.90+          |     6 |
| 0.75-0.89      |    29 |
| 0.60-0.74      |     7 |
| 0.50-0.59      |     3 |

## Cases Flagged for Yogesh Review

These are the cases with numeric confidence below 0.70.

| Case    | Category     | Why it was hard                                                                                      |
| ------- | ------------ | ---------------------------------------------------------------------------------------------------- |
| def-017 | `env-config` | Bulk import evidence mixes UAT memory/resource limits, process updates, and missing client PMG data. |
| def-022 | `code-bug`   | Screenshot-only folder-popup ticket; no preserved exception text.                                    |
| def-028 | `code-bug`   | Invitation-link exception has no stack trace, SMTP/config detail, or auth detail.                    |
| def-036 | `code-bug`   | Marketing Head save exception is role-specific but has no preserved technical error.                 |
| def-038 | `code-bug`   | ERP upload exception references a detail link that is not preserved in the worksheet.                |
| def-040 | `code-bug`   | ERP form "not working correctly" is only supported by a screenshot and generic code-update note.     |

## Patterns Noticed

- Role/state action visibility dominates the CPI set. I consistently labeled role-gated buttons, tabs, folder actions, and role-specific image visibility as `auth-permissions`.
- Master-data and option-list mismatches cluster around PMG/SAG/SAGDescription and ERP attribute mapping; these are labeled `data-bug`.
- Email/PDF/action-label copy and visible template content are labeled `ui-regression` unless the comments pointed to explicit workflow-recipient logic.
- Several older CPI tickets preserve only screenshots plus "code updated" comments. I kept those labelable but low-confidence instead of inventing stack-level causes.
- `flaky-network` and `dependency-version` have no primary-label coverage after the 45-case expansion. `payment-gateway` and `race-condition` are absent from the CPI expansion but are covered by the existing seed cases.

## Sanity-Check Questions for Yogesh

1. Should screenshot-only CPI tickets such as def-022 and def-040 remain in AC042, or should they be replaced with cases that preserve stack traces or comments with sharper RCA evidence?
2. For Pimcore/default-platform behavior cases like def-030, do you prefer the current `other` label, or should those be forced into `dependency-version` for coverage despite no version-mismatch evidence?
3. Please review def-017 specifically: I labeled it `env-config` because the clearest comment says larger imports hit UAT memory limits, but `code-bug` is plausible if the intended RCA is inefficient import processing.

## Validation

Dry-run validator result:

```text
Parsed 45 case sections from worksheet.
Ready: 45 / 45
Blocked: 0 (0 total errors)
```
