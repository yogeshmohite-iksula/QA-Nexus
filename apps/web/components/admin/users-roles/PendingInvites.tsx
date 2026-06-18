// F27 PendingInvites — pending invite cards (canonical "5d 14h" in warn color).

'use client';

import type { PendingInviteRow } from '@/lib/api/pending-invites-api';

interface Props {
  // Sweep C (2026-06-12): structural row type so live GET /api/invitations rows
  // AND the canned fixture both satisfy it. (Was the frozen F27InvitesData.)
  data: readonly PendingInviteRow[];
}

export function PendingInvites({ data }: Props) {
  return (
    <section aria-labelledby="inv-h">
      <div className="sec-h" style={{ marginBottom: 10 }}>
        <h2 id="inv-h">
          Pending invites <span className="ct">· {data.length} pending</span>
        </h2>
      </div>
      {data.length === 0 ? (
        <p className="u-email mono" style={{ padding: '4px 2px', color: 'var(--t3)' }}>
          No pending invites.
        </p>
      ) : null}
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
