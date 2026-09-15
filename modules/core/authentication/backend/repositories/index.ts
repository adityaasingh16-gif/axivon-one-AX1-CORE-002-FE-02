/**
 * AXIVON ONE — Authentication Module (CORE-001)
 * Data access contracts.
 *
 * `05-SYSTEM-ARCHITECTURE.md` §16 places Data Access below the domain layer so
 * business rules stay unit-testable without a database. These interfaces are
 * the boundary: the service layer never issues SQL, so PostgreSQL (migration
 * `002_create_auth_tables.sql`) or any other store can be substituted.
 *
 * Tenant note: `06-DATABASE-ARCHITECTURE.md` §7 marks Sessions and Users as
 * NOT tenant-scoped (org association lives in Membership), so these
 * repositories intentionally take no `organizationId`.
 */

import type {
  AuthTokenPurpose,
  AuthTokenRecord,
  AuthUserRecord,
  ISODateString,
  SessionRecord,
  UUID,
} from '../contracts/index.js';

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  status: AuthUserRecord['status'];
  emailVerified: boolean;
  now: ISODateString;
}

export interface UserRepository {
  findByEmail(email: string): Promise<AuthUserRecord | null>;
  findById(id: UUID): Promise<AuthUserRecord | null>;
  create(input: CreateUserInput): Promise<AuthUserRecord>;
  updatePassword(id: UUID, passwordHash: string, now: ISODateString): Promise<void>;
  markEmailVerified(id: UUID, now: ISODateString): Promise<void>;
  /**
   * Transitions account status. Used when email verification activates a
   * `pending` account. Callers must pass an explicit `expectedStatus` so a
   * suspended account cannot be reactivated by a stale verification token.
   */
  updateStatus(
    id: UUID,
    status: AuthUserRecord['status'],
    expectedStatus: AuthUserRecord['status'],
    now: ISODateString,
  ): Promise<boolean>;
  /**
   * Records a failed login. Implementations must also set `lockedUntil` when
   * `failedLoginAttempts` reaches the lockout threshold.
   */
  registerFailedLogin(
    id: UUID,
    now: ISODateString,
    lockoutThreshold: number,
    lockoutDurationSeconds: number,
  ): Promise<void>;
  /** Clears the counter and any lockout after a successful login. */
  resetFailedLogins(id: UUID, now: ISODateString): Promise<void>;
}

export interface CreateSessionInput {
  /** Optional caller-generated id, used to bind the token claims before insert. */
  id?: UUID;
  userId: UUID;
  refreshTokenHash: string;
  expiresAt: ISODateString;
  ipAddress?: string;
  userAgent?: string;
  deviceType: SessionRecord['deviceType'];
  now: ISODateString;
}

export interface SessionRepository {
  create(input: CreateSessionInput): Promise<SessionRecord>;
  findById(id: UUID): Promise<SessionRecord | null>;
  findByRefreshTokenHash(hash: string): Promise<SessionRecord | null>;
  listByUser(userId: UUID): Promise<SessionRecord[]>;
  rotateRefreshToken(id: UUID, refreshTokenHash: string, expiresAt: ISODateString, now: ISODateString): Promise<void>;
  /** Returns `true` only when this call changed an active session to revoked. */
  revoke(id: UUID, now: ISODateString): Promise<boolean>;
  revokeAllForUser(userId: UUID, now: ISODateString): Promise<number>;
}

export interface CreateTokenInput {
  userId: UUID;
  tokenHash: string;
  purpose: AuthTokenPurpose;
  expiresAt: ISODateString;
  now: ISODateString;
}

export interface TokenRepository {
  create(input: CreateTokenInput): Promise<AuthTokenRecord>;
  /** Looked up by hash — the raw token never reaches the data layer. */
  findByHash(hash: string, purpose: AuthTokenPurpose): Promise<AuthTokenRecord | null>;
  /**
   * Single-use enforcement. Must be atomic in a real store
   * (`UPDATE ... WHERE consumed_at IS NULL RETURNING id`) so a token cannot be
   * redeemed twice under concurrency.
   * @returns `true` when this caller is the one that consumed it.
   */
  consume(id: UUID, now: ISODateString): Promise<boolean>;
  /** Invalidates outstanding tokens for a purpose, e.g. on a new reset request. */
  invalidateAllForUser(userId: UUID, purpose: AuthTokenPurpose, now: ISODateString): Promise<void>;
}

export interface AuthRepositories {
  users: UserRepository;
  sessions: SessionRepository;
  tokens: TokenRepository;
}
