import { createClient as _createClient, type SupabaseClient } from '@supabase/supabase-js'

// Use globalThis so the singleton survives Next.js HMR module re-evaluation
// in development, preventing "Multiple GoTrueClient instances" warnings.
const g = globalThis as typeof globalThis & { _supabaseBrowserClient?: SupabaseClient }

export function createClient(): SupabaseClient {
  if (!g._supabaseBrowserClient) {
    g._supabaseBrowserClient = _createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  }
  return g._supabaseBrowserClient
}
