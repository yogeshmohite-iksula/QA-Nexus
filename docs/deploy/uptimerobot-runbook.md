# UptimeRobot keep-alive runbook (T015)

**Owner:** Yogesh (dashboard work).
**Target:** 5-min HTTP check on `https://qa-nexus-api.onrender.com/health` keeps the Render free dyno warm during operating window (10 AM – 10 PM IST, 7 days/week).
**Cost:** $0/month (UptimeRobot Free — 50 monitors, 5-min minimum interval).
**Closes:** MS0-T015.

---

## Why this exists (the problem)

Render's free Hobby dyno **sleeps after 15 min of no incoming requests**. First request after sleep = ~10-15s cold-start (NestJS boot + Prisma client init + embedding model warm if cache survives).

For PM1 pilot:

- 8 users using the app intermittently → frequent 15-min idle gaps → frequent cold starts.
- "First click takes 15s" is unacceptable UX.
- Fix: ping `/health` every 5 min during operating window → dyno never sleeps.

UptimeRobot's free plan does this for free.

---

## Step 1 — Account setup

1. Sign up at https://uptimerobot.com (free, no credit card).
2. Email = `<your Iksula corporate email>` (NOT a personal account; team needs ability to manage if Yogesh is unavailable).
3. Confirm: **Plan = Free** (50 monitors, 5-min interval minimum).

---

## Step 2 — Create the monitor

1. Dashboard → **Add New Monitor**.
2. Settings:

| Field               | Value                                                                      |
| ------------------- | -------------------------------------------------------------------------- |
| Monitor Type        | **HTTP(s)**                                                                |
| Friendly Name       | `qa-nexus-api /health`                                                     |
| URL                 | `https://qa-nexus-api.onrender.com/health` (paste the actual Render URL)   |
| Monitoring Interval | **5 minutes** (free-tier minimum; cannot go lower)                         |
| Monitor Timeout     | **30 seconds** (allow for cold-start if monitor catches a sleep edge case) |
| HTTP Method         | **GET**                                                                    |
| Response should     | (leave default — any HTTP 2xx counts as up)                                |

3. Click **Save Changes**.

---

## Step 3 — Configure alert contacts

1. Dashboard → **My Settings → Alert Contacts → Add Alert Contact**.
2. Add Yogesh's email:
   - Type: Email
   - Friendly Name: `Yogesh — primary`
   - Email: `<your Iksula email>`
   - Verify via the confirmation email.
3. (Optional, deferred to T019) Add Slack webhook:
   - Type: Slack
   - Webhook URL: from Slack admin → Incoming Webhooks
   - Channel: `#qa-nexus-alerts`
4. Back to monitor config → **Edit → Alert Contacts** → check both contacts → Save.

---

## Step 4 — Test the alert flow

**Verify alerts work BEFORE relying on them:**

1. Render dashboard → **qa-nexus-api → Settings → Suspend Web Service**.
2. Wait 6 minutes.
3. Within ~6-10 min, expect an email from UptimeRobot: **"Monitor is DOWN"**.
4. Resume Render service → wait 5 min → expect **"Monitor is UP"** email.
5. **Both should arrive.** If either doesn't, check spam folder + alert-contact verification status.

This test consumes ~10 min of monitoring time but proves the pipeline works.

---

## Step 5 — Operating-window optimization (optional, post-pilot)

UptimeRobot pings 24/7 by default. Pilot operates only 10 AM – 10 PM IST. Pinging during 10 PM – 10 AM IST is wasted effort (the dyno can sleep — no users are around).

To reduce ping count (saves nothing $-wise on free tier, but cleaner logs):

1. Monitor → Edit → **Maintenance Windows**.
2. Add window: 10 PM – 10 AM IST daily.
3. UptimeRobot pauses the monitor during that window.
4. Render dyno sleeps overnight. First click at 10 AM the next day = ~15s cold-start (acceptable; users expect a slow first morning click).

**Defer this until pilot is live.** During Day 3-9 setup, 24/7 pinging is fine.

---

## Step 6 — Public status page (optional, free)

UptimeRobot offers a public-facing status page like `https://stats.uptimerobot.com/<random>`. Free tier supports this.

1. Dashboard → **Status Pages → Add Status Page**.
2. Settings:
   - Page name: `QA Nexus`
   - Custom domain: (optional; defer)
   - Monitors to display: select `qa-nexus-api /health`
3. Save → grab the public URL.
4. Add to `docs/STATUS.md` Health Checks table.

Useful when sharing pilot status with Iksula leadership: one URL, one green dot.

---

## Step 7 — Free-tier limits

| Resource          | Free limit | PM1 expected usage           | Headroom |
| ----------------- | ---------- | ---------------------------- | -------- |
| Monitors          | 50         | 1 (just /health for now)     | 49       |
| Monitor interval  | 5 min min  | 5 min                        | —        |
| Status pages      | 1          | 0 (or 1 if optional Step 6)  | —        |
| Alert contacts    | unlimited  | 1-2                          | —        |
| Log retention     | 60 days    | (alerts go to email + Slack) | —        |
| Public API access | 10 req/min | 0 (no programmatic use)      | —        |

For PM1 we use ~2% of free-tier capacity. No upgrade needed for the foreseeable future.

---

## Step 8 — Common issues + fixes

| Symptom                                                 | Likely cause                             | Fix                                                                                                                                                               |
| ------------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Monitor reports "Down" but `/health` works in browser   | UptimeRobot's check-from-IP got blocked  | Render doesn't IP-block by default. If using Cloudflare in front, allowlist UptimeRobot's IPs.                                                                    |
| Alerts arrive 5-10 min late                             | Free-tier email queue                    | Acceptable for PM1. Upgrade to Pro ($7/mo) for instant alerts only if SLA tightens at PM2.                                                                        |
| Render dyno still cold-starts despite UptimeRobot pings | Ping landed during a brief deploy window | Normal — Render's deploy briefly takes the dyno offline. UptimeRobot pings resume after deploy.                                                                   |
| `/health` returns 200 but reports r2.up=false           | R2 not yet provisioned (T013 deferred)   | Acceptable — `/health` returns 200 if `db.up=true` (the only "required" subsystem). r2/llm/resend are "deferred" until provisioned. UptimeRobot still sees green. |

---

## Step 9 — When to revisit

- **End of M0** (Day 10): confirm 7-day uptime > 99% (free-tier dyno + UptimeRobot ping should achieve this).
- **End of M1**: if pilot scales to >8 users, reassess whether free dyno + 5-min ping is enough OR upgrade to Render Starter ($7/mo, no sleep).
- **Pre-GA** (M6, target 2026-09-21): hard SLA target = 99.5% during 10AM-10PM IST. If this monitor + Render free can't deliver, paid upgrade is justified per kickoff §6 cost-gate exception process.

---

## Cross-references

- `docs/deploy/render-runbook.md` — the upstream Render service this monitors
- `apps/api/src/health/health.controller.ts` — the `/health` endpoint
- `IKSULA_CONTEXT.md` § "Pilot operating window" — the 10 AM – 10 PM IST window
- `CLAUDE.md` § "Locked tech stack" — UptimeRobot listed as part of the free stack
- `PM1_ERD §M0_v8` — task T015 spec
