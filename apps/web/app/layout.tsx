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
    // suppressHydrationWarning on <body> only -- silences the well-known
    // false-positive React hydration mismatch caused by browser extensions
    // (Grammarly, ColorZilla, dark-reader, etc.) that inject attributes
    // into <body> between SSR and client hydration. Does NOT suppress real
    // hydration errors in our own component subtree.
    // Ref: https://nextjs.org/docs/messages/react-hydration-error
    <html
      lang="en"
      className={`${inter.variable} ${dmSans.variable} ${jetBrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <QueryProvider>
          <CurrentUserProvider>
            <ProjectProvider>
              <TeamRosterProvider>{children}</TeamRosterProvider>
            </ProjectProvider>
          </CurrentUserProvider>
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
