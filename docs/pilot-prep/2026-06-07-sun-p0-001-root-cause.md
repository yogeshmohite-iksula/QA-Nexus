# P0-001 Identity Bug — Root Cause (Sun 2026-06-07, 34th RC)

**Symptom:** fresh incognito sign-in on `main` HEAD 963fc08 → `/home/` shows
"Kishor K. · QA ENGINEER" in topbar + rail-foot. Cookies empty on `pages.dev`,
zero `/api/auth/get-session` calls from `/home/`.

**Correction:** my 32nd-RC "stale deploy" diagnosis was WRONG. This is real,
reproducible code + infra. (32nd grep was file-scoped to shell/components and
missed the route-wrapper override.)

---

## Three layers (proximate → structural → REAL blocker)

### Layer 1 — proximate (FE, cosmetic)

`apps/web/app/home/page.tsx:42`:

```tsx
<CurrentUserProvider initialUserId={SEED_IDS.users.kishor}>
```

The file's own comment (L36–40) documents it: `/home/` is the **QA-Engineer
preview** wired to Kishor, "Once T030.5+ session cookies + role-aware routing
land, this override gets replaced by a server-side role check." On the deployed
pilot, `/home/` is the post-sign-in landing → every user sees Kishor.

### Layer 2 — structural (FE, Pattern A)

No authed page reads the real session. `CurrentUserProvider` uses per-route
hardcoded seed personas (`/home`→kishor, `/home/lead-admin`→akshay, everything
else→yogesh). `apps/web/lib/auth/use-auth.tsx` is a localStorage stub — the
comments say "Pattern B replaces this with `authClient.useSession()`" (never
done). `authClient.useSession()` exists but is unused on authed surfaces.

### Layer 3 — THE REAL BLOCKER (infra/BE, cross-site cookies)

`apps/api/src/auth/auth.config.ts`: the session cookie uses
`crossSubDomainCookies` for a **shared-parent zone** `.qanexus.iksula.com`
(so `app.` + `api.qanexus.iksula.com` share it — sibling subdomains).

**But the actual pilot deploy is cross-SITE, not sub-domain:**

- FE: `qa-nexus-web.pages.dev`
- API: `qa-nexus-api.onrender.com`

`pages.dev` and `onrender.com` are different registrable domains with no shared
parent. The cookie-domain config (`.qanexus.iksula.com`) doesn't apply, so the
onrender-set session cookie is a third-party cookie that (a) never appears on
`pages.dev` (✅ explains empty cookies) and (b) isn't reliably sent on cross-site
fetch (Chrome third-party-cookie restrictions). **So even a perfect FE
`useSession()` wire would get `null` → no identity → falls back to the hardcoded
persona.**

---

## Why this is NOT safely FE-fixable tonight

A FE Pattern-A→B flip can't work until cross-site auth works. That requires one of:

- **(a) Shared parent domain** — deploy FE+API under `app.` / `api.qanexus.iksula.com`
  (DNS/infra change — the cookie config already targets this). Not a tonight change.
- **(b) True cross-site cookies** — `SameSite=None; Secure; Partitioned` for the
  actual `pages.dev`↔`onrender.com` hosts + verify the browser accepts the
  third-party/CHIPS cookie. Fragile under Chrome's 3p-cookie deprecation; needs
  live cross-origin testing.

Both are infra/BE changes that must be tested cross-origin — not "ship blind"
the night before pilot (Hard Rule 11).

---

## Options (Yogesh's call)

1. **Push pilot → Tue Jun 9** — proper fix: shared-parent-domain deploy (option a)
   - FE Pattern-B session wire + cross-origin test. ~½ day cross-team. Cleanest.
2. **Ship Mon + 1-line stopgap** — change `/home/page.tsx` `kishor`→`yogesh` so the
   **demo driver (Yogesh, Admin)** sees a correct identity on the primary walk-through
   path. Invited users still see "Yogesh M." (wrong but consistent, workspace-owner,
   not a random QA engineer). Document as known-issue; real cross-site auth = Day-29.
3. **Ship Mon as-is** — not recommended (every user sees "Kishor K.").

**Recommendation:** (1) if a Tue slip is acceptable; else (2) as the documented
stopgap for the Mon demo. The 1-line stopgap is reversible + touches only the
landing persona; it does NOT pretend auth works.

---

## For BE+1

- Confirm the intended pilot domain model: cross-site (`pages.dev`/`onrender.com`)
  vs shared-parent (`*.qanexus.iksula.com`). The cookie config assumes the latter;
  the deploy uses the former.
- If staying cross-site for pilot: cookie attrs + a live `get-session` cross-origin
  test from a signed-in `pages.dev` tab is the gating verification before any FE wire.
