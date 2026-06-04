// F26 PermissionsMatrix — canonical .perm-tbl markup.

'use client';

import type { F26PermissionsMatrixData } from '@/components/admin/agents/types';

const TONE_BY_AGENT_PREFIX: Record<string, 'violet' | 'info' | 'fail'> = {
  Composer: 'violet',
  Curator: 'info',
  Sherlock: 'fail',
};

interface Props {
  data: F26PermissionsMatrixData;
}

function isYes(v: string): boolean {
  return v.startsWith('\u2713');
}

export function PermissionsMatrix({ data }: Props) {
  return (
    <section aria-labelledby="perm-h">
      <div className="sec-h" style={{ marginBottom: 10 }}>
        <h2 id="perm-h">
          Agent permissions by role <span className="ct">3 × 4</span>
        </h2>
        <span className="meta">
          Defined per <b>Navigation Contract §2</b>
        </span>
      </div>
      <div className="perm">
        <div className="perm-tbl-wrap">
          <table className="perm-tbl">
            <thead>
              <tr>
                <th>Agent</th>
                {data.roles.map((r) => (
                  <th key={r} style={r === 'Admin' ? { color: 'var(--fail)' } : undefined}>
                    {r}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.permissions.map((row) => {
                const [name, code] = row.agent.split(' ');
                const tone = TONE_BY_AGENT_PREFIX[name] ?? 'violet';
                return (
                  <tr key={row.agent}>
                    <td>
                      <span className={`pdot ${tone}`}></span>
                      {name}
                      <span className="code">{code}</span>
                    </td>
                    {data.roles.map((r) => {
                      const v = row.byRole[r as keyof typeof row.byRole];
                      return (
                        <td key={r}>
                          <span className={isYes(v) ? 'perm-yes' : 'perm-no'}>{v}</span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="perm-foot">
          <span className="note">{data.footer}</span>
          <button className="btn-secondary" type="button">
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 2l3 3-9 9H2v-3z" />
            </svg>
            Edit permissions
          </button>
        </div>
      </div>
    </section>
  );
}
