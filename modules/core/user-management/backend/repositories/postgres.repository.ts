import type { Pool, PoolClient, QueryResult } from 'pg';
import {
  emailAlreadyExists,
  membershipAlreadyExists,
} from '../contracts/errors.js';
import type {
  AddMembershipInput,
  MembershipStatus,
  UserListResult,
  UserMembership,
  UserStatus,
  UUID,
} from '../contracts/index.js';
import type { CreateUserRecord, UserRecord, UserRepository } from './index.js';

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  avatar_url: string | null;
  status: UserStatus;
  email_verified: boolean;
  created_at: Date | string;
  updated_at: Date | string;
  total_count?: string | number;
}

interface MembershipRow {
  id: string;
  user_id: string;
  organization_id: string;
  role: string;
  status: MembershipStatus;
  created_at: Date | string;
  updated_at: Date | string;
}

type QueryRunner = Pick<Pool, 'query'> | Pick<PoolClient, 'query'>;

const iso = (value: Date | string): string => new Date(value).toISOString();

const mapMembership = (row: MembershipRow): UserMembership => ({
  id: row.id,
  userId: row.user_id,
  organizationId: row.organization_id,
  role: row.role,
  status: row.status,
  createdAt: iso(row.created_at),
  updatedAt: iso(row.updated_at),
});

const mapUser = (row: UserRow, memberships: UserMembership[]): UserRecord => ({
  id: row.id,
  email: row.email,
  passwordHash: row.password_hash,
  firstName: row.first_name,
  lastName: row.last_name,
  phone: row.phone,
  avatarUrl: row.avatar_url,
  status: row.status,
  emailVerified: row.email_verified,
  createdAt: iso(row.created_at),
  updatedAt: iso(row.updated_at),
  memberships,
});

const userColumns = `
  id, email, password_hash, first_name, last_name, phone, avatar_url,
  status, email_verified, created_at, updated_at
`;

const membershipsFor = async (runner: QueryRunner, userIds: UUID[]): Promise<Map<UUID, UserMembership[]>> => {
  const result = new Map<UUID, UserMembership[]>();
  if (userIds.length === 0) {
    return result;
  }
  const rows = await runner.query<MembershipRow>(
    `SELECT id, user_id, organization_id, role, status, created_at, updated_at
       FROM user_memberships
      WHERE user_id = ANY($1::uuid[])
      ORDER BY created_at ASC`,
    [userIds],
  );
  for (const row of rows.rows) {
    const list = result.get(row.user_id) ?? [];
    list.push(mapMembership(row));
    result.set(row.user_id, list);
  }
  return result;
};

const userFromQuery = async (runner: QueryRunner, result: QueryResult<UserRow>): Promise<UserRecord | null> => {
  const row = result.rows[0];
  if (row === undefined) {
    return null;
  }
  const memberships = await membershipsFor(runner, [row.id]);
  return mapUser(row, memberships.get(row.id) ?? []);
};

const isUniqueViolation = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';

