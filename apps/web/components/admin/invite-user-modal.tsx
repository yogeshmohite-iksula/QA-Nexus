// F27m1 Invite to QA Nexus modal · Pattern A interactive bulk-invite per Hard Rule 15.
//
// Flow: workspace banner + email chips (synced to per-invitee rows) + Apply-to-all
// role/projects controls + per-row Senior QA toggle + Remove + collapsible personal
// message + Resend usage callout + footer summary.
//
// State (Pattern A, no backend):
//   - invitees[] = single source of truth; email chips + .inv-list both render from it
//   - typing in chip-input + Enter/comma adds a new invitee with default role=engineer
//   - clicking a chip X or row X removes the invitee
//   - per-row Senior QA toggle (disabled for Lead = seniorNA)
//   - personal message expand/collapse + 0/500 char counter
//   - Apply-to-all bulk-sets role=engineer on every row
//
// All user-visible strings come from F27M1_* canned-data exports (Hard Rule 17).
// Canonical: PM1_UI_v2/Redesign Frame by claude design/F27m1 Invite User Modal v2.html

'use client';

import { useEffect, useMemo, useState } from 'react';

import './invite-user-modal.css';

import {
  F27M1_HEADER,
  F27M1_WORKSPACE,
  F27M1_EMAIL,
  F27M1_APPLYALL,
  F27M1_SENIOR,
  F27M1_PMSG,
  F27M1_RESEND,
  F27M1_FOOTER,
  F27M1_ROLES,
  F27M1_PROJECTS,
  F27M1_INITIAL_INVITEES,
  type F27M1Invitee,
  type F27M1Role,
} from '@/components/admin/invite-user-modal.canned-data';

// Which dropdown menu (if any) is open. Apply-to-all is global; row-role
// targets a specific invitee row by id.
type OpenMenu =
  | { kind: 'apply-role' }
  | { kind: 'apply-projects' }
  | { kind: 'row-role'; rowId: string }
  | null;

const roleLabelOf = (role: F27M1Role) =>
  F27M1_ROLES.find((r) => r.key === role)?.label ?? 'QA Engineer';

const initialOf = (email: string) => (email.trim()[0] ?? '?').toUpperCase();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface InviteUserModalProps {
  /** Cancel / close-X / backdrop click handler. UsersRolesWithModal wires this
   * to router.push('/admin/users') so the modal feels like an overlay. */
  onClose?: () => void;
}

