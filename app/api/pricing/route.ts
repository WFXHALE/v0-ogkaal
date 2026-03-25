import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { DEFAULT_PRICING, DEFAULT_SYSTEM, type PricingConfig, type SystemConfig } from "@/lib/admin-settings"

export const dynamic = "force-dynamic"

/**
 * GET /api/pricing
 * Returns merged system config + pricing from Supabase admin_settings.
 * Uses the service-role key so it bypasses the restrictive RLS policy on
 * admin_settings (which only allows admin users by default).
 * No auth required — pricing is public information shown on checkout pages.
 */
export async function GET() {
  try {
    const supabase = createServiceClient()

    const [sysRes, priceRes] = await Promise.all([
      supabase.from("admin_settings").select("value").eq("key", "system_config").maybeSingle(),
      supabase.from("admin_settings").select("value").eq("key", "pricing").maybeSingle(),
    ])

    const sysVal   = (sysRes.data?.value   as Partial<SystemConfig>  | null) ?? {}
    const priceVal = (priceRes.data?.value as Partial<PricingConfig> | null) ?? {}

    const merged = {
      ...DEFAULT_SYSTEM,
      ...DEFAULT_PRICING,
      ...sysVal,
      ...priceVal,
    }

    return NextResponse.json({ ok: true, config: merged }, {
      headers: {
        // No-cache so every request gets fresh values from DB
        "Cache-Control": "no-store, max-age=0",
      },
    })
  } catch (err) {
    // Return defaults so the frontend never crashes
    return NextResponse.json(
      { ok: false, config: { ...DEFAULT_SYSTEM, ...DEFAULT_PRICING }, error: String(err) },
      { status: 200 }  // still 200 so clients can fall back gracefully
    )
  }
}
