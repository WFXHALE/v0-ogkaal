"use server"

import { cookies } from "next/headers"
import { createServiceClient } from "@/lib/supabase/service"
import { verifyAdminSessionToken } from "@/lib/admin-session"

export type PushType =
  | "announcement" | "mentorship" | "discount"
  | "kyc" | "usdt_p2p" | "community" | "trading_alert"

interface SendPushInput {
  title: string
  body: string
  type: PushType
  user_id?: string
}

export async function sendPushNotification(
  input: SendPushInput,
): Promise<{ success: boolean; mode?: string; error?: string }> {
  const cookieStore = await cookies()
  const adminToken = cookieStore.get("admin_session")?.value
  if (!(await verifyAdminSessionToken(adminToken))) {
    return { success: false, error: "Unauthorized" }
  }

  const { title, body, type, user_id } = input
  if (!title?.trim() || !body?.trim() || !type) {
    return { success: false, error: "title, body, type required" }
  }

  try {
    const supabase = createServiceClient()

    if (user_id) {
      const { error } = await supabase.from("push_notifications").insert({
        recipient_id: user_id, type, title: title.trim(), body: body.trim(), data: {},
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
          users.map((u: { id: string }) => ({ recipient_id: u.id, type, title: title.trim(), body: body.trim(), data: {} }))
        )
        if (insertError) throw insertError
      }
    }

    const fcmProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    const fcmServerKey = process.env.FIREBASE_SERVER_KEY
    if (!fcmServerKey || !fcmProjectId) return { success: true, mode: "store-only" }

    let fcmPayload: Record<string, unknown>
    if (user_id) {
      const { data: tokenRow, error } = await supabase
        .from("fcm_tokens")
        .select("token")
        .eq("user_id", user_id)
        .maybeSingle()
      if (error) throw error
      if (!tokenRow?.token) return { success: true, mode: "no-token" }
      fcmPayload = {
        to: tokenRow.token,
        notification: { title: title.trim(), body: body.trim() },
        data: { type },
        webpush: { fcm_options: { link: "/" } },
      }
    } else {
      fcmPayload = {
        to: "/topics/all",
        notification: { title: title.trim(), body: body.trim() },
        data: { type },
        webpush: { fcm_options: { link: "/" } },
      }
    }

    const fcmRes = await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `key=${fcmServerKey}` },
      body: JSON.stringify(fcmPayload),
    })
    if (!fcmRes.ok) {
      const errorBody = await fcmRes.text()
      console.error("[send-push-action] FCM error:", errorBody)
      return { success: true, mode: "store-only" }
    }

    return { success: true, mode: "fcm" }
  } catch (err) {
    console.error("[send-push-action] error:", err)
    return { success: false, error: "Could not send notification." }
  }
}
