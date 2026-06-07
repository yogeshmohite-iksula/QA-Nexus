// QA Nexus PM1 — root layout
// Loads PM1's locked typography stack (Inter / DM Sans / JetBrains Mono)
// per PM1_UI_v2/UI Files/01_SYSTEM.md §3.3.

import type { Metadata } from 'next';
import { Inter, DM_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
// Seed-centralization providers (followup i Phase 3f).
// Wire order: CurrentUser → Project → TeamRoster (TeamRoster depends on
// CurrentUser to compute "teammates excluding self"). All three are
// 'use client' islands; they don't break SSR for static-export Cloudflare
// Pages because they hold pure local state (no fetch, Pattern A compatible).
import { AuthProvider } from '@/lib/auth/use-auth';
import { CurrentUserProvider } from '@/lib/contexts/CurrentUserContext';
import { ProjectProvider } from '@/lib/contexts/ProjectContext';
import { QueryProvider } from '@/lib/contexts/QueryProvider';
import { TeamRosterProvider } from '@/lib/contexts/TeamRosterContext';
import { Toaster } from 'sonner';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
  weight: ['500', '600', '700'],
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'QA Nexus',
  description: 'AI-native QA management platform for Iksula Services.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning on <html> AND <body> -- silences well-known
    // false-positive React hydration mismatches caused by browser extensions
    // that inject attributes between SSR and client hydration:
    //   - <html>: Scribe ('data-scribe-recorder-ready'), some screen-reader
    //     overlays, dark-reader root-level theme markers
    //   - <body>: Grammarly, ColorZilla, dark-reader body-level
    // Day-17 (2026-05-13): added <html> after Scribe hydration warning hit
    // Yogesh during F19 visual gate. Per Next.js canonical pattern — does
    // NOT suppress real hydration errors in our own component subtree.
    // Ref: https://nextjs.org/docs/messages/react-hydration-error
    <html
      lang="en"
      className={`${inter.variable} ${dmSans.variable} ${jetBrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/*
          Sun 2026-06-07 Lesson 10 fix: load Google Fonts via <link> in <head>
          per _SHELL Developer Handoff.md §1. The next/font/google setup above
          declares CSS variables (--font-inter, --font-dm-sans, --font-jetbrains-mono)
          but in Next.js 15.5 + Tailwind 4 @theme inline those variables don't
          cascade to plain CSS rules outside Tailwind utility classes (verified
          via getComputedStyle returning empty for --font-inter). The registered
          FontFaces also show "error" state in document.fonts.check() — only the
          Fallback variants load. The <link> below guarantees the real Inter /
          DM Sans / JetBrains Mono fonts load globally for every authenticated
          page + every modal, matching the canonical reference 1:1.
          See feedback_skill_v2.2_first_use.md Lesson 10.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/*
          Canonical _SHELL Developer Handoff.md §1 explicitly requires this
          <link> in <head>. The next/font/google fallback at line 6 above
          also exists for build-time optimization, but its CSS variables
          don't cascade to plain CSS rules outside Tailwind utility classes
          (Lesson 10 — verified via getComputedStyle empty for --font-inter).
          The <link> below guarantees the real fonts load globally.
          (Lint warning @next/next/no-page-custom-font is intentional.)
        */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=DM+Sans:wght@500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        {/*
          Theme bootstrap — read localStorage qa-nexus.theme BEFORE first paint
          and set html[data-theme] so the UI doesn't flash dark→light or vice
          versa on hydration. Matches _SHELL Developer Handoff.md §4 theme toggle.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('qa-nexus.theme');if(t==='light'){document.documentElement.setAttribute('data-theme','light')}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <QueryProvider>
          <AuthProvider>
            <CurrentUserProvider>
              <ProjectProvider>
                <TeamRosterProvider>{children}</TeamRosterProvider>
              </ProjectProvider>
            </CurrentUserProvider>
          </AuthProvider>
        </QueryProvider>
        {/*
          Sonner toaster — F27m1 fires success on submit, error on
          submit-failure, AdminGuard fires the `?error=admin-required`
          intercept toast on /home. theme="dark" matches the locked
          PM1 dark canvas; toastOptions style hooks into the design
          token vars so toast bg/border match the rest of the surface.
        */}
        <Toaster
          theme="dark"
          position="bottom-right"
          richColors
          closeButton
          toastOptions={{
            style: {
              background: 'var(--raised)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
            },
          }}
        />
      </body>
    </html>
  );
}
