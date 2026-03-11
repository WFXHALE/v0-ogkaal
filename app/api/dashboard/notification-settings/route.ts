import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const DEFAULT_SETTINGS = {
  announcements:    true,
  mentorship:       true,
  discounts:        true,
  kyc:              true,
  usdt_p2p:         true,
  community:        true,
  trading_alerts:   false,
}

// GET /api/dashboard/notification-settings?userId=xxx
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId")
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("dashboard_users")
    .select("notification_settings, push_enabled")
    .eq("id", userId)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    settings:     { ...DEFAULT_SETTINGS, ...(data?.notification_settings ?? {}) },
    push_enabled: data?.push_enabled ?? true,
  })
}

// PATCH /api/dashboard/notification-settings
export async function PATCH(req: NextRequest) {
  const { userId, settings, push_enabled } = await req.json()
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

  const supabase = await createClient()
  const update: Record<string, unknown> = {}
  if (settings    !== undefined) update.notification_settings = settings
  if (push_enabled !== undefined) update.push_enabled          = push_enabled

  const { error } = await supabase
    .from("dashboard_users")
    .update(update)
    .eq("id", userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
