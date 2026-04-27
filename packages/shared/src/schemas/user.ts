// TB-002 users + TB-005 user_invitations.
import { z } from 'zod';
import { Uuid, Timestamp, UserRole, InvitationStatus, NonEmpty } from './enums.js';

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
  projectScopeJson: z.array(z.unknown()).optional(),
  expiresInHours: z
    .number()
    .int()
    .positive()
    .max(24 * 7)
    .default(24 * 7),
});
export type CreateInvitationInput = z.infer<typeof CreateInvitationInput>;
