# Mon Day-6 — Pilot Launch D-Day Checklist

> **Date:** Mon 2026-06-08 · **Mode:** Live pilot — 8 users on production · **Audience:** Yogesh (Admin) + agents on-call.

## Pre-launch gates (must all be GREEN by Mon 08:00 IST)

These gates were re-locked Sat 22:00 IST after the 28th reality-check identified PARTIAL audit coverage in Sat PRs #242 + #243. Mon Jun 8 unconditional GREEN launch requires all 4 PASS.

| Gate | Source                                                      | Required state                                |
| ---- | ----------------------------------------------------------- | --------------------------------------------- |
| 1    | BE+1 Sun AM fresh audit (4 buckets)                         | All 4 PASS in `2026-06-07-sun-am-be-audit.md` |
| 2    | MAIN Sun PM fresh audit (3 buckets + 4 runbooks)            | All 3 PASS + 4 runbooks landed                |
| 3    | Yogesh manual smoke testing (Sun 15:00-19:00 IST)           | 0 P0 bugs found (P1 with fix plan acceptable) |
| 4    | Sun EOD verdict (`docs/pilot/sun-blockers.md` ABSENT/empty) | Mon launch unconditional GREEN                |

If any gate FAILS Sun 19:00 IST → delay pilot 24h to Tue Jun 9.

## Pre-launch (08:00-09:00 IST)

### 08:00 IST — Apps Script bridge health check

```bash
curl -X GET https://script.google.com/macros/s/<APPS_SCRIPT_ID>/exec
```

Expected: 200 OK + healthy JSON or HTML response. If fails → recreate bridge via 30-min runbook (see ADR-025 §Fallback chain).

### 08:15 IST — Render API health check

```bash
curl https://qa-nexus-api.onrender.com/health
```

Expected: 200 + `{"status":"ok"}`. If 503 → Render scale-to-zero cold start; wait 30s + retry. If still failing → check Render dashboard for deploy status.

### 08:30 IST — Send 7 invite emails

Via F27m1 Invite User modal (Yogesh = Admin, can use the production UI):

1. Akshay Panchal — Lead
2. Kishor Kadam — QA Engineer
3. Nitin Gomle — QA Engineer
4. Nadim Siddiqui — QA Engineer
5. Govind Daware — QA Engineer
6. Mohanraj K. — QA Engineer
7. Sagar Todankar — QA Engineer

(Yogesh already has Admin account — no self-invite needed.)

**Verify Apps Script bridge sent each invite:** check Resend-equivalent delivery logs via Apps Script execution history.

### 08:45 IST — Spot-check inbox

Confirm at least 2-3 invite emails landed in iksula.com inboxes (ask Akshay + 1 QA Engineer to confirm by Slack DM).

## Launch (09:00-10:00 IST)

### 09:00 IST — First sign-ins expected

- Akshay + Kishor likely first (early-arrival pattern). Watch BetterAuth session table for new rows.
- Monitor F08 Home page load — verify project switcher renders Iksula Returns (RET) by default.

### 09:30 IST — Team standup (15 min)

Walk team through:

1. F08 Home → orient
2. F14 Requirements → see seeded RET-### data
3. F19 Run Console → walk through a happy-path run
4. F21 Defects Hub → walk through defect flow
5. **Feedback channel:** email `yogesh.mohite@iksula.com` for any bugs / questions / feature requests

### 10:00 IST — Open floor

Team explores freely. Yogesh circulates + answers questions.

## Day-1 check-ins

### 12:00 IST — First usage check-in

- How many sessions started?
- Any P0 bugs reported via email?
- Any confusion points (auth flow / nav / project switcher)?

### 15:00 IST — Afternoon check-in

- Usage patterns: which surfaces getting traffic?
- Any feature requests already?
- Any P1 bugs to file?

### 17:00 IST — End-of-Day-1 retrospective

- File `docs/pilot/2026-06-08-mon-day-1-retro.md`
- Aggregate: session count + bug count + feedback themes + Quota usage
- File P0/P1 bugs as PRs for Tue Day-2 cleanup

## P0 bug — emergency rollback path

If a critical bug blocks the team:

1. **Hotfix path:** branch from main → fix → flat-base PR → Yogesh visual gate → squash-merge → Cloudflare/Render auto-deploy (~2-5 min)
2. **If hotfix impossible <1 hr:** revert to last-known-good main commit via `git revert <bad-commit> && git push origin main`. Alert team: "We've rolled back; feature will return tomorrow."

## Quota watchpoints

- **Apps Script bridge:** 7 invites Mon AM = 7/1500 = 0.5% of daily quota. Comfortable headroom.
- **Neon CU-hr:** 8 users active during 10:00-22:00 window. Monitor Sun close + Mon EOD.
- **Groq RPD:** A1/A4 calls when team triggers Composer/Sherlock features. Spot-check at 17:00 EOD.

## Stand-down

Yogesh closes Day-1 at 22:00 IST with the retrospective filed. Tue Day-2 brief lands Tue AM.

---

_Authored Sat Day-3+4 2026-06-06 evening. Mon launch D-day playbook. Stand watch via Yogesh; agents reactive only._
