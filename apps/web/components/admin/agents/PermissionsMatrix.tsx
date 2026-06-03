// F26 PermissionsMatrix — 3 agents x 4 roles grid.

'use client';

import { F26_RAW } from '@/components/admin/agents-page.canned-data';
import type { F26PermissionsMatrixData } from '@/components/admin/agents/types';

const HEADING =
  F26_RAW.headings.h2.find((h) => h.startsWith('Agent permissions')) ?? 'Agent permissions';

interface Props {
  data: F26PermissionsMatrixData;
}

export function PermissionsMatrix({ data }: Props) {
  return (
    <section aria-labelledby="perm-h">
      <header className="section-head">
        <h2 id="perm-h">{HEADING}</h2>
      </header>
      <div className="section-body">
        <div className="perm-table-wrap">
          <table className="perm-table" aria-describedby="perm-footer">
            <thead>
              <tr>
                <th scope="col">Agent</th>
                {data.roles.map((r) => (
                  <th key={r} scope="col">
                    {r}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.permissions.map((row) => (
                <tr key={row.agent}>
                  <th scope="row">{row.agent}</th>
                  {data.roles.map((r) => (
                    <td key={r}>{row.byRole[r as keyof typeof row.byRole]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p id="perm-footer" className="perm-footer text-muted">
          {data.footer}
        </p>
      </div>
    </section>
  );
}
