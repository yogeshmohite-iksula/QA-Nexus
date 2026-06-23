'use client';

import { AdminShell } from '@/components/admin/admin-shell';
import { ComingSoon } from '@/components/admin/coming-soon';
import { ExecutiveHeader } from './ExecutiveHeader';
import { RoiValueTile } from './RoiValueTile';
import { QualityPostureGrid } from './QualityPostureGrid';
import { RiskPostureGrid } from './RiskPostureGrid';
import { TrendsRow } from './TrendsRow';
import { RecommendationsPanel } from './RecommendationsPanel';
import { ApprovalSignOff } from './ApprovalSignOff';
import { FooterBand } from './FooterBand';
import './f25.css';

interface F25PageProps {
  /** Light = ivory boardroom, Dark = workspace canvas. Default: 'light' */
  theme?: 'light' | 'dark';
}

/**
 * F25 Executive Dashboard — root container.
 *
 * Hard Rule 14: wraps in AdminShell with locked Prove mode and
 * Executive Dashboard active in the ANALYSE section.
 *
 * Hard Rule 18 Part 1 TERTIARY: each region carries
 * data-canonical-section for diff-probe fallback.
 *
 * Hard Rule 15: all agent references go through AgentTooltip
 * (Composer/Curator/Sherlock); zero A1/A2/A4 in UI text.
 */
export function F25Page({ theme = 'light' }: F25PageProps) {
  return (
    <AdminShell active="executive-dashboard">
      <div
        className="f25-shell flex-1 overflow-y-auto"
        data-theme={theme}
        data-canonical-section="prove-canvas"
      >
        <div className="mx-auto flex max-w-[1320px] flex-col gap-[18px] px-[14px] pb-[40px] pt-[18px] sm:px-[18px] sm:pb-[48px] sm:pt-[22px] md:gap-[20px] md:px-[24px] md:pb-[56px] md:pt-[26px] lg:px-[32px] lg:pt-[28px]">
          {/* Fri WIRE batch 5: F25 Executive Dashboard is M5; canned KPIs
           *  below are illustrative placeholders. ComingSoon banner declares
           *  the entire surface deferred. */}
          <ComingSoon
            label="Executive Dashboard"
            hint="Live KPIs, trends, and approvals are coming in a future release. Tiles below show the canonical layout with illustrative data."
            variant="inline"
          />
          <ExecutiveHeader />
          <RoiValueTile />
          <QualityPostureGrid />
          <RiskPostureGrid />
          <TrendsRow />
          <RecommendationsPanel />
          <ApprovalSignOff />
          <FooterBand />
        </div>
      </div>
    </AdminShell>
  );
}