export function InviteUserModal({ onClose }: InviteUserModalProps = {}) {
  const [invitees, setInvitees] = useState<F27M1Invitee[]>(() => [...F27M1_INITIAL_INVITEES]);
  const [draft, setDraft] = useState('');
  const [pmsgOpen, setPmsgOpen] = useState(false);
  const [pmsg, setPmsg] = useState('');

  // Apply-to-all selected values
  const [applyRole, setApplyRole] = useState<F27M1Role>('engineer');
  const [applyProjects, setApplyProjects] = useState<string[]>(['returns', 'commerce']);
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);

  // Close dropdown on outside click / Esc
  useEffect(() => {
    if (!openMenu) return;
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Element | null;
      if (t && !t.closest('.menu-wrap')) setOpenMenu(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenu(null);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [openMenu]);

  const isOpen = (m: OpenMenu) => {
    if (!openMenu || !m) return false;
    if (m.kind !== openMenu.kind) return false;
    if (m.kind === 'row-role' && openMenu.kind === 'row-role') return m.rowId === openMenu.rowId;
    return true;
  };

  function setRowRole(rowId: string, role: F27M1Role) {
    setInvitees((cur) =>
      cur.map((iv) =>
        iv.id === rowId
          ? {
              ...iv,
              role,
              seniorNA: role === 'lead' || role === 'stakeholder',
              seniorQa: role === 'lead' || role === 'stakeholder' ? false : iv.seniorQa,
              avatarColor: role === 'lead' ? 'lead' : role === 'stakeholder' ? 'stake' : 'eng',
            }
          : iv,
      ),
    );
    setOpenMenu(null);
  }

  function toggleApplyProject(key: string) {
    setApplyProjects((cur) => (cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]));
  }

  const applyProjectsLabel = (() => {
    if (applyProjects.length === 0) return 'No projects';
    return applyProjects.map((k) => F27M1_PROJECTS.find((p) => p.key === k)?.label ?? k).join(', ');
  })();

  function addInviteeFromDraft() {
    const next = draft
      .split(/[,\n;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!next.length) return;
    const fresh: F27M1Invitee[] = next.map((email, i) => ({
      id: `inv-new-${Date.now()}-${i}`,
      email,
      initial: initialOf(email),
      avatarColor: 'eng',
      role: 'engineer',
      projects: ['Returns'],
      seniorQa: false,
      seniorNA: false,
    }));
    setInvitees((cur) => [...cur, ...fresh]);
    setDraft('');
  }

  function removeInvitee(id: string) {
    setInvitees((cur) => cur.filter((iv) => iv.id !== id));
  }

  function toggleSenior(id: string) {
    setInvitees((cur) =>
      cur.map((iv) => (iv.id === id && !iv.seniorNA ? { ...iv, seniorQa: !iv.seniorQa } : iv)),
    );
  }

  function applyAllRoles() {
    const projectLabels = applyProjects
      .map((k) => F27M1_PROJECTS.find((p) => p.key === k)?.label)
      .filter(Boolean) as string[];
    const isLead = applyRole === 'lead';
    const isStake = applyRole === 'stakeholder';
    setInvitees((cur) =>
      cur.map((iv) => ({
        ...iv,
        role: applyRole,
        seniorNA: isLead || isStake,
        seniorQa: isLead || isStake ? false : iv.seniorQa,
        avatarColor: isLead ? 'lead' : isStake ? 'stake' : 'eng',
        projects: projectLabels.slice(0, 2),
        projectMore: Math.max(0, projectLabels.length - 2) || undefined,
      })),
    );
  }

  // Footer summary counts
  const summary = useMemo(() => {
    const engCount = invitees.filter((iv) => iv.role === 'engineer' || iv.role === 'senior').length;
    const leadCount = invitees.filter((iv) => iv.role === 'lead').length;
    const stakeCount = invitees.filter((iv) => iv.role === 'stakeholder').length;
    return { engCount, leadCount, stakeCount, total: invitees.length };
  }, [invitees]);

  const sumL1Parts: string[] = [];
  if (summary.engCount) sumL1Parts.push(`${summary.engCount} QA Engineers`);
  if (summary.leadCount) sumL1Parts.push(`${summary.leadCount} Lead`);
  if (summary.stakeCount) sumL1Parts.push(`${summary.stakeCount} Stakeholders`);

  const slotsRemaining = F27M1_WORKSPACE.slotsTotal - F27M1_WORKSPACE.slotsUsed - invitees.length;
  const slotsRemainingDisplay = Math.max(0, slotsRemaining);

  const draftValid = EMAIL_RE.test(draft.trim());

  return (
    <div className="f27m1-scrim">
      <div
        className="scrim"
        onClick={(e) => {
          // Backdrop click closes the modal. Only fire when the click is on
          // the scrim itself, not bubbled from inside the modal.
          if (e.target === e.currentTarget) onClose?.();
        }}
      >
        <div
          className="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="m27-ttl"
          data-screen-label="F27m1 Invite to QA Nexus"
        >
          <header className="m-head">
            <span className="ic">
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="9" cy="8" r="3.5" />
                <path d="M3 20a6 6 0 0 1 12 0M18 8v6M21 11h-6" />
              </svg>
            </span>
            <div className="ttl">
              <span className="t" id="m27-ttl">
                {F27M1_HEADER.title}
              </span>
              <span className="s">{F27M1_HEADER.subtitle}</span>
            </div>
            <button className="x" type="button" aria-label="Close" onClick={() => onClose?.()}>
              <svg
                width="15"
                height="15"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          </header>

          <div className="m-body">
            {/* Workspace banner */}
            <div className="ws-banner">
              <div className="l">
                <span className="cap">{F27M1_WORKSPACE.cap}</span>
                <span className="nm">{F27M1_WORKSPACE.name}</span>
              </div>
              <div className="r">
                {F27M1_WORKSPACE.rPrefix} <b className="pass">{slotsRemainingDisplay}</b>{' '}
                {F27M1_WORKSPACE.rSuffix} <b>{F27M1_WORKSPACE.slotsTotal}</b>{' '}
                {F27M1_WORKSPACE.rTail}
              </div>
            </div>

            {/* Email chips */}
            <div>
              <span className="flabel">
                {F27M1_EMAIL.label} <span className="req">*</span>
              </span>
              <div className="chip-input">
                {invitees.map((iv) => (
                  <span key={`chip-${iv.id}`} className="echip">
                    <span className={`av ${iv.avatarColor}`}>{iv.initial}</span>
                    <span className="em">{iv.email}</span>
                    <button
                      className="x"
                      type="button"
                      aria-label="Remove"
                      onClick={() => removeInvitee(iv.id)}
                    >
                      <svg
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                      >
                        <path d="M4 4l8 8M12 4l-8 8" />
                      </svg>
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder={F27M1_EMAIL.placeholder}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      if (draftValid) addInviteeFromDraft();
                    }
                  }}
                />
              </div>
              <div className="fhelp">{F27M1_EMAIL.helper}</div>
            </div>

            {/* Apply-to-all + per-invitee rows */}
            <div className="invite-box">
              <div className="applyall">
                <span className="cap">{F27M1_APPLYALL.cap}</span>

                {/* Role dropdown (apply-to-all) */}
                <span className="menu-wrap">
                  <button
                    className={
                      applyRole === 'lead'
                        ? 'sel'
                        : applyRole === 'stakeholder'
                          ? 'sel'
                          : 'sel role-eng'
                    }
                    type="button"
                    onClick={() =>
                      setOpenMenu(isOpen({ kind: 'apply-role' }) ? null : { kind: 'apply-role' })
                    }
                    aria-expanded={isOpen({ kind: 'apply-role' })}
                    aria-haspopup="menu"
                  >
                    {F27M1_ROLES.find((r) => r.key === applyRole)?.label ?? F27M1_APPLYALL.roleBtn}{' '}
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 6l4 4 4-4" strokeLinecap="round" />
                    </svg>
                  </button>
                  {isOpen({ kind: 'apply-role' }) && (
                    <div className="menu-pop" role="menu">
                      {F27M1_ROLES.map((r) => (
                        <button
                          key={r.key}
                          type="button"
                          className={applyRole === r.key ? 'opt selected' : 'opt'}
                          onClick={() => {
                            setApplyRole(r.key);
                            setOpenMenu(null);
                          }}
                          role="menuitemradio"
                          aria-checked={applyRole === r.key}
                        >
                          <span
                            className={
                              r.key === 'lead'
                                ? 'dot lead'
                                : r.key === 'stakeholder'
                                  ? 'dot stake'
                                  : 'dot eng'
                            }
                          />
                          {r.label}
                          <span className="check" style={{ marginLeft: 'auto' }}>
                            <svg
                              viewBox="0 0 16 16"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M3 8l3 3 7-7" />
                            </svg>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </span>

                {/* Projects multi-select dropdown */}
                <span className="menu-wrap">
                  <button
                    className="sel"
                    type="button"
                    onClick={() =>
                      setOpenMenu(
                        isOpen({ kind: 'apply-projects' }) ? null : { kind: 'apply-projects' },
                      )
                    }
                    aria-expanded={isOpen({ kind: 'apply-projects' })}
                    aria-haspopup="menu"
                  >
                    {applyProjectsLabel}{' '}
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 6l4 4 4-4" strokeLinecap="round" />
                    </svg>
                  </button>
                  {isOpen({ kind: 'apply-projects' }) && (
                    <div className="menu-pop" role="menu">
                      {F27M1_PROJECTS.map((p) => {
                        const sel = applyProjects.includes(p.key);
                        return (
                          <button
                            key={p.key}
                            type="button"
                            className={sel ? 'opt selected' : 'opt'}
                            onClick={() => toggleApplyProject(p.key)}
                            role="menuitemcheckbox"
                            aria-checked={sel}
                          >
                            {p.label}
                            <span className="check" style={{ marginLeft: 'auto' }}>
                              <svg
                                viewBox="0 0 16 16"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M3 8l3 3 7-7" />
                              </svg>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </span>

                <button className="go" type="button" onClick={applyAllRoles}>
                  <svg
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 8l3 3 7-7" />
                  </svg>
                  {F27M1_APPLYALL.goLabel(invitees.length)}
                </button>
              </div>

              <div className="inv-list">
                {invitees.map((iv) => {
                  // Role pill styling — eng/senior = teal, lead = violet,
                  // stakeholder = neutral overlay.
                  const roleCls =
                    iv.role === 'lead' ? 'lead' : iv.role === 'stakeholder' ? 'stake' : 'eng';
                  const avBg =
                    iv.role === 'lead'
                      ? 'var(--secondary)'
                      : iv.role === 'stakeholder'
                        ? 'var(--overlay)'
                        : 'var(--primary)';
                  return (
                    <div key={iv.id} className="inv-row">
                      <div className="inv-who">
                        <span className="av" style={{ background: avBg }}>
                          {iv.initial}
                        </span>
                        <span className="em">{iv.email}</span>
                      </div>
                      <span className="menu-wrap" style={{ width: '100%' }}>
                        <button
                          className={['rsel', roleCls].join(' ')}
                          type="button"
                          onClick={() =>
                            setOpenMenu(
                              isOpen({ kind: 'row-role', rowId: iv.id })
                                ? null
                                : { kind: 'row-role', rowId: iv.id },
                            )
                          }
                          aria-expanded={isOpen({ kind: 'row-role', rowId: iv.id })}
                          aria-haspopup="menu"
                        >
                          {roleLabelOf(iv.role)}{' '}
                          <svg
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M4 6l4 4 4-4" strokeLinecap="round" />
                          </svg>
                        </button>
                        {isOpen({ kind: 'row-role', rowId: iv.id }) && (
                          <div className="menu-pop" role="menu">
                            {F27M1_ROLES.map((r) => (
                              <button
                                key={r.key}
                                type="button"
                                className={iv.role === r.key ? 'opt selected' : 'opt'}
                                onClick={() => setRowRole(iv.id, r.key)}
                                role="menuitemradio"
                                aria-checked={iv.role === r.key}
                              >
                                <span
                                  className={
                                    r.key === 'lead'
                                      ? 'dot lead'
                                      : r.key === 'stakeholder'
                                        ? 'dot stake'
                                        : 'dot eng'
                                  }
                                />
                                {r.label}
                                <span className="check" style={{ marginLeft: 'auto' }}>
                                  <svg
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.4"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M3 8l3 3 7-7" />
                                  </svg>
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </span>
                      <div className="inv-proj">
                        {iv.projects.map((p) => (
                          <span key={p} className="pchip">
                            {p}
                          </span>
                        ))}
                        {iv.projectMore ? (
                          <span className="pchip more">+{iv.projectMore}</span>
                        ) : null}
                      </div>
                      <label
                        className={['snr', iv.seniorNA ? 'na' : ''].filter(Boolean).join(' ')}
                        onClick={(e) => {
                          if (!iv.seniorNA) {
                            e.preventDefault();
                            toggleSenior(iv.id);
                          }
                        }}
                      >
                        <span
                          className={['cb', iv.seniorQa && !iv.seniorNA ? 'on' : '']
                            .filter(Boolean)
                            .join(' ')}
                          style={iv.seniorNA ? { opacity: 0.4 } : undefined}
                        >
                          <svg
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                          >
                            <path d="M3 8l3 3 7-7" />
                          </svg>
                        </span>
                        {iv.seniorNA ? F27M1_SENIOR.naLabel : F27M1_SENIOR.label}
                      </label>
                      <button
                        className="inv-x"
                        type="button"
                        aria-label="Remove"
                        onClick={() => removeInvitee(iv.id)}
                      >
                        <svg
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        >
                          <path d="M4 4l8 8M12 4l-8 8" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Personal message collapsible */}
            <div className={['pmsg', pmsgOpen ? 'open' : ''].filter(Boolean).join(' ')}>
              <div
                className="pmsg-head"
                onClick={() => setPmsgOpen((v) => !v)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setPmsgOpen((v) => !v);
                  }
                }}
              >
                <span className="chev">
                  <svg
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 4l4 4-4 4" />
                  </svg>
                </span>
                <span className="lab">{F27M1_PMSG.label}</span>
                <span className="r">{F27M1_PMSG.rTag}</span>
              </div>
              <div className="pmsg-body">
                <textarea
                  placeholder={F27M1_PMSG.placeholder}
                  maxLength={F27M1_PMSG.charLimit}
                  value={pmsg}
                  onChange={(e) => setPmsg(e.target.value.slice(0, F27M1_PMSG.charLimit))}
                />
                <span className="ctr">
                  {pmsg.length} / {F27M1_PMSG.charLimit}
                </span>
              </div>
            </div>

            {/* Resend callout */}
            <div className="resend">
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8 1.5l1.9 4 4.4.5-3.3 3 .9 4.3L8 11.1 4.2 13.3l.9-4.3L1.8 6l4.4-.5z" />
              </svg>
              <span>
                {F27M1_RESEND.leadPart} · <b>{F27M1_RESEND.sent}</b> / <b>{F27M1_RESEND.total}</b>{' '}
                {F27M1_RESEND.emailsUsedThisMonth} · {F27M1_RESEND.budget}
              </span>
              <a href="#">{F27M1_RESEND.metricsLink}</a>
            </div>
          </div>

          <footer className="m-foot">
            <div className="sum">
              <span className="l1">
                {F27M1_FOOTER.sumL1Prefix} <b>{summary.total}</b> {F27M1_FOOTER.sumL1Invites}
                {sumL1Parts.length > 0 ? ` · ${sumL1Parts.join(', ')}` : ''}
              </span>
              <span className="l2">
                {F27M1_FOOTER.sumL2Prefix} <b>{F27M1_FOOTER.sumL2Days}</b> {F27M1_FOOTER.sumL2Tail}
              </span>
            </div>
            <div className="acts">
              <button className="btn-ghost" type="button" onClick={() => onClose?.()}>
                {F27M1_FOOTER.cancel}
              </button>
              <button className="btn-send" type="button" disabled={summary.total === 0}>
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 8l4 4 6-8" />
                </svg>
                {F27M1_FOOTER.send} <span className="badge">{summary.total}</span>{' '}
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 3l5 5-5 5" />
                </svg>
              </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
