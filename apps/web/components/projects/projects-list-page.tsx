// F09 Projects List — main orchestrator client component.
//
// Layout (mobile-first per CLAUDE.md Rule 12):
//   < lg: top bar + main (single col, filter wraps, cards stack 1-col)
//   lg+:  + left rail (240 px)
//
// Pattern A: page mount fires `pattern-a:deferred:projects-list-load`.
// Each row click → pattern-a:deferred:projects-route { target, projectKey }.
// "+ New project" → pattern-a:deferred:open-modal { modal: 'F10' }.
// NO fetch / useMutation / axios.

'use client';

import { useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCurrentUser } from '@/lib/contexts/CurrentUserContext';
import { useProjectList } from '@/lib/contexts/ProjectContext';
import { ProjectsShell } from './projects-shell';
import { LeftRail } from './left-rail';
import { CreateProjectModal } from './create-project-modal';
import { ARCHIVED_COUNT, joinProjectsWithFixtures, type ProjectListRow } from './data';

export function ProjectsListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showCreateModal = searchParams?.get('new') === '1';
  const me = useCurrentUser();
  const seedProjects = useProjectList();

  // Stable order: anchor (RET) first, then alphabetical by key. Demo
  // seed alphabetises by key (AUTH, CART, OPS, PAY, RET) — pull RET to
  // the front so the pinned anchor matches the locked frame's intent.
  const orderedProjects = useMemo(() => {
    const ret = seedProjects.find((p) => p.key === 'RET');
    const others = seedProjects.filter((p) => p.key !== 'RET');
    return ret ? [ret, ...others] : seedProjects;
  }, [seedProjects]);

  const allRows: ProjectListRow[] = useMemo(
    () => joinProjectsWithFixtures(orderedProjects),
    [orderedProjects],
  );

  const pinnedProjects = allRows.filter((p) => p.isPinned);
  const allProjects = allRows.filter((p) => !p.isPinned);

  useEffect(() => {
    console.info('pattern-a:deferred:projects-list-load', {
      projectCount: allRows.length,
      pinnedCount: pinnedProjects.length,
      role: me.role,
    });
  }, [allRows.length, pinnedProjects.length, me.role]);

  function logRoute(target: string, projectKey?: string) {
    console.info(
      'pattern-a:deferred:projects-route',
      projectKey ? { target, projectKey } : { target },
    );
  }

  function openCreateModal() {
    console.info('pattern-a:deferred:open-modal', { modal: 'F10' });
    // Open modal via query param — F10 mounts when `?new=1` is present.
    router.push('/projects?new=1');
  }

  function closeCreateModal() {
    router.push('/projects');
  }

  return (
    <ProjectsShell>
      <div className="flex flex-1">
        <LeftRail />
        <main className="flex min-w-0 flex-1 flex-col gap-8 px-4 py-6 sm:px-6 sm:py-8 lg:gap-10 lg:px-8">
          <Hero projects={allRows} onCreateProject={openCreateModal} />
          <FilterBar />
          {pinnedProjects.length > 0 && (
            <PinnedSection projects={pinnedProjects} onOpen={logRoute} />
          )}
          <AllProjectsSection projects={allProjects} onOpen={logRoute} />
          <ArchivedSection count={ARCHIVED_COUNT} />
        </main>
      </div>
      {showCreateModal && <CreateProjectModal onClose={closeCreateModal} />}
    </ProjectsShell>
  );
}

// ---------------------------------------------------------------------------
// Hero — heading + sub + new project CTA
// ---------------------------------------------------------------------------

