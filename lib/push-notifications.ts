"use client"

import { getMessaging, getToken, onMessage } from "firebase/messaging"
import { getFirebaseApp } from "./firebase"

// Register the current browser's FCM token through the authenticated server API.
export async function registerPushNotifications(_userId: string): Promise<boolean> {
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

    const response = await fetch("/api/dashboard/push-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
    if (!response.ok) return false

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

// Remove all push tokens belonging to the authenticated dashboard account.
export async function unregisterPushNotifications(_userId: string): Promise<void> {
  try {
    await fetch("/api/dashboard/push-token", { method: "DELETE" })
  } catch (err) {
    console.error("[push] unregister failed:", err)
  }
}
