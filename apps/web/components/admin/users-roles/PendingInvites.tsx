// F27 PendingInvites — pending invite cards (canonical "5d 14h" in warn color).

'use client';

import type { F27InvitesData } from '@/components/admin/users-roles/types';

interface Props {
  data: F27InvitesData;
}

export function PendingInvites({ data }: Props) {
  return (
    <section aria-labelledby="inv-h">
      <div className="sec-h" style={{ marginBottom: 10 }}>
        <h2 id="inv-h">
          Pending invites <span className="ct">· {data.length} pending</span>
        </h2>
      </div>
      <div className="invite-list">
        {data.map((inv) => (
          <div key={inv.email} className="invite-card">
            <div className="u-user">
              <span className="u-av" data-tone="invite">
                {inv.initials}
              </span>
              <div className="u-meta">
                <span className="u-name">{inv.email}</span>
                <span className="u-email mono">
                  Invited by <b>{inv.sentBy}</b> · expires in{' '}
                  <b style={{ color: 'var(--warn)' }}>{inv.expiresIn}</b>
                </span>
              </div>
            </div>
            <div className="invite-meta">
              <span className="role-badge eng">{inv.role}</span>
              {inv.projects.map((p) => (
                <span key={p} className="proj-chip">
                  {p}
                </span>
              ))}
            </div>
            <div className="invite-acts">
              <button className="u-btn" type="button">
                Resend
              </button>
              <button className="u-btn danger" type="button">
                Revoke
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
