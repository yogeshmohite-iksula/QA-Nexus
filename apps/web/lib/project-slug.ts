// Canonical project URL-slug helpers — single source of truth for the
// `/projects/[slug]/…` convention.
//
// BUG-001 (Day-1 pilot baseline) fix: the app had TWO conflicting slug
// conventions — lowercased key (`ret`) on kb/imports/upload/sources, and
// name-slug (`iksula-returns`) on defects/reports/results/runs. Under
// `output: export` each page only ships HTML for the slugs its
// `generateStaticParams` emits, so the anchor 404'd on one set in prod.
// Yogesh ruling (Day-1 PM): standardize on the **name-slug**
// (`iksula-returns`). All project routes + nav now derive their slug here.
//
// `slugFromName` mirrors the logic in
// `components/projects/create-project-schema.ts` (kept identical; consolidate
// the two into this module in a later cleanup — P3 follow-up).

/** Minimal structural shape — avoids coupling to the seed `Project` type. */
interface NamedProject {
  name: string;
}

/** "Iksula Returns" → "iksula-returns". Lowercase, non-alphanumerics → `-`,
 *  trim leading/trailing dashes. */
export function slugFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Resolve a URL slug back to its project via name-slug match. */
export function projectFromSlug<T extends NamedProject>(
  slug: string,
  projects: readonly T[],
): T | undefined {
  return projects.find((p) => slugFromName(p.name) === slug);
}

/** `generateStaticParams()` payload for every project's name-slug. Used by all
 *  single-`[slug]` project sub-routes so the static export ships one HTML per
 *  project at its canonical URL. */
export function getProjectStaticParams<T extends NamedProject>(
  projects: readonly T[],
): { slug: string }[] {
  return projects.map((p) => ({ slug: slugFromName(p.name) }));
}
