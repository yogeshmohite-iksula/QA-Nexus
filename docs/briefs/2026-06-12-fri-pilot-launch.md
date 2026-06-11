# Fri Day-launch — Pilot Launch D-Day Checklist

> **Date:** Fri 2026-06-12 · **Mode:** Live pilot — 8 users on production · **Audience:** Yogesh (Admin) + agents on-call.
>
> _(Originally scheduled Mon Jun 8; slipped to Fri Jun 12 because P0-001 user-identity remained open across Yogesh's Jun 8-10 pause. P0-001 CLOSED + verified live Thu Jun 11 4:16 PM IST — see `docs/eod-reports/2026-06-11-thu-p0-001-closure-eod.md`.)_

## Pre-launch gates (all GREEN as of Thu Jun 11)

| Gate | Source                                                             | State                                                          |
| ---- | ------------------------------------------------------------------ | -------------------------------------------------------------- |
| 1    | BE+1 Sun fresh audit (5 buckets — immutability + endpoint catalog) | ✅ PASS (PR #248 merged)                                       |
| 2    | MAIN Sun PM audit (3 buckets + 4 runbooks + user-testing protocol) | ✅ PASS (PR #249 merged)                                       |
| 3    | **P0-001 (user identity) — the sole carry-over Mon-blocker**       | ✅ **CLOSED + verified live Thu 4:16 PM IST** (#256+#258+#259) |
| 4    | Yogesh manual smoke (Sun + Thu re-verify)                          | ✅ 0 open P0                                                   |

All three fix layers (#256 cross-site cookie/CORS · #258 FE Pattern-B session wire · #259 customSession app fields) are LIVE on `qa-nexus-web.pages.dev` + `qa-nexus-api.onrender.com`. Fri Jun 12 = unconditional GREEN GO.

## Pre-launch (08:00-09:00 IST)

### 08:00 IST — Identity regression re-check (P0-001 guard)

Before any invites: fresh incognito → sign in as `yogesh.mohite@iksula.com` → confirm user pill = **"Yogesh M. · ADMIN"** (not "Kishor K."). This is the 30-second regression guard on the Thu closure. If it shows wrong identity → STOP, do not send invites, escalate.

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

- **Apps Script bridge:** 7 invites Fri AM = 7/1500 = 0.5% of daily quota. Comfortable headroom.
- **Neon CU-hr:** 8 users active during 10:00-22:00 window. Carry the Wed-87/100 watch into Fri; monitor at Fri EOD.
- **Groq RPD:** A1/A4 calls when team triggers Composer/Sherlock features. Spot-check at 17:00 EOD.

## Stand-down

Yogesh closes Day-1 at 22:00 IST with the retrospective filed. Tue Day-2 brief lands Tue AM.

---

_Authored Sat Day-3+4 2026-06-06 evening; renamed + updated Thu Jun 11 for the Fri Jun 12 launch after P0-001 closure. Stand watch via Yogesh; agents reactive only. #256+#258+#259 all LIVE; P0-001 verified Thu Jun 11 4:16 PM IST._
