// F26 LLMProviderPanel — REFERENCE PATTERN for Phase-2 wire-up.
//
// This component is fully Phase-2-ready: when data?: F26LLMProviderData
// is passed, it renders the full provider + health + rows. When data is
// absent (Phase-1 placeholder), it renders the heading + a "[ body
// populated in Phase-2 ]" stub.
//
// The other 6 section components will follow this same shape — update
// their `data === undefined` branch to render `data` similarly.

'use client';

import { F26_RAW } from '@/components/admin/agents-page.canned-data';
import type { F26LLMProviderData } from '@/components/admin/agents/types';

const HEADING = F26_RAW.headings.h2.find((h) => h.startsWith('LLM Provider')) ?? 'LLM Provider';

interface Props {
  /** Semantic data from agents-page.canned-data (added in Phase-2). */
  data?: F26LLMProviderData;
}

export function LLMProviderPanel({ data }: Props) {
  return (
    <section aria-labelledby="prov-h">
      <header className="section-head">
        <h2 id="prov-h">
          {HEADING}
          {data && (
            <span className="ct" data-tone={healthTone(data.health)} id="provHealthCt">
              {data.healthLabel}
            </span>
          )}
        </h2>
      </header>
      <div className="section-body">
        {data === undefined ? (
          <p className="text-muted">[ body populated in Phase-2 ]</p>
        ) : (
          <dl className="provider-config">
            <div className="provider-name-row">
              <dt>Provider</dt>
              <dd>{data.providerName}</dd>
            </div>
            {data.rows.map((row, i) => (
              <div key={i} className="provider-row" data-tone={row.tone}>
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}

// Map semantic health → canonical tone token (per dataAttrs.tone).
function healthTone(h: F26LLMProviderData['health']): 'pass' | 'warn' | 'fail' {
  switch (h) {
    case 'healthy':
      return 'pass';
    case 'degraded':
      return 'warn';
    case 'offline':
      return 'fail';
  }
}
