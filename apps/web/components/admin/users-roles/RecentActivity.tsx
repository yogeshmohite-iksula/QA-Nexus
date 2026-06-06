// F27 RecentActivity — single-line entries, activity text left + date·time·event_type right, vertically centered.

'use client';

import type { F27ActivityData } from '@/components/admin/users-roles/types';

interface Props {
  data: F27ActivityData;
}

export function RecentActivity({ data }: Props) {
  return (
    <section aria-labelledby="act-h">
      <div className="sec-h" style={{ marginBottom: 10 }}>
        <h2 id="act-h">
          Recent activity <span className="ct">· Last 14 days</span>
        </h2>
        <a href="#" className="ghost details-link">
          View full audit log →
        </a>
      </div>
      <div className="act-card">
        <ol className="act-list" aria-label="Recent activity entries">
          {data.map((entry, i) => (
            <li key={i} className="act-row" data-tone={entry.tone}>
              <span className="act-dot" aria-hidden="true" data-tone={entry.tone}></span>
              <div className="act-line">
                <b>{entry.actor}</b> {entry.action}
                {entry.target && (
                  <>
                    {' '}
                    <b>{entry.target}</b>
                  </>
                )}
                {entry.detail && <> {entry.detail}</>}
              </div>
              <div className="act-meta mono">
                {entry.date} · {entry.time} · {entry.eventType}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
