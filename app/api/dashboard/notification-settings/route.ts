import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { getDashboardSession } from "@/lib/dashboard-session"

const DEFAULT_SETTINGS = {
  announcements: true,
  mentorship: true,
  discounts: true,
  kyc: true,
  usdt_p2p: true,
  community: true,
  trading_alerts: false,
}

export async function GET(req: NextRequest) {
  const session = getDashboardSession(req)
  if (!session) return NextResponse.json({ error: "Unauthorized. Please log in again." }, { status: 401 })

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("dashboard_users")
    .select("notification_settings, push_enabled")
    .eq("user_id", session.sub)
    .maybeSingle()

  if (error) return NextResponse.json({ error: "Could not load notification settings." }, { status: 500 })
  return NextResponse.json({
    settings: { ...DEFAULT_SETTINGS, ...(data?.notification_settings ?? {}) },
    push_enabled: data?.push_enabled ?? true,
  })
}

export async function PATCH(req: NextRequest) {
  const session = getDashboardSession(req)
  if (!session) return NextResponse.json({ error: "Unauthorized. Please log in again." }, { status: 401 })

  try {
    const { settings, push_enabled } = await req.json()
    const update: Record<string, unknown> = {}
    if (settings !== undefined) {
      if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
        return NextResponse.json({ error: "Invalid notification settings." }, { status: 400 })
      }
      update.notification_settings = settings
    }
    if (push_enabled !== undefined) {
      if (typeof push_enabled !== "boolean") return NextResponse.json({ error: "Invalid push setting." }, { status: 400 })
      update.push_enabled = push_enabled
    }
    if (!Object.keys(update).length) return NextResponse.json({ error: "No settings supplied." }, { status: 400 })

    const supabase = createServiceClient()
    const { error } = await supabase.from("dashboard_users").update(update).eq("user_id", session.sub)
    if (error) return NextResponse.json({ error: "Could not save notification settings." }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 })
  }
}
