import { createClient } from "@supabase/supabase-js"

/**
 * Server-only Supabase client using the service role key.
 * Bypasses Row Level Security — ONLY use in trusted server-side code
 * (API routes, Server Actions, scripts). Never expose to the browser.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
      "Check your Vercel environment variables."
    )
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
