/**
 * AXIVON ONE — Authentication Module (CORE-001)
 * In-memory repository implementations.
 *
 * Purpose: run and test every auth flow before a database driver is chosen
 * (the store technology is `TBD`, `06-DATABASE-ARCHITECTURE.md` §4) and to give
 * the unit tests a deterministic double.
 *
 * This is NOT production storage. The SQL contract for the real store is
 * `database/migrations/002_create_auth_tables.sql`; mapping notes per method are
 * in `docs/api/authentication.md` §6.
 */

import { randomUUID } from 'node:crypto';
import type {
  AuthTokenPurpose,
  AuthTokenRecord,
  AuthUserRecord,
  ISODateString,
  SessionRecord,
  UUID,
} from '../contracts/index.js';
import type {
  AuthRepositories,
  CreateSessionInput,
  CreateTokenInput,
  CreateUserInput,
  SessionRepository,
  TokenRepository,
  UserRepository,
} from './index.js';

export const createInMemoryUserRepository = (): UserRepository => {
  const rows = new Map<UUID, AuthUserRecord>();

  return {
    findByEmail: async (email: string) => {
      const needle = email.trim().toLowerCase();
      for (const row of rows.values()) {
        if (row.email === needle) {
          return { ...row };
        }
      }
      return null;
    },

    findById: async (id: UUID) => {
      const row = rows.get(id);
      return row === undefined ? null : { ...row };
    },

    create: async (input: CreateUserInput) => {
      const record: AuthUserRecord = {
        id: randomUUID(),
        email: input.email.trim().toLowerCase(),
        passwordHash: input.passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        status: input.status,
        emailVerified: input.emailVerified,
        failedLoginAttempts: 0,
        lockedUntil: null,
        createdAt: input.now,
        updatedAt: input.now,
      };
      rows.set(record.id, record);
      return { ...record };
    },

    updatePassword: async (id: UUID, passwordHash: string, now: ISODateString) => {
      const row = rows.get(id);
      if (row === undefined) {
        return;
      }
      row.passwordHash = passwordHash;
      row.updatedAt = now;
    },

    markEmailVerified: async (id: UUID, now: ISODateString) => {
      const row = rows.get(id);
      if (row === undefined) {
        return;
      }
      row.emailVerified = true;
      row.updatedAt = now;
    },

    updateStatus: async (
      id: UUID,
      status: AuthUserRecord['status'],
      expectedStatus: AuthUserRecord['status'],
      now: ISODateString,
    ) => {
      const row = rows.get(id);
      if (row === undefined || row.status !== expectedStatus) {
        return false;
      }
      row.status = status;
      row.updatedAt = now;
      return true;
    },

    registerFailedLogin: async (
      id: UUID,
      now: ISODateString,
      lockoutThreshold: number,
      lockoutDurationSeconds: number,
    ) => {
      const row = rows.get(id);
      if (row === undefined) {
        return;
      }
      row.failedLoginAttempts += 1;
      if (row.failedLoginAttempts >= lockoutThreshold) {
        row.lockedUntil = new Date(new Date(now).getTime() + lockoutDurationSeconds * 1000).toISOString();
      }
      row.updatedAt = now;
    },

    resetFailedLogins: async (id: UUID, now: ISODateString) => {
      const row = rows.get(id);
      if (row === undefined) {
        return;
      }
      row.failedLoginAttempts = 0;
      row.lockedUntil = null;
      row.updatedAt = now;
    },
  };
};

export const createInMemorySessionRepository = (): SessionRepository => {
  const rows = new Map<UUID, SessionRecord>();

  return {
    create: async (input: CreateSessionInput) => {
      const record: SessionRecord = {
        id: input.id ?? randomUUID(),
        userId: input.userId,
        refreshTokenHash: input.refreshTokenHash,
        expiresAt: input.expiresAt,
        revokedAt: null,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        deviceType: input.deviceType,
        createdAt: input.now,
        updatedAt: input.now,
      };
      rows.set(record.id, record);
      return { ...record };
    },

    findById: async (id: UUID) => {
      const row = rows.get(id);
      return row === undefined ? null : { ...row };
    },

    findByRefreshTokenHash: async (hash: string) => {
      for (const row of rows.values()) {
        if (row.refreshTokenHash === hash) {
          return { ...row };
        }
      }
      return null;
    },

    listByUser: async (userId: UUID) => {
      const matches: SessionRecord[] = [];
      for (const row of rows.values()) {
        if (row.userId === userId) {
          matches.push({ ...row });
        }
      }
      return matches;
    },

    rotateRefreshToken: async (
      id: UUID,
      refreshTokenHash: string,
      expiresAt: ISODateString,
      now: ISODateString,
    ) => {
      const row = rows.get(id);
      if (row === undefined) {
        return;
      }
      row.refreshTokenHash = refreshTokenHash;
      row.expiresAt = expiresAt;
      row.updatedAt = now;
    },

    revoke: async (id: UUID, now: ISODateString) => {
      const row = rows.get(id);
      if (row === undefined || row.revokedAt !== null) {
        return false;
      }
      row.revokedAt = now;
      row.updatedAt = now;
      return true;
    },

    revokeAllForUser: async (userId: UUID, now: ISODateString) => {
      let revoked = 0;
      for (const row of rows.values()) {
        if (row.userId === userId && row.revokedAt === null) {
          row.revokedAt = now;
          row.updatedAt = now;
          revoked += 1;
        }
      }
      return revoked;
    },
  };
};

export const createInMemoryTokenRepository = (): TokenRepository => {
  const rows = new Map<UUID, AuthTokenRecord>();

  return {
    create: async (input: CreateTokenInput) => {
      const record: AuthTokenRecord = {
        id: randomUUID(),
        userId: input.userId,
        tokenHash: input.tokenHash,
        purpose: input.purpose,
        expiresAt: input.expiresAt,
        consumedAt: null,
        invalidatedAt: null,
        createdAt: input.now,
      };
      rows.set(record.id, record);
      return { ...record };
    },

    findByHash: async (hash: string, purpose: AuthTokenPurpose) => {
      for (const row of rows.values()) {
        if (row.tokenHash === hash && row.purpose === purpose) {
          return { ...row };
        }
      }
      return null;
    },

    consume: async (id: UUID, now: ISODateString) => {
      const row = rows.get(id);
      if (row === undefined || row.consumedAt !== null || row.invalidatedAt !== null) {
        return false;
      }
      row.consumedAt = now;
      return true;
    },

    invalidateAllForUser: async (userId: UUID, purpose: AuthTokenPurpose, now: ISODateString) => {
      for (const row of rows.values()) {
        if (
          row.userId === userId &&
          row.purpose === purpose &&
          row.consumedAt === null &&
          row.invalidatedAt === null
        ) {
          row.invalidatedAt = now;
        }
      }
    },
  };
};

export const createInMemoryAuthRepositories = (): AuthRepositories => ({
  users: createInMemoryUserRepository(),
  sessions: createInMemorySessionRepository(),
  tokens: createInMemoryTokenRepository(),
});
