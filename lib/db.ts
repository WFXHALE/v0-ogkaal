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
  // Priority 1: build from individual vars — these are always clean and correct.
  // The Supabase Vercel integration always sets all four of these.
  const host     = process.env.POSTGRES_HOST
  const user     = process.env.POSTGRES_USER
  const password = process.env.POSTGRES_PASSWORD
  const database = process.env.POSTGRES_DATABASE

  if (host && user && password && database) {
    // Use port 6543 (Supabase session pooler — IPv4-reachable in serverless).
    // Port 5432 is the direct connection and resolves to IPv6, which causes
    // ENETUNREACH in Vercel sandbox environments.
    return `postgresql://${user}:${encodeURIComponent(password)}@${host}:6543/${database}`
  }

  // Priority 2: POSTGRES_URL — BUT the Supabase Vercel integration appends
  // `?supa=base-pooler.x` which pg parses as part of the database name
  // (producing `postgres&supa=base-pooler.x`).  Strip ALL query params and
  // force port 6543.
  const poolingUrl = process.env.POSTGRES_URL
  if (poolingUrl) {
    // Remove everything after ? (all query params including &supa=...)
    const clean = poolingUrl.split("?")[0]
    // Ensure port is 6543 (pooler, IPv4) not 5432 (direct, IPv6)
    return clean.replace(/:5432\//, ":6543/").replace(/:6543\//, ":6543/")
  }

  // Priority 3: non-pooling URL — also strip query params and switch to pooler port
  const nonPooling = process.env.POSTGRES_URL_NON_POOLING
  if (nonPooling) {
    return nonPooling.split("?")[0].replace(/:5432\//, ":6543/")
  }

  throw new Error(
    "No Postgres connection string found. " +
    "Set POSTGRES_HOST/USER/PASSWORD/DATABASE or POSTGRES_URL env vars."
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
