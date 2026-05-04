// QA Nexus PM1 — Shared user schema parse/reject tests.
//
// Pins the FE-facing Zod shapes added in Day-8 Part A:
//   - UserListResponse        (with optional pagination envelope)
//   - UserCreateRequest       (F27 Admin invite form)
//   - UserUpdateRequest       (partial role | disabledAt; refine: at least one)
//   - InvitationCreateResult  (matches what InvitationsService.create returns)
//   - UserInviteResponse      (POST /api/invitations success body)
//
// Why here (apps/api) and not packages/shared: packages/shared has no jest
// runner — `pnpm --filter @qa-nexus/shared test` is a no-op shim. The
// schemas live in @qa-nexus/shared but their tests live next to the
// domain that owns them (M1 users), matching the existing pattern for
// invitation + KB schemas.

import {
  UserListResponse,
  PaginationMeta,
  UserCreateRequest,
  UserUpdateRequest,
  InvitationCreateResult,
  UserInviteResponse,
  UserListItem,
} from '@qa-nexus/shared';

const VALID_UUID = '11111111-2222-3333-4444-555555555555';
const VALID_TS = '2026-05-04T12:00:00.000Z';
const HEX64 = 'a'.repeat(64);
const HEX8 = 'a'.repeat(8);

const validUserItem: Record<string, unknown> = {
  id: VALID_UUID,
  email: 'kishor.kadam@iksula.com',
  name: 'Kishor Kadam',
  role: 'QAEngineer',
  status: 'active',
  createdAt: VALID_TS,
  lastSeenAt: VALID_TS,
};