function Hero({
  projects,
  onCreateProject,
}: {
  projects: ProjectListRow[];
  onCreateProject: () => void;
}) {
  const leadOnAll = projects.every((p) => p.yourRole === 'Lead' || p.yourRole === 'Admin');
  return (
    <section
      aria-labelledby="hero-head"
      className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
    >
      <div className="flex flex-col gap-2">
        <h1
          id="hero-head"
          className="font-display text-[24px] font-semibold leading-tight text-[var(--text-primary)] sm:text-[28px] lg:text-[30px]"
        >
          Which project do you want to work on?
        </h1>
        <p className="text-[14px] leading-[20px] text-[var(--text-secondary)] sm:text-[15px]">
          <span className="font-semibold text-[var(--text-primary)]">
            {projects.length} projects
          </span>
          {leadOnAll && <span> · you&apos;re a Lead/Admin on all {projects.length}</span>}
          <span> · </span>
          <span className="text-[var(--primary)]">Iksula Returns is the active anchor</span>
        </p>
      </div>
      <button
        type="button"
        onClick={onCreateProject}
        className="inline-flex h-10 min-h-11 items-center justify-center gap-1.5 rounded bg-[var(--primary)] px-4 text-[14px] font-semibold text-[var(--primary-ink)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
      >
        <PlusIcon />
        New project
      </button>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Filter bar — search + 3 dropdowns + view tabs
// ---------------------------------------------------------------------------

function FilterBar() {
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--base)] p-3 sm:flex-row sm:items-center sm:gap-2">
      <div className="flex flex-1 items-center gap-2 rounded border border-[var(--border-subtle)] bg-[var(--raised)] px-3 py-2 text-[13px] text-[var(--text-tertiary)]">
        <SearchIcon />
        <span className="flex-1 truncate">Search projects by name, Jira key, or owner…</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <FilterDropdown label="All roles" />
        <FilterDropdown label="Any env" />
        <FilterDropdown label="Any status" />
      </div>
      <div role="tablist" aria-label="View" className="flex items-center gap-1 sm:ml-auto">
        <ViewTab active>Grid</ViewTab>
        <ViewTab>Table</ViewTab>
        <ViewTab>Compact</ViewTab>
      </div>
    </section>
  );
}

function FilterDropdown({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="inline-flex h-7 items-center gap-1 rounded border border-[var(--border-subtle)] bg-[var(--raised)] px-2 text-[12px] text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
    >
      {label}
      <ChevronDownIcon size={10} />
    </button>
  );
}

