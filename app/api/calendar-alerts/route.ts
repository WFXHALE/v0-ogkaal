import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function authenticatedClient() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return { supabase, user }
}

// Calendar alerts are always scoped to the signed-in Supabase account.
// Any user_id supplied by the browser is deliberately ignored.
export async function GET() {
  const context = await authenticatedClient()
  if (!context) return NextResponse.json({ error: "Sign in to view your alerts." }, { status: 401 })

  const { data, error } = await context.supabase
    .from("calendar_alerts")
    .select("*")
    .eq("user_id", context.user.id)
    .order("event_date", { ascending: true })

  if (error) return NextResponse.json({ error: "Could not load calendar alerts." }, { status: 500 })
  return NextResponse.json(
    { alerts: data ?? [] },
    { headers: { "Cache-Control": "private, no-store" } },
  )
}

export async function POST(req: NextRequest) {
  const context = await authenticatedClient()
  if (!context) return NextResponse.json({ error: "Sign in to set an alert." }, { status: 401 })

  const body = await req.json().catch(() => ({})) as Record<string, unknown>
  const eventId = typeof body.event_id === "string" ? body.event_id.trim() : ""
  if (!eventId || eventId.length > 160) {
    return NextResponse.json({ error: "A valid event is required." }, { status: 400 })
  }

  const minutesBefore = Number(body.minutes_before ?? 15)
  if (!Number.isInteger(minutesBefore) || minutesBefore < 1 || minutesBefore > 1440) {
    return NextResponse.json({ error: "Alert timing must be between 1 and 1,440 minutes." }, { status: 400 })
  }

  const cleanText = (value: unknown, max: number) =>
    typeof value === "string" ? value.trim().slice(0, max) : ""

  const { data, error } = await context.supabase
    .from("calendar_alerts")
    .upsert(
      {
        user_id: context.user.id,
        event_id: eventId,
        event_title: cleanText(body.event_title, 240),
        event_date: cleanText(body.event_date, 40),
        event_time: cleanText(body.event_time, 40),
        currency: cleanText(body.currency, 20),
        impact: cleanText(body.impact, 40),
        minutes_before: minutesBefore,
        notified: false,
      },
      { onConflict: "user_id,event_id" },
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: "Could not save calendar alert." }, { status: 500 })
  return NextResponse.json(
    { alert: data },
    { headers: { "Cache-Control": "private, no-store" } },
  )
}

export async function DELETE(req: NextRequest) {
  const context = await authenticatedClient()
  if (!context) return NextResponse.json({ error: "Sign in to remove an alert." }, { status: 401 })

  const eventId = req.nextUrl.searchParams.get("event_id")?.trim()
  if (!eventId || eventId.length > 160) {
    return NextResponse.json({ error: "A valid event is required." }, { status: 400 })
  }

  const { error } = await context.supabase
    .from("calendar_alerts")
    .delete()
    .eq("user_id", context.user.id)
    .eq("event_id", eventId)

  if (error) return NextResponse.json({ error: "Could not remove calendar alert." }, { status: 500 })
  return NextResponse.json({ success: true }, { headers: { "Cache-Control": "private, no-store" } })
}
