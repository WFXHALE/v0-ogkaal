import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

/**
 * GET  /api/admin/settings          — returns { system_config, pricing, admin_profile }
 * POST /api/admin/settings          — upserts a key/value pair
 * Body: { key: "system_config" | "pricing" | "admin_profile", value: object }
 *
 * Uses the service-role key so it bypasses the admin_all_settings RLS policy
 * that blocks reads/writes with the anon key.
 */

export const dynamic = "force-dynamic"

const ALLOWED_KEYS = ["system_config", "pricing", "admin_profile"] as const
type SettingKey = typeof ALLOWED_KEYS[number]

export async function GET() {
  try {
    const sb = createServiceClient()
    const { data, error } = await sb
      .from("admin_settings")
      .select("key, value")
      .in("key", [...ALLOWED_KEYS])

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    const result: Record<string, unknown> = {}
    for (const row of data ?? []) {
      result[row.key as string] = row.value
    }

    return NextResponse.json(
      { ok: true, data: result },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    )
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const key: string = body.key
    const value: unknown = body.value

    if (!ALLOWED_KEYS.includes(key as SettingKey)) {
      return NextResponse.json({ ok: false, error: `Invalid key: ${key}` }, { status: 400 })
    }
    if (value === null || typeof value !== "object") {
      return NextResponse.json({ ok: false, error: "value must be an object" }, { status: 400 })
    }

    const sb = createServiceClient()
    const { error } = await sb
      .from("admin_settings")
      .upsert(
        { key, value, updated_at: new Date().toISOString() },
        { onConflict: "key" },
      )

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
