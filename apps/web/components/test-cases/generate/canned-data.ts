// F16b A1 Generate from Requirement — Pattern A canned data.
//
// All payloads here are static fixtures used while the BE Composer
// (A1) + Curator (A2) endpoints are still scaffolds. Day-15 swap
// point: replace these with real `/api/composer/generate` SSE
// streams + `/api/curator/check-similarity` calls.
//
// Iksula canon: RET-247, TC-RET-0341..0345, CHUNK-RET-0341/0287/0342.

export type SourceType = 'requirement' | 'jira' | 'freeform';

export interface SelectedRequirement {
  id: string; // 'RET-247'
  status: 'Ready' | 'Draft' | 'In review';
  source: 'F14' | 'Jira';
  title: string;
  sprint: string;
  owner: string;
  updatedAgo: string;
  acceptanceCriteria: string[];
}

export interface KbChunk {
  id: string; // 'CHUNK-RET-0341'
  relevance: number; // 0-1
  text: string;
  location: string; // 'refund_policy_v3.pdf · p.4 · §2.1'
}

export interface ProviderInfo {
  name: string; // 'A1-Groq'
  model: string; // 'openai/gpt-oss-120b'
  status: 'pass' | 'warn' | 'fail';
  quotaUsed: number;
  quotaTotal: number;
  fallbackLabel: string;
}

export type CaseState = 'queued' | 'streaming' | 'drafted' | 'accepted' | 'rejected';

export type ConfidenceTier = 'high' | 'med';
export type SimilarityTier = 'distinct' | 'likely-dup' | 'med';

export interface CaseStep {
  step: number;
  text: string;
}

export interface CuratorDup {
  /** TC-id of the existing case Curator thinks this duplicates. */
  matchTcId: string;
  matchTitle: string;
  similarityPct: number;
}

export interface GeneratedCase {
  id: string; // 'TC-RET-0341'
  title: string;
  state: CaseState;
  confidencePct: number;
  confidenceTier: ConfidenceTier;
  similarityPct: number;
  similarityTier: SimilarityTier;
  groundedReq: string; // 'RET-247'
  groundedChunkId: string; // 'CHUNK-RET-0341'
  steps: CaseStep[];
  expected: string;
  /** Curator dedup pair surfaced inline with the card. */
  curatorDup?: CuratorDup;
}

export type ActivityKind = 'composer-start' | 'drafted' | 'accepted' | 'streaming' | 'curator-flag';

export interface ActivityEvent {
  id: string; // unique key
  kind: ActivityKind;
  title: string;
  /** Bolded / monospaced TC id inside title (rendered separately). */
  tcId?: string;
  meta: string;
  detail?: string;
  detailTone?: 'default' | 'warn';
}

// ---------------------------------------------------------------------------
// Canned dataset — RET-247 refund-window scenario
// ---------------------------------------------------------------------------

export const CANNED_REQUIREMENT: SelectedRequirement = {
  id: 'RET-247',
  status: 'Ready',
  source: 'F14',
  title: 'Refund window for digital goods',
  sprint: 'Sprint 42',
  owner: 'Yogesh M.',
  updatedAgo: 'updated 2d ago',
  acceptanceCriteria: [
    'Refund window for digital goods is 14 days from delivery confirmation',
    'Refund retries up to 3 times on payment-gateway failure',
    'Partial refunds permitted; gift-card portion returns to wallet',
  ],
};

export const CANNED_KB_CHUNKS: KbChunk[] = [
  {
    id: 'CHUNK-RET-0341',
    relevance: 0.91,
    text: 'Refund window for digital goods is fourteen (14) calendar days from delivery confirmation. After this window, refund requests are auto-rejected unless escalated to support.',
    location: 'refund_policy_v3.pdf · p.4 · §2.1',
  },
  {
    id: 'CHUNK-RET-0287',
    relevance: 0.84,
    text: 'Refund API retries on payment-gateway failure up to three (3) times with exponential backoff (250ms, 500ms, 1s). After the third attempt the refund is queued for manual reconciliation.',
    location: 'api_spec_refund.md · p.12 · §4.3',
  },
  {
    id: 'CHUNK-RET-0342',
    relevance: 0.78,
    text: "Partial refunds are permitted at item-level granularity. The gift-card portion of any refund returns to the customer's wallet rather than the source payment method.",
    location: 'refund_policy_v3.pdf · p.6 · §2.4',
  },
];

export const CANNED_PROVIDER: ProviderInfo = {
  name: 'A1-Groq',
  model: 'openai/gpt-oss-120b',
  status: 'pass',
  quotaUsed: 4,
  quotaTotal: 1000,
  fallbackLabel: 'Fallback: A1-Gemini 2.5-flash',
};

