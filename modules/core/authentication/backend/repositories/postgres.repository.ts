import type { Pool, QueryResult, QueryResultRow } from 'pg';
import type {
  AuthTokenPurpose,
  AuthTokenRecord,
  AuthUserRecord,
  ISODateString,
  SessionDeviceType,
  SessionRecord,
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

interface AuthUserRow {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  status: AuthUserRecord['status'];
  email_verified: boolean;
  failed_login_attempts: number;
  locked_until: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

interface SessionRow {
  id: string;
  user_id: string;
  refresh_token_hash: string;
  expires_at: Date | string;
  revoked_at: Date | string | null;
  ip_address: string | null;
  user_agent: string | null;
  device_type: SessionDeviceType;
  created_at: Date | string;
  updated_at: Date | string;
}

interface TokenRow {
  id: string;
  user_id: string;
  token_hash: string;
  purpose: AuthTokenPurpose;
  expires_at: Date | string;
  consumed_at: Date | string | null;
  invalidated_at: Date | string | null;
  created_at: Date | string;
}

const iso = (value: Date | string): ISODateString => new Date(value).toISOString();

const userColumns = `
  id, email, password_hash, first_name, last_name, status, email_verified,
  failed_login_attempts, locked_until, created_at, updated_at
`;

const mapUser = (row: AuthUserRow): AuthUserRecord => ({
  id: row.id,
  email: row.email,
  passwordHash: row.password_hash,
  firstName: row.first_name,
  lastName: row.last_name,
  status: row.status,
  emailVerified: row.email_verified,
  failedLoginAttempts: row.failed_login_attempts,
  lockedUntil: row.locked_until === null ? null : iso(row.locked_until),
  createdAt: iso(row.created_at),
  updatedAt: iso(row.updated_at),
});

const mapSession = (row: SessionRow): SessionRecord => ({
  id: row.id,
  userId: row.user_id,
  refreshTokenHash: row.refresh_token_hash,
  expiresAt: iso(row.expires_at),
  revokedAt: row.revoked_at === null ? null : iso(row.revoked_at),
  ...(row.ip_address === null ? {} : { ipAddress: row.ip_address }),
  ...(row.user_agent === null ? {} : { userAgent: row.user_agent }),
  deviceType: row.device_type,
  createdAt: iso(row.created_at),
  updatedAt: iso(row.updated_at),
});

const mapToken = (row: TokenRow): AuthTokenRecord => ({
  id: row.id,
  userId: row.user_id,
  tokenHash: row.token_hash,
  purpose: row.purpose,
  expiresAt: iso(row.expires_at),
  consumedAt: row.consumed_at === null ? null : iso(row.consumed_at),
  invalidatedAt: row.invalidated_at === null ? null : iso(row.invalidated_at),
  createdAt: iso(row.created_at),
});

const first = <T extends QueryResultRow>(result: QueryResult<T>): T | null => result.rows[0] ?? null;

const createUsersRepository = (pool: Pool): UserRepository => ({
  findByEmail: async (email) => {
    const result = await pool.query<AuthUserRow>(
      `SELECT ${userColumns} FROM users WHERE lower(email) = lower($1)`,
      [email.trim()],
    );
    const row = first(result);
    return row === null ? null : mapUser(row);
  },

  findById: async (id) => {
    const result = await pool.query<AuthUserRow>(`SELECT ${userColumns} FROM users WHERE id = $1`, [id]);
    const row = first(result);
    return row === null ? null : mapUser(row);
  },

  create: async (input: CreateUserInput) => {
    const result = await pool.query<AuthUserRow>(
      `INSERT INTO users
        (email, password_hash, first_name, last_name, status, email_verified, created_at, updated_at)
       VALUES (lower($1), $2, $3, $4, $5, $6, $7, $7)
       RETURNING ${userColumns}`,
      [
        input.email,
        input.passwordHash,
        input.firstName,
        input.lastName,
        input.status,
        input.emailVerified,
        input.now,
      ],
    );
    const row = first(result);
    if (row === null) {
      throw new Error('user insert returned no row');
    }
    return mapUser(row);
  },

  updatePassword: async (id, passwordHash, now) => {
    await pool.query(
      `UPDATE users SET password_hash = $1, updated_at = $2 WHERE id = $3`,
      [passwordHash, now, id],
    );
  },

  markEmailVerified: async (id, now) => {
    await pool.query(
      `UPDATE users SET email_verified = TRUE, updated_at = $1 WHERE id = $2`,
      [now, id],
    );
  },

  updateStatus: async (id, status, expectedStatus, now) => {
    const result = await pool.query(
      `UPDATE users SET status = $1, updated_at = $2
        WHERE id = $3 AND status = $4`,
      [status, now, id, expectedStatus],
    );
    return result.rowCount === 1;
  },

  registerFailedLogin: async (id, now, lockoutThreshold, lockoutDurationSeconds) => {
    await pool.query(
      `UPDATE users
          SET failed_login_attempts = failed_login_attempts + 1,
              locked_until = CASE
                WHEN failed_login_attempts + 1 >= $2
                THEN ($1::timestamptz + ($3 * INTERVAL '1 second'))
                ELSE locked_until
              END,
              updated_at = $1
        WHERE id = $4`,
      [now, lockoutThreshold, lockoutDurationSeconds, id],
    );
  },

  resetFailedLogins: async (id, now) => {
    await pool.query(
      `UPDATE users
          SET failed_login_attempts = 0, locked_until = NULL, updated_at = $1
        WHERE id = $2`,
      [now, id],
    );
  },
});

const createSessionsRepository = (pool: Pool): SessionRepository => ({
  create: async (input: CreateSessionInput) => {
    const result = await pool.query<SessionRow>(
      `INSERT INTO auth_sessions
        (id, user_id, refresh_token_hash, expires_at, ip_address, user_agent, device_type, created_at, updated_at)
       VALUES (COALESCE($1::uuid, gen_random_uuid()), $2, $3, $4, $5, $6, $7, $8, $8)
       RETURNING id, user_id, refresh_token_hash, expires_at, revoked_at, ip_address, user_agent, device_type, created_at, updated_at`,
      [
        input.id ?? null,
        input.userId,
        input.refreshTokenHash,
        input.expiresAt,
        input.ipAddress ?? null,
        input.userAgent ?? null,
        input.deviceType,
        input.now,
      ],
    );
    const row = first(result);
    if (row === null) {
      throw new Error('session insert returned no row');
    }
    return mapSession(row);
  },

  findById: async (id) => {
    const result = await pool.query<SessionRow>(
      `SELECT id, user_id, refresh_token_hash, expires_at, revoked_at, ip_address, user_agent, device_type, created_at, updated_at
         FROM auth_sessions WHERE id = $1`,
      [id],
    );
    const row = first(result);
    return row === null ? null : mapSession(row);
  },

  findByRefreshTokenHash: async (hash) => {
    const result = await pool.query<SessionRow>(
      `SELECT id, user_id, refresh_token_hash, expires_at, revoked_at, ip_address, user_agent, device_type, created_at, updated_at
         FROM auth_sessions WHERE refresh_token_hash = $1`,
      [hash],
    );
    const row = first(result);
    return row === null ? null : mapSession(row);
  },

  listByUser: async (userId) => {
    const result = await pool.query<SessionRow>(
      `SELECT id, user_id, refresh_token_hash, expires_at, revoked_at, ip_address, user_agent, device_type, created_at, updated_at
         FROM auth_sessions
        WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > NOW()
        ORDER BY created_at DESC`,
      [userId],
    );
    return result.rows.map(mapSession);
  },

  rotateRefreshToken: async (id, refreshTokenHash, expiresAt, now) => {
    await pool.query(
      `UPDATE auth_sessions SET refresh_token_hash = $1, expires_at = $2, updated_at = $3
        WHERE id = $4 AND revoked_at IS NULL`,
      [refreshTokenHash, expiresAt, now, id],
    );
  },

  revoke: async (id, now) => {
    const result = await pool.query(
      `UPDATE auth_sessions SET revoked_at = $1, updated_at = $1
        WHERE id = $2 AND revoked_at IS NULL`,
      [now, id],
    );
    return result.rowCount === 1;
  },

  revokeAllForUser: async (userId, now) => {
    const result = await pool.query(
      `UPDATE auth_sessions SET revoked_at = $1, updated_at = $1
        WHERE user_id = $2 AND revoked_at IS NULL`,
      [now, userId],
    );
    return result.rowCount ?? 0;
  },
});

const createTokensRepository = (pool: Pool): TokenRepository => ({
  create: async (input: CreateTokenInput) => {
    const result = await pool.query<TokenRow>(
      `INSERT INTO auth_tokens (user_id, token_hash, purpose, expires_at, created_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, token_hash, purpose, expires_at, consumed_at, invalidated_at, created_at`,
      [input.userId, input.tokenHash, input.purpose, input.expiresAt, input.now],
    );
    const row = first(result);
    if (row === null) {
      throw new Error('token insert returned no row');
    }
    return mapToken(row);
  },

  findByHash: async (hash, purpose) => {
    const result = await pool.query<TokenRow>(
      `SELECT id, user_id, token_hash, purpose, expires_at, consumed_at, invalidated_at, created_at
         FROM auth_tokens WHERE token_hash = $1 AND purpose = $2`,
      [hash, purpose],
    );
    const row = first(result);
    return row === null ? null : mapToken(row);
  },

  consume: async (id, now) => {
    const result = await pool.query(
      `UPDATE auth_tokens SET consumed_at = $1
        WHERE id = $2 AND consumed_at IS NULL AND invalidated_at IS NULL AND expires_at > $1`,
      [now, id],
    );
    return result.rowCount === 1;
  },

  invalidateAllForUser: async (userId, purpose, now) => {
    await pool.query(
      `UPDATE auth_tokens SET invalidated_at = $1
        WHERE user_id = $2 AND purpose = $3 AND consumed_at IS NULL AND invalidated_at IS NULL`,
      [now, userId, purpose],
    );
  },
});

/** PostgreSQL/Neon adapter shared by Authentication and User Management. */
export const createPostgresAuthRepositories = (pool: Pool): AuthRepositories => ({
  users: createUsersRepository(pool),
  sessions: createSessionsRepository(pool),
  tokens: createTokensRepository(pool),
});
