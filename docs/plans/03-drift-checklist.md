# Drift checklist — generic Mn-close template

> **Last updated:** 2026-05-02 (Day 6 — initial scaffold)
> **Used by:** Yogesh + MAIN at every milestone close. Run BEFORE the milestone is
> declared closed in `04-plan-vs-actual.md`.

---

## How to use

Copy the table below into a new section of the relevant `02-milestones/Mn-*.md`
under "Drift items" at close time. Walk every row. For each "Yes" answer, file a
followup or open a binding-spec amendment PR. **Don't silently fix.**

The 3-line summary at the bottom (`Drift count`, `Followups filed`, `Spec amendments
recommended`) goes into the corresponding row of `04-plan-vs-actual.md`.

---

## Checklist

| #   | Question                                                                                                                                      | Yes/No | Evidence / link |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------ | --------------- |
| C1  | Did every planned task ship as planned?                                                                                                       |        |                 |
| C2  | Was anything **cut** mid-milestone? (out of scope)                                                                                            |        |                 |
| C3  | Was anything **deferred** to the next Mn?                                                                                                     |        |                 |
| C4  | Was scope **expanded** mid-milestone? (extra tasks added)                                                                                     |        |                 |
| C5  | If C4 is yes, why? (urgent gap / opportunity / drift / fire)                                                                                  |        |                 |
| C6  | Did any binding spec disagree with what shipped?                                                                                              |        |                 |
| C7  | If C6 is yes, is the recommended path "amend spec" or "amend code"?                                                                           |        |                 |
| C8  | Did tech-stack drift since the last Mn close? (new dep, version bump, swap)                                                                   |        |                 |
| C9  | Did any free-tier quota burn-rate change materially? (Render / Neon / R2 / Groq / Gemini)                                                     |        |                 |
| C10 | Were any new architectural patterns shipped that aren't in `../architecture/patterns.md`?                                                     |        |                 |
| C11 | Did any followup get closed?                                                                                                                  |        |                 |
| C12 | Did any new followup get filed?                                                                                                               |        |                 |
| C13 | Were any retroactive ADRs needed for decisions made without one?                                                                              |        |                 |
| C14 | Did the `enforce-design-tokens.sh` / `enforce-pm1-stack.sh` / `enforce-rwd.sh` hooks fire any blocks during the Mn? Were any false-positives? |        |                 |
| C15 | Did any pre-push gate (typecheck / frozen-lockfile / CHANGELOG) block a push? Was the block legitimate?                                       |        |                 |
| C16 | Was there any Mn-close audit-log integrity issue? (HMAC chain breaks)                                                                         |        |                 |
| C17 | Did the visual-confirmation gate (Rule 13) catch anything that automation missed?                                                             |        |                 |
| C18 | Was there any RWD regression on a previously-RWD-clean frame?                                                                                 |        |                 |
| C19 | Did monthly cost stay at $0?                                                                                                                  |        |                 |
| C20 | Are there any pilot-user findings (M5+) that merit a backport to a previous Mn's scope?                                                       |        |                 |

---

## Summary (paste into `04-plan-vs-actual.md`)

```
- Drift items surfaced: <count>
- Followups filed: <list>
- Spec amendments recommended: <list with PRD/ERD section number>
- New ADRs: <list>
```

---

## Cross-references

- `01-pm1-execution-plan.md` — D1-D6 (Day 6 baseline drift items)
- `04-plan-vs-actual.md` — append-only delivery log (one row per Mn close)
- `../followups.md` — open + closed followups
- `../audits/skill-alignment-audit.md` — applies the same drift discipline at session level
- `../architecture/` — ADRs (where retroactive ones go)
