// Implements F22 Defect Detail · see PM1_UI_v2/Redesign Frame by claude design/F22 Defect Detail v2.html
// Hard Rule 14: AdminShell wraps all authenticated content.
// Hard Rule 15: visual source-of-truth is the v2 HTML (NOT the bundle handoff).
// Hard Rule 17: all user-visible strings trace to canned-data.ts.

import { AdminShell } from '@/components/admin/admin-shell';
import { DefectHeader } from './DefectHeader';
import { SherlockRca } from './SherlockRca';
import { EvidenceSection } from './EvidenceSection';
import { CuratorSimilarDefects } from './CuratorSimilarDefects';
import { DiscussionThread } from './DiscussionThread';
import { RightRail } from './RightRail';
import {
  projectAnchor,
  defect,
  overallConfidence,
  confidenceBar,
  sherlockSummary,
  rcaLayers,
  suggestedFix,
  evidenceMeta,
  evidenceTabs,
  evidenceCards,
  similarDefects,
  discussionMeta,
  discussion,
  rightRail,
} from './canned-data';

interface Props {
  /** Project slug from route params — drives breadcrumb link. */
  slug: string;
}

export function F22DefectDetail({ slug }: Props) {
  // Project-scoped breadcrumb hrefs (Step 3 approval 2026-05-20).
  const defectsHref = `/projects/${slug}/defects`;

  return (
    <AdminShell active="defects-failures" projectKeyLower={projectAnchor.slug}>
      <div className="mx-auto w-full max-w-screen-2xl">
        <div className="px-4 py-6 md:px-6 lg:px-8 lg:py-8">
          {/* Two-column grid: main 7/10 / rail 3/10 at lg+, stacked on mobile. */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)] lg:gap-8">
            {/* def-center */}
            <div data-canonical-section="def-center" className="min-w-0 space-y-6">
              {/* Breadcrumb sits tight above the header (canonical title-row margin-top:10px). */}
              <div className="space-y-2.5">
                {/* Breadcrumb */}
                <nav
                  role="navigation"
                  aria-label="Breadcrumb"
                  data-canonical-section="breadcrumb"
                  className="font-mono text-[11px] uppercase tracking-[0.08em] text-[color:var(--t3)]"
                >
                  <a href={`/projects/${slug}`} className="hover:text-[color:var(--t2)]">
                    {projectAnchor.name}
                  </a>
                  <span className="mx-1.5 text-[color:var(--t4)]">/</span>
                  <a href={defectsHref} className="hover:text-[color:var(--t2)]">
                    Defects
                  </a>
                  <span className="mx-1.5 text-[color:var(--t4)]">/</span>
                  <span className="text-[color:var(--t2)]">{defect.id}</span>
                </nav>

                <DefectHeader defect={defect} />
              </div>

              <SherlockRca
                overall={overallConfidence}
                segments={confidenceBar}
                summary={sherlockSummary}
                layers={rcaLayers}
                fix={suggestedFix}
              />

              <EvidenceSection
                tabs={evidenceTabs}
                cards={evidenceCards}
                source={evidenceMeta.source}
              />

              <CuratorSimilarDefects defects={similarDefects} />

              <DiscussionThread meta={discussionMeta} comments={discussion} />
            </div>

            {/* def-rail */}
            <RightRail meta={rightRail} />
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
