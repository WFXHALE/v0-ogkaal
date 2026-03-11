"use server"

import { createClient } from "@/lib/supabase/server"

export type PushType =
  | "announcement" | "mentorship" | "discount"
  | "kyc" | "usdt_p2p" | "community" | "trading_alert"

interface SendPushInput {
  title:   string
  body:    string
  type:    PushType
  user_id?: string   // omit for broadcast
}

export async function sendPushNotification(
  input: SendPushInput,
): Promise<{ success: boolean; mode?: string; error?: string }> {
  const { title, body, type, user_id } = input

  if (!title || !body || !type) {
    return { success: false, error: "title, body, type required" }
  }

  const supabase = await createClient()

  // ── Persist notification record(s) ─────────────────────────────────────────
  if (user_id) {
    await supabase.from("push_notifications").insert({
      recipient_id: user_id, type, title, body, data: {},
    })
  } else {
    const { data: users } = await supabase
      .from("dashboard_users")
      .select("id")
      .eq("push_enabled", true)
    if (users?.length) {
      await supabase.from("push_notifications").insert(
        users.map((u: { id: string }) => ({ recipient_id: u.id, type, title, body, data: {} }))
      )
    }
  }

  // ── Send FCM message ────────────────────────────────────────────────────────
  const fcmProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const fcmServerKey = process.env.FIREBASE_SERVER_KEY

  if (!fcmServerKey || !fcmProjectId) {
    return { success: true, mode: "store-only" }
  }

  const notification = { title, body }
  const messageData  = { type }

  let fcmPayload: object

  if (user_id) {
    const { data: tokenRow } = await supabase
      .from("fcm_tokens")
      .select("token")
      .eq("user_id", user_id)
      .maybeSingle()

    if (!tokenRow?.token) return { success: true, mode: "no-token" }

    fcmPayload = {
      message: { token: tokenRow.token, notification, data: messageData,
        webpush: { fcm_options: { link: "/" } } },
    }
  } else {
    fcmPayload = {
      message: { topic: "all", notification, data: messageData,
        webpush: { fcm_options: { link: "/" } } },
    }
  }

  const fcmRes = await fetch(
    `https://fcm.googleapis.com/v1/projects/${fcmProjectId}/messages:send`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:  `Bearer ${fcmServerKey}`,
      },
      body: JSON.stringify(fcmPayload),
    }
  )

  const fcmJson = await fcmRes.json()
  if (!fcmRes.ok) {
    console.error("[send-push-action] FCM error:", fcmJson)
  }

  return { success: true, mode: "fcm" }
}
