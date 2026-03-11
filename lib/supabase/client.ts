import { createClient as _createClient, type SupabaseClient } from '@supabase/supabase-js'

// Use globalThis so the singleton survives Next.js HMR module re-evaluation
// in development, preventing "Multiple GoTrueClient instances" warnings.
const g = globalThis as typeof globalThis & { _supabaseBrowserClient?: SupabaseClient }

export function createClient(): SupabaseClient {
  if (!g._supabaseBrowserClient) {
    const url  = process.env.NEXT_PUBLIC_SUPABASE_URL  || process.env.SUPABASE_URL!
    const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY!
    g._supabaseBrowserClient = _createClient(url, key)
  }
  return g._supabaseBrowserClient
}
