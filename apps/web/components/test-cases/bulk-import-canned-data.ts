// F16c Bulk Import Test Cases — Pattern A canned data.
//
// Reflects the v2 HTML "mid-import" Dedupe phase: 247 rows uploaded,
// 8/9 fields mapped, 245 validated (2 excluded), and Curator (A2)
// found 14 potential duplicates. Day-15 swap point: replace with
// real `/api/imports/csv` parse + map + validate + Curator dedupe
// pipeline.
//
// Iksula canon: legacy_refund_test_cases.csv (per CLAUDE.md sample
// files) + TC-RET-#### IDs.

export type ImportStep = 'upload' | 'map' | 'validate' | 'dedupe' | 'summary';

export type SimilarityTier = 'high' | 'med' | 'low';

export type StrategyKey = 'replace' | 'skip' | 'review';

export interface ImportFile {
  name: string;
  sizeLabel: string; // '2.4 MB'
  source: string; // 'TestRail export'
  rowsTotal: number;
  fieldsMapped: number;
  fieldsTotal: number;
  rowsValid: number;
  rowsExcluded: number;
  excludeReasons: string[];
}

export interface DedupePair {
  /** Imported row index. */
  newRow: number;
  newTitle: string;
  /** Existing TC ID it matches against. */
  existTcId: string;
  existTitle: string;
  similarityPct: number;
  tier: SimilarityTier;
  /** Curator's recommended action label for this row. */
  recommendedAction: string;
}

export interface StrategyDef {
  key: StrategyKey;
  title: string;
  description: string;
}

// ---------------------------------------------------------------------------
// Canned dataset
// ---------------------------------------------------------------------------

export const CANNED_FILE: ImportFile = {
  name: 'legacy_refund_test_cases.csv',
  sizeLabel: '2.4 MB',
  source: 'TestRail export',
  rowsTotal: 247,
  fieldsMapped: 8,
  fieldsTotal: 9,
  rowsValid: 245,
  rowsExcluded: 2,
  excludeReasons: ['Row 17: expected_results column empty', 'Row 89: malformed steps'],
};

export const STRATEGIES: StrategyDef[] = [
  {
    key: 'replace',
    title: 'Keep new (replace)',
    description: 'Imported row overwrites the existing TC. Use for canonical migrations.',
  },
  {
    key: 'skip',
    title: 'Keep existing (skip)',
    description: 'Skip the imported row if a match exists. Safest for additive imports.',
  },
  {
    key: 'review',
    title: 'Review each manually',
    description: 'Decide row-by-row below. Recommended for first import of new source.',
  },
];

export const DEFAULT_STRATEGY: StrategyKey = 'review';

export const CANNED_DUP_PAIRS: DedupePair[] = [
  {
    newRow: 12,
    newTitle: 'Refund retry on payment failure (3x backoff)',
    existTcId: 'TC-RET-0089',
    existTitle: 'Refund API retries on failure 3× with backoff',
    similarityPct: 91,
    tier: 'high',
    recommendedAction: 'Keep existing',
  },
  {
    newRow: 23,
    newTitle: '14-day refund window for digital goods',
    existTcId: 'TC-RET-0341',
    existTitle: 'Refund request within 14-day window succeeds',
    similarityPct: 93,
    tier: 'high',
    recommendedAction: 'Keep existing',
  },
  {
    newRow: 41,
    newTitle: 'Gift card portion returns to wallet',
    existTcId: 'TC-RET-0343',
    existTitle: 'Partial refund returns gift-card portion to wallet',
    similarityPct: 84,
    tier: 'med',
    recommendedAction: 'Review pair',
  },
  {
    newRow: 58,
    newTitle: 'Refund request after window auto-rejected',
    existTcId: 'TC-RET-0202',
    existTitle: 'Out-of-window refund returns rejected status',
    similarityPct: 81,
    tier: 'med',
    recommendedAction: 'Review pair',
  },
  {
    newRow: 79,
    newTitle: 'Refund auditor visibility for partial returns',
    existTcId: 'TC-RET-0418',
    existTitle: 'Auditor sees partial-refund line items in dashboard',
    similarityPct: 68,
    tier: 'low',
    recommendedAction: 'Keep both',
  },
];

/** Total dup matches Curator surfaces — the canned 5 pairs above are
 *  the high-signal previews; the rest sit "below the fold" in the
 *  Pattern A demo. Day-15 will paginate. */
export const TOTAL_DUP_COUNT = 14;

/** A2 / Curator metadata strip in the body header + footer. */
export const CURATOR_META = {
  agentId: 'A2',
  agentVersion: 'v1.1',
  technique: 'pgvector + cosine similarity',
  scanLatency: '11.4s',
  precisionLastImport: '78%',
};

/** Rows that will land if the user clicks Continue with current
 *  strategy. */
export function computeImportSummary(file: ImportFile, strategy: StrategyKey, dupCount: number) {
  // For 'replace': new rows = valid rows (replaces all dups too)
  // For 'skip': new rows = valid rows - dupCount (skips dups)
  // For 'review': new rows = valid rows - dupCount (deferred decisions
  //   pop a follow-on review modal). Pattern A treats it like 'skip'.
  const newRows = strategy === 'replace' ? file.rowsValid : file.rowsValid - dupCount;
  return {
    newRows,
    dupHandled: dupCount,
    excluded: file.rowsExcluded,
    destination: 'RET / Refund Core',
  };
}
