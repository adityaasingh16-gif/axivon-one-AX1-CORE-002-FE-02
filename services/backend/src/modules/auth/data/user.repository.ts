import { pool } from "../../../config/database.js";

export interface CreateUserInput {
  email: string;
  username?: string;
  passwordHash: string;
}

export interface UserRecord {
  id: string;
  email: string;
  username: string | null;
  passwordHash: string;
  status: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function findUserByEmail(
  email: string
): Promise<UserRecord | null> {
  const result = await pool.query(
    `
      SELECT
        id,
        email,
        username,
        password_hash AS "passwordHash",
        status,
        email_verified AS "emailVerified",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM users
      WHERE email = $1
      LIMIT 1
    `,
    [email]
  );

  return result.rows[0] ?? null;
}

export async function createUser(
  input: CreateUserInput
): Promise<UserRecord> {
  const result = await pool.query(
    `
      INSERT INTO users (
        email,
        username,
        password_hash
      )
      VALUES ($1, $2, $3)
      RETURNING
        id,
        email,
        username,
        password_hash AS "passwordHash",
        status,
        email_verified AS "emailVerified",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `,
    [
      input.email,
      input.username ?? null,
      input.passwordHash
    ]
  );

  return result.rows[0];
}
export async function findUserByIdentifier(
  identifier: string
): Promise<UserRecord | null> {
  const result = await pool.query(
    `
      SELECT
        id,
        email,
        username,
        password_hash AS "passwordHash",
        status,
        email_verified AS "emailVerified",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM users
      WHERE LOWER(email) = $1
         OR LOWER(username) = $1
      LIMIT 1
    `,
    [identifier]
  );

  return result.rows[0] ?? null;
}