export const createPostgresUserRepository = (pool: Pool): UserRepository => ({
  findById: async (id): Promise<UserRecord | null> => {
    const result = await pool.query<UserRow>(
      `SELECT ${userColumns} FROM users WHERE id = $1`,
      [id],
    );
    return userFromQuery(pool, result);
  },

  findByEmail: async (email): Promise<UserRecord | null> => {
    const result = await pool.query<UserRow>(
      `SELECT ${userColumns} FROM users WHERE lower(email) = lower($1)`,
      [email.trim()],
    );
    return userFromQuery(pool, result);
  },

  list: async (query): Promise<UserListResult> => {
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (query.search !== undefined && query.search.length > 0) {
      values.push(`%${query.search}%`);
      const parameter = `$${values.length}`;
      conditions.push(`(u.email ILIKE ${parameter} OR u.first_name ILIKE ${parameter} OR u.last_name ILIKE ${parameter})`);
    }
    if (query.status !== undefined) {
      values.push(query.status);
      conditions.push(`u.status = $${values.length}`);
    }
    if (query.organizationId !== undefined) {
      values.push(query.organizationId);
      conditions.push(
        `EXISTS (SELECT 1 FROM user_memberships filter_membership
                  WHERE filter_membership.user_id = u.id
                    AND filter_membership.organization_id = $${values.length})`,
      );
    }

    const where = conditions.length === 0 ? '' : `WHERE ${conditions.join(' AND ')}`;
    values.push(query.pageSize);
    const limitParameter = `$${values.length}`;
    values.push((query.page - 1) * query.pageSize);
    const offsetParameter = `$${values.length}`;

    const result = await pool.query<UserRow>(
      `SELECT ${userColumns}, COUNT(*) OVER() AS total_count
         FROM users u
         ${where}
        ORDER BY u.created_at DESC
        LIMIT ${limitParameter} OFFSET ${offsetParameter}`,
      values,
    );
    const membershipMap = await membershipsFor(pool, result.rows.map((row) => row.id));
    const total = result.rows.length === 0 ? 0 : Number(result.rows[0]?.total_count ?? 0);

    return {
      items: result.rows.map((row) => mapUser(row, membershipMap.get(row.id) ?? [])),
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.ceil(total / query.pageSize),
    };
  },

  create: async (input: CreateUserRecord): Promise<UserRecord> => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query<UserRow>(
        `INSERT INTO users
          (email, password_hash, first_name, last_name, phone, avatar_url, status, email_verified, created_at, updated_at)
         VALUES (lower($1), $2, $3, $4, $5, $6, $7, $8, $9, $9)
         RETURNING ${userColumns}`,
        [
          input.email,
          input.passwordHash,
          input.firstName,
          input.lastName,
          input.phone,
          input.avatarUrl,
          input.status,
          input.emailVerified,
          input.now,
        ],
      );
      const row = result.rows[0];
      if (row === undefined) {
        throw new Error('user insert returned no row');
      }

      for (const organizationId of [...new Set(input.organizationIds)]) {
        await client.query(
          `INSERT INTO user_memberships (user_id, organization_id, role, status, created_at, updated_at)
           VALUES ($1, $2, 'member', 'active', $3, $3)
           ON CONFLICT (user_id, organization_id) DO NOTHING`,
          [row.id, organizationId, input.now],
        );
      }
      await client.query('COMMIT');
      const memberships = await membershipsFor(pool, [row.id]);
      return mapUser(row, memberships.get(row.id) ?? []);
    } catch (error) {
      await client.query('ROLLBACK');
      if (isUniqueViolation(error)) {
        throw emailAlreadyExists();
      }
      throw error;
    } finally {
      client.release();
    }
  },

  update: async (id, input, now): Promise<UserRecord | null> => {
    const assignments: string[] = [];
    const values: unknown[] = [];
    const add = (column: string, value: unknown): void => {
      values.push(value);
      assignments.push(`${column} = $${values.length}`);
    };

    if (input.firstName !== undefined) add('first_name', input.firstName);
    if (input.lastName !== undefined) add('last_name', input.lastName);
    if (input.phone !== undefined) add('phone', input.phone);
    if (input.avatarUrl !== undefined) add('avatar_url', input.avatarUrl);
    if (assignments.length === 0) {
      const existing = await pool.query<UserRow>(`SELECT ${userColumns} FROM users WHERE id = $1`, [id]);
      return userFromQuery(pool, existing);
    }

    values.push(now, id);
    assignments.push(`updated_at = $${values.length - 1}`);
    const result = await pool.query<UserRow>(
      `UPDATE users SET ${assignments.join(', ')} WHERE id = $${values.length} RETURNING ${userColumns}`,
      values,
    );
    return userFromQuery(pool, result);
  },

  updateStatus: async (id, status, now): Promise<UserRecord | null> => {
    const result = await pool.query<UserRow>(
      `UPDATE users SET status = $1, updated_at = $2 WHERE id = $3 RETURNING ${userColumns}`,
      [status, now, id],
    );
    return userFromQuery(pool, result);
  },

  addMembership: async (userId, input: AddMembershipInput, now): Promise<UserMembership> => {
    try {
      const result = await pool.query<MembershipRow>(
        `INSERT INTO user_memberships (user_id, organization_id, role, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $5)
         RETURNING id, user_id, organization_id, role, status, created_at, updated_at`,
        [userId, input.organizationId, input.role ?? 'member', input.status ?? 'active', now],
      );
      const row = result.rows[0];
      if (row === undefined) {
        throw new Error('membership insert returned no row');
      }
      return mapMembership(row);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw membershipAlreadyExists();
      }
      throw error;
    }
  },

  removeMembership: async (userId, organizationId, _now): Promise<boolean> => {
    const result = await pool.query<{ id: string }>(
      `DELETE FROM user_memberships WHERE user_id = $1 AND organization_id = $2 RETURNING id`,
      [userId, organizationId],
    );
    return result.rowCount === 1;
  },

  listMemberships: async (userId): Promise<UserMembership[]> => {
    const result = await pool.query<MembershipRow>(
      `SELECT id, user_id, organization_id, role, status, created_at, updated_at
         FROM user_memberships WHERE user_id = $1 ORDER BY created_at ASC`,
      [userId],
    );
    return result.rows.map(mapMembership);
  },
});
