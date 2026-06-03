// F26 RecentActivity — accepts `data?` for Phase-2 wire-up.
// Phase-1: falls back to placeholder when data is undefined.
// Phase-2: pass data from semantic canned-data export.

'use client';

import { F26_RAW } from '@/components/admin/agents-page.canned-data';
import type { F26RecentActivityData } from '@/components/admin/agents/types';

const HEADING =
  F26_RAW.headings.h2.find((h) => h.startsWith('Recent activity')) ?? 'Recent activity';

interface Props {
  /** Semantic data from agents-page.canned-data (added in Phase-2). */
  data?: F26RecentActivityData;
}

export function RecentActivity({ data }: Props) {
  return (
    <section aria-labelledby="act-h" id="activity">
      <header>
        <h2 id="act-h">{HEADING}</h2>
      </header>
      <div className="section-body">
        {data === undefined ? (
          <p className="text-muted">[ body populated in Phase-2 ]</p>
        ) : (
          // Phase-2 wire-up will replace this branch with rendered body.
          // Until then, prop accepted but unused — typecheck-clean.
          <p className="text-muted">[ Phase-2 wire-up pending ]</p>
        )}
      </div>
    </section>
  );
}
