// Root /page.tsx -- redirects unauthenticated visitors to /sign-in.
// Authenticated routing (F08a/F08b/F08c per role) lands in M1 with RBAC guards.
//
// Client-side redirect (NOT server `redirect()` from next/navigation) so this
// page works under `output: 'export'` on Cloudflare Pages where there's no
// Node runtime. See next.config.ts MS0-T010 comment for context.

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/sign-in');
  }, [router]);

  // Renders briefly (single frame) before the JS redirect fires. Kept minimal
  // to avoid a flash of unstyled content. Real users land here for <50ms.
  return null;
}
