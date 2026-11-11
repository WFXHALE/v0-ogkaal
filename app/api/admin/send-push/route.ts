import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { verifyAdminSessionToken } from "@/lib/admin-session"

export const runtime = "nodejs"

// POST /api/admin/send-push — requires a valid HttpOnly admin session.
export async function POST(req: NextRequest) {
  if (!(await verifyAdminSessionToken(req.cookies.get("admin_session")?.value))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { title, body, type, user_id, data = {} } = await req.json()
    if (!title?.trim() || !body?.trim() || !type) {
      return NextResponse.json({ error: "title, body, type required" }, { status: 400 })
    }

    const supabase = createServiceClient()
    if (user_id) {
      const { error } = await supabase.from("push_notifications").insert({
        recipient_id: user_id, type, title: title.trim(), body: body.trim(), data,
      })
      if (error) throw error
    } else {
      const { data: users, error } = await supabase
        .from("dashboard_users")
        .select("id")
        .eq("push_enabled", true)
      if (error) throw error
      if (users?.length) {
        const { error: insertError } = await supabase.from("push_notifications").insert(
          users.map((u: { id: string }) => ({ recipient_id: u.id, type, title: title.trim(), body: body.trim(), data }))
        )
        if (insertError) throw insertError
      }
    }

    const fcmProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    const fcmServerKey = process.env.FIREBASE_SERVER_KEY
    if (!fcmServerKey || !fcmProjectId) {
      return NextResponse.json({ success: true, mode: "store-only" })
    }

    const notification = { title: title.trim(), body: body.trim() }
    const messageData = {
      type,
      ...Object.fromEntries(Object.entries(data).map(([key, value]) => [key, String(value)])),
    }

    let fcmPayload: object
    if (user_id) {
      const { data: tokenRow, error } = await supabase
        .from("fcm_tokens")
        .select("token")
        .eq("user_id", user_id)
        .maybeSingle()
      if (error) throw error
      if (!tokenRow?.token) return NextResponse.json({ success: true, mode: "no-token" })
      fcmPayload = {
        message: {
          token: tokenRow.token,
          notification,
          data: messageData,
          webpush: { fcm_options: { link: "/" } },
        },
      }
    } else {
      fcmPayload = {
        message: {
          topic: "all",
          notification,
          data: messageData,
          webpush: { fcm_options: { link: "/" } },
        },
      }
    }

    const fcmRes = await fetch(`https://fcm.googleapis.com/v1/projects/${fcmProjectId}/messages:send`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${fcmServerKey}` },
      body: JSON.stringify(fcmPayload),
    })
    const responseBody = await fcmRes.json().catch(() => ({}))
    if (!fcmRes.ok) {
      console.error("[send-push] FCM error:", responseBody)
      return NextResponse.json({ success: true, mode: "store-only" })
    }
    return NextResponse.json({ success: true, fcm: responseBody })
  } catch (err) {
    console.error("[send-push] error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
