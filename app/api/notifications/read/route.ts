import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: { notificationId?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  let query = supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("recipient_id", user.id)
    .eq("is_read", false)

  if (body.notificationId) query = query.eq("id", body.notificationId) as typeof query

  const { error } = await query
  if (error) return NextResponse.json({ error: "Could not update notifications" }, { status: 500 })
  return NextResponse.json({ success: true })
}
