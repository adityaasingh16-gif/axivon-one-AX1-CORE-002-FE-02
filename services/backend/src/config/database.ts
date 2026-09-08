import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

export async function testDatabaseConnection(): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query("SELECT 1");
    console.log("PostgreSQL database connected");
  } finally {
    client.release();
  }
}