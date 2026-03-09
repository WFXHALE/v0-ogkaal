import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// PATCH /api/notifications/read
// body: { userId: string, notificationId?: string }
// If notificationId is omitted, marks ALL unread for that user as read
export async function PATCH(req: NextRequest) {
  const { userId, notificationId } = await req.json()

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 })
  }

  const supabase = await createClient()

  let query = supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("recipient_id", userId)
    .eq("is_read", false)

  if (notificationId) {
    query = query.eq("id", notificationId) as typeof query
  }

  const { error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
