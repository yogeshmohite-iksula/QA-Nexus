// F26 AgentCardsGrid — accepts `data?` for Phase-2 wire-up.
// Phase-1: falls back to placeholder when data is undefined.
// Phase-2: pass data from semantic canned-data export.

'use client';

import { F26_RAW } from '@/components/admin/agents-page.canned-data';
import type { F26AgentsData } from '@/components/admin/agents/types';

const HEADING = F26_RAW.headings.h2.find((h) => h.startsWith('Agents 3')) ?? 'Agents 3';

interface Props {
  /** Semantic data from agents-page.canned-data (added in Phase-2). */
  data?: F26AgentsData;
}

export function AgentCardsGrid({ data }: Props) {
  return (
    <section aria-labelledby="agents-h">
      <header>
        <h2 id="agents-h">{HEADING}</h2>
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