describe('packages/shared — Day-8 Part A user schemas', () => {
  describe('UserListResponse', () => {
    it('parses a valid response without pagination (M1 pilot default)', () => {
      const result = UserListResponse.parse({
        ok: true,
        users: [validUserItem],
      });
      expect(result.users).toHaveLength(1);
      expect(result.pagination).toBeUndefined();
    });

    it('parses a valid response WITH pagination metadata', () => {
      const result = UserListResponse.parse({
        ok: true,
        users: [validUserItem],
        pagination: { total: 8, page: 1, pageSize: 25 },
      });
      expect(result.pagination).toEqual({ total: 8, page: 1, pageSize: 25 });
    });

    it('rejects when ok is false', () => {
      expect(() => UserListResponse.parse({ ok: false, users: [] })).toThrow();
    });

    it('rejects when users contains an invalid record', () => {
      expect(() =>
        UserListResponse.parse({
          ok: true,
          users: [{ ...validUserItem, email: 'not-an-email' }],
        }),
      ).toThrow();
    });

    it('rejects pagination with pageSize > 200 (server hard cap)', () => {
      expect(() =>
        UserListResponse.parse({
          ok: true,
          users: [],
          pagination: { total: 500, page: 1, pageSize: 9999 },
        }),
      ).toThrow();
    });
  });

  describe('PaginationMeta', () => {
    it('rejects negative total', () => {
      expect(() =>
        PaginationMeta.parse({ total: -1, page: 1, pageSize: 25 }),
      ).toThrow();
    });

    it('rejects zero page (1-indexed)', () => {
      expect(() =>
        PaginationMeta.parse({ total: 8, page: 0, pageSize: 25 }),
      ).toThrow();
    });

    it('rejects non-integer pageSize', () => {
      expect(() =>
        PaginationMeta.parse({ total: 8, page: 1, pageSize: 25.5 }),
      ).toThrow();
    });
  });

  describe('UserCreateRequest', () => {
    it('parses a valid F27 invite form payload', () => {
      const result = UserCreateRequest.parse({
        email: 'nadim.siddiqui@iksula.com',
        name: 'Nadim Siddiqui',
        role: 'QAEngineer',
      });
      expect(result.email).toBe('nadim.siddiqui@iksula.com');
    });

    it('rejects invalid email', () => {
      expect(() =>
        UserCreateRequest.parse({
          email: 'nadim',
          name: 'Nadim',
          role: 'QAEngineer',
        }),
      ).toThrow();
    });

    it('rejects empty name (NonEmpty)', () => {
      expect(() =>
        UserCreateRequest.parse({
          email: 'nadim.siddiqui@iksula.com',
          name: '',
          role: 'QAEngineer',
        }),
      ).toThrow();
    });

    it('rejects unknown role', () => {
      expect(() =>
        UserCreateRequest.parse({
          email: 'nadim.siddiqui@iksula.com',
          name: 'Nadim',
          role: 'SuperUser',
        }),
      ).toThrow();
    });
  });

  describe('UserUpdateRequest', () => {
    it('parses a role-only update', () => {
      const result = UserUpdateRequest.parse({ role: 'Lead' });
      expect(result.role).toBe('Lead');
      expect(result.disabledAt).toBeUndefined();
    });

    it('parses a disable update (disabledAt set)', () => {
      const result = UserUpdateRequest.parse({ disabledAt: VALID_TS });
      expect(result.disabledAt).toBe(VALID_TS);
    });

    it('parses a re-enable update (disabledAt: null)', () => {
      const result = UserUpdateRequest.parse({ disabledAt: null });
      expect(result.disabledAt).toBeNull();
    });

    it('parses both role + disabledAt set', () => {
      const result = UserUpdateRequest.parse({
        role: 'Admin',
        disabledAt: null,
      });
      expect(result.role).toBe('Admin');
      expect(result.disabledAt).toBeNull();
    });

    it('rejects empty body (refine guard)', () => {
      expect(() => UserUpdateRequest.parse({})).toThrow(
        /at least one of `role` or `disabledAt`/,
      );
    });

    it('rejects unknown role value', () => {
      expect(() => UserUpdateRequest.parse({ role: 'Wizard' })).toThrow();
    });
  });

  describe('InvitationCreateResult', () => {
    const valid = {
      id: VALID_UUID,
      invitedEmail: 'govind.daware@iksula.com',
      token: HEX64,
      shortRef: HEX8,
      expiresAt: VALID_TS,
    };

    it('parses a valid invitation create result', () => {
      const result = InvitationCreateResult.parse(valid);
      expect(result.token).toHaveLength(64);
      expect(result.shortRef).toHaveLength(8);
    });

    it('rejects token of wrong length (security guard — must be 64 hex chars)', () => {
      expect(() =>
        InvitationCreateResult.parse({ ...valid, token: 'short' }),
      ).toThrow();
    });

    it('rejects shortRef of wrong length', () => {
      expect(() =>
        InvitationCreateResult.parse({ ...valid, shortRef: 'too-long-x' }),
      ).toThrow();
    });

    it('rejects non-UUID id', () => {
      expect(() =>
        InvitationCreateResult.parse({ ...valid, id: 'not-a-uuid' }),
      ).toThrow();
    });
  });

  describe('UserInviteResponse', () => {
    it('parses the canonical POST /api/invitations success body', () => {
      const body = {
        ok: true,
        invitation: {
          id: VALID_UUID,
          invitedEmail: 'mohanraj.k@iksula.com',
          token: HEX64,
          shortRef: HEX8,
          expiresAt: VALID_TS,
        },
      };
      const result = UserInviteResponse.parse(body);
      expect(result.invitation.token).toBe(HEX64);
    });

    it('rejects when ok is false', () => {
      expect(() =>
        UserInviteResponse.parse({
          ok: false,
          invitation: {
            id: VALID_UUID,
            invitedEmail: 'mohanraj.k@iksula.com',
            token: HEX64,
            shortRef: HEX8,
            expiresAt: VALID_TS,
          },
        }),
      ).toThrow();
    });

    it('rejects when invitation is missing required fields', () => {
      expect(() =>
        UserInviteResponse.parse({
          ok: true,
          invitation: { id: VALID_UUID },
        }),
      ).toThrow();
    });
  });

  describe('UserListItem (sanity — referenced by UserListResponse)', () => {
    it('still parses the canonical M1 list-row shape', () => {
      const result = UserListItem.parse(validUserItem);
      expect(result.role).toBe('QAEngineer');
    });

    it('rejects passwordHash leakage (column not in shape)', () => {
      const polluted = { ...validUserItem, passwordHash: 'argon2id$...' };
      const result = UserListItem.parse(polluted);
      expect(result).not.toHaveProperty('passwordHash');
    });
  });
});
