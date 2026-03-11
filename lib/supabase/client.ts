import { createClient as _createClient } from '@supabase/supabase-js'

// Always create from current env vars — no singleton, so swapping the
// Supabase project (and updating NEXT_PUBLIC_SUPABASE_URL / ANON_KEY)
// takes effect immediately without stale client instances.
export function createClient() {
  return _createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
