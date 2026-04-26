# Cloudflare Pages — apps/web deploy runbook

**Task:** MS0-T010 (initial wire-up landed 2026-04-26).
**Project:** `qa-nexus-web`
**Account:** `yogesh.mohite@iksula.com` (Iksula corporate, account ID `1ec3036cd3c742f44d00f013b344d221`)
**Production URL:** https://qa-nexus-web.pages.dev/
**Cost:** $0/month (free tier; unlimited requests, 500 builds/month, well above 8-user pilot scale)

---

## Prerequisites (one-time setup)

1. **Cloudflare account.** Free tier, no credit card. Email above.
2. **API token.** Created via [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens) using the **Edit Cloudflare Workers** template (auto-includes Pages: Edit + Workers Scripts: Edit + R2 Storage: Edit + supporting reads). Token name: `QA_Nexus`.
3. **Local env.** Token exported in `~/.zprofile`:
   ```
   export CLOUDFLARE_API_TOKEN='<token>'
   ```
   Bash sub-shells need `source ~/.zprofile` because zsh-only profile files aren't inherited.

---

## Project bootstrap (already done, here for reference)

```bash
source ~/.zprofile
export PATH="$HOME/homebrew/bin:$PATH"
pnpm dlx wrangler@latest pages project create qa-nexus-web --production-branch=main
```

Output: `Successfully created the 'qa-nexus-web' project`.

---

## Routine deploy (every release)

From repo root:

```bash
pnpm deploy:web
```

That script does:

1. `pnpm --filter web build` — produces `apps/web/out/` via `output: 'export'` (Next.js static export).
2. `pnpm dlx wrangler@latest pages deploy apps/web/out --project-name=qa-nexus-web --branch=main` — uploads ~52 files (~2.1 sec) to CF edge.

You'll get back two URLs:

- **This deployment** (immutable hash): `https://<hash>.qa-nexus-web.pages.dev`
- **Production alias**: `https://qa-nexus-web.pages.dev` (always points to the latest `main` deploy)

---

## Verification after every deploy

```bash
for path in "/sign-in/" "/set-password/" "/" ; do
  curl -sS -o /dev/null -w "%{http_code}  %{url_effective}\n" "https://qa-nexus-web.pages.dev$path"
done
```

Expected: all `200`. (`/sign-in` without trailing slash returns `308` then `/sign-in/` returns `200` — that's the `trailingSlash: true` setting in `next.config.ts`.)

Then visual confirmation per CLAUDE.md Rule 13:

- Open `https://qa-nexus-web.pages.dev/sign-in/` and `/set-password/` in Chrome at 1440×900 (your MacBook) and at 320×568 (DevTools mobile sim).
- Cross-check against the dev-server screenshots in `docs/screenshots/rwd-*.png`.

---

## Rollback

CF Pages keeps every deployment forever. To roll back:

1. Open https://dash.cloudflare.com → Workers & Pages → `qa-nexus-web` → Deployments.
2. Find the last-known-good deployment.
3. Click "..." → "Rollback to this deployment".

Production alias `qa-nexus-web.pages.dev` switches within seconds globally.

CLI alternative:

```bash
pnpm dlx wrangler@latest pages deployment tail --project-name=qa-nexus-web
# (then redeploy from a known-good local out/ via `pnpm deploy:web`)
```

---

## Constraints (binding)

- **Static export only.** No server `redirect()`, no API routes, no middleware in `apps/web`. The `/` redirect to `/sign-in` is implemented client-side in `app/page.tsx` (useEffect + router.replace). All API surface lives in `apps/api` (NestJS on Render — see MS0-T011).
- **No images via `next/image` optimization** without `images.unoptimized: true` in `next.config.ts`.
- **No Edge runtime features** in pages. If we need them, switch to `@cloudflare/next-on-pages` adapter (different output dir).

---

## Future: GitHub auto-deploy (deferred)

The current setup is **Direct Upload**. To enable auto-deploy on push to `main`:

1. CF Dashboard → `qa-nexus-web` project → Settings → Builds & deployments → "Connect to Git".
2. Authorize the Cloudflare Pages GitHub App on `yogeshmohite-iksula/QA-Nexus`.
3. Configure:
   - Production branch: `main`
   - Build command: `pnpm --filter web build`
   - Build output: `apps/web/out`
   - Root directory: `/`
   - Environment variables: `NODE_VERSION=20`, `PNPM_VERSION=10.33.2`
4. Trigger a re-deploy via empty commit to `main`.

Open task: filed as a follow-up; not blocking the M0 acceptance gate (MS0-AC001 only requires "Frontend live at Cloudflare Pages URL with HTTPS; F06 Sign In renders" — already met via Direct Upload).
