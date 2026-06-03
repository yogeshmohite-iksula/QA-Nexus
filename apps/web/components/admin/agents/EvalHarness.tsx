// F26 EvalHarness — accepts `data?` for Phase-2 wire-up.
// Phase-2 MUST include AC042 2026-05-27 row.

'use client';

import { F26_RAW } from '@/components/admin/agents-page.canned-data';
import type { F26EvalHarnessData } from '@/components/admin/agents/types';

const H3 = F26_RAW.headings.h3.find((h) => h.startsWith('Autonomy ladder')) ?? 'Autonomy ladder';

interface Props {
  data?: F26EvalHarnessData;
}

export function EvalHarness({ data }: Props) {
  return (
    <section aria-labelledby="eval-h">
      <header>
        <h3 id="eval-h" className="section-h2">
          {H3}
        </h3>
      </header>
      <div className="section-body">
        {data === undefined ? (
          <p className="text-muted">[ body populated in Phase-2 ]</p>
        ) : (
          <p className="text-muted">[ Phase-2 wire-up pending ]</p>
        )}
      </div>
    </section>
  );
}
