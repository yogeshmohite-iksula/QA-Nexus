/**
 * ProjectContext — workspace projects + the currently active project.
 *
 * Spec: followup (i) Phase 3(d). Pattern A compatible (no fetch).
 *
 * In demo / pre-BE mode (today): reads `projects[]` from `lib/demo-seed`.
 *   Default active project = RET (Iksula Returns, the anchor project per
 *   IKSULA_CONTEXT.md). Provide `setActiveProject(slug)` for the project
 *   switcher in HomeShell.
 *
 * Once BE lands (T030.5+):
 *   1. Replace the demo-seed import with a TanStack Query call against
 *      `GET /api/projects`.
 *   2. `setActiveProject(slug)` becomes a server-persisted user preference
 *      (POST /api/users/me/active-project) — but the hook signature is
 *      stable; components require ZERO changes.
 *
 * Migration: see `docs/refactor/seed-centralization-migration.md`.
 */
'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Project } from '@qa-nexus/shared';
import { projects as seedProjects, SEED_IDS } from '../demo-seed';
import { fetchWorkspaceProjects } from '../api/projects-api';

interface ProjectContextValue {
  /** All projects in the active workspace. Stable order: alphabetical by key
   *  (AUTH, CART, OPS, PAY, RET) so the project switcher list is predictable. */
  projects: Project[];

  /** The currently active project. Always non-null in demo mode (defaults
   *  to RET). Components reading the active project should treat it as
   *  authoritative for "current context" badges, breadcrumbs, queues. */
  activeProject: Project;

  /** Switch active project by lowercased key (`'ret'`, `'cart'`, etc).
   *  No-op + console warn if slug unknown — UI handles missing project
   *  gracefully (per Yogesh's spec: "useProject(slug) — returns null if
   *  slug not found, NOT a thrown error"). */
  setActiveProject: (slug: string) => void;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

interface ProjectProviderProps {
  children: ReactNode;
  /** Override the default-active project (RET). Useful in tests. */
  initialActiveSlug?: string;
}

export function ProjectProvider({ children, initialActiveSlug }: ProjectProviderProps) {
  // 57th-RC fix (Fri 2026-06-19 ~20:00 IST): the project list now hydrates
  // from GET /api/projects on mount. seed projects are the offline fallback,
  // not the source of truth. This eliminates the UUID-drift class of bug
  // that produced /api/projects/<stale-seed-uuid>/requirements 404s after
  // BE re-seeded the pilot DB.
  //
  // Hydration timing (intentional, see comments in this block):
  //   1) Initial render uses `seedProjects` so the shell + switcher render
  //      synchronously — no flash of "Loading projects…"
  //   2) The useEffect below replaces the project array with the live BE
  //      response if/when it arrives. setActiveProject(slug) re-uses the
  //      same active slug against the new id list, so the topbar switcher
  //      survives the swap without "jumping".
  //   3) Fetch failure / non-Admin / unauthenticated → live state stays
  //      null → seed array remains the rendered source (graceful).

  const [liveProjects, setLiveProjects] = useState<readonly Project[] | null>(null);
  const effectiveProjects: readonly Project[] = liveProjects ?? seedProjects;

  const initialSlug = useMemo<string>(() => {
    return (initialActiveSlug ?? 'ret').toLowerCase();
  }, [initialActiveSlug]);

  const [activeSlug, setActiveSlugRaw] = useState<string>(initialSlug);

  useEffect(() => {
    let alive = true;
    void fetchWorkspaceProjects().then((res) => {
      if (alive && res && res.length > 0) {
        setLiveProjects(res);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  const setActiveProject = useCallback(
    (slug: string) => {
      const lower = slug.toLowerCase();
      const match = effectiveProjects.find((p) => p.key.toLowerCase() === lower);
      if (!match) {
        console.warn(
          `ProjectContext.setActiveProject: unknown slug "${slug}". ` +
            'No-op. Valid keys: ' +
            effectiveProjects.map((p) => p.key).join(', '),
        );
        return;
      }
      setActiveSlugRaw(lower);
    },
    [effectiveProjects],
  );

  const value = useMemo<ProjectContextValue>(() => {
    const activeProject =
      effectiveProjects.find((p) => p.key.toLowerCase() === activeSlug) ??
      effectiveProjects.find((p) => p.key.toLowerCase() === 'ret') ??
      effectiveProjects[0]!; // safe: seed always has ≥1 project
    return {
      projects: [...effectiveProjects],
      activeProject,
      setActiveProject,
    };
  }, [effectiveProjects, activeSlug, setActiveProject]);

  // Reference SEED_IDS so the import isn't pruned (kept for the seed
  // fallback path's stable test identifiers).
  void SEED_IDS;

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

/** Hook — returns a single project by lowercased key, or `null` if not found.
 *
 *  Per Yogesh's spec: "useProject(slug) — returns null if slug not found,
 *  NOT a thrown error (UI handles missing project gracefully)."
 *
 *  Use cases:
 *  - URL-driven page (`/projects/ret`) — slug from params, lookup, render
 *    "project not found" empty state if null.
 *  - Cross-project rendering (e.g., a defect on PAY shown on the RET dashboard)
 *    — lookup defect.projectKey, render "PAY" badge inline.
 */
export function useProject(slug: string): Project | null {
  const ctx = useContext(ProjectContext);
  if (!ctx) {
    throw new Error(
      'useProject must be called within a <ProjectProvider>. ' +
        'Wrap your tree at apps/web/app/layout.tsx.',
    );
  }
  return ctx.projects.find((p) => p.key.toLowerCase() === slug.toLowerCase()) ?? null;
}

/** Hook — returns the full project list. Stable identity across renders. */
export function useProjectList(): Project[] {
  const ctx = useContext(ProjectContext);
  if (!ctx) {
    throw new Error('useProjectList must be called within a <ProjectProvider>.');
  }
  return ctx.projects;
}

/** Hook — returns the active project (always non-null in demo mode). */
export function useActiveProject(): Project {
  const ctx = useContext(ProjectContext);
  if (!ctx) {
    throw new Error('useActiveProject must be called within a <ProjectProvider>.');
  }
  return ctx.activeProject;
}

/** Hook — returns the project-switcher setter for the HomeShell switcher. */
export function useSetActiveProject(): ProjectContextValue['setActiveProject'] {
  const ctx = useContext(ProjectContext);
  if (!ctx) {
    throw new Error('useSetActiveProject must be called within a <ProjectProvider>.');
  }
  return ctx.setActiveProject;
}
