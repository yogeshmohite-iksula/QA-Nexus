// F23 Reports Studio — Region 0: Page head (banner + breadcrumb + h1 + sub).
// Source: handoff/F23/spec.json §sections[page-head] + canned-data.ts §page.

'use client';

import Link from 'next/link';
import { f23CannedData } from './canned-data';

interface Props {
  projectSlug: string;
}

export function PageHead({ projectSlug }: Props) {
  return (
    <header
      role="banner"
      aria-label="Reports Studio page header"
      className="flex flex-none flex-col gap-2 px-4 py-4 sm:px-6 lg:px-8"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 font-mono text-[11px]"
        style={{ color: 'var(--t3)' }}
      >
        <Link href={`/projects/${projectSlug}`} className="hover:underline">
          {f23CannedData.context.project}
        </Link>
        <span aria-hidden="true">·</span>
        <span style={{ color: 'var(--t2)' }}>Reports</span>
        <span aria-hidden="true">·</span>
        <span style={{ color: 'var(--t1)' }}>{f23CannedData.context.sprint}</span>
      </nav>
      <h1
        className="m-0 text-[24px] font-bold leading-[30px] sm:text-[28px] sm:leading-[34px]"
        style={{
          color: 'var(--t1)',
          fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
        }}
      >
        {f23CannedData.page.title}
      </h1>
      <p className="m-0 max-w-[80ch] text-[12.5px]" style={{ color: 'var(--t3)' }}>
        {f23CannedData.page.sub}
      </p>
    </header>
  );
}
