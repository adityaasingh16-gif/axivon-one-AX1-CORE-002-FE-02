import { Pool, type PoolConfig } from 'pg';

export interface PostgresPoolOptions {
  connectionString: string;
  max?: number;
  connectionTimeoutMillis?: number;
  idleTimeoutMillis?: number;
}

/**
 * Creates a PostgreSQL pool for a Neon-compatible connection URI.
 *
 * The URI must come from DATABASE_URL and must never be committed. Neon URIs
 * normally include `sslmode=require`; pg honours that setting from the URI.
 */
export const createPostgresPool = (options: PostgresPoolOptions): Pool => {
  const config: PoolConfig = {
    connectionString: options.connectionString,
    max: options.max ?? 10,
    connectionTimeoutMillis: options.connectionTimeoutMillis ?? 10_000,
    idleTimeoutMillis: options.idleTimeoutMillis ?? 30_000,
  };
  return new Pool(config);
};
