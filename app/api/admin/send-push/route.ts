import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST /api/admin/send-push
// Sends a FCM push notification via the FCM HTTP v1 API.
// Supports: broadcast (topic "all") or targeted (user_id).
export async function POST(req: NextRequest) {
  try {
    const {
      title, body, type, user_id, data = {},
      // admin secret passed in header
    } = await req.json()

    const adminSecret = req.headers.get("x-admin-secret")
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
    }

    if (!title || !body || !type) {
      return NextResponse.json({ error: "title, body, type required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Persist notification record(s) in the push_notifications table
    if (user_id) {
      await supabase.from("push_notifications").insert({
        recipient_id: user_id, type, title, body, data,
      })
    } else {
      // broadcast — fetch all user ids and insert bulk
      const { data: users } = await supabase
        .from("dashboard_users")
        .select("id")
        .eq("push_enabled", true)
      if (users?.length) {
        await supabase.from("push_notifications").insert(
          users.map((u: { id: string }) => ({ recipient_id: u.id, type, title, body, data }))
        )
      }
    }

    // Build FCM message via HTTP v1
    const fcmProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    const fcmServerKey = process.env.FIREBASE_SERVER_KEY // Firebase server key (not NEXT_PUBLIC)

    if (!fcmServerKey || !fcmProjectId) {
      // Store-only mode — no FCM send, but records are saved
      return NextResponse.json({ success: true, mode: "store-only" })
    }

    const notification = { title, body }
    const messageData  = { type, ...Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])) }

    let fcmPayload: object

    if (user_id) {
      // Targeted — look up FCM token
      const { data: tokenRow } = await supabase
        .from("fcm_tokens")
        .select("token")
        .eq("user_id", user_id)
        .maybeSingle()

      if (!tokenRow?.token) {
        return NextResponse.json({ success: true, mode: "no-token" })
      }

      fcmPayload = {
        message: {
          token: tokenRow.token,
          notification,
          data: messageData,
          webpush: { fcm_options: { link: "/" } },
        },
      }
    } else {
      // Broadcast via topic
      fcmPayload = {
        message: {
          topic: "all",
          notification,
          data: messageData,
          webpush: { fcm_options: { link: "/" } },
        },
      }
    }

    const fcmRes = await fetch(
      `https://fcm.googleapis.com/v1/projects/${fcmProjectId}/messages:send`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${fcmServerKey}`,
        },
        body: JSON.stringify(fcmPayload),
      }
    )

    const fcmJson = await fcmRes.json()
    if (!fcmRes.ok) {
      console.error("[send-push] FCM error:", fcmJson)
    }

    return NextResponse.json({ success: true, fcm: fcmJson })
  } catch (err) {
    console.error("[send-push] error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
