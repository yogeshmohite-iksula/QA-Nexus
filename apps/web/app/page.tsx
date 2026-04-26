// Root /page.tsx -- redirects unauthenticated visitors to /sign-in.
// Authenticated routing (F08a/F08b/F08c per role) lands in M1 with RBAC guards.

import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/sign-in');
}
