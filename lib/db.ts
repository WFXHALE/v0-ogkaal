/**
 * Shared PostgreSQL client — uses the Supabase session pooler over IPv4.
 *
 * The ENETUNREACH error occurs because Node resolves the Supabase host to an
 * IPv6 address in environments that don't support IPv6 outbound (Vercel
 * serverless). Forcing dns.lookup family:4 makes pg always connect via IPv4.
 *
 * Connection priority:
 *   1. POSTGRES_URL (Supabase pooler — port 6543, set by the Vercel integration)
 *   2. Individual POSTGRES_HOST/USER/PASSWORD/DATABASE vars
 *   3. POSTGRES_URL_NON_POOLING (last resort)
 */
import { Pool } from "pg"
import dns from "dns"

const g = globalThis as typeof globalThis & {
  _pgPool?: Pool
  _pgPoolKey?: string
}

function buildConnectionString(): string {
  // Supabase Vercel integration sets POSTGRES_URL to the session pooler (port 6543)
  const pooling = process.env.POSTGRES_URL
  if (pooling) {
    // Strip sslmode from query string (pg handles ssl via the ssl option)
    return pooling.replace(/[?&]sslmode=[^&]*/g, "")
  }

  const host     = process.env.POSTGRES_HOST
  const user     = process.env.POSTGRES_USER
  const password = process.env.POSTGRES_PASSWORD
  const database = process.env.POSTGRES_DATABASE

  if (host && user && password && database) {
    // Session pooler is on port 6543; direct is 5432.
    // Prefer pooler because it's always IPv4-reachable.
    return `postgresql://${user}:${encodeURIComponent(password)}@${host}:6543/${database}`
  }

  const nonPooling = process.env.POSTGRES_URL_NON_POOLING
  if (nonPooling) {
    return nonPooling.replace(/[?&]sslmode=[^&]*/g, "")
  }

  throw new Error(
    "No Postgres connection string found. " +
    "Set POSTGRES_URL or POSTGRES_HOST/USER/PASSWORD/DATABASE env vars."
  )
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
      ssl:  { rejectUnauthorized: false },
      max:  5,
      idleTimeoutMillis: 30_000,
      // Force IPv4: prevents ENETUNREACH when the host resolves to an IPv6 address
      // in environments that only have IPv4 outbound connectivity (e.g. Vercel).
      lookup: (hostname, options, callback) => {
        dns.lookup(hostname, { ...options, family: 4 }, callback)
      },
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
