// Firebase Cloud Messaging service worker
// Handles background push notifications

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js")
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js")
// Fetches Firebase config from our API route which has access to env vars
importScripts("/api/firebase-sw-config")

firebase.initializeApp(self.__FIREBASE_CONFIG__)

const messaging = firebase.messaging()

// Handle background (non-visible) push messages
messaging.onBackgroundMessage((payload) => {
  const { title = "OG Kaal", body = "You have a new notification." } = payload.notification ?? {}
  self.registration.showNotification(title, {
    body,
    icon:  "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    data:  payload.data ?? {},
    actions: [{ action: "open", title: "Open OG Kaal" }],
  })
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = event.notification.data?.url || "/"
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url === url && "focus" in client) return client.focus()
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
