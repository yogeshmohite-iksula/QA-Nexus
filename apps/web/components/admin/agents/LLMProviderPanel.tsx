// F26 LLMProviderPanel — markup mirrors canonical .prov-panel.
// The "Configure" button links to the F26m1 modal route in edit mode for the
// configured provider; an "Add provider" entry uses the same route unparam'd.

'use client';

import Link from 'next/link';
import type { F26LLMProviderData } from '@/components/admin/agents/types';

interface Props {
  data: F26LLMProviderData;
}

export function LLMProviderPanel({ data }: Props) {
  return (
    <section aria-labelledby="prov-h">
      <div className="sec-h" style={{ marginBottom: 10 }}>
        <h2 id="prov-h">
          {data.title}{' '}
          <span className="ct" id="provHealthCt">
            {data.status}
          </span>
        </h2>
      </div>
      <div className="prov-panel" id="prov-panel" data-state="ok">
        <div className="prov-row">
          <div className="prov-id">
            <span className="prov-logo" id="provLogo">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </span>
            <div className="prov-meta">
              <span className="prov-name">
                <span>{data.provider}</span>
                <span className="prov-state ok">
                  <span className="dot"></span>
                  <span>{data.connectionStatus}</span>
                </span>
              </span>
              <span className="prov-line mono">
                <span className="v">{data.model}</span>
                <span className="sep">·</span>
                <span className="v">{data.latency}</span> latency
                <span className="sep">·</span>last health check{' '}
                <span className="v">{data.lastHealthCheck}</span> ago
              </span>
            </div>
          </div>
          <div className="prov-stats">
            <span>
              RPD{' '}
              <span className="v">
                {data.rpd.used} / {data.rpd.limit.toLocaleString()}
              </span>
            </span>
            <span>
              Daily cost <span className="v">{data.dailyCost}</span>
            </span>
            <span>
              Fallback <span className="v">{data.fallback}</span>
            </span>
          </div>
          <div className="prov-cta">
            <button className="btn-secondary" type="button">
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              >
                <path d="M8 1v2M8 13v2M3 3l1.4 1.4M11.6 11.6L13 13M1 8h2M13 8h2" />
                <circle cx="8" cy="8" r="3" />
              </svg>
              Test now
            </button>
            <Link className="btn-primary" href="/admin/agents/provider-setup?mode=edit&id=groq">
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="8" cy="8" r="2" />
                <path d="M8 1v1.5M8 13.5V15M2.5 4.5l1 1M12.5 10.5l1 1M1 8h1.5M13.5 8H15M2.5 11.5l1-1M12.5 5.5l1-1" />
              </svg>
              Configure
            </Link>
          </div>
        </div>
        <div className="prov-callout">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <path d="M12 9v4M12 17h.01" />
          </svg>
          <span>{data.note}</span>
        </div>
      </div>
    </section>
  );
}
