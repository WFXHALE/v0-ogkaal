import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { DEFAULT_PRICING, DEFAULT_SYSTEM, type PricingConfig, type SystemConfig } from "@/lib/admin-settings"

export const dynamic = "force-dynamic"

/**
 * GET /api/pricing
 * Returns merged system config + pricing from admin_settings via lib/db (pg).
 * No Supabase JS client — avoids ENOTFOUND DNS failures in Vercel preview.
 * No auth required — pricing is public information shown on checkout pages.
 */
export async function GET() {
  try {
    const rows = await query<{ key: string; value: unknown }>(
      "SELECT key, value FROM admin_settings WHERE key IN ('system_config', 'pricing')",
    )

    let sysVal:   Partial<SystemConfig>  = {}
    let priceVal: Partial<PricingConfig> = {}

    for (const row of rows) {
      if (row.key === "system_config") sysVal   = row.value as Partial<SystemConfig>
      if (row.key === "pricing")       priceVal = row.value as Partial<PricingConfig>
    }

    const merged = {
      ...DEFAULT_SYSTEM,
      ...DEFAULT_PRICING,
      ...sysVal,
      ...priceVal,
    }

    return NextResponse.json({ ok: true, config: merged }, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    })
  } catch (err) {
    // Return defaults so the frontend never crashes
    return NextResponse.json(
      { ok: false, config: { ...DEFAULT_SYSTEM, ...DEFAULT_PRICING }, error: String(err) },
      { status: 200 },
    )
  }
}
