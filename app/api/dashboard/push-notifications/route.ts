import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { getDashboardSession } from "@/lib/dashboard-session"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function authenticatedRecipient(req: NextRequest) {
  const session = getDashboardSession(req)
  if (!session) return null

  const supabase = createServiceClient()
  const { data: user, error } = await supabase
    .from("dashboard_users")
    .select("id")
    .eq("user_id", session.sub)
    .maybeSingle()

  if (error || !user?.id) return null
  return { supabase, recipientId: String(user.id) }
}

export async function GET(req: NextRequest) {
  const context = await authenticatedRecipient(req)
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await context.supabase
    .from("push_notifications")
    .select("*")
    .eq("recipient_id", context.recipientId)
    .order("created_at", { ascending: false })
    .limit(40)

  if (error) return NextResponse.json({ error: "Could not load notifications" }, { status: 500 })
  return NextResponse.json(
    { data: data ?? [] },
    { headers: { "Cache-Control": "private, no-store" } },
  )
}

export async function PATCH(req: NextRequest) {
  const context = await authenticatedRecipient(req)
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({})) as { notificationId?: unknown; markAll?: unknown }
  let update = context.supabase
    .from("push_notifications")
    .update({ read: true })
    .eq("recipient_id", context.recipientId)
    .eq("read", false)

  if (body.markAll !== true) {
    if (typeof body.notificationId !== "string" || !body.notificationId.trim()) {
      return NextResponse.json({ error: "A notification ID is required." }, { status: 400 })
    }
    update = update.eq("id", body.notificationId.trim()) as typeof update
  }

  const { error } = await update
  if (error) return NextResponse.json({ error: "Could not update notifications" }, { status: 500 })
  return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } })
}
