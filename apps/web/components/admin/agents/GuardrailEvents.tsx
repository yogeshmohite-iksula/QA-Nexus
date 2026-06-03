// F26 GuardrailEvents — accepts `data?` for Phase-2 wire-up.
// Phase-2: 6 guardrail rules.

'use client';

import { F26_RAW } from '@/components/admin/agents-page.canned-data';
import type { F26GuardrailEventsData } from '@/components/admin/agents/types';

const H3 =
  F26_RAW.headings.h3.find((h) => h.startsWith('Guardrail configuration')) ??
  'Guardrail configuration';

interface Props {
  data?: F26GuardrailEventsData;
}

export function GuardrailEvents({ data }: Props) {
  return (
    <section aria-labelledby="guard-h">
      <header>
        <h3 id="guard-h" className="section-h2">
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
