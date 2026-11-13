import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { getDashboardSession } from "@/lib/dashboard-session"

export const runtime = "nodejs"

export async function PATCH(req: NextRequest) {
  const session = getDashboardSession(req)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: { notificationId?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const supabase = createServiceClient()
  let query = supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("recipient_id", session.sub)
    .eq("is_read", false)

  if (body.notificationId) query = query.eq("id", body.notificationId) as typeof query

  const { error } = await query
  if (error) return NextResponse.json({ error: "Could not update notifications" }, { status: 500 })
  return NextResponse.json({ success: true })
}
