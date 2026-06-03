// F26 LLMProviderPanel — flat key-value config + note.

'use client';

import type { F26LLMProviderData } from '@/components/admin/agents/types';

interface Props {
  data: F26LLMProviderData;
}

export function LLMProviderPanel({ data }: Props) {
  return (
    <section aria-labelledby="prov-h">
      <header className="section-head">
        <h2 id="prov-h">
          {data.title}{' '}
          <span className="ct" data-tone="pass" id="provHealthCt">
            {data.status}
          </span>
        </h2>
      </header>
      <div className="section-body">
        <dl className="provider-config">
          <div className="provider-row">
            <dt>Provider</dt>
            <dd>{data.provider}</dd>
          </div>
          <div className="provider-row">
            <dt>Status</dt>
            <dd data-tone="pass">{data.connectionStatus}</dd>
          </div>
          <div className="provider-row">
            <dt>Model</dt>
            <dd>{data.model}</dd>
          </div>
          <div className="provider-row">
            <dt>Latency</dt>
            <dd>{data.latency}</dd>
          </div>
          <div className="provider-row">
            <dt>Last health check</dt>
            <dd>{data.lastHealthCheck}</dd>
          </div>
          <div className="provider-row">
            <dt>RPD</dt>
            <dd>
              {data.rpd.used} / {data.rpd.limit}
            </dd>
          </div>
          <div className="provider-row">
            <dt>Daily cost</dt>
            <dd>{data.dailyCost}</dd>
          </div>
          <div className="provider-row">
            <dt>Fallback</dt>
            <dd>{data.fallback}</dd>
          </div>
        </dl>
        <p className="provider-note text-muted">{data.note}</p>
      </div>
    </section>
  );
}
