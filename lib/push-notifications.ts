"use client"

import { getMessaging, getToken, onMessage } from "firebase/messaging"
import { getFirebaseApp } from "./firebase"
import { createClient } from "./supabase/client"

// Request notification permission and store FCM token for the logged-in user
export async function registerPushNotifications(userId: string): Promise<boolean> {
  try {
    if (typeof window === "undefined" || !("Notification" in window)) return false

    const permission = await Notification.requestPermission()
    if (permission !== "granted") return false

    const app = getFirebaseApp()
    if (!app) return false

    const messaging = getMessaging(app)
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: await navigator.serviceWorker.register("/firebase-messaging-sw.js"),
    })

    if (!token) return false

    // Upsert token into Supabase
    const supabase = createClient()
    await supabase.from("fcm_tokens").upsert(
      { user_id: userId, token, updated_at: new Date().toISOString() },
      { onConflict: "user_id,token" }
    )

    // Listen for foreground messages
    onMessage(messaging, (payload) => {
      const { title = "Notification", body = "" } = payload.notification ?? {}
      if (Notification.permission === "granted") {
        new Notification(title, { body, icon: "/og-icon.png" })
      }
    })

    return true
  } catch (err) {
    console.error("[push] registration failed:", err)
    return false
  }
}

// Remove FCM token on logout
export async function unregisterPushNotifications(userId: string): Promise<void> {
  try {
    const supabase = createClient()
    await supabase.from("fcm_tokens").delete().eq("user_id", userId)
  } catch (err) {
    console.error("[push] unregister failed:", err)
  }
}
