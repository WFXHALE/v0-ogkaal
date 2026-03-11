// Firebase Cloud Messaging service worker
// Handles background push notifications

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js")
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js")

// Config is injected at registration time via the query string to avoid
// hardcoding keys in a public file (the SW URL includes the config as JSON)
let firebaseConfig = {}

self.addEventListener("message", (event) => {
  if (event.data?.type === "FIREBASE_CONFIG") {
    firebaseConfig = event.data.config
    firebase.initializeApp(firebaseConfig)
    firebase.messaging()
  }
})

// Handle background messages
self.addEventListener("push", (event) => {
  if (!event.data) return
  const data = event.data.json()
  const notification = data.notification || {}
  const options = {
    body:  notification.body  || "New notification from OG Kaal",
    icon:  notification.icon  || "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    data:  data.data || {},
    actions: [{ action: "open", title: "Open OG Kaal" }],
  }
  event.waitUntil(
    self.registration.showNotification(notification.title || "OG Kaal", options)
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = event.notification.data?.url || "/"
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === url && "focus" in client) return client.focus()
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
