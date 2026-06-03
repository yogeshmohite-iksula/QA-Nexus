// F26 GuardrailEvents — 4 trigger events (last 30 days).

'use client';

import { F26_RAW } from '@/components/admin/agents-page.canned-data';
import type { F26GuardrailEventsData } from '@/components/admin/agents/types';

const HEADING =
  F26_RAW.headings.h3.find((h) => h.startsWith('Guardrail configuration')) ??
  'Guardrail configuration';

interface Props {
  data: F26GuardrailEventsData;
}

export function GuardrailEvents({ data }: Props) {
  return (
    <section aria-labelledby="guard-h">
      <header className="section-head">
        <h3 id="guard-h" className="section-h2">
          {HEADING} <span className="pill-note text-muted">6 rules</span>
        </h3>
      </header>
      <div className="section-body">
        <ol className="guardrail-list" aria-label="Recent guardrail triggers">
          {data.map((evt, i) => (
            <li key={i} className="guardrail-row">
              <span className="guardrail-date text-muted">{evt.date}</span>
              <span className="guardrail-type" data-tone="warn">
                {evt.type}
              </span>
              <p className="guardrail-desc">{evt.description}</p>
              <span className="guardrail-target text-muted">{evt.target}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
