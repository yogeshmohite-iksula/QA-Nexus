// TB-002 users + TB-005 user_invitations.
import { z } from 'zod';
import { Uuid, Timestamp, UserRole, InvitationStatus, NonEmpty } from './enums';

export const UserSchema = z.object({
  id: Uuid,
  workspaceId: Uuid,
  email: z.string().email(),
  displayName: NonEmpty,
  role: UserRole,
  organizationalLabel: z.string().nullable(),
  passwordHash: z.string(), // argon2id; never returned to clients
  activatedAt: Timestamp.nullable(),
  lastLoginAt: Timestamp.nullable(),
  createdAt: Timestamp,
});
export type User = z.infer<typeof UserSchema>;

/// Public user profile — strips passwordHash. Use this for any response that
/// includes user data.
export const UserPublicSchema = UserSchema.omit({ passwordHash: true });
export type UserPublic = z.infer<typeof UserPublicSchema>;

export const CreateUserInput = z.object({
  workspaceId: Uuid,
  email: z.string().email(),
  displayName: NonEmpty,
  role: UserRole,
  organizationalLabel: z.string().optional(),
  password: z.string().min(12), // hashed by service before insert
});
export type CreateUserInput = z.infer<typeof CreateUserInput>;

// ─────────────────────────────────────────────────────────────────────
// M1 Day-6 PM — Users management endpoints (F27 Admin tab).
// PM1_ERD §3.5. Status is DERIVED from User row fields, not a column:
//   - "disabled" if disabledAt IS NOT NULL
//   - "invited"  if activatedAt IS NULL  AND disabledAt IS NULL
//   - "active"   if activatedAt IS NOT NULL AND disabledAt IS NULL
// Schema columns disabledAt + roleChangedAt added in 0003 migration.
// ─────────────────────────────────────────────────────────────────────

export const UserStatus = z.enum(['active', 'invited', 'disabled']);
export type UserStatus = z.infer<typeof UserStatus>;

/// M1 — list-row projection. NEVER carries passwordHash, BetterAuth
/// session tokens, or any auth internals. `displayName` exposed as
/// `name` for FE ergonomics (matches F27 column header).
export const UserListItem = z.object({
  id: Uuid,
  email: z.string().email(),
  name: NonEmpty, // = displayName
  role: UserRole,
  status: UserStatus,
  createdAt: Timestamp,
  lastSeenAt: Timestamp.nullable(),
});
export type UserListItem = z.infer<typeof UserListItem>;

/// M1 — query params for GET /api/users.
/// Filters are AND-ed; missing = no filter on that field.
export const ListUsersQuery = z.object({
  /** Optional role filter. Admin/Lead only — service rejects from QAEng. */
  role: UserRole.optional(),
  /** Optional status filter. Open to all authed users. */
  status: UserStatus.optional(),
});
export type ListUsersQuery = z.infer<typeof ListUsersQuery>;

export const ListUsersResponse = z.object({
  ok: z.literal(true),
  users: z.array(UserListItem),
});
export type ListUsersResponse = z.infer<typeof ListUsersResponse>;

/// M1 — single-record fetch. Adds invitedByUserId + roleChangedAt
/// vs the list shape (extra context for the F27 detail drawer).
export const UserDetailItem = UserListItem.extend({
  invitedByUserId: Uuid.nullable(),
  roleChangedAt: Timestamp.nullable(),
});
export type UserDetailItem = z.infer<typeof UserDetailItem>;

export const UserDetailResponse = z.object({
  ok: z.literal(true),
  user: UserDetailItem,
});
export type UserDetailResponse = z.infer<typeof UserDetailResponse>;

/// M1 — PATCH /api/users/:id/role. Workspace-level role change only;
/// per-project overrides go through ProjectMembersController in Block 2.
/// Service-side guards: cannot change own role, cannot demote last Admin,
/// cannot change role of an invited (un-accepted) user.
export const ChangeUserRoleInput = z.object({
  userId: Uuid,
  newRole: UserRole,
});
export type ChangeUserRoleInput = z.infer<typeof ChangeUserRoleInput>;

export const ChangeUserRoleResponse = z.object({
  ok: z.literal(true),
  user: UserDetailItem,
});
export type ChangeUserRoleResponse = z.infer<typeof ChangeUserRoleResponse>;

/// M1 — PATCH /api/users/:id/status. Disable purges BetterAuth sessions.
/// Service-side guards: cannot disable self, cannot disable last Admin.
/// Re-enabling does NOT auto-create a session — user must magic-link in.
export const ChangeUserStatusInput = z.object({
  userId: Uuid,
  newStatus: z.enum(['active', 'disabled']), // 'invited' is system-set, not Admin-set
});
export type ChangeUserStatusInput = z.infer<typeof ChangeUserStatusInput>;

export const ChangeUserStatusResponse = z.object({
  ok: z.literal(true),
  user: UserDetailItem,
  /** Number of BetterAuth sessions purged (0 if user wasn't signed in). */
  sessionsRevoked: z.number().int().nonnegative(),
});
export type ChangeUserStatusResponse = z.infer<typeof ChangeUserStatusResponse>;

