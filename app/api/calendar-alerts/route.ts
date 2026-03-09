import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/calendar-alerts?user_id=xxx
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const user_id = searchParams.get("user_id")
  if (!user_id) return NextResponse.json({ alerts: [] })

  const { data, error } = await supabase
    .from("calendar_alerts")
    .select("*")
    .eq("user_id", user_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ alerts: data ?? [] })
}

// POST /api/calendar-alerts — set alert for an event
export async function POST(req: Request) {
  const body = await req.json()
  const { user_id, event_id, event_title, event_date, event_time, currency, impact, minutes_before } = body

  if (!user_id || !event_id) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  // Upsert — one alert per user per event
  const { data, error } = await supabase
    .from("calendar_alerts")
    .upsert(
      {
        user_id,
        event_id,
        event_title,
        event_date,
        event_time,
        currency,
        impact,
        minutes_before: minutes_before ?? 15,
        notified: false,
      },
      { onConflict: "user_id,event_id" }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ alert: data })
}

// DELETE /api/calendar-alerts?user_id=xxx&event_id=yyy
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const user_id = searchParams.get("user_id")
  const event_id = searchParams.get("event_id")

  if (!user_id || !event_id) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const { error } = await supabase
    .from("calendar_alerts")
    .delete()
    .eq("user_id", user_id)
    .eq("event_id", event_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