function ViewTab({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active ? 'true' : 'false'}
      className={[
        'inline-flex h-8 items-center px-2.5 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]',
        active
          ? 'border-b-2 border-[var(--primary)] text-[var(--text-primary)]'
          : 'border-b-2 border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-primary)]',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Pinned section — wide card for the anchor project
// ---------------------------------------------------------------------------

function PinnedSection({
  projects,
  onOpen,
}: {
  projects: ProjectListRow[];
  onOpen: (target: string, key: string) => void;
}) {
  return (
    <section aria-labelledby="pinned-head" className="flex flex-col gap-3">
      <header className="flex items-center justify-between gap-3">
        <h2
          id="pinned-head"
          className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--text-tertiary)]"
        >
          <StarIcon /> Pinned
          <span className="font-mono text-[10px] text-[var(--text-disabled)]">
            · {projects.length}
          </span>
        </h2>
        <button
          type="button"
          className="text-[12px] font-medium text-[var(--text-tertiary)] hover:text-[var(--primary)] focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
        >
          Manage pins
        </button>
      </header>
      <div className="flex flex-col gap-3">
        {projects.map((p) => (
          <ProjectCard key={p.id} project={p} variant="pinned" onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// All projects section — grid
// ---------------------------------------------------------------------------

function AllProjectsSection({
  projects,
  onOpen,
}: {
  projects: ProjectListRow[];
  onOpen: (target: string, key: string) => void;
}) {
  return (
    <section aria-labelledby="all-head" className="flex flex-col gap-3">
      <header className="flex items-center justify-between gap-3">
        <h2
          id="all-head"
          className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--text-tertiary)]"
        >
          All projects
          <span className="font-mono text-[10px] text-[var(--text-disabled)]">
            · {projects.length}
          </span>
        </h2>
        <button
          type="button"
          className="text-[12px] font-medium text-[var(--text-tertiary)] hover:text-[var(--primary)] focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
        >
          Sort: Last activity ▾
        </button>
      </header>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-6">
        {projects.map((p) => (
          <ProjectCard key={p.id} project={p} variant="grid" onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Archived section — collapsed empty bucket
// ---------------------------------------------------------------------------

function ArchivedSection({ count }: { count: number }) {
  return (
    <section
      aria-labelledby="archived-head"
      className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-transparent p-4"
    >
      <h2
        id="archived-head"
        className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--text-tertiary)]"
      >
        <ChevronRightIcon /> Archived projects
        <span className="font-mono text-[10px] text-[var(--text-disabled)]">· {count}</span>
      </h2>
      {count === 0 && (
        <span className="text-[12px] text-[var(--text-disabled)]">Nothing archived yet</span>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Project card — pinned variant (wide) + grid variant
// ---------------------------------------------------------------------------

function ProjectCard({
  project,
  variant,
  onOpen,
}: {
  project: ProjectListRow;
  variant: 'pinned' | 'grid';
  onOpen: (target: string, key: string) => void;
}) {
  const isPinned = variant === 'pinned';
  const ragColor = ragDotColor(project.rag);
  const branchClass = branchToneClass(project.branchTone);

  return (
    <article
      className={[
        'flex flex-col gap-4 rounded-2xl border p-5',
        isPinned
          ? 'border-[var(--primary)]/35 bg-[var(--primary)]/5'
          : 'hover:border-[var(--primary)]/45 border-[var(--border-subtle)] bg-[var(--base)] transition-colors',
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-mono text-[13px] font-bold text-[var(--primary-ink)]"
          style={{ background: 'linear-gradient(135deg, #2DD4BF 0%, #A78BFA 120%)' }}
        >
          {project.glyph}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-[18px] font-semibold leading-tight text-[var(--text-primary)] sm:text-[20px]">
              {project.name}
            </h3>
            <span
              className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-medium ${branchClass}`}
            >
              {project.branch}
            </span>
            {project.isAnchor && (
              <span className="bg-[var(--primary)]/20 rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--primary)]">
                Active anchor
              </span>
            )}
          </div>
          <span className="font-mono text-[11px] text-[var(--text-tertiary)]">
            {project.key} · {project.sprint}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            aria-label={project.isPinned ? `Unpin ${project.name}` : `Pin ${project.name}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded text-[var(--text-tertiary)] transition-colors hover:bg-[var(--raised)] hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
          >
            <StarIcon filled={project.isPinned} />
          </button>
          <button
            type="button"
            aria-label={`More options for ${project.name}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded text-[var(--text-tertiary)] transition-colors hover:bg-[var(--raised)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
          >
            <KebabIcon />
          </button>
        </div>
      </div>

      {/* RAG row */}
      <div className="flex flex-wrap items-center gap-2">
        <span
          aria-label={`RAG ${project.rag}`}
          className={`inline-block h-2 w-2 rounded-full ${ragColor}`}
        />
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
          {project.ragLabel}
        </span>
      </div>

      {/* Stat chips */}
      <div className="flex flex-wrap gap-2">
        <StatChip label={project.openCases} />
        <StatChip label={project.automated} />
        <StatChip label={project.defects} />
      </div>

      {/* Footer: role + last activity + Open */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-subtle)] pt-3">
        <span className="font-mono text-[11px] text-[var(--text-tertiary)]">
          Your role: {project.yourRole} · {project.lastActivity}
        </span>
        <div className="flex items-center gap-2">
          {project.setup?.incomplete && (
            <button
              type="button"
              onClick={() => onOpen('F08c-empty-' + project.key, project.key)}
              className="inline-flex h-9 min-h-11 items-center justify-center rounded border border-[var(--border-subtle)] px-3 text-[12px] font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--raised)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
            >
              Complete setup
            </button>
          )}
          <button
            type="button"
            onClick={() =>
              onOpen(
                project.isAnchor ? 'F08b-home-lead-' + project.key : 'F08-home-' + project.key,
                project.key,
              )
            }
            className={[
              'inline-flex h-9 min-h-11 items-center justify-center gap-1 rounded text-[12px] font-semibold transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]',
              isPinned
                ? 'bg-[var(--primary)] px-4 text-[var(--primary-ink)]'
                : 'text-[var(--primary)]',
            ].join(' ')}
          >
            {isPinned ? 'Open project' : 'Open'} <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ragDotColor(rag: ProjectListRow['rag']): string {
  if (rag === 'green') return 'bg-[var(--pass)]';
  if (rag === 'amber') return 'bg-[var(--warn)]';
  if (rag === 'red') return 'bg-[var(--fail)]';
  return 'bg-[var(--text-disabled)]';
}

function branchToneClass(tone: ProjectListRow['branchTone']): string {
  if (tone === 'staging') return 'text-[var(--warn)] bg-[var(--warn)]/10';
  if (tone === 'available') return 'text-[var(--text-disabled)] bg-[var(--overlay)]';
  return 'text-[var(--text-tertiary)] bg-[var(--overlay)]';
}

function StatChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded border border-[var(--border-subtle)] bg-[var(--raised)] px-2 py-0.5 font-mono text-[11px] text-[var(--text-secondary)]">
      {label}
    </span>
  );
}

function PlusIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function ChevronDownIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m6 9 6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function ChevronRightIcon() {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m9 6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" />
      <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function StarIcon({ filled }: { filled?: boolean }) {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      aria-hidden="true"
    >
      <path
        d="M12 2.5l3.09 6.26L22 9.77l-5 4.87L18.18 22 12 18.77 5.82 22 7 14.64l-5-4.87 6.91-1.01z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function KebabIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="5" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="12" cy="19" r="1.5" />
    </svg>
  );
}
