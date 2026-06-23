// F27 TeamRoster — Current team table (canonical .u-tbl markup).
// Pattern A TODOs (deferred markers preserved for Phase-3):
// - Filter button → pattern-a:deferred:users-filter-change
// - Export CSV button → pattern-a:deferred:users-export-csv
// - Role cell → pattern-a:deferred:users-role-change
// - Project chip → pattern-a:deferred:users-project-assign
// - Edit / More row actions → pattern-a:deferred:users-status-toggle

'use client';

import type { TeamRosterRow } from '@/lib/api/team-roster-api';

function RoleBadge({ role }: { role: string }) {
  const tone = role === 'ADMIN' ? 'admin' : role === 'QA LEAD' ? 'lead' : 'eng';
  return <span className={`role-badge ${tone}`}>{role}</span>;
}

function FilterIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    >
      <path d="M2 4h12M4 8h8M6 12h4" />
    </svg>
  );
}
function ExportIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 11v2h10v-2M8 2v8M5 7l3 3 3-3" />
    </svg>
  );
}
function EditIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 3l3 3-8 8H3v-3z" />
    </svg>
  );
}
function MoreIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
      <circle cx="8" cy="3" r="1.4" />
      <circle cx="8" cy="8" r="1.4" />
      <circle cx="8" cy="13" r="1.4" />
    </svg>
  );
}

interface Props {
  // Fri WIRE batch 1 (2026-06-19): structural row type so live GET /api/users
  // rows AND the canned fixture both satisfy it. Same pattern as Sweep C.
  data: readonly TeamRosterRow[];
}

export function TeamRoster({ data }: Props) {
  return (
    <section aria-labelledby="team-h">
      <div className="sec-h" style={{ marginBottom: 10 }}>
        <h2 id="team-h">
          Current team <span className="ct">· {data.length} members</span>
        </h2>
        <div className="u-actions">
          <button className="u-btn" type="button">
            <FilterIcon />
            Filter
          </button>
          <button className="u-btn" type="button">
            <ExportIcon />
            Export CSV
          </button>
        </div>
      </div>
      <div className="u-card">
        <div className="u-tbl-wrap">
          <table className="u-tbl">
            <thead>
              <tr>
                <th scope="col">User</th>
                <th scope="col">Role</th>
                <th scope="col">Projects</th>
                <th scope="col">Status</th>
                <th scope="col">Last active</th>
                <th scope="col">Joined</th>
                <th scope="col" aria-label="Actions"></th>
              </tr>
            </thead>
            <tbody>
              {data.map((u) => (
                <tr key={u.email}>
                  <td>
                    <div className="u-user">
                      <span className="u-av" data-tone={u.roleKey}>
                        {u.initials}
                      </span>
                      <div className="u-meta">
                        <span className="u-name">
                          {u.name}
                          {u.nameSuffix && <span className="u-name-suffix"> {u.nameSuffix}</span>}
                        </span>
                        <span className="u-email">{u.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <RoleBadge role={u.role} />
                  </td>
                  <td>
                    <div className="proj-wrap">
                      {u.projects.map((p) => (
                        <span key={p} className="proj-chip">
                          {p}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span className="status-pill ok">{u.status}</span>
                  </td>
                  <td className="mono u-td-meta">{u.lastActive}</td>
                  <td className="mono u-td-meta">{u.joined}</td>
                  <td>
                    <div className="u-row-acts">
                      <button className="u-row-act" type="button" aria-label="Edit user">
                        <EditIcon />
                      </button>
                      <button className="u-row-act" type="button" aria-label="More actions">
                        <MoreIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
