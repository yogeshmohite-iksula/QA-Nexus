// F27 RoleMatrix — Reference grid of role capabilities.
// Each card: icon-tile + name + member count + role badge + capability list
// + divider + "View role permissions" link in lower section.

'use client';

import type { F27RoleMatrixData, F27RoleRow } from '@/components/admin/users-roles/types';

function RoleIcon({ roleKey }: { roleKey: F27RoleRow['roleKey'] }) {
  // Per canonical role-specific glyphs — code brackets / shield-check /
  // shield-badge / eye, each in its tone-tinted square.
  if (roleKey === 'qa_engineer') {
    return (
      <span className="role-icon eng" aria-hidden="true">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      </span>
    );
  }
  if (roleKey === 'qa_lead') {
    return (
      <span className="role-icon lead" aria-hidden="true">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
      </span>
    );
  }
  if (roleKey === 'admin') {
    return (
      <span className="role-icon admin" aria-hidden="true">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      </span>
    );
  }
  // stakeholder
  return (
    <span className="role-icon stake" aria-hidden="true">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </span>
  );
}

interface Props {
  data: F27RoleMatrixData;
}

export function RoleMatrix({ data }: Props) {
  return (
    <section aria-labelledby="role-h">
      <div className="sec-h role-sec-h" style={{ marginBottom: 10 }}>
        <h2 id="role-h">
          Role matrix <span className="ref-chip">Reference</span>
        </h2>
        <span className="role-sec-meta">
          What each role can do in QA Nexus — see Settings &amp; Audit for per-permission detail.
        </span>
      </div>
      <div className="role-grid">
        {data.map((r) => {
          const toneClass =
            r.roleKey === 'admin'
              ? 'admin'
              : r.roleKey === 'qa_lead'
                ? 'lead'
                : r.roleKey === 'stakeholder'
                  ? 'stake'
                  : 'eng';
          const isPilotZero = r.memberLabel.startsWith('0');
          return (
            <article key={r.roleKey} className="role-card" data-role={r.roleKey}>
              <div className="role-card-body">
                <header className="role-head">
                  <RoleIcon roleKey={r.roleKey} />
                  <h3 className="role-name">{r.role}</h3>
                  <span className={`role-count ${isPilotZero ? 'pilot-zero' : ''}`}>
                    {r.memberLabel}
                  </span>
                </header>
                <span className={`role-badge ${toneClass}`}>{r.badge}</span>
                <ul className="role-caps">
                  {r.capabilities.map((cap, i) => (
                    <li key={i} className="role-cap" data-tone={cap.tone}>
                      <span className="cap-mark" aria-hidden="true">
                        {cap.tone === 'pass' ? '✓' : '✕'}
                      </span>
                      <span>{cap.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="role-card-foot">
                <a href="#" className="details-link">
                  → View role permissions
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
