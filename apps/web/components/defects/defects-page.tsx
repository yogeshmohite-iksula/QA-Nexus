// F21 Defects Hub — Pattern A scaffold (Hard Rule 17 from start).
// Mounts under AdminShell active="defects-failures" + projectKeyLower="ret".

'use client';

import { useState } from 'react';
import { AdminShell } from '@/components/admin/admin-shell';
import { DefHead } from './def-head';
import { FilterStrip } from './filter-strip';
import { DefectsToolbar } from './toolbar';
import { DefectRowItem } from './defect-row';
import { SdRail } from './sd-rail';
import { F21_DEFECTS } from './canned-data';

export function DefectsPage() {
  const [selectedId, setSelectedId] = useState<string>(F21_DEFECTS[0].id);
  return (
    <AdminShell active="defects-failures" projectKeyLower="ret">
      <div
        className="flex min-h-0 flex-1 flex-col"
        style={{ background: 'var(--canvas)', color: 'var(--t1)' }}
      >
        <DefHead />
        <FilterStrip />
        <DefectsToolbar />

        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px]">
          <section
            aria-label="Defect list"
            role="list"
            className="flex min-w-0 flex-col overflow-y-auto"
          >
            {F21_DEFECTS.map((row) => (
              <DefectRowItem
                key={row.id}
                row={row}
                isSelected={row.id === selectedId}
                onSelect={() => {
                  setSelectedId(row.id);
                  console.info('pattern-a:deferred:f21:select-defect', { id: row.id });
                }}
              />
            ))}
          </section>

          <div className="hidden lg:block lg:min-h-0">
            <SdRail />
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
