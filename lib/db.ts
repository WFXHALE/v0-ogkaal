/**
 * Shared PostgreSQL client using POSTGRES_URL_NON_POOLING.
 * This bypasses the Supabase REST API / PostgREST entirely, which avoids the
 * PGRST205 "schema cache" errors that occur when PostgREST hasn't reloaded
 * after new tables are created.
 */
import { Pool } from "pg"

let pool: Pool | null = null

export function getDb(): Pool {
  if (!pool) {
    const connectionString = process.env.POSTGRES_URL_NON_POOLING
    if (!connectionString) {
      throw new Error("POSTGRES_URL_NON_POOLING env var is not set")
    }
    // Supabase uses a self-signed cert in the chain, so rejectUnauthorized must
    // be false. We strip sslmode from the connection string and pass ssl
    // explicitly to avoid the pg deprecation warning about ambiguous SSL modes.
    const cleanConnectionString = connectionString.replace(/[?&]sslmode=[^&]*/g, "")
    pool = new Pool({
      connectionString: cleanConnectionString,
      ssl: { rejectUnauthorized: false },
      max: 5,
    })
  }
  return pool
}

/** Run a parameterised query and return all rows. */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const db = getDb()
  const res = await db.query(sql, params)
  return res.rows as T[]
}

/** Run a parameterised query and return the first row (or null). */
export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(sql, params)
  return rows[0] ?? null
}
