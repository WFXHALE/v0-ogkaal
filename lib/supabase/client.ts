import { createBrowserClient, type SupabaseClient } from "@supabase/ssr"

let browserClient: SupabaseClient | undefined

export function createClient(): SupabaseClient {
  if (!browserClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) throw new Error("Supabase browser configuration is missing.")
    browserClient = createBrowserClient(url, key)
  }
  return browserClient
}
