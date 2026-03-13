import { createClient as _createClient, type SupabaseClient } from '@supabase/supabase-js'

// Use globalThis so the singleton survives Next.js HMR module re-evaluation
// in development, preventing "Multiple GoTrueClient instances" warnings.
const g = globalThis as typeof globalThis & { _supabaseBrowserClient?: SupabaseClient }

export function createClient(): SupabaseClient {
  if (!g._supabaseBrowserClient) {
    // Only use NEXT_PUBLIC_ prefixed vars — non-public vars are never
    // exposed to the browser and would resolve to undefined on the client,
    // causing "Invalid API key" errors.
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    if (!url || !key) {
      throw new Error(
        "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Check your environment variables."
      )
    }
    g._supabaseBrowserClient = _createClient(url, key)
  }
  return g._supabaseBrowserClient
}