// TB-005 user_invitations
export const UserInvitationSchema = z.object({
  id: Uuid,
  workspaceId: Uuid,
  invitedEmail: z.string().email(),
  role: UserRole,
  projectScopeJson: z.array(z.unknown()).default([]),
  invitedBy: Uuid,
  tokenHash: z.string(),
  expiresAt: Timestamp,
  status: InvitationStatus,
  acceptedAt: Timestamp.nullable(),
  createdAt: Timestamp,
});
export type UserInvitation = z.infer<typeof UserInvitationSchema>;

export const CreateInvitationInput = z.object({
  invitedEmail: z.string().email(),
  role: UserRole,
  /** Optional list of project UUIDs the invitee should join on accept.
   *  Empty = workspace-wide (visible across all projects per workspace role).
   *  Each entry MUST match an existing project in the inviter's workspace —
   *  enforced at service layer. */
  projectScopeJson: z.array(Uuid).optional(),
  expiresInHours: z
    .number()
    .int()
    .positive()
    .max(24 * 7)
    .default(24 * 7),
});
export type CreateInvitationInput = z.infer<typeof CreateInvitationInput>;

/// M1 — public projection of an invitation. Used by GET /invitations
/// listings + the F27 Admin user-management UI. Strips tokenHash so the
/// secret never reaches the FE.
export const InvitationListItem = UserInvitationSchema.omit({
  tokenHash: true,
}).extend({
  /** Hint to the FE about the underlying invite link without exposing the
   *  hash. Always 32 chars (UUID prefix), purely for human ID/UI display. */
  shortRef: z.string().length(8),
});
export type InvitationListItem = z.infer<typeof InvitationListItem>;

/// M1 — accept payload. Token is the plaintext value from the magic-link URL;
/// service hashes it server-side and matches against UserInvitation.tokenHash.
/// No password field: BetterAuth's magic-link flow owns auth (per MS0-T021)
/// — this endpoint just provisions the TB-002 user row + binds it to the
/// workspace + project_scope; subsequent sign-in goes through /auth/sign-in.
export const AcceptInvitationInput = z.object({
  token: z.string().min(32).max(256),
  displayName: NonEmpty,
});
export type AcceptInvitationInput = z.infer<typeof AcceptInvitationInput>;

/// M1 — accept response. Returns the newly-created TB-002 user (sanitized,
/// no passwordHash) + a hint about the workspace context for redirect.
export const AcceptInvitationResponse = z.object({
  ok: z.literal(true),
  user: UserPublicSchema,
  workspaceId: Uuid,
});
export type AcceptInvitationResponse = z.infer<typeof AcceptInvitationResponse>;

/// M1 — detail response for GET /api/invitations/:id. Same shape as the
/// list item (no tokenHash, with shortRef) but returned as a single record.
/// Separate type alias keeps the controller signature self-documenting and
/// gives the FE a stable contract to evolve (e.g., add expanded inviter
/// metadata in a later milestone without touching the list payload).
export const InvitationDetailResponse = z.object({
  ok: z.literal(true),
  invitation: InvitationListItem,
});
export type InvitationDetailResponse = z.infer<typeof InvitationDetailResponse>;

/// M1 — resend payload for PATCH /api/invitations/:id/resend.
/// Regenerates the secret token (rotates the SHA-256 hash on the row),
/// extends expiry, and triggers a new magic-link email via Resend.
/// Idempotent in the sense that re-resending an already-revoked or
/// already-accepted invite is a 409, not a 500.
export const ResendInvitationInput = z.object({
  invitationId: Uuid,
  /** Optional override for the new expiry window. Default reuses the
   *  same lifetime the invitation was originally created with (server-
   *  side default = 7 days max). */
  expiresInHours: z
    .number()
    .int()
    .positive()
    .max(24 * 7)
    .optional(),
  /** Optional reason captured in the audit_log payload. */
  reason: z.string().max(500).optional(),
});
export type ResendInvitationInput = z.infer<typeof ResendInvitationInput>;

/// M1 — resend response. Returns the new plaintext token ONCE so the caller
/// (eventually EmailService.sendInvitationMagicLink) can rebuild the URL.
/// After this turn, only the new SHA-256 hash is persisted.
export const ResendInvitationResponse = z.object({
  ok: z.literal(true),
  invitationId: Uuid,
  /** Plaintext token — must NEVER be logged. */
  token: z.string().length(64),
  shortRef: z.string().length(8),
  expiresAt: Timestamp,
});
export type ResendInvitationResponse = z.infer<typeof ResendInvitationResponse>;

/// M1 — revoke payload (Admin / Lead). Idempotent: revoking an already-
/// revoked or accepted invite is a 409, not a 500.
export const RevokeInvitationInput = z.object({
  invitationId: Uuid,
  /** Optional human-readable reason captured in audit_log payload. */
  reason: z.string().max(500).optional(),
});
export type RevokeInvitationInput = z.infer<typeof RevokeInvitationInput>;