/** Initial case dataset reflecting the v2 HTML "mid-stream" state:
 *  3 drafted cases (1 accepted, 1 accepted-with-dup, 1 awaiting review),
 *  1 streaming card, 1 queued card. */
export const CANNED_CASES: GeneratedCase[] = [
  {
    id: 'TC-RET-0341',
    title: 'Refund request within 14-day window succeeds for digital good',
    state: 'accepted',
    confidencePct: 92,
    confidenceTier: 'high',
    similarityPct: 34,
    similarityTier: 'distinct',
    groundedReq: 'RET-247',
    groundedChunkId: 'CHUNK-RET-0341',
    steps: [
      {
        step: 1,
        text: 'Customer purchases digital good X on day 0; delivery confirmation issued.',
      },
      { step: 2, text: 'On day 13, customer initiates refund via /api/refunds.' },
      {
        step: 3,
        text: 'System validates refund window against delivery_confirmed_at.',
      },
    ],
    expected: 'Refund accepted, status=approved, full amount returned to source PM.',
  },
  {
    id: 'TC-RET-0342',
    title: 'Refund retries up to 3× on payment-gateway failure with exponential backoff',
    state: 'accepted',
    confidencePct: 87,
    confidenceTier: 'high',
    similarityPct: 87,
    similarityTier: 'likely-dup',
    groundedReq: 'RET-247',
    groundedChunkId: 'CHUNK-RET-0287',
    steps: [
      {
        step: 1,
        text: 'Trigger refund on order #RET-12044; mock payment gateway to return 503.',
      },
      {
        step: 2,
        text: 'Observe retry logs for 3 attempts at 250ms / 500ms / 1s intervals.',
      },
      {
        step: 3,
        text: 'After 3rd failure, verify refund moves to manual_reconciliation queue.',
      },
    ],
    expected: '3 retry attempts, exponential backoff observed, final state queued_manual.',
    curatorDup: {
      matchTcId: 'TC-RET-0142',
      matchTitle: 'Refund API retries on failure 3×',
      similarityPct: 87,
    },
  },
  {
    id: 'TC-RET-0343',
    title: 'Partial refund of mixed cart returns gift-card portion to customer wallet',
    state: 'drafted',
    confidencePct: 81,
    confidenceTier: 'high',
    similarityPct: 22,
    similarityTier: 'distinct',
    groundedReq: 'RET-247',
    groundedChunkId: 'CHUNK-RET-0342',
    steps: [
      {
        step: 1,
        text: 'Place order with 2 items: $30 paid via card + $20 paid via gift-card credit.',
      },
      { step: 2, text: 'Initiate partial refund of 1 item ($25) within window.' },
    ],
    expected: '$5 returned to card, $20 returned to wallet; refund_split.gift_portion = 20.00.',
  },
  {
    id: 'TC-RET-0344',
    title: '',
    state: 'streaming',
    confidencePct: 0,
    confidenceTier: 'high',
    similarityPct: 0,
    similarityTier: 'distinct',
    groundedReq: 'RET-247',
    groundedChunkId: '',
    steps: [],
    expected: '',
  },
  {
    id: 'TC-RET-0345',
    title: '',
    state: 'queued',
    confidencePct: 0,
    confidenceTier: 'high',
    similarityPct: 0,
    similarityTier: 'distinct',
    groundedReq: 'RET-247',
    groundedChunkId: '',
    steps: [],
    expected: '',
  },
];

export const CANNED_ACTIVITY: ActivityEvent[] = [
  {
    id: 'a1',
    kind: 'composer-start',
    title: 'Composer v2.3 started generation',
    meta: '12:42:08 · target 5 cases',
    detail: 'Provider: A1-Groq (gpt-oss-120b) · grounded on RET-247 + 3 KB chunks',
  },
  {
    id: 'a2',
    kind: 'drafted',
    title: 'Drafted',
    tcId: 'TC-RET-0341',
    meta: '12:42:11 · 2.8s · 92% conf',
    detail: 'Curator dedup: 34% sim — distinct',
  },
  {
    id: 'a3',
    kind: 'accepted',
    title: 'Yogesh accepted',
    tcId: 'TC-RET-0341',
    meta: '12:42:31',
  },
  {
    id: 'a4',
    kind: 'drafted',
    title: 'Drafted',
    tcId: 'TC-RET-0342',
    meta: '12:42:14 · 3.1s · 87% conf',
    detail: 'Curator flagged dup vs TC-RET-0142 (87% sim)',
    detailTone: 'warn',
  },
  {
    id: 'a5',
    kind: 'drafted',
    title: 'Drafted',
    tcId: 'TC-RET-0343',
    meta: '12:42:18 · 2.4s · 81% conf',
  },
  {
    id: 'a6',
    kind: 'streaming',
    title: 'Composer generating',
    tcId: 'TC-RET-0344',
    meta: '12:42:21 · streaming…',
  },
];
