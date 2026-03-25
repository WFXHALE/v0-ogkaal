/**
 * Shared PostgreSQL client.
 *
 * POSTGRES_URL_NON_POOLING may point to an old/wrong Supabase project.
 * We build the connection string directly from the individual env vars
 * (POSTGRES_HOST, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DATABASE)
 * which always come from the currently-connected Supabase integration,
 * falling back to POSTGRES_URL_NON_POOLING only as a last resort.
 */
import { Pool } from "pg"

const g = globalThis as typeof globalThis & {
  _pgPool?: Pool
  _pgPoolKey?: string
}

function buildConnectionString(): string {
  // PRIORITY 1: POSTGRES_URL (Supabase transaction pooler — IPv4, port 6543)
  // This is the connection string Supabase sets for serverless/edge environments.
  // It uses PgBouncer in transaction mode over port 6543 which is always IPv4.
  const pooling = process.env.POSTGRES_URL
  if (pooling) {
    // Ensure we're on port 6543 (transaction pooler) not 5432 (direct, IPv6 only)
    return pooling
      .replace(/[?&]sslmode=[^&]*/g, "")
      .replace(/:5432\//, ":6543/")
  }

  // PRIORITY 2: Build from individual vars — but use port 6543 (pooler)
  const host     = process.env.POSTGRES_HOST
  const user     = process.env.POSTGRES_USER
  const password = process.env.POSTGRES_PASSWORD
  const database = process.env.POSTGRES_DATABASE

  if (host && user && password && database) {
    // Force port 6543 for Supabase transaction pooler (IPv4-reachable)
    return `postgresql://${user}:${encodeURIComponent(password)}@${host}:6543/${database}`
  }

  // PRIORITY 3: Non-pooling URL — also switch to port 6543
  const nonPooling = process.env.POSTGRES_URL_NON_POOLING
  if (nonPooling) {
    return nonPooling
      .replace(/[?&]sslmode=[^&]*/g, "")
      .replace(/:5432\//, ":6543/")
  }

  throw new Error("No Postgres connection string found. Set POSTGRES_URL or POSTGRES_HOST/USER/PASSWORD/DATABASE.")
}

export function getDb(): Pool {
  const connStr = buildConnectionString()

  if (g._pgPool && g._pgPoolKey !== connStr) {
    void g._pgPool.end().catch(() => {})
    g._pgPool = undefined
  }

  if (!g._pgPool) {
    g._pgPool = new Pool({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30_000,
    })
    g._pgPoolKey = connStr

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
  const db  = getDb()
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
