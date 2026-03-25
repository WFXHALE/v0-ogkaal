/**
 * Shared PostgreSQL client using POSTGRES_URL_NON_POOLING.
 * This bypasses the Supabase REST API / PostgREST entirely, which avoids the
 * PGRST205 "schema cache" errors that occur when PostgREST hasn't reloaded
 * after new tables are created.
 */
import { Pool } from "pg"

// Use globalThis so the singleton survives HMR, but re-creates if the env var
// changes (e.g. when a new Supabase project is connected in Vercel).
const g = globalThis as typeof globalThis & {
  _pgPool?: Pool
  _pgPoolConnStr?: string
}

export function getDb(): Pool {
  const connectionString = process.env.POSTGRES_URL_NON_POOLING
  if (!connectionString) {
    throw new Error("POSTGRES_URL_NON_POOLING env var is not set")
  }

  // Re-create pool if the connection string has changed (e.g. new Supabase project)
  if (g._pgPool && g._pgPoolConnStr !== connectionString) {
    void g._pgPool.end().catch(() => {})
    g._pgPool = undefined
  }

  if (!g._pgPool) {
    // Supabase uses a self-signed cert in the chain, so rejectUnauthorized must
    // be false. We strip sslmode from the connection string and pass ssl
    // explicitly to avoid the pg deprecation warning about ambiguous SSL modes.
    const cleanConnectionString = connectionString.replace(/[?&]sslmode=[^&]*/g, "")
    g._pgPool = new Pool({
      connectionString: cleanConnectionString,
      ssl: { rejectUnauthorized: false },
      max: 5,
      // Auto-destroy idle connections so stale pools don't linger
      idleTimeoutMillis: 30_000,
    })
    g._pgPoolConnStr = connectionString

    // On error, destroy the pool so the next request creates a fresh one
    g._pgPool.on("error", () => {
      void g._pgPool?.end().catch(() => {})
      g._pgPool = undefined
    })
  }

  return g._pgPool
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
