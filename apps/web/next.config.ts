import type { NextConfig } from 'next';

// Cloudflare Pages target (MS0-T010, 2026-04-26):
//   output: 'export'      -> emits a fully-static `apps/web/out/` directory
//                            CF Pages serves directly from object storage at
//                            *.pages.dev. No Node runtime required.
//   trailingSlash: true   -> writes `out/<route>/index.html` instead of
//                            `out/<route>.html`. More portable across hosts;
//                            CF Pages serves `/sign-in/` and `/sign-in`
//                            interchangeably with this setting.
//   images.unoptimized    -> next/image needs a server for optimization;
//                            disable it for static export. We don't use
//                            <Image> yet on the auth surface but this is
//                            a safety net for future ports.
//
// Trade-off accepted: no API routes / no middleware / no server `redirect()`
// inside the static FE. The single `/` -> `/sign-in` redirect is implemented
// client-side in `app/page.tsx`. The NestJS API (apps/api) handles all
// server-side concerns at a separate origin (Render free dyno per MS0-T011).
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
