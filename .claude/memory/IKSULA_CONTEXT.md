# IKSULA_CONTEXT — pilot team, project context, business reasons

> Loaded by `inject-memory.sh` when Claude is about to write seed data, fixtures, demo content, or RBAC code. Keeps the 8-user roster and Iksula data canon close to the work — no placeholders ever ship.

## Pilot team (final, 8 named users — no placeholders allowed in seeds / fixtures)

| #   | Name           | Org role    | RBAC role   | Notes                                                |
| --- | -------------- | ----------- | ----------- | ---------------------------------------------------- |
| 1   | Akshay Panchal | QA Lead     | **Lead**    | Sprint owner; reviews defect triage + run plans.     |
| 2   | Yogesh Mohite  | Sr QA       | **Admin**   | Deployer-admin (Day-0 bootstrap); also acts as a QA. |
| 3   | Kishor Kadam   | QA Engineer | QA Engineer |                                                      |
| 4   | Nitin Gomle    | QA Engineer | QA Engineer |                                                      |
| 5   | Nadim Siddiqui | QA Engineer | QA Engineer |                                                      |
| 6   | Govind Daware  | QA Engineer | QA Engineer |                                                      |
| 7   | Mohanraj K.    | QA Engineer | QA Engineer |                                                      |
| 8   | Sagar Todankar | QA Engineer | QA Engineer |                                                      |

**Stakeholder role:** defined in PM1_ERD §3.4 but no Stakeholder users in the pilot — reserved for future PM2/PM3 expansion (e.g., dev managers, product owners).

## Pilot operating window

- **7 days/week, 10 AM – 10 PM IST.** UptimeRobot keep-alive must cover the FULL 12-hour daily window including weekends (NOT 9-5 weekdays only).
- 12 hr/day × 7 day/wk = 84 hr/wk operating envelope.
- Render free Hobby (apps/api) sleeps after 15 min idle — UptimeRobot pings every 5 min during operating window to prevent cold starts.

## Anchor project for seeds + fixtures

**Iksula Returns** (key: `RET`)

- Sprint 42, Day 9 of 14
- Release: `R-2026-04-PaymentV2`
- Used as the anchor in all F0x screens that need a "current project" context (e.g., F08b Home, F09 Projects List, F10 Sprint board)

## Other Iksula projects (background context, mostly used in F09 list views)

| Key    | Name                | State                     |
| ------ | ------------------- | ------------------------- |
| `CART` | Iksula Commerce     | main branch active        |
| `PAY`  | Iksula Payments     | staging amber             |
| `AUTH` | Iksula Mobile App   | main green                |
| `OPS`  | Iksula Internal Ops | available, lower priority |

## ID patterns (use verbatim in fixtures + UI demos)

- Jira-imported requirements: `RET-001`, `RET-002`, ... `RET-150` (3-digit zero-padded after `RET-`)
- Manually-uploaded requirements: `REQ-001`, `REQ-002`, ...
- Test cases: `TC-RET-001`, `TC-RET-002`, ... (always project-prefixed)
- Defects: `DEF-001`, `DEF-002`, ...
- Imports: `#242` (just the import batch number, hash-prefixed)

## Sample files for upload demos (use these exact filenames)

- `return_policy_v2.xlsx` — for F11 Requirements Upload demo
- `legacy_refund_test_cases.csv` — for F14 Test Case Import demo
- `customer_return_flow_recording.mp4` — for F19 Run Console attachment demo

## Jira instance

- `iksula.atlassian.net`
- 12 projects visible to the OAuth app; we filter to the 5 listed above for PM1 seeding

## Why this matters when writing seed / fixture / demo code

- **NEVER use** "John Doe", "user@example.com", "Test Project", "abc-123", "lorem ipsum". The pilot is 8 real people; seeing real names in dev makes UAT 10x faster and prevents "wait, who is this?" confusion.
- **NEVER invent** project keys outside the 5 listed above. RBAC + RLS policies are written assuming these specific projects.
- **For RBAC tests**, use the actual role assignments in the table above. Akshay = Lead in every test scenario. Yogesh = Admin in every test scenario. Don't randomize.
- **For sprint/release context**, default to Sprint 42 + R-2026-04-PaymentV2 unless the test specifically needs to cover a different sprint state.

## Cross-references

- `apps/api/prisma/seed.ts` — current canonical seed (8 users + 5 projects)
- `CLAUDE.md` § "Iksula data canon" — same data, copied for binding-context loading
- PM1_ERD §3.4 — RBAC role definitions
- PM1_PRD §3 — pilot scope and operating window
