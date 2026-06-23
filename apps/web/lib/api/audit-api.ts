// Audit API — GET /api/audit + /api/audit/verify-chain wire for F28 (Finding I).
//
// Hard Rule 11 verified against BE audit.controller.ts:
//   GET /api/audit              (Admin+Lead)  → { ok, items: AuditLogEntry[], nextCursor }
//   GET /api/audit/verify-chain (Admin only)  → VerifyChainResponse
// NOTE: the planning brief said "/api/audit-log" — that path 404s; /api/audit
// is the real controller route (same brief-path drift class as the 33rd RC).
//
// Shapes come from @qa-nexus/shared (Rule 10): ListAuditResponse,
// VerifyChainResponse, AuditLogEntry. Fetches ride fetchWithFallback with a
// null fallback → F28 falls back to its canned fixture when the API is
// unreachable (dev offline) per the Option-B convention, with console.warn.
//
// auditEntryToRow adapts the API row → the F28AuditRow DISPLAY shape the
// canonical F28 table renders (Rule 15: canonical layout untouched; only the
// data source changes).

import {
  AuditLogEntry,
  ListAuditResponse,
  VerifyChainResponse,
  type AuditLogEntry as AuditLogEntryT,
  type ListAuditResponse as ListAuditResponseT,
  type VerifyChainResponse as VerifyChainResponseT,
} from '@qa-nexus/shared';

import type { F28AuditRow } from '@/components/admin/settings-audit-page.canned-data';
import { fetchWithFallback } from './fetch-with-fallback';

void AuditLogEntry; // schema retained for consumers needing row-level parse

/** First page of the audit log (BE max limit 200 — covers the ~160-row pilot
 *  dataset in one fetch; cursor-chunked load lands M2). Null = fetch failed. */
export async function fetchAuditEntries(limit = 200): Promise<ListAuditResponseT | null> {
  return fetchWithFallback<ListAuditResponseT | null>(`/api/audit?limit=${limit}`, null, {
    schema: ListAuditResponse,
    label: 'F28 audit list',
  });
}

/** Whole-chain HMAC verification (Admin-only). Null = fetch failed / 403. */
export async function fetchVerifyChain(): Promise<VerifyChainResponseT | null> {
  return fetchWithFallback<VerifyChainResponseT | null>('/api/audit/verify-chain', null, {
    schema: VerifyChainResponse,
    label: 'F28 verify-chain',
  });
}

/** Action string → canonical F28 act-badge class (visual tone only). */
function actClassOf(action: string): string {
  const a = action.toLowerCase();
  if (a.includes('invit')) return 'invite';
  if (a.includes('generat')) return 'generate';
  if (a.includes('approv')) return 'approve';
  if (a.includes('dedup')) return 'dedup';
  if (a.includes('archiv')) return 'archive';
  if (a.includes('auth') && (a.includes('fail') || a.includes('denied'))) return 'authfail';
  if (a.includes('export')) return 'export';
  if (a.includes('config') || a.includes('provider') || a.includes('llm')) return 'config';
  if (a.includes('creat') || a.includes('seed')) return 'create';
  if (a.includes('warn')) return 'warn';
  return 'update';
}

const ACT_LABEL: Record<string, string> = {
  invite: 'Invite',
  generate: 'Generate',
  approve: 'Approve',
  dedup: 'De-dup',
  archive: 'Archive',
  authfail: 'Auth fail',
  export: 'Export',
  config: 'Configure',
  create: 'Create',
  warn: 'Warn',
  update: 'Update',
};

/** Compact payload summary: first 3 top-level entries as `key: value`. */
function summarizePayload(payload: Record<string, unknown>): string {
  const parts = Object.entries(payload)
    .slice(0, 3)
    .map(([k, v]) => {
      const val = typeof v === 'string' ? v : JSON.stringify(v);
      return `${k}: ${val.length > 48 ? `${val.slice(0, 47)}…` : val}`;
    });
  return parts.length > 0 ? parts.join(' · ') : '—';
}

/** Action prefix → agent code (F08a EVIDENCE_THREAD + F27 activity feed).
 *  Returns null when the action doesn't match an agent. */
export function agentOfAction(action: string): 'A1' | 'A2' | 'A4' | null {
  const a = action.toLowerCase();
  if (a.startsWith('composer.') || a.startsWith('a1.')) return 'A1';
  if (a.startsWith('curator.') || a.startsWith('a2.')) return 'A2';
  if (a.startsWith('sherlock.') || a.startsWith('a4.')) return 'A4';
  return null;
}

/** Relative freshness for /home EVIDENCE_THREAD / F27 activity: "Xm ago" /
 *  "Xh ago" / "Xd ago" / "Just now". Audit `ts` is ISO-8601. */
export function relativeFreshness(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return 'Just now';
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return 'Just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  return `${days}d ago`;
}

/** F27 "Recent activity" display shape (single-line entries). */
export interface F27ActivityRow {
  tone: 'violet' | 'pass' | 'warn' | 'fail' | 'info' | 'plain';
  actor: string;
  action: string;
  target: string;
  detail: string;
  date: string;
  time: string;
  eventType: string;
}

const TONE_BY_ACT: Record<string, F27ActivityRow['tone']> = {
  invite: 'violet',
  approve: 'pass',
  create: 'pass',
  generate: 'violet',
  dedup: 'violet',
  config: 'warn',
  warn: 'warn',
  archive: 'fail',
  authfail: 'fail',
  update: 'info',
  export: 'plain',
};

/** Audit row → F27 activity row (broad: every audit event renders). */
export function auditEntryToActivity(e: AuditLogEntryT): F27ActivityRow {
  const act = actClassOf(e.action);
  const d = new Date(e.ts);
  const iso = Number.isNaN(d.getTime()) ? e.ts : d.toISOString();
  const payload = e.payload ?? {};
  const targetRaw = payload['invitedEmail'] ?? payload['target'] ?? payload['email'];
  return {
    tone: TONE_BY_ACT[act] ?? 'plain',
    actor: e.actorEmail ? e.actorEmail.split('@')[0] : 'System',
    action: (ACT_LABEL[act] ?? 'Update').toLowerCase(),
    target: typeof targetRaw === 'string' ? targetRaw : e.entity.replace(/_/g, ' '),
    detail: e.entity ? `entity ${e.entity}` : '',
    date: iso.slice(0, 10),
    time: iso.slice(11, 16),
    eventType: e.action,
  };
}

/** API audit row → F28 canonical display row. */
export function auditEntryToRow(e: AuditLogEntryT): F28AuditRow {
  const act = actClassOf(e.action);
  const date = new Date(e.ts);
  const ts = Number.isNaN(date.getTime())
    ? e.ts
    : `${date.toISOString().slice(0, 10)} ${date.toISOString().slice(11, 19)} UTC`;
  const payload = e.payload ?? {};
  const projectRaw = payload['projectKey'] ?? payload['project'] ?? payload['projectName'];
  return {
    ts,
    actor: e.actorEmail ? e.actorEmail.split('@')[0] : 'System',
    kind: e.actorEmail ? 'human' : 'system',
    act,
    action: ACT_LABEL[act] ?? 'Update',
    target: e.entityId ? `${e.entity}:${e.entityId.slice(0, 8)}` : e.entity,
    targetTone: 'primary',
    targetSub: e.entity,
    project: typeof projectRaw === 'string' ? projectRaw : '—',
    details: summarizePayload(payload),
    detailsBold: [],
    hash: `sha256:${e.thisHash.slice(0, 4)}…${e.thisHash.slice(-4)}`,
  };
}
