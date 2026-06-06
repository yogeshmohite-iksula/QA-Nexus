// F27 CtaBanner — "Add people" banner with slots/expires + Invite user CTA.
// Pattern A TODO: Invite user click → pattern-a:deferred:users-invite-open → /admin/users/invite (F27m1)

'use client';

import type { F27CtaBannerData } from '@/components/admin/users-roles/types';

interface Props {
  data: F27CtaBannerData;
}

export function CtaBanner({ data }: Props) {
  return (
    <section className="cta-banner" aria-label="Invite team members">
      <span className="cta-icon" aria-hidden="true">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="9" cy="8" r="3.5" />
          <path d="M3 20a6 6 0 0 1 12 0M18 8v6M21 11h-6" />
        </svg>
      </span>
      <div className="cta-body">
        <h2 className="cta-title">{data.title}</h2>
        <p className="cta-desc">{data.description}</p>
      </div>
      <div className="cta-meta">
        <div className="cta-stat">
          <span className="cta-stat-label">{data.slotsLabel}</span>
          <span className="cta-stat-value">
            {data.slotsValue} <span className="text-muted">{data.slotsOfTotal}</span>
          </span>
        </div>
        <div className="cta-stat">
          <span className="cta-stat-label">{data.expiresLabel}</span>
          <span className="cta-stat-value">
            {data.expiresValue} <span className="text-muted">{data.expiresUnit}</span>
          </span>
        </div>
      </div>
      <button className="cta-btn" type="button">
        <svg
          width="13"
          height="13"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        >
          <path d="M8 3v10M3 8h10" />
        </svg>
        {data.cta}
      </button>
    </section>
  );
}
