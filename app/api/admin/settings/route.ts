import { NextRequest, NextResponse } from "next/server"
import { query, queryOne } from "@/lib/db"

/**
 * GET  /api/admin/settings  — returns { system_config, pricing, admin_profile }
 * POST /api/admin/settings  — upserts a key/value pair
 * Body: { key: "system_config" | "pricing" | "admin_profile", value: object }
 *
 * Uses lib/db (pg over Supabase session pooler) — no Supabase JS client so
 * there is no ENOTFOUND DNS failure in the Vercel preview sandbox.
 */

export const dynamic = "force-dynamic"

const ALLOWED_KEYS = ["system_config", "pricing", "admin_profile"] as const
type SettingKey = (typeof ALLOWED_KEYS)[number]

export async function GET() {
  try {
    const rows = await query<{ key: string; value: unknown }>(
      "SELECT key, value FROM admin_settings WHERE key = ANY($1::text[])",
      [ALLOWED_KEYS as unknown as string[]],
    )

    const result: Record<string, unknown> = {}
    for (const row of rows) {
      result[row.key] = row.value
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

    // Check if the row already exists
    const existing = await queryOne(
      "SELECT id FROM admin_settings WHERE key = $1",
      [key],
    )

    if (existing) {
      await query(
        "UPDATE admin_settings SET value = $1, updated_at = NOW() WHERE key = $2",
        [JSON.stringify(value), key],
      )
    } else {
      await query(
        "INSERT INTO admin_settings (key, value, updated_at) VALUES ($1, $2, NOW())",
        [key, JSON.stringify(value)],
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
