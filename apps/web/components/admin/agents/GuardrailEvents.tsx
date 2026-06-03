// F26 GuardrailEvents — canonical .guard-list with full sentence
// (description + suffix per canned-data extension).

'use client';

import type { F26GuardrailEventsData } from '@/components/admin/agents/types';

function typeClass(type: string): string {
  const t = type.toLowerCase();
  if (t.includes('pii')) return 'type pii';
  if (t.includes('secret')) return 'type secret';
  if (t.includes('length')) return 'type length';
  return 'type';
}

// Wrap code-like tokens (emails, tokens, IDs, tok counts) in <span class="code"> inline.
function renderText(s: string): React.ReactNode {
  const parts = s.split(
    /(\b(?:[A-Z]{2,}-[A-Z0-9]+-?\d*|sk-\S+|nitin@\S+|kb-\d+|\d[\d,]*\s*tok)\b)/,
  );
  return parts.map((p, i) => {
    if (i % 2 === 1)
      return (
        <span key={i} className="code">
          {p}
        </span>
      );
    return <span key={i}>{p}</span>;
  });
}

interface Props {
  data: F26GuardrailEventsData;
}

export function GuardrailEvents({ data }: Props) {
  return (
    <section aria-labelledby="guard-h">
      <details className="disclose" open>
        <summary id="guard-h">
          <span className="chev">
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <path d="M6 4l4 4-4 4" />
            </svg>
          </span>
          Guardrail events
          <span className="meta">Last 30 days · {data.length} triggers</span>
        </summary>
        <div className="disclose-body">
          <div className="guard-list">
            {data.map((evt, i) => (
              <div key={i} className="guard-evt">
                <span className="ts">{evt.date}</span>
                <span className={typeClass(evt.type)}>{evt.type}</span>
                <span className="det">
                  {renderText(evt.description)}
                  {'suffix' in evt && evt.suffix && renderText(evt.suffix)}
                </span>
              </div>
            ))}
          </div>
          <div className="guard-foot">
            <span>
              All triggers logged immutably to <b style={{ color: 'var(--t2)' }}>F28 audit trail</b>
              .
            </span>
            <a href="#">Review guardrail config ›</a>
          </div>
        </div>
      </details>
    </section>
  );
}
